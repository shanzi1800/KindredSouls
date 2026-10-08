// ═══════════════════════════════════════════════════════════════════════════
// 🛡️ E25-P1③「南半球季节反转锁」闸门（2026-10-08 军师开工令 阵地三）
//
// 病灶（2026-10-08 线上取证, 跨 3 盘 4 语）：
//   报告由 LLM 生成, 其「至点/分点」季节命名**恒取北半球口径**, 而引擎早已
//   按 lat 符号确知半球 —— 半球信息从未进过 prompt, 输出侧也无任何纠正。
//   · Ushuaia(lat -54.80) es 年报 4/4 全错（22sep=otoño / 21dic=invierno /
//     20mar=primavera / 21jun=verano），另加本命句 "nacido bajo el solsticio
//     de verano de 2002"（6/21 生, 南半球应为 invierno）。
//   · Adelaide(lat -34.93) en 年报 "December 21: The Winter Solstice — the
//     longest night of the year"（12/21 南半球应为 Summer Solstice + 最长白昼）。
//
// 口径（军师裁决）：南半球 ⇒ 12月=verano/夏、6月=invierno/冬、3月=otoño/秋、
//   9月=primavera/春。双管齐下：① prompt 注入正确季节名 ② 后处理锁纠正错配。
//
// 铁律（本闸门守护）：
//   · **必须存在锚点**（月名 / 四轴星座名）才纠正 —— 无锚点一律弃权（宁漏不改）。
//     绝不做裸反转：文本若**已经**是南半球正确写法, 裸反转会把它改错。
//   · 北半球 / lat 未知 ⇒ 逐字节不变。
//   · zh ⇒ 逐字节不变（中文「春/夏/秋/冬」大量作隐喻, 节气专名不随半球反转;
//     既有纪律要求 zh 判定路径逐字节不变）。
//   · 幂等；只改季节词/昼夜长度词, 不动句式与其余字符。
// ═══════════════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { closureDecls, matchBracket } from './tools/extract_decls.mjs';
import { buildHemisphereSeasonBlock as realHemi } from '../v69_client.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf-8');
const v69 = fs.readFileSync(path.join(__dirname, '..', 'v69_client.js'), 'utf-8');

function stripComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/[^\n]*$/gm, ' ').replace(/([^:])\/\/[^\n]*/g, '$1 ');
}

const LOG_SHIM = { console: { log() {}, warn() {} }, process: { env: {} } };

function buildLock(source = src) {
  const { source: code } = closureDecls(source, ['lockHemisphereSeasons']);
  const ctx = vm.createContext({ ...LOG_SHIM });
  vm.runInContext(code + '\nglobalThis.__L = lockHemisphereSeasons;', ctx);
  return ctx.__L;
}
// v69_client 的函数是 `export function`, indexDecls 只认行首 `function` ⇒ 用 matchBracket 手工切片。
//   切片必须与导出体同源（下方 C0 交叉校验提取体与真实 ES 导出逐字一致）。
function hemiCode(source = v69) {
  const b0 = source.indexOf('const _HS_SEASON_BLOCK = ');
  assert.ok(b0 >= 0, '未找到 _HS_SEASON_BLOCK');
  const blockSrc = source.slice(b0, matchBracket(source, source.indexOf('{', b0))) + ';';
  const f0 = source.indexOf('buildHemisphereSeasonBlock(');
  assert.ok(f0 >= 0, '未找到 buildHemisphereSeasonBlock');
  const head = source.lastIndexOf('\n', f0) + 1;
  const pi = source.indexOf('(', f0);
  const bi = source.indexOf('{', matchBracket(source, pi));
  const fnSrc = source.slice(head, matchBracket(source, bi)).replace(/^\s*export\s+/, '');
  return blockSrc + '\n' + fnSrc + '\n; globalThis.__H = buildHemisphereSeasonBlock;';
}
function buildHemi(source = v69) {
  const ctx = vm.createContext({ ...LOG_SHIM });
  vm.runInContext(hemiCode(source), ctx);
  return ctx.__H;
}

const SOUTH = { meta: { natal_lat: -54.8019 } };   // Ushuaia 实测纬度
const SOUTH2 = { meta: { natal_lat: -34.9285 } };  // Adelaide 实测纬度
const NORTH = { meta: { natal_lat: 21.0285 } };    // 曼谷（北半球）
const UNK = { meta: {} };

// ── 线上真实样本（2026-10-08 从生产 ai_insights_cache 抽取, 逐字保留）──
const ES_BLACK_SWAN = [
  '**[Día del Cisne Negro Financiero: 22 de septiembre]**  El equinoccio de otoño marca un punto de inflexión. El Sol entra en Libra.',
  '**[Día del Cisne Negro Financiero: 21 de diciembre]**  El solsticio de invierno marca el punto más oscuro del año.',
  '**[Día del Cisne Negro Financiero: 20 de marzo]**  El equinoccio de primavera marca un punto de inflexión.',
  '**[Día del Cisne Negro Financiero: 21 de junio]**  El solsticio de verano marca el punto más luminoso del año.',
].join('\n');
const ES_BLACK_SWAN_OK = [
  '**[Día del Cisne Negro Financiero: 22 de septiembre]**  El equinoccio de primavera marca un punto de inflexión.',
  '**[Día del Cisne Negro Financiero: 21 de diciembre]**  El solsticio de verano marca un punto luminoso.',
  '**[Día del Cisne Negro Financiero: 20 de marzo]**  El equinoccio de otoño marca un punto de inflexión.',
  '**[Día del Cisne Negro Financiero: 21 de junio]**  El solsticio de invierno marca el punto más oscuro del año.',
].join('\n');
const ES_NATAL_SOLSTICE = 'Oh hijo de Cáncer, nacido bajo el solsticio de verano de 2002, tu carta natal es un mapa de tensiones.';
const EN_BLACK_SWAN = [
  '**[Financial Black Swan Day]** December 21, 2026: The Winter Solstice — the longest night of the year — coincides with a square.',
  '**[Financial Black Swan Day]** June 21, 2027: The Summer Solstice — the longest day of the year — coincides with a square.',
].join('\n');
const EN_BLACK_SWAN_OK = [
  '**[Financial Black Swan Day]** December 21, 2026: The Summer Solstice — the longest day of the year — coincides with a square.',
  '**[Financial Black Swan Day]** June 21, 2027: The Winter Solstice — the longest night of the year — coincides with a square.',
].join('\n');
const ZH_SAMPLE = '**12月21日冬至**，这是一年中最漫长的夜晚；6月21日夏至，白昼最长。';

// ═══════════════════════════════ A 静态 ═══════════════════════════════

test('A1 锁存在 + 半球/语言守卫 + 锚点门 齐备', () => {
  const b = stripComments(src.match(/function lockHemisphereSeasons\([\s\S]*?\n\}\n/)[0]);
  assert.ok(/_HS_LANGS\s*=\s*\[\s*'es'\s*,\s*'en'\s*,\s*'fr'\s*\]/.test(src),
    '语言射程必须是 es/en/fr（zh/th/vi 射程外）');
  assert.ok(/if\s*\(!_HS_LANGS\.includes\(lang\)\)\s*return text;/.test(b), '缺语言守卫');
  assert.ok(/natal_lat/.test(b), '未读 astroMatrix.meta.natal_lat');
  assert.ok(/if\s*\(!Number\.isFinite\(lat\)\s*\|\|\s*lat\s*>=\s*0\)\s*return text;/.test(b),
    '缺半球守卫（lat>=0 / 未知必须弃权）');
  assert.ok(/_HS_ANCHOR_MAXD\s*=\s*\d+/.test(src), '缺锚点最大字距常量');
  assert.ok(/_HS_CARDINAL_RE\s*=\s*\{[^}]*solsticio\|equinoccio/.test(src), '缺至点/分点射程门关键词表');
  assert.ok(/if\s*\(!cardinalRe\.test\(win\)\)\s*continue;/.test(b), '缺「季节词须与至点/分点同窗」射程门');
  assert.ok(/if\s*\(!mo\)\s*continue;/.test(b), '缺「无锚点弃权」（宁漏不改）');
  assert.ok(/want\s*===\s*cls/.test(b), '缺幂等短路（已正确不改）');
});

test('A2 三处挂载：lockHemisphereSeasons 紧跟 lockEphemerisDates, 且不破坏 V485→V488 紧邻', () => {
  const mounts = [
    /reportContent = lockEphemerisDates\(reportContent[\s\S]{0,160}?\n\s*reportContent = lockHemisphereSeasons\(reportContent/,
    /if \(ft\) ft = lockEphemerisDates\(ft[\s\S]{0,160}?\n\s*if \(ft\) ft = lockHemisphereSeasons\(ft/,
    /cleanedText = lockEphemerisDates\(cleanedText[\s\S]{0,160}?\n\s*cleanedText = lockHemisphereSeasons\(cleanedText/,
  ];
  mounts.forEach((re, i) => assert.ok(re.test(src), `第 ${i + 1} 处挂载形态不符`));
  // V485 → V488 必须仍紧邻（既有闸门 audit-v488-yearly-sunref 的 ⑨ 判据）
  assert.ok(/lockYearlyOuterPlanetsYear\(reportContent[\s\S]{0,200}?\n\s*reportContent = lockYearlyNonMonthSunRef\(reportContent/.test(src),
    'V485→V488 紧邻被破坏');
  assert.ok(!/lockHemisphereSeasons\(reportContent[\s\S]{0,120}?lockYearlyNonMonthSunRef/.test(src),
    '新锁不得插到 V485/V488 之间');
});

test('A3 prompt 侧：六语模板注入 ${_ephemBlock}${_hemiBlock}; 空串零扰动', () => {
  const n = (src.match(/\$\{_ephemBlock\}\$\{_hemiBlock\}/g) || []).length;
  assert.ok(n >= 6, `六语模板注入点应 ≥6, 实得 ${n}`);
  assert.ok(/const _hemiBlock = _hsBlock \? \('\\n\\n' \+ _hsBlock\) : '';/.test(src),
    '_hemiBlock 必须「空串即零扰动」（不得引入多余换行 ⇒ 北半球 prompt 逐字节不变）');
  assert.ok(/buildHemisphereSeasonBlock/.test(src.match(/^import \{[\s\S]*?\} from '\.\/v69_client\.js';/m)[0]),
    '未从 v69_client 导入 buildHemisphereSeasonBlock');
  assert.ok(/export function buildHemisphereSeasonBlock\(/.test(v69), 'v69_client 未导出 buildHemisphereSeasonBlock');
});

test('A4 南半球月→季映射同源（12=summer / 6=winter / 3=autumn / 9=spring）', () => {
  const b = stripComments(src.match(/function _hsSeasonOfMonth\([\s\S]*?\n\}\n/)[0]);
  assert.ok(/mo === 12 \|\| mo === 1 \|\| mo === 2\)\s*return 'summer'/.test(b), '12/1/2 月须为 summer');
  assert.ok(/mo >= 3 && mo <= 5\)\s*return 'autumn'/.test(b), '3~5 月须为 autumn');
  assert.ok(/mo >= 6 && mo <= 8\)\s*return 'winter'/.test(b), '6~8 月须为 winter');
  assert.ok(/mo >= 9 && mo <= 11\)\s*return 'spring'/.test(b), '9~11 月须为 spring');
  assert.ok(/_HS_SIGN_MONTH = \{ Aries: 3, Cancer: 6, Libra: 9, Capricorn: 12 \}/.test(src), '四轴星座→至点月份表缺失/漂移');
});

// ═══════════════════════════════ B 行为 ═══════════════════════════════

test('B1 es 12月至点：invierno→verano + 「punto más oscuro」→「punto más luminoso」', () => {
  const L = buildLock();
  const out = L(ES_BLACK_SWAN, 'es', SOUTH, 'yearly');
  assert.ok(out.includes('21 de diciembre]**  El solsticio de verano'), '『solsticio de invierno』未被纠正为 verano');
  assert.ok(out.includes('marca el punto más luminoso del año'), '『punto más oscuro』未随季节纠正(自相矛盾)');
  // 12月行不得再出现 invierno（6月行的 invierno 是南半球正解, 不在此断言内）
  const decLine = out.split('\n').find((l) => l.includes('21 de diciembre'));
  assert.ok(decLine && !/invierno/.test(decLine), `12月行仍含 invierno: ${decLine}`);
});

test('B2 es 6月至点：verano→invierno + 「punto más luminoso」→「punto más oscuro」', () => {
  const L = buildLock();
  const out = L(ES_BLACK_SWAN, 'es', SOUTH, 'yearly');
  assert.ok(out.includes('21 de junio]**  El solsticio de invierno'), '『solsticio de verano』未被纠正为 invierno');
  assert.ok(out.includes('marca el punto más oscuro del año'), '『punto más luminoso』未随季节纠正(自相矛盾)');
});

test('B3 es 二分点：9月 otoño→primavera、3月 primavera→otoño（成对）', () => {
  const L = buildLock();
  const out = L(ES_BLACK_SWAN, 'es', SOUTH, 'yearly');
  assert.ok(out.includes('22 de septiembre]**  El equinoccio de primavera'), '9月 equinoccio de otoño 未纠正');
  assert.ok(out.includes('20 de marzo]**  El equinoccio de otoño'), '3月 equinoccio de primavera 未纠正');
});

test('B4 es 本命句（星座锚）：Cáncer + solsticio de verano → invierno', () => {
  const L = buildLock();
  const out = L(ES_NATAL_SOLSTICE, 'es', SOUTH, 'yearly');
  assert.ok(out.includes('nacido bajo el solsticio de invierno de 2002'),
    '本命「solsticio de verano」未被纠正（星座锚 Cáncer 未生效）');
});

const decLineOf = (out) => out.split('\n').find((l) => l.includes('December 21')) || '';
const junLineOf = (out) => out.split('\n').find((l) => l.includes('June 21')) || '';

test('B5 en 12月至点：Winter Solstice→Summer + longest night→longest day（行内成对）', () => {
  const L = buildLock();
  const dec = decLineOf(L(EN_BLACK_SWAN, 'en', SOUTH2, 'yearly'));
  assert.ok(dec.includes('December 21, 2026: The Summer Solstice'), '12月 Winter Solstice 未纠正');
  assert.ok(dec.includes('the longest day of the year'), '「longest night」未随季节纠正(自相矛盾)');
  assert.ok(!/longest night/.test(dec), '12月行仍含 longest night');
});

test('B6 en 6月至点：Summer Solstice→Winter + longest day→longest night（行内成对）', () => {
  const L = buildLock();
  const jun = junLineOf(L(EN_BLACK_SWAN, 'en', SOUTH2, 'yearly'));
  assert.ok(jun.includes('June 21, 2027: The Winter Solstice'), '6月 Summer Solstice 未纠正');
  assert.ok(jun.includes('the longest night of the year'), '「longest day」未随季节纠正');
  assert.ok(!/longest day/.test(jun), '6月行仍含 longest day');
});

test('B7 北半球 / lat 未知 ⇒ 逐字节不变', () => {
  const L = buildLock();
  for (const am of [NORTH, UNK, null, {}]) {
    assert.strictEqual(L(ES_BLACK_SWAN, 'es', am, 'yearly'), ES_BLACK_SWAN, '北半球/未知被误改(es)');
    assert.strictEqual(L(EN_BLACK_SWAN, 'en', am, 'yearly'), EN_BLACK_SWAN, '北半球/未知被误改(en)');
  }
});

test('B8 已是南半球正确写法 ⇒ 不得二次反转（裸反转反例）', () => {
  const L = buildLock();
  assert.strictEqual(L(ES_BLACK_SWAN_OK, 'es', SOUTH, 'yearly'), ES_BLACK_SWAN_OK, 'es 已正确样本被改坏');
  assert.strictEqual(L(EN_BLACK_SWAN_OK, 'en', SOUTH2, 'yearly'), EN_BLACK_SWAN_OK, 'en 已正确样本被改坏');
});

test('B9 无锚点 / 无至点分点关键词 ⇒ 弃权（宁漏不改）', () => {
  const L = buildLock();
  const t = 'La primavera es la estación del renacimiento y la esperanza.';
  assert.strictEqual(L(t, 'es', SOUTH, 'yearly'), t, '无锚点句被误改');
  const t2 = 'Saturn sits in the second house and summer brings change.';
  assert.strictEqual(L(t2, 'en', SOUTH2, 'yearly'), t2, '无锚点句被误改(en)');
  // 有月名但无至点/分点关键词 —— 纯月名不构成射程（军师口径 = 「solsticio/equinoccio + 季节名」）
  const t3 = 'December is the month of winter in the northern hemisphere.';
  assert.strictEqual(L(t3, 'en', SOUTH2, 'yearly'), t3, '无至点关键词的纯月名句被误改');
  // 有至点关键词但**无月名/星座锚点** —— 弃权（不得裸反转）
  const t4 = 'El solsticio de primavera marca un punto de inflexión en el cielo.';
  assert.strictEqual(L(t4, 'es', SOUTH, 'yearly'), t4, '无锚点的至点句被裸反转');
});

test('B13 月区间句 ⇒ 弃权（防「自动改出重复词」过纠）', () => {
  const L = buildLock();
  // 病根（2026-10-08 端到端实测, en Adelaide 1993 年报）：月区间跨季, 最近月启发式不可判 ⇒
  //   旧版把 "The autumn and winter months" 两个季节词都锚成 summer ⇒ "The summer and summer months"。
  const lines = [
    '**Phase One: Foundation (July–September 2026).** The summer months are for rebuilding.',
    '**Phase Two: Expansion (October 2026–February 2027).** The autumn and winter months are for growth.',
    '**Phase Three: Harvest (March–June 2027).** The spring months are for reaping.',
  ];
  for (const ln of lines) {
    assert.strictEqual(L(ln, 'en', SOUTH2, 'yearly'), ln, `月区间句被过纠: ${ln}`);
  }
  const joined = lines.join('\n');
  const out = L(joined, 'en', SOUTH2, 'yearly');
  assert.strictEqual(out, joined, '月区间段被过纠');
  assert.ok(!/(\b\w+\b)\s+and\s+\1\b/.test(out), '产出了重复词（过纠硬伤）');
});

test('B10 zh 射程外 ⇒ 逐字节不变（含 12月冬至 这类北半球口径表述）', () => {
  const L = buildLock();
  assert.strictEqual(L(ZH_SAMPLE, 'zh', SOUTH, 'yearly'), ZH_SAMPLE, 'zh 被误改（须逐字节不变）');
});

test('B11 幂等：跑两遍结果一致', () => {
  const L = buildLock();
  const once = L(ES_BLACK_SWAN, 'es', SOUTH, 'yearly');
  const twice = L(once, 'es', SOUTH, 'yearly');
  assert.strictEqual(twice, once, '非幂等（二次运行又改了）');
  const o1 = L(EN_BLACK_SWAN, 'en', SOUTH2, 'yearly');
  assert.strictEqual(L(o1, 'en', SOUTH2, 'yearly'), o1, 'en 非幂等');
});

test('B12 reportType 射程：once 不处理；monthly 处理', () => {
  const L = buildLock();
  assert.strictEqual(L(ES_BLACK_SWAN, 'es', SOUTH, 'once'), ES_BLACK_SWAN, 'once 不应被处理');
  assert.notStrictEqual(L(ES_BLACK_SWAN, 'es', SOUTH, 'monthly'), ES_BLACK_SWAN, 'monthly 应被处理');
});

// ═══════════════════════════════ C prompt 块 ═══════════════════════════════

test('C0（交叉校验）vm 切片体与真实 ES 导出的判定一致', () => {
  const H = buildHemi();
  for (const lang of ['en', 'es', 'fr', 'th', 'vi']) {
    assert.strictEqual(H(SOUTH, lang), realHemi(SOUTH, lang), `${lang} 切片体与导出色不一致（切片漂移）`);
  }
  assert.strictEqual(H(NORTH, 'es'), realHemi(NORTH, 'es'), '北半球切片体与导出不一致');
});

test('C1 buildHemisphereSeasonBlock: 南半球非空且含正确映射; 北半球/未知/zh 恒空', () => {
  const H = realHemi;
  for (const lang of ['en', 'es', 'fr', 'th', 'vi']) {
    const b = H(SOUTH, lang);
    assert.ok(typeof b === 'string' && b.length > 80, `${lang} 南半球 prompt 块为空`);
  }
  assert.ok(/Diciembre[^\n]*VERANO/.test(H(SOUTH, 'es')), 'es 块缺 12月=VERANO');
  assert.ok(/June[^\n]*WINTER/.test(H(SOUTH, 'en')), 'en 块缺 6月=WINTER');
  assert.ok(/Décembre[^\n]*ÉTÉ/.test(H(SOUTH, 'fr')), 'fr 块缺 12月=ÉTÉ');
  assert.ok(/-54\.80/.test(H(SOUTH, 'es')), 'es 块缺纬度标注');
  for (const lang of ['zh', 'en', 'es', 'fr', 'th', 'vi']) {
    assert.strictEqual(H(NORTH, lang), '', `${lang} 北半球应返回空串`);
    assert.strictEqual(H(UNK, lang), '', `${lang} lat 未知应返回空串`);
    assert.strictEqual(H(null, lang), '', `${lang} astroMatrix 为空应返回空串`);
  }
  assert.strictEqual(H(SOUTH, 'zh'), '', 'zh 必须恒为空串（射程外）');
});

// ═══════════════════════ D 注入缺陷自测（判据必须能红）═══════════════════════

test('D1 注入：解除半球守卫 ⇒ B7（北半球逐字节不变）必须红', () => {
  const degraded = src.replace(
    'if (!Number.isFinite(lat) || lat >= 0) return text;',
    'if (!Number.isFinite(lat)) return text;');
  assert.notStrictEqual(degraded, src, '未成功注入缺陷（未匹配半球守卫）');
  const L = buildLock(degraded);
  // B7 判据 = 北半球输出与原串逐字相等。缺陷态下它必须**不相等**（即 B7 会红）。
  assert.notStrictEqual(L(ES_BLACK_SWAN, 'es', NORTH, 'yearly'), ES_BLACK_SWAN,
    '闸门失效: 半球守卫被解除后 B7 仍不红');
});

test('D2 注入：锚点缺省改为 12 月 ⇒ B9（无锚点弃权）必须红', () => {
  const degraded = src.replace(
    'let best = 0, bestD = _HS_ANCHOR_MAXD + 1;',
    'let best = 12, bestD = _HS_ANCHOR_MAXD + 1;');
  assert.notStrictEqual(degraded, src, '未成功注入缺陷（未匹配锚点初值）');
  const L = buildLock(degraded);
  const t = 'El solsticio de primavera marca un punto de inflexión en el cielo.';
  // B9 判据 = 无锚点的至点句逐字不变。缺陷态下它必须**被改**（即 B9 会红）。
  assert.notStrictEqual(L(t, 'es', SOUTH, 'yearly'), t,
    '闸门失效: 锚点缺省为 12 月后 B9 仍不红（裸反转未被拦住）');
});

test('D3 注入：南半球月→季映射改为北半球 ⇒ B1 必须红', () => {
  const degraded = src.replace(
    "  if (mo === 12 || mo === 1 || mo === 2) return 'summer';",
    "  if (mo === 12 || mo === 1 || mo === 2) return 'winter';");
  assert.notStrictEqual(degraded, src, '未成功注入缺陷（未匹配月→季映射）');
  const L = buildLock(degraded);
  // B1 判据 = 12月行须为 verano。缺陷态下该判据必须不成立。
  assert.ok(!L(ES_BLACK_SWAN, 'es', SOUTH, 'yearly').includes('21 de diciembre]**  El solsticio de verano'),
    '闸门失效: 映射改为北半球后 B1 仍不红');
});

test('D4 注入：关闭昼夜长度描述符子锁 ⇒ B5 必须红', () => {
  const degraded = src.replace('const dscFactory = _HS_DESC_RE[lang];', 'const dscFactory = null;');
  assert.notStrictEqual(degraded, src, '未成功注入缺陷（未匹配描述符工厂）');
  const L = buildLock(degraded);
  // B5 判据 = 12月至点行须为 longest day。缺陷态下该行必须仍是 longest night（B5 即红）。
  const dec = decLineOf(L(EN_BLACK_SWAN, 'en', SOUTH2, 'yearly'));
  assert.ok(!/longest day/.test(dec),
    '闸门失效: 描述符子锁关闭后 12月行仍含 longest day（B5 判据无法感知该缺陷）');
});

test('D5 注入：解除 prompt 块半球守卫 ⇒ C1（北半球为空）必须红', () => {
  const degraded = v69.replace(
    "if (!Number.isFinite(lat) || lat >= 0) return '';",
    "if (!Number.isFinite(lat)) return '';");
  assert.notStrictEqual(degraded, v69, '未成功注入缺陷（未匹配 prompt 块半球守卫）');
  const H = buildHemi(degraded);
  // C1 判据 = 北半球返回空串。缺陷态下必须非空。
  assert.notStrictEqual(H(NORTH, 'es'), '', '闸门失效: prompt 块半球守卫被解除后 C1 仍不红');
});

test('D6 注入：解除至点/分点射程门 ⇒ B13（月区间弃权）必须红', () => {
  const degraded = src.replace('if (!cardinalRe.test(win)) continue;', 'if (false) continue;');
  assert.notStrictEqual(degraded, src, '未成功注入缺陷（未匹配射程门）');
  const L = buildLock(degraded);
  const t = '**Phase Two: Expansion (October 2026–February 2027).** The autumn and winter months are for growth.';
  // B13 判据 = 月区间句逐字不变。缺陷态下必须**被改**（且会产出重复词）。
  assert.notStrictEqual(L(t, 'en', SOUTH2, 'yearly'), t,
    '闸门失效: 射程门被解除后 B13 仍不红（月区间过纠未被拦住）');
});
