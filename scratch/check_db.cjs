const { initializeApp } = require("firebase/app");
const { getFirestore, doc, setDoc, serverTimestamp } = require("firebase/firestore");
// require("dotenv").config(); // Load environment variables from .env

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testWrite(collectionName, docId) {
  console.log(`Testing write to ${collectionName}/${docId}...`);
  try {
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, {
      count: 1,
      date: "2026-06-23",
      lastSentAt: serverTimestamp(),
    });
    console.log(`✅ Success: Written to ${collectionName}/${docId}`);
  } catch (error) {
    console.error(`❌ Failed write to ${collectionName}/${docId}:`, error.message);
  }
}

async function run() {
  await testWrite("otp_limits", "test_phone_number");
  await testWrite("ip_limits", "test_ip_hash");
  await testWrite("device_limits", "test_device_key");
  process.exit(0);
}

run();
