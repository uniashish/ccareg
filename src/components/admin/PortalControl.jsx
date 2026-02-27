import React, { useState, useEffect } from "react";
import { FiPower } from "react-icons/fi";
import { db } from "../../firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import MessageModal from "../common/MessageModal";

export default function PortalControl({ housekeepingCardClass }) {
  const [isStudentPortalActive, setIsStudentPortalActive] = useState(true);
  const [isTeacherPortalActive, setIsTeacherPortalActive] = useState(true);
  const [isVendorPortalActive, setIsVendorPortalActive] = useState(true);
  const [isSavingStudentPortalState, setIsSavingStudentPortalState] =
    useState(false);
  const [isSavingTeacherPortalState, setIsSavingTeacherPortalState] =
    useState(false);
  const [isSavingVendorPortalState, setIsSavingVendorPortalState] =
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

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "general"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setIsStudentPortalActive(data.studentPortalActive !== false);
        setIsTeacherPortalActive(data.teacherPortalActive !== false);
        setIsVendorPortalActive(data.vendorPortalActive !== false);
      } else {
        setIsStudentPortalActive(true);
        setIsTeacherPortalActive(true);
        setIsVendorPortalActive(true);
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

  const handleToggleVendorPortal = async () => {
    if (isSavingVendorPortalState) return;

    setIsSavingVendorPortalState(true);
    try {
      await setDoc(
        doc(db, "settings", "general"),
        {
          vendorPortalActive: !isVendorPortalActive,
          updatedAt: new Date(),
        },
        { merge: true },
      );
    } catch (error) {
      console.error("Error updating vendor portal state:", error);
      showModal(
        "error",
        "Update Failed",
        "Failed to update vendor portal state.",
      );
    } finally {
      setIsSavingVendorPortalState(false);
    }
  };

  return (
    <>
      <div
        className={`${housekeepingCardClass} p-6 flex flex-col justify-between h-full min-h-[300px]`}
      >
        <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[linear-gradient(160deg,rgba(255,255,255,0.55)_0%,rgba(255,255,255,0.1)_35%,rgba(255,255,255,0)_70%)]" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <FiPower size={20} />
            </div>
            <h3 className="font-bold text-slate-800">Portal Controls</h3>
          </div>

          <p className="text-slate-500 text-xs mb-4 leading-relaxed">
            Turn student, teacher, and vendor portal access on or off.
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-sm font-bold text-slate-700">
                Student Portal
              </span>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-bold ${
                    isStudentPortalActive ? "text-green-600" : "text-slate-500"
                  }`}
                >
                  {isStudentPortalActive ? "ON" : "OFF"}
                </span>
                <button
                  onClick={handleToggleStudentPortal}
                  disabled={isSavingStudentPortalState}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all disabled:opacity-50 ${
                    isStudentPortalActive ? "bg-green-500" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isStudentPortalActive ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-sm font-bold text-slate-700">
                Teacher Portal
              </span>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-bold ${
                    isTeacherPortalActive ? "text-green-600" : "text-slate-500"
                  }`}
                >
                  {isTeacherPortalActive ? "ON" : "OFF"}
                </span>
                <button
                  onClick={handleToggleTeacherPortal}
                  disabled={isSavingTeacherPortalState}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all disabled:opacity-50 ${
                    isTeacherPortalActive ? "bg-green-500" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isTeacherPortalActive ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-sm font-bold text-slate-700">
                Vendor Portal
              </span>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-bold ${
                    isVendorPortalActive ? "text-green-600" : "text-slate-500"
                  }`}
                >
                  {isVendorPortalActive ? "ON" : "OFF"}
                </span>
                <button
                  onClick={handleToggleVendorPortal}
                  disabled={isSavingVendorPortalState}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all disabled:opacity-50 ${
                    isVendorPortalActive ? "bg-green-500" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isVendorPortalActive ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MessageModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
      />
    </>
  );
}
