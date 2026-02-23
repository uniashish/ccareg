import { FiBriefcase, FiMail } from "react-icons/fi";

export default function VendorWelcomeCard({ vendorName, vendorEmail }) {
  return (
    <section className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
          <FiBriefcase size={18} />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
            Vendor Portal
          </h2>
          <p className="text-sm text-slate-500">
            Welcome to your CCA vendor workspace.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            Vendor Name
          </p>
          <p className="text-sm font-semibold text-slate-700">
            {vendorName || "Vendor User"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-2">
            <FiMail size={12} /> Email
          </p>
          <p className="text-sm font-semibold text-slate-700 break-all">
            {vendorEmail || "-"}
          </p>
        </div>
      </div>
    </section>
  );
}
