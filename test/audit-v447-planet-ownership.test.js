// 🛡️ V447/V448 回归门：真值锁的「星座归属守卫」——锁绝不得改写属于别的实体的星座
//
// 【病根】2026-09-15 生产实测（1989-12-31 zh 月报）三颗炸弹，均由本套件看门：
//   ① _v433LockMoonWeek 以「月亮关键词 ±40/+110 字符」扫窗 → 把同周正文里**其他行星**的星座
//      （如「流年太阳在处女座第6宫」）误判为「越界月亮星座」抹成本周首个真值（白羊座/第1宫）；
//      该锁被多层链反复调用 → 污染雪崩（用户实测：全篇流年行星变白羊座）
//   ② 窗口右界 mo+110 未夹紧「段（周）」边界 → 本周末尾的月亮关键词把【下一周】的星座拉进窗口，
//      再用本周真值去改下一周（实测：W2 首行狮子座 被 W1 真值改成 白羊座/第1宫）
//   ③ _v432PatchZone 在窗内已有本行星正确星座时，仍改写窗内并列锁点的星座
//      （「本命太阳在摩羯座第10宫，上升白羊座」的 白羊座 被太阳真值 摩羯座 吃掉 = 张冠李戴）
//
// 【设计哲学】宁可漏改，不可编（漏改有 Prompt/V444 锚点锁兜底；误改不可逆）
import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
const _from = SRC.indexOf('const _EN2ZIDX');
const _to = SRC.indexOf('function cleanConsumerTrapAndBrackets');
if (_from < 0 || _to < 0 || _to <= _from) throw new Error('提取 V432/V433 锁源码块失败');
const BLOCK = SRC.slice(_from, _to);
const SIGNS = ['EN', 'ES', 'ZH', 'FR', 'TH', 'VI'].map((k) => {
  const m = SRC.match(new RegExp('const SUN_SIGN_' + k + '\\s*=\\s*\\[[^\\]]*\\];'));
  return m ? m[0] : '';
}).join('\n');
const F = new Function(`${SIGNS}\n${BLOCK}\nreturn { _v433LockMoonWeek, _v432LockNatal };`)();

// W1=Aries1/Taurus1-2 ; W2=Cancer5/Leo5-6/Virgo6（与生产 1989-12-31 真值同构）
const weeks = [
  { week: 1, legs: [{ sign: 'Aries', house: 1 }, { sign: 'Taurus', house: 1 }, { sign: 'Taurus', house: 2 }] },
  { week: 2, legs: [{ sign: 'Cancer', house: 5 }, { sign: 'Leo', house: 5 }, { sign: 'Leo', house: 6 }, { sign: 'Virgo', house: 6 }] },
];
const astro = { months: [{ moon_weeks: weeks }] };

describe('V447：月亮周级锁的「星座归属守卫」', () => {
  test('⑰ 不得改写同周正文里其他行星的星座（流年太阳在处女座 → 必须保留）', () => {
    const inp = '✦ [🟢 第1周：9月1日–7日]\n月亮进入白羊座（第1宫）后，流年太阳在处女座第6宫照亮你的工作。';
    const out = F._v433LockMoonWeek(inp, 'zh', astro);
    assert.ok(out.includes('流年太阳在处女座第6宫'), '其他行星星座被月亮锁误改（归属守卫失效）: ' + out);
    assert.ok(!out.includes('流年太阳在白羊座'), '其他行星被抹成本周首个真值: ' + out);
    assert.equal(out, inp, '本输入无越界月亮星座 → 必须零改动: ' + out);
  });

  test('⑱ 窗口不得跨周段（下一周星座不得被本周真值改写）', () => {
    const inp = '✦ [🟢 第1周：9月1日–7日]\n28日月亮进入金牛座第1宫。\n✦ [🔴 第2周：9月8日–14日]\n月亮行经巨蟹座（第5宫）、狮子座（第5宫→第6宫）。';
    const out = F._v433LockMoonWeek(inp, 'zh', astro);
    assert.ok(out.includes('狮子座（第5宫→第6宫）'), '跨周误改（W2 星座被 W1 真值抹掉）: ' + out);
    assert.ok(!out.includes('白羊座（第1宫）、狮子'), '跨周污染: ' + out);
    assert.equal(out, inp, '段内均合法 → 必须零改动: ' + out);
  });

  test('⑲ 幂等：连过三次必须不动点', () => {
    const inp = '✦ [🟢 第1周：9月1日–7日]\n月亮进入白羊座（第1宫）后，流年太阳在处女座第6宫照亮你的工作。';
    let x = inp;
    for (let i = 0; i < 3; i++) x = F._v433LockMoonWeek(x, 'zh', astro);
    assert.equal(x, inp, '非幂等（多层链会滚雪球）: ' + x);
  });
});

describe('V448：本命锁不得张冠李戴（并列锚点的星座归属）', () => {
  const natalAstro = {
    meta: {
      sun_sign: 'Capricorn',
      rising_sign: 'Aries',
      computed_houses: {
        Sun: { sign: 'Capricorn', house: 10 },
        Moon: { sign: 'Aquarius', house: 11 },
        Mercury: { sign: 'Capricorn', house: 10 },
      },
      natal_moon: { sign: 'Aquarius', house: 11 },
    },
    months: [{}],
  };

  test('⑳ 「上升白羊座」不得被本命太阳真值（摩羯座）吃掉', () => {
    const inp = '你的本命太阳在摩羯座第10宫，上升白羊座，本命月亮在水瓶座第11宫。';
    const out = F._v432LockNatal(inp, 'zh', natalAstro);
    assert.ok(out.includes('上升白羊座'), '上升星座被本命太阳真值改写（张冠李戴）: ' + out);
    assert.equal(out, inp, '全文已正确 → 必须零改动: ' + out);
  });

  test('㉑ 真值错时仍必须纠（守卫不得把锁改成空转）', () => {
    const inp = '你的本命太阳在狮子座第10宫，上升白羊座，本命月亮在水瓶座第11宫。';
    const out = F._v432LockNatal(inp, 'zh', natalAstro);
    assert.ok(out.includes('本命太阳在摩羯座第10宫'), '本命太阳真值锁未生效: ' + out);
    assert.ok(out.includes('上升白羊座'), '纠正太阳时误伤上升: ' + out);
  });
});
