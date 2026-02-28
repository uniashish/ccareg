import React, { useEffect, useMemo, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import CustomListAddStudentModal from "./CustomListAddStudentModal";
import CustomListModalCard from "./CustomListModalCard";
import CustomListExportModal from "./CustomListExportModal";
import { downloadSelectionsPDF } from "../../../utils/pdfExporter";

const parseDate = (value) => {
  if (!value) return null;

  if (typeof value === "object" && typeof value.toDate === "function") {
    const date = value.toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    ("seconds" in value || "nanoseconds" in value)
  ) {
    const date = new Date((value.seconds || 0) * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === "number") {
    const date = new Date(value > 1e12 ? value : value * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTodayDateOnly = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const formatDateLabel = (dateKey) => {
  if (!dateKey) return "";
  const parts = dateKey.split("-").map((value) => Number(value));
  if (parts.length !== 3 || parts.some((value) => Number.isNaN(value))) {
    return dateKey;
  }
  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
};

export default function CustomStudentList({
  isOpen,
  onClose,
  selections = [],
  classes = [],
  ccas = [],
  user,
}) {
  const [customList, setCustomList] = useState([]);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [selectedCheckboxes, setSelectedCheckboxes] = useState({});
  const [classFilter, setClassFilter] = useState("");
  const [attendanceByStudentCCA, setAttendanceByStudentCCA] = useState({});
  const [completedDateKeysByCCA, setCompletedDateKeysByCCA] = useState({});
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState("csv");

  const teacherId = user?.uid;
  const customListDocId = `${teacherId}_customList`;

  // Load custom list from Firestore when modal opens
  useEffect(() => {
    if (!isOpen || !teacherId) return;

    const loadCustomList = async () => {
      try {
        setIsLoadingList(true);
        const docSnap = await getDoc(
          doc(db, "customStudentLists", customListDocId),
        );
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCustomList(data.students || []);
        } else {
          setCustomList([]);
        }
        setHasLoadedOnce(true);
      } catch {
        setHasLoadedOnce(true);
      } finally {
        setIsLoadingList(false);
      }
    };

    loadCustomList();
  }, [isOpen, teacherId, customListDocId]);

  // Save custom list to Firestore whenever it changes (debounced)
  useEffect(() => {
    if (!teacherId || !hasLoadedOnce) return;

    const timer = setTimeout(async () => {
      try {
        await setDoc(
          doc(db, "customStudentLists", customListDocId),
          {
            students: customList,
            teacherId,
            updatedAt: new Date(),
          },
          { merge: true },
        );
      } catch {
        // Intentionally swallow errors to avoid noisy console output
      }
    }, 500); // Debounce 500ms

    return () => clearTimeout(timer);
  }, [customList, teacherId, customListDocId, hasLoadedOnce]);

  const ccasById = useMemo(() => {
    return (ccas || []).reduce((map, cca) => {
      if (cca?.id) {
        map[cca.id] = cca;
      }
      return map;
    }, {});
  }, [ccas]);

  // Enrich selections with className by looking up classId in classes array
  const enrichedSelections = selections.map((sel) => {
    const matchedClass = classes.find((c) => c.id === sel.classId);
    return {
      ...sel,
      className: matchedClass ? matchedClass.name : "Unknown",
    };
  });

  // Create a set of IDs for students already in customList
  const customListIds = useMemo(() => {
    return new Set(customList.map((s) => s.id));
  }, [customList]);

  const handleToggleCheckbox = (studentId) => {
    // Don't allow toggling if student is already in customList
    if (customListIds.has(studentId)) return;

    setSelectedCheckboxes((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  const handleAddStudents = () => {
    const newStudents = enrichedSelections.filter(
      (s) => selectedCheckboxes[s.id],
    );
    setCustomList((prev) => {
      const existingIds = new Set(prev.map((s) => s.id));
      const toAdd = newStudents.filter((s) => !existingIds.has(s.id));
      return [...prev, ...toAdd];
    });
    setSelectedCheckboxes({});
    setIsAddStudentOpen(false);
  };

  const handleRemoveStudent = (index) => {
    setCustomList((prev) => prev.filter((_, i) => i !== index));
  };

  const getAttendanceMap = (student, ccaId) => {
    if (!ccaId) return {};
    const attendanceStudentId = student.studentUid || student.id;
    return attendanceByStudentCCA[`${attendanceStudentId}__${ccaId}`] || {};
  };

  useEffect(() => {
    let isActive = true;

    const loadAttendanceSummaries = async () => {
      if (customList.length === 0) {
        if (isActive) {
          setAttendanceByStudentCCA({});
          setCompletedDateKeysByCCA({});
        }
        return;
      }

      const today = getTodayDateOnly();
      const dateKeysByCCA = {};
      const docIds = new Set();

      customList.forEach((student) => {
        const selectedItems = Array.isArray(student.selectedCCAs)
          ? student.selectedCCAs
          : [];

        selectedItems.forEach((item) => {
          const ccaId = item?.id;
          if (!ccaId || dateKeysByCCA[ccaId]) return;

          const ccaDetails = ccasById[ccaId] || {};
          const rawSessionDates = Array.isArray(ccaDetails.sessionDates)
            ? ccaDetails.sessionDates
            : ccaDetails.sessionDates
              ? [ccaDetails.sessionDates]
              : [];

          const dateKeys = rawSessionDates
            .map((sessionDate) => parseDate(sessionDate))
            .filter(Boolean)
            .filter((date) => {
              const dateOnly = new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate(),
              );
              return dateOnly <= today;
            })
            .map((date) => toDateKey(date));

          dateKeysByCCA[ccaId] = [...new Set(dateKeys)].sort();

          dateKeysByCCA[ccaId].forEach((dateKey) => {
            docIds.add(`${ccaId}_${dateKey}`);
          });
        });
      });

      const attendanceByDocId = {};

      if (docIds.size > 0) {
        const docIdList = Array.from(docIds);
        const results = await Promise.allSettled(
          docIdList.map((docId) => getDoc(doc(db, "attendanceRecords", docId))),
        );

        results.forEach((result, index) => {
          const docId = docIdList[index];
          if (result.status !== "fulfilled" || !result.value.exists()) {
            attendanceByDocId[docId] = [];
            return;
          }

          const data = result.value.data() || {};
          attendanceByDocId[docId] = Array.isArray(data.presentStudentIds)
            ? data.presentStudentIds
            : [];
        });
      }

      const summaryMap = {};

      customList.forEach((student) => {
        const attendanceStudentId = student.studentUid || student.id;
        const selectedItems = Array.isArray(student.selectedCCAs)
          ? student.selectedCCAs
          : [];

        selectedItems.forEach((item) => {
          const ccaId = item?.id;
          if (!ccaId) return;

          const dateKeys = dateKeysByCCA[ccaId] || [];
          const attendanceByDateKey = {};

          dateKeys.forEach((dateKey) => {
            const docId = `${ccaId}_${dateKey}`;
            const presentStudentIds = attendanceByDocId[docId] || [];
            attendanceByDateKey[dateKey] =
              presentStudentIds.includes(attendanceStudentId);
          });

          summaryMap[`${attendanceStudentId}__${ccaId}`] = attendanceByDateKey;
        });
      });

      if (isActive) {
        setAttendanceByStudentCCA(summaryMap);
        setCompletedDateKeysByCCA(dateKeysByCCA);
      }
    };

    loadAttendanceSummaries();

    return () => {
      isActive = false;
    };
  }, [customList, ccasById]);

  const uniqueClasses = Array.from(
    new Set(enrichedSelections.map((s) => s.className).filter(Boolean)),
  ).sort();

  const filteredSelections = classFilter
    ? enrichedSelections.filter((s) => s.className === classFilter)
    : enrichedSelections;

  const handleCloseAddStudent = () => {
    setIsAddStudentOpen(false);
    setSelectedCheckboxes({});
    setClassFilter("");
  };

  const handleCancelAddStudent = () => {
    setIsAddStudentOpen(false);
    setSelectedCheckboxes({});
  };

  const prepareExportData = (selectedFields) => {
    return customList.map((student) => {
      const data = {};

      if (selectedFields.studentName) {
        data.studentName = student.studentName || "Unknown";
      }

      if (selectedFields.studentEmail) {
        data.studentEmail = student.studentEmail || "";
      }

      if (selectedFields.className) {
        data.className = student.className || "Unknown";
      }

      if (selectedFields.ccaName) {
        const ccaNames = Array.isArray(student.selectedCCAs)
          ? student.selectedCCAs.map((cca) => cca?.name || "").filter(Boolean)
          : [];
        data.ccaName = ccaNames.join(", ");
      }

      if (selectedFields.attendanceSummary) {
        const ccaIds = Array.isArray(student.selectedCCAs)
          ? student.selectedCCAs.map((cca) => cca?.id).filter(Boolean)
          : [];

        let presentCount = 0;
        let totalCount = 0;

        ccaIds.forEach((ccaId) => {
          const attendanceMap = getAttendanceMap(student, ccaId);
          totalCount += Object.keys(attendanceMap).length;
          presentCount += Object.values(attendanceMap).filter(Boolean).length;
        });

        data.attendanceSummary =
          totalCount > 0 ? `${presentCount}/${totalCount}` : "0/0";
      }

      if (selectedFields.perSessionAttendance) {
        const sessionDataByCCA = [];
        const ccaIds = Array.isArray(student.selectedCCAs)
          ? student.selectedCCAs.map((cca) => cca?.id).filter(Boolean)
          : [];

        ccaIds.forEach((ccaId) => {
          const ccaDetail = ccasById[ccaId];
          const ccaName = ccaDetail?.name || "Unknown";
          const attendanceMap = getAttendanceMap(student, ccaId);

          const sessions = Object.entries(attendanceMap)
            .map(
              ([dateKey, isPresent]) =>
                `${formatDateLabel(dateKey)} (${isPresent ? "P" : "A"})`,
            )
            .join(", ");

          if (sessions) {
            sessionDataByCCA.push(`${ccaName}: ${sessions}`);
          }
        });

        data.perSessionAttendance = sessionDataByCCA.join("\n");
      }

      return data;
    });
  };

  const handleExportCSV = (selectedFields) => {
    const exportData = prepareExportData(selectedFields);

    // Define field labels for headers
    const fieldLabels = {
      studentName: "Student Name",
      studentEmail: "Student Email",
      className: "Class",
      ccaName: "CCA",
      attendanceSummary: "Attendance Summary",
      perSessionAttendance: "Per-Session Attendance",
    };

    // Get selected field keys in order
    const selectedFieldKeys = Object.keys(selectedFields).filter(
      (key) => selectedFields[key],
    );

    // Build headers
    const headers = selectedFieldKeys.map((key) => fieldLabels[key]);

    // Escape CSV special characters
    const escapeCSV = (value) => {
      const safeValue = value == null ? "" : String(value);
      if (
        safeValue.includes(",") ||
        safeValue.includes('"') ||
        safeValue.includes("\n")
      ) {
        return `"${safeValue.replace(/"/g, '""')}"`;
      }
      return safeValue;
    };

    // Build rows
    const rows = exportData.map((row) =>
      selectedFieldKeys.map((key) => escapeCSV(row[key])).join(","),
    );

    // Create CSV content
    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");

    // Download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `CCA_My_List_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = (selectedFields, fontSize) => {
    const exportData = prepareExportData(selectedFields);

    // Map field names to PDF field keys
    const fieldKeyMap = {
      studentName: "studentName",
      studentEmail: "studentEmail",
      className: "className",
      ccaName: "ccaName",
      attendanceSummary: "attendanceSummary",
      perSessionAttendance: "perSessionAttendance",
    };

    const fields = Object.keys(selectedFields)
      .filter((key) => selectedFields[key])
      .map((key) => fieldKeyMap[key])
      .filter(Boolean);

    downloadSelectionsPDF(exportData, {}, fields, fontSize);
  };

  const handleOpenExportCSV = () => {
    setExportFormat("csv");
    setIsExportModalOpen(true);
  };

  const handleOpenExportPDF = () => {
    setExportFormat("pdf");
    setIsExportModalOpen(true);
  };

  const handleExport = (selectedFields, fontSize) => {
    if (exportFormat === "csv") {
      handleExportCSV(selectedFields);
    } else if (exportFormat === "pdf") {
      handleExportPDF(selectedFields, fontSize);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      ></div>

      <CustomListModalCard
        onClose={onClose}
        onAddStudent={() => setIsAddStudentOpen(true)}
        isLoading={isLoadingList}
        customList={customList}
        onRemoveStudent={handleRemoveStudent}
        getAttendanceMap={getAttendanceMap}
        completedDateKeysByCCA={completedDateKeysByCCA}
        formatDateLabel={formatDateLabel}
        onExportCSV={handleOpenExportCSV}
        onExportPDF={handleOpenExportPDF}
      />

      <CustomListExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
        exportFormat={exportFormat}
      />

      <CustomListAddStudentModal
        isOpen={isAddStudentOpen}
        onClose={handleCloseAddStudent}
        onCancel={handleCancelAddStudent}
        classFilter={classFilter}
        onClassFilterChange={(event) => setClassFilter(event.target.value)}
        uniqueClasses={uniqueClasses}
        filteredSelections={filteredSelections}
        enrichedSelectionsCount={enrichedSelections.length}
        selectedCheckboxes={selectedCheckboxes}
        onToggleCheckbox={handleToggleCheckbox}
        onAddStudents={handleAddStudents}
        customListIds={customListIds}
      />
    </div>
  );
}
