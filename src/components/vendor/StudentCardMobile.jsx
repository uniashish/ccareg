import React from "react";
import VerificationControl from "./VerificationControl";

export default function StudentCardMobile({
  group,
  onStudentClick,
  updatingMap,
  onToggleVerification,
  getVerificationLabel,
}) {
  const primaryRow = group.rows[0];

  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={() => onStudentClick?.(primaryRow)}
            className="text-sm font-bold text-slate-800 hover:text-brand-primary hover:underline underline-offset-2 text-left"
          >
            {group.studentName}
          </button>
          <p className="text-xs text-slate-500 mt-0.5">{group.className}</p>
        </div>
      </div>
      <div className="mt-2 space-y-2 text-xs">
        <div>
          <p className="text-slate-400 font-semibold uppercase tracking-wide">
            CCA
          </p>
          <div className="mt-1 border border-slate-200 rounded-lg overflow-hidden">
            {group.rows.map((ccaRow) => (
              <div
                key={`${ccaRow.selectionId}_${ccaRow.ccaId}`}
                className="px-2 py-1.5 border-b border-slate-200 last:border-b-0"
              >
                <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                  {ccaRow.ccaName || "Unnamed CCA"}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-slate-400 font-semibold uppercase tracking-wide">
            Payment Verification
          </p>
          <div className="mt-1 border border-slate-200 rounded-lg overflow-hidden">
            {group.rows.map((ccaRow) => (
              <div
                key={`verify_${ccaRow.selectionId}_${ccaRow.ccaId}`}
                className="flex items-center justify-between gap-2 px-2 py-1.5 border-b border-slate-200 last:border-b-0"
              >
                <span className="text-[11px] font-semibold text-slate-500">
                  {ccaRow.ccaName}
                </span>
                <VerificationControl
                  row={ccaRow}
                  updatingMap={updatingMap}
                  onToggleVerification={onToggleVerification}
                  getVerificationLabel={getVerificationLabel}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
