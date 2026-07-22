"""
Thin wrapper around the OpenAI SDK, pointed at whatever OPENAI_BASE_URL is
configured to. In local/zero-cost development this is Ollama running
Llama 3.1 locally (see .env.example). In production, if you want frontier-
model reasoning quality, this is a one-line env var change to point at
api.openai.com instead -- the agent code itself never changes.
"""

from django.conf import settings
from openai import OpenAI

_client = None


def get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(
            base_url=settings.OPENAI_BASE_URL,
            api_key=settings.OPENAI_API_KEY,
        )
    return _client
