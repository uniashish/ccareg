import { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";
import sisBackground from "../assets/sisbackground.png";
import { db } from "../firebase";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import VendorToolbar from "../components/vendor/VendorToolbar";
import VendorStudentsTable from "../components/vendor/VendorStudentsTable";
import StudentDetailsModal from "../components/admin/StudentDetailsModal";
import MessageModal from "../components/common/MessageModal";

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

const normalizeText = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const EXPORT_FIELDS = [
  { key: "studentName", label: "Student Name" },
  { key: "className", label: "Class" },
  { key: "ccaNames", label: "CCA Name" },
  { key: "attendance", label: "Attendance" },
  { key: "paymentStatus", label: "Payment Status" },
  { key: "verified", label: "Verified" },
];

export default function VendorDashboard() {
  const { user } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [ccas, setCcas] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [selections, setSelections] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [selectedCcaId, setSelectedCcaId] = useState("all");
  const [selectedClassName, setSelectedClassName] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingMap, setUpdatingMap] = useState({});
  const [viewingSelection, setViewingSelection] = useState(null);
  const [paymentConfirm, setPaymentConfirm] = useState({
    isOpen: false,
    row: null,
    checked: false,
  });
  const [exportModal, setExportModal] = useState({
    isOpen: false,
    format: "csv",
  });
  const [selectedExportFields, setSelectedExportFields] = useState(
    EXPORT_FIELDS.map((field) => field.key),
  );

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

  const matchedVendors = useMemo(() => {
    const userEmail = String(user?.email || "")
      .trim()
      .toLowerCase();
    if (!userEmail) return [];

    return vendors.filter((vendor) => {
      const vendorEmail = String(vendor.email || "")
        .trim()
        .toLowerCase();
      return vendorEmail === userEmail;
    });
  }, [vendors, user?.email]);

  const vendorCcas = useMemo(() => {
    if (!matchedVendors.length) {
      return [];
    }

    const associationItems = matchedVendors.flatMap((vendor) =>
      Array.isArray(vendor.associatedCCAs) ? vendor.associatedCCAs : [],
    );

    if (!associationItems.length) {
      return [];
    }

    const associatedIds = new Set();
    const associatedNames = new Set();

    associationItems.forEach((item) => {
      if (typeof item === "string") {
        const rawValue = String(item || "").trim();
        const normalized = normalizeText(rawValue);
        if (!normalized) return;
        associatedIds.add(rawValue);
        associatedNames.add(normalized);
        return;
      }

      const idCandidate =
        item?.id || item?.ccaId || item?.ccaID || item?.value || "";
      const nameCandidate = item?.name || item?.ccaName || item?.label || "";

      if (idCandidate) associatedIds.add(String(idCandidate));
      if (nameCandidate) associatedNames.add(normalizeText(nameCandidate));
    });

    const resolvedFromCcaCollection = ccas.filter((cca) => {
      const idMatch = associatedIds.has(String(cca.id));
      const nameMatch = associatedNames.has(normalizeText(cca.name));
      return idMatch || nameMatch;
    });

    const knownIds = new Set(resolvedFromCcaCollection.map((cca) => cca.id));

    const fallbackItems = associationItems
      .map((item, index) => {
        if (typeof item === "string") {
          const rawValue = String(item || "").trim();
          const normalized = normalizeText(rawValue);
          if (!normalized) return null;
          if (knownIds.has(rawValue)) return null;

          const existingByName = resolvedFromCcaCollection.find(
            (cca) => normalizeText(cca.name) === normalized,
          );
          if (existingByName) return null;

          return {
            id: rawValue,
            name: rawValue,
          };
        }

        const idCandidate =
          item?.id || item?.ccaId || item?.ccaID || item?.value || "";
        const nameCandidate = item?.name || item?.ccaName || item?.label || "";

        if (!nameCandidate) return null;
        if (idCandidate && knownIds.has(idCandidate)) return null;

        const existingByName = resolvedFromCcaCollection.find(
          (cca) => normalizeText(cca.name) === normalizeText(nameCandidate),
        );
        if (existingByName) return null;

        return {
          id:
            String(idCandidate || "").trim() ||
            `assoc_${normalizeText(nameCandidate)}_${index}`,
          name: String(nameCandidate).trim(),
        };
      })
      .filter(Boolean);

    const merged = [...resolvedFromCcaCollection, ...fallbackItems];
    return merged.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [ccas, matchedVendors]);

  const vendorCcaIds = useMemo(
    () => vendorCcas.map((cca) => cca.id).filter(Boolean),
    [vendorCcas],
  );

  useEffect(() => {
    if (selectedCcaId === "all") return;
    const isStillValid = vendorCcas.some((cca) => cca.id === selectedCcaId);
    if (!isStillValid) {
      setSelectedCcaId("all");
    }
  }, [selectedCcaId, vendorCcas]);

  const classMap = useMemo(() => {
    return classesList.reduce((map, classItem) => {
      map[classItem.id] = classItem.name;
      return map;
    }, {});
  }, [classesList]);

  const classMapForModal = useMemo(() => {
    return classesList.reduce((map, classItem) => {
      map[classItem.id] = classItem;
      return map;
    }, {});
  }, [classesList]);

  const selectionsById = useMemo(() => {
    return selections.reduce((map, selection) => {
      map[selection.id] = selection;
      return map;
    }, {});
  }, [selections]);

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

      const vendorSelectedCcaList = selectedItems
        .filter((item) => vendorCcaIds.includes(item.id))
        .map((item) => ccaNameMap[item.id] || item.name || "Unnamed CCA")
        .filter(Boolean);

      const vendorSelectedCcaNames = vendorSelectedCcaList.join(", ");

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
            vendorSelectedCcaList,
            vendorSelectedCcaNames,
            attendanceLabel: `${presentCount}/${totalSessions}`,
            paymentStatus: item.paymentStatus === "Paid" ? "Paid" : "Unpaid",
            verified: normalizeVerified(item.verified),
          };
        });
    });
  }, [vendorCcaIds, vendorCcas, selections, classMap, attendanceByCcaStudent]);

  const classFilterOptions = useMemo(() => {
    return Array.from(
      new Set(allRows.map((row) => String(row.className || "").trim())),
    )
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [allRows]);

  useEffect(() => {
    if (selectedClassName === "all") return;
    const isStillValid = classFilterOptions.includes(selectedClassName);
    if (!isStillValid) {
      setSelectedClassName("all");
    }
  }, [selectedClassName, classFilterOptions]);

  const rowsAfterBaseFilters = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return allRows.filter((row) => {
      const matchesCca = selectedCcaId === "all" || row.ccaId === selectedCcaId;
      const matchesClass =
        selectedClassName === "all" || row.className === selectedClassName;
      const matchesQuery =
        !query ||
        row.studentName.toLowerCase().includes(query) ||
        row.className.toLowerCase().includes(query);

      return matchesCca && matchesClass && matchesQuery;
    });
  }, [allRows, selectedCcaId, selectedClassName, searchQuery]);

  const visibleRows = useMemo(() => {
    if (statusFilter === "all") return rowsAfterBaseFilters;

    return rowsAfterBaseFilters.filter((row) => {
      if (statusFilter === "unpaid") {
        return row.paymentStatus !== "Paid";
      }

      if (statusFilter === "verified") {
        return row.paymentStatus === "Paid" && row.verified;
      }

      if (statusFilter === "pending") {
        return row.paymentStatus === "Paid" && !row.verified;
      }

      return true;
    });
  }, [rowsAfterBaseFilters, statusFilter]);

  const applyVerificationUpdate = async ({ row, checked, markPaid }) => {
    if (!row?.selectionId || !row?.ccaId) return;

    const selection = selections.find((item) => item.id === row.selectionId);
    if (!selection) return;

    const selectedItems = Array.isArray(selection.selectedCCAs)
      ? selection.selectedCCAs
      : [];

    const updatedSelectedCCAs = selectedItems.map((item) => {
      if (item.id !== row.ccaId) return item;

      const nextPaymentStatus = markPaid
        ? "Paid"
        : item.paymentStatus === "Paid"
          ? "Paid"
          : "Unpaid";

      return {
        ...item,
        paymentStatus: nextPaymentStatus,
        verified: checked ? "Yes" : "No",
        paymentDone: nextPaymentStatus === "Paid",
        paymentApproved: nextPaymentStatus === "Paid",
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

  const handleToggleVerification = async (row, checked) => {
    if (!row?.selectionId || !row?.ccaId) return;

    if (row.paymentStatus !== "Paid") {
      if (!checked) return;

      setPaymentConfirm({
        isOpen: true,
        row,
        checked,
      });
      return;
    }

    await applyVerificationUpdate({ row, checked, markPaid: false });
  };

  const closePaymentConfirm = () => {
    setPaymentConfirm({
      isOpen: false,
      row: null,
      checked: false,
    });
  };

  const confirmUnpaidVerification = async () => {
    const targetRow = paymentConfirm.row;
    const targetChecked = paymentConfirm.checked;
    closePaymentConfirm();
    await applyVerificationUpdate({
      row: targetRow,
      checked: targetChecked,
      markPaid: true,
    });
  };

  const handleStudentClick = (row) => {
    if (!row?.selectionId) return;
    const selected = selectionsById[row.selectionId];
    if (!selected) return;
    setViewingSelection(selected);
  };

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

      return {
        studentName: group.studentName,
        className: group.className,
        ccaNames: items.map((item) => item.ccaName).join(" | "),
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

  const buildExportRows = () =>
    groupedExportRows.map((row) =>
      selectedExportFieldDefs.map((field) => row[field.key] ?? ""),
    );

  const handleExportCSV = () => {
    openExportModal("csv");
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

  const handleExportPDF = () => {
    openExportModal("pdf");
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

  const handleConfirmExport = () => {
    if (!selectedExportFieldDefs.length) return;

    if (exportModal.format === "pdf") {
      exportPDFWithSelectedFields();
    } else {
      exportCSVWithSelectedFields();
    }

    closeExportModal();
  };

  const summary = useMemo(() => {
    return rowsAfterBaseFilters.reduce(
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
  }, [rowsAfterBaseFilters]);

  const hasActiveFilters =
    selectedCcaId !== "all" ||
    selectedClassName !== "all" ||
    searchQuery.trim() !== "" ||
    statusFilter !== "all";

  const handleClearFilters = () => {
    setSelectedCcaId("all");
    setSelectedClassName("all");
    setSearchQuery("");
    setStatusFilter("all");
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat font-sans"
      style={{ backgroundImage: `url(${sisBackground})` }}
    >
      <Header />

      <main className="max-w-6xl mx-auto px-3 py-4 sm:px-6 sm:py-6 md:px-10">
        <div className="space-y-4">
          <VendorToolbar
            ccas={vendorCcas}
            selectedCcaId={selectedCcaId}
            onSelectedCcaIdChange={setSelectedCcaId}
            classNames={classFilterOptions}
            selectedClassName={selectedClassName}
            onSelectedClassNameChange={setSelectedClassName}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={handleClearFilters}
            onExportCSV={handleExportCSV}
            onExportPDF={handleExportPDF}
            canExport={visibleRows.length > 0}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`bg-white rounded-xl border p-3 sm:p-4 text-left transition-colors ${
                statusFilter === "all"
                  ? "border-slate-400 ring-2 ring-slate-200"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Visible Rows
              </p>
              <p className="text-lg sm:text-xl font-black text-slate-800 mt-1">
                {summary.total}
              </p>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("verified")}
              className={`bg-white rounded-xl border p-3 sm:p-4 text-left transition-colors ${
                statusFilter === "verified"
                  ? "border-emerald-400 ring-2 ring-emerald-100"
                  : "border-emerald-200 hover:border-emerald-300"
              }`}
            >
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-500">
                Verified
              </p>
              <p className="text-lg sm:text-xl font-black text-emerald-700 mt-1">
                {summary.verified}
              </p>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("pending")}
              className={`bg-white rounded-xl border p-3 sm:p-4 text-left transition-colors ${
                statusFilter === "pending"
                  ? "border-amber-400 ring-2 ring-amber-100"
                  : "border-amber-200 hover:border-amber-300"
              }`}
            >
              <p className="text-[10px] font-black uppercase tracking-wider text-amber-500">
                Pending
              </p>
              <p className="text-lg sm:text-xl font-black text-amber-700 mt-1">
                {summary.pending}
              </p>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("unpaid")}
              className={`bg-white rounded-xl border p-3 sm:p-4 text-left transition-colors ${
                statusFilter === "unpaid"
                  ? "border-rose-400 ring-2 ring-rose-100"
                  : "border-rose-200 hover:border-rose-300"
              }`}
            >
              <p className="text-[10px] font-black uppercase tracking-wider text-rose-500">
                Unpaid
              </p>
              <p className="text-lg sm:text-xl font-black text-rose-700 mt-1">
                {summary.unpaid}
              </p>
            </button>
          </div>

          <VendorStudentsTable
            rows={visibleRows}
            updatingMap={updatingMap}
            onToggleVerification={handleToggleVerification}
            onStudentClick={handleStudentClick}
          />
        </div>
      </main>

      <footer className="px-3 pb-4 text-center text-xs font-semibold tracking-wide text-slate-600 sm:px-6 md:px-10">
        DEVELOPED AND MAINTAINED BY ASHISH BHATNAGAR SISKGNEJ
      </footer>

      <StudentDetailsModal
        isOpen={!!viewingSelection}
        onClose={() => setViewingSelection(null)}
        selection={viewingSelection}
        classMap={classMapForModal}
      />

      {exportModal.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={closeExportModal}
          ></div>

          <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h3 className="text-lg font-black text-slate-800">
                Select fields to export
              </h3>
              <p className="text-xs font-semibold text-slate-500 mt-1">
                Choose the columns to include in the exported{" "}
                {exportModal.format.toUpperCase()} file.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllExportFields}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={handleClearAllExportFields}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="px-5 py-4 space-y-2 max-h-72 overflow-y-auto">
              {EXPORT_FIELDS.map((field) => {
                const checked = selectedExportFields.includes(field.key);

                return (
                  <label
                    key={field.key}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 cursor-pointer hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleExportField(field.key)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary/40"
                    />
                    <span className="text-sm font-semibold text-slate-700">
                      {field.label}
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="px-5 py-4 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeExportModal}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-bold text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmExport}
                disabled={!selectedExportFieldDefs.length}
                className={`px-4 py-2.5 rounded-xl font-bold text-sm ${
                  selectedExportFieldDefs.length
                    ? "bg-brand-primary text-white hover:bg-indigo-700"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                Export {exportModal.format.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}

      <MessageModal
        isOpen={paymentConfirm.isOpen}
        onClose={closePaymentConfirm}
        type="error"
        mode="confirm"
        title="Confirm Payment Verification"
        message="This student has not confirmed the payment from his portal, do you still want to verify the payment?"
        onConfirm={confirmUnpaidVerification}
        onCancel={closePaymentConfirm}
        confirmText="Verify"
        cancelText="Cancel"
      />
    </div>
  );
}
