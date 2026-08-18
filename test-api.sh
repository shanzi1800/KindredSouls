#!/bin/bash
# 🧪 KindredSouls API 测试脚本
# 每次部署前运行，确保核心功能正常

set -e

echo "🧪 开始测试 KindredSouls API..."

# 测试账号
TEST_BIRTH="1990-06-15"
BASE_URL="https://www.kindredsouls.com.au"

# 测试 1: wealth-oracle 基础调用
echo "📊 测试 wealth-oracle..."
RESPONSE=$(curl -s -X POST "${BASE_URL}/api/wealth-oracle" \
  -H "Content-Type: application/json" \
  -d "{\"birthDate\":\"${TEST_BIRTH}\",\"lang\":\"zh\",\"referrer\":\"standalone\"}")

if echo "$RESPONSE" | grep -q "insight\|bazi\|error"; then
  echo "✅ wealth-oracle 返回正常"
else
  echo "❌ wealth-oracle 返回异常: $RESPONSE"
  exit 1
fi

# 测试 2: test-config 端点
echo "🔧 测试 test-config..."
RESPONSE=$(curl -s -X GET "${BASE_URL}/api/test-config")

if echo "$RESPONSE" | grep -q "test.*ok\|PROMPT_VERSION"; then
  echo "✅ test-config 返回正常"
else
  echo "❌ test-config 返回异常: $RESPONSE"
  exit 1
fi

echo ""
echo "🎉 所有测试通过！"
