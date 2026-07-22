FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python manage.py collectstatic --noinput || true

RUN chmod +x entrypoint.sh

EXPOSE 8000

# NOTE: this runs `manage.py migrate` before starting Gunicorn every time
# the web service boots. That's correct for THIS service. The Celery
# worker/beat services on Render use this same image but override the
# start command directly (see DEPLOY_RENDER_VERCEL.md Step 5), so they
# don't re-run migrate -- only the web service needs to.
CMD ["./entrypoint.sh"]
