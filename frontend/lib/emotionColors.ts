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

// Soft, human phrasing instead of clinical percentages. This is deliberate:
// "Sadness · 0.74, Anger · 0.12" reads like a lab printout. A journal
// should read like someone actually noticed how you were doing.
const MOOD_PHRASE: Record<string, { primary: string; trace: string }> = {
  joy: { primary: "Mostly lighter today", trace: "a little joy" },
  happy: { primary: "Mostly lighter today", trace: "a little joy" },
  calm: { primary: "Feeling pretty steady", trace: "some calm" },
  neutral: { primary: "An even-keeled day", trace: "some neutrality" },
  sadness: { primary: "Carrying something heavy", trace: "a trace of sadness" },
  sad: { primary: "Carrying something heavy", trace: "a trace of sadness" },
  anger: { primary: "Some real frustration today", trace: "a flicker of frustration" },
  angry: { primary: "Some real frustration today", trace: "a flicker of frustration" },
  anxiety: { primary: "A bit on edge", trace: "some unease" },
  anxious: { primary: "A bit on edge", trace: "some unease" },
  fear: { primary: "Feeling unsettled", trace: "some unease" },
  disgust: { primary: "Something didn't sit right", trace: "a little discomfort" },
  surprise: { primary: "Caught off guard today", trace: "a bit of surprise" },
};

export function describeMood(tags: { emotion_label: string; score: number }[]): string {
  if (!tags || tags.length === 0) return "";
  const sorted = [...tags].sort((a, b) => b.score - a.score);
  const top = sorted[0];
  const second = sorted[1];

  const topPhrase = MOOD_PHRASE[top.emotion_label?.toLowerCase()]?.primary || "A mixed day";

  if (second && second.score > 0.15 && second.emotion_label !== top.emotion_label) {
    const secondPhrase = MOOD_PHRASE[second.emotion_label?.toLowerCase()]?.trace || "something else underneath";
    return `${topPhrase}, with ${secondPhrase} underneath.`;
  }
  return `${topPhrase}.`;
}
