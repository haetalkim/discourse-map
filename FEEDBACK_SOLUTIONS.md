# Feedback solutions (what we changed)

This document summarizes the **solutions we implemented in response to extensive feedback** during development of the DiscourseMap prototype. It’s organized as **feedback theme → implemented solution → where it lives**.

## 1) “The map needs to feel like Canvas, not a research demo”

- **Solution**: Canvas-like shell (sidebar, header, discussion layout, styling tokens).
- **Where**: `src/App.jsx` (overall layout + Canvas styling).

## 2) “Teachers need a setup space (prompt + themes)”

- **Solution**: Teacher mode / setup tab that lets you edit the discussion title/body and theme labels.
- **Where**: `src/App.jsx` (`view === "teacher"` section + `discussionPrompt` state + cluster label editing UI).

## 3) “Students should see a clear baseline vs With DiscourseMap”

- **Solution**: Prototype toggle with:
  - Standard Canvas view (baseline)
  - With DiscourseMap (map + prompts)
- **Where**: `src/App.jsx` (prototype toggle UI + view gates).

## 4) “Gap themes should be visible and actionable”

- **Solution**: Gap clusters (dashed outline) that open a gap-reply flow + gap-specific prompts.
- **Where**: `src/App.jsx` (gap cluster rendering + `handleGapClick` + `GAP_PROMPTS` + reply panel logic).

## 5) “Connections should be explorable, and underexplored links should stand out”

- **Solution**:
  - Hover/click behavior for connections
  - “Underexplored” (dashed) connection styling
  - Pin/unpin interaction for persistent focus
- **Where**: `src/App.jsx` (`CONNECTIONS` rendering + hover/pin state + telemetry events).

## 6) “Theme selection should meaningfully change what I see”

- **Solution**: Clicking a cluster highlights related posts and updates the bottom panel context.
- **Where**: `src/App.jsx` (`handleClusterSelect`, `selectedCluster`, post highlighting/filtering).

## 7) “Prompts should be context-aware and feel like scaffolding”

- **Solution**:
  - Context-aware epistemic prompts (cluster-aware, map-wide, gap prompts)
  - Insertable starters
  - Toggle between map‑wide and cluster prompts
- **Where**: `src/App.jsx` (`EpistemicPromptsPanel`, `getContextualPrompts`, prompt lists, reply flow).

## 8) “Cross-theme posts should be possible”

- **Solution**: Optional “Also relates to themes” checkbox list while replying, to tag a reply into multiple clusters.
- **Where**: `src/App.jsx` (reply panel `extraClusterIds` + post `clusterIds` updates + cluster membership update logic).

## 9) “Full view should be usable for exploration / presentation”

- **Solution**: Open Full View in a new tab for focused map exploration; carries state via sessionStorage.
- **Where**: `src/App.jsx` (`?fullview=1`, `FullMapView`, sessionStorage bridge).

## 10) “We need instrumentation to study behavior without changing the UI too much”

- **Solution**: Development-only session logger + drawer:
  - `logEvent(type, payload)` API
  - Drawer UI with Export + Clear
  - Export includes snapshot of posts/clusters and scenario/persona/author ids
- **Where**: `src/session/SessionLogContext.jsx`, plus `logEvent(...)` calls throughout `src/App.jsx`.

## 11) “We need synthetic testing scenarios, not just the Week 10 default”

- **Solution**:
  - Fixture files for multiple scenarios
  - Dev panel to load fixtures
  - Fixture `discussionPrompt` wiring so title/body/date update when scenarios load
- **Where**:
  - `src/fixtures/*.json`
  - `src/dev/SyntheticTestPanel.jsx` (Load scenario)
  - `src/App.jsx` (`handleLoadFixture` merges `discussionPrompt`)

## 12) “We need synthetic users to actually use the map + scaffolding (not only log lines)”

- **Solution**:
  - Synthetic events can be replayed into real UI state (cluster select, prompts, reply typing, submit)
  - Prompt/system rules encourage map interaction and scaffold usage
- **Where**: `src/App.jsx` (`applySyntheticEvent`, `prepareSyntheticSession`), `src/dev/syntheticPersonas.js`.

## 13) “Synthetic users should be multiple students with fixed personas”

- **Solution**:
  - Fixed persona assignments per student
  - Multi-turn simulation (2-round timeline) with `student_turn_started` + `turn_order`
  - Active author rotates per student turn so posts appear under the correct identity
- **Where**:
  - `src/dev/syntheticPersonas.js` (`PERSONA_ASSIGNMENTS`, author-aware prompt builder)
  - `src/dev/SyntheticTestPanel.jsx` (turn runner)
  - `src/App.jsx` (active author state + synthetic author setter)
  - `src/session/SessionLogContext.jsx` (events include `authorId`/`personaId`)

## 14) “Captures/screenshots should not include dev UI”

- **Solution**: Capture mode:
  - Removes SyntheticTestPanel from DOM
  - Hides SessionLogDrawer
  - Shows a small REC indicator
  - Cmd/Ctrl+S downloads viewport PNG via `html2canvas` (CDN-loaded)
  - Shift+S logs `screenshot_taken` markers (Cmd/Ctrl+Shift+S does both)
- **Where**:
  - `src/session/SessionLogContext.jsx` (`captureMode`)
  - `src/App.jsx` (REC indicator + html2canvas shortcut handlers + conditional renders)
  - `src/dev/SyntheticTestPanel.jsx` (toggle)

## 15) “We need higher-resolution behavioral signals (hover/dwell, prompt visibility)”

- **Solution**: Added dwell/visibility-based telemetry:
  - `map_viewed`
  - `cluster_hovered` + `gap_cluster_viewed`
  - `keyword_hovered`
  - `prompt_viewed`
  - `connection_dwell`
  - `prompts_dismissed.timeInPromptsMs`
  - enriched `reply_submitted` (fullText + prompt signals + cross-cluster signals)
- **Where**: `src/App.jsx` (map + prompts instrumentation), `src/session/SessionLogContext.jsx` (event schema fields).

## Notes

- All of the above is **prototype-first**: decisions optimize for clarity in demos + user testing rather than production robustness.
- For deeper implementation details of synthetic sessions and fixtures, see `SYNTHETIC_SYSTEM_NOTES.md`.

