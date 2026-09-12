// 🛠️ V432 回归门：en / es / zh 真值双锁（本命 + 流月 + 定语双向裁定）
//
// 【真值轴】真值**不手写**，全部由 astro_matrix 实算（getAstroMatrix → SwissEph）→ 杜绝「用自己写的常量验自己」
// 【不变量】
//   ① 幂等：锁两次 == 锁一次
//   ② 已知好样本必须零改动（正确本命句 / 正确流月句 / 无时序信息的入驻句）
//   ③ 已知坏样本必须抓到（A 夺舍定语 / B 丢标识 / C 值漂移 / 外文星座名泄漏）
//   ④ 十行星全覆盖（V431 血泪：覆盖率造假 = 通过率造假）
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
if (_from < 0 || _to <= _from) throw new Error('未能从 server.js 提取真值锁源码块');
const BLOCK = SRC.slice(_from, _to);

// 六个本地化星座表从 server.js 原文抽取（测试里绝不手写第二份真源）
const SIGNS = ['EN', 'VI', 'TH', 'ZH', 'ES', 'FR'].map((k) => {
  const m = SRC.match(new RegExp('const SUN_SIGN_' + k + ' = \\[[^\\]]*\\];'));
  if (!m) throw new Error('缺少 SUN_SIGN_' + k);
  return m[0];
}).join('\n');

const F = new Function(`${SIGNS}\n${BLOCK}\nreturn { applyTruthLocksEnEsZh, _v432Truth, _v432Normalize, _V432_LANGS, _V432_NAME, _v432AllSignWords, _V432_CFG };`)();

const CASE = { birthDate: '1989-11-12', birthTime: '02:00', lat: 39.9042, lon: 116.4074, tz: 'Asia/Shanghai' };
let M = null;
before(async () => { M = await getAstroMatrix(CASE.birthDate, CASE.birthTime, CASE.lat, CASE.lon, CASE.tz); });

// 注意：行星名一律用**本地化名**（'Sol' / '太阳'），与真值盘键一致
const planets = (lang) => Object.values(F._V432_NAME[lang]);
const nTruth = (lang, p) => (F._v432Truth(lang, M, 'natal') || {})[p];
const tTruth = (lang, p) => (F._v432Truth(lang, M, 'transit') || {})[p];
const lock = (text, lang) => F.applyTruthLocksEnEsZh(text, lang, M);
const cfgOf = (lang) => F._V432_CFG[lang];

// 找一个「本命真值与流月真值不同」的行星（否则用例无判定力）
function pickPlanet(lang) {
  for (const p of planets(lang)) {
    const n = nTruth(lang, p), t = tTruth(lang, p);
    if (!n || !t) continue;
    if (n.sign !== t.sign || n.house !== t.house) return p;
  }
  throw new Error(lang + ' 找不到本命/流月真值不同的行星（测试失去判定力）');
}
const otherSign = (lang, avoid) => F._v432AllSignWords(lang).slice(0, 12).find((s) => s !== avoid);
const otherHouse = (t) => (t.house === 1 ? 2 : 1);

// 句式工厂（各语言真实书写习惯：en/zh 定语前置，es 定语后置）
const fb = {
  en: {
    natal: (p, s, h) => `Your natal ${p} in ${s}, House ${h}.`,
    transit: (p, s, h) => `The transiting ${p} in ${s}, House ${h}.`,
    descNatal: (p, s, h) => `${p} natal in ${s}, House ${h}.`,
    bare: (p, s, h) => `Your ${p} in ${s}, House ${h}.`,
    ingress: (p, s, h) => `The ${p} enters ${s}, House ${h}.`,
  },
  es: {
    natal: (p, s, h) => `Su ${p} natal en ${s}, Casa ${h}.`,
    transit: (p, s, h) => `El ${p} en transito en ${s}, Casa ${h}.`,
    descNatal: (p, s, h) => `El ${p} natal en ${s}, Casa ${h}.`,
    bare: (p, s, h) => `El ${p} en ${s}, Casa ${h}.`,
    ingress: (p, s, h) => `El ${p} entra en ${s}, Casa ${h}.`,
  },
  zh: {
    natal: (p, s, h) => `本命${p}在${s} 第${h}宫。`,
    transit: (p, s, h) => `流年${p}在${s} 第${h}宫。`,
    descNatal: (p, s, h) => `本命${p}在${s} 第${h}宫。`,
    bare: (p, s, h) => `${p}在${s} 第${h}宫。`,
    ingress: (p, s, h) => `${p}进入${s} 第${h}宫。`,
  },
};

// 期望形式工厂：A 类只剥定语（不加流月标识），B 类只补本命标识
const expectA = {
  en: (p, s, h) => `${p} in ${s}, House ${h}.`,
  es: (p, s, h) => `El ${p} en ${s}, Casa ${h}.`,
  zh: (p, s, h) => `${p}在${s} 第${h}宫。`,
};
const expectB = {
  en: (p, s, h) => `Your natal ${p} in ${s}, House ${h}.`,
  es: (p, s, h) => `El ${p} natal en ${s}, Casa ${h}.`,
  zh: (p, s, h) => `本命${p}在${s} 第${h}宫。`,
};

for (const lang of ['en', 'es', 'zh']) {
  describe(`V432 ${lang} 真值双锁`, () => {
    test('self_test：已知好样本零改动 + 已知坏样本必抓 + 幂等', () => {
      const p = pickPlanet(lang);
      const N = nTruth(lang, p), T = tTruth(lang, p);
      const f = fb[lang];
      const W = otherSign(lang, T.sign), WH = otherHouse(T);

      // [输入, 期望输出(null=必须零改动), 说明]
      const cases = [
        // ── 已知好样本（必须零改动）──
        [f.natal(p, N.sign, N.house), null, '好样本：正确本命句'],
        [f.transit(p, T.sign, T.house), null, '好样本：正确流月句'],
        [f.ingress(p, T.sign, T.house), null, '好样本：入驻句（无时序信息→锁不动）'],
        // ── 已知坏样本（必须抓到）──
        [f.descNatal(p, T.sign, T.house), expectA[lang](p, T.sign, T.house), '坏样本 A：本命定语贴在流月值上（夺舍）'],
        [f.bare(p, N.sign, N.house), expectB[lang](p, N.sign, N.house), '坏样本 B：本命事实丢标识'],
        [f.transit(p, W, WH), f.transit(p, T.sign, T.house), '坏样本 C：流月句星座/宫位漂移（值归真）'],
      ];

      const fails = [];
      for (const [input, expect, label] of cases) {
        const want = expect === null ? input : expect;
        const out = lock(input, lang);
        if (out !== want) fails.push(`${label}\n   输入: ${input}\n   期望: ${want}\n   实际: ${out}`);
        const twice = lock(out, lang);
        if (twice !== out) fails.push(`${label} → 幂等失败\n   二次锁: ${twice}`);
      }
      assert.deepStrictEqual(fails, [], 'self_test 失败：\n  ' + fails.join('\n  '));
    });

    test('九行星流月全覆盖 + 月亮整星排除（防反向污染）', () => {
      const f = fb[lang];
      const tt = F._v432Truth(lang, M, 'transit');
      const nt = F._v432Truth(lang, M, 'natal');
      const moon = Object.values(F._V432_NAME[lang]).find((n) => /moon|luna|lune|月/i.test(n));
      assert.ok(!tt[moon], `${moon} 不得进入流月真值（月初快照代表不了月内换宫）`);
      assert.ok(nt[moon], `${moon} 必须仍在本命真值（本命月亮是出生锁定的固定事实）`);
      let covered = 0;
      const misses = [];
      for (const p of planets(lang)) {
        const t = tt[p];
        if (!t || !t.sign || !t.house) continue;
        const out = lock(f.transit(p, otherSign(lang, t.sign), otherHouse(t)), lang);
        const want = f.transit(p, t.sign, t.house);
        if (out === want) covered++;
        else misses.push(`${p}: ${out} （期望 ${want}）`);
      }
      assert.deepStrictEqual(misses, [], '流月值归真失败：\n  ' + misses.join('\n  '));
      assert.ok(covered >= 9, `行星覆盖数 ${covered} < 9`);
    });

    test('带明确日期的句子：流月值锁不得介入（月初快照≠该日真值）', () => {
      const p = pickPlanet(lang);
      const T = tTruth(lang, p);
      const f = fb[lang];
      const W = otherSign(lang, T.sign);
      const DATE = { en: ', on September 27', es: ', el 27 de septiembre', zh: '，9月27日' }[lang];
      // 同句带日期 → 原文不动（正确信号）——日期必须插在句末标点**之前**（否则落在窗口外，测不到守卫）
      const dated = f.transit(p, W, otherHouse(T)).replace(/([.。])$/, DATE + '$1');
      assert.ok(cfgOf(lang).dateMark.test(dated), '测试样本构造失败：日期未被识别 → ' + dated);
      assert.strictEqual(lock(dated, lang), dated, '带日期句被改动（反向污染风险）');
      // 不带日期 → 必须归真（证明锁本身仍有效，非整体失效）
      const undated = f.transit(p, W, otherHouse(T));
      assert.strictEqual(lock(undated, lang), f.transit(p, T.sign, T.house), '无日期句未被归真');
    });

    test('入驻句日号不跳句：只能读本句日期（防用后句日号判错向）', () => {
      const p = pickPlanet(lang);
      const T = tTruth(lang, p);
      const f = fb[lang];
      const signsOf = F._v432AllSignWords(lang).slice(0, 12);
      const zi = signsOf.indexOf(T.sign);
      const nextSign = zi >= 0 ? signsOf[(zi + 1) % 12] : null;
      const W = signsOf.find((s) => s !== T.sign && s !== nextSign);
      assert.ok(W && nextSign, '取不到可用错值/下月星座');
      const DATE = { en: 'on September 1', es: 'el 1 de septiembre', zh: '9月1日' }[lang];
      const LATER = { en: ' Peak: Day 27 brings a shift.', es: ' Clave: Día 27 trae un cambio.', zh: ' 关键：第27天带来转折。' }[lang];
      const head = f.ingress(p, W, T.house).replace(/([.。])$/, ' ' + DATE + '$1');
      const text = head + ' ' + LATER;
      const out = lock(text, lang);
      // 本句日期=1 → 月初判向（当月星座）：修对时不得被后句 Day 27 带去下月星座
      assert.ok(!out.includes(nextSign), `被后句日号带偏到下月星座 ${nextSign}: ${out}`);
      assert.ok(out.includes(W) || out.includes(T.sign), '入驻句被改成了不可识别形态: ' + out);
    });

    test('本命/流月隔离：纯流月句与纯本命句都不得被改动', () => {
      const p = pickPlanet(lang);
      const N = nTruth(lang, p), T = tTruth(lang, p);
      const f = fb[lang];
      const transitOnly = f.transit(p, T.sign, T.house);
      const natalOnly = f.natal(p, N.sign, N.house);
      assert.strictEqual(lock(transitOnly, lang), transitOnly, '流月句被改动');
      assert.strictEqual(lock(natalOnly, lang), natalOnly, '本命句被改动');
    });
  });
}

describe('V432 外文星座名归真（es/zh 防英文泄漏）', () => {
  test('es：英文全称 → 西语本地名', () => {
    const out = F._v432Normalize('El Sol en Taurus, Casa 3. Marte en Gemini, Casa 7.', 'es');
    assert.strictEqual(out, 'El Sol en Tauro, Casa 3. Marte en Géminis, Casa 7.');
    assert.strictEqual(F._v432Normalize(out, 'es'), out, '归真不幂等');
  });
  test('zh：英文全称 → 中文本地名', () => {
    const out = F._v432Normalize('太阳在Taurus 第3宫。火星在Gemini 第7宫。', 'zh');
    assert.strictEqual(out, '太阳在金牛座 第3宫。火星在双子座 第7宫。');
    assert.strictEqual(F._v432Normalize(out, 'zh'), out, '归真不幂等');
  });
  test('en：不需要归真（英文即真值语言），原文不动', () => {
    const t = 'The transiting Sun in Libra, House 6.';
    assert.strictEqual(F._v432Normalize(t, 'en'), t);
  });
});

describe('V432 安全边界', () => {
  test('无真值盘 → 原文透传（绝不编）', () => {
    const t = '本命太阳在白羊座 第1宫。';
    assert.strictEqual(F.applyTruthLocksEnEsZh(t, 'zh', null), t);
    assert.strictEqual(F.applyTruthLocksEnEsZh(t, 'zh', {}), t);
  });
  test('非目标语种 → 原文透传（vi/th/fr 不受本引擎干扰）', () => {
    const t = 'Mặt Trời natal ở Bạch Dương Nhà 1';
    assert.strictEqual(F.applyTruthLocksEnEsZh(t, 'vi', M), t);
    assert.strictEqual(F.applyTruthLocksEnEsZh(t, 'fr', M), t);
    assert.strictEqual(F.applyTruthLocksEnEsZh(t, 'th', M), t);
  });
  test('空文本 / 无行星文本零改动', () => {
    assert.strictEqual(F.applyTruthLocksEnEsZh('', 'en', M), '');
    const plain = 'Financial discipline builds lasting wealth this month.';
    assert.strictEqual(lock(plain, 'en'), plain);
  });
});
