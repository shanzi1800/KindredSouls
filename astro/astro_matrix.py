#!/usr/bin/env python3
"""
V69 Astro Matrix Engine - SwissEph Powered Truth Calculator
Computes 100% accurate astrological transits using Swiss Ephemeris.
Zero hallucination: all planetary positions computed by code, not guessed by AI.
"""

import sys
import os
import math

# SwissEph ephemeris configuration:
# In Docker: download ephemeris files; fallback to Moshier (no external files needed)
_ephe_path = None
for _candidate in ['/usr/share/swissEph', '/app/ephemeris', os.path.expanduser('~/.swissEph')]:
    if os.path.isdir(_candidate):
        _ephe_path = _candidate
        break

import swisseph as swe
if _ephe_path:
    swe.set_ephe_path(_ephe_path)
else:
    # Use Moshier internal ephemeris (no external files needed)
    # Works for all planets, slight precision difference for outer planets
    swe.set_ephe_path('')  # Empty = Moshier mode

import calendar
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

# ══ V476: 时区加载提速（本地开发环境实证 2026-09-29）══
# pytz 首次 timezone() 调用在部分 macOS 环境耗时 41~44 秒(2% CPU,纯等待)，
# 且每个新进程都要重交一次税 → 星盘审计 spawn 上百个 python 时整体拖到 1 小时。
# stdlib zoneinfo 同为 IANA 数据、零耗时(实测 0.07s)。优先 zoneinfo，老 Python 回退 pytz。
try:
    from zoneinfo import ZoneInfo as _ZoneInfo
    from datetime import timezone as _dt_timezone
    _PYTZ_COMPAT = False
except ImportError:  # Python < 3.9 (老 Docker 镜像兜底)
    import pytz as _pytz
    _PYTZ_COMPAT = True

if _PYTZ_COMPAT:
    def _utc_tzinfo():
        return _pytz.UTC
else:
    def _utc_tzinfo():
        return _dt_timezone.utc

class InvalidTimeZoneError(Exception):
    """🛡️ V490: 无效 IANA 时区（拼写错 / 不存在）。

    ⚠️ 刻意继承 `Exception` 而非 `ValueError`：本文件多处宽 `except ValueError`
    （日期解析重试路径）与 `except Exception`（降级路径），若继承 ValueError
    会被前者**意外吞掉**并绕进"改用 12:00 重试"分支 ⇒ 静默产毒值。

    绝不静默兜底 —— 由上层显式处理（JS 入口转 HTTP 400 或明确告知用户）。
    历史实现（V476）对无效 tz「静默退 Asia/Bangkok/UTC」⇒ 时区拼写错会变成
    「看起来正常的错盘」，属最危险的伪造成功，已彻底废除。
    """
    pass


class InvalidCoordinateError(Exception):
    """🛡️ V490b: 非法出生坐标（类型错 / 非有限数 / 越界）。

    与 V490 的 InvalidTimeZoneError 同构：**输入非法 ⇒ 显式失败，绝不静默产毒值**。
    历史行为（2026-10-01 实测）有两条静默路，均已废除：
      · `lat=null` → argparse `float("null")` 失败（退出码 2）→ JS 端不识别 →
        `Falling back to Cancer rising` ⇒ **伪造巨蟹座上升出盘**
      · `lat=91`  → argparse 收下、**无范围校验** → 照常算盘并返回 200
        （实测 `{"lat":91.0,"rising_sign":"Virgo","ascendant_deg":178.68}`）

    ⚠️ 同样继承 `Exception`（非 ValueError）：本文件多处 `except ValueError` / `except Exception`
    降级路径，继承 ValueError 会被意外吞掉 ⇒ 又变成静默降级。
    """
    pass


# 合法范围（闭区间），与 JS 侧 src/coord-validator.js 的 COORD_RANGE 保持一致
_LAT_RANGE = (-90.0, 90.0)
_LON_RANGE = (-180.0, 180.0)


def validate_coordinates(lat, lon):
    """🛡️ V490b: 坐标强校验（Python 侧哨兵，与 JS src/coord-validator.js 同契约）。

    返回归一后的 (lat, lon) 浮点元组；非法一律抛 InvalidCoordinateError。
    ⚠️ 刻意**不用** `float(x)` 的宽松语义兜底（如 None→0.0），bool 也显式拒绝
       （`float(True) == 1.0` 是类型洗白，与 `Number(null)===0` 同类的隐患）。
    """
    import numbers as _numbers
    out = []
    for name, val, (lo, hi) in (('lat', lat, _LAT_RANGE), ('lon', lon, _LON_RANGE)):
        if isinstance(val, bool) or not isinstance(val, (int, float, _numbers.Real)):
            raise InvalidCoordinateError(f'INVALID_COORDINATES: {name}={val!r} 非数值')
        f = float(val)
        if f != f or f in (float('inf'), float('-inf')):   # NaN / ±Inf（无需 math 依赖）
            raise InvalidCoordinateError(f'INVALID_COORDINATES: {name}={val!r} 非有限数值')
        if f < lo or f > hi:
            raise InvalidCoordinateError(f'INVALID_COORDINATES: {name}={f} 超出合法范围 [{lo}, {hi}]')
        out.append(f)
    return out[0], out[1]


def _localize_dt(dt_naive, tzname):
    """把 naive datetime 挂上时区。zoneinfo 直接 replace；pytz 走 localize。

    🛡️ V490: **无效 tzname 一律抛 InvalidTimeZoneError** —— 删除历史「静默退
    Asia/Bangkok / UTC」兜底链（且旧实现里 zoneinfo 分支与 pytz 分支**兜底链不一致**：
    前者无 Bangkok 兜底 ⇒ 换运行环境结果就变）。

    原因（2026-10-01 实测）：静默退 UTC 会把「时区拼写错」变成「看起来正常的错盘」
    —— 实测 `America/Agentina/Ushuaia`（应为 Argentina）→ 上升点偏差 48.82°、
    上升星座 Leo→Gemini，而接口仍返回 200 success，用户与调用方**双盲**。

    时区的三级回退（① 规范化/typo ② 按 lat/lon 最近邻推定 ③ 显式 400）统一在
    **JS 入口 `src/tz-resolver.js`** 完成；此处只做**哨兵**：宁可抛错，绝不产毒值。
    """
    if not tzname:
        raise InvalidTimeZoneError('INVALID_TIMEZONE: <empty>')
    if not _PYTZ_COMPAT:
        try:
            return dt_naive.replace(tzinfo=_ZoneInfo(tzname))
        except Exception as e:
            raise InvalidTimeZoneError(f'INVALID_TIMEZONE: {tzname}') from e
    try:
        return _pytz.timezone(tzname).localize(dt_naive)
    except Exception as e:
        raise InvalidTimeZoneError(f'INVALID_TIMEZONE: {tzname}') from e

# ── Zodiac & House Constants ──────────────────────────────────────────────────
SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
         'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']

SIGN_ELEMENTS = {
    'Aries': 'Fire', 'Leo': 'Fire', 'Sagittarius': 'Fire',
    'Taurus': 'Earth', 'Virgo': 'Earth', 'Capricorn': 'Earth',
    'Gemini': 'Air', 'Libra': 'Air', 'Aquarius': 'Air',
    'Cancer': 'Water', 'Scorpio': 'Water', 'Pisces': 'Water',
}

# Equal House mapping for Cancer Rising (AC = 0° Cancer)
# House 1 = Cancer, House 2 = Leo, House 3 = Virgo, ... House 12 = Gemini
CANCER_RISING_HOUSES = {
    'Cancer': 1, 'Leo': 2, 'Virgo': 3, 'Libra': 4, 'Scorpio': 5,
    'Sagittarius': 6, 'Capricorn': 7, 'Aquarius': 8, 'Pisces': 9,
    'Aries': 10, 'Taurus': 11, 'Gemini': 12,
}

# Generic rising sign house mapping (parametrizable)
def get_house(sign: str, rising_sign: str) -> int:
    """Return house number (1-12) for a given sign, given the rising sign.
    🛠️ V142: 修正 off-by-one bug — 旧公式 (sign_idx - rising_idx + 1) % 12 + 1
    多了一个 +1，导致所有非 Cancer 上升用户宫位偏 1 宫。
    标准 Whole Sign: rising_sign 为第1宫，沿黄道顺序递增。
    已验证 100% 匹配 Cancer 权威表 + 军师 Virgo 要求(Cancer=11,Leo=12)。"""
    rising_idx = SIGNS.index(rising_sign)
    sign_idx = SIGNS.index(sign)
    house = (sign_idx - rising_idx) % 12 + 1
    return house

# ── SwissEph Core Calculations ────────────────────────────────────────────────

def get_planet_pos(jd: float, planet: int) -> tuple:
    """Return (degree, speed) for a planet at Julian Day."""
    r = swe.calc_ut(jd, planet)
    return r[0][0], r[0][3]  # longitude degrees, daily speed


def get_sign(degree: float) -> str:
    idx = int(degree // 30) % 12
    return SIGNS[idx]


def get_sign_deg(degree: float) -> tuple:
    sign_idx = int(degree // 30) % 12
    deg_in_sign = degree % 30
    return SIGNS[sign_idx], deg_in_sign


def format_pos(degree: float) -> str:
    sign, deg = get_sign_deg(degree)
    return f"{sign} {deg:.2f}°"


def is_retrograde(speed: float) -> bool:
    """Negative speed = retrograde."""
    return speed < 0


def find_retrograde_stations(year: int, month_start: int, month_end: int,
                              planet: int, planet_name: str) -> List[Dict]:
    """Scan a date range for retrograde stations (speed near zero = station)."""
    stations = []
    day = 1
    last_speed = None
    last_pos = None
    current = datetime(year, month_start, 1)
    end = datetime(year, month_end + 1, 1) if month_end >= month_start else datetime(year + 1, month_end + 1, 1)
    
    while current < end:
        jd = swe.julday(current.year, current.month, current.day, 12)
        pos, speed = get_planet_pos(jd, planet)
        
        if last_speed is not None:
            # Station: speed crosses zero (changes sign)
            if (last_speed > 0 and speed < 0) or (last_speed < 0 and speed > 0):
                station_type = 'RETROGRADE' if speed < 0 else 'DIRECT'
                # Find exact day of station by binary search
                exact_jd = find_station_day(current - timedelta(days=1), current + timedelta(days=1), planet, station_type)
                exact_dt = swe.revjul(exact_jd)
                stations.append({
                    'type': station_type,
                    'date': f"{int(exact_dt[0]):04d}-{int(exact_dt[1]):02d}-{int(exact_dt[2]):02d}",
                    'planet': planet_name,
                    'position': format_pos(pos),
                })
        last_speed = speed
        current += timedelta(days=1)
    return stations


def find_station_day(start_dt: datetime, end_dt: datetime, planet: int, station_type: str) -> float:
    """Binary search for exact station day."""
    for _ in range(10):  # converge in 10 iterations
        mid = start_dt + (end_dt - start_dt) / 2
        jd = swe.julday(mid.year, mid.month, mid.day, 12)
        _, speed = get_planet_pos(jd, planet)
        if station_type == 'RETROGRADE':
            if speed < 0:
                end_dt = mid
            else:
                start_dt = mid
        else:
            if speed > 0:
                end_dt = mid
            else:
                start_dt = mid
    return swe.julday(start_dt.year, start_dt.month, start_dt.day, 12)


# ── Monthly Astro Matrix Computation ─────────────────────────────────────────

def compute_monthly_matrix(year: int, month: int, rising_sign: str = 'Cancer', cusps: List[float] = None,
                           tz: str = 'Asia/Bangkok', moon_weeks: bool = False) -> Dict[str, Any]:
    """Compute the complete astro matrix for one month."""
    # Reference date for the month
    ref_date = datetime(year, month, 15)
    
    # Get all planet positions
    jd = swe.julday(year, month, 15, 12)
    
    planets = {
        'Sun': swe.SUN, 'Moon': swe.MOON, 'Mercury': swe.MERCURY,
        'Venus': swe.VENUS, 'Mars': swe.MARS, 'Jupiter': swe.JUPITER,
        'Saturn': swe.SATURN, 'Uranus': swe.URANUS, 'Neptune': swe.NEPTUNE,
        'Pluto': swe.PLUTO,
    }
    
    positions = {}
    for name, pid in planets.items():
        deg, speed = get_planet_pos(jd, pid)
        sign = get_sign(deg)
        house = get_house_from_cusps(deg, cusps) if cusps is not None else get_house(sign, rising_sign)
        positions[name] = {
            'sign': sign,
            'degree': round(deg % 30, 2),
            'house': house,
            'retrograde': is_retrograde(speed),
            'element': SIGN_ELEMENTS.get(sign, 'Unknown'),
        }
    
    # Mercury retrograde status for this month
    mercury = positions['Mercury']
    mercury_status = 'RETROGRADE' if mercury['retrograde'] else 'DIRECT'
    
    # Mars-Saturn aspect detection (approximate)
    mars_deg = swe.calc_ut(jd, swe.MARS)[0][0]
    sat_deg = swe.calc_ut(jd, swe.SATURN)[0][0]
    mars_sat_diff = abs(mars_deg - sat_deg)
    if mars_sat_diff > 180:
        mars_sat_diff = 360 - mars_sat_diff
    mars_sat_aspect = None
    if 85 <= mars_sat_diff <= 95:
        mars_sat_aspect = 'SQUARE'
    elif 115 <= mars_sat_diff <= 125:
        mars_sat_aspect = 'OPPOSITION'
    
    # Sun-Jupiter aspect
    jup_deg = swe.calc_ut(jd, swe.JUPITER)[0][0]
    sun_sign_idx = SIGNS.index(positions['Sun']['sign'])
    sun_total_deg = sun_sign_idx * 30 + positions['Sun']['degree']
    jup_sign_idx = int(jup_deg // 30) % 12
    jup_total_deg = jup_sign_idx * 30 + (jup_deg % 30)
    exact_diff = abs(sun_total_deg - jup_total_deg)
    if exact_diff > 180:
        exact_diff = 360 - exact_diff
    sun_jup_aspect = 'CONJUNCTION' if exact_diff < 10 else None
    
    # Mars-Uranus aspect (Black Swan trigger)
    ur_deg = swe.calc_ut(jd, swe.URANUS)[0][0]
    mars_ur_diff = abs(mars_deg - ur_deg)
    if mars_ur_diff > 180:
        mars_ur_diff = 360 - mars_ur_diff
    mars_ur_aspect = 'SQUARE' if 85 <= mars_ur_diff <= 95 else None
    
    # Build macro energy description
    macro_energy = build_macro_energy(positions, year, month)
    
    # Find peak revenue window — 🛡️ V492/R6: 真实相位实算（多观测对象链, D3 严禁 null）
    peak_windows = find_peak_windows(year, month)
    
    # Find black swan days
    black_swan_days = find_crisis_days(year, month)

    # ── V177-P2: Weekly Sun mid-point positions (W1-W4) ──
    # 喂给 P1 数据块，让 LLM 照单抄每周太阳，杜绝本命/流年同名星座混淆幻觉
    # 每周中点：第1周4日、第2周11日、第3周18日、第4周25日（2月取月末）
    import calendar as _cal
    _last_day = _cal.monthrange(year, month)[1]
    _week_days = [4, 11, 18, min(25, _last_day)]
    _weekly_sun = {}
    for _wi, _wd in enumerate(_week_days, 1):
        _wjd = swe.julday(year, month, _wd, 12)
        _wdeg, _ = get_planet_pos(_wjd, swe.SUN)
        _wsign = get_sign(_wdeg)
        _whouse = get_house_from_cusps(_wdeg, cusps) if cusps is not None else get_house(_wsign, rising_sign)
        _weekly_sun[f'w{_wi}'] = {'sign': _wsign, 'house': _whouse, 'retrograde': False}
    
    month_names = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    return {
        'month_key': f"{year}-{month:02d}",
        'month_name': f"{month_names[month]} {year}",
        'rising_sign': rising_sign,
        'positions': positions,
        # ── V134: Flat top-level fields for v69_client.js buildPerMonthData ──
        'sun': {'sign': positions['Sun']['sign'], 'house': positions['Sun']['house'], 'retrograde': False},
        'moon': {'sign': positions['Moon']['sign'], 'house': positions['Moon']['house'], 'retrograde': False},  # Moon NEVER retrograde
        'mercury': {'sign': mercury['sign'], 'house': mercury['house'], 'retrograde': mercury['retrograde']},
        'venus': {'sign': positions['Venus']['sign'], 'house': positions['Venus']['house'], 'retrograde': positions['Venus']['retrograde']},
        'mars': {'sign': positions['Mars']['sign'], 'house': positions['Mars']['house'], 'retrograde': positions['Mars']['retrograde']},
        'jupiter': {'sign': positions['Jupiter']['sign'], 'house': positions['Jupiter']['house'], 'element': positions['Jupiter']['element'], 'retrograde': positions['Jupiter']['retrograde']},
        'saturn': {'sign': positions['Saturn']['sign'], 'house': positions['Saturn']['house'], 'retrograde': positions['Saturn']['retrograde']},
        'uranus': {'sign': positions['Uranus']['sign'], 'house': positions['Uranus']['house'], 'retrograde': positions['Uranus']['retrograde']},
        'neptune': {'sign': positions['Neptune']['sign'], 'house': positions['Neptune']['house'], 'retrograde': positions['Neptune']['retrograde']},
        'pluto': {'sign': positions['Pluto']['sign'], 'house': positions['Pluto']['house'], 'retrograde': positions['Pluto']['retrograde']},
        'macro_energy': macro_energy,
        'mercury_status': mercury_status,
        'mars_saturn_aspect': mars_sat_aspect,
        'mars_uranus_aspect': mars_ur_aspect,
        # 🛡️ V492/R6c: 补上 sun_jupiter_aspect 生产者——js 侧 (v69_client.js:1229) 一直在读此字段，旧版恒 null
        'sun_jupiter_aspect': sun_jup_aspect,
        # 🛡️ V492/D4: 废弃单数 peak_window，统一复数 peak_windows（js 侧读复数，旧版恒 []）
        'peak_windows': peak_windows,
        'black_swan_days': black_swan_days,
        # ── V177-P2: Weekly Sun (W1-W4) for P1 data block ──
        'w1': _weekly_sun['w1'],
        'w2': _weekly_sun['w2'],
        'w3': _weekly_sun['w3'],
        'w4': _weekly_sun['w4'],
        # ── V433: 月亮周级真值（方案 A）——仅报告月计算，避免 12 月全算的冗余开销 ──
        'moon_weeks': compute_moon_weeks(year, month, tz, cusps, rising_sign) if moon_weeks else None,
    }


def build_macro_energy(positions: Dict, year: int, month: int) -> str:
    """Build the macro energy description based on current planetary positions."""
    sun = positions['Sun']
    jup = positions['Jupiter']
    sat = positions['Saturn']
    mars = positions['Mars']
    
    parts = []
    
    # Sun's house
    sun_house_desc = {
        1: 'personal identity and self-worth',
        2: 'income, earnings, and material security',
        3: 'communication, siblings, and daily commerce',
        4: 'home, land, and family wealth foundations',
        5: 'creative ventures, speculation, and children',
        6: 'health, service, and daily labor income',
        7: 'partnerships, contracts, and business alliances',
        8: 'shared resources, debt, and inheritances',
        9: 'wisdom, publishing, and foreign income',
        10: 'career, public reputation, and authority',
        11: 'networks, groups, and collective income',
        12: 'subconscious, hidden structures, and behind-the-scenes gains',
    }
    sun_desc = sun_house_desc.get(sun['house'], f"House {sun['house']}")
    
    # Jupiter energy
    jup_desc = f"Jupiter in {jup['sign']} (House {jup['house']})"
    if jup['retrograde']:
        jup_desc += ' retrograde — inner review of expansion'
    
    # Saturn energy
    sat_desc = f"Saturn in {sat['sign']} (House {sat['house']})"
    if sat['retrograde']:
        sat_desc += ' retrograde — karmic restructuring'
    
    return f"Sun transits {sun['sign']}, activating {sun_desc}. {jup_desc}. {sat_desc}."


_PLANET_NAMES = {
    swe.SUN: 'Sun', swe.MOON: 'Moon', swe.MERCURY: 'Mercury', swe.VENUS: 'Venus',
    swe.MARS: 'Mars', swe.JUPITER: 'Jupiter', swe.SATURN: 'Saturn',
    swe.URANUS: 'Uranus', swe.NEPTUNE: 'Neptune', swe.PLUTO: 'Pluto',
}

# 🛡️ V492/D3: 扩大相位观测对象链——多组「个人行星 × 吉星」组合逐日实算，
#   保证每月必有 1~3 天真实窗口（严禁 null / 伪桩）。
_PEAK_PAIRS = None  # 延迟初始化（依赖 swe 常量）

_ASPECTS = [(0, 'conjunction'), (60, 'sextile'), (120, 'trine')]


def _peak_pairs():
    global _PEAK_PAIRS
    if _PEAK_PAIRS is None:
        _PEAK_PAIRS = [
            (swe.SUN, swe.JUPITER),      # 日木吉照（原有主窗口）
            (swe.VENUS, swe.JUPITER),    # 金木吉照（财富经典相位）
            (swe.MERCURY, swe.JUPITER),  # 水木吉照（商务/签约）
            (swe.VENUS, swe.MERCURY),    # 金水吉照（交易顺畅）
        ]
    return _PEAK_PAIRS


def find_peak_windows(year: int, month: int) -> List[Dict]:
    """🛡️ V492/R6+D3+D4: 真实相位窗口实算（多观测对象链）。

    旧 find_peak_window 两大病根：
      R6a 回退分支伪桩——无相位就把当月每天塞进窗口截前 3 天，reason 硬编
          "Sun aligns with House N"；
      R6b 真分支 reason 泄漏 SwissEph 枚举索引 "Planet 0 conjoins planet 5"。

    新实现：
      · 逐日实算 4 组吉照对（conj/sextile/trine, orb ≤ 3°），orb 最小的相位日聚类成窗；
      · 无 ≤3° 相位日时，取全月 orb 最小日 ± 邻近 orb ≤ 5° 日收拢为单窗（仍为实算，绝不空窗）；
      · 窗口 1~3 天（D3b），最多 3 个窗口（peak_windows 长度 1~3）；
      · reason 人类可读（"Venus trine Jupiter (orb 1.8°)"），绝无行星索引泄漏。
    """
    last_day = (datetime(year, month + 1, 1) if month < 12 else datetime(year + 1, 1, 1)) - timedelta(days=1)
    day_orb = []  # [(date_str, orb, p1_name, p2_name, aspect_name)]
    current = datetime(year, month, 1)
    while current <= last_day:
        jd = swe.julday(current.year, current.month, current.day, 12)
        best = None  # (orb, p1, p2, aspect)
        for p1, p2 in _peak_pairs():
            deg1, _ = get_planet_pos(jd, p1)
            deg2, _ = get_planet_pos(jd, p2)
            diff = abs(deg1 - deg2) % 360
            if diff > 180:
                diff = 360 - diff
            for angle, aname in _ASPECTS:
                orb = abs(diff - angle)
                if best is None or orb < best[0]:
                    best = (orb, p1, p2, aname)
        if best is not None:
            day_orb.append((current.strftime('%Y-%m-%d'), best[0], best[1], best[2], best[3]))
        current += timedelta(days=1)

    if not day_orb:  # 理论不可达（min-orb 恒存在），防御性保底：绝不返回空（D3 严禁 null）
        return [{
            'dates': f"{month_names_short[month]} {year}",
            'window_days': [f"{year}-{month:02d}-15"],
            'reason': 'Monthly benefic convergence (computed)',
        }]

    def _pname(p):
        return _PLANET_NAMES.get(p, 'Planet')

    def _mk_window(days):
        """窗口内取 orb 最小的 1~3 天（按 orb 升序截断），reason 取全窗最小 orb 相位。"""
        days_sorted = sorted(days, key=lambda x: x[1])
        kept = sorted(days_sorted[:3], key=lambda x: x[0])  # 天数 1~3，按日期序呈现
        b = days_sorted[0]
        return {
            'dates': f"{kept[0][0]} - {kept[-1][0]}",
            'window_days': [d[0] for d in kept],
            'reason': f"{_pname(b[2])} {b[4]} {_pname(b[3])} (orb {b[1]:.1f}°)",
        }

    # 聚类：orb ≤ 3° 的相位日按日期连续性（间隔 ≤1 天）聚簇
    hits = [d for d in day_orb if d[1] <= 3.0]
    windows = []
    if hits:
        cluster = [hits[0]]
        for d in hits[1:]:
            _prev = datetime.strptime(cluster[-1][0], '%Y-%m-%d')
            _cur = datetime.strptime(d[0], '%Y-%m-%d')
            if (_cur - _prev).days <= 1:
                cluster.append(d)
            else:
                windows.append(_mk_window(cluster))
                cluster = [d]
        windows.append(_mk_window(cluster))
    else:
        # D3 保底：全月取 orb 最小日 ± orb ≤5° 的邻近日收拢为单窗（真实计算，非伪桩）
        dmin = min(day_orb, key=lambda x: x[1])
        near = [d for d in day_orb if abs((datetime.strptime(d[0], '%Y-%m-%d')
                                           - datetime.strptime(dmin[0], '%Y-%m-%d')).days) <= 1
                and d[1] <= dmin[1] + 2.0]
        windows.append(_mk_window(near or [dmin]))

    # 🛡️ V492/D3b: 每期窗口合计 1~3 天 —— 只保留全月最优（最小 orb）单窗，
    #   其余簇丢弃（宁缺毋滥，严禁超 3 天）
    windows.sort(key=lambda w: float(w['reason'].split('orb ')[1].rstrip('°)')))
    return windows[:1]


month_names_short = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']


def find_crisis_days(year: int, month: int) -> List[Dict]:
    """Find Mars-Saturn hard aspects and Mars-Uranus crisis days."""
    crisis_days = []
    current = datetime(year, month, 1)
    last_day = (datetime(year, month + 1, 1) if month < 12 else datetime(year + 1, 1, 1)) - timedelta(days=1)
    
    prev_diff = None
    while current <= last_day:
        jd = swe.julday(current.year, current.month, current.day, 12)
        mars_deg, _ = get_planet_pos(jd, swe.MARS)
        sat_deg, _ = get_planet_pos(jd, swe.SATURN)
        ur_deg, _ = get_planet_pos(jd, swe.URANUS)
        
        for other_deg, name in [(sat_deg, 'Saturn'), (ur_deg, 'Uranus')]:
            diff = abs(mars_deg - other_deg) % 360
            if diff > 180:
                diff = 360 - diff
            # Square (90°) = crisis; watch within 5 degrees
            if 85 <= diff <= 95:
                crisis_days.append({
                    'date': current.strftime('%Y-%m-%d'),
                    'aspect': f"Mars SQUARE {name}",
                    'severity': 'HIGH',
                })
        
        current += timedelta(days=1)
    
    return crisis_days


# ── Full Year Matrix ──────────────────────────────────────────────────────────

def compute_full_matrix(birth_date: str, rising_sign: str = 'Cancer',
                        start_year: int = 2026, start_month: int = 7,
                        lat: float = 13.75, lon: float = 100.5,
                        birth_time: str = '12:00', birth_time_known: bool = True,
                        tz: str = 'Asia/Bangkok') -> Dict:
    """
    Compute the complete 12-month astro matrix.
    birth_date: 'YYYY-MM-DD' string
    Real natal cusps (Placidus) derived once and reused so transit planet
    houses map onto the user's actual natal houses (no Equal House approx).
    """
    # 🛡️ V490b: 坐标哨兵（同 compute_natal_chart）—— 非法坐标显式失败，绝不静默出盘
    lat, lon = validate_coordinates(lat, lon)
    # ── Derive real natal cusps once, reuse for all 12 transit months ──
    _cusps = None
    _hs = None
    if birth_time_known and birth_date:
        try:
            _bt = birth_time if birth_time else '12:00'
            _bd = datetime.strptime(f"{birth_date} {_bt}", '%Y-%m-%d %H:%M')
            _bd = _localize_dt(_bd, tz)  # 🛡️ V490: 无效 tz 抛 InvalidTimeZoneError(见上), 不再静默兜底
            _utc = _bd.astimezone(_utc_tzinfo())
            _jd_b = swe.julday(_utc.year, _utc.month, _utc.day, _utc.hour + _utc.minute / 60.0)
            _sdeg, _ = get_planet_pos(swe.julday(_utc.year, _utc.month, _utc.day, 12), swe.SUN)
            _ssign = get_sign(_sdeg)
            _cusps, _asc, _mc, _hs = compute_natal_cusps(_jd_b, lat, lon, True, _ssign)
        except InvalidTimeZoneError:
            raise  # 🛡️ V490: 时区无效是**致命错** —— 绝不允许降级成 _cusps=None(等宫制)静默出盘
        except Exception as _e:
            print(f"[AstroMatrix] cusp derivation failed: {_e}", file=sys.stderr)
            _cusps = None
    months = []
    year = start_year
    month = start_month
    
    for _ in range(12):
        # V433: 仅首月计算月亮周级真值（月报周次只属于当月；12 月全算纯属浪费算力）
        matrix = compute_monthly_matrix(year, month, rising_sign, _cusps,
                                        tz=tz, moon_weeks=(len(months) == 0))
        months.append(matrix)
        month += 1
        if month > 12:
            month = 1
            year += 1
    
    # 🛡️ E25-P1②: 星历编年史改为**真值派生**（原 find_all_stations 硬编码 2026-07~2028-01
    #   且只含水星 ⇒ 换财年/换盘即失效、其余行星全无）。同时产出换座表供 prompt 注入。
    try:
        chronicle = compute_ephemeris_chronicle(start_year, start_month, len(months))
    except Exception as _ce:
        print(f"[AstroMatrix] ephemeris chronicle failed: {_ce}", file=sys.stderr)
        chronicle = {'stations': [], 'by_planet': {}, 'ingresses': [], 'months': 0}

    return {
        'meta': {
            'birth_date': birth_date,
            'rising_sign': rising_sign,
            'generated_by': 'V69 SwissEph Engine',
            'version': '1.0.0',
            'house_system': _hs if _cusps is not None else 'Solar House',
            # 🛡️ V492/R5: 高纬降级便捷位——前端/后端据此注入「已启用等宫制」告知，不得静默降级
            'is_high_latitude_fallback': (_hs == 'WholeSignFallback') if _cusps is not None else False,
            'year_range': f"{start_year}-{start_month:02d} to {year}-{month-1:02d}",
        'rising_sign_source': 'from_natal',
        },
        'months': months,
        # 兼容既有消费方（v69_client.js buildFactSheet 读 retrograde_stations.mercury）
        'retrograde_stations': chronicle.get('by_planet') or {'mercury': []},
        'ephemeris_chronicle': chronicle,
    }


def find_all_stations() -> Dict:
    """⚠️ DEPRECATED（E25-P1②）: 硬编码 2026-07~2028-01 水星 —— 换财年/换盘即失效。
    保留仅为向后兼容（离线历史 harness 可能引用）; 生产路径已改 compute_ephemeris_chronicle。
    """
    mercury_stations = []
    current = datetime(2026, 7, 1)
    end = datetime(2028, 1, 1)
    
    prev_speed = None
    prev_dt = None
    
    while current < end:
        jd = swe.julday(current.year, current.month, current.day, 12)
        _, speed = get_planet_pos(jd, swe.MERCURY)
        
        if prev_speed is not None:
            if prev_speed > 0 and speed < 0:
                mercury_stations.append({
                    'planet': 'Mercury',
                    'type': 'RETROGRADE',
                    'date': current.strftime('%Y-%m-%d'),
                    'position': format_pos(get_planet_pos(jd, swe.MERCURY)[0]),
                })
            elif prev_speed < 0 and speed > 0:
                mercury_stations.append({
                    'planet': 'Mercury',
                    'type': 'DIRECT',
                    'date': current.strftime('%Y-%m-%d'),
                    'position': format_pos(get_planet_pos(jd, swe.MERCURY)[0]),
                })
        
        prev_speed = speed
        current += timedelta(days=1)
    
    return {'mercury': mercury_stations}


# ── E25-P1②: 财年星历编年史（真值派生；替换 find_all_stations 硬编码年份）─────────
# 病根（es 年报终考缺陷2 实证）: prompt 只注入 7 月水星编年史（server.js 硬编码段），
#   其余 11 个月 LLM 全靠幻觉 ⇒ 水星逆行日期 3 处编造（7/18 说成开始逆行、8/11 说成
#   转顺、2027-4/3 当月根本无站点）。正解 = 引擎确定性生成 12 个月全部站点/换座表。
_EPHEM_PLANETS = [
    ('Sun', swe.SUN), ('Mercury', swe.MERCURY), ('Venus', swe.VENUS),
    ('Mars', swe.MARS), ('Jupiter', swe.JUPITER), ('Saturn', swe.SATURN),
]


def compute_ephemeris_chronicle(start_year: int, start_month: int, months: int = 12) -> Dict:
    """E25-P1②: 财年星历编年史（逐日扫描 + 二分精化站点日）。

    返回:
      {
        'start': 'YYYY-MM', 'end': 'YYYY-MM', 'months': N,
        'stations': [{planet,type,date,position,sign}...],     # 水/金/火/木/土 逆行站
        'by_planet': {'Mercury': [...], 'Venus': [...] ...},   # 兼容 retrograde_stations 分键消费
        'ingresses': [{planet,date,from,to}...],               # 6 星换座（含太阳每月入座）
      }
    """
    stations: List[Dict] = []
    ingresses: List[Dict] = []
    # ⚠️ 键**小写**（与旧 find_all_stations 的 'mercury' 口径一致 —— v69_client.js
    #   buildFactSheet 读 retrograde_stations.mercury; 大小写不一致会让 stationArray 变成对象 ⇒ for..of 抛错）
    by_planet: Dict[str, List[Dict]] = {name.lower(): [] for name, _ in _EPHEM_PLANETS}
    prev: Dict[str, Dict] = {}
    # 🛡️ E25-P1②: 起点**前推 20 天** —— 财年首月月初常有上月结转的站点（实测 2026-06-30
    #   水星留逆，正为该财年水逆期的起点），只扫当月会漏。前推不影响月份推进口径
    #   （循环仍按自然月末推进, 末月整月覆盖）。
    cur = datetime(start_year, start_month, 1)
    day0 = cur - timedelta(days=20)
    for _i in range(months):
        m_end = cur.month + 1
        y_end = cur.year
        if m_end > 12:
            m_end = 1
            y_end += 1
        month_end_dt = datetime(y_end, m_end, 1)
        day = day0 if _i == 0 else cur
        while day < month_end_dt:
            jd = swe.julday(day.year, day.month, day.day, 12)
            for name, pid in _EPHEM_PLANETS:
                deg, speed = get_planet_pos(jd, pid)
                sign = get_sign(deg)
                p = prev.get(name)
                if p is not None:
                    if p['sign'] != sign:
                        ingresses.append({
                            'planet': name, 'date': day.strftime('%Y-%m-%d'),
                            'from': p['sign'], 'to': sign,
                        })
                    if (p['speed'] > 0) != (speed > 0) and abs(speed) > 1e-9:
                        stype = 'RETROGRADE' if speed < 0 else 'DIRECT'
                        exact_jd = find_station_day(day - timedelta(days=1), day, pid, stype)
                        ed = swe.revjul(exact_jd)
                        rec = {
                            'planet': name, 'type': stype,
                            'date': f"{int(ed[0]):04d}-{int(ed[1]):02d}-{int(ed[2]):02d}",
                            'position': format_pos(deg), 'sign': sign,
                        }
                        stations.append(rec)
                        by_planet[name.lower()].append(rec)
                prev[name] = {'sign': sign, 'speed': speed}
            day += timedelta(days=1)
        cur = month_end_dt
    last = cur - timedelta(days=1)
    return {
        'start': f"{start_year:04d}-{start_month:02d}",
        'end': f"{last.year:04d}-{last.month:02d}",
        'months': months,
        'stations': stations,
        'by_planet': by_planet,
        'ingresses': ingresses,
    }


def test_verification():
    """Test against known astronomical facts to verify correctness."""
    print("═══ V69 SwissEph Verification ═══")
    
    # Jupiter sign transitions
    for y, m, expected_sign in [
        (2026, 6, 'Cancer'), (2026, 7, 'Leo'), (2027, 1, 'Leo'), (2027, 5, 'Leo'),
    ]:
        jd = swe.julday(y, m, 15, 12)
        deg, _ = get_planet_pos(jd, swe.JUPITER)
        sign = get_sign(deg)
        status = '✅' if sign == expected_sign else '❌'
        print(f"Jupiter {y}-{m:02d}: {sign} (expected {expected_sign}) {status}")
    
    # Mercury retrograde Oct-Nov 2026
    print("\nMercury Oct-Nov 2026:")
    for d in [23, 24, 25, 11, 12, 14, 15]:
        m = 10 if d <= 31 else 11
        d_actual = d if m == 10 else d - 31
        jd = swe.julday(2026, m, d_actual, 12)
        deg, speed = get_planet_pos(jd, swe.MERCURY)
        station = ' ⭐STATION' if abs(speed) < 0.5 else (' R' if speed < 0 else ' D')
        print(f"  {2026}-{m:02d}-{d_actual:02d}: {format_pos(deg)} speed={speed:+.4f}{station}")
    
    print("\n✅ SwissEph engine verified and ready!")


# ── Sidereal Ascendant Calculator (V174) ───────────────────────────────────
# Uses Jean Meeus / Astronomical Algorithms standard formula.
import math as _math

def compute_sidereal_ascendant(jd: float, lat: float, lon: float):
    """Return (Ascendant ecliptic longitude, house_system_used) via SwissEph ascmc[0].
    
    SwissEph's ascmc[0] is the canonical Ascendant — identical across ALL
    house systems (Placidus, Equal, Whole Sign, Koch, Campanus…).
    
    Background: V174 mistakenly used Equal House cusp[6] which equals
    ascmc[0] + 180° = the Descendant, NOT the Ascendant. This caused a
    180° sign flip for all users (e.g., Aries → Libra, Taurus → Scorpio).
    
    Validation:
    - Melbourne 10:28: ascmc[0] = 27.29° Aries ✅
    - Melbourne 12:00: ascmc[0] = 45.79° Taurus ✅
    - Copenhagen 10:10: ascmc[0] = 310.60° Aquarius ✅
    
    🛠️ Dynamic Fallback (Arctic fix): Placidus (b'P') has no geometric
    solution above ~66.5° latitude (swe.houses raises swe.Error). At extreme
    latitudes we gracefully fall back to Whole Sign (b'W'), which computes
    the real Ascendant without regression for mid/low latitudes.
    """
    try:
        # 优先使用 Placidus 分宫制 (b'P') — ascmc[0] 在所有分宫制下相同
        _, ascmc = swe.houses(jd, lat, lon, b'P')
        return ascmc[0], 'Placidus'
    except swe.Error as e:
        # 极高纬度（|lat| > 66.5°）Placidus 无解 → 平滑降级为整宫制 (b'W') 算真实上升点
        _, ascmc = swe.houses(jd, lat, lon, b'W')
        print(f"[AstroMatrix] Latitude {lat} triggered Placidus exception. Fallback to WholeSign. Error: {e}", file=sys.stderr)
        return ascmc[0], 'WholeSignFallback'



# ── Natal Chart (Birth Time Required) ───────────────────────────────────────

def get_house_from_cusps(degree: float, cusps: List[float]) -> int:
    """Return house number (1-12) for an ecliptic longitude, given 12 cusp degrees.
    Works for both Placidus (unequal) and Whole/Solar House (equal) cusp arrays."""
    deg = degree % 360.0
    for i in range(12):
        start = cusps[i] % 360.0
        end = cusps[(i + 1) % 12] % 360.0
        if start <= end:
            if start <= deg < end:
                return i + 1
        else:  # wraps past 360°
            if deg >= start or deg < end:
                return i + 1
    return 1


def compute_natal_cusps(jd_birth: float, lat: float, lon: float,
                        birth_time_known: bool = True,
                        solar_sign: str = None) -> tuple:
    """Compute 12 house cusps via SwissEph.
    Returns (cusps[12], asc_deg, mc_deg, house_system_used).
    Placidus with Whole Sign fallback at extreme latitudes.
    birth_time_known=False → Solar House (1st cusp = 0° of solar_sign)."""
    if not birth_time_known:
        s_idx = SIGNS.index(solar_sign) if solar_sign in SIGNS else 0
        cusps = [(s_idx * 30 + i * 30) % 360 for i in range(12)]
        return cusps, float(cusps[0]), None, 'SolarHouse'
    try:
        c, ascmc = swe.houses(jd_birth, lat, lon, b'P')
        return list(c), float(ascmc[0]), float(ascmc[1]), 'Placidus'
    except swe.Error:
        c, ascmc = swe.houses(jd_birth, lat, lon, b'W')
        return list(c), float(ascmc[0]), float(ascmc[1]), 'WholeSignFallback'


def compute_moon_weeks(year: int, month: int, tz_str: str = 'Asia/Bangkok',
                       cusps: List[float] = None,
                       rising_sign: str = 'Cancer') -> List[Dict[str, Any]]:
    """V433 · 方案 A：月亮「周级真值」。

    【为什么需要】月亮约 13.2°/天、2.5 天换一座，月度单点快照（月中 15 日 12:00 UT）
    根本无法支撑周级陈述。实测（1988-12-31 Chatham 盘，2026-09）：
      快照 = Moon Scorpio H2，而真值 W1 = Aries→Taurus→Gemini→Cancer、
      W4 = Aquarius→Pisces→Aries→Taurus。
    生产 report 因此把「Luna en tránsito en Escorpio, su Casa 2」抄进每一周
    （W1/W3/W4 + 陷阱段共 5 次）——负向 Prompt 规则（V232 SINGLE-USE RULE）拦不住，
    因为数据本身只给「月中快照」+「扁平换座日期表」，模型必须自己把日期归进周次。

    【本函数】按用户本地时区把该月切成 W1(1-7) / W2(8-14) / W3(15-21) / W4(22-月末)：
      · start  = 该周 0 点月亮所在 (星座, 宫位)
      · legs   = 周内 (星座, 宫位) 腿序列（相邻重复已去重）
      · changes= 周内状态变化事件，本地时间精确到分钟：
                 kind='sign' 月亮换座；kind='cusp' 月亮跨宫头（星座不变，宫位变）
    【真值纪律】星座/宫位一律 SwissEph 实算；宫位用本命 Placidus 宫头，无出生时间退化为太阳宫。
    【注意】同一星座跨两宫会产生两条腿（如 Aries/H7 → Aries/H8）——这是宫位制的数学必然，合法。
    """
    def _loc(y, m, d, hh=0, mm=0, ss=0):
        # 🛡️ V490: 无效 tz 抛 InvalidTimeZoneError（不再静默退 Bangkok/UTC）
        return _localize_dt(datetime(y, m, d, hh, mm, ss), tz_str or 'Asia/Bangkok')

    def _leg_at(dt_local):
        u = dt_local.astimezone(_utc_tzinfo())
        jd = swe.julday(u.year, u.month, u.day, u.hour + u.minute / 60.0 + u.second / 3600.0)
        xx, _ = swe.calc_ut(jd, swe.MOON)
        deg = xx[0] % 360.0
        sign = SIGNS[int(deg // 30) % 12]
        house = get_house_from_cusps(deg, cusps) if cusps else get_house(sign, rising_sign)
        return {'sign': sign, 'house': house}

    def _refine(t0, t1, prev_leg):
        """二分法把 (星座,宫位) 状态跳变时刻收敛到分钟（区间内只允许一次跳变）"""
        a, b = t0, t1
        while (b - a).total_seconds() > 60:
            mid = a + (b - a) / 2
            if _leg_at(mid) != prev_leg:
                b = mid
            else:
                a = mid
        t = a + (b - a) / 2
        return t.replace(second=0, microsecond=0)

    last_day = calendar.monthrange(year, month)[1]
    week_ranges = [(1, 7), (8, 14), (15, 21), (22, last_day)]

    weeks = []
    for wi, (d0, d1) in enumerate(week_ranges, 1):
        w_start = _loc(year, month, d0, 0, 0, 0)
        w_end = _loc(year, month, d1, 23, 59, 59)
        first = _leg_at(w_start)
        legs = [first]
        changes = []
        prev = first
        cur = w_start
        while cur < w_end:
            nxt = cur + timedelta(hours=1)
            if nxt > w_end:
                nxt = w_end
            nowleg = _leg_at(nxt)
            if nowleg != prev:
                t = _refine(cur, nxt, prev)
                # 越过边界 1 分钟取新状态，杜绝「二分收敛在旧状态侧」造成的事件重复
                nxt_leg = _leg_at(t + timedelta(minutes=1))
                if nxt_leg == prev:      # 极端兜底：仍在旧状态则用区间末端状态
                    nxt_leg = nowleg
                changes.append({
                    'day': t.day,
                    'time': t.strftime('%H:%M'),
                    'kind': 'sign' if nxt_leg['sign'] != prev['sign'] else 'cusp',
                    'from_sign': prev['sign'], 'from_house': prev['house'],
                    'to_sign': nxt_leg['sign'], 'to_house': nxt_leg['house'],
                })
                legs.append(nxt_leg)
                prev = nxt_leg
            cur = nxt
        dedup = []
        for lg in legs:
            if not dedup or dedup[-1] != lg:
                dedup.append(lg)
        weeks.append({
            'week': wi,
            'from_day': d0,
            'to_day': d1,
            'start': first,
            'legs': dedup,
            'changes': changes,
        })
    return weeks


def compute_moon_ingresses(year: int, month: int, tz_str: str = 'Asia/Ho_Chi_Minh') -> List[Dict]:
    """Compute exact Moon sign-ingress dates within a given month (local tz).
    Scans hourly; records each sign change. Returns list of ingress events."""
    start_dt = _localize_dt(datetime(year, month, 1, 0, 0, 0), tz_str)  # 🛡️ V476
    if month == 12:
        end_dt = _localize_dt(datetime(year + 1, 1, 1, 0, 0, 0), tz_str)
    else:
        end_dt = _localize_dt(datetime(year, month + 1, 1, 0, 0, 0), tz_str)
    ingresses = []
    curr = start_dt
    last_sign = None
    while curr < end_dt:
        utc = curr.astimezone(_utc_tzinfo())   # 🛡️ V479: 修 V476 漏抹的裸 pytz 引用(模块级只剩 shim 内的 _pytz) → 此前必抛 NameError, moon-ingress 静默失败
        jd = swe.julday(utc.year, utc.month, utc.day, utc.hour + utc.minute / 60.0)
        xx, _ = swe.calc_ut(jd, swe.MOON)
        sign_idx = int(xx[0] // 30) % 12
        if last_sign is not None and sign_idx != last_sign:
            ingresses.append({
                'date_str': curr.strftime('%Y-%m-%d'),
                'day': curr.day,
                'to_sign': SIGNS[sign_idx],
                'time_str': curr.strftime('%H:%M'),
            })
        last_sign = sign_idx
        curr += timedelta(hours=1)
    return ingresses


def self_test_moon_weeks() -> bool:
    """V433 自证：月亮周级真值（评分表必须先自证，再报结论）。

    ① 独立复算：用 15 分钟步进的全月扫描（与实现的 1 小时粗扫 + 二分法不同路径）
       重建每周星座序列与换座分钟，逐条比对。
    ② 结构不变量：W1..W4 连续覆盖整月且首尾相接；腿序列相邻不重复。
    ③ 已知坏样本必抓：月中快照星座不足以代表 W1/W4（证明「必须喂周级数据」）。
    """
    import pytz
    ok = True
    def _chk(cond, msg):
        nonlocal ok
        print(('  ✅ ' if cond else '  ❌ ') + msg)
        if not cond:
            ok = False

    print('═══ V433 月亮周级真值 self_test ═══')
    lat, lon, tz_name = -43.9536, -176.5463, 'Pacific/Chatham'   # 极东时区：跨日/跨月边界最苛刻
    cusps = None
    try:
        _bd = pytz.timezone(tz_name).localize(datetime(1988, 12, 31, 23, 59))
        _u = _bd.astimezone(pytz.UTC)
        _jdb = swe.julday(_u.year, _u.month, _u.day, _u.hour + _u.minute / 60.0)
        _sdeg, _ = get_planet_pos(swe.julday(_u.year, _u.month, _u.day, 12), swe.SUN)
        cusps, _asc, _mc, _hs = compute_natal_cusps(_jdb, lat, lon, True, get_sign(_sdeg))
        print(f'  用盘：1988-12-31 23:59 {tz_name} | 宫位制 {_hs}')
    except Exception as e:
        print(f'  用盘 cusps 计算失败（退化为太阳宫）: {e}')

    YEAR, MONTH = 2026, 9
    weeks = compute_moon_weeks(YEAR, MONTH, tz_name, cusps, get_sign(_sdeg) if cusps else 'Cancer')
    tz = pytz.timezone(tz_name)

    def _leg(dt_local):
        u = dt_local.astimezone(pytz.UTC)
        jd = swe.julday(u.year, u.month, u.day, u.hour + u.minute / 60.0)
        deg = swe.calc_ut(jd, swe.MOON)[0][0] % 360.0
        sign = SIGNS[int(deg // 30) % 12]
        house = get_house_from_cusps(deg, cusps) if cusps else get_house(sign, 'Cancer')
        return (sign, house)

    # ── ① 独立复算（5 分钟步进，与实现的「1 小时粗扫 + 二分」完全不同路径）──
    def _dedup(seq):
        out = []
        for x in seq:
            if not out or out[-1] != x:
                out.append(x)
        return out

    import calendar as _c
    _last = _c.monthrange(YEAR, MONTH)[1]
    ind = {}
    for (d0, d1) in [(1, 7), (8, 14), (15, 21), (22, _last)]:
        a = tz.localize(datetime(YEAR, MONTH, d0, 0, 0))
        b = tz.localize(datetime(YEAR, MONTH, d1, 23, 59))
        seq, prev, t = [], _leg(a), a
        while t < b:
            t2 = min(t + timedelta(minutes=5), b)
            lg = _leg(t2)
            if lg != prev:
                seq.append(prev)
                prev = lg
            t = t2
        seq.append(prev)
        ind[d0] = _dedup(seq)

    for w in weeks:
        ind_legs = ind[w['from_day']]
        f_legs = [tuple([lg['sign'], lg['house']]) for lg in w['legs']]
        i_legs = [tuple(x) for x in ind_legs]
        f_signs = _dedup([x[0] for x in f_legs])
        i_signs = _dedup([x[0] for x in i_legs])
        _chk(f_signs == i_signs, f"W{w['week']} 星座序列一致（实现 {f_signs} vs 独立复算 {i_signs}）")
        _chk(f_legs == i_legs, f"W{w['week']} 星座+宫位腿序列完全一致（{len(f_legs)} 条腿）")

    # ── ② 结构不变量 ──
    _chk([w['week'] for w in weeks] == [1, 2, 3, 4], 'W1..W4 四周齐全')
    cont = all(weeks[i]['to_day'] + 1 == weeks[i + 1]['from_day'] for i in range(len(weeks) - 1))
    _chk(cont and weeks[0]['from_day'] == 1 and weeks[3]['to_day'] == 30, '周区间连续覆盖 1..30')
    nodup = all(
        all(w['legs'][i] != w['legs'][i + 1] for i in range(len(w['legs']) - 1))
        for w in weeks
    )
    _chk(nodup, '腿序列相邻不重复')
    _chk(all(len(w['legs']) >= 1 for w in weeks), '每周至少一条腿')

    # ── ③ 已知坏样本：月中快照不足以代表 W1/W4 ──
    snap = SIGNS[int(swe.calc_ut(swe.julday(YEAR, MONTH, 15, 12), swe.MOON)[0][0] // 30) % 12]
    w1 = {lg['sign'] for lg in weeks[0]['legs']}
    w4 = {lg['sign'] for lg in weeks[3]['legs']}
    _chk(snap not in w1, f'快照({snap})不在 W1 真值({sorted(w1)})——快照当全月必错')
    _chk(snap not in w4, f'快照({snap})不在 W4 真值({sorted(w4)})——快照当全月必错')
    _chk('Cancer' in w1 and 'Scorpio' not in w1, f'W1 已知真值核对（含 Cancer 且无 Scorpio）: {sorted(w1)}')

    print(f"self_test 结论: {'✅ 通过（周级真值可信）' if ok else '❌ 失败'}")
    return ok


def compute_natal_chart(birth_date: str, birth_time: str = '12:00',
                        lat: float = 13.75, lon: float = 100.5,
                        tz: str = 'Asia/Bangkok',
                        birth_time_known: bool = True) -> Dict:
    """
    Compute natal chart from birth date/time/coordinates.
    Returns rising sign, sun sign, and all planet positions.
    🛠️ V142: birth_time_known=False 时降级为 Solar House (太阳星座=第1宫)，
    避免用假上升(默认12:00)产生"伪精确"宫位张冠李戴。
    """
    # 🛡️ V490b: 坐标哨兵 —— 非法坐标显式失败（历史会静默降级成 Cancer 上升出盘）
    lat, lon = validate_coordinates(lat, lon)
    # 🛡️ V476: pytz→zoneinfo/pytz 双兼容(见文件头 shim;pytz 首调在本环境 40s+/次)
    # Parse birth datetime
    bd_str = f"{birth_date} {birth_time}"
    try:
        # Try with timezone
        try:
            birth_dt = _localize_dt(datetime.strptime(bd_str, '%Y-%m-%d %H:%M'), tz)
        except InvalidTimeZoneError:
            raise  # 🛡️ V490: 时区无效 → 显式上抛（绝不静默退 naive/UTC 产毒值）
        except Exception:
            # Fallback: naive datetime in UTC
            birth_dt = datetime.strptime(bd_str, '%Y-%m-%d %H:%M')
    except InvalidTimeZoneError:
        raise      # 🛡️ V490: 必须置于 except ValueError 之前，否则被日期重试路径吞掉
    except ValueError:
        birth_time = '12:00'
        bd_str = f"{birth_date} {birth_time}"
        try:
            birth_dt = _localize_dt(datetime.strptime(bd_str, '%Y-%m-%d %H:%M'), tz)
        except InvalidTimeZoneError:
            raise  # 🛡️ V490
        except Exception:
            birth_dt = datetime.strptime(bd_str, '%Y-%m-%d %H:%M')

    # ── V166-fix: Convert to UTC for SwissEph ──
    # SwissEph swe.julday() expects UTC, but birth_dt is in local timezone.
    # Must convert to UTC before extracting year/month/day/hour, otherwise
    # DST offset (e.g. Copenhagen +2h in summer) shifts the JD by 2 hours,
    # causing rising sign to drift ~30° (e.g. Libra instead of Taurus).
    utc_dt = birth_dt.astimezone(_utc_tzinfo())

    # Julian Day for birth moment (in UTC)
    jd_birth = swe.julday(utc_dt.year, utc_dt.month, utc_dt.day,
                           utc_dt.hour + utc_dt.minute / 60.0)
    
    # Calculate Ascendant using sidereal formula (V174)
    # SwissEph Equal House has hemisphere-dependent bugs (cusp[0] = Descendant ≠ Ascendant
    # for some lat/lon combos). Replace with Formula B (Jean Meeus) validated to
    # Copenhagen error 0.003°, Melbourne error 0.0008°.
    # ── Natal Sun (needed for Solar House fallback) ──
    _jd_sun = swe.julday(utc_dt.year, utc_dt.month, utc_dt.day, 12)
    _sun_deg, _ = get_planet_pos(_jd_sun, swe.SUN)
    _sun_sign = get_sign(_sun_deg)

    # ── Real House Cusps (Placidus / Whole Sign fallback / Solar House) ──
    cusps, asc_deg, mc_deg, house_system_used = compute_natal_cusps(
        jd_birth, lat, lon, birth_time_known, _sun_sign if not birth_time_known else None)
    house_cusps = cusps  # real cusp degrees (NOT Equal House approximation)
    rising_sign = get_sign(asc_deg)
    if not birth_time_known:
        rising_sign = _sun_sign  # Solar House: 太阳星座=第1宫
    
    # Get all planet positions at birth moment
    planets = {
        'Sun': swe.SUN, 'Moon': swe.MOON, 'Mercury': swe.MERCURY,
        'Venus': swe.VENUS, 'Mars': swe.MARS, 'Jupiter': swe.JUPITER,
        'Saturn': swe.SATURN, 'Uranus': swe.URANUS, 'Neptune': swe.NEPTUNE,
        'Pluto': swe.PLUTO,
    }
    
    positions = {}
    for name, pid in planets.items():
        deg, speed = get_planet_pos(jd_birth, pid)
        sign = get_sign(deg)
        house = get_house_from_cusps(deg, cusps)
        positions[name] = {
            'sign': sign,
            'degree': round(deg % 30, 2),
            'house': house,
            'retrograde': is_retrograde(speed),
        }
    
    # Build computed_houses dict
    computed_houses = {}
    for name, pos in positions.items():
        computed_houses[name] = {
            'sign': pos['sign'],
            'house': pos['house'],
            'retrograde': pos['retrograde'],
        }
    
    return {
        'rising_sign': rising_sign,
        'sun_sign': positions['Sun']['sign'],
        'ascendant_deg': round(asc_deg, 4),
        'birth_date': birth_date,
        'birth_time': birth_time,
        'lat': lat,
        'lon': lon,
        'tz': tz,
        'computed_houses': computed_houses,
        'house_cusps': [round(c, 4) for c in house_cusps],
        'house_cusps_full': {
            f'house_{i+1}': {
                'cusp_degree': round(cusps[i], 4),
                'sign': get_sign(cusps[i]),
                'degree_in_sign': round(cusps[i] % 30, 2),
            } for i in range(12)
        },
        'ascendant': {'sign': rising_sign, 'degree': round(asc_deg % 30, 2)},
        'midheaven': ({'sign': get_sign(mc_deg), 'degree': round(mc_deg % 30, 2)}
                      if mc_deg is not None else None),
        'natal_moon': computed_houses.get('Moon', {}),
        'version': 'V383',
        'asc_source': 'ascmc_asc',
        'birth_time_known': birth_time_known,
        'rising_sign_source': ('solar_house_no_time' if not birth_time_known
                               else ('computed' if asc_deg > 0 else 'defaulted')),
        'house_system_used': house_system_used,
    }


# ── CLI Entry Point ───────────────────────────────────────────────────────────

if __name__ == '__main__':
    import json
    import argparse
    
    parser = argparse.ArgumentParser(description='V134 SwissEph Astro Matrix')
    parser.add_argument('year', nargs='?', type=int, help='Start year (e.g. 2026)')
    parser.add_argument('month', nargs='?', type=int, help='Start month (1-12)')
    parser.add_argument('rising_sign', nargs='?', default='Cancer', help='Rising sign (e.g. Cancer)')
    parser.add_argument('--months', type=int, default=12, help='Number of months to compute')
    parser.add_argument('--birth-date', dest='birth_date', help='Birth date YYYY-MM-DD')
    parser.add_argument('--birth-time', dest='birth_time', default='12:00', help='Birth time HH:MM')
    # 🛡️ V490b: 刻意用 type=str 而非 type=float —— argparse 的 float 转换失败会自带
    #   exit(2) 且**不携带 INVALID_COORDINATES 标识** ⇒ JS 端无法识别 ⇒ 历史行为是
    #   `Falling back to Cancer rising`（伪造上升出盘）。改手工解析后，非法一律
    #   打标识 + 专用退出码 4，由 JS 入口转 HTTP 400。
    parser.add_argument('--lat', type=str, default=None, help='Latitude (-90..90)')
    parser.add_argument('--lon', type=str, default=None, help='Longitude (-180..180)')
    parser.add_argument('--tz', default='Asia/Bangkok', help='Timezone')
    parser.add_argument('--mode', default='monthly', help='Mode: natal or monthly')
    parser.add_argument('--no-birth-time', dest='no_birth_time', action='store_true',
                        help='Birth time unknown → Solar House fallback (sun sign = 1st house)')
    parser.add_argument('--health', action='store_true', help='Health check')
    parser.add_argument('--moon-weeks-selftest', action='store_true', help='V433 月亮周级真值自证')
    
    args = parser.parse_args()
    
    if getattr(args, 'moon_weeks_selftest', False):
        sys.exit(0 if self_test_moon_weeks() else 1)

    if args.health:
        print('✅ V134 SwissEph OK')
        print(f'  swisseph version: {swe.version}')
        print(f'  ephe_path: internal (Moshier mode)')
        exit(0)

    # 🛡️ V490b: 坐标解析与强校验（默认值与历史一致：13.75 / 100.5）。
    #   非法坐标 → stderr 打 INVALID_COORDINATES + **专用退出码 4**（与 tz 的 3 区分），
    #   JS 入口据此抛 code='INVALID_COORDINATES' → HTTP 400。绝不静默降级 Cancer 上升。
    try:
        def _coord_from_arg(_name, _raw):
            try:
                return float(_raw)
            except (TypeError, ValueError):
                raise InvalidCoordinateError(f'INVALID_COORDINATES: {_name}={_raw!r} 无法解析为数值')
        args.lat, args.lon = validate_coordinates(
            _coord_from_arg('lat', 13.75 if args.lat is None else args.lat),
            _coord_from_arg('lon', 100.5 if args.lon is None else args.lon),
        )
    except InvalidCoordinateError as e:
        print(f'[AstroMatrix] {e}', file=sys.stderr)
        sys.exit(4)   # 🛡️ V490b: 4=坐标非法（0=成功 / 1=其它失败 / 3=时区无效 / 4=坐标非法）

    # 🛡️ V490: 时区无效时**显式失败**（stderr 打出 INVALID_TIMEZONE + 专用退出码 3），
    #   绝不静默产毒值。JS 端 (v69_client.js) 据退出码 3 抛 code='INVALID_TIMEZONE'，
    #   由 server.js 端点转成 HTTP 400。
    def _run():
        if args.mode == 'natal' and args.birth_date:
            natal = compute_natal_chart(args.birth_date, args.birth_time, args.lat, args.lon, args.tz,
                                        birth_time_known=not args.no_birth_time)
            print(json.dumps(natal, indent=2, ensure_ascii=False))
        elif args.mode == 'moon-ingress' and args.year and args.month:
            ing = compute_moon_ingresses(args.year, args.month, args.tz)
            print(json.dumps(ing, ensure_ascii=False))
        elif args.year and args.month:
            matrix = compute_full_matrix(
                birth_date=args.birth_date or '',
                rising_sign=args.rising_sign or 'Cancer',
                start_year=args.year,
                start_month=args.month,
                lat=args.lat,
                lon=args.lon,
                birth_time=args.birth_time,
                birth_time_known=not args.no_birth_time,
                tz=args.tz,
            )
            # Override months count
            matrix['meta']['months_requested'] = args.months
            matrix['months'] = matrix['months'][:args.months]
            print(json.dumps(matrix, indent=2, ensure_ascii=False))
        else:
            test_verification()
            print('\n═══ Full Astro Matrix (1990-06-15, Rising Cancer) ═══')
            matrix = compute_full_matrix('1990-06-15', 'Cancer', 2026, 7)
            print(json.dumps(matrix, indent=2, ensure_ascii=False))

    try:
        _run()
    except InvalidTimeZoneError as e:
        print(f'[AstroMatrix] {e}', file=sys.stderr)
        sys.exit(3)   # 🛡️ V490: 专用退出码（0=成功 / 1=其它失败 / 3=时区无效 / 4=坐标非法）
    except InvalidCoordinateError as e:
        print(f'[AstroMatrix] {e}', file=sys.stderr)
        sys.exit(4)   # 🛡️ V490b: 引擎内部二次校验兜底（即便 CLI 关被绕过也不会静默出盘）
