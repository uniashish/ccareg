import React, { useState, useEffect } from "react";
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
  if (!isOpen || !classData) return null;

  // Filter selections for this specific class
  const classSelections = selections.filter((s) => s.classId === classData.id);

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
    link.setAttribute("download", `${classData.name}_Selections.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
        <div className="bg-slate-900 text-white p-6 shrink-0 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-black tracking-tight">
              {classData.name}
            </h3>
            <p className="text-slate-400 text-sm">
              Student Selections ({classSelections.length})
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
          {classSelections.length > 0 ? (
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
                  {classSelections.map((sel, idx) => (
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
              <h4 className="text-slate-800 font-bold text-lg">No Data Yet</h4>
              <p className="text-slate-500 text-sm">
                No students from this class have submitted selections yet.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-white flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleExportCSV}
            disabled={classSelections.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-200 transition-all"
          >
            <FiDownload /> Export CSV
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
              <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-wider text-xs text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {classesList.length > 0 ? (
              classesList.map((c, index) => {
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
                  colSpan="3"
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
