#!/usr/bin/env python3
# V424-B2 越南语 transit 锁生产终验：算报告月 transit 真值 → 打靶生产 lang=vi 的 tại 句
# 用锁定字典 SUN_SIGN_VI 做归一化（Sư Tử=Leo 等），只匹配「行星名+ tại」起的 transit 从句
# 与 server.js lockTransitTruthVi 完全一致：含 tại、不含 natal/bản mệnh → 视为 transit 句
import subprocess, json, re, urllib.request, sys

BD = "1989-10-12"
BT = "07:00"
LAT, LON, TZ = 13.7563, 100.5018, "Asia/Bangkok"
HOST = "https://kindredsouls.online"

# 锁定字典（与 server.js SUN_SIGN_VI 完全一致）：index 对应英文星座序
SUN_SIGN_VI = ['Bạch Dương','Kim Ngưu','Song Tử','Cự Giải','Sư Tử','Xử Nữ','Thiên Bình','Bọ Cạp','Nhân Mã','Ma Kết','Bảo Bình','Song Ngư']
EN2IDX = {"Aries":0,"Taurus":1,"Gemini":2,"Cancer":3,"Leo":4,"Virgo":5,"Libra":6,"Scorpio":7,"Sagittarius":8,"Capricorn":9,"Aquarius":10,"Pisces":11}
PLANETS = [("Sun","Mặt Trời"),("Moon","Mặt Trăng"),("Mercury","Sao Thủy"),("Venus","Sao Kim"),
           ("Mars","Sao Hỏa"),("Jupiter","Sao Mộc"),("Saturn","Sao Thổ"),
           ("Uranus","Sao Thiên Vương"),("Neptune","Sao Hải Vương"),("Pluto","Sao Diêm Vương")]

def run(cmd):
    return subprocess.run(cmd, shell=True, capture_output=True, text=True).stdout

m = json.loads(run(f"python3 astro/astro_matrix.py 2026 9 Libra --birth-date {BD} --birth-time {BT} --lat {LAT} --lon {LON} --tz {TZ} --months 12"))
first = m["months"][0]
TRUTH = {}
for en, vi in PLANETS:
    k = en.lower()
    p = first.get(k) or (first.get("positions",{}) or {}).get(en) or {}
    if p.get("sign"):
        idx = EN2IDX.get(p["sign"])
        TRUTH[vi] = (SUN_SIGN_VI[idx], int(p.get("house",0))) if idx is not None else None

print("报告月 transit 真值(锁定字典归一):", {k: f"{v[0]} H{v[1]}" for k,v in TRUTH.items()})

body = json.dumps({"birthDate":BD,"birthTime":BT,"birthCity":"Bangkok",
                  "lat":LAT,"lon":LON,"tz":TZ,"lang":"vi","reportType":"monthly"}).encode()
try:
    req = urllib.request.Request(f"{HOST}/api/wealth-oracle", data=body, headers={"Content-Type":"application/json"}, method="POST")
    data = json.loads(urllib.request.urlopen(req, timeout=120).read().decode())
    report = data.get("report") or data.get("reportContent") or ""
except Exception as e:
    print("生产调用失败:", e); sys.exit(1)

problems = 0; checked = 0
for en, vi in PLANETS:
    t = TRUTH.get(vi)
    if not t: continue
    idx = 0
    matched = False
    while True:
        i = report.find(vi, idx)
        if i < 0: break
        idx = i + len(vi)
        clause = report[i:i+120]
        # 切到下一个行星名或句末标点，避免跨句
        cut = len(clause)
        for other in [p[1] for p in PLANETS if p[1] != vi]:
            j = clause.find(other)
            if j > 0 and j < cut: cut = j
        clause = clause[:cut]
        # 只接受 transit 句：含 tại、不含 natal/bản mệnh（与硬锁判定一致）
        if 'tại' not in clause: continue
        if re.search(r'\bnatal\b|bản mệnh', clause, re.I): continue
        sm = next((s for s in SUN_SIGN_VI if s in clause), None)
        hm = re.search(r'Nhà\s*(\d+)', clause)
        got_sign = sm
        got_house = int(hm.group(1)) if hm else None
        checked += 1
        ok_sign = got_sign == t[0]
        ok_house = got_house == t[1]
        if not (ok_sign and ok_house):
            problems += 1
            print(f"  ❌ {en}({vi}): 期望 {t[0]} H{t[1]} | 实测 {got_sign} H{got_house} | 从句: {clause.strip()[:50]}")
        else:
            print(f"  ✅ {en}: {got_sign} H{got_house}")
        matched = True
        break
    if not matched:
        print(f"  ⚠️ {en}: 报告无 {vi} 的 transit 句(tại)，跳过")

print(f"\n=== vi transit 句校验: 检查 {checked} 句, 问题 {problems} ===")
sys.exit(1 if problems else 0)
