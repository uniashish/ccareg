import React from "react";
import {
  FiX,
  FiClock,
  FiCalendar,
  FiDollarSign,
  FiUsers,
  FiAlignLeft,
  FiMapPin,
  FiUserCheck,
  FiLayers,
} from "react-icons/fi";

export default function CCADetailsModal({
  isOpen,
  onClose,
  cca,
  classes = [],
}) {
  if (!isOpen || !cca) return null;

  // Helper to convert 24hr to 12hr for display
  const formatTime12hr = (timeStr) => {
    if (!timeStr) return "TBD";
    const [hours, minutes] = timeStr.split(":");
    let h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${minutes} ${ampm}`;
  };

  const assignedClassNames = classes
    .filter((cls) => cls.allowedCCAs?.includes(cca.id))
    .map((cls) => cls.name);

  const formatDay = (day) =>
    day && typeof day === "string" ? day.substring(0, 3) : day;

  // FIXED: Changed from 'booked' to 'enrolledCount' to match database
  const enrolledCount = cca.enrolledCount || 0;
  const maxSeats = cca.maxSeats || 0;

  // Calculate Status
  const isFull = maxSeats > 0 && enrolledCount >= maxSeats;
  const remainingSeats =
    maxSeats > 0 ? Math.max(0, maxSeats - enrolledCount) : "Unlimited";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="bg-indigo-600 p-6 flex justify-between items-start shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white leading-tight">
              {cca.name}
            </h2>
            <p className="text-indigo-100 text-sm mt-1 flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${cca.isActive !== false ? "bg-emerald-400" : "bg-rose-400"}`}
              ></span>
              {cca.isActive !== false ? "Active CCA" : "Inactive"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-indigo-600 shrink-0">
                <FiAlignLeft size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Description
                </p>
                <p className="text-slate-700 text-sm leading-relaxed">
                  {cca.description || "No description provided."}
                </p>
              </div>
            </div>

            <hr className="border-slate-100" />

            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              <div className="flex gap-3">
                <FiUserCheck
                  className="text-slate-400 mt-1 shrink-0"
                  size={18}
                />
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Teacher In-Charge
                  </p>
                  <p className="text-slate-800 text-sm font-semibold">
                    {cca.teacher || "Not Assigned"}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <FiMapPin className="text-slate-400 mt-1 shrink-0" size={18} />
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Venue
                  </p>
                  <p className="text-slate-800 text-sm font-semibold">
                    {cca.venue || "TBD"}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <FiCalendar
                  className="text-slate-400 mt-1 shrink-0"
                  size={18}
                />
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Days
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {cca.days && cca.days.length > 0 ? (
                      cca.days.map((d) => (
                        <span
                          key={d}
                          className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded uppercase"
                        >
                          {formatDay(d)}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500 text-sm">-</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <FiClock className="text-slate-400 mt-1 shrink-0" size={18} />
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Time
                  </p>
                  <p className="text-slate-800 text-sm font-semibold">
                    {formatTime12hr(cca.startTime)} -{" "}
                    {formatTime12hr(cca.endTime)}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <FiDollarSign
                  className="text-slate-400 mt-1 shrink-0"
                  size={18}
                />
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Price
                  </p>
                  <p className="text-slate-800 text-sm font-bold">
                    {cca.currency} {Number(cca.price).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <FiUsers className="text-slate-400 mt-1 shrink-0" size={18} />
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Capacity
                  </p>
                  <div className="flex flex-col">
                    {/* FIXED: Display logic for Full vs Remaining */}
                    <span
                      className={`text-sm font-bold ${isFull ? "text-red-500 uppercase tracking-wide" : "text-slate-800"}`}
                    >
                      {isFull
                        ? "CCA IS FULL"
                        : maxSeats > 0
                          ? `${remainingSeats} Remaining`
                          : "Unlimited"}
                    </span>
                    <span className="text-xs text-slate-400">
                      (Total: {maxSeats > 0 ? maxSeats : "Unlimited"})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-indigo-600 shrink-0">
                <FiLayers size={20} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Assigned To Classes
                </p>
                {assignedClassNames.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {assignedClassNames.map((name, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold border border-slate-200"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm italic">
                    Not assigned to any class yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-4 flex justify-end border-t border-slate-100 shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg text-sm hover:bg-slate-50 transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
