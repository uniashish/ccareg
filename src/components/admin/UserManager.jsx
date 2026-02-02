import React, { useState } from "react";
import {
  FiUser,
  FiMail,
  FiShield,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiFilter,
} from "react-icons/fi";

export default function UserManager({ users, onEditRole, onDeleteUser }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const roles = ["all", "admin", "teacher", "student"];

  // Combined Filter Logic: Search + Role
  const filteredUsers = users.filter((u) => {
    const userName = (u.displayName || u.name || "").toLowerCase();
    const userEmail = (u.email || "").toLowerCase();
    const matchesSearch =
      userName.includes(searchQuery.toLowerCase()) ||
      userEmail.includes(searchQuery.toLowerCase());

    const matchesRole = activeFilter === "all" || u.role === activeFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <section className="animate-in fade-in duration-500">
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">
              User Management
            </h2>
            <p className="text-slate-500 mt-1 font-medium">
              Manage system access and permissions for all registered accounts
            </p>
          </div>

          {/* SEARCH BAR */}
          <div className="relative w-full md:w-80">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all text-sm font-medium shadow-sm"
            />
          </div>
        </div>

        {/* ROLE FILTER TABS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex items-center gap-2 text-slate-400 mr-2">
            <FiFilter size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Filter:
            </span>
          </div>
          {roles.map((role) => (
            <button
              key={role}
              onClick={() => setActiveFilter(role)}
              className={`px-5 py-2 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap ${
                activeFilter === role
                  ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20"
                  : "bg-white text-slate-500 border border-slate-200 hover:border-brand-primary/30"
              }`}
            >
              {role}
              {activeFilter === role && (
                <span className="ml-2 bg-white/20 px-1.5 py-0.5 rounded-md text-[10px]">
                  {filteredUsers.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-8 py-5 font-black text-slate-400 uppercase text-[10px] tracking-widest">
                Full Name
              </th>
              <th className="px-8 py-5 font-black text-slate-400 uppercase text-[10px] tracking-widest">
                Email Address
              </th>
              <th className="px-8 py-5 font-black text-slate-400 uppercase text-[10px] tracking-widest">
                Access Level
              </th>
              <th className="px-8 py-5 font-black text-slate-400 uppercase text-[10px] tracking-widest text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((u) => {
                const isAdmin = u.role === "admin";
                const userName =
                  u.displayName ||
                  u.name ||
                  u.email?.split("@")[0] ||
                  "Unknown User";

                return (
                  <tr
                    key={u.uid}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                          <FiUser size={16} />
                        </div>
                        <span className="font-bold text-slate-700 capitalize">
                          {userName}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
                        <FiMail size={14} className="text-brand-neutral" />
                        {u.email}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${
                          isAdmin
                            ? "bg-brand-primary/10 text-brand-primary border border-brand-primary/20"
                            : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}
                      >
                        <FiShield size={12} />
                        {u.role}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onEditRole(u)}
                          className="flex items-center gap-2 px-4 py-2 text-brand-primary hover:bg-brand-primary/10 rounded-xl font-bold text-xs transition-all active:scale-95"
                        >
                          <FiEdit2 size={14} /> Update
                        </button>
                        <button
                          onClick={() => onDeleteUser(u.uid)}
                          className="flex items-center gap-2 px-4 py-2 text-brand-secondary hover:bg-brand-secondary/10 rounded-xl font-bold text-xs transition-all active:scale-95"
                        >
                          <FiTrash2 size={14} /> Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan="4"
                  className="px-8 py-20 text-center text-slate-400 italic"
                >
                  <div className="flex flex-col items-center gap-2">
                    <FiSearch size={40} className="text-slate-200" />
                    <p className="font-medium text-sm">
                      No results for "{searchQuery}" in {activeFilter} category
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
