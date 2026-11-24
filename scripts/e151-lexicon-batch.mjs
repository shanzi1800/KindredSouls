/* E151-刀二：品牌词库六语换血批刷（军令定稿表逐字）
 * 目标面：locales/*.json（input.title/subtitle/start＋familiar.chatQ1/Q3＋新键 privacyNote/clearDataBtn/clearDataConfirm）
 *        ＋引擎镜像 WEALTH_CHATQ1_TEXTS / WELLNESS_CHATQ3_TEXTS ＋server.js E148 指路句
 *        ＋测试后继化 e135（pills 字面）/ e148（指路句断言）
 * 铁律 4：纯字符串精确替换（勿正则）；批刷后独立复核目标值形态。 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(p, 'utf8');
const write = (p, s) => writeFileSync(p, s);
let hits = 0;
const sub = (p, pairs) => {
  let s = read(p);
  for (const [from, to] of pairs) {
    const n = s.split(from).length - 1;
    if (n !== 1) throw new Error(`[${p}] 锚非唯一(${n}): ${from.slice(0, 60)}`);
    s = s.split(from).join(to);
    hits += 1;
  }
  write(p, s);
};

/* ── 军令定稿表（6 语逐字）── */
const HERO = {
  zh: '何时何地，一见如故', en: 'Born When. Born Where. Known Everywhere.',
  fr: 'Votre instant, votre lieu : une âme familière', es: 'Tu instante, tu lugar: un alma afín',
  th: 'กาลเวลาและถิ่นกำเนิด สัมผัสใจดั่งคุ้นเคย', vi: 'Khắc Sinh, Nơi Đến — Vừa Gặp Đã Thân Quen',
};
const SUBTITLE = {
  zh: '用你的出生坐标，定位幸福的方位', en: 'Your birth coordinates, mapped to lasting fulfillment',
  fr: 'Vos coordonnées natales, boussole de votre équilibre', es: 'Tus coordenadas natales, brújula de tu plenitud',
  th: 'ถอดรหัสพิกัดกำเนิด สู่ทิศทางแห่งความสุขที่ใช่', vi: 'Từ tọa độ khắc sinh, định vị phương hướng hạnh phúc',
};
const CTA = {
  zh: '定位我的坐标', en: 'Locate My Coordinates', fr: 'Tracer mes coordonnées',
  es: 'Trazar mis coordenadas', th: 'ค้นหาพิกัดของฉัน', vi: 'Định Vị Tọa Độ Của Tôi',
};
const Q1 = {
  zh: '💰 今日财富节奏校准', en: "💰 Today's Wealth Rhythm", fr: '💰 Rythme financier du jour',
  es: '💰 Ritmo de abundancia de hoy', th: '💰 ปรับจังหวะการเงินวันนี้', vi: '💰 Hiệu Chỉnh Nhịp Tài Lộc Hôm Nay',
};
const Q3 = {
  zh: '🔮 今日坐标与心境校准', en: "🔮 Today's Coordinate Alignment", fr: '🔮 Alignement du jour',
  es: '🔮 Calibración astral de hoy', th: '🔮 ปรับพิกัดและใจวันนี้', vi: '🔮 Hiệu Chỉnh Tọa Độ & Tâm Cảnh Hôm Nay',
};
const PRIVACY = {
  zh: '出生时间与地点仅用于生成个人坐标，加密存储、随时可一键清除，不用于广告画像。',
  en: 'Birth details are encrypted solely to map your coordinates—never for ad profiling, and erasable in one click.',
  fr: 'Vos données natales sont chiffrées uniquement pour vos coordonnées, sans ciblage publicitaire, et effaçables en un clic.',
  es: 'Tus datos natales se cifran solo para tus coordenadas, nunca para publicidad, y puedes borrarlos en un clic.',
  th: 'ข้อมูลวันเกิดถูกเข้ารหัสเพื่อสร้างพิกัดส่วนตัวเท่านั้น ไม่ใช้เพื่อการโฆษณา และลบได้ในคลิกเดียว',
  vi: 'Thông tin giờ và nơi sinh chỉ mã hóa để lập tọa độ cá nhân, không phục vụ quảng cáo và có thể xóa chỉ bằng một chạm.',
};
const CLEAR_BTN = {
  zh: '一键清除我的生辰坐标与本地档案', en: 'Clear My Birth Data & Local Records',
  fr: 'Effacer mes données natales et archives locales', es: 'Borrar mis datos natales y archivos locales',
  th: 'ล้างข้อมูลกำเนิดและแฟ้มในเครื่องของฉัน', vi: 'Xóa dữ liệu khắc sinh và hồ sơ cục bộ của tôi',
};
const CLEAR_CONFIRM = {
  zh: '确认清除？本地生辰坐标、灵宠档案与对话记忆将一并移除，且无法恢复。',
  en: 'Clear now? Birth coordinates, companion records and chat memory will be removed permanently.',
  fr: 'Effacer maintenant ? Coordonnées natales, compagnon et mémoire de conversation seront supprimés définitivement.',
  es: '¿Borrar ahora? Coordenadas natales, compañero y memoria de chat se eliminarán para siempre.',
  th: 'ล้างตอนนี้? พิกัดกำเนิด ข้อมูลคู่ใจ และความจำบทสนทนาจะถูกลบถาวร',
  vi: 'Xóa ngay? Tọa độ khắc sinh, hồ sơ linh thú và ký ức trò chuyện sẽ bị xóa vĩnh viễn.',
};

/* ── ① 六语 locales 批刷（title/subtitle/start/chatQ1/chatQ3＋新键注入 start 行后）── */
const LOCALES = join(ROOT, 'web/src/i18n/locales');
const OLD_TITLE = {
  zh: '缘分天定', en: 'Fate Written in the Stars', fr: 'Votre destinée écrite dans les étoiles',
  es: 'Tu destino escrito en las estrellas', th: 'ดวงดาวเผยความลับของหัวใจ', vi: 'Vận mệnh an bài trên ngàn tinh tú',
};
const OLD_SUB = {
  zh: '输入双方生日，测算缘分指数', en: 'Enter both birth dates to reveal your compatibility',
  fr: 'Saisissez vos deux dates de naissance pour dévoiler votre alchimie céleste',
  es: 'Introduce ambas fechas de nacimiento para revelar tu compatibilidad sagrada',
  th: 'ใส่วันเกิดของคุณและเขา เพื่อเปิดเผยดวงสมพงษ์',
  vi: 'Điền ngày sinh của cả hai để giải mã duyên phận thiên định',
};
const OLD_START = { zh: '开始测算', en: 'Start', fr: 'Commencer', es: 'Comenzar', th: 'เริ่มต้น', vi: 'Bắt đầu' };
const OLD_Q1 = {
  zh: '💰 今日财运与破财避坑', en: "💰 Today's Wealth & Pitfall Guide", fr: '💰 Fortune & Pièges Financiers du Jour',
  es: '💰 Fortuna de Hoy y Trampas Financieras', th: '💰 โชคลาภวันนี้และจุดระวังเสียทรัพย์', vi: '💰 Tài Vận Hôm Nay & Tránh Tiêu Hao',
};
const OLD_Q3 = {
  zh: '🔮 结合星盘的今日指引', en: "🔮 Today's Astral Chart Guidance", fr: '🔮 Conseils Astraux selon mon Thème',
  es: '🔮 Guía Astral según mi Carta Natal', th: '🔮 คำชี้แนะดวงดาวประจำวันตามลัคนา', vi: '🔮 Chỉ Dẫn Tinh Bàn Hôm Nay',
};
for (const l of ['zh', 'en', 'fr', 'es', 'th', 'vi']) {
  const p = join(LOCALES, `${l}.json`);
  const newKeys = `    "privacyNote": ${JSON.stringify(PRIVACY[l])},\n    "clearDataBtn": ${JSON.stringify(CLEAR_BTN[l])},\n    "clearDataConfirm": ${JSON.stringify(CLEAR_CONFIRM[l])},`;
  sub(p, [
    [`"title": ${JSON.stringify(OLD_TITLE[l])},`, `"title": ${JSON.stringify(HERO[l])},`],
    [`"subtitle": ${JSON.stringify(OLD_SUB[l])},`, `"subtitle": ${JSON.stringify(SUBTITLE[l])},`],
    [`"start": ${JSON.stringify(OLD_START[l])},`, `"start": ${JSON.stringify(CTA[l])},\n${newKeys}`],
    [`"chatQ1": ${JSON.stringify(OLD_Q1[l])},`, `"chatQ1": ${JSON.stringify(Q1[l])},`],
    [`"chatQ3": ${JSON.stringify(OLD_Q3[l])},`, `"chatQ3": ${JSON.stringify(Q3[l])},`],
  ]);
  JSON.parse(read(p)); // JSON 合法性自证
}
console.log('① locales 六语批刷完成（含新键注入）');

/* ── ② 引擎镜像同步（chatQ1/Q3 触发锚逐字同源）── */
sub(join(ROOT, 'web/src/lib/astroWealthAdvisoryEngine.mjs'), [
  [`${JSON.stringify(OLD_Q1.zh)},`, `${JSON.stringify(Q1.zh)},`],
  [`${JSON.stringify(OLD_Q1.en)},`, `${JSON.stringify(Q1.en)},`],
  [`${JSON.stringify(OLD_Q1.fr)},`, `${JSON.stringify(Q1.fr)},`],
  [`${JSON.stringify(OLD_Q1.es)},`, `${JSON.stringify(Q1.es)},`],
  [`${JSON.stringify(OLD_Q1.th)},`, `${JSON.stringify(Q1.th)},`],
  [`${JSON.stringify(OLD_Q1.vi)},`, `${JSON.stringify(Q1.vi)},`],
]);
sub(join(ROOT, 'web/src/lib/astroSeasonalWellnessEngine.mjs'), [
  [`${JSON.stringify(OLD_Q3.zh)},`, `${JSON.stringify(Q3.zh)},`],
  [`${JSON.stringify(OLD_Q3.en)},`, `${JSON.stringify(Q3.en)},`],
  [`${JSON.stringify(OLD_Q3.fr)},`, `${JSON.stringify(Q3.fr)},`],
  [`${JSON.stringify(OLD_Q3.es)},`, `${JSON.stringify(Q3.es)},`],
  [`${JSON.stringify(OLD_Q3.th)},`, `${JSON.stringify(Q3.th)},`],
  [`${JSON.stringify(OLD_Q3.vi)},`, `${JSON.stringify(Q3.vi)},`],
]);
console.log('② 引擎镜像（E139 Q1 / E137 Q3）同步完成');

/* ── ③ server.js E148 指路句 CTA 词换血（开始测算 → 定位我的坐标）── */
const SRV = join(ROOT, 'server.js');
let srv = read(SRV);
const ctaSwap = srv.split('『开始测算』').length - 1;
if (ctaSwap !== 3) throw new Error(`server.js 『开始测算』锚数异常: ${ctaSwap}`);
srv = srv.split('『开始测算』').join('『定位我的坐标』');
write(SRV, srv);
console.log(`③ server.js 指路句 CTA 换血完成（${ctaSwap} 处）`);
console.log(`总计替换 ${hits + ctaSwap} 处`);
