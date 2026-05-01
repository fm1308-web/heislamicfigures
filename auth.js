// ═══════════════════════════════════════════════════════════
// auth.js — Firebase auth + Firestore user doc + tier state
// Loaded as ES module. Exposes window.GoldArkAuth + window._gaUser.
// ═══════════════════════════════════════════════════════════
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import {
  getAuth, GoogleAuthProvider,
  signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, onAuthStateChanged, updateProfile
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp, onSnapshot,
  addDoc, collection, arrayUnion, arrayRemove
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBMbRIB5RzXxjWBedMg8cyEUvWaWOdOPOA",
  authDomain: "gold-ark.firebaseapp.com",
  projectId: "gold-ark",
  storageBucket: "gold-ark.firebasestorage.app",
  messagingSenderId: "241945237230",
  appId: "1:241945237230:web:8c7852914ba9a00c7ec5ff"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Tier ordering used by gate checks
const TIER_RANK = { visitor: 0, tester: 1, free: 1, subscriber: 2 };

let _userDocUnsub = null;
const _stateListeners = [];
window._gaUser = null;

function _notifyState() {
  for (const fn of _stateListeners) {
    try { fn(window._gaUser); } catch (e) { console.error("[auth] listener error", e); }
  }
}

function _computeEffectiveState(d) {
  let tier = d.tier || "tester";
  if (d.subscriptionStatus === "active") tier = "subscriber";
  return {
    uid: d.uid,
    email: d.email,
    displayName: d.displayName || "",
    tier,
    baseTier: d.tier || "tester",
    role: d.role || "user",
    subscriptionStatus: d.subscriptionStatus || null,
    stripeCustomerId: d.stripeCustomerId || null,
    bookmarks: Array.isArray(d.bookmarks) ? d.bookmarks : [],
    progress: (d.progress && typeof d.progress === 'object') ? d.progress : null
  };
}

async function _ensureUserDoc(firebaseUser, signInMethod) {
  const ref = doc(db, "users", firebaseUser.uid);
  const snap = await getDoc(ref);
  const now = serverTimestamp();

  if (!snap.exists()) {
    // First-time: check legacy tester localStorage → auto-upgrade to tester
    const legacyEmail = localStorage.getItem("goldArkTester");
    await setDoc(ref, {
      uid: firebaseUser.uid,
      email: firebaseUser.email || "",
      displayName: firebaseUser.displayName || "",
      signInMethod,
      firstLogin: now,
      lastLogin: now,
      tier: "tester",
      role: "user",
      stripeCustomerId: null,
      subscriptionStatus: null,
      legacyTesterEmail: legacyEmail || null,
      bookmarks: []
    });
  } else {
    await updateDoc(ref, { lastLogin: now });
  }
  return ref;
}

function _attachUserDocListener(ref) {
  if (_userDocUnsub) { _userDocUnsub(); _userDocUnsub = null; }
  _userDocUnsub = onSnapshot(ref, (snap) => {
    if (!snap.exists()) return;
    window._gaUser = _computeEffectiveState(snap.data());
    _notifyState();
  }, (err) => {
    console.error("[auth] user doc listener error", err);
  });
}

onAuthStateChanged(auth, async (firebaseUser) => {
  if (!firebaseUser) {
    if (_userDocUnsub) { _userDocUnsub(); _userDocUnsub = null; }
    window._gaUser = null;
    _notifyState();
    return;
  }
  try {
    const providerId = firebaseUser.providerData?.[0]?.providerId || "";
    const method = providerId === "google.com" ? "google" : "email";
    const ref = await _ensureUserDoc(firebaseUser, method);
    _attachUserDocListener(ref);
  } catch (e) {
    console.error("[auth] ensureUserDoc failed", e);
  }
});

const GoldArkAuth = {
  onStateChange(fn) {
    _stateListeners.push(fn);
    // Fire immediately with current state
    try { fn(window._gaUser); } catch (e) { console.error(e); }
    return () => {
      const i = _stateListeners.indexOf(fn);
      if (i >= 0) _stateListeners.splice(i, 1);
    };
  },
  async signInWithGoogle() {
    return signInWithPopup(auth, googleProvider);
  },
  async signInWithEmail(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  },
  async signUpWithEmail(email, password, displayName) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) await updateProfile(cred.user, { displayName });
    return cred;
  },
  async signOut() {
    return signOut(auth);
  },
  getCurrentUser() { return window._gaUser; },
  isSignedIn() { return !!window._gaUser; },
  hasTier(tier) {
    const u = window._gaUser;
    if (!u) return false;
    return (TIER_RANK[u.tier] || 0) >= (TIER_RANK[tier] || 0);
  },
  canSave()      { return this.hasTier("tester"); },
  canShare()     { return this.hasTier("tester"); },
  canSnapshot()  { return this.hasTier("tester"); },
  canFeedback()  { return this.hasTier("tester"); },
  canStudyRoom() { return this.hasTier("tester"); },
  isContributor() {
    const u = window._gaUser;
    return !!u && (u.role === "contributor" || u.role === "admin");
  },
  isAdmin() {
    const u = window._gaUser;
    return !!u && u.role === "admin";
  },
  getBookmarks() {
    const u = window._gaUser;
    return (u && Array.isArray(u.bookmarks)) ? u.bookmarks.slice() : [];
  },
  // Legacy Quran-only API (start.js still uses these). Keep as-is.
  hasBookmark(surah, verse) {
    const key = surah + ":" + verse;
    return this.getBookmarks().indexOf(key) !== -1;
  },
  async addBookmark(surah, verse) {
    const u = window._gaUser;
    if (!u) throw new Error("Not signed in");
    const key = surah + ":" + verse;
    const ref = doc(db, "users", u.uid);
    return updateDoc(ref, { bookmarks: arrayUnion(key) });
  },
  async removeBookmark(surah, verse) {
    const u = window._gaUser;
    if (!u) throw new Error("Not signed in");
    const key = surah + ":" + verse;
    const ref = doc(db, "users", u.uid);
    return updateDoc(ref, { bookmarks: arrayRemove(key) });
  },
  // Generic namespaced bookmark API. Use prefixes:
  //   "q:<surah>:<verse>"   Quran verse
  //   "h:<colKey>:<num>"    Hadith
  //   "t:<tafsirSlug>:<surah>:<verse>"  Tafsir entry
  hasBookmarkKey(key) {
    return this.getBookmarks().indexOf(key) !== -1;
  },
  async addBookmarkKey(key) {
    const u = window._gaUser;
    if (!u) throw new Error("Not signed in");
    const ref = doc(db, "users", u.uid);
    return updateDoc(ref, { bookmarks: arrayUnion(key) });
  },
  async removeBookmarkKey(key) {
    const u = window._gaUser;
    if (!u) throw new Error("Not signed in");
    const ref = doc(db, "users", u.uid);
    return updateDoc(ref, { bookmarks: arrayRemove(key) });
  },
  // Reading progress: { lastSurah, lastVerse, furthest: { "<surah>": <verse>, ... } }
  // Visitor (not signed in) → localStorage; signed in → Firestore users/{uid}.progress.
  getProgress() {
    var u = window._gaUser;
    if (u && u.progress && typeof u.progress === 'object') return u.progress;
    try {
      var raw = localStorage.getItem('gold-ark-progress');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  },
  async setProgress(data) {
    if (!data || typeof data !== 'object') return;
    // Always mirror to localStorage for fast reads on next visit.
    try { localStorage.setItem('gold-ark-progress', JSON.stringify(data)); } catch (e) {}
    var u = window._gaUser;
    if (!u) return;
    var ref = doc(db, "users", u.uid);
    return updateDoc(ref, { progress: data });
  },
  async submitCorrection(data) {
    const u = window._gaUser;
    if (!u) throw new Error("Not signed in");
    if (u.role !== "contributor" && u.role !== "admin") {
      throw new Error("Contributor role required");
    }
    return addDoc(collection(db, "corrections"), {
      uid: u.uid,
      email: u.email || "",
      displayName: u.displayName || "",
      role: u.role,
      figureSlug: data.figureSlug || "",
      figureName: data.figureName || "",
      fieldToCorrect: data.fieldToCorrect || "",
      suggestedValue: data.suggestedValue || "",
      sourceUrl: data.sourceUrl || "",
      note: data.note || "",
      status: "pending",
      createdAt: serverTimestamp()
    });
  },
  async submitFeedback(data) {
    const u = window._gaUser;
    if (!u) throw new Error("Not signed in");
    return addDoc(collection(db, "feedback"), {
      uid: u.uid,
      email: u.email || "",
      displayName: u.displayName || "",
      category: data.category || "other",
      message: data.message || "",
      url: data.url || "",
      userAgent: data.userAgent || "",
      status: "open",
      createdAt: serverTimestamp()
    });
  },
  // Used by gate.js to submit corrections
  get _db() { return db; },
  get _auth() { return auth; }
};

window.GoldArkAuth = GoldArkAuth;

// Fire a DOM event so non-module scripts can react when auth is ready
document.dispatchEvent(new CustomEvent("gold-ark-auth-ready"));
