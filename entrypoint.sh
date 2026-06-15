#!/bin/sh

# Touch and set permissions for custom log files
touch /tmp/nginx_access.log /tmp/nginx_error.log /tmp/dns_test.log
chmod 666 /tmp/nginx_access.log /tmp/nginx_error.log /tmp/dns_test.log
rm -f /tmp/resolved_hosts.txt /tmp/open_ports.txt

echo "=== Parallel DNS Resolution ===" > /tmp/dns_test.log
# Run nslookups in parallel
for candidate in justlaw just-law-backend justlaw-backend lawjust-backend law-just-backend django backend api django-backend backend-api justlaw-api just-law-django just-law-worker justlaw-worker; do
    (
        host="${candidate}.railway.internal"
        if nslookup $host >/dev/null 2>&1; then
            echo "$host" >> /tmp/resolved_hosts.txt
            echo "RESOLVED: $host" >> /tmp/dns_test.log
        else
            echo "NXDOMAIN: $host" >> /tmp/dns_test.log
        fi
    ) &
done
wait

echo "=== Parallel Port Scanning ===" >> /tmp/dns_test.log
if [ -f /tmp/resolved_hosts.txt ]; then
    for host in $(cat /tmp/resolved_hosts.txt); do
        for port in 80 443 3000 5000 8000 8080 9000; do
            (
                if nc -z -w 1 $host $port >/dev/null 2>&1; then
                    echo "$host:$port" >> /tmp/open_ports.txt
                    echo "$host:$port OPEN" >> /tmp/dns_test.log
                else
                    echo "$host:$port CLOSED" >> /tmp/dns_test.log
                fi
            ) &
        done
    done
    wait
fi
echo "===========================" >> /tmp/dns_test.log

cat /tmp/dns_test.log

# Read the open ports to find the backend
FOUND_BACKEND=""
if [ -f /tmp/open_ports.txt ]; then
    # Prioritize any host:port where port is not 80, and host is not justlaw (frontend)
    for target in $(cat /tmp/open_ports.txt); do
        host=$(echo "$target" | cut -d: -f1)
        port=$(echo "$target" | cut -d: -f2)
        if [ "$host" != "justlaw.railway.internal" ] && [ "$port" != "80" ]; then
            FOUND_BACKEND="$target"
            break
        fi
    done
    # Fallback: if we didn't find one that matches the filter, take any open port != 80
    if [ -z "$FOUND_BACKEND" ]; then
        for target in $(cat /tmp/open_ports.txt); do
            port=$(echo "$target" | cut -d: -f2)
            if [ "$port" != "80" ]; then
                FOUND_BACKEND="$target"
                break
            fi
        done
    fi
fi

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
