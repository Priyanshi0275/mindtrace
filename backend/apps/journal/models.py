import uuid

from django.conf import settings
from django.db import models
from pgvector.django import HnswIndex, VectorField


class JournalEntry(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="entries"
    )
    raw_text = models.TextField()
    audio_url_temp = models.CharField(max_length=512, blank=True, null=True)
    entry_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["user", "entry_date"])]
        ordering = ["-entry_date"]

    def __str__(self):
        return f"Entry({self.user_id}, {self.entry_date})"


class EmotionTag(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    entry = models.ForeignKey(
        JournalEntry, on_delete=models.CASCADE, related_name="emotion_tags"
    )
    emotion_label = models.CharField(max_length=64)
    score = models.FloatField()


class EntryEmbedding(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    entry = models.OneToOneField(
        JournalEntry, on_delete=models.CASCADE, related_name="embedding"
    )
    # all-MiniLM-L6-v2 (sentence-transformers) produces 384-dim vectors.
    # Swap to VectorField(dim=768) if you use a larger encoder like all-mpnet-base-v2.
    vector = VectorField(dimensions=384)

    class Meta:
        indexes = [
            HnswIndex(
                name="entry_embedding_hnsw",
                fields=["vector"],
                m=16,
                ef_construction=64,
                opclasses=["vector_cosine_ops"],
            )
        ]


class CrisisFlag(models.Model):
    """Append-only by convention (never delete/update from application code)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    entry = models.ForeignKey(
        JournalEntry, on_delete=models.CASCADE, related_name="crisis_flags"
    )
    triggered_at = models.DateTimeField(auto_now_add=True)
    resolved = models.BooleanField(default=False)


class TrendSnapshot(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="trend_snapshots"
    )
    week_start = models.DateField()
    emotion_label = models.CharField(max_length=64)
    avg_score = models.FloatField()
    change_flag = models.BooleanField(default=False)

    class Meta:
        unique_together = ("user", "week_start", "emotion_label")


class AgentSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="agent_sessions"
    )
    session_id = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)


class AgentMessage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        AgentSession, on_delete=models.CASCADE, related_name="messages"
    )
    role = models.CharField(max_length=16)  # "user" | "assistant"
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
