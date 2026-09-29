import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
    FiArrowLeft, FiSave, FiDownload, FiUser, FiClock, FiFileText, 
    FiCheckCircle, FiAlertCircle, FiSearch, FiFilter, FiBarChart2, FiPieChart, FiTrendingUp, FiX 
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const GradingPage = () => {
    const { assessmentId } = useParams();
    const navigate = useNavigate();
    
    // --- Data States ---
    const [submissions, setSubmissions] = useState([]);
    const [assessmentTitle, setAssessmentTitle] = useState(''); 
    const [maxPoints, setMaxPoints] = useState(100); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [savingStates, setSavingStates] = useState({});

    // --- Filter States ---
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    // --- Fetch Data ---
    const fetchSubmissions = useCallback(async () => {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");
        if (!token) { navigate('/signIn'); return; }

        try {
            const response = await fetch(`/api/assessments/${assessmentId}/submissions`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) {
                const errData = await response.json();
                if (response.status === 403 || response.status === 404) { setError(errData.error || "Access Denied. Node Locked."); }
                else { throw new Error(errData.error || "Failed to fetch transmission logs"); }
            } else {
                const data = await response.json();
                if (data.length > 0) {
                    setMaxPoints(data[0].max_points || 100);
                }
                setSubmissions(data.map(sub => ({
                    ...sub,
                    currentGrade: sub.grade !== null ? String(sub.grade) : '',
                    currentFeedback: sub.feedback || ''
                })));
                setAssessmentTitle(`Terminal Grading Protocol`); 
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [assessmentId, navigate]);

    useEffect(() => {
        fetchSubmissions();
    }, [fetchSubmissions]);

    // --- Calculated Stats ---
    const stats = useMemo(() => {
        const gradedSubs = submissions.filter(s => s.grade !== null);
        const totalGraded = gradedSubs.length;
        const totalSubs = submissions.length;
        
        const avgScore = totalGraded > 0 
            ? (gradedSubs.reduce((acc, curr) => acc + parseFloat(curr.grade), 0) / totalGraded).toFixed(1) 
            : 0;
            
        const highestScore = totalGraded > 0
            ? Math.max(...gradedSubs.map(s => parseFloat(s.grade)))
            : 0;

        return { totalGraded, totalSubs, avgScore, highestScore };
    }, [submissions]);

    // --- Filtered Data ---
    const filteredSubmissions = submissions.filter(sub => {
        const matchesSearch = sub.student_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = statusFilter === "All" 
            ? true 
            : statusFilter === "Pending" 
                ? (sub.status === "Submitted" || sub.status === "Late") && sub.grade === null
                : sub.status === statusFilter;
        return matchesSearch && matchesFilter;
    });

    // --- Handlers ---
    const handleInputChange = (submissionId, field, value) => {
        setSubmissions(prevSubs =>
            prevSubs.map(sub =>
                sub._id === submissionId ? { ...sub, [field]: value } : sub
            )
        );
    };

    const handleGradeSave = async (submissionId) => {
        const submission = submissions.find(sub => sub._id === submissionId);
        if (!submission) return;

        const gradeValue = submission.currentGrade.trim() === '' ? null : parseFloat(submission.currentGrade);
        const feedbackValue = submission.currentFeedback;

        if (submission.currentGrade.trim() !== '' && isNaN(gradeValue)) {
            alert('Invalid numeric identifier.');
            return;
        }
        if (gradeValue !== null && (gradeValue < 0 || gradeValue > maxPoints)) {
             alert(`Score must be between 0 and ${maxPoints}.`);
             return;
        }

        setSavingStates(prev => ({ ...prev, [submissionId]: true })); 
        const token = localStorage.getItem("token");

        try {
            const response = await fetch(`/api/submissions/${submissionId}/grade`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ grade: gradeValue, feedback: feedbackValue }),
            });
            if (!response.ok) throw new Error("Broadcast failed");
            
            setSubmissions(prevSubs =>
                prevSubs.map(sub =>
                    sub._id === submissionId ? { 
                        ...sub, 
                        grade: gradeValue, 
                        feedback: feedbackValue, 
                        status: gradeValue !== null ? 'Graded' : sub.status 
                    } : sub
                )
            );
        } catch (err) {
            alert("Error saving data: " + err.message);
        } finally {
            setSavingStates(prev => ({ ...prev, [submissionId]: false })); 
        }
    };

    if (loading) return (
        <div className="flex flex-col h-screen justify-center items-center bg-[#070B14]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            <p className="text-emerald-500 font-black uppercase tracking-[0.3em] text-[10px] mt-4 animate-pulse">Syncing Submission Logs...</p>
        </div>
    );

    if (error) return (
        <div className="p-8 bg-[#070B14] min-h-screen flex flex-col items-center justify-center text-center">
            <div className="bg-[#0F172A] p-10 rounded-[32px] shadow-2xl border border-red-500/20 max-w-md">
                <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-500">
                    <FiAlertCircle size={32} />
                </div>
                <h2 className="text-xl font-black text-white mb-2 uppercase italic tracking-tighter">Access Interrupted</h2>
                <p className="text-red-400/70 text-sm font-bold uppercase tracking-widest mb-8">{error}</p>
                <Link to="/assessments" className="px-8 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all inline-flex items-center gap-2">
                    <FiArrowLeft /> Return to Node
                </Link>
            </div>
        </div>
    );

    return (
        <div className="p-6 md:p-10 bg-[#070B14] min-h-screen font-sans text-gray-200">
            
            {/* --- TOP NAVIGATION & HEADER --- */}
            <div className="mb-10">
                 <Link to="/assessments" className="group text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 hover:text-emerald-400 mb-4 inline-flex items-center gap-3 transition-all">
                     <div className="w-8 h-8 rounded-xl bg-[#0F172A] border border-gray-800 flex items-center justify-center group-hover:border-emerald-500/50 transition-all shadow-lg">
                        <FiArrowLeft className="w-4 h-4" /> 
                     </div>
                     Return to Archive
                 </Link>
                 <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-2">
                    <div>
                        <h1 className="text-3xl font-black italic text-white tracking-tighter uppercase leading-none">{assessmentTitle}</h1>
                        <p className="text-gray-500 mt-2 font-bold flex items-center gap-4 text-[10px] uppercase tracking-widest">
                            <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 shadow-lg">Credits Cap: {maxPoints}</span>
                            <span className="text-gray-600">ID: {assessmentId}</span>
                        </p>
                    </div>
                 </div>
            </div>

            {/* --- ANALYTICS CARDS --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="bg-[#0F172A] p-6 rounded-3xl shadow-2xl border border-gray-800 flex items-center gap-5">
                    <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl border border-emerald-500/20 shadow-inner"><FiPieChart className="w-6 h-6"/></div>
                    <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Grading Progress</p>
                        <p className="text-2xl font-black text-white tracking-tighter">{stats.totalGraded} <span className="text-gray-700 text-lg font-medium">/ {stats.totalSubs}</span></p>
                    </div>
                </motion.div>
                <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:0.1}} className="bg-[#0F172A] p-6 rounded-3xl shadow-2xl border border-gray-800 flex items-center gap-5">
                    <div className="p-4 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20 shadow-inner"><FiBarChart2 className="w-6 h-6"/></div>
                    <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Sector Average</p>
                        <p className="text-2xl font-black text-white tracking-tighter">{stats.avgScore}%</p>
                    </div>
                </motion.div>
                <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:0.2}} className="bg-[#0F172A] p-6 rounded-3xl shadow-2xl border border-gray-800 flex items-center gap-5">
                    <div className="p-4 bg-purple-500/10 text-purple-400 rounded-2xl border border-purple-500/20 shadow-inner"><FiTrendingUp className="w-6 h-6"/></div>
                    <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Peak Credits</p>
                        <p className="text-2xl font-black text-white tracking-tighter">{stats.highestScore}</p>
                    </div>
                </motion.div>
            </div>

            {/* --- FILTER TOOLBAR --- */}
            <div className="bg-[#0F172A] p-2 rounded-2xl shadow-2xl border border-gray-800 mb-8 flex flex-col md:flex-row gap-2">
                <div className="relative flex-1 group">
                    <FiSearch className="absolute left-4 top-3.5 text-gray-500 group-focus-within:text-emerald-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Identify student node..." 
                        className="w-full pl-12 pr-4 py-3.5 bg-[#070B14] border border-gray-800 rounded-xl focus:border-emerald-500/50 outline-none text-white text-sm font-bold placeholder-gray-700 shadow-inner"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="relative w-full md:w-72">
                    <FiFilter className="absolute left-4 top-4 text-emerald-500/50 z-10" />
                    <select 
                        className="w-full pl-11 pr-10 py-3.5 bg-[#070B14] border border-gray-800 rounded-xl focus:border-emerald-500/50 outline-none text-[11px] font-black uppercase tracking-widest text-gray-400 appearance-none cursor-pointer shadow-inner"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="All">All Logs</option>
                        <option value="Pending">Pending Audit</option>
                        <option value="Graded">Verified</option>
                        <option value="Late">Late Entry</option>
                    </select>
                    <span className="absolute right-4 top-4 text-gray-600 pointer-events-none text-xs">▼</span>
                </div>
            </div>

            {/* --- SUBMISSIONS TABLE --- */}
            <div className="bg-[#0F172A] rounded-3xl border border-gray-800 shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="min-w-full text-sm text-left border-collapse">
                        <thead className="bg-[#1E293B]/30 border-b border-gray-800">
                            <tr>
                                <th className="px-8 py-5 font-black text-gray-500 uppercase tracking-[0.2em] text-[10px]">Student Identifier</th>
                                <th className="px-8 py-5 font-black text-gray-500 uppercase tracking-[0.2em] text-[10px]">Timestamp</th>
                                <th className="px-8 py-5 font-black text-gray-500 uppercase tracking-[0.2em] text-[10px]">Audit Status</th> 
                                <th className="px-8 py-5 font-black text-gray-500 uppercase tracking-[0.2em] text-[10px]">Data Packet</th> 
                                <th className="px-8 py-5 font-black text-gray-500 uppercase tracking-[0.2em] text-[10px] w-32 text-center">Credits</th>
                                <th className="px-8 py-5 font-black text-gray-500 uppercase tracking-[0.2em] text-[10px]">System Feedback</th>
                                <th className="px-8 py-5 font-black text-gray-500 uppercase tracking-[0.2em] text-[10px] text-right">Commit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/50">
                            {filteredSubmissions.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-24">
                                        <div className="flex flex-col items-center justify-center text-gray-600">
                                            <div className="bg-[#070B14] p-6 rounded-full mb-4 border border-gray-800 shadow-2xl">
                                                <FiFileText size={40} className="opacity-20" />
                                            </div>
                                            <p className="font-black uppercase tracking-widest text-xs">No active signals detected in this range.</p>
                                        </div>
                                    </td>
                                </tr> 
                            ) : (
                                filteredSubmissions.map((sub) => (
                                    <tr key={sub._id} className="hover:bg-[#1E293B]/20 transition-all group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-[#070B14] border border-gray-800 text-emerald-500 flex items-center justify-center font-black text-sm shadow-inner group-hover:border-emerald-500/50 transition-all">
                                                    {sub.student_name.charAt(0)}
                                                </div>
                                                <span className="font-bold text-gray-200 uppercase tracking-tight text-sm italic">{sub.student_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-gray-500 font-bold text-[11px] tracking-widest uppercase">
                                            <div className="flex items-center gap-2">
                                                <FiClock className="text-emerald-500/30" />
                                                {sub.submitted_at.replace('T', ' ').substring(0, 16)}
                                            </div>
                                        </td>
                                        
                                        <td className="px-8 py-6">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border shadow-lg ${
                                                sub.status === 'Graded' ? 'bg-emerald-500 text-[#070B14] border-emerald-400' :
                                                sub.status === 'Late' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                                'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                            }`}>
                                                {sub.status === 'Graded' && <FiCheckCircle className="w-3 h-3" />}
                                                {sub.status || 'Submitted'}
                                            </span>
                                        </td>

                                        <td className="px-8 py-6">
                                            {sub.submission_file_path ? (
                                                <a 
                                                    href={`/api/submissions/${sub._id}/file`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="inline-flex items-center gap-3 px-4 py-2 bg-[#070B14] border border-gray-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-emerald-500 hover:border-emerald-500/30 transition-all shadow-lg group-hover:shadow-emerald-500/5"
                                                >
                                                    <FiDownload size={14}/> 
                                                    <span className="truncate max-w-[100px]">{sub.submission_file_name || 'Packet'}</span>
                                                </a>
                                            ) : (
                                                <span className="text-gray-700 text-[10px] font-black uppercase tracking-widest italic">Void</span>
                                            )}
                                        </td>
                                        
                                        <td className="px-8 py-6">
                                            <div className="relative group/input flex justify-center">
                                                <input
                                                    type="number"
                                                    step="0.1" 
                                                    min="0"
                                                    max={maxPoints}
                                                    value={sub.currentGrade}
                                                    onChange={(e) => handleInputChange(sub._id, 'currentGrade', e.target.value)}
                                                    className="w-24 px-3 py-2 bg-[#070B14] border border-gray-800 rounded-xl focus:border-emerald-500/50 outline-none text-center text-sm font-black text-emerald-500 shadow-inner transition-all"
                                                    placeholder="0"
                                                />
                                                <span className="absolute -bottom-5 text-[8px] font-black text-gray-700 uppercase tracking-widest opacity-0 group-hover/input:opacity-100 transition-opacity">MAX: {maxPoints}</span>
                                            </div>
                                        </td>

                                        <td className="px-8 py-6">
                                            <input
                                                type="text"
                                                value={sub.currentFeedback}
                                                onChange={(e) => handleInputChange(sub._id, 'currentFeedback', e.target.value)}
                                                className="w-full min-w-[200px] bg-[#070B14] border border-gray-800 rounded-xl px-4 py-2.5 focus:border-emerald-500/50 outline-none text-xs font-medium text-gray-400 shadow-inner transition-all placeholder-gray-800"
                                                placeholder="Initialize feedback log..."
                                            />
                                        </td>

                                        <td className="px-8 py-6 text-right">
                                             <button
                                                 onClick={() => handleGradeSave(sub._id)}
                                                 disabled={savingStates[sub._id]}
                                                 className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-2xl active:scale-95
                                                    ${savingStates[sub._id] 
                                                        ? 'bg-emerald-500/50 text-[#070B14] cursor-wait' 
                                                        : 'bg-emerald-500 text-[#070B14] hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]'}`}
                                             >
                                                 {savingStates[sub._id] ? (
                                                     <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-[#070B14]"></div>
                                                 ) : (
                                                     <><FiSave size={14}/> Authorize</>
                                                 )}
                                             </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default GradingPage;