// V452 + V453 回归门
// V452：月亮周硬覆盖锁升级为「整段星座序列 span 替换」（位置无关，修 W1/W2/W3 开头错星座漏网）
// V453：本命锚点锁从「日月升」扩容到全 10 行星（sign+house+retrograde），真值源 meta.natal_planets
import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');

// ── 抽取依赖符号（与现有 V438 测试同套路）──
const sunStart = SRC.indexOf('const SUN_SIGN_EN');
const frStart = SRC.indexOf('const SUN_SIGN_FR');
const sunEnd = SRC.indexOf('];', frStart) + 2;
const SUN_DEFS = SRC.slice(sunStart, sunEnd);
const enz = SRC.match(/const _EN2ZIDX\s*=\s*\{[^}]*\};/);
if (!enz) throw new Error('extract _EN2ZIDX fail');
const ENZ = enz[0];
const v438 = SRC.slice(SRC.indexOf('function _v438WeekTruth'), SRC.indexOf('const _V444_TRANSIT_EXC_ZH'));
const v444v453 = SRC.slice(SRC.indexOf('const _V444_TRANSIT_EXC_ZH'), SRC.indexOf('// 月报章节标题兜底修复'));

const F = new Function(SUN_DEFS + '\n' + ENZ + '\n' + v438 + '\n' + v444v453 + '\nreturn { applyMoonWeekHardOverride, lockNatalAnchorRole };');
const { applyMoonWeekHardOverride, lockNatalAnchorRole } = F();

// Sept 2026, rising Scorpio 真值（moon_weeks，SwissEph）
const weeks = [
  { week: 1, legs: [
    { sign: 'Aries', house: 6 }, { sign: 'Taurus', house: 6 }, { sign: 'Taurus', house: 7 },
    { sign: 'Gemini', house: 7 }, { sign: 'Gemini', house: 8 }, { sign: 'Cancer', house: 8 },
    { sign: 'Cancer', house: 9 }, { sign: 'Leo', house: 9 } ] },
  { week: 2, legs: [
    { sign: 'Leo', house: 9 }, { sign: 'Leo', house: 10 }, { sign: 'Virgo', house: 10 },
    { sign: 'Virgo', house: 11 }, { sign: 'Libra', house: 11 }, { sign: 'Libra', house: 12 },
    { sign: 'Scorpio', house: 12 }, { sign: 'Scorpio', house: 1 } ] },
  { week: 3, legs: [
    { sign: 'Scorpio', house: 1 }, { sign: 'Sagittarius', house: 1 }, { sign: 'Sagittarius', house: 2 },
    { sign: 'Capricorn', house: 2 }, { sign: 'Capricorn', house: 3 }, { sign: 'Aquarius', house: 3 } ] },
  { week: 4, legs: [
    { sign: 'Aquarius', house: 3 }, { sign: 'Aquarius', house: 4 }, { sign: 'Pisces', house: 4 },
    { sign: 'Pisces', house: 5 }, { sign: 'Aries', house: 5 }, { sign: 'Aries', house: 6 },
    { sign: 'Taurus', house: 6 }, { sign: 'Taurus', house: 7 }, { sign: 'Gemini', house: 7 } ] },
];

test('V452：fr 月亮序列位置无关——开头错星座（上升幻觉）被整段真值替换', () => {
  // 真实报告格式：副标题 + 峰值日 排在月亮句之前（月亮句不在段首）
  const frText = [
    '✦[🟢 Semaine 1: Sept 1–7]',
    'Recharge de Richesse',
    '',
    'Fenêtre Cosmique Clé: Jour 5',
    '',
    'La Lune en transit traverse Scorpion (Maison 1) → Taureau (Maison 6→Maison 7) → Gémeaux (Maison 7→Maison 8) → Cancer (Maison 8→Maison 9) → Lion (Maison 9)',
    '✦[🔴 Semaine 2: Sept 8–14]',
    'La Lune en transit traverse Scorpion (Maison 9→Maison 10) → Vierge (Maison 10→Maison 11) → Balance (Maison 11→Maison 12) → Scorpion (Maison 12→Maison 1)',
  ].join('\n');
  const out = applyMoonWeekHardOverride(frText, 'fr', { months: [{ moon_weeks: weeks }] });
  // W1 真值首星座 = Aries(Bélier) Maison 6
  assert.ok(/La Lune en transit traverse Bélier \(Maison 6\)/.test(out), 'W1 开头应为 Bélier/Aries (Maison 6)');
  assert.ok(!/Scorpion \(Maison 1\)/.test(out), 'W1 错开头 Scorpion (Maison 1) 已清除');
  assert.ok(/Lion \(Maison 9\)$/.test(out.trim()) || /Lion \(Maison 9\)/.test(out), 'W1 尾 Lion (Maison 9) 保留');
  // W2 真值首星座 = Leo(Lion) Maison 9→10
  assert.ok(/La Lune en transit traverse Lion \(Maison 9→Maison 10\)/.test(out), 'W2 开头应为 Lion (Maison 9→Maison 10)');
  // 副标题/峰值日前方内容必须保留（位置无关）
  assert.ok(/Fenêtre Cosmique Clé: Jour 5/.test(out), '副标题/峰值日保留（位置无关）');
  // 幂等
  const out2 = applyMoonWeekHardOverride(out, 'fr', { months: [{ moon_weeks: weeks }] });
  assert.strictEqual(out2, out, 'V452 幂等：二次处理不变');
});

test('V452：en 月亮序列位置无关（副标题在前，开头错星座）', () => {
  const enWeeks = weeks.map(w => ({ week: w.week, legs: w.legs.map(l => ({ sign: l.sign, house: l.house })) }));
  const enText = [
    '✦[🟢 Week 1: Sep 1–7]',
    'Wealth Recharging',
    '',
    'The Moon transits through Scorpio (House 1) → Taurus (House 6→House 7) → Gemini (House 7→House 8) → Cancer (House 8→House 9) → Leo (House 9)',
  ].join('\n');
  const out = applyMoonWeekHardOverride(enText, 'en', { months: [{ moon_weeks: enWeeks }] });
  assert.ok(/The Moon transits through Aries \(House 6\)/.test(out), 'W1 开头应为 Aries (House 6)');
  assert.ok(!/Scorpio \(House 1\)/.test(out), 'W1 错开头 Scorpio (House 1) 已清除');
  assert.ok(/Wealth Recharging/.test(out), '副标题保留（位置无关）');
});

// 本命全 10 行星真值（1992-11-04 马赛，06:45）
function natalMeta() {
  return {
    sun_sign: 'Scorpio', rising_sign: 'Scorpio', natal_moon: { sign: 'Pisces', house: 4, retrograde: false },
    natal_planets: {
      Sun: { sign: 'Scorpio', house: 1, retrograde: false },
      Moon: { sign: 'Pisces', house: 4, retrograde: false },
      Mercury: { sign: 'Sagittarius', house: 2, retrograde: false },
      Venus: { sign: 'Sagittarius', house: 2, retrograde: false },
      Mars: { sign: 'Cancer', house: 9, retrograde: false },
      Jupiter: { sign: 'Libra', house: 11, retrograde: false },
      Saturn: { sign: 'Aquarius', house: 3, retrograde: true },
      Uranus: { sign: 'Capricorn', house: 3, retrograde: true },
      Neptune: { sign: 'Capricorn', house: 3, retrograde: true },
      Pluto: { sign: 'Scorpio', house: 1, retrograde: true },
    },
  };
}

test('V453：fr 本命金星（流月天蝎误当本命）→ Sagittaire Maison 2 direct', () => {
  const t = 'Votre Vénus en Scorpion, Maison 12, rétrograde : les dépenses invisibles, les abonnements oubliés.';
  const out = lockNatalAnchorRole(t, 'fr', { meta: natalMeta() });
  assert.ok(/Votre Vénus en Sagittaire, Maison 2, direct/.test(out), '本命金星 → Sagittaire, Maison 2, direct');
  assert.ok(!/Scorpion, Maison 12, rétrograde/.test(out), '旧错（Scorpion/Maison 12/rétrograde）已清除');
  // 幂等
  assert.strictEqual(lockNatalAnchorRole(out, 'fr', { meta: natalMeta() }), out, 'V453 幂等');
});

test('V453：zh 本命金星 → 射手座第2宫顺行', () => {
  const t = '你的金星在天蝎座第12宫逆行，容易冲动消费。';
  const out = lockNatalAnchorRole(t, 'zh', { meta: natalMeta() });
  assert.ok(/你的金星在射手座第2宫顺行/.test(out), 'zh 本命金星 → 射手座第2宫顺行');
});

test('V453：流年金星（无所有格）不被误改', () => {
  const t = 'Vénus en Scorpion, Maison 12 brille votre secteur de transformation.';
  const out = lockNatalAnchorRole(t, 'fr', { meta: natalMeta() });
  assert.ok(/Vénus en Scorpion, Maison 12/.test(out), '流年金星（无所有格）不被误改');
});

test('V453：en 本命火星（幻觉）归位', () => {
  const t = 'Your Mars in Libra, House 7, retrograde drives impulsive spending.';
  const out = lockNatalAnchorRole(t, 'en', { meta: natalMeta() });
  assert.ok(/Your Mars in Cancer, House 9, direct/.test(out), 'en 本命火星 → Cancer House 9 direct（真值）');
});
