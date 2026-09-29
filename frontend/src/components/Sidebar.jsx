import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FaGraduationCap, FaChevronDown } from "react-icons/fa";
import {
  FiHome,
  FiLogOut,
  FiMessageSquare,
  FiGlobe,
  FiShield
} from "react-icons/fi";
import { FaUserGroup } from "react-icons/fa6";
import { IoBookOutline } from "react-icons/io5";
import { RiPlayLargeLine } from "react-icons/ri";
import { LuBookText } from "react-icons/lu";
import { GiProgression } from "react-icons/gi";
import { CiVideoOn } from "react-icons/ci";
import { motion } from "framer-motion";
import ThemeToggle from "./ThemeToggle";

const Sidebar = ({ onClose }) => {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");
  const firstName = localStorage.getItem("firstName") || "User";
  const [hoveredMenu, setHoveredMenu] = useState(null);

  const roleDisplay =
    role === "super_admin"
      ? "Super Admin"
      : role === "admin"
      ? "Administrator"
      : role === "instructor"
      ? "Instructor"
      : "Student";

  const menuItems = [
    {
      id: 1,
      name: "Dashboard",
      to: "/",
      icon: <FiHome />,
      roles: ["super_admin", "admin", "instructor", "student"]
    },

    {
      id: 2,
      name: "User Management",
      to: "/users",
      icon: <FaUserGroup />,
      roles: ["super_admin", "admin"],
      subItems: [
        { name: "All Users", to: "/users" },
        { name: "Add User", to: "/users?action=add" },
        { name: "Approvals", to: "/admin/approvals" },
        { name: "Instructors", to: "/users?role=instructor" }
      ]
    },

    {
      id: 3,
      name: "Courses",
      to: "/courses",
      icon: <IoBookOutline />,
      roles: ["super_admin", "admin", "instructor", "student"],
      subItems: [
        { name: "All Courses", to: "/courses" },
        { name: "My Enrollments", to: "/courses?filter=my" }
      ]
    },

    {
      id: 4,
      name: "Content",
      to: "/content",
      icon: <RiPlayLargeLine />,
      roles: ["super_admin", "admin", "instructor", "student"]
    },

    {
      id: 5,
      name: "Assessments",
      to: "/assessments",
      icon: <LuBookText />,
      roles: ["super_admin", "admin", "instructor", "student"],
      subItems: [
        { name: "Quizzes", to: "/assessments?type=quiz" },
        { name: "Assignments", to: "/assessments?type=assignment" }
      ]
    },

    {
      id: 6,
      name: "Discussions",
      to: "/discussions",
      icon: <FiMessageSquare />,
      roles: ["super_admin", "admin", "instructor", "student"]
    },

    {
      id: 7,
      name: "Progress",
      to: "/progress",
      icon: <GiProgression />,
      roles: ["super_admin", "admin", "student"]
    },

    {
      id: 8,
      name: "Conferences",
      to: "/video",
      icon: <CiVideoOn />,
      roles: ["super_admin", "admin", "instructor", "student"]
    },

    {
      id: 9,
      name: "Announcements",
      to: "/announcements",
      icon: <FiMessageSquare />,
      roles: ["super_admin", "admin", "instructor", "student"]
    },

    {
      id: 10,
      name: "Knowledge Hub",
      to: "/knowledge",
      icon: <FiGlobe />,
      roles: ["super_admin", "admin", "instructor", "student"]
    },

    
    {
      id: 11,
      name: "Student Remark",
      to: "/student-remarks",
      icon: <FiMessageSquare />,
      roles: ["super_admin", "admin", "instructor", "student"]
    }
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate("/auth");
  };

  return (
    <div className="w-64 h-screen bg-[#070B14] flex flex-col border-r border-white/5">
      <div className="p-6 flex items-center gap-3">
        <FaGraduationCap className="text-emerald-500 text-2xl" />
        <div>
          <h1 className="text-white font-black text-lg">OLMS GRID</h1>
          <p className="text-[10px] text-emerald-400 uppercase">
            {roleDisplay}
          </p>
        </div>
      </div>

      <div className="flex-1 px-3 space-y-1 overflow-y-auto">
        {menuItems
          .filter(item => item.roles.includes(role))
          .map(item => (
            <NavLink
              key={item.id}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest
                ${isActive
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "text-gray-400 hover:bg-white/5"}`
              }
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
      </div>

      <div className="p-4 border-t border-white/5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center font-black text-black">
          {firstName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="text-white text-xs font-bold">{firstName}</p>
          <p className="text-[10px] text-emerald-400">{roleDisplay}</p>
        </div>
        <ThemeToggle />
        <button
          onClick={handleLogout}
          className="text-gray-400 hover:text-red-400"
        >
          <FiLogOut size={18} />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
