/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🍀 E107（主公军令 2026-10-31 刀二）：今日幸运卡片——首页灵宠三阶动线第二阶
 * ═══════════════════════════════════════════════════════════════════════════
 * 主公六问⑤整改：旧动线「点灵宠 ⇒ 直接弹出聊天舱」太粗暴。军令钦定三阶：
 *   归位静候（微光提示气泡）→ 点触灵宠 ⇒ 中央浮现深空黑金「今日幸运卡片」
 *   （幸运色/数字/能量微语＋今日塔罗金卡缩略图）→ 点「与TA深度聊聊」CTA 才开舱。
 * 🔴 真值铁律（E54-2/E66 沿袭）：
 *   - 幸运三宝＋方位＝dailyFortune.mjs 服务端同源确定性核（零伪造）；
 *   - 今日塔罗＝tarot.ts getWealthTarot（生日+今日确定性抽取，天天不同）；
 *   - 金卡缩略图＝goldCardTotems.mjs 韦特真矢量线稿（与命盘金卡同源图腾库，
 *     按当头牌 cardId 分发——图腾与牌名严格对应）。
 * 🔴 首页白名单裁决：幸运卡片为灵宠点击态浮现层（portal 到 body、即开即收），
 *   不新增常驻挂件；零路由跳转，不破坏首页上下文（E66 抽屉舱同纪律）。
 * ═══════════════════════════════════════════════════════════════════════════
 */
import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { getWealthTarot } from '../lib/tarot';
import { goldCardTotemUri } from '../lib/goldCardTotems.mjs';
// @ts-ignore —— dailyFortune.mjs 为纯逻辑核（形状由 E54-2 既有闸门守备）
import { dailyFortune } from '../lib/dailyFortune.mjs';
// @ts-ignore —— triadTruth 本命真值提取（形状由 E46/E49 既有闸门守备）
import { triadTruth } from '../lib/familiarHome.mjs';

export interface FamiliarLuckCardProps {
  open: boolean;
  onClose: () => void;
  /** 点 CTA ⇒ 进入第三阶：开 420×600 对话舱（开舱权只属本卡片 CTA） */
  onChat: () => void;
  /** 灵宠名（卡片副题） */
  name: string;
  lang: string;
  /** 认领档（chartSig 首段＝生日，喂今日塔罗确定性核；无档 ⇒ 空真值降级） */
  chartSig?: string;
  triad?: Record<string, unknown> | null;
}

const FamiliarLuckCard: React.FC<FamiliarLuckCardProps> = ({
  open, onClose, onChat, name, lang, chartSig, triad,
}) => {
  const { t } = useTranslation();

  /* 幸运真值（开卡瞬间确定性装配——零网络、零异步） */
  const data = useMemo(() => {
    const sun = String((triad && (triad as Record<string, unknown>).sun) || '');
    const f = dailyFortune({ lang, sunSign: sun });
    const birthDate = String(chartSig || '').split('|')[0] || '';
    const tarot = /^\d{4}-\d{2}-\d{2}$/.test(birthDate)
      ? getWealthTarot(birthDate, lang)
      : null; // 缺生日 ⇒ 显式缺席，绝不臆造牌名
    return { f, tarot };
  }, [lang, chartSig, triad]);

  if (!open) return null;
  const { f, tarot } = data;

  const row = (label: string, value: React.ReactNode): React.ReactNode => (
    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', lineHeight: 1.5 }}>
      <span style={{ color: 'rgba(212,175,55,0.9)', fontWeight: 700, minWidth: '64px', textAlign: 'left' }}>{label}</span>
      <span style={{ color: '#F3E5AB', textAlign: 'left', flex: 1, overflowWrap: 'anywhere' }}>{value}</span>
    </div>
  );

  return createPortal(
    <div
      className="ks-luck-layer"
      role="dialog"
      aria-modal="true"
      aria-label={t('familiar.luckCardTitle')}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 95,
        background: 'rgba(8, 9, 12, 0.78)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        className="ks-luck-card"
        data-testid="familiar-luck-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative', width: 'min(88vw, 340px)', maxHeight: '86vh', overflowY: 'auto',
          borderRadius: '16px', padding: '22px 20px 18px',
          background: 'linear-gradient(160deg, #161922 0%, #08090C 100%)',
          border: '1px solid rgba(212,175,55,0.45)',
          boxShadow: '0 12px 48px rgba(0,0,0,0.6), inset 0 0 60px rgba(212,175,55,0.05)',
        }}
      >
        {/* 双层烫金内衬（金卡同款色阶） */}
        <div style={{ position: 'absolute', inset: '6px', borderRadius: '12px', border: '1px solid rgba(243,229,171,0.25)', pointerEvents: 'none' }} aria-hidden="true" />
        <button
          type="button"
          onClick={onClose}
          aria-label={t('familiar.chatClose')}
          style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: 'rgba(212,175,55,0.8)', fontSize: '15px', cursor: 'pointer', padding: '6px' }}
        >
          ✕
        </button>

        <div style={{ textAlign: 'center', marginBottom: '14px' }}>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#F3E5AB', letterSpacing: '1px' }}>
            ✦ {t('familiar.luckCardTitle')} ✦
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(243,229,171,0.6)', marginTop: '4px' }}>{name}</div>
        </div>

        {/* 幸运三宝＋方位（dailyFortune 确定性真值） */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
          {row(t('familiar.luckNum'), <b style={{ fontSize: '15px' }}>{f.luckyNumber}</b>)}
          {row(t('familiar.luckColor'), (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
              <span aria-hidden="true" style={{ width: '14px', height: '14px', borderRadius: '50%', background: f.color.hex, border: '1px solid rgba(243,229,171,0.5)', display: 'inline-block' }} />
              {f.color.name}
            </span>
          ))}
          {row(t('familiar.luckDir'), f.direction.name)}
          {row(t('familiar.luckVibe'), f.vibe)}
        </div>

        {/* 今日塔罗金卡缩略图（韦特真矢量线稿——与命盘金卡同源图腾库） */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '12px 12px 10px', borderRadius: '12px',
            background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.3)',
            marginBottom: '14px',
          }}
        >
          {tarot ? (
            <img
              src={goldCardTotemUri(tarot.id)}
              alt={tarot.name}
              draggable={false}
              style={{ width: '76px', height: '76px', flexShrink: 0, borderRadius: '8px', border: '1px solid rgba(212,175,55,0.35)', background: 'rgba(8,9,12,0.6)' }}
            />
          ) : (
            <div style={{ width: '76px', height: '76px', flexShrink: 0, borderRadius: '8px', border: '1px dashed rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(212,175,55,0.5)', fontSize: '20px' }}>✦</div>
          )}
          <div style={{ minWidth: 0, textAlign: 'left' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#F3E5AB' }}>
              {tarot ? `${tarot.name} · ${tarot.orientation}` : '—'}
            </div>
            {tarot && (
              <div style={{ fontSize: '11px', lineHeight: 1.55, color: 'rgba(243,229,171,0.68)', marginTop: '4px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', overflowWrap: 'anywhere' }}>
                {tarot.meaning}
              </div>
            )}
          </div>
        </div>

        {/* 第三阶入口：与TA深度聊聊（开舱权只属本 CTA） */}
        <button
          type="button"
          data-testid="familiar-luck-chat-cta"
          onClick={() => { onClose(); onChat(); }}
          style={{
            width: '100%', padding: '12px 18px', borderRadius: '12px',
            border: '1px solid rgba(212,175,55,0.5)',
            background: 'linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(184,134,11,0.14) 100%)',
            color: '#F5D08A', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 4px 18px rgba(212,175,55,0.18)',
          }}
        >
          {t('familiar.chatDeepCta')}
        </button>
      </div>
    </div>,
    document.body
  );
};

export default FamiliarLuckCard;
