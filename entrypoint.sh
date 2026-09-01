#!/bin/sh

# Set default PORT if not provided by Railway
export PORT="${PORT:-8080}"
export BACKEND_UPSTREAM="127.0.0.1:8001"

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

echo "Substituting PORT=${PORT} and BACKEND_UPSTREAM=${BACKEND_UPSTREAM} in nginx.conf.template"
envsubst '${PORT} ${BACKEND_UPSTREAM}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

echo "Starting Nginx on port ${PORT}..."
exec nginx -g "daemon off;"
