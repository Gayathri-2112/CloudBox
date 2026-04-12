import { useLocation, useNavigate } from "react-router-dom";
import {
  FaHome, FaFolder, FaUpload, FaShareAlt, FaUsers,
  FaBell, FaCog, FaHistory, FaSignOutAlt, FaTrash, FaCreditCard
} from "react-icons/fa";
import CloudBoxLogo from "../CloudBoxLogo";
import "./layout.css";

function Sidebar({ type, collapsed, onToggle }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNav = (path) => navigate(path);
  const handleLogout = () => { localStorage.clear(); navigate("/login"); };

  const userMenu = [
    { name: "Dashboard",       path: "/dashboard",    icon: <FaHome /> },
    { name: "My Files",        path: "/files",         icon: <FaFolder /> },
    { name: "Upload File",     path: "/upload",        icon: <FaUpload /> },
    { name: "Notifications",   path: "/notifications", icon: <FaBell /> },
    { name: "Shared With Me",  path: "/shared-with",   icon: <FaShareAlt /> },
    { name: "Shared By Me",    path: "/shared-by",     icon: <FaShareAlt /> },
    { name: "My Folders",      path: "/folders",       icon: <FaFolder /> },
    { name: "Collaboration",   path: "/collab",        icon: <FaUsers /> },
    { name: "Activity History",path: "/activity",      icon: <FaHistory /> },
    { name: "Trash",           path: "/trash",         icon: <FaTrash /> },
    { name: "Plans & Billing", path: "/plans",         icon: <FaCreditCard /> },
    { name: "Settings",        path: "/settings",      icon: <FaCog /> },
  ];

  const adminMenu = [
    { name: "Dashboard",              path: "/admin",               icon: <FaHome /> },
    { name: "User Management",        path: "/admin/users",         icon: <FaUsers /> },
    { name: "Payment Requests",       path: "/admin/payments",      icon: <FaCreditCard /> },
    { name: "Authentication Logs",    path: "/admin/logs",          icon: <FaHistory /> },
    { name: "File Management",        path: "/admin/files",         icon: <FaFolder /> },
    { name: "File Sharing Control",   path: "/admin/sharing",       icon: <FaShareAlt /> },
    { name: "Collaboration Activity", path: "/admin/activity",      icon: <FaUsers /> },
    { name: "Notifications",          path: "/admin/notifications", icon: <FaBell /> },
    { name: "System Settings",        path: "/admin/settings",      icon: <FaCog /> },
  ];

  const menu = type === "admin" ? adminMenu : userMenu;
  const isAdmin = type === "admin";

  return (
    <div className={`sidebar${isAdmin ? " sidebar-admin" : ""}${collapsed ? " sidebar-collapsed" : ""}`}>

      {/* Logo — hidden when collapsed */}
      {!collapsed && (
        <div className="sidebar-logo">
          <CloudBoxLogo size={28} textSize={16} variant="white" />
        </div>
      )}

      {/* Nav */}
      <ul>
        {menu.map((item, i) => {
          const active = location.pathname === item.path;
          return (
            <li
              key={i}
              className={active ? "active" : ""}
              onClick={() => handleNav(item.path)}
              title={collapsed ? item.name : ""}
            >
              <span className="sidebar-item-icon">{item.icon}</span>
              {!collapsed && <span className="sidebar-item-label">{item.name}</span>}
            </li>
          );
        })}
      </ul>

      {/* Logout */}
      <div className="sidebar-logout" onClick={handleLogout} title={collapsed ? "Sign Out" : ""}>
        <span className="sidebar-item-icon"><FaSignOutAlt /></span>
        {!collapsed && <span className="sidebar-item-label">Sign Out</span>}
      </div>
    </div>
  );
}

export default Sidebar;
