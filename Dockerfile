FROM node:20-alpine

WORKDIR /app

# 复制 package.json 和依赖
COPY api/package.json api/package-lock.json* ./
RUN npm install --omit=dev

# 复制源码
COPY . .

# 预构建前端（如果需要）
# RUN npm run build:web 2>/dev/null || true

EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
