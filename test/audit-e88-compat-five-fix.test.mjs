// ═══════════════════════════════════════════════════════════════════════
// E88（主公军令 2026-10-26）：姻缘付费链五处实测缺陷根治 —— 闸门
// ═══════════════════════════════════════════════════════════════════════
// 看守对象（军令五条铁律）：
//   ① 支付状态机重构：月报 $2.99 / 年报 $29.99 点击**无条件**呈现沙盒收银台
//      （不论账号历史 already_paid 残留）；沙盒确认付款后才触发生成链；
//      彻底铲除 paid 旁路直跑生成。
//   ② 年报内容扩容五大章节：Solar Return 总括 / 12 月全景 / 四大维度 /
//      三大十字路口 / 易经流年卦——长卷 prompt＋打字机渐进渲染＋黑金长卷。
//   ③ 塔罗亮度终极收口：.ks-tarot-line 强绑主文令牌＋opacity:1。
//   ④ 灵宠跨模块闭环：选角后严禁自动跳转（两段交互）＋重选＝切换＋
//      首页门禁白名单纳入姻缘线权益（compatibility_*）。
//   ⑤ 链位军规：e86 < e87 < e88 < e40-compat(len-2) < python(链尾)。
// 同源铁律：锚字符串逐字取真源码；adopt 函数体花括号配平抽取。
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
const CSS = read('web/src/App.css');
const SERVER = read('server.js');
const CTA = read('web/src/components/AdoptFamiliarCTA.tsx');
const HOME = read('web/src/components/FamiliarHomeCard.tsx');
const PKG = JSON.parse(read('package.json'));

// ── 箭头函数体抽取（花括号配平；`const NAME = async (` 形态）──
function extractArrowFn(src, name) {
  const anchor = `const ${name} = async`;
  const i = src.indexOf(anchor);
  if (i === -1) return null;
  let depth = 0, started = false;
  for (let j = src.indexOf('{', i); j < src.length; j++) {
    if (src[j] === '{') { depth++; started = true; }
    else if (src[j] === '}') { depth--; if (started && depth === 0) return src.slice(i, j + 1); }
  }
  return null;
}

/* ════════ ① 支付状态机：paid 分支无条件弹沙盒 ════════ */

test('E88-①-1 paid 分支月报/年报无条件弹沙盒收银台（already_paid 不再旁路直跑）', () => {
  const iPaid = APP.indexOf("} else if (route.kind === 'paid') {");
  assert.ok(iPaid > 0, 'paid 分支缺失');
  const seg = APP.slice(iPaid, iPaid + 2600);
  // 军令分流：月报/年报两档 ⇒ openSandboxCashier 就地唤起
  assert.ok(seg.includes("plan === 'compatibility_monthly_report' || plan === 'compatibility_yearly_report'"),
    'paid 分支未按月报/年报两档分流弹沙盒');
  assert.ok(seg.includes('openSandboxCashier({'), 'paid 分支未就地唤起沙盒收银台（E88-① 军令）');
  // 唤起 payload：plan 必带（complete 只需 plan——sessionId/url 展示位空串合法）
  const iOpen = seg.indexOf('openSandboxCashier({');
  assert.ok(seg.slice(iOpen, iOpen + 200).includes('plan,'), '沙盒唤起缺 plan（收银台无法完成支付）');
});

test('E88-①-2 沙盒确认后承接生成链（onGranted 落信号+报告路由标记+reload）', () => {
  const iPaid = APP.indexOf("} else if (route.kind === 'paid') {");
  const seg = APP.slice(iPaid, iPaid + 2600);
  const iGrant = seg.indexOf('onGranted: () => {');
  assert.ok(iGrant > 0, 'paid 分支沙盒唤起缺 onGranted 承接');
  const g = seg.slice(iGrant, iGrant + 500);
  assert.ok(g.includes("sessionStorage.setItem('ks_payment_success', '1')"), 'onGranted 未落支付成功信号');
  assert.ok(g.includes("sessionStorage.setItem('ks_paid_report_type', 'monthly')"), 'onGranted 未落月报路由标记');
  assert.ok(g.includes("sessionStorage.setItem('ks_paid_report_type', 'yearly')"), 'onGranted 未落年报路由标记');
  assert.ok(g.includes('window.location.reload()'), 'onGranted 未 reload 承接冷启动恢复链');
});

test('E88-①-3 未确认先跳转零容忍（月报/年报路径严禁 openSandboxCashier 之外的直接 reload）', () => {
  const iPaid = APP.indexOf("} else if (route.kind === 'paid') {");
  const seg = APP.slice(iPaid, iPaid + 2600);
  // 分流段（paid 开路 → openSandboxCashier 唤起）内不得出现裸 reload（跳转只准发生在
  // onGranted 闭包 / once 支路内——即用户主动确认之后）
  const iOpen = seg.indexOf('openSandboxCashier({');
  assert.ok(iOpen > 0, '沙盒唤起定位失败');
  const head = seg.slice(0, iOpen);
  assert.ok(!head.includes('window.location.reload()'), '月报/年报路径在沙盒确认前直接 reload（偷跑生成违令）');
});

/* ════════ ② 年报五章长卷（后端）════════ */

test('E88-②-1 五章 prompt 构造器铸成（章节标题六语齐备）', () => {
  assert.ok(SERVER.includes('function buildCompatYearlyFiveChapterPrompt('), '五章 prompt 构造器缺失');
  // zh 五章标题逐字（军令五大章节）
  const zh = SERVER.indexOf('_E88_YEARLY_CHAPTERS');
  const seg = SERVER.slice(zh, zh + 2200);
  for (const t of ['第一章 · 太阳返照盘', '第二章 · 未来12个月流年月度演变全景', '第三章 · 双人关系四大硬核维度推演', '第四章 · 全年三大命运十字路口', '第五章 · 易经流年大卦与年度开运调频指南']) {
    assert.ok(seg.includes(t), `zh 章节标题缺失：${t}`);
  }
  // 六语齐备（langLock）
  for (const l of ['zh', 'en', 'es', 'fr', 'th', 'vi']) {
    assert.ok(seg.includes(`${l}: Object.freeze`), `${l} 章节表缺失`);
  }
});

test('E88-②-2 生成分流：yearly 五章 / monthly 四模块（E89）/ once 四段骨架（零回归）', () => {
  const iBranch = SERVER.indexOf("reportType === 'yearly'\n          ? buildCompatYearlyFiveChapterPrompt");
  assert.ok(iBranch > 0, '年报五章分流缺失（三元形态）');
  const seg = SERVER.slice(iBranch, iBranch + 2400);
  assert.ok(seg.includes('buildCompatYearlyFiveChapterPrompt(d1, d2, lang, {'), 'yearly 未接入五章构造器');
  // 🔴 E89 语义演进（主公军令 2026-10-25）：monthly 分流四模块构造器；once 沿用四段骨架。
  assert.ok(seg.includes('buildCompatMonthlyFourModulePrompt(d1, d2, lang, {'), 'monthly 未接入四模块构造器（E89 军令）');
  assert.ok(seg.includes(': buildCompatibilityReportPrompt(d1, d2, lang, reportType, {'), 'once 四段骨架分流丢失（回归违令）');
});

test('E88-②-3 年报 maxTokens 档位（E89 校准→E94 语种分流后继）', () => {
  // E94-② 军令（2026-10-26）：zh 年 7500 / 非中语年 12000（截断根治）；月 3000/once 12000 沿袭
  assert.ok(SERVER.includes('_e94IsZh ? 7500 : 12000'),
    'callAI maxTokens 未按 E94 语种分流口径（7000 死板残留）');
  assert.ok(SERVER.includes("reportType === 'monthly' ? 3000 : 12000"),
    '月/once 档位漂移（应 3000/12000）');
});

test('E88-②-4 replay 旧短壳守卫（旧四段壳不得挡死新长卷交付）', () => {
  const i = SERVER.indexOf('const _g41ReplayUsable = _g41Replay');
  assert.ok(i > 0, 'replay 可用性守卫缺失');
  const seg = SERVER.slice(i, i + 700);
  // 🔴 E89 语义演进：once 零门槛 / yearly ≥2000（E88 口径不变）/ monthly ≥1200（E89 新增）。
  assert.ok(seg.includes("reportType === 'once'"), 'once 复读零门槛语义丢失');
  assert.ok(seg.includes('.insight.length >= 2000'), 'yearly 旧短壳长度下限缺失（2000）');
  assert.ok(seg.includes('.insight.length >= 1200'), 'monthly 旧短壳长度下限缺失（1200，E89 军令）');
  // 复读消费点必须改用守卫变量
  const iUse = SERVER.indexOf('if (_g41ReplayUsable) {');
  assert.ok(iUse > 0, '复读命中未走守卫变量（守卫旁路＝形同虚设）');
});

test('E88-②-5 五章模板零固定年月字面量（时间轴现算铁律沿袭）', () => {
  // 构造器函数体抽取（E39 闸门 B 组同源口径：注释剥离后禁词）
  const i = SERVER.indexOf('function buildCompatYearlyFiveChapterPrompt(');
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
  assert.ok(!stripped.includes('July 2026'), '五章模板真值块含固定年月字面量（E39-B 禁词复辟）');
  // 时间窗真值必须现算注入（buildCompatTimeContext 在函数体内）
  assert.ok(stripped.includes("buildCompatTimeContext('yearly'"), '五章构造器未接动态时间轴真源');
});

/* ════════ ② 年报五章长卷（前端渲染：打字机+黑金长卷）════════ */

test('E88-②-6 前端打字机渐进渲染＋章节金标题（黑金长卷）', () => {
  // 渐进状态与消费
  assert.ok(APP.includes('const [revealedParas, setRevealedParas] = useState<number>(Number.POSITIVE_INFINITY)'),
    '打字机渐进状态缺失');
  assert.ok(APP.includes('setRevealedParas(0)'), '生成成功未落渐进起点（0）');
  assert.ok(APP.includes('const reportTyping ='), '打字机进行中判定缺失');
  // 渲染：章节头金铭牌＋滚动槽＋光标
  assert.ok(APP.includes('ks-report-scroll'), '黑金长卷滚动容器缺失');
  assert.ok(APP.includes("className=\"ks-report-chapter\"") || APP.includes('ks-report-chapter'), '章节金标题类未挂载');
  assert.ok(APP.includes('ks-report-cursor'), '打字机光标缺失');
  // CSS 三类铸成
  for (const cls of ['.ks-report-chapter', '.ks-report-para', '.ks-report-cursor']) {
    assert.ok(CSS.includes(cls), `CSS 类缺失：${cls}`);
  }
  const m = CSS.match(/\.ks-report-chapter\s*\{[^}]*\}/);
  assert.ok(m && m[0].includes('--ks-text-gold'), '章节头未绑金令牌');
});

/* ════════ ③ 塔罗亮度终极收口 ════════ */

test('E88-③-1 .ks-tarot-line 强绑主文令牌＋opacity 1（军令 CSS 逐字）', () => {
  const m = CSS.match(/\.ks-tarot-line\s*\{[^}]*\}/);
  assert.ok(m, '.ks-tarot-line 规则缺失');
  assert.ok(m[0].includes('color: var(--ks-text-primary, rgba(245, 245, 247, 0.95)) !important'),
    '未强绑主文亮度令牌（军令片段逐字缺失）');
  assert.ok(m[0].includes('opacity: 1 !important'), 'opacity 强制缺失');
  assert.ok(/line-height:\s*1\.7/.test(m[0]), '行距 1.7 缺失');
});

/* ════════ ④ 灵宠闭环（两段交互＋门禁白名单）════════ */

test('E88-④-1 认领选角后严禁自动跳转（adopt 函数体零整页跳转）', () => {
  const fn = extractArrowFn(CTA, 'adopt');
  assert.ok(fn, 'adopt 函数抽取失败');
  assert.ok(!fn.includes('window.location.href'), '认领选角成功即整页跳转（自动跳走守卫复辟违令）');
  // 认领写档（ks_familiar 同源键）保留——档是首页渲染真源
  assert.ok(fn.includes('localStorage.setItem(FAMILIAR_LS_KEY'), '认领成功未写灵宠档（首页渲染真源断裂）');
});

test('E88-④-2 带路按钮承接两段交互第二段（亲手点击才落意图+清劫持源+回首页）', () => {
  const iBtn = CTA.indexOf('data-testid="adopt-lead-home"');
  assert.ok(iBtn > 0, '带路按钮缺失');
  const seg = CTA.slice(iBtn, iBtn + 1800);
  assert.ok(seg.includes("sessionStorage.setItem('ks_open_familiar_chat', '1')"), '带路按钮未落对话舱意图');
  assert.ok(seg.includes("localStorage.removeItem('ks_oauth_back_url')"), '带路按钮未清回跳劫持源（E87-④ 契约回归）');
  assert.ok(seg.includes("localStorage.removeItem('ks_pending_checkout_plan')"), '带路按钮未清续跑意图源');
  assert.ok(seg.includes("localStorage.removeItem('ks_result')"), '带路按钮未清旧测算结果');
  // 亲手点击才有出口：带路按钮内保留整页回首页（唯一合法跳转位）
  assert.ok(seg.includes("window.location.href = '/'"), '带路按钮回首页出口丢失');
  // 重选入口（重新认领＝切换/唤醒）
  assert.ok(CTA.includes('data-testid="adopt-reselect"'), '重选（切换/唤醒）入口缺失');
});

test('E88-④-3 首页门禁白名单纳入姻缘线权益（灵宠不显示根因根治）', () => {
  const i = HOME.indexOf('let ok = planMap.wealth_once === true');
  assert.ok(i > 0, '门禁白名单定位失败');
  const seg = HOME.slice(i, i + 400);
  for (const p of ['planMap.compatibility_once === true', 'planMap.compatibility_monthly_report === true', 'planMap.compatibility_yearly_report === true']) {
    assert.ok(seg.includes(p), `门禁白名单缺姻缘权益：${p}`);
  }
  // fail-closed 铁律不回归（判定失败仍拦截）
  assert.ok(HOME.includes('setPaidOk(false); // fail-closed'), 'fail-closed 门禁语义回归违令');
});

/* ════════ ⑤ 链位军规与入编 ════════ */

test('E88-⑤-1 闸门接线：test:astro 含本闸门（66 段）＋入编位（e40-compat 前、python 链尾）', () => {
  // 🔴 E89 语义演进：E89 军令入编独立段（插 e88 后、e40 前）⇒ 基线 65→66。
  // 🔴 E90 语义演进：E90 军令入编独立段（插 e89 后、e40 前）⇒ 基线 66→67。
  const chain = PKG.scripts['test:astro'] || '';
  assert.ok(chain.includes('audit-e88-compat-five-fix.test.mjs'), '本闸门未接线 test:astro');
  const parts = chain.split('&&').map((s) => s.trim());
  assert.equal(parts.length, 70, `链段数异常（实得 ${parts.length}，基线 70）`);
  const iE88 = parts.findIndex((p) => p.includes('audit-e88-compat-five-fix'));
  const iE40 = parts.findIndex((p) => p.includes('audit-e40-compat-synastry-tensor-fusion'));
  const iPy = parts.findIndex((p) => p.includes('python3'));
  assert.ok(iE40 > iE88, 'E88 须在 e40-compat 之前（收口位军规）');
  assert.ok(iPy === parts.length - 1, 'python 恒链尾被破坏');
});
