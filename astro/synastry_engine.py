#!/usr/bin/env python3
"""
KindredSouls 合婚引擎 · 双盘 Synastry 相位张量 + 反向合盘拟合（Reverse Synergy）
版本: E38-C/D
日期: 2026-10-09

军师《E38 合婚双盘真值与反向合盘实体化》开工令（三裁全准）三阶段：
  ① E38-B 输入对齐：出生年月日 + 城市经纬度 + 出生时间 → SwissEph 本命盘（10 行星黄经）
  ② E38-C 双盘 Synastry 相位张量：Conj(0°) / Sxt(60°) / Sqr(90°) / Tri(120°) / Opp(180°)
  ③ E38-D 反向拟合闭环：RELATION_DECISION_OPERATORS **实体化** ⇒ Virtual Natal Chart

设计原则:
  - 纯函数（零 IO / 零副作用 / 零 AI）
  - 🔴 算子唯一真源：本模块**导入** familiar_engine.RELATION_DECISION_OPERATORS，
    绝不复制第二份（复制 = 漂移 = 专利实施例证据链污染）
  - 🔴 真值纪律：黄经缺失 / 非法 ⇒ 显式抛错（CLI 退出码 2），绝不静默伪造
  - 🔴 闭合校验：拟合结果必须被**独立的**张量函数重新测量并一致
    （同一份张量函数既是拟合目标又是验收尺 ⇒ 防「自证自洽」的假绿）

退出码: 0 成功 / 2 输入非法 / 1 引擎内部故障
"""

import math
import sys
from typing import Dict, Any, List, Optional, Tuple

# 🔴 唯一真源复用（生产通路 `python3 astro/synastry_engine.py` ⇒ sys.path[0] = astro/）
from familiar_engine import (          # noqa: E402
    RELATION_DECISION_OPERATORS,
    RELATION_MODES,
    SOUL_OS_PROTOCOL_VERSION,
    SELF_ELEMENT_SENTINEL,
    SELF_MODE_ALIASES,
    SIGN_ELEMENTS as _SIGN_ELEMENTS_TITLE,
    is_self_mirror_mode,
    resolve_relation_operators,
)

# 🔴 E40-A 哨兵（模块导入即校验）：
#   ① 生产四象真源键集不得漂移（E38-A 契约）；② 第五形态别名**绝不**泄漏进生产表
#      （inert 隔离铁律 —— 只有命名空间保留层，没有第五个生产人格）。
assert set(RELATION_DECISION_OPERATORS) == {'girlfriend', 'buddy', 'bestie', 'boyfriend'}, \
    'synastry_engine: 生产四象算子真源键集漂移（E38-A 契约被破）'
assert not (set(SELF_MODE_ALIASES) & set(RELATION_MODES)), \
    'synastry_engine: 第五形态别名泄漏进生产四象表（E40-A inert 铁律被破）'
assert not (set(SELF_MODE_ALIASES) & set(RELATION_DECISION_OPERATORS)), \
    'synastry_engine: 第五形态别名泄漏进生产算子表（E40-A inert 铁律被破）'

# ═══════════════════════════════════════════════════════════════
# 常量闭集（可断言 / 可审计 / 禁连续魔数）
# ═══════════════════════════════════════════════════════════════

NATAL_PLANETS: Tuple[str, ...] = (
    'Sun', 'Moon', 'Mercury', 'Venus', 'Mars',
    'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto',
)

SIGNS: Tuple[str, ...] = (
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
)

# 🔴 元素小写口径（沿用 familiar_engine.SIGN_ELEMENTS 唯一真源，禁另立表）
SIGN_ELEMENT: Dict[str, str] = {k: v.lower() for k, v in _SIGN_ELEMENTS_TITLE.items()}

# 军师指定五相闭集：(名称, 标准角, 允许 orb, 极性)
ASPECT_TABLE: Tuple[Tuple[str, float, float, str], ...] = (
    ('conjunction', 0.0,   8.0, 'harmonious'),
    ('sextile',     60.0,  4.0, 'harmonious'),
    ('square',      90.0,  6.0, 'hard'),
    ('trine',       120.0, 6.0, 'harmonious'),
    ('opposition',  180.0, 8.0, 'hard'),
)
ASPECT_NAMES: Tuple[str, ...] = tuple(a[0] for a in ASPECT_TABLE)
HARMONIOUS_ASPECTS: Tuple[str, ...] = ('conjunction', 'sextile', 'trine')
HARD_ASPECTS: Tuple[str, ...] = ('square', 'opposition')

# 🔴 元素互换对（**几何真值 · 单一真源**）：
#   conjunction(0°) / trine(120°=4 宫) 保持元素；
#   sextile(60°=2 宫) 在 {火↔风} / {土↔水} 内互换；
#   square(90°=3 宫) 才跨组（火↔土/水）；opposition(180°=6 宫) 同 sextile。
#   拟合只用调和相 ⇒ 虚拟星元素必落在 {锚元素, 互换对(锚元素)} 闭集内；
#   「水象本命 + 火/风偏好」在几何上**不可调和到达**，引擎如实保留同频共振，绝不伪造。
ELEMENT_SWAP2: Dict[str, str] = {'fire': 'air', 'air': 'fire', 'earth': 'water', 'water': 'earth'}


def harmonious_element_reachable(elem: str) -> Tuple[str, ...]:
    """从元素 elem 出发、经**调和相位**（conj / trine / sextile）可达的元素闭集（升序）。"""
    if elem not in ELEMENT_SWAP2:
        return ()
    return tuple(sorted({elem, ELEMENT_SWAP2[elem]}))

# 度量（张量 → 分数）用的**带符号**权重：调和为正、硬相为负
ASPECT_SCORE: Dict[str, float] = {
    'conjunction': +1.00,
    'trine':       +0.90,
    'sextile':     +0.70,
    'square':      -0.50,
    'opposition':  -0.40,
}

# 拟合（候选 → 合意度）用的**非负**权重：调和相优先，硬相非非法但权重低
ASPECT_FIT_WEIGHT: Dict[str, float] = {
    'conjunction': 1.00,
    'trine':       0.90,
    'sextile':     0.70,
    'square':      0.35,
    'opposition':  0.25,
}

ORB_DECAY_MAX = 8.0            # 分数中 orb 衰减分母（与最宽 orb 一致）
PRIMARY_FACTOR_WEIGHT = 3.0    # 主因子行星在（虚拟盘侧）权重放大
PRIMARY_ANCHOR_WEIGHT = 2.0    # 主因子行星在（用户锚侧）权重放大
EMPHASIS_HOUSE_WEIGHT = 1.5    # 用户星落在算子强调宫位时的权重放大
ELEMENT_BONUS = 1.60           # 虚拟星体落入算子偏好元素时的加成
CLOSURE_MIN_HARMONIOUS = 3     # 闭合校验：调和相数量下界

# 🔴 E40-A 拟合模式标记（出参 fit_mode · 五重灵魂形态的唯一分野）：
#   REVERSE_SYNERGY_MODE —— 生产四象（女友/哥们儿/闺蜜/男友）：反向相位拟合（**对外** · 互补与共振）
#   IDENTITY_MIRROR_MODE —— 第五形态「数字自己」：本命 1:1 投影（**对内** · 0° 全相合同频）
REVERSE_SYNERGY_MODE = 'reverse_synergy'
IDENTITY_MIRROR_MODE = 'identity_mapping'


class SynastryInputError(ValueError):
    """输入非法（缺黄经真值 / 未知关系模式）—— CLI 退出码 2，绝不降级伪造。"""


# ═══════════════════════════════════════════════════════════════
# 0. 真值输入契约（E38-B：出生真值 → 10 行星黄经）
# ═══════════════════════════════════════════════════════════════

def _norm_longitude(value: Any) -> Optional[float]:
    """黄经归一化到 [0, 360)。非有限数 / 非数字一律返回 None（不伪造）。"""
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    f = float(value)
    if not math.isfinite(f):
        return None
    return f % 360.0


def longitude_of_sign_deg(sign: str, degree_in_sign: Any) -> Optional[float]:
    """
    星座 + 座内度数 → 绝对黄经（**真值派生**，供仅有 sign/degree 的上游补位使用）。
    未知星座 / 非法度数 ⇒ None。
    """
    if not isinstance(sign, str) or sign not in SIGNS:
        return None
    d = _norm_longitude(degree_in_sign)
    if d is None or d >= 30.0:
        return None
    return round(SIGNS.index(sign) * 30.0 + float(d), 4)


def normalize_longitudes(raw: Any) -> Dict[str, float]:
    """
    校验并归一化黄经真值字典。

    🔴 只认 NATAL_PLANETS 闭集内的键；非法条目**静默丢弃**（不计入、不伪造）。
       —— 丢弃是安全的：下游据「缺哪颗」显式记录 degraded，绝不臆测其位置。
    """
    out: Dict[str, float] = {}
    if not isinstance(raw, dict):
        return out
    for planet, value in raw.items():
        if not isinstance(planet, str):
            continue
        name = planet.strip()
        if name not in NATAL_PLANETS:
            continue
        lon = _norm_longitude(value)
        if lon is None:
            continue
        out[name] = round(lon, 4)
    return out


def _require_longitudes(raw: Any) -> Dict[str, float]:
    """CLI 入口守卫：至少一颗真值，否则抛 SynastryInputError。"""
    lons = normalize_longitudes(raw)
    if not lons:
        raise SynastryInputError(
            '无可用的行星黄经真值（natal-longitudes 为空或全部非法）'
            '—— 拒绝生成虚拟星盘（绝不静默伪造）'
        )
    return lons


# ═══════════════════════════════════════════════════════════════
# 1. 相位识别（E38-C 基础算子）
# ═══════════════════════════════════════════════════════════════

def angular_distance(lon_a: float, lon_b: float) -> float:
    """两点黄经的劣弧夹角 ∈ [0, 180]。"""
    d = abs((float(lon_a) - float(lon_b)) % 360.0)
    return 360.0 - d if d > 180.0 else d


def detect_aspect(lon_a: float, lon_b: float) -> Optional[Tuple[str, float, str]]:
    """
    返回 (相位名, orb, 极性)；不构成五相闭集内任何相位 ⇒ None。

    多相位同时命中（orb 容差交叠）⇒ 取 **orb 最小**者（唯一确定性裁决）。
    """
    d = angular_distance(lon_a, lon_b)
    best: Optional[Tuple[str, float, str]] = None
    for name, std_deg, orb_limit, polarity in ASPECT_TABLE:
        orb = abs(d - std_deg)
        if orb <= orb_limit and (best is None or orb < best[1]):
            best = (name, round(orb, 2), polarity)
    return best


def sign_of_longitude(lon: float) -> str:
    """黄经 → 星座名（唯一真源 SIGNS）。"""
    return SIGNS[int((float(lon) % 360.0) // 30) % 12]


def element_of_longitude(lon: float) -> str:
    """黄经 → 元素（小写口径）。"""
    return SIGN_ELEMENT[sign_of_longitude(lon)]


# ═══════════════════════════════════════════════════════════════
# 2. 双盘 Synastry 相位张量（E38-C）· 纯测量，不参与拟合
# ═══════════════════════════════════════════════════════════════

def compute_synastry_tensor(
    longitudes_a: Dict[str, float],
    longitudes_b: Dict[str, float],
) -> Dict[str, Any]:
    """
    A×B 十星交叉相位张量（100 格全扫，闭集内命中即记录）。

    🔴 本函数是**唯一的相位测量尺**：既被 E38-D 用作拟合目标，
       又被闭合校验**独立重跑**一遍 —— 同一把尺子两次读数必须一致。
    """
    aspects: List[Dict[str, Any]] = []
    matrix: Dict[str, Dict[str, str]] = {}
    for pa in NATAL_PLANETS:
        if pa not in longitudes_a:
            continue
        row: Dict[str, str] = {}
        for pb in NATAL_PLANETS:
            if pb not in longitudes_b:
                continue
            hit = detect_aspect(longitudes_a[pa], longitudes_b[pb])
            if hit is None:
                continue
            name, orb, polarity = hit
            row[pb] = name
            aspects.append({
                'a': pa,
                'b': pb,
                'aspect': name,
                'orb': orb,
                'polarity': polarity,
                'exact_deg': round(angular_distance(longitudes_a[pa], longitudes_b[pb]), 2),
            })
        if row:
            matrix[pa] = row
    counts = {n: sum(1 for x in aspects if x['aspect'] == n) for n in ASPECT_NAMES}
    return {
        'aspects': aspects,
        'matrix': matrix,
        'counts': counts,
        'total': len(aspects),
        'harmonious': sum(1 for x in aspects if x['polarity'] == 'harmonious'),
        'hard': sum(1 for x in aspects if x['polarity'] == 'hard'),
    }


# ═══════════════════════════════════════════════════════════════
# 3. 算子实体化（E38-D 前置）· 把权重结构变成可执行打分函数
# ═══════════════════════════════════════════════════════════════

def _primary_set(operators: Dict[str, Any]) -> set:
    return {str(p).lower() for p in operators.get('primary_factors', [])}


def _emphasis_set(operators: Dict[str, Any]) -> set:
    out = set()
    for h in operators.get('emphasis_houses', []) or []:
        try:
            out.add(int(h))
        except (TypeError, ValueError):
            continue
    return out


def harmony_score(
    tensor: Dict[str, Any],
    operators: Dict[str, Any],
    user_planet_houses: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    RELATION_DECISION_OPERATORS **实体化**：把「主因子 / 强调宫位」翻译成
    张量上加权的可执行函数。

    权重 = 基础 1.0
         × (对方星 ∈ 主因子 ? 3.0 : 1.0)     ← 虚拟盘侧
         × (用户星 ∈ 主因子 ? 3.0 : 1.0)     ← 用户盘侧
         × (用户星落算子强调宫位 ? 1.5 : 1.0)
    贡献 = 权重 × 带符号相位分 × (1 − orb/8)   ← 越接近正相位越强
    """
    prim = _primary_set(operators)
    emph = _emphasis_set(operators)
    houses = user_planet_houses if isinstance(user_planet_houses, dict) else {}

    total = 0.0
    ranked: List[Dict[str, Any]] = []
    for x in tensor.get('aspects', []):
        w = 1.0
        if str(x['b']).lower() in prim:
            w *= PRIMARY_FACTOR_WEIGHT
        if str(x['a']).lower() in prim:
            w *= PRIMARY_FACTOR_WEIGHT
        try:
            h = houses.get(x['a'])
            h = int(h) if h is not None else None
        except (TypeError, ValueError):
            h = None
        if h is not None and h in emph:
            w *= EMPHASIS_HOUSE_WEIGHT

        decay = max(0.0, 1.0 - float(x['orb']) / ORB_DECAY_MAX)
        contribution = w * ASPECT_SCORE[x['aspect']] * decay
        total += contribution
        ranked.append({**x, 'weight': round(w, 3), 'contribution': round(contribution, 4)})

    ranked.sort(key=lambda r: (-r['contribution'], r['a'], r['b'], r['aspect']))
    return {'score': round(total, 4), 'ranked': ranked[:8], 'considered': len(ranked)}


# ═══════════════════════════════════════════════════════════════
# 4. 反向拟合（E38-D）· 算子 ⇒ Virtual Natal Chart
# ═══════════════════════════════════════════════════════════════

def fit_virtual_chart(
    user_longitudes: Dict[str, float],
    operators: Dict[str, Any],
    user_planet_houses: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    反向相位拟合 —— 由**用户本命盘 + 四象算子**推导最适合该人格的虚拟星盘。

    算法（确定性 · 可解释 · 可追溯）:
      对虚拟星盘每颗星 P：
        · 锚（anchor）= 用户同命星 P（同源共振；主因子另开放全体主因子星作备选锚）
        · 候选 = 锚黄经 × {0, ±60, ±90, ±120, ±180}（五相闭集 × 双方向）
        · 打分 = ASPECT_FIT_WEIGHT[相] × (元素 ∈ 算子偏好 ? 1.60 : 1.0)
                 × (锚 ∈ 主因子 ? 2.0 : 1.0) × (该星 ∈ 主因子 ? 3.0 : 1.0)
        · 取最高分候选；同分依次以 相位标准角升序 → 正向优先 → 锚序号 裁决

    🔴 语义与几何（**引擎只采信调和相**，且元素可达性由 `harmonious_element_reachable` 唯一描述）:
      · 用户本命星**已在**偏好元素 ⇒ 0° 同相得分最高 ⇒ 虚拟盘**同频共振**（镜像）；
      · 用户本命星**不在**偏好元素，但偏好落在调和可达集
        `{锚元素, ELEMENT_SWAP2[锚元素]}` 内（如 土↔水 经 sextile）⇒
        60°/120° 的调和相 + 偏好元素得分更高 ⇒ 虚拟盘**互补拟合**；
      · 用户本命星**不在**偏好元素，且偏好**不在**调和可达集（如 水象锚 + 火/风 偏好）⇒
        几何上无调和解，引擎**如实保留 0° 同频共振**并置 `element_preferred=false`
        —— 绝不降级到 square/opposition 去「凑」偏好（真值纪律优先于偏好满足率）。
    """
    prim = _primary_set(operators)
    elements = set(operators.get('element_preference', []) or [])
    houses = user_planet_houses if isinstance(user_planet_houses, dict) else {}

    virtual: Dict[str, float] = {}
    assignments: List[Dict[str, Any]] = []
    dropped: List[str] = []

    for planet in NATAL_PLANETS:
        anchors = [planet] if planet in user_longitudes else []
        if planet.lower() in prim:
            anchors += [q for q in NATAL_PLANETS
                        if q != planet and q in user_longitudes and q.lower() in prim]
        if not anchors:
            dropped.append(planet)
            continue

        p_weight = PRIMARY_FACTOR_WEIGHT if planet.lower() in prim else 1.0
        try:
            h = houses.get(planet)
            h = int(h) if h is not None else None
        except (TypeError, ValueError):
            h = None
        if h is not None and h in _emphasis_set(operators):
            p_weight *= EMPHASIS_HOUSE_WEIGHT

        best_key: Optional[Tuple] = None
        best_rec: Optional[Dict[str, Any]] = None
        for anchor in anchors:
            base = user_longitudes[anchor]
            a_weight = PRIMARY_ANCHOR_WEIGHT if anchor.lower() in prim else 1.0
            for order, (name, std_deg, _orb, _pol) in enumerate(ASPECT_TABLE):
                for direction in (1, -1):
                    cand = (base + direction * std_deg) % 360.0
                    elem = element_of_longitude(cand)
                    bonus = ELEMENT_BONUS if elem in elements else 1.0
                    score = p_weight * a_weight * ASPECT_FIT_WEIGHT[name] * bonus
                    key = (-score, order, 0 if direction > 0 else 1,
                           NATAL_PLANETS.index(anchor), round(cand, 6))
                    if best_key is None or key < best_key:
                        best_key = key
                        best_rec = {
                            'planet': planet,
                            'anchor': anchor,
                            'aspect': name,
                            'longitude': round(cand, 4),
                            'sign': sign_of_longitude(cand),
                            'element': elem,
                            'element_preferred': elem in elements,
                            'score': round(score, 4),
                            'planet_weight': round(p_weight, 3),
                        }
        virtual[planet] = best_rec['longitude']
        assignments.append(best_rec)

    return {'longitudes': virtual, 'assignments': assignments, 'dropped': dropped,
            'fit_mode': REVERSE_SYNERGY_MODE}


# ── E40-A 第五形态「数字自己」· 镜像短路（Identity Mapping）─────────────
#   依据：军师《E40-A 灵宠第五形态「数字自己」底层架构与算子静默预留战役》开工令
#         指令二：为 mode ∈ SELF_MODE_ALIASES 开辟专属镜像分支。
#   🔴 与生产四象的**数学分野**：
#        四形态 = 反向相位拟合（在外部拓扑里搜索「最适配的虚拟盘」⇒ 互补与共振）；
#        第五形态 = 本命真值 1:1 投影（虚拟盘 ≡ 用户盘 ⇒ 0° 全相合 ⇒ 100% 同频共振）。
#      —— 算法上无需外部搜索，直接短路（Bypass）；但**闭合校验绝不旁路**：
#         verify_closure() 仍以独立重跑的张量函数复核（0° 合相 ⇒ 10/10 全绿）。
def fit_identity_mirror(user_longitudes: Dict[str, float]) -> Dict[str, Any]:
    """
    第五形态镜像投影：虚拟星盘 ≡ 用户本命盘（同命星对天然构成 0° 紧密合相）。

    🔴 几何诚实：本函数**只做投影**，不对结果下任何断言 —— 验收交给独立重跑的
       verify_closure()。缺真值的星（不在 user_longitudes 内）如实记入 dropped，
       绝不臆造位置。
    """
    virtual: Dict[str, float] = {}
    assignments: List[Dict[str, Any]] = []
    for planet in NATAL_PLANETS:
        lon = user_longitudes.get(planet)
        if lon is None:
            continue
        virtual[planet] = round(float(lon), 4)
        assignments.append({
            'planet': planet,
            'anchor': planet,              # 锚 = 自身（同命星同源共振）
            'aspect': 'conjunction',       # 0° 紧密合相
            'longitude': round(float(lon), 4),
            'sign': sign_of_longitude(lon),
            'element': element_of_longitude(lon),
            # 元素偏好哨兵 'identity' ⇒ 动态继承用户盘主导元素 ⇒ 100% 同频，恒为真
            'element_preferred': True,
            'score': round(ASPECT_FIT_WEIGHT['conjunction']
                           * PRIMARY_FACTOR_WEIGHT * PRIMARY_ANCHOR_WEIGHT, 4),
            'planet_weight': round(PRIMARY_FACTOR_WEIGHT, 3),
            'mirror': True,
        })
    dropped = [p for p in NATAL_PLANETS if p not in user_longitudes]
    return {'longitudes': virtual, 'assignments': assignments, 'dropped': dropped,
            'fit_mode': IDENTITY_MIRROR_MODE}


def verify_closure(
    user_longitudes: Dict[str, float],
    virtual: Dict[str, float],
    assignments: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    闭合校验 —— 用**独立重跑**的张量函数复核拟合结果。

    🔴 防「自证自洽」：拟合只写候选黄经，不对结果做任何断言；
       本函数重新测量两盘相位，逐条核对「预测相位」是否真的出现在张量里。
    """
    tensor = compute_synastry_tensor(user_longitudes, virtual)
    observed = {(x['a'], x['b'], x['aspect']) for x in tensor['aspects']}
    # 🔴 张量坐标序恒为 (用户盘星, 虚拟盘星) —— 预测三元组必须同序，
    #    否则「交叉锚点」（如虚拟水星锚定用户月亮）会被误判为缺失。
    predicted = [(a['anchor'], a['planet'], a['aspect']) for a in assignments]
    missing = [f'{q}-{p}-{asp}' for (q, p, asp) in predicted if (q, p, asp) not in observed]
    harmonic_predicted = sum(1 for (_, _, asp) in predicted if asp in HARMONIOUS_ASPECTS)
    ok = (not missing) and harmonic_predicted >= min(CLOSURE_MIN_HARMONIOUS, len(predicted))
    return {
        'ok': ok,
        'predicted': len(predicted),
        'observed': len(predicted) - len(missing),
        'missing': missing,
        'harmonic_predicted': harmonic_predicted,
        'min_harmonious': CLOSURE_MIN_HARMONIOUS,
    }


def reverse_synergy(
    user_longitudes_raw: Any,
    relation_mode: str,
    user_planet_houses: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    合盘实体化主入口：用户本命真值 + 关系人格 ⇒ 虚拟星盘 + 相位张量 + 闭合裁决。

    五重灵魂形态（E40-A）：
      · 生产四象（girlfriend / buddy / bestie / boyfriend）⇒ **对外**反向相位拟合；
      · 第五形态（self / twin_self / higher_self）⇒ **对内**本命 1:1 镜像投影（0° 全相合）。

    🔴 纯函数；缺黄经真值 ⇒ 抛 SynastryInputError（绝不返回半成品假盘）。
    """
    if relation_mode not in RELATION_MODES and relation_mode not in SELF_MODE_ALIASES:
        raise SynastryInputError(
            f'未知 relation_mode={relation_mode!r}'
            f'（生产四象：{sorted(RELATION_MODES)}；保留第五形态：{list(SELF_MODE_ALIASES)}）'
        )
    user_lon = _require_longitudes(user_longitudes_raw)
    # 🔴 E40-A：算子经**单一消费入口**取用（生产四值 ⇒ 生产表条目；第五形态 ⇒ 保留算子）
    operators = resolve_relation_operators(relation_mode)

    # 🔴 E40-A 第五形态：镜像短路（Bypass）—— 不搜索外部虚拟盘，直接本命 1:1 投影
    if is_self_mirror_mode(relation_mode):
        fit = fit_identity_mirror(user_lon)
    else:
        fit = fit_virtual_chart(user_lon, operators, user_planet_houses)
    if not fit['longitudes']:
        raise SynastryInputError('虚拟星盘拟合结果为空（输入真值不足）')

    tensor = compute_synastry_tensor(user_lon, fit['longitudes'])
    harmony = harmony_score(tensor, operators, user_planet_houses)
    closure = verify_closure(user_lon, fit['longitudes'], fit['assignments'])

    return {
        'relation_mode': relation_mode,
        'fit_mode': fit['fit_mode'],          # E40-A：reverse_synergy | identity_mapping
        'user_longitudes': user_lon,
        'virtual_chart': {
            'longitudes': fit['longitudes'],
            'signs': {p: sign_of_longitude(v) for p, v in fit['longitudes'].items()},
            'elements': {p: element_of_longitude(v) for p, v in fit['longitudes'].items()},
            'dropped': fit['dropped'],
        },
        'tensor': tensor,
        'harmony': harmony,
        'fit_assignments': fit['assignments'],
        'closure': closure,
        # 四象算子**只读快照**（与 familiar_engine 同一份真源，禁复制）
        'decision_operators': {
            'intent_zh': operators['intent_zh'],
            'primary_factors': list(operators['primary_factors']),
            'emphasis_houses': list(operators['emphasis_houses']),
            'element_preference': list(operators['element_preference']),
            'tone': operators['tone'],
        },
        'schema_version': SOUL_OS_PROTOCOL_VERSION,
    }


# ═══════════════════════════════════════════════════════════════
# 5. CLI 入口（生产实际通路 · 形态对齐 familiar_engine.py）
#    退出码: 0 成功 / 2 输入非法 / 1 引擎内部故障
# ═══════════════════════════════════════════════════════════════

def _cli(argv: Optional[List[str]] = None) -> int:
    import argparse
    import json

    parser = argparse.ArgumentParser(description='KindredSouls Synastry Engine (E38-C/D)')
    parser.add_argument('--mode', default='synergy', choices=['synergy'],
                        help='计算模式（本期仅 synergy）')
    parser.add_argument('--relation-mode', dest='relation_mode', default='girlfriend',
                        help='关系人格: girlfriend | buddy | bestie | boyfriend'
                             '（E40-A 保留第五形态: self / twin_self / higher_self）')
    parser.add_argument('--natal-longitudes', dest='natal_longitudes', default=None,
                        help='本命十星黄经真值 JSON，如 {"Sun":213.4,"Venus":88.1}')
    parser.add_argument('--planet-houses', dest='planet_houses', default=None,
                        help='宫内星真值 JSON（算子强调宫位加权），如 {"Venus":7}')
    args = parser.parse_args(argv)

    if not args.natal_longitudes:
        print('SYNASTRY_INVALID_INPUT: 缺少 --natal-longitudes（无本命真值 ⇒ 拒绝拟合）',
              file=sys.stderr)
        return 2

    try:
        longitudes = json.loads(args.natal_longitudes)
    except (ValueError, TypeError) as e:
        print(f'SYNASTRY_INVALID_INPUT: --natal-longitudes 不是合法 JSON: {e}', file=sys.stderr)
        return 2

    planet_houses = None
    if args.planet_houses:
        try:
            planet_houses = json.loads(args.planet_houses)
        except (ValueError, TypeError) as e:
            print(f'SYNASTRY_INVALID_INPUT: --planet-houses 不是合法 JSON: {e}', file=sys.stderr)
            return 2

    try:
        result = reverse_synergy(longitudes, args.relation_mode, planet_houses)
    except SynastryInputError as e:
        print(f'SYNASTRY_INVALID_INPUT: {e}', file=sys.stderr)
        return 2
    except Exception as e:  # pragma: no cover - 防御性
        print(f'SYNASTRY_ENGINE_FAILURE: {e}', file=sys.stderr)
        return 1

    print(json.dumps(result, ensure_ascii=False))
    return 0


# ═══════════════════════════════════════════════════════════════
# 6. 自测（无参数运行）
# ═══════════════════════════════════════════════════════════════

_SAMPLE = {
    'Sun': 213.4, 'Moon': 348.9, 'Mercury': 226.1, 'Venus': 175.3, 'Mars': 250.7,
    'Jupiter': 340.2, 'Saturn': 349.8, 'Uranus': 275.5, 'Neptune': 272.3, 'Pluto': 215.9,
}


def _self_test() -> None:
    # ── 相位识别 ──
    assert detect_aspect(0.0, 0.0)[0] == 'conjunction'
    assert detect_aspect(0.0, 60.0)[0] == 'sextile'
    assert detect_aspect(0.0, 90.0)[0] == 'square'
    assert detect_aspect(0.0, 120.0)[0] == 'trine'
    assert detect_aspect(0.0, 180.0)[0] == 'opposition'
    assert detect_aspect(0.0, 45.0) is None
    assert angular_distance(350.0, 10.0) == 20.0
    print('相位识别五相闭集验证通过')

    # ── 真值纪律 ──
    assert normalize_longitudes(None) == {}
    assert normalize_longitudes({'Sun': 'abc', 'Nibiru': 1.0, 42: 3.0}) == {}
    assert normalize_longitudes({'Sun': 400.0}) == {'Sun': 40.0}
    assert normalize_longitudes({'Sun': float('nan')}) == {}
    for bad in (None, {}, {'Nibiru': 10.0}):
        try:
            reverse_synergy(bad, 'girlfriend')
            raise AssertionError('缺黄经真值必须抛错')
        except SynastryInputError:
            pass
    print('真值纪律验证通过（非法条目丢弃 / 全缺抛错，绝不伪造）')

    # ── 四象拟合 + 闭合（全模式）──
    for mode in sorted(RELATION_MODES):
        r = reverse_synergy(_SAMPLE, mode)
        assert r['closure']['ok'], f'{mode} 闭合校验未通过: {r["closure"]}'
        assert r['closure']['missing'] == [], f'{mode} 预测相位未被独立复现'
        vc = r['virtual_chart']['longitudes']
        assert set(vc) <= set(NATAL_PLANETS) and len(vc) == 10, f'{mode} 虚拟星盘不齐备'
        assert r['tensor']['total'] > 0, f'{mode} 张量为空'
        # 幂等
        assert reverse_synergy(_SAMPLE, mode) == r, f'{mode} 拟合非幂等'
        print(f"  {mode:11s} 虚拟盘齐备={len(vc)} 相位={r['tensor']['total']:3d} "
              f"调和={r['tensor']['harmonious']:3d} 分数={r['harmony']['score']:7.3f} "
              f"闭合={r['closure']['ok']}")
    print('四象反向拟合 + 闭合校验验证通过')

    # ── 算子确实在塑造虚拟盘（元素偏好**几何诚实**地起作用）──
    gf = reverse_synergy(_SAMPLE, 'girlfriend')
    bu = reverse_synergy(_SAMPLE, 'buddy')
    assert gf['virtual_chart']['longitudes'] != bu['virtual_chart']['longitudes'], \
        '不同人格必须拟合出不同虚拟星盘（否则算子实体化形同虚设）'

    reshaped = 0            # 「锚不在偏好、却被偏好拉走」的次数（证明偏好真在重塑，而非空转）
    pref_honored = 0        # 「偏好调和可达 且 必被采纳」的次数（证明偏好不被忽略）
    for mode in sorted(RELATION_MODES):
        r = reverse_synergy(_SAMPLE, mode)
        pref = set(r['decision_operators']['element_preference'])
        for a in r['fit_assignments']:
            anchor_elem = element_of_longitude(r['user_longitudes'][a['anchor']])
            reach = set(harmonious_element_reachable(anchor_elem))
            # ① 拟合只采信调和相：结果元素必落在调和可达集内（square/opposition 永不入选）
            assert a['aspect'] in HARMONIOUS_ASPECTS, \
                f'{mode}/{a["planet"]} 采信了非调和相 {a["aspect"]}（调和优先被破坏）'
            assert a['element'] in reach, (
                f'{mode}/{a["planet"]} 结果元素 {a["element"]} 越出调和可达集 '
                f'{sorted(reach)}（锚 {a["anchor"]}@{anchor_elem}）⇒ 疑似动用硬相凑元素')
            # ② 偏好若在调和可达集内 ⇒ 必被采纳（元素偏好确实参与决策）
            if pref & reach:
                assert a['element'] in pref, (
                    f'{mode}/{a["planet"]} 偏好 {sorted(pref)} 落在可达集 {sorted(reach)} '
                    f'内却未被采纳 ⇒ 元素偏好形同虚设'
                )
                pref_honored += 1
            # ③ 计数「偏好主动重塑」（锚不在偏好、结果却在偏好）
            if anchor_elem not in pref and a['element'] in pref:
                reshaped += 1
    assert reshaped > 0, '四象均未出现「元素偏好主动重塑」⇒ 偏好形同虚设'
    assert pref_honored > 0, '四象均未出现「偏好可达必被采纳」⇒ 偏好未被真正参与'

    # ④ 诚实性：水象主导盘 + buddy（火/风）⇒ 几何不可调和到达，引擎**如实**保留同频共振
    bud = reverse_synergy(_SAMPLE, 'buddy')
    bpref = set(bud['decision_operators']['element_preference'])
    bhit = sum(1 for a in bud['fit_assignments'] if a['element'] in bpref)
    b_pin = sum(1 for a in bud['fit_assignments']
                if element_of_longitude(bud['user_longitudes'][a['anchor']]) in bpref)
    assert bhit >= b_pin, f'水象主导盘 buddy：偏好未使已满足的锚倒退（{bhit} < {b_pin}）'
    assert bhit < 5, (
        f'buddy 火/风偏好在水象主导盘上不可调和到达，命中应如实 <5/10（实得 {bhit}）'
        '—— 若 ≥5 说明引擎降级到硬相凑元素，违背真值纪律'
    )
    print(f'算子实体化验证通过（调和可达集内偏好必被采纳={pref_honored} 次；'
          f'偏好主动重塑={reshaped} 次；buddy 水象主导盘如实 {bhit}/10 不伪造）')

    # ── 张量对四象敏感（同一用户盘，分数随人格不同）──
    scores = {m: reverse_synergy(_SAMPLE, m)['harmony']['score'] for m in sorted(RELATION_MODES)}
    assert len(set(scores.values())) == 4, f'四象调和分未隔离: {scores}'
    print(f'四象调和分隔离验证通过: {scores}')

    # ── E40-A：第五形态「数字自己」镜像短路（inert 保留）──
    print('\n=== E40-A 第五形态「数字自己」镜像短路 ===')
    for m in sorted(RELATION_MODES):
        assert reverse_synergy(_SAMPLE, m)['fit_mode'] == REVERSE_SYNERGY_MODE, \
            f'{m} 生产四象必须走反向相位拟合（fit_mode 漂移）'
    self_r = reverse_synergy(_SAMPLE, 'self')
    assert self_r['fit_mode'] == IDENTITY_MIRROR_MODE, '第五形态必须走镜像投影'
    # ① 虚拟盘 ≡ 用户本命盘（1:1 投影，逐星重合）
    assert self_r['virtual_chart']['longitudes'] == self_r['user_longitudes'], \
        '第五形态虚拟盘必须与用户本命盘逐星重合（Identity Mapping）'
    assert self_r['virtual_chart']['dropped'] == [], '真值齐备时不得有缺星'
    # ② 同命星对全为 0° 紧密合相
    assert all(a['aspect'] == 'conjunction' for a in self_r['fit_assignments']), \
        '第五形态同命星对必须全为 0° 合相'
    assert all(a['mirror'] is True for a in self_r['fit_assignments']), '镜像标记缺失'
    # ③ 闭合校验**独立生效**（不走特殊断言旁路）：10/10 全绿
    assert self_r['closure']['ok'], f'第五形态闭合校验未通过: {self_r["closure"]}'
    assert self_r['closure']['missing'] == [], '第五形态预测相位未被独立复现'
    assert self_r['closure']['harmonic_predicted'] == len(self_r['fit_assignments']), \
        '第五形态预测相位应全为调和相'
    # ④ 张量与调和度闭环（张量键契约不变）
    assert set(self_r['tensor']) == {'aspects', 'matrix', 'counts', 'total', 'harmonious', 'hard'}
    assert self_r['tensor']['harmonious'] >= len(self_r['fit_assignments']), \
        '第五形态调和相数量应至少等于同命星对数（0° 全相合）'
    assert self_r['harmony']['score'] > 0, '第五形态调和度应为正（闭环高分）'
    # ⑤ 算子快照 = 保留层真值
    assert self_r['decision_operators']['emphasis_houses'] == [1], '第五形态强调宫位应为 [1]（命宫）'
    assert self_r['decision_operators']['primary_factors'] == ['sun', 'moon', 'ascendant']
    assert self_r['decision_operators']['element_preference'] == [SELF_ELEMENT_SENTINEL]
    # ⑥ 别名等价（twin_self / higher_self 与 self 同结果）
    for alias in ('twin_self', 'higher_self'):
        ali = reverse_synergy(_SAMPLE, alias)
        assert ali['fit_mode'] == IDENTITY_MIRROR_MODE, f'{alias} 别名未走镜像投影'
        assert ali['virtual_chart'] == self_r['virtual_chart'], f'{alias} 虚拟盘与 self 不一致'
        assert ali['tensor'] == self_r['tensor'], f'{alias} 张量与 self 不一致'
        assert ali['closure'] == self_r['closure'], f'{alias} 闭合与 self 不一致'
    # ⑦ 幂等
    assert reverse_synergy(_SAMPLE, 'self') == self_r, '第五形态拟合非幂等'
    print(f"  虚拟盘={len(self_r['virtual_chart']['longitudes'])}/10 1:1 重合 · "
          f"合相={self_r['tensor']['counts']['conjunction']} · 调和={self_r['tensor']['harmonious']} · "
          f"分数={self_r['harmony']['score']:.3f} · 闭合={self_r['closure']['ok']} "
          f"({self_r['closure']['observed']}/{self_r['closure']['predicted']})")

    # ── 非法 relation_mode ──
    try:
        reverse_synergy(_SAMPLE, 'pet')
        raise AssertionError('非法 relation_mode 必须抛错')
    except SynastryInputError:
        print('非法 relation_mode 正确抛错')

    print('\n全部自测通过（E38-C 相位张量 + E38-D 反向拟合/闭合校验/算子实体化 + E40-A 第五形态镜像）')


if __name__ == '__main__':
    if len(sys.argv) > 1:
        sys.exit(_cli())
    _self_test()
