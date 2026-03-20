import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/style.css";

function ResetPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email || !newPassword) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      await axios.post("http://localhost:8080/api/auth/reset-password", {
        email,
        newPassword
      });

      alert("Password updated successfully ✅");

      // Redirect to login
      navigate("/login");

    } catch (err) {
      alert("Reset failed ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <h2>Reset Password</h2>

        <input
          type="email"
          placeholder="Enter Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Enter New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        <button onClick={handleReset} disabled={loading}>
          {loading ? "Updating..." : "Reset Password"}
        </button>

        <div className="divider"></div>

        <a href="/login">Back to Login</a>
      </div>
    </div>
  );
}

export default ResetPassword;