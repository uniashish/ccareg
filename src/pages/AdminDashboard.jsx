import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  runTransaction, // <--- ADDED THIS IMPORT
} from "firebase/firestore";

// --- COMPONENTS ---
import ClassManager from "../components/admin/ClassManager";
import CCAManager from "../components/admin/CCAManager";
import AssignmentManager from "../components/admin/AssignmentManager";
import UserManager from "../components/admin/UserManager";
import SelectionsManager from "../components/admin/SelectionsManager";
import HousekeepingManager from "../components/admin/HousekeepingManager";
import Header from "../components/Header";
import AddClassModal from "../components/AddClassModal";
import AddCCAModal from "../components/AddCCAModal";
import CCADetailsModal from "../components/admin/CCADetailsModal";
import UpdateRoleModal from "../components/admin/UpdateRoleModal";
import MessageModal from "../components/common/MessageModal";
import sisBackground from "../assets/sisbackground.png";

// --- HOOKS ---
import { useAdminData } from "../hooks/useAdminData";

// --- ICONS ---
import {
  FiBook,
  FiGrid,
  FiUsers,
  FiCheckCircle,
  FiShield,
  FiSettings,
} from "react-icons/fi";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("Classes");
  const [messageModal, setMessageModal] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });

  const showMessage = ({ type = "info", title = "Notice", message = "" }) => {
    setMessageModal({
      isOpen: true,
      type,
      title,
      message,
    });
  };

  // Local State for User Management Tab
  const [localUsersList, setLocalUsersList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  const {
    ccas,
    classesList,
    selections,
    users: usersData,
    resetStudent, // This is for the full reset
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
  } = useAdminData(showMessage);

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

  // --- ACTIONS ---

  // 1. Logic to remove a SINGLE CCA from a student
  const handleSingleCCARemoval = async (selectionId, ccaToRemove) => {
    try {
      await runTransaction(db, async (transaction) => {
        // A. Get references
        const selectionRef = doc(db, "selections", selectionId);
        const ccaRef = doc(db, "ccas", ccaToRemove.id);

        // B. Read current data
        const selectionDoc = await transaction.get(selectionRef);
        const ccaDoc = await transaction.get(ccaRef);

        if (!selectionDoc.exists()) throw new Error("Selection not found");

        // C. Update Student List (Filter out the specific CCA)
        const currentSelection = selectionDoc.data();
        const updatedCCAList = currentSelection.selectedCCAs.filter(
          (c) => c.id !== ccaToRemove.id,
        );

        // D. Update Seat Count (Free up the seat)
        if (ccaDoc.exists()) {
          const currentEnrolled = ccaDoc.data().enrolledCount || 0;
          const newCount = currentEnrolled > 0 ? currentEnrolled - 1 : 0;
          transaction.update(ccaRef, { enrolledCount: newCount });
        }

        // E. Save or Delete Student Selection
        if (updatedCCAList.length === 0) {
          transaction.delete(selectionRef);
        } else {
          transaction.update(selectionRef, {
            selectedCCAs: updatedCCAList,
          });
        }
      });

      setMessageModal({
        isOpen: true,
        type: "success",
        title: "Activity Removed",
        message: `Successfully removed ${ccaToRemove.name}.`,
      });
      return true;
    } catch (error) {
      console.error("Error removing CCA:", error);
      setMessageModal({
        isOpen: true,
        type: "error",
        title: "Removal Failed",
        message: "Failed to remove activity. Please try again.",
      });
      return false;
    }
  };

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
      showMessage({
        type: "error",
        title: "Update Failed",
        message: "Failed to update user role.",
      });
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

  const adminTabs = [
    { id: "Classes", icon: <FiGrid /> },
    { id: "CCAs", icon: <FiBook /> },
    { id: "Assignments", icon: <FiCheckCircle /> },
    { id: "Users", icon: <FiShield /> },
    { id: "Selections", icon: <FiUsers /> },
    { id: "Housekeeping", icon: <FiSettings /> },
  ];

  return (
    <div
      className="h-screen overflow-hidden flex flex-col font-sans text-slate-900 bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `url(${sisBackground})` }}
    >
      <Header />

      <main className="flex-1 flex overflow-hidden min-h-0">
        <div className="md:hidden border-b border-slate-200 bg-white/95 backdrop-blur-sm">
          <nav className="px-3 py-2 flex items-center gap-2 overflow-x-auto">
            {adminTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? "bg-brand-primary text-white"
                    : "text-slate-600 bg-slate-100"
                }`}
              >
                <span>{tab.icon}</span>
                {tab.id}
              </button>
            ))}
          </nav>
        </div>

        {/* SIDEBAR */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col py-6 hidden md:flex">
          <nav className="px-4 space-y-2">
            {adminTabs.map((tab) => (
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
        <div
          className={`flex-1 p-4 md:p-8 ${
            activeTab === "Users" ? "overflow-hidden" : "overflow-y-auto"
          }`}
        >
          <div
            className={`max-w-6xl mx-auto ${
              activeTab === "Users" ? "h-full flex flex-col min-h-0" : ""
            }`}
          >
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
                selections={selections}
                users={usersData}
                classesList={classesList}
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
                selections={selections}
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

            {/* HERE IS THE CRITICAL CHANGE */}
            {activeTab === "Selections" && (
              // We replace the huge inline code with the Component
              <SelectionsManager
                selections={selections}
                users={usersData}
                classesList={classesList}
                onResetStudent={resetStudent}
                onDeleteCCA={handleSingleCCARemoval} // Passing the new function
              />
            )}

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

      <footer className="px-4 md:px-8 py-3 text-center text-xs md:text-sm font-medium text-slate-400 bg-transparent border-t border-slate-200/60">
        Developed and Maintained by Ashish Bhatnagar SISKGNEJ
      </footer>

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

      <MessageModal
        isOpen={messageModal.isOpen}
        onClose={() =>
          setMessageModal((prev) => ({
            ...prev,
            isOpen: false,
          }))
        }
        type={messageModal.type}
        title={messageModal.title}
        message={messageModal.message}
      />
    </div>
  );
}
