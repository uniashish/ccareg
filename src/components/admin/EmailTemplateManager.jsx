import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { doc, getDoc, updateDoc, deleteField } from "firebase/firestore";
import { FiMail, FiPlus, FiEdit2, FiTrash2, FiCheck } from "react-icons/fi";
import EmailComposerModal from "./EmailComposerModal"; // <--- NEW IMPORT
import MessageModal from "../common/MessageModal";

export default function EmailTemplateManager() {
  const [hasTemplate, setHasTemplate] = useState(false);
  const [templateData, setTemplateData] = useState(null); // Store fetched data
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [messageModal, setMessageModal] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });

  // Modal State
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  // Function to fetch template status
  const checkTemplate = async () => {
    try {
      const docRef = doc(db, "settings", "emailTemplate");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && docSnap.data().body) {
        setHasTemplate(true);
        setTemplateData(docSnap.data()); // Save data to pass to modal
        setLastUpdated(docSnap.data().updatedAt?.toDate());
      } else {
        setHasTemplate(false);
        setTemplateData(null);
      }
    } catch (error) {
      console.error("Error checking template:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkTemplate();
  }, []);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete the email template?"))
      return;

    setIsDeleting(true);
    try {
      const docRef = doc(db, "settings", "emailTemplate");
      await updateDoc(docRef, {
        subject: deleteField(),
        body: deleteField(),
        updatedAt: deleteField(),
      });
      setHasTemplate(false);
      setTemplateData(null);
    } catch (error) {
      console.error("Error deleting template:", error);
      setMessageModal({
        isOpen: true,
        type: "error",
        title: "Delete Failed",
        message: "Failed to delete template.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_right,_#dbeafe_0%,_#fee2e2_100%)] rounded-3xl border border-slate-300 shadow-[0_18px_24px_-18px_rgba(15,23,42,0.55),0_8px_10px_-8px_rgba(15,23,42,0.3),0_1px_0_rgba(255,255,255,0.85)_inset] p-8 flex items-center justify-center min-h-[200px] h-full">
        <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[linear-gradient(160deg,rgba(255,255,255,0.55)_0%,rgba(255,255,255,0.1)_35%,rgba(255,255,255,0)_70%)]" />
        <span className="relative z-10 text-slate-400 font-medium">
          Checking templates...
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="bg-[radial-gradient(circle_at_top_right,_#dbeafe_0%,_#fee2e2_100%)] rounded-3xl border border-slate-300 shadow-[0_18px_24px_-18px_rgba(15,23,42,0.55),0_8px_10px_-8px_rgba(15,23,42,0.3),0_1px_0_rgba(255,255,255,0.85)_inset] hover:shadow-[0_28px_38px_-20px_rgba(15,23,42,0.6),0_12px_16px_-10px_rgba(15,23,42,0.35),0_1px_0_rgba(255,255,255,0.9)_inset] [transform:perspective(1200px)_rotateX(2deg)] hover:[transform:perspective(1200px)_rotateX(4deg)_translateY(-4px)] transition-all duration-300 p-8 relative overflow-hidden h-full flex flex-col">
        <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[linear-gradient(160deg,rgba(255,255,255,0.55)_0%,rgba(255,255,255,0.1)_35%,rgba(255,255,255,0)_70%)]" />

        <div className="absolute top-0 right-0 p-6 opacity-5 text-indigo-500 pointer-events-none">
          <FiMail size={100} />
        </div>

        <h2 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4 flex items-center gap-2 relative z-10">
          <FiMail className="text-brand-primary" />
          Email Confirmation
        </h2>

        <p className="text-xs text-slate-500 mb-6 relative z-10">
          Configure the automated email sent to students after they lock their
          selections.
        </p>

        <div className="flex-1 flex flex-col justify-center relative z-10">
          {hasTemplate ? (
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-4 animate-in fade-in">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                  <FiCheck size={14} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-700 text-sm">
                    Template Active
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Last updated:{" "}
                    {lastUpdated
                      ? lastUpdated.toLocaleDateString()
                      : "Recently"}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setIsComposerOpen(true)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:text-brand-primary hover:border-brand-primary transition-all shadow-sm"
                >
                  <FiEdit2 /> Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-red-100 rounded-lg text-xs font-bold text-red-500 hover:bg-red-50 hover:border-red-200 transition-all shadow-sm"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsComposerOpen(true)}
              className="w-full h-32 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:border-brand-primary hover:text-brand-primary hover:bg-slate-50 transition-all group gap-2"
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
                <FiPlus size={20} />
              </div>
              <span className="font-bold text-sm">Create Email Template</span>
            </button>
          )}
        </div>

        <div className="mt-auto pt-4 text-[10px] text-slate-400 text-center relative z-10">
          {hasTemplate
            ? "Students will receive this email upon submission."
            : "No email is currently being sent."}
        </div>
      </div>

      {/* POPUP MODAL */}
      <EmailComposerModal
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        initialData={templateData}
        onSaveSuccess={checkTemplate}
      />

      <MessageModal
        isOpen={messageModal.isOpen}
        onClose={() =>
          setMessageModal((prev) => ({
            ...prev,
            isOpen: false,
          }))
        }
        type={messageModal.type}
        title={messageModal.title}
        message={messageModal.message}
      />
    </>
  );
}
