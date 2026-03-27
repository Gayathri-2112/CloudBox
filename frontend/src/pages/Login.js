import { useState } from "react";
import { loginUser } from "../services/authService";
import { useNavigate, Link } from "react-router-dom";
import "../styles/login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }
    setLoading(true);
    try {
      const user = await loginUser({ email, password });
      localStorage.setItem("name", email.split("@")[0]);
      if (user.role === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert(err.response?.data?.error || "Invalid Credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="yc-page">
      {/* Animated circuit background */}
      <svg className="yc-bg-svg" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <defs>
          <pattern id="circuit" x="0" y="0" width="220" height="220" patternUnits="userSpaceOnUse">
            {/* horizontal lines */}
            <line x1="0" y1="55" x2="220" y2="55" stroke="#c5d4e8" strokeWidth="1.2"/>
            <line x1="0" y1="165" x2="220" y2="165" stroke="#c5d4e8" strokeWidth="1.2"/>
            {/* vertical lines */}
            <line x1="55" y1="0" x2="55" y2="220" stroke="#c5d4e8" strokeWidth="1.2"/>
            <line x1="165" y1="0" x2="165" y2="220" stroke="#c5d4e8" strokeWidth="1.2"/>
            {/* corner pads */}
            <rect x="40" y="40" width="30" height="30" rx="4" fill="none" stroke="#c5d4e8" strokeWidth="1.2"/>
            <circle cx="46" cy="46" r="4" fill="none" stroke="#c5d4e8" strokeWidth="1.2"/>
            <circle cx="64" cy="46" r="4" fill="none" stroke="#c5d4e8" strokeWidth="1.2"/>
            <circle cx="46" cy="64" r="4" fill="none" stroke="#c5d4e8" strokeWidth="1.2"/>
            <circle cx="64" cy="64" r="4" fill="#c5d4e8"/>

            <rect x="150" y="40" width="30" height="30" rx="4" fill="none" stroke="#c5d4e8" strokeWidth="1.2"/>
            <circle cx="156" cy="46" r="4" fill="none" stroke="#c5d4e8" strokeWidth="1.2"/>
            <circle cx="174" cy="46" r="4" fill="none" stroke="#c5d4e8" strokeWidth="1.2"/>
            <circle cx="156" cy="64" r="4" fill="none" stroke="#c5d4e8" strokeWidth="1.2"/>
            <circle cx="174" cy="64" r="4" fill="#c5d4e8"/>

            <rect x="40" y="150" width="30" height="30" rx="4" fill="none" stroke="#c5d4e8" strokeWidth="1.2"/>
            <circle cx="46" cy="156" r="4" fill="none" stroke="#c5d4e8" strokeWidth="1.2"/>
            <circle cx="64" cy="156" r="4" fill="none" stroke="#c5d4e8" strokeWidth="1.2"/>
            <circle cx="46" cy="174" r="4" fill="none" stroke="#c5d4e8" strokeWidth="1.2"/>
            <circle cx="64" cy="174" r="4" fill="#c5d4e8"/>

            <rect x="150" y="150" width="30" height="30" rx="4" fill="none" stroke="#c5d4e8" strokeWidth="1.2"/>
            <circle cx="156" cy="156" r="4" fill="none" stroke="#c5d4e8" strokeWidth="1.2"/>
            <circle cx="174" cy="156" r="4" fill="none" stroke="#c5d4e8" strokeWidth="1.2"/>
            <circle cx="156" cy="174" r="4" fill="none" stroke="#c5d4e8" strokeWidth="1.2"/>
            <circle cx="174" cy="174" r="4" fill="#c5d4e8"/>

            {/* small dots */}
            <circle cx="110" cy="55" r="2.5" fill="#c5d4e8"/>
            <circle cx="55" cy="110" r="2.5" fill="#c5d4e8"/>
            <circle cx="165" cy="110" r="2.5" fill="#c5d4e8"/>
            <circle cx="110" cy="165" r="2.5" fill="#c5d4e8"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#circuit)"/>
        {/* background text labels like the reference */}
        <text x="72%" y="18%" fill="#c5d4e8" fontSize="22" fontFamily="sans-serif" fontWeight="600" letterSpacing="3">ON-PREMISES</text>
        <text x="4%" y="56%" fill="#c5d4e8" fontSize="22" fontFamily="sans-serif" fontWeight="600" letterSpacing="3">CLOUD</text>
        <text x="84%" y="82%" fill="#c5d4e8" fontSize="18" fontFamily="sans-serif" fontWeight="600" letterSpacing="2">SAAS</text>
        <text x="84%" y="87%" fill="#c5d4e8" fontSize="18" fontFamily="sans-serif" fontWeight="600" letterSpacing="2">PAAS</text>
        <text x="84%" y="92%" fill="#c5d4e8" fontSize="18" fontFamily="sans-serif" fontWeight="600" letterSpacing="2">IAAS</text>
      </svg>

      {/* Card */}
      <div className="yc-card">
        <button className="yc-back-btn" onClick={() => navigate(-1)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8L10 13" stroke="#5b6b8a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div className="yc-logo">
          <span className="yc-logo-text">CloudBox</span>
          <svg className="yc-logo-icon" width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M22 17a5 5 0 00-4.9-6H16a7 7 0 10-7 7.9" stroke="#4285f4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 18l3 3 3-3M15 21v-8" stroke="#4285f4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <p className="yc-subtitle">Log in to the management console</p>

        <div className="yc-input-row">
          <input
            className="yc-input"
            type="email"
            placeholder="username@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          <button className="yc-input-arrow" onClick={handleLogin} disabled={loading}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 9h12M10 4l5 5-5 5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <input
          className="yc-input yc-input-full"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />

        <div className="yc-divider"><span>or</span></div>

        <button className="yc-btn-primary" onClick={handleLogin} disabled={loading}>
          {loading ? "Logging in..." : "Log in using CloudBox ID"}
        </button>

        <Link to="/reset-password" className="yc-link-secondary">
          Forgot password?
        </Link>

        <Link to="/register" className="yc-btn-sso">
          Create an account
        </Link>
      </div>

      <div className="yc-lang">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" stroke="#5b6b8a" strokeWidth="1.2"/>
          <path d="M8 1c-2 2-3 4.5-3 7s1 5 3 7M8 1c2 2 3 4.5 3 7s-1 5-3 7M1 8h14" stroke="#5b6b8a" strokeWidth="1.2"/>
        </svg>
        <span>English</span>
      </div>
    </div>
  );
}

export default Login;