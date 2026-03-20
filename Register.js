import { useState } from "react";
import { registerUser } from "../services/authService";
import { useNavigate } from "react-router-dom";
import "../styles/style.css";

function Register() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    dob: "",
    location: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = async () => {
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword
    } = formData;

    // Basic validation
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

      // Redirect to login after success
      navigate("/login");

    } catch (error) {
      console.log(error);
      alert("Registration Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <h2>Create Account</h2>

        <input
          name="firstName"
          placeholder="First Name"
          value={formData.firstName}
          onChange={handleChange}
        />

        <input
          name="lastName"
          placeholder="Last Name"
          value={formData.lastName}
          onChange={handleChange}
        />

        <select
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          style={{
            width: "100%",
            padding: "12px 14px",
            marginBottom: "18px",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
            background: "#fafafa"
          }}
        >
          <option value="">Select Gender</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="OTHER">Other</option>
        </select>

        <input
        type="number"
        name="age"
        placeholder="Age"
        value={formData.age || ""}
        onChange={handleChange}
        />

        <input
          name="location"
          placeholder="Location"
          value={formData.location}
          onChange={handleChange}
        />

        <input
          type="email"
          name="email"
          placeholder="Email address"
          value={formData.email}
          onChange={handleChange}
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
        />

        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleChange}
        />

        <button className="btn btn-primary btn-full" onClick={handleRegister} disabled={loading}>
          {loading ? "Creating account..." : "Register"}
        </button>

        <div className="divider"></div>

        <a href="/login">Already have an account? Login</a>
      </div>
    </div>
  );
}

export default Register;