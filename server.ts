import express from "express";
import path from "path";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Helper to initialize and get the specific named Firestore DB
function getDb() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Ensure private key newlines are handled correctly from env vars
        privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n") : undefined,
      }),
    });
  }
  return getFirestore("ai-studio-instaautodm-39d59546-5474-4670-bcaa-a3bcc1ca517d");
}

const app = express();
app.use(express.json());

// API routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Instagram Webhook Endpoint
app.post("/api/webhooks/instagram", async (req, res) => {
  try {
    const body = req.body;
    console.log("Webhook received:", JSON.stringify(body, null, 2));

    if (body.object === "instagram") {
      const db = getDb();
      for (const entry of body.entry) {
        const accountId = entry.id;
        for (const change of entry.changes) {
          if (change.field === "comments") {
            const commentValue = change.value;
            const commentText = commentValue.text;
            const commentId = commentValue.id;
            const fromUsername = commentValue.from?.username || "unknown";

            console.log(`New comment from ${fromUsername}: ${commentText}`);

            const rulesSnapshot = await db.collection("rules")
              .where("isActive", "==", true)
              .where("accountId", "==", accountId)
              .get();

            let matchedRule = null;
            for (const doc of rulesSnapshot.docs) {
              const rule = doc.data();
              const matchesExact = rule.matchType === 'exact' && commentText.trim().toLowerCase() === rule.keyword.toLowerCase();
              const matchesContains = rule.matchType === 'contains' && commentText.toLowerCase().includes(rule.keyword.toLowerCase());
              
              if (matchesExact || matchesContains) {
                matchedRule = { id: doc.id, ...rule };
                break;
              }
            }

            if (matchedRule) {
              console.log(`Matched rule: ${matchedRule.name}`);
              
              await db.collection("logs").add({
                ruleId: matchedRule.id,
                accountId,
                commentId,
                username: fromUsername,
                commentText: commentText,
                templateSent: matchedRule.template,
                status: "sent",
                timestamp: FieldValue.serverTimestamp()
              });
            }
          }
        }
      }
      res.status(200).send("EVENT_RECEIVED");
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.sendStatus(500);
  }
});

app.get("/api/webhooks/instagram", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  const VERIFY_TOKEN = process.env.INSTAGRAM_VERIFY_TOKEN || "test_token";

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

// Step 1: redirect user to Instagram's OAuth authorize page
app.get("/api/instagram-auth", (req, res) => {
  const uid = req.query.uid as string;
  if (!uid) return res.status(400).send("Missing uid");
  const redirectUri = `${process.env.APP_URL}/api/instagram-callback`;
  const scope = "instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_content_publish,instagram_business_manage_insights";
  const authUrl = `https://www.instagram.com/oauth/authorize?client_id=${process.env.META_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${uid}`;
  res.redirect(authUrl);
});

// Step 2: Instagram redirects back with ?code=...&state=<firebase uid>
app.get("/api/instagram-callback", async (req, res) => {
  const { code, state, error } = req.query as { code?: string; state?: string; error?: string };
  const uid = state;
  if (error || !code || !uid) {
    console.error("OAuth callback error/missing params:", { error, code: !!code, uid });
    return res.redirect(`/?connect=error`);
  }

  try {
    const redirectUri = `${process.env.APP_URL}/api/instagram-callback`;
    const tokenForm = new URLSearchParams({
      client_id: process.env.META_CLIENT_ID || "",
      client_secret: process.env.META_CLIENT_SECRET || "",
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code,
    });

    // Step A: code -> short-lived token
    const shortRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      body: tokenForm,
    });
    const shortData = await shortRes.json();
    console.log("Short-lived token response:", JSON.stringify(shortData));
    if (!shortRes.ok) throw new Error("Short-token exchange failed: " + JSON.stringify(shortData));

    const { access_token: shortToken, user_id: igUserId } = shortData;
    if (!shortToken || !igUserId) {
      throw new Error("Short-token response missing access_token/user_id: " + JSON.stringify(shortData));
    }
    
    console.log("STEP A DONE");

    // Step B: short-lived -> long-lived token
    const longUrl = `https://graph.instagram.com/v21.0/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(process.env.META_CLIENT_SECRET || "")}&access_token=${encodeURIComponent(shortToken)}`;
    console.log("Requesting long-lived token...");
    const longRes = await fetch(longUrl);
    const longData = await longRes.json();
    console.log("Long-lived token response:", JSON.stringify(longData));
    if (!longRes.ok) throw new Error("Long-token exchange failed: " + JSON.stringify(longData));
    
    console.log("STEP B DONE");

    // Step C: fetch IG username
    const profileRes = await fetch(
      `https://graph.instagram.com/v21.0/${igUserId}?fields=username&access_token=${encodeURIComponent(longData.access_token)}`
    );
    const profileData = await profileRes.json();
    console.log("Profile response:", JSON.stringify(profileData));
    
    console.log("STEP C DONE");

    // Step D: save to Firestore
    try {
      const db = getDb();
      await db.collection("accounts").doc(String(igUserId)).set({
        uid,
        igUserId: String(igUserId),
        username: profileData.username || null,
        accessToken: longData.access_token,
        tokenExpiresIn: longData.expires_in,
        connectedAt: FieldValue.serverTimestamp(),
      });
      console.log("STEP D DONE - wrote doc " + igUserId + " to Firestore");
    } catch (firestoreError) {
      console.error("Firestore write failed:", firestoreError);
      throw firestoreError;
    }

    res.redirect(`/?connect=success`);
  } catch (err) {
    console.error("Instagram OAuth callback error:", err);
    res.redirect(`/?connect=error`);
  }
});

// Only start the server locally if not on Vercel
if (!process.env.VERCEL) {
  import('vite').then(async ({ createServer: createViteServer }) => {
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(3000, "0.0.0.0", () => {
      console.log(`Server running on http://0.0.0.0:3000`);
    });
  }).catch(err => {
    console.error("Failed to load Vite", err);
    app.listen(3000, "0.0.0.0", () => {
      console.log(`Server running on http://0.0.0.0:3000 (without Vite)`);
    });
  });
}

export default app;
