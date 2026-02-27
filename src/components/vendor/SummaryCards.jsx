import React from "react";

export default function SummaryCards({
  summary,
  statusFilter,
  onStatusFilterChange,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
      <button
        type="button"
        onClick={() => onStatusFilterChange("all")}
        className={`bg-white rounded-xl border p-3 sm:p-4 text-left transition-colors ${
          statusFilter === "all"
            ? "border-slate-400 ring-2 ring-slate-200"
            : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
          Visible Rows
        </p>
        <p className="text-lg sm:text-xl font-black text-slate-800 mt-1">
          {summary.total}
        </p>
      </button>

      <button
        type="button"
        onClick={() => onStatusFilterChange("verified")}
        className={`bg-white rounded-xl border p-3 sm:p-4 text-left transition-colors ${
          statusFilter === "verified"
            ? "border-emerald-400 ring-2 ring-emerald-100"
            : "border-emerald-200 hover:border-emerald-300"
        }`}
      >
        <p className="text-[10px] font-black uppercase tracking-wider text-emerald-500">
          Verified
        </p>
        <p className="text-lg sm:text-xl font-black text-emerald-700 mt-1">
          {summary.verified}
        </p>
      </button>

      <button
        type="button"
        onClick={() => onStatusFilterChange("pending")}
        className={`bg-white rounded-xl border p-3 sm:p-4 text-left transition-colors ${
          statusFilter === "pending"
            ? "border-amber-400 ring-2 ring-amber-100"
            : "border-amber-200 hover:border-amber-300"
        }`}
      >
        <p className="text-[10px] font-black uppercase tracking-wider text-amber-500">
          Pending
        </p>
        <p className="text-lg sm:text-xl font-black text-amber-700 mt-1">
          {summary.pending}
        </p>
      </button>

      <button
        type="button"
        onClick={() => onStatusFilterChange("unpaid")}
        className={`bg-white rounded-xl border p-3 sm:p-4 text-left transition-colors ${
          statusFilter === "unpaid"
            ? "border-rose-400 ring-2 ring-rose-100"
            : "border-rose-200 hover:border-rose-300"
        }`}
      >
        <p className="text-[10px] font-black uppercase tracking-wider text-rose-500">
          Unpaid
        </p>
        <p className="text-lg sm:text-xl font-black text-rose-700 mt-1">
          {summary.unpaid}
        </p>
      </button>
    </div>
  );
}
