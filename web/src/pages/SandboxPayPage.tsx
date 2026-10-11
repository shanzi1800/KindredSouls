/**
 * SandboxPayPage.tsx —— 沙盘收银台「直达路由页」（Gate 45-B）
 * ═══════════════════════════════════════════════════════════════════════════
 * 用途：`/sandbox-pay?plan=…&session=…` 的同源落点。
 *   · 模态唤起失败时（例如用户在独立标签页直达本页）作兜底承接；
 *   · 页面挂载即由总线唤起 SandboxCashier（同一组件、同一纯核，禁第二套实现）；
 *   · 缺 plan ⇒ 不弹空壳，如实提示并给出返回入口。
 * ═══════════════════════════════════════════════════════════════════════════
 */
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
// @ts-ignore —— sandboxCheckout.mjs 为纯 JS 逻辑核（形状由 Gate 45-B 闸门守备）
import { openSandboxCashier, decodeSandboxPaySearch } from '../lib/sandboxCheckout.mjs';

const SAFE_TEXT: React.CSSProperties = {
  overflowWrap: 'anywhere',
  wordBreak: 'break-word',
  minWidth: 0,
};

const SandboxPayPage: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  const { i18n } = useTranslation();
  const [plan, setPlan] = useState<string>('');

  useEffect(() => {
    const parsed = decodeSandboxPaySearch(window.location.search);
    setPlan(parsed.plan);
    if (!parsed.plan) return;
    openSandboxCashier({
      plan: parsed.plan,
      sessionId: parsed.sessionId,
      url: window.location.pathname + window.location.search,
      lang: String(i18n.language || 'en').split('-')[0],
      onGranted: () => { window.location.href = '/'; },
      onClose: () => { if (onNavigate) onNavigate('/'); },
    });
  }, [i18n.language, onNavigate]);

  return (
    <div
      data-testid="sandbox-pay-page"
      style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', background: '#0D0D1A', color: 'rgba(255,255,255,0.72)',
        textAlign: 'center', ...SAFE_TEXT,
      }}
    >
      <div style={{ maxWidth: '360px', ...SAFE_TEXT }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#81D8D0', marginBottom: '8px', letterSpacing: '1px' }}>
          SANDBOX
        </div>
        <div style={{ fontSize: '12px', lineHeight: 1.6, ...SAFE_TEXT }}>
          {plan
            ? (i18n.language || '').startsWith('zh') ? '正在唤起沙盘收银台…' : 'Opening sandbox cashier…'
            : (i18n.language || '').startsWith('zh') ? '缺少 plan 参数，无法唤起沙盘收银台。' : 'Missing plan parameter — cannot open the sandbox cashier.'}
        </div>
        {!plan && (
          <button
            onClick={() => { if (onNavigate) onNavigate('/'); }}
            style={{
              marginTop: '14px', padding: '9px 18px', borderRadius: '10px',
              border: '1px solid rgba(129,216,208,0.4)', background: 'rgba(129,216,208,0.08)',
              color: '#81D8D0', fontSize: '12px', fontWeight: 700, cursor: 'pointer', ...SAFE_TEXT,
            }}
          >
            ← {i18n.language?.startsWith('zh') ? '返回首页' : 'Back home'}
          </button>
        )}
      </div>
    </div>
  );
};

export default SandboxPayPage;
