import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  FiSearch,
  FiDownload,
  FiChevronDown,
  FiUser,
  FiGrid,
  FiCalendar,
  FiTrash2,
  FiActivity,
  FiX,
  FiFilter,
} from "react-icons/fi";
import { db } from "../../firebase";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { downloadSelectionsPDF } from "../../utils/pdfExporter";
import MessageModal from "../common/MessageModal";
import StudentDetailsModal from "./StudentDetailsModal";

// --- MAIN COMPONENT ---
export default function SelectionsManager({
  selections,
  users,
  classesList,
  onResetStudent,
  onDeleteCCA,
}) {
  const [searchTerm, setSearchTerm] = useState("");

  // --- FILTER STATES ---
  const [filterClass, setFilterClass] = useState("");
  const [filterCCA, setFilterCCA] = useState("");

  // --- MODAL STATE ---
  const [viewingSelection, setViewingSelection] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);
  const exportMenuRef = useRef(null);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: "info",
    mode: "info",
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    onConfirm: null,
    onCancel: null,
  });

  const showModal = (type, title, message) => {
    setModalConfig({
      isOpen: true,
      type,
      mode: "info",
      title,
      message,
      confirmText: "Confirm",
      cancelText: "Cancel",
      onConfirm: null,
      onCancel: null,
    });
  };

  const showConfirmModal = ({
    type = "info",
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = "Confirm",
    cancelText = "Cancel",
  }) => {
    setModalConfig({
      isOpen: true,
      type,
      mode: "confirm",
      title,
      message,
      confirmText,
      cancelText,
      onConfirm,
      onCancel: onCancel || null,
    });
  };

  const closeModal = () => {
    setModalConfig((prev) => ({
      ...prev,
      isOpen: false,
      onConfirm: null,
      onCancel: null,
    }));
  };

  const formatAttendanceDate = (dateKey) => {
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

  const escapeCSV = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const buildStudentAttendanceRows = ({ attendanceDocs, selection, cca }) => {
    const studentIds = [selection.id, selection.studentUid].filter(Boolean);
    const studentIdSet = new Set(studentIds);

    return attendanceDocs
      .map((record) => {
        const presentStudentIds = Array.isArray(record.presentStudentIds)
          ? record.presentStudentIds
          : [];
        const wasPresent = presentStudentIds.some((id) => studentIdSet.has(id));
        if (!wasPresent) return null;

        return {
          dateKey: record.dateKey || "",
          dateLabel: formatAttendanceDate(record.dateKey || ""),
          studentName: selection.studentName || "Unknown Student",
          studentEmail: selection.studentEmail || "",
          ccaName: cca.name || "",
          status: "Present",
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  };

  const downloadStudentAttendanceCSV = ({ rows, selection, cca }) => {
    const headers = ["Student Name", "Email", "CCA", "Date", "Status"];
    const csvRows = rows.map((row) =>
      [
        row.studentName,
        row.studentEmail,
        row.ccaName,
        row.dateLabel,
        row.status,
      ]
        .map(escapeCSV)
        .join(","),
    );

    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const safeStudentName = (selection.studentName || "Student")
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_-]/g, "");
    const safeCCAName = (cca.name || "CCA")
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_-]/g, "");
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute(
      "download",
      `Attendance_${safeStudentName}_${safeCCAName}_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadStudentAttendancePDF = ({ rows, selection, cca }) => {
    const tableRows = rows
      .map(
        (row) => `<tr>
          <td>${escapeHtml(row.studentName)}</td>
          <td>${escapeHtml(row.studentEmail)}</td>
          <td>${escapeHtml(row.ccaName)}</td>
          <td>${escapeHtml(row.dateLabel)}</td>
          <td>${escapeHtml(row.status)}</td>
        </tr>`,
      )
      .join("\n");

    const html = `
      <html>
        <head>
          <title>${escapeHtml(selection.studentName || "Student")} - ${escapeHtml(cca.name || "CCA")} Attendance</title>
          <style>
            @page { size: A4 landscape; margin: 12mm; }
            body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:0;padding:12px;font-size:10px;color:#111}
            h2{font-size:13px;margin-bottom:8px}
            table{width:100%;border-collapse:collapse}
            th,td{border:1px solid #ddd;padding:6px;text-align:left;font-size:10px;vertical-align:top}
            th{background:#f3f4f6;font-weight:700}
          </style>
        </head>
        <body>
          <h2>${escapeHtml(selection.studentName || "Student")} - ${escapeHtml(cca.name || "CCA")} Attendance Record</h2>
          <table>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Email</th>
                <th>CCA</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
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

  const cleanupAttendanceRecords = async (attendanceDocs, selection) => {
    const studentIds = [selection.id, selection.studentUid].filter(Boolean);
    const studentIdSet = new Set(studentIds);
    const batch = writeBatch(db);
    let hasUpdates = false;

    attendanceDocs.forEach((record) => {
      const currentIds = Array.isArray(record.presentStudentIds)
        ? record.presentStudentIds
        : [];
      const updatedIds = currentIds.filter((id) => !studentIdSet.has(id));

      if (updatedIds.length === currentIds.length) return;

      batch.update(doc(db, "attendanceRecords", record.id), {
        presentStudentIds: updatedIds,
      });
      hasUpdates = true;
    });

    if (hasUpdates) {
      await batch.commit();
    }
  };

  const executeAttendanceAwareRemoval = async ({
    format,
    rows,
    selection,
    cca,
    attendanceDocs,
  }) => {
    closeModal();

    if (format === "pdf") {
      downloadStudentAttendancePDF({ rows, selection, cca });
    } else {
      downloadStudentAttendanceCSV({ rows, selection, cca });
    }

    try {
      await cleanupAttendanceRecords(attendanceDocs, selection);
      const removed = await onDeleteCCA(selection.id, cca);
      if (!removed) {
        showModal(
          "error",
          "Removal Failed",
          "Attendance data was cleaned, but removing the student CCA failed. Please refresh and verify the record.",
        );
      }
    } catch (error) {
      console.error("Error removing attendance-linked CCA:", error);
      showModal(
        "error",
        "Removal Failed",
        "Unable to complete attendance cleanup and CCA removal. Please try again.",
      );
    }
  };

  const handleConfirmSingleCCARemoval = async (selection, cca) => {
    try {
      const attendanceSnapshot = await getDocs(
        query(
          collection(db, "attendanceRecords"),
          where("ccaId", "==", cca.id),
        ),
      );

      const attendanceDocs = attendanceSnapshot.docs.map((document) => ({
        id: document.id,
        ...(document.data() || {}),
      }));

      const attendanceRows = buildStudentAttendanceRows({
        attendanceDocs,
        selection,
        cca,
      });

      if (attendanceRows.length === 0) {
        showConfirmModal({
          type: "error",
          title: "Remove CCA?",
          message: `Are you sure you want to remove ${cca.name} for this student?`,
          confirmText: "Remove",
          cancelText: "Cancel",
          onConfirm: async () => {
            closeModal();
            await onDeleteCCA(selection.id, cca);
          },
        });
        return;
      }

      showConfirmModal({
        type: "error",
        title: "Attendance Record Found",
        message: `This student has already attended ${attendanceRows.length} session(s) in ${cca.name}. Continuing will download the attendance record, delete attendance data from the database, and remove this CCA for the student.`,
        confirmText: "Continue",
        cancelText: "Cancel",
        onConfirm: () => {
          closeModal();
          showConfirmModal({
            type: "info",
            title: "Download Format",
            message:
              "Choose the file format. After download, attendance data and this CCA selection will be deleted.",
            confirmText: "Download PDF",
            cancelText: "Download CSV",
            onConfirm: () =>
              executeAttendanceAwareRemoval({
                format: "pdf",
                rows: attendanceRows,
                selection,
                cca,
                attendanceDocs,
              }),
            onCancel: () =>
              executeAttendanceAwareRemoval({
                format: "csv",
                rows: attendanceRows,
                selection,
                cca,
                attendanceDocs,
              }),
          });
        },
      });
    } catch (error) {
      console.error("Error checking attendance before CCA removal:", error);
      showModal(
        "error",
        "Unable to Remove",
        "Failed to validate attendance records. Please try again.",
      );
    }
  };

  const handleConfirmResetStudent = (selectionId) => {
    showConfirmModal({
      type: "error",
      title: "Delete Student Record?",
      message:
        "This will remove all selections for this student and free all occupied seats.",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        closeModal();
        const deleted = await onResetStudent(selectionId, true);
        if (deleted) {
          showModal(
            "success",
            "Record Deleted",
            "The student selection record has been deleted successfully.",
          );
        }
      },
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target)
      ) {
        setExportOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setExportOpen(false);
      }
    };

    if (exportOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [exportOpen]);

  const classMap = useMemo(() => {
    return classesList.reduce((acc, cls) => {
      acc[cls.id] = cls;
      return acc;
    }, {});
  }, [classesList]);

  // --- EXTRACT UNIQUE CCA NAMES FOR DROPDOWN ---
  const uniqueCCANames = useMemo(() => {
    const names = new Set();
    if (selections) {
      selections.forEach((s) => {
        if (s.selectedCCAs && Array.isArray(s.selectedCCAs)) {
          s.selectedCCAs.forEach((cca) => names.add(cca.name));
        }
      });
    }
    return Array.from(names).sort();
  }, [selections]);

  const filteredSelections = (selections || []).filter((s) => {
    const user = users ? users[s.studentUid] : null;
    const name = user?.displayName?.toLowerCase() || "";
    const email = s.studentEmail?.toLowerCase() || "";
    const term = searchTerm.toLowerCase();

    // 1. Search Text Match
    const matchesSearch = name.includes(term) || email.includes(term);

    // 2. Class Filter Match
    const matchesClass = !filterClass || s.classId === filterClass;

    // 3. CCA Filter Match (Checks if the student has selected this specific CCA)
    const matchesCCA =
      !filterCCA ||
      (s.selectedCCAs && s.selectedCCAs.some((c) => c.name === filterCCA));

    return matchesSearch && matchesClass && matchesCCA;
  });

  // --- INTERNAL CSV EXPORT FUNCTION ---
  const handleExportCSV = () => {
    if (filteredSelections.length === 0) {
      showModal("info", "No Data", "No data to export.");
      return;
    }

    // 1. Define Headers (REMOVED: Submitted Time, Status)
    const headers = [
      "Student Name",
      "Email",
      "Class",
      "CCA1",
      "CCA2",
      "CCA3",
      "Submitted Date",
    ];

    // 2. Map Data to Rows
    const rows = filteredSelections.map((sel) => {
      // Resolve Student Name
      const user = users ? users[sel.studentUid] : null;
      const studentName = (
        user?.displayName ||
        sel.studentName ||
        "Unknown"
      ).replace(/"/g, '""');

      // Resolve Class Name
      const classInfo = classMap[sel.classId];
      const className = (classInfo ? classInfo.name : "Unassigned").replace(
        /"/g,
        '""',
      );

      const cca1 = (sel.selectedCCAs?.[0]?.name || "").replace(/"/g, '""');
      const cca2 = (sel.selectedCCAs?.[1]?.name || "").replace(/"/g, '""');
      const cca3 = (sel.selectedCCAs?.[2]?.name || "").replace(/"/g, '""');

      // Resolve Date
      let dateStr = "";
      if (sel.timestamp && typeof sel.timestamp.toDate === "function") {
        const d = sel.timestamp.toDate();
        dateStr = d.toLocaleDateString();
      }

      return [
        `"${studentName}"`,
        `"${sel.studentEmail}"`,
        `"${className}"`,
        `"${cca1}"`,
        `"${cca2}"`,
        `"${cca3}"`,
        `"${dateStr}"`,
      ].join(",");
    });

    // 3. Combine Headers and Rows
    const csvContent = [headers.join(","), ...rows].join("\n");

    // 4. Determine Filename based on Filters
    let fileName = "MasterList";

    // Check if filters are applied
    if (filterClass || filterCCA) {
      const parts = [];

      if (filterClass) {
        const classObj = classMap[filterClass];
        if (classObj) parts.push(classObj.name);
      }

      if (filterCCA) {
        parts.push(filterCCA);
      }

      if (parts.length > 0) {
        fileName = parts.join("_");
      }
    }

    // Sanitize filename
    fileName = fileName.replace(/[\\/:*?"<>|]/g, "");

    // 5. Trigger Download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `${fileName}_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (filteredSelections.length === 0) {
      showModal("info", "No Data", "No data to export.");
      return;
    }

    const exportData = filteredSelections.map((sel) => {
      const user = users ? users[sel.studentUid] : null;
      return {
        ...sel,
        studentName: user?.displayName || sel.studentName || "Unknown",
      };
    });

    downloadSelectionsPDF(exportData, classesList);
  };

  return (
    <div className="animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Master List</h1>
          <p className="text-slate-500 text-sm mt-1">
            View and manage all student submissions ({filteredSelections.length}{" "}
            records)
          </p>
        </div>

        {/* ACTIONS & FILTERS TOOLBAR */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* CLASS FILTER */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <FiGrid />
            </div>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full sm:w-40 pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 appearance-none cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <option value="">All Classes</option>
              {classesList.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* ACTIVITY FILTER */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <FiActivity />
            </div>
            <select
              value={filterCCA}
              onChange={(e) => setFilterCCA(e.target.value)}
              className="w-full sm:w-48 pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 appearance-none cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <option value="">All Activities</option>
              {uniqueCCANames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* SEARCH BAR */}
          <div className="relative flex-1 sm:flex-none">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search student..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
            />
          </div>

          {/* EXPORT DROPDOWN */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setExportOpen((v) => !v)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 border rounded-xl font-bold transition-all active:scale-95 shadow-sm ${filteredSelections.length > 0 ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300" : "bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed"}`}
              title="Export options"
              disabled={filteredSelections.length === 0}
            >
              <FiDownload />
              <span className="hidden sm:inline">Export</span>
              <FiChevronDown />
            </button>

            {exportOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border border-slate-200 z-50 overflow-hidden">
                <button
                  onClick={() => {
                    handleExportCSV();
                    setExportOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => {
                    handleExportPDF();
                    setExportOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Export PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[68vh]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest w-[25%]">
                  Student
                </th>
                <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest w-[15%]">
                  Class
                </th>
                <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest w-[35%]">
                  Selected Activities
                </th>
                <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest w-[15%]">
                  Submitted
                </th>
                <th className="p-5 text-right text-xs font-black text-slate-400 uppercase tracking-widest w-[10%]">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredSelections.length > 0 ? (
                filteredSelections.map((sel) => {
                  const userProfile = users ? users[sel.studentUid] : null;
                  const displayName =
                    userProfile?.displayName ||
                    sel.studentName ||
                    "Unknown Student";
                  const classInfo = classMap[sel.classId];

                  return (
                    <tr
                      key={sel.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                            <FiUser />
                          </div>
                          <div>
                            {/* Student Name as Button */}
                            <button
                              onClick={() => setViewingSelection(sel)}
                              className="font-bold text-slate-700 text-sm hover:text-brand-primary hover:underline text-left"
                            >
                              {displayName}
                            </button>
                            <div className="text-xs text-slate-400">
                              {sel.studentEmail}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-5">
                        {classInfo ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                            {classInfo.name}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs italic">
                            Unassigned
                          </span>
                        )}
                      </td>

                      <td className="p-5">
                        <div className="flex flex-wrap gap-2">
                          {sel.selectedCCAs && sel.selectedCCAs.length > 0 ? (
                            sel.selectedCCAs.map((cca, idx) => (
                              <div
                                key={idx}
                                className="group/tag relative inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all cursor-pointer"
                              >
                                {cca.name}
                                {/* Delete specific CCA button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleConfirmSingleCCARemoval(sel, cca);
                                  }}
                                  className="ml-1 p-0.5 rounded-full hover:bg-red-200 text-indigo-400 hover:text-red-700 opacity-0 group-hover/tag:opacity-100 transition-all"
                                  title="Remove this CCA only"
                                >
                                  <FiX size={12} />
                                </button>
                              </div>
                            ))
                          ) : (
                            <span className="text-slate-400 text-xs italic">
                              No activities selected
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-5">
                        <div className="text-slate-500 text-xs font-medium flex items-center gap-1.5">
                          <FiCalendar />
                          {sel.timestamp?.toDate().toLocaleDateString()}
                        </div>
                        <div className="text-slate-400 text-[10px] pl-5">
                          {sel.timestamp?.toDate().toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>

                      <td className="p-5 text-right">
                        <button
                          onClick={() => handleConfirmResetStudent(sel.id)}
                          title="Delete Entire Selection"
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-slate-400">
                    <FiActivity className="mx-auto text-3xl mb-2 opacity-20" />
                    <p>No selections found matching your search</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Details Modal */}
      <StudentDetailsModal
        isOpen={!!viewingSelection}
        onClose={() => setViewingSelection(null)}
        selection={viewingSelection}
        classMap={classMap}
      />

      <MessageModal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        type={modalConfig.type}
        mode={modalConfig.mode}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onCancel={modalConfig.onCancel}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
      />
    </div>
  );
}
