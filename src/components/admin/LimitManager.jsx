import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { FiSave, FiCheck, FiSliders } from "react-icons/fi";

export default function LimitManager() {
  const [minCCAs, setMinCCAs] = useState(1);
  const [maxCCAs, setMaxCCAs] = useState(3);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

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
      alert("Minimum CCAs cannot be greater than Maximum CCAs");
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
      alert("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 flex items-center justify-center min-h-[200px] h-full">
        <span className="text-slate-400 font-medium">Loading limits...</span>
      </div>
    );
  }

  // Added h-full and flex flex-col
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 relative overflow-hidden h-full flex flex-col">
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
    </div>
  );
}
