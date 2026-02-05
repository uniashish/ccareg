import React, { useState } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiXCircle } from "react-icons/fi";
import ClassDetailsModal from "./ClassDetailsModal";

export default function ClassManager({
  classesList,
  ccas,
  onAddClick,
  onEditClick,
  onDeleteClick,
}) {
  const [viewingClass, setViewingClass] = useState(null);

  return (
    <section className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
            Classes
          </h2>
          <p className="text-slate-500 mt-1">Manage Classes</p>
        </div>
        <button
          onClick={onAddClick}
          className="flex items-center gap-2 bg-brand-primary hover:opacity-90 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-brand-primary/20 active:scale-95"
        >
          <FiPlus size={20} /> Add New Class
        </button>
      </div>

      {/* Scrollable Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-y-auto max-h-[70vh]">
        <table className="w-full text-left border-collapse">
          {/* Sticky Header */}
          <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-8 py-5 font-bold text-slate-500 uppercase text-xs tracking-wider">
                Class Name
              </th>
              {/* ID Header Removed */}
              <th className="px-8 py-5 font-bold text-slate-500 uppercase text-xs tracking-wider">
                Mapped CCAs
              </th>
              <th className="px-8 py-5 font-bold text-slate-500 uppercase text-xs tracking-wider text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {classesList.length > 0 ? (
              classesList.map((c) => {
                const allowedCount = c.allowedCCAs ? c.allowedCCAs.length : 0;
                const hasMapping = allowedCount > 0;

                return (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
                          {c.name.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-700 text-lg">
                          {c.name}
                        </span>
                      </div>
                    </td>
                    {/* ID Cell Removed */}
                    <td className="px-8 py-5">
                      {hasMapping ? (
                        <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-lg w-fit">
                          <FiCheck size={16} />
                          <span className="font-bold text-sm">
                            {allowedCount} Allowed
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg w-fit">
                          <FiXCircle size={16} />
                          <span className="font-medium text-sm">
                            No Mapping
                          </span>
                        </div>
                      )}
                      <button
                        onClick={() => setViewingClass(c)}
                        className="text-xs text-brand-primary font-bold mt-1 ml-1 hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        View Details
                      </button>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => onEditClick(c)}
                          className="flex items-center gap-1 px-3 py-2 text-brand-primary hover:bg-brand-primary/10 rounded-lg font-semibold transition-colors"
                        >
                          <FiEdit2 size={16} /> Edit
                        </button>
                        <button
                          onClick={() => onDeleteClick(c.id)}
                          className="flex items-center gap-1 px-3 py-2 text-brand-secondary hover:bg-brand-secondary/10 rounded-lg font-semibold transition-colors"
                        >
                          <FiTrash2 size={16} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan="3" // Updated colSpan from 4 to 3
                  className="px-8 py-12 text-center text-slate-400 italic"
                >
                  No classes found. Click "Add New Class" to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ClassDetailsModal
        isOpen={!!viewingClass}
        onClose={() => setViewingClass(null)}
        selectedClass={viewingClass}
        ccas={ccas}
      />
    </section>
  );
}
