// 🛠️ V433-fix4 回归门：月亮「周级真值」硬锁（确定性后处理）
//
// 【病根】方案 A 注入周级真值 + 照抄句后，es 几乎 100% 正确，但 vi 模型仍把相邻周星座
//   （Scorpio）搬进 W1/W4 并配错宫位（实测 HCMC/vi）。靠喂数据已到顶 → 上确定性锁。
//
// 【本套件验什么】
//   ① 越界星座整段归真：W1 段落里 "Bọ Cạp (Nhà 3) → ..." 必须换成本周首个真值 Bạch Dương Nhà 7
//   ② 宫内归真：星座对、宫位错 → 宫位归真
//   ③ 本命月亮不动（natal 标记）
//   ④ 陷阱段（无周号）按全月并集校验，合法星座保留
//   ⑤ 幂等：已正确的文本零改动
//   ⑥ 无真值盘 → 原文透传
import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
const _from = SRC.indexOf('const _EN2ZIDX');
const _to = SRC.indexOf('function cleanConsumerTrapAndBrackets');
if (_from < 0 || _to < 0 || _to <= _from) throw new Error('提取 V433 锁源码块失败');
const BLOCK = SRC.slice(_from, _to);
// 注入全部星座表常量（真实 server.js 顶层均有，沙箱需显式提供）
const SIGNS = ['EN', 'ES', 'ZH', 'FR', 'TH', 'VI'].map((k) => {
  const m = SRC.match(new RegExp('const SUN_SIGN_' + k + '\\s*=\\s*\\[[^\\]]*\\];'));
  return m ? m[0] : '';
}).join('\n');
const F = new Function(`${SIGNS}\n${BLOCK}\nreturn { _v433LockMoonWeek, _v432Signs };`)();

const weeks = [{
  week: 1,
  legs: [
    { sign: 'Aries', house: 7 }, { sign: 'Aries', house: 8 },
    { sign: 'Taurus', house: 8 }, { sign: 'Taurus', house: 9 },
    { sign: 'Gemini', house: 9 }, { sign: 'Gemini', house: 10 },
    { sign: 'Cancer', house: 10 }, { sign: 'Cancer', house: 11 },
  ],
}, {
  week: 2,
  legs: [
    { sign: 'Cancer', house: 11 }, { sign: 'Leo', house: 11 }, { sign: 'Leo', house: 12 },
    { sign: 'Virgo', house: 12 }, { sign: 'Virgo', house: 1 }, { sign: 'Libra', house: 1 },
    { sign: 'Libra', house: 2 }, { sign: 'Scorpio', house: 2 },
  ],
}];
const astro = { months: [{ moon_weeks: weeks }] };

describe('V433-fix4：月亮周级硬锁', () => {
  test('① 越界星座整段归真（W1 里 Scorpio→Aries）', () => {
    const inp = '✦ [🟢 Tuần 1: Thg9 1–7] Nạp\nMặt Trăng hành vận đi qua Bọ Cạp (Nhà 3) → Kim Ngưu (Nhà 8→Nhà 9) → Song Tử (Nhà 9→Nhà 10) → Cự Giải (Nhà 10→Nhà 11).';
    const out = F._v433LockMoonWeek(inp, 'vi', astro);
    assert.ok(out.includes('Bạch Dương Nhà 7'), '越界星座未归真为首周真值: ' + out);
    assert.ok(!out.includes('Bọ Cạp'), '越界 Scorpio 仍残留');
  });
  test('② 宫内归真（星座对、宫位错）', () => {
    const inp = '✦ [🟢 Tuần 1: Thg9 1–7] X\nKhi Mặt Trăng vào Thiên Bình Nhà 8, cảm xúc gắn chặt.';
    // Thiên Bình=Libra 不在 W1 → 整段归真为 Aries Nhà 7（首周真值）
    const out = F._v433LockMoonWeek(inp, 'vi', astro);
    assert.ok(out.includes('Bạch Dương Nhà 7'), '宫内+越界应归真为首周真值: ' + out);
  });
  test('③ 本命月亮不动', () => {
    const inp = '✦ [🟢 Tuần 1: Thg9 1–7] X\nMặt Trăng natal của bạn ở Ma Kết Nhà 5.';
    const out = F._v433LockMoonWeek(inp, 'vi', astro);
    assert.equal(out, inp, '本命月亮被误改');
  });
  test('④ 陷阱段（无周号）合法并集星座保留', () => {
    const inp = '✦ [⚠️ Cạm bẫy] X\nCảnh báo khi Mặt Trăng đi qua Thiên Bình Nhà 2 và Bọ Cạp Nhà 2→Nhà 3.';
    // Libra/Scorpio 都在全月并集 → 保留
    const out = F._v433LockMoonWeek(inp, 'vi', astro);
    assert.ok(out.includes('Thiên Bình') && out.includes('Bọ Cạp'), '并集合法星座被误删: ' + out);
  });
  test('⑤ 幂等：已正确文本零改动', () => {
    const inp = '✦ [🟢 Tuần 1: Thg9 1–7] X\nMặt Trăng hành vận đi qua Bạch Dương (Nhà 7→Nhà 8) → Kim Ngưu (Nhà 8→Nhà 9).';
    const out = F._v433LockMoonWeek(inp, 'vi', astro);
    assert.equal(out, inp, '正确文本被改动');
  });
  test('⑥ 无真值盘 → 原文透传', () => {
    const inp = 'Mặt Trăng hành vận đi qua Bọ Cạp (Nhà 3).';
    assert.equal(F._v433LockMoonWeek(inp, 'vi', null), inp);
    assert.equal(F._v433LockMoonWeek(inp, 'vi', {}), inp);
  });
  test('⑦ CJK 月亮锁生效（中文 \\b 边界失效回归）', () => {
    const inp = '✦ [🟢 第1周: 9月1–7日] X\n月亮进入天蝎座（第6宫），日常工作中的努力开始转化为实际收入。';
    const out = F._v433LockMoonWeek(inp, 'zh', astro);
    assert.ok(out.includes('白羊座'), 'zh 月亮锁未生效（CJK \\b 边界失效）: ' + out);
    assert.ok(!out.includes('天蝎座'), 'zh 越界天蝎座残留');
  });
});
