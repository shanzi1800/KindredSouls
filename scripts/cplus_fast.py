#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
C+ 快速并行版：batch_size=100 + 语种并行。
一行命令：python3 scripts/cplus_fast.py run
"""
import io, json, os, sys, time, urllib.request, ssl, subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed

CITIES_JSON = '/Users/apple/Desktop/KindredSouls源代码/web/public/data/cities.json'
DEEPSEEK_KEY = 'sk-9307f02599b44612b6767996a7839ab5'
BATCH_SIZE = 100
MAX_RETRIES = 8

LANGS = {
    'zh': {'name': '简体中文', 'target': 'Chinese (Simplified)', 'chars': '一-鿿'},
    'es': {'name': '西班牙语', 'target': 'Spanish', 'chars': 'áéíóúüñÁÉÍÓÚÜÑ'},
    'th': {'name': '泰语',     'target': 'Thai',    'chars': '฀-๿'},
    'fr': {'name': '法语',     'target': 'French',  'chars': 'àâçéèêëîïôûùüÿœæÀÂÇÉÈÊËÎÏÔÛÙÜŸŒÆ'},
    'vi': {'name': '越南语',   'target': 'Vietnamese', 'chars': 'ăâđêôơưĂÂĐÊÔƠƯ'},
}

def zone(c):
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

def has_local_chars(s, lang):
    if not s: return False
    if lang == 'zh': return any('\u4e00' <= c <= '\u9fff' for c in s)
    if lang == 'th': return any('\u0e00' <= c <= '\u0e7f' for c in s)
    return any(c in LANGS[lang]['chars'] for c in s)

def load_cities():
    return json.load(io.open(CITIES_JSON, encoding='utf-8'))

def call_deepseek(prompt, max_retries=MAX_RETRIES):
    sleep_t = 3
    for attempt in range(max_retries):
        try:
            body = json.dumps({'model': 'deepseek-chat', 'messages': [{'role': 'user', 'content': prompt}], 'response_format': {'type': 'json_object'}}).encode('utf-8')
            req = urllib.request.Request('https://api.deepseek.com/v1/chat/completions', data=body,
                headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {DEEPSEEK_KEY}'})
            with urllib.request.urlopen(req, timeout=120, context=ssl.create_default_context()) as resp:
                return json.loads(json.loads(resp.read().decode('utf-8'))['choices'][0]['message']['content'])
        except Exception as e:
            if attempt < max_retries - 1:
                time.sleep(sleep_t); sleep_t = min(sleep_t * 2, 60)
    return None

def gen_plan(cities_data):
    plan = {l: [] for l in LANGS}
    for c in cities_data['fuse_index']:
        z = zone(c)
        if z in plan:
            plan[z].append(c['key'])
    return plan

def translate_lang(lang, plan_keys, cities_data):
    cfg = LANGS[lang]
    city_map = {c['key']: c for c in cities_data['fuse_index']}
    todo = [k for k in plan_keys if not has_local_chars(city_map[k].get('names', {}).get(lang, ''), lang)]
    done = sum(1 for k in plan_keys if has_local_chars(city_map[k].get('names', {}).get(lang, ''), lang))
    total = len(plan_keys)
    print(f'  [{lang}] {done}/{total} 已完成 | 待翻 {len(todo)} 城 | batch={BATCH_SIZE}')
    if not todo:
        print(f'  [{lang}] 全部完成！')
        return 0
    added = 0
    for i in range(0, len(todo), BATCH_SIZE):
        batch = todo[i:i+BATCH_SIZE]
        prompt = f"""Translate these {len(batch)} city names into {cfg['target']}.
Rules:
1. Use common colloquial names locals use daily on Google Maps
2. NEVER use archaic, ultra-formal, or extremely long official names
3. Return ONLY JSON object with key=city_key, value={cfg['target']}_name, no explanation
4. If a city already has a well-known {cfg['target']} name, use it
Cities: {json.dumps(batch)}"""
        result = call_deepseek(prompt)
        if result:
            for k, v in result.items():
                if k in city_map and has_local_chars(v.strip(), lang):
                    existing = city_map[k].setdefault('names', {}).get(lang, '')
                    if not existing or (existing and not has_local_chars(existing, lang)):
                        city_map[k].setdefault('names', {})[lang] = v.strip()
                        added += 1
        else:
            print(f'  [{lang}] ⚠️ 批次 {(i//BATCH_SIZE)+1} API 失败，重试...')
        sys.stdout.flush()
    print(f'  [{lang}] ✅ 新增 {added} 翻译')
    return added

def run():
    print(f'=== C+ 快速并行版 batch_size={BATCH_SIZE} ===')
    cities_data = load_cities()
    plan = gen_plan(cities_data)
    total_new = 0
    # 并行翻所有语种
    with ThreadPoolExecutor(max_workers=5) as ex:
        futures = {ex.submit(translate_lang, lang, plan.get(lang,[]), cities_data): lang for lang in LANGS}
        for f in as_completed(futures):
            lang = futures[f]
            try:
                n = f.result()
                total_new += n
            except Exception as e:
                print(f'  [{lang}] ❌ 异常: {e}')
    # 保存
    with io.open(CITIES_JSON, 'w', encoding='utf-8') as f:
        json.dump(cities_data, f, ensure_ascii=False, indent=2)
    print(f'=== 保存完成！新增 {total_new} 翻译 ===')

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'run':
        run()
    else:
        print('用法: python3 scripts/cplus_fast.py run')
