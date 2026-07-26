from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.journal.models import CrisisFlag, EmotionTag, EntryEmbedding, JournalEntry

from .models import UserProfile
from .serializers import MeSerializer, MoodCheckinSerializer, RegisterSerializer

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/ -- public endpoint to create a new account."""

    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class MeView(APIView):
    """GET /api/auth/me/ -- who's logged in, for the nav avatar/profile menu."""

    def get(self, request):
        return Response(MeSerializer(request.user).data)


class MoodCheckinView(APIView):
    """POST /api/auth/mood-checkin/ -- quick one-word self-check-in."""

    def post(self, request):
        serializer = MoodCheckinSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        profile.current_mood = serializer.validated_data["mood"]
        profile.current_mood_set_at = timezone.now()
        profile.save()
        return Response({"current_mood": profile.current_mood})


class AccountExportView(APIView):
    """GET /api/auth/export/ -- full self-service data export (SRS requirement #9)."""

    def get(self, request):
        user = request.user
        entries = JournalEntry.objects.filter(user=user).order_by("entry_date")
        data = {
            "email": user.email,
            "entries": [
                {
                    "id": str(e.id),
                    "date": str(e.entry_date),
                    "text": e.raw_text,
                    "emotions": list(
                        EmotionTag.objects.filter(entry=e).values(
                            "emotion_label", "score"
                        )
                    ),
                }
                for e in entries
            ],
        }
        return Response(data)


class AccountDeleteView(APIView):
    """DELETE /api/auth/account/ -- full account + data deletion, cascades everywhere."""

    def delete(self, request):
        user = request.user
        JournalEntry.objects.filter(user=user).delete()  # cascades EmotionTag/EntryEmbedding/CrisisFlag
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
