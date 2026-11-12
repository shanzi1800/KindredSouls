/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏆 E137-ASTRO-SEASONAL-WELLNESS-ENGINE 刀二（主公军令 2026-11-12）：处方卡插槽
 * ═══════════════════════════════════════════════════════════════════════════
 * 军令三件（本文件＝360px 暗金胶囊微缩卡——E121 AmuletScribeSlot / E124
 * LifestyleMuseSlot 同构形制）：
 *   · 星盘时令能量处方卡：标题（wellness_rx_title）＋季群章（seasonName·
 *     termLabel）＋四维行（固定图标列 48px＋i18n 维度标签＋六语处方文案）；
 *   · 探索 CTA（rx_explore_cta）：/go/rx-* 供应链软承接暗槽（302 平滑落地
 *     站内指引页——零死链零弹窗零外链品牌）；
 *   · 数据单源：SSE meta 帧 wellnessRx 投影（服务端引擎按本命元素＋半球镜像
 *     算好六语文案随流下发——前端纯渲染零重算）。
 * 🔴 军规红线：零收银（E130——卡内零价格符号零促销词，e137 闸门全量扫杀）；
 *   泰语无空格长词防溢出（overflow-wrap: anywhere＋固定图标列宽 48px）；
 *   fail-closed——wellnessRx 形状不全 ⇒ 整卡不渲染；零 CSS 文件改动（inline）。
 * ═══════════════════════════════════════════════════════════════════════════
 */
import React from 'react';
import { useTranslation } from 'react-i18next';

/** 服务端 meta 帧 wellnessRx 投影形状（chat route E137-刀二） */
export interface WellnessRxMeta {
  seasonName: string;
  termLabel: string;
  hemisphere: 'north' | 'south';
  rx: {
    functional_elixir: { prescription: string; ingredients?: string; remedyId?: string };
    aura_scent: { prescription: string; ingredients?: string; remedyId?: string };
    mindful_movement: { prescription: string; ingredients?: string; remedyId?: string };
    seasonal_outing: { prescription: string; ingredients?: string; remedyId?: string };
  };
  exploreSlug: string;
}

/** 四维行定义（军令钦定序：食愈/嗅觉/身形/顺时——图标列恒 48px） */
const WELLNESS_DIMS: ReadonlyArray<{ labelKey: string; icon: string; field: keyof WellnessRxMeta['rx'] }> = Object.freeze([
  { labelKey: 'rx_functional_food', icon: '🍵', field: 'functional_elixir' },
  { labelKey: 'rx_aura_scent', icon: '🌿', field: 'aura_scent' },
  { labelKey: 'rx_mindful_move', icon: '🧘', field: 'mindful_movement' },
  { labelKey: 'rx_solar_harmony', icon: '🌙', field: 'seasonal_outing' },
]);

/** 形状守卫（fail-closed：四维处方任一缺席 ⇒ 整卡不渲染零破坏） */
export function isWellnessRxMeta(v: unknown): v is WellnessRxMeta {
  if (!v || typeof v !== 'object') return false;
  const w = v as Record<string, any>;
  if (typeof w.seasonName !== 'string' || !w.seasonName.trim()) return false;
  if (typeof w.termLabel !== 'string' || !w.termLabel.trim()) return false;
  if (w.hemisphere !== 'north' && w.hemisphere !== 'south') return false;
  const rx = w.rx;
  if (!rx || typeof rx !== 'object') return false;
  for (const f of ['functional_elixir', 'aura_scent', 'mindful_movement', 'seasonal_outing']) {
    const d = rx[f];
    if (!d || typeof d !== 'object' || typeof d.prescription !== 'string' || !d.prescription.trim()) return false;
  }
  return typeof w.exploreSlug === 'string' && /^\/go\/rx-/.test(w.exploreSlug);
}

export interface WellnessRxSlotCardProps {
  wellness: WellnessRxMeta;
}

export const WellnessRxSlotCard: React.FC<WellnessRxSlotCardProps> = ({ wellness }) => {
  const { t } = useTranslation();
  if (!isWellnessRxMeta(wellness)) return null; // 双保险（挂载点已守卫）
  const hemiMark = wellness.hemisphere === 'south' ? 'S' : 'N';
  return (
    <div
      data-testid="wellness-rx-slot"
      style={{
        width: '360px', maxWidth: '100%',
        marginTop: 8, padding: '13px 14px 12px',
        background: 'rgba(14,13,18,0.9)',
        border: '1px solid rgba(212,175,55,0.4)',
        borderRadius: 14,
        backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        boxShadow: '0 8px 28px rgba(0,0,0,0.5), 0 0 18px rgba(212,175,55,0.08)',
      }}
    >
      {/* 标题行：处方铭题＋季群章（seasonName·termLabel·半球标） */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontSize: 13, letterSpacing: 1.5, color: '#F3E5AB', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {t('wellness_rx_title')}
        </div>
        <span
          data-testid="wellness-rx-season"
          style={{
            flexShrink: 0, fontSize: 9.5, color: 'rgba(212,188,122,0.85)',
            border: '1px solid rgba(212,175,55,0.4)', borderRadius: 999,
            padding: '2px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 168,
          }}
        >
          ✧ {wellness.seasonName}·{wellness.termLabel}·{hemiMark}
        </span>
      </div>

      {/* 四维行：固定图标列 48px＋i18n 维度标签＋六语处方文案
          （泰语无空格长词 ⇒ overflow-wrap anywhere 防溢出——390×844 军规） */}
      <div data-testid="wellness-rx-dims" style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {WELLNESS_DIMS.map((d) => {
          const dim = wellness.rx[d.field];
          return (
            <div key={d.field} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div
                aria-hidden="true"
                style={{
                  width: 48, height: 48, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, background: 'rgba(19,16,10,0.85)',
                  border: '1px solid rgba(212,175,55,0.35)', borderRadius: 10,
                }}
              >
                {d.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
                <div style={{ fontSize: 10, letterSpacing: 0.5, color: 'rgba(159,199,232,0.9)', fontWeight: 600 }}>
                  {t(d.labelKey)}
                </div>
                <div style={{ marginTop: 2, fontSize: 10.5, lineHeight: 1.6, color: 'rgba(212,188,122,0.92)', overflowWrap: 'anywhere' }}>
                  {dim.prescription}
                </div>
                {typeof dim.ingredients === 'string' && dim.ingredients.trim() ? (
                  <div style={{ marginTop: 2, fontSize: 9, color: 'rgba(159,199,232,0.6)', overflowWrap: 'anywhere' }}>
                    ✧ {dim.ingredients}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* 探索 CTA：/go/rx-* 供应链软承接暗槽（同站 302 平滑落地——零死链零弹窗） */}
      <a
        href={wellness.exploreSlug}
        data-testid="wellness-rx-explore"
        style={{
          display: 'block', marginTop: 10, padding: '9px 12px', borderRadius: 999,
          textAlign: 'center', textDecoration: 'none',
          background: 'linear-gradient(135deg, rgba(212,175,55,0.92), rgba(160,120,40,0.92))',
          border: '1px solid #D4AF37', color: '#141310',
          fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, cursor: 'pointer',
          boxShadow: '0 0 16px rgba(212,175,55,0.25)', overflowWrap: 'anywhere',
        }}
      >
        {t('rx_explore_cta')}
      </a>
    </div>
  );
};
