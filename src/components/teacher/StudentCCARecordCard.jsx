import React from "react";

export default function StudentCCARecordCard({ cca, onClick }) {
  return (
    <div
      className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-3 flex flex-col gap-2 cursor-pointer hover:shadow-md transition-all"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="font-bold text-slate-800 text-base truncate">{cca.name}</div>
        {cca.category && (
          <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase ml-2">
            {cca.category}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span><strong>Teacher:</strong> {cca.teacherDisplay || cca.teacher || "TBA"}</span>
        {cca.venue && <span className="hidden xs:inline">| <strong>Venue:</strong> {cca.venue}</span>}
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span><strong>Sessions:</strong> {cca.sessionDates?.length || 0}</span>
        {cca.maxSeats && (
          <span>| <strong>Seats:</strong> {cca.enrolledCount || 0}/{cca.maxSeats}</span>
        )}
      </div>
      {cca.description && (
        <div className="text-xs text-slate-400 mt-1 line-clamp-2">{cca.description}</div>
      )}
    </div>
  );
}
