# FORCE REBUILD 1785664211
FROM node:22-slim

# ── V116: Cache busting — force fresh build on every railway up ──
ARG CACHE_BUST=20260812-V223e-GH-1723431800
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
RUN echo "BUILD_TRIGGER_FORCE_$(date +%s%N) - V200 frontend fix" \
    && if [ -f .git-sha ]; then \
         echo "[DEPLOY FINGERPRINT] Git SHA: $(cat .git-sha)"; \
    else \
      echo "unknown" > .git-sha && \
      echo "[DEPLOY FINGERPRINT] No .git-sha file found, using 'unknown'"; \
    fi

RUN echo "[BUILD] CACHE_BUST=${CACHE_BUST} forcing full rebuild"
COPY . .
RUN echo "[BUILD] after copy, server.js BYTES:" && wc -c /app/server.js && echo "[BUILD] marker check:" && grep -c "V229" /app/server.js || echo "V229 not found" && echo "wealth-stream refs:" && grep -c 'wealth-stream' /app/server.js

RUN npm install && npm install express stripe

# ── 前端构建: Vite 环境变量注入 ──
# Supabase 凭据必须在构建时注入 Vite，否则运行时报错 supabaseUrl is required
RUN rm -rf web/dist && \
    cd web && \
    npm install && \
    VITE_SUPABASE_URL=https://wfkxqhlcgrikxoofjvas.supabase.co \
    VITE_SUPABASE_ANON_KEY=sb_publishable_v4T_OvG7eZp48NJH4ALQzA_GVd0SsJv \
    npm run build && \
    cd ..

EXPOSE 3000

CMD ["/start.sh"]
