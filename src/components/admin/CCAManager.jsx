import React, { useEffect, useState } from "react";
import { FiPlus, FiSearch } from "react-icons/fi";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { downloadCCAsPDF } from "../../utils/pdfExporter";
import CCAGrid from "./CCAGrid"; // Import the new grid component
import CCAStudentsModal from "./CCAStudentsModal";
import AdminAttendanceModal from "./AdminAttendanceModal";
import ExportFieldsModal from "../common/ExportFieldsModal";

export default function CCAManager({
  ccas,
  selections,
  users,
  classesList,
  onAddClick,
  onEditClick,
  onDeleteClick,
  onViewDetails,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCCAForStudents, setSelectedCCAForStudents] = useState(null);
  const [selectedCCAForAttendance, setSelectedCCAForAttendance] =
    useState(null);
  const [vendorNamesByCcaId, setVendorNamesByCcaId] = useState({});

  // Export Modal State
  const [exportFieldsOpen, setExportFieldsOpen] = useState(false);
  const [exportFields] = useState([
    { key: "activity", label: "Activity" },
    { key: "status", label: "Status" },
    { key: "schedule", label: "Schedule" },
    { key: "time", label: "Time" },
    { key: "venue", label: "Venue" },
    { key: "teacher", label: "Teacher" },
    { key: "capacity", label: "Capacity" },
    { key: "fee", label: "Fee" },
  ]);
  const [selectedExportFields, setSelectedExportFields] = useState([
    "activity",
    "status",
    "schedule",
    "time",
    "venue",
    "teacher",
    "capacity",
    "fee",
  ]);
  const [pdfFontSize, setPdfFontSize] = useState(10);

  useEffect(() => {
    const fetchVendorMappings = async () => {
      try {
        const vendorsSnap = await getDocs(collection(db, "vendors"));
        const map = {};

        vendorsSnap.forEach((vendorDoc) => {
          const vendorData = vendorDoc.data();
          const vendorName = (vendorData?.name || "").toLowerCase();
          const associatedCCAs = Array.isArray(vendorData?.associatedCCAs)
            ? vendorData.associatedCCAs
            : [];

          associatedCCAs.forEach((associatedCCA) => {
            const ccaId =
              typeof associatedCCA === "string"
                ? associatedCCA
                : associatedCCA?.id;

            if (!ccaId || !vendorName) return;

            if (!map[ccaId]) {
              map[ccaId] = vendorName;
            } else if (!map[ccaId].includes(vendorName)) {
              map[ccaId] = `${map[ccaId]} ${vendorName}`;
            }
          });
        });

        setVendorNamesByCcaId(map);
      } catch (error) {
        console.error("Error fetching vendor mappings:", error);
        setVendorNamesByCcaId({});
      }
    };

    fetchVendorMappings();
  }, []);

  // Filter logic based on CCA name + vendor name (vendor not displayed in UI)
  const normalizedQuery = searchQuery.toLowerCase().trim();
  const filteredCCAs = ccas.filter((cca) => {
    if (!normalizedQuery) return true;

    const ccaName = (cca.name || "").toLowerCase();
    const vendorName = vendorNamesByCcaId[cca.id] || "";

    return (
      ccaName.includes(normalizedQuery) || vendorName.includes(normalizedQuery)
    );
  });

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

  const handleExportPDFClick = () => {
    if (filteredCCAs.length === 0) return;
    setExportFieldsOpen(true);
  };

  const handleExportFieldsConfirm = (fields, fontSize) => {
    setSelectedExportFields(fields);
    setPdfFontSize(fontSize);

    // Prepare export data with only selected fields
    const exportData = filteredCCAs.map((cca) => {
      const row = {
        activity: cca.name || "",
        status: cca.isActive ? "Active" : "Hidden",
        schedule: getScheduleSummary(cca.sessionDates),
        time: `${formatTime12hr(cca.startTime)} - ${formatTime12hr(cca.endTime)}`,
        venue: cca.venue || "TBD",
        teacher: cca.teacherDisplay || cca.teacher || "Staff",
        capacity: `${cca.enrolledCount || 0} / ${cca.maxSeats || "∞"}`,
        fee:
          Number(cca.price) === 0
            ? "Free"
            : `Rp ${Number(cca.price).toLocaleString()}`,
      };
      // Only include selected fields
      return Object.fromEntries(
        Object.entries(row).filter(([k]) => fields.includes(k)),
      );
    });

    downloadCCAsPDF(exportData, fields, fontSize);
  };

  return (
    <section className="space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center gap-8 pb-2">
        {/* Title Group */}
        <div className="shrink-0">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            CCA Management
          </h2>
          <p className="text-slate-500 text-sm">
            Create and manage CCAs ({filteredCCAs.length} found)
          </p>
        </div>

        {/* Actions Group - Placed next to title (not far right) to avoid arrow overlap */}
        <div className="flex gap-3">
          <div className="relative group">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors" />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 w-full md:w-64 shadow-sm transition-all"
            />
          </div>
          <button
            onClick={onAddClick}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl font-bold shadow-lg shadow-brand-primary/20 transition-all active:scale-95 text-sm whitespace-nowrap"
          >
            <FiPlus size={18} />
            <span>Add New</span>
          </button>
        </div>
      </div>

      {/* THE GRID (Handles Scroll, Cards, and Empty State) */}
      <CCAGrid
        ccas={filteredCCAs}
        onEdit={onEditClick}
        onDelete={onDeleteClick}
        onViewDetails={onViewDetails}
        onViewAttendance={setSelectedCCAForAttendance}
        onOpenStudentList={setSelectedCCAForStudents}
        onClearSearch={() => setSearchQuery("")}
        onExportPDF={handleExportPDFClick}
      />

      <CCAStudentsModal
        isOpen={!!selectedCCAForStudents}
        onClose={() => setSelectedCCAForStudents(null)}
        cca={selectedCCAForStudents}
        selections={selections}
        users={users}
        classesList={classesList}
      />

      <AdminAttendanceModal
        isOpen={!!selectedCCAForAttendance}
        onClose={() => setSelectedCCAForAttendance(null)}
        cca={selectedCCAForAttendance}
        selections={selections}
        users={users}
      />

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
    </section>
  );
}
