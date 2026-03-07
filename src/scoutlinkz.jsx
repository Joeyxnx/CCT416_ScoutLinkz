// ============================================================
// ScoutLinkz — Firebase Auth System
// ============================================================
// SETUP INSTRUCTIONS:
// 1. npm install firebase
// 2. Replace the firebaseConfig object below with your real
//    credentials from Firebase Console → Project Settings → Your apps
// 3. In Firebase Console, enable Authentication → Email/Password
// ============================================================

import { useState, useEffect, createContext, useContext } from "react";

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
// ────────────────────────────────────────────────────────────

// ─── AUTH CONTEXT ────────────────────────────────────────────
const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser]       = useState(undefined); // undefined = loading
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function login(email, password) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signup(email, password, fullName) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: fullName });
    // Refresh user so displayName is available immediately
    setUser({ ...cred.user, displayName: fullName });
  }

  async function logout() {
    await signOut(auth);
  }

  async function resetPassword(email) {
    await sendPasswordResetEmail(auth, email);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, resetPassword }}>
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
  const { login, signup, resetPassword } = useAuth();
  const [mode, setMode]               = useState("login"); // "login" | "signup" | "reset"
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
      if (mode === "signup") await signup(email, password, fullName.trim());
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
// SCOUT DASHBOARD (post-login stub)
// ═══════════════════════════════════════════════════════════════
function ScoutDashboard() {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
  }

  const stats = [
    { label: "Saved Athletes", value: 14, icon: "★" },
    { label: "Profiles Viewed", value: 38, icon: "👁" },
    { label: "Contacts Made",  value: 6,  icon: "✉" },
    { label: "In Review",      value: 3,  icon: "🔍" },
  ];

  const recentAthletes = [
    { name: "Devin Smith",    sport: "Soccer",      position: "Goalkeeper",     status: "in-review", statusColor: "#06b6d4" },
    { name: "Marcus Lee",     sport: "Basketball",  position: "Point Guard",    status: "interested", statusColor: "#4f46e5" },
    { name: "Jordan Rivera",  sport: "Track",       position: "Sprinter",       status: "contacted",  statusColor: "#f59e0b" },
    { name: "Taylor Brooks",  sport: "Soccer",      position: "Center Back",    status: "interested", statusColor: "#4f46e5" },
  ];

  return (
    <div style={d.root}>
      <style>{dashStyles}</style>

      {/* Sidebar */}
      <aside style={d.sidebar}>
        <div style={d.sideLogoRow}>
          <div style={d.sideLogoIcon}>⚽</div>
          <div style={d.sideLogoName}>ScoutLinkz</div>
        </div>
        <nav style={d.nav}>
          {[
            { icon: "⊞", label: "Dashboard",   active: true },
            { icon: "🔍", label: "Discover"               },
            { icon: "★",  label: "Saved"                  },
            { icon: "✉",  label: "Messages"               },
            { icon: "⚙",  label: "Settings"               },
          ].map(item => (
            <div key={item.label} style={item.active ? { ...d.navItem, ...d.navActive } : d.navItem}>
              <span style={d.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </nav>
        <div style={d.sideFooter}>
          <div style={d.userRow}>
            <div style={d.userAvatar}>{(user?.email?.[0] || "S").toUpperCase()}</div>
            <div>
              <div style={d.userName}>{user?.displayName || "Scout"}</div>
              <div style={d.userEmail}>{user?.email}</div>
            </div>
          </div>
          <button
            style={d.logoutBtn}
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? "…" : "Sign out"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={d.main}>
        <div style={d.topbar}>
          <div>
            <h1 style={d.pageTitle}>Dashboard</h1>
            <p style={d.pageSub}>Welcome back — here's your scouting overview</p>
          </div>
          <div style={d.topbarRight}>
            <div style={d.searchBox}>
              <span style={d.searchIcon}>🔍</span>
              <input className="dash-input" placeholder="Search athletes…" style={d.searchInput} />
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={d.statsRow}>
          {stats.map(stat => (
            <div key={stat.label} style={d.statCard}>
              <div style={d.statIcon}>{stat.icon}</div>
              <div style={d.statValue}>{stat.value}</div>
              <div style={d.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Recent athletes */}
        <div style={d.section}>
          <div style={d.sectionHead}>
            <div style={d.sectionTitle}>Recent Athletes</div>
            <button style={d.seeAllBtn}>See all →</button>
          </div>
          <div style={d.athleteList}>
            {recentAthletes.map(a => (
              <div key={a.name} style={d.athleteRow}>
                <div style={d.athleteAvatar}>
                  {a.name.split(" ").map(x => x[0]).join("")}
                </div>
                <div style={d.athleteInfo}>
                  <div style={d.athleteName}>{a.name}</div>
                  <div style={d.athleteMeta}>{a.sport} · {a.position}</div>
                </div>
                <div style={{ ...d.statusPill, color: a.statusColor, borderColor: a.statusColor + "55", background: a.statusColor + "18" }}>
                  <span style={{ ...d.statusDot, background: a.statusColor }} />
                  {a.status.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}
                </div>
                <button style={d.viewBtn}>View Profile →</button>
              </div>
            ))}
          </div>
        </div>

        {/* Coming soon banner */}
        <div style={d.comingSoon}>
          <div style={d.comingIcon}>🚀</div>
          <div>
            <div style={d.comingTitle}>Discovery Feed coming soon</div>
            <div style={d.comingSub}>Browse and filter athletes by sport, position, GPA, and location</div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// APP ROUTER — handles auth state transitions
// ═══════════════════════════════════════════════════════════════
function AppRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={s.loadingScreen}>
        <div style={s.loadingLogo}>⚽</div>
        <div style={s.loadingText}>ScoutLinkz</div>
        <div style={s.loadingSpinner} className="sl-spinner-lg" />
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          .sl-spinner-lg { width:28px;height:28px;border:3px solid rgba(79,70,229,.2);border-top-color:#4f46e5;border-radius:50%;animation:spin .7s linear infinite;margin-top:16px; }
        `}</style>
      </div>
    );
  }

  return user ? <ScoutDashboard /> : <LoginPage />;
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
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap');
  .sl-input {
    width:100%; background:rgba(255,255,255,.04); border:1px solid #22304a;
    border-radius:12px; color:#e6edf7; font-size:15px; padding:12px 14px;
    font-family:inherit; outline:none; transition:border-color .2s, box-shadow .2s;
    box-sizing:border-box;
  }
  .sl-input:focus { border-color:rgba(79,70,229,.6); box-shadow:0 0 0 3px rgba(79,70,229,.12); }
  .sl-input::placeholder { color:#4a5a78; }
  .sl-submit {
    width:100%; padding:14px; border-radius:14px; border:none;
    background:linear-gradient(135deg,#4f46e5,#6366f1);
    color:#fff; font-size:16px; font-weight:800; font-family:inherit;
    cursor:pointer; transition:filter .2s, transform .1s;
    display:flex; align-items:center; justify-content:center; gap:10px;
    letter-spacing:.01em;
  }
  .sl-submit:hover:not(:disabled) { filter:brightness(1.1); transform:translateY(-1px); }
  .sl-submit:active:not(:disabled) { transform:translateY(0); }
  .sl-submit:disabled { opacity:.6; cursor:not-allowed; }
  @keyframes spin { to { transform:rotate(360deg); } }
  .sl-spinner { width:18px;height:18px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite; }
`;

const s = {
  loginRoot: {
    minHeight: "100vh", background: "#0b1220",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "'Syne', ui-sans-serif, system-ui, sans-serif",
    position: "relative", overflow: "hidden",
  },
  gridBg: {
    position: "absolute", inset: 0,
    display: "grid", gridTemplateColumns: "repeat(10, 1fr)",
    opacity: 0.04, pointerEvents: "none",
  },
  gridCell: { border: "1px solid #4f46e5" },
  orb1: {
    position: "absolute", width: 500, height: 500, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(79,70,229,.18) 0%, transparent 70%)",
    top: -120, right: -100, pointerEvents: "none",
  },
  orb2: {
    position: "absolute", width: 400, height: 400, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(6,182,212,.1) 0%, transparent 70%)",
    bottom: -80, left: -80, pointerEvents: "none",
  },
  loginWrap: {
    position: "relative", zIndex: 1,
    width: "100%", maxWidth: 420, padding: "0 20px",
  },
  logoRow: {
    display: "flex", alignItems: "center", gap: 14, marginBottom: 32,
  },
  logoIcon: {
    width: 52, height: 52, borderRadius: 18,
    background: "rgba(79,70,229,.2)", border: "1px solid rgba(79,70,229,.4)",
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
  },
  logoName: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, color: "#e6edf7" },
  logoSub:  { color: "#98a7c2", fontSize: 13, marginTop: 2 },
  card: {
    background: "rgba(15,23,42,.85)", border: "1px solid #22304a",
    borderRadius: 24, padding: 32,
    backdropFilter: "blur(12px)",
    boxShadow: "0 24px 80px rgba(0,0,0,.4)",
    display: "flex", flexDirection: "column", gap: 20,
  },
  cardHead: { display: "flex", flexDirection: "column", gap: 6 },
  cardTitle: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 26, color: "#e6edf7", margin: 0 },
  cardSub:   { color: "#98a7c2", fontSize: 14, margin: 0 },
  errorBanner: {
    background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.3)",
    borderRadius: 12, padding: "12px 16px", color: "#fca5a5",
    fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8,
  },
  successBanner: {
    background: "rgba(34,197,94,.12)", border: "1px solid rgba(34,197,94,.3)",
    borderRadius: 12, padding: "14px 16px", color: "#86efac",
    fontSize: 14, fontWeight: 700, textAlign: "center",
  },
  field: { display: "flex", flexDirection: "column", gap: 7 },
  label: { color: "#98a7c2", fontSize: 13, fontWeight: 700, letterSpacing: ".04em" },
  input: {
    width: "100%", background: "rgba(255,255,255,.04)", border: "1px solid #22304a",
    borderRadius: 12, color: "#e6edf7", fontSize: 15, padding: "12px 14px",
    fontFamily: "'Syne', sans-serif", outline: "none",
  },
  fieldErr: { color: "#fca5a5", fontSize: 12, fontWeight: 600 },
  pwWrap: { position: "relative" },
  pwInput: { paddingRight: 44 },
  eyeBtn: {
    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
    background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: 4,
  },
  forgotRow: { display: "flex", justifyContent: "flex-end" },
  forgotBtn: {
    background: "none", border: "none", color: "#6366f1",
    fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
    textDecoration: "underline", textUnderlineOffset: 3,
  },
  submitBtn: { marginTop: 4 },
  tabs: {
    display: "flex", background: "rgba(15,23,42,.8)", border: "1px solid #22304a",
    borderRadius: 16, padding: 4, marginBottom: 12, gap: 4,
  },
  tab: {
    flex: 1, padding: "10px 0", borderRadius: 12, border: "none",
    background: "transparent", color: "#98a7c2", fontWeight: 700, fontSize: 14,
    cursor: "pointer", fontFamily: "inherit", transition: "all .2s",
  },
  tabActive: {
    background: "rgba(79,70,229,.2)", color: "#a5b4fc",
    border: "1px solid rgba(79,70,229,.35)",
  },
  demoNote: {
    background: "rgba(79,70,229,.08)", border: "1px dashed rgba(79,70,229,.3)",
    borderRadius: 10, padding: "10px 14px", color: "#98a7c2", fontSize: 12,
    textAlign: "center",
  },
  backBtn: {
    background: "none", border: "none", color: "#98a7c2",
    fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
    textAlign: "center", marginTop: 4,
  },
  loadingScreen: {
    minHeight: "100vh", background: "#0b1220",
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    fontFamily: "'Syne', sans-serif", gap: 8,
  },
  loadingLogo: { fontSize: 40, marginBottom: 8 },
  loadingText: { color: "#e6edf7", fontWeight: 800, fontSize: 22 },
  loadingSpinner: {},
};

// ── Dashboard ──────────────────────────────────────────────────
const dashStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');
  .dash-input {
    background:none; border:none; outline:none;
    color:#e6edf7; font-size:14px; font-family:inherit;
    width:180px;
  }
  .dash-input::placeholder { color:#4a5a78; }
`;

const d = {
  root: {
    minHeight: "100vh", display: "flex",
    background: "#0b1220", color: "#e6edf7",
    fontFamily: "'Syne', ui-sans-serif, system-ui, sans-serif",
  },
  sidebar: {
    width: 220, background: "#0f172a", borderRight: "1px solid #22304a",
    display: "flex", flexDirection: "column", padding: "24px 0",
    position: "sticky", top: 0, height: "100vh",
    flexShrink: 0,
  },
  sideLogoRow: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "0 20px", marginBottom: 32,
  },
  sideLogoIcon: {
    width: 36, height: 36, borderRadius: 12,
    background: "rgba(79,70,229,.2)", border: "1px solid rgba(79,70,229,.35)",
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
  },
  sideLogoName: { fontWeight: 800, fontSize: 16 },
  nav: { display: "flex", flexDirection: "column", gap: 4, flex: 1, padding: "0 12px" },
  navItem: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "10px 12px", borderRadius: 12, cursor: "pointer",
    color: "#98a7c2", fontSize: 14, fontWeight: 700,
    transition: "background .15s, color .15s",
  },
  navActive: {
    background: "rgba(79,70,229,.15)", color: "#a5b4fc",
    border: "1px solid rgba(79,70,229,.25)",
  },
  navIcon: { fontSize: 16, width: 22, textAlign: "center" },
  sideFooter: { padding: "16px 16px 0", borderTop: "1px solid #22304a", marginTop: 16 },
  userRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12 },
  userAvatar: {
    width: 34, height: 34, borderRadius: 10,
    background: "rgba(79,70,229,.2)", border: "1px solid rgba(79,70,229,.35)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 900, fontSize: 14,
  },
  userName:  { fontWeight: 800, fontSize: 13, color: "#e6edf7" },
  userEmail: { color: "#98a7c2", fontSize: 11, marginTop: 2 },
  logoutBtn: {
    width: "100%", padding: "9px 0", borderRadius: 10,
    background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)",
    color: "#fca5a5", fontWeight: 700, fontSize: 13, cursor: "pointer",
    fontFamily: "inherit", transition: "background .15s",
  },
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "auto" },
  topbar: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "28px 32px 20px", borderBottom: "1px solid #22304a",
  },
  pageTitle: { fontWeight: 800, fontSize: 26, margin: 0 },
  pageSub:   { color: "#98a7c2", fontSize: 14, marginTop: 4 },
  topbarRight: {},
  searchBox: {
    display: "flex", alignItems: "center", gap: 8,
    background: "rgba(255,255,255,.05)", border: "1px solid #22304a",
    borderRadius: 12, padding: "9px 14px",
  },
  searchIcon: { fontSize: 14, opacity: .6 },
  searchInput: {},
  statsRow: {
    display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
    gap: 16, padding: "24px 32px",
  },
  statCard: {
    background: "rgba(15,23,42,.8)", border: "1px solid #22304a",
    borderRadius: 18, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 8,
  },
  statIcon:  { fontSize: 22 },
  statValue: { fontWeight: 900, fontSize: 28 },
  statLabel: { color: "#98a7c2", fontSize: 13 },
  section:   { padding: "0 32px 32px" },
  sectionHead: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  sectionTitle: { fontWeight: 800, fontSize: 17 },
  seeAllBtn: {
    background: "none", border: "1px solid #22304a", color: "#98a7c2",
    borderRadius: 10, padding: "6px 14px", fontSize: 13, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
  },
  athleteList: { display: "flex", flexDirection: "column", gap: 10 },
  athleteRow: {
    display: "flex", alignItems: "center", gap: 14,
    background: "rgba(15,23,42,.8)", border: "1px solid #22304a",
    borderRadius: 16, padding: "14px 18px",
  },
  athleteAvatar: {
    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
    background: "rgba(79,70,229,.15)", border: "1px solid rgba(79,70,229,.3)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 900, fontSize: 13,
  },
  athleteInfo: { flex: 1 },
  athleteName: { fontWeight: 800, fontSize: 15 },
  athleteMeta: { color: "#98a7c2", fontSize: 13, marginTop: 2 },
  statusPill: {
    display: "flex", alignItems: "center", gap: 6,
    fontSize: 12, fontWeight: 700, padding: "5px 12px",
    borderRadius: 999, border: "1px solid",
  },
  statusDot: { width: 7, height: 7, borderRadius: "50%", flexShrink: 0 },
  viewBtn: {
    background: "rgba(79,70,229,.12)", border: "1px solid rgba(79,70,229,.3)",
    color: "#a5b4fc", borderRadius: 10, padding: "7px 14px",
    fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
    flexShrink: 0,
  },
  comingSoon: {
    margin: "0 32px 32px", background: "rgba(79,70,229,.06)",
    border: "1px dashed rgba(79,70,229,.3)", borderRadius: 18,
    padding: "20px 24px", display: "flex", alignItems: "center", gap: 16,
  },
  comingIcon:  { fontSize: 32 },
  comingTitle: { fontWeight: 800, fontSize: 15, color: "#a5b4fc" },
  comingSub:   { color: "#98a7c2", fontSize: 13, marginTop: 4 },
};
