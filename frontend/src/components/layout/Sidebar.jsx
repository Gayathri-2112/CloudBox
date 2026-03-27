import { useLocation, useNavigate } from "react-router-dom";
import {
  FaHome, FaFolder, FaUpload, FaShareAlt, FaUsers,
  FaBell, FaCog, FaHistory, FaUserShield
} from "react-icons/fa";
import "./layout.css";

function Sidebar({ type }) {
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ USER MENU
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
    { name: "Settings", path: "/settings", icon: <FaCog /> }
  ];

  // ✅ ADMIN MENU
  const adminMenu = [
    { name: "Dashboard", path: "/admin", icon: <FaHome /> },
    { name: "User Management", path: "/admin/users", icon: <FaUsers /> },
    { name: "Authentication Logs", path: "/admin/logs", icon: <FaHistory /> },
    { name: "File Management", path: "/admin/files", icon: <FaFolder /> },
    { name: "File Sharing Control", path: "/admin/sharing", icon: <FaShareAlt /> },
    { name: "Collaboration Activity", path: "/admin/activity", icon: <FaUsers /> },
    { name: "Notifications", path: "/admin/notifications", icon: <FaBell /> },
    { name: "System Settings", path: "/admin/settings", icon: <FaCog /> }
  ];

  const menu = type === "admin" ? adminMenu : userMenu;

  return (
    <div className="sidebar">
      <h2 className="logo">CloudBox</h2>

      <ul>
        {menu.map((item, i) => {
          const isActive = location.pathname === item.path;

          return (
            <li
              key={i}
              className={isActive ? "active" : ""}
              onClick={() => navigate(item.path)}
            >
              <span className="icon">{item.icon}</span>
              {item.name}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default Sidebar;
