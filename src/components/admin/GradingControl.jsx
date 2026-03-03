import React, { useState, useEffect } from "react";
import {
  FiAward,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiX,
} from "react-icons/fi";
import { db } from "../../firebase";
import {
  doc,
  setDoc,
  onSnapshot,
  collection,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import MessageModal from "../common/MessageModal";

export default function GradingControl({ housekeepingCardClass }) {
  const [isGradingEnabled, setIsGradingEnabled] = useState(false);
  const [grades, setGrades] = useState([]);
  const [newGradeText, setNewGradeText] = useState("");
  const [editingGradeId, setEditingGradeId] = useState(null);
  const [editingGradeText, setEditingGradeText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    mode: "info",
    onConfirm: null,
    onCancel: null,
    confirmText: "Confirm",
    cancelText: "Cancel",
  });

  const showModal = (type, title, message, extra = {}) => {
    setModalConfig({
      isOpen: true,
      type,
      title,
      message,
      mode: "info",
      onConfirm: null,
      onCancel: null,
      confirmText: "Confirm",
      cancelText: "Cancel",
      ...extra,
    });
  };

  const handleDeleteAllStudentGrades = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      const selectionsSnapshot = await getDocs(collection(db, "selections"));

      if (selectionsSnapshot.empty) {
        showModal("info", "No Selections", "No student selections found.");
        return;
      }

      let batch = writeBatch(db);
      let operationCount = 0;
      let updatedDocuments = 0;
      let cleanedCcaItems = 0;

      for (const selectionDoc of selectionsSnapshot.docs) {
        const selectionData = selectionDoc.data() || {};
        const selectedCCAs = Array.isArray(selectionData.selectedCCAs)
          ? selectionData.selectedCCAs
          : [];

        let hasChanges = false;

        const cleanedSelectedCCAs = selectedCCAs.map((cca) => {
          if (!cca || typeof cca !== "object") return cca;

          const hasGradeField = Object.prototype.hasOwnProperty.call(
            cca,
            "grade",
          );
          const hasGradeUpdatedAtField = Object.prototype.hasOwnProperty.call(
            cca,
            "gradeUpdatedAt",
          );

          if (!hasGradeField && !hasGradeUpdatedAtField) {
            return cca;
          }

          hasChanges = true;
          cleanedCcaItems += 1;

          const cleanedCca = { ...cca };
          delete cleanedCca.grade;
          delete cleanedCca.gradeUpdatedAt;
          return cleanedCca;
        });

        if (!hasChanges) {
          continue;
        }

        batch.update(selectionDoc.ref, {
          selectedCCAs: cleanedSelectedCCAs,
        });
        operationCount += 1;
        updatedDocuments += 1;

        if (operationCount >= 450) {
          await batch.commit();
          batch = writeBatch(db);
          operationCount = 0;
        }
      }

      if (operationCount > 0) {
        await batch.commit();
      }

      showModal(
        "success",
        "Student Grades Deleted",
        `Deleted grades from ${cleanedCcaItems} CCA entries across ${updatedDocuments} student selections.`,
      );
    } catch (error) {
      console.error("Error deleting all student grades:", error);
      showModal(
        "error",
        "Delete Failed",
        "Failed to delete student grades. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDeleteAllStudentGrades = () => {
    showModal(
      "error",
      "Delete All Student Grades?",
      "This will permanently remove all grade values from every student's CCA selections. This action cannot be undone.",
      {
        mode: "confirm",
        confirmText: "Delete All",
        cancelText: "Cancel",
        onConfirm: () => {
          setModalConfig((prev) => ({ ...prev, isOpen: false }));
          handleDeleteAllStudentGrades();
        },
        onCancel: () => setModalConfig((prev) => ({ ...prev, isOpen: false })),
      },
    );
  };

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "grading"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setIsGradingEnabled(data.enabled !== false);
        setGrades(data.grades || []);
      } else {
        setIsGradingEnabled(false);
        setGrades([]);
      }
    });

    return () => unsub();
  }, []);

  const handleToggleGrading = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      await setDoc(
        doc(db, "settings", "grading"),
        {
          enabled: !isGradingEnabled,
          updatedAt: new Date(),
        },
        { merge: true },
      );
    } catch (error) {
      console.error("Error updating grading state:", error);
      showModal("error", "Update Failed", "Failed to update grading state.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddGrade = async () => {
    const trimmedGrade = newGradeText.trim();

    if (!trimmedGrade) {
      showModal("error", "Invalid Grade", "Grade cannot be empty.");
      return;
    }

    if (
      grades.some((g) => g.text.toLowerCase() === trimmedGrade.toLowerCase())
    ) {
      showModal("error", "Duplicate Grade", "This grade already exists.");
      return;
    }

    setIsSaving(true);
    try {
      const newGrade = {
        id: Date.now().toString(),
        text: trimmedGrade,
        createdAt: new Date(),
      };

      const updatedGrades = [...grades, newGrade];

      await setDoc(
        doc(db, "settings", "grading"),
        {
          grades: updatedGrades,
          updatedAt: new Date(),
        },
        { merge: true },
      );

      setNewGradeText("");
      showModal(
        "success",
        "Grade Added",
        `Grade "${trimmedGrade}" has been added successfully.`,
      );
    } catch (error) {
      console.error("Error adding grade:", error);
      showModal("error", "Add Failed", "Failed to add grade.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEdit = (grade) => {
    setEditingGradeId(grade.id);
    setEditingGradeText(grade.text);
  };

  const handleCancelEdit = () => {
    setEditingGradeId(null);
    setEditingGradeText("");
  };

  const handleSaveEdit = async (gradeId) => {
    const trimmedGrade = editingGradeText.trim();

    if (!trimmedGrade) {
      showModal("error", "Invalid Grade", "Grade cannot be empty.");
      return;
    }

    if (
      grades.some(
        (g) =>
          g.id !== gradeId &&
          g.text.toLowerCase() === trimmedGrade.toLowerCase(),
      )
    ) {
      showModal("error", "Duplicate Grade", "This grade already exists.");
      return;
    }

    setIsSaving(true);
    try {
      const updatedGrades = grades.map((g) =>
        g.id === gradeId
          ? { ...g, text: trimmedGrade, updatedAt: new Date() }
          : g,
      );

      await setDoc(
        doc(db, "settings", "grading"),
        {
          grades: updatedGrades,
          updatedAt: new Date(),
        },
        { merge: true },
      );

      setEditingGradeId(null);
      setEditingGradeText("");
      showModal(
        "success",
        "Grade Updated",
        "Grade has been updated successfully.",
      );
    } catch (error) {
      console.error("Error updating grade:", error);
      showModal("error", "Update Failed", "Failed to update grade.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGrade = async (gradeId) => {
    setIsSaving(true);
    try {
      const updatedGrades = grades.filter((g) => g.id !== gradeId);

      await setDoc(
        doc(db, "settings", "grading"),
        {
          grades: updatedGrades,
          updatedAt: new Date(),
        },
        { merge: true },
      );

      showModal(
        "success",
        "Grade Deleted",
        "Grade has been deleted successfully.",
      );
    } catch (error) {
      console.error("Error deleting grade:", error);
      showModal("error", "Delete Failed", "Failed to delete grade.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div
        className={`${housekeepingCardClass} p-6 flex flex-col justify-between h-full min-h-[300px]`}
      >
        <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[linear-gradient(160deg,rgba(255,255,255,0.55)_0%,rgba(255,255,255,0.1)_35%,rgba(255,255,255,0)_70%)]" />

        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <FiAward size={20} />
            </div>
            <h3 className="font-bold text-slate-800">Grading Control</h3>
          </div>

          <p className="text-slate-500 text-xs mb-4 leading-relaxed">
            Enable student grading and manage available grade options.
          </p>

          {/* Toggle Grading */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 mb-4">
            <span className="text-sm font-bold text-slate-700">
              Grading System
            </span>
            <div className="flex items-center gap-3">
              <span
                className={`text-xs font-bold ${
                  isGradingEnabled ? "text-emerald-600" : "text-slate-400"
                }`}
              >
                {isGradingEnabled ? "ENABLED" : "DISABLED"}
              </span>
              <button
                onClick={handleToggleGrading}
                disabled={isSaving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isGradingEnabled ? "bg-emerald-500" : "bg-slate-300"
                } ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isGradingEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Add Grade Section */}
          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-600 mb-2">
              Add New Grade
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newGradeText}
                onChange={(e) => setNewGradeText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !isSaving) {
                    handleAddGrade();
                  }
                }}
                placeholder="e.g., A+, Excellent, Pass"
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                disabled={isSaving}
              />
              <button
                onClick={handleAddGrade}
                disabled={isSaving || !newGradeText.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shrink-0"
              >
                <FiPlus size={16} /> Add
              </button>
            </div>
          </div>

          {/* Grades List */}
          <div className="flex-1 overflow-y-auto max-h-48 pr-2 custom-scrollbar">
            {grades.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {grades.map((grade) => (
                  <div key={grade.id} className="relative group">
                    {editingGradeId === grade.id ? (
                      <div className="flex items-center gap-1 p-2 bg-slate-50 rounded-lg border border-indigo-300">
                        <input
                          type="text"
                          value={editingGradeText}
                          onChange={(e) => setEditingGradeText(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter" && !isSaving) {
                              handleSaveEdit(grade.id);
                            }
                            if (e.key === "Escape") {
                              handleCancelEdit();
                            }
                          }}
                          className="w-24 px-2 py-1 text-xs border border-indigo-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-200"
                          autoFocus
                          disabled={isSaving}
                        />
                        <button
                          onClick={() => handleSaveEdit(grade.id)}
                          disabled={isSaving}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors disabled:opacity-50"
                          title="Save"
                        >
                          <FiCheck size={12} />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                          className="p-1 text-slate-600 hover:bg-slate-100 rounded transition-colors disabled:opacity-50"
                          title="Cancel"
                        >
                          <FiX size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100 hover:border-indigo-100 transition-colors">
                        <span className="text-xs font-bold text-slate-700">
                          {grade.text}
                        </span>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleStartEdit(grade)}
                            disabled={isSaving}
                            className="p-1 text-indigo-600 hover:bg-indigo-50 rounded transition-colors disabled:opacity-50"
                            title="Edit"
                          >
                            <FiEdit2 size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteGrade(grade.id)}
                            disabled={isSaving}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            <FiTrash2 size={12} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No grades defined yet.
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200">
            <button
              onClick={handleConfirmDeleteAllStudentGrades}
              disabled={isSaving}
              className="w-full px-4 py-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-sm font-bold hover:bg-rose-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <FiTrash2 size={16} /> Delete All Student Grades
            </button>
          </div>
        </div>
      </div>

      <MessageModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        mode={modalConfig.mode}
        onConfirm={modalConfig.onConfirm}
        onCancel={modalConfig.onCancel}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
      />
    </>
  );
}
