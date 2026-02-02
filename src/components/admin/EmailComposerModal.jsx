import React, { useState, useEffect, useRef } from "react";
import { FiX, FiSave, FiZap, FiLayout } from "react-icons/fi";
import { db } from "../../firebase";
import { doc, setDoc } from "firebase/firestore";

// Available placeholders for the user to insert
const DYNAMIC_FIELDS = [
  { label: "Student Name", value: "{{student_name}}" },
  { label: "Selected CCA List", value: "{{cca_list}}" },
  { label: "Selection Date", value: "{{date}}" },
  { label: "Admin Name", value: "{{admin_name}}" },
  { label: "Admin Contact", value: "{{admin_contact}}" },
];

export default function EmailComposerModal({
  isOpen,
  onClose,
  initialData,
  onSaveSuccess,
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Ref for the textarea to handle cursor insertion
  const bodyRef = useRef(null);

  // Load initial data when modal opens
  useEffect(() => {
    if (isOpen) {
      setSubject(initialData?.subject || "");
      setBody(
        initialData?.body ||
          "Dear {{student_name}},\n\nHere are your selected CCAs:\n{{cca_list}}\n\nBest regards,\n{{admin_name}}",
      );
    }
  }, [isOpen, initialData]);

  const handleInsertField = (fieldValue) => {
    const textarea = bodyRef.current;
    if (!textarea) return;

    // Insert text at cursor position
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const textBefore = body.substring(0, start);
    const textAfter = body.substring(end);

    const newBody = textBefore + fieldValue + textAfter;
    setBody(newBody);

    // Restore focus and move cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + fieldValue.length,
        start + fieldValue.length,
      );
    }, 0);
  };

  const handleSave = async () => {
    if (!subject.trim() || !body.trim()) {
      alert("Please fill in both Subject and Message fields.");
      return;
    }

    setIsSaving(true);
    try {
      await setDoc(
        doc(db, "settings", "emailTemplate"),
        {
          subject,
          body,
          updatedAt: new Date(),
        },
        { merge: true },
      );

      onSaveSuccess(); // Trigger refresh in parent
      onClose();
    } catch (error) {
      console.error("Error saving template:", error);
      alert("Failed to save template.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <FiLayout className="text-brand-primary" /> Email Template Editor
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Design the automated confirmation email.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-8 overflow-y-auto">
          {/* Subject Line */}
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
              Email Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., CCA Registration Confirmation"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
            />
          </div>

          {/* Dynamic Field Toolbar */}
          <div className="mb-2">
            <label className="block text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-2">
              <FiZap className="text-amber-500" /> Insert Dynamic Data
            </label>
            <div className="flex flex-wrap gap-2">
              {DYNAMIC_FIELDS.map((field) => (
                <button
                  key={field.value}
                  onClick={() => handleInsertField(field.value)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100 rounded-lg text-xs font-bold transition-colors active:scale-95"
                  title={`Insert ${field.label}`}
                >
                  {field.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message Body */}
          <div className="relative">
            <textarea
              ref={bodyRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type your message here..."
              className="w-full h-64 px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all font-mono text-sm leading-relaxed resize-none"
            ></textarea>
            <p className="text-[10px] text-slate-400 mt-2 text-right">
              Use the buttons above to insert data from the database.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 bg-brand-primary text-white rounded-xl font-bold shadow-lg shadow-brand-primary/20 hover:bg-brand-primary/90 transition-all active:scale-95 text-sm flex items-center gap-2"
          >
            {isSaving ? (
              "Saving..."
            ) : (
              <>
                <FiSave /> Save Template
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
