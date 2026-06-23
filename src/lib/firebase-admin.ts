import * as admin from "firebase-admin";

let dbInstance: admin.firestore.Firestore | null = null;

/**
 * Lazily initialize and retrieve the Firestore Admin instance.
 * This prevents build-time failures when environment variables are not yet available.
 */
export const getAdminDb = (): admin.firestore.Firestore => {
  if (!dbInstance) {
    if (!admin.apps.length) {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

      if (privateKey && clientEmail && projectId) {
        // Strip surrounding quotes if present
        let cleanKey = privateKey.trim();
        if (cleanKey.startsWith('"') && cleanKey.endsWith('"')) {
          cleanKey = cleanKey.substring(1, cleanKey.length - 1);
        }
        if (cleanKey.startsWith("'") && cleanKey.endsWith("'")) {
          cleanKey = cleanKey.substring(1, cleanKey.length - 1);
        }

        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey: cleanKey.replace(/\\n/g, "\n"),
          }),
          databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
        });
      } else {
        // Safe placeholder fallback for static page generation/build context
        admin.initializeApp({
          projectId: projectId || "upproject-a9200",
        });
      }
    }
    dbInstance = admin.firestore();
  }
  return dbInstance;
};

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
