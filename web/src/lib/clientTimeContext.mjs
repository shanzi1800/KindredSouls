/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🆕 E142-CLIENT-TIME-SYNC（主公军令 2026-11-16）：用户终端时钟同步三件套纯核
 * ═══════════════════════════════════════════════════════════════════════════
 * 病灶：后端跑云端 UTC，未注入用户终端本地时钟——灵宠报不出「现在几点」
 * （主公产线亲测病灶③）。军令钦定三件套载荷：
 *   · localISO            本地 ISO 时间戳（YYYY-MM-DDTHH:mm，本地口径无 Z）
 *   · timezone            Intl.DateTimeFormat().resolvedOptions().timeZone
 *   · formattedLocalTime  含年月日星期时分＋时段（zh 军令例：
 *                         「2026年11月16日 星期一 15:31（午后）」）
 * 前端每次首句/聊天请求实时构造随 body 上行；服务端形状守卫后注入 System
 * Prompt 顶部高优块【当前用户所在地精确时间：…（时区：…）】。
 * 🔴 纪律：纯逻辑核（零 DOM/零 i18n/零网络）；now/timezone 可注入单测
 *   （确定性核——星期/月份/时段六语字典内置，禁 Intl locale 环境漂移）；
 *   fail-soft：Intl 缺席/异常 ⇒ timezone 空串（服务端不注入回退现行为）。
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** 六语白名单 */
const LANGS = Object.freeze(['zh', 'en', 'fr', 'es', 'th', 'vi']);

/** 星期六语字典（周一索引 0——确定性内置，禁 Intl 环境漂移） */
const WEEKDAYS = Object.freeze({
  zh: ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'],
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  fr: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'],
  es: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'],
  th: ['วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์', 'วันอาทิตย์'],
  vi: ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'],
});

/** 月份六语字典（0 索引） */
const MONTHS = Object.freeze({
  zh: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
  es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
  th: ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'],
  vi: ['tháng 1', 'tháng 2', 'tháng 3', 'tháng 4', 'tháng 5', 'tháng 6', 'tháng 7', 'tháng 8', 'tháng 9', 'tháng 10', 'tháng 11', 'tháng 12'],
});

/** 时段划分（小时 0-23）：5-8 清晨 / 9-11 上午 / 12-17 午后 / 18-22 傍晚 / 其余深夜 */
function dayPeriod(hour) {
  if (hour >= 5 && hour <= 8) return 'dawn';
  if (hour >= 9 && hour <= 11) return 'morning';
  if (hour >= 12 && hour <= 17) return 'afternoon';
  if (hour >= 18 && hour <= 22) return 'evening';
  return 'lateNight';
}

/** 时段六语标签 */
const PERIODS = Object.freeze({
  dawn: Object.freeze({ zh: '清晨', en: 'early morning', fr: 'aube', es: 'amanecer', th: 'ย่ำรุ่ง', vi: 'sáng sớm' }),
  morning: Object.freeze({ zh: '上午', en: 'morning', fr: 'matin', es: 'mañana', th: 'ช่วงเช้า', vi: 'buổi sáng' }),
  afternoon: Object.freeze({ zh: '午后', en: 'afternoon', fr: 'après-midi', es: 'tarde', th: 'บ่าย', vi: 'buổi chiều' }),
  evening: Object.freeze({ zh: '傍晚', en: 'evening', fr: 'soirée', es: 'noche', th: 'ค่ำ', vi: 'buổi tối' }),
  lateNight: Object.freeze({ zh: '深夜', en: 'late night', fr: 'nuit profonde', es: 'madrugada', th: 'ดึก', vi: 'khuya' }),
});

/** 双位补零 */
const p2 = (n) => String(n).padStart(2, '0');

/**
 * 🏆 E142 军令钦定主函数：终端时钟三件套构造（确定性核）。
 * @param {Date} [now] 基准时刻（测试注入；缺省当前）
 * @param {string} [timezone] 时区名（测试注入；缺省 Intl resolved——缺席 ⇒ ''）
 * @param {string} [lang] 六语之一（缺省 'zh'——军令例格式）
 * @returns {{localISO: string, timezone: string, formattedLocalTime: string}}
 */
export function buildClientTimeContext(now, timezone, lang) {
  const d = now instanceof Date ? now : new Date();
  const l = LANGS.includes(String(lang || '')) ? String(lang) : 'zh';
  let tz = '';
  if (typeof timezone === 'string' && timezone.trim()) {
    tz = timezone.trim().slice(0, 64);
  } else {
    try {
      tz = String(Intl.DateTimeFormat().resolvedOptions().timeZone || '').slice(0, 64);
    } catch { tz = ''; }
  }
  const y = d.getFullYear();
  const mo = d.getMonth();
  const day = d.getDate();
  const wd = d.getDay();
  const hh = d.getHours();
  const mm = d.getMinutes();
  const localISO = `${y}-${p2(mo + 1)}-${p2(day)}T${p2(hh)}:${p2(mm)}`;
  const hm = `${p2(hh)}:${p2(mm)}`;
  const period = PERIODS[dayPeriod(hh)][l];
  const wdL = WEEKDAYS[l][(wd + 6) % 7]; // 周一索引 0
  const moL = MONTHS[l][mo];
  let formattedLocalTime;
  if (l === 'zh') {
    formattedLocalTime = `${y}年${moL.replace('月', '')}月${day}日 ${wdL} ${hm}（${period}）`;
  } else if (l === 'en') {
    formattedLocalTime = `${wdL}, ${moL} ${day}, ${y} ${hm} (${period})`;
  } else if (l === 'fr') {
    formattedLocalTime = `${wdL} ${day} ${moL} ${y} ${hm} (${period})`;
  } else if (l === 'es') {
    formattedLocalTime = `${wdL} ${day} de ${moL} de ${y} ${hm} (${period})`;
  } else if (l === 'th') {
    formattedLocalTime = `${wdL}ที่ ${day} ${moL} ${y} ${hm} (${period})`;
  } else {
    formattedLocalTime = `${wdL}, ngày ${day} ${moL} năm ${y} ${hm} (${period})`;
  }
  return { localISO, timezone: tz, formattedLocalTime };
}
