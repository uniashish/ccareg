import React, { useState, useEffect, useMemo } from "react";
import Header from "../components/Header";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import {
  FiSearch,
  FiFilter,
  FiUser,
  FiGrid,
  FiActivity,
  FiX,
  FiCalendar,
  FiMapPin,
  FiClock,
  FiInfo,
  FiUsers,
  FiLayers,
} from "react-icons/fi";

// --- SUB-COMPONENT: CCA DETAILS MODAL (MODIFIED) ---
function CCADetailsModal({ isOpen, onClose, cca }) {
  if (!isOpen || !cca) return null;

  // Calculate stats
  const enrolled = cca.enrolledCount || 0;
  const max = cca.maxSeats || 0;
  const isFull = max > 0 && enrolled >= max;
  const percentage = max > 0 ? Math.min((enrolled / max) * 100, 100) : 0;

  // Helper function to format date as "9th March"
  const formatDateWithoutYear = (dateString) => {
    try {
      const date = new Date(dateString);
      const day = date.getDate();
      const month = date.toLocaleString("en-US", { month: "long" });

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
    } catch (error) {
      return dateString; // Return original if parsing fails
    }
  };

  // Format session dates
  const formatSchedule = () => {
    if (!cca.sessionDates) return "TBA";

    if (Array.isArray(cca.sessionDates)) {
      return cca.sessionDates
        .map((date) => formatDateWithoutYear(date))
        .join(", ");
    } else {
      return formatDateWithoutYear(cca.sessionDates);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary bg-brand-primary/10 px-2 py-1 rounded-md">
              CCA Details
            </span>
            <h2 className="text-2xl font-black text-slate-800 mt-2 leading-tight">
              {cca.name}
            </h2>
            {cca.category && (
              <span className="text-sm font-bold text-slate-400">
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

        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Stats Bar */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase">
                No. of Students
              </span>
              <span
                className={`text-xs font-black px-2 py-0.5 rounded ${isFull ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"}`}
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
              <span className="text-sm font-bold text-slate-700">
                {enrolled} / {max > 0 ? max : "∞"}
              </span>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="flex gap-3 items-start">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                <FiUser />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">
                  Teacher In-Charge
                </p>
                <p className="font-bold text-slate-700">
                  {cca.teacher || "To Be Announced"}
                </p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                <FiMapPin />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">
                  Venue
                </p>
                <p className="font-bold text-slate-700">
                  {cca.venue || "To Be Announced"}
                </p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                <FiCalendar />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">
                  Schedule
                </p>
                <p className="font-bold text-slate-700">{formatSchedule()}</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                <FiClock />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">
                  Time
                </p>
                <p className="font-bold text-slate-700">
                  {cca.startTime
                    ? `${cca.startTime} - ${cca.endTime || "?"}`
                    : "TBA"}
                </p>
              </div>
            </div>
          </div>

          {cca.description && (
            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">
                Description
              </p>
              <p className="text-slate-600 text-sm leading-relaxed">
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

                const timeDisplay = fullDetails.startTime
                  ? `${fullDetails.startTime}${fullDetails.endTime ? " - " + fullDetails.endTime : ""}`
                  : "Time TBD";

                return (
                  <div
                    key={idx}
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
                          {fullDetails.teacher || "Instructor TBD"}
                        </span>
                      </div>
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
  const [selections, setSelections] = useState([]);
  const [classes, setClasses] = useState([]);
  const [ccas, setCCAs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterCCA, setFilterCCA] = useState("");

  // Modal State
  const [viewingSelection, setViewingSelection] = useState(null);
  const [viewingCCA, setViewingCCA] = useState(null);

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
        setCCAs(ccasData);

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

  return (
    // UPDATED CONTAINER: Using Flexbox column to push footer to bottom
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header />

      {/* UPDATED MAIN: flex-grow ensures it takes up available space */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* --- PAGE HEADER & FILTERS --- */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-6">
            Teacher Dashboard
          </h1>

          {/* Filters Bar (Controls the Right Column) */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search student name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-brand-primary rounded-xl text-sm font-bold text-slate-700 transition-all outline-none focus:ring-4 focus:ring-brand-primary/10"
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
                className="w-full pl-9 pr-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-brand-primary rounded-xl text-xs font-bold text-slate-600 transition-all outline-none cursor-pointer appearance-none"
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
                className="w-full pl-9 pr-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-brand-primary rounded-xl text-xs font-bold text-slate-600 transition-all outline-none cursor-pointer appearance-none truncate"
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
                className="p-3 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                title="Clear Filters"
              >
                <FiX />
              </button>
            )}
          </div>
        </div>

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

            <div
              className="space-y-3 overflow-y-auto border border-slate-200 bg-slate-50/50 rounded-2xl p-4"
              style={{ height: "calc(100vh - 400px)", minHeight: "400px" }}
            >
              {loading ? (
                <div className="text-center py-10 text-slate-400">
                  Loading CCAs...
                </div>
              ) : ccas.length > 0 ? (
                ccas.map((cca) => (
                  <div
                    key={cca.id}
                    onClick={() => setViewingCCA(cca)}
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-brand-primary/30 hover:bg-slate-50 cursor-pointer transition-all group"
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-slate-800 text-sm group-hover:text-brand-primary transition-colors">
                        {cca.name}
                      </h3>
                      {cca.category && (
                        <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">
                          {cca.category}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
                      <FiUser size={12} />
                      <span className="truncate">{cca.teacher || "TBA"}</span>
                    </div>
                    {/* Mini Progress Bar */}
                    <div className="mt-3 flex items-center gap-2">
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

            <div
              className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden"
              style={{ height: "calc(100vh - 400px)", minHeight: "400px" }}
            >
              {loading ? (
                <div className="p-12 flex justify-center text-slate-400">
                  <span className="animate-pulse font-bold">
                    Loading records...
                  </span>
                </div>
              ) : (
                <div className="h-full overflow-y-auto">
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
                                  .map((c, i) => (
                                    <span
                                      key={i}
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
                            <p className="text-sm">No matches found.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* --- ADDED FOOTER --- */}
      <footer className="w-full py-6 text-center border-t border-slate-200 bg-slate-50 mt-auto">
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
      />
    </div>
  );
}
