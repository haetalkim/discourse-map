import { initializeApp, getApps } from "firebase/app";
import { browserLocalPersistence, getAuth, setPersistence, signInAnonymously } from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

function getFirebaseConfigFromEnv() {
  const cfg = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
  if (!cfg.apiKey || !cfg.projectId || !cfg.appId) return null;
  return cfg;
}

let cached = null;

export function isFirebaseEnabled() {
  return Boolean(getFirebaseConfigFromEnv());
}

export async function getFirebase() {
  if (cached) return cached;
  const config = getFirebaseConfigFromEnv();
  if (!config) throw new Error("Firebase env is not configured");

  const app = getApps().length ? getApps()[0] : initializeApp(config);
  const auth = getAuth(app);
  const db = getFirestore(app);

  // Anonymous auth gives us a stable uid for security rules.
  try {
    // Ensure the anonymous uid persists across refresh + "change code".
    await setPersistence(auth, browserLocalPersistence);
    if (!auth.currentUser) await signInAnonymously(auth);
  } catch {
    // If anonymous auth is disabled, we can still read/write depending on rules.
  }

  cached = { app, auth, db };
  return cached;
}

export async function getFirebaseAuthUid() {
  const { auth } = await getFirebase();
  return auth?.currentUser?.uid || null;
}

export function studyThreadPostsCollection(db, studyId, threadId) {
  return collection(db, "studies", studyId, "threads", threadId, "posts");
}

export function studyThreadConfigDoc(db, studyId, threadId) {
  return doc(db, "studies", studyId, "threads", threadId, "config", "main");
}

export async function getStudyThreadConfig({ studyId, threadId }) {
  const { db } = await getFirebase();
  const ref = studyThreadConfigDoc(db, studyId, threadId);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function setStudyThreadConfig({ studyId, threadId, studyCode, patch }) {
  const { db, auth } = await getFirebase();
  const ref = studyThreadConfigDoc(db, studyId, threadId);
  await setDoc(ref, {
    ...patch,
    studyCode: studyCode || null,
    updatedAtMs: Date.now(),
    updatedAt: serverTimestamp(),
    updatedByUid: auth?.currentUser?.uid || null,
  }, { merge: true });
}

export async function subscribeToStudyThreadConfig({ studyId, threadId, onConfig, onError }) {
  const { db } = await getFirebase();
  const ref = studyThreadConfigDoc(db, studyId, threadId);
  return onSnapshot(
    ref,
    (snap) => onConfig?.(snap.exists() ? snap.data() : null),
    (err) => onError?.(err),
  );
}

export async function addStudyPost({ studyId, threadId, author, studyCode, post }) {
  const { db, auth } = await getFirebase();
  const col = studyThreadPostsCollection(db, studyId, threadId);
  return await addDoc(col, {
    ...post,
    authorId: author.id,
    authorName: author.name,
    initials: author.initials,
    authorUid: auth?.currentUser?.uid || null,
    studyCode: studyCode || null,
    // Using serverTimestamp() alone can delay appearance in orderBy queries.
    // createdAtMs provides immediate, stable ordering across clients.
    createdAtMs: Date.now(),
    createdAt: serverTimestamp(),
  });
}

export async function subscribeToStudyPosts({ studyId, threadId, onPosts, onError }) {
  const { db } = await getFirebase();
  const col = studyThreadPostsCollection(db, studyId, threadId);
  const q = query(col, orderBy("createdAtMs", "asc"));
  return onSnapshot(
    q,
    (snap) => {
      const posts = [];
      snap.forEach(doc => {
        posts.push({ id: doc.id, ...doc.data() });
      });
      onPosts(posts);
    },
    (err) => onError?.(err),
  );
}

export async function updateStudyPost({ studyId, threadId, postId, patch }) {
  const { db } = await getFirebase();
  const ref = doc(db, "studies", studyId, "threads", threadId, "posts", postId);
  await updateDoc(ref, { ...patch, updatedAt: serverTimestamp() });
}

export async function deleteStudyPost({ studyId, threadId, postId }) {
  const { db } = await getFirebase();
  const ref = doc(db, "studies", studyId, "threads", threadId, "posts", postId);
  await deleteDoc(ref);
}

