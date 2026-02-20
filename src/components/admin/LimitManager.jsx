import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { FiSave, FiCheck, FiSliders } from "react-icons/fi";
import MessageModal from "../common/MessageModal";

export default function LimitManager() {
  const [minCCAs, setMinCCAs] = useState(1);
  const [maxCCAs, setMaxCCAs] = useState(3);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "general");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.minCCAs !== undefined) setMinCCAs(data.minCCAs);
          if (data.maxCCAs !== undefined) setMaxCCAs(data.maxCCAs);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (Number(minCCAs) > Number(maxCCAs)) {
      setModalConfig({
        isOpen: true,
        type: "info",
        title: "Invalid Limits",
        message: "Minimum CCAs cannot be greater than Maximum CCAs.",
      });
      return;
    }

    setIsSaving(true);
    setSuccessMsg("");

    try {
      await setDoc(
        doc(db, "settings", "general"),
        {
          minCCAs: Number(minCCAs),
          maxCCAs: Number(maxCCAs),
          updatedAt: new Date(),
        },
        { merge: true },
      );

      setSuccessMsg("Limits updated!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setModalConfig({
        isOpen: true,
        type: "error",
        title: "Save Failed",
        message: "Failed to save settings.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_right,_#dbeafe_0%,_#fee2e2_100%)] rounded-3xl border border-slate-300 shadow-[0_18px_24px_-18px_rgba(15,23,42,0.55),0_8px_10px_-8px_rgba(15,23,42,0.3),0_1px_0_rgba(255,255,255,0.85)_inset] p-8 flex items-center justify-center min-h-[200px] h-full">
        <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[linear-gradient(160deg,rgba(255,255,255,0.55)_0%,rgba(255,255,255,0.1)_35%,rgba(255,255,255,0)_70%)]" />
        <span className="relative z-10 text-slate-400 font-medium">
          Loading limits...
        </span>
      </div>
    );
  }

  // Added h-full and flex flex-col
  return (
    <div className="bg-[radial-gradient(circle_at_top_right,_#dbeafe_0%,_#fee2e2_100%)] rounded-3xl border border-slate-300 shadow-[0_18px_24px_-18px_rgba(15,23,42,0.55),0_8px_10px_-8px_rgba(15,23,42,0.3),0_1px_0_rgba(255,255,255,0.85)_inset] hover:shadow-[0_28px_38px_-20px_rgba(15,23,42,0.6),0_12px_16px_-10px_rgba(15,23,42,0.35),0_1px_0_rgba(255,255,255,0.9)_inset] [transform:perspective(1200px)_rotateX(2deg)] hover:[transform:perspective(1200px)_rotateX(4deg)_translateY(-4px)] transition-all duration-300 p-8 relative overflow-hidden h-full flex flex-col">
      <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[linear-gradient(160deg,rgba(255,255,255,0.55)_0%,rgba(255,255,255,0.1)_35%,rgba(255,255,255,0)_70%)]" />

      <div className="absolute top-0 right-0 p-6 opacity-5 text-indigo-500 pointer-events-none">
        <FiSliders size={100} />
      </div>

      <h2 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4 flex items-center gap-2">
        <FiSliders className="text-brand-primary" />
        CCA Selection Limits
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 flex-1">
        <div className="space-y-2 relative z-10">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
            Minimum Selections
          </label>
          <input
            type="number"
            min="0"
            max="10"
            value={minCCAs}
            onChange={(e) => setMinCCAs(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
          />
          <p className="text-xs text-slate-400">Min activities to choose.</p>
        </div>

        <div className="space-y-2 relative z-10">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
            Maximum Selections
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={maxCCAs}
            onChange={(e) => setMaxCCAs(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
          />
          <p className="text-xs text-slate-400">Max activities allowed.</p>
        </div>
      </div>

      <div className="flex items-center gap-4 relative z-10 mt-auto">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl font-bold shadow-lg shadow-brand-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            "Saving..."
          ) : (
            <>
              <FiSave /> Save Changes
            </>
          )}
        </button>

        {successMsg && (
          <span className="text-green-600 text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
            <FiCheck /> {successMsg}
          </span>
        )}
      </div>

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
