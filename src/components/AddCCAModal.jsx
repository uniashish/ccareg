import { useState, useEffect } from "react";
import {
  FiX,
  FiPlus,
  FiTrash2,
  FiCalendar,
  FiZap,
  FiRefreshCw,
  FiLink,
} from "react-icons/fi";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function AddCCAModal({ isOpen, onClose, onSave, initialData }) {
  const [form, setForm] = useState({
    name: "",
    teacher: "",
    description: "",
    hyperlinks: [], // Hyperlinks array
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
    selectedWeekdays: [],
  });

  // --- AVAILABLE TEACHERS STATE ---
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

  useEffect(() => {
    if (!isOpen) return;
    const fetchTeachers = async () => {
      try {
        const q = query(
          collection(db, "users"),
          where("role", "==", "teacher"),
        );
        const snapshot = await getDocs(q);
        const teacherList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAvailableTeachers(teacherList);
      } catch (error) {
        console.error("Error fetching teachers:", error);
      }
    };
    fetchTeachers();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({
          ...initialData,
          hyperlinks: initialData.hyperlinks || [],
        });
      } else {
        setForm({
          name: "",
          teacher: "",
          description: "",
          hyperlinks: [],
          sessionDates: [],
          startTime: "",
          endTime: "",
          price: 0,
          currency: "IDR",
          maxSeats: "",
          venue: "",
          isActive: true,
        });
        setTempDate("");
        setGenConfig({ startDate: "", endDate: "", selectedWeekdays: [] });
        setShowGenerator(false);
      }
    }
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // --- HYPERLINK HANDLERS ---
  const handleAddLink = () => {
    setForm((prev) => ({
      ...prev,
      hyperlinks: [...prev.hyperlinks, { label: "", url: "" }],
    }));
  };

  const handleLinkChange = (index, field, value) => {
    const updatedLinks = [...form.hyperlinks];
    updatedLinks[index][field] = value;
    setForm((prev) => ({ ...prev, hyperlinks: updatedLinks }));
  };

  const handleRemoveLink = (index) => {
    const updatedLinks = form.hyperlinks.filter((_, i) => i !== index);
    setForm((prev) => ({ ...prev, hyperlinks: updatedLinks }));
  };

  // --- DATE HANDLERS ---
  const handleAddDate = () => {
    if (tempDate && !form.sessionDates.includes(tempDate)) {
      setForm((prev) => ({
        ...prev,
        sessionDates: [...prev.sessionDates, tempDate].sort(),
      }));
      setTempDate("");
    }
  };

  const handleRemoveDate = (dateToRemove) => {
    setForm((prev) => ({
      ...prev,
      sessionDates: prev.sessionDates.filter((d) => d !== dateToRemove),
    }));
  };

  // --- GENERATOR LOGIC ---
  const toggleWeekday = (id) => {
    setGenConfig((prev) => {
      const current = prev.selectedWeekdays;
      if (current.includes(id)) {
        return { ...prev, selectedWeekdays: current.filter((d) => d !== id) };
      } else {
        return { ...prev, selectedWeekdays: [...current, id] };
      }
    });
  };

  const handleGenerateDates = () => {
    const { startDate, endDate, selectedWeekdays } = genConfig;
    if (!startDate || !endDate || selectedWeekdays.length === 0) {
      alert(
        "Please fill in start date, end date, and select at least one weekday.",
      );
      return;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    const generated = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (selectedWeekdays.includes(d.getDay())) {
        generated.push(d.toISOString().split("T")[0]);
      }
    }
    const uniqueDates = Array.from(
      new Set([...form.sessionDates, ...generated]),
    ).sort();
    setForm((prev) => ({ ...prev, sessionDates: uniqueDates }));
    setShowGenerator(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      ></div>

      <div className="relative bg-white rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-2xl font-black text-slate-800">
            {initialData ? "Edit Activity" : "New Activity"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Scrollable Form */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="ccaForm" onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Top Grid: Name, Teacher, Venue */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Activity Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700"
                  placeholder="e.g. Basketball, Chess Club"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Teacher / Instructor
                </label>
                {availableTeachers.length > 0 ? (
                  <select
                    name="teacher"
                    value={form.teacher}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="">-- Select Teacher --</option>
                    {availableTeachers.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name} ({t.email})
                      </option>
                    ))}
                    <option value="External Vendor">External Vendor</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    name="teacher"
                    value={form.teacher}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Instructor Name"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Venue / Location
                </label>
                <input
                  type="text"
                  name="venue"
                  value={form.venue}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. Sports Hall"
                />
              </div>
            </div>

            {/* 2. Timing & Price Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  name="startTime"
                  value={form.startTime}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  name="endTime"
                  value={form.endTime}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Max Seats
                </label>
                <input
                  type="number"
                  name="maxSeats"
                  value={form.maxSeats}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Unlimited"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Price ({form.currency})
                </label>
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* 3. Session Dates Manager */}
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                  <FiCalendar /> Session Dates
                </label>
                <button
                  type="button"
                  onClick={() => setShowGenerator(!showGenerator)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-white px-2 py-1 rounded shadow-sm"
                >
                  <FiRefreshCw
                    className={showGenerator ? "animate-spin" : ""}
                  />
                  {showGenerator ? "Hide Generator" : "Auto-Generate"}
                </button>
              </div>

              {/* Generator UI */}
              {showGenerator && (
                <div className="mb-4 bg-white p-3 rounded-xl shadow-sm border border-indigo-100 animate-in slide-in-from-top-2">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase">
                        Start Date
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
                        className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase">
                        End Date
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
                        className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="text-xs font-bold text-slate-400 uppercase block mb-1">
                      Repeats On
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {WEEKDAYS.map((day) => (
                        <button
                          key={day.id}
                          type="button"
                          onClick={() => toggleWeekday(day.id)}
                          className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                            genConfig.selectedWeekdays.includes(day.id)
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300"
                          }`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateDates}
                    className="w-full py-2 bg-indigo-100 text-indigo-700 font-bold rounded-lg hover:bg-indigo-200 transition-colors text-xs flex items-center justify-center gap-2"
                  >
                    <FiZap /> Generate Dates
                  </button>
                </div>
              )}

              <div className="flex gap-2 mb-3">
                <input
                  type="date"
                  value={tempDate}
                  onChange={(e) => setTempDate(e.target.value)}
                  className="flex-1 px-3 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddDate}
                  disabled={!tempDate}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiPlus />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {form.sessionDates.length > 0 ? (
                  form.sessionDates.map((date) => (
                    <span
                      key={date}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-indigo-100 text-indigo-700 text-xs font-bold rounded-full shadow-sm"
                    >
                      {date}
                      <button
                        type="button"
                        onClick={() => handleRemoveDate(date)}
                        className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-red-100 hover:text-red-500 transition-colors"
                      >
                        <FiX size={12} />
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-indigo-300 italic">
                    No dates added yet.
                  </span>
                )}
              </div>
            </div>

            {/* 4. Description (Moved Here) */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                placeholder="Brief description of the activity..."
              />
            </div>

            {/* 5. NEW: External Links & Resources (Placed Below Description) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-bold text-slate-700">
                  External Links & Resources
                </label>
                <button
                  type="button"
                  onClick={handleAddLink}
                  className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:text-indigo-800"
                >
                  <FiPlus /> Add Link
                </button>
              </div>
              <div className="space-y-2">
                {form.hyperlinks.map((link, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Label (e.g. Brochure)"
                      value={link.label}
                      onChange={(e) =>
                        handleLinkChange(index, "label", e.target.value)
                      }
                      className="flex-1 px-4 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="URL (https://...)"
                      value={link.url}
                      onChange={(e) =>
                        handleLinkChange(index, "url", e.target.value)
                      }
                      className="flex-[2] px-4 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveLink(index)}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                      title="Remove Link"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
                {form.hyperlinks.length === 0 && (
                  <p className="text-xs text-slate-400 italic">
                    No links added yet. Click "Add Link" to attach resources.
                  </p>
                )}
              </div>
            </div>

            {/* 6. Status Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="block font-bold text-slate-700">
                  Registration Active
                </span>
                <span className="text-xs text-slate-500">
                  Allow students to sign up for this activity
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
            {initialData ? "Save Changes" : "Create Activity"}
          </button>
        </div>
      </div>
    </div>
  );
}
