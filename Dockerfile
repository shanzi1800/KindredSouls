FROM node:20-alpine

WORKDIR /app

# 🛡️ 战时最高防御：环境变量
ENV VITE_SUPABASE_URL=https://wfkxqhlcgrikxoofjvas.supabase.co
ENV VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indma3hxaGxjZ3Jpa3hvb2ZqdmFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2NTU4MjEsImV4cCI6MjA5NTIzMTgyMX0.qMyRlkMRTkPccngccWa2GJroGaROqdA6N937XRK2L4g
ENV SUPABASE_URL=https://wfkxqhlcgrikxoofjvas.supabase.co
ENV SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indma3hxaGxjZ3Jpa3hvb2ZqdmFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTY1NTgyMSwiZXhwIjoyMDk1MjMxODIxfQ.IV6CxfemnwbqXWSkwixaN606PV6-NLWb7nJtYvVGeEw
ENV DEEPSEEK_API_KEY=sk-9307f02599b44612b6767996a7839ab5

# 1. 复制 package.json 先安装依赖（利用缓存）
COPY package*.json ./
RUN npm install && npm install express stripe

# 2. 复制前端 package.json 并安装依赖
COPY web/package*.json ./web/
RUN cd web && npm install

# 3. 复制所有源代码
COPY . .

# 🔥 终极绝杀：直接在 RUN 命令里嵌入唯一时间戳，让 Railway 缓存彻底失效！
# 每次修改这个时间戳，整个命令内容就变了，缓存必然失效！
RUN cd web && rm -rf dist && npm run build && echo "✅ BUILD_COMPLETE_20260705_1245_V11_FINAL"

EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
