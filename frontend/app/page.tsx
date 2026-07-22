"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Entry = {
  id: string;
  raw_text: string;
  entry_date: string;
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
      // Tagging happens async in Celery -- refresh after a short delay so
      // the demo shows the pipeline finishing, not just an empty entry.
      setTimeout(loadEntries, 4000);
      loadEntries();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>Today</h1>
      <form onSubmit={submitEntry}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write about your day..."
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save entry"}
        </button>
      </form>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      <h2 style={{ marginTop: "2rem" }}>Past entries</h2>
      {entries.map((entry) => (
        <div key={entry.id} className={`entry-card ${entry.is_flagged ? "flagged" : ""}`}>
          <strong>{entry.entry_date}</strong>
          <p>{entry.raw_text}</p>
          <div>
            {entry.emotion_tags.map((t) => (
              <span
                key={t.emotion_label}
                style={{
                  marginRight: 8,
                  fontSize: "0.8rem",
                  background: "#eee",
                  padding: "2px 8px",
                  borderRadius: 12,
                }}
              >
                {t.emotion_label} ({t.score.toFixed(2)})
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
