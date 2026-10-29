/**
 * WealthUpgradePaywall.tsx —— 财富「升阶」专属付费墙模态（E59 · 主公雷霆军令 2026-10-16）
 * ═══════════════════════════════════════════════════════════════════════════
 * 军令原文：
 *   「权益严格按 SKU 解耦 · 严禁一次付费全盘通放」——$4.99 只放行先天长卷 + 灵宠认领资格；
 *   「阶梯付费墙落地（灵宠认领后承接区）」——年鉴区块两枚按钮点击后，**必须**弹出
 *     $2.99 / $29.99 **各自专属**的付费墙/收银台，支付完成前严禁展示对应内容；
 *   「沙箱一键模拟闭环」——沙箱态下，两枚弹窗内各配「一键模拟支付 $X」测试按键。
 *
 * 🔴 设计纪律：
 *   ① **单 CTA 双模**：实时态渲染「立即解锁」（→ Stripe 收银台）；沙箱态渲染
 *      「✨ 一键模拟支付 $2.99 / $29.99」（→ /api/sandbox/complete 自环验签派发）。
 *      两态共用同一 plan，**绝不**出现「沙箱里还有第二个外跳入口」。
 *   ② **纯展示组件**：零网络 / 零 localStorage / 零权益判定 —— 一切副作用由调用方
 *      （WealthReportPage）经纯核 sandboxCheckout.mjs 执行，组件只回传意图。
 *   ③ **零硬编码自然语言**：一切词条经 i18n wealthReport 域回查（六语键集合全等）；
 *      无文字的控件一律用符号（✕），杜绝「英文兜底泄漏到非英语用户」。
 *   ④ 定价**由调用方注入**（`price`），组件不臆造价格；缺价则只显示档位名。
 * ═══════════════════════════════════════════════════════════════════════════
 */
import React from 'react';

export type WealthUpgradePlan = 'wealth_monthly_report' | 'wealth_yearly_report';

/** 闸门锚点常量（单一真源 —— 组件挂载处与自动化断言同源取用） */
export const UPGRADE_PAYWALL_TESTID = 'wealth-upgrade-paywall';
export const UPGRADE_LIVE_BTN_TESTID = 'wealth-upgrade-live-btn';
export const UPGRADE_SANDBOX_BTN_TESTID = 'wealth-upgrade-sandbox-btn';
export const UPGRADE_CLOSE_BTN_TESTID = 'wealth-upgrade-close-btn';

interface WealthUpgradePaywallProps {
  /** 弹窗归属档位 —— 决定文案与定价（$2.99 月报 / $29.99 年报） */
  plan: WealthUpgradePlan;
  /** 标价串（如 `$2.99` / `$29.99`）；缺省 ⇒ 不渲染价格行（绝不臆造） */
  price?: string;
  /** 沙箱态：渲染「一键模拟支付 $X」并走 onSandboxPay；否则渲染「立即解锁」走 onPurchase */
  sandboxMode?: boolean;
  /** 请求进行中（禁用主按钮，防双花） */
  busy?: boolean;
  /** 实时态主按钮：交给调用方的 handlePurchase（Stripe 外跳 / 沙箱回执分流） */
  onPurchase: (plan: WealthUpgradePlan) => void;
  /** 沙箱态主按钮：交给调用方的沙箱自环完成（/api/sandbox/complete） */
  onSandboxPay: (plan: WealthUpgradePlan) => void;
  /** 关闭弹窗 */
  onClose: () => void;
  /** i18n 取词函数（调用方注入 useTranslation 的 t） */
  t: (key: string) => string;
  /** 🛡️ E103-③（主公军令 2026-10-30）：界面语言（fr/es ⇒ 标价小数逗号 $2,99） */
  lang?: string;
}

const GOLD = '#D4AF37';
const TEAL = '#81D8D0';

const SAFE_TEXT: React.CSSProperties = {
  overflowWrap: 'anywhere',
  wordBreak: 'break-word',
  minWidth: 0,
};

const WealthUpgradePaywall: React.FC<WealthUpgradePaywallProps> = ({
  plan,
  price,
  sandboxMode = false,
  busy = false,
  onPurchase,
  onSandboxPay,
  onClose,
  t,
  lang,
}) => {
  const isMonthly = plan === 'wealth_monthly_report';
  // 🛡️ E103-③：fr/es 标价小数逗号化（$2.99 → $2,99——军令刀三数字本地化）
  const priceLabel = (price && (lang === 'fr' || lang === 'es')) ? String(price).replace('.', ',') : price;
  const accent = isMonthly ? GOLD : TEAL;
  const accentBorder = isMonthly ? 'rgba(212,175,55,0.42)' : 'rgba(129,216,208,0.42)';
  const accentFill = isMonthly ? 'rgba(212,175,55,0.08)' : 'rgba(129,216,208,0.08)';
  const icon = isMonthly ? '📅' : '📆';
  const descKey = isMonthly ? 'wealthReport.upgradeMonthlyDesc' : 'wealthReport.upgradeYearlyDesc';
  const sandboxKey = isMonthly ? 'wealthReport.sandboxPayMonthly' : 'wealthReport.sandboxPayYearly';

  const handlePrimary = () => {
    if (busy) return;
    if (sandboxMode) onSandboxPay(plan);
    else onPurchase(plan);
  };

  return (
    <div
      data-testid={UPGRADE_PAYWALL_TESTID}
      data-upgrade-plan={plan}
      data-upgrade-mode={sandboxMode ? 'sandbox' : 'live'}
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(6,7,16,0.82)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '18px',
      }}
    >
      <div
        style={{
          width: '94%', maxWidth: '390px', position: 'relative',
          background: 'linear-gradient(170deg, #0e1028 0%, #0a0c1e 45%, #0D0D1A 100%)',
          borderRadius: '20px', padding: '22px 18px 16px',
          border: `1px solid ${accentBorder}`,
          boxShadow: `0 0 60px ${accentFill}, 0 18px 50px rgba(0,0,0,0.6)`,
          ...SAFE_TEXT,
        }}
      >
        {/* 顶部：锁定图标 + 标题 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <span style={{ fontSize: '22px', filter: `drop-shadow(0 0 10px ${accent})` }}>🔒</span>
          <span style={{ fontSize: '16px', fontWeight: 800, color: accent, ...SAFE_TEXT }}>
            {t('wealthReport.upgradeTitle')}
          </span>
        </div>

        {/* 档位标识 + 标价 */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
          <span style={{
            fontSize: '12px', fontWeight: 700, color: accent,
            border: `1px solid ${accentBorder}`, background: accentFill,
            borderRadius: '999px', padding: '3px 11px', ...SAFE_TEXT,
          }}>
            {icon} {isMonthly ? t('wealthReport.unlockMonthly') : t('wealthReport.unlockYearly')}
          </span>
          {priceLabel ? (
            <span style={{ fontSize: '24px', fontWeight: 900, color: '#F5F1E6', letterSpacing: '0.5px' }}>{priceLabel}</span>
          ) : null}
        </div>

        {/* 权益说明 */}
        <div style={{ fontSize: '12px', lineHeight: 1.65, color: 'rgba(200,200,220,0.86)', marginBottom: '16px', ...SAFE_TEXT }}>
          {t(descKey)}
        </div>

        {/* 主 CTA：单按钮双模（实时 ⇒ 立即解锁；沙箱 ⇒ 一键模拟支付 $X） */}
        <button
          data-testid={sandboxMode ? UPGRADE_SANDBOX_BTN_TESTID : UPGRADE_LIVE_BTN_TESTID}
          onClick={handlePrimary}
          disabled={busy}
          style={{
            width: '100%', padding: '13px 20px', borderRadius: '13px', border: 'none',
            /* 🔴 E103-③：CTA 390px 防爆——min-h 48px＋居中折行（军令刀三） */
            minHeight: '48px', textAlign: 'center', whiteSpace: 'normal', lineHeight: 1.3,
            background: busy
              ? '#444'
              : (isMonthly
                ? 'linear-gradient(135deg, #D4AF37 0%, #F0D060 100%)'
                : 'linear-gradient(135deg, #81D8D0 0%, #2ECBF7 100%)'),
            color: '#0D0D1A', fontSize: '15px', fontWeight: 800, letterSpacing: '0.3px',
            cursor: busy ? 'not-allowed' : 'pointer',
            boxShadow: busy ? 'none' : `0 4px 22px ${accentFill}`,
            ...SAFE_TEXT,
          }}
        >
          {busy
            ? '⏳ …'
            : (sandboxMode ? t(sandboxKey) : `${t('wealthReport.upgradeCta')}${priceLabel ? ' ' + priceLabel : ''}`)}
        </button>

        {/* 关闭（符号化，无自然语言） */}
        <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px dashed rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            data-testid={UPGRADE_CLOSE_BTN_TESTID}
            onClick={onClose}
            aria-label="close"
            style={{
              padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.18)',
              background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.72)',
              fontSize: '12px', fontWeight: 700, cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

export default WealthUpgradePaywall;
