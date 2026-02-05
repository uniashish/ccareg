import React, { useState, useMemo } from "react";
import {
  FiSearch,
  FiDownload,
  FiUser,
  FiGrid,
  FiCalendar,
  FiTrash2,
  FiActivity,
  FiX, // <--- Import the X icon
} from "react-icons/fi";
import { downloadSelectionsCSV } from "../../utils/csvExporter";

export default function SelectionsManager({
  selections,
  users,
  classesList,
  onResetStudent,
  onDeleteCCA, // <--- Receive the function prop
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const classMap = useMemo(() => {
    return classesList.reduce((acc, cls) => {
      acc[cls.id] = cls;
      return acc;
    }, {});
  }, [classesList]);

  const filteredSelections = (selections || []).filter((s) => {
    const user = users ? users[s.studentUid] : null;
    const name = user?.displayName?.toLowerCase() || "";
    const email = s.studentEmail?.toLowerCase() || "";
    const term = searchTerm.toLowerCase();

    return name.includes(term) || email.includes(term);
  });

  return (
    <div className="animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Master List</h1>
          <p className="text-slate-500 text-sm mt-1">
            Total Submissions:{" "}
            <span className="font-bold text-brand-primary">
              {selections?.length || 0}
            </span>
          </p>
        </div>

        <div className="flex gap-3">
          <div className="relative group">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors" />
            <input
              type="text"
              placeholder="Search student..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 w-64 shadow-sm transition-all"
            />
          </div>

          <button
            onClick={() =>
              downloadSelectionsCSV(filteredSelections, users, classMap)
            }
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-600/20 transition-all active:scale-95 text-sm"
          >
            <FiDownload />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-widest text-slate-500 font-bold">
                <th className="p-5">Student</th>
                <th className="p-5">Class</th>
                <th className="p-5">Activities Selected</th>
                <th className="p-5">Submitted At</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredSelections.length > 0 ? (
                filteredSelections.map((sel) => {
                  const user = users ? users[sel.studentUid] : null;
                  const displayName = user?.displayName;
                  const email = sel.studentEmail || user?.email;
                  const finalName =
                    sel.studentName ||
                    user?.displayName ||
                    email?.split("@")[0] ||
                    "Unknown Student";

                  return (
                    <tr
                      key={sel.id}
                      className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-5">
                        <div
                          className={`font-bold ${
                            displayName
                              ? "text-slate-800"
                              : "text-slate-500 italic"
                          }`}
                        >
                          {finalName}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <FiUser size={10} /> {email}
                        </div>
                      </td>

                      <td className="p-5">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-600">
                          <FiGrid />
                          {classMap[sel.classId]?.name || "Unknown Class"}
                        </div>
                      </td>

                      <td className="p-5">
                        <div className="flex flex-col gap-2">
                          {sel.selectedCCAs.map((cca, i) => (
                            <div
                              key={i}
                              // Added border and padding for better button placement
                              className="flex items-center justify-between gap-3 text-slate-700 font-medium text-xs bg-slate-50 border border-slate-100 p-2 rounded-lg"
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 flex items-center justify-center bg-brand-primary/10 text-brand-primary rounded-full text-[9px] font-black">
                                  {i + 1}
                                </span>
                                {cca.name}
                              </div>

                              {/* THE DELETE BUTTON */}
                              {onDeleteCCA && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (
                                      window.confirm(
                                        `Are you sure you want to remove "${cca.name}" from ${finalName}'s selection?`,
                                      )
                                    ) {
                                      onDeleteCCA(sel.id, cca);
                                    }
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded shadow-sm transition-all"
                                  title="Remove this activity only"
                                >
                                  <FiX size={14} />
                                </button>
                              )}
                            </div>
                          ))}
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
    </div>
  );
}
