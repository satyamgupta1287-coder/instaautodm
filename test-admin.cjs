const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

try {
  admin.initializeApp({ projectId: 'test-project' });
  const db = getFirestore(admin.app(), 'my-database');
  console.log("DB initialized for my-database, databaseId:", db.databaseId || db._settings?.databaseId);
} catch (e) {
  console.error(e);
}
