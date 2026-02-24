import React, { useEffect, useState } from "react";
import { FiEdit2, FiUser, FiX } from "react-icons/fi";

export default function EditAliasModal({
  isOpen,
  onClose,
  user,
  onUpdate,
  saving = false,
}) {
  const [alias, setAlias] = useState("");

  useEffect(() => {
    if (isOpen) {
      setAlias(user?.alias || "");
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    onUpdate(user.uid, alias);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-gradient-to-r from-brand-primary to-brand-neutral p-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <FiEdit2 size={20} />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-tight leading-tight">
                Edit Teacher Alias
              </h3>
              <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">
                Optional Display Name
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            disabled={saving}
          >
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-8">
            <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
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
              Alias (Optional)
            </label>
            <input
              type="text"
              value={alias}
              onChange={(event) => setAlias(event.target.value)}
              placeholder="Enter alias name"
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all text-sm font-medium"
            />
            <p className="mt-2 text-xs text-slate-500">
              Leave blank to remove alias.
            </p>
          </div>

          <div className="bg-slate-50 p-6 flex gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-50 transition-all active:scale-95"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-brand-primary text-white font-bold rounded-xl text-sm hover:opacity-90 shadow-lg shadow-brand-primary/20 transition-all active:scale-95 disabled:opacity-60"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Alias"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
