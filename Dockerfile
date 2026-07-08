FROM node:20-bookworm
# Force cache rebuild at: $(date)

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 python3-pip curl && \
    rm -rf /var/lib/apt/lists/*

RUN pip3 install --no-cache-dir swisseph fastapi uvicorn

# Secrets (SUPABASE_URL / SERVICE_KEY / DEEPSEEK_API_KEY / VITE_*) 
# are injected at runtime by Railway — do NOT hardcode here.
ENV V69_PORT=8001
ENV V69_HOST=127.0.0.1

COPY . .

RUN npm install && npm install express stripe

RUN printf '%s\n' \
'#!/bin/bash' \
'set -e' \
'echo "[START] V69 multi-service startup"' \
'python3 --version' \
'PYTHONDIR=$(python3 -c "import site; print(site.getsitepackages()[0])")' \
'export PYTHONPATH="${PYTHONDIR}:/app"' \
'echo "[V69] Starting SwissEph engine on port ${V69_PORT}..."' \
'python3 -m uvicorn astro.v69_server:app --host 0.0.0.0 --port ${V69_PORT} > /tmp/v69.log 2>&1 &' \
'V69_PID=$!' \
'echo "[V69] Python PID=${V69_PID}, waiting 8s..."' \
'sleep 8' \
'if curl -s --max-time 5 "http://127.0.0.1:${V69_PORT}/api/v1/health"; then echo " [V69] Health OK"; else echo " [V69] Health FAILED — v69.log:"; cat /tmp/v69.log; fi' \
'echo "[Node] Starting on port 3000"' \
'exec node server.js' \
> /start.sh && chmod +x /start.sh

EXPOSE 3000 8001
ENV PORT=3000
CMD ["/start.sh"]
