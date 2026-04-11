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
    <div className="header">
      {/* Hamburger — always visible in header too */}
      <button className="header-hamburger" onClick={onToggle} title={collapsed ? "Expand menu" : "Collapse menu"}>
        <FaBars />
      </button>

      <div className="header-center">
        <div className="header-search-box">
          <i className="fa-solid fa-magnifying-glass"></i>
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

      <div className="header-right">
        <div className="icon-btn">
          <FaBell onClick={() => navigate(role === "ADMIN" ? "/admin/notifications" : "/notifications")} />
        </div>
        <div className="icon-btn" onClick={() => navigate("/settings")}>
          <FaUserCircle />
        </div>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}

export default Header;
