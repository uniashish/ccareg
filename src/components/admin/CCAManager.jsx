import React, { useState } from "react";
import { FiPlus, FiSearch } from "react-icons/fi";
import CCAGrid from "./CCAGrid"; // Import the new grid component

export default function CCAManager({
  ccas,
  onAddClick,
  onEditClick,
  onDeleteClick,
  onViewDetails,
}) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter logic based on CCA name
  const filteredCCAs = ccas.filter((cca) =>
    cca.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <section className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            CCA Management
          </h2>
          <p className="text-slate-500 text-sm">
            Create and manage activities ({filteredCCAs.length} found)
          </p>
        </div>

        {/* ACTIONS & SEARCH */}
        <div className="flex gap-3">
          <div className="relative group">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors" />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 w-full md:w-64 shadow-sm transition-all"
            />
          </div>
          <button
            onClick={onAddClick}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl font-bold shadow-lg shadow-brand-primary/20 transition-all active:scale-95 text-sm whitespace-nowrap"
          >
            <FiPlus size={18} />
            <span>Add New</span>
          </button>
        </div>
      </div>

      {/* THE GRID (Handles Scroll, Cards, and Empty State) */}
      <CCAGrid
        ccas={filteredCCAs}
        onEdit={onEditClick}
        onDelete={onDeleteClick}
        onViewDetails={onViewDetails}
        onClearSearch={() => setSearchQuery("")}
      />
    </section>
  );
}
