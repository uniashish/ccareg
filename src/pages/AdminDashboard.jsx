import { useState, useEffect, useMemo } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

// --- COMPONENTS ---
import ClassManager from "../components/admin/ClassManager";
import CCAManager from "../components/admin/CCAManager";
import AssignmentManager from "../components/admin/AssignmentManager";
import UserManager from "../components/admin/UserManager";
import SelectionsManager from "../components/admin/SelectionsManager";
import HousekeepingManager from "../components/admin/HousekeepingManager"; // <--- NEW IMPORT
import Header from "../components/Header";
import AddClassModal from "../components/AddClassModal";
import AddCCAModal from "../components/AddCCAModal";
import CCADetailsModal from "../components/admin/CCADetailsModal";
import UpdateRoleModal from "../components/admin/UpdateRoleModal";

// --- HOOKS ---
import { useAdminData } from "../hooks/useAdminData";
import { downloadSelectionsCSV } from "../utils/csvExporter";

// --- ICONS ---
import {
  FiBook,
  FiGrid,
  FiUsers,
  FiCheckCircle,
  FiShield,
  FiSearch,
  FiDownload,
  FiTrash2,
  FiCalendar,
  FiActivity,
  FiUser,
  FiSettings, // <--- NEW ICON
} from "react-icons/fi";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("Classes");

  // Local State for User Management Tab
  const [localUsersList, setLocalUsersList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // Search State for Selections
  const [searchTerm, setSearchTerm] = useState("");

  const {
    ccas,
    classesList,
    selections,
    users: usersData,
    resetStudent,
    isClassModalOpen,
    setIsClassModalOpen,
    editingClass,
    setEditingClass,
    isCCAModalOpen,
    setIsCCAModalOpen,
    editingCCA,
    setEditingCCA,
    viewingCCA,
    setViewingCCA,
    selectedClassId,
    setSelectedClassId,
    handleSaveClass,
    handleDeleteClass,
    handleSaveCCA,
    handleDeleteCCA,
    toggleCCAMap,
  } = useAdminData();

  // Listener for "Users" Tab
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        ...doc.data(),
        uid: doc.id,
      }));
      setLocalUsersList(list);
    });
    return () => unsubscribe();
  }, []);

  // --- HELPERS FOR SELECTIONS TABLE ---
  const classMap = useMemo(() => {
    return classesList.reduce((acc, cls) => {
      acc[cls.id] = cls;
      return acc;
    }, {});
  }, [classesList]);

  const filteredSelections = (selections || []).filter((s) => {
    const user = usersData ? usersData[s.studentUid] : null;
    const name = user?.displayName?.toLowerCase() || "";
    const email = s.studentEmail?.toLowerCase() || "";
    const term = searchTerm.toLowerCase();
    return name.includes(term) || email.includes(term);
  });

  // --- ACTIONS ---
  const handleEditUserRole = (user) => {
    setSelectedUser(user);
    setIsUserModalOpen(true);
  };

  const handleUpdateRole = async (uid, newRole) => {
    try {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, { role: newRole });
      setIsUserModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Failed to update user role.");
    }
  };

  const handleDeleteUser = async (uid) => {
    if (window.confirm("Are you sure you want to remove this user?")) {
      try {
        await deleteDoc(doc(db, "users", uid));
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Header />

      <main className="flex-1 flex overflow-hidden">
        {/* SIDEBAR */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col py-6 hidden md:flex">
          <nav className="px-4 space-y-2">
            {[
              { id: "Classes", icon: <FiGrid /> },
              { id: "CCAs", icon: <FiBook /> },
              { id: "Assignments", icon: <FiCheckCircle /> },
              { id: "Users", icon: <FiShield /> },
              { id: "Selections", icon: <FiUsers /> },
              { id: "Housekeeping", icon: <FiSettings /> }, // <--- NEW TAB
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                  activeTab === tab.id
                    ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                <span
                  className={
                    activeTab === tab.id ? "text-white" : "text-brand-neutral"
                  }
                >
                  {tab.icon}
                </span>
                {tab.id}
              </button>
            ))}
          </nav>
        </aside>

        {/* MAIN CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {activeTab === "Classes" && (
              <ClassManager
                classesList={classesList}
                ccas={ccas}
                onAddClick={() => {
                  setEditingClass(null);
                  setIsClassModalOpen(true);
                }}
                onEditClick={(c) => {
                  setEditingClass(c);
                  setIsClassModalOpen(true);
                }}
                onDeleteClick={handleDeleteClass}
              />
            )}

            {activeTab === "CCAs" && (
              <CCAManager
                ccas={ccas}
                onAddClick={() => {
                  setEditingCCA(null);
                  setIsCCAModalOpen(true);
                }}
                onEditClick={(cca) => {
                  setEditingCCA(cca);
                  setIsCCAModalOpen(true);
                }}
                onDeleteClick={handleDeleteCCA}
                onViewDetails={setViewingCCA}
              />
            )}

            {activeTab === "Assignments" && (
              <AssignmentManager
                classesList={classesList}
                ccas={ccas}
                selectedClassId={selectedClassId}
                setSelectedClassId={setSelectedClassId}
                onToggleCCA={toggleCCAMap}
              />
            )}

            {activeTab === "Users" && (
              <UserManager
                users={localUsersList}
                onEditRole={handleEditUserRole}
                onDeleteUser={handleDeleteUser}
              />
            )}

            {activeTab === "Selections" && (
              <div className="animate-in fade-in duration-500">
                {/* HEADER */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div>
                    <h1 className="text-2xl font-black text-slate-800">
                      Master List
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                      Total Submissions:{" "}
                      <span className="font-bold text-brand-primary">
                        {selections?.length || 0}
                      </span>
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <div className="relative group">
                      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors" />
                      <input
                        type="text"
                        placeholder="Search student..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 w-64 shadow-sm"
                      />
                    </div>

                    <button
                      onClick={() =>
                        downloadSelectionsCSV(
                          filteredSelections,
                          usersData,
                          classMap,
                        )
                      }
                      className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-600/20 transition-all active:scale-95 text-sm"
                    >
                      <FiDownload />
                      <span>Export CSV</span>
                    </button>
                  </div>
                </div>

                {/* TABLE */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-widest text-slate-500 font-bold">
                          <th className="p-5">Student</th>
                          <th className="p-5">Class</th>
                          <th className="p-5">Activities Selected</th>
                          <th className="p-5">Submitted At</th>
                          <th className="p-5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {filteredSelections.length > 0 ? (
                          filteredSelections.map((sel) => {
                            const user = usersData
                              ? usersData[sel.studentUid]
                              : null;
                            const displayName = user?.displayName;
                            const email = sel.studentEmail || user?.email;

                            // Robust Name Lookup
                            const finalName =
                              user?.displayName ||
                              sel.studentName ||
                              (email ? email.split("@")[0] : "Unknown Student");

                            return (
                              <tr
                                key={sel.id}
                                className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                              >
                                <td className="p-5">
                                  <div
                                    className={`font-bold ${displayName ? "text-slate-800" : "text-slate-500 italic"}`}
                                  >
                                    {finalName}
                                  </div>
                                  <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                    <FiUser size={10} /> {email}
                                  </div>
                                </td>

                                <td className="p-5">
                                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-600">
                                    <FiGrid />
                                    {classMap[sel.classId]?.name ||
                                      "Unknown Class"}
                                  </div>
                                </td>

                                <td className="p-5">
                                  <div className="flex flex-col gap-1.5">
                                    {sel.selectedCCAs.map((cca, i) => (
                                      <div
                                        key={i}
                                        className="flex items-center gap-2 text-slate-700 font-medium text-xs"
                                      >
                                        <span className="w-5 h-5 flex items-center justify-center bg-brand-primary/10 text-brand-primary rounded-full text-[9px] font-black">
                                          {i + 1}
                                        </span>
                                        {cca.name}
                                      </div>
                                    ))}
                                  </div>
                                </td>

                                <td className="p-5">
                                  <div className="text-slate-500 text-xs font-medium flex items-center gap-1.5">
                                    <FiCalendar />
                                    {sel.timestamp
                                      ?.toDate()
                                      .toLocaleDateString()}
                                  </div>
                                  <div className="text-slate-400 text-[10px] pl-5">
                                    {sel.timestamp
                                      ?.toDate()
                                      .toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                  </div>
                                </td>

                                <td className="p-5 text-right">
                                  <button
                                    onClick={() => resetStudent(sel.id)}
                                    title="Reset Selection"
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                  >
                                    <FiTrash2 size={18} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td
                              colSpan="5"
                              className="p-10 text-center text-slate-400"
                            >
                              <FiActivity className="mx-auto text-3xl mb-2 opacity-20" />
                              <p>No selections found matching your search</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* NEW TAB CONTENT */}
            {activeTab === "Housekeeping" && (
              <HousekeepingManager
                selections={selections}
                users={usersData}
                classesList={classesList}
              />
            )}
          </div>
        </div>
      </main>

      {/* MODALS */}
      <AddClassModal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        onSave={handleSaveClass}
        initialData={editingClass}
      />
      <AddCCAModal
        isOpen={isCCAModalOpen}
        onClose={() => setIsCCAModalOpen(false)}
        onSave={handleSaveCCA}
        initialData={editingCCA}
      />
      <CCADetailsModal
        isOpen={!!viewingCCA}
        onClose={() => setViewingCCA(null)}
        cca={viewingCCA}
        classes={classesList}
      />
      <UpdateRoleModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        user={selectedUser}
        onUpdate={handleUpdateRole}
      />
    </div>
  );
}
