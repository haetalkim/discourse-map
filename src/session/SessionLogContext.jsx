import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const SessionLogContext = createContext(null);

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

  const clearLog = useCallback(() => setEvents([]), []);
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

  const exportToFile = useCallback(() => {
    const exportedAt = new Date().toISOString();
    const { posts, clusters } = exportSnapshotRef.current;
    const body = {
      exportedAt,
      scenario: activeScenario,
      persona: activePersona,
      genomicsCode,
      events,
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
  }, [activeScenario, activePersona, events, genomicsCode]);

  const value = useMemo(
    () => ({
      events,
      logEvent,
      clearLog,
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
    [events, logEvent, clearLog, exportToFile, setSessionExportSnapshot, activeScenario, activePersona, activeAuthorId, captureMode, loggingState, startLogging, pauseLogging, resumeLogging, endLogging, genomicsCode, addNote],
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
                events.map((e, i) => (
                  <div key={i} style={{ marginBottom: 6, lineHeight: 1.35, wordBreak: "break-word" }}>
                    <span style={{ color: "#94a3b8" }}>{e.ts.slice(11, 23)}</span>{" "}
                    <span style={{ color: "#38bdf8" }}>{e.type}</span>
                    {Object.keys(e.payload || {}).length > 0 && (
                      <span style={{ color: "#a8b4c4" }}> {JSON.stringify(e.payload)}</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
