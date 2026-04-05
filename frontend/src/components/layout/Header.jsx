import { useEffect, useState } from "react";
import { FaBell, FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useSearch } from "../../context/SearchContext";
import API from "../../api/axiosConfig";
import "./layout.css";

function Header({ onMenuToggle, sidebarOpen }) {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");
  const name = localStorage.getItem("name") || "User";
  const { query, setQuery } = useSearch();
  const [unread, setUnread] = useState(0);

  // poll unread count every 30s
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        // only user role has unread-count endpoint
        if (role === "ADMIN") return;
        const res = await API.get("/user/notifications/unread-count");
        setUnread(Number(res.data) || 0);
      } catch { /* silent */ }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [role]);

  const handleSearchKey = (e) => {
    if (e.key === "Enter" && query.trim()) navigate("/files");
  };

  const handleBellClick = () => {
    setUnread(0); // optimistic clear
    navigate(role === "ADMIN" ? "/admin/notifications" : "/notifications");
  };

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="header">
      {/* Hamburger */}
      <button
        className={`hamburger-btn${sidebarOpen ? " is-open" : ""}`}
        onClick={onMenuToggle}
        aria-label="Toggle menu"
      >
        <span /><span /><span />
      </button>

      {/* Search */}
      <div className="header-center">
        <div className="header-search-box">
          <FaSearch className="header-search-icon" />
          <input
            placeholder="Search files..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearchKey}
          />
          {query && (
            <button className="search-clear-btn" onClick={() => setQuery("")}>✕</button>
          )}
        </div>
      </div>

      {/* Right actions */}
      <div className="header-right">
        <div className="header-icon-group">
          <button
            className="icon-btn bell-btn"
            title="Notifications"
            onClick={handleBellClick}
          >
            <FaBell />
            {unread > 0 && (
              <span className="bell-badge">{unread > 99 ? "99+" : unread}</span>
            )}
          </button>
        </div>

        <div className="header-divider" />

        <div className="header-user-chip" onClick={() => navigate("/settings")} title="My Profile">
          <div className="header-avatar">{initials}</div>
          <div className="header-user-info">
            <span className="header-user-name">{name}</span>
            <span className="header-user-role">{role === "ADMIN" ? "Administrator" : "Member"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Header;
