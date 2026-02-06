import React from "react";
import {
  FiEdit2,
  FiTrash2,
  FiClock,
  FiMapPin,
  FiUser,
  FiUsers,
  FiInfo,
  FiCalendar,
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

  // CHANGED: Format the Session Dates Summary
  const getScheduleSummary = (dates) => {
    if (!dates || !Array.isArray(dates) || dates.length === 0) return "TBD";

    // Get unique days
    const days = [
      ...new Set(
        dates.map((d) =>
          new Date(d).toLocaleDateString("en-US", { weekday: "short" }),
        ),
      ),
    ];

    if (days.length === 1) {
      return `${days[0]}s (${dates.length} Sessions)`;
    } else if (days.length <= 2) {
      return `${days.join(" & ")} (${dates.length} Sessions)`;
    } else {
      return `${dates.length} Scheduled Sessions`;
    }
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
      {/* HEADER */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0 pr-2">
          {/* Status Dot */}
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`w-2 h-2 rounded-full ${cca.isActive ? "bg-emerald-500" : "bg-slate-300"}`}
            ></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {cca.isActive ? "Active" : "Hidden"}
            </span>
          </div>
          <h3
            className="text-lg font-black text-slate-800 leading-tight line-clamp-2"
            title={cca.name}
          >
            {cca.name}
          </h3>
          <p className="text-xs font-bold text-brand-primary mt-1">
            {Number(cca.price) === 0
              ? "Free"
              : `Rp ${Number(cca.price).toLocaleString()}`}
          </p>
        </div>

        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => onEdit(cca)}
            className="p-2 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
            title="Edit"
          >
            <FiEdit2 size={16} />
          </button>
          <button
            onClick={() => onDelete(cca)}
            disabled={hasEnrollments}
            className={`p-2 rounded-lg transition-colors ${
              hasEnrollments
                ? "text-slate-200 cursor-not-allowed"
                : "hover:bg-red-50 text-slate-400 hover:text-red-600"
            }`}
            title={hasEnrollments ? "Cannot delete active class" : "Delete"}
          >
            <FiTrash2 size={16} />
          </button>
        </div>
      </div>

      {/* BODY INFO */}
      <div className="grid grid-cols-2 gap-y-4 gap-x-2 mb-4 flex-1">
        {/* CHANGED: Schedule Summary */}
        <div className="col-span-2">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
            Schedule
          </span>
          <div className="flex items-center gap-1.5 text-slate-700 text-xs font-bold">
            <FiCalendar className="text-brand-neutral shrink-0" size={14} />
            <span className="truncate">
              {getScheduleSummary(cca.sessionDates)}
            </span>
          </div>
        </div>

        {/* Time */}
        <div className="col-span-1">
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
        <div className="col-span-1">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
            Venue
          </span>
          <div className="flex items-start gap-1.5 text-slate-700 text-xs font-bold">
            <FiMapPin
              className="text-brand-neutral shrink-0 mt-0.5"
              size={14}
            />
            <span className="truncate">{cca.venue || "TBD"}</span>
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
        className="w-full py-2.5 bg-slate-50 hover:bg-brand-primary hover:text-white text-brand-primary text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-100 hover:border-brand-primary shadow-sm"
      >
        <FiInfo size={14} /> View Details & Enrollments
      </button>
    </div>
  );
}
