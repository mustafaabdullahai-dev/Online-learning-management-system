import React, { useState, useEffect, useCallback } from "react";
import { FiEdit, FiEye, FiTrash2, FiUsers, FiSearch, FiPlus, FiClock, FiCheckCircle, FiXCircle, FiX } from "react-icons/fi";
import { FaUserGroup } from "react-icons/fa6";
import { IoBookOutline } from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion"; // Consistently added for theme smoothness

const CourseManagement = () => {
    // --- States ---
    const [search, setSearch] = useState("");
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const role = localStorage.getItem("role");

    // --- Enrollment Modal States ---
    const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
    const [currentCourseForEnrollment, setCurrentCourseForEnrollment] = useState(null);
    const [allStudents, setAllStudents] = useState([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());
    const [enrollLoading, setEnrollLoading] = useState(false);
    const [enrollError, setEnrollError] = useState(null);

    // --- Fetch Courses ---
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

    // --- Delete Function ---
    const handleDelete = async (courseId) => {
        if (window.confirm("Are you sure you want to purge this course? This action cannot be undone.")) {
            const token = localStorage.getItem("token");
            try {
                const response = await fetch(`/api/courses/${courseId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || "Failed to delete course");
                }
                fetchCourses();
            } catch (err) {
                alert("Error: " + err.message);
            }
        }
    };

    // --- Add/Edit Modal Submit ---
    const handleModalSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        const formData = new FormData(e.target);
        const courseData = {
            title: formData.get("title"),
            description: formData.get("description"),
            duration: formData.get("duration"),
            status: formData.get("status"),
        };
        let url = '/api/courses';
        let method = 'POST';
        if (editingCourse) {
            url = `/api/courses/${editingCourse._id}`;
            method = 'PUT';
        }
        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(courseData),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || `Failed to ${editingCourse ? 'update' : 'create'} course`);
            }
            setIsModalOpen(false);
            setEditingCourse(null);
            fetchCourses();
        } catch (err) {
            alert("Error: " + err.message);
        }
    };

    // --- Enrollment Logic ---
    const openEnrollmentModal = useCallback(async (course) => {
        setCurrentCourseForEnrollment(course);
        setIsEnrollModalOpen(true);
        setEnrollLoading(true);
        setEnrollError(null);
        setSelectedStudentIds(new Set());
        const token = localStorage.getItem("token");
        try {
            const [allStudentsRes, enrolledStudentsRes] = await Promise.all([
                fetch('/api/students', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`/api/courses/${course._id}/enrolled-students`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            if (!allStudentsRes.ok) throw new Error('Failed to fetch student list');
            if (!enrolledStudentsRes.ok) throw new Error('Failed to fetch enrolled students');
            const allStudentsData = await allStudentsRes.json();
            const enrolledStudentsData = await enrolledStudentsRes.json();
            setAllStudents(allStudentsData);
            const enrolledIdsSet = new Set(enrolledStudentsData.map(s => s._id));
            setSelectedStudentIds(enrolledIdsSet);
        } catch (err) {
            setEnrollError(err.message);
        } finally {
            setEnrollLoading(false);
        }
    }, []);

    const handleEnrollmentSave = async () => {
        if (!currentCourseForEnrollment) return;
        setEnrollLoading(true);
        setEnrollError(null);
        const token = localStorage.getItem("token");
        try {
            const response = await fetch(`/api/courses/${currentCourseForEnrollment._id}/enrollments`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ student_ids: Array.from(selectedStudentIds) }),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Failed to update enrollments");
            }
            setIsEnrollModalOpen(false);
            setCurrentCourseForEnrollment(null);
            fetchCourses();
        } catch (err) {
            setEnrollError(err.message);
            setEnrollLoading(false);
        }
    };

    const handleStudentSelection = (studentId) => {
        setSelectedStudentIds(prevSet => {
            const newSet = new Set(prevSet);
            if (newSet.has(studentId)) newSet.delete(studentId);
            else newSet.add(studentId);
            return newSet;
        });
    };

    const filteredCourses = courses.filter((course) =>
        course.title.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return (
        <div className="flex flex-col h-screen justify-center items-center bg-[#070B14]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            <p className="text-emerald-500 font-black uppercase tracking-[0.3em] text-[10px] mt-4 animate-pulse">Accessing Core Database...</p>
        </div>
    );

    if (error) return (
        <div className="flex items-center justify-center bg-[#070B14] h-screen text-red-500 font-black uppercase tracking-widest text-sm">
            Terminal Error: {error}
        </div>
    );

    return (
        <div className="p-6 md:p-10 bg-[#070B14] min-h-screen font-sans text-gray-200">
            
            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                <div>
                    <h1 className="text-3xl font-black italic text-white tracking-tighter uppercase leading-none">Curriculum <span className="text-emerald-500">Manager</span></h1>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">Oversee academic nodes and authorize student access.</p>
                </div>
                {/* CourseManagement.jsx: Header section mein dhoondein */}
{role !== "student" && (
    <button
        onClick={() => { setEditingCourse(null); setIsModalOpen(true); }}
        className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-[#070B14] font-black rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:bg-emerald-400 transition-all transform active:scale-95 uppercase text-xs tracking-widest"
    >
        <FiPlus className="w-5 h-5" /> Initialize Course
    </button>
)}
            </div>

            {/* --- SEARCH BAR --- */}
            <div className="mb-10 max-w-lg relative group">
                <span className="absolute left-4 top-3.5 text-gray-500 group-focus-within:text-emerald-500 transition-colors">
                    <FiSearch className="w-5 h-5" />
                </span>
                <input
                    type="text"
                    className="w-full pl-12 pr-4 py-3.5 bg-[#0F172A] border border-gray-800 rounded-xl focus:outline-none focus:border-emerald-500/50 transition-all text-sm font-bold text-white placeholder-gray-600 shadow-2xl"
                    placeholder="Identify course node..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* --- COURSE GRID --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence>
                {filteredCourses.map((course, idx) => (
                    <motion.div 
                        key={course._id} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group bg-[#0F172A] rounded-3xl p-7 border border-gray-800 shadow-2xl hover:border-emerald-500/30 hover:-translate-y-1 transition-all duration-300 flex flex-col"
                    >
                        {/* Top Section */}
                        <div>
                            <div className="flex justify-between items-start mb-6">
                                <div className="h-14 w-14 rounded-2xl bg-[#070B14] border border-gray-800 text-emerald-500 flex items-center justify-center font-black text-2xl shadow-inner group-hover:bg-emerald-500 group-hover:text-[#070B14] transition-all">
                                    {course.title.charAt(0)}
                                </div>
                                
                                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border ${
                                    course.status === "Active" 
                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
                                        : "bg-gray-800 text-gray-500 border-gray-700"
                                }`}>
                                    {course.status === "Active" ? <FiCheckCircle /> : <FiXCircle />}
                                    {course.status}
                                </span>
                            </div>

                            <h2 className="text-xl font-black text-white leading-none tracking-tight mb-2 group-hover:text-emerald-400 transition-colors italic uppercase min-h-[2.5rem]">
                                {course.title}
                            </h2>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-5">
                                Lead: {course.instructor}
                            </p>

                            <div className="space-y-2.5 mb-8">
                                <div className="flex items-center text-[11px] text-gray-400 font-bold uppercase tracking-widest gap-3">
                                    <FiClock className="text-emerald-500/50" /> 
                                    <span>{course.duration} Cycle</span>
                                </div>
                                <div className="flex items-center text-[11px] text-gray-400 font-bold uppercase tracking-widest gap-3">
                                    <FaUserGroup className="text-emerald-500/50" /> 
                                    <span>{course.students} Authorized Users</span>
                                </div>
                            </div>

                            {/* Progress Bar (AuthPage Style) */}
                            <div className="mb-8 bg-[#070B14] p-3 rounded-2xl border border-gray-800 shadow-inner">
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Sector Load</span>
                                    <span className="text-[9px] font-black text-emerald-500 uppercase">{course.progress || 0}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${course.progress || 0}%` }}
                                        className="h-full bg-emerald-500 shadow-[0_0_10px_#10b981]" 
                                    ></motion.div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
             {/* CourseManagement.jsx: Action Buttons area update karein */}
<div className="grid grid-cols-2 gap-3 mt-auto pt-6 border-t border-gray-800">
    
    {/* SIRF ADMIN aur INSTRUCTOR dekh saken */}
    {role !== "student" && (
        <>
            <button onClick={() => { setEditingCourse(course); setIsModalOpen(true); }} className="flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/5 border border-emerald-500/20 rounded-xl hover:bg-emerald-500 hover:text-[#070B14] transition-all">
                <FiEdit /> Edit
            </button>
            <button onClick={() => openEnrollmentModal(course)} className="flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-400/5 border border-blue-400/20 rounded-xl hover:bg-blue-400 hover:text-[#070B14] transition-all">
                <FiUsers /> Users
            </button>
        </>
    )}

    {/* YEH SAB KO NAZAR AAYEGA (Student can click to view) */}
    <button className="flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500 bg-white/5 border border-gray-800 rounded-xl hover:border-gray-500 transition-all">
        <FiEye /> Link
    </button>

    {/* SIRF ADMIN (Super Admin) Delete kar sakay */}
    {(role === 'admin' || role === 'super_admin') && (
        <button onClick={() => handleDelete(course._id)} className="flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-500/5 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all">
            <FiTrash2 /> Purge
        </button>
    )}
</div>
                    </motion.div>
                ))}
                </AnimatePresence>
            </div>
            
            {filteredCourses.length === 0 && (
                <div className="text-center py-24 bg-[#0F172A] rounded-[40px] border border-dashed border-gray-800 shadow-inner">
                    <div className="bg-[#070B14] p-6 rounded-full inline-block border border-gray-800 mb-4 shadow-2xl">
                        <IoBookOutline className="w-10 h-10 text-gray-700" />
                    </div>
                    <p className="text-gray-500 font-black uppercase tracking-widest text-xs">No course nodes detected matching this frequency.</p>
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
                        className="bg-[#0F172A] border border-gray-800 rounded-[32px] shadow-[0_0_60px_rgba(0,0,0,0.6)] w-full max-w-lg overflow-hidden"
                    >
                        <div className="px-10 py-7 border-b border-gray-800 flex justify-between items-center bg-[#1E293B]/30">
                            <h2 className="text-xl font-black italic text-white uppercase tracking-tighter">
                                {editingCourse ? "Modify Node" : "Initialize Node"}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white transition-colors p-2 bg-white/5 rounded-full"><FiX size={20}/></button>
                        </div>
                        <form onSubmit={handleModalSubmit} className="p-10 space-y-6">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Title Identifier</label>
                                <input name="title" defaultValue={editingCourse?.title || ""} required className="w-full bg-[#070B14] border border-gray-800 rounded-2xl px-5 py-4 focus:border-emerald-500/50 outline-none text-white text-sm font-bold transition-all placeholder-gray-800" placeholder="Enter node name..." />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Node Description</label>
                                <textarea name="description" defaultValue={editingCourse?.description || ""} rows="3" className="w-full bg-[#070B14] border border-gray-800 rounded-2xl px-5 py-4 focus:border-emerald-500/50 outline-none text-white text-sm font-bold transition-all resize-none placeholder-gray-800" placeholder="Define sector objectives..." />
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Cycle Duration</label>
                                    <input name="duration" defaultValue={editingCourse?.duration || ""} placeholder="e.g. 12 Cycles" required className="w-full bg-[#070B14] border border-gray-800 rounded-2xl px-5 py-4 focus:border-emerald-500/50 outline-none text-white text-sm font-bold transition-all placeholder-gray-800" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Network Status</label>
                                    <select name="status" defaultValue={editingCourse?.status || "Draft"} className="w-full bg-[#070B14] border border-gray-800 rounded-2xl px-5 py-4 focus:border-emerald-500/50 outline-none text-gray-400 text-[10px] font-black uppercase tracking-widest appearance-none cursor-pointer">
                                        <option value="Draft">Draft Mode</option>
                                        <option value="Active">Public Feed</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-800">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 rounded-xl border border-gray-800 text-gray-500 font-black text-[10px] uppercase tracking-widest hover:text-white hover:bg-white/5 transition-all">Abort</button>
                                <button type="submit" className="px-10 py-4 bg-emerald-500 text-[#070B14] font-black rounded-xl shadow-lg hover:bg-emerald-400 transition-all uppercase text-[10px] tracking-widest">
                                    {editingCourse ? "Update Signal" : "Initialize Signal"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
            </AnimatePresence>

            {/* --- ENROLLMENT MODAL --- */}
            <AnimatePresence>
            {isEnrollModalOpen && currentCourseForEnrollment && (
                <div className="fixed inset-0 flex items-center justify-center bg-[#070B14]/95 backdrop-blur-xl z-[110] p-4">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-[#0F172A] border border-gray-800 rounded-[32px] w-full max-w-md shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
                    >
                        <div className="p-8 border-b border-gray-800 bg-[#1E293B]/30 flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-black italic text-white uppercase tracking-tighter">Access Control</h2>
                                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Sct: {currentCourseForEnrollment.title}</p>
                            </div>
                            <button onClick={() => setIsEnrollModalOpen(false)} className="p-2 bg-white/5 rounded-full text-gray-500 hover:text-white transition-all"><FiX/></button>
                        </div>
                        
                        {enrollLoading && (
                            <div className="flex flex-col justify-center items-center py-20 bg-[#0F172A]">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-3"></div>
                                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Syncing User Nodes...</p>
                            </div>
                        )}
                        
                        {enrollError && <p className="text-center text-red-500 bg-red-500/5 border border-red-500/20 p-4 mx-8 my-4 rounded-xl text-xs font-bold">{enrollError}</p>}
                        
                        {!enrollLoading && !enrollError && (
                            <div className="flex-grow overflow-y-auto custom-scrollbar p-6 bg-[#070B14]">
                                {allStudents.length > 0 ? (
                                    <ul className="space-y-2">
                                        {allStudents.map(student => {
                                            const isSelected = selectedStudentIds.has(student._id);
                                            return (
                                                <li 
                                                    key={student._id} 
                                                    onClick={() => handleStudentSelection(student._id)}
                                                    className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border ${
                                                        isSelected ? "bg-emerald-500/10 border-emerald-500/30 shadow-inner" : "bg-[#0F172A] border-gray-800 hover:border-emerald-500/20"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shadow-lg ${
                                                            isSelected ? "bg-emerald-500 text-[#070B14]" : "bg-gray-800 text-gray-400"
                                                        }`}>
                                                            {student.name.charAt(0)}
                                                        </div>
                                                        <span className={`text-[11px] font-black uppercase tracking-widest transition-colors ${isSelected ? "text-emerald-400" : "text-gray-400"}`}>
                                                            {student.name}
                                                        </span>
                                                    </div>
                                                    <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                                                        isSelected ? "bg-emerald-500 border-emerald-500 shadow-[0_0_10px_#10b981]" : "border-gray-700 bg-transparent"
                                                    }`}>
                                                        {isSelected && <FiCheckCircle className="text-[#070B14] w-3.5 h-3.5 stroke-[3]" />}
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                ) : (
                                    <div className="text-center py-10">
                                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">No User Nodes Found.</p>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <div className="p-8 border-t border-gray-800 bg-[#1E293B]/20 flex gap-3">
                            <button type="button" onClick={() => setIsEnrollModalOpen(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 bg-transparent border border-gray-800 rounded-xl hover:text-white transition-all">Abort</button>
                            <button type="button" onClick={handleEnrollmentSave} className={`flex-1 py-4 bg-emerald-500 text-[#070B14] font-black rounded-xl text-[10px] uppercase tracking-widest shadow-lg hover:bg-emerald-400 transition-all ${enrollLoading ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={enrollLoading}>
                                {enrollLoading ? "Syncing..." : "Apply Auth"}
                            </button>
                        </div>
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

export default CourseManagement;