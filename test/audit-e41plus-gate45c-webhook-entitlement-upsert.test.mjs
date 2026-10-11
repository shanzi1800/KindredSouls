/**
 * Gate 45-C（E42+ 45-C）· webhook 权益落库健壮性 —— PostgREST「PATCH 0 行」陷阱根治
 *
 * 【战役背景】线上沙盘演习首曝 **P0 营收缺陷**：
 *   PostgREST 对**不存在的行**执行 PATCH 返回 **204「成功」但影响 0 行**（并非错误）。
 *   旧判据 `if (patchRes.ok)` 恒真 ⇒ **INSERT 兜底永不触发**
 *   ⇒ 无 `user_profiles` 行的用户付款后权益**静默丢失**（付了钱仍 402）。
 *   线上实测：`auth.users` 7 个 / `user_profiles` 仅 3 行（真实 signup 路径亦不建行）；
 *   沙盘支付 `granted:true`、webhook `received:true`，但权益未落库 ⇒ 402 不解除。
 *
 * 【治法】`Prefer: return=representation` 取回被更新行 ⇒ **以行数判成败** ⇒ 0 行走 INSERT 兜底。
 *
 * 【闸门纪律】
 *   · 禁词/计数扫描**只扫真值块**（剥注释后再扫）—— 本文件注释中出现旧写法字面量属说明性文字。
 *   · 注入反漂移：谓词主测与注入自测**同源取用**（防射程断层）。
 *   · 段位守备：下界 + 相对位置（禁精确段数）。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SERVER = readFileSync(join(ROOT, 'server.js'), 'utf8');
const PKG = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

/* ── 剥离注释（真值块）——「禁词扫描只扫真值块」铁律 ── */
const stripJs = (s) => s
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|[^:])\/\/[^\n]*/g, '$1');

/* ── webhook 段精确切片（到 save-result 路由为止，避免误纳后来者的 return=minimal）── */
const HOOK_START = SERVER.indexOf("app.post('/api/webhook'");
const HOOK_END = SERVER.indexOf('// ── /api/save-result ──', HOOK_START);
const HOOK = HOOK_START === -1 ? '' : SERVER.slice(HOOK_START, HOOK_END > 0 ? HOOK_END : HOOK_START + 9000);
const HOOK_CODE = stripJs(HOOK);

/* ═══════════ 谓词（主测与注入自测同源取用）═══════════ */
const representationCount = (src) => (stripJs(src).match(/return=representation/g) || []).length;
const hasLegacyMinimalOnWrite = (src) => /'Prefer':\s*'return=minimal'/.test(stripJs(src));
const hasSuccessByRowCount = (src) => /patchRes\.ok\s*&&\s*[\w.]+\.length\s*>\s*0/.test(stripJs(src));
const hasLegacyOkOnlyJudge = (src) => /if\s*\(\s*patchRes\.ok\s*\)\s*\{/.test(stripJs(src));
const hasInsertFallback = (src) => /method:\s*'POST'/.test(stripJs(src));
const hasPatchWrite = (src) => /method:\s*'PATCH'/.test(stripJs(src));
const hookIsSane = (src) => {
  const c = stripJs(src);
  return c.includes('metadata.supabase_user_id') && c.includes('buildPlanPayload(')
    && c.includes('paid_plans: updatedPlans') && c.includes('express.raw')
    && c.includes('Missing stripe-signature') && /if\s*\(\s*webhookSecret\s*\)/.test(c)
    && !/webhookSecret\s*&&\s*stripeSig/.test(c);
};

/* ═══════════ A 组：修复在位（源码级真值）═══════════ */

test('A1 PATCH 与 INSERT 均改用 Prefer: return=representation（取回受影响行）', () => {
  assert.ok(representationCount(HOOK) >= 2,
    `webhook 写入须≥2 处 return=representation（PATCH + INSERT），实得 ${representationCount(HOOK)}`);
});

test('A2 根除旧写法：webhook 写入路径不得再出现 return=minimal', () => {
  assert.ok(!hasLegacyMinimalOnWrite(HOOK),
    'webhook 写入仍用 return=minimal ⇒ 无从察觉「0 行受影响」⇒ INSERT 兜底永不触发（P0 回归）');
});

test('A3 成败判据必须并入「受影响行数 > 0」（不得仅凭 patchRes.ok）', () => {
  assert.ok(hasSuccessByRowCount(HOOK),
    'PATCH 成功判据缺「行数 > 0」⇒ PostgREST 0 行 PATCH 会被误判成功（本次缺陷根因）');
});

test('A4 INSERT 兜底仍在且为 POST（新用户首次落库唯一通路）', () => {
  assert.ok(hasPatchWrite(HOOK), 'PATCH 写入丢失（Gate 24g B1g / Gate45A D6 要素）');
  assert.ok(hasInsertFallback(HOOK), 'INSERT 兜底丢失（本缺陷下无 profile 行用户将永久拿不到权益）');
});

test('A5 封仓要素守恒 + 验签 fail-closed 形态未退化', () => {
  assert.ok(hookIsSane(HOOK), 'webhook 封仓要素或 fail-closed 验签形态被破坏');
});

test('A6 402 哨兵位点守恒（不得借本次修复松动权益闸门）', () => {
  const n402 = (SERVER.match(/ENTITLEMENT_REQUIRED/g) || []).length;
  assert.equal(n402, 4, `402 哨兵位点应为 4 处，实得 ${n402}`);
});

/* ═══════════ B 组：注入反漂移（复刻真实缺陷形态）═══════════ */

test('B1 注入：把 PATCH 的 return=representation 退化为 return=minimal ⇒ A1/A2 必红', () => {
  const clean = stripJs(HOOK);
  const broken = clean.replace(/'Prefer':\s*'return=representation'/, "'Prefer': 'return=minimal'");
  assert.notEqual(broken, clean, '注入锚点漂移（未命中 HOOK 段真值块内的 Prefer 字面量）');
  assert.ok(representationCount(broken) < 2, '注入后 representation 计数未下降 ⇒ A1 判据射程不全');
  assert.ok(hasLegacyMinimalOnWrite(broken), '注入后未检出 return=minimal ⇒ A2 判据射程不全');
});

test('B2 注入：把「行数判成败」退回 `patchRes.ok` 单判据 ⇒ A3 必红', () => {
  const clean = stripJs(HOOK);
  const broken = clean.replace(/patchRes\.ok\s*&&\s*_patchedRows\.length\s*>\s*0/, 'patchRes.ok');
  assert.notEqual(broken, clean, '注入锚点漂移（未命中行数判据表达式）');
  assert.ok(!hasSuccessByRowCount(broken), '注入后仍能检出「行数 > 0」⇒ A3 判据射程不全');
});

test('B3 注入：摘掉 INSERT 兜底（POST）⇒ A4 必红', () => {
  const clean = stripJs(HOOK);
  const broken = clean.replace(/method:\s*'POST'/, "method: 'POST_DISABLED'");
  assert.notEqual(broken, clean, '注入锚点漂移（未命中 HOOK 段真值块内的 POST 字面量）');
  assert.ok(!hasInsertFallback(broken), '注入后仍检出 POST 兜底 ⇒ A4 判据射程不全');
});

/* ═══════════ C 组：段位守备（下界 + 相对位置）═══════════ */

test('C1 段位守备：下界 ≥46 且收口位仍居 len-2（禁精确段数）', () => {
  const segs = PKG.scripts['test:astro'].split('&&').map((s) => s.trim());
  assert.ok(segs.length >= 46, `test:astro 段数下界应 ≥46，实得 ${segs.length}`);
  const iCap = segs.findIndex((s) => s.includes('audit-e40-compat-synastry-tensor-fusion'));
  assert.equal(iCap, segs.length - 2, 'e40-compat 收口位漂移（应紧邻 python 段，居 len-2）');
  const iG45C = segs.findIndex((s) => s.includes('audit-e41plus-gate45c-webhook-entitlement-upsert'));
  assert.ok(iG45C !== -1 && iG45C < iCap, 'Gate45C 未入编或未置于收口位之前');
  assert.ok(segs[segs.length - 1].startsWith('python3 '), '链尾必须仍为 python 段');
});
