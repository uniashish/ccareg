import React from "react";
import { FiX } from "react-icons/fi";
import CustomListStudentsTable from "./CustomListStudentsTable";
import CustomListClassFilter from "./CustomListClassFilter";

export default function CustomListAddStudentModal({
  isOpen,
  onClose,
  onCancel,
  classFilter,
  onClassFilterChange,
  uniqueClasses,
  filteredSelections,
  enrichedSelectionsCount,
  selectedCheckboxes,
  onToggleCheckbox,
  onAddStudents,
  customListIds,
}) {
  if (!isOpen) return null;

  const hasSelected = Object.values(selectedCheckboxes).some((value) => value);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-2xl font-black text-slate-800">
            Select Students
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-100"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Class Filter */}
        <CustomListClassFilter
          classFilter={classFilter}
          onClassFilterChange={onClassFilterChange}
          uniqueClasses={uniqueClasses}
        />

        {/* Students Table */}
        <CustomListStudentsTable
          filteredSelections={filteredSelections}
          enrichedSelectionsCount={enrichedSelectionsCount}
          selectedCheckboxes={selectedCheckboxes}
          customListIds={customListIds}
          onToggleCheckbox={onToggleCheckbox}
        />

        {/* Footer with Action Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onAddStudents}
            disabled={!hasSelected}
            className={`px-4 py-2 rounded-xl border border-black font-bold transition-colors ${
              hasSelected
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            Add Selected
          </button>
        </div>
      </div>
    </div>
  );
}
