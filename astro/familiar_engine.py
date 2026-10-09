#!/usr/bin/env python3
"""
KindredSouls 灵宠引擎 · 性格与外观映射算法
版本: V461-Familiar-Foundation → E34-Familiar-B1（关系层）
日期: 2026-09-21 立 / 2026-10-09 E34-B1 扩展

设计原则:
  - 纯函数 (Pure Function): 无外部依赖、无 IO、无副作用
  - 算法算真值: 星盘 → 元素/星座 → 外观+性格，不靠 AI 编
  - 可单元测试: CI/CD 可直接断言
  - 复用现有引擎: 输入参数与 astro_matrix.py 输出格式对齐

E34-B1 变更（2026-10-09 军师开工令）:
  1. 新增关系层 relation_mode（四象陪伴人格）。🔴 全站只有 2 个 IP 角色名
     （Milo / Sophia），relation_mode 只决定「呈现为哪一重人格」；
     ⚠️ 刻意不采集用户性别 —— 由用户直接选关系（军师裁决「方案 b」）。
  2. 「元素意象 + 月亮意象」两字名规则随 2-IP 定位**作废**：默认名改由所选 IP
     决定（Sophia / Milo）。_generate_name() 保留为备用（星盘小名），不再作默认。
  3. 无出生时间盘（time_uncertain=True）⇒ 上升不可信 ⇒ body_type / texture
     **显式降级**为 'standard' 并记入 degraded；严禁伪造上升出盘（V490b / V492-D2）。
  4. 防伪造：未知星座不再静默兜底 Fire / Leo。缺真值 ⇒ 显式降级或抛错。
  5. 配色层 resolve_familiar_palette()：relation_mode ⇒ skinId + 主/辅色；
     transit（行运）**预留挂点**，后续按用户时间星盘决定颜色，前端无需改码。
"""

from typing import Dict, Any, List, Optional

# ═══════════════════════════════════════════════════════════════
# 星座 → 元素映射（与 astro_matrix.py SIGN_ELEMENTS 逐项一致，禁漂移）
# ═══════════════════════════════════════════════════════════════

SIGN_ELEMENTS = {
    'Aries': 'Fire', 'Leo': 'Fire', 'Sagittarius': 'Fire',
    'Taurus': 'Earth', 'Virgo': 'Earth', 'Capricorn': 'Earth',
    'Gemini': 'Air', 'Libra': 'Air', 'Aquarius': 'Air',
    'Cancer': 'Water', 'Scorpio': 'Water', 'Pisces': 'Water',
}

# 五维性格维度（唯一真源）
PERSONALITY_DIMS = ['talkative', 'clingy', 'moody', 'sarcastic', 'healing']

# 真值缺失时的中性占位（**显式降级**，绝不伪装成某个星座的真实值）
DEGRADED_COLOR = '#808080'    # 中性灰
DEGRADED_TOKEN = 'standard'   # 降级形态标记（外观层）
DEGRADED_UNKNOWN = 'unknown'  # 降级图腾/名称标记

# ═══════════════════════════════════════════════════════════════
# Soul OS 开放协议（E35）· 契约版本
#   🔴 与缓存版本 vNNN 是**两条独立版本线**，勿混用。
#   三侧同源：本常量 ↔ server.js::SOUL_OS_PROTOCOL_VERSION ↔ docs/SOUL_OS_OPEN_SPEC.md
#   依据：军师《Soul OS 具身智能与社交生态协议底座开工令》2026-10-09
# ═══════════════════════════════════════════════════════════════
SOUL_OS_PROTOCOL_VERSION = '1.0'


# ═══════════════════════════════════════════════════════════════
# 0. 关系层（E34-B1）· 2 个 IP × 2 种关系 = 4 重人格
# ═══════════════════════════════════════════════════════════════

# 🔴 唯一真源：四象人格。SQL CHECK 约束与前端选项必须与此四值**同源**。
#    viewer 字段仅说明「该人格面向哪一类用户」，属**派生元数据**，
#    ⚠️ 不代表也不依赖任何用户性别采集（军师裁决：由用户直接选关系）。
RELATION_MODES = {
    'girlfriend': {
        'pet_name': 'Sophia',
        'persona_zh': '善良女友 · 柔情治愈 · 善解人意',
        'persona_en': 'Devoted Girlfriend - tender, healing, understanding',
        'viewer': 'male',
    },
    'buddy': {
        'pet_name': 'Milo',
        'persona_zh': '铁哥们儿 · 阳光义气',
        'persona_en': 'Loyal Buddy - sunny, upright, candid',
        'viewer': 'male',
    },
    'bestie': {
        'pet_name': 'Sophia',
        'persona_zh': '闺蜜 · 灵动通透',
        'persona_en': 'Bestie - lively, perceptive',
        'viewer': 'female',
    },
    'boyfriend': {
        'pet_name': 'Milo',
        'persona_zh': '帅气男友 · 专一偏爱 · 温暖宠爱',
        'persona_en': 'Devoted Boyfriend - exclusive, protective, warm',
        'viewer': 'female',
    },
}

# 关系层调色板：relation_mode → Spine skinId + 主色/辅色
#   🔴 每个 IP 两套配色（Milo：buddy / boyfriend；Sophia：girlfriend / bestie）
#   Spine skin swap 换贴图即可实现 ⇒ 美术资产仍只需 2 套骨架。
RELATION_PALETTE = {
    'girlfriend': {'skin': 'sophia_girlfriend', 'primary': '#F4B8CE', 'secondary': '#E8C79A',
                   'label_zh': '樱花粉 · 暮光玫瑰金'},
    'bestie':     {'skin': 'sophia_bestie',     'primary': '#9FE1CB', 'secondary': '#F4C0D1',
                   'label_zh': '薄荷绿 · 蜜桃粉'},
    'buddy':      {'skin': 'milo_buddy',        'primary': '#D9A441', 'secondary': '#4FA8E0',
                   'label_zh': '深海琥珀金 · 电光蓝'},
    'boyfriend':  {'skin': 'milo_boyfriend',    'primary': '#2B2F3A', 'secondary': '#D4AF37',
                   'label_zh': '曜石黑 · 香槟金'},
}


def resolve_familiar_palette(
    relation_mode: str,
    sun_sign: Optional[str] = None,
    transit: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    解析灵宠调色板（两层结构）。

    第一层（本期实现）: relation_mode → Spine skinId + 主色/辅色（每 IP 两套）
    第二层（**挂点预留**）: 星盘参与调色 —— 按本命元素微调色相、按行运相位调
        明度/饱和度。军师令：「接口要预留，后面根据用户的时间星盘来确认她选择的
        灵宠对应的颜色」。前端只消费 skin / primary / secondary / label 四个键，
        故第二层落地时**不需要前端改码**。

    Args:
        relation_mode: 四象人格之一（girlfriend | buddy | bestie | boyfriend）
        sun_sign:      本命太阳星座（第二层输入，本期不参与运算）
        transit:       行运盘数据（第二层输入，本期为 None）

    Returns:
        {skin, primary, secondary, label, label_zh, source}
        source: 本期恒为 'relation'；第二层落地后可能出现 'natal' / 'natal+transit'
    """
    base = RELATION_PALETTE.get(relation_mode)
    if not base:
        raise ValueError(
            f'familiar_engine: 未知 relation_mode={relation_mode!r}'
            f'（允许值：{sorted(RELATION_PALETTE)}）'
        )

    out: Dict[str, Any] = {
        'skin': base['skin'],
        'primary': base['primary'],
        'secondary': base['secondary'],
        'label': base['label_zh'],
        'label_zh': base['label_zh'],
        'source': 'relation',
    }

    # ── 第二层挂点（E35+）：行运色调层 ───────────────────────────────
    #   落地条件：接入 astroMatrix 的 transit 相位后，在此按相性调整
    #   out['primary'] 的色相/饱和度，并把 out['source'] 置为 'natal+transit'。
    #   本期刻意不实现 —— 无真值时绝不编造偏移（防伪造铁律）。
    if transit:
        out['source'] = 'relation'

    return out


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

# 默认图腾（仅用于**已知元素**但组合缺项时的兜底，绝不用于未知元素）
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


def _norm_sign(sign: str) -> Optional[str]:
    """星座名归一化（容忍首字母大小写差异）；非字符串/空值返回 None。"""
    if not sign or not isinstance(sign, str):
        return None
    s = sign.strip()
    if not s:
        return None
    return s[0].upper() + s[1:].lower() if s.islower() or s.isupper() else s


def _element_of(sign: str) -> Optional[str]:
    """
    星座 → 元素。

    🔴 E34-B1：**不再兜底 'Fire'** —— 未知星座一律返回 None，由调用方显式降级。
       依据项目铁律「真值缺失显示 ?，绝不静默伪造」（V492/D2）。
    """
    s = _norm_sign(sign)
    if s is None:
        return None
    return SIGN_ELEMENTS.get(s)


def _ruling_planet(sign: str) -> Optional[str]:
    """星座 → 守护行星（传统守护）。未知星座返回 None（不兜底 Sun）。"""
    RULING = {
        'Aries': 'Mars', 'Taurus': 'Venus', 'Gemini': 'Mercury',
        'Cancer': 'Moon', 'Leo': 'Sun', 'Virgo': 'Mercury',
        'Libra': 'Venus', 'Scorpio': 'Mars', 'Sagittarius': 'Jupiter',
        'Capricorn': 'Saturn', 'Aquarius': 'Saturn', 'Pisces': 'Jupiter',
    }
    s = _norm_sign(sign)
    if s is None:
        return None
    return RULING.get(s)


def _personality_vector(sun_sign: str, moon_sign: str, asc_sign: str) -> Dict[str, int]:
    """
    加权计算 5 维性格向量

    算法（三要素齐全时与 V461 逐字一致，保证零回归）:
      base[dimension] = sun_base * 0.5 + moon_base * 0.3 + asc_base * 0.2
      result[dimension] = clamp(base + element_modifier[sun_element][dimension])

    🔴 E34-B1 防伪造：
      - 未知星座**不参与**加权，其余已知星座按权重**重新归一化**；
      - 太阳元素未知 ⇒ 不加元素修正（而非套用 Fire 的修正值）；
      - 三要素全部未知 ⇒ **抛错**，拒绝生成（绝不静默伪造）。
    """
    _b = SIGN_PERSONALITY_BASE
    _known = [(sun_sign, WEIGHTS['sun']), (moon_sign, WEIGHTS['moon']), (asc_sign, WEIGHTS['asc'])]
    _usable = [(s, w) for s, w in _known if s in _b]

    if not _usable:
        raise ValueError(
            'familiar_engine: 日/月/升三要素全部缺失真值，拒绝生成灵宠档案'
            '（绝不静默伪造 —— 见 V490b / V492-D2）'
        )

    _mod = ELEMENT_MODIFIER.get(_element_of(sun_sign), {})
    result: Dict[str, int] = {}

    for dim in PERSONALITY_DIMS:
        if len(_usable) == 3:
            # 与 V461 原式逐字一致（正常路径零回归）
            weighted = (
                _b[sun_sign][dim] * WEIGHTS['sun'] +
                _b[moon_sign][dim] * WEIGHTS['moon'] +
                _b[asc_sign][dim] * WEIGHTS['asc']
            )
        else:
            _tot = sum(w for _, w in _usable) or 1.0
            weighted = sum(_b[s][dim] * w for s, w in _usable) / _tot
        result[dim] = _clamp(round(weighted + _mod.get(dim, 0)))

    return result


def _appearance(sun_sign: str, moon_sign: str, asc_sign: str, time_uncertain: bool = False) -> Dict[str, Any]:
    """
    星盘 → 外观属性（E34-B1：真值缺失一律**显式降级**）

    - crystal_color: 太阳星座 → 元素 → 晶石色 (HEX)
    - eye_color:     月亮星座 → 眼睛颜色 (HEX)
    - body_type:     上升星座 → 元素 → 体型姿态
    - texture:       太阳星座 → 元素 → 表面质感
    - totem:         太阳元素 + 太阳守护行星 → 图腾兽

    🔴 降级规则（军师 E34-B1 裁决）：
      1. time_uncertain=True ⇒ 上升不可信 ⇒ body_type 与 texture **显式降级**
         为 'standard'。（texture 本由太阳元素决定，此处随上升一并降级，
         以保持「形态 + 质感」外观层的一致性。）
      2. 任一星座未知 ⇒ 对应字段降级并记入 degraded 列表，**绝不伪造具体值**。

    Returns:
        {crystal_color, crystal_name, eye_color, eye_desc, body_type,
         texture, totem, degraded: [...]}
    """
    degraded: List[str] = []

    sun_el = _element_of(sun_sign)
    asc_el = _element_of(asc_sign)

    # ── 主体晶石色（太阳）──
    if sun_el:
        crystal = CRYSTAL_COLOR_MAP.get(sun_el, {})
        crystal_color = crystal.get('color', DEGRADED_COLOR)
        crystal_name = crystal.get('name', DEGRADED_UNKNOWN)
    else:
        crystal_color, crystal_name = DEGRADED_COLOR, DEGRADED_UNKNOWN
        degraded.append('crystal_color')

    # ── 眼睛颜色（月亮）──
    _eye = EYE_COLOR_MAP.get(_norm_sign(moon_sign))
    if _eye:
        eye_color, eye_desc = _eye['color'], _eye['desc']
    else:
        eye_color, eye_desc = DEGRADED_COLOR, DEGRADED_UNKNOWN
        degraded.append('eye_color')

    # ── 体型姿态（上升）· 无时间盘 ⇒ 强制降级 ──
    if time_uncertain:
        body_type = DEGRADED_TOKEN
        degraded.append('body_type')
        degraded.append('time_uncertain')
    elif asc_el:
        body_type = BODY_TYPE_MAP.get(asc_el, DEGRADED_TOKEN)
    else:
        body_type = DEGRADED_TOKEN
        degraded.append('body_type')

    # ── 表面质感（太阳）· 与上升同批降级 ──
    if time_uncertain:
        texture = DEGRADED_TOKEN
        degraded.append('texture')
    elif sun_el:
        texture = TEXTURE_MAP.get(sun_el, DEGRADED_TOKEN)
    else:
        texture = DEGRADED_TOKEN
        degraded.append('texture')

    # ── 内在图腾兽（元素 + 守护行星）──
    if sun_el:
        ruling = _ruling_planet(sun_sign)
        if ruling and (sun_el, ruling) in TOTEM_MAP:
            totem = TOTEM_MAP[(sun_el, ruling)]
        else:
            totem = TOTEM_DEFAULT.get(sun_el, DEGRADED_UNKNOWN)
    else:
        totem = DEGRADED_UNKNOWN
        degraded.append('totem')

    return {
        'crystal_color': crystal_color,
        'crystal_name': crystal_name,
        'eye_color': eye_color,
        'eye_desc': eye_desc,
        'body_type': body_type,
        'texture': texture,
        'totem': totem,
        'degraded': sorted(set(degraded)),
    }


def _generate_name(sun_sign: str, moon_sign: str) -> str:
    """
    星盘 → 灵宠「小名」（元素意象 + 月亮情绪意象，两字）

    ⚠️ E34-B1：本规则随「2 个 IP 名（Milo / Sophia）」定位**已不作默认**。
       默认名改由 relation_mode 决定（见 calculate_familiar_profile）。
       本函数保留为可选彩蛋 / 备用（如未来开放"星盘小名"），缺真值时返回 '?'。
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

    sun_el = _element_of(sun_sign)
    names = ELEMENT_NAME.get(sun_el) if sun_el else None
    moon_char = MOON_NAME.get(_norm_sign(moon_sign))

    if not names or not moon_char:
        return '?'   # 真值缺失 ⇒ 显式未知，不伪造
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
    relation_mode: str = 'girlfriend',
    time_uncertain: bool = False,
) -> Dict[str, Any]:
    """
    基于太阳(0.5) / 月亮(0.3) / 上升(0.2) + 元素修正 计算灵宠完整 Profile

    纯函数: 无外部依赖、无 IO、无副作用
    可直接被 astro_matrix.py 或 server.js (子进程 / 内部调用) 使用

    Args:
        sun_sign:       本命太阳星座 (英文, 如 'Scorpio')
        moon_sign:      本命月亮星座 (英文)
        asc_sign:       上升星座 (英文)
        natal_hash:     星盘数据 Hash (用于检测星盘变更)
        user_name:      用户自定义灵宠名 (None 则用所选 IP 的默认名)
        relation_mode:  四象人格之一（E34-B1 新增）
        time_uncertain: 无精准出生时间 ⇒ 上升不可信（E34-B1 新增）

    Returns:
        完整灵宠 Profile dict, 字段与 familiar_profiles 表对齐。
        额外含 relation（人格 + 调色板）与 degraded（降级字段清单）。
    """
    if relation_mode not in RELATION_MODES:
        raise ValueError(
            f'familiar_engine: 未知 relation_mode={relation_mode!r}'
            f'（允许值：{sorted(RELATION_MODES)}）'
        )

    rel = RELATION_MODES[relation_mode]
    appearance = _appearance(sun_sign, moon_sign, asc_sign, time_uncertain=time_uncertain)
    personality = _personality_vector(sun_sign, moon_sign, asc_sign)
    # 调色板单一真源：relation.palette 与 display_palette 必须**同源**
    #   （只调一次 ⇒ 杜绝两处参数漂移；闸门 audit-e35 B 组逐值断言二者一致）
    palette = resolve_familiar_palette(relation_mode, sun_sign=sun_sign)

    # 🔴 E34-B1：全站只有 2 个 IP 名 ⇒ 默认名由所选 IP 决定
    #   （原「元素意象 + 月亮意象」两字名随 2-IP 定位作废）
    name = user_name if user_name else rel['pet_name']

    return {
        'natal_hash': natal_hash,
        'species': 'crystal_cat',
        'relation_mode': relation_mode,
        'time_uncertain': bool(time_uncertain),
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
        'relation': {
            'mode': relation_mode,
            'pet_name': rel['pet_name'],
            'persona_zh': rel['persona_zh'],
            'persona_en': rel['persona_en'],
            'palette': palette,
        },
        'degraded': appearance['degraded'],

        # ── 灵魂记忆层（E34-B1 骨架预留）──────────────────────────────
        #   本期**恒为出厂值**，不写入、不开放 API。
        #   第 2 层 memory_summary：由异步萃取器在对话结束后回填（服务端不受理前端传入，
        #     否则等于把「用户画像」交给客户端伪造 —— 与 fail-closed 纪律同源）。
        #   🔴 关键：这里给的是**出厂默认值**，落库时用 COALESCE/忽略，绝不覆盖既有记忆。
        'memory_summary': {},
        'intimacy_level': 1,
        'last_interaction_at': None,

        # ── E35 Soul OS 开放协议预留槽（**设备中立** · 本期全 inert）──────────
        #   依据：军师 2026-10-09《Soul OS 具身智能与社交生态协议底座开工令》。
        #   出参统一预留三槽 + 契约版本 ⇒ 未来机器人 / 智能座舱读取标准槽位，零改接口。
        #   北极星文档：docs/SOUL_OS_OPEN_SPEC.md §4.2
        #   🔴 本期三槽均为 inert：motion_intent 由 LLM + 情绪层产码（未实现）；
        #      emotion_state 恒 'neutral'；display_palette 是 palette 的规范化别名。
        #   🔴 display_palette 与 relation.palette **同源**（同一 palette 变量，闸门 B 逐值断言）。
        'motion_intent': None,
        'emotion_state': 'neutral',
        'display_palette': {
            'skin': palette['skin'],
            'primary': palette['primary'],
            'secondary': palette['secondary'],
        },
        'schema_version': SOUL_OS_PROTOCOL_VERSION,
    }


# ═══════════════════════════════════════════════════════════════
# 4. CLI 入口（供 Node 侧 execSync 调用 · 形态对齐 astro_matrix.py）
#    🔴 这是**生产实际通路**：v69_client.js::getFamiliarProfile()
#       → execSync('python3 astro/familiar_engine.py --mode profile ...')
#    退出码约定（与 astro_matrix.py 的 V490/V490b 同构，绝不静默失败）：
#       0 = 成功（stdout 为单行 JSON）
#       2 = 输入非法（未知 relation_mode / 三要素全缺失）→ stderr 含 FAMILIAR_INVALID_INPUT
#       1 = 引擎内部故障 → stderr 含 FAMILIAR_ENGINE_FAILURE
# ═══════════════════════════════════════════════════════════════

def _cli(argv: Optional[List[str]] = None) -> int:
    import argparse
    import json
    import sys

    parser = argparse.ArgumentParser(description='KindredSouls Familiar Engine (E34-B1)')
    parser.add_argument('--mode', default='profile', choices=['profile'],
                        help='计算模式（本期仅 profile）')
    parser.add_argument('--sun', default=None, help='本命太阳星座（英文, 如 Scorpio）')
    parser.add_argument('--moon', default=None, help='本命月亮星座（英文）')
    parser.add_argument('--asc', default=None, help='上升星座（英文）')
    parser.add_argument('--relation-mode', dest='relation_mode', default='girlfriend',
                        help='四象人格: girlfriend | buddy | bestie | boyfriend')
    parser.add_argument('--time-uncertain', dest='time_uncertain', action='store_true',
                        help='无精准出生时间 ⇒ 上升不可信 ⇒ 外观层显式降级')
    parser.add_argument('--natal-hash', dest='natal_hash', default='',
                        help='星盘快照 Hash（用于检测改生日需重孵）')
    parser.add_argument('--user-name', dest='user_name', default=None,
                        help='用户自定义灵宠名（缺省用所选 IP 默认名）')
    args = parser.parse_args(argv)

    try:
        profile = calculate_familiar_profile(
            args.sun, args.moon, args.asc,
            natal_hash=args.natal_hash,
            user_name=args.user_name,
            relation_mode=args.relation_mode,
            time_uncertain=args.time_uncertain,
        )
    except ValueError as e:
        # 输入非法：未知 relation_mode / 三要素全缺失 —— 绝不返回伪档案
        print(f'FAMILIAR_INVALID_INPUT: {e}', file=sys.stderr)
        return 2
    except Exception as e:  # pragma: no cover - 防御性
        print(f'FAMILIAR_ENGINE_FAILURE: {e}', file=sys.stderr)
        return 1

    # 单行 JSON（ensure_ascii=False 保留中文外观值，Node 侧 JSON.parse 直接吃）
    print(json.dumps(profile, ensure_ascii=False))
    return 0


# ═══════════════════════════════════════════════════════════════
# 5. 自测入口 (python3 astro/familiar_engine.py，无参数时)
# ═══════════════════════════════════════════════════════════════

if __name__ == '__main__':
    import sys as _sys
    if len(_sys.argv) > 1:
        _sys.exit(_cli())

    # ── L1 回归：3 个既有示例（外观/性格值必须与 V461 逐值一致）──
    p1 = calculate_familiar_profile('Scorpio', 'Pisces', 'Taurus')
    print("=== 示例1: Sun=Scorpio, Moon=Pisces, Asc=Taurus ===")
    for k, v in p1.items():
        print(f"  {k}: {v}")

    p2 = calculate_familiar_profile('Leo', 'Aries', 'Gemini')
    print("\n=== 示例2: Sun=Leo, Moon=Aries, Asc=Gemini ===")
    print(f"  crystal_color: {p2['crystal_color']}, eye_color: {p2['eye_color']}")
    print(f"  body_type: {p2['body_type']}, texture: {p2['texture']}, totem: {p2['totem']}")
    print(f"  personality: {p2['personality']}")

    p3 = calculate_familiar_profile('Aquarius', 'Libra', 'Sagittarius')
    print("\n=== 示例3: Sun=Aquarius, Moon=Libra, Asc=Sagittarius ===")
    print(f"  crystal_color: {p3['crystal_color']}, eye_color: {p3['eye_color']}")
    print(f"  personality: {p3['personality']}")

    # ── 幂等性 ──
    assert p1 == calculate_familiar_profile('Scorpio', 'Pisces', 'Taurus'), "幂等性失败"
    print("\n幂等性验证通过")

    # ── L1 外观/性格值回归锚 ──────────────────────────────────────────
    #   🔴 锚值一律取自 HEAD 实算（E34-A 双版本逐值 diff：6/6 PASS）。
    #   ⚠️ 注意：V461 版 docstring 的 Example 里那组
    #      personality 37/73/80/52/75 + totem 'abyss_serpent' + name '渊渺'
    #      是**手写示意，与真实输出不符**；真实值为下方锚定值。
    #      （docs/familiar_L1_data_structure_audit.md §3.4 的「毒舌57/情绪83/治愈74/龟图腾」
    #        才是对的。）禁止用文档示意值当断言锚。
    assert p1['crystal_color'] == '#7E57C2' and p1['eye_color'] == '#80DEEA', "示例1 外观回归失败"
    assert p1['body_type'] == '敦实盘坐' and p1['texture'] == '流纹透光', "示例1 形态回归失败"
    assert p1['totem'] == 'tide_turtle', "示例1 图腾回归失败"
    assert p1['personality'] == {'talkative': 36, 'clingy': 72, 'moody': 83, 'sarcastic': 57, 'healing': 74}, \
        f"示例1 性格回归失败: {p1['personality']}"
    assert p2['personality'] == {'talkative': 80, 'clingy': 36, 'moody': 52, 'sarcastic': 74, 'healing': 40}, \
        f"示例2 性格回归失败: {p2['personality']}"
    assert p2['crystal_color'] == '#FF5722' and p2['totem'] == 'phoenix_ember', "示例2 外观回归失败"
    assert p3['personality'] == {'talkative': 74, 'clingy': 30, 'moody': 36, 'sarcastic': 70, 'healing': 51}, \
        f"示例3 性格回归失败: {p3['personality']}"
    assert p3['crystal_color'] == '#29B6F6' and p3['totem'] == 'silver_owl', "示例3 外观回归失败"
    print("L1 外观/性格回归锚验证通过（3 例，实算锚）")

    # ── E34-B1：四象人格（2 个 IP × 2 关系）──
    print("\n=== E34-B1 四象人格 ===")
    IP_OF = {'girlfriend': 'Sophia', 'buddy': 'Milo', 'bestie': 'Sophia', 'boyfriend': 'Milo'}
    for mode, expect_ip in IP_OF.items():
        pr = calculate_familiar_profile('Scorpio', 'Pisces', 'Taurus', relation_mode=mode)
        assert pr['name'] == expect_ip, f"{mode} 默认名应为 {expect_ip}, 实得 {pr['name']}"
        assert pr['relation_mode'] == mode
        assert pr['relation']['palette']['skin'].startswith(expect_ip.lower()), f"{mode} skin 前缀错"
        print(f"  {mode:11s} -> {pr['name']:6s} | {pr['relation']['persona_zh']}")
    assert len({v['pet_name'] for v in RELATION_MODES.values()}) == 2, "IP 名必须恰好 2 个"
    for banned in ('Eros', 'Kael', 'Chloe', 'Maya'):
        assert banned not in str(RELATION_MODES), f"不应存在第三/第四角色名: {banned}"
    print("四象人格验证通过（恰好 2 个 IP 名；无 Eros/Kael/Chloe/Maya）")

    # ── 配色：每 IP 两套 ──
    pal_gf = resolve_familiar_palette('girlfriend')['primary']
    pal_be = resolve_familiar_palette('bestie')['primary']
    pal_bu = resolve_familiar_palette('buddy')['primary']
    pal_bf = resolve_familiar_palette('boyfriend')['primary']
    assert pal_gf != pal_be, "Sophia 两种人格必须不同配色"
    assert pal_bu != pal_bf, "Milo 两种人格必须不同配色"
    assert resolve_familiar_palette('girlfriend')['source'] == 'relation'
    print("配色验证通过（Sophia 2 套 / Milo 2 套；source=relation，transit 层已预留）")

    # ── 无出生时间盘：上升降级（军师 E34-B1 裁决）──
    print("\n=== 无出生时间盘（time_uncertain=True）===")
    pt = calculate_familiar_profile('Scorpio', 'Pisces', 'Taurus', time_uncertain=True)
    assert pt['time_uncertain'] is True
    assert pt['body_type'] == 'standard', f"body_type 应降级为 standard, 实得 {pt['body_type']}"
    assert pt['texture'] == 'standard', f"texture 应降级为 standard, 实得 {pt['texture']}"
    assert 'time_uncertain' in pt['degraded'] and 'body_type' in pt['degraded'], "degraded 未记录降级项"
    assert pt['crystal_color'] == p1['crystal_color'], "太阳可信 ⇒ 晶石色不应降级"
    print(f"  降级项: {pt['degraded']}")
    print("上升降级验证通过（body_type/texture=standard，太阳系字段不受影响）")

    # ── 防伪造：未知星座不得静默兜底 Fire / Leo ──
    print("\n=== 防伪造（未知星座）===")

    # 档1：仅太阳未知（月/升已知）⇒ 晶石色降级为中性灰，性格按已知两要素归一化
    pu1 = calculate_familiar_profile('Unknown', 'Pisces', 'Taurus', relation_mode='girlfriend')
    assert pu1['crystal_color'] == DEGRADED_COLOR, "未知太阳 ⇒ 必须是中性占位灰"
    assert pu1['crystal_color'] != '#FF5722', "不得兜底为 Fire 红玛瑙色"
    assert pu1['totem'] == DEGRADED_UNKNOWN, "未知太阳元素 ⇒ 图腾必须 unknown"
    assert 'crystal_color' in pu1['degraded'] and 'totem' in pu1['degraded']
    assert pu1['eye_color'] == '#80DEEA', "月亮已知 ⇒ 瞳色不应降级"
    assert pu1['body_type'] == '敦实盘坐', "上升已知 ⇒ 体型不应降级"
    print(f"  仅太阳未知: crystal={pu1['crystal_color']} totem={pu1['totem']} "
          f"personality={pu1['personality']} degraded={pu1['degraded']}")

    # 档2：月/升未知（太阳已知）⇒ 瞳色与体型降级；晶石色与质感保持真值
    pu2 = calculate_familiar_profile('Scorpio', 'Unknown', 'Unknown', relation_mode='girlfriend')
    assert pu2['crystal_color'] == '#7E57C2', "太阳已知 ⇒ 晶石色必须保持真值"
    assert pu2['eye_color'] == DEGRADED_COLOR, "未知月亮 ⇒ 瞳色必须是中性占位灰"
    assert pu2['body_type'] == DEGRADED_TOKEN, "未知上升 ⇒ 体型必须 standard"
    assert pu2['texture'] == '流纹透光', "质感由太阳元素决定 ⇒ 太阳已知时必须保持真值"
    assert set(pu2['degraded']) >= {'eye_color', 'body_type'}, \
        f"未知月/升必须记入 degraded: {pu2['degraded']}"
    assert 'texture' not in pu2['degraded'], "太阳已知 ⇒ texture 不应记入 degraded"
    print(f"  月升未知: eye={pu2['eye_color']} body={pu2['body_type']} "
          f"texture={pu2['texture']} degraded={pu2['degraded']}")

    # 档3：三要素全缺失 ⇒ **必须抛错**，绝不伪造一份 Leo/Cancer 档案
    try:
        calculate_familiar_profile('Unknown', 'Unknown', 'Unknown')
        raise AssertionError("三要素全缺失时必须抛 ValueError，不得伪造")
    except ValueError as e:
        print(f"  三要素全缺失 → 正确抛错: {str(e)[:44]}...")
    print("防伪造验证通过（三档：部分降级 / 部分降级 / 全缺失抛错）")

    # ── 非法 relation_mode ⇒ 必须抛错 ──
    try:
        calculate_familiar_profile('Scorpio', 'Pisces', 'Taurus', relation_mode='pet')
        raise AssertionError("非法 relation_mode 必须抛 ValueError")
    except ValueError:
        print("\n非法 relation_mode 正确抛错")

    print("\n全部自测通过（E34-Familiar-B1）")
