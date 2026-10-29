#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// 🔴 E96（主公军令 2026-10-26）：三军令闸门
//   ① 滑轨槽两端防溢出（.ks-report-scroll 自身即金属框，轨道 margin 内缩）
//   ② 姻缘月报/年报真流式（callAI onText → DeepSeek stream:true →
//      openCompatStream.text() 增量帧 → 前端 onText 边收边显，TTFT<2s）
//   ③ 八字硬锁外语本地化（非 zh 就地转译，外语正文零汉字裸露）
// 判据口径：含**行为级**测试——VM 实跑 _E92CompatBaziLock × _e96LocalizeCompatBaziLock
//   （军令用例男 1976-12-03 03:00 / 女 1997-10-18 12:00）＋ import 真模块
//   sseParser.mjs 实跑 text 帧分类。
// ═══════════════════════════════════════════════════════════════
import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SERVER = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
const APP = fs.readFileSync(path.join(ROOT, 'web/src/App.tsx'), 'utf8');
const CSS = fs.readFileSync(path.join(ROOT, 'web/src/App.css'), 'utf8');
const SSEP = fs.readFileSync(path.join(ROOT, 'web/src/lib/sseParser.mjs'), 'utf8');
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

// VM 抽取（花括号配平，同 e92/e95 口径）
function fnBody(src, anchor) {
  const i = src.indexOf(anchor);
  if (i === -1) throw new Error(`fn anchor missing: ${anchor}`);
  let depth = 0, started = false;
  for (let j = src.indexOf('{', i); j < src.length; j++) {
    if (src[j] === '{') { depth++; started = true; }
    else if (src[j] === '}') { depth--; if (started && depth === 0) return src.slice(i, j + 1); }
  }
  throw new Error(`unbalanced fn: ${anchor}`);
}

/* ═══════════════════ ① 滑轨槽圆角防溢出 ═══════════════════ */

test('E96-①-1 轨道两端 margin 内缩（20px = 圆角半径，轨道端点全落直边区）', () => {
  assert.ok(CSS.includes('.ks-report-scroll::-webkit-scrollbar-track { margin: 20px 0; }'), '轨道 margin 内缩规则缺失');
  // 既有封仓规格行零改动（E90-③-2 锚点口径同步守卫）
  assert.ok(CSS.includes('.ks-report-scroll::-webkit-scrollbar { width: 5px; border-radius: 4px; }'), '滑轨 5px 胶囊规格被误改');
  assert.ok(CSS.includes('.ks-report-scroll::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); border-radius: 4px; }'), '轨道 0.05 规格被误改');
});

/* ═══════════════════ ② 真流式（后端链） ═══════════════════ */

test('E96-②-1 DeepSeek 原生流式取文器（stream:true + 逐 delta onText）', () => {
  assert.ok(SERVER.includes('async function _e96DeepSeekStreamText'), '流式取文器缺失');
  const fn = fnBody(SERVER, 'async function _e96DeepSeekStreamText');
  assert.ok(fn.includes('stream: true'), '未开启 stream:true（非流式假流）');
  assert.ok(fn.includes("choices[0].delta.content"), '未消费增量 delta（等全文的老病根）');
  assert.ok(fn.includes('getReader()'), '未读流（阻塞式取文）');
  assert.ok(fn.includes('return null'), '失败回退缺省缺失（须回退非流式链）');
  assert.ok(fn.includes('seedFromUserPrompt'), '流式/非流式 seed 口径不一致（同盘不同文风险）');
});

test('E96-②-2 callAI 解构 onText ＋ 流式优先回落非流式（契约零变）', () => {
  // ⚠️ callAI 签名含默认参数 `options = {}` ⇒ fnBody 花括号配平会在默认参处提前截断，
  //   本断言走源码级区间（anchor → 'All AI providers failed' 函数尾锚）。
  const iFn = SERVER.indexOf('async function callAI');
  const iEnd = SERVER.indexOf("throw new Error('All AI providers failed')", iFn);
  assert.ok(iFn > 0 && iEnd > iFn, 'callAI 函数锚缺失');
  const fn = SERVER.slice(iFn, iEnd);
  assert.ok(fn.includes("const { maxTokens = 12000, reportType = 'monthly', onText } = options"), 'callAI 未解构 onText');
  assert.ok(fn.includes('typeof onText === \'function\''), '流式分支判定缺失');
  assert.ok(/E96.*stream|stream.*fallback|非流式/.test(fn), '流式失败回落注释/日志缺失');
});

test('E96-②-3 openCompatStream 新增 text() 正文增量帧（closed 静默）', () => {
  const fn = fnBody(SERVER, 'function openCompatStream');
  assert.ok(fn.includes('text(delta)'), 'text() 增量帧方法缺失');
  assert.ok(fn.includes('_write({ text:'), '增量帧未走统一写流（断连自愈旁路）');
});

test('E96-②-4 handler 接线：SSE 建流才携 onText（JSON 通路零改动）', () => {
  const hStart = SERVER.indexOf("app.use('/api/ai-advisor'");
  const hEnd = SERVER.indexOf("app.use((req, res, next)", hStart);
  const handler = SERVER.slice(hStart, hEnd);
  assert.ok(handler.includes('const _e96Opts = { maxTokens: _e94MaxTokens, reportType };'), 'options 构造缺失（e94-②-2 锚点串必须保留）');
  assert.ok(handler.includes('if (_sse) _e96Opts.onText'), 'onText 未按建流条件注入（JSON 通路被误伤）');
  // JSON 回执契约旁置零改动（Gate43 D4 锚点同步守卫）
  assert.ok(handler.includes('res.json({ insight, cached: false })'), 'JSON 回执契约被改动');
});

/* ═══════════════════ ② 真流式（前端链） ═══════════════════ */

test('E96-②-5 sseParser 行为级：text 帧分类（ready/error/stage 优先，零误判）', async () => {
  const SP = await import('../web/src/lib/sseParser.mjs');
  assert.equal(SP.classifySSEFrame({ data: { text: 'abc' } }).type, 'text', 'text 帧未识别');
  assert.equal(SP.classifySSEFrame({ data: { text: 'abc' }, done: true }).type, 'done', 'done 哨兵被 text 抢占');
  assert.equal(SP.classifySSEFrame({ data: { stage: 'ready', insight: 'full', text: 'x' } }).type, 'ready', 'ready 被 text 抢占');
  assert.equal(SP.classifySSEFrame({ data: { text: 'x', error: 'boom' } }).type, 'error', 'error 被 text 抢占');
  assert.equal(SP.classifySSEFrame({ data: { text: 'x', stage: 'calculating', label: 'L' } }).type, 'stage', 'stage 被 text 抢占');
  assert.equal(SP.classifySSEFrame({ data: { meta: 1 } }).type, 'ignore', '未知形状误判');
  assert.ok(SSEP.includes("typeof d.text === 'string'"), 'text 判定源码缺失');
});

test('E96-②-6 App 边收边显：readCompatSSEStream 第三参 onText＋终帧双路收口', () => {
  assert.ok(/onText\?: \(t: string\) => void/.test(APP), '读流函数未声明 onText 参数');
  assert.ok(APP.includes('e96StreamedRef'), '真流式标记 ref 缺失');
  assert.ok(APP.includes('setReportText((prev) => (prev == null ? String(t) : prev + String(t)))'), '增量 append 逻辑缺失');
  // 降级路径（JSON 回退/旧后端）打字机起点 0 保留（e88-③ 锚点口径）
  assert.ok(APP.includes('setRevealedParas(0)'), '降级路径打字机起点被误删');
});

/* ═══════════════════ ③ 八字硬锁外语本地化 ═══════════════════ */

test('E96-③-1 行为级：军令用例本地化后 lock 零汉字＋拼音/动物/三合局英文表达', () => {
  const fnLock = fnBody(SERVER, 'function _E92CompatBaziLock');
  const _E92CompatBaziLock = new Function(`${fnLock}\nreturn _E92CompatBaziLock;`)();
  const fnL10n = fnBody(SERVER, 'function _e96LocalizeCompatBaziLock');
  const _e96LocalizeCompatBaziLock = new Function(`${fnL10n}\nreturn _e96LocalizeCompatBaziLock;`)();
  const bl = _E92CompatBaziLock('1976-12-03', '1997-10-18', '03:00', '12:00');
  assert.ok(bl, '军令用例锁计算失败');
  const zh0 = bl.lock;
  _e96LocalizeCompatBaziLock(bl);
  // 零汉字铁律（lock 全文无 CJK）
  assert.ok(!/[\u4e00-\u9fff]/.test(bl.lock), `lock 汉字残留：${(bl.lock.match(/[\u4e00-\u9fff]+/g) || []).join(',')}`);
  // 真值转译抽查（辰戌相冲 / 寅午半合属寅午戌局 / [BAZI DATA LOCK 前缀保留）
  assert.ok(bl.lock.includes('Chen-Xu (Dragon-Dog) clash'), '辰戌相冲英文映射缺失');
  assert.ok(bl.lock.includes('Yin-Wu (Tiger-Horse) half-combination of the Fire trine'), '寅午半合/Fire trine 映射缺失');
  assert.ok(bl.lock.includes('[BAZI DATA LOCK'), 'E95 锚点前缀 [BAZI DATA LOCK 丢失');
  assert.ok(/\(year pillar\)/.test(bl.lock) && /\(hour pillar\)/.test(bl.lock), '柱位英文标注缺失');
  // 幂等：二次本地化零变化
  const once = bl.lock;
  _e96LocalizeCompatBaziLock(bl);
  assert.strictEqual(bl.lock, once, '本地化不幂等（重复转译）');
  // 🔴 zh 通路零触碰：原函数输出未被本地化污染（重算仍中文）
  const blZh = _E92CompatBaziLock('1976-12-03', '1997-10-18', '03:00', '12:00');
  assert.ok(blZh.lock.includes('辰戌相冲') && blZh.lock === zh0, 'zh 中文交付契约被本地化污染');
});

test('E96-③-2 语言纯粹性铁律入 guard（非中文正文禁独立汉字）', () => {
  const fnLock = fnBody(SERVER, 'function _E92CompatBaziLock');
  const _E92CompatBaziLock = new Function(`${fnLock}\nreturn _E92CompatBaziLock;`)();
  const fnL10n = fnBody(SERVER, 'function _e96LocalizeCompatBaziLock');
  const _e96LocalizeCompatBaziLock = new Function(`${fnL10n}\nreturn _e96LocalizeCompatBaziLock;`)();
  const bl = _E92CompatBaziLock('1976-12-03', '1997-10-18', '03:00', '12:00');
  const guardZh = bl.guard;
  _e96LocalizeCompatBaziLock(bl);
  assert.ok(bl.guard.includes('LANGUAGE PURITY'), '语言纯粹性铁律缺失');
  assert.ok(bl.guard.includes('NEVER output any standalone untranslated Chinese characters'), '汉字禁令文案缺失');
  assert.ok(bl.guard.includes('Pig-Snake'), '英文占星表达示例缺失（军令口径）');
  // zh 原函数 guard 零污染
  const blZh = _E92CompatBaziLock('1976-12-03', '1997-10-18', '03:00', '12:00');
  assert.strictEqual(blZh.guard, guardZh, 'zh guard 契约被污染');
});

test('E96-③-3 handler 门控：仅非 zh 本地化（zh 通路零触碰）', () => {
  const hStart = SERVER.indexOf("app.use('/api/ai-advisor'");
  const hEnd = SERVER.indexOf("app.use((req, res, next)", hStart);
  const handler = SERVER.slice(hStart, hEnd);
  // 🛡️ E97-③ 后继化：本地化调用携 lang 实参（es 走纯西语转译）——旧单参调用形态退役
  assert.ok(handler.includes('_e96LocalizeCompatBaziLock(_e92BL, String(lang || \'zh\'))'), '本地化调用缺失（E97-③ 双参形态）');
  assert.ok(handler.includes("if (_e92BL && !/^zh/i.test(String(lang || 'zh')))"), 'zh 门控缺失（中文交付误伤风险）');
  // e92 锚点串守卫：函数签名/调用行/baziLock 三注入零改动
  assert.ok(SERVER.includes('function _E92CompatBaziLock(d1, d2, tA, tB)'), 'E92 函数签名被误改');
  assert.ok(handler.includes('const _e92BL = _E92CompatBaziLock(d1, d2, _e92TtA, _e92TtB)'), 'E92 调用行被误改');
});

/* ═══════════════════ ④ 闸门接线 ═══════════════════ */

test('E96-④-1 闸门接线：test:astro 含本闸门（72 段）＋入编位（e95 后、e40 前、python 链尾）', () => {
  const chain = PKG.scripts['test:astro'] || '';
  assert.ok(chain.includes('audit-e96-stream-l10n.test.mjs'), '本闸门未接线 test:astro');
  const parts = chain.split('&&').map((s) => s.trim());
  assert.equal(parts.length, 81, `链段数异常（实得 ${parts.length}，基线 79（E103/E104 升 79 段））`);   // 🛡️ E103/E104 后继化：77→79
  const iE96 = parts.findIndex((p) => p.includes('audit-e96-'));
  const iE95 = parts.findIndex((p) => p.includes('audit-e95-'));
  const iE40 = parts.findIndex((p) => p.includes('audit-e40-compat-synastry-tensor-fusion'));
  const iPy = parts.findIndex((p) => p.includes('python3'));
  assert.ok(iE95 !== -1 && iE96 > iE95, 'E96 须在 E95 之后');
  assert.ok(iE40 > iE96, 'E96 须在 e40-compat 之前（收口位军规）');
  assert.ok(iE40 === parts.length - 2, 'e40 恒 len-2 被破坏');
  assert.ok(iPy === parts.length - 1, 'python 恒链尾被破坏');
});
