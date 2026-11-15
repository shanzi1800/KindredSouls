/**
 * sandboxTester.mjs — 🧪 E138 双测试总监沙盒演练纯逻辑核（主公军令 2026-11-13）
 * ═══════════════════════════════════════════════════════════════════════════
 * 军令口径：双测试总监（主公 ＋ 合伙人 North）库内持 VIP 年卡，但**全链付费墙保留**——
 *   沙盒态下白名单账号不跳付费墙，逐模块走「拉起沙盒支付→模拟确认（0 扣款）→
 *   webhook 回调→动画解锁」真实闭环；跨模块独立（romance 解锁后 wealth 付费墙仍待支付）。
 *
 * 职责边界（纯逻辑核纪律）：
 *   · 零网络 / 零 DOM / 零 LLM —— tester 身份探测由调用方 fetch
 *     `/api/sandbox/tester-status`（服务端判定，名单绝不下发前端 ⇒ 普通用户零泄漏）
 *     后将布尔注入本核 `setSandboxTester`；
 *   · `sandboxSessionUnlocked` 模块级作用域（romance / wealth 两象隔离，**初始恒 false**）：
 *     纯内存 SPA 单例——页面刷新天然回到「未解锁 ⇒ 付费墙再现」演练态；
 *   · romance 模块的解锁真源沿用 E85-① 既有契约（sessionStorage
 *     `ks_compat_session_unlocked`，付讫跨 reload 存续、新测算重置）——本核**不接管**；
 *     wealth 模块解锁真源＝本核模块态（`markSandboxSessionUnlocked('wealth')`）；
 *   · 「🔄 重置沙盒演练」：`resetSandboxSession()` 清两象模块态，调用方另清 romance
 *     会话键后刷新 ⇒ 双模块付费墙全数恢复。
 * ═══════════════════════════════════════════════════════════════════════════
 */

/* ── 测试锚点（闸门据此锁定契约）── */
export const SANDBOX_TESTER_STATUS_PATH = '/api/sandbox/tester-status';

/** 模块象限闭集（romance=姻缘 /result · wealth=财富 /wealth/report） */
export const TESTER_SANDBOX_MODULES = Object.freeze(['romance', 'wealth']);

/** romance 模块解锁真源键（E85-① 既有契约，重置微控件一并清除） */
export const ROMANCE_SESSION_UNLOCK_KEY = 'ks_compat_session_unlocked';

/* ── 「🔄 重置沙盒演练」微控件文案（六语自容单源；E128 六语对齐红线——两模块共用）── */
export const L_SANDBOX_TESTER_RESET = Object.freeze({
  zh: '🔄 重置沙盒演练（恢复付费墙）',
  en: '🔄 Reset Sandbox Rehearsal (restore paywalls)',
  es: '🔄 Reiniciar ensayo sandbox (restaurar muros de pago)',
  fr: '🔄 Réinitialiser la répétition sandbox (restaurer les paywalls)',
  th: '🔄 รีเซ็ตการซ้อมแซนด์บ็อกซ์ (คืนกำแพงชำระเงิน)',
  vi: '🔄 Đặt lại diễn tập sandbox (khôi phục paywall)',
});

/* ── 模块级状态（SPA 单例；刷新即归零 ⇒ 军令「初始 false」恒成立）── */
const _state = {
  tester: false,
  unlocked: { romance: false, wealth: false },
};

/** tester 身份注入（服务端 tester-status 回执真值；缺省/非布尔 ⇒ false fail-closed） */
export function setSandboxTester(v) {
  _state.tester = v === true;
  return _state.tester;
}

/** 当前会话是否测试总监（普通用户恒 false ⇒ 闸门/微控件零激活） */
export function isSandboxTester() {
  return _state.tester === true;
}

/** 付费墙保留闸门：tester 且该模块本次会话未走完沙盒闭环 ⇒ true（付费墙必现） */
export function testerPaywallGate(module) {
  if (!_state.tester) return false;
  return !isSandboxSessionUnlocked(module);
}

/** 模块解锁标记（沙盒 granted 后调用；romance 象仅供状态记账，解锁真源在 E85 键） */
export function markSandboxSessionUnlocked(module) {
  if (TESTER_SANDBOX_MODULES.indexOf(module) !== -1) {
    _state.unlocked[module] = true;
  }
  return _state.unlocked[module] === true;
}

/** 模块解锁查询（未知模块名 ⇒ false，绝不臆造象限） */
export function isSandboxSessionUnlocked(module) {
  if (TESTER_SANDBOX_MODULES.indexOf(module) === -1) return false;
  return _state.unlocked[module] === true;
}

/** 一键重置沙盒演练：清两象模块态（romance 会话键由调用方另清再刷新） */
export function resetSandboxSession() {
  _state.unlocked.romance = false;
  _state.unlocked.wealth = false;
  return true;
}
