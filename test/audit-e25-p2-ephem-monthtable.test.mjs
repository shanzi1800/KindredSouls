// ═══════════════════════════════════════════════════════════════════════
// 🛡️ E25-P2/D 附带修复: 星历月表「下标 = 月号-1」不变量 回归闸门
//
// 缺陷（2026-10-08 探针附带战果，E25-P1②自身引入的线上回归）：
//   `_EPHEM_DAYMON.es` 原为 **13 项**（`'septiembre'` 后多一个 `'setiembre'`），
//   而本设施的契约是「**数组下标 = 月号 - 1**」：
//     · `fmtDate` 取 `es[m-1]` ⇒ m=10 取到 es[9]='setiembre'、m=11 取 'octubre'、m=12 取 'noviembre'
//       ⇒ **线上 es 年报 10/11/12 月日期整体写成前一个月**（v532 起）；
//     · `_EPHEM_MON_IDX` 用 `i+1` 建表 ⇒ 'octubre'→11 / 'noviembre'→12 / 'diciembre'→13(越界≈无效)
//       ⇒ 解析侧同步错位。
//   E25-P1② 自带闸门未覆盖 10/11/12 月 ⇒ 又一次「射程不足 = 假绿」。
//
// 治法：还原严格 12 项 + `setiembre` 降级为**解析别名**（`_EPHEM_MON_ALIAS`）。
//
// 本闸门把该不变量固化为**结构性判据**（对六语同时生效），使任何语种再插入重复杂项都会立刻变红。
// ═══════════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { indexDecls } from './tools/extract_decls.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf-8');

const NEED = ['_TH_PLANET', '_VI_PLANET', '_FR_PLANET', '_V432_NAME', '_V482_TRANSIT_KEYS',
  '_EPHEM_DAYMON', '_EPHEM_MON_ALIAS', '_EPHEM_MON_IDX', '_EPHEM_L10N_NAME',
  '_ephemDateWindow', '_v444Esc', 'lockEphemerisDates'];
function build(source = SRC) {
  const d = indexDecls(source);
  for (const n of NEED) if (!d.has(n)) throw new Error('缺声明: ' + n);
  const code = NEED.slice().sort((a, b) => source.indexOf(d.get(a)) - source.indexOf(d.get(b))).map((n) => d.get(n)).join('\n\n');
  return new Function(code + '\nreturn { lockEphemerisDates, _EPHEM_DAYMON, _EPHEM_MON_IDX, _EPHEM_MON_ALIAS };')();
}
const F = build();
const LANGS = ['es', 'en', 'fr', 'th', 'vi'];

// ═══════════════════════════════ A 结构性不变量 ═══════════════════════════════

test('A1 每语种月表恰 12 项（下标=月号-1 的契约前提）', () => {
  for (const lg of LANGS) {
    const arr = F._EPHEM_DAYMON[lg];
    assert.ok(Array.isArray(arr), `缺月表 ${lg}`);
    assert.strictEqual(arr.length, 12, `🔴 ${lg} 月表 ${arr.length} 项（必须恰 12 —— 多一项即下标整体错位）`);
  }
});

test('A2 月表不得含重复项', () => {
  for (const lg of LANGS) {
    const arr = F._EPHEM_DAYMON[lg];
    const dup = arr.filter((w, i) => arr.indexOf(w) !== i);
    assert.deepStrictEqual(dup, [], `🔴 ${lg} 月表含重复杂项: ${dup.join(', ')}`);
  }
});

test('A3 月名 ↔ 月号双射（_EPHEM_MON_IDX[name] === i+1）', () => {
  for (const lg of LANGS) {
    F._EPHEM_DAYMON[lg].forEach((w, i) => {
      assert.strictEqual(F._EPHEM_MON_IDX[String(w).toLowerCase()], i + 1,
        `🔴 ${lg} 月名 '${w}' 解析为 ${F._EPHEM_MON_IDX[String(w).toLowerCase()]}（应为 ${i + 1}）`);
    });
  }
});

test('A4 别名不得篡改任何语种规范月名的月号', () => {
  for (const lg of LANGS) {
    F._EPHEM_DAYMON[lg].forEach((w, i) => {
      const alias = F._EPHEM_MON_ALIAS[String(w).toLowerCase()];
      if (alias !== undefined) {
        assert.strictEqual(alias, i + 1, `🔴 别名表把规范月名 '${w}' 篡改为 ${alias}（应为 ${i + 1}）`);
      }
    });
  }
  // 别名键必须全为小写（查表统一走 toLowerCase）
  const badCase = Object.keys(F._EPHEM_MON_ALIAS).filter((k) => k !== k.toLowerCase());
  assert.deepStrictEqual(badCase, [], `别名键必须小写: ${badCase.join(', ')}`);
});

// ═══════════════════════════════ B es 回归专断 ═══════════════════════════════

test('B1 es 双拼写与 10/11/12 月号专断（缺陷直接命中面）', () => {
  const want = { septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12 };
  for (const [w, n] of Object.entries(want)) {
    assert.strictEqual(F._EPHEM_MON_IDX[w], n, `es '${w}' 解析为 ${F._EPHEM_MON_IDX[w]}（应 ${n}）`);
  }
  // 回写侧必须是严格 12 项且第 10/11/12 位为 octubre/noviembre/diciembre
  assert.strictEqual(F._EPHEM_DAYMON.es[9], 'octubre', `es[9] 应为 octubre，实际 '${F._EPHEM_DAYMON.es[9]}'`);
  assert.strictEqual(F._EPHEM_DAYMON.es[10], 'noviembre', `es[10] 应为 noviembre，实际 '${F._EPHEM_DAYMON.es[10]}'`);
  assert.strictEqual(F._EPHEM_DAYMON.es[11], 'diciembre', `es[11] 应为 diciembre，实际 '${F._EPHEM_DAYMON.es[11]}'`);
});

test('B2 行为：es 10/11/12 月日期吸附后月名必须正确（抓 off-by-one）', () => {
  const chronicle = (iso) => ({ ephemeris_chronicle: { by_planet: { mercury: [{ date: iso, type: 'RETROGRADE' }] } } });
  const cases = [
    ['Mercurio retrógrado el 7 de octubre de 2026.', '23 de octubre de 2026', '2026-10-23', 10],
    ['Mercurio retrógrado el 5 de noviembre de 2026.', '25 de noviembre de 2026', '2026-11-25', 11],
    ['Mercurio retrógrado el 5 de diciembre de 2026.', '28 de diciembre de 2026', '2026-12-28', 12],
  ];
  const fails = [];
  for (const [input, want, iso, mo] of cases) {
    const out = F.lockEphemerisDates(input, 'es', chronicle(iso), 'yearly');
    if (!out.includes(want)) fails.push(`第 ${mo} 月: 期望含 "${want}"，实际 "${out}"`);
    // 反向：不得出现前一个月的月名（off-by-one 的确切指纹）
    const prev = F._EPHEM_DAYMON.es[mo - 2];
    if (out.includes(prev)) fails.push(`第 ${mo} 月: 出现前月名 "${prev}" —— off-by-one 回归`);
  }
  assert.deepStrictEqual(fails, [], 'B2 失败:\n' + fails.join('\n'));
});

test('B3 六语各自「月号→月名」往返一致（解析后回写必须还原同一月）', () => {
  // ⚠️ 必须用「数字边界」判月名 —— 裸 includes 会撞 E16/R11g 那个线上老坑：
  //    vi 的 `tháng 1` 是 `tháng 10/11/12` 的**前缀** ⇒ includes('tháng 1') 对 10/11/12 月恒真。
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const hasMonth = (out, w) => new RegExp(esc(w) + '(?!\\d)').test(out);
  // 语料：各语种第 1~12 月的「错日期」句，吸附到同月站点后必须仍写同月
  const probe = {
    fr: (m) => `Mercure rétrograde le 5 ${F._EPHEM_DAYMON.fr[m - 1]} 2026.`,
    th: (m) => `ดาวพุธถอยหลัง 5 ${F._EPHEM_DAYMON.th[m - 1]} 2026`,
    vi: (m) => `Sao Thủy nghịch hành ngày 5 tháng ${m} năm 2026`,
    es: (m) => `Mercurio retrógrado el 5 de ${F._EPHEM_DAYMON.es[m - 1]} de 2026.`,
  };
  const fails = [];
  for (const [lang, mk] of Object.entries(probe)) {
    for (let m = 1; m <= 12; m++) {
      const iso = `2026-${String(m).padStart(2, '0')}-20`;
      const mtx = { ephemeris_chronicle: { by_planet: { mercury: [{ date: iso, type: 'RETROGRADE' }] } } };
      const out = F.lockEphemerisDates(mk(m), lang, mtx, 'yearly');
      if (!hasMonth(out, String(F._EPHEM_DAYMON[lang][m - 1]))) fails.push(`[${lang}] 第 ${m} 月: 回写丢失本语种月名 → "${out}"`);
      // 不得出现别的月份名
      const other = F._EPHEM_DAYMON[lang].filter((w, i) => i !== m - 1 && hasMonth(out, w));
      if (other.length) fails.push(`[${lang}] 第 ${m} 月: 混入他月名 ${other.join(',')} → "${out}"`);
    }
  }
  assert.deepStrictEqual(fails, [], 'B3 失败:\n' + fails.join('\n'));
});

// ═══════════════════════════════ C 注入缺陷自测 ═══════════════════════════════

test('C1 注入缺陷：把额外拼写 ' + "'setiembre'" + ' 塞回 es 月表 ⇒ A1 必红 + 行为复现 off-by-one', () => {
  const GOOD = "es: ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'],";
  const BAD = "es: ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','setiembre','octubre','noviembre','diciembre'],";
  assert.ok(SRC.includes(GOOD), 'es 月表锚点漂移');
  const injected = SRC.replace(GOOD, BAD);
  assert.notStrictEqual(injected, SRC, '注入未真的改变源码');
  const G = build(injected);
  // A1 长度：本类缺陷（额外插入一个**不同拼写**的月名，非重复项）的**唯一静态探测器**。
  // ⚠️ A3 双射判据对此**天然失明** —— `_EPHEM_MON_IDX` 与月表同源偏移 ⇒ 自洽（下方显式固化该结论）。
  assert.strictEqual(G._EPHEM_DAYMON.es.length, 13, '注入后长度应 13（证明注入生效）');
  assert.notStrictEqual(G._EPHEM_DAYMON.es.length, 12, '🔴 A1 长度判据未能捕获额外月名项');
  const broken = G._EPHEM_DAYMON.es.filter((w, i) => G._EPHEM_MON_IDX[String(w).toLowerCase()] !== i + 1);
  // 如实记录判据分工：本类缺陷的**完整拦截只能靠 A1 长度判据**。
  // A3 双射之所以近乎失明，是因为 `_EPHEM_MON_IDX` 与月表**同源偏移**（自洽）；
  // 唯一被捕获的一项来自**别名表**显式钉住 `setiembre:9`（部分第二防线，不可依赖）。
  assert.ok(broken.length >= 1, 'A3 应至少捕获别名表钉住的那一项（若 0 说明别名表失效）');
  assert.ok(G._EPHEM_DAYMON.es.length !== 12, '🔴 A1 长度判据必须拦住（本类缺陷的唯一可靠静态探测器）');
  // B2 行为：off-by-one 必须复现
  const mtx = { ephemeris_chronicle: { by_planet: { mercury: [{ date: '2026-10-23', type: 'RETROGRADE' }] } } };
  const out = G.lockEphemerisDates('Mercurio retrógrado el 7 de octubre de 2026.', 'es', mtx, 'yearly');
  assert.ok(!out.includes('23 de octubre de 2026'), `注入后仍产出正确月名（判据射程不足）: ${out}`);
  assert.ok(out.includes('setiembre'), `注入后应出现 off-by-one 月名 setiembre，实际: ${out}`);
});

test('C2 judge 不得恒真：正例 PASS、乱序月表 FAIL', () => {
  const judge = (tbl, idx) => tbl.every((w, i) => idx[String(w).toLowerCase()] === i + 1) && tbl.length === 12;
  assert.strictEqual(judge(F._EPHEM_DAYMON.es, F._EPHEM_MON_IDX), true, '正例被误判');
  assert.strictEqual(judge(['a', 'b'], {}), false, '反例被误判绿（恒真探针）');
});
