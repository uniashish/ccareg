import React from "react";
import { FiShield, FiCheckCircle } from "react-icons/fi";

export default function AuthProgress({
  title = "Signing you in",
  subtitle = "Verifying account and loading your dashboard",
  fullscreen = false,
}) {
  const containerClasses = fullscreen
    ? "min-h-dvh flex items-center justify-center bg-slate-100 px-4"
    : "p-6";

  return (
    <div className={containerClasses}>
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-sm px-6 py-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative w-10 h-10 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary flex items-center justify-center">
            <FiShield size={18} className="animate-pulse" />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center animate-bounce">
              <FiCheckCircle size={10} className="text-white" />
            </span>
          </div>
          <div>
            <p className="text-base font-black text-slate-800">{title}</p>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-brand-primary animate-bounce [animation-delay:0ms]" />
          <div className="h-2 w-2 rounded-full bg-brand-primary animate-bounce [animation-delay:120ms]" />
          <div className="h-2 w-2 rounded-full bg-brand-primary animate-bounce [animation-delay:240ms]" />
          <span className="ml-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Please wait...
          </span>
        </div>
      </div>
    </div>
  );
}
