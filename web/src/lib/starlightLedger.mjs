/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏆 E120-刀二伴生（主公军令 2026-11-03）：灵犀星原子账本（DAILY_PULSE）
 * ═══════════════════════════════════════════════════════════════════════════
 * 军令锚：MoodCompass 用户确认提交情绪后自动入账——「claimDailyStarlight(
 * ledger, todayDateStr)」＋弹星尘动效「与灵宠羁绊加深 · 灵犀星 +1」。
 * E117 账本未实施 ⇒ 以 E111 既有真源 ks_starlight_count {count, day} 为底座
 * 升格为原子账本模块（纯函数核心＋localStorage 读写壳，node:test 可直测）。
 * 🔴 原子性铁律：同日复记不加（granted=false）、跨日首记必 +1（DAILY_PULSE）；
 *    坏档/坏存储 fail-soft（视零档重建，绝不抛错阻断交互——E111 沿袭）。
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** 唯一存储键（E111 真源沿用——localStorage 白名单在册） */
export const STARLIGHT_STORAGE_KEY = 'ks_starlight_count';

/**
 * 单日灵犀星原子入账（纯函数——可测核心）
 * @param {import('../types/companionEmotion.ts').StarlightLedger} ledger 现账本
 * @param {string} todayDateStr 当日 YYYY-MM-DD
 * @returns {{ granted: boolean, ledger: object, transaction: object | null }}
 */
export function claimDailyStarlight(ledger, todayDateStr) {
  const safe = normalizeLedger(ledger);
  if (safe.day === todayDateStr && safe.count > 0) {
    // 同日已打卡：幂等拒绝（不重复 +1，不产生交易）
    return { granted: false, ledger: safe, transaction: null };
  }
  const next = { count: safe.count + 1, day: todayDateStr };
  const transaction = {
    type: 'DAILY_PULSE',
    delta: 1,
    balance: next.count,
    date: todayDateStr,
  };
  return { granted: true, ledger: next, transaction };
}

/** 账本形状守卫（坏档视零档——fail-soft） */
export function normalizeLedger(raw) {
  if (raw && typeof raw === 'object'
    && Number.isInteger(raw.count) && raw.count >= 0
    && typeof raw.day === 'string') {
    return { count: raw.count, day: raw.day };
  }
  return { count: 0, day: '' };
}

/** localStorage 读档壳（浏览器侧——坏存储 fail-soft） */
export function readStarlightStore(store) {
  try {
    const raw = JSON.parse((store || window.localStorage).getItem(STARLIGHT_STORAGE_KEY) || 'null');
    return normalizeLedger(raw);
  } catch {
    return { count: 0, day: '' };
  }
}

/** localStorage 写档壳（iOS 无痕抛错静默降级——E111 沿袭） */
export function writeStarlightStore(store, ledger) {
  try {
    (store || window.localStorage).setItem(STARLIGHT_STORAGE_KEY, JSON.stringify(normalizeLedger(ledger)));
    return true;
  } catch {
    return false;
  }
}
