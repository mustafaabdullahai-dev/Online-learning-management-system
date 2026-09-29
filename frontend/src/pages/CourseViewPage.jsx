import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlayCircle, FiFileText, FiLink, FiArrowLeft, FiCheckSquare, FiCalendar, FiDownload, FiClock, FiAlertCircle, FiX } from 'react-icons/fi';

// Content Type Icons (Updated for Terminal Theme)
const contentIconMap = {
    Video: <FiPlayCircle className="w-5 h-5 text-emerald-500" />,
    Document: <FiFileText className="w-5 h-5 text-blue-400" />,
    Link: <FiLink className="w-5 h-5 text-purple-400" />,
};

// Assessment Type Icons (Updated for Terminal Theme)
const assessmentIconMap = {
    Quiz: <FiCheckSquare className="w-5 h-5 text-emerald-500" />,
    Assignment: <FiFileText className="w-5 h-5 text-blue-400" />,
    Project: <FiCheckSquare className="w-5 h-5 text-orange-400" />,
    Exam: <FiAlertCircle className="w-5 h-5 text-red-500" />,
};

const CourseViewPage = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [courseTitle, setCourseTitle] = useState('');
    const [contentItems, setContentItems] = useState([]);
    const [assessments, setAssessments] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Submission States ---
    const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
    const [selectedAssessment, setSelectedAssessment] = useState(null); 
    const [submissionError, setSubmissionError] = useState(null);

    // --- Helper: Check Overdue ---
    const isOverdue = (dueDate) => {
        const due = new Date(dueDate);
        const now = new Date();
        return now > due;
    };

    // --- Fetch Course Data ---
    const fetchCourseData = useCallback(async () => {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");
        if (!token) { navigate('/signIn'); return; }

        try {
            const [contentResponse, assessmentResponse] = await Promise.all([
                fetch(`/api/courses/${courseId}/content`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                }),
                fetch(`/api/courses/${courseId}/assessments`, { 
                    headers: { 'Authorization': `Bearer ${token}` },
                })
            ]);

            if (!contentResponse.ok) {
                const errData = await contentResponse.json();
                if (contentResponse.status === 403) { throw new Error(errData.error || "Access Denied. Node Locked."); }
                else if (contentResponse.status === 404) { throw new Error("Sector Not Found."); }
                else { throw new Error(errData.error || "Failed to sync node content"); }
            }
            const contentData = await contentResponse.json();
            setCourseTitle(contentData.course_title); 
            setContentItems(contentData.content);

            if (assessmentResponse.ok) {
                 const assessmentData = await assessmentResponse.json();
                 setAssessments(assessmentData); 
            }
        } catch (err) {
            setError(err.message); 
        } finally {
            setLoading(false);
        }
    }, [courseId, navigate]);

    // --- Handle Submission ---
    const handleSubmissionSubmit = async (e) => {
        e.preventDefault();
        setSubmissionError(null);
        const token = localStorage.getItem("token");
        
        const formData = new FormData(e.target);
        const fileInput = e.target.querySelector('input[name="submission_file"]');
        
        if (!fileInput || fileInput.files.length === 0 || fileInput.files[0].size === 0) {
            setSubmissionError("Please identify a data packet for transmission.");
            return;
        }

        try {
            const response = await fetch(`/api/assessments/${selectedAssessment._id}/submit`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData, 
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || result.message || "Uplink failed.");
            }
            
            setIsSubmissionModalOpen(false);
            setSelectedAssessment(null);
            fetchCourseData(); 
            alert(result.message);

        } catch (err) {
            setSubmissionError(err.message);
        }
    };

    useEffect(() => {
        fetchCourseData();
    }, [fetchCourseData]);

    if (loading) return (
        <div className="flex flex-col h-screen justify-center items-center bg-[#070B14]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            <p className="text-emerald-500 font-black uppercase tracking-[0.3em] text-[10px] mt-4 animate-pulse">Synchronizing Sector Data...</p>
        </div>
    );

    if (error) return (
        <div className="p-8 bg-[#070B14] min-h-screen flex flex-col items-center justify-center text-center font-sans">
             <div className="bg-[#0F172A] p-10 rounded-[32px] shadow-2xl border border-red-500/20 max-w-md">
                <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-500">
                    <FiAlertCircle size={32} />
                </div>
                <h2 className="text-xl font-black text-white mb-2 uppercase italic tracking-tighter">Connection Failed</h2>
                <p className="text-red-400/70 text-sm font-bold uppercase tracking-widest mb-8 leading-relaxed">{error}</p>
                <Link to="/courses" className="px-8 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all inline-flex items-center gap-2">
                    <FiArrowLeft /> Return to Grid
                </Link>
            </div>
        </div>
    );

    return (
        <div className="p-6 md:p-10 bg-[#070B14] min-h-screen font-sans text-gray-200">
            <div className="max-w-5xl mx-auto">
                
                {/* --- Header --- */}
                <div className="mb-10"> 
                    <Link to="/courses" className="group text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 hover:text-emerald-400 mb-4 inline-flex items-center gap-3 transition-all">
                         <div className="w-8 h-8 rounded-xl bg-[#0F172A] border border-gray-800 flex items-center justify-center group-hover:border-emerald-500/50 transition-all shadow-lg">
                            <FiArrowLeft className="w-4 h-4" /> 
                         </div>
                         Node Directory
                    </Link>
                    <h1 className="text-4xl font-black italic text-white tracking-tighter uppercase leading-tight">{courseTitle}</h1>
                </div>

                {/* --- Content Section --- */}
                <section className="mb-12">
                    <div className="flex items-center justify-between mb-6 border-b border-gray-800 pb-4">
                        <h2 className="text-sm font-black uppercase tracking-widest text-white italic">Sector Materials</h2>
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">{contentItems.length} Nodes</span>
                    </div>
                    
                    {contentItems.length === 0 ? (
                        <div className="bg-[#0F172A] p-12 rounded-[32px] border border-dashed border-gray-800 text-center shadow-inner">
                            <p className="text-gray-600 text-xs font-black uppercase tracking-widest">No material nodes detected in this sector.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {contentItems.map((item, index) => (
                                <motion.div 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    key={item._id} 
                                    className="group bg-[#0F172A] p-5 rounded-2xl border border-gray-800 hover:border-emerald-500/30 shadow-xl transition-all flex items-center justify-between gap-4"
                                >
                                    <div className="flex items-center gap-5 overflow-hidden">
                                         <div className="w-12 h-12 rounded-xl bg-[#070B14] border border-gray-800 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/5 transition-all shadow-inner">
                                            {contentIconMap[item.type] || <FiLink className="w-5 h-5 text-gray-400" />}
                                         </div>
                                         <div className="min-w-0">
                                             <h3 className="font-bold text-gray-200 truncate group-hover:text-emerald-400 transition-colors uppercase tracking-tight italic">{index + 1}. {item.title}</h3>
                                             {item.duration && <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5 mt-1"><FiClock className="w-3 h-3 text-emerald-500/50"/> Runtime: {item.duration}</p>}
                                         </div>
                                    </div>
                                    <a href={item.url || '#'} target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 bg-[#070B14] border border-gray-800 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-500 hover:text-[#070B14] transition-all whitespace-nowrap shadow-lg group-hover:shadow-emerald-500/10">
                                        {item.type === 'Video' ? 'Stream' : 'Access Node'}
                                    </a>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </section>

                {/* --- Assessments Section --- */}
                <section>
                    <div className="flex items-center justify-between mb-6 border-b border-gray-800 pb-4">
                        <h2 className="text-sm font-black uppercase tracking-widest text-white italic">Mission Tasks</h2>
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-400/10 px-3 py-1 rounded-full border border-blue-400/20">{assessments.length} Active</span>
                    </div>

                    {assessments.length === 0 ? (
                        <div className="bg-[#0F172A] p-12 rounded-[32px] border border-dashed border-gray-800 text-center shadow-inner">
                            <p className="text-gray-600 text-xs font-black uppercase tracking-widest">No active tasks detected on current frequency.</p>
                        </div>
                    ) : (
                        <div className="grid gap-5">
                            {assessments.map((assessment, idx) => (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    key={assessment._id} 
                                    className="bg-[#0F172A] p-6 rounded-3xl border border-gray-800 hover:border-emerald-500/20 shadow-2xl transition-all"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                        
                                        {/* Left Info */}
                                        <div className="flex items-start gap-5">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-inner ${
                                                assessment.type === 'Exam' ? 'bg-red-500/5 border-red-500/20 text-red-500' : 'bg-blue-500/5 border-blue-500/20 text-blue-400'
                                            }`}>
                                                {assessmentIconMap[assessment.type] || <FiCheckSquare size={24} />}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-white text-xl leading-none uppercase italic tracking-tight">{assessment.title}</h3>
                                                <div className="flex items-center gap-4 mt-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                                                    <span className="bg-[#070B14] px-2.5 py-1 rounded-lg border border-gray-800 text-blue-400">{assessment.type}</span>
                                                    <span className={`flex items-center gap-2 ${isOverdue(assessment.due) && assessment.status !== 'Submitted' ? 'text-red-500' : 'text-gray-400'}`}>
                                                        <FiCalendar size={14} className="text-emerald-500/50"/> Deadline: {new Date(assessment.due).toLocaleDateString()}
                                                    </span>
                                                    {assessment.total_points && <span className="border-l border-gray-800 pl-4 text-emerald-500/70">{assessment.total_points} Credits</span>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Actions */}
                                        <div className="flex flex-col sm:items-end gap-3 w-full sm:w-auto">
                                            
                                            {/* Status Badge (Updated for Terminal Look) */}
                                            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter border shadow-lg ${
                                                assessment.status === 'Graded' ? 'bg-emerald-500 text-[#070B14] border-emerald-400' :
                                                assessment.status === 'Submitted' ? 'bg-blue-500 text-white border-blue-400' :
                                                assessment.status === 'Late' ? 'bg-orange-500 text-[#070B14] border-orange-400' :
                                                isOverdue(assessment.due) ? 'bg-red-500 text-white border-red-400' :
                                                'bg-gray-800 text-gray-400 border-gray-700'
                                            }`}>
                                                {assessment.status === 'Graded' 
                                                    ? `Score: ${assessment.grade}/${assessment.total_points}` 
                                                    : assessment.status === 'Submitted' ? 'Transmitted'
                                                    : assessment.status === 'Late' ? 'Late Transmission'
                                                    : isOverdue(assessment.due) ? 'Uplink Closed'
                                                    : 'Awaiting Upload'}
                                            </div>

                                            <div className="flex gap-3 w-full sm:w-auto">
                                                {assessment.assignment_file_path && (
                                                    <a
                                                        href={`/api/assessments/${assessment._id}/file`}
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white/5 border border-gray-700 rounded-xl text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-white hover:border-gray-500 transition-all"
                                                    >
                                                        <FiDownload size={14} /> Packet
                                                    </a>
                                                )}
                                                
                                                {assessment.status !== 'Submitted' && assessment.status !== 'Graded' && (
                                                    <button
                                                        onClick={() => { setSelectedAssessment(assessment); setIsSubmissionModalOpen(true); }}
                                                        disabled={isOverdue(assessment.due)} 
                                                        className={`flex-1 sm:flex-none px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.1)] transition-all
                                                            ${isOverdue(assessment.due) 
                                                                ? 'bg-gray-800 text-gray-600 border border-gray-700 cursor-not-allowed' 
                                                                : 'bg-emerald-500 text-[#070B14] hover:bg-emerald-400 active:scale-95'
                                                            }`}
                                                    >
                                                        {isOverdue(assessment.due) ? 'Access Revoked' : 'Initialize Uplink'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
            
            {/* --- Submission Modal (Vault Style) --- */}
            <AnimatePresence>
             {isSubmissionModalOpen && selectedAssessment && (
                 <div className="fixed inset-0 flex items-center justify-center bg-[#070B14]/90 backdrop-blur-md z-[100] p-4">
                     <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-[#0F172A] border border-gray-800 rounded-[32px] shadow-[0_0_60px_rgba(0,0,0,0.6)] w-full max-w-lg overflow-hidden"
                     >
                         <div className="px-10 py-7 border-b border-gray-800 flex justify-between items-center bg-[#1E293B]/30">
                             <div>
                                 <h2 className="text-xl font-black italic text-white uppercase tracking-tighter">Data Transmission</h2>
                                 <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Node: {selectedAssessment.title}</p>
                             </div>
                             <button onClick={() => setIsSubmissionModalOpen(false)} className="text-gray-500 hover:text-white transition-colors p-2 bg-white/5 rounded-full outline-none"><FiX size={20}/></button>
                         </div>
                         
                         <div className="p-10 space-y-6">
                            <div className="bg-[#070B14] p-5 rounded-2xl border border-gray-800 shadow-inner">
                                <div className="flex items-center gap-3 text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">
                                    <FiClock size={16}/> Frequency Deadline
                                </div>
                                <p className={`text-lg font-black tracking-widest ${isOverdue(selectedAssessment.due) ? 'text-red-500' : 'text-white'}`}>
                                    {new Date(selectedAssessment.due).toLocaleString()}
                                </p>
                                {selectedAssessment.instructions && (
                                    <div className="mt-4 border-t border-gray-800 pt-4">
                                        <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] block mb-2">Op Instructions:</span>
                                        <p className="text-xs text-gray-400 font-bold italic leading-relaxed">
                                            "{selectedAssessment.instructions}"
                                        </p>
                                    </div>
                                )}
                            </div>
                            
                            {submissionError && <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest text-center animate-shake">{submissionError}</div>}

                            <form onSubmit={handleSubmissionSubmit} encType="multipart/form-data" className="space-y-8">
                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Upload Data Packet (PDF/DOCX)</label>
                                    <div className="relative group">
                                        <input 
                                            name="submission_file" 
                                            type="file" 
                                            accept=".pdf,.doc,.docx" 
                                            required
                                            className="w-full text-[10px] font-black uppercase text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-emerald-500 file:text-[#070B14] hover:file:bg-emerald-400 cursor-pointer bg-[#070B14] rounded-2xl border border-gray-800 p-2 transition-all focus:border-emerald-500/50"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-4 pt-6 border-t border-gray-800">
                                    <button type="button" 
                                        onClick={() => { setIsSubmissionModalOpen(false); setSubmissionError(null); setSelectedAssessment(null); }} 
                                        className="px-8 py-4 rounded-xl border border-gray-800 text-gray-500 font-black text-[10px] uppercase tracking-widest hover:text-white hover:bg-white/5 transition-all">
                                        Abort
                                    </button>
                                    <button type="submit" 
                                        disabled={isOverdue(selectedAssessment.due)}
                                        className={`px-10 py-4 bg-emerald-500 text-[#070B14] rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-emerald-400 transition-all
                                            ${isOverdue(selectedAssessment.due) ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] active:scale-95'}`}>
                                        Transmit Packet
                                    </button>
                                </div>
                            </form>
                         </div>
                     </motion.div>
                 </div>
             )}
            </AnimatePresence>
        </div>
    );
};

export default CourseViewPage;