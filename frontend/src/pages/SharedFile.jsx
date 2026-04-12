import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { renderAsync } from "docx-preview";
import axios from "axios";
import "../styles/style.css";
import "../styles/SharedFile.css";

const BASE = "http://localhost:8080/api";

export default function SharedFile() {
  const { token } = useParams();
  const [info,        setInfo]        = useState(null);
  const [error,       setError]       = useState("");
  const [loading,     setLoading]     = useState(true);
  const [previewUrl,  setPreviewUrl]  = useState(null);
  const [docxBuffer,  setDocxBuffer]  = useState(null);
  const [editMode,    setEditMode]    = useState(false);
  const [editText,    setEditText]    = useState("");
  const [saving,      setSaving]      = useState(false);
  const [saveMsg,     setSaveMsg]     = useState("");
  const docxRef = useRef(null);

  // 1. Fetch file info
  useEffect(() => {
    axios.get(`${BASE}/public/info/${token}`)
      .then(res => { setInfo(res.data); })
      .catch(() => setError("This link is invalid or has expired."))
      .finally(() => setLoading(false));
  }, [token]);

  // 2. Load preview once info is ready
  useEffect(() => {
    if (!info) return;
    const isDocx  = /\.(doc|docx)$/i.test(info.fileName);
    const isMedia = info.fileType?.startsWith("image/") ||
                    info.fileType?.includes("pdf") ||
                    info.fileType?.startsWith("video/") ||
                    info.fileType?.startsWith("audio/") ||
                    info.fileType?.startsWith("text/");

    if (isDocx) {
      axios.get(`${BASE}/public/file/${token}`, { responseType: "arraybuffer" })
        .then(res => setDocxBuffer(res.data))
        .catch(() => {});
      return;
    }
    if (isMedia) {
      axios.get(`${BASE}/public/file/${token}`, { responseType: "blob" })
        .then(res => setPreviewUrl(URL.createObjectURL(new Blob([res.data], { type: info.fileType }))))
        .catch(() => {});
    }
  }, [info, token]);

  // 3. Render docx once buffer + ref are ready
  useEffect(() => {
    if (docxBuffer && docxRef.current && !editMode) {
      docxRef.current.innerHTML = "";
      renderAsync(docxBuffer, docxRef.current).catch(() => {});
    }
  }, [docxBuffer, editMode]);

  async function download() {
    try {
      const res = await axios.get(`${BASE}/public/file/${token}`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url; a.download = info.fileName; a.click();
      URL.revokeObjectURL(url);
    } catch { alert("Download failed"); }
  }

  async function loadEditText() {
    try {
      const res = await axios.get(`${BASE}/public/file/${token}`, { responseType: "arraybuffer" });
      // Extract text via a simple approach — send to backend
      const r2 = await axios.post(`${BASE}/public/docx-text/${token}`, null);
      setEditText(r2.data.text || "");
      setEditMode(true);
    } catch { alert("Failed to load text for editing"); }
  }

  async function saveEdit() {
    setSaving(true); setSaveMsg("");
    try {
      await axios.put(`${BASE}/public/docx-save/${token}`, { text: editText });
      // Reload preview
      const res = await axios.get(`${BASE}/public/file/${token}`, { responseType: "arraybuffer" });
      setDocxBuffer(res.data);
      setEditMode(false);
      setSaveMsg("Saved!");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch { setSaveMsg("Save failed"); }
    finally { setSaving(false); }
  }

  if (loading) return (
    <div className="sf-page">
      <div className="sf-card">
        <div className="sf-loading"><i className="fa-solid fa-spinner fa-spin"></i> Loading…</div>
      </div>
    </div>
  );

  if (error) return (
    <div className="sf-page">
      <div className="sf-card sf-error-card">
        <i className="fa-solid fa-circle-xmark sf-error-icon"></i>
        <h2>Link Unavailable</h2>
        <p>{error}</p>
      </div>
    </div>
  );

  const isDocx      = /\.(doc|docx)$/i.test(info.fileName);
  const isImage     = info.fileType?.startsWith("image/");
  const isPdf       = info.fileType?.includes("pdf");
  const isVideo     = info.fileType?.startsWith("video/");
  const isAudio     = info.fileType?.startsWith("audio/");
  const isText      = info.fileType?.startsWith("text/");
  const canDownload = info.permission === "DOWNLOAD" || info.permission === "EDIT";
  const canEdit     = info.permission === "EDIT" && isDocx;

  return (
    <div className="sf-page">
      <div className="sf-card">
        <div className="sf-header">
          <div className="sf-logo">☁ CloudBox</div>
          <div className="sf-meta">
            <div className="sf-filename">{info.fileName}</div>
            <span className={`share-perm-badge perm-${info.permission?.toLowerCase()}`}>
              {info.permission}
            </span>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {saveMsg && <span style={{fontSize:13,color:"#16a34a",fontWeight:600}}>{saveMsg}</span>}
            {canEdit && !editMode && (
              <button className="btn btn-secondary btn-sm" onClick={loadEditText}>
                <i className="fa-solid fa-pen"></i> Edit
              </button>
            )}
            {canEdit && editMode && (
              <button className="btn btn-success btn-sm" onClick={saveEdit} disabled={saving}>
                {saving ? <><i className="fa-solid fa-spinner fa-spin"></i> Saving…</> : <><i className="fa-solid fa-floppy-disk"></i> Save</>}
              </button>
            )}
            {canEdit && editMode && (
              <button className="btn btn-secondary btn-sm" onClick={() => setEditMode(false)}>Cancel</button>
            )}
            {canDownload && (
              <button className="btn btn-primary btn-sm" onClick={download}>
                <i className="fa-solid fa-download"></i> Download
              </button>
            )}
          </div>
        </div>

        <div className="sf-preview">
          {isDocx && (
            editMode
              ? <textarea className="sf-edit-textarea" value={editText} onChange={e => setEditText(e.target.value)} spellCheck />
              : <div ref={docxRef} className="docx-render-container" />
          )}
          {isImage  && previewUrl && <img src={previewUrl} alt={info.fileName} className="sf-img" />}
          {isPdf    && previewUrl && <iframe src={previewUrl} className="sf-frame" title={info.fileName} />}
          {isVideo  && previewUrl && <video controls className="sf-video"><source src={previewUrl} type={info.fileType} /></video>}
          {isAudio  && previewUrl && <audio controls className="sf-audio"><source src={previewUrl} type={info.fileType} /></audio>}
          {isText   && previewUrl && <iframe src={previewUrl} className="sf-frame" title={info.fileName} style={{background:"#fff"}} />}
          {!isDocx && !isImage && !isPdf && !isVideo && !isAudio && !isText && (
            <div className="sf-no-preview">
              <i className="fa-solid fa-file sf-file-icon"></i>
              <p>Preview not available for this file type.</p>
              {canDownload && (
                <button className="btn btn-primary" onClick={download}>
                  <i className="fa-solid fa-download"></i> Download to view
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
