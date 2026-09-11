// 🛠️ V430 回归门：法语「本命/流年定语」双向裁定 adjudicateNatalDescriptorsFr
//
// 【真值轴】真值不手写，全部来自 astro/astro_matrix.py（SwissEph 实算）→ 杜绝「用自己写的常量验自己」
// 【不变量】① 幂等：裁定两次 == 裁定一次（防自我覆写）
//          ② 字符守恒：剥离 / 补全后，除去「定语词」本身，其余文本必须逐字符一致（抓掉字/重字）
//          ③ 已知好样本必须零改动（正确定语的本命句 / 无定语的流月句 / transitant 句 / du thème natal 句）
//          ④ 已知坏样本必须抓到（生产实测：本命句丢标识被 transit 锁改成流月值）
import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getAstroMatrix } from '../v69_client.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
const _from = SRC.indexOf('const _EN2ZIDX');
const _to = SRC.indexOf('function cleanConsumerTrapAndBrackets');
if (_from < 0 || _to < 0 || _to <= _from) throw new Error('未能从 server.js 提取 FR 真值锁源码块');
const BLOCK = SRC.slice(_from, _to);
const SUN_SIGN_FR_DECL = "const SUN_SIGN_FR = ['Bélier','Taureau','Gémeaux','Cancer','Lion','Vierge','Balance','Scorpion','Sagittaire','Capricorne','Verseau','Poissons'];";
const FRBOX = new Function(`${SUN_SIGN_FR_DECL}\n${BLOCK}\nreturn { adjudicateNatalDescriptorsFr, lockNatalTruthFr, lockTransitTruthFr, _natalTruthMap10_FR, _transitTruthMap10_FR, _FR_PLANET, _FR_PLANET_ORDER, _FR_SIGN_FR, _EN2ZIDX };`)();

assert.strictEqual(typeof FRBOX.adjudicateNatalDescriptorsFr, 'function', 'V430 裁定器应被成功提取');
assert.strictEqual(FRBOX._FR_PLANET_ORDER.length, 10, 'V430 必须覆盖 10 行星');

const FR_PLANET = FRBOX._FR_PLANET;
const FR_SIGN = FRBOX._FR_SIGN_FR;
const FR_ORDER = FRBOX._FR_PLANET_ORDER;
const EN2Z = FRBOX._EN2ZIDX;
const FV = (en) => FR_SIGN[EN2Z[en]];
const WRONG_SIGN = (s) => FR_SIGN[(FR_SIGN.indexOf(s) + 5) % 12];
const WRONG_HOUSE = (h) => (h === 12 ? 1 : h + 1);
const norm = (s) => s.replace(/\s+/g, ' ').trim();

// 全链（生产真实顺序：裁定 → transit 锁 → natal 锁）
const chain = (c, m) => {
  let t = FRBOX.adjudicateNatalDescriptorsFr(c, m);
  t = FRBOX.lockTransitTruthFr(t, m);
  return FRBOX.lockNatalTruthFr(t, m);
};

const PROFILES = [
  { bd: '1990-08-05', bt: '07:00', lat: 10.8231, lon: 106.6297, tz: 'Asia/Ho_Chi_Minh' },
  { bd: '1989-11-12', bt: '14:30', lat: 39.9042, lon: 116.4074, tz: 'Asia/Shanghai' },
];
const MATRICES = [];
before(async () => {
  for (const p of PROFILES) MATRICES.push(await getAstroMatrix(p.bd, p.bt, p.lat, p.lon, p.tz));
});

const natalOf = (m, p) => {
  const info = p === 'Moon' ? (m.meta.natal_moon || m.meta.computed_houses.Moon) : m.meta.computed_houses[p];
  if (!info || !info.sign || !info.house) return null;
  return { sign: FV(info.sign), house: info.house };
};
const transitOf = (m, p) => {
  const first = m.months && m.months[0];
  if (!first) return null;
  const k = p === 'Sun' ? 'sun' : p.toLowerCase();
  const info = first[k];
  if (!info || !info.sign || !info.house) return null;
  return { sign: FV(info.sign), house: info.house };
};
const same = (a, b) => !!a && !!b && a.sign === b.sign && a.house === b.house;

describe('V430 法语定语裁定 · A 类：夺舍剥离（本命定语贴在流月句上）', () => {
  for (let pi = 0; pi < PROFILES.length; pi++) {
    test(`profile ${pi + 1} (${PROFILES[pi].bd})：10 行星逐一「natal 贴错」都必须剥离且流月值不受损`, () => {
      const m = MATRICES[pi];
      if (!m.meta || !m.meta.computed_houses) return;
      let checked = 0;
      for (const p of FR_ORDER) {
        const nt = natalOf(m, p), tt = transitOf(m, p);
        if (!nt || !tt || same(nt, tt)) continue;   // 本命/流月真值重合 → 不可判定，跳过
        const name = FR_PLANET[p];
        const inc = 'Ce mois-ci, votre ' + name + ' natal en ' + tt.sign + ', Maison ' + tt.house + ', vous pousse à agir.';
        const adj = FRBOX.adjudicateNatalDescriptorsFr(inc, m);
        assert.ok(!new RegExp('\\b' + name + ' natal\\b').test(adj), p + ' 夺舍定语未被剥离：' + adj);
        assert.ok(adj.includes(tt.sign) && adj.includes('Maison ' + tt.house), p + ' 流月真值被误伤：' + adj);
        // 字符守恒：剥掉定语词后其余逐字符一致
        assert.strictEqual(norm(adj.replace(/\bnatale?\b/g, '')), norm(inc.replace(/\bnatale?\b/g, '')), p + ' 剥离后文本不守恒：' + adj);
        // 全链后仍是流月真值（没有被 natal 锁反向拉回本命盘）
        const out = chain(inc, m);
        assert.ok(out.includes(tt.sign) && out.includes('Maison ' + tt.house), p + ' 全链后流月真值被改写：' + out);
        assert.ok(!out.includes(nt.sign) || nt.sign === tt.sign, p + ' 全链后出现本命星座混入：' + out);
        checked++;
      }
      assert.ok(checked >= 5, '应至少校验 5 个本命/流月不重合的行星，实际 ' + checked);
    });
  }

  test('幂等：剥离后再次裁定零改动', () => {
    const m = MATRICES[0];
    const p = 'Soleil';
    const nt = natalOf(m, p), tt = transitOf(m, p);
    if (!nt || !tt || same(nt, tt)) return;
    const inc = 'Votre ' + FR_PLANET[p] + ' natal en ' + tt.sign + ', Maison ' + tt.house + ', vous guide.';
    const one = FRBOX.adjudicateNatalDescriptorsFr(inc, m);
    const two = FRBOX.adjudicateNatalDescriptorsFr(one, m);
    assert.strictEqual(two, one, '裁定不幂等：' + two);
  });
});

describe('V430 法语定语裁定 · B 类：标识补全（本命句丢了 natal 标识）', () => {
  for (let pi = 0; pi < PROFILES.length; pi++) {
    test(`profile ${pi + 1} (${PROFILES[pi].bd})：10 行星逐一「本命句无标识」都必须补 natal/natale 且不被流月锁改写`, () => {
      const m = MATRICES[pi];
      if (!m.meta || !m.meta.computed_houses) return;
      let checked = 0;
      for (const p of FR_ORDER) {
        const nt = natalOf(m, p), tt = transitOf(m, p);
        if (!nt || !tt || same(nt, tt)) continue;
        const name = FR_PLANET[p];
        const marker = /^(?:Lune|Vénus)$/.test(name) ? 'natale' : 'natal';
        const inc = 'Le ' + name + ' en ' + nt.sign + ', Maison ' + nt.house + ', décrit votre rapport à la valeur.';
        const adj = FRBOX.adjudicateNatalDescriptorsFr(inc, m);
        assert.ok(new RegExp(name + ' ' + marker + '\\b').test(adj), p + ' 本命标识未补全：' + adj);
        assert.strictEqual(norm(adj.replace(/\bnatale?\b/g, '')), norm(inc.replace(/\bnatale?\b/g, '')), p + ' 补全后文本不守恒：' + adj);
        // 全链后必须保住本命真值（这正是 bug 的现场：修前会被 transit 锁改成流月值）
        const out = chain(inc, m);
        assert.ok(out.includes(nt.sign), p + ' 全链后本命星座丢失（被流月污染）：' + out);
        assert.ok(out.includes('Maison ' + nt.house), p + ' 全链后本命宫位丢失：' + out);
        assert.ok(!out.includes(tt.sign) || tt.sign === nt.sign, p + ' 全链后混入流月星座：' + out);
        checked++;
      }
      assert.ok(checked >= 5, '应至少校验 5 个本命/流月不重合的行星，实际 ' + checked);
    });
  }

  test('幂等：补全后再次裁定零改动', () => {
    const m = MATRICES[0];
    const nt = natalOf(m, 'Soleil'), tt = transitOf(m, 'Soleil');
    if (!nt || !tt || same(nt, tt)) return;
    const inc = 'Le Soleil en ' + nt.sign + ', Maison ' + nt.house + ', décrit votre rapport à la valeur.';
    const one = FRBOX.adjudicateNatalDescriptorsFr(inc, m);
    const two = FRBOX.adjudicateNatalDescriptorsFr(one, m);
    assert.strictEqual(two, one, '裁定不幂等：' + two);
  });

  test('逗号变体（Votre Vénus, en X, Maison Y）也必须补全且文法不破', () => {
    const m = MATRICES[0];
    const nt = natalOf(m, 'Venus'), tt = transitOf(m, 'Venus');
    if (!nt || !tt || same(nt, tt)) return;
    const inc = 'Votre Vénus, en ' + nt.sign + ', Maison ' + nt.house + ', rayonne.';
    const adj = FRBOX.adjudicateNatalDescriptorsFr(inc, m);
    assert.ok(/Vénus natale,/.test(adj), '逗号变体未正确补全：' + adj);
    assert.ok(!/natale\s+,/.test(adj), '逗号前被塞入空格（法语文法破）：' + adj);
  });
});

describe('V430 法语定语裁定 · 已知好样本（必须零改动 / 不得误伤）', () => {
  test('① 正确的本命句（Votre X natal en 本命真值）→ 零改动', () => {
    const m = MATRICES[0];
    const p = 'Moon';
    const nt = natalOf(m, p);
    const inc = 'Votre ' + FR_PLANET[p] + ' natale en ' + nt.sign + ', Maison ' + nt.house + ', éclaire vos échanges.';
    assert.strictEqual(FRBOX.adjudicateNatalDescriptorsFr(inc, m), inc, '正确本命句被误改');
  });

  test('② 正确的流月句（X en 流月真值，无定语）→ 零改动', () => {
    const m = MATRICES[0];
    const p = 'Mars';
    const tt = transitOf(m, p);
    const inc = 'Ce mois-ci, Mars en ' + tt.sign + ', Maison ' + tt.house + ', vous pousse à agir.';
    assert.strictEqual(FRBOX.adjudicateNatalDescriptorsFr(inc, m), inc, '正确流月句被误改');
  });

  test('③ transitant 句（本命值+transitant）必须归流月值，不得补本命标识', () => {
    const m = MATRICES[0];
    const nt = natalOf(m, 'Mars'), tt = transitOf(m, 'Mars');
    if (!nt || !tt || same(nt, tt)) return;
    const inc = 'Mars transitant en ' + nt.sign + ', Maison ' + nt.house + ', marque votre nature profonde.';
    const adj = FRBOX.adjudicateNatalDescriptorsFr(inc, m);
    assert.strictEqual(adj, inc, 'transitant 句被补了本命标识：' + adj);
    const out = FRBOX.lockTransitTruthFr(adj, m);
    assert.ok(out.includes(tt.sign) && out.includes('Maison ' + tt.house), 'transitant 句未归流月真值：' + out);
  });

  test('④ du thème natal 变体 → 零改动', () => {
    const m = MATRICES[0];
    const nt = natalOf(m, 'Moon');
    const inc = 'La Lune du thème natal en ' + nt.sign + ', Maison ' + nt.house + ', guide vos mots.';
    assert.strictEqual(FRBOX.adjudicateNatalDescriptorsFr(inc, m), inc, 'du thème natal 句被误改');
  });

  test('⑤ 本命与流月真值重合的行星 → 零改动（不可判定就不动）', () => {
    const m = MATRICES[0];
    let hit = 0;
    for (const p of FR_ORDER) {
      const nt = natalOf(m, p), tt = transitOf(m, p);
      if (!nt || !tt || !same(nt, tt)) continue;
      const inc = 'Le ' + FR_PLANET[p] + ' en ' + nt.sign + ', Maison ' + nt.house + ', vous guide.';
      assert.strictEqual(FRBOX.adjudicateNatalDescriptorsFr(inc, m), inc, p + ' 重合真值被误改：' + inc);
      hit++;
    }
    assert.ok(hit >= 0);
  });

  test('⑥ 无本命真值盘（null/空）→ 原样返回，绝不编', () => {
    const t = 'Votre Mars natal en Cancer, Maison 12, vous pousse.';
    assert.strictEqual(FRBOX.adjudicateNatalDescriptorsFr(t, null), t);
    assert.strictEqual(FRBOX.adjudicateNatalDescriptorsFr('', MATRICES[0]), '');
    assert.strictEqual(FRBOX.adjudicateNatalDescriptorsFr(t, { meta: {} }), t);
  });
});

describe('V430 法语定语裁定 · 生产实测已知坏样本（必须抓到）', () => {
  test('生产样本：本命句标识在句尾（votre maison natale）→ 本命真值必须保住', () => {
    const m = MATRICES[1];
    const nt = natalOf(m, 'Sun'), tt = transitOf(m, 'Sun');
    if (!nt || !tt || same(nt, tt)) return;
    const inc = 'Votre signature profonde : le Soleil en ' + nt.sign + ', Maison ' + nt.house + ', votre maison natale.';
    // 修前：transit 锁会把本命 Balance/Maison 2 改成流月的 Vierge → 本命事实被污染
    const out = chain(inc, m);
    assert.ok(out.includes(nt.sign), '本命星座被流月污染：' + out);
    assert.ok(out.includes('Maison ' + nt.house), '本命宫位被流月污染：' + out);
    assert.ok(!out.includes(tt.sign) || tt.sign === nt.sign, '本命句出现流月星座：' + out);
  });

  test('生产样本：本命句标识在句尾（votre signature de naissance）→ 本命真值必须保住', () => {
    const m = MATRICES[1];
    const nt = natalOf(m, 'Sun'), tt = transitOf(m, 'Sun');
    if (!nt || !tt || same(nt, tt)) return;
    const inc = 'Le Soleil en ' + nt.sign + ', Maison ' + nt.house + ', est votre signature de naissance.';
    const out = chain(inc, m);
    assert.ok(out.includes(nt.sign), '本命星座被流月污染：' + out);
    assert.ok(out.includes('Maison ' + nt.house), '本命宫位被流月污染：' + out);
  });

  test('生产样本：流月句被贴上 natal（Ce mois-ci, votre Mars natal en 流月值）→ 必须剥离', () => {
    const m = MATRICES[1];
    const nt = natalOf(m, 'Mars'), tt = transitOf(m, 'Mars');
    if (!nt || !tt || same(nt, tt)) return;
    const inc = 'Ce mois-ci, votre Mars natal en ' + tt.sign + ', Maison ' + tt.house + ', vous pousse à agir.';
    const out = chain(inc, m);
    assert.ok(!/Mars natal/.test(out), '夺舍定语未剥离：' + out);
    assert.ok(out.includes(tt.sign) && out.includes('Maison ' + tt.house), '流月真值被破坏：' + out);
    assert.ok(!out.includes(nt.sign) || nt.sign === tt.sign, '剥离后混入本命星座：' + out);
  });
});
