const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, query, orderBy, limit } = require("firebase/firestore");

// Need the firebase config to initialize
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

async function check() {
  const snap = await getDocs(collection(db, "events"));
  snap.forEach((doc) => {
    const data = doc.data();
    if (data.dynamicSections && data.dynamicSections.length > 0) {
      console.log("Found event with dynamicSections:", doc.id);
      console.log(JSON.stringify(data.dynamicSections, null, 2));
    }
  });
  console.log("Done");
  process.exit(0);
}

check().catch(console.error);
