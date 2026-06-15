#!/bin/sh

# Touch and set permissions for custom log files
touch /tmp/nginx_access.log /tmp/nginx_error.log
chmod 666 /tmp/nginx_access.log /tmp/nginx_error.log

echo "=== DNS Resolution Test ==="
echo "nslookup justlaw.railway.internal:"
nslookup justlaw.railway.internal
echo "nslookup just-law-backend.railway.internal:"
nslookup just-law-backend.railway.internal
echo "nslookup backend.railway.internal:"
nslookup backend.railway.internal
echo "==========================="

# Default to whatever is set in BACKEND_UPSTREAM, or try to detect it
if [ -z "$BACKEND_UPSTREAM" ]; then
    echo "No BACKEND_UPSTREAM env var provided. Attempting to auto-detect backend hostname..."
    
    # Try resolving justlaw.railway.internal
    if nslookup justlaw.railway.internal >/dev/null 2>&1; then
        echo "Successfully resolved justlaw.railway.internal"
        export BACKEND_UPSTREAM="justlaw.railway.internal:8000"
    # Try resolving just-law-backend.railway.internal
    elif nslookup just-law-backend.railway.internal >/dev/null 2>&1; then
        echo "Successfully resolved just-law-backend.railway.internal"
        export BACKEND_UPSTREAM="just-law-backend.railway.internal:8000"
    else
        echo "Could not resolve either hostname. Defaulting to justlaw.railway.internal:8000"
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
