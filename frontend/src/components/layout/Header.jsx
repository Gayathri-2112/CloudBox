import { FaBell, FaUserCircle, FaBars } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useSearch } from "../../context/SearchContext";
import "./layout.css";

function Header({ type, collapsed, onToggle }) {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");
  const { query, setQuery } = useSearch();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleSearchKey = (e) => {
    if (e.key === "Enter" && query.trim()) navigate("/files");
  };

  return (
    <div style={{
      height: 64,
      display: "flex",
      alignItems: "center",
      padding: "0 16px",
      gap: 10,
      background: "#fff",
      borderBottom: "1px solid #d0daea",
      boxShadow: "0 2px 8px rgba(66,133,244,0.06)",
      flexShrink: 0,
    }}>

      {/* Hamburger */}
      <button
        onClick={onToggle}
        title="Toggle menu"
        style={{
          width: 36, height: 36, minWidth: 36,
          borderRadius: 8,
          border: "1.5px solid #d0daea",
          background: "#f5f8ff",
          color: "#5b6b8a",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", fontSize: 15, flexShrink: 0,
        }}
      >
        <FaBars />
      </button>

      {/* Search — takes remaining space */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center", minWidth: 0 }}>
        <div style={{
          display: "flex", alignItems: "center",
          width: "100%", maxWidth: 420,
          padding: "8px 12px",
          borderRadius: 10,
          border: "1.5px solid #d0daea",
          background: "#fff", gap: 8,
        }}>
          <i className="fa-solid fa-magnifying-glass" style={{ color: "#9baabf", fontSize: 13, flexShrink: 0 }}></i>
          <input
            placeholder="Search files..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearchKey}
            style={{
              border: "none", outline: "none", width: "100%", minWidth: 0,
              fontSize: 14, background: "transparent",
              fontFamily: "inherit", color: "#1a2236",
            }}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#9baabf", fontSize: 13, padding: "2px 4px" }}
            >✕</button>
          )}
        </div>
      </div>

      {/* Right — fixed width, never squeezed */}
      <div style={{
        display: "flex", alignItems: "center",
        gap: 8, flexShrink: 0,
      }}>
        <button
          onClick={() => navigate(role === "ADMIN" ? "/admin/notifications" : "/notifications")}
          title="Notifications"
          style={{
            width: 34, height: 34, minWidth: 34,
            borderRadius: 8, border: "none",
            background: "#f0f4fa",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", flexShrink: 0,
          }}
        >
          <FaBell style={{ fontSize: 16, color: "#5b6b8a" }} />
        </button>

        <button
          onClick={() => navigate("/settings")}
          title="Profile"
          style={{
            width: 34, height: 34, minWidth: 34,
            borderRadius: 8, border: "none",
            background: "#f0f4fa",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", flexShrink: 0,
          }}
        >
          <FaUserCircle style={{ fontSize: 16, color: "#5b6b8a" }} />
        </button>

        <button
          onClick={handleLogout}
          style={{
            padding: "7px 14px",
            borderRadius: 8, border: "none",
            background: "#ef4444",
            color: "#fff",
            fontSize: 13, fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            whiteSpace: "nowrap", flexShrink: 0,
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default Header;
