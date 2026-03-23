import { useEffect, useState } from "react";
import axios from "axios";
import API from "../api/axiosConfig";

import Layout from "../components/layout/Layout";
import "../components/layout/layout.css";
import "../components/common/card.css";

function UserDashboard() {

  const rawName = localStorage.getItem("name");
  const token = localStorage.getItem("token");

  const name = rawName
    ? rawName.charAt(0).toUpperCase() + rawName.slice(1)
    : "User";

  const [files, setFiles] = useState([]);
  const [totalSize, setTotalSize] = useState(0);
  const [notifications, setNotifications] = useState([]);

  // 📡 FETCH FILES
  useEffect(() => {
    fetchFiles();
    fetchNotifications();
  }, []);

  const fetchFiles = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/files", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = res.data;

      setFiles(data);

      // calculate total storage
      const total = data.reduce((sum, f) => sum + f.fileSize, 0);
      setTotalSize(total);

    } catch (err) {
      console.error("Error fetching files", err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await API.get("/user/notifications");
      setNotifications(res.data.slice(0, 3));
    } catch (err) {
      console.error("Error fetching notifications", err);
    }
  };

  // 📊 FORMAT SIZE
  const formatSize = (bytes) => {
    if (bytes === 0) return "0B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + sizes[i];
  };

  return (
    <Layout type="user">

      <div className="content">

        <h2 style={{ marginBottom: "10px" }}>User Dashboard</h2>

        {/* Welcome */}
        <div className="welcome-box">
          <div className="welcome-left">
            <div className="welcome-icon">
              <i className="fa-solid fa-hand"></i>
            </div>
            <div>
              <h3>Welcome back, {name}</h3>
              <p>Here's what's happening with your files today.</p>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">

          {/* LEFT */}
          <div>
            <div className="card">

              <div className="card-title">My Files Overview</div>

              {/* STATS */}
              <div className="stats-row">

                <div className="stat-card stat-green">
                  <div className="stat-icon user-icon-files">
                    <i className="fa-solid fa-folder"></i>
                  </div>
                  <div className="stat-text">
                    <h4>Total Files</h4>
                    <h2>{files.length}</h2>
                  </div>
                </div>

                <div className="stat-card stat-blue">
                  <div className="stat-icon user-icon-storage">
                    <i className="fa-solid fa-cloud"></i>
                  </div>
                  <div className="stat-text">
                    <h4>Storage Used</h4>
                    <h2>{formatSize(totalSize)}</h2>
                  </div>
                </div>

              </div>

              {/* RECENT FILES */}
              <div className="card-title">Recent Files</div>

              {files.slice(0, 5).map(file => (
                <div key={file.id} className="list-item user-icon-file">
                  <i className="fa-solid fa-file"></i> {file.fileName}
                </div>
              ))}

              {files.length === 0 && (
                <p>No files uploaded yet</p>
              )}

            </div>
          </div>

          {/* RIGHT */}
          <div>

            <div className="card">
              <div className="card-title">My Files Overview</div>

              <div className="list-item">
                <i className="fa-solid fa-folder user-icon-docs"></i> Documents
              </div>

              <div className="list-item">
                <i className="fa-solid fa-photo-film user-icon-media"></i> Media
              </div>

              <div className="list-item">
                <i className="fa-solid fa-link user-icon-links"></i> Shortcuts
              </div>
            </div>

            <div className="card" style={{ marginTop: "20px" }}>
              <div className="card-title">Notifications</div>
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div key={notification.id} className="list-item">
                    <div>
                      <strong>{notification.title}</strong>
                      <p style={{ margin: "6px 0 0" }}>{notification.message}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p>
                  <i className="fa-solid fa-bell user-icon-bell"></i> No new notifications
                </p>
              )}
            </div>

          </div>

        </div>

      </div>

    </Layout>
  );
}

export default UserDashboard;
