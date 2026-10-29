// ═══════════════════════════════════════════════════════════════════════
// E89（主公军令 2026-10-25）：月报/年报生成链根治 —— 闸门
// ═══════════════════════════════════════════════════════════════════════
// 看守对象（军令四条铁律）：
//   ① 根治生成失败：沙盒真机测试态豁免姻缘线周期锁/日限流（对齐财富线 E47
//      「严禁弹窗阻断」；live 模式 fail-closed 不变）＋ maxTokens 校准
//      （年报 7000 / 月报 3000 / once 12000）。
//      真凶侦察（线上日志实锤）：沙盒付款（webhook 落 plan）不清周期锁 ⇒
//      生成请求 period LOCKED 403 ⇒ 前端吐「生成报告失败」。军师 48000
//      网关 400 假说经 DeepSeek 实测证伪（12000/48000 均 200 放行）。
//   ② 月报四模块交付：当月合盘能量总纲（共振指数）/ 四维情感能量雷达 /
//      30 天高能吉凶日历（2 吉日＋2 高危日）/ 月度易经调频锦囊。
//   ③ 年报 maxTokens 军令口径（48000 → 7000；内容交付仍五章长卷）。
//   ④ 前端真实报错解封：catch/else 严禁静默吞并，console 必带结构化真因。
//   ⑤ 链位军规：e88 < e89 < e40-compat(len-2) < python(链尾)。
// 同源铁律：锚字符串逐字取真源码；构造器函数体花括号配平抽取。
// ═══════════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const APP = read('web/src/App.tsx');
const SERVER = read('server.js');
const PKG = JSON.parse(read('package.json'));

/* ════════ ① 沙盒豁免（真凶根治）════════ */

test('E89-①-1 姻缘护栏沙盒豁免铸成（sandbox ⇒ 周期锁/日限流放行）', () => {
  // 护栏段唯一定位（_lockC 全仓唯一）
  const i = SERVER.indexOf('const _lockC = compatibilityPeriodLock(');
  assert.ok(i > 0, '姻缘护栏定位失败');
  const seg = SERVER.slice(i, i + 1600);
  assert.ok(seg.includes('const _rlC = compatibilityDailyRateLimit('), '日限流判定缺失（两锁并测口径）');
  assert.ok(seg.includes('if (_lockC.locked || _rlC.limited) {'), '双锁合流判定缺失');
  assert.ok(seg.includes('if (!isSandboxPaymentMode(process.env)) {'), '沙盒豁免分支缺失（真凶根治军令）');
});

test('E89-①-2 live 模式 fail-closed 不回归（403/429 拦截仍在豁免内侧）', () => {
  const i = SERVER.indexOf('const _lockC = compatibilityPeriodLock(');
  const seg = SERVER.slice(i, i + 1600);
  assert.ok(seg.includes("return res.status(403).json(compatGuardBody(_codeC"), 'live 403 周期锁拦截丢失');
  assert.ok(seg.includes("return res.status(429).json(compatGuardBody('DAILY_COMPAT_RATE_LIMIT_EXCEEDED'"), 'live 429 日限流拦截丢失');
  // 拦截必须在豁免分支**内侧**（非沙盒才拦）
  const iSb = seg.indexOf('if (!isSandboxPaymentMode(process.env)) {');
  const i403 = seg.indexOf('return res.status(403)');
  assert.ok(i403 > iSb, '403 拦截游离于豁免分支外（沙盒态仍会被拦死）');
});

test('E89-①-3 沙盒豁免日志标签（排障可 grep）', () => {
  const i = SERVER.indexOf('const _lockC = compatibilityPeriodLock(');
  const seg = SERVER.slice(i, i + 1600);
  assert.ok(seg.includes('[E89] sandbox mode => compat guard bypass'), '豁免放行日志标签缺失');
});

/* ════════ ② 月报四模块（$2.99 达标交付）════════ */

test('E89-②-1 月报四模块构造器铸成（zh 模块标题逐字）', () => {
  assert.ok(SERVER.includes('function buildCompatMonthlyFourModulePrompt('), '月报四模块构造器缺失');
  const zh = SERVER.indexOf('_E89_MONTHLY_MODULES');
  assert.ok(zh > 0, '月报模块表缺失');
  const seg = SERVER.slice(zh, zh + 1800);
  for (const t of ['第一章 · 当月合盘能量总纲', '第二章 · 四维情感能量雷达', '第三章 · 30天高能吉凶日历', '第四章 · 月度易经调频锦囊']) {
    assert.ok(seg.includes(t), `zh 模块标题缺失：${t}`);
  }
});

test('E89-②-2 月报模块表六语齐备（langLock 同验）', () => {
  const i = SERVER.indexOf('_E89_MONTHLY_MODULES');
  const seg = SERVER.slice(i, i + 1800);
  for (const l of ['zh', 'en', 'es', 'fr', 'th', 'vi']) {
    assert.ok(seg.includes(`${l}: Object.freeze`), `${l} 模块表缺失`);
  }
  const lk = SERVER.indexOf('_E89_MONTHLY_LANG_LOCK');
  const lseg = SERVER.slice(lk, lk + 2000);
  for (const l of ['zh', 'en', 'es', 'fr', 'th', 'vi']) {
    assert.ok(lseg.includes(`${l}: Object.freeze`), `${l} 月报语言锁缺失`);
  }
});

test('E89-②-3 生成分流三分支：yearly 五章 / monthly 四模块 / once 四段骨架（零回归）', () => {
  const iBranch = SERVER.indexOf("reportType === 'yearly'\n          ? buildCompatYearlyFiveChapterPrompt");
  assert.ok(iBranch > 0, '年报五章分流锚丢失（回归违令）');
  const seg = SERVER.slice(iBranch, iBranch + 2400);
  assert.ok(seg.includes('buildCompatYearlyFiveChapterPrompt(d1, d2, lang, {'), 'yearly 未接入五章构造器');
  assert.ok(seg.includes("(reportType === 'monthly'"), 'monthly 分流头缺失');
  assert.ok(seg.includes('buildCompatMonthlyFourModulePrompt(d1, d2, lang, {'), 'monthly 未接入四模块构造器');
  assert.ok(seg.includes(': buildCompatibilityReportPrompt(d1, d2, lang, reportType, {'), 'once 四段骨架分流丢失（回归违令）');
});

test('E89-②-4 月报模板零固定年月字面量＋动态时间轴（E39-B 铁律沿袭）', () => {
  const i = SERVER.indexOf('function buildCompatMonthlyFourModulePrompt(');
  assert.ok(i > 0, '构造器缺失');
  let depth = 0, started = false, end = -1;
  for (let j = SERVER.indexOf('{', i); j < SERVER.length; j++) {
    if (SERVER[j] === '{') { depth++; started = true; }
    else if (SERVER[j] === '}') { depth--; if (started && depth === 0) { end = j; break; } }
  }
  const fn = SERVER.slice(i, end + 1);
  const stripped = fn
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/.*$/gm, '')
    .replace(/(?<![:'"])\/\/(?!\/).*$/gm, '');
  assert.ok(!stripped.includes('July 2026'), '月报模板真值块含固定年月字面量（E39-B 禁词复辟）');
  assert.ok(stripped.includes("buildCompatTimeContext('monthly'"), '月报构造器未接动态时间轴真源');
});

test('E89-②-5 月报模块标题复用前端章节头正则（六语形态闭环）', () => {
  // 前端正则（E88 铸）须存在且覆盖月报六语模块标题形态
  const m = APP.match(/const isChapterHead = \/\^[\s\S]*?\/\.test\(para\)/);
  assert.ok(m, '前端章节头正则行缺失（回归违令）');
  for (const pat of ['第[一二三四五六七八九十]+章', 'Chương\\s+\\d']) {
    assert.ok(m[0].includes(pat), `章节头正则缺分支：${pat}`);
  }
  // 后端月报模块标题形态与正则逐语对齐（第X章/Chapter N/Capítulo N/Chapitre N/บทที่ N/Chương N）
  const i = SERVER.indexOf('_E89_MONTHLY_MODULES');
  const seg = SERVER.slice(i, i + 1800);
  for (const t of ['Chapter 1 ·', 'Capítulo 1 ·', 'Chapitre 1 ·', 'บทที่ 1 ·', 'Chương 1 ·']) {
    assert.ok(seg.includes(t), `模块标题形态缺：${t}（前端正则无法挂金铭牌）`);
  }
});

/* ════════ ③ maxTokens 军令口径 ═══════ */

test('E89-③-1 maxTokens 校准（E94/E97 后继：zh 年 7500/非中语年 12000/月 zh 3500·非中语 5500/once 12000）', () => {
  // 🛡️ E100-① 后继化：th/vi 高密度单列档挤掉 E94/E97 旧三元形态——语义断言改为
  //    分流变量存在性＋高密度档存在性（旧「: 12000」/「: 5500」字面量退役）。
  assert.ok(SERVER.includes('const _e94IsZh ='),
    'maxTokens 未按 E94 语种分流（外语截断根治缺失）');
  // 🛡️ E97-① 后继化：月报语种分流（非中语 5500 扩容根治截断）——旧 3000 字面量退役
  assert.ok(SERVER.includes("reportType === 'monthly' ? (_e94IsZh ? 3500 :"),
    '月/once 档位漂移（E97-① 月报分流表达式缺失）');
  assert.ok(SERVER.includes('_e100HighDensity ? 16000 : 12000') && SERVER.includes('_e100HighDensity ? 7500 : 5500'),
    'E100-① th/vi 高密度档缺失');
});

test('E89-③-2 48000 违令字面量零容忍（全仓 callAI 消费点）', () => {
  // 军令「立即停止传递 48000」——生成分流消费点不得残留
  const i = SERVER.indexOf('let insight = await callAI(');
  assert.ok(i > 0, '生成 callAI 消费点缺失');
  // 🛡️ E96-② 后继化：options 已前移为 _e96Opts 构造（onText 流式注入）——
  //    断言窗口向前扩 300 字以覆盖 options 构造行；48000 零容忍语义不变。
  // 🛡️ E100-② 后继化：callAI 前插入 CJK 清洗层（_e100NonZh/帧级 strip）——
  //    窗口再扩 300→700 覆盖 _e96Opts 构造行；reportType 语义不变。
  // 🛡️ E103-③ 后继化：wash 链再插 fr/es 排版层（_e103FrLang/_e103EsLang 两声明
  //    ＋注释）⇒ 窗口 700→1100 覆盖 _e96Opts 构造行；48000/reportType 语义不变。
  const seg = SERVER.slice(Math.max(0, i - 1100), i + 400);
  assert.ok(!seg.includes('48000'), '生成链 48000 残留违令');
  assert.ok(seg.includes('reportType'), 'callAI 未传 reportType（回执诊断信号丢失）');
});

/* ════════ ④ 前端真实报错解封 ═══════ */

test('E89-④-1 生成失败严禁静默吞并（console 结构化真因）', () => {
  const i = APP.indexOf("'[Report Gen Error]:'");
  assert.ok(i > 0, '前端解封日志标签缺失（静默吞并违令）');
  const seg = APP.slice(i - 200, i + 700);
  assert.ok(seg.includes('status: res.status'), '结构化诊断缺 HTTP 状态');
  assert.ok(seg.includes('data.error'), '结构化诊断缺服务端错误体');
  assert.ok(seg.includes('data.code'), '结构化诊断缺错误码');
  // UI 友好文案仍在（真因入日志、礼貌给用户）
  const j = APP.indexOf('生成报告失败，请重试。');
  assert.ok(j > 0, '友好文案丢失');
});

/* ════════ ⑤ replay 守卫（月报旧短壳豁免）════════ */

test('E89-⑤-1 replay 守卫三分支：once 零门槛 / yearly≥2000 / monthly≥1200', () => {
  const i = SERVER.indexOf('const _g41ReplayUsable = _g41Replay');
  assert.ok(i > 0, 'replay 可用性守卫缺失');
  const seg = SERVER.slice(i, i + 700);
  assert.ok(seg.includes("reportType === 'once'"), 'once 复读零门槛语义丢失');
  assert.ok(seg.includes('.insight.length >= 2000'), 'yearly 旧短壳下限缺失（2000）');
  assert.ok(seg.includes('.insight.length >= 1200'), 'monthly 旧短壳下限缺失（1200）');
  // 复读消费点必须走守卫变量
  assert.ok(SERVER.indexOf('if (_g41ReplayUsable) {') > 0, '复读命中未走守卫变量（守卫旁路＝形同虚设）');
});

/* ════════ ⑥ 链位军规与入编 ═══════ */

test('E89-⑥-1 闸门接线：test:astro 含本闸门（66 段）＋入编位（e88 后、e40 前、python 链尾）', () => {
  const chain = PKG.scripts['test:astro'] || '';
  assert.ok(chain.includes('audit-e89-compat-gen-fix.test.mjs'), '本闸门未接线 test:astro');
  const parts = chain.split('&&').map((s) => s.trim());
  // 🔴 E90 语义演进：E90 入编（69 段），本闸门历史基线同步上调。
  assert.equal(parts.length, 80, `链段数异常（实得 ${parts.length}，基线 79（E103/E104 升 79 段））`);   // 🛡️ E103/E104 后继化：77→79
  const iE89 = parts.findIndex((p) => p.includes('audit-e89-compat-gen-fix'));
  const iE88 = parts.findIndex((p) => p.includes('audit-e88-compat-five-fix'));
  const iE40 = parts.findIndex((p) => p.includes('audit-e40-compat-synastry-tensor-fusion'));
  const iPy = parts.findIndex((p) => p.includes('python3'));
  assert.ok(iE89 > iE88, 'E89 须在 E88 之后（军规次序）');
  assert.ok(iE40 > iE89, 'E89 须在 e40-compat 之前（收口位军规）');
  assert.ok(iPy === parts.length - 1, 'python 恒链尾被破坏');
});
