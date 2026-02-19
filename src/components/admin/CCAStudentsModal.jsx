import React, { useMemo, useState, useEffect } from "react";
import { FiX, FiUsers, FiChevronRight, FiChevronDown } from "react-icons/fi";

export default function CCAStudentsModal({
  isOpen,
  onClose,
  cca,
  selections,
  users,
  classesList,
}) {
  const [expandedClasses, setExpandedClasses] = useState({});

  const groupedStudents = useMemo(() => {
    if (!cca || !Array.isArray(selections)) return [];

    const classMap = (classesList || []).reduce((acc, cls) => {
      acc[cls.id] = cls.name;
      return acc;
    }, {});

    const grouped = {};

    selections.forEach((selection) => {
      const selected = Array.isArray(selection.selectedCCAs)
        ? selection.selectedCCAs
        : [];

      const hasThisCCA = selected.some(
        (item) => item.id === cca.id || item.name === cca.name,
      );

      if (!hasThisCCA) return;

      const className = classMap[selection.classId] || "Unassigned";
      const userProfile = users ? users[selection.studentUid] : null;
      const studentName =
        userProfile?.displayName ||
        selection.studentName ||
        selection.studentEmail?.split("@")[0] ||
        "Unknown";

      if (!grouped[className]) {
        grouped[className] = [];
      }

      grouped[className].push({
        name: studentName,
        className,
      });
    });

    return Object.entries(grouped)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([className, students]) => ({
        className,
        students: students.sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [cca, selections, users, classesList]);

  useEffect(() => {
    if (!isOpen) return;

    const initialState = groupedStudents.reduce((acc, group) => {
      acc[group.className] = false;
      return acc;
    }, {});

    setExpandedClasses(initialState);
  }, [isOpen, cca, groupedStudents]);

  if (!isOpen || !cca) return null;

  const totalStudents = groupedStudents.reduce(
    (sum, group) => sum + group.students.length,
    0,
  );

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl max-h-[85vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/60 flex items-start justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-800">{cca.name}</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {totalStudents} student{totalStudents !== 1 ? "s" : ""} selected
              this CCA
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {groupedStudents.length > 0 ? (
            groupedStudents.map((group) => (
              <div
                key={group.className}
                className="border border-slate-200 rounded-2xl overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedClasses((prev) => ({
                      ...prev,
                      [group.className]: !prev[group.className],
                    }))
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    {expandedClasses[group.className] ? (
                      <FiChevronDown size={16} />
                    ) : (
                      <FiChevronRight size={16} />
                    )}
                    <span>{group.className}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-bold uppercase">
                    {group.students.length}
                  </span>
                </button>

                {expandedClasses[group.className] && (
                  <div className="p-3 space-y-2">
                    {group.students.map((student, index) => (
                      <div
                        key={`${group.className}-${student.name}-${index}`}
                        className="px-3 py-2 rounded-xl bg-white border border-slate-100 text-sm text-slate-700 flex items-center justify-between"
                      >
                        <span className="font-semibold">{student.name}</span>
                        <span className="text-[11px] text-slate-400 font-bold uppercase">
                          {student.className}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-slate-400">
              <FiUsers className="mx-auto mb-3" size={28} />
              <p className="font-medium">No students have selected this CCA.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
