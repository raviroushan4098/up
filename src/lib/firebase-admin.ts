import * as admin from "firebase-admin";

if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (privateKey && clientEmail && projectId) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      });
    } catch (err) {
      // Fail silently during initial load to prevent server crash
    }
  } else {
    // If running in environment with application default credentials, or just falling back
    try {
      admin.initializeApp({
        projectId: projectId || "upproject-a9200",
      });
    } catch (err) {
      // Fail silently
    }
  }
}

export const adminDb = admin.firestore();

/**
 * Helper to check if admin credentials are fully configured.
 */
export const isAdminConfigured = (): boolean => {
  return !!(
    process.env.FIREBASE_PRIVATE_KEY &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );
};
