const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

console.log(typeof getFirestore);
try {
  admin.initializeApp({ projectId: 'test-project' });
  const db = getFirestore(admin.app(), 'my-database');
  console.log("DB initialized for my-database, databaseId:", db._settings?.databaseId || db.databaseId || db._databaseId?.database);
} catch (e) {
  console.error(e);
}
