/** Cross-tab session logging for Full View (same origin). */

export const LOG_BROADCAST_PREFIX = "discourse-map-session-log";
export const FULLVIEW_LOG_META_KEY = "dm_fullview_log_meta";

export function logChannelName(bridgeId) {
  return `${LOG_BROADCAST_PREFIX}-${bridgeId}`;
}

export function getOrCreateBridgeId() {
  try {
    let id = localStorage.getItem("dm_log_bridge_id");
    if (!id || String(id).length < 8) {
      id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `b-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem("dm_log_bridge_id", id);
    }
    return id;
  } catch {
    return `mem-${Date.now()}`;
  }
}

export function readFullViewLogMeta() {
  try {
    const raw = localStorage.getItem(FULLVIEW_LOG_META_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function writeFullViewLogMeta(meta) {
  try {
    localStorage.setItem(FULLVIEW_LOG_META_KEY, JSON.stringify({ ...meta, updatedAt: Date.now() }));
  } catch { /* ignore */ }
}
