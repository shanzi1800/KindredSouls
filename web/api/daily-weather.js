// Force Node.js 20 runtime
export const runtime = 'nodejs';

// ── Supabase REST helpers (Vercel serverless compatible) ──
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const SB_HEADERS = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
};

async function sbGet(table, query) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers: SB_HEADERS });
  if (!r.ok) { const t = await r.text(); throw new Error(`SB GET ${table} ${r.status}: ${t}`); }
  return r.json();
}

async function sbUpsert(table, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...SB_HEADERS, 'Prefer': 'return=representation,resolution=merge-duplicates' },
    body: JSON.stringify(body),
  });
  if (!r.ok) { const t = await r.text(); throw new Error(`SB UPSERT ${table} ${r.status}: ${t}`); }
  return r.json();
}

async function sbPatch(table, id, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...SB_HEADERS, 'Prefer': 'return=minimal' },
    body: JSON.stringify(body),
  });
  if (!r.ok) { const t = await r.text(); throw new Error(`SB PATCH ${table} ${r.status}: ${t}`); }
}


// ═══════════════════════════════════════════════════
// KindredSouls Phase 2 — Daily Weather API
// 基于流日干支 + 星象 transit 计算每日关系气象
// ═══════════════════════════════════════════════════

// ── 天干地支基础数据 ──
const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

const TG_WUXING = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
};

const DZ_WUXING = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
  '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水',
};

const DZHI_LIUCHONG = {
  '子': '午', '午': '子', '丑': '未', '未': '丑',
  '寅': '申', '申': '寅', '卯': '酉', '酉': '卯',
  '辰': '戌', '戌': '辰', '巳': '亥', '亥': '巳',
};

const DZHI_SANHE = {
  '申': '子辰', '子': '申辰', '辰': '申子',
  '寅': '午戌', '午': '寅戌', '戌': '寅午',
  '亥': '卯未', '卯': '亥未', '未': '亥卯',
  '巳': '酉丑', '酉': '巳丑', '丑': '巳酉',
};

// ── 五行相生相克 ──
const WUXING_SHENG = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
const WUXING_KE = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };

// ── 西方星座元素 ──
const ZODIAC_ELEMENTS = {
  Aries: '火', Leo: '火', Sagittarius: '火',
  Taurus: '土', Virgo: '土', Capricorn: '土',
  Gemini: '风', Libra: '风', Aquarius: '风',
  Cancer: '水', Scorpio: '水', Pisces: '水',
};

const ZODIAC_POLARITY = {
  Aries: '阳', Leo: '阳', Sagittarius: '阳',
  Taurus: '阴', Virgo: '阴', Capricorn: '阴',
  Gemini: '阳', Libra: '阳', Aquarius: '阳',
  Cancer: '阴', Scorpio: '阴', Pisces: '阴',
};

// ── 关系天气状态映射 ──
const WEATHER_STATUS = {
  CLEAR: { status: 'Clear_Sky', label: '☀️ Clear skies', desc: 'Harmony flows naturally' },
  PARTLY_CLOUDY: { status: 'Partly_Cloudy', label: '🌤️ Partly cloudy', desc: 'Minor friction, easy to resolve' },
  CLOUDY: { status: 'Cloudy', label: '☁️ Overcast', desc: 'Emotional distance building' },
  RAIN: { status: 'Rain', label: '🌧️ Rain', desc: 'Tears or deep conversations ahead' },
  THUNDERSTORM: { status: 'Thunderstorm', label: '⛈️ Thunderstorm', desc: 'Major conflict risk — tread carefully' },
  SNOW: { status: 'Snow', label: '❄️ Frost', desc: 'Cold silence, patience needed' },
  RAINBOW: { status: 'Rainbow', label: '🌈 Rainbow', desc: 'Breakthrough after struggle' },
};

// ── 开运色板 ──
const LUCKY_COLORS = [
  '#7B2CBF', '#D4AF37', '#50C878', '#E8475F', '#4ECDC4',
  '#FF6B6B', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
  '#FF8C42', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F0B27A', '#82E0AA', '#F1948A', '#AED6F1', '#D7BDE2',
];

// ── 穿搭标签 ──
const OUTFIT_TAGS = [
  'Mystic_Retro', 'Celestial_Minimal', 'Ethereal_Boho',
  'Cosmic_Chic', 'Lunar_Elegance', 'Solar_Power',
  'Venus_Glow', 'Mars_Edge', 'Neptune_Dream',
  'Saturn_Structure', 'Jupiter_Abundance', 'Mercury_Swift',
];

// ── 花语 ID ──
const FLOWER_POOL = Array.from({ length: 12 }, (_, i) => i + 1);

// ── 塔罗 ID ──
const TAROT_POOL = Array.from({ length: 22 }, (_, i) => i + 1); // 大阿卡纳 0-21

// ═══════════════════════════════════════════════════
// 核心算法：流日干支计算
// ═══════════════════════════════════════════════════

/**
 * 计算指定日期的日柱干支
 * 基于儒略日数 (JDN) 的干支循环
 */
function getDayPillar(dateStr) {
  const date = new Date(dateStr + 'T00:00:00Z');
  // 儒略日数
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();

  // 计算 JDN
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  const jdn = d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;

  // 干支循环：60 甲子
  const index = ((jdn - 11) % 60 + 60) % 60; // 以甲子为0
  const tgIndex = index % 10;
  const dzIndex = index % 12;

  return {
    tianGan: TIANGAN[tgIndex],
    diZhi: DIZHI[dzIndex],
    wuXing: TG_WUXING[TIANGAN[tgIndex]],
    diZhiWuXing: DZ_WUXING[DIZHI[dzIndex]],
    tgIndex,
    dzIndex,
  };
}

// ═══════════════════════════════════════════════════
// 确定性伪随机：seed = date + birthday
// ═══════════════════════════════════════════════════

function seededRandom(seed) {
  // 简单哈希
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  // LCG
  h = (h * 1664525 + 1013904223) | 0;
  return (h >>> 0) / 4294967296;
}

function seededRandomArray(seed, count) {
  const results = [];
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  for (let i = 0; i < count; i++) {
    h = (h * 1664525 + 1013904223) | 0;
    results.push((h >>> 0) / 4294967296);
  }
  return results;
}

// ═══════════════════════════════════════════════════
// 动态气象计算主函数
// ═══════════════════════════════════════════════════

function calculateDailyWeather(staticProfile, dateStr) {
  const dayPillar = getDayPillar(dateStr);
  const seed = `${dateStr}_${staticProfile.user.day_master}_${staticProfile.partner.day_master}`;

  // ── 1. 沟通指数 (0-100) ──
  let commBase = 60;
  const userWx = TG_WUXING[staticProfile.user.day_master] || '土';
  const partnerWx = TG_WUXING[staticProfile.partner.day_master] || '土';
  const dayWx = dayPillar.wuXing;

  // 日主五行与流日五行关系影响沟通
  if (WUXING_SHENG[userWx] === dayWx) commBase += 10; // 我生流日，表达欲强
  if (WUXING_SHENG[dayWx] === userWx) commBase += 8;  // 流日生我，被倾听
  if (WUXING_KE[userWx] === dayWx) commBase -= 5;     // 我克流日，强势
  if (WUXING_KE[dayWx] === userWx) commBase -= 8;     // 流日克我，压抑

  if (WUXING_SHENG[partnerWx] === dayWx) commBase += 8;
  if (WUXING_SHENG[dayWx] === partnerWx) commBase += 6;
  if (WUXING_KE[partnerWx] === dayWx) commBase -= 3;
  if (WUXING_KE[dayWx] === partnerWx) commBase -= 6;

  // 加入确定性随机抖动 (±10)
  const commJitter = Math.floor(seededRandom(seed + '_comm') * 20) - 10;
  const communicationIndex = Math.max(10, Math.min(100, commBase + commJitter));

  // ── 2. 吸引力指数 (0-100) ──
  let attrBase = 65;
  const userMoon = staticProfile.user.moon_sign;
  const partnerMoon = staticProfile.partner.moon_sign;

  // 月亮星座元素互动
  const userMoonElement = ZODIAC_ELEMENTS[userMoon] || '水';
  const partnerMoonElement = ZODIAC_ELEMENTS[partnerMoon] || '水';

  // 五行相生加吸引力，相克减
  if (WUXING_SHENG[userMoonElement] === partnerMoonElement) attrBase += 12;
  if (WUXING_SHENG[partnerMoonElement] === userMoonElement) attrBase += 12;
  if (userMoonElement === partnerMoonElement) attrBase += 8;
  if (WUXING_KE[userMoonElement] === partnerMoonElement) attrBase -= 5;
  if (WUXING_KE[partnerMoonElement] === userMoonElement) attrBase -= 5;

  // 流日对月亮的影响
  if (WUXING_SHENG[dayWx] === userMoonElement || WUXING_SHENG[dayWx] === partnerMoonElement) {
    attrBase += 6;
  }

  const attrJitter = Math.floor(seededRandom(seed + '_attr') * 20) - 10;
  const attractionIndex = Math.max(10, Math.min(100, attrBase + attrJitter));

  // ── 3. 冲突风险评估 ──
  let conflictScore = 30; // 基线

  // 地支六冲检测
  const userDz = staticProfile.user.day_master ? getDizhiFromDayMaster(staticProfile.user.day_master) : null;
  const partnerDz = staticProfile.partner.day_master ? getDizhiFromDayMaster(staticProfile.partner.day_master) : null;
  const dayDz = dayPillar.diZhi;

  if (userDz && DZHI_LIUCHONG[userDz] === dayDz) conflictScore += 20;
  if (partnerDz && DZHI_LIUCHONG[partnerDz] === dayDz) conflictScore += 20;
  if (userDz && partnerDz && DZHI_LIUCHONG[userDz] === partnerDz) conflictScore += 15;

  // 五行克战
  if (WUXING_KE[dayWx] === userWx || WUXING_KE[dayWx] === partnerWx) conflictScore += 10;

  // 沟通低 + 吸引力高 = 欲说还休型冲突
  if (communicationIndex < 40 && attractionIndex > 70) conflictScore += 10;

  const conflictJitter = Math.floor(seededRandom(seed + '_conflict') * 15) - 7;
  conflictScore = Math.max(5, Math.min(95, conflictScore + conflictJitter));

  let conflictRisk;
  if (conflictScore >= 70) conflictRisk = 'High';
  else if (conflictScore >= 40) conflictRisk = 'Medium';
  else conflictRisk = 'Low';

  // ── 4. 关系天气状态 ──
  const weather = mapWeatherStatus(communicationIndex, attractionIndex, conflictScore);

  // ── 5. 流日冲击 ──
  const userClash = userDz ? DZHI_LIUCHONG[userDz] === dayDz : false;
  const partnerClash = partnerDz ? DZHI_LIUCHONG[partnerDz] === dayDz : false;

  let synastryImpact = 'Neutral';
  if (userClash && partnerClash) synastryImpact = 'Double_Clash';
  else if (userClash) synastryImpact = 'User_Clash';
  else if (partnerClash) synastryImpact = 'Partner_Clash';

  // 三合检测
  if (!userClash && !partnerClash) {
    if (userDz && partnerDz && dayDz) {
      const sanhe = DZHI_SANHE[dayDz];
      if (sanhe && sanhe.includes(userDz) && sanhe.includes(partnerDz)) {
        synastryImpact = 'Triple_Harmony';
      } else if (sanhe && (sanhe.includes(userDz) || sanhe.includes(partnerDz))) {
        synastryImpact = 'Partial_Harmony';
      }
    }
  }

  // ── 6. 开运种子（确定性随机） ──
  const rng = seededRandomArray(seed + '_lucky', 7);
  const luckySeeds = {
    color_hex: LUCKY_COLORS[Math.floor(rng[0] * LUCKY_COLORS.length)],
    outfit_tag: OUTFIT_TAGS[Math.floor(rng[1] * OUTFIT_TAGS.length)],
    numbers: [
      Math.floor(rng[2] * 9) + 1,
      Math.floor(rng[3] * 9) + 1,
      Math.floor(rng[4] * 9) + 1,
    ].sort((a, b) => a - b),
    tarot_id: TAROT_POOL[Math.floor(rng[5] * TAROT_POOL.length)],
    flower_id: FLOWER_POOL[Math.floor(rng[6] * FLOWER_POOL.length)],
  };

  return {
    current_date: dateStr,
    weather_indicators: {
      status: weather.status,
      label: weather.label,
      desc: weather.desc,
      communication_index: communicationIndex,
      attraction_index: attractionIndex,
      conflict_risk: conflictRisk,
    },
    transit_impact: {
      user_clash: userClash,
      partner_clash: partnerClash,
      synastry_impact: synastryImpact,
    },
    lucky_seeds: luckySeeds,
  };
}

// ── 辅助函数 ──

function getDizhiFromDayMaster(dayMaster) {
  // day_master 格式如 "Geng_Metal"，提取天干对应地支
  const nameMap = {
    'Jia_Metal': '寅', 'Yi_Metal': '卯',
    'Jia_Wood': '寅', 'Yi_Wood': '卯',
    'Bing_Fire': '午', 'Ding_Fire': '巳',
    'Wu_Earth': '辰', 'Ji_Earth': '丑',
    'Geng_Metal': '申', 'Xin_Metal': '酉',
    'Ren_Water': '亥', 'Gui_Water': '子',
  };
  // 也支持纯天干格式
  const tgMap = {
    '甲': '寅', '乙': '卯', '丙': '午', '丁': '巳',
    '戊': '辰', '己': '丑', '庚': '申', '辛': '酉',
    '壬': '亥', '癸': '子',
  };
  return nameMap[dayMaster] || tgMap[dayMaster] || null;
}

function mapWeatherStatus(comm, attr, conflict) {
  // 高冲突 → 雷暴
  if (conflict >= 70) {
    if (attr > 70) return WEATHER_STATUS.THUNDERSTORM; // 激烈冲突+强吸引力=雷暴
    return WEATHER_STATUS.SNOW; // 高冲突+低吸引=冰霜
  }
  // 低沟通+低吸引 → 冰霜
  if (comm < 35 && attr < 40) return WEATHER_STATUS.SNOW;
  // 低沟通 → 雨
  if (comm < 40) return WEATHER_STATUS.RAIN;
  // 高冲突 → 阴
  if (conflict >= 50) return WEATHER_STATUS.CLOUDY;
  // 高沟通+高吸引+低冲突 → 晴
  if (comm >= 70 && attr >= 70 && conflict < 30) return WEATHER_STATUS.CLEAR;
  // 刚经历冲突后恢复 → 彩虹
  if (comm >= 60 && attr >= 60 && conflict >= 30 && conflict < 50) return WEATHER_STATUS.RAINBOW;
  // 中等 → 多云
  if (comm >= 50 && comm < 70) return WEATHER_STATUS.PARTLY_CLOUDY;
  // 默认
  return WEATHER_STATUS.PARTLY_CLOUDY;
}

// ═══════════════════════════════════════════════════
// 从现有合盘数据构建 static_profile
// ═══════════════════════════════════════════════════

function buildStaticProfile(row) {
  // 从 bazi_detail 提取日主
  const dayMasterMatch = row.bazi_detail?.match(/Day[\s_]?Master[：:\s]*([甲乙丙丁戊己庚辛壬癸])/i)
    || row.bazi_detail?.match(/日主[：:\s]*([甲乙丙丁戊己庚辛壬癸])/);
  const userDayMaster = dayMasterMatch?.[1] || '庚';

  const partnerDayMasterMatch = row.bazi_detail?.match(/Pareja[\s_]?Day[\s_]?Master[：:\s]*([甲乙丙丁戊己庚辛壬癸])/i)
    || row.bazi_detail?.match(/对方日主[：:\s]*([甲乙丙丁戊己庚辛壬癸])/);
  const partnerDayMaster = partnerDayMasterMatch?.[1] || '丁';

  // 从 zodiac_detail 提取月亮星座
  const userMoonMatch = row.zodiac_detail?.match(/Moon[：:\s]*(\w+)/i);
  const partnerMoonMatch = row.zodiac_detail?.match(/Partner[\s_]?Moon[：:\s]*(\w+)/i)
    || row.zodiac_detail?.match(/Pareja.*?Moon[：:\s]*(\w+)/i);

  // 从 zodiac_detail 提取太阳星座
  const userSunMatch = row.zodiac_detail?.match(/(?:Signo Solar|Sun Sign|Solar)[^:\n]*[：:\s]*(\w+)/i)
    || row.zodiac_detail?.match(/^.*?(\w+)\s*\(/m);
  const partnerSunMatch = row.zodiac_detail?.match(/Pareja[：:\s]*(\w+)/i)
    || row.zodiac_detail?.match(/Partner[：:\s]*(\w+)/i);

  // 从 iching_detail 提取卦象 ID
  const hexMatch = row.iching_detail?.match(/#(\d+)/);
  const hexagramId = hexMatch ? parseInt(hexMatch[1]) : 31;

  // 从 dob1/dob2 推生肖
  const userZodiac = getZodiacFromYear(row.dob1);
  const partnerZodiac = getZodiacFromYear(row.dob2);

  // 从 dob1 推性别（无法从数据推，用默认）
  return {
    user: {
      gender: 'F',
      day_master: userDayMaster,
      moon_sign: userMoonMatch?.[1] || 'Scorpio',
      zodiac: userZodiac,
    },
    partner: {
      gender: 'M',
      day_master: partnerDayMaster,
      moon_sign: partnerMoonMatch?.[1] || 'Taurus',
      zodiac: partnerZodiac,
    },
    base_synastry: {
      score: row.overall_score || 75,
      hexagram_id: hexagramId,
      relationship_type: row.overall_score >= 80 ? 'Soulmate' : row.overall_score >= 60 ? 'Karmic' : 'Catalyst',
    },
  };
}

function getZodiacFromYear(dob) {
  if (!dob) return 'Snake';
  const year = new Date(dob).getFullYear();
  const zodiacs = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake',
    'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'];
  return zodiacs[(year - 4) % 12];
}

// ═══════════════════════════════════════════════════
// API Handler
// ═══════════════════════════════════════════════════

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { resultId, date } = req.body;
  if (!resultId) {
    return res.status(400).json({ error: 'Missing resultId' });
  }

  try {
    // 1. 查合盘记录
    const records = await sbGet('compatibility_results', `id=eq.${resultId}&select=*`);
    if (!records || records.length === 0) {
      return res.status(404).json({ error: 'Result not found' });
    }
    const record = records[0];

    const today = date || new Date().toISOString().slice(0, 10);

    // 2. 查缓存
    const cached = await sbGet('daily_weather_logs', `result_id=eq.${resultId}&log_date=eq.${today}&select=dynamic_daily`);
    if (cached && cached.length > 0 && cached[0].dynamic_daily) {
      return res.status(200).json({
        dynamic_daily: cached[0].dynamic_daily,
        from_cache: true,
      });
    }

    // 3. 构建 static_profile
    let staticProfile;
    if (record.ai_context?.static_profile) {
      staticProfile = record.ai_context.static_profile;
    } else {
      staticProfile = buildStaticProfile(record);
    }

    // 4. 计算动态气象
    const dynamicDaily = calculateDailyWeather(staticProfile, today);

    // 5. 写入 daily_weather_logs (upsert via POST with merge-duplicates)
    await sbUpsert('daily_weather_logs', {
      result_id: resultId,
      user_id: record.user_id,
      log_date: today,
      dynamic_daily: dynamicDaily,
    });

    // 6. 更新 compatibility_results.ai_context
    const aiContext = record.ai_context || { schema_version: 1 };
    aiContext.static_profile = staticProfile;
    aiContext.dynamic_daily = dynamicDaily;
    await sbPatch('compatibility_results', resultId, { ai_context: aiContext });

    return res.status(200).json({
      dynamic_daily: dynamicDaily,
      from_cache: false,
    });
  } catch (err) {
    console.error('daily-weather error:', err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}
