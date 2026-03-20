import Sidebar from "./Sidebar";
import Header from "./Header";
import "./layout.css";

function Layout({ children, type }) {
  return (
    <div className="layout">

      <Sidebar type={type} />

      <div className="main">
        <Header title={type === "admin" ? "Admin" : "User"} />

        <div className="content">
          {children}
        </div>
      </div>

    </div>
  );
}

export default Layout;