#!/usr/bin/env python3
"""
月报验收测试：直接查 Supabase 缓存验证终稿质量
因为 sanitized 事件不发时测试无法读到终稿，直接查数据库最准
"""
import subprocess, json, sys

def supabase_query(birth):
    """查 Supabase ai_insights_cache 表"""
    SB_URL = 'https://wfkxqhlcgrikxoofjvas.supabase.co/rest/v1'
    SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indma3hxaGxjZ3Jpa3hvb2ZqdmFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTY1NTgyMSwiZXhwIjoyMDk1MjMxODIxfQ.IV6CxfemnwbqXWSkwixaN606PV6-NLWb7nJtYvVGeEw'
    import urllib.request, urllib.parse
    url = SB_URL + '/ai_insights_cache?cache_key=eq.wealth%3Av131e%3A' + birth + '%3Azh%3Amonthly&select=insight'
    req = urllib.request.Request(url, headers={
        'Authorization': 'Bearer ' + SB_KEY,
        'apikey': SB_KEY,
        'Content-Type': 'application/json'
    })
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read())
            if data and data[0]:
                return data[0].get('insight', '')
    except Exception as e:
        print(f'    ⚠️ 查询失败: {e}', file=sys.stderr)
    return ''

def check_report(birth):
    """检查单个生日的月报缓存"""
    # 先清缓存（强制新生效）
    import urllib.request
    clear_url = 'https://kindredsouls-production.up.railway.app/api/clear-cache/' + birth + '/zh/monthly'
    try:
        urllib.request.urlopen(clear_url, timeout=5)
    except: pass
    
    # 触发新生效（POST一次）
    import urllib.parse
    payload = json.dumps({'birthDate': birth, 'lang': 'zh', 'reportType': 'monthly'}).encode()
    req = urllib.request.Request(
        'https://kindredsouls-production.up.railway.app/api/wealth-oracle/stream?free_access=1',
        data=payload, headers={'Content-Type': 'application/json', 'Accept-Encoding': 'identity'}
    )
    try:
        urllib.request.urlopen(req, timeout=5)
    except: pass
    
    # 等3秒让缓存写入
    import time; time.sleep(3)
    
    # 查 Supabase 缓存
    text = supabase_query(birth)
    if not text:
        return None, f'{birth}: 无缓存（生成中）'
    
    terms = ['三分相','四分相','对分相','六分相','合相']
    found = []
    for term in terms:
        count = text.count(term)
        if count > 0:
            pos = text.find(term)
            found.append(f'{term}x{count}')
    
    # 检查章节标题
    sections = ['【开篇】','【第1周】','【第2周】','【第3周】','【第4周】','【消费陷阱】']
    missing = [s for s in sections if s not in text]
    
    return found, missing, len(text), text

if __name__ == '__main__':
    births = ['1993-01-23','1988-08-08','1979-05-20','1990-12-15','2000-05-20',
              '1993-01-23','1992-06-21','1985-11-22','1998-02-19','2001-04-20',
              '1995-07-23','1994-09-17','1991-10-08','1996-11-23','1993-01-05']
    births = sorted(set(births))
    results = []
    for b in births:
        r = check_report(b)
        results.append((b, r))
        if r[0] is None:
            print(f'⏳ {b}: {r[1]}')
        elif not r[0]:
            print(f'✅ {b} [{r[2]}字]: CLEAN | 缺章节: {r[1] or "无"}')
        else:
            print(f'❌ {b} [{r[2]}字]: {", ".join(r[0])} | 缺章节: {r[1] or "无"}')
    # 汇总
    ok = sum(1 for r in results if r[1][0] is not None and not r[1][0])
    ng = sum(1 for r in results if r[1][0] is not None and r[1][0])
    print(f'\n通过: {ok}/{len(results)} | 失败: {ng}/{len(results)}')
