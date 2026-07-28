import express from "express";
import admin from "firebase-admin";

// Lazy-init Firebase Admin — only called when a route actually needs Firestore,
// so the GET verification route below never waits on it / never crashes on it.
function getDb() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }
  return admin.firestore();
}

const app = express();
app.use(express.json());

// API routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Instagram Webhook Endpoint (POST)
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
            const fromUsername = commentValue.from.username;

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
              
              // 3. Log the event to Firestore
              await db.collection("logs").add({
                ruleId: matchedRule.id,
                accountId,
                commentId,
                username: fromUsername,
                commentText: commentText,
                templateSent: matchedRule.template,
                status: "sent",
                timestamp: admin.firestore.FieldValue.serverTimestamp()
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

// Step 1: "Connect Account" button hits this — redirects to Instagram's authorization page
app.get("/api/instagram-auth", (req, res) => {
  const uid = req.query.uid as string;
  if (!uid) return res.status(400).send("Missing uid");

  const redirectUri = `${process.env.APP_URL}/api/instagram-callback`;
  const scope = [
    "instagram_business_basic",
    "instagram_business_manage_messages",
    "instagram_business_manage_comments",
    "instagram_business_content_publish",
    "instagram_business_manage_insights",
  ].join(",");

  const authUrl = `https://www.instagram.com/oauth/authorize?client_id=${process.env.META_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${uid}`;

  res.redirect(authUrl);
});

// Step 2: Instagram redirects back here with a ?code= after the user approves
app.get("/api/instagram-callback", async (req, res) => {
  const { code, state, error } = req.query as { code?: string; state?: string; error?: string };
  const uid = state;

  if (error || !code || !uid) {
    return res.redirect(`/dashboard?connect=error`);
  }

  try {
    const redirectUri = `${process.env.APP_URL}/api/instagram-callback`;

    // Exchange code -> short-lived token
    const tokenForm = new URLSearchParams({
      client_id: process.env.META_CLIENT_ID || "",
      client_secret: process.env.META_CLIENT_SECRET || "",
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code,
    });

    const shortRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      body: tokenForm,
    });
    const shortData = await shortRes.json();
    if (!shortRes.ok) throw new Error(JSON.stringify(shortData));

    const { access_token: shortToken, user_id: igUserId } = shortData;

    // Exchange short-lived -> long-lived token (60 days)
    const longRes = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.META_CLIENT_SECRET}&access_token=${shortToken}`
    );
    const longData = await longRes.json();
    if (!longRes.ok) throw new Error(JSON.stringify(longData));

    // Fetch the connected Instagram username
    const profileRes = await fetch(
      `https://graph.instagram.com/v21.0/${igUserId}?fields=username&access_token=${longData.access_token}`
    );
    const profileData = await profileRes.json();

    const db = getDb();
    await db.collection("accounts").doc(String(igUserId)).set({
      uid,
      igUserId: String(igUserId),
      username: profileData.username || null,
      accessToken: longData.access_token,
      tokenExpiresIn: longData.expires_in,
      connectedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.redirect(`/dashboard?connect=success`);
  } catch (err) {
    console.error("Instagram OAuth callback error:", err);
    res.redirect(`/dashboard?connect=error`);
  }
});

// Instagram Webhook Endpoint (GET - For Meta Verification)
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

// अगर ऐप Vercel पर नहीं है (मतलब लोकली चल रहा है), तो पोर्ट 3000 चालू करें
if (!process.env.VERCEL) {
  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

// Vercel के लिए Export
export default app;
