# MindTrace — Zero-Cost Build & Deployment Guide
### Same architecture, same stack, same SRS — $0 end to end

---

## 1. The Core Trick: Keep the OpenAI *Interface*, Swap the *Backend*

The OpenAI Python SDK lets you override `base_url`. This means every agent file in your `apps/agents/` folder (`reflection_agent.py`, prompt files, function-calling schemas, memory logic) stays **exactly as designed in the SRS** — same code, same architecture, same "OpenAI API" story in your resume bullets and interviews. The only change is which server answers the request.

```python
# apps/agents/client.py
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:11434/v1",   # local Ollama server, OpenAI-compatible
    api_key="ollama",                        # any placeholder string works
)

# everything else — function calling, structured outputs, chat history — works identically
response = client.chat.completions.create(
    model="llama3.1:8b",
    messages=[...],
    tools=[...],
)
```

**Run this locally via [Ollama](https://ollama.com)** (free, open source):
```bash
# install Ollama, then:
ollama pull llama3.1:8b        # good general reasoning, runs on most laptops (8-16GB RAM)
ollama serve                    # exposes an OpenAI-compatible API on localhost:11434
```

For interviews, this is honestly a *stronger* story than "I called OpenAI's API": **"I designed the agent layer against the OpenAI API spec so it's provider-agnostic — in development I run it against a local Llama 3.1 model via Ollama at zero cost, and it's a one-line config change to point at hosted GPT-4 in production if I needed frontier-model reasoning quality."** That's a real architectural decision (interface vs. implementation) that senior engineers are expected to make.

**Trade-off to be honest about:** Llama 3.1 8B is noticeably weaker than GPT-4-class models at nuanced, multi-step reasoning and function-calling reliability. For MindTrace specifically (reflecting patterns, not solving hard logic problems), it's genuinely good enough. If you hit reliability issues with tool-calling specifically, `mistral-nemo` or `qwen2.5:14b` (if your machine can handle it) tend to follow function-calling schemas more reliably than Llama at similar size.

---

## 2. Full Component-by-Component Zero-Cost Mapping

| SRS Component | Zero-cost replacement | Notes |
|---|---|---|
| Django + DRF | Same, runs locally free forever | No change |
| PostgreSQL + pgvector | Local Postgres via Docker, or free tier from Neon/Supabase | Both have genuinely free tiers sufficient for a solo-user demo |
| Redis | Local Redis via Docker, or free tier from Upstash | Upstash free tier is generous for dev/demo traffic |
| Celery | Same, runs locally free forever | No change |
| **OpenAI API (reflection/summary agent)** | **Ollama running Llama 3.1 8B locally, via OpenAI-compatible endpoint** | The one real swap — see §1 |
| HuggingFace emotion classifier | Runs locally via `transformers`, free, no API calls | Already free in the original SRS |
| HuggingFace crisis-safety classifier | Same — local inference, free | Already free |
| Sentence-Transformers embeddings | Same — local inference, free | Already free |
| Whisper (voice transcription) | **Use open-source Whisper locally** (`openai-whisper` or `faster-whisper` pip package), not the OpenAI Whisper API | Same model weights, runs on CPU (slower) or GPU, zero cost |
| Docker, Nginx | Same, free | No change |
| GitHub Actions | Free tier (public repo: unlimited; private repo: 2,000 min/month free) | Plenty for a solo project's CI |
| Next.js/React frontend | Same, free | No change |
| Hosting/deployment | See §3 below | This is the other place "free" needs a real plan |

---

## 3. Zero-Cost Hosting Options (for the deployed demo link)

You need *something* live for interviews/recruiters to click, even if development runs entirely on your laptop. Options, honestly ranked:

**Option A — Render free tier (simplest, some real limits)**
- Free web service for Django + free static hosting for Next.js.
- **Real limits:** free web services spin down after ~15 min of inactivity (cold start ~30-60s on next request — mention this if a recruiter clicks the link and it's slow to load the first time), and Render's free Postgres is a time-limited trial, not a permanent free tier.
- **Workaround:** use a permanently-free managed Postgres (Neon or Supabase free tier, both genuinely permanent) instead of Render's, and free Redis (Upstash), with just the Django app itself on Render's free web service.

**Option B — Oracle Cloud "Always Free" tier (best if you want zero cold-starts)**
- Oracle's Always Free tier includes small compute instances that are free *permanently*, not a trial — you could run Postgres, Redis, Django, and even Ollama all on one free VM.
- More setup work (you're managing a real VM, security groups, etc.) but no sleep/cold-start problem, and it's a better "I deployed and managed real infrastructure" story for interviews.

**Option C — Fly.io free allowance**
- Small free allowance for compute + Postgres, good DX, similar trade-offs to Render.

**Option D — Just run it locally + record a demo video/screen-share for interviews**
- Completely valid, zero infrastructure risk, zero cost, zero cold-starts. Many strong student projects are demoed this way. You lose the "click this link" convenience but gain reliability (nothing embarrassing breaking mid-interview).

**My honest recommendation:** develop entirely locally (free, fast iteration), deploy to **Oracle Cloud Always Free** once it's stable enough to show off (genuinely $0, genuinely permanent, and you get real deployment experience worth talking about), and keep a recorded demo video as a backup in case the live link is ever down during an actual interview.

---

## 4. Updated `docker-compose.yml` Sketch (all-free version)

```yaml
services:
  web:
    build: ./
    command: gunicorn config.wsgi:application --bind 0.0.0.0:8000
    environment:
      - OPENAI_BASE_URL=http://ollama:11434/v1
      - OPENAI_API_KEY=ollama
      - DATABASE_URL=postgres://mindtrace:mindtrace@postgres:5432/mindtrace
      - REDIS_URL=redis://redis:6379/0
    depends_on: [postgres, redis, ollama]

  worker:
    build: ./
    command: celery -A config worker -l info
    depends_on: [postgres, redis, ollama]

  beat:
    build: ./
    command: celery -A config beat -l info
    depends_on: [postgres, redis]

  ollama:
    image: ollama/ollama
    volumes:
      - ollama_data:/root/.ollama
    # pull the model once: docker exec -it <container> ollama pull llama3.1:8b

  postgres:
    image: pgvector/pgvector:pg16      # official image with pgvector pre-installed
    environment:
      - POSTGRES_USER=mindtrace
      - POSTGRES_PASSWORD=mindtrace
      - POSTGRES_DB=mindtrace
    volumes:
      - pg_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

  nginx:
    build: ./infra/nginx
    ports: ["80:80"]
    depends_on: [web]

volumes:
  pg_data:
  ollama_data:
```

Everything here is open-source and free to run indefinitely, including on a single free-tier VM.

---

## 5. What Genuinely Doesn't Change From the Original SRS

- All database schema, API endpoints, folder structure, RAG architecture, sequence diagrams, Celery workflow, Redis usage, and security considerations from `MindTrace_Full_SRS.md` stay exactly as written.
- The **safety-gate design** (crisis detection running before any generative model, fail-safe not fail-open) is completely unchanged and still your strongest talking point — it doesn't depend on which model powers the reflection agent.
- Your resume bullets don't need to change either — "built using the OpenAI API" is still accurate, since you're using the OpenAI SDK/interface; if you want to be fully precise you can say "designed against the OpenAI API specification, with a provider-agnostic agent layer" which, again, is a genuinely stronger and more senior-sounding claim than the simpler version.

---

## Closing Note

The only real cost risk in this whole build is accidentally leaving a cloud resource running past a free tier's limit (e.g., an Oracle free-tier instance size creeping over the always-free bounds, or a Neon/Supabase project exceeding its free storage/compute quota). Set a calendar reminder to check your cloud billing dashboard once a week during active development — that habit itself is worth mentioning in interviews as basic operational discipline, not just a cost-saving tip.
