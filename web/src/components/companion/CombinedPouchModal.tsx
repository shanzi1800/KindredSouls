/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏆 E120-CHAIN 刀二（主公军令 2026-11-03）：合璧感应锦囊弹层
 * ═══════════════════════════════════════════════════════════════════════════
 * 军令锚（「以心启符 · 锦囊化药」融合方案）：360px 深空黑金卡片，上下两段式——
 *   · 上半区【心绪指引】：五行徽章缩略＋灵宠结合天象的抚慰话术与行动建议；
 *   · 下半区【星轨助运】：幸运色圆形色块＋能量吉时标牌＋今日气场箴言＋贵人方位；
 *   · 底部：首次揭示触发金色星尘粒子（灵犀星 +1 已沉淀至星历账本）＋
 *     [ 收入星语袋 ] 关闭按钮；已打卡只读复看态显示「已入账」。
 * 🔴 零 i18n 新键（POUCH_UI 自容六语字典）；零 CSS 文件改动（inline style）。
 *
 * 🏆 E122-刀一/刀三（主公军令 2026-11-03）：
 *   · 刀一：遮罩加深 0.55→0.72＋blur 6→8px（军令 bg-black/70 backdrop-blur-md
 *     语义）——配合 DailyPouchController body portal 逃逸 .ks-pet-card z-2
 *     层叠笼，绝断「缘分天定」金字穿透。
 *   · 刀三：移除生硬 onClose——「收入星语袋」三态微交互闭环：
 *     点击 ⇒ Loading/成功态「✓ 已收入星语袋」＋300ms 金色 shimmer 扫掠 ⇒
 *     400ms 后平滑淡出 ⇒ 全局暗金 Toast 2.5s（onStowed 上抛宿主渲染）；
 *     当日复看（justClaimed=false）⇒ 按钮置灰禁用「今日已收入」。
 *
 * 🏆 E123-ASTRAL-TOUCH 刀一/二/三（主公军令 2026-11-04）：
 *   · 刀一：置灰态暗金琉璃微光——amber-950 微透底＋amber-500 金丝细边＋
 *     amber-200 浅香槟金文字（主公实锤「死黑不可辨」根治；✓ 前缀达成感）。
 *   · 刀二：入袋并行触发 Canvas 实体卡静默下载（starWhisperCardExport——
 *     1080×1748 高清 PNG，KindredSouls-星语灵犀-YYYYMMDD.png 落本地）。
 *   · 刀三：右上角物理关闭 ✕（absolute 常驻＋Esc 键盘监听——PC 鼠标
 *     点击遮罩外才能关的交互病根治）。
 * ═══════════════════════════════════════════════════════════════════════════
 */
import React, { useEffect, useRef, useState } from 'react';
import { MOOD_ARCHETYPES } from '../../lib/companionMoodData.mjs';
import { POUCH_UI } from '../../lib/dailyPouchStore.mjs';
import type { FusedPouchRecord } from '../../lib/dailyPouchStore.mjs';
// 🏆 E123-刀二：星语灵犀实体卡导出器（复用 E120 密函渲染引擎）
// @ts-ignore —— starWhisperCardExport.mjs 纯 JS 逻辑核（形状由 E123 闸门守备）
import { downloadStarWhisperCard } from '../../lib/starWhisperCardExport.mjs';

type Lang = 'zh' | 'en' | 'fr' | 'es' | 'th' | 'vi';

export interface CombinedPouchModalProps {
  open: boolean;
  pouch: FusedPouchRecord | null;
  lang: Lang;
  onClose: () => void;
  /** 首次揭示（本会话刚经罗盘选心）⇒ 星尘飘字；只读复看 ⇒ 「已入账」态 */
  justClaimed?: boolean;
  /** 🏆 E122-刀三：入袋完成回调（上抛 DailyPouchController 渲染全局 Toast 2.5s） */
  onStowed?: () => void;
}

const CombinedPouchModal: React.FC<CombinedPouchModalProps> = ({ open, pouch, lang, onClose, justClaimed, onStowed }) => {
  /** 刀三三态：idle（可收入）→ stowed（✓ 已收入＋shimmer）→ fading（淡出收口） */
  const [stowed, setStowed] = useState(false);
  const [fading, setFading] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => { timersRef.current.forEach(clearTimeout); }, []);
  useEffect(() => { if (!open) { setStowed(false); setFading(false); } }, [open]);

  /* 🏆 E123-刀三：Esc 键盘关闭监听（物理关闭锚点之二——与右上角 ✕ 等价） */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !pouch) return null;
  const ui = POUCH_UI[lang] || POUCH_UI.en;
  const moodRow = (MOOD_ARCHETYPES as readonly { archetype: string; icon: string; label: Record<string, string> }[])
    .find((m) => m.archetype === pouch.mood);
  /** 当日已入账（只读复看）⇒ 置灰禁用；首次揭示 ⇒ 三态微交互 */
  const alreadyStowedToday = !justClaimed;

  /** 军令刀三时序：点击 ⇒ ✓＋300ms shimmer ⇒ 400ms 后淡出 ⇒ onClose＋Toast
   *  🏆 E123-刀二：并行触发 Canvas 实体卡静默下载（fire-and-forget——
   *  不阻断三态收口时序；渲染失败 fail-soft 静默） */
  const handleStow = () => {
    if (stowed || alreadyStowedToday) return;
    setStowed(true);
    try {
      void downloadStarWhisperCard(pouch, lang).catch(() => { /* fail-soft */ });
    } catch { /* fail-soft */ }
    timersRef.current.push(setTimeout(() => setFading(true), 400));
    timersRef.current.push(setTimeout(() => {
      try { if (onStowed) onStowed(); } catch { /* Toast 宿主异常不阻断收口 */ }
      onClose();
    }, 700));
  };

  return (
    <div
      role="dialog"
      aria-label={ui.title}
      data-testid="combined-pouch-modal"
      onClick={(e) => { if (e.target === e.currentTarget && !stowed) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9600,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(4,4,8,0.72)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        opacity: fading ? 0 : 1,
        transition: 'opacity 300ms ease-out',
      }}
    >
      <style>{`
        @keyframes ks-pouch-star-float {
          0% { opacity: 0; transform: translateX(-50%) translateY(6px); }
          18% { opacity: 1; }
          100% { opacity: 0; transform: translateX(-50%) translateY(-26px); }
        }
        @keyframes ks-pouch-stow-shimmer {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(220%); }
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
          opacity: fading ? 0 : 1,
          transition: 'opacity 300ms ease-out',
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

        {/* 底部：只读复看态说明＋[ 收入星语袋 ] 三态闭环（E122-刀三军令） */}
        {!justClaimed && (
          <p style={{ margin: '10px 0 0', fontSize: 11, textAlign: 'center', color: 'rgba(212,188,122,0.6)' }}>
            ✧ {ui.starDone}
          </p>
        )}
        <button
          type="button"
          data-testid="pouch-stow"
          disabled={alreadyStowedToday || stowed}
          onClick={handleStow}
          style={{
            marginTop: 12, width: '100%', padding: '10px 0', borderRadius: 10,
            /* 🏆 E123-刀一：置灰态暗金琉璃微光（amber-950 微透底＋amber-500 金丝
               细边＋amber-200 浅香槟金文字——主公实锤「死黑不可辨」根治：
               旧置灰态深黑半透文字×暗金底近同色不可辨） */
            background: stowed
              ? 'linear-gradient(135deg, #B8962E, #D4AF37)'
              : alreadyStowedToday
                ? 'rgba(69,26,3,0.45)'
                : 'linear-gradient(135deg, #D4AF37, #E5C158)',
            color: alreadyStowedToday && !stowed ? 'rgba(253,230,138,0.85)' : '#14110A',
            border: alreadyStowedToday && !stowed
              ? '1px solid rgba(245,158,11,0.35)'
              : '1px solid #F5E6BE',
            fontSize: 13, letterSpacing: 2, fontWeight: 600,
            cursor: alreadyStowedToday || stowed ? 'not-allowed' : 'pointer',
            position: 'relative', overflow: 'hidden', overflowWrap: 'anywhere',
            opacity: alreadyStowedToday && !stowed ? 0.95 : 1,
            transition: 'background 200ms ease, color 200ms ease, border-color 200ms ease',
          }}
        >
          {/* 300ms 金色高光扫掠（E122-刀三 shimmer——仅成功态播放一次） */}
          {stowed && (
            <span
              aria-hidden="true"
              data-testid="pouch-stow-shimmer"
              style={{
                position: 'absolute', top: 0, bottom: 0, left: 0, width: '45%',
                background: 'linear-gradient(105deg, transparent, rgba(255,246,214,0.75), transparent)',
                animation: 'ks-pouch-stow-shimmer 300ms ease-out 1 forwards',
                pointerEvents: 'none',
              }}
            />
          )}
          {alreadyStowedToday ? `✓ ${ui.stowDisabled}` : stowed ? ui.stowDone : `✦ ${ui.close}`}
        </button>
        {/* 🏆 E123-刀三：卡片右上角常驻物理关闭 ✕（absolute top-3 right-3——
            相对卡片定位（卡片 position:relative）；悬停浅香槟金＋微光背景；
            zIndex 置内容之上绝不被遮挡；点击即关） */}
        <button
          type="button"
          onClick={() => { if (!stowed) onClose(); }}
          aria-label="close"
          data-testid="pouch-close-x"
          style={{
            position: 'absolute', top: 12, right: 12, zIndex: 20,
            width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.04)', border: 'none', borderRadius: '50%',
            color: 'rgba(232,220,192,0.55)', fontSize: 17, lineHeight: 1, cursor: 'pointer',
            transition: 'color .18s ease, background .18s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#F3E5AB'; e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(232,220,192,0.55)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default CombinedPouchModal;
