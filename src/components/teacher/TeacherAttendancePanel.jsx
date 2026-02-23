import React, { useEffect, useMemo, useState } from "react";
import { db } from "../../firebase";
import { doc, getDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import MessageModal from "../common/MessageModal";

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
  onDirtyChange = () => {},
}) {
  const [selectedCCAId, setSelectedCCAId] = useState("");
  const [attendanceByCell, setAttendanceByCell] = useState({});
  const [persistedAttendanceByCell, setPersistedAttendanceByCell] = useState(
    {},
  );
  const [exportOpen, setExportOpen] = useState(false);
  const [expandedPastByStudent, setExpandedPastByStudent] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSavedAttendance, setIsLoadingSavedAttendance] =
    useState(false);
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });

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
  const todayKey = toDateKey(today);

  const todaySessionDates = useMemo(
    () =>
      sessionDates.filter((sessionDate) => toDateKey(sessionDate) === todayKey),
    [sessionDates, todayKey],
  );

  const pastSessionDates = useMemo(
    () =>
      sessionDates
        .filter((sessionDate) => toDateKey(sessionDate) < todayKey)
        .reverse(),
    [sessionDates, todayKey],
  );

  const isSessionActive = (sessionDate) => {
    const sessionDateOnly = new Date(
      sessionDate.getFullYear(),
      sessionDate.getMonth(),
      sessionDate.getDate(),
    );
    return sessionDateOnly <= today;
  };

  const getPresentKeySetForCurrentCCA = (attendanceMap) => {
    if (!selectedCCAId) return new Set();

    const prefix = `${selectedCCAId}__`;
    return new Set(
      Object.keys(attendanceMap).filter(
        (key) => key.startsWith(prefix) && Boolean(attendanceMap[key]),
      ),
    );
  };

  const hasUnsavedChanges = useMemo(() => {
    const currentSet = getPresentKeySetForCurrentCCA(attendanceByCell);
    const persistedSet = getPresentKeySetForCurrentCCA(
      persistedAttendanceByCell,
    );

    if (currentSet.size !== persistedSet.size) return true;

    for (const key of currentSet) {
      if (!persistedSet.has(key)) return true;
    }

    return false;
  }, [attendanceByCell, persistedAttendanceByCell, selectedCCAId]);

  const isPastSession = (sessionDate) => {
    const sessionDateOnly = new Date(
      sessionDate.getFullYear(),
      sessionDate.getMonth(),
      sessionDate.getDate(),
    );
    return sessionDateOnly < today;
  };

  const onToggleAttendance = (studentId, sessionDate, checked) => {
    if (!selectedCCAId) return;

    if (isPastSession(sessionDate)) {
      const studentName =
        studentsForSelectedCCA.find((student) => student.id === studentId)
          ?.studentName || "this student";
      const actionLabel = checked ? "present" : "absent";
      const confirmed = window.confirm(
        `Confirm update: mark ${studentName} as ${actionLabel} for ${formatDateLabel(sessionDate)}?`,
      );
      if (!confirmed) return;
    }

    const dateKey = toDateKey(sessionDate);
    const cellKey = `${selectedCCAId}__${studentId}__${dateKey}`;
    setAttendanceByCell((prev) => ({ ...prev, [cellKey]: checked }));
  };

  const onMarkAllActivePresent = (studentId) => {
    if (!selectedCCAId) return;

    const studentName =
      studentsForSelectedCCA.find((student) => student.id === studentId)
        ?.studentName || "this student";
    const activeCount = sessionDates.filter((sessionDate) =>
      isSessionActive(sessionDate),
    ).length;

    const confirmed = window.confirm(
      `Mark ${studentName} as present for all ${activeCount} active session(s)?`,
    );
    if (!confirmed) return;

    setAttendanceByCell((prev) => {
      const next = { ...prev };

      sessionDates.forEach((sessionDate) => {
        if (!isSessionActive(sessionDate)) return;

        const dateKey = toDateKey(sessionDate);
        const cellKey = `${selectedCCAId}__${studentId}__${dateKey}`;
        next[cellKey] = true;
      });

      return next;
    });
  };

  const onClearAllActive = (studentId) => {
    if (!selectedCCAId) return;

    const studentName =
      studentsForSelectedCCA.find((student) => student.id === studentId)
        ?.studentName || "this student";
    const activeCount = sessionDates.filter((sessionDate) =>
      isSessionActive(sessionDate),
    ).length;

    const confirmed = window.confirm(
      `Clear attendance for ${studentName} across all ${activeCount} active session(s)?`,
    );
    if (!confirmed) return;

    setAttendanceByCell((prev) => {
      const next = { ...prev };

      sessionDates.forEach((sessionDate) => {
        if (!isSessionActive(sessionDate)) return;

        const dateKey = toDateKey(sessionDate);
        const cellKey = `${selectedCCAId}__${studentId}__${dateKey}`;
        next[cellKey] = false;
      });

      return next;
    });
  };

  const handleSubmitAttendance = async () => {
    if (!selectedCCAId || !selectedCCA) return;

    const activeSessionDateKeys = sessionDates
      .filter((sessionDate) => isSessionActive(sessionDate))
      .map((sessionDate) => toDateKey(sessionDate));

    if (
      activeSessionDateKeys.length === 0 ||
      studentsForSelectedCCA.length === 0
    ) {
      setModalState({
        isOpen: true,
        type: "info",
        title: "Nothing to Submit",
        message: "No active attendance sessions available for submission.",
      });
      return;
    }

    const changedDatePayloads = activeSessionDateKeys
      .map((dateKey) => {
        const currentPresentStudentIds = studentsForSelectedCCA
          .filter(
            (student) =>
              attendanceByCell[
                `${selectedCCAId}__${student.id}__${dateKey}`
              ] === true,
          )
          .map((student) => student.id)
          .sort();

        const persistedPresentStudentIds = studentsForSelectedCCA
          .filter(
            (student) =>
              persistedAttendanceByCell[
                `${selectedCCAId}__${student.id}__${dateKey}`
              ] === true,
          )
          .map((student) => student.id)
          .sort();

        const isSameLength =
          currentPresentStudentIds.length === persistedPresentStudentIds.length;
        const isSameValues =
          isSameLength &&
          currentPresentStudentIds.every(
            (value, index) => value === persistedPresentStudentIds[index],
          );

        if (isSameValues) return null;

        return {
          dateKey,
          presentStudentIds: currentPresentStudentIds,
        };
      })
      .filter(Boolean);

    if (changedDatePayloads.length === 0) {
      setModalState({
        isOpen: true,
        type: "info",
        title: "No Changes",
        message: "Attendance is already up to date.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const batch = writeBatch(db);

      changedDatePayloads.forEach(({ dateKey, presentStudentIds }) => {
        const attendanceRef = doc(
          db,
          "attendanceRecords",
          `${selectedCCAId}_${dateKey}`,
        );
        batch.set(
          attendanceRef,
          {
            ccaId: selectedCCAId,
            dateKey,
            presentStudentIds,
            updatedAt: serverTimestamp(),
            updatedByUid: user?.uid || "",
          },
          { merge: true },
        );
      });

      await batch.commit();
      setPersistedAttendanceByCell({ ...attendanceByCell });

      setModalState({
        isOpen: true,
        type: "success",
        title: "Attendance Submitted",
        message: `Saved ${changedDatePayloads.length} attendance record(s).`,
      });
    } catch (error) {
      console.error("Error saving attendance:", error);
      setModalState({
        isOpen: true,
        type: "error",
        title: "Save Failed",
        message: "Unable to submit attendance right now. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
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
    setExpandedPastByStudent({});
  }, [selectedCCAId]);

  useEffect(() => {
    onDirtyChange(hasUnsavedChanges);
  }, [hasUnsavedChanges, onDirtyChange]);

  useEffect(() => {
    const fetchSavedAttendance = async () => {
      if (!selectedCCAId) {
        setAttendanceByCell({});
        setPersistedAttendanceByCell({});
        return;
      }

      if (!sessionDates.length) {
        setAttendanceByCell({});
        setPersistedAttendanceByCell({});
        return;
      }

      setIsLoadingSavedAttendance(true);
      try {
        const restoredAttendance = {};
        const uniqueDateKeys = [
          ...new Set(sessionDates.map((d) => toDateKey(d))),
        ];

        const attendanceResults = await Promise.allSettled(
          uniqueDateKeys.map((dateKey) =>
            getDoc(doc(db, "attendanceRecords", `${selectedCCAId}_${dateKey}`)),
          ),
        );

        attendanceResults.forEach((result) => {
          if (result.status !== "fulfilled") return;

          const attendanceDoc = result.value;
          if (!attendanceDoc.exists()) return;

          const data = attendanceDoc.data() || {};
          const dateKey = data.dateKey;
          const presentStudentIds = Array.isArray(data.presentStudentIds)
            ? data.presentStudentIds
            : [];

          if (!dateKey) return;

          presentStudentIds.forEach((studentId) => {
            const cellKey = `${selectedCCAId}__${studentId}__${dateKey}`;
            restoredAttendance[cellKey] = true;
          });
        });

        setAttendanceByCell(restoredAttendance);
        setPersistedAttendanceByCell(restoredAttendance);
      } catch (error) {
        console.error("Error loading attendance:", error);
        setAttendanceByCell({});
        setPersistedAttendanceByCell({});
      } finally {
        setIsLoadingSavedAttendance(false);
      }
    };

    fetchSavedAttendance();
  }, [selectedCCAId, sessionDates]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-4">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
            <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest">
              My CCAs
            </h2>
          </div>

          <div className="p-4 space-y-2 overflow-y-auto max-h-[50vh] lg:max-h-[calc(100vh-400px)]">
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
          ) : isLoadingSavedAttendance ? (
            <div className="p-6 text-sm text-slate-400">
              Loading attendance...
            </div>
          ) : (
            <>
              <div className="md:hidden p-4 space-y-3">
                {studentsForSelectedCCA.map((student) => (
                  <div
                    key={student.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="mb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-slate-700">
                            {student.studentName}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {student.className}
                          </p>
                        </div>
                        <div className="shrink-0 flex items-center gap-1.5">
                          {pastSessionDates.length > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedPastByStudent((prev) => ({
                                  ...prev,
                                  [student.id]: !prev[student.id],
                                }))
                              }
                              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 transition-colors"
                            >
                              {expandedPastByStudent[student.id]
                                ? "Hide Past ▲"
                                : "Past Dates +"}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onMarkAllActivePresent(student.id)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 transition-colors"
                          >
                            Mark All Present
                          </button>
                          <button
                            type="button"
                            onClick={() => onClearAllActive(student.id)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 transition-colors"
                          >
                            Clear Active
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {todaySessionDates.length > 0 ? (
                        todaySessionDates.map((sessionDate) => {
                          const sessionKey = toDateKey(sessionDate);
                          const cellKey = `${selectedCCAId}__${student.id}__${sessionKey}`;
                          const active = isSessionActive(sessionDate);

                          return (
                            <label
                              key={cellKey}
                              className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                            >
                              <div>
                                <p className="text-xs font-bold text-slate-600">
                                  Today • {formatDateLabel(sessionDate)}
                                </p>
                                <p
                                  className={`text-[10px] ${active ? "text-emerald-500" : "text-slate-300"}`}
                                >
                                  {active ? "Active" : "Future"}
                                </p>
                              </div>
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
                            </label>
                          );
                        })
                      ) : (
                        <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                          <p className="text-xs font-bold text-slate-500">
                            No session scheduled for today
                          </p>
                        </div>
                      )}

                      {expandedPastByStudent[student.id] &&
                        pastSessionDates.map((sessionDate) => {
                          const sessionKey = toDateKey(sessionDate);
                          const cellKey = `${selectedCCAId}__${student.id}__${sessionKey}`;
                          const active = isSessionActive(sessionDate);

                          return (
                            <label
                              key={cellKey}
                              className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2"
                            >
                              <div>
                                <p className="text-xs font-bold text-slate-600">
                                  {formatDateLabel(sessionDate)}
                                </p>
                                <p
                                  className={`text-[10px] ${active ? "text-emerald-500" : "text-slate-300"}`}
                                >
                                  {active ? "Past" : "Future"}
                                </p>
                              </div>
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
                            </label>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block overflow-auto">
                <table className="w-full text-left min-w-[560px] sm:min-w-[680px]">
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

              <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-xs font-bold text-slate-400 w-full sm:w-auto">
                  {hasUnsavedChanges
                    ? "You have unsaved attendance changes"
                    : "Attendance is up to date"}
                </p>
                <button
                  type="button"
                  onClick={handleSubmitAttendance}
                  disabled={isSaving || !hasUnsavedChanges}
                  className={`w-full sm:w-auto px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                    isSaving || !hasUnsavedChanges
                      ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                      : "bg-brand-primary text-white hover:bg-brand-primary/90"
                  }`}
                >
                  {isSaving ? "Submitting..." : "Submit Attendance"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <MessageModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
      />
    </div>
  );
}
