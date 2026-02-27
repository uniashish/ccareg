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
import InactivePortalView from "../components/vendor/InactivePortalView";
import SummaryCards from "../components/vendor/SummaryCards";
import VendorExportFieldsModal from "../components/vendor/VendorExportFieldsModal";
import { normalizeVerified, normalizeText } from "../utils/vendorUtils";
import { useVendorExport } from "../hooks/useVendorExport";

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
  const [isVendorPortalActive, setIsVendorPortalActive] = useState(true);
  const [adminName, setAdminName] = useState("");
  const [adminContact, setAdminContact] = useState("");

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

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "general"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setIsVendorPortalActive(data.vendorPortalActive !== false);
        if (data.adminName) setAdminName(data.adminName);
        if (data.adminContact) setAdminContact(data.adminContact);
      } else {
        setIsVendorPortalActive(true);
      }
    });
    return () => unsub();
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

  // Export functionality
  const {
    exportModal,
    selectedExportFields,
    handleExportCSV,
    handleExportPDF,
    closeExportModal,
    toggleExportField,
    handleSelectAllExportFields,
    handleClearAllExportFields,
    handleConfirmExport,
    canExport,
  } = useVendorExport(visibleRows);

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

      {!isVendorPortalActive ? (
        <InactivePortalView adminName={adminName} adminContact={adminContact} />
      ) : (
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
              canExport={canExport}
            />

            <SummaryCards
              summary={summary}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />

            <VendorStudentsTable
              rows={visibleRows}
              updatingMap={updatingMap}
              onToggleVerification={handleToggleVerification}
              onStudentClick={handleStudentClick}
            />
          </div>
        </main>
      )}

      <footer className="px-3 pb-4 text-center text-xs font-semibold tracking-wide text-slate-600 sm:px-6 md:px-10">
        DEVELOPED AND MAINTAINED BY ASHISH BHATNAGAR SISKGNEJ
      </footer>

      <StudentDetailsModal
        isOpen={!!viewingSelection}
        onClose={() => setViewingSelection(null)}
        selection={viewingSelection}
        classMap={classMapForModal}
      />

      <VendorExportFieldsModal
        isOpen={exportModal.isOpen}
        onClose={closeExportModal}
        format={exportModal.format}
        selectedFields={selectedExportFields}
        onToggleField={toggleExportField}
        onSelectAll={handleSelectAllExportFields}
        onClearAll={handleClearAllExportFields}
        onConfirm={handleConfirmExport}
      />

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
