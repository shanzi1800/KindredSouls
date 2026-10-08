// ═══════════════════════════════════════════════════════════════════════════
// 🛡️ E25-P1①「es 真值锁射程补齐」闸门（2026-10-08 军师开工令 · 乌斯怀亚靶盘实证）
//
// 病灶（es 年报终考 54/100 复核 · 缺陷1 毒渗终章神谕）：
//   ① V485 年度恒定外行星全文锁「暂只做 zh」⇒ es 终章「Plutón en tu Casa 10」等
//      非月段恒定外行星陈述整体无锁（流年真值 Casa 11，错误写进全文最后定调句）。
//   ② V482 月段锁 E19 本命豁免「撞 sign 即整体弃权」⇒「本命 sign + 三不靠 house」
//      自相矛盾句永久漏网（sign↔house 无成对裁决）。
//   ③ E19 键名错位：_v432Truth('natal') 键为本地化行星名（es 'Júpiter' / zh '木星'），
//      旧码用英文键 'Jupiter' 回查 ⇒ 恒 undefined ⇒ E19 豁免在 es/zh 结构性空转
//      （vm 铁证：natalTruth['Jupiter']===undefined, natalTruth['Júpiter']={sign:'Géminis',house:4}）。
//   ④ V482 es houseSrc 单式 `Casa N`：ª 缩写/英文借形/冠词介词前缀全盲 ⇒ houseWord
//      恒 undefined ⇒ sign 改 house 不改（半改不一致）。
//   ⑤ V482/V485 匹配大小写敏感 ⇒ es 正文小写星座（aries/géminis）零匹配。
//
// fixture 真值来源：生产同源 astro/astro_matrix.py 实算（乌斯怀亚 2001-06-21 23:45,
// lat −54.8019 lon −68.3030 tz America/Argentina/Ushuaia），非手抄 LLM 输出。
// ═══════════════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { closureDecls, indexDecls } from './tools/extract_decls.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf-8');

function stripComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/[^\n]*$/gm, ' ').replace(/([^:])\/\/[^\n]*/g, '$1 ');
}

/** 乌斯怀亚盘 astroMatrix fixture（真值=astro_matrix.py 实算） */
function ushuaiaMatrix() {
  const natal = {
    Sun: ['Cancer', 4], Moon: ['Cancer', 4], Mercury: ['Gemini', 4], Venus: ['Taurus', 3],
    Mars: ['Sagittarius', 10], Jupiter: ['Gemini', 4], Saturn: ['Gemini', 4],
    Uranus: ['Aquarius', 12], Neptune: ['Aquarius', 11], Pluto: ['Sagittarius', 10],
  };
  const ch = {};
  for (const [k, [s, h]] of Object.entries(natal)) ch[k] = { sign: s, house: h, retrograde: false };
  const months = [];
  for (let i = 0; i < 12; i++) {
    months.push({
      sun: { sign: 'Gemini', house: 3, retrograde: false },
      mercury: { sign: 'Cancer', house: 4, retrograde: false },
      venus: { sign: 'Leo', house: 5, retrograde: false },
      mars: { sign: 'Virgo', house: 6, retrograde: false },
      jupiter: { sign: 'Leo', house: i < 3 ? 5 : 6, retrograde: false },  // 年内切宫 ⇒ 非恒定 ⇒ V485 弃权
      saturn: { sign: 'Aries', house: 2, retrograde: false },             // 全年恒定
      uranus: { sign: 'Gemini', house: 3, retrograde: false },
      neptune: { sign: 'Aries', house: 1, retrograde: false },
      pluto: { sign: 'Aquarius', house: 11, retrograde: false },          // 全年恒定
    });
  }
  return { meta: { sun_sign: 'Cancer', computed_houses: ch, natal_moon: ch.Moon }, months };
}

const HEADS = ['Julio 2026','Agosto 2026','Septiembre 2026','Octubre 2026','Noviembre 2026','Diciembre 2026','Enero 2027','Febrero 2027','Marzo 2027','Abril 2027','Mayo 2027','Junio 2027'];
const mkMonthly = (bodies) => bodies.map((b, i) => `### ${HEADS[i]}: Sol\n${b}`).join('\n');

/** vm 装配 V482 + V485（闭包拉全依赖） */
function buildSandbox(source = src) {
  const { source: code } = closureDecls(source, ['lockYearlyTransitSigns', 'lockYearlyOuterPlanetsYear']);
  const ctx = vm.createContext({ console: { log() {}, warn() {} } });
  vm.runInContext(code + '\nglobalThis.__T = lockYearlyTransitSigns; globalThis.__O = lockYearlyOuterPlanetsYear;', ctx);
  return ctx;
}

// ═══════════════════════════════ A 静态 ═══════════════════════════════

test('A1 V485 已扩 es（终章/非月段恒定外行星锁覆盖 es 通道）', () => {
  const d = indexDecls(src);
  const body = stripComments(d.get('lockYearlyOuterPlanetsYear') || '');
  assert.ok(body, '未找到 lockYearlyOuterPlanetsYear');
  assert.match(body, /lang\s*!==\s*'zh'\s*&&\s*lang\s*!==\s*'es'/,
    'V485 语言守卫未扩 es（终章神谕 es 无锁 = 复核缺陷1毒渗定调句的根源）');
  assert.match(body, /reC/,
    'V485 缺纯宫位形态C（「Plutón en la Casa 9」无星座词全漏）');
});

test('A2 E19 键名错位已修：豁免表经 _V432_NAME 本地化键回查', () => {
  const d = indexDecls(src);
  const body = stripComments(d.get('lockYearlyTransitSigns') || '');
  assert.match(body, /natalTruth\[NAME\[pk\]\s*\|\|\s*pk\]/,
    'V482 豁免表仍用英文键回查 natalTruth ⇒ es/zh E19 豁免结构性空转');
  const outer = stripComments(d.get('lockYearlyOuterPlanetsYear') || '');
  assert.match(outer, /NAME2\[k\]\s*\|\|\s*k/,
    'V485 本命宫位表仍用英文键回查');
});

test('A3 V482 es 宫位判据已扩全形态（ª Casa / House 借形 / 冠词介词前缀）+ gi 大小写不敏感', () => {
  const d = indexDecls(src);
  const body = stripComments(d.get('lockYearlyTransitSigns') || '');
  assert.match(body, /00ba/, 'es houseSrc 缺 ª/º 序数指示符形态');
  assert.match(body, /\{0,2\}/, 'es houseSrc 缺冠词/介词可重复前缀（「en la Casa 7」挡路 ⇒ houseWord 恒 undefined）');
  assert.match(body, /'gi'/, 'V482 星座匹配仍大小写敏感（es 正文小写星座零匹配）');
});

// ═══════════════════════════════ B 行为级（乌斯怀亚 fixture） ═══════════════════════════════

test('B1 V485 es 终章：带星座→宫位纠(Casa 10→11)；纯宫位三不靠→修(7→2)；纯宫位本命撞车→弃权', () => {
  const ctx = buildSandbox();
  const fin = '## Oráculo Final\nPlutón en Acuario en tu Casa 10 cierra el ciclo. Saturno en la Casa 7 pesa. Plutón en tu Casa 10 como recuerdo.';
  const want = '## Oráculo Final\nPlutón en Acuario en tu Casa 11 cierra el ciclo. Saturno en la Casa 2 pesa. Plutón en tu Casa 10 como recuerdo.';
  assert.strictEqual(ctx.__O(fin, 'es', ushuaiaMatrix(), 'yearly'), want);
});

test('B2 V485 es 年度恒定守卫：非恒定行星（木星 Leo 5→6 切宫）弃权不动', () => {
  const ctx = buildSandbox();
  const fin = '## F\nJúpiter en Leo en la Casa 9.';
  assert.strictEqual(ctx.__O(fin, 'es', ushuaiaMatrix(), 'yearly'), fin,
    '非恒定行星被 V485 锁定 = 越权改写（切宫月份值不同）');
});

test('B3 V482 成对裁决：sign 撞本命 + house 三不靠 → house 修回本命宫位（sign 不动）', () => {
  const ctx = buildSandbox();
  const bodies = Array(12).fill('');
  bodies[0] = 'Júpiter en Géminis en la Casa 7 te impulsa.';
  const want = bodies.slice();
  want[0] = 'Júpiter en Géminis en la Casa 4 te impulsa.';
  assert.strictEqual(ctx.__T(mkMonthly(bodies), 'es', ushuaiaMatrix(), 'yearly'), mkMonthly(want));
});

test('B4 V482 大小写不敏感 + ª Casa 保形：aries→Aries、5ª→2ª', () => {
  const ctx = buildSandbox();
  const bodies = Array(12).fill('');
  bodies[0] = 'Saturno en aries en la 5ª Casa marca tus finanzas.';
  const want = bodies.slice();
  want[0] = 'Saturno en Aries en la 2ª Casa marca tus finanzas.';
  assert.strictEqual(ctx.__T(mkMonthly(bodies), 'es', ushuaiaMatrix(), 'yearly'), mkMonthly(want));
});

test('B5 V482 双豁免：natal 词本命句不动；E19 歧义句形态（sign本命+house流月）不动', () => {
  const ctx = buildSandbox();
  const bodies = Array(12).fill('');
  bodies[0] = 'Tu Saturno natal en Géminis en la Casa 7 es karmico.';
  const t1 = ctx.__T(mkMonthly(bodies), 'es', ushuaiaMatrix(), 'yearly');
  assert.ok(t1.includes('Tu Saturno natal en Géminis en la Casa 7'), 'natal 词本命句被改');
  const bodies2 = Array(12).fill('');
  bodies2[0] = 'Saturno en Géminis en la Casa 2 brilla este mes.';
  const t2 = ctx.__T(mkMonthly(bodies2), 'es', ushuaiaMatrix(), 'yearly');
  assert.ok(t2.includes('Saturno en Géminis en la Casa 2'),
    'E19 歧义句形态（sign≡本命、house≡流月）被改 = E19/R11l 生产实证（s2 Adelaide）回归');
});

test('B6 V482 流月对撞主路径 + 幂等二跑逐字一致', () => {
  const ctx = buildSandbox();
  const bodies = Array(12).fill('');
  bodies[5] = 'Júpiter en Leo en la Casa 9 expande.';
  const want = bodies.slice();
  want[5] = 'Júpiter en Leo en la Casa 6 expande.';
  const once = ctx.__T(mkMonthly(bodies), 'es', ushuaiaMatrix(), 'yearly');
  assert.strictEqual(once, mkMonthly(want), '流月对撞未生效');
  assert.strictEqual(ctx.__T(once, 'es', ushuaiaMatrix(), 'yearly'), once, '二跑不幂等');
});

test('B7 V485 zh 判据路径逐字节不变（形态A 照常工作）', () => {
  const ctx = buildSandbox();
  const fin = '## 终章神谕\n冥王星进入水瓶座第10宫收束一切。';
  assert.strictEqual(ctx.__O(fin, 'zh', ushuaiaMatrix(), 'yearly'),
    '## 终章神谕\n冥王星进入水瓶座第11宫收束一切。');
});

// ═══════════════════════════ 注入缺陷自测 ═══════════════════════════════

test('【注入缺陷自测】V485 撤销 es 扩展 → B1 必须红', () => {
  const degraded = src.replace("if (lang !== 'zh' && lang !== 'es') return text;", "if (lang !== 'zh') return text;");
  assert.notStrictEqual(degraded, src, '未成功注入缺陷（未匹配到 V485 语言守卫）');
  const ctx = buildSandbox(degraded);
  const fin = '## Oráculo Final\nPlutón en Acuario en tu Casa 10 cierra el ciclo.';
  assert.notStrictEqual(ctx.__O(fin, 'es', ushuaiaMatrix(), 'yearly'),
    '## Oráculo Final\nPlutón en Acuario en tu Casa 11 cierra el ciclo.',
    '闸门失效: 撤销 es 扩展后 B1 判据仍通过');
});

test('【注入缺陷自测】成对裁决退回「撞 sign 即弃权」→ B3 必须红', () => {
  const degraded = src.replace(
    "if (!_isTransitCtx && _natalSignRe[key] && _natalSignRe[key].test(signWord)) {\n            if (!houseWord) return full;",
    "if (!_isTransitCtx && _natalSignRe[key] && _natalSignRe[key].test(signWord)) {\n            return full;\n            if (!houseWord) return full;");
  assert.notStrictEqual(degraded, src, '未成功注入缺陷（未匹配到成对裁决入口）');
  const ctx = buildSandbox(degraded);
  const bodies = Array(12).fill('');
  bodies[0] = 'Júpiter en Géminis en la Casa 7 te impulsa.';
  assert.notStrictEqual(ctx.__T(mkMonthly(bodies), 'es', ushuaiaMatrix(), 'yearly'),
    mkMonthly(bodies.map((b, i) => (i === 0 ? 'Júpiter en Géminis en la Casa 4 te impulsa.' : b))),
    '闸门失效: 退回旧豁免后 B3 判据仍通过');
});

test('【注入缺陷自测】键名错位复现（英文键回查）→ B4 的 es 豁免语义翻转必须可观测', () => {
  const degraded = src.replace('natalTruth[NAME[pk] || pk]', 'natalTruth[pk]');
  assert.notStrictEqual(degraded, src, '未成功注入缺陷（未匹配到键名映射）');
  const ctx = buildSandbox(degraded);
  // 键名错位 ⇒ E19 豁免空转 ⇒ 歧义句「Saturno en Géminis en la Casa 2」被流月改写（Géminis→Aries）
  const bodies = Array(12).fill('');
  bodies[0] = 'Saturno en Géminis en la Casa 2 brilla este mes.';
  const out = ctx.__T(mkMonthly(bodies), 'es', ushuaiaMatrix(), 'yearly');
  assert.ok(!out.includes('Saturno en Géminis en la Casa 2'),
    '闸门失效: 键名错位复现后歧义句竟然未被动过 ⇒ B5 鉴别力不足');
});

test('【注入缺陷自测】撤销 gi 大小写不敏感 → B4 必须红', () => {
  const degraded = src.replace(
    "signSrc + '(?:\\\\s*' + houseSrc + ')?', 'gi');",
    "signSrc + '(?:\\\\s*' + houseSrc + ')?', 'g');");
  assert.notStrictEqual(degraded, src, '未成功注入缺陷（未匹配到 V482 re flag）');
  const ctx = buildSandbox(degraded);
  const bodies = Array(12).fill('');
  bodies[0] = 'Saturno en aries en la 5ª Casa marca tus finanzas.';
  const out = ctx.__T(mkMonthly(bodies), 'es', ushuaiaMatrix(), 'yearly');
  assert.ok(out.includes('en aries'), '闸门失效: 撤销 gi 后小写星座仍被纠（B4 无鉴别力）');
});
