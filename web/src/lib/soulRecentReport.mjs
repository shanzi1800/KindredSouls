/**
 * soulRecentReport.mjs —— 「最近解锁付费报告」追踪凭证（E112-刀二 · 主公军令 2026-11-01）
 * ═══════════════════════════════════════════════════════════════════════════
 * 军令钦定：凡是付费付讫完成（或查看解锁报告）瞬间，向 localStorage 写入
 * `soul_recent_unlocked_report`（形状守卫 fail-closed——坏档一律视同无档）：
 *   { category: 'love' | 'wealth', tier: 'core' | 'monthly' | 'annual',
 *     title: string, keyAspects: object, unlockedAt: number }
 * 覆盖全部 6 档产品：姻缘 $4.99 once / $2.99 月报 / $29.99 年报 ＋
 * 财富 $4.99 先天 / $2.99 月报 / $29.99 年报。写入点＝各报告「生成成功上屏」
 * 收口（沙盒与真实支付同链：付讫必触发生成，生成成功才上屏）。
 *
 * 消费端：对话舱开舱首语（FamiliarChatSheet 六档专属第一击）＋
 * /api/familiar/chat 随行（服务端 prompt 注入「主人最近解锁的报告」块）。
 * 🔴 严禁在此模块做任何 i18n / DOM 操作——纯逻辑核，静态字面量键名。
 */

export const SOUL_RECENT_REPORT_KEY = 'soul_recent_unlocked_report';

const CATEGORIES = new Set(['love', 'wealth']);
const TIERS = new Set(['core', 'monthly', 'annual']);

/** 形状守卫：entry 为合法 6 档档案才放行（fail-closed） */
export function isRecentReportShape(v) {
  return !!(v && typeof v === 'object'
    && CATEGORIES.has(String(v.category))
    && TIERS.has(String(v.tier))
    && typeof v.title === 'string'
    && v.title.length > 0 && v.title.length <= 120
    && v.keyAspects && typeof v.keyAspects === 'object' && !Array.isArray(v.keyAspects)
    && Number.isFinite(Number(v.unlockedAt)));
}

/** 写入（付讫/解锁报告成功瞬间）——坏形状静默不写（fail-closed 防污染） */
export function markRecentReport(store, entry) {
  if (!store || !isRecentReportShape(entry)) return false;
  try {
    store.setItem(SOUL_RECENT_REPORT_KEY, JSON.stringify({
      category: String(entry.category),
      tier: String(entry.tier),
      title: String(entry.title).slice(0, 120),
      keyAspects: entry.keyAspects,
      unlockedAt: Number(entry.unlockedAt),
    }));
    return true;
  } catch {
    return false; // iOS 无痕模式 localStorage 抛错 ⇒ 静默降级
  }
}

/** 读取（开舱/发请求时）——坏档返回 null（对话舱回退 E111 情境首语链） */
export function readRecentReport(store) {
  if (!store) return null;
  try {
    const v = JSON.parse(store.getItem(SOUL_RECENT_REPORT_KEY) || 'null');
    return isRecentReportShape(v) ? v : null;
  } catch {
    return null;
  }
}

/** 清除（重置测试数据链用；日常永不自动清——「最近解锁」长期有效） */
export function clearRecentReport(store) {
  if (!store) return;
  try { store.removeItem(SOUL_RECENT_REPORT_KEY); } catch { /* noop */ }
}
