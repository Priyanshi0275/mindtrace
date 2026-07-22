"""
Deterministic, non-LLM trend computation (SRS section 10 -- explicitly NOT
an LLM job; classic rolling-average / change-point style statistics).
"""

from collections import defaultdict
from datetime import timedelta

from django.utils import timezone

from apps.journal.models import EmotionTag, TrendSnapshot


def recompute_trends_for_user(user):
    today = timezone.now().date()
    week_start = today - timedelta(days=today.weekday())
    prev_week_start = week_start - timedelta(days=7)

    this_week_scores = _avg_scores_for_week(user, week_start)
    prev_week_scores = _avg_scores_for_week(user, prev_week_start)

    for label, avg_score in this_week_scores.items():
        prev = prev_week_scores.get(label, 0.0)
        change_flag = avg_score - prev > 0.15  # simple, explainable threshold

        TrendSnapshot.objects.update_or_create(
            user=user,
            week_start=week_start,
            emotion_label=label,
            defaults={"avg_score": avg_score, "change_flag": change_flag},
        )


def _avg_scores_for_week(user, week_start):
    week_end = week_start + timedelta(days=7)
    tags = EmotionTag.objects.filter(
        entry__user=user,
        entry__entry_date__gte=week_start,
        entry__entry_date__lt=week_end,
    )
    totals = defaultdict(list)
    for t in tags:
        totals[t.emotion_label].append(t.score)
    return {label: sum(scores) / len(scores) for label, scores in totals.items()}
