// ═══════════════════════════════════════════════════════════════════════
// 🛡️ E24⑥③(P1) 第三阶段收尾闸门
//   ① 双通道产物口径收敛 —— `applyWealthReportPromptGuards` 单一真源 + 缓存键同源
//   ② 小语种英文骨架标签本地化 —— fr/es/th/vi 的 `[Peak Revenue Window]` /
//      `[Financial Black Swan Day]` 一律换本地名（原实现**仅 zh**）
//   ③ 前端 time **值域**校验 —— `25:99` 类非法时辰拦截（原仅形态校验）
// 三档：结构级 / 行为级（vm 抽真实函数）/ 注入自测（逐个必须报红）。
// ═══════════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { closureDecls } from './tools/extract_decls.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf-8');
const webSrc = fs.readFileSync(path.join(ROOT, 'web/src/pages/WealthReportPage.tsx'), 'utf-8');
const coordSrc = fs.readFileSync(path.join(ROOT, 'web/src/lib/coord-parse.js'), 'utf-8');
const coordDts = fs.readFileSync(path.join(ROOT, 'web/src/lib/coord-parse.d.ts'), 'utf-8');
const purgeSrc = fs.readFileSync(path.join(ROOT, 'scripts/purge-tz-poison-cache.mjs'), 'utf-8');
const sweepSrc = fs.readFileSync(path.join(ROOT, 'test/tools/sweep-online.mjs'), 'utf-8');
const yearlyStreamSrc = fs.readFileSync(path.join(ROOT, 'test/audit-yearly-stream.test.js'), 'utf-8');
const linterSrc = fs.readFileSync(path.join(ROOT, 'test/audit-v492-monthly-house-linter.test.mjs'), 'utf-8');

// ══════════════════ 一、P1① 双通道 prompt 收敛（结构级） ══════════════════

// 🔴 判据口径：只数**缩进语句级调用点**（非流式/流式各一），
//   必须排除 `function applyWealthReportPromptGuards(...)` 定义行本身
//   （否则定义 + 2 调用 = 3，与 wealthPeriodCacheSince 同类陷阱）。见 D1/注入自测 15 同源。
const GUARD_CALL_RE = /^[ \t]+applyWealthReportPromptGuards\(\s*prompt\s*,\s*lang\s*,\s*reportType\s*,\s*astroMatrix\s*,\s*birthDate\s*\)/gm;
const countGuardCalls = (s) => [...s.matchAll(GUARD_CALL_RE)].length;

// 🔴 注释剥离器（单趟状态机，串内 `//`、`/*` 不误剥）：
//   供 C3 判「代码里已无旧 time 正则」时排除历史取证注释（注释嵌正则字面量 ≠ 代码残留）。
function stripComments(s) {
  let out = ''; let i = 0; const n = s.length; let mode = 'code';
  while (i < n) {
    const c = s[i]; const c2 = s[i + 1];
    if (mode === 'code') {
      if (c === '/' && c2 === '/') { mode = 'line'; i += 2; out += '  '; continue; }
      if (c === '/' && c2 === '*') { mode = 'block'; i += 2; out += '  '; continue; }
      if (c === "'") { mode = 'sq'; } else if (c === '"') { mode = 'dq'; } else if (c === '`') { mode = 'tpl'; }
      out += c; i++; continue;
    }
    if (mode === 'line') { if (c === '\n') { mode = 'code'; out += c; } else { out += ' '; } i++; continue; }
    if (mode === 'block') { if (c === '*' && c2 === '/') { mode = 'code'; i += 2; out += '  '; continue; } out += (c === '\n' ? '\n' : ' '); i++; continue; }
    // 字符串态：转义成对透传，闭合引号回落 code
    if (c === '\\') { out += c + (c2 || ''); i += 2; continue; }
    out += c; i++;
    if ((mode === 'sq' && c === "'") || (mode === 'dq' && c === '"') || (mode === 'tpl' && c === '`')) mode = 'code';
  }
  return out;
}
const webCode = stripComments(webSrc);

test('A1 共享守卫 applyWealthReportPromptGuards 必须存在（单一真源）', () => {
  assert.ok(/function\s+applyWealthReportPromptGuards\s*\(/.test(src), '缺少共享守卫函数');
});

test('A2 两端点各调用一次（非流式 + 流式），不多不少', () => {
  const calls = countGuardCalls(src);
  assert.strictEqual(calls, 2, `调用点应为 2（非流式/流式各一），实为 ${calls}`);
});

test('A3 守卫须含全部 6 段（脏字符/zh空间铁律/星体星座真值×2/镜头框架/月报语言包/占位符兜底）', () => {
  const at = src.indexOf('function applyWealthReportPromptGuards(');
  assert.ok(at > 0, '未找到守卫函数');
  const end = src.indexOf('\nfunction buildWealthReportPrompt(', at);
  const body = src.slice(at, end > 0 ? end : at + 9000);
  assert.ok(/prompt\.system\.replace\(\/\[\\u2026\]\/g, '\.\.\.'\)/.test(body), '缺 ① 脏字符清洗');
  assert.ok(body.includes("prompt.user.replace(/[\\u2026]/g, '...')"), '缺 ① user 侧脏字符清洗');
  assert.ok(body.includes('空间财富对齐硬性铁律'), '缺 ② zh 空间铁律');
  assert.ok(body.includes('星体星座真值铁律'), '缺 ③-zh 星体星座真值铁律');
  assert.ok(body.includes('PLANET-SIGN TRUTH RULE'), '缺 ③-en 星体星座真值铁律');
  assert.ok(body.includes('buildYearlyLensFrameworkBlock()'), '缺 ④ 逐月镜头框架');
  assert.ok(body.includes("SLIM_LANG_PACKS[lang] || SLIM_LANG_PACKS['zh']"), '缺 ⑤ 月报语言包');
  assert.ok(body.includes('replace(/__RISING_LOCAL__/g, rRising)'), '缺 ⑥ 年报占位符真值兜底');
});

test('A4 端点内不得再有**内联** prompt 注入（分叉回归防线）', () => {
  const markers = [
    '空间财富对齐硬性铁律',
    'PLANET-SIGN TRUTH RULE',
    "SLIM_LANG_PACKS[lang] || SLIM_LANG_PACKS['zh']",
  ];
  for (const mk of markers) {
    const n = src.split(mk).length - 1;
    assert.strictEqual(n, 1, `\`${mk}\` 出现 ${n} 次（应仅 1 次，且在共享守卫内）—— 端点内联注入回归`);
  }
});

test('A5 缓存键四站点同源：3 生产键骨架一致 + v2 为 -v2 形态 + 删键时间字段与写入端同源', () => {
  const keys = [...src.matchAll(/`wealth:v538[^`]*`/g)].map((m) => m[0]);
  assert.strictEqual(keys.length, 4, `应为 4 站点，实为 ${keys.length}`);
  const v2 = keys.filter((k) => k.includes('v538-v2'));
  assert.strictEqual(v2.length, 1, 'v2 站点形态异常');
  const prod = keys.filter((k) => !k.includes('v538-v2'));
  assert.strictEqual(prod.length, 3, '生产站点数异常');
  const shape = prod.map((k) => k.replace(/\$\{[^}]*\}/g, '#'));
  const uniq = [...new Set(shape)];
  assert.strictEqual(uniq.length, 1, '生产键骨架必须一致，实得:\n  ' + uniq.join('\n  '));
  assert.ok(!/\$\{birthDate\}:\$\{birthTime\}:/.test(src), 'clear-cache 仍用裸 birthTime（与写入端 _ckTime 分叉）');
  assert.ok(/\$\{birthDate\}:\$\{_ckTimeDel\}:/.test(src), 'clear-cache 未使用同源时间字段 _ckTimeDel');
});

// ══════════════════ 二、行为级：vm 抽真实函数 ══════════════════

const SEEDS = ['normalizeYearlyMarkup'];
const { map } = closureDecls(src, SEEDS, ['getSignToHouseMap', 'SIGN_ORDER_ZH']);
const dropped = [];
for (const n of [...map.keys()]) {
  try { new vm.Script(map.get(n)); } catch { dropped.push(n); map.delete(n); }
}
assert.strictEqual(dropped.length, 0, `VM 抽取的声明有语法不完整项: ${dropped.join(', ')}`);
assert.ok(map.has('normalizeYearlyMarkup'), 'VM 未能抽取 normalizeYearlyMarkup');

function build(hack) {
  const ctx = { console, setTimeout, clearTimeout, setInterval, clearInterval, Buffer, process, __exports: {} };
  vm.createContext(ctx);
  const bodySrc = [...map.entries()]
    .sort((a, b) => src.indexOf(a[1]) - src.indexOf(b[1]))
    .map((e) => (hack && hack[e[0]] ? hack[e[0]] : e[1]))
    .join('\n\n');
  vm.runInContext(
    bodySrc + '\n' + SEEDS.map((n) => `__exports[${JSON.stringify(n)}] = typeof ${n} !== 'undefined' ? ${n} : undefined;`).join('\n'),
    ctx,
  );
  return ctx.__exports;
}
const F = build();
const ny = (t, lang, rt) => F.normalizeYearlyMarkup(t, lang, rt || 'yearly');

test('B1 小语种卡标签本地化：fr/es/th/vi 均不留英文骨架标签', () => {
  const cases = [
    ['fr', 'Fenêtre de Revenu Sommet', 'Jour du Cygne Noir Financier'],
    ['es', 'Ventana de Éxito y Pico de Ingresos', 'Día del Cisne Negro Financiero'],
    ['th', 'ช่วงเวลาทองคำเปิดคลังทรัพย์', 'วันวิกฤตตัดกระแสเงิน'],
    ['vi', 'Cửa Sổ Vàng Tăng Trưởng Tài Lộc', 'Ngày Thiên Nga Đen Nguy Cơ Sụt Giảm'],
  ];
  for (const [lang, peak, swan] of cases) {
    const out = ny('🟢 [Peak Revenue Window]: 5-10\n🔴 [Financial Black Swan Day]: 18', lang);
    assert.ok(!/Peak\s+Revenue\s+Window/i.test(out), `${lang}: 英文标签残留 → ${JSON.stringify(out)}`);
    assert.ok(!/Financial\s+Black\s+Swan\s+Day/i.test(out), `${lang}: 英文标签残留 → ${JSON.stringify(out)}`);
    assert.ok(out.includes('[' + peak + ']'), `${lang}: 未替换为本地名 ${peak} → ${JSON.stringify(out)}`);
    assert.ok(out.includes('[' + swan + ']'), `${lang}: 未替换为本地名 ${swan} → ${JSON.stringify(out)}`);
  }
});

test('B2 zh 行为不回退（与 V480 判据等价）', () => {
  assert.ok(ny('**🟢 [Peak Revenue Window]**：**9月14日**', 'zh').includes('[财富高峰窗口]'));
  assert.ok(ny('**🔴 [Financial Black Swan Day]**：**9月1日**', 'zh').includes('[财务黑天鹅日]'));
});

test('B3 en 不得被替换（英文即原生语言）', () => {
  const out = ny('🟢 [Peak Revenue Window]: July 5\n🔴 [Financial Black Swan Day]: July 18', 'en');
  assert.ok(out.includes('[Peak Revenue Window]'), 'en 被误译');
  assert.ok(out.includes('[Financial Black Swan Day]'), 'en 被误译');
});

test('B4 幂等 + 不误伤圆括号补充形态', () => {
  const t = '🟢 [Fenêtre de Revenu Sommet (Peak Revenue Window)] : 5-10 juillet';
  const once = ny(t, 'fr');
  assert.strictEqual(ny(once, 'fr'), once, '非幂等');
  assert.ok(once.includes('(Peak Revenue Window)'), '误伤圆括号补充形态（应只吃纯方括号整段）');
});

test('B5 月报/非法 reportType 零影响（护栏）', () => {
  const t = '🟢 [Peak Revenue Window]';
  assert.strictEqual(F.normalizeYearlyMarkup(t, 'fr', 'monthly'), t, '月报被污染');
  assert.strictEqual(F.normalizeYearlyMarkup(t, 'fr', undefined), t, 'reportType 缺失时被污染');
});

// ══════════════════ 三、P1③ 前端 time 值域 ══════════════════

const isvStart = coordSrc.indexOf('export function isValidBirthTime(');
assert.ok(isvStart > 0, 'coord-parse 缺少 isValidBirthTime');
const isvBody = coordSrc.slice(isvStart, coordSrc.indexOf('\n}', isvStart) + 2).replace('export ', '');
const isValidBirthTime = new Function(isvBody + '\nreturn isValidBirthTime;')();

test('C1 isValidBirthTime 必须导出（两处调用点唯一真源）', () => {
  assert.ok(/export function isValidBirthTime\(/.test(coordSrc), 'coord-parse.js 缺少导出的 isValidBirthTime');
  // 🔴 双文件契约同步：tsc 解析的是 .d.ts（非 .js）⇒ 漏声明会直接 `tsc -b` 构建红
  assert.ok(/export declare function isValidBirthTime\(/.test(coordDts), 'coord-parse.d.ts 未同步声明 isValidBirthTime（tsc -b 将构建失败）');
});

test('C2 time 值域矩阵：合法必放行、非法必拦截', () => {
  const ok = ['00:00', '23:59', '9:05', '09:05', '12:00', '0:00'];
  const bad = ['25:99', '24:00', '23:60', '12:60', '99:00', '-1:00', '12:5', '12:005', '', ' 12:00', '12:00 ', 'abc', '12:00:00'];
  for (const t of ok) assert.strictEqual(isValidBirthTime(t), true, `应放行 ${JSON.stringify(t)}`);
  for (const t of bad) assert.strictEqual(isValidBirthTime(t), false, `应拦截 ${JSON.stringify(t)}`);
  for (const v of [null, undefined, 123, {}, []]) {
    assert.strictEqual(isValidBirthTime(v), false, `应拦截非字符串 ${JSON.stringify(v)}`);
  }
});

test('C3 前端两处调用点均改用同源纯函数（旧正则已清除）', () => {
  assert.ok(webSrc.includes("import { resolveCoordinates, isValidBirthTime } from '../lib/coord-parse'"), '未导入 isValidBirthTime');
  const calls = [...webSrc.matchAll(/isValidBirthTime\(/g)].length;
  assert.ok(calls >= 2, `调用点应 ≥2（derive + mount），实为 ${calls}`);
  // 只在**去注释后的代码**里判旧正则：历史取证注释嵌正则字面量不算残留（防误红）
  assert.ok(!/\/\^\\d\{1,2\}:\\d\{2\}\$\//.test(webCode), '仍残留旧 time 正则（25:99 可过）');
});

// ══════════════════ 四、bump 完整性（v538） ══════════════════

test('D1 bump v538：4 站点 + purge 双形态回收 v537 + 各基线前移 + 无 v537 残留', () => {
  assert.strictEqual([...src.matchAll(/wealth:v538/g)].length, 4, 'server.js 4 站点须全为 v538');
  assert.ok(purgeSrc.includes("'wealth:v537:*'"), 'purge 未回收 v535');
  assert.ok(purgeSrc.includes("'wealth:v537-v2:*'"), 'purge 未回收 v535-v2');
  assert.ok(sweepSrc.includes('wealth:v538:${d.birth}'), 'sweep-online cacheKeyOf 未前移');
  assert.ok(yearlyStreamSrc.includes('MIN_CACHE_VER = 538'), 'MIN_CACHE_VER 未前移');
  assert.ok(linterSrc.includes("LATEST_CACHE_VER = 'v538'"), 'LATEST_CACHE_VER 未前移');
  assert.ok(!/wealth:v537/.test(src), 'server.js 仍有 wealth:v537 残留');
});

// ══════════════════ 五、注入缺陷自测（证明判据有区分力） ══════════════════

test('【注入自测】摘掉非流式端点守卫调用 → A2 必须红', () => {
  const degraded = src.replace(/\n\s*applyWealthReportPromptGuards\(prompt, lang, reportType, astroMatrix, birthDate\);/, '\n');
  assert.notStrictEqual(degraded, src, '注入锚点失配');
  assert.strictEqual(countGuardCalls(degraded), 1, '闸门失效: 摘掉一处调用未被 A2 判据识别');
});

test('【注入自测】清空标签映射表 → B1 必须红', () => {
  const fnSrc = map.get('normalizeYearlyMarkup');
  const degraded = fnSrc.replace(/const _V480_TAG_MAP = \{[\s\S]*?\n  \};/, 'const _V480_TAG_MAP = {};');
  assert.notStrictEqual(degraded, fnSrc, '注入锚点失配（映射表形态已变）');
  const G = build({ normalizeYearlyMarkup: degraded });
  const out = G.normalizeYearlyMarkup('[Peak Revenue Window]', 'fr', 'yearly');
  assert.ok(out.includes('Peak Revenue Window'), '闸门失效: 映射表清空未被 B1 判据识别');
});

test('【注入自测】把 en 纳入映射表 → B3 必须红', () => {
  const fnSrc = map.get('normalizeYearlyMarkup');
  const degraded = fnSrc.replace(
    /const _V480_TAG_MAP = \{\n    zh:/,
    "const _V480_TAG_MAP = {\n    en: [['Peak\\\\s+Revenue\\\\s+Window', 'XX'], ['Financial\\\\s+Black\\\\s+Swan\\\\s+Day', 'YY']],\n    zh:",
  );
  assert.notStrictEqual(degraded, fnSrc, '注入锚点失配（映射表首键已变）');
  const G = build({ normalizeYearlyMarkup: degraded });
  const out = G.normalizeYearlyMarkup('[Peak Revenue Window]', 'en', 'yearly');
  assert.ok(!out.includes('Peak Revenue Window'), '闸门失效: en 被误译未被 B3 判据识别');
});

test('【注入自测】摘掉 .d.ts 声明 → C1 必须红', () => {
  const degraded = coordDts.replace(/export declare function isValidBirthTime\([^)]*\)[^;]*;/, '');
  assert.notStrictEqual(degraded, coordDts, '注入锚点失配');
  assert.ok(!/export declare function isValidBirthTime\(/.test(degraded), '闸门失效: .d.ts 声明摘除未被 C1 判据识别');
});

test('【注入自测】放宽值域上界 → C2 必须红', () => {
  // 锚点取整条 return 断言：同时放宽时/分上界，让 `25:99` 由拦变放
  //（⚠️ 只放宽 `h <= 23` 不够 —— `99` 分位仍被分钟上界拦下，探针须与注入射程对齐）
  const bad = isvBody.replace('h >= 0 && h <= 23 && mi >= 0 && mi <= 59', 'h >= 0 && mi >= 0');
  assert.notStrictEqual(bad, isvBody, '注入锚点失配');
  const f = new Function(bad + '\nreturn isValidBirthTime;')();
  assert.strictEqual(f('25:99'), true, '闸门失效: 值域上界放宽未被 C2 判据识别');
});

test('【注入自测】v538 回退 v537 → D1 必须红', () => {
  const degraded = src.replace(/wealth:v538/g, 'wealth:v537');
  assert.notStrictEqual(degraded, src, '注入未生效');
  assert.notStrictEqual([...degraded.matchAll(/wealth:v538/g)].length, 4, '闸门失效: 版本回退未被 D1 判据识别');
});
