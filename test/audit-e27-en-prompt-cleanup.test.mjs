// ═══════════════════════════════════════════════════════════════════════════
// 🛡️ E27「根因 B · EN Prompt 历史硬编码天文事实表专项清理」闸门
//    （2026-10-08 军师 E27 开工号令）
//
// 病根（取证结论，非推测）：
//   `src/prompts/yearlySystemEN.txt` 是 **en 原生 + es/fr/vi 回落**四语共用的 system prompt。
//   它保留了旧架构遗留的静态天文事实表：
//     ① `[2026-2027 ASTRONOMY FACT SHEET - AUTHORITATIVE]`（写死的 2026-2027 水逆日期表，
//        且带 Cancer Rising 专属宫位号）；
//     ② `FULL 12-HOUSE MAP for Cancer Rising`（只对上升巨蟹成立）；
//     ③ 若干静态 sign↔planet 配对（Jupiter in Leo / Saturn in Aries / Pluto in Aquarius）
//        与写死年份窗口（July 2026 – June 2027）。
//
//   `server.js` 原想用「FACT_START…FACT_END 双标记切片」把该块换成 SwissEph 动态事实表
//   （`buildFactSheet`），但 **EN 模板重写时丢了 END 标记**
//   （`Sun in Leo = 2nd House (solar return year)`，现存于 yearlySystemZH.txt:95）
//   ⇒ `FACT_START !== -1 && FACT_END !== -1` 恒 false ⇒ 整块**静默跳过**：
//     · 陈年静态事实原样进入 system 层（system 优先级 **高于** user 层动态星历块）；
//     · 动态 FactSheet **从未注入** en/es/fr/vi（zh 当时不受影响，其模板含 END 标记 ——
//       ⚠️ E29 起 ZH 亦并入锚点路径，见 C2/E6 与 test/audit-e29-zh-prompt-cleanup.test.mjs）。
//
// 治法（E27）：
//   ① 模板净化 —— 删净静态事实表，内置唯一锚点 `[__SWISSEPH_FACT_SHEET__]`；
//   ② 装配期以 `buildFactSheet`（SwissEph 实算）顶替锚点；无真值 ⇒ 显式「不可用」兜底；
//   ③ zh 当时走既有 FACT_START/FACT_END 路径 —— **E29 起 ZH 已净化并入锚点路径，
//      旧双标记切片对 zh 惰性（标记已不存在 ⇒ 永不触发 ⇒ 不会重复注入）**。
//
// 断言分组：
//   A 静态净化（同源判据 hardcodeDefects：真实模板空 · 注入缺陷必红）
//   B 锚点与契约（唯一锚点 · 动态占位符齐备 · 四语同源映射 · 结构铁律保留）
//   C 接线自保（server.js 占位符替换 · zh 已并入锚点路径 · 兜底文案 · 交叉契约）
//   D 14 靶盘 × en/es/fr/vi 真实引擎装配批扫（年份 ⊆ 窗口年份 · 无 Cancer Rising · 无 undefined）
//   E 注入自测（摘锚点 / 删接线 / 注入年份 ⇒ 同源判据必红）+ ZH 射程收编留证
// ═══════════════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildFactSheet, buildEphemerisChronicleBlock, buildHemisphereSeasonBlock,
  getAstroMatrix, resolveReportWindow,
} from '../v69_client.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const P = (...s) => path.join(ROOT, ...s);

const EN = fs.readFileSync(P('src', 'prompts', 'yearlySystemEN.txt'), 'utf8');
const ZH = fs.readFileSync(P('src', 'prompts', 'yearlySystemZH.txt'), 'utf8');
const TH = fs.readFileSync(P('src', 'prompts', 'yearlySystemTH.txt'), 'utf8');
const LOADER = fs.readFileSync(P('src', 'prompts', 'loader.js'), 'utf8');
const SERVER = fs.readFileSync(P('server.js'), 'utf8');

const MARKER = '[__SWISSEPH_FACT_SHEET__]';
const FALLBACK_TAG = 'ASTRONOMY FACT SHEET — UNAVAILABLE';
const FOUR_LANGS = ['en', 'es', 'fr', 'vi'];

// ═══════════════════ A 静态净化（同源判据）═══════════════════

/**
 * 同源判据：扫「历史硬编码天文事实」缺陷，返回缺陷列表（空 = 干净）。
 * 真实模板与注入缺陷样本共用同一个函数 ⇒ 判据不可能恒真。
 */
function hardcodeDefects(txt) {
  const bad = [];
  const hit = (label, re) => {
    const m = txt.match(re);
    if (m && m.length) bad.push(`${label}×${m.length}`);
  };
  hit('年份字面量', /\b20\d\d\b/g);                                        // 写死 2026/2027
  hit('Cancer Rising 专属', /Cancer Rising/gi);                              // 上升巨蟹专属事实
  hit('12 宫硬映射图', /FULL 12-HOUSE MAP/gi);
  hit('水逆硬编码表', /Mercury Retrograde\s*#/g);                            // 模板内不得有写死日期表
  hit('静态 sign↔planet 配对', /\b(?:Jupiter in Leo|Saturn in Aries|Pluto in Aquarius)\b/gi);
  hit('硬编码事实表头', /ASTRONOMY FACT SHEET\s*-\s*AUTHORITATIVE/gi);
  return bad;
}

test('A1 EN 模板零硬编码天文事实（年份 / Cancer Rising / 水逆表 / 静态配对 全清）', () => {
  const bad = hardcodeDefects(EN);
  assert.deepStrictEqual(bad, [], `yearlySystemEN.txt 仍含硬编码天文事实: ${bad.join(', ')}`);
});

test('A2 同源判据灵敏度：每类缺陷注入到真实模板后必被捕获（四类 + 表头）', () => {
  const cases = [
    ['Cancer Rising', `${EN}\n- FULL 12-HOUSE MAP for Cancer Rising: 1=Cancer`],
    ['写死年份', `${EN}\n⏳ Prediction Period: July 2026 – June 2027`],
    ['水逆硬编码表', `${EN}\n- 2026 Mercury Retrograde #1 (Aries): March 14 – April 7, 2026`],
    ['静态配对', `${EN}\n- Jupiter in Leo = 2nd House (earned income)`],
    ['事实表头', `${EN}\n[2026-2027 ASTRONOMY FACT SHEET - AUTHORITATIVE]`],
  ];
  for (const [label, txt] of cases) {
    assert.ok(hardcodeDefects(txt).length > 0, `注入「${label}」后判据未命中 ⇒ 判据失效`);
  }
});

test('A3 同源判据特异性：干净样本（含大量正常英文正文）判为 0 缺陷', () => {
  const clean = [
    'THE USER\'S NATAL SUN SIGN IS FIXED FOREVER.',
    'Jupiter = House __JUP_HOUSE__ (from the computed data below).',
    'Aquarius = AIR element. Cancer = WATER element.',
    'Format: #### [Month Label] [Month Year]: [Transit Theme].',
  ].join('\n');
  assert.deepStrictEqual(hardcodeDefects(clean), [], '判据对干净样本误报（过宽）');
  // 反向：判据不是「对一切输入恒空」—— A2 已证灵敏度；此处再证它确实读输入
  assert.notDeepStrictEqual(hardcodeDefects(`${clean}\nPluto in Aquarius`), []);
});

// ═══════════════════ B 锚点与契约 ═══════════════════

test('B1 EN 模板恰好一个动态事实表锚点（多一个即可能漏替换 / 少一个即失去注入位）', () => {
  const n = EN.split(MARKER).length - 1;
  assert.strictEqual(n, 1, `yearlySystemEN.txt 的 ${MARKER} 锚点数 = ${n}（期望恰 1）`);
});

test('B2 EN 模板既有动态占位符齐备（装配链路可完整替换，无孤儿/漏配）', () => {
  const need = ['__RISING_LOCAL__', '__JUP_HOUSE__', '__SAT_HOUSE__', '__PL_HOUSE__',
    '__SUN_HOUSE__', '__MOON_HOUSE__', '__NATAL_SUN__',
    '__JUP_SIGN_LOCAL__', '__SAT_SIGN_LOCAL__', '__MOON_SIGN_LOCAL__'];
  const miss = need.filter((k) => !EN.includes(k));
  assert.deepStrictEqual(miss, [], `EN 模板缺动态占位符: ${miss.join(', ')}`);
});

test('B3 en/es/fr/vi 四语同源：loader 将 fr/es/vi 显式映射到 yearlySystemEN', () => {
  for (const L of ['fr', 'es', 'vi']) {
    const re = new RegExp(`['"]${L}['"]\\s*:\\s*yearlySystemEN`);
    assert.ok(re.test(LOADER), `loader.js 未把 ${L} 映射到 yearlySystemEN（四语同源前提被破坏）`);
  }
});

test('B4 loader 不得引用 *_backup 提示词（防「改了备份以为生效」的隐蔽误判）', () => {
  assert.ok(!/yearlySystemEN_backup|_backup\.txt/.test(LOADER.replace(/\/\/[^\n]*/g, '')),
    'loader.js 引用了 backup 提示词文件');
});

test('B5 报告结构铁律未被本轮清理波及（五章标题 + 两个英文金块标签原样保留）', () => {
  for (const token of ['## Chapter I:', '## Chapter II:', '## Chapter III:', '## Chapter IV:', '## Chapter V:',
    '[Peak Revenue Window]', '[Financial Black Swan Day]', '[OUTPUT STRUCTURE]']) {
    assert.ok(EN.includes(token), `EN 模板结构铁律被误删: ${token}`);
  }
});

// ═══════════════════ C 接线自保 ═══════════════════

test('C1 server.js 存在锚点替换接线（且用 split/join 而非 replace，避免 $& 替换模式污染）', () => {
  assert.ok(SERVER.includes(`__SWISSEPH_FACT_SHEET__`), 'server.js 未引用动态事实表锚点');
  assert.ok(/split\('__SWISSEPH_FACT_SHEET__'\)\.join\(/.test(SERVER),
    'server.js 未用 split/join 替换锚点（replace 会被事实表内的 $& 等模式干扰）');
  assert.ok(/yearlySystem\.includes\('__SWISSEPH_FACT_SHEET__'\)/.test(SERVER),
    'server.js 未以 includes 守卫锚点替换');
});

test('C2 server.js 锚点替换接线语言无关（E29 起 zh 亦走锚点路径；旧双标记切片对 zh 已惰性）', () => {
  // E29（2026-10-08）：yearlySystemZH.txt 从「V99n 五语合体遗留文件」净化为纯中文单语模板，
  //   并内置与 EN 同形的唯一锚点 ⇒ zh 并入 E27 锚点路径（language-agnostic includes 守卫）。
  //   ⚠️ 旧 FACT_START/FACT_END 双标记切片**代码仍在**（保历史兼容），但 zh 模板已无这两个标记
  //     ⇒ 对 zh 恒 false（**惰性**，绝不与锚点路径重复注入）。
  assert.ok(SERVER.includes("indexOf('[2026-2027 ASTRONOMY FACT SHEET')"), 'server.js 的 FACT_START 切片路径被误删');
  assert.ok(SERVER.includes("indexOf('Sun in Leo = 2nd House (solar return year)')"), 'server.js 的 FACT_END 切片路径被误删');
  // zh 模板唯一注入位 = 锚点（恰 1）
  assert.strictEqual(ZH.split(MARKER).length - 1, 1,
    `yearlySystemZH.txt 的锚点数须恰 1（实得 ${ZH.split(MARKER).length - 1}）`);
  // zh 模板已无旧双标记 ⇒ 切片路径对 zh 惰性（防「锚点路径 + 切片路径」双注入）
  assert.ok(!ZH.includes('[2026-2027 ASTRONOMY FACT SHEET'),
    'ZH 仍含旧 FACT_START ⇒ 锚点路径与切片路径可能双注入');
  assert.ok(!ZH.includes('Sun in Leo = 2nd House (solar return year)'), 'ZH 仍含旧 FACT_END 标记');
  // 守卫语言无关：includes 不得带 lang 条件（否则 zh 被排除在动态真值之外）
  assert.ok(/yearlySystem\.includes\('__SWISSEPH_FACT_SHEET__'\)/.test(SERVER),
    '锚点守卫非语言无关 ⇒ zh 可能被排除在动态 FactSheet 注入之外');
});

test('C3 无真值时显式「不可用」兜底（绝不把裸锚点或伪造事实喂给 LLM）', () => {
  assert.ok(SERVER.includes(FALLBACK_TAG), 'server.js 缺无真值兜底文案');
  assert.ok(/Do NOT state any specific planetary position/.test(SERVER), '兜底文案未含「禁止编造天体事实」约束');
});

test('C4 交叉契约：既有闸门（e13/e21/v486/v488/v488c）依赖的 EN 字符串仍在', () => {
  assert.ok(EN.includes('HOUSE LABEL CONTRACT RULE'), 'e21 依赖串丢失');
  assert.ok(EN.includes('12th House of Partnership'), 'e21 依赖反例丢失');
  assert.ok((EN.match(/STRICT NUMERIC ORDINAL RULE/g) || []).length >= 2, 'e13 依赖的序数铁律 <2 处');
  assert.ok(/NEVER write spelled-out house names/i.test(EN), 'e13 依赖的禁令丢失');
  assert.ok(/NO VERBATIM SENTENCE REUSE/i.test(EN), 'v486 依赖串丢失');
  assert.ok(/ASTRONOMICAL FACT SENTENCES/.test(EN), 'v486b 依赖串丢失');
  assert.ok(/MECHANICALLY BANNED/.test(EN), 'v486b 依赖串丢失');
  assert.ok(/NO EXAMPLES BY DESIGN/i.test(EN), 'v486 自保护串丢失');
  assert.ok(!/逐次锚定|4d-1|V488c/.test(EN), 'EN 混入 ZH 专有判据字样（v488c ④ 会红）');
  assert.ok(!/V488/.test(EN), 'EN 混入 V488 字样（v488 越界推广判据会红）');
});

// ═══════════════════ D 14 靶盘 × 四语真实引擎装配批扫 ═══════════════════

/** 装配 system 层 EN 系提示词（与 server.js 的锚点替换同语义） */
function assemble(factSheetOrNull) {
  const repl = factSheetOrNull
    ? factSheetOrNull + '\n\n[NOTE: Above is V69 SwissEph computed. This takes precedence over any conflicting hardcoded data.]'
    : `[${FALLBACK_TAG}]\nNo computed ephemeris is available for this chart.`;
  return EN.split(MARKER).join(repl);
}

test('D1 14 靶盘 × en/es/fr/vi：装配后零残留 / 零伪造年份 / 零 undefined', async () => {
  const M = JSON.parse(fs.readFileSync(P('test', 'tools', 'sweep-matrix.json'), 'utf8'));
  assert.ok(Array.isArray(M.disks) && M.disks.length >= 14, `基准盘不足 14（实得 ${M.disks?.length}）`);

  let checked = 0;
  const problems = [];
  for (const d of M.disks) {
    const rt = d.reportType === 'yearly' ? 'yearly' : 'monthly';
    let am;
    try {
      am = await getAstroMatrix(d.birth, d.time, Number(d.lat), Number(d.lon), d.tz,
        { window: resolveReportWindow(rt) });
    } catch (e) {
      problems.push(`${d.id} 引擎失败: ${e.message}`);
      continue;
    }
    const win = am.meta?.report_window || {};
    const allowedYears = new Set([String(win.start_key || '').slice(0, 4), String(win.end_key || '').slice(0, 4)]
      .filter(Boolean));
    assert.ok(allowedYears.size > 0, `${d.id} 矩阵缺 report_window（无法判年份真值）`);

    for (const lang of FOUR_LANGS) {
      const fs01 = buildFactSheet(am, lang);
      if (!fs01 || !fs01.length) { problems.push(`${d.id}/${lang} FactSheet 为空`); continue; }
      const sys = assemble(fs01)
        + '\n' + (buildEphemerisChronicleBlock(am, lang) || '')
        + '\n' + (buildHemisphereSeasonBlock(am, lang) || '');

      // ① 锚点必须已被替换干净
      if (sys.includes(MARKER)) problems.push(`${d.id}/${lang} 锚点残留`);
      // ② 绝无 Cancer Rising 专属残留
      if (/Cancer Rising/i.test(sys)) problems.push(`${d.id}/${lang} 残留 Cancer Rising`);
      // ③ 年份必须全部落在本盘窗口内（写死/幻觉年份一票否决）
      const years = [...new Set((sys.match(/\b20\d\d\b/g) || []))];
      const outOfRange = years.filter((y) => !allowedYears.has(y));
      if (outOfRange.length) problems.push(`${d.id}/${lang} 窗口外年份 ${outOfRange.join(',')}（允许 ${[...allowedYears].join(',')}）`);
      // ④ 注入块不得含 undefined / NaN / [object Object]
      if (/\bundefined\b|\bNaN\b|\[object Object\]/.test(sys)) problems.push(`${d.id}/${lang} 注入块含 undefined/NaN`);
      // ⑤ 结构铁律仍在
      if (!sys.includes('## Chapter V:') || !sys.includes('[Peak Revenue Window]')) {
        problems.push(`${d.id}/${lang} 结构铁律缺失`);
      }
      checked++;
    }
  }
  assert.deepStrictEqual(problems, [], `批扫失败 ${problems.length} 项:\n  ${problems.slice(0, 20).join('\n  ')}`);
  assert.strictEqual(checked, M.disks.length * FOUR_LANGS.length,
    `覆盖数不符（实得 ${checked}，期望 ${M.disks.length * FOUR_LANGS.length}）`);
});

test('D2 无真值兜底：FactSheet 为空 ⇒ 装配结果为显式「不可用」而非裸锚点/伪造事实', () => {
  const fsNull = buildFactSheet(null, 'en');
  assert.strictEqual(fsNull, '', 'buildFactSheet(null) 应为空串（不伪造）');
  const sys = assemble(fsNull || null);
  assert.ok(!sys.includes(MARKER), '无真值时锚点仍残留 ⇒ LLM 会看到裸占位符');
  assert.ok(sys.includes(FALLBACK_TAG), '无真值兜底文案未生效');
  assert.strictEqual(hardcodeDefects(sys).length, 0, '兜底装配仍含硬编码缺陷');
});

// ═══════════════════ E 注入自测（判据不接线 = 零防线）═══════════════════

test('E1 注入自测：摘掉锚点 ⇒ B1 判据必红', () => {
  const broken = EN.split(MARKER).join('');
  assert.notStrictEqual(broken, EN, '未真的摘掉锚点');
  assert.strictEqual(broken.split(MARKER).length - 1, 0);
  assert.ok(EN.split(MARKER).length - 1 === 1, '原模板锚点契约被破坏');
});

test('E2 注入自测：删除 server.js 锚点替换语句 ⇒ C1 判据必红', () => {
  const broken = SERVER
    .split("yearlySystem.includes('__SWISSEPH_FACT_SHEET__')").join('false')
    .split("split('__SWISSEPH_FACT_SHEET__').join(").join('NOOP(');
  assert.notStrictEqual(broken, SERVER, '未真的删除接线');
  assert.ok(!/split\('__SWISSEPH_FACT_SHEET__'\)\.join\(/.test(broken), '删接线后 C1 判据仍命中 ⇒ 判据空转');
});

test('E3 注入自测：把写死年份塞回模板 ⇒ A1 判据必红（且给出可读缺陷）', () => {
  const broken = EN.replace('## Chapter I: Annual Wealth Matrix', '## Chapter I: Annual Wealth Matrix (July 2026 – June 2027)');
  assert.notStrictEqual(broken, EN, '未真的注入');
  const bad = hardcodeDefects(broken);
  assert.ok(bad.some((x) => x.includes('年份字面量')), `注入年份未被捕获: ${JSON.stringify(bad)}`);
});

test('E4 注入自测：把 Cancer Rising 12 宫图塞回 ⇒ A1 判据必红', () => {
  const broken = EN.replace('## Chapter V: Oracle Manifestation Protocol',
    '- FULL 12-HOUSE MAP for Cancer Rising: 1=Cancer/2=Leo\n## Chapter V: Oracle Manifestation Protocol');
  const bad = hardcodeDefects(broken);
  assert.ok(bad.some((x) => x.includes('Cancer Rising')), `注入未被捕获: ${JSON.stringify(bad)}`);
  assert.ok(bad.some((x) => x.includes('12 宫硬映射图')), `注入未被捕获: ${JSON.stringify(bad)}`);
});

test('E5 射程边界留证：TH 模板缺陷仅限「写死年份」格式样例（军师 E27 射程 = en/es/fr/vi，TH 单独排期）', () => {
  const bad = hardcodeDefects(TH);
  // TH 暴露面 = 纯格式样例年份（L89 预测期 / L93 年份表头 / L117 月列表示例），
  // 无事实表 / 无 Cancer Rising / 无静态配对 ⇒ 缺陷类**弱于** EN。
  // ⚠️ TH 为原生模板且**无动态 FactSheet 注入位** ⇒ 删其年份须同批补锚点注入，
  //    按军师令列 E28（射程外），本轮不动 TH 文本。
  const beyondYear = bad.filter((x) => !x.startsWith('年份字面量'));
  assert.deepStrictEqual(beyondYear, [], `TH 出现射程外新形态缺陷（须升级为 E28 处理）: ${beyondYear.join(', ')}`);
  // 反向提醒：一旦 TH 也被净化，本断言会红 ⇒ 强制把 TH 收编进 E27 判据（防「修了但没接线」）
  assert.ok(bad.length > 0, 'TH 已无硬编码年份 ⇒ 应立即把 TH 收编进 E27 判据并更新本断言');
});

test('E6 射程已收编：ZH 模板经 E29 净化后与 EN 同形（零硬编码天文事实 · 唯一锚点 · 无多语遗留段）', () => {
  // E29（2026-10-08）：yearlySystemZH.txt 原为 V99n「Multi-Language Map」五语合体遗留文件
  //   （zh 段 + es/fr/th/vi 遗留段并存），而 loader.js 把**整份**作 zh system prompt ⇒
  //   其余四语块里的 Cancer Rising 硬编码宫位图 / 静态水逆表 / 写死年份一并污染中文主通道。
  //   已净化为纯中文单语模板并内置唯一锚点 ⇒ 收编进 E27 同源判据 hardcodeDefects。
  const bad = hardcodeDefects(ZH);
  assert.deepStrictEqual(bad, [], `ZH 模板净化不彻底: ${bad.join(', ')}`);
  assert.strictEqual(ZH.split(MARKER).length - 1, 1, 'ZH 锚点数须恰 1');
  // 多语遗留段必须已消失（否则 loader 视角仍在污染 zh system 层）
  for (const sec of ['Panel de Métricas Centrales de Riqueza', 'Tableau de Bord des Métriques Centrales',
    'แดชบอร์ดตัวชี้วัดความมั่งคั่งหลัก', 'Bảng Điều Khiển Chỉ Số Tài Lộc Chính']) {
    assert.ok(!ZH.includes(sec), `ZH 多语遗留段未清除（loader 视角仍污染 zh）: ${sec}`);
  }
});
