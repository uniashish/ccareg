import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { FiSave, FiCheck, FiPhone, FiUser } from "react-icons/fi";

export default function AdminContactManager() {
  const [adminName, setAdminName] = useState("");
  const [adminContact, setAdminContact] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // --- FETCH EXISTING ADMIN SETTINGS ---
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "general");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          // Display existing details in text boxes
          if (data.adminName) setAdminName(data.adminName);
          if (data.adminContact) setAdminContact(data.adminContact);
        }
      } catch (error) {
        console.error("Error fetching contact settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMsg("");
    try {
      await setDoc(
        doc(db, "settings", "general"),
        {
          adminName: adminName,
          adminContact: adminContact,
          updatedAt: new Date(),
        },
        { merge: true },
      );

      setSuccessMsg("Details Saved!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 h-full flex items-center justify-center">
        <p className="text-slate-400 text-sm font-bold animate-pulse">
          Loading contact info...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
          <FiUser size={20} />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">Admin Contact</h3>
          <p className="text-slate-500 text-xs">Appears on student receipts</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Display Name
          </label>
          <div className="relative">
            <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="e.g. School Office"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Contact Details
          </label>
          <div className="relative">
            <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="e.g. cca@school.edu"
              value={adminContact}
              onChange={(e) => setAdminContact(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
            />
          </div>
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
              <FiSave /> Save Details
            </>
          )}
        </button>

        {successMsg && (
          <span className="text-green-600 text-sm font-bold flex items-center gap-1 animate-in fade-in slide-in-from-left-2">
            <FiCheck /> {successMsg}
          </span>
        )}
      </div>
    </div>
  );
}
