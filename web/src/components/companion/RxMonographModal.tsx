/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏆 E137.1-RX-MONOGRAPH-DRAWER（主公军令 2026-11-13）刀二：时令能量配方手札
 * ═══════════════════════════════════════════════════════════════════════════
 * 病根：/go/rx-* 302 落地 /?rx=<remedyId> 后前端无承接——画面原地刷新体感
 * 「点击无反应」。本组件＝?rx= 落地端原位暗金手札弹窗（零页面白屏跳转）：
 *   · 顶部徽标＋四维分类标签（数据单源 getWellnessRemedyById——引擎同源反查，
 *     未命中 null fail-closed ⇒ 父层 replaceState 静默清理，不弹空框零报错）；
 *   · 星盘×节气配伍解析：核心天然成分＋处方叙述（引擎六语内嵌单源）；
 *   · 顺时调频仪式与配比（rx_ritual_guide＋引擎 RX_RITUAL_GUIDES 六语）；
 *   · 主按钮（rx_ask_companion）：关手札＋清 URL ＋向当前伴侣（Milo/Sophia）
 *     发起定制追问（RX_ASK_TEMPLATES 六语模板——父层 CustomEvent 注入对话舱）；
 *   · 底部供应链预留槽（rx_curated_status 灰金静奢徽章；sponsorBrand 恒 null——
 *     未来 affiliateUrl 一键变外链）。
 * 🔴 军规红线：零货币符号零推销字眼（E130 神圣归神圣）；泰语长句
 *   overflow-wrap anywhere（390×844 零横溢）；零 CSS 文件改动（inline）；
 *   createPortal 挂 body（E120 弹窗 portal 先例——不受舱内滚动槽影响）。
 * ═══════════════════════════════════════════════════════════════════════════
 */
import React from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { getWellnessRemedyById, type WellnessRemedyMonograph } from '../../lib/astroSeasonalWellnessEngine.mjs';

/** 四维分类标签（军令钦定序同 WellnessRxSlot；图标列军规） */
const RX_CATEGORY_BADGES: ReadonlyArray<{ cat: string; icon: string; labelKey: string }> = Object.freeze([
  { cat: 'elixir', icon: '🍵', labelKey: 'rx_functional_food' },
  { cat: 'scent', icon: '🌿', labelKey: 'rx_aura_scent' },
  { cat: 'movement', icon: '🧘', labelKey: 'rx_mindful_move' },
  { cat: 'outing', icon: '🌙', labelKey: 'rx_solar_harmony' },
]);

export interface RxMonographModalProps {
  /** ?rx= 白名单 remedyId（null ⇒ 不渲染） */
  remedyId: string | null;
  onClose: () => void;
  /** 追问联动：父层负责关手札＋清 URL＋向对话舱注入消息 */
  onAskCompanion: (message: string) => void;
}

const PARCHMENT: React.CSSProperties = {
  position: 'relative', margin: '0 auto', width: 'min(92vw, 560px)',
  maxHeight: '82vh', overflowY: 'auto', boxSizing: 'border-box',
  padding: '26px 26px 20px', borderRadius: 18,
  background: 'linear-gradient(160deg, rgba(26,22,16,0.97) 0%, rgba(16,14,11,0.97) 55%, rgba(22,18,13,0.97) 100%)',
  border: '1px solid rgba(212,175,55,0.45)',
  boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 30px rgba(212,175,55,0.10), inset 0 0 44px rgba(212,175,55,0.05)',
  color: 'rgba(240,230,200,0.92)', fontFamily: 'inherit', textAlign: 'left',
};

const SECTION_LABEL: React.CSSProperties = {
  fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase',
  color: 'rgba(212,175,55,0.85)', margin: '18px 0 6px', overflowWrap: 'anywhere',
};

export const RxMonographModal: React.FC<RxMonographModalProps> = ({ remedyId, onClose, onAskCompanion }) => {
  const { t, i18n } = useTranslation();
  const lang = String(i18n.language || 'zh').slice(0, 2).toLowerCase();
  const mono: WellnessRemedyMonograph | null = remedyId ? getWellnessRemedyById(remedyId, lang) : null;
  if (!remedyId || !mono) return null; // fail-closed：白名单未命中零弹框

  const badge = RX_CATEGORY_BADGES.find((b) => b.cat === mono.category);
  const askMessage = mono.askTemplate.replace('{ingredients}', mono.ingredients || mono.remedyId);

  return createPortal(
    <div
      data-testid="rx-monograph-overlay"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(6,5,8,0.72)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '18px',
        boxSizing: 'border-box',
      }}
      role="dialog" aria-modal="true" aria-label={t('rx_drawer_title')}
    >
      <div data-testid="rx-monograph-modal" style={PARCHMENT} onClick={(e) => e.stopPropagation()}>
        {/* 顶部：徽标＋标题＋分类章 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{badge ? badge.icon : '✦'}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: 'rgba(240,230,200,0.96)', overflowWrap: 'anywhere' }}>
              {t('rx_drawer_title')}
            </h3>
            {badge && (
              <span style={{
                display: 'inline-block', marginTop: 6, padding: '2px 10px', borderRadius: 999,
                fontSize: 11, letterSpacing: '0.08em', color: 'rgba(212,175,55,0.95)',
                border: '1px solid rgba(212,175,55,0.35)', background: 'rgba(212,175,55,0.08)',
              }}>
                {badge.icon} {t(badge.labelKey)}
              </span>
            )}
          </div>
          <button
            type="button" onClick={onClose} aria-label="×"
            style={{
              flexShrink: 0, width: 30, height: 30, borderRadius: '50%', cursor: 'pointer',
              border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(255,255,255,0.04)',
              color: 'rgba(240,230,200,0.75)', fontSize: 15, lineHeight: 1,
            }}
          >×</button>
        </div>

        {/* 星盘×节气配伍解析：核心天然成分＋处方叙述（引擎六语单源） */}
        <div style={SECTION_LABEL}>{mono.element ? `✧ ${mono.element} · ${mono.seasonKey || ''}` : `✧ ${mono.seasonKey || ''}`}</div>
        <p style={{ margin: '4px 0 0', fontSize: 14, lineHeight: 1.72, color: 'rgba(240,230,200,0.88)', overflowWrap: 'anywhere' }}>
          <strong style={{ color: 'rgba(212,175,55,0.98)', fontWeight: 600 }}>{mono.ingredients}</strong>
          <br />{mono.prescription}
        </p>

        {/* 顺时调频仪式与配比（引擎 RX_RITUAL_GUIDES 六语） */}
        <div style={SECTION_LABEL}>{t('rx_ritual_guide')}</div>
        <p style={{ margin: '4px 0 0', fontSize: 13.5, lineHeight: 1.72, color: 'rgba(228,216,188,0.82)', overflowWrap: 'anywhere' }}>
          {mono.ritualGuide}
        </p>

        {/* 主按钮：让伴侣为我定制今日调理时辰（追问联动） */}
        <button
          type="button" data-testid="rx-monograph-ask"
          onClick={() => onAskCompanion(askMessage)}
          style={{
            display: 'block', width: '100%', marginTop: 20, padding: '12px 14px', borderRadius: 12,
            cursor: 'pointer', fontSize: 14, fontWeight: 600, letterSpacing: '0.04em',
            color: 'rgba(20,16,10,0.96)', overflowWrap: 'anywhere',
            background: 'linear-gradient(135deg, rgba(212,175,55,0.95), rgba(180,140,40,0.95))',
            border: '1px solid rgba(255,220,140,0.5)',
            boxShadow: '0 6px 22px rgba(212,175,55,0.22)',
          }}
        >
          {t('rx_ask_companion')}
        </button>

        {/* 供应链预留槽：灰金静奢徽章（sponsorBrand 恒 null；未来 affiliateUrl 一键外链） */}
        <div style={{
          marginTop: 14, padding: '8px 12px', borderRadius: 10, textAlign: 'center',
          border: '1px dashed rgba(212,175,55,0.28)', background: 'rgba(212,175,55,0.04)',
          fontSize: 11.5, letterSpacing: '0.06em', color: 'rgba(200,186,150,0.62)', overflowWrap: 'anywhere',
        }} data-testid="rx-monograph-supply">
          {t('rx_curated_status')}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default RxMonographModal;
