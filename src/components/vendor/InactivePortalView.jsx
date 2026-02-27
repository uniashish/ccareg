import React from "react";

export default function InactivePortalView({ adminName, adminContact }) {
  return (
    <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="max-w-3xl mx-auto mt-8 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm text-center">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight mb-3">
          Vendor Portal Not Active
        </h1>
        <p className="text-slate-600 text-sm leading-relaxed">
          The vendor portal is currently not active. Please contact the
          administrator.
        </p>
        <p className="text-slate-700 text-sm font-bold mt-4">
          {adminName && adminContact
            ? `${adminName} - ${adminContact}`
            : adminContact
              ? adminContact
              : adminName
                ? adminName
                : "School administration"}
        </p>
      </div>
    </main>
  );
}
