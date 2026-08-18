#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
清理 cities.json 里 7/17 留下的 en 冒充：
names[lang] 的值如果无该语种字符（= en 原名或空串），直接清掉（留空）。
只动 zh/th/es/fr/vi，不动 en（基准）。
真翻译（含该语种字符）保留。
"""
import json, io

CITIES = '/Users/apple/Desktop/KindredSouls源代码/web/public/data/cities.json'

def is_local(s, lang):
    if not s:
        return False
    if lang == 'zh':
        return any('\u4e00' <= c <= '\u9fff' for c in s)
    if lang == 'th':
        return any('\u0e00' <= c <= '\u0e7f' for c in s)
    sets = {
        'vi': set('ăâđêôơưĂÂĐÊÔƠƯ'),
        'es': set('áéíóúüñÁÉÍÓÚÜÑ'),
        'fr': set('àâçéèêëîïôûùüÿœæÀÂÇÉÈÊËÎÏÔÛÙÜŸŒÆ'),
    }
    return any(c in sets[lang] for c in s)

d = json.load(io.open(CITIES, encoding='utf-8'))
total = 0
for c in d['fuse_index']:
    names = c.get('names', {})
    for lang in ['zh', 'th', 'es', 'fr', 'vi']:
        if lang in names and not is_local(names[lang], lang):
            del names[lang]
            total += 1
io.open(CITIES, 'w', encoding='utf-8').write(json.dumps(d, ensure_ascii=False, indent=2))
print('清理 en 冒充字段数:', total)
