// ═══════════════════════════════════════════════════════════════════
// V460-fix5 回归门：连词式行星真值漏网
//
// 线上实测（1990-08-08 14:15 America/Los_Angeles 中文月报）：
//   报告写「流年金星与流年水星同在天秤座第11宫」，
//   但引擎真值是【金星在天蝎座第11宫 / 水星在天秤座第11宫】。
//   根因：lockTransitPlanetSigns 的 zh reB 要求「金星(在)S座」紧邻，
//   「P1 与 P2 同在 S 座」这种连词句式让 P1 的错误星座完全漏网。
//
// 修法：命中「P1与/和 P2同(在)S座[第N宫]」，且两行星真值星座不同时，
//       拆成两段各自真值的独立从句；宫位取 months[0][k].house 真值，
//       拿不到就省略（绝不臆造）。
// ═══════════════════════════════════════════════════════════════════
import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');

// 抽取段必须【自含】被测函数的所有依赖：从 SUN_SIGN_EN（星座表定义处）
// 一直取到 lockTransitPlanetSigns 之前，里面包含 _v444Esc / _v444Signs /
// _V445_PLANET_KEYS / _V445_PLANET_NAMES / _v445TruthSigns / _v445TruthHouses /
// splitConjoinedPlanetClaims 全套。
const _a = SRC.indexOf('const SUN_SIGN_EN');
const _b = SRC.indexOf('function lockTransitPlanetSigns');
if (_a < 0 || _b <= _a) throw new Error('V460-fix5 测试：无法从 server.js 抽取目标段');
const F = new Function(SRC.slice(_a, _b) + '\nreturn { splitConjoinedPlanetClaims };')();

// 1990-08-08 14:15 LA 中文盘真值：金星天蝎H11 / 水星天秤H11 / 火星巨蟹H8
const M = {
  months: [{
    venus: { sign: 'Scorpio', house: 11 },
    mercury: { sign: 'Libra', house: 11 },
    mars: { sign: 'Cancer', house: 8 },
    jupiter: { sign: 'Leo', house: 9 },
  }],
};
const SAME = { months: [{ venus: { sign: 'Scorpio', house: 11 }, mercury: { sign: 'Scorpio', house: 11 } }] };

describe('V460-fix5：连词式行星真值漏网修复', () => {
  test('① 连词句里 P1 的错误星座被拆成两段真值', () => {
    assert.strictEqual(
      F.splitConjoinedPlanetClaims('流年金星与流年水星同在天秤座第11宫，它们搅动你的人际网络', 'zh', M),
      '流年金星在天蝎座第11宫、流年水星在天秤座第11宫，它们搅动你的人际网络');
  });

  test('② 原文星座恰为 P1 真值时同样归一（两侧都写真值）', () => {
    assert.strictEqual(
      F.splitConjoinedPlanetClaims('流年金星与流年水星同在天蝎座第11宫', 'zh', M),
      '流年金星在天蝎座第11宫、流年水星在天秤座第11宫');
  });

  test('③ 非连词句零改动', () => {
    const s = '流年金星在天蝎座第11宫让你在社交圈中散发吸引力';
    assert.strictEqual(F.splitConjoinedPlanetClaims(s, 'zh', M), s);
  });

  test('④ 「同时」等非星座连词不得误伤', () => {
    const s = '流年金星与流年水星同时提醒你留意现金流';
    assert.strictEqual(F.splitConjoinedPlanetClaims(s, 'zh', M), s);
  });

  test('⑤ 两行星真值星座相同时零改动（无拆分必要）', () => {
    const s = '流年金星与流年水星同在天蝎座第11宫';
    assert.strictEqual(F.splitConjoinedPlanetClaims(s, 'zh', SAME), s);
  });

  test('⑥ 幂等 + 无真值盘/他语种零改动', () => {
    const s = '流年金星与流年水星同在天秤座第11宫';
    const once = F.splitConjoinedPlanetClaims(s, 'zh', M);
    assert.strictEqual(F.splitConjoinedPlanetClaims(once, 'zh', M), once, '非幂等');
    assert.strictEqual(F.splitConjoinedPlanetClaims(s, 'zh', null), s, '无真值盘时被改动');
    assert.strictEqual(F.splitConjoinedPlanetClaims(s, 'en', M), s, '他语种被改动');
  });
});
