#!/bin/sh

# Touch log files
touch /tmp/nginx_access.log /tmp/nginx_error.log /tmp/dns_test.log
chmod 666 /tmp/nginx_access.log /tmp/nginx_error.log /tmp/dns_test.log

# If BACKEND_UPSTREAM is already set, skip discovery
if [ -n "$BACKEND_UPSTREAM" ]; then
    echo "Using provided BACKEND_UPSTREAM: $BACKEND_UPSTREAM"
else
    echo "BACKEND_UPSTREAM not set. Running quick DNS check..."
    echo "=== DNS Check ===" > /tmp/dns_test.log

    # Check a few likely hostnames in parallel
    for candidate in just-law-backend justlaw-backend justlaw backend api django; do
        (
            host="${candidate}.railway.internal"
            if nslookup $host >/dev/null 2>&1; then
                echo "RESOLVED: $host" >> /tmp/dns_test.log
                echo "$host" >> /tmp/resolved_hosts.txt
            else
                echo "NXDOMAIN: $host" >> /tmp/dns_test.log
            fi
        ) &
    done
    wait

    echo "============================" >> /tmp/dns_test.log
    cat /tmp/dns_test.log

    # Pick first resolved candidate (excluding justlaw which is frontend)
    FOUND=""
    if [ -f /tmp/resolved_hosts.txt ]; then
        FOUND=$(head -1 /tmp/resolved_hosts.txt)
    fi

    if [ -n "$FOUND" ]; then
        export BACKEND_UPSTREAM="${FOUND}:8000"
        echo "Auto-detected BACKEND_UPSTREAM: $BACKEND_UPSTREAM"
    else
        # Fallback: use the known service name from railway.json
        export BACKEND_UPSTREAM="just-law-backend.railway.internal:8000"
        echo "Could not auto-detect. Falling back to $BACKEND_UPSTREAM"
    fi
fi

echo "Substituting BACKEND_UPSTREAM=${BACKEND_UPSTREAM} in nginx.conf.template"
envsubst '${BACKEND_UPSTREAM}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

echo "nginx.conf content preview:"
head -n 65 /etc/nginx/nginx.conf

echo "Starting Nginx..."
exec nginx -g "daemon off;"
