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

from typing import Dict, Any, List, Optional, Tuple

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


# ═══════════════════════════════════════════════════════════════
# 0b. 四象决策算子（E36 立 · E38-A 精准化）
#     · 专利级「真值驱动决策（Reverse Synergy）」唯一真源
#   依据一：军师《Soul OS 具身决策与 Agent 执行中枢预留战备号令》2026-10-09
#          （主公圣旨：用户的信任只给懂他命运的灵魂 —— 巨头做「手脚」，我们做「脑核」）
#   依据二：军师《E38 合婚双盘真值与反向合盘实体化》开工令 2026-10-09（三裁全准）
#
#   🔴 唯一真源纪律：本表是全仓**唯一**一份四象算子权重表。
#      embodied/core/intent_translator.js 及任何前端 **只读消费**，严禁复制第二份
#      （复制 = 漂移 = 专利实施例证据链被污染）。
#   🔴 本表决定「反向相位拟合」时抬高哪些因子的权重：
#        女友   → 金/火/月 + 7/5 宫（吸引、恋爱激情与情感互补）
#        哥们儿 → 日/火   + 11/3 宫（同频义气与事业共振）
#        男友   → 日/木/金 + 7/5 宫（庇护偏爱与安全感）
#        闺蜜   → 水/月   + 3/11 宫（敏锐共鸣与情绪解压）
#   🔴 E38-A 军师裁决（D1 / D2 / D3 三处对账差异，全部采纳并闭合）：
#        D1 girlfriend.emphasis_houses  [7] → [7, 5]
#           （7 宫主婚姻正缘与契约互补，5 宫主恋爱激情与浪漫吸引 ——
#             缺 5 宫则吸引力算子只剩「老夫老妻的契约」）
#        D2 boyfriend.primary_factors  ['sun','jupiter'] → ['sun','jupiter','venus']
#           （太阳给安全感、木星给庇护，而金星才是「心动 / 爱情荷尔蒙」的绝对核心）
#        D3 四象新增 element_preference（元素偏好）—— **结构扩展**，
#           须同批前移 audit-e36 C3/C6 与 embodied D4 的算子签名/禁词射程
#   ⚠️ 本期仍只冻结**算子权重结构**；真实相位求解（双盘 Synastry 张量 + 反向拟合
#      虚拟星盘 Virtual Natal Chart）由 **E38-C / E38-D** 承接
#      （前置底座：E37 已备齐 12 宫头 / 宫主星 / 庙旺陷落）。
# ═══════════════════════════════════════════════════════════════

RELATION_DECISION_OPERATORS = {
    'girlfriend': {
        'intent_zh': '情感互补与吸引',
        'primary_factors': ['venus', 'mars', 'moon'],
        'emphasis_houses': [7, 5],                  # D1：7=婚姻正缘契约 / 5=恋爱激情浪漫
        'element_preference': ['water', 'earth'],   # D3：柔情治愈 + 稳固安全感
        'tone': 'tender',
    },
    'buddy': {
        'intent_zh': '同频义气与事业共振',
        'primary_factors': ['sun', 'mars'],
        'emphasis_houses': [11, 3],
        'element_preference': ['fire', 'air'],      # D3：炽热义气 + 干练思维
        'tone': 'upright',
    },
    'bestie': {
        'intent_zh': '敏锐共鸣与情绪解压',
        'primary_factors': ['mercury', 'moon'],
        'emphasis_houses': [3, 11],
        'element_preference': ['air', 'water'],     # D3：灵动通透 + 情绪共鸣
        'tone': 'lively',
    },
    'boyfriend': {
        'intent_zh': '庇护偏爱与安全感',
        'primary_factors': ['sun', 'jupiter', 'venus'],   # D2：太阳=安全 / 木星=庇护 / 金星=心动
        'emphasis_houses': [7, 5],
        'element_preference': ['fire', 'earth'],    # D3：行动力守护 + 坚实靠谱
        'tone': 'protective',
    },
}

# 四象声线矩阵（E36）· 星盘/关系人格 → TTS 声线 ID + 情感语调
#   🔴 emotional_tone 值域 = server.js / docs 的 VOICE_EMOTIONAL_TONES 闭集，四值一一对应。
#   真实音频合成由前端渲染层承接（web/src/components/FamiliarOverlay.tsx），
#   本引擎只输出**确定性声线参数**，不持有任何 TTS 凭据（零密钥铁律）。
RELATION_VOICE_MATRIX = {
    'girlfriend': {'voice_id': 'sophia_tender',     'emotional_tone': 'caring'},
    'bestie':     {'voice_id': 'sophia_lively',     'emotional_tone': 'witty'},
    'buddy':      {'voice_id': 'milo_upright',      'emotional_tone': 'energetic'},
    'boyfriend':  {'voice_id': 'milo_protective',   'emotional_tone': 'deep_affection'},
}

# 🔴 四张关系表必须**键集完全一致**（fail-fast 不变式）：
#   任何一张漏项都会让某个人格静默地拿不到配色/声线/算子 —— 那是最危险的「看似正常」。
assert (set(RELATION_MODES) == set(RELATION_PALETTE)
        == set(RELATION_DECISION_OPERATORS) == set(RELATION_VOICE_MATRIX)), \
    'familiar_engine: 四象表键集不一致（RELATION_MODES / PALETTE / DECISION_OPERATORS / VOICE_MATRIX）'


# 🔴 E38-A：元素偏好闭集不变式 —— 每象恰 2 项、⊆ 闭集、且四象两两互异。
#   动因：偏好同质化会让四个人格的「元素亲和」失去区分度 ⇒ 专利实施例退化。
ELEMENT_PREFERENCE_DOMAIN: Tuple[str, ...] = ('fire', 'earth', 'air', 'water')


def _assert_element_preference_invariants() -> None:
    """元素偏好 fail-fast 校验（模块导入即执行；供闸门以源码正则同源断言）。"""
    for _mode, _op in RELATION_DECISION_OPERATORS.items():
        _els = _op.get('element_preference')
        assert isinstance(_els, list) and len(_els) == 2, \
            f'familiar_engine: {_mode} element_preference 必须恰为 2 项'
        assert set(_els) <= set(ELEMENT_PREFERENCE_DOMAIN), \
            f'familiar_engine: {_mode} element_preference 含闭集外元素 {_els}'
    _sets = [tuple(_op['element_preference']) for _op in RELATION_DECISION_OPERATORS.values()]
    assert len(set(_sets)) == len(_sets), \
        f'familiar_engine: 四象元素偏好必须两两互异: {_sets}'


_assert_element_preference_invariants()



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
# 0c. 宫位微调层（E38-A）· House Modifier —— 被强调宫位内的行星 ⇒ 5 维微调
#   依据：军师 2026-10-09《E38 合婚双盘真值与反向合盘实体化》开工令第 3 项：
#         「灵宠人格 5 维是否引入 emphasis_houses 修正项 —— **坚决引入！**」
#   原理：日/月/升只给宏观大框架；若算子强调的宫位（女友/男友 7+5、哥们 11+3、
#         闺蜜 3+11）内有强星落入，灵宠的黏人度 / 话痨度 / 治愈度理应随该宫位
#         能量做微调加权（House Modifier）。
#   🔴 工程约束（军师令）：纯函数推导；加权系数落 **0.10 ~ 0.20** 区间；
#      单维总修正上限 ≤ HOUSE_MODIFIER_CAP —— 体现宫位深度，决不喧宾夺主
#      颠覆日月升基调。
#   🔴 真值纪律：未提供 planet_houses ⇒ 修正**恒 0**（不降级、不编造；
#      与 resolve_familiar_palette 的 transit 参数同构：缺省即不参与运算）。
#      ⚠️ 也因此**不改动** degraded 清单（缺省输入非「真值缺失故障」）。
# ═══════════════════════════════════════════════════════════════

HOUSE_MODIFIER_COEFF = 0.15   # 单颗宫内强调行星的单位牵引系数（军师令区间 0.10~0.20）
HOUSE_MODIFIER_CAP = 20       # 单维总修正上限（0~100 制下的「微调」天花板）

# 行星 → 五维单位牵引（离散闭集 {±1, ±0.5, 0}：可断言、可审计、禁连续魔数）
PLANET_DIM_PULL: Dict[str, Dict[str, float]] = {
    'Sun':     {'talkative': +1.0, 'clingy': 0.0, 'moody': 0.0, 'sarcastic': 0.0, 'healing': +0.5},
    'Moon':    {'talkative': 0.0, 'clingy': +1.0, 'moody': +1.0, 'sarcastic': 0.0, 'healing': +0.5},
    'Mercury': {'talkative': +1.0, 'clingy': 0.0, 'moody': 0.0, 'sarcastic': +1.0, 'healing': 0.0},
    'Venus':   {'talkative': +0.5, 'clingy': +1.0, 'moody': 0.0, 'sarcastic': -0.5, 'healing': +1.0},
    'Mars':    {'talkative': +0.5, 'clingy': -0.5, 'moody': +0.5, 'sarcastic': +1.0, 'healing': -0.5},
    'Jupiter': {'talkative': +0.5, 'clingy': 0.0, 'moody': 0.0, 'sarcastic': 0.0, 'healing': +1.0},
    'Saturn':  {'talkative': -0.5, 'clingy': -0.5, 'moody': +0.5, 'sarcastic': +0.5, 'healing': 0.0},
    'Uranus':  {'talkative': +0.5, 'clingy': -1.0, 'moody': -0.5, 'sarcastic': +1.0, 'healing': 0.0},
    'Neptune': {'talkative': 0.0, 'clingy': +0.5, 'moody': +0.5, 'sarcastic': -1.0, 'healing': +1.0},
    'Pluto':   {'talkative': -0.5, 'clingy': +0.5, 'moody': +1.0, 'sarcastic': +0.5, 'healing': -0.5},
}

_PULL_DOMAIN: Tuple[float, ...] = (-1.0, -0.5, 0.0, 0.5, 1.0)
assert all(v in _PULL_DOMAIN for _p in PLANET_DIM_PULL.values() for v in _p.values()), \
    'familiar_engine: PLANET_DIM_PULL 出现闭集外系数（只允许 0 / ±0.5 / ±1）'
assert 0.10 <= HOUSE_MODIFIER_COEFF <= 0.20, \
    'familiar_engine: HOUSE_MODIFIER_COEFF 必须落在军师令区间 0.10~0.20'


def _norm_planet(name: Any) -> Optional[str]:
    """行星名归一化（'sun' / 'SUN' → 'Sun'）；非字符串 / 空值返回 None。"""
    if not name or not isinstance(name, str):
        return None
    s = name.strip()
    if not s:
        return None
    return s[0].upper() + s[1:].lower()


def house_modifier_delta(
    emphasis_houses: List[int],
    planet_houses: Optional[Dict[str, Any]] = None,
) -> Tuple[Dict[str, int], List[str]]:
    """
    被强调宫位内的行星 ⇒ 5 维微调增量（**纯函数**：零 IO / 零副作用 / 零 AI）。

    算法（确定性）:
        delta[dim] = clamp( Σ_{p ∈ 强调宫位内的行星} PLANET_DIM_PULL[p][dim]
                            × HOUSE_MODIFIER_COEFF × 100 , ±HOUSE_MODIFIER_CAP )

    真值纪律:
        - planet_houses 缺省 / 空 / 非 dict ⇒ **恒返回全 0 增量 + 空 contributors**
          （不降级、不编造；与 resolve_familiar_palette 的 transit 同构）。
        - 未知行星名 / 非法宫位号 ⇒ 该条**静默跳过**（不计入，也不抛错）。

    Args:
        emphasis_houses: 算子强调的宫位（1~12）
        planet_houses:   {行星名: 宫位号} —— 来自 astroMatrix.meta.computed_houses

    Returns:
        (delta, contributors)：
          delta        —— 5 维增量（int，|v| ≤ HOUSE_MODIFIER_CAP）
          contributors —— 形如 ['Moon@H5', 'Venus@H7'] 的**排序后**来源清单
                           （专利实施例证据：可追溯到「是哪颗星落在哪个宫」）
    """
    delta: Dict[str, int] = {d: 0 for d in PERSONALITY_DIMS}
    if not planet_houses or not isinstance(planet_houses, dict):
        return delta, []

    _emph = set()
    for h in (emphasis_houses or []):
        try:
            _emph.add(int(h))
        except (TypeError, ValueError):
            continue

    raw: Dict[str, float] = {d: 0.0 for d in PERSONALITY_DIMS}
    contributors: List[str] = []
    for planet, house in planet_houses.items():
        pname = _norm_planet(planet)
        if pname not in PLANET_DIM_PULL:
            continue
        try:
            h = int(house)
        except (TypeError, ValueError):
            continue
        if h not in _emph:
            continue
        contributors.append(f'{pname}@H{h}')
        for d in PERSONALITY_DIMS:
            raw[d] += PLANET_DIM_PULL[pname].get(d, 0.0)

    for d in PERSONALITY_DIMS:
        scaled = raw[d] * HOUSE_MODIFIER_COEFF * 100.0
        delta[d] = int(max(-HOUSE_MODIFIER_CAP, min(HOUSE_MODIFIER_CAP, round(scaled))))
    return delta, sorted(contributors)


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


def _personality_vector(
    sun_sign: str,
    moon_sign: str,
    asc_sign: str,
    house_delta: Optional[Dict[str, int]] = None,
) -> Dict[str, int]:
    """
    加权计算 5 维性格向量

    算法（三要素齐全时与 V461 逐字一致，保证零回归）:
      base[dimension] = sun_base * 0.5 + moon_base * 0.3 + asc_base * 0.2
      result[dimension] = clamp(base + element_modifier[sun_element][dimension]
                                + house_delta[dimension])            # ← E38-A 宫位微调

    🔴 E34-B1 防伪造：
      - 未知星座**不参与**加权，其余已知星座按权重**重新归一化**；
      - 太阳元素未知 ⇒ 不加元素修正（而非套用 Fire 的修正值）；
      - 三要素全部未知 ⇒ **抛错**，拒绝生成（绝不静默伪造）。
    🛡️ E38-A：house_delta 缺省（None）⇒ 视为全 0 ⇒ **L1 锚值零回归**；
       增量一律由 house_modifier_delta() 产出，且已被 HOUSE_MODIFIER_CAP 截断。
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
    _hd = house_delta or {}
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
        result[dim] = _clamp(round(weighted + _mod.get(dim, 0) + _hd.get(dim, 0)))

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
    planet_houses: Optional[Dict[str, Any]] = None,
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
        planet_houses:  宫内星真值 {行星名: 宫位号}（**E38-A 新增**）
                        —— 用于「被算子强调宫位内的行星 ⇒ 5 维微调」；
                        缺省 ⇒ 修正恒 0（不降级、不编造）。

    Returns:
        完整灵宠 Profile dict, 字段与 familiar_profiles 表对齐。
        额外含 relation（人格 + 调色板）、degraded（降级字段清单）、
        decision_operators（四象算子只读快照）与 house_modifier（宫位微调快照）。
    """
    if relation_mode not in RELATION_MODES:
        raise ValueError(
            f'familiar_engine: 未知 relation_mode={relation_mode!r}'
            f'（允许值：{sorted(RELATION_MODES)}）'
        )

    rel = RELATION_MODES[relation_mode]
    # 四象算子（E36 立 / E38-A 精准化）：同一 relation_mode 派生；
    #   键集齐备由模块级不变式保证（见 RELATION_VOICE_MATRIX 之后的 assert）。
    operators = RELATION_DECISION_OPERATORS[relation_mode]
    # 🐾 E38-A：宫位微调 —— 被强调宫位内的行星 ⇒ 5 维微调；缺真值 ⇒ 恒 0
    _h_delta, _h_contributors = house_modifier_delta(
        operators['emphasis_houses'], planet_houses)
    appearance = _appearance(sun_sign, moon_sign, asc_sign, time_uncertain=time_uncertain)
    personality = _personality_vector(sun_sign, moon_sign, asc_sign, house_delta=_h_delta)
    # 调色板单一真源：relation.palette 与 display_palette 必须**同源**
    #   （只调一次 ⇒ 杜绝两处参数漂移；闸门 audit-e35 B 组逐值断言二者一致）
    palette = resolve_familiar_palette(relation_mode, sun_sign=sun_sign)
    # 四象声线（E36）：同一 relation_mode 派生。
    voice = RELATION_VOICE_MATRIX[relation_mode]

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

        # ── E36 Agent 执行 + 语音双模态预留槽（**设备中立** · 本期全 inert）──────
        #   依据：军师《E36 战略架构升级战备号令》2026-10-09（主公摊牌 Soul OS 护城河）。
        #   🔴 action_intent 本期恒 None —— 真实动作须过「真值锁 + 用户显式确认」双闸门；
        #      执行意图一律由 embodied/core/embodied_gateway.js::buildAgentIntentAction()
        #      构造（确认位**不可翻转**），本引擎**绝不**手写第二份执行契约。
        #   🔴 voice_stream_meta：声线由 relation_mode 确定性映射（见 RELATION_VOICE_MATRIX），
        #      viseme_timeline（嘴型音素时间轴）无音频流 ⇒ 恒 None，由前端渲染层承接。
        #   🔴 decision_operators：四象算子权重**只读快照**（专利级 Reverse Synergy 证据）。
        'action_intent': None,
        'voice_stream_meta': {
            'voice_id': voice['voice_id'],
            'emotional_tone': voice['emotional_tone'],
            'viseme_timeline': None,
        },
        'decision_operators': {
            'intent_zh': operators['intent_zh'],
            'primary_factors': list(operators['primary_factors']),
            'emphasis_houses': list(operators['emphasis_houses']),
            'element_preference': list(operators['element_preference']),   # E38-A / D3
            'tone': operators['tone'],
        },

        # ── E38-A：宫位微调快照（专利实施例证据 · 审计可追溯）─────────────
        #   delta        —— 5 维实际增量（已落在 ±HOUSE_MODIFIER_CAP 内）
        #   contributors —— 参与微调的行星@宫位（空 ⇒ source = 'none'）
        #   source       —— 'natal'（有宫内星真值参与）| 'none'（未提供 / 未命中）
        'house_modifier': {
            'delta': {d: _h_delta[d] for d in PERSONALITY_DIMS},
            'emphasis_houses': list(operators['emphasis_houses']),
            'contributors': list(_h_contributors),
            'source': 'natal' if _h_contributors else 'none',
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
    parser.add_argument('--planet-houses', dest='planet_houses', default=None,
                        help='宫内星真值 JSON（E38-A 宫位微调），如 {"Sun":1,"Venus":7}')
    args = parser.parse_args(argv)

    # 🐾 E38-A：宫内星真值（可选）—— 非法 JSON 一律按「输入非法」退出码 2，
    #    绝不静默忽略（否则会悄悄退化成「零微调」的假档案）。
    _planet_houses = None
    if args.planet_houses:
        try:
            _planet_houses = json.loads(args.planet_houses)
        except (ValueError, TypeError) as e:
            print(f'FAMILIAR_INVALID_INPUT: --planet-houses 不是合法 JSON: {e}', file=sys.stderr)
            return 2

    try:
        profile = calculate_familiar_profile(
            args.sun, args.moon, args.asc,
            natal_hash=args.natal_hash,
            user_name=args.user_name,
            relation_mode=args.relation_mode,
            time_uncertain=args.time_uncertain,
            planet_houses=_planet_houses,
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

    # ── E36：Agent 执行槽（inert）+ 四象声线 + 决策算子隔离 ──
    print("\n=== E36 Agent 执行槽 / 四象声线 / 决策算子 ===")
    _EXPECT_TONE = {'girlfriend': 'caring', 'buddy': 'energetic',
                    'bestie': 'witty', 'boyfriend': 'deep_affection'}
    _tones, _op_sig = set(), {}
    for mode, expect_tone in _EXPECT_TONE.items():
        pe = calculate_familiar_profile('Scorpio', 'Pisces', 'Taurus', relation_mode=mode)
        assert pe['action_intent'] is None, f"{mode} 的 action_intent 本期必须 inert（None）"
        v = pe['voice_stream_meta']
        assert v['emotional_tone'] == expect_tone, \
            f"{mode} 语调应为 {expect_tone}, 实得 {v['emotional_tone']}"
        assert v['viseme_timeline'] is None, "无音频流 ⇒ viseme_timeline 必须 None"
        assert v['voice_id'], f"{mode} 缺 voice_id"
        assert pe['schema_version'] == SOUL_OS_PROTOCOL_VERSION, f"{mode} 契约版本漂移"
        _tones.add(v['emotional_tone'])
        _op_sig[mode] = (tuple(pe['decision_operators']['primary_factors']),
                         tuple(pe['decision_operators']['emphasis_houses']),
                         tuple(pe['decision_operators']['element_preference']))
        print(f"  {mode:11s} -> tone={v['emotional_tone']:14s} voice={v['voice_id']:18s} "
              f"ops={pe['decision_operators']['intent_zh']}")
    assert len(_tones) == 4, "四象语调必须两两互异（否则声线无法区分人格）"
    # 🔴 决策算子权重隔离：四象的（主因子集合 + 重点宫位 + 元素偏好）签名两两不同
    assert len(set(_op_sig.values())) == 4, f"四象决策算子未隔离: {_op_sig}"
    print("E36 验证通过（action_intent 恒 inert；四象声线/算子两两隔离）")

    # ── E38-A：四象算子精准化（D1 / D2 / D3 军师三裁）──
    print("\n=== E38-A 四象算子精准化（D1/D2/D3）===")
    _EXPECT_OPS = {
        'girlfriend': (['venus', 'mars', 'moon'], [7, 5], ['water', 'earth']),
        'buddy':      (['sun', 'mars'], [11, 3], ['fire', 'air']),
        'bestie':     (['mercury', 'moon'], [3, 11], ['air', 'water']),
        'boyfriend':  (['sun', 'jupiter', 'venus'], [7, 5], ['fire', 'earth']),
    }
    for _mode, (_f, _h, _e) in _EXPECT_OPS.items():
        _ops = calculate_familiar_profile('Scorpio', 'Pisces', 'Taurus',
                                          relation_mode=_mode)['decision_operators']
        assert _ops['primary_factors'] == _f, f"{_mode} D2 主因子未闭合: {_ops['primary_factors']}"
        assert _ops['emphasis_houses'] == _h, f"{_mode} D1 重点宫位未闭合: {_ops['emphasis_houses']}"
        assert _ops['element_preference'] == _e, f"{_mode} D3 元素偏好未闭合: {_ops['element_preference']}"
        print(f"  {_mode:11s} factors={_f} houses={_h} elements={_e}")
    assert len({tuple(_v[2]) for _v in _EXPECT_OPS.values()}) == 4, '四象元素偏好必须两两互异'
    print("D1（女友补 5 宫）/ D2（男友补金星）/ D3（四象元素偏好）验证通过")

    # ── E38-A：宫位微调层（House Modifier）──
    print("\n=== E38-A 宫位微调层（House Modifier）===")
    assert 0.10 <= HOUSE_MODIFIER_COEFF <= 0.20, '系数越出军师令区间 0.10~0.20'
    _ZERO = {d: 0 for d in PERSONALITY_DIMS}
    # ① 未提供宫内星真值 ⇒ 修正恒 0（L1 锚值零回归）
    p_no = calculate_familiar_profile('Scorpio', 'Pisces', 'Taurus', relation_mode='girlfriend')
    assert p_no['house_modifier']['delta'] == _ZERO, '缺真值时增量必须全 0'
    assert p_no['house_modifier']['source'] == 'none', '缺真值时 source 必须 none'
    assert p_no['personality'] == p1['personality'], '缺真值时人格必须零变化（L1 锚值）'
    # ② 提供宫内星真值 ⇒ 仅「被强调宫位」（女友 7/5）生效
    p_h = calculate_familiar_profile('Scorpio', 'Pisces', 'Taurus', relation_mode='girlfriend',
                                     planet_houses={'Venus': 7, 'Moon': 5, 'Saturn': 12})
    assert p_h['house_modifier']['contributors'] == ['Moon@H5', 'Venus@H7'], \
        f"贡献来源错: {p_h['house_modifier']['contributors']}"
    assert p_h['house_modifier']['source'] == 'natal'
    assert p_h['house_modifier']['delta']['clingy'] > 0, '金星入 7 宫应提升黏人度'
    assert p_h['house_modifier']['delta']['healing'] > 0, '金/月入 5/7 宫应提升治愈度'
    assert p_h['personality']['clingy'] != p_no['personality']['clingy'], '宫位微调必须可见'
    # ③ 上限截断：十星全挤进强调宫位，单维仍不得越界
    p_cap = calculate_familiar_profile('Scorpio', 'Pisces', 'Taurus', relation_mode='girlfriend',
                                       planet_houses={_p: 7 for _p in PLANET_DIM_PULL})
    for _d in PERSONALITY_DIMS:
        assert abs(p_cap['house_modifier']['delta'][_d]) <= HOUSE_MODIFIER_CAP, f'{_d} 越上限'
    # ④ 幂等 + 非法值（非数字宫位/None/非字符串行星）静默跳过 ⇒ 零微调
    assert p_h == calculate_familiar_profile('Scorpio', 'Pisces', 'Taurus', relation_mode='girlfriend',
                                             planet_houses={'Venus': 7, 'Moon': 5, 'Saturn': 12})
    p_bad = calculate_familiar_profile('Scorpio', 'Pisces', 'Taurus', relation_mode='girlfriend',
                                       planet_houses={'Venus': 'H7', 'Moon': None, 99: 5})
    assert p_bad['house_modifier']['source'] == 'none', '非法值必须静默跳过 ⇒ 零微调'
    print(f"  两态 / 上限 / 幂等 / 非法值 验证通过（COEFF={HOUSE_MODIFIER_COEFF}，CAP={HOUSE_MODIFIER_CAP}）")

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

    print("\n全部自测通过（E34-Familiar-B1 + E36-Agent/声线/算子 + E38-A 算子精准化/宫位微调）")
