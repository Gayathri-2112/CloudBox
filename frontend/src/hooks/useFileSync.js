import { useEffect, useRef, useCallback } from "react";
import API from "../api/axiosConfig";
import { useBackendStatus } from "./useBackendStatus";

/**
 * Polls /api/files/last-modified/{fileId} every `intervalMs` ms.
 * Calls onUpdate(newLastModified) when the timestamp changes.
 * Only runs when `active` is true (viewer is open and in view mode).
 */
export function useFileSync({ fileId, active, intervalMs = 5000, onUpdate }) {
  const lastSeenRef = useRef(null);
  const { reachable } = useBackendStatus();

  const check = useCallback(async () => {
    if (!fileId || !active || !reachable) return;
    try {
      const res = await API.get(`/files/last-modified/${fileId}`);
      const ts = res.data.lastModifiedAt;
      if (!ts) return;
      if (lastSeenRef.current && lastSeenRef.current !== ts) {
        onUpdate(ts);
      }
      lastSeenRef.current = ts;
    } catch {
      // silently ignore — don't spam errors on poll
    }
  }, [fileId, active, onUpdate, reachable]);

  useEffect(() => {
    if (!active || !fileId || !reachable) return;
    // seed the initial timestamp
    check();
    const id = setInterval(check, intervalMs);
    return () => clearInterval(id);
  }, [active, fileId, check, intervalMs, reachable]);
}
