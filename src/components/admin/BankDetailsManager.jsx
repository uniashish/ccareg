import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { FiSave, FiCheck, FiCreditCard, FiDollarSign } from "react-icons/fi";

export default function BankDetailsManager() {
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Fetch existing payment settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "payments");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.bankName) setBankName(data.bankName);
          if (data.accountName) setAccountName(data.accountName);
          if (data.accountNumber) setAccountNumber(data.accountNumber);
        }
      } catch (error) {
        console.error("Error fetching payment settings:", error);
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
        doc(db, "settings", "payments"),
        {
          bankName,
          accountName,
          accountNumber,
          updatedAt: new Date(),
        },
        { merge: true },
      );

      setSuccessMsg("Payment details updated!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save payment details");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 flex items-center justify-center min-h-[200px] h-full">
        <span className="text-slate-400 font-medium">Loading details...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 relative overflow-hidden h-full flex flex-col">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 p-6 opacity-5 text-emerald-500 pointer-events-none">
        <FiDollarSign size={100} />
      </div>

      <h2 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4 flex items-center gap-2">
        <FiCreditCard className="text-brand-primary" />
        CCA Fee Payment Details
      </h2>

      <div className="space-y-5 mb-8 flex-1 relative z-10">
        {/* Bank Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Bank Name
          </label>
          <input
            type="text"
            placeholder="e.g. BCA, Mandiri"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
          />
        </div>

        {/* Account Number */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Account Number
          </label>
          <input
            type="text"
            placeholder="e.g. 123-456-7890"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all font-mono"
          />
        </div>

        {/* Account Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Account Holder Name
          </label>
          <input
            type="text"
            placeholder="e.g. Sekolah International"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
          />
        </div>
      </div>

      {/* Footer Actions */}
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
          <span className="text-green-600 text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
            <FiCheck /> {successMsg}
          </span>
        )}
      </div>
    </div>
  );
}
