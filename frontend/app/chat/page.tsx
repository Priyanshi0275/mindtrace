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
    <div>
      <h1>Reflect</h1>
      <p style={{ color: "#666" }}>
        Ask about your own journal history. Every question is checked by the
        safety gate before anything else runs.
      </p>
      <div>
        {messages.map((m, i) => (
          <div key={i} className="entry-card" style={{ background: m.role === "user" ? "#f0f0ff" : "white" }}>
            <strong>{m.role === "user" ? "You" : "MindTrace"}</strong>
            <p style={{ whiteSpace: "pre-wrap" }}>{m.content}</p>
            {m.citations && m.citations.length > 0 && (
              <div style={{ fontSize: "0.8rem", color: "#888" }}>
                Sources: {m.citations.map((c: any) => c.entry_date).join(", ")}
              </div>
            )}
          </div>
        ))}
      </div>
      <form onSubmit={ask}>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="How have I been feeling lately?"
          required
        />
        <button type="submit" disabled={loading}>{loading ? "Thinking..." : "Ask"}</button>
      </form>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
    </div>
  );
}
