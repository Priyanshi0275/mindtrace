"""
The core reflection agent (SRS sections 10-12).

Pipeline: safety check on the question itself -> hybrid/recency-aware
retrieval -> prompt assembly with citations -> LLM call -> grounded answer.
"""

from pathlib import Path

from django.conf import settings

from apps.safety.detector import SAFETY_RESOURCES, is_crisis
from apps.search.retrieval import retrieve_relevant_entries

from . import memory
from .client import get_client

_PROMPT_PATH = Path(__file__).parent / "prompts" / "reflection_v1.txt"
_PROMPT_TEMPLATE = _PROMPT_PATH.read_text()


def ask(user, question: str, session_id: str) -> dict:
    # A user could disclose crisis intent inside a question, not just an
    # entry -- the safety gate runs here too, before any LLM call.
    if is_crisis(question):
        return {
            "status": "safety_response",
            "message": (
                "It looks like you might be going through something really "
                "difficult right now. Here are some resources that can help."
            ),
            "resources": SAFETY_RESOURCES,
            "agent_bypassed": True,
        }

    entries = retrieve_relevant_entries(user, question, top_k=6, recent_days=None)

    if not entries:
        return {
            "status": "ok",
            "answer": (
                "I don't have any journal entries to draw from yet -- write "
                "a few entries first and then ask me again."
            ),
            "citations": [],
            "session_id": session_id,
        }

    context_lines = []
    for e in entries:
        context_lines.append(f"[{e.entry_date}] {e.raw_text}")
    context = "\n\n".join(context_lines)

    prompt = _PROMPT_TEMPLATE.format(context=context, question=question)

    history = memory.get_history(session_id)
    messages = [{"role": "system", "content": prompt}] + history + [
        {"role": "user", "content": question}
    ]

    client = get_client()
    response = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=messages,
    )
    answer = response.choices[0].message.content

    memory.append_message(session_id, "user", question)
    memory.append_message(session_id, "assistant", answer)

    return {
        "status": "ok",
        "answer": answer,
        "citations": [
            {"entry_id": str(e.id), "entry_date": str(e.entry_date)} for e in entries
        ],
        "session_id": session_id,
    }
