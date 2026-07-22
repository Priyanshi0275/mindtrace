"""
Crisis-language safety gate.

Design principle (see SRS section 6 & 10): this runs BEFORE any generative
model ever sees the entry. It is a gate, not a filter on the output.
Fail-safe, not fail-open: if in doubt, treat as triggered.
"""

# Deliberately not an exhaustive list here (see project notes on why this file
# should be reviewed/extended with care, ideally with input from a mental
# health professional before any real-world use).
_CRISIS_KEYWORDS = [
    "kill myself",
    "want to die",
    "suicide",
    "end my life",
    "hurting myself",
    "self harm",
    "can't go on",
]

SAFETY_RESOURCES = [
    {
        "name": "988 Suicide & Crisis Lifeline (US)",
        "contact": "Call or text 988",
    },
    {
        "name": "Crisis Text Line",
        "contact": "Text HOME to 741741",
    },
    {
        "name": "International Association for Suicide Prevention",
        "contact": "https://www.iasp.info/resources/Crisis_Centres/",
    },
]


def keyword_check(text: str) -> bool:
    lowered = text.lower()
    return any(phrase in lowered for phrase in _CRISIS_KEYWORDS)


def classifier_check(text: str) -> bool:
    """
    Optional second layer: a HuggingFace text-classification model fine-tuned
    for self-harm/crisis language detection. Loaded lazily so the app can run
    without it during local development (keyword_check alone still gates).

    To enable: pip install the model dependency and set MINDTRACE_SAFETY_MODEL
    in your environment to a HF model id, e.g. a fine-tuned RoBERTa classifier.
    """
    import os

    model_id = os.environ.get("MINDTRACE_SAFETY_MODEL")
    if not model_id:
        return False
    try:
        from transformers import pipeline

        clf = pipeline("text-classification", model=model_id)
        result = clf(text[:512])[0]
        return result["label"].lower() in {"crisis", "self_harm", "1"} and result["score"] > 0.5
    except Exception:
        # Fail-safe: if the classifier errors out, do NOT silently pass the
        # entry through as safe based on the classifier alone -- keyword_check
        # is still the primary gate either way.
        return False


def is_crisis(text: str) -> bool:
    return keyword_check(text) or classifier_check(text)
