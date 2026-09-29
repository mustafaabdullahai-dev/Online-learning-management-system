import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSend, FiUser, FiMoreVertical, FiPaperclip } from 'react-icons/fi';
import { motion } from 'framer-motion'; // Consistent with other pages

const DiscussionViewPage = () => {
    const { discussionId } = useParams();
    const navigate = useNavigate();
    const messagesEndRef = useRef(null); 

    const [discussionTitle, setDiscussionTitle] = useState('');
    const [replies, setReplies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- State for new reply ---
    const [newReplyContent, setNewReplyContent] = useState('');
    const [postingReply, setPostingReply] = useState(false);

    // 1. GET CURRENT USER ID
    const currentUserId = localStorage.getItem("userId"); 
    
    // --- Auto Scroll to Bottom ---
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [replies]);

    // --- Fetch Discussion ---
    const fetchDiscussionData = useCallback(async () => {
        setError(null);
        
        const token = localStorage.getItem("token");
        if (!token) { navigate('/signIn'); return; }

        try {
            const response = await fetch(`/api/discussions/${discussionId}/replies`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) {
                const errData = await response.json();
                if (response.status === 403) setError("Access Denied. Terminal Locked.");
                else if (response.status === 404) setError("Broadcast Node Not Found.");
                else throw new Error(errData.error || "Failed to fetch log replies");
            } else {
                const data = await response.json();
                setDiscussionTitle(data.discussion_title);
                setReplies(data.replies);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [discussionId, navigate]); 

    // --- Initial Load Effect ---
    useEffect(() => {
        setLoading(true);
        fetchDiscussionData();
    }, [fetchDiscussionData]);

    // --- Handle Post Reply ---
    const handlePostReply = useCallback(async (event) => {
        if (event) event.preventDefault();
        if (!newReplyContent.trim() || postingReply) return;

        setPostingReply(true);
        const token = localStorage.getItem("token");

        // Optimistic Update
        const optimisticReply = {
            _id: Date.now().toString(),
            content: newReplyContent,
            user_id: currentUserId, 
            user_name: "Me",
            created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };
        
        setReplies(prev => [...prev, optimisticReply]); 
        setNewReplyContent(''); 

        try {
            const response = await fetch(`/api/discussions/${discussionId}/replies`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ content: optimisticReply.content }), 
            });
            
            if (!response.ok) throw new Error("Broadcast Failed");
            
            fetchDiscussionData(); 
        } catch (err) {
            alert("Transmission Error: " + err.message);
        } finally {
            setPostingReply(false);
        }
    }, [discussionId, newReplyContent, fetchDiscussionData, postingReply, currentUserId]);

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handlePostReply();
        }
    };

    if (loading) return (
        <div className="flex flex-col h-screen justify-center items-center bg-[#070B14]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
            <p className="text-emerald-500 font-black uppercase tracking-[0.3em] text-[10px] mt-4 animate-pulse">Syncing Log Replies...</p>
        </div>
    );

    if (error) return (
        <div className="flex h-screen justify-center items-center bg-[#070B14] p-6 text-center">
            <div className="bg-[#0F172A] p-10 rounded-[32px] border border-red-500/20 shadow-2xl">
                <h2 className="text-red-500 font-black uppercase tracking-widest text-lg mb-2 italic">Signal Interrupted</h2>
                <p className="text-gray-400 mb-6 text-sm uppercase font-bold">{error}</p>
                <Link to="/discussions" className="px-6 py-3 bg-emerald-500 text-[#070B14] rounded-xl font-black uppercase text-xs tracking-widest hover:bg-emerald-400 transition-all">Back to Forum</Link>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-screen bg-[#070B14] font-sans overflow-hidden">
            
            {/* Header (Futuristic Terminal Style) */}
            <div className="bg-[#0F172A] text-white px-4 py-3 flex items-center justify-between border-b border-gray-800 shadow-2xl z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <Link to="/discussions" className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-emerald-500 hover:border-emerald-500/30 transition-all">
                        <FiArrowLeft size={20} />
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-inner">
                            <FiUser className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="font-black text-sm md:text-base leading-tight truncate max-w-[180px] md:max-w-md uppercase tracking-tight italic">
                                {discussionTitle}
                            </h1>
                            <p className="text-[10px] text-emerald-500/60 font-black uppercase tracking-widest">
                                {replies.length} Data Packets Syncing
                            </p>
                        </div>
                    </div>
                </div>
                <button className="p-2.5 hover:bg-white/5 rounded-xl text-gray-500 transition-colors">
                    <FiMoreVertical size={20} />
                </button>
            </div>

            {/* Chat Area (Updated Background to match Terminal Theme) */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#070B14] relative">
                {/* Visual Grid Pattern (Optional subtle effect) */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(rgba(16,185,129,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.1)_1px,transparent_1px)] bg-[size:32px_32px]"></div>
                
                <div className="max-w-4xl mx-auto space-y-4 relative z-10">
                    <div className="flex justify-center mb-6">
                        <span className="bg-[#1E293B] text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em] py-1.5 px-4 rounded-full border border-gray-800 shadow-xl">
                            Frequency Active: Today
                        </span>
                    </div>

                    {replies.length === 0 ? (
                        <div className="text-center py-16">
                            <p className="bg-emerald-500/5 text-emerald-500/70 border border-emerald-500/10 text-[10px] font-black uppercase tracking-widest py-3 px-6 rounded-2xl inline-block shadow-inner">
                                🔒 Encrypted Transmission Channel Active
                            </p>
                            <p className="mt-6 text-gray-600 text-xs font-bold uppercase tracking-widest">No signals detected. Initialize broadcast.</p>
                        </div>
                    ) : (
                        replies.map((reply, idx) => {
                            const serverId = String(reply.user_id || reply.sender_id || "").trim();
                            const localId = String(currentUserId || "").trim();
                            const isMe = serverId === localId;

                            return (
                                <motion.div 
                                    initial={{ opacity: 0, x: isMe ? 20 : -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    key={reply._id} 
                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'} group mb-2`}
                                >
                                    <div className={`relative max-w-[85%] md:max-w-[70%] px-4 py-3 rounded-2xl shadow-xl border ${
                                        isMe 
                                            ? 'bg-emerald-500 text-[#070B14] border-emerald-400 rounded-tr-none' 
                                            : 'bg-[#1E293B] text-gray-200 border-gray-700 rounded-tl-none'
                                    }`}>
                                        
                                        {!isMe && (
                                            <p className="text-[10px] font-black text-emerald-400 mb-1 uppercase tracking-widest">
                                                {reply.user_name}
                                            </p>
                                        )}

                                        <p className={`whitespace-pre-wrap leading-relaxed text-sm ${isMe ? 'font-bold' : 'font-medium'}`}>
                                            {reply.content}
                                        </p>

                                        <div className={`flex justify-end items-center gap-1 mt-2 select-none ${isMe ? 'text-[#070B14]/60' : 'text-gray-500'}`}>
                                            <span className="text-[9px] font-black uppercase tracking-tighter">
                                                {reply.created_at ? reply.created_at.split(" ")[1] : ""}
                                            </span>
                                        </div>

                                        {/* Tail Fix (Triangle tail for bubbles) */}
                                        <div className={`absolute top-0 w-0 h-0 border-[8px] border-solid border-transparent 
                                            ${isMe 
                                                ? 'right-[-8px] border-t-emerald-500 border-l-emerald-500' 
                                                : 'left-[-8px] border-t-[#1E293B] border-r-[#1E293B]'
                                            }`}>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area (Terminal Style) */}
            <div className="bg-[#0F172A] px-4 py-4 shrink-0 border-t border-gray-800 shadow-[0_-10px_40px_rgba(0,0,0,0.4)]">
                <div className="max-w-4xl mx-auto flex items-end gap-3">
                    <button className="p-3.5 text-gray-500 hover:bg-white/5 hover:text-emerald-500 rounded-2xl transition-all mb-1 border border-transparent hover:border-gray-800">
                        <FiPaperclip size={20} />
                    </button>

                    <form 
                        onSubmit={handlePostReply} 
                        className="flex-1 bg-[#070B14] rounded-[24px] flex items-center shadow-inner border border-gray-800 focus-within:border-emerald-500/50 transition-all"
                    >
                        <textarea
                            value={newReplyContent}
                            onChange={(e) => setNewReplyContent(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Initialize response..."
                            rows={1}
                            className="w-full py-4 px-6 bg-transparent outline-none text-white text-sm font-bold resize-none max-h-32 custom-scrollbar placeholder-gray-700"
                            style={{ minHeight: '52px' }}
                        />
                    </form>

                    <button
                        onClick={handlePostReply}
                        disabled={!newReplyContent.trim() || postingReply}
                        className={`p-4 rounded-2xl mb-1 transition-all transform active:scale-95 shadow-2xl flex items-center justify-center
                            ${!newReplyContent.trim() 
                                ? 'bg-gray-800 text-gray-600 border border-gray-700' 
                                : 'bg-emerald-500 text-[#070B14] hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                            }`}
                    >
                        {postingReply ? (
                            <div className="w-5 h-5 border-2 border-[#070B14] border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <FiSend className={`w-5 h-5 ${newReplyContent.trim() ? 'ml-0.5' : ''}`} />
                        )}
                    </button>
                </div>
                <div className="text-center mt-3">
                     <p className="text-[9px] text-gray-600 font-black uppercase tracking-[0.2em]">Transmission Protocol V4.2 | OLMS Grid Access</p>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default DiscussionViewPage;