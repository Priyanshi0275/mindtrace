"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { describeMood, emotionStyle } from "@/lib/emotionColors";

type Entry = {
  id: string;
  raw_text: string;
  entry_date: string;
  created_at: string;
  emotion_tags: { emotion_label: string; score: number }[];
  is_flagged: boolean;
};

export default function JournalPage() {
  const [text, setText] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadEntries() {
    try {
      const data = await apiFetch("/api/entries/");
      setEntries(data);
      setError("");
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => {
    loadEntries();
  }, []);

  async function submitEntry(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const today = new Date().toISOString().split("T")[0];
      await apiFetch("/api/entries/", {
        method: "POST",
        body: JSON.stringify({ raw_text: text, entry_date: today }),
      });
      setText("");
      loadEntries();
      setTimeout(loadEntries, 5000); // pick up tags once Celery finishes
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function topEmotion(entry: Entry) {
    if (!entry.emotion_tags?.length) return null;
    return [...entry.emotion_tags].sort((a, b) => b.score - a.score)[0];
  }

  function formatTimestamp(iso: string) {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return (
    <div className="page-shell">
      <span className="eyebrow">Today · {new Date().toLocaleDateString(undefined, { weekday: "long" })}</span>
      <h1 className="hero-title">What's true today?</h1>
      <p className="hero-sub">
        Write freely — no one grades this. Patterns show up on their own, over time.
      </p>

      <form onSubmit={submitEntry}>
        <textarea
          className="journal-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Start anywhere. A sentence is enough..."
          required
        />
        <div style={{ marginTop: "0.9rem" }}>
          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save entry"}
          </button>
        </div>
      </form>

      {error && <div className="error-banner">{error}</div>}

      <h2 style={{ marginTop: "2.75rem", fontSize: "1.3rem" }}>Your trace</h2>

      {entries.length === 0 && !error && (
        <div className="empty-state" style={{ marginTop: "1rem" }}>
          Nothing here yet — your first entry will start your trace.
        </div>
      )}

      <div className="timeline">
        {entries.map((entry) => {
          const top = topEmotion(entry);
          const style = top ? emotionStyle(top.emotion_label) : null;
          const mood = describeMood(entry.emotion_tags);

          return (
            <div
              key={entry.id}
              className={`entry-card ${entry.is_flagged ? "flagged" : ""}`}
              style={{ ["--dot-color" as any]: style?.color }}
            >
              <span className="entry-date mono">
                {formatTimestamp(entry.created_at || entry.entry_date)}
              </span>
              <p className="entry-text">{entry.raw_text}</p>

              {mood ? (
                <p className="mood-line" style={{ color: style?.color }}>
                  {mood}
                </p>
              ) : entry.is_flagged ? null : (
                <p className="mood-line" style={{ color: "#A69EBE" }}>
                  Still reading this one...
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
