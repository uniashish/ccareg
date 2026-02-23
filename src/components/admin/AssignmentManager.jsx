import React, { useEffect, useRef, useState } from "react";
import {
  FiCheckCircle,
  FiPlusCircle,
  FiUsers,
  FiBookOpen,
  FiActivity,
  FiDownload,
} from "react-icons/fi";
import MessageModal from "../common/MessageModal";

export default function AssignmentManager({
  classesList,
  ccas,
  selections,
  selectedClassId,
  setSelectedClassId,
  onToggleCCA,
}) {
  const [exportOpen, setExportOpen] = useState(false);
  const exportMenuRef = useRef(null);
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });

  const selectedClass = classesList.find((c) => c.id === selectedClassId);
  const activeCCAs = ccas.filter((cca) => cca.isActive !== false);

  const assignedCCAs = activeCCAs.filter((cca) =>
    selectedClass?.allowedCCAs?.includes(cca.id),
  );

  const escapeCSV = (value) => {
    const safeValue = value == null ? "" : String(value);
    return `"${safeValue.replace(/"/g, '""')}"`;
  };

  const getExportRows = () => {
    return assignedCCAs.map((cca) => [
      selectedClass?.name || "",
      cca.name || "",
      cca.teacher || "",
      cca.venue || "",
      cca.isActive === false ? "Hidden" : "Active",
    ]);
  };

  const handleExportCSV = () => {
    if (!selectedClass) return;

    const headers = ["Class", "CCA", "Teacher", "Venue", "Status"];
    const rows = getExportRows().map((row) =>
      row.map((cell) => escapeCSV(cell)).join(","),
    );
    const csvContent = [headers.join(","), ...rows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${selectedClass.name}_Assigned_CCAs_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    if (!selectedClass) return;

    const escapeHtml = (value) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    const rowsHtml = getExportRows()
      .map(
        (row) =>
          `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`,
      )
      .join("\n");

    const html = `
      <html>
        <head>
          <title>Assigned CCAs - ${escapeHtml(selectedClass.name)}</title>
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
          <h2>Assigned CCAs - ${escapeHtml(selectedClass.name)}</h2>
          <table>
            <thead>
              <tr>
                <th>Class</th>
                <th>CCA</th>
                <th>Teacher</th>
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

  const showError = (title, message) => {
    setModalState({
      isOpen: true,
      type: "error",
      title,
      message,
    });
  };

  const closeModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const canRemoveCCAFromClass = (classId, ccaId) => {
    return !(selections || [])
      .filter((selection) => selection.status !== "cancelled")
      .filter((selection) => selection.classId === classId)
      .some((selection) =>
        (selection.selectedCCAs || []).some(
          (selectedCCA) => selectedCCA.id === ccaId,
        ),
      );
  };

  const handleToggleCCAAssignment = (classId, ccaId, isAssigned) => {
    if (!classId) return;

    if (isAssigned && !canRemoveCCAFromClass(classId, ccaId)) {
      showError(
        "CCA Cannot Be Removed",
        "The CCA cannot be removed from this class because students from this class have selected this CCA.",
      );
      return;
    }

    onToggleCCA(classId, ccaId);
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

  return (
    <div className="flex h-[calc(100vh-200px)] gap-6 animate-in fade-in duration-500">
      {/* SIDEBAR: CLASS LIST */}
      <div className="w-80 bg-white rounded-3xl border border-slate-200 flex flex-col overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FiUsers className="text-brand-primary" /> Target Class
          </h3>
          <p className="text-[11px] text-slate-500 mt-1 uppercase font-bold tracking-wider">
            Select a Grade
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {classesList.map((cls) => (
            <button
              key={cls.id}
              type="button"
              onClick={() => setSelectedClassId(cls.id)}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group ${
                selectedClassId === cls.id
                  ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/30"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="font-bold">{cls.name}</span>
              {selectedClassId === cls.id && (
                <FiCheckCircle className="animate-in zoom-in" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN AREA: CCA GRID */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {selectedClassId ? (
          <>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-800">
                  Manage Assignments
                </h3>
                <p className="text-slate-500 text-sm mt-1">
                  Assigning activities to{" "}
                  <span className="text-brand-primary font-bold">
                    {selectedClass?.name}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold flex items-center gap-2">
                  <FiActivity />
                  {selectedClass?.allowedCCAs?.length || 0} Assigned
                </div>
                <div className="relative" ref={exportMenuRef}>
                  <button
                    type="button"
                    onClick={() => setExportOpen((prev) => !prev)}
                    className="px-3 py-1 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-slate-50 transition-colors"
                    title="Export class assignments"
                  >
                    <FiDownload size={12} /> Export
                  </button>

                  {exportOpen && (
                    <div className="absolute right-0 mt-2 w-32 bg-white border border-slate-200 rounded-lg shadow-lg z-20 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => {
                          handleExportCSV();
                          setExportOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        Export CSV
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleExportPDF();
                          setExportOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 border-t border-slate-100"
                      >
                        Export PDF
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
                {activeCCAs.map((cca) => {
                  const isAssigned = selectedClass?.allowedCCAs?.includes(
                    cca.id,
                  );

                  return (
                    <button
                      key={cca.id}
                      type="button" // Ensuring this is treated as a button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent bubbling issues
                        handleToggleCCAAssignment(
                          selectedClassId,
                          cca.id,
                          isAssigned,
                        );
                      }}
                      className={`relative group p-4 rounded-2xl border text-left transition-all duration-300 overflow-hidden shadow-[0_18px_24px_-18px_rgba(15,23,42,0.55),0_8px_10px_-8px_rgba(15,23,42,0.3),0_1px_0_rgba(255,255,255,0.85)_inset] hover:shadow-[0_28px_38px_-20px_rgba(15,23,42,0.6),0_12px_16px_-10px_rgba(15,23,42,0.35),0_1px_0_rgba(255,255,255,0.9)_inset] [transform:perspective(1200px)_rotateX(2deg)] hover:[transform:perspective(1200px)_rotateX(4deg)_translateY(-4px)] ${
                        isAssigned
                          ? "bg-[radial-gradient(circle_at_top_right,_#dbeafe_0%,_#fee2e2_100%)] border-brand-primary ring-2 ring-brand-primary/20"
                          : "bg-[radial-gradient(circle_at_top_right,_#dbeafe_0%,_#fee2e2_100%)] border-slate-200 hover:border-brand-primary/50"
                      }`}
                    >
                      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[linear-gradient(160deg,rgba(255,255,255,0.55)_0%,rgba(255,255,255,0.1)_35%,rgba(255,255,255,0)_70%)]" />

                      <div className="flex justify-between items-start mb-2 relative z-10">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg font-bold transition-colors ${
                            isAssigned
                              ? "bg-brand-primary text-white"
                              : "bg-slate-100 text-slate-400 group-hover:bg-brand-primary/10 group-hover:text-brand-primary"
                          }`}
                        >
                          {isAssigned ? <FiCheckCircle /> : <FiPlusCircle />}
                        </div>
                      </div>

                      <div className="mt-2 relative z-10">
                        <p
                          className={`font-bold text-sm leading-tight break-words ${
                            isAssigned ? "text-brand-primary" : "text-slate-700"
                          }`}
                        >
                          {cca.name}
                        </p>
                        <p className="text-[10px] font-bold uppercase text-slate-400 mt-1">
                          {cca.venue || "Venue TBD"}
                        </p>
                      </div>

                      {isAssigned && (
                        <div className="absolute top-3 right-3 text-brand-neutral animate-in zoom-in z-10">
                          <FiActivity size={14} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {activeCCAs.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <p className="italic">No active activities found.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-12 text-center">
            <FiBookOpen size={48} className="text-slate-200 mb-4" />
            <h4 className="text-xl font-bold text-slate-600">
              No Class Selected
            </h4>
            <p className="text-sm mt-2">
              Pick a grade from the left to manage available activities.
            </p>
          </div>
        )}
      </div>

      <MessageModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
      />
    </div>
  );
}
