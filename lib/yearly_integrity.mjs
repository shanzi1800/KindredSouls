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
//
// 【V492/E2 结构性守卫（全语言）】
// 生产实证（2026-10-02 Adelaide 盘英文年报）：旧守卫对非 zh 只查长度 ≥7000，
// 60,029 字符的**第四章中途断句、缺 Final Oracle** 毒文本畅通入库——
// 用户永远刷不到第五章。现对**所有语言**强校验「5 章 + 最终神谕」结构完整性。

const SIGNS_CHARS = ['座', '星', '宫'];

// 章节结构标记（章节坐标是硬真值：5 章 + 最终神谕）
//
// 🛡️ E15/R11f-1 (2026-10-04): **六语本地化章名/终章兼容**。
//   病根：`langInstructions`(server.js) 与各语 prompt 明令 es→`Capítulo`、fr→`Chapitre`、
//   th→`บทที่`、vi→`Chương`、zh→`第N章`，终章亦本地化；而本表原先把
//   `STRUCTURE.fr = STRUCTURE.es = STRUCTURE.en`（注释假设「fr/es/vi 年报回落 en 文案」）
//   ⇒ 闸门只认英文标题 ⇒ 实测 es/fr 产出 `Capítulo I~V` / `Chapitre I~V` 时
//   `chaptersFound=0/5`、th 产出 `คำพยากรณ์ร่ำรวยขั้นสุด` 时判「缺最终章」
//   ⇒ `skipCache=true` **拒绝入库** ⇒ 该语种缓存 0% 命中、每次请求双倍 token + 100~186s。
//   （2026-10-04 12 盘批测实证：`cached=true` 仅 4/12，es/fr/th 共 6 盘全被误杀。）
//   修法：各语为「**英文原文 ∪ 本地化**」并集（英文仍可通过，兼容旧缓存与 LLM 漂移），
//   逐位对齐 I~V；中/泰按各自数字习惯（第N章 / บทที่ N）单列。
const _CH_ROMAN = ['I', 'II', 'III', 'IV', 'V'];
// 罗马数字章名逐位构造：`(?:Chapter|Capítulo)` + 空格 + 罗马数字（`\b` 防 I 吃掉 II）
const _chRoman = (...pats) => _CH_ROMAN.map((r) => new RegExp(`(?:${pats.join('|')})\\s+${r}\\b`, 'i'));
const STRUCTURE = {
  zh: {
    chapters: [/第一章/, /第二章/, /第三章/, /第四章/, /第五章/],
    final: [/最终财富神谕/],
  },
  en: {
    chapters: _chRoman('Chapter'),
    final: [/Final\s+Wealth\s+Oracle/i, /The\s+Final\s+Oracle/i],
  },
  th: {
    chapters: [/บทที่\s*1/, /บทที่\s*2/, /บทที่\s*3/, /บทที่\s*4/, /บทที่\s*5/],
    // E15/R11f-1: th prompt(yearlySystemTH.txt:147) 规定终章为
    //   `### 🔮 คำพยากรณ์ร่ำรวยขั้นสุด · รหัสแห่งการควบคุม` —— 实测产出逐字吻合。
    final: [/Final\s+Wealth\s+Oracle/i, /บทสรุปประจำปี/, /คำพยากรณ์ร่ำรวย/],
  },
  vi: {
    chapters: _chRoman('Chương'),
    // E16/R11h: vi 无原生 prompt（回落 EN 模板）⇒ LLM 终章标题在两形态间波动：
    //   E15 实测 `### FINAL WEALTH ORACLE · Mật Mã Làm Chủ`（EN 形态）；
    //   E16 实测 `### TIÊN TRI TÀI LỘC CUỐI CÙNG · Mật Mã Để Làm Chủ`（本地化形态，
    //   旧判据不认 ⇒ integrity 误报「缺最终章」⇒ 报告被拒、拒绝写库 ⇒ HIT 永灭）。
    //   兜底 `/Mật\s+Mã.*Làm\s+Chủ/`：三盘观测（s5/s11 × 两轮）终章副标题均含
    //   「Mật Mã（密码）…Làm Chủ（掌控）」，为最稳定的完结标记短语。
    final: [
      /Final\s+Wealth\s+Oracle/i,
      /The\s+Final\s+Oracle/i,
      /Tiên\s+Tri\s+Tài\s+Lộc\s+Cuối\s+Cùng/i,
      /Mật\s+Mã[\s\S]{0,40}?Làm\s+Chủ/i,
    ],
  },
  es: {
    chapters: _chRoman('Chapter', 'Cap[ií]tulo'),
    // 实测产出 `### ORÁCULO FINAL DE RIQUEZA · …`（重音容错）
    final: [/Final\s+Wealth\s+Oracle/i, /The\s+Final\s+Oracle/i, /OR[ÁA]CULO\s+FINAL/i],
  },
  fr: {
    chapters: _chRoman('Chapter', 'Chapitre'),
    // 实测产出 `### ORACLE FINAL DE LA RICHESSE · Le Mot de Passe de la Maîtrise`；
    //   当 LLM 把该终章标题降级为粗体（非 # 标题）时，仍有 `Mot de Passe` 兜底（EN 模板
    //   `### 🔮 FINAL WEALTH ORACLE · The Password to Mastery` 的法语直译，稳定出现）。
    final: [/Final\s+Wealth\s+Oracle/i, /The\s+Final\s+Oracle/i, /ORACLE\s+FINAL/i, /Mot\s+de\s+Passe/i],
  },
};

/**
 * 评估年报文本完整度。
 * @param {string} text
 * @param {object} [opts]
 * @param {string} [opts.lang='zh']       zh 启用密度判据；全语言启用结构判据（V492/E2）
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

  // ── V492/E2: 全语言结构判据（章节 + Final Oracle）——缺章坚决不入库 ──
  const S = STRUCTURE[lang] || STRUCTURE.en;
  const missingChapters = S.chapters.filter((re) => !re.test(text));
  const hasFinal = S.final.some((re) => re.test(text));
  metrics.chaptersFound = S.chapters.length - missingChapters.length;
  metrics.chaptersExpected = S.chapters.length;
  metrics.hasFinalOracle = hasFinal;
  if (missingChapters.length > 0) {
    reasons.push(`缺章节标记 ${missingChapters.length}/${S.chapters.length}（结构性截断）`);
  }
  if (!hasFinal) {
    reasons.push('缺最终章（Final Wealth Oracle）——报告未完结');
  }

  if (text.length < minChars) {
    reasons.push(`长度 ${text.length} 字 < 下限 ${minChars}（健康年报 ≥10000 字）`);
  }

  // ── zh 密度判据（V475 原防线，仅中文启用）──
  if (lang === 'zh') {
    const perK = (ch) => (text.split(ch).length - 1) * 1000 / text.length;
    let astroDensity = 0;
    for (const ch of SIGNS_CHARS) {
      const d = perK(ch);
      metrics['density_' + ch] = Math.round(d * 10) / 10;
      astroDensity += d;
    }
    metrics.astroDensityPerK = Math.round(astroDensity * 10) / 10;
    if (astroDensity < 20) {
      reasons.push(`座/星/宫 合计密度 ${metrics.astroDensityPerK}/千字 < 20（健康≈42，缺字退化≈11）`);
    }
  }

  return { ok: reasons.length === 0, applicable: true, metrics, reasons };
}
