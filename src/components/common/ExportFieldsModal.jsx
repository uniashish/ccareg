import React, { useState } from "react";
import { FiDownload, FiSliders, FiType, FiX } from "react-icons/fi";

function ExportFieldsDialog({
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
    setLocalFields((prev) => {
      const next = prev.includes(key)
        ? prev.filter((f) => f !== key)
        : [...prev, key];
      onChangeFields?.(next);
      return next;
    });
  };

  const handleFontSizeChange = (e) => {
    const nextFontSize = Number(e.target.value);
    setLocalFontSize(nextFontSize);
    onFontSizeChange?.(nextFontSize);
  };

  const handleExport = () => {
    if (localFields.length === 0) return;
    onExport(localFields, localFontSize);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-brand-primary to-brand-neutral p-5 text-white flex items-start justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <FiSliders size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-black uppercase tracking-wide leading-tight">
                Export Options
              </h2>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/80 font-bold">
                Choose fields and PDF font size
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/15 transition-colors"
            aria-label="Close export options"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">
              Fields to Export
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {fields.map((field) => (
                <label
                  key={field.key}
                  className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm font-semibold cursor-pointer transition-all ${
                    localFields.includes(field.key)
                      ? "bg-brand-primary/10 border-brand-primary/30 text-brand-primary"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={localFields.includes(field.key)}
                    onChange={() => handleFieldChange(field.key)}
                    className="h-4 w-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary/40"
                  />
                  <span className="truncate">{field.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2.5">
              <FiType size={13} />
              PDF Font Size
            </div>

            <div className="flex items-center gap-3">
              <input
                type="number"
                min={8}
                max={32}
                value={localFontSize}
                onChange={handleFontSizeChange}
                className="w-24 px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              />
              <span className="text-xs font-medium text-slate-500">
                Recommended: 10–12
              </span>
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500 font-medium">
              {localFields.length} field{localFields.length === 1 ? "" : "s"}{" "}
              selected
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExport}
                disabled={localFields.length === 0}
                className="px-4 py-2.5 rounded-xl bg-brand-primary text-white font-bold text-sm inline-flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiDownload size={14} />
                Export PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExportFieldsModal({
  isOpen,
  onClose,
  fields = [],
  selectedFields,
  onChangeFields,
  fontSize,
  onFontSizeChange,
  onExport,
}) {
  if (!isOpen) return null;

  return (
    <ExportFieldsDialog
      onClose={onClose}
      fields={fields}
      selectedFields={selectedFields}
      onChangeFields={onChangeFields}
      fontSize={fontSize}
      onFontSizeChange={onFontSizeChange}
      onExport={onExport}
    />
  );
}
