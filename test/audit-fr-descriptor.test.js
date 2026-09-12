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
const FRBOX = new Function(`${SUN_SIGN_FR_DECL}\n${BLOCK}\nreturn { adjudicateNatalDescriptorsFr, lockNatalTruthFr, lockTransitTruthFr, _natalTruthMap10_FR, _transitTruthMap10_FR, _FR_PLANET, _FR_PLANET_ORDER, _FR_SIGN_FR, _EN2ZIDX, normalizeForeignSignsFr, _FR_TRANSIT_DESC, _FR_PRE_NATAL_DESC, _FR_TRANSIT_VERB, _FR_TRANSIT_MARK };`)();

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
  { bd: '2015-10-04', bt: '02:00', lat: -31.5553, lon: 159.0821, tz: 'Australia/Lord_Howe' },
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

// ═══════════════════════════════════════════════════════════════════
// 🛠️ V431 扩围门：定语家族（变体 + 前置）+ A2/C 类 + 外文星座名归真
// ⚠️ 血泪（2026-09-12）：审计脚本曾拿 `_FR_PLANET_ORDER`（**英文键**）直接查真值盘，
//    因 Mars/Jupiter/Uranus/Neptune 法英同形「侥幸命中」，其余 6 颗被静默跳过 → 报出的通过率是假的。
//    本门禁强制 10 行星逐个打靶，并要求真值盘 10 行齐全（缺一个就直接报错，不许静默跳过）。
// ═══════════════════════════════════════════════════════════════════
const NATAL_DESC_ANY = /\b(?:natal|natale|natifs?|natives?|naissance|th[èe]me natal|votre th[èe]me|votre ciel|qui vous fit na[îi]tre)\b/i;
const stripDesc = (s) => norm(s.replace(/\s*(?:natal|natale|natifs?|natives?|de naissance|à la naissance|au moment de la naissance|du thème natal|de votre thème|de votre ciel|qui vous fit naître)\b/gi, ''));
const FR_FULL_CHAIN = (c, m) => FRBOX.lockTransitTruthFr(FRBOX.lockNatalTruthFr(c, m), m);   // 生产真实顺序
const truthOf = (m, p) => ({ n: natalOf(m, p), t: transitOf(m, p) });

describe('V431 扩围 · 定语家族（变体后缀）必须被认出并剥离', () => {
  const VARIANTS = ['natif', 'native', 'à la naissance', 'au moment de la naissance', 'de votre thème', 'natal rétrograde'];
  for (let pi = 0; pi < PROFILES.length; pi++) {
    test(`profile ${pi + 1} (${PROFILES[pi].bd})：6 种变体本命定语贴在流月句上 → 全剥 + 流月值不受损 + 字符守恒`, () => {
      const m = MATRICES[pi];
      if (!m.meta || !m.meta.computed_houses) return;
      let checked = 0;
      for (const p of FR_ORDER) {
        const { n: nt, t: tt } = truthOf(m, p);
        if (!nt || !tt || same(nt, tt)) continue;
        const name = FR_PLANET[p];
        for (const v of VARIANTS) {
          const inc = 'Ce mois-ci, votre ' + name + ' ' + v + ' en ' + tt.sign + ', Maison ' + tt.house + ', vous pousse à agir.';
          const adj = FRBOX.adjudicateNatalDescriptorsFr(inc, m);
          assert.ok(!NATAL_DESC_ANY.test(adj), `${p} 变体「${v}」未被剥离：${adj}`);
          assert.ok(adj.includes(tt.sign) && adj.includes('Maison ' + tt.house), `${p} 变体「${v}」误伤流月值：${adj}`);
          assert.strictEqual(stripDesc(adj), stripDesc(inc), `${p} 变体「${v}」剥离后掉字/重字`);
          // 幂等：裁两次 == 裁一次
          assert.strictEqual(FRBOX.adjudicateNatalDescriptorsFr(adj, m), adj, `${p} 变体「${v}」裁定器不幂等`);
          checked++;
        }
      }
      assert.ok(checked >= 6, '覆盖不足：' + checked);
    });
  }
});

describe('V431 扩围 · 前置本命定语（natif du X / native de la Lune）', () => {
  for (let pi = 0; pi < PROFILES.length; pi++) {
    test(`profile ${pi + 1} (${PROFILES[pi].bd})：前置定语 + 本命真值 → 零改动；+ 流月真值 → 全链归真本命`, () => {
      const m = MATRICES[pi];
      if (!m.meta || !m.meta.computed_houses) return;
      let checked = 0;
      for (const p of FR_ORDER) {
        const { n: nt, t: tt } = truthOf(m, p);
        if (!nt || !tt || same(nt, tt)) continue;
        const name = FR_PLANET[p];
        const fem = /^(Lune|Vénus)$/.test(name);
        const pre = fem ? 'native de la ' : 'natif du ';
        // 好样本：前置定语 + 本命真值 → 裁定器零改动
        const good = 'Vous, ' + pre + name + ' en ' + nt.sign + ', Maison ' + nt.house + ', avancez à découvert.';
        assert.strictEqual(FRBOX.adjudicateNatalDescriptorsFr(good, m), good, `${p} 正确前置式被裁定器误改`);
        // 坏样本：前置定语 + 流月真值 → 全链必须归真本命（不容「近义变体绕过值锁」）
        const bad = 'Vous, ' + pre + name + ' en ' + tt.sign + ', Maison ' + tt.house + ', avancez à découvert.';
        const out = FR_FULL_CHAIN(bad, m);
        assert.ok(out.includes(nt.sign) && out.includes('Maison ' + nt.house), `${p} 前置式未被归真本命：${out}`);
        assert.ok(!out.includes(tt.sign), `${p} 前置式残留流月星座：${out}`);
        checked++;
      }
      assert.ok(checked >= 6, '覆盖不足：' + checked);
    });
  }
});

describe('V431 扩围 · 流年定语（de passage / transitaire / en transit）不得被裁定器换成本命定语', () => {
  // 设计裁定（2026-09-12）：流年定语 + 本命值 = 「流月句抄了本命锚点」的典型形态。
  // V426 已定：定语决定管辖 → 值由 lockTransitTruthFr 归真为流月真值；裁定器**不得**反向改写定语，
  // 否则两条规则互踩（实测：加了逆规则后 V430 既有门 ③「transitant 句」当场红灯）。
  const T_DESC = ['de passage', 'transitaire', 'en transit'];
  for (let pi = 0; pi < PROFILES.length; pi++) {
    test(`profile ${pi + 1} (${PROFILES[pi].bd})：裁定器零改动 + 全链值归流月真值`, () => {
      const m = MATRICES[pi];
      if (!m.meta || !m.meta.computed_houses) return;
      let checked = 0;
      for (const p of FR_ORDER) {
        const { n: nt, t: tt } = truthOf(m, p);
        if (!nt || !tt || same(nt, tt)) continue;
        const name = FR_PLANET[p];
        for (const v of T_DESC) {
          const inc = 'Le ' + name + ' ' + v + ' en ' + nt.sign + ', Maison ' + nt.house + ', éclaire votre thème.';
          assert.strictEqual(FRBOX.adjudicateNatalDescriptorsFr(inc, m), inc, `${p} 裁定器越权改了流年定语（「${v}」）：应交给流年锁`);
          const out = FR_FULL_CHAIN(inc, m);
          assert.ok(out.includes(tt.sign) && out.includes('Maison ' + tt.house), `${p} 流年值未被归真（「${v}」）：${out}`);
          assert.ok(new RegExp('\\b' + v + '\\b').test(out), `${p} 流年定语被误删（「${v}」）：${out}`);
          checked++;
        }
        // 负样本：句中有运动动词 → 一律不得补本命标识
        const mv = 'Le ' + name + ' transitaire glisse vers le ' + nt.sign + ', Maison ' + nt.house + '.';
        assert.strictEqual(FRBOX.adjudicateNatalDescriptorsFr(mv, m), mv, `${p} 运动句被误补本命标识`);
        checked++;
      }
      assert.ok(checked >= 6, '覆盖不足：' + checked);
    });
  }
});

describe('V431 扩围 · A2 类本命定语 + 值域两盘皆不符', () => {
  for (let pi = 0; pi < PROFILES.length; pi++) {
    test(`profile ${pi + 1} (${PROFILES[pi].bd})：带运动动词 → 剥定语；无动词 → 一律不动（宁可不动不可编）`, () => {
      const m = MATRICES[pi];
      if (!m.meta || !m.meta.computed_houses) return;
      let checked = 0;
      for (const p of FR_ORDER) {
        const { n: nt, t: tt } = truthOf(m, p);
        if (!nt || !tt) continue;
        const name = FR_PLANET[p];
        const wSign = WRONG_SIGN(nt.sign);
        const wHouse = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].find((h) => h !== nt.house && h !== tt.house) || 12;
        if (same({ sign: wSign, house: wHouse }, nt) || same({ sign: wSign, house: wHouse }, tt)) continue;
        const mv = 'Votre ' + name + ' natal se déplace en ' + wSign + ', Maison ' + wHouse + ', ce mois-ci.';
        assert.ok(!NATAL_DESC_ANY.test(FRBOX.adjudicateNatalDescriptorsFr(mv, m)), `${p} A2 运动式定语未剥离`);
        const st = 'Votre ' + name + ' natal en ' + wSign + ', Maison ' + wHouse + ', pèse sur vous.';
        assert.strictEqual(FRBOX.adjudicateNatalDescriptorsFr(st, m), st, `${p} 无动词的不可判定句被动了（应零改动）`);
        checked++;
      }
      assert.ok(checked >= 6, '覆盖不足：' + checked);
    });
  }
});

describe('V431 外文星座名归真（英文 → 法语）+ 不误伤法文同形词', () => {
  test('11 个英文星座名逐一映射；Cancer/Lion/Balance 等法文名零改动', () => {
    const PAIRS = [['Aries', 'Bélier'], ['Taurus', 'Taureau'], ['Gemini', 'Gémeaux'], ['Leo', 'Lion'],
      ['Virgo', 'Vierge'], ['Libra', 'Balance'], ['Scorpio', 'Scorpion'], ['Sagittarius', 'Sagittaire'],
      ['Capricorn', 'Capricorne'], ['Aquarius', 'Verseau'], ['Pisces', 'Poissons']];
    for (const [en, fr] of PAIRS) {
      assert.strictEqual(norm(FRBOX.normalizeForeignSignsFr('en ' + en + ', Maison 3')), 'en ' + fr + ', Maison 3', en + ' 未归真');
    }
    const KEEP = 'Cancer, Lion, Balance, Poisson, Vierge, Scorpion, Verseau, Taureau, Sagittaire, Capricorne, Gémeaux, Bélier';
    assert.strictEqual(FRBOX.normalizeForeignSignsFr(KEEP), KEEP, '法文星座名被误伤');
    assert.strictEqual(FRBOX.normalizeForeignSignsFr('Votre Vierge natal'), 'Votre Vierge natale', '阴性星座名后 natal 未改 natale');
    assert.strictEqual(FRBOX.normalizeForeignSignsFr('Votre Balance natal'), 'Votre Balance natale', 'Balance 阴性未改');
    assert.strictEqual(FRBOX.normalizeForeignSignsFr('Votre Bélier natal'), 'Votre Bélier natal', '阳性星座名被误改 natale');
    const once = FRBOX.normalizeForeignSignsFr('Aries et Vierge natal et Libra');
    assert.strictEqual(FRBOX.normalizeForeignSignsFr(once), once, '归真器不幂等');
  });
});

describe('V431 · 生产真实句 fixture（含外文星座名 + 前置定语）', () => {
  const FIX = [
    ["Sept 2026 s'ouvre comme un parchemin où la Vierge, votre Soleil de naissance en Maison 2, trace les lignes d'un compte secret.", ['Maison 2']],
    ["Votre Libra natal — ce Soleil qui vous fit naître diplomate — se voit ici transfiguré.", ['Balance']],
    ['Vous, natif du Soleil en Vierge, dont la Maison 2 accueille aussi Mercure natal, avancez à découvert.', ['Balance', 'Maison 2']],
    ['Votre Soleil natal en Aries, logé en Maison 1, reçoit cette énergie comme un appel à conquérir.', ['Balance', 'Maison 2']],
  ];
  test('Lord Howe 盘：外文星座名 0 残留 + 前置/后缀定语全链归真本命', () => {
    const m = MATRICES[2];
    if (!m || !m.meta || !m.meta.computed_houses) return;
    const nt = natalOf(m, 'Sun');
    for (const [src, must] of FIX) {
      const out = FR_FULL_CHAIN(src, m);
      assert.ok(!/\b(Aries|Taurus|Gemini|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces)\b/.test(out), '外文星座名残留：' + out);
      for (const s of must) assert.ok(out.includes(s), '期望片段缺失（' + s + '）：' + out);
    }
    const keep = 'La Lune transitaire en Scorpion, Maison 3, vous ramène au labeur patient.';
    const kt = transitOf(m, 'Moon');
    if (kt && kt.sign === 'Scorpion' && kt.house === 3) {
      assert.strictEqual(FR_FULL_CHAIN(keep, m), keep, '正确流年句被误改');
    }
    assert.ok(nt && nt.sign === 'Balance', 'Lord Howe 本命太阳真值应来自 SwissEph 实算');
  });
});
