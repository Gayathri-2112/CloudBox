import { useEffect, useState } from "react";
import API from "../api/axiosConfig";

import Layout from "../components/layout/Layout";
import "../styles/style.css";
import "../components/layout/layout.css";
import "../components/common/card.css";

function Upload() {

  const [file, setFile] = useState(null);
  const [folders, setFolders] = useState(["root"]);
  const [selectedFolder, setSelectedFolder] = useState("root");

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      const res = await API.get("/files/folders");
      setFolders(res.data);
    } catch (err) {
      alert("Failed to load folders");
    }
  };

  const handleUpload = async () => {
    if (!file) return alert("Select a file");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", selectedFolder);

    await API.post("/files/upload", formData);

    alert("Uploaded successfully!");
    setFile(null);
  };

  return (
    <Layout type="user">

      <div className="content">

        <h2 className="page-title">Upload File</h2>

        <div className="upload-wrapper">

          <div className="upload-card">

            <label className="upload-box">
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                hidden
              />

              <i className="fa-solid fa-cloud-arrow-up upload-icon"></i>

              <p>
                {file ? file.name : "Click or drag file to upload"}
              </p>

            </label>

            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              style={{
                width: "100%",
                marginTop: "16px",
                marginBottom: "16px",
                padding: "12px 14px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                background: "#fafafa"
              }}
            >
              {folders.map((folder) => (
                <option key={folder} value={folder}>
                  {folder}
                </option>
              ))}
            </select>

            <button
              className="btn btn-primary btn-full upload-btn"
              onClick={handleUpload}
            >
              Upload File
            </button>

          </div>

        </div>

      </div>

    </Layout>
  );
}

export default Upload;
