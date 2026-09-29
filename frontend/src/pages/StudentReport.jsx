import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiActivity, FiCpu, FiAlertTriangle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const StudentReport = () => {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReport = async () => {
            const token = localStorage.getItem("token");
            try {
                const res = await fetch(`/api/progress/student-report/${studentId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const result = await res.json();
                if (res.ok) setData(result);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchReport();
    }, [studentId]);

    if (loading) return (
        <div className="h-screen bg-[#070B14] flex flex-col items-center justify-center text-emerald-500">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="mb-4">
                <FiCpu size={40} />
            </motion.div>
            <p className="font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Decrypting Profile Nodes...</p>
        </div>
    );

    return (
        <div className="p-8 bg-[#070B14] min-h-screen text-gray-200 font-sans">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-emerald-500 mb-8 uppercase text-[10px] font-black tracking-widest transition-all">
                <FiArrowLeft /> Return to Grid
            </button>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto">
                {/* Header Card */}
                <div className="bg-[#0F172A] p-8 rounded-[2rem] border border-gray-800 mb-8 flex items-center gap-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl"></div>
                    <div className="w-24 h-24 bg-emerald-500/10 rounded-3xl border border-emerald-500/20 flex items-center justify-center text-emerald-500 text-4xl font-black shadow-inner">
                        {data?.name?.charAt(0) || "?"}
                    </div>
                    <div>
                        <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white">{data?.name || "Unknown User"}</h1>
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-1 flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                            {data?.email} • {data?.role} Node
                        </p>
                    </div>
                </div>

                {/* --- DYNAMIC EMPTY STATE OR CONTENT --- */}
                <AnimatePresence mode="wait">
                    {!data?.courses || data.courses.length === 0 ? (
                        <motion.div 
                            key="empty"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center py-20 bg-[#0F172A]/50 rounded-[2.5rem] border border-dashed border-gray-800 shadow-inner"
                        >
                            <div className="p-6 bg-orange-500/5 rounded-full mb-6 border border-orange-500/10">
                                <FiAlertTriangle size={50} className="text-orange-500/50 animate-bounce" />
                            </div>
                            <h2 className="text-xl font-black uppercase italic tracking-widest text-white mb-2">No Data Signals</h2>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.2em] max-w-xs text-center leading-relaxed">
                                Current progress record is <span className="text-orange-500/70">Void</span>. Student has not been assigned to any sector nodes.
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div key="grid" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {data.courses.map((course, idx) => (
                                <motion.div 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    key={idx} 
                                    className="bg-[#0F172A] p-6 rounded-3xl border border-gray-800 hover:border-emerald-500/30 transition-all group shadow-xl"
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <h3 className="font-black text-lg text-white uppercase italic tracking-tight group-hover:text-emerald-400 transition-colors">{course.course_name}</h3>
                                        <span className={`text-[9px] font-black px-2 py-1 rounded uppercase tracking-tighter border ${course.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                            {course.status}
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div className="flex justify-between text-[10px] font-black uppercase text-gray-500 tracking-widest">
                                            <span>Sync Integrity</span>
                                            <span className="text-emerald-500">{course.progress}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-gray-900 rounded-full overflow-hidden border border-gray-800 shadow-inner">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${course.progress}%` }} transition={{ duration: 1, ease: "easeOut" }} className="h-full bg-emerald-500 shadow-[0_0_15px_#10b981]"></motion.div>
                                        </div>
                                        <div className="flex justify-between pt-4 border-t border-gray-800/50 mt-2">
                                            <div className="text-left">
                                                <p className="text-[8px] text-gray-600 uppercase font-black tracking-tighter">Accuracy Score</p>
                                                <p className="text-sm font-black text-white">{course.earned_marks}<span className="text-gray-700 font-medium">/{course.total_marks}</span></p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[8px] text-gray-600 uppercase font-black tracking-tighter">Last Uplink</p>
                                                <p className="text-sm font-black text-white">{course.last_submission}</p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};
export default StudentReport;