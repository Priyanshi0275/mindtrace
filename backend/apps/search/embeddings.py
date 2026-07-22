"""
Sentence-Transformers embedding service. Runs locally, no API calls, no cost.
"""

from functools import lru_cache

MODEL_NAME = "all-MiniLM-L6-v2"  # 384-dim, small & fast; good for a laptop


@lru_cache(maxsize=1)
def _get_model():
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(MODEL_NAME)


def embed_text(text: str) -> list[float]:
    model = _get_model()
    vector = model.encode(text, normalize_embeddings=True)
    return vector.tolist()
