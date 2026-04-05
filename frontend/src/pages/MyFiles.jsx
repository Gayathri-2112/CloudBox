import { useEffect, useState, useMemo, useRef } from "react";
import { renderAsync } from "docx-preview";
import API from "../api/axiosConfig";
import Layout from "../components/layout/Layout";
import Toast from "../components/common/Toast";
import { useToast } from "../hooks/useToast";
import { useSearch } from "../context/SearchContext";
import { getDirectFileUrl, triggerDownload } from "../utils/fileAccess";
import ShareModal from "../components/ShareModal";
import "../styles/style.css";
import "../components/layout/layout.css";
import "../components/common/card.css";

const CATEGORIES = ["All", "Starred", "Documents", "Images", "Videos", "Audio", "Other"];

function getCategory(file) {
  const name = file.fileName?.toLowerCase() || "";
  const type = file.fileType?.toLowerCase() || "";
  if (type.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg)$/.test(name)) return "Images";
  if (type.startsWith("video/") || /\.(mp4|mkv|avi|mov|webm)$/.test(name)) return "Videos";
  if (type.startsWith("audio/") || /\.(mp3|wav|ogg|flac)$/.test(name)) return "Audio";
  if (type.includes("pdf") || type.includes("word") || type.includes("document") ||
    /\.(pdf|doc|docx|txt|xls|xlsx|ppt|pptx|csv)$/.test(name)) return "Documents";
  return "Other";
}

function getFileIcon(file) {
  const cat = getCategory(file);
  if (cat === "Images") return "fa-image";
  if (cat === "Videos") return "fa-film";
  if (cat === "Audio") return "fa-music";
  if (cat === "Documents") {
    if (/\.(pdf)$/i.test(file.fileName)) return "fa-file-pdf";
    if (/\.(doc|docx)$/i.test(file.fileName)) return "fa-file-word";
    if (/\.(xls|xlsx)$/i.test(file.fileName)) return "fa-file-excel";
    return "fa-file-lines";
  }
  return "fa-file";
}

function formatSize(bytes) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(1) + " " + sizes[i];
}

function MyFiles() {
  const { messages, removeToast, toast } = useToast();
  const { setQuery } = useSearch();

  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState(["root"]);
  const [moveFolder, setMoveFolder] = useState({});
  const [localSearch, setLocalSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [viewer, setViewer] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareModalFile, setShareModalFile] = useState(null);
  const [docxEditMode, setDocxEditMode] = useState(false);
  const [docxEditText, setDocxEditText] = useState("");
  const [docxSaving, setDocxSaving] = useState(false);
  const [linkModal, setLinkModal] = useState(null); // { fileId, fileName, links:[] }
  const [linkPerm, setLinkPerm] = useState("VIEW");
  const [linkExpiry, setLinkExpiry] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [renameId, setRenameId] = useState(null);
  const [renameName, setRenameName] = useState("");

  // use only local search — global header search is for navigation, not filtering
  const search = localSearch;

  const fetchFiles = async () => {
    try {
      const res = await API.get("/files");
      setFiles(res.data);
    } catch {
      toast.error("Failed to load files");
    }
  };

  const fetchFolders = async () => {
    try {
      const res = await API.get("/files/folders");
      setFolders(res.data);
    } catch { }
  };

  useEffect(() => {
    setQuery(""); // clear any leftover global search
    fetchFiles();
    fetchFolders();
  }, []);

  const filtered = useMemo(() => {
    let result = files.filter((f) => {
      const matchSearch = f.fileName.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === "All"
        || (category === "Starred" && f.starred)
        || (category !== "Starred" && getCategory(f) === category);
      return matchSearch && matchCat;
    });
    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name") cmp = a.fileName.localeCompare(b.fileName);
      else if (sortBy === "size") cmp = (a.fileSize || 0) - (b.fileSize || 0);
      else cmp = new Date(a.uploadedAt || 0) - new Date(b.uploadedAt || 0);
      return sortOrder === "asc" ? cmp : -cmp;
    });
    return result;
  }, [files, search, category, sortBy, sortOrder]);

  const deleteFile = async (id) => {
    try {
      await API.delete(`/files/${id}`);
      fetchFiles();
      toast.success("File deleted");
    } catch (err) {
      toast.error(err.response?.data || "Delete failed");
    } finally {
      setConfirmDelete(null);
    }
  };

  const downloadFile = async (file) => {
    try {
      const directUrl = getDirectFileUrl(file);
      if (!directUrl) {
        throw new Error("Missing file URL");
      }
      triggerDownload(directUrl, file.fileName);
    } catch {
      toast.error("Download failed");
    }
  };

  const viewFile = async (file) => {
    const isDocx = /\.(doc|docx)$/i.test(file.fileName);
    if (isDocx) {
      try {
        const res = await API.get(`/files/preview/${file.id}`, { responseType: "arraybuffer" });
        setDocxEditMode(false);
        setDocxEditText("");
        setViewer({ type: "docx", name: file.fileName, fileId: file.id, arrayBuffer: res.data, isOwner: true });
      } catch (e) {

        toast.error(e + "Failed to open document");
      }
      return;
    }
    try {
      const directUrl = getDirectFileUrl(file);
      console.log(file);
      if (!directUrl) {
        throw new Error("Missing file URL");
      }
      setViewer({ url: directUrl, type: file.fileType || "application/octet-stream", name: file.fileName });
    } catch (e) {
      toast.error(e + "Failed to open file");
    }
  };

  const startDocxEdit = async () => {
    if (!viewer?.fileId) return;
    // if text already loaded, just switch mode
    if (docxEditText) { setDocxEditMode(true); return; }
    try {
      const res = await API.get(`/files/docx-text/${viewer.fileId}`);
      setDocxEditText(res.data.text || "");
      setDocxEditMode(true);
    } catch {
      toast.error("Failed to load document text");
    }
  };

  const saveDocxEdit = async () => {
    if (!viewer?.fileId) return;
    setDocxSaving(true);
    try {
      await API.put(`/files/docx-text/${viewer.fileId}`, { text: docxEditText });
      toast.success("Document saved");
      // refresh preview with updated content
      const res = await API.get(`/files/preview/${viewer.fileId}`, { responseType: "arraybuffer" });
      setDocxEditText(""); // clear so next edit re-fetches
      setDocxEditMode(false);
      setViewer((prev) => ({ ...prev, arrayBuffer: res.data }));
    } catch (err) {
      toast.error(err.response?.data || "Failed to save document");
    } finally {
      setDocxSaving(false);
    }
  };

  // Render docx when switching back to view mode or when viewer first opens
  const docxContainerRef = useRef(null);

  const setDocxContainerRef = (node) => {
    docxContainerRef.current = node;
    if (node && viewer?.type === "docx" && viewer.arrayBuffer) {
      node.innerHTML = "";
      renderAsync(viewer.arrayBuffer, node).catch(() =>
        toast.error("Failed to render document")
      );
    }
  };

  useEffect(() => {
    if (viewer?.type === "docx" && viewer.arrayBuffer && docxContainerRef.current && !docxEditMode) {
      docxContainerRef.current.innerHTML = "";
      renderAsync(viewer.arrayBuffer, docxContainerRef.current).catch(() =>
        toast.error("Failed to render document")
      );
    }
  }, [viewer, docxEditMode]);

  const moveFile = async (fileId) => {
    const targetFolder = moveFolder[fileId];
    if (!targetFolder) { toast.warning("Select a target folder"); return; }
    try {
      await API.put("/files/move", { fileId, targetFolder });
      fetchFiles();
      toast.success("File moved");
    } catch (err) {
      toast.error(err.response?.data || "Failed to move file");
    }
  };

  const openLinkModal = async (file) => {
    try {
      const res = await API.get(`/public/links/${file.id}`);
      setLinkModal({ fileId: file.id, fileName: file.fileName, links: res.data });
      setLinkPerm("VIEW");
      setLinkExpiry("");
    } catch {
      setLinkModal({ fileId: file.id, fileName: file.fileName, links: [] });
    }
  };

  const createPublicLink = async () => {
    try {
      const body = { fileId: linkModal.fileId, permission: linkPerm };
      if (linkExpiry) body.expiryHours = parseInt(linkExpiry);
      await API.post("/public/link", body);
      const res = await API.get(`/public/links/${linkModal.fileId}`);
      setLinkModal(prev => ({ ...prev, links: res.data }));
      toast.success("Link created");
    } catch (err) {
      toast.error(err.response?.data || "Failed to create link");
    }
  };

  const revokePublicLink = async (token) => {
    try {
      await API.delete(`/public/link/${token}`);
      setLinkModal(prev => ({ ...prev, links: prev.links.filter(l => l.token !== token) }));
      toast.success("Link revoked");
    } catch {
      toast.error("Failed to revoke link");
    }
  };

  const copyLink = (token) => {
    const url = `${window.location.origin}/shared/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  const toggleStar = async (file) => {
    try {
      await API.put(`/files/${file.id}/star`);
      setFiles(prev => prev.map(f => f.id === file.id ? { ...f, starred: !f.starred } : f));
    } catch {
      toast.error("Failed to update star");
    }
  };

  const trashFile = async (id) => {
    try {
      await API.put(`/files/${id}/trash`);
      setFiles(prev => prev.filter(f => f.id !== id));
      toast.success("Moved to trash");
    } catch (err) {
      toast.error(err.response?.data || "Failed to move to trash");
    } finally {
      setConfirmDelete(null);
    }
  };

  const startRename = (file) => {
    setRenameId(file.id);
    setRenameName(file.fileName);
  };

  const submitRename = async (id) => {
    if (!renameName.trim()) return;
    try {
      await API.put(`/files/${id}/rename`, { newName: renameName.trim() });
      setFiles(prev => prev.map(f => f.id === id ? { ...f, fileName: renameName.trim() } : f));
      toast.success("File renamed");
    } catch (err) {
      toast.error(err.response?.data || "Rename failed");
    } finally {
      setRenameId(null);
    }
  };

  return (
    <Layout type="user">
      <div className="content">
        <h2 className="page-heading">My Files</h2>

        {/* Search + Filter Bar */}
        <div className="files-toolbar">
          <div className="search-box">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input
              type="text"
              placeholder="Search files..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
          </div>
          <div className="category-tabs">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`cat-tab ${category === cat ? "active" : ""}`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="sort-controls">
            <select className="inline-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="date">Date</option>
              <option value="name">Name</option>
              <option value="size">Size</option>
            </select>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setSortOrder(o => o === "asc" ? "desc" : "asc")}
              title="Toggle sort order"
            >
              <i className={`fa-solid fa-arrow-${sortOrder === "asc" ? "up" : "down"}`}></i>
            </button>
          </div>
        </div>

        <div className="page-card">
          {filtered.length === 0 && (
            <p className="empty-msg">
              {files.length === 0 ? "No files uploaded yet" : "No files match your search"}
            </p>
          )}

          {filtered.map((file) => (
            <div key={file.id} className="file-row">
              <div className="file-row-left">
                <i className={`fa-solid ${getFileIcon(file)} file-type-icon`}></i>
                <div>
                  {renameId === file.id ? (
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <input
                        className="yc-input"
                        style={{ padding: "2px 8px", fontSize: 13 }}
                        value={renameName}
                        onChange={e => setRenameName(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") submitRename(file.id); if (e.key === "Escape") setRenameId(null); }}
                        autoFocus
                      />
                      <button className="btn btn-success btn-sm" onClick={() => submitRename(file.id)}>✓</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setRenameId(null)}>✕</button>
                    </div>
                  ) : (
                    <div className="file-row-name">{file.fileName}</div>
                  )}
                  <div className="file-row-meta">
                    {formatSize(file.fileSize)} &bull; {file.folder || "root"} &bull;{" "}
                    {new Date(file.uploadedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="file-row-actions">
                <button
                  className="btn btn-sm"
                  style={{ color: file.starred ? "#f59e0b" : "#9ca3af", background: "transparent", border: "1px solid #e5e7eb" }}
                  onClick={() => toggleStar(file)}
                  title={file.starred ? "Unstar" : "Star"}
                >
                  <i className={`fa-${file.starred ? "solid" : "regular"} fa-star`}></i>
                </button>

                <button className="btn btn-secondary btn-sm" onClick={() => startRename(file)} title="Rename">
                  <i className="fa-solid fa-pencil"></i>
                </button>

                <button
                  className="btn btn-share btn-sm"
                  onClick={() => {
                    setShareModalFile(file);
                    setShareModalOpen(true);
                  }}
                >
                  <i className="fa-solid fa-share-alt"></i> Share
                </button>

                <select
                  value={moveFolder[file.id] || file.folder || "root"}
                  onChange={(e) => setMoveFolder((prev) => ({ ...prev, [file.id]: e.target.value }))}
                  className="inline-select"
                >
                  {folders.map((f) => (
                    <option key={f} value={f}>Move to {f}</option>
                  ))}
                </select>
                <button className="btn btn-warning btn-sm" onClick={() => moveFile(file.id)}>Move</button>

                <button className="btn btn-info btn-sm" onClick={() => viewFile(file)}>View</button>
                <button className="btn btn-success btn-sm" onClick={() => downloadFile(file)}>Download</button>
                <button className="btn btn-secondary btn-sm" onClick={() => openLinkModal(file)}>
                  <i className="fa-solid fa-link"></i> Link
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(file.id)}>
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Inline confirm delete */}
        {confirmDelete && (
          <div className="viewer-modal" onClick={() => setConfirmDelete(null)}>
            <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
              <i className="fa-solid fa-triangle-exclamation confirm-icon"></i>
              <h3>Move to Trash?</h3>
              <p>You can restore it from the Trash page.</p>
              <div className="confirm-actions">
                <button className="btn btn-danger" onClick={() => trashFile(confirmDelete)}>Move to Trash</button>
                <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Viewer Modal */}
        {viewer && (
          <div className="viewer-modal" onClick={() => { setViewer(null); setDocxEditMode(false); setDocxEditText(""); }}>
            <div className="viewer-content" onClick={(e) => e.stopPropagation()}>
              <div className="viewer-header">
                <span>{viewer.name}</span>
                <button className="close-btn" onClick={() => { setViewer(null); setDocxEditMode(false); setDocxEditText(""); }}>✕</button>
              </div>

              {viewer.type === "docx" && (
                <>
                  <div className="docx-toolbar">
                    <button
                      className={`docx-tab-btn${!docxEditMode ? " active" : ""}`}
                      onClick={() => setDocxEditMode(false)}
                    >
                      <i className="fa-solid fa-eye"></i> View
                    </button>
                    <button
                      className={`docx-tab-btn${docxEditMode ? " active" : ""}`}
                      onClick={startDocxEdit}
                    >
                      <i className="fa-solid fa-pen"></i> Edit
                    </button>
                    {docxEditMode && (
                      <button
                        className="docx-save-btn"
                        onClick={saveDocxEdit}
                        disabled={docxSaving}
                      >
                        {docxSaving
                          ? <><i className="fa-solid fa-spinner fa-spin"></i> Saving…</>
                          : <><i className="fa-solid fa-floppy-disk"></i> Save</>
                        }
                      </button>
                    )}
                  </div>
                  {docxEditMode ? (
                    <textarea
                      className="docx-edit-textarea"
                      value={docxEditText}
                      onChange={(e) => setDocxEditText(e.target.value)}
                      spellCheck
                    />
                  ) : (
                    <div ref={setDocxContainerRef} className="docx-render-container" />
                  )}
                </>
              )}
              {viewer.type?.startsWith("image/") && (
                <img src={viewer.url} alt="preview" className="viewer-media" />
              )}
              {viewer.type === "application/pdf" && (
                <iframe src={viewer.url} className="viewer-frame" title={viewer.name} />
              )}
              {viewer.type?.startsWith("video/") && (
                <video controls className="viewer-media">
                  <source src={viewer.url} type={viewer.type} />
                </video>
              )}
              {viewer.type?.startsWith("audio/") && (
                <audio controls style={{ width: "100%", marginTop: "20px" }}>
                  <source src={viewer.url} type={viewer.type} />
                </audio>
              )}
              {viewer.type && viewer.type !== "docx" &&
                !viewer.type.startsWith("image/") &&
                viewer.type !== "application/pdf" &&
                !viewer.type.startsWith("video/") &&
                !viewer.type.startsWith("audio/") && (
                  <div style={{ padding: "40px", textAlign: "center" }}>
                    <p>Preview not available for this file type.</p>
                    <a href={viewer.url} download={viewer.name} className="btn btn-primary">Download</a>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Public Link Modal */}
        {linkModal && (
          <div className="viewer-modal" onClick={() => setLinkModal(null)}>
            <div className="link-modal" onClick={e => e.stopPropagation()}>
              <div className="viewer-header">
                <span><i className="fa-solid fa-link" style={{ marginRight: 8 }}></i>Public Links — {linkModal.fileName}</span>
                <button className="close-btn" onClick={() => setLinkModal(null)}>✕</button>
              </div>

              <div className="link-create-row">
                <select className="inline-select" value={linkPerm} onChange={e => setLinkPerm(e.target.value)}>
                  <option value="VIEW">View only</option>
                  <option value="DOWNLOAD">View + Download</option>
                </select>
                <select className="inline-select" value={linkExpiry} onChange={e => setLinkExpiry(e.target.value)}>
                  <option value="">No expiry</option>
                  <option value="1">1 hour</option>
                  <option value="24">24 hours</option>
                  <option value="72">3 days</option>
                  <option value="168">7 days</option>
                </select>
                <button className="btn btn-primary btn-sm" onClick={createPublicLink}>
                  <i className="fa-solid fa-plus"></i> Generate Link
                </button>
              </div>

              {linkModal.links.length === 0 ? (
                <p className="empty-msg">No active links. Generate one above.</p>
              ) : (
                <div className="link-list">
                  {linkModal.links.map(link => {
                    const url = `${window.location.origin}/shared/${link.token}`;
                    return (
                      <div key={link.token} className="link-item">
                        <div className="link-item-info">
                          <span className={`share-perm-badge perm-${link.permission?.toLowerCase()}`}>{link.permission}</span>
                          <span className="link-url">{url}</span>
                          {link.expiresAt && (
                            <span className="link-expiry">Expires {new Date(link.expiresAt).toLocaleDateString()}</span>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="btn btn-info btn-sm" onClick={() => copyLink(link.token)}>
                            <i className="fa-solid fa-copy"></i> Copy
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => revokePublicLink(link.token)}>
                            Revoke
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        <Toast messages={messages} removeToast={removeToast} />

        {shareModalFile && (
          <ShareModal
            file={shareModalFile}
            isOpen={shareModalOpen}
            onClose={() => {
              setShareModalOpen(false);
              setShareModalFile(null);
            }}
            onShareSuccess={() => {
              fetchFiles();
            }}
          />
        )}
      </div>
    </Layout>
  );
}

export default MyFiles;