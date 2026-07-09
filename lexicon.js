/**
 * lexicon.js — 占星专有名词多语言映射表
 * 纯 JavaScript（无 TypeScript 语法）
 * 用于 server.js 的行星/星座名本地化
 */

// ── 星座名 ──────────────────────────────────────────────────────────────────
const SIGNS = {
  Aries: { zh:'白羊座', en:'Aries', es:'Aries', fr:'Bélier', th:'เมษ', vi:'Bạch Dương' },
  Taurus: { zh:'金牛座', en:'Taurus', es:'Tauro', fr:'Taureau', th:'พฤษภ', vi:'Kim Ngưu' },
  Gemini: { zh:'双子座', en:'Gemini', es:'Géminis', fr:'Gémeaux', th:'มิถุน', vi:'Song Tử' },
  Cancer: { zh:'巨蟹座', en:'Cancer', es:'Cáncer', fr:'Cancer', th:'กรกฏ', vi:'Cự Giải' },
  Leo: { zh:'狮子座', en:'Leo', es:'Leo', fr:'Lion', th:'สิงห์', vi:'Sư Tử' },
  Virgo: { zh:'处女座', en:'Virgo', es:'Virgo', fr:'Vierge', th:'กันยา', vi:'Xử Nữ' },
  Libra: { zh:'天秤座', en:'Libra', es:'Libra', fr:'Balance', th:'ตุลย์', vi:'Thiên Bình' },
  Scorpio: { zh:'天蝎座', en:'Scorpio', es:'Escorpio', fr:'Scorpion', th:'พิจิก', vi:'Bọ Cạp' },
  Sagittarius: { zh:'射手座', en:'Sagittarius', es:'Sagitario', fr:'Sagittaire', th:'ธนู', vi:'Nhân Mã' },
  Capricorn: { zh:'摩羯座', en:'Capricorn', es:'Capricornio', fr:'Capricorne', th:'มังกร', vi:'Ma Kết' },
  Aquarius: { zh:'水瓶座', en:'Aquarius', es:'Acuario', fr:'Verseau', th:'กุมภ์', vi:'Bảo Bình' },
  Pisces: { zh:'双鱼座', en:'Pisces', es:'Piscis', fr:'Poissons', th:'มีน', vi:'Song Ngư' },
};

// ── 宫位名 ────────────────────────────────────────────────────────────────────
const HOUSES_ZH = {
  1:'第一宫', 2:'第二宫', 3:'第三宫', 4:'第四宫',
  5:'第五宫', 6:'第六宫', 7:'第七宫', 8:'第八宫',
  9:'第九宫', 10:'第十宫', 11:'第十一宫', 12:'第十二宫',
};
const HOUSES_VI = {
  1:'Nhà 1', 2:'Nhà 2', 3:'Nhà 3', 4:'Nhà 4',
  5:'Nhà 5', 6:'Nhà 6', 7:'Nhà 7', 8:'Nhà 8',
  9:'Nhà 9', 10:'Nhà 10', 11:'Nhà 11', 12:'Nhà 12',
};
const HOUSES_TH = {
  1:'เรือนที่ 1', 2:'เรือนที่ 2', 3:'เรือนที่ 3', 4:'เรือนที่ 4',
  5:'เรือนที่ 5', 6:'เรือนที่ 6', 7:'เรือนที่ 7', 8:'เรือนที่ 8',
  9:'เรือนที่ 9', 10:'เรือนที่ 10', 11:'เรือนที่ 11', 12:'เรือนที่ 12',
};
const HOUSES_ES = {
  1:'Casa 1', 2:'Casa 2', 3:'Casa 3', 4:'Casa 4',
  5:'Casa 5', 6:'Casa 6', 7:'Casa 7', 8:'Casa 8',
  9:'Casa 9', 10:'Casa 10', 11:'Casa 11', 12:'Casa 12',
};
const HOUSES_FR = {
  1:'Maison 1', 2:'Maison 2', 3:'Maison 3', 4:'Maison 4',
  5:'Maison 5', 6:'Maison 6', 7:'Maison 7', 8:'Maison 8',
  9:'Maison 9', 10:'Maison 10', 11:'Maison 11', 12:'Maison 12',
};
const HOUSES_EN = {
  1:'House 1', 2:'House 2', 3:'House 3', 4:'House 4',
  5:'House 5', 6:'House 6', 7:'House 7', 8:'House 8',
  9:'House 9', 10:'House 10', 11:'House 11', 12:'House 12',
};

// ── 整体导出 ────────────────────────────────────────────────────────────────
export const LEXICON = {
  en: { signs: SIGNS, houses: HOUSES_EN },
  zh: { signs: SIGNS, houses: HOUSES_ZH },
  es: { signs: SIGNS, houses: HOUSES_ES },
  fr: { signs: SIGNS, houses: HOUSES_FR },
  th: { signs: SIGNS, houses: HOUSES_TH },
  vi: { signs: SIGNS, houses: HOUSES_VI },
};
