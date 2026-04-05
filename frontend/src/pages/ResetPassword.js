import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import Toast from "../components/common/Toast";
import { useToast } from "../hooks/useToast";
import CloudBoxLogo from "../components/CloudBoxLogo";
import "../styles/login.css";

function ResetPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { messages, removeToast, toast } = useToast();

  const handleReset = async () => {
    if (!email || !newPassword) {
      toast.warning("Please fill all fields");
      return;
    }
    setLoading(true);
    try {
      await axios.post("http://localhost:8080/api/auth/reset-password", { email, newPassword });
      toast.success("Password updated successfully");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      toast.error(err.response?.data || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="yc-page">
      {/* Circuit background */}
      <svg className="yc-bg-svg" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <defs>
          <pattern id="circuit" x="0" y="0" width="220" height="220" patternUnits="userSpaceOnUse">
            <line x1="0" y1="55" x2="220" y2="55" stroke="#c5d4e8" strokeWidth="1.2" />
            <line x1="0" y1="165" x2="220" y2="165" stroke="#c5d4e8" strokeWidth="1.2" />
            <line x1="55" y1="0" x2="55" y2="220" stroke="#c5d4e8" strokeWidth="1.2" />
            <line x1="165" y1="0" x2="165" y2="220" stroke="#c5d4e8" strokeWidth="1.2" />
            <rect x="40" y="40" width="30" height="30" rx="4" fill="none" stroke="#c5d4e8" strokeWidth="1.2" />
            <circle cx="46" cy="46" r="4" fill="none" stroke="#c5d4e8" strokeWidth="1.2" />
            <circle cx="64" cy="46" r="4" fill="none" stroke="#c5d4e8" strokeWidth="1.2" />
            <circle cx="46" cy="64" r="4" fill="none" stroke="#c5d4e8" strokeWidth="1.2" />
            <circle cx="64" cy="64" r="4" fill="#c5d4e8" />
            <rect x="150" y="40" width="30" height="30" rx="4" fill="none" stroke="#c5d4e8" strokeWidth="1.2" />
            <circle cx="156" cy="46" r="4" fill="none" stroke="#c5d4e8" strokeWidth="1.2" />
            <circle cx="174" cy="46" r="4" fill="none" stroke="#c5d4e8" strokeWidth="1.2" />
            <circle cx="156" cy="64" r="4" fill="none" stroke="#c5d4e8" strokeWidth="1.2" />
            <circle cx="174" cy="64" r="4" fill="#c5d4e8" />
            <rect x="40" y="150" width="30" height="30" rx="4" fill="none" stroke="#c5d4e8" strokeWidth="1.2" />
            <circle cx="46" cy="156" r="4" fill="none" stroke="#c5d4e8" strokeWidth="1.2" />
            <circle cx="64" cy="156" r="4" fill="none" stroke="#c5d4e8" strokeWidth="1.2" />
            <circle cx="46" cy="174" r="4" fill="none" stroke="#c5d4e8" strokeWidth="1.2" />
            <circle cx="64" cy="174" r="4" fill="#c5d4e8" />
            <rect x="150" y="150" width="30" height="30" rx="4" fill="none" stroke="#c5d4e8" strokeWidth="1.2" />
            <circle cx="156" cy="156" r="4" fill="none" stroke="#c5d4e8" strokeWidth="1.2" />
            <circle cx="174" cy="156" r="4" fill="none" stroke="#c5d4e8" strokeWidth="1.2" />
            <circle cx="156" cy="174" r="4" fill="none" stroke="#c5d4e8" strokeWidth="1.2" />
            <circle cx="174" cy="174" r="4" fill="#c5d4e8" />
            <circle cx="110" cy="55" r="2.5" fill="#c5d4e8" />
            <circle cx="55" cy="110" r="2.5" fill="#c5d4e8" />
            <circle cx="165" cy="110" r="2.5" fill="#c5d4e8" />
            <circle cx="110" cy="165" r="2.5" fill="#c5d4e8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#circuit)" />
        <text x="72%" y="18%" fill="#c5d4e8" fontSize="22" fontFamily="sans-serif" fontWeight="600" letterSpacing="3">ON-PREMISES</text>
        <text x="4%" y="56%" fill="#c5d4e8" fontSize="22" fontFamily="sans-serif" fontWeight="600" letterSpacing="3">CLOUD</text>
        <text x="84%" y="82%" fill="#c5d4e8" fontSize="18" fontFamily="sans-serif" fontWeight="600" letterSpacing="2">SAAS</text>
        <text x="84%" y="87%" fill="#c5d4e8" fontSize="18" fontFamily="sans-serif" fontWeight="600" letterSpacing="2">PAAS</text>
        <text x="84%" y="92%" fill="#c5d4e8" fontSize="18" fontFamily="sans-serif" fontWeight="600" letterSpacing="2">IAAS</text>
      </svg>

      {/* Card */}
      <div className="yc-card">
        <button className="yc-back-btn" onClick={() => navigate("/login")}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8L10 13" stroke="#5b6b8a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="yc-logo">
          <CloudBoxLogo size={32} textSize={20} variant="dark" />
        </div>

        <p className="yc-subtitle">Reset your password</p>

        <input
          className="yc-input yc-input-full"
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleReset()}
        />

        <input
          className="yc-input yc-input-full"
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleReset()}
        />

        <div style={{ height: "4px" }} />

        <button className="yc-btn-primary" onClick={handleReset} disabled={loading}>
          {loading ? "Updating..." : "Reset Password"}
        </button>

        <div className="yc-divider" />

        <Link to="/login" className="yc-link-secondary">
          ← Back to Login
        </Link>
      </div>

      <div className="yc-lang">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" stroke="#5b6b8a" strokeWidth="1.2" />
          <path d="M8 1c-2 2-3 4.5-3 7s1 5 3 7M8 1c2 2 3 4.5 3 7s-1 5-3 7M1 8h14" stroke="#5b6b8a" strokeWidth="1.2" />
        </svg>
        <span>English</span>
      </div>
      <Toast messages={messages} removeToast={removeToast} />
    </div>
  );
}

export default ResetPassword;