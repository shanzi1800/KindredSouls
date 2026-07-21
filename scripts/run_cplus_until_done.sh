#!/bin/bash
# C+ 自动重启续传 wrapper：完成判定=coverage.py 通过(按13:01铁律，各zone≥99.5%且无冒充)。
# 注意：cplus_truth.py 的“processed=已处理一次”不可信——它把 DeepSeek 返回英文的城也记为 processed。
# 故只有 coverage.py 真正验证 cities.json 的本地名覆盖率达标，才算完成；否则移除假 flag 继续续传。
cd /Users/apple/Desktop/KindredSouls源代码 2>/dev/null || cd ~/Desktop/KindredSouls源代码
rm -f /tmp/cplus_alldone.flag /tmp/cplus_verified.flag
MAX_ROUNDS=40
for i in $(seq 1 $MAX_ROUNDS); do
  echo "[wrapper] ===== 第 $i 轮启动 $(date '+%H:%M:%S') ====="
  python3 -u scripts/cplus_truth.py run >> /tmp/cplus_run.log 2>&1
  ec=$?
  echo "[wrapper] 第 $i 轮结束 exit=$ec $(date '+%H:%M:%S')"
  if [ -f /tmp/cplus_alldone.flag ]; then
    python3 scripts/cplus_coverage.py > /tmp/cplus_cov.log 2>&1
    cov_ec=$?
    cat /tmp/cplus_cov.log
    if [ $cov_ec -eq 0 ]; then
      echo "[wrapper] 🏁 覆盖率达标，全部城市已处理完毕"
      touch /tmp/cplus_verified.flag
      exit 0
    else
      echo "[wrapper] ⚠️ alldone.flag 存在但覆盖率未达标 → 移除假完成标记，继续续传"
      rm -f /tmp/cplus_alldone.flag
    fi
  fi
  echo "[wrapper] 尚有剩余，2s 后重启续传..."
  sleep 2
done
echo "[wrapper] ⚠️ 达到最大轮数 $MAX_ROUNDS 仍未完成，请人工介入"
exit 1
