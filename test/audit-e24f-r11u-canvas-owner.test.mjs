/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  E24⑤ · r11u — 前端画布主权门控 + 请求坐标 URL 同源直读（注入式闸门）
 * ═══════════════════════════════════════════════════════════════════════════
 *  缺陷史（本闸门永久封锁的两类线上事故）：
 *    ① 请求坐标 stale state：首屏自动月报（loadWealthData）在 mount 批次读组件
 *      state（默认 12:00 / 13.75 / 100.5 / Asia/Bangkok），而 URL 参数由另一
 *      useEffect 异步写入 ⇒ 月报跑曼谷盘（缓存实证
 *      wealth:v530:1989-04-12:12:00:13.7500:100.5000:Asia/Bangkok:fr:monthly）。
 *    ② 画布跨稿污染：月报与年报共用唯一 sacredText 画布 + 流式追加 ⇒ 两稿拼接
 *      （[🟢 Semaine N] 仅月报产出 = 混入指纹）。
 *  防线契约：
 *    A. `deriveWealthBirthParams`（纯函数，URL 同步直读）必须存在且被恰好 2 处
 *       调用；四处 POST 请求体（loadWealthData / 流式主请求 / 流式 fallback /
 *       旧非流式）必须一律取 `_bp.*`，请求体不得再出现 `lat: birthLat` 等裸
 *       state 读（仅允许作为 fallback 入参出现，恰 2 处）。
 *    B. 画布主权：`canvasOwnerRef` 声明 + 两处认领（'monthly' / type）；
 *       除两处「认领后清屏 setSacredText('')」外，**一切** sacredText 写入必须
 *       过 `canvasOwnerRef.current ===` 门禁（含内存命中回放 / gen.done 回放 /
 *       订阅回调 / chunk 快照 / sanitized 覆盖 / 容错追加 / [DONE] 终稿 /
 *       fallback 打字机闭包）。
 *    C. 渲染主权：月报框 / 年报框必须以 `canvasOwnerRef.current === '…'` 为
 *       前置挂载条件，且不得存在无主权门控的裸渲染条件（正反断言成对）。
 *  注入自测：在真实源码（剥注释后）尾部追加三类旧缺陷全形态，闸门必须转红。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathToFileURL } from 'node:url';
import os from 'node:os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_PATH = path.join(__dirname, '..', 'web', 'src', 'pages', 'WealthReportPage.tsx');

// ── 剥注释（行注释 + 块注释；字符串内的 // 不误伤：先跳过字符串字面量） ──
function stripComments(src) {
  let out = '';
  let i = 0;
  const n = src.length;
  let quote = null;
  while (i < n) {
    const c = src[i];
    const d = i + 1 < n ? src[i + 1] : '';
    if (quote) {
      out += c;
      if (c === '\\') { out += d; i += 2; continue; }
      if (c === quote) quote = null;
      i++;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { quote = c; out += c; i++; continue; }
    if (c === '/' && d === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && d === '*') { i += 2; while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++; i += 2; continue; }
    out += c;
    i++;
  }
  return out;
}

// ── 提取一次 setSacredText( 调用的实参（配平圆括号，能处理箭头函数体内嵌套括号） ──
function extractCallArgs(src, callStart) {
  // callStart 指向 'setSacredText' 的 's'
  const open = src.indexOf('(', callStart);
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '(') depth++;
    else if (src[i] === ')') {
      depth--;
      if (depth === 0) return src.slice(open + 1, i);
    }
  }
  return '';
}

function countMatches(src, re) {
  return (src.match(re) || []).length;
}

function runChecks(srcRaw) {
  const src = stripComments(srcRaw);
  const fails = [];

  // ── A1: 纯函数存在且形态完整（与 V491/WP-2·WP-6·WP-7 校验规则同源） ──
  const fnM = src.match(/export const deriveWealthBirthParams\s*=|export function deriveWealthBirthParams/);
  if (!fnM) fails.push('A1: deriveWealthBirthParams 未导出');
  else {
    const fnRegion = src.slice(src.indexOf(fnM[0]), src.indexOf(fnM[0]) + 2200);
    for (const [k, re, why] of [
      ['URLSearchParams', /new URLSearchParams\(/, 'A1a: 未用 URLSearchParams 解析 URL'],
      ['time 校验', /isValidBirthTime\(/, 'A1b: time 值域校验未走同源纯函数 isValidBirthTime（V491/WP-6 → E24⑥③ P1③ 前移：由形态校验升级为值域校验）'],
      ['coord-parse', /resolveCoordinates\(/, 'A1c: 坐标未走 coord-parse 统一校验（V491/WP-2 同源）'],
      ['tz Intl', /Intl\.DateTimeFormat\(/, 'A1d: tz 未走 Intl 可解析校验（V491/WP-7 同源）'],
    ]) {
      if (!re.test(fnRegion)) fails.push(why);
    }
  }

  // ── A2: 恰好 2 处调用（loadWealthData + generateWealthReport） ──
  const callSites = countMatches(src, /deriveWealthBirthParams\(window\.location\.search/g);
  // 🐾 E34-B5（2026-10-09）：第 3 处为**渲染层**派生 —— 灵宠选择器需与请求体同源的
  //   birthTime/lat/lon/tz，故在 render 体内复用同一纯函数（fallback 入参形状逐字相同）
  //   ⇒ 2 → 3。语义不变：仍「只允许 URL 同源直读 + 同一 fallback 形状」。
  // 🔒 E49（2026-10-14）：第 4 处为 familiarLead 懒初始化内的**挂载签名校验** ——
  //   认领档按盘隔离须在首帧读取时派生当前盘特征（useState 初始化器早于渲染层 const
  //   ⇒ 无法复用 _familiarBp，必须独立调用同一纯函数，fallback 形状逐字相同）⇒ 3 → 4。
  if (callSites !== 4) fails.push(`A2: deriveWealthBirthParams(window.location.search) 调用须恰 4 处（2 请求路径 + 1 渲染层灵宠入参 + 1 挂载签名校验），实为 ${callSites}`);

  // ── A3: 四处请求体（loadWealthData / 流式主请求 / 流式 fallback / 旧非流式）一律 _bp.*；
  //     裸 state 读只允许作为 fallback 入参（恰 3 处：上述 2 处 + E34-B5 渲染层 1 处） ──
  const bpBody = countMatches(src, /birthTime:\s*_bp\.birthTime/g);
  if (bpBody !== 4) fails.push(`A3a: 请求体 birthTime: _bp.birthTime 须恰 4 处（loadWealthData/流式主请求/fallback/旧非流式），实为 ${bpBody}`);
  for (const [k, re] of [
    ['lat: birthLat', /lat:\s*birthLat\b/g],
    ['lon: birthLon', /lon:\s*birthLon\b/g],
    ['tz: birthTz', /tz:\s*birthTz\b/g],
  ]) {
    const c = countMatches(src, re);
    if (c !== 3) fails.push(`A3b: 「${k}」只允许作为 deriveWealthBirthParams 的 fallback 入参出现恰 3 处，实为 ${c}`);
  }

  // ── B1: canvasOwnerRef 声明 + 两处认领 ──
  if (!/canvasOwnerRef\s*=\s*useRef</.test(src)) fails.push('B1a: canvasOwnerRef 未用 useRef 声明');
  if (countMatches(src, /canvasOwnerRef\.current\s*=\s*'monthly'/g) !== 1) fails.push('B1b: loadWealthData 的画布认领（= \'monthly\'）缺失或不唯一');
  if (countMatches(src, /canvasOwnerRef\.current\s*=\s*type\b/g) !== 1) fails.push('B1c: generateWealthReport 的画布认领（= type）缺失或不唯一');

  // ── B2: 除两处清屏外，一切 setSacredText 写入必须过主权门禁 ──
  const CLEAR_TOKEN = "setSacredText('')";
  const clearCount = countMatches(src, /setSacredText\(''\)/g);
  // 🧪 E47（2026-10-14）: 第 3 处合法清屏 —— `forceRegenerate`（测试重置 / 重新推演）内主动清空画布。
  //   守备语义不变：除这 3 处（2 认领 + 1 重置）外，一切 sacredText 写入仍必须过主权门禁（B2b）。
  if (clearCount !== 3) fails.push(`B2a: 认领后清屏 setSacredText('') 须恰 3 处（2 认领 + 1 重置），实为 ${clearCount}`);
  const writeRe = /setSacredText\(/g;
  let m;
  while ((m = writeRe.exec(src)) !== null) {
    const args = extractCallArgs(src, m.index).trim();
    if (args === "''") continue; // 清屏放行
    const before = src.slice(Math.max(0, m.index - 160), m.index);
    if (!/canvasOwnerRef\.current\s*===/.test(before)) {
      fails.push(`B2b: 发现无主权门禁的 sacredText 写入: setSacredText(${args.slice(0, 60)}${args.length > 60 ? '…' : ''})`);
    }
  }

  // ── C: 渲染主权（正断言：门控形态恰 1 处；反断言：裸形态不得独立存在） ──
  const guardM = countMatches(src, /canvasOwnerRef\.current === 'monthly' && \(reportLoading === 'wealth_monthly' \|\| monthlyCardsReady\)/g);
  if (guardM !== 1) fails.push(`C1: 月报框渲染须恰 1 处 canvasOwnerRef.current === 'monthly' 主权门控，实为 ${guardM}`);
  const guardY = countMatches(src, /canvasOwnerRef\.current === 'yearly' && \(reportLoading === 'wealth_yearly' \|\| yearlyCardsReady\)/g);
  if (guardY !== 1) fails.push(`C2: 年报框渲染须恰 1 处 canvasOwnerRef.current === 'yearly' 主权门控，实为 ${guardY}`);
  const bareM = countMatches(src, /\(reportLoading === 'wealth_monthly' \|\| monthlyCardsReady\)/g);
  if (bareM !== 1) fails.push(`C3: 「(reportLoading === 'wealth_monthly' || monthlyCardsReady)」只允许出现在主权门控表达式内（恰 1 处），实为 ${bareM}`);
  const bareY = countMatches(src, /\(reportLoading === 'wealth_yearly' \|\| yearlyCardsReady\)/g);
  if (bareY !== 1) fails.push(`C4: 「(reportLoading === 'wealth_yearly' || yearlyCardsReady)」只允许出现在主权门控表达式内（恰 1 处），实为 ${bareY}`);

  return fails;
}

// ── 真实源码基线：闸门必须全绿 ──
const REAL_SRC = fs.readFileSync(SRC_PATH, 'utf8');
const baseFails = runChecks(REAL_SRC);

test('E24⑤/r11u: 基线 —— 坐标 URL 同源直读 + 画布主权门控 全部在位', () => {
  assert.deepEqual(baseFails, [], '闸门失败项:\n' + baseFails.join('\n'));
});

// ── 注入自测：三类旧缺陷全形态，注入后闸门必须转红 ──
test('E24⑤/r11u: 注入① —— 请求体退回裸 state 读（stale state 旧缺陷）必须转红', () => {
  const injected = REAL_SRC + "\nconst _leakBody = JSON.stringify({ birthTime, lat: birthLat, lon: birthLon, tz: birthTz, reportType: 'monthly' });\n";
  const f = runChecks(injected);
  assert.ok(f.length > 0, '注入缺陷①未被检出');
  assert.ok(f.some((x) => /^A3b/.test(x)), '缺陷①必须命中 A3b（裸 state 读计数）');
});

test('E24⑤/r11u: 注入② —— 无门禁的流式追加写画布（跨稿污染旧缺陷）必须转红', () => {
  const injected = REAL_SRC + '\nsetSacredText(prev => prev + leakedChunk);\n';
  const f = runChecks(injected);
  assert.ok(f.some((x) => /^B2b/.test(x)), '缺陷②必须命中 B2b（无门禁写入）');
});

test('E24⑤/r11u: 注入③ —— 月报框裸渲染条件（无主权门控）必须转红', () => {
  const injected = REAL_SRC + "\nconst leakRender = (reportLoading === 'wealth_monthly' || monthlyCardsReady) && (null);\n";
  const f = runChecks(injected);
  assert.ok(f.some((x) => /^C3/.test(x)), '缺陷③必须命中 C3（裸渲染条件）');
});

test('E24⑤/r11u: 注入④ —— 删除请求体 _bp 直读（回退 birthTime 裸 state）必须转红', () => {
  const injected = REAL_SRC.replace(/birthTime:\s*_bp\.birthTime/g, 'birthTime, // E24F-INJECT');
  const f = runChecks(injected);
  assert.ok(f.some((x) => /^A3a/.test(x)), '缺陷④必须命中 A3a（请求体 _bp 直读缺失）');
});

/* ═══════════════════════════════════════════════════════════════════════════
 * D. 45-D2c —— 冷启动「现场恢复」全参透传（回跳 URL 不得丢坐标）
 * ═══════════════════════════════════════════════════════════════════════════
 * 缺陷史：回跳 URL 旧写法只带 `birth` + `lang` ⇒ 冷启动重载 / 移动端后台回收 /
 * 微信内置浏览器 / Stripe 支付成功回跳恢复现场时，出生时间·城市·经纬度·时区
 * **全丢** ⇒ 退回曼谷默认盘（与 45-D1「参数名错位」同源的孪生暗雷）。
 * 契约以**消费方**为准（deriveWealthBirthParams 只认 time|birthTime / lat / lon / tz）；
 * ⚠️ E34 D5：源 = 当前 URL，未选城时本就不发 lat/lon ⇒ **绝不臆造**默认坐标。
 * ═══════════════════════════════════════════════════════════════════════════ */
const APP_PATH = path.join(__dirname, '..', 'web', 'src', 'App.tsx');
const REAL_APP_SRC = fs.readFileSync(APP_PATH, 'utf8');
const RESTORE_MODULE_PATH = path.join(__dirname, '..', 'web', 'src', 'lib', 'wealthRestore.mjs');
const RESTORE_MODULE_SRC = fs.readFileSync(RESTORE_MODULE_PATH, 'utf8');
const R = await import(pathToFileURL(RESTORE_MODULE_PATH).href);

const _tmpRestoreRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ks-45d2c-'));
let _rseq = 0;
async function loadMutatedRestore(mutate) {
  const src = mutate(RESTORE_MODULE_SRC);
  assert.notEqual(src, RESTORE_MODULE_SRC, '注入未命中锚点（锚点漂移，注入自测失效）');
  const p = path.join(_tmpRestoreRoot, 'r' + (++_rseq) + '.mjs');
  fs.writeFileSync(p, src, 'utf8');
  return await import(pathToFileURL(p).href);
}

// 真值样本：WealthPage 生产形态（标准名 lat/lon/tz + 兼容名 birth*）
const ORACLE_SEARCH = '?birth=1976-12-03&lang=zh&birthTime=03%3A30&birthCity=Yichang'
  + '&birthLat=30.7144&birthLon=111.2847&birthTz=Asia%2FShanghai'
  + '&lat=30.7144&lon=111.2847&tz=Asia%2FShanghai';
const qsOf = (u) => new URLSearchParams(String(u).split('?')[1] || '');

/* ── 判据（主测与注入自测**同源**取用）── */
const restoreCarriesAllBirthParams = (mod) => {
  const p = qsOf(mod.buildWealthRestoreUrl('/wealth/report', ORACLE_SEARCH, { birthDate: '', lang: '' }));
  return p.get('birth') === '1976-12-03' && p.get('lang') === 'zh'
    && p.get('birthTime') === '03:30' && p.get('birthCity') === 'Yichang'
    && p.get('lat') === '30.7144' && p.get('lon') === '111.2847' && p.get('tz') === 'Asia/Shanghai';
};
const restoreNeverFabricatesCoords = (mod) => {
  const u = mod.buildWealthRestoreUrl('/wealth/report', '?birth=1990-01-01&lang=zh&birthTime=12%3A00', { birthDate: '', lang: '' });
  return !/[?&]lat=/.test(u) && !/[?&]lon=/.test(u) && !/[?&]tz=/.test(u);
};
const restoreFallbackOk = (mod) => {
  const p = qsOf(mod.buildWealthRestoreUrl('/wealth/report', '', { birthDate: '1990-02-03', lang: 'fr' }, { free_access: '1' }));
  return p.get('birth') === '1990-02-03' && p.get('lang') === 'fr' && p.get('free_access') === '1';
};
const restoreCallSitesOk = (srcRaw) => {
  const s = stripComments(srcRaw);
  const calls = countMatches(s, /buildWealthRestoreUrl\(\s*window\.location\.pathname\s*,\s*window\.location\.search/g);
  const legacy = countMatches(s, /window\.location\.pathname\s*\+\s*'\?birth='/g);
  return calls === 2 && legacy === 0;
};
const appRestorePrefersBackUrlOk = (srcRaw) => {
  const s = stripComments(srcRaw);
  if (s.includes('`/wealth?birth=${encodeURIComponent(birthDate)}&lang=${lang}&intent=checkout&plan=${pendingPlan}`')) return false;
  const i = s.indexOf("const restored = localStorage.getItem('ks_oauth_back_url')");
  if (i === -1) return false;
  const region = s.slice(i, i + 420);
  return region.includes('||') && /window\.location\.href\s*=\s*restored\s*\+/.test(region);
};

const baseRestoreFails = [];
if (!restoreCarriesAllBirthParams(R)) baseRestoreFails.push('D1: 回跳 URL 未全参透传（时间/城市/坐标/时区缺失）');
if (!restoreNeverFabricatesCoords(R)) baseRestoreFails.push('D2: 未选城时臆造默认坐标（违反 E34 D5）');
if (!restoreFallbackOk(R)) baseRestoreFails.push('D3: 缺参兜底 / extra 追加失效');
if (!restoreCallSitesOk(REAL_SRC)) baseRestoreFails.push('D4: 回跳调用点未走纯核（须恰 2 处）或旧形态残留');
if (!appRestorePrefersBackUrlOk(REAL_APP_SRC)) baseRestoreFails.push('D5: App 恢复链未优先复用全参回跳 URL');

test('45-D2c: 基线 —— 冷启动「现场恢复」全参透传到位（回跳不丢坐标）', () => {
  assert.deepEqual(baseRestoreFails, [], '闸门失败项:\n' + baseRestoreFails.join('\n'));
});

test('45-D2c: D6 白名单键与消费方契约对齐（标准名 + 兼容名齐备）', () => {
  for (const k of ['birth', 'lang', 'time', 'birthTime', 'birthCity', 'lat', 'lon', 'tz']) {
    assert.ok(R.WEALTH_RESTORE_KEYS.includes(k), `白名单缺键 ${k}`);
  }
  // 漂移锁：消费方（报告页 deriveWealthBirthParams）真实读取的键名必须被白名单覆盖
  const consumer = stripComments(REAL_SRC);
  for (const k of ['time', 'birthTime', 'lat', 'lon', 'tz']) {
    assert.ok(new RegExp("p\\.get\\('" + k + "'\\)").test(consumer), `消费方未读取 ${k}（契约漂移须复查）`);
  }
});

test('45-D2c: 注入① —— 纯核丢弃坐标（只透传 birth+lang）⇒ D1 必红', async () => {
  const mod = await loadMutatedRestore((s) => s.replace(
    "  for (const k of WEALTH_RESTORE_KEYS) {",
    "  for (const k of ['birth', 'lang']) {"));
  assert.equal(restoreCarriesAllBirthParams(mod), false, 'D1 判据必须能识破坐标丢失');
});

test('45-D2c: 注入② —— 纯核臆造曼谷默认坐标 ⇒ D2 必红（E34 D5）', async () => {
  const mod = await loadMutatedRestore((s) => s.replace(
    "  if (!out.get('birth') && fallback.birthDate) out.set('birth', fallback.birthDate);",
    "  if (!out.get('lat')) out.set('lat', '13.75');\n  if (!out.get('lon')) out.set('lon', '100.5');\n"
    + "  if (!out.get('birth') && fallback.birthDate) out.set('birth', fallback.birthDate);"));
  assert.equal(restoreNeverFabricatesCoords(mod), false, 'D2 判据必须能识破默认盘臆造');
});

test('45-D2c: 注入③ —— 回跳退回「只带 birth+lang」旧形态 ⇒ D4 必红', () => {
  const bad = REAL_SRC.replace(
    'buildWealthRestoreUrl(window.location.pathname, window.location.search, { birthDate, lang });',
    "window.location.pathname + '?birth=' + encodeURIComponent(birthDate) + '&lang=' + encodeURIComponent(lang);");
  assert.notEqual(bad, REAL_SRC, 'D4 注入锚点漂移');
  assert.equal(restoreCallSitesOk(bad), false, 'D4 判据必须能识破旧形态回跳');
});

test('45-D2c: 注入④ —— App 恢复链改回硬编码 birth+lang ⇒ D5 必红', () => {
  const bad = REAL_APP_SRC.replace(
    /const restored = localStorage\.getItem\('ks_oauth_back_url'\)\s*\n\s*\|\|[^;]*;/,
    'const restored = `/wealth?birth=${encodeURIComponent(birthDate)}&lang=${lang}`;');
  assert.notEqual(bad, REAL_APP_SRC, 'D5 注入锚点漂移');
  assert.equal(appRestorePrefersBackUrlOk(bad), false, 'D5 判据必须能识破硬编码恢复链');
});

test('45-D2c: 注入⑤ —— App 恢复链退回「旧整行硬编码 + intent」原形 ⇒ D5 必红', () => {
  const bad = REAL_APP_SRC.replace(
    /const restored = [\s\S]*?window\.location\.href = restored \+ rsep \+ 'intent=checkout&plan=' \+ pendingPlan;/,
    "window.location.href = `/wealth?birth=${encodeURIComponent(birthDate)}&lang=${lang}&intent=checkout&plan=${pendingPlan}`;");
  assert.notEqual(bad, REAL_APP_SRC, 'D5 注入锚点漂移（旧原形）');
  assert.equal(appRestorePrefersBackUrlOk(bad), false, 'D5 判据必须能识破旧原形');
});

test('45-D2c: 注入⑥ —— 判据射程自证（正例全绿，禁射程断层）', () => {
  assert.ok(restoreCarriesAllBirthParams(R), 'D1 判据射程失效');
  assert.ok(restoreNeverFabricatesCoords(R), 'D2 判据射程失效');
  assert.ok(restoreFallbackOk(R), 'D3 判据射程失效');
  assert.ok(restoreCallSitesOk(REAL_SRC), 'D4 判据射程失效');
  assert.ok(appRestorePrefersBackUrlOk(REAL_APP_SRC), 'D5 判据射程失效');
});
