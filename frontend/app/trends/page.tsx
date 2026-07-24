"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { emotionStyle } from "@/lib/emotionColors";

type Trend = {
  week_start: string;
  emotion_label: string;
  avg_score: number;
  change_flag: boolean;
};

export default function TrendsPage() {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/api/trends/")
      .then(setTrends)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="page-shell">
      <span className="eyebrow">Weekly, computed on a schedule — not by an LLM</span>
      <h1 className="hero-title">Your trends</h1>
      <p className="hero-sub">
        Each bar is an average across a week's entries. Color always matches the emotion.
      </p>

      {error && <div className="error-banner">{error}</div>}

      {trends.length === 0 && !error && (
        <div className="empty-state">
          No trend data yet — write across a couple of different weeks and check back.
        </div>
      )}

      {trends.map((t, i) => {
        const s = emotionStyle(t.emotion_label);
        return (
          <div key={i} className="trend-row">
            <span className="trend-week mono">
              {new Date(t.week_start).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
            <span className="trend-label" style={{ color: s.color }}>{s.label}</span>
            <div className="trend-bar-track">
              <div
                className="trend-bar-fill"
                style={{ width: `${Math.min(100, t.avg_score * 100)}%`, background: s.color }}
              />
            </div>
            {t.change_flag && <span className="change-flag">▲ shift</span>}
          </div>
        );
      })}
    </div>
  );
}
