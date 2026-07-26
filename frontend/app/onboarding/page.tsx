"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitMoodCheckin } from "@/lib/api";
import { emotionStyle } from "@/lib/emotionColors";

const MOODS = [
  { key: "happy", label: "Happy" },
  { key: "calm", label: "Calm" },
  { key: "neutral", label: "Neutral" },
  { key: "sad", label: "Sad" },
  { key: "anxious", label: "Anxious" },
  { key: "angry", label: "Angry" },
];

export default function OnboardingPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function choose(mood: string) {
    setSelected(mood);
    setLoading(true);
    setError("");
    try {
      await submitMoodCheckin(mood);
      router.push("/");
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <div className="page-shell" style={{ maxWidth: 560 }}>
      <span className="eyebrow">Just one quick thing</span>
      <h1 className="hero-title">How have you been feeling lately?</h1>
      <p className="hero-sub">
        One word is enough for now — this is just a starting point, not an entry.
        You can journal properly right after.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.7rem", marginTop: "1.5rem" }}>
        {MOODS.map((m) => {
          const s = emotionStyle(m.key);
          const isSelected = selected === m.key;
          return (
            <button
              key={m.key}
              disabled={loading}
              onClick={() => choose(m.key)}
              style={{
                background: isSelected ? s.color : s.bg,
                color: isSelected ? "white" : s.color,
                boxShadow: "none",
                fontSize: "0.95rem",
                padding: "0.7rem 1.3rem",
              }}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <p style={{ marginTop: "1.75rem" }}>
        <button type="button" className="link-btn" onClick={() => router.push("/")}>
          Skip for now
        </button>
      </p>
    </div>
  );
}
