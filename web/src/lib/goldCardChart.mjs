/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏆 E106（主公军令 2026-10-30 刀一）：金卡干支矩阵 / 格局徽记 / 六爻卦名 纯函数核
 * ═══════════════════════════════════════════════════════════════════════════
 * 病根（主公核验截图①实锤）：E105 金卡把 engines.bazi.detail 原始调试串
 *   （「四柱分析 你： 年柱： 丙 辰 | …」＋「…」物理截断）直通卡面 baziPattern。
 * 治法（军令钦定）：
 *   ① 干支对称矩阵 —— 乾造（你）／坤造（对方）三柱并列（与结果页 engines.bazi
 *      同源口径：client paipan 算法逐行移植，报告显示与金卡恒一致，军令示例
 *      「乾造(你)： 丙辰 己丑 己卯 / 坤造(对方)： 丁丑 辛亥 癸未」即本引擎值）；
 *   ② 居中格局徽记 —— 双盘六支凑整三合局 ⇒ 四局徽记（火/金/水/木），无局兜底；
 *   ③ 六爻卦名卦序 —— 解析 calcIChing detail 首行（唯一真源出口）⇒ 卦序中文数字
 *      （第十三卦）＋六线谱（自底向上），供暗金衬底框六线谱渲染。
 * 🔴 语言纯粹性铁律（E96 沿袭）：非 zh 出参零汉字（vi 走 E102 汉越正统、
 *    th 走 bazi.ts 既有泰语音译、en/fr/es 走拼音）。
 * 🔴 离线铁律：零网络、零 DOM、纯函数（node:test 直接 ESM import 实测）。
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** 天干六语表（bazi.ts TIAN_GAN_NAMES 同源——vi 汉越/ th 音译/ 西欧拼音） */
const STEM_NAMES = {
  zh: ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'],
  en: ['Jia', 'Yi', 'Bing', 'Ding', 'Wu', 'Ji', 'Geng', 'Xin', 'Ren', 'Gui'],
  fr: ['Jia', 'Yi', 'Bing', 'Ding', 'Wu', 'Ji', 'Geng', 'Xin', 'Ren', 'Gui'],
  es: ['Jia', 'Yi', 'Bing', 'Ding', 'Wu', 'Ji', 'Geng', 'Xin', 'Ren', 'Gui'],
  th: ['เจีย', 'อี้', 'ปิง', 'ติง', 'อู๋', 'จี๋', 'เกิง', 'ซิน', 'เหริน', 'กุ้ย'],
  vi: ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'],
};

/** 地支六语表（vi 汉越 Tý Sửu…；th 音译） */
const BRANCH_NAMES = {
  zh: ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'],
  en: ['Zi', 'Chou', 'Yin', 'Mao', 'Chen', 'Si', 'Wu', 'Wei', 'Shen', 'You', 'Xu', 'Hai'],
  fr: ['Zi', 'Chou', 'Yin', 'Mao', 'Chen', 'Si', 'Wu', 'Wei', 'Shen', 'You', 'Xu', 'Hai'],
  es: ['Zi', 'Chou', 'Yin', 'Mao', 'Chen', 'Si', 'Wu', 'Wei', 'Shen', 'You', 'Xu', 'Hai'],
  th: ['จื้อ', 'โฉ่ว', 'อิ่น', 'เหมา', 'เฉิน', 'ซื่อ', 'อู๋', 'เหว่ย์', 'เชิน', 'โย่ว', 'ซวี่', 'ไห่'],
  vi: ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'],
};

/**
 * 干支柱位计算（client bazi.ts paipan 逐行移植——与结果页报告显示恒同口径）。
 * 年柱 (y-4)%10/%12；月支 (mo+1)%12＋五虎遁月干；日柱 1900-01-01 甲戌锚点偏移。
 * @param {string} d1 A 侧生日（YYYY-MM-DD 等宽松格式）
 * @param {string} d2 B 侧生日
 * @returns {{a: [string,string][], b: [string,string][]}|null} 三柱（年/月/日，[天干,地支] 汉字）；解析失败 ⇒ null
 */
export function computeCardPillars(d1, d2) {
  const TG = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const DZ = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  // 五虎遁：年干 ⇒ 寅月天干起（甲己 0 / 乙庚 2 / 丙辛 4 / 丁壬 6 / 戊癸 8）
  const HU_DUN = { '甲': 0, '己': 0, '乙': 2, '庚': 2, '丙': 4, '辛': 4, '丁': 6, '壬': 6, '戊': 8, '癸': 8 };
  const parseYmd = (s) => {
    const m = String(s || '').match(/(\d{4})[-/年.](\d{1,2})[-/月.](\d{1,2})/);
    if (!m) return null;
    const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
    if (y < 1900 || y > 2100 || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    return { y, mo, d };
  };
  const dayStemBranch = (y, mo, d) => {
    // 锚点 1900-01-01 = 甲戌日（甲=0 / 戌=10）——与 bazi.ts dayStemBranch 同源
    const base = Date.UTC(1900, 0, 1);
    const target = Date.UTC(y, mo - 1, d);
    const diff = Math.floor((target - base) / 86400000);
    return [TG[((diff % 10) + 10) % 10], DZ[((diff % 12) + 12) % 12]];
  };
  const paipan = (ymd) => {
    const yStem = (((ymd.y - 4) % 10) + 10) % 10;
    const yBranch = (((ymd.y - 4) % 12) + 12) % 12;
    const mBranch = (ymd.mo + 1) % 12;
    const mStem = ((HU_DUN[TG[yStem]] + mBranch) % 10 + 10) % 10;
    const [dStem, dBranch] = dayStemBranch(ymd.y, ymd.mo, ymd.d);
    return [[TG[yStem], DZ[yBranch]], [TG[mStem], DZ[mBranch]], [dStem, dBranch]];
  };
  const a1 = parseYmd(d1);
  const a2 = parseYmd(d2);
  if (!a1 || !a2) return null;
  return { a: paipan(a1), b: paipan(a2) };
}

/**
 * 干支对称矩阵六语格式化（军令钦定：zh 乾造（你）／坤造（对方））。
 * @param {string} locale 六语码
 * @param {{a: [string,string][], b: [string,string][]}} pillars computeCardPillars 出参
 * @returns {{labelA: string, rowA: string, labelB: string, rowB: string}}
 */
export function formatPillarRows(locale, pillars) {
  const L = {
    zh: { labelA: '乾造（你）', labelB: '坤造（对方）' },
    en: { labelA: 'You (Qian)', labelB: 'Partner (Kun)' },
    fr: { labelA: 'Vous (Qian)', labelB: 'Partenaire (Kun)' },
    es: { labelA: 'Tú (Qian)', labelB: 'Pareja (Kun)' },
    th: { labelA: 'คุณ (เคียน)', labelB: 'คู่ครอง (คุน)' },
    vi: { labelA: 'Bạn (Càn)', labelB: 'Người ấy (Khôn)' },
  };
  const stems = STEM_NAMES[locale] || STEM_NAMES.en;
  const branches = BRANCH_NAMES[locale] || BRANCH_NAMES.en;
  const label = L[locale] || L.en;
  const TG = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const DZ = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  // zh 干支连排（丙辰）；非 zh 干支间留空格（Bing Chen）——军令示例锚定
  const glue = locale === 'zh' ? '' : ' ';
  const row = (side) => pillars[side]
    .map(([g, z]) => `${stems[TG.indexOf(g)]}${glue}${branches[DZ.indexOf(z)]}`)
    .join(' · ');
  return { labelA: label.labelA, labelB: label.labelB, rowA: row('a'), rowB: row('b') };
}

/**
 * 居中格局徽记（双盘六支凑整三合局 ⇒ 四局徽记；无局兜底）。
 * 三合局：申子辰水 / 亥卯未木 / 寅午戌火 / 巳酉丑金（六支全量覆盖判定——
 * 与 server fullSanHe 同语义：A∪B 全部地支里凑齐整组三支）。
 * @param {string} locale 六语码
 * @param {{a: [string,string][], b: [string,string][]}} pillars
 * @returns {{key: 'fire'|'metal'|'water'|'wood'|'none', badge: string}}
 */
export function deriveCardTrine(locale, pillars) {
  const DZ = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const SANHE = [
    { key: 'water', group: ['申', '子', '辰'] },
    { key: 'wood', group: ['亥', '卯', '未'] },
    { key: 'fire', group: ['寅', '午', '戌'] },
    { key: 'metal', group: ['巳', '酉', '丑'] },
  ];
  const BADGES = {
    fire: {
      zh: '炽热与共生 · 八字三合火局', en: 'Flame of Synergy · Fire Trine',
      fr: 'Flamme de Synergie · Trigone de Feu', es: 'Llama de Sinergia · Trígono de Fuego',
      th: 'เปลวไฟแห่งการหลอมรวม · ไตรภาคีธาตุไฟ', vi: 'Ngọn Lửa Cộng Sinh · Tam Hợp Hỏa Cục',
    },
    metal: {
      zh: '沉淀与相守 · 八字三合金局', en: 'Depths of Devotion · Metal Trine',
      fr: 'Profondeur de Dévouement · Trigone de Métal', es: 'Profundidad de Devoción · Trígono de Metal',
      th: 'ความลึกแห่งการผูกพัน · ไตรภาคีธาตุทอง', vi: 'Chiều Sâu Gắn Bó · Tam Hợp Kim Cục',
    },
    water: {
      zh: '流转与相知 · 八字三合水局', en: 'Flow of Understanding · Water Trine',
      fr: 'Flot de Compréhension · Trigone d\u2019Eau', es: 'Flujo de Complicidad · Trígono de Agua',
      th: 'กระแสแห่งความเข้าใจ · ไตรภาคีธาตุน้ำ', vi: 'Dòng Chảy Thấu Hiểu · Tam Hợp Thủy Cục',
    },
    wood: {
      zh: '生长与共荣 · 八字三合木局', en: 'Growth in Unity · Wood Trine',
      fr: 'Croissance Unie · Trigone de Bois', es: 'Crecimiento en Unión · Trígono de Madera',
      th: 'การเติบโตร่วมกัน · ไตรภาคีธาตุไม้', vi: 'Phát Triển Cùng Nhau · Tam Hợp Mộc Cục',
    },
    none: {
      zh: '命盘共鸣 · 五行交辉', en: 'Chart Resonance · Elemental Harmony',
      fr: 'Résonance des Cartes · Harmonie Élémentaire', es: 'Resonancia Astral · Armonía Elemental',
      th: 'เสียงสะท้อนแห่งชะตา · สมดุลธาตุ', vi: 'Cộng Hưởng Mệnh Bàn · Ngũ Hành Hòa Hợp',
    },
  };
  const all = [...pillars.a, ...pillars.b].map((p) => p[1]);
  const hit = SANHE.find((t) => t.group.every((b) => all.includes(b)));
  const key = hit ? hit.key : 'none';
  const table = BADGES[key];
  return { key, badge: table[locale] || table.en };
}

/** 八卦符 ⇒ 卦键（☰☱☲☳☴☵☶☷ → QIAN/DUI/LI/ZHEN/XUN/KAN/GEN/KUN） */
const TRIGRAM_KEYS = { '☰': 'QIAN', '☱': 'DUI', '☲': 'LI', '☳': 'ZHEN', '☴': 'XUN', '☵': 'KAN', '☶': 'GEN', '☷': 'KUN' };

/**
 * 六爻卦名解析（calcIChing detail 首行唯一真源出口——六语皆可解析）。
 * 规约首行（zh）：`【本卦】 第13卦 — 天火同人 ☰☲`；
 * 规约首行（en）：`[Primary Hex] Hexagram 13 — Fellowship with Men ☰☲`。
 * ⚠️ symbol 约定＝上卦在前/下卦在后（HEXAGRAMS 数据实测：13 同人 ☰☲＝上乾下离）。
 * @param {string|null|undefined} detail engines.iching.detail 文本
 * @returns {{ordinal: string, name: string, upper: string, lower: string}|null}
 */
export function parseIchingHeadline(detail) {
  const line = String(detail == null ? '' : detail).split('\n')[0] || '';
  if (!line) return null;
  const m = line.match(/^(?:【[^】]*】|\[[^\]]*\])\s*(.+?)\s*[—–-]\s*(.+?)\s*([☰☱☲☳☴☵☶☷])\s*([☰☱☲☳☴☵☶☷])\s*$/);
  if (!m) return null;
  const upper = TRIGRAM_KEYS[m[3]];
  const lower = TRIGRAM_KEYS[m[4]];
  if (!upper || !lower) return null;
  return { ordinal: m[1].trim(), name: m[2].trim(), upper, lower };
}

/** 中文数字（1~99 卦序位转换：13 ⇒ 十三） */
function zhNumeral(n) {
  const DIGITS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  const num = Number(n);
  if (!Number.isInteger(num) || num < 1 || num > 99) return String(num);
  if (num < 10) return DIGITS[num];
  const tens = Math.floor(num / 10);
  const ones = num % 10;
  const tensStr = tens === 1 ? '' : DIGITS[tens];
  return tensStr + '十' + (ones ? DIGITS[ones] : '');
}

/**
 * 卦名卦序卡片标签（军令钦定 zh 格式：天火同人 · 第十三卦）。
 * @param {string} locale 六语码
 * @param {{ordinal: string, name: string, upper?: string, lower?: string}} headline parseIchingHeadline 出参
 * @returns {string}
 */
export function composeHexCardLabel(locale, headline) {
  if (!headline || !headline.name) return '';
  if (locale === 'zh') {
    const m = String(headline.ordinal || '').match(/第(\d+)卦/);
    if (m) return `${headline.name} · 第${zhNumeral(Number(m[1]))}卦`;
    return `${headline.name} · ${headline.ordinal}`;
  }
  return `${headline.ordinal} · ${headline.name}`;
}

/** 八卦键 ⇒ 三线谱（自底向上：☰[1,1,1] ☱[1,1,0] ☲[1,0,1] ☳[1,0,0] ☴[0,1,1] ☵[0,1,0] ☶[0,0,1] ☷[0,0,0]） */
const TRIGRAM_LINES = {
  QIAN: [1, 1, 1], DUI: [1, 1, 0], LI: [1, 0, 1], ZHEN: [1, 0, 0],
  XUN: [0, 1, 1], KAN: [0, 1, 0], GEN: [0, 0, 1], KUN: [0, 0, 0],
};

/**
 * 六爻全卦线谱（自底向上 6 位；lower 下卦三位在前 + upper 上卦三位在后）。
 * @param {string} lower 下卦键
 * @param {string} upper 上卦键
 * @returns {number[]|null} 6 位 0/1 数组；非法键 fail-closed ⇒ null
 */
export function hexLinePattern(lower, upper) {
  const lo = TRIGRAM_LINES[lower];
  const up = TRIGRAM_LINES[upper];
  if (!lo || !up) return null;
  return [...lo, ...up];
}
