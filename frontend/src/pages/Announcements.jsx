import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  FiSearch,
  FiBell,
  FiPlus,
  FiTrash2,
  FiEdit,
  FiX,
  FiMapPin,
  FiCalendar,
  FiUser
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion"; // Consistent with your theme

export default function AnnouncementTab() {
  const role = localStorage.getItem("role"); // "admin" | "instructor" | "student"
  const token = localStorage.getItem("token");

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all"); // all | pinned
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", pinned: false });
  const [editing, setEditing] = useState(null);

  // --- 1. FETCH DATA ---
  const fetchAnnouncements = useCallback(async () => {
    try {
      const response = await fetch("/api/announcements", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setAnnouncements(data);
      } else {
        console.error("Failed to fetch:", data.error);
      }
    } catch (error) {
      console.error("Error connecting to server:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // --- 2. INITIAL LOAD ---
  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // --- 3. FILTER & SORT LOGIC ---
  const visible = useMemo(() => {
    let list = [...announcements];

    if (filter === "pinned") {
      list = list.filter((a) => a.pinned);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q)
      );
    }

    list.sort((x, y) => {
      if (x.pinned && !y.pinned) return -1;
      if (!x.pinned && y.pinned) return 1;
      return new Date(y.date) - new Date(x.date);
    });

    return list;
  }, [announcements, query, filter]);

  // --- 4. HANDLERS ---
  function handleCreateClick() {
    setForm({ title: "", body: "", pinned: false });
    setEditing(null);
    setShowCreate(true);
  }

  function handleEdit(a) {
    setEditing(a);
    setForm({ title: a.title, body: a.body, pinned: !!a.pinned });
    setShowCreate(true);
  }

  async function handleSave() {
    const trimmed = {
      ...form,
      title: form.title.trim(),
      body: form.body.trim(),
    };

    if (!trimmed.title) return alert("Please add a title.");
    if (!trimmed.body) return alert("Please add content.");

    try {
      let url = "/api/announcements";
      let method = "POST";

      if (editing) {
        url = `/api/announcements/${editing.id}`;
        method = "PUT";
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(trimmed),
      });

      if (response.ok) {
        setShowCreate(false);
        fetchAnnouncements();
      } else {
        alert("Failed to save announcement.");
      }
    } catch (error) {
      console.error("Error saving:", error);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this announcement?")) return;

    try {
      const response = await fetch(`/api/announcements/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      } else {
        alert("Failed to delete.");
      }
    } catch (error) {
      console.error("Error deleting:", error);
    }
  }

  const canManage = role === "admin" || role === "instructor" || role === "super_admin";

  return (
    <div className="p-6 md:p-8 bg-[#070B14] min-h-screen font-sans text-gray-200">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black italic text-white tracking-tighter flex items-center gap-3 uppercase">
            <FiBell className="text-emerald-500" /> Comm-Link <span className="text-emerald-500">Nodes</span>
          </h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Stay synchronized with the latest grid updates.</p>
        </div>

        {canManage && (
          <button
            onClick={handleCreateClick}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-[#070B14] font-black rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:bg-emerald-400 transition-all transform active:scale-95 uppercase text-xs tracking-widest"
          >
            <FiPlus className="w-5 h-5" /> Broadcast Node
          </button>
        )}
      </div>

      {/* --- CONTROLS --- */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1 max-w-md group">
          <FiSearch className="absolute left-4 top-3.5 text-gray-500 group-focus-within:text-emerald-500 transition-colors" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search grid frequency..."
            className="w-full pl-11 pr-4 py-3.5 bg-[#0F172A] border border-gray-800 text-white rounded-xl focus:outline-none focus:border-emerald-500/50 transition-all font-bold text-sm"
          />
        </div>

        <div className="flex bg-[#0F172A] p-1.5 rounded-xl border border-gray-800 w-fit">
          <button
            onClick={() => setFilter("all")}
            className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              filter === "all"
                ? "bg-emerald-500 text-[#070B14] shadow-lg"
                : "text-gray-500 hover:text-emerald-400 hover:bg-white/5"
            }`}
          >
            All Logs
          </button>
          <button
            onClick={() => setFilter("pinned")}
            className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
              filter === "pinned"
                ? "bg-emerald-500 text-[#070B14] shadow-lg"
                : "text-gray-500 hover:text-emerald-400 hover:bg-white/5"
            }`}
          >
            <FiMapPin className={filter === "pinned" ? "text-[#070B14]" : ""} /> Priority
          </button>
        </div>
      </div>

      {/* --- LIST VIEW --- */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
             <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mb-4"></div>
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 animate-pulse">Syncing Announcements...</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-600 bg-[#0F172A] rounded-3xl border border-gray-800 border-dashed">
            <FiBell className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-xs font-black uppercase tracking-widest">No active frequencies detected.</p>
          </div>
        ) : (
          visible.map((a) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={a.id}
              className="group relative bg-[#0F172A] p-7 rounded-3xl border border-gray-800 hover:border-emerald-500/30 transition-all duration-300 shadow-xl"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3 flex-wrap">
                    {a.pinned && (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black bg-emerald-500 text-[#070B14] uppercase tracking-tighter shadow-lg">
                        <FiMapPin className="w-3 h-3" /> Priority Node
                      </span>
                    )}
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      <FiCalendar className="w-3 h-3 text-emerald-500/50" /> {a.date}
                    </div>
                    {a.author && (
                       <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-l border-gray-800 pl-4">
                         <FiUser className="w-3 h-3 text-emerald-500/50" /> {a.author}
                       </div>
                    )}
                  </div>

                  <h3 className="text-xl font-black text-white mb-3 group-hover:text-emerald-400 transition-colors tracking-tight italic uppercase leading-none">
                    {a.title}
                  </h3>
                  <p className="text-sm text-gray-400 font-medium leading-relaxed whitespace-pre-wrap max-w-4xl">
                    {a.body}
                  </p>
                </div>

                {canManage && (
                  <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0">
                    <button
                      onClick={() => handleEdit(a)}
                      className="p-2.5 text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded-xl hover:bg-emerald-500 hover:text-[#070B14] transition-all"
                      title="Edit Node"
                    >
                      <FiEdit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(id)}
                      className="p-2.5 text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                      title="Purge Node"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* --- MODAL (Create/Edit) --- */}
      <AnimatePresence>
      {showCreate && canManage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#070B14]/80 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-lg bg-[#0F172A] border border-gray-800 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-gray-800 flex justify-between items-center bg-[#1E293B]/30">
              <h4 className="text-sm font-black uppercase tracking-widest text-white italic">
                {editing ? "Modify Broadcast" : "Initialize Broadcast"}
              </h4>
              <button
                onClick={() => setShowCreate(false)}
                className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-full transition-all"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Log Identifier</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                  placeholder="Subject line..."
                  className="w-full px-5 py-3 bg-[#070B14] border border-gray-800 text-white rounded-xl focus:outline-none focus:border-emerald-500/50 transition-all font-bold"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Detailed Content</label>
                <textarea
                  value={form.body}
                  onChange={(e) => setForm((s) => ({ ...s, body: e.target.value }))}
                  placeholder="Transmission details..."
                  className="w-full px-5 py-4 bg-[#070B14] border border-gray-800 text-white rounded-xl focus:outline-none focus:border-emerald-500/50 h-40 resize-none transition-all font-bold leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-3 pt-2 group cursor-pointer">
                <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      id="pinCheck"
                      checked={form.pinned}
                      onChange={(e) => setForm((s) => ({ ...s, pinned: e.target.checked }))}
                      className="w-5 h-5 bg-[#070B14] border-gray-800 rounded-lg focus:ring-0 checked:bg-emerald-500 cursor-pointer appearance-none border transition-all"
                    />
                    {form.pinned && <FiMapPin className="absolute left-1 text-[#070B14] pointer-events-none w-3 h-3" />}
                </div>
                <label htmlFor="pinCheck" className="text-[11px] font-black text-gray-400 uppercase tracking-widest cursor-pointer select-none group-hover:text-emerald-400 transition-colors">
                  Elevate to Priority Frequency
                </label>
              </div>
            </div>

            <div className="px-8 py-6 bg-[#1E293B]/30 flex justify-end gap-4 border-t border-gray-800">
              <button
                onClick={() => setShowCreate(false)}
                className="px-6 py-3 text-[10px] font-black text-gray-500 bg-transparent border border-gray-800 rounded-xl hover:text-white hover:border-gray-600 transition-all uppercase tracking-widest"
              >
                Abort
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-3 text-[10px] font-black text-[#070B14] bg-emerald-500 rounded-xl hover:bg-emerald-400 shadow-lg transition-all uppercase tracking-widest"
              >
                {editing ? "Update Node" : "Release Broadcast"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>
    </div>
  );
}