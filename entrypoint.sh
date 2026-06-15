#!/bin/sh

# Touch and set permissions for custom log files
touch /tmp/nginx_access.log /tmp/nginx_error.log /tmp/dns_test.log
chmod 666 /tmp/nginx_access.log /tmp/nginx_error.log /tmp/dns_test.log

echo "=== DNS Resolution Test ===" > /tmp/dns_test.log
for candidate in justlaw just-law-backend justlaw-backend lawjust-backend law-just-backend django backend api django-backend backend-api justlaw-api just-law-django just-law-worker justlaw-worker; do
    echo "--- nslookup ${candidate}.railway.internal ---" >> /tmp/dns_test.log
    nslookup ${candidate}.railway.internal >> /tmp/dns_test.log 2>&1
done
echo "===========================" >> /tmp/dns_test.log

# Default to whatever is set in BACKEND_UPSTREAM, or try to detect it
FOUND_BACKEND=""
echo "=== Port Scan on resolved hosts ===" >> /tmp/dns_test.log
for candidate in justlaw just-law-backend justlaw-backend lawjust-backend law-just-backend django backend api django-backend backend-api justlaw-api just-law-django just-law-worker justlaw-worker; do
    host="${candidate}.railway.internal"
    if nslookup $host >/dev/null 2>&1; then
        echo "--- Port scan on $host ---" >> /tmp/dns_test.log
        for port in 80 443 3000 5000 8000 8080 9000; do
            if nc -z -w 1 $host $port >/dev/null 2>&1; then
                echo "Port $port: OPEN" >> /tmp/dns_test.log
                # If it has an open port 8000 (standard backend port) or not 80 (not frontend), consider it as backend
                if [ "$port" != "80" ] && [ -z "$FOUND_BACKEND" ]; then
                    FOUND_BACKEND="$host:$port"
                fi
            else
                echo "Port $port: CLOSED" >> /tmp/dns_test.log
            fi
        done
    fi
echo "===========================" >> /tmp/dns_test.log

cat /tmp/dns_test.log

if [ -z "$BACKEND_UPSTREAM" ]; then
    echo "No BACKEND_UPSTREAM env var provided. Attempting to auto-detect backend hostname..."
    if [ -n "$FOUND_BACKEND" ]; then
        echo "Auto-detected backend: $FOUND_BACKEND"
        export BACKEND_UPSTREAM="$FOUND_BACKEND"
    else
        echo "Could not auto-detect backend. Defaulting to justlaw.railway.internal:8000"
        export BACKEND_UPSTREAM="justlaw.railway.internal:8000"
    fi
else
    echo "Using provided BACKEND_UPSTREAM: $BACKEND_UPSTREAM"
fi

echo "Substituting BACKEND_UPSTREAM=${BACKEND_UPSTREAM} in nginx.conf.template"
envsubst '${BACKEND_UPSTREAM}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

echo "nginx.conf content preview:"
head -n 65 /etc/nginx/nginx.conf

echo "Starting Nginx..."
exec nginx -g "daemon off;"
