import React, { useEffect, useState } from "react";
import { FiPlus, FiSearch } from "react-icons/fi";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import CCAGrid from "./CCAGrid"; // Import the new grid component
import CCAStudentsModal from "./CCAStudentsModal";

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
  const [vendorNamesByCcaId, setVendorNamesByCcaId] = useState({});

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
        onOpenStudentList={setSelectedCCAForStudents}
        onClearSearch={() => setSearchQuery("")}
      />

      <CCAStudentsModal
        isOpen={!!selectedCCAForStudents}
        onClose={() => setSelectedCCAForStudents(null)}
        cca={selectedCCAForStudents}
        selections={selections}
        users={users}
        classesList={classesList}
      />
    </section>
  );
}
