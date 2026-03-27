import { useState } from "react";
import { registerUser } from "../services/authService";
import { useNavigate, Link } from "react-router-dom";
import "../styles/login.css";

function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    age: "",
    location: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    const { firstName, lastName, email, password, confirmPassword } = formData;
    if (!firstName || !lastName || !email || !password) {
      alert("Please fill all required fields");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await registerUser(formData);
      alert("Registration Successful 🎉");
      navigate("/login");
    } catch (error) {
      console.log(error);
      alert("Registration Failed");
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
            <line x1="0" y1="55" x2="220" y2="55" stroke="#c5d4e8" strokeWidth="1.2"/>
            <line x1="0" y1="165" x2="220" y2="165" stroke="#c5d4e8" strokeWidth="1.2"/>
            <line x1="55" y1="0" x2="55" y2="220" stroke="#c5d4e8" strokeWidth="1.2"/>
            <line x1="165" y1="0" x2="165" y2="220" stroke="#c5d4e8" strokeWidth="1.2"/>
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
            <circle cx="110" cy="55" r="2.5" fill="#c5d4e8"/>
            <circle cx="55" cy="110" r="2.5" fill="#c5d4e8"/>
            <circle cx="165" cy="110" r="2.5" fill="#c5d4e8"/>
            <circle cx="110" cy="165" r="2.5" fill="#c5d4e8"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#circuit)"/>
        <text x="72%" y="12%" fill="#c5d4e8" fontSize="22" fontFamily="sans-serif" fontWeight="600" letterSpacing="3">ON-PREMISES</text>
        <text x="4%" y="50%" fill="#c5d4e8" fontSize="22" fontFamily="sans-serif" fontWeight="600" letterSpacing="3">CLOUD</text>
        <text x="84%" y="78%" fill="#c5d4e8" fontSize="18" fontFamily="sans-serif" fontWeight="600" letterSpacing="2">SAAS</text>
        <text x="84%" y="83%" fill="#c5d4e8" fontSize="18" fontFamily="sans-serif" fontWeight="600" letterSpacing="2">PAAS</text>
        <text x="84%" y="88%" fill="#c5d4e8" fontSize="18" fontFamily="sans-serif" fontWeight="600" letterSpacing="2">IAAS</text>
      </svg>

      {/* Card */}
      <div className="yc-card yc-card-register">
        <button className="yc-back-btn" onClick={() => navigate("/login")}>
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

        <p className="yc-subtitle">Create your management console account</p>

        {/* First + Last name */}
        <div className="yc-row-2">
          <input
            className="yc-input yc-input-full"
            name="firstName"
            placeholder="First Name *"
            value={formData.firstName}
            onChange={handleChange}
          />
          <input
            className="yc-input yc-input-full"
            name="lastName"
            placeholder="Last Name *"
            value={formData.lastName}
            onChange={handleChange}
          />
        </div>

        {/* Gender + Age */}
        <div className="yc-row-2">
          <select
            className="yc-input yc-input-full yc-select"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
          >
            <option value="">Gender</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
          <input
            className="yc-input yc-input-full"
            type="number"
            name="age"
            placeholder="Age"
            value={formData.age}
            onChange={handleChange}
          />
        </div>

        <input
          className="yc-input yc-input-full"
          name="location"
          placeholder="Location"
          value={formData.location}
          onChange={handleChange}
        />

        <input
          className="yc-input yc-input-full"
          type="email"
          name="email"
          placeholder="Email address *"
          value={formData.email}
          onChange={handleChange}
        />

        <input
          className="yc-input yc-input-full"
          type="password"
          name="password"
          placeholder="Password *"
          value={formData.password}
          onChange={handleChange}
        />

        <input
          className="yc-input yc-input-full"
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password *"
          value={formData.confirmPassword}
          onChange={handleChange}
        />

        <button
          className="yc-btn-primary"
          onClick={handleRegister}
          disabled={loading}
          style={{ marginTop: "6px" }}
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>

        <Link to="/login" className="yc-btn-sso">
          Already have an account? Log in
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

export default Register;