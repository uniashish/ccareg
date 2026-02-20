import React, { useEffect, useRef, useState } from "react";
import {
  FiX,
  FiUsers,
  FiCheck,
  FiXCircle,
  FiInfo,
  FiClock,
  FiMapPin,
  FiUser,
  FiDownload,
} from "react-icons/fi";

export default function ClassDetailsModal({
  isOpen,
  onClose,
  selectedClass,
  ccas = [],
}) {
  const [exportOpen, setExportOpen] = useState(false);
  const exportMenuRef = useRef(null);

  // Helper to convert 24hr to 12hr for display
  const formatTime12hr = (timeStr) => {
    if (!timeStr) return "TBD";
    const [hours, minutes] = timeStr.split(":");
    let h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${minutes} ${ampm}`;
  };

  const assignedCCAs = selectedClass?.allowedCCAs
    ?.map((id) => ccas.find((cca) => cca.id === id))
    .filter(Boolean);

  const escapeCSV = (value) => {
    const safeValue = value == null ? "" : String(value);
    return `"${safeValue.replace(/"/g, '""')}"`;
  };

  const handleExportCSV = () => {
    const headers = ["CCA Name", "Teacher", "Time", "Venue", "Status"];
    const rows = (assignedCCAs || []).map((cca) => {
      const time = `${formatTime12hr(cca.startTime)} - ${formatTime12hr(cca.endTime)}`;
      const status = cca.isActive !== false ? "Active" : "Inactive";
      return [
        escapeCSV(cca.name || ""),
        escapeCSV(cca.teacher || "Unassigned"),
        escapeCSV(time),
        escapeCSV(cca.venue || "TBD"),
        escapeCSV(status),
      ].join(",");
    });

    const csvContent = [headers.map(escapeCSV).join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${selectedClass?.name || "Class"}_Assigned_CCAs_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    const escapeHtml = (value) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    const rowsHtml = (assignedCCAs || [])
      .map((cca) => {
        const time = `${formatTime12hr(cca.startTime)} - ${formatTime12hr(cca.endTime)}`;
        const status = cca.isActive !== false ? "Active" : "Inactive";
        return `<tr>
          <td>${escapeHtml(cca.name)}</td>
          <td>${escapeHtml(cca.teacher || "Unassigned")}</td>
          <td>${escapeHtml(time)}</td>
          <td>${escapeHtml(cca.venue || "TBD")}</td>
          <td>${escapeHtml(status)}</td>
        </tr>`;
      })
      .join("\n");

    const html = `
      <html>
        <head>
          <title>Class Assigned CCAs</title>
          <style>
            @page { size: A4 landscape; margin: 12mm; }
            body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:0;padding:12px;font-size:10px;color:#111}
            h2{font-size:13px;margin-bottom:6px}
            table{width:100%;border-collapse:collapse}
            th,td{border:1px solid #ddd;padding:6px;text-align:left;font-size:10px;vertical-align:top}
            th{background:#f3f4f6;font-weight:700}
          </style>
        </head>
        <body>
          <h2>${escapeHtml(selectedClass?.name || "Class")} - Assigned CCAs</h2>
          <table>
            <thead>
              <tr>
                <th>CCA Name</th>
                <th>Teacher</th>
                <th>Time</th>
                <th>Venue</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
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

  if (!isOpen || !selectedClass) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="bg-gradient-to-r from-brand-primary to-brand-neutral p-8 shrink-0">
          <h2 className="text-2xl font-black text-white leading-tight uppercase tracking-tight">
            {selectedClass.name}
          </h2>
          <div className="flex items-center gap-3 mt-1">
            {selectedClass.isActive !== false ? (
              <span className="flex items-center gap-1 text-white text-xs font-bold uppercase bg-white/20 px-2 py-0.5 rounded">
                <FiCheck size={12} /> Active
              </span>
            ) : (
              <span className="flex items-center gap-1 text-white text-xs font-bold uppercase bg-brand-secondary/40 px-2 py-0.5 rounded">
                <FiXCircle size={12} /> Inactive
              </span>
            )}
          </div>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FiInfo className="text-brand-primary" /> Assigned CCA (
              {assignedCCAs?.length || 0})
            </h3>

            {assignedCCAs && assignedCCAs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {assignedCCAs.map((cca) => (
                  <div
                    key={cca.id}
                    className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 hover:border-brand-primary/30 transition-colors"
                  >
                    <p className="font-bold text-slate-800 text-sm mb-2">
                      {cca.name}
                    </p>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <FiUser className="text-brand-primary" size={12} />
                        <span>{cca.teacher || "Unassigned"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <FiClock className="text-brand-neutral" size={12} />
                        <span>
                          {formatTime12hr(cca.startTime)} -{" "}
                          {formatTime12hr(cca.endTime)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <FiMapPin className="text-brand-neutral" size={12} />
                        <span className="truncate">{cca.venue || "TBD"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                <p className="text-slate-400 text-sm italic">
                  No activities assigned to this class yet.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-50 p-6 flex justify-between items-center border-t border-slate-100 shrink-0">
          <div className="relative" ref={exportMenuRef}>
            <button
              type="button"
              onClick={() => setExportOpen((prev) => !prev)}
              className="px-5 py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-50 transition-all shadow-sm active:scale-95 flex items-center gap-2"
            >
              <FiDownload size={14} /> Export
            </button>

            {exportOpen && (
              <div className="absolute left-0 bottom-full mb-2 w-40 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    handleExportCSV();
                    setExportOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleExportPDF();
                    setExportOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 border-t border-slate-100"
                >
                  Export PDF
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-8 py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
