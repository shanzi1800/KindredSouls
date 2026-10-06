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
  '_E21_HOUSE_LABEL_RE', '_e21CountHouseLabelMismatch'];
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
const cacheKeyOf = (d) => `wealth:v523:${d.birth}:${d.time}:${d.lat}:${d.lon}:${d.tz}:${d.lang}:${d.reportType}`;

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

// ── 咨询性探针（E22 候选：现锁**射程外**的标签形态，只报不拦） ──
//   ① 逗号/冒号/破折号式标签：`2nd House, Roots, and Family` / `8th House: Your Career Depth`
//      —— E21 正则要求字面 ` of ` ⇒ 天然漏网（宁漏不改的代价，需实证后再定）。
//   ② 序数笔误：`2th House` / `11st House`（拼写式序数锁 E13 只管**拼写式**，不管数字+错后缀）。
function advisoryProbes(text) {
  const THEMES = /\b(Roots|Partnership|Marriage|Enemies|Family|Home|Career|Wealth|Transformation|Subconscious|Identity|Resources|Self|Gains|Networks|Expansion|Creativity|Work|Communication|Legacy|Assets|Income|Vitality|Karma|Unseen|Intimacy|Debt)\b/;
  let delimLabels = 0;
  for (const m of text.matchAll(/\b(\d{1,2})(?:st|nd|rd|th)\s+Houses?\s*[,:：—–·-]\s*[^.\n*]{2,50}/g)) {
    if (THEMES.test(m[0])) delimLabels++;
  }
  let ordinalTypos = 0;
  for (const m of text.matchAll(/\b\d+(?:st|nd|rd|th)\b/g)) {
    const d = Number(m[0].replace(/\D/g, ''));
    const suf = m[0].replace(/^\d+/, '');
    const want = (d % 10 === 1 && d % 100 !== 11) ? 'st' : (d % 10 === 2 && d % 100 !== 12) ? 'nd'
      : (d % 10 === 3 && d % 100 !== 13) ? 'rd' : 'th';
    if (suf !== want) ordinalTypos++;
  }
  return { delimLabels, ordinalTypos };
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
    row.dbLanded = !!dbRow;

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

    const st = structureCheck(miss.text);
    row.chapters = st.chapters;
    row.monthHeads = st.monthHeads;
    row.finalOracle = st.finalOracle;
    row.artifacts = st.artifacts;
    const adv = advisoryProbes(miss.text);
    row.delimLabels = adv.delimLabels;      // 咨询性：E21 射程外的分隔符式标签
    row.ordinalTypos = adv.ordinalTypos;    // 咨询性：数字+错后缀

    // 标签契约（同源判据）
    row.labelMismatch = X._e21CountHouseLabelMismatch(miss.text, d.lang);

    row.ok = row.missLen > 0 && row.dbLanded && row.identical && row.labelMismatch === 0 && row.artifacts === 0;
  } catch (e) {
    row.error = e.message;
    row.ok = false;
  }
  results.push(row);
  const mark = row.ok ? 'PASS' : 'FAIL';
  console.log(`${mark}  ${row.id.padEnd(4)} ${String(row.lang).padEnd(3)} ${row.name}`);
  console.log(`      MISS ${row.missMs ?? '-'}s/${row.missLen ?? '-'}B  落库=${row.dbLanded ? 'Y' : 'N'}`
    + `  HIT ${row.hitMs ?? '-'}s cached=${row.hitCached ? 'Y' : 'N'} identical=${row.identical ? 'Y' : 'N'}`
    + `  标签错配=${row.labelMismatch ?? '-'}   artifact=${row.artifacts ?? '-'}`
    + (row.error ? `  ⚠️ ${row.error}` : ''));
  if (row.delimLabels || row.ordinalTypos) {
    console.log(`      ↳ 咨询性（E22 候选·当前射程外）：分隔符式标签 ${row.delimLabels} 处 / 序数笔误 ${row.ordinalTypos} 处`);
  }
}

const pass = results.filter((r) => r.ok).length;
console.log(`\n📊 结果：${pass}/${results.length} PASS`);
const fails = results.filter((r) => !r.ok);
if (fails.length) {
  console.log('❌ 未通过：' + fails.map((r) => r.id).join(', '));
  process.exit(1);
}
console.log('✅ 全绿');
