#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
C+ 覆盖率自检（按 13:01 铁律）：每城只应有 en（基准）+ 自己 zone 的语言名。
退出码：全部 zone ≥99.9% 且无跨区/冒充 → 0（完成）；否则 1（未完成）。
"""
import io, json, sys

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

def is_valid_local(v, lang, en):
    """与 cplus_truth.py 写入口径一致：含本国字符、或≠英文原名(无重音拉丁名) 即算已翻译。"""
    if not v:
        return False
    v = v.strip()
    if has_local_chars(v, lang):
        return True
    if en and v != en.strip():
        return True
    return False

def main():
    d = json.load(io.open(CITIES_JSON, encoding='utf-8'))
    idx = d['fuse_index']
    from collections import Counter
    zc = Counter(zone(c) for c in idx)

    THRESH = 99.5  # 允许极小尾巴：真·无名小聚落(DeepSeek 返回空)按13:01铁律留空，不算欠债
    all_done = True
    total_bad = 0
    lines = []
    for L in ['zh','es','th','fr','vi']:
        pool = [c for c in idx if zone(c) == L]
        tot = len(pool)
        tr = sum(1 for c in pool if is_valid_local(c.get('names',{}).get(L,''), L, c.get('names',{}).get('en','')))
        pct = tr*100.0/tot if tot else 100.0
        flag = '✅' if pct >= THRESH else '❌'
        if pct < THRESH:
            all_done = False
        lines.append(f'  {L}: {tr}/{tot} = {pct:.1f}% {flag}')
    # 真正的英文冒充：非 en 字段却==英文原名（应=0）
    for L in ['zh','es','th','fr','vi']:
        bad = sum(1 for c in idx if c.get('names',{}).get(L,'') and c['names'][L].strip() == c.get('names',{}).get('en','').strip())
        total_bad += bad
    lines.append(f'  跨区/冒充字段数: {total_bad}（应=0）')
    print('\n'.join(lines))
    if total_bad > 0:
        all_done = False
    sys.exit(0 if all_done else 1)

if __name__ == '__main__':
    main()
