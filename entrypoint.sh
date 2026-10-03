#!/bin/sh
set -e

# ─── Railway dynamic PORT ────────────────────────────────────────────────────
export PORT="${PORT:-80}"
export BACKEND_UPSTREAM="127.0.0.1:8001"

echo "=== France Justice — Entrypoint starting on PORT=${PORT} ==="

# ─── Create required directories and log files ───────────────────────────────
mkdir -p /app/backend/staticfiles /tmp/logs
touch /tmp/logs/nginx_access.log /tmp/logs/nginx_error.log \
      /tmp/logs/gunicorn_access.log /tmp/logs/gunicorn_error.log
chmod 666 /tmp/logs/*.log

# ─── Generate Nginx listen directives for $PORT + 80, 8080, 3000 ─────────────
LISTEN_PORTS="listen ${PORT} default_server;"
for p in 80 8080 3000; do
    if [ "$p" != "$PORT" ]; then
        LISTEN_PORTS="${LISTEN_PORTS}
        listen ${p};"
    fi
done
export LISTEN_PORTS

# ─── Start Gunicorn (Django) ──────────────────────────────────────────────────
echo "=== Starting Gunicorn on ${BACKEND_UPSTREAM} ==="
cd /app/backend
gunicorn config.wsgi:application \
    --bind "${BACKEND_UPSTREAM}" \
    --workers 2 \
    --threads 2 \
    --timeout 120 \
    --graceful-timeout 30 \
    --keep-alive 5 \
    --access-logfile - \
    --error-logfile - \
    --log-level info &

GUNICORN_PID=$!

# ─── Wait for Gunicorn to be ready (max 30s) ─────────────────────────────────
echo "=== Waiting for Gunicorn to be ready... ==="
RETRIES=0
until curl -sf "http://${BACKEND_UPSTREAM}/health" > /dev/null 2>&1 || [ $RETRIES -ge 15 ]; do
    sleep 2
    RETRIES=$((RETRIES + 1))
    echo "  → Attempt ${RETRIES}/15..."
done

if [ $RETRIES -ge 15 ]; then
    echo "WARNING: Gunicorn did not respond on /health within 30s — continuing anyway (frontend will still work)"
else
    echo "=== Gunicorn is ready ==="
fi

# ─── Run migrations + collectstatic asynchronously (non-blocking) ────────────
(
    sleep 2
    echo "=== Running Django migrations ==="
    python /app/backend/manage.py migrate --noinput 2>&1 || echo "Notice: Migrations skipped or already applied."
    echo "=== Running collectstatic ==="
    python /app/backend/manage.py collectstatic --noinput 2>&1 || echo "Notice: Collectstatic already done."
) &

# ─── Generate Nginx config from template ─────────────────────────────────────
echo "=== Generating Nginx configuration ==="
envsubst '${LISTEN_PORTS} ${BACKEND_UPSTREAM}' \
    < /etc/nginx/nginx.conf.template \
    > /etc/nginx/nginx.conf

# ─── Validate Nginx config ────────────────────────────────────────────────────
echo "=== Validating Nginx config ==="
nginx -t -c /etc/nginx/nginx.conf || {
    echo "ERROR: Nginx config validation failed. Dumping config for debug:"
    cat /etc/nginx/nginx.conf
    exit 1
}

# ─── Start Nginx (foreground — process Railway monitors) ─────────────────────
echo "=== Starting Nginx (listening on PORT=${PORT}, 80, 8080, 3000) ==="
exec nginx -g "daemon off;"
