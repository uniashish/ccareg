import { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";
import sisBackground from "../assets/sisbackground.png";
import { db } from "../firebase";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import VendorToolbar from "../components/vendor/VendorToolbar";
import VendorStudentsTable from "../components/vendor/VendorStudentsTable";

const normalizeVerified = (value) => {
  if (value === true) return true;
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  return normalized === "yes" || normalized === "verified";
};

const escapeCSV = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export default function VendorDashboard() {
  const { user } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [ccas, setCcas] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [selections, setSelections] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [selectedCcaId, setSelectedCcaId] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingMap, setUpdatingMap] = useState({});

  useEffect(() => {
    const unsubVendors = onSnapshot(collection(db, "vendors"), (snapshot) => {
      setVendors(
        snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        })),
      );
    });

    const unsubCcas = onSnapshot(collection(db, "ccas"), (snapshot) => {
      setCcas(
        snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        })),
      );
    });

    const unsubClasses = onSnapshot(collection(db, "classes"), (snapshot) => {
      setClassesList(
        snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        })),
      );
    });

    const unsubSelections = onSnapshot(
      collection(db, "selections"),
      (snapshot) => {
        setSelections(
          snapshot.docs.map((document) => ({
            id: document.id,
            ...document.data(),
          })),
        );
      },
    );

    const unsubAttendance = onSnapshot(
      collection(db, "attendanceRecords"),
      (snapshot) => {
        setAttendanceRecords(
          snapshot.docs.map((document) => ({
            id: document.id,
            ...document.data(),
          })),
        );
      },
    );

    return () => {
      unsubVendors();
      unsubCcas();
      unsubClasses();
      unsubSelections();
      unsubAttendance();
    };
  }, []);

  const currentVendor = useMemo(() => {
    const userEmail = String(user?.email || "")
      .trim()
      .toLowerCase();
    if (!userEmail) return null;

    return (
      vendors.find((vendor) => {
        const vendorEmail = String(vendor.email || "")
          .trim()
          .toLowerCase();
        return vendorEmail === userEmail;
      }) || null
    );
  }, [vendors, user?.email]);

  const vendorCcaIds = useMemo(() => {
    if (!currentVendor || !Array.isArray(currentVendor.associatedCCAs))
      return [];

    return currentVendor.associatedCCAs
      .map((item) => (typeof item === "string" ? item : item?.id))
      .filter(Boolean);
  }, [currentVendor]);

  const vendorCcas = useMemo(() => {
    if (!vendorCcaIds.length) return [];
    return ccas
      .filter((cca) => vendorCcaIds.includes(cca.id))
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [ccas, vendorCcaIds]);

  const classMap = useMemo(() => {
    return classesList.reduce((map, classItem) => {
      map[classItem.id] = classItem.name;
      return map;
    }, {});
  }, [classesList]);

  const attendanceByCcaStudent = useMemo(() => {
    const map = {};

    attendanceRecords.forEach((record) => {
      const ccaId = record.ccaId;
      if (!ccaId || !vendorCcaIds.includes(ccaId)) return;

      const presentStudentIds = Array.isArray(record.presentStudentIds)
        ? record.presentStudentIds
        : [];

      if (!map[ccaId]) {
        map[ccaId] = { totalSessions: 0, presentByStudentId: {} };
      }

      map[ccaId].totalSessions += 1;

      presentStudentIds.forEach((studentId) => {
        map[ccaId].presentByStudentId[studentId] =
          (map[ccaId].presentByStudentId[studentId] || 0) + 1;
      });
    });

    return map;
  }, [attendanceRecords, vendorCcaIds]);

  const allRows = useMemo(() => {
    if (!vendorCcaIds.length) return [];

    const ccaNameMap = vendorCcas.reduce((map, cca) => {
      map[cca.id] = cca.name || "Unnamed CCA";
      return map;
    }, {});

    return selections.flatMap((selection) => {
      const selectedItems = Array.isArray(selection.selectedCCAs)
        ? selection.selectedCCAs
        : [];

      return selectedItems
        .filter((item) => vendorCcaIds.includes(item.id))
        .map((item) => {
          const attendance = attendanceByCcaStudent[item.id] || {
            totalSessions: 0,
            presentByStudentId: {},
          };

          const studentIdsToCheck = [selection.id, selection.studentUid].filter(
            Boolean,
          );
          const presentCount = studentIdsToCheck.reduce((max, studentId) => {
            const count = attendance.presentByStudentId[studentId] || 0;
            return count > max ? count : max;
          }, 0);

          const totalSessions = attendance.totalSessions || 0;

          return {
            selectionId: selection.id,
            studentUid: selection.studentUid || selection.id,
            studentName: selection.studentName || "Unknown Student",
            className:
              classMap[selection.classId] ||
              selection.classNameSnapshot ||
              "Unknown Class",
            ccaId: item.id,
            ccaName: ccaNameMap[item.id] || item.name || "Unnamed CCA",
            attendanceLabel: `${presentCount}/${totalSessions}`,
            paymentStatus: item.paymentStatus === "Paid" ? "Paid" : "Unpaid",
            verified: normalizeVerified(item.verified),
          };
        });
    });
  }, [vendorCcaIds, vendorCcas, selections, classMap, attendanceByCcaStudent]);

  const visibleRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return allRows.filter((row) => {
      const matchesCca = selectedCcaId === "all" || row.ccaId === selectedCcaId;
      const matchesQuery =
        !query ||
        row.studentName.toLowerCase().includes(query) ||
        row.className.toLowerCase().includes(query);

      return matchesCca && matchesQuery;
    });
  }, [allRows, selectedCcaId, searchQuery]);

  const handleToggleVerification = async (row, checked) => {
    if (!row?.selectionId || !row?.ccaId || row.paymentStatus !== "Paid")
      return;

    const selection = selections.find((item) => item.id === row.selectionId);
    if (!selection) return;

    const selectedItems = Array.isArray(selection.selectedCCAs)
      ? selection.selectedCCAs
      : [];

    const updatedSelectedCCAs = selectedItems.map((item) => {
      if (item.id !== row.ccaId) return item;
      return {
        ...item,
        verified: checked ? "Yes" : "No",
      };
    });

    const updateKey = `${row.selectionId}_${row.ccaId}`;

    try {
      setUpdatingMap((prev) => ({ ...prev, [updateKey]: true }));

      await updateDoc(doc(db, "selections", row.selectionId), {
        selectedCCAs: updatedSelectedCCAs,
      });
    } catch (error) {
      console.error("Error updating verification:", error);
    } finally {
      setUpdatingMap((prev) => ({ ...prev, [updateKey]: false }));
    }
  };

  const handleExportCSV = () => {
    if (!visibleRows.length) return;

    const headers = [
      "Student Name",
      "Class",
      "CCA Name",
      "Attendance",
      "Payment Status",
      "Verified",
    ];

    const rows = visibleRows.map((row) =>
      [
        row.studentName,
        row.className,
        row.ccaName,
        row.attendanceLabel,
        row.paymentStatus,
        row.verified ? "Yes" : "No",
      ]
        .map((cell) => escapeCSV(cell))
        .join(","),
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

  const handleExportPDF = () => {
    if (!visibleRows.length) return;

    const rowsHtml = visibleRows
      .map(
        (row) => `<tr>
          <td>${escapeHtml(row.studentName)}</td>
          <td>${escapeHtml(row.className)}</td>
          <td>${escapeHtml(row.ccaName)}</td>
          <td>${escapeHtml(row.attendanceLabel)}</td>
          <td>${escapeHtml(row.paymentStatus)}</td>
          <td>${escapeHtml(row.verified ? "Yes" : "No")}</td>
        </tr>`,
      )
      .join("\n");

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
              <tr>
                <th>Student Name</th>
                <th>Class</th>
                <th>CCA Name</th>
                <th>Attendance</th>
                <th>Payment Status</th>
                <th>Verified</th>
              </tr>
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

  const summary = useMemo(() => {
    return visibleRows.reduce(
      (acc, row) => {
        acc.total += 1;
        if (row.paymentStatus !== "Paid") {
          acc.unpaid += 1;
        } else if (row.verified) {
          acc.verified += 1;
        } else {
          acc.pending += 1;
        }
        return acc;
      },
      { total: 0, verified: 0, pending: 0, unpaid: 0 },
    );
  }, [visibleRows]);

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat font-sans"
      style={{ backgroundImage: `url(${sisBackground})` }}
    >
      <Header />

      <main className="max-w-6xl mx-auto px-6 py-6 md:px-10">
        <div className="space-y-4">
          <VendorToolbar
            ccas={vendorCcas}
            selectedCcaId={selectedCcaId}
            onSelectedCcaIdChange={setSelectedCcaId}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            onExportCSV={handleExportCSV}
            onExportPDF={handleExportPDF}
            canExport={visibleRows.length > 0}
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-slate-200 p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Visible Rows
              </p>
              <p className="text-xl font-black text-slate-800 mt-1">
                {summary.total}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-emerald-200 p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-500">
                Verified
              </p>
              <p className="text-xl font-black text-emerald-700 mt-1">
                {summary.verified}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-amber-200 p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-amber-500">
                Pending
              </p>
              <p className="text-xl font-black text-amber-700 mt-1">
                {summary.pending}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-rose-200 p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-rose-500">
                Unpaid
              </p>
              <p className="text-xl font-black text-rose-700 mt-1">
                {summary.unpaid}
              </p>
            </div>
          </div>

          <VendorStudentsTable
            rows={visibleRows}
            updatingMap={updatingMap}
            onToggleVerification={handleToggleVerification}
          />
        </div>
      </main>
    </div>
  );
}
