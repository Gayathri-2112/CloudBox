import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import "./layout.css";

function Layout({ children, type }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`layout${collapsed ? " sidebar-collapsed" : ""}`}>
      <Sidebar
        type={type}
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
      />
      <div className="main">
        <Header
          type={type}
          collapsed={collapsed}
          onToggle={() => setCollapsed(c => !c)}
        />
        <div className="content">{children}</div>
      </div>
    </div>
  );
}

export default Layout;
