# Synthetic system notes (fixtures + sessions)

This document captures what we implemented for **synthetic data** and **synthetic session simulation**.

## Fixtures (`src/fixtures/`)

- **Files**: `surface.json`, `deep.json`, `polarized.json`
- **Shape**:
  - `discussionPrompt`: `{ title, body, date }` (merged into the default prompt shape in-app)
  - `posts`: array of thread posts + replies
  - `clusters`: array of thematic clusters (including `isGap` clusters)
- **Important**: author identity fields (`authorId`, `authorName`, `initials`) must match across posts.

## Fixed student identities

The prototype uses these student ids in fixtures and synthetic sessions:

- `jennifer` → Jennifer
- `stella` → Stella
- `liz` → Liz
- `addison` → Addison
- `matty` → Matty

All legacy names (Tariq/Nadia/Felix/Soren/Lena) were removed from fixtures to prevent the model from repeating them.

## Fixed persona assignments

Implemented in `src/dev/syntheticPersonas.js`:

- Jennifer (`jennifer`) → `minimum_complier`
- Stella (`stella`) → `surface_engager`
- Liz (`liz`) → `surface_engager`
- Addison (`addison`) → `curious_builder`
- Matty (`matty`) → `curious_builder`

## Prompt construction

`buildSyntheticUserPrompt(authorId, personaId, posts, clusters)` includes:

- Explicit “you are [authorId]” context
- Persona behavior block
- Allowed names list (Jennifer/Stella/Liz/Addison/Matty)
- A constraint to never reference legacy names
- Full JSON for current `posts` and `clusters`

## Synthetic session runner (dev panel)

Location: `src/dev/SyntheticTestPanel.jsx`

### Turn model

- The “Run synthetic session” button simulates **multiple student turns** sequentially.
- Each turn:
  - sets the active author + persona for logging and UI rendering
  - logs `student_turn_started` with `{ authorId, personaId, turn_order }`
  - calls Anthropic Messages API
  - replays returned events into the **real UI** (or only the log if UI driving is disabled)
- Turn order is an authored “2-round timeline” (not a single fixed persona session):
  1. Jennifer
  2. Addison
  3. Stella
  4. Matty
  5. Liz

### UI driving vs log-only

- With “Drive DiscourseMap UI” enabled, synthetic events are applied to the React state (cluster select, prompts, reply typing, submit).
- With it disabled, events are only written to the session log.

### Authorship during simulation

During each student turn the app temporarily sets the “current author” so that:

- New posts appear under the right **authorId/authorName/initials**
- “My posts” highlighting uses the active author id

## Session logging & exports

Location: `src/session/SessionLogContext.jsx`

- Every logged event includes:
  - `scenario` / `persona` (legacy fields)
  - **`scenarioId` / `personaId` / `authorId`** (explicit ids for analysis)
- Export JSON includes:
  - `events`
  - `snapshot`: `{ timestamp, scenarioId, personaId, posts, clusters }`
- Filenames:
  - JSON export: `discoursemap-[scenarioId]-[persona]-[timestamp].json`
  - Screenshot export: `discoursemap-[scenarioId]-[persona]-[timestamp].png`

## Capture mode

- Capture mode hides:
  - Synthetic panel
  - Session log drawer
- Shows a small bottom-right **REC** indicator to exit capture mode.
- Shortcuts:
  - Cmd/Ctrl+S: download screenshot
  - Cmd/Ctrl+Shift+S: screenshot + `screenshot_taken`
  - Shift+S: logs `screenshot_taken` marker only

## Telemetry (session events)

We added dwell-based telemetry events to support analysis of map use:

- `map_viewed`
- `cluster_hovered` (mouseleave; duration filter)
- `gap_cluster_viewed` (gap hover ≥ 1000ms)
- `keyword_hovered`
- `prompt_viewed` (visible ≥ 800ms)
- `connection_dwell` (hover ≥ 600ms)

And enriched:

- `prompts_dismissed`: `timeInPromptsMs`
- `reply_submitted`: `fullText`, `promptStarterUsed`, `promptIdSelected`, `targetClusterId`, `isCrossCluster`, etc.

