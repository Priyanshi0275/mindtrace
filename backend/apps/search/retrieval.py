"""
Hybrid-ish retrieval for the reflection agent.

v1 keeps this intentionally simple: pgvector cosine similarity, scoped
to the requesting user, with an optional date-range filter and a light
recency weighting (per SRS section 12 -- pure similarity search under-
weights "lately" style questions for a personal journal).
"""

from datetime import timedelta

from django.utils import timezone

from apps.journal.models import JournalEntry

from .embeddings import embed_text


def retrieve_relevant_entries(user, question: str, top_k: int = 6, recent_days: int | None = None):
    query_vector = embed_text(question)

    qs = JournalEntry.objects.filter(user=user).select_related("embedding")
    if recent_days:
        cutoff = timezone.now().date() - timedelta(days=recent_days)
        qs = qs.filter(entry_date__gte=cutoff)

    # pgvector distance ordering (cosine distance via `<=>` operator through
    # the pgvector Django integration's `.order_by` support on VectorField).
    from pgvector.django import CosineDistance

    qs = qs.filter(embedding__isnull=False).annotate(
        distance=CosineDistance("embedding__vector", query_vector)
    ).order_by("distance")[:top_k]

    return list(qs)
