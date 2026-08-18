#!/bin/bash
# C+ 自动重启续传 wrapper（processed 版）：完成判定=所有城市已处理(cplus_alldone.flag)。
cd /Users/apple/Desktop/KindredSouls源代码 2>/dev/null || cd ~/Desktop/KindredSouls源代码
rm -f /tmp/cplus_alldone.flag
MAX_ROUNDS=40
for i in $(seq 1 $MAX_ROUNDS); do
  echo "[wrapper] ===== 第 $i 轮启动 $(date '+%H:%M:%S') ====="
  python3 -u scripts/cplus_truth.py run >> /tmp/cplus_run.log 2>&1
  ec=$?
  echo "[wrapper] 第 $i 轮结束 exit=$ec $(date '+%H:%M:%S')"
  if [ -f /tmp/cplus_alldone.flag ]; then
    echo "[wrapper] 🏁 全部城市已处理完毕（cplus_alldone.flag 存在）"
    python3 scripts/cplus_coverage.py > /tmp/cplus_cov.log 2>&1
    cat /tmp/cplus_cov.log
    touch /tmp/cplus_verified.flag
    exit 0
  fi
  echo "[wrapper] 尚有剩余，2s 后重启续传..."
  sleep 2
done
echo "[wrapper] ⚠️ 达到最大轮数 $MAX_ROUNDS 仍未完成，请人工介入"
exit 1
