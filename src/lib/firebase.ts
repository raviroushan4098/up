import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase for SSR compatibility
if (typeof window !== "undefined" && !process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  console.warn(
    "Firebase Config Warning: NEXT_PUBLIC_FIREBASE_API_KEY is undefined. " +
      "If you recently created or updated the .env file, please restart your " +
      "development server so Next.js can load it.",
  );
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ─── Firebase App Check ───────────────────────────────────────────────
// Protects Firestore, Auth, and Storage from unauthorized access.
// Uses reCAPTCHA Enterprise for web attestation.
// Only initializes on the client side (not during SSR/build).
if (typeof window !== "undefined") {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (siteKey) {
    // Enable debug token for localhost development
    if (process.env.NODE_ENV === "development") {
      // @ts-expect-error — Firebase reads this global to enable debug mode
      self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }

    try {
      initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(siteKey),
        isTokenAutoRefreshEnabled: true,
      });
    } catch (error) {
      console.error("Firebase App Check initialization failed:", error);
    }
  } else {
    console.warn(
      "Firebase App Check skipped: NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not defined in the environment.",
    );
  }
}

export { app, auth, db, storage };
