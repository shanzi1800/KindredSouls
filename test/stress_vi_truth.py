#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
越南语财运月报 高并发 SSE 压测 + 真值稳定性抽样 (V422)
用法: python3 test/stress_vi_truth.py [concurrency] [total]

v2 修正（2026-09-10，均为「让检查表本身可信」）:
  ① 拆词签名精准化：旧版用 'ệ nh'/'á ng' 泛化片段 → 4/4 误报（bảo vệ những / quá ngân sách）
  ② 记录 [DONE] 与 sanitized 到达情况 → SSE 完备度可量化，且能判断文本取自哪一层
  ③ 硬门/软门分离：星座写错/宫位自相矛盾=硬挂；压根没写宫位=依从性软项
  ④ 分位数 p50/p95/max、HTTP 状态分布、压测期间同步探活、逐篇原文落盘
"""
import asyncio, json, os, re, sys, time
import aiohttp

API_URL = "https://kindredsouls.online/api/wealth-oracle/stream"
HEALTH_URL = "https://kindredsouls.online/api/health"

# 真值基准（本地 SwissEph 独立复核通过，非照抄）
TEST_PROFILES = [
    {"bd": "1990-08-05", "bt": "07:00", "lat": 10.8231, "lon": 106.6297, "tz": "Asia/Ho_Chi_Minh",
     "moon": "Ma Kết", "moon_h": 5, "sun": "Sư Tử"},
    {"bd": "1989-10-12", "bt": "07:00", "lat": 13.7563, "lon": 100.5018, "tz": "Asia/Bangkok",
     "moon": "Song Ngư", "moon_h": 5, "sun": "Thiên Bình"},
    {"bd": "1992-03-17", "bt": "09:30", "lat": 39.9042, "lon": 116.4074, "tz": "Asia/Shanghai",
     "moon": "Xử Nữ", "moon_h": 4, "sun": "Song Ngư"},
]
ALL_SIGNS = ['Bạch Dương', 'Kim Ngưu', 'Song Tử', 'Cự Giải', 'Sư Tử', 'Xử Nữ',
             'Thiên Bình', 'Bọ Cạp', 'Nhân Mã', 'Ma Kết', 'Bảo Bình', 'Song Ngư']
# 拆词签名：破损 token 后紧跟「空格 + 小写字母」才算（避开正常词边界）
CUT_RE = re.compile(r'(?:Vậ|Mệ|Thá|Dươ|Nă|lượ|Mặ|chiế|chuyệ|cuộ|mộ|đượ)\s+[a-zàáâãèéêìíòóôõùúýăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứửữựỳỵỷỹ]')
FOREIGN = re.compile(r'\d[\d.,]*\s*(?:USD|đô(?:\s*la)?|Mỹ kim)|(?:\$|US\$)\s?\d[\d.,]*', re.I)

M = {"success": 0, "failed": 0, "ttfb": [], "total": [], "status": {},
     "truth_pass": 0, "truth_fail": 0, "compliance_miss": 0,
     "fffd": 0, "cut": 0, "currency": 0, "over_amt": 0, "no_trap": 0, "no_week": 0,
     "saw_done": 0, "saw_sanitized": 0, "health_fail": 0, "health_samples": 0}
LOCK = asyncio.Lock()
OUTDIR = "/tmp/stress_vi"


def pct(vals, p):
    if not vals:
        return 0.0
    v = sorted(vals)
    return v[min(len(v) - 1, int(len(v) * p / 100))]


def verify(profile, text):
    """硬门 = 真值被写错或自相矛盾；软门 = 压根没写宫位（依从性）"""
    hard, soft_miss = True, False
    for z in re.findall(r'Mặt Trăng natal[^.\n]{0,40}?\b(' + '|'.join(ALL_SIGNS) + r')\b', text):
        if z != profile["moon"]:
            hard = False
    hs = set(int(h) for h in re.findall(r'Mặt Trăng natal[^.\n]{0,70}?Nhà (\d+)', text))
    if len(hs) > 1 or (hs and hs != {profile["moon_h"]}):
        hard = False
    if not hs:
        soft_miss = True
    return hard, soft_miss


async def health_probe(stop_evt):
    conn = aiohttp.TCPConnector(limit=2)
    async with aiohttp.ClientSession(connector=conn) as s:
        while not stop_evt.is_set():
            try:
                async with s.get(HEALTH_URL, timeout=aiohttp.ClientTimeout(total=10)) as r:
                    async with LOCK:
                        M["health_samples"] += 1
                        if r.status != 200:
                            M["health_fail"] += 1
            except Exception:
                async with LOCK:
                    M["health_samples"] += 1
                    M["health_fail"] += 1
            await asyncio.sleep(5)


async def fetch_sse(session, profile, req_id, sem):
    async with sem:
        payload = {"birthDate": profile["bd"], "birthTime": profile["bt"], "lat": profile["lat"],
                   "lon": profile["lon"], "tz": profile["tz"], "lang": "vi", "reportType": "monthly"}
        t0 = time.time()
        ttfb, san, chunks, saw_done = None, "", [], False
        try:
            async with session.post(API_URL, json=payload, timeout=aiohttp.ClientTimeout(total=180)) as resp:
                async with LOCK:
                    M["status"][resp.status] = M["status"].get(resp.status, 0) + 1
                if resp.status != 200:
                    async with LOCK:
                        M["failed"] += 1
                    print(f"❌ #{req_id:02d} HTTP {resp.status} ({profile['bd']})", flush=True)
                    return
                async for line in resp.content:
                    ls = line.decode('utf-8', errors='ignore').strip()
                    if not ls.startswith("data: "):
                        continue
                    body = ls[6:].strip()
                    if body == "[DONE]":
                        saw_done = True
                        break
                    if ttfb is None:
                        ttfb = time.time() - t0
                    try:
                        p = json.loads(body)
                    except json.JSONDecodeError:
                        continue
                    if isinstance(p.get("text"), str):
                        chunks.append(p["text"])
                    if isinstance(p.get("sanitized"), str):
                        san = p["sanitized"]
        except Exception as e:
            async with LOCK:
                M["failed"] += 1
            print(f"💥 #{req_id:02d} 异常: {type(e).__name__}: {e}", flush=True)
            return

        dur = time.time() - t0
        final = san or "".join(chunks)
        hard, soft_miss = verify(profile, final)
        with open(f"{OUTDIR}/{req_id:02d}_{profile['bd']}.txt", "w", encoding="utf-8") as f:
            f.write(final)

        async with LOCK:
            M["success"] += 1
            M["ttfb"].append(ttfb if ttfb else dur)
            M["total"].append(dur)
            if saw_done:
                M["saw_done"] += 1
            if san:
                M["saw_sanitized"] += 1
            if hard:
                M["truth_pass"] += 1
            else:
                M["truth_fail"] += 1
                _h = sorted(set(re.findall(r'Mặt Trăng natal[^.\n]{0,70}?Nhà (\d+)', final)))
                _z = sorted(set(re.findall(r'Mặt Trăng natal[^.\n]{0,40}?\b(' + '|'.join(ALL_SIGNS) + r')\b', final)))
                print(f"⚠️ #{req_id:02d} 真值硬门挂 | {profile['bd']} 期望 {profile['moon']} Nhà {profile['moon_h']} | 实检 星座={_z} 宫位={_h} | 层={'sanitized' if san else 'raw-stream'}", flush=True)
            if soft_miss:
                M["compliance_miss"] += 1
            if "\uFFFD" in final:
                M["fffd"] += 1
            if CUT_RE.search(final):
                M["cut"] += 1
                print(f"⚠️ #{req_id:02d} 拆词残留: {CUT_RE.search(final).group(0)!r}", flush=True)
            if FOREIGN.search(final):
                M["currency"] += 1
                print(f"⚠️ #{req_id:02d} 外币泄漏: {FOREIGN.search(final).group(0)}", flush=True)
            if re.search(r'(?:[2-9]|\d{2,})\.000\.000', final):
                M["over_amt"] += 1
            if "Cạm bẫy" not in final:
                M["no_trap"] += 1
            if len(re.findall(r'✦\s*\[(?:🟢|🔴|🔵)\s*Tuần \d+', final)) < 4:
                M["no_week"] += 1


async def main():
    conc = int(sys.argv[1]) if len(sys.argv) > 1 else 20
    total = int(sys.argv[2]) if len(sys.argv) > 2 else 60
    os.makedirs(OUTDIR, exist_ok=True)
    print(f"🚀 越南语月报 SSE 压测 | 并发={conc} 总量={total} | 真值基准已本地 SwissEph 复核", flush=True)
    sem = asyncio.Semaphore(conc)
    stop = asyncio.Event()
    conn = aiohttp.TCPConnector(limit=conc + 5)
    async with aiohttp.ClientSession(connector=conn) as s:
        hp = asyncio.create_task(health_probe(stop))
        t0 = time.time()
        await asyncio.gather(*[fetch_sse(s, TEST_PROFILES[i % len(TEST_PROFILES)], i + 1, sem) for i in range(total)])
        wall = time.time() - t0
        stop.set()
        await hp

    print("\n" + "=" * 62)
    print("📊 压测汇总")
    print("=" * 62)
    print(f"墙钟总时长: {wall:.1f}s | 吞吐: {M['success'] / wall:.2f} req/s")
    print(f"请求成功: {M['success']}/{total} ({M['success'] / total * 100:.1f}%) | 失败: {M['failed']}")
    print(f"HTTP 状态分布: {M['status']}")
    print(f"首字延迟 TTFB  p50={pct(M['ttfb'], 50):.2f}s  p95={pct(M['ttfb'], 95):.2f}s  max={max(M['ttfb']) if M['ttfb'] else 0:.2f}s")
    print(f"流完成时长     p50={pct(M['total'], 50):.2f}s  p95={pct(M['total'], 95):.2f}s  max={max(M['total']) if M['total'] else 0:.2f}s")
    print("-" * 62)
    den = M["success"] or 1
    print(f"SwissEph 真值硬门: {M['truth_pass']}/{M['success']} ({M['truth_pass'] / den * 100:.1f}%)")
    print(f"  宫位未写(软项依从性): {M['compliance_miss']} 次")
    print(f"Unicode 乱码 U+FFFD: {M['fffd']} 次")
    print(f"拆词残留:             {M['cut']} 次")
    print(f"外币泄漏:             {M['currency']} 次")
    print(f"越界金额(>50万):      {M['over_amt']} 次")
    print(f"缺陷阱段:             {M['no_trap']} 次 | 缺周次(<4): {M['no_week']} 次")
    print(f"SSE 完备度: [DONE] {M['saw_done']}/{M['success']} | sanitized 终稿 {M['saw_sanitized']}/{M['success']}")
    print(f"压测期间探活: {M['health_samples'] - M['health_fail']}/{M['health_samples']} 次 HTTP 200 (失败 {M['health_fail']})")
    print("=" * 62)
    print(f"原文已落盘: {OUTDIR}/")


if __name__ == "__main__":
    asyncio.run(main())
