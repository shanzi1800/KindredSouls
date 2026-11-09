/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏆 E120-刀二（主公军令 2026-11-03）：灵宠五维情绪天象罗盘浮层
 * ═══════════════════════════════════════════════════════════════════════════
 * 军令锚：嵌入首页灵宠待机视窗——点击待机感应气泡后的轻量浮层（Modal）。
 *   · 宽度锁 360px（桌面端对话框同宽）；bg #0B0B0E/95 半透明深空黑金；
 *   · 1px 细金边框＋backdrop-blur；五行微光圆形徽章横向排列＋悬停光晕脉冲；
 *   · 天象归因（MOOD_ATTRIBUTIONS 六语真值）＋语调铁律守卫（toneGuard）；
 *   · 灵犀星原子入账：确认提交 ⇒ claimDailyStarlight（DAILY_PULSE）＋
 *     金色星尘动效「与灵宠羁绊加深 · 灵犀星 +1」（同日幂等——E111 沿袭）。
 * 🔴 零 i18n 新键（自容六语字典——E120 分支零破坏铁律）；零 CSS 文件改动
 *    （inline style——不触发 ui 探针链的 App.css 基准面）。
 * ═══════════════════════════════════════════════════════════════════════════
 */
import React, { useCallback, useMemo, useState } from 'react';
import { MOOD_ARCHETYPES, MOOD_ATTRIBUTIONS, toneGuard } from '../../lib/companionMoodData.mjs';
import { claimDailyStarlight, readStarlightStore, writeStarlightStore } from '../../lib/starlightLedger.mjs';
// 🏆 E123-刀四：罗盘情绪落盘 sessionStorage（ChatSheet 首句拦截真源）
// @ts-ignore —— companionMoodGreetings.mjs 纯 JS 逻辑核（形状由 E123 闸门守备）
import { writeActiveMood } from '../../lib/companionMoodGreetings.mjs';
// 🆕 E129-刀三（军令 2026-11-09）：罗盘情绪心流静默入库（fire-and-forget——
//    user_mood_logs 时间序列蓄水；未登录/网络失败一律静默零阻断）
import { logMoodSilently } from '../../lib/livingAgentClient';
import type { MoodArchetype } from '../../types/companionEmotion';

type Lang = 'zh' | 'en' | 'fr' | 'es' | 'th' | 'vi';

/** 自容六语 UI 字典（零 i18n 键——分支隔离铁律） */
const COMPASS_UI: Record<Lang, {
  title: string; lead: string; confirm: string; close: string;
  starGain: string; starDone: string; comfortLead: string; actionLead: string; transitLead: string; energyLead: string;
}> = {
  zh: {
    title: '✦ 情绪天象罗盘 ✦', lead: '此刻心里的天色是——', confirm: '记下这一刻', close: '关闭',
    starGain: '与灵宠羁绊加深 · 灵犀星 +1', starDone: '今日灵犀星已入账，明天再来',
    comfortLead: '灵宠抚慰', actionLead: '今晚的微小行动', transitLead: '天象归因', energyLead: '能量属性',
  },
  en: {
    title: '✦ Mood Compass ✦', lead: 'The sky inside you right now —', confirm: 'Mark this moment', close: 'Close',
    starGain: 'Bond deepened · Starlight +1', starDone: 'Today\'s starlight already logged — see you tomorrow',
    comfortLead: 'Companion\'s comfort', actionLead: 'One tiny act tonight', transitLead: 'Celestial attribution', energyLead: 'Energy aspect',
  },
  fr: {
    title: '✦ Boussole des Humeurs ✦', lead: 'Le ciel en toi en ce moment —', confirm: 'Graver cet instant', close: 'Fermer',
    starGain: 'Lien approfondi · Étoile +1', starDone: 'L\'étoile du jour est déjà inscrite — à demain',
    comfortLead: 'Réconfort du compagnon', actionLead: 'Un petit geste ce soir', transitLead: 'Attribution céleste', energyLead: 'Aspect énergétique',
  },
  es: {
    title: '✦ Brújula Emocional ✦', lead: 'El cielo dentro de ti ahora —', confirm: 'Guardar este instante', close: 'Cerrar',
    starGain: 'Vínculo profundizado · Estrella +1', starDone: 'La estrella de hoy ya quedó registrada — hasta mañana',
    comfortLead: 'Consuelo del compañero', actionLead: 'Un pequeño gesto esta noche', transitLead: 'Atribución celeste', energyLead: 'Aspecto energético',
  },
  th: {
    title: '✦ เข็มทิศอารมณ์ ✦', lead: 'ท้องฟ้าในใจคุณตอนนี้คือ —', confirm: 'บันทึกช่วงเวลานี้', close: 'ปิด',
    starGain: 'สายใยแน่นแฟ้นขึ้น · ดาว +1', starDone: 'ดวงดาววันนี้บันทึกแล้ว พบกันพรุ่งนี้',
    comfortLead: 'คำปลอบจากคู่หู', actionLead: 'การกระทำเล็กๆ คืนนี้', transitLead: 'การอ้างอิงจากดวงดาว', energyLead: 'คุณลักษณะพลังงาน',
  },
  vi: {
    title: '✦ La Bàn Cảm Xúc ✦', lead: 'Bầu trời trong tim bạn lúc này —', confirm: 'Ghi lại khoảnh khắc này', close: 'Đóng',
    starGain: 'Sự gắn kết sâu hơn · Tinh tú +1', starDone: 'Tinh tú hôm nay đã ghi sổ, hẹn gặp ngày mai',
    comfortLead: 'Lời an ủi của linh thú', actionLead: 'Một hành động nhỏ tối nay', transitLead: 'Quy chiếu thiên tượng', energyLead: 'Thuộc tính năng lượng',
  },
};

/** 五行微光徽章色（celestial-tokens 同源暗金体系） */
const ELEMENT_GLOW: Record<string, string> = {
  fire: '#F0C36A', water: '#9FC7E8', metal: '#DCE1EA', wood: '#B8D8A8', earth: '#E8C9A0',
};

export interface MoodCompassModalProps {
  open: boolean;
  onClose: () => void;
  lang: Lang;
  hostName?: string;
  /**
   * 🏆 E120-CHAIN（军令 2026-11-03）：受控嵌入模式——罗盘作为今日感应锦囊的
   * 前置启动器。提供回调时：确认提交仅上抛情绪原型（父级承担入账与合笺流转），
   * 本组件不再自行入账/飘字；未提供时保留独立行为（E120 原样兼容）。
   */
  onMoodCommit?: (archetype: 'radiant' | 'longing' | 'melancholy' | 'agitated' | 'grateful') => void;
  /** 锦囊前置引导语（军令钦定句式「锦囊随心而动。此刻你周围的气场偏向何方？」） */
  pouchLead?: string;
}

export const MoodCompassModal: React.FC<MoodCompassModalProps> = ({ open, onClose, lang, hostName, onMoodCommit, pouchLead }) => {
  const [selected, setSelected] = useState<MoodArchetype | null>(null);
  const [starFloat, setStarFloat] = useState<'gain' | 'done' | null>(null);

  const ui = COMPASS_UI[lang] || COMPASS_UI.en;
  const attribution = useMemo(() => {
    if (!selected) return null;
    const row = (MOOD_ATTRIBUTIONS as Record<string, Record<string, { transitSummary: string; energyAspect: string; companionComfort: string; actionableAdvice: string }>>)[selected];
    return row ? (row[lang] || row.en) : null;
  }, [selected, lang]);

  /** 确认提交：语调铁律守卫＋灵犀星原子入账（DAILY_PULSE）
   *  🏆 E120-CHAIN：受控嵌入模式（onMoodCommit 在场）⇒ 仅上抛情绪原型，
   *  入账与合笺流转归父级 DailyPouchController（单日原子唯一入账点）。
   *  🏆 E123-刀四（军令 2026-11-04）：确认时刻同步落盘 sessionStorage
   *  ks_active_mood（当日＋2h 时效——ChatSheet 开舱首句情绪感知贯通真源）；
   *  无痕模式抛错 ⇒ 静默降级（不阻断罗盘交互）。 */
  const handleConfirm = useCallback(() => {
    if (!selected || !attribution) return;
    // 语调铁律运行时守卫（fail-closed：恐慌词命中即不入账——军令断言 1 守卫面）
    const guard = toneGuard(attribution.companionComfort, lang);
    if (guard.bannedHit) return;
    // E123-刀四：情绪落盘（白名单五原型——坏值不写 fail-closed）
    try { writeActiveMood(sessionStorage, selected); } catch { /* 无痕 ⇒ 静默 */ }
    // 🆕 E129-刀三（军令 2026-11-09）：情绪心流静默入库（fire-and-forget 不 await；
    //    服务端白名单复检＋未登录拒收——本地零感知零阻断）
    logMoodSilently(selected);
    // 受控嵌入：情绪落定上抛父级（父级组装合璧笺＋唯一入账点）
    if (onMoodCommit) {
      onMoodCommit(selected);
      return;
    }
    try {
      const today = new Date().toISOString().slice(0, 10);
      const ledger = readStarlightStore();
      const result = claimDailyStarlight(ledger, today);
      if (result.granted) {
        writeStarlightStore(undefined, result.ledger);
        setStarFloat('gain');
      } else {
        setStarFloat('done');
      }
      window.setTimeout(() => setStarFloat(null), 2400);
    } catch { /* iOS 无痕存储抛错 ⇒ 打卡静默降级（不阻断交互） */ }
  }, [selected, attribution, lang, onMoodCommit]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-label={ui.title}
      data-testid="mood-compass-modal"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9600,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        /* 🏆 E122-刀一（军令 2026-11-03）：遮罩加深 0.55→0.72＋blur 8px
           （bg-black/70 backdrop-blur-md 语义）——配合 body portal 绝断穿透 */
        background: 'rgba(4,4,8,0.72)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      {/* 星尘飘字动画（组件自容 keyframes——零 App.css 改动） */}
      <style>{`
        @keyframes ks-mood-star-float {
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
          position: 'relative',
        }}
      >
        {/* 灵犀星入账星尘飘字（金色上飘消散 2.4s） */}
        {starFloat && (
          <div
            data-testid="mood-starlight-toast"
            style={{
              position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
              padding: '6px 14px', borderRadius: 999,
              background: 'rgba(19,16,10,0.92)', border: '1px solid #D4AF37',
              color: '#F5E1A4', fontSize: 12, letterSpacing: 1, whiteSpace: 'nowrap',
              animation: 'ks-mood-star-float 2.4s ease-out forwards',
            }}
          >
            {starFloat === 'gain' ? `✦ ${ui.starGain}` : `✧ ${ui.starDone}`}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <h3 style={{ margin: 0, fontSize: 16, letterSpacing: 2, color: '#F3E5AB', fontWeight: 600 }}>
            {ui.title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={ui.close}
            style={{
              background: 'none', border: 'none', color: 'rgba(232,220,192,0.55)',
              fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: 4,
            }}
          >
            ✕
          </button>
        </div>
        {hostName ? (
          <p style={{ margin: '0 0 10px', fontSize: 12, color: 'rgba(212,188,122,0.75)', letterSpacing: 1 }}>
            ✦ {hostName}
          </p>
        ) : null}
        <p style={{ margin: '0 0 14px', fontSize: 13, color: 'rgba(232,220,192,0.75)' }}>
          {pouchLead || ui.lead}
        </p>

        {/* 五维徽章横排（五行微光＋悬停光晕脉冲） */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', marginBottom: 14 }} data-testid="mood-archetype-row">
          {MOOD_ARCHETYPES.map((m) => {
            const active = selected === m.archetype;
            const glow = ELEMENT_GLOW[m.element] || '#D4AF37';
            return (
              <button
                key={m.archetype}
                type="button"
                onClick={() => { setSelected(m.archetype); setStarFloat(null); }}
                aria-pressed={active}
                data-testid={`mood-badge-${m.archetype}`}
                style={{
                  flex: '1 1 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  background: active ? 'rgba(212,175,55,0.12)' : 'rgba(20,18,26,0.6)',
                  border: `1px solid ${active ? '#D4AF37' : 'rgba(212,175,55,0.28)'}`,
                  borderRadius: 12, padding: '10px 2px 8px', cursor: 'pointer',
                  transition: 'all .18s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 0 14px ${glow}55`; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
              >
                <span style={{ fontSize: 20, filter: `drop-shadow(0 0 6px ${glow}88)` }}>{m.icon}</span>
                <span style={{ fontSize: 11, color: active ? '#F3E5AB' : 'rgba(232,220,192,0.8)', letterSpacing: 0.5 }}>
                  {m.label[lang] || m.label.en}
                </span>
              </button>
            );
          })}
        </div>

        {/* 天象归因面板（选中后展开——语调铁律保证的抚慰文案） */}
        {attribution ? (
          <div
            data-testid="mood-attribution-panel"
            style={{
              borderTop: '1px solid rgba(212,175,55,0.25)', paddingTop: 12,
              display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto',
            }}
          >
            <p style={{ margin: 0, fontSize: 11.5, color: 'rgba(159,199,232,0.85)', letterSpacing: 0.5 }}>
              ✧ {ui.transitLead} · {attribution.transitSummary}
            </p>
            <p style={{ margin: 0, fontSize: 11.5, color: 'rgba(220,225,234,0.8)' }}>
              ✧ {ui.energyLead} · {attribution.energyAspect}
            </p>
            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.7, color: '#E8D9A8' }}>
              {attribution.companionComfort}
            </p>
            <p
              data-testid="mood-action-advice"
              style={{
                margin: 0, padding: '8px 10px', borderRadius: 10,
                background: 'rgba(212,175,55,0.08)', border: '1px dashed rgba(212,175,55,0.35)',
                fontSize: 12.5, color: '#D4BC7A', lineHeight: 1.6,
              }}
            >
              ✦ {ui.actionLead}：{attribution.actionableAdvice}
            </p>
            <button
              type="button"
              onClick={handleConfirm}
              data-testid="mood-confirm"
              style={{
                marginTop: 4, alignSelf: 'stretch', padding: '10px 0', borderRadius: 10,
                background: 'linear-gradient(135deg, #D4AF37, #E5C158)', color: '#14110A',
                border: '1px solid #F5E6BE', fontSize: 13, letterSpacing: 2, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ✦ {ui.confirm}
            </button>
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: 12, color: 'rgba(232,220,192,0.5)', textAlign: 'center' }}>
            ✧ · ✧ · ✧
          </p>
        )}
      </div>
    </div>
  );
};

export default MoodCompassModal;
