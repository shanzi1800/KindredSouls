#!/usr/bin/env python3
# V424 泰语 natal 锁终验打靶：4 大极值 Case
# 算 SwissEph 真值 → 打靶生产 kindredsouls.online lang=th 的 natal 句
import subprocess, json, re, urllib.request, time, sys

CASES = [
    {"name":"1-Reykjavik","bd":"1999-12-31","bt":"23:59","lat":64.1466,"lon":-21.9426,"tz":"Atlantic/Reykjavik"},
    {"name":"2-Melbourne","bd":"2000-02-29","bt":"00:01","lat":-37.8136,"lon":144.9631,"tz":"Australia/Melbourne"},
    {"name":"3-Singapore","bd":"1995-06-21","bt":"12:00","lat":1.3521,"lon":103.8198,"tz":"Asia/Singapore"},
    {"name":"4-ChiangMai","bd":"1989-05-04","bt":"05:30","lat":18.7883,"lon":98.9853,"tz":"Asia/Bangkok"},
]

TH_SIGNS = ["เมษ","พฤษภ","มิถุน","กรกฎ","สิงห์","กันย์","ตุลย์","พิจิก","ธนู","มังกร","กุมภ์","มีน"]
EN2TH = {"Aries":"เมษ","Taurus":"พฤษภ","Gemini":"มิถุน","Cancer":"กรกฎ","Leo":"สิงห์","Virgo":"กันย์",
         "Libra":"ตุลย์","Scorpio":"พิจิก","Sagittarius":"ธนู","Capricorn":"มังกร","Aquarius":"กุมภ์","Pisces":"มีน"}
PLANETS = [
    ("Sun","ดวงอาทิตย์"),("Moon","ดวงจันทร์"),("Mercury","ดาวพุธ"),("Venus","ดาวศุกร์"),
    ("Mars","ดาวอังคาร"),("Jupiter","ดาวพฤหัสบดี"),("Saturn","ดาวเสาร์"),
    ("Uranus","ดาวยูเรนัส"),("Neptune","ดาวเนปจูน"),("Pluto","ดาวพลูโต"),
]
SIGN_RE = re.compile(r"ราศี(" + "|".join(TH_SIGNS) + r")")
HOUSE_RE = re.compile(r"(?:เรือนที่|บ้าน|ภพที่)\s*\(?(\d+)")

def get_truth(c):
    r = subprocess.run(["python3","astro/astro_matrix.py","--birth-date",c["bd"],"--birth-time",c["bt"],
                       "--lat",str(c["lat"]),"--lon",str(c["lon"]),"--tz",c["tz"],"--mode","natal"],
                      capture_output=True,text=True,cwd="/Users/apple/Desktop/KindredSouls开发工作日志/KindredSouls源代码")
    j = json.loads(r.stdout)
    ch = j.get("computed_houses",{})
    out = {}
    for en, th in PLANETS:
        info = ch.get(en)
        if info:
            out[th] = {"sign": EN2TH.get(info.get("sign"),"?"), "house": info.get("house")}
    return out

def call_prod(c):
    # 强制 MISS
    try:
        urllib.request.urlopen(f"https://kindredsouls.online/api/clear-cache/{c['bd']}/th/monthly", timeout=15)
    except: pass
    time.sleep(1)
    body = json.dumps({"birthDate":c["bd"],"birthTime":c["bt"],"birthCity":c["name"],
                       "lat":c["lat"],"lon":c["lon"],"tz":c["tz"],"lang":"th","reportType":"monthly"}).encode()
    req = urllib.request.Request("https://kindredsouls.online/api/wealth-oracle", data=body,
                                 headers={"Content-Type":"application/json"}, method="POST")
    for attempt in range(2):
        try:
            resp = urllib.request.urlopen(req, timeout=90)
            d = json.loads(resp.read().decode())
            return d.get("report") or d.get("reportContent") or ""
        except Exception as e:
            if attempt == 1: return f"__ERR__{e}"
            time.sleep(3)

def verify(c, truth, report):
    print(f"\n=== {c['name']} (SwissEph 真值 vs 生产 natal 句) ===")
    if report.startswith("__ERR__"):
        print("  ❌ 生产调用失败:", report); return 1
    problems = 0
    natal_count = 0
    for en, th in PLANETS:
        t = truth.get(th)
        if not t: continue
        idx = report.find(th)
        while idx >= 0:
            # 必须在行星名 20 字符内出现 กำเนิด/natal 才是本命句（防止 transit 句窗口荡进隔壁กำเนิด句造成假阳性）
            near = report[idx:idx+30]
            if "กำเนิด" in near or "natal" in near.lower():
                natal_count += 1
                # 提取本句星座/宫位：限制在当前从句（下一个句子终结符或 70 字符内）
                end = len(report)
                for sep in ['。', '\n', '🟢', '🔴', '🔵', '⚠️', '✦']:
                    p = report.find(sep, idx+1)
                    if p > idx and p < end: end = p
                w = report[idx:min(idx+70, end)]
                m_sign = SIGN_RE.search(w)
                m_house = HOUSE_RE.search(w)
                sign_ok = m_sign and m_sign.group(1) == t["sign"]
                house_ok = m_house and int(m_house.group(1)) == t["house"]
                if not (sign_ok and house_ok):
                    problems += 1
                    print(f"  ❌ {en}({th}): 期望 {t['sign']} H{t['house']} | 实测 {w[:70]}")
                else:
                    print(f"  ✅ {en}: {t['sign']} H{t['house']}")
                break
            idx = report.find(th, idx+1)
    if natal_count == 0:
        print("  ⚠️ 报告未含任何 natal 句（模型未写 กำเนิด），无法验证锁")
    return problems

all_problems = 0
for c in CASES:
    truth = get_truth(c)
    report = call_prod(c)
    all_problems += verify(c, truth, report)

print(f"\n{'='*50}")
print(f"终验打靶汇总: {'全部正确 ✅' if all_problems==0 else f'❌ {all_problems} 处问题'}")
sys.exit(1 if all_problems else 0)
