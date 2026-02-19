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
      const choices = (s.selectedCCAs || []).map((c) => c.name).join(", ");
      return `<tr>
        <td>${(s.studentName || "").replace(/</g, "&lt;")}</td>
        <td>${(s.studentEmail || "").replace(/</g, "&lt;")}</td>
        <td>${(className || "").replace(/</g, "&lt;")}</td>
        <td>${(choices || "").replace(/</g, "&lt;")}</td>
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
            <tr><th>Student Name</th><th>Email</th><th>Class</th><th>Choices</th></tr>
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
