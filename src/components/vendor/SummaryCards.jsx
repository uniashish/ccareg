import React from "react";

export default function SummaryCards({
  summary,
  statusFilter,
  onStatusFilterChange,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-1.5">
      <button
        type="button"
        onClick={() => onStatusFilterChange("all")}
        className={`bg-white rounded-lg border p-1.5 sm:p-2 transition-colors ${
          statusFilter === "all"
            ? "border-slate-400 ring-2 ring-slate-200"
            : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
            Total Students
          </p>
          <p className="text-sm sm:text-base font-black text-slate-800">
            {summary.total}
          </p>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onStatusFilterChange("verified")}
        className={`bg-white rounded-lg border p-1.5 sm:p-2 transition-colors ${
          statusFilter === "verified"
            ? "border-emerald-400 ring-2 ring-emerald-100"
            : "border-emerald-200 hover:border-emerald-300"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-[9px] font-black uppercase tracking-wider text-emerald-500">
            Verified
          </p>
          <p className="text-sm sm:text-base font-black text-emerald-700">
            {summary.verified}
          </p>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onStatusFilterChange("pending")}
        className={`bg-white rounded-lg border p-1.5 sm:p-2 transition-colors ${
          statusFilter === "pending"
            ? "border-amber-400 ring-2 ring-amber-100"
            : "border-amber-200 hover:border-amber-300"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-[9px] font-black uppercase tracking-wider text-amber-500">
            Pending
          </p>
          <p className="text-sm sm:text-base font-black text-amber-700">
            {summary.pending}
          </p>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onStatusFilterChange("unpaid")}
        className={`bg-white rounded-lg border p-1.5 sm:p-2 transition-colors ${
          statusFilter === "unpaid"
            ? "border-rose-400 ring-2 ring-rose-100"
            : "border-rose-200 hover:border-rose-300"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-[9px] font-black uppercase tracking-wider text-rose-500">
            Unpaid
          </p>
          <p className="text-sm sm:text-base font-black text-rose-700">
            {summary.unpaid}
          </p>
        </div>
      </button>
    </div>
  );
}
