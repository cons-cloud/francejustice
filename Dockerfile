# Stage 1: Build the React frontend
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
RUN npm run build

# Stage 2: Production container running both Nginx and Django/Gunicorn
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies, Nginx, gettext (for envsubst)
RUN apt-get update && apt-get install -y \
    nginx \
    gettext-base \
    libpq-dev \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Django backend source code
COPY backend/ /app/backend/

# Copy React frontend build files to Nginx default html directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy configuration and entrypoint
COPY nginx.conf.template /etc/nginx/nginx.conf.template
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose port (Nginx will bind to Railway's $PORT)
EXPOSE 80

CMD ["/entrypoint.sh"]
