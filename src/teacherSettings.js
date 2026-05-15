/** Persisted teacher / class controls (localStorage + optional Firestore merge). */

export const DM_TEACHER_SETTINGS_KEY = "dm_teacher_settings_v1";
export const DM_DISCUSSION_TEMPLATE_KEY = "dm_discussion_template_v1";

export const DEFAULT_INSTRUCTOR_NOTE_TEXT = [
  "What impacts do you see with artificial intelligence and data storytelling?",
  "There are no right or wrong answers. AI-assisted storytelling with data is still taking shape—explore openly.",
  "How might data storytelling change or expand with AI? Do you think that is a good direction—or not? Do you foresee AI being able to connect with the emotions of an audience? Use the map to anchor your ideas in this week’s themes and your classmates’ posts where it helps.",
].join("\n\n");

export const DEFAULT_TEACHER_SETTINGS = {
  /** "manual" = theme list from teacher config only. "auto_preview" reserved for future AI-assisted theme suggestions. */
  themeMode: "manual",
  writingAnglesEnabled: true,
  instructorNoteEnabled: true,
  instructorNoteText: DEFAULT_INSTRUCTOR_NOTE_TEXT,
  /** "tiles" = numeric tiles only. "rings" adds a theme-coverage ring + tiles. */
  discussionHealthStyle: "tiles",
  /** clusterId -> short instructor scaffolding shown on gap nodes + gap panels (manual until teacher auth). */
  gapPins: {
    "educational-implications":
      "Instructor: Who wants to connect our bias readings to teaching, design, or policy in this gap first?",
  },
};

export function normalizeTeacherSettings(raw) {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_TEACHER_SETTINGS, gapPins: { ...DEFAULT_TEACHER_SETTINGS.gapPins } };
  const gapPins =
    raw.gapPins && typeof raw.gapPins === "object"
      ? { ...DEFAULT_TEACHER_SETTINGS.gapPins, ...raw.gapPins }
      : { ...DEFAULT_TEACHER_SETTINGS.gapPins };
  return {
    ...DEFAULT_TEACHER_SETTINGS,
    ...raw,
    themeMode: raw.themeMode === "auto_preview" ? "auto_preview" : "manual",
    writingAnglesEnabled: raw.writingAnglesEnabled !== false,
    instructorNoteEnabled: raw.instructorNoteEnabled !== false,
    instructorNoteText: typeof raw.instructorNoteText === "string" && raw.instructorNoteText.trim()
      ? raw.instructorNoteText
      : DEFAULT_INSTRUCTOR_NOTE_TEXT,
    discussionHealthStyle: raw.discussionHealthStyle === "rings" ? "rings" : "tiles",
    gapPins,
  };
}

export function loadTeacherSettings() {
  try {
    const s = localStorage.getItem(DM_TEACHER_SETTINGS_KEY);
    if (!s) return normalizeTeacherSettings(null);
    return normalizeTeacherSettings(JSON.parse(s));
  } catch {
    return normalizeTeacherSettings(null);
  }
}

export function saveTeacherSettings(settings) {
  try {
    localStorage.setItem(DM_TEACHER_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

export function loadDiscussionTemplate() {
  try {
    const s = localStorage.getItem(DM_DISCUSSION_TEMPLATE_KEY);
    if (!s) return null;
    const o = JSON.parse(s);
    if (!o || typeof o !== "object") return null;
    return { title: String(o.title || ""), body: String(o.body || ""), savedAt: o.savedAt || null };
  } catch {
    return null;
  }
}

export function saveDiscussionTemplate({ title, body }) {
  const payload = { title: String(title || ""), body: String(body || ""), savedAt: new Date().toISOString() };
  localStorage.setItem(DM_DISCUSSION_TEMPLATE_KEY, JSON.stringify(payload));
  return payload;
}

/** Visual radius scale for map nodes from post count (non-gap); gaps stay compact. */
export function visualClusterSizeFromPostCount(postCount, isGap) {
  if (isGap) return 28;
  const n = Math.max(0, postCount);
  return Math.min(110, 18 + n * 10 + Math.min(4, Math.floor(n / 3)) * 12);
}
