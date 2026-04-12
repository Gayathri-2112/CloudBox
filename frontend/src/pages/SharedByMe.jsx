import { useEffect, useState, useMemo } from "react";
import API from "../api/axiosConfig";
import Layout from "../components/layout/Layout";
import Toast from "../components/common/Toast";
import { useToast } from "../hooks/useToast";
import { useSearch } from "../context/SearchContext";
import "../styles/style.css";
import "../styles/myfiles.css";

const CATEGORIES = ["All", "Documents", "Images", "Videos", "Audio", "Other"];

const PERM_STYLE = {
  VIEW:     { bg: "#e8f0fe", color: "#4285f4", label: "View only" },
  DOWNLOAD: { bg: "#dcfce7", color: "#16a34a", label: "Download" },
  EDIT:     { bg: "#fef9c3", color: "#b45309", label: "Edit" },
};

const FILE_ICON = (name = "") => {
  const n = name.toLowerCase();
  if (/\.(jpg|jpeg|png|gif|webp|svg)$/.test(n)) return { icon: "fa-image",      bg: "#e0f2fe", color: "#0284c7" };
  if (/\.(mp4|mkv|avi|mov|webm)$/.test(n))      return { icon: "fa-film",       bg: "#ede9fe", color: "#7c3aed" };
  if (/\.(mp3|wav|ogg|flac)$/.test(n))           return { icon: "fa-music",      bg: "#fce7f3", color: "#be185d" };
  if (/\.(pdf)$/.test(n))                        return { icon: "fa-file-pdf",   bg: "#fee2e2", color: "#dc2626" };
  if (/\.(doc|docx)$/.test(n))                   return { icon: "fa-file-word",  bg: "#dbeafe", color: "#2563eb" };
  if (/\.(xls|xlsx)$/.test(n))                   return { icon: "fa-file-excel", bg: "#dcfce7", color: "#16a34a" };
  if (/\.(pdf|doc|docx|txt|xls|xlsx|ppt|pptx)$/.test(n)) return { icon: "fa-file-lines", bg: "#f0f4fa", color: "#5b6b8a" };
  return { icon: "fa-file", bg: "#f0f4fa", color: "#9baabf" };
};

function getCategory(name = "") {
  const n = name.toLowerCase();
  if (/\.(jpg|jpeg|png|gif|webp)$/.test(n)) return "Images";
  if (/\.(mp4|mkv|avi|mov|webm)$/.test(n)) return "Videos";
  if (/\.(mp3|wav|ogg|flac)$/.test(n)) return "Audio";
  if (/\.(pdf|doc|docx|txt|xls|xlsx|ppt|pptx)$/.test(n)) return "Documents";
  return "Other";
}

function SharedByMe() {
  const { messages, removeToast, toast } = useToast();
  const { query } = useSearch();
  const [shares, setShares] = useState([]);
  const [localSearch, setLocalSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [confirmRevoke, setConfirmRevoke] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [newPermission, setNewPermission] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const search = query || localSearch;

  useEffect(() => { fetchShares(); }, []);

  const fetchShares = async () => {
    try {
      const res = await API.get("/files/shared-by-me");
      setShares(res.data);
    } catch { toast.error("Failed to load shared files"); }
  };

  const filtered = useMemo(() => shares.filter(s => {
    const ms = s.fileName.toLowerCase().includes(search.toLowerCase()) ||
               s.sharedWith.toLowerCase().includes(search.toLowerCase());
    const mc = category === "All" || getCategory(s.fileName) === category;
    return ms && mc;
  }), [shares, search, category]);

  const revokeShare = async (id) => {
    try {
      await API.delete(`/files/shares/${id}`);
      setShares(p => p.filter(s => s.id !== id));
      toast.success("Access revoked");
    } catch (e) { toast.error(e.response?.data || "Failed"); }
    finally { setConfirmRevoke(null); }
  };

  const openEditModal = async (share) => {
    try {
      const res = await API.get(`/files/${share.fileId}/available-permissions`);
      setEditModal({
        shareId: share.id,
        fileName: share.fileName,
        currentPermission: share.permission,
        sharedWith: share.sharedWith,
        availablePermissions: res.data.availablePermissions || ["VIEW", "DOWNLOAD", "EDIT"],
      });
      setNewPermission(share.permission);
    } catch { toast.error("Failed to load permissions"); }
  };

  const updatePermission = async () => {
    if (!newPermission || newPermission === editModal.currentPermission) {
      toast.warning("Select a different permission"); return;
    }
    setIsUpdating(true);
    try {
      await API.put(`/files/shares/${editModal.shareId}`, { permission: newPermission });
      setShares(p => p.map(s => s.id === editModal.shareId ? {...s, permission: newPermission} : s));
      toast.success("Permission updated");
      setEditModal(null);
    } catch (e) { toast.error(e.response?.data || "Failed"); }
    finally { setIsUpdating(false); }
  };

  return (
    <Layout type="user">
      <div className="content">
        <h2 className="page-heading">Shared By Me</h2>

        {/* Toolbar */}
        <div className="mf-toolbar">
          <div className="mf-search">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input placeholder="Search by file or recipient..." value={localSearch}
              onChange={e => setLocalSearch(e.target.value)} />
          </div>
          <div className="mf-cats">
            {CATEGORIES.map(c => (
              <button key={c} className={`mf-cat${category === c ? " active" : ""}`}
                onClick={() => setCategory(c)}>{c}</button>
            ))}
          </div>
        </div>

        {/* Share list */}
        <div className="mf-list">
          {filtered.length === 0 && (
            <div className="mf-empty">
              {shares.length === 0 ? "You haven't shared any files yet" : "No files match your search"}
            </div>
          )}

          {filtered.map(share => {
            const { icon, bg, color } = FILE_ICON(share.fileName);
            const ps = PERM_STYLE[share.permission] || PERM_STYLE.VIEW;
            return (
              <div key={share.id} className="mf-row">
                {/* icon */}
                <div className="mf-icon" style={{ background: bg, color }}>
                  <i className={`fa-solid ${icon}`}></i>
                </div>

                {/* info */}
                <div className="mf-info">
                  <div className="mf-name">{share.fileName}</div>
                  <div className="mf-meta">
                    <i className="fa-solid fa-user" style={{ marginRight: 4, fontSize: 11 }}></i>
                    {share.sharedWith}
                    {share.createdAt && (
                      <span style={{ marginLeft: 8 }}>
                        &bull; {new Date(share.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* permission badge */}
                <span style={{
                  background: ps.bg, color: ps.color,
                  borderRadius: 20, padding: "3px 12px",
                  fontSize: 11, fontWeight: 700, flexShrink: 0,
                }}>
                  {ps.label}
                </span>

                {/* actions */}
                <div className="mf-actions">
                  <button className="mf-btn mf-btn-view" onClick={() => openEditModal(share)}>
                    <i className="fa-solid fa-pen"></i> Edit
                  </button>
                  <button className="mf-btn mf-btn-trash" onClick={() => setConfirmRevoke(share.id)}>
                    <i className="fa-solid fa-ban"></i> Revoke
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Confirm revoke */}
        {confirmRevoke && (
          <div className="viewer-modal" onClick={() => setConfirmRevoke(null)}>
            <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
              <i className="fa-solid fa-triangle-exclamation confirm-icon"></i>
              <h3>Revoke Access?</h3>
              <p>The recipient will immediately lose access to this file.</p>
              <div className="confirm-actions">
                <button className="btn btn-danger" onClick={() => revokeShare(confirmRevoke)}>Revoke</button>
                <button className="btn btn-secondary" onClick={() => setConfirmRevoke(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit permission modal */}
        {editModal && (
          <div className="viewer-modal" onClick={() => setEditModal(null)}>
            <div className="link-modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="viewer-header">
                <span><i className="fa-solid fa-shield-halved" style={{ marginRight: 8, color: "#4285f4" }}></i>Edit Permission</span>
                <button className="close-btn" onClick={() => setEditModal(null)}>✕</button>
              </div>

              {/* File + recipient info */}
              <div style={{
                background: "#f5f8ff", borderRadius: 10, padding: "12px 16px",
                border: "1px solid #d0daea", display: "flex", gap: 12, alignItems: "center",
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: FILE_ICON(editModal.fileName).bg,
                  color: FILE_ICON(editModal.fileName).color,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                }}>
                  <i className={`fa-solid ${FILE_ICON(editModal.fileName).icon}`}></i>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#1a2236",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {editModal.fileName}
                  </div>
                  <div style={{ fontSize: 12, color: "#9baabf", marginTop: 2 }}>
                    <i className="fa-solid fa-user" style={{ marginRight: 4 }}></i>{editModal.sharedWith}
                  </div>
                </div>
              </div>

              {/* Permission options */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#5b6b8a",
                  textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Select Permission
                </div>
                {editModal.availablePermissions.map(perm => {
                  const ps = PERM_STYLE[perm] || PERM_STYLE.VIEW;
                  const icons = { VIEW: "fa-eye", DOWNLOAD: "fa-download", EDIT: "fa-pen" };
                  const descs = {
                    VIEW: "Can view the file only",
                    DOWNLOAD: "Can view and download",
                    EDIT: "Can view, download and edit",
                  };
                  const selected = newPermission === perm;
                  return (
                    <div key={perm}
                      onClick={() => !isUpdating && setNewPermission(perm)}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "12px 16px", borderRadius: 10, cursor: "pointer",
                        border: `2px solid ${selected ? ps.color : "#d0daea"}`,
                        background: selected ? ps.bg : "#fff",
                        transition: "all .15s",
                      }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                        background: selected ? ps.color : "#f0f4fa",
                        color: selected ? "#fff" : "#9baabf",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
                      }}>
                        <i className={`fa-solid ${icons[perm] || "fa-lock"}`}></i>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14,
                          color: selected ? ps.color : "#1a2236" }}>{ps.label}</div>
                        <div style={{ fontSize: 12, color: "#9baabf", marginTop: 1 }}>{descs[perm]}</div>
                      </div>
                      {selected && (
                        <i className="fa-solid fa-circle-check" style={{ color: ps.color, fontSize: 18 }}></i>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setEditModal(null)}
                  disabled={isUpdating}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={updatePermission}
                  disabled={isUpdating || newPermission === editModal.currentPermission}>
                  {isUpdating
                    ? <><i className="fa-solid fa-spinner fa-spin"></i> Updating…</>
                    : <><i className="fa-solid fa-check"></i> Update</>}
                </button>
              </div>
            </div>
          </div>
        )}

        <Toast messages={messages} removeToast={removeToast} />
      </div>
    </Layout>
  );
}

export default SharedByMe;
