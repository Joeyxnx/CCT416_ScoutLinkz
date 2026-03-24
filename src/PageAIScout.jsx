// ═══════════════════════════════════════════════════════════════
// PageAIScout — AI-powered athlete search for scouts
// Drop this component into your ScoutLinkz app and add it to NAV.
//
// USAGE in ScoutDashboard:
//   1. Import: import PageAIScout from "./PageAIScout";
//   2. Add to NAV array: { key:"ai", icon:"✦", label:"AI Scout" }
//   3. Add render: {page === "ai" && <PageAIScout athletes={athletes} onViewAthlete={handleViewAthlete} />}
// ═══════════════════════════════════════════════════════════════

import { useState, useRef, useEffect } from "react";

// ── Tiny markdown → plain bold renderer (no deps) ─────────────
function MiniMarkdown({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**")
          ? <strong key={i} style={{ color: "#e2e8f0", fontWeight: 700 }}>{p.slice(2, -2)}</strong>
          : <span key={i}>{p}</span>
      )}
    </span>
  );
}

// ── Typing indicator ──────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 5, padding: "14px 16px", alignItems: "center" }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 7, height: 7, borderRadius: "50%", background: "#4f46e5",
          display: "inline-block",
          animation: `aiDot .9s ease-in-out ${i * 0.18}s infinite`,
        }} />
      ))}
    </div>
  );
}

// ── Athlete result card ────────────────────────────────────────
function AthleteCard({ athlete, reason, onView }) {
  return (
    <div style={{
      background: "rgba(15,25,45,.95)", border: "1px solid #1e3352",
      borderRadius: 14, padding: "14px 16px",
      display: "flex", alignItems: "center", gap: 14,
      transition: "border-color .2s",
      cursor: "pointer",
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(99,102,241,.45)"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "#1e3352"}
      onClick={() => onView(athlete)}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: "rgba(99,102,241,.15)", border: "1px solid rgba(99,102,241,.3)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 800, fontSize: 15, color: "#c7d2fe",
      }}>
        {athlete.name?.split(" ").map(x => x[0]).join("") || "?"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: "#f0f6ff" }}>{athlete.name}</div>
        <div style={{ color: "#4d6a8a", fontSize: 12, marginTop: 2 }}>
          {athlete.sport} · {athlete.position} · Grad {athlete.gradYear}
          {athlete.gpa ? ` · GPA ${athlete.gpa}` : ""}
        </div>
        {reason && (
          <div style={{ color: "#818cf8", fontSize: 12, marginTop: 5, fontStyle: "italic", lineHeight: 1.4 }}>
            "{reason}"
          </div>
        )}
      </div>
      <div style={{
        background: "rgba(99,102,241,.1)", border: "1px solid rgba(99,102,241,.25)",
        color: "#c7d2fe", borderRadius: 9, padding: "6px 12px",
        fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0,
      }}>
        View →
      </div>
    </div>
  );
}

// ── Suggestion chips ──────────────────────────────────────────
const SUGGESTIONS = [
  "Find me a goalkeeper with a high GPA",
  "Show strikers graduating in 2026",
  "Who are my top soccer prospects?",
  "Find athletes in Ontario",
  "Best basketball point guards available",
  "Show me athletes with GPA above 3.5",
];

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function PageAIScout({ athletes, onViewAthlete }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hey! I'm your AI scouting assistant. Describe the athlete you're looking for — sport, position, GPA, grad year, location, or anything else — and I'll find the best matches from your athlete pool.",
      athletes: [],
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text) {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput("");

    const userMsg = { role: "user", content: userText };
    const history = [...messages, userMsg];
    setMessages(history);
    setLoading(true);

    try {
      // Build a concise athlete roster for the prompt
      const roster = athletes.map(a => ({
        id: a.id,
        name: a.name,
        sport: a.sport,
        position: a.position,
        gradYear: a.gradYear,
        gpa: a.gpa,
        location: a.location,
        height: a.height,
        weight: a.weight,
        foot: a.foot,
        bio: a.bio?.slice(0, 120),
        stats: a.stats,
        tags: a.tags,
      }));

      const systemPrompt = `You are an expert sports scouting assistant for ScoutLinkz, a platform connecting scouts and coaches with athletes.

You have access to the following athlete roster (${roster.length} athletes):
${JSON.stringify(roster, null, 2)}

When the scout asks about athletes, analyze their request and respond with:
1. A short, friendly paragraph answering their query (2-4 sentences max)
2. If relevant athletes were found, list their IDs in a JSON block at the END of your response like this:
{"matched_ids": ["id1", "id2", "id3"], "reasons": {"id1": "why this athlete matches", "id2": "..."}}

Rules:
- Be conversational and concise
- Only include athletes that genuinely match the request
- Max 6 athlete results
- If no athletes match, say so honestly and suggest what the scout could look for
- Reasons should be one short phrase (e.g. "High GPA + right grad year")
- Never fabricate athletes not in the roster
- If the scout is just chatting (not asking for athletes), respond naturally with no JSON block`;

      const apiMessages = history.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt,
          messages: apiMessages,
        }),
      });

      const data = await res.json();
      const raw = data.content?.[0]?.text || "Sorry, I couldn't process that. Try again!";

      // Parse optional JSON block
      let matchedAthletes = [];
      let reasons = {};
      let displayText = raw;

      const jsonMatch = raw.match(/\{[\s\S]*"matched_ids"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          const ids = parsed.matched_ids || [];
          reasons = parsed.reasons || {};
          matchedAthletes = ids
            .map(id => athletes.find(a => a.id === id || a.uid === id))
            .filter(Boolean)
            .slice(0, 6);
          // Remove JSON block from displayed text
          displayText = raw.replace(jsonMatch[0], "").trim();
        } catch {}
      }

      setMessages(prev => [...prev, {
        role: "assistant",
        content: displayText,
        athletes: matchedAthletes,
        reasons,
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Something went wrong connecting to the AI. Check your network and try again.",
        athletes: [],
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  const isFirstMessage = messages.length === 1;

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "calc(100vh - 61px)",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <style>{`
        @keyframes aiDot {
          0%, 80%, 100% { transform: scale(.7); opacity: .4; }
          40% { transform: scale(1.1); opacity: 1; }
        }
        .ai-input:focus { border-color: rgba(99,102,241,.6) !important; box-shadow: 0 0 0 3px rgba(99,102,241,.12); }
        .ai-chip:hover { border-color: rgba(99,102,241,.5) !important; background: rgba(99,102,241,.12) !important; color: #c7d2fe !important; }
        .ai-send:hover:not(:disabled) { background: linear-gradient(135deg,#4338ca,#6366f1) !important; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(79,70,229,.4) !important; }
      `}</style>

      {/* Header */}
      <div style={{
        padding: "18px 32px", borderBottom: "1px solid #162438",
        display: "flex", alignItems: "center", gap: 14,
        background: "rgba(8,14,26,.97)",
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: "linear-gradient(135deg, rgba(79,70,229,.3), rgba(99,102,241,.15))",
          border: "1px solid rgba(99,102,241,.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18,
        }}>✦</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: "#f0f6ff", letterSpacing: "-.01em" }}>AI Scout Assistant</div>
          <div style={{ color: "#4d6a8a", fontSize: 12, marginTop: 1 }}>
            {athletes.length} athletes in your pool · Powered by Claude
          </div>
        </div>
        <div style={{
          marginLeft: "auto", fontSize: 11, fontWeight: 700, padding: "4px 10px",
          borderRadius: 999, background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.25)",
          color: "#86efac",
        }}>● Live</div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px", display: "flex", flexDirection: "column", gap: 20 }}>

        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start", gap: 10 }}>
            {/* Bubble */}
            <div style={{
              maxWidth: msg.role === "user" ? "70%" : "85%",
              background: msg.role === "user"
                ? "linear-gradient(135deg, rgba(79,70,229,.25), rgba(99,102,241,.15))"
                : "rgba(10,20,38,.9)",
              border: `1px solid ${msg.role === "user" ? "rgba(99,102,241,.3)" : "#1a2d45"}`,
              borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              padding: "13px 16px",
              color: "#d4dff0",
              fontSize: 14,
              lineHeight: 1.65,
            }}>
              {msg.role === "assistant"
                ? <MiniMarkdown text={msg.content} />
                : msg.content}
            </div>

            {/* Athlete cards */}
            {msg.athletes?.length > 0 && (
              <div style={{ width: "100%", maxWidth: 560, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ color: "#4d6a8a", fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 2 }}>
                  {msg.athletes.length} match{msg.athletes.length !== 1 ? "es" : ""} found
                </div>
                {msg.athletes.map(a => (
                  <AthleteCard
                    key={a.id}
                    athlete={a}
                    reason={msg.reasons?.[a.id] || msg.reasons?.[a.uid]}
                    onView={onViewAthlete}
                  />
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display: "flex", alignItems: "flex-start" }}>
            <div style={{
              background: "rgba(10,20,38,.9)", border: "1px solid #1a2d45",
              borderRadius: "18px 18px 18px 4px",
            }}>
              <TypingDots />
            </div>
          </div>
        )}

        {/* Suggestion chips — only on first load */}
        {isFirstMessage && !loading && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
            {SUGGESTIONS.map(s => (
              <button key={s} className="ai-chip"
                onClick={() => sendMessage(s)}
                style={{
                  padding: "8px 14px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                  border: "1px solid #1e3352", background: "rgba(255,255,255,.04)",
                  color: "#4d6a8a", cursor: "pointer", fontFamily: "inherit",
                  transition: "all .15s",
                }}>
                {s}
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{
        padding: "16px 32px", borderTop: "1px solid #162438",
        background: "rgba(8,14,26,.97)",
        display: "flex", gap: 10, alignItems: "flex-end",
      }}>
        <textarea
          ref={inputRef}
          className="ai-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
          }}
          placeholder="Describe who you're looking for… (e.g. 'left-footed winger, GPA 3.5+, graduating 2026')"
          rows={1}
          style={{
            flex: 1, background: "rgba(255,255,255,.05)", border: "1px solid #1e3352",
            borderRadius: 12, color: "#f0f6ff", fontSize: 14, padding: "11px 14px",
            fontFamily: "inherit", outline: "none", resize: "none",
            lineHeight: 1.5, maxHeight: 120, overflowY: "auto",
            transition: "border-color .2s, box-shadow .2s",
          }}
          onInput={e => {
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
          }}
        />
        <button
          className="ai-send"
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          style={{
            background: "linear-gradient(135deg,#4f46e5,#6366f1)",
            border: "none", color: "#fff", borderRadius: 12,
            padding: "11px 20px", fontWeight: 700, fontSize: 14,
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            fontFamily: "inherit", flexShrink: 0,
            opacity: loading || !input.trim() ? 0.5 : 1,
            transition: "all .15s",
            boxShadow: "0 4px 14px rgba(79,70,229,.3)",
          }}
        >
          {loading ? "…" : "Send ↑"}
        </button>
      </div>
    </div>
  );
}
