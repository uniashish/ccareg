import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export async function getUserProfile(uid) {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  return snap.exists() ? snap.data() : null;
}
