import { useEffect, useState } from "react";
import { renderAsync } from "docx-preview";
import * as XLSX from "xlsx";
import API from "../api/axiosConfig";

import Layout from "../components/layout/Layout";
import "../styles/style.css";
import "../components/layout/layout.css";
import "../components/common/card.css";

function Upload() {

  const [file, setFile] = useState(null);
  const [folders, setFolders] = useState(["root"]);
  const [selectedFolder, setSelectedFolder] = useState("root");

  const [preview, setPreview] = useState(null);
  const [fileType, setFileType] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      const res = await API.get("/files/folders");
      setFolders(res.data);
    } catch {
      alert("Failed to load folders");
    }
  };

  const handleFileChange = async (e) => {

  const selectedFile = e.target.files[0];
  if (!selectedFile) return;

  setFile(selectedFile);

  const ext = selectedFile.name.split(".").pop().toLowerCase();
  const url = URL.createObjectURL(selectedFile);
  setPreview(url);

  if (["png","jpg","jpeg","gif","webp"].includes(ext)) {
    setFileType("image");
  }

  else if (ext === "pdf") {
    setFileType("pdf");
  }

  else if (["mp4","webm","ogg"].includes(ext)) {
    setFileType("video");
  }

  else if (["doc","docx"].includes(ext)) {

    setFileType("docx");

    const arrayBuffer = await selectedFile.arrayBuffer();

    const container = document.getElementById("docx-preview");

    container.innerHTML = "";

    renderAsync(arrayBuffer, container);
  }

  else if (["xls","xlsx"].includes(ext)) {

    setFileType("excel");

    const data = await selectedFile.arrayBuffer();

    const workbook = XLSX.read(data);

    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const html = XLSX.utils.sheet_to_html(sheet);

    document.getElementById("excel-preview").innerHTML = html;
  }

  else if (["ppt","pptx"].includes(ext)) {

    setFileType("ppt");
  }

  else {
    setFileType("other");
  }

};

  const handleUpload = async () => {

    if (!file) {
      alert("Select a file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", selectedFolder);

    setUploading(true);

    try {

      await API.post("/files/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      alert("Uploaded successfully!");

      setFile(null);
      setPreview(null);

    } catch {
      alert("Upload failed");
    }

    setUploading(false);
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
                onChange={handleFileChange}
                hidden
              />

              <i className="fa-solid fa-cloud-arrow-up upload-icon"></i>

              <p>
                {file ? file.name : "Click or drag file to upload"}
              </p>

            </label>


            {/* FILE PREVIEW */}

            {preview && (

              <div style={{marginTop:"20px"}}>

                {fileType === "image" && (
                  <img src={preview} style={{maxWidth:"100%"}} />
                )}

                {fileType === "pdf" && (
                  <iframe src={preview} width="100%" height="400px" />
                )}

                {fileType === "video" && (
                  <video controls width="100%">
                    <source src={preview}/>
                  </video>
                )}

                {fileType === "docx" && (
                  <div
                    id="docx-preview"
                    style={{
                      background:"#fff",
                      padding:"20px",
                      borderRadius:"8px",
                      maxHeight:"400px",
                      overflow:"auto"
                    }}
                  />
                )}

                {fileType === "excel" && (
                  <div
                    id="excel-preview"
                    style={{
                      background:"#fff",
                      padding:"20px",
                      maxHeight:"400px",
                      overflow:"auto"
                    }}
                  />
                )}

                {fileType === "ppt" && (
                  <p>Preview for PPT is limited. Upload to view slides.</p>
                )}

                {fileType === "other" && (
                  <p>Preview not available.</p>
                )}

              </div>

            )}

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
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Upload File"}
            </button>

          </div>

        </div>

      </div>

    </Layout>
  );
}

export default Upload;