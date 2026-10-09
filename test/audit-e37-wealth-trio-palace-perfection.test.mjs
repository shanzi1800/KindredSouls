// ═══════════════════════════════════════════════════════════════════════
// 🛡️ E37 闸门（第 17 道）：财富三位一体「宫位真值完美化」—— 宫头（Cusps）
//    + 宫位主星（Ruler）+ 庙旺陷落（Dignity）+ 五维财位 + 六语文风/时间线
// ═══════════════════════════════════════════════════════════════════════
// 立项（2026-10-09 军师 E37 战备令 · 三项最高裁决）：
//   ① 坚决 bump v543（产物语义质变）；
//   ② 双管齐下 —— 补真值通路（古典/现代双轨飞星 + 庙旺陷落闭集）+ 净化诱导示例；
//   ③ 11/5 宫**并入现有三轴**（严禁裂为第四轴）⇒ 五维财位 2/5/8/10/11 闭环。
//
// 侦察阶段铁证（P0 三死穴）：
//   A1 宫头星座从未进入 Prompt 链路（house_cusps_full 存在但 buildNatalAnchors 不输出）；
//   A2 飞星/庙旺陷落**全仓零实现** —— 而日/月/年报 Prompt 早已诱导「2 宫主星落陷」⇒ 必然幻觉；
//   A3 once 报告缺 11/5 宫辅助财位（三轴只谈 2/8/10）。
//
// 避让纪律（E32 已覆盖且本闸门**不得重复**）：三位一体矩阵声明 / 绿道 fail-closed /
//   once 三轴骨架断言（三轴聚焦标记 + 10 主星 JSON + 哨兵）。E32 用 matrixFromTruth（无 cusps）
//   构造盘；本闸门另立真值口径：**真实引擎盘**查飞星映射 + **14 盘 × 6 语**查五维财位覆盖与
//   伪造示例清场。
//
// 运行：node --test test/audit-e37-wealth-trio-palace-perfection.test.mjs
// ═══════════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(import.meta.dirname, '..');
const PY_SRC = fs.readFileSync(path.join(ROOT, 'astro', 'astro_matrix.py'), 'utf8');
const CLIENT_SRC = fs.readFileSync(path.join(ROOT, 'v69_client.js'), 'utf8');
const SERVER_SRC = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
const LOADER_SRC = fs.readFileSync(path.join(ROOT, 'src/prompts/loader.js'), 'utf8');

const LANGS = ['zh', 'en', 'es', 'fr', 'th', 'vi'];
const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
const DIGNITIES = ['domicile', 'exaltation', 'detriment', 'fall', 'peregrine'];

// ── 花括号配平抽取（与 e24g / e32 同款，防注释与字符串误配） ──
function sliceBalanced(src, startIdx) {
  const start = src.indexOf('{', startIdx);
  if (start === -1) return null;
  let depth = 0, inStr = null;
  for (let i = start; i < src.length; i++) {
    const ch = src[i];
    if (inStr) { if (ch === '\\') { i++; continue; } if (ch === inStr) inStr = null; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; continue; }
    if (ch === '{') depth++; else if (ch === '}') { depth--; if (!depth) return src.slice(start, i + 1); }
  }
  return null;
}
function grabFn(src, sig) {
  const i = src.indexOf(sig);
  assert.ok(i !== -1, `缺少「${sig}」—— 单一真源被删/改名，闸门无法取证`);
  const body = sliceBalanced(src, i);
  assert.ok(body && body.length > 10, `抽不出「${sig}」函数体`);
  return sig + ' ' + body;
}

// ── 从 Python 源码解析闭集表（**独立于实现**的第二读法，用于交叉核验） ──
function parsePyPairs(src, assignName) {
  const m = src.match(new RegExp(`${assignName} = \\{([\\s\\S]*?)\\n\\}`));
  assert.ok(m, `astro_matrix.py 缺闭集表 ${assignName}（唯一真源被删）`);
  const out = {};
  for (const mm of m[1].matchAll(/'([A-Za-z]+)'\s*:\s*'([A-Za-z]+)'/g)) out[mm[1]] = mm[2];
  return out;
}
const PY_CLASSICAL = parsePyPairs(PY_SRC, 'SIGN_RULER_CLASSICAL');
const PY_EXALT = parsePyPairs(PY_SRC, 'SIGN_EXALTATION');
const PY_MODERN_OVERRIDE = (() => {
  const m = PY_SRC.match(/SIGN_RULER_MODERN = dict\(SIGN_RULER_CLASSICAL([^)]*)\)/);
  assert.ok(m, 'astro_matrix.py 缺 SIGN_RULER_MODERN（现代主星三处分治）');
  const out = {};
  for (const mm of m[1].matchAll(/([A-Za-z]+)\s*=\s*'([A-Za-z]+)'/g)) out[mm[1]] = mm[2];
  return out;
})();
const PY_MODERN = { ...PY_CLASSICAL, ...PY_MODERN_OVERRIDE };

// ═══════════════════════════ A. 闭集表（唯一真源结构） ═══════════════════════════

test('A1 古典主星闭集：12 星座全覆盖 · 值域合法 · 五星双所辖', () => {
  assert.deepEqual(Object.keys(PY_CLASSICAL).sort(), [...SIGNS].sort(), '古典主星表星座键不全');
  for (const [s, p] of Object.entries(PY_CLASSICAL)) {
    assert.ok(PLANETS.includes(p), `古典主星 ${s}→${p} 不在行星闭集内`);
  }
  const tally = {};
  for (const p of Object.values(PY_CLASSICAL)) tally[p] = (tally[p] || 0) + 1;
  for (const p of ['Mars', 'Venus', 'Mercury', 'Jupiter', 'Saturn']) {
    assert.equal(tally[p], 2, `${p} 必须双所辖（实得 ${tally[p]}）`);
  }
  for (const p of ['Sun', 'Moon']) assert.equal(tally[p], 1, `${p} 必须单所辖`);
});

test('A2 现代主星闭集：恰三处分治（天蝎→冥王 / 水瓶→天王 / 双鱼→海王）', () => {
  assert.deepEqual(PY_MODERN_OVERRIDE, { Scorpio: 'Pluto', Aquarius: 'Uranus', Pisces: 'Neptune' },
    '现代主星分治点被改动（射手/摩羯 等不得分治给外行星）');
  for (const s of SIGNS) {
    const expect = PY_MODERN_OVERRIDE[s] || PY_CLASSICAL[s];
    assert.equal(PY_MODERN[s], expect, `现代主星 ${s} 解析不一致`);
  }
});

test('A3 旺（Exaltation）闭集：古典 7 处，其余星座无旺星', () => {
  assert.deepEqual(PY_EXALT, {
    Aries: 'Sun', Taurus: 'Moon', Cancer: 'Jupiter', Virgo: 'Mercury',
    Libra: 'Saturn', Capricorn: 'Mars', Pisces: 'Venus',
  }, '旺星闭集被改动（多/少一处即会让「落（fall）」判定整体错位）');
});

test('A4 纯函数与生产者接线：dignity_of / compute_house_rulers / natal 模式 emit', () => {
  assert.ok(/def dignity_of\(planet: str, sign: str, modern: bool = False\)/.test(PY_SRC),
    '缺 dignity_of 纯函数（庙旺陷落唯一真源）');
  assert.ok(/def compute_house_rulers\(cusps: List\[float\], positions: Dict/.test(PY_SRC),
    '缺 compute_house_rulers 纯函数');
  const fn = PY_SRC.match(/def compute_house_rulers\([\s\S]*?\n(?=\ndef |\n# )/);
  assert.ok(fn, '抽不出 compute_house_rulers 函数体');
  assert.ok(/SIGN_RULER_MODERN if modern else SIGN_RULER_CLASSICAL/.test(fn[0]),
    'compute_house_rulers 未按古典/现代双轨取表');
  assert.ok(/dignity_of\(planet, _psign, modern\)/.test(fn[0]),
    'compute_house_rulers 未调用 dignity_of（主星状态将无从判定）');
  assert.ok(/'house_rulers': compute_house_rulers\(cusps, positions\)/.test(PY_SRC),
    'compute_natal_chart 未 emit house_rulers（真值不上行 ⇒ 下游永远拿不到）');
});

// ═══════════════════════════ B. 引擎行为（真实盘） ═══════════════════════════

const DISK = { birth: '1990-08-05', time: '07:00', lat: 10.8231, lon: 106.6297, tz: 'Asia/Ho_Chi_Minh' };

test('B1 真实盘：宫头/飞星/庙旺陷落三件套 + 与 computed_houses 同源', async () => {
  const { getAstroMatrix } = await import(pathToFileURL(path.join(ROOT, 'v69_client.js')).href);
  const m = await getAstroMatrix(DISK.birth, DISK.time, DISK.lat, DISK.lon, DISK.tz, { now: new Date(2026, 8, 15) });

  const full = m?.meta?.house_cusps_full;
  const rulers = m?.meta?.house_rulers;
  const ch = m?.meta?.computed_houses || {};
  assert.ok(full && Object.keys(full).length === 12, 'meta.house_cusps_full 缺失（宫头真值链断裂）');
  assert.ok(rulers && Object.keys(rulers).length === 12, 'meta.house_rulers 缺失（飞星真值链断裂）');

  for (const p of PLANETS) assert.ok(ch[p], `computed_houses 缺 ${p}（同源核验无从进行）`);

  for (let i = 1; i <= 12; i++) {
    const h = full['house_' + i];
    const r = rulers['house_' + i];
    assert.ok(SIGNS.includes(h.sign), `house_${i} 宫头星座非法: ${h.sign}`);
    assert.ok(Number.isFinite(h.cusp_degree), `house_${i} 缺 cusp_degree（绝对度数真值）`);
    assert.equal(r.cusp_sign, h.sign, `house_${i} 飞星记录的宫头星座与 house_cusps_full 不同源`);
    for (const track of ['classical', 'modern']) {
      const t = r[track];
      assert.ok(t && PLANETS.includes(t.planet), `house_${i}.${track} 主星非法`);
      const expect = (track === 'modern' ? PY_MODERN : PY_CLASSICAL)[h.sign];
      assert.equal(t.planet, expect, `house_${i}.${track} 主星与闭集表不符（真源漂移）`);
      assert.ok(DIGNITIES.includes(t.dignity), `house_${i}.${track} dignity 非法: ${t.dignity}`);
      assert.equal(t.sign, ch[t.planet].sign, `house_${i}.${track} 主星落座与 computed_houses 不同源`);
      assert.equal(t.house, ch[t.planet].house, `house_${i}.${track} 主星落宫与 computed_houses 不同源`);
    }
  }
});

test('B2 五维财位（2/5/8/10/11）在真值层齐备且各含双轨主星', async () => {
  const { getAstroMatrix } = await pathToFileURL(path.join(ROOT, 'v69_client.js')).href
    ? await import(pathToFileURL(path.join(ROOT, 'v69_client.js')).href) : null;
  const m = await getAstroMatrix(DISK.birth, DISK.time, DISK.lat, DISK.lon, DISK.tz, { now: new Date(2026, 8, 15) });
  const rulers = m.meta.house_rulers;
  for (const n of [2, 5, 8, 10, 11]) {
    const r = rulers['house_' + n];
    assert.ok(r && r.classical && r.modern, `财位第 ${n} 宫缺双轨主星（五维矩阵残缺）`);
  }
});

// ═══════════════════════════ C. Prompt 层（14 盘 × 6 语） ═══════════════════════════

async function buildOnceBuilder(src) {
  let code = '';
  code += grabFn(src, 'function getNatalSunSign(birthDate)') + '\n';
  for (const l of ['EN', 'VI', 'TH', 'ZH', 'ES', 'FR']) {
    const m = src.match(new RegExp(`const SUN_SIGN_${l} = \\[[^\\]]*\\];`));
    assert.ok(m, `server.js 缺 SUN_SIGN_${l}`);
    code += m[0] + '\n';
  }
  code += grabFn(src, 'function buildWealthOncePrompt(birthDate, lang, astroMatrix)');
  const { buildNatalAnchors } = await import(pathToFileURL(path.join(ROOT, 'v69_client.js')).href);
  return new Function('buildNatalAnchors', `${code}\nreturn { buildWealthOncePrompt };`)(buildNatalAnchors);
}
function matrixFromTruth(d) {
  const houses = {};
  for (const [p, v] of Object.entries(d.truth.houses || {})) houses[p] = { sign: v.sign, house: v.house };
  return {
    meta: {
      rising_sign: d.truth.rising_sign, sun_sign: d.truth.sun_sign,
      computed_houses: houses, natal_moon: houses.Moon || {},
      ascendant: { sign: d.truth.rising_sign, degree: d.truth.ascendant_deg }, midheaven: null,
    },
  };
}

// 五维财位本地化词表（严格取自本战改写后的 once 三轴正文；缺一维即判红）
const HOUSE_TOKENS = {
  zh: [/第2宫/, /第5宫/, /第8宫/, /第11宫/, /第10宫/],
  en: [/2nd/, /5th/, /8th/, /11th/, /10th/],
  es: [/2\/5/, /casa\s*8/i, /casa\s*11/i, /casa\s*10/i],
  fr: [/2\/5/, /maison\s*8/i, /maison\s*11/i, /maison\s*10/i],
  th: [/2\/5/, /8\/11/, /เรือนที่\s*10/],
  vi: [/2\/5/, /nhà\s*8/i, /nhà\s*11/i, /nhà\s*10/i],
};
// 被清场的「伪造落陷示例」——prompt 绝不可再出现（真值块未标记 ⇒ 禁止断言）
const FORGED_SAMPLES = {
  zh: /2宫主星落陷/,
  en: /2nd house ruler is in detriment/i,
  es: /regente de tu casa 2 está en detrimento/i,
  fr: /maître de votre 2ème maison est en chute/i,
  th: /ผู้ปกครองบ้านที่ 2 ของคุณอยู่ในตำแหน่งตก/,
  vi: /Chủ nhân nhà 2 của bạn ở vị trí suy/i,
};

function fiveDimOk(both, lang) {
  return HOUSE_TOKENS[lang].every((re) => re.test(both));
}

test('C1 once prompt：14 盘 × 6 语 —— 五维财位（2/5/8/10/11）全覆盖', async () => {
  const { SWEEP_MATRIX } = await import(pathToFileURL(path.join(ROOT, 'test/tools/sweep-matrix.mjs')).href);
  const B = await buildOnceBuilder(SERVER_SRC);
  assert.equal(SWEEP_MATRIX.length, 14, '盘池须为 14 盘');
  for (const d of SWEEP_MATRIX) {
    for (const lang of LANGS) {
      const out = B.buildWealthOncePrompt(d.birth, lang, matrixFromTruth(d));
      assert.ok(out && out.system, `${d.id}/${lang}: once prompt 未产出`);
      const both = out.system + '\n' + out.user;
      assert.ok(fiveDimOk(both, lang), `${d.id}/${lang}: 五维财位本地化词缺失（缺口: ` +
        HOUSE_TOKENS[lang].filter((re) => !re.test(both)).map(String).join(' ') + '）');
    }
  }
});

test('C2 六语「伪造落陷示例」彻底清场（诱导幻觉的硬编码断言不得回归）', async () => {
  const { SWEEP_MATRIX } = await import(pathToFileURL(path.join(ROOT, 'test/tools/sweep-matrix.mjs')).href);
  const B = await buildOnceBuilder(SERVER_SRC);
  const d = SWEEP_MATRIX[0];
  for (const lang of LANGS) {
    const out = B.buildWealthOncePrompt(d.birth, lang, matrixFromTruth(d));
    const both = out.system + '\n' + out.user;
    assert.ok(!FORGED_SAMPLES[lang].test(both), `${lang}: once prompt 仍含伪造「2 宫主星落陷」示例`);
  }
  // 全仓 Prompt 源侧亦不得残留（防只在函数里删、模板里留）
  for (const lang of LANGS) {
    assert.ok(!FORGED_SAMPLES[lang].test(SERVER_SRC), `server.js 源内仍残留 ${lang} 伪造落陷示例`);
  }
});

test('C3 真值块段名与五维财位规则在位（buildNatalAnchors 输出）', async () => {
  const { getAstroMatrix, buildNatalAnchors } = await import(pathToFileURL(path.join(ROOT, 'v69_client.js')).href);
  const m = await getAstroMatrix(DISK.birth, DISK.time, DISK.lat, DISK.lon, DISK.tz, { now: new Date(2026, 8, 15) });
  const a = buildNatalAnchors(m);
  assert.ok(a.includes('NATAL HOUSE CUSPS'), '缺 [NATAL HOUSE CUSPS] 宫头真值段');
  assert.ok(a.includes('NATAL HOUSE RULERS'), '缺 [NATAL HOUSE RULERS] 飞星真值段');
  assert.ok(a.includes('HOUSE CUSPS & RULERS'), '缺宫头/飞星最高优先级规则段');
  assert.ok(!/\bundefined\b/.test(a) && !/\bNaN\b/.test(a), '锚点块含 undefined/NaN 哨兵');
  // 飞星行与真值一致（H2 行必须写出诚实的古典主星）
  const h2 = /H2\(cusp (\w+)\)[\s\S]{0,120}?classical: (\w+) in (\w+) H(\S+)/.exec(a);
  assert.ok(h2, '锚点块缺 H2 飞星行');
  assert.equal(h2[2], PY_CLASSICAL[h2[1]], 'H2 古典主星与闭集表不符（真源漂移）');
});

// ═══════════════════════════ D. V486 六语覆盖（含回落链） ═══════════════════════════

test('D1 V486 文风规则：六语全覆盖（zh/en/th 原生 + fr/es/vi 回落链完整）', async () => {
  const { getSystemPromptByLocale } = await import(pathToFileURL(path.join(ROOT, 'src/prompts/loader.js')).href);
  const MARK = {
    skeleton: [
      /句子骨架级重复惩罚/,
      /SENTENCE-SKELETON REPETITION PENALTY/,
      /บทลงโทษการซ้ำโครงประโยค/,
    ],
    noSample: [
      /不提供范例/,
      /NO copyable sample sentence/,
      /ไม่ใชแม่แบบ|ห้ามลอกตาม/,
    ],
  };
  for (const lang of LANGS) {
    const sys = getSystemPromptByLocale(lang);
    assert.ok(sys && sys.length > 1000, `${lang}: 年报 system prompt 为空`);
    assert.ok(sys.includes('V486'), `${lang}: 未拿到 V486 规则（回落链断裂）`);
    assert.ok(MARK.skeleton.some((re) => re.test(sys)), `${lang}: 缺「句子骨架级重复惩罚」规则`);
    assert.ok(MARK.noSample.some((re) => re.test(sys)), `${lang}: 缺「不提供可照抄范文」自保护规则`);
  }
  // 回落链结构显式可证：fr/es/vi 必须落 en（禁静默空串）
  for (const l of ['fr', 'es', 'vi']) {
    assert.ok(new RegExp(`['"]${l}['"]\\s*:\\s*yearlySystemEN`).test(LOADER_SRC), `${l} 未显式回落 en`);
  }
});

// ═══════════════════════════ E. 时间线（周卡 / 陷阱卡 / 月表） ═══════════════════════════

test('E1 月报时间线锁：周区间 1–7 / 8–14 / 15–22 / 23–31 + 陷阱卡周主星硬规则在位', () => {
  assert.ok(/WEEK-SCOPE TIME-LINE LOCK/.test(SERVER_SRC), '缺 E37/S4 周级时间线锁（STRICT_GROUNDING）');
  for (const r of ['1–7', '8–14', '15–22', '23–31']) {
    assert.ok(SERVER_SRC.includes(r), `缺周区间 ${r}（四周卡口径丢失）`);
  }
  assert.ok(/Spending-Trap card MUST/.test(SERVER_SRC), '陷阱卡未强制「点名风险周 + 该周主星」');
});

test('E2 月表 _EPHEM_DAYMON 六语严格 12 项（多一项即整体错位一月）', () => {
  const blk = SERVER_SRC.match(/const _EPHEM_DAYMON = \{[\s\S]*?\n\};/);
  assert.ok(blk, '缺 _EPHEM_DAYMON 月表');
  for (const lang of ['es', 'en', 'fr', 'th', 'vi']) {
    const row = blk[0].match(new RegExp(`\\b${lang}: \\[([^\\]]*)\\]`));
    assert.ok(row, `_EPHEM_DAYMON.${lang} 缺失`);
    const n = row[1].split(',').filter((x) => x.trim()).length;
    assert.equal(n, 12, `_EPHEM_DAYMON.${lang} 须恰 12 项（实得 ${n}）`);
  }
});

// ═══════════════════════════ F. 注入自测（定向破坏 ⇒ 判据必红） ═══════════════════════════

test('F1 注入：摘掉宫头真值段 ⇒ C3 判据必红', () => {
  const broken = CLIENT_SRC.replace('// ─── NATAL HOUSE CUSPS', '// ─── (removed)');
  assert.notEqual(broken, CLIENT_SRC, '注入未生效');
  const rebuild = (src) => {
    const i = src.indexOf('const houseTruthSection = (() => {');
    assert.ok(i > 0, '抽不出 houseTruthSection 构造器');
    return src.slice(i, i + 4000);
  };
  assert.ok(rebuild(CLIENT_SRC).includes('NATAL HOUSE CUSPS'), '原实现缺段（判据前提被破坏）');
  assert.ok(!rebuild(broken).includes('NATAL HOUSE CUSPS'), '闸门失效: 宫头段摘除未被判据识别');
});

test('F2 注入：取消现代主星三处分治 ⇒ A2 判据必红', () => {
  const broken = PY_SRC.replace(
    /SIGN_RULER_MODERN = dict\(SIGN_RULER_CLASSICAL[^)]*\)/,
    'SIGN_RULER_MODERN = dict(SIGN_RULER_CLASSICAL)');
  assert.notEqual(broken, PY_SRC, '注入未生效');
  const ov = (() => {
    const m = broken.match(/SIGN_RULER_MODERN = dict\(SIGN_RULER_CLASSICAL([^)]*)\)/);
    const out = {};
    for (const mm of m[1].matchAll(/([A-Za-z]+)\s*=\s*'([A-Za-z]+)'/g)) out[mm[1]] = mm[2];
    return out;
  })();
  assert.notDeepEqual(ov, { Scorpio: 'Pluto', Aquarius: 'Uranus', Pisces: 'Neptune' },
    '闸门失效: 现代主星分治被撤未被 A2 判据识别');
});

test('F3 注入：once 轴恢复伪造落陷示例 ⇒ C2 判据必红', () => {
  const broken = SERVER_SRC.replace(
    '- 写法示范（槽位必须按上方真值块逐字代入，严禁照抄本句字面）',
    '- 示例：「你的2宫主星落陷，天生就是\'赚得多、花得快\'的漏斗体质」\n- 写法示范');
  assert.notEqual(broken, SERVER_SRC, '注入未生效（zh 轴写法示范锚点被改？）');
  assert.ok(FORGED_SAMPLES.zh.test(broken), '闸门失效: 伪造落陷示例回归未被 C2 判据识别');
});

test('F4 注入：摘掉 zh 第 5 宫真值锚点 ⇒ C1 判据必红（五维缺一）', async () => {
  const { SWEEP_MATRIX } = await import(pathToFileURL(path.join(ROOT, 'test/tools/sweep-matrix.mjs')).href);
  // zh once 正文中承载「第5宫」字面（正则 /第5宫/ 可命中）的唯一锚点 = 第一轴写法示范行。
  // 注意：轴标题为「第2/5宫」，其 "2/5宫" 不被 /第5宫/ 匹配 ⇒ 摘标题无用（旧注入即栽在此）。
  const ANCHOR = '而第5宫由【H5 主星】主管';
  const broken = SERVER_SRC.replace(ANCHOR, '而【H5】主管');
  assert.notEqual(broken, SERVER_SRC, '注入未生效（zh 第5宫承载锚点被改？）');
  const B = await buildOnceBuilder(broken);
  const d = SWEEP_MATRIX[0];
  const out = B.buildWealthOncePrompt(d.birth, 'zh', matrixFromTruth(d));
  const both = out.system + '\n' + out.user;
  // 前置断言：锚点须确为唯一承载点（若实现新增了「第5宫」字面，本注入会失效 ⇒ 明确报「锚点非唯一」）
  assert.ok(!/第5宫/.test(both), '注入后 zh 仍残留「第5宫」（锚点已非唯一，需重选注入点）');
  assert.ok(!fiveDimOk(both, 'zh'), '闸门失效: 第 5 宫锚点摘除未被五维覆盖判据识别');
});

test('F5 注入：摘掉周级时间线锁 ⇒ E1 判据必红', () => {
  const broken = SERVER_SRC.replace('WEEK-SCOPE TIME-LINE LOCK', 'SCOPE LOCK');
  assert.notEqual(broken, SERVER_SRC, '注入未生效');
  assert.ok(!/WEEK-SCOPE TIME-LINE LOCK/.test(broken), '闸门失效: 时间线锁摘除未被 E1 判据识别');
});
