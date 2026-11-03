/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏆 E120-CHAIN 刀二（主公军令 2026-11-03）：合璧感应锦囊弹层
 * ═══════════════════════════════════════════════════════════════════════════
 * 军令锚（「以心启符 · 锦囊化药」融合方案）：360px 深空黑金卡片，上下两段式——
 *   · 上半区【心绪指引】：五行徽章缩略＋灵宠结合天象的抚慰话术与行动建议；
 *   · 下半区【星轨助运】：幸运色圆形色块＋能量吉时标牌＋今日气场箴言＋贵人方位；
 *   · 底部：首次揭示触发金色星尘粒子（灵犀星 +1 已沉淀至星历账本）＋
 *     [ 收入锦囊袋 ] 关闭按钮；已打卡只读复看态显示「已入账」。
 * 🔴 零 i18n 新键（POUCH_UI 自容六语字典）；零 CSS 文件改动（inline style）。
 * ═══════════════════════════════════════════════════════════════════════════
 */
import React from 'react';
import { MOOD_ARCHETYPES } from '../../lib/companionMoodData.mjs';
import { POUCH_UI } from '../../lib/dailyPouchStore.mjs';
import type { FusedPouchRecord } from '../../lib/dailyPouchStore.mjs';

type Lang = 'zh' | 'en' | 'fr' | 'es' | 'th' | 'vi';

export interface CombinedPouchModalProps {
  open: boolean;
  pouch: FusedPouchRecord | null;
  lang: Lang;
  onClose: () => void;
  /** 首次揭示（本会话刚经罗盘选心）⇒ 星尘飘字；只读复看 ⇒ 「已入账」态 */
  justClaimed?: boolean;
}

const CombinedPouchModal: React.FC<CombinedPouchModalProps> = ({ open, pouch, lang, onClose, justClaimed }) => {
  if (!open || !pouch) return null;
  const ui = POUCH_UI[lang] || POUCH_UI.en;
  const moodRow = (MOOD_ARCHETYPES as readonly { archetype: string; icon: string; label: Record<string, string> }[])
    .find((m) => m.archetype === pouch.mood);

  return (
    <div
      role="dialog"
      aria-label={ui.title}
      data-testid="combined-pouch-modal"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9600,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(4,4,8,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
      }}
    >
      <style>{`
        @keyframes ks-pouch-star-float {
          0% { opacity: 0; transform: translateX(-50%) translateY(6px); }
          18% { opacity: 1; }
          100% { opacity: 0; transform: translateX(-50%) translateY(-26px); }
        }
      `}</style>
      <div
        style={{
          width: '360px', maxWidth: 'calc(100vw - 32px)',
          background: 'rgba(11,11,14,0.95)',
          border: '1px solid #D4AF37', borderRadius: 16,
          boxShadow: '0 18px 60px rgba(0,0,0,0.6), 0 0 24px rgba(212,175,55,0.12)',
          padding: '22px 20px 18px', color: '#E8DCC0',
          fontFamily: '"Noto Serif SC","Songti SC",Georgia,serif',
          position: 'relative', maxHeight: '82vh', overflowY: 'auto',
        }}
      >
        {/* 星尘入账飘字（金色上飘消散——首次揭示态） */}
        {justClaimed && (
          <div
            data-testid="pouch-starlight-toast"
            style={{
              position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
              padding: '6px 14px', borderRadius: 999, whiteSpace: 'nowrap',
              background: 'rgba(19,16,10,0.92)', border: '1px solid #D4AF37',
              color: '#F5E1A4', fontSize: 12, letterSpacing: 1,
              animation: 'ks-pouch-star-float 2.4s ease-out forwards',
            }}
          >
            {ui.starNote}
          </div>
        )}
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 16, letterSpacing: 2, color: '#F3E5AB', fontWeight: 600 }}>
            {ui.title}
          </h3>
        </div>

        {/* ══ 上半区【心绪指引】：五行徽章＋天象抚慰＋行动建议 ══ */}
        <div data-testid="pouch-mood-section" style={{ marginBottom: 14 }}>
          <p style={{ margin: '0 0 8px', fontSize: 11, letterSpacing: 2, color: 'rgba(212,188,122,0.85)' }}>
            ✦ {ui.moodLead}
          </p>
          {moodRow && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 20, filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.5))' }}>{moodRow.icon}</span>
              <span style={{ fontSize: 13, color: '#F3E5AB', letterSpacing: 1 }}>
                {moodRow.label[lang] || moodRow.label.en}
              </span>
            </div>
          )}
          <p style={{ margin: '0 0 6px', fontSize: 11.5, color: 'rgba(159,199,232,0.85)', letterSpacing: 0.5 }}>
            ✧ {pouch.transitAttribution.summary}
          </p>
          <p style={{ margin: '0 0 8px', fontSize: 13.5, lineHeight: 1.7, color: '#E8D9A8' }}>
            {pouch.transitAttribution.companionComfort}
          </p>
          <p style={{
            margin: 0, padding: '8px 10px', borderRadius: 10,
            background: 'rgba(212,175,55,0.08)', border: '1px dashed rgba(212,175,55,0.35)',
            fontSize: 12.5, color: '#D4BC7A', lineHeight: 1.6,
          }}>
            {pouch.transitAttribution.actionableAdvice}
          </p>
        </div>

        {/* ══ 下半区【星轨助运】：幸运色块＋吉时标牌＋箴言＋贵人方位 ══ */}
        <div
          data-testid="pouch-lucky-section"
          style={{
            borderTop: '1px solid rgba(212,175,55,0.25)', paddingTop: 12,
          }}
        >
          <p style={{ margin: '0 0 10px', fontSize: 11, letterSpacing: 2, color: 'rgba(212,188,122,0.85)' }}>
            ✦ {ui.luckyLead}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span
              aria-hidden="true"
              style={{
                width: 26, height: 26, borderRadius: '50%', flex: '0 0 auto',
                background: pouch.luckyAttributes.colorHex,
                boxShadow: `0 0 10px ${pouch.luckyAttributes.colorHex}88`,
                border: '1px solid rgba(255,255,255,0.25)',
              }}
            />
            <span style={{ fontSize: 12.5, color: '#E8DCC0' }}>
              {ui.colorLead} · {pouch.luckyAttributes.colorName}
            </span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8,
          }}>
            <span style={{
              padding: '4px 12px', borderRadius: 999,
              background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.4)',
              fontSize: 12, color: '#F3E5AB', letterSpacing: 1,
            }}>
              ✦ {ui.windowLead} {pouch.luckyAttributes.bestWindow}
            </span>
            <span style={{ fontSize: 12, color: 'rgba(232,220,192,0.8)' }}>
              {ui.dirLead} · {pouch.luckyAttributes.direction}
            </span>
          </div>
          {pouch.vibe && (
            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, color: 'rgba(240,230,200,0.78)' }}>
              {pouch.vibe}
            </p>
          )}
        </div>

        {/* 底部：只读复看态说明＋[ 收入锦囊袋 ] 关闭 */}
        {!justClaimed && (
          <p style={{ margin: '10px 0 0', fontSize: 11, textAlign: 'center', color: 'rgba(212,188,122,0.6)' }}>
            ✧ {ui.starDone}
          </p>
        )}
        <button
          type="button"
          data-testid="pouch-stow"
          onClick={onClose}
          style={{
            marginTop: 12, width: '100%', padding: '10px 0', borderRadius: 10,
            background: 'linear-gradient(135deg, #D4AF37, #E5C158)', color: '#14110A',
            border: '1px solid #F5E6BE', fontSize: 13, letterSpacing: 2, fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          ✦ {ui.close}
        </button>
      </div>
    </div>
  );
};

export default CombinedPouchModal;
