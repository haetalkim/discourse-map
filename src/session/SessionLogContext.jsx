import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getOrCreateBridgeId, logChannelName, readFullViewLogMeta, writeFullViewLogMeta } from "./logBroadcast";

const SessionLogContext = createContext(null);

const noop = () => {};

/** Full View tab: forwards logEvent / addNote to the main tab via BroadcastChannel + localStorage meta. */
export function SessionLogRelayProvider({ bridgeId, children }) {
  const channelRef = useRef(null);

  useEffect(() => {
    if (!bridgeId) return undefined;
    const ch = new BroadcastChannel(logChannelName(bridgeId));
    channelRef.current = ch;
    return () => {
      ch.close();
      channelRef.current = null;
    };
  }, [bridgeId]);

  const postAppend = useCallback((type, payload) => {
    const ch = channelRef.current;
    if (!ch || !bridgeId) return;
    const meta = readFullViewLogMeta();
    if (!meta) return;
    const ts = new Date().toISOString();
    const event = {
      ts,
      type,
      payload,
      scenario: meta.activeScenario,
      persona: meta.activePersona,
      scenarioId: meta.activeScenario,
      personaId: meta.activePersona,
      authorId: meta.activeAuthorId,
    };
    ch.postMessage({ type: "append", event });
  }, [bridgeId]);

  const logEvent = useCallback(
    (type, payload = {}) => {
      const meta = readFullViewLogMeta();
      if (!meta || meta.loggingState !== "active") return;
      postAppend(type, { ...payload, source: "fullview" });
    },
    [postAppend],
  );

  const addNote = useCallback(
    (text) => {
      const meta = readFullViewLogMeta();
      if (!meta) return;
      const t = String(text || "").trim();
      if (!t) return;
      if (meta.loggingState !== "active" && meta.loggingState !== "paused") return;
      postAppend("note_added", { text: t, source: "fullview" });
    },
    [postAppend],
  );

  const value = useMemo(
    () => ({
      events: [],
      logEvent,
      clearLog: noop,
      exportToFile: noop,
      setSessionExportSnapshot: noop,
      activeScenario: "default",
      setActiveScenario: noop,
      activePersona: "none",
      setActivePersona: noop,
      activeAuthorId: "unknown",
      setActiveAuthorId: noop,
      captureMode: false,
      setCaptureMode: noop,
      loggingState: "idle",
      startLogging: noop,
      pauseLogging: noop,
      resumeLogging: noop,
      endLogging: noop,
      genomicsCode: null,
      addNote,
    }),
    [logEvent, addNote],
  );

  return <SessionLogContext.Provider value={value}>{children}</SessionLogContext.Provider>;
}

export function SessionLogProvider({ children }) {
  const [events, setEvents] = useState([]);
  const [activeScenario, setActiveScenario] = useState("default");
  const [activePersona, setActivePersona] = useState("none");
  const [activeAuthorId, setActiveAuthorId] = useState("unknown");
  const [captureMode, setCaptureMode] = useState(false);
  const [loggingState, setLoggingState] = useState("idle"); // idle | active | paused | ended
  const [genomicsCode, setGenomicsCode] = useState(null);
  const exportSnapshotRef = useRef({ posts: [], clusters: [] });

  const appendEvent = useCallback((type, payload = {}) => {
    const ts = new Date().toISOString();
    setEvents(prev => [
      ...prev,
      {
        ts,
        type,
        payload,
        scenario: activeScenario,
        persona: activePersona,
        scenarioId: activeScenario,
        personaId: activePersona,
        authorId: activeAuthorId,
      },
    ]);
  }, [activeScenario, activePersona, activeAuthorId]);

  const setSessionExportSnapshot = useCallback(({ posts, clusters }) => {
    exportSnapshotRef.current = {
      posts: Array.isArray(posts) ? posts : [],
      clusters: Array.isArray(clusters) ? clusters : [],
    };
  }, []);

  const logEvent = useCallback((type, payload = {}) => {
    if (loggingState !== "active") return;
    appendEvent(type, payload);
  }, [appendEvent, loggingState]);

  /** Clear all events, or drop only rows stamped with `opts.authorId` (e.g. current TC id). */
  const clearLog = useCallback((opts) => {
    const raw = opts && typeof opts.authorId === "string" ? opts.authorId.trim() : "";
    if (raw) {
      setEvents((prev) => prev.filter((e) => e.authorId !== raw));
      return;
    }
    setEvents([]);
  }, []);

  /** Wipe buffer and return logging to idle (e.g. study code change). */
  const resetSessionLogging = useCallback(() => {
    setEvents([]);
    setLoggingState("idle");
    setGenomicsCode(null);
  }, []);

  const startLogging = useCallback(() => {
    setGenomicsCode(null);
    setEvents([]);
    appendEvent("logging_started", {});
    setLoggingState("active");
  }, [appendEvent]);

  const pauseLogging = useCallback(() => {
    appendEvent("logging_paused", {});
    setLoggingState("paused");
  }, [appendEvent]);

  const resumeLogging = useCallback(() => {
    appendEvent("logging_resumed", {});
    setLoggingState("active");
  }, [appendEvent]);

  function makeGenomicsCode() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let out = "";
    for (let i = 0; i < 8; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
    return out;
  }

  const endLogging = useCallback(() => {
    const code = makeGenomicsCode();
    setGenomicsCode(code);
    appendEvent("logging_ended", { genomicsCode: code });
    setLoggingState("ended");
  }, [appendEvent]);

  const addNote = useCallback((text) => {
    const t = String(text || "").trim();
    if (!t) return;
    // Notes are allowed while paused (still part of the trace).
    if (loggingState === "idle") return;
    appendEvent("note_added", { text: t });
  }, [appendEvent, loggingState]);

  // Full View (other tab) reads this from localStorage to know if logging is active and which author/scenario to stamp.
  useEffect(() => {
    writeFullViewLogMeta({
      loggingState,
      activeScenario,
      activePersona,
      activeAuthorId,
    });
  }, [loggingState, activeScenario, activePersona, activeAuthorId]);

  // Merge events forwarded from Full View tabs (same origin).
  useEffect(() => {
    const id = getOrCreateBridgeId();
    const ch = new BroadcastChannel(logChannelName(id));
    ch.onmessage = (ev) => {
      if (ev.data?.type !== "append" || !ev.data?.event) return;
      setEvents((prev) => [...prev, ev.data.event]);
    };
    return () => ch.close();
  }, []);

  const exportToFile = useCallback(() => {
    const exportedAt = new Date().toISOString();
    const { posts, clusters } = exportSnapshotRef.current;
    const orderedEvents = events.map((e) => ({
      scenario: e.scenario,
      persona: e.persona,
      authorId: e.authorId,
      ts: e.ts,
      type: e.type,
      payload: e.payload ?? {},
    }));
    const body = {
      scenario: activeScenario,
      persona: activePersona,
      authorId: activeAuthorId,
      genomicsCode,
      exportedAt,
      eventCount: events.length,
      events: orderedEvents,
      snapshot: {
        timestamp: exportedAt,
        scenarioId: activeScenario,
        personaId: activePersona,
        posts,
        clusters,
      },
    };
    const stamp = exportedAt.replace(/[:.]/g, "-");
    const scenario = String(activeScenario || "default").replace(/[^a-zA-Z0-9_-]+/g, "-");
    const persona = String(activePersona || "none").replace(/[^a-zA-Z0-9_-]+/g, "-");
    const gcode = genomicsCode ? String(genomicsCode).replace(/[^A-Z0-9_-]+/g, "-") : "nocode";
    const blob = new Blob([JSON.stringify(body, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `discoursemap-${scenario}-${persona}-${gcode}-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeScenario, activePersona, activeAuthorId, events, genomicsCode]);

  const value = useMemo(
    () => ({
      events,
      logEvent,
      clearLog,
      resetSessionLogging,
      exportToFile,
      setSessionExportSnapshot,
      activeScenario,
      setActiveScenario,
      activePersona,
      setActivePersona,
      activeAuthorId,
      setActiveAuthorId,
      captureMode,
      setCaptureMode,
      loggingState,
      startLogging,
      pauseLogging,
      resumeLogging,
      endLogging,
      genomicsCode,
      addNote,
    }),
    [events, logEvent, clearLog, resetSessionLogging, exportToFile, setSessionExportSnapshot, activeScenario, activePersona, activeAuthorId, captureMode, loggingState, startLogging, pauseLogging, resumeLogging, endLogging, genomicsCode, addNote],
  );

  return (
    <SessionLogContext.Provider value={value}>
      {children}
    </SessionLogContext.Provider>
  );
}

export function useSessionLog() {
  const ctx = useContext(SessionLogContext);
  if (!ctx) throw new Error("useSessionLog must be used within SessionLogProvider");
  return ctx;
}

export function useSessionLogOptional() {
  return useContext(SessionLogContext);
}

/** Dwell-based UI hover logging (same threshold as meaningful attention). */
export function useUiHoverDwell(logEvent, minMs = 450) {
  const timers = useRef({});
  const startUiHover = useCallback(
    (controlId, extra = {}) => {
      if (!controlId) return;
      timers.current[controlId] = { t: performance.now(), extra };
    },
    [],
  );
  const endUiHover = useCallback(
    (controlId) => {
      if (!controlId) return;
      const entry = timers.current[controlId];
      delete timers.current[controlId];
      if (!entry) return;
      const durationMs = Math.round(performance.now() - entry.t);
      if (durationMs < minMs) return;
      logEvent?.("ui_hover", { controlId, durationMs, ...entry.extra });
    },
    [logEvent, minMs],
  );
  return { startUiHover, endUiHover };
}

/** Bottom drawer: session telemetry + export (development only). */
export function SessionLogDrawer() {
  const { events, clearLog, exportToFile, captureMode } = useSessionLog();
  const [open, setOpen] = useState(false);

  if (!import.meta.env.DEV) return null;
  if (captureMode) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10001,
        fontFamily: "ui-monospace, Menlo, Monaco, monospace",
        fontSize: 11,
        pointerEvents: "none",
      }}
    >
      <div style={{ pointerEvents: "auto", display: "flex", flexDirection: "column", alignItems: "stretch" }}>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          style={{
            alignSelf: "center",
            marginBottom: open ? 0 : 0,
            padding: "6px 16px",
            border: "1px solid #C7CDD1",
            borderBottom: open ? "none" : "1px solid #C7CDD1",
            borderRadius: open ? "8px 8px 0 0" : "8px 8px 0 0",
            background: "#1e293b",
            color: "#e2e8f0",
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {open ? "▼ Session log" : "▲ Session log"}{events.length > 0 ? ` (${events.length})` : ""}
        </button>
        {open && (
          <div
            style={{
              height: 220,
              background: "#0f172a",
              color: "#cbd5e1",
              borderTop: "1px solid #334155",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 -8px 24px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", gap: 8, padding: "8px 12px", borderBottom: "1px solid #334155", flexShrink: 0 }}>
              <button type="button" onClick={exportToFile} style={{ padding: "4px 10px", fontSize: 11, cursor: "pointer", borderRadius: 4, border: "1px solid #475569", background: "#1e293b", color: "#e2e8f0" }}>
                Export JSON
              </button>
              <button type="button" onClick={clearLog} style={{ padding: "4px 10px", fontSize: 11, cursor: "pointer", borderRadius: 4, border: "1px solid #475569", background: "#1e293b", color: "#e2e8f0" }}>
                Clear
              </button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px" }}>
              {events.length === 0 ? (
                <div style={{ color: "#64748b" }}>No events yet. Interact with the map, replies, and prompts.</div>
              ) : (
                events.map((e, i) => {
                  const cid = e.payload?.controlId;
                  return (
                    <div key={i} style={{ marginBottom: 6, lineHeight: 1.35, wordBreak: "break-word" }}>
                      <span style={{ color: "#94a3b8" }}>{e.ts.slice(11, 23)}</span>{" "}
                      <span style={{ color: "#38bdf8" }}>{e.type}</span>
                      {cid && (
                        <span style={{ color: "#fbbf24", fontWeight: 600 }}> {String(cid)}</span>
                      )}
                      {Object.keys(e.payload || {}).length > 0 && (
                        <span style={{ color: "#a8b4c4" }}> {JSON.stringify(e.payload)}</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
