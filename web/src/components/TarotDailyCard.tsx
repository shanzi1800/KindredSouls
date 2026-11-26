/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🃏 E148-刀三（主公军令 2026-11-19）：今日塔罗 $1.99 查看面（自容组件）
 * ═══════════════════════════════════════════════════════════════════════════
 * 动线：挂载即静默探测（Bearer token ⇒ POST /api/tarot/daily，body 显式
 * chart_sig——与 App 购买请求同源同签：wealthChartSigOf(d1, t1||'12:00', c1…)）：
 *   · 200 ⇒ 直接呈牌（卡名＋正逆位＋LLM 短读；当日复读零计数）；
 *   · 402（未购且非会员）⇒ 购买按钮「🃏 开启今日塔罗 $1.99」⇒ onPurchase
 *     ('tarot_daily_once')（登录门/沙盒收银台/Stripe 全链复用 App handlePurchase 单源）；
 *   · 403/429 ⇒ 会员日限/全局熔断六语提示（明日再来）；
 *   · 其余 ⇒ 错误态＋重试。
 * ✦ E158-刀二（主公军令 2026-11-26）：前置门禁——gate 在场（$4.99 深度报告未解锁）⇒ 零探测、
 *   购买按钮置灰＋🔒 锁标＋tarot_gate_hint 提示（与灵宠门禁同语系）；解锁后 gate 撤除 ⇒ 即刻放行探测。
 * ✦ E158-刀七：单活手风琴——accordion.collapsed 且已呈牌 ⇒ 收起为黑金折叠条（数据留组件 state，
 *   重开零请求、零重复计费；绝不重新上锁）。
 * 纪律：六语自容 L_ 字典（零 i18n 键扰动——i18n 基线 138 不动）；牌面/牌名/
 * 正逆位一切真值来自服务端回执（E109「隐士幽灵」血训：前端绝不自抽牌）；
 * fr/es 标价小数逗号（E103-③ 铁律沿袭）。
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
// @ts-ignore —— wealthChartSig.mjs 为纯 JS 逻辑核（前后端同源，e131/e148 闸门守备）
import { wealthChartSigOf } from '../lib/wealthChartSig.mjs';

type Lang = 'zh' | 'en' | 'es' | 'fr' | 'th' | 'vi';

interface TarotDailyCardProps {
  lang: Lang;
  accessToken: string | null;
  birthDate: string;
  birthTime: string;
  lat: number;
  lon: number;
  tz: string;
  onPurchase: (plan: string) => void;
  /** ✦ E158-刀二：前置门禁（在场 ⇒ 不探测、购买按钮锁定并显示 hint） */
  gate?: { hint: string } | null;
  /** ✦ E158-刀七：单活手风琴（collapsed ⇒ 收起为折叠条；onReopen ⇒ 原地重开） */
  accordion?: { collapsed: boolean; onReopen: () => void; reopenLabel: string } | null;
  /** ✦ E158-刀四：场景（business / friendship ⇒ 服务端读牌走场景语境；缺省 romance 零变） */
  scene?: string;
  /** ✦ E158-刀七：相位外报（父组件据此判定「今日塔罗已呈牌」⇒ 可折叠） */
  onPhaseChange?: (phase: 'probe' | 'locked' | 'limit' | 'error' | 'done' | 'gate') => void;
}

/** 六语自容词典（title/buy/limit/err/load/again） */
const L_TITLE: Record<Lang, string> = {
  zh: '🃏 今日塔罗', en: '🃏 Today’s Tarot', fr: '🃏 Tarot du Jour',
  es: '🃏 Tarot del Día', th: '🃏 ไพ่ทาโรต์วันนี้', vi: '🃏 Tarot Hôm Nay',
};
/** ✦ E158-刀七：折叠条标题（去 emoji 的纯标题） */
const L_TITLE_TEXT: Record<Lang, string> = {
  zh: '今日塔罗', en: 'Today’s Tarot', fr: 'Tarot du Jour',
  es: 'Tarot del Día', th: 'ไพ่ทาโรต์วันนี้', vi: 'Tarot Hôm Nay',
};
const L_BUY: Record<Lang, string> = {
  zh: '开启今日塔罗 $1.99', en: 'Open Today’s Tarot $1.99',
  fr: 'Ouvrir le Tarot du Jour $1,99', es: 'Abrir el Tarot del Día $1,99',
  th: 'เปิดไพ่ทาโรต์วันนี้ $1.99', vi: 'Mở Tarot Hôm Nay $1.99',
};
const L_LIMIT: Record<Lang, string> = {
  zh: '今日的塔罗名额已用完，明天再来吧', en: 'Today’s tarot quota is used up — see you tomorrow',
  fr: 'Le quota de tarot du jour est épuisé — à demain', es: 'La cuota de tarot de hoy se agotó — hasta mañana',
  th: 'โควตาไพ่ทาโรต์วันนี้หมดแล้ว พบกันพรุ่งนี้', vi: 'Hạn mức Tarot hôm nay đã hết — hẹn gặp ngày mai',
};
const L_ERR: Record<Lang, string> = {
  zh: '暂时连不上星象台，请稍后再试', en: 'Cannot reach the star deck right now, please retry',
  fr: 'Impossible de joindre le pont stellaire, réessayez', es: 'No se puede conectar con la cubierta estelar, reintenta',
  th: 'ยังเชื่อมต่อดาดฟ้าดวงดาวไม่ได้ ลองอีกครั้ง', vi: 'Chưa kết nối được đài quan sát, vui lòng thử lại',
};
const L_RETRY: Record<Lang, string> = {
  zh: '重试', en: 'Retry', fr: 'Réessayer', es: 'Reintentar', th: 'ลองใหม่', vi: 'Thử lại',
};
const L_LOADING: Record<Lang, string> = {
  zh: '正在抽取今日牌…', en: 'Drawing today’s card…', fr: 'Tirage de la carte du jour…',
  es: 'Sacando la carta de hoy…', th: 'กำลังเปิดไพ่วันนี้…', vi: 'Đang rút lá bài hôm nay…',
};
/** 正逆位六语标签（与服务端真值回执配对展示） */
const L_ORIENT: Record<Lang, [string, string]> = {
  zh: ['正位', '逆位'], en: ['Upright', 'Reversed'], fr: ['À l’endroit', 'Inversé'],
  es: ['Normal', 'Invertido'], th: ['ตั้งตรง', 'กลับด้าน'], vi: ['Thuận', 'Ngược'],
};

interface TarotDailyData {
  card: { id: number; name: string | null; nameZh: string | null; reversed: boolean };
  reading: string;
  cached?: boolean;
}

const TarotDailyCard = ({ lang, accessToken, birthDate, birthTime, lat, lon, tz, onPurchase, gate = null, accordion = null, scene = 'romance', onPhaseChange }: TarotDailyCardProps) => {
  const [phase, setPhase] = useState<'probe' | 'locked' | 'limit' | 'error' | 'done' | 'gate'>('probe');
  const [data, setData] = useState<TarotDailyData | null>(null);
  const probingRef = useRef(false);

  // 🔴 签名单源：与 App.tsx handlePurchaseWithToken 购买请求同一表达式
  //    wealthChartSigOf(d1, t1 || '12:00', c1.lat, c1.lon, c1.tz)——购买落库签名与
  //    查看请求签名必须同形，否则付讫后 402 死锁（E131 血训同源）。
  const chartSig = wealthChartSigOf(birthDate, birthTime || '12:00', lat, lon, tz);

  const probe = useCallback(async () => {
    if (probingRef.current) return;
    probingRef.current = true;
    setPhase('probe');
    try {
      const res = await fetch('/api/tarot/daily', {
        method: 'POST',
        headers: accessToken
          ? { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }
          : { 'Content-Type': 'application/json' },
        // ✦ E158-刀四：场景随探测上送（romance 缺省不占位 ⇒ 服务端缓存键逐字节不变）
        body: JSON.stringify(scene === 'romance' ? { lang, chart_sig: chartSig } : { lang, chart_sig: chartSig, scene }),
      });
      if (res.ok) {
        const j = await res.json();
        if (j && j.ok === true && j.card) {
          setData({ card: j.card, reading: String(j.reading || ''), cached: !!j.cached });
          setPhase('done');
        } else {
          setPhase('error');
        }
      } else if (res.status === 401 || res.status === 402) {
        setPhase('locked');
      } else if (res.status === 403 || res.status === 429) {
        setPhase('limit');
      } else {
        setPhase('error');
      }
    } catch (_) {
      setPhase('error');
    } finally {
      probingRef.current = false;
    }
  }, [accessToken, chartSig, lang]);

  // 挂载即静默探测（登录态 + 合法签名为前置；未登录/未购 ⇒ locked 态买按钮）
  // ✦ E158-刀二：gate 在场 ⇒ 门禁态（零探测零请求）；gate 撤除 ⇒ 同一挂载内即刻放行探测
  useEffect(() => {
    if (gate) { setPhase('gate'); return; }
    if (accessToken && chartSig) void probe();
    else setPhase('locked');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, chartSig, !!gate]);
  useEffect(() => { if (onPhaseChange) onPhaseChange(phase); }, [phase]);

  if (!chartSig) return null;

  const orient = L_ORIENT[lang] || L_ORIENT.en;
  const cardName = data?.card.name || data?.card.nameZh || '';
  const orientLabel = data ? (data.card.reversed ? orient[1] : orient[0]) : '';

  // ✦ E158-刀七：已呈牌且被其它报告抢焦点 ⇒ 黑金折叠条（✦ 今日塔罗 · 力量 · 正位 ｜ 已解锁 · 点击展开重温 ▼）
  if (accordion && accordion.collapsed && phase === 'done' && data) {
    return (
      <button type="button" className="ks-e158-bar" lang={lang} data-testid="e158-bar-tarot" onClick={accordion.onReopen} aria-expanded="false">
        <span className="ks-e158-bar-title">✦ {L_TITLE_TEXT[lang] || L_TITLE_TEXT.en} · <span className="ks-e158-bar-sum">{cardName} · {orientLabel}</span></span>
        <span className="ks-e158-bar-reopen">{accordion.reopenLabel}</span>
      </button>
    );
  }

  return (
    <div
      data-testid="tarot-daily-card"
      style={{
        marginTop: '16px', padding: '16px', borderRadius: '16px',
        background: 'linear-gradient(170deg, #0e1028 0%, #0a0c1e 40%, #0D0D1A 100%)',
        border: '1px solid rgba(212,175,55,0.4)',
      }}
    >
      <div style={{ fontSize: '13px', color: '#F5D08A', fontWeight: 700, marginBottom: '10px' }}>
        {L_TITLE[lang] || L_TITLE.en}
      </div>

      {phase === 'probe' && (
        <div style={{ fontSize: '12px', color: '#9a9ab8' }}>{L_LOADING[lang] || L_LOADING.en}</div>
      )}

      {phase === 'locked' && (
        <button
          data-testid="tarot-daily-buy"
          onClick={() => onPurchase('tarot_daily_once')}
          style={{
            display: 'block', width: '100%', padding: '10px 14px', borderRadius: '10px',
            border: '1px solid rgba(212,175,55,0.45)', background: 'rgba(212,175,55,0.1)',
            color: '#D4AF37', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
            minHeight: '44px', textAlign: 'center', whiteSpace: 'normal', lineHeight: 1.4,
          }}
        >
          {L_BUY[lang] || L_BUY.en}
        </button>
      )}

      {phase === 'gate' && gate && (
        <div>
          <button
            type="button"
            data-testid="tarot-daily-buy"
            disabled
            aria-disabled="true"
            style={{
              display: 'block', width: '100%', padding: '10px 14px', borderRadius: '10px',
              border: '1px solid rgba(154,154,184,0.35)', background: 'rgba(154,154,184,0.08)',
              color: 'rgba(201,201,224,0.75)', fontSize: '13px', fontWeight: 700, cursor: 'not-allowed',
              minHeight: '44px', textAlign: 'center', whiteSpace: 'normal', lineHeight: 1.4,
              filter: 'grayscale(1)', opacity: 0.72,
            }}
          >
            🔒 {L_BUY[lang] || L_BUY.en}
          </button>
          <div data-testid="e158-tarot-gate-hint" style={{ marginTop: '8px', fontSize: '12px', color: '#c9b98a', lineHeight: lang === 'th' ? 1.55 : 1.5, overflowWrap: 'anywhere' }}>
            ✦ {gate.hint}
          </div>
        </div>
      )}

      {phase === 'limit' && (
        <div style={{ fontSize: '12px', color: '#c9c9e0', lineHeight: 1.6 }}>
          ✦ {L_LIMIT[lang] || L_LIMIT.en}
        </div>
      )}

      {phase === 'error' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#c9c9e0', lineHeight: 1.6, marginBottom: '8px' }}>
            {L_ERR[lang] || L_ERR.en}
          </div>
          <button
            onClick={() => void probe()}
            style={{
              padding: '6px 16px', borderRadius: '8px', border: '1px solid rgba(129,216,208,0.4)',
              background: 'rgba(129,216,208,0.08)', color: '#81D8D0', fontSize: '12px',
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            {L_RETRY[lang] || L_RETRY.en}
          </button>
        </div>
      )}

      {phase === 'done' && data && (
        <div>
          <div
            style={{
              fontSize: '22px', textAlign: 'center', marginBottom: '4px',
              transform: data.card.reversed ? 'rotate(180deg)' : 'none',
            }}
            aria-hidden="true"
          >
            🃏
          </div>
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '14px', color: '#F5D08A', fontWeight: 800 }}>
              {cardName}
            </span>
            <span style={{ fontSize: '11px', color: '#9a9ab8' }}>
              {' '}{data.card.reversed ? orient[1] : orient[0]}
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'rgba(233,216,166,0.92)', lineHeight: 1.75, margin: 0 }}>
            {data.reading}
          </p>
        </div>
      )}
    </div>
  );
};

export default TarotDailyCard;
