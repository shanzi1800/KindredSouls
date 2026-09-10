#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
V420 终验：SwissEph 天文真值 vs 生产 vi 月报实产 逐项比对
用法: python3 verify_v420_truth.py [birthdate ...]
判据（全绿才算过）:
  1. 本命月亮星座 == SwissEph 真值
  2. 本命月亮宫位 == SwissEph 真值（且全文只有一个宫位，无自相矛盾）
  3. 本命太阳星座 == 真值
  4. U+FFFD = 0、削首拆词 = 0
  5. 外币残留 = 0、含 ₫500,000、无同值括号冗余
"""
import json, re, subprocess, sys, time, urllib.request

REPO = '/Users/apple/Desktop/KindredSouls开发工作日志/KindredSouls源代码'
ENDPOINT = 'https://kindredsouls.online/api/wealth-oracle/stream'
VI_SIGN = {'Aries':'Bạch Dương','Taurus':'Kim Ngưu','Gemini':'Song Tử','Cancer':'Cự Giải','Leo':'Sư Tử',
           'Virgo':'Xử Nữ','Libra':'Thiên Bình','Scorpio':'Bọ Cạp','Sagittarius':'Nhân Mã',
           'Capricorn':'Ma Kết','Aquarius':'Bảo Bình','Pisces':'Song Ngư'}

def truth(bd, bt, lat, lon, tz):
    last = ''
    for _ in range(3):
        r = subprocess.run(['python3','astro/astro_matrix.py','--birth-date',bd,'--birth-time',bt,
                            '--lat',str(lat),'--lon',str(lon),'--tz',tz,'--mode','natal'],
                           capture_output=True, text=True, cwd=REPO)
        last = (r.stdout or '').strip()
        if last.startswith('{'):
            break
        time.sleep(2)
    else:
        print('  ⚠️ astro_matrix 真值计算失败:', (last or '')[:120], '| stderr:', r.stderr[:200])
    d = json.loads(last)
    h = d['computed_houses']
    return {'sun': d['sun_sign'], 'sunHouse': h['Sun']['house'],
            'moon': d['natal_moon']['sign'] if 'natal_moon' in d else h['Moon']['sign'],
            'moonHouse': d['natal_moon']['house'] if 'natal_moon' in d else h['Moon']['house'],
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
    return san or ''.join(parts), ''.join(parts)

CASES = [
    ('1990-08-05','07:00',10.8231,106.6297,'Asia/Ho_Chi_Minh'),   # 本命太阳狮子(与主公贴的报告同型)
    ('1989-11-12','12:00',13.75,100.5,'Asia/Bangkok'),
    ('1992-03-17','09:30',39.9042,116.4074,'Asia/Shanghai'),
]
if len(sys.argv) > 1:
    CASES = [(a,'12:00',13.75,100.5,'Asia/Bangkok') for a in sys.argv[1:]]

fail_total = 0
for bd, bt, lat, lon, tz in CASES:
    t = truth(bd, bt, lat, lon, tz)
    san, stream = gen(bd, bt, lat, lon, tz)
    txt = san or stream
    vi_moon = VI_SIGN.get(t['moon'], t['moon'])
    vi_sun  = VI_SIGN.get(t['sun'], t['sun'])
    houses  = sorted(set(re.findall(r'Mặt Trăng natal[^.]{0,70}?Nhà (\d+)', txt)))
    checks = {
        f"本命月亮星座={vi_moon}":      vi_moon in txt,
        f"本命月亮宫位=第{t['moonHouse']}宫":  houses == [str(t['moonHouse'])],
        f"本命太阳={vi_sun}":           vi_sun in txt,
        "U+FFFD=0":                     txt.count('\ufffd') == 0,
        "无削首拆词":                    not any(w in txt for w in ['làúc','bạnè','khiý','thểăng','trongương','ậ n','ệ nh']),
        "外币残留=0":                    not re.search(r'\d[\d.,]*\s*(?:USD|đô(?:\s*la)?|Mỹ kim)|(?:\$|US\$)\s?\d[\d.,]*', txt),
        "含₫500,000":                    '500.000' in txt,
        "无同值括号冗余":                not re.search(r'([\d][\d.,]*)\s*₫\s*\(\s*(?:khoảng|tầm|chừng|≈|~)?\s*\1\s*₫?\s*\)', txt),
    }
    bad = [k for k, v in checks.items() if not v]
    fail_total += len(bad)
    print(f"\n===== {bd} {bt} ({tz}) len={len(txt)} =====")
    print(f"  SwissEph真值: 太阳={t['sun']}(H{t['sunHouse']}) 月亮={t['moon']}(H{t['moonHouse']}) 上升={t['rising']}")
    for k, v in checks.items():
        print(f"  {'✅' if v else '❌'} {k}")
    if not checks[f"本命月亮宫位=第{t['moonHouse']}宫"]:
        print(f"     ⚠️ 报告里出现的本命月亮宫位: {houses}")
    if bad: print(f"  >>> 未过: {bad}")

print(f"\n{'='*52}\n总计: {len(CASES)} 组 | 未过项 {fail_total} 个 | {'全绿 ✅' if fail_total==0 else '需整改 ❌'}")
