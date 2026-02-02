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

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-8 py-5 font-bold text-slate-600 uppercase text-xs tracking-wider">
                Class Name
              </th>
              <th className="px-8 py-5 font-bold text-slate-600 uppercase text-xs tracking-wider">
                Status
              </th>
              <th className="px-8 py-5 font-bold text-slate-600 uppercase text-xs tracking-wider">
                Assigned CCAs
              </th>
              <th className="px-8 py-5 font-bold text-slate-600 uppercase text-xs tracking-wider text-right">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {classesList.length > 0 ? (
              classesList.map((c) => {
                const isInactive = c.isActive === false;

                const assignedNames = c.allowedCCAs
                  ?.map((id) => {
                    const match = ccas?.find((item) => item.id === id);
                    return match ? match.name : null;
                  })
                  .filter((name) => name !== null)
                  .join(", ");

                return (
                  <tr
                    key={c.id}
                    className={`transition-colors group ${isInactive ? "bg-slate-50/50" : "hover:bg-white"}`}
                  >
                    <td className="px-8 py-5">
                      <button
                        onClick={() => setViewingClass(c)}
                        className={`bg-transparent border-none p-0 font-bold text-lg text-left transition-colors cursor-pointer outline-none focus:outline-none ${
                          isInactive
                            ? "text-slate-400 italic"
                            : "text-slate-700 group-hover:text-brand-primary"
                        }`}
                      >
                        {c.name}
                      </button>
                    </td>
                    <td className="px-8 py-5">
                      {isInactive ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider">
                          <FiXCircle size={14} /> Inactive
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold uppercase tracking-wider">
                          <FiCheck size={14} /> Active
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      <span
                        title={
                          assignedNames ||
                          (c.allowedCCAs?.length > 0 && !ccas
                            ? "Loading names..."
                            : "No CCAs assigned")
                        }
                        className={`px-3 py-1 rounded-full text-sm font-medium cursor-help transition-all ${
                          isInactive
                            ? "bg-slate-100 text-slate-400"
                            : "bg-brand-neutral/10 text-brand-neutral hover:bg-brand-neutral/20"
                        }`}
                      >
                        {c.allowedCCAs?.length || 0} CCAs
                      </span>
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
                  colSpan="4"
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
