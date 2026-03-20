import Layout from "../components/layout/Layout";
import "../components/layout/layout.css";
import "../components/common/card.css";

function UserDashboard() {

  const rawName = localStorage.getItem("name");
  const name = rawName
    ? rawName.charAt(0).toUpperCase() + rawName.slice(1)
    : "User";

  return (
    <Layout type="user">

      <div className="content">

        <h2 style={{ marginBottom: "10px" }}>User Dashboard</h2>

        {/* Welcome message */}
        <div className="welcome-box">
          <div className="welcome-left">
            <div className="welcome-icon">
              <i className="fa-solid fa-hand"></i>
            </div>
            <div>
              <h3>Welcome back, {name}</h3>
              <p>Here's what's happening with your files today.</p>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">

          {/* LEFT SIDE */}
          <div>

            <div className="card">

              <div className="card-title">My Files Overview</div>

              {/* STATS */}
              <div className="stats-row">

                <div className="stat-card stat-green">
                  <div className="stat-icon user-icon-files">
                    <i className="fa-solid fa-folder"></i>
                  </div>
                  <div className="stat-text">
                    <h4>Total Files</h4>
                    <h2>120</h2>
                  </div>
                </div>

                <div className="stat-card stat-blue">
                  <div className="stat-icon user-icon-storage">
                    <i className="fa-solid fa-cloud"></i>
                  </div>
                  <div className="stat-text">
                    <h4>Storage Used</h4>
                    <h2>25GB</h2>
                  </div>
                </div>

              </div>

              {/* RECENT FILES */}
              <div className="card-title">Recent Files</div>

              <div className="list-item user-icon-file">
                <i className="fa-solid fa-file"></i> file1.pdf
              </div>

              <div className="list-item user-icon-file">
                <i className="fa-solid fa-file"></i> file2.docx
              </div>

            </div>

          </div>

          {/* RIGHT SIDE */}
          <div>

            <div className="card">
              <div className="card-title">My Files Overview</div>

              <div className="list-item">
                <i className="fa-solid fa-folder user-icon-docs"></i> Documents
              </div>

              <div className="list-item">
                <i className="fa-solid fa-photo-film user-icon-media"></i> Media
              </div>

              <div className="list-item">
                <i className="fa-solid fa-link user-icon-links"></i> Shortcuts
              </div>
            </div>

            <div className="card" style={{ marginTop: "20px" }}>
              <div className="card-title">Notifications</div>
             <p><i className="fa-solid fa-bell user-icon-bell"></i> No new notifications</p>
            </div>

          </div>

        </div>

      </div>

    </Layout>
  );
}

export default UserDashboard;