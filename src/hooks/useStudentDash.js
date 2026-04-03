import { useState, useEffect, useMemo } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  query,
  serverTimestamp,
  runTransaction,
  where,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { enrichCCAsWithTeacherAlias } from "../utils/teacherAlias";

export function useStudentDash() {
  const { currentUser } = useAuth();

  // --- DATA STATE ---
  const [classes, setClasses] = useState([]);
  const [rawCCAs, setRawCCAs] = useState([]);
  const [users, setUsers] = useState([]);

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
      setRawCCAs(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    const unsubUsers = onSnapshot(
      query(collection(db, "users"), where("role", "in", ["admin", "teacher"])),
      (snapshot) => {
        setUsers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      },
    );
    return () => {
      unsubClasses();
      unsubCCAs();
      unsubUsers();
    };
  }, []);

  const ccas = useMemo(
    () => enrichCCAsWithTeacherAlias(rawCCAs, users),
    [rawCCAs, users],
  );

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
        `Sorry, ${cca.name} is fully booked. Please choose another CCA.`,
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

    const selectedClassName =
      classes.find((classItem) => classItem.id === selectedClassId)?.name || "";

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

        const previousCCAsById = previousCCAs.reduce((map, item) => {
          if (item?.id) {
            map[item.id] = item;
          }
          return map;
        }, {});

        // 2. Identify added and removed CCAs to keep enrolledCount in sync.
        const selectedIds = new Set(
          selectedCCAs.map((item) => item?.id).filter(Boolean),
        );
        const previousIds = new Set(
          previousCCAs.map((item) => item?.id).filter(Boolean),
        );

        const ccasToIncrement = selectedCCAs.filter(
          (current) => current?.id && !previousIds.has(current.id),
        );

        const ccasToDecrement = previousCCAs.filter(
          (previous) => previous?.id && !selectedIds.has(previous.id),
        );

        // 3. Read all affected CCA docs once (both adds and removals)
        const affectedIds = [
          ...new Set([
            ...ccasToIncrement.map((item) => item.id),
            ...ccasToDecrement.map((item) => item.id),
          ]),
        ];

        const ccaReadsById = {};
        for (const ccaId of affectedIds) {
          const ref = doc(db, "ccas", ccaId);
          const docSnap = await transaction.get(ref);
          ccaReadsById[ccaId] = {
            ref,
            doc: docSnap,
          };
        }

        // --- LOGIC CHECK ---

        // Check if any NEW CCA is invalid or full
        for (const item of ccasToIncrement) {
          const currentRead = ccaReadsById[item.id];
          if (!currentRead?.doc?.exists()) {
            throw new Error(`CCA ${item.name} no longer exists.`);
          }

          const data = currentRead.doc.data();
          const currentEnrolled = data.enrolledCount || 0;
          const max = data.maxSeats || 0;

          if (max > 0 && currentEnrolled >= max) {
            throw new Error(
              `Sold Out: ${data.name} just filled up! Please remove it and pick another.`,
            );
          }
        }

        // --- PHASE 2: WRITES ---

        // 1. Increment counts for newly added CCAs
        for (const item of ccasToIncrement) {
          const currentRead = ccaReadsById[item.id];
          const currentEnrolled = currentRead.doc.data().enrolledCount || 0;
          transaction.update(currentRead.ref, {
            enrolledCount: currentEnrolled + 1,
          });
        }

        // 2. Decrement counts for removed CCAs (floor at 0)
        for (const item of ccasToDecrement) {
          const currentRead = ccaReadsById[item.id];
          if (!currentRead?.doc?.exists()) continue;

          const currentEnrolled = currentRead.doc.data().enrolledCount || 0;
          transaction.update(currentRead.ref, {
            enrolledCount: Math.max(currentEnrolled - 1, 0),
          });
        }

        // 3. Update/Create Selection Record
        const selectionData = {
          studentUid: activeUser.uid,
          studentEmail: activeUser.email,
          studentName: activeUser.displayName || activeUser.email.split("@")[0],
          classId: selectedClassId,
          classNameSnapshot: selectedClassName,
          selectedCCAs: selectedCCAs.map((c) => {
            const previous = previousCCAsById[c.id] || {};
            return {
              id: c.id,
              name: c.name,
              paymentStatus:
                previous.paymentStatus === "Paid" ? "Paid" : "Unpaid",
              verified: previous.verified === true,
            };
          }),
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
        classId: selectedClassId,
        classNameSnapshot: selectedClassName,
        selectedCCAs: selectedCCAs.map((c) => ({
          ...c,
          paymentStatus: c.paymentStatus === "Paid" ? "Paid" : "Unpaid",
          verified: c.verified === true,
        })),
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
