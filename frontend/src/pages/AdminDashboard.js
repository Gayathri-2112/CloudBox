import { useEffect, useState } from "react";
import API from "../api/axiosConfig";

import Layout from "../components/layout/Layout";
import "../components/common/card.css";
import "../components/layout/layout.css";
import "../styles/style.css";

function AdminDashboard() {

  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchDashboard();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await API.get("/admin/users");
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDashboard = async () => {
    try {
      const res = await API.get("/admin/dashboard");
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ FIXED ENDPOINT
  const toggleSuspend = async (user) => {
    try {
      setLoadingId(user.id);

      const url = user.suspended
        ? `/admin/unsuspend/${user.id}`
        : `/admin/suspend/${user.id}`;

      await API.put(url);

      fetchUsers();

    } catch (err) {
      console.error(err);
      alert("Action failed");
    } finally {
      setLoadingId(null);
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Delete user?")) return;

    try {
      await API.delete(`/admin/delete/${id}`);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout type="admin">

      <div className="content">

        <h2 className="dashboard-title">Admin Dashboard</h2>

        {/* STATS */}
        <div className="stats-row">

          <div className="stat-card stat-admin-orange">
            <div className="stat-icon">
              <i className="fas fa-users"></i>
            </div>

            <div className="stat-text">
              <h4>Total Users</h4>
              <h2>{stats.totalUsers}</h2>
            </div>
          </div>

          <div className="stat-card stat-admin-blue">
            <div className="stat-icon">
              <i className="fas fa-file"></i>
            </div>

            <div className="stat-text">
              <h4>Total Files</h4>
              <h2>{stats.totalFiles}</h2>
            </div>
          </div>

          <div className="stat-card stat-admin-green">
            <div className="stat-icon">
              <i className="fas fa-database"></i>
            </div>

            <div className="stat-text">
              <h4>Storage Used</h4>
              <h2>{formatSize(stats.totalStorage)}</h2>
            </div>
          </div>

        </div>

        {/* RECENT FILES */}
        <div className="card">
          <div className="card-title">Recent Files</div>

          {stats.recentFiles?.length > 0 ? (
            stats.recentFiles.map(file => (
              <div key={file.id} className="list-item">
                {file.fileName}
              </div>
            ))
          ) : (
            <p>No recent files</p>
          )}
        </div>

        {/* SEARCH */}
        <div className="admin-search-box">
          <input
            placeholder="Search by email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* USERS */}
        <div className="card">
          <div className="card-title">User Management</div>

          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>{user.firstName} {user.lastName}</td>
                  <td>{user.email}</td>
                  <td>{user.location}</td>
                  <td style={{ color: user.suspended ? "red" : "green" }}>
                    {user.suspended ? "Suspended" : "Active"}
                  </td>
                  <td>
                    <button className="btn btn-warning"
                      onClick={() => toggleSuspend(user)}>
                      {user.suspended ? "Activate" : "Suspend"}
                    </button>

                    <button className="btn btn-danger"
                      style={{ marginLeft: "8px" }}
                      onClick={() => deleteUser(user.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>

      </div>

    </Layout>
  );
}

export default AdminDashboard;


// ================= HELPER =================
const formatSize = (bytes) => {
  if (!bytes) return "0B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + sizes[i];
};