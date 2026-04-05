import { useState } from "react";
import { loginUser } from "../services/authService";
import { useNavigate, Link } from "react-router-dom";
import Toast from "../components/common/Toast";
import { useToast } from "../hooks/useToast";
import CloudBoxLogo from "../components/CloudBoxLogo";
import "../styles/login.css";

function Login() {
  if (localStorage.getItem("token")) {
    window.location.href = localStorage.getItem("role") === "ADMIN" ? "/admin" : "/dashboard";
  }

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(null); // null = no failed attempt yet
  const [locked, setLocked] = useState(false);
  const navigate = useNavigate();
  const { messages, removeToast, toast } = useToast();

  const handleLogin = async () => {
    if (!email || !password) {
      toast.warning("Please enter email and password");
      return;
    }
    setLoading(true);
    try {
      const user = await loginUser({ email, password });
      setAttemptsLeft(null);
      setLocked(false);
      localStorage.setItem("name", email.split("@")[0]);
      navigate(user.role === "ADMIN" ? "/admin" : "/dashboard");
    } catch (err) {
      const msg = err.response?.data || "";

      if (msg.startsWith("ATTEMPTS_LEFT:")) {
        const left = parseInt(msg.split(":")[1], 10);
        setAttemptsLeft(left);
        setLocked(false);
      } else if (msg.startsWith("LOCKED:")) {
        setLocked(true);
        setAttemptsLeft(0);
      } else if (msg.startsWith("Account locked")) {
        setLocked(true);
        setAttemptsLeft(0);
      } else {
        // wrong email / suspended / other
        toast.error(msg || "Invalid credentials");
      }
    } finally {
      setLoading(false);
    }
  };

  // Derive the inline warning to show
  const renderWarning = () => {
    if (locked) {
      return (
        <div className="login-warning login-warning-danger">
          <i className="fa-solid fa-lock"></i>
          <div>
            <strong>Account locked.</strong> Too many failed attempts.
            <br />
            <Link to="/reset-password" className="login-warning-link">Reset your password</Link> to regain access immediately.
          </div>
        </div>
      );
    }

    if (attemptsLeft === null) return null;

    if (attemptsLeft === 1) {
      return (
        <div className="login-warning login-warning-danger">
          <i className="fa-solid fa-triangle-exclamation"></i>
          <div>
            <strong>Last attempt.</strong> One more wrong password and your account will be locked for 15 minutes.
            <br />
            <Link to="/reset-password" className="login-warning-link">Reset your password</Link> now to avoid losing access.
          </div>
        </div>
      );
    }

    if (attemptsLeft === 2) {
      return (
        <div className="login-warning login-warning-orange">
          <i className="fa-solid fa-circle-exclamation"></i>
          <div>
            <strong>{attemptsLeft} attempts remaining.</strong> Forgot your password?{" "}
            <Link to="/reset-password" className="login-warning-link">Reset it here</Link> before you get locked out.
          </div>
        </div>
      );
    }

    return (
      <div className="login-warning login-warning-yellow">
        <i className="fa-solid fa-circle-info"></i>
        <div>
          Incorrect password — <strong>{attemptsLeft} attempt{attemptsLeft !== 1 ? "s" : ""} remaining</strong>.{" "}
          <Link to="/reset-password" className="login-warning-link">Forgot password?</Link>
        </div>
      </div>
    );
  };

  return (
    <div className="yc-page">
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

      <div className="yc-card">
        <button className="yc-back-btn" onClick={() => navigate(-1)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8L10 13" stroke="#5b6b8a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="yc-logo">
          <CloudBoxLogo size={32} textSize={20} variant="dark" />
        </div>

        <p className="yc-subtitle">Log in to the management console</p>

        <div className="yc-input-row">
          <input
            className="yc-input"
            type="email"
            placeholder="username@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setAttemptsLeft(null); setLocked(false); }}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            disabled={locked}
          />
          <button className="yc-input-arrow" onClick={handleLogin} disabled={loading || locked}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 9h12M10 4l5 5-5 5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <input
          className={`yc-input yc-input-full${attemptsLeft !== null && !locked ? " yc-input-error" : ""}`}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          disabled={locked}
        />

        {/* Attempt counter dots */}
        {attemptsLeft !== null && !locked && (
          <div className="login-attempt-dots">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className={`login-dot ${i < (5 - attemptsLeft) ? "login-dot-used" : "login-dot-free"}`}
              />
            ))}
            <span className="login-dot-label">{attemptsLeft} of 5 attempts left</span>
          </div>
        )}

        {/* Contextual inline warning */}
        {renderWarning()}

        <div className="yc-divider"><span>or</span></div>

        <button className="yc-btn-primary" onClick={handleLogin} disabled={loading || locked}>
          {loading ? "Logging in..." : "Log in using CloudBox ID"}
        </button>

        {!locked && (
          <Link to="/reset-password" className="yc-link-secondary">
            Forgot password?
          </Link>
        )}

        <Link to="/register" className="yc-btn-sso">
          Create an account
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

export default Login;
