// src/utils/pdfExporter.js

export const downloadSelectionsPDF = (selections, classes) => {
  // Convert classes array to map for lookup
  const classesMap = classes.reduce((map, c) => {
    map[c.id] = c;
    return map;
  }, {});

  // Generate table rows
  const rowsHtml = selections
    .map((s) => {
      const className = classesMap[s.classId]?.name || "Unknown";
      const cca1 = s.selectedCCAs?.[0]?.name || "";
      const cca2 = s.selectedCCAs?.[1]?.name || "";
      const cca3 = s.selectedCCAs?.[2]?.name || "";
      return `<tr>
        <td>${(s.studentName || "").replace(/</g, "&lt;")}</td>
        <td>${(s.studentEmail || "").replace(/</g, "&lt;")}</td>
        <td>${(className || "").replace(/</g, "&lt;")}</td>
        <td>${(cca1 || "").replace(/</g, "&lt;")}</td>
        <td>${(cca2 || "").replace(/</g, "&lt;")}</td>
        <td>${(cca3 || "").replace(/</g, "&lt;")}</td>
      </tr>`;
    })
    .join("\n");

  // Generate complete HTML document
  const html = `
    <html>
      <head>
        <title>CCA Selections</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:0;padding:12px;font-size:10px;color:#111}
          h2{font-size:13px;margin-bottom:6px}
          table{width:100%;border-collapse:collapse}
          th,td{border:1px solid #ddd;padding:6px;text-align:left;font-size:10px}
          th{background:#f3f4f6;font-weight:700}
        </style>
      </head>
      <body>
        <h2>CCA Selections</h2>
        <table>
          <thead>
            <tr><th>Student Name</th><th>Email</th><th>Class</th><th>CCA1</th><th>CCA2</th><th>CCA3</th></tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
    </html>
  `;

  // Open in new window and trigger print dialog
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  // Give the new window a moment to render then trigger print
  setTimeout(() => {
    w.focus();
    w.print();
  }, 300);
};

export const downloadVendorsPDF = (vendors = []) => {
  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const rowsHtml = vendors
    .map((vendor) => {
      const associatedCCAs = Array.isArray(vendor.associatedCCAs)
        ? vendor.associatedCCAs
            .map((cca) => cca?.name)
            .filter(Boolean)
            .join(", ")
        : "";

      return `<tr>
        <td>${escapeHtml(vendor.name)}</td>
        <td>${escapeHtml(vendor.email)}</td>
        <td>${escapeHtml(vendor.contactPerson)}</td>
        <td>${escapeHtml(vendor.contactNumber)}</td>
        <td>${escapeHtml(vendor.bankName)}</td>
        <td>${escapeHtml(vendor.bankAccountName)}</td>
        <td>${escapeHtml(vendor.accountNumber)}</td>
        <td>${escapeHtml(associatedCCAs)}</td>
      </tr>`;
    })
    .join("\n");

  const html = `
    <html>
      <head>
        <title>CCA Vendors</title>
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
        <h2>CCA Vendors</h2>
        <table>
          <thead>
            <tr>
              <th>Vendor Name</th>
              <th>Email Address</th>
              <th>Contact Person</th>
              <th>Contact Number</th>
              <th>Bank Name</th>
              <th>Bank Account Name</th>
              <th>Account Number</th>
              <th>Associated CCAs</th>
            </tr>
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
