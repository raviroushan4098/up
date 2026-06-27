const admin = require("firebase-admin");
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

const privateKey = process.env.FIREBASE_PRIVATE_KEY;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey: privateKey.trim().replace(/\\n/g, "\n"),
    }),
  });
}

const db = admin.firestore();

async function run() {
  try {
    console.log("Checking dynamic_links via Admin SDK...");
    const snap = await db.collection("dynamic_links").get();
    console.log("Total dynamic links:", snap.size);
    snap.forEach((doc) => {
      console.log(`- ID: ${doc.id}`);
      console.log(`  Name: ${doc.data().name}`);
      console.log(`  Target: ${doc.data().targetUrl}`);
      console.log(`  Clicks: ${doc.data().clicks}`);
    });
  } catch (error) {
    console.error("❌ Admin SDK Error:", error);
  }
  process.exit(0);
}

run();
