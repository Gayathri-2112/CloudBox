import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { renderAsync } from "docx-preview";
import API from "../api/axiosConfig";
import Layout from "../components/layout/Layout";
import Toast from "../components/common/Toast";
import { useToast } from "../hooks/useToast";
import { useSearch } from "../context/SearchContext";
import { getDirectFileUrl, triggerDownload } from "../utils/fileAccess";
import { useFileSync } from "../hooks/useFileSync";
import "../styles/myfiles.css";
import "../styles/style.css";
import "../components/common/card.css";

const CATEGORIES = ["All", "Starred", "Documents", "Images", "Videos", "Audio", "Other"];

const ICON_MAP = {
  Images:    { icon: "fa-image",       bg: "#e0f2fe", color: "#0284c7" },
  Videos:    { icon: "fa-film",        bg: "#ede9fe", color: "#7c3aed" },
  Audio:     { icon: "fa-music",       bg: "#fce7f3", color: "#be185d" },
  pdf:       { icon: "fa-file-pdf",    bg: "#fee2e2", color: "#dc2626" },
  word:      { icon: "fa-file-word",   bg: "#dbeafe", color: "#2563eb" },
  excel:     { icon: "fa-file-excel",  bg: "#dcfce7", color: "#16a34a" },
  Documents: { icon: "fa-file-lines",  bg: "#f0f4fa", color: "#5b6b8a" },
  Other:     { icon: "fa-file",        bg: "#f0f4fa", color: "#9baabf" },
};

function getCategory(file) {
  const name = (file.fileName || "").toLowerCase();
  const type = (file.fileType || "").toLowerCase();
  if (type.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg)$/.test(name)) return "Images";
  if (type.startsWith("video/") || /\.(mp4|mkv|avi|mov|webm)$/.test(name)) return "Videos";
  if (type.startsWith("audio/") || /\.(mp3|wav|ogg|flac)$/.test(name)) return "Audio";
  if (type.includes("pdf") || type.includes("word") || type.includes("document") ||
    /\.(pdf|doc|docx|txt|xls|xlsx|ppt|pptx|csv)$/.test(name)) return "Documents";
  return "Other";
}

function getIconStyle(file) {
  const name = (file.fileName || "").toLowerCase();
  if (/\.(pdf)$/.test(name)) return ICON_MAP.pdf;
  if (/\.(doc|docx)$/.test(name)) return ICON_MAP.word;
  if (/\.(xls|xlsx)$/.test(name)) return ICON_MAP.excel;
  return ICON_MAP[getCategory(file)] || ICON_MAP.Other;
}

function formatSize(bytes) {
  if (!bytes) return "0 B";
  const k = 1024, sizes = ["B","KB","MB","GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(1) + " " + sizes[i];
}

export default function MyFiles() {
  const { messages, removeToast, toast } = useToast();
  const { setQuery } = useSearch();

  const [files,        setFiles]        = useState([]);
  const [folders,      setFolders]      = useState(["root"]);
  const [localSearch,  setLocalSearch]  = useState("");
  const [category,     setCategory]     = useState("All");
  const [sortBy,       setSortBy]       = useState("date");
  const [sortDir,      setSortDir]      = useState("desc");
  const [expandMove,   setExpandMove]   = useState(null); // fileId
  const [moveTarget,   setMoveTarget]   = useState({});
  const [renameId,     setRenameId]     = useState(null);
  const [renameName,   setRenameName]   = useState("");
  const [confirmTrash, setConfirmTrash] = useState(null);
  const [viewer,       setViewer]       = useState(null);
  const [docxEditMode, setDocxEditMode] = useState(false);
  const [docxEditText, setDocxEditText] = useState("");
  const [docxSaving,   setDocxSaving]   = useState(false);
  const [linkModal,    setLinkModal]    = useState(null);
  const [linkPerm,     setLinkPerm]     = useState("VIEW");
  const [linkExpiry,   setLinkExpiry]   = useState("");
  const [linkEmailTo,  setLinkEmailTo]  = useState("");
  const [linkEmailPerm, setLinkEmailPerm] = useState("VIEW");
  const [linkEmailSending, setLinkEmailSending] = useState(false);
  const [shareModal,   setShareModal]   = useState(null);
  const [shareEmails,  setShareEmails]  = useState("");
  const [sharePerm,    setSharePerm]    = useState("");
  const docxRef = useRef(null);

  useEffect(() => { setQuery(""); fetchFiles(); fetchFolders(); }, []);

  const fetchFiles = async () => {
    try { const r = await API.get("/files"); setFiles(r.data); }
    catch { toast.error("Failed to load files"); }
  };
  const fetchFolders = async () => {
    try { const r = await API.get("/files/folders"); setFolders(r.data); }
    catch {}
  };

  const filtered = useMemo(() => {
    let r = files.filter(f => {
      const ms = f.fileName.toLowerCase().includes(localSearch.toLowerCase());
      const mc = category === "All"
        || (category === "Starred" && f.starred)
        || (category !== "Starred" && getCategory(f) === category);
      return ms && mc;
    });
    r = [...r].sort((a, b) => {
      let c = 0;
      if (sortBy === "name") c = a.fileName.localeCompare(b.fileName);
      else if (sortBy === "size") c = (a.fileSize||0) - (b.fileSize||0);
      else c = new Date(a.uploadedAt||0) - new Date(b.uploadedAt||0);
      return sortDir === "asc" ? c : -c;
    });
    return r;
  }, [files, localSearch, category, sortBy, sortDir]);

  // ── actions ──
  const toggleStar = async (file) => {
    try {
      await API.put(`/files/${file.id}/star`);
      setFiles(p => p.map(f => f.id === file.id ? {...f, starred: !f.starred} : f));
    } catch { toast.error("Failed"); }
  };

  const trashFile = async (id) => {
    try {
      await API.put(`/files/${id}/trash`);
      setFiles(p => p.filter(f => f.id !== id));
      toast.success("Moved to trash");
    } catch (e) { toast.error(e.response?.data || "Failed"); }
    finally { setConfirmTrash(null); }
  };

  const moveFile = async (fileId) => {
    const target = moveTarget[fileId];
    if (!target) { toast.warning("Select a folder"); return; }
    try {
      await API.put("/files/move", { fileId, targetFolder: target });
      fetchFiles(); toast.success("Moved");
    } catch (e) { toast.error(e.response?.data || "Failed"); }
    setExpandMove(null);
  };

  const submitRename = async (id) => {
    if (!renameName.trim()) return;
    try {
      await API.put(`/files/${id}/rename`, { newName: renameName.trim() });
      setFiles(p => p.map(f => f.id === id ? {...f, fileName: renameName.trim()} : f));
      toast.success("Renamed");
    } catch (e) { toast.error(e.response?.data || "Failed"); }
    setRenameId(null);
  };

  const shareFile = async (fileId) => {
    const emails = shareEmails.split(/[,;\s]+/).map(e => e.trim()).filter(Boolean);
    if (!emails.length) { toast.warning("Enter at least one email"); return; }
    if (!sharePerm) { toast.warning("Select a permission"); return; }
    try {
      if (emails.length === 1) await API.post("/files/share", { fileId, sharedWith: emails[0], permission: sharePerm });
      else await API.post("/files/share/bulk", { fileId, sharedWithList: emails, permission: sharePerm });
      toast.success(`Shared with ${emails.length} recipient${emails.length > 1 ? "s" : ""}`);
      setShareModal(null); setShareEmails(""); setSharePerm("");
    } catch (e) { toast.error(e.response?.data || "Failed"); }
  };

const downloadFile = async (file) => {
  try {
    const res = await API.get(`/files/download/${file.id}`, {
      responseType: "blob"
    });

    const blob = new Blob([res.data], {
      type: res.headers["content-type"]
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = file.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

  } catch (err) {
    toast.error("Download failed");
  }
};

  const viewFile = async (file) => {
  const isDocx = /\.(doc|docx)$/i.test(file.fileName);

  if (isDocx) {
    try {
      const r = await API.get(`/files/preview/${file.id}`, {
        responseType: "arraybuffer"
      });

      setDocxEditMode(false);
      setDocxEditText("");

      setViewer({
        type: "docx",
        name: file.fileName,
        fileId: file.id,
        arrayBuffer: r.data
      });
    } catch {
      toast.error("Failed to open document");
    }
    return;
  }

  try {
    const res = await API.get(`/files/preview/${file.id}`, {
      responseType: "blob"
    });

    const blob = new Blob([res.data], {
      type: res.headers["content-type"]
    });

    const url = URL.createObjectURL(blob);

    setViewer({
      url,
      type: res.headers["content-type"], // ✅ REAL TYPE
      name: file.fileName,
      blobUrl: true
    });

  } catch (err) {
    toast.error("Failed to open file");
  }
};
  const startDocxEdit = async () => {
    if (!viewer?.fileId) return;
    if (docxEditText) { setDocxEditMode(true); return; }
    try {
      const r = await API.get(`/files/docx-text/${viewer.fileId}`);
      setDocxEditText(r.data.text || ""); setDocxEditMode(true);
    } catch { toast.error("Failed to load text"); }
  };

  const saveDocxEdit = async () => {
    if (!viewer?.fileId) return;
    setDocxSaving(true);
    try {
      await API.put(`/files/docx-text/${viewer.fileId}`, { text: docxEditText });
      toast.success("Saved");
      const r = await API.get(`/files/preview/${viewer.fileId}`, { responseType: "arraybuffer" });
      setDocxEditText(""); setDocxEditMode(false);
      setViewer(p => ({...p, arrayBuffer: r.data}));
    } catch (e) { toast.error(e.response?.data || "Save failed"); }
    finally { setDocxSaving(false); }
  };

  useEffect(() => {
    if (viewer?.type === "docx" && viewer.arrayBuffer && docxRef.current && !docxEditMode) {
      docxRef.current.innerHTML = "";
      renderAsync(viewer.arrayBuffer, docxRef.current).catch(() => toast.error("Render failed"));
    }
  }, [viewer, docxEditMode]);

  // sync: reload docx if another user saves
  const handleSyncUpdate = useCallback(async () => {
    if (!viewer?.fileId || viewer.type !== "docx" || docxEditMode) return;
    try {
      const r = await API.get(`/files/preview/${viewer.fileId}`, { responseType: "arraybuffer" });
      setViewer(p => ({...p, arrayBuffer: r.data}));
      toast.info("Document updated by another user");
    } catch {}
  }, [viewer, docxEditMode]);

  useFileSync({
    fileId: viewer?.type === "docx" ? viewer.fileId : null,
    active: !!viewer && viewer.type === "docx" && !docxEditMode,
    onUpdate: handleSyncUpdate,
  });

  const openLinkModal = async (file) => {
    try { const r = await API.get(`/public/links/${file.id}`); setLinkModal({ fileId: file.id, fileName: file.fileName, links: r.data, isDocx: /\.(doc|docx)$/i.test(file.fileName) }); }
    catch { setLinkModal({ fileId: file.id, fileName: file.fileName, links: [], isDocx: /\.(doc|docx)$/i.test(file.fileName) }); }
    setLinkPerm("VIEW"); setLinkExpiry("");
  };
  const createLink = async () => {
    try {
      const body = { fileId: linkModal.fileId, permission: linkPerm };
      if (linkExpiry) body.expiryHours = parseInt(linkExpiry);
      await API.post("/public/link", body);
      const r = await API.get(`/public/links/${linkModal.fileId}`);
      setLinkModal(p => ({...p, links: r.data})); toast.success("Link created");
    } catch (e) { toast.error(e.response?.data || "Failed"); }
  };
  const revokeLink = async (token) => {
    try { await API.delete(`/public/link/${token}`); setLinkModal(p => ({...p, links: p.links.filter(l => l.token !== token)})); toast.success("Revoked"); }
    catch { toast.error("Failed"); }
  };
  const updateLinkPermission = async (token, newPerm) => {
    try {
      await API.put(`/public/link/${token}/permission`, { permission: newPerm });
      setLinkModal(p => ({...p, links: p.links.map(l => l.token === token ? {...l, permission: newPerm} : l)}));
      toast.success("Permission updated");
    } catch (e) { toast.error(e.response?.data || "Failed"); }
  };

  const copyLink = (token) => { navigator.clipboard.writeText(`${window.location.origin}/shared/${token}`); toast.success("Copied"); };

  const sendLinkByEmail = async () => {
    if (!linkEmailTo.trim()) { toast.warning("Enter an email address"); return; }
    setLinkEmailSending(true);
    try {
      await API.post(`/public/link/email`, {
        fileId: linkModal.fileId,
        email: linkEmailTo.trim(),
        permission: linkEmailPerm,
      });
      toast.success(`Link sent to ${linkEmailTo.trim()}`);
      setLinkEmailTo("");
      // refresh link list
      const r = await API.get(`/public/links/${linkModal.fileId}`);
      setLinkModal(p => ({...p, links: r.data}));
    } catch (e) { toast.error(e.response?.data || "Failed to send email"); }
    finally { setLinkEmailSending(false); }
  };

  return (
    <Layout type="user">
      <div className="content">
        <h2 className="page-heading">My Files</h2>

        {/* ── toolbar ── */}
        <div className="mf-toolbar">
          <div className="mf-search">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input placeholder="Search files..." value={localSearch} onChange={e => setLocalSearch(e.target.value)} />
          </div>
          <div className="mf-cats">
            {CATEGORIES.map(c => (
              <button key={c} className={`mf-cat${category === c ? " active" : ""}`} onClick={() => setCategory(c)}>{c}</button>
            ))}
          </div>
          <div className="mf-sort">
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="date">Date</option>
              <option value="name">Name</option>
              <option value="size">Size</option>
            </select>
            <button className="mf-sort-dir" onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")}>
              <i className={`fa-solid fa-arrow-${sortDir === "asc" ? "up" : "down"}`}></i>
            </button>
          </div>
        </div>

        {/* ── file list ── */}
        <div className="mf-list">
          {filtered.length === 0 && (
            <div className="mf-empty">
              {files.length === 0 ? "No files uploaded yet" : "No files match your search"}
            </div>
          )}

          {filtered.map(file => {
            const { icon, bg, color } = getIconStyle(file);
            return (
              <div key={file.id}>
                <div className="mf-row">
                  {/* icon */}
                  <div className="mf-icon" style={{ background: bg, color }}><i className={`fa-solid ${icon}`}></i></div>

                  {/* info */}
                  <div className="mf-info">
                    {renameId === file.id ? (
                      <div className="mf-rename-row">
                        <input className="mf-rename-input" value={renameName}
                          onChange={e => setRenameName(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") submitRename(file.id); if (e.key === "Escape") setRenameId(null); }}
                          autoFocus />
                        <button className="mf-btn mf-btn-view" onClick={() => submitRename(file.id)}>✓</button>
                        <button className="mf-btn mf-btn-trash" onClick={() => setRenameId(null)}>✕</button>
                      </div>
                    ) : (
                      <div className="mf-name">{file.fileName}</div>
                    )}
                    <div className="mf-meta">
                      {formatSize(file.fileSize)} &bull; {new Date(file.uploadedAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* folder badge */}
                  <span className="mf-folder-badge">{file.folder || "root"}</span>

                  {/* star */}
                  <button className={`mf-star${file.starred ? " starred" : ""}`} onClick={() => toggleStar(file)}>
                    <i className={`fa-${file.starred ? "solid" : "regular"} fa-star`}></i>
                  </button>

                  {/* hover actions */}
                  <div className="mf-actions">
                    <button className="mf-btn mf-btn-view" onClick={() => viewFile(file)}>
                      <i className="fa-solid fa-eye"></i> View
                    </button>
                    <button className="mf-btn mf-btn-dl" onClick={() => downloadFile(file)}>
                      <i className="fa-solid fa-download"></i>
                    </button>
                    <button className="mf-btn mf-btn-share" onClick={() => setShareModal(file)}>
                      <i className="fa-solid fa-share-alt"></i> Share
                    </button>
                    <button className="mf-btn mf-btn-link" onClick={() => openLinkModal(file)}>
                      <i className="fa-solid fa-link"></i>
                    </button>
                    <button className="mf-btn mf-btn-rename" onClick={() => { setRenameId(file.id); setRenameName(file.fileName); }}>
                      <i className="fa-solid fa-pencil"></i>
                    </button>
                    <button className="mf-btn mf-btn-link" onClick={() => setExpandMove(expandMove === file.id ? null : file.id)}
                      title="Move to folder">
                      <i className="fa-solid fa-folder-open"></i>
                    </button>
                    <button className="mf-btn mf-btn-trash" onClick={() => setConfirmTrash(file.id)}>
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>

                {/* expandable move row */}
                {expandMove === file.id && (
                  <div className="mf-move-row">
                    <select value={moveTarget[file.id] || file.folder || "root"}
                      onChange={e => setMoveTarget(p => ({...p, [file.id]: e.target.value}))}>
                      {folders.map(f => <option key={f} value={f}>Move to {f}</option>)}
                    </select>
                    <button className="mf-btn mf-btn-view" onClick={() => moveFile(file.id)}>Move</button>
                    <button className="mf-btn mf-btn-trash" onClick={() => setExpandMove(null)}>Cancel</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── share modal ── */}
        {shareModal && (
          <div className="viewer-modal" onClick={() => setShareModal(null)}>
            <div className="link-modal" onClick={e => e.stopPropagation()}>
              <div className="viewer-header">
                <span><i className="fa-solid fa-share-alt" style={{marginRight:8}}></i>Share — {shareModal.fileName}</span>
                <button className="close-btn" onClick={() => setShareModal(null)}>✕</button>
              </div>
              <div className="link-create-row">
                <input className="inline-input" style={{flex:1}} placeholder="Recipient emails (comma separated)"
                  value={shareEmails} onChange={e => setShareEmails(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && shareFile(shareModal.id)} />
                <select className="inline-select" value={sharePerm} onChange={e => setSharePerm(e.target.value)}>
                  <option value="" disabled>Permission</option>
                  <option value="VIEW">View</option>
                  <option value="DOWNLOAD">Download</option>
                  <option value="EDIT">Edit</option>
                </select>
                <button className="btn btn-primary btn-sm" onClick={() => shareFile(shareModal.id)}>
                  <i className="fa-solid fa-paper-plane"></i> Share
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── confirm trash ── */}
        {confirmTrash && (
          <div className="viewer-modal" onClick={() => setConfirmTrash(null)}>
            <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
              <i className="fa-solid fa-triangle-exclamation confirm-icon"></i>
              <h3>Move to Trash?</h3>
              <p>You can restore it from the Trash page.</p>
              <div className="confirm-actions">
                <button className="btn btn-danger" onClick={() => trashFile(confirmTrash)}>Move to Trash</button>
                <button className="btn btn-secondary" onClick={() => setConfirmTrash(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* ── viewer ── */}
        {viewer && (
          <div className="viewer-modal" onClick={() => { setViewer(null); setDocxEditMode(false); setDocxEditText(""); }}>
            <div className="viewer-content" onClick={e => e.stopPropagation()}>
              <div className="viewer-header">
                <span>{viewer.name}</span>
                <button className="close-btn" onClick={() => { setViewer(null); setDocxEditMode(false); setDocxEditText(""); }}>✕</button>
              </div>
              {viewer.type === "docx" && (
                <>
                  <div className="docx-toolbar">
                    <button className={`docx-tab-btn${!docxEditMode ? " active" : ""}`} onClick={() => setDocxEditMode(false)}>
                      <i className="fa-solid fa-eye"></i> View
                    </button>
                    <button className={`docx-tab-btn${docxEditMode ? " active" : ""}`} onClick={startDocxEdit}>
                      <i className="fa-solid fa-pen"></i> Edit
                    </button>
                    {docxEditMode && (
                      <button className="docx-save-btn" onClick={saveDocxEdit} disabled={docxSaving}>
                        {docxSaving ? <><i className="fa-solid fa-spinner fa-spin"></i> Saving</> : <><i className="fa-solid fa-floppy-disk"></i> Save</>}
                      </button>
                    )}
                  </div>
                  {docxEditMode
                    ? <textarea className="docx-edit-textarea" value={docxEditText} onChange={e => setDocxEditText(e.target.value)} spellCheck />
                    : <div ref={docxRef} className="docx-render-container" />
                  }
                </>
              )}
              {viewer.type?.startsWith("image/") && <img src={viewer.url} alt="preview" className="viewer-media" />}
              {viewer.type?.includes("pdf") && <iframe src={viewer.url} className="viewer-frame" title={viewer.name} />}
              {viewer.type?.startsWith("video/") && <video controls className="viewer-media"><source src={viewer.url} type={viewer.type} /></video>}
              {viewer.type?.startsWith("audio/") && <audio controls style={{width:"100%",marginTop:20}}><source src={viewer.url} type={viewer.type} /></audio>}
              {viewer.type?.startsWith("text/") && (
                <iframe src={viewer.url} className="viewer-frame" title={viewer.name} style={{background:"#fff"}} />
              )}
              {viewer.url && !viewer.type?.startsWith("image/") && !viewer.type?.includes("pdf") &&
               !viewer.type?.startsWith("video/") && !viewer.type?.startsWith("audio/") &&
               !viewer.type?.startsWith("text/") && (
                <div style={{textAlign:"center",padding:"40px 20px",color:"#9baabf"}}>
                  <i className="fa-solid fa-file" style={{fontSize:48,marginBottom:16,display:"block"}}></i>
                  <p style={{marginBottom:16}}>Preview not available for this file type.</p>
                  <a href={viewer.url} download={viewer.name} className="btn btn-primary btn-sm">
                    <i className="fa-solid fa-download"></i> Download to view
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── public link modal ── */}
        {linkModal && (
          <div className="viewer-modal" onClick={() => setLinkModal(null)}>
            <div className="link-modal" onClick={e => e.stopPropagation()}>
              <div className="viewer-header">
                <span><i className="fa-solid fa-link" style={{marginRight:8}}></i>Links — {linkModal.fileName}</span>
                <button className="close-btn" onClick={() => setLinkModal(null)}>✕</button>
              </div>
              <div className="link-create-row">
                <select className="inline-select" value={linkPerm} onChange={e => setLinkPerm(e.target.value)}>
                  <option value="VIEW">View only</option>
                  <option value="DOWNLOAD">View + Download</option>
                  {linkModal.isDocx && <option value="EDIT">View + Edit</option>}
                </select>
                <select className="inline-select" value={linkExpiry} onChange={e => setLinkExpiry(e.target.value)}>
                  <option value="">No expiry</option>
                  <option value="1">1 hour</option>
                  <option value="24">24 hours</option>
                  <option value="72">3 days</option>
                  <option value="168">7 days</option>
                </select>
                <button className="btn btn-primary btn-sm" onClick={createLink}><i className="fa-solid fa-plus"></i> Generate</button>
              </div>
              {linkModal.links.length === 0
                ? <p className="empty-msg">No active links.</p>
                : <div className="link-list">
                    {linkModal.links.map(link => (
                      <div key={link.token} className="link-item">
                        <div className="link-item-info">
                          <select
                            className="inline-select"
                            style={{fontSize:11,padding:"2px 6px"}}
                            value={link.permission}
                            onChange={e => updateLinkPermission(link.token, e.target.value)}
                          >
                            <option value="VIEW">VIEW</option>
                            <option value="DOWNLOAD">DOWNLOAD</option>
                            {linkModal.isDocx && <option value="EDIT">EDIT</option>}
                          </select>
                          <span className="link-url">{`${window.location.origin}/shared/${link.token}`}</span>
                          {link.expiresAt && <span className="link-expiry">Expires {new Date(link.expiresAt).toLocaleDateString()}</span>}
                        </div>
                        <div style={{display:"flex",gap:6}}>
                          <button className="btn btn-info btn-sm" onClick={() => copyLink(link.token)}><i className="fa-solid fa-copy"></i></button>
                          <button className="btn btn-danger btn-sm" onClick={() => revokeLink(link.token)}>Revoke</button>
                        </div>
                      </div>
                    ))}
                  </div>
              }
              <div className="link-email-row">
                <div className="link-email-label"><i className="fa-solid fa-envelope" style={{marginRight:6}}></i>Share via email</div>
                <div className="link-create-row" style={{marginTop:6}}>
                  <input className="inline-input" style={{flex:1}} type="email" placeholder="Recipient email"
                    value={linkEmailTo} onChange={e => setLinkEmailTo(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendLinkByEmail()} />
                  <select className="inline-select" value={linkEmailPerm} onChange={e => setLinkEmailPerm(e.target.value)}>
                    <option value="VIEW">View only</option>
                    <option value="DOWNLOAD">View + Download</option>
                    {linkModal.isDocx && <option value="EDIT">View + Edit</option>}
                  </select>
                  <button className="btn btn-primary btn-sm" disabled={linkEmailSending} onClick={sendLinkByEmail}>
                    {linkEmailSending ? <i className="fa-solid fa-spinner fa-spin"></i> : <><i className="fa-solid fa-paper-plane"></i> Send</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <Toast messages={messages} removeToast={removeToast} />
      </div>
    </Layout>
  );
}