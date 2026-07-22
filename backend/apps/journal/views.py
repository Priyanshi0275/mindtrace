import uuid

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.agents.reflection_agent import ask as agent_ask

from .models import AgentSession, JournalEntry, TrendSnapshot
from .serializers import (
    AskSerializer,
    JournalEntryCreateSerializer,
    JournalEntrySerializer,
    TrendSnapshotSerializer,
)
from .tasks import process_entry


class JournalEntryViewSet(viewsets.ModelViewSet):
    """
    /api/entries/            GET (list, filterable by ?from=&to=), POST (create)
    /api/entries/{id}/       GET, DELETE
    """

    serializer_class = JournalEntrySerializer

    def get_queryset(self):
        # Strict per-user isolation at the queryset level (SRS section 20 --
        # this is the primary defense against any cross-user data leak).
        qs = JournalEntry.objects.filter(user=self.request.user)
        date_from = self.request.query_params.get("from")
        date_to = self.request.query_params.get("to")
        if date_from:
            qs = qs.filter(entry_date__gte=date_from)
        if date_to:
            qs = qs.filter(entry_date__lte=date_to)
        return qs

    def get_serializer_class(self):
        if self.action == "create":
            return JournalEntryCreateSerializer
        return JournalEntrySerializer

    def perform_create(self, serializer):
        entry = serializer.save(user=self.request.user)
        # Kick off the async pipeline: safety check -> emotion tag -> embed.
        process_entry.delay(str(entry.id))


class TrendsView(viewsets.ViewSet):
    def list(self, request):
        snapshots = TrendSnapshot.objects.filter(user=request.user).order_by("-week_start")[:12]
        return Response(TrendSnapshotSerializer(snapshots, many=True).data)


class ReflectViewSet(viewsets.ViewSet):
    throttle_scope = "reflect"

    @action(detail=False, methods=["post"], url_path="ask")
    def ask(self, request):
        serializer = AskSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        session_id = serializer.validated_data.get("session_id") or str(uuid.uuid4())

        AgentSession.objects.get_or_create(
            session_id=session_id, defaults={"user": request.user}
        )

        result = agent_ask(request.user, serializer.validated_data["question"], session_id)
        return Response(result)

    @action(detail=False, methods=["post"], url_path="session/new")
    def new_session(self, request):
        session_id = str(uuid.uuid4())
        AgentSession.objects.create(user=request.user, session_id=session_id)
        return Response({"session_id": session_id}, status=status.HTTP_201_CREATED)
