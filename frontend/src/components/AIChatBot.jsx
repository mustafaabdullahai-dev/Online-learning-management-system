import React, { useState, useRef, useEffect } from "react";
import { FiMessageSquare, FiX, FiSend, FiCpu, FiUser, FiTrash2 } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion"; // Consistent with your theme

const AIChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      role: "ai", 
      text: "👋 Initialize Sequence Complete. I am your OLMS AI Tutor. How can I assist your mission today?" 
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Auto-scroll to bottom
  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages, loading]);

  // Clear Chat Function
  const clearChat = () => {
    setMessages([{ role: "ai", text: "Buffer cleared. New session initialized. What is your query?" }]);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    // 1. User Message Add karein
    const userMsg = { role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input; // Backup input for API call
    setInput("");
    setLoading(true);

    try {
      // 2. Backend Call (Using gemini-flash-latest)
      const response = await fetch("/api/ask-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentInput }),
      });
      
      const data = await response.json();
      
      // 3. AI Response Add karein
      if (response.ok) {
        setMessages((prev) => [...prev, { role: "ai", text: data.reply }]);
      } else {
        setMessages((prev) => [...prev, { role: "ai", text: "⚠️ System Overload: Unable to process request." }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "ai", text: "❌ Connection Terminated. Check your network uplink." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] font-sans flex flex-col items-end">
      
      {/* --- Chat Window (Updated for Dark Grid Theme) --- */}
      <div className={`transition-all duration-300 transform origin-bottom-right 
          ${isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"}
          bg-[#070B14] w-[90vw] md:w-96 h-[500px] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-gray-800 flex flex-col overflow-hidden mb-4`}
      >
          
          {/* 1. Header Area (AuthPage Style) */}
          <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] p-4 flex justify-between items-center text-white border-b border-gray-800">
            <div className="flex items-center gap-3">
                <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                    <FiCpu className="text-xl text-emerald-500" />
                </div>
                <div>
                    <h3 className="font-black text-xs uppercase tracking-[0.2em]">OLMS AI Node</h3>
                    <div className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <p className="text-[9px] text-emerald-500/70 font-bold uppercase tracking-widest">Active Link</p>
                    </div>
                </div>
            </div>
            <div className="flex gap-1">
                <button onClick={clearChat} title="Purge Buffer" className="p-2 hover:bg-white/5 rounded-lg transition text-gray-500 hover:text-red-400">
                    <FiTrash2 size={16}/>
                </button>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-lg transition text-gray-500 hover:text-white">
                    <FiX size={20}/>
                </button>
            </div>
          </div>

          {/* 2. Messages Area (Dark Layout) */}
          <div className="flex-1 p-4 overflow-y-auto bg-[#070B14] space-y-4 custom-scrollbar">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} items-end gap-2`}>
                
                {/* AI Avatar */}
                {msg.role === "ai" && (
                    <div className="w-6 h-6 rounded-lg bg-[#1E293B] border border-gray-700 flex items-center justify-center text-emerald-500 text-xs shadow-sm mb-1">
                        <FiCpu />
                    </div>
                )}

                {/* Message Bubble */}
                <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs font-medium leading-relaxed shadow-lg border
                  ${msg.role === "user" 
                    ? "bg-emerald-500 text-[#070B14] border-emerald-400 rounded-br-none font-bold" 
                    : "bg-[#1E293B] border-gray-800 text-gray-200 rounded-bl-none"}`}>
                  {msg.text}
                </div>

                {/* User Avatar */}
                {msg.role === "user" && (
                    <div className="w-6 h-6 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center text-white text-xs shadow-sm mb-1">
                        <FiUser />
                    </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {loading && (
                <div className="flex justify-start items-end gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#1E293B] border border-gray-700 flex items-center justify-center text-emerald-500 text-xs shadow-sm">
                        <FiCpu />
                    </div>
                    <div className="bg-[#1E293B] border border-gray-800 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm flex gap-1.5">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 3. Input Area (Terminal Style) */}
          <div className="p-4 bg-[#0F172A] border-t border-gray-800">
            <div className="flex gap-2 bg-[#070B14] p-1.5 rounded-xl border border-gray-700 focus-within:border-emerald-500/50 transition-all shadow-inner">
                <input 
                type="text" 
                placeholder="Initialize query..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1 bg-transparent px-4 py-2 text-xs text-white focus:outline-none placeholder-gray-600 font-bold tracking-wide"
                />
                <button 
                    onClick={handleSend} 
                    disabled={loading || !input.trim()}
                    className={`p-3 rounded-lg transition-all shadow-lg flex items-center justify-center
                        ${loading || !input.trim() 
                            ? "bg-gray-800 text-gray-600 cursor-not-allowed" 
                            : "bg-emerald-500 text-[#070B14] hover:bg-emerald-400 hover:scale-105 active:scale-95"}`}
                >
                    <FiSend className={loading ? "animate-pulse" : ""} size={16}/>
                </button>
            </div>
            <div className="text-center mt-2">
                <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest">Quantum verification may vary. Proceed with caution.</p>
            </div>
          </div>
      </div>

      {/* --- Floating Toggle Button (AuthPage Style) --- */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`p-4 rounded-2xl shadow-2xl transition-all duration-300 flex items-center justify-center z-50 border
            ${isOpen 
                ? "bg-gray-800 border-gray-700 text-white rotate-90" 
                : "bg-emerald-500 border-emerald-400 text-[#070B14] hover:bg-emerald-400 hover:scale-110 shadow-[0_0_20px_rgba(16,185,129,0.3)]"}`}
      >
          {isOpen ? <FiX size={24} /> : <FiMessageSquare size={28} />}
          
          {/* Notification Dot (Only when closed) */}
          {!isOpen && (
            <span className="absolute top-0 right-0 flex h-4 w-4 -mt-1 -mr-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-[#070B14] border-2 border-emerald-500"></span>
            </span>
          )}
      </button>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #070B14; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 10px; }
      `}</style>

    </div>
  );
};

export default AIChatBot;