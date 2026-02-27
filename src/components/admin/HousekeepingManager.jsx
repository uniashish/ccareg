import React, { useMemo, useState, useRef, useEffect } from "react";
import Papa from "papaparse";
import {
  FiTool,
  FiSearch,
  FiUploadCloud,
  FiCheck,
  FiBriefcase,
  FiDownload,
} from "react-icons/fi";
import { db } from "../../firebase"; // Import db
import { collection, onSnapshot } from "firebase/firestore"; // Import Firestore hooks

// --- EXISTING IMPORTS ---
import LimitManager from "./LimitManager";
import TermManager from "./TermManager";
import AdminContactManager from "./AdminContactManager";
import EmailTemplateManager from "./EmailTemplateManager";
import MissingStudentsModal from "./MissingStudentsModal";
import { downloadVendorsCSV } from "../../utils/csvExporter";
import { downloadVendorsPDF } from "../../utils/pdfExporter";
import PortalControl from "./PortalControl";

// --- IMPORT ---
import VendorManagerModal from "./VendorManagerModal";

export default function HousekeepingManager({
  selections,
  users,
  classesList,
}) {
  const housekeepingCardClass =
    "relative overflow-hidden bg-[radial-gradient(circle_at_top_right,_#dbeafe_0%,_#fee2e2_100%)] rounded-3xl border border-slate-300 shadow-[0_18px_24px_-18px_rgba(15,23,42,0.55),0_8px_10px_-8px_rgba(15,23,42,0.3),0_1px_0_rgba(255,255,255,0.85)_inset] hover:shadow-[0_28px_38px_-20px_rgba(15,23,42,0.6),0_12px_16px_-10px_rgba(15,23,42,0.35),0_1px_0_rgba(255,255,255,0.9)_inset] [transform:perspective(1200px)_rotateX(2deg)] hover:[transform:perspective(1200px)_rotateX(4deg)_translateY(-4px)] transition-all duration-300";

  const classMap = useMemo(() => {
    return (classesList || []).reduce((acc, cls) => {
      acc[cls.id] = cls;
      return acc;
    }, {});
  }, [classesList]);

  // --- EXISTING STATE (DEFAULTER CHECK) ---
  const [uploadedStudents, setUploadedStudents] = useState([]);
  const [missingStudents, setMissingStudents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef(null);

  // --- STATE (VENDOR MODAL) ---
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);

  // --- NEW STATE: VENDORS LIST ---
  const [vendors, setVendors] = useState([]);

  // --- FETCH VENDORS ---
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "vendors"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      // Sort alphabetically by name
      data.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      setVendors(data);
    });
    return () => unsub();
  }, []);

  // --- EXISTING LOGIC: CSV ---
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const cleanData = results.data.map((row) => {
          const getKey = (key) =>
            Object.keys(row).find((k) => k.toLowerCase() === key.toLowerCase());

          return {
            name: row[getKey("name")] || "Unknown",
            email: (row[getKey("email")] || "").trim().toLowerCase(),
            class: row[getKey("class")] || "Unknown",
          };
        });
        const validData = cleanData.filter(
          (r) => r.email && r.email.length > 0,
        );
        setUploadedStudents(validData);
      },
    });
  };

  const handleFindMissing = () => {
    if (uploadedStudents.length === 0) return;
    const submittedEmails = new Set(
      selections.map((s) => (s.studentEmail || "").toLowerCase()),
    );
    const missing = uploadedStudents.filter(
      (student) => !submittedEmails.has(student.email),
    );
    setMissingStudents(missing);
    setIsModalOpen(true);
  };

  const handleExportVendorsCSV = () => {
    downloadVendorsCSV(vendors);
  };

  const handleExportVendorsPDF = () => {
    downloadVendorsPDF(vendors);
  };

  return (
    <div className="w-full h-full">
      <div className="h-[75vh] overflow-y-auto pr-2 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. SELECTION LIMITS */}
          <LimitManager />

          {/* 2. ADMIN CONTACT */}
          <AdminContactManager />

          {/* 3. PORTAL CONTROL */}
          <PortalControl housekeepingCardClass={housekeepingCardClass} />

          {/* 4. EMAIL TEMPLATE MANAGER */}
          <EmailTemplateManager />

          {/* 5. VENDOR MANAGEMENT */}
          <div
            className={`${housekeepingCardClass} p-6 flex flex-col justify-between h-full min-h-[300px]`}
          >
            <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[linear-gradient(160deg,rgba(255,255,255,0.55)_0%,rgba(255,255,255,0.1)_35%,rgba(255,255,255,0)_70%)]" />

            <div className="flex flex-col h-full relative z-10">
              <div className="flex items-center gap-3 mb-4 shrink-0">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <FiBriefcase size={20} />
                </div>
                <h3 className="font-bold text-slate-800">Vendor Management</h3>
              </div>

              <p className="text-slate-500 text-xs mb-4 leading-relaxed shrink-0">
                Manage external CCA providers and their associated activities.
              </p>

              {/* VENDOR LIST SCROLL AREA */}
              <div className="flex-1 overflow-y-auto max-h-48 pr-2 custom-scrollbar mb-4 space-y-3">
                {vendors.length > 0 ? (
                  vendors.map((vendor) => (
                    <div
                      key={vendor.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-100 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-slate-700 text-sm">
                            {vendor.name}
                          </span>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {vendor.email || "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="mt-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                          Providing:
                        </p>
                        <div className="text-xs text-slate-600 leading-snug">
                          {vendor.associatedCCAs &&
                          vendor.associatedCCAs.length > 0 ? (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {vendor.associatedCCAs.map((c, idx) => (
                                <span
                                  key={`${vendor.id}_${c.id || c.name || idx}`}
                                  className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold border border-indigo-100"
                                >
                                  {c.name || "Unnamed CCA"}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="italic text-slate-400">
                              No CCAs assigned
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    No vendors found.
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0 pt-2 relative z-10">
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  onClick={handleExportVendorsCSV}
                  className="w-full py-2 px-3 bg-white border border-slate-200 hover:border-brand-primary hover:text-brand-primary text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <FiDownload /> Export CSV
                </button>
                <button
                  onClick={handleExportVendorsPDF}
                  className="w-full py-2 px-3 bg-white border border-slate-200 hover:border-brand-primary hover:text-brand-primary text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <FiDownload /> Export PDF
                </button>
              </div>
              <button
                onClick={() => setIsVendorModalOpen(true)}
                className="w-full py-2.5 px-4 bg-white border border-slate-200 hover:border-brand-primary hover:text-brand-primary text-slate-600 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <FiBriefcase /> Manage CCA Vendors
              </button>
            </div>
          </div>

          {/* 6. DEFAULTER CHECKER */}
          <div
            className={`${housekeepingCardClass} p-6 flex flex-col justify-between`}
          >
            <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[linear-gradient(160deg,rgba(255,255,255,0.55)_0%,rgba(255,255,255,0.1)_35%,rgba(255,255,255,0)_70%)]" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <FiSearch size={20} />
                </div>
                <h3 className="font-bold text-slate-800">
                  Check Missing Selections
                </h3>
              </div>

              <p className="text-slate-500 text-xs mb-4 leading-relaxed">
                Upload a student list (CSV) to identify who hasn't submitted
                yet.
                <br />
                <span className="opacity-70">
                  Required Headers: Name, Email, Class
                </span>
              </p>
            </div>

            <div className="space-y-3 relative z-10">
              <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className={`w-full py-2.5 px-4 rounded-xl text-sm font-bold border-2 border-dashed transition-all flex items-center justify-center gap-2 ${
                  uploadedStudents.length > 0
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "border-slate-200 text-slate-400 hover:border-indigo-200 hover:text-indigo-500"
                }`}
              >
                {uploadedStudents.length > 0 ? (
                  <>
                    <FiCheck /> {uploadedStudents.length} Students Loaded
                  </>
                ) : (
                  <>
                    <FiUploadCloud /> Upload CSV List
                  </>
                )}
              </button>

              <button
                onClick={handleFindMissing}
                disabled={uploadedStudents.length === 0}
                className="w-full py-2.5 px-4 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
              >
                <FiSearch /> Find Defaulters
              </button>
            </div>
          </div>

          {/* 7. DANGER ZONE */}
          <TermManager
            selections={selections}
            users={users}
            classMap={classMap}
          />
        </div>
      </div>

      {/* --- MODALS --- */}
      <MissingStudentsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        missingStudents={missingStudents}
      />

      <VendorManagerModal
        isOpen={isVendorModalOpen}
        onClose={() => setIsVendorModalOpen(false)}
      />
    </div>
  );
}
