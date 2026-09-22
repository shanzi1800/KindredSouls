# V337b: force rebuild at 2246
# V332: 强制 Docker layer invalidate —— V321/V331 CACHE_BUST 仍被缓存, 升级彻底刷新
ARG CACHE_BUST=20260922-1200-V465-FROMCHANGE-FORCE-REBUILD
FROM node:22-bookworm-slim

# ── V200(2026-08-18): 隔离 DeepSeek key，Railway 生产走 Gemini ──
ARG CACHE_BUST=20260922-1200-V465-FRESHBUILD-NEVERCACHED

WORKDIR /app

# V336: 强制 Docker 缓存失效——改命令文字本身(非ARG值), Docker 必破层缓存
RUN echo "[V336-FORCE-REBUILD-TRIGGER-001] cache invalidated at build time" && date

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
    'echo "[Node] Starting on port ${PORT:-3000}"' \
    'exec node server.js' > /start.sh && chmod +x /start.sh

# ── 非敏感配置写入容器文件（URL 属公开信息，可保留）──
# ⚠️ V437: service_role 密钥已从镜像彻底剥离——严禁再把任何 JWT/密钥 printf 进镜像！
#    运行时凭据一律走环境变量（server.js 环境变量优先，容器文件仅本地兜底）。
#    轮换流程：Railway 改 SUPABASE_SERVICE_KEY 变量 → Redeploy（无需重新构建镜像）
RUN printf '%s' "https://wfkxqhlcgrikxoofjvas.supabase.co" > /app/.supabase-url
RUN printf '%s' "${GEMINI_API_KEY}" > /app/.gemini-key || true
# V200: DeepSeek key 不写入容器，生产全走 Gemini（与 8818 隔离）
RUN rm -f /app/.deepseek-key || true
RUN echo "BUILD_TRIGGER_FORCE_$(date +%s%N) - V200 frontend fix" \
    && if [ -f .git-sha ]; then \
         echo "[DEPLOY FINGERPRINT] Git SHA: $(cat .git-sha)"; \
    else \
      echo "unknown" > .git-sha && \
      echo "[DEPLOY FINGERPRINT] No .git-sha file found, using 'unknown'"; \
    fi

RUN echo "[V339-FORCE-FRESH-COPY] clearing /app before COPY to prevent stale layer cache"
RUN rm -rf /app/*
COPY . .
# ── V339 SMOKE TEST: 主动校验 COPY 是否成功 ──
# 如果 server.js < 400KB，说明 COPY 被 BuildKit 缓存劫持了，必须报错退出而非静默跑旧代码
RUN echo "[V339-SMOKE] server.js BYTES: $(wc -c < /app/server.js) (expect > 400000 for V339+)" && \
    if [ "$(wc -c < /app/server.js)" -lt 400000 ]; then \
        echo "[V339-ERROR] COPY FAILED: server.js is $(wc -c < /app/server.js) bytes (expected > 400000 for V339+)!"; \
        echo "[V339-ERROR] Railway BuildKit cache is hijacking COPY. BUILD WILL USE STALE CODE!"; \
        exit 1; \
    fi && \
    echo "[V339-SMOKE] ✅ server.js passed (new code confirmed, $(wc -c < /app/server.js) bytes)"

RUN npm install && npm install express stripe

# ── 前端构建: Vite 环境变量注入 ──
# 🛠️ V318: 禁用容器内 rebuild —— Railway Docker build 缓存会命中旧 web/dist(BJ1vp0PL, V324时代)
#          导致 V318 改动永不生效。改用 git 中已预构建的 web/dist（commit c108874 含 V318）
#          直接用 COPY . . 进来的 dist，避免缓存陷阱。
# RUN rm -rf web/dist && \
#     cd web && \
#     npm install && \
#     VITE_SUPABASE_URL=https://wfkxqhlcgrikxoofjvas.supabase.co \
#     VITE_SUPABASE_ANON_KEY=sb_publishable_v4T_OvG7eZp48NJH4ALQzA_GVd0SsJv \
#     npm run build && \
#     cd ..
RUN echo "[V318] skip in-container web rebuild, use prebuilt dist from git"

EXPOSE 3000

CMD ["/start.sh"]
