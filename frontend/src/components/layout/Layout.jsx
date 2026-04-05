import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import "./layout.css";

function Layout({ children, type }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="layout">
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar type={type} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main">
        <Header
          title={type === "admin" ? "Admin" : "User"}
          onMenuToggle={() => setSidebarOpen((o) => !o)}
          sidebarOpen={sidebarOpen}
        />
        <div className="content">{children}</div>
      </div>
    </div>
  );
}

export default Layout;
