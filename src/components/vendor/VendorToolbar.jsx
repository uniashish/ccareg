import React, { useEffect, useRef, useState } from "react";
import { FiChevronDown, FiDownload, FiFilter, FiSearch } from "react-icons/fi";

export default function VendorToolbar({
  ccas,
  selectedCcaId,
  onSelectedCcaIdChange,
  classNames,
  selectedClassName,
  onSelectedClassNameChange,
  searchQuery,
  onSearchQueryChange,
  hasActiveFilters,
  onClearFilters,
  onExportCSV,
  onExportPDF,
  canExport,
}) {
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportRef.current && !exportRef.current.contains(event.target)) {
        setExportOpen(false);
      }
    };

    if (exportOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [exportOpen]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 sm:p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
      {ccas.length > 1 && (
        <div className="relative w-full md:w-72">
          <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            value={selectedCcaId}
            onChange={(event) => onSelectedCcaIdChange(event.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary text-sm font-bold text-slate-700 shadow-sm transition-all appearance-none"
          >
            <option value="all">All Vendor CCAs</option>
            {ccas.map((cca) => (
              <option key={cca.id} value={cca.id}>
                {cca.name}
              </option>
            ))}
          </select>
          <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      )}

      <div className="relative flex-1">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder="Filter by student name or class..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-sm font-semibold text-slate-700"
        />
      </div>

      <div className="relative w-full md:w-56">
        <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <select
          value={selectedClassName}
          onChange={(event) => onSelectedClassNameChange(event.target.value)}
          className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-sm font-bold text-slate-700 shadow-sm transition-all appearance-none"
        >
          <option value="all">All Classes</option>
          {classNames.map((className) => (
            <option key={className} value={className}>
              {className}
            </option>
          ))}
        </select>
        <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="w-full md:w-auto px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-bold text-sm transition-colors"
        >
          Clear Filters
        </button>
      )}

      <div className="relative w-full md:w-auto" ref={exportRef}>
        <button
          type="button"
          onClick={() => setExportOpen((prev) => !prev)}
          disabled={!canExport}
          className={`w-full md:w-auto justify-center px-4 py-2.5 rounded-xl border font-bold text-sm transition-colors inline-flex items-center gap-2 ${
            canExport
              ? "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
              : "bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed"
          }`}
        >
          <FiDownload size={15} /> Export
        </button>

        {exportOpen && canExport && (
          <div className="absolute left-0 right-0 md:left-auto md:right-0 mt-2 md:w-36 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
            <button
              type="button"
              onClick={() => {
                onExportCSV();
                setExportOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => {
                onExportPDF();
                setExportOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 border-t border-slate-100"
            >
              Export PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
