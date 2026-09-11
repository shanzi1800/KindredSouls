#!/usr/bin/env python3
# V426 法语 transit 锁生产终验：算报告月 transit 真值 → 打靶生产 lang=fr 的 "en [星座] [Maison N | 序数词 maison]" 句
# 兼容：① 数字宫位 "Maison 7" ② 法语序数词 "septième maison" ③ LLM 偶发英文混用 (Scorpio/Lion)
import subprocess, json, re, urllib.request, sys

# 朗伊尔城极地 Case（军师指定，测试极地分宫降级 + 法语锁）
BD = "2012-12-21"
BT = "12:00"
LAT, LON, TZ = 78.22, 15.65, "Arctic/Longyearbyen"
HOST = "https://kindredsouls.online"

# 法语星座名 ↔ 英文真值 双向映射（与 server.js _FR_SIGN_FR / labels.fr 完全一致）
FR2EN = {
    'Bélier': 'Aries', 'Taureau': 'Taurus', 'Gémeaux': 'Gemini', 'Cancer': 'Cancer',
    'Lion': 'Leo', 'Vierge': 'Virgo', 'Balance': 'Libra', 'Scorpion': 'Scorpio',
    'Sagittaire': 'Sagittarius', 'Capricorne': 'Capricorn', 'Verseau': 'Aquarius', 'Poissons': 'Pisces',
}
# 法语序数词 → 数字（报告宫位用 "septième maison" 等序数词）
ORDINAL_FR = {
    'première': 1, 'premier': 1, 'deuxième': 2, 'troisième': 3, 'quatrième': 4,
    'cinquième': 5, 'sixième': 6, 'septième': 7, 'huitième': 8, 'neuvième': 9,
    'dixième': 10, 'onzième': 11, 'douzième': 12,
}
SIGN_EN = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio',
           'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']
PLANETS = [("Sun", "Soleil"), ("Moon", "Lune"), ("Mercury", "Mercure"), ("Venus", "Vénus"),
           ("Mars", "Mars"), ("Jupiter", "Jupiter"), ("Saturn", "Saturne"),
           ("Uranus", "Uranus"), ("Neptune", "Neptune"), ("Pluto", "Pluton")]


def run(cmd):
    return subprocess.run(cmd, shell=True, capture_output=True, text=True).stdout


def extract_house(seg):
    """从片段提取宫位：优先数字 Maison N，否则法语序数词 (septième maison)"""
    mnum = re.search(r'Maison\s*(\d+)', seg, re.I)
    if mnum:
        return int(mnum.group(1))
    mord = re.search(r'\b(première|premier|deuxième|troisième|quatrième|cinquième|sixième|'
                     r'septième|huitième|neuvième|dixième|onzième|douzième)\s+maison', seg, re.I)
    if mord:
        return ORDINAL_FR[mord.group(1).lower()]
    return None


# 算报告月 transit 真值（months[0]）
m = json.loads(run(
    f"python3 astro/astro_matrix.py 2026 9 Virgo --birth-date {BD} --birth-time {BT} --lat {LAT} --lon {LON} --tz {TZ} --months 12"))
if not m.get("months"):
    print("❌ 本地 astro_matrix 算不出 months（极地限制），改用普通法语用户真值")
    sys.exit(2)
first = m["months"][0]
TRUTH = {}
for en, fr in PLANETS:
    k = en.lower()
    p = first.get(k) or (first.get("positions", {}) or {}).get(en) or {}
    if p.get("sign"):
        TRUTH[fr] = (p["sign"], int(p.get("house", 0)))  # 英文 sign + house

print("报告月 transit 真值(归一英文):", {k: f"{v[0]} H{v[1]}" for k, v in TRUTH.items()})

# 调用生产 API
body = json.dumps({"birthDate": BD, "birthTime": BT, "birthCity": "Longyearbyen",
                   "lat": LAT, "lon": LON, "tz": TZ, "lang": "fr", "reportType": "monthly"}).encode()
try:
    req = urllib.request.Request(f"{HOST}/api/wealth-oracle", data=body,
                                headers={"Content-Type": "application/json"}, method="POST")
    data = json.loads(urllib.request.urlopen(req, timeout=120).read().decode())
    report = data.get("report") or data.get("reportContent") or ""
except Exception as e:
    print("生产调用失败:", e)
    sys.exit(1)

if not report:
    print("❌ 生产返回空报告")
    sys.exit(1)

problems = 0
checked = 0
for en, fr in PLANETS:
    t = TRUTH.get(fr)
    if not t:
        continue
    # 找 transit 句：行星名 + en + 星座（排除本命 natal/natale 句）
    found = False
    for mm in re.finditer(re.escape(fr) + r"\s+en\s+([A-Za-zÀ-ÿÉè]+)", report):
        seg = report[mm.start():mm.start() + 150]
        pre = seg[len(fr):seg.find(mm.group(1))].lower()
        if 'natal' in pre or 'natale' in pre:
            continue
        raw_sign = mm.group(1)
        got_house = extract_house(seg)
        got_sign_en = FR2EN.get(raw_sign) or (raw_sign if raw_sign in SIGN_EN else None)
        ok_sign = got_sign_en == t[0]
        ok_house = got_house == t[1]
        checked += 1
        found = True
        if not (ok_sign and ok_house):
            problems += 1
            print(f"  ❌ {en}({fr}): 期望 {t[0]} H{t[1]} | 实测 {raw_sign} H{got_house} | 片段: {seg.strip()[:60]}")
        else:
            print(f"  ✅ {en}: {raw_sign} H{got_house}")
        break
    if not found:
        # 退化：找含 Maison/序数词 的任意句
        for s in re.split(r'[.。!]', report):
            if fr in s and 'en ' in s and ('maison' in s.lower()) and 'natal' not in s.lower():
                m2 = re.search(re.escape(fr) + r".*?en\s+([A-Za-zÀ-ÿÉè]+).*?"
                              r"(?:Maison\s*(\d+)|(première|premier|deuxième|troisième|quatrième|"
                              r"cinquième|sixième|septième|huitième|neuvième|dixième|onzième|douzième)\s+maison)",
                              s, re.S | re.I)
                if m2:
                    raw_sign = m2.group(1)
                    got_house = int(m2.group(2)) if m2.group(2) else ORDINAL_FR.get(m2.group(3).lower())
                    got_sign_en = FR2EN.get(raw_sign) or (raw_sign if raw_sign in SIGN_EN else None)
                    checked += 1
                    found = True
                    if not (got_sign_en == t[0] and got_house == t[1]):
                        problems += 1
                        print(f"  ❌ {en}({fr}): 期望 {t[0]} H{t[1]} | 实测 {raw_sign} H{got_house}")
                    else:
                        print(f"  ✅ {en}: {raw_sign} H{got_house}")
                    break
        if not found:
            print(f"  ⚠️ {en}: 报告无 {fr} 的 transit 句，跳过")

print(f"\n=== fr transit 句校验: 检查 {checked} 句, 问题 {problems} ===")
sys.exit(1 if problems else 0)
