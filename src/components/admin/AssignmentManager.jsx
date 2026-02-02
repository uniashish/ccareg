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
              onClick={() => setSelectedClassId(cls.id)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                selectedClassId === cls.id
                  ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-100"
              }`}
            >
              <div className="text-left">
                <p
                  className={`font-bold ${selectedClassId === cls.id ? "text-white" : "text-slate-700"}`}
                >
                  {cls.name}
                </p>
                <p
                  className={`text-[10px] mt-0.5 ${selectedClassId === cls.id ? "text-white/80" : "text-slate-400"}`}
                >
                  {cls.allowedCCAs?.length || 0} CCA Assigned
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-3xl border border-slate-200 flex flex-col overflow-hidden shadow-sm">
        {selectedClassId ? (
          <>
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800">
                Available CCAs for {selectedClass?.name}
              </h3>
              <p className="text-sm text-brand-neutral mt-1 font-medium">
                Only active CCAs are available for assignment
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeCCAs.map((cca) => {
                  const isAssigned = selectedClass?.allowedCCAs?.includes(
                    cca.id,
                  );
                  return (
                    <button
                      key={cca.id}
                      onClick={() => onToggleCCA(cca.id)}
                      className={`relative flex items-start gap-4 p-5 rounded-2xl border-2 transition-all text-left min-h-[100px] ${
                        isAssigned
                          ? "border-brand-primary bg-brand-primary/5 shadow-md ring-4 ring-brand-primary/10"
                          : "border-slate-100 bg-white hover:border-slate-300 shadow-sm"
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 mt-1 transition-colors ${
                          isAssigned
                            ? "bg-brand-primary text-white"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {isAssigned ? (
                          <FiCheckCircle size={24} />
                        ) : (
                          <FiPlusCircle size={24} />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 pr-4">
                        <p
                          className={`font-bold leading-tight break-words ${isAssigned ? "text-brand-primary" : "text-slate-700"}`}
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
