import { useState, useEffect, useMemo } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot, // <--- CHANGED: Used for real-time updates
  doc,
  deleteDoc,
  addDoc,
  updateDoc,
  query,
  orderBy,
  writeBatch,
  increment,
  getDoc,
} from "firebase/firestore";

export function useAdminData() {
  // --- STATE ---
  const [ccas, setCcas] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Student Selections State
  const [selections, setSelections] = useState([]);
  const [users, setUsers] = useState({});

  // Modal States
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [isCCAModalOpen, setIsCCAModalOpen] = useState(false);
  const [editingCCA, setEditingCCA] = useState(null);
  const [viewingCCA, setViewingCCA] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState(null);

  // --- 1. REAL-TIME DATA LISTENERS ---
  useEffect(() => {
    setLoading(true);

    // A. Listen to Classes
    const unsubClasses = onSnapshot(
      query(collection(db, "classes"), orderBy("name")),
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setClassesList(list);
      },
      (error) => console.error("Error fetching classes:", error),
    );

    // B. Listen to CCAs (This fixes the seat count issue!)
    const unsubCCAs = onSnapshot(
      query(collection(db, "ccas"), orderBy("name")),
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCcas(list);
      },
      (error) => console.error("Error fetching CCAs:", error),
    );

    // C. Listen to Selections
    const unsubSelections = onSnapshot(
      collection(db, "selections"),
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSelections(list);
      },
      (error) => console.error("Error fetching selections:", error),
    );

    // D. Listen to Users (for names/emails)
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const userMap = {};
      snapshot.docs.forEach((doc) => {
        userMap[doc.id] = doc.data();
      });
      setUsers(userMap);
      setLoading(false); // Data is loaded
    });

    // Cleanup listeners on unmount
    return () => {
      unsubClasses();
      unsubCCAs();
      unsubSelections();
      unsubUsers();
    };
  }, []);

  // --- 2. ACTIONS ---

  const handleSaveClass = async (classData) => {
    try {
      if (editingClass) {
        await updateDoc(doc(db, "classes", editingClass.id), classData);
      } else {
        await addDoc(collection(db, "classes"), classData);
      }
      setIsClassModalOpen(false);
    } catch (error) {
      console.error("Error saving class:", error);
      alert("Failed to save class.");
    }
  };

  const handleDeleteClass = async (id) => {
    if (window.confirm("Delete this class?")) {
      try {
        await deleteDoc(doc(db, "classes", id));
      } catch (error) {
        console.error("Error deleting class:", error);
      }
    }
  };

  const handleSaveCCA = async (ccaData) => {
    try {
      // Ensure numbers are stored as numbers
      const formattedData = {
        ...ccaData,
        minSeats: Number(ccaData.minSeats),
        maxSeats: Number(ccaData.maxSeats),
      };

      if (editingCCA) {
        await updateDoc(doc(db, "ccas", editingCCA.id), formattedData);
      } else {
        await addDoc(collection(db, "ccas"), {
          ...formattedData,
          enrolledCount: 0, // Init count for new CCAs
        });
      }
      setIsCCAModalOpen(false);
    } catch (error) {
      console.error("Error saving CCA:", error);
      alert("Failed to save CCA.");
    }
  };

  const handleDeleteCCA = async (id) => {
    if (window.confirm("Delete this CCA?")) {
      try {
        await deleteDoc(doc(db, "ccas", id));
      } catch (error) {
        console.error("Error deleting CCA:", error);
      }
    }
  };

  // Helper for Maps
  const toggleCCAMap = async (classId, ccaId) => {
    const classDoc = classesList.find((c) => c.id === classId);
    if (!classDoc) return;

    const currentAllowed = classDoc.allowedCCAs || [];
    const isAllowed = currentAllowed.includes(ccaId);

    let newAllowed;
    if (isAllowed) {
      newAllowed = currentAllowed.filter((id) => id !== ccaId);
    } else {
      newAllowed = [...currentAllowed, ccaId];
    }

    try {
      await updateDoc(doc(db, "classes", classId), {
        allowedCCAs: newAllowed,
      });
    } catch (error) {
      console.error("Error updating mapping:", error);
    }
  };

  // Full Reset Logic (Wipe Student)
  const resetStudent = async (studentUid) => {
    if (
      !window.confirm(
        "This will remove all selections for this student. Continue?",
      )
    )
      return;

    try {
      const selRef = doc(db, "selections", studentUid);
      const selSnap = await getDoc(selRef);

      if (!selSnap.exists()) {
        alert("Selection not found.");
        return;
      }

      const data = selSnap.data();
      const batch = writeBatch(db);

      // 1. Delete Selection
      batch.delete(selRef);

      // 2. Return Seats
      if (data.selectedCCAs && Array.isArray(data.selectedCCAs)) {
        data.selectedCCAs.forEach((cca) => {
          const ccaRef = doc(db, "ccas", cca.id);
          batch.update(ccaRef, { enrolledCount: increment(-1) });
        });
      }

      await batch.commit();
      // No need to manually update state, the listeners above will do it!
    } catch (err) {
      console.error("Error resetting student:", err);
      alert("Error: " + err.message);
    }
  };

  const classesMap = useMemo(() => {
    return classesList.reduce((acc, cls) => {
      acc[cls.id] = cls;
      return acc;
    }, {});
  }, [classesList]);

  return {
    ccas,
    classesList,
    loading,
    selections,
    users,
    classes: classesMap,

    // Modal States & Setters
    isClassModalOpen,
    setIsClassModalOpen,
    editingClass,
    setEditingClass,
    isCCAModalOpen,
    setIsCCAModalOpen,
    editingCCA,
    setEditingCCA,
    viewingCCA,
    setViewingCCA,
    selectedClassId,
    setSelectedClassId,

    // Actions
    handleSaveClass,
    handleDeleteClass,
    handleSaveCCA,
    handleDeleteCCA,
    toggleCCAMap,
    resetStudent,
  };
}
