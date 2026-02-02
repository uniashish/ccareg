// src/utils/csvExporter.js

export const downloadSelectionsCSV = (selections, users, classes) => {
  // 1. Define Headers
  const headers = [
    "Student Name",
    "Student Email",
    "Class",
    "CCA 1",
    "CCA 2",
    "CCA 3",
    "Submission Time",
  ];

  // 2. Format Rows
  const rows = selections.map((s) => {
    // --- FIX: ROBUST NAME LOOKUP ---
    let user = null;

    // Safety check: Handle if 'users' is passed as an Array or a Map/Object
    if (users) {
      if (Array.isArray(users)) {
        user = users.find(
          (u) => u.uid === s.studentUid || u.id === s.studentUid,
        );
      } else {
        user = users[s.studentUid];
      }
    }

    // Priority:
    // 1. Live Display Name (from User Profile)
    // 2. Snapshot Name (saved with the selection)
    // 3. Email prefix
    // 4. "Unknown"
    const studentName =
      user?.displayName ||
      s.studentName ||
      (s.studentEmail ? s.studentEmail.split("@")[0] : "Unknown");
    // -------------------------------

    const className = classes[s.classId]?.name || "Unknown";
    const cca1 = s.selectedCCAs[0]?.name || "-";
    const cca2 = s.selectedCCAs[1]?.name || "-";
    const cca3 = s.selectedCCAs[2]?.name || "-";
    const time = s.timestamp ? s.timestamp.toDate().toLocaleString() : "";

    // Escape quotes to prevent CSV errors
    return [
      `"${studentName}"`,
      `"${s.studentEmail || ""}"`,
      `"${className}"`,
      `"${cca1}"`,
      `"${cca2}"`,
      `"${cca3}"`,
      `"${time}"`,
    ].join(",");
  });

  // 3. Create and Download File
  const csvContent =
    "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute(
    "download",
    `CCA_Selections_${new Date().toISOString().split("T")[0]}.csv`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
