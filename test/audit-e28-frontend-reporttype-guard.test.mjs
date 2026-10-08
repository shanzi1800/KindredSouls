// ═══════════════════════════════════════════════════════════════════════════
// 🛡️ E28 第 9 道闸门 ── 前端渲染层 `reportType` 门控归位（年报仪表盘被误吞 P0）
// ═══════════════════════════════════════════════════════════════════════════
// 【P0 病案（2026-10-08 用户实测 · 法语年报，落库缓存稿）】
//   年报仪表盘第 2 格本应输出 `🌟 Indice d'Explosion de Richesse : ★★★★★`
//   （模板真源 `src/prompts/yearlySystemEN.txt` 第 2 格 = `🌟 Wealth Explosion Index: ★★★★★`），
//   却在前端被**整行替换**成月报第四周卡片 `✦ [🟢 Semaine 4: Explosion de Richesse]`
//   ⇒ ★★★★★ 评级被吞（用户原话：「就扫了一眼就混了月报里面『第四周的内容』」）。
//
// 【病根（三层取证）】
//   ① 后端**无辜**：`server.js` 的 `normalizeReportTags`（含同名规则）**仅在
//      `reportType === 'monthly'` 时调用**（server.js:15616）⇒ 不污染年报。
//   ② 前端**真凶**：`web/src/components/SacredYearlyReportBox.tsx` 被 `WealthReportPage`
//      **三态复用**（月报传 `reportType="monthly"`；年报**未传** ⇒ 缺省 `'yearly'`；
//      once 传 `'once'`），但清洗函数 `cleanAndInjectChapters(text)` **只收 text**、
//      **不收 reportType** ⇒ 一整组**仅对月报有意义**的「周卡片 / 陷阱卡」兜底规则
//      （fr/es/th/vi 共 8 条）**无门控**地作用在年报文本上。
//   ③ 与「流式 / 非流式」无关 —— 清洗在**渲染层**，两条通道共用同一组件 ⇒
//      **缓存命中的年报同样复现**。
//
// 【治法（E28-GUARD-1）】
//   ① 8 条规则包进 `if (reportType === 'monthly') { … }`（收窄射程 = 降风险）；
//   ② `Pièges Financiers` 卡片月份由 `new Date()`（**浏览器当月**）改为**沿用原文**
//      （LLM 依「本报告窗口」写出）⇒ 跨月回看**缓存**报告不再错标月份。
//
// 【本闸门纪律】
//   · **同源**：行为判据 = 从产品源码**逐字抽取函数体**（TypeScript 转译后
//     `new Function` 执行），绝不另写一份正则替代产品判据。
//   · **注入缺陷必红**：拆掉门控（`if (reportType === 'monthly')` → `if (true)`）后，
//     年报样本必须**重现**「Explosion de Richesse 被吞」⇒ 反向自测证明判据真实。
//   · **零回归**：月报四周卡片 + fr/es/th/vi 各语兜底能力逐条断言不回退。
//   · **射程完整**：门控块内 8 条规则**全在**、块外**一条都不许在**。
// ═══════════════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(__dirname, '..');
const BOX_PATH = path.join(REPO, 'web', 'src', 'components', 'SacredYearlyReportBox.tsx');
const PAGE_PATH = path.join(REPO, 'web', 'src', 'pages', 'WealthReportPage.tsx');
const BOX = fs.readFileSync(BOX_PATH, 'utf-8');
const PAGE = fs.readFileSync(PAGE_PATH, 'utf-8');

// ── TypeScript 转译器（产品仓既有依赖，不新增）──────────────────────────────
const require = createRequire(path.join(REPO, 'web', 'package.json'));
const ts = require('typescript');

// ── 门控块定位（源码级）────────────────────────────────────────────────────
// ⚠️ 抗自指：`GUARD_END` 带 `} ` 前缀，源码块头注释里虽提到 END 标记名，
//   但那处前缀是反引号 ⇒ 精确串只命中**块尾**一次。
const GUARD_IF = "if (reportType === 'monthly') {";
const GUARD_END = '} // 🛡️ E28-GUARD-1-END';

function guardSlice(src) {
  const h = src.indexOf(GUARD_IF);
  const e = src.indexOf(GUARD_END);
  assert.ok(h !== -1, `门控块头缺失: ${GUARD_IF}`);
  assert.ok(e !== -1, `门控块尾缺失: ${GUARD_END}`);
  assert.ok(h < e, '门控块头必须在块尾之前');
  return { head: h, tail: e, body: src.slice(h, e) };
}

// 8 条月报专属兜底规则的特征串（**逐字取自产品正则字面量**，非另写判据）
const WEEK_RULES = [
  ['fr-step2-semaine', 'Semaine\\s+[2-4]:[\\s\\S]'],
  ['fr-disjoncteur', 'Disjoncteur'],
  ['fr-integration', 'Intégration\\s+Stratégique'],
  ['fr-explosion', 'Explosion\\s+de\\s+Richesse'],
  // ⚠️ 逐字取自**外层匹配正则**（`/^(?!✦)([^\n]*Pièges\s+Financiers[^\n]*)$/gm`）；
  //    内层月份捕获写作 `Pi[eè]ges?\s+Financiers`（更宽），不以它作定位特征。
  ['fr-pieges', 'Pièges\\s+Financiers'],
  ['es-semana', 'Semana\\s+([2-4])'],
  ['th-saptah', 'สัปดาห์ที่\\s*([2-4])'],
  ['vi-tuan', 'Tuần\\s+([2-4])'],
];

// ── 行为级：抽产品函数体 → 执行（同源，无第二份判据）────────────────────────
// ⚠️ `removeComments: true` 是**必须**的（零误报铁律：只扫代码、不扫注释）——
//   否则「注释里引用的红线词」会被误判（本文件 A4 检测 `new Date`，而产品源码的
//   E28 修复注释里**必然要引用** `new Date()` 才能说明旧缺陷 ⇒ 自指悖论）。
const TS_OPTS = { target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.React, removeComments: true };

function transpile(src) {
  return ts.transpileModule(src, { compilerOptions: TS_OPTS }).outputText;
}

function fnExprFrom(js) {
  const marker = 'cleanAndInjectChapters = ';
  const a = js.indexOf(marker);
  const b = js.indexOf('const cleanMarkdown = ', a);
  assert.ok(a !== -1, '转译产物中未找到 cleanAndInjectChapters');
  assert.ok(b !== -1 && b > a, '转译产物中未找到 cleanMarkdown 边界');
  let seg = js.slice(a + marker.length, b).trim();
  return seg.replace(/;\s*$/, '');
}

function buildCleaner(src) {
  const expr = fnExprFrom(transpile(src));
  const factory = new Function(
    'text', 'lang', 'reportType',
    'var cleanAndInjectChapters = ' + expr + ';\nreturn cleanAndInjectChapters(text);'
  );
  return (text, lang, reportType) => factory(text, lang, reportType);
}

const clean = buildCleaner(BOX);
const FN_EXPR = fnExprFrom(transpile(BOX));

// ═══════════════════════════════════════════════════════════════════════════
// A. 源码级 ── 门控归位结构断言
// ═══════════════════════════════════════════════════════════════════════════
test('A1 门控块存在且唯一（块头/块尾标记各恰 1 次）', () => {
  const count = (s, sub) => s.split(sub).length - 1;
  assert.strictEqual(count(BOX, GUARD_IF), 1, `门控块头必须恰 1 次`);
  assert.strictEqual(count(BOX, GUARD_END), 1, `门控块尾必须恰 1 次`);
  const { head, tail } = guardSlice(BOX);
  assert.ok(tail - head > 1000, `门控块体量异常（${tail - head} 字符），疑似收窄失败`);
});

test('A2 8 条月报专属兜底规则**全在**门控块内', () => {
  const { body } = guardSlice(BOX);
  const miss = WEEK_RULES.filter(([, sig]) => !body.includes(sig)).map(([n]) => n);
  assert.deepStrictEqual(miss, [], `以下规则未落在门控块内: ${miss.join(', ')}`);
});

test('A3 8 条规则特征串**一条都不许**出现在门控块外（防重复挂载/漏挂）', () => {
  const { head, tail } = guardSlice(BOX);
  const outside = BOX.slice(0, head) + BOX.slice(tail);
  const leaks = WEEK_RULES.filter(([, sig]) => outside.includes(sig)).map(([n]) => n);
  assert.deepStrictEqual(leaks, [], `以下规则泄漏在门控块外: ${leaks.join(', ')}`);
});

test('A4 陷阱卡月份来源：函数体内**绝无** `new Date()`（跨月回看错标根治）', () => {
  assert.ok(!/new Date/.test(FN_EXPR), 'cleanAndInjectChapters 函数体内不得再出现 new Date');
  assert.ok(!/Date\.now/.test(FN_EXPR), 'cleanAndInjectChapters 函数体内不得出现 Date.now');
  // 月份必须**从原文捕获**（沿用 LLM 依报告窗口写出的月份）
  assert.ok(/_mois/.test(FN_EXPR), '缺少「月份沿用原文」的捕获变量 _mois');
  assert.ok(/Pi\[eè\]ges\?\\s\+Financiers/.test(FN_EXPR), '缺少 Pièges Financiers 月份捕获正则');
});

test('A5 组件三态传参契约：缺省 yearly / 月报显式 monthly / once 显式 once', () => {
  assert.ok(/reportType = 'yearly'/.test(BOX), '组件缺省值必须为 yearly（年报未传参时即年报）');
  assert.match(PAGE, /reportType="monthly"/, '月报必须显式传 reportType="monthly"');
  assert.match(PAGE, /reportType="once"/, 'once 报告必须显式传 reportType="once"');
  // 年报调用点（yearly-pending）附近**不得**传入 reportType（否则缺省 yearly 失效）
  const yIdx = PAGE.indexOf("yearly-pending");
  assert.ok(yIdx !== -1, '未找到年报调用点');
  const seg = PAGE.slice(yIdx, yIdx + 800);
  assert.ok(!/reportType=/.test(seg), '年报调用点不应显式传 reportType（应走缺省 yearly）');
});

// ═══════════════════════════════════════════════════════════════════════════
// B. 行为级 ── 真实产品函数体执行（同源）
// ═══════════════════════════════════════════════════════════════════════════
// 法语年报仪表盘（实测被吞样本身，逐字取自用户线上缓存稿）
const FR_YEARLY_DASH = [
  'Tableau de Bord des Métriques de Richesse Annuelle 2026-2027',
  '🚀',
  'Thème Macro Annuel : La Reconquête du Trône — de la Défense à la Domination',
  '🟢',
  '🌟 Indice d\'Explosion de Richesse : ★★★★★',
  '⚠️',
  'Risque d\'Effondrement des Actifs : ★★★☆☆',
  '🔮',
  'Direction de Manifestation du Destin : Consolidation des Alliances Stratégiques',
].join('\n');

test('B1 【P0 复现点】法语年报仪表盘第 2 格逐字保留 ★★★★★（reportType=yearly）', () => {
  const out = clean(FR_YEARLY_DASH, 'fr', 'yearly');
  assert.ok(
    out.includes("Indice d'Explosion de Richesse : ★★★★★"),
    `年报仪表盘第 2 格被吞！实际输出:\n${out}`
  );
  assert.ok(!/Semaine\s*4/.test(out), '年报中出现了月报第四周卡片（门控失效）');
});

test('B2 once 报告同样零误吞（reportType=once）', () => {
  const out = clean(FR_YEARLY_DASH, 'fr', 'once');
  assert.ok(out.includes("Indice d'Explosion de Richesse : ★★★★★"), 'once 报告被月报规则污染');
  assert.ok(!/Semaine\s*4/.test(out), 'once 报告中出现月报第四周卡片');
});

test('B3 年报五章结构不被门控改动（通用清洗逐字保留）', () => {
  const src = [
    '🌟 Indice d\'Explosion de Richesse : ★★★★★',
    // ⚠️ 样本**不带 ✦**（真实后端产出的裸章节标题）⇒ 走「章节美化」分支；
    //    已带 ✦ 的形态由 B3b 断言幂等（原样返回，不二次加工）。
    'Chapitre I: Matrice de Richesse Annuelle',
    'Votre Ascendant Balance, à 22.11°, scelle ce pacte.',
    'Chapitre V: Protocole de Manifestation de l\'Oracle',
  ].join('\n');
  const out = clean(src, 'fr', 'yearly');
  assert.ok(out.includes("Indice d'Explosion de Richesse : ★★★★★"), '仪表盘格丢失');
  assert.ok(out.includes('✦ Chapitre I: Matrice de Richesse Annuelle ✦'), '章节标题美化回归');
  assert.ok(out.includes('✦ Chapitre V: Protocole de Manifestation de l\'Oracle ✦'), '第五章标题美化回归');
  assert.ok(out.includes('Votre Ascendant Balance, à 22.11°, scelle ce pacte.'), '正文被改动');
  assert.ok(!/Semaine\s*4/.test(out), '年报中混入月报周卡片');
});

test('B3b 已带 ✦ 的章节标题幂等（不复制、不丢失）', () => {
  const out = clean('✦ Chapitre I: Matrice de Richesse Annuelle', 'fr', 'yearly');
  const n = (out.match(/Chapitre I: Matrice de Richesse Annuelle/g) || []).length;
  assert.strictEqual(n, 1, `章节标题被复制或丢失:\n${out}`);
});

// ── 月报能力不回退（fr/es/th/vi 四条）────────────────────────────────────
test('B4 月报·法语：漏标 Semaine 4 周卡片仍被兜底补全（能力不回退）', () => {
  const out = clean('Semaine 4: Explosion de Richesse', 'fr', 'monthly');
  assert.ok(
    out.includes('[🟢 Semaine 4: Explosion de Richesse]'),
    `月报法语周卡片兜底回归！实际输出:\n${out}`
  );
});

test('B5 月报·西语：漏标 Semana 3 周卡片仍被兜底补全', () => {
  const out = clean('Semana 3: Integración Estratégica', 'es', 'monthly');
  assert.ok(out.includes('[🔵 Semana 3: Integración Estratégica]'), `西语兜底回归:\n${out}`);
});

test('B6 月报·泰语/越南语：周卡片兜底仍在', () => {
  const th = clean('สัปดาห์ที่ 2: ความเสี่ยงสูง', 'th', 'monthly');
  assert.ok(th.includes('[🔴 สัปดาห์ที่ 2: ความเสี่ยงสูง]'), `泰语兜底回归:\n${th}`);
  const vi = clean('Tuần 4: Cơ Hội Vàng', 'vi', 'monthly');
  assert.ok(vi.includes('[🟢 Tuần 4: Cơ Hội Vàng]'), `越南语兜底回归:\n${vi}`);
});

test('B7 【月份根治】陷阱卡月份一律沿用原文（非当月亦正确）', () => {
  // 故意给一个**非浏览器当月**的月份：旧实现（new Date）会把它改写成当月
  const out = clean('Pièges Financiers: Février 2029', 'fr', 'monthly');
  assert.ok(out.includes('Février 2029'), `陷阱卡月份被 new Date 篡改！实际输出:\n${out}`);
  assert.ok(!/Octobre 2026|Novembre 2026/.test(out), '月份被浏览器当月覆盖');
  // 原文月份保留 + 形态被补全（✦ [ … ] ✦）
  const out2 = clean('[⚠️ Pièges Financiers: Octobre 2026]', 'fr', 'monthly');
  assert.ok(out2.includes('Pièges Financiers: Octobre 2026'), `完整形态被破坏:\n${out2}`);
});

test('B8 月报·法语 Disjoncteur / Intégration Stratégique 兜底仍在', () => {
  const a = clean('Disjoncteur à Haut Risque', 'fr', 'monthly');
  assert.ok(a.includes('[🔴 Semaine 2: Circuit de Haut Risque]'), `Disjoncteur 兜底回归:\n${a}`);
  const b = clean('Intégration Stratégique', 'fr', 'monthly');
  assert.ok(b.includes('[🔵 Semaine 3: Intégration Stratégique]'), `Intégration 兜底回归:\n${b}`);
});

// ═══════════════════════════════════════════════════════════════════════════
// C. 注入缺陷自测 ── 判据真实有效（拆门控必红）
// ═══════════════════════════════════════════════════════════════════════════
test('C1 拆掉门控 ⇒ 年报样本必重现「被吞」（证明判据非恒真）', () => {
  const hacked = BOX.replace(GUARD_IF, 'if (true) {');
  assert.notStrictEqual(hacked, BOX, '注入未生效（门控块头未匹配）');
  const cleanHacked = buildCleaner(hacked);
  const out = cleanHacked(FR_YEARLY_DASH, 'fr', 'yearly');
  assert.ok(
    /Semaine\s*4/.test(out),
    '门控被拆后仍未见「被吞」⇒ 本闸门判据恒真、形同虚设！'
  );
  assert.ok(
    !out.includes("Indice d'Explosion de Richesse : ★★★★★"),
    '门控被拆后仪表盘格竟仍保留 ⇒ 判据未真正覆盖病案'
  );
});

test('C2 注入缺陷（月份回退 new Date）⇒ A4 必红（判据灵敏度）', () => {
  // 复刻旧缺陷：把「月份沿用原文」回退成「浏览器当月」（new Date）
  const broken = BOX.replace(
    "return '✦ [⚠️ Pièges Financiers' + (_mois && _mois[1] ? ': ' + _mois[1].trim() : '') + '] ✦';",
    "return '✦ [⚠️ Pièges Financiers: ' + new Date().toLocaleString('fr-FR', { month: 'long', year: 'numeric' }).replace(/^./, c => c.toUpperCase()) + '] ✦';"
  );
  assert.notStrictEqual(broken, BOX, '注入未生效（月份捕获行未匹配）');
  const expr = fnExprFrom(transpile(broken));
  assert.ok(/new Date/.test(expr), '回退 new Date 后仍检测不到 ⇒ A4 判据失效');
});

test('C3 A3 判据灵敏度：同一规则在门控块外出现必被检出', () => {
  // 复刻「重复挂载 / 漏挂」形态：在文件末尾（块外）再放一份 Explosion 规则特征串
  const sig = 'Explosion\\s+de\\s+Richesse';
  const fake = BOX + '\n// duplicated outside guard scope: ' + sig + '\n';
  const { head, tail } = guardSlice(fake);
  const outside = fake.slice(0, head) + fake.slice(tail);
  const leaks = WEEK_RULES.filter(([, s]) => outside.includes(s)).map(([n]) => n);
  assert.ok(
    leaks.includes('fr-explosion'),
    '块外重复规则未被 A3 判据检出 ⇒ 该判据形同虚设（自测失效）'
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// D. 同源交叉契约 ── 与后端「月报才归一」保持镜像
// ═══════════════════════════════════════════════════════════════════════════
test('D1 后端同名规则仍受 monthly 门控（前端门控与之镜像，非孤例）', () => {
  const SERVER = fs.readFileSync(path.join(REPO, 'server.js'), 'utf-8');
  // 后端调用形态（历史行为，绝不放松）：`if (reportType === 'monthly') cleanedText = normalizeReportTags(...)`
  assert.match(
    SERVER,
    /reportType\s*===\s*'monthly'[^\n]*normalizeReportTags\s*\(/,
    '后端 normalizeReportTags 调用点缺少 monthly 门控（后端与前端必须镜像一致）'
  );
});

test('D2 模板真源在位：年报仪表盘第 2 格 = Wealth Explosion Index', () => {
  const tpl = fs.readFileSync(path.join(REPO, 'src', 'prompts', 'yearlySystemEN.txt'), 'utf-8');
  assert.ok(/Wealth Explosion Index/.test(tpl), '年报模板第 2 格定义缺失（真值源被改动）');
});
