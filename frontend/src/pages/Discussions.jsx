import React, { useState, useEffect, useCallback } from "react";
import { FiMessageSquare, FiPlus, FiSearch, FiFilter, FiUser, FiClock, FiArrowRight, FiX } from "react-icons/fi";
import { Link } from "react-router-dom"; 
import { motion, AnimatePresence } from "framer-motion"; // Consistently added for smoothness

const Discussions = () => {
    const [search, setSearch] = useState("");
    const [discussions, setDiscussions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); 

    // --- Modal State ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newDiscussionData, setNewDiscussionData] = useState({ title: '', course_id: '', content: '' });
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState(null);

    // --- Course List State ---
    const [courseList, setCourseList] = useState([]);
    const [courseListError, setCourseListError] = useState(null);
    const [selectedCourseFilter, setSelectedCourseFilter] = useState("All");

    // --- Fetch Simple Course List ---
    const fetchCourseList = useCallback(async () => {
        setCourseListError(null);
        const token = localStorage.getItem("token");
        try {
            const response = await fetch('/api/courses/simple', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Failed to fetch courses for filter');
            const data = await response.json();
            setCourseList(data);
        } catch (err) {
            console.error("Error fetching course list:", err);
            setCourseListError("Could not load course options.");
        }
    }, []);

    // --- Fetch Discussions Function ---
    const fetchDiscussions = useCallback(async () => {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");
        let url = '/api/discussions';
        if (selectedCourseFilter !== "All") {
            url += `?courseId=${selectedCourseFilter}`;
        }

        try {
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) {
                const errData = await response.json();
                if (response.status === 403) { setError("Terminal Access Denied. Sector Locked."); }
                else { throw new Error(errData.error || "Failed to fetch discussions"); }
            } else {
                const data = await response.json();
                setDiscussions(data);
            }
        } catch (err) {
             setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [selectedCourseFilter]);

    // --- Initial Data Fetch ---
    useEffect(() => {
        fetchCourseList();
    }, [fetchCourseList]);

    useEffect(() => {
        fetchDiscussions();
    }, [fetchDiscussions]);


    // --- Handle Input Change in Modal ---
    const handleModalInputChange = (e) => {
        const { name, value } = e.target;
        setNewDiscussionData(prev => ({ ...prev, [name]: value }));
    };

    // --- Handle New Discussion Submit ---
    const handleNewDiscussionSubmit = async (e) => {
        e.preventDefault();
        setModalLoading(true);
        setModalError(null);
        const token = localStorage.getItem("token");

        if (!newDiscussionData.course_id) {
            setModalError("Identify course sector for broadcast.");
            setModalLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/discussions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(newDiscussionData),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Broadcast sequence failed");
            }
            setIsModalOpen(false);
            setNewDiscussionData({ title: '', course_id: '', content: '' }); 
            fetchDiscussions(); 
        } catch (err) {
            setModalError(err.message);
        } finally {
            setModalLoading(false);
        }
    };


    // --- Filtering Logic (Search) ---
    const filteredDiscussions = discussions.filter((discussion) =>
        discussion.title.toLowerCase().includes(search.toLowerCase())
    );

    if (loading && discussions.length === 0) return (
        <div className="flex flex-col h-screen justify-center items-center bg-[#070B14]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            <p className="text-emerald-500 font-black uppercase tracking-[0.3em] text-[10px] mt-4 animate-pulse">Syncing Forum Frequencies...</p>
        </div>
    );

    if (error) return (
        <div className="p-8 bg-[#070B14] min-h-screen flex justify-center items-center font-sans text-white">
            <div className="bg-[#0F172A] p-10 rounded-[32px] shadow-2xl text-center border border-red-500/20 max-w-md">
                <h1 className="text-xl font-black text-white mb-2 uppercase tracking-widest italic">Connection Failed</h1>
                <p className="text-red-500 font-bold uppercase text-xs tracking-tighter">{error}</p>
                <button onClick={fetchDiscussions} className="mt-8 px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all">Retry Link</button>
            </div>
        </div>
    );

    return (
        <div className="p-6 md:p-10 bg-[#070B14] min-h-screen font-sans text-gray-200">
            
            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                <div>
                    <h1 className="text-3xl font-black italic text-white tracking-tighter uppercase leading-none">Community <span className="text-emerald-500">Forum</span></h1>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">Join the open frequency, broadcast queries, and share logs.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-[#070B14] font-black rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:bg-emerald-400 transition-all transform active:scale-95 uppercase text-xs tracking-widest"
                >
                    <FiPlus className="w-5 h-5" /> Initialize Log
                </button>
            </div>

            {/* --- FILTERS & SEARCH --- */}
            <div className="bg-[#0F172A] p-2 rounded-2xl shadow-2xl border border-gray-800 mb-8 flex flex-col md:flex-row gap-2">
                {/* Search */}
                <div className="relative flex-1 group">
                    <span className="absolute left-4 top-3.5 text-gray-500 group-focus-within:text-emerald-500 transition-colors">
                        <FiSearch className="w-5 h-5" />
                    </span>
                    <input
                        type="text"
                        className="w-full pl-12 pr-4 py-3.5 bg-[#070B14] border border-gray-800 rounded-xl focus:outline-none focus:border-emerald-500/50 transition-all text-sm font-bold text-white placeholder-gray-600 shadow-inner"
                        placeholder="Scan for logs..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Course Filter */}
                <div className="relative w-full md:w-72">
                    <span className="absolute left-4 top-4 text-emerald-500/50 z-10">
                        <FiFilter className="w-4 h-4" />
                    </span>
                    <select
                        className="w-full pl-12 pr-10 py-3.5 bg-[#070B14] border border-gray-800 rounded-xl focus:outline-none focus:border-emerald-500/50 transition-all appearance-none cursor-pointer text-[11px] font-black uppercase tracking-widest text-gray-400"
                        value={selectedCourseFilter}
                        onChange={(e) => setSelectedCourseFilter(e.target.value)}
                        disabled={loading || !!courseListError}
                    >
                        <option value="All">All Course Frequencies</option>
                        {courseList.map((course) => (
                            <option key={course._id} value={course._id}>
                                {course.title}
                            </option>
                        ))}
                    </select>
                    <span className="absolute right-4 top-4 text-gray-600 pointer-events-none text-[10px]">▼</span>
                </div>
            </div>

            {/* --- DISCUSSIONS LIST --- */}
            <div className="grid grid-cols-1 gap-5">
                <AnimatePresence>
                {filteredDiscussions.map((discussion, idx) => (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={discussion._id}
                        className={`group relative bg-[#0F172A] p-6 rounded-3xl border transition-all duration-300 hover:border-emerald-500/30 hover:shadow-[0_0_30px_rgba(0,0,0,0.3)]
                            ${discussion.hasUnread ? 'border-l-4 border-l-emerald-500 border-gray-800' : 'border-gray-800'}
                        `}
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            
                            {/* Left: Avatar & Info */}
                            <div className="flex items-start gap-5 flex-1">
                                <div className="w-14 h-14 rounded-2xl bg-[#070B14] border border-gray-800 text-emerald-500 flex items-center justify-center font-black text-xl shadow-inner group-hover:bg-emerald-500 group-hover:text-[#070B14] transition-all">
                                    {discussion.initials}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                        <Link to={`/discussions/${discussion._id}`} className="hover:text-emerald-400 transition-colors">
                                            <h3 className="text-xl font-black text-white truncate italic uppercase tracking-tight leading-none">
                                                {discussion.title}
                                            </h3>
                                        </Link>
                                        {discussion.hasUnread && (
                                            <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                                                Active Link
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center gap-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                        <span className="flex items-center gap-1.5">
                                            <FiUser className="text-emerald-500/50" /> {discussion.starter}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <FiClock className="text-emerald-500/50" /> {discussion.time.split(' ')[0]}
                                        </span>
                                        <Link to={`/courses/view/${discussion.course_id}`} className="hidden sm:inline-block px-2.5 py-1 bg-[#070B14] text-emerald-500/70 border border-gray-800 rounded-lg hover:border-emerald-500/30 transition-all">
                                            Sector: {discussion.course}
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Stats & Action */}
                            <div className="flex items-center gap-8 justify-between md:justify-end w-full md:w-auto border-t md:border-t-0 pt-5 md:pt-0 border-gray-800">
                                <div className="text-center md:text-right px-4 bg-[#070B14] py-2 rounded-2xl border border-gray-800 shadow-inner">
                                    <p className="text-2xl font-black text-emerald-500 leading-none tracking-tighter">{discussion.replies}</p>
                                    <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mt-0.5">Logs</p>
                                </div>
                                
                                <Link
                                    to={`/discussions/${discussion._id}`}
                                    className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#070B14] border border-gray-800 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-[#070B14] transition-all shadow-lg shadow-emerald-500/5"
                                >
                                    <FiArrowRight size={20} />
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                ))}
                </AnimatePresence>

                {filteredDiscussions.length === 0 && !loading && (
                    <div className="text-center py-24 bg-[#0F172A] rounded-[40px] border border-dashed border-gray-800 shadow-inner">
                        <div className="inline-flex p-6 rounded-full bg-[#070B14] border border-gray-800 mb-4 text-gray-700 shadow-2xl">
                            <FiMessageSquare size={40} className="opacity-30" />
                        </div>
                        <p className="text-gray-500 font-black uppercase tracking-widest text-xs">No active frequencies detected.</p>
                        <button onClick={() => {setSearch(""); setSelectedCourseFilter("All")}} className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em] mt-4 hover:text-emerald-400 transition-colors">Reset Grid</button>
                    </div>
                )}
            </div>

            {/* --- NEW DISCUSSION MODAL --- */}
            <AnimatePresence>
            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-[#070B14]/90 backdrop-blur-md z-[100] p-4">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-[#0F172A] border border-gray-800 rounded-[32px] w-full max-w-lg shadow-[0_0_60px_rgba(0,0,0,0.6)] flex flex-col max-h-[90vh] overflow-hidden"
                    >
                        <div className="flex justify-between items-center px-10 py-7 border-b border-gray-800 bg-[#1E293B]/30">
                            <h2 className="text-xl font-black italic text-white uppercase tracking-tighter">Initialize Log</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white transition-colors p-2 bg-white/5 rounded-full"><FiX size={20}/></button>
                        </div>
                        
                        <form onSubmit={handleNewDiscussionSubmit} className="flex-grow overflow-y-auto custom-scrollbar p-10 space-y-7">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Topic Identifier</label>
                                <input 
                                    name="title" 
                                    value={newDiscussionData.title} 
                                    onChange={handleModalInputChange} 
                                    required 
                                    placeholder="e.g., SYNC-001 Protocol Error"
                                    className="w-full bg-[#070B14] border border-gray-800 rounded-2xl px-5 py-4 focus:border-emerald-500/50 outline-none text-white text-sm font-bold transition-all placeholder-gray-800 shadow-inner"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Grid Sector Context</label>
                                <div className="relative">
                                    <select 
                                        name="course_id" 
                                        value={newDiscussionData.course_id} 
                                        onChange={handleModalInputChange} 
                                        required 
                                        className="w-full bg-[#070B14] border border-gray-800 rounded-2xl px-5 py-4 focus:border-emerald-500/50 outline-none text-gray-400 text-xs font-black uppercase tracking-widest appearance-none cursor-pointer shadow-inner"
                                    >
                                        <option value="" disabled>Identify target sector</option>
                                        {courseList.map(course => (<option key={course._id} value={course._id}>{course.title}</option>))}
                                    </select>
                                    <span className="absolute right-5 top-5 text-gray-600 pointer-events-none text-[10px]">▼</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Transmission Content</label>
                                <textarea 
                                    name="content" 
                                    value={newDiscussionData.content} 
                                    onChange={handleModalInputChange} 
                                    required 
                                    rows="5" 
                                    className="w-full bg-[#070B14] border border-gray-800 rounded-2xl px-5 py-4 focus:border-emerald-500/50 outline-none text-white text-sm font-bold transition-all resize-none placeholder-gray-800 shadow-inner" 
                                    placeholder="Input your query data or broadcast details..."
                                ></textarea>
                            </div>

                            {modalError && (
                                <div className="p-4 bg-red-500/5 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-xl text-center">
                                    Transmission Error: {modalError}
                                </div>
                            )}

                            <div className="flex justify-end gap-4 pt-6 border-t border-gray-800 mt-5">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 rounded-xl border border-gray-800 text-gray-500 font-black text-[10px] uppercase tracking-widest hover:text-white hover:bg-white/5 transition-all" disabled={modalLoading}>Abort</button>
                                <button type="submit" className={`px-10 py-4 bg-emerald-500 text-[#070B14] rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-emerald-400 transition-all ${modalLoading ? 'opacity-50 cursor-wait' : ''}`} disabled={modalLoading}>
                                    {modalLoading ? "Transmitting..." : "Release Broadcast"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
            </AnimatePresence>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 10px; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
            `}</style>
        </div>
    );
};

export default Discussions;