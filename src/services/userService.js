import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export async function createUserIfNotExists(user) {
  if (!user) return;

  if (!user.email.endsWith("@sis-kg.org")) {
    console.warn("❌ Blocked non-sis email:", user.email);
    return;
  }

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      role: "student",
      createdAt: serverTimestamp(),
    });
  }
}
