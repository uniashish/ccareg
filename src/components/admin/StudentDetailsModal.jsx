import React, { useEffect, useState } from "react";
import {
  FiCalendar,
  FiX,
  FiMapPin,
  FiBriefcase,
  FiDownload,
  FiChevronDown,
} from "react-icons/fi";
import { db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import ExportFieldsModal from "../common/ExportFieldsModal";

export default function StudentDetailsModal({
  isOpen,
  onClose,
  selection,
  classMap,
}) {
  const [enrichedCCAs, setEnrichedCCAs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allExportOpen, setAllExportOpen] = useState(false);
  const [ccaExportOpenById, setCcaExportOpenById] = useState({});
  const [exportFieldsOpen, setExportFieldsOpen] = useState(false);
  const [exportTarget, setExportTarget] = useState(null);
  const [selectedExportFields, setSelectedExportFields] = useState([
    "cca",
    "date",
    "status",
    "presentDays",
    "presentPercent",
  ]);
  const [pdfFontSize, setPdfFontSize] = useState(10);

  const exportFields = [
    { key: "cca", label: "CCA" },
    { key: "date", label: "Date" },
    { key: "status", label: "Status" },
    { key: "presentDays", label: "Present Days" },
    { key: "presentPercent", label: "Present %" },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedInsideAllExport = event.target.closest(".all-export-menu");
      const clickedInsideCcaExport = event.target.closest(".cca-export-menu");

      if (!clickedInsideAllExport) {
        setAllExportOpen(false);
      }

      if (!clickedInsideCcaExport) {
        setCcaExportOpenById({});
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const parseDate = (value) => {
    if (!value) return null;

    if (typeof value === "object" && typeof value.toDate === "function") {
      const parsed = value.toDate();
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    if (
      typeof value === "object" &&
      value !== null &&
      ("seconds" in value || "nanoseconds" in value)
    ) {
      const parsed = new Date((value.seconds || 0) * 1000);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const toDateKey = (date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getTodayDateOnly = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  };

  useEffect(() => {
    const fetchCCADetails = async () => {
      if (!selection || !selection.selectedCCAs) return;

      setLoading(true);
      try {
        const activeStudentId = selection.studentUid || selection.id;
        const today = getTodayDateOnly();

        const promises = selection.selectedCCAs.map(async (item) => {
          if (!item.id) return item;

          const ccaRef = doc(db, "ccas", item.id);
          const ccaSnap = await getDoc(ccaRef);

          if (ccaSnap.exists()) {
            const data = ccaSnap.data();
            const mergedCCA = {
              ...item,
              ...data,
            };

            const rawSessionDates = Array.isArray(mergedCCA.sessionDates)
              ? mergedCCA.sessionDates
              : mergedCCA.sessionDates
                ? [mergedCCA.sessionDates]
                : [];

            const parsedSessionDates = rawSessionDates
              .map((rawDate) => parseDate(rawDate))
              .filter(Boolean)
              .sort((a, b) => a - b);

            const uniqueDateKeys = [
              ...new Set(parsedSessionDates.map((date) => toDateKey(date))),
            ];

            const attendanceByDateKey = {};

            if (uniqueDateKeys.length > 0) {
              const attendanceDocs = await Promise.allSettled(
                uniqueDateKeys.map((dateKey) =>
                  getDoc(doc(db, "attendanceRecords", `${item.id}_${dateKey}`)),
                ),
              );

              attendanceDocs.forEach((result, index) => {
                const dateKey = uniqueDateKeys[index];

                if (result.status !== "fulfilled" || !result.value.exists()) {
                  attendanceByDateKey[dateKey] = false;
                  return;
                }

                const attendanceData = result.value.data() || {};
                const presentStudentIds = Array.isArray(
                  attendanceData.presentStudentIds,
                )
                  ? attendanceData.presentStudentIds
                  : [];

                attendanceByDateKey[dateKey] =
                  presentStudentIds.includes(activeStudentId);
              });
            }

            const completedSessionDates = parsedSessionDates.filter((date) => {
              const dateOnly = new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate(),
              );
              return dateOnly <= today;
            });

            const presentCompletedCount = completedSessionDates.filter(
              (date) => {
                const dateKey = toDateKey(date);
                return attendanceByDateKey[dateKey] === true;
              },
            ).length;

            const totalCompletedCount = completedSessionDates.length;
            const presentPercent =
              totalCompletedCount > 0
                ? Math.round(
                    (presentCompletedCount / totalCompletedCount) * 100,
                  )
                : 0;

            return {
              ...mergedCCA,
              attendanceByDateKey,
              presentCompletedCount,
              totalCompletedCount,
              presentPercent,
            };
          }
          return item;
        });

        const results = await Promise.all(promises);
        setEnrichedCCAs(results);
      } catch (error) {
        console.error("Error fetching CCA details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchCCADetails();
    } else {
      setEnrichedCCAs([]);
      setAllExportOpen(false);
      setCcaExportOpenById({});
      setExportFieldsOpen(false);
      setExportTarget(null);
    }
  }, [isOpen, selection]);

  if (!isOpen || !selection) return null;

  const className = classMap[selection.classId]?.name || "Unassigned";

  const formatSessionDate = (dateInput) => {
    const date = parseDate(dateInput);
    if (!date) return "";

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const escapeCSV = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const buildRowsForCCA = (cca) => {
    if (!cca) return [];

    const today = getTodayDateOnly();
    const sortedDates = (
      Array.isArray(cca.sessionDates) ? cca.sessionDates : []
    )
      .slice()
      .sort((a, b) => {
        const dateA = parseDate(a);
        const dateB = parseDate(b);
        if (!dateA || !dateB) return 0;
        return dateA - dateB;
      });

    return sortedDates.map((dateInput) => {
      const parsedDate = parseDate(dateInput);
      const dateKey = parsedDate ? toDateKey(parsedDate) : "";

      let status = "Unknown";
      if (parsedDate) {
        const dateOnly = new Date(
          parsedDate.getFullYear(),
          parsedDate.getMonth(),
          parsedDate.getDate(),
        );

        if (dateOnly > today) {
          status = "Future";
        } else if (cca.attendanceByDateKey?.[dateKey]) {
          status = "Present";
        } else {
          status = "Absent";
        }
      }

      return {
        ccaName: cca.name || "",
        dateLabel: formatSessionDate(dateInput),
        status,
        presentSummary: `${cca.presentCompletedCount || 0}/${cca.totalCompletedCount || 0}`,
        presentPercent: `${cca.presentPercent || 0}%`,
      };
    });
  };

  const buildRowsForAllCCAs = () => {
    return enrichedCCAs.flatMap((cca) => buildRowsForCCA(cca));
  };

  const exportCSV = (rows, fileBase) => {
    if (!rows.length) return;

    const headers = [
      "Student Name",
      "Student Email",
      "Class",
      "CCA",
      "Date",
      "Status",
      "Present Days",
      "Present %",
    ];

    const csvRows = rows.map((row) =>
      [
        selection.studentName || "",
        selection.studentEmail || "",
        className,
        row.ccaName,
        row.dateLabel,
        row.status,
        row.presentSummary,
        row.presentPercent,
      ]
        .map(escapeCSV)
        .join(","),
    );

    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileBase}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportPDF = (
    rows,
    fileBase,
    title,
    fields = selectedExportFields,
    fontSize = pdfFontSize,
  ) => {
    if (!rows.length) return;

    const selectedColumns = exportFields.filter((field) =>
      fields.includes(field.key),
    );
    if (!selectedColumns.length) return;

    const tableRows = rows
      .map((row) => {
        const rowData = {
          cca: row.ccaName,
          date: row.dateLabel,
          status: row.status,
          presentDays: row.presentSummary,
          presentPercent: row.presentPercent,
        };

        const cells = selectedColumns
          .map((column) => `<td>${escapeHtml(rowData[column.key])}</td>`)
          .join("");

        return `<tr>${cells}</tr>`;
      })
      .join("\n");

    const tableHeaders = selectedColumns
      .map((column) => `<th>${escapeHtml(column.label)}</th>`)
      .join("");

    const html = `
      <html>
        <head>
          <title>${escapeHtml(fileBase)}</title>
          <style>
            @page { size: A4 landscape; margin: 12mm; }
            body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:0;padding:12px;font-size:${fontSize}px;color:#111}
            h2{font-size:${Math.max(fontSize + 4, 14)}px;margin:0 0 4px}
            p{margin:0 0 10px;color:#444;font-size:${fontSize}px}
            table{width:100%;border-collapse:collapse}
            th,td{border:1px solid #ddd;padding:6px;text-align:left;font-size:${fontSize}px;vertical-align:top}
            th{background:#f3f4f6;font-weight:700}
          </style>
        </head>
        <body>
          <h2>${escapeHtml(title)}</h2>
          <p>Student: ${escapeHtml(selection.studentName || "")}, Class: ${escapeHtml(className)}</p>
          <table>
            <thead>
              <tr>${tableHeaders}</tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 300);
  };

  const openExportOptions = ({ rows, fileBase, title }) => {
    if (!rows?.length) return;
    setExportTarget({ rows, fileBase, title });
    setExportFieldsOpen(true);
  };

  const handleExportFieldsConfirm = (fields, fontSize) => {
    setSelectedExportFields(fields);
    setPdfFontSize(fontSize);
    if (!exportTarget) return;

    exportPDF(
      exportTarget.rows,
      exportTarget.fileBase,
      exportTarget.title,
      fields,
      fontSize,
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      ></div>
      <div className="relative bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-slate-900 text-white p-6 shrink-0 flex justify-between items-start">
          <div>
            <h3 className="text-xl font-black tracking-tight">
              {selection.studentName}
            </h3>
            <p className="text-slate-400 text-sm">{selection.studentEmail}</p>
            <span className="inline-block mt-2 px-2 py-0.5 rounded bg-white/10 text-xs font-bold border border-white/20">
              {className}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
              Selected Activities ({selection.selectedCCAs?.length || 0})
            </h4>

            <div className="relative all-export-menu">
              <button
                type="button"
                onClick={() => setAllExportOpen((prev) => !prev)}
                disabled={loading || enrichedCCAs.length === 0}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${
                  loading || enrichedCCAs.length === 0
                    ? "bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <FiDownload size={13} /> Export All <FiChevronDown size={12} />
              </button>

              {allExportOpen && !(loading || enrichedCCAs.length === 0) && (
                <div className="absolute right-0 mt-2 w-36 bg-white border border-slate-200 rounded-lg shadow-lg z-20 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      const rows = buildRowsForAllCCAs();
                      const datePart = new Date().toISOString().split("T")[0];
                      const fileBase = `All_CCA_Attendance_${selection.studentUid || selection.id || "student"}_${datePart}`;
                      exportCSV(rows, fileBase);
                      setAllExportOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Export CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const rows = buildRowsForAllCCAs();
                      const datePart = new Date().toISOString().split("T")[0];
                      const fileBase = `All_CCA_Attendance_${selection.studentUid || selection.id || "student"}_${datePart}`;
                      openExportOptions({
                        rows,
                        fileBase,
                        title: "All CCA Attendance",
                      });
                      setAllExportOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Export PDF
                  </button>
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400 font-medium animate-pulse">
              Loading CCA details...
            </div>
          ) : (
            <div className="space-y-4">
              {enrichedCCAs.length > 0 ? (
                enrichedCCAs.map((cca, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h5 className="font-bold text-slate-800 text-lg">
                        {cca.name}
                      </h5>
                      {/* Payment Status Label */}
                      {(() => {
                        const paid =
                          String(cca.paymentStatus).toLowerCase() === "paid";
                        const verified =
                          cca.verified === true ||
                          String(cca.verified).toLowerCase() === "yes" ||
                          String(cca.verified).toLowerCase() === "verified";
                        let label = "Not Paid";
                        let color = "bg-red-50 text-red-700 border-red-200";
                        if (paid && verified) {
                          label = "Paid and Verified";
                          color =
                            "bg-emerald-50 text-emerald-700 border-emerald-200";
                        } else if (paid && !verified) {
                          label = "Paid, Waiting for Verification";
                          color = "bg-amber-50 text-amber-700 border-amber-200";
                        }
                        return (
                          <span
                            className={`mt-1 inline-block text-xs font-bold rounded border px-2 py-0.5 ${color}`}
                          >
                            {label}
                          </span>
                        );
                      })()}
                      <div className="relative cca-export-menu">
                        <button
                          type="button"
                          onClick={() =>
                            setCcaExportOpenById((prev) => ({
                              ...prev,
                              [cca.id || idx]: !prev[cca.id || idx],
                            }))
                          }
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border bg-white text-slate-700 border-slate-200 hover:bg-slate-100 transition-colors"
                        >
                          <FiDownload size={12} /> Export{" "}
                          <FiChevronDown size={11} />
                        </button>

                        {ccaExportOpenById[cca.id || idx] && (
                          <div className="absolute right-0 mt-2 w-32 bg-white border border-slate-200 rounded-lg shadow-lg z-20 overflow-hidden">
                            <button
                              type="button"
                              onClick={() => {
                                const rows = buildRowsForCCA(cca);
                                const datePart = new Date()
                                  .toISOString()
                                  .split("T")[0];
                                const safeName = (cca.name || "CCA").replace(
                                  /\s+/g,
                                  "_",
                                );
                                const fileBase = `CCA_Attendance_${safeName}_${datePart}`;
                                exportCSV(rows, fileBase);
                                setCcaExportOpenById((prev) => ({
                                  ...prev,
                                  [cca.id || idx]: false,
                                }));
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                            >
                              Export CSV
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const rows = buildRowsForCCA(cca);
                                const datePart = new Date()
                                  .toISOString()
                                  .split("T")[0];
                                const safeName = (cca.name || "CCA").replace(
                                  /\s+/g,
                                  "_",
                                );
                                const fileBase = `CCA_Attendance_${safeName}_${datePart}`;
                                openExportOptions({
                                  rows,
                                  fileBase,
                                  title: `${cca.name} Attendance`,
                                });
                                setCcaExportOpenById((prev) => ({
                                  ...prev,
                                  [cca.id || idx]: false,
                                }));
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                            >
                              Export PDF
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <FiBriefcase className="text-indigo-500" />
                        <span className="font-semibold">Teacher:</span>{" "}
                        {cca.teacherDisplay || cca.teacher || "N/A"}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <FiMapPin className="text-indigo-500" />
                        <span className="font-semibold">Venue:</span>{" "}
                        {cca.venue || "N/A"}
                      </div>
                    </div>

                    {cca.sessionDates && cca.sessionDates.length > 0 && (
                      <div className="pt-3 border-t border-slate-100 border-dashed">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <FiCalendar size={12} /> Sessions
                          </p>
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 rounded-md px-2 py-1">
                            Present: {cca.presentCompletedCount || 0}/
                            {cca.totalCompletedCount || 0} (
                            {cca.presentPercent || 0}%)
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {cca.sessionDates
                            .slice()
                            .sort((a, b) => {
                              const dateA = parseDate(a);
                              const dateB = parseDate(b);
                              if (!dateA || !dateB) return 0;
                              return dateA - dateB;
                            })
                            .map((date, i) => {
                              const parsedDate = parseDate(date);
                              const dateKey = parsedDate
                                ? toDateKey(parsedDate)
                                : "";

                              let capsuleClass =
                                "text-xs font-semibold px-2 py-1 rounded border";

                              if (!parsedDate) {
                                capsuleClass +=
                                  " bg-slate-50 border-slate-100 text-slate-500";
                              } else {
                                const today = getTodayDateOnly();
                                const dateOnly = new Date(
                                  parsedDate.getFullYear(),
                                  parsedDate.getMonth(),
                                  parsedDate.getDate(),
                                );

                                if (dateOnly > today) {
                                  capsuleClass +=
                                    " bg-slate-100 border-slate-200 text-slate-500";
                                } else if (cca.attendanceByDateKey?.[dateKey]) {
                                  capsuleClass +=
                                    " bg-emerald-50 border-emerald-200 text-emerald-700";
                                } else {
                                  capsuleClass +=
                                    " bg-red-50 border-red-200 text-red-700";
                                }
                              }

                              return (
                                <span key={i} className={capsuleClass}>
                                  {formatSessionDate(date)}
                                </span>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 italic bg-white rounded-xl border border-dashed border-slate-200">
                  No activities selected.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 bg-white border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>

        <ExportFieldsModal
          isOpen={exportFieldsOpen}
          onClose={() => {
            setExportFieldsOpen(false);
            setExportTarget(null);
          }}
          fields={exportFields}
          selectedFields={selectedExportFields}
          onChangeFields={setSelectedExportFields}
          fontSize={pdfFontSize}
          onFontSizeChange={setPdfFontSize}
          onExport={handleExportFieldsConfirm}
        />
      </div>
    </div>
  );
}
