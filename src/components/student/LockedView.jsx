import React, { useEffect, useState } from "react";
import {
  FiCheckCircle,
  FiHelpCircle,
  FiCreditCard,
  FiCopy,
  FiCalendar,
  FiPlus,
  FiAlertCircle,
} from "react-icons/fi";
import { db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import MessageModal from "../common/MessageModal";

export default function LockedView({
  existingSelection,
  canSelectMore,
  onSelectMore,
}) {
  const [adminDetails, setAdminDetails] = useState({
    name: "Administrator",
    contact: "",
  });

  const [bankDetails, setBankDetails] = useState(null);
  const [isLoadingBank, setIsLoadingBank] = useState(true);
  const [enrichedCCAs, setEnrichedCCAs] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);

  const [modalState, setModalState] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  // Helper to safely parse fees
  const parseFee = (value) => {
    if (!value) return 0;
    const cleanString = String(value).replace(/[^0-9]/g, "");
    return Number(cleanString) || 0;
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingBank(true);
      try {
        // 1. Fetch Admin Details
        const adminRef = doc(db, "settings", "general");
        const adminSnap = await getDoc(adminRef);
        if (adminSnap.exists()) {
          const data = adminSnap.data();
          setAdminDetails({
            name: data.adminName || "Administrator",
            contact: data.adminContact || "",
          });
        }

        // 2. Fetch Bank Details
        const bankRef = doc(db, "settings", "bank");
        const bankSnap = await getDoc(bankRef);
        if (bankSnap.exists()) {
          setBankDetails(bankSnap.data());
        } else {
          setBankDetails(null);
        }

        // 3. Fetch CCA Details & Calculate Fees
        if (existingSelection?.selectedCCAs) {
          const ccaPromises = existingSelection.selectedCCAs.map(
            async (item) => {
              const ccaRef = doc(db, "ccas", item.id);
              const ccaSnap = await getDoc(ccaRef);

              if (ccaSnap.exists()) {
                const data = ccaSnap.data();
                const rawFee = data.fee || data.price || data.cost || 0;
                return {
                  ...item,
                  ...data,
                  fee: parseFee(rawFee),
                };
              }
              return { ...item, fee: 0 };
            },
          );

          const fullCCAs = await Promise.all(ccaPromises);
          setEnrichedCCAs(fullCCAs);

          const total = fullCCAs.reduce((sum, cca) => sum + cca.fee, 0);
          setTotalAmount(total);
        }
      } catch (error) {
        console.error("Error fetching details:", error);
      } finally {
        setIsLoadingBank(false);
      }
    };

    fetchData();
  }, [existingSelection]);

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setModalState({
      isOpen: true,
      type: "success",
      title: "Copied!",
      message: "Bank details copied to clipboard.",
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return new Date().toLocaleDateString();
    return new Date(timestamp.seconds * 1000).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* CHANGED: Increased max-width to allow side-by-side layout */}
        <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
          {/* HEADER */}
          <div className="bg-slate-900 text-white p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-primary via-purple-500 to-brand-primary"></div>
            <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-full mb-4 backdrop-blur-sm">
              <FiCheckCircle size={32} className="text-emerald-400" />
            </div>
            <h2 className="text-2xl font-black tracking-tight mb-2">
              Selection Confirmed
            </h2>
            <p className="text-slate-400 text-sm font-medium">
              Reference ID:{" "}
              <span className="font-mono text-slate-300">
                {existingSelection?.studentUid?.slice(0, 8).toUpperCase()}
              </span>
            </p>
          </div>

          <div className="p-8">
            {/* STUDENT INFO (Full Width) */}
            <div className="flex flex-col sm:flex-row justify-between items-center pb-8 border-b border-slate-100 gap-4 mb-8">
              <div className="text-center sm:text-left">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Student Name
                </p>
                <p className="text-lg font-bold text-slate-800">
                  {existingSelection?.studentName}
                </p>
              </div>
              <div className="text-center sm:text-right">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center justify-center sm:justify-end gap-1">
                  <FiCalendar /> Date
                </p>
                <p className="text-lg font-bold text-slate-800">
                  {formatDate(existingSelection?.timestamp)}
                </p>
              </div>
            </div>

            {/* NEW: TWO COLUMN GRID LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {/* --- LEFT COLUMN: ACTIVITIES & FEES --- */}
              <div className="flex flex-col h-full">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4">
                  Selection Summary
                </h3>

                {/* List */}
                <div className="space-y-4 flex-1">
                  {enrichedCCAs.map((cca, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-4 rounded-2xl bg-white border border-slate-200 shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-bold text-slate-700">{cca.name}</p>
                          {cca.venue && (
                            <p className="text-xs text-slate-400 font-medium">
                              {cca.venue}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="font-mono font-bold text-slate-600">
                        {cca.fee > 0
                          ? `Rp ${cca.fee.toLocaleString()}`
                          : "Free"}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Row */}
                {totalAmount > 0 && (
                  <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-100 border-dashed">
                    <span className="font-bold text-slate-500">Total Fees</span>
                    <span className="text-2xl font-black text-brand-primary">
                      Rp {totalAmount.toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Add More Button */}
                {canSelectMore && (
                  <div className="mt-6">
                    <button
                      onClick={onSelectMore}
                      className="w-full py-3 rounded-xl border-2 border-dashed border-brand-primary text-brand-primary font-bold hover:bg-brand-primary/5 transition-colors flex items-center justify-center gap-2"
                    >
                      <FiPlus size={18} /> Add Another Activity
                    </button>
                  </div>
                )}
              </div>

              {/* --- RIGHT COLUMN: BANK DETAILS --- */}
              <div className="h-full">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4">
                  Payment Information
                </h3>

                {totalAmount > 0 ? (
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 h-full flex flex-col justify-center">
                    {isLoadingBank ? (
                      <div className="text-center py-12 text-slate-400 text-sm italic animate-pulse">
                        Loading bank details...
                      </div>
                    ) : bankDetails ? (
                      <div className="space-y-6">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                          <FiCreditCard className="text-brand-primary size-5" />
                          <span>Bank Transfer Details</span>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-sm">
                          <div className="flex justify-between items-center group">
                            <span className="text-xs text-slate-400 font-bold uppercase">
                              Bank Name
                            </span>
                            <span className="font-bold text-slate-700">
                              {bankDetails.bankName || "Not Set"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center group">
                            <span className="text-xs text-slate-400 font-bold uppercase">
                              Account Number
                            </span>
                            <button
                              onClick={() =>
                                copyToClipboard(bankDetails.accountNumber)
                              }
                              className="flex items-center gap-2 font-mono font-bold text-slate-700 hover:text-brand-primary transition-colors bg-slate-50 px-2 py-1 rounded"
                            >
                              {bankDetails.accountNumber || "Not Set"}{" "}
                              <FiCopy />
                            </button>
                          </div>
                          <div className="flex justify-between items-center group">
                            <span className="text-xs text-slate-400 font-bold uppercase">
                              Account Name
                            </span>
                            <span className="font-bold text-slate-700 text-right">
                              {bankDetails.accountName || "Not Set"}
                            </span>
                          </div>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-100 text-yellow-800 text-xs p-4 rounded-xl leading-relaxed font-medium flex gap-3">
                          <FiAlertCircle className="shrink-0 text-lg mt-0.5" />
                          <p>
                            Please include the <strong>Student Name</strong> and{" "}
                            <strong>Reference ID</strong> in your transfer news
                            for faster verification.
                          </p>
                        </div>
                      </div>
                    ) : (
                      // Fallback if data is missing
                      <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                        <FiAlertCircle
                          size={32}
                          className="mb-3 text-slate-300"
                        />
                        <p className="font-bold text-sm">
                          Payment Details Unavailable
                        </p>
                        <p className="text-xs mt-1 max-w-[200px]">
                          Please contact the school office for payment
                          instructions.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  // NO PAYMENT REQUIRED CARD
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-8 text-center h-full flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                      <FiCheckCircle className="text-emerald-500" size={32} />
                    </div>
                    <h4 className="text-emerald-800 font-black text-lg mb-2">
                      All Set!
                    </h4>
                    <span className="text-emerald-700 font-medium text-sm">
                      No Payment Required for these activities.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* FOOTER */}
            <div className="mt-12 pt-8 border-t border-slate-50 text-center">
              {adminDetails.contact && (
                <div className="text-xs text-slate-400 space-y-1">
                  <p className="flex items-center justify-center gap-1">
                    <FiHelpCircle /> Need help? Contact:
                  </p>
                  <p className="font-bold text-slate-600">
                    {adminDetails.name}
                  </p>
                  <p className="text-brand-primary font-bold hover:underline cursor-pointer select-all">
                    {adminDetails.contact}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <MessageModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
      />
    </>
  );
}
