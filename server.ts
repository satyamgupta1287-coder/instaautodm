import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import admin from "firebase-admin";

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
  });
}

const db = admin.firestore();

async function startServer() {
  const app = express();
  const PORT = 3000;

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

      // Check if this is an Instagram event
      if (body.object === "instagram") {
        // Iterate over each entry
        for (const entry of body.entry) {
          const accountId = entry.id;
          
          for (const change of entry.changes) {
            if (change.field === "comments") {
              const commentValue = change.value;
              const commentText = commentValue.text;
              const commentId = commentValue.id;
              const fromUserId = commentValue.from.id;
              const fromUsername = commentValue.from.username;
              const mediaId = commentValue.media.id;

              console.log(`New comment from ${fromUsername}: ${commentText}`);

              // 1. Fetch rules for this account from Firestore
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
                  break; // Stop at first matched rule
                }
              }

              if (matchedRule) {
                console.log(`Matched rule: ${matchedRule.name}`);
                
                // 2. Send DM using Instagram Graph API
                // In a real application, you would make an API call to Meta here:
                /*
                await fetch(`https://graph.facebook.com/v19.0/${accountId}/messages`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${process.env.META_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    recipient: { comment_id: commentId },
                    message: { text: matchedRule.template }
                  })
                });
                */

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

  // Vite middleware for development
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
