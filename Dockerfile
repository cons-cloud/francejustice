# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 : Build React/Vite frontend
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer cache)
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Vite build-time variables (injected at build by Railway → Settings → Variables)
ARG VITE_SUPABASE_URL=https://zchhijltemvrsthdaxex.supabase.co
ARG VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjaGhpamx0ZW12cnN0aGRheGV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNjg0MzksImV4cCI6MjA5MjY0NDQzOX0.vPxSEMq8ENKBn5CxosrZYv9n7KNZgvECX_fDefvueoE
ARG VITE_STRIPE_PUBLIC_KEY=pk_live_51PSzZBFNeFJ3453lsyZYkuD4MckXYLXmmR6c0XZ8im8KEEkR00zK9QyWd8zS9Ws4DabN4MUk8DulomNBhz3KF09j00rpIW9GG2
ARG VITE_ENABLE_SEND_EMAIL=true
ARG VITE_GEMINI_API_KEY=""
ARG VITE_OPENAI_API_KEY=""
ARG VITE_ANTHROPIC_API_KEY=""

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_STRIPE_PUBLIC_KEY=$VITE_STRIPE_PUBLIC_KEY
ENV VITE_ENABLE_SEND_EMAIL=$VITE_ENABLE_SEND_EMAIL
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY
ENV VITE_OPENAI_API_KEY=$VITE_OPENAI_API_KEY
ENV VITE_ANTHROPIC_API_KEY=$VITE_ANTHROPIC_API_KEY

# Build production bundle
RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 : Production image (Nginx + Django/Gunicorn)
# ─────────────────────────────────────────────────────────────────────────────
FROM python:3.12-slim

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    gettext-base \
    libpq-dev \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies — pinned for reproducibility
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Django backend
COPY backend/ /app/backend/

# React build output → Nginx webroot
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx template + entrypoint
COPY nginx.conf.template /etc/nginx/nginx.conf.template
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Railway assigns a dynamic PORT — Nginx will listen on it + 80/8080/3000
EXPOSE 80 8080 3000

HEALTHCHECK --interval=15s --timeout=10s --start-period=30s --retries=5 \
  CMD curl -f http://localhost:${PORT:-80}/health || curl -f http://localhost:80/health || exit 1

CMD ["/entrypoint.sh"]
