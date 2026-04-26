import { useCallback, useEffect, useState } from "react";
import API from "../../api/axiosConfig";
import Layout from "../../components/layout/Layout";
import Toast from "../../components/common/Toast";
import { useToast } from "../../hooks/useToast";

const PLAN_COLORS = {
  FREE: { bg: "#f0f4fa", color: "#5b6b8a", icon: "fa-gift" },
  PRO: { bg: "#dbeafe", color: "#2563eb", icon: "fa-star" },
  ENTERPRISE: { bg: "#ede9fe", color: "#7c3aed", icon: "fa-building" },
};

export default function AdminPlans() {
  const { messages, removeToast, toast } = useToast();
  const [plans, setPlans] = useState([]);
  const [editModal, setEditModal] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchPlans = useCallback(async () => {
    try {
      const res = await API.get("/admin/plans");
      setPlans(res.data);
    } catch { toast.error("Failed to load plans"); }
  }, [toast]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const openEdit = (plan) => {
    setEditModal({
      plan: plan.plan,
      priceRupees: plan.pricePaise ? plan.pricePaise / 100 : 0,
      storageMb: plan.storageMb ?? 15360,
      description: plan.description ?? "",
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      await API.put(`/admin/plans/${editModal.plan}`, {
        pricePaise: Math.round(Number(editModal.priceRupees) * 100),
        storageMb: Number(editModal.storageMb),
        description: editModal.description,
      });
      toast.success(`${editModal.plan} plan updated`);
      setEditModal(null);
      fetchPlans();
    } catch (e) { toast.error(e.response?.data || "Failed to save"); }
    finally { setSaving(false); }
  };

  const formatPrice = (paise) => paise === 0 ? "Free" : "₹" + (paise / 100).toLocaleString("en-IN");
  const formatStorage = (mb) => {
    if (!mb) return "—";
    if (mb >= 1048576) return (mb / 1048576).toFixed(0) + " TB";
    if (mb >= 1024) return (mb / 1024).toFixed(0) + " GB";
    return mb + " MB";
  };

  return (
    <Layout type="admin">
      <div className="content">
        <h2 className="dashboard-title">Plan Management</h2>
        <p style={{ color: "#5b6b8a", marginBottom: 24, fontSize: 14 }}>
          Edit plan prices and storage limits. Changes apply to new payments immediately.
        </p>

        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {plans.map(plan => {
            const style = PLAN_COLORS[plan.plan] || PLAN_COLORS.FREE;
            return (
              <div key={plan.plan} className="page-card" style={{
                flex: "1 1 260px", minWidth: 240, maxWidth: 340,
                border: `2px solid ${style.color}22`, borderRadius: 16,
                padding: 24, position: "relative",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: style.bg, color: style.color,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                  }}>
                    <i className={`fa-solid ${style.icon}`}></i>
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 18, color: "#1a2236" }}>{plan.plan}</div>
                    <div style={{ fontSize: 12, color: "#9baabf" }}>Plan tier</div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "#5b6b8a" }}>Price</span>
                    <span style={{ fontWeight: 700, fontSize: 16, color: style.color }}>
                      {formatPrice(plan.pricePaise)}
                      {plan.pricePaise > 0 && <span style={{ fontSize: 11, fontWeight: 400, color: "#9baabf" }}>/mo</span>}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "#5b6b8a" }}>Storage</span>
                    <span style={{ fontWeight: 700, fontSize: 15, color: "#1a2236" }}>
                      {formatStorage(plan.storageMb)}
                    </span>
                  </div>
                  {plan.description && (
                    <div style={{ fontSize: 12, color: "#9baabf", marginTop: 4 }}>{plan.description}</div>
                  )}
                </div>

                {plan.plan !== "FREE" ? (
                  <button className="btn btn-primary btn-sm" style={{ width: "100%" }}
                    onClick={() => openEdit(plan)}>
                    <i className="fa-solid fa-pen" style={{ marginRight: 6 }}></i>Edit Plan
                  </button>
                ) : (
                  <button className="btn btn-secondary btn-sm" style={{ width: "100%" }}
                    onClick={() => openEdit(plan)}>
                    <i className="fa-solid fa-pen" style={{ marginRight: 6 }}></i>Edit Storage
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Edit Modal */}
        {editModal && (
          <div className="viewer-modal" onClick={() => !saving && setEditModal(null)}>
            <div className="link-modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
              <div className="viewer-header">
                <span>
                  <i className="fa-solid fa-pen" style={{ marginRight: 8, color: "#4285f4" }}></i>
                  Edit {editModal.plan} Plan
                </span>
                <button className="close-btn" onClick={() => setEditModal(null)}>✕</button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {editModal.plan !== "FREE" && (
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#5b6b8a", display: "block", marginBottom: 6 }}>
                      Price (₹ per month)
                    </label>
                    <input
                      type="number" min="0"
                      className="settings-input"
                      value={editModal.priceRupees}
                      onChange={e => setEditModal(p => ({ ...p, priceRupees: e.target.value }))}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #d0daea", fontSize: 14 }}
                    />
                  </div>
                )}

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#5b6b8a", display: "block", marginBottom: 6 }}>
                    Storage Limit (MB) — 1 GB = 1024 MB
                  </label>
                  <input
                    type="number" min="1"
                    className="settings-input"
                    value={editModal.storageMb}
                    onChange={e => setEditModal(p => ({ ...p, storageMb: e.target.value }))}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #d0daea", fontSize: 14 }}
                  />
                  <div style={{ fontSize: 11, color: "#9baabf", marginTop: 4 }}>
                    = {editModal.storageMb >= 1048576
                      ? (editModal.storageMb / 1048576).toFixed(2) + " TB"
                      : editModal.storageMb >= 1024
                        ? (editModal.storageMb / 1024).toFixed(1) + " GB"
                        : editModal.storageMb + " MB"}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#5b6b8a", display: "block", marginBottom: 6 }}>
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Best for teams"
                    value={editModal.description}
                    onChange={e => setEditModal(p => ({ ...p, description: e.target.value }))}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #d0daea", fontSize: 14 }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setEditModal(null)} disabled={saving}>
                  Cancel
                </button>
                <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
                  {saving ? <><i className="fa-solid fa-spinner fa-spin"></i> Saving…</> : <><i className="fa-solid fa-check"></i> Save</>}
                </button>
              </div>
            </div>
          </div>
        )}

        <Toast messages={messages} removeToast={removeToast} />
      </div>
    </Layout>
  );
}
