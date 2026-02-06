import {
  FiUser,
  FiCheckCircle,
  FiCalendar,
  FiMapPin,
  FiClock,
  FiUsers,
  FiAlertCircle,
} from "react-icons/fi";
import { formatTime12hr, formatPriceIDR } from "../../utils/formatters";

export default function CCACard({ cca, isSelected, onToggle }) {
  // 1. Calculate Availability
  const enrolled = cca.enrolledCount || 0;
  const max = cca.maxSeats || 0;
  const isFull = max > 0 && enrolled >= max;

  // 2. Calculate Percentage for Bar
  const percentage = max > 0 ? Math.min((enrolled / max) * 100, 100) : 0;

  // CHANGED: Helper to summarize schedule
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
      className={`relative p-6 rounded-[2rem] border-2 transition-all cursor-pointer group flex flex-col min-h-[240px] ${
        isSelected
          ? "border-brand-primary bg-brand-primary/5 shadow-lg"
          : isFull
            ? "border-slate-100 bg-slate-50 opacity-60 grayscale cursor-not-allowed"
            : "border-white bg-white hover:border-brand-primary/20 shadow-sm"
      }`}
    >
      {/* SELECTION CHECKMARK */}
      {isSelected && (
        <div className="absolute top-4 right-4 text-brand-primary animate-in zoom-in spin-in-90 duration-300">
          <FiCheckCircle size={28} className="fill-brand-primary text-white" />
        </div>
      )}

      {/* HEADER */}
      <div className="mb-4 pr-8">
        <h3
          className={`font-black text-lg leading-tight mb-1 ${
            isSelected ? "text-brand-primary" : "text-slate-800"
          }`}
        >
          {cca.name}
        </h3>
        <p className="text-sm font-bold text-slate-400">
          {formatPriceIDR(cca.price)}
        </p>
      </div>

      {/* INFO GRID */}
      <div className="grid grid-cols-2 gap-y-3 gap-x-1 mb-4 flex-1">
        <div className="col-span-1 space-y-1">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            Schedule
          </p>
          <div className="flex items-center gap-1.5 text-slate-700 text-xs font-bold">
            <FiCalendar className="text-brand-neutral shrink-0" size={14} />
            <span>{getScheduleSummary(cca.sessionDates)}</span>
          </div>
        </div>

        <div className="col-span-1 space-y-1 text-right">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            Teacher
          </p>
          <div className="flex items-center justify-end gap-1.5 text-slate-700 text-xs font-bold">
            <FiUser className="text-brand-neutral shrink-0" size={14} />
            <span className="truncate max-w-[80px]">
              {cca.teacher || "Staff"}
            </span>
          </div>
        </div>

        <div className="col-span-1 space-y-1">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            Location
          </p>
          <div className="flex items-start gap-1.5 text-slate-700 text-xs font-bold flex-wrap">
            <FiMapPin
              className="text-brand-neutral shrink-0 mt-0.5"
              size={14}
            />
            <span>{cca.venue || "TBD"}</span>
          </div>
        </div>

        <div className="col-span-1 space-y-1 text-right">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            Time Slot
          </p>
          <div className="flex items-center justify-end gap-1.5 text-slate-600 text-[10px] font-bold">
            <FiClock className="text-brand-neutral shrink-0" size={14} />
            <span className="whitespace-nowrap">
              {formatTime12hr(cca.startTime)} - {formatTime12hr(cca.endTime)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-center">
        {/* NEW: FULL STATUS BADGE */}
        {isFull && !isSelected ? (
          <span className="text-red-500 text-[9px] font-black uppercase tracking-widest bg-red-50 px-2 py-1 rounded-lg flex items-center gap-1 w-full justify-center">
            <FiAlertCircle size={10} /> Fully Booked
          </span>
        ) : (
          <>
            <div className="flex-1 mr-4">
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    percentage > 80 ? "bg-amber-400" : "bg-brand-primary"
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider shrink-0">
              {enrolled}/{max} Seats
            </span>
          </>
        )}
      </div>
    </div>
  );
}
