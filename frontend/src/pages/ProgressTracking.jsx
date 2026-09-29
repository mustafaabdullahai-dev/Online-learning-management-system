import React, { useState, useEffect, useCallback, useMemo } from "react";
import { FaUserGroup } from "react-icons/fa6";
import { FiFilter, FiSearch, FiRefreshCw, FiCheckCircle, FiAward, FiBarChart2, FiPieChart, FiTrendingUp,FiClock,FiActivity } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion"; // Consistently added for smoothness

// --- Icons Map (Updated for Terminal Theme) ---
const statIcons = {
    "Average Completion Rate": <FiBarChart2 className="w-6 h-6 text-emerald-500" />,
    "Active Learners": <FaUserGroup className="w-6 h-6 text-blue-400" />,
    "Certificates Issued": <FiAward className="w-6 h-6 text-purple-400" />,
    "Courses Enrolled": <FaUserGroup className="w-6 h-6 text-emerald-500" />,
    "Courses Completed": <FiCheckCircle className="w-6 h-6 text-emerald-500" />,
    "Average Progress": <FiBarChart2 className="w-6 h-6 text-blue-400" />,
};

const ProgressTracking = () => {
    const navigate = useNavigate();
    const role = localStorage.getItem("role");
    const [stats, setStats] = useState([]);
    const [progressData, setProgressData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Admin Filters ---
    const [courseList, setCourseList] = useState([]);
    const [selectedCourseFilter, setSelectedCourseFilter] = useState("All");
    const [studentNameFilter, setStudentNameFilter] = useState("");

    // --- Fetch Course List ---
    const fetchCourseList = useCallback(async () => {
        if (role !== 'admin' && role !== 'super_admin') return;
        
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
    }, [role]);

    // --- Fetch Progress Data ---
    const fetchProgressData = useCallback(async () => {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");
        let statsUrl = '';
        let detailsUrl = '';

        if (role === 'admin' || role === 'super_admin') {
            statsUrl = '/api/progress/admin-stats';
            detailsUrl = '/api/progress/all-students';
            const params = new URLSearchParams();
            if (selectedCourseFilter !== "All") params.append('courseId', selectedCourseFilter);
            if (studentNameFilter.trim()) params.append('name', studentNameFilter.trim());
            const queryString = params.toString();
            if (queryString) detailsUrl += `?${queryString}`;
        } else if (role === 'student') {
            detailsUrl = '/api/progress/my-progress';
            statsUrl = detailsUrl; 
        } else {
            setError("Unauthorized access to progress nodes.");
            setLoading(false);
            return;
        }

        try {
            const detailsResponse = await fetch(detailsUrl, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!detailsResponse.ok) {
                const errData = await detailsResponse.json();
                throw new Error(errData.error || "Failed to fetch progress details");
            }
            const detailsData = await detailsResponse.json();

            if (role === 'student') {
                setStats(detailsData.stats || []);
                setProgressData(detailsData.progress_details || []);
            } else {
                const statsResponse = await fetch(statsUrl, { headers: { 'Authorization': `Bearer ${token}` } });
                if (statsResponse.ok) {
                    const statsData = await statsResponse.json();
                    setStats(statsData || []);
                } else {
                    setStats([]);
                }
                setProgressData(detailsData || []);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [role, selectedCourseFilter, studentNameFilter]);

    useEffect(() => {
        fetchCourseList();
    }, [fetchCourseList]);

    useEffect(() => {
        fetchProgressData();
    }, [fetchProgressData]);

    if (loading) return (
        <div className="flex flex-col h-screen justify-center items-center bg-[#070B14]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            <p className="text-emerald-500 font-black uppercase tracking-[0.3em] text-[10px] mt-4 animate-pulse">Analyzing Performance Nodes...</p>
        </div>
    );

    if (error) return (
        <div className="p-8 bg-[#070B14] min-h-screen flex justify-center items-center font-sans text-white">
            <div className="bg-[#0F172A] p-10 rounded-[32px] shadow-2xl text-center border border-red-500/20 max-w-md">
                <h1 className="text-xl font-black text-white mb-2 uppercase tracking-widest italic">Data Breach Error</h1>
                <p className="text-red-500 font-bold uppercase text-xs tracking-tighter">{error}</p>
                <button onClick={fetchProgressData} className="mt-8 px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all">Retry Link</button>
            </div>
        </div>
    );

    const isAdminOrSuper = role === 'admin' || role === 'super_admin';

    return (
        <div className="p-6 md:p-10 bg-[#070B14] min-h-screen font-sans text-gray-200">
            
            {/* --- Header --- */}
{/* ProgressTracking.jsx ke andar Header ke niche yeh button add karein sirf Student ke liye */}
{role === 'student' && (
    <div className="mb-6">
        <button 
            onClick={() => navigate(`/student-report/${localStorage.getItem("user_id")}`)}
            className="flex items-center gap-3 px-6 py-4 bg-emerald-500 text-[#070B14] font-black rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-emerald-400 transition-all uppercase text-xs tracking-widest"
        >
            <FiActivity className="w-5 h-5" /> Generate My Performance Analytics
        </button>
    </div>
)}

{/* Admin/Instructor Table Row Clickable rahegi */}
{isAdminOrSuper && (
    <tr 
        onClick={() => navigate(`/student-report/${row.student_id}`)}
        className="hover:bg-emerald-500/5 cursor-pointer transition-all group"
    >
        {/* Table cells... */}
    </tr>
)}
<div className="mb-10">
    <h1 className="text-3xl font-black italic text-white tracking-tighter uppercase leading-none">
        {isAdminOrSuper ? (
            <>
                Progress <span className="text-emerald-500">Overview</span>
            </>
        ) : (
            <>
                My <span className="text-emerald-500">Progress</span> Node
            </>
        )}
    </h1>
    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">
        Track real-time performance, completion metrics, and credentials.
    </p>
</div>

            {/* --- Stats Grid --- */}
            {stats.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    {stats.map((stat, idx) => (
                        <motion.div 
                            key={idx} 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-[#0F172A] p-6 rounded-3xl shadow-2xl border border-gray-800 flex items-center gap-5 group hover:border-emerald-500/30 transition-all"
                        >
                            <div className="p-4 bg-[#070B14] text-emerald-500 rounded-2xl border border-gray-800 shadow-inner group-hover:bg-emerald-500/10 transition-all duration-300">
                                {statIcons[stat.title] || <FiBarChart2 className="w-6 h-6" />}
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{stat.title}</p>
                                <div className="flex items-end gap-2 mt-1">
                                    <h3 className="text-3xl font-black text-white tracking-tighter leading-none">{stat.value}</h3>
                                    {stat.change && (
                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                            {stat.change}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* --- Admin View: Student Progress Table --- */}
            {isAdminOrSuper && (
                <div className="bg-[#0F172A] rounded-[32px] shadow-2xl border border-gray-800 overflow-hidden">
                    
                    {/* Toolbar */}
                    <div className="p-6 border-b border-gray-800 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-[#1E293B]/20">
                        <h2 className="text-sm font-black uppercase tracking-widest text-white italic flex items-center gap-2">
                           <FiTrendingUp className="text-emerald-500" /> Student Data Streams
                        </h2>
                        
                        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                            {/* Search */}
                            <div className="relative group flex-1">
                                <FiSearch className="absolute left-4 top-3 text-gray-500 group-focus-within:text-emerald-500 transition-colors" />
                                <input
                                    type="text"
                                    className="w-full md:w-64 pl-11 pr-4 py-2.5 bg-[#070B14] border border-gray-800 rounded-xl focus:outline-none focus:border-emerald-500/50 text-xs font-bold text-white placeholder-gray-600 transition-all shadow-inner"
                                    placeholder="Identify student..."
                                    value={studentNameFilter}
                                    onChange={(e) => setStudentNameFilter(e.target.value)}
                                />
                            </div>

                            {/* Filter */}
                            <div className="relative group">
                                <FiFilter className="absolute left-4 top-3 text-emerald-500/50 z-10" />
                                <select
                                    className="w-full md:w-48 pl-11 pr-8 py-2.5 bg-[#070B14] border border-gray-800 rounded-xl focus:outline-none focus:border-emerald-500/50 text-[10px] font-black uppercase tracking-widest text-gray-400 appearance-none cursor-pointer shadow-inner"
                                    value={selectedCourseFilter}
                                    onChange={(e) => setSelectedCourseFilter(e.target.value)}
                                >
                                    <option value="All">All Sectors</option>
                                    {courseList.map((course) => (
                                        <option key={course._id} value={course._id}>{course.title}</option>
                                    ))}
                                </select>
                                <span className="absolute right-3 top-3 text-gray-600 pointer-events-none text-xs">▼</span>
                            </div>

                            <button onClick={fetchProgressData} className="p-2.5 bg-[#070B14] border border-gray-800 rounded-xl hover:border-emerald-500/50 text-gray-500 hover:text-emerald-500 transition-all shadow-lg" title="Refresh Uplink">
                                <FiRefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}/>
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="min-w-full text-sm text-left">
                            <thead className="bg-[#1E293B]/40 border-b border-gray-800">
                                <tr>
                                    <th className="px-8 py-5 font-black text-gray-500 uppercase text-[10px] tracking-[0.2em]">Student Node</th>
                                    <th className="px-8 py-5 font-black text-gray-500 uppercase text-[10px] tracking-[0.2em]">Active Sector</th>
                                    <th className="px-8 py-5 font-black text-gray-500 uppercase text-[10px] tracking-[0.2em] w-1/4">Integrity Level</th>
                                    <th className="px-8 py-5 font-black text-gray-500 uppercase text-[10px] tracking-[0.2em]">Packets</th>
                                    <th className="px-8 py-5 font-black text-gray-500 uppercase text-[10px] tracking-[0.2em]">Last Access</th>
                                    <th className="px-8 py-5 font-black text-gray-500 uppercase text-[10px] tracking-[0.2em]">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/50">
                                {progressData.map((row, idx) => (
                                    <tr key={`${row.student_id}-${idx}`} 
            onClick={() => navigate(`/student-report/${row.student_id}`)}
            className="hover:bg-emerald-500/5 cursor-pointer transition-all group">
                                        <td className="px-8 py-6 font-bold text-gray-200">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-[#070B14] text-emerald-500 flex items-center justify-center font-black text-xs border border-gray-800 shadow-inner group-hover:border-emerald-500/30 transition-all">
                                                    {row.initials}
                                                </div>
                                                <span className="italic uppercase tracking-tight text-sm">{row.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-gray-400 font-bold text-xs uppercase tracking-tighter">{row.course}</td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="flex-1 h-1.5 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${row.progress}%` }}
                                                        className="h-full bg-emerald-500 shadow-[0_0_10px_#10b981]" 
                                                    ></motion.div>
                                                </div>
                                                <span className="text-[11px] font-black text-white w-10">{row.progress}%</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-gray-500 font-black uppercase text-[10px] tracking-widest">{row.lessons} Units</td>
                                        <td className="px-8 py-6 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                                            <div className="flex items-center gap-2">
                                                <FiClock className="text-emerald-500/30" /> {row.lastActivity}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border shadow-lg ${
                                                row.status === 'On Track' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                row.status === 'Needs Attention' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                'bg-gray-800 text-gray-400 border-gray-700'
                                            }`}>
                                                {row.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {progressData.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="text-center py-24 text-gray-600 font-black uppercase tracking-[0.3em] text-xs italic">
                                            No performance nodes detected in current frequency.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- Student View: My Progress Table --- */}
            {role === 'student' && (
                <div className="bg-[#0F172A] rounded-[32px] shadow-2xl border border-gray-800 overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-800 bg-[#1E293B]/20">
                        <h2 className="font-black text-white text-sm uppercase tracking-widest italic">Detailed Sync Status</h2>
                    </div>
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="min-w-full text-sm text-left">
                            <thead className="bg-[#1E293B]/40 border-b border-gray-800">
                                <tr>
                                    <th className="px-8 py-5 font-black text-gray-500 uppercase text-[10px] tracking-[0.2em]">Module Sector</th>
                                    <th className="px-8 py-5 font-black text-gray-500 uppercase text-[10px] tracking-[0.2em] w-1/3">Transmission Progress</th>
                                    <th className="px-8 py-5 font-black text-gray-500 uppercase text-[10px] tracking-[0.2em]">Lessons</th>
                                    <th className="px-8 py-5 font-black text-gray-500 uppercase text-[10px] tracking-[0.2em]">Final Credits</th>
                                    <th className="px-8 py-5 font-black text-gray-500 uppercase text-[10px] tracking-[0.2em]">Last Uplink</th>
                                    <th className="px-8 py-5 font-black text-gray-500 uppercase text-[10px] tracking-[0.2em]">Sync Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/50">
                                {progressData.map((row) => (
                                    <tr key={row.course_id} 
        onClick={() => navigate(`/student-report/${localStorage.getItem("firstName")}`)}
        className="hover:bg-emerald-500/5 cursor-pointer transition-all group">
                                        <td className="px-8 py-6">
                                            <Link to={`/courses/view/${row.course_id}`} className="font-black text-gray-200 uppercase italic tracking-tight hover:text-emerald-400 transition-colors text-sm">
                                                {row.course}
                                            </Link>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="flex-1 h-1.5 bg-gray-900 rounded-full overflow-hidden border border-gray-800 shadow-inner">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${row.progress}%` }}
                                                        className="h-full bg-emerald-500 shadow-[0_0_10px_#10b981]" 
                                                    ></motion.div>
                                                </div>
                                                <span className="text-[11px] font-black text-white w-10">{row.progress}%</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-gray-500 font-bold uppercase text-[11px] tracking-widest">{row.lessons} Nodes</td>
                                        <td className="px-8 py-6 font-black text-emerald-500 tracking-widest text-base">{row.grade || 'VOID'}</td>
                                        <td className="px-8 py-6 text-gray-500 text-[10px] font-bold uppercase tracking-widest">{row.lastActivity}</td>
                                        <td className="px-8 py-6">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border shadow-lg ${
                                                row.status === 'On Track' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                'bg-gray-800 text-gray-400 border-gray-700'
                                            }`}>
                                                {row.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {progressData.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="text-center py-24 text-gray-600 font-black uppercase tracking-[0.3em] text-xs italic">
                                            No active module enrollments detected in terminal.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default ProgressTracking;