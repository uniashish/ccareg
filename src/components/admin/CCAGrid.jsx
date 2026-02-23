import React, { useRef, useState, useEffect } from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiSearch,
  FiDownload,
  FiChevronDown,
  FiEdit2,
  FiTrash2,
  FiInfo,
  FiCheckSquare,
} from "react-icons/fi";
import AdminCCACard from "./AdminCCACard";

export default function CCAGrid({
  ccas,
  onEdit,
  onDelete,
  onViewDetails,
  onViewAttendance,
  onOpenStudentList,
  onClearSearch,
}) {
  const VIEW_MODE_STORAGE_KEY = "ccaManager.viewMode";
  const scrollRef = useRef(null);
  const exportMenuRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [viewMode, setViewMode] = useState(() => {
    const savedViewMode = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return savedViewMode === "table" || savedViewMode === "cards"
      ? savedViewMode
      : "cards";
  });
  const [exportOpen, setExportOpen] = useState(false);

  const formatTime12hr = (timeStr) => {
    if (!timeStr) return "TBD";
    const [hours, minutes] = timeStr.split(":");
    let h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${minutes} ${ampm}`;
  };

  const getScheduleSummary = (dates) => {
    if (!dates || !Array.isArray(dates) || dates.length === 0) return "TBD";

    const days = [
      ...new Set(
        dates.map((d) =>
          new Date(d).toLocaleDateString("en-US", { weekday: "short" }),
        ),
      ),
    ];

    if (days.length === 1) return `${days[0]} (${dates.length} Sessions)`;
    if (days.length <= 2)
      return `${days.join(" & ")} (${dates.length} Sessions)`;
    return `${dates.length} Scheduled Sessions`;
  };

  // --- SCROLL CHECKER ---
  const checkScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 5); // 5px tolerance
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  // Re-check scroll buttons whenever the CCA list changes (e.g. seat update)
  useEffect(() => {
    if (scrollRef.current) {
      // We don't reset scroll position to 0 to keep user context
      setTimeout(checkScrollButtons, 100);
    }
  }, [ccas.length, ccas]); // Trigger on ccas change

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

  useEffect(() => {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
  }, [VIEW_MODE_STORAGE_KEY, viewMode]);

  const scroll = (direction) => {
    const { current } = scrollRef;
    if (current) {
      const scrollAmount = current.clientWidth;
      const directionMultiplier = direction === "left" ? -1 : 1;

      current.scrollBy({
        left: scrollAmount * directionMultiplier,
        behavior: "smooth",
      });
      setTimeout(checkScrollButtons, 500);
    }
  };

  const escapeCSV = (value) => {
    const safeValue = value == null ? "" : String(value);
    return `"${safeValue.replace(/"/g, '""')}"`;
  };

  const getExportRows = () => {
    return ccas.map((cca) => [
      cca.name || "",
      cca.isActive ? "Active" : "Hidden",
      getScheduleSummary(cca.sessionDates),
      `${formatTime12hr(cca.startTime)} - ${formatTime12hr(cca.endTime)}`,
      cca.venue || "TBD",
      cca.teacher || "Staff",
      `${cca.enrolledCount || 0} / ${cca.maxSeats || "∞"}`,
      Number(cca.price) === 0
        ? "Free"
        : `Rp ${Number(cca.price).toLocaleString()}`,
    ]);
  };

  const handleExportCSV = () => {
    const headers = [
      "Activity",
      "Status",
      "Schedule",
      "Time",
      "Venue",
      "Teacher",
      "Capacity",
      "Fee",
    ];

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
      `CCA_Details_${new Date().toISOString().split("T")[0]}.csv`,
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

    const rowsHtml = getExportRows()
      .map(
        (row) =>
          `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`,
      )
      .join("\n");

    const html = `
      <html>
        <head>
          <title>CCA Details</title>
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
          <h2>CCA Details</h2>
          <table>
            <thead>
              <tr>
                <th>Activity</th>
                <th>Status</th>
                <th>Schedule</th>
                <th>Time</th>
                <th>Venue</th>
                <th>Teacher</th>
                <th>Capacity</th>
                <th>Fee</th>
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

  if (ccas.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
        <div className="inline-block p-4 bg-slate-50 rounded-full mb-4">
          <FiSearch className="text-3xl text-slate-300" />
        </div>
        <h3 className="text-lg font-bold text-slate-700">No CCAs Found</h3>
        <p className="text-slate-500 text-sm mb-6">
          Try adjusting your search or add a new CCA.
        </p>
        <button
          onClick={onClearSearch}
          className="text-brand-primary font-bold text-sm hover:underline"
        >
          Clear Search
        </button>
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* CONTROLS */}
      <div className="absolute -top-14 right-0 flex gap-2">
        <button
          onClick={() => scroll("left")}
          disabled={viewMode !== "cards" || !canScrollLeft}
          className={`p-2 rounded-lg border transition-all shadow-sm ${
            viewMode !== "cards" || !canScrollLeft
              ? "bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed"
              : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-black cursor-pointer"
          }`}
          title="Scroll Left"
        >
          <FiChevronLeft size={20} />
        </button>

        <button
          onClick={() => scroll("right")}
          disabled={viewMode !== "cards" || !canScrollRight}
          className={`p-2 rounded-lg border transition-all shadow-sm ${
            viewMode !== "cards" || !canScrollRight
              ? "bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed"
              : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-black cursor-pointer"
          }`}
          title="Scroll Right"
        >
          <FiChevronRight size={20} />
        </button>

        <button
          onClick={() =>
            setViewMode((prev) => (prev === "cards" ? "table" : "cards"))
          }
          className="px-3 py-2 rounded-lg border transition-all shadow-sm bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-black cursor-pointer text-sm font-bold"
          title={
            viewMode === "cards"
              ? "Switch to Table View"
              : "Switch to Card View"
          }
        >
          {viewMode === "cards" ? "Table" : "Cards"}
        </button>

        <div className="relative" ref={exportMenuRef}>
          <button
            onClick={() => setExportOpen((v) => !v)}
            className={`px-3 py-2 rounded-lg border transition-all shadow-sm text-sm font-bold flex items-center gap-1.5 ${
              ccas.length > 0
                ? "bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-black cursor-pointer"
                : "bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed"
            }`}
            title="Export options"
            disabled={ccas.length === 0}
          >
            <FiDownload size={14} />
            Export
            <FiChevronDown size={14} />
          </button>

          {exportOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-slate-200 z-50 overflow-hidden">
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

      {viewMode === "cards" ? (
        <div
          ref={scrollRef}
          onScroll={checkScrollButtons}
          className="grid grid-rows-2 grid-flow-col gap-6 auto-cols-[calc((100%-3rem)/3)] overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth no-scrollbar"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {ccas.map((cca) => (
            <div key={cca.id} className="snap-start h-full">
              <AdminCCACard
                cca={cca}
                onEdit={() => onEdit(cca)}
                onDelete={() => onDelete(cca.id)}
                onViewDetails={() => onViewDetails(cca)}
                onViewAttendance={() => onViewAttendance?.(cca)}
                onOpenStudentList={() => onOpenStudentList?.(cca)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto overflow-y-auto max-h-[65vh]">
            <table className="w-full min-w-[1080px] table-fixed text-left border-collapse text-[12px]">
              <colgroup>
                <col className="w-[21%]" />
                <col className="w-[13%]" />
                <col className="w-[10%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
                <col className="w-[8%]" />
                <col className="w-[8%]" />
                <col className="w-[16%]" />
              </colgroup>
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider bg-slate-50">
                    Activity
                  </th>
                  <th className="px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider bg-slate-50">
                    Schedule
                  </th>
                  <th className="px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider bg-slate-50">
                    Time
                  </th>
                  <th className="px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider bg-slate-50">
                    Venue
                  </th>
                  <th className="px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider bg-slate-50">
                    Teacher
                  </th>
                  <th className="px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider bg-slate-50">
                    Capacity
                  </th>
                  <th className="px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider bg-slate-50">
                    Fee
                  </th>
                  <th className="px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider text-right bg-slate-50">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ccas.map((cca) => {
                  const isFull =
                    cca.maxSeats && cca.enrolledCount >= cca.maxSeats;
                  const hasEnrollments = cca.enrolledCount > 0;
                  const hasStudents = (cca.enrolledCount || 0) > 0;

                  return (
                    <tr
                      key={cca.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => onOpenStudentList?.(cca)}
                          disabled={!hasStudents}
                          className={`block w-full text-left font-bold leading-snug break-words ${
                            hasStudents
                              ? "text-brand-primary hover:underline"
                              : "text-slate-300 cursor-not-allowed"
                          }`}
                          title={
                            hasStudents
                              ? cca.name
                              : "No students have selected this CCA"
                          }
                        >
                          {cca.name}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700">
                        {getScheduleSummary(cca.sessionDates)}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700 whitespace-nowrap">
                        {formatTime12hr(cca.startTime)} -{" "}
                        {formatTime12hr(cca.endTime)}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700">
                        <span className="block leading-tight break-words line-clamp-2">
                          {cca.venue || "TBD"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700 whitespace-nowrap">
                        {cca.teacher || "Staff"}
                      </td>
                      <td
                        className={`px-4 py-3 text-xs font-bold whitespace-nowrap ${
                          isFull ? "text-red-500" : "text-slate-700"
                        }`}
                      >
                        {`${cca.enrolledCount || 0} / ${cca.maxSeats || "∞"}`}
                      </td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-700 whitespace-nowrap">
                        {Number(cca.price) === 0
                          ? "Free"
                          : `Rp ${Number(cca.price).toLocaleString()}`}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex w-full justify-end gap-1">
                          <button
                            onClick={() => onEdit(cca)}
                            className="p-1.5 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <FiEdit2 size={14} />
                          </button>
                          <button
                            onClick={() => onDelete(cca.id)}
                            disabled={hasEnrollments}
                            className={`p-1.5 rounded-lg transition-colors ${
                              hasEnrollments
                                ? "text-slate-200 cursor-not-allowed"
                                : "hover:bg-red-50 text-slate-400 hover:text-red-600"
                            }`}
                            title={
                              hasEnrollments
                                ? "Cannot delete active class"
                                : "Delete"
                            }
                          >
                            <FiTrash2 size={14} />
                          </button>
                          <button
                            onClick={() => onViewDetails(cca)}
                            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-brand-primary rounded-lg transition-colors"
                            title="View Details"
                          >
                            <FiInfo size={14} />
                          </button>
                          <button
                            onClick={() => onViewAttendance?.(cca)}
                            disabled={!hasStudents}
                            className={`p-1.5 rounded-lg transition-colors ${
                              hasStudents
                                ? "hover:bg-emerald-50 text-slate-400 hover:text-emerald-600"
                                : "text-slate-200 cursor-not-allowed"
                            }`}
                            title={
                              hasStudents
                                ? "View Attendance"
                                : "No students have selected this CCA"
                            }
                          >
                            <FiCheckSquare size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
