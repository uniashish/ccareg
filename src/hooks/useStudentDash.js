import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

export function useStudentDash() {
  const { currentUser } = useAuth();

  // --- DATA STATE ---
  const [classes, setClasses] = useState([]);
  const [ccas, setCCAs] = useState([]);

  // --- SELECTION STATE ---
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedCCAs, setSelectedCCAs] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- SUBMISSION STATE ---
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [existingSelection, setExistingSelection] = useState(null);

  // --- NEW: MODAL STATE (To replace alerts) ---
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: "info", // "success" | "error" | "info"
    title: "",
    message: "",
  });

  // Helper to close the modal
  const closeModal = () => {
    setModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

  // Helper to show the modal (internal use)
  const showModal = (type, title, message) => {
    setModalConfig({
      isOpen: true,
      type,
      title,
      message,
    });
  };

  // 1. DATA LISTENERS (Classes & CCAs)
  useEffect(() => {
    const unsubClasses = onSnapshot(collection(db, "classes"), (snapshot) => {
      setClasses(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    const unsubCCAs = onSnapshot(collection(db, "ccas"), (snapshot) => {
      setCCAs(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => {
      unsubClasses();
      unsubCCAs();
    };
  }, []);

  // 2. CHECK EXISTING SELECTION
  useEffect(() => {
    const userToCheck = currentUser || auth.currentUser;

    if (userToCheck) {
      const checkHistory = async () => {
        try {
          const docRef = doc(db, "selections", userToCheck.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setExistingSelection(docSnap.data());
            setHasSubmitted(true);
          }
        } catch (error) {
          console.error("Error fetching history:", error);
        }
      };
      checkHistory();
    }
  }, [currentUser]);

  // 3. ACTIONS
  const toggleCCA = (cca) => {
    // If already selected, remove it
    if (selectedCCAs.find((item) => item.id === cca.id)) {
      setSelectedCCAs(selectedCCAs.filter((item) => item.id !== cca.id));
      return;
    }

    // Check individual CCA capacity
    if (cca.maxSeats && cca.enrolledCount >= cca.maxSeats) {
      showModal(
        "error",
        "Activity Full",
        `Sorry, ${cca.name} is fully booked. Please choose another activity.`,
      );
      return;
    }

    // Check max limit (Soft check for UI)
    if (selectedCCAs.length < 3) {
      setSelectedCCAs([...selectedCCAs, cca]);
    } else {
      showModal("info", "Limit Reached", "You can select a maximum of 3 CCAs.");
    }
  };

  // 4. TRANSACTIONAL SUBMIT
  const handleSubmit = async () => {
    if (selectedCCAs.length < 1) {
      showModal(
        "error",
        "Selection Required",
        "Please select at least one CCA before confirming.",
      );
      return;
    }

    const activeUser = currentUser || auth.currentUser;
    if (!activeUser) {
      showModal(
        "error",
        "Session Error",
        "System Error: User session not found. Please refresh the page.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await runTransaction(db, async (transaction) => {
        // --- PHASE 1: READS ---

        // 1. Read User Selection
        const selectionRef = doc(db, "selections", activeUser.uid);
        const sfDoc = await transaction.get(selectionRef);

        let previousCCAs = [];
        if (sfDoc.exists()) {
          const data = sfDoc.data();
          previousCCAs = data.selectedCCAs || [];
        }

        // 2. Identify NEW items
        const ccasToIncrement = selectedCCAs.filter(
          (current) => !previousCCAs.some((prev) => prev.id === current.id),
        );

        // 3. Read CCA documents for the NEW items only
        const ccaReads = [];
        for (const cca of ccasToIncrement) {
          const ref = doc(db, "ccas", cca.id);
          const docSnap = await transaction.get(ref);
          ccaReads.push({
            ref: ref,
            doc: docSnap,
            name: cca.name,
          });
        }

        // --- LOGIC CHECK ---

        // Check if any NEW CCA is invalid or full
        for (const item of ccaReads) {
          if (!item.doc.exists()) {
            throw new Error(`CCA ${item.name} no longer exists.`);
          }

          const data = item.doc.data();
          const currentEnrolled = data.enrolledCount || 0;
          const max = data.maxSeats || 0;

          if (max > 0 && currentEnrolled >= max) {
            throw new Error(
              `Sold Out: ${data.name} just filled up! Please remove it and pick another.`,
            );
          }
        }

        // --- PHASE 2: WRITES ---

        // 1. Update Enrolled Counts
        for (const item of ccaReads) {
          const currentEnrolled = item.doc.data().enrolledCount || 0;
          transaction.update(item.ref, {
            enrolledCount: currentEnrolled + 1,
          });
        }

        // 2. Update/Create Selection Record
        const selectionData = {
          studentUid: activeUser.uid,
          studentEmail: activeUser.email,
          studentName: activeUser.displayName || activeUser.email.split("@")[0],
          classId: selectedClassId,
          selectedCCAs: selectedCCAs.map((c) => ({ id: c.id, name: c.name })),
          timestamp: serverTimestamp(),
          status: "submitted",
        };

        transaction.set(selectionRef, selectionData, { merge: true });
      });

      // --- SUCCESS ---
      const selectionData = {
        studentUid: activeUser.uid,
        studentEmail: activeUser.email,
        studentName: activeUser.displayName || activeUser.email.split("@")[0],
        selectedCCAs: selectedCCAs,
        status: "submitted",
      };

      setExistingSelection(selectionData);
      setHasSubmitted(true);

      showModal(
        "success",
        "Success!",
        "Your selections have been updated successfully.",
      );
    } catch (error) {
      console.error("Submission error:", error);
      showModal(
        "error",
        "Submission Failed",
        error.message || "An unexpected error occurred.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    classes,
    ccas,
    selectedClassId,
    setSelectedClassId,
    selectedCCAs,
    setSelectedCCAs,
    isSubmitting,
    hasSubmitted,
    existingSelection,
    toggleCCA,
    handleSubmit,
    // EXPOSE MODAL STATE TO UI
    modalConfig,
    closeModal,
  };
}
