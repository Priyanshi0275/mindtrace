"""
The core async pipeline (SRS section 18):

    process_entry:
        1. safety_check          -- short-circuits everything below if triggered
        2. tag_emotions
        3. generate_embedding

Fail-safe, not fail-open: if the safety check itself errors out, we treat
the entry as flagged rather than silently letting it through.
"""

from celery import shared_task
from django.utils import timezone

from apps.emotion.tagger import tag_emotions as run_emotion_tagger
from apps.safety.detector import is_crisis
from apps.search.embeddings import embed_text

from .models import CrisisFlag, EmotionTag, EntryEmbedding, JournalEntry


@shared_task
def process_entry(entry_id: str):
    try:
        entry = JournalEntry.objects.get(id=entry_id)
    except JournalEntry.DoesNotExist:
        return {"status": "error", "reason": "entry not found"}

    # --- Step 1: safety gate (runs before anything else touches this entry) ---
    try:
        triggered = is_crisis(entry.raw_text)
    except Exception:
        triggered = True  # fail-safe, not fail-open

    if triggered:
        CrisisFlag.objects.create(entry=entry)
        return {"status": "safety_response", "entry_id": str(entry.id)}

    # --- Step 2: emotion tagging (HuggingFace, local, free) ---
    tags = run_emotion_tagger(entry.raw_text)
    EmotionTag.objects.filter(entry=entry).delete()
    EmotionTag.objects.bulk_create(
        [
            EmotionTag(entry=entry, emotion_label=t["emotion_label"], score=t["score"])
            for t in tags
        ]
    )

    # --- Step 3: embedding (Sentence-Transformers, local, free) ---
    vector = embed_text(entry.raw_text)
    EntryEmbedding.objects.update_or_create(entry=entry, defaults={"vector": vector})

    return {"status": "tagged", "entry_id": str(entry.id), "tagged_at": str(timezone.now())}
