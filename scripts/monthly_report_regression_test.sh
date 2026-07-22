#!/bin/bash
# =====================================================================
# KindredSouls 月报回归测试矩阵
# 每次部署后运行，覆盖所有易错宫位场景
# =====================================================================
set -o pipefail

BASE_URL="${1:-https://kindredsouls-production.up.railway.app}"
PASS=0 FAIL=0

# 颜色
RED='\033[0;31m' GREEN='\033[0;32m' YELLOW='\033[1;33m' NC='\033[0m'

pass() { echo -e "  ${GREEN}✅ $1${NC}"; PASS=$((PASS+1)); }
fail() { echo -e "  ${RED}❌ $1${NC}"; FAIL=$((FAIL+1)); }

# 通用检测：相角术语（任何生日通用）
check_angle_terms() {
  local text="$1" name="$2"
  local bad=0
  for term in "三分相" "四分相" "对分相" "六分相" "合相"; do
    count=$(echo "$text" | grep -o "$term" | wc -l)
    if [ "$count" -gt 0 ]; then
      echo "    ❌ 含 '$term' x$count"
      bad=$((bad+1))
    fi
  done
  if [ $bad -eq 0 ]; then
    pass "$name: 无相角术语"
  else
    fail "$name: 含 $bad 种相角术语"
  fi
}

# 水瓶座宫位检测（Pluto水瓶=House 11）
check_aquarius_house() {
  local text="$1" name="$2"
  # 水瓶座第+任何数字（不是第十一宫）
  if echo "$text" | grep -E '水瓶座第(第|零|一(?!一)|二|三|四|五|六|七|八|九|十(?!一)|[0-9])' > /dev/null 2>&1; then
    fail "$name: 水瓶座宫位错误(非第十一宫)"
  elif echo "$text" | grep -o '水瓶座第十一宫' | head -1 | grep -q '第十一宫'; then
    pass "$name: 水瓶座=第十一宫"
  else
    # 有水瓶座但无宫位描述，正常
    pass "$name: 水瓶座(无宫位冲突)"
  fi
}

# 章节标题检测
check_section_titles() {
  local text="$1" name="$2"
  local err=0
  for t in "【开篇】" "【第1周】" "【第2周】" "【第3周】" "【第4周】" "【消费陷阱】"; do
    if ! echo "$text" | grep -q "$t"; then
      echo "    ❌ 缺少章节: $t"
      err=$((err+1))
    fi
  done
  if [ $err -eq 0 ]; then
    pass "$name: 章节结构完整"
  else
    fail "$name: 章节缺失 x$err"
  fi
}

# 字数检测
check_length() {
  local text="$1" name="$2" min="${3:-1000}"
  local len=${#text}
  if [ $len -ge $min ]; then
    pass "$name: 字数${len} ≥ ${min}"
  else
    fail "$name: 字数${len} < ${min}"
  fi
}

# 调用月报API并返回纯文本（先清缓存确保新生效）
# ✅ 优先读 sanitized（=cleanedText=用户实际看到的终稿），fallback 到 text
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
call_monthly() {
  local birth="$1"
  curl -s --max-time 5 "$BASE_URL/api/clear-cache/$birth/zh/monthly" > /dev/null 2>&1 || true
  sleep 2
  curl -s --max-time 120 -X POST "$BASE_URL/api/wealth-oracle/stream?free_access=1" \
    -H "Content-Type: application/json" \
    -d "{\"birthDate\":\"$birth\",\"lang\":\"zh\",\"reportType\":\"monthly\"}" 2>/dev/null | \
    python3 "$SCRIPT_DIR/monthly_parser.py"
}

echo "============================================"
echo "  月报回归测试矩阵"
echo "  目标: $BASE_URL"
echo "  时间: $(date '+%Y-%m-%d %H:%M')"
echo "============================================"
echo ""

# ── 测试矩阵 ──────────────────────────────────────────
# 格式: "生日|星座|描述|特殊检测"
declare -a TESTS=(
  # 核心易错宫位场景
  "1993-01-23|水瓶座|Pluto水瓶=House11必校验"
  "1988-08-08|狮子座|Jupiter狮子易错House5"
  "1979-05-20|金牛座|Saturn白羊易错House1"
  "1990-12-15|射手座|通用场景"
  "2000-05-20|金牛座|通用场景"

  # 12星座全覆盖
  "1993-01-23|水瓶座|Aries-Pisces"
  "1992-06-21|巨蟹座|Cancer-Leo"
  "1985-11-22|射手座|Sagittarius-Capricorn"
  "1998-02-19|双鱼座|Pisces-Aries"
  "2001-04-20|白羊座|Aries-Taurus"
  "1995-07-23|狮子座|Leo-Virgo"
  "1994-09-17|处女座|Virgo-Libra"
  "1991-10-08|天秤座|Libra-Scorpio"
  "1996-11-23|天蝎座|Scorpio-Sagittarius"
  "1993-01-05|摩羯座|Capricorn-Aquarius"
)

echo "▶ 正在测试 ${#TESTS[@]} 个生日..."
echo ""

for entry in "${TESTS[@]}"; do
  IFS='|' read -r birth sign desc <<< "$entry"
  echo "【$birth】($sign) $desc"
  
  text=$(call_monthly "$birth")
  text_len=${#text}
  
  if [ $text_len -lt 100 ]; then
    fail "API返回异常(字数$text_len)"
    echo ""
    continue
  fi
  
  # 通用检测
  check_angle_terms "$text" "$birth"
  check_aquarius_house "$text" "$birth"
  check_section_titles "$text" "$birth"
  check_length "$text" "$birth" 800
  
  echo ""
done

# ── 结果汇总 ──────────────────────────────────────────
echo "============================================"
echo "  测试结果汇总"
echo "============================================"
echo -e "  ${GREEN}✅ 通过: $PASS${NC}"
echo -e "  ${RED}❌ 失败: $FAIL${NC}"
echo "  总计: $(($PASS + $FAIL))"

if [ $FAIL -gt 0 ]; then
  echo ""
  echo -e "${RED}⚠️  回归测试失败，BLOCK 部署${NC}"
  exit 1
else
  echo ""
  echo -e "${GREEN}🎉 全部通过，可以部署${NC}"
  exit 0
fi
