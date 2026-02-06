import { useState, useEffect } from "react";
import {
  FiX,
  FiPlus,
  FiTrash2,
  FiCalendar,
  FiZap,
  FiRefreshCw,
} from "react-icons/fi";
import { db } from "../firebase"; // Import db
import { collection, query, where, getDocs } from "firebase/firestore"; // Import Firestore functions

export default function AddCCAModal({ isOpen, onClose, onSave, initialData }) {
  const [form, setForm] = useState({
    name: "",
    teacher: "",
    description: "",
    sessionDates: [],
    startTime: "",
    endTime: "",
    price: 0,
    currency: "IDR",
    maxSeats: "",
    venue: "",
    isActive: true,
  });

  const [tempDate, setTempDate] = useState("");

  // --- GENERATOR STATE ---
  const [showGenerator, setShowGenerator] = useState(false);
  const [genConfig, setGenConfig] = useState({
    startDate: "",
    endDate: "",
    selectedWeekdays: [], // 0 = Sunday, 1 = Monday, etc.
  });

  // --- NEW: AVAILABLE TEACHERS STATE ---
  const [availableTeachers, setAvailableTeachers] = useState([]);

  const WEEKDAYS = [
    { id: 1, label: "Mon" },
    { id: 2, label: "Tue" },
    { id: 3, label: "Wed" },
    { id: 4, label: "Thu" },
    { id: 5, label: "Fri" },
    { id: 6, label: "Sat" },
    { id: 0, label: "Sun" },
  ];

  // --- NEW: FETCH TEACHERS/ADMINS ---
  useEffect(() => {
    if (isOpen) {
      const fetchTeachers = async () => {
        try {
          const usersRef = collection(db, "users");
          // Query for users with role 'teacher' OR 'admin'
          const q = query(usersRef, where("role", "in", ["teacher", "admin"]));
          const snapshot = await getDocs(q);

          const names = snapshot.docs
            .map((doc) => {
              const data = doc.data();
              // Prefer displayName, fallback to name, then email
              return data.displayName || data.name || data.email;
            })
            .filter((name) => name && name.trim() !== ""); // Filter out empty names

          // Remove duplicates and sort alphabetically
          setAvailableTeachers([...new Set(names)].sort());
        } catch (error) {
          console.error("Error fetching teachers:", error);
        }
      };

      fetchTeachers();
    }
  }, [isOpen]);

  // Handle Edit vs Create Mode
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({
          ...initialData,
          sessionDates: initialData.sessionDates || [],
          price: initialData.price || 0,
          maxSeats: initialData.maxSeats === 0 ? "" : initialData.maxSeats,
        });
      } else {
        setForm({
          name: "",
          teacher: "",
          description: "",
          sessionDates: [],
          startTime: "",
          endTime: "",
          price: 0,
          currency: "IDR",
          maxSeats: "",
          venue: "",
          isActive: true,
        });
      }
      setTempDate("");
      setShowGenerator(false);
      setGenConfig({ startDate: "", endDate: "", selectedWeekdays: [] });
    }
  }, [isOpen, initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" && name === "isActive" ? checked : value,
    }));
  };

  // --- DATE MANAGEMENT LOGIC ---
  const handleAddDate = () => {
    if (!tempDate) return;
    if (form.sessionDates.includes(tempDate)) {
      alert("This date is already added.");
      return;
    }

    const newDates = [...form.sessionDates, tempDate].sort();
    setForm((prev) => ({ ...prev, sessionDates: newDates }));
    setTempDate("");
  };

  const handleRemoveDate = (dateToRemove) => {
    setForm((prev) => ({
      ...prev,
      sessionDates: prev.sessionDates.filter((d) => d !== dateToRemove),
    }));
  };

  // --- GENERATOR LOGIC ---
  const toggleGenWeekday = (dayId) => {
    setGenConfig((prev) => {
      const exists = prev.selectedWeekdays.includes(dayId);
      if (exists) {
        return {
          ...prev,
          selectedWeekdays: prev.selectedWeekdays.filter((d) => d !== dayId),
        };
      } else {
        return { ...prev, selectedWeekdays: [...prev.selectedWeekdays, dayId] };
      }
    });
  };

  const handleGenerateSessions = () => {
    if (
      !genConfig.startDate ||
      !genConfig.endDate ||
      genConfig.selectedWeekdays.length === 0
    ) {
      alert("Please select a Start Date, End Date, and at least one Weekday.");
      return;
    }

    const start = new Date(genConfig.startDate);
    const end = new Date(genConfig.endDate);

    if (start > end) {
      alert("Start date must be before End date.");
      return;
    }

    const generatedDates = [];
    const loopDate = new Date(start);

    // Loop through dates
    while (loopDate <= end) {
      if (genConfig.selectedWeekdays.includes(loopDate.getDay())) {
        // Format as YYYY-MM-DD
        const dateStr = loopDate.toISOString().split("T")[0];
        generatedDates.push(dateStr);
      }
      loopDate.setDate(loopDate.getDate() + 1);
    }

    if (generatedDates.length === 0) {
      alert("No dates matched your selection criteria.");
      return;
    }

    // Merge with existing dates, remove duplicates, and sort
    const combinedDates = [
      ...new Set([...form.sessionDates, ...generatedDates]),
    ].sort();

    setForm((prev) => ({ ...prev, sessionDates: combinedDates }));
    setShowGenerator(false); // Close generator
    setGenConfig({ startDate: "", endDate: "", selectedWeekdays: [] }); // Reset generator
  };

  const getDayName = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { weekday: "short" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-black text-slate-800">
            {initialData ? "Edit Activity" : "Add New Activity"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="ccaForm" onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Activity Name
                </label>
                <input
                  required
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Badminton Club"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 placeholder:font-normal"
                />
              </div>

              {/* MODIFIED TEACHER INPUT: HYBRID DROPDOWN/TEXT */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Instructor / Teacher
                </label>
                <input
                  required
                  type="text"
                  name="teacher"
                  list="teacher-options" // CONNECTS TO DATALIST
                  value={form.teacher}
                  onChange={handleChange}
                  placeholder="Select or type name..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  autoComplete="off"
                />
                <datalist id="teacher-options">
                  {availableTeachers.map((teacherName, index) => (
                    <option key={index} value={teacherName} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Venue / Location
                </label>
                <input
                  required
                  type="text"
                  name="venue"
                  value={form.venue}
                  onChange={handleChange}
                  placeholder="e.g. Sports Hall"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* 2. Schedule Section */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <h3 className="text-sm font-black text-slate-700 mb-4 flex items-center gap-2">
                <FiCalendar className="text-indigo-500" /> Session Schedule
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                {/* Time Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Start Time
                  </label>
                  <input
                    required
                    type="time"
                    name="startTime"
                    value={form.startTime}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    End Time
                  </label>
                  <input
                    required
                    type="time"
                    name="endTime"
                    value={form.endTime}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Date Selection */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Session Dates ({form.sessionDates.length})
                  </label>

                  {/* GENERATE BUTTON */}
                  <button
                    type="button"
                    onClick={() => setShowGenerator(!showGenerator)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100 hover:border-indigo-200 transition-all"
                  >
                    <FiZap size={12} />{" "}
                    {showGenerator ? "Hide Generator" : "Generate Sessions"}
                  </button>
                </div>

                {/* DATE GENERATOR PANEL */}
                {showGenerator && (
                  <div className="mb-4 p-4 bg-white border border-indigo-100 rounded-xl shadow-sm animate-in slide-in-from-top-2">
                    <h4 className="text-xs font-black text-indigo-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <FiRefreshCw
                        className={
                          genConfig.startDate && genConfig.endDate
                            ? "animate-spin-slow"
                            : ""
                        }
                      />
                      Auto-Generate Sessions
                    </h4>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                          From
                        </label>
                        <input
                          type="date"
                          value={genConfig.startDate}
                          onChange={(e) =>
                            setGenConfig({
                              ...genConfig,
                              startDate: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                          To
                        </label>
                        <input
                          type="date"
                          value={genConfig.endDate}
                          onChange={(e) =>
                            setGenConfig({
                              ...genConfig,
                              endDate: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">
                        Repeat On
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {WEEKDAYS.map((day) => (
                          <button
                            key={day.id}
                            type="button"
                            onClick={() => toggleGenWeekday(day.id)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                              genConfig.selectedWeekdays.includes(day.id)
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleGenerateSessions}
                        className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                      >
                        Generate Dates
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowGenerator(false)}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-500 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* MANUAL ADD INPUT */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="date"
                    value={tempDate}
                    onChange={(e) => setTempDate(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddDate}
                    disabled={!tempDate}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    <FiPlus /> Add
                  </button>
                </div>

                {/* Date List Chips */}
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {form.sessionDates.length > 0 ? (
                    form.sessionDates.map((date, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm shadow-sm group"
                      >
                        <span className="font-mono font-bold text-indigo-600 text-xs uppercase">
                          {getDayName(date)}
                        </span>
                        <span className="text-slate-700 font-medium">
                          {date}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDate(date)}
                          className="text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-xs italic">
                      No dates added yet.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Pricing & Capacity */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Price (IDR)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-2.5 text-slate-400 font-bold">
                    Rp
                  </span>
                  <input
                    type="number"
                    name="price"
                    min="0"
                    value={form.price}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Leave 0 for free activities
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Max Seats
                </label>
                <input
                  type="number"
                  name="maxSeats"
                  min="0"
                  placeholder="∞"
                  value={form.maxSeats}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* 4. Description */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Description
              </label>
              <textarea
                name="description"
                rows="3"
                value={form.description}
                onChange={handleChange}
                placeholder="Brief details about the activity..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              ></textarea>
            </div>

            {/* 5. Status Toggle */}
            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="block text-sm font-bold text-slate-700">
                  Activity Status
                </span>
                <span className="text-xs text-slate-500">
                  Hidden activities won't appear to students
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600 transition-colors"></div>
              </label>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-6 flex justify-end gap-3 rounded-b-2xl border-t border-slate-100 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="ccaForm"
            className="px-6 py-2.5 bg-indigo-600 border border-transparent rounded-xl text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
          >
            Save Activity
          </button>
        </div>
      </div>
    </div>
  );
}
