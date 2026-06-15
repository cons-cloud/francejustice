#!/bin/sh

# Touch log files
touch /tmp/nginx_access.log /tmp/nginx_error.log /tmp/gunicorn_access.log /tmp/gunicorn_error.log
chmod 666 /tmp/nginx_access.log /tmp/nginx_error.log /tmp/gunicorn_access.log /tmp/gunicorn_error.log

echo "=== Applying Django Migrations ==="
cd /app/backend
python manage.py migrate --noinput

echo "=== Collecting Static Files ==="
python manage.py collectstatic --noinput

echo "=== Starting Gunicorn on 127.0.0.1:8000 ==="
# Launch Gunicorn in the background
gunicorn config.wsgi:application \
    --bind 127.0.0.1:8000 \
    --workers 2 \
    --timeout 120 \
    --access-logfile /tmp/gunicorn_access.log \
    --error-logfile /tmp/gunicorn_error.log &

# Set backend upstream destination to localhost
export BACKEND_UPSTREAM="127.0.0.1:8000"

echo "Substituting BACKEND_UPSTREAM=${BACKEND_UPSTREAM} in nginx.conf.template"
envsubst '${BACKEND_UPSTREAM}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

echo "nginx.conf content preview:"
head -n 65 /etc/nginx/nginx.conf

echo "Starting Nginx..."
exec nginx -g "daemon off;"

