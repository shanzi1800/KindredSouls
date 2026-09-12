// 🛠️ V435 回归门：日级月亮星座区间硬锁（周内「日期–星座」组合校验）
//
// 【病根】V433 只锁「带周号」段落、只到「周」粒度。周内/陷阱段里的
//   「Día 12 … Luna en Escorpio」这类组合无人校验 —— 星座在该周并集内（V433 放行），
//   日期却对不上（实测 Chatham 盘：12日 12:37 才 Virgo→Libra，26日 23:07 Pisces→Aries）。
//
// 【真值轴】不手写任何常量：全部由 astro/astro_matrix.py（SwissEph 实算）现推
//   → 日级切片从 moon_weeks[].changes（kind='sign'/'cusp' + day + time + 分钟权重）推导。
//   ⚠️ 矩阵里**没有** dailyMoonMap 字段（旧草案假设存在 → 整把锁静默失效）；本套件同时验「现推真值」与 ingress 一致。
//
// 【不变量】
//   ① 坏样本必被抓：区间/单日真值内不含该星座 → 必归正（自证能改动，杜绝「匹配数为 0 的静默失效」）
//   ② 好样本零漂移：交集非空即合法（如 14 日 Libra→Scorpio，写 Scorpio 合法）
//   ③ 守护：他行星的星座不动（月亮后先出现行星名即截断）；本命月亮不动；非报告月不误伤
//   ④ 幂等；无真值盘 → 原文透传；六语种日期正则均可提取
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
if (_from < 0 || _to < 0 || _to <= _from) throw new Error('未能提取 V435 真值锁源码块');
const BLOCK = SRC.slice(_from, _to);
const SIGNS = ['EN', 'ES', 'ZH', 'FR', 'TH', 'VI'].map((k) => {
  const m = SRC.match(new RegExp('const SUN_SIGN_' + k + '\\s*=\\s*\\[[^\\]]*\\];'));
  return m ? m[0] : '';
}).join('\n');
const F = new Function(`${SIGNS}\n${BLOCK}\nreturn { _v435LockMoonDailyRanges, _v435DailyMap, _v435RangeTruth, _v435CollectDates, applyV434Locks, _v434LockQualifiers, _EN2ZIDX, SUN_SIGN_EN, SUN_SIGN_ES, SUN_SIGN_ZH, SUN_SIGN_FR, SUN_SIGN_TH, SUN_SIGN_VI };`)();
const L = { en: F.SUN_SIGN_EN, es: F.SUN_SIGN_ES, zh: F.SUN_SIGN_ZH, fr: F.SUN_SIGN_FR, th: F.SUN_SIGN_TH, vi: F.SUN_SIGN_VI };

let astro = null, dm = null, probe = null;
before(async () => {
  astro = await getAstroMatrix('1988-12-31', '23:59', -43.9536, -176.5463, 'Pacific/Chatham');
  dm = F._v435DailyMap(astro);
  probe = dm ? findIngressDay() : null;
});

/** 挑一个「当天发生换座」的日子（区间内两段星座、分钟权重不同）→ 用它自证 */
function findIngressDay() {
  for (let d = 1; d <= 31; d++) {
    const segs = dm.map[`${dm.year}-${String(dm.month).padStart(2, '0')}-${String(d).padStart(2, '0')}`];
    if (segs && segs.length >= 2 && segs[0].sign !== segs[segs.length - 1].sign) return { day: d, segs };
  }
  return null;
}
const idxOf = (en) => F._EN2ZIDX[en];

describe('V435：日级月亮星座区间硬锁', () => {
  test('① 真值现推正确性：日级切片与 SwissEph ingress 一致（分钟权重守恒）', () => {
    assert.ok(dm, '未推出日级真值表（moon_weeks.changes 缺失？）');
    const probeDay = findIngressDay();
    assert.ok(probeDay, '未找到换座日');
    const { segs } = probeDay;
    const total = segs.reduce((s, x) => s + x.mins, 0);
    assert.equal(total, 1440, '单日分钟权重不守恒（非 1440）');
    assert.ok(segs.every((s) => s.sign && s.mins >= 0), '存在空星座/负权重切片');
    // 换座当天必须两段不同星座，且次日只剩后者
    const next = dm.map[`${dm.year}-${String(dm.month).padStart(2, '0')}-${String(probeDay.day + 1).padStart(2, '0')}`];
    if (next) assert.ok(next.some((s) => s.mins === 1440), '换座次日应整日单星座');
  });

  test('② 坏样本必纠：单日真值不含该星座 → 归正为占时最长星座 + 宫位同步（es/zh/vi）', () => {
    const { day, segs } = probe;
    const truthSigns = segs.map((s) => s.sign);
    const dom = segs.slice().sort((a, b) => b.mins - a.mins)[0];
    // 找一个「不在真值内」的星座
    const badEn = Object.keys(F._EN2ZIDX).find((k) => !truthSigns.includes(k));
    const bad = idxOf(badEn), domIdx = idxOf(dom.sign);
    assert.ok(bad !== undefined && domIdx !== undefined);

    const cases = [
      { lang: 'es', inp: `El Día ${day}, la Luna en tránsito en ${L.es[bad]}, Casa 3.`, domName: L.es[domIdx] },
      { lang: 'zh', inp: `${dm.month}月${day}日，月亮进入${L.zh[bad]}（第6宫），带来情绪起伏。`, domName: L.zh[domIdx] },
      { lang: 'vi', inp: `Đặc biệt, vào ngày ${day}, Mặt Trăng ở ${L.vi[bad]} trong Nhà 3 giúp đàm phán.`, domName: L.vi[domIdx] },
      { lang: 'en', inp: `On September ${day}, the Moon travels through ${L.en[bad]}, House 3.`, domName: L.en[domIdx] },
      { lang: 'fr', inp: `Le ${day} septembre, la Lune en transit en ${L.fr[bad]}, Maison 3.`, domName: L.fr[domIdx] },
      { lang: 'th', inp: `วันที่ ${day} ดวงจันทร์ใน${L.th[bad]} บ้าน 3`, domName: L.th[domIdx] },
    ];
    for (const c of cases) {
      const out = F._v435LockMoonDailyRanges(c.inp, c.lang, astro);
      assert.notEqual(out, c.inp, `[${c.lang}] 坏样本未被修正（锁静默失效）`);
      assert.ok(out.includes(c.domName), `[${c.lang}] 未归正为占时最长星座 ${dom.sign}: ${out}`);
      assert.ok(!out.includes(L[c.lang][bad]), `[${c.lang}] 越界星座残留: ${out}`);
    }
  });

  test('③ 好样本零漂移：交集非空即合法（换座当天写任一侧都对）', () => {
    const { day, segs } = probe;
    for (const lang of ['es', 'zh', 'vi', 'en']) {
      const inp = lang === 'zh'
        ? `${dm.month}月${day}日，月亮进入${L.zh[idxOf(segs[segs.length - 1].sign)]}。`
        : lang === 'vi'
          ? `Vào ngày ${day}, Mặt Trăng ở ${L.vi[idxOf(segs[0].sign)]}.`
          : lang === 'en'
            ? `On September ${day}, the Moon enters ${L.en[idxOf(segs[0].sign)]}.`
            : `El Día ${day} la Luna en tránsito en ${L.es[idxOf(segs[segs.length - 1].sign)]}.`;
      assert.equal(F._v435LockMoonDailyRanges(inp, lang, astro), inp, `[${lang}] 合法声明被误改`);
    }
    // 区间交集非空：整区间的并集内任一星座都合法（如 12–14 含 Libra/Scorpio）
    const r = F._v435RangeTruth(dm, Math.min(...Object.keys(dm.map).map((k) => +k.slice(-2))), Math.max(...Object.keys(dm.map).map((k) => +k.slice(-2))));
    assert.ok(r.valid.size >= 12, '整月并集应覆盖全黄道（月亮 27.3 天走完 12 座）');
  });

  test('④ 守护：他行星星座不动 / 本命月亮不动 / 非报告月不误伤', () => {
    const { day, segs } = probe;
    const truthSigns = segs.map((s) => s.sign);
    const badEn = Object.keys(F._EN2ZIDX).find((k) => !truthSigns.includes(k));
    const bad = L.es[idxOf(badEn)];
    // 只提他行星 → 不动
    const other = `El Día ${day}, Venus en tránsito en ${bad}, Casa 2 activa el gasto.`;
    assert.equal(F._v435LockMoonDailyRanges(other, 'es', astro), other, '误改他行星的星座');
    // 月亮 + 他行星：只改月亮那一侧
    const mixed = `El Día ${day}, con la Luna en tránsito en ${bad}, Casa 2, y Venus en tránsito en ${bad}, Casa 2.`;
    const outM = F._v435LockMoonDailyRanges(mixed, 'es', astro);
    assert.ok(outM.includes(`Venus en tránsito en ${bad}`), '他行星侧被误改: ' + outM);
    assert.ok(!outM.split('y Venus')[0].includes(bad), '月亮侧未归正: ' + outM);
    // 本命月亮 + 非报告月
    const natal = `El Día ${day}, tu Luna natal en ${bad}, Casa 2 marca tu dinero.`;
    assert.equal(F._v435LockMoonDailyRanges(natal, 'es', astro), natal, '本命月亮被误改');
    const otherMonth = `Del ${day} al ${day + 2} de agosto, la Luna en tránsito en ${bad}.`;
    assert.equal(F._v435LockMoonDailyRanges(otherMonth, 'es', astro), otherMonth, '非报告月被误伤');
  });

  test('⑤ 幂等：连续两次归正结果一致', () => {
    const { day, segs } = probe;
    const truthSigns = segs.map((s) => s.sign);
    const badEn = Object.keys(F._EN2ZIDX).find((k) => !truthSigns.includes(k));
    const inp = `El Día ${day}, la Luna en tránsito en ${L.es[idxOf(badEn)]}, Casa 3.`;
    const once = F._v435LockMoonDailyRanges(inp, 'es', astro);
    assert.equal(F._v435LockMoonDailyRanges(once, 'es', astro), once, '非幂等');
  });

  test('⑥ 无真值盘 / 异常输入 → 原文透传', () => {
    const inp = 'El Día 12, la Luna en tránsito en Escorpio.';
    assert.equal(F._v435LockMoonDailyRanges(inp, 'es', null), inp);
    assert.equal(F._v435LockMoonDailyRanges(inp, 'es', {}), inp);
    assert.equal(F._v435LockMoonDailyRanges(inp, 'es', { months: [{ moon_weeks: [] }] }), inp);
    assert.equal(F._v435LockMoonDailyRanges(inp, 'xx', astro), inp);
    assert.equal(F._v435LockMoonDailyRanges('', 'es', astro), '');
  });

  test('⑦ 六语种日期正则均可提取（区间 + 单日）', () => {
    const samples = {
      zh: [`${dm.month}月${probe.day}日，月亮在天蝎座。`, 1],
      en: [`September ${probe.day} to ${probe.day + 2}, the Moon in Scorpio.`, 1],
      es: [`Del ${probe.day} al ${probe.day + 2} de septiembre, la Luna en Escorpio.`, 1],
      vi: [`ngày ${probe.day}–${probe.day + 2}, Mặt Trăng ở Bọ Cạp.`, 1],
      fr: [`Du ${probe.day} au ${probe.day + 2} septembre, la Lune en Scorpion.`, 1],
      th: [`วันที่ ${probe.day} ถึง ${probe.day + 2} ดวงจันทร์ในพิจิก`, 1],
    };
    for (const [lang, [txt, want]] of Object.entries(samples)) {
      const got = F._v435CollectDates(txt, lang, dm.month);
      assert.ok(got.length >= want, `[${lang}] 日期区间未提取: ${txt}`);
      assert.equal(got[0].sd, probe.day, `[${lang}] 起始日解析错误`);
    }
  });

  test('⑧ 复合链 applyV434Locks 串联：日级锁 + 修饰词锁同时生效', () => {
    const { day, segs } = probe;
    const truthSigns = segs.map((s) => s.sign);
    const bad = L.zh[idxOf(Object.keys(F._EN2ZIDX).find((k) => !truthSigns.includes(k)))];
    const inp = `${dm.month}月${day}日，月亮进入${bad}（第6宫）。太阳（逆行中）进入第4宫。`;
    const out = F.applyV434Locks(inp, 'zh', astro);
    assert.ok(!out.includes(bad), '复合链未执行日级锁: ' + out);
    assert.ok(out.includes('太阳进入第4宫'), '复合链未执行修饰词锁: ' + out);
  });
});
