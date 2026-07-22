from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.journal.models import CrisisFlag, EmotionTag, EntryEmbedding, JournalEntry

from .serializers import RegisterSerializer

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/ -- public endpoint to create a new account."""

    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


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
        # Explicit cascade of the most sensitive tables first, then the user itself.
        JournalEntry.objects.filter(user=user).delete()  # cascades EmotionTag/EntryEmbedding/CrisisFlag
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
