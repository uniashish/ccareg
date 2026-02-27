import { useState, useMemo } from "react";
import {
  escapeCSV,
  escapeHtml,
  MAX_CCAS,
  EXPORT_FIELDS,
} from "../utils/vendorUtils";

export function useVendorExport(visibleRows) {
  const [exportModal, setExportModal] = useState({
    isOpen: false,
    format: "csv",
  });

  const [selectedExportFields, setSelectedExportFields] = useState(
    EXPORT_FIELDS.map((field) => field.key),
  );

  // Group rows by student for export
  const groupedExportRows = useMemo(() => {
    if (!visibleRows.length) return [];

    const grouped = visibleRows.reduce((acc, row) => {
      const key = row.selectionId || row.studentUid || row.studentName;

      if (!acc[key]) {
        acc[key] = {
          studentName: row.studentName,
          className: row.className,
          items: [],
        };
      }

      acc[key].items.push({
        ccaId: row.ccaId,
        ccaName: row.ccaName,
        attendanceLabel: row.attendanceLabel,
        paymentStatus: row.paymentStatus,
        verified: row.verified,
      });

      return acc;
    }, {});

    return Object.values(grouped).map((group) => {
      const uniqueItemsByCca = group.items.reduce((acc, item) => {
        const itemKey = item.ccaId || item.ccaName;
        if (!acc[itemKey]) {
          acc[itemKey] = item;
        }
        return acc;
      }, {});

      const items = Object.values(uniqueItemsByCca);

      // Prepare CCA columns (CCA1, CCA2, CCA3)
      const ccaColumns = Array.from(
        { length: MAX_CCAS },
        (_, i) => items[i]?.ccaName || "",
      );

      return {
        studentName: group.studentName,
        className: group.className,
        ...Object.fromEntries(
          ccaColumns.map((val, idx) => [`cca${idx + 1}`, val]),
        ),
        attendance: items
          .map((item) => `${item.ccaName}: ${item.attendanceLabel}`)
          .join(" | "),
        paymentStatus: items
          .map((item) => `${item.ccaName}: ${item.paymentStatus}`)
          .join(" | "),
        verified: items
          .map((item) => `${item.ccaName}: ${item.verified ? "Yes" : "No"}`)
          .join(" | "),
      };
    });
  }, [visibleRows]);

  const selectedExportFieldDefs = useMemo(
    () =>
      EXPORT_FIELDS.filter((field) => selectedExportFields.includes(field.key)),
    [selectedExportFields],
  );

  const buildExportRows = () =>
    groupedExportRows.map((row) =>
      selectedExportFieldDefs.map((field) => row[field.key] ?? ""),
    );

  const openExportModal = (format) => {
    if (!groupedExportRows.length) return;
    setExportModal({ isOpen: true, format });
  };

  const closeExportModal = () => {
    setExportModal((prev) => ({ ...prev, isOpen: false }));
  };

  const toggleExportField = (fieldKey) => {
    setSelectedExportFields((prev) => {
      if (prev.includes(fieldKey)) {
        return prev.filter((key) => key !== fieldKey);
      }
      return [...prev, fieldKey];
    });
  };

  const handleSelectAllExportFields = () => {
    setSelectedExportFields(EXPORT_FIELDS.map((field) => field.key));
  };

  const handleClearAllExportFields = () => {
    setSelectedExportFields([]);
  };

  const exportCSVWithSelectedFields = () => {
    if (!groupedExportRows.length || !selectedExportFieldDefs.length) return;

    const headers = selectedExportFieldDefs.map((field) => field.label);

    const rows = buildExportRows().map((row) =>
      row.map((cell) => escapeCSV(cell)).join(","),
    );

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Vendor_Students_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportPDFWithSelectedFields = () => {
    if (!groupedExportRows.length || !selectedExportFieldDefs.length) return;

    const rowsHtml = buildExportRows()
      .map(
        (cells) =>
          `<tr>${cells
            .map((cell) => `<td>${escapeHtml(cell)}</td>`)
            .join("")}</tr>`,
      )
      .join("\n");

    const headerHtml = selectedExportFieldDefs
      .map((field) => `<th>${escapeHtml(field.label)}</th>`)
      .join("");

    const html = `
      <html>
        <head>
          <title>Vendor Student List</title>
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
          <h2>Vendor Students</h2>
          <table>
            <thead>
              <tr>${headerHtml}</tr>
            </thead>
            <tbody>
              ${rowsHtml}
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

  const handleExportCSV = () => {
    openExportModal("csv");
  };

  const handleExportPDF = () => {
    openExportModal("pdf");
  };

  const handleConfirmExport = () => {
    if (!selectedExportFieldDefs.length) return;

    if (exportModal.format === "pdf") {
      exportPDFWithSelectedFields();
    } else {
      exportCSVWithSelectedFields();
    }

    closeExportModal();
  };

  return {
    // Modal state
    exportModal,
    // Field selection state
    selectedExportFields,
    // Data
    groupedExportRows,
    // Handlers
    handleExportCSV,
    handleExportPDF,
    closeExportModal,
    toggleExportField,
    handleSelectAllExportFields,
    handleClearAllExportFields,
    handleConfirmExport,
    // Derived values
    canExport: visibleRows.length > 0,
  };
}
