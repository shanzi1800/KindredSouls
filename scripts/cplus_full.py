#!/usr/bin/env python3
"""
C+ 全量城市翻译脚本（2308 城市 × 5 语种）
- 断点续传（增量保存）
- 指数退避
- JSON Mode 防伪
- 每语种独立隔离（不污染其他字段）
"""
import json, time, urllib.request, urllib.error, ssl, os, sys

DEEPSEEK_API_KEY = os.environ.get('DEEPSEEK_API_KEY', 'sk-9307f02599b44612b6767996a7839ab5')
CITIES_JSON = '/Users/apple/Desktop/KindredSouls源代码/web/public/data/cities.json'
PLAN_JSON = '/tmp/cplus_plan.json'
PROGRESS_DIR = '/tmp/cplus_progress'
os.makedirs(PROGRESS_DIR, exist_ok=True)

# 语种配置
LANGS = {
    'zh': {'name': '简体中文', 'target': 'Chinese (Simplified)', 'chars': '一-鿿'},
    'es': {'name': '西班牙语', 'target': 'Spanish', 'chars': 'áéíóúüñÁÉÍÓÚÜÑ'},
    'th': {'name': '泰语', 'target': 'Thai', 'chars': '฀-๿'},
    'fr': {'name': '法语', 'target': 'French', 'chars': 'àâçéèêëîïôûùüÿœæÀÂÇÉÈÊËÎÏÔÛÙÜŸŒÆ'},
    'vi': {'name': '越南语', 'target': 'Vietnamese', 'chars': 'ăâđêôơưĂÂĐÊÔƠƯ'},
}

def load_cities():
    with open(CITIES_JSON) as f:
        data = json.load(f)
    return data

def call_deepseek(prompt, max_retries=8):
    sleep_t = 3
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
            if attempt == max_retries - 1:
                raise
            print(f'  ⚠️ {attempt+1}次失败({type(e).__name__}): {str(e)[:80]}')
            time.sleep(sleep_t)
            sleep_t = min(sleep_t * 2, 60)

def has_local_chars(s, lang):
    if not s: return False
    chars = LANGS[lang]['chars']
    return any(c in chars for c in s)

def translate_language(lang, plan_keys, cities_data):
    """翻译单个语种，带断点续传"""
    cfg = LANGS[lang]
    progress_file = os.path.join(PROGRESS_DIR, f'progress_{lang}.json')
    
    # 加载已有进度
    done = {}
    if os.path.exists(progress_file):
        with open(progress_file) as f:
            done = json.load(f).get('translations', {})
        print(f"  📂 {lang} 已有进度: {len(done)} 城")
    
    city_map = {c['key']: c for c in cities_data['fuse_index']}
    
    # 待翻译清单（跳过已完成的）
    todo = [k for k in plan_keys if k in city_map and k not in done]
    print(f"  📝 {lang} 待翻译: {len(todo)} 城")
    
    batch_size = 30
    translated_count = 0
    
    for i in range(0, len(todo), batch_size):
        batch = todo[i:i+batch_size]
        prompt = f"""Translate these {len(batch)} city names into {cfg['target']}.
Rules:
1. Use common colloquial names locals use daily on Google Maps
2. NEVER use archaic, ultra-formal, or extremely long official names
3. Examples: Bangkok → 'กรุงเทพฯ' (NOT 'กรุงเทพมหานคร...'), Beijing → '北京', London → 'Londres' (Spanish)
4. Return ONLY JSON object with key=city_key, value={cfg['target']}_name, no explanation
5. If a city already has a well-known {cfg['target']} name, use it

Cities: {batch}"""
        
        try:
            result = call_deepseek(prompt)
            for k, v in result.items():
                if k in city_map and isinstance(v, str) and v.strip():
                    # 仅当没有本地字符时才写入（保留已有翻译）
                    existing = city_map[k].get('names', {}).get(lang, '')
                    if not has_local_chars(existing, lang):
                        city_map[k].setdefault('names', {})[lang] = v.strip()
                        done[k] = v.strip()
                        translated_count += 1
            
            # 增量保存
            with open(progress_file, 'w') as f:
                json.dump({'translations': done}, f, ensure_ascii=False, indent=2)
            
            print(f"  ✅ {lang} 批次 {i//batch_size+1}: +{len([k for k in result if k in city_map])} 城 | 累计 {len(done)}")
            time.sleep(2)  # 基础延迟
            
        except Exception as e:
            print(f"  ❌ {lang} 批次 {i//batch_size+1} 失败: {e}")
            # 保存当前进度后继续
            with open(progress_file, 'w') as f:
                json.dump({'translations': done}, f, ensure_ascii=False, indent=2)
            continue
    
    print(f"  🎯 {lang} 完成: {len(done)} 城 (本次 +{translated_count})")
    return translated_count

def main():
    print("=" * 70)
    print("  C+ 全量城市翻译（2308 城 × 5 语种）")
    print("=" * 70)
    
    # 加载计划
    with open(PLAN_JSON) as f:
        plan = json.load(f)
    
    # 加载 cities
    cities_data = load_cities()
    print(f"  城市总数: {len(cities_data['fuse_index'])}")
    
    # 逐语种翻译
    total_new = 0
    for lang in ['zh', 'es', 'th', 'fr', 'vi']:
        print(f"\n{'='*70}")
        print(f"  开始翻译: {LANGS[lang]['name']} ({lang})")
        print(f"{'='*70}")
        count = translate_language(lang, plan.get(lang, []), cities_data)
        total_new += count
    
    # 保存最终 cities.json
    print(f"\n{'='*70}")
    print(f"  保存 cities.json（新增 {total_new} 翻译）...")
    with open(CITIES_JSON, 'w') as f:
        json.dump(cities_data, f, ensure_ascii=False, indent=2)
    print(f"  ✅ 完成！")
    print(f"{'='*70}")

if __name__ == '__main__':
    main()
