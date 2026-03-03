import React, { useState, useEffect, useMemo } from "react";
import StudentCardMobile from "./StudentCardMobile";
import VerificationControl from "./VerificationControl";
import { db } from "../../firebase";
import { doc, onSnapshot, updateDoc, getDoc } from "firebase/firestore";

export default function VendorStudentsTable({
  rows,
  updatingMap,
  onToggleVerification,
  onStudentClick,
}) {
  const [isGradingEnabled, setIsGradingEnabled] = useState(false);
  const [grades, setGrades] = useState([]);
  const [savingGradesMap, setSavingGradesMap] = useState({});
  const [optimisticGrades, setOptimisticGrades] = useState({});
  const [pendingUpdates, setPendingUpdates] = useState({}); // Track what we're expecting to see

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "grading"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setIsGradingEnabled(data.enabled !== false);
        setGrades(data.grades || []);
      } else {
        setIsGradingEnabled(false);
        setGrades([]);
      }
    });

    return () => unsub();
  }, []);

  // Monitor rows for confirmed grade updates
  useEffect(() => {
    // Check if any pending updates have been confirmed by the listener
    if (
      Object.keys(pendingUpdates).length === 0 &&
      Object.keys(savingGradesMap).length === 0
    ) {
      return;
    }

    Object.keys(pendingUpdates).forEach((updateKey) => {
      const [selectionId, ccaId] = updateKey.split("_");

      // Find the row with this update key
      const matchingRow = rows.find(
        (r) => r.selectionId === selectionId && r.ccaId === ccaId,
      );

      if (matchingRow && pendingUpdates[updateKey]) {
        const expectedGrade = pendingUpdates[updateKey];
        const actualGrade = matchingRow.grade;

        console.log(
          `[Monitor] Checking ${ccaId}: expected="${expectedGrade}", actual="${actualGrade}"`,
        );

        // If the listener has confirmed the update, clear the saving state
        if (String(actualGrade || null) === String(expectedGrade || null)) {
          console.log(`✓ Update confirmed by listener for ${updateKey}`);
          setSavingGradesMap((prev) => {
            const updated = { ...prev };
            delete updated[updateKey];
            return updated;
          });
          setPendingUpdates((prev) => {
            const updated = { ...prev };
            delete updated[updateKey];
            return updated;
          });
        }
      }
    });
  }, [rows, pendingUpdates, savingGradesMap]);

  const studentGroups = useMemo(() => {
    const groups = rows.reduce((acc, row) => {
      // Ensure groupKey is consistent by using selectionId with string conversion
      const groupKey = String(row.selectionId || row.studentUid || "").trim();
      if (!groupKey) {
        console.warn(
          `[studentGroups] Row has no valid selectionId or studentUid:`,
          row,
        );
        return acc;
      }
      if (!acc[groupKey]) {
        acc[groupKey] = {
          groupKey,
          studentName: row.studentName,
          className: row.className,
          rows: [],
        };
      }
      acc[groupKey].rows.push(row);
      return acc;
    }, {});

    console.log(
      `[studentGroups] Recalculated with ${rows.length} rows -> ${Object.keys(groups).length} student groups`,
    );

    return groups;
  }, [rows]);

  const groupedRows = useMemo(() => {
    return Object.values(studentGroups);
  }, [studentGroups]);

  const getVerificationLabel = (row, isUpdating, isPaid) => {
    if (isUpdating) return "Updating...";
    if (row.verified) return "Verified";
    return isPaid ? "Pending" : "Unpaid";
  };

  const handleGradeChange = async (selectionId, ccaId, gradeId) => {
    if (savingGradesMap[`${selectionId}_${ccaId}`]) return;

    const updateKey = `${selectionId}_${ccaId}`;
    console.log(`=== Grade Change Started ===`);
    console.log(
      `selectionId: ${selectionId}, ccaId: ${ccaId}, gradeId: ${gradeId}`,
    );

    // OPTIMISTIC UPDATE: Set the grade immediately in local state
    setOptimisticGrades((prev) => ({
      ...prev,
      [updateKey]: gradeId || null,
    }));

    // Track this as a pending update so we know what to expect from the listener
    setPendingUpdates((prev) => ({
      ...prev,
      [updateKey]: gradeId || null,
    }));

    // Mark as saving to disable dropdown
    setSavingGradesMap((prev) => ({ ...prev, [updateKey]: true }));

    try {
      // Get the current selection document to fetch latest selectedCCAs
      const selectionSnap = await getDoc(doc(db, "selections", selectionId));

      if (!selectionSnap.exists()) {
        console.error("Selection document not found:", selectionId);
        return;
      }

      const currentData = selectionSnap.data();
      const selectedCCAs = Array.isArray(currentData.selectedCCAs)
        ? currentData.selectedCCAs
        : [];

      console.log(`Fetched selection with ${selectedCCAs.length} CCAs:`);
      selectedCCAs.forEach((cca, idx) => {
        console.log(
          `  CCA ${idx}: id="${cca?.id}", name="${cca?.name}", current-grade="${cca?.grade}"`,
        );
      });

      // Update the specific CCA with the new grade
      let foundMatch = false;
      const updatedCCAs = selectedCCAs.map((cca) => {
        // Convert both IDs to strings for comparison
        const ccaIdStr = String(cca?.id || "").trim();
        const ccaIdToMatchStr = String(ccaId || "").trim();

        if (ccaIdStr === ccaIdToMatchStr && ccaIdStr) {
          foundMatch = true;
          const newGrade = gradeId ? gradeId : null;
          console.log(
            `✓ Found matching CCA at index, updating grade: "${cca.grade}" → "${newGrade}"`,
          );
          return {
            ...cca,
            grade: newGrade,
            gradeUpdatedAt: new Date().toISOString(),
          };
        }
        return cca;
      });

      if (!foundMatch) {
        console.warn(`✗ NO MATCHING CCA FOUND!`);
        console.warn(`  Looking for ccaId="${ccaId}" (${typeof ccaId})`);
        console.warn(
          `  Available CCA IDs:`,
          selectedCCAs.map((c) => `"${c?.id}" (${typeof c?.id})`),
        );
        throw new Error(`CCA ${ccaId} not found in selection ${selectionId}`);
      }

      // Write back only the selectedCCAs field
      await updateDoc(doc(db, "selections", selectionId), {
        selectedCCAs: updatedCCAs,
      });

      console.log(`✓ Successfully wrote to Firestore`);
    } catch (error) {
      console.error("Error updating grade:", error);
      // On error, revert the optimistic update
      setOptimisticGrades((prev) => {
        const updated = { ...prev };
        delete updated[updateKey];
        return updated;
      });
      setPendingUpdates((prev) => {
        const updated = { ...prev };
        delete updated[updateKey];
        return updated;
      });
      setSavingGradesMap((prev) => {
        const newMap = { ...prev };
        delete newMap[updateKey];
        return newMap;
      });
    }
    // Don't clear saving state here - wait for listener to confirm
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="md:hidden p-3 space-y-3">
        {groupedRows.length > 0 ? (
          groupedRows.map((group) => (
            <StudentCardMobile
              key={group.groupKey}
              group={group}
              onStudentClick={onStudentClick}
              updatingMap={updatingMap}
              onToggleVerification={onToggleVerification}
              getVerificationLabel={getVerificationLabel}
            />
          ))
        ) : (
          <div className="px-2 py-8 text-center text-slate-400 italic text-sm">
            No students found for the selected filters.
          </div>
        )}
      </div>

      <div className="hidden md:block overflow-x-auto overflow-y-auto max-h-[65vh]">
        <table className="w-full min-w-[920px] text-left border-collapse text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">
                Student Name
              </th>
              <th className="px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">
                Class
              </th>
              <th className="px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">
                CCA Name
              </th>
              {isGradingEnabled && (
                <th className="px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">
                  Grade
                </th>
              )}
            </tr>
          </thead>
          <tbody className="text-sm">
            {groupedRows.length > 0 ? (
              groupedRows.map((group, index) => {
                const primaryRow = group.rows[0];

                return (
                  <tr
                    key={group.groupKey}
                    className={`transition-colors hover:bg-slate-100/70 ${
                      index % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                    }`}
                  >
                    <td className="px-4 py-3 font-semibold text-slate-700 border-y border-l border-slate-200 align-middle">
                      <button
                        type="button"
                        onClick={() => onStudentClick?.(primaryRow)}
                        className="font-semibold text-slate-700 hover:text-brand-primary hover:underline underline-offset-2 text-left"
                      >
                        {group.studentName}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-slate-600 border-y border-slate-200 align-middle">
                      {group.className}
                    </td>
                    <td className="px-4 py-3 border-y border-r border-slate-200 align-top">
                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        {group.rows.map((ccaRow) => (
                          <div
                            key={`verify_${ccaRow.selectionId}_${ccaRow.ccaId}`}
                            className="flex items-center justify-between gap-2 px-2 py-1.5 border-b border-slate-200 last:border-b-0"
                          >
                            <span className="text-xs font-semibold text-slate-500">
                              {ccaRow.ccaName}
                            </span>
                            <VerificationControl
                              row={ccaRow}
                              updatingMap={updatingMap}
                              onToggleVerification={onToggleVerification}
                              getVerificationLabel={getVerificationLabel}
                            />
                          </div>
                        ))}
                      </div>
                    </td>
                    {isGradingEnabled && (
                      <td className="px-4 py-3 border-y border-r border-slate-200 align-top">
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                          {group.rows.map((ccaRow) => {
                            const updateKey = `${ccaRow.selectionId}_${ccaRow.ccaId}`;
                            const isSaving = savingGradesMap[updateKey];

                            // Use optimistic grade if available, otherwise use row data
                            const optimisticValue = optimisticGrades[updateKey];
                            const displayGrade =
                              optimisticValue !== undefined
                                ? optimisticValue
                                : ccaRow.grade;
                            const gradeValue = displayGrade
                              ? String(displayGrade)
                              : "";

                            // Debug: Log row structure on every render
                            console.log(
                              `[Render] ${ccaRow.ccaName} - selectionId="${ccaRow.selectionId}" ccaId="${ccaRow.ccaId}" updateKey="${updateKey}" displayGrade="${displayGrade}" optimistic=${optimisticValue !== undefined}`,
                            );

                            return (
                              <div
                                key={`grade_${ccaRow.selectionId}_${ccaRow.ccaId}`}
                                className="px-2 py-1.5 border-b border-slate-200 last:border-b-0"
                              >
                                <select
                                  value={gradeValue}
                                  onChange={(e) => {
                                    const selectedGradeId = e.target.value;
                                    console.log(
                                      `[onChange] Selected grade for ${ccaRow.ccaName}: "${selectedGradeId}" (updateKey: ${updateKey})`,
                                    );
                                    handleGradeChange(
                                      ccaRow.selectionId,
                                      ccaRow.ccaId,
                                      selectedGradeId,
                                    );
                                  }}
                                  disabled={isSaving}
                                  className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                  <option value="">Select Grade</option>
                                  {grades.map((grade) => (
                                    <option
                                      key={grade.id}
                                      value={String(grade.id)}
                                    >
                                      {grade.text}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={isGradingEnabled ? 4 : 3}
                  className="px-4 py-12 text-center text-slate-400 italic"
                >
                  No students found for the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
