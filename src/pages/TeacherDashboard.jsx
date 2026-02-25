import StudentCCARecordCard from "../components/teacher/StudentCCARecordCard";
import React, { useState, useEffect, useMemo } from "react";
import Header from "../components/Header";
import TeacherAttendancePanel from "../components/teacher/TeacherAttendancePanel";
import MessageModal from "../components/common/MessageModal";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  onSnapshot,
} from "firebase/firestore";
import {
  FiSearch,
  FiUser,
  FiGrid,
  FiActivity,
  FiX,
  FiCalendar,
  FiMapPin,
  FiClock,
  FiChevronDown,
  FiUsers,
  FiLayers,
} from "react-icons/fi";
import { downloadSelectionsCSV } from "../utils/csvExporter";
import { downloadSelectionsPDF } from "../utils/pdfExporter";
import sisBackground from "../assets/sisbackground.png";
import { enrichCCAsWithTeacherAlias } from "../utils/teacherAlias";

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

const formatSessionDate = (value) => {
  const date = parseDate(value);
  if (!date) return "";

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

// --- SUB-COMPONENT: CCA DETAILS MODAL (MODIFIED) ---
function CCADetailsModal({ isOpen, onClose, cca, classes }) {
  if (!isOpen || !cca) return null;

  // Calculate stats
  const enrolled = cca.enrolledCount || 0;
  const max = cca.maxSeats || 0;
  const isFull = max > 0 && enrolled >= max;
  const percentage = max > 0 ? Math.min((enrolled / max) * 100, 100) : 0;

  // Compute which classes this CCA is available to (allowedCCAs)
  const assignedClasses =
    classes
      ?.filter((c) => c.allowedCCAs?.includes(cca.id))
      .map((c) => c.name)
      .sort()
      .join(", ") || "None";

  // Helper function to format date as "9th March"
  const formatDateWithoutYear = (dateString) => {
    try {
      if (!dateString) return dateString;

      // Normalize possible Firestore Timestamp, epoch seconds, or plain string
      let dateObj = dateString;
      // Firestore Timestamp instance (has toDate)
      if (typeof dateObj === "object" && typeof dateObj.toDate === "function") {
        dateObj = dateObj.toDate();
      } else if (
        typeof dateObj === "object" &&
        dateObj !== null &&
        ("seconds" in dateObj || "nanoseconds" in dateObj)
      ) {
        // Raw Firestore timestamp-like object
        dateObj = new Date((dateObj.seconds || 0) * 1000);
      } else if (typeof dateObj === "number") {
        // Unix ms epoch or seconds? assume ms if > 1e12 else seconds
        dateObj = new Date(dateObj > 1e12 ? dateObj : dateObj * 1000);
      } else {
        // string or other
        dateObj = new Date(dateObj);
      }

      if (!(dateObj instanceof Date) || isNaN(dateObj.getTime()))
        return dateString;

      const day = dateObj.getDate();
      const month = dateObj.toLocaleString("en-US", { month: "short" });

      // Add ordinal suffix
      const getOrdinalSuffix = (day) => {
        if (day > 3 && day < 21) return "th";
        switch (day % 10) {
          case 1:
            return "st";
          case 2:
            return "nd";
          case 3:
            return "rd";
          default:
            return "th";
        }
      };

      return `${day}${getOrdinalSuffix(day)} ${month}`;
    } catch {
      return dateString; // Return original if parsing fails
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-md">
              CCA Details
            </span>
            <h2 className="text-xl font-black text-slate-800 mt-2 leading-tight">
              {cca.name}
            </h2>
            {cca.category && (
              <span className="text-xs font-bold text-slate-400">
                {cca.category}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white border border-slate-200 text-slate-400 rounded-xl hover:bg-slate-100 transition-all"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
          {/* Stats Bar */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                No. of Students
              </span>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded ${isFull ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"}`}
              >
                {isFull ? "FULL" : "OPEN"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-primary transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <span className="text-xs font-bold text-slate-700">
                {enrolled} / {max > 0 ? max : "∞"}
              </span>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="flex gap-2 items-start">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                <FiUser size={14} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  Teacher In-Charge
                </p>
                <p className="text-xs font-bold text-slate-700">
                  {cca.teacherDisplay || cca.teacher || "To Be Announced"}
                </p>
              </div>
            </div>
            <div className="flex gap-2 items-start">
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                <FiMapPin size={14} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  Venue
                </p>
                <p className="text-xs font-bold text-slate-700">
                  {cca.venue || "To Be Announced"}
                </p>
              </div>
            </div>
            <div className="flex gap-2 items-start">
              <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                <FiCalendar size={14} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                  Schedule
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {!cca.sessionDates ? (
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full">
                      TBA
                    </span>
                  ) : Array.isArray(cca.sessionDates) ? (
                    cca.sessionDates.map((date, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full border border-amber-200"
                      >
                        {formatDateWithoutYear(date)}
                      </span>
                    ))
                  ) : (
                    <span className="px-2 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full border border-amber-200">
                      {formatDateWithoutYear(cca.sessionDates)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2 items-start">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                <FiClock size={14} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  Time
                </p>
                <p className="text-xs font-bold text-slate-700">
                  {cca.startTime
                    ? `${cca.startTime} - ${cca.endTime || "?"}`
                    : "TBA"}
                </p>
              </div>
            </div>
            <div className="flex gap-2 items-start">
              <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg shrink-0">
                <FiGrid size={14} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  Available To
                </p>
                <p className="text-xs font-bold text-slate-700">
                  {assignedClasses}
                </p>
              </div>
            </div>
          </div>

          {cca.description && (
            <div className="pt-3 border-t border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                Description
              </p>
              <p className="text-slate-600 text-xs leading-relaxed">
                {cca.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENT: STUDENT DETAILS MODAL (RESTRUCTURED) ---
function StudentDetailsModal({ isOpen, onClose, selection, allCCAs }) {
  const [attendanceByCCAId, setAttendanceByCCAId] = useState({});
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  useEffect(() => {
    const fetchAttendanceSummaries = async () => {
      if (!isOpen || !selection) {
        setAttendanceByCCAId({});
        setAttendanceLoading(false);
        return;
      }

      const selectedItems = Array.isArray(selection.selectedCCAs)
        ? selection.selectedCCAs
        : [];

      if (selectedItems.length === 0) {
        setAttendanceByCCAId({});
        setAttendanceLoading(false);
        return;
      }

      setAttendanceLoading(true);

      try {
        const activeStudentId = selection.studentUid || selection.id;
        const today = getTodayDateOnly();

        const summaries = await Promise.all(
          selectedItems.map(async (item) => {
            const ccaId = item.id;
            if (!ccaId) return null;

            const fullDetails = allCCAs.find((cca) => cca.id === ccaId) || {};
            const rawSessionDates = Array.isArray(fullDetails.sessionDates)
              ? fullDetails.sessionDates
              : fullDetails.sessionDates
                ? [fullDetails.sessionDates]
                : [];

            const parsedSessionDates = rawSessionDates
              .map((sessionDate) => parseDate(sessionDate))
              .filter(Boolean)
              .sort((a, b) => a - b);

            const completedSessionDateKeys = [
              ...new Set(
                parsedSessionDates
                  .filter((date) => {
                    const dateOnly = new Date(
                      date.getFullYear(),
                      date.getMonth(),
                      date.getDate(),
                    );
                    return dateOnly <= today;
                  })
                  .map((date) => toDateKey(date)),
              ),
            ];

            const attendanceByDateKey = completedSessionDateKeys.reduce(
              (map, dateKey) => {
                map[dateKey] = false;
                return map;
              },
              {},
            );

            if (completedSessionDateKeys.length === 0) {
              return [
                ccaId,
                {
                  attendanceByDateKey,
                  presentCompletedCount: 0,
                  totalCompletedCount: 0,
                  presentPercent: 0,
                },
              ];
            }

            const attendanceDocs = await Promise.allSettled(
              completedSessionDateKeys.map((dateKey) =>
                getDoc(doc(db, "attendanceRecords", `${ccaId}_${dateKey}`)),
              ),
            );

            let presentCompletedCount = 0;

            attendanceDocs.forEach((result, index) => {
              const dateKey = completedSessionDateKeys[index];

              if (result.status !== "fulfilled" || !result.value.exists()) {
                attendanceByDateKey[dateKey] = false;
                return;
              }

              const data = result.value.data() || {};
              const presentStudentIds = Array.isArray(data.presentStudentIds)
                ? data.presentStudentIds
                : [];

              const isPresent = presentStudentIds.includes(activeStudentId);
              attendanceByDateKey[dateKey] = isPresent;

              if (isPresent) {
                presentCompletedCount += 1;
              }
            });

            const totalCompletedCount = completedSessionDateKeys.length;
            const presentPercent =
              totalCompletedCount > 0
                ? Math.round(
                    (presentCompletedCount / totalCompletedCount) * 100,
                  )
                : 0;

            return [
              ccaId,
              {
                attendanceByDateKey,
                presentCompletedCount,
                totalCompletedCount,
                presentPercent,
              },
            ];
          }),
        );

        const summaryMap = summaries.filter(Boolean).reduce((map, entry) => {
          const [ccaId, summary] = entry;
          map[ccaId] = summary;
          return map;
        }, {});

        setAttendanceByCCAId(summaryMap);
      } catch (error) {
        console.error("Error loading student attendance summaries:", error);
        setAttendanceByCCAId({});
      } finally {
        setAttendanceLoading(false);
      }
    };

    fetchAttendanceSummaries();
  }, [isOpen, selection, allCCAs]);

  if (!isOpen || !selection) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-black text-slate-800">
              {selection.studentName}
            </h2>
            <div className="flex items-center gap-2 mt-1 text-slate-500 font-medium">
              <span className="bg-white border border-slate-200 px-2 py-0.5 rounded text-xs uppercase tracking-wider font-bold">
                {selection.className || "Unknown Class"}
              </span>
              <span className="text-sm">{selection.studentEmail}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white border border-slate-200 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
            Selected CCAs ({selection.selectedCCAs?.length || 0})
          </h3>

          <div className="space-y-3">
            {selection.selectedCCAs && selection.selectedCCAs.length > 0 ? (
              selection.selectedCCAs.map((item, idx) => {
                const fullDetails = allCCAs.find((c) => c.id === item.id) || {};
                const attendanceSummary = attendanceByCCAId[item.id];
                const sessionDates = (
                  Array.isArray(fullDetails.sessionDates)
                    ? fullDetails.sessionDates
                    : fullDetails.sessionDates
                      ? [fullDetails.sessionDates]
                      : []
                )
                  .slice()
                  .sort((a, b) => {
                    const dateA = parseDate(a);
                    const dateB = parseDate(b);
                    if (!dateA || !dateB) return 0;
                    return dateA - dateB;
                  });

                const timeDisplay = fullDetails.startTime
                  ? `${fullDetails.startTime}${fullDetails.endTime ? " - " + fullDetails.endTime : ""}`
                  : "Time TBD";

                return (
                  <div
                    key={item.id ?? item.name ?? idx}
                    className="p-4 rounded-2xl border border-slate-100 bg-slate-50/30 flex flex-col gap-3"
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-slate-800 text-lg">
                        {item.name}
                      </h4>
                      {fullDetails.category && (
                        <span className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-wider">
                          {fullDetails.category}
                        </span>
                      )}
                    </div>

                    {/* Restructured to 3-column grid without schedule */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-500 bg-white p-2 rounded-lg border border-slate-100">
                        <FiClock className="text-brand-primary shrink-0" />
                        <span className="truncate font-medium">
                          {timeDisplay}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 bg-white p-2 rounded-lg border border-slate-100">
                        <FiMapPin className="text-emerald-500 shrink-0" />
                        <span className="truncate">
                          {fullDetails.venue || "Venue TBD"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 bg-white p-2 rounded-lg border border-slate-100">
                        <FiUser className="text-amber-500 shrink-0" />
                        <span className="truncate">
                          {fullDetails.teacherDisplay ||
                            fullDetails.teacher ||
                            "Instructor TBD"}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-100">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                          Attendance
                        </p>
                        <span className="text-[11px] font-bold text-slate-600">
                          {attendanceLoading
                            ? "Loading..."
                            : attendanceSummary
                              ? `${attendanceSummary.presentCompletedCount}/${attendanceSummary.totalCompletedCount} (${attendanceSummary.presentPercent}%)`
                              : "0/0 (0%)"}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-500"
                          style={{
                            width: `${attendanceSummary?.presentPercent || 0}%`,
                          }}
                        />
                      </div>

                      {sessionDates.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100 border-dashed">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                            Session Status
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {sessionDates.map((sessionDate, sessionIndex) => {
                              const parsedDate = parseDate(sessionDate);

                              let capsuleClass =
                                "text-[10px] font-bold px-2 py-1 rounded-full border";

                              if (!parsedDate) {
                                capsuleClass +=
                                  " bg-slate-50 border-slate-200 text-slate-500";
                              } else {
                                const today = getTodayDateOnly();
                                const dateOnly = new Date(
                                  parsedDate.getFullYear(),
                                  parsedDate.getMonth(),
                                  parsedDate.getDate(),
                                );

                                if (dateOnly > today) {
                                  capsuleClass +=
                                    " bg-slate-100 border-slate-200 text-slate-500";
                                } else if (
                                  attendanceSummary?.attendanceByDateKey?.[
                                    toDateKey(parsedDate)
                                  ]
                                ) {
                                  capsuleClass +=
                                    " bg-emerald-50 border-emerald-200 text-emerald-700";
                                } else {
                                  capsuleClass +=
                                    " bg-red-50 border-red-200 text-red-700";
                                }
                              }

                              return (
                                <span
                                  key={`${item.id || idx}-${sessionIndex}`}
                                  className={capsuleClass}
                                >
                                  {formatSessionDate(sessionDate)}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-400 italic">
                No CCA selected.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- MAIN COMPONENT ---
export default function TeacherDashboard() {
  const { user } = useAuth();
  const [selections, setSelections] = useState([]);
  const [classes, setClasses] = useState([]);
  const [ccas, setCCAs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isTeacherPortalActive, setIsTeacherPortalActive] = useState(true);
  const [adminName, setAdminName] = useState("");
  const [adminContact, setAdminContact] = useState("");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterCCA, setFilterCCA] = useState("");

  // Modal State
  const [viewingSelection, setViewingSelection] = useState(null);
  const [viewingCCA, setViewingCCA] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [activeView, setActiveView] = useState("dashboard");
  const [hasUnsavedAttendance, setHasUnsavedAttendance] = useState(false);
  const [leaveAttendanceConfirm, setLeaveAttendanceConfirm] = useState(false);

  const handleAttendanceViewToggle = () => {
    if (activeView === "attendance" && hasUnsavedAttendance) {
      setLeaveAttendanceConfirm(true);
      return;
    }

    setActiveView((prev) =>
      prev === "attendance" ? "dashboard" : "attendance",
    );
    setExportOpen(false);
  };

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!(activeView === "attendance" && hasUnsavedAttendance)) return;

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [activeView, hasUnsavedAttendance]);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const classesSnap = await getDocs(collection(db, "classes"));
        const classesData = classesSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        classesData.sort((a, b) => a.name.localeCompare(b.name));
        setClasses(classesData);

        const ccasSnap = await getDocs(collection(db, "ccas"));
        const ccasData = ccasSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        ccasData.sort((a, b) => a.name.localeCompare(b.name));

        const usersSnap = await getDocs(collection(db, "users"));
        const usersData = usersSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setCCAs(enrichCCAsWithTeacherAlias(ccasData, usersData));

        const selectionsSnap = await getDocs(collection(db, "selections"));
        const activeSelections = selectionsSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((s) => s.status !== "cancelled");
        setSelections(activeSelections);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "general"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setIsTeacherPortalActive(data.teacherPortalActive !== false);
        if (data.adminName) setAdminName(data.adminName);
        if (data.adminContact) setAdminContact(data.adminContact);
      } else {
        setIsTeacherPortalActive(true);
      }
    });

    return () => unsub();
  }, []);

  // --- MEMOIZED FILTER LOGIC (Students) ---
  const filteredStudents = useMemo(() => {
    return selections
      .map((sel) => {
        const matchedClass = classes.find((c) => c.id === sel.classId);
        return {
          ...sel,
          className: matchedClass ? matchedClass.name : "Unknown",
        };
      })
      .filter((sel) => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          sel.studentName?.toLowerCase().includes(searchLower) ||
          sel.studentEmail?.toLowerCase().includes(searchLower);
        const matchesClass = filterClass ? sel.classId === filterClass : true;
        const matchesCCA = filterCCA
          ? sel.selectedCCAs?.some((cca) => cca.id === filterCCA)
          : true;
        return matchesSearch && matchesClass && matchesCCA;
      });
  }, [selections, classes, searchTerm, filterClass, filterCCA]);

  // Export currently visible students to CSV
  const handleExportCSV = () => {
    if (!filteredStudents || filteredStudents.length === 0) return;

    // convert classes array to map for the exporter (expects classes[id])
    const classesMap = classes.reduce((map, c) => {
      map[c.id] = c;
      return map;
    }, {});

    // Call exporter with visible selections; users param is optional here
    downloadSelectionsCSV(filteredStudents, null, classesMap);
  };

  const handleExportPDF = () => {
    if (!filteredStudents || filteredStudents.length === 0) return;
    downloadSelectionsPDF(filteredStudents, classes);
  };

  return (
    // UPDATED CONTAINER: Using Flexbox column to push footer to bottom
    <div
      className="relative flex flex-col min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${sisBackground})` }}
    >
      <div className="absolute inset-0 bg-white/70 pointer-events-none" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />

        {/* UPDATED MAIN: flex-grow ensures it takes up available space */}
        <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {!isTeacherPortalActive ? (
            <div className="max-w-3xl mx-auto mt-8 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm text-center">
              <h1 className="text-2xl font-black text-slate-800 tracking-tight mb-3">
                Teacher Portal Not Active
              </h1>
              <p className="text-slate-600 text-sm leading-relaxed">
                The teacher portal is currently not active. Please contact the
                administrator.
              </p>
              <p className="text-slate-700 text-sm font-bold mt-4">
                {adminName && adminContact
                  ? `${adminName} - ${adminContact}`
                  : adminContact
                    ? adminContact
                    : adminName
                      ? adminName
                      : "School administration"}
              </p>
            </div>
          ) : (
            <>
              {/* --- PAGE HEADER & FILTERS --- */}
              <div className="mb-8">
                {/* Filters Bar (Controls the Right Column) */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
                  <div className="relative flex-1 w-full">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search student name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      disabled={activeView === "attendance"}
                      className={`w-full pl-10 pr-4 py-3 bg-slate-50 border-transparent rounded-xl text-sm font-bold text-slate-700 transition-all outline-none ${
                        activeView === "attendance"
                          ? "cursor-not-allowed opacity-60"
                          : "focus:bg-white focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                      }`}
                    />
                  </div>
                  <div className="relative w-full md:w-48">
                    <FiGrid
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      size={14}
                    />
                    <select
                      value={filterClass}
                      onChange={(e) => setFilterClass(e.target.value)}
                      disabled={activeView === "attendance"}
                      className={`w-full pl-9 pr-4 py-3 bg-slate-50 border-transparent rounded-xl text-xs font-bold text-slate-600 transition-all outline-none appearance-none ${
                        activeView === "attendance"
                          ? "cursor-not-allowed opacity-60"
                          : "cursor-pointer focus:bg-white focus:border-brand-primary"
                      }`}
                    >
                      <option value="">All Classes</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="relative w-full md:w-64">
                    <FiActivity
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      size={14}
                    />
                    <select
                      value={filterCCA}
                      onChange={(e) => setFilterCCA(e.target.value)}
                      disabled={activeView === "attendance"}
                      className={`w-full pl-9 pr-4 py-3 bg-slate-50 border-transparent rounded-xl text-xs font-bold text-slate-600 transition-all outline-none appearance-none truncate ${
                        activeView === "attendance"
                          ? "cursor-not-allowed opacity-60"
                          : "cursor-pointer focus:bg-white focus:border-brand-primary"
                      }`}
                    >
                      <option value="">All CCAs</option>
                      {ccas.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {(searchTerm || filterClass || filterCCA) && (
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setFilterClass("");
                        setFilterCCA("");
                      }}
                      disabled={activeView === "attendance"}
                      className={`p-3 rounded-xl transition-colors ${
                        activeView === "attendance"
                          ? "text-slate-300 bg-slate-100 cursor-not-allowed"
                          : "text-red-500 bg-red-50 hover:bg-red-100"
                      }`}
                      title="Clear Filters"
                    >
                      <FiX />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleAttendanceViewToggle}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                      activeView === "attendance"
                        ? "bg-slate-800 text-white hover:bg-slate-700"
                        : "bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20"
                    }`}
                    title={
                      activeView === "attendance"
                        ? "Back to dashboard"
                        : "Take Attendance"
                    }
                  >
                    {activeView === "attendance"
                      ? "Back to Dashboard"
                      : "Take Attendance"}
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setExportOpen((v) => !v)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${filteredStudents && filteredStudents.length > 0 ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-slate-50 text-slate-300 cursor-not-allowed"}`}
                      title="Export options"
                      disabled={
                        !filteredStudents || filteredStudents.length === 0
                      }
                    >
                      Export
                      <FiChevronDown />
                    </button>

                    {exportOpen && (
                      <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border z-50">
                        <button
                          onClick={() => {
                            handleExportCSV();
                            setExportOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50"
                        >
                          Export CSV
                        </button>
                        <button
                          onClick={() => {
                            handleExportPDF();
                            setExportOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50"
                        >
                          Export PDF
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {activeView === "attendance" ? (
                <TeacherAttendancePanel
                  user={user}
                  ccas={ccas}
                  selections={selections}
                  classes={classes}
                  onDirtyChange={setHasUnsavedAttendance}
                />
              ) : (
                <>
                  {/* --- 2-COLUMN LAYOUT WITH EXPLICIT HEIGHTS --- */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* LEFT COLUMN: CCA LIST (Span 4) - Fixed Height with Scrollbar */}
                    <div className="lg:col-span-4 space-y-4">
                      <div className="flex items-center gap-2 mb-2 px-1">
                        <FiLayers className="text-brand-primary" />
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">
                          CCA List
                        </h2>
                      </div>

                      <div className="space-y-3 overflow-y-auto border border-slate-200 bg-slate-50/50 rounded-2xl p-4 max-h-[50vh] lg:max-h-[calc(100vh-400px)]">
                        {loading ? (
                          <div className="text-center py-10 text-slate-400">
                            Loading CCAs...
                          </div>
                        ) : ccas.length > 0 ? (
                          ccas.map((cca) => (
                            <div
                              key={cca.id}
                              onClick={() => setViewingCCA(cca)}
                              className="relative overflow-hidden bg-[radial-gradient(circle_at_top_right,_#dbeafe_0%,_#fee2e2_100%)] p-4 rounded-xl border border-slate-300 shadow-[0_18px_24px_-18px_rgba(15,23,42,0.55),0_8px_10px_-8px_rgba(15,23,42,0.3),0_1px_0_rgba(255,255,255,0.85)_inset] hover:shadow-[0_28px_38px_-20px_rgba(15,23,42,0.6),0_12px_16px_-10px_rgba(15,23,42,0.35),0_1px_0_rgba(255,255,255,0.9)_inset] [transform:perspective(1200px)_rotateX(2deg)] hover:[transform:perspective(1200px)_rotateX(4deg)_translateY(-4px)] cursor-pointer transition-all duration-300 group"
                            >
                              <div className="pointer-events-none absolute inset-0 rounded-xl bg-[linear-gradient(160deg,rgba(255,255,255,0.55)_0%,rgba(255,255,255,0.1)_35%,rgba(255,255,255,0)_70%)]" />

                              <div className="flex justify-between items-start relative z-10">
                                <h3 className="font-bold text-slate-800 text-sm group-hover:text-brand-primary transition-colors">
                                  {cca.name}
                                </h3>
                                {cca.category && (
                                  <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">
                                    {cca.category}
                                  </span>
                                )}
                              </div>
                              <div className="mt-2 text-xs text-slate-500 flex items-center gap-2 relative z-10">
                                <FiUser size={12} />
                                <span className="truncate">
                                  {cca.teacherDisplay || cca.teacher || "TBA"}
                                </span>
                              </div>
                              {/* Mini Progress Bar */}
                              <div className="mt-3 flex items-center gap-2 relative z-10">
                                <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-slate-300 group-hover:bg-brand-primary"
                                    style={{
                                      width: `${Math.min(((cca.enrolledCount || 0) / (cca.maxSeats || 1)) * 100, 100)}%`,
                                    }}
                                  ></div>
                                </div>
                                <span className="text-[9px] font-bold text-slate-400">
                                  {cca.enrolledCount || 0}/{cca.maxSeats || "∞"}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-slate-400 text-sm italic">
                            No CCAs found.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* RIGHT COLUMN: STUDENT LIST (Span 8) - Fixed Height with Scrollbar */}
                    <div className="lg:col-span-8">
                      <div className="flex items-center gap-2 mb-6 px-1">
                        <FiUsers className="text-brand-primary" />
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">
                          Student Selections
                        </h2>
                        <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">
                          {filteredStudents.length}
                        </span>
                      </div>

                      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                        {loading ? (
                          <div className="p-12 flex justify-center text-slate-400">
                            <span className="animate-pulse font-bold">
                              Loading records...
                            </span>
                          </div>
                        ) : (
                          <div className="overflow-y-auto max-h-[55vh] lg:max-h-[calc(100vh-400px)]">
                            {/* Mobile: Card format, Desktop: Table */}
                            <div className="block md:hidden">
                              {filteredStudents.length > 0 ? (
                                filteredStudents.map((student) => (
                                  <div key={student.id} className="mb-6">
                                    <div className="relative overflow-hidden bg-white p-4 rounded-2xl border border-slate-300 shadow-lg">
                                      <div className="font-bold text-slate-700 text-base mb-1">
                                        {student.studentName}
                                      </div>
                                      <div className="text-xs text-slate-400 mb-4">
                                        {student.className} &bull; {student.studentEmail}
                                      </div>
                                      <div className="space-y-4">
                                        {student.selectedCCAs && student.selectedCCAs.length > 0 ? (
                                          student.selectedCCAs.map((cca, idx) => (
                                            <div key={cca.id || idx} className="border border-slate-200 rounded-xl bg-slate-50">
                                              <StudentCCARecordCard
                                                cca={cca}
                                                onClick={() => setViewingCCA(ccas.find((c) => c.id === cca.id))}
                                              />
                                            </div>
                                          ))
                                        ) : (
                                          <div className="text-slate-400 text-xs italic mb-2">No CCAs selected.</div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="p-8 text-center text-slate-400 text-sm italic">No matches found.</div>
                              )}
                            </div>
                            <div className="hidden md:block">
                              <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100 sticky top-0">
                                  <tr>
                                    <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">
                                      Student
                                    </th>
                                    <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">
                                      Class
                                    </th>
                                    <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">
                                      Choices
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                  {filteredStudents.length > 0 ? (
                                    filteredStudents.map((student) => (
                                      <tr
                                        key={student.id}
                                        onClick={() => setViewingSelection(student)}
                                        className="group hover:bg-brand-primary/5 cursor-pointer transition-colors"
                                      >
                                        <td className="p-4">
                                          <div className="font-bold text-slate-700 group-hover:text-brand-primary text-sm">
                                            {student.studentName}
                                          </div>
                                          <div className="text-[10px] text-slate-400 font-mono">
                                            {student.studentEmail}
                                          </div>
                                        </td>
                                        <td className="p-4">
                                          <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md whitespace-nowrap">
                                            {student.className}
                                          </span>
                                        </td>
                                        <td className="p-4">
                                          <div className="flex flex-wrap gap-1">
                                            {student.selectedCCAs
                                              ?.slice(0, 2)
                                              .map((c) => (
                                                <span
                                                  key={c.id}
                                                  className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded border border-indigo-100 whitespace-nowrap"
                                                >
                                                  {c.name}
                                                </span>
                                              ))}
                                            {student.selectedCCAs?.length > 2 && (
                                              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded">
                                                +{student.selectedCCAs.length - 2}
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td
                                        colSpan="3"
                                        className="p-12 text-center text-slate-400"
                                      >
                                        <p className="text-sm">
                                          No matches found.
                                        </p>
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </main>

        {/* --- ADDED FOOTER --- */}
        <footer className="w-full py-6 text-center border-t border-slate-200 bg-transparent mt-auto">
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
            Developed and Maintained by Ashish Bhatnagar SISKGNEJ
          </p>
        </footer>

        {/* --- MODALS --- */}
        <StudentDetailsModal
          isOpen={!!viewingSelection}
          onClose={() => setViewingSelection(null)}
          selection={viewingSelection}
          allCCAs={ccas}
        />

        <CCADetailsModal
          isOpen={!!viewingCCA}
          onClose={() => setViewingCCA(null)}
          cca={viewingCCA}
          classes={classes}
        />

        <MessageModal
          isOpen={leaveAttendanceConfirm}
          onClose={() => setLeaveAttendanceConfirm(false)}
          type="error"
          title="Unsaved Attendance"
          message="New attendance changes are not submitted yet. If you leave now, they will not be saved."
          mode="confirm"
          confirmText="Leave"
          cancelText="Stay"
          onConfirm={() => {
            setLeaveAttendanceConfirm(false);
            setHasUnsavedAttendance(false);
            setActiveView("dashboard");
            setExportOpen(false);
          }}
        />
      </div>
    </div>
  );
}
