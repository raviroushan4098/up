const { initializeApp } = require("firebase/app");
const { getFirestore, doc, deleteDoc } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "dummy",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "upproject-a9200.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "upproject-a9200",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testDeletion() {
  console.log("Attempting client-side deletion of users/test_user...");
  try {
    const docRef = doc(db, "users", "test_user");
    await deleteDoc(docRef);
    console.log("❌ FAILURE: Client was able to delete user document! This is insecure.");
  } catch (error) {
    if (error.message.includes("permission-denied") || error.code === "permission-denied") {
      console.log(
        "✅ SUCCESS: Client-side deletion correctly blocked by Firestore Rules (Permission Denied).",
      );
    } else {
      console.error("❌ Unexpected error:", error.message);
    }
  }
}

testDeletion();
