import { useState, useRef, useEffect } from "react";
import { useSessionLog } from "../session/SessionLogContext";
import surface from "../fixtures/surface.json";
import deep from "../fixtures/deep.json";
import polarized from "../fixtures/polarized.json";
import {
  SYNTHETIC_SESSION_SYSTEM_PROMPT,
  SYNTHETIC_SESSION_MAX_TOKENS,
  SYNTHETIC_ANTHROPIC_MODEL,
  PERSONA_ASSIGNMENTS,
  buildSyntheticUserPrompt,
  parseSyntheticEventsFromModelText,
} from "./syntheticPersonas.js";

const SYNTHETIC_EVENT_DELAY_MS = 300;
/** Slightly longer pause when driving real React state so updates settle. */
const SYNTHETIC_UI_EVENT_DELAY_MS = 450;

function extractAnthropicText(data) {
  const blocks = data?.content;
  if (!Array.isArray(blocks)) return "";
  return blocks
    .filter(b => b?.type === "text" && typeof b.text === "string")
    .map(b => b.text)
    .join("");
}

const SCENARIOS = [
  { id: "surface", label: "Surface Discussion", data: surface },
  { id: "deep", label: "Deep Discussion", data: deep },
  { id: "polarized", label: "Polarized Discussion", data: polarized },
];

const PERSONA_LABELS = {
  minimum_complier: "Minimum Complier",
  surface_engager: "Surface Engager",
  curious_builder: "Curious Builder",
};

export function SyntheticTestPanel({
  onLoadFixture,
  posts = [],
  clusters = [],
  prepareSyntheticSession,
  applySyntheticEvent,
  setSyntheticAuthorForTurn,
}) {
  const { setActiveScenario, setActivePersona, setActiveAuthorId, logEvent, captureMode, setCaptureMode } = useSessionLog();
  const [scenarioId, setScenarioId] = useState("surface");
  const [syntheticLoading, setSyntheticLoading] = useState(false);
  const [driveDiscourseMapUi, setDriveDiscourseMapUi] = useState(true);
  const postsRef = useRef(posts);
  const clustersRef = useRef(clusters);
  useEffect(() => { postsRef.current = posts; }, [posts]);
  useEffect(() => { clustersRef.current = clusters; }, [clusters]);
  const applyRef = useRef(applySyntheticEvent);
  useEffect(() => {
    applyRef.current = applySyntheticEvent;
  }, [applySyntheticEvent]);
  const apiKeyPresent = Boolean(import.meta.env.VITE_ANTHROPIC_API_KEY?.trim?.());

  const load = () => {
    const sc = SCENARIOS.find(s => s.id === scenarioId);
    if (!sc) return;
    const { posts = [], clusters = [], discussionPrompt } = sc.data || {};
    setActiveScenario(scenarioId);
    setActivePersona("none");
    setActiveAuthorId("unknown");
    onLoadFixture({ posts, clusters, scenarioId, discussionPrompt });
    logEvent("scenario_loaded", { scenarioId, personaId: "fixed_assignments", postCount: posts.length, clusterCount: clusters.length });
  };

  const runSyntheticSession = async () => {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) {
      logEvent("synthetic_session_failed", { reason: "missing_api_key" });
      // eslint-disable-next-line no-alert
      window.alert("Set VITE_ANTHROPIC_API_KEY in .env.local (see .env.example).");
      return;
    }
    setSyntheticLoading(true);
    const useUi = Boolean(driveDiscourseMapUi && applyRef.current);
    logEvent("synthetic_session_started", {
      personaId: "fixed_assignments",
      postCount: postsRef.current.length,
      clusterCount: clustersRef.current.length,
      mode: useUi ? "discourse_map_ui" : "session_log_only",
    });

    try {
      if (useUi) prepareSyntheticSession?.();

      const stepMs = SYNTHETIC_EVENT_DELAY_MS;
      // More realistic 2-round timeline (initial posts, then replies/new angles)
      const turnOrder = [
        "jennifer", // Round 1
        "addison",
        "stella",
        "matty", // Round 2
        "liz",
      ];

      for (let turnIdx = 0; turnIdx < turnOrder.length; turnIdx++) {
        const authorId = turnOrder[turnIdx];
        const personaId = PERSONA_ASSIGNMENTS[authorId];
        if (!personaId) continue;

        // Resolve author display info from current discussion state
        const curPosts = postsRef.current || [];
        const curClusters = clustersRef.current || [];
        const sample = curPosts.find(p => p?.authorId === authorId);
        const authorName = sample?.authorName || authorId;
        const initials = sample?.initials || authorName.split(/\s+/).map(s => s[0]).join("").slice(0, 2).toUpperCase();

        setActiveAuthorId(authorId);
        setActivePersona(personaId);
        setSyntheticAuthorForTurn?.({ authorId, authorName, initials });
        logEvent("student_turn_started", { authorId, personaId, turn_order: turnIdx + 1 });

        const userPrompt = buildSyntheticUserPrompt(authorId, personaId, curPosts, curClusters);

        const response = await fetch("/api/anthropic/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            // Required when the request chain originates from a browser (incl. Vite dev proxy).
            "anthropic-dangerous-direct-browser-access": "true",
          },
          body: JSON.stringify({
            model: SYNTHETIC_ANTHROPIC_MODEL,
            max_tokens: SYNTHETIC_SESSION_MAX_TOKENS,
            system: SYNTHETIC_SESSION_SYSTEM_PROMPT,
            messages: [{ role: "user", content: userPrompt }],
          }),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          const msg = data?.error?.message || response.statusText || "request_failed";
          logEvent("synthetic_session_failed", { status: response.status, message: msg, authorId, personaId });
          // eslint-disable-next-line no-alert
          window.alert(`Anthropic API error (${authorId}): ${msg}`);
          return;
        }

        const text = extractAnthropicText(data);
        if (!text?.trim()) {
          logEvent("synthetic_session_failed", {
            reason: "empty_assistant_text",
            stopReason: data?.stop_reason,
            rawTypes: Array.isArray(data?.content) ? data.content.map(b => b?.type) : [],
            authorId,
            personaId,
          });
          // eslint-disable-next-line no-alert
          window.alert(`Anthropic returned no text for ${authorId}.`);
          return;
        }

        const parsed = parseSyntheticEventsFromModelText(text);
        if (!parsed?.length) {
          logEvent("synthetic_session_failed", {
            reason: "parse_error",
            preview: text.slice(0, 800),
            authorId,
            personaId,
          });
          // eslint-disable-next-line no-alert
          window.alert(`Could not parse model output for ${authorId}. See session log.`);
          return;
        }

        for (let i = 0; i < parsed.length; i++) {
          const ev = parsed[i];
          if (!ev || typeof ev !== "object" || typeof ev.type !== "string") continue;
          if (useUi) applyRef.current?.(ev);
          else {
            const { type, ...payload } = ev;
            logEvent(type, payload);
          }
          if (i < parsed.length - 1) {
            // eslint-disable-next-line no-await-in-loop
            await new Promise(r => setTimeout(r, stepMs));
          }
        }

        // Allow React state (posts/clusters) to settle before the next student's prompt reads them.
        // eslint-disable-next-line no-await-in-loop
        await new Promise(r => setTimeout(r, 60));
      }

      logEvent("synthetic_session_completed", { mode: useUi ? "discourse_map_ui" : "session_log_only" });
    } catch (e) {
      logEvent("synthetic_session_failed", { reason: "network", message: String(e?.message || e) });
      // eslint-disable-next-line no-alert
      window.alert(`Request failed: ${e?.message || e}`);
    } finally {
      setSyntheticLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 56,
        right: 16,
        zIndex: 10002,
        width: 280,
        padding: 12,
        background: "rgba(15,23,42,0.96)",
        border: "1px solid #334155",
        borderRadius: 8,
        boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
        fontFamily: "Lato, system-ui, sans-serif",
        fontSize: 12,
        color: "#e2e8f0",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 8, color: "#38bdf8" }}>Synthetic test (dev)</div>
      <label style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10, cursor: "pointer", fontSize: 11, color: "#cbd5e1", lineHeight: 1.35 }}>
        <input
          type="checkbox"
          checked={Boolean(captureMode)}
          onChange={e => setCaptureMode(e.target.checked)}
          style={{ marginTop: 2 }}
        />
        <span>
          Capture mode (hides this panel + session log; shows REC indicator). Shortcut: <strong>Cmd+S</strong> downloads screenshot; <strong>Shift+S</strong> logs a marker.
        </span>
      </label>
      <div
        style={{
          marginBottom: 10,
          padding: "6px 8px",
          borderRadius: 4,
          fontSize: 10,
          lineHeight: 1.35,
          background: apiKeyPresent ? "rgba(22,163,74,0.15)" : "rgba(220,38,38,0.12)",
          border: `1px solid ${apiKeyPresent ? "#166534" : "#991b1b"}`,
          color: apiKeyPresent ? "#86efac" : "#fca5a5",
        }}
      >
        {apiKeyPresent
          ? "VITE_ANTHROPIC_API_KEY is loaded (client sees a value)."
          : "VITE_ANTHROPIC_API_KEY is missing in this dev bundle. Put it in project-root .env.local, save, stop and run npm run dev again (not preview / static deploy)."}
      </div>
      <label style={{ display: "block", marginBottom: 4, color: "#94a3b8" }}>Scenario</label>
      <select
        value={scenarioId}
        onChange={e => setScenarioId(e.target.value)}
        style={{ width: "100%", marginBottom: 10, padding: 6, borderRadius: 4, fontSize: 12 }}
      >
        {SCENARIOS.map(s => (
          <option key={s.id} value={s.id}>{s.label}</option>
        ))}
      </select>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 6 }}>Fixed personas (per student)</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "4px 10px", fontSize: 11, color: "#e2e8f0" }}>
          {Object.entries(PERSONA_ASSIGNMENTS).map(([authorId, personaId]) => {
            const label = PERSONA_LABELS[personaId] || personaId;
            const prettyName = authorId === "jennifer" ? "Jennifer" : authorId === "stella" ? "Stella" : authorId === "liz" ? "Liz" : authorId === "addison" ? "Addison" : authorId === "matty" ? "Matty" : authorId;
            return (
              <div key={authorId} style={{ display: "contents" }}>
                <div style={{ color: "#cbd5e1" }}>{prettyName}</div>
                <div style={{ color: "#94a3b8" }}>{label}</div>
              </div>
            );
          })}
        </div>
      </div>
      <label style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10, cursor: "pointer", fontSize: 11, color: "#cbd5e1", lineHeight: 1.35 }}>
        <input
          type="checkbox"
          checked={driveDiscourseMapUi}
          onChange={e => setDriveDiscourseMapUi(e.target.checked)}
          style={{ marginTop: 2 }}
        />
        <span>
          Drive DiscourseMap UI (theme selection, map, reply box, prompts). Off = log events only, no visuals.
        </span>
      </label>
      <button
        type="button"
        onClick={load}
        style={{
          width: "100%",
          padding: "8px 0",
          borderRadius: 4,
          border: "none",
          background: "#0374B5",
          color: "#fff",
          fontWeight: 700,
          cursor: "pointer",
          fontSize: 12,
        }}
      >
        Load scenario
      </button>
      <button
        type="button"
        onClick={runSyntheticSession}
        disabled={syntheticLoading}
        style={{
          width: "100%",
          marginTop: 8,
          padding: "8px 0",
          borderRadius: 4,
          border: "none",
          background: syntheticLoading ? "#334155" : "#0369a1",
          color: syntheticLoading ? "#94a3b8" : "#fff",
          fontWeight: 700,
          cursor: syntheticLoading ? "not-allowed" : "pointer",
          fontSize: 12,
        }}
      >
        {syntheticLoading ? "Simulating..." : "Run synthetic session"}
      </button>
      <div style={{ marginTop: 8, fontSize: 10, color: "#64748b", lineHeight: 1.4 }}>
        After load, run a session: with <strong style={{ color: "#94a3b8" }}>Drive DiscourseMap UI</strong> on, the prototype switches to &quot;With DiscourseMap&quot;, expands the map, and replays Claude&apos;s events as real clicks (themes, scaffolding, reply).
        <br />
        Fixtures: <code style={{ fontSize: 9 }}>src/fixtures/</code>. API key: <code style={{ fontSize: 9 }}>VITE_ANTHROPIC_API_KEY</code> in <code style={{ fontSize: 9 }}>.env.local</code>; restart <code style={{ fontSize: 9 }}>npm run dev</code> after editing.
      </div>
    </div>
  );
}
