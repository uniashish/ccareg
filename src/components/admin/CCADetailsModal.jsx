import React, { useEffect, useState } from "react";
import {
  FiX,
  FiClock,
  FiCalendar,
  FiDollarSign,
  FiUsers,
  FiMapPin,
  FiUserCheck,
  FiLayers,
  FiBriefcase, // Used for Vendor Icon
} from "react-icons/fi";
import { db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";

export default function CCADetailsModal({
  isOpen,
  onClose,
  cca,
  classes = [],
}) {
  const [vendorName, setVendorName] = useState("Loading...");

  // --- FETCH VENDOR INFO ---
  useEffect(() => {
    if (isOpen && cca) {
      const fetchVendor = async () => {
        try {
          const vendorsRef = collection(db, "vendors");
          const snapshot = await getDocs(vendorsRef);

          let foundVendor = null;
          snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.associatedCCAs && Array.isArray(data.associatedCCAs)) {
              if (data.associatedCCAs.some((c) => c.id === cca.id)) {
                foundVendor = data.name;
              }
            }
          });

          setVendorName(foundVendor || "Internal / School Office");
        } catch (error) {
          console.error("Error fetching vendor:", error);
          setVendorName("Unknown");
        }
      };

      fetchVendor();
    }
  }, [isOpen, cca]);

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

  // Helper to format specific date string
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const enrolledCount = cca.enrolledCount || 0;
  const maxSeats = cca.maxSeats || 0;

  // Calculate Status
  const isFull = maxSeats > 0 && enrolledCount >= maxSeats;
  const remainingSeats = maxSeats > 0 ? maxSeats - enrolledCount : "Unlimited";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      ></div>

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 relative overflow-hidden shrink-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-2 bg-white/10 rounded-full hover:bg-white/20"
          >
            <FiX size={20} />
          </button>

          <div className="mt-2">
            <span
              className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 ${
                cca.isActive
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-slate-700 text-slate-400"
              }`}
            >
              {cca.isActive ? "Active Activity" : "Hidden / Inactive"}
            </span>
            <h2 className="text-2xl font-black tracking-tight leading-tight mb-1">
              {cca.name}
            </h2>
            <div className="flex items-center gap-2 text-slate-400 font-medium text-sm">
              <FiUserCheck /> {cca.teacher || "TBA"}
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                <FiUsers /> Enrollment
              </div>
              <div className="flex items-baseline gap-1">
                <span
                  className={`text-2xl font-black ${isFull ? "text-red-500" : "text-slate-800"}`}
                >
                  {enrolledCount}
                </span>
                <span className="text-slate-400 font-bold text-sm">
                  / {maxSeats || "∞"}
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 mt-1">
                {isFull ? "Full Capacity" : `${remainingSeats} spots left`}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                <FiDollarSign /> Fee
              </div>
              <div className="text-2xl font-black text-brand-primary">
                {Number(cca.price) > 0
                  ? `Rp ${Number(cca.price).toLocaleString()}`
                  : "Free"}
              </div>
              <p className="text-[10px] font-bold text-slate-400 mt-1">
                Per student
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-2">
              About
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              {cca.description || "No description provided."}
            </p>
          </div>

          {/* Key Details */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-2">
              Logistics
            </h3>

            {/* NEW: VENDOR INFO */}
            <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-indigo-500 shrink-0">
                <FiBriefcase />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">
                  Provider / Vendor
                </p>
                <p className="font-bold text-slate-700">{vendorName}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-indigo-500 shrink-0">
                <FiMapPin />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">
                  Venue
                </p>
                <p className="font-bold text-slate-700">{cca.venue || "TBD"}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-indigo-500 shrink-0">
                <FiClock />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">
                  Time
                </p>
                <p className="font-bold text-slate-700">
                  {formatTime12hr(cca.startTime)} -{" "}
                  {formatTime12hr(cca.endTime)}
                </p>
              </div>
            </div>

            {/* SESSION DATES LIST */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-start gap-4 mb-2">
                <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-indigo-500 shrink-0">
                  <FiCalendar />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mt-2">
                    Full Schedule
                  </p>
                </div>
              </div>

              <div className="pl-14 space-y-1">
                {cca.sessionDates && cca.sessionDates.length > 0 ? (
                  // Sort dates chronologically
                  [...cca.sessionDates].sort().map((dateStr, idx) => (
                    <div
                      key={idx}
                      className="flex gap-3 text-sm font-medium text-slate-600 border-l-2 border-slate-200 pl-3"
                    >
                      <span className="font-mono text-xs font-bold text-slate-400 w-6">
                        #{idx + 1}
                      </span>
                      {formatDate(dateStr)}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 italic">
                    No dates scheduled.
                  </p>
                )}
              </div>
            </div>

            {/* Assigned Classes */}
            <div className="flex items-start gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-indigo-500 shrink-0">
                <FiLayers />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-2">
                  Assigned To Classes
                </p>
                {assignedClassNames.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {assignedClassNames.map((name, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-white text-slate-600 rounded-lg text-xs font-bold border border-slate-200 shadow-sm"
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

        {/* Footer */}
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
