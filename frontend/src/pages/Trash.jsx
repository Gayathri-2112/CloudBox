import { useEffect, useState } from "react";
import API from "../api/axiosConfig";
import Layout from "../components/layout/Layout";
import Toast from "../components/common/Toast";
import { useToast } from "../hooks/useToast";
import "../styles/style.css";
import "../components/common/card.css";

function formatSize(bytes) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(1) + " " + sizes[i];
}

export default function Trash() {
  const { messages, removeToast, toast } = useToast();
  const [files, setFiles] = useState([]);
  const [confirmEmpty, setConfirmEmpty] = useState(false);

  const fetchTrash = async () => {
    try {
      const res = await API.get("/files/trash");
      setFiles(res.data);
    } catch {
      toast.error("Failed to load trash");
    }
  };

  useEffect(() => { fetchTrash(); }, []);

  const restore = async (id) => {
    try {
      await API.put(`/files/${id}/restore`);
      setFiles(prev => prev.filter(f => f.id !== id));
      toast.success("File restored");
    } catch {
      toast.error("Restore failed");
    }
  };

  const emptyTrash = async () => {
    try {
      await API.delete("/files/trash/empty");
      setFiles([]);
      toast.success("Trash emptied");
    } catch {
      toast.error("Failed to empty trash");
    } finally {
      setConfirmEmpty(false);
    }
  };

  return (
    <Layout type="user">
      <div className="content">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 className="page-heading" style={{ margin: 0 }}>
            <i className="fa-solid fa-trash" style={{ marginRight: 8, color: "#ef4444" }}></i>Trash
          </h2>
          {files.length > 0 && (
            <button className="btn btn-danger btn-sm" onClick={() => setConfirmEmpty(true)}>
              <i className="fa-solid fa-trash-can"></i> Empty Trash
            </button>
          )}
        </div>

        <div className="page-card">
          {files.length === 0 ? (
            <p className="empty-msg">Trash is empty</p>
          ) : (
            files.map(file => (
              <div key={file.id} className="file-row">
                <div className="file-row-left">
                  <i className="fa-solid fa-file file-type-icon" style={{ color: "#9ca3af" }}></i>
                  <div>
                    <div className="file-row-name">{file.fileName}</div>
                    <div className="file-row-meta">
                      {formatSize(file.fileSize)} &bull; Deleted{" "}
                      {file.deletedAt ? new Date(file.deletedAt).toLocaleDateString() : ""}
                    </div>
                  </div>
                </div>
                <div className="file-row-actions">
                  <button className="btn btn-success btn-sm" onClick={() => restore(file.id)}>
                    <i className="fa-solid fa-rotate-left"></i> Restore
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {confirmEmpty && (
          <div className="viewer-modal" onClick={() => setConfirmEmpty(false)}>
            <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
              <i className="fa-solid fa-triangle-exclamation confirm-icon"></i>
              <h3>Empty Trash?</h3>
              <p>All {files.length} file(s) will be permanently deleted.</p>
              <div className="confirm-actions">
                <button className="btn btn-danger" onClick={emptyTrash}>Delete Permanently</button>
                <button className="btn btn-secondary" onClick={() => setConfirmEmpty(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        <Toast messages={messages} removeToast={removeToast} />
      </div>
    </Layout>
  );
}
