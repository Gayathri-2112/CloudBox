import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axiosConfig";
import Layout from "../components/layout/Layout";
import Toast from "../components/common/Toast";
import { useToast } from "../hooks/useToast";
import "../styles/plans.css";

const PLANS = [
  {
    key: "FREE",
    name: "Free",
    price: 0,
    priceLabel: "₹0",
    period: "forever",
    storage: "15 GB",
    storageBytes: 15 * 1024 * 1024 * 1024,
    color: "#6b7280",
    features: [
      "15 GB storage",
      "File sharing (View/Download/Edit)",
      "Public link sharing",
      "Collaboration & comments",
      "Basic file management",
    ],
  },
  {
    key: "PRO",
    name: "Pro",
    price: 499,
    priceLabel: "₹499",
    period: "per month",
    storage: "100 GB",
    storageBytes: 100 * 1024 * 1024 * 1024,
    color: "#4285f4",
    featured: true,
    features: [
      "100 GB storage",
      "Everything in Free",
      "Priority support",
      "Advanced sharing controls",
      "Full activity audit logs",
    ],
  },
  {
    key: "ENTERPRISE",
    name: "Enterprise",
    price: 1999,
    priceLabel: "₹1,999",
    period: "per month",
    storage: "1 TB",
    storageBytes: 1024 * 1024 * 1024 * 1024,
    color: "#8b5cf6",
    features: [
      "1 TB storage",
      "Everything in Pro",
      "Admin dashboard",
      "User management",
      "Dedicated support",
      "Custom integrations",
    ],
  },
];

export default function Plans() {
  const { messages, removeToast, toast } = useToast();
  const navigate = useNavigate();
  const [currentPlan, setCurrentPlan] = useState("FREE");
  const [usedBytes, setUsedBytes] = useState(0);
  const [loading, setLoading] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const userEmail = localStorage.getItem("email") || "";
  const userName = localStorage.getItem("name") || "User";

  useEffect(() => {
    API.get("/user/storage").then(res => {
      setUsedBytes(res.data.usedBytes || 0);
    }).catch(() => {});
    API.get("/user/profile").then(res => {
      setCurrentPlan(res.data.plan || "FREE");
    }).catch(() => {});
  }, []);

  const handleUpgrade = async (plan) => {
    if (plan.price === 0) return;
    if (plan.key === currentPlan) { toast.info("You are already on this plan"); return; }
    setLoading(plan.key);
    try {
      const res = await API.post("/payment/create-order", { plan: plan.key });
      const { orderId, amount, currency, keyId } = res.data;

      // Dev/test mode: if no real Razorpay key, simulate payment directly
      if (!keyId || keyId.startsWith("rzp_test_") && res.data.simulated) {
        toast.success("Payment received! Your " + plan.name + " plan is pending admin approval.");
        setLoading(null);
        return;
      }

      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: "CloudBox",
        description: plan.name + " Plan — " + plan.storage,
        order_id: orderId,
        prefill: { email: userEmail, name: userName },
        theme: { color: plan.color },
        handler: async (response) => {
          try {
            await API.post("/payment/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success("Payment received! Your " + plan.name + " plan is pending admin approval.");
            setLoading(null);
          } catch {
            toast.error("Payment verification failed. Contact support.");
          }
        },
        modal: { ondismiss: () => setLoading(null) },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        toast.error("Payment failed. Please try again.");
        setLoading(null);
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data || "Failed to initiate payment");
      setLoading(null);
    }
  };

  const cancelPlan = async () => {
    setCancelling(true);
    try {
      await API.post("/user/cancel-plan");
      setCurrentPlan("FREE");
      setConfirmCancel(false);
      toast.success("Plan cancelled. You've been moved back to the Free plan.");
    } catch (e) {
      toast.error(e.response?.data || "Failed to cancel plan");
    } finally {
      setCancelling(false);
    }
  };

  const formatBytes = (b) => {
    if (b >= 1e12) return (b / 1e12).toFixed(1) + " TB";
    if (b >= 1e9)  return (b / 1e9).toFixed(1) + " GB";
    if (b >= 1e6)  return (b / 1e6).toFixed(1) + " MB";
    return b + " B";
  };

  const currentPlanData = PLANS.find(p => p.key === currentPlan) || PLANS[0];
  const usedPct = Math.min((usedBytes / currentPlanData.storageBytes) * 100, 100);

  return (
    <Layout type="user">
      <div className="content">
        <h2 className="page-heading">Plans &amp; Billing</h2>

        {/* Current usage card */}
        <div className="plan-usage-card">
          <div className="plan-usage-left">
            <div className="plan-usage-label">Current Plan</div>
            <div className="plan-usage-name" style={{ color: currentPlanData.color }}>
              {currentPlanData.name}
            </div>
            <div className="plan-usage-storage">
              {formatBytes(usedBytes)} used of {currentPlanData.storage}
            </div>
            {currentPlan !== "FREE" && (
              <button
                className="btn btn-danger btn-sm"
                style={{ marginTop: 12, fontSize: 12 }}
                onClick={() => setConfirmCancel(true)}
              >
                <i className="fa-solid fa-xmark" style={{ marginRight: 6 }}></i>Cancel Plan
              </button>
            )}
          </div>
          <div className="plan-usage-bar-wrap">
            <div className="plan-usage-bar">
              <div
                className="plan-usage-fill"
                style={{ width: usedPct + "%", background: currentPlanData.color }}
              />
            </div>
            <div className="plan-usage-pct">{usedPct.toFixed(1)}% used</div>
          </div>
        </div>

        {/* Confirm cancel dialog */}
        {confirmCancel && (
          <div className="viewer-modal" onClick={() => setConfirmCancel(false)}>
            <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
              <i className="fa-solid fa-triangle-exclamation confirm-icon"></i>
              <h3>Cancel {currentPlanData.name} Plan?</h3>
              <p>You'll be moved back to the Free plan (15 GB). Your files won't be deleted, but you won't be able to upload more if you're over 15 GB.</p>
              <div className="confirm-actions">
                <button className="btn btn-danger" onClick={cancelPlan} disabled={cancelling}>
                  {cancelling ? <><i className="fa-solid fa-spinner fa-spin"></i> Cancelling…</> : "Yes, Cancel Plan"}
                </button>
                <button className="btn btn-secondary" onClick={() => setConfirmCancel(false)}>Keep Plan</button>
              </div>
            </div>
          </div>
        )}

        {/* Plan cards */}
        <div className="plans-grid">
          {PLANS.map(plan => {
            const isCurrent = plan.key === currentPlan;
            return (
              <div
                key={plan.key}
                className={`plan-card${plan.featured ? " plan-featured" : ""}${isCurrent ? " plan-current" : ""}`}
              >
                {plan.featured && <div className="plan-badge">Most Popular</div>}
                {isCurrent && <div className="plan-badge plan-badge-current">Current Plan</div>}

                <div className="plan-icon" style={{ background: plan.color + "18", color: plan.color }}>
                  <i className={`fa-solid ${plan.key === "FREE" ? "fa-cloud" : plan.key === "PRO" ? "fa-bolt" : "fa-building"}`}></i>
                </div>

                <div className="plan-name">{plan.name}</div>
                <div className="plan-price">
                  <span className="plan-price-amount">{plan.priceLabel}</span>
                  {plan.price > 0 && <span className="plan-price-period">/{plan.period}</span>}
                </div>
                <div className="plan-storage-label">{plan.storage} storage</div>

                <ul className="plan-features">
                  {plan.features.map(f => (
                    <li key={f}>
                      <i className="fa-solid fa-check" style={{ color: plan.color }}></i>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  className="plan-btn"
                  style={plan.featured ? { background: plan.color } : {}}
                  disabled={isCurrent || loading === plan.key}
                  onClick={() => handleUpgrade(plan)}
                >
                  {loading === plan.key
                    ? <><i className="fa-solid fa-spinner fa-spin"></i> Processing…</>
                    : isCurrent
                      ? "Current Plan"
                      : plan.price === 0
                        ? "Free Forever"
                        : "Upgrade to " + plan.name
                  }
                </button>
              </div>
            );
          })}
        </div>

        <Toast messages={messages} removeToast={removeToast} />
      </div>
    </Layout>
  );
}
