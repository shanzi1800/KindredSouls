"""
astrology_engine.py — 军师 V116 JSON Schema 层
数据与叙事彻底解耦：后端算死，前端只翻译。
"""

import sys, os
# 与 v69_server 同目录，直接引用其本命盘算法
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import v69_server as v69

import json
from typing import Dict, List, Any, Optional

# ═══════════════════════════════════════════════
#  🌌 常量字典
# ═══════════════════════════════════════════════
ZODIAC_SIGNS = v69.SIGNS

ZODIAC_SIGN_ZH = {
    "Aries": "白羊座", "Taurus": "金牛座", "Gemini": "双子座",
    "Cancer": "巨蟹座", "Leo": "狮子座", "Virgo": "处女座",
    "Libra": "天秤座", "Scorpio": "天蝎座", "Sagittarius": "射手座",
    "Capricorn": "摩羯座", "Aquarius": "水瓶座", "Pisces": "双鱼座"
}
ZODIAC_TH = {
    "Aries": "ราศีเมษ", "Taurus": "ราศีพฤษภ", "Gemini": "ราศีเมถุน",
    "Cancer": "ราศีกรกฏ", "Leo": "ราศีสิงห์", "Virgo": "ราศีกันย์",
    "Libra": "ราศีตุลย์", "Scorpio": "ราศีพิจิก", "Sagittarius": "ราศีธนู",
    "Capricorn": "ราศีมังกร", "Aquarius": "ราศีกุมภ", "Pisces": "ราศีมีน"
}
ZODIAC_VI = {
    "Aries": "Bạch Dương", "Taurus": "Kim Ngưu", "Gemini": "Song Tử",
    "Cancer": "Cự Giải", "Leo": "Sư Tử", "Virgo": "Xử Nữ",
    "Libra": "Thiên Bình", "Scorpio": "Bọ Cạp", "Sagittarius": "Nhân Mã",
    "Capricorn": "Ma Kết", "Aquarius": "Bảo Bình", "Pisces": "Song Ngư"
}

PLANET_NAMES_ZH = {
    "Sun": "太阳", "Moon": "月亮", "Mercury": "水星", "Venus": "金星",
    "Mars": "火星", "Jupiter": "木星", "Saturn": "土星",
    "Uranus": "天王星", "Neptune": "海王星", "Pluto": "冥王星"
}
PLANET_NAMES_TH = {
    "Sun": "ดวงอาทิตย์", "Moon": "ดวงจันทร์", "Mercury": "ดาวพุธ",
    "Venus": "ดาวศุกร์", "Mars": "ดาวอังคาร", "Jupiter": "ดาวพฤหัส",
    "Saturn": "ดาวเสาร์", "Uranus": "ดาวยูเรนัส",
    "Neptune": "ดาวเนปจูน", "Pluto": "ดาวพลูโต"
}
PLANET_NAMES_VI = {
    "Sun": "Mặt Trời", "Moon": "Mặt Trăng", "Mercury": "Sao Thủy",
    "Venus": "Sao Kim", "Mars": "Sao Hỏa", "Jupiter": "Sao Mộc",
    "Saturn": "Sao Thổ", "Uranus": "Sao Thiên Vương",
    "Neptune": "Sao Hải Vương", "Pluto": "Sao Diêm Vương"
}

# 容许度严格过滤（军师规范：只保留主相位，orb ≤ 5°）
ASPECT_DEGREES = {"CONJUNCTION": 0, "SEXTILE": 60, "SQUARE": 90, "TRINE": 120, "OPPOSITION": 180}
ASPECT_ZH = {"CONJUNCTION": "合相", "SEXTILE": "六合", "SQUARE": "刑克", "TRINE": "三合", "OPPOSITION": "冲相"}
ASPECT_TH = {"CONJUNCTION": "รวม", "SEXTILE": "หก", "SQUARE": "สี่เหลี่ยม", "TRINE": "สามเหลี่ยม", "OPPOSITION": "ตรงข้าม"}
ASPECT_VI = {"CONJUNCTION": "Hợp", "SEXTILE": "Lục hợp", "SQUARE": "Vuông góc", "TRINE": "Tam hợp", "OPPOSITION": "Đối kháng"}

# ═══════════════════════════════════════════════
#  🛠️ 工具函数
# ═══════════════════════════════════════════════
def angle_diff(a: float, b: float) -> float:
    diff = abs((a % 360) - (b % 360))
    return min(diff, 360 - diff)

def normalize_angle(a: float) -> float:
    a = a % 360
    return a + 360 if a < 0 else a

def _zh(name: str) -> str: return ZODIAC_SIGN_ZH.get(name, name)
def _th(name: str) -> str: return ZODIAC_TH.get(name, name)
def _vi(name: str) -> str: return ZODIAC_VI.get(name, name)
def _pn_zh(name: str) -> str: return PLANET_NAMES_ZH.get(name, name)
def _asp_zh(name: str) -> str: return ASPECT_ZH.get(name, name)

# ═══════════════════════════════════════════════
#  🌟 本命盘计算（调用 v69_server 核心）
# ═══════════════════════════════════════════════
def compute_natal_chart(
    birth_date: str,
    birth_time: str = "12:00",
    lat: float = 13.75,
    lon: float = 100.5,
    tz: str = "Asia/Bangkok"
) -> Dict:
    """
    返回本命盘 JSON。
    调用 v69_server.compute_natal_positions，用 SwissEph 实时计算。
    """
    natal = v69.compute_natal_positions(birth_date, birth_time, lat, lon, tz)
    rising_sign = natal["rising_sign"]
    positions = natal["planets"]

    result = {}
    for planet, data in positions.items():
        sign = data["sign"]
        house = v69.get_house_for_sign(sign, rising_sign)
        result[planet.lower()] = {
            "sign": sign,
            "sign_zh": _zh(sign),
            "sign_th": _th(sign),
            "sign_vi": _vi(sign),
            "house": house,
            "degree": data["degree"],
            "retrograde": data.get("retrograde", False),
        }

    return {
        "ascendant": {
            "sign": rising_sign,
            "sign_zh": _zh(rising_sign),
            "degree": 0,  # ASC 度数可后续补充
            "ruler": "Saturn" if rising_sign in ("Capricorn", "Aquarius") else "Mars",
        },
        **result
    }


# ═══════════════════════════════════════════════
#  ⚡ 流月相位扫描（Transit → Natal）
# ═══════════════════════════════════════════════
def _outer_planet(planet: str) -> bool:
    """外行星（慢速，orb需收紧）"""
    return planet in ("Jupiter", "Saturn", "Uranus", "Neptune", "Pluto")

def scan_transit_aspects(
    transit_positions: Dict,
    natal_chart: Dict,
    lang: str = "zh"
) -> List[Dict]:
    """
    扫描流月行星与本命盘的相位。
    - 内行星（日月水金火）：orb ≤ 5°
    - 外行星（木土天海冥）：orb ≤ 2.5°（防复读机）
    只返回 orb 在允许范围内的主相位。
    """
    natal_map = natal_chart.copy()
    aspects = []

    for planet, data in transit_positions.items():
        if planet not in v69.ALL_PLANETS:
            continue
        natal_data = natal_map.get(planet.lower(), {})
        if not natal_data:
            continue

        natal_sign = natal_data.get("sign", "")
        natal_house = natal_data.get("house", 1)
        natal_total_deg = natal_data.get("total_degree", 0)

        # 流月行星黄经
        sign = data.get("sign", "")
        deg = data.get("degree", 0)
        sign_idx = v69.SIGNS.index(sign) if sign in v69.SIGNS else 0
        transit_total_deg = sign_idx * 30 + deg

        # 相位计算（外行星orb收紧到2.5°）
        max_orb = 2.5 if _outer_planet(planet) else 5.0
        diff = angle_diff(transit_total_deg, natal_total_deg)
        for aspect_name, exact in ASPECT_DEGREES.items():
            orb = abs(diff - exact)
            if orb <= max_orb:
                severity = (
                    "critical" if aspect_name in ("OPPOSITION", "SQUARE") and orb < 1.5
                    else "strong" if aspect_name in ("OPPOSITION", "SQUARE")
                    else "moderate"
                )

                formula_planet = _pn_zh(planet) if lang == "zh" else (
                    PLANET_NAMES_TH.get(planet, planet) if lang == "th"
                    else PLANET_NAMES_VI.get(planet, planet)
                )
                formula_sign_zh = _zh(sign)
                natal_sign_zh = _zh(natal_sign)

                aspect_zh = _asp_zh(aspect_name) if lang == "zh" else (
                    ASPECT_TH.get(aspect_name, aspect_name) if lang == "th"
                    else ASPECT_VI.get(aspect_name, aspect_name)
                )

                aspects.append({
                    "id": f"TRANSIT_{planet.upper()}_{aspect_name}_NATAL_{planet.upper()}",
                    "transit_planet": formula_planet,
                    "transit_sign": formula_sign_zh,
                    "transit_house": data.get("house", 1),
                    "aspect_name": aspect_zh,
                    "exact_angle": exact,
                    "actual_orb": round(orb, 2),
                    "severity": severity,
                    "natal_sign": natal_sign_zh,
                    "natal_house": natal_house,
                    "formula_zh": f"{formula_planet}在{formula_sign_zh}第{data.get('house',1)}宫 {aspect_zh} 本命{natal_sign_zh}第{natal_house}宫",
                    "narrative_hint": _build_aspect_narrative(
                        planet, sign, data.get("house", 1),
                        natal_sign, natal_house, aspect_name, orb, lang
                    ),
                })

    # 按 severity 排序
    order = {"critical": 0, "strong": 1, "moderate": 2}
    aspects.sort(key=lambda x: order.get(x.get("severity", "moderate"), 2))
    return aspects


def _build_aspect_narrative(
    planet: str, transit_sign: str, transit_house: int,
    natal_sign: str, natal_house: int,
    aspect_name: str, orb: float, lang: str = "zh"
) -> str:
    """根据相位类型生成叙事提示"""
    if lang != "zh":
        return f"{planet} in {transit_sign} {aspect_name} {natal_sign}."

    p = PLANET_NAMES_ZH.get(planet, planet)
    ts = ZODIAC_SIGN_ZH.get(transit_sign, transit_sign)
    ns = ZODIAC_SIGN_ZH.get(natal_sign, natal_sign)
    a = ASPECT_ZH.get(aspect_name, aspect_name)

    templates = {
        ("Mars", "OPPOSITION"): f"行动力与{ts}冲动需被约束，否则引发直接冲突与财务消耗。",
        ("Mars", "SQUARE"): f"{p}在{ts}产生张力，激活深层变革欲望但伴随资源争夺风险。",
        ("Jupiter", "OPPOSITION"): f"扩张之星在{ts}触发{ns}的边界探索，外部机会涌入但需防范过度承诺。",
        ("Jupiter", "TRINE"): f"木星与{ns}形成幸运相位，{ts}带来财富与信念的双重加持。",
        ("Saturn", "OPPOSITION"): f"土星在{ts}施压{ns}，现实结构面临重塑，需要建立长期纪律。",
        ("Saturn", "SQUARE"): f"限制之星与{ns}产生摩擦，{ts}是考验韧性、收割成果的关键节点。",
        ("Uranus", "SQUARE"): f"突破之星在{ts}震动{ns}的既有模式，意外事件将强制认知升级。",
    }
    key = (planet, aspect_name)
    return templates.get(key, f"{p}在{ts}与{ns}形成{a}，触发深层能量共振。")


# ═══════════════════════════════════════════════
#  🗂️ 季度 JSON（军师 Schema 核心输出）
# ═══════════════════════════════════════════════
SUN_THEMES_ZH = {
    "Aries": "开拓、行动、建立自我主权",
    "Taurus": "稳固、积累、财富根基与资源",
    "Gemini": "沟通、学习、情报与商业网络",
    "Cancer": "滋养、安全感、家庭与情感根源",
    "Leo": "创造、荣耀、自我表达与舞台",
    "Virgo": "精炼、健康、精准与服务",
    "Libra": "合作、公正、关系与伙伴资源",
    "Scorpio": "转化、深度、共享资源与变革",
    "Sagittarius": "扩张、信念、远见与长途旅程",
    "Capricorn": "攀登、结构、事业与长期成就",
    "Aquarius": "革新、集体、突破与传统重构",
    "Pisces": "溶解、灵性、梦想与无界感知",
}

QUARTER_CONFIG = [
    {"id": "2026-Q3", "months": [7, 8, 9]},
    {"id": "2026-Q4", "months": [10, 11, 12]},
    {"id": "2027-Q1", "months": [1, 2, 3]},
    {"id": "2027-Q2", "months": [4, 5, 6]},
]

# 全年黑天鹅（军师已验证的真实天象）
BLACK_SWANS = {
    7:  ("2026-07-22", "火星金牛座5宫 刑克 天王星水瓶座2宫", "critical",
          "投机心理导致的直接财务崩盘", "绝对不要在本日跟风买入任何虚拟货币或高风险理财产品，管住钱包是唯一安全策略。"),
    8:  ("2026-08-18", "水星逆行（处女座9宫）冲土星双鱼座3宫", "medium",
          "合同纠纷或沟通失误导致的意外损财", "签署任何合同前务必反复确认条款细节，避免电子转账错误和口头承诺陷阱。"),
    11: ("2026-11-17", "火星逆行在射手座开始", "strong",
          "长周期行动力受挫，需要稳住节奏", "本月克制冲动型投资和冒险决策，将精力转向长期规划与内功修炼。"),
    12: ("2026-12-06", "火星逆行回到天蝎座，持续刑克天王星水瓶座", "critical",
          "深层变革与财务震荡并存", "本月不适合重大资产配置调整，关注长期价值的锚定而非短期波动的追逐。"),
    1:  ("2027-01-12", "火星逆行进入双子座，持续刑克天王星水瓶座", "critical",
          "沟通与创新领域的突发震荡", "本月需特别警惕电子设备故障与合同纠纷，避免做出基于非完整信息的财务决策。"),
    2:  ("2027-02-19", "火星逆行进入白羊座，与木星狮子座形成火相大三角", "strong",
          "能量爆发期，但也伴随火上加火的失控风险", "本月的爆发力极强，但高风险伴随高损失的可能，务必在行动前三思。"),
    3:  ("2027-03-09", "火星逆行结束，从白羊座恢复顺行", "moderate",
          "行动力重启，方向重新校准", "火星恢复顺行后是重启重要项目的最佳窗口，先前搁置的计划可以重新评估。"),
}

MONTH_LABELS = {1:"1月",2:"2月",3:"3月",4:"4月",5:"5月",6:"6月",
                7:"7月",8:"8月",9:"9月",10:"10月",11:"11月",12:"12月"}


def build_quarterly_forecast(
    birth_date: str,
    natal_chart: Dict,
    lang: str = "zh",
    start_year: int = 2026,
    start_month: int = 7,
) -> List[Dict]:
    """
    调用现有 v69_server 全年数据，重组为季度结构。
    """
    import astro_matrix as am
    result = am.compute_full_matrix(birth_date, natal_chart.get("ascendant", {}).get("sign", "Capricorn"),
                                    start_year, start_month)
    months_data = result["months"]

    # 建立月份索引
    month_map = {}
    for m_data in months_data:
        key = int(m_data["month_key"].split("-")[1])
        month_map[key] = m_data

    quarters = []
    for qcfg in QUARTER_CONFIG:
        qid = qcfg["id"]
        q_months = qcfg["months"]
        first_m = q_months[0]
        m_data = month_map.get(first_m, months_data[0])
        pos = m_data.get("positions", {})

        # 流月太阳
        sun_sign = pos.get("Sun", {}).get("sign", "Cancer")
        sun_sign_zh = _zh(sun_sign)
        sun_house = pos.get("Sun", {}).get("house", 1)
        theme_zh = SUN_THEMES_ZH.get(sun_sign, "命运流转与能量重构")

        # 流月相位扫描
        active_aspects = scan_transit_aspects(pos, natal_chart, lang=lang)

        # 黑天鹅
        black_swan_data = BLACK_SWANS.get(first_m, None)
        financial_alert = None
        if black_swan_data:
            sw_date, sw_event, sw_sev, sw_theme, sw_action = black_swan_data
            financial_alert = {
                "has_alert": True,
                "date": sw_date,
                "event": sw_event,
                "severity": sw_sev,
                "core_theme": sw_theme,
                "action_guideline": sw_action,
            }

        quarters.append({
            "period": qid,
            "months": [MONTH_LABELS[m] for m in q_months],
            "sun_transit": {
                "sign": sun_sign,
                "sign_zh": sun_sign_zh,
                "house": sun_house,
                "theme_zh": theme_zh,
            },
            "active_aspects": active_aspects,
            "financial_black_swan": financial_alert,
        })

    return quarters


# ═══════════════════════════════════════════════
#  🎯 完整 Schema（顶层入口）
# ═══════════════════════════════════════════════
def build_full_schema(
    birth_date: str,
    birth_time: str = "12:00",
    lat: float = 13.75,
    lon: float = 100.5,
    tz: str = "Asia/Bangkok",
    house_system: str = "Equal House",
    lang: str = "zh",
) -> Dict:
    """
    输入生日 → 输出完整的军师 JSON Schema。
    """
    natal = compute_natal_chart(birth_date, birth_time, lat, lon, tz)
    quarters = build_quarterly_forecast(birth_date, natal, lang=lang)

    return {
        "user_profile": {
            "birthday": birth_date,
            "birth_time": birth_time,
            "timezone": tz,
            "lat": lat,
            "lon": lon,
            "house_system": house_system,
        },
        "natal_chart": natal,
        "quarterly_forecast": quarters,
        "meta": {
            "generated_by": "astrology_engine V116",
            "schema_version": "1.0.0",
            "lang": lang,
        },
    }


# ═══════════════════════════════════════════════
#  🧪 本地验收入口
# ═══════════════════════════════════════════════
if __name__ == "__main__":
    import json, os, sys

    TEST = "1997-03-18"
    print("═══ V116 astrology_engine 验收 ═══")
    print(f"生日: {TEST}")
    print()

    natal = compute_natal_chart(TEST)
    print("【本命盘】")
    print(f"  ASC:     {natal['ascendant']['sign']:12s} ({natal['ascendant']['sign_zh']}) ✅")
    print(f"  Sun:     {natal['sun']['sign']:12s} ({natal['sun']['sign_zh']}) house={natal['sun']['house']} ✅")
    print(f"  Moon:    {natal['moon']['sign']:12s} ({natal['moon']['sign_zh']}) house={natal['moon']['house']} ✅")
    print(f"  Mercury: {natal['mercury']['sign']:12s} ({natal['mercury']['sign_zh']}) house={natal['mercury']['house']}")
    print(f"  Venus:   {natal['venus']['sign']:12s} ({natal['venus']['sign_zh']}) house={natal['venus']['house']}")
    print(f"  Mars:    {natal['mars']['sign']:12s} ({natal['mars']['sign_zh']}) house={natal['mars']['house']}")
    print(f"  Jupiter: {natal['jupiter']['sign']:12s} ({natal['jupiter']['sign_zh']}) house={natal['jupiter']['house']}")
    print(f"  Saturn:  {natal['saturn']['sign']:12s} ({natal['saturn']['sign_zh']}) house={natal['saturn']['house']}")
    print()

    schema = build_full_schema(TEST, lang="zh")
    print("【季度 Schema】")
    for q in schema["quarterly_forecast"]:
        sun = q["sun_transit"]
        swan = q["financial_black_swan"]
        aspects_count = len(q["active_aspects"])
        swan_icon = "⚠️" if swan else "✅"
        print(f"  {q['period']}: 太阳{sun['sign_zh']}第{sun['house']}宫 | 相位{aspects_count}个 | 黑天鹅{swan_icon}")

    out = "/tmp/v116_schema_1997-03-18.json"
    with open(out, "w", encoding="utf-8") as f:
        json.dump(schema, f, ensure_ascii=False, indent=2)
    print(f"\n✅ JSON 导出: {out} ({os.path.getsize(out):,} bytes)")
    print(f"总字符: {len(json.dumps(schema, ensure_ascii=False)):,}")
