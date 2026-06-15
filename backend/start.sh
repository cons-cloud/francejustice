#!/bin/sh

# Print diagnostic info
echo "=== Backend Startup ==="
echo "Hostname: $(hostname)"
echo "IP addresses: $(hostname -I 2>/dev/null || ip addr show 2>/dev/null | grep 'inet ' || echo 'unknown')"
echo "PORT env var: ${PORT:-not set}"
echo "========================"

# Appliquer les migrations de base de données
echo "Running migrations..."
python manage.py migrate --noinput

# Collecter les fichiers statiques (nécessaire pour WhiteNoise)
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Démarrer le serveur Gunicorn - always bind on $PORT for Railway private network
# Also bind on 8000 as fallback
BIND_PORT="${PORT:-8000}"
echo "Starting gunicorn on [::]:{$BIND_PORT} ..."
if [ "$BIND_PORT" = "8000" ]; then
    exec gunicorn config.wsgi:application \
        --bind "[::]:8000" \
        --bind "0.0.0.0:8000" \
        --workers 2 \
        --timeout 120 \
        --access-logfile - \
        --error-logfile -
else
    exec gunicorn config.wsgi:application \
        --bind "[::]:${BIND_PORT}" \
        --bind "0.0.0.0:${BIND_PORT}" \
        --bind "[::]:8000" \
        --bind "0.0.0.0:8000" \
        --workers 2 \
        --timeout 120 \
        --access-logfile - \
        --error-logfile -
fi
