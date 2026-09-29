import React, { useState, useEffect, useCallback } from "react";
import { 
    FiEdit, FiEye, FiTrash2, FiUploadCloud, FiLink, FiVideo, 
    FiFileText, FiFilter, FiSearch, FiExternalLink, FiPlus, FiX 
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion"; // Consistently added for theme smoothness

// --- Configuration (Updated for Terminal Theme) ---
const typeIcons = {
    Video: <FiVideo className="w-5 h-5 text-emerald-500" />,
    Document: <FiFileText className="w-5 h-5 text-blue-400" />,
    Link: <FiLink className="w-5 h-5 text-purple-400" />,
};

const tabs = ["All Content", "Videos", "Documents", "Links"];

const ContentDelivery = () => {
    const userRole = localStorage.getItem("role");
    
    // --- States ---
    const [activeTab, setActiveTab] = useState("All Content");
    const [contentItems, setContentItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState(""); 

    // --- Modal States ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingContent, setEditingContent] = useState(null); 
    const [modalLoading, setModalLoading] = useState(false);

    // --- Filter States ---
    const [courseList, setCourseList] = useState([]);
    const [selectedCourseFilter, setSelectedCourseFilter] = useState("All");

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
            console.error("Error fetching course list:", err);
        }
    }, []);

    // --- 2. Fetch Content ---
    const fetchContent = useCallback(async () => {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");
        let url = '/api/content';
        
        if (selectedCourseFilter !== "All") {
            url += `?courseId=${selectedCourseFilter}`;
        }

        try {
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) {
                const errData = await response.json();
                if(response.status === 403){
                     setError("Unauthorized Access. Terminal Locked.");
                } else {
                     throw new Error(errData.error || "Failed to fetch content");
                }
            } else {
                 const data = await response.json();
                 setContentItems(data);
            }
        } catch (err) {
             if (!error) setError(err.message); 
        } finally {
            setLoading(false);
        }
    }, [selectedCourseFilter, error]); 

    useEffect(() => {
        fetchCourseList(); 
        fetchContent(); 
    }, [fetchCourseList, fetchContent]);


    // --- 3. Delete Content ---
    const handleDelete = async (contentId) => {
        if (window.confirm("Are you sure you want to purge this node?")) {
            const token = localStorage.getItem("token");
            try {
                const response = await fetch(`/api/content/${contentId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (!response.ok) throw new Error("Failed to delete content");
                fetchContent(); 
            } catch (err) {
                alert(err.message);
            }
        }
    };

    // --- 4. Handle Modal Submit ---
    const handleModalSubmit = async (e) => {
        e.preventDefault();
        setModalLoading(true);
        const token = localStorage.getItem("token");
        const formData = new FormData(e.target);
        
        const contentData = {
            title: formData.get("title"),
            type: formData.get("type"),
            course_id: formData.get("course_id"),
            url: formData.get("url"), 
            duration: formData.get("duration"), 
            status: formData.get("status"),
        };

        let url = '/api/content';
        let method = 'POST';

        if (editingContent) {
            url = `/api/content/${editingContent._id}`;
            method = 'PUT';
        }

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(contentData),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Operation failed");
            }
            setIsModalOpen(false);
            setEditingContent(null);
            fetchContent(); 
        } catch (err) {
            alert(err.message);
        } finally {
            setModalLoading(false);
        }
    };

    // --- 5. Filtering Logic ---
    const filteredContent = contentItems.filter((item) => {
        let matchesTab = true;
        if (activeTab !== "All Content") {
            const typeMap = { "Videos": "Video", "Documents": "Document", "Links": "Link" };
            matchesTab = item.type === typeMap[activeTab];
        }
        const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase());
        return matchesTab && matchesSearch;
    });

    // --- Render ---
    if (loading && contentItems.length === 0) return (
        <div className="flex flex-col h-screen justify-center items-center bg-[#070B14]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            <p className="text-emerald-500 font-black uppercase tracking-[0.3em] text-[10px] mt-4 animate-pulse">Syncing Library Nodes...</p>
        </div>
    );

    if (error) return <div className="flex items-center justify-center bg-[#070B14] h-screen text-red-500 font-black uppercase tracking-widest text-sm">{error}</div>;

    return (
        <div className="p-6 md:p-10 bg-[#070B14] min-h-screen font-sans text-white">
            
            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-10">
                <div>
                    <h1 className="text-3xl font-black italic text-white tracking-tighter uppercase leading-none">Content <span className="text-emerald-500">Repository</span></h1>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">Manage, organize, and broadcast learning packets.</p>
                </div>

                {(userRole === "admin" || userRole === "instructor" || userRole == "super_admin") && (
                    <button
                        onClick={() => { setEditingContent(null); setIsModalOpen(true); }}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-[#070B14] font-black rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:bg-emerald-400 transition-all transform active:scale-95 uppercase text-xs tracking-widest"
                    >
                        <FiPlus className="w-5 h-5"/> Initialize Node
                    </button>
                )}

            </div>

            {/* --- CONTROLS TOOLBAR --- */}
            <div className="bg-[#0F172A] p-2 rounded-2xl shadow-2xl border border-gray-800 mb-8 flex flex-col xl:flex-row gap-4 justify-between items-center">
                
                <div className="flex flex-col md:flex-row gap-2 w-full flex-1">
                    {/* Search */}
                    <div className="relative group w-full md:w-64">
                        <span className="absolute left-4 top-3.5 text-gray-500 group-focus-within:text-emerald-500 transition-colors"><FiSearch className="w-5 h-5"/></span>
                        <input 
                            type="text" 
                            placeholder="Filter library nodes..." 
                            className="w-full pl-12 pr-4 py-3 bg-[#070B14] border border-gray-800 rounded-xl focus:outline-none focus:border-emerald-500/50 transition-all text-sm font-bold text-white placeholder-gray-600"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 p-1 bg-[#070B14] rounded-xl border border-gray-800 overflow-x-auto no-scrollbar">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-5 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                    activeTab === tab
                                        ? "bg-emerald-500 text-[#070B14] shadow-lg"
                                        : "text-gray-500 hover:text-emerald-400 hover:bg-white/5"
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filter Dropdown */}
                <div className="relative group w-full md:w-64">
                    <span className="absolute left-4 top-3.5 text-emerald-500/50 z-10"><FiFilter className="w-4 h-4" /></span>
                    <select
                        className="w-full pl-10 pr-8 py-3 bg-[#070B14] border border-gray-800 rounded-xl focus:outline-none focus:border-emerald-500/50 transition-all appearance-none cursor-pointer text-[11px] font-black uppercase tracking-widest text-gray-400"
                        value={selectedCourseFilter}
                        onChange={(e) => setSelectedCourseFilter(e.target.value)}
                    >
                        <option value="All">All Sector Nodes</option>
                        {courseList.map((course) => (
                            <option key={course._id} value={course._id}>{course.title}</option>
                        ))}
                    </select>
                    <span className="absolute right-4 top-4 text-gray-600 pointer-events-none text-[10px]">▼</span>
                </div>
            </div>

            {/* --- CONTENT GRID --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                {filteredContent.map((item, idx) => (
                    <motion.div 
                        key={item._id} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group bg-[#0F172A] p-6 rounded-3xl shadow-2xl border border-gray-800 hover:border-emerald-500/30 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                    >
                        <div>
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-3.5 rounded-2xl bg-[#070B14] border border-gray-800 shadow-inner">
                                    {typeIcons[item.type] || <FiLink className="w-6 h-6 text-purple-400"/>}
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border ${
                                    item.status === "Published" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                                }`}>
                                    {item.status}
                                </span>
                            </div>

                            <h3 className="text-xl font-black text-white mb-2 leading-none tracking-tight group-hover:text-emerald-400 transition-colors line-clamp-2 uppercase italic" title={item.title}>
                                {item.title}
                            </h3>
                            
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-5 truncate" title={item.course}>
                                {item.course}
                            </p>

                            {item.duration && (
                                <div className="text-xs text-gray-400 mb-5 flex items-center gap-2">
                                    <span className="bg-[#070B14] px-2 py-1 rounded-md text-[9px] font-black text-emerald-500 uppercase border border-gray-800">Uptime</span>
                                    <span className="font-bold tracking-widest">{item.duration}</span>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="pt-5 border-t border-gray-800 flex items-center gap-3 mt-auto">
    
    {/* Sab ke liye Uplink (View) button */}
    <a 
        href={item.url || '#'} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 text-[#070B14] rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg"
    >
        <FiExternalLink size={16}/> {userRole === "student" ? "Launch Stream" : "Uplink"}
    </a>
    
    {/* Sirf Admin/Instructor ke liye Edit aur Delete */}
    {userRole !== "student" && (
        <>
            <button 
                onClick={() => { setEditingContent(item); setIsModalOpen(true); }} 
                className="p-2.5 text-gray-400 hover:text-emerald-400 bg-white/5 border border-gray-800 rounded-xl transition-all hover:border-emerald-500/30"
                title="Modify Node"
            >
                <FiEdit size={18} />
            </button>
            <button 
                onClick={() => handleDelete(item._id)} 
                className="p-2.5 text-gray-500 hover:text-red-500 bg-white/5 border border-gray-800 rounded-xl transition-all hover:border-red-500/30"
                title="Purge Node"
            >
                <FiTrash2 size={18} />
            </button>
        </>
    )}
</div>
                    </motion.div>
                ))}
                </AnimatePresence>
            </div>

            {filteredContent.length === 0 && !loading && (
                <div className="text-center py-24 bg-[#0F172A] rounded-3xl border border-dashed border-gray-800 shadow-inner">
                    <div className="inline-flex p-5 rounded-2xl bg-[#070B14] mb-4 text-gray-700 border border-gray-800">
                        <FiUploadCloud className="w-10 h-10 opacity-30" />
                    </div>
                    <p className="text-gray-500 font-black uppercase tracking-widest text-xs">No matching nodes found in the library.</p>
                </div>
            )}

            {/* --- MODAL (Create/Edit) --- */}
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
                                 {editingContent ? "Modify Node" : "Initialize Node"}
                             </h2>
                             <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white transition-colors p-2 bg-white/5 rounded-full outline-none"><FiX size={20}/></button>
                         </div>
                         
                         <form onSubmit={handleModalSubmit} className="p-10 overflow-y-auto custom-scrollbar space-y-7">
                             
                             <div className="space-y-2">
                                 <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Node Identifier</label>
                                 <input name="title" defaultValue={editingContent?.title || ""} required className="w-full bg-[#070B14] border border-gray-800 rounded-2xl px-5 py-4 focus:border-emerald-500/50 outline-none text-white text-sm font-bold transition-all"/>
                             </div>
                             
                             <div className="grid grid-cols-2 gap-5">
                                 <div className="space-y-2">
                                     <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Transmission Type</label>
                                     <select name="type" defaultValue={editingContent?.type || "Video"} required className="w-full bg-[#070B14] border border-gray-800 rounded-2xl px-5 py-4 focus:border-emerald-500/50 outline-none text-gray-400 text-xs font-bold appearance-none cursor-pointer">
                                         <option value="Video">Video Stream</option>
                                         <option value="Document">Packet Document</option>
                                         <option value="Link">External Uplink</option>
                                     </select>
                                 </div>
                                 <div className="space-y-2">
                                     <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Visibility</label>
                                     <select name="status" defaultValue={editingContent?.status || "Draft"} required className="w-full bg-[#070B14] border border-gray-800 rounded-2xl px-5 py-4 focus:border-emerald-500/50 outline-none text-gray-400 text-xs font-bold appearance-none cursor-pointer">
                                         <option value="Draft">Draft Mode</option>
                                         <option value="Published">Public Relay</option>
                                     </select>
                                 </div>
                             </div>

                             <div className="space-y-2">
                                 <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Grid Sector Context</label>
                                 <div className="relative">
                                     <select name="course_id" defaultValue={editingContent?.course_id || ""} required className="w-full bg-[#070B14] border border-gray-800 rounded-2xl px-5 py-4 focus:border-emerald-500/50 outline-none text-gray-400 text-xs font-bold appearance-none cursor-pointer">
                                         <option value="" disabled>Select Sector</option>
                                         {courseList.map(course => (<option key={course._id} value={course._id}>{course.title}</option>))}
                                     </select>
                                     <span className="absolute right-5 top-5 text-gray-600 pointer-events-none text-xs">▼</span>
                                 </div>
                             </div>

                             <div className="space-y-2">
                                 <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Data Source (URL)</label>
                                 <input name="url" type="url" defaultValue={editingContent?.url || ""} required placeholder="https://relayserver.packet/node-source" className="w-full bg-[#070B14] border border-gray-700 rounded-2xl px-5 py-4 focus:border-emerald-500/50 outline-none text-white text-xs font-bold transition-all placeholder-gray-700"/>
                             </div>

                             <div className="space-y-2">
                                 <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Packet Uptime / Details</label>
                                 <input name="duration" defaultValue={editingContent?.duration || ""} placeholder="e.g., 10m 45s" className="w-full bg-[#070B14] border border-gray-800 rounded-2xl px-5 py-4 focus:border-emerald-500/50 outline-none text-white text-sm font-bold transition-all placeholder-gray-700"/>
                             </div>

                             <div className="flex justify-end gap-4 pt-6 border-t border-gray-800">
                                 <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 rounded-xl border border-gray-800 text-gray-500 font-black text-[10px] uppercase tracking-widest hover:text-white hover:bg-white/5 transition-all" disabled={modalLoading}>Abort</button>
                                 <button type="submit" className={`px-10 py-4 bg-emerald-500 text-[#070B14] rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-emerald-400 transition-all ${modalLoading ? 'opacity-50 cursor-wait' : ''}`} disabled={modalLoading}>
                                     {modalLoading ? "Transmitting..." : (editingContent ? "Update Node" : "Sync Node")}
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

export default ContentDelivery;