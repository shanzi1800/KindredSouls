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
  if (callSites !== 3) fails.push(`A2: deriveWealthBirthParams(window.location.search) 调用须恰 3 处（2 请求路径 + 1 渲染层灵宠入参），实为 ${callSites}`);

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
  if (clearCount !== 2) fails.push(`B2a: 认领后清屏 setSacredText('') 须恰 2 处，实为 ${clearCount}`);
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
