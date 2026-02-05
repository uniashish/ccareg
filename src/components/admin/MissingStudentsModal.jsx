import React from "react";
import { FiX, FiDownload, FiAlertCircle, FiUser, FiGrid } from "react-icons/fi";

export default function MissingStudentsModal({
  isOpen,
  onClose,
  missingStudents,
}) {
  if (!isOpen) return null;

  // Function to download the specific list of missing students
  const handleExport = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Name,Email,Class\n" +
      missingStudents.map((s) => `${s.name},${s.email},${s.class}`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "missing_selections.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[85vh]">
        {/* HEADER */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-3xl">
          <div>
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <FiAlertCircle className="text-red-500" />
              Missing Selections
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Found{" "}
              <strong className="text-red-600">{missingStudents.length}</strong>{" "}
              students who have not submitted yet.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* CONTENT (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6">
          {missingStudents.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <p>
                Great news! No missing students found based on the uploaded
                list.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs uppercase tracking-widest text-slate-400 border-b border-slate-100">
                  <th className="pb-3 pl-2">Student Name</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Class</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-600">
                {missingStudents.map((student, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-slate-50 hover:bg-slate-50/50"
                  >
                    <td className="py-3 pl-2 font-bold text-slate-800 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-xs font-black">
                        {student.name.charAt(0)}
                      </div>
                      {student.name}
                    </td>
                    <td className="py-3">{student.email}</td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-500">
                        <FiGrid /> {student.class}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex justify-end">
          <button
            onClick={handleExport}
            disabled={missingStudents.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
          >
            <FiDownload />
            Export List to CSV
          </button>
        </div>
      </div>
    </div>
  );
}
