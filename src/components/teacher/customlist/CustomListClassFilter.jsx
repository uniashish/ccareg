import React from "react";

export default function CustomListClassFilter({
  classFilter,
  onClassFilterChange,
  uniqueClasses,
}) {
  return (
    <div className="p-4 bg-slate-50 border-b border-slate-200">
      <label className="flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Filter by Class: ({uniqueClasses.length})
        </span>
        <select
          value={classFilter}
          onChange={onClassFilterChange}
          className="flex-1 max-w-xs px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
        >
          <option value="">All Classes</option>
          {uniqueClasses.length === 0 ? (
            <option disabled>No classes found</option>
          ) : (
            uniqueClasses.map((className) => (
              <option key={className} value={className}>
                {className}
              </option>
            ))
          )}
        </select>
      </label>
    </div>
  );
}
