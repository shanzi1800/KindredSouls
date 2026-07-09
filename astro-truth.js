// astro-truth.js — 后端天文真值引擎（治本：所有宫位/太阳星座由后端算死，AI 只准抄录）
// ESM module. 与 server.js 同项目（type:module）。
//
// 设计原则（军师裁决）：
// 1. 等宫制(Equal House)严格计算：上升星座=1宫，依次+1。
// 2. 流月太阳星座 = 天文事实（每月代表太阳星座，基于切换日近似，忽略闰年微小偏差）。
// 3. 外行星年度主题 = 固定天文事实（2026-2027：木星狮子 / 土星白羊 / 冥王水瓶）。
// 4. 所有真值后端算好，注入 prompt 硬锁，AI 不得自行推算。

// 12 星座顺序（白羊=0 ... 双鱼=11）
export const SIGN_ORDER_ZH = ['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'];
export const SIGN_ORDER_EN = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

// EN 全名 → ZH 全名（astroMatrix.meta.rising_sign 返回英文，如 'Capricorn'）
const SIGN_EN_TO_ZH = {};
SIGN_ORDER_EN.forEach((en, i) => { SIGN_EN_TO_ZH[en] = SIGN_ORDER_ZH[i]; });

// 归一化上升星座为 SIGN_ORDER_ZH 中文全名（兼容 EN 全名 / 中文短名 / 大小写 / null）
// 返回 'Cancer' 作为兜底（未知时按巨蟹上升算，绝不让 houseMap 为 null 导致 500）
export function normalizeRisingSign(rising) {
  if (!rising) return 'Cancer';
  const r = String(rising).trim();
  if (SIGN_ORDER_ZH.includes(r)) return r;                       // 已是中文全名
  if (SIGN_EN_TO_ZH[r]) return SIGN_EN_TO_ZH[r];                 // EN 全名
  const rShort = r.replace('座', '');                            // 中文短名 '摩羯'
  const zhShort = SIGN_ORDER_ZH.find(z => z.replace('座', '') === rShort);
  if (zhShort) return zhShort;
  const enLower = r.toLowerCase();                              // EN 小写 / 前缀
  const enIdx = SIGN_ORDER_EN.findIndex(e => e.toLowerCase() === enLower || e.toLowerCase().startsWith(enLower));
  if (enIdx >= 0) return SIGN_ORDER_ZH[enIdx];
  return 'Cancer';
}

// 每月代表太阳星座 index（用每月15日近似；index 0=1月 ... 11=12月）
// 1月=摩羯(9) 2月=水瓶(10) 3月=双鱼(11) 4月=白羊(0) 5月=金牛(1) 6月=双子(2)
// 7月=巨蟹(3) 8月=狮子(4) 9月=处女(5) 10月=天秤(6) 11月=天蝎(7) 12月=射手(8)
const MONTH_REP_SUNSIGN = [9, 10, 11, 0, 1, 2, 3, 4, 5, 6, 7, 8];

// 12 星座原型字典（防夺舍：AI 描写某星座必须用此描述，不得张冠李戴）
// zh 完整（考核语言），en 完整，es/fr/th/vi fallback 到 en 内容（后续可补译）
export const SIGN_ARCHETYPE = {
  zh: {
    '白羊座':'开拓、勇猛、行动力、领导力、冲动',
    '金牛座':'稳定、务实、感官、财富积累、固执',
    '双子座':'灵活多变、信息处理、沟通连接、好奇心、多重任务',
    '巨蟹座':'情感、家庭、保护、直觉、滋养',
    '狮子座':'荣耀、创造、领袖气质、自信、戏剧性',
    '处女座':'分析、完美主义、服务、细节、优化',
    '天秤座':'平衡、关系、美学、和谐、公正',
    '天蝎座':'深度、转化、权力、神秘、洞察',
    '射手座':'探索、自由、哲学、扩张、乐观',
    '摩羯座':'结构、纪律、成就、责任、权威',
    '水瓶座':'革新、独立、群体、未来视野、理性',
    '双鱼座':'灵性、直觉、艺术、模糊混沌、共情、梦境',
  },
  en: {
    'Aries':'pioneering, brave, action, leadership, impulsive',
    'Taurus':'stable, grounded, sensory, wealth-building, stubborn',
    'Gemini':'adaptable, information-processing, communication, curiosity, multi-tasking',
    'Cancer':'emotional, family, protection, intuition, nurturing',
    'Leo':'glory, creativity, leadership, confidence, dramatic',
    'Virgo':'analytical, perfectionist, service, detail, optimization',
    'Libra':'balance, relationships, aesthetics, harmony, fairness',
    'Scorpio':'depth, transformation, power, mystery, insight',
    'Sagittarius':'exploration, freedom, philosophy, expansion, optimism',
    'Capricorn':'structure, discipline, achievement, responsibility, authority',
    'Aquarius':'innovation, independence, community, future-vision, rational',
    'Pisces':'spiritual, intuitive, artistic,模糊 chaos, empathetic, dreamy',
  },
};

// 上升星座 → 星座→宫位映射（Equal House 等宫制）
// 返回 { signIndex(0-11): house(1-12) }
export function getSignToHouseMap(risingSign) {
  const zh = normalizeRisingSign(risingSign);
  const risingIdx = SIGN_ORDER_ZH.indexOf(zh);
  if (risingIdx < 0) return null;
  const map = {};
  for (let i = 0; i < 12; i++) {
    map[i] = ((i - risingIdx) % 12 + 12) % 12 + 1;
  }
  return map;
}

// 月份(1-12) → 太阳星座 index
export function getSunSignIndexForMonth(month) {
  return MONTH_REP_SUNSIGN[((month - 1) % 12 + 12) % 12];
}

// 生成 12 个月流月真值表（从当前月起到次年同月前），返回 { months, truthText }
// startYear/startMonth 可覆盖（默认当前年月）
export function buildMonthlyTruth(risingSignZH, lang = 'zh', startYear, startMonth) {
  const now = new Date();
  const sy = startYear || now.getFullYear();
  const sm = startMonth || (now.getMonth() + 1);
  const houseMap = getSignToHouseMap(risingSignZH);
  if (!houseMap) return { months: [], truthText: '' };
  const monthNamesZH = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  const months = [];
  for (let i = 0; i < 12; i++) {
    const m = ((sm - 1 + i) % 12) + 1;
    const y = sy + Math.floor((sm - 1 + i) / 12);
    const sunIdx = getSunSignIndexForMonth(m);
    months.push({
      label: `${y}年${monthNamesZH[m - 1]}`,
      sunSignZH: SIGN_ORDER_ZH[sunIdx],
      sunHouse: houseMap[sunIdx],
    });
  }
  const truthText = months
    .map((mo) => `• ${mo.label}：太阳在${mo.sunSignZH}第${mo.sunHouse}宫`)
    .join('\n');
  return { months, truthText };
}

// 外行星年度主题（2026-2027 固定天文事实）：木星狮子 / 土星白羊 / 冥王水瓶
// 返回 { jupiter:{signZH,house}, saturn:{...}, pluto:{...} }，house 按上升星座算
export function getOuterPlanetsTruth(risingSignZH) {
  const houseMap = getSignToHouseMap(risingSignZH);
  if (!houseMap) return null;
  const idx = (zh) => SIGN_ORDER_ZH.indexOf(zh);
  return {
    jupiter: { signZH: '狮子座', house: houseMap[idx('狮子座')] },
    saturn:  { signZH: '白羊座', house: houseMap[idx('白羊座')] },
    pluto:   { signZH: '水瓶座', house: houseMap[idx('水瓶座')] },
  };
}

// 构造完整 truth 对象（供 Validator 使用）
export function buildAstroTruth(birthDate, risingSignZH, lang = 'zh', startYear, startMonth) {
  const monthly = buildMonthlyTruth(risingSignZH, lang, startYear, startMonth);
  const outer = getOuterPlanetsTruth(risingSignZH);
  return {
    risingSignZH,
    months: monthly.months,
    monthlyTruthText: monthly.truthText,
    outerPlanets: outer,
  };
}
