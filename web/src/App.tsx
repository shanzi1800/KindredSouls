import React, { useState, useEffect } from 'react';
import './i18n';


import { useTranslation } from 'react-i18next';
import { calculateCompatibility } from './lib/algos';
import { normalizeLang } from './lib/algos/i18n';
import type { CompatibilityResult } from './lib/algos/types';
import CelestialBackground from './components/CelestialBackground';
import PaywallCard from './components/PaywallCard';
import AuthWallCard from './components/AuthWallCard';
import { supabase } from './lib/supabase';
import './App.css';

/* ── Manual Date Input: configurable part order, auto-advance ── */
function DateInput({ value, onChange, onLastFilled, firstFieldRef, autoFocus }: { value: string; onChange: (v: string) => void; onLastFilled?: () => void; firstFieldRef?: React.RefObject<HTMLInputElement | null>; autoFocus?: boolean }) {
  const { i18n } = useTranslation();
  const lang = i18n.language || '';
  // 宽松匹配：任何 zh 开头（zh/zh-CN/zh-TW）都用年-月-日顺序
  const isZh = lang.startsWith('zh') || lang.includes('Chinese');
  const partDefs = isZh
    ? [{ key: 0, max: 4, ph: 'YYYY' }, { key: 1, max: 2, ph: 'MM' }, { key: 2, max: 2, ph: 'DD' }]
    : [{ key: 2, max: 2, ph: 'DD' }, { key: 1, max: 2, ph: 'MM' }, { key: 0, max: 4, ph: 'YYYY' }];

  const parts = (value ? value.split('-') : ['', '', '']).map(s => s || '');
  const refs = [React.useRef<HTMLInputElement>(null), React.useRef<HTMLInputElement>(null), React.useRef<HTMLInputElement>(null)];

  React.useImperativeHandle(firstFieldRef, () => refs[0].current!, []);

  const update = (idx: number, val: string) => {
    const p = [...parts];
    let cleaned = val.replace(/\D/g, '');
    if (idx === 0) { p[0] = cleaned.slice(0, 4); }
    else if (idx === 1) { p[1] = cleaned.slice(0, 2); if (p[1].length === 2 && parseInt(p[1]) > 12) p[1] = '12'; }
    else { p[2] = cleaned.slice(0, 2); if (p[2].length === 2 && parseInt(p[2]) > 31) p[2] = '31'; }
    const newVal = p.join('-');
    onChange(newVal);
  };

  const handleFieldChange = (partIdx: number, val: string) => {
    const def = partDefs[partIdx];
    update(def.key, val);
    const digits = val.replace(/\D/g, '').length;
    if (digits === def.max) {
      if (partIdx < partDefs.length - 1) {
        refs[partIdx + 1].current?.focus();
      } else if (partIdx === partDefs.length - 1) {
        onLastFilled?.();
      }
    }
  };

  return (
    <div className="date-manual">
      {partDefs.map((def, pi) => (
        <React.Fragment key={def.key}>
          {pi > 0 && <span className="date-slash">/</span>}
          <input ref={refs[pi]} className="date-part" type="text" inputMode="numeric"
            maxLength={def.max} placeholder={def.ph} value={parts[def.key]}
            onChange={e => handleFieldChange(pi, e.target.value)}
            autoFocus={autoFocus && pi === 0} />
        </React.Fragment>
      ))}
    </div>
  );
}

function InputPage({ onSubmit }: { onSubmit: (d1: string, d2: string) => void }) {
  const { t, i18n } = useTranslation();
  const [d1, setD1] = useState('');
  const [d2, setD2] = useState('');
  const [d2Key, setD2Key] = React.useState(0);
  const [dateError, setDateError] = useState('');
  const d2FirstRef = React.useRef<HTMLInputElement>(null);
  const jumpToD2 = () => { setD2Key(k => k + 1); setTimeout(() => d2FirstRef.current?.focus(), 80); };

  const validateDate = (val: string): string => {
    if (!val) return t('common.errorIncomplete');
    const parts = val.split('-');
    if (parts.length !== 3 || parts.some(p => !p)) return t('common.errorFormat');
    const [y, m, d] = parts.map(Number);
    const year = y, month = m, day = d;
    if (isNaN(year) || isNaN(month) || isNaN(day)) return t('common.errorFormat');
    if (year < 1900) return t('common.errorTooOld');
    const dateObj = new Date(year, month - 1, day);
    if (dateObj.getFullYear() !== year || dateObj.getMonth() !== month - 1 || dateObj.getDate() !== day) return t('common.errorInvalidDate');
    const now = new Date(); now.setHours(0,0,0,0);
    if (dateObj > now) return t('common.errorFutureDate');
    return '';
  };

  const submit = () => {
    setDateError('');
    if (!d1 || !d2) { setDateError(t('common.errorIncomplete')); return; }
    const err1 = validateDate(d1);
    if (err1) { setDateError(err1); return; }
    const err2 = validateDate(d2);
    if (err2) { setDateError(err2); return; }
    onSubmit(d1, d2);
  };

  const cycleLang = () => {
    const langs = ['en', 'zh', 'es', 'fr'];
    const base = (i18n.language || 'en').split('-')[0];
    const idx = langs.indexOf(base);
    const next = langs[(idx + 1) % langs.length];
    i18n.changeLanguage(next);
  };

  return (
    <div className="page input-page">
      {/* Video background */}
      <CelestialBackground />
      
      <button className="lang-switch" onClick={cycleLang}>🌐 {(() => { const b = (i18n.language||'en').split('-')[0]; return b==='zh'?'中文':b==='en'?'EN':b==='es'?'ES':'FR'; })() }</button>
      <h1 className="title">{t('input.title')}</h1>
      <p className="subtitle">{t('app.name')}</p>
      <p className="desc">{t('input.subtitle')}</p>
      <div className="form">
        <div className="date-field">
          <label className="date-label" htmlFor="d1">{t('input.yourBirthday')}</label>
          <DateInput value={d1} onChange={setD1} onLastFilled={jumpToD2} autoFocus />
        </div>
        <div className="date-field">
          <label className="date-label" htmlFor="d2">{t('input.theirBirthday')}</label>
          <DateInput value={d2} onChange={setD2} firstFieldRef={d2FirstRef} key={d2Key} />
        </div>
        <button className="btn btn-primary" onClick={submit}>{t('input.calculate')}</button>
        {dateError && <p className="date-error">{dateError}</p>}
      </div>
    </div>
  );
}

/* ── Loading Page ── */
function LoadingPage() {
  const { t } = useTranslation();
  return (
    <div className="page loading-page">
      <div className="spinner" />
      <p className="loading-text">{t('result.loading')}</p>
    </div>
  );
}

/* ── Score Ring ── */
function ScoreRing({ score }: { score: number }) {
  const R = 52, C = 2 * Math.PI * R;
  const offset = C - (score / 100) * C;
  return (
    <div className="score-ring">
      <svg viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={R} fill="none" stroke="#e8faf8" strokeWidth="10" />
        <circle cx="60" cy="60" r={R} fill="none" stroke="#81D8D0" strokeWidth="10"
          strokeLinecap="round" strokeDasharray={C} strokeDashoffset={offset}
          transform="rotate(-90 60 60)" style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(.4,0,.2,1)' }} />
        <text x="60" y="68" textAnchor="middle" fontSize="30" fontWeight="800" fill="#1A1F4B">{score}</text>
      </svg>
    </div>
  );
}

/* ── Dimension Bar ── */
const DIM_LABELS: Record<string, string[]> = {
  zh: ['爱情', '沟通', '默契', '稳定'],
  en: ['Love', 'Communication', 'Chemistry', 'Stability'],
  es: ['Amor', 'Comunicación', 'Química', 'Estabilidad'],
  fr: ['Amour', 'Communication', 'Chimie', 'Stabilité'],
};
const DIM_KEYS = ['love', 'communication', 'chemistry', 'stability'] as const;

function DimensionBars({ dims, lang }: { dims: CompatibilityResult['dimensions']; lang: string }) {
  const labels = DIM_LABELS[lang] || DIM_LABELS.en;
  return (
    <div className="dim-section">
      <h4 className="section-title">{lang==='zh'?'四维深度分析':lang==='es'?'Análisis en 4 Dimensiones':'Four-Dimension Breakdown'}</h4>
      {DIM_KEYS.map((key, i) => {
        const val = dims[key];
        return (
          <div className="dim-row" key={key}>
            <span className="dim-label">{labels[i]}</span>
            <div className="dim-bar-bg">
              <div className="dim-bar-fill" style={{ width: `${val}%` }} />
            </div>
            <span className="dim-val">{val}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Engine Detail Expander ── */
const ENGINE_ICONS: Record<string, string> = {
  bazi: '☯',
  zodiac: '✦',
  iching: '☰',
};

function EngineCard({ item }: { item: { key: string; label: string; e: CompatibilityResult['engines']['bazi'] } }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="engine-card">
      <div className="engine-card-header" onClick={() => setOpen(o => !o)}>
        <div className="engine-left">
          <span className="engine-icon">{ENGINE_ICONS[item.key]}</span>
          <div className="engine-info">
            <span className="engine-name">{item.label}</span>
            <span className="engine-summary">{item.e.summary}</span>
          </div>
        </div>
        <div className="engine-right">
          <span className="engine-score">{item.e.score}</span>
          <span className={`chevron ${open ? 'open' : ''}`}>›</span>
        </div>
      </div>
      {open && (
        <div className="engine-detail">
          {item.e.detail.split('\n').map((line, i) => {
            if (!line.trim()) return null;
            if (/^【/.test(line)) {
              return <p key={i} className="detail-heading">{line}</p>;
            }
            return <p key={i} className="detail-line">{line}</p>;
          })}
        </div>
      )}
    </div>
  );
}

/* ── AI Insight (button-triggered + Auth + Stripe Paywall) ── */
function AIInsightBlock({ d1, d2, overall, dims, bazi, zodiac, iching, lang, onTriggerInsight, pendingInsightTrigger, onLogout }: {
  d1: string; d2: string; overall: number;
  dims: CompatibilityResult['dimensions'];
  bazi: string; zodiac: string; iching: string;
  lang: string;
  onTriggerInsight?: () => void;
  pendingInsightTrigger?: boolean;
  onLogout?: () => void;
}) {
  const [insight, setInsight] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAuthWall, setShowAuthWall] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isAuthParsing, setIsAuthParsing] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [paidStatus, setPaidStatus] = useState<boolean | null>(null);
  // 🔑 状态驱动：全局持有受信任的 access token
  const [currentAccessToken, setCurrentAccessToken] = useState<string | null>(null);

  // 🚀 Watch pendingInsightTrigger from parent (App) and auto-trigger
  useEffect(() => {
    if (pendingInsightTrigger) {
      console.log('[KindredSouls Debug] pendingInsightTrigger=true, calling triggerInsight');
      triggerInsight();
    }
  }, [pendingInsightTrigger]);

  // ── Auth 状态监听（唯一入口）──
  useEffect(() => {
    console.log('[KindredSouls Debug] Supabase URL:', (import.meta as any).env?.VITE_SUPABASE_URL || 'MISSING');

    // ── Auth 状态监听（唯一入口）──
    // 注意：OAuth pre-capture 已移到 supabase.ts（模块加载时，createClient 之前）
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // 核心防呆：判断当前是否处于 OAuth 回调中
      // 优先用 sessionStorage 标志位（因为 SDK 可能已清理 hash）
      const isOAuthCallback = sessionStorage.getItem('ks_oauth_in_progress') === '1' ||
                                window.location.hash.includes('access_token=') ||
                                window.location.search.includes('code=');

      console.log(`[KindredSouls Auth] Event: ${event}, Session Exists: ${!!session}, IsCallback: ${isOAuthCallback}`);

      // 🛑 Token 更新（统一入口）
      if (session?.access_token) {
        setCurrentAccessToken(session.access_token);
        sessionStorage.setItem('ks_access_token', session.access_token);
      } else {
        setCurrentAccessToken(null);
        sessionStorage.removeItem('ks_access_token');
      }

      if (event === 'INITIAL_SESSION') {
        setSessionChecked(true);
        if (session?.access_token) {
          // ✅ 有活跃 session → 直接放行
          sessionStorage.removeItem('ks_oauth_in_progress');
          setShowAuthWall(false);
          setIsAuthParsing(false);
          checkPaidStatus(session.access_token);
          const pending = localStorage.getItem('ks_pending_checkout');
          if (pending === 'true') {
            localStorage.removeItem('ks_pending_checkout');
            handlePurchaseWithToken(session.access_token, 'insight_once');
          }
          triggerSaveResult(session.access_token, session.user.id);
        } else if (isOAuthCallback) {
          // 🌟 绝杀卡点：发现是 OAuth 回调 → 锁死加载状态，绝对不显示登录墙！
          setIsAuthParsing(true);
          setShowAuthWall(false);
          console.log('[KindredSouls Auth] OAuth callback detected, locking loading state...');

          // 保底补查：给 SDK 最后机会
          const { data } = await supabase.auth.getSession();
          if (!data.session) {
            console.log('[KindredSouls Auth] getSession backup also null, 500ms safety net...');
            setTimeout(async () => {
              const { data: { session: snapSession } } = await supabase.auth.getSession();
              if (!snapSession) {
                console.log('[KindredSouls Auth] Safety net expired, showing auth wall');
                sessionStorage.removeItem('ks_oauth_in_progress');
                setShowAuthWall(true);
              }
              setIsAuthParsing(false);
            }, 500);
          } else {
            console.log('[KindredSouls Auth] getSession backup found session!');
            setIsAuthParsing(false);
          }
        } else {
          // ❌ 真正未登录的用户 → 显示登录墙
          sessionStorage.removeItem('ks_oauth_in_progress');
          setShowAuthWall(true);
          setIsAuthParsing(false);
        }
      } else if (event === 'SIGNED_IN') {
        console.log('[KindredSouls Auth] 🎉 SIGNED_IN captured, releasing paywall');
        sessionStorage.removeItem('ks_oauth_in_progress');
        // ✅ Session 已建立，安全清除 URL hash
        window.history.replaceState({}, '', '/result');
        setIsAuthParsing(false);
        setSessionChecked(true);
        setShowAuthWall(false);
        checkPaidStatus(session!.access_token);
        const pending = localStorage.getItem('ks_pending_checkout');
        if (pending === 'true') {
          localStorage.removeItem('ks_pending_checkout');
          handlePurchaseWithToken(session!.access_token, 'insight_once');
        }
        triggerSaveResult(session!.access_token, session!.user.id);
      } else if (event === 'SIGNED_OUT') {
        setCurrentAccessToken(null);
        setShowAuthWall(true);
        setIsAuthParsing(false);
        setPaidStatus(null);
        setInsight(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);
  const checkPaidStatus = async (_token?: string) => {
    console.log('[KindredSouls Debug] checkPaidStatus called, token exists:', !!_token);
    
    // 15秒超时，Supabase偶尔慢
    const timeout = setTimeout(() => {
      console.log('[KindredSouls Debug] checkPaidStatus timeout, showing paywall');
      setPaidStatus(false);
      setShowPaywall(true);
    }, 15000);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        clearTimeout(timeout);
        setPaidStatus(false);
        setShowPaywall(true);
        return;
      }
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_profiles?select=paid&user_id=eq.${user.id}`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      clearTimeout(timeout);
      if (!res.ok) {
        setPaidStatus(false);
        setShowPaywall(true);
        return;
      }
      const profiles = await res.json();
      console.log('[KindredSouls Debug] checkPaidStatus profiles:', profiles);
      const paid = Array.isArray(profiles) && profiles.some(p => p.paid === true);
      if (paid) {
        console.log('[KindredSouls Debug] checkPaidStatus: user is PAID');
        setPaidStatus(true);
        setShowPaywall(false);
      } else {
        console.log('[KindredSouls Debug] checkPaidStatus: user is NOT paid, showPaywall=true');
        setPaidStatus(false);
        setShowPaywall(true);
      }
    } catch (err) {
      clearTimeout(timeout);
      console.error('[KindredSouls Debug] checkPaidStatus error:', err);
      setPaidStatus(false);
      setShowPaywall(true);
    }
  };
  // ── Save result to Supabase（只在有 token 时调用）──
  const triggerSaveResult = (token: string, uid: string) => {
    const saved = localStorage.getItem('ks_result');
    if (!saved) return;
    try {
      const data = JSON.parse(saved);
      fetch('/api/save-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...data, user_id: uid }),
      }).catch(() => {});
    } catch {}
  };

  // ── handlePurchase 核心逻辑（接收明确的 token 参数）──

  const handlePurchaseWithToken = async (token: string, plan: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan }),
      });
      if (res.status === 401) {
        console.log('[KindredSouls Debug] 401 from create-checkout, forcing re-login');
        setShowAuthWall(true);
        setShowPaywall(false);
        setPaidStatus(null);
        return;
      }
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.already_paid) {
        setPaidStatus(true);
        setShowPaywall(false);
      } else {
        setError(data.error || 'Checkout failed');
      }
    } catch {
      setError('Network error — please check your connection');
    } finally {
      setLoading(false);
    }
  };

  // ── handlePurchase 入口：优先用全局 token，兜底 refreshSession ──


  const handlePurchase = async (plan: string) => {
    console.log('[KindredSouls Debug] handlePurchase called. currentAccessToken:', !!currentAccessToken, 'paidStatus:', paidStatus, 'showPaywall:', showPaywall, 'showAuthWall:', showAuthWall);

    let token = currentAccessToken;

    if (!token) {
      // 兜底：先 refreshSession（处理过期 token），再 getSession
      console.log('[KindredSouls Debug] No currentAccessToken, trying refreshSession...');
      try {
        const { data: { session: refreshed } } = await supabase.auth.refreshSession();
        token = refreshed?.access_token || null;
        console.log('[KindredSouls Debug] refreshSession token:', !!token);
      } catch (e) {
        console.warn('[KindredSouls Debug] refreshSession failed, falling back to getSession');
      }
    }

    if (!token) {
      const { data: { session } } = await supabase.auth.getSession();
      token = session?.access_token || null;
      console.log('[KindredSouls Debug] getSession fallback token:', !!token);
    }

    // 如果仍然没有 token，等待最多 3 秒让 SIGNED_IN 事件触发
    if (!token) {
      console.log('[KindredSouls Debug] No token yet, waiting for SIGNED_IN event (max 3s)...');
      token = await new Promise<string | null>((resolve) => {
        let done = false;
        const t = setTimeout(() => {
          if (!done) { done = true; resolve(null); }
        }, 3000);
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.access_token) {
            clearTimeout(t);
            if (!done) { done = true; subscription.unsubscribe(); }
            resolve(session.access_token);
          }
        });
      });
      console.log('[KindredSouls Debug] After waiting, token:', !!token);
    }

    if (!token) {
      console.warn('[KindredSouls Debug] No token found after waiting, showing AuthWall');
      setShowAuthWall(true);
      return;
    }

    return handlePurchaseWithToken(token, plan);
  };
  const triggerInsight = async (token?: string) => {
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/ai-insight', {
        method: 'POST',
        headers,
        body: JSON.stringify({ d1, d2, overall, dims, bazi, zodiac, iching, lang }),
      });
      const data = await res.json();
      if (data.insight) {
        setInsight(data.insight);
        onTriggerInsight?.();
      }
      else setError(data.error || 'Unable to generate insight');
    } catch {
      setError('Network error — please check your connection');
    } finally {
      setLoading(false);
    }
  };
  // ── 体验兜底：OAuth 回调解析期间显示优雅加载状态，不弹登录墙 ──
  const urlHasToken = typeof window !== 'undefined' && (window.location.hash.includes('access_token=') || sessionStorage.getItem('ks_oauth_in_progress') === '1');
  if (!sessionChecked || (paidStatus === null && !showAuthWall) || isAuthParsing) {
    return (
      <div className="ai-insight" style={{ textAlign: 'center', padding: '20px' }}>
        <div className="insight-skeleton">
          <div className="skeleton-line w80" /><div className="skeleton-line w60" /><div className="skeleton-line w90" />
        </div>
        {urlHasToken && (
          <p style={{ marginTop: '16px', fontSize: '14px', color: '#888' }}>
            {lang === 'zh' ? '🔮 正在链接命运星盘，请稍候...' : '🔮 Connecting to your cosmic profile...'}
          </p>
        )}
      </div>
    );
  }
  // 🔒 如果 URL 有 token 但 session 未就绪，继续等待，不显示登录墙
  if (urlHasToken && !currentAccessToken && !sessionChecked) {
    console.log('[KindredSouls Debug] URL has token but session not ready, waiting...');
    return (
      <div className="ai-insight" style={{ textAlign: 'center', padding: '20px' }}>
        <div className="insight-skeleton">
          <div className="skeleton-line w80" /><div className="skeleton-line w60" /><div className="skeleton-line w90" />
        </div>
        <p style={{ marginTop: '16px', fontSize: '14px', color: '#888' }}>
          {lang === 'zh' ? '🔒 正在安全验证您的账户...' : '🔒 Verifying your account...'}
        </p>
      </div>
    );
  }
  // Auth wall — not logged in
  if (showAuthWall && insight === null) {
    return (
      <div className="ai-insight">
        <h3 style={{ marginBottom: '18px' }}>✨ {lang==='zh'?'AI 深度洞察':lang==='es'?'Perspectiva AI':'AI Insight'}</h3>
        <div style={{ position: 'relative', borderRadius: '16px', overflow: 'visible', minHeight: '460px' }}>
          <div style={{
            filter: 'blur(10px)', opacity: 0.35, padding: '20px 16px',
            background: 'rgba(212,175,55,0.04)', borderRadius: '16px',
            border: '1px solid rgba(212,175,55,0.12)',
          }}>
            <p style={{ fontSize: '13px', lineHeight: 1.7 }}>{lang==='zh'
              ? '🌙 你们的关系中存在一种罕见的灵魂共振……月亮与金星的相位暗示着深刻的情感连接，这种配置在人群中仅占 3%。当你们真正敞开心扉时，会产生一种近乎「心灵感应」的默契。'
              : '🌙 A rare soul resonance exists between you two… The Moon-Venus aspect suggests a profound emotional connection found in only 3% of couples.'}
            </p>
          </div>
          <div style={{
            position: 'relative', zIndex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px 0',
          }}>
            <AuthWallCard lang={lang} />
          </div>
        </div>
      </div>
    );
  }
  // Stripe paywall — logged in but not paid
  // ── 付费墙：已登录未付费时显示（无论 insight 是否有预览）──
  console.log('[KindredSouls Debug] AIInsightBlock render: showPaywall=', showPaywall, 'showAuthWall=', showAuthWall, 'insight=', !!insight);
  if (showPaywall) {
    return (
      <div className="ai-insight">
        <h3 style={{ marginBottom: '18px' }}>✨ {lang==='zh'?'AI 深度洞察':lang==='es'?'Perspectiva AI':'AI Insight'}</h3>
        <div style={{ position: 'relative', borderRadius: '16px', overflow: 'visible', marginBottom: '20px', minHeight: '420px' }}>
          <div style={{
            filter: 'blur(10px)', opacity: 0.35, padding: '20px 16px',
            background: 'rgba(212,175,55,0.04)', borderRadius: '16px',
            border: '1px solid rgba(212,175,55,0.12)',
            position: 'absolute', inset: 0,
          }}>
            <p style={{ fontSize: '13px', lineHeight: 1.7 }}>{lang==='zh'
              ? '🌙 你们的关系中存在一种罕见的灵魂共振……月亮与金星的相位暗示着深刻的情感连接，这种配置在人群中仅占 3%。'
              : '🌙 A rare soul resonance exists between you two… The Moon-Venus aspect suggests a profound emotional connection found in only 3% of couples.'}
            </p>
          </div>
          <div style={{
            position: 'relative', zIndex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px 0',
          }}>
            <PaywallCard lang={lang} loading={loading} onPurchase={handlePurchase} />
          </div>
        </div>
      </div>
    );
  }
  // Logged in — show button or result
  return (
    <div className="ai-insight">
      <h3>✨ {lang==='zh'?'AI 深度洞察':lang==='es'?'Perspectiva AI':'AI Insight'}</h3>
      {!insight && !loading && !error && (
        <button
          onClick={() => triggerInsight()}
          style={{
            width: '100%', padding: '14px 24px', borderRadius: '12px', border: 'none',
            background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
            color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
            transition: 'all 0.3s ease', boxShadow: '0 4px 20px rgba(212,175,55,0.3)',
          }}
        >
          ✨ {lang==='zh'?'生成 AI 洞察':lang==='es'?'Generar Perspectiva AI':'Generate AI Insight'}
        </button>
      )}
      {loading && <div className="insight-skeleton"><div className="skeleton-line w80" /><div className="skeleton-line w60" /><div className="skeleton-line w90" /><div className="skeleton-line w70" /></div>}
      {error && <p style={{ color: '#ff6b6b', marginTop: '8px' }}>{error}</p>}
      {insight && (
        <div className="insight-result">
          <p>{insight}</p>
          <button
            onClick={onLogout}
            style={{
              marginTop: '16px',
              padding: '6px 14px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '6px',
              color: '#999',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'block',
              margin: '16px auto 0',
            }}
          >
            {lang === 'zh' ? '退出登录' : 'Sign Out'}
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Result Page ── */
function ResultPage({ result, onBack, lang, pendingInsightTrigger = false, setPendingInsightTrigger, onLogout }: { result: CompatibilityResult; onBack: () => void; lang: string; pendingInsightTrigger?: boolean; setPendingInsightTrigger?: (v: boolean) => void; onLogout?: () => void }) {
  const { t } = useTranslation();
  const { overall, engines, dimensions } = result;

  const engineList = [
    { key: 'bazi', label: t('result.engines.bazi'), e: engines.bazi },
    { key: 'zodiac', label: t('result.engines.zodiac'), e: engines.zodiac },
    { key: 'iching', label: t('result.engines.iching'), e: engines.iching },
  ];

  // ── Collapsible state for mobile ──
  const [showDetails, setShowDetails] = useState(false);

  // Auto-trigger AI insight after Stripe payment success
  useEffect(() => {
    if (sessionStorage.getItem('ks_payment_success') === '1') {
      sessionStorage.removeItem('ks_payment_success');
      console.log('[KindredSouls Debug] Auto-triggering AI insight after payment success');
      setPendingInsightTrigger && setPendingInsightTrigger(true);
    }
  }, []);

  return (
    <div className="page result-page">
      <button className="back-btn" onClick={onBack}>← {t('result.back')}</button>

      <ScoreRing score={overall} />
      <p className="score-label">{t('result.overall')}</p>

      <DimensionBars dims={dimensions} lang={lang} />

      {/* ── Collapsible Details (Engine Cards + Aspects) ── */}
      <div style={{ marginTop: '24px' }}>
        <button
          onClick={() => setShowDetails(!showDetails)}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid rgba(26,31,75,0.15)',
            background: showDetails ? 'rgba(26,31,75,0.05)' : '#fff',
            color: '#1A1F4B',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{showDetails ? (lang==='zh'?'收起详情 ▲':'Hide Details ▲') : (lang==='zh'?'查看完整分析 ▼':'View Full Analysis ▼')}</span>
        </button>
        {showDetails && (
          <div style={{ marginTop: '16px' }}>
            <div className="engine-cards">
              {engineList.map(item => (
                <EngineCard item={item} key={item.key} />
              ))}
            </div>

            {(result.luckyAspects.length > 0 || result.challengingAspects.length > 0) && (
              <div className="aspects" style={{ marginTop: '20px' }}>
                {result.luckyAspects.length > 0 && (
                  <div className="aspect-group">
                    <h4>🌟 {t('result.luckyAspects')}</h4>
                    {result.luckyAspects.map((a, i) => <span className="tag tag-good" key={i}>{a}</span>)}
                  </div>
                )}
                {result.challengingAspects.length > 0 && (
                  <div className="aspect-group">
                    <h4>⚡ {t('result.challengingAspects')}</h4>
                    {result.challengingAspects.map((a, i) => <span className="tag tag-warn" key={i}>{a}</span>)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <AIInsightBlock
        d1={result._d1!}
        d2={result._d2!}
        overall={overall}
        dims={dimensions}
        bazi={engines.bazi.detail}
        zodiac={engines.zodiac.detail}
        iching={engines.iching.detail}
        lang={lang}
        pendingInsightTrigger={pendingInsightTrigger}
        onLogout={onLogout}
      />

      <button className="btn btn-secondary" onClick={onBack} style={{ marginTop: '20px' }}>{t('result.back')}</button>
    </div>
  );
}

/* ── App ── */
export default function App() {
  const { t, i18n } = useTranslation();
  const handleLogout = async () => {
    const { supabase } = await import('./lib/supabase');
    await supabase.auth.signOut();
    localStorage.removeItem('ks_result_data');
    localStorage.removeItem('ks_return_to_result');
    localStorage.removeItem('ks_pending_checkout');
    sessionStorage.removeItem('ks_access_token');
    window.location.reload();
  };
  const [_page, _setPage] = useState<'input' | 'loading' | 'result'>(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/result') {
      return 'result';
    }
    return 'input';
  });
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [err, setErr] = useState('');
  const [userId, setUserId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ks_user_id');
    }
    return null;
  });
  // Track current language in React state (always in sync with i18n)
  const [currentLang, setCurrentLang] = useState<string>(() => i18n.language || 'en');
// ✅ Restore result page after OAuth login or payment success (not every refresh)
 const [pendingInsightTrigger, setPendingInsightTrigger] = useState(false);
 useEffect(() => {
 const search = window.location.search;
 const paymentSuccess = new URLSearchParams(window.location.search).get('payment') === 'success';
 // Detect OAuth callback: Supabase returns with access_token or code in URL hash
 const isOAuthCallback = window.location.hash.includes('access_token=') || window.location.hash.includes('type=') || search.includes('code=');
 const justLoggedIn = localStorage.getItem('ks_just_logged_in');
 const savedResult = localStorage.getItem('ks_result') || sessionStorage.getItem('ks_result');
 console.log('[KindredSouls Debug] Restore check:', { isOAuthCallback, paymentSuccess, justLoggedIn, pathname: window.location.pathname, hasResult: !!savedResult });
 // Restore result page if returning from OAuth or payment
 if (paymentSuccess) {
 // Stripe payment callback — set flag for auto-trigger, then clean URL
 sessionStorage.setItem('ks_payment_success', '1');
 console.log('[KindredSouls Debug] ✅ Payment success detected, set ks_payment_success flag');
 // Clean payment param from URL without full reload
 const cleanUrl = window.location.pathname;
 window.history.replaceState({}, '', cleanUrl);
 }
 if ((isOAuthCallback || justLoggedIn || paymentSuccess) && savedResult) {
 try {
 const r = JSON.parse(savedResult);
 setResult(r);
 _setPage('result');
 console.log('[KindredSouls Debug] ✅ Restored result page after OAuth/payment');
 if (justLoggedIn) localStorage.removeItem('ks_just_logged_in');
 } catch (e) {
 console.error('[KindredSouls Debug] Failed to parse ks_result:', e);
 localStorage.removeItem('ks_result');
 }
 } else if (!isOAuthCallback && !justLoggedIn && !paymentSuccess) {
 // Only clear ks_result if NOT returning from OAuth/payment
 localStorage.removeItem('ks_result');
 }
 }, []);

  React.useEffect(() => {
    const handler = (lng: string) => setCurrentLang(lng);
    i18n.on('languageChanged', handler);
    return () => { i18n.off('languageChanged', handler); };
  }, [i18n]);


  const handleCalculate = (d1: string, d2: string) => {
    setErr('');
    _setPage('loading');
    // Ensure we have a user_id
    let uid = userId;
    if (!uid) {
      uid = crypto.randomUUID();
      localStorage.setItem('ks_user_id', uid);
      setUserId(uid);
    }
    // Always normalize to supported lang to avoid SHARED[lang] undefined
    const rawLang = (i18n.language || 'en').split('-')[0];
    const lang = normalizeLang(rawLang);
    console.log('[KindredSouls Debug] rawLang=' + rawLang + ' normalized=' + lang);
    setTimeout(() => {
      console.log('[KindredSouls Debug] lang=' + lang);
      const res = calculateCompatibility(d1, d2, lang);
      if ('error' in res) {
        setErr(t('common.errorFormat'));
        _setPage('input');
      } else {
        // Attach dates for AI insight call
        const r = res as CompatibilityResult & { _d1: string; _d2: string };
        r._d1 = d1;
        r._d2 = d2;
        setResult(r);
        _setPage('result');
        // ✅ 更新 URL hash，确保 OAuth 回调后能跳回正确页面
        window.history.pushState({}, '', '/result');
        // ✅ 存 result 到 localStorage（OAuth 回调后恢复页面用）
        localStorage.setItem('ks_result', JSON.stringify(r));
sessionStorage.setItem('ks_result', JSON.stringify(r));
		sessionStorage.setItem('ks_just_logged_in', '1');
		localStorage.setItem('ks_just_logged_in', '1');
        console.log('[KindredSouls Debug] Saved result to localStorage');
      }
    }, 800);
  };

  return (
    <div className="app">
      { _page === 'input' && <InputPage onSubmit={handleCalculate} />}
      { _page === 'loading' && <LoadingPage />}
      { _page === 'result' && result && <ResultPage result={result} onBack={() => { localStorage.removeItem('ks_return_to_result'); localStorage.removeItem('ks_result'); setResult(null); _setPage('input'); window.history.pushState({}, '', '/'); }} lang={currentLang} pendingInsightTrigger={pendingInsightTrigger} setPendingInsightTrigger={setPendingInsightTrigger} onLogout={handleLogout} />}
      {err && <p className="error-msg">{err}</p>}
    </div>
  );
}
