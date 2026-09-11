#!/usr/bin/env python3
# V424-B2 泰语 transit 锁生产终验：算报告月 transit 真值 → 打靶生产 lang=th 的 ทรานซิส 句
# 用锁定字典 SUN_SIGN_TH 做归一化（กันยา=Virgo 等），只匹配「行星名+ทรานซิส」起的从句
import subprocess, json, re, urllib.request, sys

BD = "1989-10-12"
BT = "07:00"
LAT, LON, TZ = 13.7563, 100.5018, "Asia/Bangkok"
HOST = "https://kindredsouls.online"

# 锁定字典（与 server.js SUN_SIGN_TH 完全一致）：index 对应英文星座序
SUN_SIGN_TH = ['เมษ','พฤษภ','มิถุน','กรกฎ','สิงห์','กันยา','ตุลย์','พิจิก','ธนู','มังกร','กุมภ์','มีน']
EN2IDX = {"Aries":0,"Taurus":1,"Gemini":2,"Cancer":3,"Leo":4,"Virgo":5,"Libra":6,"Scorpio":7,"Sagittarius":8,"Capricorn":9,"Aquarius":10,"Pisces":11}
PLANETS = [("Sun","ดวงอาทิตย์"),("Moon","ดวงจันทร์"),("Mercury","ดาวพุธ"),("Venus","ดาวศุกร์"),
           ("Mars","ดาวอังคาร"),("Jupiter","ดาวพฤหัสบดี"),("Saturn","ดาวเสาร์"),
           ("Uranus","ดาวยูเรนัส"),("Neptune","ดาวเนปจูน"),("Pluto","ดาวพลูโต")]

def run(cmd):
    return subprocess.run(cmd, shell=True, capture_output=True, text=True).stdout

m = json.loads(run(f"python3 astro/astro_matrix.py 2026 9 Libra --birth-date {BD} --birth-time {BT} --lat {LAT} --lon {LON} --tz {TZ} --months 12"))
first = m["months"][0]
TRUTH = {}
for en, th in PLANETS:
    k = en.lower()
    p = first.get(k) or (first.get("positions",{}) or {}).get(en) or {}
    if p.get("sign"):
        idx = EN2IDX.get(p["sign"])
        TRUTH[th] = (SUN_SIGN_TH[idx], int(p.get("house",0))) if idx is not None else None

print("报告月 transit 真值(锁定字典归一):", {k: f"{v[0]} H{v[1]}" for k,v in TRUTH.items()})

body = json.dumps({"birthDate":BD,"birthTime":BT,"birthCity":"Bangkok",
                  "lat":LAT,"lon":LON,"tz":TZ,"lang":"th","reportType":"monthly"}).encode()
try:
    req = urllib.request.Request(f"{HOST}/api/wealth-oracle", data=body, headers={"Content-Type":"application/json"}, method="POST")
    data = json.loads(urllib.request.urlopen(req, timeout=120).read().decode())
    report = data.get("report") or data.get("reportContent") or ""
except Exception as e:
    print("生产调用失败:", e); sys.exit(1)

problems = 0; checked = 0
for en, th in PLANETS:
    t = TRUTH.get(th)
    if not t: continue
    # 只匹配「行星名 + ทรานซิส」起的从句，截到句末标点
    m2 = re.search(re.escape(th) + r"ทรานซิส" + r"([^.。!]*?)(?=[.。!]|ดวง|$)", report)
    if not m2:
        # 退化：找含 ทรานซิส 的整句
        for s in re.split(r'[.。!]', report):
            if th in s and "ทรานซิส" in s:
                m2 = re.search(re.escape(th) + r"ทรานซิส" + r"(.*)", s, re.S)
                if m2: break
    if not m2:
        print(f"  ⚠️ {en}: 报告无 {th} 的 transit 句，跳过"); continue
    clause = m2.group(1)
    sm = re.search(r"ราศี([\u0E00-\u0E7F]+)", clause)
    hm = re.search(r"บ้าน\s*(\d+)|ภพที่\s*(\d+)|เรือนที่\s*(\d+)", clause)
    got_sign = sm.group(1) if sm else "?"
    got_house = int(hm.group(1) or hm.group(2) or hm.group(3)) if hm else None
    ok_sign = got_sign == t[0]
    ok_house = got_house == t[1]
    checked += 1
    if not (ok_sign and ok_house):
        problems += 1
        print(f"  ❌ {en}({th}): 期望 {t[0]} H{t[1]} | 实测 {got_sign} H{got_house} | 从句: {clause.strip()[:50]}")
    else:
        print(f"  ✅ {en}: {got_sign} H{got_house}")

print(f"\n=== transit 句校验: 检查 {checked} 句, 问题 {problems} ===")
sys.exit(1 if problems else 0)
