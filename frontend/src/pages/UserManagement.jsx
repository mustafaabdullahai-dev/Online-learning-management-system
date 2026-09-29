import React, { useState, useEffect, useCallback } from "react";
import { FiEdit, FiEye, FiTrash2, FiSearch, FiPlus, FiUser, FiFilter, FiShield, FiX } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion"; // Consistently added for theme smoothness

// --- Roles Array (Updated for Terminal Theme) ---
const roles = [
  { value: "All Roles", label: "All Nodes" },
  { value: "student", label: "Learner Node" },
  { value: "instructor", label: "Instructor Node" },
  { value: "admin", label: "Administrator Node" },
  { value: "super_admin", label: "Root Super Admin" },
];

const UserManagement = () => {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("All Roles");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null); 

  // --- Data Fetching ---
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("token");
    try {
      const response = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to fetch identity nodes");
      }
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // --- Delete Function ---
  const handleDelete = async (userId) => {
    if (window.confirm("Purge Identity Node? This action is irreversible.")) {
      const token = localStorage.getItem("token");
      try {
        const response = await fetch(`/api/users/${userId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "De-authorization failed");
        }
        fetchUsers(); 
      } catch (err) {
        alert("Error: " + err.message);
      }
    }
  };
  
  // --- Modal Submit ---
  const handleModalSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const formData = new FormData(e.target);
    
    const userData = {
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      role: formData.get("role"),
      status: formData.get("status"),
    };

    let url = '/api/users';
    let method = 'POST';

    if (editingUser) {
      url = `/api/users/${editingUser._id}`;
      method = 'PUT';
    } else {
      const password = formData.get("password");
      const confirmPassword = formData.get("confirmPassword");
      if (!password || !confirmPassword) return alert("Credentials required.");
      if (password !== confirmPassword) return alert("Credential mismatch.");
      userData.password = password;
    }

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Node registration failed");
      }

      setIsModalOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.name?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (user.email?.toLowerCase() || "").includes(search.toLowerCase());
    const matchesRole = role === "All Roles" || user.role === role;
    return matchesSearch && matchesRole;
  });

  if (loading) return (
    <div className="flex flex-col h-screen justify-center items-center bg-[#070B14]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        <p className="text-emerald-500 font-black uppercase tracking-[0.3em] text-[10px] mt-4 animate-pulse">Scanning Identity Grid...</p>
    </div>
  );
  
  if (error) return (
    <div className="p-8 bg-[#070B14] min-h-screen flex items-center justify-center font-sans">
        <div className="bg-[#0F172A] p-10 rounded-[32px] shadow-2xl border border-red-500/20 text-center max-w-md">
            <FiShield className="mx-auto text-red-500 text-5xl mb-6" />
            <h1 className="text-xl font-black text-white mb-2 uppercase tracking-tighter italic">Terminal Access Error</h1>
            <p className="text-red-400 font-bold uppercase text-xs tracking-widest">{error}</p>
        </div>
    </div>
  );

  return (
    <div className="p-6 md:p-10 bg-[#070B14] min-h-screen font-sans text-white">
      
      {/* --- Page Header --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-black italic text-white tracking-tighter uppercase leading-none">Identity <span className="text-emerald-500">Management</span></h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">Monitor authorized nodes, instructors, and global administrators.</p>
        </div>
        <button
          onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-[#070B14] font-black rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:bg-emerald-400 transition-all transform active:scale-95 uppercase text-xs tracking-widest"
        >
          <FiPlus className="w-5 h-5" /> Initialize Node
        </button>
      </div>

      {/* --- Filters Card --- */}
      <div className="bg-[#0F172A] p-2 rounded-2xl shadow-2xl border border-gray-800 mb-8 flex flex-col md:flex-row gap-2 items-center justify-between">
        <div className="relative w-full md:w-96 group">
          <span className="absolute left-4 top-3.5 text-gray-500 group-focus-within:text-emerald-500 transition-colors">
            <FiSearch className="w-5 h-5" />
          </span>
          <input
            type="text"
            className="w-full pl-12 pr-4 py-3.5 bg-[#070B14] border border-gray-800 rounded-xl focus:outline-none focus:border-emerald-500/50 transition-all text-sm font-bold text-white placeholder-gray-600 shadow-inner"
            placeholder="Search identity identifiers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="relative w-full md:w-auto min-w-[220px]">
           <FiFilter className="absolute left-4 top-4 text-emerald-500/50 z-10" />
           <select
            className="w-full pl-12 pr-10 py-3.5 bg-[#070B14] border border-gray-800 rounded-xl focus:outline-none focus:border-emerald-500/50 transition-all appearance-none cursor-pointer text-[11px] font-black uppercase tracking-widest text-gray-400"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            {roles.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <span className="absolute right-4 top-4 text-gray-600 pointer-events-none text-xs">▼</span>
        </div>
      </div>

      {/* --- Table Section --- */}
      <div className="bg-[#0F172A] rounded-3xl border border-gray-800 shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-[#1E293B]/40 border-b border-gray-800">
              <tr>
                <th className="px-8 py-5 font-black text-gray-500 uppercase text-[10px] tracking-[0.2em]">Identity Node</th>
                <th className="px-8 py-5 font-black text-gray-500 uppercase text-[10px] tracking-[0.2em]">Protocol Role</th>
                <th className="px-8 py-5 font-black text-gray-500 uppercase text-[10px] tracking-[0.2em]">Auth Status</th>
                <th className="px-8 py-5 font-black text-gray-500 uppercase text-[10px] tracking-[0.2em]">Modules</th>
                <th className="px-8 py-5 font-black text-gray-500 uppercase text-[10px] tracking-[0.2em]">Sync Level</th>
                <th className="px-8 py-5 font-black text-gray-500 uppercase text-[10px] tracking-[0.2em] text-right">Overrides</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {filteredUsers.map((user) => {
                const isSuperAdmin = user.role === 'super_admin';
                return (
                <tr key={user._id} className="hover:bg-emerald-500/5 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className={`h-11 w-11 rounded-xl text-white flex items-center justify-center font-black text-sm shadow-lg ${isSuperAdmin ? 'bg-gradient-to-br from-purple-600 to-indigo-600' : 'bg-gradient-to-br from-[#070B14] to-[#1E293B] border border-gray-700 text-emerald-500 shadow-inner'}`}>
                        {user.initials || <FiUser />}
                      </div>
                      <div>
                        <div className="font-bold text-gray-200 flex items-center gap-2 uppercase tracking-tight text-sm italic">
                            {user.name} 
                            {isSuperAdmin && <FiShield className="text-purple-400 w-3.5 h-3.5" title="Root Access" />}
                        </div>
                        <div className="text-gray-500 text-[10px] font-bold tracking-widest uppercase">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border shadow-lg
                      ${isSuperAdmin ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 
                        user.role === 'admin' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                        user.role === 'instructor' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        'bg-gray-800 text-gray-400 border-gray-700'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border shadow-lg
                      ${user.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        user.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                        'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : user.status === 'rejected' ? 'bg-red-500' : 'bg-orange-500'}`}></span>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 font-black text-gray-500 text-[11px] tracking-widest uppercase">{user.enrolled || 0} Sectors</td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-20 bg-gray-900 rounded-full h-1.5 overflow-hidden border border-gray-800 shadow-inner">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${user.completed || 0}%` }}
                            className="bg-emerald-500 h-full shadow-[0_0_10px_#10b981]"
                        ></motion.div>
                      </div>
                      <span className="text-[10px] font-black text-gray-400">{user.completed || 0}%</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      {!isSuperAdmin && (
                        <>
                            <button onClick={() => { setEditingUser(user); setIsModalOpen(true); }} className="p-2.5 bg-white/5 border border-gray-800 rounded-xl text-gray-400 hover:text-emerald-500 hover:border-emerald-500/30 transition-all shadow-lg" title="Modify Node"><FiEdit size={16} /></button>
                            <button onClick={() => handleDelete(user._id)} className="p-2.5 bg-white/5 border border-gray-800 rounded-xl text-gray-400 hover:text-red-500 hover:border-red-500/30 transition-all shadow-lg" title="Purge Node"><FiTrash2 size={16} /></button>
                        </>
                      )}
                      <button className="p-2.5 bg-white/5 border border-gray-800 rounded-xl text-gray-400 hover:text-blue-400 hover:border-blue-500/30 transition-all shadow-lg" title="Inspect Node"><FiEye size={16} /></button>
                      {isSuperAdmin && <FiShield className="p-2.5 text-purple-500/30 cursor-not-allowed" size={38} title="Root Protected" />}
                    </div>
                  </td>
                </tr>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-24">
                    <div className="flex flex-col items-center justify-center text-gray-600">
                        <FiSearch size={48} className="mb-4 opacity-10" />
                        <p className="font-black uppercase tracking-widest text-xs">No matching identity nodes in this grid frequency.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Modal Overlay --- */}
      <AnimatePresence>
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-[#070B14]/90 backdrop-blur-md z-[100] p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-[#0F172A] border border-gray-800 rounded-[32px] shadow-[0_0_60px_rgba(0,0,0,0.6)] w-full max-w-lg overflow-hidden"
          >
            <div className="px-10 py-7 border-b border-gray-800 flex justify-between items-center bg-[#1E293B]/30">
              <h2 className="text-xl font-black italic text-white uppercase tracking-tighter">
                {editingUser ? "Modify Identity" : "Register Identity"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white transition-colors p-2 bg-white/5 rounded-full"><FiX size={20}/></button>
            </div>

            <form onSubmit={handleModalSubmit} className="p-10 space-y-6">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">First ID</label>
                  <input name="firstName" defaultValue={editingUser?.firstName || ""} required className="w-full bg-[#070B14] border border-gray-800 rounded-2xl px-5 py-4 focus:border-emerald-500/50 outline-none text-white text-sm font-bold transition-all placeholder-gray-800 shadow-inner" />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Last ID</label>
                  <input name="lastName" defaultValue={editingUser?.lastName || ""} className="w-full bg-[#070B14] border border-gray-800 rounded-2xl px-5 py-4 focus:border-emerald-500/50 outline-none text-white text-sm font-bold transition-all placeholder-gray-800 shadow-inner" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Identity Uplink (Email)</label>
                <input type="email" name="email" defaultValue={editingUser?.email || ""} required className="w-full bg-[#070B14] border border-gray-800 rounded-2xl px-5 py-4 focus:border-emerald-500/50 outline-none text-white text-sm font-bold transition-all placeholder-gray-800 shadow-inner" />
              </div>
              
              {!editingUser && (
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Key Phrase</label>
                    <input type="password" name="password" required className="w-full bg-[#070B14] border border-gray-800 rounded-2xl px-5 py-4 focus:border-emerald-500/50 outline-none text-white text-sm font-bold transition-all shadow-inner" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Confirm Key</label>
                    <input type="password" name="confirmPassword" required className="w-full bg-[#070B14] border border-gray-800 rounded-2xl px-5 py-4 focus:border-emerald-500/50 outline-none text-white text-sm font-bold transition-all shadow-inner" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Protocol Role</label>
                  <select name="role" defaultValue={editingUser?.role || "student"} className="w-full bg-[#070B14] border border-gray-800 rounded-2xl px-5 py-4 focus:border-emerald-500/50 outline-none text-gray-400 text-[10px] font-black uppercase tracking-widest appearance-none cursor-pointer shadow-inner">
                    <option value="student">Learner Node</option>
                    <option value="instructor">Instructor Node</option>
                    <option value="admin">Administrator Node</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Node Status</label>
                  <select name="status" defaultValue={editingUser?.status || "active"} className="w-full bg-[#070B14] border border-gray-800 rounded-2xl px-5 py-4 focus:border-emerald-500/50 outline-none text-gray-400 text-[10px] font-black uppercase tracking-widest appearance-none cursor-pointer shadow-inner">
                    <option value="active">Active Relay</option>
                    <option value="pending">Standby Mode</option>
                    <option value="rejected">Terminal Lock</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 rounded-xl border border-gray-800 text-gray-500 font-black text-[10px] uppercase tracking-widest hover:text-white hover:bg-white/5 transition-all">Abort</button>
                <button type="submit" className="px-10 py-4 bg-emerald-500 text-[#070B14] font-black rounded-xl shadow-lg hover:bg-emerald-400 transition-all uppercase text-[10px] tracking-widest">
                  {editingUser ? "Update Signal" : "Initialize Signal"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default UserManagement;