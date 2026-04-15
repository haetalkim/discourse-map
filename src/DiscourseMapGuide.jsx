import React from 'react';
import './DiscourseMapGuide.css';

import imgActivate from './activate.png';
import imgPanel from './panel.png';
import imgNav from './nav.png';
import imgConn from './conn.png';
import imgPrompt from './prompt.png';

const BookIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
  </svg>
);

const SpeechIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
  </svg>
);

const DiscourseMapGuide = () => {
  return (
    <div className="notes-container">
      <aside className="notes-sidebar">
        <h2>Contents</h2>
        <nav>
          <ul>
            <li><a href="#intro"><BookIcon /> Getting Started</a></li>
            <li><a href="#activating">1. Activating the Map</a></li>
            <li><a href="#finding-panel">2. Finding the Panel</a></li>
            <li><a href="#navigating">3. Reading the Landscape</a></li>
            <li><a href="#connections">4. Discovering Connections</a></li>
            <li><a href="#writing">5. Epistemic Prompts</a></li>
            <li><a href="#fullview">6. Full View</a></li>
            <li><a href="#faq">FAQ (pilots)</a></li>
            <li><a href="#pedagogy">Design Rationale</a></li>
          </ul>
        </nav>
      </aside>

      <main className="notes-main-wrapper">
        <div className="notes-paper">

          <header id="intro">
            <h1>DiscourseMap: Educator Guide</h1>
            <div className="educator-intro">
              <p><strong>Welcome to DiscourseMap.</strong> Standard LMS discussion forums often produce parallel monologues and agreement-oriented responses — a pattern sometimes called knowledge telling rather than knowledge building. By implementing this plugin, you are giving students a tool that makes the epistemic structure of collective discourse visible: what has been said, what connects, and — critically — what is still missing. This guide walks through each feature and provides ready-made scripts to explain the tool to your students.</p>
            </div>
          </header>

          <section id="activating">
            <h2>1. Activating the Map</h2>
            <p>DiscourseMap runs as a Canvas plugin and lives directly inside the existing discussion interface. Students do not need to create accounts or open external platforms — the toggle is visible at the top of any discussion page.</p>

            <figure className="notes-figure">
              <img src={imgActivate} alt="Toggle to activate DiscourseMap" />
              <figcaption className="notes-figcaption">The view toggle at the top of the discussion page. &quot;Standard Canvas view&quot; shows the default thread; &quot;With DiscourseMap&quot; activates the visualization layer; &quot;Teacher setup&quot; (prototype) lets instructors edit the prompt text and theme labels in-browser.</figcaption>
            </figure>

            <div className="student-script">
              <h4><SpeechIcon /> How to explain this to students:</h4>
              <p>"This semester, we are using a tool called DiscourseMap. Whenever you open a discussion board, look for the 'With DiscourseMap' button at the top. Clicking it transforms our standard text thread into an interactive map that shows how all of our ideas connect — and where the gaps are."</p>
            </div>
          </section>

          <section id="finding-panel">
            <h2>2. Finding the Panel</h2>
            <p>Once activated, DiscourseMap embeds itself between the teacher's prompt and the student posts. This placement lets students read the thread chronologically as usual, while the map offers a "big picture" view of the same conversation.</p>

            <figure className="notes-figure">
              <img src={imgPanel} alt="DiscourseMap panel embedded in Canvas" />
              <figcaption className="notes-figcaption">The DiscourseMap panel in its collapsed state. Click "Expand" to open the visualization. The green dot indicates the map is live and analyzing posts.</figcaption>
            </figure>

            <p>The panel can be collapsed at any time with the "Collapse" button, keeping the reading experience uncluttered. The post count in the header updates as new posts are submitted during the session.</p>
          </section>

          <section id="navigating">
            <h2>3. Reading the Conversation Landscape</h2>
            <p>The map uses AI-driven clustering to transform the flat chronological thread into a spatial representation of its thematic landscape. Each element on the map is interactive.</p>

            <figure className="notes-figure">
              <img src={imgNav} alt="Thematic clusters and gap indicators" />
              <figcaption className="notes-figcaption">The expanded map showing active clusters, keyword pills, and a gap indicator (dashed circle, top left).</figcaption>
            </figure>

            <p><strong>Thematic Clusters (solid circles)</strong> represent active topics. Size reflects post volume. Clicking a cluster highlights the relevant posts in the thread below and shows a summary in the bottom panel. A red badge signals a consensus risk — most contributors are agreeing without challenge.</p>
            <p><strong>Gap Indicators (dashed circles)</strong> mark themes that the prompt or readings suggest but that no one has written about yet. Clicking a gap opens a reply panel pre-loaded with gap-specific writing prompts.</p>
            <p><strong>Keyword pills</strong> surface specific concepts within each cluster. They fade when you hover over a different cluster, helping students focus without overwhelming the view.</p>

            <div className="student-script">
              <h4><SpeechIcon /> How to explain this to students:</h4>
              <p>"Instead of just scrolling through text, open the map. The colored circles are the main themes the class is exploring — the bigger the circle, the more people have written about it. Now look for the dashed gray circles. Those are Gaps: nobody has written about those topics yet. Click a Gap and you'll get suggestions for how to be the first to contribute something genuinely new."</p>
            </div>
          </section>

          <section id="connections">
            <h2>4. Discovering Connections</h2>
            <p>Lines between clusters show conceptual relationships — places where two themes are in conversation. The map distinguishes between well-established connections and underexplored ones.</p>

            <figure className="notes-figure">
              <img src={imgConn} alt="Connection lines between clusters" />
              <figcaption className="notes-figcaption">Hovering over a connection line reveals the relationship label. Dashed lines marked ⚡ are underexplored — the link exists conceptually but no post has made it explicit.</figcaption>
            </figure>

            <div className="student-script">
              <h4><SpeechIcon /> How to explain this to students:</h4>
              <p>"See the lines connecting the circles? Hover over them to see how two different themes relate. If a line is dashed and marked ⚡, it means the connection is there but no one has written the post that makes it explicit yet. That is a high-value opportunity: write the post that bridges those two ideas for everyone."</p>
            </div>
          </section>

          <section id="writing">
            <h2>5. Writing with Epistemic Prompts</h2>
            <p>When a student clicks Reply, a small "💡 Need writing guidance?" button appears above the text area. The prompts are available on demand rather than shown automatically — this keeps the reply interface clean while ensuring support is always one click away.</p>

            <figure className="notes-figure">
              <img src={imgPrompt} alt="Reply box with epistemic prompts" />
              <figcaption className="notes-figcaption">The reply panel with cluster-aware epistemic prompts expanded. Clicking a prompt inserts a sentence starter into the text area.</figcaption>
            </figure>

            <p>Prompts are context-aware: replying in "Social Media & Bias Awareness" surfaces different scaffolds than replying in "Heuristics & Design Practice." Students can toggle to map-wide prompts for a broader view of opportunities. Clicking a prompt inserts a sentence starter they can edit freely.</p>

            <div className="student-script">
              <h4><SpeechIcon /> How to explain this to students:</h4>
              <p>"When you click Reply, you'll see a small 'Need writing guidance?' button. You don't have to use it — but if you're unsure how to make your post add something new, click it. The suggestions are based on what's already been said in this specific cluster. Click a prompt to get a sentence starter, then make it your own."</p>
            </div>
          </section>

          <section id="fullview">
            <h2>6. Full View — Exploring the Map in Depth</h2>
            <p>For students who want to explore the discussion landscape more deliberately before writing, the <strong>Open Full View ↗</strong> button in the map header opens a dedicated three-panel workspace in a new browser tab.</p>

            <div style={{ background:"#F0F4FF", border:"1px solid #C7D2FE", borderRadius:"8px", padding:"16px 20px", margin:"24px 0" }}>
              <p style={{ margin:0 }}><strong>How it works:</strong> Opening Full View passes the current state of the map — clusters, posts, and connections — to the new tab via the browser's session storage. The tab is self-contained. Changes made in Full View do not sync back to the Canvas view, so students should use it as an exploration and planning space before writing.</p>
            </div>

            <p>The Full View workspace has three panels:</p>

            <p><strong>Left — Discourse Map.</strong> The same interactive map, rendered larger on a focused dark background. Clicking a cluster drives the other two panels. Zoom and pan work identically to the embedded view.</p>

            <p><strong>Center — Theme Explorer.</strong> An organized list of all clusters and gaps. Clicking a cluster expands it to show post excerpts, contributor names, and the connections it shares with other clusters. This panel makes it easy to read across the discussion thematically rather than chronologically. Gap clusters direct students back to Canvas to contribute.</p>

            <p><strong>Right — Epistemic Workspace.</strong> Three tools in one: a Discussion Health summary (active clusters, unexplored gaps, underexplored connections, consensus risks), a Writing Angles section with context-aware prompts for the selected cluster, and a free-form Notes area. Writing angle starters can be copied to clipboard and pasted into the Canvas reply box.</p>

            <div className="student-script">
              <h4><SpeechIcon /> How to explain this to students:</h4>
              <p>"Before you write, try clicking 'Open Full View.' It opens the map in its own tab so you can really dig in — read what people have said cluster by cluster, see where the gaps and underexplored connections are, and take notes. When you find a writing angle you want to use, copy the sentence starter and bring it back to Canvas. Think of it as your planning space before you write."</p>
            </div>
          </section>

          <section id="faq">
            <h2>FAQ — common pilot questions</h2>
            <p><strong>Are Writing Angles generated by AI?</strong> In this prototype they are <em>not</em>. They are hand-authored scaffolds that switch based on which theme cluster is selected (and which thread post is used as context in Full View). A future version could personalize them with a model.</p>
            <p><strong>Who defines the clusters?</strong> The prototype assumes the instructor (or instructional designer) frames the thematic regions up front — similar to weekly learning goals — and student posts are assigned to one primary theme, optionally tagged with additional themes. Automatic clustering from raw text is a possible future extension.</p>
            <p><strong>Why do replies to different authors in the same cluster sometimes show similar prompts?</strong> Scaffolds are keyed primarily to the <em>cluster</em>, not to each author&apos;s wording, so the same theme tends to offer the same angles. The reply panel still names the person you are replying to in the header.</p>
            <p><strong>Teacher setup vs. student view.</strong> Use the &quot;Teacher setup&quot; prototype tab to edit the discussion framing and theme labels in-browser (mock only; nothing is saved to a server). Switch to &quot;With DiscourseMap&quot; to preview how students would see those strings.</p>
          </section>

          <section id="pedagogy">
            <h2>Design Rationale</h2>
            <p>DiscourseMap is grounded in three principles from the learning sciences and HCI research that shaped each design decision.</p>

            <p><strong>Epistemic visibility over performance.</strong> Standard LMS forums make it easy to post the minimum — reply in place, agree with what's already said, disengage once your quota is met. DiscourseMap does not change the norms of participation; it changes what students can see. By spatializing the discussion, it surfaces what is well-covered, what is contested, and what is absent — making it harder to ignore the gaps and easier to contribute something that genuinely moves the conversation forward.</p>

            <p><strong>Scaffolding on demand.</strong> Epistemic prompts appear only when a student asks for them. This reflects evidence that unsolicited scaffolding can increase cognitive load and reduce autonomy. The "Need writing guidance?" button keeps the reply interface clean by default. Gap clicks are the exception: they pre-load prompts because a student who clicks a gap has already signaled intent to explore unexplored territory.</p>

            <p><strong>Minimal footprint in the existing workflow.</strong> The tool is embedded in Canvas, not a replacement for it. Students can ignore the map entirely and use the standard thread view. The Full View is opt-in. This design choice reflects the goal of reducing adoption barriers: the tool should reward curiosity without punishing disengagement.</p>
          </section>

        </div>
      </main>
    </div>
  );
};

export default DiscourseMapGuide;