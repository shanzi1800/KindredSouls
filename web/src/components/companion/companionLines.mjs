/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🐾 E105（主公军令 2026-10-30 刀一）：灵宠伴读台词引擎（本地规则匹配 · 离线）
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 零异步延迟铁律：台词全部由客户端从金句库（≡ metaphysicsTruthTable 口径）
 *    结合命盘 AST（牌名/五行局/相位主题）做本地规则匹配直出——响应耗时 < 16ms，
 *    严禁发起远程 LLM 异步请求（闸门 ⑤-3 断言锁定）。
 * 匹配规则：cardId 4 正位→emperor 主题；cardId 2 正位→high_priestess 主题；
 *    其余（含逆位/缺数据）→ fire_trine 三合火局主题。
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { GOLD_CARD_QUOTES } from '../../lib/goldCardQuotes.mjs';

/** AWAKEN 首句定调台词（报告挂载完成后 300ms 触发） */
const AWAKEN = Object.freeze({
  zh: '双宠伴读就位：盘龙守右、白狐伴左，命盘真值随卷共读。',
  en: 'Companions ready: the dragon keeps the right, the fox the left — truth rides with your scroll.',
  fr: "Compagnons en place : le dragon à droite, la renarde à gauche — la vérité accompagne votre lecture.",
  es: 'Compañeros listos: el dragón a la derecha, la zorra a la izquierda — la verdad acompaña tu lectura.',
  th: 'สหายพร้อมแล้ว มังกรเฝ้าขวา จิ้งจอกเฝ้าซ้าย ความจริงอยู่กับทุกบรรทัดที่คุณอ่าน',
  vi: 'Bạn đồng hành đã sẵn sàng: rồng canh phải, cáo canh trái — chân lý theo từng dòng bạn đọc.',
});

/** RESONATING 塔罗共鸣点拨（{card}＝六语牌名，{theme}＝决策树主题） */
const RESONATE_TAROT = Object.freeze({
  zh: '「{card}」正映照此刻共鸣——{theme}，正是你们的引力所在。',
  en: '"{card}" mirrors this moment — {theme} is your gravity.',
  fr: '« {card} » reflète cet instant — {theme} est votre gravité.',
  es: '«{card}» refleja este instante — {theme} es su gravedad.',
  th: '"{card}" สะท้อนช่วงเวลานี้ — {theme} คือแรงดึงดูดของคุณ',
  vi: '"{card}" phản chiếu khoảnh khắc này — {theme} chính là lực hút của bạn.',
});

/** RESONATING 八字局共鸣点拨（IO 监听八字局锚点进入视口 60%） */
const RESONATE_BAZI = Object.freeze({
  zh: '八字局正在此处显影——五行流转，你们的命轨同频共振。',
  en: 'The BaZi pattern is developing here — five phases flow, your destinies resonate.',
  fr: "Le schéma BaZi se révèle ici — les cinq phases s'écoulent, vos destins résonnent.",
  es: 'El patrón BaZi se revela aquí — cinco fases fluyen, sus destinos resuenan.',
  th: 'ดวงแปดอักษรกำลังปรากฏ ณ ที่นี้ ธาตุทั้งห้าหมุนเวียน ชะตาสองคุณสั่นพร้อมกัน',
  vi: 'Lá số Bát Tự hiện hình nơi đây — ngũ hành lưu chuyển, hai mệnh đồng điệu.',
});

/** EXPANDED 主动唤起长台词（点击灵宠） */
const EXPANDED_LINE = Object.freeze({
  zh: '我在这里。塔罗的牌面、八字的三合、每一行真值——想问什么，随时点我。',
  en: 'I am here. The tarot faces, the trine of BaZi, every line of truth — tap me whenever you wonder.',
  fr: "Je suis là. Les faces du tarot, la trine du BaZi, chaque ligne de vérité — touchez-moi quand vous voulez.",
  es: 'Estoy aquí. Las caras del tarot, la trina del BaZi, cada línea de verdad — tócame cuando quieras.',
  th: 'ฉันอยู่ที่นี่ ใบหน้าไพ่ทาโรต์ สามัคคีของดวงแปดอักษร ทุกบรรทัดของความจริง แตะฉันได้ทุกเมื่อ',
  vi: 'Tôi ở đây. Mặt bài Tarot, tam hợp Bát Tự, từng dòng chân lý — chạm tôi bất cứ lúc nào.',
});

const pickLocale = (locale) => (AWAKEN[locale] ? locale : 'en');

/** 命盘 AST → 塔罗原型主题（与金卡决策树同源） */
function archetypeOf(cardId, isReversed) {
  if (cardId != null && !isReversed) {
    if (cardId === GOLD_CARD_QUOTES.emperor.cardId) return 'emperor';
    if (cardId === GOLD_CARD_QUOTES.high_priestess.cardId) return 'high_priestess';
  }
  return 'fire_trine';
}

/**
 * 伴读台词本地规则匹配（零异步 · < 16ms）。
 * @param {{cardId?: number|null, isReversed?: boolean, tarotName?: string, stage: string}} ast
 * @param {string} locale 六语码
 * @param {'tarot'|'bazi'} [anchorKind] 共鸣锚点类型（RESONATING 用）
 * @returns {string} 台词（六语真值）
 */
export function pickCompanionLine(ast, locale, anchorKind) {
  const l = pickLocale(locale);
  const cardId = ast && ast.cardId != null ? ast.cardId : null;
  const isReversed = !!(ast && ast.isReversed);
  const stage = ast && ast.stage ? ast.stage : 'AWAKEN';
  if (stage === 'AWAKEN') return AWAKEN[l];
  if (stage === 'EXPANDED') return EXPANDED_LINE[l];
  if (stage === 'RESONATING') {
    const theme = GOLD_CARD_QUOTES[archetypeOf(cardId, isReversed)].theme[l];
    if (anchorKind === 'bazi') return RESONATE_BAZI[l];
    const card = (ast && ast.tarotName) || '';
    return RESONATE_TAROT[l].replace('{card}', card).replace('{theme}', theme);
  }
  return AWAKEN[l];
}

/** 伴读共鸣锚点台词（IO 命中时按锚点类型分流） */
export function companionAnchorLine(ast, locale, anchorKind) {
  return pickCompanionLine({ ...ast, stage: 'RESONATING' }, locale, anchorKind);
}
