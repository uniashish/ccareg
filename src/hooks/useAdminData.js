import { useState, useEffect, useMemo } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  getDoc, // <--- ADDED
  deleteDoc,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  increment, // <--- ADDED
  writeBatch, // <--- ADDED
} from "firebase/firestore";

export function useAdminData() {
  // --- EXISTING STATE (Classes & CCAs Management) ---
  const [ccas, setCcas] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- NEW STATE (Student Selections Dashboard) ---
  const [selections, setSelections] = useState([]);
  const [users, setUsers] = useState({}); // Map: { uid: userData }

  // --- EXISTING MODAL STATES ---
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [isCCAModalOpen, setIsCCAModalOpen] = useState(false);
  const [editingCCA, setEditingCCA] = useState(null);
  const [viewingCCA, setViewingCCA] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState(null);

  // --- 1. EXISTING FETCH LOGIC (One-time fetch for Admin Table) ---
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (classesList.length === 0) setLoading(true);

    try {
      const ccaSnap = await getDocs(collection(db, "ccas"));
      const classSnap = await getDocs(collection(db, "classes"));

      setCcas(ccaSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setClassesList(classSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Error fetching admin data:", error);
    }
    setLoading(false);
  };

  // --- 2. NEW REAL-TIME LOGIC (For Master List Dashboard) ---
  useEffect(() => {
    // A. Live Users List (Mapped by ID for easy lookup)
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      const userMap = {};
      snap.forEach((doc) => {
        userMap[doc.id] = doc.data();
      });
      setUsers(userMap);
    });

    // B. Live Selections List (Ordered by newest first)
    const q = query(collection(db, "selections"), orderBy("timestamp", "desc"));
    const unsubSelections = onSnapshot(q, (snap) => {
      setSelections(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubUsers();
      unsubSelections();
    };
  }, []);

  // --- HELPER: Transform Classes Array to Map for Dashboard ---
  const classesMap = useMemo(() => {
    return classesList.reduce((acc, curr) => {
      acc[curr.id] = curr;
      return acc;
    }, {});
  }, [classesList]);

  // --- HANDLERS (Classes) ---
  const handleSaveClass = async (classData) => {
    if (editingClass) {
      const docRef = doc(db, "classes", editingClass.id);
      await updateDoc(docRef, classData);
    } else {
      await addDoc(collection(db, "classes"), classData);
    }
    fetchData();
  };

  const handleDeleteClass = async (id) => {
    if (window.confirm("Are you sure?")) {
      await deleteDoc(doc(db, "classes", id));
      fetchData();
    }
  };

  // --- HANDLERS (CCAs) ---
  const handleSaveCCA = async (ccaData) => {
    if (editingCCA) {
      const docRef = doc(db, "ccas", editingCCA.id);
      await updateDoc(docRef, ccaData);
    } else {
      await addDoc(collection(db, "ccas"), ccaData);
    }
    fetchData();
  };

  const handleDeleteCCA = async (id) => {
    if (window.confirm("Delete this CCA?")) {
      await deleteDoc(doc(db, "ccas", id));
      fetchData();
    }
  };

  // --- HANDLERS (Mapping) ---
  const toggleCCAMap = async (ccaId) => {
    const targetClass = classesList.find((c) => c.id === selectedClassId);
    if (!targetClass) return;

    let newMapping = targetClass.allowedCCAs || [];
    if (newMapping.includes(ccaId)) {
      newMapping = newMapping.filter((id) => id !== ccaId);
    } else {
      newMapping = [...newMapping, ccaId];
    }

    const docRef = doc(db, "classes", selectedClassId);
    await updateDoc(docRef, { allowedCCAs: newMapping });
    fetchData();
  };

  // --- NEW HANDLER: Reset Student (With Seat Restoration) ---
  const resetStudent = async (studentUid) => {
    if (
      !window.confirm(
        "Delete this selection? This will free up the seats for other students.",
      )
    )
      return;

    try {
      // 1. Get the selection to see which CCAs they had
      const selRef = doc(db, "selections", studentUid);
      const selSnap = await getDoc(selRef);

      if (!selSnap.exists()) {
        alert("Selection not found.");
        return;
      }

      const data = selSnap.data();

      // 2. Create Batch: Delete Selection + Decrement CCA Counts
      const batch = writeBatch(db);

      // A. Delete the selection document
      batch.delete(selRef);

      // B. Decrement 'enrolledCount' for each selected CCA
      if (data.selectedCCAs && Array.isArray(data.selectedCCAs)) {
        data.selectedCCAs.forEach((cca) => {
          const ccaRef = doc(db, "ccas", cca.id);
          // increment(-1) effectively subtracts 1 atomically
          batch.update(ccaRef, { enrolledCount: increment(-1) });
        });
      }

      await batch.commit();
    } catch (err) {
      console.error("Error resetting student:", err);
      alert("Error: " + err.message);
    }
  };

  return {
    // Data
    ccas,
    classesList,
    loading,
    selections,
    users,
    classes: classesMap,

    // States
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

    // Functions
    handleSaveClass,
    handleDeleteClass,
    handleSaveCCA,
    handleDeleteCCA,
    toggleCCAMap,
    resetStudent, // Updated function
  };
}
