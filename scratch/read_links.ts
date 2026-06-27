import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  projectId: "upproject-a9200",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  try {
    const c = await getDocs(collection(db, "dynamic_links"));
    console.log("Dynamic Links count:", c.size);
    c.forEach((d) => {
      console.log(d.id, "=>", d.data());
    });
  } catch (err: any) {
    console.error("Error reading dynamic links:", err.message);
  }
}
check();
