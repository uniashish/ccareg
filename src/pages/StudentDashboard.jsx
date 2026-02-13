import { useState, useEffect } from "react";
import { FiGrid, FiCheckCircle } from "react-icons/fi";
import { db } from "../firebase";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import Header from "../components/Header";

// 1. IMPORT THE BRAIN
import { useStudentDash } from "../hooks/useStudentDash";

// 2. IMPORT THE BODY PARTS
import LockedView from "../components/student/LockedView";
import ClassSelector from "../components/student/ClassSelector";
import CCACard from "../components/student/CCACard";
import MessageModal from "../components/common/MessageModal";

export default function StudentDashboard() {
  const {
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
    // Destructure Modal State from the Hook
    modalConfig: hookModalConfig,
    closeModal: closeHookModal,
  } = useStudentDash();

  const [minSelections, setMinSelections] = useState(1);
  const [maxSelections, setMaxSelections] = useState(3);

  // --- NEW STATE: ADMIN CONTACT INFO ---
  const [adminName, setAdminName] = useState("");
  const [adminContact, setAdminContact] = useState("");

  // --- NEW STATE: TRACK MANUAL EDIT MODE ---
  const [isAddingMore, setIsAddingMore] = useState(false);

  // --- LOCAL MODAL STATE ---
  const [localModalConfig, setLocalModalConfig] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });

  const closeLocalModal = () => {
    setLocalModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

  const showLocalModal = (type, title, message) => {
    setLocalModalConfig({
      isOpen: true,
      type,
      title,
      message,
    });
  };

  // Determine which modal to show
  const activeModalConfig = localModalConfig.isOpen
    ? localModalConfig
    : hookModalConfig;
  const activeModalClose = localModalConfig.isOpen
    ? closeLocalModal
    : closeHookModal;

  // --- 1. FETCH LIMITS AND ADMIN CONTACT INFO ---
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "general"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.minCCAs !== undefined) setMinSelections(Number(data.minCCAs));
        if (data.maxCCAs !== undefined) setMaxSelections(Number(data.maxCCAs));
        // Fetch admin contact details
        if (data.adminName) setAdminName(data.adminName);
        if (data.adminContact) setAdminContact(data.adminContact);
      }
    });
    return () => unsub();
  }, []);

  // --- 2. LOGIC: WHEN TO SHOW LOCKED VIEW ---
  // Show locked view if they have submitted AND they are not currently adding more.
  const showLockedView = hasSubmitted && !isAddingMore;

  // --- 3. AUTO-LOCK ON SUCCESSFUL SUBMIT ---
  // When existingSelection updates (meaning the DB has processed the new submit),
  // we exit "Adding Mode" and go back to the Locked View receipt.
  useEffect(() => {
    if (existingSelection) {
      setIsAddingMore(false);
    }
  }, [existingSelection]);

  // --- 4. RESTORE STATE ---
  const previouslySelectedIds =
    existingSelection?.selectedCCAs?.map((c) => c.id) || [];

  useEffect(() => {
    // Standard restore logic
    if (hasSubmitted && existingSelection) {
      if (!selectedClassId && existingSelection.classId) {
        setSelectedClassId(existingSelection.classId);
      }
      if (
        existingSelection.selectedCCAs?.length > 0 &&
        selectedCCAs.length === 0
      ) {
        setSelectedCCAs(existingSelection.selectedCCAs);
      }
    }
  }, [
    hasSubmitted,
    existingSelection,
    selectedClassId,
    setSelectedClassId,
    setSelectedCCAs,
    // Note: removed selectedCCAs.length to prevent loops
  ]);

  const availableCCAs = selectedClassId
    ? ccas.filter((cca) => {
        const currentClass = classes.find((c) => c.id === selectedClassId);
        return currentClass?.allowedCCAs?.includes(cca.id);
      })
    : [];

  const handleClassSelect = (id) => {
    setSelectedClassId(id);
    setSelectedCCAs([]);
  };

  // --- 5. HELPER FUNCTION TO FORMAT CONTACT INFO ---
  const getContactInfo = () => {
    if (adminName && adminContact) {
      return `For assistance, please contact ${adminName} at ${adminContact}.`;
    } else if (adminContact) {
      return `For assistance, please contact ${adminContact}.`;
    } else if (adminName) {
      return `For assistance, please contact ${adminName}.`;
    } else {
      return "Please contact the school office for assistance.";
    }
  };

  // --- 6. SMART TOGGLE LOGIC WITH ENHANCED ERROR MESSAGES ---
  const handleToggleCCA = (cca) => {
    const isPreviouslyLocked = previouslySelectedIds.includes(cca.id);

    if (isPreviouslyLocked) {
      showLocalModal(
        "error",
        "Action Denied",
        `You cannot remove the CCA that was confirmed earlier. ${getContactInfo()}`,
      );
      return;
    }

    const isSelected = selectedCCAs.find((c) => c.id === cca.id);

    if (isSelected) {
      toggleCCA(cca);
      return;
    }

    if (selectedCCAs.length >= maxSelections) {
      showLocalModal(
        "info",
        "Limit Reached",
        `You can only select up to ${maxSelections} CCAs. ${getContactInfo()}`,
      );
      return;
    }

    toggleCCA(cca);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-4 md:px-10">
        {showLockedView ? (
          <LockedView
            existingSelection={existingSelection}
            // Pass the logic to allow adding more
            canSelectMore={
              (existingSelection?.selectedCCAs?.length || 0) < maxSelections
            }
            onSelectMore={() => setIsAddingMore(true)}
            classes={classes}
          />
        ) : (
          <>
            <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">
                  CCA Selection
                </h1>
                <p className="text-slate-500 text-xs font-medium mt-1">
                  You have selected {selectedCCAs.length} / {maxSelections}{" "}
                  activities
                </p>
              </div>

              {selectedClassId && (
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Selected Slots
                  </span>
                  <div className="flex gap-1.5">
                    {Array.from({ length: maxSelections }, (_, i) => i + 1).map(
                      (slot) => (
                        <div
                          key={slot}
                          className={`w-2.5 h-2.5 rounded-full transition-colors ${
                            slot <= selectedCCAs.length
                              ? "bg-brand-primary"
                              : "bg-slate-200"
                          }`}
                        />
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>

            <ClassSelector
              classes={classes}
              selectedClassId={selectedClassId}
              onSelectClass={handleClassSelect}
            />

            {selectedClassId ? (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 pb-24">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableCCAs.map((cca) => {
                    const isSelected = !!selectedCCAs.find(
                      (c) => c.id === cca.id,
                    );
                    const isLocked = previouslySelectedIds.includes(cca.id);

                    return (
                      <CCACard
                        key={cca.id}
                        cca={cca}
                        isSelected={isSelected}
                        isLocked={isLocked} // ✅ ADDED: Pass isLocked to CCACard
                        onToggle={() => handleToggleCCA(cca)}
                      />
                    );
                  })}
                </div>

                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
                  <button
                    disabled={
                      selectedCCAs.length < minSelections || isSubmitting
                    }
                    onClick={handleSubmit}
                    className="px-12 py-4 bg-brand-primary text-white rounded-2xl font-black shadow-2xl shadow-brand-primary/40 hover:scale-105 disabled:opacity-20 disabled:scale-100 transition-all active:scale-95 flex items-center gap-3"
                  >
                    {isSubmitting
                      ? "Submitting..."
                      : `Confirm ${selectedCCAs.length} Selection${
                          selectedCCAs.length !== 1 ? "s" : ""
                        }`}
                    <FiCheckCircle size={20} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white/50">
                <FiGrid className="text-3xl text-slate-300 mx-auto mb-3" />
                <h3 className="text-slate-400 font-black uppercase tracking-widest text-xs">
                  Choose your class to begin
                </h3>
              </div>
            )}
          </>
        )}

        <footer className="py-6 text-center">
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
            Developed and Maintained by Ashish Bhatnagar SISKGNEJ
          </p>
        </footer>
      </main>

      {/* --- SHARED MESSAGE MODAL --- */}
      <MessageModal
        isOpen={activeModalConfig?.isOpen || false}
        onClose={activeModalClose}
        type={activeModalConfig?.type}
        title={activeModalConfig?.title}
        message={activeModalConfig?.message}
      />
    </div>
  );
}
