#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
本命真值外部比对器 (V423) —— 「真值轴」独立校验器
================================================================================
用途：拿 SwissEph 实算的本命盘真值，逐项比对报告正文里 10 行星的【星座 + 宫位】。
      与 server.js 的 lockNatalTruthVi 共用同一套「从句归因」口径 —— 锁和检查表同源，
      口径一漂移就会在 self_test 里现形。

铁律（三次踩坑换来的）：
  ① 评分表必须先自证：self_test() 用「已知坏样本必须抓到」+「已知好样本必须放行」把检查表钉死，
     抓不到已知坏的检查表，报出的通过率是废纸。
  ② 只向后找宫位 = 误报机器（"Nhà 5 — Mặt Trăng natal của bạn — và Sao Hỏa … Nhà 1" 里 Nhà 1 是火星的）
  ③ 回看窗口过贪 = 把上一分句/流月的数据算成本命（连词表必须含 và/với/khi/cùng…）
  ④ transit(流月) 描述不算本命，回看段含流月动词整段弃用

用法：
  # 0) 自证（CI 每次必跑）
  python3 test/verify_report_truth.py --self-test
  # 1) 离线校验已落盘报告
  python3 test/verify_report_truth.py --dir /tmp/stress_vi
  # 2) 线上端到端（默认 3 profile × 2 轮）
  python3 test/verify_report_truth.py --live
退出码：0 = 真值轴全绿；1 = 有硬挂（星座写错 / 宫位写错 / 自相矛盾）
"""
import argparse
import asyncio
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASTRO = os.path.join(ROOT, 'astro', 'astro_matrix.py')

ORDER = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']
VI = {
    'Sun': 'Mặt Trời', 'Moon': 'Mặt Trăng', 'Mercury': 'Sao Thủy', 'Venus': 'Sao Kim', 'Mars': 'Sao Hỏa',
    'Jupiter': 'Sao Mộc', 'Saturn': 'Sao Thổ', 'Uranus': 'Sao Thiên Vương',
    'Neptune': 'Sao Hải Vương', 'Pluto': 'Sao Diêm Vương',
}
SIGN_EN2VI = {
    'Aries': 'Bạch Dương', 'Taurus': 'Kim Ngưu', 'Gemini': 'Song Tử', 'Cancer': 'Cự Giải',
    'Leo': 'Sư Tử', 'Virgo': 'Xử Nữ', 'Libra': 'Thiên Bình', 'Scorpio': 'Bọ Cạp',
    'Sagittarius': 'Nhân Mã', 'Capricorn': 'Ma Kết', 'Aquarius': 'Bảo Bình', 'Pisces': 'Song Ngư',
}
ALL_VI_SIGNS = list(SIGN_EN2VI.values())

TRANSIT = re.compile(r'di chuyển qua|quá cảnh|transit|đi qua|đi vào|bước vào|luân chuyển|chuyển sang', re.I)
BODY_SPLIT = re.compile(r'(?:^|\s)(?:Mặt|Sao|Hành|Thiên Vương|Hải Vương|Diêm Vương)\s')
BODY_ANY = re.compile(r'(?:^|\s)(?:Mặt|Sao|Hành|Thiên Vương|Hải Vương|Diêm Vương)\s')
CLAUSE_BREAK = re.compile(r'[.;,!?:()\n]|\s(?:và|với|nhưng|song|trong khi|đồng thời|khi|cùng)\s', re.I)
NATALISH = re.compile(r'của bạn|natal|bản mệnh', re.I)
NATALISH_MARK = re.compile(r'natal|bản mệnh|của bạn', re.I)
HOUSE_RE = re.compile(r'Nhà\s*(\d+)')


# ────────────────────────── 真值来源：SwissEph ──────────────────────────
def _python_with_swisseph():
    """后台脚本别信 PATH：nohup/CI 环境下 python3 可能没有 swisseph。"""
    cands = [sys.executable, 'python3']
    for c in (os.environ.get('PYTHON_BIN'), '/usr/bin/python3', '/usr/local/bin/python3'):
        if c:
            cands.append(c)
    for c in cands:
        try:
            r = subprocess.run([c, '-c', 'import swisseph'], capture_output=True, timeout=30)
            if r.returncode == 0:
                return c
        except Exception:
            continue
    return sys.executable


def compute_truth(bd, bt, lat, lon, tz):
    """SwissEph 实算本命盘 → {planet: (vi_sign, house)}。真值绝不手写。"""
    py = _python_with_swisseph()
    r = subprocess.run(
        [py, ASTRO, '--birth-date', str(bd), '--birth-time', str(bt), '--lat', str(lat),
         '--lon', str(lon), '--tz', str(tz), '--mode', 'natal'],
        capture_output=True, text=True, timeout=180)
    d = json.loads(r.stdout)
    ch = d.get('computed_houses', {})
    out = {}
    for p in ORDER:
        info = (d.get('natal_moon') or {}) if p == 'Moon' else ch.get(p)
        if not info and p == 'Sun':
            info = {'sign': d.get('sun_sign'), 'house': (ch.get('Sun') or {}).get('house')}
        if not info:
            continue
        out[p] = (SIGN_EN2VI.get(info.get('sign')), info.get('house'))
    return out


# ─────────────── 从句归因（与 server.js lockNatalTruthVi 同源口径）───────────────
def clause_of(text, i, ln, explicit):
    """返回 (bwd, fwd)：锚点自己那一段。None = 不该碰（非本命/流月）。"""
    a_end = i + ln
    # 🛠️ 严门（与 server.js 同源）：非强标记时，本命定语必须紧贴锚点，
    #   且不得含流月动词 —— 生产实测 “Sao Mộc tại Sư Tử trong Nhà 12 của bạn” 是流月，
    #   从句里那个 “của bạn” 修饰的是宫不是行星，绝不可当真值去改。
    if not explicit:
        after = text[a_end:a_end + 40]
        cut = -1
        for s in ALL_VI_SIGNS:
            k = after.find(s)
            if k >= 0 and (cut < 0 or k < cut):
                cut = k
        hm = HOUSE_RE.search(after)
        if hm and (cut < 0 or hm.start() < cut):
            cut = hm.start()
        pre = after[:cut] if cut >= 0 else after
        if not NATALISH_MARK.search(pre):
            return None
        if TRANSIT.search(pre):
            return None
    fwd = text[a_end:a_end + 90]
    e = re.search(r'[.\n]', fwd)
    if e:
        fwd = fwd[:e.start()]
    b = BODY_SPLIT.search(fwd)
    if b:
        fwd = fwd[:b.start()]
    # 🛠️ V423-fix-node-axis: 节点轴短语「trục X–Y」里的第二个星座是对轴星座，绝非本命落点；
    #   吃进归因窗口会把轴星座误判成本命星座（生产实测误伤）。遇 trục/破折号即截断。
    ai = re.search(r'trục|—|–', fwd, re.I)
    if ai:
        fwd = fwd[:ai.start()]
    bwd = text[max(0, i - 70):i]
    if TRANSIT.search(bwd):
        bwd = ''                                  # 回看段含流月动词 → 整段弃用
    else:
        lo = 0
        for m in CLAUSE_BREAK.finditer(bwd):
            lo = max(lo, m.end())
        # 首个其他星体名【起点】即上界：其后的星座/宫位属于那颗星，绝不算到本锚点上
        bm = BODY_ANY.search(bwd)
        bwd = bwd[lo:(max(lo, bm.start()) if bm else len(bwd))]
    whole = bwd + ' ' + fwd
    return bwd, fwd


def _nearest(zone, pattern, finditer=True):
    """就近一处：返回 zone 内最后出现的匹配（用于回看段）。"""
    last = None
    for m in re.finditer(pattern, zone):
        last = m
    return last


def claims_for(text, vi_name, truth_sign, truth_house):
    """收集该行星在各本命从句里的（星座, 宫位）声明。返回 (claims, transit_hits)"""
    claims, transit_hits = [], 0
    for m in re.finditer(re.escape(vi_name), text):
        explicit = bool(re.match(r'\s*(?:natal|bản mệnh)\b', text[m.end():m.end() + 10], re.I))
        got = clause_of(text, m.start(), len(m.group(0)), explicit)
        if got is None:
            if TRANSIT.search(text[max(0, m.start() - 70):m.start() + 90]):
                transit_hits += 1
            continue
        bwd, fwd = got
        signs, houses = [], []
        for zone, prefer_first in ((fwd, True), (bwd, False)):
            if not zone:
                continue
            s = [x for x in ALL_VI_SIGNS if x in zone]
            if s:
                signs.append(s[0] if prefer_first else s[-1])
            hs = HOUSE_RE.findall(zone)
            if hs:
                houses.append(int(hs[0] if prefer_first else hs[-1]))
        claims.append({'anchor': vi_name, 'sign': signs, 'house': houses,
                       'snippet': (bwd + ' ⟦' + vi_name + '⟧ ' + fwd).strip()[:150]})
    return claims, transit_hits


def verify_report(truth, text):
    """硬门：星座写错 / 宫位写错 / 同锚点宫位自相矛盾。软项：压根没写（依从性）。"""
    hard, soft, detail = [], [], []
    for p in ORDER:
        if p not in truth or not truth[p]:
            continue
        t_sign, t_house = truth[p]
        claims, _ = claims_for(text, VI[p], t_sign, t_house)
        if not claims:
            soft.append(p)
            continue
        seen_houses = set()
        for c in claims:
            for s in c['sign']:
                if t_sign and s != t_sign:
                    hard.append(f"{p} 星座写错: 声称 {s} ≠ 真值 {t_sign} | {c['snippet']}")
            for h in c['house']:
                seen_houses.add(h)
                if t_house and h != t_house:
                    hard.append(f"{p} 宫位写错: 声称 Nhà {h} ≠ 真值 Nhà {t_house} | {c['snippet']}")
        if len(seen_houses) > 1:
            hard.append(f"{p} 自相矛盾: 同一本命锚点出现多个宫位 {sorted(seen_houses)}")
        detail.append((p, sorted(seen_houses), t_sign, t_house))
    return hard, soft, detail


# ─────────────────────────── 自证（CI 必跑）───────────────────────────
SELF_CHART = {p: ('Song Ngư', 11) for p in ORDER}
SELF_CHART['Moon'] = ('Xử Nữ', 4)
SELF_CHART['Sun'] = ('Song Ngư', 11)

SELF_CASES = [
    ('已知坏①: 月亮宫位漂 4→8（必须抓到）',
     'Mặt Trăng natal của bạn ở Xử Nữ Nhà 8 cảnh báo bạn.', True),
    ('已知坏②: 月亮被写成太阳的座（必须抓到）',
     'Mặt Trăng natal của bạn ở Song Ngư Nhà 4 thì thầm.', True),
    ('已知坏③: 同锚点自相矛盾（必须抓到）',
     'Mặt Trăng natal của bạn ở Xử Nữ Nhà 4, và Mặt Trăng natal của bạn ở Xử Nữ Nhà 8.', True),
    ('已知好①: 全对（必须放行）',
     'Mặt Trăng natal của bạn ở Xử Nữ Nhà 4 hỗ trợ bạn.', False),
    ('已知好②: 月亮宫位在前+他星宫位在后（必须放行）',
     'Sự kết hợp giữa Mặt Trăng Xử Nữ Nhà 4 — Mặt Trăng natal của bạn — và Sao Hỏa Cự Giải Nhà 1', False),
    ('已知好⑥: 他星数据在回看段（必须放行）',
     'Sao Hỏa Cự Giải Nhà 1 chiếu vào Mặt Trăng natal của bạn ở Xử Nữ Nhà 4.', False),
    ('已知好⑦: 流月木星+尾部 của bạn（生产实测·必须放行）',
     'Sao Mộc tại Sư Tử trong Nhà 12 của bạn mở rộng trực giác.', False),
    ('已知好⑧: 流月金星（生产实测·必须放行）',
     'Sao Kim Bọ Cạp tại Nhà 1 lại kéo bạn ra ánh sáng với sức hút khó cưỡng.', False),
    ('已知好⑨: 流月+本命定语混写（必须放行）',
     'Mặt Trăng vẫn vận hành trong vùng Bọ Cạp, và cùng với Sao Kim Bọ Cạp tại Nhà 1, bạn có thể bị cuốn vào xung đột.', False),
    ('已知好⑩: 本命月亮后接节点轴含他星座（生产实测·必须放行）',
     'Mặt Trăng natal của bạn ở Xử Nữ Nhà 4, được kích hoạt bởi trục Xử Nữ–Bạch Dương, nhắc bạn.', False),
    ('已知好⑪: 轴短语后接流月月亮（生产实测·必须放行）',
     'Mặt Trăng natal của bạn ở Xử Nữ Nhà 4, trục Xử Nữ–Bạch Dương, trong khi Mặt Trăng transit ở Bọ Cạp.', False),
    ('已知坏④: 回看段是他星数据、本锚点自己也写错（必须抓到）',
     'Sao Hỏa Cự Giải Nhà 1 chiếu vào Mặt Trăng natal của bạn ở Bọ Cạp Nhà 8.', True),
    ('已知好③: 流月（必须放行）',
     'Mặt Trăng đi qua Bọ Cạp Nhà 3 của bạn hôm nay.', False),
    ('已知好④: 上一分句是他星宫位（必须放行）',
     'Mặt Trời di chuyển qua Song Ngư Nhà 11, và Mặt Trăng natal của bạn ở Xử Nữ Nhà 4 nhận cộng hưởng.', False),
    ('已知好⑤: 太阳流月宫位在回看段（必须放行）',
     'Sao Hỏa transit ở Cự Giải Nhà 1 chiếu vào Mặt Trăng natal của bạn ở Xử Nữ Nhà 4.', False),
]


def self_test(verbose=True):
    ok = True
    lines = []
    for name, txt, expect_hard in SELF_CASES:
        hard, _, _ = verify_report(SELF_CHART, txt)
        caught = bool(hard)
        good = (caught == expect_hard)
        ok = ok and good
        tag = '✅' if good else '❌失灵'
        lines.append(f"  {tag} {name} → 判定={'硬挂' if caught else '通过'}"
                     + (f" | {hard[0][:90]}" if hard else ""))
    if verbose:
        print('── 校验器自证（抓不住已知坏 = 通过率作废）──')
        for l in lines:
            print(l)
        print(f"  → {'✅ 自证通过，本次判定可信' if ok else '❌ 自证失败，禁止采信本次结果'}")
    return ok, lines


# ─────────────────────────── 线上端到端 ───────────────────────────
PROFILES = [
    {'bd': '1990-08-05', 'bt': '07:00', 'lat': 10.8231, 'lon': 106.6297, 'tz': 'Asia/Ho_Chi_Minh'},
    {'bd': '1989-10-12', 'bt': '07:00', 'lat': 13.7563, 'lon': 100.5018, 'tz': 'Asia/Bangkok'},
    {'bd': '1992-03-17', 'bt': '09:30', 'lat': 39.9042, 'lon': 116.4074, 'tz': 'Asia/Shanghai'},
    # 下面两个生日专供「强制 MISS」——从未生成过，缓存里不存在 → 验证 10 行星锚点注入后的真实生成行为
    {'bd': '1977-05-21', 'bt': '03:00', 'lat': 21.0278, 'lon': 105.8342, 'tz': 'Asia/Ho_Chi_Minh'},
    {'bd': '1985-02-14', 'bt': '23:30', 'lat': 31.2304, 'lon': 121.4737, 'tz': 'Asia/Shanghai'},
]
# 专供 MISS：只跑这两个（--miss-only）
MISS_PROFILES = PROFILES[3:]
API = os.environ.get('TRUTH_API', 'https://kindredsouls.online/api/wealth-oracle/stream')


async def _fetch(session, prof):
    payload = {'birthDate': prof['bd'], 'birthTime': prof['bt'], 'lat': prof['lat'], 'lon': prof['lon'],
               'tz': prof['tz'], 'lang': 'vi', 'reportType': 'monthly'}
    san, chunks = '', []
    async with session.post(API, json=payload) as r:
        if r.status != 200:
            return None, r.status
        async for line in r.content:
            s = line.decode('utf-8', 'ignore').strip()
            if not s.startswith('data: '):
                continue
            body = s[6:].strip()
            if body == '[DONE]':
                break
            try:
                j = json.loads(body)
            except json.JSONDecodeError:
                continue
            if isinstance(j.get('text'), str):
                chunks.append(j['text'])
            if isinstance(j.get('sanitized'), str):
                san = j['sanitized']
    return (san or ''.join(chunks)), 200


async def run_live(rounds=2, save_dir=None, miss_only=False):
    import aiohttp
    ok_self, _ = self_test()
    if not ok_self:
        return 1
    if save_dir:
        os.makedirs(save_dir, exist_ok=True)
    profs = MISS_PROFILES if miss_only else PROFILES
    results = []
    async with aiohttp.ClientSession() as s:
        for r in range(rounds):
            for prof in profs:
                text, code = await _fetch(s, prof)
                if save_dir and text:
                    with open(os.path.join(save_dir, f"live_r{r + 1}_{prof['bd']}.txt"), 'w', encoding='utf-8') as fh:
                        fh.write(text)
                truth = compute_truth(prof['bd'], prof['bt'], prof['lat'], prof['lon'], prof['tz'])
                if not text:
                    results.append((prof['bd'], code, ['HTTP ' + str(code)], []))
                    continue
                hard, soft, detail = verify_report(truth, text)
                results.append((prof['bd'], code, hard, detail))
                star = '✅' if not hard else '❌'
                covered = ','.join(p for p, _, _, _ in detail)
                print(f"{star} 第{r+1}轮 {prof['bd']} HTTP {code} | 硬挂 {len(hard)} | 已核对行星: {covered}")
                for h in hard[:6]:
                    print(f'     ⚠️ {h}')
    hard_total = sum(len(h) for _, _, h, _ in results)
    print('\n' + '=' * 62)
    print(f"真值轴汇总：{len(results)} 次生成 | 硬挂合计 {hard_total} | "
          f"{'✅ 全绿（10 行星与 SwissEph 真值一致）' if hard_total == 0 else '❌ 存在真值漂移'}")
    print('=' * 62)
    return 0 if hard_total == 0 else 1


def run_dir(d):
    ok_self, _ = self_test()
    if not ok_self:
        return 1
    files = sorted(f for f in os.listdir(d) if f.endswith('.txt'))
    total_hard = 0
    for f in files:
        bd = f.split('_')[1].replace('.txt', '') if '_' in f else None
        prof = next((p for p in PROFILES if p['bd'] == bd), None)
        if not prof:
            continue
        truth = compute_truth(prof['bd'], prof['bt'], prof['lat'], prof['lon'], prof['tz'])
        text = open(os.path.join(d, f), encoding='utf-8').read()
        hard, soft, detail = verify_report(truth, text)
        total_hard += len(hard)
        if hard:
            print(f"❌ {f} 硬挂 {len(hard)}")
            for h in hard[:4]:
                print(f'     ⚠️ {h}')
    print(f"\n离线复评 {len(files)} 篇 | 硬挂合计 {total_hard}")
    return 0 if total_hard == 0 else 1


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--self-test', action='store_true')
    ap.add_argument('--dir')
    ap.add_argument('--live', action='store_true')
    ap.add_argument('--rounds', type=int, default=2)
    ap.add_argument('--save')
    ap.add_argument('--miss-only', action='store_true', help='只跑两个从未生成过的新生日（强制 MISS）')
    a = ap.parse_args()
    if a.self_test:
        ok, _ = self_test()
        return 0 if ok else 1
    if a.dir:
        return run_dir(a.dir)
    if a.live:
        return asyncio.run(run_live(a.rounds, a.save, a.miss_only))
    ok, _ = self_test()
    print('\n(未指定 --dir/--live，仅执行自证)')
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
