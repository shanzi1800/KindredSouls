// ═══════════════════════════════════════════════════════════════════════════
// 🛡️ E22/R11p 闸门：宫位语义标签契约锁「链末收口」
// ═══════════════════════════════════════════════════════════════════════════
// 背景（2026-10-06，E21/R11o 收编 s13 首跑捕获的 P0）：
//   E19/R11m 的**链末真值锁** `_v432LockLeadingNatal` 会把「本命行星真值」误绑到**同句流年子句**
//   的宫号上 —— 例：`… your Jupiter in Scorpio … in your 7th House of Partnership`（natal 木星=H10）
//   ⇒ 数字 7 被改写为 10、而标签 `Partnership` **原地不动** ⇒ 造出 `10th House of Partnership`。
//   E21 锁挂在真值锁**之前** ⇒ 该后置错配无下游清洗、直达落库（c14 有牙但重试稿同样过链末锁）。
//   治法（军师裁定 方案①·最小改动）：在所有清理/真值收口**之后**把同一把标签契约锁再施加一次。
//   本闸门锁定该「链末收口」的**位置不变式** —— 一旦有人把它挪回真值锁之前 / 删掉，
//   病态形态会立刻复发，此处必须当场变红。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO = path.join(__dirname, '..');
const SRC = readFileSync(path.join(REPO, 'server.js'), 'utf-8');
const PURGE = readFileSync(path.join(REPO, 'scripts/purge-tz-poison-cache.mjs'), 'utf-8');
const YEARLY_TEST = readFileSync(path.join(REPO, 'test/audit-yearly-stream.test.js'), 'utf-8');

// ── 挂载点字面量 ──
// E22 挂载与 E21 挂载**共用同一行文本** ⇒ 必须靠「链段内计数 + 相对位置」区分，不可用 indexOf 取首现。
const NS = 'reportContent = stripHouseSemanticLabelMismatch(reportContent, lang, reportType);';
const ST = 'cleanedText = stripHouseSemanticLabelMismatch(cleanedText, lang, reportType);';
// 链末真值锁（E19/R11m）——⚠️ 非流式必须用**带 if(yearly) 包裹**的字面量：裸调用在链中段另有一处。
const FIN_NS = "if (reportType === 'yearly') {\n          reportContent = _v432LockLeadingNatal(reportContent, lang, astroMatrix, reportType);\n        }";
const FIN_ST = "if (reportType === 'yearly') cleanedText = _v432LockLeadingNatal(cleanedText, lang, astroMatrix, reportType);";
// 链末段右边界（真值锁之后的第一条语句；两条链各自唯一）
const END_NS = 'reportContent = injectHighLatitudeNotice(reportContent, astroMatrix, lang);';
const END_ST = "if (reportType === 'monthly') cleanedText = fixMoonHouseParens(cleanedText);";

// 链末段判定：`[finAnchor, endAnchor)` 段内**恰好一次**挂载，且挂载起点在锚点之后
function chainEndOk(src, finAnchor, endAnchor, mount) {
  const i = src.indexOf(finAnchor);
  if (i < 0) return false;
  const j = src.indexOf(endAnchor, i);
  if (j < 0 || j <= i) return false;
  const seg = src.slice(i, j);
  const at = seg.indexOf(mount);
  return at >= finAnchor.length && seg.split(mount).length - 1 === 1;
}
const okNS = (s) => chainEndOk(s, FIN_NS, END_NS, NS);
const okST = (s) => chainEndOk(s, FIN_ST, END_ST, ST);

// 摘除某条链的链末挂载（供注入自测）
function dropChainEndMount(src, finAnchor, endAnchor, mount) {
  const i = src.indexOf(finAnchor);
  const j = src.indexOf(endAnchor, i);
  const k = src.slice(i, j).lastIndexOf(mount);
  if (i < 0 || j < 0 || k < 0) return src;
  const abs = i + k;
  return src.slice(0, abs) + src.slice(abs + mount.length);
}

// ── vm 同源抽取（与 e21 闸门同手法：复刻生产锁本体，判据才可信） ──
const SEEDS = ['stripHouseSemanticLabelMismatch', '_e21LabelAllowed', '_E21_HOUSE_LABEL_CONTRACT',
  '_E21_HOUSE_LABEL_RE', '_e21CountHouseLabelMismatch'];
const { closureDecls } = await import(pathToFileURL(path.join(REPO, 'test/tools/extract_decls.mjs')));
const { map } = closureDecls(SRC, SEEDS);
for (const n of SEEDS) assert.ok(map.has(n), `vm 切片缺符号 ${n}（extract_decls 抽取失准）`);
const ctx = { console, __exports: {} };
vm.createContext(ctx);
const body = [...map.entries()].sort((a, b) => SRC.indexOf(a[1]) - SRC.indexOf(b[1])).map((e) => e[1]).join('\n\n');
vm.runInContext(body + '\n' + SEEDS.map((n) => `__exports[${JSON.stringify(n)}] = typeof ${n} !== 'undefined' ? ${n} : undefined;`).join('\n'), ctx);
const X = ctx.__exports;
const S = (t, lang, rt) => X.stripHouseSemanticLabelMismatch(t, lang || 'en', rt || 'yearly');

// s13 实测病态句（链末真值锁误绑产物：natal 木星 H10 的真值被绑到 Partnership 句的宫号上）
const S13_BAD = 'Your Jupiter in Scorpio expands your reach in the 10th House of Partnership.';
const S13_GOOD = 'Your Jupiter in Scorpio expands your reach in the 10th House of Career and Public Standing.';

test('① 结构级: 链末收口挂载（两条写链均在 E19/R11m 真值锁之后）+ 三重注入自测', () => {
  assert.ok(okNS(SRC), '非流式链末缺标签契约锁收口（或位置不在链末真值锁之后）');
  assert.ok(okST(SRC), '流式链末缺标签契约锁收口（或位置不在链末真值锁之后）');
  // 全仓共 4 处调用：E21 前段 ×2 + E22 链末 ×2
  const mounts = (SRC.match(/= stripHouseSemanticLabelMismatch\(/g) || []).length;
  assert.equal(mounts, 4, `挂载须为 4 处（两链 × [E21 前段 + E22 链末]），实得 ${mounts}`);

  // 注入自测 A：摘除非流式链末挂载 ⇒ 必红
  const injA = dropChainEndMount(SRC, FIN_NS, END_NS, NS);
  assert.notEqual(injA, SRC, '注入 A 未生效（非流式摘除失败）');
  assert.equal(okNS(injA), false, '注入自测失败: 摘除非流式链末挂载未被判红');

  // 注入自测 B：摘除流式链末挂载 ⇒ 必红
  const injB = dropChainEndMount(SRC, FIN_ST, END_ST, ST);
  assert.notEqual(injB, SRC, '注入 B 未生效（流式摘除失败）');
  assert.equal(okST(injB), false, '注入自测失败: 摘除流式链末挂载未被判红');
  assert.equal(okNS(injB), true, '注入自测 B 误伤非流式链（判据不独立）');

  // 注入自测 C：把挂载挪回真值锁**之前**（= 复刻 E21 时代旧形态）⇒ 必红
  const injC = dropChainEndMount(SRC, FIN_NS, END_NS, NS).replace(FIN_NS, NS + '\n        ' + FIN_NS);
  assert.notEqual(injC, SRC, '注入 C 未生效（挪位失败）');
  assert.equal(okNS(injC), false, '注入自测失败: 挂载挪回真值锁之前未被判红（顺序判据无区分力）');
});

test('② 行为级: s13 链末误绑产物必剪（保数字）+ 合法标签零误伤 + 幂等 + 语言守卫', () => {
  // 病态句（链末真值锁误绑产物）⇒ 剪 ` of Partnership`、**保宫号 10**
  const out = S(S13_BAD);
  assert.equal(out, 'Your Jupiter in Scorpio expands your reach in the 10th House.',
    's13 病态句未被链末收口剪枝');
  assert.ok(out.includes('10th House'), '宫号被误改（铁律：保数字、只剪标签）');
  assert.ok(!out.includes('of Partnership'), '错配标签残留');
  // 合法对照组：同一宫号的合规标签必须零误伤（防"剪狠了"）
  assert.equal(S(S13_GOOD), S13_GOOD, '合法 10 宫标签被误剪!');
  // 幂等：二次施加零变化（链末重跑哲学的前提）
  assert.equal(S(out), out, '二次施加非幂等（链末收口会反复改动文本）');
  // 语言守卫：仅 en（他语与中语零动作，宁漏不改，E14 教训）
  for (const lg of ['zh', 'es', 'fr', 'th', 'vi']) {
    assert.equal(S(S13_BAD, lg, 'yearly'), S13_BAD, `${lg} 不应改动（E22 仅覆盖 en）`);
  }
});

test('③ 同源零新逻辑: 复用 E21 同一把锁与同一契约表（不新增函数/常量/判据）', () => {
  const defs = SRC.match(/function stripHouseSemanticLabelMismatch\s*\(/g) || [];
  assert.equal(defs.length, 1, `E22 不得另起新函数（须复用 E21 锁体），实得定义 ${defs.length} 处`);
  const tbls = SRC.match(/const _E21_HOUSE_LABEL_CONTRACT\s*=/g) || [];
  assert.equal(tbls.length, 1, `契约表须唯一（判据同源纪律），实得 ${tbls.length} 处`);
  const c14 = SRC.match(/宫位语义标签错配/g) || [];
  assert.ok(c14.length >= 1, 'CRITIC 判据14 丢失（E22 依赖其与锁同源）');
});

test('④ s13 收编闭环: 病根语料在册且被本闸门覆盖（防「收编了却无防线」）', () => {
  const reg = JSON.parse(readFileSync(path.join(REPO, 'test/tools/sweep-matrix.json'), 'utf-8'));
  const s13 = (reg.disks || []).find((d) => d.id === 's13');
  assert.ok(s13, 'sweep 注册表缺 s13（E21 收编的基准盘）');
  assert.ok(/Partnership/.test(s13.note || ''), 's13 note 未登记病根语料（Partnership 错配）');
  assert.equal(s13.birth, '1993-12-15', 's13 应为 1993 盘');
  assert.ok(/Partnership/.test(S13_BAD), '闸门用例与 s13 病根语料同源（须含 Partnership 错配形态）');
});

test('⑤ v525 基线: server.js 4 站点 + 无 v524 残留 + purge 双形态回收 v524 + MIN_CACHE_VER=525 + 旧闸门前移', () => {
  const sites = [...SRC.matchAll(/wealth:v537/g)].length;
  assert.equal(sites, 4, `4 个缓存站点须全部为 v525, 实得 ${sites}`);
  assert.ok(!SRC.includes('wealth:v524'), 'server.js 内不得残留 v524 键');
  assert.ok(PURGE.includes("'wealth:v524:*'") && PURGE.includes("'wealth:v524-v2:*'"), 'purge 须双形态回收 v524');
  assert.ok(/MIN_CACHE_VER = 537/.test(YEARLY_TEST), 'yearly 流式闸门基线未前移至 525');
  // ⚠️ 纯数字形态（无 v 前缀）字符串映射覆盖不到 ⇒ 单独补丁（E20 实测 7 红，E22 复现同坑）
  assert.ok(!/MIN_CACHE_VER = 525/.test(YEARLY_TEST), 'MIN_CACHE_VER 纯数字形态仍停留在 524');
  // 旧闸门基线前移（须锁「站点计数正则」而非粗暴 includes：purge 回收项是合法字面量）
  // ⚠️ e17⑰ / e18⑩ / e21⑥ 体内**合法保留** `matchAll(/wealth:v525/g)` —— 它们正是拿它断言
  //    「被前移的闸门内不得出现旧基线」「供前移的旧基线须已移到 v524」；故这三个文件的
  //    v524 字面量**不得**当作残留误伤（老坑复现：E21 收编时同类粗暴 includes 曾误伤 purge 回收断言）。
  const OLD_BASE_KEEP = new Set(['audit-e17-r11j-yearly-axis-critic.test.mjs',
    'audit-e18-r11k-idempotent-lock.test.mjs', 'audit-e21-r11o-house-label-lock.test.mjs']);
  for (const f of ['audit-e10-r9-natal-coverage.test.mjs', 'audit-e11-r10-critic-precision.test.mjs',
    'audit-e12-r11-whole-report-lock.test.mjs', 'audit-e13-r11d-spelled-ordinals.test.mjs',
    'audit-e15-r11f-multilang-uncage.test.mjs', 'audit-e17-r11j-yearly-axis-critic.test.mjs',
    'audit-e18-r11k-idempotent-lock.test.mjs', 'audit-e20-r11n-element-coord-strip.test.mjs',
    'audit-e21-r11o-house-label-lock.test.mjs', 'audit-sweep-matrix.test.mjs']) {
    const t = readFileSync(path.join(__dirname, f), 'utf-8');
    assert.ok(t.includes('matchAll(/wealth:v537/g)'), `${f} 站点计数基线未前移至 v525`);
    // 共同不变式：任何闸门都不得再引用陈旧基线 v522（前移链断裂的硬指纹）
    assert.ok(!t.includes('matchAll(/wealth:v522/g)'), `${f} 前移链断裂：仍引用 v522 基线`);
    if (!OLD_BASE_KEEP.has(f)) {
      assert.ok(!t.includes('matchAll(/wealth:v525/g)'), `${f} 残留 v524 站点计数基线`);
    }
  }
  // e17⑰/e18⑩ 的 OLD_BASE 必须恰好前移到 v524（若仍停在 v521 ⇒ 前移链断了）
  for (const f of ['audit-e17-r11j-yearly-axis-critic.test.mjs', 'audit-e18-r11k-idempotent-lock.test.mjs']) {
    const t = readFileSync(path.join(__dirname, f), 'utf-8');
    assert.ok(t.includes("const OLD_BASE = 'matchAll(/wealth:v525/g)'"), `${f} 的 OLD_BASE 未前移至 v524`);
    assert.ok(!t.includes("const OLD_BASE = 'matchAll(/wealth:v521/g)'"), `${f} 的 OLD_BASE 仍停在 v521`);
  }
  const linter = readFileSync(path.join(__dirname, 'audit-v492-monthly-house-linter.test.mjs'), 'utf-8');
  assert.ok(linter.includes("LATEST_CACHE_VER = 'v537'"), 'v492 linter LATEST_CACHE_VER 未前移至 v524');
});
