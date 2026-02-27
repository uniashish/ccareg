import React, { useEffect, useMemo, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { FiX, FiUserPlus } from "react-icons/fi";
import { db } from "../../firebase";

const parseDate = (value) => {
  if (!value) return null;

  if (typeof value === "object" && typeof value.toDate === "function") {
    const date = value.toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    ("seconds" in value || "nanoseconds" in value)
  ) {
    const date = new Date((value.seconds || 0) * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === "number") {
    const date = new Date(value > 1e12 ? value : value * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTodayDateOnly = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const formatDateLabel = (dateKey) => {
  if (!dateKey) return "";
  const parts = dateKey.split("-").map((value) => Number(value));
  if (parts.length !== 3 || parts.some((value) => Number.isNaN(value))) {
    return dateKey;
  }
  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
};

export default function CustomStudentList({
  isOpen,
  onClose,
  selections = [],
  classes = [],
  ccas = [],
  user,
}) {
  const [customList, setCustomList] = useState([]);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [selectedCheckboxes, setSelectedCheckboxes] = useState({});
  const [classFilter, setClassFilter] = useState("");
  const [attendanceByStudentCCA, setAttendanceByStudentCCA] = useState({});
  const [completedDateKeysByCCA, setCompletedDateKeysByCCA] = useState({});
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const teacherId = user?.uid;
  const customListDocId = `${teacherId}_customList`;

  // Log teacherId for debugging
  useEffect(() => {
    console.log(
      "[CustomList] Component mounted/updated - teacherId:",
      teacherId,
      "docId:",
      customListDocId,
    );
  }, [teacherId, customListDocId]);

  // Load custom list from Firestore when modal opens
  useEffect(() => {
    if (!isOpen || !teacherId) {
      console.log(
        "[CustomList] Load skipped - isOpen:",
        isOpen,
        "teacherId:",
        teacherId,
      );
      return;
    }

    const loadCustomList = async () => {
      try {
        setIsLoadingList(true);
        console.log("[CustomList] Loading from doc:", customListDocId);
        const docSnap = await getDoc(
          doc(db, "customStudentLists", customListDocId),
        );
        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log("[CustomList] Loaded data:", data);
          setCustomList(data.students || []);
        } else {
          console.log("[CustomList] Document does not exist:", customListDocId);
          setCustomList([]);
        }
        setHasLoadedOnce(true);
      } catch (error) {
        console.error("[CustomList] Error loading custom list:", error);
        setHasLoadedOnce(true);
      } finally {
        setIsLoadingList(false);
      }
    };

    loadCustomList();
  }, [isOpen, teacherId, customListDocId]);

  // Save custom list to Firestore whenever it changes (debounced)
  useEffect(() => {
    if (!teacherId || !hasLoadedOnce) {
      console.log(
        "[CustomList] Save skipped - teacherId:",
        teacherId,
        "hasLoadedOnce:",
        hasLoadedOnce,
      );
      return;
    }

    const timer = setTimeout(async () => {
      try {
        console.log(
          "[CustomList] Saving to doc:",
          customListDocId,
          "with",
          customList.length,
          "students",
        );
        await setDoc(
          doc(db, "customStudentLists", customListDocId),
          {
            students: customList,
            teacherId,
            updatedAt: new Date(),
          },
          { merge: true },
        );
        console.log("[CustomList] Save successful");
      } catch (error) {
        console.error("[CustomList] Error saving custom list:", error);
      }
    }, 500); // Debounce 500ms

    return () => clearTimeout(timer);
  }, [customList, teacherId, customListDocId, hasLoadedOnce]);

  const ccasById = useMemo(() => {
    return (ccas || []).reduce((map, cca) => {
      if (cca?.id) {
        map[cca.id] = cca;
      }
      return map;
    }, {});
  }, [ccas]);

  // Enrich selections with className by looking up classId in classes array
  const enrichedSelections = selections.map((sel) => {
    const matchedClass = classes.find((c) => c.id === sel.classId);
    return {
      ...sel,
      className: matchedClass ? matchedClass.name : "Unknown",
    };
  });

  // Create a set of IDs for students already in customList
  const customListIds = useMemo(() => {
    return new Set(customList.map((s) => s.id));
  }, [customList]);

  const handleToggleCheckbox = (studentId) => {
    // Don't allow toggling if student is already in customList
    if (customListIds.has(studentId)) return;

    setSelectedCheckboxes((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  const handleAddStudents = () => {
    const newStudents = enrichedSelections.filter(
      (s) => selectedCheckboxes[s.id],
    );
    setCustomList((prev) => {
      const existingIds = new Set(prev.map((s) => s.id));
      const toAdd = newStudents.filter((s) => !existingIds.has(s.id));
      return [...prev, ...toAdd];
    });
    setSelectedCheckboxes({});
    setIsAddStudentOpen(false);
  };

  const handleRemoveStudent = (index) => {
    setCustomList((prev) => prev.filter((_, i) => i !== index));
  };

  const getAttendanceMap = (student, ccaId) => {
    if (!ccaId) return {};
    const attendanceStudentId = student.studentUid || student.id;
    return attendanceByStudentCCA[`${attendanceStudentId}__${ccaId}`] || {};
  };

  useEffect(() => {
    let isActive = true;

    const loadAttendanceSummaries = async () => {
      if (customList.length === 0) {
        if (isActive) {
          setAttendanceByStudentCCA({});
          setCompletedDateKeysByCCA({});
        }
        return;
      }

      const today = getTodayDateOnly();
      const dateKeysByCCA = {};
      const docIds = new Set();

      customList.forEach((student) => {
        const selectedItems = Array.isArray(student.selectedCCAs)
          ? student.selectedCCAs
          : [];

        selectedItems.forEach((item) => {
          const ccaId = item?.id;
          if (!ccaId || dateKeysByCCA[ccaId]) return;

          const ccaDetails = ccasById[ccaId] || {};
          const rawSessionDates = Array.isArray(ccaDetails.sessionDates)
            ? ccaDetails.sessionDates
            : ccaDetails.sessionDates
              ? [ccaDetails.sessionDates]
              : [];

          const dateKeys = rawSessionDates
            .map((sessionDate) => parseDate(sessionDate))
            .filter(Boolean)
            .filter((date) => {
              const dateOnly = new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate(),
              );
              return dateOnly <= today;
            })
            .map((date) => toDateKey(date));

          dateKeysByCCA[ccaId] = [...new Set(dateKeys)].sort();

          dateKeysByCCA[ccaId].forEach((dateKey) => {
            docIds.add(`${ccaId}_${dateKey}`);
          });
        });
      });

      const attendanceByDocId = {};

      if (docIds.size > 0) {
        const docIdList = Array.from(docIds);
        const results = await Promise.allSettled(
          docIdList.map((docId) => getDoc(doc(db, "attendanceRecords", docId))),
        );

        results.forEach((result, index) => {
          const docId = docIdList[index];
          if (result.status !== "fulfilled" || !result.value.exists()) {
            attendanceByDocId[docId] = [];
            return;
          }

          const data = result.value.data() || {};
          attendanceByDocId[docId] = Array.isArray(data.presentStudentIds)
            ? data.presentStudentIds
            : [];
        });
      }

      const summaryMap = {};

      customList.forEach((student) => {
        const attendanceStudentId = student.studentUid || student.id;
        const selectedItems = Array.isArray(student.selectedCCAs)
          ? student.selectedCCAs
          : [];

        selectedItems.forEach((item) => {
          const ccaId = item?.id;
          if (!ccaId) return;

          const dateKeys = dateKeysByCCA[ccaId] || [];
          const attendanceByDateKey = {};

          dateKeys.forEach((dateKey) => {
            const docId = `${ccaId}_${dateKey}`;
            const presentStudentIds = attendanceByDocId[docId] || [];
            attendanceByDateKey[dateKey] =
              presentStudentIds.includes(attendanceStudentId);
          });

          summaryMap[`${attendanceStudentId}__${ccaId}`] = attendanceByDateKey;
        });
      });

      if (isActive) {
        setAttendanceByStudentCCA(summaryMap);
        setCompletedDateKeysByCCA(dateKeysByCCA);
      }
    };

    loadAttendanceSummaries();

    return () => {
      isActive = false;
    };
  }, [customList, ccasById]);

  const uniqueClasses = Array.from(
    new Set(enrichedSelections.map((s) => s.className).filter(Boolean)),
  ).sort();

  const filteredSelections = classFilter
    ? enrichedSelections.filter((s) => s.className === classFilter)
    : enrichedSelections;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      ></div>

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
        {/* Header with Close Button */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-2xl font-black text-slate-800">My List</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-100"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddStudentOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-black font-bold transition-colors bg-green-50 text-green-600 hover:bg-green-100"
            >
              <FiUserPlus size={18} />
              Add Student
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoadingList ? (
            <div className="text-center py-12">
              <p className="text-slate-400 text-sm">Loading your list...</p>
            </div>
          ) : customList.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 text-sm">
                No students in your custom list yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {customList.map((student, index) => (
                <div
                  key={student.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="font-bold text-slate-700 text-sm">
                        {student.studentName}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {student.className} • {student.studentEmail}
                      </div>
                      {student.selectedCCAs &&
                        student.selectedCCAs.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {student.selectedCCAs.map((cca, idx) => (
                              <span
                                key={cca.id || idx}
                                className="flex items-center gap-1 flex-wrap px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold border border-indigo-100"
                              >
                                {(() => {
                                  const attendanceMap = getAttendanceMap(
                                    student,
                                    cca?.id,
                                  );
                                  const dateKeys =
                                    completedDateKeysByCCA[cca?.id] || [];

                                  if (dateKeys.length === 0) {
                                    return (
                                      <span className="text-[9px] font-bold text-slate-400">
                                        No sessions
                                      </span>
                                    );
                                  }

                                  const presentCount = dateKeys.filter(
                                    (dateKey) => attendanceMap[dateKey],
                                  ).length;

                                  return (
                                    <>
                                      {dateKeys.map((dateKey) => {
                                        const isPresent =
                                          attendanceMap[dateKey];
                                        return (
                                          <span
                                            key={dateKey}
                                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                              isPresent
                                                ? "bg-emerald-100 text-emerald-700"
                                                : "bg-rose-100 text-rose-700"
                                            }`}
                                          >
                                            {formatDateLabel(dateKey)}
                                          </span>
                                        );
                                      })}
                                      <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[9px] font-bold">
                                        {presentCount}/{dateKeys.length}
                                      </span>
                                    </>
                                  );
                                })()}
                                <span className="ml-1">{cca.name}</span>
                              </span>
                            ))}
                          </div>
                        )}
                    </div>
                    <button
                      onClick={() => handleRemoveStudent(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove student"
                    >
                      <FiX size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Student Modal */}
      {isAddStudentOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setIsAddStudentOpen(false)}
          ></div>

          {/* Modal */}
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-2xl font-black text-slate-800">
                Select Students
              </h2>
              <button
                onClick={() => {
                  setIsAddStudentOpen(false);
                  setSelectedCheckboxes({});
                  setClassFilter("");
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-100"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Class Filter */}
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <label className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Filter by Class: ({uniqueClasses.length})
                </span>
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="flex-1 max-w-xs px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                >
                  <option value="">All Classes</option>
                  {uniqueClasses.length === 0 ? (
                    <option disabled>No classes found</option>
                  ) : (
                    uniqueClasses.map((className) => (
                      <option key={className} value={className}>
                        {className}
                      </option>
                    ))
                  )}
                </select>
              </label>
            </div>

            {/* Students Table */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-2">
                {filteredSelections.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-400 text-sm">
                      {enrichedSelections.length === 0
                        ? "No student selections available."
                        : "No students found for the selected class."}
                    </p>
                  </div>
                ) : (
                  filteredSelections.map((student) => {
                    const isAlreadyInList = customListIds.has(student.id);
                    return (
                      <div
                        key={student.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                          isAlreadyInList
                            ? "border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed"
                            : "border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 cursor-pointer"
                        }`}
                        onClick={() =>
                          !isAlreadyInList && handleToggleCheckbox(student.id)
                        }
                      >
                        <input
                          type="checkbox"
                          checked={
                            isAlreadyInList || !!selectedCheckboxes[student.id]
                          }
                          disabled={isAlreadyInList}
                          onClick={(event) => event.stopPropagation()}
                          onChange={() => handleToggleCheckbox(student.id)}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <div className="flex-1">
                          <div className="font-bold text-slate-700 text-sm">
                            {student.studentName}
                          </div>
                          <div className="text-xs text-slate-500">
                            {student.className} • {student.studentEmail}
                          </div>
                        </div>
                        {student.selectedCCAs &&
                          student.selectedCCAs.length > 0 && (
                            <div className="flex gap-1 flex-wrap justify-end max-w-xs">
                              {student.selectedCCAs.map((cca, idx) => (
                                <span
                                  key={cca.id || idx}
                                  className="px-2 py-1 bg-indigo-100 text-indigo-600 rounded text-[10px] font-bold"
                                >
                                  {cca.name}
                                </span>
                              ))}
                            </div>
                          )}
                        {isAlreadyInList && (
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Already Added
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Footer with Action Buttons */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setIsAddStudentOpen(false);
                  setSelectedCheckboxes({});
                }}
                className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStudents}
                disabled={Object.values(selectedCheckboxes).every((v) => !v)}
                className={`px-4 py-2 rounded-xl border border-black font-bold transition-colors ${
                  Object.values(selectedCheckboxes).some((v) => v)
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                Add Selected
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
