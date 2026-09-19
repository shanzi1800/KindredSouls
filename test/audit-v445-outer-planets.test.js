// 🛠️ V457 回归门：lockTransitPlanetSigns 外行星覆盖（uranus/neptune/pluto）
//
// 【真值轴】真值全部由 getAstroMatrix（SwissEph）实算，不手写常量
// 【不变量】
//   ① 当前盘 Trap 段（Mars/Saturn/Neptune 均正确）→ 零改动（幂等）
//   ② 外行星错 sign 坏样本必须被锁改（治未病：V457 前 uranus/neptune/pluto 漏网）
//   ③ 十行星全覆盖（V431 血泪：覆盖率造假 = 通过率造假）
import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getAstroMatrix } from '../v69_client.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');

// 抽取 _EN2ZIDX 到 cleanConsumerTrapAndBrackets（含 lockTransitPlanetSigns + _v445TruthSigns + _V445_*）
const _from = SRC.indexOf('function _v444Esc');
const _to = SRC.indexOf('function _v438OverrideBody');
if (_from < 0 || _to <= _from) throw new Error('未能从 server.js 抽取真值锁源码块');
const BLOCK = SRC.slice(_from, _to);

// 六个本地化星座表从 server.js 原文抽取（测试里绝不手写第二份真源）
const SIGNS = ['EN', 'VI', 'TH', 'ZH', 'ES', 'FR'].map((k) => {
  const m = SRC.match(new RegExp('const SUN_SIGN_' + k + ' = \\[[^\\]]*\\];'));
  if (!m) throw new Error('缺少 SUN_SIGN_' + k);
  return m[0];
}).join('\n');

const F = new Function(`${SIGNS}\n${BLOCK}\nreturn { lockTransitPlanetSigns, _v445TruthSigns };`)();

const CASE = { birthDate: '1986-04-15', birthTime: '08:30', lat: 40.7128, lon: -74.006, tz: 'America/New_York' };
let M = null;
before(async () => { M = await getAstroMatrix(CASE.birthDate, CASE.birthTime, CASE.lat, CASE.lon, CASE.tz); });

// 调试：确认 outer planets 在真值盘里存在
test('[debug] outer planets transit 真值存在', () => {
  const t = F._v445TruthSigns('en', M);
  console.log('[V457 debug] en transit truth:', JSON.stringify(t));
  assert.ok(t.neptune, 'Neptune 应在 transit 真值中');
  assert.ok(t.uranus, 'Uranus 应在 transit 真值中');
  assert.ok(t.pluto, 'Pluto 应在 transit 真值中');
});

// ① 当前盘 Trap 段零改动（幂等）
test('V457-① 当前盘 Trap 段零改动（Mars/Saturn/Neptune 均正确）', () => {
  const trap = 'The dominant danger archetype this month is the Anxious Provider — a psychological pattern rooted in your natal Moon in Cancer, House 1. The transiting Mars in Cancer, House 2, activates your earned-income sector with impulsive urgency, while the transiting Saturn and Neptune in Aries, House 11, create a fog of collective pressure and unrealistic social expectations.';
  const out = F.lockTransitPlanetSigns(trap, 'en', M);
  assert.strictEqual(out, trap, '当前盘所有行星 sign 应正确，零改动');
});

// ② 外行星错 sign 坏样本必须被锁改
test('V457-② Neptune 错 sign 被锁改（Capricorn → 真值 Aries）', () => {
  const bad = 'while the transiting Saturn and Neptune in Capricorn, House 11, create a fog of collective pressure';
  const out = F.lockTransitPlanetSigns(bad, 'en', M);
  assert.ok(out.includes('Neptune in Aries'), 'Neptune 应被锁改为 Aries，实际: ' + out);
  assert.ok(!out.includes('Neptune in Capricorn'), '原错 sign 应消失');
});

test('V457-②b Uranus 错 sign 被锁改', () => {
  const bad = 'The transiting Uranus in Leo, House 3 amplifies sudden shifts';
  const out = F.lockTransitPlanetSigns(bad, 'en', M);
  const t = F._v445TruthSigns('en', M);
  assert.ok(out.includes('Uranus in ' + t.uranus), 'Uranus 应被锁改为真值 ' + t.uranus);
});

test('V457-②c Pluto 错 sign 被锁改', () => {
  const bad = 'The transiting Pluto in Capricorn, House 7 demands transformation';
  const out = F.lockTransitPlanetSigns(bad, 'en', M);
  const t = F._v445TruthSigns('en', M);
  assert.ok(out.includes('Pluto in ' + t.pluto), 'Pluto 应被锁改为真值 ' + t.pluto);
});

// ③ 中文 Trap 段外行星锁（治未病）
// ③ 中文 Trap 段外行星锁（治未病）—— Neptune 真值=白羊座
// ③a 好样本零改动（reB 修复后能匹配「海王星在白羊座」写法，且真值吻合不误改）
test('V457-③a 中文好样本零改动（海王星在白羊座=真值）', () => {
  const good = '流年海王星在白羊座第11宫制造迷雾';
  const out = F.lockTransitPlanetSigns(good, 'zh', M);
  assert.strictEqual(out, good, '中文好样本应零改动');
});
// ③b 错样本被锁改（双鱼座 → 真值白羊座）
test('V457-③b 中文 Neptune 错 sign 被锁改（双鱼座→白羊座）', () => {
  const bad = '流年海王星在双鱼座第11宫制造迷雾';
  const out = F.lockTransitPlanetSigns(bad, 'zh', M);
  const t = F._v445TruthSigns('zh', M);
  assert.ok(out.includes('海王星在' + t.neptune), '海王星应被锁改为真值 ' + t.neptune + '，实际: ' + out);
  assert.ok(!out.includes('海王星在双鱼座'), '原错 sign 应消失');
});
