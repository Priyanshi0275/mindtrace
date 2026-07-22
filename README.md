# MindTrace

Personal journaling & emotional pattern intelligence, built with Django/DRF,
Celery, Redis, PostgreSQL+pgvector, HuggingFace models, Sentence-Transformers,
and an OpenAI-compatible agent layer (runs against local Ollama for zero cost,
or hosted OpenAI with one env var change).

This zip contains a **working scaffold**, not a finished polished product —
it implements the full pipeline described in `MindTrace_Full_SRS.md`
(safety gate → emotion tagging → embeddings → trend computation → RAG
reflection agent) end to end, with simple but real UI screens. Treat it as
the foundation to build on, not a finished app to hand in untouched.

```
mindtrace/
├── backend/       Django + DRF + Celery (the API + AI pipeline)
├── frontend/      Next.js (deploys to Vercel)
└── docker-compose.yml   runs the whole backend stack locally, free
```

---

## IMPORTANT: Read this before you deploy anything

**Vercel can only host the `frontend/` folder.** Vercel runs serverless
functions with short execution limits and no persistent background
processes — it cannot run Django, Celery workers, Celery beat, Redis,
Postgres, or Ollama. Those all need a "real" server or a managed service
that stays running.

So the actual deployment shape is:

- **Frontend (Next.js) → Vercel.** This part really does deploy there,
  exactly as you asked.
- **Backend (Django + Celery + Postgres + Redis + Ollama) → somewhere else**
  that supports long-running processes: a free-tier VM (Oracle Cloud
  Always Free is genuinely permanent and free), Render, Railway, or Fly.io.
  See `MindTrace_Zero_Cost_Guide.md` for the free-tier comparison.

Once the backend is deployed and has a public URL (e.g.
`https://mindtrace-api.onrender.com`), you set that URL as an environment
variable in your Vercel project (`NEXT_PUBLIC_API_URL`), and the two halves
talk to each other over HTTPS. They do not need to be on the same platform.

---

## Part 1 — Run everything locally first (recommended before deploying anything)

### Prerequisites
- Docker + Docker Compose installed
- Node.js 18+ installed (for the frontend)
- ~8GB RAM free (for running the local LLM via Ollama)

### 1. Start the backend stack
```bash
cd mindtrace
cp backend/.env.example backend/.env
# open backend/.env and set a real SECRET_KEY (any random string is fine for local dev)

docker compose up --build
```
This starts: Postgres (with pgvector), Redis, Ollama, the Django web server,
a Celery worker, Celery beat, and Nginx.

### 2. Pull the local LLM (one-time, still free)
In a new terminal:
```bash
docker compose exec ollama ollama pull llama3.1:8b
```
This downloads ~4-5GB once. After that it runs fully offline.

### 3. Run migrations and create a superuser (one-time)
```bash
docker compose exec web python manage.py migrate
docker compose exec web python manage.py createsuperuser
```
(`createsuperuser` is for the Django Admin at `/admin/` — not required for
using the app itself, which uses the `/api/auth/register/` endpoint instead.)

### 4. Confirm the backend is up
Visit `http://localhost:8000/admin/` — you should see the Django admin
login page. The API itself is at `http://localhost:8000/api/...`.

### 5. Run the frontend
```bash
cd frontend
cp .env.example .env.local
# .env.local should have: NEXT_PUBLIC_API_URL=http://localhost:8000

npm install
npm run dev
```
Visit `http://localhost:3000` — register an account, write an entry, and
after a few seconds (Celery processing it in the background) you should
see emotion tags appear on the entry. Try the Reflect page once you have
a few entries.

---

## Part 2 — Deploying the frontend to Vercel

1. Push this whole repo to GitHub (one repo is fine, Vercel will be told to
   only build the `frontend/` folder — see step 3).
2. Go to vercel.com → **Add New Project** → import your GitHub repo.
3. In the import screen, set **Root Directory** to `frontend`. This tells
   Vercel to only build/deploy the Next.js app, ignoring `backend/`.
4. Under **Environment Variables**, add:
   ```
   NEXT_PUBLIC_API_URL = https://<your-deployed-backend-url>
   ```
   (You'll get this URL from step 3 of Part 3 below — deploy the backend
   first, then come back and set this.)
5. Deploy. Vercel will give you a live URL like `mindtrace.vercel.app`.

That's it for the frontend — Vercel handles builds, CDN, and HTTPS
automatically from here.

---

## Part 3 — Deploying the backend (free options)

Vercel doesn't work for this part (see the warning above), so pick one:

### Option A: Render (simplest, some cold-start/free-Postgres limits)
1. Create a Render account, **New → Web Service**, point at your repo,
   set **Root Directory** to `backend`.
2. Render will detect the `Dockerfile` automatically.
3. Add environment variables (same keys as `backend/.env.example`), pointing
   `DATABASE_URL` at a free Postgres from **Neon** or **Supabase** (both have
   permanent free tiers, unlike Render's own trial Postgres) with the
   pgvector extension enabled (`CREATE EXTENSION vector;` in their SQL console).
   Point `REDIS_URL` at a free **Upstash** Redis instance.
4. Deploy the Celery worker and beat as two more Render services (same repo,
   same Dockerfile, but override the **Start Command** to
   `celery -A config worker -l info` and `celery -A config beat -l info`
   respectively).
5. For the LLM: Ollama needs a persistent disk and enough RAM, which free
   Render web services don't reliably offer — for this option, it's simplest
   to point `OPENAI_BASE_URL`/`OPENAI_API_KEY` at real OpenAI temporarily
   (a few cents of usage for a demo), or run Ollama on your own machine and
   tunnel to it (e.g. with `ngrok`) for a live demo, or use Option B below
   which handles this more cleanly.

### Option B: Oracle Cloud "Always Free" VM (more setup, genuinely $0 forever, no cold starts)
1. Create an Oracle Cloud free-tier account, spin up an "Always Free" Ampere
   VM instance (ARM-based, free permanently — check current specs on
   Oracle's site since free-tier details can change).
2. SSH in, install Docker + Docker Compose.
3. Copy this repo's `backend/` folder (and root `docker-compose.yml`, minus
   the `nginx`/`frontend` bits you don't need there) onto the VM.
4. Run `docker compose up -d` — now Postgres, Redis, Ollama, Django, and
   Celery are all running on one free, permanent machine.
5. Open the VM's firewall for port 80/443, point a domain (or just use the
   VM's public IP) as your `NEXT_PUBLIC_API_URL` in Vercel.
6. (Recommended) put Certbot/Let's Encrypt in front for HTTPS — Vercel's
   frontend will refuse to call an `http://` backend from a `https://`
   deployed site due to mixed-content blocking in browsers.

**This option is what I'd actually recommend** — it's the only one that's
free permanently, runs Ollama with no workaround needed, and gives you a
genuine "I deployed and managed real infrastructure" story for interviews.

### Option C: Just don't deploy the backend at all
Run everything locally, demo it via screen-share or a recorded video in
interviews. Completely legitimate, zero risk of something breaking live.
You can still deploy the frontend alone to Vercel as a portfolio link,
with a note that the live API is only running during active development.

---

## What's implemented vs. what's a stub

**Fully implemented and runnable:**
- Auth (register/login/JWT), per-user data isolation
- Journal entry CRUD
- Safety gate (keyword-based; the HF classifier hook is there but optional —
  see `apps/safety/detector.py`)
- Emotion tagging (real HuggingFace model, with a rule-based fallback so it
  still runs before you've downloaded the model)
- Sentence-Transformer embeddings + pgvector similarity retrieval
- Reflection agent (real RAG pipeline, OpenAI-compatible client, works
  against Ollama or real OpenAI)
- Celery pipeline (safety → tag → embed) and beat-scheduled trend computation
- Next.js pages: journal, trends, reflect/chat, login/register

**Stubbed / left for you to extend** (per the SRS, so you have real work
left to design and build yourself, not just run someone else's finished app):
- Voice-note transcription (Whisper) — the pipeline has a slot for it in the
  SRS's task chain, but audio upload handling isn't wired up in this scaffold
- Weekly auto-summary generation (the Celery beat schedule entry exists;
  the actual summary-generation task calling the reflection agent on a
  week's worth of entries is not yet written)
- Therapist-facing shared report generation/export
- Full account data export as a downloadable file (the `/api/auth/export/`
  endpoint returns JSON directly; wrapping it as a downloadable file/PDF
  is left to you)
- A proper HuggingFace crisis-classifier model (the hook exists in
  `apps/safety/detector.py`, but you should deliberately choose and validate
  a real model here rather than trust a placeholder)

Building out these remaining pieces yourself is genuinely valuable — it's
where you'll have the most to say in an interview about design decisions
you made, not just decisions I made for you.
