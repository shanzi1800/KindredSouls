// V468: 本命外行星「逆行标识(retrograde)」后处理真值锁——单元回归门
// 用法: node --test test/audit-v468-natal-retrograde.test.js
// 切片 server.js（剥离 import + 截断 app.listen 启动代码）后导出 v426EnforceNatalRetrograde 直接测。
import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');

// 将 import 语句替换为 no-op stub（避免剥离后未定义引用），截断启动代码（app.listen），导出待测函数
let code = "const _mockApp = { use(){}, get(){}, post(){}, listen(){}, set(){}, engine(){}, static(){}, json(){}, send(){} };\n";
code += SRC.replace(/import\s+(?:(\*\s+as\s+(\w+))|(\{[^}]*\})|(\w+))\s+from\s+['"][^'"]+['"];?/g, (m, star, starName, named, def) => {
  if (star) return `const ${starName} = {};`;
  if (named) {
    const names = named.slice(1, -1).split(',').map((s) => s.trim().split(/\s+as\s+/).pop().trim()).filter(Boolean);
    return names.map((n) => `const ${n} = (...args) => undefined;`).join('\n');
  }
  if (def) return `const ${def} = new Proxy((...args) => _mockApp, { get: (t, p) => (p in t ? t[p] : () => ({})) });`;
  return '';
});
const listenIdx = code.indexOf('app.listen(');
if (listenIdx > 0) code = code.slice(0, listenIdx);
code += '\nexport { v426EnforceNatalRetrograde, _v432Truth, _natalTruthMap10_FR };';

const TMP = '/tmp/server_v468_slice.mjs';
fs.writeFileSync(TMP, code);
const M = await import(TMP);
const { v426EnforceNatalRetrograde } = M;

// Mock astroMatrix（本命真值：Mercury/Pluto 逆行；Sun 非逆行）
const astroMatrix = {
  meta: {
    computed_houses: {
      Sun: { sign: 'Pisces', house: 1 },
      Moon: { sign: 'Pisces', house: 1 },
      Mercury: { sign: 'Aries', house: 1, retrograde: true },
      Venus: { sign: 'Aries', house: 2 },
      Mars: { sign: 'Scorpio', house: 8 },
      Jupiter: { sign: 'Aries', house: 1 },
      Saturn: { sign: 'Taurus', house: 2 },
      Uranus: { sign: 'Aquarius', house: 11 },
      Neptune: { sign: 'Aquarius', house: 11 },
      Pluto: { sign: 'Sagittarius', house: 9, retrograde: true },
    },
    natal_moon: { sign: 'Pisces', house: 1 },
    sun_sign: 'Pisces',
  },
  months: [{ sun: { sign: 'Virgo', house: 7 }, mercury: { sign: 'Libra', house: 7 }, jupiter: { sign: 'Leo', house: 6 }, saturn: { sign: 'Aries', house: 1, retrograde: true }, neptune: { sign: 'Aries', house: 1, retrograde: true }, moon_weeks: [] }],
};

describe('V468: 本命逆行标识锁 v426EnforceNatalRetrograde', () => {
  test('① FR: Pluto natal 漏 rétrograde → 补', () => {
    const r = v426EnforceNatalRetrograde('Votre Pluton natal en Sagittaire, Maison 9', 'fr', astroMatrix);
    assert.equal(r, 'Votre Pluton natal en Sagittaire, Maison 9, rétrograde');
  });
  test('② EN: Pluto natal 漏 retrograde → 补', () => {
    const r = v426EnforceNatalRetrograde('Your natal Pluto in Sagittarius, House 9', 'en', astroMatrix);
    assert.equal(r, 'Your natal Pluto in Sagittarius, House 9, retrograde');
  });
  test('③ ES: Pluto natal 漏 retrógrado → 补（西语行星名带重音 Plutón）', () => {
    const r = v426EnforceNatalRetrograde('Su Plutón natal en Sagitario, Casa 9', 'es', astroMatrix);
    assert.equal(r, 'Su Plutón natal en Sagitario, Casa 9, retrógrado');
  });
  test('④ FR 幂等: 已有 rétrograde → 不变', () => {
    const r = v426EnforceNatalRetrograde('Votre Pluton natal en Sagittaire, Maison 9, rétrograde', 'fr', astroMatrix);
    assert.equal(r, 'Votre Pluton natal en Sagittaire, Maison 9, rétrograde');
  });
  test('⑤ EN: Sun natal 非逆行 + 误标 retrograde → 剔除（含前导空格/逗号）', () => {
    const r = v426EnforceNatalRetrograde('Your natal Sun in Pisces, House 1 retrograde', 'en', astroMatrix);
    assert.equal(r, 'Your natal Sun in Pisces, House 1');
  });
  test('⑥ FR: 非 natal 引用（transit）不碰', () => {
    const r = v426EnforceNatalRetrograde('Pluton en transit en Sagittaire, Maison 9', 'fr', astroMatrix);
    assert.equal(r, 'Pluton en transit en Sagittaire, Maison 9');
  });
  test('⑦ zh: 无 marker → 原文透传（不误伤）', () => {
    const r = v426EnforceNatalRetrograde('你的本命冥王星在射手座第9宫', 'zh', astroMatrix);
    assert.equal(r, '你的本命冥王星在射手座第9宫');
  });
  test('⑧ FR: Mercury natal 逆行（多句，每句独立补）', () => {
    const r = v426EnforceNatalRetrograde('Votre Mercure natal en Bélier, Maison 1 aide la parole. Votre Pluton natal en Sagittaire, Maison 9 sourit.', 'fr', astroMatrix);
    assert.equal(r, 'Votre Mercure natal en Bélier, Maison 1, rétrograde aide la parole. Votre Pluton natal en Sagittaire, Maison 9, rétrograde sourit.');
  });
  test('⑨ 取不到真值盘 → 原文透传（绝不编）', () => {
    const r = v426EnforceNatalRetrograde('Votre Pluton natal en Sagittaire, Maison 9', 'fr', null);
    assert.equal(r, 'Votre Pluton natal en Sagittaire, Maison 9');
  });
});
