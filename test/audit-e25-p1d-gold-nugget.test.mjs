// ═══════════════════════════════════════════════════════════════════════
// 🛡️ E25-P1④: 阵地④ 金块完整性 + 跨月同构治理 回归闸门
//
// 军师开工令（#238④）两条：
//   ① 金块完整性 —— 每月恰 1×[财富高峰窗口] + 1×[财务黑天鹅日]；禁止金块标签行以冒号
//      结尾而把正文甩到下一行（前端金色金块渲染破碎，另一语序下只剩孤立的 `: <正文>`
//      残骸 —— 即复核报告缺陷⑤「黑天鹅金块整个标题丢失」的同一事故面）。
//   ② 跨月 n-gram 防同构 —— 12 个月共用同一风险收尾句/窗口号召句必须可量化、可回归。
//
// 🔴 射程实证（2026-10-08，线上 312 条产物 v471~v531 六语全量扫描，非推演）：
//   ·「行尾冒号的短行」501 例 —— **全部**是正常 Markdown 小标题（`**仪式准备**：`），
//     含金块标签词者 **0**；「整行仅冒号」0 例；「空方括号 / 空加粗」0 例；
//     规范金块行（标签 + 冒号 + 同行正文）2412 例。
//   ⇒ ① 在落库文本层**零存在** ⇒ 本锁为**防御性加锁**（判据窄到「整行剥装饰后恰等于
//     一个金块标签」），离线批扫 289 条真实产物**零改动**（本闸门 §B5 固化该结论）。
//   ⇒ ② 因此选定「**只检不改**」（与 V486 同纪律）：确定性改写正文 = 造词/语义损伤事故面。
//
// 纪律：剥注释后再断言（防「注释里写了判据字面量」假红）；每条判据配注入自测（证明会红，
//      且注入必须**真的改变源码**）；版本判据用单调判据不写死历史值。
// ═══════════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { closureDecls } from './tools/extract_decls.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf-8');
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
const bodyOf = (name) => stripComments(src.match(new RegExp('function ' + name + '\\([\\s\\S]*?\\n\\}\\n'))[0]);

const SEEDS = ['lockGoldNuggetIntegrity', 'auditYearlyCrossMonthNgram'];
function loadFns(source = src) {
  const { source: code } = closureDecls(source, SEEDS);
  const ctx = { console: { log() {}, warn() {}, error() {} }, __x: {} };
  vm.createContext(ctx);
  vm.runInContext(code + '\n__x.L = lockGoldNuggetIntegrity;\n__x.A = auditYearlyCrossMonthNgram;', ctx);
  return ctx.__x;
}
const F = loadFns();

// ═══════════════════════════════ A 静态 ═══════════════════════════════

test('A1 锁存在 + 语言/报告类型守卫 + 白名单/判据常量齐备', () => {
  assert.ok(/function\s+lockGoldNuggetIntegrity\s*\(/.test(src), '缺少 lockGoldNuggetIntegrity');
  assert.ok(/_GN_LANGS\s*=\s*\[\s*'zh'\s*,\s*'en'\s*,\s*'es'\s*,\s*'fr'\s*,\s*'th'\s*,\s*'vi'\s*\]/.test(src),
    '六语射程常量缺失/漂移');
  const b = bodyOf('lockGoldNuggetIntegrity');
  assert.ok(/if\s*\(reportType\s*!==\s*'yearly'\s*&&\s*reportType\s*!==\s*'monthly'\)\s*return text;/.test(b),
    '缺少报告类型守卫（once/未知类型必须弃权）');
  assert.ok(/if\s*\(!_GN_LANGS\.includes\(lang\)\)\s*return text;/.test(b), '缺少语言射程守卫');
  // 白名单必须同时含六语本地化名与英文骨架（与 V480 `_V480_TAG_MAP` 同源）
  assert.ok(/_GN_LABELS\s*=\s*\[[\s\S]*?'财富高峰窗口'[\s\S]*?'财务黑天鹅日'[\s\S]*?\]/.test(src), '白名单缺 zh 项');
  assert.ok(/_GN_LABELS\s*=\s*\[[\s\S]*?'Peak Revenue Window'[\s\S]*?'Financial Black Swan Day'/.test(src), '白名单缺英文骨架');
  assert.ok(/_GN_LABELS\s*=\s*\[[\s\S]*?'Ventana de Éxito y Pico de Ingresos'[\s\S]*?'Cửa Sổ Vàng Tăng Trưởng Tài Lộc'/.test(src),
    '白名单缺 es/vi 项');
  // 🔴 本体化铁律：含 emoji 的字符类必须带 `u`（缺 u ⇒ 半代理项 ⇒ 用户可见 � + 写库 400）
  assert.ok(/_GN_DECOR_RE = \/[^;]*\/gu;/.test(src), '_GN_DECOR_RE 必须带 g+u 标志（含 emoji 字符类铁律）');
  assert.ok(/const _GN_SET = new Set\(_GN_LABELS\.map\(/.test(src), '_GN_SET 必须由 _GN_LABELS 派生（同源，禁另手抄一份）');
  assert.ok(/function _gnIsDanglingLabel\(/.test(src), '缺少悬挂标签判定辅助函数');
});

test('A2 三处挂载：lockGoldNuggetIntegrity 紧跟 lockHemisphereSeasons，且不破坏 V485→V488 紧邻', () => {
  const mounts = [
    /reportContent = lockHemisphereSeasons\(reportContent[\s\S]{0,200}?\n\s*reportContent = lockGoldNuggetIntegrity\(reportContent/,
    /if \(ft\) ft = lockHemisphereSeasons\(ft[\s\S]{0,200}?\n\s*if \(ft\) ft = lockGoldNuggetIntegrity\(ft/,
    /cleanedText = lockHemisphereSeasons\(cleanedText[\s\S]{0,200}?\n\s*cleanedText = lockGoldNuggetIntegrity\(cleanedText/,
  ];
  mounts.forEach((re, i) => assert.ok(re.test(src), `第 ${i + 1} 处挂载形态不符（须紧跟 E25-P1③ 之后）`));
  const sites = [...src.matchAll(/lockGoldNuggetIntegrity\((\w+), lang, reportType\)/g)].map((m) => m[1]);
  assert.ok(sites.length >= 3, `挂载点应 ≥3，实得 ${sites.length}`);
  for (const t of ['reportContent', 'ft', 'cleanedText']) assert.ok(sites.includes(t), `缺 ${t} 挂载`);
  // V485 → V488 必须仍紧邻（既有闸门 audit-v488-yearly-sunref 的 ⑨ 判据）
  assert.ok(/lockYearlyOuterPlanetsYear\(reportContent[\s\S]{0,200}?\n\s*reportContent = lockYearlyNonMonthSunRef\(reportContent/.test(src),
    'V485→V488 紧邻被破坏');
  assert.ok(!/lockHemisphereSeasons\(reportContent[\s\S]{0,120}?lockYearlyNonMonthSunRef/.test(src),
    '新锁不得插到 V485/V488 之间');
});

test('A3 跨月审计接线 ≥2 处（与 V486 同点）+ 调用方不得把返回值赋回文本', () => {
  const hits = [...src.matchAll(/auditYearlyCrossMonthNgram\((\w+), lang, reportType\)/g)].map((m) => m[1]);
  assert.ok(hits.length >= 2, `接线应 ≥2 处，实得 ${hits.length}`);
  assert.ok(hits.includes('reportContent'), '非流式 MISS 路径未接线');
  assert.ok(hits.includes('cleanedText'), '流式落库前路径未接线');
  assert.ok(!/(?:reportContent|cleanedText|streamText|ft)\s*=\s*auditYearlyCrossMonthNgram/.test(src),
    '审计返回值被赋回报告文本 —— 审计变成了改写，违反「只检不改」');
  const b = bodyOf('auditYearlyCrossMonthNgram');
  assert.ok(!/(^|[^.\w_$])text\s*=(?!=)/.test(b), '审计函数对入参 text 做了赋值 —— 违反「只检不改」');
  assert.ok(/return stat;/.test(b), '审计函数应返回统计对象（而非文本）');
  assert.ok(/reportType !== 'yearly'\)\s*return null;/.test(b), '缺少非年报护栏（应返回 null）');
});

test('A4 审计判据同源 + 模板骨架剔除：月标题走 _v516MonthHeadKey 唯一真源', () => {
  const b = bodyOf('auditYearlyCrossMonthNgram');
  assert.ok(/_v516MonthHeadKey\(line, lang\)/.test(b), '未使用 _v516MonthHeadKey 切月（禁止另起一套月名表）');
  assert.ok(/_GN_ANY_RE\.test\(/.test(b),
    '跨月 n-gram 未剔除金块模板行 —— 模板骨架（`🔴**[财务黑天鹅日]**:`）会淹没判据');
  assert.ok(/0x2190/.test(b) && /0x1F300/.test(b), '未跳过 emoji/图形符号引导的标签行（代理对会误伤正文）');
  assert.ok(/_GN_GRAM_N\s*=\s*\d+/.test(b), '缺少 n-gram 窗口常量');
  for (const k of ['months', 'sharedSents', 'maxMonths', 'sharedNgrams', 'worst']) {
    assert.ok(new RegExp(k).test(b), `统计字段 ${k} 缺失`);
  }
});

// ═══════════════════════════════ B 行为 · ① ═══════════════════════════════

const HANG = {
  en: '* 🟢 **[Peak Revenue Window]**:\n**July 5 - July 10** (Sun-Jupiter exact conjunction in Leo).',
  zh: '* 🔴 **[财务黑天鹅日]**:\n**7月18日** 流年水星开始逆行，需谨慎。',
  es: '* 🟢 **[Ventana de Éxito y Pico de Ingresos]**:\n**5-10 de julio** (conjunción exacta Sol-Júpiter).',
  fr: '* 🔴 **[Jour du Cygne Noir Financier]**:\n**18 juillet** (Mercure rétrograde en Maison II).',
  th: '* 🟢 **[ช่วงเวลาทองคำเปิดคลังทรัพย์]**:\n**5-10 กรกฎาคม** (ดาวพฤหัสบดี).',
  vi: '* 🔴 **[Ngày Thiên Nga Đen Nguy Cơ Sụt Giảm]**:\n**18 tháng 7** (Sao Thủy nghịch hành).',
};

test('B1 六语悬挂标签全部合并回同一行（标签与正文不再被换行拆开）', () => {
  for (const [lang, inp] of Object.entries(HANG)) {
    const out = F.L(inp, lang, 'yearly');
    const oneLine = out.split('\n').length === 1;
    assert.ok(oneLine, `${lang}: 未合并（仍 ${out.split('\n').length} 行）`);
    assert.ok(/:\s+\S/.test(out), `${lang}: 合并后标签冒号后必须紧跟正文`);
    assert.ok(!/\n\s*\S/.test(out), `${lang}: 残留换行`);
  }
});

test('B2 无 `**` 包裹 / 全角冒号 / 尾部加粗星 的变体同样合并', () => {
  assert.strictEqual(F.L('财富高峰窗口：\n10月12日至10月20日', 'zh', 'yearly'), '财富高峰窗口: 10月12日至10月20日');
  assert.strictEqual(F.L('**[财富高峰窗口]：**\n10月12日至10月20日', 'zh', 'yearly'), '**[财富高峰窗口]**: 10月12日至10月20日');
  assert.strictEqual(F.L('* 🔴 **[Financial Black Swan Day]**:\n**July 18**', 'en', 'yearly'),
    '* 🔴 **[Financial Black Swan Day]**: **July 18**');
});

test('B3 负向：正常 Markdown 小标题 / 已规范 / 无冒号 / 下一行非正文 一律不动', () => {
  const neg = [
    ['**仪式准备**：\n准备一支蜡烛与一张手写目标卡。', '正常小标题'],
    ['**家居财富对齐**：\n把办公桌朝向东南方。', '正常小标题②'],
    ['**月度财富概览**：\n木星刚进入你的第二宫。', '通用小标题'],
    ['* 🟢 **[Peak Revenue Window]**: **July 5** (conjunction).', '已规范（同行情有正文）'],
    ['* 🔴 **[财务黑天鹅日]**\n**7月18日** 水星逆行。', '无冒号（非本缺陷形态）'],
    ['* 🔴 **[财务黑天鹅日]**:\n### 2026年8月: 太阳狮子座 第9宫', '下一行是标题'],
    ['* 🔴 **[财务黑天鹅日]**:\n> 引用行', '下一行是引用'],
    ['* 🔴 **[财务黑天鹅日]**:\n\n**7月18日** 水星逆行。', '下一行为空行'],
    ['* 🔴 **[财务黑天鹅日]**:', '无下一行'],
  ];
  for (const [inp, why] of neg) {
    assert.strictEqual(F.L(inp, 'zh', 'yearly'), inp, `误改（${why}）: ${JSON.stringify(inp.slice(0, 50))}`);
  }
});

test('B4 幂等 + 护栏：monthly 生效 / once 与射程外语言弃权 / 空值安全', () => {
  const out = F.L(HANG.zh, 'zh', 'yearly');
  assert.strictEqual(F.L(out, 'zh', 'yearly'), out, '非幂等');
  assert.strictEqual(F.L(HANG.en, 'en', 'once'), HANG.en, 'reportType=once 必须弃权');
  assert.strictEqual(F.L(HANG.en, 'ja', 'yearly'), HANG.en, '语言射程外必须弃权');
  assert.ok(/:\s+\S/.test(F.L(HANG.zh, 'zh', 'monthly')), 'monthly 未生效');
  assert.strictEqual(F.L('', 'en', 'yearly'), '', '空串');
  assert.strictEqual(F.L(null, 'en', 'yearly'), null, 'null');
  assert.strictEqual(F.L(undefined, 'en', 'yearly'), undefined, 'undefined');
});

test('B5 零改动不变量：无悬挂标签时**逐字节**原样返回（含换行/空白）', () => {
  const t = '### 2026年8月: 太阳狮子座 第9宫\n* 🟢 **[财富高峰窗口]**: **8月3日至8月9日** 木星共振。\n* 🔴 **[财务黑天鹅日]**: **8月25日** 火星冲土星。\n\n**仪式准备**：\n准备一支蜡烛。';
  assert.strictEqual(F.L(t, 'zh', 'yearly'), t);
});

// ═══════════════════════════════ C 行为 · ② ═══════════════════════════════

const zi = (i) => ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'][i];
const monthBlock = (i, prose) =>
  `### 2026年${i + 1}月: 太阳巨蟹座 第8宫\n* 🔴 **[财务黑天鹅日]**: **${i + 1}月18日** 水星逆行。\n${prose}`;
const SHARED = '绝对禁止在这一期间进行任何重大的财务决策、签署任何重要的合同或进行高风险投资。';
const DIRTY = Array.from({ length: 12 }, (_, i) => monthBlock(i, SHARED)).join('\n');
// 干净对照：每月的散文句**逐月重写**（无共享长片段）
const CLEAN = Array.from({ length: 12 }, (_, i) =>
  monthBlock(i, `${zi(i)}月的节奏偏${['稳', '快', '缓', '紧', '松', '沉', '轻', '暖', '冷', '润', '干', '净'][i]}：把注意力放到${['合同条款', '现金流表', '客户回访', '库存周转', '税务申报', '团队分工', '定价策略', '渠道拓展', '品牌投放', '应付账款', '预算复盘', '年底结算'][i]}上，别让情绪替你做决定。`)).join('\n');

test('C1 跨月重复句必被捕获（真值同构：12 个月共用同一收尾句）', () => {
  const r = F.A(DIRTY, 'zh', 'yearly');
  assert.ok(r && typeof r === 'object', '应返回统计对象');
  assert.ok(r.months >= 12, `应切出 ≥12 月块，实得 ${r.months}`);
  assert.ok(r.sharedSents >= 1, `应捕获跨月重复句，实得 ${JSON.stringify(r)}`);
  assert.ok(r.maxMonths >= 5, `最高跨月数应 ≥5，实得 ${r.maxMonths}`);
  assert.ok(r.worst.length >= 1 && /绝对禁止在这一期间/.test(r.worst[0]), `worst 摘要异常: ${JSON.stringify(r.worst)}`);
});

test('C2 干净文本零跨月重复句（阴性对照，防闸门恒定红）+ 幂等 + 只检不改', () => {
  const before = String(CLEAN);
  const r = F.A(CLEAN, 'zh', 'yearly');
  assert.strictEqual(r.sharedSents, 0, `干净文本不应报跨月重复，实得 ${JSON.stringify(r)}`);
  assert.strictEqual(CLEAN, before, '审计不得改动传入文本');
  assert.deepStrictEqual(F.A(CLEAN, 'zh', 'yearly'), r, '审计必须幂等');
  // 阳性对照必须显著高于阴性（证明判据有区分力，不是恒定值）
  const rd = F.A(DIRTY, 'zh', 'yearly');
  assert.ok(rd.sharedNgrams > r.sharedNgrams, `阳性 n-gram(${rd.sharedNgrams}) 应高于阴性(${r.sharedNgrams})`);
});

test('C3 护栏：非年报 / 空值 / 切不出 ≥2 月 ⇒ 一律 null（弃权而非假绿）', () => {
  assert.strictEqual(F.A(DIRTY, 'zh', 'monthly'), null, '非年报必须 null');
  assert.strictEqual(F.A('', 'zh', 'yearly'), null, '空串必须 null');
  assert.strictEqual(F.A(null, 'zh', 'yearly'), null, 'null 必须 null');
  assert.strictEqual(F.A('### 2026年7月: x\n只有一个月。', 'zh', 'yearly'), null, '单月必须 null（弃权）');
});

test('C4 六语月标题切分（_v516MonthHeadKey 同源）：en/es/th 也能切出 12 月块', () => {
  const mk = {
    en: (i) => `### ${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][i]} 2026: Sun in Virgo\n${SHARED}`,
    es: (i) => `### ${['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][i]} 2026: Sol en Virgo\n${SHARED}`,
    th: (i) => `### ${['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'][i]} พ.ศ. 2569: ดวงอาทิตย์ในราศีกันย์\n${SHARED}`,
  };
  for (const [lang, f] of Object.entries(mk)) {
    const r = F.A(Array.from({ length: 12 }, (_, i) => f(i)).join('\n'), lang, 'yearly');
    assert.ok(r && r.months === 12, `${lang}: 应切出 12 月块，实得 ${r && r.months}`);
    assert.ok(r.sharedSents >= 1, `${lang}: 应捕获跨月重复句`);
  }
});

// ═══════════════════════════════ D 版本 ═══════════════════════════════

test('D1 缓存版本 ≥ 本阵地基线 v534（单调判据，防每次 bump 假红）', () => {
  const vers = [...src.matchAll(/wealth:v(\d+):/g)].map((m) => Number(m[1]));
  const cur = Math.max(...vers);
  assert.ok(cur >= 534, `输出链新增一环 ⇒ 缓存版本应 ≥534，实得 v${cur}`);
  assert.ok(vers.filter((v) => v === cur).length >= 3, `当前版本 v${cur} 应出现在 ≥3 处生产缓存 key`);
  assert.ok(new RegExp('wealth:v' + cur + '-v2:').test(src), `v2 站点未同步 bump（当前 v${cur}）`);
});

// ═══════════════════════ E 注入缺陷自测（每条都必须「注入后判据变红」） ═══════════════════════

test('【注入】摘掉语言射程守卫 → A1 必须红', () => {
  const degraded = src.replace(/if\s*\(!_GN_LANGS\.includes\(lang\)\)\s*return text;/, 'void 0;');
  assert.notStrictEqual(degraded, src, '注入必须真的改变源码');
  assert.ok(!/if\s*\(!_GN_LANGS\.includes\(lang\)\)\s*return text;/.test(bodyOf2(degraded, 'lockGoldNuggetIntegrity')),
    '注入后 A1 判据应命中失败');
});

test('【注入】去掉尾冒号判定 → B1 必须红（行为级，正向不再合并）', () => {
  // ⚠️ 锚点用**纯字符串**（含 `\s\*\{0,2\}` 等反斜杠，正则字面量转义极易写错 ⇒ 静默失配）
  const ANCHOR = 'if (!/[:：]\\s*\\*{0,2}\\s*$/.test(s)) return false;';
  const orig = bodyOf('_gnIsDanglingLabel');   // ⚠️ 该判据在辅助函数内，不在主锁内
  assert.ok(orig.includes(ANCHOR), '注入锚点失配（尾冒号判定形态已变）');
  const degradedBody = orig.split(ANCHOR).join('if (!/^\\s*$/.test(s)) return false;');
  assert.notStrictEqual(degradedBody, orig, '内层替换未生效');
  const degradedFn = src.replace(/function _gnIsDanglingLabel\([\s\S]*?\n\}\n/, degradedBody);
  assert.notStrictEqual(degradedFn, src, '注入必须真的改变源码');
  const G = loadFns(degradedFn);
  assert.strictEqual(G.L(HANG.en, 'en', 'yearly'), HANG.en, '闸门失效: 尾冒号判定被删未被 B1 识别');
});

test('【注入】摘掉「下一行非正文则不动」守卫 → B3 必须红（行为级，误并标题行）', () => {
  const ANCHOR = 'if (/^#{1,6}\\s/.test(nxt) || /^>/.test(nxt) || _gnIsDanglingLabel(nxt)) { out.push(line); continue; }';
  assert.ok(src.includes(ANCHOR), '注入锚点失配');
  const degradedFn = src.split(ANCHOR).join('');
  assert.notStrictEqual(degradedFn, src, '注入必须真的改变源码');
  const G = loadFns(degradedFn);
  const bad = '* 🔴 **[财务黑天鹅日]**:\n### 2026年8月: 太阳狮子座 第9宫';
  assert.notStrictEqual(G.L(bad, 'zh', 'yearly'), bad, '闸门失效: 标题行守卫被删未被 B3 识别');
});

test('【注入】把通用小标题词塞进白名单 → B3 必须红（误并正常「标题+列表」）', () => {
  // ⚠️ 必须在 `_GN_SET` 的**初始化表达式**里加词 —— closureDecls 只抽声明切片，
  //    追加在声明之后的独立语句会被丢弃 ⇒ 注入静默失效（本闸门踩过一次）。
  const ANCHOR = "new Set(_GN_LABELS.map((s) => s.replace(_GN_DECOR_RE, '')))";
  assert.ok(src.includes(ANCHOR), '注入锚点失配');
  const degraded = src.replace(ANCHOR, "new Set([..._GN_LABELS.map((s) => s.replace(_GN_DECOR_RE, '')), '仪式准备'])");
  assert.notStrictEqual(degraded, src, '注入必须真的改变源码');
  const G = loadFns(degraded);
  const bad = '**仪式准备**：\n准备一支蜡烛。';
  assert.notStrictEqual(G.L(bad, 'zh', 'yearly'), bad, '闸门失效: 白名单过宽未被 B3 识别');
});

test('【注入】禁用月切分 → C1 必须红（行为级，blocks 退化 ⇒ null）', () => {
  const degraded = src.replace(
    /if \(_v516MonthHeadKey\(line, lang\)\) \{ cur = \[\]; blocks\.push\(cur\); \}/,
    'if (false) { cur = []; blocks.push(cur); }');
  assert.notStrictEqual(degraded, src, '注入锚点失配');
  const G = loadFns(degraded);
  assert.strictEqual(G.A(DIRTY, 'zh', 'yearly'), null, '闸门失效: 禁用月切分未被 C1 识别');
});

test('【注入】让审计函数改写入参 → A3 必须红（只检不改）', () => {
  const degraded = src.replace(
    /function auditYearlyCrossMonthNgram\(text, lang, reportType\) \{\n(\s*)if \(reportType !== 'yearly'\) return null;/,
    "function auditYearlyCrossMonthNgram(text, lang, reportType) {\n  text = String(text).trim();\n$1if (reportType !== 'yearly') return null;");
  assert.notStrictEqual(degraded, src, '注入锚点失配');
  assert.ok(/(^|[^.\w_$])text\s*=(?!=)/.test(bodyOf2(degraded, 'auditYearlyCrossMonthNgram')),
    '注入后 A3 静态判据应命中失败');
});

test('【注入】摘掉非流式接线 → A3 必须红', () => {
  const degraded = src.replace(/^\s*auditYearlyCrossMonthNgram\(reportContent, lang, reportType\);.*$/m, '');
  assert.notStrictEqual(degraded, src, '注入锚点失配');
  const hits = [...degraded.matchAll(/auditYearlyCrossMonthNgram\((\w+), lang, reportType\)/g)].map((m) => m[1]);
  assert.ok(!hits.includes('reportContent'), '注入后 A3 接线判据应命中失败');
});

test('【注入】摘掉 ft 挂载 → A2 必须红', () => {
  const degraded = src.replace(/^\s*if \(ft\) ft = lockGoldNuggetIntegrity\(ft, lang, reportType\);.*$/m, '');
  assert.notStrictEqual(degraded, src, '注入锚点失配');
  const sites = [...degraded.matchAll(/lockGoldNuggetIntegrity\((\w+), lang, reportType\)/g)].map((m) => m[1]);
  assert.ok(!sites.includes('ft'), '注入后 A2 挂载判据应命中失败');
});

test('【注入】缓存版本降级一档 → D1 必须红', () => {
  const cur = Math.max(...[...src.matchAll(/wealth:v(\d+):/g)].map((m) => Number(m[1])));
  const degraded = src.replace(new RegExp('wealth:v' + cur + ':', 'g'), `wealth:v${cur - 1}:`);
  assert.notStrictEqual(degraded, src, '注入必须真的改变源码');
  const vers = [...degraded.matchAll(/wealth:v(\d+):/g)].map((m) => Number(m[1]));
  assert.ok(Math.max(...vers) < cur, `注入后版本应低于 v${cur}（实得 v${Math.max(...vers)}）`);
});

// 注入自测专用：从**已降级源码**切片（不可复用全局 bodyOf，否则断言打在原源码上=假绿）
function bodyOf2(source, name) {
  return stripComments(source.match(new RegExp('function ' + name + '\\([\\s\\S]*?\\n\\}\\n'))[0]);
}
