import React from "react";
import {
  FiX,
  FiUsers,
  FiCheck,
  FiXCircle,
  FiInfo,
  FiClock,
  FiMapPin,
  FiUser,
} from "react-icons/fi";

export default function ClassDetailsModal({
  isOpen,
  onClose,
  selectedClass,
  ccas = [],
}) {
  if (!isOpen || !selectedClass) return null;

  // Helper to convert 24hr to 12hr for display
  const formatTime12hr = (timeStr) => {
    if (!timeStr) return "TBD";
    const [hours, minutes] = timeStr.split(":");
    let h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${minutes} ${ampm}`;
  };

  const assignedCCAs = selectedClass.allowedCCAs
    ?.map((id) => ccas.find((cca) => cca.id === id))
    .filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="bg-gradient-to-r from-brand-primary to-brand-neutral p-8 shrink-0">
          <h2 className="text-2xl font-black text-white leading-tight uppercase tracking-tight">
            {selectedClass.name}
          </h2>
          <div className="flex items-center gap-3 mt-1">
            {selectedClass.isActive !== false ? (
              <span className="flex items-center gap-1 text-white text-xs font-bold uppercase bg-white/20 px-2 py-0.5 rounded">
                <FiCheck size={12} /> Active
              </span>
            ) : (
              <span className="flex items-center gap-1 text-white text-xs font-bold uppercase bg-brand-secondary/40 px-2 py-0.5 rounded">
                <FiXCircle size={12} /> Inactive
              </span>
            )}
          </div>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FiInfo className="text-brand-primary" /> Assigned CCA (
              {assignedCCAs?.length || 0})
            </h3>

            {assignedCCAs && assignedCCAs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {assignedCCAs.map((cca) => (
                  <div
                    key={cca.id}
                    className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 hover:border-brand-primary/30 transition-colors"
                  >
                    <p className="font-bold text-slate-800 text-sm mb-2">
                      {cca.name}
                    </p>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <FiUser className="text-brand-primary" size={12} />
                        <span>{cca.teacher || "Unassigned"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <FiClock className="text-brand-neutral" size={12} />
                        <span>
                          {formatTime12hr(cca.startTime)} -{" "}
                          {formatTime12hr(cca.endTime)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <FiMapPin className="text-brand-neutral" size={12} />
                        <span className="truncate">{cca.venue || "TBD"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                <p className="text-slate-400 text-sm italic">
                  No activities assigned to this class yet.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-50 p-6 flex justify-end border-t border-slate-100 shrink-0">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
