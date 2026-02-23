import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiDownload,
  FiX,
  FiUser,
} from "react-icons/fi";
import { db } from "../../firebase"; // Import db
import { collection, onSnapshot } from "firebase/firestore"; // Import Firestore methods
import ClassDetailsModal from "./ClassDetailsModal";

// --- SUB-COMPONENT: SELECTIONS MODAL ---
function ClassSelectionsModal({ isOpen, onClose, classData, selections }) {
  const [exportOpen, setExportOpen] = useState(false);
  const [studentFilter, setStudentFilter] = useState("");
  const exportMenuRef = useRef(null);

  // Filter selections for this specific class
  const classSelections = (selections || []).filter(
    (s) => s.classId === classData?.id,
  );

  const filteredSelections = classSelections.filter((selection) =>
    (selection.studentName || "")
      .toLowerCase()
      .includes(studentFilter.trim().toLowerCase()),
  );

  useEffect(() => {
    if (isOpen) {
      setStudentFilter("");
    }
  }, [isOpen, classData?.id]);

  const handleExportCSV = () => {
    if (classSelections.length === 0) return;

    // Define Headers
    const headers = ["Student Name", "Email", "Selected Activities", "Status"];

    // Format Rows
    const rows = classSelections.map((s) => {
      const activities = s.selectedCCAs
        ? s.selectedCCAs.map((c) => c.name).join("; ")
        : "";
      return [
        `"${s.studentName}"`,
        `"${s.studentEmail}"`,
        `"${activities}"`,
        `"${s.status || "Submitted"}"`,
      ];
    });

    // Combine into CSV string
    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");

    // Trigger Download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${classData?.name || "Class"}_Selections.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (classSelections.length === 0) return;

    const escapeHtml = (value) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    const rowsHtml = classSelections
      .map((s, idx) => {
        const activities = s.selectedCCAs?.length
          ? s.selectedCCAs.map((c) => c.name).join(", ")
          : "No selections";
        return `<tr>
          <td>${idx + 1}</td>
          <td>${escapeHtml(s.studentName)}</td>
          <td>${escapeHtml(s.studentEmail)}</td>
          <td>${escapeHtml(activities)}</td>
          <td>${escapeHtml(s.status || "Submitted")}</td>
        </tr>`;
      })
      .join("\n");

    const html = `
      <html>
        <head>
          <title>${escapeHtml(classData?.name || "Class")} Selections</title>
          <style>
            @page { size: A4 landscape; margin: 12mm; }
            body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:0;padding:12px;font-size:10px;color:#111}
            h2{font-size:13px;margin-bottom:6px}
            table{width:100%;border-collapse:collapse}
            th,td{border:1px solid #ddd;padding:6px;text-align:left;font-size:10px;vertical-align:top}
            th{background:#f3f4f6;font-weight:700}
          </style>
        </head>
        <body>
          <h2>${escapeHtml(classData?.name || "Class")} - Student Selections</h2>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Student Name</th>
                <th>Email</th>
                <th>Selected Activities</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </body>
      </html>
    `;

    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    setTimeout(() => {
      w.focus();
      w.print();
    }, 300);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target)
      ) {
        setExportOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setExportOpen(false);
      }
    };

    if (isOpen && exportOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, exportOpen]);

  if (!isOpen || !classData) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="relative bg-white rounded-3xl w-full max-w-4xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 shrink-0 flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <h3 className="text-2xl font-black tracking-tight">
                {classData.name}
              </h3>
              <input
                type="text"
                value={studentFilter}
                onChange={(e) => setStudentFilter(e.target.value)}
                placeholder="Filter by student name"
                className="w-full sm:w-72 px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-800 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
              />
            </div>
            <p className="text-slate-400 text-sm">
              Student Selections ({filteredSelections.length})
            </p>
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
          {filteredSelections.length > 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-black text-slate-800 uppercase text-xs tracking-wider w-12">
                      #
                    </th>
                    <th className="px-6 py-4 font-black text-slate-800 uppercase text-xs tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-4 font-black text-slate-800 uppercase text-xs tracking-wider">
                      Selections
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSelections.map((sel, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-slate-400 font-bold">
                        {idx + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">
                          {sel.studentName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {sel.studentEmail}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {sel.selectedCCAs && sel.selectedCCAs.length > 0 ? (
                            sel.selectedCCAs.map((cca, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-xs font-bold"
                              >
                                {cca.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 italic">
                              No selections
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center text-slate-400 mb-4">
                <FiUser size={32} />
              </div>
              <h4 className="text-slate-800 font-bold text-lg">
                {classSelections.length > 0 ? "No Match Found" : "No Data Yet"}
              </h4>
              <p className="text-slate-500 text-sm">
                {classSelections.length > 0
                  ? "No students match the current name filter."
                  : "No students from this class have submitted selections yet."}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-white flex justify-end gap-3 shrink-0">
          <div className="relative" ref={exportMenuRef}>
            <button
              type="button"
              onClick={() => setExportOpen((prev) => !prev)}
              disabled={classSelections.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-200 transition-all"
            >
              <FiDownload /> Export
            </button>

            {exportOpen && classSelections.length > 0 && (
              <div className="absolute right-0 bottom-full mb-2 w-40 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    handleExportCSV();
                    setExportOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleExportPDF();
                    setExportOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 border-t border-slate-100"
                >
                  Export PDF
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// --- MAIN COMPONENT ---
export default function ClassManager({
  classesList,
  ccas,
  onAddClick,
  onEditClick,
  onDeleteClick,
}) {
  const [viewingClass, setViewingClass] = useState(null); // For Details Modal (Existing)
  const [viewingSelectionsClass, setViewingSelectionsClass] = useState(null); // For Selections Modal (New)

  // --- NEW: FETCH SELECTIONS INTERNALLY ---
  const [selectionsData, setSelectionsData] = useState([]);

  useEffect(() => {
    // We subscribe to the selections collection directly here to ensure the modal has data
    // regardless of whether the parent component passes it down.
    const unsub = onSnapshot(collection(db, "selections"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSelectionsData(data);
    });
    return () => unsub();
  }, []);

  const availableCCAIds = useMemo(
    () => new Set(ccas.map((cca) => cca.id)),
    [ccas],
  );

  const classRegistrationCounts = useMemo(() => {
    return selectionsData.reduce((acc, selection) => {
      if (!selection.classId) return acc;
      acc[selection.classId] = (acc[selection.classId] || 0) + 1;
      return acc;
    }, {});
  }, [selectionsData]);

  return (
    <section className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
            Classes
          </h2>
          <p className="text-slate-500 mt-1">Manage Classes</p>
        </div>
        <button
          onClick={onAddClick}
          className="flex items-center gap-2 bg-brand-primary hover:opacity-90 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-brand-primary/20 active:scale-95"
        >
          <FiPlus size={20} /> Add New Class
        </button>
      </div>

      {/* Scrollable Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-y-auto max-h-[70vh]">
        <table className="w-full text-left border-collapse">
          {/* Sticky Header */}
          <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-wider text-xs w-16">
                #
              </th>
              <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-wider text-xs">
                Class Name
              </th>
              <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-wider text-xs text-center">
                Total CCA
              </th>
              <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-wider text-xs text-center">
                Students Registered
              </th>
              <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-wider text-xs text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {classesList.length > 0 ? (
              classesList.map((c, index) => {
                const totalCCAs = (c.allowedCCAs || []).filter((ccaId) =>
                  availableCCAIds.has(ccaId),
                ).length;
                const totalStudentsRegistered =
                  classRegistrationCounts[c.id] || 0;

                return (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="px-6 py-4 font-mono text-slate-400 font-bold text-sm">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4">
                      {/* CHANGED: Class Name is now a button triggering the modal */}
                      <button
                        onClick={() => setViewingSelectionsClass(c)}
                        className="font-bold text-brand-primary text-lg hover:underline decoration-2 underline-offset-4 text-left"
                      >
                        {c.name}
                      </button>
                      <div className="text-xs text-slate-400 font-medium mt-1">
                        Click to view selections
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setViewingClass(c)}
                        className="text-sm font-bold text-brand-primary hover:underline underline-offset-2"
                      >
                        {totalCCAs}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-10 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-bold">
                        {totalStudentsRegistered}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => onEditClick(c)}
                          className="flex items-center gap-1 px-3 py-2 text-brand-primary hover:bg-brand-primary/10 rounded-lg font-semibold transition-colors"
                        >
                          <FiEdit2 size={16} /> Edit
                        </button>
                        <button
                          onClick={() => onDeleteClick(c.id)}
                          className="flex items-center gap-1 px-3 py-2 text-brand-secondary hover:bg-brand-secondary/10 rounded-lg font-semibold transition-colors"
                        >
                          <FiTrash2 size={16} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className="px-8 py-12 text-center text-slate-400 italic"
                >
                  No classes found. Click "Add New Class" to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Existing Details Modal */}
      <ClassDetailsModal
        isOpen={!!viewingClass}
        onClose={() => setViewingClass(null)}
        selectedClass={viewingClass}
        ccas={ccas}
      />

      {/* NEW: Selections List Modal (Uses internally fetched selectionsData) */}
      <ClassSelectionsModal
        isOpen={!!viewingSelectionsClass}
        onClose={() => setViewingSelectionsClass(null)}
        classData={viewingSelectionsClass}
        selections={selectionsData}
      />
    </section>
  );
}
