#!/usr/bin/env bash
# ==============================================================================
# Production /api/wealth-oracle 极限案例真值 + 格式自动测试
# 零外部依赖：curl + node（内置 JSON 解析）
# 覆盖：北极圈 / 赤道 / 国际日期变更线 / 群星汇聚 四组边界案例
# ==============================================================================

set -uo pipefail

PROD_URL="https://kindredsouls-production.up.railway.app/api/wealth-oracle"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}===================================================================${NC}"
echo -e "${BLUE}🚀 Production /api/wealth-oracle 极限案例真值 + 格式自动测试${NC}"
echo -e "${BLUE}目标节点: ${PROD_URL}${NC}"
echo -e "${BLUE}===================================================================${NC}\n"

# 4 组极限测试 JSON 参数组
# expect_sun: 期望的 natal 太阳星座（英文，留空则不强制断言精确星座）
declare -a TEST_CASES=(
 '{"id":"TC-01","name":"Tromso_Arctic","expect_sun":"Sagittarius","birthDate":"1996-12-21","birthTime":"00:00","lat":69.6492,"lon":18.9553,"tz":"Europe/Oslo","lang":"en","reportType":"oracle"}'
 '{"id":"TC-02","name":"Pontianak_Equator","expect_sun":"","birthDate":"1990-06-21","birthTime":"12:00","lat":0.0,"lon":109.3333,"tz":"Asia/Jakarta","lang":"zh","reportType":"oracle"}'
 '{"id":"TC-03","name":"Samoa_IDL","expect_sun":"","birthDate":"2011-12-29","birthTime":"23:59","lat":-13.8333,"lon":-171.7667,"tz":"Pacific/Apia","lang":"es","reportType":"oracle"}'
 '{"id":"TC-04","name":"Tokyo_Stellium","expect_sun":"","birthDate":"1989-02-05","birthTime":"05:30","lat":35.6762,"lon":139.6503,"tz":"Asia/Tokyo","lang":"vi","reportType":"oracle"}'
)

# JS 字段提取辅助（从临时 JSON 文件读，避免 bash 引号冲突）
extract_field() {
  node -e "const c=JSON.parse(require('fs').readFileSync('$1','utf8')); console.log($2)"
}

PASSED=0
FAILED=0

for CASE_JSON in "${TEST_CASES[@]}"; do
  TMP_CASE=$(mktemp)
  echo "$CASE_JSON" > "$TMP_CASE"

  CASE_ID=$(extract_field "$TMP_CASE" "c.id")
  CASE_NAME=$(extract_field "$TMP_CASE" "c.name")
  CASE_LANG=$(extract_field "$TMP_CASE" "c.lang")
  EXPECT_SUN=$(extract_field "$TMP_CASE" "c.expect_sun || ''")

  echo -e "${YELLOW}-------------------------------------------------------------------${NC}"
  echo -e "🔎 [测试中] ${CASE_ID} - ${CASE_NAME} (Language: ${CASE_LANG})"

  START_TIME=$(date +%s%3N)
  TMP_RESPONSE=$(mktemp)
  HTTP_STATUS=$(curl -s -w "%{http_code}" -o "$TMP_RESPONSE" \
    -X POST "$PROD_URL" \
    -H "Content-Type: application/json" \
    -d "$CASE_JSON")
  END_TIME=$(date +%s%3N)
  ELAPSED=$((END_TIME - START_TIME))

  # 1. HTTP Status Check (200)
  if [ "$HTTP_STATUS" != "200" ]; then
    echo -e "  ${RED}❌ HTTP $HTTP_STATUS (期望 200)${NC}"
    FAILED=$((FAILED+1)); rm -f "$TMP_CASE" "$TMP_RESPONSE"; continue
  fi

  # 2. JSON 结构校验：success + data.zodiac.sunSign 非空
  PARSE=$(node -e "
    const fs=require('fs');
    const r=JSON.parse(fs.readFileSync('$TMP_RESPONSE','utf8'));
    const z = r.data && r.data.zodiac;
    const ok = r && r.success===true && z && z.sunSign;
    console.log(ok ? 'OK' : 'FAIL');
    console.log('birthDate=' + (r.birthDate||'') + ' | sunSign=' + (z?z.sunSign:'') + ' | sunSignEn=' + (z?z.sunSignEn:'') + ' | score=' + (r.score!==undefined?r.score:'-'));
  " 2>&1)
  PARSE_STATUS=$(echo "$PARSE" | head -1)
  PARSE_DETAIL=$(echo "$PARSE" | tail -1)

  if [ "$PARSE_STATUS" != "OK" ]; then
    echo -e "  ${RED}❌ JSON 结构校验失败 (success/data.zodiac.sunSign 缺失或解析异常)${NC}"
    echo -e "  ${RED}    $PARSE_DETAIL${NC}"
    FAILED=$((FAILED+1)); rm -f "$TMP_CASE" "$TMP_RESPONSE"; continue
  fi

  # 3. 真值断言（TC-01 北极圈：太阳必须射手座，杜绝假巨蟹回归）
  if [ -n "$EXPECT_SUN" ]; then
    SUN_EN=$(echo "$PARSE_DETAIL" | grep -o 'sunSignEn=[A-Za-z]*' | cut -d= -f2)
    if [ "$SUN_EN" != "$EXPECT_SUN" ]; then
      echo -e "  ${RED}❌ 真值断言失败: sunSignEn=$SUN_EN (期望 $EXPECT_SUN — 北极圈不得为假巨蟹)${NC}"
      FAILED=$((FAILED+1)); rm -f "$TMP_CASE" "$TMP_RESPONSE"; continue
    fi
  fi

  echo -e "  ${GREEN}✅ 通过 (${ELAPSED}ms) | $PARSE_DETAIL${NC}"
  PASSED=$((PASSED+1))
  rm -f "$TMP_CASE" "$TMP_RESPONSE"
done

echo -e "${BLUE}===================================================================${NC}"
echo -e "${GREEN}✅ PASSED: $PASSED${NC}  ${RED}❌ FAILED: $FAILED${NC}"
echo -e "${BLUE}===================================================================${NC}"

[ "$FAILED" -gt 0 ] && exit 1 || exit 0
