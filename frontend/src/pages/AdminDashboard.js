import { useEffect, useState } from "react";
import API from "../api/axiosConfig";
import Layout from "../components/layout/Layout";
import "../styles/AdminDashboard.css";

import {
  FaUsers,
  FaFileAlt,
  FaDatabase,
  FaSearch,
  FaSpinner
} from "react-icons/fa";

function AdminDashboard() {

  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);

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
    } finally {
      setPageLoading(false);
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

  const toggleSuspend = async (user) => {
    try {

      setLoadingId(user.id);

      const url = user.suspended
        ? `/admin/unsuspend/${user.id}`
        : `/admin/suspend/${user.id}`;

      await API.put(url);

      fetchUsers();

    } catch {
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

    } catch {
      alert("Delete failed");
    }
  };

  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout type="admin">

    


      <div className="dashboard-container">

        <h2 className="dashboard-title">Admin Dashboard</h2>

        {/* STATS */}
        <div className="stats-row">

          <div className="stat-card">
          <div className="stat-icon">
            <FaUsers size={28}/>
          </div>

          <div className="stat-content">
            <div className="stat-label">Total Users</div>
            <div className="stat-value">{stats.totalUsers}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaFileAlt size={28}/>
          </div>

          <div className="stat-content">
            <div className="stat-label">Total Files</div>
            <div className="stat-value">{stats.totalFiles}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaDatabase size={28}/>
          </div>

          <div className="stat-content">
            <div className="stat-label">Storage Used</div>
            <div className="stat-value">{formatSize(stats.totalStorage)}</div>
          </div>
        </div>
        
        </div>

        {/* SEARCH */}
        <div className="search-box">
          <FaSearch style={{marginRight:8}}/>
          <input
            placeholder="Search user email..."
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
          />
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
            <div style={{opacity:0.6}}>No recent files</div>
          )}

        </div>

        {/* USERS */}
        <div className="card">

          <div className="card-title">User Management</div>

          {pageLoading ? (

            <div className="loading">
              <FaSpinner className="spin"/>
              Loading users...
            </div>

          ) : (

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

                    <td className={user.suspended ? "status-suspended" : "status-active"}>
                      {user.suspended ? "Suspended" : "Active"}
                    </td>

                    <td>

                      <button
                        className="btn btn-warning"
                        disabled={loadingId === user.id}
                        onClick={()=>toggleSuspend(user)}
                      >
                        {loadingId === user.id
                          ? "Processing..."
                          : user.suspended
                          ? "Activate"
                          : "Suspend"}
                      </button>

                      <button
                        className="btn btn-danger"
                        disabled={loadingId === user.id}
                        onClick={()=>deleteUser(user.id)}
                      >
                        Delete
                      </button>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          )}

        </div>

      </div>

    </Layout>
  );
}

export default AdminDashboard;


// helper
const formatSize = (bytes) => {

  if (!bytes) return "0B";

  const k = 1024;
  const sizes = ["B","KB","MB","GB"];

  const i = Math.floor(Math.log(bytes)/Math.log(k));

  return (bytes/Math.pow(k,i)).toFixed(2)+sizes[i];

};