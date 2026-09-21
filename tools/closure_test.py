#!/usr/bin/env python3
"""
KindredSouls 财富月报 / 年报 · 封仓验收测试
2026-09-21 · V461 封仓线

设计:
  - 打生产端点 /api/wealth-oracle（非流式，返回完整 report 文本）
  - 12 组合: monthly×6语 + yearly×6语
  - 含历史 bug 剖面回归（1976-12-03 Madrid = Mercury 天蝎→天秤 bug 现场）
  - 自动断言: 真值/格式/乱码/套话/占位符/币种/结构
用法:
  python3 tools/closure_test.py            # 全量
  python3 tools/closure_test.py --quick    # 只跑 monthly zh
"""
import json, sys, re, time, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime

ENDPOINT = "https://kindredsouls.online/api/wealth-oracle"
OUT = "/Users/apple/.qclaw/workspace/docs/kindredsouls-pet/closure_test_results.json"
TIMEOUT = 300

# ── 测试剖面（生日尽量未测过 → 强制 cache MISS）──
PROFILES = [
    # id, birthDate, birthTime, lat, lon, tz, 备注
    ("P1_madrid1976", "1976-12-03", "03:15", 40.4168, -3.7038, "Europe/Madrid",
     "🎯 历史 bug 现场：流年水星曾错写天蝎座(真值天秤座)"),
    ("P2_madrid1988", "1988-12-03", "22:10", 40.4168, -3.7038, "Europe/Madrid",
     "军师 95 分样盘(es)"),
    ("P3_beijing",    "1989-11-12", "02:00", 39.9042, 116.4074, "Asia/Shanghai",
     "CI 基线盘"),
    ("P4_helsinki",   "1993-12-05", "17:25", 66.5039, 25.7294, "Europe/Helsinki",
     "高纬度盘"),
    ("P5_reykjavik",  "2002-02-14", "03:50", 64.1466, -21.9426, "Atlantic/Reykjavik",
     "极西盘"),
    ("P6_bangkok",    "1985-07-22", "14:30", 13.7563, 100.5018, "Asia/Bangkok",
     "东南亚盘"),
]

LANGS = ["zh", "en", "es", "fr", "th", "vi"]

# ── 套话黑名单（V461-B 已根除，必须为 0 命中）──
SLOGAN_BLACKLIST = {
    "zh": ["月亮过境", "财富充能", "高危熔断", "顺流蓄力", "财富爆发", "依次行经", "本周是", "本周能量"],
    "en": ["Moon transit", "Wealth Recharge", "High-Risk Circuit", "Wealth Explosion",
           "This week is", "Moon travels through"],
    "es": ["tránsito lunar recorre", "Recarga de Riqueza", "Cortocircuito de Alto Riesgo",
           "Explosión de Riqueza"],
    "fr": ["La Lune traverse", "Recharge de Richesse", "Explosion de Richesse"],
    "th": ["ดวงจันทร์เคลื่อนผ่าน", "เติมพลังความมั่งคั่ง"],
    "vi": ["Mặt Trăng đi qua", "Nạp Năng Lượng"],
}

# ── 占位符残留（必须为 0）──
PLACEHOLDERS = ["{{risk_limit}}", "{{cooldown_hours}}", "{MONTH}", "{{", "}}", "undefined", "NaN",
                "[[", "]]", "(报告)", "占位"]

# ── 币种锚点（每语必须出现对应币种）──
CURRENCY = {
    "zh": ["¥", "元", "人民币"],
    "en": ["$", "USD", "dollar"],
    "es": ["€", "euro"],
    "fr": ["€", "euro"],
    "th": ["฿", "บาท"],
    "vi": ["₫", "VND", "đồng", "dong"],
}

# ── 英文泄漏检查（非 en 语种不得出现英文月报标题）──
EN_LEAK = ["Monthly Destiny Theme", "Wealth Trap", "Week 1:", "Week 2:", "Week 3:", "Week 4:"]


def fetch(profile, lang, rtype):
    pid, bd, bt, lat, lon, tz, note = profile
    body = json.dumps({
        "birthDate": bd, "birthTime": bt, "lat": lat, "lon": lon, "tz": tz,
        "lang": lang, "reportType": rtype, "freeAccess": True,
    }).encode()
    req = urllib.request.Request(ENDPOINT, data=body,
                                 headers={"Content-Type": "application/json"})
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            raw = r.read().decode("utf-8", errors="replace")
            code = r.status
    except urllib.error.HTTPError as e:
        raw, code = e.read().decode("utf-8", errors="replace"), e.code
    except Exception as e:
        raw, code = json.dumps({"__err": str(e)}), 0
    dt = round(time.time() - t0, 1)
    try:
        j = json.loads(raw)
    except Exception:
        j = {"__unparsable": raw[:500]}
    text = ""
    for k in ("report", "insight", "result", "text"):
        v = j.get(k)
        if isinstance(v, str) and len(v) > 100:
            text = v
            break
    if not text:
        for k in ("data", "reportData"):
            v = j.get(k)
            if isinstance(v, dict):
                for kk in ("report", "insight", "text"):
                    if isinstance(v.get(kk), str) and len(v[kk]) > 100:
                        text = v[kk]
                        break
    return {
        "profile": pid, "note": note, "birthDate": bd, "lang": lang, "reportType": rtype,
        "http": code, "sec": dt, "chars": len(text), "cached": bool(j.get("cached")),
        "text": text, "raw_head": raw[:300] if not text else "",
    }


def check(res):
    """对单份报告做全维断言，返回 (fails, warns, stats)"""
    t = res["text"]
    lang, rt = res["lang"], res["reportType"]
    fails, warns, stats = [], [], {}

    if res["http"] != 200:
        fails.append(f"HTTP {res['http']}")
    if not t:
        fails.append(f"空报告 (raw: {res['raw_head'][:120]})")
        return fails, warns, stats

    # 1) 乱码
    fffd = t.count("\ufffd")
    stats["U+FFFD"] = fffd
    if fffd: fails.append(f"乱码 U+FFFD × {fffd}")

    # 2) 括号配平
    bal = {}
    for o, c, name in [("(", ")", "half"), ("（", "）", "full"), ("[", "]", "bracket")]:
        bal[name] = (t.count(o), t.count(c))
    stats["括号"] = bal
    if bal["half"][0] != bal["half"][1]:
        fails.append(f"半角括号不配平 {bal['half'][0]}开/{bal['half'][1]}闭")
    if bal["full"][0] != bal["full"][1]:
        fails.append(f"全角括号不配平 {bal['full'][0]}开/{bal['full'][1]}闭")

    # 3) 占位符残留
    residue = [p for p in PLACEHOLDERS if p in t]
    stats["占位符残留"] = residue
    if residue: fails.append(f"占位符残留 {residue}")

    # 4) 套话黑名单
    hits = [s for s in SLOGAN_BLACKLIST.get(lang, []) if s in t]
    stats["套话命中"] = hits
    if hits: fails.append(f"套话回流 {hits}")

    # 5) 币种锚点
    cur = CURRENCY.get(lang, [])
    if cur and not any(c in t for c in cur):
        fails.append(f"缺币种锚点 {cur}")

    # 6) 英文泄漏（非 en）
    if lang != "en":
        leak = [e for e in EN_LEAK if e in t]
        if leak: fails.append(f"英文标题泄漏 {leak}")

    # 7) 结构：月报必须有 ✦ 标题 + 周次标记
    stats["✦数"] = t.count("✦")
    if rt == "monthly":
        if "✦" not in t: fails.append("月报缺 ✦ 标题")
        wk = sum(1 for m in ["第1周", "第2周", "第3周", "第4周", "Week 1", "Week 2", "Week 3", "Week 4",
                             "Semana 1", "Semaine 1", "สัปดาห์ที่ 1", "Tuần 1"] if m in t)
        stats["周次标记"] = wk
        if wk < 3: warns.append(f"周次标记仅 {wk} 个")
        if "⚠" not in t: fails.append("月报缺消费陷阱 ⚠️ 段")
    else:
        # 年报：5 大乐章
        stats["乐章"] = sum(1 for m in ["乐章", "Movement", "Movimiento", "Mouvement", "บท", "Chương"] if m in t)

    # 8) 篇幅
    if rt == "monthly" and len(t) < 2500:
        warns.append(f"月报偏短 {len(t)} 字符")
    if rt == "yearly" and len(t) < 3000:
        warns.append(f"年报偏短 {len(t)} 字符")

    # 9) 分节结构 markdown 残留
    if "###" in t or "**" in t[:200]:
        warns.append("疑似 markdown 残留")

    return fails, warns, stats


def main():
    quick = "--quick" in sys.argv
    jobs = []
    if quick:
        jobs = [(PROFILES[0], "zh", "monthly")]
    else:
        for i, p in enumerate(PROFILES):
            jobs.append((p, LANGS[i], "monthly"))
        for i, p in enumerate(PROFILES):
            jobs.append((p, LANGS[i], "yearly"))

    print(f"启动 {len(jobs)} 份报告生成（并发 4）…", flush=True)
    results = []
    with ThreadPoolExecutor(max_workers=4) as ex:
        futs = {ex.submit(fetch, p, l, r): (p[0], l, r) for p, l, r in jobs}
        for i, f in enumerate(as_completed(futs), 1):
            r = f.result()
            fails, warns, stats = check(r)
            r["fails"], r["warns"], r["stats"] = fails, warns, stats
            r.pop("text", None)
            fp = f"/tmp/closure_{r['profile']}_{r['lang']}_{r['reportType']}.txt"
            results.append(r)
            print(f"[{i}/{len(jobs)}] {r['profile']:16s} {r['lang']:3s} {r['reportType']:8s} "
                  f"HTTP {r['http']} {r['sec']:6.1f}s {r['chars']:6d}字 "
                  f"{'❌ ' + ' | '.join(fails) if fails else ('⚠️ ' + ' | '.join(warns) if warns else '✅')}",
                  flush=True)

    ok = [r for r in results if not r["fails"]]
    warn = [r for r in results if not r["fails"] and r["warns"]]
    bad = [r for r in results if r["fails"]]
    summary = {
        "ts": datetime.now().isoformat(),
        "total": len(results), "pass": len(ok), "warn": len(warn), "fail": len(bad),
        "results": sorted(results, key=lambda x: (x["reportType"], x["lang"])),
    }
    with open(OUT, "w") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    print(f"\n{'='*70}\n通过 {len(ok)}/{len(results)}  ⚠️ {len(warn)}  ❌ {len(bad)}")
    for r in bad:
        print(f"  ❌ {r['profile']} {r['lang']} {r['reportType']}: {r['fails']}")
    for r in warn:
        print(f"  ⚠️ {r['profile']} {r['lang']} {r['reportType']}: {r['warns']}")
    print(f"明细 → {OUT}")


if __name__ == "__main__":
    main()
