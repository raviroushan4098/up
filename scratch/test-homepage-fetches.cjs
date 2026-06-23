const fs = require("fs");
const path = require("path");

// Manually parse .env file
try {
  const envPath = path.resolve(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, "utf-8");
    envConfig.split("\n").forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || "";
        // Remove surrounding quotes if present
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value;
      }
    });
  }
} catch (e) {
  console.error("Failed to load .env manually:", e);
}

const { initializeApp } = require("firebase/app");
const { getFirestore, doc, getDoc, collection, query, orderBy, getDocs } = require("firebase/firestore");

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

async function testFetch(name, fn) {
  try {
    await fn();
    console.log(`✅ Success: ${name}`);
  } catch (error) {
    console.error(`❌ Failed ${name}:`, error.message);
  }
}

async function run() {
  console.log("Firebase initialized with project:", firebaseConfig.projectId);
  
  await testFetch("1. settings/landingPage doc", async () => {
    const docRef = doc(db, "settings", "landingPage");
    await getDoc(docRef);
  });

  await testFetch("2. events collection query", async () => {
    const eventsRef = collection(db, "events");
    const qEvents = query(eventsRef, orderBy("createdAt", "desc"));
    await getDocs(qEvents);
  });

  await testFetch("3. counters/global doc", async () => {
    const globalStatsRef = doc(db, "counters", "global");
    await getDoc(globalStatsRef);
  });

  process.exit(0);
}

run();
