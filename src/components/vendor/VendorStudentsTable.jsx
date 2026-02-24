import React from "react";

export default function VendorStudentsTable({
  rows,
  updatingMap,
  onToggleVerification,
  onStudentClick,
}) {
  const studentGroups = rows.reduce((acc, row) => {
    const groupKey = row.selectionId || row.studentUid;
    if (!acc[groupKey]) {
      acc[groupKey] = {
        groupKey,
        studentName: row.studentName,
        className: row.className,
        rows: [],
      };
    }
    acc[groupKey].rows.push(row);
    return acc;
  }, {});

  const groupedRows = Object.values(studentGroups);

  const getVerificationLabel = (row, isUpdating, isPaid) => {
    if (isUpdating) return "Updating...";
    if (row.verified) return "Verified";
    return isPaid ? "Pending" : "Unpaid";
  };

  const renderVerificationControl = (row) => {
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
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="md:hidden p-3 space-y-3">
        {groupedRows.length > 0 ? (
          groupedRows.map((group) => {
            const primaryRow = group.rows[0];

            return (
              <div
                key={group.groupKey}
                className="rounded-xl border border-slate-200 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <button
                      type="button"
                      onClick={() => onStudentClick?.(primaryRow)}
                      className="text-sm font-bold text-slate-800 hover:text-brand-primary hover:underline underline-offset-2 text-left"
                    >
                      {group.studentName}
                    </button>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {group.className}
                    </p>
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
                          {renderVerificationControl(ccaRow)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="px-2 py-8 text-center text-slate-400 italic text-sm">
            No students found for the selected filters.
          </div>
        )}
      </div>

      <div className="hidden md:block overflow-x-auto overflow-y-auto max-h-[65vh]">
        <table className="w-full min-w-[920px] text-left border-collapse text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">
                Student Name
              </th>
              <th className="px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">
                Class
              </th>
              <th className="px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">
                CCA Name
              </th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {groupedRows.length > 0 ? (
              groupedRows.map((group, index) => {
                const primaryRow = group.rows[0];

                return (
                  <tr
                    key={group.groupKey}
                    className={`transition-colors hover:bg-slate-100/70 ${
                      index % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                    }`}
                  >
                    <td className="px-4 py-3 font-semibold text-slate-700 border-y border-l border-slate-200 align-middle">
                      <button
                        type="button"
                        onClick={() => onStudentClick?.(primaryRow)}
                        className="font-semibold text-slate-700 hover:text-brand-primary hover:underline underline-offset-2 text-left"
                      >
                        {group.studentName}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-slate-600 border-y border-slate-200 align-middle">
                      {group.className}
                    </td>
                    <td className="px-4 py-3 border-y border-r border-slate-200 align-top">
                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        {group.rows.map((ccaRow) => (
                          <div
                            key={`verify_${ccaRow.selectionId}_${ccaRow.ccaId}`}
                            className="flex items-center justify-between gap-2 px-2 py-1.5 border-b border-slate-200 last:border-b-0"
                          >
                            <span className="text-xs font-semibold text-slate-500">
                              {ccaRow.ccaName}
                            </span>
                            {renderVerificationControl(ccaRow)}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan="3"
                  className="px-4 py-12 text-center text-slate-400 italic"
                >
                  No students found for the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
