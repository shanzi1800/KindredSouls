FROM node:20-alpine AS builder

WORKDIR /app

# 先复制 package.json 安装依赖
COPY package*.json ./
RUN npm install && npm install express stripe

# 复制前端并构建
COPY web/package*.json ./web/
RUN cd web && npm install

# 复制所有源代码
COPY . .

# 🔥 强制重新构建 - 每次改这行注释的时间戳
# TIMESTAMP: 20260705_1320_V13_FORCE_REBUILD_NO_CACHE
RUN cd web && rm -rf dist node_modules/.cache && npm run build

# 最终镜像
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app .
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
