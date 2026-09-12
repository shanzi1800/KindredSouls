// 🛠️ V434-2 回归门：全范围月亮声明一致性硬锁（非周段落盲区）
//
// 【病根】V433 月亮锁只处理「带周号」段落；无周号段落（概览/陷阱/✦ 前言）无人管辖。
//   ⚠️ 关键真相：月亮 27.3 天走完黄道 → **任何月份的真值并集都等于全黄道 12 座**。
//   因此「并集外星座」这条支路在生产中**永不触发**（用 3 星座 mock 自证 = 假自证）。
//   真会触发的是「持续性声明」：月亮 ~2.5 天换一座，**绝不可能整月停留某座** → 该声明必假。
//
// 【本套件验什么】
//   ① 非周段落持续性声明必纠：换成瑞士星历算出的真实轨迹（可证伪 → 必纠）
//   ② 零漂移：无持续性声明的正常概览句一字不动
//   ③ 隔离性：带周号段落归 V433，V434 绝不侵入
//   ④ 本命月亮不动
//   ⑤ 幂等
//   ⑥ 无真值盘 / 空盘 → 原文透传
//   ⑦ 兜底支路：并集外星座 → 主导星座（附人工部分并集 fixture）
//   ⑧ 统一入口串联
import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
const _from = SRC.indexOf('const _EN2ZIDX');
const _to = SRC.indexOf('function cleanConsumerTrapAndBrackets');
if (_from < 0 || _to < 0 || _to <= _from) throw new Error('提取 V434 锁源码块失败');
const BLOCK = SRC.slice(_from, _to);
const SIGNS = ['EN', 'ES', 'ZH', 'FR', 'TH', 'VI'].map((k) => {
  const m = SRC.match(new RegExp('const SUN_SIGN_' + k + '\\s*=\\s*\\[[^\\]]*\\];'));
  return m ? m[0] : '';
}).join('\n');
const F = new Function(`${SIGNS}\n${BLOCK}\nreturn { _v434LockGlobalMoonScope, applyV434Locks };`)();

// 真实形态真值盘：月亮一个月走遍 12 座（并集 = 全黄道）
const ORDER = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const weeksAll = [0, 1, 2, 3].map((wi) => ({
  week: wi + 1,
  legs: ORDER.slice(wi * 3, wi * 3 + 3).map((s, i) => ({ sign: s, house: ((wi * 3 + i) % 12) + 1 })),
}));
const astro = { months: [{ moon_weeks: weeksAll }] };

describe('V434-2：全范围月亮声明一致性硬锁（Global Moon Scope）', () => {
  test('① 非周段落「整月停留」持续性声明必纠 → 换成真实轨迹', () => {
    const zh = '✦ [🔮 本月命运主题] ✦\n\n本月月亮主要停留在天蝎座（第6宫），带来情绪起伏。';
    const outZh = F._v434LockGlobalMoonScope(zh, 'zh', astro);
    assert.notEqual(outZh, zh, 'zh 持续性声明未纠');
    assert.ok(!outZh.includes('主要停留'), 'zh 假声明残留: ' + outZh);
    assert.ok(outZh.includes('本月依次经过'), 'zh 未换成真实轨迹: ' + outZh);

    const en = '✦ [🔮 Theme] ✦\n\nThis month the Moon stays in Scorpio, House 3. It shapes your mood.';
    const outEn = F._v434LockGlobalMoonScope(en, 'en', astro);
    assert.notEqual(outEn, en, 'en 持续性声明未纠');
    assert.ok(!outEn.includes('stays in'), 'en 假声明残留: ' + outEn);
    assert.ok(outEn.includes('travels through'), 'en 未换成真实轨迹: ' + outEn);

    const es = '✦ [🔮 Tema] ✦\n\nLa Luna permanece en Tauro todo el mes.';
    const outEs = F._v434LockGlobalMoonScope(es, 'es', astro);
    assert.notEqual(outEs, es, 'es 持续性声明未纠');
    assert.ok(outEs.includes('recorre este mes'), 'es 未换成真实轨迹: ' + outEs);
  });

  test('② 零漂移：无持续性声明的正常概览句一字不动', () => {
    const cases = [
      { lang: 'zh', t: '✦ [🔮 主题] ✦\n\n本月月亮会经过金牛座第8宫。' },
      { lang: 'en', t: '✦ [🔮 Theme] ✦\n\nThis month the Moon spends time in Taurus, House 8.' },
      { lang: 'es', t: '✦ [🔮 Tema] ✦\n\nLa Luna pasa por Tauro, Casa 8.' },
    ];
    for (const c of cases) {
      assert.equal(F._v434LockGlobalMoonScope(c.t, c.lang, astro), c.t, `[${c.lang}] 正常概览句被改动`);
    }
  });

  test('③ 隔离性：带周号段落归 V433，V434 绝不侵入', () => {
    const t = '✦ [🟢 Week 1: Sep 1–7] Boost\nMoon in Scorpio, House 6.';
    assert.equal(F._v434LockGlobalMoonScope(t, 'en', astro), t, 'V434 侵入了周级段落');
    const zh = '✦ [🟢 第1周: 9月1–7日] 复苏\n本月月亮主要停留在天蝎座第6宫。';
    assert.equal(F._v434LockGlobalMoonScope(zh, 'zh', astro), zh, 'V434 侵入了中文周级段落');
  });

  test('④ 本命月亮不动（前置定语）', () => {
    const t = '✦ [🔮 Theme] ✦\n\nYour natal Moon stays in Scorpio, House 6, shaping your instincts.';
    assert.equal(F._v434LockGlobalMoonScope(t, 'en', astro), t, '本命月亮被误改');
    const zh = '✦ [🔮 主题] ✦\n\n你的本命月亮整月停留在天蝎座第6宫。';
    assert.equal(F._v434LockGlobalMoonScope(zh, 'zh', astro), zh, '中文本命月亮被误改');
  });

  test('⑤ 幂等', () => {
    const t = '✦ [🔮 主题] ✦\n\n本月月亮主要停留在天蝎座（第6宫）。';
    const once = F._v434LockGlobalMoonScope(t, 'zh', astro);
    assert.equal(F._v434LockGlobalMoonScope(once, 'zh', astro), once, '非幂等');
  });

  test('⑥ 无真值盘 / 空盘 → 原文透传', () => {
    const t = '✦ [🔮 主题] ✦\n\n本月月亮主要停留在天蝎座。';
    assert.equal(F._v434LockGlobalMoonScope(t, 'zh', null), t);
    assert.equal(F._v434LockGlobalMoonScope(t, 'zh', {}), t);
    assert.equal(F._v434LockGlobalMoonScope(t, 'zh', { months: [] }), t);
    assert.equal(F._v434LockGlobalMoonScope(t, 'zh', { months: [{ moon_weeks: [] }] }), t);
  });

  test('⑦ 兜底支路：并集外星座 → 主导星座（人工部分并集 fixture）', () => {
    const partial = { months: [{ moon_weeks: [
      { week: 1, legs: [{ sign: 'Aries', house: 7 }, { sign: 'Aries', house: 8 }, { sign: 'Taurus', house: 8 }] },
    ] }] };
    const t = '✦ [🔮 Theme] ✦\n\nThis month the Moon crosses Scorpio, House 6.';
    const out = F._v434LockGlobalMoonScope(t, 'en', partial);
    assert.ok(out.includes('Aries') && !out.includes('Scorpio'), '并集外星座未归正: ' + out);
  });

  test('⑧ applyV434Locks 统一入口：月亮锁 + 修饰词锁串联生效', () => {
    const t = '✦ [🔮 主题] ✦\n\n本月月亮主要停留在天蝎座（第6宫）。太阳（逆行中）进入第4宫。';
    const out = F.applyV434Locks(t, 'zh', astro);
    assert.ok(out.includes('本月依次经过'), '入口未串月亮锁: ' + out);
    assert.ok(out.includes('太阳进入第4宫'), '入口未串修饰词锁: ' + out);
  });
});
