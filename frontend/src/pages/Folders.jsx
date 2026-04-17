import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axiosConfig";
import Layout from "../components/layout/Layout";
import Toast from "../components/common/Toast";
import { useToast } from "../hooks/useToast";
import { getRequestErrorMessage } from "../utils/requestErrors";
import "../styles/folders.css";
import "../styles/style.css";

function Folders() {
  const { messages, removeToast, toast } = useToast();
  const navigate = useNavigate();

  const [folders, setFolders] = useState([]);
  const [folderFiles, setFolderFiles] = useState({});
  const [expandedFolder, setExpanded] = useState(null);
  const [newFolder, setNewFolder] = useState("");
  const [creating, setCreating] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameName, setRenameName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchFolders = useCallback(async () => {
    try {
      const res = await API.get("/files/folders");
      setFolders(res.data);
    } catch (error) { toast.error(getRequestErrorMessage(error, "Failed to load folders")); }
  }, [toast]);

  useEffect(() => { fetchFolders(); }, [fetchFolders]);

  const handleFolderClick = async (name) => {
    if (expandedFolder === name) { setExpanded(null); return; }
    setExpanded(name);
    if (folderFiles[name] !== undefined) return;
    try {
      const res = await API.get("/files");
      const filtered = res.data.filter(f => (f.folder || "root") === name);
      setFolderFiles(prev => ({ ...prev, [name]: filtered }));
    } catch (error) { toast.error(getRequestErrorMessage(error, "Failed to load files")); }
  };

  const createFolder = async () => {
    const name = newFolder.trim();
    if (!name) { toast.warning("Enter a folder name"); return; }
    setCreating(true);
    try {
      await API.post("/files/folders", { name });
      setNewFolder("");
      toast.success(`Folder "${name}" created`);
      fetchFolders();
    } catch (err) {
      toast.error(getRequestErrorMessage(err, "Failed to create folder"));
    } finally { setCreating(false); }
  };

  const submitRename = async () => {
    const newName = renameName.trim();
    if (!newName || newName === renameTarget) { setRenameTarget(null); return; }
    try {
      await API.put("/files/folders/rename", { oldName: renameTarget, newName });
      toast.success("Folder renamed");
      setRenameTarget(null);
      setRenameName("");
      setFolderFiles({});
      fetchFolders();
    } catch (err) { toast.error(getRequestErrorMessage(err, "Rename failed")); }
  };

  const deleteFolder = async () => {
    try {
      await API.delete(`/files/folders/${encodeURIComponent(confirmDelete)}`);
      toast.success(`Folder "${confirmDelete}" deleted`);
      setConfirmDelete(null);
      setFolderFiles({});
      fetchFolders();
    } catch (err) { toast.error(getRequestErrorMessage(err, "Delete failed")); }
  };

  const getFileIcon = (fileName) => {
    const n = fileName?.toLowerCase() || "";
    if (/\.(jpg|jpeg|png|gif|webp|svg)$/.test(n)) return "fa-image";
    if (/\.(mp4|mkv|avi|mov|webm)$/.test(n)) return "fa-film";
    if (/\.(mp3|wav|ogg|flac)$/.test(n)) return "fa-music";
    if (/\.(pdf)$/.test(n)) return "fa-file-pdf";
    if (/\.(doc|docx)$/.test(n)) return "fa-file-word";
    if (/\.(xls|xlsx)$/.test(n)) return "fa-file-excel";
    return "fa-file-lines";
  };

  return (
    <Layout type="user">
      <div className="fld-page">

        {/* ── PAGE HEADER ── */}
        <div className="fld-header">
          <div>
            <h2 className="fld-title">My Folders</h2>
            <p className="fld-sub">{folders.length} folder{folders.length !== 1 ? "s" : ""}</p>
          </div>

          {/* Create input */}
          <div className="fld-create-box">
            <i className="fa-solid fa-folder-plus fld-create-icon" />
            <input
              className="fld-create-input"
              placeholder="New folder name…"
              value={newFolder}
              onChange={e => setNewFolder(e.target.value)}
              onKeyDown={e => e.key === "Enter" && createFolder()}
            />
            <button
              className="fld-create-btn"
              onClick={createFolder}
              disabled={creating}
            >
              {creating ? "Creating…" : "Create"}
            </button>
          </div>
        </div>

        {/* ── FOLDER GRID ── */}
        {folders.length === 0
          ? <div className="fld-empty"><i className="fa-solid fa-folder-open" /><p>No folders yet. Create one above.</p></div>
          : (
            <div className="fld-grid">
              {folders.map(folder => (
                <div
                  key={folder}
                  className={`fld-card${expandedFolder === folder ? " fld-card-open" : ""}`}
                >
                  {/* card top */}
                  <div className="fld-card-top" onClick={() => handleFolderClick(folder)}>
                    <div className="fld-card-icon">
                      <i className={`fa-solid ${expandedFolder === folder ? "fa-folder-open" : "fa-folder"}`} />
                    </div>
                    <div className="fld-card-info">
                      <span className="fld-card-name">{folder}</span>
                      <span className="fld-card-count">
                        {folderFiles[folder] !== undefined
                          ? `${folderFiles[folder].length} file${folderFiles[folder].length !== 1 ? "s" : ""}`
                          : "Click to view"}
                      </span>
                    </div>
                    <i className={`fa-solid fa-chevron-${expandedFolder === folder ? "up" : "down"} fld-chevron`} />
                  </div>

                  {/* action buttons */}
                  {folder !== "root" && (
                    <div className="fld-card-actions">
                      <button
                        className="fld-action-btn fld-rename"
                        title="Rename"
                        onClick={e => { e.stopPropagation(); setRenameTarget(folder); setRenameName(folder); }}
                      >
                        <i className="fa-solid fa-pen" />
                      </button>
                      <button
                        className="fld-action-btn fld-delete"
                        title="Delete"
                        onClick={e => { e.stopPropagation(); setConfirmDelete(folder); }}
                      >
                        <i className="fa-solid fa-trash" />
                      </button>
                    </div>
                  )}

                  {/* expanded file list */}
                  {expandedFolder === folder && (
                    <div className="fld-files">
                      {!folderFiles[folder]
                        ? <p className="fld-files-loading"><i className="fa-solid fa-spinner fa-spin" /> Loading…</p>
                        : folderFiles[folder].length === 0
                          ? <p className="fld-files-empty">No files in this folder</p>
                          : folderFiles[folder].map(f => (
                            <div key={f.id} className="fld-file-row">
                              <i className={`fa-solid ${getFileIcon(f.fileName)} fld-file-icon`} />
                              <span className="fld-file-name">{f.fileName}</span>
                            </div>
                          ))
                      }
                      <button className="fld-view-all" onClick={() => navigate("/files")}>
                        Open My Files <i className="fa-solid fa-arrow-right" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
      </div>

      {/* ── RENAME MODAL ── */}
      {renameTarget && (
        <div className="viewer-modal" onClick={() => setRenameTarget(null)}>
          <div className="fld-modal" onClick={e => e.stopPropagation()}>
            <h3 className="fld-modal-title">Rename Folder</h3>
            <input
              className="fld-modal-input"
              value={renameName}
              onChange={e => setRenameName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submitRename()}
              autoFocus
            />
            <div className="fld-modal-actions">
              <button className="btn btn-primary" onClick={submitRename}>Rename</button>
              <button className="btn btn-secondary" onClick={() => setRenameTarget(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM ── */}
      {confirmDelete && (
        <div className="viewer-modal" onClick={() => setConfirmDelete(null)}>
          <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
            <i className="fa-solid fa-triangle-exclamation confirm-icon" />
            <h3>Delete Folder?</h3>
            <p>"{confirmDelete}" and all its files will be permanently deleted.</p>
            <div className="confirm-actions">
              <button className="btn btn-danger" onClick={deleteFolder}>Delete</button>
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <Toast messages={messages} removeToast={removeToast} />
    </Layout>
  );
}

export default Folders;
