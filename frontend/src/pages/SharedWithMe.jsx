import { useEffect, useState } from "react";
import API from "../api/axiosConfig";
import Layout from "../components/layout/Layout";
import "../components/common/card.css";
import "../styles/style.css";

function SharedWithMe() {
  const [shares, setShares] = useState([]);

  useEffect(() => {
    fetchShares();
  }, []);

  const fetchShares = async () => {
    try {
      const res = await API.get("/files/shared-with-me");
      setShares(res.data);
    } catch (err) {
      alert("Failed to load shared files");
    }
  };

  const downloadFile = async (id, name) => {
    try {
      const res = await API.get(`/files/download/${id}`, {
        responseType: "blob"
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", name);
      link.click();
    } catch (err) {
      alert(err.response?.data || "Download failed");
    }
  };

  return (
    <Layout type="user">
      <div className="content">
        <h2>Shared With Me</h2>

        <div className="card">
          {shares.length > 0 ? (
            shares.map((share) => (
              <div key={share.id} className="list-item">
                <div style={{ flex: 1 }}>
                  <strong>{share.fileName}</strong>
                  <div>Owner: {share.ownerEmail}</div>
                  <div>Permission: {share.permission}</div>
                </div>

                <button
                  className="btn btn-success"
                  disabled={share.permission !== "DOWNLOAD"}
                  onClick={() => downloadFile(share.fileId, share.fileName)}
                >
                  {share.permission === "DOWNLOAD" ? "Download" : "View Only"}
                </button>
              </div>
            ))
          ) : (
            <p>No shared files yet</p>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default SharedWithMe;
