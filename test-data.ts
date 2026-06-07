import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query, where } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "upproject-a9200",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const eventsSnap = await getDocs(query(collection(db, "events"), limit(1)));
  if (!eventsSnap.empty) console.log("Event:", eventsSnap.docs[0].data());

  const appsSnap = await getDocs(query(collection(db, "applications"), limit(1)));
  if (!appsSnap.empty) console.log("Application:", appsSnap.docs[0].data());
}
check();
