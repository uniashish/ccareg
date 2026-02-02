import { logout } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { FiLogOut } from "react-icons/fi";

export default function Header() {
  const { user, role } = useAuth();

  return (
    <div className="w-full flex justify-between items-center px-10 py-5 bg-white border-b border-slate-100 shadow-sm sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 flex items-center justify-center shrink-0">
          <img
            src="/sislogo.png"
            alt="School Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <div>
          <h1 className="font-black text-2xl text-slate-800 tracking-tighter leading-none">
            CCA<span className="text-brand-primary">MANAGER</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
            SIS KGNEJ CCA Portal
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 pr-6 border-r border-slate-100">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-700 leading-none">
              {user?.displayName || "User Profile"}
            </p>
            <span className="inline-block mt-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-brand-neutral/10 text-brand-neutral rounded-md border border-brand-neutral/20">
              {role}
            </span>
          </div>

          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center text-slate-400 shadow-inner">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="font-bold text-brand-primary">
                  {user?.displayName?.charAt(0) || "U"}
                </span>
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-brand-primary border-2 border-white rounded-full shadow-sm animate-pulse"></div>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-brand-secondary text-brand-secondary hover:bg-brand-secondary hover:text-white font-bold rounded-xl transition-all active:scale-95 text-xs uppercase tracking-widest shadow-sm shadow-brand-secondary/10"
        >
          <FiLogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  );
}
