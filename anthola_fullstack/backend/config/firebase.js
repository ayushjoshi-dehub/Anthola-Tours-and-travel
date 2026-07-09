
const admin = require('firebase-admin');

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('[firebase] Admin initialized via service account credentials.');
  } else if (process.env.FIREBASE_PROJECT_ID) {
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID
    });
    console.log('[firebase] Admin initialized via project ID fallback.');
  } else {
    console.warn('[firebase] Warning: Neither FIREBASE_SERVICE_ACCOUNT nor FIREBASE_PROJECT_ID is defined in .env.');
    admin.initializeApp();
  }
} catch (err) {
  console.error('[firebase] Admin initialization error:', err.message);
}

module.exports = admin;
