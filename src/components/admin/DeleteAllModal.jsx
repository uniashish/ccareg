import React, { useState } from "react";
import { FiAlertTriangle, FiX } from "react-icons/fi";

export default function DeleteAllModal({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}) {
  const [confirmText, setConfirmText] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (confirmText === "deleteALL") {
      onConfirm();
      setConfirmText(""); // Reset after confirm
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-red-50 p-6 border-b border-red-100 flex items-start gap-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-full shrink-0">
            <FiAlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-red-900">
              Critical Operation
            </h3>
            <p className="text-sm text-red-700 mt-1">
              You are about to delete <strong>ALL student selections</strong>.
              This action cannot be undone.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-red-400 hover:text-red-600 transition-colors ml-auto"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <label className="block text-sm font-bold text-slate-700">
            Type{" "}
            <span className="font-mono text-red-600 bg-red-50 px-1 rounded border border-red-100">
              deleteALL
            </span>{" "}
            to confirm:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type deleteALL here"
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-mono text-sm"
          />
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 font-bold text-sm hover:bg-slate-100 rounded-lg transition-colors"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirmText !== "deleteALL" || isDeleting}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-lg shadow-lg shadow-red-600/20 transition-all active:scale-95"
          >
            {isDeleting ? "Deleting Data..." : "Permanently Delete Data"}
          </button>
        </div>
      </div>
    </div>
  );
}
