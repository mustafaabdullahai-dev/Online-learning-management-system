import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { 
    FiPlus, FiSearch, FiFilter, FiEdit, FiTrash2, FiFileText, 
    FiCheckSquare, FiClock, FiCalendar, FiUsers, FiDownload, FiAlertCircle, FiX 
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion"; // Consistently added for theme smoothness

// --- Icons & Colors Map (Updated for Terminal Theme) ---
const typeConfig = {
    Quiz: { icon: <FiCheckSquare />, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    Assignment: { icon: <FiFileText />, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
    Project: { icon: <FiUsers />, color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20" },
    Exam: { icon: <FiAlertCircle />, color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20" },
};

const Assessments = () => {
    const role = localStorage.getItem("role");
    
    // --- States ---
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Filters
    const [search, setSearch] = useState("");
    const [courseList, setCourseList] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState("All");
    const [selectedType, setSelectedType] = useState("All");

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAssessment, setEditingAssessment] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);

    // --- 1. Fetch Course List ---
    const fetchCourseList = useCallback(async () => {
        const token = localStorage.getItem("token");
        try {
            const response = await fetch('/api/courses/simple', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setCourseList(data);
            }
        } catch (err) {
            console.error("Error fetching courses:", err);
        }
    }, []);

    // --- 2. Fetch Assessments ---
    const fetchAssessments = useCallback(async () => {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");
        let url = '/api/assessments';
        
        if (selectedCourse !== "All") {
            url += `?courseId=${selectedCourse}`;
        }

        try {
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) {
                const errData = await response.json();
                if (response.status === 403) setError("Terminal Access Denied.");
                else throw new Error(errData.error || "Failed to fetch assessments");
            } else {
                const data = await response.json();
                setAssessments(data);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [selectedCourse]);

    useEffect(() => {
        fetchCourseList();
        fetchAssessments();
    }, [fetchCourseList, fetchAssessments]);

    // --- 3. Handle Submit (Create/Edit) ---
    const handleModalSubmit = async (e) => {
        e.preventDefault();
        setModalLoading(true);
        const token = localStorage.getItem("token");
        const formData = new FormData(e.target);
        
        let url = '/api/assessments';
        let method = 'POST';

        if (editingAssessment) {
            url = `/api/assessments/${editingAssessment._id}`;
            method = 'PUT';
        }

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Upload failed");
            }
            
            setIsModalOpen(false);
            setEditingAssessment(null);
            fetchAssessments();
        } catch (err) {
            alert(err.message);
        } finally {
            setModalLoading(false);
        }
    };

    // --- 4. Delete Assessment ---
    const handleDelete = async (id) => {
        if (!window.confirm("Purge node? This will delete all associated submissions.")) return;
        
        const token = localStorage.getItem("token");
        try {
            const response = await fetch(`/api/assessments/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) fetchAssessments();
            else alert("Deletion sequence failed.");
        } catch (err) {
            alert(err.message);
        }
    };

    // --- 5. Client-Side Filtering ---
    const filteredAssessments = assessments.filter(a => {
        const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase());
        const matchesType = selectedType === "All" || a.type === selectedType;
        return matchesSearch && matchesType;
    });

    // --- Render ---
    if (loading && assessments.length === 0) return (
        <div className="flex flex-col h-screen justify-center items-center bg-[#070B14]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            <p className="text-emerald-500 font-black uppercase tracking-[0.3em] text-[10px] mt-4 animate-pulse">Syncing Assessments...</p>
        </div>
    );

    if (error) return (
        <div className="flex items-center justify-center bg-[#070B14] h-screen text-red-500 font-black uppercase tracking-widest text-sm">
            {error}
        </div>
    );

    return (
        <div className="p-6 md:p-10 bg-[#070B14] min-h-screen font-sans text-gray-200">
            
            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                <div>
                    <h1 className="text-3xl font-black italic text-white tracking-tighter uppercase leading-none">Global <span className="text-emerald-500">Assessments</span></h1>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">Manage quizzes, assignments, and secure exams.</p>
                </div>
                {(role === 'admin' || role === 'instructor') && (
                    <button 
                        onClick={() => { setEditingAssessment(null); setIsModalOpen(true); }}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-[#070B14] font-black rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:bg-emerald-400 transition-all transform active:scale-95 uppercase text-xs tracking-widest"
                    >
                        <FiPlus className="w-5 h-5" /> Initialize Node
                    </button>
                )}
            </div>

            {/* --- FILTERS TOOLBAR --- */}
            <div className="bg-[#0F172A] p-2 rounded-2xl shadow-2xl border border-gray-800 mb-8 flex flex-col md:flex-row gap-2">
                {/* Search */}
                <div className="relative flex-1 group">
                    <span className="absolute left-4 top-3.5 text-gray-500 group-focus-within:text-emerald-500 transition-colors"><FiSearch className="w-5 h-5"/></span>
                    <input 
                        type="text" 
                        placeholder="Search node title..." 
                        className="w-full pl-12 pr-4 py-3.5 bg-[#070B14] border border-gray-800 rounded-xl focus:outline-none focus:border-emerald-500/50 transition-all text-sm font-bold text-white placeholder-gray-600"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Filters Group */}
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:min-w-[200px]">
                        <span className="absolute left-3 top-4 text-emerald-500/50 z-10"><FiFilter className="w-4 h-4"/></span>
                        <select 
                            className="w-full pl-10 pr-8 py-3.5 bg-[#070B14] border border-gray-800 rounded-xl focus:outline-none focus:border-emerald-500/50 appearance-none cursor-pointer text-[11px] font-black uppercase tracking-widest text-gray-400"
                            value={selectedCourse}
                            onChange={(e) => setSelectedCourse(e.target.value)}
                        >
                            <option value="All">All Course Nodes</option>
                            {courseList.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                        </select>
                    </div>

                    <div className="relative flex-1 md:min-w-[150px]">
                        <select 
                            className="w-full px-5 py-3.5 bg-[#070B14] border border-gray-800 rounded-xl focus:outline-none focus:border-emerald-500/50 appearance-none cursor-pointer text-[11px] font-black uppercase tracking-widest text-gray-400"
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                        >
                            <option value="All">All Formats</option>
                            <option value="Quiz">Quizzes</option>
                            <option value="Assignment">Assignments</option>
                            <option value="Project">Projects</option>
                            <option value="Exam">Exams</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* --- ASSESSMENTS GRID --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                {filteredAssessments.map((item, idx) => {
                    const config = typeConfig[item.type] || typeConfig['Assignment'];
                    return (
                        <motion.div 
                            key={item._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="group bg-[#0F172A] rounded-3xl p-7 border border-gray-800 shadow-2xl hover:border-emerald-500/30 hover:-translate-y-1 transition-all duration-300 flex flex-col"
                        >
                            {/* Top: Icon & Status */}
                            <div className="flex justify-between items-start mb-6">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${config.bg} ${config.color} border ${config.border}`}>
                                    {config.icon}
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border ${item.status === 'Published' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                                    {item.status}
                                </span>
                            </div>

                            {/* Info */}
                            <div className="mb-8">
                                <h3 className="text-xl font-black text-white leading-none tracking-tight mb-2 group-hover:text-emerald-400 transition-colors italic uppercase">{item.title}</h3>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">{item.course}</p>
                                
                                <div className="space-y-2.5">
                                    <div className="flex items-center gap-3 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                        <FiCalendar className="text-emerald-500/50" /> 
                                        <span>Deadline: {new Date(item.due).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                        <FiClock className="text-emerald-500/50" /> 
                                        <span>Time: {new Date(item.due).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                    {item.assignment_file_path && (
                                        <div className="flex items-center gap-2 text-[10px] text-blue-400 font-black uppercase tracking-tighter mt-3 bg-blue-400/5 w-fit px-2 py-1 rounded-md border border-blue-400/10">
                                            <FiDownload /> Data Packet Attached
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions Footer */}
                            <div className="pt-6 border-t border-gray-800 flex items-center gap-3 mt-auto">
                                {(role === 'admin' || role === 'instructor') ? (
                                    <>
                                        <Link 
                                            to={`/assessments/${item._id}/grading`} 
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-[#070B14] rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg"
                                        >
                                            <FiCheckSquare size={16}/> Grade ({item.submissions})
                                        </Link>
                                        <button onClick={() => { setEditingAssessment(item); setIsModalOpen(true); }} className="p-3 text-gray-400 hover:text-emerald-400 bg-white/5 border border-gray-800 rounded-xl transition-all hover:border-emerald-500/30"><FiEdit size={18} /></button>
                                        <button onClick={() => handleDelete(item._id)} className="p-3 text-gray-500 hover:text-red-500 bg-white/5 border border-gray-800 rounded-xl transition-all hover:border-red-500/30"><FiTrash2 size={18} /></button>
                                    </>
                                ) : (
                                    <Link 
                                        to={`/courses/view/${item.course_id}`} 
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-transparent border border-gray-700 text-gray-400 rounded-xl text-xs font-black uppercase tracking-[0.2em] hover:border-emerald-500 hover:text-emerald-500 transition-all shadow-inner"
                                    >
                                        Access Sector
                                    </Link>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
                </AnimatePresence>
            </div>

            {filteredAssessments.length === 0 && !loading && (
                <div className="text-center py-24 bg-[#0F172A] rounded-3xl border border-dashed border-gray-800">
                    <FiCheckSquare className="w-12 h-12 mx-auto text-gray-700 mb-4 opacity-30" />
                    <p className="text-gray-500 font-black uppercase tracking-widest text-xs">No active nodes detected on this frequency.</p>
                </div>
            )}

            {/* --- CREATE / EDIT MODAL --- */}
            <AnimatePresence>
            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-[#070B14]/90 backdrop-blur-md z-[100] p-4">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-[#0F172A] border border-gray-800 rounded-[32px] shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden"
                    >
                        <div className="px-10 py-7 border-b border-gray-800 flex justify-between items-center bg-[#1E293B]/30">
                            <h2 className="text-xl font-black italic text-white uppercase tracking-tighter">
                                {editingAssessment ? "Modify Node" : "Initialize Node"}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white transition-colors p-2 bg-white/5 rounded-full outline-none"><FiX size={20}/></button>
                        </div>
                        
                        <form onSubmit={handleModalSubmit} encType="multipart/form-data" className="p-10 overflow-y-auto custom-scrollbar space-y-7">
                            
                            {/* Title */}
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Node Identifier</label>
                                <input name="title" defaultValue={editingAssessment?.title || ""} required className="w-full bg-[#070B14] border border-gray-800 rounded-2xl px-5 py-4 focus:border-emerald-500/50 outline-none text-white text-sm font-bold transition-all"/>
                            </div>

                            {/* Course & Type */}
                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Grid Sector</label>
                                    <select name="course_id" defaultValue={editingAssessment?.course_id || ""} required className="w-full bg-[#070B14] border border-gray-800 rounded-2xl px-5 py-4 focus:border-emerald-500/50 outline-none text-gray-400 text-xs font-bold appearance-none cursor-pointer">
                                        <option value="" disabled>Select Sector</option>
                                        {courseList.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Node Format</label>
                                    <select name="type" defaultValue={editingAssessment?.type || "Quiz"} required className="w-full bg-[#070B14] border border-gray-800 rounded-2xl px-5 py-4 focus:border-emerald-500/50 outline-none text-gray-400 text-xs font-bold appearance-none cursor-pointer">
                                        <option value="Quiz">Quiz</option>
                                        <option value="Assignment">Assignment</option>
                                        <option value="Project">Project</option>
                                        <option value="Exam">Exam</option>
                                    </select>
                                </div>
                            </div>

                            {/* Date & Points */}
                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Quantum Deadline</label>
                                    <input 
                                        name="due_date" 
                                        type="datetime-local" 
                                        defaultValue={editingAssessment?.due ? new Date(editingAssessment.due).toISOString().slice(0, 16) : ""} 
                                        required 
                                        className="w-full bg-[#070B14] border border-gray-800 rounded-2xl px-5 py-4 focus:border-emerald-500/50 outline-none text-white text-xs font-bold transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Credits Allocation</label>
                                    <input name="total_points" type="number" defaultValue={editingAssessment?.total_points || 100} required className="w-full bg-[#070B14] border border-gray-800 rounded-2xl px-5 py-4 focus:border-emerald-500/50 outline-none text-white text-sm font-bold transition-all"/>
                                </div>
                            </div>

                            {/* File Upload */}
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Data Transmission Packet</label>
                                <div className="relative group">
                                    <input 
                                        name="assignment_file" 
                                        type="file" 
                                        className="w-full text-[10px] font-black uppercase text-gray-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-white/5 file:text-white hover:file:bg-white/10 cursor-pointer bg-[#070B14] rounded-2xl border border-gray-800 p-2"
                                    />
                                </div>
                                {editingAssessment?.assignment_file_path && <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-2 ml-1">Active transmission detected. Uploading replaces packet.</p>}
                            </div>

                            {/* Instructions */}
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Operational Instructions</label>
                                <textarea name="instructions" defaultValue={editingAssessment?.instructions || ""} rows="3" className="w-full bg-[#070B14] border border-gray-800 rounded-2xl px-5 py-4 focus:border-emerald-500/50 outline-none text-white text-sm font-bold transition-all resize-none"></textarea>
                            </div>

                            {/* Status */}
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Network Visibility</label>
                                <select name="status" defaultValue={editingAssessment?.status || "Draft"} className="w-full bg-[#070B14] border border-gray-800 rounded-2xl px-5 py-4 focus:border-emerald-500/50 outline-none text-gray-400 text-xs font-bold appearance-none cursor-pointer">
                                    <option value="Draft">Draft Mode</option>
                                    <option value="Published">Broadcast to Grid</option>
                                </select>
                            </div>

                            {/* Footer Buttons */}
                            <div className="flex justify-end gap-4 pt-6 border-t border-gray-800">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 rounded-xl border border-gray-800 text-gray-500 font-black text-[10px] uppercase tracking-widest hover:text-white hover:bg-white/5 transition-all" disabled={modalLoading}>Abort</button>
                                <button type="submit" className={`px-10 py-4 bg-emerald-500 text-[#070B14] rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-emerald-400 transition-all ${modalLoading ? 'opacity-50 cursor-wait' : ''}`} disabled={modalLoading}>
                                    {modalLoading ? "Transmitting..." : (editingAssessment ? "Update Signal" : "Initialize Signal")}
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
            `}</style>
        </div>
    );
};

export default Assessments;