import {
  FiUser,
  FiCheckCircle,
  FiCalendar,
  FiMapPin,
  FiClock,
  FiUsers,
  FiAlertCircle,
} from "react-icons/fi";
import {
  formatTime12hr,
  formatPriceIDR,
  formatDaysShort,
} from "../../utils/formatters";

export default function CCACard({ cca, isSelected, onToggle }) {
  // 1. Calculate Availability
  const enrolled = cca.enrolledCount || 0;
  const max = cca.maxSeats || 0;
  const isFull = max > 0 && enrolled >= max;

  // 2. Calculate Percentage for Bar
  const percentage = max > 0 ? Math.min((enrolled / max) * 100, 100) : 0;

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
      <div className="flex justify-between items-start mb-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-black text-lg text-slate-800 truncate leading-tight">
            {cca.name}
          </h3>
          <p className="text-brand-primary font-bold text-[11px] uppercase flex items-center gap-1.5 mt-1">
            <FiUser size={12} /> {cca.teacher || "Staff"}
          </p>
        </div>
        {isSelected && (
          <FiCheckCircle className="text-brand-primary text-2xl shrink-0 ml-2" />
        )}
      </div>

      {/* NEW: SEAT PROGRESS BAR */}
      <div className="mb-4">
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isFull ? "bg-red-400" : "bg-brand-primary"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-bold mt-1">
          <span className={isFull ? "text-red-500" : "text-slate-500"}>
            {max > 0 ? `${enrolled}/${max} Seats Taken` : "Unlimited Seats"}
          </span>
          {isFull && <span className="text-red-500 uppercase">Full</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-y-4 gap-x-4 mb-2">
        <div className="col-span-1 space-y-1">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            Schedule
          </p>
          <div className="flex items-start gap-1.5 text-slate-700 text-xs font-bold flex-wrap">
            <FiCalendar
              className="text-brand-neutral shrink-0 mt-0.5"
              size={14}
            />
            <span>{formatDaysShort(cca.days)}</span>
          </div>
        </div>

        <div className="col-span-1 space-y-1 text-right">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            Price
          </p>
          <div className="flex items-center justify-end gap-0.5 text-brand-primary text-[11px] font-black">
            <span>{formatPriceIDR(cca.price)}</span>
          </div>
        </div>

        <div className="col-span-1 space-y-1">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            Venue
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
          <span className="text-brand-primary text-[9px] font-black uppercase tracking-widest">
            {isSelected ? "Selected" : "Click to Select"}
          </span>
        )}
      </div>
    </div>
  );
}
