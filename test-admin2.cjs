const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

try {
  const app = admin.initializeApp({ projectId: 'test-project' });
  const db = getFirestore(app, 'ai-studio-instaautodm-39d59546-5474-4670-bcaa-a3bcc1ca517d');
  console.log("DB keys:", Object.keys(db).join(', '));
  console.log("DB Settings:", db._settings);
} catch (e) {
  console.error(e);
}
