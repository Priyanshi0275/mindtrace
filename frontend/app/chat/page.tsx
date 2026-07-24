"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

type Message = { role: "user" | "assistant"; content: string; citations?: any[] };

export default function ChatPage() {
  const [question, setQuestion] = useState("");
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const q = question;
    setMessages((m) => [...m, { role: "user", content: q }]);
    setQuestion("");
    try {
      const data = await apiFetch("/api/reflect/ask/", {
        method: "POST",
        body: JSON.stringify({ question: q, session_id: sessionId }),
      });
      if (data.session_id) setSessionId(data.session_id);

      if (data.status === "safety_response") {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content:
              data.message +
              "\n\n" +
              data.resources.map((r: any) => `${r.name}: ${r.contact}`).join("\n"),
          },
        ]);
      } else {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: data.answer, citations: data.citations },
        ]);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-shell">
      <span className="eyebrow">Grounded only in your own entries</span>
      <h1 className="hero-title">Reflect</h1>
      <p className="hero-sub">
        Ask about your own history. Every message is checked for safety before anything else runs.
      </p>

      {messages.length === 0 && (
        <div className="empty-state">Try: "How have I been feeling this week?"</div>
      )}

      <div style={{ marginTop: "1.25rem" }}>
        {messages.map((m, i) => (
          <div key={i} className={`chat-bubble ${m.role}`}>
            <span className="chat-role">{m.role === "user" ? "You" : "MindTrace"}</span>
            <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
            {m.citations && m.citations.length > 0 && (
              <div className="citation-row">
                {m.citations.map((c: any, idx: number) => (
                  <span key={idx} className="citation-tag">{c.entry_date}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={ask} style={{ display: "flex", gap: "0.6rem", marginTop: "1.25rem" }}>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="How have I been feeling lately?"
          required
          style={{ marginBottom: 0 }}
        />
        <button type="submit" disabled={loading} style={{ flexShrink: 0 }}>
          {loading ? "..." : "Ask"}
        </button>
      </form>
      {error && <div className="error-banner">{error}</div>}
    </div>
  );
}
