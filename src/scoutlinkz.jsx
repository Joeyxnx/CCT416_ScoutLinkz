// ============================================================
// ScoutLinkz — Firebase Auth System
// ============================================================
// SETUP INSTRUCTIONS:
// 1. npm install firebase
// 2. Replace the firebaseConfig object below with your real
//    credentials from Firebase Console → Project Settings → Your apps
// 3. In Firebase Console, enable Authentication → Email/Password
// ============================================================

import { useState, useEffect, useRef, createContext, useContext } from "react";

// ─── FIREBASE IMPORTS ───────────────────────────────────────
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  getFirestore,
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, getDocs, query, orderBy, serverTimestamp,
} from "firebase/firestore";

// ─── FIREBASE CONFIG ─────────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyAC1xP96gui1ZbRjBE1MlOhdnbVfZOyfcY",
  authDomain:        "scoutlinkz.firebaseapp.com",
  projectId:         "scoutlinkz",
  storageBucket:     "scoutlinkz.firebasestorage.app",
  messagingSenderId: "296058836991",
  appId:             "1:296058836991:web:a2ff6b05c57c162fb0f9ca",
  measurementId:     "G-45Y7WXGJJS",
};

// ─── FIREBASE INIT ───────────────────────────────────────────
const app       = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth      = getAuth(app);
const db        = getFirestore(app);

// ─── FIRESTORE HELPERS ───────────────────────────────────────
// Athletes
export async function fetchAthletes() {
  const snap = await getDocs(query(collection(db, "athletes"), orderBy("createdAt", "desc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function fetchAthlete(uid) {
  const snap = await getDoc(doc(db, "athletes", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
export async function saveAthlete(uid, data) {
  await setDoc(doc(db, "athletes", uid), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

// Scout data (saved lists, statuses, notes)
export async function fetchScoutData(scoutUid) {
  const snap = await getDoc(doc(db, "scouts", scoutUid));
  return snap.exists() ? snap.data() : { savedIds: [], statuses: {}, notes: {} };
}
export async function saveScoutData(scoutUid, data) {
  await setDoc(doc(db, "scouts", scoutUid), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}
// ────────────────────────────────────────────────────────────

// ─── AUTH CONTEXT ────────────────────────────────────────────
const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser]       = useState(undefined); // undefined = loading
  const [role, setRole]       = useState(null);      // "scout" | "athlete"
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Detect role: check if they have an athlete doc
        try {
          const athleteSnap = await getDoc(doc(db, "athletes", firebaseUser.uid));
          setRole(athleteSnap.exists() ? "athlete" : "scout");
        } catch {
          setRole("scout"); // default to scout if check fails
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function login(email, password) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signupScout(email, password, fullName) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: fullName });
    // Create scout doc
    await setDoc(doc(db, "scouts", cred.user.uid), {
      displayName: fullName, email, role: "scout", createdAt: serverTimestamp(),
    });
    setUser({ ...cred.user, displayName: fullName });
    setRole("scout");
  }

  async function signupAthlete(email, password, fullName) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: fullName });
    setUser({ ...cred.user, displayName: fullName });
    setRole("athlete");
    // Athlete doc is created after profile form is filled out
  }

  // Keep legacy signup as scout signup
  async function signup(email, password, fullName) {
    return signupScout(email, password, fullName);
  }

  async function logout() {
    await signOut(auth);
  }

  async function resetPassword(email) {
    await sendPasswordResetEmail(auth, email);
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, login, signup, signupScout, signupAthlete, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() { return useContext(AuthContext); }

// ─── FIREBASE ERROR MESSAGES ─────────────────────────────────
function friendlyError(code) {
  const map = {
    "auth/invalid-credential":      "Incorrect email or password.",
    "auth/user-not-found":          "No account found with that email.",
    "auth/wrong-password":          "Incorrect password.",
    "auth/too-many-requests":       "Too many attempts. Try again later.",
    "auth/invalid-email":           "Please enter a valid email address.",
    "auth/network-request-failed":  "Network error. Check your connection.",
    "auth/email-already-in-use":    "An account with this email already exists.",
    "auth/weak-password":           "Password must be at least 6 characters.",
  };
  return map[code] || "Something went wrong. Please try again.";
}

// ═══════════════════════════════════════════════════════════════
// LOGIN / SIGNUP PAGE
// ═══════════════════════════════════════════════════════════════
function LoginPage() {
  const { login, signupScout, signupAthlete, resetPassword } = useAuth();
  const [mode, setMode]               = useState("login"); // "login" | "signup" | "reset"
  const [signupRole, setSignupRole]   = useState("scout"); // "scout" | "athlete"
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [confirmPw, setConfirmPw]     = useState("");
  const [fullName, setFullName]       = useState("");
  const [error, setError]             = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [showPw, setShowPw]           = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resetSent, setResetSent]     = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  function switchMode(next) {
    setMode(next); setError(""); setFieldErrors({}); setResetSent(false);
  }

  function validate() {
    const errs = {};
    if (mode === "signup" && !fullName.trim()) errs.fullName = "Full name is required.";
    if (!email.trim()) errs.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(email))     errs.email = "Enter a valid email.";
    if (mode !== "reset") {
      if (!password)                errs.password = "Password is required.";
      else if (password.length < 6) errs.password = "At least 6 characters required.";
    }
    if (mode === "signup" && password && confirmPw !== password)
      errs.confirmPw = "Passwords don't match.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (mode === "login")  await login(email, password);
      if (mode === "signup") {
        if (signupRole === "athlete") await signupAthlete(email, password, fullName.trim());
        else                          await signupScout(email, password, fullName.trim());
      }
      if (mode === "reset")  { await resetPassword(email); setResetSent(true); }
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setSubmitting(false);
    }
  }

  const titles    = { login: "Welcome back",    signup: "Create account",                  reset: "Reset password" };
  const subs      = { login: "Sign in to access your scouting dashboard", signup: "Join ScoutLinkz as a scout or coach", reset: "We'll send a reset link to your email" };
  const btnLabels = { login: "Sign In →",       signup: "Create Account →",                reset: "Send Reset Link →" };

  return (
    <div style={s.loginRoot}>
      <style>{loginStyles}</style>
      <div style={s.gridBg} aria-hidden="true">
        {Array.from({ length: 80 }).map((_, i) => <div key={i} style={s.gridCell} />)}
      </div>
      <div style={s.orb1} aria-hidden="true" />
      <div style={s.orb2} aria-hidden="true" />

      <div style={s.loginWrap}>
        <div style={s.logoRow}>
          <div style={s.logoIcon}>⚽</div>
          <div>
            <div style={s.logoName}>ScoutLinkz</div>
            <div style={s.logoSub}>Scout & Coach Portal</div>
          </div>
        </div>

        {/* Sign In / Create Account tabs */}
        {mode !== "reset" && (
          <div style={s.tabs}>
            {["login", "signup"].map(t => (
              <button key={t} type="button"
                style={mode === t ? { ...s.tab, ...s.tabActive } : s.tab}
                onClick={() => switchMode(t)}
              >
                {t === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>
        )}

        <div style={s.card}>
          <div style={s.cardHead}>
            <h1 style={s.cardTitle}>{titles[mode]}</h1>
            <p style={s.cardSub}>{subs[mode]}</p>
          </div>

          {error && <div style={s.errorBanner}><span>⚠</span> {error}</div>}

          {mode === "reset" && resetSent ? (
            <>
              <div style={s.successBanner}>✓ Reset link sent! Check your inbox.</div>
              <button type="button" style={s.backBtn} onClick={() => switchMode("login")}>← Back to sign in</button>
            </>
          ) : (
            <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Role picker — signup only */}
              {mode === "signup" && (
                <div style={s.field}>
                  <label style={s.label}>I am a...</label>
                  <div style={{ display:"flex", gap:8 }}>
                    {[
                      { key:"scout",   label:"🔍 Scout / Coach",  desc:"Browse & recruit athletes" },
                      { key:"athlete", label:"⚽ Athlete",         desc:"Create my recruiting profile" },
                    ].map(r => (
                      <button key={r.key} type="button" onClick={() => setSignupRole(r.key)}
                        style={{ flex:1, padding:"10px 12px", borderRadius:10, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',inherit", textAlign:"left", transition:"all .2s",
                          border: signupRole === r.key ? "1px solid rgba(99,102,241,.5)" : "1px solid #1e3352",
                          background: signupRole === r.key ? "rgba(99,102,241,.12)" : "rgba(255,255,255,.03)",
                          color: signupRole === r.key ? "#c7d2fe" : "#4d6a8a",
                        }}>
                        <div style={{ fontWeight:700, fontSize:13 }}>{r.label}</div>
                        <div style={{ fontSize:11, marginTop:3, opacity:.7 }}>{r.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Full name — signup only */}
              {mode === "signup" && (
                <div style={s.field}>
                  <label style={s.label}>Full Name</label>
                  <input className="sl-input" type="text" value={fullName} placeholder="Jane Smith"
                    autoComplete="name"
                    onChange={e => { setFullName(e.target.value); setFieldErrors(f => ({ ...f, fullName: "" })); }}
                    style={fieldErrors.fullName ? { ...s.input, borderColor: "#ef4444" } : s.input}
                  />
                  {fieldErrors.fullName && <div style={s.fieldErr}>{fieldErrors.fullName}</div>}
                </div>
              )}

              {/* Email */}
              <div style={s.field}>
                <label style={s.label}>Email</label>
                <input className="sl-input" type="email" value={email} placeholder="scout@yourteam.com"
                  autoComplete="email"
                  onChange={e => { setEmail(e.target.value); setFieldErrors(f => ({ ...f, email: "" })); }}
                  style={fieldErrors.email ? { ...s.input, borderColor: "#ef4444" } : s.input}
                />
                {fieldErrors.email && <div style={s.fieldErr}>{fieldErrors.email}</div>}
              </div>

              {/* Password */}
              {mode !== "reset" && (
                <div style={s.field}>
                  <label style={s.label}>Password</label>
                  <div style={s.pwWrap}>
                    <input className="sl-input" type={showPw ? "text" : "password"} value={password}
                      placeholder="••••••••"
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      onChange={e => { setPassword(e.target.value); setFieldErrors(f => ({ ...f, password: "" })); }}
                      style={fieldErrors.password ? { ...s.input, ...s.pwInput, borderColor: "#ef4444" } : { ...s.input, ...s.pwInput }}
                    />
                    <button type="button" style={s.eyeBtn} onClick={() => setShowPw(v => !v)}>{showPw ? "🙈" : "👁"}</button>
                  </div>
                  {fieldErrors.password && <div style={s.fieldErr}>{fieldErrors.password}</div>}
                </div>
              )}

              {/* Confirm password — signup only */}
              {mode === "signup" && (
                <div style={s.field}>
                  <label style={s.label}>Confirm Password</label>
                  <div style={s.pwWrap}>
                    <input className="sl-input" type={showConfirm ? "text" : "password"} value={confirmPw}
                      placeholder="••••••••" autoComplete="new-password"
                      onChange={e => { setConfirmPw(e.target.value); setFieldErrors(f => ({ ...f, confirmPw: "" })); }}
                      style={fieldErrors.confirmPw ? { ...s.input, ...s.pwInput, borderColor: "#ef4444" } : { ...s.input, ...s.pwInput }}
                    />
                    <button type="button" style={s.eyeBtn} onClick={() => setShowConfirm(v => !v)}>{showConfirm ? "🙈" : "👁"}</button>
                  </div>
                  {fieldErrors.confirmPw && <div style={s.fieldErr}>{fieldErrors.confirmPw}</div>}
                </div>
              )}

              {/* Forgot password — login only */}
              {mode === "login" && (
                <div style={s.forgotRow}>
                  <button type="button" style={s.forgotBtn} onClick={() => switchMode("reset")}>Forgot password?</button>
                </div>
              )}

              <button type="submit" className="sl-submit" disabled={submitting} style={s.submitBtn}>
                {submitting && <span className="sl-spinner" />}
                {submitting ? "Please wait…" : btnLabels[mode]}
              </button>

              {mode === "reset" && (
                <button type="button" style={s.backBtn} onClick={() => switchMode("login")}>← Back to sign in</button>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════
const ATHLETES = [
  { id: 1,  name: "Devin Smith",    sport: "Soccer",      position: "Goalkeeper",    gradYear: 2026, location: "Toronto, ON",    height: "6'1\"", weight: "200 lbs", gpa: 3.7, foot: "Right",  status: "in-review",  bio: "Explosive shot-stopper with strong distribution. Comfortable playing out of the back.", tags: ["Shot-stopping","1v1","Distribution"], stats: [{label:"Saves",value:68},{label:"Clean Sheets",value:9},{label:"Save %",value:"78%"},{label:"Games",value:18}], email: "devin@example.com", phone: "(555) 123-4567", highlights: [{title:"Top Saves (2025)",videoId:"0jlkr3V6I74"},{title:"Distribution Clips",videoId:"Bz8PO5rFWe8"},{title:"Training Session",videoId:"v36snA3Dsg8"}] },
  { id: 2,  name: "Marcus Lee",     sport: "Basketball",  position: "Point Guard",   gradYear: 2025, location: "Mississauga, ON", height: "6'0\"", weight: "180 lbs", gpa: 3.4, foot: "Right",  status: "interested", bio: "High-IQ playmaker with elite court vision and a reliable mid-range game.", tags: ["Playmaking","Defense","Leadership"], stats: [{label:"PPG",value:18.4},{label:"APG",value:7.2},{label:"RPG",value:4.1},{label:"Games",value:24}], email: "marcus@example.com", phone: "(555) 234-5678", highlights: [] },
  { id: 3,  name: "Jordan Rivera",  sport: "Track",       position: "Sprinter",      gradYear: 2026, location: "Brampton, ON",   height: "5'11\"",weight: "170 lbs", gpa: 3.9, foot: "Left",   status: "contacted",  bio: "Sub-11 sprinter specializing in 100m and 200m. Provincial gold medalist.", tags: ["Speed","Explosiveness","Technique"], stats: [{label:"100m",value:"10.8s"},{label:"200m",value:"21.6s"},{label:"Medals",value:6},{label:"Meets",value:12}], email: "jordan@example.com", phone: "(555) 345-6789", highlights: [] },
  { id: 4,  name: "Taylor Brooks",  sport: "Soccer",      position: "Center Back",   gradYear: 2027, location: "Oakville, ON",   height: "6'2\"", weight: "195 lbs", gpa: 3.5, foot: "Right",  status: "interested", bio: "Dominant aerial presence with excellent reading of the game. Strong in the tackle.", tags: ["Defending","Aerial","Leadership"], stats: [{label:"Tackles",value:54},{label:"Intercepts",value:31},{label:"Goals",value:3},{label:"Games",value:22}], email: "taylor@example.com", phone: "(555) 456-7890", highlights: [] },
  { id: 5,  name: "Aisha Patel",    sport: "Soccer",      position: "Midfielder",    gradYear: 2025, location: "Scarborough, ON","height": "5'6\"", weight: "140 lbs", gpa: 4.0, foot: "Both",   status: "none",       bio: "Box-to-box midfielder with outstanding technical ability and work rate.", tags: ["Technical","Stamina","Vision"], stats: [{label:"Goals",value:11},{label:"Assists",value:14},{label:"Pass %",value:"89%"},{label:"Games",value:20}], email: "aisha@example.com", phone: "(555) 567-8901", highlights: [] },
  { id: 6,  name: "Chris Okafor",   sport: "Basketball",  position: "Center",        gradYear: 2026, location: "North York, ON", height: "6'9\"", weight: "240 lbs", gpa: 3.2, foot: "Right",  status: "passed",     bio: "Physical presence in the paint with developing post moves and shot-blocking ability.", tags: ["Paint","Rebounding","Blocks"], stats: [{label:"PPG",value:14.1},{label:"RPG",value:9.8},{label:"BPG",value:3.2},{label:"Games",value:20}], email: "chris@example.com", phone: "(555) 678-9012", highlights: [] },
  { id: 7,  name: "Sofia Hernandez",sport: "Track",       position: "Long Distance",  gradYear: 2025, location: "Etobicoke, ON",  height: "5'5\"", weight: "128 lbs", gpa: 3.8, foot: "Right",  status: "none",       bio: "Consistent long-distance runner with a strong finishing kick. National qualifier.", tags: ["Endurance","Pacing","Mental Strength"], stats: [{label:"1500m",value:"4:12"},{label:"5K",value:"16:40"},{label:"Medals",value:4},{label:"Meets",value:15}], email: "sofia@example.com", phone: "(555) 789-0123", highlights: [] },
  { id: 8,  name: "Ryan Kim",       sport: "Soccer",      position: "Winger",        gradYear: 2027, location: "Richmond Hill, ON","height":"5'9\"",weight: "158 lbs", gpa: 3.6, foot: "Left",   status: "interested", bio: "Pacy winger with a lethal left foot and ability to take on defenders 1v1.", tags: ["Pace","Dribbling","Crossing"], stats: [{label:"Goals",value:9},{label:"Assists",value:12},{label:"Dribbles",value:78},{label:"Games",value:21}], email: "ryan@example.com", phone: "(555) 890-1234", highlights: [] },
];

const STATUS_CONFIG = {
  "none":       { label: "No Status",   color: "#64748b", bg: "rgba(100,116,139,.1)",  border: "rgba(100,116,139,.2)" },
  "interested": { label: "Interested",  color: "#818cf8", bg: "rgba(129,140,248,.1)",  border: "rgba(129,140,248,.25)" },
  "contacted":  { label: "Contacted",   color: "#fbbf24", bg: "rgba(251,191,36,.1)",   border: "rgba(251,191,36,.25)" },
  "in-review":  { label: "In Review",   color: "#34d399", bg: "rgba(52,211,153,.1)",   border: "rgba(52,211,153,.25)" },
  "passed":     { label: "Passed",      color: "#f87171", bg: "rgba(248,113,113,.1)",  border: "rgba(248,113,113,.25)" },
};

// ═══════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG["none"];
  return (
    <span style={{ display:"flex",alignItems:"center",gap:5,fontSize:12,fontWeight:700,padding:"4px 10px",borderRadius:999,border:`1px solid ${cfg.border}`,background:cfg.bg,color:cfg.color,whiteSpace:"nowrap" }}>
      <span style={{ width:6,height:6,borderRadius:"50%",background:cfg.color,flexShrink:0 }} />
      {cfg.label}
    </span>
  );
}

function StatusDropdown({ status, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function h(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG["none"];
  return (
    <div ref={ref} style={{ position:"relative" }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ display:"flex",alignItems:"center",gap:6,padding:"7px 12px",borderRadius:10,border:`1px solid ${cfg.border}`,background:cfg.bg,color:cfg.color,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit" }}>
        <span style={{ width:6,height:6,borderRadius:"50%",background:cfg.color }} />
        {cfg.label} <span style={{ fontSize:9,opacity:.7 }}>{open?"▲":"▼"}</span>
      </button>
      {open && (
        <div style={{ position:"absolute",top:"calc(100% + 6px)",right:0,background:"#0a1525",border:"1px solid #22304a",borderRadius:12,overflow:"hidden",minWidth:150,boxShadow:"0 12px 40px rgba(0,0,0,.5)",zIndex:50 }}>
          {Object.entries(STATUS_CONFIG).map(([key, c]) => (
            <button key={key} onClick={() => { onChange(key); setOpen(false); }}
              style={{ display:"flex",alignItems:"center",gap:8,width:"100%",padding:"9px 14px",border:"none",background:key===status?c.bg:"transparent",color:key===status?c.color:"#f0f6ff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",textAlign:"left" }}>
              <span style={{ width:6,height:6,borderRadius:"50%",background:c.color }} />
              {c.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ATHLETE PROFILE VIEW (full detail)
// ═══════════════════════════════════════════════════════════════
function AthleteProfile({ athlete, statuses, savedIds, onStatusChange, onToggleSave, onBack }) {
  const [lightbox, setLightbox] = useState(null);
  const status = statuses[athlete.id] || "none";
  const saved  = savedIds.includes(athlete.id);

  return (
    <div style={{ padding:"0 32px 40px" }}>
      <style>{`
        .yt-thumb { position:relative;width:100%;padding-top:56.25%;background:#000;border-radius:12px;overflow:hidden;cursor:pointer; }
        .yt-thumb img { position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.85; }
        .yt-thumb .play { position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.35);font-size:28px;opacity:0;transition:opacity .15s; }
        .yt-thumb:hover .play { opacity:1; }
        .lb-overlay { position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:200;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px); }
        .lb-box { background:#0f172a;border:1px solid #22304a;border-radius:20px;width:min(860px,95vw);overflow:hidden; }
        .lb-head { display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #22304a; }
        .lb-video { aspect-ratio:16/9;background:#000; }
        .lb-video iframe { width:100%;height:100%;display:block; }
      `}</style>

      {lightbox && (
        <div className="lb-overlay" onClick={() => setLightbox(null)}>
          <div className="lb-box" onClick={e => e.stopPropagation()}>
            <div className="lb-head">
              <span style={{ fontWeight:800,fontSize:15 }}>{lightbox.title}</span>
              <button onClick={() => setLightbox(null)} style={{ background:"rgba(255,255,255,.07)",border:"1px solid #22304a",color:"#f0f6ff",width:32,height:32,borderRadius:10,cursor:"pointer",fontSize:14 }}>✕</button>
            </div>
            <div className="lb-video">
              <iframe src={`https://www.youtube.com/embed/${lightbox.videoId}?autoplay=1&rel=0`} title={lightbox.title} frameBorder="0" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowFullScreen />
            </div>
          </div>
        </div>
      )}

      {/* Back + actions bar */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"24px 0 20px" }}>
        <button onClick={onBack} style={{ display:"flex",alignItems:"center",gap:8,background:"none",border:"1px solid #22304a",color:"#4d6a8a",borderRadius:10,padding:"8px 14px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>
          ← Back
        </button>
        <div style={{ display:"flex",gap:10,alignItems:"center" }}>
          <StatusDropdown status={status} onChange={v => onStatusChange(athlete.id, v)} />
          <button onClick={() => onToggleSave(athlete.id)}
            style={{ display:"flex",alignItems:"center",gap:7,padding:"8px 14px",borderRadius:10,border:`1px solid ${saved?"rgba(245,158,11,.4)":"#162438"}`,background:saved?"rgba(245,158,11,.12)":"rgba(255,255,255,.04)",color:saved?"#fbbf24":"#4d6a8a",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit" }}>
            {saved ? "★ Saved" : "☆ Save"}
          </button>
          <a href={`mailto:${athlete.email}`}
            style={{ display:"flex",alignItems:"center",gap:7,padding:"8px 14px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#4f46e5,#6366f1)",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",textDecoration:"none" }}>
            ✉ Contact
          </a>
        </div>
      </div>

      {/* Hero card */}
      <div style={{ background:"rgba(10,21,37,.85)",border:"1px solid #22304a",borderRadius:20,padding:24,marginBottom:16 }}>
        <div style={{ display:"flex",gap:18,alignItems:"flex-start",flexWrap:"wrap" }}>
          <div style={{ width:72,height:72,borderRadius:20,background:"rgba(99,102,241,.15)",border:"1px solid rgba(99,102,241,.3)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:24,flexShrink:0 }}>
            {athlete.name.split(" ").map(x=>x[0]).join("")}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:6 }}>
              <span style={{ fontWeight:800,fontSize:22 }}>{athlete.name}</span>
              <StatusBadge status={status} />
            </div>
            <div style={{ color:"#4d6a8a",fontSize:14,marginBottom:12 }}>{athlete.sport} · {athlete.position} · Grad {athlete.gradYear} · {athlete.location}</div>
            <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
              {[athlete.sport, `GPA ${athlete.gpa}`, athlete.height, athlete.weight, `${athlete.foot} foot`].map(t => (
                <span key={t} style={{ fontSize:12,fontWeight:700,padding:"4px 10px",borderRadius:999,border:"1px solid #22304a",background:"rgba(255,255,255,.05)" }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
        <p style={{ marginTop:16,lineHeight:1.6,color:"#f0f6ff",opacity:.9 }}>{athlete.bio}</p>
        <div style={{ display:"flex",gap:8,marginTop:12,flexWrap:"wrap" }}>
          {athlete.tags.map(t => <span key={t} style={{ fontSize:12,padding:"5px 10px",borderRadius:999,background:"rgba(255,255,255,.06)",border:"1px solid #22304a" }}>{t}</span>)}
        </div>
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }}>
        {/* Stats */}
        <div style={{ background:"rgba(10,21,37,.85)",border:"1px solid #22304a",borderRadius:18,padding:20 }}>
          <div style={{ fontWeight:800,fontSize:15,marginBottom:14 }}>Key Stats</div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
            {athlete.stats.map(s => (
              <div key={s.label} style={{ background:"rgba(255,255,255,.05)",border:"1px solid #22304a",borderRadius:12,padding:12 }}>
                <div style={{ fontWeight:800,fontSize:20 }}>{s.value}</div>
                <div style={{ color:"#4d6a8a",fontSize:12,marginTop:3 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div style={{ background:"rgba(10,21,37,.85)",border:"1px solid #22304a",borderRadius:18,padding:20,display:"flex",flexDirection:"column",gap:14 }}>
          <div style={{ fontWeight:800,fontSize:15 }}>Contact</div>
          <div>
            <div style={{ color:"#4d6a8a",fontSize:13 }}>Email</div>
            <div style={{ fontWeight:700,marginTop:3 }}>{athlete.email}</div>
          </div>
          <div>
            <div style={{ color:"#4d6a8a",fontSize:13 }}>Phone</div>
            <div style={{ fontWeight:700,marginTop:3 }}>{athlete.phone}</div>
          </div>
          <a href={`mailto:${athlete.email}`} style={{ display:"flex",alignItems:"center",justifyContent:"center",padding:"10px 14px",borderRadius:12,background:"rgba(79,70,229,.9)",border:"none",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer",textDecoration:"none" }}>
            Contact Athlete
          </a>
        </div>

        {/* Highlights */}
        {athlete.highlights.length > 0 && (
          <div style={{ gridColumn:"span 2",background:"rgba(10,21,37,.85)",border:"1px solid #22304a",borderRadius:18,padding:20 }}>
            <div style={{ fontWeight:800,fontSize:15,marginBottom:14 }}>Highlight Reel</div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12 }}>
              {athlete.highlights.map((h, i) => (
                <div key={i}>
                  <div className="yt-thumb" onClick={() => setLightbox(h)}>
                    <img src={`https://img.youtube.com/vi/${h.videoId}/hqdefault.jpg`} alt={h.title} />
                    <div className="play">▶</div>
                  </div>
                  <div style={{ fontWeight:700,fontSize:13,marginTop:8 }}>{h.title}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PAGE: DASHBOARD HOME
// ═══════════════════════════════════════════════════════════════
function PageDashboard({ athletes, statuses, savedIds, onViewAthlete }) {
  const saved    = athletes.filter(a => savedIds.includes(a.id));
  const inReview = athletes.filter(a => statuses[a.id] === "in-review");
  const contacted= athletes.filter(a => statuses[a.id] === "contacted");
  const recent   = [...athletes].slice(0, 5);

  const stats = [
    { label: "Saved Athletes",  value: savedIds.length,  icon: "★",  color: "#f59e0b" },
    { label: "Profiles Viewed", value: athletes.length,  icon: "👁",  color: "#4f46e5" },
    { label: "Contacted",       value: contacted.length, icon: "✉",  color: "#22c55e" },
    { label: "In Review",       value: inReview.length,  icon: "🔍", color: "#06b6d4" },
  ];

  return (
    <div style={{ padding:"0 32px 40px" }}>
      <div style={{ padding:"28px 0 20px" }}>
        <h2 style={{ fontWeight:800,fontSize:24,margin:0 }}>Dashboard</h2>
        <p style={{ color:"#4d6a8a",fontSize:14,marginTop:4 }}>Your scouting overview at a glance</p>
      </div>

      {/* Stats */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background:"rgba(10,21,37,.85)",border:"1px solid #22304a",borderRadius:18,padding:"18px 20px" }}>
            <div style={{ fontSize:22,marginBottom:8 }}>{s.icon}</div>
            <div style={{ fontWeight:800,fontSize:28,color:s.color }}>{s.value}</div>
            <div style={{ color:"#4d6a8a",fontSize:13,marginTop:4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent athletes */}
      <div style={{ background:"rgba(10,21,37,.85)",border:"1px solid #22304a",borderRadius:18,padding:20,marginBottom:16 }}>
        <div style={{ fontWeight:800,fontSize:16,marginBottom:16 }}>Recent Athletes</div>
        <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
          {recent.map(a => {
            const status = statuses[a.id] || "none";
            const cfg = STATUS_CONFIG[status];
            return (
              <div key={a.id} style={{ display:"flex",alignItems:"center",gap:14,padding:"12px 14px",background:"rgba(255,255,255,.03)",borderRadius:12,border:"1px solid #1a2740" }}>
                <div style={{ width:38,height:38,borderRadius:10,background:"rgba(99,102,241,.12)",border:"1px solid rgba(99,102,241,.25)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,flexShrink:0 }}>
                  {a.name.split(" ").map(x=>x[0]).join("")}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:800,fontSize:14 }}>{a.name}</div>
                  <div style={{ color:"#4d6a8a",fontSize:12,marginTop:2 }}>{a.sport} · {a.position}</div>
                </div>
                <StatusBadge status={status} />
                <button onClick={() => onViewAthlete(a)} style={{ background:"rgba(99,102,241,.1)",border:"1px solid rgba(99,102,241,.25)",color:"#c7d2fe",borderRadius:9,padding:"6px 12px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>
                  View Profile →
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick tip */}
      <div style={{ background:"rgba(79,70,229,.06)",border:"1px dashed rgba(99,102,241,.25)",borderRadius:16,padding:"18px 22px",display:"flex",alignItems:"center",gap:16 }}>
        <span style={{ fontSize:28 }}>🚀</span>
        <div>
          <div style={{ fontWeight:800,fontSize:14,color:"#c7d2fe" }}>Discover more athletes</div>
          <div style={{ color:"#4d6a8a",fontSize:13,marginTop:3 }}>Head to the Discover tab to browse and filter athletes by sport, position, GPA, and location.</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PAGE: DISCOVER
// ═══════════════════════════════════════════════════════════════
function PageDiscover({ athletes, statuses, savedIds, onViewAthlete, onToggleSave }) {
  const [search, setSearch]     = useState("");
  const [sportFilter, setSport] = useState("All");
  const [statusFilter, setStatusF] = useState("All");
  const [sortBy, setSort]       = useState("name");

  const sports   = ["All", ...Array.from(new Set(athletes.map(a => a.sport)))];
  const statuses_list = ["All", ...Object.keys(STATUS_CONFIG)];

  const filtered = athletes
    .filter(a => {
      const q = search.toLowerCase();
      const matchQ = !q || a.name.toLowerCase().includes(q) || a.sport.toLowerCase().includes(q) || a.position.toLowerCase().includes(q) || a.location.toLowerCase().includes(q);
      const matchS = sportFilter === "All" || a.sport === sportFilter;
      const matchSt = statusFilter === "All" || (statuses[a.id] || "none") === statusFilter;
      return matchQ && matchS && matchSt;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "gpa")  return b.gpa - a.gpa;
      if (sortBy === "grad") return a.gradYear - b.gradYear;
      return 0;
    });

  return (
    <div style={{ padding:"0 32px 40px" }}>
      <div style={{ padding:"28px 0 20px" }}>
        <h2 style={{ fontWeight:800,fontSize:24,margin:0 }}>Discover Athletes</h2>
        <p style={{ color:"#4d6a8a",fontSize:14,marginTop:4 }}>{filtered.length} athletes found</p>
      </div>

      {/* Filters */}
      <div style={{ display:"flex",gap:10,marginBottom:20,flexWrap:"wrap",alignItems:"center" }}>
        <div style={{ display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,.05)",border:"1px solid #22304a",borderRadius:11,padding:"8px 14px",flex:1,minWidth:200 }}>
          <span style={{ opacity:.5 }}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, sport, position, location…"
            style={{ background:"none",border:"none",outline:"none",color:"#f0f6ff",fontSize:14,fontFamily:"inherit",width:"100%" }} />
          {search && <button onClick={()=>setSearch("")} style={{ background:"none",border:"none",color:"#4d6a8a",cursor:"pointer",fontSize:16,padding:0 }}>×</button>}
        </div>
        <select value={sportFilter} onChange={e=>setSport(e.target.value)}
          style={{ background:"#0a1525",border:"1px solid #22304a",color:"#f0f6ff",borderRadius:10,padding:"9px 12px",fontSize:13,fontFamily:"inherit",fontWeight:700,cursor:"pointer" }}>
          {sports.map(s => <option key={s} value={s}>{s === "All" ? "All Sports" : s}</option>)}
        </select>
        <select value={statusFilter} onChange={e=>setStatusF(e.target.value)}
          style={{ background:"#0a1525",border:"1px solid #22304a",color:"#f0f6ff",borderRadius:10,padding:"9px 12px",fontSize:13,fontFamily:"inherit",fontWeight:700,cursor:"pointer" }}>
          {statuses_list.map(s => <option key={s} value={s}>{s === "All" ? "All Statuses" : STATUS_CONFIG[s]?.label}</option>)}
        </select>
        <select value={sortBy} onChange={e=>setSort(e.target.value)}
          style={{ background:"#0a1525",border:"1px solid #22304a",color:"#f0f6ff",borderRadius:10,padding:"9px 12px",fontSize:13,fontFamily:"inherit",fontWeight:700,cursor:"pointer" }}>
          <option value="name">Sort: Name</option>
          <option value="gpa">Sort: GPA</option>
          <option value="grad">Sort: Grad Year</option>
        </select>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:"center",padding:"60px 0",color:"#4d6a8a" }}>
          <div style={{ fontSize:40,marginBottom:12 }}>🔍</div>
          <div style={{ fontWeight:700 }}>No athletes match your filters</div>
        </div>
      ) : (
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14 }}>
          {filtered.map(a => {
            const st = statuses[a.id] || "none";
            const isSaved = savedIds.includes(a.id);
            return (
              <div key={a.id} style={{ background:"rgba(10,21,37,.9)",border:"1px solid #22304a",borderRadius:18,padding:18,display:"flex",flexDirection:"column",gap:12,transition:"border-color .2s" }}
                onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(99,102,241,.35)"}
                onMouseLeave={e=>e.currentTarget.style.borderColor="#162438"}>
                <div style={{ display:"flex",alignItems:"flex-start",gap:12 }}>
                  <div style={{ width:46,height:46,borderRadius:14,background:"rgba(99,102,241,.12)",border:"1px solid rgba(99,102,241,.25)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:16,flexShrink:0 }}>
                    {a.name.split(" ").map(x=>x[0]).join("")}
                  </div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontWeight:800,fontSize:15 }}>{a.name}</div>
                    <div style={{ color:"#4d6a8a",fontSize:12,marginTop:2 }}>{a.sport} · {a.position}</div>
                  </div>
                  <button onClick={() => onToggleSave(a.id)}
                    style={{ background:"none",border:"none",fontSize:18,cursor:"pointer",color:isSaved?"#fbbf24":"#334155",flexShrink:0 }}>
                    {isSaved ? "★" : "☆"}
                  </button>
                </div>

                <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                  {[`GPA ${a.gpa}`, a.height, `Grad ${a.gradYear}`].map(t => (
                    <span key={t} style={{ fontSize:11,fontWeight:700,padding:"3px 8px",borderRadius:999,border:"1px solid #22304a",background:"rgba(255,255,255,.04)",color:"#4d6a8a" }}>{t}</span>
                  ))}
                </div>

                <p style={{ color:"#4d6a8a",fontSize:12,lineHeight:1.5,margin:0,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden" }}>{a.bio}</p>

                <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:"auto" }}>
                  <StatusBadge status={st} />
                  <button onClick={() => onViewAthlete(a)}
                    style={{ background:"rgba(99,102,241,.1)",border:"1px solid rgba(99,102,241,.25)",color:"#c7d2fe",borderRadius:9,padding:"6px 12px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>
                    View Profile →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PAGE: SAVED
// ═══════════════════════════════════════════════════════════════
function PageSaved({ athletes, statuses, savedIds, onViewAthlete, onToggleSave }) {
  const saved = athletes.filter(a => savedIds.includes(a.id));
  return (
    <div style={{ padding:"0 32px 40px" }}>
      <div style={{ padding:"28px 0 20px" }}>
        <h2 style={{ fontWeight:800,fontSize:24,margin:0 }}>Saved Athletes</h2>
        <p style={{ color:"#4d6a8a",fontSize:14,marginTop:4 }}>{saved.length} athlete{saved.length!==1?"s":""} saved</p>
      </div>
      {saved.length === 0 ? (
        <div style={{ textAlign:"center",padding:"80px 0",color:"#4d6a8a" }}>
          <div style={{ fontSize:48,marginBottom:16 }}>☆</div>
          <div style={{ fontWeight:700,fontSize:16 }}>No saved athletes yet</div>
          <div style={{ marginTop:8,fontSize:14 }}>Star athletes in Discover to save them here</div>
        </div>
      ) : (
        <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
          {saved.map(a => {
            const st = statuses[a.id] || "none";
            return (
              <div key={a.id} style={{ display:"flex",alignItems:"center",gap:16,background:"rgba(10,21,37,.9)",border:"1px solid #22304a",borderRadius:16,padding:"16px 20px" }}>
                <div style={{ width:46,height:46,borderRadius:14,background:"rgba(99,102,241,.12)",border:"1px solid rgba(99,102,241,.25)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:16,flexShrink:0 }}>
                  {a.name.split(" ").map(x=>x[0]).join("")}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:800,fontSize:15 }}>{a.name}</div>
                  <div style={{ color:"#4d6a8a",fontSize:13,marginTop:2 }}>{a.sport} · {a.position} · {a.location}</div>
                </div>
                <StatusBadge status={st} />
                <button onClick={() => onToggleSave(a.id)}
                  style={{ background:"rgba(245,158,11,.1)",border:"1px solid rgba(245,158,11,.3)",color:"#fbbf24",borderRadius:9,padding:"6px 12px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>
                  ★ Remove
                </button>
                <button onClick={() => onViewAthlete(a)}
                  style={{ background:"rgba(99,102,241,.1)",border:"1px solid rgba(99,102,241,.25)",color:"#c7d2fe",borderRadius:9,padding:"6px 12px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>
                  View Profile →
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PAGE: MESSAGES (draft UI)
// ═══════════════════════════════════════════════════════════════
function PageMessages({ athletes }) {
  const [selected, setSelected] = useState(athletes[0]);
  const [input, setInput]       = useState("");
  const [threads, setThreads]   = useState({
    1: [{ from:"scout", text:"Hi Devin, I watched your highlight reel — impressive saves. Would love to connect.", time:"2:14 PM" }],
    2: [{ from:"scout", text:"Marcus, your court vision is exceptional. Are you open to a conversation?", time:"Yesterday" }],
  });

  function send() {
    if (!input.trim()) return;
    const msg = { from:"scout", text:input, time:"Just now" };
    setThreads(t => ({ ...t, [selected.id]: [...(t[selected.id]||[]), msg] }));
    setInput("");
  }

  const msgs = threads[selected?.id] || [];

  return (
    <div style={{ display:"flex",height:"calc(100vh - 0px)",padding:"24px 32px 32px",gap:16 }}>
      {/* Thread list */}
      <div style={{ width:240,flexShrink:0,display:"flex",flexDirection:"column",gap:8 }}>
        <div style={{ fontWeight:800,fontSize:16,marginBottom:8 }}>Messages</div>
        {athletes.slice(0,5).map(a => (
          <div key={a.id} onClick={() => setSelected(a)}
            style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:12,cursor:"pointer",background:selected?.id===a.id?"rgba(99,102,241,.12)":"rgba(255,255,255,.03)",border:`1px solid ${selected?.id===a.id?"rgba(99,102,241,.25)":"#0f1e30"}`,transition:"all .15s" }}>
            <div style={{ width:34,height:34,borderRadius:10,background:"rgba(99,102,241,.12)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12,flexShrink:0 }}>
              {a.name.split(" ").map(x=>x[0]).join("")}
            </div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontWeight:700,fontSize:13 }}>{a.name}</div>
              <div style={{ color:"#4d6a8a",fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                {(threads[a.id]||[]).length > 0 ? threads[a.id].slice(-1)[0].text.slice(0,30)+"…" : "No messages yet"}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chat area */}
      <div style={{ flex:1,display:"flex",flexDirection:"column",background:"rgba(10,21,37,.85)",border:"1px solid #22304a",borderRadius:18,overflow:"hidden" }}>
        <div style={{ padding:"14px 18px",borderBottom:"1px solid #22304a",display:"flex",alignItems:"center",gap:12 }}>
          <div style={{ width:36,height:36,borderRadius:10,background:"rgba(99,102,241,.12)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13 }}>
            {selected?.name.split(" ").map(x=>x[0]).join("")}
          </div>
          <div>
            <div style={{ fontWeight:800 }}>{selected?.name}</div>
            <div style={{ color:"#4d6a8a",fontSize:12 }}>{selected?.sport} · {selected?.position}</div>
          </div>
        </div>
        <div style={{ flex:1,padding:16,display:"flex",flexDirection:"column",gap:10,overflowY:"auto",justifyContent:msgs.length===0?"center":"flex-end" }}>
          {msgs.length === 0 && <div style={{ textAlign:"center",color:"#4d6a8a",fontSize:14 }}>No messages yet. Say hello!</div>}
          {msgs.map((m, i) => (
            <div key={i} style={{ alignSelf:"flex-end",maxWidth:"70%",background:"rgba(99,102,241,.15)",border:"1px solid rgba(99,102,241,.25)",borderRadius:"14px 14px 4px 14px",padding:"10px 14px" }}>
              <div style={{ fontSize:14,lineHeight:1.5 }}>{m.text}</div>
              <div style={{ color:"#4d6a8a",fontSize:11,marginTop:4,textAlign:"right" }}>{m.time}</div>
            </div>
          ))}
        </div>
        <div style={{ padding:12,borderTop:"1px solid #22304a",display:"flex",gap:10 }}>
          <input value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&send()}
            placeholder={`Message ${selected?.name}…`}
            style={{ flex:1,background:"rgba(255,255,255,.05)",border:"1px solid #22304a",borderRadius:10,color:"#f0f6ff",fontSize:14,padding:"10px 14px",fontFamily:"inherit",outline:"none" }} />
          <button onClick={send}
            style={{ background:"linear-gradient(135deg,#4f46e5,#6366f1)",border:"none",color:"#fff",borderRadius:10,padding:"10px 18px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit" }}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PAGE: SETTINGS
// ═══════════════════════════════════════════════════════════════
function PageSettings({ user }) {
  const [name,  setName]  = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [saved, setSaved] = useState(false);

  const notifs = [
    { label: "New athlete profiles",     desc: "Get notified when new athletes join" },
    { label: "Message replies",          desc: "When an athlete responds to your message" },
    { label: "Weekly digest",            desc: "Summary of your scouting activity" },
    { label: "Profile status reminders", desc: "Remind you to update athlete statuses" },
  ];
  const [notifStates, setNotifStates] = useState({ 0:true, 1:true, 2:false, 3:false });

  function save(e) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div style={{ padding:"0 32px 40px",maxWidth:640 }}>
      <div style={{ padding:"28px 0 20px" }}>
        <h2 style={{ fontWeight:800,fontSize:24,margin:0 }}>Settings</h2>
        <p style={{ color:"#4d6a8a",fontSize:14,marginTop:4 }}>Manage your account and preferences</p>
      </div>

      {saved && (
        <div style={{ background:"rgba(34,197,94,.12)",border:"1px solid rgba(34,197,94,.3)",borderRadius:12,padding:"12px 16px",color:"#86efac",fontWeight:700,fontSize:14,marginBottom:16 }}>
          ✓ Settings saved!
        </div>
      )}

      {/* Profile section */}
      <div style={{ background:"rgba(10,21,37,.85)",border:"1px solid #22304a",borderRadius:18,padding:24,marginBottom:16 }}>
        <div style={{ fontWeight:800,fontSize:15,marginBottom:18 }}>Profile</div>
        <form onSubmit={save} style={{ display:"flex",flexDirection:"column",gap:14 }}>
          <div>
            <label style={{ color:"#4d6a8a",fontSize:13,fontWeight:700,display:"block",marginBottom:6 }}>Full Name</label>
            <input value={name} onChange={e=>setName(e.target.value)}
              style={{ width:"100%",background:"rgba(255,255,255,.04)",border:"1px solid #22304a",borderRadius:10,color:"#f0f6ff",fontSize:14,padding:"10px 14px",fontFamily:"inherit",outline:"none",boxSizing:"border-box" }} />
          </div>
          <div>
            <label style={{ color:"#4d6a8a",fontSize:13,fontWeight:700,display:"block",marginBottom:6 }}>Email</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} type="email"
              style={{ width:"100%",background:"rgba(255,255,255,.04)",border:"1px solid #22304a",borderRadius:10,color:"#f0f6ff",fontSize:14,padding:"10px 14px",fontFamily:"inherit",outline:"none",boxSizing:"border-box" }} />
          </div>
          <div>
            <label style={{ color:"#4d6a8a",fontSize:13,fontWeight:700,display:"block",marginBottom:6 }}>Organization / Team</label>
            <input placeholder="e.g. Toronto FC Academy"
              style={{ width:"100%",background:"rgba(255,255,255,.04)",border:"1px solid #22304a",borderRadius:10,color:"#f0f6ff",fontSize:14,padding:"10px 14px",fontFamily:"inherit",outline:"none",boxSizing:"border-box" }} />
          </div>
          <button type="submit"
            style={{ alignSelf:"flex-start",background:"linear-gradient(135deg,#4f46e5,#6366f1)",border:"none",color:"#fff",borderRadius:10,padding:"10px 20px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit" }}>
            Save Changes
          </button>
        </form>
      </div>

      {/* Notifications */}
      <div style={{ background:"rgba(10,21,37,.85)",border:"1px solid #22304a",borderRadius:18,padding:24 }}>
        <div style={{ fontWeight:800,fontSize:15,marginBottom:18 }}>Notifications</div>
        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          {notifs.map((n, i) => (
            <div key={i} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",gap:16 }}>
              <div>
                <div style={{ fontWeight:700,fontSize:14 }}>{n.label}</div>
                <div style={{ color:"#4d6a8a",fontSize:12,marginTop:2 }}>{n.desc}</div>
              </div>
              <button onClick={() => setNotifStates(s => ({ ...s, [i]: !s[i] }))}
                style={{ width:44,height:24,borderRadius:999,border:"none",background:notifStates[i]?"#4f46e5":"#1e2d45",cursor:"pointer",position:"relative",flexShrink:0,transition:"background .2s" }}>
                <span style={{ position:"absolute",top:3,left:notifStates[i]?22:3,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left .2s",display:"block" }} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ATHLETE DASHBOARD — view & manage own profile
// ═══════════════════════════════════════════════════════════════
function AthleteDashboard({ profile }) {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const st = profile;

  return (
    <div style={{ minHeight:"100vh", background:"#080e1a", color:"#f0f6ff", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500&display=swap'); *{box-sizing:border-box;}`}</style>

      <header style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 32px",borderBottom:"1px solid #162438",background:"rgba(8,14,26,.95)",backdropFilter:"blur(10px)",position:"sticky",top:0,zIndex:10 }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:34,height:34,borderRadius:10,background:"rgba(99,102,241,.15)",border:"1px solid rgba(99,102,241,.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16 }}>⚽</div>
          <span style={{ fontWeight:800,fontSize:15,letterSpacing:"-.02em" }}>ScoutLinkz</span>
          <span style={{ fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:999,background:"rgba(99,102,241,.12)",border:"1px solid rgba(99,102,241,.25)",color:"#c7d2fe",marginLeft:4 }}>Athlete</span>
        </div>
        <button onClick={async()=>{setLoggingOut(true);await logout();}} disabled={loggingOut}
          style={{ background:"rgba(239,68,68,.07)",border:"1px solid rgba(239,68,68,.18)",color:"#f87171",borderRadius:8,padding:"7px 14px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
          {loggingOut?"…":"Sign out"}
        </button>
      </header>

      <main style={{ maxWidth:800, margin:"0 auto", padding:"32px 24px" }}>
        {/* Profile card */}
        <div style={{ background:"rgba(10,21,37,.9)",border:"1px solid #162438",borderRadius:20,padding:28,marginBottom:20 }}>
          <div style={{ display:"flex",alignItems:"flex-start",gap:16,marginBottom:18 }}>
            <div style={{ width:64,height:64,borderRadius:18,background:"rgba(99,102,241,.15)",border:"1px solid rgba(99,102,241,.3)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:22 }}>
              {st.name?.split(" ").map(x=>x[0]).join("") || "?"}
            </div>
            <div>
              <div style={{ fontWeight:800,fontSize:22,letterSpacing:"-.03em" }}>{st.name}</div>
              <div style={{ color:"#4d6a8a",fontSize:14,marginTop:4 }}>{st.sport} · {st.position} · Grad {st.gradYear} · {st.location}</div>
              <div style={{ display:"flex",gap:8,marginTop:10,flexWrap:"wrap" }}>
                {[`GPA ${st.gpa}`,st.height,st.weight,`${st.foot} foot`].filter(Boolean).map(t=>(
                  <span key={t} style={{ fontSize:12,fontWeight:600,padding:"3px 10px",borderRadius:999,border:"1px solid #162438",background:"rgba(255,255,255,.04)",color:"#4d6a8a" }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
          <p style={{ color:"#4d6a8a",lineHeight:1.6,margin:0,fontFamily:"'DM Sans',sans-serif" }}>{st.bio}</p>
        </div>

        {/* Stats */}
        {st.stats?.length > 0 && (
          <div style={{ background:"rgba(10,21,37,.9)",border:"1px solid #162438",borderRadius:18,padding:22,marginBottom:20 }}>
            <div style={{ fontWeight:800,fontSize:15,marginBottom:14,letterSpacing:"-.02em" }}>Your Stats</div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10 }}>
              {st.stats.map((s,i)=>(
                <div key={i} style={{ background:"rgba(255,255,255,.04)",border:"1px solid #162438",borderRadius:12,padding:14 }}>
                  <div style={{ fontWeight:800,fontSize:20 }}>{s.value}</div>
                  <div style={{ color:"#4d6a8a",fontSize:12,marginTop:3 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status banner */}
        <div style={{ background:"rgba(99,102,241,.07)",border:"1px dashed rgba(99,102,241,.25)",borderRadius:16,padding:"18px 22px",display:"flex",alignItems:"center",gap:16 }}>
          <span style={{ fontSize:28 }}>🎯</span>
          <div>
            <div style={{ fontWeight:700,fontSize:14,color:"#c7d2fe" }}>Your profile is live</div>
            <div style={{ color:"#4d6a8a",fontSize:13,marginTop:3,fontFamily:"'DM Sans',sans-serif" }}>Scouts can now discover and contact you. Profile editing coming soon.</div>
          </div>
        </div>
      </main>
    </div>
  );
}


function ScoutDashboard() {
  const { user, logout } = useAuth();
  const [page, setPage]         = useState("dashboard");
  const [viewingAthlete, setViewingAthlete] = useState(null);
  const [statuses, setStatuses] = useState({});
  const [savedIds, setSavedIds] = useState([]);
  const [loggingOut, setLoggingOut] = useState(false);
  const [search, setSearch]     = useState("");
  const [athletes, setAthletes] = useState(ATHLETES);
  const [dbLoading, setDbLoading] = useState(true);

  // Load real athletes from Firestore, fall back to demo data
  useEffect(() => {
    fetchAthletes()
      .then(dbAthletes => {
        const mapped = dbAthletes.map(a => ({ ...a, id: a.uid || a.id }));
        setAthletes(mapped.length > 0 ? [...mapped, ...ATHLETES] : ATHLETES);
      })
      .catch(() => setAthletes(ATHLETES))
      .finally(() => setDbLoading(false));
  }, []);

  // Load scout's persistent data from Firestore
  useEffect(() => {
    if (!user) return;
    fetchScoutData(user.uid).then(data => {
      if (data.savedIds) setSavedIds(data.savedIds);
      if (data.statuses) setStatuses(data.statuses);
    }).catch(() => {});
  }, [user]);

  async function persist(newSaved, newStatuses) {
    if (!user) return;
    try { await saveScoutData(user.uid, { savedIds: newSaved, statuses: newStatuses }); } catch {}
  }

  function handleStatusChange(id, val) {
    const next = { ...statuses, [id]: val };
    setStatuses(next);
    persist(savedIds, next);
  }
  function handleToggleSave(id) {
    const next = savedIds.includes(id) ? savedIds.filter(x=>x!==id) : [...savedIds, id];
    setSavedIds(next);
    persist(next, statuses);
  }
  function handleViewAthlete(a) {
    setViewingAthlete(a);
    setPage("profile");
  }
  function handleBack() {
    setViewingAthlete(null);
    setPage("dashboard");
  }
  async function handleLogout() {
    setLoggingOut(true);
    await logout();
  }

  const NAV = [
    { key:"dashboard", icon:"⊞", label:"Dashboard" },
    { key:"discover",  icon:"🔍", label:"Discover"  },
    { key:"saved",     icon:"★",  label:"Saved"     },
    { key:"messages",  icon:"✉",  label:"Messages"  },
    { key:"settings",  icon:"⚙",  label:"Settings"  },
  ];

  const pageTitles = { dashboard:"Dashboard", discover:"Discover", saved:"Saved", messages:"Messages", settings:"Settings", profile: viewingAthlete?.name };

  const searchFiltered = search
    ? athletes.filter(a => a.name?.toLowerCase().includes(search.toLowerCase()) || a.sport?.toLowerCase().includes(search.toLowerCase()) || a.position?.toLowerCase().includes(search.toLowerCase()))
    : [];

  return (
    <div style={{ minHeight:"100vh",display:"flex",background:"#080e1a",color:"#f0f6ff",fontFamily:"'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif" }}>
      <style>{dashStyles}</style>

      {/* Sidebar */}
      <aside style={{ width:220,background:"#0a1525",borderRight:"1px solid #162438",display:"flex",flexDirection:"column",padding:"24px 0",position:"sticky",top:0,height:"100vh",flexShrink:0 }}>
        <div style={{ display:"flex",alignItems:"center",gap:10,padding:"0 20px",marginBottom:32 }}>
          <div style={{ width:36,height:36,borderRadius:10,background:"rgba(99,102,241,.15)",border:"1px solid rgba(99,102,241,.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18 }}>⚽</div>
          <span style={{ fontWeight:800,fontSize:16,letterSpacing:"-.02em" }}>ScoutLinkz</span>
        </div>

        <nav style={{ display:"flex",flexDirection:"column",gap:4,flex:1,padding:"0 12px" }}>
          {NAV.map(item => {
            const active = page === item.key || (page === "profile" && item.key === "discover");
            return (
              <div key={item.key} onClick={() => { setPage(item.key); setViewingAthlete(null); setSearch(""); }}
                style={{ display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:10,cursor:"pointer",color:active?"#c7d2fe":"#4d6a8a",fontSize:14,fontWeight:active?700:500,background:active?"rgba(99,102,241,.12)":"transparent",border:active?"1px solid rgba(99,102,241,.2)":"1px solid transparent",transition:"all .15s",letterSpacing:"-.01em" }}>
                <span style={{ fontSize:16,width:22,textAlign:"center" }}>{item.icon}</span>
                {item.label}
                {item.key === "saved" && savedIds.length > 0 && (
                  <span style={{ marginLeft:"auto",background:"rgba(99,102,241,.25)",color:"#c7d2fe",fontSize:11,fontWeight:700,borderRadius:999,padding:"1px 7px" }}>{savedIds.length}</span>
                )}
              </div>
            );
          })}
        </nav>

        <div style={{ padding:"16px 16px 0",borderTop:"1px solid #162438",marginTop:16 }}>
          <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:12 }}>
            <div style={{ width:34,height:34,borderRadius:10,background:"rgba(99,102,241,.15)",border:"1px solid rgba(99,102,241,.25)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:14 }}>
              {(user?.displayName?.[0] || user?.email?.[0] || "S").toUpperCase()}
            </div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontWeight:700,fontSize:13,color:"#f0f6ff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",letterSpacing:"-.01em" }}>{user?.displayName || "Scout"}</div>
              <div style={{ color:"#4d6a8a",fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{user?.email}</div>
            </div>
          </div>
          <button onClick={handleLogout} disabled={loggingOut}
            style={{ width:"100%",padding:"8px 0",borderRadius:9,background:"rgba(239,68,68,.07)",border:"1px solid rgba(239,68,68,.18)",color:"#f87171",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit",letterSpacing:"-.01em" }}>
            {loggingOut ? "…" : "Sign out"}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex:1,display:"flex",flexDirection:"column",overflow:"auto" }}>
        {/* Topbar */}
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 32px",borderBottom:"1px solid #162438",position:"sticky",top:0,background:"rgba(8,14,26,.95)",backdropFilter:"blur(10px)",zIndex:10 }}>
          <div style={{ fontWeight:800,fontSize:17,letterSpacing:"-.025em" }}>
            {page === "profile" ? (
              <span style={{ display:"flex",alignItems:"center",gap:8 }}>
                <button onClick={handleBack} style={{ background:"none",border:"none",color:"#4d6a8a",cursor:"pointer",fontSize:16,padding:0 }}>←</button>
                {viewingAthlete?.name}
              </span>
            ) : pageTitles[page]}
          </div>
          <div style={{ position:"relative" }}>
            <div style={{ display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,.04)",border:"1px solid #1e3352",borderRadius:10,padding:"8px 14px" }}>
              <span style={{ opacity:.4,fontSize:14 }}>🔍</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Quick search…"
                style={{ background:"none",border:"none",outline:"none",color:"#f0f6ff",fontSize:14,fontFamily:"'DM Sans',inherit",width:180 }} />
              {search && <button onClick={()=>setSearch("")} style={{ background:"none",border:"none",color:"#4d6a8a",cursor:"pointer",fontSize:16,padding:0 }}>×</button>}
            </div>
            {search && searchFiltered.length > 0 && (
              <div style={{ position:"absolute",top:"calc(100% + 8px)",right:0,background:"#0a1525",border:"1px solid #22304a",borderRadius:14,overflow:"hidden",minWidth:260,boxShadow:"0 12px 40px rgba(0,0,0,.5)",zIndex:100 }}>
                {searchFiltered.map(a => (
                  <div key={a.id} onClick={() => { handleViewAthlete(a); setSearch(""); }}
                    style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 14px",cursor:"pointer",borderBottom:"1px solid #1a2740" }}
                    onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.05)"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <div style={{ width:30,height:30,borderRadius:8,background:"rgba(99,102,241,.12)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:11,flexShrink:0 }}>
                      {a.name.split(" ").map(x=>x[0]).join("")}
                    </div>
                    <div>
                      <div style={{ fontWeight:700,fontSize:13 }}>{a.name}</div>
                      <div style={{ color:"#4d6a8a",fontSize:11 }}>{a.sport} · {a.position}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Page content */}
        {page === "dashboard" && <PageDashboard athletes={athletes} statuses={statuses} savedIds={savedIds} onViewAthlete={handleViewAthlete} />}
        {page === "discover"  && <PageDiscover  athletes={athletes} statuses={statuses} savedIds={savedIds} onViewAthlete={handleViewAthlete} onToggleSave={handleToggleSave} />}
        {page === "saved"     && <PageSaved     athletes={athletes} statuses={statuses} savedIds={savedIds} onViewAthlete={handleViewAthlete} onToggleSave={handleToggleSave} />}
        {page === "messages"  && <PageMessages  athletes={athletes} />}
        {page === "settings"  && <PageSettings  user={user} />}
        {page === "profile"   && viewingAthlete && (
          <AthleteProfile athlete={viewingAthlete} statuses={statuses} savedIds={savedIds}
            onStatusChange={handleStatusChange} onToggleSave={handleToggleSave} onBack={handleBack} />
        )}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ATHLETE PROFILE CREATION FORM (multi-step)
// ═══════════════════════════════════════════════════════════════
const SPORTS = ["Soccer","Basketball","Track & Field","Football","Baseball","Volleyball","Swimming","Tennis","Lacrosse","Other"];
const POSITIONS = {
  Soccer: ["Goalkeeper","Center Back","Full Back","Defensive Mid","Central Mid","Attacking Mid","Winger","Striker"],
  Basketball: ["Point Guard","Shooting Guard","Small Forward","Power Forward","Center"],
  "Track & Field": ["Sprinter","Middle Distance","Long Distance","Jumper","Thrower","Multi-event"],
  Football: ["QB","RB","WR","TE","OL","DL","LB","CB","Safety","K/P"],
};

function AthleteProfileSetup() {
  const { user, logout } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const [form, setForm] = useState({
    name: user?.displayName || "",
    sport: "", position: "", gradYear: new Date().getFullYear() + 1,
    location: "", height: "", weight: "", foot: "Right", gpa: "",
    bio: "",
    stats: [
      { label: "", value: "" }, { label: "", value: "" },
      { label: "", value: "" }, { label: "", value: "" },
    ],
    highlights: [{ title: "", videoId: "" }, { title: "", videoId: "" }, { title: "", videoId: "" }],
    email: user?.email || "", phone: "",
  });

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  function extractVideoId(url) {
    const m = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : url;
  }

  async function handleSubmit() {
    if (!form.name || !form.sport || !form.position) { setError("Please fill in name, sport, and position."); return; }
    setSaving(true); setError("");
    try {
      await setDoc(doc(db, "athletes", user.uid), {
        ...form,
        highlights: form.highlights
          .filter(h => h.title && (h.videoId || h.videoId === ""))
          .map(h => ({ ...h, videoId: extractVideoId(h.videoId) })),
        stats: form.stats.filter(s => s.label && s.value),
        uid: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      // Reload page so role detection fires again
      window.location.reload();
    } catch (e) {
      setError("Failed to save. Please try again.");
      setSaving(false);
    }
  }

  const steps = ["Basic Info", "Stats", "Highlights", "Contact"];
  const positions = POSITIONS[form.sport] || [];

  return (
    <div style={{ minHeight:"100vh", background:"#080e1a", color:"#f0f6ff", fontFamily:"'Plus Jakarta Sans',sans-serif", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-start", padding:"40px 20px 80px" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500&display=swap'); *{box-sizing:border-box;}`}</style>

      {/* Header */}
      <div style={{ width:"100%", maxWidth:580, marginBottom:32 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:36,height:36,borderRadius:10,background:"rgba(99,102,241,.15)",border:"1px solid rgba(99,102,241,.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18 }}>⚽</div>
            <span style={{ fontWeight:800, fontSize:16, letterSpacing:"-.02em" }}>ScoutLinkz</span>
          </div>
          <button onClick={logout} style={{ background:"none",border:"1px solid #162438",color:"#4d6a8a",borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>Sign out</button>
        </div>
        <h1 style={{ fontWeight:800, fontSize:26, letterSpacing:"-.03em", margin:"0 0 6px" }}>Build your athlete profile</h1>
        <p style={{ color:"#4d6a8a", fontSize:14, margin:0, fontFamily:"'DM Sans',sans-serif" }}>Scouts will discover you based on this — make it count.</p>

        {/* Step progress */}
        <div style={{ display:"flex", gap:8, marginTop:24 }}>
          {steps.map((label, i) => (
            <div key={i} style={{ flex:1 }}>
              <div style={{ height:3, borderRadius:2, background: i < step ? "linear-gradient(90deg,#6366f1,#818cf8)" : i === step-1 ? "linear-gradient(90deg,#6366f1,#818cf8)" : "#162438", marginBottom:6, transition:"background .3s" }} />
              <div style={{ fontSize:11, fontWeight:600, color: i === step-1 ? "#c7d2fe" : i < step ? "#818cf8" : "#4d6a8a" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Card */}
      <div style={{ width:"100%", maxWidth:580, background:"rgba(10,21,37,.9)", border:"1px solid #162438", borderRadius:20, padding:32, boxShadow:"0 24px 60px rgba(0,0,0,.4)" }}>
        {error && <div style={{ background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.25)",borderRadius:10,padding:"12px 16px",color:"#fca5a5",fontSize:14,marginBottom:20 }}>{error}</div>}

        {/* ── STEP 1: Basic Info ── */}
        {step === 1 && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <h2 style={{ fontWeight:800, fontSize:18, margin:"0 0 4px", letterSpacing:"-.02em" }}>Basic Info</h2>
            {[
              { label:"Full Name", key:"name", type:"text", placeholder:"Devin Smith" },
              { label:"Location", key:"location", type:"text", placeholder:"Toronto, ON" },
            ].map(f => (
              <div key={f.key}>
                <label style={{ color:"#4d6a8a",fontSize:12,fontWeight:600,letterSpacing:".05em",textTransform:"uppercase",display:"block",marginBottom:6 }}>{f.label}</label>
                <input value={form[f.key]} onChange={e => set(f.key, e.target.value)} type={f.type} placeholder={f.placeholder}
                  style={{ width:"100%",background:"rgba(255,255,255,.05)",border:"1px solid #1e3352",borderRadius:10,color:"#f0f6ff",fontSize:15,padding:"11px 14px",fontFamily:"'DM Sans',sans-serif",outline:"none" }} />
              </div>
            ))}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div>
                <label style={{ color:"#4d6a8a",fontSize:12,fontWeight:600,letterSpacing:".05em",textTransform:"uppercase",display:"block",marginBottom:6 }}>Sport</label>
                <select value={form.sport} onChange={e => { set("sport", e.target.value); set("position",""); }}
                  style={{ width:"100%",background:"#0a1525",border:"1px solid #1e3352",borderRadius:10,color: form.sport?"#f0f6ff":"#4d6a8a",fontSize:14,padding:"11px 14px",fontFamily:"'DM Sans',sans-serif",outline:"none" }}>
                  <option value="">Select sport…</option>
                  {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color:"#4d6a8a",fontSize:12,fontWeight:600,letterSpacing:".05em",textTransform:"uppercase",display:"block",marginBottom:6 }}>Position</label>
                <select value={form.position} onChange={e => set("position", e.target.value)}
                  style={{ width:"100%",background:"#0a1525",border:"1px solid #1e3352",borderRadius:10,color:form.position?"#f0f6ff":"#4d6a8a",fontSize:14,padding:"11px 14px",fontFamily:"'DM Sans',sans-serif",outline:"none" }}>
                  <option value="">Select position…</option>
                  {(positions.length ? positions : []).map(p => <option key={p} value={p}>{p}</option>)}
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label style={{ color:"#4d6a8a",fontSize:12,fontWeight:600,letterSpacing:".05em",textTransform:"uppercase",display:"block",marginBottom:6 }}>Grad Year</label>
                <select value={form.gradYear} onChange={e => set("gradYear", Number(e.target.value))}
                  style={{ width:"100%",background:"#0a1525",border:"1px solid #1e3352",borderRadius:10,color:"#f0f6ff",fontSize:14,padding:"11px 14px",fontFamily:"'DM Sans',sans-serif",outline:"none" }}>
                  {[2025,2026,2027,2028,2029].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color:"#4d6a8a",fontSize:12,fontWeight:600,letterSpacing:".05em",textTransform:"uppercase",display:"block",marginBottom:6 }}>GPA</label>
                <input value={form.gpa} onChange={e => set("gpa", e.target.value)} placeholder="3.7" type="number" min="0" max="4" step="0.1"
                  style={{ width:"100%",background:"rgba(255,255,255,.05)",border:"1px solid #1e3352",borderRadius:10,color:"#f0f6ff",fontSize:15,padding:"11px 14px",fontFamily:"'DM Sans',sans-serif",outline:"none" }} />
              </div>
              <div>
                <label style={{ color:"#4d6a8a",fontSize:12,fontWeight:600,letterSpacing:".05em",textTransform:"uppercase",display:"block",marginBottom:6 }}>Height</label>
                <input value={form.height} onChange={e => set("height", e.target.value)} placeholder='6&apos;1"'
                  style={{ width:"100%",background:"rgba(255,255,255,.05)",border:"1px solid #1e3352",borderRadius:10,color:"#f0f6ff",fontSize:15,padding:"11px 14px",fontFamily:"'DM Sans',sans-serif",outline:"none" }} />
              </div>
              <div>
                <label style={{ color:"#4d6a8a",fontSize:12,fontWeight:600,letterSpacing:".05em",textTransform:"uppercase",display:"block",marginBottom:6 }}>Weight (lbs)</label>
                <input value={form.weight} onChange={e => set("weight", e.target.value)} placeholder="185"
                  style={{ width:"100%",background:"rgba(255,255,255,.05)",border:"1px solid #1e3352",borderRadius:10,color:"#f0f6ff",fontSize:15,padding:"11px 14px",fontFamily:"'DM Sans',sans-serif",outline:"none" }} />
              </div>
            </div>
            <div>
              <label style={{ color:"#4d6a8a",fontSize:12,fontWeight:600,letterSpacing:".05em",textTransform:"uppercase",display:"block",marginBottom:6 }}>Bio</label>
              <textarea value={form.bio} onChange={e => set("bio", e.target.value)} rows={3}
                placeholder="Describe your game, strengths, and what makes you stand out…"
                style={{ width:"100%",background:"rgba(255,255,255,.05)",border:"1px solid #1e3352",borderRadius:10,color:"#f0f6ff",fontSize:14,padding:"11px 14px",fontFamily:"'DM Sans',sans-serif",outline:"none",resize:"vertical",lineHeight:1.6 }} />
            </div>
          </div>
        )}

        {/* ── STEP 2: Stats ── */}
        {step === 2 && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div>
              <h2 style={{ fontWeight:800, fontSize:18, margin:"0 0 4px", letterSpacing:"-.02em" }}>Key Stats</h2>
              <p style={{ color:"#4d6a8a", fontSize:13, margin:0, fontFamily:"'DM Sans',sans-serif" }}>Add up to 4 stats that best represent your performance.</p>
            </div>
            {form.stats.map((stat, i) => (
              <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div>
                  <label style={{ color:"#4d6a8a",fontSize:12,fontWeight:600,letterSpacing:".05em",textTransform:"uppercase",display:"block",marginBottom:6 }}>Stat {i+1} Label</label>
                  <input value={stat.label} onChange={e => { const s=[...form.stats]; s[i]={...s[i],label:e.target.value}; set("stats",s); }}
                    placeholder={["Goals","Save %","PPG","100m Time"][i] || "e.g. Assists"}
                    style={{ width:"100%",background:"rgba(255,255,255,.05)",border:"1px solid #1e3352",borderRadius:10,color:"#f0f6ff",fontSize:14,padding:"11px 14px",fontFamily:"'DM Sans',sans-serif",outline:"none" }} />
                </div>
                <div>
                  <label style={{ color:"#4d6a8a",fontSize:12,fontWeight:600,letterSpacing:".05em",textTransform:"uppercase",display:"block",marginBottom:6 }}>Value</label>
                  <input value={stat.value} onChange={e => { const s=[...form.stats]; s[i]={...s[i],value:e.target.value}; set("stats",s); }}
                    placeholder={["12","78%","18.4","10.8s"][i] || "e.g. 9"}
                    style={{ width:"100%",background:"rgba(255,255,255,.05)",border:"1px solid #1e3352",borderRadius:10,color:"#f0f6ff",fontSize:14,padding:"11px 14px",fontFamily:"'DM Sans',sans-serif",outline:"none" }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── STEP 3: Highlights ── */}
        {step === 3 && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div>
              <h2 style={{ fontWeight:800, fontSize:18, margin:"0 0 4px", letterSpacing:"-.02em" }}>Highlight Videos</h2>
              <p style={{ color:"#4d6a8a", fontSize:13, margin:0, fontFamily:"'DM Sans',sans-serif" }}>Paste YouTube URLs — scouts can watch directly from your profile.</p>
            </div>
            {form.highlights.map((h, i) => (
              <div key={i} style={{ background:"rgba(255,255,255,.03)", border:"1px solid #162438", borderRadius:12, padding:16, display:"flex", flexDirection:"column", gap:10 }}>
                <div style={{ fontWeight:700, fontSize:13, color:"#c7d2fe" }}>Clip {i+1} {i === 0 ? "(Main highlight reel)" : ""}</div>
                <div>
                  <label style={{ color:"#4d6a8a",fontSize:12,fontWeight:600,letterSpacing:".05em",textTransform:"uppercase",display:"block",marginBottom:6 }}>Title</label>
                  <input value={h.title} onChange={e => { const hs=[...form.highlights]; hs[i]={...hs[i],title:e.target.value}; set("highlights",hs); }}
                    placeholder="e.g. Top Saves 2025"
                    style={{ width:"100%",background:"rgba(255,255,255,.05)",border:"1px solid #1e3352",borderRadius:10,color:"#f0f6ff",fontSize:14,padding:"11px 14px",fontFamily:"'DM Sans',sans-serif",outline:"none" }} />
                </div>
                <div>
                  <label style={{ color:"#4d6a8a",fontSize:12,fontWeight:600,letterSpacing:".05em",textTransform:"uppercase",display:"block",marginBottom:6 }}>YouTube URL or Video ID</label>
                  <input value={h.videoId} onChange={e => { const hs=[...form.highlights]; hs[i]={...hs[i],videoId:e.target.value}; set("highlights",hs); }}
                    placeholder="https://youtube.com/watch?v=... or video ID"
                    style={{ width:"100%",background:"rgba(255,255,255,.05)",border:"1px solid #1e3352",borderRadius:10,color:"#f0f6ff",fontSize:14,padding:"11px 14px",fontFamily:"'DM Sans',sans-serif",outline:"none" }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── STEP 4: Contact ── */}
        {step === 4 && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div>
              <h2 style={{ fontWeight:800, fontSize:18, margin:"0 0 4px", letterSpacing:"-.02em" }}>Contact Info</h2>
              <p style={{ color:"#4d6a8a", fontSize:13, margin:0, fontFamily:"'DM Sans',sans-serif" }}>Scouts will reach out through these. You can update anytime.</p>
            </div>
            {[
              { label:"Email", key:"email", type:"email", placeholder:"you@email.com" },
              { label:"Phone", key:"phone", type:"tel",   placeholder:"(555) 123-4567" },
            ].map(f => (
              <div key={f.key}>
                <label style={{ color:"#4d6a8a",fontSize:12,fontWeight:600,letterSpacing:".05em",textTransform:"uppercase",display:"block",marginBottom:6 }}>{f.label}</label>
                <input value={form[f.key]} onChange={e => set(f.key, e.target.value)} type={f.type} placeholder={f.placeholder}
                  style={{ width:"100%",background:"rgba(255,255,255,.05)",border:"1px solid #1e3352",borderRadius:10,color:"#f0f6ff",fontSize:15,padding:"11px 14px",fontFamily:"'DM Sans',sans-serif",outline:"none" }} />
              </div>
            ))}
            <div style={{ background:"rgba(99,102,241,.07)", border:"1px dashed rgba(99,102,241,.25)", borderRadius:12, padding:16, marginTop:4 }}>
              <div style={{ fontWeight:700, fontSize:13, color:"#c7d2fe", marginBottom:4 }}>✓ Almost done!</div>
              <div style={{ color:"#4d6a8a", fontSize:13, fontFamily:"'DM Sans',sans-serif", lineHeight:1.6 }}>
                After submitting, your profile goes live in the Scout Discover feed. You can edit it anytime from your dashboard.
              </div>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:24, gap:12 }}>
          {step > 1 ? (
            <button onClick={() => setStep(s => s-1)} style={{ padding:"11px 20px",borderRadius:10,border:"1px solid #162438",background:"transparent",color:"#4d6a8a",fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:"inherit" }}>← Back</button>
          ) : <div />}
          {step < 4 ? (
            <button onClick={() => setStep(s => s+1)} style={{ padding:"11px 24px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#4f46e5,#818cf8)",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 16px rgba(79,70,229,.3)" }}>
              Continue →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={saving} style={{ padding:"11px 24px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#4f46e5,#818cf8)",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 16px rgba(79,70,229,.3)",opacity:saving?.6:1 }}>
              {saving ? "Publishing…" : "🚀 Publish Profile"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// APP ROUTER — role-aware routing
// ═══════════════════════════════════════════════════════════════
function AppRouter() {
  const { user, role, loading } = useAuth();
  const [athleteProfile, setAthleteProfile] = useState(undefined); // undefined=checking

  useEffect(() => {
    if (!user || role !== "athlete") { setAthleteProfile(null); return; }
    fetchAthlete(user.uid).then(setAthleteProfile);
  }, [user, role]);

  if (loading || (role === "athlete" && athleteProfile === undefined)) {
    return (
      <div style={s.loadingScreen}>
        <div style={s.loadingLogo}>⚽</div>
        <div style={s.loadingText}>ScoutLinkz</div>
        <div style={s.loadingSpinner} className="sl-spinner-lg" />
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          .sl-spinner-lg { width:28px;height:28px;border:3px solid rgba(99,102,241,.15);border-top-color:#4f46e5;border-radius:50%;animation:spin .7s linear infinite;margin-top:16px; }
        `}</style>
      </div>
    );
  }

  if (!user) return <LoginPage />;
  if (role === "athlete" && !athleteProfile) return <AthleteProfileSetup />;
  if (role === "athlete" && athleteProfile)  return <AthleteDashboard profile={athleteProfile} />;
  return <ScoutDashboard />;
}

// ─── ROOT EXPORT ─────────────────────────────────────────────
export default function ScoutLinkzAuth() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

// ── Login ──────────────────────────────────────────────────────
const loginStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500&display=swap');
  .sl-input {
    width:100%; background:rgba(255,255,255,.05); border:1px solid #1e3352;
    border-radius:12px; color:#f0f6ff; font-size:15px; padding:12px 14px;
    font-family:'DM Sans',inherit; outline:none; transition:border-color .2s, box-shadow .2s;
    box-sizing:border-box; font-weight:400; letter-spacing:.01em;
  }
  .sl-input:focus { border-color:rgba(99,102,241,.7); box-shadow:0 0 0 3px rgba(99,102,241,.15); }
  .sl-input::placeholder { color:#3d5474; }
  .sl-submit {
    width:100%; padding:14px; border-radius:12px; border:none;
    background:linear-gradient(135deg,#4f46e5,#818cf8);
    color:#fff; font-size:15px; font-weight:700; font-family:'Plus Jakarta Sans',inherit;
    cursor:pointer; transition:filter .2s, transform .1s, box-shadow .2s;
    display:flex; align-items:center; justify-content:center; gap:10px;
    letter-spacing:.02em; box-shadow: 0 4px 20px rgba(99,102,241,.3);
  }
  .sl-submit:hover:not(:disabled) { filter:brightness(1.08); transform:translateY(-1px); box-shadow:0 8px 28px rgba(79,70,229,.45); }
  .sl-submit:active:not(:disabled) { transform:translateY(0); }
  .sl-submit:disabled { opacity:.55; cursor:not-allowed; }
  @keyframes spin { to { transform:rotate(360deg); } }
  .sl-spinner { width:18px;height:18px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite; }
`;

const s = {
  loginRoot: {
    minHeight: "100vh", background: "#080e1a",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif",
    position: "relative", overflow: "hidden",
  },
  gridBg: {
    position: "absolute", inset: 0,
    display: "grid", gridTemplateColumns: "repeat(10, 1fr)",
    opacity: 0.035, pointerEvents: "none",
  },
  gridCell: { border: "1px solid #6366f1" },
  orb1: {
    position: "absolute", width: 600, height: 600, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(79,70,229,.14) 0%, transparent 65%)",
    top: -150, right: -120, pointerEvents: "none",
  },
  orb2: {
    position: "absolute", width: 450, height: 450, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(99,102,241,.08) 0%, transparent 65%)",
    bottom: -100, left: -100, pointerEvents: "none",
  },
  loginWrap: {
    position: "relative", zIndex: 1,
    width: "100%", maxWidth: 420, padding: "0 20px",
  },
  logoRow: {
    display: "flex", alignItems: "center", gap: 14, marginBottom: 32,
  },
  logoIcon: {
    width: 52, height: 52, borderRadius: 16,
    background: "rgba(99,102,241,.15)", border: "1px solid rgba(99,102,241,.35)",
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
  },
  logoName: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 22, color: "#f0f6ff", letterSpacing: "-.02em" },
  logoSub:  { color: "#5b7a9d", fontSize: 13, marginTop: 2, fontWeight: 500 },
  card: {
    background: "rgba(10,17,34,.9)", border: "1px solid #1a2d4a",
    borderRadius: 20, padding: 32,
    backdropFilter: "blur(16px)",
    boxShadow: "0 32px 80px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.04)",
    display: "flex", flexDirection: "column", gap: 20,
  },
  cardHead: { display: "flex", flexDirection: "column", gap: 6 },
  cardTitle: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 24, color: "#f0f6ff", margin: 0, letterSpacing: "-.03em" },
  cardSub:   { color: "#5b7a9d", fontSize: 14, margin: 0, fontFamily: "'DM Sans', sans-serif", fontWeight: 400 },
  errorBanner: {
    background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.25)",
    borderRadius: 10, padding: "12px 16px", color: "#fca5a5",
    fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 8,
    fontFamily: "'DM Sans', sans-serif",
  },
  successBanner: {
    background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.25)",
    borderRadius: 10, padding: "14px 16px", color: "#6ee7b7",
    fontSize: 14, fontWeight: 600, textAlign: "center",
  },
  field: { display: "flex", flexDirection: "column", gap: 7 },
  label: { color: "#7a9bbf", fontSize: 12, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase" },
  input: {
    width: "100%", background: "rgba(255,255,255,.05)", border: "1px solid #1e3352",
    borderRadius: 10, color: "#f0f6ff", fontSize: 15, padding: "12px 14px",
    fontFamily: "'DM Sans', sans-serif", outline: "none",
  },
  fieldErr: { color: "#fca5a5", fontSize: 12, fontWeight: 500 },
  pwWrap: { position: "relative" },
  pwInput: { paddingRight: 44 },
  eyeBtn: {
    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
    background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: 4, opacity: .6,
  },
  forgotRow: { display: "flex", justifyContent: "flex-end" },
  forgotBtn: {
    background: "none", border: "none", color: "#818cf8",
    fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
    textDecoration: "underline", textUnderlineOffset: 3,
  },
  submitBtn: { marginTop: 4 },
  tabs: {
    display: "flex", background: "rgba(10,17,34,.8)", border: "1px solid #1a2d4a",
    borderRadius: 14, padding: 4, marginBottom: 12, gap: 4,
  },
  tab: {
    flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid transparent",
    background: "transparent", color: "#5b7a9d", fontWeight: 600, fontSize: 14,
    cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all .2s",
  },
  tabActive: {
    background: "rgba(99,102,241,.15)", color: "#c7d2fe",
    border: "1px solid rgba(99,102,241,.3)",
  },
  demoNote: {
    background: "rgba(79,70,229,.06)", border: "1px dashed rgba(79,70,229,.25)",
    borderRadius: 10, padding: "10px 14px", color: "#5b7a9d", fontSize: 12,
    textAlign: "center",
  },
  backBtn: {
    background: "none", border: "none", color: "#5b7a9d",
    fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
    textAlign: "center", marginTop: 4,
  },
  loadingScreen: {
    minHeight: "100vh", background: "#080e1a",
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    fontFamily: "'Plus Jakarta Sans', sans-serif", gap: 8,
  },
  loadingLogo: { fontSize: 40, marginBottom: 8 },
  loadingText: { color: "#f0f6ff", fontWeight: 800, fontSize: 22, letterSpacing: "-.02em" },
  loadingSpinner: {},
};

// ── Dashboard ──────────────────────────────────────────────────
const dashStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; }
  body { background: #080e1a; }
  select option { background: #0c1525; color: #f0f6ff; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #1e3352; border-radius: 3px; }
`;


