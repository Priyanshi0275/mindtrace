from django.conf import settings
from django.db import models


MOOD_CHOICES = [
    ("happy", "Happy"),
    ("calm", "Calm"),
    ("neutral", "Neutral"),
    ("sad", "Sad"),
    ("anxious", "Anxious"),
    ("angry", "Angry"),
]


class UserProfile(models.Model):
    """Extra fields on top of Django's built-in User model."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile"
    )
    age = models.PositiveSmallIntegerField(null=True, blank=True)
    timezone = models.CharField(max_length=64, default="UTC")
    therapist_share_enabled = models.BooleanField(default=False)
    # A quick, occasional one-word self-check-in -- separate from the real
    # emotion-tagging pipeline, which runs on actual journal text. This is
    # just "how would you describe today," stored plainly, no inference.
    current_mood = models.CharField(max_length=16, choices=MOOD_CHOICES, blank=True)
    current_mood_set_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Profile<{self.user.email}>"
