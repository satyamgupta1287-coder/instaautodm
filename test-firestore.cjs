const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
admin.initializeApp({ projectId: 'test' });
const db1 = getFirestore('my-db');
console.log(db1.databaseId || db1._settings?.databaseId);
const db2 = getFirestore(admin.apps[0], 'my-db2');
console.log(db2.databaseId || db2._settings?.databaseId);
