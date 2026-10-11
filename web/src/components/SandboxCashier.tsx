/**
 * SandboxCashier.tsx —— 沙盘模拟支付「收银台」模态（Gate 45-B · E42+ 首战前端线）
 * ═══════════════════════════════════════════════════════════════════════════
 * 军师令（45-B）：
 *   · create-checkout 回执 `sandbox:true` ⇒ **截断外链跳转**，就地唤起本模态；
 *   · 带清晰「沙盘测试环境 / Sandbox Mode」视觉水印 + 双 SKU 标识；
 *   · 两枚极速操作点：①一键模拟付款（/api/sandbox/complete）②特权券兑换（/api/sandbox/redeem）。
 *
 * 🔴 渲染纪律（与全仓铁律同源）：
 *   · 纯无态呈现 —— 不订阅总线时返 null（零空壳）；仅据服务端真值判 granted；
 *   · 零机翻 / 零硬编码文案 —— 一切词条经 dictTerm 回查字典（sandbox / familiar 域）；
 *   · 溢出三道防线：①字典语域 → ②clampToSlot 字素裁剪 → ③CSS 换行兜底；
 *   · 失败/拒签一律如实展示确定文案，**绝不**静默或伪报成功。
 * ═══════════════════════════════════════════════════════════════════════════
 */
import React, { useEffect, useState } from 'react';
import { clampToSlot } from '../lib/reportLayout';
import { ASTRO_TERMS } from '../lib/algos/astroTerms.generated';
import { supabase } from '../lib/supabase';
// @ts-ignore —— sandboxCheckout.mjs 为纯 JS 逻辑核（形状由 Gate 45-B 闸门守备）
import { subscribeSandboxCashier, getSandboxCashier, closeSandboxCashier, buildSandboxCompleteRequest, buildSandboxRedeemRequest, describeSandboxOutcome, dictTerm, planTerm, isVoucherSubmittable, SANDBOX_CASHIER_TESTID, SANDBOX_WATERMARK_TESTID, SANDBOX_PAY_BTN_TESTID, SANDBOX_CODE_INPUT_TESTID, SANDBOX_REDEEM_BTN_TESTID, SANDBOX_STATUS_TESTID } from '../lib/sandboxCheckout.mjs';

const GOLD = '#D4AF37';
const TEAL = '#81D8D0';

const SAFE_TEXT: React.CSSProperties = {
  overflowWrap: 'anywhere',
  wordBreak: 'break-word',
  minWidth: 0,
};

type SandboxRequest = {
  plan: string;
  sessionId: string;
  url: string;
  lang: string | null;
  onGranted: ((plan: string) => void) | null;
  onClose: (() => void) | null;
};

const SandboxCashier: React.FC<{ lang?: string }> = ({ lang }) => {
  const [req, setReq] = useState<SandboxRequest | null>(() => getSandboxCashier());
  const [busy, setBusy] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState<{ granted: boolean; messageKey: string } | null>(null);

  useEffect(() => subscribeSandboxCashier((v: SandboxRequest | null) => {
    setReq(v);
    if (v) { setMsg(null); setCode(''); setBusy(null); }
  }), []);

  const L = lang || (req && req.lang) || 'zh';

  useEffect(() => {
    if (!req) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { req.onClose && req.onClose(); closeSandboxCashier(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [req]);

  if (!req) return null;

  const term = (key: string) => {
    const t = dictTerm(ASTRO_TERMS, 'sandbox', key, L);
    return t ? clampToSlot(t.label, t.slot || 'labelCard') : '';
  };
  const planLabel = (() => {
    const t = planTerm(ASTRO_TERMS, req.plan, L);
    return t ? clampToSlot(t.label, t.slot || 'labelCard') : req.plan;
  })();

  const authHeader = async (): Promise<Record<string, string>> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
    } catch (_) {
      return {};
    }
  };

  const post = async (r: { path: string; method: string; body: unknown }) => {
    const res = await fetch(r.path, {
      method: r.method,
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body: JSON.stringify(r.body),
    });
    const data = await res.json().catch(() => ({}));
    return { res, data };
  };

  const applyOutcome = (out: { granted: boolean; plan: string; messageKey: string }) => {
    setMsg(out);
    if (out.granted) {
      if (req.onGranted) req.onGranted(out.plan || req.plan);
      closeSandboxCashier();
    }
  };

  const doPay = async () => {
    if (busy) return;
    setBusy('pay');
    setMsg(null);
    try {
      const { data } = await post(buildSandboxCompleteRequest(req.plan));
      applyOutcome(describeSandboxOutcome(data));
    } catch (_) {
      setMsg({ granted: false, messageKey: 'SandboxFailed' });
    } finally {
      setBusy(null);
    }
  };

  const doRedeem = async () => {
    if (busy) return;
    if (!isVoucherSubmittable(code)) { setMsg({ granted: false, messageKey: 'SandboxNoCode' }); return; }
    setBusy('redeem');
    setMsg(null);
    try {
      const { data } = await post(buildSandboxRedeemRequest(code));
      applyOutcome(describeSandboxOutcome(data));
    } catch (_) {
      setMsg({ granted: false, messageKey: 'SandboxFailed' });
    } finally {
      setBusy(null);
    }
  };

  const doClose = () => {
    if (req.onClose) req.onClose();
    closeSandboxCashier();
  };

  return (
    <div
      data-testid={SANDBOX_CASHIER_TESTID}
      data-sandbox-plan={req.plan}
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(6,7,16,0.82)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '18px',
      }}
    >
      <div
        style={{
          width: '94%', maxWidth: '390px', position: 'relative',
          background: 'linear-gradient(170deg, #0e1028 0%, #0a0c1e 45%, #0D0D1A 100%)',
          borderRadius: '20px', padding: '20px 18px 16px',
          border: '2px dashed rgba(129,216,208,0.45)',
          boxShadow: '0 0 60px rgba(129,216,208,0.07), 0 18px 50px rgba(0,0,0,0.6)',
          ...SAFE_TEXT,
        }}
      >
        {/* 沙盘水印（视觉识别：这不是真实收款） */}
        <div
          data-testid={SANDBOX_WATERMARK_TESTID}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
            padding: '6px 10px', marginBottom: '12px', borderRadius: '10px',
            background: 'rgba(129,216,208,0.07)', border: '1px solid rgba(129,216,208,0.28)',
          }}
        >
          <span style={{
            fontSize: '10px', fontWeight: 800, letterSpacing: '1.2px',
            color: '#0D0D1A', background: TEAL, borderRadius: '4px', padding: '1px 6px',
          }}>SANDBOX</span>
          <span style={{ fontSize: '12px', fontWeight: 700, color: TEAL, ...SAFE_TEXT }}>{term('SandboxMode')}</span>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', ...SAFE_TEXT }}>{term('SandboxHint')}</span>
        </div>

        {/* 双 SKU 标识 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
          <span style={{
            fontSize: '12px', fontWeight: 700, color: GOLD,
            border: '1px solid rgba(212,175,55,0.42)', background: 'rgba(212,175,55,0.08)',
            borderRadius: '999px', padding: '3px 11px', ...SAFE_TEXT,
          }}>💎 {planLabel}</span>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.42)', ...SAFE_TEXT }}>
            {req.sessionId ? clampToSlot(req.sessionId, 'chip') : ''}
          </span>
        </div>

        {/* 操作点 ①：一键模拟付款 */}
        <button
          data-testid={SANDBOX_PAY_BTN_TESTID}
          onClick={doPay}
          disabled={!!busy}
          style={{
            width: '100%', padding: '12px 20px', borderRadius: '13px', border: 'none',
            background: busy ? '#444' : 'linear-gradient(135deg, #2ECBF7 0%, #81D8D0 100%)',
            color: '#0D0D1A', fontSize: '15px', fontWeight: 800, letterSpacing: '0.3px',
            cursor: busy ? 'not-allowed' : 'pointer', marginBottom: '14px',
            boxShadow: busy ? 'none' : '0 4px 22px rgba(129,216,208,0.3)',
            ...SAFE_TEXT,
          }}
        >
          {busy === 'pay' ? '⏳ …' : `✨ ${term('SandboxPay')}`}
        </button>

        {/* 操作点 ②：特权券兑换 */}
        <div style={{ borderTop: '1px dashed rgba(255,255,255,0.10)', paddingTop: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: GOLD, marginBottom: '7px', ...SAFE_TEXT }}>
            🎟️ {term('SandboxVoucher')}
          </div>
          <div style={{ display: 'flex', gap: '8px', minWidth: 0 }}>
            <input
              data-testid={SANDBOX_CODE_INPUT_TESTID}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') doRedeem(); }}
              placeholder={term('SandboxCode')}
              spellCheck={false}
              autoComplete="off"
              style={{
                flex: 1, minWidth: 0, padding: '10px 12px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)',
                color: '#F5F1E6', fontSize: '13px', letterSpacing: '0.6px',
                textTransform: 'uppercase', outline: 'none', ...SAFE_TEXT,
              }}
            />
            <button
              data-testid={SANDBOX_REDEEM_BTN_TESTID}
              onClick={doRedeem}
              disabled={!!busy}
              style={{
                padding: '10px 16px', borderRadius: '10px',
                border: '1px solid rgba(212,175,55,0.45)', background: busy ? '#333' : 'rgba(212,175,55,0.1)',
                color: GOLD, fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap',
                cursor: busy ? 'not-allowed' : 'pointer', ...SAFE_TEXT,
              }}
            >
              {busy === 'redeem' ? '⏳' : term('SandboxRedeem')}
            </button>
          </div>
        </div>

        {/* 状态行（真实回执，而非装饰） */}
        {msg && (
          <div
            data-testid={SANDBOX_STATUS_TESTID}
            data-granted={msg.granted ? '1' : '0'}
            style={{
              marginTop: '12px', fontSize: '11px', lineHeight: 1.5, ...SAFE_TEXT,
              color: msg.granted ? '#A5D6A7' : '#FF8A80',
            }}
          >
            {msg.granted ? '✅ ' : '⚠️ '}{term(msg.messageKey)}
          </div>
        )}

        {/* 页脚：同源真验签说明 + 关闭 */}
        <div style={{
          marginTop: '14px', paddingTop: '10px', borderTop: '1px dashed rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', ...SAFE_TEXT }}>{term('SandboxOrigin')}</span>
          <button
            onClick={doClose}
            style={{
              padding: '6px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.18)',
              background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.72)',
              fontSize: '11px', fontWeight: 600, cursor: 'pointer', ...SAFE_TEXT,
            }}
          >
            {term('SandboxClose')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SandboxCashier;
