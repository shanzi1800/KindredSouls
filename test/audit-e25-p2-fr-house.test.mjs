// ═══════════════════════════════════════════════════════════════════════
// 🛡️ E25-P2/C: 法语 natal 宫位漂移锁缺口（`9ème Maison` 逃逸）回归闸门
//
// 缺陷（2026-10-08 线上 fr 年报实证）：
//   `_frClaimOf` 自搓 `/Maison\s*(\d+)/i` —— 只认法语 `Maison 9`，
//   **不认自然语序 `9ème Maison`**（而同文件 `_FR_HOUSE_ANY` 本来就能认 ⇒ 两处口径漂移）。
//   后果：claim.house 恒 null ⇒ `_frTruthMatch` 退化为「只比星座」⇒
//   「星座对、宫位错」被判为「无漂移」⇒ **宫位漂移全部逃逸**。
//   线上靶盘：引擎 natal Sun = Aries·House 7，产物写 `Soleil … 9ème Maison`。
//
// 修复：`_frClaimOf` 改接 `_FR_HOUSE_ANY`（宫位引用任一形态的**单一真源**），
//       并由 `_frHouseNumOf` 解出两种语序的数字。
//
// 纪律：直接抽取 server.js 真源装配（不复制代码）；判据配注入自测。
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
const decls = indexDecls(SRC);

function build(source = SRC) {
  const d = indexDecls(source);
  const NEED = ['_FR_SIGN_FR', '_FR_SIGN_UNIQ_CACHE', '_FR_SIGN_UNIQ', '_FR_HOUSE_ANY', '_frHouseNumOf', '_frClaimOf'];
  for (const n of NEED) if (!d.has(n)) throw new Error('缺声明: ' + n);
  const code = NEED.slice().sort((a, b) => source.indexOf(d.get(a)) - source.indexOf(d.get(b))).map((n) => d.get(n)).join('\n\n');
  return new Function(code + '\nreturn { _frClaimOf, _frHouseNumOf, _FR_HOUSE_ANY };')();
}
const F = build();

// 旧实现快照（改动前 server.js 逐字；用于证明缺陷确在射程内）
const OLD_HOUSE_ANY = /(?:Maison\s*\d+|(?<![\d.,])\b\d{1,2}\s*(?:ème|eme|[eèé\u1d49\u00b0])?\s*maison)\b/i;

const CASES = [
  [' en Bélier dans votre 9ème Maison.', '', 9, '线上产物原句形态（9ème Maison）'],
  [' en Bélier, 9ème Maison.', '', 9, '逗号式'],
  [' en Bélier dans votre Maison 9.', '', 9, '既有形态（Maison 9）'],
  [' en Bélier dans votre 9ᵉ Maison.', '', 9, '上标 i 形态'],
  [' en Bélier dans votre 9° Maison.', '', 9, '度数符号形态'],
  [' en Bélier dans votre 1er Maison.', '', 1, '军师指令：1er'],
  [' en Bélier dans votre 1ère Maison.', '', 1, '军师指令：1ère'],
  [' en Bélier dans votre 2nd Maison.', '', 2, '军师指令：2nd'],
  [' en Bélier dans votre 2nde Maison.', '', 2, '军师指令：2nde'],
  [' en Bélier dans votre 12ème Maison.', '', 12, '两位数'],
  [' en Bélier.', 'votre Maison 7', 7, 'bwd 回看（Maison 7）'],
  [' en Bélier.', 'votre 7ème Maison', 7, 'bwd 回看（序数形态）'],
  [' en Bélier en 2026.', '', null, '否定：年份不得当宫位'],
  [' en Bélier, 1.5 maison.', '', null, '否定：小数不得当宫位'],
  [' en Bélier.', '', null, '否定：无宫位引用'],
];

// ═══════════════════════════════ A 静态 ═══════════════════════════════

test('A1 _frClaimOf 已接单一真源 _FR_HOUSE_ANY，且自搓正则已清除', () => {
  const body = SRC.match(/function _frClaimOf\([\s\S]*?\n\}/)[0]
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  assert.ok(/fwd\.match\(_FR_HOUSE_ANY\)/.test(body), '_frClaimOf 未改接 _FR_HOUSE_ANY');
  assert.ok(/_frHouseNumOf\(/.test(body), '未使用 _frHouseNumOf 解值');
  assert.ok(!/match\(\/Maison\\s\*\(\\d\+\)\/i\)/.test(body), '🔴 自搓 `/Maison\\s*(\\d+)/i` 残留（口径漂移回归）');
  assert.ok(/function _frHouseNumOf\(/.test(SRC), '缺少 _frHouseNumOf');
  // 值域守卫（与 _frPatchZone 的 gotHouse 1~12 同口径）
  const hb = SRC.match(/function _frHouseNumOf\([\s\S]*?\n\}/)[0];
  assert.ok((hb.match(/n >= 1 && n <= 12/g) || []).length === 2, '_frHouseNumOf 值域守卫缺失/不对称');
});

test('A2 _FR_HOUSE_ANY 序数变体齐备（含军师指令的 er/ère/nd/nde）', () => {
  assert.ok(/_FR_HOUSE_ANY = \/\(\?:Maison\\s\*\\d\+\|/.test(SRC), '_FR_HOUSE_ANY 结构漂移');
  for (const v of ['ème', 'eme', 'ère', 'ere', 'er', 'nde', 'nd']) {
    assert.ok(SRC.includes(v), `_FR_HOUSE_ANY 缺序数变体 '${v}'`);
  }
});

// ═══════════════════════════════ B 行为 ═══════════════════════════════

test('B1 _frClaimOf 全形态实测（14 例，含否定用例）', () => {
  const fails = [];
  for (const [fwd, bwd, want, label] of CASES) {
    const got = F._frClaimOf(fwd, bwd);
    if (got.house !== want) fails.push(`${label}: house=${got.house} want=${want}`);
  }
  assert.deepStrictEqual(fails, [], 'B1 失败:\n' + fails.join('\n'));
});

test('B2 缺陷确在射程内：旧实现在 10/14 例上恒 null（修复方向唯一确定）', () => {
  const oldClaim = (fwd, bwd) => {
    let house = null;
    const hm = fwd.match(/Maison\s*(\d+)/i);
    if (hm) house = Number(hm[1]);
    if (house === null && bwd) { const all = [...String(bwd).matchAll(/Maison\s*(\d+)/gi)]; if (all.length) house = Number(all[all.length - 1][1]); }
    return house;
  };
  const diffs = [];
  for (const [fwd, bwd, want, label] of CASES) {
    const o = oldClaim(fwd, bwd), n = F._frClaimOf(fwd, bwd).house;
    if (o !== n) diffs.push({ label, o, n, want });
  }
  assert.ok(diffs.length >= 10, `缺陷差异数 ${diffs.length} < 10 —— 射程覆盖不足（修复收益被夸大或判据失效）`);
  for (const d of diffs) {
    assert.strictEqual(d.o, null, `差异项 ${d.label} 旧值应为 null（缺陷形态）`);
    assert.strictEqual(d.n, d.want, `差异项 ${d.label} 新值应为真值 ${d.want}`);
  }
});

test('B3 _FR_HOUSE_ANY 扩面安全性：既有命中集合零污染（仅新增 er/ère/nd/nde 形态）', () => {
  const corpus = [
    'dans votre 9ème Maison.', 'dans votre Maison 9.', 'dans votre 9ᵉ maison.', 'dans votre 5e maison.',
    'dans votre 9° maison.', 'le 24 juillet 2026.', 'en 2026 et 2027.', 'tarif 1.5 maison.',
    'au 12ème mois.', 'Maison 12.', 'votre 12ème Maison.', 'deuxième maison.', 'neuvième maison.',
    'un 3 pièces maison.', 'Mercure rétrograde le 10 octobre.', 'la Maison 3 de votre thème.',
    'Aries en Maison 2.', 'la 4ème Maison est active.',
  ];
  const newlyMatched = [];
  for (const t of corpus) {
    const o = t.match(OLD_HOUSE_ANY), n = t.match(F._FR_HOUSE_ANY);
    const os = o ? `${o.index}:${o[0]}` : 'null';
    const ns = n ? `${n.index}:${n[0]}` : 'null';
    if (os !== ns) newlyMatched.push({ t, os, ns });
  }
  // 允许扩面，但**只允许**「旧 null → 新命中 er/ère/nd/nde」这一类
  for (const x of newlyMatched) {
    assert.strictEqual(x.os, 'null', `🔴 既有命中被改动（污染）: "${x.t}"  old=${x.os} new=${x.ns}`);
    assert.ok(/(er|ère|nd|nde)\s+maison/i.test(x.t), `🔴 非序数形态被新纳入: "${x.t}"`);
  }
  // 拼写式序数**刻意不纳入**（无线上样本，纳入会移动 _frClause cut 点 ⇒ 不可证）
  assert.strictEqual((corpus.find((t) => t === 'neuvième maison.') || '').match(F._FR_HOUSE_ANY), null,
    '拼写式序数被纳入 _FR_HOUSE_ANY（越权扩面，违反「未证实不加锁」纪律）');
});

// ═══════════════════════════════ D 注入缺陷自测 ═══════════════════════════════

test('D1 注入缺陷自测：把 _frClaimOf 改回自搓正则 ⇒ B1 必须变红', () => {
  const GOOD = 'const hm = fwd.match(_FR_HOUSE_ANY);\n  if (hm) house = _frHouseNumOf(hm[0]);';
  const BAD = 'const hm = fwd.match(/Maison\\s*(\\d+)/i);\n  if (hm) house = Number(hm[1]);';
  assert.ok(SRC.includes(GOOD), '锚点漂移（找不到修复后形态）');
  const injected = SRC.replace(GOOD, BAD);
  assert.notStrictEqual(injected, SRC, '注入未真的改变源码');
  const G = build(injected);
  const red = CASES.filter(([fwd, bwd, want]) => G._frClaimOf(fwd, bwd).house !== want).length;
  assert.ok(red >= 8, `注入缺陷后仅 ${red} 例变红 —— 判据射程不足（应 ≥8）`);
});

test('D2 judge 不得恒真：正例必须 PASS、反例必须 FAIL', () => {
  const judge = (fn) => CASES.every(([fwd, bwd, want]) => fn(fwd, bwd).house === want);
  assert.strictEqual(judge(F._frClaimOf), true, '正例被误判');
  assert.strictEqual(judge(() => ({ house: null })), false, '反例被误判绿（恒真探针）');
});
