import { useEffect, useState, useMemo } from "react";
import API from "../api/axiosConfig";
import Layout from "../components/layout/Layout";
import { getRequestErrorMessage } from "../utils/requestErrors";
import "../styles/StorageUsed.css";

/* ── helpers ── */
function getCategory(file) {
  const name = file.fileName?.toLowerCase() || "";
  const type = file.fileType?.toLowerCase() || "";
  if (type.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg)$/.test(name)) return "Images";
  if (type.startsWith("video/") || /\.(mp4|mkv|avi|mov|webm)$/.test(name)) return "Videos";
  if (type.startsWith("audio/") || /\.(mp3|wav|ogg|flac)$/.test(name)) return "Audio";
  if (type.includes("pdf") || type.includes("word") ||
    /\.(pdf|doc|docx|txt|xls|xlsx|ppt|pptx|csv)$/.test(name)) return "Documents";
  return "Other";
}

function formatSize(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024, sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(1) + " " + sizes[i];
}

const CAT = {
  Documents: { color: "#3b82f6", grad: "linear-gradient(90deg,#3b82f6,#6366f1)", icon: "fa-file-lines", bg: "#eff6ff" },
  Images: { color: "#8b5cf6", grad: "linear-gradient(90deg,#8b5cf6,#ec4899)", icon: "fa-image", bg: "#f5f3ff" },
  Videos: { color: "#f59e0b", grad: "linear-gradient(90deg,#f59e0b,#ef4444)", icon: "fa-film", bg: "#fffbeb" },
  Audio: { color: "#10b981", grad: "linear-gradient(90deg,#10b981,#06b6d4)", icon: "fa-music", bg: "#ecfdf5" },
  Other: { color: "#64748b", grad: "linear-gradient(90deg,#64748b,#94a3b8)", icon: "fa-file", bg: "#f8fafc" },
};

/* ── animated donut ── */
function Donut({ pct, usedBytes, limitBytes }) {
  const R = 62, stroke = 14;
  const circ = 2 * Math.PI * R;
  const safe = isNaN(pct) ? 0 : Math.min(Math.max(pct, 0), 100);
  const arc = safe > 0 && safe < 3 ? 3 : safe;
  const dash = (arc / 100) * circ;
  const pctDisplay = safe < 0.1 ? "< 0.1%" : safe.toFixed(1) + "%";

  return (
    <div className="su-donut-outer">
      <svg width="180" height="180" viewBox="0 0 180 180">
        <defs>
          <linearGradient id="su-dg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
        <circle cx="90" cy="90" r={R} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={stroke} />
        {arc > 0 && (
          <circle cx="90" cy="90" r={R} fill="none"
            stroke="url(#su-dg)" strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            transform="rotate(-90 90 90)"
            style={{ transition: "stroke-dasharray 1s cubic-bezier(.4,0,.2,1)" }}
          />
        )}
      </svg>
      <div className="su-donut-inner">
        <span className="su-donut-val">{pctDisplay}</span>
        <span className="su-donut-sub">of {formatSize(limitBytes)}<br />used</span>
      </div>
    </div>
  );
}

export default function StorageUsed() {
  const [usedBytes, setUsedBytes] = useState(0);
  const [limitMb, setLimitMb] = useState(15360);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const fetchData = () => {
    setLoading(true);
    setLoadError("");
    Promise.all([API.get("/user/storage"), API.get("/files")])
      .then(([s, f]) => {
        setUsedBytes(Number(s.data.usedBytes) || 0);
        setLimitMb(Number(s.data.limitMb) || 15360);
        setFiles(Array.isArray(f.data) ? f.data : []);
      })
      .catch((error) => {
        setLoadError(getRequestErrorMessage(error, "Failed to load storage data"));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const limitBytes = limitMb * 1024 * 1024;
  const freeBytes = Math.max(limitBytes - usedBytes, 0);
  const usedPct = limitBytes > 0 ? Math.min((usedBytes / limitBytes) * 100, 100) : 0;
  const pctLabel = usedPct < 0.1 ? "< 0.1%" : usedPct.toFixed(2) + "%";

  const categories = useMemo(() => {
    const map = {};
    files.forEach(f => { const c = getCategory(f); map[c] = (map[c] || 0) + (f.fileSize || 0); });
    return Object.entries(map)
      .map(([name, bytes]) => ({
        name,
        bytes,
        pct: limitBytes > 0 ? Math.min((bytes / limitBytes) * 100, 100) : 0,
      }))
      .sort((a, b) => b.bytes - a.bytes);
  }, [files, limitBytes]);

  if (loading) return (
    <Layout type="user">
      <div className="su-spinner-wrap">
        <div className="su-spinner" />
        <span>Loading storage…</span>
      </div>
    </Layout>
  );

  return (
    <Layout type="user">
      <div className="su-page">

        {/* ── HERO BANNER ── */}
        <div className="su-hero">
          <div className="su-hero-left">
            <div className="su-hero-label">Storage Overview</div>
            <h1 className="su-hero-title">Your Cloud Storage</h1>
            <p className="su-hero-sub">
              {files.length} file{files.length !== 1 ? "s" : ""} stored &nbsp;·&nbsp; {pctLabel} used
            </p>

            <button
              className="btn btn-sm btn-outline"
              onClick={fetchData}
              disabled={loading}
              style={{ marginBottom: "16px" }}
            >
              <i className="fa-solid fa-refresh" /> {loading ? "Loading..." : "Refresh"}
            </button>

            {/* overall bar */}
            <div className="su-hero-bar-wrap">
              <div className="su-hero-bar-track">
                <div className="su-hero-bar-fill" style={{ width: `${Math.max(usedPct, usedBytes > 0 ? 0.5 : 0)}%` }} />
              </div>
              <div className="su-hero-bar-labels">
                <span>{formatSize(usedBytes)} used</span>
                <span>{formatSize(freeBytes)} free</span>
              </div>
            </div>

            {/* stat chips */}
            <div className="su-chips">
              <div className="su-chip">
                <i className="fa-solid fa-hard-drive" />
                <div>
                  <div className="su-chip-val">{formatSize(usedBytes)}</div>
                  <div className="su-chip-lbl">Used</div>
                </div>
              </div>
              <div className="su-chip">
                <i className="fa-solid fa-cloud" />
                <div>
                  <div className="su-chip-val">{formatSize(freeBytes)}</div>
                  <div className="su-chip-lbl">Available</div>
                </div>
              </div>
              <div className="su-chip">
                <i className="fa-solid fa-database" />
                <div>
                  <div className="su-chip-val">{formatSize(limitBytes)}</div>
                  <div className="su-chip-lbl">Total</div>
                </div>
              </div>
              <div className="su-chip">
                <i className="fa-solid fa-file" />
                <div>
                  <div className="su-chip-val">{files.length}</div>
                  <div className="su-chip-lbl">Files</div>
                </div>
              </div>
            </div>
          </div>

          <div className="su-hero-right">
            <Donut pct={usedPct} usedBytes={usedBytes} limitBytes={limitBytes} />
          </div>
        </div>

        {/* ── BOTTOM GRID ── */}
        <div className="su-bottom-grid">

          {/* categories */}
          <div className="su-panel">
            <div className="su-panel-head">
              <i className="fa-solid fa-chart-pie su-panel-icon" />
              <span>Storage by Category</span>
            </div>
            {loadError
              ? <p className="su-empty">{loadError}</p>
              : categories.length === 0
              ? <p className="su-empty">No files uploaded yet.</p>
              : categories.map(({ name, bytes, pct }) => {
                const m = CAT[name] || CAT.Other;
                return (
                  <div className="su-cat-row" key={name}>
                    <div className="su-cat-icon" style={{ background: m.bg, color: m.color }}>
                      <i className={`fa-solid ${m.icon}`} />
                    </div>
                    <div className="su-cat-body">
                      <div className="su-cat-top">
                        <span className="su-cat-name">{name}</span>
                        <span className="su-cat-meta">{formatSize(bytes)}</span>
                      </div>
                      <div className="su-bar-track">
                        <div className="su-bar-fill" style={{ width: `${Math.max(pct, 0.5)}%`, background: m.grad }} />
                      </div>
                    </div>
                  </div>
                );
              })
            }
          </div>

        </div>
      </div>
    </Layout>
  );
}
