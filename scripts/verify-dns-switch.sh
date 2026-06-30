#!/bin/bash
# KindredSouls DNS 切换后全链路验证脚本
# DNS 改完跑这个，立刻知道通没通

set -e
DOMAIN="kindredsouls.com"
echo "=== KindredSouls DNS 切换验证 ==="
echo ""

echo "1. DNS 解析"
echo "---"
nslookup $DOMAIN 2>/dev/null | grep -A2 "Name:" | head -5
echo ""

echo "2. HTTPS 健康检查"
echo "---"
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/api/health" --max-time 10)
if [ "$HEALTH" = "200" ]; then
  VERSION=$(curl -s "https://$DOMAIN/api/health" --max-time 10 | python3 -c "import json,sys; print(json.load(sys.stdin).get('version', 'unknown'))" 2>/dev/null)
  echo "✅ /api/health 200 OK - version: $VERSION"
else
  echo "❌ /api/health 返回 $HEALTH"
  exit 1
fi
echo ""

echo "3. 前端首页"
echo "---"
HTML_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/" --max-time 10)
if [ "$HTML_STATUS" = "200" ]; then
  echo "✅ / 200 OK"
  # 抓取当前 bundle hash
  BUNDLE=$(curl -s "https://$DOMAIN/" --max-time 10 | grep -oE 'assets/index-[^"]+\.js' | head -1)
  echo "   Bundle: $BUNDLE"
else
  echo "❌ / 返回 $HTML_STATUS"
fi
echo ""

echo "4. Stripe 重定向测试（不带 origin 看 fallback）"
echo "---"
FALLBACK=$(curl -s -X POST "https://$DOMAIN/api/create-checkout" \
  -H "Content-Type: application/json" \
  -d '{"plan":"compatibility_once"}' \
  --max-time 10 2>/dev/null || echo "failed")
echo "Checkout API response: $FALLBACK"
echo ""

echo "5. AI 财富接口连通性"
echo "---"
WEALTH=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/api/wealth-oracle" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"birthDate":"1990-01-01","lang":"en","referrer":"direct"}' \
  --max-time 30)
if [ "$WEALTH" = "200" ]; then
  echo "✅ /api/wealth-oracle 200 OK (AI 调用通)"
else
  echo "⚠️ /api/wealth-oracle 返回 $WEALTH（可能是 402 付费墙，正常）"
fi
echo ""

echo "=== 验证完成 ==="
echo ""
echo "如果 1~5 全部 ✅，切换成功！"
echo "如果有任何 ❌，把输出发给牛牛看。"
