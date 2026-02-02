import React, { useState, useEffect } from "react";
import { FiShield, FiX, FiCheckCircle, FiUser } from "react-icons/fi";

export default function UpdateRoleModal({ isOpen, onClose, user, onUpdate }) {
  const [selectedRole, setSelectedRole] = useState("");

  useEffect(() => {
    if (user) {
      setSelectedRole(user.role || "student");
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const roles = ["admin", "teacher", "student"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-gradient-to-r from-brand-primary to-brand-neutral p-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <FiShield size={20} />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-tight leading-tight">
                Update User Role
              </h3>
              <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">
                Permissions Management
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="p-8">
          <div className="flex items-center gap-4 mb-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt=""
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <FiUser size={24} />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-800 truncate">
                {user.displayName ||
                  user.name ||
                  user.email?.split("@")[0] ||
                  "Unknown User"}
              </p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>

          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
            Select New Role
          </label>
          <div className="space-y-3">
            {roles.map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                  selectedRole === role
                    ? "border-brand-primary bg-brand-primary/5 shadow-sm"
                    : "border-slate-100 hover:border-slate-200"
                }`}
              >
                <span
                  className={`font-bold capitalize ${
                    selectedRole === role
                      ? "text-brand-primary"
                      : "text-slate-600"
                  }`}
                >
                  {role}
                </span>
                {selectedRole === role && (
                  <FiCheckCircle className="text-brand-primary" size={18} />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-50 p-6 flex gap-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-50 transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={() => onUpdate(user.uid, selectedRole)}
            className="flex-1 px-4 py-3 bg-brand-primary text-white font-bold rounded-xl text-sm hover:opacity-90 shadow-lg shadow-brand-primary/20 transition-all active:scale-95"
          >
            Confirm Change
          </button>
        </div>
      </div>
    </div>
  );
}
