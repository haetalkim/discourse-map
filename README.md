# Discourse Map Prototype

A **front-end prototype** of a Discourse Map for Canvas-style online discussions. It visualizes thematic clusters, connections between ideas, and unexplored “gaps,” and offers **epistemic prompts** when replying to help students contribute in more substantive, diverse ways. All data is hardcoded; there is no backend.

---

## Purpose

Online discussion boards often become **thread-heavy and idea-thin**: students reply in place without seeing how their post fits into the larger conversation. The Discourse Map prototype aims to:

- **Surface the landscape of the discussion** — which themes are well represented, which are barely touched, and how ideas connect.
- **Support richer contributions** — by suggesting *what kind* of post to write (e.g., challenge a consensus, explore a gap, bridge two clusters) and offering sentence starters.
- **Make gaps and consensus visible** — so instructors and students can notice underexplored areas and over-represented viewpoints.

The prototype is set in a **Canvas LMS–style** context (e.g., MSTU 5003 / Technology & Cognition) so it can be evaluated in a realistic scenario: a teacher’s guidelines post, student posts grouped by theme, and a map that updates conceptually as the discussion grows.

---

## Design Rationale

### Thematic clusters

Posts are grouped into **clusters** (e.g., “Social Media & Bias Awareness,” “Heuristics & Design Practice,” “AI Tools & Cognitive Bias”). Clusters reflect *themes*, not just threads, so students see *what* is being discussed, not only *who* replied to whom. Cluster size and color suggest how much activity and how much consensus or diversity exists.

### Connections and “underexplored” links

**Connections** between clusters show where the discussion has already linked ideas (e.g., “Both discuss algorithmic influence on cognition”). Some links are marked **underexplored** — the connection is conceptually there but few or no posts have made it explicit. The map invites students to “bridge” those ideas.

### Gaps

**Gap** nodes (e.g., “Educational Implications”) represent themes that the prompt or readings suggest but that no one has posted about yet. The design makes these visible so students can “be the first to contribute” in that direction, rather than only replying where the thread is already long.

### Epistemic prompts

When a student clicks **Reply**, they see **epistemic prompts**: short scaffolds that name a *type* of contribution (e.g., “Explore a gap,” “Challenge a consensus,” “Bridge two ideas”) and offer a sentence starter. Prompts are **context-aware**: replying to a post in “Social Media & Bias” yields different suggestions than replying to one in “Heuristics & Design.” The goal is to nudge variety and depth without prescribing content.

### Canvas-like shell

The UI mimics **Canvas** (sidebar, header, breadcrumbs, discussion card, reply box) so the prototype can be discussed as a *potential Canvas integration* rather than a standalone tool. Colors, typography, and layout follow Canvas conventions (e.g., `#002D62` sidebar, `#0374B5` links) to support realism in user testing and stakeholder demos.

---

## How to Use This Prototype

### 1. View modes

At the top of the main content you’ll see **PROTOTYPE:** with two options:

- **Standard Canvas view** — discussion only, no map (baseline).
- **With DiscourseMap** — discussion plus the Discourse Map and epistemic prompts.

Use **“With DiscourseMap”** to try the full experience.

### 2. The Discourse Map

- **Expand / Collapse** — The map can be collapsed to a single bar; click **Expand** to open it.
- **Clusters (colored circles)** — Each circle is a thematic cluster. Size reflects how many posts belong to it. Click a cluster to select it; the bottom panel shows that cluster’s posts and related clusters. Click again to deselect.
- **Gaps (dashed circles)** — Gray dashed circles are “gaps”: themes with no posts yet. Click one to see a prompt like “This area hasn’t been explored yet…”
- **Connections (lines)** — Lines between clusters show conceptual links. **Hover** a line to see its label in the bottom panel (e.g., “Connection between clusters: Social Media & Bias Awareness ↔ AI Tools & Cognitive Bias”). Solid lines = well discussed; dashed = underexplored.
- **Zoom & pan** — Use the **Zoom** controls (top-right of the map) or **scroll** over the map to zoom. **Drag** the map (click and drag) to pan. **Reset** restores default zoom and pan and clears selection.
- **Legend** — Bottom-left of the map explains: Clustered, Emerging, Connection, Gap.
- **“Highlight My Posts”** — When enabled, your posts are marked on the map (e.g., blue dot on a cluster you’ve contributed to). The current user in the prototype is **Yuna K.**

### 3. Replying and epistemic prompts

- Click **Reply** on the teacher’s post or any student post.
- A reply box opens with **epistemic prompts** above the text area:
  - **Map-wide prompts** (when replying to the main prompt): e.g., “Explore a gap,” “Challenge a consensus,” “Bridge two ideas.”
  - **Cluster-aware prompts** (when replying to a specific post): tailored to that cluster (e.g., “Situate this experience,” “Introduce a counter-perspective,” “Bridge to another region”).
- Use **“See map‑wide prompts”** / **“Back to cluster prompts”** to switch between global and cluster-specific suggestions.
- Click a prompt to **insert its sentence starter** into the reply box (you can edit the text). **Dismiss** hides the prompts panel.
- **Post Reply** and **Cancel** are for demo only; nothing is saved (no backend).

### 4. Bottom panel (below the map)

The panel shows one of:

- **Connection description** — When you hover a connection line: “Connection between clusters,” the two cluster names, and the connection label (and “underexplored” if applicable).
- **Cluster or gap detail** — When you click a cluster or gap: summary, related clusters, and post snippets (for clusters) or a gap prompt (for gaps).
- **Discourse Health Summary** — When nothing is selected: counts of clusters, gaps, and consensus areas needing counter-perspectives.

### 5. Discussion thread

- Student posts are listed below the teacher’s post. **Replies** are nested under the parent post.
- Each post shows **cluster color** (left border) when “With DiscourseMap” is on. **Hovering** a post highlights its cluster on the map; **clicking** a cluster can bump zoom for visibility.
- **↩ Reply**, **▾ Hide Replies**, **✉ Mark as Unread** behave as in a typical LMS (replies and state are simulated).

---

## Run Locally

```bash
cd discourse-map-run
npm install
npm run dev
```

Open the URL Vite prints (e.g. `http://localhost:5173`).

---

## Deploy / Share a Link

To get a shareable URL (e.g. for peers or user testing), see **[DEPLOY.md](./DEPLOY.md)** for Vercel (and optional GitHub) steps.

---

## Tech Note

- **Stack:** React, Vite. Single-page; no API or database.
- **Main app:** `src/App.jsx`. If you edit `DiscourseMap_Prototype1.jsx` elsewhere, copy its contents into `src/App.jsx` before deploying so the live version stays in sync.

---

## Scenario in the Prototype

The mock scenario is **Week 10 – Technology & Cognition, Motivation, and Behavior [Group 1]**: a teacher’s guidelines post plus 8 student posts about cognitive biases, heuristics, social media, UX design, media framing, and AI recommendations. Clusters, connections, and gaps are fixed to illustrate how the map and prompts would look in a real discussion. The epistemic prompts reference specific students (e.g., Sofia, David) and clusters to demonstrate context-aware scaffolding.
