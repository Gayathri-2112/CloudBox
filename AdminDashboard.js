import { useEffect, useState } from "react";
import API from "../api/axiosConfig";
import "../components/common/card.css";
import "../components/layout/layout.css";
import Layout from "../components/layout/Layout";

function AdminDashboard() {

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch users
  const fetchUsers = async () => {
    try {
      const res = await API.get("/admin/users");
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Suspend / Activate
  const toggleSuspend = async (user) => {
    try {
      const url = user.suspended
        ? `/admin/activate/${user.id}`
        : `/admin/suspend/${user.id}`;

      await API.put(url);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete user
  const deleteUser = async (id) => {
    if (!window.confirm("Delete user?")) return;

    try {
      await API.delete(`/admin/delete/${id}`);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  // Search filter
  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <h3 style={{ textAlign: "center" }}>Loading users...</h3>;
  }

  return (
    <Layout type="admin">

      <h2 className="dashboard-title">Admin Dashboard</h2>

      {/* Top Statistics Cards */}
      <div className="admin-grid">

        <div className="admin-stat">
          <div className="admin-stat-icon icon-users">
            <i className="fa-solid fa-users"></i>
          </div>

          <div className="admin-stat-text">
            <h4>Total Users</h4>
            <h2>{users.length}</h2>
          </div>
        </div>

        <div className="admin-stat">
          <div className="admin-stat-icon icon-files">
            <i className="fa-solid fa-folder"></i>
          </div>
          <div className="admin-stat-text">
            <h4>Total Files</h4>
            <h2>5672</h2>
          </div>
        </div>

        <div className="admin-stat">
          <div className="admin-stat-icon icon-storage">
            <i className="fa-solid fa-cloud"></i>
          </div>
          <div className="admin-stat-text">
            <h4>Storage Usage</h4>
            <h2>568 GB</h2>
          </div>
        </div>

      </div>


      {/* Search */}
      <div className="admin-search-box" style={{ marginBottom: "20px" }}>
        <i className="fa-solid fa-magnifying-glass"></i>
        <input
          type="text"
          placeholder="Search by email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>


      {/* System Statistics */}
      <h3 style={{ marginBottom: "15px" }}>System Statistics</h3>

      <div className="system-grid">

        <div className="system-card">
          <h3>{users.length}</h3>
          <span>Total Users</span>
        </div>

        <div className="system-card">
          <h3>5672</h3>
          <span>Total Files</span>
        </div>

        <div className="system-card">
          <h3>28</h3>
          <span>Shared</span>
        </div>

        <div className="system-card">
          <h3>58</h3>
          <span>Active Users</span>
        </div>

      </div>


      {/* Recent Activity Panels */}
      <div className="panel-grid" style={{marginBottom:"20px"}}>

        <div className="panel" >
          <h3>Recent Uploaded Files</h3>
          <p>file1.pdf</p>
        </div>

        <div className="panel">
          <h3>Recent File Sharing</h3>
          <p>User A shared file</p>
        </div>

      </div>


      {/* Users Table */}
      <table style={tableStyle}>
        <thead style={theadStyle}>
          <tr>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Location</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>

        <tbody>

          {filteredUsers.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>
                No users found
              </td>
            </tr>
          ) : (

            filteredUsers.map(user => (

              <tr key={user.id}>

                <td style={tdStyle}>{user.firstName} {user.lastName}</td>
                <td style={tdStyle}>{user.email}</td>
                <td style={tdStyle}>{user.location}</td>

                <td style={tdStyle}>
                  <span style={{
                    display: "inline-block",
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: user.suspended ? "red" : "green",
                    marginRight: "5px"
                  }}></span>

                  {user.suspended ? "Suspended" : "Active"}
                </td>

                <td style={tdStyle}>

                  <button
                    onClick={() => toggleSuspend(user)}
                    style={{
                      ...actionBtn,
                      background: user.suspended ? "#28a745" : "#ffc107"
                    }}
                  >
                    {user.suspended ? "Activate" : "Suspend"}
                  </button>

                  <button
                    onClick={() => deleteUser(user.id)}
                    style={{ ...actionBtn, background: "#dc3545" }}
                  >
                    Delete
                  </button>

                </td>

              </tr>

            ))

          )}

        </tbody>

      </table>

    </Layout>
  );
}

export default AdminDashboard;



/* Table Styling */

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  background: "#fff",
  boxShadow: "0 0 10px rgba(0,0,0,0.1)"
};

const theadStyle = {
  background: "#007bff",
  color: "white"
};

const thStyle = {
  padding: "12px",
  border: "1px solid #ddd"
};

const tdStyle = {
  padding: "10px",
  border: "1px solid #ddd"
};

const searchInput = {
  padding: "10px",
  width: "300px",
  borderRadius: "5px",
  border: "1px solid #ccc"
};

const actionBtn = {
  marginRight: "10px",
  color: "white",
  border: "none",
  padding: "6px 10px",
  borderRadius: "5px",
  cursor: "pointer"
};