import React from "react";

export default function StudentCCARecordCard({ cca, onClick }) {
  return (
    <div
      className="relative overflow-hidden bg-[radial-gradient(circle_at_top_right,_#dbeafe_0%,_#fee2e2_100%)] p-4 rounded-xl border border-slate-300 shadow-[0_18px_24px_-18px_rgba(15,23,42,0.55),0_8px_10px_-8px_rgba(15,23,42,0.3),0_1px_0_rgba(255,255,255,0.85)_inset] hover:shadow-[0_28px_38px_-20px_rgba(15,23,42,0.6),0_12px_16px_-10px_rgba(15,23,42,0.35),0_1px_0_rgba(255,255,255,0.9)_inset] [transform:perspective(1200px)_rotateX(2deg)] hover:[transform:perspective(1200px)_rotateX(4deg)_translateY(-4px)] cursor-pointer transition-all duration-300 group mb-4"
      onClick={onClick}
    >
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-[linear-gradient(160deg,rgba(255,255,255,0.55)_0%,rgba(255,255,255,0.1)_35%,rgba(255,255,255,0)_70%)]" />
      <div className="flex justify-between items-start relative z-10">
        <h3 className="font-bold text-slate-800 text-sm group-hover:text-brand-primary transition-colors truncate">
          {cca.name}
        </h3>
        {cca.category && (
          <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase ml-2">
            {cca.category}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 relative z-10">
        <span className="truncate">
          <strong>Teacher:</strong> {cca.teacherDisplay || cca.teacher || "TBA"}
        </span>
        {cca.venue && (
          <span className="hidden xs:inline">
            | <strong>Venue:</strong> {cca.venue}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 relative z-10">
        <span>
          <strong>Sessions:</strong> {cca.sessionDates?.length || 0}
        </span>
        {cca.maxSeats && (
          <span>
            | <strong>Seats:</strong> {cca.enrolledCount || 0}/{cca.maxSeats}
          </span>
        )}
      </div>
      {cca.description && (
        <div className="text-xs text-slate-400 mt-2 line-clamp-2 relative z-10">
          {cca.description}
        </div>
      )}
    </div>
  );
}
