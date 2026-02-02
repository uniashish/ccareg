import { useState, useEffect } from "react";
import { FiX } from "react-icons/fi";

export default function AddClassModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    isActive: true,
  });

  // Reset or Pre-fill form when the modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Edit Mode: Pre-fill data
        setForm({
          name: initialData.name || "",
          description: initialData.description || "",
          isActive:
            initialData.isActive !== undefined ? initialData.isActive : true,
        });
      } else {
        // Add Mode: Reset form
        setForm({ name: "", description: "", isActive: true });
      }
    }
  }, [isOpen, initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form); // Pass the form data back to parent
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div
        className="fixed inset-0 bg-black/30 transition-opacity"
        onClick={onClose}
      ></div>

      <div className="relative bg-white rounded-2xl shadow-xl transform transition-all sm:w-full sm:max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            {/* Dynamic Title */}
            <h3 className="text-xl font-bold text-slate-900">
              {initialData ? "Edit Class" : "Add New Class"}
            </h3>
            <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-wider">
              Admin Dashboard
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-50 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            <div>
              <label
                htmlFor="className"
                className="block text-sm font-bold text-slate-900 mb-2"
              >
                Class Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="className"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="e.g., Grade 1, Primary 2"
                className="block w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border placeholder:text-slate-400"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-bold text-slate-900 mb-2"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={form.description}
                onChange={handleChange}
                placeholder="Optional description..."
                className="block w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border placeholder:text-slate-400 resize-none"
              />
            </div>

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
          </div>

          <div className="bg-slate-50 p-6 flex justify-end gap-3 rounded-b-2xl border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 border border-transparent rounded-xl text-white font-bold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors shadow-lg shadow-indigo-200"
            >
              {initialData ? "Save Changes" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
