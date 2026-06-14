#!/bin/sh

# Appliquer les migrations de base de données
echo "Running migrations..."
python manage.py migrate --noinput

# Collecter les fichiers statiques (nécessaire pour WhiteNoise)
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Démarrer le serveur Gunicorn
echo "Starting gunicorn..."
if [ -n "$PORT" ] && [ "$PORT" != "8000" ]; then
    exec gunicorn config.wsgi:application --bind "[::]:8000" --bind "[::]:${PORT}"
else
    exec gunicorn config.wsgi:application --bind "[::]:8000"
fi

