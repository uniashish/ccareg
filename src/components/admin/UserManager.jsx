import React, { useEffect, useRef, useState } from "react";
import {
  FiUser,
  FiMail,
  FiShield,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiFilter,
  FiDownload,
} from "react-icons/fi";
import ExportFieldsModal from "../common/ExportFieldsModal";

export default function UserManager({
  users,
  ccas = [],
  onEditRole,
  onEditAlias,
  onDeleteUser,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFieldsOpen, setExportFieldsOpen] = useState(false);
  const [selectedExportFields, setSelectedExportFields] = useState([
    "fullName",
    "email",
    "accessLevel",
  ]);
  const [pdfFontSize, setPdfFontSize] = useState(10);
  const exportMenuRef = useRef(null);

  const exportFields = [
    { key: "fullName", label: "Full Name" },
    { key: "email", label: "Email Address" },
    { key: "accessLevel", label: "Access Level" },
  ];

  const roles = ["all", "admin", "teacher", "student", "vendor"];

  // Combined Filter Logic: Search + Role
  const filteredUsers = users.filter((u) => {
    const userName = (u.displayName || u.name || "").toLowerCase();
    const userEmail = (u.email || "").toLowerCase();
    const matchesSearch =
      userName.includes(searchQuery.toLowerCase()) ||
      userEmail.includes(searchQuery.toLowerCase());

    const matchesRole = activeFilter === "all" || u.role === activeFilter;

    return matchesSearch && matchesRole;
  });

  const getExportRows = () => {
    return filteredUsers.map((u) => {
      const userName =
        u.displayName || u.name || u.email?.split("@")[0] || "Unknown User";
      return {
        fullName: userName,
        email: u.email || "",
        accessLevel: u.role || "",
      };
    });
  };

  const escapeCSV = (value) => {
    const safeValue = value == null ? "" : String(value);
    return `"${safeValue.replace(/"/g, '""')}"`;
  };

  const handleExportCSV = () => {
    const headers = ["Full Name", "Email Address", "Access Level"];
    const rows = getExportRows().map((row) =>
      [row.fullName, row.email, row.accessLevel]
        .map((cell) => escapeCSV(cell))
        .join(","),
    );
    const csvContent = [headers.join(","), ...rows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Users_${activeFilter}_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleOpenExportPDF = () => {
    if (filteredUsers.length === 0) return;
    setExportFieldsOpen(true);
  };

  const handleExportPDF = (
    fields = selectedExportFields,
    fontSize = pdfFontSize,
  ) => {
    const escapeHtml = (value) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    const selectedColumns = exportFields.filter((field) =>
      fields.includes(field.key),
    );
    if (!selectedColumns.length) return;

    const rowsHtml = getExportRows()
      .map((row) => {
        const cells = selectedColumns
          .map((field) => `<td>${escapeHtml(row[field.key])}</td>`)
          .join("");
        return `<tr>${cells}</tr>`;
      })
      .join("\n");

    const headersHtml = selectedColumns
      .map((field) => `<th>${escapeHtml(field.label)}</th>`)
      .join("");

    const html = `
      <html>
        <head>
          <title>User List Export</title>
          <style>
            @page { size: A4 landscape; margin: 12mm; }
            body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:0;padding:12px;font-size:${fontSize}px;color:#111}
            h2{font-size:${Math.max(fontSize + 3, 13)}px;margin-bottom:6px}
            table{width:100%;border-collapse:collapse}
            th,td{border:1px solid #ddd;padding:6px;text-align:left;font-size:${fontSize}px;vertical-align:top}
            th{background:#f3f4f6;font-weight:700}
          </style>
        </head>
        <body>
          <h2>User List (${escapeHtml(activeFilter)})</h2>
          <table>
            <thead>
              <tr>${headersHtml}</tr>
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

  const handleExportFieldsConfirm = (fields, fontSize) => {
    setSelectedExportFields(fields);
    setPdfFontSize(fontSize);
    handleExportPDF(fields, fontSize);
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
    <section className="animate-in fade-in duration-500 h-full flex flex-col min-h-0">
      <div className="flex flex-col gap-6 mb-6 shrink-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">
              User Management
            </h2>
            <p className="text-slate-500 mt-1 font-medium">
              Manage system access and permissions for all registered accounts
            </p>
          </div>

          {/* SEARCH BAR + EXPORT */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all text-sm font-medium shadow-sm"
              />
            </div>

            <div className="relative" ref={exportMenuRef}>
              <button
                type="button"
                onClick={() => setExportOpen((prev) => !prev)}
                className="w-full sm:w-auto px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <FiDownload size={14} /> Export
              </button>

              {exportOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
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
                      handleOpenExportPDF();
                      setExportOpen(false);
                    }}
                    className="w-full text-left px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 border-t border-slate-100"
                  >
                    Export PDF
                  </button>
                </div>
              )}

              <ExportFieldsModal
                isOpen={exportFieldsOpen}
                onClose={() => setExportFieldsOpen(false)}
                fields={exportFields}
                selectedFields={selectedExportFields}
                onChangeFields={setSelectedExportFields}
                fontSize={pdfFontSize}
                onFontSizeChange={setPdfFontSize}
                onExport={handleExportFieldsConfirm}
              />
            </div>
          </div>
        </div>

        {/* ROLE FILTER TABS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex items-center gap-2 text-slate-400 mr-2">
            <FiFilter size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Filter:
            </span>
          </div>
          {roles.map((role) => (
            <button
              key={role}
              onClick={() => setActiveFilter(role)}
              className={`px-5 py-2 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap ${
                activeFilter === role
                  ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20"
                  : "bg-white text-slate-500 border border-slate-200 hover:border-brand-primary/30"
              }`}
            >
              {role}
              {activeFilter === role && (
                <span className="ml-2 bg-white/20 px-1.5 py-0.5 rounded-md text-[10px]">
                  {filteredUsers.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex-1 min-h-0">
        <div className="overflow-x-auto overflow-y-auto h-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 font-black text-slate-400 uppercase text-[10px] tracking-widest">
                  Full Name
                </th>
                <th className="px-8 py-5 font-black text-slate-400 uppercase text-[10px] tracking-widest">
                  Email Address
                </th>
                <th className="px-8 py-5 font-black text-slate-400 uppercase text-[10px] tracking-widest">
                  User Role
                </th>
                <th className="px-8 py-5 font-black text-slate-400 uppercase text-[10px] tracking-widest">
                  In-Charge
                </th>
                <th className="px-8 py-5 font-black text-slate-400 uppercase text-[10px] tracking-widest text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => {
                  const isAdmin = u.role === "admin";
                  const isVendor = u.role === "vendor";
                  const isTeacher = u.role === "teacher";
                  const isStudent = u.role === "student";
                  const userName =
                    u.displayName ||
                    u.name ||
                    (u.email ? u.email.split("@")[0] : null) ||
                    "Unknown User";
                  const displayNameWithAlias =
                    isTeacher && u.alias
                      ? `${userName} (${u.alias})`
                      : userName;

                  // Find CCAs where this teacher is in charge
                  let teacherCCAs = [];
                  if (isTeacher && ccas.length > 0) {
                    const teacherKey = (
                      u.displayName ||
                      u.name ||
                      u.email ||
                      ""
                    )
                      .trim()
                      .toLowerCase();
                    teacherCCAs = ccas.filter(
                      (cca) =>
                        cca.teacher &&
                        cca.teacher.trim().toLowerCase() === teacherKey,
                    );
                  }

                  return (
                    <tr
                      key={u.uid}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                            <FiUser size={16} />
                          </div>
                          <span className="font-bold text-slate-700 capitalize">
                            {displayNameWithAlias}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
                          <FiMail size={14} className="text-brand-neutral" />
                          {u.email}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${
                            isAdmin
                              ? "bg-brand-primary/10 text-brand-primary border border-brand-primary/20"
                              : isVendor
                                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                : isTeacher
                                  ? "bg-sky-100 text-sky-700 border border-sky-200"
                                  : isStudent
                                    ? "bg-amber-100 text-amber-700 border border-amber-200"
                                    : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}
                        >
                          <FiShield size={12} />
                          {u.role}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-wrap gap-1">
                          {isTeacher && teacherCCAs.length > 0 ? (
                            teacherCCAs.map((cca) => (
                              <span
                                key={cca.id}
                                className="inline-block px-3 py-1 rounded-full text-[10px] font-black bg-sky-100 text-sky-700 border border-sky-200"
                                title={cca.name}
                              >
                                {cca.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 text-xs italic">
                              None
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex justify-end gap-2">
                          {isTeacher && (
                            <button
                              onClick={() => onEditAlias(u)}
                              className="flex items-center gap-2 px-4 py-2 text-violet-700 hover:bg-violet-100 rounded-xl font-bold text-xs transition-all active:scale-95"
                              title="Edit Alias"
                            >
                              <FiUser size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => onEditRole(u)}
                            className="flex items-center gap-2 px-4 py-2 text-brand-primary hover:bg-brand-primary/10 rounded-xl font-bold text-xs transition-all active:scale-95"
                            title="Update Role"
                          >
                            <FiEdit2 size={14} />
                          </button>
                          <button
                            onClick={() => onDeleteUser(u.uid)}
                            className="flex items-center gap-2 px-4 py-2 text-brand-secondary hover:bg-brand-secondary/10 rounded-xl font-bold text-xs transition-all active:scale-95"
                            title="Remove User"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="4"
                    className="px-8 py-20 text-center text-slate-400 italic"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <FiSearch size={40} className="text-slate-200" />
                      <p className="font-medium text-sm">
                        No results for "{searchQuery}" in {activeFilter}{" "}
                        category
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
