import React from "react";

export default function VerificationControl({
  row,
  updatingMap,
  onToggleVerification,
  getVerificationLabel,
}) {
  const rowKey = `${row.selectionId}_${row.ccaId}`;
  const isUpdating = Boolean(updatingMap[rowKey]);
  const isPaid = row.paymentStatus === "Paid";

  return (
    <label className="inline-flex items-center gap-2 text-slate-700 font-semibold">
      <input
        type="checkbox"
        checked={row.verified}
        disabled={isUpdating}
        onChange={(event) => onToggleVerification(row, event.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary/40"
      />
      {getVerificationLabel(row, isUpdating, isPaid)}
    </label>
  );
}
