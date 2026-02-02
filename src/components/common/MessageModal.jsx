import React from "react";
import { FiCheckCircle, FiAlertTriangle, FiInfo, FiX } from "react-icons/fi";

export default function MessageModal({
  isOpen,
  onClose,
  type = "info",
  title,
  message,
}) {
  if (!isOpen) return null;

  // Configuration based on type
  const config = {
    success: {
      color: "text-green-600",
      bgColor: "bg-green-100",
      borderColor: "border-green-100",
      icon: <FiCheckCircle size={32} />,
      buttonColor: "bg-green-600 hover:bg-green-700",
    },
    error: {
      color: "text-red-600",
      bgColor: "bg-red-100",
      borderColor: "border-red-100",
      icon: <FiAlertTriangle size={32} />,
      buttonColor: "bg-red-600 hover:bg-red-700",
    },
    info: {
      color: "text-brand-primary",
      bgColor: "bg-indigo-100",
      borderColor: "border-indigo-100",
      icon: <FiInfo size={32} />,
      buttonColor: "bg-brand-primary hover:bg-indigo-700",
    },
  };

  const currentConfig = config[type] || config.info;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      ></div>

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
        {/* Close Icon (Top Right) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100"
        >
          <FiX size={20} />
        </button>

        <div className="p-8 flex flex-col items-center text-center">
          {/* Icon Circle */}
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 ${currentConfig.bgColor} ${currentConfig.color}`}
          >
            {currentConfig.icon}
          </div>

          {/* Text Content */}
          <h3 className="text-xl font-black text-slate-800 mb-2">{title}</h3>
          <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6">
            {message}
          </p>

          {/* Action Button */}
          <button
            onClick={onClose}
            className={`w-full py-3 rounded-xl text-white font-bold shadow-lg transition-all active:scale-95 ${currentConfig.buttonColor}`}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
