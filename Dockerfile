FROM node:20-alpine

WORKDIR /app

# 🛠️ 军师V24反缓存锁：放源文件前先发一个绝对不缓存的 trigger
# Railway 的 snapshot 缓存太激进，必须在每个 RUN 前打上唯一时间戳水印才能逼其重跑
ARG CACHEBUST=2026-07-05-V24-FORCE-REBUILD-PROTOCOL
RUN echo "🛠️ CACHEBUST=$CACHEBUST at $(date -u +%Y-%m-%dT%H:%M:%SZ)" > /tmp/cachebust.log
RUN cat /tmp/cachebust.log

# 环境变量
ENV VITE_SUPABASE_URL=https://wfkxqhlcgrikxoofjvas.supabase.co
ENV VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indma3hxaGxjZ3Jpa3hvb2ZqdmFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2NTU4MjEsImV4cCI6MjA5NTIzMTgyMX0.qMyRlkMRTkPccngccWa2GJroGaROqdA6N937XRK2L4g
ENV SUPABASE_URL=https://wfkxqhlcgrikxoofjvas.supabase.co
ENV SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indma3hxaGxjZ3Jpa3hvb2ZqdmFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTY1NTgyMSwiZXhwIjoyMDk1MjMxODIxfQ.IV6CxfemnwbqXWSkwixaN606PV6-NLWb7nJtYvVGeEw
ENV DEEPSEEK_API_KEY=sk-9307f02599b44612b6767996a7839ab5

# 🛠️ 军师V24：先复制 BUILD_TRIGGER.txt 逼 Railway 重新拉取文件
COPY BUILD_TRIGGER.txt /tmp/BUILD_TRIGGER.txt
RUN echo "Build trigger file: $(cat /tmp/BUILD_TRIGGER.txt)"

# 复制所有文件
COPY . .

# 删除本地 dist（避免干扰）
RUN rm -rf web/dist

# 安装依赖并构建
RUN echo "🔥 V24 重新构建: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
RUN npm install && npm install express stripe
RUN cd web && rm -rf node_modules/.cache && npm install && npm run build 2>&1

# 验证 dist 存在
RUN ls -la web/dist/ && cat web/dist/index.html | head -5

EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
