#!/bin/sh

# Appliquer les migrations de base de données
echo "Running migrations..."
python manage.py migrate --noinput

# Collecter les fichiers statiques (nécessaire pour WhiteNoise)
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Démarrer le serveur Gunicorn
echo "Starting gunicorn..."
exec gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000}
