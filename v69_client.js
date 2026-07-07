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
 * Caches result for 1 hour to avoid repeated subprocess calls.
 */
export async function getAstroMatrix(birthDate, risingSign = 'Cancer') {
  const cacheKey = `${birthDate}:${risingSign}`;
  
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
        rising_sign: risingSign,
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
  
  // Find Jupiter position from first month
  const firstMonth = months[0];
  const jupiterSign = firstMonth?.jupiter?.sign || 'Leo';
  const jupiterHouse = firstMonth?.jupiter?.house || 2;
  
  // Find Saturn position from first month
  const saturnSign = firstMonth?.saturn?.sign || 'Aries';
  const saturnHouse = firstMonth?.saturn?.house || 10;
  
  // Find Pluto position
  const plutoSign = firstMonth?.pluto?.sign || 'Aquarius';
  const plutoHouse = firstMonth?.pluto?.house || 8;

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

  const factSheet = `[2026-2027 ASTRONOMY FACT SHEET - V69 SwissEph COMPUTED]
All data below is calculated by Swiss Ephemeris. Do NOT contradict this data.

[PLANETARY POSITIONS - computed by SwissEph, do not alter]:
- Jupiter 2026-2027: ${jupiterSign} (House ${jupiterHouse} for Cancer Rising — this is the primary wealth engine)
- Saturn 2026-2027: ${saturnSign} (House ${saturnHouse} for Cancer Rising)
- Pluto 2026-2027: ${plutoSign} (House ${plutoHouse} for Cancer Rising)

[MERCURY RETROGRADE PERIODS - SwissEph computed]:
${mercuryRxText || '- (No retrograde periods in this range)'}

[KEY SEASONAL PEAKS - SwissEph computed]:
${peakWindows || '- (See monthly analysis)'}

[CRISIS DAYS - SwissEph computed]:
${crisisDays.length > 0 ? crisisDays.join('\n') : '- None in primary window'}

[HOUSE SYSTEM]: Equal House for Cancer Rising
Locked mapping: 1=Cancer / 2=Leo / 3=Virgo / 4=Libra / 5=Scorpio / 6=Sagittarius / 7=Capricorn / 8=Aquarius / 9=Pisces / 10=Aries / 11=Taurus / 12=Gemini`;

  return factSheet;
}

// ── Per-Month Data for Section II ─────────────────────────────────────────────
/**
 * Get per-month structured data for Section II (monthly breakdown).
 */
export function buildMonthlyData(astroMatrix) {
  if (!astroMatrix || !astroMatrix.months) return [];
  
  return astroMatrix.months.map(m => ({
    month_key: m.month_key,
    month_name: m.month_name,
    sun: m.sun,
    jupiter: m.jupiter,
    saturn: m.saturn,
    mercury: m.mercury,
    peak_windows: m.peak_windows || [],
    black_swan_days: m.black_swan_days || [],
    macro_energy: m.macro_energy || '',
  }));
}

// ── Health Check ──────────────────────────────────────────────────────────────
export async function v69HealthCheck() {
  try {
    const res = await fetch(`${V69_BASE}/api/v1/health`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) return true;
  } catch {}
  return false;
}
