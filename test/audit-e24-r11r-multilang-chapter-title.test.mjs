// ═══════════════════════════════════════════════════════════════════════════
// 🛡️ E24/R11r② 多语言章节标题 + 月表同源 + 西语宫位语义标签契约锁 回归闸门
// ═══════════════════════════════════════════════════════════════════════════
// 事故背景（2026-10-06 用户实测 2002-06-21 Ushuaia `lang=es` 线上年报）：
//   ①「流式输出时第一章标题是有的，输出内容全部结束后第一章标题又缺失了」
//     真因：后端 `normalizeYearlyMarkup` 对**非中文**标题必剥两端装饰符（`_V480_DECOR` 含 ✦）
//     并降级 `### `；而前端 `parseLine` 的标题判据只有「行首 ✦ / 中英关键词」两把尺子
//     ⇒ 流式期靠 ✦ 判为金色 heading，落库后 ✦ 被剥 ⇒ 全数跌成白字 text。
//   ②「第二章每月标题格式不一致，有的金色渲染，有的只是普通白色」
//     真因：`isEnglishMonthTitle` **只认英文月前缀**，西语靠前缀巧合命中
//     （Julio←Jul / Septiembre←Sep / Octubre←Oct …），而 Ago≠Aug / Dic≠Dec / Ene≠Jan / Abr≠Apr
//     ⇒ 12 个月里 4 个落白字（Agosto / Diciembre / Enero / Abril）。
//   ③ 星盘自查顺带揪出：西语宫位语义标签错配 3 处（`5ª Casa de Hogar y Raíces` 应 4ª 等）
//     —— E21/E23 契约锁 `if (lang !== 'en') return text;` 只服务 en，西语同形残影无人管。
//   ④ 附带：`lang === 'es'` 的粘连补空格规则把西语合法序数缩略 `5to/9no/2do/11vo` 打散成 `5 to`。
//
// 本闸门纪律：
//   · 判据同源 —— 前端判据**从产品源码抽取**（不另写一份正则），后端判据走 `closureDecls`
//     抽真实声明；月表要求前端 `KS_MONTH_EN/ES` 与后端 `_V480_EN_MON`/`_V480_ES_MON` 逐字节相同。
//   · 每项判据都配**注入缺陷自测**（回退修复即必须红），杜绝「假防线」。
//   · 零误报优先：合法月标题 / 本宫标签**绝不能被剪**，正文句**绝不误判为标题**。
// ═══════════════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { closureDecls } from './tools/extract_decls.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(REPO, 'server.js'), 'utf-8');
const BOX = fs.readFileSync(path.join(REPO, 'web', 'src', 'components', 'SacredYearlyReportBox.tsx'), 'utf-8');

// ── 后端：抽取真实声明（closureDecls 自动传递闭包） ──
const SEEDS = ['stripHouseSemanticLabelMismatch', '_e21CountHouseLabelMismatch', 'normalizeYearlyMarkup', '_V480_CHAP_KW'];
const { map } = closureDecls(SRC, SEEDS);
const drop = [];
for (const n of [...map.keys()]) { try { new vm.Script(map.get(n)); } catch { drop.push(n); map.delete(n); } }
assert.strictEqual(drop.length, 0, `VM 抽取的声明语法不完整: ${drop.join(', ')}`);

function buildBE(hack) {
  const ctx = { console, __exports: {} };
  vm.createContext(ctx);
  const body = [...map.entries()]
    .sort((a, b) => SRC.indexOf(a[1]) - SRC.indexOf(b[1]))
    .map((e) => (hack && Object.prototype.hasOwnProperty.call(hack, e[0]) ? hack[e[0]] : e[1]))
    .join('\n\n');
  vm.runInContext(body + '\n'
    + SEEDS.map((n) => `__exports[${JSON.stringify(n)}] = typeof ${n} !== 'undefined' ? ${n} : undefined;`).join('\n')
    + `\n__exports._E24_ES_HOUSE_RE = _E24_ES_HOUSE_RE;`
    + `\n__exports._e24EsThemeHouses = _e24EsThemeHouses;`
    + `\n__exports._E21_HOUSE_LABEL_RE = _E21_HOUSE_LABEL_RE;`
    + `\n__exports._V480_EN_MON = _V480_EN_MON;`
    + `\n__exports._V480_ES_MON = _V480_ES_MON;`, ctx);
  return ctx.__exports;
}
const BE = buildBE();
for (const n of ['stripHouseSemanticLabelMismatch', '_e21CountHouseLabelMismatch', 'normalizeYearlyMarkup', '_e24EsThemeHouses']) {
  assert.strictEqual(typeof BE[n] === 'function' || typeof BE[n] === 'object', true, `未抽到后端声明 ${n}`);
}

// ── 前端：从 TSX **逐字抽取**判据（无转译器依赖；这些声明都是纯 JS 形态） ──
function grabDecl(src, name) {
  const re = new RegExp('^[ \\t]*(?:export )?const ' + name + ' = .+$', 'm');
  const m = src.match(re);
  assert.ok(m, `未找到前端声明 ${name}`);
  return m[0].replace(/^[ \t]*/, '').replace(/^export /, '');
}
function balancedSlice(src, from) {
  const open = src.indexOf('{', from);
  assert.ok(open > from, '未找到起始大括号');
  let d = 0, i = open, q = null;
  for (; i < src.length; i++) {
    const c = src[i];
    if (q) { if (c === '\\') { i++; continue; } if (c === q) q = null; continue; }
    if (c === '"' || c === "'" || c === '`') { q = c; continue; }
    if (c === '{') d++;
    else if (c === '}') { d--; if (d === 0) { i++; break; } }
  }
  return src.slice(from, i);
}
function bracketSlice(src, from) {
  const open = src.indexOf('[', from);
  assert.ok(open > from, '未找到起始方括号');
  let d = 0, i = open, q = null;
  for (; i < src.length; i++) {
    const c = src[i];
    if (q) { if (c === '\\') { i++; continue; } if (c === q) q = null; continue; }
    if (c === '"' || c === "'" || c === '`') { q = c; continue; }
    if (c === '[') d++;
    else if (c === ']') { d--; if (d === 0) { i++; break; } }
  }
  return src.slice(from, i) + ';';
}
// ⚠️ E24③② 前移：`KS_MONTH_ANY` 新增 `KS_MONTH_VI`/`KS_MONTH_TH` 依赖、判定新引 `KS_DASHBOARD_KW`
//   ⇒ 抽取清单必须同批纳入（漏则 buildFE 拼装时 ReferenceError ⇒ 闸门整体崩）。
const TABLE_NAMES = ['KS_MONTH_EN', 'KS_MONTH_ES', 'KS_MONTH_FR', 'KS_MONTH_VI', 'KS_MONTH_TH', 'KS_MONTH_ANY',
  'KS_CHAPTER_ROMAN', 'KS_ORACLE_ANCHOR', 'KS_DASHBOARD_KW', 'KS_MONTH_TITLE_RE', 'KS_ROMAN_CHAPTER_RE',
  'KS_ORACLE_ANCHOR_RE'];
const DET_NAMES = ['isMultilangMonthTitle', 'isRomanChapterTitle', 'isOracleAnchorTitle'];
const tableLines = TABLE_NAMES.map((n) => grabDecl(BOX, n));
const detLines = DET_NAMES.map((n) => grabDecl(BOX, n));

function buildFE(over) {
  const t = (over && over.tables) || tableLines;
  const d = (over && over.dets) || detLines;
  const fn = new Function('textWithoutIcon',
    t.join('\n') + '\n' + d.join('\n')
    + '\nreturn { isMultilangMonthTitle, isRomanChapterTitle, isOracleAnchorTitle,'
    + ' KS_MONTH_EN, KS_MONTH_ES, KS_MONTH_FR, KS_CHAPTER_ROMAN, KS_ORACLE_ANCHOR, KS_MONTH_TITLE_RE };');
  return fn;
}
const fe = buildFE()('');
function detect(text) { return buildFE()(text); }

// 西语粘连补空格块（lang==='es'）—— 逐字抽取产品源码，注入 `cleaned` 运行
const ES_MARK = "if (lang === 'es') {";
const esIdx = BOX.indexOf(ES_MARK);
assert.ok(esIdx > 0, '未找到 lang===\'es\' 清洗块');
const esBlock = balancedSlice(BOX, esIdx);
const esInner = esBlock.slice(esBlock.indexOf('{') + 1, esBlock.lastIndexOf('}'));
const applyEsGlue = new Function('cleaned', 'lang', esInner + '\nreturn cleaned;');

// chapterPatterns 数组（逐字抽取）
const chapArrIdx = BOX.indexOf('const chapterPatterns = [');
assert.ok(chapArrIdx > 0, '未找到 chapterPatterns');
const CHAP_SRC = bracketSlice(BOX, chapArrIdx);
const CHAPTER_PATTERNS = new Function(CHAP_SRC + '\nreturn chapterPatterns;')();

// advancedUniversalChapterRegex（逐字抽取）
const uniLine = BOX.match(/const advancedUniversalChapterRegex = \/.+\/gi;/);
assert.ok(uniLine, '未找到 advancedUniversalChapterRegex');
const CHAP_RE = new Function(uniLine[0] + '\nreturn advancedUniversalChapterRegex;')();

// 真实线上样盘的章节/月标题形态（2002-06-21 Ushuaia es 终稿，逐字取自落库文本）
const ES_HEADINGS = [
  'ORÁCULO DE RIQUEZA · REVELACIÓN FINANCIERA',
  'Capítulo I: Matriz de Riqueza Anual',
  'Capítulo II: Matriz de Ingresos Mensual 365 Días',
  'Capítulo III: Camino de Carrera del Destino y Órbita de Soberanía',
  'Capítulo IV: Escudo de Deuda y Riesgo (Auditoría de Sombra)',
  'Capítulo V: Protocolo de Manifestación del Oráculo',
  'ORÁCULO FINAL DE RIQUEZA · La Contraseña para la Maestría',
];
// 仪表盘标题走 `chapterPatterns` 关键词路径（与组件内同一条件：行首 40 字内命中 + 全文 < 60 字）
const DASHBOARD_LINE = 'Panel de Métricas Centrales de Riqueza Anual 2026-2027';
const ES_MONTH_LINES = [
  'Julio 2026: Sol en Cáncer Casa 5 · La Semilla del Imperio',
  'Agosto 2026: Sol en Leo Casa 6 · El Taller del Alma',
  'Septiembre 2026: Sol en Virgo Casa 7 · El Espejo de las Alianzas',
  'Octubre 2026: Sol en Libra Casa 8 · El Descenso al Inframundo',
  'Noviembre 2026: Sol en Escorpio Casa 9 · La Búsqueda de la Verdad',
  'Diciembre 2026: Sol en Sagitario Casa 10 · La Coronación Pública',
  'Enero 2027: Sol en Capricornio Casa 11 · La Red de Poder',
  'Febrero 2027: Sol en Acuario Casa 12 · El Silencio Fértil',
  'Marzo 2027: Sol en Piscis Casa 1 · El Renacimiento del Yo',
  'Abril 2027: Sol en Aries Casa 2 · La Forja de la Riqueza',
  'Mayo 2027: Sol en Tauro Casa 3 · La Voz del Poder',
  'Junio 2027: Sol en Géminis Casa 4 · El Regreso al Hogar',
];

// ═══════════════════ 一、后端：六语章节锚点 ═══════════════════
test('① 后端 `_V480_CHAP_KW`: 六语章节 token 全覆盖（zh/en/es/fr/vi/th + 各语神谕锚点）', () => {
  const KW = BE._V480_CHAP_KW;
  // ⚠️ 跨 realm：vm 里 new 出来的 RegExp 不是本 realm 的实例 ⇒ 用 toString 判定（血的教训）
  assert.strictEqual(Object.prototype.toString.call(KW), '[object RegExp]', '_V480_CHAP_KW 未抽到');
  const CASES = [
    ['第五章', true], ['先知神谕 · 财富启示录', true], ['最终财富神谕 · 精通之钥', true],
    ['Chapter I: Annual Wealth Matrix', true], ['Chapter 3', true],
    ['Capítulo I: Matriz de Riqueza Anual', true], ['Capítulo V: Protocolo de Manifestación', true],
    ['Chapitre I : La Matrice Annuelle', true], ['Chương I: Ma Trận Tài Lộc', true],
    ['บทที่ 1: ผังโครงสร้าง', true],
    ['ORÁCULO DE RIQUEZA · REVELACIÓN FINANCIERA', true],
    ['ORÁCULO FINAL DE RIQUEZA · La Contraseña para la Maestría', true],
    ['Oráculo Final de la Abundancia · Código de Maestría', true],
    ['FINAL WEALTH ORACLE · The Password to Mastery', true],
    // ⚠️ 反向：月标题 / 仪表盘 / 正文**绝不能被当成章节**（加入月份名即灾难）
    ['Panel de Métricas Centrales de Riqueza 2026-2027', false],
    ['Tableau de Bord des Métriques Centrales', false],
    ['Sol en Cáncer Casa 5', false],
    ['Julio 2026: Sol en Cáncer · Casa 5', false],
    ['Agosto 2026: Sol en Leo · Casa 6', false],
  ];
  for (const [s, want] of CASES) assert.strictEqual(KW.test(s), want, `_V480_CHAP_KW.test(${JSON.stringify(s)}) 期望 ${want}`);
});

test('② 后端 `normalizeYearlyMarkup`: 六语章节锚点归一 `## `、月标题仍锁 `### `（不得被升格）', () => {
  const nm = (t, l) => BE.normalizeYearlyMarkup(t, l, 'yearly');
  const CASES = [
    ['## ✦ ORÁCULO DE RIQUEZA · REVELACIÓN FINANCIERA ✦', 'es', '## ORÁCULO DE RIQUEZA · REVELACIÓN FINANCIERA'],
    ['### 📜 Capítulo I: Matriz de Riqueza Anual', 'es', '## Capítulo I: Matriz de Riqueza Anual'],
    ['### 📅 Capítulo II: Matriz de Ingresos Mensual 365 Días', 'es', '## Capítulo II: Matriz de Ingresos Mensual 365 Días'],
    ['### 🔮 ORÁCULO FINAL DE RIQUEZA · La Contraseña para la Maestría', 'es', '## ORÁCULO FINAL DE RIQUEZA · La Contraseña para la Maestría'],
    ['### 📜 Chapitre I : La Matrice Annuelle de l\'Abondance', 'fr', '## Chapitre I : La Matrice Annuelle de l\'Abondance'],
    ['### 📅 Chapter I: The Annual Wealth Matrix', 'en', '## Chapter I: The Annual Wealth Matrix'],
    ['### 📜 Chương I: Ma Trận Tài Lộc Định Mệnh Năm', 'vi', '## Chương I: Ma Trận Tài Lộc Định Mệnh Năm'],
    ['### 📜 บทที่ 1: ผังโครงสร้างดวงดาว', 'th', '## บทที่ 1: ผังโครงสร้างดวงดาว'],
  ];
  for (const [inp, lang, want] of CASES) assert.strictEqual(nm(inp, lang), want, `[${lang}] 归一失败: ${inp}`);
  // ⚠️ 月标题**必须**仍为 `### `（绝不可被章节关键词误升格）
  for (const lang of ['es', 'en', 'fr', 'th', 'vi']) {
    const out = nm('#### 📅 Julio 2026: Júpiter Entra en la Casa de la Riqueza', lang);
    assert.ok(out.startsWith('### Julio 2026: '), `[${lang}] 西语月标题层级被破坏: ${out}`);
  }
  const out2 = nm('#### 📅 Julio 2026: Júpiter Entra en la Casa de la Riqueza', 'es');
  assert.ok(!out2.startsWith('## '), '月标题被误升格为章节锚点: ' + out2);
});

test('【注入缺陷自测】把西语/法语 token 从 `_V480_CHAP_KW` 中删掉 → 判据② 必须红', () => {
  const degraded = map.get('_V480_CHAP_KW').replace('|Cap[ií]tulo\\s*[IVX0-9]+|Chapitre\\s*[IVX0-9]+', '');
  assert.ok(degraded !== map.get('_V480_CHAP_KW'), '注入未生效（锚点串变了）');
  const D = buildBE({ _V480_CHAP_KW: degraded });
  const out = D.normalizeYearlyMarkup('### 📜 Capítulo I: Matriz de Riqueza Anual', 'es', 'yearly');
  assert.ok(out.startsWith('### '), '闸门失效: 删掉西语 token 后仍被判为章节锚点（判据② 未红）');
});

// ═══════════════════ 二、前端：月表同源 + 语言感知判据 ═══════════════════
test('③ 月表**同源**：前端 `KS_MONTH_EN/ES` 必须与后端 `_V480_EN_MON`/`_V480_ES_MON` 逐字节相同', () => {
  assert.strictEqual(fe.KS_MONTH_EN, BE._V480_EN_MON, '前端 KS_MONTH_EN 与后端 _V480_EN_MON 不一致（口径漂移）');
  assert.strictEqual(fe.KS_MONTH_ES, BE._V480_ES_MON, '前端 KS_MONTH_ES 与后端 _V480_ES_MON 不一致（口径漂移）');
  assert.ok(fe.KS_MONTH_ES.includes('setiembre'), '西语月表缺 setiembre 变体（与后端同源要求）');
});

test('④ 前端：12 个月标题**全数**判为月标题（含曾落白字的 Agosto/Diciembre/Enero/Abril）', () => {
  let hit = 0;
  for (const line of ES_MONTH_LINES) {
    const r = detect(line);
    if (r.isMultilangMonthTitle) hit++;
    else console.log('  ❌ 未识别为月标题:', line);
    assert.ok(!r.isRomanChapterTitle, `月标题被误判为章节: ${line}`);
  }
  assert.strictEqual(hit, 12, `西语月标题识别 ${hit}/12（应为 12/12）`);
});

test('⑤ 前端：八条西语/多语章节锚点**全数**判为章节标题（不依赖 ✦）', () => {
  for (const line of ES_HEADINGS) {
    const r = detect(line);
    const ok = r.isRomanChapterTitle || r.isOracleAnchorTitle;
    assert.ok(ok, `未识别为章节/神谕锚点: ${line}`);
  }
  // 法语 / 泰语 / 越南语同族（模板同构）
  assert.ok(detect('Chapitre I : La Matrice Annuelle de l\'Abondance').isRomanChapterTitle, '法语 Chapitre 未识别');
  assert.ok(detect('บทที่ 1: ผังโครงสร้างดวงดาว').isRomanChapterTitle, '泰语 บทที่ 未识别');
  assert.ok(detect('Chương I: Ma Trận Tài Lộc').isRomanChapterTitle, '越南语 Chương 未识别');
  // 仪表盘标题（无章节序数词、无 ✦）走 `chapterPatterns` 关键词路径 —— 复刻组件内同一条件
  const asChapterPattern = (s) => CHAPTER_PATTERNS.some((p) => s.slice(0, 40).includes(p)) && s.trim().length < 60;
  assert.ok(asChapterPattern(DASHBOARD_LINE), `仪表盘标题未走关键词路径: ${DASHBOARD_LINE}`);
  assert.ok(!detect(DASHBOARD_LINE).isRomanChapterTitle, '仪表盘标题不应被判为章节序数词形态');
});

test('⑥ 零误报：正文句/普通段落**绝不**被判为章节标题或月标题', () => {
  const NEG = [
    'Capítulo II y III revelan el camino de la abundancia sin pausa',
    'En este capítulo aprenderás a gestionar tu cartera de inversiones',
    'El oráculo dice que debes ahorrar durante los meses de invierno',
    'Júpiter entra en Leo el 30 de junio de 2026, justo antes del ciclo',
    '- Punto clave: revisa tu Casa 5 antes de invertir',
  ];
  for (const s of NEG) {
    const r = detect(s);
    assert.ok(!r.isRomanChapterTitle, `正文被误判为章节标题: ${s}`);
    assert.ok(!r.isMultilangMonthTitle, `正文被误判为月标题: ${s}`);
    assert.ok(!r.isOracleAnchorTitle, `正文被误判为神谕锚点: ${s}`);
  }
});

test('⑦ 前端源码：`chapterPatterns` / `advancedUniversalChapterRegex` 已补齐西语/法语 token', () => {
  for (const p of ['Capítulo I', 'Capítulo V', 'Chapitre I', 'Chapitre V', 'Panel de Métricas']) {
    assert.ok(CHAPTER_PATTERNS.includes(p), `chapterPatterns 缺 ${p}`);
  }
  // advancedUniversalChapterRegex 行为级：行首 `Capítulo I: …` / `Chapitre I : …` 必须被美化包裹
  const es = 'Capítulo I: Matriz de Riqueza Anual'.replace(CHAP_RE, (m, pre, p1, p2, p3, p4, p5, p6, title) => {
    if (m.includes('✦')) return m;
    const heading = p1 ? '✦ 第' + p1 + '章：' + title.trim() + ' ✦'
      : p2 ? '✦ Chapter ' + p2 + ': ' + title.trim() + ' ✦'
        : p3 ? '✦ Chương ' + p3 + ': ' + title.trim() + ' ✦'
          : p4 ? '✦ บทที่ ' + p4 + ': ' + title.trim() + ' ✦'
            : p5 ? '✦ Capítulo ' + p5 + ': ' + title.trim() + ' ✦'
              : p6 ? '✦ Chapitre ' + p6 + ': ' + title.trim() + ' ✦' : m;
    return (pre === '\n' ? '\n' : '\n\n') + heading + '\n\n';
  });
  assert.ok(es.includes('✦ Capítulo I: Matriz de Riqueza Anual ✦'), 'advancedUniversalChapterRegex 未覆盖西语 Capítulo');
  const fr = 'Chapitre I : La Matrice Annuelle'.replace(CHAP_RE, (m, pre, p1, p2, p3, p4, p5, p6, title) => (p6 ? '✦Chapitre ' + p6 + '✦' : m));
  assert.ok(fr.includes('✦Chapitre I✦'), 'advancedUniversalChapterRegex 未覆盖法语 Chapitre');
});

test('【注入缺陷自测】回退成「英文月前缀」旧判据 → 判据④ 必须红', () => {
  assert.ok(!BOX.includes('(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*'),
    '闸门失效: 源码仍残留旧 `isEnglishMonthTitle` 英文前缀正则（修复被回退）');
  assert.ok(BOX.includes('const isMultilangMonthTitle = KS_MONTH_TITLE_RE.test('),
    '闸门失效: 未使用同源月表判据 `isMultilangMonthTitle`');
  // 行为级复刻旧判据 → Agosto 必然漏判
  const OLD = /^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\s*[:：]/i;
  const missed = ES_MONTH_LINES.filter((l) => !OLD.test(l));
  assert.strictEqual(missed.length, 4, `旧判据应恰好漏判 4 个西语月（实得 ${missed.length}）`);
  assert.ok(missed.every((l) => /^(?:Agosto|Diciembre|Enero|Abril)/.test(l)), '漏判项与实测不一致（Agosto/Diciembre/Enero/Abril）');
});

// ═══════════════════ 三、西语宫位语义标签契约锁 ═══════════════════
test('⑧ 西语契约锁：他宫标签必剪、本宫标签必留、月标题必豁免、幂等', () => {
  const lock = (t) => BE.stripHouseSemanticLabelMismatch(t, 'es', 'yearly');
  const PRUNE = [
    ['Júpiter abandona tu 5ª Casa de Hogar y Raíces, donde ha estado', 'Júpiter abandona tu 5ª Casa, donde ha estado'],
    ['se encuentra en Sagitario, en tu 10ª Casa de Redes, Amigos y Ganancias. Plutón', 'se encuentra en Sagitario, en tu 10ª Casa. Plutón'],
    ['se encuentra en Géminis, en tu 4ª Casa de Riqueza y Recursos. Saturno', 'se encuentra en Géminis, en tu 4ª Casa. Saturno'],
  ];
  for (const [inp, want] of PRUNE) assert.strictEqual(lock(inp), want, `剪枝失败: ${inp}`);
  const KEEP = [
    'iluminando tu 1ª Casa de Identidad, Apariencia y Nuevos Comienzos.',
    'iluminando tu 2ª Casa de Riqueza, Recursos y Autoestima.',
    'iluminando tu 3ª Casa de Comunicación, Aprendizaje y Hermanos.',
    'iluminando tu 4ª Casa de Hogar, Raíces y Familia.',
    'iluminando tu 6ª Casa de Trabajo, Rutina y Salud.',
    'iluminando tu 7ª Casa de Asociaciones, Matrimonio y Contratos.',
    'iluminando tu 8ª Casa de Transformación, Intimidad y Recursos Compartidos.',
    'iluminando tu 9ª Casa de Expansión, Viajes y Filosofía Superior, te otorga',
    'iluminando tu 10ª Casa de Carrera, Reputación y Estatus Público.',
    'iluminando tu 11ª Casa de Redes, Amigos y Ganancias.',
    'iluminando tu 12ª Casa de Subconsciente, Karma y Asuntos Ocultos.',
  ];
  for (const s of KEEP) assert.strictEqual(lock(s), s, `合法标签被误剪: ${s}`);
  // 标题行（月标题）豁免
  const HEAD = '### 6ª Casa de Trabajo, Rutina y Salud';
  assert.strictEqual(lock(HEAD), HEAD, '标题行被误剪（月标题豁免失效）');
  // 幂等
  const once = lock(PRUNE.map((x) => x[0]).join('\n'));
  assert.strictEqual(lock(once), once, '契约锁非幂等');
});

test('⑨ 西语契约计数（同源判据）：错配计数按语种选形态，非 en/es 恒为 0', () => {
  const T = 'Júpiter abandona tu 5ª Casa de Hogar y Raíces, y Saturno en tu 4ª Casa de Riqueza y Recursos.';
  assert.strictEqual(BE._e21CountHouseLabelMismatch(T, 'es'), 2, 'es 形态计数不符');
  assert.strictEqual(BE._e21CountHouseLabelMismatch('Your Sun in the 12th House of Partnership', 'en'), 1, 'en 形态计数回归');
  for (const l of ['zh', 'fr', 'th', 'vi']) {
    assert.strictEqual(BE._e21CountHouseLabelMismatch(T, l), 0, `非 en/es 语种 ${l} 必须为 0（假红防线）`);
  }
  // 锁施加后计数必须归零（生产链行为：锁在前、判据在后 ⇒ 正常恒 0，无额外重试）
  assert.strictEqual(BE._e21CountHouseLabelMismatch(BE.stripHouseSemanticLabelMismatch(T, 'es', 'yearly'), 'es'), 0,
    '锁后仍有残差错配 ⇒ CRITIC c14 会误触发 R3 重试（延迟劣化）');
});

test('⑩ 判据同源接线：CRITIC c14 生效语种含 es，且计数函数按语种传参', () => {
  assert.ok(/\(lang \|\| 'zh'\) === 'en' \|\| \(lang \|\| 'zh'\) === 'es'/.test(SRC),
    'CRITIC c14 未把 es 纳入生效语种');
  assert.ok(/_e21CountHouseLabelMismatch\(text, lang \|\| 'zh'\)/.test(SRC),
    'c14 未传 lang（计数函数将退化为全形态计数 ⇒ 他语种假红）');
  assert.ok(/_e21CountHouseLabelMismatch\(miss\.text, d\.lang\)/.test(
    fs.readFileSync(path.join(REPO, 'test', 'tools', 'sweep-online.mjs'), 'utf-8')),
    '批测工具 标签错配 指标未传 lang（es 盘将永远为 0 ⇒ 修好了也看不见）');
});

// ═══════════════════ 四、西语序数缩略豁免 ═══════════════════
test('⑪ 西语粘连补空格：序数缩略 `5to/9no/2do/11vo/1er/3ro` 必须原样，真粘连仍须补空格', () => {
  const KEEP = ['abandona tu 5to Casa', 'en tu 9no Casa', 'el 2do mes', 'tu 11vo Casa', 'el 1er trimestre', 'el 3ro de julio'];
  for (const s of KEEP) assert.strictEqual(applyEsGlue(s, 'es'), s, `序数缩略被打散: ${s}`);
  const GLUE = [
    ['Día 1 y3', 'Día 1 y 3'],
    ['700€ al mes', '700 € al mes'],
    ['Casa5 y Luna9', 'Casa 5 y Luna 9'],
    ['2026Anual', '2026 Anual'],
  ];
  for (const [inp, want] of GLUE) assert.strictEqual(applyEsGlue(inp, 'es'), want, `真粘连未补空格: ${inp}`);
});

test('【注入缺陷自测】删掉序数缩略白名单 → 判据⑪ 必须红', () => {
  const degraded = esInner.replace(/if \(\/\^\(\?:to\|ta\|no[\s\S]*?\$\/i\.test\(w\)\) return m;/, '');
  assert.ok(degraded !== esInner, '注入未生效（白名单未命中）');
  const applyBad = new Function('cleaned', 'lang', degraded + '\nreturn cleaned;');
  assert.strictEqual(applyBad('abandona tu 5to Casa', 'es'), 'abandona tu 5to to Casa'.replace('5to to', '5 to'),
    '闸门失效: 删掉白名单后序数缩略未被识别为破坏（判据⑪ 未红）');
});
