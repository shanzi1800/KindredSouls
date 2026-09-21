#!/usr/bin/env python3
"""
KindredSouls 灵宠引擎 · 性格与外观映射算法 (L1 预留模块)
版本: V461-Familiar-Foundation
日期: 2026-09-21

设计原则:
  - 纯函数 (Pure Function): 无外部依赖、无 IO、无副作用
  - 算法算真值: 星盘 → 元素/星座 → 外观+性格，不靠 AI 编
  - 可单元测试: CI/CD 可直接断言
  - 复用现有引擎: 输入参数与 astro_matrix.py 输出格式对齐

军师指令: 预留骨架，审计通过后合入 astro/ 目录
"""

from typing import Dict, Any

# ═══════════════════════════════════════════════════════════════
# 星座 → 元素映射（与 astro_matrix.py SIGN_ELEMENTS 对齐）
# ═══════════════════════════════════════════════════════════════

SIGN_ELEMENTS = {
    'Aries': 'Fire', 'Leo': 'Fire', 'Sagittarius': 'Fire',
    'Taurus': 'Earth', 'Virgo': 'Earth', 'Capricorn': 'Earth',
    'Gemini': 'Air', 'Libra': 'Air', 'Aquarius': 'Air',
    'Cancer': 'Water', 'Scorpio': 'Water', 'Pisces': 'Water',
}

# ═══════════════════════════════════════════════════════════════
# 1. 外观映射层
# ═══════════════════════════════════════════════════════════════

# 太阳星座 → 主体晶石色 (HEX) + 色系名
CRYSTAL_COLOR_MAP = {
    'Fire':  {'color': '#FF5722', 'name': '红玛瑙'},      # 火象：熔岩橙红
    'Earth': {'color': '#8D6E63', 'name': '绿幽灵'},      # 土象：大地棕绿
    'Air':   {'color': '#29B6F6', 'name': '白水晶'},      # 风象：天青蓝
    'Water': {'color': '#7E57C2', 'name': '紫晶'},        # 水象：深海紫
}

# 月亮星座 → 眼睛颜色 (HEX) + 眼神气质描述
EYE_COLOR_MAP = {
    'Aries':       {'color': '#FFD700', 'desc': '锐利金眸'},
    'Taurus':      {'color': '#7CB342', 'desc': '温润翠绿'},
    'Gemini':      {'color': '#42A5F5', 'desc': '灵动异色瞳'},
    'Cancer':      {'color': '#B39DDB', 'desc': '柔和银灰'},
    'Leo':         {'color': '#FF8F00', 'desc': '威严琥珀'},
    'Virgo':       {'color': '#9CCC65', 'desc': '清澈橄榄'},
    'Libra':       {'color': '#EC407A', 'desc': '优雅粉晶'},
    'Scorpio':     {'color': '#5D4037', 'desc': '深沉黑曜'},
    'Sagittarius': {'color': '#FFB74D', 'desc': '自由铜黄'},
    'Capricorn':   {'color': '#37474F', 'desc': '沉静墨灰'},
    'Aquarius':    {'color': '#26C6DA', 'desc': '电光青蓝'},
    'Pisces':      {'color': '#80DEEA', 'desc': '朦胧雾蓝'},
}

# 上升星座 → 体型轮廓 + 耳/尾姿态
BODY_TYPE_MAP = {
    'Fire':  '昂扬立耳',    # 火象：挺拔、耳朵竖起、尾巴高举
    'Earth': '敦实盘坐',    # 土象：稳重、盘坐、耳朵半折
    'Air':   '轻盈悬空感',  # 风象：修长、耳朵微动、尾巴飘逸
    'Water': '舒展卧姿',    # 水象：放松、侧卧、耳朵贴头
}

# 四元素 → 表面质感
TEXTURE_MAP = {
    'Fire':  '熔岩孔纹',    # 火象：熔岩孔洞、温热触感
    'Earth': '磨砂哑光',    # 土象：磨砂、沉稳
    'Air':   '抛光玻感',    # 风象：抛光、清透
    'Water': '流纹透光',    # 水象：流纹、半透
}

# 元素 + 守护行星 → 内在图腾兽
TOTEM_MAP = {
    ('Fire', 'Mars'):     'flame_lion',     # 火星守火 → 狮
    ('Fire', 'Jupiter'):  'soaring_eagle',  # 木星守火 → 鹰
    ('Fire', 'Sun'):      'phoenix_ember',  # 太阳守火 → 凤
    ('Earth', 'Venus'):   'forest_deer',    # 金星守土 → 鹿
    ('Earth', 'Saturn'):  'mountain_bull',  # 土星守土 → 牛
    ('Earth', 'Mercury'): 'burrowing_fox',  # 水星守土 → 狐
    ('Air', 'Mercury'):   'silver_owl',     # 水星守风 → 鸮
    ('Air', 'Venus'):     'wind_butterfly', # 金星守风 → 蝶
    ('Air', 'Uranus'):    'storm_hawk',     # 天王守风 → 隼
    ('Water', 'Moon'):    'tide_turtle',    # 月亮守水 → 龟
    ('Water', 'Neptune'): 'deep_fish',      # 海王守水 → 鱼
    ('Water', 'Pluto'):   'abyss_serpent',  # 冥王守水 → 蛇
}

# 默认图腾（找不到组合时的兜底）
TOTEM_DEFAULT = {
    'Fire':  'flame_lion',
    'Earth': 'forest_deer',
    'Air':   'silver_owl',
    'Water': 'tide_turtle',
}


# ═══════════════════════════════════════════════════════════════
# 2. 性格向量算法层
# ═══════════════════════════════════════════════════════════════

# 各星座在 5 维上的基础分 (0-100)
# 维度: talkative(话痨) / clingy(黏人) / moody(情绪浓度) / sarcastic(毒舌) / healing(治愈)
SIGN_PERSONALITY_BASE = {
    'Aries':       {'talkative': 65, 'clingy': 30, 'moody': 50, 'sarcastic': 85, 'healing': 35},
    'Taurus':      {'talkative': 35, 'clingy': 55, 'moody': 40, 'sarcastic': 40, 'healing': 80},
    'Gemini':      {'talkative': 90, 'clingy': 35, 'moody': 45, 'sarcastic': 65, 'healing': 45},
    'Cancer':      {'talkative': 45, 'clingy': 85, 'moody': 80, 'sarcastic': 35, 'healing': 75},
    'Leo':         {'talkative': 75, 'clingy': 50, 'moody': 55, 'sarcastic': 60, 'healing': 50},
    'Virgo':       {'talkative': 40, 'clingy': 45, 'moody': 35, 'sarcastic': 70, 'healing': 65},
    'Libra':       {'talkative': 60, 'clingy': 65, 'moody': 50, 'sarcastic': 45, 'healing': 70},
    'Scorpio':     {'talkative': 35, 'clingy': 60, 'moody': 85, 'sarcastic': 90, 'healing': 55},
    'Sagittarius': {'talkative': 70, 'clingy': 25, 'moody': 40, 'sarcastic': 55, 'healing': 50},
    'Capricorn':   {'talkative': 30, 'clingy': 40, 'moody': 45, 'sarcastic': 65, 'healing': 70},
    'Aquarius':    {'talkative': 65, 'clingy': 20, 'moody': 35, 'sarcastic': 80, 'healing': 40},
    'Pisces':      {'talkative': 40, 'clingy': 70, 'moody': 75, 'sarcastic': 30, 'healing': 85},
}

# 元素修正值（加到对应维度上，可超 100 或低 0，最后 clamp）
ELEMENT_MODIFIER = {
    'Fire':  {'talkative': +5, 'clingy': -5, 'moody': 0,  'sarcastic': +5, 'healing': -5},
    'Earth': {'talkative': -5, 'clingy': +5, 'moody': -5, 'sarcastic': 0,  'healing': +10},
    'Air':   {'talkative': +10,'clingy': -5, 'moody': -5, 'sarcastic': +5, 'healing': 0},
    'Water': {'talkative': 0,  'clingy': +10,'moody': +10,'sarcastic': -5, 'healing': +5},
}

# 加权权重: 太阳 0.5 / 月亮 0.3 / 上升 0.2
WEIGHTS = {'sun': 0.5, 'moon': 0.3, 'asc': 0.2}

# 守护行星 → 元素（用于图腾推算的二次校验）
PLANET_ELEMENT = {
    'Sun': 'Fire', 'Moon': 'Water', 'Mercury': 'Air', 'Venus': 'Earth',
    'Mars': 'Fire', 'Jupiter': 'Fire', 'Saturn': 'Earth',
    'Uranus': 'Air', 'Neptune': 'Water', 'Pluto': 'Water',
}


def _clamp(value: int, lo: int = 0, hi: int = 100) -> int:
    """限制到 [lo, hi] 范围"""
    return max(lo, min(hi, value))


def _element_of(sign: str) -> str:
    """星座 → 元素"""
    return SIGN_ELEMENTS.get(sign, 'Fire')  # 兜底 Fire


def _ruling_planet(sign: str) -> str:
    """星座 → 守护行星（传统守护）"""
    RULING = {
        'Aries': 'Mars', 'Taurus': 'Venus', 'Gemini': 'Mercury',
        'Cancer': 'Moon', 'Leo': 'Sun', 'Virgo': 'Mercury',
        'Libra': 'Venus', 'Scorpio': 'Mars', 'Sagittarius': 'Jupiter',
        'Capricorn': 'Saturn', 'Aquarius': 'Saturn', 'Pisces': 'Jupiter',
    }
    return RULING.get(sign, 'Sun')


def _personality_vector(sun_sign: str, moon_sign: str, asc_sign: str) -> Dict[str, int]:
    """
    加权计算 5 维性格向量

    算法:
      base[dimension] = sun_base * 0.5 + moon_base * 0.3 + asc_base * 0.2
      result[dimension] = clamp(base + element_modifier[sun_element][dimension])

    其中 sun_base/moon_base/asc_base 取自 SIGN_PERSONALITY_BASE[星座][维度]
    元素修正取太阳星座的元素（太阳是核心身份）
    """
    sun_base = SIGN_PERSONALITY_BASE.get(sun_sign, SIGN_PERSONALITY_BASE['Leo'])
    moon_base = SIGN_PERSONALITY_BASE.get(moon_sign, SIGN_PERSONALITY_BASE['Cancer'])
    asc_base = SIGN_PERSONALITY_BASE.get(asc_sign, SIGN_PERSONALITY_BASE['Leo'])

    sun_element = _element_of(sun_sign)
    modifier = ELEMENT_MODIFIER.get(sun_element, ELEMENT_MODIFIER['Fire'])

    result = {}
    for dim in ['talkative', 'clingy', 'moody', 'sarcastic', 'healing']:
        weighted = (
            sun_base[dim] * WEIGHTS['sun'] +
            moon_base[dim] * WEIGHTS['moon'] +
            asc_base[dim] * WEIGHTS['asc']
        )
        result[dim] = _clamp(round(weighted + modifier[dim]))

    return result


def _appearance(sun_sign: str, moon_sign: str, asc_sign: str) -> Dict[str, str]:
    """
    星盘 → 外观属性

    - crystal_color: 太阳星座 → 元素 → 晶石色 (HEX)
    - eye_color: 月亮星座 → 眼睛颜色 (HEX)
    - body_type: 上升星座 → 元素 → 体型姿态
    - texture: 太阳星座 → 元素 → 表面质感
    - totem: 太阳元素 + 太阳守护行星 → 图腾兽
    """
    sun_element = _element_of(sun_sign)
    moon_element = _element_of(moon_sign)
    asc_element = _element_of(asc_sign)

    crystal = CRYSTAL_COLOR_MAP.get(sun_element, CRYSTAL_COLOR_MAP['Fire'])
    eye = EYE_COLOR_MAP.get(moon_sign, EYE_COLOR_MAP['Leo'])
    body = BODY_TYPE_MAP.get(asc_element, BODY_TYPE_MAP['Fire'])
    texture = TEXTURE_MAP.get(sun_element, TEXTURE_MAP['Fire'])

    ruling = _ruling_planet(sun_sign)
    totem = TOTEM_MAP.get((sun_element, ruling), TOTEM_DEFAULT.get(sun_element, 'flame_lion'))

    return {
        'crystal_color': crystal['color'],
        'crystal_name': crystal['name'],
        'eye_color': eye['color'],
        'eye_desc': eye['desc'],
        'body_type': body,
        'texture': texture,
        'totem': totem,
    }


def _generate_name(sun_sign: str, moon_sign: str) -> str:
    """
    星盘 → 灵宠默认名（用户可自定义覆盖）

    命名规则: 太阳星座 → 元素意象 + 月亮星座 → 情绪意象，拼成两个字
    """
    ELEMENT_NAME = {
        'Fire': ['炎', '焱', '炽', '煌', '烬'],
        'Earth': ['岩', '壤', '翠', '岳', '陶'],
        'Air': ['风', '飒', '岚', '吟', '羽'],
        'Water': ['汐', '渊', '澜', '潋', '泠'],
    }
    MOON_NAME = {
        'Aries': '锋', 'Taurus': '稳', 'Gemini': '灵', 'Cancer': '柔',
        'Leo': '曜', 'Virgo': '澈', 'Libra': '衡', 'Scorpio': '幽',
        'Sagittarius': '驰', 'Capricorn': '毅', 'Aquarius': '奇', 'Pisces': '渺',
    }

    sun_element = _element_of(sun_sign)
    names = ELEMENT_NAME.get(sun_element, ELEMENT_NAME['Fire'])
    moon_char = MOON_NAME.get(moon_sign, '灵')

    # 取元素列表第一个字 + 月亮字
    return names[0] + moon_char


# ═══════════════════════════════════════════════════════════════
# 3. 主入口函数
# ═══════════════════════════════════════════════════════════════

def calculate_familiar_profile(
    sun_sign: str,
    moon_sign: str,
    asc_sign: str,
    natal_hash: str = '',
    user_name: str = None,
) -> Dict[str, Any]:
    """
    基于太阳(0.5) / 月亮(0.3) / 上升(0.2) + 元素修正 计算灵宠完整 Profile

    纯函数: 无外部依赖、无 IO、无副作用
    可直接被 astro_matrix.py 或 server.js (通过 subprocess) 调用

    Args:
        sun_sign:  本命太阳星座 (英文, 如 'Scorpio')
        moon_sign: 本命月亮星座 (英文)
        asc_sign:  上升星座 (英文)
        natal_hash: 星盘数据 Hash (用于检测星盘变更)
        user_name:  用户自定义灵宠名 (None 则自动生成)

    Returns:
        完整灵宠 Profile dict, 字段与 familiar_profiles 表对齐

    Example:
        >>> calculate_familiar_profile('Scorpio', 'Pisces', 'Taurus')
        {
            'natal_hash': '',
            'species': 'crystal_cat',
            'crystal_color': '#7E57C2',
            'eye_color': '#80DEEA',
            'body_type': '敦实盘坐',
            'texture': '流纹透光',
            'totem': 'abyss_serpent',
            'personality': {'talkative': 37, 'clingy': 73, 'moody': 80, 'sarcastic': 52, 'healing': 75},
            'name': '渊渺',
            'name_source': 'auto'
        }
    """
    appearance = _appearance(sun_sign, moon_sign, asc_sign)
    personality = _personality_vector(sun_sign, moon_sign, asc_sign)
    name = user_name if user_name else _generate_name(sun_sign, moon_sign)

    return {
        'natal_hash': natal_hash,
        'species': 'crystal_cat',
        'crystal_color': appearance['crystal_color'],
        'crystal_name': appearance['crystal_name'],
        'eye_color': appearance['eye_color'],
        'eye_desc': appearance['eye_desc'],
        'body_type': appearance['body_type'],
        'texture': appearance['texture'],
        'totem': appearance['totem'],
        'personality': personality,
        'name': name,
        'name_source': 'custom' if user_name else 'auto',
    }


# ═══════════════════════════════════════════════════════════════
# 4. 自测入口 (python3 astro/familiar_engine.py)
# ═══════════════════════════════════════════════════════════════

if __name__ == '__main__':
    # 示例1: 太阳天蝎 · 月亮双鱼 · 上升金牛 (L1 草案示例)
    p1 = calculate_familiar_profile('Scorpio', 'Pisces', 'Taurus')
    print("=== 示例1: Sun=Scorpio, Moon=Pisces, Asc=Taurus ===")
    for k, v in p1.items():
        print(f"  {k}: {v}")

    # 示例2: 太阳狮子 · 月亮白羊 · 上升双子
    p2 = calculate_familiar_profile('Leo', 'Aries', 'Gemini')
    print("\n=== 示例2: Sun=Leo, Moon=Aries, Asc=Gemini ===")
    for k, v in p2.items():
        print(f"  {k}: {v}")

    # 示例3: 太阳水瓶 · 月亮天秤 · 上升射手
    p3 = calculate_familiar_profile('Aquarius', 'Libra', 'Sagittarius')
    print("\n=== 示例3: Sun=Aquarius, Moon=Libra, Asc=Sagittarius ===")
    for k, v in p3.items():
        print(f"  {k}: {v}")

    # 幂等性验证: 同输入同输出
    assert p1 == calculate_familiar_profile('Scorpio', 'Pisces', 'Taurus'), "幂等性失败"
    print("\n✅ 幂等性验证通过")

    # 边界验证: 未知星座不崩
    p4 = calculate_familiar_profile('Unknown', 'Unknown', 'Unknown')
    print(f"\n=== 边界验证: 未知星座 (不崩) ===")
    print(f"  species: {p4['species']}, name: {p4['name']}")
    assert p4['species'] == 'crystal_cat', "兜底失败"
    print("✅ 边界验证通过")
