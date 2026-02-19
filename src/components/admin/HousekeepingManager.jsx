import React, { useMemo, useState, useRef, useEffect } from "react";
import Papa from "papaparse";
import {
  FiTool,
  FiSearch,
  FiUploadCloud,
  FiCheck,
  FiAlertCircle,
  FiBriefcase,
  FiPower,
} from "react-icons/fi";
import { db } from "../../firebase"; // Import db
import { collection, onSnapshot, doc, setDoc } from "firebase/firestore"; // Import Firestore hooks

// --- EXISTING IMPORTS ---
import LimitManager from "./LimitManager";
import TermManager from "./TermManager";
import AdminContactManager from "./AdminContactManager";
import EmailTemplateManager from "./EmailTemplateManager";
import MissingStudentsModal from "./MissingStudentsModal";
import MessageModal from "../common/MessageModal";

// --- IMPORT ---
import VendorManagerModal from "./VendorManagerModal";

export default function HousekeepingManager({
  selections,
  users,
  classesList,
}) {
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
  const [isStudentPortalActive, setIsStudentPortalActive] = useState(true);
  const [isTeacherPortalActive, setIsTeacherPortalActive] = useState(true);
  const [isSavingStudentPortalState, setIsSavingStudentPortalState] =
    useState(false);
  const [isSavingTeacherPortalState, setIsSavingTeacherPortalState] =
    useState(false);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });

  const showModal = (type, title, message) => {
    setModalConfig({
      isOpen: true,
      type,
      title,
      message,
    });
  };

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

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "general"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setIsStudentPortalActive(data.studentPortalActive !== false);
        setIsTeacherPortalActive(data.teacherPortalActive !== false);
      } else {
        setIsStudentPortalActive(true);
        setIsTeacherPortalActive(true);
      }
    });

    return () => unsub();
  }, []);

  const handleToggleStudentPortal = async () => {
    if (isSavingStudentPortalState) return;

    setIsSavingStudentPortalState(true);
    try {
      await setDoc(
        doc(db, "settings", "general"),
        {
          studentPortalActive: !isStudentPortalActive,
          updatedAt: new Date(),
        },
        { merge: true },
      );
    } catch (error) {
      console.error("Error updating student portal state:", error);
      showModal(
        "error",
        "Update Failed",
        "Failed to update student portal state.",
      );
    } finally {
      setIsSavingStudentPortalState(false);
    }
  };

  const handleToggleTeacherPortal = async () => {
    if (isSavingTeacherPortalState) return;

    setIsSavingTeacherPortalState(true);
    try {
      await setDoc(
        doc(db, "settings", "general"),
        {
          teacherPortalActive: !isTeacherPortalActive,
          updatedAt: new Date(),
        },
        { merge: true },
      );
    } catch (error) {
      console.error("Error updating teacher portal state:", error);
      showModal(
        "error",
        "Update Failed",
        "Failed to update teacher portal state.",
      );
    } finally {
      setIsSavingTeacherPortalState(false);
    }
  };

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

  return (
    <div className="w-full h-full">
      <div className="h-[75vh] overflow-y-auto pr-2 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. SELECTION LIMITS */}
          <LimitManager />

          {/* 2. ADMIN CONTACT */}
          <AdminContactManager />

          {/* 3. PORTAL CONTROL */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-between h-full min-h-[300px]">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <FiPower size={20} />
                </div>
                <h3 className="font-bold text-slate-800">Portal Controls</h3>
              </div>

              <p className="text-slate-500 text-xs mb-4 leading-relaxed">
                Turn student and teacher portal access on or off.
              </p>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-sm font-bold text-slate-700">
                    Student Portal
                  </span>
                  <div
                    className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                      isStudentPortalActive
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    <FiAlertCircle size={12} />
                    {isStudentPortalActive ? "ON" : "OFF"}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-sm font-bold text-slate-700">
                    Teacher Portal
                  </span>
                  <div
                    className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                      isTeacherPortalActive
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    <FiAlertCircle size={12} />
                    {isTeacherPortalActive ? "ON" : "OFF"}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleToggleStudentPortal}
                disabled={isSavingStudentPortalState}
                className="w-full py-2.5 px-4 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none transition-all"
              >
                {isSavingStudentPortalState
                  ? "Saving..."
                  : isStudentPortalActive
                    ? "Switch OFF Student"
                    : "Switch ON Student"}
              </button>

              <button
                onClick={handleToggleTeacherPortal}
                disabled={isSavingTeacherPortalState}
                className="w-full py-2.5 px-4 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none transition-all"
              >
                {isSavingTeacherPortalState
                  ? "Saving..."
                  : isTeacherPortalActive
                    ? "Switch OFF Teacher"
                    : "Switch ON Teacher"}
              </button>
            </div>
          </div>

          {/* 4. EMAIL TEMPLATE MANAGER */}
          <EmailTemplateManager />

          {/* 5. VENDOR MANAGEMENT */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-between h-full min-h-[300px]">
            <div className="flex flex-col h-full">
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
                        <span className="font-bold text-slate-700 text-sm">
                          {vendor.name}
                        </span>
                      </div>
                      <div className="mt-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                          Providing:
                        </p>
                        <p className="text-xs text-slate-600 leading-snug">
                          {vendor.associatedCCAs &&
                          vendor.associatedCCAs.length > 0 ? (
                            vendor.associatedCCAs.map((c) => c.name).join(", ")
                          ) : (
                            <span className="italic text-slate-400">
                              No CCAs assigned
                            </span>
                          )}
                        </p>
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

            <div className="shrink-0 pt-2">
              <button
                onClick={() => setIsVendorModalOpen(true)}
                className="w-full py-2.5 px-4 bg-white border border-slate-200 hover:border-brand-primary hover:text-brand-primary text-slate-600 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <FiBriefcase /> Manage CCA Vendors
              </button>
            </div>
          </div>

          {/* 6. DEFAULTER CHECKER */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div>
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

            <div className="space-y-3">
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

      <MessageModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
      />
    </div>
  );
}
