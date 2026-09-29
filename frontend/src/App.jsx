/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useLocation, useNavigate, Routes, Route } from "react-router-dom";
import "./App.css";

// --- Components ---
import Sidebar from "./components/Sidebar";
import DashboardMain from "./components/DashboardMain";

// --- Pages ---
import UserManagement from "./pages/UserManagement";
import CourseManagement from "./pages/CourseManagement";
import ContentDelivery from "./pages/ContentDelivery";
import Assessments from "./pages/Assessments";
import Discussions from "./pages/Discussions";
import DiscussionViewPage from "./pages/DiscussionViewPage";
import ProgressTracking from "./pages/ProgressTracking";
import VideoConferencing from "./pages/VideoConferencing";
import AuthPage from "./pages/AuthPage"; 
import ForgotPassword from "./pages/ForgotPassword";
import CourseList from "./pages/CourseList";
import Announcements from "./pages/Announcements";
import CourseViewPage from "./pages/CourseViewPage";
import GradingPage from "./pages/GradingPage";
import KnowledgeHub from "./pages/KnowledgeHub";
import MeetingRoom from './MeetingRoom';
import StudentReport from "./pages/StudentReport";

// --- Verification & Admin Pages ---
import VerifyRole from "./pages/VerifyRole"; 
import CompleteProfile from "./pages/CompleteProfile";
import AdminApprovals from "./pages/AdminApprovals";

import { IoReorderThreeOutline } from "react-icons/io5";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // 1. Sidebar Hide Logic (Updated: Added direct paths for signin/signup)
  const hideSidebar = [
    "/auth",
    "/signIn", 
    "/signUp", 
    "/forgot-password", 
    "/verify-role", 
    "/complete-profile",
  ].includes(location.pathname);

  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const role = localStorage.getItem("role");

  useEffect(() => {
    // 2. Public Pages Check (OTP shift: removed verify-link)
    const publicPages = [
        "/auth",
        "/signIn", 
        "/signUp", 
        "/forgot-password", 
        "/verify-role", 
        "/complete-profile",
    ];

    if (!isLoggedIn && !publicPages.includes(location.pathname)) {
      navigate("/auth");
    }

    if (publicPages.includes(location.pathname)) {
      setSidebarOpen(false);
    }
  }, [isLoggedIn, location.pathname, navigate]);

  return (
    <div className="flex h-screen bg-gray-50 relative overflow-hidden">
      {/* Sidebar Desktop */}
      {!hideSidebar && (
        <div className="hidden md:block">
          <Sidebar />
        </div>
      )}

      {/* Sidebar Mobile Overlay */}
      {!hideSidebar && sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          ></div>
          <div className="relative z-50">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Mobile Burger Menu Button */}
      {!hideSidebar && !sidebarOpen && (
        <button
          className="absolute top-4 left-4 z-30 md:hidden bg-white border border-gray-200 rounded-lg p-2 shadow-md"
          onClick={() => setSidebarOpen(true)}
        >
          <IoReorderThreeOutline className="w-6 h-6 text-gray-600" />
        </button>
      )}

      <div className="flex-1 overflow-auto bg-[#070B14]">
        <Routes>
          {/* --- Public Routes --- */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/signIn" element={<AuthPage />} />
          <Route path="/signUp" element={<AuthPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-role" element={<VerifyRole />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />

          {/* --- Protected Routes (Logic Container) --- */}
          {isLoggedIn && (
            <>
              {/* Core Dashboard Access Points (Fixes Redirection Error) */}
              <Route path="/" element={<DashboardMain />} />
              <Route path="/admin-dashboard" element={<DashboardMain />} />
              <Route path="/instructor-dashboard" element={<DashboardMain />} />
              {/* Super Admin Dashboard Route */}
             <Route path="/superadmin-dashboard" element={<DashboardMain />} />
              
              {/* Admin & Super Admin Exclusive */}
              {(role === "admin" || role === "super_admin") && (
                <>
                    <Route path="/users" element={<UserManagement />} />
                    <Route path="/admin/approvals" element={<AdminApprovals />} />
                </>
              )}

              {/* Staff & Management Routes (Instructor/Admin) */}
              {(role === "admin" || role === "instructor" || role === "super_admin" || role === "student") && (
                <>
                  <Route path="/courses" element={<CourseManagement />} />
                  <Route path="/content" element={<ContentDelivery />} />
                  <Route path="/grade/:assessmentId" element={<GradingPage />} />
                </>
              )}

              {/* Student Exclusive */}
              {role === "student" && (
                <Route path="/courses" element={<CourseList />} />
              )}

              {/* Global Functional Routes */}
              <Route path="/assessments" element={<Assessments />} />
              <Route path="/assessments/:assessmentId/grading" element={<GradingPage />} />
              <Route path="/discussions" element={<Discussions />} />
              <Route path="/discussions/:discussionId" element={<DiscussionViewPage />} />
              <Route path="/announcements" element={<Announcements />} />
              <Route path="/courses/view/:courseId" element={<CourseViewPage />} />
              <Route path="/knowledge" element={<KnowledgeHub />} />
              <Route path="/video-conferencing" element={<VideoConferencing />} />
              <Route path="/video" element={<VideoConferencing />} />
              <Route path="/room/:roomId" element={<MeetingRoom />} />
              <Route path="/progress" element={<ProgressTracking />} />
              <Route path="/student-report/:firstName" element={<StudentReport />} />
              
          
            </>
          )}

          {/* Fallback Catch-all: Redirect to Auth if unknown */}
          {!isLoggedIn && <Route path="*" element={<AuthPage />} />}
        </Routes>
      </div>
    </div>
  );
}

export default App;