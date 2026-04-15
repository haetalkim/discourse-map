# Design decisions (prototype)

This document captures the **design and engineering decisions** made while building the DiscourseMap prototype. It is meant to help future edits stay consistent and to explain why the prototype behaves the way it does.

## Product goals

- **Make discussions legible**: summarize a large thread into thematic clusters + connections.
- **Surface “gaps” and consensus**: make underexplored themes and missing counter‑perspectives visible.
- **Support better contributions**: provide epistemic scaffolds (prompts + starters) at the moment of replying.
- **Preserve Canvas realism**: the UI intentionally mimics a Canvas discussion shell for evaluation.

## Core interaction model

- **Map is an analysis view, not a new forum**: users still read/posts in a thread; the map provides navigation + context.
- **Cluster selection filters attention**: selecting a cluster highlights relevant posts; it does not reflow the entire page.
- **Connections are explorable**: hover/click connections to understand how clusters relate; “underexplored” links are emphasized.
- **Gaps are actionable**: clicking a gap node opens a reply flow for first contributions in that theme.

## Data model conventions (frontend-only)

- **No backend**: all data is in-memory React state; fixtures are JSON under `src/fixtures/`.
- **Posts**:
  - `id` like `p1`, `p2`, …
  - `parentId` nests replies
  - `clusterId` is the primary theme; optional `clusterIds` supports cross-cluster tagging
- **Clusters**:
  - `id`, `label`, `shortLabel`
  - `postIds` lists membership
  - `isGap: true` represents instructor-seeded missing themes
  - optional `consensusWarning` highlights clusters that need counter-perspectives

## Prompts / scaffolding

- **Context-aware prompts**: the prompt list depends on reply context:
  - replying to a post → cluster-aware prompts
  - replying to the main discussion → map-wide prompts
  - replying to a gap → gap-specific prompts
- **Prompt insertion**: clicking a prompt inserts its `starter` text; students can edit.
- **Mode toggle**: users can toggle between map-wide and cluster-aware prompt sets.

## Full view

- **Full view is a separate tab** (via `?fullview=1`) for focused exploration.
- Uses sessionStorage to pass the current posts/clusters snapshot into the new tab.

## “My posts” highlighting

- A “Highlight My Posts” affordance exists to show which clusters the active author has contributed to.
- In synthetic replay, the “current author” can rotate to simulate different students.

## Dev vs prod behavior

- **Session logging is dev-only**: `import.meta.env.DEV` gates logging + the drawer UI in production.
- **Synthetic panel is dev-only** and is removed from the DOM in capture mode.

## Export + capture

- **Session export is JSON** and includes:
  - event list
  - scenario/persona metadata
  - a snapshot of `posts`/`clusters` at export time
- **Capture mode** hides dev UI and adds a small REC indicator; screenshots use `html2canvas`.

## Known limitations (by design)

- **No persistence**: refresh resets state unless driven by fixtures.
- **No “true” map analytics**: cluster layout, connections, and prompts are prototype-authored, not model-derived.
- **Synthetic replay is deterministic in UI mapping, not in content**: model outputs are best-effort and may require guardrails.

