import React, { useMemo, useState, useEffect } from "react";
import {
  FiX,
  FiUsers,
  FiChevronRight,
  FiChevronDown,
  FiDownload,
} from "react-icons/fi";

export default function CCAStudentsModal({
  isOpen,
  onClose,
  cca,
  selections,
  users,
  classesList,
}) {
  const [expandedClasses, setExpandedClasses] = useState({});
  const [exportOpen, setExportOpen] = useState(false);

  const groupedStudents = useMemo(() => {
    if (!cca || !Array.isArray(selections)) return [];

    const classMap = (classesList || []).reduce((acc, cls) => {
      acc[cls.id] = cls.name;
      return acc;
    }, {});

    const grouped = {};

    selections.forEach((selection) => {
      const selected = Array.isArray(selection.selectedCCAs)
        ? selection.selectedCCAs
        : [];

      const hasThisCCA = selected.some(
        (item) => item.id === cca.id || item.name === cca.name,
      );

      if (!hasThisCCA) return;

      const className = classMap[selection.classId] || "Unassigned";
      const userProfile = users ? users[selection.studentUid] : null;
      const studentName =
        userProfile?.displayName ||
        selection.studentName ||
        selection.studentEmail?.split("@")[0] ||
        "Unknown";

      if (!grouped[className]) {
        grouped[className] = [];
      }

      grouped[className].push({
        name: studentName,
        className,
      });
    });

    return Object.entries(grouped)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([className, students]) => ({
        className,
        students: students.sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [cca, selections, users, classesList]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".cca-students-export")) {
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

  if (!isOpen || !cca) return null;

  const handleClose = () => {
    setExpandedClasses({});
    setExportOpen(false);
    onClose();
  };

  const totalStudents = groupedStudents.reduce(
    (sum, group) => sum + group.students.length,
    0,
  );

  const escapeCSV = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const exportRows = groupedStudents.flatMap((group) =>
    group.students.map((student) => ({
      className: group.className,
      studentName: student.name,
    })),
  );

  const handleExportCSV = () => {
    if (!exportRows.length) return;

    const headers = ["CCA", "Class", "Student Name"];
    const rows = exportRows.map((row) =>
      [cca?.name || "", row.className, row.studentName]
        .map(escapeCSV)
        .join(","),
    );

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeCcaName = (cca?.name || "CCA").replace(/\s+/g, "_");
    link.href = url;
    link.download = `CCA_Students_${safeCcaName}_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    if (!groupedStudents.length) return;

    const groupedHtml = groupedStudents
      .map((group) => {
        const studentItems = group.students
          .map((student) => `<li>${escapeHtml(student.name)}</li>`)
          .join("");

        return `
          <section style="margin-bottom:12px;">
            <h3 style="font-size:12px;margin:0 0 6px;">${escapeHtml(group.className)} (${group.students.length})</h3>
            <ul style="margin:0;padding-left:18px;">${studentItems}</ul>
          </section>
        `;
      })
      .join("\n");

    const html = `
      <html>
        <head>
          <title>${escapeHtml(cca?.name || "CCA")} Student List</title>
          <style>
            @page { size: A4; margin: 12mm; }
            body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:0;padding:12px;font-size:11px;color:#111}
            h2{font-size:15px;margin:0 0 4px}
            p{margin:0 0 12px;color:#444;font-size:11px}
            li{margin:2px 0;}
          </style>
        </head>
        <body>
          <h2>${escapeHtml(cca?.name || "CCA")} - Student List</h2>
          <p>Total Students: ${totalStudents}</p>
          ${groupedHtml}
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
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative w-full max-w-2xl max-h-[85vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/60 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-black text-slate-800">{cca.name}</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {totalStudents} student{totalStudents !== 1 ? "s" : ""} selected
              this CCA
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative cca-students-export">
              <button
                type="button"
                onClick={() => setExportOpen((prev) => !prev)}
                disabled={totalStudents === 0}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${
                  totalStudents === 0
                    ? "bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <FiDownload size={13} /> Export <FiChevronDown size={12} />
              </button>

              {exportOpen && totalStudents > 0 && (
                <div className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-lg border border-slate-200 z-50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      handleExportCSV();
                      setExportOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Export CSV
                  </button>
                  <button
                    type="button"
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

            <button
              onClick={handleClose}
              className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {groupedStudents.length > 0 ? (
            groupedStudents.map((group) => (
              <div
                key={group.className}
                className="border border-slate-200 rounded-2xl overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedClasses((prev) => ({
                      ...prev,
                      [group.className]: !prev[group.className],
                    }))
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    {expandedClasses[group.className] ? (
                      <FiChevronDown size={16} />
                    ) : (
                      <FiChevronRight size={16} />
                    )}
                    <span>{group.className}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-bold ">
                    {group.students.length} students
                  </span>
                </button>
                {expandedClasses[group.className] && (
                  <div className="p-3 space-y-2">
                    {group.students.map((student, index) => (
                      <div
                        key={`${group.className}-${student.name}-${index}`}
                        className="group px-3 py-2 rounded-xl bg-white border border-slate-100 text-sm text-slate-700 flex items-center justify-between hover:bg-slate-50 transition-colors"
                      >
                        <span className="font-semibold">{student.name}</span>
                        <span className="inline-flex items-center max-w-[48%] px-2 py-1 rounded-md bg-slate-50 border border-slate-200 text-[10px] leading-none text-slate-500 font-semibold whitespace-nowrap truncate transition-all group-hover:bg-brand-primary/10 group-hover:border-brand-primary/40 group-hover:text-brand-primary group-hover:ring-1 group-hover:ring-brand-primary/20">
                          {student.className}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-slate-400">
              <FiUsers className="mx-auto mb-3" size={28} />
              <p className="font-medium">No students have selected this CCA.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
