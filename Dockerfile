# V69 SwissEph Astro Engine + Node.js Server
# Multi-service: Python V69 engine on port 8001 + Node.js on port 3000
FROM node:20-alpine

WORKDIR /app

# V69 反缓存水印
ARG CACHEBUST=2026-07-08-V69-SWISSEPH-$(date +%s)
RUN echo "CACHEBUST=$CACHEBUST at $(date -u +%Y-%m-%dT%H:%M:%SZ)"

# ── Python + SwissEph ──────────────────────────────────────────────────────
# Install Python 3 and pip (Alpine uses apk)
RUN apk add --no-cache python3 py3-pip

# Install SwissEph (astronomical calculation library)
# This provides 100% accurate planetary positions
RUN pip3 install --no-cache-dir --break-system-packages \
    swisseph fastapi uvicorn

# Environment variables
ENV VITE_SUPABASE_URL=https://wfkxqhlcgrikxoofjvas.supabase.co
ENV VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indma3hxaGxjZ3Jpa3hvb2ZqdmFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2NTU4MjEsImV4cCI6MjA5NTIzMTgyMX0.qMyRlkMRTkPccngccWa2GJroGaROqdA6N937XRK2L4g
ENV SUPABASE_URL=https://wfkxqhlcgrikxoofjvas.supabase.co
ENV SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indma3hxaGxjZ3Jpa3hvb2ZqdmFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTY1NTgyMSwiZXhwIjoyMDk1MjMxODIxfQ.IV6CxfemnwbqXWSkwixaN606PV6-NLWb7nJtYvVGeEw
ENV DEEPSEEK_API_KEY=sk-9307f02599b44612b6767996a7839ab5
ENV V69_PORT=8001
ENV V69_HOST=127.0.0.1

# Copy all source files (includes astro/ directory)
COPY . .

# Install Node.js dependencies
RUN npm install && npm install express stripe

# V69 startup script: launches Python V69 engine in background, then Node.js
# SwissEph ephemeris data is downloaded automatically by swisseph on first import
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'echo "[V69] Starting SwissEph Python engine on port $V69_PORT..."' >> /start.sh && \
    echo 'PYTHONPATH=$(python3 -c "import site; print(site.getsitepackages()[0])"):/app \\' >> /start.sh && \
    echo '  python3 -m uvicorn astro.v69_server:app --host 0.0.0.0 --port $V69_PORT &' >> /start.sh && \
    echo 'V69_PID=$!' >> /start.sh && \
    echo 'echo "[V69] Python engine PID=$V69_PID, waiting 5s to start..."' >> /start.sh && \
    echo 'sleep 5' >> /start.sh && \
    echo 'curl -s http://127.0.0.1:$V69_PORT/api/v1/health && echo " [V69] Health OK!" || echo " [V69] Health check FAILED (continuing anyway)"' >> /start.sh && \
    echo 'echo "[KindredSouls] Starting Node.js server on port 3000..."' >> /start.sh && \
    echo 'node server.js' >> /start.sh

RUN chmod +x /start.sh

EXPOSE 3000 8001
ENV PORT=3000

CMD ["/start.sh"]
