import React from "react";
import { FiDollarSign } from "react-icons/fi";

export default function PaymentStatusFilters({ value, onChange }) {
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
        <FiDollarSign />
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full sm:w-44 pl-10 pr-8 py-2.5 bg-white border border-black rounded-xl text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 appearance-none cursor-pointer hover:bg-slate-50 transition-colors"
      >
        <option value="all">All Payments</option>
        <option value="pending">Pending</option>
        <option value="verified">Verified</option>
        <option value="unpaid">Unpaid</option>
      </select>
    </div>
  );
}
