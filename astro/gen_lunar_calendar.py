# -*- coding: utf-8 -*-
"""
E129 刀一：月相与天象字典生成器
================================
用途：为 lunar_calendar_events 表生成 2026-2027 年权威新月/满月/水逆时间戳。
真源：Swiss Ephemeris（swisseph 2.10.x，Moshier 模式，与 astro_matrix.py 同源惯例）。
     —— 军令原文写 Meeus；本仓天文真值一律 Swiss Ephemeris（精度高于 Meeus 手算），
        沿仓内铁律「锚点逐字取真源码」，此处以仓规为准。
输出：stdout 打印 JSON 事件数组（供迁移 SQL 预置与闸门复核）。
精度：新月/满月时刻二分法收敛至 <2 秒；水逆起止收敛至 <1 分钟。
"""

import json
from datetime import datetime, timedelta, timezone

import swisseph as swe

START = datetime(2025, 12, 20, tzinfo=timezone.utc)
END = datetime(2028, 1, 10, tzinfo=timezone.utc)

SIGNS = [
    'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
    'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
]


def _jd(dt: datetime) -> float:
    return swe.julday(dt.year, dt.month, dt.day,
                      dt.hour + dt.minute / 60.0 + dt.second / 3600.0)


def _from_jd(jd: float) -> datetime:
    y, m, d, h = swe.revjul(jd)
    hh = int(h)
    mm = int((h - hh) * 60)
    ss = round((((h - hh) * 60) - mm) * 60)
    return datetime(y, m, d, hh, mm, ss, tzinfo=timezone.utc)


def _elongation(jd: float) -> float:
    """月-日黄经差（0~360）。"""
    moon = swe.calc_ut(jd, swe.MOON)[0][0]
    sun = swe.calc_ut(jd, swe.SUN)[0][0]
    return (moon - sun) % 360.0


def _sign_of(jd: float, planet: int) -> str:
    lon = swe.calc_ut(jd, planet)[0][0]
    return SIGNS[int(lon // 30)]


def _bisect_phase(target_deg: float, lo_jd: float, hi_jd: float) -> float:
    """二分法求 elongation 越过 target_deg 的精确时刻。"""
    for _ in range(40):
        mid = (lo_jd + hi_jd) / 2.0
        if ((_elongation(mid) - target_deg) % 360.0) < 180.0:
            hi_jd = mid
        else:
            lo_jd = mid
    return (lo_jd + hi_jd) / 2.0


def _mercury_speed(jd: float) -> float:
    return swe.calc_ut(jd, swe.MERCURY)[0][3]


def _bisect_mercury(lo_jd: float, hi_jd: float, want_neg: bool) -> float:
    for _ in range(30):
        mid = (lo_jd + hi_jd) / 2.0
        neg = _mercury_speed(mid) < 0
        if neg == want_neg:
            hi_jd = mid
        else:
            lo_jd = mid
    return (lo_jd + hi_jd) / 2.0


def generate() -> list:
    events = []

    # ── 新月 / 满月：6h 步进扫描 elongation 越过 0° / 180° ──
    step = timedelta(hours=6)
    t = START
    prev_e = _elongation(_jd(t))
    while t < END:
        nxt = t + step
        e = _elongation(_jd(nxt))
        for target, etype, ritual in ((0.0, 'new_moon', 'manifestation'),
                                      (180.0, 'full_moon', 'release')):
            d_prev = (prev_e - target) % 360.0
            d_cur = (e - target) % 360.0
            # 越过判定：与目标角的差从 >180（在后）跳到 <180（在前）
            if d_prev > 180.0 >= d_cur:
                jd_exact = _bisect_phase(target, _jd(t), _jd(nxt))
                dt_exact = _from_jd(jd_exact)
                events.append({
                    'event_type': etype,
                    'zodiac_sign': _sign_of(jd_exact, swe.MOON),
                    'peak_time': dt_exact.strftime('%Y-%m-%dT%H:%M:%SZ'),
                    'manifestation_theme': {'ritual': ritual},
                })
        t = nxt
        prev_e = e

    # ── 水星逆行：12h 步进扫描视速度符号翻转 ──
    step_m = timedelta(hours=12)
    t = START
    prev_neg = _mercury_speed(_jd(t)) < 0
    while t < END:
        nxt = t + step_m
        neg = _mercury_speed(_jd(nxt)) < 0
        if neg != prev_neg:
            jd_exact = _bisect_mercury(_jd(t), _jd(nxt), neg)
            dt_exact = _from_jd(jd_exact)
            events.append({
                'event_type': 'mercury_retrograde',
                'zodiac_sign': _sign_of(jd_exact, swe.MERCURY),
                'peak_time': dt_exact.strftime('%Y-%m-%dT%H:%M:%SZ'),
                'manifestation_theme': {'phase': 'start' if neg else 'end'},
            })
        t = nxt
        prev_neg = neg

    events.sort(key=lambda x: x['peak_time'])
    # 军令口径：2026-01-01 ~ 2027-12-31（裁掉扫描窗口带入的边界事件）
    events = [e for e in events
              if '2026-01-01' <= e['peak_time'] <= '2027-12-31T23:59:59Z']
    return events


if __name__ == '__main__':
    swe.set_ephe_path('')  # Moshier 模式（零星历文件依赖，与 astro_matrix.py 同规）
    for ev in generate():
        print(json.dumps(ev, ensure_ascii=False))
