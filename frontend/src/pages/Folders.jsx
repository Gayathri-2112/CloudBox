import { useEffect, useState } from "react";
import API from "../api/axiosConfig";
import Layout from "../components/layout/Layout";
import "../components/common/card.css";

function Folders() {

  const [folders, setFolders] = useState([]);
  const [newFolder, setNewFolder] = useState("");

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    const res = await API.get("/files/folders");
    setFolders(res.data);
  };

  const createFolder = async () => {
    if (!newFolder.trim()) {
      alert("Enter folder name");
      return;
    }

    try {
      await API.post("/files/folders", { name: newFolder });
      setNewFolder("");
      fetchFolders();
    } catch (err) {
      alert(err.response?.data || "Failed to create folder");
    }
  };

  const renameFolder = async (oldName) => {
    const newName = window.prompt("Enter new folder name", oldName);
    if (!newName || newName === oldName) return;

    try {
      await API.put("/files/folders/rename", {
        oldName,
        newName
      });
      fetchFolders();
    } catch (err) {
      alert(err.response?.data || "Failed to rename folder");
    }
  };

  const deleteFolder = async (name) => {
    if (name === "root") {
      alert("Root folder cannot be deleted");
      return;
    }

    if (!window.confirm(`Delete folder "${name}"?`)) return;

    try {
      await API.delete(`/files/folders/${encodeURIComponent(name)}`);
      fetchFolders();
    } catch (err) {
      alert(err.response?.data || "Failed to delete folder");
    }
  };

  return (
    <Layout type="user">
      <div className="content">
        <h2>Folders</h2>

        <div className="card">
          <div style={{ display: "flex", gap: "10px", marginBottom: "18px", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="New folder name"
              value={newFolder}
              onChange={(e) => setNewFolder(e.target.value)}
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                minWidth: "240px"
              }}
            />
            <button className="btn btn-primary" onClick={createFolder}>
              Create Folder
            </button>
          </div>

          {folders.map((folder) => (
            <div key={folder} className="list-item">
              <div style={{ flex: 1 }}>📁 {folder}</div>

              {folder !== "root" && (
                <div style={{ display: "flex", gap: "10px" }}>
                  <button className="btn btn-warning" onClick={() => renameFolder(folder)}>
                    Rename
                  </button>
                  <button className="btn btn-danger" onClick={() => deleteFolder(folder)}>
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

export default Folders;
