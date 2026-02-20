import React, { useState } from "react";
import { db } from "../../firebase";
import { collection, getDocs, writeBatch, doc } from "firebase/firestore";
import { FiTrash2, FiAlertOctagon, FiCheckCircle } from "react-icons/fi";
import DeleteAllModal from "./DeleteAllModal";
import { downloadSelectionsCSV } from "../../utils/csvExporter";
import MessageModal from "../common/MessageModal";

export default function TermManager({ selections, users, classMap }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [messageModal, setMessageModal] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });

  const handleStartNewTerm = async () => {
    setIsDeleting(true);
    try {
      // 1. BACKUP
      if (selections && selections.length > 0) {
        downloadSelectionsCSV(selections, users, classMap);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // 2. DELETE SELECTIONS
      const selectionsRef = collection(db, "selections");
      const snapshot = await getDocs(selectionsRef);

      const batchSize = 400;
      let batch = writeBatch(db);
      let count = 0;

      for (const docSnapshot of snapshot.docs) {
        batch.delete(doc(db, "selections", docSnapshot.id));
        count++;
        if (count >= batchSize) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
      }
      if (count > 0) await batch.commit();

      // 3. RESET CCAS
      const ccasRef = collection(db, "ccas");
      const ccasSnapshot = await getDocs(ccasRef);
      let ccaBatch = writeBatch(db);
      let ccaCount = 0;

      for (const ccaDoc of ccasSnapshot.docs) {
        ccaBatch.update(doc(db, "ccas", ccaDoc.id), { enrolledCount: 0 });
        ccaCount++;
        if (ccaCount >= batchSize) {
          await ccaBatch.commit();
          ccaBatch = writeBatch(db);
          ccaCount = 0;
        }
      }
      if (ccaCount > 0) await ccaBatch.commit();

      setSuccessMsg("Backup downloaded & New term started!");
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (error) {
      console.error("Error clearing term data:", error);
      setMessageModal({
        isOpen: true,
        type: "error",
        title: "Action Failed",
        message: "Failed to start new term. Please check console and retry.",
      });
    } finally {
      setIsDeleting(false);
      setIsModalOpen(false);
    }
  };

  // Added h-full and flex flex-col
  return (
    <>
      <div className="bg-[radial-gradient(circle_at_top_right,_#dbeafe_0%,_#fee2e2_100%)] rounded-3xl border border-slate-300 shadow-[0_18px_24px_-18px_rgba(15,23,42,0.55),0_8px_10px_-8px_rgba(15,23,42,0.3),0_1px_0_rgba(255,255,255,0.85)_inset] hover:shadow-[0_28px_38px_-20px_rgba(15,23,42,0.6),0_12px_16px_-10px_rgba(15,23,42,0.35),0_1px_0_rgba(255,255,255,0.9)_inset] [transform:perspective(1200px)_rotateX(2deg)] hover:[transform:perspective(1200px)_rotateX(4deg)_translateY(-4px)] transition-all duration-300 p-8 relative overflow-hidden h-full flex flex-col">
        <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[linear-gradient(160deg,rgba(255,255,255,0.55)_0%,rgba(255,255,255,0.1)_35%,rgba(255,255,255,0)_70%)]" />

        <div className="absolute top-0 right-0 p-8 opacity-5 text-red-500 pointer-events-none">
          <FiAlertOctagon size={120} />
        </div>

        <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2 relative z-10">
          <FiTrash2 className="text-red-500" />
          Start New Term
        </h2>
        <p className="text-sm text-slate-500 mb-6 max-w-lg leading-relaxed flex-1 relative z-10">
          This action will{" "}
          <strong className="text-red-600">
            automatically download a backup
          </strong>{" "}
          of current selections, then{" "}
          <strong className="text-red-600">
            permanently delete all student selections
          </strong>{" "}
          and reset seat counts.
        </p>

        <div className="flex items-center gap-4 mt-auto relative z-10">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-200 rounded-xl font-bold transition-all text-sm flex items-center gap-2 shadow-sm"
          >
            <FiAlertOctagon />
            Backup & Wipe Data
          </button>

          {successMsg && (
            <span className="text-green-600 text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
              <FiCheckCircle /> {successMsg}
            </span>
          )}
        </div>
      </div>

      <DeleteAllModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleStartNewTerm}
        isDeleting={isDeleting}
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
