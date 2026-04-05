import { useEffect, useState } from "react";
import API from "../api/axiosConfig";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/Layout";
import "../styles/style.css";
import "../styles/UserDashboard.css";

function getFileIcon(fileName = "") {
  const n = fileName.toLowerCase();
  if (/\.(jpg|jpeg|png|gif|webp|svg)$/.test(n)) return { icon: "fa-image", color: "#8b5cf6" };
  if (/\.(mp4|mkv|avi|mov|webm)$/.test(n)) return { icon: "fa-film", color: "#f59e0b" };
  if (/\.(mp3|wav|ogg|flac)$/.test(n)) return { icon: "fa-music", color: "#10b981" };
  if (/\.(pdf)$/.test(n)) return { icon: "fa-file-pdf", color: "#ef4444" };
  if (/\.(doc|docx)$/.test(n)) return { icon: "fa-file-word", color: "#2563eb" };
  if (/\.(xls|xlsx)$/.test(n)) return { icon: "fa-file-excel", color: "#16a34a" };
  return { icon: "fa-file-lines", color: "#64748b" };
}

function formatSize(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024, sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(1) + " " + sizes[i];
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function UserDashboard() {
  const navigate = useNavigate();
  const rawName = localStorage.getItem("name") || "User";
  const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  const [files, setFiles] = useState([]);
  const [totalSize, setTotalSize] = useState(0);
  const [storageLimit, setStorageLimit] = useState(15360);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      API.get("/files"),
      API.get("/user/notifications"),
      API.get("/user/storage"),
    ]).then(([fRes, nRes, sRes]) => {
      setFiles(fRes.data || []);
      setNotifications((nRes.data || []).slice(0, 4));
      setTotalSize(Number(sRes.data.usedBytes) || 0);
      setStorageLimit(Number(sRes.data.limitMb) || 15360);
    }).catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const limitBytes = storageLimit * 1024 * 1024;
  const usedPct = limitBytes > 0 ? Math.min((totalSize / limitBytes) * 100, 100) : 0;
  const recentFiles = [...files].sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)).slice(0, 5);
  const unread = notifications.filter(n => !n.read).length;

  const quickLinks = [
    { label: "My Files", icon: "fa-folder-open", path: "/files", color: "#2563eb", bg: "#eff6ff" },
    { label: "Upload", icon: "fa-cloud-arrow-up", path: "/upload", color: "#7c3aed", bg: "#f5f3ff" },
    { label: "Folders", icon: "fa-folder", path: "/folders", color: "#d97706", bg: "#fffbeb" },
    { label: "Shared", icon: "fa-share-nodes", path: "/shared-with", color: "#059669", bg: "#ecfdf5" },
    { label: "Collab", icon: "fa-users", path: "/collab", color: "#0891b2", bg: "#ecfeff" },
    { label: "Activity", icon: "fa-clock-rotate-left", path: "/activity", color: "#64748b", bg: "#f8fafc" },
  ];

  return (
    <Layout type="user">
      <div className="ud-page">

        {/* HERO */}
        <div className="ud-hero">
          <div className="ud-hero-orb" />
          <div className="ud-hero-left">
            <p className="ud-hero-greeting">Good day 👋</p>
            <h1 className="ud-hero-name">Welcome back, {name}</h1>
            <p className="ud-hero-sub">Here's an overview of your cloud storage activity.</p>
          </div>
          <div className="ud-hero-stats">
            <div className="ud-hero-stat" onClick={() => navigate("/files")} style={{ cursor: "pointer" }}>
              <span className="ud-hero-stat-val">{files.length}</span>
              <span className="ud-hero-stat-lbl">Total Files</span>
            </div>
            <div className="ud-hero-stat-divider" />
            <div className="ud-hero-stat" onClick={() => navigate("/storage")} style={{ cursor: "pointer" }}>
              <span className="ud-hero-stat-val">{formatSize(totalSize)}</span>
              <span className="ud-hero-stat-lbl">Storage Used</span>
            </div>
            <div className="ud-hero-stat-divider" />
            <div className="ud-hero-stat" onClick={() => navigate("/notifications")} style={{ cursor: "pointer" }}>
              <span className="ud-hero-stat-val">{unread}</span>
              <span className="ud-hero-stat-lbl">Unread Alerts</span>
            </div>
          </div>
        </div>

        {/* STORAGE BAR */}
        <div className="ud-storage-bar-card">
          <div className="ud-storage-bar-left" onClick={() => navigate("/storage")} style={{ cursor: "pointer" }}>
            <i className="fa-solid fa-hard-drive ud-storage-icon" />
            <div>
              <div className="ud-storage-label">Storage</div>
              <div className="ud-storage-vals">{formatSize(totalSize)} <span>of {formatSize(limitBytes)}</span></div>
            </div>
          </div>
          <div className="ud-storage-bar-right">
            <button
              className="btn btn-sm btn-outline"
              onClick={fetchData}
              disabled={loading}
              style={{ marginRight: "10px" }}
            >
              <i className="fa-solid fa-refresh" /> {loading ? "Loading..." : "Refresh"}
            </button>
            <div className="ud-storage-track">
              <div className="ud-storage-fill" style={{ width: `${Math.max(usedPct, totalSize > 0 ? 0.5 : 0)}%` }} />
            </div>
            <span className="ud-storage-pct">{usedPct < 0.1 ? "< 0.1%" : usedPct.toFixed(1) + "%"}</span>
          </div>
        </div>

        {/* QUICK LINKS */}
        <div className="ud-quick-grid">
          {quickLinks.map(q => (
            <div key={q.label} className="ud-quick-card" onClick={() => navigate(q.path)}>
              <div className="ud-quick-icon" style={{ background: q.bg, color: q.color }}>
                <i className={`fa-solid ${q.icon}`} />
              </div>
              <span className="ud-quick-label">{q.label}</span>
            </div>
          ))}
        </div>

        {/* BOTTOM GRID */}
        <div className="ud-bottom-grid">

          {/* Recent Files */}
          <div className="ud-panel">
            <div className="ud-panel-head">
              <span><i className="fa-solid fa-clock-rotate-left" /> Recent Files</span>
              <button className="ud-panel-link" onClick={() => navigate("/files")}>View all →</button>
            </div>
            {recentFiles.length === 0
              ? <div className="ud-empty"><i className="fa-solid fa-folder-open" /><p>No files yet</p></div>
              : recentFiles.map(f => {
                const meta = getFileIcon(f.fileName);
                return (
                  <div key={f.id} className="ud-file-row" onClick={() => navigate("/files")}>
                    <div className="ud-file-icon" style={{ color: meta.color }}>
                      <i className={`fa-solid ${meta.icon}`} />
                    </div>
                    <div className="ud-file-info">
                      <span className="ud-file-name">{f.fileName}</span>
                      <span className="ud-file-meta">{formatSize(f.fileSize)} · {timeAgo(f.uploadedAt)}</span>
                    </div>
                  </div>
                );
              })
            }
          </div>

          {/* Notifications */}
          <div className="ud-panel">
            <div className="ud-panel-head">
              <span>
                <i className="fa-solid fa-bell" /> Notifications
                {unread > 0 && <span className="ud-notif-badge">{unread}</span>}
              </span>
              <button className="ud-panel-link" onClick={() => navigate("/notifications")}>View all →</button>
            </div>
            {notifications.length === 0
              ? <div className="ud-empty"><i className="fa-solid fa-bell-slash" /><p>No notifications</p></div>
              : notifications.map(n => (
                <div key={n.id} className={`ud-notif-row${n.read ? "" : " ud-notif-unread"}`} onClick={() => navigate("/notifications")}>
                  <div className="ud-notif-dot" style={{ background: n.read ? "#e2e8f0" : "#2563eb" }} />
                  <div className="ud-notif-body">
                    <span className="ud-notif-title">{n.title}</span>
                    <span className="ud-notif-msg">{n.message}</span>
                  </div>
                  <span className="ud-notif-time">{timeAgo(n.createdAt)}</span>
                </div>
              ))
            }
          </div>

        </div>
      </div>
    </Layout>
  );
}
