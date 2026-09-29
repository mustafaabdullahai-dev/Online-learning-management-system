/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { 
  AiOutlineCheckCircle, AiOutlineIdcard, AiOutlinePhone, 
  AiOutlineBook, AiOutlineFieldTime, AiOutlineFileImage, 
  AiOutlineKey, AiOutlineUser, AiOutlineHome, AiOutlineGlobal
} from "react-icons/ai";
import { BsMortarboardFill } from "react-icons/bs";
import { motion } from "framer-motion";

// --- Custom Modern Dark Input (Synced with Dashboard) ---
const DarkInput = ({ label, name, type = "text", placeholder, icon, value, onChange, required = true }) => (
  <div className="w-full space-y-2">
    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute left-4 top-4 text-gray-500 group-focus-within:text-emerald-500 transition-colors">
        {icon}
      </div>
      <input 
        name={name} type={type} placeholder={placeholder} value={value} onChange={onChange} required={required}
        className="w-full pl-12 pr-4 py-4 bg-[#0F172A] border border-gray-800 rounded-2xl outline-none focus:border-emerald-500/50 transition-all text-sm text-white placeholder:text-gray-700 shadow-inner"
      />
    </div>
  </div>
);

function VerifyRole() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get("email") || "";
  const role = (searchParams.get("role") || "instructor").toLowerCase();

  useEffect(() => {
    localStorage.setItem("pendingVerification", "true");
    localStorage.setItem("pendingEmail", email);
  }, [email]);

  const [formData, setFormData] = useState({
    firstName: "", lastName: "", fatherName: "",
    cnicNumber: "", nationality: "Pakistani", domicile: "",
    phone: "", emergencyContact: "", guardianContact: "",
    currentAddress: "", permanentAddress: "",
    qualification: "", experience: "", subject: "", adminCode: ""
  });

  const [files, setFiles] = useState({
    passportPhoto: null, cnicFront: null, cnicBack: null, degreeDocument: null
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleTextChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFiles(prev => ({ ...prev, [e.target.name]: e.target.files[0] }));
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);

    const dataToSend = new FormData();
    dataToSend.append("email", email);
    Object.keys(formData).forEach(key => dataToSend.append(key, formData[key]));
    Object.keys(files).forEach(key => files[key] && dataToSend.append(key, files[key]));

    try {
      const res = await fetch('/api/submit-verification', {
        method: 'POST',
        body: dataToSend,
      });

      if (res.ok) {
        setSubmitted(true);
        localStorage.removeItem("pendingVerification");
        setTimeout(() => navigate("/auth"), 5000);
      } else {
        alert("Submission failed. Check your data nodes.");
      }
    } catch {
      alert("Network Error: Could not connect to OLMS Grid.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="h-screen w-full bg-[#070B14] flex items-center justify-center p-6 text-white text-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full bg-[#0F172A] border border-gray-800 p-10 rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
            <AiOutlineCheckCircle size={40} className="text-emerald-500 animate-pulse" />
          </div>
          <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-4">Node Synced!</h2>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed font-bold uppercase tracking-widest">
            Verification data transmitted. Status: <span className="text-orange-500">PENDING</span>
          </p>
          <div className="text-[10px] text-emerald-500/50 uppercase tracking-[0.3em] font-black">Redirecting to login portal...</div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070B14] text-white font-sans pb-24">
      {/* Header - Synced with Dashboard Sidebar Top */}
      <div className="h-24 border-b border-white/5 sticky top-0 bg-[#070B14]/90 backdrop-blur-2xl z-50 px-10 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-500 w-12 h-12 rounded-2xl flex items-center justify-center text-[#070B14] shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <BsMortarboardFill size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase italic leading-none">OLMS <span className="text-emerald-500">GRID</span></h1>
            <p className="text-[10px] text-gray-600 uppercase tracking-[0.3em] mt-1 font-black">Protocol: Identity Verification</p>
          </div>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 px-6 py-2.5 rounded-2xl">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Active Mode: {role}</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto mt-16 px-6">
        <form onSubmit={handleSubmit} className="space-y-20">
          
          {/* Section 1: Personal Profile */}
          <div className="space-y-10">
            <div className="flex items-center gap-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500/80 whitespace-nowrap">01. Personal Identity</h3>
              <div className="h-px w-full bg-gradient-to-r from-gray-800 to-transparent"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <DarkInput label="First Name" name="firstName" icon={<AiOutlineUser/>} placeholder="John" onChange={handleTextChange} />
              <DarkInput label="Last Name" name="lastName" icon={<AiOutlineUser/>} placeholder="Doe" onChange={handleTextChange} />
              <DarkInput label="Guardian Name" name="fatherName" icon={<AiOutlineUser/>} placeholder="Father's Full Name" onChange={handleTextChange} />
              <DarkInput label="CNIC Identifier" name="cnicNumber" icon={<AiOutlineIdcard/>} placeholder="35202-xxxxxxx-x" onChange={handleTextChange} />
              <DarkInput label="Global Nationality" name="nationality" icon={<AiOutlineGlobal/>} value={formData.nationality} onChange={handleTextChange} />
              <DarkInput label="Domicile Region" name="domicile" icon={<AiOutlineHome/>} placeholder="e.g. Punjab" onChange={handleTextChange} />
            </div>
          </div>

          {/* Section 2: Communication Nodes */}
          <div className="space-y-10">
            <div className="flex items-center gap-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500/80 whitespace-nowrap">02. Communication Nodes</h3>
              <div className="h-px w-full bg-gradient-to-r from-gray-800 to-transparent"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <DarkInput label="Primary Uplink" name="phone" icon={<AiOutlinePhone/>} placeholder="03xx-xxxxxxx" onChange={handleTextChange} />
              <DarkInput label="Secondary Link" name="emergencyContact" icon={<AiOutlinePhone/>} placeholder="Relationship & No." onChange={handleTextChange} />
              <DarkInput label="Guardian Contact" name="guardianContact" icon={<AiOutlinePhone/>} placeholder="Contact Number" onChange={handleTextChange} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <DarkInput label="Current Residence" name="currentAddress" icon={<AiOutlineHome/>} placeholder="Station Address" onChange={handleTextChange} />
              <DarkInput label="Permanent Archive" name="permanentAddress" icon={<AiOutlineHome/>} placeholder="Base Address" onChange={handleTextChange} />
            </div>
          </div>

          {/* Section 3: Professional Credentials */}
          <div className="space-y-10">
            <div className="flex items-center gap-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500/80 whitespace-nowrap">03. Professional Access</h3>
              <div className="h-px w-full bg-gradient-to-r from-gray-800 to-transparent"></div>
            </div>
            
            {role === 'admin' ? (
              <div className="max-w-md bg-emerald-500/5 border border-emerald-500/20 p-8 rounded-[32px] shadow-2xl">
                <DarkInput label="Administrative Access Key" name="adminCode" type="password" icon={<AiOutlineKey/>} placeholder="Secret Authorization Code" onChange={handleTextChange} />
                <p className="text-[9px] text-orange-500/70 font-black uppercase tracking-widest mt-4 italic">* Level 4 verification required for Admin role.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Highest Protocol</label>
                  <div className="relative">
                    <AiOutlineBook className="absolute left-4 top-4 text-gray-500" />
                    <select name="qualification" onChange={handleTextChange} className="w-full pl-12 pr-8 py-4 bg-[#0F172A] border border-gray-800 rounded-2xl outline-none focus:border-emerald-500/50 text-sm text-white appearance-none cursor-pointer">
                      <option value="">Select Qualification</option>
                      <option value="Bachelors">Bachelors (BS/B.Sc)</option>
                      <option value="Masters">Masters (MS/M.Phil)</option>
                      <option value="PhD">PhD / Doctorate</option>
                    </select>
                  </div>
                </div>
                <DarkInput label="Experience (Cycles)" name="experience" type="number" icon={<AiOutlineFieldTime/>} placeholder="Years" onChange={handleTextChange} />
                <DarkInput label="Core Expertise" name="subject" icon={<AiOutlineBook/>} placeholder="e.g. Quantum Physics" onChange={handleTextChange} />
              </div>
            )}
          </div>

          {/* Section 4: Document Vault (Instructor Only) */}
          {role === 'instructor' && (
            <div className="space-y-10">
              <div className="flex items-center gap-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500/80 whitespace-nowrap">04. Document Vault</h3>
                <div className="h-px w-full bg-gradient-to-r from-gray-800 to-transparent"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: "Identity Image", name: "passportPhoto", icon: <AiOutlineFileImage /> },
                  { label: "CNIC Front-Face", name: "cnicFront", icon: <AiOutlineIdcard /> },
                  { label: "CNIC Reverse-Face", name: "cnicBack", icon: <AiOutlineIdcard /> },
                  { label: "Academic Record", name: "degreeDocument", icon: <AiOutlineBook /> }
                ].map((doc, i) => (
                  <div key={i} className="relative group overflow-hidden rounded-[32px] shadow-xl">
                    <input type="file" name={doc.name} onChange={handleFileChange} required className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className={`h-48 border-2 border-dashed rounded-[32px] flex flex-col items-center justify-center transition-all ${files[doc.name] ? 'border-emerald-500 bg-emerald-500/5' : 'border-gray-800 hover:border-emerald-500/30 bg-[#0F172A]'}`}>
                      <div className={`text-4xl mb-4 ${files[doc.name] ? 'text-emerald-500 shadow-emerald-500' : 'text-gray-700 group-hover:text-emerald-500/50 transition-all'}`}>
                        {files[doc.name] ? <AiOutlineCheckCircle className="animate-pulse"/> : doc.icon}
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">{files[doc.name] ? "Node Uplinked" : doc.label}</span>
                      {files[doc.name] && <span className="text-[8px] font-bold text-emerald-500 mt-2 truncate w-32 px-4 text-center italic">{files[doc.name].name}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="pt-10 flex flex-col items-center gap-4">
            <button type="submit" disabled={loading} className="group relative w-full md:w-96 py-5 bg-emerald-500 text-[#070B14] font-black rounded-2xl uppercase tracking-[0.3em] text-xs shadow-[0_20px_40px_rgba(16,185,129,0.2)] hover:bg-emerald-400 transition-all transform active:scale-95 overflow-hidden">
              <span className="relative z-10">{loading ? "Transmitting Nodes..." : "Authorize Identity"}</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </button>
            <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest animate-pulse">Ensure all data packets are accurate before transmission.</p>
          </div>

        </form>
      </div>
    </div>
  );
}

export default VerifyRole;