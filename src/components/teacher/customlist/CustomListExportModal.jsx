import React, { useState } from "react";
import { FiX } from "react-icons/fi";

export default function CustomListExportModal({
  isOpen,
  onClose,
  onExport,
  exportFormat,
}) {
  const [selectedFields, setSelectedFields] = useState({
    studentName: true,
    studentEmail: true,
    className: true,
    ccaName: true,
    attendanceSummary: true,
    perSessionAttendance: true,
  });
  const [fontSize, setFontSize] = useState(12);

  if (!isOpen) return null;

  const fieldLabels = {
    studentName: "Student Name",
    studentEmail: "Student Email",
    className: "Class",
    ccaName: "CCA",
    attendanceSummary: "Attendance Summary (Present/Total)",
    perSessionAttendance: "Per-Session Attendance",
  };

  const handleFieldToggle = (field) => {
    setSelectedFields((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleExport = () => {
    onExport(selectedFields, fontSize);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">
            Export as {exportFormat === "csv" ? "CSV" : "PDF"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
          {/* Fields Selection */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-700">
              Select Fields to Export
            </h3>
            <div className="space-y-2">
              {Object.entries(fieldLabels).map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedFields[key]}
                    onChange={() => handleFieldToggle(key)}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Font Size for PDF */}
          {exportFormat === "pdf" && (
            <div className="space-y-3">
              <h3 className="font-bold text-slate-700">Font Size</h3>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="8"
                  max="16"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="flex-1 cursor-pointer"
                />
                <div className="w-12 px-3 py-2 bg-slate-100 rounded-lg text-center font-bold text-slate-700">
                  {fontSize}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Export
          </button>
        </div>
      </div>
    </>
  );
}
