import React, { useState } from "react";
import { db } from "../../firebase";
import { collection, getDocs, writeBatch, doc } from "firebase/firestore";
import { FiTrash2, FiAlertOctagon, FiCheckCircle } from "react-icons/fi";
import DeleteAllModal from "./DeleteAllModal";
import { downloadSelectionsCSV } from "../../utils/csvExporter";

export default function TermManager({ selections, users, classMap }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

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
      alert("Failed. Check console.");
    } finally {
      setIsDeleting(false);
      setIsModalOpen(false);
    }
  };

  // Added h-full and flex flex-col
  return (
    <>
      <div className="bg-white rounded-3xl shadow-sm border border-red-100 p-8 relative overflow-hidden h-full flex flex-col">
        <div className="absolute top-0 right-0 p-8 opacity-5 text-red-500 pointer-events-none">
          <FiAlertOctagon size={120} />
        </div>

        <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
          <FiTrash2 className="text-red-500" />
          Start New Term
        </h2>
        <p className="text-sm text-slate-500 mb-6 max-w-lg leading-relaxed flex-1">
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

        <div className="flex items-center gap-4 mt-auto">
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
    </>
  );
}
