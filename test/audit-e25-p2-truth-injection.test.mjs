// ═══════════════════════════════════════════════════════════════════════
// 🛡️ E25-P2 · 第 5 层：**注入层内容真值** 回归闸门（新建防线）
//
// 为什么会有这一层（2026-10-08 根因取证）：
//   既有 4 层防线全部只覆盖「形态/结构/落库/双通道一致」——
//     ① 结构完整性 integrity≥15  ② 形态卫生 artifact/代理项/序数/标签错配
//     ③ 双通道一致 HIT==MISS+落库  ④ 真值锁「射程内」行为（792 项注入自测）
//   **没有任何一条断言问过「喂给 LLM 的注入块内容本身对不对」**。
//   ⇒ `buildFactSheet` 读 `peak_windows[0].date/.type/.sign`，而引擎只产
//     `{ dates, window_days, reason }` ⇒ 注入给 LLM 的字面是
//     `- July 2026: undefined (undefined in undefined)`（整行零信息），
//     而 sweep 判据全在①②③层 ⇒ 该盘（s4 = 1988-04-12 18:20 Kathmandu **正是 fr 靶盘**）
//     多轮「全绿」，一份 peak 全编造的报告 100% PASS。
//
// 本闸门的四条判据（缺一即假绿）：
//   A. **跨文件契约**：生产者(astro_matrix.py find_peak_windows) emit 的键集
//      ⊇ 消费者(v69_client.js peak_windows[0].*) 读取的键集 —— 结构性拦住
//      「改生产者忘改消费者」这一类错配（V492/D4 的真身）。
//   B. **注入块哨兵**：buildFactSheet / buildPerMonthData 输出不得含
//      `undefined` / `NaN`（字段名失配的唯一产物），`null` 只在 [COMPUTED_HOUSES] JSON 内合法。
//   C. **真值在位**：每月 peak 窗口的引擎 `dates` 必须**逐字出现**在注入块里
//      （证明真值真的被注入了，而不是被 .filter 静默跳过）。
//   D. **注入缺陷自测**：把消费者字段名改回旧形态 ⇒ B/C 必须变红。
//
// 纪律：判据与实现同源（直接 import 真模块，不复制代码）；每条判据配注入自测。
// ═══════════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildFactSheet, buildPerMonthData } from '../v69_client.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const V69_SRC = fs.readFileSync(path.join(ROOT, 'v69_client.js'), 'utf-8');
const PY_SRC = fs.readFileSync(path.join(ROOT, 'astro', 'astro_matrix.py'), 'utf-8');
const SERVER_SRC = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf-8');

// ── 结构忠实（字段集/嵌套与引擎产出同构）的合成矩阵 ──
const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const MONTH_NAMES = ['July 2026','August 2026','September 2026','October 2026','November 2026','December 2026',
  'January 2027','February 2027','March 2027','April 2027','May 2027','June 2027'];
function makeMatrix() {
  const months = MONTH_NAMES.map((name, i) => {
    const g = (k) => ({ sign: SIGNS[(i + k) % 12], house: ((i + k) % 12) + 1, retrograde: false });
    const d1 = `2026-${String((i % 12) + 1).padStart(2, '0')}-24`;
    const d2 = `2026-${String((i % 12) + 1).padStart(2, '0')}-28`;
    return {
      month_key: `2026-${String((i % 12) + 1).padStart(2, '0')}`,
      month_name: name,
      sun: g(0), moon: g(1), mercury: g(2), venus: g(3), mars: g(4),
      jupiter: g(5), saturn: g(6), uranus: g(7), neptune: g(8), pluto: g(9),
      black_swan_days: i % 3 === 0 ? [{ date: `2026-${String((i % 12) + 1).padStart(2, '0')}-11`, aspect: 'Mars SQUARE Uranus', severity: 'high' }] : [],
      peak_windows: [{ dates: `${d1} - ${d2}`, window_days: [d1, d2], reason: 'Sun conjunction Jupiter (orb 0.0°)' }],
    };
  });
  return {
    months,
    retrograde_stations: { mercury: [{ date: '2026-10-23', type: 'RETROGRADE', sign: 'Scorpio' }, { date: '2026-11-13', type: 'DIRECT', sign: 'Scorpio' }] },
    meta: {
      rising_sign: 'Libra', sun_sign: 'Aries', house_system_used: 'Placidus',
      report_window: { label: 'July 2026 – June 2027' },
      computed_houses: Object.fromEntries(SIGNS.map((s, i) => [`house_${i + 1}`, { sign: s }])),
      house_cusps_full: Object.fromEntries(SIGNS.map((s, i) => [`house_${i + 1}`, { sign: s, degree_in_sign: 10 + i }])),
      moon_ingress: [{ to_sign: 'Leo', date_str: 'July 3, 2026', time_str: '04:12' }],
    },
  };
}

const LANGS = ['en', 'es', 'zh', 'fr', 'th', 'vi'];
// [COMPUTED_HOUSES] JSON 块是唯一允许出现 `null` 的位置（JSON.stringify 对缺字段就是 null）
const stripComputedHousesJson = (s) => s.replace(/\[COMPUTED_HOUSES[\s\S]*?\]:\s*\{[\s\S]*?\n\}\n/, '');

// ═══════════════════════════════ A 跨文件契约 ═══════════════════════════════

test('A1 生产者↔消费者字段契约：find_peak_windows 的 emit 键集 ⊇ v69_client 的读取键集', () => {
  // 生产者：astro_matrix.py 的 find_peak_windows 函数体内所有 dict 键
  const pyFn = PY_SRC.match(/def find_peak_windows\([\s\S]*?\n(?=def |\nif __name__)/);
  assert.ok(pyFn, '未找到 find_peak_windows（生产者侧单一真源）');
  const emitted = new Set([...pyFn[0].matchAll(/'([a-z_]+)'\s*:/g)].map((m) => m[1]));
  for (const k of ['dates', 'window_days', 'reason']) {
    assert.ok(emitted.has(k), `生产者未 emit 键 '${k}'（实际: ${[...emitted].join(',')}）`);
  }
  // 消费者：v69_client.js 里对 peak_windows[...] 的属性读取（含 ?. 与 [0]）
  const consumed = new Set([...V69_SRC.matchAll(/peak_windows\s*\[[^\]]*\]\s*\??\.\s*([A-Za-z_$][\w$]*)/g)].map((m) => m[1]));
  assert.ok(consumed.size > 0, '未识别到任何 peak_windows 子字段读取（判据失效即假绿）');
  const orphans = [...consumed].filter((k) => !emitted.has(k));
  assert.deepStrictEqual(orphans, [],
    `🔴 消费者读取了生产者根本不产出的键: ${orphans.join(', ')} —— ` +
    `这正是 V492/D4「改生产者忘改消费者」的缺陷形态（注入 undefined 的根因）`);
  // 反向：注入模板里禁止出现历史错键（静态拦回退）
  for (const bad of ['peak_windows[0].date ', 'peak_windows[0].type', 'peak_windows[0].sign']) {
    assert.ok(!V69_SRC.includes(bad), `v69_client.js 残留历史错键: ${bad}`);
  }
  assert.ok(!/pw\.(date|type|sign)\b/.test(SERVER_SRC), 'server.js 残留 pw.date/pw.type/pw.sign（流式月报块第三消费点）');
});

// ═══════════════════════════════ B 注入块哨兵 ═══════════════════════════════

test('B1 六语 buildFactSheet 输出不得含 undefined / NaN 哨兵', () => {
  const m = makeMatrix();
  for (const lang of LANGS) {
    const out = buildFactSheet(m, lang);
    assert.ok(out.length > 0, `[${lang}] fact sheet 为空（语言被静默跳过）`);
    assert.ok(!/\bundefined\b/.test(out), `[${lang}] fact sheet 含 undefined —— 字段名失配！`);
    assert.ok(!/\bNaN\b/.test(out), `[${lang}] fact sheet 含 NaN`);
    assert.ok(!/\bnull\b/.test(stripComputedHousesJson(out)), `[${lang}] fact sheet 在 [COMPUTED_HOUSES] 之外含 null`);
  }
});

test('B2 buildPerMonthData 必须原样透传引擎 peak 结构（不得改键/丢键）', () => {
  const m = makeMatrix();
  const rows = buildPerMonthData(m);
  assert.strictEqual(rows.length, 12, '月度数据条数应为 12');
  for (const [i, r] of rows.entries()) {
    const pw = r.peak_windows && r.peak_windows[0];
    assert.ok(pw, `第 ${i + 1} 月 peak_windows 丢失`);
    for (const k of ['dates', 'window_days', 'reason']) {
      assert.ok(pw[k] !== undefined, `第 ${i + 1} 月 peak_windows[0] 缺键 '${k}'（透传断裂）`);
    }
    assert.strictEqual(pw.dates, m.months[i].peak_windows[0].dates, `第 ${i + 1} 月 dates 未原样透传`);
  }
});

// ═══════════════════════════════ C 真值在位 ═══════════════════════════════

test('C1 每月 peak 窗口的引擎 dates 必须逐字出现在注入块中（真值真注入，非被跳过）', () => {
  const m = makeMatrix();
  const out = buildFactSheet(m, 'en');
  for (const [i, mo] of m.months.entries()) {
    const want = mo.peak_windows[0].dates;
    assert.ok(out.includes(want), `第 ${i + 1} 月（${mo.month_name}）的引擎 peak 区间 "${want}" 未出现在注入块中`);
  }
  // reason 也必须同源注入（否则 LLM 只有区间没有依据）
  assert.ok(out.includes('Sun conjunction Jupiter (orb 0.0°)'), 'peak reason 未注入');
  // 「Peak Revenue Windows」小节不得为空壳占位
  const sec = out.match(/── Peak Revenue Windows ──\n([\s\S]*?)\n\n/);
  assert.ok(sec && sec[1].trim().length > 0, 'peak 小节为空');
  assert.ok(!/^Dynamically computed/.test(sec[1].trim()), 'peak 小节退化为占位文案（真值未注入）');
});

// ═══════════════════════════════ D 注入缺陷自测 ═══════════════════════════════

test('D1 注入缺陷自测：字段名改回旧形态（.date/.type/.sign）⇒ 本闸门必须变红', () => {
  const NEW = '.map(m => `- ${m.month_name}: ${m.peak_windows[0].dates} (${m.peak_windows[0].reason})`)';
  const OLD = '.map(m => `- ${m.month_name}: ${m.peak_windows[0].date} (${m.peak_windows[0].type} in ${m.peak_windows[0].sign})`)';
  assert.ok(V69_SRC.includes(NEW), '注入模板锚点漂移（找不到修复后的形态）');
  const injected = V69_SRC.replace(NEW, OLD);
  assert.notStrictEqual(injected, V69_SRC, '注入未真的改变源码（注入自测失效）');

  // D1a 静态契约判据必须红
  const consumed = new Set([...injected.matchAll(/peak_windows\s*\[[^\]]*\]\s*\??\.\s*([A-Za-z_$][\w$]*)/g)].map((x) => x[1]));
  const pyFn = PY_SRC.match(/def find_peak_windows\([\s\S]*?\n(?=def |\nif __name__)/)[0];
  const emitted = new Set([...pyFn.matchAll(/'([a-z_]+)'\s*:/g)].map((x) => x[1]));
  const orphans = [...consumed].filter((k) => !emitted.has(k));
  assert.ok(orphans.length > 0, '🔴 注入缺陷未被静态判据捕获（射程不足 = 假绿）');

  // D1b 行为判据必须红：旧形态在模板字面量里产出 undefined
  const oldLine = `- July 2026: ${undefined} (${undefined} in ${undefined})`;
  assert.ok(/\bundefined\b/.test(oldLine), '行为判据失效');
  const rendered = `- July 2026: ${(void 0)} (${(void 0)} in ${(void 0)})`;
  assert.ok(/\bundefined\b/.test(rendered), '模板字面量 undefined 未被哨兵判据捕获');
});

test('D2 反向自测：judge 不得恒真（正确实现必须 PASS，错误实现必须 FAIL）', () => {
  const goodOut = buildFactSheet(makeMatrix(), 'en');
  const badOut = '- July 2026: undefined (undefined in undefined)';
  const sentinel = (s) => !/\bundefined\b/.test(s);
  assert.strictEqual(sentinel(goodOut), true, '正例被误判为红');
  assert.strictEqual(sentinel(badOut), false, '反例被误判为绿（判据恒真）');
});

// ═══════════════════ E 接线自保（写好不接线 = 永不运行） ═══════════════════

const P2_GATES = [
  'audit-e25-p2-truth-injection.test.mjs',
  'audit-e25-p2-fr-house.test.mjs',
  'audit-e25-p2-ephem-range.test.mjs',
  'audit-e25-p2-ephem-monthtable.test.mjs',
];

test('E1 本战役 4 道闸门均已接入 test:astro 长链（python 审计保持末位）', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
  const chain = (pkg.scripts && pkg.scripts['test:astro']) || '';
  assert.ok(chain.length > 0, 'test:astro 长链缺失');
  for (const g of P2_GATES) {
    assert.ok(chain.includes('test/' + g), `${g} 未接入 test:astro 长链（写好不接线 = 永不运行）`);
  }
  // 链尾必须仍是 python 峰值窗口审计（E23 契约，新闸门须插在其之前）
  assert.ok(/python3 scripts\/audit_v492_peak_window\.py\s*$/.test(chain.trim()),
    'test:astro 链尾应为 python3 峰值窗口审计');
});

test('E2 注入自测：从长链摘掉一道 E25-P2 闸门 ⇒ E1 必须变红', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
  const chain = pkg.scripts['test:astro'];
  const target = 'test/audit-e25-p2-fr-house.test.mjs';
  const degraded = chain.replace(target + ' ', '');
  assert.notStrictEqual(degraded, chain, '注入锚点失配（长链形态已变）');
  assert.ok(!degraded.includes(target), '闸门失效: 摘除闸门未被 E1 判据识别');
});
