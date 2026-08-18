#!/usr/bin/env python3
"""
修复 cities.json 的 en/vi/中文 字段污染
修复 3 类 bug:
1. 中文城市的 en 字段被写进了 zh → 还原 en=key
2. 越南城市 en/vi 互串 → 还原 en=English, vi=正确越南语
3. 越南城市 key 不存在（Hanoi/Da Nang 等）→ 跳过
"""
import json

CITIES_JSON = '/Users/apple/Desktop/KindredSouls源代码/web/public/data/cities.json'

with open(CITIES_JSON) as f:
    data = json.load(f)
cities = data.get('fuse_index', [])

# ==================== 1. 中文城市 en 字段修复 ====================
# 用 search[0] 提取原始英文名（search 数组里第一个通常是对应 en 的）
# 例: search: ['Shijiazhuang', '石家庄', ...] → en='Shijiazhuang'
# 或: search: ['Beijing / Bắc Kinh', '北京', ...] → en='Beijing'

FIXED_CN_CITIES = {
    # key: (原始英文名, 正确中文名)
    'Zhuzhou': ('Zhuzhou', '株洲'),
    'Yichang': ('Yichang', '宜昌'),
    'Yantai': ('Yantai', '烟台'),
    'Taizhou': ('Taizhou', '泰州'),
    'Mianyang': ('Mianyang', '绵阳'),
    'Luoyang': ('Luoyang', '洛阳'),
    'Jiaxing': ('Jiaxing', '嘉兴'),
    'Huainan': ('Huainan', '淮南'),
    'Fuyang': ('Fuyang', '阜阳'),
    'Bengbu': ('Bengbu', '蚌埠'),
    'Baoding': ('Baoding', '保定'),
    'Hohhot': ('Hohhot', '呼和浩特'),
    'Hefei': ('Hefei', '合肥'),
    'Jinan': ('Jinan', '济南'),
    'Qingdao': ('Qingdao', '青岛'),
    'Shijiazhuang': ('Shijiazhuang', '石家庄'),
    'Changsha': ('Changsha', '长沙'),
    'Kunming': ('Kunming', '昆明'),
    'Foshan': ('Foshan', '佛山'),
    'Dongguan': ('Dongguan', '东莞'),
    'Jiangmen': ('Jiangmen', '江门'),
    'Zhongshan': ('Zhongshan', '中山'),
    'Changchun': ('Changchun', '长春'),
    'Taiyuan': ('Taiyuan', '太原'),
    'Lanzhou': ('Lanzhou', '兰州'),
    'Haikou': ('Haikou', '海口'),
    'Guiyang': ('Guiyang', '贵阳'),
    'Lianyungang': ('Lianyungang', '连云港'),
}

# ==================== 2. 越南城市 en/vi 修复 ====================
# 越南城市: en=正确英文名, vi=正确越南语
VIETNAM_CITIES = {
    'Hanoi': ('Hanoi', 'Hà Nội'),
    'Ho Chi Minh City': ('Ho Chi Minh City', 'Thành phố Hồ Chí Minh'),
    'Da Nang': ('Da Nang', 'Đà Nẵng'),
    'Can Tho': ('Can Tho', 'Cần Thơ'),
    'Da Lat': ('Da Lat', 'Đà Lạt'),
    'Hai Phong': ('Hai Phong', 'Hải Phòng'),
    'Nha Trang': ('Nha Trang', 'Nha Trang'),
}

city_map = {c['key']: c for c in cities}
fixed = {'en': [], 'vi': [], 'zh': []}

# ==================== 修复中文城市 en 字段 ====================
for key, (correct_en, correct_zh) in FIXED_CN_CITIES.items():
    if key in city_map:
        c = city_map[key]
        if 'names' not in c:
            c['names'] = {'en': key}
        old_en = c['names'].get('en', '')
        old_zh = c['names'].get('zh', '')
        # 修复 en
        c['names']['en'] = correct_en
        # 确认 zh（用已翻译的值，不覆盖）
        if correct_zh:
            c['names']['zh'] = correct_zh
        fixed['en'].append(f'{key}: en="{old_en}"→"{correct_en}"')
        if old_zh != correct_zh:
            fixed['zh'].append(f'{key}: zh="{old_zh}"→"{correct_zh}"')

# ==================== 修复越南城市 en/vi 字段 ====================
for key, (correct_en, correct_vi) in VIETNAM_CITIES.items():
    if key in city_map:
        c = city_map[key]
        old_en = c['names'].get('en', '')
        old_vi = c['names'].get('vi', '')
        c['names']['en'] = correct_en
        c['names']['vi'] = correct_vi
        fixed['vi'].append(f'{key}: en="{old_en}"→"{correct_en}", vi="{old_vi}"→"{correct_vi}"')

# ==================== 输出修复报告 ====================
print('=== 修复报告 ===')
print(f'\n中文城市 en 字段修复 ({len(fixed["en"])}个):')
for s in fixed['en']:
    print(f'  {s}')

print(f'\n中文城市 zh 字段确认 ({len(fixed["zh"])}个):')
for s in fixed['zh']:
    print(f'  {s}')

print(f'\n越南城市 en/vi 字段修复 ({len(fixed["vi"])}个):')
for s in fixed['vi']:
    print(f'  {s}')

# ==================== 写文件 ====================
with open(CITIES_JSON, 'w') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f'\n✅ cities.json 已修复并保存！')

# ==================== 验证 ====================
print('\n=== 验证修复结果 ===')
for key in list(FIXED_CN_CITIES.keys())[:5]:
    if key in city_map:
        c = city_map[key]
        print(f"  {key}: en={c['names'].get('en','?')} | zh={c['names'].get('zh','?')}")
for key in list(VIETNAM_CITIES.keys())[:3]:
    if key in city_map:
        c = city_map[key]
        print(f"  {key}: en={c['names'].get('en','?')} | vi={c['names'].get('vi','?')}")
