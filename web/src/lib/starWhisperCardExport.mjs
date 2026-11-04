/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏆 E123-ASTRAL-TOUCH 刀二（主公军令 2026-11-04）：星语灵犀 Canvas 实体卡导出器
 * ║ E123-ASTRAL-TOUCH Blade 2 (Nov 4, 2026): Star Whisper canvas card exporter
 * ═══════════════════════════════════════════════════════════════════════════
 * 军令锚：「收入星语袋」点击时并行触发 Canvas 实体卡本地静默下载——
 *   · 复用 E120 破冰密函渲染引擎 renderAmuletToCanvas（1080×1748 黄金比例
 *     高清 PNG——零新引擎，防过度工程化；四层管线暗金底纹/韦特线稿/
 *     六语排版/防伪水印全沿袭）；
 *   · 合璧笺真值（FusedPouchRecord）装配为 template 形状：title=✦今日星语
 *     灵犀✦、subtitle=日期、prose=灵宠抚慰、companionWhisper=行动建议、
 *     吉时标牌=助运吉时＋bestWindow；
 *   · 情绪→韦特图腾分发：melancholy→XVII 星星 / agitated→XIV 节制 /
 *     longing→VI 恋人 / radiant→XIX 太阳 / grateful→XXI 世界（缺省 21）；
 *   · 文件名军令钦定：KindredSouls-星语灵犀-YYYYMMDD.png；
 *   · 下载降级：桌面 a[download] 直落；移动端优先 Web Share API
 *     （navigator.canShare files——系统分享面板），不支持 ⇒ 回退 a[download]。
 * 🔴 离线铁律沿袭：零 fetch/XHR（纯 Canvas dataURL）；node 无 DOM ⇒
 *    组装函数纯语义可测，渲染/下载由浏览器端调用方消费。
 * ║ Order anchor: tapping "Stow the Star Whisper" also silently downloads a
 *   canvas card—reusing the E120 amulet renderer (1080×1748 golden ratio PNG).
 *   Filename: KindredSouls-星语灵犀-YYYYMMDD.png; mobile falls back to
 *   Web Share API then a[download]. Zero i18n keys; fail-closed shape guard.
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { renderAmuletToCanvas } from './amuletCanvasRenderer.mjs';
import { POUCH_UI } from './dailyPouchStore.mjs';

/** 军令钦定文件名格式（KindredSouls-星语灵犀-YYYYMMDD.png） */
export const STAR_WHISPER_FILENAME_PREFIX = 'KindredSouls-星语灵犀-';

/** 情绪 → 密函引擎图腾键分发（复用 AMULET_CARD_ID 四型线稿：
 *  melancholy→longing(17 星星·生命之泉慰藉) / agitated→apology(14 节制·水火
 *  相融降温) / longing→weather(6 恋人·牵挂成双) / radiant→support(19 太阳·
 *  旭日金轮) / grateful→缺省(21 世界·完满)——零引擎改动防过度工程化） */
export const STAR_WHISPER_CARD_TYPE = Object.freeze({
  melancholy: 'longing',
  agitated: 'apology',
  longing: 'weather',
  radiant: 'support',
  grateful: undefined,
});

/** 合璧笺情绪白名单（与 dailyPouchStore.POUCH_MOODS 同源） */
const POUCH_MOOD_SET = new Set(['radiant', 'longing', 'melancholy', 'agitated', 'grateful']);

/**
 * 合璧笺真值 → 密函引擎 template 形状装配（fail-closed：坏档 null）
 * @param {object|null} pouch FusedPouchRecord（dailyPouchStore 形状守卫后真值）
 * @param {string} lang 六语之一
 * @returns {object|null} template 形状（title/subtitle/prose/companionWhisper/
 *   bestWindowPrefix/defaultTiming）；坏档 ⇒ null
 */
export function buildStarWhisperTemplate(pouch, lang) {
  if (!pouch || typeof pouch !== 'object') return null;
  const mood = String(pouch.mood || '');
  if (!POUCH_MOOD_SET.has(mood)) return null;
  const ta = pouch.transitAttribution;
  const la = pouch.luckyAttributes;
  if (!ta || typeof ta !== 'object' || !la || typeof la !== 'object') return null;
  for (const f of ['companionComfort', 'actionableAdvice']) {
    if (typeof ta[f] !== 'string' || !ta[f].trim()) return null;
  }
  for (const f of ['bestWindow']) {
    if (typeof la[f] !== 'string' || !la[f].trim()) return null;
  }
  const uiRow = POUCH_UI[lang] || POUCH_UI.en;
  const dateKey = String(pouch.date || '');
  return {
    title: uiRow.title,
    subtitle: dateKey || uiRow.openCta.replace('✦', '').trim(),
    prose: ta.companionComfort,
    companionWhisper: ta.actionableAdvice,
    bestWindowPrefix: uiRow.windowLead,
    defaultTiming: la.bestWindow,
  };
}

/**
 * 军令文件名装配（KindredSouls-星语灵犀-YYYYMMDD.png）
 * @param {string} dateKey 当日键（YYYYMMDD；空 ⇒ 今天兜底）
 * @returns {string} 完整文件名
 */
export function starWhisperFileName(dateKey) {
  const d = String(dateKey || '').replace(/[^0-9]/g, '');
  const key = d.length === 8 ? d : (() => {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  })();
  return `${STAR_WHISPER_FILENAME_PREFIX}${key}.png`;
}

/**
 * 实体卡渲染＋端侧静默下载（浏览器端——fire-and-forget，不阻断三态时序）
 * 🏆 E123-刀二补刀（2026-11-04 实弹诊断）：PNG 编码改走 canvas.toBlob 异步
 * 通道（Chrome 后台线程编码）——旧同步 dataURL 编码在软件渲染环境实测
 * 阻塞主线程 5s+，三态微交互时序（400ms 淡出/700ms 收口/Toast 2.5s）被
 * 整体推迟。toBlob 后 blob 直建 File（免 dataURL 中转 fetch），a[download]
 * 走 objectURL＋延迟 revoke。
 * @param {object|null} pouch 合璧笺真值
 * @param {string} lang 六语之一
 * @returns {Promise<boolean>} 是否成功触发下载/分享（fail-soft：渲染失败 false）
 */
export async function downloadStarWhisperCard(pouch, lang) {
  if (typeof document === 'undefined') return false; // node 环境 fail-soft
  const tpl = buildStarWhisperTemplate(pouch, lang);
  if (!tpl) return false;
  try {
    const canvas = document.createElement('canvas');
    const mood = String(pouch.mood || '');
    const type = STAR_WHISPER_CARD_TYPE[mood];
    await renderAmuletToCanvas(canvas, tpl, lang, type ? { type } : {});
    // 🔴 toBlob 异步编码（编码移出主线程——三态时序零阻塞铁律）
    const blob = await new Promise((resolve) => {
      try { canvas.toBlob(resolve, 'image/png'); } catch { resolve(null); }
    });
    if (!blob || blob.type !== 'image/png') return false;
    const fileName = starWhisperFileName(pouch.date);
    // 移动端优先 Web Share API（系统原生分享面板——军令降级链）
    try {
      const file = new File([blob], fileName, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: tpl.title });
        return true;
      }
    } catch { /* share 失败/取消 ⇒ 回退 a[download] */ }
    const url = URL.createObjectURL(blob);
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      setTimeout(() => { try { URL.revokeObjectURL(url); } catch { /* noop */ } }, 30000);
    }
    return true;
  } catch { return false; } // 渲染异常 ⇒ fail-soft（不阻断入袋收口）
}
