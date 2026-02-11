import {
  FiUser,
  FiCheckCircle,
  FiCalendar,
  FiMapPin,
  FiClock,
  FiUsers,
  FiAlertCircle,
  FiLink,
  FiExternalLink,
} from "react-icons/fi";
import { formatTime12hr, formatPriceIDR } from "../../utils/formatters";

export default function CCACard({ cca, isSelected, onToggle }) {
  // 1. Calculate Availability
  const enrolled = cca.enrolledCount || 0;
  const max = cca.maxSeats || 0;
  const isFull = max > 0 && enrolled >= max;

  // 2. Calculate Percentage for Bar
  const percentage = max > 0 ? Math.min((enrolled / max) * 100, 100) : 0;

  // Helper to summarize schedule
  const getScheduleSummary = (dates) => {
    if (!dates || !Array.isArray(dates) || dates.length === 0) return "TBD";
    const days = [
      ...new Set(
        dates.map((d) =>
          new Date(d).toLocaleDateString("en-US", { weekday: "short" }),
        ),
      ),
    ];

    if (days.length === 1) return days[0];
    if (days.length <= 2) return days.join(" & ");
    return "Multiple Dates";
  };

  const handleClick = () => {
    // Only allow toggle if not full, OR if we are unselecting (removing) it
    if (!isFull || isSelected) {
      onToggle(cca);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`relative group flex flex-col h-full bg-white rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden ${
        isSelected
          ? "border-brand-primary shadow-xl shadow-brand-primary/10 ring-4 ring-brand-primary/10 scale-[1.02]"
          : isFull
            ? "border-slate-100 opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0"
            : "border-transparent shadow-sm hover:shadow-md hover:border-slate-200 hover:-translate-y-1"
      }`}
    >
      {/* SELECTION INDICATOR OVERLAY */}
      {isSelected && (
        <div className="absolute top-3 right-3 z-20 bg-brand-primary text-white p-1.5 rounded-full shadow-lg animate-in zoom-in spin-in-180 duration-300">
          <FiCheckCircle size={20} className="stroke-[3px]" />
        </div>
      )}

      {/* CARD BODY */}
      <div className="p-5 flex-1 flex flex-col gap-4">
        {/* Header Section */}
        <div>
          {/* Changed justify-between to justify-end since label is removed */}
          <div className="flex justify-end items-start gap-3 mb-1">
            {cca.price > 0 ? (
              <span className="text-emerald-600 font-bold text-sm bg-emerald-50 px-2 py-1 rounded-lg">
                {formatPriceIDR(cca.price)}
              </span>
            ) : (
              <span className="text-slate-400 font-bold text-xs bg-slate-50 px-2 py-1 rounded-lg">
                Free
              </span>
            )}
          </div>

          <h3
            className={`text-lg font-black leading-tight mb-2 ${
              isSelected ? "text-brand-primary" : "text-slate-800"
            }`}
          >
            {cca.name}
          </h3>

          <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
            {cca.description || "No description provided."}
          </p>

          {/* HYPERLINKS SECTION */}
          {cca.hyperlinks && cca.hyperlinks.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {cca.hyperlinks.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wide rounded-full hover:bg-indigo-100 transition-colors border border-indigo-100"
                >
                  <FiLink size={10} />
                  {link.label || "Link"}
                  <FiExternalLink size={10} />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 mt-auto bg-slate-50 p-3 rounded-xl border border-slate-100">
          {/* Instructor */}
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">
              Instructor
            </p>
            <div className="flex items-center gap-1.5 text-slate-700 text-[11px] font-bold truncate">
              <FiUser className="text-indigo-400 shrink-0" size={12} />
              <span className="truncate">{cca.teacher || "TBA"}</span>
            </div>
          </div>

          {/* Venue */}
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">
              Location
            </p>
            <div className="flex items-center gap-1.5 text-slate-700 text-[11px] font-bold truncate">
              <FiMapPin className="text-orange-400 shrink-0" size={12} />
              <span className="truncate">{cca.venue || "TBA"}</span>
            </div>
          </div>

          {/* Schedule Summary */}
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">
              Day(s)
            </p>
            <div className="flex items-center gap-1.5 text-slate-700 text-[11px] font-bold truncate">
              <FiCalendar className="text-purple-400 shrink-0" size={12} />
              <span>{getScheduleSummary(cca.sessionDates)}</span>
            </div>
          </div>

          {/* Time */}
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">
              Time
            </p>
            <div className="flex items-center gap-1.5 text-slate-700 text-[11px] font-bold truncate">
              <FiClock className="text-pink-400 shrink-0" size={12} />
              <span>
                {cca.startTime ? formatTime12hr(cca.startTime) : "?"} -{" "}
                {cca.endTime ? formatTime12hr(cca.endTime) : "?"}
              </span>
            </div>
          </div>
        </div>

        {/* NEW: Session Dates List */}
        {cca.sessionDates && cca.sessionDates.length > 0 && (
          <div className="mt-1">
            <p className="text-[9px] font-bold text-slate-400 uppercase mb-1.5">
              All Session Dates ({cca.sessionDates.length})
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 pr-1">
              {cca.sessionDates.sort().map((date) => (
                <span
                  key={date}
                  className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] text-slate-600 font-medium whitespace-nowrap shadow-sm"
                >
                  {new Date(date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer / Status Bar */}
      <div className="px-5 pb-4 pt-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <FiUsers size={10} />
            {isFull ? "Class Full" : `${max - enrolled} Spots Left`}
          </span>
          <span className="text-[10px] font-bold text-slate-300">
            {enrolled} / {max > 0 ? max : "∞"}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isFull
                ? "bg-red-400"
                : percentage > 80
                  ? "bg-amber-400"
                  : "bg-brand-primary"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {isFull && !isSelected && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-2xl">
            <span className="bg-red-50 text-red-600 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest shadow-sm border border-red-100 flex items-center gap-2">
              <FiAlertCircle /> Fully Booked
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
