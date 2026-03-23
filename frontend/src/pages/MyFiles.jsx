import { useEffect, useState } from "react";
import API from "../api/axiosConfig";

import Layout from "../components/layout/Layout";
import "../styles/style.css";
import "../components/layout/layout.css";
import "../components/common/card.css";

function MyFiles() {

  const [files, setFiles] = useState([]);
  const [shareEmail, setShareEmail] = useState({});
  const [sharePermission, setSharePermission] = useState({});
  const [folders, setFolders] = useState(["root"]);
  const [moveFolder, setMoveFolder] = useState({});

  const fetchFiles = async () => {
    const res = await API.get("/files");
    setFiles(res.data);
  };

  const fetchFolders = async () => {
    const res = await API.get("/files/folders");
    setFolders(res.data);
  };

  useEffect(() => {
    fetchFiles();
    fetchFolders();
  }, []);

  const deleteFile = async (id) => {
    await API.delete(`/files/${id}`);
    fetchFiles();
  };

  const downloadFile = async (id, name) => {
    const res = await API.get(`/files/download/${id}`, {
      responseType: "blob"
    });

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", name);
    link.click();
  };

  const shareFile = async (fileId) => {
    const email = shareEmail[fileId]?.trim();
    const permission = sharePermission[fileId] || "VIEW";

    if (!email) {
      alert("Enter recipient email");
      return;
    }

    try {
      await API.post("/files/share", {
        fileId,
        sharedWith: email,
        permission
      });

      setShareEmail((prev) => ({ ...prev, [fileId]: "" }));
      setSharePermission((prev) => ({ ...prev, [fileId]: "VIEW" }));
      alert("File shared successfully");
    } catch (err) {
      alert(err.response?.data || "Failed to share file");
    }
  };

  const moveFile = async (fileId) => {
    const targetFolder = moveFolder[fileId];

    if (!targetFolder) {
      alert("Select a target folder");
      return;
    }

    try {
      await API.put("/files/move", {
        fileId,
        targetFolder
      });

      fetchFiles();
      alert("File moved successfully");
    } catch (err) {
      alert(err.response?.data || "Failed to move file");
    }
  };

  return (
    <Layout type="user">
      <div className="content">
        <h2>My Files</h2>

        <div className="card">

          {files.map(file => (
            <div key={file.id} className="list-item">

              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: "10px" }}>
                  <i className="fa-solid fa-file user-icon-file"></i>
                  {file.fileName}
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <input
                    type="email"
                    placeholder="Share with email"
                    value={shareEmail[file.id] || ""}
                    onChange={(e) =>
                      setShareEmail((prev) => ({ ...prev, [file.id]: e.target.value }))
                    }
                    style={{
                      padding: "8px 10px",
                      borderRadius: "6px",
                      border: "1px solid #d1d5db",
                      minWidth: "220px"
                    }}
                  />

                  <select
                    value={sharePermission[file.id] || "VIEW"}
                    onChange={(e) =>
                      setSharePermission((prev) => ({ ...prev, [file.id]: e.target.value }))
                    }
                    style={{
                      padding: "8px 10px",
                      borderRadius: "6px",
                      border: "1px solid #d1d5db"
                    }}
                  >
                    <option value="VIEW">View</option>
                    <option value="DOWNLOAD">Download</option>
                  </select>

                  <button className="btn btn-primary" onClick={() => shareFile(file.id)}>
                    Share
                  </button>

                  <select
                    value={moveFolder[file.id] || file.folder || "root"}
                    onChange={(e) =>
                      setMoveFolder((prev) => ({ ...prev, [file.id]: e.target.value }))
                    }
                    style={{
                      padding: "8px 10px",
                      borderRadius: "6px",
                      border: "1px solid #d1d5db"
                    }}
                  >
                    {folders.map((folder) => (
                      <option key={folder} value={folder}>
                        Move to {folder}
                      </option>
                    ))}
                  </select>

                  <button className="btn btn-warning" onClick={() => moveFile(file.id)}>
                    Move
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>

                <button className="btn btn-success"
                  onClick={() => downloadFile(file.id, file.fileName)}>
                  Download
                </button>

                <button className="btn btn-danger"
                  onClick={() => deleteFile(file.id)}>
                  Delete
                </button>

              </div>
            </div>
          ))}

          {files.length === 0 && <p>No files uploaded yet</p>}

        </div>
      </div>
    </Layout>
  );
}

export default MyFiles;
