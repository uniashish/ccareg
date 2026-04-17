import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { resolveRoleFromEmail } from "../utils/roleResolver";

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
    const initialRole = resolveRoleFromEmail(user.email);

    console.log(`Creating user ${user.email} as ${initialRole}`); // Debugging log

    await setDoc(userRef, {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      role: initialRole,
      createdAt: serverTimestamp(),
    });
  }
}
