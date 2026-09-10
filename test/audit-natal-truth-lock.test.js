// 🛠️ V421 回归门：本命盘真值硬锁 lockNatalTruthVi
// 不变量：① 修后「真值↔错值」往返替换必须与原文逐字符相同（抓掉字/重字）
//        ② 越界保护：他行星的星座/宫位绝不被污染；流月(transit)描述绝不被改写
import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
const BLOCK = SRC.match(/const _EN2ZIDX[\s\S]*?\nfunction _viForceHouseInClause[\s\S]*?\n\}\n/);
if (!BLOCK) throw new Error('未能从 server.js 提取 lockNatalTruthVi 源码块');
const SUN_SIGN_VI_DECL = "const SUN_SIGN_VI = ['Bạch Dương','Kim Ngưu','Song Tử','Cự Giải','Sư Tử','Xử Nữ','Thiên Bình','Bọ Cạp','Nhân Mã','Ma Kết','Bảo Bình','Song Ngư'];";
// ESM 严格模式下 eval 不会外泄声明，改用 new Function 工厂把函数取出来
const lockNatalTruthVi = new Function(`${SUN_SIGN_VI_DECL}\n${BLOCK[0]}\nreturn lockNatalTruthVi;`)();
assert.strictEqual(typeof lockNatalTruthVi, 'function', 'lockNatalTruthVi 应被成功提取');

const chart = (ms, mh, ss, sh) => ({ meta: { sun_sign: ss, natal_moon: { sign: ms, house: mh }, computed_houses: { Sun: { house: sh }, Moon: { sign: ms, house: mh } } } });
const CAP_H5 = chart('Capricorn', 5, 'Leo', 12);      // 1990-08-05 真值
const VIR_H4 = chart('Virgo', 4, 'Pisces', 11);       // 1992-03-17 真值

// pairs: [真值token, 原文错值token]
function roundTrip(input, ch, pairs, identical = false) {
  const out = lockNatalTruthVi(input, ch);
  let norm = out;
  for (const [truth, wrong] of pairs) norm = norm.split(truth).join(wrong);
  assert.strictEqual(norm, input, `往返不一致（掉字/重字）\nIN : ${input}\nOUT: ${out}`);
  if (identical) assert.strictEqual(out, input, `应零改动但被改了\nOUT: ${out}`);
  return out;
}

test('① 本命月亮宫位漂移 8→5 归真', () => {
  roundTrip('Mặt Trăng natal Ma Kết Nhà 8 của bạn được kích hoạt nhẹ nhàng.', CAP_H5, [['Nhà 5', 'Nhà 8']]);
});

test('② 星座替换改变字长时不得掉字/重字', () => {
  const out = roundTrip('Mặt Trăng natal của bạn ở Song Ngư Nhà 5 hỗ trợ bạn.', VIR_H4, [['Xử Nữ', 'Song Ngư'], ['Nhà 4', 'Nhà 5']]);
  assert.ok(out.includes('Xử Nữ Nhà 4'), out);
});

test('③ 他行星的星座/宫位绝不被污染', () => {
  roundTrip('Mặt Trăng natal Ma Kết Nhà 5 hòa hợp với Sao Kim tại Bọ Cạp Nhà 3.', CAP_H5, [], true);
});

test('④ 复合句「你的月亮和X」宫位归真', () => {
  roundTrip('nơi Mặt Trăng và Sao Kim của bạn cùng ngự trị ở Nhà 3.', CAP_H5, [['Nhà 5', 'Nhà 3']]);
});

test('⑤ 流月(transit)描述绝不改写', () => {
  roundTrip('Mặt Trăng đi qua Bọ Cạp Nhà 3 của bạn hôm nay.', CAP_H5, [], true);
});

test('⑥ 宫位属于他星时（你的 在星体名之前）不碰', () => {
  roundTrip('Mặt Trăng của bạn và Sao Kim tại Bọ Cạp Nhà 3.', CAP_H5, [], true);
});

test('⑦ 无本命锚点的普通文本零改动', () => {
  roundTrip('Hôm nay trời đẹp, bạn nên tiết kiệm 500.000 ₫.', CAP_H5, [], true);
});

test('⑨ 跨句夺宫【生产血泪·2026-09-10】太阳任务不得改写月亮从句的宫位', () => {
  // 生产实例：太阳/水星在 Nhà 5，月亮在 Nhà 4；旧规则误把 “của bạn” 判为复合句，
  // 太阳任务越界把月亮的 Nhà 4 改回 Nhà 11（太阳的宫位）→ 同一锚点出现两个宫位
  const trap = 'Cạm bẫy lớn nhất tháng này nằm ở Nhà 5 — nơi Mặt Trời và Sao Thủy hội tụ tại Xử Nữ — kết hợp với Mặt Trăng natal của bạn ở Xử Nữ Nhà 11. Bạn sẽ bị cám dỗ chi tiêu.';
  const out = roundTrip(trap, VIR_H4, [['Nhà 4', 'Nhà 11']]);
  assert.ok(!/Mặt Trăng natal[^.\n]{0,70}?Nhà 11/.test(out), `月亮从句仍残留 Nhà 11：${out}`);
  assert.ok(out.includes('Xử Nữ Nhà 4'), out);
});

test('⑩ 太阳从句在前、月亮从句在后：双方宫位各归各位（零改动）', () => {
  roundTrip('Mặt Trời natal của bạn ở Song Ngư Nhà 11, kết hợp với Mặt Trăng natal của bạn ở Xử Nữ Nhà 4.', VIR_H4, [], true);
});

test('⑧ astroMatrix 缺失时安全透传（不崩溃、不改写）', () => {
  const t = 'Mặt Trăng natal Ma Kết Nhà 8 của bạn.';
  assert.strictEqual(lockNatalTruthVi(t, null), t);
  assert.strictEqual(lockNatalTruthVi('', CAP_H5), '');
});
