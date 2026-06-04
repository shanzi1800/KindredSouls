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
  const d2FirstRef = React.useRef<HTMLInputElement>(null);
  const jumpToD2 = () => { setD2Key(k => k + 1); setTimeout(() => d2FirstRef.current?.focus(), 80); };

  const submit = () => {
    if (!d1 || !d2) { alert(t('common.errorIncomplete')); return; }
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
function AIInsightBlock({ d1, d2, overall, dims, bazi, zodiac, iching, lang }: {
  d1: string; d2: string; overall: number;
  dims: CompatibilityResult['dimensions'];
  bazi: string; zodiac: string; iching: string;
  lang: string;
}) {
  const [insight, setInsight] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAuthWall, setShowAuthWall] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [paidStatus, setPaidStatus] = useState<boolean | null>(null);
  // 🔑 状态驱动：全局持有受信任的 access token
  const [currentAccessToken, setCurrentAccessToken] = useState<string | null>(null);

  // ── Auth 状态监听（唯一入口）──
  useEffect(() => {
    console.log('[KindredSouls Debug] Supabase URL:', (import.meta as any).env?.VITE_SUPABASE_URL || 'MISSING');

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`[KindredSouls Debug] onAuthStateChange event: ${event}`, !!session, 'token:', !!session?.access_token, 'paidStatus:', paidStatus);

      // 🛑 核心拦截点：只有 token 明确存在时，才更新全局状态
      if (session?.access_token) {
        setCurrentAccessToken(session.access_token);
      } else {
        setCurrentAccessToken(null);
      }

      if (event === 'SIGNED_IN' && session?.access_token) {
        // 🚀 只有 SIGNED_IN 阶段 Token 才 100% Ready
        setSessionChecked(true);
        setShowAuthWall(false);
        checkPaidStatus(session.access_token);
        // 自动触发 Checkout（如果标志位存在）
        const pending = localStorage.getItem('ks_pending_checkout');
        if (pending === 'true') {
          localStorage.removeItem('ks_pending_checkout');
          handlePurchaseWithToken(session.access_token, 'insight_once');
        }
        // Auto-save result to Supabase
        triggerSaveResult(session.access_token, session.user.id);
      } else if (event === 'INITIAL_SESSION') {
        setSessionChecked(true);
        if (session?.access_token) {
          // INITIAL_SESSION 有 token 时也可以执行高权限操作
          setShowAuthWall(false);
          checkPaidStatus(session.access_token);
          const pending = localStorage.getItem('ks_pending_checkout');
          if (pending === 'true') {
            localStorage.removeItem('ks_pending_checkout');
            handlePurchaseWithToken(session.access_token, 'insight_once');
          }
          triggerSaveResult(session.access_token, session.user.id);
        } else if (session?.user) {
          // 有 user 但没 token → 静默等待 SIGNED_IN 触发
          setShowAuthWall(false);
          console.log('[KindredSouls Debug] INITIAL_SESSION has user but no token, waiting for SIGNED_IN...');
        } else {
          setShowAuthWall(true);
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentAccessToken(null);
        setShowAuthWall(true);
        setPaidStatus(null);
        setInsight(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);
  // Check URL for payment success on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      setPaidStatus(true);
      setShowPaywall(false);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);
  const checkPaidStatus = async (_token?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setPaidStatus(false);
        setShowPaywall(true);
        return;
      }
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_profiles?select=paid&id=eq.${user.id}`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!res.ok) {
        setPaidStatus(false);
        setShowPaywall(true);
        return;
      }
      const profiles = await res.json();
      const paid = profiles?.[0]?.paid === true;
      if (paid) {
        setPaidStatus(true);
        setShowPaywall(false);
      } else {
        setPaidStatus(false);
        setShowPaywall(true);
      }
    } catch (err) {
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

  // ── handlePurchase 入口：优先用全局 token，兜底 getSession ──
  const handlePurchase = async (plan: string) => {
    console.log('[KindredSouls Debug] handlePurchase called. currentAccessToken:', !!currentAccessToken, 'paidStatus:', paidStatus, 'showPaywall:', showPaywall, 'showAuthWall:', showAuthWall);

    let token = currentAccessToken;

    if (!token) {
      // 兜底：从 client 缓存捞一次
      const { data: { session } } = await supabase.auth.getSession();
      token = session?.access_token || null;
      console.log('[KindredSouls Debug] getSession fallback token:', !!token);
    }

    if (!token) {
      console.warn('[KindredSouls Debug] No token found, showing AuthWall');
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
      if (data.insight) setInsight(data.insight);
      else setError(data.error || 'Unable to generate insight');
    } catch {
      setError('Network error — please check your connection');
    } finally {
      setLoading(false);
    }
  };
  // Loading state
  if (!sessionChecked || (paidStatus === null && !showAuthWall)) {
    return (
      <div className="ai-insight" style={{ textAlign: 'center', padding: '20px' }}>
        <div className="insight-skeleton">
          <div className="skeleton-line w80" /><div className="skeleton-line w60" /><div className="skeleton-line w90" />
        </div>
      </div>
    );
  }
  // Auth wall — not logged in
  if (showAuthWall && insight === null) {
    return (
      <div className="ai-insight">
        <h3 style={{ marginBottom: '18px' }}>✨ {lang==='zh'?'AI 深度洞察':lang==='es'?'Perspectiva AI':'AI Insight'}</h3>
        <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden' }}>
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
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(10,12,28,0.55)', backdropFilter: 'blur(6px)',
            borderRadius: '16px',
          }}>
            <AuthWallCard lang={lang} />
          </div>
        </div>
      </div>
    );
  }
  // Stripe paywall — logged in but not paid
  if (showPaywall && insight === null) {
    return (
      <div className="ai-insight">
        <h3 style={{ marginBottom: '18px' }}>✨ {lang==='zh'?'AI 深度洞察':lang==='es'?'Perspectiva AI':'AI Insight'}</h3>
        <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', marginBottom: '20px' }}>
          <div style={{
            filter: 'blur(10px)', opacity: 0.35, padding: '20px 16px',
            background: 'rgba(212,175,55,0.04)', borderRadius: '16px',
            border: '1px solid rgba(212,175,55,0.12)',
          }}>
            <p style={{ fontSize: '13px', lineHeight: 1.7 }}>{lang==='zh'
              ? '🌙 你们的关系中存在一种罕见的灵魂共振……月亮与金星的相位暗示着深刻的情感连接，这种配置在人群中仅占 3%。'
              : '🌙 A rare soul resonance exists between you two… The Moon-Venus aspect suggests a profound emotional connection found in only 3% of couples.'}
            </p>
          </div>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(10,12,28,0.55)', backdropFilter: 'blur(6px)',
            borderRadius: '16px',
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
        </div>
      )}
    </div>
  );
}

/* ── Result Page ── */
function ResultPage({ result, onBack, lang }: { result: CompatibilityResult; onBack: () => void; lang: string }) {
  const { t } = useTranslation();
  const { overall, engines, dimensions } = result;

  const engineList = [
    { key: 'bazi', label: t('result.engines.bazi'), e: engines.bazi },
    { key: 'zodiac', label: t('result.engines.zodiac'), e: engines.zodiac },
    { key: 'iching', label: t('result.engines.iching'), e: engines.iching },
  ];



  return (
    <div className="page result-page">
      <button className="back-btn" onClick={onBack}>← {t('result.back')}</button>

      <ScoreRing score={overall} />
      <p className="score-label">{t('result.overall')}</p>

      <DimensionBars dims={dimensions} lang={lang} />

      <div className="engine-cards">
        {engineList.map(item => (
          <EngineCard item={item} key={item.key} />
        ))}
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
      />

      {(result.luckyAspects.length > 0 || result.challengingAspects.length > 0) && (
        <div className="aspects">
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

      <button className="btn btn-secondary" onClick={onBack}>{t('result.back')}</button>
    </div>
  );
}

/* ── App ── */
export default function App() {
  const { t, i18n } = useTranslation();
  const [_page, _setPage] = useState<'input' | 'loading' | 'result'>('input');
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
 // ✅ Restore result page only after OAuth login (not every refresh)
 useEffect(() => {
 const justLoggedIn = sessionStorage.getItem('ks_just_logged_in');
 if (justLoggedIn && window.location.hash === '#/result') {
 const saved = localStorage.getItem('ks_result');
 if (saved) {
 try {
 const r = JSON.parse(saved);
 setResult(r);
 _setPage('result');
 console.log('[KindredSouls Debug] Restored result page after OAuth login');
 } catch (e) {
 localStorage.removeItem('ks_result');
 }
 }
 sessionStorage.removeItem('ks_just_logged_in');
 } else {
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
        window.location.hash = '#/result';
        // ✅ 存 result 到 localStorage（OAuth 回调后恢复页面用）
        localStorage.setItem('ks_result', JSON.stringify(r));
		sessionStorage.setItem('ks_just_logged_in', '1');
        console.log('[KindredSouls Debug] Saved result to localStorage');
      }
    }, 800);
  };

  return (
    <div className="app">
      { _page === 'input' && <InputPage onSubmit={handleCalculate} />}
      { _page === 'loading' && <LoadingPage />}
      { _page === 'result' && result && <ResultPage result={result} onBack={() => { localStorage.removeItem('ks_return_to_result'); localStorage.removeItem('ks_result'); setResult(null); _setPage('input'); window.location.hash = '#/'; }} lang={currentLang} />}
      {err && <p className="error-msg">{err}</p>}
    </div>
  );
}
