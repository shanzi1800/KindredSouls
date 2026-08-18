# 测试泰语月报 URL（2026-08-15 09:20）

## 原始 URL（可能有旧缓存）
```
https://kindredsouls-production.up.railway.app/wealth/report?birth=2014-02-29&time=15:30&lat=18.7883&lon=98.9853&tz=Asia/Bangkok&lang=th&free_access=1
```

## 强制刷新 URL（time=15:31，缓存键不同）
```
https://kindredsouls-production.up.railway.app/wealth/report?birth=2014-02-29&time=15:31&lat=18.7883&lon=98.9853&tz=Asia/Bangkok&lang=th&free_access=1
```

## 测试说明
- 修改出生时间从 15:30 → 15:31，缓存键改变
- 强制后端重新走 buildMonthlyPrompt 逻辑
- 验证 P0-1（月亮行运死锁）和 P0-2（UTF-8 增量解码器）修复效果

## 验证要点
1. 月亮进入天蝎座（ราศีพิจิก）的次数：应该只有 1 次（Aug 9-11）
2. 泰语是否有掉辅音：如 อย่างจริงัง → อย่างจริงจัง
3. 是否有乱码方块 \uFFFD
