import React, { useMemo, useState } from "react";

const MOCK_ATHLETES = [
  {
    id: "a1",
    name: "Devin Nader",
    sport: "Soccer",
    position: "Goalkeeper",
    gradYear: 2026,
    location: "Toronto, ON",
    height: "6'1\"",
    weight: "185 lb",
    verified: true,
    gpa: 3.7,
    foot: "Right",
    bio: "Explosive shot-stopper with strong distribution. Comfortable playing out of the back.",
    tags: ["Shot-stopping", "1v1", "Distribution"],
    stats: [
      { label: "Saves", value: 68 },
      { label: "Clean Sheets", value: 9 },
      { label: "Save %", value: "78%" },
      { label: "Games", value: 18 },
    ],
    highlights: [
      { title: "Top Saves (2025)", type: "video", url: "#" },
      { title: "Distribution & Sweeper Clips", type: "video", url: "#" },
      { title: "Training Session", type: "video", url: "#" },
    ],
    contact: { email: "devin@example.com", phone: "(555) 123-4567" },
  },
  {
    id: "a2",
    name: "Maya Chen",
    sport: "Soccer",
    position: "Midfielder",
    gradYear: 2027,
    location: "Mississauga, ON",
    height: "5'7\"",
    weight: "140 lb",
    verified: false,
    gpa: 3.9,
    foot: "Both",
    bio: "Box-to-box midfielder. High work rate, strong progressive passing, and leadership.",
    tags: ["Box-to-box", "Pressing", "Passing"],
    stats: [
      { label: "Assists", value: 11 },
      { label: "Goals", value: 6 },
      { label: "Chances", value: 28 },
      { label: "Games", value: 20 },
    ],
    highlights: [
      { title: "Assist Reel", type: "video", url: "#" },
      { title: "Pressing & Recoveries", type: "video", url: "#" },
    ],
    contact: { email: "maya@example.com", phone: "(555) 987-6543" },
  },
  {
    id: "a3",
    name: "Jordan Patel",
    sport: "Basketball",
    position: "Guard",
    gradYear: 2026,
    location: "Brampton, ON",
    height: "6'0\"",
    weight: "170 lb",
    verified: true,
    gpa: 3.4,
    foot: "—",
    bio: "Quick first step, consistent shooter, strong defensive motor.",
    tags: ["Shooting", "Defense", "Handle"],
    stats: [
      { label: "PPG", value: 18.4 },
      { label: "APG", value: 5.2 },
      { label: "RPG", value: 4.1 },
      { label: "Games", value: 22 },
    ],
    highlights: [
      { title: "Scoring Highlights", type: "video", url: "#" },
      { title: "Defensive Clips", type: "video", url: "#" },
    ],
    contact: { email: "jordan@example.com", phone: "(555) 222-1212" },
  },
];

const POSITIONS_BY_SPORT = {
  Soccer: ["Goalkeeper", "Defender", "Midfielder", "Forward"],
  Basketball: ["Guard", "Wing", "Forward", "Center"],
  Hockey: ["Goalie", "Defense", "Center", "Winger"],
};

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Icon({ name, size = 18 }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" };
  switch (name) {
    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
      );
    case "star":
      return (
        <svg {...common}>
          <path d="M12 17.3l-6.2 3.6 1.7-7.1L2 9.2l7.2-.6L12 2l2.8 6.6 7.2.6-5.5 4.6 1.7 7.1L12 17.3z" />
        </svg>
      );
    case "starFill":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 17.3l-6.2 3.6 1.7-7.1L2 9.2l7.2-.6L12 2l2.8 6.6 7.2.6-5.5 4.6 1.7 7.1L12 17.3z" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 2l8 4v6c0 5-3.4 9.4-8 10-4.6-.6-8-5-8-10V6l8-4z" />
          <path d="M9 12l2 2 4-5" />
        </svg>
      );
    case "message":
      return (
        <svg {...common}>
          <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8z" />
        </svg>
      );
    case "plus":
      return (
        <svg {...common}>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      );
    case "x":
      return (
        <svg {...common}>
          <path d="M18 6L6 18" />
          <path d="M6 6l12 12" />
        </svg>
      );
    default:
      return null;
  }
}

function Pill({ children, tone = "neutral" }) {
  return <span className={cx("pill", `pill-${tone}`)}>{children}</span>;
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-header">
          <div>
            <div className="modal-title">{title}</div>
            <div className="modal-subtitle">ScoutLinkz • Athlete Profile</div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
}

function EmptyState({ title, subtitle, action }) {
  return (
    <div className="empty">
      <div className="empty-title">{title}</div>
      <div className="empty-subtitle">{subtitle}</div>
      {action ? <div style={{ marginTop: 16 }}>{action}</div> : null}
    </div>
  );
}

export default function ScoutLinkz() {
  const [tab, setTab] = useState("discover"); // discover | shortlist | messages | create
  const [query, setQuery] = useState("");
  const [sport, setSport] = useState("All");
  const [position, setPosition] = useState("All");
  const [gradYear, setGradYear] = useState("All");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState("recommended"); // recommended | grad | verified
  const [selected, setSelected] = useState(null);
  const [shortlist, setShortlist] = useState(() => new Set(["a1"]));
  const [toast, setToast] = useState("");

  // Messages (mock)
  const [threads, setThreads] = useState([
    { id: "t1", with: "Coach Rivera", last: "Send your next match schedule.", unread: 1 },
    { id: "t2", with: "Scout Daniels", last: "Great clips — do you have GPA details?", unread: 0 },
  ]);
  const [activeThreadId, setActiveThreadId] = useState("t1");
  const activeThread = threads.find((t) => t.id === activeThreadId);

  // Create profile (mock)
  const [profileDraft, setProfileDraft] = useState({
    name: "",
    sport: "Soccer",
    position: "Goalkeeper",
    gradYear: 2026,
    location: "",
    bio: "",
    gpa: "",
  });

  const positions = useMemo(() => {
    const list = POSITIONS_BY_SPORT[profileDraft.sport] || [];
    return ["All", ...list];
  }, [profileDraft.sport]);

  const discoverPositions = useMemo(() => {
    if (sport === "All") return ["All", ...new Set(Object.values(POSITIONS_BY_SPORT).flat())];
    return ["All", ...(POSITIONS_BY_SPORT[sport] || [])];
  }, [sport]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    let rows = MOCK_ATHLETES.filter((a) => {
      const matchesQuery =
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q) ||
        a.sport.toLowerCase().includes(q) ||
        a.position.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q));

      const matchesSport = sport === "All" ? true : a.sport === sport;
      const matchesPosition = position === "All" ? true : a.position === position;
      const matchesGrad = gradYear === "All" ? true : String(a.gradYear) === String(gradYear);
      const matchesVerified = verifiedOnly ? a.verified : true;

      return matchesQuery && matchesSport && matchesPosition && matchesGrad && matchesVerified;
    });

    if (sort === "verified") {
      rows = rows.slice().sort((a, b) => Number(b.verified) - Number(a.verified));
    } else if (sort === "grad") {
      rows = rows.slice().sort((a, b) => a.gradYear - b.gradYear);
    } else {
      // recommended: verified first, then name
      rows = rows.slice().sort((a, b) => {
        const v = Number(b.verified) - Number(a.verified);
        if (v !== 0) return v;
        return a.name.localeCompare(b.name);
      });
    }
    return rows;
  }, [query, sport, position, gradYear, verifiedOnly, sort]);

  const shortlistAthletes = useMemo(() => {
    return MOCK_ATHLETES.filter((a) => shortlist.has(a.id));
  }, [shortlist]);

  function toggleShortlist(id) {
    setShortlist((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        showToast("Removed from shortlist");
      } else {
        next.add(id);
        showToast("Saved to shortlist");
      }
      return next;
    });
  }

  function showToast(msg) {
    setToast(msg);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(""), 1600);
  }

  function openProfile(athlete) {
    setSelected(athlete);
  }

  function closeProfile() {
    setSelected(null);
  }

  function badgeForSport(s) {
    if (s === "Soccer") return "primary";
    if (s === "Basketball") return "accent";
    return "neutral";
  }

  const headerRight = (
    <div className="header-right">
      <div className="search">
        <span className="search-icon">
          <Icon name="search" />
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search athletes, positions, locations, skills…"
          className="search-input"
        />
      </div>
      <button
        className="btn btn-primary"
        onClick={() => {
          setTab("create");
          showToast("Create your athlete profile");
        }}
      >
        <Icon name="plus" /> Create Profile
      </button>
    </div>
  );

  return (
    <div className="app">
      <style>{styles}</style>

      <header className="topbar">
        <div className="brand">
          <div className="logo">⚽</div>
          <div className="brand-text">
            <div className="brand-name">ScoutLinkz</div>
            <div className="brand-tag">Athlete profiles • Highlights • Recruiting</div>
          </div>
        </div>

        {headerRight}
      </header>

      <nav className="tabs">
        <button className={cx("tab", tab === "discover" && "tab-active")} onClick={() => setTab("discover")}>
          Discover Athletes
        </button>
        <button className={cx("tab", tab === "shortlist" && "tab-active")} onClick={() => setTab("shortlist")}>
          Recruiter Shortlist <span className="tab-count">{shortlist.size}</span>
        </button>
        <button className={cx("tab", tab === "messages" && "tab-active")} onClick={() => setTab("messages")}>
          Messages <span className="tab-dot">{threads.some((t) => t.unread > 0) ? "•" : ""}</span>
        </button>
        <button className={cx("tab", tab === "create" && "tab-active")} onClick={() => setTab("create")}>
          Create Profile
        </button>
      </nav>

      <div className="layout">
        {/* Sidebar Filters (only on Discover/Shortlist) */}
        {(tab === "discover" || tab === "shortlist") && (
          <aside className="sidebar">
            <div className="panel">
              <div className="panel-title">Filters</div>

              <label className="label">Sport</label>
              <select className="select" value={sport} onChange={(e) => { setSport(e.target.value); setPosition("All"); }}>
                <option value="All">All</option>
                <option value="Soccer">Soccer</option>
                <option value="Basketball">Basketball</option>
                <option value="Hockey">Hockey</option>
              </select>

              <label className="label">Position</label>
              <select className="select" value={position} onChange={(e) => setPosition(e.target.value)}>
                {discoverPositions.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              <label className="label">Grad Year</label>
              <select className="select" value={gradYear} onChange={(e) => setGradYear(e.target.value)}>
                <option value="All">All</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
                <option value="2028">2028</option>
              </select>

              <label className="label">Sort</label>
              <select className="select" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="recommended">Recommended</option>
                <option value="verified">Verified first</option>
                <option value="grad">Grad year (earliest)</option>
              </select>

              <div className="row">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                  />
                  Verified only
                </label>
              </div>

              <div className="divider" />

              <button
                className="btn btn-ghost"
                onClick={() => {
                  setQuery("");
                  setSport("All");
                  setPosition("All");
                  setGradYear("All");
                  setVerifiedOnly(false);
                  setSort("recommended");
                  showToast("Filters reset");
                }}
              >
                Reset filters
              </button>
            </div>

            <div className="panel">
              <div className="panel-title">Quick Actions</div>
              <button className="btn btn-secondary" onClick={() => setTab("shortlist")}>
                <Icon name="star" /> View Shortlist
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setTab("messages");
                  showToast("Opening messages");
                }}
              >
                <Icon name="message" /> Open Messages
              </button>
            </div>

            <div className="panel subtle">
              <div className="panel-title">Pro Tip</div>
              <div className="muted">
                Recruiters love quick info: verified status, grad year, and a clean highlight reel.
              </div>
            </div>
          </aside>
        )}

        {/* Main */}
        <main className="main">
          {tab === "discover" && (
            <>
              <div className="section-head">
                <div>
                  <div className="h2">Discover Athletes</div>
                  <div className="muted">Search, filter, and open profiles. Save prospects to your shortlist.</div>
                </div>
                <div className="chiprow">
                  <Pill tone="neutral">{filtered.length} results</Pill>
                  <Pill tone="primary">Fast & clean UI</Pill>
                </div>
              </div>

              {filtered.length === 0 ? (
                <EmptyState
                  title="No matches found"
                  subtitle="Try removing some filters or searching by location/skill."
                  action={<button className="btn btn-primary" onClick={() => { setQuery(""); showToast("Cleared search"); }}>Clear search</button>}
                />
              ) : (
                <div className="grid">
                  {filtered.map((a) => (
                    <div key={a.id} className="card">
                      <div className="card-top">
                        <div className="avatar">{a.name.split(" ").map((x) => x[0]).slice(0, 2).join("")}</div>
                        <div className="card-meta">
                          <div className="card-name">
                            {a.name}{" "}
                            {a.verified && (
                              <span className="verified" title="Verified">
                                <Icon name="shield" size={16} /> Verified
                              </span>
                            )}
                          </div>
                          <div className="muted">
                            {a.position} • {a.location}
                          </div>
                        </div>

                        <button className="icon-btn" onClick={() => toggleShortlist(a.id)} aria-label="Save">
                          {shortlist.has(a.id) ? <Icon name="starFill" /> : <Icon name="star" />}
                        </button>
                      </div>

                      <div className="card-badges">
                        <Pill tone={badgeForSport(a.sport)}>{a.sport}</Pill>
                        <Pill tone="neutral">Grad {a.gradYear}</Pill>
                        <Pill tone="neutral">GPA {a.gpa}</Pill>
                      </div>

                      <div className="card-bio">{a.bio}</div>

                      <div className="tagrow">
                        {a.tags.slice(0, 3).map((t) => (
                          <span key={t} className="tag">
                            {t}
                          </span>
                        ))}
                      </div>

                      <div className="card-actions">
                        <button className="btn btn-primary" onClick={() => openProfile(a)}>
                          View Profile
                        </button>
                        <button
                          className="btn btn-ghost"
                          onClick={() => {
                            showToast("Copied profile link (mock)");
                            navigator.clipboard?.writeText?.(`https://scoutlinkz.app/athlete/${a.id}`).catch(() => {});
                          }}
                        >
                          Copy Link
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === "shortlist" && (
            <>
              <div className="section-head">
                <div>
                  <div className="h2">Recruiter Shortlist</div>
                  <div className="muted">Your saved prospects in one place.</div>
                </div>
                <div className="chiprow">
                  <Pill tone="neutral">{shortlistAthletes.length} saved</Pill>
                </div>
              </div>

              {shortlistAthletes.length === 0 ? (
                <EmptyState
                  title="Your shortlist is empty"
                  subtitle="Go to Discover and star athletes you want to track."
                  action={<button className="btn btn-primary" onClick={() => setTab("discover")}>Discover Athletes</button>}
                />
              ) : (
                <div className="grid">
                  {shortlistAthletes.map((a) => (
                    <div key={a.id} className="card">
                      <div className="card-top">
                        <div className="avatar">{a.name.split(" ").map((x) => x[0]).slice(0, 2).join("")}</div>
                        <div className="card-meta">
                          <div className="card-name">
                            {a.name}{" "}
                            {a.verified && (
                              <span className="verified">
                                <Icon name="shield" size={16} /> Verified
                              </span>
                            )}
                          </div>
                          <div className="muted">
                            {a.sport} • {a.position} • Grad {a.gradYear}
                          </div>
                        </div>

                        <button className="icon-btn" onClick={() => toggleShortlist(a.id)} aria-label="Remove">
                          <Icon name="starFill" />
                        </button>
                      </div>

                      <div className="card-actions">
                        <button className="btn btn-primary" onClick={() => openProfile(a)}>
                          Open Profile
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => {
                            setTab("messages");
                            showToast(`Starting message to ${a.name} (mock)`);
                          }}
                        >
                          <Icon name="message" /> Message
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === "messages" && (
            <>
              <div className="section-head">
                <div>
                  <div className="h2">Messages</div>
                  <div className="muted">A simple inbox UI (mock) you can wire to a real backend later.</div>
                </div>
              </div>

              <div className="messages">
                <div className="threads">
                  <div className="threads-head">Inbox</div>
                  {threads.map((t) => (
                    <button
                      key={t.id}
                      className={cx("thread", activeThreadId === t.id && "thread-active")}
                      onClick={() => {
                        setActiveThreadId(t.id);
                        setThreads((prev) =>
                          prev.map((x) => (x.id === t.id ? { ...x, unread: 0 } : x))
                        );
                      }}
                    >
                      <div className="thread-top">
                        <div className="thread-with">{t.with}</div>
                        {t.unread > 0 ? <span className="unread">{t.unread}</span> : null}
                      </div>
                      <div className="thread-last">{t.last}</div>
                    </button>
                  ))}
                </div>

                <div className="chat">
                  <div className="chat-head">
                    <div>
                      <div className="chat-title">{activeThread?.with || "Select a thread"}</div>
                      <div className="muted">Keep it professional + clear.</div>
                    </div>
                    <button
                      className="btn btn-ghost"
                      onClick={() => showToast("Video call (mock)")}
                      title="Not implemented"
                    >
                      Start Call
                    </button>
                  </div>

                  <div className="chat-body">
                    <div className="bubble bubble-them">
                      Hey! Can you share your latest clips and schedule?
                    </div>
                    <div className="bubble bubble-me">
                      For sure — I’ll send the highlight reel + next match times tonight.
                    </div>
                    <div className="bubble bubble-them">{activeThread?.last}</div>
                  </div>

                  <div className="chat-compose">
                    <input className="compose-input" placeholder="Write a message…" />
                    <button className="btn btn-primary" onClick={() => showToast("Message sent (mock)")}>
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === "create" && (
            <>
              <div className="section-head">
                <div>
                  <div className="h2">Create Athlete Profile</div>
                  <div className="muted">This is a front-end form UI. Next step is saving to a database.</div>
                </div>
              </div>

              <div className="form">
                <div className="form-grid">
                  <div>
                    <label className="label">Full Name</label>
                    <input
                      className="input"
                      value={profileDraft.name}
                      onChange={(e) => setProfileDraft((p) => ({ ...p, name: e.target.value }))}
                      placeholder="e.g., Joey Nader"
                    />
                  </div>

                  <div>
                    <label className="label">Location</label>
                    <input
                      className="input"
                      value={profileDraft.location}
                      onChange={(e) => setProfileDraft((p) => ({ ...p, location: e.target.value }))}
                      placeholder="e.g., Toronto, ON"
                    />
                  </div>

                  <div>
                    <label className="label">Sport</label>
                    <select
                      className="select"
                      value={profileDraft.sport}
                      onChange={(e) =>
                        setProfileDraft((p) => ({
                          ...p,
                          sport: e.target.value,
                          position: (POSITIONS_BY_SPORT[e.target.value] || [])[0] || "—",
                        }))
                      }
                    >
                      <option>Soccer</option>
                      <option>Basketball</option>
                      <option>Hockey</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">Position</label>
                    <select
                      className="select"
                      value={profileDraft.position}
                      onChange={(e) => setProfileDraft((p) => ({ ...p, position: e.target.value }))}
                    >
                      {(POSITIONS_BY_SPORT[profileDraft.sport] || ["—"]).map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label">Grad Year</label>
                    <input
                      className="input"
                      type="number"
                      min={2025}
                      max={2035}
                      value={profileDraft.gradYear}
                      onChange={(e) => setProfileDraft((p) => ({ ...p, gradYear: Number(e.target.value) }))}
                    />
                  </div>

                  <div>
                    <label className="label">GPA (optional)</label>
                    <input
                      className="input"
                      value={profileDraft.gpa}
                      onChange={(e) => setProfileDraft((p) => ({ ...p, gpa: e.target.value }))}
                      placeholder="e.g., 3.7"
                    />
                  </div>

                  <div className="span-2">
                    <label className="label">Bio</label>
                    <textarea
                      className="textarea"
                      value={profileDraft.bio}
                      onChange={(e) => setProfileDraft((p) => ({ ...p, bio: e.target.value }))}
                      placeholder="Write a short, recruiter-friendly bio…"
                    />
                  </div>

                  <div className="span-2">
                    <label className="label">Highlights (mock uploader)</label>
                    <div className="uploader">
                      <div className="uploader-left">
                        <div className="uploader-title">Drop highlight links</div>
                        <div className="muted">Later: integrate YouTube/TikTok uploads + storage.</div>
                      </div>
                      <button className="btn btn-secondary" onClick={() => showToast("Upload coming soon")}>
                        Add Highlight
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      showToast("Profile saved (mock)");
                      setTab("discover");
                    }}
                  >
                    Save Profile
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => {
                      setProfileDraft({
                        name: "",
                        sport: "Soccer",
                        position: "Goalkeeper",
                        gradYear: 2026,
                        location: "",
                        bio: "",
                        gpa: "",
                      });
                      showToast("Cleared form");
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      <footer className="footer">
        <div className="muted">
          © {new Date().getFullYear()} ScoutLinkz • Built with React • Next: auth + database + video hosting
        </div>
        <div className="footer-right">
          <Pill tone="neutral">v0 UI</Pill>
          <Pill tone="primary">Dark mode</Pill>
        </div>
      </footer>

      <Modal
        open={!!selected}
        title={selected ? selected.name : ""}
        onClose={closeProfile}
        footer={
          selected ? (
            <>
              <button className="btn btn-secondary" onClick={() => { toggleShortlist(selected.id); }}>
                {shortlist.has(selected.id) ? "Remove from Shortlist" : "Save to Shortlist"}
              </button>
              <button className="btn btn-primary" onClick={() => { setTab("messages"); closeProfile(); showToast("Message started (mock)"); }}>
                <Icon name="message" /> Contact
              </button>
            </>
          ) : null
        }
      >
        {selected ? (
          <div className="profile">
            <div className="profile-head">
              <div className="profile-left">
                <div className="avatar big">{selected.name.split(" ").map((x) => x[0]).slice(0, 2).join("")}</div>
                <div>
                  <div className="profile-name">
                    {selected.name} {selected.verified ? <Pill tone="primary">Verified</Pill> : <Pill tone="neutral">Unverified</Pill>}
                  </div>
                  <div className="muted">
                    {selected.sport} • {selected.position} • Grad {selected.gradYear} • {selected.location}
                  </div>
                  <div className="profile-badges">
                    <Pill tone={badgeForSport(selected.sport)}>{selected.sport}</Pill>
                    <Pill tone="neutral">GPA {selected.gpa}</Pill>
                    <Pill tone="neutral">{selected.height}</Pill>
                    <Pill tone="neutral">{selected.weight}</Pill>
                    {selected.foot !== "—" ? <Pill tone="neutral">{selected.foot} foot</Pill> : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="profile-grid">
              <div className="profile-card">
                <div className="card-title">About</div>
                <div className="profile-text">{selected.bio}</div>
                <div className="tagrow" style={{ marginTop: 12 }}>
                  {selected.tags.map((t) => (
                    <span className="tag" key={t}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="profile-card">
                <div className="card-title">Key Stats</div>
                <div className="stats-grid">
                  {selected.stats.map((s) => (
                    <Stat key={s.label} label={s.label} value={s.value} />
                  ))}
                </div>
              </div>

              <div className="profile-card span-2">
                <div className="card-title">Highlight Reel</div>
                <div className="highlights">
                  {selected.highlights.map((h, idx) => (
                    <button
                      key={idx}
                      className="highlight"
                      onClick={() => showToast("Open highlight (mock)")}
                      title="Wire to real video links later"
                    >
                      <div className="highlight-thumb">▶</div>
                      <div className="highlight-info">
                        <div className="highlight-title">{h.title}</div>
                        <div className="muted">Click to open • {h.type}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="profile-card span-2">
                <div className="card-title">Contact</div>
                <div className="contact">
                  <div>
                    <div className="muted">Email</div>
                    <div className="contact-value">{selected.contact.email}</div>
                  </div>
                  <div>
                    <div className="muted">Phone</div>
                    <div className="contact-value">{selected.contact.phone}</div>
                  </div>
                  <button className="btn btn-primary" onClick={() => showToast("Copied email (mock)")}>
                    Copy Email
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}

const styles = `
:root{
  --bg:#0b1220;
  --panel:#0f172a;
  --panel2:#0b1326;
  --border:#22304a;
  --text:#e6edf7;
  --muted:#98a7c2;
  --primary:#4f46e5;
  --primary2:#4338ca;
  --accent:#06b6d4;
  --good:#22c55e;
  --shadow: 0 12px 30px rgba(0,0,0,.35);
}
*{box-sizing:border-box}
html,body{height:100%}
body{margin:0;background:var(--bg);color:var(--text);font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;}
button,input,select,textarea{font-family:inherit}
.app{min-height:100vh;display:flex;flex-direction:column}
.topbar{
  display:flex;align-items:center;justify-content:space-between;
  padding:18px 22px;border-bottom:1px solid var(--border);
  background:linear-gradient(180deg, rgba(79,70,229,.12), rgba(15,23,42,.2));
  position:sticky;top:0;z-index:5;
}
.brand{display:flex;align-items:center;gap:12px}
.logo{
  width:44px;height:44px;border-radius:14px;display:grid;place-items:center;
  background:rgba(79,70,229,.18);border:1px solid rgba(79,70,229,.35);
  box-shadow:0 10px 24px rgba(79,70,229,.12);
}
.brand-name{font-weight:800;letter-spacing:.2px;font-size:18px}
.brand-tag{color:var(--muted);font-size:12.5px;margin-top:2px}
.header-right{display:flex;align-items:center;gap:12px;min-width:520px;max-width:780px;width:55%}
.search{position:relative;flex:1}
.search-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--muted)}
.search-input{
  width:100%;padding:12px 12px 12px 40px;border-radius:14px;
  background:rgba(15,23,42,.7);border:1px solid var(--border);
  color:var(--text);outline:none;
}
.search-input:focus{border-color:rgba(79,70,229,.7);box-shadow:0 0 0 4px rgba(79,70,229,.12)}
.tabs{
  display:flex;gap:10px;align-items:center;
  padding:12px 18px;border-bottom:1px solid var(--border);
  background:rgba(15,23,42,.55);
}
.tab{
  padding:10px 12px;border-radius:12px;
  background:transparent;border:1px solid transparent;
  color:var(--muted);cursor:pointer;font-weight:600;
}
.tab:hover{background:rgba(255,255,255,.03);color:var(--text)}
.tab-active{background:rgba(79,70,229,.14);border-color:rgba(79,70,229,.35);color:var(--text)}
.tab-count{
  margin-left:8px;background:rgba(255,255,255,.06);
  border:1px solid var(--border);padding:2px 8px;border-radius:999px;font-size:12px
}
.tab-dot{margin-left:8px;color:var(--accent)}
.layout{
  display:grid;grid-template-columns: 320px 1fr;gap:18px;
  padding:18px;max-width:1200px;width:100%;margin:0 auto;flex:1;
}
.sidebar{display:flex;flex-direction:column;gap:14px}
.main{min-width:0}
.panel{
  background:rgba(15,23,42,.72);
  border:1px solid var(--border);border-radius:18px;padding:14px;
  box-shadow:0 10px 24px rgba(0,0,0,.18);
}
.panel.subtle{background:rgba(15,23,42,.5)}
.panel-title{font-weight:800;margin-bottom:10px}
.label{display:block;color:var(--muted);font-size:12.5px;margin:10px 0 6px}
.select,.input,.textarea{
  width:100%;padding:11px 12px;border-radius:14px;
  background:rgba(11,19,38,.8);border:1px solid var(--border);color:var(--text);outline:none;
}
.textarea{min-height:110px;resize:vertical}
.select:focus,.input:focus,.textarea:focus{border-color:rgba(79,70,229,.7);box-shadow:0 0 0 4px rgba(79,70,229,.12)}
.row{margin-top:10px}
.checkbox{display:flex;align-items:center;gap:10px;color:var(--text);font-size:14px}
.checkbox input{transform:scale(1.1)}
.divider{height:1px;background:var(--border);margin:12px 0}
.section-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:14px}
.h2{font-size:22px;font-weight:900;letter-spacing:.2px}
.muted{color:var(--muted)}
.chiprow{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end}
.grid{display:grid;grid-template-columns: repeat(3, minmax(0,1fr));gap:14px}
.card{
  background:rgba(15,23,42,.72);
  border:1px solid var(--border);border-radius:18px;padding:14px;
  box-shadow:0 10px 24px rgba(0,0,0,.18);
  display:flex;flex-direction:column;gap:10px;min-height:230px;
}
.card-top{display:flex;align-items:flex-start;gap:12px}
.avatar{
  width:44px;height:44px;border-radius:16px;display:grid;place-items:center;
  background:rgba(255,255,255,.06);border:1px solid var(--border);
  font-weight:900;letter-spacing:.5px;
}
.avatar.big{width:64px;height:64px;border-radius:22px;font-size:18px}
.card-meta{flex:1;min-width:0}
.card-name{font-weight:900}
.verified{
  display:inline-flex;align-items:center;gap:6px;
  margin-left:8px;color:var(--good);font-size:12.5px;font-weight:800;
}
.card-badges{display:flex;gap:8px;flex-wrap:wrap}
.card-bio{color:var(--text);opacity:.92;line-height:1.35}
.tagrow{display:flex;gap:8px;flex-wrap:wrap}
.tag{
  font-size:12px;color:var(--text);
  padding:6px 10px;border-radius:999px;
  background:rgba(255,255,255,.06);border:1px solid var(--border);
}
.card-actions{display:flex;gap:10px;margin-top:auto}
.btn{
  display:inline-flex;align-items:center;gap:8px;justify-content:center;
  padding:10px 12px;border-radius:14px;border:1px solid var(--border);
  background:rgba(255,255,255,.04);color:var(--text);cursor:pointer;font-weight:800;
}
.btn:hover{background:rgba(255,255,255,.06)}
.btn-primary{background:linear-gradient(180deg, rgba(79,70,229,.95), rgba(67,56,202,.95));border-color:rgba(79,70,229,.55)}
.btn-primary:hover{filter:brightness(1.03)}
.btn-secondary{background:rgba(6,182,212,.12);border-color:rgba(6,182,212,.35)}
.btn-ghost{background:transparent}
.icon-btn{
  width:40px;height:40px;border-radius:14px;border:1px solid var(--border);
  background:rgba(255,255,255,.03);color:var(--text);cursor:pointer;
  display:grid;place-items:center;flex:0 0 auto;
}
.icon-btn:hover{background:rgba(255,255,255,.06)}
.pill{
  font-size:12px;font-weight:900;
  padding:6px 10px;border-radius:999px;border:1px solid var(--border);
  background:rgba(255,255,255,.05);color:var(--text);
}
.pill-primary{background:rgba(79,70,229,.16);border-color:rgba(79,70,229,.35)}
.pill-accent{background:rgba(6,182,212,.12);border-color:rgba(6,182,212,.35)}
.pill-neutral{background:rgba(255,255,255,.05)}
.footer{
  border-top:1px solid var(--border);
  padding:14px 18px;display:flex;justify-content:space-between;align-items:center;
  background:rgba(15,23,42,.55);
}
.footer-right{display:flex;gap:10px}
.empty{
  margin-top:18px;border:1px dashed rgba(152,167,194,.35);
  border-radius:18px;padding:24px;background:rgba(15,23,42,.45);
}
.empty-title{font-weight:900;font-size:18px}
.empty-subtitle{color:var(--muted);margin-top:6px}
.modal-overlay{
  position:fixed;inset:0;background:rgba(0,0,0,.6);
  display:grid;place-items:center;padding:18px;z-index:50;
}
.modal{
  width:min(920px, 96vw);max-height:92vh;overflow:auto;
  background:rgba(15,23,42,.92);border:1px solid var(--border);
  border-radius:20px;box-shadow:var(--shadow);
}
.modal-header{
  display:flex;justify-content:space-between;gap:10px;align-items:flex-start;
  padding:16px;border-bottom:1px solid var(--border);
}
.modal-title{font-weight:950;font-size:18px}
.modal-subtitle{color:var(--muted);font-size:12px;margin-top:2px}
.modal-body{padding:16px}
.modal-footer{
  padding:14px 16px;border-top:1px solid var(--border);
  display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;
}
.profile-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:14px}
.profile-left{display:flex;gap:12px;align-items:center}
.profile-name{font-weight:950;font-size:18px;display:flex;gap:10px;align-items:center}
.profile-badges{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
.profile-grid{display:grid;grid-template-columns: 1fr 1fr;gap:14px}
.profile-card{
  background:rgba(11,19,38,.65);border:1px solid var(--border);
  border-radius:18px;padding:14px;
}
.profile-card.span-2{grid-column: span 2;}
.card-title{font-weight:900;margin-bottom:10px}
.profile-text{color:var(--text);opacity:.92;line-height:1.45}
.stats-grid{display:grid;grid-template-columns: repeat(4, minmax(0, 1fr));gap:10px}
.stat{
  background:rgba(255,255,255,.05);border:1px solid var(--border);
  border-radius:16px;padding:10px
}
.stat-value{font-weight:950;font-size:16px}
.stat-label{color:var(--muted);font-size:12px;margin-top:4px}
.highlights{display:grid;grid-template-columns: repeat(3, minmax(0, 1fr));gap:10px}
.highlight{
  display:flex;gap:10px;align-items:center;cursor:pointer;text-align:left;
  background:rgba(255,255,255,.04);border:1px solid var(--border);
  border-radius:16px;padding:10px;color:var(--text)
}
.highlight:hover{background:rgba(255,255,255,.06)}
.highlight-thumb{
  width:44px;height:44px;border-radius:14px;display:grid;place-items:center;
  background:rgba(79,70,229,.16);border:1px solid rgba(79,70,229,.3);font-weight:950;
}
.highlight-title{font-weight:900}
.contact{
  display:grid;grid-template-columns: 1fr 1fr auto;gap:12px;align-items:end
}
.contact-value{font-weight:900;margin-top:2px}
.toast{
  position:fixed;bottom:18px;left:50%;transform:translateX(-50%);
  background:rgba(15,23,42,.95);border:1px solid var(--border);
  border-radius:999px;padding:10px 14px;box-shadow:var(--shadow);
  font-weight:800;
}
.messages{
  display:grid;grid-template-columns: 340px 1fr;gap:14px;
}
.threads{
  background:rgba(15,23,42,.72);border:1px solid var(--border);border-radius:18px;
  padding:12px;display:flex;flex-direction:column;gap:8px;
}
.threads-head{font-weight:950;margin-bottom:6px}
.thread{
  text-align:left;cursor:pointer;color:var(--text);
  background:rgba(255,255,255,.03);border:1px solid var(--border);
  border-radius:16px;padding:10px;
}
.thread:hover{background:rgba(255,255,255,.06)}
.thread-active{background:rgba(79,70,229,.12);border-color:rgba(79,70,229,.35)}
.thread-top{display:flex;align-items:center;justify-content:space-between;gap:10px}
.thread-with{font-weight:900}
.thread-last{color:var(--muted);font-size:12.5px;margin-top:4px}
.unread{
  background:rgba(79,70,229,.22);border:1px solid rgba(79,70,229,.35);
  border-radius:999px;padding:2px 8px;font-size:12px;font-weight:950;
}
.chat{
  background:rgba(15,23,42,.72);border:1px solid var(--border);border-radius:18px;
  display:flex;flex-direction:column;min-height:520px;overflow:hidden;
}
.chat-head{
  padding:12px 14px;border-bottom:1px solid var(--border);
  display:flex;align-items:flex-start;justify-content:space-between;gap:10px
}
.chat-title{font-weight:950}
.chat-body{padding:14px;display:flex;flex-direction:column;gap:10px;flex:1;overflow:auto}
.bubble{
  max-width:76%;padding:10px 12px;border-radius:16px;border:1px solid var(--border);
}
.bubble-them{align-self:flex-start;background:rgba(255,255,255,.04)}
.bubble-me{align-self:flex-end;background:rgba(79,70,229,.14);border-color:rgba(79,70,229,.35)}
.chat-compose{
  padding:12px;border-top:1px solid var(--border);
  display:flex;gap:10px;align-items:center
}
.compose-input{
  flex:1;padding:11px 12px;border-radius:14px;border:1px solid var(--border);
  background:rgba(11,19,38,.8);color:var(--text);outline:none;
}
.form{
  background:rgba(15,23,42,.72);border:1px solid var(--border);border-radius:18px;padding:14px;
}
.form-grid{display:grid;grid-template-columns: 1fr 1fr;gap:12px}
.form-grid .span-2{grid-column: span 2;}
.uploader{
  display:flex;justify-content:space-between;gap:12px;align-items:center;
  padding:12px;border-radius:16px;border:1px dashed rgba(152,167,194,.35);
  background:rgba(11,19,38,.55)
}
.uploader-title{font-weight:950}
.form-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:12px}
@media (max-width: 1100px){
  .grid{grid-template-columns: repeat(2, minmax(0,1fr))}
  .layout{grid-template-columns: 1fr}
  .header-right{min-width:0;width:100%}
}
@media (max-width: 720px){
  .grid{grid-template-columns: 1fr}
  .messages{grid-template-columns: 1fr}
  .stats-grid{grid-template-columns: repeat(2, minmax(0,1fr))}
  .highlights{grid-template-columns: 1fr}
  .profile-card.span-2{grid-column: span 1;}
  .profile-grid{grid-template-columns: 1fr}
  .contact{grid-template-columns: 1fr}
  .topbar{flex-direction:column;align-items:stretch;gap:12px}
}
`;
