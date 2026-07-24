// Central emotion -> color mapping. This is the design's signature system:
// color in this app is never decorative, it always encodes an actual
// detected emotion. Covers both the real HF model's labels (j-hartmann/
// emotion-english-distilroberta-base: anger, disgust, fear, joy, neutral,
// sadness, surprise) and the fallback tagger's labels (anxiety, sadness,
// anger, joy, calm, neutral), so this works regardless of which is active.

export type EmotionStyle = {
  color: string; // solid accent (text/border)
  bg: string; // soft background tint
  label: string; // display name
};

const EMOTION_MAP: Record<string, EmotionStyle> = {
  joy: { color: "#B8860B", bg: "#FFF3D6", label: "Joy" },
  happy: { color: "#B8860B", bg: "#FFF3D6", label: "Joy" },
  calm: { color: "#1E76A8", bg: "#DEF1FA", label: "Calm" },
  neutral: { color: "#1F8A7F", bg: "#DCF6F1", label: "Neutral" },
  sadness: { color: "#4B44C0", bg: "#E7E5FF", label: "Sadness" },
  sad: { color: "#4B44C0", bg: "#E7E5FF", label: "Sadness" },
  anger: { color: "#D14545", bg: "#FFE2E2", label: "Anger" },
  angry: { color: "#D14545", bg: "#FFE2E2", label: "Anger" },
  anxiety: { color: "#8B4FC9", bg: "#F1E4FB", label: "Anxiety" },
  anxious: { color: "#8B4FC9", bg: "#F1E4FB", label: "Anxiety" },
  fear: { color: "#8B4FC9", bg: "#F1E4FB", label: "Fear" },
  disgust: { color: "#5C7A29", bg: "#EAF3D9", label: "Disgust" },
  surprise: { color: "#C9770E", bg: "#FDECD6", label: "Surprise" },
};

const FALLBACK: EmotionStyle = { color: "#6B6480", bg: "#EFEBF7", label: "Unspecified" };

export function emotionStyle(label: string): EmotionStyle {
  return EMOTION_MAP[label?.toLowerCase()] || FALLBACK;
}
