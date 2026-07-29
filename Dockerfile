FROM node:22-slim

# ── V116: Cache busting — force fresh build on every railway up ──
ARG CACHE_BUST=20260729-V180-FORCE-REBUILD-CACHE-BUST
ARG BUILD_DATE=$(date -u +"%Y%m%dT%H%M%SZ")

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 python3-pip curl && \
    rm -rf /var/lib/apt/lists/*

RUN pip3 install --no-cache-dir --break-system-packages --only-binary :all: pyswisseph fastapi uvicorn pytz || \
    pip3 install --no-cache-dir --break-system-packages pyswisseph fastapi uvicorn pytz

# ── 启动脚本: V69 multi-service ──
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
    'if curl -s --max-time 5 "http://127.0.0.1:${V69_PORT}/api/v1/health"; then echo " [V69] Health OK"; else echo " [V69] Health FAILED"; fi' \
    'echo "[Node] Starting on port 3000"' \
    'exec node server.js' > /start.sh && chmod +x /start.sh

# ── 凭据写入容器文件 ──
RUN printf '%s' "https://wfkxqhlcgrikxoofjvas.supabase.co" > /app/.supabase-url
RUN printf '%s' 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indma3hxaGxjZ3Jpa3hvb2ZqdmFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTY1NTgyMSwiZXhwIjoyMDk1MjMxODIxfQ.IV6CxfemnwbqXWSkwixaN606PV6-NLWb7nJtYvVGeEw' > /app/.supabase-key
RUN printf '%s' "${GEMINI_API_KEY}" > /app/.gemini-key || true
RUN printf '%s' "sk-9307f02599b44612b6767996a7839ab5" > /app/.deepseek-key
RUN echo "BUILD_TRIGGER_$(date +%s%N)" 

COPY . .

# ── 部署指纹: CI 写入的 git SHA (build time) ──
# CI workflow 在 checkout 后执行 git rev-parse HEAD > .git-sha
# COPY . . 已经把 .git-sha 放到 /app/.git-sha (WORKDIR 是 /app)
RUN if [ -f .git-sha ]; then \
      echo "[DEPLOY FINGERPRINT] Git SHA: $(cat .git-sha)"; \
    else \
      echo "unknown" > .git-sha && \
      echo "[DEPLOY FINGERPRINT] No .git-sha file found, using 'unknown'"; \
    fi

RUN npm install && npm install express stripe
RUN rm -rf web/dist && cd web && npm install && npm run build && cd ..

EXPOSE 3000

CMD ["/start.sh"]
