import React from "react";

export default function CustomListStudentsTable({
  filteredSelections,
  enrichedSelectionsCount,
  selectedCheckboxes,
  customListIds,
  onToggleCheckbox,
  isGradingEnabled,
  gradeMap,
}) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-3 sm:p-4 space-y-2">
        {filteredSelections.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 text-sm">
              {enrichedSelectionsCount === 0
                ? "No student selections available."
                : "No students found for the selected class."}
            </p>
          </div>
        ) : (
          filteredSelections.map((student) => {
            const isAlreadyInList = customListIds.has(student.id);
            return (
              <div
                key={student.id}
                className={`flex items-start gap-2 sm:gap-3 p-3 rounded-lg border transition-colors ${
                  isAlreadyInList
                    ? "border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed"
                    : "border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 cursor-pointer"
                }`}
                onClick={() => !isAlreadyInList && onToggleCheckbox(student.id)}
              >
                <input
                  type="checkbox"
                  checked={isAlreadyInList || !!selectedCheckboxes[student.id]}
                  disabled={isAlreadyInList}
                  onClick={(event) => event.stopPropagation()}
                  onChange={() => onToggleCheckbox(student.id)}
                  className="w-4 h-4 mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-700 text-sm truncate">
                    {student.studentName}
                  </div>
                  <div className="text-xs text-slate-500 break-words">
                    {student.className} • {student.studentEmail}
                  </div>
                  {student.selectedCCAs && student.selectedCCAs.length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-2">
                      {student.selectedCCAs.map((cca, idx) => {
                        const gradeText = cca?.grade
                          ? gradeMap[String(cca.grade)]
                          : null;

                        return (
                          <span
                            key={cca.id || idx}
                            className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded text-[10px] font-bold flex items-center gap-1"
                          >
                            <span>{cca.name}</span>
                            {isGradingEnabled && gradeText && (
                              <span className="text-indigo-500 opacity-75">
                                ({gradeText})
                              </span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
                {isAlreadyInList && (
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                    Added
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
