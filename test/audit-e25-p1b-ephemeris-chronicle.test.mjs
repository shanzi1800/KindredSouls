// ═══════════════════════════════════════════════════════════════════════════
// 🛡️ E25-P1②「全财年星历编年史注入 + 日期门禁」闸门（2026-10-08 军师开工令）
//
// 病灶（es 年报终考缺陷2：水星逆行日期 3 处编造）：
//   ① prompt 只注入 7 月单月水星段（server.js 硬编码, 且 fr 版日期与真值矛盾
//      「7月8~25日」 vs 真值 6/29~7/23）⇒ 其余 11 个月全靠幻觉。
//   ② 引擎 find_all_stations() 硬编码 2026-07~2028-01 且只含水星 ⇒ 换财年/换盘即失效。
//   ③ 无日期门禁：即便注入了真值表, 长文尾部仍会编造（7/18 说成开始逆行、2027-4/3
//      当月根本无站点）。
//
// 真值来源：生产同源 astro/astro_matrix.py compute_ephemeris_chronicle 实算
//   （乌斯怀亚盘财年 2026-07~2027-06）。以下 fixture 数值即该引擎输出。
// ═══════════════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { closureDecls, indexDecls } from './tools/extract_decls.mjs';
import { buildEphemerisChronicleBlock } from '../v69_client.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf-8');
const py = fs.readFileSync(path.join(__dirname, '..', 'astro', 'astro_matrix.py'), 'utf-8');

function stripComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/[^\n]*$/gm, ' ').replace(/([^:])\/\/[^\n]*/g, '$1 ');
}

/** 乌斯怀亚盘财年编年史 fixture（astro_matrix.py 实算：2026-07 起 12 个月） */
function ushuaiaChronicle() {
  return {
    start: '2026-07', end: '2027-06', months: 12,
    by_planet: {
      mercury: [
        { planet: 'Mercury', type: 'RETROGRADE', date: '2026-06-29', sign: 'Cancer' },
        { planet: 'Mercury', type: 'DIRECT', date: '2026-07-23', sign: 'Cancer' },
        { planet: 'Mercury', type: 'RETROGRADE', date: '2026-10-23', sign: 'Scorpio' },
        { planet: 'Mercury', type: 'DIRECT', date: '2026-11-13', sign: 'Scorpio' },
      ],
      saturn: [
        { planet: 'Saturn', type: 'RETROGRADE', date: '2026-07-26', sign: 'Aries' },
        { planet: 'Saturn', type: 'DIRECT', date: '2026-12-10', sign: 'Aries' },
      ],
    },
    ingresses: [
      { planet: 'Sun', date: '2026-07-23', from: 'Cancer', to: 'Leo' },
      { planet: 'Sun', date: '2026-08-23', from: 'Leo', to: 'Virgo' },
    ],
  };
}
const mkAM = () => ({ ephemeris_chronicle: ushuaiaChronicle() });

function buildDateLock(source = src) {
  const { source: code } = closureDecls(source, ['lockEphemerisDates']);
  const ctx = vm.createContext({ console: { log() {}, warn() {} } });
  vm.runInContext(code + '\nglobalThis.__D = lockEphemerisDates;', ctx);
  return ctx.__D;
}

// ═══════════════════════════════ A 静态 ═══════════════════════════════

test('A1 引擎侧：编年史真值派生存在, 且 compute_full_matrix 不再用硬编码 find_all_stations', () => {
  assert.ok(/def compute_ephemeris_chronicle\s*\(/.test(py), '缺 compute_ephemeris_chronicle');
  assert.ok(/chronicle\s*=\s*compute_ephemeris_chronicle\(/.test(py), 'compute_full_matrix 未接编年史');
  assert.ok(!/^\s*stations\s*=\s*find_all_stations\(\)/m.test(py),
    '仍调用硬编码 find_all_stations()（应已改真值派生）');
  assert.ok(/'ephemeris_chronicle':\s*chronicle/.test(py), '未输出 ephemeris_chronicle 字段');
  assert.ok(/'retrograde_stations':\s*chronicle\.get\('by_planet'\)/.test(py),
    'retrograde_stations 兼容字段未接编年史（v69_client buildFactSheet 会 undefined）');
});

test('A2 prompt 注入：六语模板均已用 _ephemBlock, 硬编码单月段已清除', () => {
  const n = (src.match(/\$\{_ephemBlock\}/g) || []).length;
  assert.ok(n >= 6, `_ephemBlock 注入点应 ≥6（六语各一），实得 ${n}`);
  const hard = [
    'MERCURY RX TIMELINE LOCK', 'CRONOLOGÍA DE MERCURIO', 'Mercure rétrograde en Cancer',
    'ดาวพุธวงในในราศีกรกฎ', 'Sao Thủy nghịch hành trong Cự Giải',
  ];
  for (const h of hard) assert.ok(!src.includes(h), `硬编码星历段未清除: ${h}`);
  assert.ok(/const _ephemBlock = astroMatrix \? buildEphemerisChronicleBlock/.test(src),
    '_ephemBlock 未由 buildEphemerisChronicleBlock 构造');
});

test('A3 日期门禁已挂载写链（非流式 + 流式×2）', () => {
  const mounts = (stripComments(src).match(/lockEphemerisDates\(/g) || []).length
    - (stripComments(src).match(/function lockEphemerisDates\(/g) || []).length;
  assert.ok(mounts >= 3, `lockEphemerisDates 挂载点应 ≥3, 实得 ${mounts}`);
});

// ═══════════════════ B 行为级：编年史块（v69_client 真源） ═══════════════════

test('B1 编年史块：含 es 句式锚 + 真值日期 + 本地化行星/星座名', () => {
  const es = buildEphemerisChronicleBlock(mkAM(), 'es');
  assert.ok(es.includes('comienza su retrogradación'), 'es 块缺「comienza su retrogradación」句式锚');
  assert.ok(es.includes('se estaciona directo'), 'es 块缺「se estaciona directo」');
  assert.ok(es.includes('2026-06-29') && es.includes('2026-07-23'), 'es 块缺水星真值站日期');
  assert.ok(es.includes('Mercurio') && es.includes('Cáncer'), 'es 块未本地化行星/星座名');
  const zh = buildEphemerisChronicleBlock(mkAM(), 'zh');
  assert.ok(zh.includes('水星') && zh.includes('巨蟹座'), 'zh 块未本地化');
  assert.ok(zh.includes('开始逆行') && zh.includes('恢复顺行'), 'zh 块缺逆行句式');
  const fr = buildEphemerisChronicleBlock(mkAM(), 'fr');
  assert.ok(fr.length > 0 && fr.includes('Mercury'), 'fr 未回落 en 骨架');
});

test('B2 编年史块：无 chronicle 数据 → 空串（不注入假数据）', () => {
  assert.strictEqual(buildEphemerisChronicleBlock({}, 'es'), '');
  assert.strictEqual(buildEphemerisChronicleBlock(null, 'zh'), '');
});

// ═══════════════════ C 行为级：日期门禁 ═══════════════════

test('C1 es：编造逆行日期 → 换真值最近站（保形写回）', () => {
  const f = buildDateLock();
  assert.strictEqual(
    f('El 18 de julio el Mercurio comienza su retrogradacion en Cancer.', 'es', mkAM(), 'yearly'),
    'El 29 de junio el Mercurio comienza su retrogradacion en Cancer.');
});

test('C2 es：正确日期不动 + 幂等', () => {
  const f = buildDateLock();
  const t = 'El 23 de julio Mercurio se estaciona directo en Cancer.';
  const o = f(t, 'es', mkAM(), 'yearly');
  assert.strictEqual(o, t);
  assert.strictEqual(f(o, 'es', mkAM(), 'yearly'), o, '二跑不幂等');
});

test('C3 zh：同句双日期（逆行开始 + 恢复顺行）各自按事件归属纠正', () => {
  const f = buildDateLock();
  assert.strictEqual(
    f('水星在7月18日开始逆行，持续到8月11日恢复顺行。', 'zh', mkAM(), 'yearly'),
    '水星在6月29日开始逆行，持续到7月23日恢复顺行。');
});

test('C4 无 chronicle / 射程外语种 → 整体透传（宁漏不改）', () => {
  const f = buildDateLock();
  const t = 'Mercurio el 18 de julio comienza su retrogradacion.';
  assert.strictEqual(f(t, 'es', {}, 'yearly'), t, '无 chronicle 时须整体透传');
  // 🔴 E25-P2/D（2026-10-08）: 射程已由 es/en/zh 扩至 **fr/th/vi** ⇒
  //   原「非三语透传」的 fr 用例**已不成立**（fr 现为射程内，会被吸附到真值站，
  //   这正是 D 修复的目标行为）。改取射程外语言（de）验证「宁漏不改」边界仍在。
  const de = 'Merkur am 18. Juli wird rückläufig.';
  assert.strictEqual(f(de, 'de', mkAM(), 'yearly'), de, '射程外语种必须整体透传');
});

// ═══════════════════════════ 注入缺陷自测 ═══════════════════════════

test('【注入缺陷自测】恢复硬编码单月段 → A2 必须红', () => {
  const degraded = src.replace('${_ephemBlock}', '• ⛔ [CRONOLOGÍA DE MERCURIO RETRÓGRADO] Mercurio entró retrógrado…');
  assert.notStrictEqual(degraded, src, '未成功注入缺陷');
  assert.ok(src.includes('CRONOLOGÍA DE MERCURIO') === false && degraded.includes('CRONOLOGÍA DE MERCURIO'),
    '闸门失效: 注入硬编码段后 A2 判据未红');
});

test('【注入缺陷自测】门禁返回原文 → C1 必须红', () => {
  // ⚠️ 锚点必须唯一: `if (!patches.length) return text;` 在 server.js 出现 6 次（其它真值锁同款早退），
  //   而 String.replace 只换**首个** ⇒ 初版误改了 4072 行别的函数、lockEphemerisDates 未被污染,
  //   注入自测变假绿（实测: C1 仍被纠正）。故并上其后的独有注释行锁定本函数。
  const anchor = '  if (!patches.length) return text;\n  // 去重（同坐标只留一个）';
  assert.ok(src.includes(anchor), '锚点漂移: lockEphemerisDates 的 patches 早退段未匹配');
  const degraded = src.replace(anchor,
    '  if (!patches.length) return text;\n  if (patches.length) return text;\n  // 去重（同坐标只留一个）');
  assert.notStrictEqual(degraded, src, '未成功注入缺陷（未匹配到 patches 早退锚点）');
  const f = buildDateLock(degraded);
  assert.strictEqual(
    f('El 18 de julio el Mercurio comienza su retrogradacion en Cancer.', 'es', mkAM(), 'yearly'),
    'El 18 de julio el Mercurio comienza su retrogradacion en Cancer.',
    '闸门失效: 门禁被短路后 C1 仍通过');
});

test('【注入缺陷自测】撤销引擎真值派生（还原 find_all_stations 调用）→ A1 必须红', () => {
  const degraded = py.replace('chronicle = compute_ephemeris_chronicle(start_year, start_month, len(months))',
    'chronicle = {\'by_planet\': find_all_stations()}');
  assert.notStrictEqual(degraded, py, '未成功注入缺陷（未匹配到编年史派生锚点）');
  assert.ok(!/^\s*chronicle\s*=\s*compute_ephemeris_chronicle\(/m.test(degraded),
    '闸门失效: 撤销派生后 A1 判据未红');
});
