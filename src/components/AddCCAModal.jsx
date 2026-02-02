import { useState, useEffect } from "react";
import { FiX } from "react-icons/fi";

export default function AddCCAModal({ isOpen, onClose, onSave, initialData }) {
  const [form, setForm] = useState({
    name: "",
    teacher: "",
    description: "",
    days: [],
    startTime: "",
    endTime: "",
    price: 0,
    currency: "IDR",
    maxSeats: "",
    venue: "",
    isActive: true, // Image field removed from here
  });

  // Handle Edit vs Create Mode
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Edit Mode: Pre-fill data
        setForm({
          ...initialData,
          price: initialData.price || 0,
          maxSeats: initialData.maxSeats === 0 ? "" : initialData.maxSeats,
        });
      } else {
        // Create Mode: Reset form
        setForm({
          name: "",
          teacher: "",
          description: "",
          days: [],
          startTime: "",
          endTime: "",
          price: 0,
          currency: "IDR",
          maxSeats: "",
          venue: "",
          isActive: true,
        });
      }
    }
  }, [isOpen, initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" && name === "isActive" ? checked : value,
    }));
  };

  const handleDayToggle = (day) => {
    setForm((prev) => {
      const newDays = prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day];
      return { ...prev, days: newDays };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  if (!isOpen) return null;

  const daysOptions = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div
        className="fixed inset-0 bg-black/30 transition-opacity"
        onClick={onClose}
      ></div>

      <div className="relative bg-white rounded-2xl shadow-xl flex flex-col max-h-[90vh] sm:w-full sm:max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 flex-shrink-0">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {initialData ? "Edit CCA" : "Add New CCA"}
            </h3>
            <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-wider">
              Activity Management
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-50 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="ccaForm" onSubmit={handleSubmit} className="space-y-6">
            {/* Row 1: Name & Instructor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  CCA Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g., Basketball"
                  className="block w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  Instructor
                </label>
                <input
                  type="text"
                  name="teacher"
                  value={form.teacher}
                  onChange={handleChange}
                  placeholder="Instructor name"
                  className="block w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Description
              </label>
              <textarea
                name="description"
                rows={3}
                value={form.description}
                onChange={handleChange}
                placeholder="CCA description..."
                className="block w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border resize-none"
              />
            </div>

            {/* Days Selection */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Days <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-3">
                {daysOptions.map((day) => (
                  <label
                    key={day}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                      form.days.includes(day)
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      value={day}
                      checked={form.days.includes(day)}
                      onChange={() => handleDayToggle(day)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <span className="text-sm font-medium">{day}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Row 2: Times */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="startTime"
                  required
                  value={form.startTime}
                  onChange={handleChange}
                  className="block w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  End Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="endTime"
                  required
                  value={form.endTime}
                  onChange={handleChange}
                  className="block w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border"
                />
              </div>
            </div>

            {/* Row 3: Price, Currency & Seats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  required
                  value={form.price}
                  onChange={handleChange}
                  className="block w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  Currency
                </label>
                <input
                  type="text"
                  name="currency"
                  value={form.currency}
                  onChange={handleChange}
                  className="block w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  Max Seats (empty = ∞)
                </label>
                <input
                  type="number"
                  name="maxSeats"
                  value={form.maxSeats}
                  onChange={handleChange}
                  placeholder="Unlimited"
                  className="block w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border"
                />
              </div>
            </div>

            {/* Row 4: Venue Only (Image URL removed) */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Venue
              </label>
              <input
                type="text"
                name="venue"
                value={form.venue}
                onChange={handleChange}
                placeholder="Location"
                className="block w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border"
              />
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between pt-2">
              <span className="block text-sm font-bold text-slate-900">
                Active Status
              </span>
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
            className="px-6 py-2.5 bg-indigo-600 border border-transparent rounded-xl text-white font-bold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors shadow-lg shadow-indigo-200"
          >
            {initialData ? "Save Changes" : "Create CCA"}
          </button>
        </div>
      </div>
    </div>
  );
}
