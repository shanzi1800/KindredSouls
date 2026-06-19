import React, { useState, useEffect, useRef } from 'react';
import './i18n';


import { useTranslation } from 'react-i18next';
import { calculateCompatibility } from './lib/algos';
import { normalizeLang } from './lib/algos/i18n';
import { getTarot } from './lib/tarot';
import type { CompatibilityResult } from './lib/algos/types';
import CelestialBackground from './components/CelestialBackground';
import PaywallCard from './components/PaywallCard';
import AuthWallCard from './components/AuthWallCard';
import LangModal from './components/LangModal';
import { supabase } from './lib/supabase';
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

function InputPage({ onSubmit }: { onSubmit: (d1: string, d2: string) => void }) {
  const { t, i18n } = useTranslation();
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

  return (
    <div className="page input-page">
      {/* Video background */}
      <CelestialBackground />
      
      <button className="lang-switch" onClick={toggleModal}>🌐 {(() => { const b = (i18n.language||'en').split('-')[0]; return b==='zh'?'中文':b==='en'?'EN':b==='es'?'ES':b==='fr'?'FR':b==='th'?'ไทย':b==='vi'?'VI':b; })()}</button>
      {modalOpen && <LangModal open={modalOpen} onClose={() => setModalOpen(false)} />}
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
function AIInsightBlock({ d1, d2, overall, dims, bazi, zodiac, iching, baziMeta, zodiacMeta, ichingMeta, lang, onTriggerInsight, pendingInsightTrigger, onLogout }: {
  d1: string; d2: string; overall: number;
  dims: CompatibilityResult['dimensions'];
  bazi: string; zodiac: string; iching: string;
  baziMeta?: string[]; zodiacMeta?: string[]; ichingMeta?: string[];
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
  const [showPricePreview, setShowPricePreview] = useState(false);
  // 🎯 军师方案：防止重复触发 checkout 的 ref
  const hasTriggeredCheckout = useRef(false);

  // 🚀 Watch pendingInsightTrigger from parent (App) and auto-trigger
  useEffect(() => {
    if (pendingInsightTrigger) {
      console.log('[KindredSouls Debug] pendingInsightTrigger=true, calling triggerInsight');
      triggerInsight();
    }
  }, [pendingInsightTrigger]);

  // 🎯 军师方案：主动防御 —— 不依赖事件监听时序，主动解析 URL + 主动拿 session
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isPendingCheckout = urlParams.get('intent') === 'checkout';

    if (!isPendingCheckout || hasTriggeredCheckout.current) return;

    console.log('[KindredSouls Auth] 🎯 Active defense: URL has intent=checkout, actively getting session...');

    // 1. 主动拿 session（不等待事件）
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        console.log('[KindredSouls Auth] 🎯 Active defense: Got session, triggering checkout...');
        hasTriggeredCheckout.current = true;
        handlePurchaseWithToken(session.access_token, 'insight_once');
        window.history.replaceState({}, '', '/result');
      } else {
        console.log('[KindredSouls Auth] 🎯 Active defense: No session yet, setting up fallback listener...');
        // 2. 兜底：临时事件监听器等待 SIGNED_IN / INITIAL_SESSION
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (session?.access_token && !hasTriggeredCheckout.current) {
            if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
              console.log(`[KindredSouls Auth] 🎯 Fallback: Got session via ${event}, triggering checkout...`);
              hasTriggeredCheckout.current = true;
              handlePurchaseWithToken(session.access_token, 'insight_once');
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
          // 🛡️ 防呆：刚支付成功回来时跳过 checkPaidStatus，直接标记已付费
          if (sessionStorage.getItem('ks_payment_success') === '1') {
            setPaidStatus(true);
            setShowPaywall(false);
          } else {
            checkPaidStatus(session.access_token);
          }
          triggerSaveResult(session.user.id);
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
          // ✅ URL 有 checkout 意图 → 直接触发 Stripe，跳过 checkPaidStatus
          console.log('[KindredSouls Auth] SIGNED_IN: intent=checkout detected in URL, triggering checkout directly...');
          hasTriggeredCheckout.current = true;
          handlePurchaseWithToken(session!.access_token, 'insight_once');
        } else if (hasTriggeredCheckout.current) {
          console.log('[KindredSouls Auth] SIGNED_IN: checkout already in progress, skipping checkPaidStatus');
        } else {
          checkPaidStatus(session!.access_token);
          triggerSaveResult(session!.user.id);
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
  const checkPaidStatus = async (_token?: string) => {
    // 🛡️ 竞态守卫：主动防御已触发 checkout 时，跳过付费状态检查
    if (hasTriggeredCheckout.current) {
      console.log('[KindredSouls Debug] checkPaidStatus skipped — checkout already in progress');
      return;
    }
    console.log('[KindredSouls Debug] checkPaidStatus called (REST API)');
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
      // 2. 用 PostgREST 查 paid 状态（RLS 由 anon token 保护）
      const dbRes = await fetch(
        `${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${userId}&select=paid&limit=1`,
        { headers: { 'Authorization': `Bearer ${_token || ''}`, 'apikey': supabaseAnonKey } }
      );
      if (!dbRes.ok) {
        console.warn('[KindredSouls Debug] checkPaidStatus db query failed:', dbRes.status);
        setPaidStatus(null);
        setShowPaywall(false);
        return;
      }
      const dbData = await dbRes.json();
      const paid = dbData?.[0]?.paid === true;
      console.log('[KindredSouls Debug] checkPaidStatus REST result: paid=', paid);
      if (paid) {
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
  // ── Save result to Supabase（只在有 token 时调用）──
  // 注意：localStorage 用 d1/d2，数据库列名是 dob1/dob2，需要映射
  const triggerSaveResult = async (uid: string) => {
    const saved = localStorage.getItem('ks_result');
    if (!saved) return;
    try {
      const data = JSON.parse(saved);
      const { error } = await supabase
        .from('compatibility_results')
        .insert(
          {
            user_id: uid,
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
          }
        );
      if (error) console.error('[KindredSouls Debug] saveResult error:', error);
    } catch (err) {
      console.error('[KindredSouls Debug] saveResult exception:', err);
    }
  };

  // ── handlePurchase 核心逻辑（接收明确的 token 参数）──

  const handlePurchaseWithToken = async (token: string, plan: string) => {
    setLoading(true);
    try {
      console.log('[KindredSouls Debug] handlePurchaseWithToken: calling /api/create-checkout...');
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan }),
      });
      console.log('[KindredSouls Debug] handlePurchaseWithToken: API response status=', res.status);
      if (res.status === 401) {
        console.log('[KindredSouls Debug] 401 from create-checkout, forcing re-login');
        setShowAuthWall(true);
        setShowPaywall(false);
        setPaidStatus(null);
        return;
      }
      const data = await res.json();
      console.log('[KindredSouls Debug] handlePurchaseWithToken: API response data=', data);
      if (data.url) {
        console.log('[KindredSouls Debug] handlePurchaseWithToken: REDIRECTING to Stripe:', data.url);
        window.location.href = data.url;
      } else if (data.already_paid) {
        setPaidStatus(true);
        setShowPaywall(false);
        // ✅ already_paid → 自动触发 AI 洞察生成
        console.log('[KindredSouls Debug] already_paid=true, auto-triggering AI insight');
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
        body: JSON.stringify({ d1, d2, overall, dims, bazi, zodiac, iching, lang, baziMeta, zodiacMeta, ichingMeta, tarot }),
      });
      const data = await res.json();
      if (data.insight) {
        setInsight(data.insight);
        // Use the freshly computed tarot, not the API response (API echoes it back too)
        setTarotLine(tarot.meaning);
        const isReversed = ['Ngược','Reversed','กลับด้าน','Inversé','Invertido'].some(s => tarot.orientation.includes(s));
        setTarotCard({ id: tarot.id, name: tarot.name, emoji: tarot.emoji, isReversed, orientation: tarot.orientation });
        onTriggerInsight?.();
      }
      else if (res.status === 401 || res.status === 402 || data.error?.includes('authorization') || data.error?.includes('token')) {
        // Token expired or not paid → fallback to paywall + re-login flow
        console.log('[KindredSouls] Auth/paywall issue (status', res.status, '), redirecting to paywall');
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
    console.log('[KindredSouls Debug] URL has token but session not ready, waiting...');
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
  // Auth wall — not logged in
  // 🎯 明牌流：先弹价格，用户愿意付费才登录
  if (showAuthWall && insight === null) {
    return (
      <div className="ai-insight">
        <h3 style={{ marginBottom: '18px' }}>✨ {TXT.aiTitle[lang] || TXT.aiTitle.en}</h3>
        <div style={{ position: 'relative', borderRadius: '16px', overflow: 'visible', minHeight: '460px' }}>
          <div style={{
            filter: 'blur(10px)', opacity: 0.35, padding: '20px 16px',
            background: 'rgba(212,175,55,0.04)', borderRadius: '16px',
            border: '1px solid rgba(212,175,55,0.12)',
          }}>
            <p style={{ fontSize: '13px', lineHeight: 1.7 }}>{TXT.blurredPreview[lang] || TXT.blurredPreview.en}
            </p>
          </div>
          <div style={{
            position: 'relative', zIndex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px 0',
          }}>
            {!showPricePreview ? (
              <div style={{ width: '94%', maxWidth: '380px', textAlign: 'center' }}>
                <div style={{ fontSize: '42px', marginBottom: '12px', filter: 'drop-shadow(0 0 16px rgba(212,175,55,0.6))' }}>🔮</div>
                <div style={{ fontSize: '19px', fontWeight: 800, color: '#D4AF37', marginBottom: '8px' }}>
                  {TXT.previewTitle[lang] || TXT.previewTitle.en}
                </div>
                <div style={{ fontSize: '13px', color: '#a0a0c0', marginBottom: '6px', lineHeight: 1.6 }}>
                  {TXT.previewSubtitle[lang] || TXT.previewSubtitle.en}
                </div>
                <div style={{ fontSize: '12px', color: '#8888aa', marginBottom: '20px' }}>
                  🌑 灵魂共鸣分析 &nbsp;·&nbsp; 🔥 情感能量图谱 &nbsp;·&nbsp; 🌟 未来走向
                </div>
                <div style={{ marginBottom: '18px' }}>
                  <span style={{ fontSize: '28px', fontWeight: 900, color: '#fff' }}>$4.99</span>
                  <span style={{ fontSize: '12px', color: '#888', marginLeft: '4px' }}>{TXT.priceLabel[lang] || TXT.priceLabel.en}</span>
                </div>
                <button
                  onClick={() => setShowPricePreview(true)}
                  style={{
                    width: '100%', padding: '14px 20px', borderRadius: '12px', border: 'none',
                    background: 'linear-gradient(135deg, #D4AF37 0%, #F0D060 50%, #D4AF37 100%)',
                    color: '#1a1a2e', fontSize: '15px', fontWeight: 800, cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(212,175,55,0.35)',
                  }}
                >
                  ✨ {TXT.unlockBtn[lang] || TXT.unlockBtn.en}
                </button>
                <div style={{ fontSize: '10px', color: '#666', marginTop: '14px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
                  <span>{(TXT.trustItems[lang] || TXT.trustItems.en)[0]}</span>
                  <span>·</span>
                  <span>{(TXT.trustItems[lang] || TXT.trustItems.en)[1]}</span>
                  <span>·</span>
                  <span>{(TXT.trustItems[lang] || TXT.trustItems.en)[2]}</span>
                </div>
              </div>
            ) : (
              <AuthWallCard lang={lang} />
            )}
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
        <h3 style={{ marginBottom: '18px' }}>✨ {TXT.aiTitle[lang] || TXT.aiTitle.en}</h3>
        <div style={{ position: 'relative', borderRadius: '16px', overflow: 'visible', marginBottom: '20px', minHeight: '420px' }}>
          <div style={{
            filter: 'blur(10px)', opacity: 0.35, padding: '20px 16px',
            background: 'rgba(212,175,55,0.04)', borderRadius: '16px',
            border: '1px solid rgba(212,175,55,0.12)',
            position: 'absolute', inset: 0,
          }}>
            <p style={{ fontSize: '13px', lineHeight: 1.7 }}>{TXT.blurredPreview[lang] || TXT.blurredPreview.en}
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
      {loading && <div className="insight-skeleton"><div className="skeleton-line w80" /><div className="skeleton-line w60" /><div className="skeleton-line w90" /><div className="skeleton-line w70" /></div>}
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
        </div>
      )}
    </div>
  );
}

/* ── Result Page ── */
function ResultPage({ result, onBack, lang, pendingInsightTrigger = false, setPendingInsightTrigger, onLogout }: { result: CompatibilityResult; onBack: () => void; lang: 'zh' | 'en' | 'es' | 'fr' | 'th' | 'vi'; pendingInsightTrigger?: boolean; setPendingInsightTrigger?: (v: boolean) => void; onLogout?: () => void }) {
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
 console.log('[KindredSouls Debug] Restore check:', { isOAuthCallback, paymentSuccess, justLoggedIn, pathname: window.location.pathname, hasResult: !!savedResult });
 // Restore result page if returning from OAuth or payment
 if (paymentSuccess) {
 // Stripe payment callback — set flag for auto-trigger, then clean URL
 sessionStorage.setItem('ks_payment_success', '1');
 console.log('[KindredSouls Debug] ✅ Payment success detected, set ks_payment_success flag');
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
    const handler = (lng: string) => setCurrentLang(lng as 'zh' | 'en' | 'es' | 'fr' | 'th' | 'vi');
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
