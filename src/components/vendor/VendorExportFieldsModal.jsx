import React from "react";
import { EXPORT_FIELDS } from "../../utils/vendorUtils";

export default function VendorExportFieldsModal({
  isOpen,
  onClose,
  format,
  selectedFields,
  onToggleField,
  onSelectAll,
  onClearAll,
  onConfirm,
}) {
  if (!isOpen) return null;

  const selectedFieldDefs = EXPORT_FIELDS.filter((field) =>
    selectedFields.includes(field.key),
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h3 className="text-lg font-black text-slate-800">
            Select fields to export
          </h3>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Choose the columns to include in the exported {format.toUpperCase()}{" "}
            file.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={onSelectAll}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={onClearAll}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold"
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-2 max-h-72 overflow-y-auto">
          {EXPORT_FIELDS.map((field) => {
            const checked = selectedFields.includes(field.key);

            return (
              <label
                key={field.key}
                className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 cursor-pointer hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggleField(field.key)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary/40"
                />
                <span className="text-sm font-semibold text-slate-700">
                  {field.label}
                </span>
              </label>
            );
          })}
        </div>

        <div className="px-5 py-4 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-bold text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!selectedFieldDefs.length}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm ${
              selectedFieldDefs.length
                ? "bg-brand-primary text-white hover:bg-indigo-700"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            Export {format.toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  );
}
