import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "upproject-a9200",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const c = await getDoc(doc(db, "counters", "global"));
  console.log("Global counter:", c.data());
}
check();
