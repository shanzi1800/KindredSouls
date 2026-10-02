#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *  V491 前端健壮性与错误响应对齐 —— 验收闸门（离线预研版）
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 *  用途
 *    在「前端 12 条链接 UI 复查窗口」期间**离线**准备好 V491 的验收判据，
 *    窗口一关即可把本文件复制进 `web/test/` 接入 `test:report` 链，立刻开跑。
 *
 *  部署方式（复查结束后执行）
 *    1) cp <本文件> <repo>/web/test/audit-v491-frontend-error-handling.test.mjs
 *    2) 在 <repo>/web/package.json 的 "test:report" 链插入本文件名
 *    3) cd <repo>/web && npm run test:report
 *
 *  ⚠️ 本文件位于**仓库之外**（`KindredSouls开发工作日志/V491闸门准备/`），
 *     以保证 `git status` 绝对干净 —— 这是军师钦定的纪律（不改 src/ 与 web/src/）。
 *
 *  ⚠️ 预期结果说明（很重要，别误读）
 *    · **现在（修复前）跑**：主判据应**大量失败** —— 这正是"待修复清单"，
 *      同时也是判据**灵敏度**的天然证据（源码当前就是缺陷态）。
 *    · **V491 修复后跑**：主判据应**全部通过**。
 *    · 「灵敏度自检」这一组**无论何时都必须全绿** —— 它用**合成片段**验证每条判据
 *      能正确区分「符合」与「不符合」（防恒真/恒假探针，V488c 教训）。
 *
 *  设计纪律（继承 V490 / V490b 的踩坑教训）
 *    ① 判据一律**位置式或语义锚点**，禁止写死行号（行号会漂移 ⇒ 假红）；
 *    ② 判据抽取成纯函数，**供主判据与灵敏度自检共用同一口径**；
 *    ③ 行为类判据优先于静态文本判据（能跑就别只 grep）；
 *    ④ 判据须留重构余量（用下界而非精确值），避免"合理重构被误判为回归"。
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// ── 路径配置 ─────────────────────────────────────────────────────────────────
const REPO = process.env.V491_REPO
  || '/Users/apple/Desktop/KindredSouls开发工作日志/KindredSouls源代码';
const TSX_PATH = process.env.V491_TSX
  || path.join(REPO, 'web/src/pages/WealthReportPage.tsx');
const COORD_MODULE = path.join(REPO, 'web/src/lib/coord-parse.js');
const LOCALES_DIR = path.join(REPO, 'web/src/i18n/locales');
const LANGS = ['zh', 'en', 'es', 'fr', 'th', 'vi'];

const SRC = fs.readFileSync(TSX_PATH, 'utf8');

// V491 新增的 i18n key（WP-4 / WP-6 / WP-7 共同产出，待注入 6 语言）
const V491_I18N_KEYS = [
  'wealthReport.errInvalidCoordinates', // F4/F7：坐标非法（后端 400 透传）
  'wealthReport.errInvalidTimezone',    // F4/F7：时区非法（后端 400 透传）
  'wealthReport.errInvalidBirthTime',   // F2：出生时间格式无法解析
  'wealthReport.errTimezoneAdjusted',   // F3：时区已按坐标推定
];

// ═════════════════════════════════════════════════════════════════════════════
//  通用工具
// ═════════════════════════════════════════════════════════════════════════════

const ANCHOR_STREAM = '/api/wealth-oracle/stream';

/** 取出 [fromAnchor, toAnchor) 之间的源码片段；任一锚点缺失则返回 null */
function sliceBetween(src, fromAnchor, toAnchor) {
  const i = src.indexOf(fromAnchor);
  if (i === -1) return null;
  const j = src.indexOf(toAnchor, i);
  if (j === -1) return null;
  return { i, j, seg: src.slice(i, j) };
}

/** 位置式：needleA 必须出现在 anchor 之后且**早于** needleB */
function orderedAfter(src, anchor, a, b) {
  const i = src.indexOf(anchor);
  if (i === -1) return false;
  const ia = src.indexOf(a, i);
  if (ia === -1) return false;
  const ib = src.indexOf(b, i);
  if (ib === -1) return false;
  return ia < ib;
}

/** 提取所有 `_memKey = \`...\`` 的模板串内容 */
function extractMemKeys(src) {
  return [...src.matchAll(/_memKey\s*=\s*`([^`]*)`/g)].map(m => m[1]);
}

// ═════════════════════════════════════════════════════════════════════════════
//  判据表（每条含 pos / neg 合成片段，用于灵敏度自检）
// ═════════════════════════════════════════════════════════════════════════════

const GATES = [
  // ── WP-1 · F4 流式响应健壮化 ────────────────────────────────────────────
  {
    id: 'G01', wp: 'WP-1', defect: 'F4',
    name: '流式 fetch 之后、getReader 之前必须存在 `!res.ok` 判断',
    fn: s => orderedAfter(s, ANCHOR_STREAM, '!res.ok', 'getReader'),
    pos: `const res = await fetch('/api/wealth-oracle/stream',{method:'POST'});\nif (!res.ok) { return; }\nconst reader = res.body?.getReader();`,
    neg: `const res = await fetch('/api/wealth-oracle/stream',{method:'POST'});\nconst reader = res.body?.getReader();\nif (!res.ok) {}`,
  },
  {
    id: 'G02', wp: 'WP-1', defect: 'F4',
    name: '流式错误分支内必须解析 JSON 错误体（`.json(`）',
    fn: s => { const w = sliceBetween(s, ANCHOR_STREAM, 'getReader'); return !!w && w.seg.includes('.json('); },
    pos: `fetch('/api/wealth-oracle/stream');\nif (!res.ok) { const j = await res.json(); const code = j.code; return; }\nconst r = res.body.getReader();`,
    neg: `fetch('/api/wealth-oracle/stream');\nif (!res.ok) { setError('网络开小差'); return; }\nconst r = res.body.getReader();`,
  },
  {
    id: 'G03', wp: 'WP-1', defect: 'F4',
    name: '流式错误分支必须 `return`（不得落入 fallback 白跑一次请求）',
    fn: s => { const w = sliceBetween(s, ANCHOR_STREAM, 'getReader'); return !!w && /!\s*res\.ok[\s\S]*?\breturn\b/.test(w.seg); },
    pos: `fetch('/api/wealth-oracle/stream');\nif (!res.ok) { setError('x'); setLoading(false); return; }\nconst r = res.body.getReader();`,
    neg: `fetch('/api/wealth-oracle/stream');\nif (!res.ok) { setError('x'); setLoading(false); }\nconst r = res.body.getReader();`,
  },

  // ── WP-4 · F7 错误码承接 ────────────────────────────────────────────────
  {
    id: 'G04', wp: 'WP-4', defect: 'F7',
    name: '源码必须引用后端错误码 `INVALID_COORDINATES`',
    fn: s => s.includes('INVALID_COORDINATES'),
    pos: `const MAP = { INVALID_COORDINATES: 'wealthReport.errInvalidCoordinates' };`,
    neg: `const MAP = { INVALID_COORD: 'wealthReport.errInvalidCoordinates' };`,
  },
  {
    id: 'G05', wp: 'WP-4', defect: 'F7',
    name: '源码必须引用后端错误码 `INVALID_TIMEZONE`',
    fn: s => s.includes('INVALID_TIMEZONE'),
    pos: `const MAP = { INVALID_TIMEZONE: 'wealthReport.errInvalidTimezone' };`,
    neg: `const MAP = { INVALID_TZ: 'wealthReport.errInvalidTimezone' };`,
  },

  // ── WP-5 · F6 缓存键补全维度 ────────────────────────────────────────────
  {
    id: 'G06', wp: 'WP-5', defect: 'F6',
    name: '`_memKey` 模板串必须含 lat / lon / tz 维度（**两处**都要改）',
    fn: s => {
      const keys = extractMemKeys(s);
      if (keys.length < 2) return false;
      return keys.every(k => /lat/i.test(k) && /lon/i.test(k) && /tz/i.test(k));
    },
    pos: 'const _memKey = `${_stableBirth}_${_stableTime}_${_stableLat}_${_stableLon}_${_stableTz}_${_stableLang}_monthly`;\n'
       + 'const _memKey = `${_stableBirth}_${_stableTime}_${_stableLat}_${_stableLon}_${_stableTz}_${_stableLang}_${type}`;',
    neg: 'const _memKey = `${_stableBirth}_${_stableLang}_monthly`;\n'
       + 'const _memKey = `${_stableBirth}_${_stableLang}_${type}`;',
  },
  {
    id: 'G07', wp: 'WP-5', defect: 'F6',
    name: '`_memKey` 必须**保留** birth / lang 旧维度（防补维度时误删）',
    fn: s => {
      const keys = extractMemKeys(s);
      if (keys.length < 2) return false;
      return keys.every(k => /birth/i.test(k) && /lang/i.test(k));
    },
    pos: 'const _memKey = `${_stableBirth}_${_stableLang}_${_stableLat}_monthly`;\n'
       + 'const _memKey = `${_stableBirth}_${_stableLang}_${_stableLat}_${type}`;',
    neg: 'const _memKey = `${_stableLat}_${_stableLon}_monthly`;\n'
       + 'const _memKey = `${_stableLat}_${_stableLon}_${type}`;',
  },
  {
    id: 'G08', wp: 'WP-5', defect: 'F6',
    name: '去重语义未被破坏：`_reportMemCache` / `_reportGen` 读写点数量不减少',
    fn: s => {
      const count = (re) => (s.match(re) || []).length;
      return count(/_reportMemCache\.get\(/g) >= 2
          && count(/_reportMemCache\.set\(/g) >= 2
          && count(/_reportGen\.get\(/g) >= 4
          && count(/_reportGen\.set\(/g) >= 1;
    },
    pos: '_reportMemCache.get(k);_reportMemCache.get(k);_reportMemCache.set(k,v);_reportMemCache.set(k,v);'
       + '_reportGen.get(k);_reportGen.get(k);_reportGen.get(k);_reportGen.get(k);_reportGen.set(k,v);',
    neg: 'const x = 1;',
  },

  // ── WP-3 · F5 非流式错误承接 ────────────────────────────────────────────
  {
    id: 'G09', wp: 'WP-3', defect: 'F5',
    name: '源码须存在错误码读取（`.code`）至少 2 处 —— 覆盖流式与非流式两条路径',
    fn: s => (s.match(/[A-Za-z_$][\w$]*\??\.code\b/g) || []).length >= 2,
    pos: `const code = errData?.code; const code2 = j.code;`,
    neg: `const code = 0;`,
  },

  // ── WP-6 · F2 time 解析 ─────────────────────────────────────────────────
  {
    id: 'G10', wp: 'WP-6', defect: 'F2',
    name: 'time 解析失败必须有显式处理（else 分支 / 提示），不得静默保留 12:00',
    fn: s => {
      const i = s.indexOf('/^\\d{1,2}:\\d{2}$/');
      if (i === -1) return false;
      const seg = s.slice(i, i + 420);
      return /\belse\b/.test(seg) || /setError|notify|console\.warn/.test(seg);
    },
    pos: `if (timeParam && /^\\d{1,2}:\\d{2}$/.test(timeParam)) { setBirthTime(timeParam); } else if (timeParam) { setError(t('wealthReport.errInvalidBirthTime')); }`,
    neg: `if (timeParam && /^\\d{1,2}:\\d{2}$/.test(timeParam)) { setBirthTime(timeParam); }`,
  },

  // ── WP-7 · F3 tz 处理 ───────────────────────────────────────────────────
  {
    id: 'G11', wp: 'WP-7', defect: 'F3',
    name: 'tz 赋值后必须有校验或提示（else / 校验 / 提示调用）',
    fn: s => {
      const i = s.indexOf('setBirthTz(tzParam)');
      if (i === -1) return false;
      const seg = s.slice(i, i + 320);
      return /\belse\b|setError|console\.warn|Intl\.DateTimeFormat/.test(seg);
    },
    pos: `if (tzParam) { setBirthTz(tzParam); } else { console.warn('tz missing'); }`,
    neg: `if (tzParam) setBirthTz(tzParam);\nconst urlParams = new URLSearchParams(window.location.search);`,
  },

  // ── WP-8 · F8 / F9 卫生项 ───────────────────────────────────────────────
  {
    id: 'G12', wp: 'WP-8', defect: 'F8',
    name: 'localStorage 死代码（removeItem 后紧跟 getItem）必须已清理',
    fn: s => !/removeItem\(cacheKey\)[\s\S]{0,140}getItem\(cacheKey\)/.test(s),
    pos: `const cacheKey = 'ks_x'; localStorage.removeItem(cacheKey);`,
    neg: `const cacheKey = 'ks_x'; localStorage.removeItem(cacheKey); const cached = localStorage.getItem(cacheKey); if (cached) { use(cached); }`,
  },
  {
    id: 'G13', wp: 'WP-8', defect: 'F9',
    name: '`free_access` 必须精确匹配（禁用 `search.includes(...)` 宽松写法）',
    fn: s => !/\.search\.includes\(\s*['"]free_access=1['"]\s*\)/.test(s),
    pos: `const isFree = new URLSearchParams(window.location.search).get('free_access') === '1';`,
    neg: `const isFree = window.location.search.includes('free_access=1');`,
  },
];

// ═════════════════════════════════════════════════════════════════════════════
//  ① 灵敏度自检（无论源码是否修复，都必须全绿）
//     证明每条判据能正确区分「符合」与「不符合」——防恒真 / 恒假探针
// ═════════════════════════════════════════════════════════════════════════════

test('【灵敏度自检】每条判据都能区分正例与负例（防恒真/恒假探针）', () => {
  const problems = [];
  for (const g of GATES) {
    const posOk = g.fn(g.pos);
    const negOk = g.fn(g.neg);
    if (!posOk) problems.push(`${g.id} 正例被判为不符合（判据过严 / 写错）`);
    if (negOk) problems.push(`${g.id} 负例被判为符合（判据无区分力 / 恒真）`);
  }
  assert.deepEqual(problems, [], `灵敏度自检失败：\n  - ${problems.join('\n  - ')}`);
});

// ═════════════════════════════════════════════════════════════════════════════
//  ② 源码静态判据（主判据）—— 现在应大量失败，V491 修复后应全绿
// ═════════════════════════════════════════════════════════════════════════════

for (const g of GATES) {
  test(`【${g.wp} / ${g.defect}】${g.id} ${g.name}`, () => {
    assert.ok(
      g.fn(SRC),
      `${g.id} 未满足：${g.name}\n`
      + `  （源码：${path.relative(REPO, TSX_PATH)}）`,
    );
  });
}

// ═════════════════════════════════════════════════════════════════════════════
//  ③ WP-2 · 坐标解析的行为判据（F1b）
//     修复方案要求把坐标解析抽为 `web/src/lib/coord-parse.js`（纯函数、可测），
//     与后端 `src/coord-validator.js` 形成对称架构 —— 行为验证 > 静态文本验证。
//     ⚠️ Tier-0（完全未提供）**不算错误**，必须与后端 V490b 契约一致。
// ═════════════════════════════════════════════════════════════════════════════

let coordMod = null;
let coordLoadErr = null;
try {
  coordMod = await import(pathToFileURL(COORD_MODULE).href);
} catch (e) {
  coordLoadErr = e;
}

test('【WP-2 / F1b】G14 坐标解析模块存在且导出 resolveCoordinates（可测）', () => {
  assert.ok(
    !coordLoadErr,
    `模块未就绪：${path.relative(REPO, COORD_MODULE)}\n  原因：${coordLoadErr && coordLoadErr.message}\n`
    + '  ⇒ WP-2 要求把坐标解析抽为纯函数模块（与后端 coord-validator.js 对称）',
  );
  assert.equal(typeof coordMod.resolveCoordinates, 'function', '必须导出 resolveCoordinates 函数');
});

/** 模块行为判据的公共执行器：模块缺失时直接失败并给出可读原因 */
function callResolve(lat, lon) {
  assert.ok(!coordLoadErr, `坐标模块不可用：${coordLoadErr && coordLoadErr.message}`);
  assert.equal(typeof coordMod.resolveCoordinates, 'function', 'resolveCoordinates 必须是函数');
  return coordMod.resolveCoordinates(lat, lon);
}

test('【WP-2 / F1b】G15 Tier-0：坐标**完全未提供** ⇒ 取默认值，且**不算错误**', () => {
  const r = callResolve(undefined, undefined);
  assert.equal(r.ok, true, 'Tier-0 必须放行（历史 API 契约，不是错误）');
  assert.equal(r.lat, 13.75, '默认纬度应为 13.75');
  assert.equal(r.lon, 100.5, '默认经度应为 100.5');
});

test('【WP-2 / F1b】G16 Tier-3：不可解析（`abc`）⇒ 必须拒绝，**严禁静默退曼谷**', () => {
  const r = callResolve('abc', 100.5);
  assert.equal(r.ok, false, "'abc' 必须被拒绝（旧行为 = 静默保留 13.75/100.5 ⇒ 出错误地点的盘）");
});

test('【WP-2 / F1b】G17 Tier-3：`null` 必须被拒绝（不得被 Number(null)===0 洗白）', () => {
  const r = callResolve(null, 100.5);
  assert.equal(r.ok, false, 'null 必须拒绝（否则 Number(null)===0 会洗成合法坐标）');
});

test('【WP-2 / F1b】G18 Tier-2：`lat=91` 越界 ⇒ 必须拒绝', () => {
  const r = callResolve(91, 100.5);
  assert.equal(r.ok, false, 'lat 91 超出 [-90,90]，必须拒绝');
});

test('【WP-2 / F1b】G19 Tier-2：`lon=-181` 越界 ⇒ 必须拒绝', () => {
  const r = callResolve(13.75, -181);
  assert.equal(r.ok, false, 'lon -181 超出 [-180,180]，必须拒绝');
});

test('【WP-2 / F1b】G20 边界值 `lat=0` ⇒ 必须**接受为 0**，不得被 falsy 吞成默认', () => {
  const r = callResolve(0, 6.6131);
  assert.equal(r.ok, true, 'lat=0 是合法值（样本 5 圣多美），不得误拒');
  assert.equal(r.lat, 0, 'lat 必须严格等于 0，不得被替换为 13.75');
});

test('【WP-2 / F1b】G21 半缺（只给 lat）⇒ 必须拒绝（对齐后端 missing_partner）', () => {
  const r = callResolve(13.75, undefined);
  assert.equal(r.ok, false, '只给一侧必须拒绝，绝不拿默认值悄悄补另一半');
});

// ═════════════════════════════════════════════════════════════════════════════
//  ④ WP-4 · i18n 文案齐全（6 语言）
// ═════════════════════════════════════════════════════════════════════════════

function readLocaleFlat(lang) {
  const p = path.join(LOCALES_DIR, `${lang}.json`);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function hasNestedKey(obj, dotted) {
  let cur = obj;
  for (const part of dotted.split('.')) {
    if (cur === null || typeof cur !== 'object' || !(part in cur)) return false;
    cur = cur[part];
  }
  return typeof cur === 'string' && cur.length > 0;
}

test('【WP-4 / F7】G22 V491 新增错误文案必须在 6 语言中齐全', () => {
  const missing = [];
  for (const lang of LANGS) {
    const loc = readLocaleFlat(lang);
    if (!loc) { missing.push(`${lang}.json 不存在或不可解析`); continue; }
    for (const key of V491_I18N_KEYS) {
      if (!hasNestedKey(loc, key)) missing.push(`${lang}: 缺 ${key}`);
    }
  }
  assert.deepEqual(missing, [], `i18n 缺失（构建会被 check-i18n-keys.mjs 拦下）：\n  - ${missing.join('\n  - ')}`);
});

// ═════════════════════════════════════════════════════════════════════════════
//  ⑤ 汇总（测试跑完后打印，便于人工快速判读）
// ═════════════════════════════════════════════════════════════════════════════

process.on('beforeExit', () => {
  const failed = GATES.filter(g => !g.fn(SRC));
  console.log('\n' + '═'.repeat(78));
  console.log('  V491 闸门汇总（离线预研版）');
  console.log('═'.repeat(78));
  console.log(`  静态判据：${GATES.length - failed.length} / ${GATES.length} 通过`);
  if (failed.length) {
    console.log('  待修复清单：');
    for (const g of failed) console.log(`    ✗ ${g.id}  ${g.wp}/${g.defect}  ${g.name}`);
  } else {
    console.log('  ✓ 全部静态判据通过');
  }
  console.log(`  坐标行为判据：模块 ${coordLoadErr ? '未就绪（WP-2 待实施）' : '已就绪'}`);
  console.log('═'.repeat(78) + '\n');
});
