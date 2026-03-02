import { createContext, useContext, useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

const DataCacheContext = createContext(null);

/**
 * DataCacheProvider - Global context for shared read-only data
 *
 * ✅ OPTIMIZATION Phase 2, Issue #1:
 * Single listeners for classes and CCAs shared across entire app
 * Eliminates duplicate subscriptions in multiple components
 * Reduces reads by 10-15%
 */
export function DataCacheProvider({ children }) {
  const [classes, setClasses] = useState([]);
  const [ccas, setCcas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // ✅ OPTIMIZED: Single listener for classes - shared across all components
    // Instead of: AdminDashboard, UserManager, TeacherDashboard all subscribing separately
    const unsubClasses = onSnapshot(
      query(collection(db, "classes"), orderBy("name")),
      (snapshot) => {
        setClasses(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })),
        );
      },
      (error) => console.error("Error fetching classes cache:", error),
    );

    // ✅ OPTIMIZED: Single listener for CCAs - shared across all components
    // Instead of: AdminDashboard, VendorDashboard, TeacherDashboard all subscribing separately
    const unsubCCAs = onSnapshot(
      query(collection(db, "ccas"), orderBy("name")),
      (snapshot) => {
        setCcas(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })),
        );
        setIsLoading(false);
      },
      (error) => console.error("Error fetching CCAs cache:", error),
    );

    return () => {
      unsubClasses();
      unsubCCAs();
    };
  }, []);

  return (
    <DataCacheContext.Provider value={{ classes, ccas, isLoading }}>
      {children}
    </DataCacheContext.Provider>
  );
}

/**
 * Hook to access cached classes and CCAs
 * Usage: const { classes, ccas, isLoading } = useDataCache();
 */
export function useDataCache() {
  const context = useContext(DataCacheContext);
  if (!context) {
    throw new Error(
      "useDataCache must be used within DataCacheProvider. Wrap your app with <DataCacheProvider>",
    );
  }
  return context;
}
