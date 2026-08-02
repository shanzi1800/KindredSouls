# -*- coding: utf-8 -*-
# V221 三病灶根治补丁：A 采样参数 / B circuit_tag重命名+周次填空清除 / C Prompt预填充+移除{{}}指令
import re

path = '/Users/apple/Desktop/KindredSouls源代码/server.js'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

report = []

# === 病灶 A: 采样参数 (line 126) ===
old_a = "max_tokens: 8000, temperature: 0.7, frequency_penalty: 1.0, presence_penalty: 0.5, stream: true"
new_a = "max_tokens: 8000, temperature: 0.7, frequency_penalty: 0.3, presence_penalty: 0.5, repetition_penalty: 1.05, stream: true"
n = c.count(old_a)
c = c.replace(old_a, new_a)
report.append(("A:采样参数(frequency_penalty 1.0->0.3 + repetition_penalty 1.05)", n))

# === 病灶 C: 预填充注入 (callDeepSeekStream 签名后, 所有流式报告唯一漏斗) ===
sig = "async function callDeepSeekStream(systemText, userText, controller, res, onChunk, astroMatrix, realSunSign, lang, reportType = 'yearly') {"
inject = sig + """
  // 🛠️ V221: Prompt 预填充真值——彻底弃用 {{}} 占位符机制(主公裁决·方案2)
  // 送进 LLM 前用 astroMatrix 本命盘真值把 {{SUN_HOUSE}} 等替换为 第X宫,
  // 物理杜绝模型因看见 {{}} 非自然 token 而退化,也避免标记裸奔进成品。
  try {
    const _natalH = astroMatrix?.meta?.computed_houses || {};
    const _gJupH = _natalH.Jupiter?.house ?? 2;
    const _gSatH = _natalH.Saturn?.house ?? 10;
    const _gPltH = _natalH.Pluto?.house ?? 8;
    const _gSunH = _natalH.Sun?.house ?? 1;
    const _gMooH = _natalH.Moon?.house ?? 2;
    const _houseTok = {
      '{{JUPITER_HOUSE}}': '第' + _gJupH + '宫',
      '{{SATURN_HOUSE}}': '第' + _gSatH + '宫',
      '{{PLUTO_HOUSE}}': '第' + _gPltH + '宫',
      '{{SUN_HOUSE}}': '第' + _gSunH + '宫',
      '{{MOON_HOUSE}}': '第' + _gMooH + '宫',
    };
    for (const [_t, _v] of Object.entries(_houseTok)) {
      if (_t) { systemText = (systemText || '').split(_t).join(_v); userText = (userText || '').split(_t).join(_v); }
    }
    // 兜底: 清除任何残留 {{...}}
    systemText = (systemText || '').replace(/\\{\\{[A-Z0-9_]+\\}\\}/g, '第1宫');
    userText = (userText || '').replace(/\\{\\{[A-Z0-9_]+\\}\\}/g, '第1宫');
  } catch (e) { /* 预填充失败不影响主流程 */ }
"""
n = c.count(sig)
c = c.replace(sig, inject, 1)
report.append(("C:预填充注入(callDeepSeekStream)", n))

# === 病灶 C: 移除 {{}} 原样保留指令 (USER_TEMPLATE zh 3286-3291) ===
old_instr = """⛔ [不可变 Token 铁律·P0]: 提到行星宫位时，你必须原样保留以下不可变标记（不要写成'第N宫'或任何数字，后端会用真实宫位自动替换）:
  • 木星宫位 → {{JUPITER_HOUSE}}
  • 土星宫位 → {{SATURN_HOUSE}}
  • 冥王星宫位 → {{PLUTO_HOUSE}}
  • 本命太阳宫位 → {{SUN_HOUSE}}
  • 月亮宫位 → {{MOON_HOUSE}}
例如正确写法: "木星在狮子座{{JUPITER_HOUSE}}带来财富"。错误写法: "木星在狮子座第5宫"(数字会被后端覆盖，且可能错)。"""
new_instr = "⛔ [宫位直写铁律]: 提到行星宫位时，直接写\"第N宫\"（如\"木星在狮子座第2宫带来财富\"），严禁使用任何 {{}} 模板占位符或英文 token 标记。后端不再做占位符替换。"
n = c.count(old_instr)
c = c.replace(old_instr, new_instr)
report.append(("C:移除{{}}原样保留指令", n))

# === 病灶 B: circuit_tag 重命名 (12处, 6语言 x HT/HT_RP) ===
circuit_map = {
  "'⚠️ 安全指令：'": "'【风险提示：】'",
  "'⚠️ Safety Directive:'": "'【Risk Alert:】'",
  "'⚠️ Directiva de Seguridad:'": "'【Alerta de Riesgo:】'",
  "'⚠️ Directive de Sécurité :'": "'【Alerte de Risque :】'",
  "'⚠️ คำสั่งความปลอดภัย:'": "'【คำเตือนความเสี่ยง:】'",
  "'⚠️ Chỉ thị An toàn:'": "'【Cảnh Báo Rủi Ro:】'",
}
for o, nw in circuit_map.items():
    cnt = c.count(o)
    c = c.replace(o, nw)
    report.append(("B:circuit_tag " + o, cnt))

# === 病灶 B: 清除周次 Day 填空行 (${HT.circuit}第X日 / Day X 等) ===
patterns = [
  r'\n\s*\$\{HT\.circuit\}第X日\s*\n',
  r'\n\s*\$\{HT\.circuit\}Day X\s*\n',
  r'\n\s*\$\{HT_RP\.circuit\}第X日\s*\n',
  r'\n\s*\$\{HT_RP\.circuit\}Day X\s*\n',
  r'\n\s*\$\{HT_RP\.circuit_tag\}Day X\s*\n',
  r'\n\s*\$\{HT_RP\.circuit_tag\}第X日\s*\n',
]
for p in patterns:
    cnt = len(re.findall(p, c))
    c = re.sub(p, '\n', c)
    report.append(("B:fill-in " + p[:34], cnt))

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)

print("=== V221 补丁应用报告 ===")
for name, cnt in report:
    flag = "  <-- 异常!请检查" if cnt == 0 and ('A:' in name or 'C:' in name or 'B:circuit_tag' in name) else ""
    print(f"  {name}: {cnt}{flag}")
