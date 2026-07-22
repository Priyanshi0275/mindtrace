"""
Redis-backed conversational memory, scoped per agent session (SRS section 19).
"""

import json

import redis
from django.conf import settings

_redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

SESSION_TTL_SECONDS = 60 * 60 * 24  # 24h


def _key(session_id: str) -> str:
    return f"agent:session:{session_id}"


def append_message(session_id: str, role: str, content: str):
    key = _key(session_id)
    history = get_history(session_id)
    history.append({"role": role, "content": content})
    _redis_client.set(key, json.dumps(history), ex=SESSION_TTL_SECONDS)


def get_history(session_id: str) -> list[dict]:
    raw = _redis_client.get(_key(session_id))
    return json.loads(raw) if raw else []
