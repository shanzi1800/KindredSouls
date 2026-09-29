// ═══════════════════════════════════════════════════════════════════════
// ── V475: 年报文本完整度闸门（纯函数，可单测） ──
// ═══════════════════════════════════════════════════════════════════════
//
// 【为什么必须有这道闸门】
// 2026-09-29 生产事故：中文年报全文"每隔两三个字缺一个字"（"太阳双子座"→"太双"、
// "先知神谕 · 财富启示录"→"先 · 财录"），应数万字的报告 5199 字就提前收笔，
// 且被写入 Supabase 缓存 → 后续同盘请求永久 HIT 到毒化文本。
// V394-fix3 的缓存卫生守卫只防 vi 拆词/占位符残渣，对 zh 缺字退化完全不设防。
//
// 【判别原理】(2026-09-29 双样本标定, 每千字密度)
//   字        事故文本   健康文本
//   座        3.1       15.9     ← 被灭杀 81%
//   星        2.3       13.3     ← 被灭杀 83%
//   宫        5.7       12.5     ← 被灭杀 54%
//   (合计)   11.1       41.7
//   长度      5199      10518~21677
// 占星密集中文年报中，座/星/宫 三字密度健康值≈42/千字，缺字退化文本骤降到≈11/千字。
// 阈值取 20/千字 + 长度下限 7000 字，两侧留足安全边距。

const SIGNS_CHARS = ['座', '星', '宫'];

/**
 * 评估年报文本完整度。
 * @param {string} text
 * @param {object} [opts]
 * @param {string} [opts.lang='zh']       仅 zh 启用密度判据；其余语言返回 not-applicable
 * @param {number} [opts.minChars=7000]   年报正文最小可信长度
 * @returns {{ ok: boolean, applicable: boolean, metrics: object, reasons: string[] }}
 */
export function assessYearlyReportIntegrity(text, opts = {}) {
  const lang = opts.lang || 'zh';
  const minChars = opts.minChars ?? 7000;
  const metrics = { length: text ? text.length : 0 };
  const reasons = [];

  if (!text || text.trim().length === 0) {
    return { ok: false, applicable: true, metrics, reasons: ['空文本'] };
  }
  if (lang !== 'zh') {
    // 非中文暂不启用密度判据（缺字退化的多语言标定样本不足），仅做长度护栏
    const ok = text.length >= minChars;
    return { ok, applicable: false, metrics, reasons: ok ? [] : [`长度 ${text.length} < ${minChars}`] };
  }

  const perK = (ch) => (text.split(ch).length - 1) * 1000 / text.length;
  let astroDensity = 0;
  for (const ch of SIGNS_CHARS) {
    const d = perK(ch);
    metrics['density_' + ch] = Math.round(d * 10) / 10;
    astroDensity += d;
  }
  metrics.astroDensityPerK = Math.round(astroDensity * 10) / 10;

  if (text.length < minChars) {
    reasons.push(`长度 ${text.length} 字 < 下限 ${minChars}（健康年报 ≥10000 字）`);
  }
  if (astroDensity < 20) {
    reasons.push(`座/星/宫 合计密度 ${metrics.astroDensityPerK}/千字 < 20（健康≈42，缺字退化≈11）`);
  }

  return { ok: reasons.length === 0, applicable: true, metrics, reasons };
}
