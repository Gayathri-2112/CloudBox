import { useEffect, useState } from "react";
import API from "../api/axiosConfig";
import Layout from "../components/layout/Layout";
import "../components/common/card.css";
import "../styles/style.css";

function Collaboration() {
  const [files, setFiles] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState("");
  const [comments, setComments] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchFiles();
  }, []);

  useEffect(() => {
    if (selectedFileId) {
      fetchComments(selectedFileId);
    } else {
      setComments([]);
    }
  }, [selectedFileId]);

  const fetchFiles = async () => {
    try {
      const res = await API.get("/files/collaboration");
      setFiles(res.data);
      if (res.data.length > 0) {
        setSelectedFileId(String(res.data[0].fileId));
      }
    } catch (err) {
      alert("Failed to load collaboration files");
    }
  };

  const fetchComments = async (fileId) => {
    try {
      const res = await API.get(`/files/collaboration/${fileId}/comments`);
      setComments(res.data);
    } catch (err) {
      alert("Failed to load comments");
    }
  };

  const addComment = async () => {
    if (!selectedFileId) {
      alert("Select a file first");
      return;
    }

    if (!message.trim()) {
      alert("Enter a comment");
      return;
    }

    try {
      await API.post("/files/collaboration/comment", {
        fileId: Number(selectedFileId),
        message
      });
      setMessage("");
      fetchComments(selectedFileId);
      fetchFiles();
    } catch (err) {
      alert(err.response?.data || "Failed to add comment");
    }
  };

  const selectedFile = files.find((file) => String(file.fileId) === selectedFileId);

  return (
    <Layout type="user">
      <div className="content">

        <h2>Collaboration</h2>

        <div className="card">
          {files.length > 0 ? (
            <>
              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
                  Select collaborative file
                </label>
                <select
                  value={selectedFileId}
                  onChange={(e) => setSelectedFileId(e.target.value)}
                  style={{
                    width: "100%",
                    maxWidth: "420px",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    background: "#fafafa"
                  }}
                >
                  {files.map((file) => (
                    <option key={file.fileId} value={file.fileId}>
                      {file.fileName} ({file.accessType})
                    </option>
                  ))}
                </select>
              </div>

              {selectedFile && (
                <div style={{ marginBottom: "18px" }}>
                  <strong>{selectedFile.fileName}</strong>
                  <div>Owner: {selectedFile.ownerEmail}</div>
                  <div>Access: {selectedFile.accessType}</div>
                  <div>Permission: {selectedFile.permission}</div>
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", marginBottom: "18px", flexWrap: "wrap" }}>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a collaboration comment"
                  style={{
                    flex: 1,
                    minWidth: "260px",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db"
                  }}
                />
                <button className="btn btn-primary" onClick={addComment}>
                  Add Comment
                </button>
              </div>

              {comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.id} className="list-item" style={{ alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <strong>{comment.userEmail}</strong>
                      <p style={{ margin: "6px 0" }}>{comment.message}</p>
                      <small>{new Date(comment.createdAt).toLocaleString()}</small>
                    </div>
                  </div>
                ))
              ) : (
                <p>No comments yet for this file</p>
              )}
            </>
          ) : (
            <p>No collaboration-ready files yet. Share a file first to start collaborating.</p>
          )}
        </div>

      </div>
    </Layout>
  );
}

export default Collaboration;
