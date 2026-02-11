import React, { useEffect, useState, useMemo } from "react";
import {
  FiCheckCircle,
  FiHelpCircle,
  FiCreditCard,
  FiCopy,
  FiCalendar,
  FiPlus,
  FiAlertCircle,
  FiBriefcase,
  FiUser, // Used for Teacher Icon
} from "react-icons/fi";
import { db } from "../../firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import MessageModal from "../common/MessageModal";

export default function LockedView({
  existingSelection,
  canSelectMore,
  onSelectMore,
  classes = [],
}) {
  const [adminDetails, setAdminDetails] = useState({
    name: "Administrator",
    contact: "",
  });

  const [vendors, setVendors] = useState([]);
  const [enrichedCCAs, setEnrichedCCAs] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [modalState, setModalState] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  // Logic to resolve Class Name from ID
  const displayClassName = useMemo(() => {
    const matchedClass = classes.find(
      (c) => c.id === existingSelection?.classId,
    );
    return matchedClass ? matchedClass.name : existingSelection?.classId || "";
  }, [classes, existingSelection]);

  // Helper to safely parse fees
  const parseFee = (value) => {
    if (!value) return 0;
    const cleanString = String(value).replace(/[^0-9]/g, "");
    return Number(cleanString) || 0;
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
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

        // 2. Fetch All Vendors (to match CCAs to their owners for Payment Grouping)
        const vendorsRef = collection(db, "vendors");
        const vendorsSnap = await getDocs(vendorsRef);
        const vendorsData = vendorsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setVendors(vendorsData);

        // 3. Fetch CCA Details & Calculate Fees
        if (existingSelection?.selectedCCAs) {
          const ccaPromises = existingSelection.selectedCCAs.map(
            async (item) => {
              const ccaRef = doc(db, "ccas", item.id);
              const ccaSnap = await getDoc(ccaRef);

              if (ccaSnap.exists()) {
                const data = ccaSnap.data();
                const rawFee = data.fee || data.price || data.cost || 0;

                // Find the vendor for this CCA (needed for payment logic)
                const vendor = vendorsData.find((v) =>
                  v.associatedCCAs?.some((ac) => ac.id === item.id),
                );

                return {
                  ...item,
                  ...data,
                  fee: parseFee(rawFee),
                  vendorName: vendor?.name || "School/Unknown",
                  vendorId: vendor?.id || "unknown",
                };
              }
              return { ...item, fee: 0, vendorName: "Unknown" };
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
        setIsLoading(false);
      }
    };

    fetchData();
  }, [existingSelection]);

  // --- GROUPING LOGIC ---
  // Group CCAs by Vendor ID to display specific bank details for each group
  const paymentGroups = useMemo(() => {
    const groups = {};

    enrichedCCAs.forEach((cca) => {
      // Only group paid activities
      if (cca.fee > 0) {
        // Find the full vendor object
        const vendor = vendors.find((v) =>
          v.associatedCCAs?.some((ac) => ac.id === cca.id),
        );

        const vendorId = vendor ? vendor.id : "school_default";

        if (!groups[vendorId]) {
          groups[vendorId] = {
            vendorInfo: vendor || null, // Null implies fallback/school
            ccas: [],
            subtotal: 0,
          };
        }

        groups[vendorId].ccas.push(cca);
        groups[vendorId].subtotal += cca.fee;
      }
    });

    return Object.values(groups);
  }, [enrichedCCAs, vendors]);

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

  // Helper to format individual session dates
  const formatSessionDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  // Logic to determine if "Add More" button should show
  const currentCount = existingSelection?.selectedCCAs?.length || 0;
  const showAddMoreButton = canSelectMore && currentCount < 3;

  return (
    <>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
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
            {/* STUDENT INFO */}
            <div className="flex flex-col sm:flex-row justify-between items-center pb-8 border-b border-slate-100 gap-4 mb-8">
              <div className="text-center sm:text-left">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Student Name
                </p>
                <p className="text-lg font-bold text-slate-800">
                  {existingSelection?.studentName} ({displayClassName})
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

            {/* TWO COLUMN GRID LAYOUT */}
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
                      className="flex flex-col p-4 rounded-2xl bg-white border border-slate-200 shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 font-bold shrink-0">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-bold text-slate-700">
                              {cca.name}
                            </p>
                            <div className="flex flex-col sm:flex-row sm:gap-3 text-xs text-slate-400 font-medium">
                              {cca.venue && <span>{cca.venue}</span>}

                              {/* CHANGED: REPLACED VENDOR WITH TEACHER NAME */}
                              {cca.teacher && (
                                <span className="text-indigo-500 font-bold flex items-center gap-1">
                                  <FiUser size={10} /> {cca.teacher}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="font-mono font-bold text-slate-600">
                          {cca.fee > 0
                            ? `Rp ${cca.fee.toLocaleString()}`
                            : "Free"}
                        </div>
                      </div>

                      {/* SESSION DATES DISPLAY */}
                      {cca.sessionDates && cca.sessionDates.length > 0 && (
                        <div className="mt-2 pl-[3.5rem] pt-3 border-t border-slate-100 border-dashed">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <FiCalendar size={10} /> Session Schedule (
                            {cca.sessionDates.length})
                          </p>
                          {/* CHANGED: DARKER TEXT COLOR AND SLIGHTLY LARGER FONT */}
                          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar pr-1">
                            {cca.sessionDates.sort().map((dateStr, idx) => (
                              <span
                                key={idx}
                                className="text-xs font-bold px-2 py-1 bg-slate-100 border border-slate-200 rounded text-slate-800 whitespace-nowrap"
                              >
                                {formatSessionDate(dateStr)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
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

                {/* Add More Button - SHOWN ONLY IF < 3 SELECTIONS */}
                {showAddMoreButton && (
                  <div className="mt-6">
                    <button
                      onClick={onSelectMore}
                      className="w-full py-3 rounded-xl border-2 border-dashed border-brand-primary text-brand-primary font-bold hover:bg-brand-primary/5 transition-colors flex items-center justify-center gap-2"
                    >
                      <FiPlus size={18} /> Add Another Activity (
                      {3 - currentCount} remaining)
                    </button>
                  </div>
                )}
              </div>

              {/* --- RIGHT COLUMN: VENDOR PAYMENT DETAILS --- */}
              <div className="h-full">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4">
                  Payment Instructions
                </h3>

                {totalAmount > 0 ? (
                  <div className="space-y-6">
                    {isLoading ? (
                      <div className="bg-slate-50 rounded-2xl p-12 text-center text-slate-400 italic animate-pulse">
                        Loading vendor details...
                      </div>
                    ) : paymentGroups.length > 0 ? (
                      paymentGroups.map((group, idx) => {
                        const vendor = group.vendorInfo;
                        return (
                          <div
                            key={idx}
                            className="bg-slate-50 rounded-2xl p-6 border border-slate-200"
                          >
                            {/* Vendor Header */}
                            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200 border-dashed">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                  <FiBriefcase />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-400 uppercase">
                                    Pay To
                                  </p>
                                  <p className="font-bold text-slate-800">
                                    {vendor ? vendor.name : "School Office"}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-bold text-slate-400 uppercase">
                                  Amount
                                </p>
                                <p className="font-black text-brand-primary">
                                  Rp {group.subtotal.toLocaleString()}
                                </p>
                              </div>
                            </div>

                            {/* CCAs in this group */}
                            <div className="mb-4">
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">
                                For Activities:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {group.ccas.map((c) => (
                                  <span
                                    key={c.id}
                                    className="text-xs font-bold px-2 py-1 bg-white border border-slate-200 rounded text-slate-600"
                                  >
                                    {c.name}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Bank Details Card */}
                            {vendor ? (
                              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-sm">
                                <div className="flex justify-between items-center group">
                                  <span className="text-xs text-slate-400 font-bold uppercase">
                                    Bank Name
                                  </span>
                                  <span className="font-bold text-slate-700">
                                    {vendor.bankName || "Not Set"}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center group">
                                  <span className="text-xs text-slate-400 font-bold uppercase">
                                    Account Number
                                  </span>
                                  <button
                                    onClick={() =>
                                      copyToClipboard(vendor.accountNumber)
                                    }
                                    className="flex items-center gap-2 font-mono font-bold text-slate-700 hover:text-brand-primary transition-colors bg-slate-50 px-2 py-1 rounded"
                                  >
                                    {vendor.accountNumber || "Not Set"}{" "}
                                    <FiCopy />
                                  </button>
                                </div>
                                <div className="flex justify-between items-center group">
                                  <span className="text-xs text-slate-400 font-bold uppercase">
                                    Account Name
                                  </span>
                                  <span className="font-bold text-slate-700 text-right">
                                    {vendor.bankAccountName || "Not Set"}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              // Fallback if no vendor associated (or orphaned data)
                              <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 text-center">
                                <FiAlertCircle className="mx-auto text-yellow-500 mb-2" />
                                <p className="text-xs text-yellow-800 font-medium">
                                  Bank details not found for this provider.
                                  Please contact the school office.
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      // This shouldn't theoretically happen if totalAmount > 0, but as a safe fallback:
                      <div className="text-center py-8 text-slate-400 text-sm">
                        No payment details available.
                      </div>
                    )}

                    <div className="bg-yellow-50 border border-yellow-100 text-yellow-800 text-xs p-4 rounded-xl leading-relaxed font-medium flex gap-3">
                      <FiAlertCircle className="shrink-0 text-lg mt-0.5" />
                      <p>
                        Please perform separate transfers for different vendors.
                        Include <strong>Student Name</strong> and{" "}
                        <strong>Ref ID</strong> in transfer news.
                      </p>
                    </div>
                  </div>
                ) : (
                  // NO PAYMENT REQUIRED CARD
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-8 text-center h-full flex flex-col items-center justify-center min-h-[300px]">
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
            {/* CHANGED: INCREASED SIZE OF CONTACT DETAILS */}
            <div className="mt-12 pt-8 border-t border-slate-50 text-center">
              {adminDetails.contact && (
                <div className="space-y-2">
                  <p className="flex items-center justify-center gap-1 text-slate-400 text-sm font-medium">
                    <FiHelpCircle /> Need help? Contact:
                  </p>
                  <div className="flex flex-col items-center">
                    <p className="font-bold text-slate-700 text-lg">
                      {adminDetails.name}
                    </p>
                    <p className="text-brand-primary font-bold text-lg hover:underline cursor-pointer select-all">
                      {adminDetails.contact}
                    </p>
                  </div>
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
