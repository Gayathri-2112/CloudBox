import { useEffect, useState } from "react";
import API from "../api/axiosConfig";
import Layout from "../components/layout/Layout";
import "../styles/fileGrid.css";

function SharedWithMe() {
  const [shares, setShares] = useState([]);

  const [fileUrl, setFileUrl] = useState(null);
  const [fileType, setFileType] = useState("");
  const [showViewer, setShowViewer] = useState(false);

  useEffect(() => {
    fetchShares();
  }, []);

  const fetchShares = async () => {
    try {
      const res = await API.get("/files/shared-with-me");
      setShares(res.data);
    } catch {
      alert("Failed to load shared files");
    }
  };

  const downloadFile = async (id, name) => {
    try {
      const res = await API.get(`/files/download/${id}`, {
        responseType: "blob"
      });

      const url = URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      link.click();
    } catch {
      alert("Download failed");
    }
  };

  const viewFile = async (id) => {
    try {
      const res = await API.get(`/files/preview/${id}`, {
        responseType: "blob"
      });

      const blob = new Blob([res.data], {
  type: res.headers["content-type"]
});
      const url = URL.createObjectURL(blob);

      setFileUrl(url);
      setFileType(blob.type);
      setShowViewer(true);
    } catch {
      alert("Failed to open file");
    }
  };

  const closeViewer = () => {
    setShowViewer(false);
    setFileUrl(null);
  };

  return (
    <Layout type="user">
      <div className="content">
        <h2>Shared With Me</h2>

        <div className="file-grid">

          {shares.map((share) => (
            <div key={share.id} className="file-card">

              {/* ICON BASED ON FILE TYPE */}
              <div className="file-icon">
                {share.fileName.match(/\.(jpg|png|jpeg|gif)$/i) && (
                  <i className="fa-solid fa-image"></i>
                )}
                {share.fileName.match(/\.(mp4|mp3)$/i) && (
                  <i className="fa-solid fa-film"></i>
                )}
                {share.fileName.match(/\.(pdf)$/i) && (
                  <i className="fa-solid fa-file-pdf"></i>
                )}
                {share.fileName.match(/\.(doc|docx)$/i) && (
                  <i className="fa-solid fa-file-word"></i>
                )}
              </div>

              {/* FILE NAME */}
              <div className="file-name">{share.fileName}</div>

              {/* META INFO */}
              <div style={{ fontSize: "12px", color: "#6b7280" }}>
                {share.ownerEmail}
              </div>

              <div style={{ fontSize: "11px", color: "#9ca3af" }}>
                {share.permission}
              </div>

              {/* ACTIONS (hover controlled via CSS) */}
              <div className="file-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => viewFile(share.fileId)}
                >
                  View
                </button>

                <button
                  className="btn btn-success"
                  disabled={!share.canDownload}
                  onClick={() =>
                    downloadFile(share.fileId, share.fileName)
                  }
                >
                  Download
                </button>
              </div>

            </div>
          ))}

        </div>

        {/* 🔥 VIEWER MODAL */}
        {showViewer && (
          <div className="viewer-modal">
            <div className="viewer-content">
              <button onClick={closeViewer} className="close-btn">
                ✖
              </button>

              {/* IMAGE */}
              {fileType.startsWith("image/") && (
                <img src={fileUrl} alt="preview" className="viewer-media" />
              )}

              {/* PDF */}
              {fileType === "application/pdf" && (
                <iframe src={fileUrl} className="viewer-frame" />
              )}

              {/* VIDEO */}
              {fileType.startsWith("video/") && (
                <video controls className="viewer-media">
                  <source src={fileUrl} type={fileType} />
                </video>
              )}

              {/* AUDIO */}
              {fileType.startsWith("audio/") && (
                <audio controls>
                  <source src={fileUrl} type={fileType} />
                </audio>
              )}

              {/* FALLBACK */}
              {!fileType.startsWith("image/") &&
                fileType !== "application/pdf" &&
                !fileType.startsWith("video/") &&
                !fileType.startsWith("audio/") && (
                  <div>
                    <p>Preview not supported</p>
                    <a href={fileUrl} download>
                      Download File
                    </a>
                  </div>
                )}
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}

export default SharedWithMe;