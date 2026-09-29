import React, { useState, useEffect } from "react";
import { 
  FiCheck, FiX, FiUser, FiShield, FiFileText, FiMapPin, 
  FiPhone, FiInfo, FiCalendar, FiBriefcase, FiDownload 
} from "react-icons/fi";
import { motion } from "framer-motion"; // Consistent with your theme

const AdminApprovals = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch('/api/admin/pending-users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (Array.isArray(data)) setPendingUsers(data);
    } catch {
        console.error("Network error");
    } finally {
        setLoading(false);
    }
  };

  const handleAction = async (userId, action) => {
    if(!window.confirm(`Are you sure you want to ${action} this user?`)) return;

    try {
        await fetch('/api/admin/action-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, action: action })
        });
        fetchPendingUsers();
    } catch {
        alert("Action failed!");
    }
  };

  // --- UI COMPONENT: Single Data Row (Updated for Terminal Look) ---
  const DataRow = ({ label, value, icon }) => {
    if (!value) return null;
    return (
      <div className="flex items-start gap-3 mb-3 p-3 bg-[#1E293B]/30 border border-transparent hover:border-emerald-500/20 rounded-xl transition-all">
        <div className="mt-0.5 text-emerald-500">{icon}</div>
        <div>
          <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">{label}</p>
          <p className="text-sm font-bold text-gray-200">{value}</p>
        </div>
      </div>
    );
  };

  // --- UI COMPONENT: Document Card (Updated for Terminal Look) ---
  const DocumentCard = ({ label, filename }) => {
    if (!filename) return null;
    const fileUrl = `/api/uploads/${filename}`;
    const isImage = filename.match(/\.(jpeg|jpg|gif|png)$/i);

    return (
      <div className="border border-gray-800 rounded-xl p-3 flex items-center justify-between hover:border-emerald-500/30 transition-all bg-[#0F172A]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-500">
            {isImage ? <FiUser /> : <FiFileText />}
          </div>
          <div>
            <p className="text-[10px] font-black text-white uppercase tracking-widest">{label}</p>
            <p className="text-[9px] text-gray-500 truncate max-w-[100px] uppercase font-bold">{filename}</p>
          </div>
        </div>
        <a 
          href={fileUrl} 
          target="_blank" 
          rel="noreferrer"
          className="p-2 text-emerald-500 hover:bg-emerald-500/20 rounded-full transition-colors"
          title="View Document"
        >
          <FiDownload />
        </a>
      </div>
    );
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#070B14] text-emerald-500">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mb-4"></div>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Syncing Security Clearances...</p>
    </div>
  );

  return (
    <div className="p-6 md:p-10 bg-[#070B14] min-h-screen font-sans text-white">
      {/* Header section matched to Dashboard theme */}
      <div className="mb-10">
        <h1 className="text-3xl font-black italic text-white tracking-tighter uppercase leading-none">Security <span className="text-emerald-500">Clearances</span></h1>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">Verify applicant identity nodes for terminal access.</p>
      </div>
      
      <div className="space-y-10">
        {pendingUsers.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 bg-[#0F172A] rounded-3xl border border-gray-800 shadow-2xl"
          >
             <div className="bg-emerald-500/10 p-5 rounded-full mb-4 border border-emerald-500/20">
                <FiCheck className="text-emerald-500 w-10 h-10 animate-bounce" />
             </div>
             <p className="text-gray-400 font-black uppercase tracking-widest text-sm">All Nodes Verified. No Pending Tasks.</p>
          </motion.div>
        ) : (
          pendingUsers.map((user) => {
            const d = user.verification_data || {};
            
            return (
            <motion.div 
              key={user._id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#0F172A] rounded-3xl shadow-2xl border border-gray-800 overflow-hidden hover:border-emerald-500/20 transition-all"
            >
              
              {/* --- HEADER: Identity Bar (Emerald/Dark Style) --- */}
              <div className="bg-gradient-to-r from-[#1E293B] to-[#0F172A] border-b border-gray-800 text-white p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                 <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5 overflow-hidden flex-shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                        {d.passportPhoto_path ? (
                            <img src={`/api/uploads/${d.passportPhoto_path}`} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-emerald-500/50"><FiUser size={32}/></div>
                        )}
                    </div>
                    <div>
                        <h3 className="text-2xl font-black italic tracking-tighter uppercase">{user.name}</h3>
                        <p className="text-emerald-500/70 text-xs font-bold uppercase tracking-widest">{user.email}</p>
                        <div className="flex gap-2 mt-3">
                            <span className="bg-emerald-500 text-[#070B14] text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-lg">
                                {user.role} Applicant
                            </span>
                            <span className="bg-white/5 border border-white/10 text-gray-400 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">
                                {d.submitted_at ? new Date(d.submitted_at).toLocaleDateString() : 'Initial Link'}
                            </span>
                        </div>
                    </div>
                 </div>

                 {/* Action Buttons */}
                 <div className="hidden md:flex gap-4">
                    <button onClick={() => handleAction(user._id, 'Reject')} 
                        className="px-8 py-3 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white font-black uppercase tracking-widest transition-all text-xs flex items-center gap-2">
                        <FiX /> Deny access
                    </button>
                    <button onClick={() => handleAction(user._id, 'Approve')} 
                        className="px-8 py-3 rounded-xl bg-emerald-500 text-[#070B14] hover:bg-emerald-400 font-black uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all text-xs flex items-center gap-2">
                        <FiCheck /> Authorize node
                    </button>
                 </div>
              </div>

              {/* --- BODY: Information Grid --- */}
              <div className="p-8 md:p-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 bg-[#0F172A]">
                
                {/* COLUMN 1: Personal Information */}
                <div>
                    <h4 className="text-white font-black uppercase tracking-widest text-xs border-b border-gray-800 pb-4 mb-6 flex items-center gap-2">
                        <FiUser className="text-emerald-500" /> Personal Identity
                    </h4>
                    <DataRow icon={<FiUser/>} label="Legal Father Name" value={d.fatherName} />
                    <DataRow icon={<FiFileText/>} label="CNIC Identifier" value={d.cnicNumber} />
                    <DataRow icon={<FiMapPin/>} label="Global Nationality" value={d.nationality} />
                    <DataRow icon={<FiMapPin/>} label="Domicile Region" value={d.domicile} />
                </div>

                {/* COLUMN 2: Contact & Qualifications */}
                <div>
                    <h4 className="text-white font-black uppercase tracking-widest text-xs border-b border-gray-800 pb-4 mb-6 flex items-center gap-2">
                        <FiPhone className="text-emerald-500" /> Comm-Links & Exp
                    </h4>
                    <DataRow icon={<FiPhone/>} label="Direct Uplink" value={d.phone} />
                    <DataRow icon={<FiPhone/>} label="Secondary Link" value={d.emergencyContact} />
                    <DataRow icon={<FiMapPin/>} label="Station Address" value={d.currentAddress} />
                    
                    <div className="my-6 border-t border-dashed border-gray-800"></div>
                    
                    {user.role === 'admin' ? (
                        <div className="bg-orange-500/10 p-4 rounded-xl border border-orange-500/20">
                            <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest mb-1">Administrative Override Code</p>
                            <p className="font-mono text-xl font-black text-white tracking-[0.3em]">{d.adminCode || "SECURED"}</p>
                        </div>
                    ) : (
                        <>
                            <DataRow icon={<FiBriefcase/>} label="Highest Qualification" value={d.qualification} />
                            <DataRow icon={<FiCalendar/>} label="Mission Experience" value={d.experience ? `${d.experience} Years` : null} />
                            <DataRow icon={<FiBriefcase/>} label="Core Expertise" value={d.subject} />
                        </>
                    )}
                </div>

                {/* COLUMN 3: Documents */}
                <div>
                    <h4 className="text-white font-black uppercase tracking-widest text-xs border-b border-gray-800 pb-4 mb-6 flex items-center gap-2">
                        <FiFileText className="text-emerald-500" /> Vault Documents
                    </h4>
                    
                    {user.role === 'admin' ? (
                        <div className="text-center p-8 bg-[#1E293B]/30 rounded-2xl border border-dashed border-gray-700 text-gray-500 text-[10px] font-bold uppercase leading-relaxed tracking-widest">
                            No physical vault items needed.
                            <br/>Authorization via master code.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {d.passportPhoto_path && <DocumentCard label="Identity Image" filename={d.passportPhoto_path} />}
                            {d.cnicFront_path && <DocumentCard label="CNIC Front-Face" filename={d.cnicFront_path} />}
                            {d.cnicBack_path && <DocumentCard label="CNIC Reverse-Face" filename={d.cnicBack_path} />}
                            {d.degreeDocument_path && <DocumentCard label="Academic Record" filename={d.degreeDocument_path} />}
                            
                            {(!d.cnicFront_path && !d.degreeDocument_path) && (
                                <p className="text-[10px] text-red-500 font-black uppercase tracking-tighter animate-pulse">Critical: No data uploaded to vault.</p>
                            )}
                        </div>
                    )}
                </div>
              </div>

              {/* --- MOBILE ACTION BAR --- */}
              <div className="md:hidden flex border-t border-gray-800">
                <button onClick={() => handleAction(user._id, 'Reject')} 
                    className="flex-1 py-5 text-red-500 font-black uppercase tracking-widest text-[10px] bg-red-500/5 hover:bg-red-500 hover:text-white transition-all">
                    Deny access
                </button>
                <button onClick={() => handleAction(user._id, 'Approve')} 
                    className="flex-1 py-5 text-[#070B14] font-black uppercase tracking-widest text-[10px] bg-emerald-500 hover:bg-emerald-400 transition-all">
                    Authorize node
                </button>
              </div>

            </motion.div>
          )})
        )}
      </div>
    </div>
  );
};

export default AdminApprovals;