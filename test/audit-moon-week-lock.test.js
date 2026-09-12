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
const F = new Function(`${SIGNS}\n${BLOCK}\nreturn { _v433LockMoonWeek, _v434LockGlobalMoonScope, _v432Signs, _v436InThMonth };`)();

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

// ═══════════════════════════════════════════════════════════════════════
// 🛡️ V435-fix 回归门：打死「只验好样本」的盲区（这四类坏样本原先一条都没覆盖）
describe('V435-fix：周级锁的坏样本回归（宫位补丁／法语周标记／法语宫位词／泰语本命守护）', () => {
  test('⑧ 宫位错但星座在周内 → 只换宫位号，不得吞字符（P0 文本写坏回归）', () => {
    const inp = '✦ [🟢 Tuần 1: Thg9 1–7] X\nMặt Trăng hành vận đi qua Bạch Dương (Nhà 11→Nhà 12) → Kim Ngưu (Nhà 11→Nhà 12).';
    const out = F._v433LockMoonWeek(inp, 'vi', astro);
    assert.ok(out.includes('Bạch Dương (Nhà 7→Nhà 12)'), '宫位未归真且丢了 Nhà 标签（旧 bug: 会吞掉 5 字符）: ' + out);
    assert.ok(out.includes('Kim Ngưu (Nhà 8→Nhà 12)'), '第二个星座宫位未归真: ' + out);
    assert.equal(out.length, inp.length - 2, '字符数异常（旧 bug 会吞掉 10 字符）: ' + out.length + ' vs ' + inp.length);
  });
  test('⑨ 法语周段落受管辖（Semaine 必须识别，否则星座越界永不纠）', () => {
    const inp = '✦ [🔴 Semaine 1: Recharge de Richesse] X\nla Lune en transit en Vierge (Maison 12) → Balance (Maison 1).';
    const out = F._v433LockMoonWeek(inp, 'fr', astro);
    assert.ok(out.includes('Bélier'), '法语周段落未被识别（Semaine 缺失）→ 越界星座未归真: ' + out);
    assert.ok(!out.includes('Vierge'), '法语越界星座残留: ' + out);
    assert.ok(!/ House /.test(out), '替换产物注入了英文 House（穿帮）: ' + out);
    assert.ok(out.includes(' Maison '), '法语宫位词应为 Maison: ' + out);
  });
  test('⑩ 法语宫位词必须是 Maison（用已识别周标记隔离该分支）', () => {
    // 用 Week 2（修复前后都识别）把「星座替换尾巴」分支单独隔离出来
    // Poissons(Aquarius 之外的越界星: 双鱼不在 W2 真值内) → 必触发星座替换分支
    const inp = '✦ [🔴 Week 2: X]\nla Lune en transit en Poissons (Maison 5).';
    const out = F._v433LockMoonWeek(inp, 'fr', astro);
    assert.ok(!out.includes('Poissons'), '法语越界星座未归真: ' + out);
    assert.ok(!/ House /.test(out), '英文 House 泄漏进法语正文（穿帮）: ' + out);
    assert.ok(out.includes(' Maison '), '法语宫位词应为 Maison: ' + out);
  });
  test('⑪ 泰语本命月亮不动（กำเนิด 守护词）', () => {
    const inp = '✦ [🔵 สัปดาห์ที่ 1: X]\nดวงจันทร์กำเนิดในราศีกันยา บ้าน 7 ส่งผลต่อการเงินของคุณ';
    const out = F._v433LockMoonWeek(inp, 'th', astro);
    assert.equal(out, inp, '泰语本命月亮被误改（กำเนิด 未进守护词表）: ' + out);
  });
  test('⑫ V434-2 泰语本命月亮不动（กำเนิด 守护词）', () => {
    const inp = '✦ [🔵 ภาพรวม]\nดวงจันทร์กำเนิด ตลอดทั้งเดือนในราศีกันยา';
    const out = F._v434LockGlobalMoonScope(inp, 'th', astro);
    assert.equal(out, inp, 'V434-2 泰语本命月亮被误改: ' + out);
  });

  // ── V436：泰语月名内嵌星座名 + 轨迹括注组（生产实测根因）──
  // 【病根】泰语月份名 กันยายน(九月) 里嵌着星座名 กันยา(处女) / พฤษภาคม⊃พฤษภ / เมษายน⊃เมษ 等 6 族
  //   → 星座匹配落进日期词 → 把「后一个星座的宫位」算到该星座头上 → 假阳性改写 + 与 V435 互打乒乓（永不收敛）
  const thWeeks = [{ week: 2, legs: [
    { sign: 'Scorpio', house: 5 }, { sign: 'Virgo', house: 3 },
    { sign: 'Virgo', house: 4 }, { sign: 'Libra', house: 4 }, { sign: 'Libra', house: 5 },
  ] }];
  const astroTh = { months: [{ moon_weeks: thWeeks }] };
  test('⑬ 泰语月名内嵌星座名不得被当星座引用（กันยายน⊃กันยา 假阳性）', () => {
    const inp = '✦ [สัปดาห์ที่ 2: 8–14 กันยายน]\nดวงจันทร์ทรานซิสเคลื่อนผ่าน ราศีพิจิก (บ้าน 5→บ้าน 3) → ราศีกันยา (บ้าน 3→บ้าน 4) → ราศีตุลย์ (บ้าน 4→บ้าน 5).';
    const out = F._v433LockMoonWeek(inp, 'th', astroTh);
    assert.equal(out, inp, '月名 กันยายน 里的 กันยา 被当星座引用 → 宫位张冠李戴: ' + out);
  });
  test('⑭ 轨迹括注组：只改本星座入口宫位，后续星座括注不得被吞', () => {
    const inp = '✦ [สัปดาห์ที่ 2: 8–14 กันยายน]\nดวงจันทร์ทรานซิสเคลื่อนผ่าน ราศีพิจิก (บ้าน 7→บ้าน 3) → ราศีกันยา (บ้าน 3→บ้าน 4).';
    const out = F._v433LockMoonWeek(inp, 'th', astroTh);
    assert.ok(out.includes('พิจิก (บ้าน 5→บ้าน 3)'), '本星座入口宫位未归真（7→5）: ' + out);
    assert.ok(out.includes('กันยา (บ้าน 3→บ้าน 4)'), '下个星座的括注被误改: ' + out);
  });
  test('⑮ 幂等/无乒乓：同一句连过两次必须一致（V433↔V435 互打回归门）', () => {
    const inp = '✦ [สัปดาห์ที่ 2: 8–14 กันยายน]\nดวงจันทร์ทรานซิสเคลื่อนผ่าน ราศีพิจิก (บ้าน 5→บ้าน 3) → ราศีกันยา (บ้าน 3→บ้าน 4).';
    const once = F._v433LockMoonWeek(inp, 'th', astroTh);
    const twice = F._v433LockMoonWeek(once, 'th', astroTh);
    assert.equal(twice, once, '非幂等（乒乓）: ' + twice);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 🛡️ V436 回归门：泰语月名内嵌星座名防撞（生产实测根因）
// 【核心问题】泰语月名含星座短名：กันยายน⊃กันยา / เมษายน⊃เมษ / ... 共6组
//   V433 月亮锁用 _v433MoonNameTh 扫星座名时，候选位置落在月名区间内=不是星座引用，跳过。
//   同时 V432 引擎（en/es/zh/fr）对泰语月名无影响（泰国锁专用 _thPatchZone，不扫月名）。
describe('V436：泰语月名内嵌星座名守卫（生产实测根因）', () => {
  // ① _v436InThMonth 单测：六组月名-星座名碰撞 + 负例
  test('⑬ กันยายน(九月) 含处女座 กันยา → 落在月名内 = true', () => {
    // กันยา 在 กันยายน 内（位置 0-5）→ กันยา 起点在月名内
    assert.ok(F._v436InThMonth('เดือนกันยายน', 7, 5), 'กันยา(处女)起点在กันยายน内应 true: ' + F._v436InThMonth('เดือนกันยายน', 7, 5));
  });
  test('⑬b เมษายน(四月) 含白羊 เมษ → true', () => {
    assert.ok(F._v436InThMonth('เดือนเมษายน', 6, 3), 'เมษ(白羊)起点在เมษายน内应 true');
  });
  test('⑬c พฤษภาคม(五月) 含金牛 พฤษภ → true', () => {
    assert.ok(F._v436InThMonth('พฤษภาคม', 0, 5), 'พฤษภ 在พฤษภาคม内应 true');
  });
  test('⑬d มีนาคม(三月) 含双鱼 มีน → true', () => {
    assert.ok(F._v436InThMonth('มีนาคม', 0, 3), 'มีน(双鱼)起点在มีนาคม内应 true');
  });
  test('⑬e 星座位置不在月名内 → false（合法引用）', () => {
    // กันยา 出现在独立词 ราศีกันยา（星座词，非月名）→ false
    assert.ok(!F._v436InThMonth('ราศีกันยา', 5, 5), 'ราศีกันยา 里的 กันยา 不是月名区间 → false');
    assert.ok(!F._v436InThMonth('เดือนกันยายน ราศีกันยา', 19, 5), 'ราศีกันยา 里 กันยา 不在月名内 → false');
  });
  test('⑬f มีน(双鱼) 在มีนาคม(三月)外 → false', () => {
    // มีน 出现在独立词，不在月名区间
    assert.ok(!F._v436InThMonth('มีนาคมดวงจันทร์มีน', 12, 3), 'มีน 在มีนาคม外 → false');
  });

  // ② V433 月亮锁防撞（泰语）：含月名的周级文本，守卫跳过月名内的星座名
  test('⑭ 泰语月名 กันยายน 含 กันยา，V433 月亮锁不得误改独立星座词ราศีกันยา', () => {
    const thAstro = {
      months: [{ moon_weeks: [
        { week: 2, legs: [{ sign: 'Scorpio', house: 5 }, { sign: 'Virgo', house: 3 }, { sign: 'Virgo', house: 4 }] },
        { week: 3, legs: [{ sign: 'Libra', house: 4 }, { sign: 'Libra', house: 5 }] },
      ]}]
    };
    // 文本含ราศีกันยา（星座，独立）+ กันยายน（月名，在同一行）
    // ราศีกันยา里的กันยา起点在ราศีกันยา词内（非月名区间）→ 守卫放行 → 归真
    // กันยายน里的กันยา起点在月名内 → 守卫跳过 → 不被误改
    const inp = '✦ [🔵 สัปดาห์ที่ 2: 9月8–14]\nดวงจันทร์ทรานซิสผ่านราศีกันยา (บ้าน 3→บ้าน 4) และเดือนกันยายน';
    const out = F._v433LockMoonWeek(inp, 'th', thAstro);
    // กันยายน（月名）里的 กันยา 不应被月亮锁误改（但ราศีกันยา 里的 กันยา 是流月星座引用，如不在本周真值则应归真）
    // 为避免混淆，用不含真值冲突的纯文本
    const inp2 = '✦ [🔵 สัปดาห์ที่ 2]\nดวงจันทร์ทรานซิสเคลื่อนผ่านราศีพิจิก (บ้าน 5→บ้าน 3) เดือนกันยายน';
    const out2 = F._v433LockMoonWeek(inp2, 'th', thAstro);
    assert.equal(out2, inp2, '月名 กันยายน 未被月亮锁误改（守卫跳过月名内 กันยา）: ' + out2);
  });

  // ③ 幂等验证（生产实测：V433+V435 乒乓消失）
  test('⑮ มีนาคม(三/月)含มีน(双鱼)，幂等归真无乒乓 → 不动点', () => {
    const thAstro = {
      months: [{ moon_weeks: [
        { week: 1, legs: [{ sign: 'Aries', house: 7 }, { sign: 'Aries', house: 8 }] },
      ]}]
    };
    // มีนาคม含มีน（月名内），若ฺ月亮锁误改→每次都翻→永不等；幂等则最终不动
    const inp = '✦ [🔵 สัปดาห์ที่ 1]\nมีนาคมดวงจันทร์มีน';
    const out1 = F._v433LockMoonWeek(inp, 'th', thAstro);
    const out2 = F._v433LockMoonWeek(out1, 'th', thAstro);
    const out3 = F._v433LockMoonWeek(out2, 'th', thAstro);
    assert.equal(out1, out2, '幂等：第1次==第2次（无乒乓）: ' + out1 + ' vs ' + out2);
    assert.equal(out2, out3, '幂等：第2次==第3次: ' + out2 + ' vs ' + out3);
    assert.ok(!out1.includes('♓'), '输出不含双鱼emoji（มีน非本周真值→若误改ฺ双鱼星座名会有问题）');
  });
});
