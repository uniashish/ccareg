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
import { enrichCCAsWithTeacherAlias } from "../utils/teacherAlias";

export function useAdminData(showMessage = () => {}) {
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
      showMessage({
        type: "error",
        title: "Save Failed",
        message: "Failed to save class.",
      });
    }
  };

  const handleDeleteClass = async (id) => {
    const classDoc = classesList.find((cls) => cls.id === id);
    if (!classDoc) return;

    const hasSelectionsInClass = selections.some((selection) => {
      if (selection.classId !== id) return false;
      return (
        Array.isArray(selection.selectedCCAs) &&
        selection.selectedCCAs.length > 0
      );
    });

    const hasAssociatedCCAs =
      Array.isArray(classDoc.allowedCCAs) && classDoc.allowedCCAs.length > 0;

    if (hasSelectionsInClass || hasAssociatedCCAs) {
      const reasons = [];
      if (hasSelectionsInClass) {
        reasons.push(
          "students in this class have already submitted selections",
        );
      }
      if (hasAssociatedCCAs) {
        reasons.push("the class still has CCAs associated with it");
      }

      showMessage({
        type: "info",
        title: "Cannot Delete Class",
        message: `${classDoc.name} cannot be deleted because ${reasons.join(" and ")}.`,
      });
      return;
    }

    if (window.confirm("Delete this class?")) {
      try {
        await deleteDoc(doc(db, "classes", id));
      } catch (error) {
        console.error("Error deleting class:", error);
        showMessage({
          type: "error",
          title: "Delete Failed",
          message: "Failed to delete class.",
        });
      }
    }
  };

  const handleSaveCCA = async (ccaData) => {
    try {
      const enrolledCount = Number(editingCCA?.enrolledCount || 0);
      const parsedMaxSeats = Number(ccaData.maxSeats);

      if (
        editingCCA &&
        ccaData.maxSeats !== "" &&
        parsedMaxSeats > 0 &&
        parsedMaxSeats < enrolledCount
      ) {
        showMessage({
          type: "error",
          title: "Invalid Capacity",
          message: `Max seats cannot be less than occupied seats (${enrolledCount}).`,
        });
        return;
      }

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
      showMessage({
        type: "error",
        title: "Save Failed",
        message: "Failed to save CCA.",
      });
    }
  };

  const handleDeleteCCA = async (id) => {
    const ccaDoc = ccas.find((cca) => cca.id === id);
    if (!ccaDoc) return;

    const assignedClasses = classesList.filter((cls) =>
      Array.isArray(cls.allowedCCAs) ? cls.allowedCCAs.includes(id) : false,
    );

    if (assignedClasses.length > 0) {
      const classNames = assignedClasses
        .map((cls) => cls.name)
        .filter(Boolean)
        .join(", ");

      showMessage({
        type: "error",
        title: "Cannot Delete CCA",
        message: `${ccaDoc.name || "This CCA"} cannot be deleted because it is assigned to class${assignedClasses.length > 1 ? "es" : ""}: ${classNames}. Remove the assignment first.`,
      });
      return;
    }

    if (window.confirm("Delete this CCA?")) {
      try {
        await deleteDoc(doc(db, "ccas", id));
      } catch (error) {
        console.error("Error deleting CCA:", error);
        showMessage({
          type: "error",
          title: "Delete Failed",
          message: "Failed to delete CCA.",
        });
      }
    }
  };

  // Helper for Maps
  const toggleCCAMap = async (classId, ccaId) => {
    const classDoc = classesList.find((c) => c.id === classId);
    if (!classDoc) return;

    const currentAllowed = classDoc.allowedCCAs || [];
    const isAllowed = currentAllowed.includes(ccaId);

    if (isAllowed) {
      const hasSelectionsInClass = selections.some((selection) => {
        if (selection.classId !== classId) return false;
        return (
          Array.isArray(selection.selectedCCAs) &&
          selection.selectedCCAs.some((cca) => cca.id === ccaId)
        );
      });

      if (hasSelectionsInClass) {
        const className = classDoc.name || "this class";
        const ccaName =
          ccas.find((cca) => cca.id === ccaId)?.name || "this CCA";

        showMessage({
          type: "info",
          title: "Cannot Unassign",
          message: `${ccaName} cannot be removed from ${className} because students have already selected it.`,
        });
        return;
      }
    }

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
  const resetStudent = async (studentUid, skipConfirm = false) => {
    if (
      !skipConfirm &&
      !window.confirm(
        "This will remove all selections for this student. Continue?",
      )
    )
      return false;

    try {
      const selRef = doc(db, "selections", studentUid);
      const selSnap = await getDoc(selRef);

      if (!selSnap.exists()) {
        showMessage({
          type: "info",
          title: "Not Found",
          message: "Selection not found.",
        });
        return false;
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
      return true;
    } catch (err) {
      console.error("Error resetting student:", err);
      showMessage({
        type: "error",
        title: "Reset Failed",
        message: `Error: ${err.message}`,
      });
      return false;
    }
  };

  const classesMap = useMemo(() => {
    return classesList.reduce((acc, cls) => {
      acc[cls.id] = cls;
      return acc;
    }, {});
  }, [classesList]);

  const ccasWithTeacherAlias = useMemo(
    () => enrichCCAsWithTeacherAlias(ccas, users),
    [ccas, users],
  );

  return {
    ccas: ccasWithTeacherAlias,
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
