FROM node:22-slim

# ── V116: Cache busting — force fresh build on every railway up ──
ARG CACHE_BUST=20260715-V116-GEMINI-KEY
ARG BUILD_DATE=$(date -u +"%Y%m%dT%H%M%SZ")
ARG BUILD_DATE=$(date -u +"%Y%m%dT%H%M%SZ")

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 python3-pip curl && \
    rm -rf /var/lib/apt/lists/*

RUN pip3 install --no-cache-dir --break-system-packages pyswisseph fastapi uvicorn pytz

ENV VITE_SUPABASE_URL=https://wfkxqhlcgrikxoofjvas.supabase.co
ENV VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indma3hxaGxjZ3Jpa3hvb2ZqdmFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2NTU4MjEsImV4cCI6MjA5NTIzMTgyMX0.qMyRlkMRTkPccngccWa2GJroGaROqdA6N937XRK2L4g
ENV SUPABASE_URL=https://wfkxqhlcgrikxoofjvas.supabase.co
# SUPABASE_SERVICE_KEY: 在 Railway Dashboard Variables 页配置为 Secret
ENV V69_PORT=8001
ENV V69_HOST=127.0.0.1
ENV GROQ_KEY=${GROQ_KEY:-}

# ── V97r-final: 写 key 到文件，绕过 Railway Dashboard 环境变量覆盖 ──
# Railway Dashboard 的 env var 会覆盖 Dockerfile 的 ENV。
# 如果 Dashboard 有旧 key，ENV DEEPSEEK_API_KEY 就废了。
# 写文件 → 代码直接读文件，Dashboard 覆盖不到。
RUN printf 'sk-9307f02599b44612b6767996a7839ab5' > /app/.deepseek-key
# V116: Gemini API Key 文件后备（优先读 env var，回退读此文件）
RUN printf '%s' "${GEMINI_API_KEY}" > /app/.gemini-key || true
RUN printf '%s' "$SUPABASE_URL" > /app/.supabase-url
RUN printf '%s' 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indma3hxaGxjZ3Jpa3hvb2ZqdmFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTY1NTgyMSwiZXhwIjoyMDk1MjMxODIxfQ.IV6CxfemnwbqXWSkwixaN606PV6-NLWb7nJtYvVGeEw' > /app/.supabase-key

RUN echo "BUILD_TRIGGER_$(date +%s%N)"

COPY . .

RUN npm install && npm install express stripe

# V99i: 强制重建前端（删除旧 dist + 重新构建）
RUN rm -rf web/dist && cd web && npm install && npm run build && cd ..

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
# PORT 由 Railway 注入(通常是8080),不再硬编码
CMD ["/start.sh"]
# Cache bust: 1783756900
