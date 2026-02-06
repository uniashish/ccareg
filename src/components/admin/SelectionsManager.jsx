import React, { useState, useMemo, useEffect } from "react";
import {
  FiSearch,
  FiDownload,
  FiUser,
  FiGrid,
  FiCalendar,
  FiTrash2,
  FiActivity,
  FiX,
  FiFilter,
  FiDollarSign,
  FiMapPin,
  FiBriefcase,
} from "react-icons/fi";
import { db } from "../../firebase"; // Import DB
import { doc, getDoc } from "firebase/firestore"; // Import Firestore functions

// --- SUB-COMPONENT: STUDENT DETAILS MODAL ---
function StudentDetailsModal({ isOpen, onClose, selection, classMap }) {
  // State to hold fully fetched CCA details
  const [enrichedCCAs, setEnrichedCCAs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch full details for each selected CCA when modal opens
  useEffect(() => {
    const fetchCCADetails = async () => {
      if (!selection || !selection.selectedCCAs) return;

      setLoading(true);
      try {
        const promises = selection.selectedCCAs.map(async (item) => {
          // If the item doesn't have an ID, return it as is
          if (!item.id) return item;

          // Fetch latest data from 'ccas' collection
          const ccaRef = doc(db, "ccas", item.id);
          const ccaSnap = await getDoc(ccaRef);

          if (ccaSnap.exists()) {
            const data = ccaSnap.data();
            // Merge existing selection data with fetched details
            return {
              ...item,
              ...data, // This brings in teacher, fee, venue, sessionDates from DB
            };
          }
          return item;
        });

        const results = await Promise.all(promises);
        setEnrichedCCAs(results);
      } catch (error) {
        console.error("Error fetching CCA details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchCCADetails();
    } else {
      setEnrichedCCAs([]); // Reset on close
    }
  }, [isOpen, selection]);

  if (!isOpen || !selection) return null;

  const className = classMap[selection.classId]?.name || "Unassigned";

  const formatSessionDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      ></div>
      <div className="relative bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 shrink-0 flex justify-between items-start">
          <div>
            <h3 className="text-xl font-black tracking-tight">
              {selection.studentName}
            </h3>
            <p className="text-slate-400 text-sm">{selection.studentEmail}</p>
            <span className="inline-block mt-2 px-2 py-0.5 rounded bg-white/10 text-xs font-bold border border-white/20">
              {className}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">
            Selected Activities ({selection.selectedCCAs?.length || 0})
          </h4>

          {loading ? (
            <div className="text-center py-12 text-slate-400 font-medium animate-pulse">
              Loading activity details...
            </div>
          ) : (
            <div className="space-y-4">
              {enrichedCCAs.length > 0 ? (
                enrichedCCAs.map((cca, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h5 className="font-bold text-slate-800 text-lg">
                        {cca.name}
                      </h5>
                      <div className="flex items-center gap-1 text-slate-600 font-bold bg-slate-100 px-2 py-1 rounded text-xs">
                        <FiDollarSign />{" "}
                        {cca.price || cca.fee
                          ? Number(cca.price || cca.fee).toLocaleString()
                          : "Free"}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <FiBriefcase className="text-indigo-500" />
                        <span className="font-semibold">Teacher:</span>{" "}
                        {cca.teacher || "N/A"}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <FiMapPin className="text-indigo-500" />
                        <span className="font-semibold">Venue:</span>{" "}
                        {cca.venue || "N/A"}
                      </div>
                    </div>

                    {/* Session Dates */}
                    {cca.sessionDates && cca.sessionDates.length > 0 && (
                      <div className="pt-3 border-t border-slate-100 border-dashed">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <FiCalendar size={12} /> Sessions
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {cca.sessionDates.sort().map((date, i) => (
                            <span
                              key={i}
                              className="text-xs font-medium px-2 py-1 bg-slate-50 border border-slate-100 rounded text-slate-600"
                            >
                              {formatSessionDate(date)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 italic bg-white rounded-xl border border-dashed border-slate-200">
                  No activities selected.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// --- MAIN COMPONENT ---
export default function SelectionsManager({
  selections,
  users,
  classesList,
  onResetStudent,
  onDeleteCCA,
}) {
  const [searchTerm, setSearchTerm] = useState("");

  // --- FILTER STATES ---
  const [filterClass, setFilterClass] = useState("");
  const [filterCCA, setFilterCCA] = useState("");

  // --- MODAL STATE ---
  const [viewingSelection, setViewingSelection] = useState(null);

  const classMap = useMemo(() => {
    return classesList.reduce((acc, cls) => {
      acc[cls.id] = cls;
      return acc;
    }, {});
  }, [classesList]);

  // --- EXTRACT UNIQUE CCA NAMES FOR DROPDOWN ---
  const uniqueCCANames = useMemo(() => {
    const names = new Set();
    if (selections) {
      selections.forEach((s) => {
        if (s.selectedCCAs && Array.isArray(s.selectedCCAs)) {
          s.selectedCCAs.forEach((cca) => names.add(cca.name));
        }
      });
    }
    return Array.from(names).sort();
  }, [selections]);

  const filteredSelections = (selections || []).filter((s) => {
    const user = users ? users[s.studentUid] : null;
    const name = user?.displayName?.toLowerCase() || "";
    const email = s.studentEmail?.toLowerCase() || "";
    const term = searchTerm.toLowerCase();

    // 1. Search Text Match
    const matchesSearch = name.includes(term) || email.includes(term);

    // 2. Class Filter Match
    const matchesClass = !filterClass || s.classId === filterClass;

    // 3. CCA Filter Match (Checks if the student has selected this specific CCA)
    const matchesCCA =
      !filterCCA ||
      (s.selectedCCAs && s.selectedCCAs.some((c) => c.name === filterCCA));

    return matchesSearch && matchesClass && matchesCCA;
  });

  // --- INTERNAL CSV EXPORT FUNCTION ---
  const handleExportCSV = () => {
    if (filteredSelections.length === 0) {
      alert("No data to export");
      return;
    }

    // 1. Define Headers (REMOVED: Submitted Time, Status)
    const headers = [
      "Student Name",
      "Email",
      "Class",
      "Selected Activities",
      "Submitted Date",
    ];

    // 2. Map Data to Rows
    const rows = filteredSelections.map((sel) => {
      // Resolve Student Name
      const user = users ? users[sel.studentUid] : null;
      const studentName = (
        user?.displayName ||
        sel.studentName ||
        "Unknown"
      ).replace(/"/g, '""');

      // Resolve Class Name
      const classInfo = classMap[sel.classId];
      const className = (classInfo ? classInfo.name : "Unassigned").replace(
        /"/g,
        '""',
      );

      // Resolve Activities
      const activities = sel.selectedCCAs
        ? sel.selectedCCAs
            .map((c) => c.name)
            .join("; ")
            .replace(/"/g, '""')
        : "";

      // Resolve Date
      let dateStr = "";
      if (sel.timestamp && typeof sel.timestamp.toDate === "function") {
        const d = sel.timestamp.toDate();
        dateStr = d.toLocaleDateString();
      }

      return [
        `"${studentName}"`,
        `"${sel.studentEmail}"`,
        `"${className}"`,
        `"${activities}"`,
        `"${dateStr}"`,
      ].join(",");
    });

    // 3. Combine Headers and Rows
    const csvContent = [headers.join(","), ...rows].join("\n");

    // 4. Determine Filename based on Filters
    let fileName = "MasterList";

    // Check if filters are applied
    if (filterClass || filterCCA) {
      const parts = [];

      if (filterClass) {
        const classObj = classMap[filterClass];
        if (classObj) parts.push(classObj.name);
      }

      if (filterCCA) {
        parts.push(filterCCA);
      }

      if (parts.length > 0) {
        fileName = parts.join("_");
      }
    }

    // Sanitize filename
    fileName = fileName.replace(/[\/\\:*?"<>|]/g, "");

    // 5. Trigger Download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `${fileName}_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Master List</h1>
          <p className="text-slate-500 text-sm mt-1">
            View and manage all student submissions ({filteredSelections.length}{" "}
            records)
          </p>
        </div>

        {/* ACTIONS & FILTERS TOOLBAR */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* CLASS FILTER */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <FiGrid />
            </div>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full sm:w-40 pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 appearance-none cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <option value="">All Classes</option>
              {classesList.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* ACTIVITY FILTER */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <FiActivity />
            </div>
            <select
              value={filterCCA}
              onChange={(e) => setFilterCCA(e.target.value)}
              className="w-full sm:w-48 pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 appearance-none cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <option value="">All Activities</option>
              {uniqueCCANames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* SEARCH BAR */}
          <div className="relative flex-1 sm:flex-none">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search student..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
            />
          </div>

          {/* DOWNLOAD BUTTON */}
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 shadow-sm"
            title="Download CSV"
          >
            <FiDownload />
            <span className="hidden sm:inline">CSV</span>
          </button>
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest w-[25%]">
                  Student
                </th>
                <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest w-[15%]">
                  Class
                </th>
                <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest w-[35%]">
                  Selected Activities
                </th>
                <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest w-[15%]">
                  Submitted
                </th>
                <th className="p-5 text-right text-xs font-black text-slate-400 uppercase tracking-widest w-[10%]">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredSelections.length > 0 ? (
                filteredSelections.map((sel) => {
                  const userProfile = users ? users[sel.studentUid] : null;
                  const displayName =
                    userProfile?.displayName ||
                    sel.studentName ||
                    "Unknown Student";
                  const classInfo = classMap[sel.classId];

                  return (
                    <tr
                      key={sel.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                            <FiUser />
                          </div>
                          <div>
                            {/* Student Name as Button */}
                            <button
                              onClick={() => setViewingSelection(sel)}
                              className="font-bold text-slate-700 text-sm hover:text-brand-primary hover:underline text-left"
                            >
                              {displayName}
                            </button>
                            <div className="text-xs text-slate-400">
                              {sel.studentEmail}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-5">
                        {classInfo ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                            {classInfo.name}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs italic">
                            Unassigned
                          </span>
                        )}
                      </td>

                      <td className="p-5">
                        <div className="flex flex-wrap gap-2">
                          {sel.selectedCCAs && sel.selectedCCAs.length > 0 ? (
                            sel.selectedCCAs.map((cca, idx) => (
                              <div
                                key={idx}
                                className="group/tag relative inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all cursor-pointer"
                              >
                                {cca.name}
                                {/* Delete specific CCA button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteCCA(sel.id, cca); // Call the prop
                                  }}
                                  className="ml-1 p-0.5 rounded-full hover:bg-red-200 text-indigo-400 hover:text-red-700 opacity-0 group-hover/tag:opacity-100 transition-all"
                                  title="Remove this activity only"
                                >
                                  <FiX size={12} />
                                </button>
                              </div>
                            ))
                          ) : (
                            <span className="text-slate-400 text-xs italic">
                              No activities selected
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-5">
                        <div className="text-slate-500 text-xs font-medium flex items-center gap-1.5">
                          <FiCalendar />
                          {sel.timestamp?.toDate().toLocaleDateString()}
                        </div>
                        <div className="text-slate-400 text-[10px] pl-5">
                          {sel.timestamp?.toDate().toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>

                      <td className="p-5 text-right">
                        <button
                          onClick={() => onResetStudent(sel.id)}
                          title="Reset Entire Selection (Wipe Clean)"
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-slate-400">
                    <FiActivity className="mx-auto text-3xl mb-2 opacity-20" />
                    <p>No selections found matching your search</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Details Modal */}
      <StudentDetailsModal
        isOpen={!!viewingSelection}
        onClose={() => setViewingSelection(null)}
        selection={viewingSelection}
        classMap={classMap}
      />
    </div>
  );
}
