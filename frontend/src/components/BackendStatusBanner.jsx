import { useBackendStatus } from "../hooks/useBackendStatus";

export default function BackendStatusBanner() {
  const { reachable, message } = useBackendStatus();

  if (reachable || !message) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 16,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 3000,
        width: "min(720px, calc(100vw - 24px))",
        background: "#fff7ed",
        color: "#9a3412",
        border: "1px solid #fdba74",
        borderRadius: 14,
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.14)",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
      role="alert"
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <i className="fa-solid fa-plug-circle-xmark" aria-hidden="true" />
        <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>{message}</span>
      </div>
      <button
        type="button"
        className="btn btn-sm btn-outline"
        onClick={() => window.location.reload()}
      >
        Retry
      </button>
    </div>
  );
}
