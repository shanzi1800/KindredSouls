#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
C+ 重分类脚本 v2（坐标最近邻→真国家→修正语种区）· 2026-07-19
只用坐标反查国家，不靠 tz 跨多国误判。
  - 用 GeoNames cities5000 建 KDTree，每城取最近邻真实 countryCode。
  - countryCode -> 语种区（中/西/泰/法/越/英）。
  - old_zone：原 tz 字符串规则（旧逻辑，含误分类）。
  - 若 old==new：不动（保留原译名）。
  - 若 old!=new 且 new 是译语种：清旧区残留名 + 标记补译。
  - 若 old!=new 且 new=en：清旧区残留名（回退基准名，不补译）。
  - 若反查到的标准 tz 与原 tz 不同（如 Hanoi Bangkok->Ho_Chi_Minh），校正 cities.json 的 tz（更准的源数据）。
产出：
  1. 写回 cities.json（tz 校正 + 清残留名）
  2. 写 /tmp/cplus_reclass_plan.json（需补译 key 按新语种分组）
"""
import json, io, os, sys
import numpy as np
from scipy.spatial import cKDTree

CITIES_JSON = '/Users/apple/Desktop/KindredSouls源代码/web/public/data/cities.json'
GN = '/tmp/geonames/cities5000.txt'
PLAN_OUT = '/tmp/cplus_reclass_plan.json'
TRANS_LANGS = {'zh', 'es', 'th', 'fr', 'vi'}

COUNTRY_ZONE = {
    'CN':'zh','HK':'zh','TW':'zh','MO':'zh',
    'ES':'es','MX':'es','AR':'es','CL':'es','CO':'es','PE':'es','VE':'es','EC':'es',
    'BO':'es','UY':'es','PY':'es','CR':'es','PA':'es','NI':'es','SV':'es','GT':'es',
    'HN':'es','DO':'es','CU':'es','PR':'es','GQ':'es','EH':'es',
    'TH':'th','VN':'vi',
    'FR':'fr','BE':'fr','CH':'fr','LU':'fr','MC':'fr','NC':'fr','PF':'fr','WF':'fr',
    'TF':'fr','YT':'fr','RE':'fr','MQ':'fr','GP':'fr','GF':'fr','BI':'fr','CF':'fr',
    'TD':'fr','CM':'fr','GA':'fr','GN':'fr','ML':'fr','NE':'fr','SN':'fr','CI':'fr',
    'BF':'fr','TG':'fr','BJ':'fr','MU':'fr','KM':'fr','DJ':'fr','MG':'fr','CD':'fr',
    'CG':'fr','VU':'fr',
}

def old_zone(c):
    tz = c.get('tz', '')
    if tz in ('Asia/Shanghai','Asia/Hong_Kong','Asia/Taipei','Asia/Macau','Asia/Urumqi','Asia/Chongqing','Asia/Harbin'):
        return 'zh'
    if tz.startswith('Asia/Bangkok'):
        return 'th'
    if tz.startswith('Asia/Ho_Chi_Minh'):
        return 'vi'
    if tz.startswith('America/') or tz in ('Europe/Madrid','Africa/Malabo','Atlantic/Canary'):
        return 'es'
    if tz.startswith('Africa/') or tz in ('Europe/Paris','Pacific/Noumea','Indian/Reunion','America/Martinique','America/Guadeloupe'):
        return 'fr'
    return 'en'

# 标准 tz 映射（用于校正源 tz 错，可选；仅当反查国家明确时）
def canon_tz_for(cc):
    return {
        'CN':'Asia/Shanghai','HK':'Asia/Hong_Kong','TW':'Asia/Taipei','MO':'Asia/Macau',
        'ES':'Europe/Madrid','MX':'America/Mexico_City','AR':'America/Argentina/Buenos_Aires',
        'CL':'America/Santiago','CO':'America/Bogota','PE':'America/Lima','VE':'America/Caracas',
        'TH':'Asia/Bangkok','VN':'Asia/Ho_Chi_Minh','FR':'Europe/Paris','BE':'Europe/Brussels',
        'CH':'Europe/Zurich','VN':'Asia/Ho_Chi_Minh',
    }.get(cc)

def load_gn():
    lat=[]; lon=[]; cc=[]
    with io.open(GN, encoding='utf-8') as f:
        for line in f:
            p=line.rstrip('\n').split('\t')
            if len(p)<9: continue
            try:
                la=float(p[4]); lo=float(p[5]); c=p[8]
            except: continue
            if c and len(c)==2:
                lat.append(la); lon.append(lo); cc.append(c)
    arr=np.array(list(zip(lat,lon)))
    tree=cKDTree(arr)
    return tree, cc

def main():
    mode = sys.argv[1] if len(sys.argv)>1 else 'run'
    tree, gn_cc = load_gn()
    cities = json.load(io.open(CITIES_JSON, encoding='utf-8'))
    idx = cities['fuse_index']
    q = np.array([[c.get('lat',0), c.get('lon',0)] for c in idx])
    _, ii = tree.query(q, k=1)
    cc_of = [gn_cc[i] for i in ii]

    if mode == 'dry':
        changed=0; tz_fixed=0; by_new={}; samples=[]
        for c, cc in zip(idx, cc_of):
            nz = COUNTRY_ZONE.get(cc, 'en')
            oz = old_zone(c)
            canon = canon_tz_for(cc)
            if canon and c.get('tz')!=canon:
                tz_fixed+=1
            if oz!=nz:
                changed+=1; by_new[nz]=by_new.get(nz,0)+1
                if len(samples)<30:
                    samples.append((c['key'],c.get('tz'),oz,nz,cc))
        print(f"总城市: {len(idx)}")
        print(f"重分类(oz!=nz): {changed} | tz校正: {tz_fixed}")
        print(f"按新语种: {by_new}")
        print("样例:")
        for s in samples:
            print(f"  {s[0]:22} src_tz={s[1]:18} old={s[2]} new={s[3]} cc={s[4]}")
        return

    plan={l:[] for l in TRANS_LANGS}
    changed=0; tz_fixed=0
    for c, cc in zip(idx, cc_of):
        nz=COUNTRY_ZONE.get(cc,'en')
        oz=old_zone(c)
        canon=canon_tz_for(cc)
        if canon and c.get('tz')!=canon:
            c['tz']=canon; tz_fixed+=1
        if oz==nz: continue
        changed+=1
        for L in TRANS_LANGS:
            if L!=nz and L in c.get('names',{}):
                del c['names'][L]
        if nz in TRANS_LANGS:
            plan[nz].append(c['key'])
    json.dump(cities, io.open(CITIES_JSON,'w',encoding='utf-8'), ensure_ascii=False, indent=2)
    json.dump(plan, open(PLAN_OUT,'w'), ensure_ascii=False, indent=2)
    print(f"✅ 写回 cities.json（tz校正 {tz_fixed}，重分类 {changed}）")
    print("需补译: "+", ".join(f"{k}={len(v)}" for k,v in plan.items() if v))
    print(f"计划已写 {PLAN_OUT}")

if __name__=='__main__':
    main()
