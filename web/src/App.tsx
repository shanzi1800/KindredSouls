import { useState, useEffect, useRef } from 'react';
import './i18n';
import { useTranslation } from 'react-i18next';
import { calculateCompatibility } from './lib/algos';
import type { CompatibilityResult } from './lib/algos/types';
import './App.css';

/* ── Input Page ── */
/* Simple date input — user types their own birthday */
/* ── Custom Date Picker (minimalist, no "Today" button) ── */
function DateInput({ value, onChange }: { value: string; onChange: (v: string) => void; inputId?: string }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Placeholder text per language
  const ph = lang === 'zh' ? '年 / 月 / 日'
    : lang === 'fr' ? 'JJ / MM / AAAA'
    : lang === 'es' ? 'DD / MM / AAAA'
    : 'YYYY / MM / DD';

  // Month names
  const months = lang === 'zh' ? ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月']
    : lang === 'fr' ? ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
    : lang === 'es' ? ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
    : ['January','February','March','April','May','June','July','August','September','October','November','December'];

  // Parse current value
  const [viewYear, setViewYear] = useState(() => value ? parseInt(value.split('-')[0]) : new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => value ? parseInt(value.split('-')[1]) - 1 : new Date().getMonth());

  useEffect(() => {
    if (value) {
      const [y, m] = value.split('-').map(Number);
      setViewYear(y);
      setViewMonth(m - 1);
    }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  // Generate calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const selectDay = (d: number) => {
    const m = String(viewMonth + 1).padStart(2, '0');
    const day = String(d).padStart(2, '0');
    onChange(`${viewYear}-${m}-${day}`);
    setOpen(false);
  };

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };

  const weekdays = lang === 'zh' ? ['日','一','二','三','四','五','六']
    : lang === 'fr' ? ['Di','Lu','Ma','Me','Je','Ve','Sa']
    : lang === 'es' ? ['Do','Lu','Ma','Mi','Ju','Vi','Sá']
    : ['Su','Mo','Tu','We','Th','Fr','Sa'];

  return (
    <div ref={ref} className="date-picker-wrapper">
      <div className="date-display" onClick={() => setOpen(o => !o)}>
        <span className={value ? 'date-value' : 'date-placeholder'}>
          {value || ph}
        </span>
        <span className="date-icon">📅</span>
      </div>
      {open && (
        <div className="date-panel">
          <div className="date-header">
            <button type="button" className="date-nav" onClick={prevMonth}>‹</button>
            <span className="date-title">{months[viewMonth]} {viewYear}</span>
            <button type="button" className="date-nav" onClick={nextMonth}>›</button>
          </div>
          <div className="date-weekdays">{weekdays.map(w => <span key={w} className="date-wd">{w}</span>)}</div>
          <div className="date-grid">
            {days.map((d, i) => (
              <span key={i} className={`date-cell ${d === null ? 'empty' : ''} ${d && value === `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}` ? 'selected' : ''}`}
                onClick={() => d && selectDay(d)}>{d}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InputPage({ onSubmit }: { onSubmit: (d1: string, d2: string) => void }) {
  const { t, i18n } = useTranslation();
  const [d1, setD1] = useState('');
  const [d2, setD2] = useState('');

  const submit = () => {
    if (!d1 || !d2) { alert(t('common.errorIncomplete')); return; }
    onSubmit(d1, d2);
  };

  const cycleLang = () => {
    const langs = ['en', 'zh', 'es', 'fr'];
    const idx = langs.indexOf(i18n.language);
    i18n.changeLanguage(langs[(idx + 1) % langs.length]);
  };

  return (
    <div className="page input-page">
      {/* Video Background */}
      <video className="video-bg" autoPlay muted loop playsInline>
        <source src="https://cdn.coverr.co/videos/coverr-aerial-view-of-ocean-waves-5763/1080p.mp4" type="video/mp4" />
      </video>
      <div className="video-overlay" />
      
      <button className="lang-switch" onClick={cycleLang}>🌐 {i18n.language === 'zh' ? '中文' : i18n.language === 'en' ? 'EN' : i18n.language === 'es' ? 'ES' : 'FR'}</button>
      <h1 className="title">{t('input.title')}</h1>
      <p className="subtitle">{t('app.name')}</p>
      <p className="desc">{t('input.subtitle')}</p>
      <div className="form">
        <div className="date-field">
          <label className="date-label" htmlFor="d1">{t('input.yourBirthday')}</label>
          <DateInput value={d1} onChange={setD1} inputId="d1" />
        </div>
        <div className="date-field">
          <label className="date-label" htmlFor="d2">{t('input.theirBirthday')}</label>
          <DateInput value={d2} onChange={setD2} inputId="d2" />
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
const DIM_LABELS_ZH = ['爱情', '沟通', '默契', '稳定'];
const DIM_LABELS_EN = ['Love', 'Communication', 'Chemistry', 'Stability'];
const DIM_KEYS = ['love', 'communication', 'chemistry', 'stability'] as const;

function DimensionBars({ dims, lang }: { dims: CompatibilityResult['dimensions']; lang: string }) {
  const labels = lang === 'zh' ? DIM_LABELS_ZH : DIM_LABELS_EN;
  return (
    <div className="dim-section">
      <h4 className="section-title">{lang === 'zh' ? '四维深度分析' : 'Four-Dimension Breakdown'}</h4>
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

/* ── AI Insight (async fetch from DeepSeek) ── */
function AIInsightBlock({ d1, d2, overall, dims, bazi, zodiac, iching, lang }: {
  d1: string; d2: string; overall: number;
  dims: CompatibilityResult['dimensions'];
  bazi: string; zodiac: string; iching: string;
  lang: string;
}) {
  const [insight, setInsight] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setInsight(null);
    setError(null);

    fetch('/api/ai-insight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ d1, d2, overall, dims, bazi, zodiac, iching, lang }),
    })
      .then(r => r.json())
      .then(data => {
        if (!cancelled) {
          if (data.insight) setInsight(data.insight);
          else setError(data.error || 'Unable to generate insight');
        }
      })
      .catch(() => {
        if (!cancelled) setError('Network error — please check your connection');
      });

    return () => { cancelled = true; };
  }, [d1, d2, overall, dims]);

  return (
    <div className="ai-insight">
      <h3>✨ {lang === 'zh' ? 'AI 深度洞察' : 'AI Insight'}</h3>
      {insight === null && error === null && (
        <div className="insight-skeleton">
          <div className="skeleton-line w80" />
          <div className="skeleton-line w60" />
          <div className="skeleton-line w90" />
        </div>
      )}
      {insight !== null && <p>{insight}</p>}
      {error !== null && (
        <p className="insight-error">
          {lang === 'zh' ? 'AI 洞察暂时不可用' : 'AI insight unavailable right now'}
        </p>
      )}
    </div>
  );
}

/* ── Result Page ── */
function ResultPage({ result, userId, onBack }: { result: CompatibilityResult; userId?: string; onBack: () => void }) {
  const { t, i18n } = useTranslation();
  const { overall, engines, dimensions } = result;
  const lang = i18n.language;

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
              <h4>🔔 {t('result.challengingAspects')}</h4>
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
  const { t } = useTranslation();
  const [page, setPage] = useState<'input' | 'loading' | 'result'>('input');
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [err, setErr] = useState('');
  const [userId, setUserId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ks_user_id');
    }
    return null;
  });

  const handleCalculate = (d1: string, d2: string) => {
    setErr('');
    setPage('loading');
    // Ensure we have a user_id
    let uid = userId;
    if (!uid) {
      uid = crypto.randomUUID();
      localStorage.setItem('ks_user_id', uid);
      setUserId(uid);
    }
    setTimeout(() => {
      const res = calculateCompatibility(d1, d2);
      if ('error' in res) {
        setErr(t('common.errorFormat'));
        setPage('input');
      } else {
        // Attach dates for AI insight call
        const r = res as CompatibilityResult & { _d1: string; _d2: string };
        r._d1 = d1;
        r._d2 = d2;
        setResult(r);
        setPage('result');
      }
    }, 800);
  };

  return (
    <div className="app">
      {page === 'input' && <InputPage onSubmit={handleCalculate} />}
      {page === 'loading' && <LoadingPage />}
      {page === 'result' && result && <ResultPage result={result} userId={userId || undefined} onBack={() => { setResult(null); setPage('input'); }} />}
      {err && <p className="error-msg">{err}</p>}
    </div>
  );
}
