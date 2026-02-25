import React, { useState } from "react";

export default function ExportFieldsModal({
  isOpen,
  onClose,
  fields,
  selectedFields,
  onChangeFields,
  fontSize,
  onFontSizeChange,
  onExport,
}) {
  const [localFields, setLocalFields] = useState(
    selectedFields || fields.map((f) => f.key),
  );
  const [localFontSize, setLocalFontSize] = useState(fontSize || 12);

  const handleFieldChange = (key) => {
    setLocalFields((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key],
    );
  };

  const handleFontSizeChange = (e) => {
    setLocalFontSize(Number(e.target.value));
  };

  const handleExport = () => {
    onExport(localFields, localFontSize);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      ></div>
      <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 animate-in zoom-in-95 duration-200">
        <h2 className="text-lg font-bold mb-4">Export Options</h2>
        <div className="mb-4">
          <div className="font-bold text-slate-700 mb-2">
            Select Fields to Export:
          </div>
          <div className="flex flex-wrap gap-2">
            {fields.map((field) => (
              <label key={field.key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={localFields.includes(field.key)}
                  onChange={() => handleFieldChange(field.key)}
                />
                <span>{field.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="mb-4">
          <label className="font-bold text-slate-700 mb-2 block">
            Font Size for PDF:
          </label>
          <input
            type="number"
            min={8}
            max={32}
            value={localFontSize}
            onChange={handleFontSizeChange}
            className="border rounded px-2 py-1 w-20"
          />
          <span className="ml-2 text-xs text-slate-400">(Default: 12)</span>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 rounded bg-brand-primary text-white font-bold hover:opacity-90"
          >
            Export
          </button>
        </div>
      </div>
    </div>
  );
}
