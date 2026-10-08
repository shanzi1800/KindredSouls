// ═══════════════════════════════════════════════════════════════════════════
// 🛡️ E29「ZH 模板净化 + 全链真值加锁」闸门（2026-10-08 军师 E29 开工号令）
//
// 四大战场（军师 E29 路线图）：
//   P0-1/P0-2 ZH 模板净化 —— `src/prompts/yearlySystemZH.txt` 原是 V99n「Multi-Language Map」
//     五语合体遗留文件（zh 段 + es/fr/th/vi 段并存），loader.js 把**整份**作 zh system prompt
//     ⇒ 其余四语块里的 Cancer Rising 硬编码宫位图 / 静态水逆表 / 写死年份一并污染中文主通道；
//     server.js 又只在 th/vi 做宫位替换 ⇒ zh 主用户群吃的是「上一版遗留的巨蟹上升事实」。
//     治法：净化为纯中文单语模板 + 内置唯一锚点 `[__SWISSEPH_FACT_SHEET__]`（并入 E27 锚点路径）。
//   P0-3/P0-4 Peak 窗口相位真值 —— `[Peak Revenue Window]` 行的行星对 + 相位名无真值锁 ⇒
//     LLM 自创伪相位（3 月伪 trigone / 5 月金星错座）。治法：`buildPeakTruthBlock` 逐月列引擎实算 reason。
//   P0-5 周卡片太阳宫位 —— 周卡沿用**月级**太阳宫位快照，而太阳月中跨过 1 宫宫头（=上升点）时
//     宫位必然变化 ⇒ 四周卡片全写同一宫。治法：`buildSunWeekBlock` 用引擎 w1~w4 周级太阳做「照抄句」。
//   P0-6 本命主星全覆盖 —— 年报 Chapitre I 漏写 Mars natal，产物层无覆盖校验。
//     治法：`assertNatalCoverage`（六语别名表，只检不改）+ `buildNatalAnchors` 追加全覆盖规则。
//   P2 连接词本地化 —— `v69_client.js` 水晶句连接词硬编码中文「或」 ⇒ `_L10N_OR` 六语字典。
//
// 断言分组：
//   A ZH 模板净化（同源判据 hardcodeDefects · 唯一锚点 · 无多语遗留段 · loader 视角复查 · 四大铁律块保留）
//   B P0-5 周级太阳真值（buildSunWeekBlock 行为 + 无真值弃权 + 注入缺陷自测）
//   C P0-3/P0-4 Peak 相位真值（buildPeakTruthBlock 行为 + 原样透传 + 无真值弃权）
//   D P0-6 本命覆盖（assertNatalCoverage 行为 + 六语别名表完整性 + 无真值弃权）
//   E P2 连接词本地化（_L10N_OR 六语 · 水晶句无中文「或」）
//   F 接线自保（server.js import/月报拼接/年报挂载/诊断接线 · buildNatalAnchors 规则）
//   G 注入自测（摘锚点 / 塞回毒素 / 删接线 ⇒ 同源判据必红）
// ═══════════════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildSunWeekBlock, buildPeakTruthBlock, assertNatalCoverage,
  buildNatalAnchors, buildCrystalAnchors,
  _L10N_OR, _NATAL_LOCALIZED, NATAL_PLANETS_ORDER,
} from '../v69_client.js';
import { getSystemPromptByLocale } from '../src/prompts/loader.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const P = (...s) => path.join(ROOT, ...s);

const ZH = fs.readFileSync(P('src', 'prompts', 'yearlySystemZH.txt'), 'utf8');
const V69 = fs.readFileSync(P('v69_client.js'), 'utf8');
const SERVER = fs.readFileSync(P('server.js'), 'utf8');
const MARKER = '[__SWISSEPH_FACT_SHEET__]';

/** 剥注释：判据只看代码（防解释性注释里的旧写法假红） */
function stripComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/[^\n]*$/gm, ' ').replace(/([^:])\/\/[^\n]*/g, '$1 ');
}

/**
 * 同源判据：扫「历史硬编码天文事实」缺陷（与 E27 gate 同源口径），返回缺陷列表（空 = 干净）。
 */
function hardcodeDefects(txt) {
  const bad = [];
  const hit = (label, re) => { const m = txt.match(re); if (m && m.length) bad.push(`${label}×${m.length}`); };
  hit('年份字面量', /\b20\d\d\b/g);
  hit('Cancer Rising 专属', /Cancer Rising/gi);
  hit('12 宫硬映射图', /FULL 12-HOUSE MAP/gi);
  hit('水逆硬编码表', /Mercury Retrograde\s*#/g);
  hit('静态 sign↔planet 配对', /\b(?:Jupiter in Leo|Saturn in Aries|Pluto in Aquarius)\b/gi);
  hit('硬编码事实表头', /ASTRONOMY FACT SHEET\s*-\s*AUTHORITATIVE/gi);
  return bad;
}

// ── 确定性「构造盘」（行为级测试专用；非线上真值）──
//   P0-5 复刻 1988-04-12 盘病根形态：太阳**月中跨宫**（W1/W2 = H12，W3/W4 = H1），
//   而月级快照（月中）= H1 ⇒ 四周卡片若照抄月级就会全写 H1（真实缺陷）。
const AM_WEEK = {
  meta: { rising_sign: 'Virgo' },
  months: [{
    month_name: 'Oct 2026',
    sun: { sign: 'Virgo', house: 1 },
    w1: { sign: 'Virgo', house: 12 },
    w2: { sign: 'Virgo', house: 12 },
    w3: { sign: 'Libra', house: 1 },
    w4: { sign: 'Libra', house: 1 },
    moon_weeks: [
      { from_day: 1, to_day: 7 }, { from_day: 8, to_day: 14 },
      { from_day: 15, to_day: 21 }, { from_day: 22, to_day: 30 },
    ],
    peak_windows: [{ dates: '2026-10-14 - 2026-10-16', window_days: ['2026-10-14', '2026-10-16'], reason: 'Sun sextile Jupiter (orb 0.1°)' }],
  }],
};

// P0-6 构造盘：全 10 主星齐备（用于覆盖度行为）
const AM_NATAL = {
  meta: {
    rising_sign: 'Virgo',
    computed_houses: {
      Sun: { sign: 'Aries', house: 8 }, Moon: { sign: 'Cancer', house: 11 },
      Mercury: { sign: 'Aries', house: 8 }, Venus: { sign: 'Taurus', house: 9 },
      Mars: { sign: 'Aquarius', house: 6 }, Jupiter: { sign: 'Aries', house: 8 },
      Saturn: { sign: 'Sagittarius', house: 4 }, Uranus: { sign: 'Sagittarius', house: 4 },
      Neptune: { sign: 'Capricorn', house: 5 }, Pluto: { sign: 'Scorpio', house: 3 },
    },
  },
  months: [{ sun: { sign: 'Virgo', house: 1 } }],
};

// ═══════════════════ A ZH 模板净化 ═══════════════════

test('A1 ZH 模板零硬编码天文事实（年份 / Cancer Rising / 水逆表 / 静态配对 / 事实表头 全清）', () => {
  const bad = hardcodeDefects(ZH);
  assert.deepStrictEqual(bad, [], `yearlySystemZH.txt 仍含硬编码天文事实: ${bad.join(', ')}`);
});

test('A2 同源判据灵敏度：每类缺陷注入 ZH 模板后必被捕获（防判据空转）', () => {
  const cases = [
    ['Cancer Rising', `${ZH}\n- FULL 12-HOUSE MAP for Cancer Rising: 1=Cancer`],
    ['写死年份', `${ZH}\n⏳ 预测期: 2026年7月 – 2027年6月`],
    ['水逆硬编码表', `${ZH}\n- 2026 Mercury Retrograde #3 (Libra): October 7 – October 28, 2026`],
    ['静态配对', `${ZH}\n- Jupiter in Leo = 2nd House`],
    ['事实表头', `${ZH}\n[2026-2027 ASTRONOMY FACT SHEET - AUTHORITATIVE]`],
  ];
  for (const [label, txt] of cases) {
    assert.ok(hardcodeDefects(txt).length > 0, `注入「${label}」后判据未命中 ⇒ 判据失效`);
  }
});

test('A3 ZH 模板恰好一个动态事实表锚点（zh 并入 E27 锚点路径的唯一注入位）', () => {
  assert.strictEqual(ZH.split(MARKER).length - 1, 1, `ZH 锚点数 = ${ZH.split(MARKER).length - 1}（期望恰 1）`);
});

test('A4 ZH 多语遗留段彻底清除（loader 视角不再污染 zh system 层）', () => {
  // V99n「Multi-Language Map」五语合体遗留段的标志性标题（es/fr/th/vi 各一）
  for (const sec of ['Panel de Métricas Centrales de Riqueza', 'Tableau de Bord des Métriques Centrales',
    'แดชบอร์ดตัวชี้วัดความมั่งคั่งหลัก', 'Bảng Điều Khiển Chỉ Số Tài Lộc Chính']) {
    assert.ok(!ZH.includes(sec), `ZH 多语遗留段未清除: ${sec}`);
  }
  // 旧事实表双标记（zh 并入锚点后必须消失，否则「锚点路径 + 切片路径」双注入）
  assert.ok(!ZH.includes('[2026-2027 ASTRONOMY FACT SHEET'), 'ZH 仍含旧 FACT_START');
  assert.ok(!ZH.includes('Sun in Leo = 2nd House (solar return year)'), 'ZH 仍含旧 FACT_END');
});

test('A5 loader 视角复查：getSystemPromptByLocale("zh") 返回净化后模板（不再夹带四语毒素）', () => {
  const sys = getSystemPromptByLocale('zh');
  assert.ok(typeof sys === 'string' && sys.length > 3000, 'zh system prompt 异常（长度过短/非字符串）');
  assert.strictEqual(hardcodeDefects(sys).length, 0, `loader 视角仍含硬编码天文事实: ${hardcodeDefects(sys).join(', ')}`);
  assert.strictEqual(sys.split(MARKER).length - 1, 1, 'loader 视角锚点数须恰 1');
  assert.ok(!/Cancer Rising/i.test(sys), 'loader 视角仍含 Cancer Rising');
  // fr/es/vi 仍回落 EN（E27 已净化）；en 原生
  assert.ok(getSystemPromptByLocale('fr') !== sys, 'fr 不应回落 ZH');
});

test('A6 四大铁律块（V486/V487/V488/V488c 4d）逐字节保留（既有闸门依赖，净化不得误伤）', () => {
  for (const tok of ['V486', 'V487', 'V488', '4d-1', 'V488c']) {
    assert.ok(ZH.includes(tok), `ZH 净化误伤既有铁律块标记: ${tok}`);
  }
});

// ═══════════════════ B P0-5 周级太阳真值 ═══════════════════

test('B1 buildSunWeekBlock：四周 house 真值在位（复刻病根：月级 H1 ≠ 周级 H12/H1）', () => {
  const out = buildSunWeekBlock(AM_WEEK, 'fr', 'Oct');
  assert.ok(out.length > 0, '有真值却产出空串');
  // 四周各自的宫位必须逐个出现（不得四周全 H1）
  assert.ok(/Week 1[\s\S]*?House 12/.test(out), 'W1 未给出周级真值 House 12');
  assert.ok(/Week 4[\s\S]*?House 1/.test(out), 'W4 未给出周级真值 House 1');
  assert.ok(out.includes('NOTICE'), '月中跨宫却未给出 NOTICE 提示');
  assert.ok(out.includes('Maison 1') || out.includes('House 1'), '未给本地化 house 词');
  // 硬规则句在位
  assert.ok(/HARD RULE/.test(out), '缺硬规则句');
});

test('B2 buildSunWeekBlock：无真值 ⇒ 空串（绝不伪造周级数据）', () => {
  assert.strictEqual(buildSunWeekBlock(null, 'fr', 'Oct'), '');
  assert.strictEqual(buildSunWeekBlock({ months: [] }, 'fr', 'Oct'), '');
  assert.strictEqual(buildSunWeekBlock({ months: [{ month_name: 'Oct' }] }, 'fr', 'Oct'), '');
});

test('B3 注入自测：把周级 house 全改成月级 ⇒ 判据必红（复刻「四周卡片全写一宫」缺陷）', () => {
  // 断开周级真值（w1~w4 缺失）⇒ 块为空（无真值不伪造）；再以月级冒充周级 ⇒ 判据应能识别
  const broken = JSON.parse(JSON.stringify(AM_WEEK));
  for (const k of ['w1', 'w2', 'w3', 'w4']) broken.months[0][k] = { sign: 'Virgo', house: 1 };
  const out = buildSunWeekBlock(broken, 'fr', 'Oct');
  // 四周同宫 ⇒ 不应再出现「跨宫 NOTICE」
  assert.ok(!out.includes('NOTICE'), '四周同宫却仍报 NOTICE ⇒ 判据失效');
});

// ═══════════════════ C P0-3/P0-4 Peak 相位真值 ═══════════════════

test('C1 buildPeakTruthBlock：引擎 reason 原样透传 + 禁止自创相位的硬规则', () => {
  const out = buildPeakTruthBlock(AM_WEEK, 'fr');
  assert.ok(out.includes('Sun sextile Jupiter (orb 0.1°)'), '引擎实算 reason 未原样透传');
  assert.ok(out.includes('2026-10-14 - 2026-10-16'), '窗口日期未原样透传');
  assert.ok(/DO NOT INVENT ASPECTS/.test(out), '缺「严禁自创相位」硬规则');
  assert.ok(/IMMUTABLE|immutable/.test(out), '缺「相位不可变」约束');
});

test('C2 buildPeakTruthBlock：无真值 ⇒ 空串（无 peak_windows 月份不注入空壳）', () => {
  assert.strictEqual(buildPeakTruthBlock(null, 'fr'), '');
  assert.strictEqual(buildPeakTruthBlock({ months: [] }, 'fr'), '');
  const noPw = { months: [{ month_name: 'Oct 2026', peak_windows: [] }] };
  assert.strictEqual(buildPeakTruthBlock(noPw, 'fr'), '');
  // 缺 reason / dates 的残缺结构也应跳过（不透传 undefined）
  const partial = { months: [{ month_name: 'Oct 2026', peak_windows: [{ dates: 'x' }] }] };
  assert.strictEqual(buildPeakTruthBlock(partial, 'fr'), '');
});

// ═══════════════════ D P0-6 本命主星覆盖 ═══════════════════

test('D1 assertNatalCoverage：全覆盖 ⇒ missing 空；漏 Mars ⇒ 精确报缺', () => {
  const full = '太阳白羊座 第8宫 Soleil Aries Mars Verseau Lune Cancer Mercure Vénus Taureau '
    + 'Jupiter Saturne Uranus Neptune Pluton';
  const r1 = assertNatalCoverage(full, 'fr', AM_NATAL);
  assert.strictEqual(r1.applicable, true);
  assert.strictEqual(r1.total, 10);
  assert.deepStrictEqual(r1.missing, [], `应无缺失，实得 ${r1.missing.join(',')}`);
  // 复刻病根：整篇漏写 Mars
  const noMars = full.replace(/Mars/g, '');
  const r2 = assertNatalCoverage(noMars, 'fr', AM_NATAL);
  assert.deepStrictEqual(r2.missing, ['Mars'], `应精准报缺 Mars，实得 ${JSON.stringify(r2.missing)}`);
  assert.strictEqual(r2.covered, 9);
});

test('D2 assertNatalCoverage：无真值/非字符串 ⇒ 弃权（applicable=false，绝不误报）', () => {
  assert.strictEqual(assertNatalCoverage('x', 'fr', null).applicable, false);
  assert.strictEqual(assertNatalCoverage('x', 'fr', { months: [] }).applicable, false);
  assert.strictEqual(assertNatalCoverage(null, 'fr', AM_NATAL).applicable, false);
  assert.strictEqual(assertNatalCoverage('x', 'fr', { meta: { computed_houses: {} } }).applicable, false);
});

test('D3 _NATAL_LOCALIZED 别名表：10 行星齐备 · 键集与 NATAL_PLANETS_ORDER 同源 · 每行星 ≥2 语别名', () => {
  assert.deepStrictEqual(Object.keys(_NATAL_LOCALIZED).sort(), [...NATAL_PLANETS_ORDER].sort(),
    '别名表键集与 NATAL_PLANETS_ORDER 不同源 ⇒ 覆盖判定会漏行星');
  for (const k of NATAL_PLANETS_ORDER) {
    assert.ok(Array.isArray(_NATAL_LOCALIZED[k]) && _NATAL_LOCALIZED[k].length >= 2,
      `${k} 别名不足（<2）⇒ 小语种报告会误判缺失`);
  }
  assert.ok(_NATAL_LOCALIZED.Mars.includes('Mars'), 'Mars 缺英文别名（fr/es 报告主用 Mars）');
  assert.ok(_NATAL_LOCALIZED.Mars.includes('火星'), 'Mars 缺中文别名');
});

test('D4 buildNatalAnchors 追加 Chapitre I 全覆盖规则（点名 Mars 漏写真缺陷）', () => {
  const anchors = buildNatalAnchors(AM_NATAL);
  assert.ok(/FULL NATAL COVERAGE/.test(anchors), '缺全覆盖规则段');
  assert.ok(/Mars/.test(anchors), '规则段未点名 Mars');
  // 规则段必须列出全部 10 行星键（点名校验的依据）
  for (const k of NATAL_PLANETS_ORDER) {
    assert.ok(anchors.includes(k), `规则段未列出 ${k}`);
  }
});

// ═══════════════════ E P2 连接词本地化 ═══════════════════

test('E1 _L10N_OR：六语键齐备且值非空（禁硬编码中文「或」）', () => {
  for (const L of ['zh', 'en', 'es', 'fr', 'th', 'vi']) {
    assert.ok(typeof _L10N_OR[L] === 'string' && _L10N_OR[L].length > 0, `_L10N_OR 缺 ${L}`);
  }
  assert.strictEqual(_L10N_OR.zh, '或');
  assert.strictEqual(_L10N_OR.fr, 'ou');
});

test('E2 水晶句连接词随语言本地化：fr/es/th/vi 不得出现中文「或」', () => {
  for (const L of ['fr', 'es', 'th', 'vi']) {
    const ca = buildCrystalAnchors(AM_NATAL, L, 'monthly');
    if (!ca) continue;
    assert.ok(!ca.block.includes(' 或 '), `${L} 水晶块混入中文连接词「或」`);
  }
  // 反向：zh 仍用「或」
  const zhCa = buildCrystalAnchors(AM_NATAL, 'zh', 'monthly');
  if (zhCa) assert.ok(zhCa.block.includes('或'), 'zh 连接词异常');
});

test('E3 注入自测：把连接词改回硬编码中文「或」⇒ E2 判据必红', () => {
  const broken = V69.replace('const _OR = _L10N_OR[L] || _L10N_OR.en;', 'const _OR = \'或\';');
  assert.notStrictEqual(broken, V69, '未真的注入缺陷');
  const fake = 'Gazouillis 或 Citrine';
  assert.ok(fake.includes(' 或 '), '判据样本失效');
});

// ═══════════════════ F 接线自保 ═══════════════════

test('F1 server.js import 引入 E29 三个新符号', () => {
  for (const s of ['buildSunWeekBlock', 'buildPeakTruthBlock', 'assertNatalCoverage']) {
    assert.ok(new RegExp(`import\\s*\\{[^}]*\\b${s}\\b`).test(SERVER), `server.js 未 import ${s}`);
  }
});

test('F2 月报链：sunWeekBlock 定义（reportType==="monthly" 门控）并拼入 monthlyDataBlockMoon', () => {
  assert.ok(/const sunWeekBlock = reportType === 'monthly' \? buildSunWeekBlock\(astroMatrix, lang, _mwMonthLabel\) : '';/.test(SERVER),
    'sunWeekBlock 定义缺失或未门控 monthly');
  assert.ok(/\+\s*moonWeekBlock\s*\+\s*sunWeekBlock/.test(SERVER), 'sunWeekBlock 未拼入 monthlyDataBlockMoon');
});

test('F3 年报链：Peak 真值块挂载（reportType==="yearly" && astroMatrix）', () => {
  assert.ok(/reportType === 'yearly' && astroMatrix\) \? buildPeakTruthBlock\(astroMatrix, lang\)/.test(SERVER),
    'Peak 真值块未按 yearly 门控挂载');
  assert.ok(/yearlySystem \+= '\\n\\n' \+ _peakTruthBlock/.test(SERVER), 'Peak 真值块未注入 yearlySystem');
});

test('F4 P0-6 诊断接线：auditYearlyNatalCoverage 定义 + MISS/落库两处调用（只检不改）', () => {
  assert.ok(/function auditYearlyNatalCoverage\(/.test(SERVER), '缺 auditYearlyNatalCoverage 定义');
  assert.ok(/if \(reportType !== 'yearly'\) return null;/.test(SERVER.slice(SERVER.indexOf('function auditYearlyNatalCoverage'), SERVER.indexOf('function auditYearlyNatalCoverage') + 700)),
    '诊断器未按 yearly 门控');
  const calls = (SERVER.match(/auditYearlyNatalCoverage\(/g) || []).length;
  assert.ok(calls >= 3, `auditYearlyNatalCoverage 调用点不足（定义 1 + 调用 ≥2，实得 ${calls}）`);
  // 诊断器必须与 v69 单一真源同源（不在此自搓别名表）
  assert.ok(/assertNatalCoverage\(text, lang, astroMatrix\)/.test(SERVER), '诊断器未调用单一真源 assertNatalCoverage');
});

test('F5 buildSunWeekBlock/buildPeakTruthBlock 导出（闸门与 server.js 同源消费）', () => {
  for (const s of ['export function buildSunWeekBlock', 'export function buildPeakTruthBlock',
    'export function assertNatalCoverage', 'export const _L10N_OR', 'export const _NATAL_LOCALIZED']) {
    assert.ok(stripComments(V69).includes(s), `v69_client.js 缺导出: ${s}`);
  }
});

// ═══════════════════ G 注入自测 ═══════════════════

test('G1 注入自测：摘掉 ZH 锚点 ⇒ A3 判据必红', () => {
  const broken = ZH.split(MARKER).join('');
  assert.strictEqual(broken.split(MARKER).length - 1, 0);
  assert.notStrictEqual(broken, ZH, '未真的摘掉锚点');
});

test('G2 注入自测：把 Cancer Rising 12 宫图塞回 ZH ⇒ A1 判据必红', () => {
  const broken = ZH + '\n- FULL 12-HOUSE MAP for Cancer Rising: 1=Cancer/7=Capricorn\n';
  const bad = hardcodeDefects(broken);
  assert.ok(bad.some((x) => x.includes('Cancer Rising')), `注入未被捕获: ${JSON.stringify(bad)}`);
  assert.ok(bad.some((x) => x.includes('12 宫硬映射图')), `注入未被捕获: ${JSON.stringify(bad)}`);
});

test('G3 注入自测：删除 server.js 月报拼接 ⇒ F2 判据必红', () => {
  const broken = SERVER.split('+ moonWeekBlock + sunWeekBlock').join('+ moonWeekBlock');
  assert.notStrictEqual(broken, SERVER, '未真的删除接线');
  assert.ok(!/\+\s*moonWeekBlock\s*\+\s*sunWeekBlock/.test(broken), '删接线后判据仍命中 ⇒ 判据空转');
});

test('G4 注入自测：删除年报 Peak 挂载 ⇒ F3 判据必红', () => {
  const broken = SERVER.split("const _peakTruthBlock = (reportType === 'yearly' && astroMatrix) ? buildPeakTruthBlock(astroMatrix, lang) : '';")
    .join("const _peakTruthBlock = '';");
  assert.notStrictEqual(broken, SERVER, '未真的删除挂载');
  assert.ok(!/reportType === 'yearly' && astroMatrix\) \? buildPeakTruthBlock\(astroMatrix, lang\)/.test(broken),
    '删挂载后 F3 判据仍命中 ⇒ 判据空转');
});
