import { useEffect, useState } from "react";
import API from "../api/axiosConfig";
import Layout from "../components/layout/Layout";
import "../components/common/card.css";
import "../styles/style.css";

function SharedByMe() {
  const [shares, setShares] = useState([]);

  useEffect(() => {
    fetchShares();
  }, []);

  const fetchShares = async () => {
    try {
      const res = await API.get("/files/shared-by-me");
      setShares(res.data);
    } catch (err) {
      alert("Failed to load shared records");
    }
  };

  const revokeShare = async (id) => {
    if (!window.confirm("Revoke this share?")) return;

    try {
      await API.delete(`/files/shares/${id}`);
      fetchShares();
    } catch (err) {
      alert(err.response?.data || "Failed to revoke share");
    }
  };

  return (
    <Layout type="user">
      <div className="content">
        <h2>Shared By Me</h2>

        <div className="card">
          {shares.length > 0 ? (
            shares.map((share) => (
              <div key={share.id} className="list-item">
                <div style={{ flex: 1 }}>
                  <strong>{share.fileName}</strong>
                  <div>Shared With: {share.sharedWith}</div>
                  <div>Permission: {share.permission}</div>
                </div>

                <button className="btn btn-danger" onClick={() => revokeShare(share.id)}>
                  Revoke
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

export default SharedByMe;
