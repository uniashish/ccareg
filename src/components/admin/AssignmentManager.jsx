import React from "react";
import {
  FiCheckCircle,
  FiPlusCircle,
  FiUsers,
  FiBookOpen,
  FiActivity,
} from "react-icons/fi";

export default function AssignmentManager({
  classesList,
  ccas,
  selectedClassId,
  setSelectedClassId,
  onToggleCCA,
}) {
  const selectedClass = classesList.find((c) => c.id === selectedClassId);
  const activeCCAs = ccas.filter((cca) => cca.isActive !== false);

  return (
    <div className="flex h-[calc(100vh-200px)] gap-6 animate-in fade-in duration-500">
      {/* SIDEBAR: CLASS LIST */}
      <div className="w-80 bg-white rounded-3xl border border-slate-200 flex flex-col overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FiUsers className="text-brand-primary" /> Target Class
          </h3>
          <p className="text-[11px] text-slate-500 mt-1 uppercase font-bold tracking-wider">
            Select a Grade
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {classesList.map((cls) => (
            <button
              key={cls.id}
              type="button"
              onClick={() => setSelectedClassId(cls.id)}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group ${
                selectedClassId === cls.id
                  ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/30"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="font-bold">{cls.name}</span>
              {selectedClassId === cls.id && (
                <FiCheckCircle className="animate-in zoom-in" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN AREA: CCA GRID */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {selectedClassId ? (
          <>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-800">
                  Manage Assignments
                </h3>
                <p className="text-slate-500 text-sm mt-1">
                  Assigning activities to{" "}
                  <span className="text-brand-primary font-bold">
                    {selectedClass?.name}
                  </span>
                </p>
              </div>
              <div className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold flex items-center gap-2">
                <FiActivity />
                {selectedClass?.allowedCCAs?.length || 0} Assigned
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
                {activeCCAs.map((cca) => {
                  const isAssigned = selectedClass?.allowedCCAs?.includes(
                    cca.id,
                  );

                  return (
                    <button
                      key={cca.id}
                      type="button" // Ensuring this is treated as a button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent bubbling issues
                        onToggleCCA(selectedClassId, cca.id);
                      }}
                      className={`relative group p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                        isAssigned
                          ? "bg-brand-primary/5 border-brand-primary shadow-inner"
                          : "bg-white border-slate-200 hover:border-brand-primary/50 hover:shadow-md"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg font-bold transition-colors ${
                            isAssigned
                              ? "bg-brand-primary text-white"
                              : "bg-slate-100 text-slate-400 group-hover:bg-brand-primary/10 group-hover:text-brand-primary"
                          }`}
                        >
                          {isAssigned ? <FiCheckCircle /> : <FiPlusCircle />}
                        </div>
                      </div>

                      <div className="mt-2">
                        <p
                          className={`font-bold text-sm leading-tight break-words ${
                            isAssigned ? "text-brand-primary" : "text-slate-700"
                          }`}
                        >
                          {cca.name}
                        </p>
                        <p className="text-[10px] font-bold uppercase text-slate-400 mt-1">
                          {cca.venue || "Venue TBD"}
                        </p>
                      </div>

                      {isAssigned && (
                        <div className="absolute top-3 right-3 text-brand-neutral animate-in zoom-in">
                          <FiActivity size={14} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {activeCCAs.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <p className="italic">No active activities found.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-12 text-center">
            <FiBookOpen size={48} className="text-slate-200 mb-4" />
            <h4 className="text-xl font-bold text-slate-600">
              No Class Selected
            </h4>
            <p className="text-sm mt-2">
              Pick a grade from the left to manage available activities.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
