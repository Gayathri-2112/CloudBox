import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/Layout";
import "../styles/fileGrid.css";

function Shortcuts() {
  const navigate = useNavigate();

  const [shortcuts] = useState([
    {
      id: 1,
      name: "Upload File",
      icon: "fa-upload",
      action: () => navigate("/upload")
    },
    {
      id: 2,
      name: "Create Folder",
      icon: "fa-folder-plus",
      action: () => navigate("/folders")
    },
    {
      id: 3,
      name: "My Files",
      icon: "fa-folder",
      action: () => navigate("/files")
    },
    {
      id: 4,
      name: "Shared With Me",
      icon: "fa-share-nodes",
      action: () => navigate("/shared-with")
    },
    {
      id: 5,
      name: "Shared By Me",
      icon: "fa-share-from-square",
      action: () => navigate("/shared-by")
    }
  ]);

  return (
    <Layout type="user">
      <div className="content">
        <h2>Shortcuts</h2>

        <div className="file-grid">

          {shortcuts.map((item) => (
            <div key={item.id} className="file-card shortcut-card">

              {/* ICON */}
              <div className="file-icon">
                <i className={`fa-solid ${item.icon}`}></i>
              </div>

              {/* NAME */}
              <div className="file-name">{item.name}</div>

              {/* ACTION */}
              <div className="file-actions">
                <button
                  className="btn btn-primary"
                  onClick={item.action}
                >
                  Open
                </button>
              </div>

            </div>
          ))}

        </div>
      </div>
    </Layout>
  );
}

export default Shortcuts;