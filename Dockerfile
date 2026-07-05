# 🔥 终极强制重建版 Dockerfile - 每次改这行时间戳
# TIMESTAMP: 20260705_1300_V12_FORCE_REBUILD

FROM node:20-alpine

WORKDIR /app

# 环境变量
ENV VITE_SUPABASE_URL=https://wfkxqhlcgrikxoofjvas.supabase.co
ENV VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indma3hxaGxjZ3Jpa3hvb2ZqdmFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2NTU4MjEsImV4cCI6MjA5NTIzMTgyMX0.qMyRlkMRTkPccngccWa2GJroGaROqdA6N937XRK2L4g
ENV SUPABASE_URL=https://wfkxqhlcgrikxoofjvas.supabase.co
ENV SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indma3hxaGxjZ3Jpa3hvb2ZqdmFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTY1NTgyMSwiZXhwIjoyMDk1MjMxODIxfQ.IV6CxfemnwbqXWSkwixaN606PV6-NLWb7nJtYvVGeEw
ENV DEEPSEEK_API_KEY=sk-9307f02599b44612b6767996a7839ab5

# 安装依赖
COPY package*.json ./
RUN npm install && npm install express stripe

# 复制全部代码（包括前端）
COPY . .

# 🔥 关键：安装前端依赖并构建
RUN cd web && npm install && rm -rf dist && npm run build 2>&1 | tee /tmp/build.log && echo "BUILD_EXIT_CODE=$?"

EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
