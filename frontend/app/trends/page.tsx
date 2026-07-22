"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

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
    <div>
      <h1>Trends</h1>
      <p style={{ color: "#666" }}>
        Computed weekly by a Celery beat job (Celery task, not an LLM call) --
        see apps/trends/compute.py.
      </p>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {trends.length === 0 && !error && <p>No trend data yet -- write a few entries across different weeks first.</p>}
      {trends.map((t, i) => (
        <div key={i} className="entry-card">
          <strong>{t.week_start}</strong> — {t.emotion_label}: {t.avg_score.toFixed(2)}
          {t.change_flag && <span style={{ color: "#c0392b", marginLeft: 8 }}>▲ significant change</span>}
        </div>
      ))}
    </div>
  );
}
