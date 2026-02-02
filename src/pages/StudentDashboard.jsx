import { useState, useEffect } from "react";
import { FiGrid, FiCheckCircle } from "react-icons/fi";
import { db } from "../firebase"; // Ensure this path is correct
import { doc, onSnapshot } from "firebase/firestore";
import Header from "../components/Header";

// 1. IMPORT THE BRAIN (Logic)
import { useStudentDash } from "../hooks/useStudentDash";

// 2. IMPORT THE BODY PARTS (UI Components)
import LockedView from "../components/student/LockedView";
import ClassSelector from "../components/student/ClassSelector";
import CCACard from "../components/student/CCACard";

export default function StudentDashboard() {
  // Use the Custom Hook to get all state and functions
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
  } = useStudentDash();

  // --- STATE FOR LIMITS ---
  // Default to 1 and 3 until loaded from DB
  const [minSelections, setMinSelections] = useState(1);
  const [maxSelections, setMaxSelections] = useState(3);

  // --- FETCH SETTINGS FROM DB ---
  useEffect(() => {
    // Listen to the settings/general document
    const unsub = onSnapshot(doc(db, "settings", "general"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.minCCAs !== undefined) setMinSelections(Number(data.minCCAs));
        if (data.maxCCAs !== undefined) setMaxSelections(Number(data.maxCCAs));
      }
    });
    return () => unsub();
  }, []);

  // --- VIEW LOGIC ---
  // Filter CCAs based on the selected class
  const availableCCAs = selectedClassId
    ? ccas.filter((cca) => {
        const currentClass = classes.find((c) => c.id === selectedClassId);
        return currentClass?.allowedCCAs?.includes(cca.id);
      })
    : [];

  // Handle switching classes (resets selection)
  const handleClassSelect = (id) => {
    setSelectedClassId(id);
    setSelectedCCAs([]);
  };

  // Wrapper to enforce MAX limit at the UI level
  const handleToggleCCA = (cca) => {
    const isSelected = selectedCCAs.find((c) => c.id === cca.id);

    // If trying to add (not currently selected) and we hit the max limit, stop.
    if (!isSelected && selectedCCAs.length >= maxSelections) {
      alert(`You can only select up to ${maxSelections} activities.`);
      return;
    }

    toggleCCA(cca);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-4 md:px-10">
        {/* STATE 1: LOCKED VIEW */}
        {hasSubmitted ? (
          <LockedView existingSelection={existingSelection} />
        ) : (
          /* STATE 2: ACTIVE SELECTION */
          <>
            {/* HEADER AREA */}
            <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">
                  CCA Selection
                </h1>
                <p className="text-slate-500 text-xs font-medium mt-1">
                  Choose up to {maxSelections} activities
                </p>
              </div>

              {selectedClassId && (
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Selected Slots
                  </span>
                  <div className="flex gap-1.5">
                    {/* Dynamically generate slots based on maxSelections */}
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

            {/* CLASS SELECTOR COMPONENT */}
            <ClassSelector
              classes={classes}
              selectedClassId={selectedClassId}
              onSelectClass={handleClassSelect}
            />

            {/* MAIN CONTENT AREA */}
            {selectedClassId ? (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 pb-24">
                {/* CCA GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableCCAs.map((cca) => (
                    <CCACard
                      key={cca.id}
                      cca={cca}
                      isSelected={!!selectedCCAs.find((c) => c.id === cca.id)}
                      onToggle={handleToggleCCA} // Use our wrapper
                    />
                  ))}
                </div>

                {/* SUBMIT BUTTON */}
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
                  <button
                    // Validate against minSelections from DB
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
              /* EMPTY STATE */
              <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white/50">
                <FiGrid className="text-3xl text-slate-300 mx-auto mb-3" />
                <h3 className="text-slate-400 font-black uppercase tracking-widest text-xs">
                  Choose your class to begin
                </h3>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
