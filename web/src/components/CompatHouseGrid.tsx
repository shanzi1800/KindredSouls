/**
 * CompatHouseGrid.tsx —— 灵宠合盘「宫位交互网格」（Gate 44 · 甲线 · 画布视觉二期）
 * ═══════════════════════════════════════════════════════════════════════════
 * 军师令（方向 B · 视觉二期）：把「双人落宫」译成一张 4×3 的宫位交互网格 ——
 *   罗马数字 I–XII 标示十二宫；宫内以「你（◆）/ 灵宠（✦）」双侧微标呈现行星落入；
 *   双侧同宫 ⇒ 该格「宫位共鸣」高亮；下方星轨连线展示真实相位 ⊗ 双宫上下文（含天距°）。
 *
 * 🔴 渲染纪律（与全仓铁律同源）：
 *   · 纯无态组件 —— 只渲染，不做可用性之外的推演；模型不可用 ⇒ 由父级不挂载（本组件零空壳）；
 *   · 零机翻 / 零硬编码术语 —— 一切词条经注入模型回查字典（houseOverlay.mjs / ASTRO_TERMS）；
 *   · 溢出三道防线：①真值层降语域 → ②clampToSlot 字素裁剪 → ③CSS 换行/截断兜底；
 *   · 零 NaN/undefined —— 数值一律经有限性判定，缺真值如实留白（—）。
 * ═══════════════════════════════════════════════════════════════════════════
 */
import React from 'react';
import {
  type CompatHouseOverlayModel, type CompatHouseLink, type CompatDeliveryMode,
  clampToSlot,
} from '../lib/reportLayout';
import { ASTRO_TERMS } from '../lib/algos/astroTerms.generated';
// @ts-ignore —— houseOverlay.mjs 为纯 JS 派生核（运行时形状由 Gate 44 闸门守备）
import { termRef } from '../lib/houseOverlay.mjs';

const GOLD = '#D4AF37';
const TEAL = '#81D8D0';

/** 溢出防线 ③：长词（泰/越/德式）一律允许任意断行，绝不撑爆 4×3 网格 */
const SAFE_TEXT: React.CSSProperties = {
  overflowWrap: 'anywhere',
  wordBreak: 'break-word',
  minWidth: 0,
};

const CELL: React.CSSProperties = {
  minWidth: 0,
  background: 'rgba(255,255,255,0.035)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '9px',
  padding: '6px 7px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  ...SAFE_TEXT,
};

const PLANET_CHIP = (side: 'a' | 'b'): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '3px',
  fontSize: '10px',
  lineHeight: 1.4,
  color: side === 'a' ? '#D8F3F0' : '#F5E9C8',
  background: side === 'a' ? 'rgba(129,216,208,0.10)' : 'rgba(212,175,55,0.12)',
  border: `1px solid ${side === 'a' ? 'rgba(129,216,208,0.32)' : 'rgba(212,175,55,0.34)'}`,
  borderRadius: '999px',
  padding: '1px 7px',
  maxWidth: '100%',
  ...SAFE_TEXT,
});

const HouseCell: React.FC<{ cell: CompatHouseOverlayModel['cells'][number]; resonanceText: string }> = ({ cell, resonanceText }) => {
  const res = cell.resonance;
  return (
    <div
      data-testid="house-cell"
      data-house={cell.house}
      data-resonance={res ? '1' : '0'}
      className={`ks-house-cell${res ? ' ks-house-cell--res' : ''}`}
      style={res ? { ...CELL, borderColor: 'rgba(212,175,55,0.55)' } : CELL}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0 }}>
        <span style={{ fontSize: '11px', fontWeight: 800, color: GOLD, letterSpacing: '0.4px', ...SAFE_TEXT }}>
          {cell.numeral}
        </span>
        {res && (
          <span title={resonanceText} style={{ fontSize: '8px', color: GOLD, background: 'rgba(212,175,55,0.14)', borderRadius: '999px', padding: '0 5px', ...SAFE_TEXT }}>
            ✦
          </span>
        )}
      </div>
      {cell.a.length === 0 && cell.b.length === 0 ? (
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.22)' }}>·</span>
      ) : (
        <>
          {cell.a.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', minWidth: 0 }}>
              {cell.a.map((p) => (
                <span key={`a:${p.key}`} style={PLANET_CHIP('a')}>
                  <span aria-hidden="true">◆</span>
                  {clampToSlot(p.label, 'chip')}
                </span>
              ))}
            </div>
          )}
          {cell.b.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', minWidth: 0 }}>
              {cell.b.map((p) => (
                <span key={`b:${p.key}`} style={PLANET_CHIP('b')}>
                  <span aria-hidden="true">✦</span>
                  {clampToSlot(p.label, 'chip')}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const HouseLinkRow: React.FC<{ link: CompatHouseLink }> = ({ link }) => {
  const orbText = (typeof link.orb === 'number' && Number.isFinite(link.orb)) ? `${link.orb}°` : '';
  const accent = link.polarity === 'hard' ? '#FF8A80' : link.polarity === 'harmonious' ? '#A5D6A7' : 'rgba(255,255,255,0.55)';
  return (
    <div data-testid="house-link" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', minWidth: 0, padding: '3px 0' }}>
      <span style={{ fontSize: '10px', color: TEAL, ...SAFE_TEXT }}>{clampToSlot(link.houseNumeralA, 'chip')}</span>
      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.82)', ...SAFE_TEXT }}>{clampToSlot(link.aLabel, 'chip')}</span>
      <span style={{ fontSize: '10px', color: accent, ...SAFE_TEXT }}>⟶ {clampToSlot(link.aspectLabel, 'chip')}</span>
      {orbText && <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.42)', ...SAFE_TEXT }}>{orbText}</span>}
      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.82)', ...SAFE_TEXT }}>{clampToSlot(link.bLabel, 'chip')}</span>
      <span style={{ fontSize: '10px', color: GOLD, ...SAFE_TEXT }}>{clampToSlot(link.houseNumeralB, 'chip')}</span>
    </div>
  );
};

/** 投递溯源条（真实路径：流式 SSE / 安全直连；鉴权通过 —— 画布仅在成功报告后挂载，故恒真） */
const StatusStrip: React.FC<{ lang: string; delivery: CompatDeliveryMode | null }> = ({ lang, delivery }) => {
  const auth = termRef(ASTRO_TERMS, 'familiar', 'AuthPassed', lang);
  const mode = termRef(ASTRO_TERMS, 'familiar', delivery === 'stream' ? 'DeliveryStream' : 'DeliveryDirect', lang);
  const items: string[] = [];
  if (auth && auth.label) items.push(auth.label);
  if (delivery && mode && mode.label) items.push(mode.label);
  if (items.length === 0) return null;
  return (
    <div data-testid="house-status" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed rgba(255,255,255,0.10)', minWidth: 0 }}>
      {items.map((t, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: 'rgba(255,255,255,0.62)', ...SAFE_TEXT }}>
          <span className="ks-dot" aria-hidden="true" />
          {clampToSlot(t, 'chip')}
        </span>
      ))}
    </div>
  );
};

const CompatHouseGrid: React.FC<{ model: CompatHouseOverlayModel; lang?: string; delivery?: CompatDeliveryMode | null }> = ({ model, lang = 'zh', delivery = null }) => {
  if (!model || model.available !== true || !Array.isArray(model.cells) || model.cells.length === 0) return null;
  const resonanceText = (model.resonanceLabel && model.resonanceLabel.label) || '';
  const legendSelf = (model.legend && model.legend.self && model.legend.self.label) || '';
  const legendFam = (model.legend && model.legend.familiar && model.legend.familiar.label) || '';
  const title = (model.title && model.title.label) || '';

  return (
    <div
      data-testid="compat-house-grid"
      data-available="true"
      data-resonance-count={model.resonanceCount}
      className="ks-house-card"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(212,175,55,0.18)',
        borderRadius: '12px',
        padding: '11px 12px',
        marginBottom: '10px',
        position: 'relative',
        minWidth: 0,
        ...SAFE_TEXT,
      }}
    >
      {/* 卡头：标题 + 双侧图例（你 ◆ / 灵宠 ✦） */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px', minWidth: 0 }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: GOLD, letterSpacing: '0.5px', ...SAFE_TEXT }}>
          {clampToSlot(title, 'labelCard')}
        </span>
        {legendSelf && (
          <span style={{ fontSize: '10px', color: TEAL, ...SAFE_TEXT }}>◆ {clampToSlot(legendSelf, 'chip')}</span>
        )}
        {legendFam && (
          <span style={{ fontSize: '10px', color: GOLD, ...SAFE_TEXT }}>✦ {clampToSlot(legendFam, 'chip')}</span>
        )}
        {model.resonanceCount > 0 && (
          <span style={{ marginLeft: 'auto', fontSize: '10px', color: GOLD, background: 'rgba(212,175,55,0.12)', borderRadius: '999px', padding: '1px 8px', ...SAFE_TEXT }}>
            ✦ {clampToSlot(resonanceText, 'chip')} · {model.resonanceCount}
          </span>
        )}
      </div>

      {/* 4×3 宫位矩阵 */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${model.cols || 4}, minmax(0, 1fr))`, gap: '6px', minWidth: 0 }}>
        {model.cells.map((cell) => (
          <HouseCell key={cell.house} cell={cell} resonanceText={resonanceText} />
        ))}
      </div>

      {/* 星轨连线（真实相位 ⊗ 双宫上下文） */}
      {model.links.length > 0 && (
        <div style={{ marginTop: '9px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.07)', minWidth: 0 }}>
          {model.links.map((lk) => <HouseLinkRow key={lk.id} link={lk} />)}
        </div>
      )}

      {/* 实时状态可视化（鉴权 / 投递路径 —— 真实真值，非装饰性断言） */}
      <StatusStrip lang={lang} delivery={delivery} />
    </div>
  );
};

export default CompatHouseGrid;
