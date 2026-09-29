import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion'; // Consistent with your other pages
import { FiArrowLeft, FiMail, FiShield, FiAlertCircle } from 'react-icons/fi';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
      } else {
        setError(data.error || 'Something went wrong.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection Terminated: Failed to reach server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans bg-[#070B14]">
      
      {/* --- LEFT SIDE: Secure Hero Section --- */}
      <div className="w-full md:w-1/2 bg-[#0F172A] text-white p-8 md:p-12 flex flex-col justify-between relative overflow-hidden border-r border-gray-800">
        {/* Decorative Terminal Glow */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500 rounded-full mix-blend-screen filter blur-[120px] opacity-10 -translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="z-10 mb-8">
          <h2 className="text-2xl font-black italic tracking-tighter uppercase">OLMS <span className="text-emerald-500">GRID</span></h2>
        </div>

        <div className="z-10 mb-12">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl md:text-5xl font-black leading-tight mb-6 uppercase italic tracking-tighter"
          >
            Access <br /> <span className="text-emerald-500">Recovery.</span>
          </motion.h1>
          <p className="text-lg text-gray-400 max-w-md font-medium tracking-tight">
            Security protocol initiated. Enter your identity identifier (email) to receive a one-time recovery uplink.
          </p>
        </div>

        {/* Wave Graphic (Subtle Terminal Style) */}
        <div className="absolute bottom-0 left-0 w-full leading-none z-0 opacity-20">
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
              <path fill="#10B981" fillOpacity="0.2" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,208C1248,192,1344,192,1392,192L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            </svg>
        </div>
      </div>

      {/* --- RIGHT SIDE: The Terminal Form --- */}
      <div className="w-full md:w-1/2 bg-[#070B14] p-8 md:p-12 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md space-y-8"
        >
          
          <div className="text-center md:text-left">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex items-center justify-center mb-6 mx-auto md:mx-0 shadow-lg shadow-emerald-500/5">
                <FiShield className="text-emerald-500 text-3xl" />
            </div>
            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Forgot Password</h2>
            <p className="mt-2 text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em]">Initialize credential reset sequence</p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Identity Identifier (Email)</label>
              <div className="relative group">
                <FiMail className="absolute left-4 top-4 text-gray-600 group-focus-within:text-emerald-500 transition-colors" />
                <input
                    type="email"
                    className="w-full pl-12 pr-4 py-4 bg-[#0F172A] border border-gray-800 rounded-2xl text-white outline-none focus:border-emerald-500/50 transition-all font-bold text-sm shadow-inner"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@grid-terminal.com"
                    required
                />
              </div>
            </div>

            {message && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-emerald-500/10 text-emerald-400 text-xs font-black uppercase tracking-widest rounded-xl text-center border border-emerald-500/20 shadow-lg"
              >
                Uplink Sent: {message}
              </motion.div>
            )}
            
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-500/10 text-red-500 text-xs font-black uppercase tracking-widest rounded-xl text-center border border-red-500/20 shadow-lg"
              >
                <div className="flex items-center justify-center gap-2">
                    <FiAlertCircle /> Error: {error}
                </div>
              </motion.div>
            )}

            <button
              type="submit"
              className="w-full py-5 bg-emerald-500 text-[#070B14] font-black rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:bg-emerald-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all transform active:scale-95 uppercase text-xs tracking-[0.2em] disabled:opacity-50 disabled:grayscale cursor-pointer"
              disabled={loading}
            >
              {loading ? 'Transmitting...' : 'Request Recovery Uplink'}
            </button>
          </form>

          <div className="text-center">
            <Link
              to="/signIn"
              className="group text-[10px] font-black text-gray-500 hover:text-emerald-400 uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
            >
              <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back to Terminal Sign In
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default ForgotPassword;