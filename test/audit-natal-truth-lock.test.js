// 🛠️ V423 回归门：本命盘真值硬锁 lockNatalTruthVi（10 行星全量）
//
// 【真值轴】真值不手写，全部来自 astro/astro_matrix.py（SwissEph 实算）→ 杜绝「用自己写的常量验自己」
// 【不变量】① 修后「真值↔错值」往返替换必须与原文逐字符相同（抓掉字/重字）
//          ② 越界保护：他行星的星座/宫位绝不被污染；流月(transit)描述绝不被改写
//          ③ 10 行星全覆盖：任一本命星座/宫位漂移都必须归真
import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getAstroMatrix } from '../v69_client.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
// 用标记切片（比非贪婪正则稳：块内出现多个 "\n}\n" 时不会提前截断）
const _from = SRC.indexOf('const _EN2ZIDX');
const _to = SRC.indexOf('function cleanConsumerTrapAndBrackets');
if (_from < 0 || _to < 0 || _to <= _from) throw new Error('未能从 server.js 提取 lockNatalTruthVi 源码块');
const BLOCK = SRC.slice(_from, _to);
const SUN_SIGN_VI_DECL = "const SUN_SIGN_VI = ['Bạch Dương','Kim Ngưu','Song Tử','Cự Giải','Sư Tử','Xử Nữ','Thiên Bình','Bọ Cạp','Nhân Mã','Ma Kết','Bảo Bình','Song Ngư'];";
// ESM 严格模式下 eval 不外泄声明 → 用 new Function 工厂把函数取出来
const lockNatalTruthVi = new Function(`${SUN_SIGN_VI_DECL}\n${BLOCK}\nreturn { lockNatalTruthVi, _VI_PLANET, _VI_PLANET_ORDER, SUN_SIGN_VI };`)();
assert.strictEqual(typeof lockNatalTruthVi.lockNatalTruthVi, 'function', 'lockNatalTruthVi 应被成功提取');
assert.strictEqual(lockNatalTruthVi._VI_PLANET_ORDER.length, 10, 'V423 必须覆盖 10 行星');

const VI = lockNatalTruthVi._VI_PLANET;
const SIGNS = lockNatalTruthVi.SUN_SIGN_VI;
const WRONG_SIGN_OF = (s) => SIGNS[(SIGNS.indexOf(s) + 5) % 12];      // 错值：隔 5 个星座（必不等）
const WRONG_HOUSE_OF = (h) => (h === 12 ? 1 : h + 1);
const roundTrip = (input, ch, pairs, identical = false) => {
  const out = lockNatalTruthVi.lockNatalTruthVi(input, ch);
  let norm = out;
  for (const [truth, wrong] of pairs) norm = norm.split(truth).join(wrong);
  assert.strictEqual(norm, input, `往返不一致（掉字/重字）\nIN : ${input}\nOUT: ${out}`);
  if (identical) assert.strictEqual(out, input, `应零改动但被改了\nOUT: ${out}`);
  return out;
};

// ── 三个 profile（真值全部 SwissEph 实算）──
const PROFILES = [
  { bd: '1990-08-05', bt: '07:00', lat: 10.8231, lon: 106.6297, tz: 'Asia/Ho_Chi_Minh' },
  { bd: '1989-10-12', bt: '07:00', lat: 13.7563, lon: 100.5018, tz: 'Asia/Bangkok' },
  { bd: '1992-03-17', bt: '09:30', lat: 39.9042, lon: 116.4074, tz: 'Asia/Shanghai' },
];
const MATRICES = [];
before(async () => {
  for (const p of PROFILES) MATRICES.push(await getAstroMatrix(p.bd, p.bt, p.lat, p.lon, p.tz));
});
const chartOf = (m) => ({
  meta: { ...m.meta, sun_sign: m.meta.sun_sign, natal_moon: m.meta.natal_moon, computed_houses: m.meta.computed_houses },
});
const truthOf = (m, planet) => {
  const info = planet === 'Moon' ? (m.meta.natal_moon || m.meta.computed_houses.Moon) : m.meta.computed_houses[planet];
  return { sign: SIGNS[['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'].indexOf(info.sign)], house: info.house };
};

describe('V423 本命真值锁 · 10 行星逐项真值轴（SwissEph 实算）', () => {
  for (let pi = 0; pi < PROFILES.length; pi++) {
    test(`profile ${pi + 1} (${PROFILES[pi].bd})：10 行星各自的漂移都必须归真`, async () => {
      const m = MATRICES[pi];
      const ch = chartOf(m);
      let checked = 0;
      for (const p of lockNatalTruthVi._VI_PLANET_ORDER) {
        const t = truthOf(m, p);
        if (!t.sign || !t.house) continue;
        const name = VI[p];
        const ws = WRONG_SIGN_OF(t.sign), wh = WRONG_HOUSE_OF(t.house);
        const inc = `${name} natal của bạn ở ${ws} Nhà ${wh} chiếu rọi tài chính.`;
        const out = roundTrip(inc, ch, [[t.sign, ws], [`Nhà ${t.house}`, `Nhà ${wh}`]]);
        assert.ok(out.includes(`${t.sign} Nhà ${t.house}`), `${p} 未归真：${out}`);
        assert.ok(!new RegExp(`Nhà\\s*${wh}(?!\\d)`).test(out), `${p} 仍残留错值宫位：${out}`);
        checked++;
      }
      assert.ok(checked >= 10, `应至少校验 10 行星，实际 ${checked}`);
    });
  }
});

describe('V423 本命真值锁 · 越界与流月保护（不许误伤）', () => {
  test('他行星的数据绝不被污染', () => {
    const ch = chartOf(MATRICES[0]);            // 1990-08-05：月 Cap H5 / 金 Cancer H11
    roundTrip('Mặt Trăng natal Ma Kết Nhà 5 hòa hợp với Sao Kim tại Bọ Cạp Nhà 3.', ch, [], true);
  });

  test('流月(transit)描述绝不改写', () => {
    const ch = chartOf(MATRICES[0]);
    roundTrip('Sao Kim đi qua Bọ Cạp Nhà 3 của bạn hôm nay.', ch, [], true);
    roundTrip('Mặt Trăng đi qua Bọ Cạp Nhà 3 của bạn hôm nay.', ch, [], true);
  });

  test('回看段含流月动词时，其星座/宫位不得算作本命（V421 血泪）', () => {
    // 「Sao Hỏa transit ở Cự Giải Nhà 1 chiếu vào Mặt Trăng natal của bạn ở …」——Nhà 1 是火星流月的
    const ch = chartOf(MATRICES[0]);            // 月亮真值 Cap H5；火星真值 Taurus H9
    const inc = 'Sao Hỏa transit ở Cự Giải Nhà 1 chiếu vào Mặt Trăng natal của bạn ở Bọ Cạp Nhà 8.';
    const out = lockNatalTruthVi.lockNatalTruthVi(inc, ch);
    assert.ok(out.includes('Ma Kết Nhà 5'), `月亮未归真：${out}`);
    assert.ok(out.includes('Cự Giải Nhà 1'), `火星流月的流月宫位被误改：${out}`);
  });

  test('非本命锚点（无 «của bạn/natal»）零改动', () => {
    const ch = chartOf(MATRICES[0]);
    roundTrip('Mặt Trăng đầu tháng ở Bọ Cạp Nhà 3 thúc đẩy giao tiếp.', ch, [], true);
    roundTrip('Hôm nay trời đẹp, bạn nên tiết kiệm 500.000 ₫.', ch, [], true);
  });

  test('节点轴短语「trục X–Y」绝不改写（V423 误伤现形·必须零改动）', () => {
    // 2026-09-10 生产实测误伤：模型写 “Mặt Trời natal … trục Kim Ngưu–Bạch Dương”，
    // 锁把轴里的 Bạch Dương（对轴星座，非本命）误判成本命太阳星座，改成 “trục Kim Ngưu–Kim Ngưu”。
    // 轴描述永远在句尾、绝不可能落本命盘 → 遇 trục/破折号即截断归因窗口，整段不动。
    const ch = chartOf(MATRICES[0]);            // 1990-08-05：月 Cap H5 / 日 Leo H10
    roundTrip('Mặt Trăng natal của bạn ở Ma Kết Nhà 5, được kích hoạt bởi trục Xử Nữ–Bạch Dương, nhắc bạn.', ch, [], true);
    // 太阳落点即便需归真（此处 Sư Tử 为正确真值），轴短语「trục Kim Ngưu–Bạch Dương」整段绝不被改写
    const out2 = lockNatalTruthVi.lockNatalTruthVi('Mặt Trời natal của bạn ở Sư Tử Nhà 10, kích hoạt trục Kim Ngưu–Bạch Dương.', ch);
    assert.ok(out2.includes('trục Kim Ngưu–Bạch Dương'), `轴短语被误伤改写：${out2}`);
  });

  test('流月行星 + 尾部 «của bạn»（生产实测误报·必须零改动）', () => {
    // 2026-09-10 生产实测：模型写流月 “Sao Mộc tại Sư Tử trong Nhà 12 của bạn”（真值本命木星 Cự Giải H11）、
    // “Sao Kim Bọ Cạp tại Nhà 1” —— 从句里的 của bạn 修饰的是宫不是行星，绝不可当成 natal 去改
    const ch = chartOf(MATRICES[0]);
    roundTrip('Sao Mộc tại Sư Tử trong Nhà 12 của bạn mở rộng trực giác và kết nối với vô thức tập thể.', ch, [], true);
    roundTrip('Sao Kim Bọ Cạp tại Nhà 1 lại kéo bạn ra ánh sáng với sức hút khó cưỡng.', ch, [], true);
    roundTrip('Mặt Trời natal Libra trong Nhà 12 thôi thúc bạn lùi lại, nhưng Sao Kim Bọ Cạp tại Nhà 1 lại kéo bạn ra.', ch, [], true);
  });

  test('跨句夺宫【生产血泪·2026-09-10】：太阳任务不得改写月亮从句', () => {
    const m = MATRICES[2];                       // 1992-03-17：月 Virgo H4 / 日 Pisces H11
    const ch = chartOf(m);
    const trap = 'Cạm bẫy lớn nhất tháng này nằm ở Nhà 5 — nơi Mặt Trời và Sao Thủy hội tụ tại Xử Nữ — kết hợp với Mặt Trăng natal của bạn ở Xử Nữ Nhà 11. Bạn sẽ bị cám dỗ chi tiêu.';
    const out = lockNatalTruthVi.lockNatalTruthVi(trap, ch);
    const claimed = [...out.matchAll(/Mặt Trăng natal[^.\n]{0,70}?Nhà (\d+)/g)].map((x) => Number(x[1]));
    assert.deepStrictEqual([...new Set(claimed)], [4], `月亮从句宫位应唯一为 4，实际 ${JSON.stringify(claimed)}\n${out}`);
    assert.ok(out.includes('Xử Nữ Nhà 4'), out);
  });

  test('astroMatrix 缺失时安全透传（不崩溃、不改写）', () => {
    const t = 'Mặt Trăng natal Ma Kết Nhà 8 của bạn.';
    assert.strictEqual(lockNatalTruthVi.lockNatalTruthVi(t, null), t);
    assert.strictEqual(lockNatalTruthVi.lockNatalTruthVi('', chartOf(MATRICES[0])), '');
    assert.strictEqual(lockNatalTruthVi.lockNatalTruthVi(t, { meta: {} }), t);
  });
});

// ─────────────────────────────────────────────────
// V424 泰语本命真值锁测试（镜像 V423 越南语审计门）
// ─────────────────────────────────────────────────
const _from_TH = SRC.indexOf('// ── V424');
const _to_TH = SRC.indexOf('function lockNatalTruthVi');
if (_from_TH < 0 || _to_TH < 0) throw new Error('未能从 server.js 提取 lockNatalTruthTh 源码块');
const BLOCK_TH = SRC.slice(_from_TH, _to_TH);
// _EN2ZIDX 在 server.js 2829行，_natalTruthMap10_TH 引用了它，必须一起 prepend
const _EN2ZIDX_DECL = "const _EN2ZIDX = { Aries:0,Taurus:1,Gemini:2,Cancer:3,Leo:4,Virgo:5,Libra:6,Scorpio:7,Sagittarius:8,Capricorn:9,Aquarius:10,Pisces:11 }";
const SUN_SIGN_TH_DECL = "const SUN_SIGN_TH = ['เมษ','พฤษภ','มิถุน','กรกฏ','สิงห์','กันยา','ตุลย์','พิจิก','ธนู','มังกร','กุมภ์','มีน'];";
const lockNatalTruthTh = new Function(`${_EN2ZIDX_DECL};${SUN_SIGN_TH_DECL};${BLOCK_TH}\nreturn lockNatalTruthTh;`)();
assert.strictEqual(typeof lockNatalTruthTh, 'function', 'lockNatalTruthTh 应被成功提取');

const TH = {
  Sun: 'ดวงอาทิตย์', Moon: 'ดวงจันทร์', Mercury: 'ดาวพุธ', Venus: 'ดาวศุกร์', Mars: 'ดาวอังคาร',
  Jupiter: 'ดาวพฤหัสบดี', Saturn: 'ดาวเสาร์', Uranus: 'ดาวยูเรนัส', Neptune: 'ดาวเนปจูน', Pluto: 'ดาวพลูโต',
};
const TH_ORDER = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
const TH_SIGNS = ['เมษ','พฤษภ','มิถุน','กรกฏ','สิงห์','กันยา','ตุลย์','พิจิก','ธนู','มังกร','กุมภ์','มีน'];
const EN_MAP = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

const roundTripTh = (input, ch, pairs, identical = false) => {
  const out = lockNatalTruthTh(input, ch);
  let norm = out;
  for (const [truth, wrong] of pairs) norm = norm.split(truth).join(wrong);
  assert.strictEqual(norm, input, `Thai 往返不一致（掉字/重字）\nIN : ${input}\nOUT: ${out}`);
  if (identical) assert.strictEqual(out, input, `Thai 应零改动但被改了\nOUT: ${out}`);
  return out;
};

const chartOfTh = (m) => ({
  meta: { ...m.meta, natal_moon: m.meta.natal_moon, computed_houses: m.meta.computed_houses },
});

const truthOfTh = (m, planet) => {
  const info = planet === 'Moon' ? (m.meta.natal_moon || m.meta.computed_houses.Moon) : m.meta.computed_houses[planet];
  const enSign = info.sign; // English sign name from SwissEph
  const thIdx = EN_MAP.indexOf(enSign);
  const thSign = thIdx >= 0 ? TH_SIGNS[thIdx] : null;
  return { sign: thSign, house: info.house };
};

const WRONG_TH_SIGN = (s) => {
  const idx = TH_SIGNS.indexOf(s);
  return TH_SIGNS[(idx + 5) % 12];
};
const WRONG_TH_HOUSE = (h) => (h === 12 ? 1 : h + 1);

describe('V424 泰语本命真值锁 · 10 行星逐项真值轴（SwissEph 实算）', () => {
  for (let pi = 0; pi < PROFILES.length; pi++) {
    test(`Thai profile ${pi + 1} (${PROFILES[pi].bd})：10 行星各自的漂移都必须归真`, async () => {
      const m = MATRICES[pi];
      const ch = chartOfTh(m);
      let checked = 0;
      for (const p of TH_ORDER) {
        const t = truthOfTh(m, p);
        if (!t.sign || !t.house) continue;
        const name = TH[p];
        const ws = WRONG_TH_SIGN(t.sign), wh = WRONG_TH_HOUSE(t.house);
        const inc = `${name} natal ของคุณอยู่ใน${ws} บ้าน ${wh}.`;
        const out = roundTripTh(inc, ch, [[t.sign, ws], [`บ้าน ${t.house}`, `บ้าน ${wh}`]]);
        assert.ok(out.includes(`${t.sign} บ้าน ${t.house}`), `${p} 未归真：${out}`);
        assert.ok(!new RegExp(`บ้าน\\s*${wh}(?!\\d)`).test(out), `${p} 仍残留错值宫位：${out}`);
        checked++;
      }
      assert.ok(checked >= 8, `应至少校验 8 行星，实际 ${checked}`);
    });
  }
});

describe('V424 泰语本命真值锁 · 越界与流月保护（不许误伤）', () => {
  test('流月(transit)动词绝不触发替换（กำลัง/ผ่าน/เคลื่อน）', () => {
    const ch = chartOfTh(MATRICES[0]); // 1990-08-05: Sun Leo, Moon Cap
    roundTripTh('ดวงอาทิตย์กำลังเคลื่อนเข้าสู่ราศีกันยา', ch, [], true);
    roundTripTh('ดาวพฤหัสบดีผ่านในราศีมังกร บ้าน 5', ch, [], true);
    roundTripTh('ดวงจันทร์เคลื่อนผ่านราศีสิงห์ บ้าน 12', ch, [], true);
  });

  test('本命声明正确时零改动', () => {
    const ch = chartOfTh(MATRICES[0]); // Sun Leo สิงห์ H12, Moon Cap มังกร H5
    roundTripTh('ดวงอาทิตย์ natal ของคุณอยู่ในราศีสิงห์ บ้าน 12', ch, [], true);
    roundTripTh('ดวงจันทร์ natal ของคุณอยู่ในราศีมังกร บ้าน 5', ch, [], true);
  });

  test('本命太阳写错星座+宫位（流月Virgo vs 真值Leo）→ 必须归真', () => {
    const ch = chartOfTh(MATRICES[0]); // 真值: Sun Leo สิงห์ H12
    const out = lockNatalTruthTh('ดวงอาทิตย์ natal ของคุณอยู่ในราศีกันยา บ้าน 1', ch);
    assert.ok(out.includes('ราศีสิงห์'), `太阳未归真至Leo：${out}`);
    assert.ok(out.includes('บ้าน 12'), `太阳宫位未归真至H12：${out}`);
    assert.ok(!out.includes('ราศีกันยา บ้าน 1'), `旧错值仍残留：${out}`);
  });

  test('astroMatrix 缺失时安全透传（不崩溃、不改写）', () => {
    const t = 'ดวงอาทิตย์ natal ของคุณอยู่ในราศีกันยา บ้าน 1.';
    assert.strictEqual(lockNatalTruthTh(t, null), t);
    assert.strictEqual(lockNatalTruthTh('', chartOfTh(MATRICES[0])), '');
    assert.strictEqual(lockNatalTruthTh(t, { meta: {} }), t);
  });

  test('泰国真实月报格式：ดวงจันทร์ natal ของคุณอยู่ในราศีมังกร บ้าน 5（生产实测·必须零改动）', () => {
    const ch = chartOfTh(MATRICES[0]); // 真值 Cap มังกร H5
    roundTripTh('ดวงจันทร์ natal ของคุณอยู่ในราศีมังกร บ้าน 5', ch, [], true);
  });

  test('无 transit 动词、无 natal 标记时零改动（泛指行星描述）', () => {
    const ch = chartOfTh(MATRICES[0]);
    roundTripTh('ดาวพุธในราศีกันยาเป็นลัคนาของคุณ', ch, [], true);
    roundTripTh('การเงินเดือนนี้อาจมีปัญหา ควรออมเงิน 5000 บาท', ch, [], true);
  });
});
