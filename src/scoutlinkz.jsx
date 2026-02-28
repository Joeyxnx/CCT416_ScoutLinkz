import { useState, useEffect, useRef } from "react";

const ATHLETE = {
  name: "Devin Smith",
  sport: "Soccer",
  position: "Goalkeeper",
  gradYear: 2026,
  location: "Toronto, ON",
  height: "6'1\"",
  weight: "195 lb",
  verified: false,
  gpa: 3.7,
  foot: "Right",
  bio: "Explosive shot-stopper with strong distribution. Comfortable playing out of the back and organizing the defense under pressure.",
  tags: ["Shot-stopping", "1v1", "Distribution"],
  stats: [
    { label: "Saves", value: 68 },
    { label: "Clean Sheets", value: 9 },
    { label: "Save %", value: "78%" },
    { label: "Games", value: 18 },
  ],
  highlights: [
    { title: "Top Saves (2025)", url: "https://www.youtube.com/watch?v=0jlkr3V6I74", videoId: "0jlkr3V6I74" },
    { title: "Distribution & Sweeper Clips", url: "https://www.youtube.com/watch?v=Bz8PO5rFWe8", videoId: "Bz8PO5rFWe8" },
    { title: "Training Session", url: "https://www.youtube.com/watch?v=v36snA3Dsg8", videoId: "v36snA3Dsg8" },
  ],
  contact: { email: "devin@example.com", phone: "(555) 123-4567" },
};

const STATUSES = [
  { key: "none",       label: "No Status",   color: "#98a7c2", bg: "rgba(152,167,194,.12)", border: "rgba(152,167,194,.25)" },
  { key: "interested", label: "Interested",  color: "#4f46e5", bg: "rgba(79,70,229,.15)",   border: "rgba(79,70,229,.35)" },
  { key: "contacted",  label: "Contacted",   color: "#f59e0b", bg: "rgba(245,158,11,.15)",  border: "rgba(245,158,11,.35)" },
  { key: "in-review",  label: "In Review",   color: "#06b6d4", bg: "rgba(6,182,212,.15)",   border: "rgba(6,182,212,.35)" },
  { key: "passed",     label: "Passed",      color: "#ef4444", bg: "rgba(239,68,68,.15)",   border: "rgba(239,68,68,.35)" },
];

const KEYS = {
  saved:  "scoutlinkz:saved:devin-smith",
  status: "scoutlinkz:status:devin-smith",
  notes:  "scoutlinkz:notes:devin-smith",
};

function getYTEmbed(videoId) { return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`; }
function getYTThumb(videoId) { return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`; }

function Pill({ children, tone = "neutral" }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function SaveButton({ saved, onClick, justSaved }) {
  return (
    <button className={`btn save-btn ${saved ? "saved" : ""} ${justSaved ? "pulse" : ""}`} onClick={onClick}>
      <span className="save-icon">{saved ? "★" : "☆"}</span>
      <span>{saved ? "Saved" : "Save Profile"}</span>
    </button>
  );
}

function StatusDropdown({ status, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = STATUSES.find(s => s.key === status) || STATUSES[0];

  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="status-wrap" ref={ref}>
      <button
        className="status-btn"
        style={{ color: current.color, background: current.bg, borderColor: current.border }}
        onClick={() => setOpen(o => !o)}
      >
        <span className="status-dot" style={{ background: current.color }} />
        {current.label}
        <span className="status-caret">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="status-menu">
          {STATUSES.map(s => (
            <button
              key={s.key}
              className={`status-option ${s.key === status ? "active" : ""}`}
              style={s.key === status ? { color: s.color, background: s.bg } : {}}
              onClick={() => { onChange(s.key); setOpen(false); }}
            >
              <span className="status-dot" style={{ background: s.color }} />
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ScoutNotes({ notes, onChange, onSave, saving }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(notes);
  const taRef = useRef(null);

  useEffect(() => { setDraft(notes); }, [notes]);

  function handleEdit() { setEditing(true); setTimeout(() => taRef.current?.focus(), 50); }
  function handleSave() { onChange(draft); onSave(draft); setEditing(false); }
  function handleCancel() { setDraft(notes); setEditing(false); }

  return (
    <div className="card span-2">
      <div className="card-header-row">
        <div className="card-title">📋 Scout Notes</div>
        {!editing && (
          <button className="notes-edit-btn" onClick={handleEdit}>
            {notes ? "Edit" : "+ Add note"}
          </button>
        )}
      </div>
      {editing ? (
        <div className="notes-editor">
          <textarea
            ref={taRef}
            className="notes-textarea"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="Add your scouting notes — fit for roster, contact history, standout qualities..."
            rows={4}
          />
          <div className="notes-actions">
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save Notes"}
            </button>
            <button className="btn btn-ghost" onClick={handleCancel}>Cancel</button>
          </div>
        </div>
      ) : notes ? (
        <p className="notes-body">{notes}</p>
      ) : (
        <p className="notes-empty">No notes yet. Click "+ Add note" to start.</p>
      )}
    </div>
  );
}

function Lightbox({ highlight, onClose }) {
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div className="lightbox-box" onClick={e => e.stopPropagation()}>
        <div className="lightbox-header">
          <span className="lightbox-title">{highlight.title}</span>
          <button className="lightbox-close" onClick={onClose}>✕</button>
        </div>
        <div className="lightbox-video">
          {highlight.videoId ? (
            <iframe
              src={getYTEmbed(highlight.videoId)}
              title={highlight.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="lightbox-unavail">
              <span>🎬</span>
              <p>Video preview unavailable</p>
              <a className="btn btn-primary" href={highlight.url} target="_blank" rel="noreferrer">Open on YouTube ↗</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HighlightCard({ highlight, onOpen }) {
  return (
    <div className="highlight" onClick={() => onOpen(highlight)} role="button" tabIndex={0}
      onKeyDown={e => e.key === "Enter" && onOpen(highlight)}>
      <div className="highlight-thumb">
        {highlight.videoId
          ? <img src={getYTThumb(highlight.videoId)} alt={highlight.title} className="thumb-img" />
          : <div className="thumb-placeholder" />}
        <div className="thumb-play">▶</div>
      </div>
      <div className="highlight-info">
        <div className="highlight-title">{highlight.title}</div>
        <div className="muted">Click to watch</div>
      </div>
    </div>
  );
}

export default function ScoutLinkzMVP() {
  const a = ATHLETE;
  const [saved, setSaved]           = useState(false);
  const [justSaved, setJustSaved]   = useState(false);
  const [status, setStatus]         = useState("none");
  const [notes, setNotes]           = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const [lightbox, setLightbox]     = useState(null);
  const [toast, setToast]           = useState(null);

  useEffect(() => {
    async function load() {
      if (!window.storage) return;
      try { const r = await window.storage.get(KEYS.saved);  if (r?.value === "true") setSaved(true); } catch {}
      try { const r = await window.storage.get(KEYS.status); if (r?.value) setStatus(r.value); } catch {}
      try { const r = await window.storage.get(KEYS.notes);  if (r?.value) setNotes(r.value); } catch {}
    }
    load();
  }, []);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleSave() {
    const next = !saved;
    setSaved(next);
    if (next) { setJustSaved(true); setTimeout(() => setJustSaved(false), 600); }
    showToast(next ? "★ Player saved to your list!" : "Removed from saved players.", next ? "success" : "neutral");
    try {
      if (next) await window.storage.set(KEYS.saved, "true");
      else await window.storage.delete(KEYS.saved);
    } catch {}
  }

  async function handleStatus(key) {
    setStatus(key);
    const label = STATUSES.find(s => s.key === key)?.label;
    showToast(`Status set to "${label}"`, "info");
    try {
      if (key === "none") await window.storage.delete(KEYS.status);
      else await window.storage.set(KEYS.status, key);
    } catch {}
  }

  async function handleNotesSave(text) {
    setNotesSaving(true);
    // Always show success — notes are saved in React state regardless of storage
    showToast("Notes saved.", "success");
    // Best-effort persistence
    try {
      if (window.storage) {
        if (text.trim()) await window.storage.set(KEYS.notes, text);
        else await window.storage.delete(KEYS.notes);
      }
    } catch {}
    setNotesSaving(false);
  }

  const currentStatus = STATUSES.find(s => s.key === status) || STATUSES[0];

  return (
    <div className="app">
      <style>{styles}</style>

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
      {lightbox && <Lightbox highlight={lightbox} onClose={() => setLightbox(null)} />}

      <header className="topbar">
        <div className="brand">
          <div className="logo">⚽</div>
          <div>
            <div className="brand-name">ScoutLinkz</div>
            <div className="brand-tag">Athlete Recruiting Profile</div>
          </div>
        </div>
        <div className="topbar-right">
          <StatusDropdown status={status} onChange={handleStatus} />
          <SaveButton saved={saved} onClick={handleSave} justSaved={justSaved} />
          <Pill tone="primary">MVP</Pill>
        </div>
      </header>

      <main className="container">
        <div className="hero-card">
          <div className="hero-top">
            <div className="avatar">{a.name.split(" ").map(x => x[0]).join("")}</div>
            <div className="hero-info">
              <div className="hero-name">
                {a.name}
                {a.verified && <span className="verified">✓ Verified</span>}
                {status !== "none" && (
                  <span className="status-badge" style={{ color: currentStatus.color, background: currentStatus.bg, borderColor: currentStatus.border }}>
                    <span className="status-dot" style={{ background: currentStatus.color }} />
                    {currentStatus.label}
                  </span>
                )}
              </div>
              <div className="hero-sub">{a.sport} · {a.position} · Grad {a.gradYear} · {a.location}</div>
              <div className="pills">
                <Pill tone="primary">{a.sport}</Pill>
                <Pill>GPA {a.gpa}</Pill>
                <Pill>{a.height}</Pill>
                <Pill>{a.weight}</Pill>
                <Pill>{a.foot} foot</Pill>
              </div>
            </div>
            <SaveButton saved={saved} onClick={handleSave} justSaved={justSaved} />
          </div>
          <p className="bio">{a.bio}</p>
          <div className="tags">
            {a.tags.map(t => <span key={t} className="tag">{t}</span>)}
          </div>
        </div>

        <div className="grid">
          <div className="card">
            <div className="card-title">Key Stats</div>
            <div className="stats-grid">
              {a.stats.map(s => <Stat key={s.label} {...s} />)}
            </div>
          </div>

          <div className="card">
            <div className="card-title">Contact</div>
            <div className="contact-row">
              <div><div className="muted">Email</div><div className="contact-val">{a.contact.email}</div></div>
              <div><div className="muted">Phone</div><div className="contact-val">{a.contact.phone}</div></div>
            </div>
            <a className="btn btn-primary" href={`mailto:${a.contact.email}`}>Contact Athlete</a>
          </div>

          <div className="card span-2">
            <div className="card-title">Highlight Reel</div>
            <div className="highlights">
              {a.highlights.map((h, i) => (
                <HighlightCard key={i} highlight={h} onOpen={setLightbox} />
              ))}
            </div>
          </div>

          <ScoutNotes notes={notes} onChange={setNotes} onSave={handleNotesSave} saving={notesSaving} />
        </div>
      </main>

      <footer className="footer">
        <div className="muted">© {new Date().getFullYear()} ScoutLinkz · MVP build · Next: auth + database + discovery</div>
      </footer>
    </div>
  );
}

const styles = `
:root {
  --bg: #0b1220; --panel: #0f172a; --border: #22304a;
  --text: #e6edf7; --muted: #98a7c2; --primary: #4f46e5;
  --good: #22c55e; --gold: #f59e0b;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; }
body { background: var(--bg); color: var(--text); font-family: ui-sans-serif, system-ui, sans-serif; }
a { text-decoration: none; }
.app { min-height: 100vh; display: flex; flex-direction: column; }

.toast {
  position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
  z-index: 200; padding: 12px 22px; border-radius: 14px;
  font-weight: 700; font-size: 14px; white-space: nowrap;
  box-shadow: 0 8px 32px rgba(0,0,0,.4); animation: slideDown .25s ease;
}
.toast-success { background: rgba(34,197,94,.15); border: 1px solid rgba(34,197,94,.35); color: #86efac; }
.toast-neutral  { background: rgba(255,255,255,.08); border: 1px solid var(--border); color: var(--muted); }
.toast-info     { background: rgba(79,70,229,.15); border: 1px solid rgba(79,70,229,.35); color: #a5b4fc; }
@keyframes slideDown {
  from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}

.topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 24px; border-bottom: 1px solid var(--border);
  background: linear-gradient(180deg, rgba(79,70,229,.12), transparent);
  position: sticky; top: 0; z-index: 10;
}
.topbar-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.brand { display: flex; align-items: center; gap: 12px; }
.logo { width: 42px; height: 42px; border-radius: 14px; display: grid; place-items: center; background: rgba(79,70,229,.18); border: 1px solid rgba(79,70,229,.35); }
.brand-name { font-weight: 800; font-size: 18px; }
.brand-tag { color: var(--muted); font-size: 12px; }

.container { max-width: 900px; margin: 0 auto; padding: 24px 18px; flex: 1; display: flex; flex-direction: column; gap: 18px; }

.save-btn {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 9px 16px; border-radius: 14px; border: 1px solid var(--border);
  background: rgba(255,255,255,.05); color: var(--muted);
  font-weight: 700; font-size: 14px; cursor: pointer; font-family: inherit;
  transition: all .2s ease;
}
.save-btn:hover { background: rgba(245,158,11,.1); border-color: rgba(245,158,11,.35); color: var(--gold); }
.save-btn.saved { background: rgba(245,158,11,.15); border-color: rgba(245,158,11,.4); color: var(--gold); }
.save-icon { font-size: 16px; transition: transform .2s ease; }
.save-btn:hover .save-icon, .save-btn.saved .save-icon { transform: scale(1.15); }
@keyframes popPulse { 0% { transform: scale(1); } 40% { transform: scale(1.1); } 100% { transform: scale(1); } }
.save-btn.pulse { animation: popPulse .4s ease; }

.status-wrap { position: relative; }
.status-btn {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 9px 14px; border-radius: 14px; border: 1px solid;
  font-weight: 700; font-size: 13px; cursor: pointer; font-family: inherit;
  transition: filter .15s;
}
.status-btn:hover { filter: brightness(1.1); }
.status-caret { font-size: 9px; opacity: .7; margin-left: 2px; }
.status-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.status-menu {
  position: absolute; top: calc(100% + 8px); right: 0;
  background: #0f172a; border: 1px solid var(--border);
  border-radius: 14px; overflow: hidden; min-width: 160px;
  box-shadow: 0 12px 40px rgba(0,0,0,.5); z-index: 50;
  animation: fadeIn .15s ease;
}
@keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
.status-option {
  display: flex; align-items: center; gap: 8px; width: 100%;
  padding: 10px 14px; border: none; background: transparent;
  color: var(--text); font-size: 13px; font-weight: 600;
  cursor: pointer; font-family: inherit; text-align: left; transition: background .1s;
}
.status-option:hover { background: rgba(255,255,255,.06); }
.status-option.active { font-weight: 800; }
.status-badge {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 12px; font-weight: 700; padding: 4px 10px;
  border-radius: 999px; border: 1px solid;
}

.hero-card { background: rgba(15,23,42,.75); border: 1px solid var(--border); border-radius: 20px; padding: 20px; display: flex; flex-direction: column; gap: 14px; }
.hero-top { display: flex; gap: 16px; align-items: flex-start; }
.hero-top .save-btn { margin-left: auto; flex-shrink: 0; }
.avatar { width: 64px; height: 64px; border-radius: 20px; flex-shrink: 0; background: rgba(79,70,229,.2); border: 1px solid rgba(79,70,229,.35); display: grid; place-items: center; font-weight: 900; font-size: 20px; }
.hero-name { font-weight: 900; font-size: 22px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.verified { font-size: 13px; color: var(--good); font-weight: 700; }
.hero-sub { color: var(--muted); margin-top: 4px; }
.pills { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
.bio { color: var(--text); opacity: .9; line-height: 1.5; }
.tags { display: flex; gap: 8px; flex-wrap: wrap; }
.tag { font-size: 12px; padding: 5px 10px; border-radius: 999px; background: rgba(255,255,255,.06); border: 1px solid var(--border); }

.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.card { background: rgba(15,23,42,.72); border: 1px solid var(--border); border-radius: 18px; padding: 16px; display: flex; flex-direction: column; gap: 14px; }
.card.span-2 { grid-column: span 2; }
.card-title { font-weight: 800; font-size: 15px; }
.card-header-row { display: flex; align-items: center; justify-content: space-between; }

.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.stat { background: rgba(255,255,255,.05); border: 1px solid var(--border); border-radius: 14px; padding: 10px; }
.stat-value { font-weight: 900; font-size: 18px; }
.stat-label { color: var(--muted); font-size: 12px; margin-top: 3px; }

.contact-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.muted { color: var(--muted); font-size: 13px; }
.contact-val { font-weight: 700; margin-top: 3px; }

.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 14px; border-radius: 14px; border: 1px solid var(--border); font-weight: 700; cursor: pointer; font-family: inherit; font-size: 14px; }
.btn-primary { background: rgba(79,70,229,.9); border-color: rgba(79,70,229,.5); color: #fff; }
.btn-primary:hover { filter: brightness(1.08); }
.btn-ghost { background: transparent; color: var(--muted); }
.btn-ghost:hover { color: var(--text); background: rgba(255,255,255,.05); }

.highlights { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.highlight {
  display: flex; align-items: center; gap: 0;
  background: rgba(255,255,255,.04); border: 1px solid var(--border);
  border-radius: 14px; overflow: hidden; color: var(--text);
  cursor: pointer; transition: background .15s, border-color .15s;
}
.highlight:hover { background: rgba(255,255,255,.08); border-color: rgba(79,70,229,.4); }
.highlight-info { padding: 10px 12px; }
.highlight-thumb {
  position: relative; width: 90px; min-height: 70px; flex-shrink: 0;
  background: #0d1a2e; display: grid; place-items: center; align-self: stretch;
  overflow: hidden;
}
.thumb-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: .85; }
.thumb-placeholder { width: 100%; height: 100%; background: rgba(79,70,229,.1); }
.thumb-play {
  position: absolute; inset: 0; display: grid; place-items: center;
  font-size: 18px; background: rgba(0,0,0,.4);
  opacity: 0; transition: opacity .15s; z-index: 1;
}
.highlight:hover .thumb-play { opacity: 1; }
.highlight-title { font-weight: 700; font-size: 14px; margin-bottom: 3px; }

.notes-edit-btn {
  background: none; border: 1px solid var(--border); color: var(--muted);
  padding: 5px 12px; border-radius: 10px; font-size: 13px; font-weight: 700;
  cursor: pointer; font-family: inherit; transition: all .15s;
}
.notes-edit-btn:hover { color: var(--text); border-color: rgba(255,255,255,.2); }
.notes-textarea {
  width: 100%; background: rgba(255,255,255,.04); border: 1px solid var(--border);
  border-radius: 12px; color: var(--text); font-family: inherit; font-size: 14px;
  line-height: 1.6; padding: 12px; resize: vertical; outline: none; transition: border-color .15s;
}
.notes-textarea:focus { border-color: rgba(79,70,229,.5); }
.notes-actions { display: flex; gap: 10px; }
.notes-body { line-height: 1.65; color: var(--text); opacity: .9; white-space: pre-wrap; }
.notes-empty { color: var(--muted); font-style: italic; }

.lightbox-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.85);
  z-index: 100; display: grid; place-items: center;
  animation: fadeOverlay .2s ease; backdrop-filter: blur(4px);
}
@keyframes fadeOverlay { from { opacity: 0; } to { opacity: 1; } }
.lightbox-box {
  background: #0f172a; border: 1px solid var(--border); border-radius: 20px;
  width: min(860px, 95vw); box-shadow: 0 24px 80px rgba(0,0,0,.7);
  animation: scaleIn .2s ease; overflow: hidden;
}
@keyframes scaleIn { from { transform: scale(.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.lightbox-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px; border-bottom: 1px solid var(--border);
}
.lightbox-title { font-weight: 800; font-size: 15px; }
.lightbox-close {
  background: rgba(255,255,255,.07); border: 1px solid var(--border); color: var(--text);
  width: 32px; height: 32px; border-radius: 10px; cursor: pointer; font-size: 14px;
  display: grid; place-items: center; transition: background .15s;
}
.lightbox-close:hover { background: rgba(255,255,255,.13); }
.lightbox-video { aspect-ratio: 16/9; background: #000; }
.lightbox-video iframe { width: 100%; height: 100%; display: block; }
.lightbox-unavail { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: var(--muted); }
.lightbox-unavail span { font-size: 40px; }

.pill { font-size: 12px; font-weight: 700; padding: 5px 10px; border-radius: 999px; border: 1px solid var(--border); background: rgba(255,255,255,.05); color: var(--text); }
.pill-primary { background: rgba(79,70,229,.16); border-color: rgba(79,70,229,.4); }

.footer { border-top: 1px solid var(--border); padding: 14px 24px; background: rgba(15,23,42,.55); text-align: center; }

@media (max-width: 640px) {
  .grid { grid-template-columns: 1fr; }
  .card.span-2 { grid-column: span 1; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .highlights { grid-template-columns: 1fr; }
  .hero-top { flex-direction: column; }
  .hero-top .save-btn { margin-left: 0; }
  .topbar-right { gap: 6px; }
  .status-menu { right: auto; left: 0; }
}
`;
