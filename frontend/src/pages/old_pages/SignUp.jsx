import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
// Removed unused import: AiOutlineArrowRight

function SignUp() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("student");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // API Call
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, password, role }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        
        // --- LOGIC FOR ROLE VALIDITY ---
        setTimeout(() => {
          // Both Instructor AND Admin will go to verification page
          if (role === "instructor" || role === "admin") {
            navigate(`/verify-role?email=${encodeURIComponent(email)}&role=${role}`);
          } else {
            navigate("/signIn");
          }
        }, 1200);
        
      } else {
        setError(data.error || "Sign up failed.");
      }
    } catch (err) { // Catch the error object
      console.error("Signup error:", err); // Log the error for debugging
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans">
      
      {/* --- LEFT SIDE: The "TalentLMS" Blue Hero Section --- */}
      <div className="w-full md:w-1/2 bg-[#0F2F6D] text-white p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="z-10 mb-8">
          <h2 className="text-3xl font-bold tracking-tight">OLMS</h2>
        </div>

        <div className="z-10 mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-6">
            Simple to start. <br />
            <span className="text-[#96D668]">Powerful to grow.</span>
          </h1>
          <p className="text-lg text-blue-100 max-w-md">
            Join thousands of users fueling their growth with our #1 Learning Management System. No credit card needed.
          </p>
        </div>

        <div className="absolute bottom-0 left-0 w-full leading-none z-0">
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
              <path fill="#ffffff" fillOpacity="0.1" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,208C1248,192,1344,192,1392,192L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            </svg>
        </div>
      </div>

      {/* --- RIGHT SIDE: The Form --- */}
      <div className="w-full md:w-1/2 bg-white p-8 md:p-12 flex items-center justify-center">
        <div className="w-full max-w-md space-y-8">
          
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
            <p className="mt-2 text-gray-500">Get started with your free account today.</p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSignUp}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text" required
                  className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#96D668] focus:border-[#96D668] outline-none transition-all"
                  value={firstName} onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text" required
                  className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#96D668] focus:border-[#96D668] outline-none transition-all"
                  value={lastName} onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Email Address</label>
              <input
                type="email" required
                className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#96D668] focus:border-[#96D668] outline-none transition-all"
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* --- ROLE SELECTION --- */}
            <div>
              <label className="text-sm font-medium text-gray-700">Role</label>
              <div className="relative mt-1">
                <select
                  value={role} onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#96D668] focus:border-[#96D668] outline-none appearance-none bg-white"
                >
                  <option value="student">Student</option>
                  <option value="instructor">Instructor (Requires Validation)</option>
                  <option value="admin">Administrator (Requires Validation)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
              
              {/* Logic to show warning text for both Instructor AND Admin */}
              {(role === 'instructor' || role === 'admin') && (
                <p className="text-xs text-orange-500 mt-1">
                  You will need to verify your credentials next.
                </p>
              )}
            </div>

            <div className="space-y-4">
               <input
                type="password" placeholder="Password" required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#96D668] focus:border-[#96D668] outline-none"
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
               <input
                type="password" placeholder="Confirm Password" required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#96D668] focus:border-[#96D668] outline-none"
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
            {success && <div className="p-3 bg-green-50 text-green-600 text-sm rounded-lg">Account created! Redirecting...</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#96D668] hover:bg-[#85c25a] text-[#0F2F6D] font-bold rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Sign Up Now"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link to="/signIn" className="font-semibold text-[#0F2F6D] hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignUp;