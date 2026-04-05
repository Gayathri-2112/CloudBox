import { useEffect, useState, useRef } from "react";
import { renderAsync } from "docx-preview";
import API from "../api/axiosConfig";
import Layout from "../components/layout/Layout";
import Toast from "../components/common/Toast";
import { useToast } from "../hooks/useToast";
import { getDirectFileUrl } from "../utils/fileAccess";
import "../styles/collaboration.css";
import "../styles/style.css";

const currentUser = localStorage.getItem("email") || "";

function getFileIcon(name) {
  const n = (name || "").toLowerCase();
  if (/\.(jpg|jpeg|png|gif|webp)$/.test(n)) return { icon: "fa-image", color: "#0ea5e9" };
  if (/\.(mp4|mkv|avi|mov|webm)$/.test(n)) return { icon: "fa-film", color: "#8b5cf6" };
  if (/\.(mp3|wav|ogg|flac)$/.test(n)) return { icon: "fa-music", color: "#ec4899" };
  if (/\.(pdf)$/.test(n)) return { icon: "fa-file-pdf", color: "#ef4444" };
  if (/\.(doc|docx)$/.test(n)) return { icon: "fa-file-word", color: "#2563eb" };
  if (/\.(xls|xlsx)$/.test(n)) return { icon: "fa-file-excel", color: "#16a34a" };
  return { icon: "fa-file-lines", color: "#6b7280" };
}

function getInitials(email) {
  return (email || "?").split("@")[0].slice(0, 2).toUpperCase();
}

function getAvatarColor(email) {
  const palette = ["#4285f4", "#16a34a", "#8b5cf6", "#ec4899", "#f59e0b", "#0ea5e9", "#ef4444"];
  let h = 0;
  for (let i = 0; i < (email || "").length; i++) h = (email.charCodeAt(i) + ((h << 5) - h)) | 0;
  return palette[Math.abs(h) % palette.length];
}

function relTime(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return Math.floor(diff / 60000) + "m ago";
  if (diff < 86400000) return Math.floor(diff / 3600000) + "h ago";
  return new Date(ts).toLocaleDateString();
}

export default function Collaboration() {
  const { messages, removeToast, toast } = useToast();
  const [files, setFiles] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState("");
  const [comments,       setComments]       = useState([]);
  const [message,        setMessage]        = useState("");
  const [search,         setSearch]         = useState("");
  const [sending,        setSending]        = useState(false);
  const [viewer,         setViewer]         = useState(null);
  const [docxEditMode,   setDocxEditMode]   = useState(false);
  const [docxEditText,   setDocxEditText]   = useState("");
  const [docxSaving,     setDocxSaving]     = useState(false);
  const [selectedComment, setSelectedComment] = useState(null); // WhatsApp-style selection
  const bottomRef    = useRef(null);
  const docxRef      = useRef(null);

  useEffect(() => { fetchFiles(); }, []);

  useEffect(() => {
    if (selectedFileId) fetchComments(selectedFileId);
    else setComments([]);
  }, [selectedFileId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  async function fetchFiles() {
    try {
      const res = await API.get("/files/collaboration");
      setFiles(res.data);
      if (res.data.length > 0) setSelectedFileId(String(res.data[0].fileId));
    } catch {
      toast.error("Failed to load collaboration files");
    }
  }

  async function fetchComments(fileId) {
    try {
      const res = await API.get(`/files/collaboration/${fileId}/comments`);
      setComments(res.data);
    } catch {
      toast.error("Failed to load comments");
    }
  }

  async function sendComment() {
    if (!selectedFileId) { toast.warning("Select a file first"); return; }
    if (!message.trim()) return;
    setSending(true);
    try {
      await API.post("/files/collaboration/comment", {
        fileId: Number(selectedFileId),
        message: message.trim(),
      });
      setMessage("");
      fetchComments(selectedFileId);
    } catch (err) {
      toast.error(err.response?.data || "Failed to send");
    } finally {
      setSending(false);
    }
  }

  function onKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendComment(); }
  }

  async function deleteComment(commentId) {
    try {
      await API.delete(`/files/collaboration/comment/${commentId}`);
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success("Comment deleted");
    } catch {
      toast.error("Failed to delete comment");
    }
  }

  async function viewFile(file) {
    const isDocx = /\.(doc|docx)$/i.test(file.fileName);
    const canEdit = file.accessType === "OWNER" || file.permission === "EDIT";
    try {
      const res = await API.get(`/files/preview/${file.fileId}`, { responseType: "arraybuffer" });
      if (isDocx) {
        setDocxEditMode(false);
        setDocxEditText("");
        setViewer({ type: "docx", name: file.fileName, fileId: file.fileId, arrayBuffer: res.data, canEdit });
      } else {
        const mimeType = file.fileType || "application/octet-stream";
        const blob = new Blob([res.data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        setViewer({ type: mimeType, name: file.fileName, url, blobUrl: true });
      }
    } catch {
      toast.error("Failed to open file");
    }
  }

  async function startDocxEdit() {
    if (!viewer?.fileId) return;
    if (docxEditText) { setDocxEditMode(true); return; }
    try {
      const res = await API.get(`/files/docx-text/${viewer.fileId}`);
      setDocxEditText(res.data.text || "");
      setDocxEditMode(true);
    } catch {
      toast.error("Failed to load document text");
    }
  }

  async function saveDocxEdit() {
    if (!viewer?.fileId) return;
    setDocxSaving(true);
    try {
      await API.put(`/files/docx-text/${viewer.fileId}`, { text: docxEditText });
      toast.success("Document saved");
      const res = await API.get(`/files/preview/${viewer.fileId}`, { responseType: "arraybuffer" });
      setDocxEditText("");
      setDocxEditMode(false);
      setViewer(prev => ({ ...prev, arrayBuffer: res.data }));
    } catch (err) {
      toast.error(err.response?.data || "Failed to save");
    } finally {
      setDocxSaving(false);
    }
  }

  function closeViewer() {
    if (viewer?.blobUrl && viewer?.url) URL.revokeObjectURL(viewer.url);
    setViewer(null);
    setDocxEditMode(false);
    setDocxEditText("");
  }

  // render docx when viewer opens or switches back to view mode
  useEffect(() => {
    if (viewer?.type === "docx" && viewer.arrayBuffer && docxRef.current && !docxEditMode) {
      docxRef.current.innerHTML = "";
      renderAsync(viewer.arrayBuffer, docxRef.current).catch(() => toast.error("Failed to render document"));
    }
  }, [viewer, docxEditMode]);

  const visibleFiles = files.filter(f => f.fileName.toLowerCase().includes(search.toLowerCase()));
  const selectedFile = files.find(f => String(f.fileId) === selectedFileId);
  const selFi = selectedFile ? getFileIcon(selectedFile.fileName) : { icon: "fa-file", color: "#6b7280" };

  return (
    <Layout type="user">
      <div className="content">

        {/* ── page header ── */}
        <div className="cb-page-header">
          <div>
            <h2 className="page-heading" style={{ margin: 0 }}>Collaboration</h2>
            <p className="cb-page-sub">Discuss and comment on shared files</p>
          </div>
          <div className="cb-header-pills">
            <span className="cb-pill"><i className="fa-solid fa-file-circle-check"></i>{files.length} file{files.length !== 1 ? "s" : ""}</span>
            <span className="cb-pill"><i className="fa-solid fa-comments"></i>{comments.length} comment{comments.length !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* ── empty state ── */}
        {files.length === 0 ? (
          <div className="cb-empty-state">
            <div className="cb-empty-icon"><i className="fa-solid fa-users"></i></div>
            <h3>No collaboration files yet</h3>
            <p>Share a file with someone to start collaborating.</p>
          </div>
        ) : (
          <div className="cb-layout">

            {/* ════ SIDEBAR ════ */}
            <aside className="cb-sidebar">
              <div className="cb-sidebar-head">
                <span>Files</span>
                <span className="cb-count">{files.length}</span>
              </div>

              <div className="cb-sidebar-search">
                <i className="fa-solid fa-magnifying-glass"></i>
                <input
                  placeholder="Search files…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <div className="cb-file-list">
                {visibleFiles.map(file => {
                  const fi = getFileIcon(file.fileName);
                  const active = String(file.fileId) === selectedFileId;
                  return (
                    <div
                      key={file.fileId}
                      className={`cb-file-item${active ? " active" : ""}`}
                      onClick={() => setSelectedFileId(String(file.fileId))}
                    >
                      <div className="cb-file-icon" style={{ background: fi.color + "1a", color: fi.color }}>
                        <i className={`fa-solid ${fi.icon}`}></i>
                      </div>
                      <div className="cb-file-info">
                        <div className="cb-file-name">{file.fileName}</div>
                        <div className="cb-file-meta">
                          {file.accessType === "OWNER" ? "You own this" : file.ownerEmail}
                        </div>
                      </div>
                      <span className={`cb-tag ${file.accessType === "OWNER" ? "tag-own" : "tag-shared"}`}>
                        {file.accessType === "OWNER" ? "Owner" : "Shared"}
                      </span>
                    </div>
                  );
                })}
                {visibleFiles.length === 0 && <p className="cb-no-results">No files found</p>}
              </div>
            </aside>

            {/* ════ MAIN ════ */}
            <div className="cb-main">

              {/* info bar */}
              {selectedFile && (
                <div className="cb-info-bar">
                  <div className="cb-info-icon" style={{ background: selFi.color + "1a", color: selFi.color }}>
                    <i className={`fa-solid ${selFi.icon}`}></i>
                  </div>
                  <div className="cb-info-text">
                    <div className="cb-info-name">{selectedFile.fileName}</div>
                    <div className="cb-info-meta">
                      Owner: <strong>{selectedFile.ownerEmail}</strong>
                      &nbsp;·&nbsp;
                      Permission: <strong>{selectedFile.permission}</strong>
                    </div>
                  </div>
                  <button
                    className="cb-view-btn"
                    onClick={() => viewFile(selectedFile)}
                    title="View file"
                  >
                    <i className="fa-solid fa-eye" /> View File
                  </button>
                </div>
              )}

              {/* messages */}
              <div className="cb-messages" onClick={() => setSelectedComment(null)}>
                {comments.length === 0 ? (
                  <div className="cb-no-chat">
                    <div className="cb-no-chat-icon"><i className="fa-regular fa-comment-dots"></i></div>
                    <p>No comments yet</p>
                    <small>Be the first to start the conversation</small>
                  </div>
                ) : (
                  comments.map((c, idx) => {
                    const isMe = c.userEmail === currentUser;
                    const canDelete = isMe || selectedFile?.accessType === "OWNER";
                    const showHead = idx === 0 || comments[idx - 1].userEmail !== c.userEmail;
                    const avatarBg = getAvatarColor(c.userEmail);
                    const isSelected = selectedComment === c.id;
                    return (
                      <div
                        key={c.id}
                        className={`cb-row${isMe ? " cb-row-me" : " cb-row-other"}${isSelected ? " cb-row-selected" : ""}`}
                        onClick={e => { e.stopPropagation(); setSelectedComment(isSelected ? null : c.id); }}
                      >
                        {!isMe && (
                          <div className="cb-avatar" style={{ background: avatarBg, opacity: showHead ? 1 : 0 }}>
                            {getInitials(c.userEmail)}
                          </div>
                        )}
                        <div className="cb-group">
                          {showHead && !isMe && <div className="cb-sender">{c.userEmail}</div>}
                          <div className={`cb-bubble${isMe ? " cb-bubble-me" : " cb-bubble-other"}`}>
                            {c.message}
                          </div>
                          <div className={`cb-time${isMe ? " cb-time-me" : ""}`}>{relTime(c.createdAt)}</div>
                          {isSelected && canDelete && (
                            <div className={`cb-action-bar${isMe ? " cb-action-bar-me" : ""}`}>
                              <button
                                className="cb-action-delete"
                                onClick={e => { e.stopPropagation(); deleteComment(c.id); setSelectedComment(null); }}
                              >
                                <i className="fa-solid fa-trash-can"></i> Delete
                              </button>
                            </div>
                          )}
                        </div>
                        {isMe && (
                          <div className="cb-avatar cb-avatar-me" style={{ background: avatarBg, opacity: showHead ? 1 : 0 }}>
                            {getInitials(c.userEmail)}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* composer */}
              <div className="cb-composer">
                <div className="cb-composer-box">
                  <textarea
                    className="cb-composer-input"
                    rows={1}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onKeyDown={onKey}
                    placeholder="Write a comment… (Enter to send)"
                  />
                  <button
                    className={`cb-send${message.trim() ? " cb-send-active" : ""}`}
                    onClick={sendComment}
                    disabled={sending || !message.trim()}
                  >
                    {sending
                      ? <i className="fa-solid fa-spinner fa-spin"></i>
                      : <i className="fa-solid fa-paper-plane"></i>
                    }
                  </button>
                </div>
                <div className="cb-hint">
                  <i className="fa-solid fa-circle-info"></i>
                  <kbd>Enter</kbd> to send &nbsp;·&nbsp; <kbd>Shift+Enter</kbd> for new line
                </div>
              </div>

            </div>
          </div>
        )}

        <Toast messages={messages} removeToast={removeToast} />

        {/* ── File Viewer Modal ── */}
        {viewer && (
          <div className="viewer-modal" onClick={closeViewer}>
            <div className="viewer-content" onClick={e => e.stopPropagation()}>
              <div className="viewer-header">
                <span>{viewer.name}</span>
                <button className="close-btn" onClick={closeViewer}>✕</button>
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
                    {viewer.canEdit && (
                      <button
                        className={`docx-tab-btn${docxEditMode ? " active" : ""}`}
                        onClick={startDocxEdit}
                      >
                        <i className="fa-solid fa-pen"></i> Edit
                      </button>
                    )}
                    {docxEditMode && (
                      <button className="docx-save-btn" onClick={saveDocxEdit} disabled={docxSaving}>
                        {docxSaving
                          ? <><i className="fa-solid fa-spinner fa-spin"></i> Saving…</>
                          : <><i className="fa-solid fa-floppy-disk"></i> Save</>
                        }
                      </button>
                    )}
                  </div>
                  {docxEditMode
                    ? <textarea className="docx-edit-textarea" value={docxEditText} onChange={e => setDocxEditText(e.target.value)} spellCheck />
                    : <div ref={docxRef} className="docx-render-container" />
                  }
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
                <audio controls style={{ width: "100%", marginTop: 20 }}>
                  <source src={viewer.url} type={viewer.type} />
                </audio>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
