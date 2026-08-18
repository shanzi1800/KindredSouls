#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
C+ 精准 zone 清洗：按 13:01 铁律，每座城只保留 en（基准）+ 自己 zone 的语言名，
删除所有跨 zone 污染字段（如纽约挂着中文/泰文/越文名）。
清洗后再重跑 cplus_truth.py（断点续传会从干净 cities.json 初始化 done）。
"""
import io, json, os, sys

CITIES_JSON = '/Users/apple/Desktop/KindredSouls源代码/web/public/data/cities.json'

LANGS = {
    'zh': {'chars': '一-鿿'},
    'es': {'chars': 'áéíóúüñÁÉÍÓÚÜÑ'},
    'th': {'chars': '฀-๿'},
    'fr': {'chars': 'àâçéèêëîïôûùüÿœæÀÂÇÉÈÊËÎÏÔÛÙÜŸŒÆ'},
    'vi': {'chars': 'ăâđêôơưĂÂĐÊÔƠƯ'},
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
    if not s:
        return False
    if lang == 'zh':
        return any('\u4e00' <= ch <= '\u9fff' for ch in s)
    if lang == 'th':
        return any('\u0e00' <= ch <= '\u0e7f' for ch in s)
    return any(ch in LANGS[lang]['chars'] for ch in s)

def main():
    d = json.load(io.open(CITIES_JSON, encoding='utf-8'))
    idx = d['fuse_index']
    removed = 0
    kept = 0
    for c in idx:
        names = c.get('names', {})
        if not names:
            continue
        z = zone(c)
        new_names = {}
        # en 永远保留（基准 key）
        if names.get('en', ''):
            new_names['en'] = names['en']
        # 只保留「自己 zone」的语言名（且必须含本国字符，排除 en 冒充残留）
        if z in ('zh','th','es','fr','vi'):
            v = names.get(z, '')
            if v and has_local_chars(v, z):
                new_names[z] = v
                kept += 1
            else:
                # 自己 zone 没真翻译 → 留空（交给重跑补），不挂冒充
                removed += 1
        # 删掉所有「非自己 zone」的语言名（跨区污染）
        for L in ('zh','th','es','fr','vi'):
            if L != z and L in names:
                removed += 1
        c['names'] = new_names
    json.dump(d, io.open(CITIES_JSON, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    print(f'清洗完成：移除跨区/冒充字段 {removed} 个，保留本国真翻译 {kept} 个')
    print(f'原则：每城仅 en（基准）+ 自己 zone 语言名；跨区名全部删除')

if __name__ == '__main__':
    main()
