import { useEffect, useState } from "react";
import API from "../api/axiosConfig";
import Layout from "../components/layout/Layout";
import Toast from "../components/common/Toast";
import { useToast } from "../hooks/useToast";
import "../styles/style.css";

function Notifications() {
  const { messages, removeToast, toast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    try {
      const res = await API.get("/user/notifications");
      setNotifications(res.data);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await API.put("/user/notifications/read-all");
      fetchNotifications();
      toast.success("All marked as read");
    } catch {
      toast.error("Failed to update notifications");
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (title = "") => {
    const t = title.toLowerCase();
    if (t.includes("upload")) return { icon: "fa-cloud-arrow-up", bg: "#eff6ff", color: "#2563eb" };
    if (t.includes("share")) return { icon: "fa-share-nodes", bg: "#f5f3ff", color: "#7c3aed" };
    if (t.includes("download")) return { icon: "fa-cloud-arrow-down", bg: "#ecfdf5", color: "#059669" };
    if (t.includes("delete")) return { icon: "fa-trash", bg: "#fff5f5", color: "#dc2626" };
    if (t.includes("setting")) return { icon: "fa-gear", bg: "#fefce8", color: "#d97706" };
    return { icon: "fa-bell", bg: "#f0f4fb", color: "#2563eb" };
  };

  return (
    <Layout type="user">
      <div className="content">

        {/* page header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h2 className="page-heading" style={{ marginBottom: 4 }}>Notifications</h2>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}` : "All caught up"}
            </p>
          </div>
          {unreadCount > 0 && (
            <button className="btn btn-primary btn-sm" onClick={markAllRead}>
              <i className="fa-solid fa-check-double" style={{ marginRight: 6 }} />
              Mark all read
            </button>
          )}
        </div>

        {/* list */}
        <div className="page-card">
          {loading && (
            <p className="empty-msg"><i className="fa-solid fa-spinner fa-spin" /> Loading…</p>
          )}

          {!loading && notifications.length === 0 && (
            <div style={{ padding: "48px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 44, color: "#cbd5e1", marginBottom: 14 }}>
                <i className="fa-solid fa-bell-slash" />
              </div>
              <p style={{ color: "#94a3b8", fontSize: 15, fontWeight: 500, margin: 0 }}>No notifications yet</p>
            </div>
          )}

          {!loading && notifications.map((n) => {
            const meta = getIcon(n.title);
            return (
              <div
                key={n.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  padding: "16px 22px",
                  borderBottom: "1px solid #f1f5f9",
                  opacity: n.read ? 0.65 : 1,
                  background: n.read ? "transparent" : "#fafcff",
                  transition: "background 0.15s",
                }}
              >
                {/* icon */}
                <div style={{
                  width: 40, height: 40, borderRadius: 11,
                  background: meta.bg, color: meta.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, flexShrink: 0,
                }}>
                  <i className={`fa-solid ${meta.icon}`} />
                </div>

                {/* text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <strong style={{ fontSize: 14, color: "#0f172a", fontWeight: 700 }}>{n.title}</strong>
                    {!n.read && (
                      <span style={{
                        background: "#2563eb", color: "#fff",
                        fontSize: 10, fontWeight: 700,
                        padding: "2px 8px", borderRadius: 20,
                        letterSpacing: "0.3px",
                      }}>NEW</span>
                    )}
                  </div>
                  <p style={{ margin: "0 0 5px", fontSize: 13.5, color: "#475569", lineHeight: 1.55 }}>{n.message}</p>
                  <small style={{ fontSize: 11.5, color: "#94a3b8", fontWeight: 500 }}>
                    <i className="fa-regular fa-clock" style={{ marginRight: 4 }} />
                    {new Date(n.createdAt).toLocaleString()}
                  </small>
                </div>
              </div>
            );
          })}
        </div>

      </div>
      <Toast messages={messages} removeToast={removeToast} />
    </Layout>
  );
}

export default Notifications;
