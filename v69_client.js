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
    '--months', '12'
  ];

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
  // 🛠️ V143: 合并本命盘宫位映射 (computed_houses) —— Mode A 激活关键
  if (natalData.computed_houses && Object.keys(natalData.computed_houses).length > 0) {
    matrix.meta.computed_houses = natalData.computed_houses;
    console.log('[V143] Merged computed_houses:', Object.keys(natalData.computed_houses).join(','));
  }

  console.log(`[V134] Got ${matrix.months?.length || 0} months, ${matrix.retrograde_stations?.mercury?.length || 0} Mercury stations`);

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
  const cacheKey = `${birthDate}:${birthTime}:${lat.toFixed(2)}:${lon.toFixed(2)}:${tz}`;

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
  const houseMapping = HOUSE_MAPPING_TEMPLATE[actualRising] || HOUSE_MAPPING_TEMPLATE['Cancer'];
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
House System: Equal House

═══════════════════════════════════════════════
⛔ [ASTROLOGICAL ACCURACY DIRECTIVE — NATAL vs TRANSIT — ZERO TOLERANCE]
• The user's NATAL Sun Sign is FIXED FOREVER: ${astroMatrix.meta?.sun_sign || 'Cancer'} (from their birth date).
• The "Transit Sun" positions listed below (Cancer, Leo, etc.) are the CURRENT sky, NOT the user's sign.
• NEVER call the user by a transit sign (e.g. do NOT say "Cancer Sun" if their natal is not Cancer) — they are ALWAYS a ${astroMatrix.meta?.sun_sign || 'Cancer'}.
• FORBIDDEN phrases: "your Cancer Sun", "as a Cancer", "you are a Cancer" (unless natal IS Cancer).
• CORRECT: "your natal ${astroMatrix.meta?.sun_sign || 'Cancer'} Sun" / "the transiting Sun moving through Cancer".
═══════════════════════════════════════════════

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

── House Mapping (Equal House, Rising = ${actualRising}) ──
${houseMapping}

── Mercury Retrograde Periods (2026-2027) ──
${mercuryRxText || 'No major Mercury retrograde this period.'}

── Peak Revenue Windows ──
${peakWindows || 'Dynamically computed from exact planetary alignments.'}

── Crisis / Black Swan Days ──
${crisisDays?.join('\n') || 'None this month.'}

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
