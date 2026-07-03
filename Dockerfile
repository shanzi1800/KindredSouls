FROM node:20-alpine

# 🛡️ Cache bust - 每次 push 都改时间戳，BUILD-TIME-RUN 用 ARG 才能 invalidate 所有下游 layer
ARG CACHEBUST=20260703-fix-try-catch-final
RUN echo "🔨 Cache bust: $CACHEBUST at $(date -u +%Y-%m-%dT%H:%M:%SZ)"

WORKDIR /app

# 🛡️ 战时最高防御：在 COPY 和安装依赖前，把全盘变量直接拍进容器全局变量！
# 这样无论 Vite 怎么构建，它在 node 环境下 100% 能用 process.env 捞到这两个值！
ENV VITE_SUPABASE_URL=https://wfkxqhlcgrikxoofjvas.supabase.co
ENV VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indma3hxaGxjZ3Jpa3hvb2ZqdmFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2NTU4MjEsImV4cCI6MjA5NTIzMTgyMX0.qMyRlkMRTkPccngccWa2GJroGaROqdA6N937XRK2L4g

# 🛡️ 再加 Railway 需要的环境变量（给 server.js 用）
ENV SUPABASE_URL=https://wfkxqhlcgrikxoofjvas.supabase.co
ENV SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indma3hxaGxjZ3Jpa3hvb2ZqdmFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTY1NTgyMSwiZXhwIjoyMDk1MjMxODIxfQ.IV6CxfemnwbqXWSkwixaN606PV6-NLWb7nJtYvVGeEw
ENV DEEPSEEK_API_KEY=sk-9307f02599b44612b6767996a7839ab5

COPY . .

# 1. 根目录安装 Node.js 服务端依赖
RUN npm install && npm install express stripe

# 2. 🔥 核心绝杀：进入前端 web 目录，强制清除旧的 dist，现场暴力构建！
RUN cd web && rm -rf dist node_modules/.tmp && npm install && npm run build

EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
