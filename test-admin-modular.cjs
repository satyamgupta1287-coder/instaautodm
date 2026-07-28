const { initializeApp, getApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const app = initializeApp({ projectId: 'test' });
const db1 = getFirestore('my-db');
console.log("db1:", db1._settings?.databaseId);
const db2 = getFirestore(app, 'my-db2');
console.log("db2:", db2._settings?.databaseId);
