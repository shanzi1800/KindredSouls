#!/usr/bin/env python3
"""
翻译指定城市列表（不依赖 Top N 字母顺序）
用法:
  python3 scripts/translate_specific.py zh_cn_major   # 31 大城市
  python3 scripts/translate_specific.py zh_all       # 已完成 200 + 31
  python3 scripts/translate_specific.py en_global     # 1000 国际城市
"""
import json, os, sys, time, urllib.request, urllib.error, ssl
from pathlib import Path

DEEPSEEK_API_KEY = os.environ.get('DEEPSEEK_API_KEY', 'sk-9307f02599b44612b6767996a7839ab5')
CITIES_JSON = '/Users/apple/Desktop/KindredSouls源代码/web/public/data/cities.json'
PROGRESS_DIR = '/tmp/ks_translate_progress'
os.makedirs(PROGRESS_DIR, exist_ok=True)

LANGS = {
    'zh': 'Simplified Chinese (简体中文)',
    'en': 'English',
    'vi': 'Vietnamese (Tiếng Việt)',
    'es': 'Spanish (Español)',
    'fr': 'French (Français)',
    'th': 'Thai (ภาษาไทย)',
}

SYSTEM_PROMPT_ZH = """You are a localization expert for global astrology app KindredSouls.

Translate city names into Simplified Chinese (简体中文). CRITICAL RULES:
1. Use the most common colloquial name locals use on Google Maps daily
2. NEVER use official/full administrative names
3. Examples: 
   - Bangkok → 曼谷 (NOT 昭披耶/กรุงเทพมหานคร)
   - Ho Chi Minh City → 胡志明市 (NOT 西贡/Thành phố Hồ Chí Minh)
   - New York → 纽约
   - Xi'an → 西安 (NOT 西安市的某个区)
4. For Chinese cities, use their standard Chinese characters
5. Add country prefix only if city name is ambiguous: e.g., 'Los Angeles (US)'

Return ONLY a valid JSON object: {"city_key": "Chinese_translation"}"""

SYSTEM_PROMPT_INT = """You are a localization expert for global astrology app KindredSouls.

Translate city names into the target language. CRITICAL RULES:
1. Use the most common colloquial name locals use on Google Maps daily
2. NEVER use official/full administrative names
3. Examples (for Vietnamese):
   - New York → New York (keep English for global cities)
   - Bangkok → Bangkok (keep English)
   - London → Luân Đôn
   - Bangkok → Bangkok (NOT กรุงเทพมหานคร)
4. For common global cities, the English name is acceptable
5. For cities with well-known local names, use the local name
6. For ambiguous duplicates (e.g., multiple Santiagos), add country code: 'Santiago (CL)'

Return ONLY a valid JSON object: {"city_key": "translated_name"}"""

def call_deepseek(prompt, lang, max_retries=8):
    system = SYSTEM_PROMPT_ZH if lang == 'zh' else SYSTEM_PROMPT_INT
    sleep_t = 3
    for attempt in range(max_retries):
        try:
            req_body = {
                'model': 'deepseek-chat',
                'messages': [
                    {'role': 'system', 'content': system},
                    {'role': 'user', 'content': prompt}
                ],
                'temperature': 0.1,
                'response_format': {'type': 'json_object'},
                'max_tokens': 8000,
            }
            req = urllib.request.Request(
                'https://api.deepseek.com/v1/chat/completions',
                data=json.dumps(req_body).encode('utf-8'),
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {DEEPSEEK_API_KEY}',
                },
            )
            with urllib.request.urlopen(req, timeout=120, context=ssl.create_default_context()) as resp:
                result = json.loads(json.loads(resp.read().decode('utf-8'))['choices'][0]['message']['content'])
                return result
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            print(f'    ⚠️  {attempt+1}次失败({type(e).__name__})，{sleep_t}s后重试...')
            time.sleep(sleep_t)
            sleep_t = min(sleep_t * 2, 48)
    raise Exception('unreachable')

def translate_batch(city_keys, lang):
    with open(CITIES_JSON) as f:
        data = json.load(f)
    cities = data.get('fuse_index', [])
    city_map = {c['key']: c for c in cities}
    
    batch_info = '\n'.join(f'{i+1}. {k} ({city_map.get(k,{}).get("tz","")} {city_map.get(k,{}).get("lat","")},{city_map.get(k,{}).get("lon","")})' 
                          for i, k in enumerate(city_keys) if k in city_map)
    prompt = f"Translate these {len(city_keys)} city names:\n{batch_info}"
    return call_deepseek(prompt, lang)

def load_progress(lang):
    path = f'{PROGRESS_DIR}/progress_{lang}_specific.json'
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return {}

def save_progress(lang, data):
    with open(f'{PROGRESS_DIR}/progress_{lang}_specific.json', 'w') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def merge_into_cities(new_translations, lang):
    """把新翻译合并进 cities.json"""
    with open(CITIES_JSON) as f:
        data = json.load(f)
    cities = data.get('fuse_index', [])
    updated = 0
    for c in cities:
        if c['key'] in new_translations:
            t = new_translations[c['key']].strip()
            if t:
                if 'names' not in c:
                    c['names'] = {'en': c['key']}
                old = c['names'].get(lang, '')
                c['names'][lang] = t
                updated += 1
                print(f'  ✅ {c["key"]} → {t}' + (f' (was: {old})' if old and old != t else ''))
    
    with open(CITIES_JSON, 'w') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f'\n✅ 合并完成！更新 {updated} 个城市的 {lang} 翻译')
    print(f'   文件: {CITIES_JSON}')

def run_batch(city_keys, lang, batch_name):
    progress = load_progress(f'{batch_name}_{lang}')
    done = set(progress.get('done_keys', []))
    translations = progress.get('translations', {})
    
    todo = [k for k in city_keys if k not in done]
    print(f'已完成: {len(done)} | 待翻: {len(todo)}')
    
    BATCH_SIZE = 25
    for i in range(0, len(todo), BATCH_SIZE):
        batch = todo[i:i+BATCH_SIZE]
        bn = i//BATCH_SIZE + 1
        total_b = (len(todo)+BATCH_SIZE-1)//BATCH_SIZE
        print(f'\n[{batch_name}/{lang}] 批次 {bn}/{total_b} ({len(batch)}城)...')
        try:
            result = translate_batch(batch, lang)
            for k, v in result.items():
                if isinstance(v, str) and v.strip():
                    translations[k] = v.strip()
            progress['done_keys'] = list(set(progress['done_keys']) | set(batch))
            progress['translations'] = translations
            save_progress(f'{batch_name}_{lang}', progress)
            print(f'  ✅ 存 {len(result)} 条')
        except Exception as e:
            print(f'  ❌ 失败: {e}')
            time.sleep(5)
        time.sleep(3)
    
    print(f'\n✅ {batch_name}/{lang} 完成！共 {len(translations)} 条')
    return translations

# ==================== 城市清单 ====================
ZH_CN_MAJOR = [
    'Zhengzhou','Yangzhou',"Xi'an",'Xiamen','Wuxi','Wuhan','Taiyuan','Suzhou',
    'Shijiazhuang','Changsha','Qingdao','Ningbo','Nanyang','Nanjing','Nanchang',
    'Lanzhou','Kunming','Jinan','Jiangmen','Hefei','Haikou','Guiyang','Fuzhou',
    'Foshan','Dongguan','Dalian','Chongqing','Zhongshan','Jilin','Changchun','Lianyungang'
]

EN_GLOBAL_TOP = [
    # Top 50 已翻译的（但很多 en 就是 key 本身）
    'New York','London','Tokyo','Paris','Sydney','Los Angeles','Singapore','Dubai',
    'Hong Kong','Beijing','Shanghai','Seoul','Bangkok','Berlin','Toronto','Moscow',
    'Mumbai','Istanbul','Jakarta','Cairo','Lagos','Nairobi','Delhi','São Paulo',
    'Mexico City','Buenos Aires','Lima','Bogotá','Kolkata','Manila','Dhaka','Karachi',
    'Ho Chi Minh City','Lahore','Bangalore','Chennai','Kuala Lumpur','Taipei','Macao',
    'Melbourne','Brisbane','Auckland','Tel Aviv','Amsterdam','Vienna','Barcelona',
    'Milan','Rome','Madrid','Munich','Stockholm','Oslo','Copenhagen','Helsinki',
    'Warsaw','Prague','Lisbon','Dublin','Brussels','Zurich','Ho Chi Minh City',
    'Guangzhou','Shenzhen','Chengdu','Hangzhou',
    # 中国城市（补 en 翻译）
    'Chongqing','Wuhan','Nanjing',"Xi'an",'Suzhou','Dalian','Xiamen','Ningbo',
    'Wuxi','Zhengzhou','Nanchang','Hefei','Jinan','Qingdao','Shijiazhuang','Changsha',
    'Kunming','Foshan','Dongguan','Jiangmen','Zhongshan','Changchun','Taiyuan',
    'Lanzhou','Haikou','Guiyang','Lianyungang','Hohhot','Nanyang','Yangzhou',
    'Baoding','Luoyang','Yantai','Mianyang','Xiangyang','Jiaxing','Taizhou',
    'Zhuzhou','Yichang','Fuyang','Bengbu','Huainan','Maanshan',
    # 更多全球城市
    'Frankfurt','Hamburg','Düsseldorf','Cologne','Stuttgart','Dortmund','Essen',
    'Rotterdam','Genoa','Naples','Turin','Florence','Venice','Palermo',
    'Porto','Athens','Istanbul','Ankara','Izmir','Cairo','Alexandria',
    'Casablanca','Tunis','Algiers','Accra','Addis Ababa','Johannesburg',
    'Cape Town','Durban','Luanda','Kinshasa','Dakar','Freetown',
    'Kampala','Kigali','Lusaka','Harare','Maputo','Antananarivo',
    'Baghdad','Tehran','Riyadh','Jeddah','Kuwait City','Doha','Manama','Muscat',
    'Abu Dhabi','Dubai','Tel Aviv','Amman','Beirut','Damascus','Bucharest',
    'Budapest','Belgrade','Zagreb','Sofia','Athens',
    'Riga','Vilnius','Tallinn','Minsk','Kiev','Moscow','St. Petersburg',
    'Novosibirsk','Yekaterinburg','Kazan','Nizhny Novgorod',
    'Bangalore','Hyderabad','Pune','Jaipur','Lucknow','Kanpur','Nagpur',
    'Surat','Kochi','Indore','Bhopal','Visakhapatnam','Vadodara','Ghaziabad',
    'Ludhiana','Agra','Meerut','Rajkot','Faridabad','Gurgaon',
    'Navi Mumbai','Thane','Panaji','Chandigarh','Dehradun','Shimla',
    'Daegu','Busan','Incheon','Daejeon','Gwangju','Suwon',
    'Da Nang','Hanoi','Hai Phong','Can Tho','Da Lat','Nha Trang',
    'Phnom Penh','Siem Reap','Vientiane','Luang Prabang',
    'Yangon','Mandalay','Naypyidaw',
    'Bandar Seri Begawan','Dili','Suva',
    'Reykjavik','Tórshavn','Nuuk',
    'Tallinn','Riga','Vilnius','Helsinki','Stockholm','Oslo','Copenhagen',
    'Vienna','Bern','Geneva','Zürich','Lausanne',
    'Bratislava','Ljubljana','Sarajevo','Skopje','Pristina',
    'Podgorica','Tirana','Valletta','Nicosia','Luxembourg',
    'Monaco','Andorra la Vella','San Marino','Vatican City','Liechtenstein',
    'Tashkent','Almaty','Bishkek','Dushanbe','Ashgabat',
    'Baku','Tbilisi','Yerevan','Tehran','Baghdad','Damascus',
    'Tripoli','Rabat','Algiers','Tunis','Cairo','Amman','Jerusalem','Beirut',
    'Guangzhou','Shenzhen','Chengdu','Hangzhou','Wuhan','Nanjing','Xian',
]

# 去重
EN_GLOBAL_TOP = list(dict.fromkeys(EN_GLOBAL_TOP))

if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'help'
    
    if cmd == 'zh_cn_major':
        t = run_batch(ZH_CN_MAJOR, 'zh', 'zh_cn_major')
        merge_into_cities(t, 'zh')
    elif cmd == 'en_global':
        t = run_batch(EN_GLOBAL_TOP[:1000], 'en', 'en_global')
        merge_into_cities(t, 'en')
    elif cmd == 'merge_all':
        for lang in ['zh', 'en', 'vi', 'es', 'fr', 'th']:
            p = load_progress(f'zh_cn_major_{lang}')
            if p.get('translations'):
                merge_into_cities(p['translations'], lang)
    else:
        print("用法:")
        print("  python3 scripts/translate_specific.py zh_cn_major  # 翻译31个中国大城市")
        print("  python3 scripts/translate_specific.py en_global   # 翻译1000个全球城市")
        print("  python3 scripts/translate_specific.py merge_all   # 合并所有进度到cities.json")
