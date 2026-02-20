import React, { useEffect, useMemo, useState } from "react";

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const parseDate = (value) => {
  if (!value) return null;

  if (typeof value === "object" && typeof value.toDate === "function") {
    const date = value.toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    ("seconds" in value || "nanoseconds" in value)
  ) {
    const date = new Date((value.seconds || 0) * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === "number") {
    const date = new Date(value > 1e12 ? value : value * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateLabel = (date) =>
  date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });

const getTodayDateOnly = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

export default function TeacherAttendancePanel({
  user,
  ccas,
  selections,
  classes,
}) {
  const [selectedCCAId, setSelectedCCAId] = useState("");
  const [attendanceByCell, setAttendanceByCell] = useState({});
  const [exportOpen, setExportOpen] = useState(false);

  const teacherName = normalizeText(user?.displayName);
  const teacherEmail = normalizeText(user?.email);

  const teacherCCAs = useMemo(() => {
    const teacherIdentity = [teacherName, teacherEmail].filter(Boolean);

    return (ccas || [])
      .filter((cca) => {
        const ccaTeacher = normalizeText(cca.teacher);
        if (!ccaTeacher || teacherIdentity.length === 0) return false;
        return teacherIdentity.includes(ccaTeacher);
      })
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [ccas, teacherName, teacherEmail]);

  useEffect(() => {
    if (!teacherCCAs.length) {
      setSelectedCCAId("");
      return;
    }

    if (!teacherCCAs.some((cca) => cca.id === selectedCCAId)) {
      setSelectedCCAId(teacherCCAs[0].id);
    }
  }, [teacherCCAs, selectedCCAId]);

  const selectedCCA = useMemo(
    () => teacherCCAs.find((cca) => cca.id === selectedCCAId) || null,
    [teacherCCAs, selectedCCAId],
  );

  const sessionDates = useMemo(() => {
    if (!selectedCCA?.sessionDates) return [];

    const rawDates = Array.isArray(selectedCCA.sessionDates)
      ? selectedCCA.sessionDates
      : [selectedCCA.sessionDates];

    return rawDates
      .map((value) => parseDate(value))
      .filter(Boolean)
      .sort((a, b) => a - b);
  }, [selectedCCA]);

  const classesById = useMemo(() => {
    return (classes || []).reduce((map, classItem) => {
      map[classItem.id] = classItem;
      return map;
    }, {});
  }, [classes]);

  const studentsForSelectedCCA = useMemo(() => {
    if (!selectedCCAId) return [];

    return (selections || [])
      .filter((selection) => selection.status !== "cancelled")
      .filter((selection) =>
        selection.selectedCCAs?.some((item) => item.id === selectedCCAId),
      )
      .map((selection) => ({
        id: selection.id,
        studentName: selection.studentName || "Unnamed Student",
        className: classesById[selection.classId]?.name || "Unknown Class",
      }))
      .sort((a, b) => a.studentName.localeCompare(b.studentName));
  }, [selections, selectedCCAId, classesById]);

  const today = getTodayDateOnly();

  const isSessionActive = (sessionDate) => {
    const sessionDateOnly = new Date(
      sessionDate.getFullYear(),
      sessionDate.getMonth(),
      sessionDate.getDate(),
    );
    return sessionDateOnly <= today;
  };

  const onToggleAttendance = (studentId, sessionDate, checked) => {
    if (!selectedCCAId) return;

    const dateKey = toDateKey(sessionDate);
    const cellKey = `${selectedCCAId}__${studentId}__${dateKey}`;
    setAttendanceByCell((prev) => ({ ...prev, [cellKey]: checked }));
  };

  const escapeCSV = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const buildAttendanceExportRows = () => {
    const exportSessionDates = sessionDates.filter((sessionDate) =>
      isSessionActive(sessionDate),
    );

    if (
      !selectedCCA ||
      exportSessionDates.length === 0 ||
      studentsForSelectedCCA.length === 0
    ) {
      return [];
    }

    const teacherInCharge =
      selectedCCA.teacher || user?.displayName || "Unassigned";
    const sessionHeaders = exportSessionDates.map((sessionDate) =>
      formatDateLabel(sessionDate),
    );

    return studentsForSelectedCCA.map((student) => {
      let totalPresent = 0;

      const statuses = exportSessionDates.map((sessionDate) => {
        const sessionKey = toDateKey(sessionDate);
        const cellKey = `${selectedCCAId}__${student.id}__${sessionKey}`;
        const isPresent = Boolean(attendanceByCell[cellKey]);
        if (isPresent) totalPresent += 1;
        return isPresent ? "P" : "A";
      });

      const totalAbsent = exportSessionDates.length - totalPresent;

      return {
        student,
        teacherInCharge,
        sessionHeaders,
        statuses,
        totalPresent,
        totalAbsent,
      };
    });
  };

  const handleExportCSV = () => {
    const rows = buildAttendanceExportRows();
    if (rows.length === 0) return;

    const datePart = new Date().toISOString().split("T")[0];
    const ccaPart = (selectedCCA?.name || "CCA")
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_-]/g, "");
    const reportFileBase = `Attendance_${ccaPart}_${datePart}`;

    const headers = [
      "Student Name",
      "Class",
      "CCA",
      "Teacher In-Charge",
      ...rows[0].sessionHeaders,
      "Total Present",
      "Total Absent",
    ];

    const csvRows = rows.map((row) =>
      [
        row.student.studentName,
        row.student.className,
        selectedCCA?.name || "",
        row.teacherInCharge,
        ...row.statuses,
        row.totalPresent,
        row.totalAbsent,
      ]
        .map(escapeCSV)
        .join(","),
    );

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...csvRows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${reportFileBase}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const rows = buildAttendanceExportRows();
    if (rows.length === 0) return;

    const datePart = new Date().toISOString().split("T")[0];
    const ccaPart = (selectedCCA?.name || "CCA")
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_-]/g, "");
    const reportFileBase = `Attendance_${ccaPart}_${datePart}`;

    const sessionHeaders = rows[0].sessionHeaders;
    const teacherInCharge = rows[0].teacherInCharge;

    const tableHeaderCells = [
      "Student Name",
      "Class",
      ...sessionHeaders,
      "Total Present",
      "Total Absent",
    ]
      .map((header) => `<th>${escapeHtml(header)}</th>`)
      .join("");

    const rowsHtml = rows
      .map((row) => {
        const statusCells = row.statuses
          .map((status) => `<td>${escapeHtml(status)}</td>`)
          .join("");

        return `<tr>
          <td>${escapeHtml(row.student.studentName)}</td>
          <td>${escapeHtml(row.student.className)}</td>
          ${statusCells}
          <td>${row.totalPresent}</td>
          <td>${row.totalAbsent}</td>
        </tr>`;
      })
      .join("\n");

    const html = `
      <html>
        <head>
          <title>${escapeHtml(reportFileBase)}</title>
          <style>
            @page { size: A4 landscape; margin: 10mm; }
            body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:0;padding:12px;font-size:10px;color:#111}
            h2{font-size:14px;margin:0 0 4px}
            p{margin:0 0 8px;font-size:10px;color:#444}
            table{width:100%;border-collapse:collapse}
            th,td{border:1px solid #ddd;padding:6px;text-align:left;font-size:9px;vertical-align:top}
            th{background:#f3f4f6;font-weight:700}
          </style>
        </head>
        <body>
          <h2>Attendance Report - ${escapeHtml(selectedCCA?.name || "")}</h2>
          <p>Teacher In-Charge: ${escapeHtml(teacherInCharge)}</p>
          <table>
            <thead>
              <tr>${tableHeaderCells}</tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    setTimeout(() => {
      w.focus();
      w.print();
    }, 300);
  };

  const canExport =
    Boolean(selectedCCA) &&
    sessionDates.some((sessionDate) => isSessionActive(sessionDate)) &&
    studentsForSelectedCCA.length > 0;

  useEffect(() => {
    setExportOpen(false);
  }, [selectedCCAId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-4">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
            <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest">
              My CCAs
            </h2>
          </div>

          <div
            className="p-4 space-y-2 overflow-y-auto"
            style={{
              height: "calc(100vh - 400px)",
              minHeight: "400px",
            }}
          >
            {teacherCCAs.length > 0 ? (
              teacherCCAs.map((cca) => {
                const isActive = cca.id === selectedCCAId;
                return (
                  <button
                    key={cca.id}
                    type="button"
                    onClick={() => setSelectedCCAId(cca.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm font-bold transition-colors ${
                      isActive
                        ? "bg-brand-primary/10 text-brand-primary border-brand-primary/30"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {cca.name}
                  </button>
                );
              })
            ) : (
              <p className="text-sm text-slate-400">No CCA assigned to you.</p>
            )}
          </div>
        </div>
      </div>

      <div className="lg:col-span-8">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest">
                Attendance
              </h2>
              {selectedCCA && (
                <p className="text-xs text-slate-500 mt-1 font-bold">
                  {selectedCCA.name}
                </p>
              )}
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setExportOpen((prev) => !prev)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors ${
                  canExport
                    ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                    : "bg-slate-100 text-slate-300 cursor-not-allowed"
                }`}
                title="Export attendance"
                disabled={!canExport}
              >
                Export
                <span>▾</span>
              </button>

              {exportOpen && canExport && (
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border z-50">
                  <button
                    type="button"
                    onClick={() => {
                      handleExportCSV();
                      setExportOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50"
                  >
                    Export CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleExportPDF();
                      setExportOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50"
                  >
                    Export PDF
                  </button>
                </div>
              )}
            </div>
          </div>

          {!selectedCCA ? (
            <div className="p-6 text-sm text-slate-400">
              Select a CCA to view attendance.
            </div>
          ) : sessionDates.length === 0 ? (
            <div className="p-6 text-sm text-slate-400">
              This CCA has no session dates configured.
            </div>
          ) : studentsForSelectedCCA.length === 0 ? (
            <div className="p-6 text-sm text-slate-400">
              No students found for this CCA.
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-left min-w-[680px]">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest sticky left-0 bg-slate-50 z-10">
                      Student
                    </th>
                    {sessionDates.map((sessionDate) => {
                      const sessionKey = toDateKey(sessionDate);
                      const active = isSessionActive(sessionDate);
                      return (
                        <th
                          key={sessionKey}
                          className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap"
                        >
                          <span>{formatDateLabel(sessionDate)}</span>
                          <span
                            className={`block text-[10px] mt-1 ${active ? "text-emerald-500" : "text-slate-300"}`}
                          >
                            {active ? "Active" : "Future"}
                          </span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentsForSelectedCCA.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/70">
                      <td className="p-4 sticky left-0 bg-white">
                        <p className="text-sm font-bold text-slate-700">
                          {student.studentName}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {student.className}
                        </p>
                      </td>
                      {sessionDates.map((sessionDate) => {
                        const sessionKey = toDateKey(sessionDate);
                        const cellKey = `${selectedCCAId}__${student.id}__${sessionKey}`;
                        const active = isSessionActive(sessionDate);

                        return (
                          <td key={cellKey} className="p-4 text-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-brand-primary cursor-pointer disabled:cursor-not-allowed"
                              checked={Boolean(attendanceByCell[cellKey])}
                              disabled={!active}
                              onChange={(event) =>
                                onToggleAttendance(
                                  student.id,
                                  sessionDate,
                                  event.target.checked,
                                )
                              }
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
