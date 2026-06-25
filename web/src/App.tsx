import React, { useState, useEffect, useRef } from 'react';
import './i18n';


import { useTranslation } from 'react-i18next';
import { calculateCompatibility } from './lib/algos';
import { normalizeLang } from './lib/algos/i18n';
import { getTarot } from './lib/tarot';
import type { CompatibilityResult } from './lib/algos/types';
import CelestialBackground from './components/CelestialBackground';
import DailyDashboard from './components/DailyDashboard';
import PaywallCard from './components/PaywallCard';
import AuthWallCard from './components/AuthWallCard';
import LangModal from './components/LangModal';
import { supabase } from './lib/supabase';
import WealthPage from './pages/WealthPage';
import WealthReportPage from './pages/WealthReportPage';
import './App.css';

  // ── 6语言文案映射（避免三元链漏语言）──
  const TXT = {
    sectionTitle: { zh:'四维深度分析', en:'Four-Dimension Breakdown', es:'Análisis en 4 Dimensiones', fr:'Analyse en 4 Dimensions', th:'การวิเคราะห์ 4 มิติ', vi:'Phân tích 4 Chiều' },
    aiTitle: { zh:'AI 深度洞察' , en:'AI Insight', es:'Perspectiva AI', fr:'Perspective IA', th:'วิเคราะห์ AI', vi:'Luận giải AI' },
    loading: { zh:'🔮 正在链接命运星盘，请稍候...', en:'🔮 Connecting to your cosmic profile...', es:'🔮 Conectando con tu perfil cósmico...', fr:'🔮 Connexion à votre profil cosmique...', th:'🔮 กำลังเชื่อมต่อกับโปรไฟล์ทางดาว...', vi:'🔮 Đang kết nối với hồ sơ vũ trụ của bạn...' },
    verifying: { zh:'🔒 正在安全验证您的账户...', en:'🔒 Verifying your account...', es:'🔒 Verificando tu cuenta...', fr:'🔒 Vérification de votre compte...', th:'🔒 กำลังตรวจสอบบัญชีของคุณ...', vi:'🔒 Đang xác minh tài khoản của bạn...' },
    previewTitle: { zh:'解锁你们的灵魂密码', en:'Unlock Your Soul Code', es:'Desbloquea Tu Código Alma', fr:'Débloquez Votre Code Âme', th:'ปลดล็อกรหัสวิญญาณของคุณ', vi:'Mở khóa Mật mã Linh hồn' },
    previewSubtitle: { zh:'AI 将为你揭示这段关系中被隐藏的真相', en:'AI reveals the hidden truths of your connection', es:'La IA revela las verdades ocultas de su conexión', fr:"L'IA révèle les vérités cachées de votre connexion", th:'AI จะเปิดเผยความจริงที่ซ่อนอยู่ในความสัมพันธ์นี้', vi:'AI sẽ tiết lộ những sự thật ẩn giấu trong mối quan hệ này' },
    featureItems: {
      zh: ['🌑 灵魂共鸣深度分析','🔥 情感能量流动图谱','🌟 未来6个月关系走向','💫 专属提升建议（3条）'],
      en: ['🌑 Soul Resonance Deep Dive','🔥 Emotional Energy Flow Map','🌟 Next 6 Months Trajectory','💫 3 Personalized Growth Tips'],
      es: ['🌑 Análisis Profundo de Resonancia Alma','🔥 Mapa de Flujo de Energía Emocional','🌟 Trayectoria de los Próximos 6 Meses','💫 3 Consejos de Crecimiento Personalizados'],
      fr: ['🌑 Analyse Profonde de Résonnance Âme','🔥 Carte du Flux d\'Énergie Émotionnelle','🌟 Trajectoire des 6 Prochains Mois','💫 3 Conseils de Croissance Personnalisés'],
      th: ['🌑 วิเคราะห์จิตวิญญาณเชิงลึก','🔥 แผนผังพลังงานอารมณ์','🌟 แนวทาง 6 เดือนข้างหน้า','💫 3 คำแนะนำการเติบโตส่วนบุคคล'],
      vi: ['🌑 Phân tích Cộng hưởng Linh hồn Sâu','🔥 Dòng chảy Năng lượng Cảm xúc','🌟 Quỹ đạo 6 Tháng tới','💫 3 Lời khuyên Phát triển Cá nhân hóa'],
    },
    bonus: { zh:'🎁 今日限时加赠', en:'🎁 Limited Time Bonus', es:'🎁 Bonus por Tiempo Limitado', fr:'🎁 Bonus à Durée Limitée', th:'🎁 ของแถมจำกัดเวลา', vi:'🎁 Quà tặng Thời hạn' },
    bonusDesc: { zh:'额外解锁【实时塔罗牌阵】', en:'Unlock Real-Time Tarot Reading', es:'Desbloquea Lectura de Tarot en Tiempo Real', fr:'Débloquez la Lecture de Tarot en Temps Réel', th:'ปลดล็อกการอ่านไพ่ทาโรต์แบบเรียลไทม์', vi:'Mở khóa Góc nhìn Tarot Thời gian thực' },
    bonusDetail: { zh:'看透TA此时此刻对你的真实想法', en:'See what they truly think about you now', es:'Descubre qué piensan realmente de ti ahora', fr:'Découvrez ce qu\'ils pensent vraiment de vous maintenant', th:'ดูสิ่งที่พวกเขาคิดเกี่ยวกับคุณตอนนี้', vi:'Xem họ thực sự nghĩ gì về bạn ngay bây giờ' },
    priceLabel: { zh:'单次', en:'one-time', es:'una vez', fr:'une fois', th:'ครั้งเดียว', vi:'lần dùng' },
    unlockBtn: { zh:'立即解锁', en:'Unlock Now', es:'Desbloquear Ahora', fr:'Débloquer Maintenant', th:'ปลดล็อกเลย', vi:'Mở khóa ngay' },
    subscription: { zh:'月 · 无限次解读', en:'mo · Unlimited', es:'mes · Ilimitado', fr:'mois · Illimité', th:'เดือน · ไม่จำกัด', vi:'tháng · Không giới hạn' },
    trustItems: {
      zh: ['安全支付','即时生成','支持退款'],
      en: ['Secure','Instant','Refundable'],
      es: ['Seguro','Instantáneo','Reembolsable'],
      fr: ['Sécurisé','Instantané','Remboursable'],
      th: ['ปลอดภัย','ทันที','คืนเงินได้'],
      vi: ['An toàn','Tức thì','Hoàn tiền được'],
    },
    blurredPreview: { zh:'🌙 你们的关系中存在一种罕见的灵魂共振……月亮与金星的相位暗示着深刻的情感连接，这种配置在人群中仅占 3%。', en:'🌙 A rare soul resonance exists between you two… The Moon-Venus aspect suggests a profound emotional connection found in only 3% of couples.', es:'🌙 Existe una resonancia de alma rara entre ustedes dos… El aspecto Luna-Venus sugiere una conexión emocional profunda que solo el 3% de las parejas tienen.', fr:"🌙 Une résonnance d'âme rare existe entre vous deux… L'aspect Lune-Vénus suggère une connexion émotionnelle profonde que seul 3% des couples ont.", th:'🌙 มีการจับคลื่นวิญญาณที่หายากระหว่างคุณทั้งสอง… มุมจันทร์-ศุกร์บ่งบอกถึงการเชื่อมต่อทางอารมณ์ที่ลึกซึ้งที่พบได้ในเพียง 3% ของคู่รัก', vi:'🌙 Có một cộng hưởng linh hồn hiếm thấy giữa hai bạn… Khía cạnh Mặt trăng-Sao Kim gợi ý một kết nối cảm xúc sâu sắc chỉ có ở 3% các cặp đôi.' },
    genBtn: { zh:'生成 AI 洞察', en:'Generate AI Insight', es:'Generar Perspectiva AI', fr:'Générer Perspective IA', th:'วิเคราะห์ AI', vi:'Xem Luận giải AI' },
    signOut: { zh:'退出登录', en:'Sign Out', es:'Cerrar Sesión', fr:'Déconnexion', th:'ออกจากระบบ', vi:'Đăng xuất' },
    detailHide: { zh:'收起详情 ▲', en:'Hide Details ▲', es:'Ocultar ▲', fr:'Masquer ▲', th:'ซ่อนรายละเอียด ▲', vi:'Thu gọn ▲' },
    detailShow: { zh:'查看完整分析 ▼', en:'View Full Analysis ▼', es:'Ver Análisis Completo ▼', fr:'Voir Analyse Complète ▼', th:'ดูการวิเคราะห์เต็ม ▼', vi:'Xem chi tiết ▼' },
  } as const;


/* ── Manual Date Input: configurable part order, auto-advance ── */
function DateInput({ value, onChange, onLastFilled, firstFieldRef, autoFocus, containerRef, shake, hasError }: {
  value: string; onChange: (v: string) => void; onLastFilled?: () => void;
  firstFieldRef?: React.RefObject<HTMLInputElement | null>; autoFocus?: boolean;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  shake?: boolean; hasError?: boolean;
}) {
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
    else if (idx === 1) { p[1] = cleaned.slice(0, 2); }
    else { p[2] = cleaned.slice(0, 2); }
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
    <div ref={containerRef} className={`date-manual${shake ? ' shake' : ''}${hasError ? ' date-error-border' : ''}`}>
      {partDefs.map((def, pi) => (
        <React.Fragment key={def.key}>
          {pi > 0 && <span className="date-slash">/</span>}
          <input ref={refs[pi]} className={`date-part${hasError ? ' date-part-error' : ''}`} type="text" inputMode="numeric"
            maxLength={def.max} placeholder={def.ph} value={parts[def.key]}
            onChange={e => handleFieldChange(pi, e.target.value)}
            autoFocus={autoFocus && pi === 0} />
        </React.Fragment>
      ))}
    </div>
  );
}

function InputPage({ onSubmit, onNavigateToWealth }: { onSubmit: (d1: string, d2: string) => void, onNavigateToWealth: () => void }) {
  const { t, i18n } = useTranslation();
  const [mode, setMode] = useState<'landing' | 'compatibility' | 'wealth'>('landing');
  const [d1, setD1] = useState('');
  const [d2, setD2] = useState('');
  const [d2Key, setD2Key] = React.useState(0);
  const [dateError, setDateError] = useState('');
  const [shaking1, setShaking1] = useState(false);
  const [shaking2, setShaking2] = useState(false);
  const d2FirstRef = React.useRef<HTMLInputElement>(null);
  const d1Ref = React.useRef<HTMLDivElement>(null);
  const d2Ref = React.useRef<HTMLDivElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showModeModal, setShowModeModal] = useState(false);
  const jumpToD2 = () => { setD2Key(k => k + 1); setTimeout(() => d2FirstRef.current?.focus(), 80); };
  const shake = (which: 1 | 2) => {
    if (which === 1) { setShaking1(true); setTimeout(() => setShaking1(false), 300); }
    else { setShaking2(true); setTimeout(() => setShaking2(false), 300); }
  };

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
    if (!d1 || !d2) { shake(!d1 ? 1 : 2); return; }
    const err1 = validateDate(d1);
    if (err1) { shake(1); return; }
    const err2 = validateDate(d2);
    if (err2) { shake(2); return; }
    onSubmit(d1, d2);
  };

  const toggleModal = () => setModalOpen(v => !v);

  const handleModeSelect = (selectedMode: 'compatibility' | 'wealth') => {
    setMode(selectedMode);
    setModalOpen(false);
  };

  // ── Langing mode (minimalist) ──
  if (mode === 'landing') {
    return (
      <div className="page input-page">
        <CelestialBackground />
        <button className="lang-switch" onClick={toggleModal}>🌐 {(() => { const b = (i18n.language||'en').split('-')[0]; return b==='zh'?'中文':b==='en'?'EN':b==='es'?'ES':b==='fr'?'FR':b==='th'?'ไทย':b==='vi'?'VI':b; })()}</button>
        {modalOpen && <LangModal open={modalOpen} onClose={() => setModalOpen(false)} />}
        {showModeModal && (
          <div className="mode-modal-overlay" onClick={() => setShowModeModal(false)}>
            <div className="mode-modal" onClick={e => e.stopPropagation()}>
              <h2 className="mode-modal-title">{t('input.selectMode')}</h2>
              <button className="mode-option" onClick={() => { setMode('compatibility'); setShowModeModal(false); }}>
                <span className="mode-icon">💞</span>
                <span className="mode-label">{t('input.compatibilityMode')}</span>
                <span className="mode-desc">{t('input.compatibilityModeDesc')}</span>
              </button>
              <button className="mode-option" onClick={() => { onNavigateToWealth(); setShowModeModal(false); }}>
                <span className="mode-icon">💰</span>
                <span className="mode-label">{t('input.wealthMode')}</span>
                <span className="mode-desc">{t('input.wealthModeDesc')}</span>
              </button>
            </div>
          </div>
        )}
        <div className="landing-container">
          <h1 className="title">{t('input.title')}</h1>
          <p className="subtitle">{t('app.name')}</p>
          <button className="btn btn-primary landing-start-btn" onClick={() => setShowModeModal(true)}>{t('input.start')}</button>
        </div>
        <DailyDashboard lang={(() => { const b = (i18n.language||'en').split('-')[0]; return b==='zh'?'zh':b==='en'?'en':b==='es'?'es':b==='fr'?'fr':b==='th'?'th':b==='vi'?'vi':'en'; })()} />
      </div>
    );
  }

  // ── Mode selection modal ──
  const modeModal = modalOpen && (mode as 'landing' | 'compatibility' | 'wealth') === 'landing' ? (
    <div className="mode-modal-overlay" onClick={() => setModalOpen(false)}>
      <div className="mode-modal" onClick={e => e.stopPropagation()}>
        <h2 className="mode-modal-title">{t('input.selectMode')}</h2>
        <button className="mode-option" onClick={() => handleModeSelect('compatibility')}>
          <span className="mode-icon">💞</span>
          <span className="mode-label">{t('input.compatibilityMode')}</span>
          <span className="mode-desc">{t('input.compatibilityModeDesc')}</span>
        </button>
        <button className="mode-option" onClick={() => handleModeSelect('wealth')}>
          <span className="mode-icon">💰</span>
          <span className="mode-label">{t('input.wealthMode')}</span>
          <span className="mode-desc">{t('input.wealthModeDesc')}</span>
        </button>
      </div>
    </div>
  ) : null;

  // ── Compatibility input mode ──
  return (
    <div className="page input-page">
      <CelestialBackground />
      {modalOpen && <LangModal open={modalOpen} onClose={() => setModalOpen(false)} />}
      {modeModal}
      <h1 className="title">{t('input.title')}</h1>
      <p className="subtitle">{t('app.name')}</p>
      <p className="desc">{t('input.subtitle')}</p>
      <div className="form">
        <div className="date-field">
          <label className="date-label" htmlFor="d1">{t('input.yourBirthday')}</label>
          <DateInput value={d1} onChange={setD1} onLastFilled={jumpToD2} autoFocus containerRef={d1Ref} shake={shaking1} hasError={!!dateError && shaking1} />
        </div>
        <div className="date-field">
          <label className="date-label" htmlFor="d2">{t('input.theirBirthday')}</label>
          <DateInput value={d2} onChange={setD2} firstFieldRef={d2FirstRef} key={d2Key} containerRef={d2Ref} shake={shaking2} hasError={!!dateError && shaking2} />
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
  th: ['ความรัก', 'ความเข้าใจกัน', 'เคมี', 'รากฐานความรัก'],
  vi: ['Tình yêu', 'Thấu hiểu', 'Sức hút', 'Nền tảng'],
};
const DIM_KEYS = ['love', 'communication', 'chemistry', 'stability'] as const;

function DimensionBars({ dims, lang }: { dims: CompatibilityResult['dimensions']; lang: 'zh' | 'en' | 'es' | 'fr' | 'th' | 'vi' }) {
  const labels = DIM_LABELS[lang] || DIM_LABELS.en;
  return (
    <div className="dim-section">
      <h4 className="section-title">{TXT.sectionTitle?.[lang] || TXT.sectionTitle?.en || 'Four-Dimension Breakdown'}</h4>
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
function AIInsightBlock({ d1, d2, overall, dims, bazi, zodiac, iching, baziMeta, zodiacMeta, ichingMeta, luckyAspects, challengingAspects, lang, onTriggerInsight, pendingInsightTrigger, onLogout }: {
  d1: string; d2: string; overall: number;
  dims: CompatibilityResult['dimensions'];
  bazi: string; zodiac: string; iching: string;
  baziMeta?: string[]; zodiacMeta?: string[]; ichingMeta?: string[];
  luckyAspects?: string[]; challengingAspects?: string[];
  lang: 'zh' | 'en' | 'es' | 'fr' | 'th' | 'vi';
  onTriggerInsight?: () => void;
  pendingInsightTrigger?: boolean;
  onLogout?: () => void;
}) {
  const [insight, setInsight] = useState<string | null>(null);
  const [tarotLine, setTarotLine] = useState<string | null>(null);
  const [tarotCard, setTarotCard] = useState<{id:number,name:string,emoji:string,isReversed:boolean,orientation:string} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAuthWall, setShowAuthWall] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isAuthParsing, setIsAuthParsing] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [paidStatus, setPaidStatus] = useState<boolean | null>(null);
  // 🔑 状态驱动：全局持有受信任的 access token
  const [currentAccessToken, setCurrentAccessToken] = useState<string | null>(null);
  const [paidPlansLocal, setPaidPlansLocal] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState<string | false>(false);
  const [reportText, setReportText] = useState<string | null>(null);
  // const [showPricePreview, setShowPricePreview] = useState(false);
  // 🎯 军师方案：防止重复触发 checkout 的 ref
  const hasTriggeredCheckout = useRef(false);
  const insightLockRef = useRef(false);

  // 🚀 Watch pendingInsightTrigger from parent (App) and auto-trigger
  useEffect(() => {
    if (pendingInsightTrigger) {
      triggerInsight();
    }
  }, [pendingInsightTrigger]);

  // 🎯 Paywall auto-show: when paidStatus becomes false, show paywall
  useEffect(() => {
    if (paidStatus === false) {
      setShowPaywall(true);
    }
  }, [paidStatus]);

  // 🎯 军师方案：主动防御 —— 不依赖事件监听时序，主动解析 URL + 主动拿 session
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isPendingCheckout = urlParams.get('intent') === 'checkout';

    if (!isPendingCheckout || hasTriggeredCheckout.current) return;

    console.log('[KindredSouls Auth] 🎯 Active defense: URL has intent=checkout, actively getting session...');

    // 1. 主动拿 session（不等待事件）
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.access_token) {
        console.log('[KindredSouls Auth] 🎯 Active defense: Got session, triggering checkout...');
        hasTriggeredCheckout.current = true;
        // 🛡️ 先检查是否已有 cover，有则跳过 Stripe
        const planFromUrl = new URLSearchParams(window.location.search).get('plan') || 'compatibility_once';
        const alreadyCovered = await checkCoverageInline(session.access_token, planFromUrl);
        if (alreadyCovered) {
          console.log('[KindredSouls Auth] 🎯 Already covered by existing plan, skipping Stripe checkout');
          setPaidStatus(true);
          setShowPaywall(false);
          window.history.replaceState({}, '', '/result');
        } else {
          handlePurchaseWithToken(session.access_token, planFromUrl);
          window.history.replaceState({}, '', '/result');
        }
      } else {
        console.log('[KindredSouls Auth] 🎯 Active defense: No session yet, setting up fallback listener...');
        // 2. 兜底：临时事件监听器等待 SIGNED_IN / INITIAL_SESSION
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (session?.access_token && !hasTriggeredCheckout.current) {
            if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
              console.log(`[KindredSouls Auth] 🎯 Fallback: Got session via ${event}, triggering checkout...`);
              hasTriggeredCheckout.current = true;
              handlePurchaseWithToken(session.access_token, 'compatibility_once');
              window.history.replaceState({}, '', '/result');
              subscription.unsubscribe();
            }
          }
        });
      }
    });
  }, []);

  // ── Auth 状态监听（唯一入口）──
  useEffect(() => {

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
          // 🛡️ 防呆：URL 带着 intent=checkout → 跳过 checkPaidStatus，等 Active Defense 触发 Stripe
          const urlParams_ = new URLSearchParams(window.location.search);
          const isPendingCheckout_ = urlParams_.get('intent') === 'checkout';
          const isPaymentSuccess_ = sessionStorage.getItem('ks_payment_success') === '1';
          if (isPendingCheckout_ && !hasTriggeredCheckout.current) {
            // 让 Active Defense useEffect 处理，不弹付费墙
            setPaidStatus(null);
            setShowPaywall(false);
          } else if (isPaymentSuccess_) {
            // 支付成功回来时，也要检查付费状态（获取 paid_plans）
            sessionStorage.removeItem('ks_payment_success');
            checkPaidStatus(session.access_token);
          } else {
            checkPaidStatus(session.access_token);
          }
          triggerSaveResult();
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
          // ❌ 真正未登录的用户 → 先显示付费墙（明牌流：先给价格，再登录）
          sessionStorage.removeItem('ks_oauth_in_progress');
          setPaidStatus(false);
          setShowPaywall(true);
          setIsAuthParsing(false);
        }
      } else if (event === 'SIGNED_IN') {
        console.log('[KindredSouls Auth] 🎉 SIGNED_IN captured, session established');
        sessionStorage.removeItem('ks_oauth_in_progress');
        window.history.replaceState({}, '', '/result');
        setIsAuthParsing(false);
        setSessionChecked(true);
        setShowAuthWall(false);

        // 🎯 直接检查 URL 参数（不依赖 ref 时序）
        const urlParams = new URLSearchParams(window.location.search);
        const isPendingCheckout = urlParams.get('intent') === 'checkout';

        if (isPendingCheckout && !hasTriggeredCheckout.current) {
          // ✅ URL 有 checkout 意图 → 先检查是否已有 cover
          console.log('[KindredSouls Auth] SIGNED_IN: intent=checkout detected in URL, checking existing coverage...');
          const planFromUrl = urlParams.get('plan') || 'compatibility_once';
          const alreadyCovered = await checkCoverageInline(session!.access_token, planFromUrl);
          if (alreadyCovered) {
            console.log('[KindredSouls Auth] SIGNED_IN: Already covered, skipping Stripe checkout');
            hasTriggeredCheckout.current = true;
            setPaidStatus(true);
            setShowPaywall(false);
            window.history.replaceState({}, '', '/result');
          } else {
            console.log('[KindredSouls Auth] SIGNED_IN: No existing coverage, triggering Stripe checkout...');
            hasTriggeredCheckout.current = true;
            handlePurchaseWithToken(session!.access_token, planFromUrl);
          }
        } else if (hasTriggeredCheckout.current) {
          console.log('[KindredSouls Auth] SIGNED_IN: checkout already in progress, skipping checkPaidStatus');
        } else {
          checkPaidStatus(session!.access_token);
          triggerSaveResult();
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentAccessToken(null);
        setShowAuthWall(true);
        setIsAuthParsing(false);
        setPaidStatus(null);
        setInsight(null);
        setTarotLine(null);
        setTarotCard(null);
        setTarotCard(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);
  // ── 查询付费状态（使用 Supabase JS 客户端，受 RLS 保护）──
  // ── 快速检查：用户是否已有某个计划覆盖当前付费功能（不设 state，只返回 bool）──
  const checkCoverageInline = async (token: string, plan: string): Promise<boolean> => {
    const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
    try {
      // 1. 获取用户 ID
      const authRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: { 'Authorization': `Bearer ${token}`, 'apikey': supabaseAnonKey }
      });
      if (!authRes.ok) return false;
      const authData = await authRes.json();
      const userId = authData?.id;
      if (!userId) return false;

      // 2. 查 paid_plans
      const dbRes = await fetch(
        `${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${userId}&select=paid_plans&limit=1`,
        { headers: { 'Authorization': `Bearer ${token}`, 'apikey': supabaseAnonKey } }
      );
      if (!dbRes.ok) return false;
      const dbData = await dbRes.json();
      const rawPlans = dbData?.[0]?.paid_plans;
      if (!rawPlans) return false;

      // 3. 统一为对象格式
      const planMap: Record<string, any> = {};
      if (Array.isArray(rawPlans)) {
        for (const p of rawPlans) {
          if (typeof p === 'string') planMap[p] = true;
          else if (typeof p === 'object' && p?.plan) planMap[p.plan] = p;
        }
      } else if (typeof rawPlans === 'object' && rawPlans !== null) {
        Object.assign(planMap, rawPlans);
      }

      const now = Date.now();

      // 4. 检查兼容性覆盖
      const isCompatibilityCovered = (() => {
        const directKeys = ['compatibility_once', 'compatibility_monthly_report', 'compatibility_yearly_report', 'compatibility_free_coupon'];
        for (const k of directKeys) {
          if (planMap[k] === true || planMap[k] === k) return true;
        }
        // all_pass_yearly
        const ap = planMap.all_pass_yearly;
        if (ap) {
          const expiresAt = ap.expires_at || ap.all_pass_expires_at;
          if (!expiresAt || new Date(expiresAt).getTime() > now) return true;
        }
        // star_monthly_vip (布尔值或对象)
        const sv = planMap.star_monthly_vip;
        if (sv) {
          if (typeof sv === 'object') {
            const allowance = sv.compatibility_monthly_allowance ?? sv.star_monthly_compatibility_allowance ?? 0;
            const used = sv.compatibility_monthly_used ?? sv.star_monthly_compatibility_used ?? 0;
            const resetsAt = sv.resets_at ?? sv.star_monthly_resets_at;
            if (used < allowance && (!resetsAt || new Date(resetsAt).getTime() > now)) return true;
          } else {
            // sv === true → 同级 key 存放配额
            const allowance = planMap.star_monthly_compatibility_allowance ?? planMap.compatibility_monthly_allowance ?? 0;
            const used = planMap.star_monthly_compatibility_used ?? planMap.compatibility_monthly_used ?? 0;
            const resetsAt = planMap.star_monthly_resets_at;
            if (used < allowance && (!resetsAt || new Date(resetsAt).getTime() > now)) return true;
          }
        }
        return false;
      })();

      if (plan.startsWith('compatibility') || plan === 'star_monthly_vip') {
        return isCompatibilityCovered;
      }
      return false;
    } catch {
      return false;
    }
  };

  const checkPaidStatus = async (_token?: string) => {
    // 🛡️ 竞态守卫：主动防御已触发 checkout 时，跳过付费状态检查
    if (hasTriggeredCheckout.current) {
      return;
    }
    const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
    try {
      // 1. 用 Auth REST API 获取当前用户
      const authRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: { 'Authorization': `Bearer ${_token || ''}`, 'apikey': supabaseAnonKey }
      });
      if (!authRes.ok) {
        console.warn('[KindredSouls Debug] checkPaidStatus auth failed:', authRes.status);
        setPaidStatus(null);
        setShowPaywall(false);
        return;
      }
      const authData = await authRes.json();
      const userId = authData?.id;
      if (!userId) {
        setPaidStatus(null);
        setShowPaywall(false);
        return;
      }
      // 2. 用 PostgREST 查 paid_plans 状态（RLS 由 anon token 保护）
      const dbRes = await fetch(
        `${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${userId}&select=paid_plans&limit=1`,
        { headers: { 'Authorization': `Bearer ${_token || ''}`, 'apikey': supabaseAnonKey } }
      );
      if (!dbRes.ok) {
        console.warn('[KindredSouls Debug] checkPaidStatus db query failed:', dbRes.status);
        setPaidStatus(null);
        setShowPaywall(false);
        return;
      }
      const dbData = await dbRes.json();
      const rawPlans = dbData?.[0]?.paid_plans;
      const now = Date.now();

      // 3. 统一兼容两种存储格式：
      //    数组格式：["compatibility_once"] 或 [{"plan":"compatibility_once", ...}]
      //    对象格式：{"compatibility_once": true, "all_pass_yearly": {...}}
      //    webhook 写入的是对象格式，旧格式是数组
      const planMap: Record<string, any> = {};
      if (Array.isArray(rawPlans)) {
        for (const p of rawPlans) {
          if (typeof p === 'string') {
            planMap[p] = true;
          } else if (typeof p === 'object' && p !== null) {
            const pk = p.plan;
            if (pk) planMap[pk] = p;
          }
        }
      } else if (typeof rawPlans === 'object' && rawPlans !== null) {
        Object.assign(planMap, rawPlans);
      }

      // 兼容性检查（与 create-checkout 服务端逻辑一致）
      const isCompatibilityPaid = (() => {
        // 直接放行：key === true 或字符串形式
        const directKeys = ['compatibility_once', 'compatibility_monthly_report', 'compatibility_yearly_report', 'compatibility_free_coupon'];
        for (const k of directKeys) {
          if (planMap[k] === true || planMap[k] === k) return true;
        }

        // all_pass_yearly：检查不过期
        const ap = planMap.all_pass_yearly;
        if (ap) {
          const expiresAt = ap.expires_at || ap.all_pass_expires_at || (ap === true ? null : null);
          if (!expiresAt || new Date(expiresAt).getTime() > now) return true;
        }

        // star_monthly_vip：检查兼容性配额
        const sv = planMap.star_monthly_vip;
        if (sv) {
          if (typeof sv === 'object') {
            const allowance = sv.compatibility_monthly_allowance ?? sv.star_monthly_compatibility_allowance ?? 0;
            const used = sv.compatibility_monthly_used ?? sv.star_monthly_compatibility_used ?? 0;
            const resetsAt = sv.resets_at ?? sv.star_monthly_resets_at;
            if (used < allowance && (!resetsAt || new Date(resetsAt).getTime() > now)) return true;
          } else {
            const allowance = planMap.star_monthly_compatibility_allowance ?? planMap.compatibility_monthly_allowance ?? 0;
            const used = planMap.star_monthly_compatibility_used ?? planMap.compatibility_monthly_used ?? 0;
            const resetsAt = planMap.star_monthly_resets_at;
            if (used < allowance && (!resetsAt || new Date(resetsAt).getTime() > now)) return true;
          }
        }

        return false;
      })();

      setPaidPlansLocal(rawPlans);
      if (isCompatibilityPaid) {
        setPaidStatus(true);
        setShowPaywall(false);
      } else {
        setPaidStatus(false);
        setShowPaywall(true);
      }
    } catch (err) {
      console.error('[KindredSouls Debug] checkPaidStatus REST error:', err);
      // 出错时不弹付费墙，让 checkout API 来判断
      setPaidStatus(null);
      setShowPaywall(false);
    }
  };
  // ── Save result via REST API（只在有 token 时调用）──
  const triggerSaveResult = async () => {
    const saved = localStorage.getItem('ks_result');
    if (!saved) return;
    try {
      const data = JSON.parse(saved);
      // 强制刷新 session 获取最新 token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        console.error('[saveResult] No valid session:', sessionError);
        return;
      }
      const res = await fetch('/api/save-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          dob1: data.d1,
          dob2: data.d2,
          overall_score: data.overall,
          love_score: data.dims?.love,
          communication_score: data.dims?.communication,
          chemistry_score: data.dims?.chemistry,
          stability_score: data.dims?.stability,
          bazi_detail: data.bazi,
          zodiac_detail: data.zodiac,
          iching_detail: data.iching,
          ai_insight: data.ai_insight,
          language: data.lang,
        }),
      });
      if (!res.ok) console.error('[KindredSouls Debug] saveResult error:', await res.json());
    } catch (err) {
      console.error('[KindredSouls Debug] saveResult exception:', err);
    }
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
        // ✅ already_paid → 自动触发 AI 洞察生成
        triggerInsight(token);
      } else {
        setError(data.error || 'Checkout failed');
      }
    } catch (err) {
      console.error('[KindredSouls Debug] handlePurchaseWithToken ERROR:', err);
      setError('Network error — please check your connection');
    } finally {
      setLoading(false);
    }
  };

  // ── handlePurchase 入口：优先用全局 token，兜底 refreshSession ──


  const handlePurchase = async (plan: string) => {

    let token = currentAccessToken;

    if (!token) {
      // 兜底：先 refreshSession（处理过期 token），再 getSession
      try {
        const { data: { session: refreshed } } = await supabase.auth.refreshSession();
        token = refreshed?.access_token || null;
      } catch (e) {
        console.warn('[KindredSouls Debug] refreshSession failed, falling back to getSession');
      }
    }

    if (!token) {
      const { data: { session } } = await supabase.auth.getSession();
      token = session?.access_token || null;
    }

    // 如果仍然没有 token，等待最多 3 秒让 SIGNED_IN 事件触发
    if (!token) {
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
    }

    if (!token) {
      console.warn('[KindredSouls Debug] No token found after waiting, showing AuthWall');
      setShowPaywall(false);
      setShowAuthWall(true);
      return;
    }

    return handlePurchaseWithToken(token, plan);
  };
  const triggerInsight = async (token?: string) => {
    if (insightLockRef.current) {
      return;
    }
    insightLockRef.current = true;
    setLoading(true);
    setError(null);
    try {
      // 🔧 Auto-refresh token if not provided or expired
      let useToken = token || currentAccessToken;
      if (!useToken) {
        const { data: { session } } = await supabase.auth.getSession();
        useToken = session?.access_token ?? null;
        if (useToken) setCurrentAccessToken(useToken);
      }
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (useToken) headers['Authorization'] = `Bearer ${useToken}`;
      // Compute tarot card deterministically (same logic as AuthButton)
      const tarot = getTarot(d1, d2, lang);
      const res = await fetch('/api/ai-advisor', {
        method: 'POST',
        headers,
        body: JSON.stringify({ d1, d2, overall, dims, bazi, zodiac, iching, lang, baziMeta, zodiacMeta, ichingMeta, luckyAspects, challengingAspects, tarot }),
      });
      const data = await res.json();
      if (data.insight) {
        setInsight(data.insight);
        // Use the freshly computed tarot, not the API response (API echoes it back too)
        setTarotLine(data.tarotLine || tarot.meaning);
        const isReversed = ['Ngược','Reversed','กลับด้าน','Inversé','Invertido'].some(s => tarot.orientation.includes(s));
        setTarotCard({ id: tarot.id, name: tarot.name, emoji: tarot.emoji, isReversed, orientation: tarot.orientation });
        onTriggerInsight?.();
      }
      else if (res.status === 401 || res.status === 402 || data.error?.includes('authorization') || data.error?.includes('token')) {
        // Token expired or not paid → fallback to paywall + re-login flow
        setShowPaywall(true);
        setPaidStatus(false);
        setError(null);
        // Sign out stale session
        await supabase.auth.signOut();
        sessionStorage.removeItem('ks_access_token');
      }
      else setError(data.error || 'Unable to generate insight');
    } catch {
      setError('Network error — please check your connection');
    } finally {
      setLoading(false);
      insightLockRef.current = false;
    }
  };
  const generateReport = async (type: 'monthly' | 'yearly') => {
    if (reportLoading) return;
    setReportLoading(type);
    setReportText(null);
    try {
      const token = await supabase.auth.getSession().then(s => s.data.session?.access_token);
      if (!token) throw new Error('No session');
      const tarot = getTarot(d1, d2, lang);
      const res = await fetch('/api/ai-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          d1, d2, lang,
          bazi, zodiac, iching, tarot,
          reportType: type,
        }),
      });
      const data = await res.json();
      if (data.insight) {
        setReportText(data.insight);
      } else {
        setReportText(lang === 'zh' ? '生成报告失败，请重试。' : 'Failed to generate report. Please try again.');
      }
    } catch (err) {
      console.error('[AIInsightBlock] generateReport error:', err);
      setReportText(lang === 'zh' ? '网络错误，请重试。' : 'Network error. Please try again.');
    } finally {
      setReportLoading(false);
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
            {TXT.loading[lang] || TXT.loading.en}
          </p>
        )}
      </div>
    );
  }
  // 🔒 如果 URL 有 token 但 session 未就绪，继续等待，不显示登录墙
  if (urlHasToken && !currentAccessToken && !sessionChecked) {
    return (
      <div className="ai-insight" style={{ textAlign: 'center', padding: '20px' }}>
        <div className="insight-skeleton">
          <div className="skeleton-line w80" /><div className="skeleton-line w60" /><div className="skeleton-line w90" />
        </div>
        <p style={{ marginTop: '16px', fontSize: '14px', color: '#888' }}>
          {TXT.verifying[lang] || TXT.verifying.en}
        </p>
      </div>
    );
  }
  // Stripe paywall — logged in but not paid
  // 🎯 明牌流：先弹价格，用户愿意付费才登录
  // ── 付费墙：优先显示（无论登录状态）──
  if (showPaywall) {
    return (
      <div className="ai-insight ai-insight-dark">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{
            width: '36px', height: '36px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 38% 38%, rgba(129,216,208,0.35) 0%, rgba(26,31,75,0.6) 45%, rgba(13,13,26,0.9) 100%)',
            border: '1.5px solid rgba(129,216,208,0.25)',
            boxShadow: '0 0 20px rgba(129,216,208,0.2), 0 0 40px rgba(129,216,208,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px',
          }}>🔮</div>
          <h3 style={{ marginBottom: 0 }}>✨ {TXT.aiTitle[lang] || TXT.aiTitle.en}</h3>
        </div>
        <div style={{ position: 'relative', borderRadius: '22px', overflow: 'visible', marginBottom: '20px' }}>
          <div style={{
            filter: 'blur(6px)', opacity: 0.55, padding: '24px 18px',
            background: 'linear-gradient(135deg, rgba(129,216,208,0.08) 0%, rgba(168,85,247,0.06) 100%)', borderRadius: '22px',
            border: '1px solid rgba(129,216,208,0.15)',
            position: 'absolute', inset: 0,
          }}>
            <p style={{ fontSize: '14px', lineHeight: 1.8, color: 'rgba(200,200,240,0.9)', fontWeight: 500 }}>{TXT.blurredPreview[lang] || TXT.blurredPreview.en}
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
  // Auth wall — not logged in (ONLY shown after user clicked "解锁" on paywall)
  if (showAuthWall && insight === null) {
    return (
      <div className="ai-insight ai-insight-dark">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{
            width: '36px', height: '36px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 38% 38%, rgba(129,216,208,0.35) 0%, rgba(26,31,75,0.6) 45%, rgba(13,13,26,0.9) 100%)',
            border: '1.5px solid rgba(129,216,208,0.25)',
            boxShadow: '0 0 20px rgba(129,216,208,0.2), 0 0 40px rgba(129,216,208,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px',
          }}>🔮</div>
          <h3 style={{ marginBottom: 0 }}>✨ {TXT.aiTitle[lang] || TXT.aiTitle.en}</h3>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <AuthWallCard lang={lang} />
        </div>
      </div>
    );
  }
  // Logged in — show button or result
  return (
    <div className="ai-insight">
      <h3>✨ {TXT.aiTitle[lang] || TXT.aiTitle.en}</h3>
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
          ✨ {TXT.genBtn[lang] || TXT.genBtn.en}
        </button>
      )}
      {loading && (
        <div className="golden-transition">
          <div className="golden-orb" />
          <div className="golden-title">{lang === 'zh' ? '🔮 正在生成你的灵魂洞察' : lang === 'en' ? '🔮 Generating Your Soul Insight' : lang === 'es' ? '🔮 Generando Tu Perspectiva Alma' : lang === 'fr' ? '🔮 Génération de Votre Perspective Âme' : lang === 'th' ? '🔮 กำลังสร้างความเข้าใจจิตวิญญาณของคุณ' : '🔮 Đang tạo Luận giải Linh hồn'}</div>
          <div className="golden-dots"><span /><span /><span /></div>
          <div className="golden-subtitle">{lang === 'zh' ? 'AI 正在深度解读你们的星盘…' : lang === 'en' ? 'AI is reading your cosmic connection…' : lang === 'es' ? 'AI está leyendo su conexión cósmica…' : lang === 'fr' ? "L'IA lit votre connexion cosmique…" : lang === 'th' ? 'AI กำลังอ่านการเชื่อมต่อทางจักรวาลของคุณ…' : 'AI đang giải mã kết nối vũ trụ của bạn…'}</div>
        </div>
      )}
      {error && <p style={{ color: '#ff6b6b', marginTop: '8px' }}>{error}</p>}
      {insight && (
        <div className="insight-result">
          {insight.split('\n\n').map((para, i) => (
            <p key={i}>{para}</p>
          ))}
          {tarotCard && (
            <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '8px', transform: tarotCard.isReversed ? 'rotate(180deg)' : 'none' }}>{tarotCard.emoji}</div>
              <div style={{ fontWeight: 700, color: '#D4AF37', fontSize: '15px' }}>{tarotCard.name} {tarotCard.isReversed ? '(Reversed)' : '(Upright)'}</div>
            </div>
          )}
          {tarotLine && (
            <p style={{ marginTop: '12px', fontStyle: 'italic', opacity: 0.85, fontSize: '13px' }}>{tarotLine}</p>
          )}
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
            {TXT.signOut[lang] || TXT.signOut.en}
          </button>
          {/* 🎂 宇宙生日年鉴（AI 洞察解锁后始终显示） */}
          {insight && paidPlansLocal && (
            <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(212,175,55,0.06)', borderRadius: '12px', border: '1px solid rgba(212,175,55,0.25)' }}>
              <div style={{ fontSize: '13px', color: '#D4AF37', fontWeight: 700, marginBottom: '8px' }}>
                🎂 {lang === 'zh' ? '宇宙生日年鉴' : lang === 'en' ? 'Your Solar Return Almanac' : lang === 'es' ? 'Tu Almanaque Solar' : lang === 'fr' ? 'Ton Almanach Solaire' : lang === 'th' ? 'ปฏิทินสุริยะของคุณ' : 'Nhật Ký Mặt Trời'}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(212,175,55,0.6)', marginBottom: '8px' }}>
                {lang === 'zh' ? '基于您的 Solar Return（太阳返照日）生成，推演未来12个月的命运蓝图' : lang === 'en' ? "Based on your Solar Return, a 12-month destiny blueprint unfolds." : lang === 'es' ? 'Basado en tu Retorno Solar, un mapa de 12 meses se despliega.' : lang === 'fr' ? 'Basé sur votre Retour Solaire, une carte de 12 mois se dévoile.' : lang === 'th' ? 'อิงจาก Solar Return ของคุณ พระตำหนักโชคชะตา 12 เดือนจะปรากฏ' : 'Dựa trên Solar Return, bản đồ 12 tháng được vẽ nên.'}
              </div>
              {/* 年卡/VIP → 免费生成 */}
              {paidPlansLocal.all_pass_yearly === true ? (<>
                <button onClick={() => generateReport('monthly')} disabled={!!reportLoading} style={{ marginRight: '8px', marginBottom: '6px', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(212,175,55,0.4)', background: reportLoading ? '#444' : 'rgba(212,175,55,0.1)', color: '#D4AF37', fontSize: '12px', fontWeight: 600, cursor: reportLoading ? 'not-allowed' : 'pointer' }}>
                  {reportLoading ? '⏳...' : (lang === 'zh' ? '📅 生成情感月报' : '📅 Monthly Emotion Report')}
                </button>
                <button onClick={() => generateReport('yearly')} disabled={!!reportLoading} style={{ marginBottom: '6px', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(129,216,208,0.4)', background: reportLoading ? '#444' : 'rgba(129,216,208,0.1)', color: '#81D8D0', fontSize: '12px', fontWeight: 600, cursor: reportLoading ? 'not-allowed' : 'pointer' }}>
                  {reportLoading ? '⏳...' : (lang === 'zh' ? '📆 生成情感年报' : '📆 Yearly Emotion Report')}
                </button>
                <div style={{ fontSize: '10px', color: '#81D8D0', marginTop: '6px' }}>✨ {lang === 'zh' ? 'VIP 尊享，点击免费生成' : 'VIP free access'}</div>
              </>) : (
                /* 非VIP → 加购按钮触发 Stripe Checkout */
                <>
                  <button onClick={() => handlePurchase('compatibility_monthly_report')} disabled={!!reportLoading} style={{ marginRight: '8px', marginBottom: '6px', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(212,175,55,0.4)', background: reportLoading ? '#444' : 'rgba(212,175,55,0.1)', color: '#D4AF37', fontSize: '12px', fontWeight: 600, cursor: reportLoading ? 'not-allowed' : 'pointer' }}>
                    📅 {lang === 'zh' ? '解锁流月报告 $2.99' : 'Unlock Monthly $2.99'}
                  </button>
                  <button onClick={() => handlePurchase('compatibility_yearly_report')} disabled={!!reportLoading} style={{ marginBottom: '6px', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(129,216,208,0.4)', background: reportLoading ? '#444' : 'rgba(129,216,208,0.1)', color: '#81D8D0', fontSize: '12px', fontWeight: 600, cursor: reportLoading ? 'not-allowed' : 'pointer' }}>
                    📆 {lang === 'zh' ? '解锁年度报告 $29.99' : 'Unlock Yearly $29.99'}
                  </button>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '6px' }}>
                    💡 {lang === 'zh' ? `您的至尊全通通道已开启。由于您已成功解锁基础格局，现可获得直接跃迁【$99.99/年 终极 VIP】的宇宙特权，全盘解锁未来 12 个月『宇宙生日年鉴』与所有高阶算法。` : lang === 'en' ? `Your supreme all-access channel is now open. Having unlocked your base pattern, you are now eligible to ascend to【$99.99/year Ultimate VIP】cosmic privilege — full access to the 12-month Solar Return Almanac and all advanced algorithms.` : lang === 'es' ? `Su canal supremo de acceso total ya está abierto. Al haber desbloqueado su patrón base, ahora puede ascender directamente al【$99.99/año VIP Ultimate】privilegio cósmico: acceso completo al Almanaque Solar de 12 meses y todos los algoritmos avanzados.` : lang === 'fr' ? `Votre canal suprême d'accès total est maintenant ouvert. Ayant débloqué votre schéma de base, vous pouvez maintenant accéder directement au【$99.99/an VIP Ultime】privilège cosmique — accès complet à l'Almanach Solaire de 12 mois et à tous les algorithmes avancés.` : lang === 'th' ? `ช่องทางการเข้าถึงสูงสุดของคุณเปิดแล้ว เนื่องจากคุณปลดล็อคแบบแผนพื้นฐานแล้ว คุณจึงสามารถก้าวขึ้นสู่【$99.99/ปี VIP สูงสุด】สิทธิพิเศษจักรวาล — เข้าถึงเต็มรูปแบบของ ปฏิทินสุริยะ 12 เดือนและอัลกอริธึมขั้นสูงทั้งหมด` : `Kênh toàn quyền tối cao của bạn đã mở. Vì bạn đã mở khóa bộ dạng cơ bản, nay bạn có thể thăng hoa trực tiếp lên【$99.99/năm VIP Tối Thượng】đặc quyền vũ trụ — toàn quyền truy cập Niên Ký Mặt Trời 12 tháng và mọi thuật toán cao cấp.`}
                  </div>
                </>
              )}
              {reportText && (
                <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', textAlign: 'left' }}>
                  {reportText.split('\n\n').map((para, i) => (
                    <p key={i} style={{ fontSize: '13px', lineHeight: 1.6, color: 'rgba(255,255,255,0.85)', margin: '0 0 8px' }}>{para}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Result Page ── */
function ResultPage({ result, onBack, lang, pendingInsightTrigger = false, setPendingInsightTrigger, onLogout }: { result: CompatibilityResult; onBack: () => void; lang: 'zh' | 'en' | 'es' | 'fr' | 'th' | 'vi'; pendingInsightTrigger?: boolean; setPendingInsightTrigger?: (v: boolean) => void; onLogout?: () => void }) {
  const { t } = useTranslation();
  const { overall, engines, dimensions, luckyAspects, challengingAspects } = result;

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
          <span>{showDetails ? (TXT.detailHide[lang] || TXT.detailHide.en) : (TXT.detailShow[lang] || TXT.detailShow.en)}</span>
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
        baziMeta={engines.bazi.meta}
        zodiacMeta={engines.zodiac.meta}
        ichingMeta={engines.iching.meta}
        luckyAspects={luckyAspects}
        challengingAspects={challengingAspects}
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

  // ── Wealth module path state ──
  const [wealthPath, setWealthPath] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path === '/wealth') return '/wealth';
      if (path === '/wealth/report') return '/wealth/report';
    }
    return null;
  });

  const navigate = (path: string) => {
    const [pathname] = path.split('?');
    setWealthPath(pathname);
    window.history.pushState({}, '', path);
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
  const [currentLang, setCurrentLang] = useState<'zh' | 'en' | 'es' | 'fr' | 'th' | 'vi'>(() => (i18n.language as 'zh' | 'en' | 'es' | 'fr' | 'th' | 'vi') || 'en');
// ✅ Restore result page after OAuth login or payment success (not every refresh)
 const [pendingInsightTrigger, setPendingInsightTrigger] = useState(false);
 useEffect(() => {
 const search = window.location.search;
 const paymentSuccess = new URLSearchParams(window.location.search).get('payment') === 'success';
 // Detect OAuth callback: Supabase returns with access_token or code in URL hash
 const isOAuthCallback = window.location.hash.includes('access_token=') || window.location.hash.includes('type=') || search.includes('code=');
 const justLoggedIn = localStorage.getItem('ks_just_logged_in');
 const savedResult = localStorage.getItem('ks_result') || sessionStorage.getItem('ks_result');
 // Restore result page if returning from OAuth or payment
 if (paymentSuccess) {
 // Stripe payment callback — set flag for auto-trigger, then clean URL
 sessionStorage.setItem('ks_payment_success', '1');
 // Clean payment param from URL without full reload
 // 🛡️ Don't clear URL hash immediately — let Supabase SDK consume the OAuth token first.
 // Hash will be cleaned after SIGNED_IN event fires (line ~347).
 // Only clean search params (not hash) here.
 }
 if ((isOAuthCallback || justLoggedIn || paymentSuccess) && savedResult) {
 try {
 const r = JSON.parse(savedResult);
 setResult(r);
 _setPage('result');
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
    const handler = (lng: string) => setCurrentLang(lng as 'zh' | 'en' | 'es' | 'fr' | 'th' | 'vi');
    i18n.on('languageChanged', handler);
    return () => { i18n.off('languageChanged', handler); };
  }, [i18n]);

  // ── Handle browser back/forward for wealth paths ──
  useEffect(() => {
    const handlePopstate = () => {
      const path = window.location.pathname;
      if (path === '/wealth' || path === '/wealth/report') {
        setWealthPath(path);
      } else {
        setWealthPath(null);
      }
    };
    window.addEventListener('popstate', handlePopstate);
    return () => window.removeEventListener('popstate', handlePopstate);
  }, []);


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
    setTimeout(() => {
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
      }
    }, 800);
  };

  const handleNavigateToWealth = () => {
    setWealthPath('/wealth');
    window.history.pushState({}, '', '/wealth');
  };

  return (
    <div className="app">
      {wealthPath === '/wealth' && <WealthPage onNavigate={navigate} />}
      {wealthPath?.startsWith('/wealth/report') && <WealthReportPage onNavigate={navigate} />}
      {!wealthPath && _page === 'input' && <InputPage onSubmit={handleCalculate} onNavigateToWealth={handleNavigateToWealth} />}
      {!wealthPath && _page === 'loading' && <LoadingPage />}
      {!wealthPath && _page === 'result' && result && <ResultPage result={result} onBack={() => { localStorage.removeItem('ks_return_to_result'); localStorage.removeItem('ks_result'); setResult(null); _setPage('input'); window.history.pushState({}, '', '/'); }} lang={currentLang} pendingInsightTrigger={pendingInsightTrigger} setPendingInsightTrigger={setPendingInsightTrigger} onLogout={handleLogout} />}
      {!wealthPath && err && <p className="error-msg">{err}</p>}
    </div>
  );
}
