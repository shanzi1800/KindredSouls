#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
V421 终验 v2：SwissEph 天文真值 vs 生产 vi 月报实产（含稳定性矩阵）
判据（硬门 / 软项）:
  硬门 1. 本命月亮星座必须出现且 == 真值
  硬门 2. 凡出现的「本命月亮宫位」必须 == 真值（出现 2 个不同宫位 = 自相矛盾 = 挂）
  硬门 3. 本命太阳星座若出现必须 == 真值；宫位若出现必须 == 真值
  硬门 4. U+FFFD = 0、削首拆词 = 0、外币残留 = 0、含 ₫500,000、无同值括号冗余
  软项 5. 是否显式给出本命月亮宫位（Prompt 依从性，非造假）
用法: python3 verify_v421_truth.py [repeat]
"""
import json, re, subprocess, sys, time, urllib.request

REPO = '/Users/apple/Desktop/KindredSouls开发工作日志/KindredSouls源代码'
ENDPOINT = 'https://kindredsouls.online/api/wealth-oracle/stream'
VI = {'Aries':'Bạch Dương','Taurus':'Kim Ngưu','Gemini':'Song Tử','Cancer':'Cự Giải','Leo':'Sư Tử',
      'Virgo':'Xử Nữ','Libra':'Thiên Bình','Scorpio':'Bọ Cạp','Sagittarius':'Nhân Mã',
      'Capricorn':'Ma Kết','Aquarius':'Bảo Bình','Pisces':'Song Ngư'}
VI_ALL = list(VI.values())
BODIES = r'(?:Mặt|Sao|Hành|Trái Đất|Thiên Vương|Hải Vương|Diêm Vương|Kim Tinh|Hỏa Tinh|Thủy Tinh|Mộc Tinh|Thổ Tinh)'

def natal(bd, bt, lat, lon, tz):
    last = ''
    for _ in range(3):
        r = subprocess.run(['python3','astro/astro_matrix.py','--birth-date',bd,'--birth-time',bt,
                            '--lat',str(lat),'--lon',str(lon),'--tz',tz,'--mode','natal'],
                           capture_output=True, text=True, cwd=REPO)
        last = (r.stdout or '').strip()
        if last.startswith('{'): break
        time.sleep(2)
    d = json.loads(last)
    h = d['computed_houses']
    return {'sun': d['sun_sign'], 'sunH': h['Sun']['house'],
            'moon': d.get('natal_moon', {}).get('sign', h['Moon']['sign']),
            'moonH': d.get('natal_moon', {}).get('house', h['Moon']['house']),
            'rising': d['rising_sign']}

def gen(bd, bt, lat, lon, tz):
    body = json.dumps({"birthDate":bd,"birthTime":bt,"lat":lat,"lon":lon,"tz":tz,
                       "lang":"vi","reportType":"monthly"}).encode()
    req = urllib.request.Request(ENDPOINT, data=body, headers={'Content-Type':'application/json'})
    raw = urllib.request.urlopen(req, timeout=300).read().decode('utf-8','ignore')
    parts, san = [], None
    for line in raw.split('\n'):
        if not line.startswith('data: '): continue
        d = line[6:].strip()
        if not d or d == '[DONE]': continue
        try: j = json.loads(d)
        except Exception: continue
        if 'text' in j: parts.append(j['text'])
        if 'sanitized' in j: san = j['sanitized']
    return san or ''.join(parts)

def clause(txt, anchor):
    """取 anchor 后的首个从句（遇另一星体/句号即截断），收集其中的星座名与宫位"""
    out = []
    for m in re.finditer(re.escape(anchor), txt):
        w = txt[m.end(): m.end()+90]
        cut = re.search(r'[.\n]|\s' + BODIES + r'\s', w)
        if cut: w = w[:cut.start()]
        signs = [s for s in VI_ALL if s in w]
        houses = [int(x) for x in re.findall(r'Nhà\s*(\d+)', w)]
        out.append((signs, houses))
    return out

CASES = [
    ('1990-08-05','07:00',10.8231,106.6297,'Asia/Ho_Chi_Minh'),
    ('1992-03-17','09:30',39.9042,116.4074,'Asia/Shanghai'),
]
REPEAT = int(sys.argv[1]) if len(sys.argv) > 1 else 1

hard_fail = 0
soft_notes = 0
for rep in range(REPEAT):
    for bd, bt, lat, lon, tz in CASES:
        t = natal(bd, bt, lat, lon, tz)
        txt = gen(bd, bt, lat, lon, tz)
        moonVi, sunVi = VI[t['moon']], VI[t['sun']]
        mw = clause(txt, 'Mặt Trăng natal')
        sw = clause(txt, 'Mặt Trời natal')
        m_signs = [s for ws in mw for s in ws[0]]
        m_houses = sorted(set(h for ws in mw for h in ws[1]))
        s_signs = [s for ws in sw for s in ws[0]]
        s_houses = sorted(set(h for ws in sw for h in ws[1]))
        checks = {
            f"本命月亮星座出现且={moonVi}": (moonVi in m_signs),
            f"本命月亮宫位一致=第{t['moonH']}宫": (m_houses == [t['moonH']] if m_houses else True),
            f"本命月亮无矛盾宫位": (len(m_houses) <= 1),
            f"本命太阳星座={sunVi}": (sunVi in s_signs) if s_signs else True,
            f"本命太阳宫位一致=第{t['sunH']}宫": (s_houses == [t['sunH']] if s_houses else True),
            "U+FFFD=0": txt.count('\ufffd') == 0,
            "无削首拆词": not any(w in txt for w in ['làúc','bạnè','khiý','thểăng','trongương','ậ n','ệ nh']),
            "外币残留=0": not re.search(r'\d[\d.,]*\s*(?:USD|đô(?:\s*la)?|Mỹ kim)|(?:\$|US\$)\s?\d[\d.,]*', txt),
            "含₫500,000": '500.000' in txt,
            "无同值括号冗余": not re.search(r'([\d][\d.,]*)\s*₫\s*\(\s*(?:khoảng|tầm|chừng|≈|~)?\s*\1\s*₫?\s*\)', txt),
        }
        bad = [k for k, v in checks.items() if not v]
        if m_houses: soft_notes += 0
        else: soft_notes += 1
        hard_fail += len(bad)
        print(f"\n=== [rep{rep+1}] {bd} {bt} len={len(txt)} ===")
        print(f"    真值: 月亮={t['moon']}(H{t['moonH']}) 太阳={t['sun']}(H{t['sunH']}) | 报告: 月亮座={sorted(set(m_signs))} 月亮宫={m_houses} | 太阳座={sorted(set(s_signs))} 太阳宫={s_houses}")
        for k, v in checks.items():
            if not v: print(f"    ❌ {k}")
        print("    " + ("全绿 ✅" if not bad else f">>> 未过 {len(bad)} 项"))
        if not m_houses: print("    ⓘ 软项: 本报告未显式写本命月亮宫位（Prompt 依从性，非造假）")

print(f"\n{'='*56}\n{REPEAT*len(CASES)} 次生成 | 硬门未过 {hard_fail} 项 | 未写宫位软项 {soft_notes} 次 | {'全绿 ✅' if hard_fail==0 else '需整改 ❌'}")
