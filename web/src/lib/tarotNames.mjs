/**
 * tarotNames.mjs —— 22 张大阿卡纳牌名六语单源（E114-刀一 · 主公军令 2026-11-01）
 * ═══════════════════════════════════════════════════════════════════════════
 * 军令起因：E113 首语把《恋人》写死进六语模板（主公实机验收实锤「报告抽的
 * 是《愚人》，Sophia 念的却是《恋人》」，军令 E114 刀一钦定物理拔除）。
 * 模板一律占位符 {{tarotCard}}/{{trinePattern}}，牌名由运行时按报告真值 id
 * 查本表注入——22 张大牌（愚人/恋人/隐士/世界…）全支持，禁任何硬编码逃逸。
 *
 * 🔴 单源铁律：本表自 E114 起是全仓 22×6 牌名**唯一真源**——tarot.ts
 * （getTarot/getWealthTarot 出口）与首语插值（greetingTruth.mjs）共用；
 * 任何位置复制此表即违规（e100/e103/e104 闸门读源点已随后继化至此）。
 *
 * 🔴 纯逻辑核：禁 i18n / DOM / fetch；node:test 直读行为级闸门守备
 * （E113 dailyChatSession S4 先例模式）。紧凑字面量格式与原 tarot.ts 逐字
 * 同款（含单引号转义形态），闸门正则抽取零适配成本。
 */

/** 22 张大阿卡纳六语牌名表（id 序与 tarot.ts CARDS / goldCardTotems 同源 0~21） */
export const TAROT_CARD_NAMES = [
  {id:0, name:{zh:'愚人',en:'The Fool',es:'El Loco',fr:'Le Fou',th:'คนโง่ประหลาด',vi:'Chàng Khờ'}},
  {id:1, name:{zh:'魔术师',en:'The Magician',es:'El Mago',fr:'Le Bateleur',th:'นักมายกล',vi:'Nhà Ảo Thuật'}},
  {id:2, name:{zh:'女祭司',en:'The High Priestess',es:'La Gran Sacerdotisa',fr:'La Grande Prêtresse',th:'ไพ่นักบวชหญิง',vi:'Nữ Đại Tư Tế'}},
  {id:3, name:{zh:'女皇',en:'The Empress',es:'La Emperatriz',fr:'L\'Impératrice',th:'จักรพรรดินี',vi:'Nữ Hoàng'}},
  {id:4, name:{zh:'皇帝',en:'The Emperor',es:'El Emperador',fr:'L\'Empereur',th:'จักรพรรดิ',vi:'Hoàng Đế'}},
  {id:5, name:{zh:'教皇',en:'The Hierophant',es:'El Sumo Sacerdote',fr:'Le Pape',th:'ประมุขสงฆ์',vi:'Giáo Hoàng'}},
  {id:6, name:{zh:'恋人',en:'The Lovers',es:'Los Enamorados',fr:'Les Amoureux',th:'คู่รัก',vi:'Tình Nhân'}},
  {id:7, name:{zh:'战车',en:'The Chariot',es:'El Carro',fr:'Le Chariot',th:'รถศึก',vi:'Cỗ Xe Chiến Thắng'}},
  {id:8, name:{zh:'力量',en:'The Strength',es:'La Fuerza',fr:'La Force',th:'พละกำลัง',vi:'Sức Mạnh'}},
  {id:9, name:{zh:'隐士',en:'The Hermit',es:'El Ermitaño',fr:'L\'Ermite',th:'นักบวชเรี่ยมใจ',vi:'Ẩn Sĩ'}},
  {id:10, name:{zh:'命运之轮',en:'Wheel of Fortune',es:'Rueda de la Fortuna',fr:'Roue de Fortune',th:'วงล้อแห่งโชคชะตา',vi:'Bánh Xe Số Phận'}},
  {id:11, name:{zh:'正义',en:'Justice',es:'La Justicia',fr:'La Justice',th:'ความยุติธรรม',vi:'Công Lý'}},
  {id:12, name:{zh:'倒吊人',en:'The Hanged Man',es:'El Colgado',fr:'Le Pendu',th:'คนแขวนหัว',vi:'Kẻ Treo Ngược'}},
  {id:13, name:{zh:'死神',en:'Death',es:'La Muerte',fr:'La Mort',th:'เจ้าแห่งความตาย',vi:'Cái Chết'}},
  {id:14, name:{zh:'节制',en:'Temperance',es:'La Templanza',fr:'Tempérance',th:'ความสมดุล',vi:'Chừng Mực'}},
  {id:15, name:{zh:'恶魔',en:'The Devil',es:'El Diablo',fr:'Le Diable',th:'ปีศาจ',vi:'Ác Quỷ'}},
  {id:16, name:{zh:'塔',en:'The Tower',es:'La Torre',fr:'La Tour',th:'หอคอย',vi:'Tháp'}},
  {id:17, name:{zh:'星星',en:'The Star',es:'La Estrella',fr:'L\'Étoile',th:'ดาว',vi:'Ngôi Sao'}},
  {id:18, name:{zh:'月亮',en:'The Moon',es:'La Luna',fr:'La Lune',th:'ดวงจันทร์',vi:'Mặt Trăng'}},
  {id:19, name:{zh:'太阳',en:'The Sun',es:'El Sol',fr:'Le Soleil',th:'ดวงอาทิตย์',vi:'Mặt Trời'}},
  {id:20, name:{zh:'审判',en:'Judgement',es:'El Juicio',fr:'Le Jugement',th:'การพิพากษา',vi:'Phán Xét'}},
  {id:21, name:{zh:'世界',en:'The World',es:'El Mundo',fr:'Le Monde',th:'โลก',vi:'Thế Giới'}},
];

const LANGS = ['zh', 'en', 'es', 'fr', 'th', 'vi'];

/**
 * 按 id 查六语牌名（fail-closed）：
 * 合法 id（0~21 整数）⇒ 对应语言牌名（语言缺 ⇒ en 兜底）；
 * 非法/缺失 ⇒ null——消费端走中性词，**绝不臆造具体牌名**（E109「隐士
 * 幽灵」血训：无真值时写死回退牌名＝同一病灶复发，军令钦定禁回潮）。
 */
export function tarotCardName(id, lang) {
  // 🔴 null/undefined 先行拦截：Number(null)===0 会穿透成「愚人」（E114 闸门
  //    行为级实锤）——无真值必须返回 null 走中性词，绝不臆造具体牌名。
  if (id === null || id === undefined) return null;
  const n = Number(id);
  if (!Number.isInteger(n) || n < 0 || n > 21) return null;
  const row = TAROT_CARD_NAMES[n];
  if (!row) return null;
  const L = (LANGS.indexOf(String(lang)) >= 0) ? String(lang) : 'en';
  return String(row.name[L] || row.name.en || '');
}
