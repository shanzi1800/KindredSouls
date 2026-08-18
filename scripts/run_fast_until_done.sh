#!/bin/bash
cd /Users/apple/Desktop/KindredSouls源代码 2>/dev/null || cd ~/Desktop/KindredSouls源代码
echo "[fast-wrapper] 启动 $(date '+%H:%M:%S')"
for i in $(seq 1 200); do
  echo "[fast-wrapper] ===== 第 $i 轮 $(date '+%H:%M:%S') ====="
  python3 scripts/cplus_fast.py run 2>&1
  echo "[fast-wrapper] 第 $i 轮结束，sleep 5s 后续传..."
  sleep 5
done
echo "[fast-wrapper] 达到最大轮数 200"
