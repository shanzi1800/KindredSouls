#!/usr/bin/env python3
"""
🛡️ V492 · 高纬提示透传(R5) + 财富窗口相位实算(R6) + 字段统一(D4) —— 离线回归闸门（仓库外预置）

军师定裁（2026-10-02）：R1~R7 全量打包 V492，代码仓库暂动，闸门先在仓库外备好。
军师第二批裁决（D1~D4）已冻结，本闸门据此改造（见下方 D3 / D4）：
  · D1 = 缓存 v506 → v507 全量失效（靶点在 **server.js 4 处**，判定在 Node 闸门）
  · D2 = R4 形态：Prompt 软注入 + house_linter 硬兜底（单一链路，不新建第二套改写器）
  · D3 = **严禁 null**：换观测对象（金星/木星/水星/天顶等次级吉照）保证每月都有 1~3 天真窗口
  · D4 = **废弃单数 `peak_window`，全链统一收拢至复数 `peak_windows`**

本闸门覆盖（引擎/管道侧）：
  · R6a  find_peak_window 回退分支是伪桩 —— 把当月**每一天**无过滤塞进 peak_days，
         再截前 3 天当"窗口"，reason 编造 "Sun aligns with House N"。实测 11/12 个月命中。
  · R6b  命中真分支时 reason 泄漏 SwissEph 行星索引："Planet 0 conjoins planet 5"
         （0=Sun, 5=Jupiter 的枚举值，非人类可读文本）。
  · R6c  reason 为**硬编模板**（"Sun aligns with House N"）⇒ 窗口并非由真实相位算出。
  · D4   引擎仍产出单数 `peak_window`，而 js 侧读复数 `peak_windows` ⇒ 恒 []（字段错配）。
  · R5   meta.house_system 已存在（WholeSignFallback），但缺布尔便捷位
         is_high_latitude_fallback，且报告首段无任何"已启用等宫制"告知。

纪律：灵敏度自检优先（证明判据非恒真/恒假）；阈值 66.5° 为物理阈值，不得下调。
"""
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))

# ── 自适应定位源码树 ────────────────────────────────────────────────
def resolve_root():
    cands = [
        os.path.join(HERE, "..", "KindredSouls源代码"),
        os.path.join(HERE, ".."),
        os.path.join(HERE, "..", ".."),
    ]
    for c in cands:
        if os.path.exists(os.path.join(c, "astro", "astro_matrix.py")):
            return os.path.abspath(c)
    raise SystemExit("无法定位 astro_matrix.py，候选: " + " | ".join(cands))

ROOT = resolve_root()
ENGINE = os.path.join(ROOT, "astro", "astro_matrix.py")

PY = "/Users/apple/.workbuddy/binaries/python/envs/default/bin/python"
if not os.path.exists(PY):
    PY = sys.executable

# ── 靶盘 / 对照盘 ──────────────────────────────────────────────────
TARGET = dict(year=2026, month=10, rising="Sagittarius",
              birth="1997-10-18", time="14:30", lat="69.6492", lon="18.9553",
              tz="Europe/Oslo", tag="Tromsø 69.65N（极圈内 ⇒ 应降级）")
CONTROL = dict(year=2026, month=10, rising="Cancer",
               birth="1997-10-18", time="14:30", lat="13.75", lon="100.5",
               tz="Asia/Bangkok", tag="Bangkok 13.75N（极圈外 ⇒ 应用 Placidus）")


def run_engine(cfg):
    cmd = [PY, ENGINE, str(cfg["year"]), str(cfg["month"]), cfg["rising"],
           "--birth-date", cfg["birth"], "--birth-time", cfg["time"],
           "--lat", cfg["lat"], "--lon", cfg["lon"], "--tz", cfg["tz"],
           "--mode", "monthly"]
    p = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
    if p.returncode != 0 or not p.stdout.strip():
        return None, (p.stderr or p.stdout or "无输出")[:300]
    try:
        return json.loads(p.stdout), None
    except Exception as e:
        return None, "JSON 解析失败: %s" % e


# ═══════════════════════════════════════════════════════════════════
# 判据函数（供断言与灵敏度自检共用同一口径）
#   ⚠️ D4 改造：全部经 win_list() 归一 —— 复数优先、单数兼容（基线期可测）
# ═══════════════════════════════════════════════════════════════════
def win_list(m):
    """归一化窗口字段：优先复数 peak_windows；单数 peak_window 兜底（基线期兼容）。"""
    for k in ("peak_windows", "peak_window"):
        w = m.get(k)
        if isinstance(w, list):
            return [x for x in w if x is not None]
        if isinstance(w, dict) and w:
            return [w]
    return []


def _entry_days(e):
    if isinstance(e, str):
        return [e]
    if isinstance(e, dict):
        d = e.get("window_days") or e.get("days") or []
        if isinstance(d, str):
            return [d]
        return [x for x in d if x]
    if isinstance(e, list):
        return [x for x in e if isinstance(x, str)]
    return []


def _entry_reason(e):
    return e.get("reason", "") if isinstance(e, dict) else ""


def all_days(m):
    days = []
    for e in win_list(m):
        days += _entry_days(e)
    return days


def all_reasons(m):
    return [_entry_reason(e) for e in win_list(m) if _entry_reason(e)]


# ── R6b · reason 不得泄漏行星枚举索引 ──────────────────────────────
IDX_LEAK = re.compile(r"Planet\s+\d+\s+(conjoins|opposes|trines|squares)\s+planet\s+\d+", re.I)


def p_r6b_no_index_leak(months):
    bad = []
    for m in months:
        for r in all_reasons(m):
            if IDX_LEAK.search(r):
                bad.append(r)
    return bad


# ── R6c · reason 不得为硬编模板（D3：必须由 SwissEph 实算得出）──────
HARDCODED_REASON = re.compile(r"^\s*Sun\s+aligns\s+with\s+House\s+\d+\s*$", re.I)


def p_r6c_no_hardcoded_reason(months):
    bad = []
    for m in months:
        for r in all_reasons(m):
            if HARDCODED_REASON.match(r):
                bad.append(r)
    return bad


# ── R6a · 伪桩指纹：窗口恰为当月 1/2/3 日 ─────────────────────────
def p_r6a_stub_signature(months):
    hits = 0
    for m in months:
        days = all_days(m)
        key = m.get("month_key") or ""
        if len(days) == 3 and key[:7] and all(
                d == "%s-%02d" % (key[:7], i) for i, d in enumerate(days, 1)):
            hits += 1
    return hits


# ── D3(护栏) · 每期必须有窗口（**严禁 null / 空**）────────────────
#    注：仅守「非空」⇒ 现状绿（伪桩会填满）⇒ 定级为护栏。
def p_d3_nonempty(months):
    return ["%s 窗口为空（违反 D3 严禁 null）" % m.get("month_key")
            for m in months if len(all_days(m)) == 0]


# ── D3b(目标) · 窗口天数必须 1~3 ────────────────────────────────
#    注：现状 **红**（2027-08 真分支吐出 5 天）⇒ 是待修目标，不是护栏。
def p_d3_size(months):
    return ["%s 窗口 %d 天（应 1~3 天）" % (m.get("month_key"), len(all_days(m)))
            for m in months if len(all_days(m)) > 3]


# ── D4 · 字段统一：只许复数 peak_windows，不得残留单数 ─────────────
def p_d4_plural_only(months):
    bad = []
    for m in months:
        if "peak_windows" not in m:
            bad.append("%s 缺 peak_windows" % m.get("month_key"))
        if "peak_window" in m:
            bad.append("%s 仍残留单数 peak_window" % m.get("month_key"))
    return bad


# ── D4(护栏) · 复数数组长度 1~3 ──────────────────────────────────
def p_d4_plural_size(months):
    bad = []
    for m in months:
        n = len(win_list(m))
        if not (1 <= n <= 3):
            bad.append("%s peak_windows 长度 %d（应 1~3）" % (m.get("month_key"), n))
    return bad


# ── R5 · 高纬布尔位 ───────────────────────────────────────────────
def p_r5_flag(meta, expect):
    return meta.get("is_high_latitude_fallback") is expect


def p_r5_threshold(meta, expect_sys):
    """护栏：66.5° 物理阈值 —— 极圈内降级、极圈外不降级。"""
    return meta.get("house_system") == expect_sys


# ── 护栏 · 窗口不得跨月 ──────────────────────────────────────────
def p_window_in_month(months):
    bad = []
    for m in months:
        key = m.get("month_key") or ""
        for d in all_days(m):
            if not str(d).startswith(key[:7]):
                bad.append("%s → %s" % (key, d))
    return bad


# ═══════════════════════════════════════════════════════════════════
def main():
    results = []
    def check(ok, name, detail=""):
        results.append((bool(ok), name, detail))

    # ── S1 灵敏度自检（必须全绿：判据必须有区分力）──────────────────
    NEG = [{"month_key": "2026-10",
            "peak_window": {"window_days": ["2026-10-01", "2026-10-02", "2026-10-03"],
                            "reason": "Sun aligns with House 9"}}]
    POS = [{"month_key": "2026-10",
            "peak_windows": [{"window_days": ["2026-10-14", "2026-10-15"],
                              "reason": "Venus trine Jupiter (orb 1.8°)"}]}]
    LEAK = [{"month_key": "2026-08", "peak_window": {"reason": "Planet 0 conjoins planet 5"}}]
    s1 = []
    # R6b
    if p_r6b_no_index_leak(LEAK) == []:            s1.append("R6b 正例未判红")
    if p_r6b_no_index_leak(POS):                   s1.append("R6b 负例误报")
    # R6c
    if p_r6c_no_hardcoded_reason(NEG) == []:       s1.append("R6c 正例未判红")
    if p_r6c_no_hardcoded_reason(POS):             s1.append("R6c 负例误报")
    # R6a
    if p_r6a_stub_signature(NEG) != 1:             s1.append("R6a 正例未判红")
    if p_r6a_stub_signature(POS) != 0:             s1.append("R6a 负例误报")
    # D3
    if p_d3_nonempty([{"month_key": "2026-10", "peak_windows": []}]) == []:
        s1.append("D3 空窗口未判红")
    if p_d3_nonempty(POS):                         s1.append("D3 正例误报")
    if p_d3_size([{"month_key": "2026-10",
                   "peak_windows": [{"window_days": ["2026-10-%02d" % i for i in range(1, 6)]}]}]) == []:
        s1.append("D3b 超长窗口未判红")
    if p_d3_size(POS):                             s1.append("D3b 正例误报")
    # D4
    if p_d4_plural_only(NEG) == []:                s1.append("D4 单数残留未判红")
    if p_d4_plural_only(POS):                      s1.append("D4 正例误报")
    # R5
    if p_r5_flag({"is_high_latitude_fallback": True}, True) is False:  s1.append("R5 判据恒假")
    if p_r5_flag({"is_high_latitude_fallback": False}, True) is True:  s1.append("R5 判据恒真")
    # 跨月护栏
    if p_window_in_month([{"month_key": "2026-10",
                           "peak_window": {"window_days": ["2026-11-01"]}}]) == []:
        s1.append("跨月护栏未判红")
    check(not s1, "S1 灵敏度自检", "；".join(s1) or "九条判据均有区分力")

    # ── 真实引擎 ────────────────────────────────────────────────────
    tm, err = run_engine(TARGET)
    if tm is None:
        check(False, "S0 引擎可运行", "%s（%s）" % (TARGET["tag"], err))
        _report(results, None)
        return
    months = tm.get("months") or []
    meta = tm.get("meta") or {}
    check(len(months) >= 12, "S0 引擎产出 12 个月", "实得 %d 个月" % len(months))

    # ── R6b 索引泄漏 ────────────────────────────────────────────────
    leak = p_r6b_no_index_leak(months)
    check(not leak, "V492-R6b reason 无行星索引泄漏",
          "泄漏 %d 处：%s" % (len(leak), "; ".join(leak[:3])) if leak else "无泄漏")

    # ── R6c 硬编 reason 模板 ────────────────────────────────────────
    hc = p_r6c_no_hardcoded_reason(months)
    check(not hc, "V492-R6c reason 非硬编模板（D3: 须实算）",
          "硬编 %d 处：%s" % (len(hc), hc[0]) if hc else "无硬编模板")

    # ── R6a 伪桩指纹 ────────────────────────────────────────────────
    stub = p_r6a_stub_signature(months)
    check(stub < 3, "V492-R6a 伪桩窗口已消除",
          "仍命中伪桩指纹 %d/12 个月（当月 1–3 日）" % stub if stub >= 3 else "命中 %d/12" % stub)

    # ── D3 护栏：每期非空（严禁 null）────────────────────────────────
    de = p_d3_nonempty(months)
    check(not de, "G12(护栏) D3: 每期窗口非空（严禁 null）",
          "；".join(de[:3]) if de else "12/12 期非空")

    # ── D3b 目标：窗口天数 1~3 ──────────────────────────────────────
    ds = p_d3_size(months)
    check(not ds, "V492-D3b 窗口天数 1~3",
          "；".join(ds[:3]) if ds else "全部合规")

    # ── D4 字段统一：复数 only ──────────────────────────────────────
    d4 = p_d4_plural_only(months)
    check(not d4, "V492-D4 字段统一为复数 peak_windows（无单数残留）",
          "；".join(d4[:3]) if d4 else "全部月份已统一")

    # ── D4 护栏：复数数组长度 ───────────────────────────────────────
    d4s = p_d4_plural_size(months)
    check(not d4s, "G13(护栏) peak_windows 长度 1~3",
          "；".join(d4s[:3]) if d4s else "全部合规")

    # ── R5 高纬布尔位 ───────────────────────────────────────────────
    check(p_r5_flag(meta, True), "V492-R5 is_high_latitude_fallback=true（极圈内）",
          "meta=%s" % json.dumps({k: meta.get(k) for k in
                                  ("house_system", "is_high_latitude_fallback", "rising_sign")},
                                 ensure_ascii=False))

    # ── R5/阈值 护栏：对照盘不得降级 ────────────────────────────────
    cm, cerr = run_engine(CONTROL)
    if cm is None:
        check(False, "S0b 对照盘引擎可运行", "%s（%s）" % (CONTROL["tag"], cerr))
    else:
        cmeta = cm.get("meta") or {}
        check(p_r5_threshold(cmeta, "Placidus"),
              "G09(护栏) 66.5° 阈值：极圈外仍用 Placidus",
              ("house_system=%s" % cmeta.get("house_system")) if p_r5_threshold(cmeta, "Placidus")
              else "house_system=%s（护栏失败 ⇒ 阈值被下调，会造成同城异制）" % cmeta.get("house_system"))
        check(p_r5_flag(cmeta, False),
              "V492-R5b 极圈外 is_high_latitude_fallback=false",
              "实得 %r" % cmeta.get("is_high_latitude_fallback"))

    # ── 护栏：窗口不得跨月 ──────────────────────────────────────────
    cross = p_window_in_month(months)
    check(not cross, "G11(护栏) window_days 不跨月",
          "跨界 %d 处：%s" % (len(cross), "; ".join(cross[:3])) if cross else "全部落在本月内")

    _report(results, tm)


def _report(results, tm):
    print("=" * 74)
    print("V492 闸门 · R5 高纬提示透传 + R6 财富窗口相位实算 + D4 字段统一 ｜ 基线")
    print("  目标盘：%s" % TARGET["tag"])
    print("  引擎  ：%s" % ENGINE)
    print("=" * 74)
    npass = 0
    for i, (ok, name, detail) in enumerate(results, 1):
        mark = "ok  " if ok else "FAIL"
        if ok:
            npass += 1
        print("%-4s %2d. %s" % (mark, i, name))
        if detail:
            print("          ↳ %s" % detail)
    print("-" * 74)
    print("通过 %d / %d" % (npass, len(results)))

    if tm:
        ms = tm.get("months") or []
        print("\n── 窗口字段现状抽样（前 4 个月）──")
        for m in ms[:4]:
            w = win_list(m)
            shape = "复数 peak_windows" if "peak_windows" in m else (
                "单数 peak_window" if "peak_window" in m else "（无窗口字段）")
            print("  %s  [%s]  days=%s  reason=%r" % (
                m.get("month_key"), shape, ",".join(all_days(m)),
                (all_reasons(m) or [""])[0]))
        print("\n── meta ──")
        print("  " + json.dumps(tm.get("meta") or {}, ensure_ascii=False))

    print("\n注：S1 灵敏度自检与 G09/G11/G12/G13 护栏为「必须绿」项（护栏现在就绿，职责是防修复误伤）；")
    print("    V492-R* / V492-D* 为实现后应转绿的目标项。G12 守 D3「严禁 null」这条产品红线。")


if __name__ == "__main__":
    main()
