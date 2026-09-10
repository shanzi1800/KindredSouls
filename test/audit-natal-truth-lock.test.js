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
const BLOCK = SRC.match(/const _EN2ZIDX[\s\S]*?\nfunction lockNatalTruthVi[\s\S]*?\n\}\n/);
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

test('⑧ astroMatrix 缺失时安全透传（不崩溃、不改写）', () => {
  const t = 'Mặt Trăng natal Ma Kết Nhà 8 của bạn.';
  assert.strictEqual(lockNatalTruthVi(t, null), t);
  assert.strictEqual(lockNatalTruthVi('', CAP_H5), '');
});
