import { useState, useRef } from "react";

// Canvas LMS color system — match Canvas screenshot
const C = {
  white: "#FFFFFF",
  bg: "#F5F5F5",
  canvasBlue: "#0374B5",
  canvasDarkBlue: "#0B3B5C",
  sidebarDark: "#002D62",
  headerLight: "#F5F5F5",
  linkBlue: "#0374B5",
  text: "#2D3B45",
  textLight: "#6B7780",
  border: "#C7CDD1",
  borderLight: "#E8EAED",
  sidebarBg: "#FFFFFF",
  headerBg: "#394B58",
  vizPurple: "#7C3AED",
  vizTeal: "#0891B2",
  vizAmber: "#D97706",
  vizRose: "#E11D48",
  vizGreen: "#059669",
  vizBlue: "#2563EB",
  gapGray: "#94A3B8",
};

// ——— Mock data: match Canvas screenshot (Teacher's guidelines wording) ———
const DISCUSSION_PROMPT = {
  date: "Posted Jan 20, 2025 10:09pm",
  lastEdited: "Last edited Jan 21, 2025 12:59am",
  title: "Week 10 - Technology & Cognition, Motivation, and Behavior [Group 1]",
  body: `A minimum of 2 posts per week is required. For the 2-post minimum per week, one post should include:

1. Selected information or data from the literature;
2. Interpretation of the literature;
3. Relationships you draw from the literature between your understanding and another student's post, literature from the class, or literature from outside sources;
4. Experiences you have had based on practice or points you would like to contribute based on your own understanding.

The second post should be a response to a classmate's post.

Beyond the 2-post minimum, you can respond or comment as many times as you would like without adhering to the above criteria.

Please make your first post no later than Thursday at midnight and read and respond to each other's ideas in the second post no later than Saturday morning at 9 am after which the facilitators will work to construct that week's in-class facilitation activities.`,
  replies: 15,
  unread: 11,
};

const POSTS = [
  { id: "p1", authorId: "yuna", authorName: "Yuna K.", initials: "YK", date: "Feb 12, 2025 4:20pm", lastReply: "Feb 13, 2025 9:15am", replyCount: 2, text: "I see confirmation bias everywhere in my social media feeds. I tend to follow accounts that align with my views, and the algorithm keeps showing me more of the same. Kahneman's System 1 and System 2 thinking really helped me understand why—my brain defaults to quick, intuitive judgments (System 1) and only sometimes engages in slower, analytical thinking (System 2) when I'm scrolling. I've started asking myself: am I just reinforcing what I already believe?", clusterId: "social-media-bias", parentId: null },
  { id: "p2", authorId: "marcus", authorName: "Marcus T.", initials: "MT", date: "Feb 12, 2025 11:16pm", lastReply: "Feb 14, 2025 10:00am", replyCount: 1, text: "The availability heuristic really hit home for me with TikTok. Whatever trend or sound is dominating my For You page starts to feel like 'everyone is talking about this' even when it's just a bubble. I've been reflecting on my news consumption too—dramatic headlines stick in my mind more than dry statistics, so I probably overestimate some risks and underestimate others. The readings made me more aware of how my brain takes shortcuts.", clusterId: "social-media-bias", parentId: null },
  { id: "p3", authorId: "priya", authorName: "Priya S.", initials: "PS", date: "Feb 13, 2025 10:23am", lastReply: "Feb 14, 2025 3:09pm", replyCount: 1, text: "I'm connecting this to UX design. Nielsen's usability heuristics (visibility, consistency, recognition over recall) overlap with the cognitive heuristics we read about. When we design interfaces, we're often intentionally leveraging these shortcuts—e.g., making one option more salient so users 'choose' it without much thought. It raises an ethical question: when does guiding users cross into manipulating them?", clusterId: "heuristics-design", parentId: null },
  { id: "p4", authorId: "james", authorName: "James L.", initials: "JL", date: "Feb 13, 2025 8:00pm", lastReply: null, replyCount: 0, text: "Anchoring bias is huge in online shopping. I'll see a 'was $199, now $79' and my brain treats $79 as a steal without really questioning whether I need the item or what it's worth. Same with 'limited time' and countdown timers—they create urgency that bypasses deliberate thinking. I've been trying to pause and ask: what would I pay if I didn't see the original price?", clusterId: "social-media-bias", parentId: null },
  { id: "p5", authorId: "sofia", authorName: "Sofia R.", initials: "SR", date: "Feb 14, 2025 9:00am", lastReply: null, replyCount: 0, text: "The representative heuristic made me think about stereotyping in media representation. We often assume someone fits a category based on how they look or how they're framed—in news, film, ads. Framing effects are powerful too: the same fact can feel very different depending on whether it's framed as a gain or a loss. Headlines that say '90% survive' vs '10% die' trigger different reactions even when the data is identical.", clusterId: "media-framing", parentId: null },
  { id: "p6", authorId: "david", authorName: "David H.", initials: "DH", date: "Feb 14, 2025 2:30pm", lastReply: null, replyCount: 0, text: "I'm interested in how AI recommendation systems exploit cognitive biases. Netflix, YouTube, and social feeds are optimized to keep us engaged—they use what we know about attention and habit formation. There's an ethical tension: these systems can deepen filter bubbles and amplify confirmation bias. Should we hold platforms accountable for designing around our heuristics, or is it on users to be more critical?", clusterId: "ai-cognitive-bias", parentId: null },
  { id: "p7", authorId: "yuna", authorName: "Yuna K.", initials: "YK", date: "Feb 14, 2025 11:00am", lastReply: null, replyCount: 0, text: "Priya, your UX angle is really interesting. I wonder if we can think of heuristic-based design as intentionally exploiting cognitive shortcuts—and whether that's always bad or sometimes helpful (e.g., reducing cognitive load for routine tasks). Where do we draw the line?", clusterId: "heuristics-design", parentId: "p3" },
  { id: "p8", authorId: "marcus", authorName: "Marcus T.", initials: "MT", date: "Feb 14, 2025 10:00am", lastReply: null, replyCount: 0, text: "Yuna, I had the same experience with confirmation bias. I deleted a few highly partisan accounts and added some that challenge my views—my feed is less comfortable but I feel like I'm at least seeing more than one side. Small change but it helped.", clusterId: "social-media-bias", parentId: "p1" },
];

const CLUSTERS = [
  { id: "social-media-bias", label: "Social Media &\nBias Awareness", shortLabel: "Social Media & Bias Awareness", x: 42, y: 38, size: 48, color: C.vizPurple, postIds: ["p1", "p2", "p4", "p8"], isGap: false, consensusWarning: "4 posts support similar views. No critical counter-perspectives yet." },
  { id: "heuristics-design", label: "Heuristics &\nDesign Practice", shortLabel: "Heuristics & Design Practice", x: 28, y: 68, size: 36, color: C.vizGreen, postIds: ["p3", "p7"], isGap: false },
  { id: "media-framing", label: "Media Framing &\nRepresentation", shortLabel: "Media Framing & Representation", x: 72, y: 22, size: 28, color: C.vizAmber, postIds: ["p5"], isGap: false },
  { id: "ai-cognitive-bias", label: "AI Tools &\nCognitive Bias", shortLabel: "AI Tools & Cognitive Bias", x: 75, y: 65, size: 28, color: C.vizBlue, postIds: ["p6"], isGap: false },
  { id: "educational-implications", label: "Educational\nImplications", shortLabel: "Educational Implications", x: 22, y: 28, size: 32, color: C.gapGray, postIds: [], isGap: true },
];

const CONNECTIONS = [
  { from: "social-media-bias", to: "ai-cognitive-bias", strength: "strong", label: "Both discuss algorithmic influence on cognition" },
  { from: "heuristics-design", to: "social-media-bias", strength: "strong", label: "Design choices exploiting biases in media use" },
  { from: "media-framing", to: "social-media-bias", strength: "strong", label: "Framing as a bias mechanism in content" },
  { from: "media-framing", to: "ai-cognitive-bias", strength: "underexplored", label: "Could AI-driven content curation amplify framing effects?" },
];
const connKey = (c) => `${c.from}::${c.to}`;
const connFromKey = (k) => k.split("::");

const KEYWORDS = [
  { label: "confirmation bias", x: 38, y: 32, clusterId: "social-media-bias" },
  { label: "System 1", x: 48, y: 42, clusterId: "social-media-bias" },
  { label: "algorithm", x: 52, y: 35, clusterId: "social-media-bias" },
  { label: "availability heuristic", x: 35, y: 45, clusterId: "social-media-bias" },
  { label: "Nielsen", x: 22, y: 72, clusterId: "heuristics-design" },
  { label: "UX", x: 32, y: 65, clusterId: "heuristics-design" },
  { label: "framing effects", x: 78, y: 18, clusterId: "media-framing" },
  { label: "stereotyping", x: 68, y: 26, clusterId: "media-framing" },
  { label: "AI recommendations", x: 80, y: 60, clusterId: "ai-cognitive-bias" },
  { label: "filter bubbles", x: 72, y: 70, clusterId: "ai-cognitive-bias" },
];

const EPISTEMIC_PROMPTS = [
  { id: "gap", icon: "🔍", label: "Explore a gap", text: "No one has discussed how understanding cognitive biases could inform teaching or instructional design. What's your perspective?", starter: "Understanding cognitive biases could inform teaching and instructional design by " },
  { id: "consensus", icon: "⚖️", label: "Challenge a consensus", text: "4 posts describe how social media reinforces biases. Can you think of cases where social media might actually *reduce* bias through exposure to diverse perspectives?", starter: "While social media often reinforces biases, it might also reduce bias when " },
  { id: "bridge", icon: "🔗", label: "Bridge two ideas", text: "Sofia's point about media framing and David's point about AI recommendation systems seem related but haven't been connected. How might algorithmic curation interact with framing effects?", starter: "Algorithmic curation could interact with framing effects by " },
];

function getContextualPrompts(targetPost) {
  if (!targetPost) return EPISTEMIC_PROMPTS;
  const cluster = CLUSTERS.find((c) => c.id === targetPost.clusterId);
  if (!cluster) return EPISTEMIC_PROMPTS;
  const name = targetPost.authorName;
  const sofia = POSTS.find((p) => p.authorId === "sofia");
  const david = POSTS.find((p) => p.authorId === "david");
  switch (cluster.id) {
    case "social-media-bias":
      return [
        { id: "social-consensus", icon: "⚖️", label: "Situate this experience", text: `Several posts in "${cluster.shortLabel}" describe similar patterns of bias in feeds. How does ${name}'s example resonate with or complicate what others have shared?`, starter: `Building on ${name}'s experience in this cluster, one way it resonates with or complicates other posts is ` },
        { id: "social-counter", icon: "⚖️", label: "Introduce a counter-perspective", text: "Most posts here emphasize how social media reinforces bias. Can you think of cases where platforms, algorithms, or user practices might actually reduce bias or broaden perspectives?", starter: "One way social media might reduce rather than reinforce bias is " },
        { id: "social-bridge", icon: "🔗", label: "Bridge to another region", text: `Try connecting this social media example to another part of the discourse map—for instance, ${sofia ? `${sofia.authorName}'s point about media framing` : "the framing cluster"} or ${david ? `${david.authorName}'s post on AI recommendations` : "the AI tools cluster"}.`, starter: `Connecting this social media example to framing and AI recommendation systems, one interaction I see is ` },
      ];
    case "heuristics-design":
      return [
        { id: "design-ethics", icon: "🔍", label: "Probe design ethics", text: `This cluster focuses on how design heuristics shape user behavior. In responding to ${name}, how might you distinguish between helpful guidance and manipulative design?`, starter: `Responding to ${name}, I would distinguish between supportive and manipulative uses of heuristics in design by ` },
        { id: "design-edu", icon: "🔍", label: "Connect to learning design", text: "No one has yet applied these design insights to teaching or instructional design. How could similar heuristics support or hinder learning environments?", starter: "Thinking about instructional or learning design, these heuristic-based design choices could influence learners by " },
        { id: "design-bridge", icon: "🔗", label: "Bridge to social media", text: `How might the UX decisions ${name} highlights relate to social media interfaces that reinforce or challenge bias in the "${CLUSTERS.find(c => c.id === "social-media-bias")?.shortLabel || "social media"}" region?`, starter: `Connecting these UX heuristics to social media interfaces, one overlap I notice is ` },
      ];
    case "media-framing":
      return [
        { id: "framing-gap", icon: "🔍", label: "Surface implications", text: `In responding to ${name}, consider how understanding framing and stereotyping might change how we teach news literacy or critical media analysis.`, starter: `If we treated ${name}'s example as a starting point for news literacy instruction, one implication would be ` },
        { id: "framing-bridge-ai", icon: "🔗", label: "Bridge framing and AI", text: `The map shows an underexplored connection between media framing and AI recommendation systems. How might algorithmic curation amplify or dampen the framing effects ${name} describes?`, starter: `Algorithmic curation could interact with the framing effects in ${name}'s example by ` },
        { id: "framing-perspective", icon: "⚖️", label: "Add a new lens", text: "Most discussion of framing here focuses on individual reactions. Can you bring in a structural or institutional perspective (e.g., newsroom practices, platform policies)?", starter: "Looking beyond individual reactions, one structural factor that shapes framing in this case is " },
      ];
    case "ai-cognitive-bias":
      return [
        { id: "ai-ethics", icon: "🔍", label: "Interrogate responsibilities", text: `In responding to ${name}, consider who should be responsible for managing cognitive biases in AI-mediated environments: designers, platforms, educators, or users?`, starter: `Responding to ${name}, I would locate primary responsibility for addressing cognitive biases in AI systems with ` },
        { id: "ai-bridge-framing", icon: "🔗", label: "Bridge to framing & media", text: `Try linking algorithmic recommendations to framing in headlines or timelines—for example, how ranking and selection might reinforce certain frames over others across the map.`, starter: "One way recommendation algorithms can reinforce particular frames across a feed is " },
        { id: "ai-edu-gap", icon: "🔍", label: "Educational implications", text: "No one has yet explored how understanding these AI-driven biases might shape digital literacy or data literacy curricula.", starter: "If we took AI-driven cognitive biases seriously in education, one change to digital literacy instruction would be " },
      ];
    default:
      return EPISTEMIC_PROMPTS;
  }
}

const CURRENT_USER_ID = "yuna";

function CanvasHeader() {
  return (
    <div style={{ background: C.headerLight, height: "52px", display: "flex", alignItems: "center", padding: "0 20px", gap: "16px", borderBottom: `1px solid ${C.borderLight}`, flexShrink: 0 }}>
      <button style={{ background: "none", border: "none", padding: 8, cursor: "pointer", color: C.text, fontSize: "20px" }} aria-label="Menu">☰</button>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "15px", fontFamily: "Lato, Arial, sans-serif", color: C.text }}>
        <span style={{ color: C.linkBlue, cursor: "pointer" }}>MSTU4133001</span>
        <span style={{ color: C.textLight }}>›</span>
        <span style={{ color: C.linkBlue, cursor: "pointer" }}>Discussions</span>
        <span style={{ color: C.textLight }}>›</span>
        <span style={{ color: C.text, fontWeight: "500" }}>Week 10 - Technology & Cognition, Motivation, and Behavior [Group 1]</span>
      </div>
      <div style={{ marginLeft: "auto", display: "flex", gap: "10px", alignItems: "center" }}>
        <select style={{ padding: "8px 12px", border: `1px solid ${C.border}`, borderRadius: "4px", fontSize: "14px", fontFamily: "Lato, Arial, sans-serif", background: C.white, color: C.text }}><option>All</option></select>
        <input placeholder="Search entries or author..." style={{ padding: "8px 12px", border: `1px solid ${C.border}`, borderRadius: "4px", fontSize: "14px", width: "220px", fontFamily: "Lato, Arial, sans-serif" }} />
        <select style={{ padding: "8px 12px", border: `1px solid ${C.border}`, borderRadius: "4px", fontSize: "14px", fontFamily: "Lato, Arial, sans-serif", background: C.white, color: C.text }}><option>Newest First</option></select>
      </div>
    </div>
  );
}

function Sidebar({ activeItem }) {
  const items = ["Account", "Dashboard", "Courses", "Groups", "Calendar", "Inbox", "History", "Help", "myCoursEval"];
  const showBadge = { Inbox: 54, History: 10 };
  return (
    <div style={{ width: "100px", minWidth: "100px", background: C.sidebarDark, padding: "14px 0", display: "flex", flexDirection: "column", color: C.white, fontFamily: "Lato, Arial, sans-serif", flexShrink: 0 }}>
      <div style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.2)", marginBottom: 10, minHeight: 56, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <img src="/TC_Shield_White.png" alt="Teachers College Columbia University" style={{ width: "100%", maxWidth: "100%", maxHeight: 48, objectFit: "contain", display: "block", mixBlendMode: "screen" }} />
      </div>
      {items.map((item) => {
        const isActive = activeItem === item;
        return (
          <div key={item} style={{ padding: "12px 12px", fontSize: "15px", display: "flex", alignItems: "center", gap: 12, background: isActive ? "rgba(255,255,255,0.15)" : "transparent", borderLeft: isActive ? "4px solid #7BA4C7" : "4px solid transparent", cursor: "pointer", color: "rgba(255,255,255,0.95)" }}>
            <span style={{ flex: 1 }}>{item}</span>
            {showBadge[item] != null && <span style={{ background: C.white, color: C.sidebarDark, fontSize: "12px", fontWeight: "600", minWidth: 22, height: 22, borderRadius: 11, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{showBadge[item]}</span>}
          </div>
        );
      })}
      <div style={{ marginTop: "auto", padding: "14px 12px", borderTop: "1px solid rgba(255,255,255,0.2)", cursor: "pointer", color: "rgba(255,255,255,0.85)", fontSize: "20px", textAlign: "center" }}>‹</div>
    </div>
  );
}

function DiscourseMapCollapsedBar({ onExpand }) {
  return (
    <div onClick={onExpand} style={{ padding: "10px 20px", background: C.white, border: `1px solid ${C.border}`, borderRadius: "4px", marginBottom: "18px", cursor: "pointer", display: "flex", alignItems: "center", gap: "12px" }}>
      <span style={{ width: 10, height: 10, borderRadius: "50%", background: C.vizGreen, animation: "pulse 1.5s ease-in-out infinite" }} />
      <span style={{ fontSize: "15px", fontWeight: "600", color: C.text, fontFamily: "Lato, Arial, sans-serif" }}>DiscourseMap</span>
      <span title="DiscourseMap visualizes thematic clusters and connections in the discussion, highlights gaps and missing counter-perspectives, and offers epistemic prompts to guide your next contribution." style={{ width: 20, height: 20, borderRadius: "50%", border: `1px solid ${C.border}`, color: C.textLight, fontSize: "12px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "Lato, Arial, sans-serif", cursor: "default" }} onClick={(e) => e.stopPropagation()}>i</span>
      <span style={{ fontSize: "13px", color: C.textLight, fontFamily: "Lato, Arial, sans-serif" }}>— 8 posts analyzed · Visible after your initial post</span>
      <button onClick={(e) => { e.stopPropagation(); onExpand(); }} style={{ marginLeft: "auto", background: C.canvasBlue, color: C.white, border: "none", padding: "6px 14px", borderRadius: "4px", fontSize: "13px", cursor: "pointer", fontFamily: "Lato, Arial, sans-serif" }}>Expand</button>
    </div>
  );
}

function DiscourseHealthSummary() {
  const gapCount = CLUSTERS.filter((c) => c.isGap).length;
  const consensusCount = CLUSTERS.filter((c) => c.consensusWarning).length;
  const underexploredCount = CONNECTIONS.filter((c) => c.strength === "underexplored").length;
  return (
    <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", padding: "10px 16px", background: "#F0F2F5", border: `1px solid ${C.borderLight}`, borderRadius: "4px", fontSize: "13px", fontFamily: "Lato, Arial, sans-serif", color: C.textLight }}>
      <span><strong style={{ color: C.text }}>5</strong> clusters</span>
      <span>·</span>
      <span><strong style={{ color: C.text }}>{gapCount + underexploredCount}</strong> gaps identified</span>
      <span>·</span>
      <span><strong style={{ color: C.text }}>{consensusCount}</strong> consensus area{consensusCount !== 1 ? "s" : ""} need{consensusCount === 1 ? "s" : ""} counter-perspectives</span>
    </div>
  );
}

function getClusterById(id) {
  return CLUSTERS.find((c) => c.id === id);
}

function DiscourseMapExpanded({ hoveredCluster, setHoveredCluster, selectedCluster, setSelectedCluster, myPostsHighlight, onClose, highlightedConnection, setHighlightedConnection, zoom, onZoomChange, pan = { x: 0, y: 0 }, setPan }) {
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "4px", marginBottom: "18px", overflow: "hidden" }}>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }`}</style>
      <div style={{ padding: "12px 20px", borderBottom: `1px solid ${C.borderLight}`, background: "#FAFBFC", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: 9, height: 9, borderRadius: "50%", background: C.vizGreen }} />
          <span style={{ fontSize: "16px", fontWeight: "600", color: C.text, fontFamily: "Lato, Arial, sans-serif" }}>Discourse Map</span>
          <span title="DiscourseMap visualizes thematic clusters and connections in the discussion, highlights gaps and missing counter-perspectives, and offers epistemic prompts to guide your next contribution." style={{ width: 20, height: 20, borderRadius: "50%", border: `1px solid ${C.border}`, color: C.textLight, fontSize: "12px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "Lato, Arial, sans-serif", cursor: "default" }}>i</span>
          <span style={{ fontSize: "13px", color: C.textLight, fontFamily: "Lato, Arial, sans-serif" }}>— 8 posts analyzed · Visible after your initial post</span>
        </div>
        <button onClick={onClose} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: "4px", padding: "6px 14px", fontSize: "13px", color: C.textLight, cursor: "pointer", fontFamily: "Lato, Arial, sans-serif" }}>Collapse</button>
      </div>
      <div style={{ position: "relative", height: "400px", background: "#FAFBFC" }}>
        {onZoomChange && (
          <div style={{ position: "absolute", top: 12, right: 14, zIndex: 5, background: "rgba(255,255,255,0.98)", borderRadius: "4px", border: `1px solid ${C.borderLight}`, padding: "6px 10px", display: "flex", alignItems: "center", gap: 6, fontSize: "12px", fontFamily: "Lato, Arial, sans-serif", color: C.textLight, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <span style={{ marginRight: 4 }}>Zoom</span>
            <button onClick={() => onZoomChange(Math.max(0.8, (zoom || 1) - 0.2))} style={{ border: `1px solid ${C.border}`, background: C.white, borderRadius: "3px", width: 22, height: 22, lineHeight: 1, cursor: "pointer", fontSize: "14px" }}>-</button>
            <span style={{ minWidth: 36, textAlign: "center" }}>{Math.round((zoom || 1) * 100)}%</span>
            <button onClick={() => onZoomChange(Math.min(1.6, (zoom || 1) + 0.2))} style={{ border: `1px solid ${C.border}`, background: C.white, borderRadius: "3px", width: 22, height: 22, lineHeight: 1, cursor: "pointer", fontSize: "14px" }}>+</button>
            <button onClick={() => { onZoomChange(1); setSelectedCluster(null); setHoveredCluster(null); setHighlightedConnection(null); setPan && setPan({ x: 0, y: 0 }); }} style={{ border: `1px solid ${C.border}`, background: C.white, borderRadius: "3px", padding: "0 8px", height: 22, cursor: "pointer", fontSize: "12px" }}>Reset</button>
          </div>
        )}
        <div style={{ width: "100%", height: "100%", overflow: "hidden", position: "relative", cursor: isDragging ? "grabbing" : "grab", userSelect: "none" }}
          onWheel={(e) => { if (!onZoomChange) return; e.preventDefault(); const current = zoom || 1; const factor = e.deltaY > 0 ? -0.1 : 0.1; const next = Math.min(1.6, Math.max(0.8, current + factor)); if (next !== current) onZoomChange(next); }}
          onMouseDown={(e) => { if (e.button !== 0 || !setPan) return; setIsDragging(true); dragStart.current = { startX: e.clientX, startY: e.clientY, startPanX: pan?.x ?? 0, startPanY: pan?.y ?? 0 }; }}
          onMouseMove={(e) => { if (!isDragging || !setPan) return; setPan({ x: dragStart.current.startPanX + (e.clientX - dragStart.current.startX), y: dragStart.current.startPanY + (e.clientY - dragStart.current.startY) }); }}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
        >
          <div style={{ width: "100%", height: "100%", transform: `translate(${pan?.x ?? 0}px, ${pan?.y ?? 0}px) scale(${zoom || 1})`, transformOrigin: "50% 50%", transition: isDragging ? "none" : "transform 0.2s ease-out", position: "relative" }}>
            <svg width="100%" height="100%" style={{ position: "absolute", top: 0, left: 0 }}>
              {CONNECTIONS.map((conn, i) => {
                const from = getClusterById(conn.from);
                const to = getClusterById(conn.to);
                if (!from || !to) return null;
                const dashed = conn.strength === "underexplored";
                const key = connKey(conn);
                const highlighted = highlightedConnection === key || highlightedConnection === connKey({ from: conn.to, to: conn.from });
                return (
                  <g key={i} onMouseEnter={() => setHighlightedConnection(key)} onMouseLeave={() => setHighlightedConnection(null)} style={{ cursor: "pointer" }}>
                    <line x1={`${from.x}%`} y1={`${from.y}%`} x2={`${to.x}%`} y2={`${to.y}%`} stroke="transparent" strokeWidth="14" />
                    <line x1={`${from.x}%`} y1={`${from.y}%`} x2={`${to.x}%`} y2={`${to.y}%`} stroke={highlighted ? C.canvasBlue : "#CBD5E1"} strokeWidth={highlighted ? 3 : 1} strokeDasharray={dashed ? "6 4" : "none"} opacity={highlighted ? 0.9 : dashed ? 0.5 : 0.45} />
                  </g>
                );
              })}
              {KEYWORDS.map((kw, i) => {
                const vis = !hoveredCluster || hoveredCluster === kw.clusterId;
                return <text key={i} x={`${kw.x}%`} y={`${kw.y - 1.5}%`} textAnchor="middle" fill="#64748B" fontSize="9" fontFamily="Lato, Arial, sans-serif" opacity={vis ? 0.7 : 0.15} style={{ transition: "opacity 0.3s", pointerEvents: "none" }}>{kw.label}</text>;
              })}
              {CLUSTERS.map((cl) => {
                const isHovered = hoveredCluster === cl.id;
                const isSelected = selectedCluster === cl.id;
                const hasMyPost = myPostsHighlight && cl.postIds.some((pid) => POSTS.find((p) => p.id === pid && p.authorId === CURRENT_USER_ID));
                const showConsensus = cl.consensusWarning && (isHovered || isSelected);
                return (
                  <g key={cl.id} onMouseEnter={() => setHoveredCluster(cl.id)} onMouseLeave={() => setHoveredCluster(null)}
                    onClick={() => { const nextSelected = selectedCluster === cl.id ? null : cl.id; setSelectedCluster(nextSelected); if (nextSelected && onZoomChange && (zoom || 1) < 1.2) onZoomChange(1.2); }} style={{ cursor: "pointer" }}>
                    {cl.isGap ? (
                      <><circle cx={`${cl.x}%`} cy={`${cl.y}%`} r={cl.size * 0.9} fill="none" stroke={C.gapGray} strokeWidth="2" strokeDasharray="6 4" opacity={0.6} /><text x={`${cl.x}%`} y={`${cl.y - 2}%`} textAnchor="middle" fill={C.textLight} fontSize="10" fontFamily="Lato, Arial, sans-serif">?</text>{cl.label.split("\n").map((line, j) => <text key={j} x={`${cl.x}%`} y={`${cl.y + (j + 1) * 3.5}%`} textAnchor="middle" fill={C.textLight} fontSize="10" fontFamily="Lato, Arial, sans-serif" fontStyle="italic">{line}</text>)}</>
                    ) : (
                      <><circle cx={`${cl.x}%`} cy={`${cl.y}%`} r={cl.size * 0.5} fill={cl.color} opacity={isHovered || isSelected ? 0.35 : 0.2} /><circle cx={`${cl.x}%`} cy={`${cl.y}%`} r={isHovered || isSelected ? cl.size * 0.28 : cl.size * 0.25} fill={cl.color} opacity={isHovered || isSelected ? 0.75 : 0.5} />{hasMyPost && <circle cx={`${cl.x + 12}%`} cy={`${cl.y - 10}%`} r="4" fill={C.canvasBlue} stroke={C.white} strokeWidth="1.5" />}{cl.label.split("\n").map((line, j) => <text key={j} x={`${cl.x}%`} y={`${cl.y + (j - 0.5) * 3.8}%`} textAnchor="middle" fill={C.text} fontSize="10.5" fontWeight="600" fontFamily="Lato, Arial, sans-serif" opacity={isHovered || isSelected ? 1 : 0.85}>{line}</text>)}<text x={`${cl.x}%`} y={`${cl.y + 6.5}%`} textAnchor="middle" fill={C.textLight} fontSize="9" fontFamily="Lato, Arial, sans-serif">{cl.postIds.length} post{cl.postIds.length !== 1 ? "s" : ""}</text>{showConsensus && <g transform={`translate(${cl.x + 14}%, ${cl.y - 14}%)`}><title>{cl.consensusWarning}</title><circle r="6" fill="#E11D48" opacity={0.9} /><text y="4" textAnchor="middle" fill="white" fontSize="9">!</text></g>}</>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
        <div style={{ position: "absolute", bottom: 12, left: 12, display: "flex", gap: 18, background: "rgba(255,255,255,0.98)", padding: "8px 14px", borderRadius: "4px", border: `1px solid ${C.borderLight}`, fontSize: "12px", fontFamily: "Lato, Arial, sans-serif", color: C.textLight, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", zIndex: 5 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: "50%", background: C.vizPurple, opacity: 0.65 }} /> Clustered</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: C.vizBlue, opacity: 0.5 }} /> Emerging</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 18, borderTop: "2px solid #CBD5E1" }} /> Connection</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 14, height: 14, border: `2px dashed ${C.gapGray}`, borderRadius: 2, opacity: 0.8 }} /> Gap</span>
        </div>
      </div>
      <div style={{ padding: "14px 20px", borderTop: `1px solid ${C.borderLight}`, background: "#FAFBFC" }}>
        {highlightedConnection ? (() => {
          const [fromId, toId] = connFromKey(highlightedConnection);
          const conn = CONNECTIONS.find((c) => (c.from === fromId && c.to === toId) || (c.from === toId && c.to === fromId));
          if (!conn) return <DiscourseHealthSummary />;
          const from = getClusterById(conn.from);
          const to = getClusterById(conn.to);
          const fromLabel = from?.shortLabel || conn.from;
          const toLabel = to?.shortLabel || conn.to;
          return (
            <div>
              <div style={{ fontSize: "12px", fontWeight: "600", color: C.textLight, fontFamily: "Lato, Arial, sans-serif", marginBottom: 6 }}>Connection between clusters</div>
              <div style={{ fontSize: "15px", fontWeight: "600", color: C.text, fontFamily: "Lato, Arial, sans-serif", marginBottom: 4 }}>{fromLabel} ↔ {toLabel}</div>
              <div style={{ fontSize: "14px", color: C.text, lineHeight: 1.5, fontFamily: "Lato, Arial, sans-serif" }}>{conn.label}</div>
              {conn.strength === "underexplored" && <div style={{ fontSize: "12px", color: C.textLight, marginTop: 6, fontStyle: "italic" }}>This link is underexplored in the discussion.</div>}
            </div>
          );
        })() : selectedCluster ? (() => {
          const cl = getClusterById(selectedCluster);
          if (!cl) return null;
          if (cl.isGap) return (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: "18px" }}>💡</span>
              <div>
                <div style={{ fontSize: "13px", fontWeight: "600", color: C.text, fontFamily: "Lato, Arial, sans-serif", marginBottom: 4 }}>This area hasn't been explored yet.</div>
                <div style={{ fontSize: "12px", color: C.textLight, fontFamily: "Lato, Arial, sans-serif" }}>Be the first to contribute! Consider: How might understanding cognitive biases inform teaching or instructional design?</div>
              </div>
            </div>
          );
          const posts = POSTS.filter((p) => cl.postIds.includes(p.id));
          const related = CONNECTIONS.filter((c) => c.from === cl.id || c.to === cl.id).map((c) => getClusterById(c.from === cl.id ? c.to : c.from)).filter(Boolean);
          return (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: cl.color }} />
                <span style={{ fontSize: "13px", fontWeight: "600", color: C.text, fontFamily: "Lato, Arial, sans-serif" }}>{cl.shortLabel}</span>
                <span style={{ fontSize: "12px", color: C.textLight, fontFamily: "Lato, Arial, sans-serif" }}>— {posts.length} contributor{posts.length !== 1 ? "s" : ""}</span>
              </div>
              {related.length > 0 && <div style={{ fontSize: "11px", color: C.textLight, marginBottom: 8, fontFamily: "Lato, Arial, sans-serif" }}>Related to: {related.map((r) => r.shortLabel).join(", ")}</div>}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {posts.map((p) => (
                  <div key={p.id} style={{ padding: "8px 10px", background: C.white, border: `1px solid ${C.borderLight}`, borderRadius: "4px", borderLeft: `4px solid ${cl.color}`, fontSize: "12px", color: C.text, fontFamily: "Lato, Arial, sans-serif", maxWidth: "320px" }}>
                    <strong style={{ color: C.linkBlue }}>{p.authorName}:</strong> {p.text.substring(0, 100)}...
                  </div>
                ))}
              </div>
            </div>
          );
        })() : <DiscourseHealthSummary />}
      </div>
    </div>
  );
}

function EpistemicPromptsPanel({ prompts, contextSummary, useGlobal, onToggleMode, onInsert, onDismiss }) {
  const list = prompts && prompts.length > 0 ? prompts : EPISTEMIC_PROMPTS;
  return (
    <div style={{ background: "#F0F7FC", border: `1px solid ${C.canvasBlue}`, borderRadius: "4px", padding: "12px 16px", marginBottom: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        <div>
          <div style={{ fontSize: "12px", fontWeight: "600", color: C.text, fontFamily: "Lato, Arial, sans-serif" }}>Based on the current discussion landscape, consider:</div>
          {contextSummary && <div style={{ fontSize: "11px", color: C.textLight, fontFamily: "Lato, Arial, sans-serif", marginTop: 2 }}>Scaffolds based on: {contextSummary} {useGlobal ? "(map‑wide)" : "(cluster‑aware)"}</div>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {onToggleMode && <button onClick={onToggleMode} style={{ background: "none", border: "none", fontSize: "11px", color: C.linkBlue, cursor: "pointer", fontFamily: "Lato, Arial, sans-serif", textDecoration: "underline" }}>{useGlobal ? "Back to cluster prompts" : "See map‑wide prompts"}</button>}
          <button onClick={onDismiss} style={{ background: "none", border: "none", fontSize: "11px", color: C.textLight, cursor: "pointer", fontFamily: "Lato, Arial, sans-serif" }}>Dismiss</button>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {list.map((prompt) => (
          <div key={prompt.id} onClick={() => onInsert(prompt.starter)} style={{ display: "flex", gap: "10px", padding: "10px 12px", background: C.white, border: `1px solid ${C.borderLight}`, borderRadius: "4px", cursor: "pointer" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.canvasBlue; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.borderLight; }}>
            <span style={{ fontSize: "16px" }}>{prompt.icon}</span>
            <div>
              <div style={{ fontSize: "12px", fontWeight: "600", color: C.text, fontFamily: "Lato, Arial, sans-serif", marginBottom: 2 }}>{prompt.label}</div>
              <div style={{ fontSize: "11px", color: C.textLight, fontFamily: "Lato, Arial, sans-serif", lineHeight: 1.4 }}>{prompt.text}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PostCard({ post, clusterColor, isMyPost, onReply, highlighted, onMouseEnter, onMouseLeave }) {
  return (
    <div onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={{ background: C.white, border: `1px solid ${highlighted ? C.canvasBlue : C.borderLight}`, borderLeft: `4px solid ${clusterColor || C.border}`, borderRadius: "4px", padding: "16px 20px", marginBottom: "14px", marginLeft: post.parentId ? "28px" : 0, transition: "border-color 0.2s", boxShadow: highlighted ? `0 0 0 1px ${C.canvasBlue}` : "none" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
        <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: isMyPost ? "#EBF5FF" : "#E8EAED", border: isMyPost ? `2px solid ${C.canvasBlue}` : "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "bold", color: C.text, fontFamily: "Lato, Arial, sans-serif" }}>{post.initials}</div>
        <div>
          <span style={{ fontSize: "14px", fontWeight: "600", color: C.linkBlue, fontFamily: "Lato, Arial, sans-serif" }}>{post.authorName}{isMyPost && <span style={{ fontSize: "10px", color: C.textLight, marginLeft: 6 }}>(You)</span>}</span>
          <div style={{ fontSize: "12px", color: C.textLight, fontFamily: "Lato, Arial, sans-serif" }}>{post.date}{post.lastReply && ` · Last reply ${post.lastReply}`}</div>
        </div>
      </div>
      <p style={{ fontSize: "14px", color: C.text, fontFamily: "Lato, Arial, sans-serif", lineHeight: "1.65", margin: "0 0 10px" }}>{post.text}</p>
      <div style={{ display: "flex", alignItems: "center", gap: "14px", paddingTop: "8px", borderTop: `1px solid ${C.borderLight}` }}>
        {post.replyCount > 0 && <span style={{ fontSize: "13px", color: C.linkBlue, fontFamily: "Lato, Arial, sans-serif", cursor: "pointer" }}>▾ {post.replyCount === 1 ? "Hide 1 Reply" : `Hide ${post.replyCount} Replies`}</span>}
        <span onClick={() => onReply(post)} style={{ fontSize: "13px", color: C.linkBlue, fontFamily: "Lato, Arial, sans-serif", cursor: "pointer" }}>↩ Reply</span>
        <span style={{ fontSize: "13px", color: C.linkBlue, fontFamily: "Lato, Arial, sans-serif", cursor: "pointer" }}>✉ Mark as Unread</span>
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("after");
  const [vizExpanded, setVizExpanded] = useState(true);
  const [hoveredCluster, setHoveredCluster] = useState(null);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [myPostsHighlight, setMyPostsHighlight] = useState(true);
  const [highlightedConnection, setHighlightedConnection] = useState(null);
  const [replyState, setReplyState] = useState(null);
  const [showPrompts, setShowPrompts] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [useGlobalPrompts, setUseGlobalPrompts] = useState(false);
  const replyingTo = replyState?.post;
  const replyText = replyState?.text ?? "";
  const insertStarter = (starter) => setReplyState((s) => ({ ...s, text: starter }));
  const openReply = (post) => { setReplyState({ post, text: "" }); setShowPrompts(true); setUseGlobalPrompts(false); };
  const closeReply = () => setReplyState(null);
  const rootPosts = POSTS.filter((p) => !p.parentId);
  const replyPosts = POSTS.filter((p) => p.parentId);
  const activeCluster = replyingTo ? CLUSTERS.find((c) => c.id === replyingTo.clusterId) : null;
  const contextSummary = replyingTo && activeCluster ? `${activeCluster.shortLabel} (${replyingTo.authorName}'s post)` : activeCluster ? activeCluster.shortLabel : "overall discussion map";
  const promptsForPanel = useGlobalPrompts ? EPISTEMIC_PROMPTS : getContextualPrompts(replyingTo);

  const renderReplyPanel = () => {
    if (replyingTo === undefined) return null;
    return (
      <div style={{ marginTop: "12px", padding: "18px", background: C.white, border: `1px solid ${C.border}`, borderRadius: "4px" }}>
        <div style={{ fontSize: "13px", color: C.textLight, marginBottom: "10px", fontFamily: "Lato, Arial, sans-serif" }}>{replyingTo ? `Replying to ${replyingTo.authorName}` : "Write a Reply"}</div>
        {showPrompts && <EpistemicPromptsPanel prompts={promptsForPanel} contextSummary={contextSummary} useGlobal={useGlobalPrompts} onToggleMode={() => setUseGlobalPrompts((v) => !v)} onInsert={insertStarter} onDismiss={() => setShowPrompts(false)} />}
        <textarea value={replyText} onChange={(e) => setReplyState((s) => ({ ...s, text: e.target.value }))} placeholder="Write your reply..." style={{ width: "100%", minHeight: "100px", padding: "12px", border: `1px solid ${C.border}`, borderRadius: "4px", fontSize: "14px", fontFamily: "Lato, Arial, sans-serif", resize: "vertical" }} />
        <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
          <button onClick={closeReply} style={{ padding: "6px 14px", border: `1px solid ${C.border}`, borderRadius: "3px", background: C.white, fontSize: "13px", color: C.text, cursor: "pointer", fontFamily: "Lato, Arial, sans-serif" }}>Cancel</button>
          <button style={{ padding: "6px 14px", border: "none", borderRadius: "3px", background: C.canvasBlue, color: C.white, fontSize: "13px", cursor: "pointer", fontFamily: "Lato, Arial, sans-serif" }}>Post Reply</button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "Lato, Arial, Helvetica, sans-serif" }}>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }`}</style>
      <CanvasHeader />
      <div style={{ display: "flex", minHeight: "calc(100vh - 52px)" }}>
        <Sidebar activeItem="Courses" />
        <div style={{ display: "flex", flex: 1, minWidth: 0 }}>
          <div style={{ width: "180px", minWidth: "180px", padding: "16px 0 16px 20px", borderRight: `1px solid ${C.borderLight}`, background: C.white, flexShrink: 0 }}>
            <div style={{ fontSize: "12px", color: C.textLight, marginBottom: "12px", fontFamily: "Lato, Arial, sans-serif" }}>Spring Term 2025</div>
            {["Home", "Syllabus", "Modules", "Assignments", "Discussions", "People", "Announcements", "Calendar", "TC Digital Media"].map((item) => (
              <div key={item} style={{ padding: "10px 12px", fontSize: "14px", fontFamily: "Lato, Arial, sans-serif", color: item === "Discussions" ? C.text : C.linkBlue, fontWeight: item === "Discussions" ? "600" : "400", borderLeft: item === "Discussions" ? `3px solid ${C.canvasBlue}` : "3px solid transparent", background: item === "Discussions" ? "#F0F7FC" : "transparent", cursor: "pointer", marginLeft: item === "Discussions" ? -3 : 0, paddingLeft: item === "Discussions" ? 15 : 12 }}>{item}</div>
            ))}
          </div>
          <div style={{ flex: 1, padding: "20px 28px", maxWidth: "960px", minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "18px", padding: "8px 14px", background: C.white, border: `1px solid ${C.border}`, borderRadius: "4px" }}>
              <span style={{ fontSize: "11px", color: C.textLight, fontWeight: "600" }}>PROTOTYPE:</span>
              {[{ id: "before", label: "Standard Canvas view" }, { id: "after", label: "With DiscourseMap" }].map((opt) => (
                <button key={opt.id} onClick={() => { setView(opt.id); setVizExpanded(true); }} style={{ padding: "4px 10px", borderRadius: "3px", border: view === opt.id ? `1px solid ${C.canvasBlue}` : `1px solid ${C.border}`, background: view === opt.id ? "#EBF5FF" : C.white, color: view === opt.id ? C.canvasBlue : C.textLight, fontSize: "12px", fontFamily: "Lato, Arial, sans-serif", cursor: "pointer", fontWeight: view === opt.id ? "600" : "400" }}>{opt.label}</button>
              ))}
            </div>
            <div style={{ background: C.white, border: `1px solid ${C.borderLight}`, borderRadius: "4px", padding: "20px 24px", marginBottom: "20px", borderLeft: `4px solid ${C.canvasBlue}` }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "8px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#E8EAED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "bold", color: C.text, flexShrink: 0 }}>JS</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "15px", fontWeight: "600", color: C.text, fontFamily: "Lato, Arial, sans-serif" }}>Jooeun Shim</span>
                        <span style={{ fontSize: "11px", color: C.textLight, padding: "2px 6px", borderRadius: "2px", background: "#F0F0F0" }}>AUTHOR</span>
                        <span style={{ fontSize: "11px", color: C.textLight, padding: "2px 6px", borderRadius: "2px", background: "#F0F0F0" }}>TEACHER</span>
                      </div>
                      <div style={{ fontSize: "12px", color: C.textLight, fontFamily: "Lato, Arial, sans-serif", marginTop: 2 }}>{DISCUSSION_PROMPT.date} | {DISCUSSION_PROMPT.lastEdited}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                      <span style={{ fontSize: "13px", color: C.textLight }}>{DISCUSSION_PROMPT.replies} Replies, {DISCUSSION_PROMPT.unread} Unread</span>
                      <span style={{ color: C.textLight, cursor: "pointer", fontSize: "16px" }} title="Bookmark">🔖</span>
                      <span style={{ color: C.textLight, cursor: "pointer", fontSize: "18px", fontWeight: "bold" }} title="More">⋮</span>
                    </div>
                  </div>
                </div>
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: "600", color: C.text, fontFamily: "Lato, Arial, sans-serif", margin: "14px 0 10px" }}>{DISCUSSION_PROMPT.title}</h2>
              <div style={{ fontSize: "15px", color: C.text, lineHeight: "1.7", whiteSpace: "pre-line" }}>
                {DISCUSSION_PROMPT.body.split(/(Thursday at midnight|Saturday morning at 9 am)/).map((part, i) => part === "Thursday at midnight" || part === "Saturday morning at 9 am" ? <span key={i} style={{ color: C.linkBlue, textDecoration: "underline" }}>{part}</span> : part)}
              </div>
              <button onClick={() => openReply(null)} style={{ marginTop: "18px", background: C.canvasBlue, color: "white", border: "none", padding: "10px 20px", borderRadius: "4px", fontSize: "15px", cursor: "pointer", fontFamily: "Lato, Arial, sans-serif" }}>Reply</button>
              {replyingTo === null && renderReplyPanel()}
            </div>
            {view === "after" && !vizExpanded && <DiscourseMapCollapsedBar onExpand={() => setVizExpanded(true)} />}
            {view === "after" && vizExpanded && (
              <DiscourseMapExpanded hoveredCluster={hoveredCluster} setHoveredCluster={setHoveredCluster} selectedCluster={selectedCluster} setSelectedCluster={setSelectedCluster} myPostsHighlight={myPostsHighlight} onClose={() => setVizExpanded(false)} highlightedConnection={highlightedConnection} setHighlightedConnection={setHighlightedConnection} zoom={zoom} onZoomChange={setZoom} pan={pan} setPan={setPan} />
            )}
            {view === "after" && vizExpanded && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <label style={{ fontSize: "12px", color: C.textLight, fontFamily: "Lato, Arial, sans-serif", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  <input type="checkbox" checked={myPostsHighlight} onChange={(e) => setMyPostsHighlight(e.target.checked)} /> Highlight "My Posts" in map
                </label>
              </div>
            )}
            {rootPosts.map((post) => {
              const replies = replyPosts.filter((r) => r.parentId === post.id);
              const cluster = CLUSTERS.find((c) => c.id === post.clusterId);
              const clusterColor = cluster?.isGap ? C.gapGray : cluster?.color;
              return (
                <div key={post.id}>
                  <PostCard post={post} clusterColor={view === "after" && vizExpanded ? clusterColor : undefined} isMyPost={post.authorId === CURRENT_USER_ID} onReply={openReply} highlighted={view === "after" && hoveredCluster && CLUSTERS.find((c) => c.id === hoveredCluster)?.postIds.includes(post.id)} onMouseEnter={() => { if (view === "after" && cluster) setHoveredCluster(post.clusterId); }} onMouseLeave={() => { if (view === "after") setHoveredCluster(null); }} />
                  {replyingTo && replyingTo.id === post.id && renderReplyPanel()}
                  {replies.map((r) => {
                    const rCluster = CLUSTERS.find((c) => c.id === r.clusterId);
                    const rColor = rCluster?.isGap ? C.gapGray : rCluster?.color;
                    return (
                      <div key={r.id}>
                        <PostCard post={r} clusterColor={view === "after" && vizExpanded ? rColor : undefined} isMyPost={r.authorId === CURRENT_USER_ID} onReply={openReply} highlighted={view === "after" && hoveredCluster && CLUSTERS.find((c) => c.id === hoveredCluster)?.postIds.includes(r.id)} onMouseEnter={() => { if (view === "after" && rCluster) setHoveredCluster(r.clusterId); }} onMouseLeave={() => { if (view === "after") setHoveredCluster(null); }} />
                        {replyingTo && replyingTo.id === r.id && renderReplyPanel()}
                      </div>
                    );
                  })}
                </div>
              );
            })}
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "16px", padding: "24px 0", fontFamily: "Lato, Arial, sans-serif", fontSize: "14px", color: C.linkBlue }}>
              <span style={{ cursor: "pointer" }}>‹ Previous</span>
              <span style={{ cursor: "pointer" }}>Next ›</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
