/**
 * CompatReportCanvas.tsx —— 灵宠合盘「标准化报告画布」（Gate 40 · 甲线）
 * ═══════════════════════════════════════════════════════════════════════
 * 军师令（画布首版 MVP）：优先支撑【张量卡 Tensor Cards】＋【四段骨架壳 🎯⚡💡🌿】。
 *
 * 🔴 渲染纪律：
 *   · 纯无态组件 —— 不做任何可用性判断以外的状态推演（前端只识 available / degraded）；
 *   · 零机翻 / 零硬编码术语 —— 一切行星、星座、相位、学说词条与字段名**全部**来自
 *     服务端注入的 Payload（label 已回查 astro_terms_dict.json；字段名取自 E40+ 真值资产）；
 *   · 溢出三道防线：①真值层降语域 → ②本组件 clampToSlot 字素裁剪 → ③CSS 换行/截断兜底。
 * ═══════════════════════════════════════════════════════════════════════
 */
import React from 'react';
import {
  type CompatReportPayload, type CompatPayloadCard, type PayloadTermRef, type CompatCanvasModel,
  type CompatHouseOverlayModel, type CompatHouseTruthSidecar, type CompatDeliveryMode,
  SLOT_BUDGETS, clampToSlot, graphemes, sectionAccent,
} from '../lib/reportLayout';
import { ASTRO_TERMS } from '../lib/algos/astroTerms.generated';
import CompatHouseGrid from './CompatHouseGrid';
// @ts-ignore —— canvasModel.mjs 为纯 JS 派生核（运行时形状由 Gate 42 闸门守备）
import { deriveCanvasModel } from '../lib/canvasModel.mjs';
// @ts-ignore —— houseOverlay.mjs 为纯 JS 派生核（运行时形状由 Gate 44 闸门守备）
import { deriveHouseOverlay } from '../lib/houseOverlay.mjs';

const GOLD = '#D4AF37';
const GOLD_SOFT = 'rgba(212,175,55,0.16)';
const BG = '#0D0D1A';

/** 溢出防线 ③：任何长文卡片容器都必须允许断行（泰/越/德式长词才不会撑爆网格） */
const SAFE_TEXT: React.CSSProperties = {
  overflowWrap: 'anywhere',
  wordBreak: 'break-word',
  minWidth: 0,
};

const CHIP: React.CSSProperties = {
  fontSize: '11px',
  lineHeight: 1.6, /* 🔴 E102-刀四-①：泰语声调符削顶防护（1.5→1.6，军令下限 1.55+） */
  color: '#F5F1E6',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: '999px',
  padding: '3px 10px',
  maxWidth: '100%',
  ...SAFE_TEXT,
};

const chipStyleFor = (polarity: 'harmonious' | 'hard' | null): React.CSSProperties => (
  polarity === 'hard'
    ? { ...CHIP, background: 'rgba(255,138,128,0.10)', borderColor: 'rgba(255,138,128,0.30)' }
    : polarity === 'harmonious'
      ? { ...CHIP, background: 'rgba(165,214,167,0.10)', borderColor: 'rgba(165,214,167,0.28)' }
      : CHIP
);

/** 词条胶囊（防线 ②：按 chip 槽位预算做字素裁剪） */
const TermChip: React.FC<{ term: PayloadTermRef; polarity?: 'harmonious' | 'hard' | null }> = ({ term, polarity = null }) => (
  <span style={chipStyleFor(polarity)} title={term.label}>
    {clampToSlot(term.label, term.slot || 'chip')}
  </span>
);

/* ── Gate 42 三卡容器样式（防线 ③：一律带 SAFE_TEXT 断行兜底 + minWidth:0）── */
const CARD_BOX: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(212,175,55,0.18)',
  borderRadius: '12px',
  padding: '11px 12px',
  marginBottom: '10px',
  minWidth: 0,
  ...SAFE_TEXT,
};

const CARD_TITLE: React.CSSProperties = {
  fontSize: '12px', fontWeight: 700, color: GOLD, letterSpacing: '0.5px',
  marginBottom: '6px', ...SAFE_TEXT,
};

const BAR_TRACK: React.CSSProperties = {
  height: '7px', borderRadius: '999px', background: 'rgba(255,255,255,0.08)',
  overflow: 'hidden', minWidth: 0, flex: '1 1 auto',
};

const barFill = (pct: number): React.CSSProperties => ({
  height: '100%',
  width: `${Math.max(0, Math.min(100, pct))}%`,
  background: pct >= 60 ? '#A5D6A7' : pct >= 40 ? GOLD : '#FF8A80',
  borderRadius: '999px',
});

const MetricCell: React.FC<{ label: string; value: string; accent?: string }> = ({ label, value, accent = GOLD }) => (
  <div style={{
    flex: '1 1 72px', minWidth: 0, background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '8px 10px',
  }}>
    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginBottom: '3px', ...SAFE_TEXT }}>
      {label}
    </div>
    <div style={{ fontSize: '15px', fontWeight: 700, color: accent, ...SAFE_TEXT }}>{value}</div>
  </div>
);

const CardBlock: React.FC<{ card: CompatPayloadCard }> = ({ card }) => (
  <div style={{ marginBottom: '12px' }}>
    <div style={{
      fontSize: '11px', fontWeight: 700, color: GOLD, letterSpacing: '0.6px',
      marginBottom: '7px', ...SAFE_TEXT,
    }}>
      {clampToSlot(card.title, 'labelCard')}
    </div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', minWidth: 0 }}>
      {card.items.map((item) => (
        <TermChip key={`${card.id}:${item.id}`} term={{ domain: 'pair', key: item.id, label: item.text, slot: 'chip' }} polarity={item.polarity} />
      ))}
    </div>
  </div>
);

const CompatReportCanvas: React.FC<{
  payload: CompatReportPayload;
  lang?: string;
  /** 🛡️ Gate 44：信封旁置宫位真值（非 payload 契约字段；缺省 ⇒ 网格不渲染） */
  houseOverlay?: CompatHouseTruthSidecar | null;
  /** 🛡️ Gate 44：报告投递溯源（真实路径：流式 SSE / 安全直连） */
  delivery?: CompatDeliveryMode | null;
}> = ({ payload, houseOverlay = null, delivery = null }) => {
  const t = payload.truth;
  const lb = payload.labels || {};
  // 🛡️ Gate 42：三卡视觉模型（前端纯派生；不可用 ⇒ null，绝不渲染 undefined/NaN）
  const canvasMap = deriveCanvasModel(payload, ASTRO_TERMS) as CompatCanvasModel | null;
  // 🛡️ Gate 44：宫位交互网格模型（信封旁置真值纯派生；缺真值/非精确建盘 ⇒ null，绝不臆造宫位）
  const houseModel = deriveHouseOverlay(payload, houseOverlay, ASTRO_TERMS) as CompatHouseOverlayModel | null;
  const synLabel = (payload.terms && payload.terms.synastry && payload.terms.synastry.label) || '';
  const ratioText = (typeof t.ratio === 'number' && isFinite(t.ratio))
    ? `${(t.ratio * 100).toFixed(1)}%`
    : (lb.none || '—');
  const precisionText = t.precision === 'date_level' ? (lb.dateLevel || '') : (lb.timed || '');

  return (
    <div style={{
      background: `linear-gradient(180deg, ${BG}, #11111f)`,
      border: `1px solid ${GOLD_SOFT}`,
      borderRadius: '14px',
      padding: '16px 16px 18px',
      margin: '12px 0 0',
      boxShadow: '0 6px 24px rgba(0,0,0,0.45)',
      textAlign: 'left',
    }} data-testid="compat-report-canvas" data-schema={payload.schemaVersion}>
      {/* 标题栏：算法真值层标识（词条取自字典，非机翻） */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <span style={{
          fontSize: '10px', fontWeight: 700, letterSpacing: '0.8px',
          color: BG, background: GOLD, padding: '3px 8px', borderRadius: '5px', ...SAFE_TEXT,
        }}>🔒 {clampToSlot(synLabel, 'chip')}</span>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', ...SAFE_TEXT }}>
          {clampToSlot(`${lb.precision || ''}${precisionText ? ' ' + precisionText : ''}`.trim(), 'hardCap')}
        </span>
        {t.degraded && (
          <span style={{
            marginLeft: 'auto', fontSize: '10px', color: '#FFD180',
            background: 'rgba(255,209,128,0.12)', border: '1px solid rgba(255,209,128,0.32)',
            borderRadius: '999px', padding: '2px 9px', ...SAFE_TEXT,
          }}>
            ⚠︎ {clampToSlot(lb.dateLevel || '', 'chip')}
          </span>
        )}
      </div>

      {!t.available ? (
        /* 不可用：如实呈现，零编造（与引擎三态纪律同源） */
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.62)', ...SAFE_TEXT }}>
          {clampToSlot(lb.unknown || '', 'hardCap')}
        </div>
      ) : (        <>
          {/* 张量卡：调和 / 硬相 / 总相位 / 调和占比 */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
            <MetricCell label={lb.harmony || ''} value={String(t.harmonious)} accent="#A5D6A7" />
            <MetricCell label={lb.hard || ''} value={String(t.hard)} accent="#FF8A80" />
            <MetricCell label={lb.total || ''} value={String(t.total)} />
            <MetricCell label={lb.ratio || ''} value={ratioText} />
          </div>

          {canvasMap && (
            <div style={{ marginBottom: '12px' }}>
              {/* ① 羁绊签名卡 —— 称号 + 调和占比 + 核心能量 Chip */}
              <div data-testid="bond-signature-card" className="ks-card-shimmer" style={CARD_BOX}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '7px', minWidth: 0 }}>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: GOLD, ...SAFE_TEXT }}>
                    {clampToSlot(canvasMap.signature.tier ? canvasMap.signature.tier.label : '', 'labelCard')}
                  </span>
                  {canvasMap.signature.ratioPct !== null && (
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', ...SAFE_TEXT }}>
                      {clampToSlot(lb.ratio || '', 'chip')} {canvasMap.signature.ratioPct}%
                    </span>
                  )}
                </div>
                {canvasMap.signature.chips.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', minWidth: 0 }}>
                    {canvasMap.signature.chips.map((it) => (
                      <TermChip key={it.id} term={{ domain: 'pair', key: it.id, label: it.text, slot: 'chip' }} polarity={it.polarity} />
                    ))}
                  </div>
                )}
              </div>

              {/* ② 命运契约卡 —— 契约态 + 命中虚点 + 箴言锚 */}
              <div data-testid="karmic-contract-card" className="ks-card-parchment ks-card-shimmer" style={CARD_BOX}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px', minWidth: 0 }}>
                  <span style={{
                    fontSize: '13px', fontWeight: 800,
                    color: canvasMap.contract.sealed ? GOLD : 'rgba(255,255,255,0.55)', ...SAFE_TEXT,
                  }}>
                    {canvasMap.contract.sealed ? '🔗 ' : '⛓︎ '}
                    {clampToSlot(canvasMap.contract.state ? canvasMap.contract.state.label : '', 'labelCard')}
                  </span>
                  {canvasMap.contract.points.map((p) => <TermChip key={p.key} term={p} />)}
                </div>
                {canvasMap.contract.quote && (
                  <div style={{ fontSize: '12px', lineHeight: 1.6, color: 'rgba(255,255,255,0.82)', ...SAFE_TEXT }}>
                    {clampToSlot(canvasMap.contract.quote.text, 'hardCap')}
                  </div>
                )}
              </div>

              {/* ③ 双星能量图谱 —— 亲密共振 / 情绪默契 / 领地磨合 */}
              <div data-testid="energy-grid-card" style={CARD_BOX}>
                {canvasMap.energy.map((ax) => (
                  <div key={ax.id} style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '7px', minWidth: 0 }}>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', flex: '0 0 auto', maxWidth: '44%', ...SAFE_TEXT }}>
                      {clampToSlot(ax.axis ? ax.axis.label : '', 'chip')}
                    </span>
                    <div style={BAR_TRACK}>
                      {ax.known && typeof ax.value === 'number' && <div style={barFill(ax.value)} />}
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.75)', flex: '0 0 auto', minWidth: '26px', textAlign: 'right' }}>
                      {ax.known && typeof ax.value === 'number' ? ax.value : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 🛡️ Gate 44：宫位交互网格（信封旁置真值 ⊗ 相位连线；缺真值 ⇒ 组件自返 null，零空壳） */}
          {houseModel && <CompatHouseGrid model={houseModel} lang={payload.lang} delivery={delivery} />}

          {(payload.cards || []).map((card) => <CardBlock key={card.id} card={card} />)}

          {/* 未知因子（如实标注，严禁脑补） */}
          {Array.isArray(t.unknown) && t.unknown.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,209,128,0.9)', letterSpacing: '0.6px', marginBottom: '7px', ...SAFE_TEXT }}>
                {clampToSlot(lb.unknown || '', 'hardCap')}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', minWidth: 0 }}>
                {t.unknown.map((u) => <TermChip key={`unknown:${u.domain}.${u.key}`} term={u} />)}
              </div>
            </div>
          )}

          {/* 四段骨架壳 🎯⚡💡🌿（段落文本来自 LLM，仅做排版与溢出兜底） */}
          {(payload.sections || []).length > 0 && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
              {payload.sections.map((sec, i) => (
                <div key={i} style={{ marginBottom: '10px' }}>
                  {sec.icon && (
                    <div style={{ fontSize: '13px', fontWeight: 700, color: sectionAccent(sec.icon), marginBottom: '4px' }}>
                      {graphemes(sec.icon) <= 2 ? sec.icon : ''}
                    </div>
                  )}
                  <p style={{
                    margin: 0, fontSize: '13px', lineHeight: 1.65,
                    color: 'rgba(255,255,255,0.86)', ...SAFE_TEXT,
                  }}>{sec.text}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* 排版预算脚注（可移除；保留以便线上抽检 chip 槽位口径） */}
      <div style={{ marginTop: '10px', fontSize: '9px', color: 'rgba(255,255,255,0.28)', ...SAFE_TEXT }}>
        {payload.schemaVersion} · {SLOT_BUDGETS.chip?.maxGraphemes ?? 18}/{SLOT_BUDGETS.hardCap?.maxGraphemes ?? 40}
      </div>
    </div>
  );
};

export default CompatReportCanvas;
