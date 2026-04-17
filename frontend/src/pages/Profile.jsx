import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axiosConfig";
import Layout from "../components/layout/Layout";
import Toast from "../components/common/Toast";
import { useToast } from "../hooks/useToast";
import { logoutUser } from "../services/authService";
import { getSessionUser } from "../services/sessionService";
import { getRequestErrorMessage } from "../utils/requestErrors";
import "../styles/style.css";
import "../styles/Profile.css";

function Profile() {
  const { messages, removeToast, toast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState({});
  const [edit, setEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const sessionUser = getSessionUser();
  const name = sessionUser?.name || "User";
  const role = sessionUser?.role || "USER";
  const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await API.get("/user/profile");
      setUser(res.data);
    } catch (err) {
      toast.error(getRequestErrorMessage(err, "Failed to load profile"));
    }
  }, [toast]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleChange = (e) => setUser({ ...user, [e.target.name]: e.target.value });

  const updateProfile = async () => {
    try {
      await API.put("/user/profile", user);
      toast.success("Profile updated!");
      setEdit(false);
    } catch (error) {
      toast.error(getRequestErrorMessage(error, "Update failed"));
    }
  };

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      await API.delete("/user/account");
      logoutUser();
      navigate("/login");
    } catch (e) {
      toast.error(getRequestErrorMessage(e, "Failed to delete account"));
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const fields = [
    { label: "First Name", name: "firstName", type: "text" },
    { label: "Last Name", name: "lastName", type: "text" },
    { label: "Email", name: "email", type: "text", readOnly: true },
    { label: "Gender", name: "gender", type: "select", options: ["MALE", "FEMALE", "OTHER"] },
    { label: "Age", name: "age", type: "number" },
    { label: "Location", name: "location", type: "text" },
  ];

  return (
    <Layout type="user">
      <div className="content">
        <div className="prf-page">

          {/* ── LEFT: avatar card ── */}
          <div className="prf-sidebar">
            <div className="prf-avatar-wrap">
              <div className="prf-avatar">{initials}</div>
              <div className="prf-avatar-ring" />
            </div>
            <h3 className="prf-name">{user.firstName} {user.lastName}</h3>
            <span className="prf-role-badge">{role === "ADMIN" ? "Administrator" : "Member"}</span>
            <p className="prf-email">{user.email}</p>

            <div className="prf-sidebar-actions">
              {!edit && (
                <button className="btn btn-primary prf-btn" onClick={() => setEdit(true)}>
                  <i className="fa-solid fa-pen" /> Edit Profile
                </button>
              )}
              <button className="prf-logout-btn" onClick={handleLogout}>
                <i className="fa-solid fa-right-from-bracket" />
                Sign Out
              </button>
            </div>
          </div>

          {/* ── RIGHT: details card ── */}
          <div className="prf-card">
            <div className="prf-card-header">
              <h2 className="prf-card-title">Profile Details</h2>
              {edit && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-success btn-sm" onClick={updateProfile}>Save</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setEdit(false)}>Cancel</button>
                </div>
              )}
            </div>

            <div className="prf-fields">
              {fields.map(f => (
                <div className="prf-field" key={f.name}>
                  <label className="prf-label">{f.label}</label>
                  {edit && !f.readOnly ? (
                    f.type === "select" ? (
                      <select className="prf-input" name={f.name} value={user[f.name] || ""} onChange={handleChange}>
                        <option value="">Select</option>
                        {f.options.map(o => <option key={o} value={o}>{o.charAt(0) + o.slice(1).toLowerCase()}</option>)}
                      </select>
                    ) : (
                      <input className="prf-input" type={f.type} name={f.name} value={user[f.name] || ""} onChange={handleChange} />
                    )
                  ) : (
                    <span className="prf-value">{user[f.name] || <span style={{ color: "#94a3b8" }}>—</span>}</span>
                  )}
                </div>
              ))}
            </div>

            {/* ── Danger zone ── */}
            <div style={{
              marginTop: 32, padding: "20px 24px",
              border: "1.5px solid #fee2e2", borderRadius: 12,
              background: "#fff5f5",
            }}>
              <div style={{ fontWeight: 700, color: "#dc2626", marginBottom: 6, fontSize: 14 }}>
                <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 7 }}></i>
                Danger Zone
              </div>
              <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 14 }}>
                Permanently delete your account and all your files. This action cannot be undone.
              </p>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => setConfirmDelete(true)}
              >
                <i className="fa-solid fa-trash"></i> Delete My Account
              </button>
            </div>
          </div>

        </div>
      </div>
      <Toast messages={messages} removeToast={removeToast} />

      {confirmDelete && (
        <div className="viewer-modal" onClick={() => setConfirmDelete(false)}>
          <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
            <i className="fa-solid fa-triangle-exclamation confirm-icon" style={{ color: "#dc2626" }}></i>
            <h3>Delete Account?</h3>
            <p>All your files, shares, and data will be <strong>permanently deleted</strong>. This cannot be undone.</p>
            <div className="confirm-actions">
              <button className="btn btn-danger" onClick={deleteAccount} disabled={deleting}>
                {deleting ? <><i className="fa-solid fa-spinner fa-spin"></i> Deleting…</> : "Yes, Delete Everything"}
              </button>
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Profile;
