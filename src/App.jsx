import { useState, useRef, useEffect, useCallback } from "react";
import DiscourseMapGuide from "./DiscourseMapGuide";
import { SessionLogProvider, SessionLogDrawer, useSessionLog } from "./session/SessionLogContext";
import { SyntheticTestPanel } from "./dev/SyntheticTestPanel";
import { addStudyPost, deleteStudyPost, getFirebaseAuthUid, isFirebaseEnabled, setStudyThreadConfig, subscribeToStudyPosts, subscribeToStudyThreadConfig, updateStudyPost } from "./study/firebase";

// ─── Design tokens ───────────────────────────────────────────────────────────
const C = {
  white: "#FFFFFF", bg: "#F5F5F5", canvasBlue: "#0374B5",
  canvasDarkBlue: "#0B3B5C", sidebarDark: "#002D62",
  headerLight: "#F5F5F5", linkBlue: "#0374B5",
  text: "#2D3B45", textLight: "#6B7780",
  border: "#C7CDD1", borderLight: "#E8EAED",
  vizPurple: "#7C3AED", vizTeal: "#0891B2", vizAmber: "#D97706",
  vizRose: "#E11D48", vizGreen: "#059669", vizBlue: "#2563EB",
  gapGray: "#94A3B8",
};

const CLUSTER_COLORS = {
  "social-media-bias":        { base:"#7C3AED", light:"#C4B5FD", glow:"rgba(124,58,237,0.3)" },
  "heuristics-design":        { base:"#059669", light:"#6EE7B7", glow:"rgba(5,150,105,0.3)" },
  "media-framing":            { base:"#D97706", light:"#FDE68A", glow:"rgba(217,119,6,0.3)" },
  "ai-cognitive-bias":        { base:"#2563EB", light:"#BFDBFE", glow:"rgba(37,99,235,0.3)" },
  "educational-implications": { base:"#94A3B8", light:"#CBD5E1", glow:"rgba(148,163,184,0.2)" },
  "general":                 { base:"#64748B", light:"#CBD5E1", glow:"rgba(100,116,139,0.18)" },
  // Study mode (Week 12)
  "ethics-responsibility":   { base:"#E11D48", light:"#FDA4AF", glow:"rgba(225,29,72,0.25)" },
  "creativity-agency":       { base:"#7C3AED", light:"#C4B5FD", glow:"rgba(124,58,237,0.25)" },
  "data-literacy":           { base:"#0891B2", light:"#A5F3FC", glow:"rgba(8,145,178,0.22)" },
  "teaching-learning":       { base:"#059669", light:"#6EE7B7", glow:"rgba(5,150,105,0.22)" },
  "policy-privacy-power":    { base:"#D97706", light:"#FDE68A", glow:"rgba(217,119,6,0.22)" },
};

// ─── Static data ─────────────────────────────────────────────────────────────
const DISCUSSION_PROMPT = {
  date: "Posted Jan 20, 2025 10:09pm",
  lastEdited: "Last edited Jan 21, 2025 12:59am",
  title: "Week 10 - Technology & Cognition, Motivation, and Behavior [Group 1]",
  body: `A minimum of 2 posts per week is required. For the 2-post minimum per week, one post should include:\n\n1. Selected information or data from the literature;\n2. Interpretation of the literature;\n3. Relationships you draw from the literature between your understanding and another student's post, literature from the class, or literature from outside sources;\n4. Experiences you have had based on practice or points you would like to contribute based on your own understanding.\n\nThe second post should be a response to a classmate's post.\n\nBeyond the 2-post minimum, you can respond or comment as many times as you would like without adhering to the above criteria.\n\nPlease make your first post no later than Thursday at midnight and read and respond to each other's ideas in the second post no later than Saturday morning at 9 am after which the facilitators will work to construct that week's in-class facilitation activities.`,
  replies: 15, unread: 11,
};

const STUDY_DISCUSSION_PROMPT = {
  title: "Week 12 - AI Narrative Intelligence: Creative Agency and Data Storytelling",
  body: `A minimum of 2 posts per week is required. For the 2-post minimum per week, one post should include:\n\n1. Selected information or data from the literature;\n2. Interpretation of the literature;\n3. Relationships you draw from the literature between your understanding and another student's post, literature from the class, or literature from outside sources;\n4. Experiences you have had based on practice or points you would like to contribute based on your own understanding.\n\nThe second post should be a response to a classmate's post.\n\nBeyond the 2-post minimum, you can respond or comment as many times as you would like without adhering to the above criteria.\n\nAfter this deadline, the facilitators will construct that week's in-class activities based on your discourse.`,
  date: "Posted (study)",
  lastEdited: "",
};

const STUDY_READINGS = [
  {
    label: "Ciuccarelli, Paolo. “What AI Knows about Data Visualization and Storytelling.” The Visual Agency, 16 Feb. 2023.",
    href: "https://medium.com/the-visual-agency/what-ai-knows-about-data-visualization-and-storytelling-f68471669099",
  },
  {
    label: "Flash Johnny. “The Future of Storytelling: How A.I. Is Transforming Narrative Techniques.” Medium, 30 Jan. 2024.",
    href: "https://medium.com/@olivermertens22/the-future-of-storytelling-how-a-i-is-transforming-narrative-techniques-ce2cebdfe975",
  },
];

const STUDY_DEFAULT_CLUSTERS = [
  // Balanced layout (avoid huge empty space in upper-left)
  { id:"ethics-responsibility", label:"Ethics &\nResponsibility", shortLabel:"Ethics & Responsibility", x:34, y:28, size:34, postIds:[], isGap:true },
  { id:"creativity-agency",     label:"Creativity &\nAgency",     shortLabel:"Creativity & Agency",     x:68, y:28, size:34, postIds:[], isGap:true },
  { id:"data-literacy",         label:"Data Literacy\nand Fluency",shortLabel:"Data Literacy and Fluency",x:74, y:56, size:34, postIds:[], isGap:true },
  { id:"teaching-learning",     label:"Teaching &\nLearning Design",shortLabel:"Teaching & Learning Design",x:52,y:72,size:34, postIds:[], isGap:true },
  { id:"policy-privacy-power",  label:"Policy, Privacy\n& Power",  shortLabel:"Policy, Privacy & Power",  x:24, y:58, size:34, postIds:[], isGap:true },
];

function classifyStudyTextToClusters(text) {
  const t = String(text || "").toLowerCase();
  const score = (words) => words.reduce((acc, w) => (t.includes(w) ? acc + 1 : acc), 0);
  const scores = [
    { id:"ethics-responsibility", s: score([
      "ethic","responsib","harm","risk","safety","accountab","justice","fair","bias","misinfo","consent",
      "inclusive","training data","homogen","manipulat",
    ]) },
    { id:"creativity-agency",     s: score([
      "creative","creativity","agency","author","authorship","voice","original","imagin","co-write","ownership","art","story","storytelling","narrative",
      "character","plot","dialogue","writer","writers","muse","writer's block","interactive storytelling","player choices","personalized",
      "sudowrite","novelcrafter","shortlyai","gpt",
    ]) },
    { id:"data-literacy",         s: score([
      "data","dataset","evidence","chart","graph","visual","viz","visualization","information design","uncertaint","stat","metric","literacy","fluency","frame",
      "data preprocessing","outlier","missing values","scaling","automated chart","automated design","layout","color","recommendation",
      "audience","effectiveness","engagement","multimodal","sentiment analysis","real-time",
      "bertin","visual variables","retinal variables",
    ]) },
    { id:"teaching-learning",     s: score([
      "teach","learning","class","classroom","curricul","assignment","rubric","pedagog","feedback","student","assessment","instruct",
      "prompt","wording","iterate","iteration","dialogue",
    ]) },
    { id:"policy-privacy-power",  s: score([
      "policy","law","govern","governance","regulat","privacy","ferpa","surveillance","power","platform","terms","vendor","data retention","ip","intellectual property","patent",
      "accessibility","marginalized",
    ]) },
  ].sort((a,b)=>b.s-a.s);

  const primary = scores[0]?.s > 0 ? scores[0].id : "data-literacy";
  // Multi-label: if the runner-up has meaningful signal, include it to create bridges.
  const s1 = scores[0]?.s || 0;
  const s2 = scores[1]?.s || 0;
  const secondary = (s2 >= 2 && s2 >= Math.max(2, Math.floor(s1 * 0.6))) ? scores[1].id : null;
  return { primary, secondary };
}

const STUDY_SEED_KEYWORDS = {
  // Seeded from the two readings (Flash + Ciuccarelli) so the map has "reading-grounded" language immediately.
  "ethics-responsibility": ["ethics", "bias", "authorship", "accountability", "harm", "inclusivity"],
  "creativity-agency": ["agency", "digital muse", "character development", "plot generation", "interactive storytelling", "human experience"],
  "data-literacy": ["data preprocessing", "automation", "recommendation", "personalization", "visual variables", "multimodal storytelling"],
  "teaching-learning": ["dialogue", "iteration", "wording", "assessment", "rubrics", "feedback"],
  "policy-privacy-power": ["privacy", "intellectual property", "accessibility", "governance", "platforms", "data retention"],
};

const STOPWORDS = new Set([
  "the","a","an","and","or","but","if","then","so","to","of","in","on","for","with","as","at","by","from","into","about","than","that","this","these","those",
  "is","are","was","were","be","been","being","it","its","they","their","we","our","you","your","i","me","my","mine",
  "can","could","should","would","may","might","will","just","also","very","more","most","some","any","all",
]);

function tokenizeForKeywords(text) {
  const t = String(text || "")
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^a-z0-9\s-]+/g, " ");
  return t.split(/\s+/).map(s => s.trim()).filter(Boolean);
}

function deriveStudyKeywords(posts, clusters) {
  const out = [];
  const byCluster = new Map();
  for (const c of clusters) byCluster.set(c.id, []);

  for (const p of posts) {
    const ids = Array.isArray(p.clusterIds) && p.clusterIds.length > 0 ? p.clusterIds : [p.clusterId].filter(Boolean);
    const txt = extractPostText(p.text);
    for (const cid of ids) {
      if (!byCluster.has(cid)) byCluster.set(cid, []);
      byCluster.get(cid).push(txt);
    }
  }

  for (const cl of clusters) {
    const seed = STUDY_SEED_KEYWORDS[cl.id] || [];
    const texts = byCluster.get(cl.id) || [];
    const counts = new Map();

    for (const txt of texts) {
      const toks = tokenizeForKeywords(txt);
      for (const w of toks) {
        if (w.length < 4) continue;
        if (STOPWORDS.has(w)) continue;
        counts.set(w, (counts.get(w) || 0) + 1);
      }
    }

    const top = [...counts.entries()]
      .sort((a,b)=>b[1]-a[1])
      .slice(0, 4)
      .map(([w]) => w);

    const labels = [...new Set([...seed, ...top])].slice(0, 4);
    // Place keywords around the cluster in a small arc.
    labels.forEach((label, i) => {
      const angle = (-0.55 + (i * (1.1 / Math.max(1, labels.length - 1)))) * Math.PI; // ~-99°..99°
      const r = 12; // percent-ish offset
      out.push({
        label,
        clusterId: cl.id,
        x: Math.max(6, Math.min(94, cl.x + Math.cos(angle) * r)),
        y: Math.max(8, Math.min(92, cl.y + Math.sin(angle) * r)),
      });
    });
  }
  return out;
}

function deriveStudyConnections(posts, clusters) {
  const clusterIds = new Set(clusters.map(c => c.id));
  const counts = new Map(); // key "a|b" sorted
  const sharedPostsByKey = new Map();
  for (const p of posts) {
    const idsRaw = Array.isArray(p.clusterIds) && p.clusterIds.length > 0 ? p.clusterIds : [p.clusterId].filter(Boolean);
    const ids = [...new Set(idsRaw.filter(id => clusterIds.has(id)))];
    if (ids.length < 2) continue;
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = ids[i], b = ids[j];
        const key = a < b ? `${a}|${b}` : `${b}|${a}`;
        counts.set(key, (counts.get(key) || 0) + 1);
        const arr = sharedPostsByKey.get(key) || [];
        arr.push(p);
        sharedPostsByKey.set(key, arr);
      }
    }
  }
  const readingKeywordSet = new Set(
    Object.values(STUDY_SEED_KEYWORDS).flat().map(s => String(s).toLowerCase()),
  );
  return [...counts.entries()].map(([key, n]) => {
    const [from, to] = key.split("|");
    const shared = sharedPostsByKey.get(key) || [];
    // Evidence keywords: favor reading-grounded terms that appear in the shared posts,
    // then fall back to the two clusters' reading seeds.
    const sharedText = shared.map(p => extractPostText(p.text)).join(" ");
    const toks = tokenizeForKeywords(sharedText);
    const freq = new Map();
    for (const w of toks) {
      if (w.length < 4) continue;
      if (STOPWORDS.has(w)) continue;
      if (!readingKeywordSet.has(w) && ![from, to].some(cid => (STUDY_SEED_KEYWORDS[cid] || []).some(sk => String(sk).toLowerCase().includes(w)))) continue;
      freq.set(w, (freq.get(w) || 0) + 1);
    }
    const seed = [...new Set([...(STUDY_SEED_KEYWORDS[from] || []), ...(STUDY_SEED_KEYWORDS[to] || [])])];
    const top = [...freq.entries()].sort((a,b)=>b[1]-a[1]).slice(0, 4).map(([w])=>w);
    const evidenceKeywords = [...new Set([...top, ...seed.map(s=>String(s).toLowerCase())])].slice(0, 5);
    return {
      from,
      to,
      strength: n >= 2 ? "strong" : "underexplored",
      label: `${n} shared post${n === 1 ? "" : "s"}`,
      evidenceKeywords,
    };
  });
}

function deriveStudyClustersFromConfig(configClusters, postsList) {
  const base = Array.isArray(configClusters) && configClusters.length > 0 ? configClusters : STUDY_DEFAULT_CLUSTERS;
  const posts = Array.isArray(postsList) ? postsList : [];
  const postIdsByCluster = new Map(base.map(c => [c.id, []]));
  for (const p of posts) {
    const ids = Array.isArray(p.clusterIds) && p.clusterIds.length > 0 ? p.clusterIds : [p.clusterId].filter(Boolean);
    for (const cid of ids) {
      if (!postIdsByCluster.has(cid)) postIdsByCluster.set(cid, []);
      postIdsByCluster.get(cid).push(p.id);
    }
  }
  return base.map(c => {
    const postIds = postIdsByCluster.get(c.id) || [];
    const isGap = postIds.length === 0;
    const size = Math.min(60, 34 + Math.floor(postIds.length / 2) * 4);
    return { ...c, postIds, isGap, size };
  });
}

const ROUTES = { study: "study", demo: "demo" };
function getRouteFromHash() {
  const raw = (window.location.hash || "").replace(/^#\/?/, "");
  if (raw === ROUTES.demo) return ROUTES.demo;
  return ROUTES.study;
}

const STUDY_IDENTITY_STORAGE_KEY = "dm_study_identity_v1";
// Replace with your real codes before running studies.
const CODE_ASSIGNMENTS = {
  // Key = code a participant types. Value = identity shown in the study UI.
  YVES: { id: "TC001", name: "TC001", initials: "TC" },
  JEON: { id: "TC002", name: "TC002", initials: "TC" },
  PARK: { id: "TC003", name: "TC003", initials: "TC" },
  HUR9: { id: "TC004", name: "TC004", initials: "TC" },
  YEO1: { id: "TC005", name: "TC005", initials: "TC" },
  YVBF: { id: "TC006", name: "TC006", initials: "TC" },
};

function loadStudyIdentity() {
  try {
    const raw = localStorage.getItem(STUDY_IDENTITY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveStudyIdentity(identity) {
  localStorage.setItem(STUDY_IDENTITY_STORAGE_KEY, JSON.stringify(identity));
}

const STUDY_FIREBASE_IDS = { studyId: "study-default", threadId: "week12" };

const INITIAL_POSTS = [
  { id:"p1", authorId:"yuna",   authorName:"Yuna K.",   initials:"YK", date:"Feb 12, 2025 4:20pm",  lastReply:"Feb 13, 2025 9:15am",  replyCount:2, text:"I see confirmation bias everywhere in my social media feeds. I tend to follow accounts that align with my views, and the algorithm keeps showing me more of the same. Kahneman's System 1 and System 2 thinking really helped me understand why—my brain defaults to quick, intuitive judgments (System 1) and only sometimes engages in slower, analytical thinking (System 2) when I'm scrolling. I've started asking myself: am I just reinforcing what I already believe?", clusterId:"social-media-bias", parentId:null },
  { id:"p2", authorId:"marcus", authorName:"Marcus T.", initials:"MT", date:"Feb 12, 2025 11:16pm", lastReply:"Feb 14, 2025 10:00am", replyCount:1, text:"The availability heuristic really hit home for me with TikTok. Whatever trend or sound is dominating my For You page starts to feel like 'everyone is talking about this' even when it's just a bubble. I've been reflecting on my news consumption too—dramatic headlines stick in my mind more than dry statistics, so I probably overestimate some risks and underestimate others. The readings made me more aware of how my brain takes shortcuts.", clusterId:"social-media-bias", clusterIds:["social-media-bias","ai-cognitive-bias"], parentId:null },
  { id:"p3", authorId:"priya",  authorName:"Priya S.",  initials:"PS", date:"Feb 13, 2025 10:23am", lastReply:"Feb 14, 2025 3:09pm",  replyCount:1, text:"I'm connecting this to UX design. Nielsen's usability heuristics (visibility, consistency, recognition over recall) overlap with the cognitive heuristics we read about. When we design interfaces, we're often intentionally leveraging these shortcuts—e.g., making one option more salient so users 'choose' it without much thought. It raises an ethical question: when does guiding users cross into manipulating them?", clusterId:"heuristics-design", parentId:null },
  { id:"p4", authorId:"james",  authorName:"James L.",  initials:"JL", date:"Feb 13, 2025 8:00pm",  lastReply:null, replyCount:0, text:"Anchoring bias is huge in online shopping. I'll see a 'was $199, now $79' and my brain treats $79 as a steal without really questioning whether I need the item or what it's worth. Same with 'limited time' and countdown timers—they create urgency that bypasses deliberate thinking. I've been trying to pause and ask: what would I pay if I didn't see the original price?", clusterId:"social-media-bias", parentId:null },
  { id:"p5", authorId:"sofia",  authorName:"Sofia R.",  initials:"SR", date:"Feb 14, 2025 9:00am",  lastReply:null, replyCount:0, text:"The representative heuristic made me think about stereotyping in media representation. We often assume someone fits a category based on how they look or how they're framed—in news, film, ads. Framing effects are powerful too: the same fact can feel very different depending on whether it's framed as a gain or a loss. Headlines that say '90% survive' vs '10% die' trigger different reactions even when the data is identical.", clusterId:"media-framing", parentId:null },
  { id:"p6", authorId:"david",  authorName:"David H.",  initials:"DH", date:"Feb 14, 2025 2:30pm",  lastReply:null, replyCount:0, text:"I'm interested in how AI recommendation systems exploit cognitive biases. Netflix, YouTube, and social feeds are optimized to keep us engaged—they use what we know about attention and habit formation. There's an ethical tension: these systems can deepen filter bubbles and amplify confirmation bias. Should we hold platforms accountable for designing around our heuristics, or is it on users to be more critical?", clusterId:"ai-cognitive-bias", parentId:null },
  { id:"p7", authorId:"yuna",   authorName:"Yuna K.",   initials:"YK", date:"Feb 14, 2025 11:00am", lastReply:null, replyCount:0, text:"Priya, your UX angle is really interesting. I wonder if we can think of heuristic-based design as intentionally exploiting cognitive shortcuts—and whether that's always bad or sometimes helpful (e.g., reducing cognitive load for routine tasks). Where do we draw the line?", clusterId:"heuristics-design", parentId:"p3" },
  { id:"p8", authorId:"marcus", authorName:"Marcus T.", initials:"MT", date:"Feb 14, 2025 10:00am", lastReply:null, replyCount:0, text:"Yuna, I had the same experience with confirmation bias. I deleted a few highly partisan accounts and added some that challenge my views—my feed is less comfortable but I feel like I'm at least seeing more than one side. Small change but it helped.", clusterId:"social-media-bias", parentId:"p1" },
];

const INITIAL_CLUSTERS = [
  { id:"social-media-bias",        label:"Social Media &\nBias Awareness",    shortLabel:"Social Media & Bias Awareness",    x:42, y:38, size:48, postIds:["p1","p2","p4","p8"], isGap:false, consensusWarning:"4 posts support similar views. No critical counter-perspectives yet." },
  { id:"heuristics-design",        label:"Heuristics &\nDesign Practice",     shortLabel:"Heuristics & Design Practice",     x:28, y:68, size:36, postIds:["p3","p7"],           isGap:false },
  { id:"media-framing",            label:"Media Framing &\nRepresentation",   shortLabel:"Media Framing & Representation",   x:72, y:22, size:28, postIds:["p5"],               isGap:false },
  { id:"ai-cognitive-bias",        label:"AI Tools &\nCognitive Bias",        shortLabel:"AI Tools & Cognitive Bias",        x:75, y:65, size:28, postIds:["p6","p2"],               isGap:false },
  { id:"educational-implications", label:"Educational\nImplications",         shortLabel:"Educational Implications",         x:14, y:26, size:32, postIds:[],                   isGap:true  },
];

const CONNECTIONS = [
  { from:"social-media-bias", to:"ai-cognitive-bias",  strength:"strong",        label:"Both discuss algorithmic influence on cognition" },
  { from:"heuristics-design", to:"social-media-bias",  strength:"strong",        label:"Design choices exploiting biases in media use" },
  { from:"media-framing",     to:"social-media-bias",  strength:"strong",        label:"Framing as a bias mechanism in content" },
  { from:"media-framing",     to:"ai-cognitive-bias",  strength:"underexplored", label:"Could AI-driven content curation amplify framing effects?" },
];

const KEYWORDS = [
  { label:"confirmation bias",      x:36, y:29, clusterId:"social-media-bias" },
  { label:"System 1",               x:51, y:43, clusterId:"social-media-bias" },
  { label:"algorithm",              x:53, y:32, clusterId:"social-media-bias" },
  { label:"availability heuristic", x:33, y:48, clusterId:"social-media-bias" },
  { label:"Nielsen",                x:20, y:75, clusterId:"heuristics-design" },
  { label:"UX",                     x:34, y:63, clusterId:"heuristics-design" },
  { label:"framing effects",        x:79, y:16, clusterId:"media-framing" },
  { label:"stereotyping",           x:66, y:27, clusterId:"media-framing" },
  { label:"AI recommendations",     x:83, y:59, clusterId:"ai-cognitive-bias" },
  { label:"filter bubbles",         x:71, y:73, clusterId:"ai-cognitive-bias" },
];

// Gap-specific prompts
const GAP_PROMPTS = [
  { id:"gap-explore", icon:"🔍", label:"Explore this gap", text:"No one has yet discussed how cognitive biases relate to teaching or instructional design. You'd be the first to bring in this perspective.", starter:"Connecting cognitive biases to educational practice, one key implication I see is " },
  { id:"gap-link",    icon:"🔗", label:"Bridge to existing ideas", text:"How might the insights from other clusters — about social media, UX, or AI — inform an educational approach to cognitive biases?", starter:"Building on what others have said about algorithms and design, an educational application might be " },
  { id:"gap-question",icon:"⚖️", label:"Raise a question", text:"What critical questions does this gap surface? What's missing from the conversation that educators, designers, or policy-makers should be asking?", starter:"One question this discussion hasn't addressed yet — and that I think matters for practice — is " },
];

const EPISTEMIC_PROMPTS = [
  { id:"gap",       icon:"🔍", label:"Explore a gap",         text:"No one has discussed how understanding cognitive biases could inform teaching or instructional design. What's your perspective?",                                                                                                        starter:"Understanding cognitive biases could inform teaching and instructional design by " },
  { id:"consensus", icon:"⚖️", label:"Challenge a consensus", text:"4 posts describe how social media reinforces biases. Can you think of cases where social media might actually *reduce* bias through exposure to diverse perspectives?",                                                              starter:"While social media often reinforces biases, it might also reduce bias when " },
  { id:"bridge",    icon:"🔗", label:"Bridge two ideas",      text:"Sofia's point about media framing and David's point about AI recommendation systems seem related but haven't been connected. How might algorithmic curation interact with framing effects?", starter:"Algorithmic curation could interact with framing effects by " },
];

const FIRST_POST_PROMPTS = [
  { id:"fp1", icon:"🔍", label:"Connect the readings",     text:"What idea from this week's readings stood out to you? Summarize it briefly and say why it matters for how you think about technology and cognition.", starter:"One idea from the readings that stood out to me is " },
  { id:"fp2", icon:"⚖️", label:"Share an experience",      text:"Describe a concrete experience from your own media use, learning, or work that connects to the themes of the module.", starter:"A concrete experience from my own life that connects to this module is " },
  { id:"fp3", icon:"🔗", label:"Pose an open question",    text:"What is one question you hope the class will explore together — something you're genuinely unsure about?", starter:"One open question I'd like us to explore is " },
];

// NOTE: We previously rotated a demo author pool; synthetic sessions now drive a fixed author per turn.

function postBelongsToCluster(post, clusterId) {
  if (!post || !clusterId) return false;
  if (post.clusterIds?.length) return post.clusterIds.includes(clusterId);
  return post.clusterId === clusterId;
}

function getContextualPrompts(targetPost, clustersList = INITIAL_CLUSTERS, postsList = INITIAL_POSTS) {
  if (!targetPost) return EPISTEMIC_PROMPTS;
  const cluster = clustersList.find(c => c.id === targetPost.clusterId);
  if (!cluster) return EPISTEMIC_PROMPTS;
  const name = targetPost.authorName;
  const sofia = postsList.find(p => p.authorId === "sofia");
  const david = postsList.find(p => p.authorId === "david");
  switch (cluster.id) {
    case "social-media-bias": return [
      { id:"s1", icon:"⚖️", label:"Situate this experience",       text:`Several posts in "${cluster.shortLabel}" describe similar patterns of bias. How does ${name}'s example resonate with or complicate what others shared?`, starter:`Building on ${name}'s experience, one way it resonates with or complicates other posts is ` },
      { id:"s2", icon:"⚖️", label:"Introduce a counter-perspective", text:"Most posts here emphasize how social media reinforces bias. Can you think of cases where platforms might actually reduce bias or broaden perspectives?", starter:"One way social media might reduce rather than reinforce bias is " },
      { id:"s3", icon:"🔗", label:"Bridge to another region",       text:`Try connecting this to another part of the map—for instance, ${sofia?sofia.authorName+"'s point about media framing":"the framing cluster"} or ${david?david.authorName+"'s post on AI":"the AI tools cluster"}.`, starter:"Connecting this social media example to framing and AI systems, one interaction I see is " },
    ];
    case "heuristics-design": return [
      { id:"d1", icon:"🔍", label:"Probe design ethics",        text:`How might you distinguish between helpful guidance and manipulative design in response to ${name}?`,  starter:`Responding to ${name}, I would distinguish supportive from manipulative heuristics by ` },
      { id:"d2", icon:"🔍", label:"Connect to learning design", text:"No one has yet applied these design insights to teaching or instructional design. How could similar heuristics support or hinder learning?", starter:"In instructional design, these heuristic-based choices could influence learners by " },
      { id:"d3", icon:"🔗", label:"Bridge to social media",     text:`How might the UX decisions ${name} highlights relate to social media interfaces that reinforce or challenge bias?`, starter:"Connecting these UX heuristics to social media interfaces, one overlap I notice is " },
    ];
    case "media-framing": return [
      { id:"f1", icon:"🔍", label:"Surface implications",  text:`How might understanding framing and stereotyping change how we teach news literacy or critical media analysis?`, starter:`If we treated ${name}'s example as a starting point for news literacy, one implication would be ` },
      { id:"f2", icon:"🔗", label:"Bridge framing and AI", text:`The map shows an underexplored connection between media framing and AI. How might algorithmic curation amplify or dampen the framing effects ${name} describes?`, starter:`Algorithmic curation could interact with ${name}'s framing effects by ` },
      { id:"f3", icon:"⚖️", label:"Add a new lens",        text:"Most discussion here focuses on individual reactions. Can you bring in a structural perspective — newsroom practices, platform policies?", starter:"Looking beyond individual reactions, one structural factor that shapes framing is " },
    ];
    case "ai-cognitive-bias": return [
      { id:"a1", icon:"🔍", label:"Interrogate responsibilities", text:`Who should be responsible for managing cognitive biases in AI-mediated environments: designers, platforms, educators, or users?`, starter:`Responding to ${name}, I would locate primary responsibility for AI-driven biases with ` },
      { id:"a2", icon:"🔗", label:"Bridge to framing & media",    text:"Try linking algorithmic recommendations to framing in headlines — how ranking and selection reinforce certain frames over others.", starter:"One way recommendation algorithms reinforce particular frames across a feed is " },
      { id:"a3", icon:"🔍", label:"Educational implications",     text:"No one has explored how these AI-driven biases might shape digital literacy or data literacy curricula.", starter:"If we took AI-driven biases seriously in education, one change to digital literacy instruction would be " },
    ];
    case "educational-implications": return [
      { id:"e1", icon:"🔍", label:"Link theory to practice",      text:`How might ${name}'s point change what you do in a classroom, syllabus, or facilitation plan?`, starter:`Translating ${name}'s idea into practice, I would try ` },
      { id:"e2", icon:"🔗", label:"Connect across themes",        text:"How does this educational angle relate to social media bias, design heuristics, or AI systems others mapped?", starter:"This educational angle connects to other themes on the map because " },
      { id:"e3", icon:"⚖️", label:"Name a tradeoff",              text:"What tension or risk should educators keep in mind when applying these ideas (e.g., overload, equity, measurement)?", starter:"One tradeoff educators should keep in mind is " },
    ];
    default: return EPISTEMIC_PROMPTS;
  }
}

const CURRENT_USER = { id:"yuna", name:"Yuna K.", initials:"YK" };
const connKey     = c => `${c.from}::${c.to}`;
const connFromKey = k => k.split("::");
let   postIdCounter = 9;

function resetPostIdCounterFromPosts(postList) {
  let max = 0;
  for (const p of postList) {
    if (typeof p?.id !== "string") continue;
    const m = /^p(\d+)$/.exec(p.id);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  postIdCounter = max + 1;
}

const NOTES_STORAGE_KEY = "dm_fullview_notes";

function clusterIdsForPost(post) {
  if (!post) return [];
  if (post.clusterIds?.length) return [...new Set(post.clusterIds)];
  return post.clusterId ? [post.clusterId] : [];
}

// ─── Canvas Header ────────────────────────────────────────────────────────────
function CanvasHeader() {
  return (
    <div style={{ background:C.headerLight, height:"52px", display:"flex", alignItems:"center", padding:"0 20px", gap:"16px", borderBottom:`1px solid ${C.borderLight}`, flexShrink:0 }}>
      <button style={{ background:"none", border:"none", padding:8, cursor:"pointer", color:C.text, fontSize:"20px" }}>☰</button>
      <div style={{ display:"flex", alignItems:"center", gap:"10px", fontSize:"15px", fontFamily:"Lato,Arial,sans-serif", color:C.text }}>
        <span style={{ color:C.linkBlue, cursor:"pointer" }}>MSTU4133001</span>
        <span style={{ color:C.textLight }}>›</span>
        <span style={{ color:C.linkBlue, cursor:"pointer" }}>Discussions</span>
        <span style={{ color:C.textLight }}>›</span>
        <span style={{ color:C.text, fontWeight:"500" }}>Discussion</span>
      </div>
      <div style={{ marginLeft:"auto", display:"flex", gap:"10px", alignItems:"center" }}>
        <select style={{ padding:"8px 12px", border:`1px solid ${C.border}`, borderRadius:"4px", fontSize:"14px", fontFamily:"Lato,Arial,sans-serif", background:C.white }}><option>All</option></select>
        <input placeholder="Search entries or author..." style={{ padding:"8px 12px", border:`1px solid ${C.border}`, borderRadius:"4px", fontSize:"14px", width:"220px", fontFamily:"Lato,Arial,sans-serif" }} />
        <select style={{ padding:"8px 12px", border:`1px solid ${C.border}`, borderRadius:"4px", fontSize:"14px", fontFamily:"Lato,Arial,sans-serif", background:C.white }}><option>Newest First</option></select>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar() {
  const items = ["Account","Dashboard","Courses","Groups","Calendar","Inbox","History","Help","myCoursEval"];
  const badge = { Inbox:54, History:10 };
  return (
    <div style={{ width:"100px", minWidth:"100px", background:C.sidebarDark, padding:"14px 0", display:"flex", flexDirection:"column", color:C.white, fontFamily:"Lato,Arial,sans-serif", flexShrink:0 }}>
      <div style={{ padding:"10px 12px", borderBottom:"1px solid rgba(255,255,255,0.2)", marginBottom:10, minHeight:56, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <img src="/TC_Shield_White.png" alt="TC" style={{ width:"100%", maxWidth:"100%", maxHeight:48, objectFit:"contain", mixBlendMode:"screen" }} />
      </div>
      {items.map(item => (
        <div key={item} style={{ padding:"12px 12px", fontSize:"15px", display:"flex", alignItems:"center", gap:12, background:item==="Courses"?"rgba(255,255,255,0.15)":"transparent", borderLeft:item==="Courses"?"4px solid #7BA4C7":"4px solid transparent", cursor:"pointer", color:"rgba(255,255,255,0.95)" }}>
          <span style={{ flex:1 }}>{item}</span>
          {badge[item]!=null && <span style={{ background:C.white, color:C.sidebarDark, fontSize:"12px", fontWeight:"600", minWidth:22, height:22, borderRadius:11, display:"inline-flex", alignItems:"center", justifyContent:"center" }}>{badge[item]}</span>}
        </div>
      ))}
    </div>
  );
}

// ─── Discourse Map Collapsed ──────────────────────────────────────────────────
function DiscourseMapCollapsedBar({ onExpand }) {
  return (
    <div onClick={onExpand} style={{ padding:"10px 20px", background:C.white, border:`1px solid ${C.border}`, borderRadius:"6px", marginBottom:"18px", cursor:"pointer", display:"flex", alignItems:"center", gap:"12px", boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
      <span style={{ width:10, height:10, borderRadius:"50%", background:"#22c55e", animation:"pulse 1.5s ease-in-out infinite" }} />
      <span style={{ fontSize:"15px", fontWeight:"700", color:C.text, fontFamily:"Lato,Arial,sans-serif" }}>Discourse Map</span>
      <span style={{ fontSize:"13px", color:C.textLight, fontFamily:"Lato,Arial,sans-serif" }}>— posts analyzed · Visible after your initial post</span>
      <button onClick={e=>{e.stopPropagation();onExpand();}} style={{ marginLeft:"auto", background:C.canvasBlue, color:C.white, border:"none", padding:"6px 14px", borderRadius:"4px", fontSize:"13px", cursor:"pointer", fontFamily:"Lato,Arial,sans-serif", fontWeight:"600" }}>Expand</button>
    </div>
  );
}

// ─── Health Summary ───────────────────────────────────────────────────────────
function DiscourseHealthSummary({ clusters }) {
  const gapCount       = clusters.filter(c => c.isGap).length;
  const consensusCount = clusters.filter(c => c.consensusWarning).length;
  const underexplored  = CONNECTIONS.filter(c => c.strength === "underexplored").length;
  return (
    <div style={{ display:"flex", gap:0, background:"#F8FAFC", border:`1px solid ${C.borderLight}`, borderRadius:"6px", overflow:"hidden", fontSize:"13px", fontFamily:"Lato,Arial,sans-serif", color:C.textLight }}>
      {[
        { n:clusters.filter(c=>!c.isGap).length, label:"clusters",          color:C.canvasBlue },
        { n:gapCount+underexplored,               label:"gaps identified",   color:"#D97706" },
        { n:consensusCount,                       label:"need counter-view", color:"#E11D48" },
      ].map((s,i,arr) => (
        <div key={i} style={{ flex:1, padding:"12px 16px", borderRight:i<arr.length-1?`1px solid ${C.borderLight}`:"none", display:"flex", flexDirection:"column", gap:2 }}>
          <span style={{ fontSize:"22px", fontWeight:"800", color:s.color, lineHeight:1 }}>{s.n}</span>
          <span style={{ fontSize:"11px", textTransform:"uppercase", letterSpacing:"0.4px" }}>{s.label}</span>
        </div>
      ))}
      <div style={{ padding:"12px 16px", display:"flex", alignItems:"center", color:C.textLight, fontSize:"11px", fontStyle:"italic", flex:2 }}>
        Click a cluster; hover or click a connection to explore
      </div>
    </div>
  );
}

// ─── Discourse Map Expanded ───────────────────────────────────────────────────
function DiscourseMapExpanded({
  clusters, discussionPosts,
  hoveredCluster, setHoveredCluster,
  selectedCluster, setSelectedCluster,
  myPostsHighlight, setMyPostsHighlight, onClose,
  highlightedConnection, onConnectionHover, onConnectionLeave, onConnectionClick, clearConnectionFocus,
  zoom, onZoomChange, pan, setPan,
  onGapClick, analyzing, onOpenFullView,
  onJumpToPost,
  onClusterHoverLeave,
  onGapClusterViewed,
  onKeywordHoverLeave,
  onConnectionDwell,
  activeAuthorId,
  connections = CONNECTIONS,
  keywords = KEYWORDS,
  selectedConnectionKey = null,
  isStudy = false,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({});
  const clusterHoverRef = useRef({ id: null, ts: null, gapTimer: null });
  const keywordHoverRef = useRef({ key: null, ts: null });
  const connDwellTimersRef = useRef({});

  const getClusterById = id => clusters.find(c => c.id === id);

  return (
    <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:"6px", marginBottom:"18px", overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,0.07)" }}>
      <style>{`
        @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:0.45} }
        @keyframes gapSpin   { to{stroke-dashoffset:-20} }
        @keyframes clusterIn { from{opacity:0;transform:scale(0.5)} to{opacity:1;transform:scale(1)} }
        @keyframes newPost   { 0%{opacity:0;transform:scale(0.2)} 60%{transform:scale(1.15)} 100%{opacity:1;transform:scale(1)} }
        @keyframes analyzing { 0%,100%{opacity:0.5} 50%{opacity:1} }
        .cl-node { transform-box:fill-box; transform-origin:center; }
      `}</style>

      {/* Header */}
      <div style={{ padding:"12px 20px", borderBottom:`1px solid ${C.borderLight}`, background:"#FAFBFC", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <div style={{ width:9, height:9, borderRadius:"50%", background:"#22c55e", animation:"pulse 2s ease-in-out infinite" }} />
          <span style={{ fontSize:"15px", fontWeight:"700", color:C.text, fontFamily:"Lato,Arial,sans-serif" }}>Discourse Map</span>
          <span title="DiscourseMap visualizes thematic clusters and connections in the discussion, highlights gaps and missing counter-perspectives, and offers epistemic prompts to guide your next contribution." style={{ width:18, height:18, borderRadius:"50%", border:`1.5px solid ${C.border}`, color:C.textLight, fontSize:"11px", display:"inline-flex", alignItems:"center", justifyContent:"center", fontFamily:"Lato,Arial,sans-serif", cursor:"default", fontWeight:"700" }}>i</span>
          {analyzing
            ? <span style={{ fontSize:"12px", color:C.canvasBlue, fontFamily:"Lato,Arial,sans-serif", animation:"analyzing 1.2s ease-in-out infinite" }}>— Analyzing new post…</span>
            : <span style={{ fontSize:"12px", color:C.textLight, fontFamily:"Lato,Arial,sans-serif" }}>— {clusters.reduce((acc,c)=>acc+c.postIds.length,0)} posts analyzed · Visible after your initial post</span>
          }
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={onOpenFullView}
            title="Opens in a new tab — explore the map, themes, and writing angles in a focused view"
            style={{ display:"inline-flex", alignItems:"center", gap:6, background:"#EFF6FF", border:`1px solid ${C.canvasBlue}40`, borderRadius:"4px", padding:"5px 12px", fontSize:"12px", color:C.canvasBlue, cursor:"pointer", fontFamily:"Lato,Arial,sans-serif", fontWeight:"700", transition:"background 0.15s" }}
            onMouseEnter={e=>e.currentTarget.style.background="#DBEAFE"}
            onMouseLeave={e=>e.currentTarget.style.background="#EFF6FF"}>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 1h4v4M11 1L6 6M5 3H2a1 1 0 00-1 1v6a1 1 0 001 1h6a1 1 0 001-1V8"/></svg>
            Open Full View
          </button>
          <button onClick={onClose} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:"4px", padding:"5px 14px", fontSize:"13px", color:C.textLight, cursor:"pointer", fontFamily:"Lato,Arial,sans-serif" }}>Collapse</button>
        </div>
      </div>

      {/* Map */}
      <div style={{ position:"relative", height:"430px", background:"linear-gradient(160deg,#F8FAFC 0%,#EFF4F9 100%)" }}>
        {/* Zoom controls */}
        <div style={{ position:"absolute", top:12, right:14, zIndex:5, background:"rgba(255,255,255,0.97)", borderRadius:"6px", border:`1px solid ${C.borderLight}`, padding:"6px 10px", display:"flex", alignItems:"center", gap:6, fontSize:"12px", fontFamily:"Lato,Arial,sans-serif", boxShadow:"0 2px 8px rgba(0,0,0,0.08)" }}>
          <span style={{ fontWeight:"600", color:C.text, marginRight:2 }}>Zoom</span>
          <button onClick={()=>onZoomChange(Math.max(0.6,zoom-0.2))} style={{ border:`1px solid ${C.border}`, background:C.white, borderRadius:"4px", width:24, height:24, cursor:"pointer", fontSize:"16px", lineHeight:1, color:C.text }}>−</button>
          <span style={{ minWidth:38, textAlign:"center", fontWeight:"700", color:C.text }}>{Math.round(zoom*100)}%</span>
          <button onClick={()=>onZoomChange(Math.min(2.0,zoom+0.2))} style={{ border:`1px solid ${C.border}`, background:C.white, borderRadius:"4px", width:24, height:24, cursor:"pointer", fontSize:"16px", lineHeight:1, color:C.text }}>+</button>
          <button onClick={()=>{onZoomChange(1);setSelectedCluster(null);setHoveredCluster(null);clearConnectionFocus();setPan({x:0,y:0});}} style={{ border:`1px solid ${C.border}`, background:C.white, borderRadius:"4px", padding:"0 8px", height:24, cursor:"pointer", fontSize:"11px", fontWeight:"600", color:C.textLight }}>Reset</button>
        </div>

        {/* Canvas */}
        <div
          style={{ width:"100%", height:"100%", overflow:"hidden", position:"relative", cursor:isDragging?"grabbing":"grab", userSelect:"none" }}
          onWheel={e=>{e.preventDefault();onZoomChange(Math.min(2.0,Math.max(0.6,zoom+(e.deltaY>0?-0.1:0.1))));}}
          onMouseDown={e=>{if(e.button!==0)return;setIsDragging(true);dragStart.current={sx:e.clientX,sy:e.clientY,px:pan.x,py:pan.y};}}
          onMouseMove={e=>{if(!isDragging)return;setPan({x:dragStart.current.px+(e.clientX-dragStart.current.sx),y:dragStart.current.py+(e.clientY-dragStart.current.sy)});}}
          onMouseUp={()=>setIsDragging(false)}
          onMouseLeave={()=>setIsDragging(false)}
        >
          <div style={{ width:"100%", height:"100%", transform:`translate(${pan.x}px,${pan.y}px) scale(${zoom})`, transformOrigin:"50% 50%", transition:isDragging?"none":"transform 0.25s cubic-bezier(0.25,0.46,0.45,0.94)" }}>
            <svg width="100%" height="100%" style={{ position:"absolute", top:0, left:0, overflow:"visible" }}>
              <defs>
                {clusters.filter(c=>!c.isGap).map(cl => {
                  const cc = CLUSTER_COLORS[cl.id] || { light:"#E2E8F0", base:"#94A3B8" };
                  return (
                    <radialGradient key={`g-${cl.id}`} id={`g-${cl.id}`} cx="38%" cy="32%" r="68%">
                      <stop offset="0%"   stopColor={cc.light} stopOpacity="1" />
                      <stop offset="100%" stopColor={cc.base}  stopOpacity="0.85" />
                    </radialGradient>
                  );
                })}
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="8" result="b"/>
                  <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="3" stdDeviation="6" floodOpacity="0.18"/>
                </filter>
              </defs>

              {/* Connections */}
              {connections.map((conn,i) => {
                const from = getClusterById(conn.from), to = getClusterById(conn.to);
                if (!from || !to) return null;
                const dashed = conn.strength === "underexplored";
                const key = connKey(conn);
                const isHL = highlightedConnection===key || highlightedConnection===connKey({from:conn.to,to:conn.from});
                const mx=(from.x+to.x)/2, my=(from.y+to.y)/2;
                return (
                  <g key={i}
                    onMouseEnter={() => {
                      onConnectionHover(key);
                      if (connDwellTimersRef.current[key]) clearTimeout(connDwellTimersRef.current[key]);
                      connDwellTimersRef.current[key] = setTimeout(() => {
                        onConnectionDwell?.({ connectionKey: key, strength: conn.strength });
                      }, 600);
                    }}
                    onMouseLeave={() => {
                      onConnectionLeave();
                      if (connDwellTimersRef.current[key]) {
                        clearTimeout(connDwellTimersRef.current[key]);
                        delete connDwellTimersRef.current[key];
                      }
                    }}
                    onClick={e => { e.stopPropagation(); onConnectionClick(key); }}
                    style={{cursor:"pointer"}}>
                    <line x1={`${from.x}%`} y1={`${from.y}%`} x2={`${to.x}%`} y2={`${to.y}%`} stroke="transparent" strokeWidth="20"/>
                    {isHL && <line x1={`${from.x}%`} y1={`${from.y}%`} x2={`${to.x}%`} y2={`${to.y}%`} stroke={C.canvasBlue} strokeWidth="9" opacity="0.12" strokeLinecap="round"/>}
                    <line x1={`${from.x}%`} y1={`${from.y}%`} x2={`${to.x}%`} y2={`${to.y}%`}
                      stroke={isHL?C.canvasBlue:dashed?"#94A3B8":"#C5D0DC"}
                      strokeWidth={isHL?2.5:dashed?1.2:1.8}
                      strokeDasharray={dashed?"8 5":"none"}
                      opacity={isHL?1:dashed?0.5:0.65}
                      strokeLinecap="round"
                      style={{transition:"stroke 0.2s,stroke-width 0.2s"}}
                    />
                    {isHL && !dashed && <line x1={`${from.x}%`} y1={`${from.y}%`} x2={`${to.x}%`} y2={`${to.y}%`} stroke={C.canvasBlue} strokeWidth="3" opacity="0.7" strokeDasharray="6 42" strokeLinecap="round" style={{animation:"gapSpin 1s linear infinite"}}/>}
                    {isHL && (
                      <g transform={`translate(${mx}%,${my}%)`}>
                        <rect x="-44" y="-11" width="88" height="22" rx="5" fill="white" stroke={C.canvasBlue} strokeWidth="1.5" opacity="0.97"/>
                        <text textAnchor="middle" y="5" fontSize="9.5" fill={C.canvasBlue} fontFamily="Lato,Arial,sans-serif" fontWeight="700">
                          {dashed?"⚡ underexplored":"● connected"}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Keywords */}
              {keywords.map((kw,i) => {
                const isActiveCluster = hoveredCluster === kw.clusterId || selectedCluster === kw.clusterId;
                const vis = isStudy ? isActiveCluster : (!hoveredCluster || hoveredCluster === kw.clusterId);
                const cc  = CLUSTER_COLORS[kw.clusterId];
                const tw  = kw.label.length * 5 + 14;
                const keywordKey = `${kw.label}::${kw.clusterId}`;
                return (
                  <g
                    key={i}
                    opacity={vis ? 0.92 : (isStudy ? 0.06 : 0.08)}
                    style={{transition:"opacity 0.25s", pointerEvents:"auto", cursor:"pointer"}}
                    onMouseEnter={() => { keywordHoverRef.current = { key: keywordKey, ts: Date.now() }; }}
                    onMouseLeave={() => {
                      const start = keywordHoverRef.current?.key === keywordKey ? keywordHoverRef.current.ts : null;
                      const durationMs = start ? Date.now() - start : 0;
                      onKeywordHoverLeave?.({ keyword: kw.label, clusterId: kw.clusterId, durationMs });
                      keywordHoverRef.current = { key: null, ts: null };
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Clicking a keyword focuses its cluster (then keywords for that cluster become visible).
                      setSelectedCluster(selectedCluster === kw.clusterId ? null : kw.clusterId);
                    }}
                  >
                    <rect x={`calc(${kw.x}% - ${tw/2}px)`} y={`calc(${kw.y}% - 9px)`} width={tw} height="18" rx="9"
                      fill={cc?cc.base:"#94A3B8"} fillOpacity={vis ? 0.15 : 0.06}
                      stroke={cc?cc.base:"#94A3B8"} strokeOpacity={vis ? 0.42 : 0.14} strokeWidth={vis ? 1 : 1}/>
                    <text x={`${kw.x}%`} y={`${kw.y+0.4}%`} textAnchor="middle" dominantBaseline="middle"
                      fill={cc?cc.base:"#64748B"} fontSize="9.5" fontFamily="Lato,Arial,sans-serif" fontWeight={vis ? "800" : "700"}>{kw.label}</text>
                  </g>
                );
              })}

              {/* Cluster nodes */}
              {clusters.map((cl, clIdx) => {
                const isH = hoveredCluster===cl.id, isS = selectedCluster===cl.id, active = isH||isS;
                const cc  = CLUSTER_COLORS[cl.id] || { base:"#94A3B8", light:"#CBD5E1", glow:"rgba(148,163,184,0.2)" };
                const touches = cl.postIds.length;
                const intensity = Math.min(1, 0.45 + Math.log1p(touches) / 1.35); // 0..1-ish (more color even for 1 post)
                const hasMine = myPostsHighlight && cl.postIds.some(pid => {
                  const p = discussionPosts.find(x => x.id === pid);
                  return p && p.authorId === activeAuthorId;
                });
                const isNew   = cl.isNew;
                const outerR  = cl.size * 0.9, midR = cl.size * 0.55, coreR = active ? cl.size*0.33 : cl.size*0.28;

                if (cl.isGap) {
                  return (
                    <g key={cl.id}
                      onClick={() => { onGapClick(cl.id); setSelectedCluster(null); }}
                      onMouseEnter={() => {
                        setHoveredCluster(cl.id);
                        clusterHoverRef.current = { id: cl.id, ts: Date.now(), gapTimer: setTimeout(() => onGapClusterViewed?.({ clusterId: cl.id }), 1000) };
                      }}
                      onMouseLeave={() => {
                        setHoveredCluster(null);
                        if (clusterHoverRef.current?.gapTimer) clearTimeout(clusterHoverRef.current.gapTimer);
                        const start = clusterHoverRef.current?.id === cl.id ? clusterHoverRef.current.ts : null;
                        const durationMs = start ? Date.now() - start : 0;
                        if (durationMs > 300) onClusterHoverLeave?.({ clusterId: cl.id, isGap: true, durationMs });
                        clusterHoverRef.current = { id: null, ts: null, gapTimer: null };
                      }}
                      style={{cursor:"pointer"}}
                    >
                      <circle cx={`${cl.x}%`} cy={`${cl.y}%`} r={outerR} fill="none" stroke="#94A3B8" strokeWidth={active?2:1.5} strokeDasharray="9 6" opacity={active?0.8:0.45} style={{animation:"gapSpin 6s linear infinite"}}/>
                      <circle cx={`${cl.x}%`} cy={`${cl.y}%`} r={midR} fill="#94A3B8" fillOpacity={active?0.1:0.05}/>
                      {/* Subtle "click me" hint on hover */}
                      {active && <circle cx={`${cl.x}%`} cy={`${cl.y}%`} r={outerR+4} fill="none" stroke="#0374B5" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.4"/>}
                      <text x={`${cl.x}%`} y={`${cl.y-1.5}%`} textAnchor="middle" dominantBaseline="middle" fill="#94A3B8" fontSize="20" fontFamily="Lato,Arial,sans-serif" opacity={active?1:0.65}>?</text>
                      {cl.label.split("\n").map((line,j) => (
                        <text key={j} x={`${cl.x}%`} y={`${cl.y+7+j*13}%`} textAnchor="middle" fill={active?"#475569":"#94A3B8"} fontSize="10" fontFamily="Lato,Arial,sans-serif" fontStyle="italic" opacity={active?0.9:0.55}>{line}</text>
                      ))}
                      {active && (
                        <g transform={`translate(${cl.x}%,${cl.y+outerR/430*100+4.5}%)`}>
                          <rect x="-38" y="-9" width="76" height="18" rx="9" fill={C.canvasBlue} fillOpacity="0.12" stroke={C.canvasBlue} strokeWidth="1" strokeOpacity="0.4"/>
                          <text textAnchor="middle" y="4.5" fontSize="9" fill={C.canvasBlue} fontFamily="Lato,Arial,sans-serif" fontWeight="700">Click to contribute</text>
                        </g>
                      )}
                    </g>
                  );
                }

                return (
                  <g key={cl.id} className="cl-node"
                    onMouseEnter={() => {
                      setHoveredCluster(cl.id);
                      clusterHoverRef.current = { id: cl.id, ts: Date.now(), gapTimer: null };
                    }}
                    onMouseLeave={() => {
                      setHoveredCluster(null);
                      const start = clusterHoverRef.current?.id === cl.id ? clusterHoverRef.current.ts : null;
                      const durationMs = start ? Date.now() - start : 0;
                      if (durationMs > 300) onClusterHoverLeave?.({ clusterId: cl.id, isGap: false, durationMs });
                      clusterHoverRef.current = { id: null, ts: null, gapTimer: null };
                    }}
                    onClick={() => { const next = selectedCluster===cl.id?null:cl.id; setSelectedCluster(next); if(next&&zoom<1.1) onZoomChange(1.2); }}
                    style={{cursor:"pointer", animation: isNew ? `newPost 0.6s cubic-bezier(0.34,1.56,0.64,1) both` : `clusterIn 0.5s cubic-bezier(0.34,1.56,0.64,1) ${clIdx*0.07}s both`}}
                  >
                    <circle cx={`${cl.x}%`} cy={`${cl.y}%`} r={outerR} fill={cc.base} opacity={(active?0.14:0.08) * (0.60 + intensity)} style={{transition:"opacity 0.3s"}}/>
                    <circle cx={`${cl.x}%`} cy={`${cl.y}%`} r={midR}   fill={cc.base} opacity={(active?0.22:0.12) * (0.60 + intensity)} style={{transition:"opacity 0.3s"}}/>
                    {active && <circle cx={`${cl.x}%`} cy={`${cl.y}%`} r={coreR+10} fill={cc.glow} filter="url(#glow)" opacity="0.55"/>}
                    <circle cx={`${cl.x}%`} cy={`${cl.y}%`} r={coreR} fill={`url(#g-${cl.id})`} opacity={0.65 + intensity*0.35} filter={active?"url(#shadow)":"none"} style={{transition:"r 0.3s cubic-bezier(0.34,1.56,0.64,1)"}}/>
                    {cl.consensusWarning && (
                      <g style={{ pointerEvents:"none" }}>
                        <circle cx={`${cl.x+coreR*0.65}%`} cy={`${cl.y-coreR*0.65}%`} r="7" fill="#E11D48"/>
                        <text x={`${cl.x+coreR*0.65}%`} y={`${cl.y-coreR*0.65+0.4}%`} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="9" fontWeight="700">!</text>
                      </g>
                    )}
                    {hasMine && <circle cx={`${cl.x-coreR*0.6}%`} cy={`${cl.y-coreR*0.6}%`} r="5" fill={C.canvasBlue} stroke="white" strokeWidth="1.5" style={{ pointerEvents:"none" }}/>}
                    {cl.label.split("\n").map((line,j,arr) => (
                      <text key={j} x={`${cl.x}%`} y={`${cl.y}%`} dy={`${(j-(arr.length-1)/2)*14/430*100+0.3}%`}
                        textAnchor="middle" dominantBaseline="middle"
                        fill={active?"#1E293B":"#2D3B45"} fontSize="10.5" fontWeight="800"
                        fontFamily="Lato,Arial,sans-serif"
                        style={{transition:"fill 0.2s",pointerEvents:"none"}}>{line}</text>
                    ))}
                    <g style={{ pointerEvents:"none" }}>
                      <rect x={`calc(${cl.x}% - 20px)`} y={`calc(${cl.y+coreR/430*100+1.5}% - 8px)`} width="40" height="16" rx="8" fill={cc.base} fillOpacity="0.18"/>
                      <text x={`${cl.x}%`} y={`${cl.y+coreR/430*100+1.5}%`} textAnchor="middle" dominantBaseline="middle" fontSize="9.5" fill={cc.base} fontFamily="Lato,Arial,sans-serif" fontWeight="700">
                        {cl.postIds.length} post{cl.postIds.length!==1?"s":""}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Legend */}
        <div style={{ position:"absolute", bottom:14, left:14, display:"flex", gap:14, background:"rgba(255,255,255,0.97)", padding:"8px 14px", borderRadius:"6px", border:`1px solid ${C.borderLight}`, fontSize:"11px", fontFamily:"Lato,Arial,sans-serif", color:C.textLight, boxShadow:"0 2px 8px rgba(0,0,0,0.08)", zIndex:5, alignItems:"center" }}>
          {[
            { svg:<svg width="16" height="16"><circle cx="8" cy="8" r="7" fill="#7C3AED" fillOpacity="0.75"/></svg>,    label:"Clustered" },
            { svg:<svg width="22" height="4"><line x1="0" y1="2" x2="22" y2="2" stroke="#C5D0DC" strokeWidth="2"/></svg>,label:"Connection" },
            { svg:<svg width="22" height="4"><line x1="0" y1="2" x2="22" y2="2" stroke="#94A3B8" strokeWidth="2" strokeDasharray="5 3"/></svg>,label:"Underexplored" },
            { svg:<svg width="16" height="16"><circle cx="8" cy="8" r="6" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="4 3"/></svg>,label:"Gap — click to contribute" },
          ].map((item,i) => (
            <span key={i} style={{ display:"flex", alignItems:"center", gap:6 }}>{item.svg}{item.label}</span>
          ))}
        </div>
      </div>

      {/* Bottom panel */}
      <div style={{ padding:"16px 20px", borderTop:`1px solid ${C.borderLight}`, background:"#FAFBFC", minHeight:"88px" }}>
        {selectedConnectionKey ? (() => {
          const [fId,tId] = connFromKey(selectedConnectionKey);
          const conn = connections.find(c=>(c.from===fId&&c.to===tId)||(c.from===tId&&c.to===fId));
          if (!conn) return <DiscourseHealthSummary clusters={clusters}/>;
          const from = getClusterById(conn.from), to = getClusterById(conn.to);
          const fcc = CLUSTER_COLORS[conn.from], tcc = CLUSTER_COLORS[conn.to];
          const shared = discussionPosts.filter(p => {
            const ids = Array.isArray(p.clusterIds) && p.clusterIds.length > 0 ? p.clusterIds : [p.clusterId].filter(Boolean);
            return ids.includes(conn.from) && ids.includes(conn.to);
          });
          return (
            <div>
              <div style={{ display:"flex", alignItems:"flex-start", gap:16 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, paddingTop:4, flexShrink:0 }}>
                  <div style={{ width:11, height:11, borderRadius:"50%", background:fcc?.base||C.textLight }}/>
                  <div style={{ width:30, height:2, background:conn.strength==="underexplored"?"#94A3B8":C.canvasBlue, borderRadius:1 }}/>
                  <div style={{ width:11, height:11, borderRadius:"50%", background:tcc?.base||C.textLight }}/>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:"11px", fontWeight:"800", color:C.textLight, fontFamily:"Lato,Arial,sans-serif", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:4 }}>
                    Bridge (click the line to explore)
                  </div>
                  <div style={{ fontSize:"15px", fontWeight:"800", color:C.text, fontFamily:"Lato,Arial,sans-serif", marginBottom:4 }}>
                    {from?.shortLabel} ↔ {to?.shortLabel}
                  </div>
                  <div style={{ fontSize:"13px", color:C.text, lineHeight:1.5, fontFamily:"Lato,Arial,sans-serif" }}>{conn.label}</div>
                  {Array.isArray(conn.evidenceKeywords) && conn.evidenceKeywords.length > 0 && (
                    <div style={{ marginTop:10, display:"flex", flexWrap:"wrap", gap:8 }}>
                      {conn.evidenceKeywords.map(k => (
                        <span key={k} style={{ fontSize:"11px", padding:"3px 8px", borderRadius:"999px", border:`1px solid ${C.borderLight}`, background:C.white, color:C.textLight, fontFamily:"Lato,Arial,sans-serif" }}>
                          {k}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginTop:12 }}>
                <div style={{ fontSize:"12px", fontWeight:"900", color:C.text, fontFamily:"Lato,Arial,sans-serif", marginBottom:8 }}>
                  Bridging posts
                </div>
                {shared.length === 0 ? (
                  <div style={{ fontSize:"12px", color:C.textLight, fontFamily:"Lato,Arial,sans-serif" }}>
                    No shared posts yet. Write a post that touches both themes to create a visible connection.
                  </div>
                ) : (
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {shared.map(p => {
                      const txt = extractPostText(p.text);
                      return (
                        <div key={p.id} role="button" tabIndex={0} onClick={() => onJumpToPost(p.id)}
                          style={{ padding:"8px 12px", background:C.white, border:`1px solid ${C.borderLight}`, borderRadius:"8px", fontSize:"12px", color:C.text, fontFamily:"Lato,Arial,sans-serif", flex:"1 1 260px", maxWidth:"330px", cursor:"pointer" }}>
                          <strong style={{ color:C.linkBlue }}>{p.authorName}:</strong> {txt.length > 110 ? `${txt.substring(0,110)}…` : txt}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })()
        : selectedCluster ? (() => {
          const cl = getClusterById(selectedCluster);
          if (!cl) return null;
          const cc = CLUSTER_COLORS[cl.id];
          if (cl.isGap) return (
            <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
              <div style={{ width:38, height:38, borderRadius:"50%", border:"2px dashed #94A3B8", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", flexShrink:0 }}>💡</div>
              <div>
                <div style={{ fontSize:"14px", fontWeight:"700", color:C.text, fontFamily:"Lato,Arial,sans-serif", marginBottom:4 }}>This area hasn't been explored yet.</div>
                <div style={{ fontSize:"12px", color:C.textLight, fontFamily:"Lato,Arial,sans-serif", lineHeight:1.6 }}>Be the first to contribute! Consider: How might understanding cognitive biases inform teaching or instructional design?</div>
              </div>
            </div>
          );
          const clPosts = discussionPosts.filter(p => cl.postIds.includes(p.id));
          const related = connections.filter(c=>c.from===cl.id||c.to===cl.id).map(c=>getClusterById(c.from===cl.id?c.to:c.from)).filter(Boolean);
          return (
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10, flexWrap:"wrap" }}>
                <div style={{ width:12, height:12, borderRadius:"50%", background:cc?.base||C.textLight, boxShadow:`0 0 0 3px ${cc?.glow||"transparent"}` }}/>
                <span style={{ fontSize:"14px", fontWeight:"700", color:C.text, fontFamily:"Lato,Arial,sans-serif" }}>{cl.shortLabel}</span>
                <span style={{ fontSize:"12px", color:C.textLight, fontFamily:"Lato,Arial,sans-serif", background:"#F1F5F9", padding:"2px 8px", borderRadius:"10px", fontWeight:"600" }}>{cl.postIds.length} contributor{cl.postIds.length!==1?"s":""}</span>
                {related.length>0 && <span style={{ fontSize:"11px", color:C.textLight, fontFamily:"Lato,Arial,sans-serif" }}>· Related: {related.map(r=>r.shortLabel).join(", ")}</span>}
                {clPosts.length > 0 && (
                  <button type="button" onClick={() => onJumpToPost(clPosts[0].id)} style={{ marginLeft:"auto", fontSize:"11px", color:C.linkBlue, background:"none", border:"none", cursor:"pointer", fontFamily:"Lato,Arial,sans-serif", textDecoration:"underline" }}>
                    Jump to first in thread
                  </button>
                )}
              </div>
              {isStudy ? (
                <div style={{ marginTop:8, fontSize:"12px", color:C.textLight, fontFamily:"Lato,Arial,sans-serif", lineHeight:1.6 }}>
                  In Study mode, click a <b>connection line</b> to reveal the bridging posts and the reading-grounded keywords used to connect themes.
                </div>
              ) : (
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {clPosts.map(p => (
                    <div key={p.id} role="button" tabIndex={0} onClick={() => onJumpToPost(p.id)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onJumpToPost(p.id); } }}
                      style={{ padding:"8px 12px", background:C.white, border:`1px solid ${C.borderLight}`, borderRadius:"6px", borderLeft:`3px solid ${cc?.base||C.border}`, fontSize:"12px", color:C.text, fontFamily:"Lato,Arial,sans-serif", flex:"1 1 240px", maxWidth:"310px", cursor:"pointer" }}>
                      {(() => {
                        const txt = extractPostText(p.text);
                        return (
                          <>
                            <strong style={{ color:C.linkBlue }}>{p.authorName}:</strong> {txt.length > 95 ? `${txt.substring(0,95)}…` : txt}
                          </>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()
        : <DiscourseHealthSummary clusters={clusters}/>}
      </div>

      {/* My Posts toggle */}
      <div style={{ padding:"10px 20px", borderTop:`1px solid ${C.borderLight}`, background:"#F8FAFC" }}>
        <label style={{ fontSize:"12px", color:C.textLight, fontFamily:"Lato,Arial,sans-serif", cursor:"pointer", display:"inline-flex", alignItems:"center", gap:6, userSelect:"none" }}>
          <input type="checkbox" checked={myPostsHighlight} onChange={e => setMyPostsHighlight(e.target.checked)} style={{ accentColor:C.canvasBlue }}/>
          Highlight "My Posts" in map
        </label>
      </div>
    </div>
  );
}

// ─── Full Map View (SAIL-inspired 3-panel overlay) ───────────────────────────
function FullMapView({ clusters, posts, onClose, onOpenReply, isNewTab = false, connections = CONNECTIONS, keywords = KEYWORDS }) {
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [hoveredCluster,  setHoveredCluster]  = useState(null);
  const [noteText,        setNoteText]        = useState("");
  const [notesSaved,      setNotesSaved]      = useState(false);
  const [themesOpen,      setThemesOpen]      = useState(true);
  const [workspaceOpen,   setWorkspaceOpen]   = useState(true);
  const [activePrompt,    setActivePrompt]    = useState(null);
  const [copied,          setCopied]          = useState(false);
  const [zoom,            setZoom]            = useState(1);
  const [pan,             setPan]             = useState({ x:0, y:0 });
  const [isDragging,      setIsDragging]      = useState(false);
  const dragStart = useRef({});

  useEffect(() => {
    try {
      const s = localStorage.getItem(NOTES_STORAGE_KEY);
      if (s != null) setNoteText(s);
    } catch { /* ignore */ }
  }, []);

  // Apple system colors
  const A = {
    bg:           "#F5F5F7",
    panel:        "#FFFFFF",
    sidebar:      "#F2F2F7",
    separator:    "#E5E5EA",
    separator2:   "#D1D1D6",
    label:        "#1C1C1E",
    label2:       "#3C3C43",
    label3:       "#6C6C70",
    label4:       "#8E8E93",
    blue:         "#007AFF",
    blueLight:    "#E1F0FF",
    green:        "#34C759",
    orange:       "#FF9500",
    red:          "#FF3B30",
    purple:       "#AF52DE",
    fill:         "#F2F2F7",
    fill2:        "#E5E5EA",
  };

  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const activeCl   = selectedCluster ? clusters.find(c => c.id === selectedCluster) : null;
  const nonGaps    = clusters.filter(c => !c.isGap);
  const gaps       = clusters.filter(c => c.isGap);
  const getClById  = id => clusters.find(c => c.id === id);
  const workspacePrompts = activeCl && !activeCl.isGap
    ? getContextualPrompts(posts.find(p => activeCl.postIds.includes(p.id)) || null, clusters, posts)
    : EPISTEMIC_PROMPTS;

  const saveNotesToStorage = () => {
    try {
      localStorage.setItem(NOTES_STORAGE_KEY, noteText);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2200);
    } catch { /* ignore */ }
  };

  const handleCopy = (text) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:10000, background:A.bg, display:"flex", flexDirection:"column", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Lato',sans-serif", animation:"fmvIn 0.22s ease both" }}>
      <style>{`
        @keyframes fmvIn   { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes gapSpin { to{stroke-dashoffset:-20} }
        @keyframes clIn    { from{opacity:0;transform:scale(0.6)} to{opacity:1;transform:scale(1)} }
        @keyframes apPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .fv-row:hover { background:#F2F2F7 !important; }
        .fv-prompt:hover { background:#F5F5F7 !important; }
        ::-webkit-scrollbar { width:6px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#D1D1D6; border-radius:3px; }
      `}</style>

      {/* ── Top bar (macOS window-bar feel) ── */}
      <div style={{ height:52, background:"rgba(255,255,255,0.85)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", borderBottom:`1px solid ${A.separator}`, display:"flex", alignItems:"center", padding:"0 20px", gap:14, flexShrink:0 }}>
        {/* Traffic-light dots */}
        <div style={{ display:"flex", gap:6, marginRight:4 }}>
          <div onClick={onClose} title="Close" style={{ width:12, height:12, borderRadius:"50%", background:"#FF5F57", cursor:"pointer", flexShrink:0 }}/>
          <div style={{ width:12, height:12, borderRadius:"50%", background:A.fill2, flexShrink:0 }}/>
          <div style={{ width:12, height:12, borderRadius:"50%", background:A.fill2, flexShrink:0 }}/>
        </div>
        <div style={{ width:1, height:20, background:A.separator, flexShrink:0 }}/>
        <div style={{ width:7, height:7, borderRadius:"50%", background:A.green, animation:"apPulse 2.5s ease-in-out infinite" }}/>
        <span style={{ fontSize:"14px", fontWeight:"600", color:A.label, letterSpacing:"-0.2px" }}>Discourse Map</span>
        <span style={{ fontSize:"11px", color:A.blue, background:A.blueLight, padding:"2px 9px", borderRadius:"10px", fontWeight:"600" }}>Full View</span>
        <span style={{ fontSize:"12px", color:A.label4 }}>
          {clusters.reduce((a,c)=>a+c.postIds.length,0)} posts · {nonGaps.length} clusters · {gaps.length} gap{gaps.length!==1?"s":""}
        </span>
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:10 }}>
          {isNewTab && <span style={{ fontSize:"11px", color:A.label4, fontStyle:"italic" }}>Read-only — return to Canvas to post</span>}
          <button onClick={onClose}
            style={{ background:A.fill, border:`1px solid ${A.separator2}`, borderRadius:"8px", padding:"5px 14px", fontSize:"12px", color:A.label2, cursor:"pointer", fontWeight:"500" }}>
            Close
          </button>
        </div>
      </div>

      {/* ── 3-panel body ── */}
      <div style={{ flex:1, display:"flex", minHeight:0 }}>

        {/* LEFT: Map */}
        <div style={{ flex:1, minWidth:200, borderRight:`1px solid ${A.separator}`, display:"flex", flexDirection:"column", background:"#FAFAFA" }}>
          <div style={{ padding:"10px 16px", borderBottom:`1px solid ${A.separator}`, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0, background:A.panel }}>
            <span style={{ fontSize:"11px", fontWeight:"600", color:A.label3, textTransform:"uppercase", letterSpacing:"0.5px" }}>Map</span>
            <div style={{ display:"flex", gap:4, alignItems:"center" }}>
              <button onClick={()=>setZoom(z=>Math.max(0.5,z-0.15))} style={{ background:A.fill, border:`1px solid ${A.separator2}`, borderRadius:"6px", width:22, height:22, cursor:"pointer", color:A.label3, fontSize:"14px", display:"flex", alignItems:"center", justifyContent:"center" }}>−</button>
              <span style={{ fontSize:"11px", color:A.label4, minWidth:34, textAlign:"center", fontWeight:"500" }}>{Math.round(zoom*100)}%</span>
              <button onClick={()=>setZoom(z=>Math.min(2.2,z+0.15))} style={{ background:A.fill, border:`1px solid ${A.separator2}`, borderRadius:"6px", width:22, height:22, cursor:"pointer", color:A.label3, fontSize:"14px", display:"flex", alignItems:"center", justifyContent:"center" }}>+</button>
              <button onClick={()=>{setZoom(1);setPan({x:0,y:0});}} style={{ background:A.fill, border:`1px solid ${A.separator2}`, borderRadius:"6px", padding:"0 8px", height:22, cursor:"pointer", color:A.label4, fontSize:"10px", fontWeight:"600" }}>Reset</button>
            </div>
          </div>

          <div style={{ flex:1, overflow:"hidden", position:"relative", cursor:isDragging?"grabbing":"grab", userSelect:"none", background:"linear-gradient(145deg,#F8FAFC 0%,#EFF4F9 100%)" }}
            onWheel={e=>{e.preventDefault();setZoom(z=>Math.min(2.2,Math.max(0.5,z+(e.deltaY>0?-0.1:0.1))));}}
            onMouseDown={e=>{if(e.button!==0)return;setIsDragging(true);dragStart.current={sx:e.clientX,sy:e.clientY,px:pan.x,py:pan.y};}}
            onMouseMove={e=>{if(!isDragging)return;setPan({x:dragStart.current.px+(e.clientX-dragStart.current.sx),y:dragStart.current.py+(e.clientY-dragStart.current.sy)});}}
            onMouseUp={()=>setIsDragging(false)} onMouseLeave={()=>setIsDragging(false)}
          >
            <div style={{ width:"100%", height:"100%", transform:`translate(${pan.x}px,${pan.y}px) scale(${zoom})`, transformOrigin:"50% 50%", transition:isDragging?"none":"transform 0.2s ease" }}>
              <svg width="100%" height="100%" style={{ position:"absolute", inset:0 }}>
                <defs>
                  {clusters.filter(c=>!c.isGap).map(cl=>{
                    const cc=CLUSTER_COLORS[cl.id]||{light:"#E2E8F0",base:"#94A3B8"};
                    return <radialGradient key={cl.id} id={`fv-g-${cl.id}`} cx="38%" cy="32%" r="68%"><stop offset="0%" stopColor={cc.light}/><stop offset="100%" stopColor={cc.base} stopOpacity="0.9"/></radialGradient>;
                  })}
                  <filter id="fv-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="9" result="b"/>
                    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                  <filter id="fv-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="5" floodOpacity="0.12"/>
                  </filter>
                  {/* dot grid */}
                  <pattern id="fv-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                    <circle cx="12" cy="12" r="0.85" fill="#B0BEC5" opacity="0.5"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#fv-dots)"/>

                {/* Connections */}
                {connections.map((conn,i)=>{
                  const from=getClById(conn.from), to=getClById(conn.to);
                  if(!from||!to) return null;
                  const dashed=conn.strength==="underexplored";
                  return <line key={i}
                    x1={`${from.x}%`} y1={`${from.y}%`} x2={`${to.x}%`} y2={`${to.y}%`}
                    stroke={dashed?"#B0BEC5":"#90A4AE"} strokeWidth={dashed?1.2:1.8}
                    strokeDasharray={dashed?"8 5":"none"} opacity={dashed?0.6:0.75} strokeLinecap="round"/>;
                })}

                {/* Keywords */}
                {keywords.map((kw,i)=>{
                  const cc=CLUSTER_COLORS[kw.clusterId];
                  const vis=!hoveredCluster||hoveredCluster===kw.clusterId;
                  const tw=kw.label.length*5+14;
                  return (
                    <g key={i} opacity={vis?0.9:0.06} style={{transition:"opacity 0.3s",pointerEvents:"none"}}>
                      <rect x={`calc(${kw.x}% - ${tw/2}px)`} y={`calc(${kw.y}% - 9px)`} width={tw} height="18" rx="9"
                        fill="white" fillOpacity="0.85"
                        stroke={cc?cc.base:"#94A3B8"} strokeOpacity="0.4" strokeWidth="1"/>
                      <text x={`${kw.x}%`} y={`${kw.y+0.4}%`} textAnchor="middle" dominantBaseline="middle"
                        fill={cc?cc.base:"#64748B"} fontSize="9" fontFamily="-apple-system,Lato,sans-serif" fontWeight="600">{kw.label}</text>
                    </g>
                  );
                })}

                {/* Clusters */}
                {clusters.map((cl,idx)=>{
                  const cc=CLUSTER_COLORS[cl.id]||{base:"#8E8E93",light:"#C7C7CC",glow:"rgba(142,142,147,0.25)"};
                  const isSel=selectedCluster===cl.id, isHov=hoveredCluster===cl.id, active=isSel||isHov;
                  const coreR=active?cl.size*0.32:cl.size*0.27;

                  if(cl.isGap) return (
                    <g key={cl.id} style={{cursor:"pointer",animation:`clIn 0.45s ${idx*0.055}s both`}}
                      onClick={()=>setSelectedCluster(selectedCluster===cl.id?null:cl.id)}
                      onMouseEnter={()=>setHoveredCluster(cl.id)} onMouseLeave={()=>setHoveredCluster(null)}>
                      <circle cx={`${cl.x}%`} cy={`${cl.y}%`} r={cl.size*0.86} fill="white" fillOpacity={active?0.5:0.3}/>
                      <circle cx={`${cl.x}%`} cy={`${cl.y}%`} r={cl.size*0.86} fill="none" stroke="#8E8E93" strokeWidth="1.5" strokeDasharray="7 5" style={{animation:"gapSpin 7s linear infinite"}} opacity={active?0.7:0.4}/>
                      <text x={`${cl.x}%`} y={`${cl.y-1}%`} textAnchor="middle" dominantBaseline="middle" fill="#8E8E93" fontSize="16" opacity={active?0.9:0.55}>?</text>
                      {cl.label.split("\n").map((ln,j)=><text key={j} x={`${cl.x}%`} y={`${cl.y+6+j*11}%`} textAnchor="middle" fill={active?"#6C6C70":"#8E8E93"} fontSize="9.5" fontFamily="-apple-system,Lato,sans-serif" fontStyle="italic" opacity={active?0.9:0.55}>{ln}</text>)}
                    </g>
                  );

                  return (
                    <g key={cl.id} style={{cursor:"pointer",animation:`clIn 0.45s ${idx*0.055}s both`}}
                      onClick={()=>setSelectedCluster(selectedCluster===cl.id?null:cl.id)}
                      onMouseEnter={()=>setHoveredCluster(cl.id)} onMouseLeave={()=>setHoveredCluster(null)}>
                      {/* outer glow */}
                      <circle cx={`${cl.x}%`} cy={`${cl.y}%`} r={cl.size*0.88} fill={cc.base} opacity={active?0.13:0.06} style={{transition:"opacity 0.3s"}}/>
                      {/* mid ring */}
                      <circle cx={`${cl.x}%`} cy={`${cl.y}%`} r={cl.size*0.54} fill={cc.base} opacity={active?0.18:0.08} style={{transition:"opacity 0.3s"}}/>
                      {/* glow when active */}
                      {active && <circle cx={`${cl.x}%`} cy={`${cl.y}%`} r={coreR+10} fill={cc.glow} filter="url(#fv-glow)" opacity="0.5"/>}
                      {/* core */}
                      <circle cx={`${cl.x}%`} cy={`${cl.y}%`} r={coreR} fill={`url(#fv-g-${cl.id})`} filter={active?"url(#fv-shadow)":"none"} style={{transition:"r 0.25s cubic-bezier(0.34,1.56,0.64,1)"}}/>
                      {/* selection ring */}
                      {isSel && <circle cx={`${cl.x}%`} cy={`${cl.y}%`} r={cl.size*0.54+3} fill="none" stroke={cc.base} strokeWidth="2" opacity="0.55"/>}
                      {/* label */}
                      {cl.label.split("\n").map((ln,j,arr)=>(
                        <text key={j} x={`${cl.x}%`} y={`${cl.y}%`} dy={`${(j-(arr.length-1)/2)*14/430*100+0.3}%`}
                          textAnchor="middle" dominantBaseline="middle"
                          fill={active?"#1C1C1E":"#2D3B45"} fontSize="10.5" fontWeight="700"
                          fontFamily="-apple-system,Lato,sans-serif" style={{pointerEvents:"none"}}>{ln}</text>
                      ))}
                      {/* count */}
                      <text x={`${cl.x}%`} y={`${cl.y+coreR/430*100+1.8}%`}
                        textAnchor="middle" dominantBaseline="middle" fontSize="9"
                        fill={cc.base} fontFamily="-apple-system,Lato,sans-serif" fontWeight="600" opacity="0.85">
                        {cl.postIds.length} post{cl.postIds.length!==1?"s":""}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Legend */}
          <div style={{ padding:"8px 16px", borderTop:`1px solid ${A.separator}`, display:"flex", gap:16, fontSize:"10px", color:A.label4, flexShrink:0, background:A.panel, alignItems:"center" }}>
            <span style={{ display:"flex", alignItems:"center", gap:5 }}><span style={{ width:9, height:9, borderRadius:"50%", background:"#7C3AED", opacity:0.7, display:"inline-block" }}/>Cluster</span>
            <span style={{ display:"flex", alignItems:"center", gap:5 }}><svg width="18" height="3"><line x1="0" y1="1.5" x2="18" y2="1.5" stroke="#90A4AE" strokeWidth="1.5"/></svg>Connection</span>
            <span style={{ display:"flex", alignItems:"center", gap:5 }}><svg width="18" height="3"><line x1="0" y1="1.5" x2="18" y2="1.5" stroke="#B0BEC5" strokeWidth="1.5" strokeDasharray="4 3"/></svg>Underexplored</span>
            <span style={{ display:"flex", alignItems:"center", gap:5 }}><svg width="12" height="12"><circle cx="6" cy="6" r="5" fill="none" stroke="#8E8E93" strokeWidth="1.3" strokeDasharray="3 2"/></svg>Gap</span>
          </div>
        </div>

        {/* CENTER: Themes */}
        <div style={{ width:themesOpen?280:40, minWidth:themesOpen?200:40, flexShrink:0, borderRight:`0.5px solid ${A.separator}`, display:"flex", flexDirection:"column", background:A.panel, overflow:"hidden", transition:"width 0.2s ease" }}>
          <div style={{ padding:"0 8px", height:34, borderBottom:`0.5px solid ${A.separator}`, display:"flex", alignItems:"center", flexShrink:0, justifyContent:"space-between" }}>
            {themesOpen && <span style={{ fontSize:"10px", fontWeight:"700", letterSpacing:"0.7px", color:A.label3, textTransform:"uppercase" }}>Themes</span>}
            <button type="button" title={themesOpen?"Collapse themes":"Expand themes"} onClick={()=>setThemesOpen(o=>!o)}
              style={{ marginLeft:themesOpen?"auto":0, width:28, height:28, border:"none", background:"transparent", cursor:"pointer", color:A.label3, fontSize:"14px", borderRadius:6 }}>
              {themesOpen?"◀":"▶"}
            </button>
          </div>
          {themesOpen && <div style={{ padding:"5px 12px", borderBottom:`0.5px solid ${A.separator}`, fontSize:"10.5px", color:A.label3, flexShrink:0 }}>Select a theme to explore</div>}
          <div style={{ flex:1, overflowY:"auto", overflowX:"hidden", display:themesOpen?"block":"none" }}>
            {clusters.map(cl => {
              const cc     = CLUSTER_COLORS[cl.id]||{base:"#8E8E93",light:"#C7C7CC"};
              const clPosts= posts.filter(p => cl.postIds.includes(p.id));
              const isSel  = selectedCluster === cl.id;

              // Avatar palette — deterministic per author
              const avatarPalette = [
                { bg:"rgba(0,122,255,0.13)",  fg:"#0055CC" },
                { bg:"rgba(48,209,88,0.14)",  fg:"#186430" },
                { bg:"rgba(255,149,0,0.14)",  fg:"#7A4800" },
                { bg:"rgba(175,82,222,0.13)", fg:"#6B1FA0" },
                { bg:"rgba(255,59,48,0.12)",  fg:"#A80000" },
              ];
              const avatarFor = (name) => avatarPalette[(name.charCodeAt(0)+name.charCodeAt(name.length-1)) % avatarPalette.length];

              return (
                <div key={cl.id}>
                  {/* Theme row */}
                  <div
                    onClick={()=>setSelectedCluster(selectedCluster===cl.id?null:cl.id)}
                    style={{ display:"flex", alignItems:"center", gap:7, padding:"8px 12px", cursor:"pointer", background:isSel?`rgba(0,122,255,0.07)`:"transparent", borderBottom:`0.5px solid ${A.separator}`, transition:"background 0.15s" }}
                    onMouseEnter={e=>{ if(!isSel) e.currentTarget.style.background="rgba(0,0,0,0.025)"; }}
                    onMouseLeave={e=>{ if(!isSel) e.currentTarget.style.background="transparent"; }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:cl.isGap?"transparent":cc.base, border:cl.isGap?`1.5px dashed ${A.label4}`:"none", opacity:cl.isGap?0.55:1, flexShrink:0 }}/>
                    <span style={{ fontSize:"11.5px", fontWeight:cl.isGap?"400":"600", color:cl.isGap?A.label3:A.label, flex:1, lineHeight:1.2 }}>{cl.shortLabel}</span>
                    <span style={{ fontSize:"11.5px", color:isSel?cc.base:A.label3, fontWeight:isSel?"600":"400" }}>{cl.isGap?"Gap":cl.postIds.length}</span>
                    <span style={{ fontSize:"8.5px", color:A.label3, marginLeft:1 }}>{isSel?"▼":"›"}</span>
                  </div>

                  {/* Expanded posts */}
                  {isSel && clPosts.length > 0 && (
                    <div style={{ background:`rgba(0,122,255,0.03)` }}>
                      {clPosts.map(p => {
                        const av = avatarFor(p.authorName);
                        return (
                          <div key={p.id} style={{ display:"flex", gap:9, alignItems:"flex-start", padding:"8px 12px", borderBottom:`0.5px solid rgba(0,122,255,0.06)`, cursor:"pointer" }}
                            onMouseEnter={e=>e.currentTarget.style.background="rgba(0,122,255,0.055)"}
                            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                            <div style={{ width:26, height:26, borderRadius:"50%", background:av.bg, color:av.fg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"9.5px", fontWeight:"600", flexShrink:0, marginTop:1, letterSpacing:"-0.1px" }}>
                              {p.initials}
                            </div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontSize:"11px", fontWeight:"600", color:av.fg, marginBottom:2, lineHeight:1 }}>{p.authorName}</div>
                              <div style={{ fontSize:"11px", color:A.label3, lineHeight:1.4 }}>{p.text.substring(0,120)}…</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Gap state */}
                  {isSel && cl.isGap && (
                    <div style={{ padding:"10px 12px", background:`rgba(0,122,255,0.03)`, textAlign:"center" }}>
                      <div style={{ fontSize:"11px", color:A.label4, marginBottom:8 }}>No posts yet in this area</div>
                      {isNewTab
                        ? <span style={{ fontSize:"11px", color:A.label4, fontStyle:"italic" }}>Return to Canvas to contribute</span>
                        : <button onClick={e=>{e.stopPropagation();onOpenReply(null,cl.id,"");onClose();}}
                            style={{ fontSize:"11px", color:A.blue, background:"white", border:`0.5px solid rgba(0,122,255,0.35)`, borderRadius:"6px", padding:"4px 13px", cursor:"pointer", fontWeight:"500" }}>
                            Contribute to this gap
                          </button>
                      }
                    </div>
                  )}

                  {/* Connected themes — shown inside selected */}
                  {isSel && (() => {
                    const conns = CONNECTIONS.filter(c=>c.from===cl.id||c.to===cl.id);
                    if (!conns.length) return null;
                    return (
                      <div>
                        <div style={{ padding:"6px 12px 3px", fontSize:"9px", fontWeight:"700", letterSpacing:"0.7px", color:A.label3, textTransform:"uppercase" }}>Connected Themes</div>
                        {conns.map((conn,i) => {
                          const other = clusters.find(c=>c.id===(conn.from===cl.id?conn.to:conn.from));
                          const occ   = CLUSTER_COLORS[other?.id]||{base:A.label4};
                          return (
                            <div key={i} style={{ display:"flex", alignItems:"center", gap:7, padding:"5px 12px", cursor:"pointer", borderBottom:i<conns.length-1?`0.5px solid ${A.separator}`:"none" }}
                              onMouseEnter={e=>e.currentTarget.style.background="rgba(0,0,0,0.025)"}
                              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                              <div style={{ width:8, height:8, borderRadius:"50%", background:occ.base, flexShrink:0 }}/>
                              <span style={{ fontSize:"11px", color:A.blue }}>{other?.shortLabel}</span>
                              {conn.strength==="underexplored" && <span style={{ fontSize:"9.5px", color:A.orange, marginLeft:"auto" }}>⚡ unexplored</span>}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Workspace */}
        <div style={{ flex:workspaceOpen?1:undefined, width:workspaceOpen?undefined:40, minWidth:workspaceOpen?240:40, flexShrink:0, display:"flex", flexDirection:"column", background:A.sidebar, overflow:"hidden", transition:"min-width 0.2s ease,width 0.2s ease" }}>
          <div style={{ padding:"0 8px", height:34, borderBottom:`0.5px solid ${A.separator}`, display:"flex", alignItems:"center", flexShrink:0, background:"transparent", justifyContent:"space-between" }}>
            <button type="button" title={workspaceOpen?"Collapse workspace":"Expand workspace"} onClick={()=>setWorkspaceOpen(o=>!o)}
              style={{ width:28, height:28, border:"none", background:"transparent", cursor:"pointer", color:A.label3, fontSize:"14px", borderRadius:6, order:workspaceOpen?0:1 }}>
              {workspaceOpen?"▶":"◀"}
            </button>
            {workspaceOpen && <span style={{ fontSize:"10px", fontWeight:"700", letterSpacing:"0.7px", color:A.label3, textTransform:"uppercase", flex:1, textAlign:"center" }}>Workspace</span>}
            {workspaceOpen && <span style={{ width:28 }}/>}
          </div>
          {workspaceOpen && <div style={{ padding:"5px 12px", borderBottom:`0.5px solid ${A.separator}`, fontSize:"10.5px", color:A.label3, flexShrink:0 }}>
            {activeCl ? `Writing angles for: ${activeCl.shortLabel}` : "Select a theme for writing angles"}
          </div>}
          <div style={{ flex:1, overflowY:"auto", overflowX:"hidden", display:workspaceOpen?"block":"none" }}>

            {/* Discussion Health */}
            <div style={{ padding:"11px 12px", borderBottom:`0.5px solid ${A.separator}` }}>
              <div style={{ fontSize:"9.5px", fontWeight:"700", letterSpacing:"0.8px", color:A.label3, textTransform:"uppercase", marginBottom:8 }}>Discussion Health</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                {[
                  { n:nonGaps.length,                                             label:"Active themes",    color:A.green,  hint:"Clusters on the map that already have student posts." },
                  { n:gaps.length,                                                label:"Unexplored gaps",  color:A.orange, hint:"Theme areas with no posts yet (instructor-seeded gaps)." },
                  { n:CONNECTIONS.filter(c=>c.strength==="underexplored").length, label:"Weak connections", color:A.orange, hint:"Links between themes marked as underexplored in this prototype (few posts bridging those ideas)." },
                  { n:clusters.filter(c=>c.consensusWarning).length,              label:"Consensus risks",  color:A.red,    hint:"Clusters where the mock data flags similar views and missing counter-perspectives." },
                ].map((s,i)=>(
                  <div key={i} title={s.hint} style={{ background:A.panel, borderRadius:"9px", border:`0.5px solid ${A.separator}`, padding:"8px 9px", cursor:"help" }}>
                    <div style={{ fontSize:"24px", fontWeight:"200", color:s.color, lineHeight:1, marginBottom:2, letterSpacing:"-0.5px" }}>{s.n}</div>
                    <div style={{ fontSize:"9.5px", color:A.label3, lineHeight:1.3 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize:"9px", color:A.label4, marginTop:8, lineHeight:1.45 }}>Hover a tile for definitions. Counts are illustrative for this prototype, not live AI analytics.</div>
            </div>

            {/* Writing Angles */}
            <div style={{ padding:"11px 12px", borderBottom:`0.5px solid ${A.separator}` }}>
              <div style={{ fontSize:"9.5px", fontWeight:"700", letterSpacing:"0.8px", color:A.label3, textTransform:"uppercase", marginBottom:4 }}>Writing Angles</div>
              <div style={{ fontSize:"9px", color:A.label4, marginBottom:8, lineHeight:1.4 }}>Prototype: static prompts per theme (not generated by AI). Items update when you select a different theme.</div>
              {workspacePrompts.map(p => {
                const isAct = activePrompt?.id === p.id;
                const iconSvgs = {
                  "🔍": <svg width="12" height="12" fill="none"><path d="M2 6h8M6 2v8" stroke={A.blue} strokeWidth="1.5" strokeLinecap="round"/></svg>,
                  "⚖️": <svg width="12" height="12" fill="none"><path d="M1 6h4m6 0H7m0-3 3 3-3 3M5 3 2 6l3 3" stroke={A.blue} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
                  "🔗": <svg width="12" height="12" fill="none"><circle cx="6" cy="6" r="4.5" stroke={A.blue} strokeWidth="1.5"/><path d="M6 4v3m0 1.5v.5" stroke={A.blue} strokeWidth="1.2" strokeLinecap="round"/></svg>,
                };
                return (
                  <div key={p.id}>
                    <div
                      onClick={()=>setActivePrompt(isAct?null:p)}
                      style={{ display:"flex", alignItems:"center", padding:"7px 9px", gap:8, background:A.panel, borderRadius:"8px", marginBottom:5, cursor:"pointer", border:`0.5px solid ${A.separator}`, transition:"background 0.12s" }}
                      onMouseEnter={e=>e.currentTarget.style.background="#FAFAFA"}
                      onMouseLeave={e=>e.currentTarget.style.background=A.panel}>
                      <div style={{ width:22, height:22, borderRadius:"6px", background:`rgba(0,122,255,0.1)`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        {iconSvgs[p.icon] || iconSvgs["🔍"]}
                      </div>
                      <span style={{ fontSize:"11px", color:A.label, flex:1, lineHeight:1.3 }}>{p.label}</span>
                      <span style={{ fontSize:"9px", color:A.label3 }}>{isAct?"▾":"›"}</span>
                    </div>
                    {isAct && (
                      <div style={{ background:A.panel, borderRadius:"8px", padding:"10px 11px", marginBottom:5, border:`0.5px solid ${A.separator}` }}>
                        <div style={{ fontSize:"11px", color:A.label3, lineHeight:1.5, marginBottom:9 }}>{p.text}</div>
                        <div style={{ background:A.sidebar, borderRadius:"6px", padding:"8px 10px", fontSize:"11px", color:A.label2, fontStyle:"italic", lineHeight:1.5, marginBottom:8, border:`0.5px solid ${A.separator}`, userSelect:"text" }}>
                          "{p.starter}"
                        </div>
                        <button onClick={e=>{e.stopPropagation();handleCopy(p.starter);}}
                          style={{ fontSize:"11px", color:copied?"#186430":A.blue, background:copied?"rgba(48,209,88,0.12)":"rgba(0,122,255,0.09)", border:"none", borderRadius:"6px", padding:"4px 11px", cursor:"pointer", fontWeight:"500", transition:"all 0.2s" }}>
                          {copied?"✓ Copied":"Copy starter"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Notes */}
            <div style={{ padding:"11px 12px" }}>
              <div style={{ fontSize:"9.5px", fontWeight:"700", letterSpacing:"0.8px", color:A.label3, textTransform:"uppercase", marginBottom:8 }}>Notes</div>
              <textarea
                value={noteText} onChange={e=>setNoteText(e.target.value)}
                placeholder="Jot down observations before you write…"
                style={{ width:"100%", background:A.panel, border:`0.5px solid ${A.separator}`, borderRadius:"8px", padding:"8px 9px", fontSize:"11px", color:A.label, fontFamily:"-apple-system,Lato,sans-serif", lineHeight:1.5, resize:"vertical", outline:"none", minHeight:56, boxSizing:"border-box" }}
              />
              <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:8 }}>
                <button type="button" onClick={saveNotesToStorage} style={{ fontSize:"11px", color:A.blue, background:"rgba(0,122,255,0.1)", border:`0.5px solid rgba(0,122,255,0.35)`, borderRadius:"6px", padding:"5px 12px", cursor:"pointer", fontWeight:"600" }}>Save</button>
                <span style={{ fontSize:"10px", color:notesSaved?A.green:A.label4 }}>{notesSaved?"Saved on this browser":"Saved only in this browser after you click Save"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// ─── Epistemic Prompts Panel ──────────────────────────────────────────────────
function EpistemicPromptsPanel({ prompts, contextSummary, useGlobal, onToggleMode, onInsert, onDismiss, onPromptViewed }) {
  const list = prompts && prompts.length>0 ? prompts : EPISTEMIC_PROMPTS;
  const iconStyle = { "🔍":{ bg:"#EFF6FF", border:"#BFDBFE", text:"#1D4ED8" }, "⚖️":{ bg:"#FFF7ED", border:"#FED7AA", text:"#C2410C" }, "🔗":{ bg:"#F0FDF4", border:"#BBF7D0", text:"#15803D" } };
  const itemElsRef = useRef({});
  const viewedRef = useRef(new Set());
  const timersRef = useRef({});

  useEffect(() => {
    if (!onPromptViewed) return undefined;

    const els = Object.values(itemElsRef.current).filter(Boolean);
    if (els.length === 0) return undefined;

    const isMostlyVisible = (el) => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const vw = window.innerWidth || document.documentElement.clientWidth;
      return r.width > 0 && r.height > 0 && r.top >= 0 && r.left >= 0 && r.bottom <= vh && r.right <= vw;
    };

    const io = new IntersectionObserver((entries) => {
      for (const ent of entries) {
        const el = ent.target;
        const id = el?.dataset?.promptId;
        if (!id || viewedRef.current.has(id)) continue;
        const ratioOk = ent.isIntersecting && ent.intersectionRatio >= 0.9;
        if (ratioOk && document.visibilityState === "visible" && isMostlyVisible(el)) {
          if (!timersRef.current[id]) {
            timersRef.current[id] = setTimeout(() => {
              if (viewedRef.current.has(id)) return;
              if (document.visibilityState !== "visible") return;
              if (!isMostlyVisible(el)) return;
              viewedRef.current.add(id);
              const label = el.dataset.promptLabel || "";
              onPromptViewed({ promptId: id, promptLabel: label });
            }, 800);
          }
        } else {
          if (timersRef.current[id]) {
            clearTimeout(timersRef.current[id]);
            delete timersRef.current[id];
          }
        }
      }
    }, { threshold: [0, 0.25, 0.5, 0.75, 0.9, 1] });

    els.forEach(el => io.observe(el));
    return () => {
      io.disconnect();
      Object.values(timersRef.current).forEach(t => clearTimeout(t));
      timersRef.current = {};
    };
  }, [list, onPromptViewed]);

  return (
    <div style={{ background:"#F0F7FC", border:`1.5px solid ${C.canvasBlue}`, borderRadius:"6px", padding:"14px 16px", marginBottom:"12px" }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"12px" }}>
        <div>
          <div style={{ fontSize:"13px", fontWeight:"700", color:C.text, fontFamily:"Lato,Arial,sans-serif" }}>Based on the current discussion landscape, consider:</div>
          {contextSummary && <div style={{ fontSize:"11px", color:C.textLight, fontFamily:"Lato,Arial,sans-serif", marginTop:2 }}>Scaffolds based on: {contextSummary} {useGlobal?"(map‑wide)":"(cluster‑aware)"}</div>}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0, marginLeft:12 }}>
          {onToggleMode && <button onClick={onToggleMode} style={{ background:"none", border:"none", fontSize:"11px", color:C.linkBlue, cursor:"pointer", fontFamily:"Lato,Arial,sans-serif", textDecoration:"underline", whiteSpace:"nowrap" }}>{useGlobal?"Back to cluster prompts":"See map‑wide prompts"}</button>}
          <button onClick={onDismiss} style={{ background:"none", border:"none", fontSize:"11px", color:C.textLight, cursor:"pointer", fontFamily:"Lato,Arial,sans-serif" }}>Dismiss</button>
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
        {list.map(prompt => {
          const s = iconStyle[prompt.icon] || { bg:"#F8FAFC", border:C.borderLight, text:C.text };
          return (
            <div
              key={prompt.id}
              ref={el => { if (el) itemElsRef.current[prompt.id] = el; }}
              data-prompt-id={prompt.id}
              data-prompt-label={prompt.label}
              onClick={()=>onInsert(prompt.starter)}
              style={{ display:"flex", gap:"12px", padding:"10px 14px", background:C.white, border:`1px solid ${C.borderLight}`, borderRadius:"6px", cursor:"pointer", transition:"border-color 0.15s,box-shadow 0.15s" }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=C.canvasBlue;e.currentTarget.style.boxShadow=`0 0 0 2px rgba(3,116,181,0.12)`;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=C.borderLight;e.currentTarget.style.boxShadow="none";}}>
              <div style={{ width:28, height:28, borderRadius:"6px", background:s.bg, border:`1px solid ${s.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"14px", flexShrink:0 }}>{prompt.icon}</div>
              <div>
                <div style={{ fontSize:"12px", fontWeight:"700", color:s.text, fontFamily:"Lato,Arial,sans-serif", marginBottom:2 }}>{prompt.label}</div>
                <div style={{ fontSize:"11px", color:C.textLight, fontFamily:"Lato,Arial,sans-serif", lineHeight:1.45 }}>{prompt.text}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Post Card ────────────────────────────────────────────────────────────────
function PostCard({ post, clusters, clusterColor, isMyPost, onReply, onEdit, onDelete, highlighted, isNew, onMouseEnter, onMouseLeave, refCallback, replyCount, repliesHidden, onToggleReplies }) {
  const themeIds = clusterIdsForPost(post);
  const safeText = extractPostText(post?.text);
  return (
    <div ref={refCallback} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}
      style={{ background:C.white, border:`1px solid ${highlighted?C.canvasBlue:C.borderLight}`, borderLeft:`4px solid ${clusterColor||C.border}`, borderRadius:"6px", padding:"16px 20px", marginBottom:"14px", marginLeft:post.parentId?"28px":0, transition:"border-color 0.2s,box-shadow 0.2s", boxShadow:highlighted?`0 0 0 2px rgba(3,116,181,0.1)`:"0 1px 4px rgba(0,0,0,0.04)", animation:isNew?"newPost 0.5s cubic-bezier(0.34,1.56,0.64,1) both":"none" }}>
      <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"10px" }}>
        <div style={{ width:"36px", height:"36px", borderRadius:"50%", background:isMyPost?"#EBF5FF":"#F1F5F9", border:`2px solid ${isMyPost?C.canvasBlue:C.borderLight}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"13px", fontWeight:"700", color:isMyPost?C.canvasBlue:C.text, fontFamily:"Lato,Arial,sans-serif", flexShrink:0 }}>{post.initials}</div>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
            <span style={{ fontSize:"14px", fontWeight:"700", color:C.linkBlue, fontFamily:"Lato,Arial,sans-serif" }}>{post.authorName}</span>
            {isMyPost && <span style={{ fontSize:"10px", color:C.white, background:C.canvasBlue, padding:"1px 6px", borderRadius:"10px", fontFamily:"Lato,Arial,sans-serif", fontWeight:"700" }}>You</span>}
            {clusterColor && themeIds.map(cid => {
              const cc = CLUSTER_COLORS[cid];
              const lbl = clusters.find(c => c.id === cid)?.shortLabel;
              if (!cc || !lbl) return null;
              return (
                <span key={cid} style={{ fontSize:"10px", color:cc.base, border:`1px solid ${cc.base}`, padding:"1px 7px", borderRadius:"10px", fontFamily:"Lato,Arial,sans-serif", opacity:0.75 }}>{lbl}</span>
              );
            })}
          </div>
          <div style={{ fontSize:"12px", color:C.textLight, fontFamily:"Lato,Arial,sans-serif", marginTop:1 }}>{post.date}{post.lastReply&&` · Last reply ${post.lastReply}`}</div>
        </div>
        {isMyPost && (
          <div style={{ display:"flex", gap:8, alignItems:"center", flexShrink:0 }}>
            <button type="button" onClick={()=>onEdit?.(post)} style={{ border:"none", background:"transparent", color:C.textLight, cursor:"pointer", fontSize:"12px", fontFamily:"Lato,Arial,sans-serif", textDecoration:"underline" }}>
              Edit
            </button>
            <button type="button" onClick={()=>onDelete?.(post)} style={{ border:"none", background:"transparent", color:"#B91C1C", cursor:"pointer", fontSize:"12px", fontFamily:"Lato,Arial,sans-serif", textDecoration:"underline" }}>
              Delete
            </button>
          </div>
        )}
      </div>
      <p style={{ fontSize:"14px", color:C.text, fontFamily:"Lato,Arial,sans-serif", lineHeight:"1.7", margin:"0 0 10px" }}>{safeText}</p>
      <div style={{ display:"flex", alignItems:"center", gap:"14px", paddingTop:"8px", borderTop:`1px solid ${C.borderLight}` }}>
        {replyCount>0 && onToggleReplies && (
          <span onClick={onToggleReplies} style={{ fontSize:"13px", color:C.linkBlue, fontFamily:"Lato,Arial,sans-serif", cursor:"pointer" }}>
            {repliesHidden ? `▸ Show ${replyCount} ${replyCount===1?"Reply":"Replies"}` : `▾ ${replyCount===1?"Hide 1 Reply":`Hide ${replyCount} Replies`}`}
          </span>
        )}
        <span onClick={()=>onReply(post)} style={{ fontSize:"13px", color:C.linkBlue, fontFamily:"Lato,Arial,sans-serif", cursor:"pointer" }}>↩ Reply</span>
        <span style={{ fontSize:"13px", color:C.linkBlue, fontFamily:"Lato,Arial,sans-serif", cursor:"pointer" }}>✉ Mark as Unread</span>
      </div>
    </div>
  );
}

// ─── Toast notification ───────────────────────────────────────────────────────
function Toast({ message, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, []);
  return (
    <div style={{ position:"fixed", bottom:100, left:"50%", transform:"translateX(-50%)", background:C.canvasDarkBlue, color:"white", padding:"10px 20px", borderRadius:"20px", fontSize:"13px", fontFamily:"Lato,Arial,sans-serif", fontWeight:"600", boxShadow:"0 4px 16px rgba(0,0,0,0.22)", zIndex:9998, display:"flex", alignItems:"center", gap:8, animation:"clusterIn 0.3s ease both" }}>
      <span style={{ fontSize:"16px" }}>✓</span> {message}
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const isFullViewTab = new URLSearchParams(window.location.search).get("fullview") === "1";
  if (isFullViewTab) {
    const rawClusters = sessionStorage.getItem("dm_fullview_clusters");
    const rawPosts    = sessionStorage.getItem("dm_fullview_posts");
    const tabClusters = rawClusters ? JSON.parse(rawClusters) : INITIAL_CLUSTERS;
    const tabPosts    = rawPosts    ? JSON.parse(rawPosts)    : INITIAL_POSTS;
    const isStudyLike = Array.isArray(tabClusters) && tabClusters.some(c => String(c?.id || "").includes("ethics-responsibility"));
    const tabConnections = isStudyLike ? deriveStudyConnections(tabPosts, tabClusters) : [];
    const tabKeywords = isStudyLike ? deriveStudyKeywords(tabPosts, tabClusters) : [];
    return (
      <FullMapView
        clusters={tabClusters}
        posts={tabPosts}
        onClose={()=>window.close()}
        onOpenReply={()=>{}}
        connections={tabConnections}
        keywords={tabKeywords}
        isNewTab={true}
      />
    );
  }
  return (
    <SessionLogProvider>
      <AppMain />
    </SessionLogProvider>
  );
}

function extractPostText(raw) {
  if (typeof raw === "string") return raw;
  if (!raw || typeof raw !== "object") return "";
  const candidates = [raw.text, raw.body, raw.value, raw.content, raw.message];
  for (const c of candidates) {
    if (typeof c === "string") return c;
  }
  // Nested common shape: { text: { text: "..." } }
  if (raw.text && typeof raw.text === "object" && typeof raw.text.text === "string") return raw.text.text;
  return "";
}

function AppMain() {
  const [route, setRoute] = useState(() => getRouteFromHash());
  useEffect(() => {
    const onHash = () => setRoute(getRouteFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const isDemo = route === ROUTES.demo;
  const isStudy = route === ROUTES.study;
  const firebasePostsEnabled = isStudy && isFirebaseEnabled();

  const [studyIdentity, setStudyIdentity] = useState(() => loadStudyIdentity());
  const [studyCodeInput, setStudyCodeInput] = useState("");
  const [studyLoginError, setStudyLoginError] = useState("");
  const [firebaseUid, setFirebaseUid] = useState(null);

  const [showGuide,            setShowGuide]            = useState(false);
  const [view,                 setView]                 = useState("after");
  const [vizExpanded,          setVizExpanded]          = useState(true);
  const [hoveredCluster,       setHoveredCluster]       = useState(null);
  const [selectedCluster,      setSelectedCluster]      = useState(null);
  const [myPostsHighlight,     setMyPostsHighlight]     = useState(true);
  const [connHover,            setConnHover]            = useState(null);
  const [connPin,              setConnPin]              = useState(null);
  const [replyState,           setReplyState]           = useState(null);
  const [showPrompts,          setShowPrompts]          = useState(false);
  const [zoom,                 setZoom]                 = useState(1);
  const [pan,                  setPan]                  = useState({ x:0, y:0 });
  const [useGlobalPrompts,     setUseGlobalPrompts]     = useState(false);
  const [hiddenReplyRoots,     setHiddenReplyRoots]     = useState(() => new Set());
  const [discussionPrompt,     setDiscussionPrompt]     = useState(() => ({ ...DISCUSSION_PROMPT }));

  // ── Dynamic state for features 3 & 4 ──
  const [posts,     setPosts]     = useState(INITIAL_POSTS);
  const [clusters,  setClusters]  = useState(INITIAL_CLUSTERS);
  const [studyClusterConfig, setStudyClusterConfig] = useState(() => STUDY_DEFAULT_CLUSTERS.map(({ id, label, shortLabel, x, y }) => ({ id, label, shortLabel, x, y })));

  const [activeAuthor, setActiveAuthor] = useState(CURRENT_USER);
  const { logEvent, setSessionExportSnapshot, activeScenario, activePersona, setActivePersona, setActiveAuthorId, captureMode, setCaptureMode, loggingState, startLogging, pauseLogging, resumeLogging, endLogging, genomicsCode, exportToFile, addNote } = useSessionLog();
  const [showGenomicsCode, setShowGenomicsCode] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const logoutStudy = useCallback(() => {
    try {
      localStorage.removeItem(STUDY_IDENTITY_STORAGE_KEY);
    } catch { /* ignore */ }
    setStudyIdentity(null);
    setStudyCodeInput("");
    setStudyLoginError("");
    setActiveAuthor(CURRENT_USER);
    setActiveAuthorId(CURRENT_USER.id);
  }, [setActiveAuthorId]);
  const syntheticPanelEnabled = import.meta.env.DEV && isDemo && new URLSearchParams(window.location.search).get("synthetic") === "1";
  useEffect(() => {
    setSessionExportSnapshot({ posts, clusters });
  }, [posts, clusters, setSessionExportSnapshot]);

  useEffect(() => {
    setActiveAuthorId(activeAuthor?.id ?? "unknown");
  }, [activeAuthor, setActiveAuthorId]);

  // Route-driven initialization (Study starts blank; Demo uses authored initial data).
  useEffect(() => {
    if (isStudy) {
      resetPostIdCounterFromPosts([]);
      setPosts([]);
      setStudyClusterConfig(STUDY_DEFAULT_CLUSTERS.map(({ id, label, shortLabel, x, y }) => ({ id, label, shortLabel, x, y })));
      setClusters(STUDY_DEFAULT_CLUSTERS);
      setDiscussionPrompt({ ...DISCUSSION_PROMPT, ...STUDY_DISCUSSION_PROMPT });
      setView("after");
      setVizExpanded(false);
      setShowGuide(false);
      setSelectedCluster(null);
      setHoveredCluster(null);
      setConnHover(null);
      setConnPin(null);
      setReplyState(null);
      setHiddenReplyRoots(new Set());
      setShowPrompts(false);
      setUseGlobalPrompts(false);
    } else {
      resetPostIdCounterFromPosts(INITIAL_POSTS);
      setPosts(INITIAL_POSTS);
      setClusters(INITIAL_CLUSTERS);
      setDiscussionPrompt({ ...DISCUSSION_PROMPT });
    }
  }, [isStudy]);

  // Shared Study cluster config: Firestore subscription (teacher-defined themes).
  useEffect(() => {
    if (!firebasePostsEnabled) return undefined;
    let unsub = null;
    (async () => {
      try {
        unsub = await subscribeToStudyThreadConfig({
          ...STUDY_FIREBASE_IDS,
          onConfig: (cfg) => {
            const next = Array.isArray(cfg?.clusters) && cfg.clusters.length > 0 ? cfg.clusters : null;
            if (!next) return;
            setStudyClusterConfig(next);
            setClusters(cur => deriveStudyClustersFromConfig(next, posts));
          },
          onError: (err) => logEvent("firebase_posts_error", { message: String(err?.message || err) }),
        });
      } catch (e) {
        logEvent("firebase_posts_error", { message: String(e?.message || e) });
      }
    })();
    return () => { try { unsub?.(); } catch { /* ignore */ } };
  }, [firebasePostsEnabled, logEvent, posts]);

  // Shared Study posts: Firestore subscription (posts only; logs remain local).
  useEffect(() => {
    if (!firebasePostsEnabled) return undefined;
    let unsub = null;
    (async () => {
      try {
        try {
          const uid = await getFirebaseAuthUid();
          setFirebaseUid(uid);
        } catch { /* ignore */ }
        unsub = await subscribeToStudyPosts({
          ...STUDY_FIREBASE_IDS,
          onPosts: (remotePosts) => {
            // Normalize to the app's expected post shape and derive reply counts
            const normalized = (remotePosts || []).map(p => ({
              id: p.id,
              authorId: p.authorId,
              authorName: p.authorName,
              initials: p.initials,
              authorUid: p.authorUid ?? null,
              date: p.date || "",
              lastReply: null,
              replyCount: 0,
              text: extractPostText(p.text),
              clusterId: p.clusterId || "general",
              clusterIds: p.clusterIds,
              parentId: p.parentId ?? null,
            }));

            const childrenByParent = new Map();
            for (const post of normalized) {
              if (!post.parentId) continue;
              const arr = childrenByParent.get(post.parentId) || [];
              arr.push(post);
              childrenByParent.set(post.parentId, arr);
            }
            const withCounts = normalized.map(p => {
              if (p.parentId) return p;
              const kids = childrenByParent.get(p.id) || [];
              const last = kids[kids.length - 1];
              return { ...p, replyCount: kids.length, lastReply: last?.date || null };
            });

            setPosts(withCounts);
            setClusters(deriveStudyClustersFromConfig(studyClusterConfig, withCounts));
          },
          onError: (err) => {
            logEvent("firebase_posts_error", { message: String(err?.message || err) });
          },
        });
      } catch (e) {
        logEvent("firebase_posts_error", { message: String(e?.message || e) });
      }
    })();
    return () => { try { unsub?.(); } catch { /* ignore */ } };
  }, [firebasePostsEnabled, logEvent]);

  // If Firebase isn't configured, Study remains local-only (participant exports logs manually).
  useEffect(() => {
    if (!isStudy) return;
    if (firebasePostsEnabled) return;
    logEvent("study_backend_mode", { mode: "local_only" });
  }, [isStudy, firebasePostsEnabled, logEvent]);

  // Study identity → active author
  useEffect(() => {
    if (!isStudy) return;
    if (!studyIdentity) return;
    setActiveAuthor({ id: studyIdentity.id, name: studyIdentity.name, initials: studyIdentity.initials });
    setActiveAuthorId(studyIdentity.id);
  }, [isStudy, studyIdentity, setActiveAuthorId]);

  const html2canvasPromiseRef = useRef(null);
  const ensureHtml2Canvas = useCallback(() => {
    if (typeof window !== "undefined" && window.html2canvas) return Promise.resolve(window.html2canvas);
    if (html2canvasPromiseRef.current) return html2canvasPromiseRef.current;

    html2canvasPromiseRef.current = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-html2canvas="1"]');
      if (existing) {
        existing.addEventListener("load", () => resolve(window.html2canvas));
        existing.addEventListener("error", () => reject(new Error("Failed to load html2canvas")));
        return;
      }
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";
      s.async = true;
      s.dataset.html2canvas = "1";
      s.onload = () => resolve(window.html2canvas);
      s.onerror = () => reject(new Error("Failed to load html2canvas"));
      document.head.appendChild(s);
    });
    return html2canvasPromiseRef.current;
  }, []);

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const captureViewportScreenshot = useCallback(async ({ labelForLog, shouldLogEvent }) => {
    const h2c = await ensureHtml2Canvas();
    const canvas = await h2c(document.body, {
      useCORS: true,
      backgroundColor: null,
      scale: Math.min(2, window.devicePixelRatio || 1),
      width: window.innerWidth,
      height: window.innerHeight,
      scrollX: 0,
      scrollY: 0,
      windowWidth: document.documentElement.clientWidth,
      windowHeight: document.documentElement.clientHeight,
    });

    const ts = new Date();
    const stamp = ts.toISOString().replace(/[:.]/g, "-");
    const scenario = (activeScenario || "default").replace(/[^a-zA-Z0-9_-]+/g, "-");
    const persona = String(activePersona || "none").replace(/[^a-zA-Z0-9_-]+/g, "-");
    const filename = `discoursemap-${scenario}-${persona}-${stamp}.png`;

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (blob) downloadBlob(blob, filename);

    if (shouldLogEvent) {
      logEvent("screenshot_taken", {
        timestamp: ts.toISOString(),
        label: labelForLog ?? "",
      });
    }
  }, [activeScenario, ensureHtml2Canvas, logEvent]);

  useEffect(() => {
    if (!import.meta.env.DEV) return undefined;
    const onKeyDown = (e) => {
      // Cmd+S (Mac) / Ctrl+S (non-Mac): capture screenshot download
      if ((e.metaKey || e.ctrlKey) && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        const shouldLogEvent = Boolean(e.shiftKey);
        captureViewportScreenshot({ shouldLogEvent, labelForLog: shouldLogEvent ? "capture" : "" }).catch(err => {
          logEvent("screenshot_failed", { message: String(err?.message || err) });
        });
        return;
      }
      // Shift+S: just log an event marker
      if (e.shiftKey && !e.metaKey && !e.ctrlKey && (e.key === "s" || e.key === "S")) {
        const timestamp = new Date().toISOString();
        logEvent("screenshot_taken", { timestamp, label: "marker" });
      }
    };
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [captureViewportScreenshot, logEvent]);

  const mapViewedRef = useRef(false);
  const promptsOpenAtRef = useRef(null);
  const promptsTotalMsRef = useRef(0);
  const lastPromptViewedRef = useRef({ promptId: null, promptLabel: null, ts: null });
  const firstTypedAtRef = useRef(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [toast,     setToast]     = useState(null);
  const [newPostIds,setNewPostIds]= useState(new Set());

  // ── Refs for bidirectional scroll (feature 2) ──
  const postRefs     = useRef({});
  const replyAreaRef = useRef(null);
  const mainAreaRef  = useRef(null);

  const highlightedConnection = connHover ?? connPin;
  const clearConnectionFocus = () => { setConnHover(null); setConnPin(null); };

  const handleLoadFixture = useCallback(({ posts: loadedPosts, clusters: loadedClusters, discussionPrompt: loadedPrompt }) => {
    resetPostIdCounterFromPosts(loadedPosts);
    setPosts(loadedPosts);
    setClusters(loadedClusters);
    setDiscussionPrompt(
      loadedPrompt && typeof loadedPrompt === "object"
        ? { ...DISCUSSION_PROMPT, ...loadedPrompt }
        : { ...DISCUSSION_PROMPT },
    );
    mapViewedRef.current = false;
    setActiveAuthor(CURRENT_USER);
    setActivePersona("none");
    setActiveAuthorId(CURRENT_USER.id);
    setSelectedCluster(null);
    setHoveredCluster(null);
    setConnHover(null);
    setConnPin(null);
    setReplyState(null);
    setHiddenReplyRoots(new Set());
    setNewPostIds(new Set());
    setShowPrompts(false);
    setUseGlobalPrompts(false);
  }, []);

  const setSyntheticAuthorForTurn = useCallback(({ authorId, authorName, initials }) => {
    if (!authorId) return;
    setActiveAuthor({ id: authorId, name: authorName || authorId, initials: initials || (authorName || authorId).slice(0, 2).toUpperCase() });
    setActiveAuthorId(authorId);
  }, [setActiveAuthorId]);

  const handleEditPost = useCallback(async (post) => {
    if (!post?.id) return;
    const existingText = extractPostText(post?.text);
    // eslint-disable-next-line no-alert
    const next = window.prompt("Edit your post:", existingText);
    if (next == null) return;
    const trimmed = String(next).trim();
    if (!trimmed) return;

    if (firebasePostsEnabled) {
      try {
        await updateStudyPost({ ...STUDY_FIREBASE_IDS, postId: post.id, patch: { text: trimmed } });
      } catch (e) {
        logEvent("firebase_posts_error", { message: String(e?.message || e) });
      }
      return;
    }

    setPosts(prev => prev.map(p => (p.id === post.id ? { ...p, text: trimmed } : p)));
  }, [firebasePostsEnabled, logEvent]);

  const handleDeletePost = useCallback(async (post) => {
    if (!post?.id) return;
    // eslint-disable-next-line no-alert
    const ok = window.confirm("Delete this post? This cannot be undone.");
    if (!ok) return;

    if (firebasePostsEnabled) {
      try {
        await deleteStudyPost({ ...STUDY_FIREBASE_IDS, postId: post.id });
      } catch (e) {
        logEvent("firebase_posts_error", { message: String(e?.message || e) });
      }
      return;
    }

    setPosts(prev => prev.filter(p => p.id !== post.id && p.parentId !== post.id));
    setClusters(prev => prev.map(cl => ({ ...cl, postIds: (cl.postIds || []).filter(id => id !== post.id) })));
  }, [firebasePostsEnabled, logEvent]);

  useEffect(() => {
    if (view !== "after" || !vizExpanded) return;
    if (mapViewedRef.current) return;
    mapViewedRef.current = true;
    const ts = new Date().toISOString();
    logEvent("map_viewed", { timestamp: ts, clustersVisible: clusters.map(c => c.id) });
  }, [view, vizExpanded, clusters, logEvent]);

  const replyingTo    = replyState?.post;
  const gapClusterId  = replyState?.gapClusterId ?? null;
  const replyText     = extractPostText(replyState?.text);
  const insertStarter = starter => {
    logEvent("prompt_inserted", { starterLength: starter?.length ?? 0 });
    if (!firstTypedAtRef.current && starter) firstTypedAtRef.current = Date.now();
    setReplyState(s => ({ ...s, text: String(starter || "") }));
  };
  const closeReply    = () => {
    logEvent("reply_closed", {});
    setReplyState(null);
  };

  // openReply: optionally pre-load gap mode
  const openReply = (post, gapId = null, starter = "") => {
    logEvent("reply_opened", { targetPostId: post?.id ?? null, gapClusterId: gapId ?? null, hasStarter: Boolean(starter) });
    firstTypedAtRef.current = starter ? Date.now() : null;
    lastPromptViewedRef.current = { promptId: null, promptLabel: null, ts: null };
    setReplyState({ post, text: String(starter || ""), gapClusterId: gapId, extraClusterIds: [] });
    setShowPrompts(true);
    setUseGlobalPrompts(false);
  };

  const jumpToPost = postId => {
    logEvent("jump_to_post", { postId });
    setTimeout(() => {
      const el = postRefs.current[postId];
      if (el) el.scrollIntoView({ behavior:"smooth", block:"center" });
    }, 80);
  };

  // ── Cluster select → filter/highlight only (no auto-scroll to one author)
  const handleClusterSelect = (clusterId) => {
    const next = selectedCluster === clusterId ? null : clusterId;
    logEvent(next ? "cluster_selected" : "cluster_cleared", { clusterId: next ?? clusterId });
    setSelectedCluster(next);
    clearConnectionFocus();
    if (next && zoom < 1.1) setZoom(1.2);
  };

  /** Idempotent select (for synthetic replay — avoids click-toggle clearing). */
  const selectClusterById = (clusterId) => {
    if (!clusterId || !clusters.some(c => c.id === clusterId)) return;
    logEvent("cluster_selected", { clusterId });
    setSelectedCluster(clusterId);
    clearConnectionFocus();
    setZoom(z => (z < 1.1 ? 1.2 : z));
  };

  useEffect(() => {
    if (!replyState) return;
    const t = setTimeout(() => {
      logEvent("reply_text_change", { length: (replyText || "").length });
    }, 500);
    if (!firstTypedAtRef.current && (replyText || "").trim().length > 0) firstTypedAtRef.current = Date.now();
    return () => clearTimeout(t);
  }, [replyText, replyState, logEvent]);

  // ── Feature 1: gap click → open reply with gap prompts + scroll ──
  const handleGapClick = (gapId) => {
    clearConnectionFocus();
    openReply(null, gapId);
    setTimeout(() => {
      replyAreaRef.current?.scrollIntoView({ behavior:"smooth", block:"center" });
    }, 80);
  };

  // ── Feature 3 + 4: post reply ──
  const handlePostReply = async (textOverride) => {
    const raw = (textOverride !== undefined && textOverride !== null) ? textOverride : replyText;
    if (typeof raw !== "string") {
      setToast("Post text error (non-text). Please refresh and try again.");
      logEvent("post_text_invalid", { rawType: typeof raw });
      return;
    }
    const body = raw.trim();
    if (body === "[object Object]") {
      setToast("Post text error. Please retype your message and try again.");
      logEvent("post_text_invalid", { rawType: "string", value: "[object Object]" });
      return;
    }
    if (!body) return;
    const targetClusterIdForReply = replyingTo?.clusterId ?? (gapClusterId ?? null);
    const promptList = useGlobalPrompts
      ? EPISTEMIC_PROMPTS
      : gapClusterId
        ? GAP_PROMPTS
        : !replyingTo && !gapClusterId
          ? FIRST_POST_PROMPTS
          : getContextualPrompts(replyingTo, clusters, posts);

    const promptStarters = (promptList || []).map(p => p?.starter).filter(Boolean);
    const promptStarterUsed = promptStarters.some(st => body.includes(st));

    const typedAt = firstTypedAtRef.current;
    const lpv = lastPromptViewedRef.current;
    const promptIdSelected = typedAt && lpv?.ts && lpv.ts <= typedAt ? lpv.promptId : null;

    const extrasForCrossCluster = (replyState?.extraClusterIds || []).filter(Boolean);
    const isCrossCluster = Boolean(targetClusterIdForReply) && extrasForCrossCluster.some(id => id !== targetClusterIdForReply);

    logEvent("reply_submitted", {
      text: body,
      fullText: body,
      textLength: body.length,
      promptStarterUsed,
      promptIdSelected,
      targetClusterId: targetClusterIdForReply,
      isCrossCluster,
      gapClusterId: gapClusterId ?? null,
      parentPostId: replyingTo?.id ?? null,
    });
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})+" "+now.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"});
    const newId = `p${postIdCounter++}`;
    const savedGapId = gapClusterId;
    const extras = (replyState?.extraClusterIds || []).filter(Boolean);
    let targetClusterId;
    if (savedGapId) {
      targetClusterId = savedGapId;
    } else if (replyingTo) {
      targetClusterId = replyingTo.clusterId;
    } else {
      targetClusterId = isStudy ? classifyStudyTextToClusters(body).primary : (clusters?.[0]?.id || "general");
    }

    let allClusterIds = [...new Set([targetClusterId, ...extras.filter(id => id !== targetClusterId)])];
    if (isStudy) {
      const { secondary } = classifyStudyTextToClusters(body);
      if (secondary && secondary !== targetClusterId) allClusterIds = [...new Set([...allClusterIds, secondary])];
    }

    // Study mode: write posts to Firestore so other devices can see/reply.
    if (firebasePostsEnabled) {
      try {
        await addStudyPost({
          ...STUDY_FIREBASE_IDS,
          author: activeAuthor,
          studyCode: studyIdentity?.code || null,
          post: {
            date: dateStr,
            text: body,
            parentId: replyingTo ? replyingTo.id : null,
            clusterId: targetClusterId,
            clusterIds: allClusterIds,
          },
        });
      } catch (e) {
        const msg = String(e?.message || e);
        logEvent("firebase_posts_error", { message: msg });
        setToast(`Post failed to sync (${msg}). Your teammate won't see it.`);
      }
      closeReply();
      return;
    }

    const newPost = {
      id: newId,
      authorId: activeAuthor?.id ?? CURRENT_USER.id,
      authorName: activeAuthor?.name ?? CURRENT_USER.name,
      initials: activeAuthor?.initials ?? CURRENT_USER.initials,
      date: dateStr,
      lastReply: null,
      replyCount: 0,
      text: body,
      clusterId: targetClusterId,
      clusterIds: allClusterIds,
      parentId: replyingTo ? replyingTo.id : null,
    };

    setPosts(prev => {
      let next = [...prev, newPost];
      if (replyingTo) {
        next = next.map(p => p.id === replyingTo.id ? { ...p, replyCount: (p.replyCount || 0) + 1, lastReply: dateStr } : p);
      }
      return next;
    });
    setNewPostIds(prev => new Set([...prev, newId]));

    setClusters(prev => {
      const base = Array.isArray(prev) ? prev : [];
      let nextClusters = base;
      if (nextClusters.length === 0) {
        nextClusters = [
          {
            id: "general",
            label: "General\nDiscussion",
            shortLabel: "General Discussion",
            x: 50, y: 45, size: 42,
            postIds: [],
            isGap: false,
          },
        ];
      }
      return nextClusters.map(cl => {
        if (!allClusterIds.includes(cl.id)) return cl;
        if (cl.postIds.includes(newId)) return cl;
        const wasGap = cl.isGap;
        return {
          ...cl,
          postIds: [...cl.postIds, newId],
          isGap: false,
          isNew: wasGap,
          size: wasGap ? 28 : Math.min((cl.size || 30) + 3, 60),
        };
      });
    });

    closeReply();

    if (!replyingTo || savedGapId) {
      setAnalyzing(true);
      setTimeout(() => {
        setAnalyzing(false);
        setToast(savedGapId
          ? `Map updated — "${clusters.find(c=>c.id===savedGapId)?.shortLabel}" is no longer a gap!`
          : "Map updated with your new post");
        jumpToPost(newId);
      }, 1800);
    } else {
      setToast("Reply posted!");
      jumpToPost(newId);
    }
  };

  const prepareSyntheticSession = useCallback(() => {
    setView("after");
    setVizExpanded(true);
  }, []);

  const applySyntheticEvent = (ev) => {
    if (!ev || typeof ev.type !== "string") return;
    const { type, ...payload } = ev;
    const resolvePrompt = id => [...EPISTEMIC_PROMPTS, ...GAP_PROMPTS, ...FIRST_POST_PROMPTS].find(p => p.id === id);

    switch (type) {
      case "cluster_selected":
        if (payload.clusterId) selectClusterById(payload.clusterId);
        break;
      case "cluster_cleared":
        if (selectedCluster) {
          logEvent("cluster_cleared", { clusterId: selectedCluster });
          setSelectedCluster(null);
          clearConnectionFocus();
        }
        break;
      case "jump_to_post":
        if (payload.postId) jumpToPost(payload.postId);
        break;
      case "reply_opened": {
        const postId = payload.postId ?? payload.targetPostId;
        const gapId = payload.gapClusterId;
        if (gapId && clusters.some(c => c.id === gapId)) handleGapClick(gapId);
        else if (postId) {
          const post = posts.find(p => p.id === postId);
          if (post) {
            openReply(post);
            setTimeout(() => {
              replyAreaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 120);
          }
        }
        break;
      }
      case "reply_text_change":
        if (payload.text != null) {
          const len = String(payload.text).length;
          logEvent("reply_text_change", { length: len });
          setReplyState(s => (s ? { ...s, text: String(payload.text) } : s));
        }
        break;
      case "reply_submitted":
        handlePostReply(payload.text);
        break;
      case "reply_closed":
        closeReply();
        break;
      case "prompts_opened":
        promptsOpenAtRef.current = Date.now();
        logEvent("prompts_opened", {});
        setShowPrompts(true);
        break;
      case "prompts_dismissed":
        if (promptsOpenAtRef.current) {
          promptsTotalMsRef.current += Date.now() - promptsOpenAtRef.current;
          promptsOpenAtRef.current = null;
        }
        logEvent("prompts_dismissed", { timeInPromptsMs: promptsTotalMsRef.current });
        promptsTotalMsRef.current = 0;
        setShowPrompts(false);
        break;
      case "prompts_scope_toggled":
        if (typeof payload.mapWide === "boolean") {
          logEvent("prompts_scope_toggled", { mapWide: payload.mapWide });
          setUseGlobalPrompts(payload.mapWide);
        }
        break;
      case "prompt_inserted": {
        let starter = payload.starter ?? payload.text;
        if (!starter && payload.promptId) {
          starter = resolvePrompt(payload.promptId)?.starter ?? "";
        }
        if (starter) insertStarter(starter);
        break;
      }
      case "connection_hover":
        if (payload.key) {
          setConnHover(payload.key);
          logEvent("connection_hover", { key: payload.key });
        }
        break;
      case "connection_pin":
        if (payload.key) {
          setConnPin(payload.key);
          logEvent("connection_pin", { key: payload.key, action: payload.action || "pin" });
        }
        break;
      case "extra_themes_set": {
        const ids = payload.clusterIds ?? payload.extraClusterIds;
        if (Array.isArray(ids)) {
          const valid = ids.filter(id => clusters.some(c => c.id === id && !c.isGap));
          logEvent("extra_themes_set", { clusterIds: valid });
          setReplyState(s => (s ? { ...s, extraClusterIds: valid } : s));
        }
        break;
      }
      default:
        logEvent(type, payload);
    }
  };

  const activeCluster   = replyingTo ? clusters.find(c => c.id===replyingTo.clusterId) : (gapClusterId ? clusters.find(c=>c.id===gapClusterId) : null);
  const contextSummary  = gapClusterId
    ? `Gap: "${clusters.find(c=>c.id===gapClusterId)?.shortLabel}" — contribute first`
    : replyingTo && activeCluster
      ? `${activeCluster.shortLabel} (${replyingTo.authorName}'s post)`
      : "overall discussion map";
  const promptsForPanel = useGlobalPrompts
    ? EPISTEMIC_PROMPTS
    : gapClusterId
      ? GAP_PROMPTS
      : !replyingTo && !gapClusterId
        ? FIRST_POST_PROMPTS
        : getContextualPrompts(replyingTo, clusters, posts);

  const primaryThemeForReply = gapClusterId || replyingTo?.clusterId || "social-media-bias";
  const extraThemeChoices = clusters.filter(c => !c.isGap && c.id !== primaryThemeForReply);

  function renderReplyPanel() {
    if (!replyState) return null;
    return (
      <div ref={replyAreaRef} style={{ background:"#F8FAFC", border:`1.5px solid ${C.canvasBlue}`, borderRadius:"8px", padding:"16px 20px", marginBottom:"14px", marginTop:"8px", marginLeft:replyingTo?"28px":0, boxShadow:"0 2px 8px rgba(3,116,181,0.1)" }}>
        {/* Context line */}
        <div style={{ fontSize:"12px", color:C.textLight, fontFamily:"Lato,Arial,sans-serif", marginBottom:10 }}>
          {gapClusterId
            ? <><span style={{ color:C.canvasBlue, fontWeight:"700" }}>Contributing to gap:</span> {clusters.find(c=>c.id===gapClusterId)?.shortLabel}</>
            : replyingTo
              ? <>Replying to <strong style={{ color:C.text }}>{replyingTo.authorName}</strong></>
              : "Replying to the discussion prompt"
          }
        </div>
        {!isStudy && extraThemeChoices.length > 0 && (
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:"11px", color:C.textLight, fontFamily:"Lato,Arial,sans-serif", marginBottom:6 }}>Also relates to themes (optional — shows on map under multiple clusters):</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"10px 14px" }}>
              {extraThemeChoices.map(c => (
                <label key={c.id} style={{ fontSize:"12px", fontFamily:"Lato,Arial,sans-serif", color:C.text, display:"inline-flex", alignItems:"center", gap:6, cursor:"pointer" }}>
                  <input
                    type="checkbox"
                    checked={(replyState.extraClusterIds || []).includes(c.id)}
                    onChange={() => setReplyState(s => {
                      const cur = s.extraClusterIds || [];
                      const on = cur.includes(c.id);
                      return { ...s, extraClusterIds: on ? cur.filter(x => x !== c.id) : [...cur, c.id] };
                    })}
                    style={{ accentColor:C.canvasBlue }}
                  />
                  {c.shortLabel}
                </label>
              ))}
            </div>
          </div>
        )}
        {view !== "teacher" && (view==="after" || view==="before") && posts.length > 0 && (
          showPrompts ? (
            <EpistemicPromptsPanel
              prompts={promptsForPanel}
              contextSummary={contextSummary}
              useGlobal={useGlobalPrompts}
              onToggleMode={!gapClusterId ? () => setUseGlobalPrompts(v => {
                const next = !v;
                logEvent("prompts_scope_toggled", { mapWide: next });
                return next;
              }) : null}
              onInsert={insertStarter}
              onPromptViewed={({ promptId, promptLabel }) => {
                lastPromptViewedRef.current = { promptId, promptLabel, ts: Date.now() };
                logEvent("prompt_viewed", { promptId, promptLabel });
              }}
              onDismiss={() => {
                if (promptsOpenAtRef.current) {
                  promptsTotalMsRef.current += Date.now() - promptsOpenAtRef.current;
                  promptsOpenAtRef.current = null;
                }
                logEvent("prompts_dismissed", { timeInPromptsMs: promptsTotalMsRef.current });
                promptsTotalMsRef.current = 0;
                setShowPrompts(false);
              }}
            />
          ) : (
            <button
              onClick={() => {
                promptsOpenAtRef.current = Date.now();
                logEvent("prompts_opened", {});
                setShowPrompts(true);
              }}
              style={{ display:"inline-flex", alignItems:"center", gap:6, marginBottom:10, padding:"5px 12px", border:`1px solid ${C.borderLight}`, borderRadius:"20px", background:C.white, color:C.textLight, fontSize:"12px", fontFamily:"Lato,Arial,sans-serif", cursor:"pointer", transition:"border-color 0.15s, color 0.15s" }}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor=C.canvasBlue; e.currentTarget.style.color=C.canvasBlue; }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.borderLight; e.currentTarget.style.color=C.textLight; }}
            >
              <span style={{ fontSize:"13px" }}>💡</span>
              Need writing guidance?
            </button>
          )
        )}
        <textarea
          value={replyText}
          onChange={e=>setReplyState(s=>({...s,text:e.target.value}))}
          placeholder="Write your reply..."
          autoFocus
          style={{ width:"100%", minHeight:"100px", padding:"12px", border:`1px solid ${C.border}`, borderRadius:"6px", fontSize:"14px", fontFamily:"Lato,Arial,sans-serif", color:C.text, resize:"vertical", outline:"none", boxSizing:"border-box", lineHeight:1.6 }}
        />
        <div style={{ display:"flex", gap:"10px", marginTop:"10px" }}>
          <button onClick={closeReply} style={{ padding:"8px 18px", border:`1px solid ${C.border}`, borderRadius:"4px", background:C.white, color:C.text, fontSize:"14px", cursor:"pointer", fontFamily:"Lato,Arial,sans-serif" }}>Cancel</button>
          <button
            onClick={() => handlePostReply()}
            disabled={!replyText.trim()}
            style={{ padding:"8px 22px", border:"none", borderRadius:"4px", background:replyText.trim()?C.canvasBlue:"#C7CDD1", color:C.white, fontSize:"14px", cursor:replyText.trim()?"pointer":"default", fontFamily:"Lato,Arial,sans-serif", fontWeight:"700", transition:"background 0.15s" }}>
            Post Reply
          </button>
        </div>
      </div>
    );
  }

  if (showGuide) return (
    <>
      <button onClick={()=>setShowGuide(false)} style={{ position:"fixed", top:20, right:20, zIndex:9999, background:"#007AFF", color:"white", border:"none", padding:"10px 18px", borderRadius:"8px", fontSize:"14px", cursor:"pointer", fontFamily:"-apple-system,sans-serif", boxShadow:"0 4px 12px rgba(0,0,0,0.15)", fontWeight:"600" }}>
        Return to Canvas Prototype
      </button>
      <DiscourseMapGuide />
    </>
  );

  if (isStudy && !studyIdentity) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", background:C.bg, fontFamily:"Lato,Arial,Helvetica,sans-serif" }}>
        <CanvasHeader/>
        <div style={{ display:"flex", flex:1, minHeight:0 }}>
          <Sidebar/>
          <div style={{ flex:1, padding:"40px 28px", maxWidth:"960px" }}>
            <div style={{ background:C.white, border:`1px solid ${C.borderLight}`, borderRadius:"10px", padding:"22px 24px", boxShadow:"0 2px 10px rgba(0,0,0,0.06)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", gap:12, alignItems:"baseline", flexWrap:"wrap" }}>
                <h2 style={{ margin:0, fontSize:"18px", color:C.text }}>Enter study code</h2>
                <a href="#/demo" style={{ fontSize:"12px", color:C.linkBlue, textDecoration:"underline" }}>Go to Demo</a>
              </div>
              <div style={{ marginTop:10, fontSize:"13px", color:C.textLight, lineHeight:1.6, whiteSpace:"pre-line" }}>
                {STUDY_DISCUSSION_PROMPT.title}
              </div>
              <div style={{ marginTop:14, display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
                <input
                  value={studyCodeInput}
                  onChange={e => { setStudyCodeInput(e.target.value); setStudyLoginError(""); }}
                  placeholder="e.g. YV02"
                  style={{ padding:"10px 12px", border:`1px solid ${C.border}`, borderRadius:"6px", fontSize:"14px", width:"240px", fontFamily:"Lato,Arial,sans-serif" }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const code = (studyCodeInput || "").trim().toUpperCase();
                    const rec = CODE_ASSIGNMENTS[code];
                    if (!rec) {
                      setStudyLoginError("Invalid code. Ask the researcher for the correct code.");
                      return;
                    }
                    const identity = { id: rec.id, name: rec.name, initials: rec.initials, code };
                    saveStudyIdentity(identity);
                    setStudyIdentity(identity);
                  }}
                  style={{ background:C.canvasBlue, color:"white", border:"none", padding:"10px 16px", borderRadius:"6px", fontSize:"14px", cursor:"pointer", fontFamily:"Lato,Arial,sans-serif", fontWeight:"700" }}
                >
                  Continue
                </button>
              </div>
              {studyLoginError && <div style={{ marginTop:10, color:"#B91C1C", fontSize:"13px" }}>{studyLoginError}</div>}
              <div style={{ marginTop:14, fontSize:"12px", color:C.textLight, lineHeight:1.6 }}>
                This prototype stores your code locally in this browser so you can refresh without re-entering it.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const rootPosts  = posts.filter(p => !p.parentId);
  const replyPosts = posts.filter(p => p.parentId);
  const studyConnections = isStudy ? deriveStudyConnections(posts, clusters) : [];
  const studyKeywords = isStudy ? deriveStudyKeywords(posts, clusters) : [];
  const selectedConnectionKey = connPin;

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", background:C.bg, fontFamily:"Lato,Arial,Helvetica,sans-serif" }}>
      <style>{`
        @keyframes pulse      { 0%,100%{opacity:1} 50%{opacity:0.45} }
        @keyframes gapSpin    { to{stroke-dashoffset:-20} }
        @keyframes clusterIn  { from{opacity:0;transform:scale(0.5)} to{opacity:1;transform:scale(1)} }
        @keyframes newPost    { 0%{opacity:0;transform:scale(0.2)} 60%{transform:scale(1.12)} 100%{opacity:1;transform:scale(1)} }
        @keyframes analyzing  { 0%,100%{opacity:0.5} 50%{opacity:1} }
      `}</style>

      {toast && <Toast message={toast} onDone={()=>setToast(null)}/>}

      {isDemo && (
        <button onClick={()=>setShowGuide(true)} style={{ position:"fixed", bottom:30, right:30, zIndex:9999, background:C.canvasDarkBlue, color:"white", border:"2px solid rgba(255,255,255,0.25)", padding:"12px 20px", borderRadius:"30px", fontSize:"14px", cursor:"pointer", fontFamily:"Lato,Arial,sans-serif", boxShadow:"0 4px 16px rgba(0,0,0,0.25)", fontWeight:"700" }}>
          ★ Open Educator Guide
        </button>
      )}

      <CanvasHeader/>

      <div style={{ display:"flex", flex:1, minHeight:0 }}>
        <Sidebar/>
        <div style={{ display:"flex", flex:1, minWidth:0 }}>

          {/* Course nav */}
          <div style={{ width:"180px", minWidth:"180px", padding:"16px 0 16px 20px", borderRight:`1px solid ${C.borderLight}`, background:C.white, flexShrink:0, overflowY:"auto" }}>
            <div style={{ fontSize:"12px", color:C.textLight, marginBottom:"12px", fontFamily:"Lato,Arial,sans-serif" }}>Spring Term 2025</div>
            {["Home","Syllabus","Modules","Assignments","Discussions","People","Announcements","Calendar","TC Digital Media"].map(item => (
              <div key={item} style={{ padding:"10px 12px", fontSize:"14px", fontFamily:"Lato,Arial,sans-serif", color:item==="Discussions"?C.text:C.linkBlue, fontWeight:item==="Discussions"?"700":"400", borderLeft:item==="Discussions"?`3px solid ${C.canvasBlue}`:"3px solid transparent", background:item==="Discussions"?"#F0F7FC":"transparent", cursor:"pointer", marginLeft:item==="Discussions"?-3:0, paddingLeft:item==="Discussions"?15:12 }}>{item}</div>
            ))}
          </div>

          {/* Main scroll area */}
          <div ref={mainAreaRef} style={{ flex:1, padding:"20px 28px", maxWidth:"960px", minWidth:0, overflowY:"auto" }}>

            {/* Prototype toggle */}
            <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"18px", padding:"8px 14px", background:C.white, border:`1px solid ${C.border}`, borderRadius:"4px", flexWrap:"wrap" }}>
              <span style={{ fontSize:"11px", color:C.textLight, fontWeight:"700", letterSpacing:"0.3px" }}>PROTOTYPE:</span>
              {[{id:"before",label:"Standard Canvas view"},{id:"after",label:"With DiscourseMap"},{id:"teacher",label:"Teacher setup"}].map(opt => (
                <button key={opt.id} onClick={()=>{setView(opt.id);if(opt.id==="after")setVizExpanded(true);}}
                  style={{ padding:"4px 12px", borderRadius:"3px", border:view===opt.id?`1px solid ${C.canvasBlue}`:`1px solid ${C.border}`, background:view===opt.id?"#EBF5FF":C.white, color:view===opt.id?C.canvasBlue:C.textLight, fontSize:"12px", fontFamily:"Lato,Arial,sans-serif", cursor:"pointer", fontWeight:view===opt.id?"700":"400" }}>{opt.label}</button>
              ))}
              {isStudy && (
                <>
                  {loggingState === "idle" ? (
                    <button
                      type="button"
                      onClick={startLogging}
                      style={{ marginLeft:"auto", background:C.canvasBlue, color:"white", border:"none", borderRadius:"999px", padding:"6px 12px", fontSize:"12px", cursor:"pointer", fontFamily:"Lato,Arial,sans-serif", fontWeight:"700" }}
                    >
                      Start logging
                    </button>
                  ) : loggingState === "active" ? (
                    <>
                      <button
                        type="button"
                        onClick={pauseLogging}
                        style={{ marginLeft:"auto", background:"none", color:C.linkBlue, border:`1px solid ${C.borderLight}`, borderRadius:"999px", padding:"6px 12px", fontSize:"12px", cursor:"pointer", fontFamily:"Lato,Arial,sans-serif", fontWeight:"800" }}
                      >
                        Pause
                      </button>
                      <button
                        type="button"
                        onClick={() => { endLogging(); setShowGenomicsCode(true); }}
                        style={{ background:"none", color:"#B91C1C", border:`1px solid rgba(185,28,28,0.35)`, borderRadius:"999px", padding:"6px 12px", fontSize:"12px", cursor:"pointer", fontFamily:"Lato,Arial,sans-serif", fontWeight:"900" }}
                      >
                        End
                      </button>
                      <span style={{ fontSize:"11px", color:"#B91C1C", fontWeight:"800", letterSpacing:"0.2px" }}>LOGGING</span>
                    </>
                  ) : loggingState === "paused" ? (
                    <>
                      <button
                        type="button"
                        onClick={resumeLogging}
                        style={{ marginLeft:"auto", background:C.canvasBlue, color:"white", border:"none", borderRadius:"999px", padding:"6px 12px", fontSize:"12px", cursor:"pointer", fontFamily:"Lato,Arial,sans-serif", fontWeight:"800" }}
                      >
                        Resume
                      </button>
                      <button
                        type="button"
                        onClick={() => { endLogging(); setShowGenomicsCode(true); }}
                        style={{ background:"none", color:"#B91C1C", border:`1px solid rgba(185,28,28,0.35)`, borderRadius:"999px", padding:"6px 12px", fontSize:"12px", cursor:"pointer", fontFamily:"Lato,Arial,sans-serif", fontWeight:"900" }}
                      >
                        End
                      </button>
                      <span style={{ fontSize:"11px", color:"#B91C1C", fontWeight:"800", letterSpacing:"0.2px" }}>PAUSED</span>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={exportToFile}
                      style={{ marginLeft:"auto", background:C.canvasBlue, color:"white", border:"none", borderRadius:"999px", padding:"6px 12px", fontSize:"12px", cursor:"pointer", fontFamily:"Lato,Arial,sans-serif", fontWeight:"800" }}
                    >
                      Export log
                    </button>
                  )}
                </>
              )}
              {isStudy && (loggingState === "active" || loggingState === "paused") && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const t = (noteDraft || "").trim();
                    if (!t) return;
                    addNote(t);
                    setNoteDraft("");
                    setToast("Note added");
                  }}
                  style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}
                >
                  <input
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    placeholder="Add a quick note (e.g., “looking at gap cluster…”)"
                    style={{ width:260, maxWidth:"60vw", padding:"6px 10px", border:`1px solid ${C.borderLight}`, borderRadius:"999px", fontSize:"12px", fontFamily:"Lato,Arial,sans-serif" }}
                  />
                  <button
                    type="submit"
                    style={{ background:"none", border:`1px solid ${C.borderLight}`, color:C.linkBlue, borderRadius:"999px", padding:"6px 10px", fontSize:"12px", cursor:"pointer", fontFamily:"Lato,Arial,sans-serif", fontWeight:"800" }}
                  >
                    Log note
                  </button>
                </form>
              )}
              {isStudy && studyIdentity && (
                <button
                  type="button"
                  onClick={logoutStudy}
                  style={{ background:"none", border:"none", fontSize:"12px", color:C.linkBlue, cursor:"pointer", fontFamily:"Lato,Arial,sans-serif", textDecoration:"underline" }}
                >
                  Change code
                </button>
              )}
              {isStudy && (
                <a
                  href="#/demo"
                  style={{ fontSize:"12px", color:C.linkBlue, textDecoration:"underline", fontFamily:"Lato,Arial,sans-serif" }}
                >
                  Go to Demo
                </a>
              )}
              {isDemo && (
                <a
                  href="#/study"
                  style={{ marginLeft:"auto", fontSize:"12px", color:C.linkBlue, textDecoration:"underline", fontFamily:"Lato,Arial,sans-serif" }}
                >
                  Go to Study
                </a>
              )}
            </div>

            {view==="teacher" ? (
              <div style={{ background:C.white, border:`1px solid ${C.borderLight}`, borderRadius:"6px", padding:"20px 24px", marginBottom:"20px", borderLeft:`4px solid ${C.canvasBlue}` }}>
                <h3 style={{ margin:"0 0 8px", fontSize:"17px", color:C.text, fontFamily:"Lato,Arial,sans-serif" }}>Teacher mode (prototype)</h3>
                <p style={{ fontSize:"13px", color:C.textLight, margin:"0 0 16px", lineHeight:1.5, fontFamily:"Lato,Arial,sans-serif" }}>Edit the discussion framing and theme labels. Switch to &quot;With DiscourseMap&quot; to preview the student view.</p>
                <label style={{ display:"block", fontSize:"12px", fontWeight:"700", color:C.text, marginBottom:6, fontFamily:"Lato,Arial,sans-serif" }}>Discussion title</label>
                <input value={discussionPrompt.title} onChange={e=>setDiscussionPrompt(p=>({...p,title:e.target.value}))} style={{ width:"100%", padding:"10px 12px", marginBottom:14, border:`1px solid ${C.border}`, borderRadius:"4px", fontSize:"14px", fontFamily:"Lato,Arial,sans-serif", boxSizing:"border-box" }} />
                <label style={{ display:"block", fontSize:"12px", fontWeight:"700", color:C.text, marginBottom:6, fontFamily:"Lato,Arial,sans-serif" }}>Instructions / prompt body</label>
                <textarea value={discussionPrompt.body} onChange={e=>setDiscussionPrompt(p=>({...p,body:e.target.value}))} rows={12} style={{ width:"100%", padding:"12px", marginBottom:18, border:`1px solid ${C.border}`, borderRadius:"4px", fontSize:"14px", fontFamily:"Lato,Arial,sans-serif", lineHeight:1.6, resize:"vertical", boxSizing:"border-box" }} />
                <div style={{ fontSize:"13px", fontWeight:"700", color:C.text, marginBottom:10, fontFamily:"Lato,Arial,sans-serif" }}>Map themes (short label + line breaks for map)</div>
                {isStudy && firebasePostsEnabled && (
                  <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap", marginBottom:10 }}>
                    <button
                      type="button"
                      onClick={() => {
                        const nextId = `theme-${Math.random().toString(36).slice(2, 7)}`;
                        const x = 20 + Math.floor(Math.random() * 60);
                        const y = 22 + Math.floor(Math.random() * 55);
                        const next = { id: nextId, shortLabel: "New theme", label: "New\ntheme", x, y };
                        setStudyClusterConfig(prev => {
                          const cfg = [...prev, next];
                          setClusters(deriveStudyClustersFromConfig(cfg, posts));
                          return cfg;
                        });
                      }}
                      style={{ background:"none", border:`1px solid ${C.borderLight}`, borderRadius:"999px", padding:"6px 10px", fontSize:"12px", cursor:"pointer", fontFamily:"Lato,Arial,sans-serif", fontWeight:"800", color:C.linkBlue }}
                    >
                      + Add theme
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const cleaned = studyClusterConfig.map(({ id, shortLabel, label, x, y }) => ({ id, shortLabel, label, x, y }));
                          await setStudyThreadConfig({
                            ...STUDY_FIREBASE_IDS,
                            studyCode: studyIdentity?.code || null,
                            patch: { clusters: cleaned },
                          });
                          setToast("Saved map themes");
                        } catch (e) {
                          setToast("Save failed");
                          logEvent("firebase_posts_error", { message: String(e?.message || e) });
                        }
                      }}
                      style={{ background:C.canvasBlue, color:"white", border:"none", borderRadius:"999px", padding:"6px 12px", fontSize:"12px", cursor:"pointer", fontFamily:"Lato,Arial,sans-serif", fontWeight:"900" }}
                    >
                      Save themes
                    </button>
                    <span style={{ fontSize:"12px", color:C.textLight }}>
                      Saved themes sync to all devices in this study thread.
                    </span>
                  </div>
                )}
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {(isStudy ? studyClusterConfig : clusters).map(c => (
                    <div key={c.id} style={{ padding:12, background:"#F8FAFC", borderRadius:"6px", border:`1px solid ${C.borderLight}` }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10 }}>
                        <div style={{ fontSize:"11px", color:C.textLight, marginBottom:6, fontFamily:"Lato,Arial,sans-serif" }}>{c.id}</div>
                        {isStudy && firebasePostsEnabled && (
                          <button
                            type="button"
                            onClick={() => {
                              setStudyClusterConfig(prev => {
                                const next = prev.filter(x => x.id !== c.id);
                                setClusters(deriveStudyClustersFromConfig(next, posts));
                                return next;
                              });
                            }}
                            style={{ border:"none", background:"transparent", color:"#B91C1C", cursor:"pointer", fontSize:"12px", fontFamily:"Lato,Arial,sans-serif", textDecoration:"underline" }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <input
                        value={c.shortLabel}
                        onChange={e=>{
                          const v = e.target.value;
                          if (isStudy) {
                            setStudyClusterConfig(prev => {
                              const next = prev.map(x=>x.id===c.id?{...x,shortLabel:v}:x);
                              setClusters(deriveStudyClustersFromConfig(next, posts));
                              return next;
                            });
                          } else {
                            setClusters(prev=>prev.map(x=>x.id===c.id?{...x,shortLabel:v}:x));
                          }
                        }}
                        placeholder="Short label"
                        style={{ width:"100%", padding:"6px 10px", marginBottom:8, border:`1px solid ${C.border}`, borderRadius:"4px", fontSize:"13px", fontFamily:"Lato,Arial,sans-serif", boxSizing:"border-box" }}
                      />
                      <textarea
                        value={c.label}
                        onChange={e=>{
                          const v = e.target.value;
                          if (isStudy) {
                            setStudyClusterConfig(prev => {
                              const next = prev.map(x=>x.id===c.id?{...x,label:v}:x);
                              setClusters(deriveStudyClustersFromConfig(next, posts));
                              return next;
                            });
                          } else {
                            setClusters(prev=>prev.map(x=>x.id===c.id?{...x,label:v}:x));
                          }
                        }}
                        placeholder="Map label (use line breaks)"
                        rows={2}
                        style={{ width:"100%", padding:"8px 10px", border:`1px solid ${C.border}`, borderRadius:"4px", fontSize:"12px", fontFamily:"Lato,Arial,sans-serif", boxSizing:"border-box" }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
            <>
            {/* Teacher post */}
            <div style={{ background:C.white, border:`1px solid ${C.borderLight}`, borderRadius:"6px", padding:"20px 24px", marginBottom:"20px", borderLeft:`4px solid ${C.canvasBlue}`, boxShadow:"0 1px 6px rgba(0,0,0,0.05)" }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:"12px", marginBottom:"8px" }}>
                <div style={{ width:"42px", height:"42px", borderRadius:"50%", background:"#E8EAED", border:`2px solid ${C.borderLight}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"14px", fontWeight:"700", color:C.text, flexShrink:0 }}>JS</div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                      <span style={{ fontSize:"15px", fontWeight:"700", color:C.text }}>Jooeun Shim</span>
                      {["AUTHOR","TEACHER"].map(t => <span key={t} style={{ fontSize:"11px", color:C.textLight, padding:"2px 6px", borderRadius:"3px", background:"#F0F0F0", fontFamily:"Lato,Arial,sans-serif" }}>{t}</span>)}
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:"13px", color:C.textLight }}>
                        {isStudy ? posts.length : discussionPrompt.replies} Replies, {isStudy ? 0 : discussionPrompt.unread} Unread
                      </span>
                      <span style={{ color:C.textLight, cursor:"pointer", fontSize:"16px" }}>🔖</span>
                      <span style={{ color:C.textLight, cursor:"pointer", fontSize:"18px", fontWeight:"700" }}>⋮</span>
                    </div>
                  </div>
                  <div style={{ fontSize:"12px", color:C.textLight, marginTop:2 }}>{discussionPrompt.date} | {discussionPrompt.lastEdited}</div>
                </div>
              </div>
              <h2 style={{ fontSize:"20px", fontWeight:"700", color:C.text, margin:"14px 0 10px", letterSpacing:"-0.3px" }}>{discussionPrompt.title}</h2>
              <div style={{ fontSize:"15px", color:C.text, lineHeight:"1.75", whiteSpace:"pre-line" }}>
                {discussionPrompt.body.split(/(Thursday at midnight|Saturday morning at 9 am)/).map((part,i) =>
                  (part==="Thursday at midnight"||part==="Saturday morning at 9 am")
                    ? <span key={i} style={{ color:C.linkBlue, textDecoration:"underline" }}>{part}</span>
                    : part
                )}
              </div>
              {isStudy && (
                <div style={{ marginTop:16 }}>
                  <div style={{ fontSize:"14px", fontWeight:"800", color:C.text, marginBottom:6, fontFamily:"Lato,Arial,sans-serif" }}>
                    This week&apos;s readings
                  </div>
                  <ol style={{ margin:"0 0 0 18px", padding:0, color:C.text, lineHeight:1.6 }}>
                    {STUDY_READINGS.map(r => (
                      <li key={r.href} style={{ marginBottom:6 }}>
                        <a href={r.href} target="_blank" rel="noreferrer" style={{ color:C.linkBlue, textDecoration:"underline" }}>
                          {r.label}
                        </a>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              <button onClick={()=>openReply(null)} style={{ marginTop:"18px", background:C.canvasBlue, color:"white", border:"none", padding:"10px 22px", borderRadius:"5px", fontSize:"15px", cursor:"pointer", fontFamily:"Lato,Arial,sans-serif", fontWeight:"600" }}>Post</button>
              {replyState && replyingTo===null && !gapClusterId && renderReplyPanel()}
            </div>

            {/* Discourse Map */}
            {view==="after" && posts.length>0 && !vizExpanded && <DiscourseMapCollapsedBar onExpand={()=>setVizExpanded(true)}/>}
            {view==="after" && posts.length>0 && vizExpanded && (
              <DiscourseMapExpanded
                clusters={clusters}
                discussionPosts={posts}
                hoveredCluster={hoveredCluster}     setHoveredCluster={setHoveredCluster}
                selectedCluster={selectedCluster}   setSelectedCluster={handleClusterSelect}
                myPostsHighlight={myPostsHighlight}
                setMyPostsHighlight={setMyPostsHighlight}
                onClose={()=>setVizExpanded(false)}
                highlightedConnection={highlightedConnection}
                onConnectionHover={key => { setConnHover(key); logEvent("connection_hover", { key }); }}
                onConnectionLeave={() => setConnHover(null)}
                onConnectionDwell={({ connectionKey, strength }) => {
                  logEvent("connection_dwell", { connectionKey, strength });
                }}
                onConnectionClick={key => {
                  setConnPin(p => {
                    const unpin = p === key;
                    logEvent("connection_pin", { key, action: unpin ? "unpin" : "pin" });
                    return unpin ? null : key;
                  });
                  setConnHover(key);
                }}
                clearConnectionFocus={clearConnectionFocus}
                zoom={zoom} onZoomChange={setZoom}
                pan={pan}   setPan={setPan}
                onGapClick={handleGapClick}
                activeAuthorId={activeAuthor?.id}
                connections={isStudy ? studyConnections : CONNECTIONS}
                keywords={isStudy ? studyKeywords : KEYWORDS}
                selectedConnectionKey={selectedConnectionKey}
                isStudy={isStudy}
                onClusterHoverLeave={({ clusterId, isGap, durationMs }) => {
                  logEvent("cluster_hovered", { clusterId, isGap, durationMs });
                }}
                onGapClusterViewed={({ clusterId }) => {
                  logEvent("gap_cluster_viewed", { clusterId });
                }}
                onKeywordHoverLeave={({ keyword, clusterId, durationMs }) => {
                  logEvent("keyword_hovered", { keyword, clusterId, durationMs });
                }}
                analyzing={analyzing}
                onJumpToPost={jumpToPost}
                onOpenFullView={()=>{
                  sessionStorage.setItem("dm_fullview_clusters", JSON.stringify(clusters));
                  sessionStorage.setItem("dm_fullview_posts",    JSON.stringify(posts));
                  window.open(window.location.pathname + "?fullview=1", "_blank");
                }}
              />
            )}

            {/* Gap reply panel — shown above posts, below map */}
            {replyState && gapClusterId && renderReplyPanel()}

            {/* Discussion posts */}
            {rootPosts.map(post => {
              const replies = replyPosts.filter(r => r.parentId === post.id);
              const cluster = clusters.find(c => c.id === post.clusterId);
              const cc      = cluster ? CLUSTER_COLORS[cluster.id] : null;
              const clrColor= view==="after" && vizExpanded && cc ? cc.base : undefined;
              const mapCl   = hoveredCluster || selectedCluster;
              const isHighlighted = view==="after" && vizExpanded && !!mapCl && postBelongsToCluster(post, mapCl);
              const repliesHidden = hiddenReplyRoots.has(post.id);

              return (
                <div key={post.id}>
                  <PostCard
                    post={post}
                    clusters={clusters}
                    clusterColor={clrColor}
                    isMyPost={isStudy ? (Boolean(firebaseUid) && post.authorUid===firebaseUid) : post.authorId===activeAuthor?.id}
                    isNew={newPostIds.has(post.id)}
                    onReply={openReply}
                    onEdit={handleEditPost}
                    onDelete={handleDeletePost}
                    highlighted={isHighlighted}
                    refCallback={el => { postRefs.current[post.id] = el; }}
                    onMouseEnter={()=>{ if(view==="after"&&cluster) setHoveredCluster(post.clusterId); }}
                    onMouseLeave={()=>{ if(view==="after") setHoveredCluster(null); }}
                    replyCount={post.replyCount}
                    repliesHidden={repliesHidden}
                    onToggleReplies={post.replyCount>0 ? () => setHiddenReplyRoots(prev => { const n = new Set(prev); if (n.has(post.id)) n.delete(post.id); else n.add(post.id); return n; }) : undefined}
                  />
                  {replyState && replyingTo?.id===post.id && renderReplyPanel()}
                  {!repliesHidden && replies.map(r => {
                    const rc    = clusters.find(c => c.id === r.clusterId);
                    const rcc   = rc ? CLUSTER_COLORS[rc.id] : null;
                    const rHL   = view==="after" && vizExpanded && !!mapCl && postBelongsToCluster(r, mapCl);
                    return (
                      <div key={r.id}>
                        <PostCard
                          post={r}
                          clusters={clusters}
                          clusterColor={view==="after"&&vizExpanded&&rcc?rcc.base:undefined}
                          isMyPost={isStudy ? (Boolean(firebaseUid) && r.authorUid===firebaseUid) : r.authorId===activeAuthor?.id}
                          isNew={newPostIds.has(r.id)}
                          onReply={openReply}
                          onEdit={handleEditPost}
                          onDelete={handleDeletePost}
                          highlighted={rHL}
                          refCallback={el => { postRefs.current[r.id] = el; }}
                          onMouseEnter={()=>{ if(view==="after"&&rc) setHoveredCluster(r.clusterId); }}
                          onMouseLeave={()=>{ if(view==="after") setHoveredCluster(null); }}
                          replyCount={0}
                        />
                        {replyState && replyingTo?.id===r.id && renderReplyPanel()}
                      </div>
                    );
                  })}
                </div>
              );
            })}
            </>
            )}

            <div style={{ display:"flex", justifyContent:"center", gap:"16px", padding:"24px 0", fontSize:"14px", color:C.linkBlue, fontFamily:"Lato,Arial,sans-serif" }}>
              <span style={{ cursor:"pointer" }}>‹ Previous</span>
              <span style={{ cursor:"pointer" }}>Next ›</span>
            </div>
          </div>
        </div>
      </div>

      <SessionLogDrawer />
      {isStudy && showGenomicsCode && genomicsCode && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position:"fixed",
            inset:0,
            background:"rgba(15,23,42,0.45)",
            zIndex: 10060,
            display:"flex",
            alignItems:"center",
            justifyContent:"center",
            padding: 16,
          }}
          onClick={() => setShowGenomicsCode(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width:"min(520px, 100%)",
              background:C.white,
              border:`1px solid ${C.borderLight}`,
              borderRadius: 12,
              padding:"16px 18px",
              boxShadow:"0 12px 40px rgba(0,0,0,0.22)",
              fontFamily:"Lato,Arial,sans-serif",
            }}
          >
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10 }}>
              <div style={{ fontSize:14, fontWeight:900, color:C.text }}>Session ended</div>
              <button type="button" onClick={() => setShowGenomicsCode(false)} style={{ border:"none", background:"transparent", cursor:"pointer", fontSize:16, color:C.textLight }}>✕</button>
            </div>
            <div style={{ marginTop:8, fontSize:13, color:C.textLight, lineHeight:1.5 }}>
              Copy this <b>genomics code</b> into your notes so we can match your exported log without using names.
            </div>
            <div style={{ marginTop:12, display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
              <div style={{ padding:"10px 12px", border:`1px solid ${C.border}`, borderRadius:10, fontFamily:"ui-monospace, Menlo, Monaco, monospace", fontSize:18, fontWeight:800, letterSpacing:2, color:C.text }}>
                {genomicsCode}
              </div>
              <button
                type="button"
                onClick={async () => { try { await navigator.clipboard.writeText(genomicsCode); setToast("Genomics code copied"); } catch { setToast("Copy failed"); } }}
                style={{ background:C.canvasBlue, color:"white", border:"none", borderRadius:999, padding:"8px 12px", fontSize:12, cursor:"pointer", fontWeight:800 }}
              >
                Copy
              </button>
            </div>
            <div style={{ marginTop:14, display:"flex", justifyContent:"flex-end", gap:10 }}>
              <button
                type="button"
                onClick={() => { setShowGenomicsCode(false); exportToFile(); }}
                style={{ background:C.canvasBlue, color:"white", border:"none", borderRadius:8, padding:"10px 12px", fontSize:13, cursor:"pointer", fontWeight:900 }}
              >
                Export log now
              </button>
            </div>
          </div>
        </div>
      )}
      {import.meta.env.DEV && captureMode && (
        <button
          type="button"
          onClick={() => setCaptureMode(false)}
          title="Capture mode active — click to exit"
          style={{
            position: "fixed",
            right: 12,
            bottom: 12,
            zIndex: 10050,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 8px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(0,0,0,0.35)",
            color: "rgba(255,255,255,0.8)",
            cursor: "pointer",
            fontFamily: "ui-monospace, Menlo, Monaco, monospace",
            fontSize: 10,
            letterSpacing: 0.2,
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(239,68,68,0.9)" }} />
          <span style={{ fontSize: 10 }}>REC</span>
        </button>
      )}
      {/* Synthetic panel is intentionally hidden by default. To re-enable: add ?synthetic=1 to the URL. */}
      {syntheticPanelEnabled && !captureMode && (
        <SyntheticTestPanel
          onLoadFixture={handleLoadFixture}
          posts={posts}
          clusters={clusters}
          prepareSyntheticSession={prepareSyntheticSession}
          applySyntheticEvent={applySyntheticEvent}
          setSyntheticAuthorForTurn={setSyntheticAuthorForTurn}
        />
      )}
    </div>
  );
}