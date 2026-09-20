/**
 * V69 Astro Truth Client - SwissEph-Powered Computation
 * 🛠️ V134: 使用 spawnSync 直调本地 Python 脚本，不依赖独立服务进程
 * Railway 单 container 直接跑 Python，无需 8001 端口服务
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const require = createRequire(import.meta.url);
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// ESM __dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── In-Memory Cache ──────────────────────────────────────────────────────────
const matrixCache = new Map(); // key: `${birthDate}:${birthTime}:${lat.toFixed(2)}:${lon.toFixed(2)}:${tz}` → matrix
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// ── Resolve Python script path ───────────────────────────────────────────────
function getScriptPath() {
  // Railway: /app 是 Docker WORKDIR，代码在 /app 下
  // 本地开发: 项目根目录
  const candidates = [
    '/app/astro/astro_matrix.py',           // Railway Docker
    path.join(__dirname, 'astro', 'astro_matrix.py'), // 本地相对路径
    path.join(process.cwd(), 'astro', 'astro_matrix.py'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return candidates[0]; // fallback 到第一个候选
}

// ── Compute Astro Matrix via spawnSync ──────────────────────────────────────
/**
 * 🛠️ V134: 用 execSync 直调 Python 脚本，避免依赖独立 8001 服务
 * 
 * astro_matrix.py 输出格式:
 *   - 单月: python3 script.py YYYY MM rising_sign
 *   - 全年: python3 script.py YYYY rising_sign (months 1-12)
 */
async function computeViaPython(birthDate, birthTime, lat, lon, tz) {
  const scriptPath = getScriptPath();
  
  // 🛠️ V142: 无出生时间→Solar House 降级 (太阳星座=第1宫,避免假上升宫位张冠李戴)
  const birthTimeKnown = typeof birthTime === 'string' && birthTime.trim().length > 0;
  // ── 第一步：计算本命盘（出生日期对应的上升/宫位/本命星）──
  // 本命盘计算：传入出生日期+时间+坐标，astro_matrix.py 内部计算上升星座
  const natalCmd = [
    'python3', scriptPath,
    '--birth-date', birthDate,
    '--birth-time', birthTime || '12:00',
    '--lat', String(lat),
    '--lon', String(lon),
    '--tz', tz || 'Asia/Bangkok',
    '--mode', 'natal'
  ];
  if (!birthTimeKnown) natalCmd.push('--no-birth-time');

  console.log('[V134] Computing natal chart:', natalCmd.join(' '));
  
  let natalResult;
  try {
    natalResult = execSync(natalCmd.join(' '), {
      encoding: 'utf8',
      timeout: 15000,
      maxBuffer: 10 * 1024 * 1024,
    }).trim();
  } catch (e) {
    console.warn('[V134] Natal computation failed:', e.message, '\nFalling back to Cancer rising');
    natalResult = JSON.stringify({ rising_sign: 'Cancer', sun_sign: 'Cancer' });
  }

  let natalData;
  try {
    natalData = JSON.parse(natalResult);
  } catch (e) {
    console.warn('[V134] Natal JSON parse failed, using Cancer fallback:', natalResult.slice(0, 100));
    natalData = { rising_sign: 'Cancer', sun_sign: 'Cancer' };
  }

  const risingSign = natalData.rising_sign || 'Cancer';
  const sunSign = natalData.sun_sign || natalData.sunSign || 'Cancer';
  
  console.log(`[V134] Rising=${risingSign}, Sun=${sunSign}, birthTimeKnown=${birthTimeKnown}, source=${natalData.rising_sign_source || '?'}`);

  // ── 第二步：计算流年月报 JSON（2026年7月起，12个月）──
  const now = new Date();
  const year = now.getFullYear();
  const monthStart = now.getMonth() + 1; // 0-indexed → 1-indexed

  // 用 execSync 同步调 Python，拿完整 12 月 JSON
  const cmd = [
    'python3', scriptPath,
    String(year), String(monthStart),  // 年 月
    risingSign,                        // 上升星座（决定宫位）
    '--birth-date', birthDate || '',
    '--birth-time', birthTime || '12:00',
    '--lat', String(lat),
    '--lon', String(lon),
    '--tz', tz || 'Asia/Bangkok',
    '--months', '12'
  ];
  if (!birthTimeKnown) cmd.push('--no-birth-time');

  console.log('[V134] Computing monthly matrix:', cmd.join(' '));

  let rawOutput;
  try {
    rawOutput = execSync(cmd.join(' '), {
      encoding: 'utf8',
      timeout: 20000,
      maxBuffer: 50 * 1024 * 1024,
    });
  } catch (e) {
    console.error('[V134] execSync FAILED:', e.message);
    throw e;
  }

  let matrix;
  try {
    matrix = JSON.parse(rawOutput);
  } catch (e) {
    console.error('[V134] JSON parse FAILED, raw output:\n', rawOutput.slice(0, 500));
    throw e;
  }

  // ── 合并本命盘数据 ──
  matrix.meta = matrix.meta || {};
  matrix.meta.birth_date = birthDate;
  matrix.meta.rising_sign = risingSign;
  matrix.meta.sun_sign = sunSign;
  matrix.meta.natal_lat = lat;
  matrix.meta.natal_lon = lon;
  matrix.meta.natal_tz = tz;
  matrix.meta.computed_by = 'V138-spawnSync';
  // 🛠️ V142: 如实反映来源,无出生时间时为 Solar House 降级 (太阳星座=第1宫)
  matrix.meta.birth_time_known = birthTimeKnown;
  matrix.meta.rising_sign_source = birthTimeKnown ? 'computed' : 'solar_house_no_time';
  // 🛠️ Arctic fix: 如实反映分宫制（极高纬度 Placidus 破裂时降级 WholeSign）
  matrix.meta.house_system_used = natalData.house_system_used || 'Placidus';
  // 🛠️ V383: 合并本命月亮/上升/中天/真实宫头,供 FACT_SHEET 与星象报告硬锚定
  if (natalData.natal_moon) matrix.meta.natal_moon = natalData.natal_moon;
  if (natalData.ascendant) matrix.meta.ascendant = natalData.ascendant;
  if (natalData.midheaven !== undefined) matrix.meta.midheaven = natalData.midheaven;
  if (natalData.house_cusps_full) matrix.meta.house_cusps_full = natalData.house_cusps_full;
  // 🛠️ V143: 合并本命盘宫位映射 (computed_houses) —— Mode A 激活关键
  if (natalData.computed_houses && Object.keys(natalData.computed_houses).length > 0) {
    matrix.meta.computed_houses = natalData.computed_houses;
    console.log('[V143] Merged computed_houses:', Object.keys(natalData.computed_houses).join(','));
  }
  // 🛠️ V453: 合并本命全 10 行星（sign+house+retrograde），供本命锚点锁（V444/V453）兜底非日月行星
  //   避免 LLM 把流年金星当成本命金星（1992-11-04 法文盘实测硬伤）。
  //   house 用等宫制从上升推导（与 V69 引擎一致），planet keys 用大写（与 astro 引擎对齐）。
  if (natalData.planets && Object.keys(natalData.planets).length) {
    const _zorder = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
    const _rIdx = _zorder.indexOf(risingSign);
    const _np = {};
    for (const [pk, pv] of Object.entries(natalData.planets)) {
      const sIdx = _zorder.indexOf(pv.sign);
      const house = (_rIdx >= 0 && sIdx >= 0) ? ((sIdx - _rIdx + 12) % 12 + 1) : 1;
      _np[pk] = { sign: pv.sign, house, retrograde: !!pv.retrograde };
    }
    matrix.meta.natal_planets = _np;
    console.log('[V453] Merged natal_planets:', Object.keys(_np).join(','));
  }

  console.log(`[V134] Got ${matrix.months?.length || 0} months, ${matrix.retrograde_stations?.mercury?.length || 0} Mercury stations`);

  // ── 第三步：动态计算当前月月亮换座（替换硬编码 9/14 入天蝎 等静态日期）──
  try {
    const ingCmd = [
      'python3', scriptPath,
      '--mode', 'moon-ingress',
      String(year), String(monthStart),
      '--tz', tz || 'Asia/Bangkok'
    ];
    const ingRaw = execSync(ingCmd.join(' '), {
      encoding: 'utf8', timeout: 15000, maxBuffer: 10 * 1024 * 1024,
    }).trim();
    const moonIngress = JSON.parse(ingRaw);
    matrix.meta.moon_ingress = moonIngress;
    console.log(`[V383] Moon ingresses computed: ${moonIngress.length} events for ${year}-${monthStart}`);
  } catch (e) {
    console.warn('[V383] Moon ingress computation failed, leaving null:', e.message);
    matrix.meta.moon_ingress = null;
  }

  return matrix;
}

// ── Public API (保持原有签名) ───────────────────────────────────────────────
/**
 * Get the full 12-month astro matrix from V69 Python engine.
 * 🛠️ V134: spawnSync 直调，不依赖 8001 端口
 * 🛠️ V91+: 支持 birth_time / lat / lon / tz 精确参数。
 * Caches result for 1 hour to avoid repeated subprocess calls.
 */
export async function getAstroMatrix(birthDate, birthTime, lat = 13.75, lon = 100.5, tz = 'Asia/Bangkok') {
  // 🛠️ V142-fix: 移除 birthTime='12:00' 默认值——undefined 会触发默认值导致 birthTimeKnown 误判为 true(假上升),
  // 现在 undefined/null/'' 都如实传给 computeViaPython 判定为无出生时间→Solar House
  const cacheKey = `${birthDate}:${birthTime}:${Math.floor(lat*100)/100}:${Math.floor(lon*100)/100}:${tz}`;

  // Check cache
  const cached = matrixCache.get(cacheKey);
  if (cached && (Date.now() - cached.fetchedAt) < CACHE_TTL_MS) {
    console.log(`[V134] Cache hit: ${cacheKey}`);
    return cached.data;
  }

  console.log(`[V134] Cache miss, computing fresh: ${cacheKey}`);

  try {
    const matrix = await computeViaPython(birthDate, birthTime, lat, lon, tz);
    matrixCache.set(cacheKey, { data: matrix, fetchedAt: Date.now() });
    return matrix;
  } catch (e) {
    console.error('[V134] getAstroMatrix FAILED:', e.message);
    return null;
  }
}

// ── Build FACT_SHEET from Astro Matrix ───────────────────────────────────────
/**
 * Generate the FACT_SHEET section of the prompt from V69 computed data.
 * This replaces the hardcoded FACT_SHEET with machine-generated truth.
 */
// ── 🛠️ V420: 本命盘锚点真值块 (出生盘 FIXED forever) ────────────────────
// 年报 FactSheet 与月报 monthlySystem 共用同一份 SwissEph 真值。
// 病根备忘：月报此前完全没有本命锚点注入，而 prompt 却要求「see NATAL CHART ANCHORS
//   in the fact sheet」→ 模型只能编本命月亮（实测 1990-08-05 真值 Ma Kết/摩羯 第5宫 被编成 Bọ Cạp/天蝎 第3·8宫）。
// ⚠️ 键名铁律：本命月亮真值在 meta.natal_moon（次选 meta.computed_houses.Moon）。
//   meta.natal_planets 不存在 —— 历史踩坑：键名写错 → undefined → optional chaining 静默回落流月月亮。
// ── 🛠️ V423: 本命盘真值锚点(出生盘固定不变) —— 年报 FactSheet 与月报 monthlySystem 共用 ──
//   覆盖 10 行星(日月水金火木土天海冥)，供 server.js 的 lockNatalTruthVi 逐项硬锁。
//   注：中文/越语行星名一并给出，方便模型直接引用(越语锁按越语名匹配)。
export const NATAL_PLANETS_ORDER = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
export const PLANET_VI = {
  Sun: 'Mặt Trời', Moon: 'Mặt Trăng', Mercury: 'Sao Thủy', Venus: 'Sao Kim', Mars: 'Sao Hỏa',
  Jupiter: 'Sao Mộc', Saturn: 'Sao Thổ', Uranus: 'Sao Thiên Vương', Neptune: 'Sao Hải Vương', Pluto: 'Sao Diêm Vương',
};

// 🛠️ V461-FIX: 双格式真值契约 —— JSON(机器校验) + 散文(人类阅读) + 铁锁规则
// 根因: 散文 anchors 被 LLM 选择性忽略(Jupiter Aquarius H2 → Leo H8), V461 以 JSON 为单一真源
const _planets = [
  { en: 'Sun', vi: 'Mặt Trời', zh: '太阳' },
  { en: 'Moon', vi: 'Mặt Trăng', zh: '月亮' },
  { en: 'Mercury', vi: 'Sao Thủy', zh: '水星' },
  { en: 'Venus', vi: 'Sao Kim', zh: '金星' },
  { en: 'Mars', vi: 'Sao Hỏa', zh: '火星' },
  { en: 'Jupiter', vi: 'Sao Mộc', zh: '木星' },
  { en: 'Saturn', vi: 'Sao Thổ', zh: '土星' },
  { en: 'Uranus', vi: 'Sao Thiên Vương', zh: '天王星' },
  { en: 'Neptune', vi: 'Sao Hải Vương', zh: '海王星' },
  { en: 'Pluto', vi: 'Sao Diêm Vương', zh: '冥王星' },
];

export function buildNatalAnchors(astroMatrix) {
  const meta = astroMatrix?.meta || {};
  const ch = meta.computed_houses || {};
  const actualRising = meta.rising_sign || astroMatrix?.rising_sign || 'Cancer';
  const _natalMoon = meta.natal_moon || ch.Moon || {};
  const _asc = meta.ascendant || null;
  const _mc = meta.midheaven || null;

  // ── Part 1: JSON 真值表 (机器校验 · 单一真源) ─────────────────────────
  const jsonEntries = {};
  for (const { en } of _planets) {
    const info = ch[en];
    if (!info) continue;
    jsonEntries[en] = { sign: info.sign || '?', house: info.house ?? '?' };
  }
  const jsonBlock = `{
${_planets
    .filter(({ en }) => jsonEntries[en])
    .map(({ en }) => `  "natal${en}": {"sign":"${jsonEntries[en].sign}","house":${jsonEntries[en].house}}`)
    .join(',\n')}
}`;

  // ── Part 2: 散文真值 (人类阅读 · 参照) ───────────────────────────
  const proseLines = [
    `Your Natal Sun: ${meta.sun_sign || ch.Sun?.sign || 'Cancer'} (House ${ch.Sun?.house ?? '?'})`,
    `Your Natal Moon: ${_natalMoon.sign || '?'} in House ${_natalMoon.house ?? '?'}${_natalMoon.retrograde ? ' (Retrograde)' : ''}`,
  ];
  for (const { en, vi } of _planets) {
    if (en === 'Sun' || en === 'Moon') continue;
    const info = ch[en];
    if (!info) continue;
    proseLines.push(`Your Natal ${en} (${vi}): ${info.sign || '?'} in House ${info.house ?? '?'}${info.retrograde ? ' (Retrograde)' : ''}`);
  }
  proseLines.push(`Your Ascendant (Rising): ${_asc?.sign || actualRising} ${_asc?.degree != null ? _asc.degree.toFixed(2) + '°' : ''}`.trim());
  proseLines.push(`Your Midheaven (MC): ${_mc ? _mc.sign + ' ' + _mc.degree.toFixed(2) + '°' : '(n/a)'}`);

  // ── Part 3: 铁锁规则 (最高优先级 · 不可绕过) ────────────────────────
  const rules = [
    `- CRITICAL RULE: When writing about ANY natal planet, copy the sign AND house EXACTLY from the JSON above.`,
    `  Examples of VIOLATIONS: "Your Jupiter in Leo, House 8" when JSON says Aquarius H2.`,
    `  Examples of CORRECT: "Your natal Jupiter in Aquarius, House 2" — must match JSON exactly.`,
    `- JSON sign+house values are SwissEph ground truth. NEVER infer or substitute.`,
    `- Transit planets (Sun/Moon of the month) are DIFFERENT from natal planets. Never merge them.`,
  ].join('\n');

  return [
    `// ─── SYSTEM TRUTH LOCK (JSON · Machine-Verifiable) ───`,
    jsonBlock,
    `// ─── PROSE REFERENCE (Human-Readable) ───`,
    proseLines.join('\n'),
    `// ─── RULES (Highest Priority · Non-Negotiable) ───`,
    rules,
  ].join('\n');
}

export function assertNatalPlanetTruth(text, lang, astroMatrix) {
  /**
   * V461 STEP 3 (CI铁闸): 后置断言 —— 扫描正文里所有行星+星座+宫位引用,
   * 与 buildNatalAnchors JSON 真值对撞,返回违背列表。
   * @param {string} text - LLM 生成的报告正文
   * @param {string} lang - 语言代码 en/es/zh/fr/th/vi
   * @param {object} astroMatrix - SwissEph 真值矩阵
   * @returns {{violations: Array, checked: number, passed: boolean}}
   */
  if (!text || !astroMatrix) return { violations: [], checked: 0, passed: true };

  // ── 1. 从 buildNatalAnchors 提取 JSON 真值 ────────────────────────
  let truthMap = {};
  try {
    const raw = buildNatalAnchors(astroMatrix);
    const kv = [...raw.matchAll(/"(natal(?:Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto))":\s*\{"sign":"([^"]+)","house"\s*:\s*(\d+)/g)];
    for (const [, key, sign, house] of kv) {
      truthMap[key] = { sign, house: +house };
    }
  } catch(e) {
    console.warn('[V461 CI] buildNatalAnchors parse failed:', e.message);
    return { violations: [], checked: 0, passed: true };
  }

  if (Object.keys(truthMap).length === 0) return { violations: [], checked: 0, passed: true };

  // ── 2. 各语言行星名+星座名模式 ────────────────────────────────────
  const PLANETS_ALL = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
  const SIGN_EN = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const SIGN_ES = ['Aries','Tauro','G\u00e9minis','C\u00e1ncer','Leo','Virgo','Libra','Escorpio','Sagitario','Capricornio','Acuario','Piscis'];
  const SIGN_FR = ['B\u00e9lier','Taureau','G\u00e9meaux','Cancer','Lion','Vierge','Balance','Scorpion','Sagittaire','Capricorne','Verseau','Poissons'];
  const SIGN_VI = ['B\u1ea1ch D\u01b0\u01a1ng','Kim Ng\u01b0u','Song T\u1eef','C\u1ef1 Gi\u1ea3i','S\u01b0 T\u1eed','X\u1eed N\u1eef','Thi\u00ean B\u00ecnh','Thi\u00ean Y\u1ebft','Nh\u00e2n M\u00e3','Ma K\u1ebft','B\u1ea3o B\u00ecnh','Song Ng\u01b0'];
  const SIGN_ZH = ['\u767d\u7f8a\u5ea7','\u91d1\u725b\u5ea7','\u53cc\u5b50\u5ea7','\u5ba2\u623f\u5ea7','\u72ee\u5b50\u5ea7','\u5904\u5973\u5ea7','\u5929\u79e4\u5ea7','\u5929\u8749\u5ea7','\u5c04\u624b\u5ea7','\u9a6c\u5e03\u5ea7','\u6c34\u74f6\u5ea7','\u53cc\u9c7c\u5ea7'];

  let signsPat;
  if (lang === 'es') signsPat = SIGN_ES.join('|');
  else if (lang === 'fr') signsPat = SIGN_FR.join('|');
  else if (lang === 'vi') signsPat = SIGN_VI.join('|');
  else if (lang === 'zh') signsPat = SIGN_ZH.join('|');
  else signsPat = SIGN_EN.join('|'); // en/th default (其他语言正文偶见英文星座名)

  const violations = [];
  let checked = 0;

  for (const planet of PLANETS_ALL) {
    const truth = truthMap['natal' + planet];
    if (!truth) continue;

    // 行星名（各语言）
    let planetPat;
    if (lang === 'zh') {
      const zhMap = { Sun:'\u592a\u9633', Moon:'\u6708\u4eae', Mercury:'\u6c34\u661f', Venus:'\u91d1\u661f', Mars:'\u706b\u661f', Jupiter:'\u6728\u661f', Saturn:'\u571f\u661f', Uranus:'\u5929\u738b\u661f', Neptune:'\u6d77\u738b\u661f', Pluto:'\u51a0\u738b\u661f' };
      planetPat = planet === 'Moon' ? '\u6708\u4eae' : (zhMap[planet] || planet);
    } else if (lang === 'vi') {
      const viMap = { Sun:'M\u1eb7t Tr\u1eddi', Moon:'M\u1eb7t Tr\u0103ng', Mercury:'Sao Th\u1ee7y', Venus:'Sao Kim', Mars:'Sao H\u1ecfa', Jupiter:'Sao M\u1ed9c', Saturn:'Sao Th\u1ed5', Uranus:'Sao Thi\u00ean V\u01b0\u01a1ng', Neptune:'Sao H\u1ea3i V\u01b0\u01a1ng', Pluto:'Sao Di\u00eam V\u01b0\u01a1ng' };
      planetPat = viMap[planet] || planet;
    } else if (lang === 'fr') {
      const frMap = { Sun:'Soleil', Moon:'Lune', Mercury:'Mercure', Venus:'V\u00e9nus', Mars:'Mars', Jupiter:'Jupiter', Saturn:'Saturne', Uranus:'Uranus', Neptune:'Neptune', Pluto:'Pluton' };
      planetPat = frMap[planet] || planet;
    } else if (lang === 'es') {
      const esMap = { Sun:'Sol', Moon:'Luna', Mercury:'Mercurio', Venus:'Venus', Mars:'Marte', Jupiter:'J\u00fApiter', Saturn:'Saturno', Uranus:'Urano', Neptune:'Neptuno', Pluto:'Plut\u00f3n' };
      planetPat = esMap[planet] || planet;
    } else if (lang === 'th') {
      const thMap = { Sun:'\u0e14\u0e27\u0e2d\u0e2d\u0e32\u0e15\u0e34\u0e19\u0e4c\u0e17\u0e35\u0e48', Moon:'\u0e14\u0e27\u0e2d\u0e08\u0e31\u0e19\u0e4c\u0e17\u0e35\u0e48', Mercury:'\u0e14\u0e32\u0e40\u0e27\u0e34\u0e22\u0e4c', Venus:'\u0e1e\u0e24\u0e19\u0e38\u0e22\u0e4c', Mars:'\u0e14\u0e32\u0e14\u0e27\u0e31\u0e15\u0e4c', Jupiter:'\u0e14\u0e32\u0e1e\u0e38\u0e15\u0e4c', Saturn:'\u0e19\u0e31\u0e01\u0e0a\u0e4c\u0e17\u0e35\u0e48', Uranus:'\u0e1e\u0e25\u0e28\u0e31\u0e19\u0e4c\u0e17\u0e35\u0e48\u0e2a\u0e32\u0e27\u0e23\u0e23\u0e30\u0e22\u0e4c', Neptune:'\u0e40\u0e19\u0e47\u0e1e\u0e42\u0e19\u0e4c\u0e17\u0e35\u0e48', Pluto:'\u0e1e\u0e25\u0e42\u0e15\u0e2d\u0e19\u0e4c\u0e17\u0e35\u0e48' };
      planetPat = thMap[planet] || planet;
    } else {
      planetPat = planet; // en
    }

    // natal 语境检测正则（行星必须被 natal/natale/natal/your 修饰才算本命引用）
    // 例: "Your natal Jupiter in Leo, House 8" / "Votre Jupiter natal en..." / "你的本命木星在..."
    // 排除 transit 语境: "transit Jupiter in..." / "the Jupiter in Leo"（无修饰词=transit）
    let natalCtxPat;
    if (lang === 'zh') {
      natalCtxPat = '(?:\u6728\u661f|\u6728\u661f\u672c\u547d|\u6728\u661f\u5728\u3001?)';
    } else if (lang === 'vi') {
      natalCtxPat = '(?:Sao M\u1ed9c natal|Sao M\u1ed9c c\u1ee7a|your Sao M\u1ed9c|Sao M\u1ed9c c\u1ee7a)';
    } else if (lang === 'fr') {
      natalCtxPat = '(?:votre?|ton|sa|natre|natal|du n\u00e3issance)';
    } else if (lang === 'es') {
      natalCtxPat = '(?:tu|su|natal|de nacimiento|el Sol natal|la Luna natal|natum)';
    } else {
      // en: your natal / your / natal / of the birth
      natalCtxPat = '(?:your|Your|your natal|Your natal|natal |natale |birth |of the birth)';
    }

    // 检测模式: [natal修饰] [行星] [in/at/星座名] [House N]
    // 例: "Your natal Jupiter in Leo, House 8" / "Jupiter in Leo, House 8" (无修饰=transit,跳过)
    const patterns = [
      // 格式A: Planet in Sign, House N / Planet Sign, House N
      new RegExp(natalCtxPat + '\\s*(' + planetPat + ')\\s+(?:in|at|is)?\\s+(' + signsPat + ')\\s*,?\\s*(?:House\\s+|H)(\\d+)', 'gi'),
      // 格式B: Planet Sign N (紧凑,中间无介词)
      new RegExp(natalCtxPat + '\\s*(' + planetPat + ')\\s+(' + signsPat + ')\\s+(\\d+)(?!\\w)', 'gi'),
    ];

    for (const pat of patterns) {
      pat.lastIndex = 0;
      let m;
      while ((m = pat.exec(text)) !== null) {
        checked++;
        const foundSign = m[2];
        const foundHouse = +m[3];
        if (foundSign !== truth.sign || foundHouse !== truth.house) {
          violations.push({
            planet, expectedSign: truth.sign, expectedHouse: truth.house,
            foundSign, foundHouse, context: m[0].slice(0, 80),
          });
        }
      }
    }
  }

  return { violations, checked, passed: violations.length === 0 };
}

export function buildFactSheet(astroMatrix, lang = 'en') {
  if (!astroMatrix || !astroMatrix.months || astroMatrix.months.length === 0) {
    return '';
  }

  const { months, retrograde_stations, meta } = astroMatrix;
  
  const actualRising = meta?.rising_sign || 'Cancer';
  
  const firstMonth = months[0];
  const jupiterHouse = firstMonth?.jupiter?.house ?? null;
  const saturnHouse = firstMonth?.saturn?.house ?? null;
  const plutoHouse = firstMonth?.pluto?.house ?? null;
  const jupiterSign = firstMonth?.jupiter?.sign ?? null;
  const saturnSign = firstMonth?.saturn?.sign ?? null;
  const plutoSign = firstMonth?.pluto?.sign ?? null;

  if (!jupiterHouse || !saturnHouse || !plutoHouse || !jupiterSign) {
    return '';
  }

  const mercuryRxPeriods = [];
  const stations = retrograde_stations?.mercury || retrograde_stations || [];
  const stationArray = stations.mercury || stations || [];
  let lastRetrograde = null;
  for (const s of stationArray) {
    if (s.type === 'RETROGRADE') {
      lastRetrograde = s;
    } else if (s.type === 'DIRECT' && lastRetrograde) {
      mercuryRxPeriods.push({ start: lastRetrograde.date, end: s.date, sign: lastRetrograde.sign });
      lastRetrograde = null;
    }
  }

  const mercuryRxText = mercuryRxPeriods
    .slice(0, 6)
    .map((r, i) => `- Mercury Retrograde #${i+1} (${r.sign}): ${r.start} – ${r.end}`)
    .join('\n');

  const peakWindows = months
    .filter(m => m.peak_windows && m.peak_windows.length > 0)
    .slice(0, 3)
    .map(m => `- ${m.month_name}: ${m.peak_windows[0].date} (${m.peak_windows[0].type} in ${m.peak_windows[0].sign})`)
    .join('\n');

  const crisisDays = months
    .flatMap(m => (m.black_swan_days || []).map(d => `- ${d.date}: ${d.aspect}`))
    .slice(0, 4);

  const HOUSE_MAPPING_TEMPLATE = {
    'Cancer': '1=Cancer / 2=Leo / 3=Virgo / 4=Libra / 5=Scorpio / 6=Sagittarius / 7=Capricorn / 8=Aquarius / 9=Pisces / 10=Aries / 11=Taurus / 12=Gemini',
    'Aries': '1=Aries / 2=Taurus / 3=Gemini / 4=Cancer / 5=Leo / 6=Virgo / 7=Libra / 8=Scorpio / 9=Sagittarius / 10=Capricorn / 11=Aquarius / 12=Pisces',
    'Libra': '1=Libra / 2=Scorpio / 3=Sagittarius / 4=Capricorn / 5=Aquarius / 6=Pisces / 7=Aries / 8=Taurus / 9=Gemini / 10=Cancer / 11=Leo / 12=Virgo',
    'Leo': '1=Leo / 2=Virgo / 3=Libra / 4=Scorpio / 5=Sagittarius / 6=Capricorn / 7=Aquarius / 8=Pisces / 9=Aries / 10=Taurus / 11=Gemini / 12=Cancer',
    'Taurus': '1=Taurus / 2=Gemini / 3=Cancer / 4=Leo / 5=Virgo / 6=Libra / 7=Scorpio / 8=Sagittarius / 9=Capricorn / 10=Aquarius / 11=Pisces / 12=Aries',
    'Virgo': '1=Virgo / 2=Libra / 3=Scorpio / 4=Sagittarius / 5=Capricorn / 6=Aquarius / 7=Pisces / 8=Aries / 9=Taurus / 10=Gemini / 11=Cancer / 12=Leo',
    'Scorpio': '1=Scorpio / 2=Sagittarius / 3=Capricorn / 4=Aquarius / 5=Pisces / 6=Aries / 7=Taurus / 8=Gemini / 9=Cancer / 10=Leo / 11=Virgo / 12=Libra',
    'Sagittarius': '1=Sagittarius / 2=Capricorn / 3=Aquarius / 4=Pisces / 5=Aries / 6=Taurus / 7=Gemini / 8=Cancer / 9=Leo / 10=Virgo / 11=Libra / 12=Scorpio',
    'Capricorn': '1=Capricorn / 2=Aquarius / 3=Pisces / 4=Aries / 5=Taurus / 6=Gemini / 7=Cancer / 8=Leo / 9=Virgo / 10=Libra / 11=Scorpio / 12=Sagittarius',
    'Aquarius': '1=Aquarius / 2=Pisces / 3=Aries / 4=Taurus / 5=Gemini / 6=Cancer / 7=Leo / 8=Virgo / 9=Libra / 10=Scorpio / 11=Sagittarius / 12=Capricorn',
    'Pisces': '1=Pisces / 2=Aries / 3=Taurus / 4=Gemini / 5=Cancer / 6=Leo / 7=Virgo / 8=Libra / 9=Scorpio / 10=Sagittarius / 11=Capricorn / 12=Aquarius',
    'Gemini': '1=Gemini / 2=Cancer / 3=Leo / 4=Virgo / 5=Libra / 6=Scorpio / 7=Sagittarius / 8=Capricorn / 9=Aquarius / 10=Pisces / 11=Aries / 12=Taurus',
  };
  // 🛠️ V383: 真实宫头动态生成 (Placidus/WholeSign/SolarHouse),不再用硬编码 Equal House 模板
  let houseMapping;
  if (meta?.house_cusps_full) {
    houseMapping = Array.from({ length: 12 }, (_, i) => {
      const h = meta.house_cusps_full['house_' + (i + 1)];
      return `${i + 1}=${h.sign} ${h.degree_in_sign.toFixed(2)}°`;
    }).join(' / ');
  } else {
    houseMapping = HOUSE_MAPPING_TEMPLATE[actualRising] || HOUSE_MAPPING_TEMPLATE['Cancer'];
  }
  // 🛠️ V383: 本命锚点 (出生盘固定不变,供所有语言报告硬引用)
  // 🛠️ V420: 抽为导出函数 buildNatalAnchors() —— 月报 monthlySystem 复用同一份真值, 杜绝双份实现漂移
  const natalAnchors = buildNatalAnchors(astroMatrix);
  // 🛠️ V383: 月亮换座动态化 (SwissEph 实时计算,替代 server.js 旧硬编码 9/14 入天蝎)
  const moonIngress = meta?.moon_ingress || [];
  const moonIngressText = moonIngress.length > 0
    ? moonIngress.map(e => `- Moon enters ${e.to_sign} on ${e.date_str} (~${e.time_str} local time)`).join('\n')
    : '(No moon ingress computed for this month.)';
  const computedHouses = meta?.computed_houses || {};
  const computedHousesJson = JSON.stringify(computedHouses, null, 2);

  const factSheet = `[ASTRONOMY FACT SHEET - V134 SwissEph COMPUTED]
All data below is calculated by Swiss Ephemeris. Do NOT contradict this data.

═══════════════════════════════════════════════
⛔ STRICT RULE — AI MUST USE computed_houses.json BELOW
This JSON block contains the EXACT house numbers for this user's chart.
AI MUST quote these house numbers when writing about Jupiter/Saturn/Pluto/Sun.
AI MUST NOT infer houses from zodiac sign names.
═══════════════════════════════════════════════

[COMPUTED_HOUSES - authoritative JSON — USE THIS EXACTLY]:
${computedHousesJson}

Your Rising Sign: ${actualRising}
Your Natal Sun Sign: ${astroMatrix.meta?.sun_sign || 'Cancer'}
House System: ${meta?.house_system_used || 'Equal House'}

═══════════════════════════════════════════════
⛔ [ASTROLOGICAL ACCURACY DIRECTIVE — NATAL vs TRANSIT — ZERO TOLERANCE]
• The user's NATAL Sun Sign is FIXED FOREVER: ${astroMatrix.meta?.sun_sign || 'Cancer'} (from their birth date).
• The "Transit Sun" positions listed below (Cancer, Leo, etc.) are the CURRENT sky, NOT the user's sign.
• NEVER call the user by a transit sign (e.g. do NOT say "Cancer Sun" if their natal is not Cancer) — they are ALWAYS a ${astroMatrix.meta?.sun_sign || 'Cancer'}.
• FORBIDDEN phrases: "your Cancer Sun", "as a Cancer", "you are a Cancer" (unless natal IS Cancer).
• CORRECT: "your natal ${astroMatrix.meta?.sun_sign || 'Cancer'} Sun" / "the transiting Sun moving through Cancer".
═══════════════════════════════════════════════

[NATAL CHART ANCHORS — your birth chart, FIXED forever, use for all natal references]
${natalAnchors}

── Monthly TRANSIT Planetary Positions (July 2026 – June 2027) — these are SKY positions, NOT natal ──
${months.map((m, i) => {
  const marsDirect = m.mars?.retrograde === false || m.mars?.retrograde === undefined;
  return `【Month ${i+1}】${m.month_name}
  Transit Sun: ${m.sun?.sign || '?'} House ${m.sun?.house || '?'} ${m.sun?.retrograde ? '(Retrograde)' : ''}
  Moon: ${m.moon?.sign || '?'} House ${m.moon?.house || '?'} (Moon does NOT retrograde — always Direct)
  Mercury: ${m.mercury?.sign || '?'} House ${m.mercury?.house || '?'} ${m.mercury?.retrograde ? '(RETROGRADE)' : '(Direct)'}
  Venus: ${m.venus?.sign || '?'} House ${m.venus?.house || '?'}
  Mars: ${m.mars?.sign || '?'} House ${m.mars?.house || '?'} ${!marsDirect ? '(RETROGRADE)' : '(Direct)'}
  Jupiter: ${m.jupiter?.sign || '?'} House ${m.jupiter?.house || '?'} ${m.jupiter?.retrograde ? '(Retrograde)' : ''}
  Saturn: ${m.saturn?.sign || '?'} House ${m.saturn?.house || '?'} ${m.saturn?.retrograde ? '(Retrograde)' : ''}
  Uranus: ${m.uranus?.sign || '?'} House ${m.uranus?.house || '?'} ${m.uranus?.retrograde ? '(Retrograde)' : ''}
  Neptune: ${m.neptune?.sign || '?'} House ${m.neptune?.house || '?'} ${m.neptune?.retrograde ? '(Retrograde)' : ''}
  Pluto: ${m.pluto?.sign || '?'} House ${m.pluto?.house || '?'} ${m.pluto?.retrograde ? '(Retrograde)' : ''}
  ${m.black_swan_days?.length > 0 ? `⚠️ Crisis Days: ${m.black_swan_days.map(d => `${d.date}(${d.aspect})`).join(', ')}` : ''}
  ${m.peak_windows?.length > 0 ? `✨ Peak Window: ${m.peak_windows[0].date} – ${m.peak_windows[0].reason}` : ''}`;
}).join('\n')}

── House Mapping (${meta?.house_system_used || 'Equal House'}, Rising = ${actualRising}) ──
${houseMapping}

── Mercury Retrograde Periods (2026-2027) ──
${mercuryRxText || 'No major Mercury retrograde this period.'}

── Peak Revenue Windows ──
${peakWindows || 'Dynamically computed from exact planetary alignments.'}

── Crisis / Black Swan Days ──
${crisisDays?.join('\n') || 'None this month.'}

── Moon Ingress Calendar (current month — SwissEph computed, EXACT dates) ──
${moonIngressText}
⛔ Only mention "Moon in [Sign]" for the exact date ranges implied by these ingresses. Do NOT invent moon-sign dates not listed here.

⛔ FORBIDDEN — Do NOT write:
  - "Moon is retrograde" (physically impossible)
  - "Sun is retrograde" (physically impossible)
  - "Venus is retrograde" (only happens rarely, not in this period)
  - "Jupiter is retrograde" unless astroMatrix explicitly marks it
  - Any house numbers not listed in [COMPUTED_HOUSES] above

✅ You MAY write:
  - "Mercury retrograde" ONLY when it matches the dates above
  - Planet positions as listed in Monthly Planetary Positions
  - House numbers from [COMPUTED_HOUSES] block
  - "Moon is Direct" or "Moon remains Direct"
`;

  return factSheet;
}

// ── Build Per-Month Data ──────────────────────────────────────────────────────
export function buildPerMonthData(astroMatrix) {
  if (!astroMatrix?.months) return {};
  return astroMatrix.months.map(m => ({
    month_key: m.month_key,
    month_name: m.month_name,
    sun_sign: m.sun?.sign,
    sun_house: m.sun?.house,
    moon_sign: m.moon?.sign,
    moon_house: m.moon?.house,
    moon_direct: true, // always true, explicitly locked
    mercury_sign: m.mercury?.sign,
    mercury_retrograde: m.mercury?.retrograde || false,
    mercury_house: m.mercury?.house,
    mars_sign: m.mars?.sign,
    mars_retrograde: m.mars?.retrograde || false,
    mars_house: m.mars?.house,
    jupiter_sign: m.jupiter?.sign,
    jupiter_house: m.jupiter?.house,
    jupiter_retrograde: m.jupiter?.retrograde || false,
    saturn_sign: m.saturn?.sign,
    saturn_house: m.saturn?.house,
    saturn_retrograde: m.saturn?.retrograde || false,
    uranus_sign: m.uranus?.sign,
    uranus_house: m.uranus?.house,
    uranus_retrograde: m.uranus?.retrograde || false,
    neptune_sign: m.neptune?.sign,
    neptune_house: m.neptune?.house,
    pluto_sign: m.pluto?.sign,
    pluto_house: m.pluto?.house,
    black_swan_days: m.black_swan_days || [],
    peak_windows: m.peak_windows || [],
  }));
}

// ── Build Aspects Data ────────────────────────────────────────────────────────
// 🛠️ V177-P1: 生成全12月可读行星数据块，喂进月报Prompt让LLM照单抄不瞎猜
const PLANET_KEYS_MONTHLY = [
  ['sun','Sun'],['moon','Moon'],['mercury','Mercury'],
  ['venus','Venus'],['mars','Mars'],['jupiter','Jupiter'],
  ['saturn','Saturn'],['uranus','Uranus'],['neptune','Neptune'],['pluto','Pluto'],
];
const SIGN_NAMES = ['Ari','Tau','Gem','Can','Leo','Vir','Lib','Sco','Sag','Cap','Aqu','Pis'];
// 🛠️ V433-fix: 星座名 → 索引（致命死代码修复）
//   病根：SIGN_NAMES 是「缩写表」(Ari/Tau/Vir…)，而矩阵数据是「全称」(Aries/Virgo…)→
//   SIGN_NAMES.indexOf('Virgo') 永远 = -1 → labels[lang] 本地化字典从未生效，
//   所有语种的数据块一直在喂英文星座名 → 逼 LLM 二次翻译（V432 病根分析所指的同一条机制）。
//   注：V432 改 labels.vi/labels.fr 那次改动其实是死代码，真正生效的是后置锁。
const SIGN_FULL = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
function _signIdxOf(s) {
  if (!s) return -1;
  const i = SIGN_FULL.indexOf(s);
  if (i >= 0) return i;
  const k = String(s).slice(0, 3).toLowerCase();   // 兼容缩写/大小写变体
  return SIGN_NAMES.findIndex((x) => x.toLowerCase() === k);
}

// 🛠️ V432/V433: 全语言「本地化全称星座名」字典（喂缩写会逼 LLM 二次翻译，进而偷抄本命锚点）
const SIGN_L10N = {
  zh: ['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'],
  en: ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'],
  es: ['Aries','Tauro','Géminis','Cáncer','Leo','Virgo','Libra','Escorpio','Sagitario','Capricornio','Acuario','Piscis'],
  fr: ['Bélier','Taureau','Gémeaux','Cancer','Lion','Vierge','Balance','Scorpion','Sagittaire','Capricorne','Verseau','Poissons'],
  th: ['เมษ','พฤษภ','มิถุน','กรกฎ','สิงห์','กันยา','ตุลย์','พิจิก','ธนู','มังกร','กุมภ์','มีน'],
  vi: ['Bạch Dương','Kim Ngưu','Song Tử','Cự Giải','Sư Tử','Xử Nữ','Thiên Bình','Bọ Cạp','Nhân Mã','Ma Kết','Bảo Bình','Song Ngư'],
};

/**
 * 🛠️ V433 方案 A：月亮「周级真值」Prompt 块（根治「月中快照充当全月」的事实性幻觉）
 *
 * 病根实证（1988-12-31 Chatham 盘 / 2026-09，es 生产）：月报唯一月亮数据是 P1 块里的
 * 月中快照 Moon=Escorpio(H2)，模型把它当全月常量 → W1/W3/W4+陷阱段共 5 处写同一星座
 * （真值 W1=Aries→Cancer、W4=Aquarius→Taurus）。
 *
 * @param {object} astroMatrix 引擎矩阵（需含 months[0].moon_weeks）
 * @param {string} lang 语言码
 * @param {string} monthName 当月本地化名（如 "Sept"）
 * @returns {string} 供 prompt 注入的块文本；无数据时返回 ''
 */
// 🛠️ V433-fix3: 月亮「照抄句」语言模板（宫位前缀 + 主语短语）
const MOON_HOUSE_WORD = {
  zh: '第', en: 'House', es: 'Casa', fr: 'Maison', th: 'บ้าน', vi: 'Nhà',
};
const MOON_HOUSE_SUF = { zh: '宫', en: '', es: '', fr: '', th: '', vi: '' };
const MOON_SUBJECT = {
  zh: '流月月亮依次行经 ',
  en: 'The transiting Moon passes through ',
  es: 'La Luna en tránsito recorre ',
  fr: 'La Lune en transit traverse ',
  th: 'ดวงจันทร์ทรานซิสเคลื่อนผ่าน ',
  vi: 'Mặt Trăng hành vận đi qua ',
};

export function buildMoonWeekBlock(astroMatrix, lang, monthName = '') {
  const weeks = astroMatrix?.months?.[0]?.moon_weeks;
  if (!Array.isArray(weeks) || !weeks.length) return '';
  const L = SIGN_L10N[lang] || SIGN_L10N.en;
  const loc = (s) => { const i = SIGN_FULL.indexOf(s); return (i >= 0 && L[i]) || s; };
  const HW = (MOON_HOUSE_WORD[lang] || 'House') + (MOON_HOUSE_SUF[lang] || '');
  const SUBJ = MOON_SUBJECT[lang] || MOON_SUBJECT.en;
  const lines = weeks.map((w) => {
    // 按星座聚合宫位：同一星座跨两宫 → H7→H8（宫位制的数学必然，非矛盾）
    const groups = [];
    for (const lg of w.legs) {
      const last = groups[groups.length - 1];
      if (last && last.sign === lg.sign) {
        if (last.houses[last.houses.length - 1] !== lg.house) last.houses.push(lg.house);
      } else groups.push({ sign: lg.sign, houses: [lg.house] });
    }
    const path = groups.map((g) => `${loc(g.sign)}(H${g.houses.join('→H')})`).join(' → ');
    const ing = (w.changes || []).filter((c) => c.kind === 'sign')
      .map((c) => `${loc(c.to_sign)}@${monthName} ${c.day} ${c.time}`).join(', ');
    // 🛠️ V433-fix3: 本地化「照抄句」——把正确文本做成最省力路径（LLM 抄比推演容易）
    //   生产实证（vi）：星座表已跟随周级真值，但个别句子仍把相邻周的星座（Scorpio）搬进 W4 且配错日期。
    const hsStr = (hs) => (lang === 'zh')
      ? hs.map((h) => `第${h}宫`).join('→')
      : `${HW} ${hs.join('→' + HW + ' ')}`;
    const mk = (g) => `${loc(g.sign)} (${hsStr(g.houses)})`;
    const joinW = lang === 'zh' ? '、' : (lang === 'th' ? ' → ' : ' → ');
    const copy = `${SUBJ}${groups.map(mk).join(joinW)}`;
    return `- Week ${w.week} (${monthName} ${w.from_day}–${w.to_day}): ${path}${ing ? ` | Moon enters: ${ing}` : ''}` +
      `\n  📋 ${lang.toUpperCase()} copy-ready: \"${copy}\"`;
  });
  return '\n\n⚠️ [MOON PER-WEEK TRUTH V433 — SwissEph computed, local time · THIS IS THE ONLY VALID MOON SOURCE]\n' +
    'The Moon changes zodiac sign every ~2.5 days. The single mid-month Moon value was deliberately REMOVED from the\n' +
    'per-month data block: it is one instant and CANNOT represent a whole week. Use ONLY these per-week lists:\n' +
    lines.join('\n') +
    '\n⛔ HARD RULE: In each weekly section you may ONLY name the Moon signs listed for THAT week (in that order); describe the passage when several are listed. NEVER repeat one Moon sign across two different weeks (the Moon enters each sign only ONCE per month). NEVER use a Moon sign absent from that week\'s list. HOUSES MUST MATCH the (H…) values above.' +
    '\n⛔ HOUSE RULE: the house of a TRANSITING Moon sign is the (H…) value shown after that sign on that week\'s line — copy it exactly. NEVER use the NATAL Moon\'s house for a transiting Moon position (different cycle, different house).';
}
const _sunOf = (m) => m.sun || (m.positions?.Sun ? {sign: m.positions.Sun.sign, house: m.positions.Sun.house} : {});
const _getH = (v) => typeof v === 'number' ? v : (v?.house ?? v?.natal_house ?? v?.[0] ?? 1);

// ── V439 月报骨架生成 ─────────────────────────────────────────────────────────
// 治本：概述句和陷阱段内容由算法硬生成真值骨架，剥夺 LLM 编造天文事实的最后自留地。

const PLANET_ZH_MAP = {
  Sun:'太阳', Moon:'月亮', Mercury:'水星', Venus:'金星',
  Mars:'火星', Jupiter:'木星', Saturn:'土星',
  Uranus:'天王星', Neptune:'海王星', Pluto:'冥王星',
};

const RISK_LANG = {
  zh: { currency:'CNY', symbol:'￥', baseRisk:5000,      limit:'5000元',   safe:'「单笔超过5000元必须暂停24小时后再评估」' },
  en: { currency:'USD', symbol:'$',  baseRisk:800,       limit:'$800',     safe:'「Any single spending over $800 must pause 24 hours before deciding」' },
  fr: { currency:'EUR', symbol:'€',  baseRisk:700,       limit:'€700',     safe:'「Tout achat dépassant €700 impose une pause de 24 heures」' },
  es: { currency:'EUR', symbol:'€',  baseRisk:700,       limit:'€700',     safe:'「Cualquier gasto superior a €700 requiere una pausa de 24 horas」' },
  th: { currency:'THB', symbol:'฿', baseRisk:5000,      limit:'฿5000',    safe:'「การใช้จ่ายเกิน ฿5000 ต้องหยุดพัก 24 ชั่วโมงก่อนตัดสินใจ」' },
  vi: { currency:'VND', symbol:'₫', baseRisk:500000,   limit:'₫500.000', safe:'「Chi tiêu vượt ₫500.000 phải dừng 24 giờ trước khi quyết định」' },
};

const PLANET_TRAP_ARCHETYPE = {
  zh:  {
    1:  '自我认同消费陷阱：上升/第一宫薄弱时，容易通过购物填补空虚感',
    2:  '不安全感驱动消费：财帛宫脆弱时，囤积行为或过度节俭都是恐惧的投射',
    3:  '信息焦虑购物：第三宫活跃时，容易被营销话术和限时促销冲昏头脑',
    4:  '家庭/面子消费：田宅宫压力时，在房产、家装或给家人花钱上失控',
    5:  '情感补偿消费：第五宫过强时，用奢侈品/娱乐填补情感空洞',
    6:  '工作焦虑赎罪：第六宫驱动时，用购物缓解对工作表现的不安',
    7:  '关系依赖消费：第七宫压力时，为讨好他人或维持关系过度付出金钱',
    8:  '深层恐惧投资：第八宫活跃时，容易被高回报诱惑陷入财务陷阱',
    9:  '意义迷失消费：第九宫驱动时，为"提升自己"的幻觉花冤枉钱',
    10: '社会地位购物：第十宫压力时，为维持形象在职业/社交场过度消费',
    11: '群体认同消费：第十一宫过强时，为社群归属感买一堆不需要的东西',
    12: '隐秘/上瘾消费：第十二宫活跃时，隐秘性消费或习惯性囤积悄悄烧钱',
  },
  en: {
    1:  'Self-identity spending: when the 1st house is weak, retail therapy fills the void',
    2:  'Insecurity-driven spending: with a vulnerable 2nd house, hoarding or excessive thrift both stem from fear',
    3:  'Information anxiety shopping: with an active 3rd house, marketing and flash sales easily override judgment',
    4:  'Family/status spending: 4th house pressure triggers over-spending on property, home, or family gifts',
    5:  'Emotional compensation purchases: with an overactive 5th house, luxury and entertainment fill an emotional void',
    6:  'Work-guilt redemption: 6th house drive causes shopping as penance for work anxieties',
    7:  'Relationship-dependency spending: 7th house stress leads to excessive spending to please or maintain relationships',
    8:  'Deep-fear investments: an active 8th house makes high-return schemes dangerously seductive',
    9:  'Meaning迷途 spending: 9th house drive burns money on "self-improvement" illusions',
    10: 'Status-signaling shopping: 10th house pressure drives overspending to maintain career or social image',
    11: 'Group-identity purchasing: an overactive 11th house buys community belonging over actual need',
    12: 'Secret/addictive spending: an active 12th house quietly hemorrhages money through secretive or habitual purchases',
  },
};

/**
 * V439 概述句骨架生成
 * 输入: astroMatrix + lang → 输出: 算法硬生成的概述句骨架
 * LLM 只能在骨架内渲染心理学叙事，不准自己编造星座/宫位/行星数据
 */
export function buildMonthlyOverviewBlock(astroMatrix, lang) {
  const m0 = astroMatrix?.months?.[0];
  if (!m0) return '';
  const L = SIGN_L10N[lang] || SIGN_L10N.zh;
  const loc = (s) => { const i = SIGN_FULL.indexOf(s); return (i >= 0 && L[i]) || s; };

  // 当月流年行星真值（星座+宫位）
  const pNames = ['sun','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'];
  const pBlock = pNames.map(k => {
    const p = m0[k];
    if (!p?.sign) return null;
    const s = loc(p.sign);
    const h = _getH(p.house);
    const rx = p.retrograde ? '(R)' : '';
    return { k, s, h, rx };
  }).filter(Boolean);

  // 本命盘锚点
  const natal = astroMatrix?.meta || {};
  const natalSun = loc(natal.sun_sign || '');
  const rising = loc(natal.rising_sign || 'Cancer');
  const natalMoon = natal.natal_moon ? loc(natal.natal_moon.sign || '') : null;

  // 主导能量行星（按宫位归类：财帛/事业/共享资源三宫优先）
  const keyHouses = [2, 8, 10, 4, 11];
  const dominated = pBlock.filter(p => keyHouses.includes(p.h));
  const dominatedStr = dominated.length
    ? dominated.map(p => `${p.s}第${p.h}宫${p.rx}`).join('、')
    : pBlock.slice(0,3).map(p => `${p.s}第${p.h}宫${p.rx}`).join('、');

  const tmpl = {
    zh:  `【概述句骨架 — 算法生成 — LLM 只渲染情绪/心理学叙事】
当月流年星体（SwissEph真值）:
${pBlock.map(p => `  · ${PLANET_ZH_MAP[p.k] || p.k}: ${p.s}第${p.h}宫${p.rx}`).join('\n')}
本命盘锚点: 本命太阳${natalSun}，上升${rising}${natalMoon ? `，本命月亮${natalMoon}` : ''}
本月主导能量行星: ${dominatedStr}
LLM渲染要求: 基于上述真值，撰写1-2句整体月度财务主题叙事。要求: (1)必须提及本命太阳${natalSun}与当月流年星体的互动关系; (2)必须提及主导能量行星所在的宫位主题; (3)语言需有史诗感/命运感/荣格心理学深度; (4)禁止提及任何未在上方真值列表中的星座、宫位或行星。`,
    en:   `【Overview Skeleton — Algorithm-Generated — LLM Renders Psychology Only】
Transit planets this month (SwissEph truth):
${pBlock.map(p => `  · ${p.k}: ${p.s} House ${p.h}${p.rx}`).join('\n')}
Natal anchors: Sun in ${natalSun}, Rising ${rising}${natalMoon ? `, Moon ${natalMoon}` : ''}
Dominant energy planets: ${dominatedStr}
LLM task: Based on the above truth values, write 1-2 sentences of overall monthly financial theme. Must: (1) connect natal Sun (${natalSun}) with transit planetary energy; (2) reference the dominant planet house themes; (3) write with epic/Jungian depth; (4) NEVER mention any planet, sign or house absent from the truth list above.`,
    es:   `【Resumen — Esqueleto Algorítmico — LLM Solo Renderiza Psicología】
Planetas en tránsito este mes (SwissEph):
${pBlock.map(p => `  · ${p.k}: ${p.s} Casa ${p.h}${p.rx}`).join('\n')}
Anclas natales: Sol ${natalSun}, Ascendente ${rising}
Planetas de energía dominante: ${dominatedStr}
Tarea LLM: Basado en los datos真值 acima, escribe 1-2 oraciones del tema financiero mensual. NUNCA menciones datos no listados arriba.`,
    fr:   `【Résumé — Fondamentaux Algorithmiques — LLM Rend la Psychologie】
Planètes en transit ce mois (SwissEph):
${pBlock.map(p => `  · ${p.k}: ${p.s} Maison ${p.h}${p.rx}`).join('\n')}
Ancres natales: Soleil ${natalSun}, Ascendant ${rising}
Planètes dominantes: ${dominatedStr}
Tâche LLM: Sur la base des données真值 ci-dessus, rédigez 1-2 phrases du thème financier mensuel. NE JAMAIS mentionner de données hors de la liste.`,
    th:   `【ภาพรวม — โครงสร้างอัลกอริทึม — LLM เรนเดอร์จิตวิทยาเท่านั้น】
ดาวเคราะห์ทรานซิสเดือนนี้ (SwissEph):
${pBlock.map(p => `  · ${p.k}: ${p.s} บ้าน ${p.h}${p.rx}`).join('\n')}
จุดยึดกำเนิด: ดวงอาทิตย์กำเนิด ${natalSun}, ราศีขึ้น ${rising}
ดาวพลังงานเด่น: ${dominatedStr}
งาน LLM: จากข้อมูลจริงข้างบน เขียนประโยคธีมการเงินรายเดือน 1-2 ประโยค ห้ามกล่าวถึงข้อมูลนอกเหนือจากรายการ`,
    vi:   `【Tổng quan — Khung thuật toán — LLM Chỉ diễn giải tâm lý】
Các hành tinh transit tháng này (SwissEph):
${pBlock.map(p => `  · ${p.k}: ${p.s} Nhà ${p.h}${p.rx}`).join('\n')}
Điểm neo bẩm sinh: Mặt Trời bản mệnh ${natalSun}, Ascendant ${rising}
Hành tinh năng lượng chủ đạo: ${dominatedStr}
Nhiệm vụ LLM: Dựa trên dữ liệu thật ở trên, viết 1-2 câu chủ đề tài chính hàng tháng. TUYỆT ĐỐI không nhắc đến dữ liệu không có trong danh sách.`,
  };
  return tmpl[lang] || tmpl.zh;
}

/**
 * V439 消费陷阱段骨架生成
 * 输入: astroMatrix + lang → 输出: 算法硬生成的陷阱段真值骨架
 * 危险期由流年星体宫位决定（LLM 不准自己推断哪些天危险）
 */
export function buildMonthlyTrapBlock(astroMatrix, lang) {
  const m0 = astroMatrix?.months?.[0];
  if (!m0) return '';
  const natal = astroMatrix?.meta || {};
  const riskCfg = RISK_LANG[lang] || RISK_LANG.zh;

  // 按财帛宫关联行星 + 危险行星找最危险期
  // 策略：第2宫（财帛宫）关联行星过境最易触发消费冲动
  const dangerPlanets = ['venus','mars','jupiter','saturn','neptune'];
  const dangerPeriods = [];
  const mw = m0.moon_weeks;
  if (Array.isArray(mw)) {
    for (const wk of mw) {
      const wkHouses = (wk.legs || []).map(l => l.house);
      const hasVenus = wk.legs?.some(l => ['venus'].includes(m0.venus?.sign ? l.sign === m0.venus.sign : false));
      // 用日期跨度描述危险期
      const dateRange = `${wk.from_day}–${wk.to_day}日`;
      dangerPeriods.push({ range: dateRange, houses: [...new Set(wkHouses)].join('/') });
    }
  }

  // 找第2宫守护星 + 最危险宫位
  const sunHouse = natal.computed_houses?.Sun?.house || 1;
  const venusHouse = natal.computed_houses?.Venus?.house || 5;
  const marsHouse = natal.computed_houses?.Mars?.house || 6;
  const worstHouses = [2, 8, 4, 6, 11];
  const dominated = dangerPlanets.map(k => {
    const p = m0[k];
    if (!p) return null;
    const h = _getH(p.house);
    const score = worstHouses.includes(h) ? 2 : 1;
    return { k, sign: p.sign, house: h, score };
  }).filter(Boolean).sort((a,b) => b.score - a.score);

  const topDanger = dominated[0];
  const arch = PLANET_TRAP_ARCHETYPE[lang] || PLANET_TRAP_ARCHETYPE.zh;
  const archetype = arch[topDanger?.house] || arch[2];
  const safeRule = riskCfg.safe;

  const dangerRanges = dangerPeriods.slice(0,3).map(d => `${d.range}(月相过境第${d.houses}宫期间)`).join('、');

  const tmpl = {
    zh:   `【消费陷阱骨架 — 算法生成 — LLM 只渲染心理学洞察】
危险行星: ${dominated.slice(0,3).map(d => `${PLANET_ZH_MAP[d.k] || d.k}(${d.sign}第${d.house}宫)`).join('、')}
本命盘脆弱宫位: 财帛宫第2宫、共享资源宫第8宫
高危日期区间（算法判定）: ${dangerRanges || '本月第2周'}
财务安全底线: ${safeRule}
LLM任务: 基于上述真值，撰写陷阱段100-150字。要求: (1)精准描述该行星/宫位组合对应的心理投射陷阱; (2)必须提及高危日期区间; (3)必须包含安全底线规则; (4)禁止编造任何未在上方真值列表中的信息。`,
    en:   `【Spending Trap Skeleton — Algorithm-Generated — LLM Renders Psychology Only】
Dangerous planets: ${dominated.slice(0,3).map(d => `${d.k}(${d.sign} House ${d.house})`).join(', ')}
Vulnerable natal houses: 2nd House (finances), 8th House (shared resources)
High-risk date ranges (computed): ${dangerRanges || 'Week 2'}
Safety floor: ${safeRule}
LLM task: Based on the above truth values, write 100-150 words on the primary spending trap. Must: (1) describe the psychological archetype of the dominant danger planet/house; (2) mention the high-risk periods; (3) include the safety floor rule; (4) NEVER fabricate any data not in the truth list above.`,
    es:   `【Trampas de Gasto — Esqueleto Algorítmico — LLM Solo Psicología】
Planetas peligrosos: ${dominated.slice(0,3).map(d => `${d.k}(${d.sign} Casa ${d.house})`).join(', ')}
Casas vulnerables natales: Casa 2 (finanzas), Casa 8 (recursos compartidos)
Fechas de alto riesgo: ${dangerRanges || 'Semana 2'}
Regla de seguridad: ${safeRule}
Tarea LLM: Basado en los datos真值 acima, redacta 100-150 palabras sobre la trampa principal. NUNCA menciones datos fuera de la lista.`,
    fr:   `【Pièges Financiers — Fondamentaux Algorithmiques — LLM Psychologie】
Planètes dangereuses: ${dominated.slice(0,3).map(d => `${d.k}(${d.sign} Maison ${d.house})`).join(', ')}
Maisons vulnérables natales: Maison 2 (finances), Maison 8 (ressources partagées)
Périodes à haut risque: ${dangerRanges || 'Semaine 2'}
Règle de sécurité: ${safeRule}
Tâche LLM: Sur la base des données真值 ci-dessus, rédigez 100-150 mots sur le piège principal. NE JAMAIS mentionner de données hors liste.`,
    th:   `【กับดักการใช้จ่าย — โครงสร้างอัลกอริทึม — LLM เฉพาะจิตวิทยา】
ดาวเคราะห์อันตราย: ${dominated.slice(0,3).map(d => `${d.k}(${d.sign} บ้าน ${d.house})`).join(', ')}
บ้านเปราะบาง: บ้าน 2 (การเงิน), บ้าน 8 (ทรัพยากรร่วม)
ช่วงเสี่ยงสูง: ${dangerRanges || 'สัปดาห์ที่ 2'}
กฎความปลอดภัย: ${safeRule}
งาน LLM: จากข้อมูลจริง เขียน 100-150 คำเกี่ยวกับกับดักหลัก ห้ามกล่าวข้อมูลนอกรายการ`,
    vi:   `【Bẫy Chi Tiêu — Khung thuật toán — LLM Chỉ tâm lý】
Hành tinh nguy hiểm: ${dominated.slice(0,3).map(d => `${d.k}(${d.sign} Nhà ${d.house})`).join(', ')}
Nhà dễ tổn thương: Nhà 2 (tài chính), Nhà 8 (tài nguyên chia sẻ)
Khoảng thời gian rủi ro cao: ${dangerRanges || 'Tuần 2'}
Quy tắc an toàn: ${safeRule}
Nhiệm vụ LLM: Dựa trên dữ liệu thật ở trên, viết 100-150 từ về bẫy chính. TUYỆT ĐỐI không nhắc đến dữ liệu ngoài danh sách.`,
  };
  return tmpl[lang] || tmpl.zh;
}

export function buildPerMonthDataBlock(astroMatrix, lang) {
  if (!astroMatrix?.months) return '';
  const months = astroMatrix.months;
  const labels = SIGN_L10N;   // V433: 字典提升为模块级常量 SIGN_L10N（供 buildMoonWeekBlock 复用）
  const L = labels[lang] || labels.zh;

  // 月份标签
  const monthAbbr = {
    zh: ['7月','8月','9月','10月','11月','12月','1月','2月','3月','4月','5月','6月'],
    en: ['Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun'],
    es: ['Jul','Ago','Sep','Oct','Nov','Dic','Ene','Feb','Mar','Abr','May','Jun'],
    fr: ['Juil','Août','Sep','Oct','Nov','Déc','Janv','Févr','Mars','Avr','Mai','Juin'],
    th: ['ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.','ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.'],
    vi: ['Thg7','Thg8','Thg9','Thg10','Thg11','Thg12','Thg1','Thg2','Thg3','Thg4','Thg5','Thg6'],
  };
  const mAbbr = monthAbbr[lang] || monthAbbr.zh;

  const lines = [
    '[P1 PER-MONTH PLANET DATA — EVERY WORD IS TRUE — COPY EXACTLY INTO YOUR REPORT]',
    '(*snap* = MID-MONTH SNAPSHOT — a single instant. Applies to the Moon: it changes sign every ~2.5 days, so for week-by-week Moon statements you MUST use the [MOON PER-WEEK TRUTH V433] block, NEVER this value.)',
  ];
  months.forEach((m, i) => {
    const wkMap = i === 0 ? 'W1=Wk1,W2=Wk2,W3=Wk3,W4=Wk4' :
                  i === 1 ? 'W1=Wk5,W2=Wk6,W3=Wk7,W4=Wk8' :
                  i === 2 ? 'W1=Wk9,W2=Wk10,W3=Wk11,W4=Wk12' :
                  i === 3 ? 'W1=Wk13,W2=Wk14,W3=Wk15,W4=Wk16' :
                  i === 4 ? 'W1=Wk17,W2=Wk18,W3=Wk19,W4=Wk20' :
                  i === 5 ? 'W1=Wk21,W2=Wk22,W3=Wk23,W4=Wk24' :
                  i === 6 ? 'W1=Wk25,W2=Wk26,W3=Wk27,W4=Wk28' :
                  i === 7 ? 'W1=Wk29,W2=Wk30,W3=Wk31,W4=Wk32' :
                  i === 8 ? 'W1=Wk33,W2=Wk34,W3=Wk35,W4=Wk36' :
                  i === 9 ? 'W1=Wk37,W2=Wk38,W3=Wk39,W4=Wk40' :
                  i === 10 ? 'W1=Wk41,W2=Wk42,W3=Wk43,W4=Wk44' :
                  'W1=Wk45,W2=Wk46,W3=Wk47,W4=Wk48';
    const sunData = _sunOf(m);
    const sunSignIdx = _signIdxOf(sunData.sign);
    const sunSignName = L[sunSignIdx] || sunData.sign;
    const sunHouse = _getH(sunData.house);

    const parts = [`${months[i].month_name || mAbbr[i]}:`];
    parts.push(`Sun=${sunSignName}(H${sunHouse})`);

    PLANET_KEYS_MONTHLY.forEach(([k, enName]) => {
      if (k === 'sun') return; // handled above
      const p = m[k];
      if (!p?.sign) return;
      const signIdx = _signIdxOf(p.sign);
      const signName = L[signIdx] || p.sign;
      const house = _getH(p.house);
      const rx = p.retrograde ? 'R' : '';
      // V433: 月亮是「月中快照」（2.5 天换一座）——显式标注，杜绝被当作全月值抄进周次
      const snap = k === 'moon' ? '*snap*' : '';
      parts.push(`${enName}=${signName}(H${house})${rx}${snap}`);
    });
    // ── V177-P2: 用每周太阳实际值替换占位符 wkMap（照单抄，杜绝 LLM 推理混淆）──
    const wParts = [];
    for (const wk of ['w1', 'w2', 'w3', 'w4']) {
      const w = m[wk];
      if (w?.sign) {
        const wSignIdx = _signIdxOf(w.sign);
        const wSignName = L[wSignIdx] || w.sign;
        const wHouse = _getH(w.house);
        wParts.push(`${wk}=${wSignName}(H${wHouse})`);
      }
    }
    lines.push(`  ${parts.join(' ')} [${wParts.join(',')}]`);
  });

  return lines.join('\n');
}

// 保留旧接口（年报用）
export function buildAspectsData(astroMatrix) {
  if (!astroMatrix?.months) return [];
  return astroMatrix.months.map(m => ({
    month_key: m.month_key,
    mars_saturn_aspect: m.mars_saturn_aspect || null,
    mars_uranus_aspect: m.mars_uranus_aspect || null,
    sun_jupiter_aspect: m.sun_jupiter_aspect || null,
  }));
}

// ── Health Check ─────────────────────────────────────────────────────────────
export async function v69HealthCheck() {
  try {
    const scriptPath = getScriptPath();
    const result = execSync(`python3 "${scriptPath}" --health`, {
      encoding: 'utf8', timeout: 5000,
    });
    return { ok: true, output: result.trim() };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// ── V441 月报 JSON 事实宪法 ───────────────────────────────────────────────────
// 核心原则：算法生成全部天体事实 JSON，LLM 只负责渲染文采，不生成任何数字/星座/日期。
// 用法：在 buildWealthReportPrompt 月报分支里注入此 block，命令 LLM 照 JSON 渲染。

/**
 * V441: 生成月报 JSON 事实宪法块（算法算真值，LLM 只读不写）
 * @param {object} astroMatrix - 星盘引擎输出
 * @param {string} lang - 语言代码 zh/en/es/fr/th/vi
 * @param {string} monthLabel - 当月标签，如 '9月' / 'Sep'
 * @returns {string} 注入 Prompt 的事实宪法块（含 JSON + LLM 指令）
 */
// ── B路线(军师 9/14): 抽出 factTree JSON 构建，供后端直接吐给前端渲染（LLM 不参与事实组装）──
export function computeMonthlyFactTree(astroMatrix, lang, monthLabel = '') {
  const L = SIGN_L10N[lang] || SIGN_L10N.zh;
  const loc = (s) => { const i = SIGN_FULL.indexOf(s); return (i >= 0 && L[i]) || s; };
  const mw = astroMatrix?.months?.[0]?.moon_weeks;
  const natal = astroMatrix?.meta || {};
  const m0 = astroMatrix?.months?.[0];

  const weekBlocks = (Array.isArray(mw) ? mw : []).map(w => {
    const groups = [];
    for (const lg of (w.legs || [])) {
      const last = groups[groups.length - 1];
      if (last && last.sign === lg.sign) {
        if (!last.houses.includes(lg.house)) last.houses.push(lg.house);
      } else groups.push({ sign: lg.sign, houses: [lg.house] });
    }
    const ingresses = (w.changes || [])
      .filter(c => c.kind === 'sign')
      .map(c => ({ day: c.day, time: c.time, sign: loc(c.to_sign) }));
    return {
      week: w.week,
      fromDay: w.from_day,
      toDay: w.to_day,
      transits: groups.map(g => ({
        sign: loc(g.sign),
        houses: g.houses,
      })),
      ingresses,
    };
  });

  const PLANET_KEYS = ['sun','mercury','venus','mars','jupiter','saturn'];
  const transitPlanets = PLANET_KEYS.map(k => {
    const p = k === 'sun' ? (m0?.sun || (m0?.positions?.Sun ? {sign:m0.positions.Sun.sign, house:m0.positions.Sun.house} : {})) : (m0?.[k]);
    if (!p?.sign) return null;
    return { key: k, sign: loc(p.sign), house: _getH(p.house), retrograde: !!p.retrograde };
  }).filter(Boolean);

  const natalSun = loc(natal.sun_sign || 'Capricorn');
  const rising = loc(natal.rising_sign || 'Cancer');
  const natalMoon = natal.natal_moon ? loc(natal.natal_moon.sign || '') : null;

  const RISK = {
    zh: { sym:'￥', threshold:5000, unit:'元' },
    en: { sym:'$',  threshold:800,  unit:'' },
    fr: { sym:'€',  threshold:700,  unit:'' },
    es: { sym:'€',  threshold:700,  unit:'' },
    th: { sym:'฿',  threshold:5000, unit:'บาท' },
    vi: { sym:'₫',  threshold:500000, unit:'' },
  }[lang] || { sym:'￥', threshold:5000, unit:'元' };

  return {
    reportMeta: { month: monthLabel, natalSun, rising, natalMoon },
    weeklyMoonTransits: weekBlocks,
    transitPlanets,
    spendingTrap: { symbol: RISK.sym, threshold: RISK.threshold, unit: RISK.unit },
  };
}

export function getMonthlyFactTree(astroMatrix, lang, monthLabel = '') {
  return computeMonthlyFactTree(astroMatrix, lang, monthLabel);
}

export function buildMonthlyFactTree(astroMatrix, lang, monthLabel = '') {
  const factTree = computeMonthlyFactTree(astroMatrix, lang, monthLabel);
  const weekBlocks = factTree.weeklyMoonTransits;
  const RISK_LEVELS = ['低危','高危','中危','低危'];

  // ── 7. 逐周生成「照抄句」──
  const monthLocal = monthLabel + (lang === 'zh' ? '月' : '');
  const weekCopyBlocks = weekBlocks.map(w => {
    const risk = RISK_LEVELS[w.week - 1] || '中危';
    const dateRange = lang === 'zh'
      ? `${monthLocal}${w.fromDay}日–${w.toDay}日`
      : `${monthLabel} ${w.fromDay}–${w.toDay}`;
    const riskLabelMap = {
      zh: {'低危':'财富充能','高危':'高危熔断','中危':'顺流蓄力'},
      en: {'低危':'Wealth Recharging','高危':'High-Risk Circuit Breaker','中危':'Strategic Integration'},
      fr: {'低危':'Recharge de Richesse','高危':'Disjoncteur à Haut Risque','中危':'Intégration Stratégique'},
      es: {'低危':'Recarga de Riqueza','高危':'Cortocircuito de Alto Riesgo','中危':'Integración Estratégica'},
      th: {'低危':'การเติมพลังความมั่งคั่ง','高危':'วงจรความเสี่ยงสูง','中危':'การบูรณาการเชิงกลยุทธ์'},
      vi: {'低危':'Nạp lại năng lượng','高危':'Ngắt mạch rủi ro cao','中危':'Tích hợp chiến lược'},
    };
    const riskLabel = (riskLabelMap[lang] || riskLabelMap.zh)[risk] || risk;
    const sep = lang === 'zh' ? '、' : ', ';
    const transitsStr = w.transits.map(t => {
      const houses = t.houses.map(h => lang === 'zh' ? `第${h}宫` : `H${h}`).join('→');
      return `${t.sign}（${houses}）`;
    }).join(sep);
    const ingressStr = w.ingresses.length > 0
      ? (lang === 'zh'
          ? w.ingresses.map(i => `${i.day}日${i.sign}`).join('、')
          : w.ingresses.map(i => `${i.day} ${i.sign}`).join(', '))
      : '';
    return { week: w.week, dateRange, risk, riskLabel, moonTransits: transitsStr, ingressStr };
  });

  // ── 7b. V441 修复：事实块指令必须按目标语言本地化 ──
  // 旧版对 en/es/fr/th/vi 全部写中文指令，但各语言 prompt 均含「Ignore any Chinese text」，
  // 非中文模型忽略中文「照抄句」指令、只抄英文月亮行 → 周散文整段缺失
  // （en 实测 2797 字且周段仅月亮映射；zh 实测 2045 字且周段饱满散文）。
  // 修复：每种语言给原生指令，杜绝「语言混栈让模型进入只抄模式」。
  const FACT_INSTR = {
    zh: {
      head: `【V441 JSON FACT CONSTITUTION — SwissEph 算法生成 · LLM 只读不写】`,
      intro: `以下 JSON 数据是当月天体事实的完整真值。你的任务是把它们翻译成优美的运势文案。`,
      ban: `⚠️ 禁止编造任何未在下方 JSON 中列出的：星座、宫位、日期、金额、行星。`,
      moonRule: `⚠️ 月亮过境必须按 JSON 的 transits 顺序和 house 值渲染，不准改变顺序或换座。`,
      treeHead: `【JSON FACT TREE】`,
      copyHead: `【逐周照抄句（严格按此格式写月亮过境段落）】`,
      moonLabel: `月亮过境`,
      moonLine: (s) => `流月月亮依次行经${s}。`,
      ingressLine: (s) => `${s}换座。`,
    },
    en: {
      head: `【V441 JSON FACT CONSTITUTION — SwissEph-computed · LLM READ-ONLY, do not invent】`,
      intro: `The JSON below is the complete, algorithm-computed truth for this month. Your job is to translate it into beautiful wealth narrative prose.`,
      ban: `⚠️ Do NOT fabricate any sign, house, date, amount, or planet that is not listed in the JSON below.`,
      moonRule: `⚠️ The Moon's weekly transit MUST follow the JSON transits order and house values exactly — do not reorder or substitute signs.`,
      treeHead: `【JSON FACT TREE】`,
      copyHead: `【Per-week Moon copy-line — write the Moon transit EXACTLY in this format, then add your own prose below it】`,
      moonLabel: `Moon transits`,
      moonLine: (s) => `The Moon transits through ${s.replace(/（/g,' (').replace(/）/g,')')}.`,
      ingressLine: (s) => `${s} ingress. `,
    },
    es: {
      head: `【V441 CONSTITUCIÓN DE HECHOS JSON — calculado por SwissEph · LLM solo lectura, no inventes】`,
      intro: `El JSON de abajo es la verdad completa calculada por algoritmo para este mes. Tu tarea es traducirlo en una hermosa narrativa de riqueza.`,
      ban: `⚠️ NO fabriques ningún signo, casa, fecha, monto o planeta que no aparezca en el JSON de abajo.`,
      moonRule: `⚠️ El tránsito semanal de la Luna DEBE seguir el orden y las casas del JSON exactamente — no reordenes ni sustituyas signos.`,
      treeHead: `【JSON FACT TREE】`,
      copyHead: `【Línea de copia lunar por semana — escribe el tránsito lunar EXACTAMENTE en este formato, luego añade tu propia prosa debajo】`,
      moonLabel: `La Luna transita`,
      moonLine: (s) => `La Luna transita por ${s.replace(/（/g,' (').replace(/）/g,')')}.`,
      ingressLine: (s) => `${s} ingreso. `,
    },
    fr: {
      head: `【V441 CONSTITUTION DE FAITS JSON — calculé par SwissEph · LLM lecture seule, n'inventez pas】`,
      intro: `Le JSON ci-dessous est la vérité complète calculée par algorithme pour ce mois. Votre rôle est de la traduire en un beau récit de richesse.`,
      ban: `⚠️ N'inventez AUCUN signe, maison, date, montant ou planète absent du JSON ci-dessous.`,
      moonRule: `⚠️ Le transit hebdomadaire de la Lune DOIT suivre exactement l'ordre et les maisons du JSON — ne réordonnez ni ne substituez les signes.`,
      treeHead: `【JSON FACT TREE】`,
      copyHead: `【Ligne de copie lunaire par semaine — écrivez le transit lunaire EXACTEMENT dans ce format, puis ajoutez votre prose en dessous】`,
      moonLabel: `La Lune transite`,
      moonLine: (s) => `La Lune transite en ${s.replace(/（/g,' (').replace(/）/g,')')}.`,
      ingressLine: (s) => `${s} entrée. `,
    },
    th: {
      head: `【V441 โครงสร้างข้อเท็จจริง JSON — คำนวณโดย SwissEph · LLM อ่านอย่างเดียว ห้ามแต่งเติม】`,
      intro: `JSON ด้านล่างคือข้อเท็จจริงที่คำนวณด้วยอัลกอริทึมทั้งหมดสำหรับเดือนนี้ หน้าที่ของคุณคือแปลมันเป็นเรื่องราวความมั่งคั่งที่สวยงาม`,
      ban: `⚠️ ห้ามแต่งเติมราศี บ้าน วันที่ จำนวนเงิน หรือดาวเคราะห์ใดๆ ที่ไม่อยู่ใน JSON ด้านล่าง`,
      moonRule: `⚠️ การผ่านของดวงจันทร์รายสัปดาห์ต้องเป็นไปตามลำดับและค่าบ้านใน JSON อย่างเคร่งครัด — ห้ามสลับหรือเปลี่ยนราศี`,
      treeHead: `【JSON FACT TREE】`,
      copyHead: `【บรรทัดคัดลอกดวงจันทร์รายสัปดาห์ — เขียนการผ่านดวงจันทร์ให้ตรงกับรูปแบบนี้เท่านั้น จากนั้นเติมเรื่องราวของคุณด้านล่าง】`,
      moonLabel: `ดวงจันทร์ผ่าน`,
      moonLine: (s) => `ดวงจันทร์โคจรผ่าน ${s.replace(/（/g,' (').replace(/）/g,')')}.`,
      ingressLine: (s) => `${s} เข้าสู่. `,
    },
    vi: {
      head: `【V441 CẤU TRÚC SỰ THẬT JSON — tính bởi SwissEph · LLM chỉ đọc, không tự bịa】`,
      intro: `JSON bên dưới là toàn bộ sự thật được tính toán bằng thuật toán cho tháng này. Nhiệm vụ của bạn là dịch nó thành một câu chuyện tài phú đẹp đẽ.`,
      ban: `⚠️ KHÔNG bịa bất kỳ cung, nhà, ngày, số tiền hay hành tinh nào không có trong JSON bên dưới.`,
      moonRule: `⚠️ Sự chuyển động hàng tuần của Mặt Trăng PHẢI tuân theo đúng thứ tự và nhà trong JSON — không đảo lộn hay thay thế cung.`,
      treeHead: `【JSON FACT TREE】`,
      copyHead: `【Dòng sao chép Mặt Trăng theo tuần — viết sự chuyển động Mặt Trăng ĐÚNG theo định dạng này, sau đó thêm lời văn của riêng bạn bên dưới】`,
      moonLabel: `Mặt Trăng đi qua`,
      moonLine: (s) => `Mặt Trăng đi qua ${s.replace(/（/g,' (').replace(/）/g,')')}.`,
      ingressLine: (s) => `${s} đi vào. `,
    },
  };
  const I = FACT_INSTR[lang] || FACT_INSTR.zh;

  const sep = '─'.repeat(40);
  let block = `\n${sep}\n${I.head}\n${sep}\n`;
  block += `${I.intro}\n`;
  block += `${I.ban}\n`;
  block += `${I.moonRule}\n\n`;
  block += `${I.treeHead}\n`;
  block += JSON.stringify(factTree, null, 2) + `\n\n`;
  block += `${I.copyHead}\n`;
  for (const wb of weekCopyBlocks) {
    const ingressLine = wb.ingressStr ? I.ingressLine(wb.ingressStr) : '';
    block += `[WEEK ${wb.week} ${wb.dateRange} (${wb.riskLabel})]\n`;
    block += `${I.moonLabel}: ${I.moonLine(wb.moonTransits)}\n${ingressLine}\n`;
  }
  block += `${sep}\n`;
  return block;
}
