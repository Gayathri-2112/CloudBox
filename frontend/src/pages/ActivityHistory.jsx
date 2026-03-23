import { useEffect, useState } from "react";
import API from "../api/axiosConfig";
import Layout from "../components/layout/Layout";
import "../components/common/card.css";

function ActivityHistory() {
  const [activities, setActivities] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const res = await API.get("/user/activity");
      setActivities(res.data);
    } catch (err) {
      alert("Failed to load activity history");
    }
  };

  const filteredActivities = activities.filter((activity) =>
    activity.action?.toLowerCase().includes(search.toLowerCase()) ||
    activity.details?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout type="user">
      <div className="content">
        <h2>Activity History</h2>

        <div className="admin-search-box" style={{ marginBottom: "16px" }}>
          <input
            placeholder="Search activity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Action</th>
                <th>Details</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredActivities.length > 0 ? (
                filteredActivities.map((activity) => (
                  <tr key={activity.id}>
                    <td>{activity.action}</td>
                    <td>{activity.details}</td>
                    <td>{new Date(activity.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3">No activity yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

export default ActivityHistory;
