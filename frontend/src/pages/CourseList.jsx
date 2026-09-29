import React, { useState, useEffect, useCallback } from "react";
import { Link } from 'react-router-dom';
import { FiSearch, FiFilter, FiUser, FiClock, FiCheckCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from "framer-motion"; // Consistently added for theme smoothness

const CourseList = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterCategory, setFilterCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [enrollingCourseId, setEnrollingCourseId] = useState(null);

    // --- Fetch Courses Function ---
    const fetchCourses = useCallback(async () => {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");
        try {
            const response = await fetch('/api/courses', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Failed to fetch courses");
            }
            const data = await response.json();
            setCourses(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    // --- Handle Enrollment ---
    const handleEnroll = async (courseId) => {
        setEnrollingCourseId(courseId);
        const token = localStorage.getItem("token");
        try {
            const response = await fetch(`/api/courses/${courseId}/enroll`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Failed to enroll");
            }
            fetchCourses(); 
        } catch (err) {
            alert("Enrollment failed: " + err.message);
            fetchCourses();
        } finally {
            setEnrollingCourseId(null);
        }
    };

    // --- Get Unique Categories ---
    const categories = ["All", ...new Set(courses.map(course => course.category || "General"))];

    // --- Filtering Logic ---
    const filteredCourses = courses.filter(course => {
        const matchesCategory = filterCategory === "All" || (course.category || "General") === filterCategory;
        const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (loading) return (
        <div className="flex flex-col h-screen justify-center items-center bg-[#070B14]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            <p className="text-emerald-500 font-black uppercase tracking-[0.3em] text-[10px] mt-4 animate-pulse">Scanning Grid Sectors...</p>
        </div>
    );

    if (error) return (
        <div className="p-8 bg-[#070B14] min-h-screen flex justify-center items-center font-sans">
            <div className="bg-[#0F172A] p-10 rounded-[32px] shadow-2xl text-center border border-red-500/20 max-w-md">
                <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <span className="text-red-500 text-3xl font-black italic">!</span>
                </div>
                <h1 className="text-xl font-black text-white mb-2 uppercase tracking-tighter italic">Signal Interrupted</h1>
                <p className="text-red-400/70 text-sm font-bold uppercase tracking-widest leading-relaxed">{error}</p>
                <button onClick={fetchCourses} className="mt-8 px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all">Retry Uplink</button>
            </div>
        </div>
    );

    return (
        <div className="p-6 md:p-10 bg-[#070B14] min-h-screen font-sans text-gray-200">
            
            {/* --- Header --- */}
            <div className="mb-10">
                <h1 className="text-3xl font-black italic text-white tracking-tighter uppercase leading-none">Course <span className="text-emerald-500">Catalog</span></h1>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">Explore available modules and upgrade your skill node.</p>
            </div>

            {/* --- Filters Toolbar --- */}
            <div className="bg-[#0F172A] p-2 rounded-2xl shadow-2xl border border-gray-800 mb-8 flex flex-col md:flex-row gap-2">
                {/* Search */}
                <div className="relative flex-1 group">
                    <span className="absolute left-4 top-3.5 text-gray-500 group-focus-within:text-emerald-500 transition-colors">
                        <FiSearch className="w-5 h-5"/>
                    </span>
                    <input
                        type="text"
                        className="w-full pl-12 pr-4 py-3.5 bg-[#070B14] border border-gray-800 rounded-xl focus:outline-none focus:border-emerald-500/50 transition-all text-sm font-bold text-white placeholder-gray-600"
                        placeholder="Search skill nodes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Category Filter */}
                <div className="relative w-full md:w-64">
                    <span className="absolute left-4 top-4 text-emerald-500/50 z-10">
                        <FiFilter className="w-4 h-4"/>
                    </span>
                    <select
                        className="w-full pl-12 pr-10 py-3.5 bg-[#070B14] border border-gray-800 rounded-xl focus:outline-none focus:border-emerald-500/50 transition-all appearance-none cursor-pointer text-[11px] font-black uppercase tracking-widest text-gray-400"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                    >
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>{cat} Sector</option>
                        ))}
                    </select>
                    <span className="absolute right-4 top-4 text-gray-600 pointer-events-none text-[10px]">▼</span>
                </div>
            </div>

            {/* --- Course Grid --- */}
            {filteredCourses.length === 0 ? (
                <div className="text-center py-24 bg-[#0F172A] rounded-3xl border border-dashed border-gray-800 shadow-inner">
                    <p className="text-gray-500 font-black uppercase tracking-widest text-xs">No active nodes detected in this sector.</p>
                    <button 
                        onClick={() => {setSearchQuery(""); setFilterCategory("All")}} 
                        className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em] mt-4 hover:text-emerald-400 transition-colors"
                    >
                        Reset Frequencies
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                    {filteredCourses.map((course, idx) => (
                        <motion.div
                            key={course._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="group bg-[#0F172A] rounded-3xl p-7 border border-gray-800 shadow-2xl hover:border-emerald-500/30 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex justify-between items-start mb-6">
                                    {/* Icon Placeholder */}
                                    <div className="h-14 w-14 rounded-2xl bg-[#070B14] border border-gray-800 text-emerald-500 flex items-center justify-center font-black text-2xl shadow-inner group-hover:bg-emerald-500 group-hover:text-[#070B14] group-hover:border-transparent transition-all duration-300">
                                        {course.title.charAt(0)}
                                    </div>
                                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                                        {course.category || "General"}
                                    </span>
                                </div>

                                <Link to={`/courses/view/${course._id}`} className="block">
                                    <h3 className="text-xl font-black text-white mb-3 tracking-tight italic uppercase leading-none group-hover:text-emerald-400 transition-colors min-h-[3rem]">
                                        {course.title}
                                    </h3>
                                </Link>
                                
                                <div className="space-y-2.5 mb-8">
                                    <div className="flex items-center text-[11px] text-gray-500 font-bold uppercase tracking-widest gap-3">
                                        <FiUser className="text-emerald-500/50" /> 
                                        <span>Node Lead: {course.instructor}</span>
                                    </div>
                                    <div className="flex items-center text-[11px] text-gray-500 font-bold uppercase tracking-widest gap-3">
                                        <FiClock className="text-emerald-500/50" /> 
                                        <span>Duration: {course.duration}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Area */}
                            <div className="mt-auto pt-6 border-t border-gray-800">
                                {course.isEnrolled ? (
                                    <div
                                        className="w-full flex items-center justify-center gap-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-default shadow-inner"
                                    >
                                        <FiCheckCircle className="w-4 h-4"/> Node Authorized
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleEnroll(course._id)}
                                        className={`w-full bg-emerald-500 text-[#070B14] px-4 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 shadow-lg hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all active:scale-95 ${enrollingCourseId === course._id ? 'opacity-70 cursor-wait' : ''}`}
                                        disabled={enrollingCourseId === course._id}
                                    >
                                        {enrollingCourseId === course._id ? 'Synchronizing...' : 'Initialize Enrollment'}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default CourseList;