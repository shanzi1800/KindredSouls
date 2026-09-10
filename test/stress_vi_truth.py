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

# ── 真值裁定：只看「本命月亮锚点自身从句」内的宫位归属（前后均切在句读/连词/星体名边界）──
BODY_N = r'(?:Mặt Trời|Mặt Trăng|Sao (?:Thủy|Kim|Hỏa|Mộc|Thổ|Thiên Vương|Hải Vương|Diêm Vương)|Thiên Vương|Hải Vương|Diêm Vương)'
BODY_SPLIT = re.compile(r'\s' + BODY_N + r'\s')
BODY_ANY = re.compile(BODY_N)
# 回看边界：句读 + 连词（với/cùng 必须在内——'hợp nhất với ⟦月亮⟧' 的上句宫位不属于月亮）
BW_CUT = re.compile(r'[.;,!?:()\n]|\s(?:và|với|nhưng|song|trong khi|đồng thời|khi|cùng)\s', re.I)
TRANSIT_MARK = re.compile(r'di chuyển qua|quá cảnh|transit|đi qua|đi vào|bước vào|luân chuyển|đầu tháng|cuối tháng|chuyển sang|rời ', re.I)
COMPOUND = re.compile(r'^\s*(?:và|với|,)\s+' + BODY_N + r'[^—–,.;\n]{0,20}?(?:của bạn|cùng)')
NATAL_MOON = re.compile(r'Mặt Trăng natal|Mặt Trăng[^.\n]{0,25}?(?:của bạn|natal)', re.I)


def _moon_clause(text, ms, me):
    fwd = text[me:me + 90]
    e = re.search(r'[.\n]', fwd)
    if e:
        fwd = fwd[:e.start()]
    b = BODY_SPLIT.search(fwd)
    if b and not COMPOUND.match(fwd):
        fwd = fwd[:b.start()]
    bwd = text[max(0, ms - 70):ms]
    cut = -1
    for c in BW_CUT.finditer(bwd):
        cut = max(cut, c.end())
    last = None
    for m in BODY_ANY.finditer(bwd):
        if m.end() < len(bwd):
            last = m
    if last:
        cut = max(cut, last.end())
    return bwd[cut + 1:] + ' ' + fwd


def moon_house_claims(text):
    """返回 (归给本命月亮的宫位集合, 是否出现任何宫位声明)。流月从句整段排除。"""
    hs, seen = set(), False
    for m in NATAL_MOON.finditer(text):
        w = _moon_clause(text, m.start(), m.end())
        if TRANSIT_MARK.search(w):
            continue
        for h in re.findall(r'Nhà\s*(\d+)', w):
            seen = True
            hs.add(int(h))
    return hs, seen


SELF_TEST_CASES = [
    # (标签, 文本, 真值, 期望硬门通过?)
    ('已知坏样本(应抓)', 'Cạm bẫy lớn nhất tháng này nằm ở Nhà 5 — nơi Mặt Trời và Sao Thủy hội tụ tại Xử Nữ — kết hợp với Mặt Trăng natal của bạn ở Xử Nữ Nhà 11.', ('Xử Nữ', 4), False),
    ('已知好样本(应放行)', 'Cạm bẫy đến từ sự kết hợp giữa Mặt Trăng Ma Kết Nhà 5 — Mặt Trăng natal của bạn — và Sao Hỏa Cự Giáo Nhà 1.', ('Ma Kết', 5), True),
    ('太阳宫位在前(不应污染)', 'Mặt Trời natal của bạn khởi hành tại Song Ngư Nhà 11, và Mặt Trăng natal của bạn ở Xử Nữ Nhà 4 nhận cộng hưởng.', ('Xử Nữ', 4), True),
    ('流月宫位(不应污染)', 'Mặt Trăng đi qua Ma Kết Nhà 8 và chạm vào Mặt Trăng natal của bạn ở Ma Kết Nhà 5.', ('Ma Kết', 5), True),
    ('锚前写错宫位(应抓)', 'Nhà 8 — Mặt Trăng natal của bạn — bị kích hoạt.', ('Ma Kết', 5), False),
]


def self_test():
    """检查表自证：直接复用共享比对器的自证样本（单一来源）。"""
    return TRUTHCHK.self_test(verbose=False)


# 拆词签名（精确版）：破损 token 后紧跟空格+小写字母，才判为拆词。
# 旧版用 'ệ nh'/'á ng' 这类泛化片段 → 误报 bảo vệ những / quá ngân sách（2026-09-10 实测 4/4 误报）

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


# 🛠️ V423: 真值轴统一到 verify_report_truth（锁与检查表同源，口径绝不漂移）
#   旧版这里自带一套“只查月亮”的私有口径 → 已废弃，改为调用共享比对器（10 行星全量）
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import verify_report_truth as TRUTHCHK  # noqa: E402

LAST_HARD = []
_TRUTH_CACHE = {}


def verify(profile, text):
    """硬门 = 任一行星本命真值被写错/自相矛盾；软门 = 某行星压根没写（依从性）

    口径全部来自 verify_report_truth（与 server.js lockNatalTruthVi 同源从句归因，
    且由 self_test() 双向自证：4 个已知坏必抓 + 9 个已知好必放行）。
    """
    t = _TRUTH_CACHE.get(profile['bd'])
    if t is None:
        t = TRUTHCHK.compute_truth(profile['bd'], profile['bt'], profile['lat'], profile['lon'], profile['tz'])
        _TRUTH_CACHE[profile['bd']] = t
    hard_list, soft_list, _ = TRUTHCHK.verify_report(t, text)
    LAST_HARD[:] = hard_list
    return (not hard_list), bool(soft_list)


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
                print(f"⚠️ #{req_id:02d} 真值硬门挂 | {profile['bd']} | 打点:", flush=True)
                for _x in LAST_HARD[:4]:
                    print(f"     ↳ {_x}", flush=True)
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
    ok, lines = self_test()
    print("── 检查表自证（好/坏样本双向）──")
    for ln in lines:
        print(ln)
    print(f"  自证结论: {'✅ 检查表可信' if ok else '❌ 检查表失灵，结果不可信！'}", flush=True)
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
