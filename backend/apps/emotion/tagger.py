"""
Emotion tagging service using a HuggingFace multi-label classifier.

Runs locally (no API calls, no cost). Falls back to a tiny rule-based
scorer if `transformers` / model weights aren't available yet, so the
rest of the pipeline (embeddings, agent, etc.) is runnable immediately
without a multi-GB model download during first setup.
"""

from functools import lru_cache

DEFAULT_MODEL = "j-hartmann/emotion-english-distilroberta-base"

_FALLBACK_KEYWORDS = {
    "anxiety": ["anxious", "worried", "nervous", "stressed", "overwhelmed"],
    "sadness": ["sad", "down", "depressed", "lonely", "hopeless"],
    "anger": ["angry", "furious", "frustrated", "irritated"],
    "joy": ["happy", "excited", "grateful", "proud", "glad"],
    "calm": ["calm", "peaceful", "relaxed", "content"],
}


@lru_cache(maxsize=1)
def _get_pipeline():
    from transformers import pipeline

    return pipeline(
        "text-classification", model=DEFAULT_MODEL, top_k=None, truncation=True
    )


def tag_emotions(text: str) -> list[dict]:
    """Returns a list of {"emotion_label": str, "score": float}."""
    try:
        clf = _get_pipeline()
        results = clf(text[:512])
        # transformers with top_k=None returns a list of lists for batched input
        raw = results[0] if isinstance(results[0], list) else results
        return [{"emotion_label": r["label"], "score": float(r["score"])} for r in raw]
    except Exception:
        return _fallback_tag(text)


def _fallback_tag(text: str) -> list[dict]:
    lowered = text.lower()
    tags = []
    for label, keywords in _FALLBACK_KEYWORDS.items():
        hits = sum(1 for kw in keywords if kw in lowered)
        if hits:
            tags.append({"emotion_label": label, "score": min(1.0, 0.3 + 0.2 * hits)})
    if not tags:
        tags.append({"emotion_label": "neutral", "score": 1.0})
    return tags
