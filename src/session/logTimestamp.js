/**
 * Session log wall-clock for instructors in US Eastern.
 * Not fixed "EST" year-round: uses IANA America/New_York (EST in winter, EDT in summer).
 * `ts` / ISO fields elsewhere remain UTC for sorting and interoperability.
 */
export const SESSION_LOG_TIMEZONE = "America/New_York";

export function formatLogEastern(date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: SESSION_LOG_TIMEZONE,
    month: "numeric",
    day: "numeric",
    year: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).format(date);
}

/** Every logged event: UTC ISO + Eastern label for humans. */
export function sessionLogInstant() {
  const d = new Date();
  return {
    ts: d.toISOString(),
    tsEastern: formatLogEastern(d),
  };
}

export function easternLabelFromIso(isoString) {
  if (isoString == null || isoString === "") return "";
  const t = Date.parse(isoString);
  if (Number.isNaN(t)) return "";
  return formatLogEastern(new Date(t));
}

/** HUD / legacy rows without tsEastern. */
export function eventDisplayTimeEastern(e) {
  if (e?.tsEastern) return e.tsEastern;
  return easternLabelFromIso(e?.ts);
}
