import { FaBell, FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./layout.css";

function Header({ type }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="header">
      
      {/* CENTER */}
      <div className="header-center">
        <div className="header-search-box">
          <i className="fa-solid fa-magnifying-glass"></i>
          <input placeholder="Search files..." />
        </div>
      </div>

      {/* RIGHT */}
      <div className="header-right">

        <div className="icon-btn">
          <FaBell />
        </div>

        <div className="icon-btn">
          <FaUserCircle />
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>

      </div>

    </div>
  );
}

export default Header;