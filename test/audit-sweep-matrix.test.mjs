// ═══════════════════════════════════════════════════════════════════════════
// 🛡️ Sweep 基准盘矩阵闸门（13 盘防回归契约）
// ═══════════════════════════════════════════════════════════════════════════
// 立项：E21/R11o 收官后军师令 —— 「1993 盘收编为 s13，成为 13 盘 Sweep 终极防线，
//   加入防回归自动化测试链」。
//
// 本闸门是**零网络**的注册表完整性 + 真值新鲜度闸门：
//   · 结构：13 盘 / 编号 s1~s13 唯一 / 字段齐备 / 语言与边界覆盖达标
//   · 真值：对 13 盘**现场调用 astro/astro_matrix.py 实算**并与注册表逐盘比对
//           （判据同源 —— truth 由引擎生成，绝不允许手抄后漂移）
//   · 注入自测：扰动注册表真值 ⇒ 比较器**必红**（防「永不失败的空判据」）
//
// 在线批测（MISS/HIT + 缓存 + 标签契约扫描）另走 test/tools/sweep-online.mjs，
//   不进 test:astro（网络重、耗时分钟级）。
//
// ⚠️ 本闸门需要带 SwissEph 的 python3（裸 python3 无 swisseph ⇒ 引擎输出异常）：
//   export PATH="/Users/apple/.workbuddy/binaries/python/envs/default/bin:$PATH"
// ═══════════════════════════════════════════════════════════════════════════
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

import {
  SWEEP_MATRIX, SWEEP_META, SWEEP_EDGE_TAGS, SWEEP_LANGS, getDisk, sweepTruthDiff,
} from './tools/sweep-matrix.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(__dirname, '..');
const SRC = readFileSync(path.join(REPO, 'server.js'), 'utf-8');
const YEARLY_TEST = readFileSync(path.join(REPO, 'test/audit-yearly-stream.test.js'), 'utf-8');
const PURGE = readFileSync(path.join(REPO, 'scripts/purge-tz-poison-cache.mjs'), 'utf-8');

// ── 引擎现场实算（判据同源：真值唯一来源是引擎，不是本文件的手抄常量） ──
function engineTruth(disk) {
  const raw = execFileSync('python3', [
    'astro/astro_matrix.py', '--mode', 'natal',
    '--birth-date', disk.birth, '--birth-time', disk.time,
    '--lat', String(disk.lat), '--lon', String(disk.lon), '--tz', disk.tz,
  ], { cwd: REPO, encoding: 'utf8', env: process.env, maxBuffer: 8 * 1024 * 1024 });
  const j = JSON.parse(raw);
  const houses = {};
  for (const [p, v] of Object.entries(j.computed_houses || {})) houses[p] = { sign: v.sign, house: v.house };
  return { rising_sign: j.rising_sign, sun_sign: j.sun_sign, ascendant_deg: j.ascendant_deg, houses };
}

// ═══════════════════════════════════════════════════════════════════════════
test('① 结构级: 14 盘 / 编号 s1~s14 唯一 / 字段齐备 / 全为 yearly', () => {
  assert.equal(SWEEP_MATRIX.length, 14, `盘池须为 14 盘（s1~s14），实得 ${SWEEP_MATRIX.length}`);

  const ids = SWEEP_MATRIX.map((d) => d.id);
  assert.equal(new Set(ids).size, 14, '编号必须唯一');
  for (let i = 1; i <= 14; i++) {
    assert.ok(ids.includes(`s${i}`), `缺少编号 s${i}`);
  }

  const REQ = ['id', 'lang', 'name', 'edge', 'birth', 'time', 'lat', 'lon', 'tz', 'reportType', 'truth'];
  for (const d of SWEEP_MATRIX) {
    for (const k of REQ) {
      assert.ok(d[k] !== undefined && d[k] !== null && d[k] !== '', `${d.id} 缺字段 ${k}`);
    }
    assert.match(d.birth, /^\d{4}-\d{2}-\d{2}$/, `${d.id} birth 形态非法: ${d.birth}`);
    assert.match(d.time, /^\d{2}:\d{2}$/, `${d.id} time 形态非法: ${d.time}`);
    assert.ok(SWEEP_LANGS.includes(d.lang), `${d.id} 语种越界: ${d.lang}`);
    assert.equal(d.reportType, 'yearly', `${d.id} reportType 须为 yearly`);
    // 坐标必须是数值可解析（防止 "" / null 混入 ⇒ 引擎静默退化默认坐标）
    assert.ok(Number.isFinite(Number(d.lat)), `${d.id} lat 不可解析: ${d.lat}`);
    assert.ok(Number.isFinite(Number(d.lon)), `${d.id} lon 不可解析: ${d.lon}`);
  }

  assert.ok(SWEEP_META && SWEEP_META.purpose, '注册表 meta.purpose 缺失');
  assert.ok(String(SWEEP_META.generated_by).includes('regen-sweep-truth'),
    'meta 必须声明真值由 regen-sweep-truth.mjs（引擎）生成');
});

// ═══════════════════════════════════════════════════════════════════════════
test('② s13: 1993 阿德莱德语义标签错配样本 —— 参数与真值逐项锁定', () => {
  const s13 = getDisk('s13');
  assert.ok(s13, 's13 必须存在（E21/R11o 收编令）');

  assert.equal(s13.birth, '1993-12-15');
  assert.equal(s13.time, '08:15');
  assert.equal(String(s13.lat), '-34.9285');
  assert.equal(String(s13.lon), '138.6007');
  assert.equal(s13.tz, 'Australia/Adelaide');
  assert.equal(s13.lang, 'en');
  assert.equal(s13.reportType, 'yearly');

  const t = s13.truth;
  assert.equal(t.rising_sign, 'Capricorn', 's13 上升须为 Capricorn');
  assert.equal(t.sun_sign, 'Sagittarius');
  assert.ok(Math.abs(t.ascendant_deg - 292.6179) < 0.02, `s13 上升度须 ≈292.62°，实得 ${t.ascendant_deg}`);
  // 病根盘的真值：数字全对而标签乱贴 —— 真值本身是「数字侧的对照基准」
  assert.deepEqual(t.houses.Sun, { sign: 'Sagittarius', house: 12 }, 's13 本命太阳须 Sagittarius H12');
  assert.deepEqual(t.houses.Moon, { sign: 'Capricorn', house: 12 }, 's13 本命月亮须 Capricorn H12');
  assert.deepEqual(t.houses.Jupiter, { sign: 'Scorpio', house: 10 }, 's13 本命木星须 Scorpio H10');
  assert.deepEqual(t.houses.Saturn, { sign: 'Aquarius', house: 2 }, 's13 本命土星须 Aquarius H2');
  assert.deepEqual(t.houses.Pluto, { sign: 'Scorpio', house: 11 }, 's13 本命冥王星须 Scorpio H11');

  assert.ok(s13.note && s13.note.includes('House of Partnership'),
    's13 必须登记病根语料（12th House of Partnership）—— 它是 E21 的回归语料');
});

// ═══════════════════════════════════════════════════════════════════════════
test('③ s2/s13 双胞盘: 同坐标同时间、仅年份差 1（标签错配的对照设计）', () => {
  const s2 = getDisk('s2');
  const s13 = getDisk('s13');
  assert.equal(s2.lat, s13.lat, '双胞盘纬度须一致');
  assert.equal(s2.lon, s13.lon, '双胞盘经度须一致');
  assert.equal(s2.tz, s13.tz, '双胞盘时区须一致');
  assert.equal(s2.time, s13.time, '双胞盘出生时刻须一致');
  assert.equal(s2.lang, s13.lang, '双胞盘语种须一致');
  const y2 = Number(s2.birth.slice(0, 4));
  const y13 = Number(s13.birth.slice(0, 4));
  assert.equal(y13 - y2, 1, `双胞盘年份须差 1（s2=${y2} s13=${y13}）`);
  // 对照价值：同坐标同刻 ⇒ 宫位体系（Placidus 真实宫头）可比，暴露的是文本层而非天文层
  assert.equal(s2.truth.rising_sign, s13.truth.rising_sign, '双胞盘上升星座须一致（同坐标同刻）');
});

// ═══════════════════════════════════════════════════════════════════════════
test('④ 覆盖维度: 六语各 ≥2 盘 + 11 类边界全命中', () => {
  const langs = {};
  for (const d of SWEEP_MATRIX) langs[d.lang] = (langs[d.lang] || 0) + 1;
  for (const l of SWEEP_LANGS) {
    assert.ok((langs[l] || 0) >= 2, `语种 ${l} 须 ≥2 盘，实得 ${langs[l] || 0}`);
  }

  const edges = new Set(SWEEP_MATRIX.map((d) => d.edge));
  for (const tag of SWEEP_EDGE_TAGS) {
    assert.ok(edges.has(tag), `覆盖维度缺失：无任何盘声明 edge=${tag}`);
  }
  for (const e of edges) {
    assert.ok(SWEEP_EDGE_TAGS.includes(e), `未登记的 edge 标签: ${e}（须同步 SWEEP_EDGE_TAGS）`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
test('⑤ 真值新鲜度: 14 盘逐盘现场实算引擎并与注册表比对（判据同源）', () => {
  const bad = [];
  for (const d of SWEEP_MATRIX) {
    let eng;
    try {
      eng = engineTruth(d);
    } catch (e) {
      assert.fail(`引擎调用失败（${d.id}）：${e.message}\n`
        + '⚠️ 若为 swisseph 缺失，请带 python 环境 PATH 重跑：\n'
        + '   export PATH="/Users/apple/.workbuddy/binaries/python/envs/default/bin:$PATH"');
    }
    const diffs = sweepTruthDiff(d.truth, eng);
    if (diffs.length) bad.push(`${d.id}: ${diffs.join(' | ')}`);
  }
  assert.equal(bad.length, 0,
    `注册表真值已过期/手抄漂移，跑 node test/tools/regen-sweep-truth.mjs 重算：\n  ${bad.join('\n  ')}`);
});

// ═══════════════════════════════════════════════════════════════════════════
test('⑥ 注入自测: 扰动注册表真值 ⇒ 比较器必红（判据非空转）', () => {
  // 基线：同一份真值自比必须无差异（否则「恒红」也是坏的）
  for (const d of SWEEP_MATRIX) {
    assert.equal(sweepTruthDiff(d.truth, d.truth).length, 0, `${d.id} 自比必须无差异`);
  }

  for (const d of SWEEP_MATRIX) {
    // (a) 宫位扰动 1 宫
    const shiftHouse = JSON.parse(JSON.stringify(d.truth));
    shiftHouse.houses.Sun.house = (shiftHouse.houses.Sun.house % 12) + 1;
    assert.ok(sweepTruthDiff(shiftHouse, d.truth).length > 0,
      `${d.id}: 宫位扰动未被检出 ⇒ 宫位判据空转`);

    // (b) 星座扰动（换成另一个星座名）
    const shiftSign = JSON.parse(JSON.stringify(d.truth));
    shiftSign.houses.Moon.sign = shiftSign.houses.Moon.sign === 'Aries' ? 'Taurus' : 'Aries';
    assert.ok(sweepTruthDiff(shiftSign, d.truth).length > 0,
      `${d.id}: 星座扰动未被检出 ⇒ 星座判据空转`);

    // (c) 上升扰动
    const shiftAsc = JSON.parse(JSON.stringify(d.truth));
    shiftAsc.rising_sign = shiftAsc.rising_sign === 'Aries' ? 'Taurus' : 'Aries';
    assert.ok(sweepTruthDiff(shiftAsc, d.truth).length > 0,
      `${d.id}: 上升扰动未被检出 ⇒ 上升判据空转`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
test('⑦ s13 已接入 E21 契约锁（病根语料 → 治法同源，防「收编了却不设防」）', () => {
  // 契约表与锁体必须在 server.js 中存在（s13 的病灶正是它们的靶心）
  assert.ok(SRC.includes('_E21_HOUSE_LABEL_CONTRACT'), 'server.js 缺 _E21_HOUSE_LABEL_CONTRACT 契约表');
  const lockDef = SRC.match(/function stripHouseSemanticLabelMismatch\s*\(/g) || [];
  assert.equal(lockDef.length, 1, `stripHouseSemanticLabelMismatch 须恰好定义 1 处，实得 ${lockDef.length}`);
  // 双链 × 双挂载（定义形态是 `function …(`，不含 `= ` ⇒ 本式只数调用点）：
  //   E21/R11o 前段挂载（E20 剪枝之后） + E22/R11p 链末收口（E19/R11m 真值锁之后）= 4 处
  const mounts = (SRC.match(/= stripHouseSemanticLabelMismatch\(/g) || []).length;
  assert.equal(mounts, 4, `锁须在非流式/流式两链各挂载 2 处（E21 前段 + E22 链末收口），实得 ${mounts}`);
  // CRITIC 判据14 存在
  assert.ok(SRC.includes('宫位语义标签错配'), 'CRITIC 判据14 未注入');
});

// ═══════════════════════════════════════════════════════════════════════════
test('⑧ 版本基线 v523 + 在线批测工具就位', () => {
  const sites = [...SRC.matchAll(/wealth:v532/g)].length;
  assert.equal(sites, 4, `4 个缓存站点须全部为 v523，实得 ${sites}`);
  assert.ok(!/wealth:v524/.test(SRC), 'server.js 内不得残留 v522 键');
  assert.match(YEARLY_TEST, /MIN_CACHE_VER = 532/, 'MIN_CACHE_VER 须为 523（纯数字形态，字符串映射覆盖不到，须单独补丁）');
  assert.ok(PURGE.includes("'wealth:v524:*'") && PURGE.includes("'wealth:v524-v2:*'"),
    'purge 须双形态回收 v522');

  assert.ok(existsSync(path.join(REPO, 'test/tools/sweep-online.mjs')),
    '在线批测工具 test/tools/sweep-online.mjs 缺失（注册表须可被批测消费）');
  assert.ok(existsSync(path.join(REPO, 'test/tools/regen-sweep-truth.mjs')),
    '真值重算工具 test/tools/regen-sweep-truth.mjs 缺失（唯一真源维护入口）');
});

// ═══════════════════════════════════════════════════════════════════════════
test('⑨ 注册表自足: 不依赖任何 /tmp 临时脚本（E21 教训：harness 随归档丢失）', () => {
  const raw = readFileSync(path.join(REPO, 'test/tools/sweep-matrix.json'), 'utf-8');
  assert.ok(!/\/tmp\//.test(raw), '注册表不得引用 /tmp 路径');
  const loader = readFileSync(path.join(REPO, 'test/tools/sweep-matrix.mjs'), 'utf-8');
  assert.ok(!/\/tmp\//.test(loader), '加载器不得引用 /tmp 路径');
  const runner = readFileSync(path.join(REPO, 'test/tools/sweep-online.mjs'), 'utf-8');
  assert.ok(!/\/tmp\/ks\d/.test(runner), '批测工具不得再指向历史 /tmp/ksNN 目录');
  assert.ok(/sweep-matrix\.mjs/.test(runner), '批测工具必须消费注册表（唯一真源）');
});

// ═══════════════════════════════════════════════════════════════════════════
test('⑩ 批测工具缓存键 tz 与生产同源规范化（E24 实测：3 盘 tz 现代名 ⇒ 键不匹配 ⇒ preDelete 失效 / 复测假绿）', async () => {
  const runner = readFileSync(path.join(REPO, 'test/tools/sweep-online.mjs'), 'utf-8');
  // ① 同源纪律：必须 import 生产同一函数，严禁另写一份归一（否则口径漂移再现）
  assert.ok(/from '\.\.\/\.\.\/src\/tz-resolver\.js'/.test(runner),
    'cacheKeyOf 必须同源引用 src/tz-resolver.js（勿另写归一，防口径漂移）');
  assert.ok(/resolveTimeZone\(\s*d\.tz\s*,\s*d\.lat\s*,\s*d\.lon\s*\)/.test(runner),
    'tz 规范化须调用 resolveTimeZone(d.tz, d.lat, d.lon)（与 server.js 缓存键同形参）');
  // ①b 有牙判据（回退**模板一处**即须复现缺陷 —— 只查「import/调用存在」属假防线）
  const keyLine = runner.split('\n').find((l) => l.includes('const cacheKeyOf'));
  assert.ok(keyLine && keyLine.includes('wealth:v532:'), 'cacheKeyOf 定义缺失/键前缀错');
  assert.ok(!/\$\{\s*d\.tz\s*\}/.test(keyLine),
    'cacheKeyOf 行内不得直接使用原样 `d.tz`（必须经同源规范化，否则 3 盘键不匹配）');
  assert.ok(/\$\{\s*tzCanonicalOf\(d\)\s*\}/.test(keyLine),
    'cacheKeyOf 的 tz 位必须取自同源规范化访问器 tzCanonicalOf(d)');
  // ② 行为自证 + 靶点在位：三盘现代名与生产 Intl 别名确实不同（若已改用规范名 ⇒ 判据失效须更新）
  const { resolveTimeZone } = await import(pathToFileURL(path.join(REPO, 'src/tz-resolver.js')).href);
  const CASES = [
    ['Asia/Kolkata', '28.6139', '77.2090', 'Asia/Calcutta'],
    ['Asia/Kathmandu', '27.7172', '85.3240', 'Asia/Katmandu'],
    ['Asia/Ho_Chi_Minh', '21.0285', '105.8542', 'Asia/Saigon'],
  ];
  for (const [raw, la, lo, want] of CASES) {
    const r = resolveTimeZone(raw, la, lo);
    assert.ok(r && r.ok, `${raw} 规范化失败（tz-resolver 依赖异常 ⇒ 键必错）`);
    assert.equal(r.tz, want, `${raw} 应规范为 ${want}（若变化 ⇒ 生产键形态已改，工具须同步）`);
    assert.notEqual(r.tz, raw, `${raw} 未变化 ⇒ 本判据靶点失效（或注册表已改存规范名）`);
  }
  assert.ok(SWEEP_MATRIX.some((d) => resolveTimeZone(d.tz, d.lat, d.lon).tz !== d.tz),
    '注册表内至少须有一盘 tz 需规范化（靶点在位；否则本判据空转）');
});
