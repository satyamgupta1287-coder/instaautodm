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
