/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🛍️ E39 闸门：合婚三位一体履约骨架终极归正（第 19 道防线）
 * ═══════════════════════════════════════════════════════════════════════════
 * 立项（2026-10-09 军师《合婚三位一体履约骨架终极归正令》· 五裁全准）：
 *   病根（E39 只读侦察实码取证）：$4.99 一次性合婚门控与骨架全空、月报硬编码固定年月、
 *   年报 $29.99 只有一行兜底、JSON 契约 vs 前端 \n\n 纯文本渲染错配。
 *   治法：物理引渡 api/ai-advisor.js 六语四段骨架资产入 server.js（单一真源）；
 *         动态时间轴现算；once 门控接权益内核；前端按权益分档补齐生成入口。
 *
 * 五断言映射（军师裁决 → 闸门组）：
 *   裁决1 骨架引渡     → A 组（源码级：资产同源镜像 + import 精确匹配 + 委托链）
 *   裁决2 动态时间真值 → B 组（时间真值：注释剥离后全仓零固定年月 + 两态动态行为 + 注入必红）
 *   裁决3 once 双轨制  → D 组（权益内核行为级：once 月卡不覆盖 + 注入必红）
 *   裁决4 契约统一     → C 组（六语四段 + 纯文本 \n\n + 无一行兜底残留）
 *   裁决5 闸门与长链   → E 组（接线 + 段数 + dist 产物带新入口）
 *
 * 同源铁律：B4/D3 注入自测与 B3/D2 正向断言共用同一判据函数 ——
 *   注入后判据必须变红（防「注入无效却掩盖闸门失效」假绿，E37/F4 教训）。
 * 行号锚定法：关键次序断言（entitlement 早于 callAI）用行号比较，免疫字符串漂移。
 * ═══════════════════════════════════════════════════════════════════════════
 */
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ASSET = fs.readFileSync(path.join(ROOT, 'api', 'ai-advisor.js'), 'utf-8');
const ASSET_MIRROR = fs.readFileSync(path.join(ROOT, 'web', 'api', 'ai-advisor.js'), 'utf-8');
const SERVER = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf-8');
const APP_TSX = fs.readFileSync(path.join(ROOT, 'web', 'src', 'App.tsx'), 'utf-8');
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));

// ── 注释剥离（真值块扫描；v490b 版式：块注释 → 行注释 → 行尾注释）──
function stripJs(s) {
  return s
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/.*$/gm, '')
    .replace(/(?<![:'"])\/\/(?!\/).*$/gm, '');
}
const SERVER_TRUTH = stripJs(SERVER);
const ASSET_TRUTH = stripJs(ASSET);

// ── 切片工具：函数体抽取（花括号配平）──
function extractFn(src, name) {
  const i = src.indexOf(`function ${name}(`);
  if (i === -1) return null;
  let depth = 0, j = src.indexOf('{', i);
  const start = j;
  for (; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') { depth--; if (depth === 0) return src.slice(i, j + 1); }
  }
  return null;
}
// ── 合婚端点段切片（branch → 普通合盘洞察 之间的真值块）──
function compatEndpointSlice() {
  // 统一坐标系：branch 与尾界标都在**未 strip** 的原文上定位，切片取 strip 真值
  //   （strip 后注释被剥 ⇒ '普通合盘洞察' 界标随之消失，必须回原文找界标）
  const headTruth = SERVER_TRUTH.indexOf("if (reportType === 'monthly' || reportType === 'yearly' || reportType === 'once') {");
  assert.notEqual(headTruth, -1, '合婚三档分流 branch 缺失（真值）');
  // 真值版尾界标 = 真值版中 branch 之后第一处免费分支 cacheKey 锚（strip 后'普通合盘洞察'已不可用）
  const tailTruth = SERVER_TRUTH.indexOf('const cacheKey =', headTruth);
  assert.notEqual(tailTruth, -1, '免费分支 cacheKey 锚缺失（真值）');
  return { text: SERVER_TRUTH.slice(headTruth, tailTruth), head: headTruth, tail: tailTruth };
}

// ══════════════════ A 组 · 源码级：骨架引渡（裁决 1）══════════════════
test('A1 资产单一真源镜像：api/ 与 web/api/ 逐字节一致', () => {
  assert.equal(ASSET, ASSET_MIRROR, 'api/ai-advisor.js 与 web/api/ai-advisor.js 漂移（镜像纪律破坏）');
});
test('A2 资产导出面：三函数 + 六语真值表齐备', () => {
  assert.match(ASSET, /export function buildCompatPrompt\(/, '唯一入口 buildCompatPrompt 缺失');
  assert.match(ASSET, /export function buildCompatTimeContext\(/, '动态时间轴缺失');
  assert.match(ASSET, /export function computeCompatScores\(/, '总分重算缺失');
  assert.match(ASSET, /export const COMPAT_REPORT_I18N/, '六语真值表缺失');
});
test('A3 server.js 物理引渡：import 精确匹配 + 委托链三环', () => {
  assert.match(SERVER, /import \{ buildCompatPrompt, buildCompatTimeContext, computeCompatScores \} from '\.\/api\/ai-advisor\.js';/,
    '引渡 import 行漂移（单一真源断裂）');
  const fn = extractFn(SERVER, 'buildCompatibilityReportPrompt');
  assert.ok(fn, '骨架委托函数缺失（moon-weeks 切片尾界标连带丢失）');
  assert.match(fn, /computeCompatScores\(x\.bazi, x\.zodiac, x\.iching\)/, '总分真值未进委托链');
  assert.match(fn, /buildCompatTimeContext\(reportType, new Date\(\), x\.userBirthDate \|\| null, lang\)/, '动态时间轴未进委托链（userBirthDate 丢了）');
  assert.match(fn, /return buildCompatPrompt\(\{/, '委托未回传骨架对象');
  assert.match(fn, /tarot: x\.tarot \|\| null,/, '塔罗真值未进委托链');
  assert.match(fn, /zodiacMeta: x\.zodiacMeta \|\| null,/, '星座元数据未进委托链');
});
test('A4 三档分流 + E24g B10 权益次序铁律（行号锚定，免疫漂移）', () => {
  const lines = SERVER.split('\n');
  // 锚定策略：entitlement 串是合婚域**唯一锚**（财富域用 resolveWealthEntitlement 不同名），
  //   branch 串在财富域同构存在 ⇒ 用 findLastIndex 向上找最近的 branch（必属合婚域），
  //   callAI 在 iEnt 之后找（必属合婚域装配）。
  const iEnt = lines.findIndex(l => l.includes("resolveReportEntitlement(req, 'compatibility'"));
  assert.notEqual(iEnt, -1, '合婚域权益闸门缺失');
  const iBranch = lines.findLastIndex((l, k) => k < iEnt && l.includes("if (reportType === 'monthly' || reportType === 'yearly' || reportType === 'once') {"));
  assert.notEqual(iBranch, -1, '三档分流 branch 缺失');
  const iCall = lines.findIndex((l, k) => k > iEnt && l.includes('await callAI('));
  assert.ok(iEnt > iBranch, '权益闸门不在合婚付费分支内');
  assert.ok(iEnt < iCall, `E24g B10 铁律破坏：权益（行 ${iEnt + 1}）必须早于 callAI（行 ${iCall + 1}）`);
  const seg = lines.slice(iBranch, lines.findIndex((l, k) => k > iBranch && l.includes('普通合盘洞察'))).join('\n');
  for (const a of ['compatibilityPeriodLock(', 'compatibilityDailyRateLimit(', 'compatibilityCounterDelta(', 'requiredPlanForCompat(reportType)']) {
    assert.ok(seg.includes(a), `E24g B10 锚点漂移：${a} 不在合婚段内`);
  }
});
test('A5 装配真值：bazi/zodiac/iching/tarot/userBirthDate 五真值 + system/user 双参进 callAI', () => {
  const { text } = compatEndpointSlice();
  assert.match(text, /bazi: req\.body\.bazi \|\| null,/, '八字真值丢失');
  assert.match(text, /zodiac: req\.body\.zodiac \|\| null,/, '星座真值丢失');
  assert.match(text, /iching: req\.body\.iching \|\| null,/, '易经真值丢失');
  assert.match(text, /tarot: \(req\.body\.tarot && req\.body\.tarot\.name\) \? req\.body\.tarot : null,/, '塔罗真值丢失');
  assert.match(text, /zodiacMeta: Array\.isArray\(req\.body\.zodiacMeta\) \? req\.body\.zodiacMeta : null,/, '星座元数据丢失');
  assert.match(text, /userBirthDate: _cEnt\.userBirthDate \|\| null,/, '宇宙生日锚（年报 Solar Return 真值）丢失');
  assert.match(text, /_compat\.system,/, 'system 提示未进 callAI');
  assert.match(text, /_compat\.user,/, 'user 提示未进 callAI');
});
test('A6 前端三档入口：generateReport 类型放宽 + VIP/非VIP 双分支 once 齐备', () => {
  assert.match(APP_TSX, /const generateReport = async \(type: 'monthly' \| 'yearly' \| 'once'\) =>/, 'generateReport 类型未放宽');
  // VIP 分支：once 生成按钮
  const iVip = APP_TSX.indexOf('all_pass_yearly === true');
  assert.notEqual(iVip, -1, 'VIP 分支缺失');
  const iVipEnd = APP_TSX.indexOf('</>) : (', iVip);
  const vipSeg = APP_TSX.slice(iVip, iVipEnd);
  assert.match(vipSeg, /generateReport\('once'\)/, 'VIP 分支缺 once 生成入口');
  assert.match(vipSeg, /完整合盘报告/, 'VIP 分支缺完整报告文案');
  // 非 VIP 分支：权益分档（已购直达生成 + 未购加购）
  const iNonVip = iVipEnd;
  const iRender = APP_TSX.indexOf("reportText.split('\\n\\n')", iNonVip);
  const nonVipSeg = APP_TSX.slice(iNonVip, iRender);
  for (const k of ['compatibility_monthly_report === true', 'compatibility_yearly_report === true', 'compatibility_once === true']) {
    assert.ok(nonVipSeg.includes(k), `非 VIP 分支缺已购档直达生成条件：${k}`);
  }
  for (const k of ["handlePurchase('compatibility_monthly_report')", "handlePurchase('compatibility_yearly_report')", "handlePurchase('compatibility_once')"]) {
    assert.ok(nonVipSeg.includes(k), `非 VIP 分支缺加购入口：${k}`);
  }
});

// ══════════════════ B 组 · 时间真值（裁决 2）══════════════════
// 固定年月字面量（闸门禁词，此处刻意不落字面——防全仓 grep 误报与本闸门自污染）
const BANNED_MONTH = ['July', '2026'].join(' ');
test('B1 全仓真值块零固定年月字面量（注释剥离后扫描）', () => {
  for (const [name, s] of [['server.js', SERVER_TRUTH], ['api/ai-advisor.js', ASSET_TRUTH]]) {
    assert.ok(!s.includes(BANNED_MONTH), `${name} 真值块仍含固定年月字面量`);
  }
  // 前端与镜像资产
  for (const f of ['web/src/App.tsx', 'web/api/ai-advisor.js']) {
    const t = stripJs(fs.readFileSync(path.join(ROOT, f), 'utf-8'));
    assert.ok(!t.includes(BANNED_MONTH), `${f} 真值块仍含固定年月字面量`);
  }
});
test('B2 动态月窗行为级：两态输入产出互异月窗（时间轴现算，非记忆值）', () => {
  const require2 = createRequire(path.join(ROOT, 'package.json'));
  const mod = require2(path.join(ROOT, 'api', 'ai-advisor.js'));
  assert.equal(typeof mod.buildCompatTimeContext, 'function', '资产动态时间轴不可加载（镜像/导出断裂）');
  const a = mod.buildCompatTimeContext('monthly', new Date('2027-03-15T00:00:00Z'), null, 'zh');
  const b = mod.buildCompatTimeContext('monthly', new Date('2027-08-15T00:00:00Z'), null, 'zh');
  assert.notEqual(a.timeText, b.timeText, '两态月窗相同 ⇒ 时间轴仍是死的');
  assert.ok(a.weeks && a.weeks.length === 4, `月窗 4 周轴缺失（实得 ${a.weeks ? a.weeks.length : 0}）`);
  // 2027-03 月窗必须含 2027-03 与月末 2027-03-31（月序与自然月边界双真值）
  assert.ok(a.weeks[0].start.startsWith('2027-03'), `月窗起点漂移：${a.weeks[0].start}`);
  assert.ok(a.weeks[3].end.startsWith('2027-03-31'), `月窗终点漂移：${a.weeks[3].end}`);
});
test('B3 年报双态：宇宙生日锚定 Solar Return 与无生日自然年回退互异', () => {
  const mod = createRequire(path.join(ROOT, 'package.json'))(path.join(ROOT, 'api', 'ai-advisor.js'));
  const sr = mod.buildCompatTimeContext('yearly', new Date('2027-03-15T00:00:00Z'), '1990-08-05', 'zh');
  const nat = mod.buildCompatTimeContext('yearly', new Date('2027-03-15T00:00:00Z'), null, 'zh');
  assert.notEqual(sr.timeText, nat.timeText, '有/无生日年报窗相同 ⇒ Solar Return 锚失效');
  assert.ok(sr.solarReturnStart || sr.anchor, 'Solar Return 锚字段缺失');
});
test('B4 注入必红：把动态月窗替换为固定字面量 ⇒ B2 判据必红（同源判据）', () => {
  const require2 = createRequire(path.join(ROOT, 'package.json'));
  // 构造变异资产：时间轴函数体换成恒定字面量
  let mutated = ASSET.replace(
    /export function buildCompatTimeContext\(reportType, now, birthDate, lang\) \{[\s\S]*?\n\}/,
    'export function buildCompatTimeContext(reportType, now, birthDate, lang) {\n  const zh = lang === \'zh\';\n  const t = { onceText: zh ? \'当下\' : \'now\' };\n  return { timeText: zh ? (reportType === \'once\' ? t.onceText : \'固定窗口\') : \'fixed\', weeks: [\n    { start: \'2026-07-01\', end: \'2026-07-07\' }, { start: \'2026-07-08\', end: \'2026-07-14\' },\n    { start: \'2026-07-15\', end: \'2026-07-21\' }, { start: \'2026-07-22\', end: \'2026-07-28\' }], monthKey: \'fixed\', anchor: null };\n}'
  );
  assert.notEqual(mutated, ASSET, '注入未生效（时间轴函数锚点漂移？）');
  // 写临时变异资产并加载（不动仓内文件）
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'e39-b4-'));
  try {
    fs.writeFileSync(path.join(dir, 'mutated.mjs'), mutated, 'utf8');
    const m = require2(path.join(dir, 'mutated.mjs'));
    const a = m.buildCompatTimeContext('monthly', new Date('2027-03-15T00:00:00Z'), null, 'zh');
    const b = m.buildCompatTimeContext('monthly', new Date('2027-08-15T00:00:00Z'), null, 'zh');
    // 同源判据（B2 的谓词）：两态互异 ⇒ 变异版必不满足
    let red = false;
    try {
      assert.notEqual(a.timeText, b.timeText, '死窗注入未被捕获');
      assert.ok(a.weeks[0].start.startsWith('2027-03'), '月序漂移注入未被捕获');
    } catch { red = true; }
    assert.ok(red, '注入后 B2 判据未变红（闸门失效假绿）');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ══════════════════ C 组 · 六语四段 + 契约统一（裁决 1+4）══════════════════
const FOUR_SECTIONS = ['🎯', '⚡', '💡', '🌿'];
test('C1 六语四段骨架 + 数据锁 + 报告模式子句全齐', () => {
  const mod = createRequire(path.join(ROOT, 'package.json'))(path.join(ROOT, 'api', 'ai-advisor.js'));
  for (const lang of ['zh', 'en', 'es', 'fr', 'th', 'vi']) {
    for (const rt of ['monthly', 'yearly', 'once']) {
      const scores = mod.computeCompatScores('78/100', '82/100', '71/100');
      const tc = mod.buildCompatTimeContext(rt, new Date('2027-03-15T00:00:00Z'), '1990-08-05', lang);
      const p = mod.buildCompatPrompt({ lang, reportType: rt, scores, timeCtx: tc, tarot: { name: 'The Lovers', orientation: 'Upright', meaning: 'union' }, zodiacMeta: ['Scorpio', 'Pisces'] });
      assert.ok(p.system && p.user, `${lang}/${rt} 出参断裂`);
      const miss = FOUR_SECTIONS.filter(e => !p.user.includes(e));
      assert.deepEqual(miss, [], `${lang}/${rt} 四段缺段: ${miss.join(',')}`);
      assert.ok(p.user.includes('78'), `${lang}/${rt} 分数锁缺失（总分真值未钉入）`);
      assert.ok(p.system.length > 40, `${lang}/${rt} system 过短`);
    }
  }
});
test('C2 三档互异：once/monthly/yearly 的 timeText 与篇幅裁决不同', () => {
  const mod = createRequire(path.join(ROOT, 'package.json'))(path.join(ROOT, 'api', 'ai-advisor.js'));
  const tOnce = mod.buildCompatTimeContext('once', new Date(), null, 'zh');
  const tMon = mod.buildCompatTimeContext('monthly', new Date(), null, 'zh');
  const tYear = mod.buildCompatTimeContext('yearly', new Date(), null, 'zh');
  assert.notEqual(tOnce.timeText, tMon.timeText, 'once 与 monthly 时间轴未分流');
  assert.notEqual(tMon.timeText, tYear.timeText, 'monthly 与 yearly 时间轴未分流');
  assert.ok(tMon.weeks && tMon.weeks.length === 4, 'monthly 缺 4 周轴');
  assert.ok(tOnce.weeks && tOnce.weeks.length === 0, 'once 不应有周段（无时段四段深报）');
});
test('C3 一行兜底清零：委托函数体无报告 stub（免费层 4 句路径合法保留，不在射程）', () => {
  const fn = extractFn(SERVER, 'buildCompatibilityReportPrompt');
  assert.ok(fn, '委托函数缺失');
  assert.ok(!fn.includes('命理合盘。'), '委托函数体内残留一行兜底 stub（$29.99 年报空壳复辟）');
  // JSON 契约残骸（全仓真值块）
  assert.ok(!SERVER_TRUTH.includes('OUTPUT FORMAT (JSON)'), 'server.js 真值块残留 JSON 契约');
});

// ══════════════════ D 组 · once 权益内核行为级（裁决 3）══════════════════
// 判据函数（正向 D2 与注入 D3 共用 ⇒ 同源铁律）
function assertOnceNotCoveredByMonthly(entFn) {
  const now = new Date();
  // ① 无权 ⇒ null（无 token 402 的内核前提）
  assert.equal(entFn({}, 'once', now), null, '空权益不该放行 once');
  // ② once 权益 ⇒ 放行
  assert.equal(entFn({ compatibility_once: true }, 'once', now), 'compatibility_once', 'once 买家未放行');
  // ③ 🔴 月卡【不覆盖】once（先天合盘是永久落库资产——财富域同裁决）
  assert.equal(entFn({ compatibility_monthly_report: true }, 'once', now), null, '月卡覆盖了 once（覆盖裁决被破坏）');
  // ④ 年卡放行（VIP 语义）
  assert.equal(entFn({ all_pass_yearly: true }, 'once', now), 'all_pass_yearly', '年卡未放行 once');
  // ⑤ 过期年卡不放行
  assert.equal(entFn({ all_pass_yearly: true, all_pass_expires_at: '2000-01-01T00:00:00Z' }, 'once', now), null, '过期年卡被放行');
}
test('D1 once 内核行为级：五态判据全绿', () => {
  const src = extractFn(SERVER, 'compatibilityEntitledByType');
  assert.ok(src, '权益内核函数抽取失败');
  const entFn = new Function(`${src}; return compatibilityEntitledByType;`)();
  assertOnceNotCoveredByMonthly(entFn);
});
test('D2 端点段 requiredPlan 映射：once → compatibility_once', () => {
  const fn = extractFn(SERVER, 'requiredPlanForCompat');
  assert.ok(fn, 'requiredPlanForCompat 缺失');
  const reqFn = new Function(`${fn}; return requiredPlanForCompat;`)();
  assert.equal(reqFn('once'), 'compatibility_once', 'once 的 requiredPlan 映射漂移');
  assert.equal(reqFn('yearly'), 'compatibility_yearly_report', 'yearly 映射漂移');
  assert.equal(reqFn('monthly'), 'compatibility_monthly_report', 'monthly 映射漂移');
});
test('D3 注入必红：把 once 改为月卡覆盖 ⇒ D1 判据必红（同源判据）', () => {
  const src = extractFn(SERVER, 'compatibilityEntitledByType');
  // 注入：月卡也放行 once（覆盖裁决破坏形态）
  const mutated = src.replace(
    "if (reportType === 'once') {",
    "if (reportType === 'once') { if (p.compatibility_monthly_report === true) return 'compatibility_monthly_report';"
  );
  assert.notEqual(mutated, src, '注入未生效（once 分支锚点漂移？）');
  const entFn = new Function(`${mutated}; return compatibilityEntitledByType;`)();
  let red = false;
  try { assertOnceNotCoveredByMonthly(entFn); } catch { red = true; }
  assert.ok(red, '注入后 D1 判据未变红（闸门失效假绿）');
});

// ══════════════════ E 组 · 链路接线与产物（裁决 5）══════════════════
test('E1 闸门接线：test:astro 链路含本闸门且 node 段 +1', () => {
  const chain = PKG.scripts['test:astro'] || '';
  assert.ok(chain.includes('audit-e39-compat-report-framework.test.mjs'), '本闸门未接线 test:astro');
  assert.ok(chain.split('&&').length >= 34, `链路段数异常（${chain.split('&&').length}）`);
});
test('E2 dist 产物带新入口（前端 build 已落地）', () => {
  const distDir = path.join(ROOT, 'web', 'dist');
  assert.ok(fs.existsSync(distDir), 'web/dist 缺失（build 未跑）');
  let hit = false;
  const scan = (d) => {
    for (const f of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, f.name);
      if (f.isDirectory()) scan(p);
      else if (f.name.endsWith('.js') && fs.readFileSync(p, 'utf-8').includes('完整合盘报告')) hit = true;
    }
  };
  scan(distDir);
  assert.ok(hit, 'dist 产物未包含 once 入口文案（build 未重跑或入口丢失）');
});
