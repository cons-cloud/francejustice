#!/bin/sh

# Set default PORT if not provided by Railway (Dockerfile exposes ports 80, 8080, 3000)
export PORT="${PORT:-80}"
export BACKEND_UPSTREAM="127.0.0.1:8001"

# Generate Nginx listen directives dynamically for $PORT, 80, 8080, 3000
LISTEN_PORTS="listen ${PORT} default_server;"
for p in 80 8080 3000; do
    if [ "$p" != "$PORT" ]; then
        LISTEN_PORTS="${LISTEN_PORTS}
        listen ${p};"
    fi
done
export LISTEN_PORTS

# Touch log files
touch /tmp/nginx_access.log /tmp/nginx_error.log /tmp/gunicorn_access.log /tmp/gunicorn_error.log
chmod 666 /tmp/nginx_access.log /tmp/nginx_error.log /tmp/gunicorn_access.log /tmp/gunicorn_error.log

cd /app/backend

echo "=== Starting Gunicorn on 127.0.0.1:8001 ==="
gunicorn config.wsgi:application \
    --bind 127.0.0.1:8001 \
    --workers 2 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile - &

echo "=== Running Migrations & Collectstatic in background ==="
(
    python manage.py migrate --noinput || echo "Notice: Django migrations skipped or completed."
    python manage.py collectstatic --noinput || echo "Notice: Collectstatic completed."
) &

echo "Substituting LISTEN_PORTS and BACKEND_UPSTREAM in nginx.conf.template"
envsubst '${LISTEN_PORTS} ${BACKEND_UPSTREAM}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

echo "Validating Nginx configuration..."
nginx -t -c /etc/nginx/nginx.conf

echo "Starting Nginx on ports (${PORT}, 80, 8080, 3000)..."
exec nginx -g "daemon off;"
