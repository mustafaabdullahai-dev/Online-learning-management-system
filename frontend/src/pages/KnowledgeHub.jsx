import React, { useState, useEffect } from "react";
// Icons import kar rahe hain
import { FiExternalLink, FiClock, FiUser, FiTag } from "react-icons/fi";
// AI Chatbot Component Import
import AIChatBot from "../components/AIChatBot"; 
import { motion } from "framer-motion"; // Consistently added for theme smoothness

const KnowledgeHub = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const response = await fetch('/api/news');
      const data = await response.json();
      
      // Safety Check: Data array hona chahiye
      if (Array.isArray(data)) {
        setArticles(data);
      } else {
        setArticles([]); 
      }
    } catch (error) {
      console.error("Error fetching articles:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-screen bg-[#070B14]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        <p className="text-emerald-500 font-black uppercase tracking-[0.3em] text-[10px] mt-4 animate-pulse">Syncing Knowledge Base...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#070B14] p-6 md:p-12 font-sans relative text-white">
      
      {/* Header Section (AuthPage Style) */}
      <div className="text-center mb-16">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-black italic text-white mb-4 tracking-tighter uppercase leading-none"
        >
          OLMS <span className="text-emerald-500">Knowledge</span> Hub
        </motion.h1>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.2em] max-w-2xl mx-auto">
          Access curated learning nodes, study protocols, and futuristic technology trends.
        </p>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto mb-20">
        {articles.map((article, index) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            key={index} 
            className="bg-[#0F172A] rounded-[32px] overflow-hidden shadow-2xl hover:border-emerald-500/30 transition-all duration-300 border border-gray-800 flex flex-col h-full group"
          >
            
            {/* Image Section */}
            <div className="relative h-56 overflow-hidden bg-[#070B14]">
                <img 
                    src={article.urlToImage} 
                    alt={article.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                    onError={(e) => {
                        e.target.onerror = null; 
                        e.target.src = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80";
                    }}
                />
                {/* Category Badge (Terminal Style) */}
                <div className="absolute top-4 left-4 bg-[#070B14]/80 backdrop-blur-md px-4 py-1.5 rounded-xl text-[10px] font-black text-emerald-500 border border-emerald-500/20 shadow-lg uppercase tracking-widest flex items-center gap-2">
                    <FiTag /> {article.category || "Learning Node"}
                </div>
            </div>

            {/* Content Section */}
            <div className="p-8 flex flex-col flex-1">
                
                {/* Meta Info */}
                <div className="flex items-center gap-5 text-[10px] font-black text-gray-500 mb-5 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5 truncate max-w-[120px]">
                        <FiUser className="text-emerald-500/50"/> {article.author || "OLMS Admin"}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <FiClock className="text-emerald-500/50"/> {article.readTime || "5 MIN READ"}
                    </span>
                </div>

                {/* Title (Futuristic Typography) */}
                <h3 className="text-xl font-black text-white mb-4 leading-tight line-clamp-2 group-hover:text-emerald-400 transition-colors uppercase italic tracking-tight">
                    {article.title}
                </h3>
                
                {/* Description */}
                <p className="text-gray-400 text-sm font-medium leading-relaxed line-clamp-3 mb-8 flex-1">
                    {article.description || "Initialize data uplink to access the full log regarding this intellectual node..."}
                </p>

                {/* Read More Button (AuthPage Style Button) */}
                <a 
                    href={article.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full text-center bg-[#070B14] hover:bg-emerald-500 text-emerald-500 hover:text-[#070B14] border border-gray-800 hover:border-emerald-500 font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3 group/btn uppercase text-[10px] tracking-[0.2em] shadow-lg"
                >
                    Access Full Node <FiExternalLink className="group-hover/btn:translate-x-1 transition-transform text-lg"/>
                </a>
            </div>

          </motion.div>
        ))}
      </div>

      {/* --- AI CHATBOT FEATURE --- */}
      <AIChatBot />

    </div>
  );
};

export default KnowledgeHub;