import React, { useState, useEffect } from "react";
import { CiVideoOn } from "react-icons/ci";
import { FiPlus, FiVideo, FiUsers, FiClock, FiCalendar, FiX, FiLink, FiLoader, FiTrash2, FiExternalLink } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const VideoConferencing = () => {
  const role = localStorage.getItem("role"); 
  const canSchedule = ["instructor", "admin", "superadmin"].includes(role);

  // --- STATE ---
  const [meetings, setMeetings] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // --- FORM STATE ---
  const [newMeeting, setNewMeeting] = useState({
    title: "",
    course: "",
    date: "",
    time: "",
    link: ""
  });

  // --- 1. FETCH DATA ---
  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/meetings");
      if (response.ok) {
        const data = await response.json();
        setMeetings(data);
      }
    } catch (error) {
      console.error("Error fetching meetings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleChange = (e) => {
    setNewMeeting({ ...newMeeting, [e.target.name]: e.target.value });
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    try {
        const response = await fetch("/api/meetings/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...newMeeting, role: role }), 
        });

        if (response.ok) {
            alert("Meeting Broadcast Initialized!");
            setShowModal(false);
            setNewMeeting({ title: "", course: "", date: "", time: "", link: "" });
            fetchMeetings();
        }
    } catch (error) {
        console.error("Failed to schedule meeting:", error);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Purge this session from grid?")) return;
    try {
        const response = await fetch(`/api/meetings/delete/${id}`, {
            method: "DELETE",
        });
        if (response.ok) fetchMeetings();
    } catch (error) {
        console.error("Error deleting meeting:", error);
    }
  };

  const handleJoin = (meetingLink) => {
    if (meetingLink) {
        window.open(meetingLink, "_blank");
    } else {
        alert("Transmission link missing.");
    }
  };

  return (
    <div className="p-6 md:p-10 bg-[#070B14] min-h-screen font-sans text-gray-200 relative">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-black italic text-white tracking-tighter uppercase leading-none">
            Virtual <span className="text-emerald-500">Conferences</span>
          </h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">Access secure uplink nodes for live learning sessions.</p>
        </div>

        {canSchedule && (
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-[#070B14] font-black rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:bg-emerald-400 transition-all transform active:scale-95 uppercase text-xs tracking-widest"
          >
            <FiPlus className="w-5 h-5" /> Initialize Session
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* --- LEFT COLUMN: Quick Uplinks --- */}
        <div className="bg-[#0F172A] rounded-3xl shadow-2xl border border-gray-800 p-8 flex flex-col">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-6">Quick Relays</h2>
          <div className="space-y-4">
             <button 
                onClick={() => window.open("https://meet.google.com/new", "_blank")}
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-[#070B14] border border-gray-800 text-white rounded-2xl font-bold hover:border-emerald-500/50 transition-all text-sm shadow-inner group"
             >
                <img src="https://www.gstatic.com/images/branding/product/1x/meet_96dp.png" className="w-5 h-5 opacity-80 group-hover:opacity-100" alt="Meet" />
                Google Meet Uplink
             </button>
             <button 
                onClick={() => window.open("https://zoom.us/start/videomeeting", "_blank")}
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-[#2D8CFF]/10 border border-[#2D8CFF]/20 text-[#2D8CFF] rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-[#2D8CFF]/20 transition-all shadow-lg"
             >
                <FiVideo className="text-lg" /> Launch Zoom Node
             </button>
          </div>
        </div>

        {/* --- RIGHT COLUMN: Stats --- */}
        <div className="lg:col-span-2 bg-[#0F172A] rounded-3xl shadow-2xl border border-gray-800 p-8">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-6">Grid Status</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             <motion.div initial={{opacity:0}} animate={{opacity:1}} className="p-6 bg-[#070B14] rounded-2xl border border-gray-800 shadow-inner flex items-center gap-5">
                <div className="text-4xl font-black text-emerald-500 tracking-tighter">{meetings.length}</div>
                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-tight">Scheduled<br/>Transmissions</div>
             </motion.div>
             <div className="p-6 bg-[#070B14] rounded-2xl border border-gray-800 shadow-inner flex items-center gap-5">
                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 border border-emerald-500/20"><FiUsers size={24}/></div>
                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-tight">Active Grid<br/>Nodes</div>
             </div>
          </div>
        </div>
      </div>

      {/* --- MEETINGS LIST --- */}
      <div className="bg-[#0F172A] rounded-3xl border border-gray-800 shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-800 bg-[#1E293B]/20 flex justify-between items-center">
            <h2 className="text-sm font-black uppercase tracking-widest text-white italic flex items-center gap-3">
                <FiCalendar className="text-emerald-500" /> Upcoming Transmissions
            </h2>
            <button onClick={fetchMeetings} className="p-2 text-gray-500 hover:text-emerald-500 transition-all"><FiRefreshCw className={loading ? 'animate-spin' : ''} /></button>
        </div>
        
        <div className="divide-y divide-gray-800/50">
          {loading ? (
             <div className="p-20 flex flex-col items-center justify-center text-emerald-500">
                <FiLoader className="w-10 h-10 animate-spin mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Syncing Frequencies...</p>
             </div>
          ) : meetings.length === 0 ? (
             <div className="p-20 text-center">
                <div className="bg-[#070B14] p-6 rounded-full inline-block mb-4 border border-gray-800"><FiVideo size={40} className="text-gray-700 opacity-30" /></div>
                <p className="text-gray-600 font-black uppercase tracking-widest text-xs">No active signals detected in core database.</p>
                {canSchedule && <p className="text-[9px] text-emerald-500/50 mt-3 font-bold uppercase tracking-widest">Initialize a node to begin broadcast.</p>}
             </div>
          ) : (
            meetings.map((meeting, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={meeting._id} 
              className="group p-8 hover:bg-emerald-500/5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="flex items-center gap-6">
                <div className="h-14 w-14 rounded-2xl bg-[#070B14] border border-gray-800 text-emerald-500 flex items-center justify-center font-black text-2xl shadow-inner group-hover:bg-emerald-500 group-hover:text-[#070B14] transition-all duration-300">
                  {meeting.title ? meeting.title.charAt(0).toUpperCase() : "M"}
                </div>
                <div>
                  <h3 className="text-xl font-black text-white group-hover:text-emerald-400 transition-colors uppercase italic tracking-tight">
                    {meeting.title}
                  </h3>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Sector: {meeting.course}</p>
                  <div className="flex flex-wrap items-center gap-6 mt-3 text-[10px] font-bold text-gray-600 uppercase tracking-tighter">
                      <span className="flex items-center gap-2"><FiCalendar className="text-emerald-500/50" /> {meeting.date}</span>
                      <span className="flex items-center gap-2"><FiClock className="text-emerald-500/50" /> {meeting.time}</span>
                      <span className="flex items-center gap-2 text-emerald-500/80"><FiLink /> Secure Relay</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 items-center">
                {canSchedule && (
                    <button 
                        onClick={() => handleDelete(meeting._id)} 
                        className="p-3 text-gray-600 hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-xl transition-all"
                        title="Purge Node"
                    >
                        <FiTrash2 size={18} />
                    </button>
                )}
                
                <button 
                  onClick={() => handleJoin(meeting.link)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-3 bg-emerald-500 text-[#070B14] rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all active:scale-95"
                >
                  <CiVideoOn className="text-lg stroke-2" /> Join Uplink
                </button>
              </div>
            </motion.div>
          )))}
        </div>
      </div>

      {/* --- SCHEDULE MODAL --- */}
      <AnimatePresence>
      {showModal && (
        <div className="fixed inset-0 bg-[#070B14]/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-[#0F172A] rounded-[32px] shadow-[0_0_60px_rgba(0,0,0,0.6)] w-full max-w-lg border border-gray-800 overflow-hidden"
            >
                <div className="px-10 py-7 border-b border-gray-800 flex justify-between items-center bg-[#1E293B]/30">
                    <h3 className="text-xl font-black italic text-white uppercase tracking-tighter">Initialize Session</h3>
                    <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white transition-colors p-2 bg-white/5 rounded-full">
                        <FiX size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleSchedule} className="p-10 space-y-6">
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Session Identity</label>
                        <input required name="title" value={newMeeting.title} onChange={handleChange} type="text" className="w-full bg-[#070B14] border border-gray-800 rounded-2xl px-5 py-4 focus:border-emerald-500/50 outline-none text-white text-sm font-bold transition-all placeholder-gray-800" placeholder="Node Title..." />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Grid Sector</label>
                        <input required name="course" value={newMeeting.course} onChange={handleChange} type="text" className="w-full bg-[#070B14] border border-gray-800 rounded-2xl px-5 py-4 focus:border-emerald-500/50 outline-none text-white text-sm font-bold transition-all placeholder-gray-800" placeholder="e.g. BSCS-01" />
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Quantum Date</label>
                            <input required name="date" value={newMeeting.date} onChange={handleChange} type="date" className="w-full bg-[#070B14] border border-gray-800 rounded-2xl px-5 py-4 focus:border-emerald-500/50 outline-none text-gray-400 text-xs font-bold transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Grid Time</label>
                            <input required name="time" value={newMeeting.time} onChange={handleChange} type="time" className="w-full bg-[#070B14] border border-gray-800 rounded-2xl px-5 py-4 focus:border-emerald-500/50 outline-none text-gray-400 text-xs font-bold transition-all" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Transmission Uplink (URL)</label>
                        <input required name="link" value={newMeeting.link} onChange={handleChange} type="url" className="w-full bg-[#070B14] border border-gray-800 rounded-2xl px-5 py-4 focus:border-emerald-500/50 outline-none text-white text-sm font-bold transition-all placeholder-gray-800" placeholder="https://live-uplink.node/relay" />
                    </div>

                    <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-800">
                        <button type="button" onClick={() => setShowModal(false)} className="px-8 py-4 rounded-xl border border-gray-800 text-gray-500 font-black text-[10px] uppercase tracking-widest hover:text-white hover:bg-white/5 transition-all">Abort</button>
                        <button type="submit" className="px-10 py-4 bg-emerald-500 text-[#070B14] font-black rounded-xl shadow-lg hover:bg-emerald-400 transition-all uppercase text-[10px] tracking-widest">
                            Broadcast Node
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
      )}
      </AnimatePresence>

    </div>
  );
};

// Sub-component for Refresh Icon
const FiRefreshCw = ({ className }) => (
  <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
    <polyline points="23 4 23 10 17 10"></polyline>
    <polyline points="1 20 1 14 7 14"></polyline>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
  </svg>
);

export default VideoConferencing;