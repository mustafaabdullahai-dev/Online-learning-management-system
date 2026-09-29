/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AiOutlineEye, AiOutlineEyeInvisible, AiOutlineGoogle, AiOutlineFacebook, AiOutlineGithub, AiOutlineLinkedin, AiOutlineCheckCircle, AiOutlineClockCircle } from "react-icons/ai";
import { BsMortarboardFill, BsArrowRight, BsPerson, BsEnvelope, BsShieldLock, BsAward, BsLaptop, BsCheck2Circle, BsHourglassSplit } from "react-icons/bs";
import { motion, AnimatePresence } from "framer-motion";

function AuthPage() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const initialEmail = localStorage.getItem("rememberedEmail") || "";
  const initialPass = localStorage.getItem("rememberedPass") || "";

  const [rememberMe, setRememberMe] = useState(initialEmail ? true : false);
  const [otp, setOtp] = useState(""); 

  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", password: "", role: "student"
  });

  const [signInData, setSignInData] = useState({ 
    email: initialEmail, 
    password: initialPass 
  });

  const [strength, setStrength] = useState({ score: 0, label: "Empty", color: "bg-gray-700" });
  const [checks, setChecks] = useState({ length: false, number: false, special: false });

  useEffect(() => {
    const email = localStorage.getItem("rememberedEmail");
    const pass = localStorage.getItem("rememberedPass");
    if (email && pass) {
      setSignInData({ email: email, password: pass });
      setRememberMe(true);
    }
  }, []);

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setFormData({ ...formData, password: val });
    const c = {
      length: val.length >= 8,
      number: /[0-9]/.test(val),
      special: /[!@#$%^&*]/.test(val)
    };
    setChecks(c);
    const count = Object.values(c).filter(Boolean).length;
    if (count === 0) setStrength({ score: 0, label: "Weak", color: "bg-red-500" });
    else if (count === 1) setStrength({ score: 33, label: "Basic", color: "bg-orange-500" });
    else if (count === 2) setStrength({ score: 66, label: "Medium", color: "bg-yellow-500" });
    else setStrength({ score: 100, label: "Strong", color: "bg-emerald-500" });
  };

  const SocialLogins = () => (
    <div className="space-y-4 w-full">
      <button type="button" className="w-full flex items-center justify-center gap-3 py-3 bg-[#1E293B] border border-gray-700 rounded-xl hover:bg-gray-800 transition-all font-medium group">
        <AiOutlineGoogle className="text-xl text-[#EA4335] group-hover:scale-110 transition-transform" />
        <span className="text-sm">Continue with Google</span>
      </button>
      <div className="grid grid-cols-3 gap-4">
        <button type="button" className="flex justify-center py-3 bg-[#1E293B] border border-gray-700 rounded-xl hover:bg-[#24292F] transition-all group">
          <AiOutlineGithub className="text-xl group-hover:scale-110 transition-transform" />
        </button>
        <button type="button" className="flex justify-center py-3 bg-[#1E293B] border border-gray-700 rounded-xl hover:bg-[#1877F2]/10 transition-all group">
          <AiOutlineFacebook className="text-xl text-[#1877F2] group-hover:scale-110 transition-transform" />
        </button>
        <button type="button" className="flex justify-center py-3 bg-[#1E293B] border border-gray-700 rounded-xl hover:bg-[#0A66C2]/10 transition-all group">
          <AiOutlineLinkedin className="text-xl text-[#0A66C2] group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </div>
  );

  const handleNameChange = (e, field) => {
    const val = e.target.value.replace(/[^a-zA-Z]/g, "");
    const capitalized = val.charAt(0).toUpperCase() + val.slice(1);
    setFormData({ ...formData, [field]: capitalized });
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setStep(1);
    setError("");
  };

  // --- UPDATED HANDLE SIGN IN ---
  const handleSignIn = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(""); // Pehle wala error clear karein
    try {
      const res = await fetch('/api/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signInData),
      });
      const data = await res.json();
      
      if (res.ok) {
        if (rememberMe) {
            localStorage.setItem("rememberedEmail", signInData.email);
            localStorage.setItem("rememberedPass", signInData.password);
        } else {
            localStorage.removeItem("rememberedEmail");
            localStorage.removeItem("rememberedPass");
        }

        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        localStorage.setItem('firstName', data.firstName || "User");
        localStorage.setItem('isLoggedIn', 'true');

        if (data.role === 'super_admin') navigate("/superadmin-dashboard");
        else if (data.role === 'admin') navigate("/admin-dashboard");
        else if (data.role === 'instructor') navigate("/instructor-dashboard");
        else navigate("/");

      } else {
        // Yahan backend se aanay wala "Incorrect password protocol" ya koi bhi error catch hoga
        setError(data.error || data.message || "Access Denied: Invalid Credentials");
      }
    } catch (err) {
      setError("Terminal Connection Error: Node Offline");
    } finally { setLoading(false); }
  };

  const handleSendOTP = async (e) => {
    if (e) e.preventDefault();
    if (!formData.email.includes("@")) return setError("Valid email required!");
    setLoading(true);
    setError("");
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email.toLowerCase() }),
      });
      const data = await res.json();
      if (res.ok) { setStep(2); }
      else { setError(data.error || "Failed to send OTP"); }
    } catch { setError("Backend connection failed!"); }
    finally { setLoading(false); }
  };

  const handleVerifyOTP = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp: otp }),
      });
      if (res.ok) { setStep(3); }
      else { setError("Invalid OTP Code!"); }
    } catch { setError("Verification error!"); }
    finally { setLoading(false); }
  };

  const handleFinalSignup = async (e) => {
    if (e) e.preventDefault();
    if (strength.score < 100) return setError("Password protocol not strong enough!");
    setLoading(true);
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        if (formData.role !== 'student') {
          setStep(4);
        } else {
          localStorage.setItem('isLoggedIn', 'true');
          navigate("/");
        }
      } else { setError(data.error || "Signup failed"); }
    } catch { setError("Final registration error!"); }
    finally { setLoading(false); }
  };

  return (
    <div className="h-screen w-full bg-[#0B1120] flex items-center justify-center overflow-hidden font-sans text-white p-0">
      <div className="relative w-full h-full bg-[#0F172A] flex overflow-hidden shadow-2xl">
        
        {/* --- 1. LEFT SIDE: SIGN IN --- */}
        <div className="w-full lg:w-1/2 h-full flex flex-col justify-center items-center p-8 lg:p-20 order-2 lg:order-1">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center lg:text-left space-y-2">
              <h2 className="text-4xl font-bold italic tracking-tighter">OLMS <span className="text-emerald-500">HUB</span></h2>
              <p className="text-gray-400 text-sm">Secure Authentication Terminal</p>
            </div>
            
            {/* Error Message Display Area for Login */}
            <AnimatePresence>
              {error && !isSignUp && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl overflow-hidden"
                >
                  <p className="text-red-500 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                    {error}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <SocialLogins />
            
            <form className="space-y-4" onSubmit={handleSignIn}>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email Address <span className="text-red-500">*</span></label>
                <input className="w-full p-4 bg-[#1E293B] border border-gray-700 rounded-xl outline-none focus:border-emerald-500 transition-all" placeholder="user@gmail.com" value={signInData.email} onChange={(e) => setSignInData({...signInData, email: e.target.value.toLowerCase()})} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Master Key <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input className="w-full p-4 bg-[#1E293B] border border-gray-700 rounded-xl outline-none focus:border-emerald-500 transition-all" type={showPassword ? "text" : "password"} placeholder="••••••••" value={signInData.password} onChange={(e) => setSignInData({...signInData, password: e.target.value})} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-gray-500">{showPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}</button>
                </div>
              </div>
              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 rounded border-gray-700 bg-[#1E293B] accent-emerald-500 cursor-pointer" />
                  <span className="text-xs text-gray-400 group-hover:text-emerald-400 transition-colors">Remember Me</span>
                </label>
                <button type="button" className="text-[10px] font-bold text-gray-500 hover:text-emerald-400 uppercase tracking-tighter transition-colors">Forgot Key?</button>
              </div>
              <button type="submit" disabled={loading} className="w-full py-4 bg-emerald-500 text-[#0F172A] font-black rounded-xl shadow-lg hover:bg-emerald-400 transition-all uppercase tracking-widest text-xs">
                {loading ? "Authenticating..." : "Authorize Login"}
              </button>
            </form>
            <p className="text-center text-gray-500 text-sm">Need an account? <button onClick={toggleMode} className="text-emerald-400 font-bold hover:underline">Enroll Now</button></p>
          </div>
        </div>

        {/* --- 2. RIGHT SIDE: SIGN UP (Baqi Logic Same Hai) --- */}
        <div className="w-full lg:w-1/2 h-full flex flex-col justify-center items-center p-8 lg:p-20 order-1 lg:order-2">
          <div className="w-full max-w-md space-y-6">
            <h2 className="text-4xl font-bold tracking-tighter italic text-white uppercase">
              {step === 1 ? "Initialize Identity" : step === 2 ? "Verify OTP" : step === 3 ? "Access Security" : "Node Locked"}
            </h2>
            
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                {step === 1 && (
                  <form className="space-y-4" onSubmit={handleSendOTP}>
                    <SocialLogins />
                    <div className="flex gap-4">
                      <div className="w-1/2 space-y-1.5"><label className="text-xs font-bold text-gray-400 uppercase">First Name <span className="text-red-500">*</span></label><input className="w-full p-3.5 bg-[#1E293B] border border-gray-700 rounded-xl outline-none focus:border-emerald-500" placeholder="Anmol" value={formData.firstName} onChange={(e) => handleNameChange(e, 'firstName')} required /></div>
                      <div className="w-1/2 space-y-1.5"><label className="text-xs font-bold text-gray-400 uppercase">Last Name <span className="text-red-500">*</span></label><input className="w-full p-3.5 bg-[#1E293B] border border-gray-700 rounded-xl outline-none focus:border-emerald-500" placeholder="Kawal" value={formData.lastName} onChange={(e) => handleNameChange(e, 'lastName')} required /></div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center px-1"><label className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Email Address <span className="text-red-500">*</span></label>{error && isSignUp && <motion.span initial={{scale:0.5}} animate={{scale:1}} className="text-[10px] text-red-500 font-bold uppercase animate-pulse">{error}</motion.span>}</div>
                      <input className={`w-full p-3.5 bg-[#1E293B] border ${error && isSignUp ? 'border-red-500' : 'border-gray-700'} rounded-xl outline-none focus:border-emerald-500`} type="email" placeholder="user@gmail.com" value={formData.email} onChange={(e) => {setFormData({...formData, email: e.target.value.toLowerCase()}); setError("");}} required />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {['student', 'instructor', 'admin'].map((r) => (
                        <button key={r} type="button" onClick={() => setFormData({...formData, role: r})} className={`relative py-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${formData.role === r ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 font-bold' : 'border-gray-700 text-gray-500'}`}>
                          {(r === 'instructor' || r === 'admin') && <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full shadow-[0_0_8px_#f97316]"></span>}
                          <BsPerson size={16} /><span className="text-[10px] uppercase font-black">{r}</span>
                        </button>
                      ))}
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-4 bg-emerald-500 text-black font-black rounded-xl shadow-lg uppercase text-xs tracking-widest hover:bg-emerald-400 transition-all">{loading ? "Sending Code..." : "Request Security Code"}</button>
                    <p className="text-center text-xs text-gray-500 pt-2">Already a member? <button type="button" onClick={toggleMode} className="text-emerald-400 font-bold hover:underline">Sign In</button></p>
                  </form>
                )}
                
                {step === 2 && (
                  <form className="text-center space-y-6 py-10" onSubmit={handleVerifyOTP}>
                    <div className="p-8 bg-emerald-500/10 rounded-full w-fit mx-auto border border-emerald-500/20">
                      <BsShieldLock size={60} className="text-emerald-500 animate-pulse" />
                    </div>
                    <h2 className="text-2xl font-bold text-white uppercase italic tracking-tighter">Enter OTP</h2>
                    <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">Code sent to <span className="text-emerald-400 font-bold">{formData.email}</span>.<br/> Check your inbox (or spam) and enter code below.</p>
                    <input 
                      autoFocus
                      className="w-full p-4 bg-[#1E293B] border border-gray-700 rounded-xl text-center text-3xl tracking-[0.3em] font-black focus:border-emerald-500 outline-none transition-all"
                      maxLength="6"
                      placeholder="000000"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} 
                      required
                    />
                    {error && <p className="text-red-500 text-[10px] font-black uppercase italic">{error}</p>}
                    <button type="submit" disabled={loading} className="w-full py-4 bg-emerald-500 text-black font-black rounded-xl shadow-lg uppercase text-xs tracking-widest hover:bg-emerald-400 transition-all">
                      {loading ? "Verifying..." : "Confirm Access"}
                    </button>
                    <button type="button" onClick={() => setStep(1)} className="text-gray-500 text-[10px] uppercase font-bold hover:text-white transition-colors">Change Identity Details</button>
                  </form>
                )}

                {step === 3 && (
                  <form className="space-y-6" onSubmit={handleFinalSignup}>
                    <div className="flex items-center gap-3 text-emerald-400 bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20"><BsCheck2Circle size={24} /><span className="text-xs font-bold uppercase tracking-tight text-left leading-tight text-emerald-400">Identity Verified! <br/> <span className="text-[10px] text-emerald-500/60 font-bold uppercase">Set your master security key below.</span></span></div>
                    <div className="space-y-2 text-left">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Strength: <span className={strength.color.replace('bg-', 'text-')}>{strength.label}</span></label>
                        <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden"><motion.div animate={{ width: `${strength.score}%` }} className={`h-full ${strength.color}`}></motion.div></div>
                        <input autoFocus required className="w-full p-4 bg-[#1E293B] border border-gray-700 rounded-xl outline-none focus:border-emerald-500 text-lg font-black tracking-[0.3em]" type="password" placeholder="••••••••" value={formData.password} onChange={handlePasswordChange} />
                        <div className="grid grid-cols-1 gap-2 pt-2">
                            {[{ key: 'length', text: 'Minimum 8 Characters' }, { key: 'number', text: 'At least 1 Number (0-9)' }, { key: 'special', text: 'Special Symbol (!@#$)' }].map((check) => (
                                <div key={check.key} className={`flex items-center gap-2 text-[10px] font-bold uppercase transition-colors ${checks[check.key] ? 'text-emerald-500' : 'text-gray-600'}`}>{checks[check.key] ? <AiOutlineCheckCircle size={14}/> : <div className="w-3.5 h-3.5 border border-gray-700 rounded-full"></div>}{check.text}</div>
                            ))}
                        </div>
                    </div>
                    <button type="submit" disabled={strength.score < 100 || loading} className="w-full py-5 bg-emerald-500 text-black font-black rounded-xl shadow-xl uppercase tracking-widest text-xs disabled:opacity-30 disabled:cursor-not-allowed">Initialize Terminal Access</button>
                  </form>
                )}

                {step === 4 && (
                  <div className="text-center space-y-8 py-6">
                    <div className="relative flex justify-center">
                        <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 15, ease: "linear" }} className="absolute inset-[-15px] border-b-2 border-l-2 border-orange-500/20 rounded-full"></motion.div>
                        <div className="p-10 bg-orange-500/10 rounded-[45px] border border-orange-500/20 shadow-[0_0_50px_rgba(249,115,22,0.15)] relative z-10"><BsHourglassSplit size={80} className="text-orange-500 animate-pulse" /></div>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-3xl font-black italic tracking-tighter uppercase text-orange-500 leading-none">Access <br/> Restricted</h3>
                        <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto font-medium">Your <span className="text-white font-bold">{formData.role || "instructor"}</span> terminal is undergoing <span className="text-orange-400 font-black">Security Clearance</span>.</p>
                    </div>
                    <div className="bg-[#1E293B] p-6 rounded-2xl border border-gray-800 text-left space-y-3 shadow-inner">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase text-gray-500">
                            <span className="flex items-center gap-1.5"><AiOutlineClockCircle /> Processing</span>
                            <span className="text-orange-500/60 tracking-widest">Stage 1/2</span>
                        </div>
                        <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden border border-gray-800">
                            <motion.div initial={{width: 0}} animate={{width: "45%"}} transition={{duration: 2.5}} className="h-full bg-gradient-to-r from-orange-600 to-orange-400 shadow-[0_0_15px_#f97316]"></motion.div>
                        </div>
                        <p className="text-[9px] text-gray-600 font-bold uppercase tracking-tighter">Est. verification: 12-24 Hours</p>
                    </div>
                    <button onClick={() => {setStep(1); setIsSignUp(false);}} className="w-full py-4 bg-gray-800/50 border border-gray-700 text-gray-400 font-black rounded-xl uppercase text-xs tracking-[0.2em] hover:text-white hover:bg-gray-800 transition-all">Back to Terminal</button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* --- 3. SLIDING OVERLAY --- */}
        <motion.div animate={{ x: isSignUp ? '0%' : '100%' }} transition={{ type: "tween", ease: "easeInOut", duration: 0.6 }} className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-br from-[#4ADE80] to-[#22C55E] z-50 hidden lg:flex flex-col items-center justify-center p-16 text-center shadow-[-20px_0_50px_rgba(0,0,0,0.5)]">
          <div className="absolute top-10 left-10 flex items-center gap-2 text-white">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md border border-white/20 shadow-lg"><BsMortarboardFill className="text-2xl text-emerald-100" /></div>
            <span className="text-2xl font-black tracking-tight uppercase italic drop-shadow-md">OLMS GRID</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={isSignUp ? "signup" : "signin"} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-6 text-white px-10">
              <h1 className="text-6xl font-extrabold tracking-tighter uppercase italic leading-[1.1] drop-shadow-2xl">{isSignUp ? "The Future \n Is Here" : "Resume Your \n Mission"}</h1>
              <p className="text-lg text-emerald-50 opacity-90 leading-relaxed max-w-sm mx-auto font-medium italic">Experience Pakistan's most secure learning management grid with Passwordless Magic Protocols.</p>
              <div className="grid grid-cols-2 gap-4 pt-6 text-left border-t border-white/20">
                <div><h4 className="text-3xl font-bold italic tracking-tighter">200+</h4><p className="text-[10px] font-bold uppercase opacity-80 tracking-widest">Active Modules</p></div>
                <div><h4 className="text-3xl font-bold italic tracking-tighter">500+</h4><p className="text-[10px] font-bold uppercase opacity-80 tracking-widest">Live Terminals</p></div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

export default AuthPage;