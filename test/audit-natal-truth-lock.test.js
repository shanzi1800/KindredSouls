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
const lockNatalTruthVi = new Function(`${SUN_SIGN_VI_DECL}\n${BLOCK}\nreturn { lockNatalTruthVi, lockTransitTruthVi, _VI_PLANET, _VI_PLANET_ORDER, _EN2ZIDX, SUN_SIGN_VI, lockNatalTruthFr, lockTransitTruthFr, _FR_PLANET, _FR_PLANET_ORDER, _FR_SIGN_FR };`)();
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
const SUN_SIGN_TH_DECL = "const SUN_SIGN_TH = ['เมษ','พฤษภ','มิถุน','กรกฎ','สิงห์','กันยา','ตุลย์','พิจิก','ธนู','มังกร','กุมภ์','มีน'];";
const _extractedTH = new Function(`${_EN2ZIDX_DECL};${SUN_SIGN_TH_DECL};${BLOCK_TH}\nreturn { lockNatalTruthTh, lockTransitTruthTh };`)();
const lockNatalTruthTh = _extractedTH.lockNatalTruthTh;
const lockTransitTruthTh = _extractedTH.lockTransitTruthTh;
assert.strictEqual(typeof lockNatalTruthTh, 'function', 'lockNatalTruthTh 应被成功提取');
assert.strictEqual(typeof lockTransitTruthTh, 'function', 'lockTransitTruthTh 应被成功提取');

const TH = {
  Sun: 'ดวงอาทิตย์', Moon: 'ดวงจันทร์', Mercury: 'ดาวพุธ', Venus: 'ดาวศุกร์', Mars: 'ดาวอังคาร',
  Jupiter: 'ดาวพฤหัสบดี', Saturn: 'ดาวเสาร์', Uranus: 'ดาวยูเรนัส', Neptune: 'ดาวเนปจูน', Pluto: 'ดาวพลูโต',
};
const TH_ORDER = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
const TH_SIGNS = ['เมษ','พฤษภ','มิถุน','กรกฎ','สิงห์','กันยา','ตุลย์','พิจิก','ธนู','มังกร','กุมภ์','มีน'];
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

  // ── V424-fix7: 巨蟹座字符กรกฎ(DO CHADA)对齐 + โคจร/ออกจาก natal 隐喻误杀回归门 ──
  const _cancerChart = {
    meta: {
      natal_moon: { sign: 'Cancer', house: 5 },
      computed_houses: {
        Sun: { sign: 'Leo', house: 12 }, Moon: { sign: 'Cancer', house: 5 },
        Mercury: { sign: 'Cancer', house: 3 }, Venus: { sign: 'Libra', house: 11 },
        Mars: { sign: 'Taurus', house: 9 }, Jupiter: { sign: 'Cancer', house: 3 },
        Saturn: { sign: 'Capricorn', house: 3 }, Uranus: { sign: 'Capricorn', house: 3 },
        Neptune: { sign: 'Capricorn', house: 3 }, Pluto: { sign: 'Scorpio', house: 1 },
      },
    },
  };
  test('🔥 V424-fix7: 巨蟹座字符กรกฎ必须能匹配与归真（BP/DC 字符错位回归）', () => {
    const ch = chartOfTh(_cancerChart); // Moon/Hg/Jupiter 真值 Cancer=กรกฎ
    const out = lockNatalTruthTh('ดวงจันทร์ natal ของคุณอยู่ในราศีพฤษภ บ้าน 8', ch);
    assert.ok(out.includes('กรกฎ'), `月亮未归真至กรกฎ(Cancer)：${out}`);
    assert.ok(out.includes('บ้าน 5'), `月亮宫位未归真至H5：${out}`);
  });
  test('🔥 V424-fix7: โคจร(本轮周期="การโคจรครั้งนี้")在natal句中不得误判transit跳过', () => {
    const ch = chartOfTh(_cancerChart); // Mercury 真值 Cancer กรกฎ H3
    const out = lockNatalTruthTh('ดาวพุธ natal ของคุณอยู่ในราศีพิจิก บ้าน 9 การโคจรครั้งนี้กระตุ้น', ch);
    assert.ok(out.includes('กรกฎ'), `Mercury未归真至กรกฎ：${out}`);
    assert.ok(out.includes('บ้าน 3'), `Mercury宫位未归真至H3：${out}`);
  });
  test('🔥 V424-fix7: ออกจาก(逃离陷阱="ออกจากกับดัก")在natal句中不得误判transit跳过', () => {
    const ch = chartOfTh(_cancerChart); // Mercury 真值 Cancer กรกฎ H3
    const out = lockNatalTruthTh('ดาวพุธ natal ของคุณอยู่ในราศีพิจิก บ้าน 9 ในการแยกแยะโอกาสจริงออกจากกับดัก', ch);
    assert.ok(out.includes('กรกฎ'), `Mercury未归真至กรกฎ：${out}`);
    assert.ok(out.includes('บ้าน 3'), `Mercury宫位未归真至H3：${out}`);
  });
});

describe('V424-B2 泰语 transit 真值硬锁（治本命盘混入 transit 句·SwissEph 9月 transit 真值）', () => {
  // 2026-09 transit 真值（SwissEph 实算）：日月水金火木土天海冥
  const TRANSIT = {
    months: [{
      sun: { sign: 'Leo', house: 12 },
      moon: { sign: 'Cancer', house: 11 },
      mercury: { sign: 'Libra', house: 1 },
      venus: { sign: 'Scorpio', house: 2 },
      mars: { sign: 'Cancer', house: 11 },
      jupiter: { sign: 'Leo', house: 12 },
      saturn: { sign: 'Aries', house: 7 },
      uranus: { sign: 'Gemini', house: 9 },
      neptune: { sign: 'Aries', house: 7 },
      pluto: { sign: 'Aquarius', house: 5 },
    }],
  };

  test('transit 句含 natal 星座 → 必须归真至 transit 真值', () => {
    const out = lockTransitTruthTh('ดาวพฤหัสบดีทรานซิสในราศีธนู บ้าน 3', TRANSIT);
    assert.ok(out.includes('ราศีสิงห์'), `Jupiter transit 未归真至 Leo：${out}`);
    assert.ok(out.includes('บ้าน 12'), `Jupiter transit 宫位未归真至 H12：${out}`);
  });

  test('本命句(กำเนิด) 绝不被 transit 锁改动', () => {
    const t = 'ดวงจันทร์กำเนิดในราศีเมษ บ้าน 8';
    assert.strictEqual(lockTransitTruthTh(t, TRANSIT), t);
  });

  test('已正确的 transit 句零改动', () => {
    const t = 'ดาวพฤหัสบดีทรานซิสในราศีสิงห์ บ้าน 12';
    assert.strictEqual(lockTransitTruthTh(t, TRANSIT), t);
  });

  test('无 transit 标记的泛指句零改动（防误伤）', () => {
    const t = 'ดวงอาทิตย์ในราศีสิงห์ บ้าน 12 ช่วยให้คุณมั่นใจ';
    assert.strictEqual(lockTransitTruthTh(t, TRANSIT), t);
  });

  test('多行星 transit 句各自归真（不互踩）', () => {
    const out = lockTransitTruthTh('ดาวพฤหัสบดีทรานซิสในราศีธนู บ้าน 3.ดาวอังคารทรานซิสในราศีกันยา บ้าน 5', TRANSIT);
    assert.ok(out.includes('ราศีสิงห์'), `Jupiter 未归真：${out}`);
    assert.ok(out.includes('ราศีกรกฎ'), `Mars 未归真至 Cancer：${out}`);
  });

  test('astroMatrix 缺失时安全透传（不崩溃、不改写）', () => {
    const t = 'ดาวพฤหัสบดีทรานซิสในราศีธนู บ้าน 3';
    assert.strictEqual(lockTransitTruthTh(t, null), t);
    assert.strictEqual(lockTransitTruthTh('', TRANSIT), '');
    assert.strictEqual(lockTransitTruthTh(t, { months: [{}] }), t);
  });
});

// ── V424-B2 越南语 transit 真值硬锁（治本命盘混入 transit 段·SwissEph 真值）──
describe('V424-B2 越南语 transit 真值硬锁（治本命盘混入 transit 段）', () => {
  test('transit 句(含 tại) 必须用 months[0] 真值归真（10 行星全量）', async () => {
    const m = MATRICES[0];
    if (!m.months || !m.months[0]) return;
    const first = m.months[0];
    const EN2Z = lockNatalTruthVi._EN2ZIDX;
    let checked = 0;
    for (const p of lockNatalTruthVi._VI_PLANET_ORDER) {
      const k = p.toLowerCase();
      const info = p === 'Sun' ? (first.sun || {}) : (first[k] || {});
      if (!info?.sign || !info?.house) continue;
      const truthSign = SIGNS[EN2Z[info.sign]];
      const truthHouse = info.house;
      const name = VI[p];
      const ws = WRONG_SIGN_OF(truthSign), wh = WRONG_HOUSE_OF(truthHouse);
      const inc = `${name} tại ${ws} Nhà ${wh} chiếu rọi tài chính tháng này.`;
      const out = lockNatalTruthVi.lockTransitTruthVi(inc, m);
      assert.ok(out.includes(truthSign), `${p} transit 星座未归真至 ${truthSign}：${out}`);
      assert.ok(out.includes(`Nhà ${truthHouse}`), `${p} transit 宫位未归真至 ${truthHouse}：${out}`);
      assert.ok(!new RegExp(`${ws} Nhà`).test(out), `${p} 仍残留错值星座：${out}`);
      assert.ok(!new RegExp(`Nhà\\s*${wh}(?!\\d)`).test(out), `${p} 仍残留错值宫位：${out}`);
      checked++;
    }
    assert.ok(checked >= 10, `应至少校验 10 行星，实际 ${checked}`);
  });

  test('本命句(含 natal/bản mệnh) 绝不被 transit 锁改动', () => {
    const m = MATRICES[0];
    const info = m.meta.natal_moon || m.meta.computed_houses.Moon;
    const EN2Z = lockNatalTruthVi._EN2ZIDX;
    const truthSign = SIGNS[EN2Z[info.sign]];
    const truthHouse = info.house;
    const inc = `Mặt Trăng natal của bạn ở ${truthSign} Nhà ${truthHouse} khuếch đại trực giác.`;
    const out = lockNatalTruthVi.lockTransitTruthVi(inc, m);
    assert.strictEqual(out, inc, `transit 锁误改本命句：${out}`);
  });

  test('正确的 transit 句(含 tại + 正确真值) 零改动', () => {
    const m = MATRICES[0];
    const first = m.months[0];
    const EN2Z = lockNatalTruthVi._EN2ZIDX;
    const info = first.jupiter || {};
    if (!info?.sign || !info?.house) return;
    const truthSign = SIGNS[EN2Z[info.sign]];
    const truthHouse = info.house;
    const inc = `Sao Mộc tại ${truthSign} Nhà ${truthHouse} khuếch đại trực giác tài chính.`;
    const out = lockNatalTruthVi.lockTransitTruthVi(inc, m);
    assert.strictEqual(out, inc, `正确 transit 句被误改：${out}`);
  });

  test('无位置标记的泛指句零改动（防误伤）', () => {
    const m = MATRICES[0];
    const t = 'Hôm nay trời đẹp, bạn nên tiết kiệm 500.000 ₫.';
    assert.strictEqual(lockNatalTruthVi.lockTransitTruthVi(t, m), t);
  });

  test('astroMatrix 无 months 时安全透传（不崩溃、不改写）', () => {
    const t = 'Sao Mộc tại Bọ Cạp Nhà 3 thúc đẩy giao tiếp.';
    assert.strictEqual(lockNatalTruthVi.lockTransitTruthVi(t, null), t);
    assert.strictEqual(lockNatalTruthVi.lockTransitTruthVi(t, {}), t);
    assert.strictEqual(lockNatalTruthVi.lockTransitTruthVi(t, { months: [{}] }), t);
  });

  test('LLM 拼写错误星座(Sư Lửa≠Sư Tử) 必须兜底归真（_viPatchZone 盲区修复）', () => {
    const m = MATRICES[0];
    const first = m.months[0];
    const info = first.jupiter || {};
    if (!info?.sign || !info?.house) return;
    const EN2Z = lockNatalTruthVi._EN2ZIDX;
    const truthSign = SIGNS[EN2Z[info.sign]];
    const truthHouse = info.house;
    // Sư Lửa 不在 SUN_SIGN_VI 字典内（真值 Sư Tử 的拼写错误）→ 触发盲区兜底归真
    const inc = `Sao Mộc tại Sư Lửa Nhà ${truthHouse} tỏa sáng tài chính.`;
    const out = lockNatalTruthVi.lockTransitTruthVi(inc, m);
    assert.ok(out.includes(truthSign), `拼写错误未归真至 ${truthSign}：${out}`);
    assert.ok(out.includes(`Nhà ${truthHouse}`), `宫位未保留：${out}`);
    assert.ok(!out.includes('Sư Lửa'), `拼写错词 Sư Lửa 残留：${out}`);
  });
});

// ── V426: 法语 natal+transit 真值双锁（镜像 V423/V424/V425，治本命盘混入 transit 段）
describe('V426 法语 natal+transit 真值双锁（治本命盘混入 transit 段·SwissEph 真值）', () => {
  const FR = lockNatalTruthVi;  // 复用上方 new Function 工厂（已导出 fr 函数）
  const FR_PLANET = FR._FR_PLANET;
  const FR_SIGN = FR._FR_SIGN_FR;
  const FR_ORDER = FR._FR_PLANET_ORDER;
  const EN2Z = FR._EN2ZIDX;
  const WRONG_FR_SIGN = (s) => FR_SIGN[(FR_SIGN.indexOf(s) + 5) % 12];
  const WRONG_FR_HOUSE = (h) => (h === 12 ? 1 : h + 1);

  test('natal 句(含 natal/natale) 必须用 meta 真值归真（10 行星全量）', async () => {
    const m = MATRICES[0];
    if (!m.meta || !m.meta.computed_houses) return;
    let checked = 0;
    for (const p of FR_ORDER) {
      const info = p === 'Moon' ? (m.meta.natal_moon || m.meta.computed_houses.Moon) : m.meta.computed_houses[p];
      if (!info || !info.sign || !info.house) continue;
      const truthSign = FR_SIGN[EN2Z[info.sign]];
      const truthHouse = info.house;
      const name = FR_PLANET[p];
      const ws = WRONG_FR_SIGN(truthSign), wh = WRONG_FR_HOUSE(truthHouse);
      const inc = name + ' natal en ' + ws + ' Maison ' + wh + ' avec influences profondes.';
      const out = FR.lockNatalTruthFr(inc, m);
      assert.ok(out.includes(truthSign), p + ' natal 星座未归真至 ' + truthSign + '：' + out);
      assert.ok(out.includes('Maison ' + truthHouse), p + ' natal 宫位未归真至 ' + truthHouse + '：' + out);
      assert.ok(!out.includes(ws), p + ' 仍残留错值星座：' + out);
      checked++;
    }
    assert.ok(checked >= 10, '应至少校验 10 行星，实际 ' + checked);
  });

  test('transit 句(含 en [星座]) 必须用 months[0] 真值归真（10 行星全量）', async () => {
    const m = MATRICES[0];
    if (!m.months || !m.months[0]) return;
    const first = m.months[0];
    let checked = 0;
    for (const p of FR_ORDER) {
      const k = p.toLowerCase();
      const info = p === 'Sun' ? (first.sun || {}) : (first[k] || {});
      if (!info || !info.sign || !info.house) continue;
      const truthSign = FR_SIGN[EN2Z[info.sign]];
      const truthHouse = info.house;
      const name = FR_PLANET[p];
      const ws = WRONG_FR_SIGN(truthSign), wh = WRONG_FR_HOUSE(truthHouse);
      const inc = name + ' en ' + ws + ' Maison ' + wh + ' brille ce mois-ci.';
      const out = FR.lockTransitTruthFr(inc, m);
      assert.ok(out.includes(truthSign), p + ' transit 星座未归真至 ' + truthSign + '：' + out);
      assert.ok(out.includes('Maison ' + truthHouse), p + ' transit 宫位未归真至 ' + truthHouse + '：' + out);
      assert.ok(!out.includes(ws), p + ' 仍残留错值星座：' + out);
      checked++;
    }
    assert.ok(checked >= 10, '应至少校验 10 行星，实际 ' + checked);
  });

  test('本命句(含 natal) 绝不被 transit 锁改动', () => {
    const m = MATRICES[0];
    const info = (m.meta.natal_moon || m.meta.computed_houses.Moon);
    const truthSign = FR_SIGN[EN2Z[info.sign]];
    const truthHouse = info.house;
    const inc = 'Lune natale en ' + truthSign + ' Maison ' + truthHouse + " amplifie l'intuition.";
    const out = FR.lockTransitTruthFr(inc, m);
    assert.strictEqual(out, inc, 'transit 锁误改本命句：' + out);
  });

  test('正确的 transit 句(含 en + 正确真值) 零改动', () => {
    const m = MATRICES[0];
    const first = m.months[0];
    const info = first.jupiter || {};
    if (!info || !info.sign || !info.house) return;
    const truthSign = FR_SIGN[EN2Z[info.sign]];
    const truthHouse = info.house;
    const inc = 'Jupiter en ' + truthSign + ' Maison ' + truthHouse + ' brille de mille feux.';
    const out = FR.lockTransitTruthFr(inc, m);
    assert.strictEqual(out, inc, '正确 transit 句被误改：' + out);
  });

  test('无位置标记的泛指句零改动（防误伤）', () => {
    const m = MATRICES[0];
    const t = "Aujourd'hui il fait beau, vous devriez économiser 500 €.";
    assert.strictEqual(FR.lockTransitTruthFr(t, m), t);
  });

  test('astroMatrix 无 months 时安全透传（不崩溃、不改写）', () => {
    const t = 'Jupiter en Bélier Maison 3 stimule la communication.';
    assert.strictEqual(FR.lockTransitTruthFr(t, null), t);
    assert.strictEqual(FR.lockTransitTruthFr(t, {}), t);
    assert.strictEqual(FR.lockTransitTruthFr(t, { months: [{}] }), t);
  });

  test('法语序数词宫位(septième maison) 错误时必须兜底归真（_frPatchZone 盲区修复）', () => {
    const m = MATRICES[0];
    const first = m.months[0];
    const EN2Z = FR._EN2ZIDX;
    const info = first.jupiter || {};
    if (!info || !info.sign || !info.house) return;
    const truthSign = FR_SIGN[EN2Z[info.sign]];
    const truthHouse = info.house;
    const WRONG_HOUSE = truthHouse === 12 ? 1 : truthHouse + 1;
    const ORD = {1:'première',2:'deuxième',3:'troisième',4:'quatrième',5:'cinquième',6:'sixième',7:'septième',8:'huitième',9:'neuvième',10:'dixième',11:'onzième',12:'douzième'};
    const CORRECT_ORD = ORD[truthHouse];
    const WRONG_ORD = ORD[WRONG_HOUSE];
    const inc = 'Jupiter en ' + truthSign + ' dans votre ' + WRONG_ORD + ' maison brille de mille feux.';
    const out = FR.lockTransitTruthFr(inc, m);
    assert.ok(out.includes(CORRECT_ORD + ' maison'), 'fr transit 序数词宫位未归真至 ' + truthHouse + ' (' + CORRECT_ORD + ')：' + out);
    assert.ok(!out.includes(WRONG_ORD + ' maison'), 'fr 仍残留错值序数词宫位 ' + WRONG_ORD + '：' + out);
  });

  // ── V428: 盲区补强（军师打靶暴露的三种非标准句式，SwissEph 真值轴）──
  test('V428 盲区①: 本命太阳同位语(la Vierge, votre Soleil de naissance) 必须归真', async () => {
    const m = MATRICES[0];
    const info = m.meta.computed_houses.Sun;
    if (!info || !info.sign || !info.house) return;
    const truthSign = FR_SIGN[EN2Z[info.sign]];
    const truthHouse = info.house;
    const ws = WRONG_FR_SIGN(truthSign), wh = WRONG_FR_HOUSE(truthHouse);
    const inc = 'la ' + ws + ', votre Soleil de naissance en Maison ' + wh + ' brille de mille feux.';
    const out = FR.lockNatalTruthFr(inc, m);
    assert.ok(out.includes(truthSign), '本命太阳同位语未归真至 ' + truthSign + '：' + out);
    assert.ok(!out.includes('la ' + ws + ','), '本命太阳仍残留错值星座 ' + ws + '：' + out);
  });

  test('V428 盲区②: 复合句多星体(Mars ... Maison X, et Neptune) 火星宫位必须归真', async () => {
    const m = MATRICES[0];
    const first = m.months[0];
    const info = first.mars || {};
    if (!info || !info.sign || !info.house) return;
    const truthSign = FR_SIGN[EN2Z[info.sign]];
    const truthHouse = info.house;
    const ws = WRONG_FR_SIGN(truthSign), wh = WRONG_FR_HOUSE(truthHouse);
    // 复合句：火星(错值) + et Neptune(另一行星) → 锁必须识别并修正火星宫位，不因 et Neptune 提前截断
    const inc = 'Le piège majeur réside dans la conjonction entre Mars en ' + ws + ', Maison ' + wh + ', et Neptune en Bélier, Maison 8, rétrograde';
    const out = FR.lockTransitTruthFr(inc, m);
    assert.ok(out.includes('Mars en ' + truthSign), '复合句火星星座未归真至 ' + truthSign + '：' + out);
    assert.ok(out.includes('Maison ' + truthHouse), '复合句火星宫位未归真至 ' + truthHouse + '：' + out);
  });

  test('V428 盲区③: 月末 entre en [Signe] 时序锁（应进入下月星座，防逆向移入）', async () => {
    const m = MATRICES[0];
    const first = m.months[0];
    const next = m.months[1];
    if (!first?.sun || !next?.sun) return;
    const curSign = FR_SIGN[EN2Z[first.sun.sign]];
    const nextSign = FR_SIGN[EN2Z[next.sun.sign]];
    if (curSign === nextSign) return;  // 当月与下月同座则无时序变化，跳过
    const curHouse = first.sun.house;
    // LLM 写当月星座 + 月末段落(Sept 23-30) → 应改为进入下月星座
    const inc = 'Le Soleil entre en ' + curSign + ', Maison ' + curHouse + ' — votre Soleil natal s illumine. Semaine 4: Sept 23–30';
    const out = FR.lockTransitTruthFr(inc, m);
    assert.ok(out.includes('entre en ' + nextSign), '月末 entre en 未归真至下月星座 ' + nextSign + '：' + out);
    assert.ok(!out.includes('entre en ' + curSign + ','), '月末 entre en 仍残留当月星座 ' + curSign + '：' + out);
  });
});
