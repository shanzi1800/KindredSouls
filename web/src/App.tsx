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
import { TimeInput } from './components/TimeInput';
import { slotNext } from './components/TimeInput';
import { CitySearchInput } from './components/CitySearchInput';
import type { CityRecord } from './hooks/useCitySearch';
import { supabase } from './lib/supabase';
// 🧹 E85（主公军令 2026-10-24）：「合盘」整个功能板块及报告退役 —— CompatReportCanvas /
//    SynastryProgress 进度卡 / 报告张量画布 / houseOverlay 宫位网格渲染链全部下架
//    （月报·年报交付改走纯文本段落呈现，服务端 report_payload 契约不动、后端封仓零改动）。
//    保留 SSE 读流核（readCompatSSEStream/sseParser）：月报/年报流式获取数据仍走此通路。
// @ts-ignore —— sseParser.mjs 为纯 JS 解析核（运行时形状由 Gate 43 闸门守备）
import { createSSEParser, classifySSEFrame, reduceSSEFrames } from './lib/sseParser.mjs';
import WealthPage from './pages/WealthPage';
import WealthReportPage from './pages/WealthReportPage';
import PolicyPage from './pages/PolicyPage';
// 🧪 Gate 45-B：沙盘收银台（create-checkout 回执 sandbox:true ⇒ 截断外链、就地唤起）
import SandboxCashier from './components/SandboxCashier';
import SandboxPayPage from './pages/SandboxPayPage';
// 🐾 E55-3（主公亲令 2026-10-16）: /familiar/custom 路由**战略隐藏**（1.0 聚焦 $4.99 转化）——
//    FamiliarCustomPage.tsx 底座与 $99.99 三常量静默保留待 2.0 激活，此处不再 import。
// 🐾 Gate 45-B：报告尾「灵宠认领」承接位（E34 D5 白名单构造，禁业务线字段）
import AdoptFamiliarCTA from './components/AdoptFamiliarCTA';
// 🐾 E46→E53（主公亲令 2026-10-15）：首页灵宠宿主 —— 未认领＝空壳（认领全链路收归报告页付费流）；
//    已认领＝破框骑键 portal 至 #ks-familiar-anchor。
import FamiliarHomeCard from './components/FamiliarHomeCard';
// ✦ E84（主公军令 2026-10-22）：Emoji 退役令——模式弹窗图标由 💞/💰 换成
//    星芒微光 SVG 神秘学矢量（双星交汇星环 / 先天星盘金库），真源 EsotericIcons.tsx。
import { IconTwinStars, IconNatalVault, IconStarYou, IconMoonTA } from './components/EsotericIcons';
// @ts-ignore —— sandboxCheckout.mjs 为纯 JS 逻辑核（形状由 Gate 45-B 闸门守备）
import { dispatchCheckoutRoute, openSandboxCashier, SANDBOX_PAY_PATH } from './lib/sandboxCheckout.mjs';
// 🎨 E83：星际黑金设计令牌（深空曜石底 / 流光毛玻璃 / 星轨进度条 / 三级排版）——
//    全站奢华重构唯一真源，先于 App.css 载入，供其覆盖具体页面样式。
import './styles/celestial-tokens.css';
import './App.css';

/**
 * 🛡️ Gate 43：读 SSE 推演流 → 实时回调进度 + 返回终局载体。
 *   切帧/归约逻辑 100% 委托 lib/sseParser.mjs（纯逻辑核，Node 可单测）；本函数只负责「读流 + 回调」。
 *   🔴 降级纪律：任何读流异常 ⇒ 返回 null（调用方走既有失败路径，绝不悬挂 loading）。
 */
async function readCompatSSEStream(
  body: ReadableStream<Uint8Array>,
  onStage: (s: { title: string; label: string; pct: number; index: number; total: number }) => void,
): Promise<any> {
  const reader = body.getReader();
  const decoder = new TextDecoder('utf-8');
  const parser = createSSEParser();
  const seen: any[] = [];
  const ingest = (frames: any[]) => {
    for (const ev of frames) {
      seen.push(ev);
      const c = classifySSEFrame(ev);
      if (c.type === 'stage') {
        const snap = reduceSSEFrames([ev]).stage;
        if (snap) onStage(snap);
      }
    }
  };
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) ingest(parser.push(decoder.decode(value, { stream: true })));
  }
  ingest(parser.flush());
  const r = reduceSSEFrames(seen);
  if (r.error) return { error: r.error.error };
  return r.ready || null;
}

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
    // 🔴 E91-①：signOut 词条随「退出登录」按钮一并退役（渲染区结束锚已迁 ks-report-cursor）。
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
  // 🛠️ 45-B8：捕获本次实际按下的数字键（真机/点击中点时光标可能落在字符中间）
  const typed = React.useRef('');

  React.useImperativeHandle(firstFieldRef, () => refs[0].current!, []);

  const update = (idx: number, val: string): string => {
    const p = [...parts];
    // 🛠️ 45-B8：绝不吞键 —— 满格续打即整格重写（原 `slice(0,N)` + maxLength 会静默吃掉按键）
    p[idx] = slotNext(p[idx] || '', val, idx === 0 ? 4 : 2, typed.current);
    typed.current = '';
    const newVal = p.join('-');
    onChange(newVal);
    return p[idx];
  };

  const handleFieldChange = (partIdx: number, val: string) => {
    const def = partDefs[partIdx];
    const slot = update(def.key, val);
    if (slot.length === def.max) {   // 以槽位实际长度判跳栏（而非原始按键位数）
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
            placeholder={def.ph} value={parts[def.key]}
            onChange={e => handleFieldChange(pi, e.target.value)}
            onKeyDown={e => { typed.current = /^[0-9]$/.test(e.key) ? e.key : ''; }}
            onFocus={e => { const el = e.currentTarget; setTimeout(() => { try { el.setSelectionRange(el.value.length, el.value.length); } catch { /* 忽略 */ } }, 0); }}
            autoFocus={autoFocus && pi === 0} />
        </React.Fragment>
      ))}
    </div>
  );
}

  // ── handlePurchaseWithToken: shared checkout helper ──
  //   🧪 Gate 45-B：回执分流统一交纯核 dispatchCheckoutRoute ——
  //      sandbox:true ⇒ **截断外链**、就地唤起沙盘收银台；url ⇒ 照旧外跳 Stripe；already_paid ⇒ 静默。
  const handlePurchaseWithToken = async (token: string, plan: string) => {
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      // ✦ E84（主公军令 2026-10-22）「付费即刻呈现」：沙盒/兑换授予后落支付成功标志再刷新——
      //    复用 ks_payment_success → ResultPage → pendingInsightTrigger → 自动流式生成链，
      //    消灭「付完 $4.99 还要再点一次『生成 AI 洞察』按钮」的商业漏斗断点。
      const route = dispatchCheckoutRoute(data, { origin: window.location.origin, onGranted: () => {
        sessionStorage.setItem('ks_payment_success', '1');
        // 🔴 E87-③（主公军令 2026-10-25）：月报/年报付讫 ⇒ 落报告路由标记——冷启动
        //    自动分诊到对应报告生成（不再误触 once 洞察自动链）。
        try {
          if (plan === 'compatibility_monthly_report') sessionStorage.setItem('ks_paid_report_type', 'monthly');
          else if (plan === 'compatibility_yearly_report') sessionStorage.setItem('ks_paid_report_type', 'yearly');
        } catch { /* noop */ }
        window.location.reload();
      } });
      if (route.kind === 'redirect') {
        console.log('[KindredSouls] Redirecting to Stripe:', route.url);
        window.location.href = route.url;
      } else if (route.kind === 'sandbox') {
        // 🔴 沙盘截断：绝不跳外链 —— 收银台已由总线就地唤起（真金白银路径逐字未改）
        console.log('[KindredSouls] 🧪 sandbox checkout — cashier opened in place:', route.plan);
      } else if (route.kind === 'paid') {
        // 🔴 E88-①（主公军令 2026-10-26）：already_paid 旁路终极收口——月报/年报点击
        //    **无条件**呈现沙盒收银台（不论账号历史 already_paid 残留），用户主动确认
        //    付款后才触发生成链：complete ⇒ webhook 幂等重授（received:true ⇒ granted）⇒
        //    onGranted 落支付成功标志＋报告路由标记后 reload（与正常沙盒付讫同一条链）。
        //    🔴 军令射程＝月报/年报两档；once 已购用户沿用 E86 当次会话解锁语义（不动）。
        //    技术底座：/api/sandbox/complete 只需 plan（自建 session+webhook 派发），
        //    SandboxCashier 的 sessionId 仅展示用 ⇒ 空串唤起合法。
        if (plan === 'compatibility_monthly_report' || plan === 'compatibility_yearly_report') {
          openSandboxCashier({
            plan,
            sessionId: '',
            url: '',
            onGranted: () => {
              try {
                sessionStorage.setItem('ks_payment_success', '1');
                if (plan === 'compatibility_monthly_report') sessionStorage.setItem('ks_paid_report_type', 'monthly');
                else if (plan === 'compatibility_yearly_report') sessionStorage.setItem('ks_paid_report_type', 'yearly');
              } catch { /* noop */ }
              window.location.reload();
            },
          });
        } else {
          // 🔴 E86-③＋E87-②/③（沿袭）：once 档 already_paid 静默吞噬根治——
          //    服务端防重付挡死重复下单 ⇒ 点击「解锁」一律视作当次会话解锁。
          try {
            sessionStorage.setItem('ks_payment_success', '1');
            if (plan === 'compatibility_once') sessionStorage.setItem('ks_compat_session_unlocked', '1');
          } catch { /* noop */ }
          window.location.reload();
        }
      } else {
        console.error('[KindredSouls] Stripe checkout failed:', data);
        alert('Payment initiation failed. Please try again or contact support.');
      }
    } catch (err) {
      console.error('[KindredSouls] handlePurchaseWithToken error:', err);
      alert('Network error during payment. Please try again.');
    }
  };





// 🌌 E40+：合婚「双人补齐」时空真值采集（可选，缺省 ⇒ 服务端如实降级，绝不伪造）
export type CompatTimeTruth = {
  t1: string; c1: CityRecord | null;
  t2: string; c2: CityRecord | null;
};

function InputPage({ onSubmit, onNavigateToWealth }: {
  onSubmit: (d1: string, d2: string, tt: CompatTimeTruth) => void,
  onNavigateToWealth: () => void
}) {
  const { t, i18n } = useTranslation();
  const [mode, setMode] = useState<'landing' | 'compatibility' | 'wealth'>('landing');
  const [d1, setD1] = useState('');
  const [d2, setD2] = useState('');
  // 🌌 E40+：双方出生时间 / 出生城市（可选；有则服务端走真实双盘 timed，无则日期级降级）
  const [t1, setT1] = useState('');
  const [c1, setC1] = useState<CityRecord | null>(null);
  const [t2, setT2] = useState('');
  const [c2, setC2] = useState<CityRecord | null>(null);
  const lang = ((i18n.language || 'en').split('-')[0] || 'en') as 'zh' | 'en' | 'es' | 'fr' | 'th' | 'vi';
  const L_TIME = ({
    zh: '出生时间（可选）', en: 'Birth Time (optional)', es: 'Hora de nacimiento (opcional)',
    fr: 'Heure de naissance (optionnel)', th: 'เวลาเกิด (เลือกได้)', vi: 'Giờ sinh (tùy chọn)',
  } as Record<string, string>)[lang] || 'Birth Time (optional)';
  const L_CITY = ({
    zh: '出生城市（可选）', en: 'Birth City (optional)', es: 'Ciudad de nacimiento (opcional)',
    fr: 'Ville de naissance (optionnel)', th: 'เมืองเกิด (เลือกได้)', vi: 'Thành phố sinh (tùy chọn)',
  } as Record<string, string>)[lang] || 'Birth City (optional)';
  // ✦ E84（主公军令 2026-10-22）：双星分卡六语字典——星卡标题＋折叠触发条。
  //    军令原文：【你的星盘坐标 (Your Natal Coordinates)】/【TA 的星盘坐标 (Partner's Coordinates)】。
  //    折叠条＝渐进式披露：补充出生时辰与城市（测算精度提升 40% · 可选），默认收起。
  const L_CARD1 = ({
    zh: '你的星盘坐标', en: 'Your Natal Coordinates', es: 'Tus Coordenadas Natales',
    fr: 'Vos Coordonnées Natales', th: 'พิกัดดวงดาวของคุณ', vi: 'Tọa độ bản đồ sao của bạn',
  } as Record<string, string>)[lang] || 'Your Natal Coordinates';
  const L_CARD2 = ({
    zh: 'TA 的星盘坐标', en: "Partner's Coordinates", es: 'Coordenadas de tu pareja',
    fr: 'Coordonnées de votre partenaire', th: 'พิกัดดวงดาวของเขา/เธอ', vi: 'Tọa độ bản đồ sao của người ấy',
  } as Record<string, string>)[lang] || "Partner's Coordinates";
  const L_FOLD = ({
    zh: '补充出生时辰与城市（测算精度提升 40% · 可选）', en: 'Add birth time & city (+40% accuracy · optional)',
    es: 'Añade hora y ciudad de nacimiento (+40% de precisión · opcional)', fr: 'Ajoutez l’heure et la ville de naissance (+40% de précision · facultatif)',
    th: 'เพิ่มเวลาและเมืองเกิด (ความแม่นยำ +40% · เลือกได้)', vi: 'Thêm giờ và thành phố sinh (độ chính xác +40% · tùy chọn)',
  } as Record<string, string>)[lang] || 'Add birth time & city (+40% accuracy · optional)';
  // ✦ E84 折叠状态：fold* 控展开、settled* 在丝滑动画（420ms）落地后放开 overflow
  //    ——CitySearchInput 下拉建议层为 absolute 定位，须防 .ks-fold 的 overflow:hidden
  //    裁切（E71 祖先裁切链血训）；收起时立即恢复 hidden 保折叠动画。
  const [fold1, setFold1] = useState(false);
  const [fold1Settled, setFold1Settled] = useState(false);
  const [fold2, setFold2] = useState(false);
  const [fold2Settled, setFold2Settled] = useState(false);
  React.useEffect(() => {
    if (!fold1) { setFold1Settled(false); return; }
    const id = setTimeout(() => setFold1Settled(true), 480);
    return () => clearTimeout(id);
  }, [fold1]);
  React.useEffect(() => {
    if (!fold2) { setFold2Settled(false); return; }
    const id = setTimeout(() => setFold2Settled(true), 480);
    return () => clearTimeout(id);
  }, [fold2]);
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

  // 🔄 从财富页面返回时，自动弹出选择模式弹窗
  React.useEffect(() => {
    if (localStorage.getItem('ks_show_mode_modal') === '1') {
      localStorage.removeItem('ks_show_mode_modal');
      setShowModeModal(true);
    }
  }, []);

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
    onSubmit(d1, d2, { t1, c1, t2, c2 });
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
              {/* 🌐 E79（主公军令 2026-10-20）: 六语词条焕新——「合婚密码」→「姻缘密码」＋
                  五语母语级黑话（Code/Clé/Código/รหัสลับ/Mật Mã）。排版：icon＋文字列
                  （mode-text 收编 label/desc 纵排），长副标题在列内受控换行，禁挤压左侧图标。
                  ✦ E84：icon 位由 💞/💰 Emoji 升格为星芒 SVG 神秘学矢量（Emoji 退役令）。 */}
              <button className="mode-option" onClick={() => { setMode('compatibility'); setShowModeModal(false); }}>
                <span className="mode-icon"><IconTwinStars /></span>
                <span className="mode-text">
                  <span className="mode-label">{t('input.compatibilityMode')}</span>
                  <span className="mode-desc">{t('input.compatibilityModeDesc')}</span>
                </span>
              </button>
              <button className="mode-option" onClick={() => { onNavigateToWealth(); setShowModeModal(false); }}>
                <span className="mode-icon"><IconNatalVault /></span>
                <span className="mode-text">
                  <span className="mode-label">{t('input.wealthMode')}</span>
                  <span className="mode-desc">{t('input.wealthModeDesc')}</span>
                </span>
              </button>
            </div>
          </div>
        )}
        <div className="landing-container">
          <h1 className="title">{t('input.title')}</h1>
          <p className="subtitle">{t('app.name')}</p>
          {/* 🐾 E51 破框骑键：wrap 提供定位坐标系（宽=按钮宽）；FamiliarHomeCard 认领后
              经 portal 把灵宠（主公钦定原画）骑到按钮上沿 —— 外层 pointer-events:none
              物理穿透，按钮点击 100% 命中（军令铁律）。 */}
          <div className="landing-start-wrap">
            <button className="btn btn-primary landing-start-btn" onClick={() => setShowModeModal(true)}>{t('input.start')}</button>
            <div id="ks-familiar-anchor" aria-hidden="true" />
          </div>
        </div>
        {/* 🐾 E53（主公亲令 2026-10-15）首页净化白名单：星空背景＋缘分天定＋骑键灵宠＋极简切换语言。
            未认领＝空壳零挂件（认领全链路收归报告页付费流）；已认领＝破框骑键 portal。
            🧹 E53-1：E46 折叠条/认领表单与「今日运势卡」均撤下首页（组件文件保留备复活）。 */}
        <FamiliarHomeCard />
      </div>
    );
  }

  // ── Mode selection modal ──
  const modeModal = modalOpen && (mode as 'landing' | 'compatibility' | 'wealth') === 'landing' ? (
    <div className="mode-modal-overlay" onClick={() => setModalOpen(false)}>
      <div className="mode-modal" onClick={e => e.stopPropagation()}>
        <h2 className="mode-modal-title">{t('input.selectMode')}</h2>
        <button className="mode-option" onClick={() => handleModeSelect('compatibility')}>
          <span className="mode-icon"><IconTwinStars /></span>
          <span className="mode-text">
            <span className="mode-label">{t('input.compatibilityMode')}</span>
            <span className="mode-desc">{t('input.compatibilityModeDesc')}</span>
          </span>
        </button>
        <button className="mode-option" onClick={() => handleModeSelect('wealth')}>
          <span className="mode-icon"><IconNatalVault /></span>
          <span className="mode-text">
            <span className="mode-label">{t('input.wealthMode')}</span>
            <span className="mode-desc">{t('input.wealthModeDesc')}</span>
          </span>
        </button>
      </div>
    </div>
  ) : null;

  // ── Compatibility input mode ──
  return (
    <div style={{ position: 'fixed', inset: 0, overflowY: 'auto' }}>
      {/* 🌌 军师令：本页去除背景视频（UI 调整期）；换财富模块同款深色星空 CSS 底（自带 #080810 深色兜底，防白屏）。
          结构逐字复刻 WealthPage：fixed 背景层与 relative 内容层为兄弟（真机已验证的渲染形态）。 */}
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(1.5px 1.5px at 20% 30%, rgba(212,175,55,0.3) 50%, transparent 50%), radial-gradient(1.5px 1.5px at 80% 70%, rgba(129,216,208,0.3) 50%, transparent 50%), radial-gradient(1px 1px at 50% 50%, rgba(255,255,255,0.2) 50%, transparent 50%), #080810', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '420px', margin: '0 auto', padding: '24px 16px 60px' }}>
        {modalOpen && <LangModal open={modalOpen} onClose={() => setModalOpen(false)} />}
        {modeModal}
        {/* 🌌 对齐财富模块：顶部返回键（流内 · 居中；点击回落地页并自动弹模式选择） */}
        <button onClick={() => { setMode('landing'); setShowModeModal(true); }} style={{ display: 'block', width: 'fit-content', margin: '0 auto 16px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '6px 12px', color: '#8B8778', fontSize: '12px', cursor: 'pointer' }}>
          ← {t('input.back')}
        </button>
        <h1 className="title" style={{ textAlign: 'center' }}>{t('input.title')}</h1>
        <p className="subtitle" style={{ textAlign: 'center' }}>{t('app.name')}</p>
        <p className="desc" style={{ textAlign: 'center' }}>{t('input.subtitle')}</p>
      {/* ✦ E84（主公军令 2026-10-22）：双星分卡架构——两张深空曜石星卡（你 / TA），
              必填生日绝对置顶，选填时辰＋城市折叠收纳（.ks-fold 丝滑披露，默认收起）。
              首屏视觉清爽度 ↑60%；推翻 45-B5 的 6 黑框垂直堆叠（报销单形态）。 */}
      <div className="ks-starcard">
        <div className="ks-starcard-head">
          <IconStarYou />
          <span className="ks-starcard-title">{L_CARD1}</span>
        </div>
        {/* 必填置顶：出生年月日 */}
        <label className="date-label" htmlFor="d1">{t('input.yourBirthday')}</label>
        <DateInput value={d1} onChange={setD1} onLastFilled={jumpToD2} autoFocus containerRef={d1Ref} shake={shaking1} hasError={!!dateError && shaking1} />
        {/* 渐进式丝滑折叠：选填时辰＋城市默认收起 */}
        <button type="button" className="ks-fold-trigger" onClick={() => setFold1(v => !v)} aria-expanded={fold1}>
          <span className="ks-fold-sign">{fold1 ? '−' : '＋'}</span>
          <span className="ks-fold-label">{L_FOLD}</span>
        </button>
        <div className="ks-fold" data-open={fold1 ? 'true' : 'false'} data-settled={fold1Settled ? 'true' : 'false'}>
          <div className="ks-fold-inner">
            {/* 🔴 E86-①（主公军令 2026-10-24）：出生城市上移置于出生时间之上——
                城市联想下拉（absolute+zIndex 1000）展开时只覆盖本卡时间框，
                不再跨卡遮挡 TA 的星盘卡与「测算缘分」主按钮（军令截图 1/2 病灶根治）。 */}
            <label className="ks-field-label">{L_CITY}</label>
            <CitySearchInput value={c1?.key || ''} tz={c1?.tz || 'Asia/Shanghai'} lat={c1?.lat || 31.23} lon={c1?.lon || 121.47} onSelect={setC1} lang={lang} />
            <label className="ks-field-label">{L_TIME}</label>
            <TimeInput value={t1} onChange={setT1} />
          </div>
        </div>
      </div>
      <div className="ks-starcard">
        <div className="ks-starcard-head">
          <IconMoonTA />
          <span className="ks-starcard-title">{L_CARD2}</span>
        </div>
        <label className="date-label" htmlFor="d2">{t('input.theirBirthday')}</label>
        <DateInput value={d2} onChange={setD2} firstFieldRef={d2FirstRef} key={d2Key} containerRef={d2Ref} shake={shaking2} hasError={!!dateError && shaking2} />
        <button type="button" className="ks-fold-trigger" onClick={() => setFold2(v => !v)} aria-expanded={fold2}>
          <span className="ks-fold-sign">{fold2 ? '−' : '＋'}</span>
          <span className="ks-fold-label">{L_FOLD}</span>
        </button>
        <div className="ks-fold" data-open={fold2 ? 'true' : 'false'} data-settled={fold2Settled ? 'true' : 'false'}>
          <div className="ks-fold-inner">
            {/* 🔴 E86-①（主公军令 2026-10-24）：TA 卡同款对调——城市在上、时间在下（双卡对齐）。 */}
            <label className="ks-field-label">{L_CITY}</label>
            <CitySearchInput value={c2?.key || ''} tz={c2?.tz || 'Asia/Shanghai'} lat={c2?.lat || 31.23} lon={c2?.lon || 121.47} onSelect={setC2} lang={lang} />
            <label className="ks-field-label">{L_TIME}</label>
            <TimeInput value={t2} onChange={setT2} />
          </div>
        </div>
      </div>
      <div className="ks-dual-stack">
        {/* 🔮 财富同款金牌提示（复用六语文案键 wealthInput.birthTip；间距/内边距与财富框内一致） */}
        <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, rgba(212,175,55,0.18) 0%, rgba(212,175,55,0.10) 100%)', border: '1px solid rgba(212,175,55,0.4)', borderRadius: '12px', fontSize: '11px', color: '#F0D060', fontWeight: 400, lineHeight: 1.6, boxShadow: '0 2px 8px rgba(212,175,55,0.15)', textShadow: '0 1px 2px rgba(0,0,0,0.4)', textAlign: 'left' }}>
          <span style={{ marginRight: '6px' }}>🔮</span>{t('wealthInput.birthTip')}
        </div>
      </div>
      {/* 🌌 45-B5：CTA 移出蓝框 · 框下方（对齐财富按钮规格；压平 .btn 自带 40px 下边距使条款紧贴） */}
      <button className="btn btn-primary" onClick={submit} style={{ marginTop: '16px', marginBottom: 0 }}>{t('input.calculate')}</button>
      {/* ⚖️ 对齐财富模块：法律合规条款（六语；紧贴测算缘分按钮） */}
      <p style={{ fontSize: '11px', color: '#FFFFFF', textAlign: 'center', marginTop: '12px', lineHeight: 1.5 }}>
          {i18n.language?.startsWith('zh') ? <>点击&ldquo;{t('input.calculate')}&rdquo;即表示你同意<a href="/terms-of-service" style={{color:'#FFFFFF',textDecoration:'underline'}} onClick={e=>{e.preventDefault();window.location.href='/terms-of-service'}}>服务条款</a>和<a href="/privacy-policy" style={{color:'#FFFFFF',textDecoration:'underline'}} onClick={e=>{e.preventDefault();window.location.href='/privacy-policy'}}>隐私政策</a>。</> : null}
          {i18n.language?.startsWith('es') ? <>Al hacer clic en &ldquo;{t('input.calculate')}&rdquo;, aceptas nuestros <a href="/terms-of-service" style={{color:'#FFFFFF',textDecoration:'underline'}} onClick={e=>{e.preventDefault();window.location.href='/terms-of-service'}}>Términos de Servicio</a> y <a href="/privacy-policy" style={{color:'#FFFFFF',textDecoration:'underline'}} onClick={e=>{e.preventDefault();window.location.href='/privacy-policy'}}>Política de Privacidad</a>.</> : null}
          {i18n.language?.startsWith('fr') ? <>En cliquant sur &ldquo;{t('input.calculate')}&rdquo;, vous acceptez nos <a href="/terms-of-service" style={{color:'#FFFFFF',textDecoration:'underline'}} onClick={e=>{e.preventDefault();window.location.href='/terms-of-service'}}>Conditions d'Utilisation</a> et <a href="/privacy-policy" style={{color:'#FFFFFF',textDecoration:'underline'}} onClick={e=>{e.preventDefault();window.location.href='/privacy-policy'}}>Politique de Confidentialité</a>.</> : null}
          {i18n.language?.startsWith('th') ? <>การคลิก &ldquo;{t('input.calculate')}&rdquo; แสดงว่าคุณยอมรับ<a href="/terms-of-service" style={{color:'#FFFFFF',textDecoration:'underline'}} onClick={e=>{e.preventDefault();window.location.href='/terms-of-service'}}>ข้อกำหนดในการให้บริการ</a>และ<a href="/privacy-policy" style={{color:'#FFFFFF',textDecoration:'underline'}} onClick={e=>{e.preventDefault();window.location.href='/privacy-policy'}}>นโยบายความเป็นส่วนตัว</a>ของเรา</> : null}
          {i18n.language?.startsWith('vi') ? <>Bằng cách nhấp vào &ldquo;{t('input.calculate')}&rdquo;, bạn đồng ý với <a href="/terms-of-service" style={{color:'#FFFFFF',textDecoration:'underline'}} onClick={e=>{e.preventDefault();window.location.href='/terms-of-service'}}>Điều Khoản Dịch Vụ</a> và <a href="/privacy-policy" style={{color:'#FFFFFF',textDecoration:'underline'}} onClick={e=>{e.preventDefault();window.location.href='/privacy-policy'}}>Chính Sách Bảo Mật</a>.</> : null}
          {!i18n.language?.startsWith('zh') && !i18n.language?.startsWith('es') && !i18n.language?.startsWith('fr') && !i18n.language?.startsWith('th') && !i18n.language?.startsWith('vi') ? <>By clicking &ldquo;{t('input.calculate')}&rdquo;, you agree to our <a href="/terms-of-service" style={{color:'#FFFFFF',textDecoration:'underline'}} onClick={e=>{e.preventDefault();window.location.href='/terms-of-service'}}>Terms of Service</a> and <a href="/privacy-policy" style={{color:'#FFFFFF',textDecoration:'underline'}} onClick={e=>{e.preventDefault();window.location.href='/privacy-policy'}}>Privacy Policy</a>.</> : null}
        </p>
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
    // ✦ E84（主公军令 2026-10-22）：双星共振环——青绿体检表环退役，
    //    星轨流光渐变（香槟金 #F5D08A → 星云玫瑰紫 #C084FC）＋双环嵌套（外曜石槽＋内流光）。
    <div className="score-ring">
      <svg viewBox="0 0 120 120">
        <defs>
          <linearGradient id="ks-ring-orbit" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5D08A" />
            <stop offset="52%" stopColor="#E9C7F2" />
            <stop offset="100%" stopColor="#C084FC" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
        <circle cx="60" cy="60" r={R} fill="none" stroke="url(#ks-ring-orbit)" strokeWidth="10"
          strokeLinecap="round" strokeDasharray={C} strokeDashoffset={offset}
          transform="rotate(-90 60 60)" style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(.4,0,.2,1)', filter: 'drop-shadow(0 0 6px rgba(245,208,138,0.55))' }} />
      </svg>
      {/* ✦ E84：分数改 HTML 覆盖层（color 驱动）——SVG <text> 的 fill 不入 computed color，
          美学探针（WCAG 口径）读 color 会拿 body 继承 #222 判假阳；HTML div 天然同口径。 */}
      <div className="score-ring-num">{score}</div>
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
/* 🎂 E85-②（主公军令 2026-10-24）：宇宙生日年鉴双按钮六语统一词条——
   「解锁姻缘月报 $2.99 / 解锁姻缘年报 $29.99」永久带金额呈现；
   取消「(已解锁)」覆盖态与「生成情感月报/年报」免费文案态（军令原文给定，
   行为按权益分流：已购/VIP 点击＝生成，未购点击＝购买）。 */
const L_ALMANAC_BTN: Record<string, { monthly: string; yearly: string }> = {
  zh: { monthly: '📅 解锁姻缘月报 $2.99', yearly: '👑 解锁姻缘年报 $29.99' },
  en: { monthly: '📅 Unlock Monthly Love Report $2.99', yearly: '👑 Unlock Annual Love Report $29.99' },
  fr: { monthly: "📅 Débloquer le Rapport Mensuel d'Amour $2.99", yearly: "👑 Débloquer le Rapport Annuel d'Amour $29.99" },
  es: { monthly: '📅 Desbloquear Informe Mensual de Amor $2.99', yearly: '👑 Desbloquear Informe Anual de Amor $29.99' },
  th: { monthly: '📅 ปลดล็อกรายงานดวงความรักรายเดือน $2.99', yearly: '👑 ปลดล็อกรายงานดวงความรักรายปี $29.99' },
  vi: { monthly: '📅 Mở Khóa Báo Cáo Nhân Duyên Tháng $2.99', yearly: '👑 Mở Khóa Báo Cáo Nhân Duyên Năm $29.99' },
};

function AIInsightBlock({ d1, d2, t1, c1, t2, c2, overall, dims, bazi, zodiac, iching, baziMeta, zodiacMeta, ichingMeta, luckyAspects, challengingAspects, lang, onTriggerInsight, pendingInsightTrigger, pendingReportTrigger, onReportConsumed, onLogout }: {
  d1: string; d2: string; overall: number;
  // 🌌 E40+：双人时空真值（可选；缺省 ⇒ 服务端如实降级，不伪造）
  t1?: string; c1?: { key: string; tz: string; lat: number; lon: number } | null;
  t2?: string; c2?: { key: string; tz: string; lat: number; lon: number } | null;
  dims: CompatibilityResult['dimensions'];
  bazi: string; zodiac: string; iching: string;
  baziMeta?: string[]; zodiacMeta?: string[]; ichingMeta?: string[];
  luckyAspects?: string[]; challengingAspects?: string[];
  lang: 'zh' | 'en' | 'es' | 'fr' | 'th' | 'vi';
  onTriggerInsight?: () => void;
  pendingInsightTrigger?: boolean;
  // ✦ E87-③：月报/年报付讫回场的报告自动生成信号（消费即清防重触）
  pendingReportTrigger?: 'monthly' | 'yearly' | null;
  onReportConsumed?: () => void;
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
  // 🔴 E85-①（主公军令 2026-10-24）：$4.99 按次消费品——per-session 解锁状态。
  //    每次新测算（handleCalculate/重新测算）重置为 unpaid；账号级旧权益（测试残留 paid 标记）
  //    不得跨次白送。当次支付返回（pendingInsightTrigger）才置 unlocked ⇒ 付费墙 100% 必现。
  const [sessionUnlocked, setSessionUnlocked] = useState<boolean>(() => {
    try { return sessionStorage.getItem('ks_compat_session_unlocked') === '1'; } catch { return false; }
  });
  const [reportLoading, setReportLoading] = useState<string | false>(false);
  const [reportText, setReportText] = useState<string | null>(null);
  // 🔴 E90-①（主公军令 2026-10-25）：付费墙按钮加载态隔离——被点击的档位 plan
  //    （'compatibility_once' | 'compatibility_monthly_report' | 'compatibility_yearly_report'）；
  //    false ⇒ 无任何档位处于唤起中（PaywallCard 三按钮零连带加载态）。
  const [activePurchasePlan, setActivePurchasePlan] = useState<string | false>(false);
  // 🔴 E88-②（主公军令 2026-10-26）：报告长卷「打字机」渐进渲染——
  //    SSE 协议不动（阶段帧+终帧整文契约封仓），前端以段落为粒度逐段揭示，
  //    观感＝流式打字机长卷展开。Infinity ⇒ 全量直显（失败文案/冷启动旧文）。
  const [revealedParas, setRevealedParas] = useState<number>(Number.POSITIVE_INFINITY);
  const reportParas = React.useMemo(
    () => (reportText ? reportText.split('\n\n').map((p) => p.trim()).filter((p) => p !== '') : []),
    [reportText],
  );
  const reportTyping = revealedParas !== Number.POSITIVE_INFINITY && revealedParas < reportParas.length;
  React.useEffect(() => {
    if (!reportText || reportParas.length === 0) return;
    // 🔴 E90-②（主公军令 2026-10-25）：打字机卡死在第一章标题的真凶根治。
    //    旧病灶：依赖数组含 `revealedParas === 0` ⇒ 130ms 后 0→1 触发依赖变更 →
    //    React 跑 cleanup（clearInterval）→ 新 effect 直接 return 不再启动 → 揭示
    //    **永远停在第一段**（＝主公只看到第一章标题＋孤零零光标）。
    //    治法：依赖只挂 [reportText, reportParas.length]（打字中途不变 ⇒ interval 存活），
    //    起点 0 由当次渲染闭包判定；终点 Infinity 时 interval 自清（不空转）。
    if (revealedParas !== 0) return;
    const id = setInterval(() => {
      setRevealedParas((p) => {
        const next = p + 1 >= reportParas.length ? Number.POSITIVE_INFINITY : p + 1;
        if (next === Number.POSITIVE_INFINITY) clearInterval(id);
        return next;
      });
    }, 130);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportText, reportParas.length]);
  // const [showPricePreview, setShowPricePreview] = useState(false);
  // 🎯 军师方案：防止重复触发 checkout 的 ref
  const hasTriggeredCheckout = useRef(false);
  const insightLockRef = useRef(false);

  // 🚀 Watch pendingInsightTrigger from parent (App) and auto-trigger
  // 🔴 E85-①（主公军令 2026-10-24）：pendingInsightTrigger ＝ 当次支付真实返回 ⇒ 此刻才解锁
  //    per-session 状态（落 sessionStorage 跨 reload 存续）并自动流式揭晓 AI 洞察＋塔罗。
  //    🧹 E85-③：旧「支付后自动生成 once 合盘四段深报」的二段链随合盘板块退役。
  useEffect(() => {
    if (pendingInsightTrigger) {
      try { sessionStorage.setItem('ks_compat_session_unlocked', '1'); } catch { /* noop */ }
      setSessionUnlocked(true);
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
        setIsAuthParsing(false);
        setSessionChecked(true);
        setShowAuthWall(false);

        // ── Magic Link / OAuth 回调：parent 窗口 reload 后 Supabase 自动触发 SIGNED_IN ──
        // 此时 onAuthStateChange 在 App.tsx 里触发，直接 reload 页面让各子组件重新拿 session
        if (localStorage.getItem('ks_auth_callback_pending') === '1') {
          localStorage.removeItem('ks_auth_callback_pending');
          console.log('[KindredSouls Auth] Auth callback reload detected, refreshing page...');
          window.location.reload();
          return;
        }

        // ── 检查意图：有 checkout 意图才跳 /result；否则留在当前页 ──
        const urlParams = new URLSearchParams(window.location.search);
        const isPendingCheckout = urlParams.get('intent') === 'checkout';
        const pendingPlanFromStorage = localStorage.getItem('ks_pending_checkout_plan');

        if (pendingPlanFromStorage && !hasTriggeredCheckout.current) {
          // 🐮 军师方案：localStorage 兜底，有待处理 plan → 触发 Stripe
          console.log('[KindredSouls Auth] 🐮 SIGNED_IN: Restored pending checkout from localStorage:', pendingPlanFromStorage);
          localStorage.removeItem('ks_pending_checkout_plan');
          const alreadyCovered = await checkCoverageInline(session!.access_token, pendingPlanFromStorage);
          if (alreadyCovered) {
            console.log('[KindredSouls Auth] SIGNED_IN: Already covered, skipping Stripe checkout');
            hasTriggeredCheckout.current = true;
            setPaidStatus(true);
            setShowPaywall(false);
            // 有购买意图 → 跳 result
            window.history.replaceState({}, '', '/result');
          } else {
            console.log('[KindredSouls Auth] SIGNED_IN: No existing coverage, triggering Stripe checkout...');
            hasTriggeredCheckout.current = true;
            handlePurchaseWithToken(session!.access_token, pendingPlanFromStorage);
          }
          return;
        }

        if (isPendingCheckout && !hasTriggeredCheckout.current) {
          // URL 有 checkout 意图 → 先检查是否已有 cover
          console.log('[KindredSouls Auth] SIGNED_IN: intent=checkout in URL, checking coverage...');
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
          return;
        }

        if (hasTriggeredCheckout.current) {
          console.log('[KindredSouls Auth] SIGNED_IN: checkout already in progress, skipping');
        } else {
          // ❌ 无 checkout 意图：只更新状态，留在当前页（不强制跳转 /result）
          console.log('[KindredSouls Auth] SIGNED_IN: No checkout intent, staying on current page');
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
      let token: string | null = null;
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      token = refreshData?.session?.access_token || null;
      if (refreshError || !token) {
        console.error('[saveResult] Token refresh failed:', refreshError);
        // fallback: 用 getSession
        const { data: { session } } = await supabase.auth.getSession();
        token = session?.access_token || null;
      }
      if (!token) {
        console.error('[saveResult] No valid token after refresh+fallback');
        return;
      }
      const res = await fetch('/api/save-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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

;

  // ── handlePurchase 入口：优先用全局 token，兜底 refreshSession ──


  // 🐮 简化版：只存 localStorage + 弹登录墙，不返回 Promise
  // 🔴 E86-③（主公军令 2026-10-24）：点击「立即解锁」即刻触发加载态（军令验收
  //    「点击 → 加载态 → 跳转网关」三段链）——异步等待期间绝不 window.open，
  //    全部 window.location.href 全页定向（E72 铁律同源）。
  const handlePurchase = (plan: string) => {
    setLoading(true);
    // 🔴 E90-①（主公军令 2026-10-25）：付费墙按钮加载态按档位隔离——记下被点击的
    //    plan ⇒ PaywallCard 仅该档位按钮转 ⏳，其余按钮文案/可点击态原样（互不干扰）。
    setActivePurchasePlan(plan);
    // 先检查是否已登录
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        // 已登录，直接触发 Stripe（loading 保持至跳转/沙盘收银台/already_paid reload）
        handlePurchaseWithToken(session.access_token, plan);
      } else {
        // 没登录：存意图 + 弹登录墙（loading 收口，登录门上屏）
        setLoading(false);
        setActivePurchasePlan(false);
        localStorage.setItem('ks_pending_checkout_plan', plan);
        setShowPaywall(false);
        setShowAuthWall(true);
        console.log('[KindredSouls Debug] 🐮 Stored pending plan:', plan);
      }
    });
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
      // 🔴 E92-①：洞察请求补 t1/t2 出生时辰（服务端八字硬锁算时柱用；缺省 ⇒ 三柱如实）
      const tarot = getTarot(d1, d2, lang);
      const res = await fetch('/api/ai-advisor', {
        method: 'POST',
        headers,
        body: JSON.stringify({ d1, d2, overall, dims, bazi, zodiac, iching, lang, baziMeta, zodiacMeta, ichingMeta, luckyAspects, challengingAspects, tarot, t1, t2 }),
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
  // 🛍️ E39-C→🧹 E85（主公军令 2026-10-24）：两档报告生成（monthly 姻缘月报 / yearly 姻缘年报）。
  //    once 合盘四段深报随「合盘」板块整体退役；交付改纯文本段落（张量画布渲染链已下架）。
  const generateReport = async (type: 'monthly' | 'yearly') => {
    if (reportLoading) return;
    setReportLoading(type);
    setReportText(null);
    try {
      // 强制刷新 session 获取最新 token
      let token: string | null = null;
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      token = refreshData?.session?.access_token || null;
      if (refreshError || !token) {
        console.error('[generateReport] Token refresh failed:', refreshError);
        // fallback: 用 getSession
        const { data: { session } } = await supabase.auth.getSession();
        token = session?.access_token || null;
      }
      if (!token) throw new Error('No session');
      // 🔴 E92-②：三档抽卡解耦——报告档掺档位盐（monthly/yearly 独立卡槽，
      //    与 $4.99 洞察的默认 'insight' 互不覆盖，终结「全盘女皇逆位」撞车）。
      const tarot = getTarot(d1, d2, lang, type);
      const res = await fetch('/api/ai-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          d1, d2, lang,
          bazi, zodiac, iching, tarot,
          reportType: type,
          // 🛡️ Gate 43：请求推演进度帧（服务端不支持/中间件拦截 ⇒ 自动回退 JSON，前端无缝降级）
          stream: true,
          // 🌌 E40+：瑞士星历双人时空真值（全空 ⇒ 服务端零引擎调用 + 显式未知声明）
          timeTruth: {
            a: { birthTime: t1 || '', tz: c1?.tz || '', lat: c1 ? c1.lat : '', lon: c1 ? c1.lon : '' },
            b: { birthTime: t2 || '', tz: c2?.tz || '', lat: c2 ? c2.lat : '', lon: c2 ? c2.lon : '' },
          },
        }),
      });
      // 🛡️ Gate 43（🧹 E85 后仅保留读流核）：服务端以 SSE 应答 ⇒ 流式读帧取终局载体
      //   （进度卡已退役，onStage 置 noop）；其余情形走既有 JSON 降级，契约零回归。
      const _ctype = String(res.headers.get('content-type') || '');
      let data: any = null;
      if (res.ok && _ctype.includes('text/event-stream') && res.body && typeof res.body.getReader === 'function') {
        data = await readCompatSSEStream(res.body, () => { /* E85: 进度帧无消费者 */ });
      } else {
        data = await res.json();
      }
      if (!data) data = {};
      // 🛡️ Gate 41：Report ID 索引（同名输入 ⇒ 服务端 read-through 秒级复读，零算力消耗）
      if (data.reportId) {
        try {
          localStorage.setItem(`compatReportId:${lang}:${type}`, String(data.reportId));
        } catch (e) {
          console.warn('[generateReport] reportId index skipped:', e);
        }
      }
      if (data.insight) {
        setReportText(data.insight);
        setRevealedParas(0); // 🔴 E88-②：长卷打字机渐进渲染起点（0 ⇒ 逐段揭示）
      } else {
        // 🔴 E89-④（主公军令 2026-10-25）：解封真实报错——严禁静默吞并。
        //    UI 保持友好文案；真因（HTTP 状态/错误码/requiredPlan/nextAvailable）
        //    一并浮现开发日志（console），排障不再靠猜。
        console.error('[Report Gen Error]:', {
          status: res.status,
          error: data.error || null,
          code: data.code || null,
          requiredPlan: data.requiredPlan || null,
          nextAvailable: data.nextAvailable || null,
          reportType: type,
        });
        setReportText(lang === 'zh' ? '生成报告失败，请重试。' : 'Failed to generate report. Please try again.');
        setRevealedParas(Number.POSITIVE_INFINITY);
      }
    } catch (err) {
      console.error('[AIInsightBlock] generateReport error:', err);
      setReportText(lang === 'zh' ? '网络错误，请重试。' : 'Network error. Please try again.');
      setRevealedParas(Number.POSITIVE_INFINITY);
    } finally {
      setReportLoading(false);
    }
  };
  // ✦ E87-③（主公军令 2026-10-25）：月报/年报付讫回场自动生成链——沙盒付款 reload 后
  //    组件冷启动（insight 等局部 state 已清）：先落会话解锁，再并行复活 once 洞察
  //    （服务端 Gate41 缓存秒回）＋自动生成对应报告；消费即清防重触。
  useEffect(() => {
    if (pendingReportTrigger === 'monthly' || pendingReportTrigger === 'yearly') {
      try { sessionStorage.setItem('ks_compat_session_unlocked', '1'); } catch { /* noop */ }
      setSessionUnlocked(true);
      if (!insight) triggerInsight();
      generateReport(pendingReportTrigger);
      onReportConsumed?.();
    }
  }, [pendingReportTrigger]);
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
  // Auth wall — not logged in (ONLY shown after user clicked "解锁" on paywall)
  // 🔴 E86-③（主公军令 2026-10-24）：AuthWall 分支必须前置——E85 后付费墙条件
  //    `showPaywall || !sessionUnlocked` 恒真（未支付前），原顺序把登录墙顶死成
  //    永不可达 ⇒ 未登录点「立即解锁」只落 ks_pending_checkout_plan 无人接盘，
  //    按钮看似「点击无效」。前置后：未登录点击 → 登录门即刻呈现（E72 意图先行链）。
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
            color: '#F5D08A', /* ✦ E84：图标色金辉（原继承 #222 在深底上 1.37:1 违 WCAG） */
          }}>🔮</div>
          <h3 style={{ marginBottom: 0 }}>✨ {TXT.aiTitle[lang] || TXT.aiTitle.en}</h3>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <AuthWallCard lang={lang} />
        </div>
      </div>
    );
  }
  // Stripe paywall — logged in but not paid
  // 🎯 明牌流：先弹价格，用户愿意付费才登录
  // ── 付费墙：优先显示（无论登录状态）──
  // 🔴 E85-①（主公军令 2026-10-24）：当次测算会话未解锁（sessionUnlocked=false）⇒
  //    /result 底部 100% 呈现 $4.99 付费墙——账号级旧权益（paidStatus=true）不得跨次白送，
  //    严禁出现「跳过付费墙直接出报告」与孤立「生成 AI 洞察」按钮。
  // 🔴 E86-③：本分支已在 AuthWall 之后（登录门优先——未登录点击「立即解锁」的合法承接位）。
  if (showPaywall || !sessionUnlocked) {
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
            color: '#F5D08A', /* ✦ E84：图标色金辉（原继承 #222 在深底上 1.37:1 违 WCAG） */
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
            <PaywallCard lang={lang} loading={loading} activePlan={activePurchasePlan} onPurchase={handlePurchase} />
          </div>
        </div>
      </div>
    );
  }
  // Logged in — show button or result
  return (
    <div className="ai-insight">
      <h3>✨ {TXT.aiTitle[lang] || TXT.aiTitle.en}</h3>
      {/* 🔴 E85-①（主公军令 2026-10-24）：孤立「✨ 生成 AI 洞察」按钮废除——未付费时付费墙
          100% 呈现（上面分支拦截），本按钮仅作「当次已解锁＋洞察缺场（网络失败等）」的
          合法重试入口；正常流＝支付返回自动流式揭晓，无需手点。 */}
      {sessionUnlocked && !insight && !loading && !error && (
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
        /* ✦ E84（主公军令 2026-10-22）：AI 洞察高定排版——分级段落＋金句高亮框：
           【】开头段＝金句铭牌（金框高亮），其余段落香槟白左对齐、行距 1.75 呼吸感。 */
        <div className="insight-result">
          {insight.split('\n\n').map((para, i) => {
            const trimmed = para.trim();
            if (/^【.+】$/.test(trimmed) || /^【/.test(trimmed)) {
              return <p key={i} className="ks-insight-quote">{para}</p>;
            }
            if (trimmed.startsWith('✦') || trimmed.startsWith('✨') || trimmed.startsWith('🌟')) {
              return <p key={i} className="ks-insight-highlight">{para}</p>;
            }
            return <p key={i}>{para}</p>;
          })}
          {tarotCard && (
            /* ✦ E84（主公军令 2026-10-22）：塔罗牌卡面精修——🌍 emoji 裸奔退役，
               暗金铭牌框（.ks-tarot-frame）＋微光悬浮动效＋正逆位旋转；正逆位文案取
               tarot.ts 六语真源 orientation（原硬编码英文 Upright/Reversed 退役）。 */
            <div className="ks-tarot-frame">
              <div className="ks-tarot-glyph" style={{ transform: tarotCard.isReversed ? 'rotate(180deg)' : 'none' }}>{tarotCard.emoji}</div>
              <div className="ks-tarot-name">{tarotCard.name}<span className="ks-tarot-orient"> · {tarotCard.orientation}</span></div>
            </div>
          )}
          {tarotLine && (
            /* ✦ E87-①（主公军令 2026-10-25）：解读行内 opacity:0.85 压暗样式退役，
               改挂 .ks-tarot-line——与上方报告正文同一亮度令牌单源。 */
            <p className="ks-tarot-line">{tarotLine}</p>
          )}
          {/* 🐾 E85-③/④（主公军令 2026-10-24）：付费揭晓区纯净结构之二 —— 🐾 认领专属灵宠卡
              （原挂在合盘报告交付后，随合盘退役提升为 AI 洞察直后的独立板块；
               🔴 E34 D5 白名单纪律不变：须有真实出生城市才挂载，缺 c1 ⇒ 不挂载零伪造坐标） */}
          {insight && c1 && (
            <AdoptFamiliarCTA
              birthDate={d1}
              birthTime={t1 || ''}
              lat={c1.lat}
              lon={c1.lon}
              tz={c1.tz}
              lang={lang}
            />
          )}
          {/* 🎂 E85-②/③（主公军令 2026-10-24）：宇宙生日年鉴（付费揭晓区纯净结构收尾）——
              双按钮六语统一「解锁姻缘月报 $2.99 / 解锁姻缘年报 $29.99」永久带金额呈现，
              取消「(已解锁)」覆盖态与「生成情感月报/年报」文案态；行为按权益分流
              （已购/VIP 点击＝生成，未购点击＝购买）。
              🧹 合盘张量画布（CompatReportCanvas）与推演进度卡（SynastryProgress）渲染退役，
              月报/年报交付＝纯文本段落呈现（服务端 payload 契约不动，后端封仓零改动）。 */}
          {insight && (
            <div className="ks-glass-card" style={{ marginTop: '20px', padding: '16px' }}>
              <div style={{ fontSize: '13px', color: 'var(--ks-text-gold, #F5D08A)', fontWeight: 700, marginBottom: '8px' }}>
                🎂 {lang === 'zh' ? '宇宙生日年鉴' : lang === 'en' ? 'Your Solar Return Almanac' : lang === 'es' ? 'Tu Almanaque Solar' : lang === 'fr' ? 'Ton Almanach Solaire' : lang === 'th' ? 'ปฏิทินสุริยะของคุณ' : 'Nhật Ký Mặt Trời'}
              </div>
              <div style={{ fontSize: '11px', color: '#E9D8A6', marginBottom: '8px', lineHeight: 1.5 }}>
                {lang === 'zh' ? '基于您的 Solar Return（太阳返照日）生成，推演未来12个月的命运蓝图' : lang === 'en' ? "Based on your Solar Return, a 12-month destiny blueprint unfolds." : lang === 'es' ? 'Basado en tu Retorno Solar, un mapa de 12 meses se despliega.' : lang === 'fr' ? 'Basé sur votre Retour Solaire, une carte de 12 mois se dévoile.' : lang === 'th' ? 'อิงจาก Solar Return ของคุณ พระตำหนักโชคชะตา 12 เดือนจะปรากฏ' : 'Dựa trên Solar Return, bản đồ 12 tháng được vẽ nên.'}
              </div>
              {/* 📅 月报按钮：E87-②（主公军令 2026-10-25）——账号级权益旁路退役
                  （曾致未付直调生成接口被后端按当次权益判定拒绝、报「生成报告失败」）。
                  点击一律先走购买链：沙盒收银台/already_paid 由 handlePurchaseWithToken
                  统一收口，付讫回场经 ks_paid_report_type 自动生成对应报告。 */}
              <button
                onClick={() => { handlePurchase('compatibility_monthly_report'); }}
                disabled={!!reportLoading}
                style={{ display: 'block', width: '100%', marginBottom: '8px', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(212,175,55,0.4)', background: reportLoading ? '#444' : 'rgba(212,175,55,0.1)', color: '#D4AF37', fontSize: '13px', fontWeight: 700, cursor: reportLoading ? 'not-allowed' : 'pointer' }}
              >
                {reportLoading === 'monthly' ? '⏳...' : (L_ALMANAC_BTN[lang] || L_ALMANAC_BTN.en).monthly}
              </button>
              {/* 👑 年报按钮：E87-② 同令——购买先行，付讫回场自动生成年报 */}
              <button
                onClick={() => { handlePurchase('compatibility_yearly_report'); }}
                disabled={!!reportLoading}
                style={{ display: 'block', width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(192,132,252,0.45)', background: reportLoading ? '#444' : 'rgba(192,132,252,0.1)', color: '#D8B4FE', fontSize: '13px', fontWeight: 700, cursor: reportLoading ? 'not-allowed' : 'pointer' }}
              >
                {reportLoading === 'yearly' ? '⏳...' : (L_ALMANAC_BTN[lang] || L_ALMANAC_BTN.en).yearly}
              </button>
              {reportText && (
                /* 🔴 E88-②（主公军令 2026-10-26）：黑金长卷渲染容器——
                   · 章节头（第X章/Chapter N 六语形态）＝金标题铭牌（.ks-report-chapter）；
                   · 正文段＝香槟白（.ks-report-para）；
                   · 打字机渐进：逐段揭示（revealedParas），进行中尾部缀 ✦ 光标；
                   · 超长内容自持滚动槽。
                   🔴 E90-③：容器升级财富同款金属框。
                   🔴 E91-②/③（主公军令 2026-10-25）：底色与光效逐字对齐财富正文真源
                   SacredYearlyReportBox（曜黑渐变）；滑轨改 .ks-report-scroll 自带
                   ::-webkit-scrollbar 逐字克隆 Sacred .dark-scrollbar（V257 封仓规格）——
                   celestial-scrollbar 并挂退役（两套规格打架根因）。规格全在 App.css。 */
                <div className="ks-report-scroll" data-testid="compat-report-scroll">
                  {reportParas
                    .slice(0, reportTyping ? revealedParas : reportParas.length)
                    .map((para, i) => {
                      const isChapterHead = /^(第[一二三四五六七八九十]+章|Chapter\s+\d|Cap[íi]tulo\s+\d|Chapitre\s+\d|บทที่\s+\d|Chương\s+\d)/.test(para);
                      return isChapterHead
                        ? <p key={i} className="ks-report-chapter">{para}</p>
                        : <p key={i} className="ks-report-para">{para}</p>;
                    })}
                  {reportTyping && <p className="ks-report-cursor" aria-hidden="true">✦ …</p>}
                </div>
              )}
            </div>
          )}
          {/* 🔴 E91-①（主公军令 2026-10-25）：「退出登录」按钮退役——
             黑屏根因＝handleLogout 清数据后 reload ⇒ result 为空 ⇒ 渲染空白页；
             退出登录归属全局个人中心，绝不出现在交付长卷（军令逐字）。
             「重新测算」back-btn 链路已核验合规（清缓存＋平滑回表单）。 */}
        </div>
      )}
    </div>
  );
}

/* ── Result Page ── */
function ResultPage({ result, onBack, lang, pendingInsightTrigger = false, setPendingInsightTrigger, pendingReportTrigger = null, setPendingReportTrigger, onLogout }: { result: CompatibilityResult; onBack: () => void; lang: 'zh' | 'en' | 'es' | 'fr' | 'th' | 'vi'; pendingInsightTrigger?: boolean; setPendingInsightTrigger?: (v: boolean) => void; pendingReportTrigger?: 'monthly' | 'yearly' | null; setPendingReportTrigger?: (v: 'monthly' | 'yearly' | null) => void; onLogout?: () => void }) {
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
  // ✦ E87-③（主公军令 2026-10-25）：付讫信号分诊——ks_paid_report_type 在场 ⇒ 月报/
  //    年报自动生成；否则 once 洞察自动揭晓（E84 链保持不动）。
  useEffect(() => {
    if (sessionStorage.getItem('ks_payment_success') === '1') {
      const paidType = sessionStorage.getItem('ks_paid_report_type');
      sessionStorage.removeItem('ks_payment_success');
      if (paidType === 'monthly' || paidType === 'yearly') {
        sessionStorage.removeItem('ks_paid_report_type');
        setPendingReportTrigger && setPendingReportTrigger(paidType);
      } else {
        setPendingInsightTrigger && setPendingInsightTrigger(true);
      }
    }
  }, []);

  return (
    <div className="page result-page">
      <button className="back-btn" onClick={onBack}>← {t('result.back')}</button>

      <ScoreRing score={overall} />
      <p className="score-label">{t('result.overall')}</p>

      <DimensionBars dims={dimensions} lang={lang} />

      {/* ── Collapsible Details (Engine Cards + Aspects) ── */}
      {/* ✦ E84：折叠开关黑金化（原内联 #fff 白底退役，改 ks-detail-toggle 毛玻璃触发条） */}
      <div style={{ marginTop: '24px' }}>
        <button
          className={`ks-detail-toggle${showDetails ? ' ks-detail-open' : ''}`}
          onClick={() => setShowDetails(!showDetails)}
        >
          <span className="ks-detail-toggle-label">{showDetails ? (TXT.detailHide[lang] || TXT.detailHide.en) : (TXT.detailShow[lang] || TXT.detailShow.en)}</span>
          <span className={`chevron ${showDetails ? 'open' : ''}`}>›</span>
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
        t1={result._t1}
        c1={result._c1}
        t2={result._t2}
        c2={result._c2}
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
        pendingReportTrigger={pendingReportTrigger}
        onReportConsumed={() => setPendingReportTrigger && setPendingReportTrigger(null)}
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
      // 🛍️ V463: 爆款/法器路由预留（/artefact/:sku_id、/shop/item/:sku_id）不作 View
      if (/^\/(?:artefact|shop\/item)\/[^/]+\/?$/.test(path)) return null;
      if (path === '/wealth') return '/wealth';
      if (path === '/wealth/report') return '/wealth/report';
      // 🧪 Gate 45-B：沙盘收银台同源直达路由（兜底承载）
      if (path === SANDBOX_PAY_PATH) return SANDBOX_PAY_PATH;
      // 🐾 E55-3: 2.0 定制殿堂直达路由已战略隐藏（原 E54-4 判定位）
    }
    return null;
  });

  // ── 🛍️ V463: 爆款/物理法器 路由预留（军师指令 2026-09-21）──
  //   /artefact/:sku_id 与 /shop/item/:sku_id 暂不开发 View：
  //   统一兜底重定向回主站 + 极简「能量载体孕育中」Toast，确保路由不报错、不空白。
  //   未来商城上线时，仅需把这里换成真实的 ArtefactPage 即可。
  const [artefactNotice, setArtefactNotice] = useState<string | null>(null);
  useEffect(() => {
    const ARTEFACT_NOTICE: Record<string, string> = {
      zh: '能量载体孕育中',
      en: 'Your artefact is still being forged',
      es: 'Tu artefacto aún se está forjando',
      fr: 'Votre artefact est encore en forge',
      th: 'พลังงานของคุณกำลังถูกหล่อหลอม',
      vi: 'Vật phẩm năng lượng đang được tạo hình',
    };
    const handleArtefactRoute = () => {
      const m = window.location.pathname.match(/^\/(?:artefact|shop\/item)\/([^/]+)\/?$/);
      if (!m) return;
      const sku = decodeURIComponent(m[1]);
      console.info('[V463] artefact route reserved, sku =', sku);
      try { window.history.replaceState({}, '', '/'); } catch { /* noop */ }
      setWealthPath(null);
      const _langKey = String(i18n.language || 'en').slice(0, 2).toLowerCase();
      setArtefactNotice(ARTEFACT_NOTICE[_langKey] || ARTEFACT_NOTICE.en);
      window.setTimeout(() => setArtefactNotice(null), 4200);
    };
    handleArtefactRoute();
    window.addEventListener('popstate', handleArtefactRoute);
    return () => window.removeEventListener('popstate', handleArtefactRoute);
  }, [i18n.language]);

  // ── Policy page routing (terms-of-service / privacy-policy) ──
  const [policyPage, setPolicyPage] = useState<'terms' | 'privacy' | null>(null);

  useEffect(() => {
    const handlePolicyRoute = () => {
      const path = window.location.pathname;
      if (path === '/terms-of-service') setPolicyPage('terms');
      else if (path === '/privacy-policy') setPolicyPage('privacy');
      else setPolicyPage(null);
    };
    handlePolicyRoute();
    window.addEventListener('popstate', handlePolicyRoute);
    return () => window.removeEventListener('popstate', handlePolicyRoute);
  }, []);


  const navigate = (path: string) => {
    const [pathname, search] = path.split('?');
    if (pathname === '/' || pathname === '') {
      // 返回首页：清空 wealthPath
      setWealthPath(null);
      // 如果带 ?showMode=true 参数，设置标记让 InputPage 自动弹出选择模式
      if (search?.includes('showMode=true')) {
        localStorage.setItem('ks_show_mode_modal', '1');
      }
    } else {
      setWealthPath(pathname);
    }
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
 // ✦ E87-③：月报/年报付讫回场的报告自动生成信号（ResultPage 消费 ks_paid_report_type 落此）
 const [pendingReportTrigger, setPendingReportTrigger] = useState<'monthly' | 'yearly' | null>(null);

  // ── handlePurchase 核心逻辑（接收明确的 token 参数）──




  // 🛡️ App.tsx 不再监听 OAuth/KS_CHECKOUT/冷启动——单一信号源由 WealthReportPage polling 接管

  useEffect(() => {
    // 双重保险：getSession + onAuthStateChange 监听
    let done = false;
    
    // 方法1：立刻检查
    const scanNow = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const pendingPlan = localStorage.getItem("ks_pending_checkout_plan");
      if (session?.access_token && pendingPlan && !done) {
        done = true;
        console.log("[KindredSouls Debug] 🐮 Cold start detected pending order:", pendingPlan);
        localStorage.removeItem("ks_pending_checkout_plan");
        handlePurchaseWithToken(session.access_token, pendingPlan);
      }
    };
    scanNow();
    
    // 方法2：监听 INITIAL_SESSION（SDK 恢复 session 时触发）
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && session?.access_token && !done) {
        const pendingPlan = localStorage.getItem("ks_pending_checkout_plan");
        if (pendingPlan) {
          done = true;
          console.log("[KindredSouls Debug] 🐮 Auth event detected pending order:", event, pendingPlan);
          localStorage.removeItem("ks_pending_checkout_plan");
          handlePurchaseWithToken(session.access_token, pendingPlan);
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

 useEffect(() => {
 const search = window.location.search;
 // 🔴 E87-③（主公军令 2026-10-25）「年报支付后黑屏」主病灶：沙盒付讫回场只有
 //    会话标志（URL 无 payment=success），旧判定不认 ⇒ 走纯冷启动分支——既不恢复
 //    result 又清掉 ks_result ⇒ /result 零渲染＝黑屏。纳入会话信号后照常恢复现场。
 const paymentSuccess = new URLSearchParams(window.location.search).get('payment') === 'success'
   || sessionStorage.getItem('ks_payment_success') === '1';
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
 const pendingPlan = localStorage.getItem('ks_pending_checkout_plan');
 const wealthPlans = ['wealth_once','wealth_monthly_report','wealth_yearly_report','star_monthly_vip','all_pass_yearly'];
 if (wealthPlans.includes(pendingPlan || '')) {
   const birthDate = r?.birthDate || localStorage.getItem('wealth_birth') || '';
   const lang = r?.lang || localStorage.getItem('wealth_lang') || 'en';
   // 🛡️ 45-D2c:「现场秒级恢复」优先复用**全参**回跳 URL（time/城市/经纬度/时区齐备）。
   //   旧写法硬编码 `/wealth?birth=…&lang=…` ⇒ 坐标全丢（冷启动退回曼谷默认盘），
   //   且落回**输入页**而非报告页。仅当 ks_oauth_back_url 缺失时才回退。
   const restored = localStorage.getItem('ks_oauth_back_url')
     || `/wealth?birth=${encodeURIComponent(birthDate)}&lang=${lang}`;
   const rsep = restored.includes('?') ? '&' : '?';
   window.location.href = restored + rsep + 'intent=checkout&plan=' + pendingPlan;
 } else {
   setResult(r);
   _setPage('result');
 }
 if (justLoggedIn) localStorage.removeItem('ks_just_logged_in');
 } catch (e) {
 console.error('[KindredSouls Debug] Failed to parse ks_result:', e);
 localStorage.removeItem('ks_result');
 }
 } else if ((isOAuthCallback || justLoggedIn || paymentSuccess) && !savedResult) {
   // 🧪 兜底：reportData 未加载时，直接用 ks_oauth_back_url 回跳财富页
   const backUrl = localStorage.getItem('ks_oauth_back_url');
   const pendingPlan = localStorage.getItem('ks_pending_checkout_plan');
   const wealthPlans = ['wealth_once','wealth_monthly_report','wealth_yearly_report','star_monthly_vip','all_pass_yearly'];
   if (backUrl && wealthPlans.includes(pendingPlan || '')) {
     const sep = backUrl.includes('?') ? '&' : '?';
     window.location.href = backUrl + sep + 'intent=checkout&plan=' + pendingPlan;
   }
   // 🔴 E87-④/⑤（主公军令 2026-10-25）：通用 backUrl 盲跳分支退役——陈年
   //    ks_oauth_back_url（财富报告页所写、只写不清）曾把「OAuth 回调上下文＋
   //    无 ks_result」的 '/' 冷启动（认领灵宠回首页/重新登录皆此形态）整页劫持进
   //    /wealth/report?… 死循环，首页永不可达。回跳现场仅保留上一分支的
   //    「财富购买意图」单一合法通道（intent=checkout 全参续跑）。
 } else if (!isOAuthCallback && !justLoggedIn && !paymentSuccess) {
 // Only clear ks_result if NOT returning from OAuth/payment
 localStorage.removeItem('ks_result');
 // 🔴 E87-④：纯冷启动（无 OAuth/支付/回场上下文）⇒ 同步清陈年回跳劫持源，
 //    '/' 永不被旧 wealth 现场污染。
 try { localStorage.removeItem('ks_oauth_back_url'); } catch { /* noop */ }
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
      // 🐾 E55-3: /familiar/custom 已战略隐藏（popstate 判定同步移除）
      if (path === '/wealth' || path === '/wealth/report' || path === SANDBOX_PAY_PATH) {
        setWealthPath(path);
      } else {
        setWealthPath(null);
      }
    };
    window.addEventListener('popstate', handlePopstate);
    return () => window.removeEventListener('popstate', handlePopstate);
  }, []);

  // ── Magic Link / OAuth Popup 回调：监听子窗口 postMessage ──
  // 父窗口打开的 callback.html 完成后会发 KS_AUTH_SUCCESS，触发页面刷新
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'KS_AUTH_SUCCESS') {
        console.log('[KindredSouls Auth] 📡 Received KS_AUTH_SUCCESS from child window');
        localStorage.setItem('ks_auth_callback_pending', '1');
        window.location.reload();
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);


  const handleCalculate = (d1: string, d2: string, tt: CompatTimeTruth) => {
    setErr('');
    _setPage('loading');
    // 🔴 E85-①（主公军令 2026-10-24）：$4.99 按次消费品——每次新测算（开始测算/重新测算）
    //    强制重置当次会话解锁状态为 unpaid ⇒ /result 必现付费墙，账号级旧权益不得跨次白送。
    try { sessionStorage.removeItem('ks_compat_session_unlocked'); } catch { /* noop */ }
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
        // 🌌 E40+：双人时空真值随结果下传（ResultPage → AIInsightBlock → /api/ai-advisor）
        r._t1 = tt.t1 || '';
        r._c1 = tt.c1 || null;
        r._t2 = tt.t2 || '';
        r._c2 = tt.c2 || null;
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
      {/* 🛍️ V463: 爆款/法器路由预留的极简 Toast（封仓期仅兜底，无任何商城 UI） */}
      {artefactNotice && (
        <div
          role="status"
          style={{
            position: 'fixed', left: '50%', bottom: '36px', transform: 'translateX(-50%)',
            padding: '10px 22px', borderRadius: '999px', zIndex: 9999,
            background: 'rgba(13,13,26,0.92)', border: '1px solid #D4AF37',
            color: '#F5E1A4', fontSize: '13px', letterSpacing: '0.5px',
            boxShadow: '0 6px 24px rgba(0,0,0,0.45)', pointerEvents: 'none',
          }}
        >
          {artefactNotice}
        </div>
      )}
      {wealthPath === '/wealth' && <WealthPage onNavigate={navigate} />}
      {wealthPath?.startsWith('/wealth/report') && <WealthReportPage key="wealth-report" onNavigate={navigate} />}
      {/* 🧪 Gate 45-B：沙盘收银台直达路由页（挂载即由总线唤起模态） */}
      {wealthPath === SANDBOX_PAY_PATH && <SandboxPayPage onNavigate={navigate} />}
      {/* 🐾 E55-3: 2.0 定制殿堂路由已战略隐藏（原 E54-4 挂载位，底座保留） */}
      {/* 🧪 Gate 45-B：全局沙盘收银台模态（任意调用点经总线唤起；未唤起 ⇒ 零渲染） */}
      <SandboxCashier lang={currentLang} />
      {!wealthPath && _page === 'input' && <InputPage onSubmit={handleCalculate} onNavigateToWealth={handleNavigateToWealth} />}
      {!wealthPath && _page === 'loading' && <LoadingPage />}
      {!wealthPath && _page === 'result' && result && <ResultPage result={result} onBack={() => { localStorage.removeItem('ks_return_to_result'); localStorage.removeItem('ks_result'); setResult(null); _setPage('input'); window.history.pushState({}, '', '/'); }} lang={currentLang} pendingInsightTrigger={pendingInsightTrigger} setPendingInsightTrigger={setPendingInsightTrigger} pendingReportTrigger={pendingReportTrigger} setPendingReportTrigger={setPendingReportTrigger} onLogout={handleLogout} />}
      {!wealthPath && err && <p className="error-msg">{err}</p>}
      {policyPage && (
        <PolicyPage
          type={policyPage}
          onBack={() => {
            setPolicyPage(null);
            window.history.pushState({}, '', '/');
          }}
        />
      )}
    </div>
  );
}
