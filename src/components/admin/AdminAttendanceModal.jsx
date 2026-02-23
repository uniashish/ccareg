import React, { useEffect, useMemo, useState } from "react";
import {
  FiX,
  FiCalendar,
  FiUsers,
  FiCheckCircle,
  FiDownload,
} from "react-icons/fi";
import { db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";

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

const formatDateLabel = (dateKey) => {
  const [year, month, day] = String(dateKey || "")
    .split("-")
    .map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1);
  if (Number.isNaN(date.getTime())) return dateKey;
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function AdminAttendanceModal({
  isOpen,
  onClose,
  cca,
  selections,
  users,
}) {
  const [attendanceByDate, setAttendanceByDate] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const escapeCSV = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const enrolledStudents = useMemo(() => {
    if (!cca || !Array.isArray(selections)) return [];

    const list = selections
      .filter((selection) => selection.status !== "cancelled")
      .filter((selection) =>
        selection.selectedCCAs?.some(
          (selectedCCA) => selectedCCA.id === cca.id,
        ),
      )
      .map((selection) => {
        const studentId = selection.studentUid || selection.id;
        const profile = users ? users[studentId] : null;
        const studentName =
          profile?.displayName ||
          selection.studentName ||
          selection.studentEmail?.split("@")[0] ||
          "Unknown";

        return {
          id: studentId,
          name: studentName,
        };
      });

    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [cca, selections, users]);

  useEffect(() => {
    const loadAttendance = async () => {
      if (!isOpen || !cca?.id) return;

      const parsedDates = (
        Array.isArray(cca.sessionDates) ? cca.sessionDates : [cca.sessionDates]
      )
        .map((rawDate) => parseDate(rawDate))
        .filter(Boolean)
        .sort((a, b) => a - b);

      const dateKeys = [...new Set(parsedDates.map((date) => toDateKey(date)))];

      if (!dateKeys.length) {
        setAttendanceByDate([]);
        return;
      }

      setIsLoading(true);
      try {
        const docs = await Promise.allSettled(
          dateKeys.map((dateKey) =>
            getDoc(doc(db, "attendanceRecords", `${cca.id}_${dateKey}`)),
          ),
        );

        const rows = dateKeys.map((dateKey, index) => {
          const result = docs[index];
          if (result.status !== "fulfilled" || !result.value.exists()) {
            return {
              dateKey,
              presentStudentIds: [],
              hasSubmittedRecord: false,
            };
          }

          const data = result.value.data() || {};
          return {
            dateKey,
            presentStudentIds: Array.isArray(data.presentStudentIds)
              ? data.presentStudentIds
              : [],
            hasSubmittedRecord: true,
          };
        });

        setAttendanceByDate(rows);
      } catch (error) {
        console.error("Error loading admin attendance view:", error);
        setAttendanceByDate([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadAttendance();
  }, [isOpen, cca]);

  if (!isOpen || !cca) return null;

  const studentNameById = enrolledStudents.reduce((map, student) => {
    map[student.id] = student.name;
    return map;
  }, {});

  const buildExportRows = () => {
    return attendanceByDate.map((entry) => {
      const presentStudents = entry.presentStudentIds
        .map(
          (studentId) => studentNameById[studentId] || `Unknown (${studentId})`,
        )
        .sort((a, b) => a.localeCompare(b));

      const presentIdSet = new Set(entry.presentStudentIds);
      const absentStudents = enrolledStudents
        .filter((student) => !presentIdSet.has(student.id))
        .map((student) => student.name)
        .sort((a, b) => a.localeCompare(b));

      return {
        dateKey: entry.dateKey,
        dateLabel: formatDateLabel(entry.dateKey),
        status: entry.hasSubmittedRecord ? "Submitted" : "Not Submitted",
        presentCount: presentStudents.length,
        absentCount: absentStudents.length,
        totalCount: enrolledStudents.length,
        presentStudents,
        absentStudents,
      };
    });
  };

  const handleExportCSV = () => {
    const rows = buildExportRows();
    if (!rows.length) return;

    const headers = [
      "CCA",
      "Date",
      "Status",
      "Present",
      "Absent",
      "Total",
      "Present Students",
      "Absent Students",
    ];

    const csvRows = rows.map((row) =>
      [
        cca.name || "",
        row.dateLabel,
        row.status,
        row.presentCount,
        row.absentCount,
        row.totalCount,
        row.presentStudents.join("; "),
        row.absentStudents.join("; "),
      ]
        .map(escapeCSV)
        .join(","),
    );

    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeName = (cca.name || "CCA").replace(/\s+/g, "_");
    link.href = url;
    link.download = `Attendance_${safeName}_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    const rows = buildExportRows();
    if (!rows.length) return;

    const tableRows = rows
      .map(
        (row) =>
          `<tr>
            <td>${escapeHtml(row.dateLabel)}</td>
            <td>${escapeHtml(row.status)}</td>
            <td>${row.presentCount}</td>
            <td>${row.absentCount}</td>
            <td>${row.totalCount}</td>
            <td>${escapeHtml(row.presentStudents.join(", ") || "-")}</td>
            <td>${escapeHtml(row.absentStudents.join(", ") || "-")}</td>
          </tr>`,
      )
      .join("\n");

    const html = `
      <html>
        <head>
          <title>${escapeHtml(cca.name)} Attendance</title>
          <style>
            @page { size: A4 landscape; margin: 12mm; }
            body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:0;padding:12px;font-size:10px;color:#111}
            h2{font-size:14px;margin:0 0 8px}
            table{width:100%;border-collapse:collapse}
            th,td{border:1px solid #ddd;padding:6px;text-align:left;font-size:10px;vertical-align:top}
            th{background:#f3f4f6;font-weight:700}
          </style>
        </head>
        <body>
          <h2>${escapeHtml(cca.name)} - Attendance by Date</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Total</th>
                <th>Present Students</th>
                <th>Absent Students</th>
              </tr>
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

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-4xl max-h-[88vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/60 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-black text-slate-800">{cca.name}</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Attendance grouped by date
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportCSV}
              disabled={isLoading || attendanceByDate.length === 0}
              className={`px-3 py-2 rounded-lg text-xs font-bold border transition-colors inline-flex items-center gap-1.5 ${
                isLoading || attendanceByDate.length === 0
                  ? "bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <FiDownload size={13} /> CSV
            </button>
            <button
              onClick={handleExportPDF}
              disabled={isLoading || attendanceByDate.length === 0}
              className={`px-3 py-2 rounded-lg text-xs font-bold border transition-colors inline-flex items-center gap-1.5 ${
                isLoading || attendanceByDate.length === 0
                  ? "bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <FiDownload size={13} /> PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          {isLoading ? (
            <div className="text-sm text-slate-400">Loading attendance...</div>
          ) : attendanceByDate.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FiCalendar className="mx-auto mb-3" size={28} />
              <p className="font-medium">
                No session dates found for this CCA.
              </p>
            </div>
          ) : (
            attendanceByDate.map((entry) => {
              const presentStudents = entry.presentStudentIds
                .map((studentId) => ({
                  id: studentId,
                  name: studentNameById[studentId] || `Unknown (${studentId})`,
                }))
                .sort((a, b) => a.name.localeCompare(b.name));

              return (
                <div
                  key={entry.dateKey}
                  className="rounded-2xl border border-slate-200 overflow-hidden"
                >
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <FiCalendar size={14} className="text-brand-primary" />
                      {formatDateLabel(entry.dateKey)}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-bold">
                      <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-md">
                        <FiCheckCircle size={12} />
                        Present: {presentStudents.length}
                      </span>
                      <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 border border-slate-200 px-2 py-1 rounded-md">
                        <FiUsers size={12} />
                        Total: {enrolledStudents.length}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-md border ${
                          entry.hasSubmittedRecord
                            ? "text-indigo-600 bg-indigo-50 border-indigo-100"
                            : "text-slate-500 bg-white border-slate-200"
                        }`}
                      >
                        {entry.hasSubmittedRecord
                          ? "Submitted"
                          : "Not Submitted"}
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    {presentStudents.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {presentStudents.map((student) => (
                          <span
                            key={`${entry.dateKey}-${student.id}`}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100"
                          >
                            {student.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 font-medium">
                        No students marked present for this date.
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
