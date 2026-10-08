#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// 🌊 KindredSouls 在线 Sweep 批测工具（读注册表唯一真源）
// ═══════════════════════════════════════════════════════════════════════════
// 由来：E19~E21 的 sweep harness 一直住在 /tmp（随归档一并清理 ⇒ 丢失），
//   E21 收官后按军师令把盘池**持久化**进仓（test/tools/sweep-matrix.json），
//   本工具即其消费端 —— 禁止再写一次性 /tmp 脚本。
//
// 用法：
//   node test/tools/sweep-online.mjs                  # 全 13 盘
//   node test/tools/sweep-online.mjs --only s13       # 单盘（快速回归）
//   node test/tools/sweep-online.mjs --only s2,s13
//   KS_BASE=https://kindredsouls.online node test/tools/sweep-online.mjs
//
// 环境变量（可选，缺失则跳过「库内落盘」核查）：
//   SUPABASE_URL / SUPABASE_SERVICE_KEY
//
// 🔴 历史踩坑（本工具已内建对应处置）：
//   1. `nocache:true` **只跳读不跳写**；写库到可见有延迟（≤90s）
//      ⇒ 先删同键行再 MISS，否则 `Prefer: resolution=ignore-duplicates`
//      会「静默忽略」新行 ⇒ 读到上一代际文本 ⇒ identical 假红。
//   2. `hit_attempts > 1` = 第 1 次 HIT 实为隐藏 MISS ⇒ 两代际文本必然不等的**最快指纹**。
//   3. 判据必须与生产**同源**：标签契约扫描直接抽取 server.js 的锁函数，
//      不另写一份正则（杜绝「归一漏了、CRITIC 也看不见」双盲）。
//
// 退出码：0 = 全绿；1 = 有盘 FAIL。
// ═══════════════════════════════════════════════════════════════════════════
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

import { SWEEP_MATRIX } from './sweep-matrix.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(__dirname, '..', '..');

const BASE = process.env.KS_BASE || 'https://kindredsouls.online';
const SB_URL = process.env.SUPABASE_URL || '';
const SB_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const HIT_RETRY = 4;          // HIT 未命中时的重试次数（等写库可见）
const HIT_RETRY_GAP_MS = 20000;

// ── CLI 解析 ──
const argv = process.argv.slice(2);
let only = null;
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--only' && argv[i + 1]) only = argv[i + 1].split(',').map((s) => s.trim());
}
const DISKS = only ? SWEEP_MATRIX.filter((d) => only.includes(d.id)) : SWEEP_MATRIX;

// ── 判据同源：从 server.js 抽取 E21 锁（标签契约扫描） ──
const SRC = readFileSync(path.join(REPO, 'server.js'), 'utf-8');
const SEEDS = ['stripHouseSemanticLabelMismatch', '_e21LabelAllowed', '_E21_HOUSE_LABEL_CONTRACT',
  '_E21_HOUSE_LABEL_RE', '_e21CountHouseLabelMismatch', 'fixHouseOrdinalSuffix', '_e23CountHouseOrdinalTypos'];
const { closureDecls } = await import(pathToFileURL(path.join(REPO, 'test/tools/extract_decls.mjs')));
const { map } = closureDecls(SRC, SEEDS);
const ctx = { console, __exports: {} };
vm.createContext(ctx);
const body = [...map.entries()].sort((a, b) => SRC.indexOf(a[1]) - SRC.indexOf(b[1])).map((e) => e[1]).join('\n\n');
vm.runInContext(body + '\n' + SEEDS.map((n) => `__exports[${JSON.stringify(n)}] = typeof ${n} !== 'undefined' ? ${n} : undefined;`).join('\n'), ctx);
const X = ctx.__exports;
if (typeof X._e21CountHouseLabelMismatch !== 'function') {
  console.error('❌ 未能从 server.js 抽取标签契约判据（切片失败）');
  process.exit(2);
}

// ── 工具函数 ──
// 🛡️ E24/R11r（2026-10-06 实测揪出）：**缓存键的 tz 必须与生产写入端同源规范化**。
//   病根：生产 `server.js:8629` 用 `resolveTimeZone(tz, lat, lon)` 取 `Intl canonical` 规范名入键，
//     而本工具原样拼 `d.tz` ⇒ 三盘 matrix 现代名与服务端 legacy 别名不一致 ⇒ **键不匹配**：
//       s4  fr `Asia/Kathmandu` → 生产键 `Asia/Katmandu`
//       s10 en `Asia/Kolkata`   → 生产键 `Asia/Calcutta`
//       s11 vi `Asia/Ho_Chi_Minh` → 生产键 `Asia/Saigon`
//   后果：① `preDeleteRow` 删不掉 ⇒ 复测时服务端直接 **HIT 旧产物**（「验旧不验新」假绿，覆盖率缺口）；
//         ② `dbLanded` 直查漏行 ⇒ 退化为「同一性反证」兜底（结论仍正确，但观测变窄）。
//   同源纪律：直接 import 生产同一函数（`src/tz-resolver.js`），**绝不另写一份归一**。
import { resolveTimeZone } from '../../src/tz-resolver.js';
const tzCanonicalOf = (d) => { const r = resolveTimeZone(d.tz, d.lat, d.lon); return r && r.ok ? r.tz : d.tz; };
const cacheKeyOf = (d) => `wealth:v536:${d.birth}:${d.time}:${d.lat}:${d.lon}:${tzCanonicalOf(d)}:${d.lang}:${d.reportType}`;

async function sbFetch(qs, opts = {}) {
  if (!SB_URL || !SB_KEY) return null;
  const res = await fetch(`${SB_URL}/rest/v1/ai_insights_cache${qs}`, {
    ...opts,
    headers: {
      apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json', ...(opts.headers || {}),
    },
  });
  return res;
}

async function preDeleteRow(d) {
  if (!SB_URL || !SB_KEY) return 'skip(no-creds)';
  const res = await sbFetch(`?cache_key=eq.${encodeURIComponent(cacheKeyOf(d))}`, { method: 'DELETE' });
  return res ? `HTTP ${res.status}` : 'skip';
}

async function readRow(d) {
  if (!SB_URL || !SB_KEY) return undefined;
  const res = await sbFetch(`?select=cache_key,insight&cache_key=eq.${encodeURIComponent(cacheKeyOf(d))}`);
  if (!res || !res.ok) return undefined;
  const rows = await res.json();
  return rows[0];
}

async function post(d) {
  const t0 = Date.now();
  const res = await fetch(`${BASE}/api/wealth-oracle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      birthDate: d.birth, birthTime: d.time, lat: Number(d.lat), lon: Number(d.lon),
      tz: d.tz, lang: d.lang, reportType: d.reportType, free_access: 1,
    }),
  });
  const ms = Date.now() - t0;
  const j = await res.json().catch(() => ({}));
  return { status: res.status, ms, text: j.report || j.data || '', cached: !!j.cached };
}

function structureCheck(text) {
  const chapters = (text.match(/^###\s+(Chapter|Capítulo|Chapitre|บทที่|Chương|第)\s*(I|II|III|IV|V|一|二|三|四|五)/gm) || []).length;
  const months = (text.match(/^###\s+/gm) || []).length;
  const finalOracle = /Final Wealth Oracle|最终财富神谕|ORÁCULO FINAL|Chapitre|บทสรุป/i.test(text);
  // ⚠️ artifact 口径（勿用 `★★`！五星评级 `★★★★☆` 是**合法**排版，曾在 E21 首跑被误判为 artifact）：
  //   只认「元话语 / 未渲染 token / 字面转义残留」三类。
  const artifacts = (text.match(/(^|[.!?]\s)Correction\s*[:：]|\[\/INST\]|\{\{|\}\}|\\n\\n\\n|<\/?s>|\[INST\]/gm) || []).length;
  return { chapters, monthHeads: months, finalOracle, artifacts };
}

// ── 🛡️ E23/R11q ②：E22 的「咨询性探针」**升格为硬判据** ──
//   E22 时期（v523 之前）两类形态在锁的**射程外**，故只报不拦；E23 已收网：
//     ① 分隔符式标签 ⇒ 并入 `stripHouseSemanticLabelMismatch` 第二遍 ⇒ 由 `labelMismatch`
//        （= 生产同源计数 `_e21CountHouseLabelMismatch`）覆盖，**不再单列探针**
//        （原探针用裸 THEMES 词表，会把合法月段标题 `8th House · The Month of Shared
//         Resources` 与星座宫位对 `, the Taurus 10th House` 误报 ⇒ 已废弃）；
//     ② 序数笔误 `2th House` ⇒ `fixHouseOrdinalSuffix` 确定性归一 ⇒ 残留即失败，
//        计数走生产同源的 `_e23CountHouseOrdinalTypos`（同一正则字面量）。

// 🛡️ E23/R11q ④（2026-10-06）：**孤立代理项**判据（原 `artifacts` 正则对此完全失明 ⇒ 本次逃逸成因）
//   后果：① 用户可见 `�`（emoji 被斩首）；② `JSON.stringify` 产出 `\udcNN` ⇒ PostgREST 400 PGRST102
//   ⇒ **写缓存静默失败 ⇒ 该盘永不命中**。根因 =「含星平面 emoji 的字符类正则缺 `u` 标志」
//   （非 `u` 下 `📜` 被拆成裸 `\uD83D`/`\uDCDC` 两个类成员 ⇒ 可单独吃掉半代理）。
//   判据自足（不依赖任何锁函数）：直接扫 UTF-16 码元配对完整性。
function countLoneSurrogates(t) {
  let n = 0;
  for (let i = 0; i < t.length; i++) {
    const c = t.charCodeAt(i);
    if (c >= 0xD800 && c <= 0xDBFF) { const x = t.charCodeAt(i + 1); if (!(x >= 0xDC00 && x <= 0xDFFF)) n++; }
    else if (c >= 0xDC00 && c <= 0xDFFF) { const p = t.charCodeAt(i - 1); if (!(p >= 0xD800 && p <= 0xDBFF)) n++; }
  }
  return n;
}

// ── 主流程 ──
const results = [];
console.log(`🌊 Sweep 在线批测（${DISKS.length} 盘）｜端点 ${BASE}\n`);

for (const d of DISKS) {
  const row = { id: d.id, lang: d.lang, name: d.name };
  try {
    row.predelete = await preDeleteRow(d);
    const miss = await post(d);
    row.missMs = Math.round(miss.ms / 1000);
    row.missLen = miss.text.length;
    row.missCached = miss.cached;

    // 库内落盘核查（等可见）
    let dbRow = await readRow(d);
    for (let i = 0; i < HIT_RETRY && !dbRow; i++) {
      await new Promise((r) => setTimeout(r, HIT_RETRY_GAP_MS));
      dbRow = await readRow(d);
    }
    row.dbRowFound = !!dbRow;   // 直查结果（受写库可见延迟影响 ⇒ 可能**假否**）
    row.dbLanded = !!dbRow;     // 终值在 HIT 之后按「同一性反证」修正（见下）

    // HIT 复现
    let hit = await post(d);
    let attempts = 1;
    while (hit.cached && hit.text === miss.text) break;
    while (!hit.cached && attempts < HIT_RETRY) {
      attempts++;
      await new Promise((r) => setTimeout(r, HIT_RETRY_GAP_MS));
      hit = await post(d);
    }
    row.hitMs = Math.round(hit.ms / 1000);
    row.hitCached = hit.cached;
    row.hitAttempts = attempts;
    row.identical = hit.text === miss.text;
    // 竞态指纹：attempts>1 ⇒ 第 1 次「HIT」实为隐藏 MISS，两代际必然不等
    row.raceSuspect = attempts > 1 && !row.identical;

    // 🛡️ 写库可见延迟（≤90s）会让上面的直查**假否**（E22 全量实测 3/13 盘踩中）。
    //   反证：若 HIT **命中缓存**（cached=Y）且与 MISS 响应**逐字相同**，则该文本必然已在库中
    //   —— 因为 MISS 侧 cached=false ⇒ 那段文本是**现场生成**的，不可能凭空被缓存命中。
    //   故以「同一性」反证落库，消除假红；反证不成立时仍以直查为准（**宁严不宽**，绝不掩盖真失败）。
    row.dbLanded = row.dbRowFound || (row.hitCached && row.identical);
    row.dbInferred = !row.dbRowFound && row.dbLanded;

    const st = structureCheck(miss.text);
    row.chapters = st.chapters;
    row.monthHeads = st.monthHeads;
    row.finalOracle = st.finalOracle;
    row.artifacts = st.artifacts;
    // 🛡️ E23/R11q ④：孤立代理项（半截 emoji）—— 0 才通过（见函数头注释）
    row.loneSurrogates = countLoneSurrogates(miss.text);

    // 标签契约（同源判据 —— 生效语种 en|es|vi，由 `_e21CountHouseLabelMismatch` 内部语言门控
    //   选形态；其余语种恒 0，与生产锁一致。⚠️ 锁射程扩到哪、判据就必须跟到哪 —— 漏一即假绿）
    row.labelMismatch = X._e21CountHouseLabelMismatch(miss.text, d.lang);
    // 🛡️ E23/R11q ②：序数笔误（同源判据）—— 归一后残留即失败
    row.ordinalTypos = X._e23CountHouseOrdinalTypos(miss.text);

    row.ok = row.missLen > 0 && row.dbLanded && row.identical && row.labelMismatch === 0
      && row.artifacts === 0 && row.ordinalTypos === 0 && row.loneSurrogates === 0;
  } catch (e) {
    row.error = e.message;
    row.ok = false;
  }
  results.push(row);
  const mark = row.ok ? 'PASS' : 'FAIL';
  console.log(`${mark}  ${row.id.padEnd(4)} ${String(row.lang).padEnd(3)} ${row.name}`);
  console.log(`      MISS ${row.missMs ?? '-'}s/${row.missLen ?? '-'}B  落库=${row.dbLanded ? 'Y' : 'N'}${row.dbInferred ? '(延迟反证)' : ''}`
    + `  HIT ${row.hitMs ?? '-'}s cached=${row.hitCached ? 'Y' : 'N'} identical=${row.identical ? 'Y' : 'N'}${row.hitAttempts > 1 ? ` ×${row.hitAttempts}` : ''}`
    + `  标签错配=${row.labelMismatch ?? '-'}  序数笔误=${row.ordinalTypos ?? '-'}  artifact=${row.artifacts ?? '-'}  孤立代理项=${row.loneSurrogates ?? '-'}`
    + (row.error ? `  ⚠️ ${row.error}` : ''));
}

const pass = results.filter((r) => r.ok).length;
console.log(`\n📊 结果：${pass}/${results.length} PASS`);
const fails = results.filter((r) => !r.ok);
if (fails.length) {
  console.log('❌ 未通过：' + fails.map((r) => r.id).join(', '));
  process.exit(1);
}
console.log('✅ 全绿');
