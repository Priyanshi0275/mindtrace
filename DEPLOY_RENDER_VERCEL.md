# Deploying MindTrace: Render (backend) + Vercel (frontend)

This is the exact sequence, in order. Do it in this order — the frontend
needs the backend's URL, and the backend needs the database/Redis URLs.

**Security note up front:** everything below reflects what's actually in
the code right now — DEBUG=False hardening (HSTS, secure cookies, SSL
redirect), rate limiting on the LLM endpoint, per-user query isolation,
and JWT auth are all implemented and will activate automatically once you
set `DEBUG=False` in your environment variables. Nothing here requires you
to write additional security code — just to set the env vars correctly,
which this runbook walks through explicitly.

---

## Step 1 — Free managed Postgres (Neon)

1. Create a free account at neon.tech.
2. Create a new project → note the connection string it gives you
   (looks like `postgres://user:pass@host/dbname`).
3. Open Neon's SQL editor and run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
   This enables pgvector — without this, the app will fail on migration.
4. Keep this connection string — it's your `DATABASE_URL`.

*(Supabase is a fine alternative — same idea, same `CREATE EXTENSION vector;` step.)*

---

## Step 2 — Free managed Redis (Upstash)

1. Create a free account at upstash.com.
2. Create a new Redis database (choose the region closest to where you'll
   deploy Render, to minimize latency).
3. Copy the `redis://` connection URL it gives you — this is your `REDIS_URL`.

---

## Step 3 — Free LLM API key (Groq)

1. Create a free account at console.groq.com.
2. Generate an API key (starts with `gsk_`).
3. This is your `OPENAI_API_KEY` for production — the code doesn't change,
   only the env vars (see Option 2 in `backend/.env.example`).

---

## Step 4 — Deploy the backend web service on Render

1. Push this repo to GitHub.
2. Render dashboard → **New → Web Service** → connect your repo.
3. Set **Root Directory** to `backend`.
4. Render auto-detects the `Dockerfile` — leave build/start commands as
   whatever the Dockerfile specifies (it already runs migrations + gunicorn).
5. Under **Environment**, add these variables:
   ```
   DEBUG=False
   SECRET_KEY=<generate a long random string, e.g. via `python -c "import secrets; print(secrets.token_urlsafe(50))"`>
   ALLOWED_HOSTS=<your-service-name>.onrender.com
   DATABASE_URL=<the Neon connection string from Step 1>
   REDIS_URL=<the Upstash URL from Step 2>
   CORS_ALLOWED_ORIGINS=https://<your-vercel-project-name>.vercel.app
   OPENAI_BASE_URL=https://api.groq.com/openai/v1
   OPENAI_API_KEY=<the gsk_ key from Step 3>
   OPENAI_MODEL=llama-3.1-8b-instant
   ```
   (You won't know your exact Vercel URL until Step 6 — come back and update
   `CORS_ALLOWED_ORIGINS` once you have it. Until then the API will reject
   cross-origin requests from the frontend, which is the correct/secure
   default, not a bug.)
6. Deploy. Render will build the image, run `python manage.py migrate`
   automatically (it's in the Dockerfile's CMD), and start Gunicorn.
7. Once live, note the URL Render gives you, e.g.
   `https://mindtrace-api.onrender.com`.

---

## Step 5 — Deploy the Celery worker + beat as two more Render services

Repeat "New → Web Service" (or use Render's **Background Worker** service
type if available on your plan — cleaner than a web service for this):

**Worker service:**
- Same repo, same root directory (`backend`), same Dockerfile.
- Override **Start Command**: `celery -A config worker -l info`
- Same environment variables as Step 4.

**Beat service:**
- Same repo, same root directory, same Dockerfile.
- Override **Start Command**: `celery -A config beat -l info`
- Same environment variables as Step 4.

Both need the same `DATABASE_URL`/`REDIS_URL` as the web service since they
share the same database and task queue.

---

## Step 6 — Deploy the frontend on Vercel

1. Vercel dashboard → **Add New Project** → import the same GitHub repo.
2. Set **Root Directory** to `frontend`.
3. Under **Environment Variables**, add:
   ```
   NEXT_PUBLIC_API_URL=https://mindtrace-api.onrender.com
   ```
   (use the real Render URL from Step 4.)
4. Deploy. Vercel gives you a URL like `https://mindtrace.vercel.app`.

---

## Step 7 — Close the loop: update CORS on Render

Go back to your Render **web service** environment variables and set:
```
CORS_ALLOWED_ORIGINS=https://mindtrace.vercel.app
```
(the real URL from Step 6), then redeploy the web service so the change
takes effect. Skipping this step is the single most common reason a
deployed frontend can't talk to its backend — the browser will show CORS
errors in the console if you forget it.

---

## Step 8 — Verify it's actually working end to end

1. Visit your Vercel URL, register an account.
2. Write a journal entry, wait ~15-30 seconds, refresh — emotion tags
   should appear (proof Celery worker + Groq/HF pipeline are both live).
3. Go to the Reflect page and ask a question about your entry — proof the
   RAG pipeline, retrieval, and Groq LLM call all work end to end.
4. Try registering with the same email twice — should be rejected (proof
   basic validation works).
5. Open browser dev tools → Network tab → confirm all requests go over
   `https://`, not `http://` (proof `SECURE_SSL_REDIRECT` is active).

If step 2 or 3 fails, check the Render **worker** service logs first —
that's almost always where the actual error surfaces (not the web service
logs), since that's where the Celery task runs.

---

## What you get, security-wise, once DEBUG=False is set

- HTTPS enforced (`SECURE_SSL_REDIRECT`), HSTS headers sent
- Secure, HTTPS-only cookies
- Clickjacking protection (`X-Frame-Options: DENY`)
- CORS locked to only your specific Vercel origin (not `*`)
- JWT access tokens expire in 15 minutes; refresh tokens rotate and old
  ones are blacklisted
- Every database query for journal content is scoped to `request.user` at
  the queryset level — there is no endpoint that can return another user's
  entries even if someone tampers with an ID in the URL
- Rate limiting on the LLM-backed endpoint (30 requests/hour/user) so a
  bug or malicious script can't run up API usage unbounded
- Crisis-flagged entries never reach the LLM at all — verified by the
  `safety_check` step running first in the Celery chain

## What's still on you to decide/add before treating this as fully "production-grade"

- A real HuggingFace crisis-classifier model (the keyword list alone is a
  reasonable first layer, not a complete one — see the SRS's honest note
  on this)
- Automated backups of the Neon database (Neon has this as a paid feature;
  free tier retention is limited — check current terms)
- Monitoring/alerting (Sentry free tier is a reasonable next step)
- A privacy policy and terms of service if you ever let anyone other than
  yourself use this with real journal content
