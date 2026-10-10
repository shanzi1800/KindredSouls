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
  type CompatReportPayload, type CompatPayloadCard, type PayloadTermRef,
  SLOT_BUDGETS, clampToSlot, graphemes, sectionAccent,
} from '../lib/reportLayout';

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
  lineHeight: 1.5,
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

const CompatReportCanvas: React.FC<{ payload: CompatReportPayload; lang?: string }> = ({ payload }) => {
  const t = payload.truth;
  const lb = payload.labels || {};
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
