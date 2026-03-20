import { logoutUser } from "../services/authService";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import "../styles/style.css";

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState({});

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setUser(decoded);
    } catch (err) {
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    logoutUser();
    navigate("/");
  };

  return (
    <div className="container" style={{ paddingTop: "40px" }}>
      
      {/* HEADER */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "30px"
      }}>
        <h1>CloudBox Dashboard</h1>

        <button className="btn btn-danger" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* USER INFO CARD */}
      <div style={{
        background: "#fff",
        padding: "25px",
        borderRadius: "10px",
        boxShadow: "0 0 10px rgba(0,0,0,0.1)",
        maxWidth: "500px"
      }}>
        <h3>Welcome, {user.sub || "User"} 👋</h3>
        <p><b>Role:</b> {user.role}</p>

        {/* ACTIONS */}
        <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
          
          {/* 👤 Profile */}
          <button
            className="btn btn-primary"
            onClick={() => navigate("/profile")}
          >
            My Profile
          </button>

          {/* 👑 Admin */}
          {user.role === "ADMIN" && (
            <button
              className="btn btn-warning"
              onClick={() => navigate("/admin")}
            >
              Admin Panel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}