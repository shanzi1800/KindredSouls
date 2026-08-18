#!/usr/bin/env python3
"""
V69 Astro Truth Engine - FastAPI Server
SwissEph-powered astronomical computation for KindredSouls.
No hallucination possible: all planetary positions computed by code.
"""
import sys
sys.path.insert(0, '/Users/apple/.local/lib/python3.11/site-packages')

import os
import swisseph as swe
import pytz
from datetime import datetime, timedelta, date
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import json
import math
from copy import deepcopy

# ── Constants ─────────────────────────────────────────────────────────────────
SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
         'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']

MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

SIGN_ELEMENTS = {
    'Aries': 'Fire', 'Leo': 'Fire', 'Sagittarius': 'Fire',
    'Taurus': 'Earth', 'Virgo': 'Earth', 'Capricorn': 'Earth',
    'Gemini': 'Air', 'Libra': 'Air', 'Aquarius': 'Air',
    'Cancer': 'Water', 'Scorpio': 'Water', 'Pisces': 'Water',
}

# House descriptions by number (1=Cancer for Cancer Rising)
HOUSE_DESCRIPTIONS = {
    1: 'personal identity, self-worth, core essence',
    2: 'income, earned wealth, material security, possessions',
    3: 'communication, siblings, daily commerce, short journeys',
    4: 'home, family, ancestral wealth, real estate, roots',
    5: 'creativity, speculation, children, romance, joy',
    6: 'health, daily labor, service industry, routines',
    7: 'partnerships, contracts, business alliances, marriage',
    8: 'shared resources, debt, inheritance, transformation',
    9: 'wisdom, publishing, foreign income, higher education',
    10: 'career, public reputation, authority, mastery',
    11: 'networks, groups, collective income, future goals',
    12: 'subconscious, hidden structures, behind-the-scenes gains',
}

# ── SwissEph Wrappers ──────────────────────────────────────────────────────────

# ── 全行星星表 ──────────────────────────────────────────────────────────────
ALL_PLANETS = {
    'Sun': swe.SUN, 'Moon': swe.MOON, 'Mercury': swe.MERCURY,
    'Venus': swe.VENUS, 'Mars': swe.MARS, 'Jupiter': swe.JUPITER,
    'Saturn': swe.SATURN, 'Uranus': swe.URANUS, 'Neptune': swe.NEPTUNE, 'Pluto': swe.PLUTO,
}
INNER_PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars']
OUTER_PLANETS = ['Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']

# ── 容许度设置 ──
ASPECT_ORBS = {
    'CONJUNCTION': 6,  # 0° ± 6°
    'SQUARE': 5,       # 90° ± 5°
    'OPPOSITION': 5,   # 180° ± 5°
}

def get_planet_pos(jd: float, planet: int) -> tuple:
    """Return (longitude_degrees, daily_speed) for a planet."""
    r = swe.calc_ut(jd, planet)
    return r[0][0], r[0][3]


def get_sign(degree: float) -> str:
    return SIGNS[int(degree // 30) % 12]


def format_pos(degree: float) -> str:
    sign_idx = int(degree // 30) % 12
    return f"{SIGNS[sign_idx]} {degree % 30:.2f}°"


def get_rising_sign(jd: float, lat: float, lon: float) -> str:
    """Calculate rising sign (Ascendant) using SwissEph."""
    try:
        # Calculate Ascendant
        asc, _ = swe.houses(jd, lat, lon, b'W')
        asc_deg = asc[0]
        return get_sign(asc_deg)
    except Exception:
        return 'Cancer'  # fallback


def get_house_for_sign(sign: str, rising_sign: str) -> int:
    """Map a zodiac sign to house number given the rising sign (Equal House)."""
    rising_idx = SIGNS.index(rising_sign)
    sign_idx = SIGNS.index(sign)
    house = (sign_idx - rising_idx + 1) % 12
    return house if house != 0 else 12


def is_retrograde(speed: float) -> bool:
    return speed < 0


# ── Retrograde Station Finder ─────────────────────────────────────────────────

def compute_natal_positions(birth_date: str, birth_time: str = '12:00', lat: float = 13.75, lon: float = 100.5, tz_str: str = 'Asia/Bangkok') -> Dict:
    """Compute natal planet positions from birth date and time."""
    parts = birth_date.split('-')
    y, m, d = int(parts[0]), int(parts[1]), int(parts[2])
    utc_y, utc_m, utc_d, utc_h = get_utc_datetime_for_swe(birth_date, birth_time, tz_str)
    jd = swe.julday(utc_y, utc_m, utc_d, utc_h)
    positions = {}
    for name, pid in ALL_PLANETS.items():
        deg, speed = get_planet_pos(jd, pid)
        sign = get_sign(deg)
        positions[name] = {
            'sign': sign,
            'degree': round(deg % 30, 2),
            'total_degree': deg,
            'retrograde': is_retrograde(speed),
        }
    # 上升星座
    asc = get_rising_sign(jd, lat, lon)
    return {'planets': positions, 'rising_sign': asc}


def check_aspect(transit_deg: float, natal_deg: float) -> List[str]:
    """Check if transit forms conjunction (0°), square (90°), or opposition (180°) to natal.
    Returns list of aspect type strings, e.g. ['SQUARE'] or ['CONJUNCTION', 'OPPOSITION']
    """
    diff = abs(transit_deg - natal_deg) % 360
    if diff > 180:
        diff = 360 - diff
    aspects = []
    if diff <= ASPECT_ORBS['CONJUNCTION']:
        aspects.append('CONJUNCTION')
    if 90 - ASPECT_ORBS['SQUARE'] <= diff <= 90 + ASPECT_ORBS['SQUARE']:
        aspects.append('SQUARE')
    if 180 - ASPECT_ORBS['OPPOSITION'] <= diff <= 180 + ASPECT_ORBS['OPPOSITION']:
        aspects.append('OPPOSITION')
    return aspects


def compute_transit_aspects(natal_positions: Dict, start_year: int, start_month: int, num_months: int = 12) -> List[Dict]:
    """Scan the full period day by day for transit outer → natal inner aspects."""
    aspects = []
    natal_planets = natal_positions['planets']
    current = datetime(start_year, start_month, 1)
    # End date: advance by num_months
    y, m = start_year, start_month
    for _ in range(num_months):
        m += 1
        if m > 12:
            m = 1
            y += 1
    end = datetime(y, m, 1) - timedelta(days=1)

    while current <= end:
        jd = swe.julday(current.year, current.month, current.day, 12)
        for t_name in OUTER_PLANETS:
            t_deg, _ = get_planet_pos(jd, ALL_PLANETS[t_name])
            t_sign = get_sign(t_deg)
            t_house = get_house_for_sign(t_sign, natal_positions['rising_sign'])
            for n_name in INNER_PLANETS + OUTER_PLANETS:
                if n_name == t_name:
                    continue
                n_deg = natal_planets[n_name]['total_degree']
                matches = check_aspect(t_deg, n_deg)
                for aspect in matches:
                    aspects.append({
                        'date': current.strftime('%Y-%m-%d'),
                        'transit_planet': t_name,
                        'transit_sign': t_sign,
                        'transit_house': t_house,
                        'natal_planet': n_name,
                        'natal_sign': natal_planets[n_name]['sign'],
                        'aspect': aspect,
                    })
        current += timedelta(days=1)

    return aspects


def find_lunar_phases(start_year: int, start_month: int, num_months: int = 12) -> List[Dict]:
    """Scan for New Moon (Sun-Moon 0°) and Full Moon (Sun-Moon 180°) within 3° orb."""
    phases = []
    current = datetime(start_year, start_month, 1)
    y, m = start_year, start_month
    for _ in range(num_months):
        m += 1
        if m > 12:
            m = 1
            y += 1
    end = datetime(y, m, 1) - timedelta(days=1)

    while current <= end:
        jd = swe.julday(current.year, current.month, current.day, 12)
        sun_deg, _ = get_planet_pos(jd, swe.SUN)
        moon_deg, _ = get_planet_pos(jd, swe.MOON)
        diff = abs(sun_deg - moon_deg) % 360
        if diff > 180:
            diff = 360 - diff
        if diff <= 3:
            phases.append({
                'date': current.strftime('%Y-%m-%d'),
                'type': 'NEW_MOON' if diff <= 3 else ('FULL_MOON' if abs(diff - 180) <= 3 else ''),
                'sun_sign': get_sign(sun_deg),
                'moon_sign': get_sign(moon_deg),  # V102: 新月月=日同座，用真实月亮黄经防幻觉
            })
        elif 177 <= diff <= 183:
            phases.append({
                'date': current.strftime('%Y-%m-%d'),
                'type': 'FULL_MOON',
                'sun_sign': get_sign(sun_deg),
                'moon_sign': get_sign(moon_deg),  # V102: 满月月在对宫！必须用 moon_sign，不能用 sun_sign
            })
        current += timedelta(days=1)

    return phases


def find_planet_stations(planet_id: int, start_date: date, end_date: date) -> List[Dict]:
    """Scan date range for retrograde-direct stations of a planet."""
    stations = []
    current = datetime(start_date.year, start_date.month, start_date.day)
    end = datetime(end_date.year, end_date.month, end_date.day)
    prev_speed = None
    prev_jd = None
    while current <= end:
        jd = swe.julday(current.year, current.month, current.day, 12)
        _, speed = get_planet_pos(jd, planet_id)
        if prev_speed is not None and prev_jd is not None:
            if (prev_speed > 0 > speed) or (prev_speed < 0 < speed):
                station_type = 'RETROGRADE' if speed < 0 else 'DIRECT'
                exact_dt = find_exact_station(prev_jd, jd, planet_id, station_type)
                if isinstance(exact_dt, datetime):
                    stations.append({
                        'type': station_type,
                        'date': exact_dt.strftime('%Y-%m-%d'),
                        'position': format_pos(get_planet_pos(swe.julday(exact_dt.year, exact_dt.month, exact_dt.day, 12), planet_id)[0]),
                    })
        prev_speed = speed
        prev_jd = jd
        current += timedelta(days=1)
    return stations


def find_all_stations(start_date: date, end_date: date) -> Dict:
    """Find retrograde stations for Mercury, Jupiter, Saturn, Uranus, Neptune, Pluto."""
    return {
        'mercury': find_planet_stations(swe.MERCURY, start_date, end_date),
        'jupiter': find_planet_stations(swe.JUPITER, start_date, end_date),
        'saturn': find_planet_stations(swe.SATURN, start_date, end_date),
        'uranus': find_planet_stations(swe.URANUS, start_date, end_date),
        'neptune': find_planet_stations(swe.NEPTUNE, start_date, end_date),
        'pluto': find_planet_stations(swe.PLUTO, start_date, end_date),
    }


def find_mercury_stations_old(start_date: date, end_date: date) -> List[Dict]:
    """Legacy: Mercury-only station finder (kept for backward compat)."""
    stations = []
    current = datetime(start_date.year, start_date.month, start_date.day)
    end = datetime(end_date.year, end_date.month, end_date.day)
    
    prev_speed = None
    prev_jd = None
    
    while current <= end:
        jd = swe.julday(current.year, current.month, current.day, 12)
        _, speed = get_planet_pos(jd, swe.MERCURY)
        
        if prev_speed is not None and prev_jd is not None:
            if (prev_speed > 0 > speed) or (prev_speed < 0 < speed):
                station_type = 'RETROGRADE' if speed < 0 else 'DIRECT'
                # Find exact crossing by interpolation
                exact_dt = find_exact_station(prev_jd, jd, swe.MERCURY, station_type)
                if isinstance(exact_dt, datetime):
                    stations.append({
                        'type': station_type,
                        'date': exact_dt.strftime('%Y-%m-%d'),
                        'sign': get_sign(get_planet_pos(swe.julday(exact_dt.year, exact_dt.month, exact_dt.day, 12), swe.MERCURY)[0]),
                        'position': format_pos(get_planet_pos(swe.julday(exact_dt.year, exact_dt.month, exact_dt.day, 12), swe.MERCURY)[0]),
                    })
        
        prev_speed = speed
        prev_jd = jd
        current += timedelta(days=1)
    
    return stations


def find_exact_station(jd_start: float, jd_end: float, planet: int, station_type: str) -> datetime:
    """Binary search for exact station day (within 1 hour)."""
    for _ in range(10):
        jd_mid = (jd_start + jd_end) / 2
        _, speed = get_planet_pos(jd_mid, planet)
        if station_type == 'RETROGRADE':
            if speed < 0:
                jd_end = jd_mid
            else:
                jd_start = jd_mid
        else:
            if speed > 0:
                jd_end = jd_mid
            else:
                jd_start = jd_mid
    
    dt = swe.revjul((jd_start + jd_end) / 2)
    return datetime(int(dt[0]), int(dt[1]), int(dt[2]))


# ── Monthly Matrix Computation ─────────────────────────────────────────────────

def compute_month(birth_date: str, year: int, month: int,
                  rising_sign: str, lat: float = 0.0, lon: float = 0.0) -> Dict[str, Any]:
    """Compute complete astro matrix for one month."""
    jd = swe.julday(year, month, 15, 12)
    
    planet_ids = {
        'Sun': swe.SUN, 'Moon': swe.MOON, 'Mercury': swe.MERCURY,
        'Venus': swe.VENUS, 'Mars': swe.MARS, 'Jupiter': swe.JUPITER,
        'Saturn': swe.SATURN, 'Uranus': swe.URANUS, 'Neptune': swe.NEPTUNE, 'Pluto': swe.PLUTO,
    }
    
    positions = {}
    for name, pid in planet_ids.items():
        deg, speed = get_planet_pos(jd, pid)
        sign = get_sign(deg)
        positions[name] = {
            'sign': sign,
            'degree': round(deg % 30, 2),
            'house': get_house_for_sign(sign, rising_sign),
            'retrograde': is_retrograde(speed),
            'element': SIGN_ELEMENTS.get(sign, 'Unknown'),
        }
    
    # Find peak window: exact Sun-planet conjunctions in current month
    peak_windows = find_conjunction_windows(year, month, positions)
    
    # Find black swan days: Mars hard aspects
    crisis_days = find_crisis_days(year, month, positions)
    
    # Mercury retrograde in this month
    mercury = positions['Mercury']
    mercury_status = {
        'status': 'RETROGRADE' if mercury['retrograde'] else 'DIRECT',
        'sign': mercury['sign'],
        'house': mercury['house'],
        'house_desc': HOUSE_DESCRIPTIONS.get(mercury['house'], 'House ' + str(mercury['house'])),
    }
    
    # Macro energy
    macro = build_macro_description(positions)
    
    month_key = f"{year}-{month:02d}"
    return {
        'month_key': month_key,
        'month_name': f"{MONTH_NAMES[month]} {year}",
        'sun': positions['Sun'],
        'moon': positions['Moon'],
        'mercury': mercury_status,
        'jupiter': {
            'sign': positions['Jupiter']['sign'],
            'house': positions['Jupiter']['house'],
            'house_desc': HOUSE_DESCRIPTIONS.get(positions['Jupiter']['house'], ''),
            'element': positions['Jupiter']['element'],
            'retrograde': positions['Jupiter']['retrograde'],
        },
        'saturn': {
            'sign': positions['Saturn']['sign'],
            'house': positions['Saturn']['house'],
            'house_desc': HOUSE_DESCRIPTIONS.get(positions['Saturn']['house'], ''),
        },
        'mars': positions['Mars'],
        'uranus': positions['Uranus'],
        'venus': positions['Venus'],
        'pluto': positions['Pluto'],
        'macro_energy': macro,
        'peak_windows': peak_windows,
        'black_swan_days': crisis_days,
    }


def find_conjunction_windows(year: int, month: int, positions: Dict) -> List[Dict]:
    """Find days when Sun conjoins Jupiter, etc. in the current month."""
    windows = []
    current = datetime(year, month, 1)
    last_day = (datetime(year, month + 1, 1) if month < 12 else datetime(year + 1, 1, 1)) - timedelta(days=1)
    
    sun_positions = []
    jup_positions = []
    
    while current <= last_day:
        jd = swe.julday(current.year, current.month, current.day, 12)
        sun_deg, _ = get_planet_pos(jd, swe.SUN)
        jup_deg, _ = get_planet_pos(jd, swe.JUPITER)
        sun_positions.append((current, sun_deg))
        jup_positions.append((current, jup_deg))
        current += timedelta(days=1)
    
    # Sun-Jupiter conjunction
    for i, (dt, sun) in enumerate(sun_positions):
        diff = abs(sun - jup_positions[i][1]) % 360
        if diff > 180: diff = 360 - diff
        if diff < 5:
            windows.append({
                'type': 'Sun conjunct Jupiter',
                'date': dt.strftime('%Y-%m-%d'),
                'sign': get_sign(sun),
                'house': get_house_for_sign(get_sign(sun), positions['Sun']['sign']),
            })
    
    return windows


def find_crisis_days(year: int, month: int, positions: Dict) -> List[Dict]:
    """Find Mars-Saturn and Mars-Uranus hard aspects in the current month."""
    crisis = []
    current = datetime(year, month, 1)
    last_day = (datetime(year, month + 1, 1) if month < 12 else datetime(year + 1, 1, 1)) - timedelta(days=1)
    
    while current <= last_day:
        jd = swe.julday(current.year, current.month, current.day, 12)
        mars_deg, _ = get_planet_pos(jd, swe.MARS)
        sat_deg, _ = get_planet_pos(jd, swe.SATURN)
        ur_deg, _ = get_planet_pos(jd, swe.URANUS)
        
        for other_deg, other_name in [(sat_deg, 'Saturn'), (ur_deg, 'Uranus')]:
            diff = abs(mars_deg - other_deg) % 360
            if diff > 180: diff = 360 - diff
            if 88 <= diff <= 92:
                mars_sign = get_sign(mars_deg)
                other_sign = get_sign(other_deg)
                crisis.append({
                    'date': current.strftime('%Y-%m-%d'),
                    'aspect': f"Mars in {mars_sign} SQUARE {other_name} in {other_sign}",
                    'severity': 'CRITICAL' if other_name == 'Uranus' else 'HIGH',
                    'description': f"Mars-Saturn square creates tension between action and restriction." if other_name == 'Saturn'
                        else f"Mars-Uranus square creates sudden disruption and impulsive risk.",
                })
        
        current += timedelta(days=1)
    
    return crisis


def build_macro_description(positions: Dict) -> str:
    sun = positions['Sun']
    jup = positions['Jupiter']
    sat = positions['Saturn']
    
    sun_house = HOUSE_DESCRIPTIONS.get(sun['house'], 'House ' + str(sun['house']))
    sun_energy = f"Sun transits {sun['sign']}, activating {sun_house}."
    jup_energy = f"Jupiter in {jup['sign']} (House {jup['house']} — {jup['element']} element"
    if jup['retrograde']:
        jup_energy += ', retrograde — internal review of expansion'
    jup_energy += ').'
    
    sat_energy = f"Saturn in {sat['sign']} (House {sat['house']})"
    if positions['Saturn']['retrograde']:
        sat_energy += ' retrograde — karmic restructuring'
    sat_energy += '.'
    
    return f"{sun_energy} {jup_energy} {sat_energy}"


# ── Full Year Matrix ───────────────────────────────────────────────────────────

def compute_year_matrix(birth_date: str, rising_sign: str,
                        year: int, month_start: int, months: int = 12,
                        birth_time: str = '12:00', lat: float = 13.75, lon: float = 100.5, tz_str: str = 'Asia/Bangkok') -> Dict:
    """Compute 12-month astro matrix with natal aspects and lunar phases."""
    monthly_data = []
    y, m = year, month_start
    
    for _ in range(months):
        monthly_data.append(compute_month(birth_date, y, m, rising_sign))
        m += 1
        if m > 12:
            m = 1
            y += 1
    
    period_end_date = date(y - 1 if m == 1 else y, m - 1 if m > 1 else 12, 28)
    period_start_date = date(year, month_start, 1)
    
    # ── V97at: 外行星逆行站（全行星）──
    stations = find_all_stations(period_start_date, period_end_date)
    
    # ── V97at: 本命星盘 ──
    natal = compute_natal_positions(birth_date, birth_time, lat, lon, tz_str)
    
    # ── V97at: 行运外 → 本命内相位 ──
    transit_aspects = compute_transit_aspects(natal, year, month_start, months)
    
    # ── V97at: 新月满月 ──
    lunar_phases = find_lunar_phases(year, month_start, months)
    
    # ── V93 FIX: 显式 computed_houses ──
    first = monthly_data[0] if monthly_data else {}
    computed_houses = {
        'Jupiter': {
            'sign': first.get('Jupiter', {}).get('sign', 'Leo'),
            'house': first.get('Jupiter', {}).get('house', 2),
            'house_desc_zh': f"第{first.get('Jupiter',{}).get('house',2)}宫",
        },
        'Saturn': {
            'sign': first.get('Saturn', {}).get('sign', 'Aries'),
            'house': first.get('Saturn', {}).get('house', 10),
            'house_desc_zh': f"第{first.get('Saturn',{}).get('house',10)}宫",
        },
        'Pluto': {
            'sign': first.get('Pluto', {}).get('sign', 'Aquarius'),
            'house': first.get('Pluto', {}).get('house', 8),
            'house_desc_zh': f"第{first.get('Pluto',{}).get('house',8)}宫",
        },
        'Sun': {
            'sign': first.get('Sun', {}).get('sign', 'Gemini'),
            'house': first.get('Sun', {}).get('house', 1),
            'house_desc_zh': f"第{first.get('Sun',{}).get('house',1)}宫",
        },
    }

    return {
        'meta': {
            'birth_date': birth_date,
            'rising_sign': rising_sign,
            'natal_rising_sign': natal['rising_sign'],
            'generated_by': 'V69 SwissEph Engine v1.0',
            'house_system': 'Equal House',
            'year_start': f"{year}-{month_start:02d}",
            'year_end': f"{y if m > 1 else y-1}-{m-1 if m > 1 else 12:02d}",
            'computed_houses': computed_houses,
        },
        'months': monthly_data,
        'retrograde_stations': stations,
        'natal_planets': natal['planets'],
        'transit_aspects': transit_aspects,
        'lunar_phases': lunar_phases,
    }


# ── FastAPI App ────────────────────────────────────────────────────────────────

app = FastAPI(title="V69 Astro Truth Engine", version="1.0.0")

# ── 时区 → UTC 偏移量映射表 ──────────────────────────────────────────────
TZ_OFFSET = {
    'GMT+8': -8, 'GMT+7': -7, 'GMT+6': -6, 'GMT+5': -5, 'GMT+4': -4,
    'GMT+3': -3, 'GMT+2': -2, 'GMT+1': -1, 'GMT+0': 0, 'GMT-1': 1,
    'GMT-2': 2, 'GMT-3': 3, 'GMT-4': 4, 'GMT-5': 5, 'GMT-6': 6,
    'GMT-7': 7, 'GMT-8': 8, 'GMT-9': 9, 'GMT-10': 10, 'GMT-11': 11,
    'GMT-12': 12,
    'Asia/Shanghai': -8, 'Asia/Hong_Kong': -8, 'Asia/Taipei': -8,
    'Asia/Bangkok': -7, 'Asia/Seoul': -9, 'Asia/Tokyo': -9,
    'America/New_York': 5, 'America/Los_Angeles': 8, 'America/Chicago': 6,
    'America/Argentina/Buenos_Aires': 3,  # 阿根廷（布宜诺斯艾利斯）
    'Europe/London': 0, 'Europe/Oslo': -1, 'Europe/Paris': -2,
    'UTC': 0,
}

def get_utc_datetime_for_swe(birth_date: str, birth_time: str, tz_str: str):
    """
    🛠️ V117d: 用 pytz 历史 IANA 将本地时间转 UTC，返回安全用于 swe.julday 的 (year, month, day, decimal_hour)。
    正确处理：历史夏令时（如中国 1986-1991）、跨天/跨月/跨年。
    """
    try:
        y, m, d = map(int, birth_date.split('-'))
        hh, mm = map(int, birth_time.split(':'))
        tz = pytz.timezone(tz_str)
        dt_naive = datetime(y, m, d, hh, mm)
        dt_local = tz.localize(dt_naive, is_dst=None)
        dt_utc = dt_local.astimezone(pytz.UTC)
        decimal_hour = dt_utc.hour + dt_utc.minute / 60.0 + dt_utc.second / 3600.0
        return dt_utc.year, dt_utc.month, dt_utc.day, decimal_hour
    except Exception as e:
        # Fallback: 固定偏移 + 简单跨天
        offset = TZ_OFFSET.get(tz_str, 0)
        local_hour = int(birth_time.split(':')[0]) + int(birth_time.split(':')[1]) / 60.0
        ut_hour = (local_hour - offset) % 24
        y, m, d = map(int, birth_date.split('-'))
        return y, m, d, ut_hour


class AstroRequest(BaseModel):
    birth_date: str  # 'YYYY-MM-DD'
    birth_time: Optional[str] = '12:00'  # 🛠️ V91+ 新增：出生时间 HH:MM
    lat: Optional[float] = 13.75  # 🛠️ V91+ 新增：纬度，默认 Bangkok
    lon: Optional[float] = 100.5  # 🛠️ V91+ 新增：经度，默认 Bangkok
    tz: Optional[str] = 'Asia/Bangkok'  # 🛠️ V91+ 新增：时区
    rising_sign: Optional[str] = None  # 🛠️ V80: 默认为None，由Python自己从生日算ASC
    year: Optional[int] = 2026
    month_start: Optional[int] = 7
    months: Optional[int] = 12


@app.post("/api/v1/astro-matrix")
def astro_matrix(req: AstroRequest):
    """Return complete 12-month astrological matrix.
    🛠️ V91+: 支持 birth_time / lat / lon / tz 精确参数。
    """
    try:
        # ── 🛠️ V117d: 用 pytz 历史 IANA 转 UTC（修正夏令时+日期跨界）──
        utc_y, utc_m, utc_d, utc_h = get_utc_datetime_for_swe(req.birth_date, req.birth_time, req.tz)
        jd = swe.julday(utc_y, utc_m, utc_d, utc_h)
        parts = req.birth_date.split('-')
        y, m, d = int(parts[0]), int(parts[1]), int(parts[2])

        # ── 🛠️ V91: 用真实经纬度算 ASC ──
        if req.rising_sign is None:
            req.rising_sign = get_rising_sign(jd, req.lat, req.lon)
            print(f"[V91] ASC computed: {req.rising_sign} (lat={req.lat}, lon={req.lon})")

        # ── V97at: 将 birth_time / lat / lon / tz 传入瑞士星历引擎 ──
        matrix = compute_year_matrix(
            req.birth_date,
            req.rising_sign,
            req.year,
            req.month_start,
            req.months,
            req.birth_time,
            req.lat,
            req.lon,
            req.tz,
        )
        # 在 matrix 里注入元数据（方便调试）
        matrix['_v91_meta'] = {
            'birth_date': req.birth_date,
            'birth_time': req.birth_time,
            'lat': req.lat,
            'lon': req.lon,
            'tz': req.tz,
            'utc_y': utc_y,
            'utc_m': utc_m,
            'utc_d': utc_d,
            'utc_h': round(utc_h, 4),
            'asc': req.rising_sign,
        }
        return matrix
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/health")
def health():
    return {"status": "ok", "engine": "V69 SwissEph", "version": "1.0.0"}


@app.get("/api/v1/verify")
def verify_dates():
    """Verify known astronomical facts for sanity check."""
    results = []
    
    # Jupiter sign verification
    for y, m, expected_sign in [
        (2026, 6, 'Cancer'), (2026, 7, 'Leo'), (2026, 12, 'Leo'),
        (2027, 5, 'Leo'), (2027, 6, 'Leo'),
    ]:
        jd = swe.julday(y, m, 15, 12)
        deg, _ = get_planet_pos(jd, swe.JUPITER)
        sign = get_sign(deg)
        results.append({
            'test': f'Jupiter {y}-{m:02d}',
            'expected': expected_sign,
            'actual': sign,
            'pass': sign == expected_sign,
        })
    
    # Mercury stations
    stations = find_mercury_stations(date(2026, 7, 1), date(2028, 1, 1))
    results.append({
        'test': 'Mercury stations 2026-2027',
        'stations': [f"{s['date']} {s['type']}" for s in stations if s['type'] == 'RETROGRADE'],
    })
    
    return {"results": results}


if __name__ == '__main__':
    import uvicorn
    port = int(os.environ.get('V69_PORT', 8001))
    uvicorn.run(app, host='0.0.0.0', port=port)
