import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion"; // Consistent with your theme
import { FiUser, FiBriefcase, FiLink, FiBookOpen, FiHome, FiShield } from "react-icons/fi";

const CompleteProfile = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const role = searchParams.get("role");
  const email = searchParams.get("email");

  // Form State
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/submit-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, details: formData }),
      });

      if (response.ok) {
        alert("Node details submitted! Identity clearance pending.");
        navigate('/signIn');
      }
    } catch {
      alert("Transmission Error: Unable to submit profile details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070B14] p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#0F172A] p-10 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-full max-w-lg border border-gray-800 relative overflow-hidden"
      >
        {/* Decorative Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full filter blur-3xl"></div>

        <div className="relative z-10 text-center mb-10">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
             <FiShield className="text-emerald-500 text-3xl" />
          </div>
          <h2 className="text-3xl font-black italic text-white tracking-tighter uppercase leading-none mb-3">
            Initialize <span className="text-emerald-500">{role}</span> Profile
          </h2>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest leading-relaxed">
            Provide identity nodes for terminal verification and authorization.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          
          {/* --- INSTRUCTOR REQUIREMENTS --- */}
          {role === "instructor" && (
            <>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Experience (Cycles)</label>
                <div className="relative">
                    <FiCalendar className="absolute left-4 top-4 text-gray-600" />
                    <input name="experience" required type="number" placeholder="Years of Experience" onChange={handleInputChange} className="w-full bg-[#070B14] border border-gray-800 p-4 pl-12 rounded-xl text-white outline-none focus:border-emerald-500/50 transition-all font-bold text-sm" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Core Expertise</label>
                <div className="relative">
                    <FiBriefcase className="absolute left-4 top-4 text-gray-600" />
                    <input name="expertise" required type="text" placeholder="e.g. Python, Machine Learning" onChange={handleInputChange} className="w-full bg-[#070B14] border border-gray-800 p-4 pl-12 rounded-xl text-white outline-none focus:border-emerald-500/50 transition-all font-bold text-sm" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Archive Link (Portfolio)</label>
                <div className="relative">
                    <FiLink className="absolute left-4 top-4 text-gray-600" />
                    <input name="cv_link" required type="url" placeholder="https://portfolio-uplink.com" onChange={handleInputChange} className="w-full bg-[#070B14] border border-gray-800 p-4 pl-12 rounded-xl text-white outline-none focus:border-emerald-500/50 transition-all font-bold text-sm" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Mission Objective</label>
                <textarea name="bio" required rows="3" placeholder="Why do you wish to broadcast knowledge?" onChange={handleInputChange} className="w-full bg-[#070B14] border border-gray-800 p-4 rounded-xl text-white outline-none focus:border-emerald-500/50 transition-all font-bold text-sm resize-none"></textarea>
              </div>
            </>
          )}

          {/* --- STUDENT REQUIREMENTS --- */}
          {role === "student" && (
            <>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Identity Identifier (CNIC)</label>
                <div className="relative">
                    <FiUser className="absolute left-4 top-4 text-gray-600" />
                    <input name="student_id" required type="text" placeholder="Enter Numeric Identifier" onChange={handleInputChange} className="w-full bg-[#070B14] border border-gray-800 p-4 pl-12 rounded-xl text-white outline-none focus:border-emerald-500/50 transition-all font-bold text-sm" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Current Protocol (Education)</label>
                <div className="relative">
                    <FiBookOpen className="absolute left-4 top-4 text-gray-600 z-10" />
                    <select name="education" onChange={handleInputChange} className="w-full bg-[#070B14] border border-gray-800 p-4 pl-12 rounded-xl text-gray-400 outline-none focus:border-emerald-500/50 transition-all font-black uppercase text-[10px] tracking-widest appearance-none cursor-pointer">
                      <option>Matric/O-Levels</option>
                      <option>Inter/A-Levels</option>
                      <option>Undergraduate</option>
                      <option>Graduate</option>
                    </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Assigned Institution</label>
                <div className="relative">
                    <FiHome className="absolute left-4 top-4 text-gray-600" />
                    <input name="institution" required type="text" placeholder="Base Institution Name" onChange={handleInputChange} className="w-full bg-[#070B14] border border-gray-800 p-4 pl-12 rounded-xl text-white outline-none focus:border-emerald-500/50 transition-all font-bold text-sm" />
                </div>
              </div>
            </>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-5 bg-emerald-500 text-[#070B14] font-black rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-emerald-400 transition-all transform active:scale-95 uppercase text-xs tracking-[0.2em] mt-4"
          >
            {loading ? "Transmitting..." : "Initialize Identity Link"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default CompleteProfile;