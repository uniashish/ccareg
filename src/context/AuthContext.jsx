import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);

      const userRef = doc(db, "users", firebaseUser.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        // --- ROLE ASSIGNMENT LOGIC ---
        const email = firebaseUser.email || "";

        // Regex: Check if starts with 2 digits
        const isStudentEmail = /^\d{2}/.test(email);

        const initialRole = isStudentEmail ? "student" : "teacher";
        // -----------------------------

        await setDoc(userRef, {
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          role: initialRole,
          createdAt: new Date(),
        });
        setRole(initialRole);
      } else {
        setRole(snap.data().role);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
