from rest_framework import serializers

from .models import AgentSession, CrisisFlag, EmotionTag, JournalEntry, TrendSnapshot


class EmotionTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmotionTag
        fields = ("emotion_label", "score")


class JournalEntrySerializer(serializers.ModelSerializer):
    emotion_tags = EmotionTagSerializer(many=True, read_only=True)
    is_flagged = serializers.SerializerMethodField()

    class Meta:
        model = JournalEntry
        fields = (
            "id",
            "raw_text",
            "entry_date",
            "created_at",
            "emotion_tags",
            "is_flagged",
        )
        read_only_fields = ("id", "created_at")

    def get_is_flagged(self, obj):
        return CrisisFlag.objects.filter(entry=obj).exists()


class JournalEntryCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = JournalEntry
        fields = ("id", "raw_text", "entry_date")
        read_only_fields = ("id",)


class TrendSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrendSnapshot
        fields = ("week_start", "emotion_label", "avg_score", "change_flag")


class AskSerializer(serializers.Serializer):
    question = serializers.CharField()
    session_id = serializers.CharField(required=False, allow_blank=True)
