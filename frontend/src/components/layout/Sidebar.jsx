import { useLocation, useNavigate } from "react-router-dom";
import {
  FaHome, FaFolder, FaUpload, FaShareAlt, FaUsers,
  FaBell, FaCog, FaHistory, FaSignOutAlt, FaTrash, FaStar
} from "react-icons/fa";
import CloudBoxLogo from "../CloudBoxLogo";
import "./layout.css";

function Sidebar({ type, isOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNav = (path) => {
    navigate(path);
    if (onClose) onClose(); // close on mobile after nav
  };
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const userMenu = [
    { name: "Dashboard", path: "/dashboard", icon: <FaHome /> },
    { name: "My Files", path: "/files", icon: <FaFolder /> },
    { name: "Upload File", path: "/upload", icon: <FaUpload /> },
    { name: "Notifications", path: "/notifications", icon: <FaBell /> },
    { name: "Shared With Me", path: "/shared-with", icon: <FaShareAlt /> },
    { name: "Shared By Me", path: "/shared-by", icon: <FaShareAlt /> },
    { name: "My Folders", path: "/folders", icon: <FaFolder /> },
    { name: "Collaboration", path: "/collab", icon: <FaUsers /> },
    { name: "Activity History", path: "/activity", icon: <FaHistory /> },
    { name: "Trash", path: "/trash", icon: <FaTrash /> },
    { name: "Settings", path: "/settings", icon: <FaCog /> },
  ];

  const adminMenu = [
    { name: "Dashboard", path: "/admin", icon: <FaHome /> },
    { name: "User Management", path: "/admin/users", icon: <FaUsers /> },
    { name: "Authentication Logs", path: "/admin/logs", icon: <FaHistory /> },
    { name: "File Management", path: "/admin/files", icon: <FaFolder /> },
    { name: "File Sharing Control", path: "/admin/sharing", icon: <FaShareAlt /> },
    { name: "Collaboration Activity", path: "/admin/activity", icon: <FaUsers /> },
    { name: "Notifications", path: "/admin/notifications", icon: <FaBell /> },
    { name: "System Settings", path: "/admin/settings", icon: <FaCog /> },
  ];

  const menu = type === "admin" ? adminMenu : userMenu;

  return (
    <div className={`sidebar${type === "admin" ? " sidebar-admin" : ""}${isOpen ? " sidebar-open" : ""}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <CloudBoxLogo size={30} textSize={17} variant="white" />
      </div>

      {/* Nav */}
      <ul>
        {menu.map((item, i) => (
          <li
            key={i}
            className={location.pathname === item.path ? "active" : ""}
            onClick={() => handleNav(item.path)}
          >
            <span className="icon">{item.icon}</span>
            {item.name}
          </li>
        ))}
      </ul>

      {/* Logout at bottom of sidebar */}
      <div className="sidebar-logout" onClick={handleLogout}>
        <span className="icon"><FaSignOutAlt /></span>
        Sign Out
      </div>
    </div>
  );
}

export default Sidebar;
