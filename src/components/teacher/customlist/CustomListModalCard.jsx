import React, { useRef, useEffect } from "react";
import { FiX, FiUserPlus, FiDownload, FiChevronDown } from "react-icons/fi";

export default function CustomListModalCard({
  onClose,
  onAddStudent,
  isLoading,
  customList,
  onRemoveStudent,
  getAttendanceMap,
  completedDateKeysByCCA,
  formatDateLabel,
  onExportCSV,
  onExportPDF,
}) {
  const [exportOpen, setExportOpen] = React.useState(false);
  const exportMenuRef = useRef(null);

  // Close export menu on outside click
  useEffect(() => {
    if (!exportOpen) return;

    const handleClickOutside = (event) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target)
      ) {
        setExportOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [exportOpen]);

  return (
    <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 max-h-[90vh] sm:max-h-[85vh] flex flex-col">
      {/* Header with Close Button */}
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200">
        <h2 className="text-xl sm:text-2xl font-black text-slate-800">
          My List
        </h2>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-100"
        >
          <FiX size={24} />
        </button>
      </div>

      {/* Toolbar */}
      <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <button
            onClick={onAddStudent}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-black text-sm font-bold transition-colors bg-green-50 text-green-600 hover:bg-green-100"
          >
            <FiUserPlus size={18} />
            Add Student
          </button>

          {/* Export Button */}
          <div className="relative sm:ml-auto" ref={exportMenuRef}>
            <button
              onClick={() => setExportOpen(!exportOpen)}
              disabled={customList.length === 0}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-slate-300 text-sm font-bold transition-colors bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiDownload size={18} />
              Export
              <FiChevronDown
                size={16}
                className={`transition-transform ${exportOpen ? "rotate-180" : ""}`}
              />
            </button>

            {exportOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                <button
                  onClick={() => {
                    onExportCSV();
                    setExportOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 first:rounded-t-lg"
                >
                  Export as CSV
                </button>
                <button
                  onClick={() => {
                    onExportPDF();
                    setExportOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 last:rounded-b-lg border-t border-slate-200"
                >
                  Export as PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {isLoading ? (
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
                className="p-3 sm:p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 transition-colors"
              >
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-700 text-sm">
                      {student.studentName}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 break-words">
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
                                      const isPresent = attendanceMap[dateKey];
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
                    onClick={() => onRemoveStudent(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
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
  );
}
