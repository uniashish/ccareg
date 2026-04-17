import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { resolveRoleFromEmail } from "../utils/roleResolver";

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

      try {
        const userRef = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(userRef);

        let resolvedRole;

        if (!snap.exists()) {
          resolvedRole = resolveRoleFromEmail(firebaseUser.email);

          await setDoc(userRef, {
            email: firebaseUser.email,
            name: firebaseUser.displayName,
            role: resolvedRole,
            createdAt: new Date(),
          });
        } else {
          resolvedRole = snap.data().role;
        }

        // Set user and role together to avoid a render with user set but role null
        setUser(firebaseUser);
        setRole(resolvedRole);
      } catch (error) {
        console.error("Auth bootstrap failed:", error);
        setUser(null);
        setRole(null);
      } finally {
        setLoading(false);
      }
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
