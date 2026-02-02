import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";

const ccasRef = collection(db, "ccas");

export async function createCCA(data) {
  return await addDoc(ccasRef, {
    ...data,
    currentSeats: data.isUnlimited ? 0 : 0,
  });
}

export async function updateCCA(id, data) {
  const ccaRef = doc(db, "ccas", id);
  return await updateDoc(ccaRef, data);
}

export async function getAllCCAs() {
  const snapshot = await getDocs(ccasRef);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}
