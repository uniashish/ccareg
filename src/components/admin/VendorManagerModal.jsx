import React, { useState, useEffect, useMemo } from "react";
import {
  FiX,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiBriefcase,
  FiUser,
  FiPhone,
  FiCreditCard,
  FiSave,
  FiArrowLeft,
  FiActivity,
  FiCheck,
  FiInfo,
  FiLock,
  FiAlertTriangle,
} from "react-icons/fi";
import { db } from "../../firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

// --- IMPORT CUSTOM MODAL ---
import MessageModal from "../common/MessageModal";

// --- SUB-COMPONENT: VENDOR DETAILS MODAL ---
function VendorDetailsModal({ vendor, onClose }) {
  if (!vendor) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      ></div>

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-primary via-purple-500 to-brand-primary"></div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <FiX />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl">
              <FiBriefcase />
            </div>
            <div>
              <h2 className="text-xl font-bold">{vendor.name}</h2>
              <p className="text-slate-400 text-xs uppercase tracking-wider font-bold">
                Vendor Details
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Contact Info */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
              Contact Information
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                <FiUser className="mt-1 text-brand-primary" />
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">
                    Contact Person
                  </p>
                  <p className="font-bold text-slate-700">
                    {vendor.contactPerson || "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                <FiPhone className="mt-1 text-brand-primary" />
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">
                    Phone Number
                  </p>
                  <p className="font-bold text-slate-700">
                    {vendor.contactNumber || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Activities */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
              Associated CCAs
            </h3>
            {vendor.associatedCCAs && vendor.associatedCCAs.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {vendor.associatedCCAs.map((cca, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-indigo-50 text-indigo-700 text-sm font-bold rounded-lg border border-indigo-100 flex items-center gap-2"
                  >
                    <FiActivity size={14} /> {cca.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 italic text-sm">No CCAs assigned.</p>
            )}
          </div>

          {/* Financial Info */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
              Bank Details
            </h3>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase">
                  Bank Name
                </span>
                <span className="font-bold text-slate-700">
                  {vendor.bankName || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase">
                  Account Number
                </span>
                <span className="font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {vendor.accountNumber || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase">
                  Account Name
                </span>
                <span className="font-bold text-slate-700 text-right">
                  {vendor.bankAccountName || "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-600 font-bold rounded-xl transition-colors shadow-sm"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}

// --- MAIN COMPONENT ---
export default function VendorManagerModal({ isOpen, onClose }) {
  // View State: 'list' | 'form'
  const [view, setView] = useState("list");

  // Data State
  const [vendors, setVendors] = useState([]);
  const [availableCCAs, setAvailableCCAs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Detail Modal State
  const [selectedVendor, setSelectedVendor] = useState(null);

  // Form State
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    contactNumber: "",
    bankName: "",
    bankAccountName: "",
    accountNumber: "",
    associatedCCAs: [],
  });

  // --- NEW: MESSAGE MODAL STATE ---
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });

  // --- DELETE CONFIRMATION STATE ---
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // --- 1. FETCH DATA (VENDORS & CCAs) ---
  useEffect(() => {
    if (!isOpen) return;

    // A. Fetch Vendors
    const unsubVendors = onSnapshot(collection(db, "vendors"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      data.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      setVendors(data);
      setIsLoading(false);
    });

    // B. Fetch CCAs
    const unsubCCAs = onSnapshot(collection(db, "ccas"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name || "Unnamed CCA",
      }));
      data.sort((a, b) => a.name.localeCompare(b.name));
      setAvailableCCAs(data);
    });

    return () => {
      unsubVendors();
      unsubCCAs();
    };
  }, [isOpen]);

  // --- 2. CONFLICT CHECK LOGIC ---
  const conflictingCCAs = useMemo(() => {
    const conflictMap = {};
    vendors.forEach((vendor) => {
      if (vendor.id === editingId) return;

      if (vendor.associatedCCAs && Array.isArray(vendor.associatedCCAs)) {
        vendor.associatedCCAs.forEach((cca) => {
          conflictMap[cca.id] = vendor.name;
        });
      }
    });
    return conflictMap;
  }, [vendors, editingId]);

  // --- 3. HELPER: SHOW MODAL ---
  const showMessage = (type, title, message) => {
    setModalState({ isOpen: true, type, title, message });
  };

  const closeMessage = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  // --- 4. HANDLERS ---
  const handleAddNew = () => {
    setEditingId(null);
    setFormData({
      name: "",
      contactPerson: "",
      contactNumber: "",
      bankName: "",
      bankAccountName: "",
      accountNumber: "",
      associatedCCAs: [],
    });
    setView("form");
  };

  const handleEdit = (vendor) => {
    setEditingId(vendor.id);
    setFormData({
      name: vendor.name || "",
      contactPerson: vendor.contactPerson || "",
      contactNumber: vendor.contactNumber || "",
      bankName: vendor.bankName || "",
      bankAccountName: vendor.bankAccountName || "",
      accountNumber: vendor.accountNumber || "",
      associatedCCAs: vendor.associatedCCAs || [],
    });
    setView("form");
  };

  // Step 1: Request Delete (Check Conditions)
  const handleDeleteRequest = (vendor) => {
    // UPDATED: Check if vendor has associated CCAs
    if (vendor.associatedCCAs && vendor.associatedCCAs.length > 0) {
      showMessage(
        "error",
        "Deletion Blocked",
        `You cannot delete "${vendor.name}" because it still has ${vendor.associatedCCAs.length} active CCA(s) allocated. Please remove the activities from this vendor first.`,
      );
      return;
    }

    setPendingDeleteId(vendor.id);
    setShowDeleteConfirm(true);
  };

  // Step 2: Confirm Delete (Execute Logic)
  const confirmDelete = async () => {
    if (!pendingDeleteId) return;

    try {
      await deleteDoc(doc(db, "vendors", pendingDeleteId));
      showMessage(
        "success",
        "Vendor Deleted",
        "The vendor has been successfully removed.",
      );
    } catch (error) {
      showMessage(
        "error",
        "Delete Failed",
        "Could not delete vendor: " + error.message,
      );
    } finally {
      setShowDeleteConfirm(false);
      setPendingDeleteId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, "vendors", editingId), {
          ...formData,
          updatedAt: serverTimestamp(),
        });
        showMessage(
          "success",
          "Success",
          "Vendor details updated successfully.",
        );
      } else {
        await addDoc(collection(db, "vendors"), {
          ...formData,
          createdAt: serverTimestamp(),
        });
        showMessage("success", "Success", "New vendor added successfully.");
      }
      setView("list");
    } catch (error) {
      showMessage("error", "Error", "Failed to save vendor: " + error.message);
    }
  };

  const toggleCCA = (cca) => {
    const exists = formData.associatedCCAs.find((c) => c.id === cca.id);
    if (exists) {
      setFormData((prev) => ({
        ...prev,
        associatedCCAs: prev.associatedCCAs.filter((c) => c.id !== cca.id),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        associatedCCAs: [
          ...prev.associatedCCAs,
          { id: cca.id, name: cca.name },
        ],
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        ></div>

        <div className="relative bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
          {/* HEADER */}
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-3xl">
            <div>
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <FiBriefcase className="text-brand-primary" />
                {view === "list"
                  ? "Manage CCA Vendors"
                  : editingId
                    ? "Edit Vendor"
                    : "Add New Vendor"}
              </h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-1">
                External Providers & Payments
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
            >
              <FiX size={20} />
            </button>
          </div>

          {/* CONTENT */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* --- VIEW: LIST --- */}
            {view === "list" && (
              <div className="space-y-6">
                <button
                  onClick={handleAddNew}
                  className="w-full py-4 border-2 border-dashed border-brand-primary text-brand-primary rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-primary/5 transition-all group"
                >
                  <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FiPlus size={18} />
                  </div>
                  Create New Vendor
                </button>

                <div className="space-y-3">
                  {isLoading ? (
                    <p className="text-center text-slate-400 italic py-8">
                      Loading vendors...
                    </p>
                  ) : vendors.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-slate-400 font-medium">
                        No vendors added yet.
                      </p>
                    </div>
                  ) : (
                    vendors.map((vendor) => (
                      <div
                        key={vendor.id}
                        className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:shadow-md transition-shadow group gap-4"
                      >
                        <div className="flex-1 min-w-0">
                          {/* UPDATED: Clickable Name Button */}
                          <button
                            onClick={() => setSelectedVendor(vendor)}
                            className="flex items-center gap-2 mb-1 group-hover:translate-x-1 transition-transform"
                          >
                            <h3 className="font-bold text-slate-800 truncate text-lg group-hover:text-brand-primary group-hover:underline decoration-2 underline-offset-2">
                              {vendor.name}
                            </h3>
                            <FiInfo
                              size={14}
                              className="text-slate-300 group-hover:text-brand-primary"
                            />
                          </button>

                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mb-2">
                            <span className="flex items-center gap-1">
                              <FiUser className="text-slate-400" />{" "}
                              {vendor.contactPerson || "N/A"}
                            </span>
                            <span className="flex items-center gap-1">
                              <FiPhone className="text-slate-400" />{" "}
                              {vendor.contactNumber || "N/A"}
                            </span>
                          </div>

                          {vendor.associatedCCAs &&
                            vendor.associatedCCAs.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {vendor.associatedCCAs.map((c, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold border border-indigo-100"
                                  >
                                    {c.name}
                                  </span>
                                ))}
                              </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-center">
                          <button
                            onClick={() => handleEdit(vendor)}
                            className="p-2 text-slate-400 hover:text-brand-primary hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <FiEdit2 size={16} />
                          </button>

                          {/* UPDATED: DELETE BUTTON CALLS NEW FUNCTION WITH VENDOR OBJECT */}
                          <button
                            onClick={() => handleDeleteRequest(vendor)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* --- VIEW: FORM --- */}
            {view === "form" && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
                    Company Details
                  </h4>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                      Vendor Name
                    </label>
                    <div className="relative">
                      <FiBriefcase className="absolute left-3 top-3 text-slate-400" />
                      <input
                        required
                        type="text"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all font-medium"
                        placeholder="e.g. Acme Sports Academy"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">
                        Contact Person
                      </label>
                      <div className="relative">
                        <FiUser className="absolute left-3 top-3 text-slate-400" />
                        <input
                          type="text"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none"
                          placeholder="e.g. John Doe"
                          value={formData.contactPerson}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              contactPerson: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">
                        Contact Number
                      </label>
                      <div className="relative">
                        <FiPhone className="absolute left-3 top-3 text-slate-400" />
                        <input
                          type="text"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none"
                          placeholder="e.g. +62 812..."
                          value={formData.contactNumber}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              contactNumber: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* CCA SELECTION */}
                <div className="space-y-4 pt-2">
                  <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-wider">
                      Associated Activities
                    </h4>
                    <span className="text-xs font-bold text-brand-primary bg-indigo-50 px-2 py-1 rounded">
                      {formData.associatedCCAs.length} Selected
                    </span>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 max-h-48 overflow-y-auto">
                    {availableCCAs.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {availableCCAs.map((cca) => {
                          const isSelected = formData.associatedCCAs.some(
                            (c) => c.id === cca.id,
                          );
                          const assignedToOther = conflictingCCAs[cca.id];
                          const isDisabled = !!assignedToOther;

                          return (
                            <button
                              key={cca.id}
                              type="button"
                              disabled={isDisabled}
                              onClick={() => toggleCCA(cca)}
                              className={`flex flex-col items-start px-3 py-2 rounded-lg text-sm font-bold transition-all border relative overflow-hidden ${
                                isDisabled
                                  ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-80"
                                  : isSelected
                                    ? "bg-white border-brand-primary text-brand-primary shadow-sm"
                                    : "border-transparent text-slate-500 hover:bg-white hover:shadow-sm"
                              }`}
                            >
                              <div className="flex w-full justify-between items-center">
                                <span className="truncate mr-2">
                                  {cca.name}
                                </span>
                                {isSelected && <FiCheck className="shrink-0" />}
                                {isDisabled && (
                                  <FiLock className="shrink-0 text-slate-300" />
                                )}
                              </div>

                              {isDisabled && (
                                <span className="text-[10px] font-normal text-red-400 mt-0.5 flex items-center gap-1">
                                  Assigned to: {assignedToOther}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-center text-slate-400 italic text-sm">
                        No CCAs found in database. Add CCAs first.
                      </p>
                    )}
                  </div>
                </div>

                {/* Bank Info */}
                <div className="space-y-4 pt-2">
                  <h4 className="text-sm font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
                    Financial Information
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">
                        Bank Name
                      </label>
                      <div className="relative">
                        <FiCreditCard className="absolute left-3 top-3 text-slate-400" />
                        <input
                          type="text"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none"
                          placeholder="e.g. BCA"
                          value={formData.bankName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              bankName: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">
                        Account Number
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none font-mono"
                        placeholder="e.g. 1234567890"
                        value={formData.accountNumber}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            accountNumber: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none"
                      placeholder="e.g. PT Acme Sports Indonesia"
                      value={formData.bankAccountName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          bankAccountName: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setView("list")}
                    className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <FiArrowLeft /> Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-brand-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-brand-primary/30 flex items-center justify-center gap-2"
                  >
                    <FiSave /> {editingId ? "Update Vendor" : "Save Vendor"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* RENDER DETAIL MODAL */}
      <VendorDetailsModal
        vendor={selectedVendor}
        onClose={() => setSelectedVendor(null)}
      />

      {/* RENDER MESSAGE MODAL (Success/Info/Error) */}
      <MessageModal
        isOpen={modalState.isOpen}
        onClose={closeMessage}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
      />

      {/* RENDER DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in"
            onClick={() => setShowDeleteConfirm(false)}
          ></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-5">
                <FiAlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">
                Delete Vendor?
              </h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6">
                Are you sure you want to delete this vendor? This action cannot
                be undone.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
