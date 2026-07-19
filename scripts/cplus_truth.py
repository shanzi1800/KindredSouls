#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
C+ 真翻译脚本（并发 + processed 追踪版 · 2026-07-19）
关键修复：区分【processed 已处理】与【translated 有效翻译】。
  - 很多西/法城市本地名==英文名(Madrid=Madrid)，是正确结果但旧逻辑判"未翻译"→无限重试→永不完成。
  - 现在：城市只要被 DeepSeek 处理过一次(不管结果是否==英文)即算 processed，不再重试。
  - 完成 = 所有 plan 城市都 processed。translated 只是"拿到了不同于英文的本地名"的子集。
每语言跑完即落盘 cities.json；6 路并发；无缓冲日志。断点续传 + 指数退避 + JSON防伪。
"""
import json, time, urllib.request, urllib.error, ssl, os, sys, io
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

MAX_WORKERS = 6

DEEPSEEK_API_KEY = os.environ.get('DEEPSEEK_API_KEY', 'sk-9307f02599b44612b6767996a7839ab5')
CITIES_JSON = '/Users/apple/Desktop/KindredSouls源代码/web/public/data/cities.json'
PLAN_JSON = '/tmp/cplus_plan.json'
PROGRESS_DIR = '/tmp/cplus_progress'
DONE_FLAG = '/tmp/cplus_alldone.flag'
os.makedirs(PROGRESS_DIR, exist_ok=True)

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

def load_cities():
    with io.open(CITIES_JSON, encoding='utf-8') as f:
        return json.load(f)

def call_deepseek(prompt, max_retries=8):
    sleep_t = 3
    last = None
    for attempt in range(max_retries):
        try:
            req = urllib.request.Request(
                'https://api.deepseek.com/v1/chat/completions',
                data=json.dumps({
                    'model': 'deepseek-chat',
                    'messages': [{'role': 'user', 'content': prompt}],
                    'temperature': 0.1,
                    'response_format': {'type': 'json_object'},
                    'max_tokens': 8000,
                }).encode('utf-8'),
                headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {DEEPSEEK_API_KEY}'}
            )
            with urllib.request.urlopen(req, timeout=120, context=ssl.create_default_context()) as resp:
                return json.loads(json.loads(resp.read().decode('utf-8'))['choices'][0]['message']['content'])
        except Exception as e:
            last = e
            if attempt == max_retries - 1:
                raise
            time.sleep(sleep_t)
            sleep_t = min(sleep_t * 2, 60)
    raise last

def has_local_chars(s, lang):
    if not s:
        return False
    if lang == 'zh':
        return any('\u4e00' <= c <= '\u9fff' for c in s)
    if lang == 'th':
        return any('\u0e00' <= c <= '\u0e7f' for c in s)
    return any(c in LANGS[lang]['chars'] for c in s)

def is_valid_local(v, lang, en):
    if not v:
        return False
    v = v.strip()
    if has_local_chars(v, lang):
        return True
    if en and v != en.strip():
        return True
    return False

def load_progress(progress_file):
    done, processed = {}, set()
    if os.path.exists(progress_file):
        with open(progress_file) as f:
            data = json.load(f)
        done = data.get('translations', {})
        processed = set(data.get('processed', []))
    # 兼容旧档：已翻译的必然算已处理
    processed |= set(done.keys())
    return done, processed

def save_progress(progress_file, done, processed):
    with open(progress_file, 'w') as f:
        json.dump({'translations': done, 'processed': sorted(processed)}, f, ensure_ascii=False, indent=2)

def translate_language(lang, plan_keys, cities_data, save_cb=None):
    cfg = LANGS[lang]
    progress_file = os.path.join(PROGRESS_DIR, f'progress_{lang}.json')

    done, processed = load_progress(progress_file)
    print(f"  📂 {lang} 已有: 翻译{len(done)} / 处理{len(processed)}", flush=True)

    # cities.json 已有真翻译也并入 done+processed（避免重翻）
    for c in cities_data['fuse_index']:
        nm = c.get('names', {}).get(lang, '')
        en = c.get('names', {}).get('en', '')
        if is_valid_local(nm, lang, en):
            done.setdefault(c['key'], nm)
            processed.add(c['key'])

    city_map = {c['key']: c for c in cities_data['fuse_index']}
    todo = [k for k in plan_keys if k in city_map and k not in processed]
    print(f"  📝 {lang} 待处理: {len(todo)} 城", flush=True)

    batch_size = 40
    batches = [todo[i:i+batch_size] for i in range(0, len(todo), batch_size)]
    total_batches = len(batches)
    lock = threading.Lock()
    state = {'count': 0, 'fin': 0}

    def make_prompt(batch):
        return f"""Translate these {len(batch)} city names into {cfg['target']}.
Rules:
1. Use common colloquial names locals use daily on Google Maps.
2. NEVER use archaic, ultra-formal, or extremely long official names.
3. Examples: Bangkok -> 'กรุงเทพฯ' (Thai), Beijing -> '北京' (Chinese), London -> 'Londres' (Spanish), Hanoi -> 'Hà Nội' (Vietnamese).
4. Return ONLY a JSON object: key = city_key, value = {cfg['target']}_name. No explanation.
5. If a city has NO well-known {cfg['target']} name (tiny settlement), return value as empty string "".
Cities: {batch}"""

    def work(bi, batch):
        try:
            result = call_deepseek(make_prompt(batch))
        except Exception as e:
            with lock:
                state['fin'] += 1
            print(f"  ❌ {lang} 批次 {bi+1}/{total_batches} 失败(不标记processed,下轮重试): {str(e)[:70]}", flush=True)
            return
        with lock:
            # 整批算已处理（成功返回即视为尝试过，不再重试）
            for k in batch:
                processed.add(k)
            for k, v in result.items():
                if k in city_map and isinstance(v, str):
                    v = v.strip()
                    en_val = city_map[k].get('names', {}).get('en', '')
                    if is_valid_local(v, lang, en_val):
                        existing = city_map[k].get('names', {}).get(lang, '')
                        if not is_valid_local(existing, lang, en_val):
                            city_map[k].setdefault('names', {})[lang] = v
                            done[k] = v
                            state['count'] += 1
            state['fin'] += 1
            if state['fin'] % 5 == 0 or state['fin'] == total_batches:
                save_progress(progress_file, done, processed)
                print(f"  ✅ {lang} {state['fin']}/{total_batches} 批 | 翻译{len(done)} 处理{len(processed)} | 本次+{state['count']}", flush=True)

    if batches:
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as ex:
            futs = [ex.submit(work, bi, b) for bi, b in enumerate(batches)]
            for _ in as_completed(futs):
                pass

    save_progress(progress_file, done, processed)
    remaining = len([k for k in plan_keys if k in city_map and k not in processed])
    print(f"  🎯 {lang} 完成: 翻译{len(done)} 处理{len(processed)} 剩余{remaining} (本次新增翻译 {state['count']})", flush=True)
    if save_cb:
        save_cb()
    return state['count'], remaining

def gen_plan(cities_data):
    plan = {l: [] for l in LANGS}
    for c in cities_data['fuse_index']:
        z = zone(c)
        if z in plan:
            plan[z].append(c['key'])
    return plan

def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else 'run'
    cities_data = load_cities()
    print(f"城市总数: {len(cities_data['fuse_index'])}", flush=True)

    if mode == 'reclass':
        # 只译 /tmp/cplus_reclass_plan.json 里按新语种分组的城市（重分类补译）
        plan = json.load(open('/tmp/cplus_reclass_plan.json'))
        total = sum(len(v) for v in plan.values())
        print(f"reclass 补译计划: 共 {total} 城 -> { {k: len(v) for k, v in plan.items() if v} }", flush=True)

        def save_cities():
            with io.open(CITIES_JSON, 'w', encoding='utf-8') as f:
                json.dump(cities_data, f, ensure_ascii=False, indent=2)
            print(f"  💾 cities.json 已保存 {time.strftime('%H:%M:%S')}", flush=True)

        total_new = 0
        for lang in ['zh', 'es', 'th', 'fr', 'vi']:
            keys = plan.get(lang, [])
            if not keys:
                continue
            print(f"\n{'='*70}\n  补译 {LANGS[lang]['name']} ({lang}) {len(keys)} 城\n{'='*70}", flush=True)
            cnt, _ = translate_language(lang, keys, cities_data, save_cb=save_cities)
            total_new += cnt
        save_cities()
        print(f"\n🏁 reclass 补译完成，新增 {total_new} 翻译。", flush=True)
        return

    if mode == 'plan':
        plan = gen_plan(cities_data)
        with open(PLAN_JSON, 'w') as f:
            json.dump(plan, f, ensure_ascii=False, indent=2)
        print("Plan:", {k: len(v) for k, v in plan.items()}, flush=True)
        return

    if not os.path.exists(PLAN_JSON):
        plan = gen_plan(cities_data)
        with open(PLAN_JSON, 'w') as f:
            json.dump(plan, f, ensure_ascii=False, indent=2)
    else:
        with open(PLAN_JSON) as f:
            plan = json.load(f)

    def save_cities():
        with io.open(CITIES_JSON, 'w', encoding='utf-8') as f:
            json.dump(cities_data, f, ensure_ascii=False, indent=2)
        print(f"  💾 cities.json 已保存 {time.strftime('%H:%M:%S')}", flush=True)

    total_new = 0
    total_remaining = 0
    for lang in ['zh', 'es', 'th', 'fr', 'vi']:
        print(f"\n{'='*70}", flush=True)
        print(f"  开始: {LANGS[lang]['name']} ({lang})  计划 {len(plan.get(lang, []))} 城", flush=True)
        print(f"{'='*70}", flush=True)
        count, remaining = translate_language(lang, plan.get(lang, []), cities_data, save_cb=save_cities)
        total_new += count
        total_remaining += remaining

    print(f"\n{'='*70}", flush=True)
    print(f"本轮新增翻译 {total_new} | 全部剩余待处理 {total_remaining}", flush=True)
    save_cities()
    if total_remaining == 0:
        with open(DONE_FLAG, 'w') as f:
            f.write(time.strftime('%Y-%m-%d %H:%M:%S'))
        print(f"  🏁 全部城市已处理完毕，写完成标记 {DONE_FLAG}", flush=True)
    print(f"  ✅ 本轮结束！", flush=True)
    print(f"{'='*70}", flush=True)

if __name__ == '__main__':
    main()
