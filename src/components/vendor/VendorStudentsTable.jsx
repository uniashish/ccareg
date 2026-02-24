import React from "react";

export default function VendorStudentsTable({
  rows,
  updatingMap,
  onToggleVerification,
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto overflow-y-auto max-h-[65vh]">
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
              <th className="px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">
                Attendance
              </th>
              <th className="px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">
                Payment Verification
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length > 0 ? (
              rows.map((row) => {
                const rowKey = `${row.selectionId}_${row.ccaId}`;
                const isUpdating = Boolean(updatingMap[rowKey]);
                const isPaid = row.paymentStatus === "Paid";

                return (
                  <tr
                    key={rowKey}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="px-4 py-3 font-semibold text-slate-700">
                      {row.studentName}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.className}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-semibold">
                      {row.ccaName}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.attendanceLabel}
                    </td>
                    <td className="px-4 py-3">
                      <label className="inline-flex items-center gap-2 text-slate-700 font-semibold">
                        <input
                          type="checkbox"
                          checked={row.verified}
                          disabled={isUpdating || !isPaid}
                          onChange={(event) =>
                            onToggleVerification(row, event.target.checked)
                          }
                          className="h-4 w-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary/40"
                        />
                        {isUpdating
                          ? "Updating..."
                          : row.verified
                            ? "Verified"
                            : isPaid
                              ? "Pending"
                              : "Unpaid"}
                      </label>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan="5"
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
