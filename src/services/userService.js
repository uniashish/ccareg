import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export async function createUserIfNotExists(user) {
  if (!user) return;

  // 1. Validate Domain
  if (!user.email.endsWith("@sis-kg.org")) {
    console.warn("❌ Blocked non-sis email:", user.email);
    return;
  }

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  // 2. Create User ONLY if it doesn't exist
  if (!userSnap.exists()) {
    const email = user.email || "";

    // Check if email starts with 2 digits (e.g., 30athaarva...)
    const isStudentEmail = /^\d{2}/.test(email);

    // Assign role accordingly
    const initialRole = isStudentEmail ? "student" : "teacher";

    console.log(`Creating user ${email} as ${initialRole}`); // Debugging log

    await setDoc(userRef, {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      role: initialRole,
      createdAt: serverTimestamp(),
    });
  }
}
