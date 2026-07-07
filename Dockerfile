# V69 SwissEph Astro Engine + Node.js Server
# Multi-service: Python V69 engine on port 8001 + Node.js on port 3000
FROM node:20-alpine

WORKDIR /app

# ── Python + SwissEph ──────────────────────────────────────────────────────
# Install Python 3 and pip (Alpine uses apk)
RUN apk add --no-cache python3 py3-pip

# Install SwissEph (astronomical calculation library)
# This provides 100% accurate planetary positions
RUN pip3 install --no-cache-dir --break-system-packages \
    swisseph fastapi uvicorn

# Environment variables (values from Railway secrets)
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

# ── Start Script ────────────────────────────────────────────────────────────
# Fixed: simpler PYTHONPATH detection, proper background process handling
RUN cat > /start.sh << 'SCRIPT'
#!/bin/sh
echo "[START] KindredSouls V69 multi-service startup"
echo "[START] Python version:"
python3 --version
echo "[START] V69_PORT=${V69_PORT}"
# Get Python site-packages path
PYTHONDIR=$(python3 -c "import site; print(site.getsitepackages()[0])" 2>/dev/null)
echo "[START] PYTHONDIR=${PYTHONDIR}"
export PYTHONPATH="${PYTHONDIR}:/app"
echo "[V69] Starting SwissEph Python engine on port ${V69_PORT}..."
python3 -m uvicorn astro.v69_server:app --host 0.0.0.0 --port ${V69_PORT} > /tmp/v69.log 2>&1 &
V69_PID=$!
echo "[V69] Python engine PID=${V69_PID}"
sleep 6
echo "[V69] Checking Python health..."
curl -s --max-time 5 http://127.0.0.1:${V69_PORT}/api/v1/health && echo " [V69] Health OK!" || echo " [V69] Health check FAILED"
echo "[KindredSouls] Starting Node.js server on port 3000..."
node server.js
SCRIPT

RUN chmod +x /start.sh

EXPOSE 3000 8001
ENV PORT=3000

CMD ["/start.sh"]
