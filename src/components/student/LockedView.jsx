import React, { useEffect, useState } from "react";
import {
  FiLock,
  FiCheckCircle,
  FiHelpCircle,
  FiCreditCard,
  FiCopy,
  FiCalendar,
} from "react-icons/fi";
import { db } from "../../firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
// 1. Import the new component
import MessageModal from "../common/MessageModal";

export default function LockedView({ existingSelection }) {
  const [adminDetails, setAdminDetails] = useState({
    name: "Administrator",
    contact: "",
  });
  const [bankDetails, setBankDetails] = useState(null);
  const [enrichedCCAs, setEnrichedCCAs] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);

  // 2. Add State for the Modal
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // ... (Existing fetch logic remains exactly the same) ...
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

        // 2. Fetch Payment Details
        const bankRef = doc(db, "settings", "payments");
        const bankSnap = await getDoc(bankRef);
        if (bankSnap.exists()) {
          setBankDetails(bankSnap.data());
        }

        // 3. Fetch All CCAs
        const ccaCollection = collection(db, "ccas");
        const ccaSnapshot = await getDocs(ccaCollection);

        const ccaMap = {};
        const ccaList = [];
        ccaSnapshot.forEach((doc) => {
          const data = doc.data();
          ccaMap[doc.id] = data;
          ccaList.push({ id: doc.id, ...data });
        });

        // 4. Merge Selection
        if (existingSelection?.selectedCCAs) {
          const mergedData = existingSelection.selectedCCAs.map((selection) => {
            let fullDetails = ccaMap[selection.id];
            if (!fullDetails)
              fullDetails = ccaList.find((c) => c.name === selection.name);

            let scheduleStr = "TBA";
            if (fullDetails) {
              if (
                Array.isArray(fullDetails.days) &&
                fullDetails.days.length > 0
              ) {
                const shortDays = fullDetails.days.map((day) =>
                  day.slice(0, 3),
                );
                const daysJoined = shortDays.join(", ");
                const timeStr = fullDetails.startTime
                  ? ` @ ${fullDetails.startTime}`
                  : "";
                scheduleStr = `${daysJoined}${timeStr}`;
              } else if (fullDetails.startTime) {
                scheduleStr = `Time: ${fullDetails.startTime}`;
              } else if (fullDetails.schedule)
                scheduleStr = fullDetails.schedule;
              else if (fullDetails.timing) scheduleStr = fullDetails.timing;
            }

            if (scheduleStr === "TBA" && selection.schedule)
              scheduleStr = selection.schedule;

            const rawCost =
              fullDetails?.cost ?? fullDetails?.price ?? selection.cost ?? 0;
            const finalCost = Number(rawCost) || 0;

            return {
              ...selection,
              ...fullDetails,
              schedule: scheduleStr,
              cost: finalCost,
            };
          });

          setEnrichedCCAs(mergedData);
          const total = mergedData.reduce((sum, item) => sum + item.cost, 0);
          setTotalAmount(total);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [existingSelection]);

  // 3. Update the Copy Function to use the Modal
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);

    // Trigger the custom modal instead of alert()
    setModalState({
      isOpen: true,
      type: "success",
      title: "Copied!",
      message: "The account number has been copied to your clipboard.",
    });
  };

  return (
    <>
      <div className="mt-6 w-full max-w-5xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden animate-in zoom-in duration-500">
        {/* ... (Existing Layout Code - No changes needed here) ... */}

        <div className="flex flex-col md:flex-row items-stretch min-h-[500px]">
          {/* LEFT COLUMN */}
          <div className="w-full md:w-3/5 p-8 bg-slate-50/50 flex flex-col">
            <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
              Selected CCAs
            </h2>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {enrichedCCAs.map((cca, index) => (
                <div
                  key={index}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-brand-primary/30"
                >
                  <div className="flex-1">
                    <div className="font-bold text-slate-800 flex items-center gap-2 text-sm sm:text-base">
                      <FiCheckCircle className="text-brand-primary shrink-0" />
                      {cca.name}
                    </div>
                    <div className="flex items-center gap-2 mt-2 ml-6 text-xs text-slate-500 font-medium bg-slate-100 w-fit px-2 py-1 rounded-md">
                      <FiCalendar size={12} className="text-slate-400" />
                      <span className="uppercase tracking-wide line-clamp-1">
                        {cca.schedule}
                      </span>
                    </div>
                  </div>
                  <div className="text-right sm:text-right pl-6 sm:pl-0 shrink-0">
                    <span
                      className={`block text-sm font-bold font-mono ${cca.cost > 0 ? "text-slate-700" : "text-green-600"}`}
                    >
                      {cca.cost > 0
                        ? `Rp. ${cca.cost.toLocaleString()}`
                        : "Free"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200 flex justify-between items-center">
              <span className="font-bold text-slate-500 uppercase text-xs tracking-wider">
                Total Fee
              </span>
              <span className="font-black text-2xl text-brand-primary">
                Rp. {totalAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="w-full md:w-2/5 p-8 bg-white border-l border-slate-100 flex flex-col relative">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-slow">
                <FiLock size={30} />
              </div>
              <h1 className="text-2xl font-black text-slate-800">
                Selection Locked
              </h1>
              <p className="text-slate-500 text-xs mt-2 font-medium bg-slate-100 inline-block px-3 py-1 rounded-full">
                Submitted:{" "}
                {existingSelection?.timestamp?.toDate().toLocaleDateString()}
              </p>
            </div>

            {bankDetails && bankDetails.accountNumber && totalAmount > 0 ? (
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 mb-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-indigo-800 font-bold text-xs uppercase tracking-wider border-b border-indigo-100 pb-2">
                  <FiCreditCard /> Payment Details
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-indigo-400 text-xs font-bold uppercase">
                      Bank
                    </span>
                    <span className="font-bold text-indigo-900">
                      {bankDetails.bankName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-indigo-400 text-xs font-bold uppercase">
                      Name
                    </span>
                    <span className="font-bold text-indigo-900">
                      {bankDetails.accountName}
                    </span>
                  </div>
                  <div className="bg-white rounded-xl border border-indigo-100 p-2 pl-3 flex justify-between items-center mt-2 group hover:border-indigo-300 transition-colors">
                    <span className="font-mono font-bold text-indigo-600 text-lg tracking-tight">
                      {bankDetails.accountNumber}
                    </span>
                    <button
                      onClick={() => copyToClipboard(bankDetails.accountNumber)}
                      className="p-2 bg-indigo-50 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-lg transition-all active:scale-95"
                      title="Copy to Clipboard"
                    >
                      <FiCopy />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 mb-6 text-center">
                <FiCheckCircle
                  className="mx-auto text-emerald-500 mb-2"
                  size={24}
                />
                <span className="text-emerald-700 font-bold text-sm">
                  No Payment Required
                </span>
              </div>
            )}

            <div className="mt-auto pt-6 border-t border-slate-50 text-center">
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

      {/* 4. Render the Modal outside the main layout */}
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
