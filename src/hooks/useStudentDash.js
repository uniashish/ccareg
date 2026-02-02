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
    if (selectedCCAs.find((item) => item.id === cca.id)) {
      setSelectedCCAs(selectedCCAs.filter((item) => item.id !== cca.id));
      return;
    }

    if (cca.maxSeats && cca.enrolledCount >= cca.maxSeats) {
      alert(`Sorry, ${cca.name} is fully booked.`);
      return;
    }

    if (selectedCCAs.length < 3) {
      setSelectedCCAs([...selectedCCAs, cca]);
    } else {
      alert("You can select a maximum of 3 CCAs.");
    }
  };

  // 4. TRANSACTIONAL SUBMIT (FIXED)
  const handleSubmit = async () => {
    if (selectedCCAs.length < 1) {
      alert("Please select at least one CCA.");
      return;
    }

    const activeUser = currentUser || auth.currentUser;
    if (!activeUser) {
      alert("System Error: User session not found. Please refresh.");
      return;
    }

    setIsSubmitting(true);

    try {
      await runTransaction(db, async (transaction) => {
        // --- PHASE 1: READS (Must be done first) ---

        // 1. Read User Selection
        const selectionRef = doc(db, "selections", activeUser.uid);
        const sfDoc = await transaction.get(selectionRef);

        if (sfDoc.exists()) {
          throw new Error("You have already submitted a selection.");
        }

        // 2. Read ALL selected CCA documents
        const ccaReads = [];
        for (const cca of selectedCCAs) {
          const ref = doc(db, "ccas", cca.id);
          const docSnap = await transaction.get(ref);
          ccaReads.push({
            ref: ref,
            doc: docSnap,
            name: cca.name,
          });
        }

        // --- LOGIC CHECK (Between Reads and Writes) ---

        // Check if any CCA is invalid or full
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

        // --- PHASE 2: WRITES (Done last) ---

        // 1. Update Enrolled Counts
        for (const item of ccaReads) {
          const currentEnrolled = item.doc.data().enrolledCount || 0;
          transaction.update(item.ref, {
            enrolledCount: currentEnrolled + 1,
          });
        }

        // 2. Create Selection Record
        const selectionData = {
          studentUid: activeUser.uid,
          studentEmail: activeUser.email,
          studentName: activeUser.displayName || activeUser.email.split("@")[0],
          classId: selectedClassId,
          selectedCCAs: selectedCCAs.map((c) => ({ id: c.id, name: c.name })),
          timestamp: serverTimestamp(),
          status: "pending",
        };

        transaction.set(selectionRef, selectionData);
      });

      // --- SUCCESS ---
      const selectionData = {
        studentUid: activeUser.uid,
        studentEmail: activeUser.email,
        studentName: activeUser.displayName || activeUser.email.split("@")[0],
        selectedCCAs: selectedCCAs,
      };
      setExistingSelection(selectionData);
      setHasSubmitted(true);
      alert("Selection submitted successfully!");
    } catch (error) {
      console.error("Submission error:", error);
      alert(error.message);
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
  };
}
