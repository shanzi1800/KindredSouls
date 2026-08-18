#!/bin/bash
# 检查 Railway 当前运行的 Commit SHA

echo "🔍 正在检查 Railway 部署状态..."
echo ""

# 方法 1: 检查生产域名的 /api/status 端点
echo "方法 1: 检查 /api/status 端点"
STATUS=$(curl -s --max-time 10 "https://kindredsouls-production.up.railway.app/api/status" 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ /api/status 响应:"
    echo "$STATUS" | head -20
    echo ""
else
    echo "❌ /api/status 请求失败或超时"
    echo ""
fi

# 方法 2: 检查 /healthz 端点
echo "方法 2: 检查 /healthz 端点"
HEALTH=$(curl -s --max-time 10 "https://kindredsouls-production.up.railway.app/healthz" 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ /healthz 响应:"
    echo "$HEALTH"
    echo ""
else
    echo "❌ /healthz 请求失败或超时"
    echo ""
fi

# 方法 3: 检查 server.js 中的部署标记
echo "方法 3: 检查本地 Git 最新 Commit"
echo "本地最新 Commit: d6243c8 (P0-fix: UTF-8 增量解码器)"
echo ""

echo "📋 下一步操作："
echo "1. 登录 Railway Dashboard: https://railway.app"
echo "2. 找到 KindredSouls 项目"
echo "3. 查看当前运行的 Commit SHA"
echo "4. 如果不是 d6243c8，点击 'Redeploy' 手动触发部署"
echo "5. 等待 2-3 分钟后重新测试"
