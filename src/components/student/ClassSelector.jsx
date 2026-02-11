import React, { useState, useEffect } from "react";
import { FiGrid, FiLock, FiCheck } from "react-icons/fi";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
// CHECK THIS IMPORT: Ensure it points to your firebase.js file
import { db } from "../../firebase";

export default function ClassSelector(props) {
  // Handle prop naming variations to prevent click errors
  const { classes, selectedClassId, existingSelection } = props;
  const onSelectClass = props.onSelectClass || props.setSelectedClassId;

  const [loading, setLoading] = useState(true);
  const [dbLockedClassId, setDbLockedClassId] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    let unsubscribeSnapshot = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // 1. If not logged in, stop loading
      if (!user) {
        setLoading(false);
        return;
      }

      // 2. Query for ANY active selection for this user
      const q = query(
        collection(db, "selections"),
        where("studentUid", "==", user.uid),
      );

      unsubscribeSnapshot = onSnapshot(
        q,
        (snapshot) => {
          // Find the first selection that is NOT cancelled
          const validRecord = snapshot.docs
            .map((d) => d.data())
            .find((data) => data.status !== "cancelled");

          if (validRecord && validRecord.classId) {
            console.log("ClassSelector: Locked to", validRecord.classId); // Debug Log
            setDbLockedClassId(validRecord.classId);

            // FORCE the parent state to match the locked class
            if (onSelectClass && validRecord.classId !== selectedClassId) {
              onSelectClass(validRecord.classId);
            }
          } else {
            console.log("ClassSelector: No active selection found.");
            setDbLockedClassId(null);
          }
          setLoading(false);
        },
        (error) => {
          console.error("ClassSelector Error:", error);
          setLoading(false);
        },
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []); // Run once on mount

  // LOCK LOGIC: Locked if DB has record OR Parent passed a record
  const activeLockId =
    dbLockedClassId ||
    (existingSelection?.status !== "cancelled"
      ? existingSelection?.classId
      : null);
  const isLocked = !!activeLockId;

  // Safe Click Handler
  const handleClassClick = (id) => {
    // 1. Absolute Block if Locked
    if (isLocked) return;

    // 2. Trigger Parent Update
    if (onSelectClass) {
      onSelectClass(id);
    } else {
      console.error(
        "ClassSelector: Missing onSelectClass or setSelectedClassId prop",
      );
    }
  };

  return (
    <div
      className={`mb-8 p-1 rounded-2xl border transition-all duration-300 ${
        isLocked
          ? "bg-slate-50 border-slate-200"
          : "bg-white border-slate-100 shadow-sm"
      }`}
    >
      <div className="flex items-center gap-3 p-3 border-b border-slate-100/50">
        <div
          className={`p-2 rounded-lg ${isLocked ? "bg-slate-200" : "bg-blue-50 text-blue-600"}`}
        >
          {isLocked ? (
            <FiLock size={18} className="text-slate-500" />
          ) : (
            <FiGrid size={18} />
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {isLocked ? "Selection Locked" : "Step 1"}
          </span>
          <span
            className={`text-sm font-bold ${isLocked ? "text-slate-500" : "text-slate-700"}`}
          >
            {isLocked ? "Class cannot be changed" : "Select your Class"}
          </span>
        </div>
      </div>

      <div className="p-3">
        {loading ? (
          <div className="text-center py-4 text-slate-400 text-sm animate-pulse">
            Checking records...
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {classes.map((cls) => {
              // Highlight if matches Lock or Selection
              const isSelected = (activeLockId || selectedClassId) === cls.id;

              let baseStyle =
                "relative w-auto min-w-[70px] py-2 px-4 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ";

              if (isSelected) {
                if (isLocked) {
                  // LOCKED & SELECTED: Grey/Dark
                  baseStyle +=
                    "bg-slate-600 text-white shadow-none cursor-default ring-2 ring-offset-2 ring-slate-200 opacity-80 ";
                } else {
                  // ACTIVE & SELECTED: Blue
                  baseStyle +=
                    "bg-blue-600 text-white shadow-lg shadow-blue-600/20 scale-[1.02] ring-2 ring-offset-1 ring-blue-600 ";
                }
              } else {
                if (isLocked) {
                  // LOCKED & UNSELECTED: Faded
                  baseStyle +=
                    "bg-transparent text-slate-300 cursor-not-allowed border border-transparent ";
                } else {
                  // ACTIVE & UNSELECTED: White/Grey
                  baseStyle +=
                    "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 ";
                }
              }

              return (
                <button
                  key={cls.id}
                  onClick={() => handleClassClick(cls.id)}
                  disabled={isLocked}
                  className={baseStyle}
                  // Double protection: CSS pointer-events
                  style={{ pointerEvents: isLocked ? "none" : "auto" }}
                >
                  {cls.name}
                  {isSelected && (
                    <FiCheck
                      size={14}
                      className={isLocked ? "text-slate-300" : "text-blue-200"}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
