/**
 * V69 Astro Truth Client - SwissEph-Powered Computation
 * Fetches accurate astrological matrix from Python SwissEph engine.
 * No hallucination possible: all data computed by code.
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// ── V69 Service Config ──────────────────────────────────────────────────────
const V69_HOST = process.env.V69_HOST || 'localhost';
const V69_PORT = process.env.V69_PORT || '8001';
const V69_BASE = `http://${V69_HOST}:${V69_PORT}`;

// ── In-Memory Cache ──────────────────────────────────────────────────────────
const matrixCache = new Map(); // key: `${birthDate}:${risingSign}` → matrix
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// ── Fetch Astro Matrix ───────────────────────────────────────────────────────
/**
 * Get the full 12-month astro matrix from V69 Python engine.
 * 🛠️ V91+: 支持 birth_time / lat / lon / tz 精确参数。
 * Caches result for 1 hour to avoid repeated subprocess calls.
 */
export async function getAstroMatrix(birthDate, birthTime = '12:00', lat = 13.75, lon = 100.5, tz = 'Asia/Bangkok') {
  // 🛠️ V91: 缓存键含坐标，不同城市缓存分离
  const cacheKey = `${birthDate}:${birthTime}:${lat.toFixed(2)}:${lon.toFixed(2)}:${tz}`;

  
  // Check cache
  const cached = matrixCache.get(cacheKey);
  if (cached && (Date.now() - cached.fetchedAt) < CACHE_TTL_MS) {
    console.log(`[V69] Cache hit: ${cacheKey}`);
    return cached.data;
  }

  console.log(`[V69] Fetching from Python engine: ${cacheKey}`);

  try {
    const res = await fetch(`${V69_BASE}/api/v1/astro-matrix`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        birth_date: birthDate,
        birth_time: birthTime,   // 🛠️ V91+: 出生时间
        lat: lat,               // 🛠️ V91+: 纬度
        lon: lon,               // 🛠️ V91+: 经度
        tz: tz,                // 🛠️ V91+: 时区
        year: new Date().getFullYear(),
        month_start: new Date().getMonth() + 1,
        months: 12,
      }),
      signal: AbortSignal.timeout(8000), // 8 second timeout
    });

    if (!res.ok) {
      const err = await res.text();
      console.warn(`[V69] API error ${res.status}: ${err.slice(0, 200)}`);
      return null;
    }

    const matrix = await res.json();
    
    // Cache it
    matrixCache.set(cacheKey, { data: matrix, fetchedAt: Date.now() });
    console.log(`[V69] Fetched ${matrix.months?.length || 0} months, ${matrix.retrograde_stations?.length || 0} stations`);
    
    return matrix;
  } catch (e) {
    console.warn(`[V69] Fetch failed: ${e.message} — using fallback`);
    return null;
  }
}

// ── Build FACT_SHEET from Astro Matrix ───────────────────────────────────────
/**
 * Generate the FACT_SHEET section of the prompt from V69 computed data.
 * This replaces the hardcoded FACT_SHEET with machine-generated truth.
 */
export function buildFactSheet(astroMatrix, lang = 'en') {
  if (!astroMatrix || !astroMatrix.months) {
    return ''; // Fallback: no fact sheet
  }

  const { months, retrograde_stations, meta } = astroMatrix;
  
  // 🛠️ V80 FIX: 动态取 rising_sign，不再硬编码 Cancer Rising
  const actualRising = meta?.rising_sign || 'Cancer';
  
  // Find Jupiter position from first month
  const firstMonth = months[0];
  // V96 FIX: 所有 fallback 改为 null，强制使用 AstroMatrix 真实计算值
  // 当 AstroMatrix 不可用时，整个 factSheet 生成会失败，而不是返回错误数据
  const jupiterHouse = firstMonth?.jupiter?.house ?? null;
  const saturnHouse = firstMonth?.saturn?.house ?? null;
  const plutoHouse = firstMonth?.pluto?.house ?? null;
  const jupiterSign = firstMonth?.jupiter?.sign ?? null;
  const saturnSign = firstMonth?.saturn?.sign ?? null;
  const plutoSign = firstMonth?.pluto?.sign ?? null;

  // V96 FIX: 如果 AstroMatrix 数据不完整，直接返回空（不再输出错误 FACT_SHEET）
  if (!jupiterHouse || !saturnHouse || !plutoHouse || !jupiterSign) {
    return '';
  }

  // Build Mercury Retrograde list from stations
  const mercuryRxPeriods = [];
  const stations = retrograde_stations?.mercury || retrograde_stations || [];
  
  // Pair RETROGRADE → DIRECT stations into periods
  // Note: stations can be in retrograde_stations.mercury OR directly in retrograde_stations
  const stationArray = stations.mercury || stations || [];
  let lastRetrograde = null;
  for (const s of stationArray) {
    if (s.type === 'RETROGRADE') {
      lastRetrograde = s;
    } else if (s.type === 'DIRECT' && lastRetrograde) {
      mercuryRxPeriods.push({
        start: lastRetrograde.date,
        end: s.date,
        sign: lastRetrograde.sign,
      });
      lastRetrograde = null;
    }
  }

  // Format Mercury retrograde section
  const mercuryRxText = mercuryRxPeriods
    .slice(0, 6) // max 6 periods
    .map((r, i) => `- Mercury Retrograde #${i+1} (${r.sign}): ${r.start} – ${r.end}`)
    .join('\n');

  // Build monthly peak windows
  const peakWindows = months
    .filter(m => m.peak_windows && m.peak_windows.length > 0)
    .slice(0, 3)
    .map(m => `- ${m.month_name}: ${m.peak_windows[0].date} (${m.peak_windows[0].type} in ${m.peak_windows[0].sign})`)
    .join('\n');

  // Build crisis days
  const crisisDays = months
    .flatMap(m => (m.black_swan_days || []).map(d => `- ${d.date}: ${d.aspect}`))
    .slice(0, 4);

  // 🛠️ V80 FIX: 动态生成 house mapping 描述，基于 actual rising sign
  // V96 FIX: 修正 Equal House 宫位映射（Counter-Clockwise from ASC）
  // House N = ASC + N - 1 (mod 12)
  // Cancer Rising: 1=Cancer, 2=Leo, 3=Virgo, 4=Libra, 5=Scorpio, 6=Sagittarius,
  //                 7=Capricorn, 8=Aquarius, 9=Pisces, 10=Aries, 11=Taurus, 12=Gemini
  const HOUSE_MAPPING_TEMPLATE = {
    'Cancer':  '1=Cancer / 2=Leo / 3=Virgo / 4=Libra / 5=Scorpio / 6=Sagittarius / 7=Capricorn / 8=Aquarius / 9=Pisces / 10=Aries / 11=Taurus / 12=Gemini',
    'Aries':   '1=Aries / 2=Taurus / 3=Gemini / 4=Cancer / 5=Leo / 6=Virgo / 7=Libra / 8=Scorpio / 9=Sagittarius / 10=Capricorn / 11=Aquarius / 12=Pisces',
    'Libra':   '1=Libra / 2=Scorpio / 3=Sagittarius / 4=Capricorn / 5=Aquarius / 6=Pisces / 7=Aries / 8=Taurus / 9=Gemini / 10=Cancer / 11=Leo / 12=Virgo',
    'Leo':     '1=Leo / 2=Virgo / 3=Libra / 4=Scorpio / 5=Sagittarius / 6=Capricorn / 7=Aquarius / 8=Pisces / 9=Aries / 10=Taurus / 11=Gemini / 12=Cancer',
    'Taurus':  '1=Taurus / 2=Gemini / 3=Cancer / 4=Leo / 5=Virgo / 6=Libra / 7=Scorpio / 8=Sagittarius / 9=Capricorn / 10=Aquarius / 11=Pisces / 12=Aries',
    'Virgo':   '1=Virgo / 2=Libra / 3=Scorpio / 4=Sagittarius / 5=Capricorn / 6=Aquarius / 7=Pisces / 8=Aries / 9=Taurus / 10=Gemini / 11=Cancer / 12=Leo',
    'Scorpio': '1=Scorpio / 2=Sagittarius / 3=Capricorn / 4=Aquarius / 5=Pisces / 6=Aries / 7=Taurus / 8=Gemini / 9=Cancer / 10=Leo / 11=Virgo / 12=Libra',
    'Sagittarius': '1=Sagittarius / 2=Capricorn / 3=Aquarius / 4=Pisces / 5=Aries / 6=Taurus / 7=Gemini / 8=Cancer / 9=Leo / 10=Virgo / 11=Libra / 12=Scorpio',
    'Capricorn': '1=Capricorn / 2=Aquarius / 3=Pisces / 4=Aries / 5=Taurus / 6=Gemini / 7=Cancer / 8=Leo / 9=Virgo / 10=Libra / 11=Scorpio / 12=Sagittarius',
    'Aquarius': '1=Aquarius / 2=Pisces / 3=Aries / 4=Taurus / 5=Gemini / 6=Cancer / 7=Leo / 8=Virgo / 9=Libra / 10=Scorpio / 11=Sagittarius / 12=Capricorn',
    'Pisces':   '1=Pisces / 2=Aries / 3=Taurus / 4=Gemini / 5=Cancer / 6=Leo / 7=Virgo / 8=Libra / 9=Scorpio / 10=Sagittarius / 11=Capricorn / 12=Aquarius',
    'Gemini':   '1=Gemini / 2=Cancer / 3=Leo / 4=Virgo / 5=Libra / 6=Scorpio / 7=Sagittarius / 8=Capricorn / 9=Aquarius / 10=Pisces / 11=Aries / 12=Taurus',
  };
  const houseMapping = HOUSE_MAPPING_TEMPLATE[actualRising] || HOUSE_MAPPING_TEMPLATE['Cancer'];

  // ── V93 FIX: 添加显式 computed_houses JSON 块 ──
  const computedHouses = meta?.computed_houses || {};
  const computedHousesJson = JSON.stringify(computedHouses, null, 2);

  const factSheet = `[2026-2027 ASTRONOMY FACT SHEET - V69 SwissEph COMPUTED]
All data below is calculated by Swiss Ephemeris. Do NOT contradict this data.

═══════════════════════════════════════════════
⛔ V93 STRICT RULE — AI MUST USE computed_houses.json BELOW ⛔
This JSON block contains the EXACT house numbers for this user's chart.
AI MUST quote these house numbers when writing about Jupiter/Saturn/Pluto/Sun.
AI MUST NOT infer houses from zodiac sign names.
═══════════════════════════════════════════════

[COMPUTED_HOUSES - authoritative JSON — USE THIS EXACTLY]:
${computedHousesJson}

[PLANETARY POSITIONS - computed by SwissEph, do not alter]:
- Jupiter 2026-2027: ${jupiterSign} (House ${jupiterHouse} — primary wealth engine)
- Saturn 2026-2027: ${saturnSign} (House ${saturnHouse})
- Pluto 2026-2027: ${plutoSign} (House ${plutoHouse})

[MERCURY RETROGRADE PERIODS - SwissEph computed]:
${mercuryRxText || '- (No retrograde periods in this range)'}

[KEY SEASONAL PEAKS - SwissEph computed]:
${peakWindows || '- (See monthly analysis)'}

[CRISIS DAYS - SwissEph computed]:
${crisisDays.length > 0 ? crisisDays.join('\n') : '- None in primary window'}

[HOUSE SYSTEM]: Equal House, Rising Sign = ${actualRising}
Locked mapping: ${houseMapping}`;

  return factSheet;
}

// ── Per-Month Data for Section II ─────────────────────────────────────────────
/**
 * V95: Pre-written monthly titles with CORRECT house numbers + SwissEph planetary data.
 * AI must COPY titles verbatim. House numbers come from Python SwissEph.
 */

// 中文宫位名（12宫）
const ZH_HOUSE_NAMES = {
  1:'第一宫·自我宫', 2:'第二宫·财帛宫', 3:'第三宫·兄弟宫',
  4:'第四宫·田宅宫', 5:'第五宫·男女宫', 6:'第六宫·奴仆宫',
  7:'第七宫·婚姻宫', 8:'第八宫·疾厄宫', 9:'第九宫·迁移宫',
  10:'第十宫·官禄宫', 11:'第十一宫·福德宫', 12:'第十二宫·相貌宫'
};
const ZH_SIGN_NAMES = {
  Aries:'白羊座', Taurus:'金牛座', Gemini:'双子座', Cancer:'巨蟹座',
  Leo:'狮子座', Virgo:'处女座', Libra:'天秤座', Scorpio:'天蝎座',
  Sagittarius:'射手座', Capricorn:'摩羯座', Aquarius:'水瓶座', Pisces:'双鱼座'
};
const EN_HOUSE_NAMES = {
  1:'1st House (Self)', 2:'2nd House (Wealth)', 3:'3rd House (Siblings)',
  4:'4th House (Home)', 5:'5th House (Creativity)', 6:'6th House (Service)',
  7:'7th House (Partnership)', 8:'8th House (Shared)', 9:'9th House (Journey)',
  10:'10th House (Career)', 11:'11th House (Community)', 12:'12th House (Hidden)'
};

export function buildPerMonthData(astroMatrix, lang = 'zh') {
  if (!astroMatrix || !astroMatrix.months) return '';

  const houseNames = lang === 'zh' ? ZH_HOUSE_NAMES : EN_HOUSE_NAMES;
  const signNames = lang === 'zh' ? ZH_SIGN_NAMES : null;
  const elemEmoji = { Water:'🌊', Fire:'🔥', Earth:'🌍', Air:'💨' };

  if (lang === 'zh') {
    // ── 中文：Pre-written titles with correct house numbers ──
    return astroMatrix.months.map(m => {
      const lines = [];
      const sun = m.sun || {};
      const jup = m.jupiter || {};
      const sat = m.saturn || {};
      const merc = m.mercury || {};
      const venus = m.venus || {};
      const mars = m.mars || {};

      const sunHouse = houseNames[sun.house] || `第${sun.house}宫`;
      const sunSign = signNames[sun.sign] || sun.sign || '';
      const jupHouse = houseNames[jup.house] || `第${jup.house}宫`;
      const jupSign = signNames[jup.sign] || jup.sign || '';
      const satHouse = houseNames[sat.house] || `第${sat.house}宫`;
      const satSign = signNames[sat.sign] || sat.sign || '';

      // V95: 标题包含当月最重要的行星+宫位（AI 必须完整抄录）
      lines.push(`【${m.month_name}】太阳${sunSign}${sunHouse} · 木星${jupSign}${jupHouse} · 土星${satSign}${satHouse}`);
      lines.push('─'.repeat(40));

      // SwissEph 行星宫位数据（AI 可引用但必须与标题一致）
      const allPlanets = [
        ['sun', sun], ['moon', m.moon], ['mercury', merc],
        ['venus', venus], ['mars', mars], ['jupiter', jup],
        ['saturn', sat], ['uranus', m.uranus], ['neptune', m.neptune], ['pluto', m.pluto]
      ];
      lines.push('[SwissEph行星实时位置 - 必须与标题宫位一致]:');
      for (const [name, p] of allPlanets) {
        if (!p) continue;
        const rx = p.retrograde ? ' (逆行)' : '';
        const signZ = signNames[p.sign] || p.sign || '';
        const houseZ = houseNames[p.house] || `第${p.house}宫`;
        lines.push(`  ${signZ}${houseZ}${rx} ${elemEmoji[p.element]||''}`);
      }

      // 水星状态
      if (merc.status) {
        lines.push(`  水星: ${merc.status === 'RETROGRADE' ? '🔴逆行中' : '🟢顺行'}`);
      }

      // Peak windows
      if (m.peak_windows && m.peak_windows.length > 0) {
        for (const w of m.peak_windows.slice(0, 2)) {
          lines.push(`  🟢财流高峰: ${w.date} — ${w.type} in ${w.sign}`);
        }
      }

      // Black swan
      if (m.black_swan_days && m.black_swan_days.length > 0) {
        for (const d of m.black_swan_days.slice(0, 1)) {
          lines.push(`  🔴黑天鹅日: ${d.date} — ${d.aspect}`);
        }
      }
      lines.push('');
      return lines.join('\n');
    }).join('\n');
  }

  // ── 英文等其他语言：保持原有 SwissEph 格式 ──
  return astroMatrix.months.map(m => {
    const lines = [];
    lines.push(`[${m.month_key} SWISSEPH PLANETARY POSITIONS]:`);
    const inner = ['sun','moon','mercury','venus','mars'];
    for (const name of inner) {
      const p = m[name];
      if (!p) continue;
      const rx = p.retrograde ? ' (RETROGRADE)' : '';
      lines.push(`  ${p.sign} ${p.degree ? p.degree+'°' : ''} House ${p.house}${rx}`);
    }
    const outer = ['jupiter','saturn','uranus','neptune','pluto'];
    for (const name of outer) {
      const p = m[name];
      if (!p) continue;
      const rx = p.retrograde ? ' (RETROGRADE)' : '';
      lines.push(`  ${p.sign} House ${p.house}${rx}`);
    }
    if (m.peak_windows && m.peak_windows.length > 0) {
      for (const w of m.peak_windows.slice(0, 2)) {
        lines.push(`  🟢 Peak: ${w.date} — ${w.type} in ${w.sign}`);
      }
    }
    if (m.black_swan_days && m.black_swan_days.length > 0) {
      for (const d of m.black_swan_days.slice(0, 1)) {
        lines.push(`  🔴 Black Swan: ${d.date} — ${d.aspect}`);
      }
    }
    lines.push('');
    return lines.join('\n');
  }).join('\n');
}


// ── Health Check ──────────────────────────────────────────────────────────────
export async function v69HealthCheck() {
  try {
    const res = await fetch(`${V69_BASE}/api/v1/health`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) return true;
  } catch {}
  return false;
}
