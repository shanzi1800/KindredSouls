import React, { useState, useEffect } from 'react';
import './i18n';
import { useTranslation } from 'react-i18next';
import { calculateCompatibility } from './lib/algos';
import { normalizeLang } from './lib/algos/i18n';
import type { CompatibilityResult } from './lib/algos/types';
import CelestialBackground from './components/CelestialBackground';
import AuthButton from './components/AuthButton';
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
  const [showAuthWall, setShowAuthWall] = useState(false);   // not logged in
  const [showPaywall, setShowPaywall] = useState(false);     // logged in but not paid
  const [sessionChecked, setSessionChecked] = useState(false);
  const [paidStatus, setPaidStatus] = useState<boolean | null>(null);

  // Check auth + payment status on mount
  useEffect(() => {
    console.log('[KindredSouls Debug] Supabase URL:', (import.meta as any).env?.VITE_SUPABASE_URL || 'MISSING');
    supabase.auth.getSession().then(({ data: { session }, error }: any) => {
      console.log('[KindredSouls Debug] getSession result:', !!session?.user, error);
      setSessionChecked(true);
      if (!session?.user) {
        setShowAuthWall(true);
      } else {
        setShowAuthWall(false);
        // Check if user has paid
        checkPaidStatus(session.access_token);
      }
    });
  }, []);

  // Listen for auth state changes (critical: catches OAuth callback return)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[KindredSouls Debug] onAuthStateChange:', event, !!session?.user);
      
      // 只要有 session 且 sessionStorage 有存 URL，就跳回去（覆盖 SIGNED_IN / INITIAL_SESSION 所有情况）
      if (session?.user) {
        setShowAuthWall(false);
        const redirectUrl = sessionStorage.getItem('ks_redirect_after_login');
        if (redirectUrl) {
          sessionStorage.removeItem('ks_redirect_after_login');
          console.log('[KindredSouls Debug] Restoring pre-login page:', redirectUrl);
          window.location.href = redirectUrl;
          return;
        }
        checkPaidStatus(session.access_token);
      } else if (event === 'SIGNED_OUT') {
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
      // Payment just completed — mark as paid and trigger insight
      setPaidStatus(true);
      setShowPaywall(false);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const checkPaidStatus = async (token: string) => {
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan: 'check' }),
      });
      const data = await res.json();
      if (data.already_paid) {
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

  const handlePurchase = async (plan: string) => {
    // Try to refresh session first to ensure token is valid
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      console.log('[KindredSouls Debug] refreshSession failed:', refreshError.message);
    }
    
    const session = refreshData?.session;
    console.log('[KindredSouls Debug] handlePurchase session:', !!session, !!session?.access_token);
    if (!session?.access_token) {
      console.log('[KindredSouls Debug] no session, aborting');
      // Session expired — force re-login
      setShowAuthWall(true);
      setShowPaywall(false);
      setPaidStatus(null);
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ plan }),
      });
      if (res.status === 401) {
        // Token rejected — force re-login
        console.log('[KindredSouls Debug] 401 from server, forcing re-login');
        setShowAuthWall(true);
        setShowPaywall(false);
        setPaidStatus(null);
        return;
      }
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;  // Redirect to Stripe Checkout
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
  if (!sessionChecked || paidStatus === null && !showAuthWall) {
    return (
      <div className="ai-insight" style={{ textAlign: 'center', padding: '20px' }}>
        <div className="insight-skeleton">
          <div className="skeleton-line w80" /><div className="skeleton-line w60" /><div className="skeleton-line w90" />
        </div>
      </div>
    );
  }

  // Auth wall — not logged in
  console.log('[KindredSouls Debug] render check:', { sessionChecked, paidStatus, showAuthWall, showPaywall, hasInsight: insight !== null });
  if (showAuthWall && insight === null) {
    return (
      <div className="ai-insight">
        <h3>✨ {lang==='zh'?'AI 深度洞察':lang==='es'?'Perspectiva AI':'AI Insight'}</h3>
        <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{
            filter: 'blur(8px)',
            opacity: 0.4,
            padding: '16px',
            background: 'rgba(212,175,55,0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(212,175,55,0.15)',
          }}>
            <p>{lang==='zh'
              ? '🌙 你们的关系中存在一种罕见的灵魂共振……月亮与金星的相位暗示着深刻的情感连接，这种配置在人群中仅占 3%。当你们真正敞开心扉时，会产生一种近乎「心灵感应」的默契。建议在满月期间进行深度对话，这是你们能量场最同步的时刻。'
              : '🌙 A rare soul resonance exists between you two… The Moon-Venus aspect suggests a profound emotional connection found in only 3% of couples. When you both open up fully, a near-telepathic chemistry emerges. Full moon conversations are your most energetically aligned moments.'}
            </p>
          </div>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10 }}>
            <AuthButton lang={lang} />
          </div>
        </div>
      </div>
    );
  }

  // Stripe paywall — logged in but not paid
  if (showPaywall && insight === null) {
    console.log('[KindredSouls Debug] showing PAYWALL');
    return (
      <div className="ai-insight">
        <h3>✨ {lang==='zh'?'AI 深度洞察':lang==='es'?'Perspectiva AI':'AI Insight'}</h3>
        <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{
            filter: 'blur(8px)',
            opacity: 0.4,
            padding: '16px',
            background: 'rgba(212,175,55,0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(212,175,55,0.15)',
          }}>
            <p>{lang==='zh'
              ? '🌙 你们的关系中存在一种罕见的灵魂共振……月亮与金星的相位暗示着深刻的情感连接，这种配置在人群中仅占 3%。当你们真正敞开心扉时，会产生一种近乎「心灵感应」的默契。建议在满月期间进行深度对话，这是你们能量场最同步的时刻。'
              : '🌙 A rare soul resonance exists between you two… The Moon-Venus aspect suggests a profound emotional connection found in only 3% of couples. When you both open up fully, a near-telepathic chemistry emerges. Full moon conversations are your most energetically aligned moments.'}
            </p>
          </div>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10, width: '85%', maxWidth: '320px' }}>
            <div style={{ background: 'rgba(26,31,75,0.95)', borderRadius: '14px', padding: '24px 20px', textAlign: 'center', backdropFilter: 'blur(12px)', border: '1px solid rgba(212,175,55,0.25)' }}>
              <p style={{ color: '#D4AF37', fontSize: '15px', fontWeight: 700, margin: '0 0 8px' }}>
                🔓 {lang==='zh'?'解锁完整洞察':'Unlock Full Insight'}
              </p>
              <p style={{ color: '#aaa', fontSize: '13px', margin: '0 0 18px', lineHeight: 1.5 }}>
                {lang==='zh'
                  ? 'AI 将为你们的合盘生成专属深度解读，揭示隐藏的情感模式与未来走向。'
                  : 'AI will generate an exclusive deep reading revealing hidden patterns & future trajectories.'}
              </p>
              {/* One-time purchase */}
              <button
                onClick={() => handlePurchase('insight_once')}
                disabled={loading}
                style={{
                  width: '100%', padding: '13px 20px', borderRadius: '10px', border: 'none',
                  background: loading ? '#666' : 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
                  color: '#fff', fontSize: '15px', fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginBottom: '10px', transition: 'all 0.3s ease',
                  boxShadow: '0 4px 16px rgba(212,175,55,0.25)',
                }}
              >
                {loading ? '⏳ ...' : `💫 $4.99 ${lang==='zh'?'单次解锁':'One-time'}`}
              </button>
              {/* Subscription */}
              <button
                onClick={() => handlePurchase('monthly')}
                disabled={loading}
                style={{
                  width: '100%', padding: '11px 20px', borderRadius: '10px', border: '1px solid rgba(212,175,55,0.35)',
                  background: 'transparent', color: '#D4AF37', fontSize: '14px', fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                }}
              >
                ✨ $4.99/{lang==='zh'?'月':'mo'} · {lang==='zh'?'无限次解读':'Unlimited'}
              </button>
              <p style={{ color: '#666', fontSize: '11px', margin: '12px 0 0' }}>
                🔒 {lang==='zh'?'安全支付由 Stripe 提供支持':'Secured by Stripe'}
              </p>
            </div>
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
            width: '100%',
            padding: '14px 24px',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
            color: '#fff',
            fontSize: '15px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 20px rgba(212,175,55,0.3)',
          }}
        >
          ✨ {lang==='zh'?'生成 AI 洞察':lang==='es'?'Generar Perspectiva AI':'Generate AI Insight'}
        </button>
      )}
      
      {loading && (
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: '#D4AF37', fontSize: '14px' }}>
            {lang==='zh'?'宇宙正在解读你们的星盘…':lang==='es'?'Leyendo los astros…':'Reading the cosmos…'}
          </p>
        </div>
      )}
      
      {insight !== null && (
        <div style={{
          padding: '18px',
          background: 'rgba(212,175,55,0.06)',
          borderRadius: '12px',
          border: '1px solid rgba(212,175,55,0.2)',
          animation: 'fadeIn 0.6s ease',
        }}>
          <p style={{ lineHeight: 1.7, margin: 0 }}>{insight}</p>
        </div>
      )}
      
      {error !== null && (
        <p className="insight-error">
          ⚠️ {error}
          <br/>
          <button
            onClick={() => triggerInsight()}
            style={{
              marginTop: '8px',
              padding: '6px 16px',
              borderRadius: '8px',
              border: '1px solid #D4AF37',
              background: 'transparent',
              color: '#D4AF37',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            {lang==='zh'?'重试':'Retry'}
          </button>
        </p>
      )}
    </div>
  );
}

/* ── Result Page ── */
function ResultPage({ result, userId, onBack, lang }: { result: CompatibilityResult; userId?: string; onBack: () => void; lang: string }) {
  const { t } = useTranslation();
  const { overall, engines, dimensions } = result;

  const engineList = [
    { key: 'bazi', label: t('result.engines.bazi'), e: engines.bazi },
    { key: 'zodiac', label: t('result.engines.zodiac'), e: engines.zodiac },
    { key: 'iching', label: t('result.engines.iching'), e: engines.iching },
  ];

  // ── Auto-save to Supabase ──
  useEffect(() => {
    if (!userId) return;
    fetch('/api/save-result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        dob1: result._d1!,
        dob2: result._d2!,
        overall_score: overall,
        dimensions,
        engines,
        language: lang,
      }),
    }).catch(() => {});
  }, [userId, result._d1, result._d2]);

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
      }
    }, 800);
  };

  return (
    <div className="app">
      { _page === 'input' && <InputPage onSubmit={handleCalculate} />}
      { _page === 'loading' && <LoadingPage />}
      { _page === 'result' && result && <ResultPage result={result} userId={userId || undefined} onBack={() => { setResult(null); _setPage('input'); }} lang={currentLang} />}
      {err && <p className="error-msg">{err}</p>}
    </div>
  );
}
