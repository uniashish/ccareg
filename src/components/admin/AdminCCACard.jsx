import React from "react";
import {
  FiEdit2,
  FiTrash2,
  FiClock,
  FiMapPin,
  FiUser,
  FiUsers,
  FiInfo,
} from "react-icons/fi";

export default function AdminCCACard({ cca, onEdit, onDelete, onViewDetails }) {
  // --- HELPERS ---
  const formatTime12hr = (timeStr) => {
    if (!timeStr) return "TBD";
    const [hours, minutes] = timeStr.split(":");
    let h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${minutes} ${ampm}`;
  };

  const formatDays = (days) => {
    if (!days || !Array.isArray(days)) return "";
    return days.map((day) => day.substring(0, 3)).join(", ");
  };

  // Check if CCA is fully booked
  const isFull = cca.maxSeats && cca.enrolledCount >= cca.maxSeats;

  // Check if CCA has active enrollments (cannot delete)
  const hasEnrollments = cca.enrolledCount > 0;

  return (
    <div
      className={`w-full snap-center bg-white p-6 rounded-3xl border shadow-sm hover:shadow-md transition-all group relative flex flex-col h-full min-h-[290px] ${
        isFull ? "border-red-500" : "border-slate-100"
      }`}
    >
      {/* ACTION BUTTONS */}
      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(cca);
          }}
          className="p-2 bg-white/90 shadow-sm hover:bg-brand-primary hover:text-white text-slate-500 rounded-lg transition-colors border border-slate-100"
          title="Edit CCA"
        >
          <FiEdit2 size={14} />
        </button>

        {/* DELETE BUTTON (Modified) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!hasEnrollments) onDelete(cca.id);
          }}
          disabled={hasEnrollments}
          className={`p-2 bg-white/90 shadow-sm rounded-lg transition-colors border border-slate-100 ${
            hasEnrollments
              ? "text-slate-300 cursor-not-allowed"
              : "hover:bg-red-500 hover:text-white text-slate-500 cursor-pointer"
          }`}
          // Tooltip for disabled state
          title={
            hasEnrollments
              ? "Cannot delete: This CCA is allocated to classes and students have already selected it."
              : "Delete CCA"
          }
        >
          <FiTrash2 size={14} />
        </button>
      </div>

      {/* HEADER INFO */}
      <div className="mb-5 pr-10">
        <h3 className="font-black text-lg text-slate-800 leading-tight mb-1.5 break-words">
          {cca.name}
        </h3>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          {formatDays(cca.days)}
        </p>
      </div>

      {/* DETAILS GRID */}
      <div className="grid grid-cols-2 gap-y-4 gap-x-3 mb-5 mt-auto">
        {/* Time */}
        <div>
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
            Time
          </span>
          <div className="flex items-center gap-1.5 text-slate-700 text-xs font-bold">
            <FiClock className="text-brand-neutral shrink-0" size={14} />
            <span className="whitespace-nowrap">
              {formatTime12hr(cca.startTime)} - {formatTime12hr(cca.endTime)}
            </span>
          </div>
        </div>

        {/* Venue */}
        <div>
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
            Venue
          </span>
          <div className="flex items-start gap-1.5 text-slate-700 text-xs font-bold">
            <FiMapPin
              className="text-brand-neutral shrink-0 mt-0.5"
              size={14}
            />
            <span className="leading-snug break-words">
              {cca.venue || "TBD"}
            </span>
          </div>
        </div>

        {/* Teacher */}
        <div>
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
            Teacher
          </span>
          <div className="flex items-start gap-1.5 text-slate-700 text-xs font-bold">
            <FiUser className="text-brand-neutral shrink-0 mt-0.5" size={14} />
            <span className="leading-snug break-words">
              {cca.teacher || "Staff"}
            </span>
          </div>
        </div>

        {/* Capacity */}
        <div>
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
            Capacity
          </span>
          <div
            className={`flex items-center gap-1.5 text-xs font-bold ${
              isFull ? "text-red-500" : "text-slate-700"
            }`}
          >
            <FiUsers
              className={
                isFull ? "text-red-500 shrink-0" : "text-brand-neutral shrink-0"
              }
              size={14}
            />
            <span className="whitespace-nowrap">
              {cca.maxSeats
                ? `${cca.enrolledCount || 0}/${cca.maxSeats} Seats`
                : "Unlimited"}
            </span>
          </div>
        </div>
      </div>

      {/* FOOTER BUTTON */}
      <button
        onClick={() => onViewDetails(cca)}
        className="w-full py-2.5 bg-slate-50 hover:bg-brand-primary hover:text-white text-brand-primary text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-2 border border-transparent hover:border-brand-primary"
      >
        <FiInfo size={14} /> Full Details
      </button>
    </div>
  );
}
