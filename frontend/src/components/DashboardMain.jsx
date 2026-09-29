import React, { useState, useEffect, useCallback } from "react";

import { Link, useNavigate } from "react-router-dom";

import { FaUserGroup } from "react-icons/fa6";

import { IoBookOutline } from "react-icons/io5";

import { FaGraduationCap, FaChevronRight, FaChevronDown } from "react-icons/fa";

import { LuBookText } from "react-icons/lu";

import { motion, AnimatePresence } from "framer-motion"; // Added for AuthPage style smoothness

import {

  FiHome, FiClock, FiUserPlus, FiEdit,

  FiMessageSquare, FiPlayCircle, FiCalendar, FiBell, FiCheckSquare, FiArrowRight, FiLogOut

} from "react-icons/fi";



// --- Icons Helper Map ---

const iconMap = {

  FaUserGroup: <FaUserGroup />,

  IoBookOutline: <IoBookOutline />,

  FaGraduationCap: <FaGraduationCap />,

  LuBookText: <LuBookText />,

  FiClock: <FiClock />,

  FiUserPlus: <FiUserPlus />,

  FiEdit: <FiEdit />,

  FiMessageSquare: <FiMessageSquare />,

  FiPlayCircle: <FiPlayCircle />,

  FiCalendar: <FiCalendar />,

  FiBell: <FiBell />,

  FiCheckSquare: <FiCheckSquare />,

  FiHome: <FiHome />,

};



const DashboardMain = () => {

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const role = localStorage.getItem("role");

  const firstName = localStorage.getItem("firstName") || "User";

  const navigate = useNavigate();



  const [stats, setStats] = useState([]);

  const [courses, setCourses] = useState([]);

  const [discussions, setDiscussions] = useState([]);

  const [quickActions, setQuickActions] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);



  const handleLogout = useCallback(() => {

    localStorage.clear();

    navigate("/signIn");

  }, [navigate]);



useEffect(() => {
  const fetchDashboardData = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");

    if (!token) {
      handleLogout();
      return;
    }

    try {
      const fetchOptions = {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Exact Space between Bearer and Token
        }
      };

      const [statsRes, actionsRes] = await Promise.all([
        fetch('/api/dashboard-stats', fetchOptions),
        fetch('/api/quick-actions', fetchOptions)
      ]);

      if (statsRes.status === 401 || actionsRes.status === 401) {
        handleLogout();
        return;
      }

      const statsData = await statsRes.json();
      const actionsData = await actionsRes.json();

      setStats(statsData.stats || []);
      setCourses(statsData.courses || []);
      setDiscussions(statsData.discussions || []);
      setQuickActions(actionsData.actions || []);

    } catch (err) {
      setError("Secure Uplink Failed. Terminal Offline.");
    } finally {
      setLoading(false);
    }
  };

  fetchDashboardData();
}, [handleLogout]);


  const getLinkForStat = (title) => {

    const lowerTitle = title.toLowerCase();

    if (lowerTitle.includes("student") || lowerTitle.includes("instructor")) return "/users";

    if (lowerTitle.includes("course")) return "/courses";

    if (lowerTitle.includes("pending")) return "/assessments";

    return "/";

  };



  if (loading) return (

    <div className="flex h-screen justify-center items-center bg-[#0B1120]">

      <div className="flex flex-col items-center gap-4">

        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>

        <p className="text-emerald-500 font-bold uppercase tracking-widest text-xs animate-pulse">Initializing Terminal...</p>

      </div>

    </div>

  );



  if (error) return <div className="p-6 text-red-500 bg-[#0B1120] min-h-screen font-black uppercase tracking-tighter">System Error: {error}</div>;



  return (

    <div className="p-6 md:p-8 bg-[#0B1120] min-h-screen font-sans text-white">

     

      {/* --- WELCOME BANNER (AuthPage Style) --- */}

      <motion.div

        initial={{ opacity: 0, y: 20 }}

        animate={{ opacity: 1, y: 0 }}

        className="relative rounded-2xl bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-gray-800 text-white p-8 mb-8 shadow-2xl overflow-hidden"

      >

        {/* Decorative Glows like AuthPage */}

        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full filter blur-3xl opacity-20 transform translate-x-1/3 -translate-y-1/3"></div>

        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full filter blur-3xl opacity-20 transform -translate-x-1/3 translate-y-1/3"></div>



        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">

          <div>

            <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter mb-2 uppercase">

              Welcome back, <span className="text-emerald-500">{firstName}</span>!

            </h1>

            <p className="text-gray-400 text-sm font-medium tracking-tight max-w-xl">

              OLMS Security Node active. You have <span className="text-emerald-400 font-black">{quickActions.length} system alerts</span> waiting for authorization.

            </p>

          </div>

         

          {/* Profile Quick Access (AuthPage Style) */}

          <div className="relative">

            <button

              onClick={() => setDropdownOpen(!dropdownOpen)}

              className="flex items-center gap-3 bg-[#1E293B] border border-gray-700 px-4 py-2 rounded-xl hover:border-emerald-500/50 transition-all shadow-lg group"

            >

              <div className="w-10 h-10 rounded-full bg-emerald-500 text-[#0F172A] flex items-center justify-center font-black text-lg shadow-[0_0_15px_rgba(16,185,129,0.3)]">

                {firstName.charAt(0).toUpperCase()}

              </div>

              <div className="text-left hidden md:block">

                <p className="text-sm font-black uppercase tracking-tighter text-white">{firstName}</p>

                <p className="text-[10px] text-emerald-500/70 font-bold uppercase">{role}</p>

              </div>

              <FaChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />

            </button>



            <AnimatePresence>

              {dropdownOpen && (

                <motion.div

                  initial={{ opacity: 0, scale: 0.95, y: 10 }}

                  animate={{ opacity: 1, scale: 1, y: 0 }}

                  exit={{ opacity: 0, scale: 0.95, y: 10 }}

                  className="absolute right-0 mt-2 w-48 bg-[#1E293B] border border-gray-700 rounded-xl shadow-2xl py-2 z-50 overflow-hidden"

                >

                  <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-xs text-red-400 hover:bg-red-500/10 font-black uppercase tracking-widest transition-colors flex items-center gap-2">

                    <FiLogOut /> Deauthorize Session

                  </button>

                </motion.div>

              )}

            </AnimatePresence>

          </div>

        </div>

      </motion.div>



      {/* --- STATS GRID --- */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

        {stats.map((stat, index) => (

          <motion.div

            key={index}

            initial={{ opacity: 0, y: 20 }}

            animate={{ opacity: 1, y: 0 }}

            transition={{ delay: index * 0.1 }}

          >

            <Link

              to={getLinkForStat(stat.title)}

              className="group bg-[#0F172A] p-6 rounded-2xl shadow-lg border border-gray-800 hover:border-emerald-500/50 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden block"

            >

              {/* Glow Effect */}

              <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

             

              <div className="relative z-10 flex justify-between items-start mb-4">

                <div className="p-3 rounded-xl bg-[#1E293B] text-emerald-500 group-hover:bg-emerald-500 group-hover:text-[#0F172A] transition-all duration-300 shadow-inner border border-gray-700">

                  {iconMap[stat.icon] || <FiHome className="w-6 h-6" />}

                </div>

                {stat.change && (

                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">

                    {stat.change}

                  </span>

                )}

              </div>

              <div className="relative z-10">

                <h3 className="text-3xl font-black text-white mb-1 tracking-tighter group-hover:text-emerald-400 transition-colors">

                  {stat.value}

                </h3>

                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">

                  {stat.title}

                </p>

              </div>

            </Link>

          </motion.div>

        ))}

      </div>



      {/* --- MAIN CONTENT LAYOUT --- */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

       

        {/* --- LEFT COLUMN (Activity Feed) --- */}

        <div className="lg:col-span-2 space-y-8">

         

          {/* Courses Card */}

          <div className="bg-[#0F172A] rounded-2xl shadow-xl border border-gray-800 overflow-hidden">

            <div className="px-6 py-5 border-b border-gray-800 flex justify-between items-center bg-[#1E293B]/50">

              <h2 className="font-black text-white uppercase tracking-widest text-sm flex items-center gap-2">

                <IoBookOutline className="text-emerald-500" />

                {role === 'student' ? 'Mission Progress' : 'Recent Terminal Activity'}

              </h2>

              <Link to="/courses" className="text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:text-emerald-400 transition-colors flex items-center gap-1">

                Access All <FaChevronRight className="w-3 h-3" />

              </Link>

            </div>

            <div className="divide-y divide-gray-800">

              {courses.length > 0 ? (

                courses.map((course, index) => (

                  <div key={index} className="p-6 hover:bg-[#1E293B]/30 transition-all flex items-center justify-between group/item">

                     <div className="flex items-center gap-4">

                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-[#0F172A] flex items-center justify-center font-black text-xl shadow-lg">

                          {course.name.charAt(0)}

                        </div>

                        <div>

                          <h4 className="font-black text-gray-200 text-base mb-0.5 group-hover/item:text-emerald-400 transition-colors italic tracking-tight">{course.name}</h4>

                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{course.students}</p>

                        </div>

                     </div>

                     <Link to={`/courses/view/${course._id}`} className="opacity-0 group-hover/item:opacity-100 transform translate-x-2 group-hover/item:translate-x-0 transition-all duration-300 px-4 py-2 text-[10px] bg-emerald-500 text-[#0F172A] font-black uppercase tracking-widest rounded-lg hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">

                        {role === 'student' ? 'Resume' : 'Analyze'}

                     </Link>

                  </div>

                ))

              ) : (

                <div className="p-12 text-center flex flex-col items-center justify-center text-gray-600">

                  <div className="bg-[#1E293B] p-4 rounded-full mb-3 border border-gray-800">

                    <IoBookOutline className="w-8 h-8 text-gray-500" />

                  </div>

                  <p className="text-xs font-bold uppercase tracking-widest">No Active Nodes Found</p>

                </div>

              )}

            </div>

          </div>



          {/* Discussions Card */}

          <div className="bg-[#0F172A] rounded-2xl shadow-xl border border-gray-800 overflow-hidden">

            <div className="px-6 py-5 border-b border-gray-800 bg-[#1E293B]/50 flex justify-between items-center">

              <h2 className="font-black text-white uppercase tracking-widest text-sm flex items-center gap-2">

                <FiMessageSquare className="text-emerald-500" /> Comm-Link

              </h2>

              <Link to="/discussions" className="text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:text-emerald-400 transition-colors">

                Forum Access

              </Link>

            </div>

            <div className="p-4 space-y-3">

               {discussions.length > 0 ? (

                 discussions.map((disc, idx) => (

                   <Link to="/discussions" key={idx} className="flex items-center justify-between p-4 border border-gray-800 rounded-xl hover:border-emerald-500/50 hover:bg-[#1E293B]/20 transition-all group">

                      <div className="flex items-center gap-4">

                        <div className="w-10 h-10 rounded-full bg-[#1E293B] text-emerald-500 flex items-center justify-center font-black text-xs border border-gray-700 shadow-inner group-hover:border-emerald-500/50">

                          {disc.initials}

                        </div>

                        <div>

                          <h4 className="font-bold text-gray-300 group-hover:text-emerald-400 transition-colors tracking-tight italic">{disc.title}</h4>

                          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-tighter text-gray-500 mt-1">

                             <span className="bg-gray-800 px-2 py-0.5 rounded text-emerald-500/70 border border-gray-700">{disc.replies}</span>

                             <span>• {disc.time}</span>

                          </div>

                        </div>

                      </div>

                      <FiArrowRight className="text-gray-700 group-hover:text-emerald-500 transform -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />

                   </Link>

                 ))

               ) : (

                 <div className="text-center text-gray-600 py-8 text-[10px] font-black uppercase tracking-widest">Quiet on all frequencies...</div>

               )}

            </div>

          </div>

        </div>



        {/* --- RIGHT COLUMN (Widgets) --- */}

        <div className="space-y-8">

           

           {/* Quick Actions Widget (Emerald Themed Dark) */}

           <div className="bg-[#1E293B] text-white rounded-2xl shadow-2xl border border-gray-700 p-6 relative overflow-hidden group">

             {/* Glow Blob */}

             <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full filter blur-3xl group-hover:opacity-40 transition-opacity duration-500"></div>

             

             <h2 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 relative z-10">

               <FiCheckSquare className="text-emerald-500" />

               Critical Tasks

             </h2>

             

             <div className="space-y-3 relative z-10">

                {quickActions.length > 0 ? (

                  quickActions.map((action, idx) => (

                    <Link

                      key={idx}

                      to={action.link}

                      className="flex items-center gap-4 p-4 rounded-xl bg-[#0F172A] border border-gray-800 hover:bg-emerald-500 hover:text-[#0F172A] hover:border-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all duration-300 group/btn"

                    >

                       <span className="text-lg p-2 bg-[#1E293B] rounded-lg border border-gray-700 group-hover/btn:bg-white/20 group-hover/btn:border-transparent">{iconMap[action.icon] || <FiPlayCircle/>}</span>

                       <span className="text-xs font-black uppercase tracking-widest">{action.text}</span>

                    </Link>

                  ))

                ) : (

                  <div className="text-center py-6 bg-[#0F172A] rounded-xl border border-gray-800">

                    <FiCheckSquare className="w-8 h-8 mx-auto text-emerald-500/30 mb-2" />

                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">System Clear</p>

                  </div>

                )}

             </div>

           </div>



           {/* Calendar Widget (Clean Secure Style) */}

           <div className="bg-[#0F172A] rounded-2xl shadow-xl border border-gray-800 p-6 relative overflow-hidden">

              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>

              <h3 className="font-black text-white uppercase tracking-widest text-sm mb-6 flex items-center gap-2">

                <FiCalendar className="text-emerald-500" /> Chronometer

              </h3>

              <div className="space-y-4">

                 <div className="flex gap-4 items-center group cursor-default">

                    <div className="bg-[#1E293B] px-4 py-2 rounded-xl text-center border border-gray-700 group-hover:border-emerald-500/50 transition-all shadow-inner">

                       <span className="block text-[10px] font-black text-emerald-500 uppercase tracking-tighter">JAN</span>

                       <span className="block text-xl font-black text-white tracking-tighter">04</span>

                    </div>

                    <div>

                       <p className="text-sm font-black text-gray-200 group-hover:text-emerald-400 transition-colors uppercase italic tracking-tighter">System Audit</p>

                       <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Network check-up</p>

                    </div>

                 </div>

              </div>

              <button className="w-full mt-6 py-3 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] hover:text-emerald-400 transition-colors border-t border-gray-800">

                Synchronize All Events

              </button>

           </div>



        </div>



      </div>

    </div>

  );

};



export default DashboardMain;