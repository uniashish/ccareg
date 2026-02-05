import React, { useMemo, useState, useRef } from "react";
import Papa from "papaparse"; // <--- 1. IMPORT PARSER
import {
  FiTool,
  FiSearch,
  FiUploadCloud,
  FiCheck,
  FiAlertCircle,
} from "react-icons/fi";

// --- EXISTING IMPORTS ---
import LimitManager from "./LimitManager";
import TermManager from "./TermManager";
import AdminContactManager from "./AdminContactManager";
import EmailTemplateManager from "./EmailTemplateManager";
import BankDetailsManager from "./BankDetailsManager";

// --- NEW IMPORT ---
import MissingStudentsModal from "./MissingStudentsModal";

export default function HousekeepingManager({
  selections,
  users,
  classesList,
}) {
  // --- EXISTING MEMO ---
  const classMap = useMemo(() => {
    return (classesList || []).reduce((acc, cls) => {
      acc[cls.id] = cls;
      return acc;
    }, {});
  }, [classesList]);

  // --- NEW STATE FOR DEFAULTER CHECK ---
  const [uploadedStudents, setUploadedStudents] = useState([]);
  const [missingStudents, setMissingStudents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef(null);

  // --- NEW LOGIC: HANDLE CSV UPLOAD ---
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true, // Expects headers: Name, Email, Class
      skipEmptyLines: true,
      complete: (results) => {
        // Normalize keys (handle case sensitivity)
        const cleanData = results.data.map((row) => {
          const getKey = (key) =>
            Object.keys(row).find((k) => k.toLowerCase() === key.toLowerCase());

          return {
            name: row[getKey("name")] || "Unknown",
            email: (row[getKey("email")] || "").trim().toLowerCase(),
            class: row[getKey("class")] || "Unknown",
          };
        });

        // Filter valid rows
        const validData = cleanData.filter(
          (r) => r.email && r.email.length > 0,
        );
        setUploadedStudents(validData);
      },
    });
  };

  // --- NEW LOGIC: COMPARE LISTS ---
  const handleFindMissing = () => {
    if (uploadedStudents.length === 0) return;

    // 1. Get emails that have ALREADY submitted (from selections prop)
    const submittedEmails = new Set(
      selections.map((s) => (s.studentEmail || "").toLowerCase()),
    );

    // 2. Filter uploaded list to find who is NOT in submitted set
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

          {/* 3. EMAIL TEMPLATE MANAGER */}
          <EmailTemplateManager />

          {/* 4. BANK DETAILS MANAGER */}
          <BankDetailsManager />

          {/* --- 5. NEW CARD: DEFAULTER CHECKER --- */}
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

              {/* Button A: Upload */}
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

              {/* Button B: Search */}
              <button
                onClick={handleFindMissing}
                disabled={uploadedStudents.length === 0}
                className="w-full py-2.5 px-4 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
              >
                <FiSearch /> Find Defaulters
              </button>
            </div>
          </div>

          {/* 6. DANGER ZONE (Existing) */}
          <TermManager
            selections={selections}
            users={users}
            classMap={classMap}
          />
        </div>
      </div>

      {/* --- RENDER NEW MODAL --- */}
      <MissingStudentsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        missingStudents={missingStudents}
      />
    </div>
  );
}
