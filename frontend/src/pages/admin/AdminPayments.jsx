import { useEffect, useState } from "react";
import API from "../../api/axiosConfig";
import Layout from "../../components/layout/Layout";
import Toast from "../../components/common/Toast";
import { useToast } from "../../hooks/useToast";

const STATUS_COLORS = {
  PENDING_APPROVAL: { bg: "#fef9c3", color: "#b45309" },
  APPROVED:         { bg: "#dcfce7", color: "#16a34a" },
  REJECTED:         { bg: "#fee2e2", color: "#dc2626" },
  CREATED:          { bg: "#f0f4fa", color: "#5b6b8a" },
};

function formatAmount(paise) {
  if (!paise) return "—";
  return "₹" + (paise / 100).toFixed(2);
}

export default function AdminPayments() {
  const { messages, removeToast, toast } = useToast();
  const [payments, setPayments] = useState([]);
  const [filter, setFilter] = useState("PENDING_APPROVAL");
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => { fetchPayments(); }, []);

  const fetchPayments = async () => {
    try {
      const res = await API.get("/admin/payments");
      setPayments(res.data);
    } catch { toast.error("Failed to load payments"); }
  };

  const approve = async (id) => {
    setLoadingId(id);
    try {
      await API.put(`/admin/payments/${id}/approve`);
      toast.success("Plan activated for user");
      fetchPayments();
    } catch (e) { toast.error(e.response?.data || "Failed"); }
    finally { setLoadingId(null); }
  };

  const reject = async (id) => {
    setLoadingId(id);
    try {
      await API.put(`/admin/payments/${id}/reject`);
      toast.success("Payment rejected");
      fetchPayments();
    } catch (e) { toast.error(e.response?.data || "Failed"); }
    finally { setLoadingId(null); }
  };

  const filtered = filter === "ALL" ? payments : payments.filter(p => p.status === filter);
  const pendingCount = payments.filter(p => p.status === "PENDING_APPROVAL").length;

  return (
    <Layout type="admin">
      <div className="content">
        <h2 className="dashboard-title">
          Payment Requests
          {pendingCount > 0 && (
            <span style={{
              marginLeft: 10, background: "#ef4444", color: "#fff",
              borderRadius: 20, padding: "2px 10px", fontSize: 13, fontWeight: 700
            }}>{pendingCount} pending</span>
          )}
        </h2>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
          {["PENDING_APPROVAL", "APPROVED", "REJECTED", "ALL"].map(s => (
            <button key={s}
              className={`mf-cat${filter === s ? " active" : ""}`}
              onClick={() => setFilter(s)}
              style={{ borderRadius: 20, padding: "6px 16px", fontSize: 12, fontWeight: 600,
                border: "1.5px solid #d0daea", background: filter === s ? "#4285f4" : "#fff",
                color: filter === s ? "#fff" : "#5b6b8a", cursor: "pointer" }}>
              {s === "PENDING_APPROVAL" ? "Pending" : s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="page-card">
          {filtered.length === 0 ? (
            <p className="empty-msg">No payments found</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const sc = STATUS_COLORS[p.status] || STATUS_COLORS.CREATED;
                  return (
                    <tr key={p.id}>
                      <td>{p.userEmail}</td>
                      <td><strong>{p.plan}</strong></td>
                      <td>{formatAmount(p.amountPaise)}</td>
                      <td>{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : new Date(p.createdAt).toLocaleDateString()}</td>
                      <td>
                        <span style={{ background: sc.bg, color: sc.color,
                          borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>
                          {p.status === "PENDING_APPROVAL" ? "Pending" : p.status}
                        </span>
                      </td>
                      <td>
                        {p.status === "PENDING_APPROVAL" && (
                          <div style={{ display: "flex", gap: 6 }}>
                            <button className="btn btn-success btn-sm"
                              disabled={loadingId === p.id}
                              onClick={() => approve(p.id)}>
                              {loadingId === p.id ? "…" : "Approve"}
                            </button>
                            <button className="btn btn-danger btn-sm"
                              disabled={loadingId === p.id}
                              onClick={() => reject(p.id)}>
                              Reject
                            </button>
                          </div>
                        )}
                        {p.status !== "PENDING_APPROVAL" && <span style={{ color: "#9baabf", fontSize: 13 }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <Toast messages={messages} removeToast={removeToast} />
      </div>
    </Layout>
  );
}
