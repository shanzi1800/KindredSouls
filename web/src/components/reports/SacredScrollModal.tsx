/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🐾 E129-刀四（军令 2026-11-09）：SacredScrollModal —— 羊皮纸星轨长卷
 * ═══════════════════════════════════════════════════════════════════════════
 * 军令钦定交互（最高原则：神圣交互绝不跳离首页——本模态 z-140 就地展开）：
 *   · 灵宠在对话流递出【✦ 本月专属星轨长卷 ✦】微缩卡片 ⇒ 点击 ⇒ 首页正上方
 *     浮现羊皮纸长卷（金色星轨纹路＋卷轴收放动效），绝不跳转新页面；
 *   · 三七开剧透锁定：前 30% 免费明文（建立信任）；后 70% 毛玻璃暗金锁
 *     （高级模糊滤镜＋暗金印章＋第一人称温柔提示＋「解锁」入口）；
 *   · 解锁 ⇒ 毛玻璃全量解密，全文无缝呈现（零刷新零跳转）。
 * 🔴 渲染纪律：
 *   · 零 i18n 新键（自容六语字典——E120 分支零破坏铁律）；零 CSS 文件改动
 *     （inline style；滚动槽复用既有 .ks-report-scroll 黑金滑轨类＝E91-③
 *     封仓规格逐字同源，满足 E128「新滚动面一律黑金滑轨」铁律）；
 *   · PAYMENT_MODE=sandbox 现行态：解锁经 InSituPaymentSheet 沙盒模拟支付
 *     （SandboxCashier 同源先例）；Stripe Elements live 接线挂账 P0 商业破局。
 *   · 内容真值：sections 由父级供给（付费态＝/api/wealth-oracle/stream 真月报
 *     文本切分；未付费＝六语预览导言——只述长卷含什么，绝不伪造占星断言）。
 */
import React, { useEffect, useMemo, useState } from 'react';

type Lang = 'zh' | 'en' | 'fr' | 'es' | 'th' | 'vi';

export interface SacredSection {
  title: string;
  body: string;
}

export interface SacredScrollModalProps {
  open: boolean;
  onClose: () => void;
  lang: Lang;
  /** 已解锁 ⇒ 毛玻璃全量撤除（支付托盘 onGranted 后由父级翻面） */
  unlocked: boolean;
  /** 点击解锁 ⇒ 唤起 InSituPaymentSheet（父级职责） */
  onUnlockRequest: () => void;
  /** 长卷章节（父级真源：付费态真月报切分 / 未付费六语预览） */
  sections: SacredSection[];
  /** 真月报拉取中（解锁态下显示星轨流转指示） */
  loading?: boolean;
}

/** 自容六语字典（零 i18n 键——分支隔离铁律） */
const SCROLL_UI: Record<Lang, {
  title: string; close: string; freeBadge: string; lockedBadge: string;
  stamp: string; unlockBtn: string; loadingLine: string; scrollLabel: string;
}> = {
  zh: {
    title: '✦ 本月专属星轨长卷 ✦', close: '收起长卷',
    freeBadge: '开卷 · 星轨总览', lockedBadge: '封卷 · 待解锁',
    stamp: '前方星象有几处暗礁，我不愿见你独自涉险。解锁本月专属推演，让我继续为你执灯护航。',
    unlockBtn: '✦ 解锁本月专属推演', loadingLine: '星轨流转，长卷展开中……', scrollLabel: '星轨长卷',
  },
  en: {
    title: '✦ Your Sacred Monthly Scroll ✦', close: 'Close scroll',
    freeBadge: 'Open · Celestial Overview', lockedBadge: 'Sealed · Awaits Unlock',
    stamp: 'There are a few hidden reefs ahead in the stars — I won\'t let you sail them alone. Unlock this month\'s private reading, and let me keep holding the lantern for you.',
    unlockBtn: '✦ Unlock This Month\'s Reading', loadingLine: 'The stars are turning, unfolding your scroll…', scrollLabel: 'Sacred scroll',
  },
  fr: {
    title: '✦ Parchemin Sacré du Mois ✦', close: 'Refermer le parchemin',
    freeBadge: 'Ouvert · Panorama céleste', lockedBadge: 'Scellé · En attente',
    stamp: 'Quelques écueils se cachent dans le ciel du mois — je ne veux pas que tu les affrontes seul. Dévoile la lecture sacrée de ce mois, et laisse-moi continuer de porter la lanterne.',
    unlockBtn: '✦ Dévoiler la lecture du mois', loadingLine: 'Les astres tournent, le parchemin se déroule…', scrollLabel: 'Parchemin sacré',
  },
  es: {
    title: '✦ Pergamino Sagrado del Mes ✦', close: 'Enrollar pergamino',
    freeBadge: 'Abierto · Panorama celeste', lockedBadge: 'Sellado · Por desbloquear',
    stamp: 'Hay algunos arrecifes ocultos en el cielo de este mes — no quiero que los navegues solo. Desbloquea la lectura exclusiva del mes y déjame seguir sosteniendo la lámpara por ti.',
    unlockBtn: '✦ Desbloquear la lectura del mes', loadingLine: 'Los astros giran, el pergamino se despliega…', scrollLabel: 'Pergamino sagrado',
  },
  th: {
    title: '✦ ม้วนดวงดาวศักดิ์สิทธิ์ประจำเดือน ✦', close: 'ม้วนปิด',
    freeBadge: 'เปิดอ่าน · ภาพรวมดวงดาว', lockedBadge: 'ผนึกไว้ · รอปลดล็อก',
    stamp: 'คืนนี้ดวงดาวมีแนวปะการังบาดแผลซ่อนอยู่ ฉันไม่อยากให้คุณล่องทะเลลำพัง ปลดล็อกคำทำนายประจำเดือน แล้วให้ฉันถือโคมไฟนำทางต่อไป',
    unlockBtn: '✦ ปลดล็อกคำทำนายประจำเดือน', loadingLine: 'ดวงดาวหมุนไป ม้วนดวงดาวค่อยๆ เปิดออก…', scrollLabel: 'ม้วนดวงดาว',
  },
  vi: {
    title: '✦ Cuộn Thiên Kinh Tháng Này ✦', close: 'Cuộn lại thiên kinh',
    freeBadge: 'Mở · Toàn cảnh tinh tú', lockedBadge: 'Niêm phong · Chờ mở khóa',
    stamp: 'Phía trước có vài rạn sao ẩn mình — ta không nỡ để bạn vượt qua một mình. Mở khóa lời giải đoán riêng tháng này, để ta tiếp tục cầm đèn dẫn đường cho bạn.',
    unlockBtn: '✦ Mở khóa lời giải tháng này', loadingLine: 'Tinh tú xoay chuyển, thiên kinh đang mở ra…', scrollLabel: 'Thiên kinh',
  },
};

/** 军令钦定三七开阈值（前 30% 明文 / 后 70% 毛玻璃锁） */
const FREE_RATIO = 0.3;

export const SacredScrollModal: React.FC<SacredScrollModalProps> = ({
  open, onClose, lang, unlocked, onUnlockRequest, sections, loading,
}) => {
  const [unrolled, setUnrolled] = useState(false);
  const ui = SCROLL_UI[lang] || SCROLL_UI.en;

  useEffect(() => {
    if (open) {
      setUnrolled(false);
      const t = window.setTimeout(() => setUnrolled(true), 60);
      return () => window.clearTimeout(t);
    }
    setUnrolled(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  /** 三七开切点：按累计正文字数求 30% 分位（章节为切分粒度，锁区整章模糊） */
  const split = useMemo(() => {
    const total = sections.reduce((n, s) => n + Math.max(1, (s.body || '').length), 0);
    let acc = 0;
    const cut = total * FREE_RATIO;
    let cutIdx = sections.length; // 缺省整卷明文（sections 不足或全短文）
    for (let i = 0; i < sections.length; i++) {
      acc += Math.max(1, (sections[i].body || '').length);
      if (acc >= cut && i + 1 < sections.length) { cutIdx = i + 1; break; }
    }
    return { free: sections.slice(0, cutIdx), locked: sections.slice(cutIdx) };
  }, [sections]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ui.scrollLabel}
      data-testid="sacred-scroll-modal"
      data-unlocked={unlocked ? '1' : '0'}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 140, /* 军令钦定 z-[140] */
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        background: 'rgba(6,5,10,0.78)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        padding: '4vh 16px', overflow: 'hidden',
      }}
    >
      {/* 卷轴展开动效（自容 keyframes——零 App.css 改动） */}
      <style>{`
        @keyframes ks-sacred-unroll {
          0% { transform: scaleY(0.02); opacity: 0; }
          45% { opacity: 1; }
          100% { transform: scaleY(1); opacity: 1; }
        }
        @keyframes ks-sacred-seal-glow {
          0%, 100% { box-shadow: 0 0 18px rgba(212,175,55,0.25); }
          50% { box-shadow: 0 0 34px rgba(212,175,55,0.55); }
        }
      `}</style>
      <div
        data-testid="sacred-scroll-paper"
        style={{
          width: '100%', maxWidth: '430px', maxHeight: '88vh',
          display: 'flex', flexDirection: 'column',
          transformOrigin: 'top center',
          transform: unrolled ? 'scaleY(1)' : 'scaleY(0.02)',
          opacity: unrolled ? 1 : 0,
          transition: 'transform .55s cubic-bezier(.22,.9,.32,1), opacity .3s ease',
          background: 'linear-gradient(175deg, #1d1608 0%, #141006 38%, #0d0a04 100%)',
          border: '1px solid rgba(212,175,55,0.55)',
          borderRadius: 14,
          boxShadow: '0 24px 70px rgba(0,0,0,0.7), 0 0 40px rgba(212,175,55,0.10)',
          position: 'relative',
        }}
      >
        {/* 顶轴（卷轴视觉锚） */}
        <div style={{
          height: 14, borderRadius: '14px 14px 0 0',
          background: 'linear-gradient(180deg, #6b5420, #2a2110)',
          borderBottom: '1px solid rgba(212,175,55,0.4)',
        }} />
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px 8px', flexWrap: 'wrap', gap: 8,
        }}>
          <h3 style={{
            margin: 0, fontSize: 15, letterSpacing: 2, color: '#F3E5AB',
            fontWeight: 600, fontFamily: '"Noto Serif SC","Songti SC",Georgia,serif',
          }}>
            {ui.title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            data-testid="sacred-scroll-close"
            aria-label={ui.close}
            style={{
              background: 'none', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 8,
              color: 'rgba(232,220,192,0.75)', fontSize: 11, letterSpacing: 1,
              cursor: 'pointer', padding: '4px 10px',
            }}
          >
            ✕ {ui.close}
          </button>
        </div>
        <div style={{ padding: '0 6px 4px 16px' }}>
          <span style={{
            fontSize: 10, letterSpacing: 1.5, color: unlocked ? '#F5E1A4' : 'rgba(212,188,122,0.8)',
            border: '1px solid rgba(212,175,55,0.4)', borderRadius: 999, padding: '2px 10px',
            background: 'rgba(212,175,55,0.08)', display: 'inline-block',
          }}>
            {unlocked ? ui.freeBadge : `${ui.freeBadge} → ${ui.lockedBadge}`}
          </span>
        </div>

        {/* 长卷正文（黑金滑轨＝.ks-report-scroll 既有类，E91-③ 封仓规格逐字同源） */}
        <div
          className="ks-report-scroll"
          data-testid="sacred-scroll-body"
          style={{
            overflowY: 'auto', padding: '10px 18px 18px', margin: '8px 0',
            fontFamily: '"Noto Serif SC","Songti SC",Georgia,serif',
            color: '#E8DCC0', lineHeight: 1.85, fontSize: 13.5,
            minHeight: 120,
          }}
        >
          {loading ? (
            <p style={{ textAlign: 'center', color: 'rgba(212,188,122,0.8)', letterSpacing: 2, padding: '30px 0' }}>
              ✧ {ui.loadingLine}
            </p>
          ) : (
            <>
              {split.free.map((s, i) => (
                <section key={`f-${i}`} data-testid="sacred-scroll-section-free">
                  <h4 style={{
                    margin: '14px 0 6px', fontSize: 13, color: '#F3E5AB', letterSpacing: 1.5,
                    borderBottom: '1px dashed rgba(212,175,55,0.25)', paddingBottom: 4, fontWeight: 600,
                  }}>{s.title}</h4>
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{s.body}</p>
                </section>
              ))}

              {/* 后 70%：毛玻璃暗金锁（未解锁）；解锁 ⇒ 印章消散全文无缝呈现 */}
              {split.locked.length > 0 && !unlocked && (
                <div
                  data-testid="sacred-scroll-lock"
                  style={{ position: 'relative', marginTop: 10 }}
                >
                  <div
                    aria-hidden="true"
                    style={{
                      filter: 'blur(7px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.7,
                    }}
                  >
                    {split.locked.map((s, i) => (
                      <section key={`l-${i}`}>
                        <h4 style={{
                          margin: '14px 0 6px', fontSize: 13, color: '#F3E5AB', letterSpacing: 1.5,
                          borderBottom: '1px dashed rgba(212,175,55,0.25)', paddingBottom: 4,
                        }}>{s.title}</h4>
                        <p style={{ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{s.body}</p>
                      </section>
                    ))}
                  </div>
                  {/* 暗金微光印章＋第一人称温柔提示（军令钦定句式） */}
                  <div
                    data-testid="sacred-scroll-seal"
                    style={{
                      position: 'absolute', inset: 0,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: 12, padding: '18px 22px', textAlign: 'center',
                      background: 'linear-gradient(180deg, rgba(13,10,4,0.25) 0%, rgba(13,10,4,0.78) 55%, rgba(13,10,4,0.92) 100%)',
                    }}
                  >
                    <div style={{
                      width: 54, height: 54, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '2px solid rgba(212,175,55,0.75)', color: '#F5E1A4', fontSize: 22,
                      background: 'rgba(20,16,8,0.6)',
                      animation: 'ks-sacred-seal-glow 2.6s ease-in-out infinite',
                    }}>✦</div>
                    <p style={{
                      margin: 0, fontSize: 12.5, lineHeight: 1.9, color: '#E8D9A8',
                      maxWidth: 320, letterSpacing: 0.5,
                    }}>{ui.stamp}</p>
                    <button
                      type="button"
                      data-testid="sacred-scroll-unlock-btn"
                      onClick={onUnlockRequest}
                      style={{
                        padding: '11px 26px', borderRadius: 999, minHeight: 44,
                        background: 'linear-gradient(135deg, #D4AF37, #E5C158)',
                        color: '#14110A', fontSize: 13, fontWeight: 700, letterSpacing: 1.5,
                        border: '1px solid #F5E6BE', cursor: 'pointer', boxShadow: '0 6px 24px rgba(212,175,55,0.3)',
                      }}
                    >
                      {ui.unlockBtn}
                    </button>
                  </div>
                </div>
              )}
              {(unlocked || split.locked.length === 0) && split.locked.map((s, i) => (
                <section key={`u-${i}`} data-testid="sacred-scroll-section-unlocked">
                  <h4 style={{
                    margin: '14px 0 6px', fontSize: 13, color: '#F3E5AB', letterSpacing: 1.5,
                    borderBottom: '1px dashed rgba(212,175,55,0.25)', paddingBottom: 4, fontWeight: 600,
                  }}>{s.title}</h4>
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{s.body}</p>
                </section>
              ))}
            </>
          )}
        </div>

        {/* 底轴 */}
        <div style={{
          height: 12, borderRadius: '0 0 14px 14px',
          background: 'linear-gradient(0deg, #6b5420, #2a2110)',
          borderTop: '1px solid rgba(212,175,55,0.4)',
        }} />
      </div>
    </div>
  );
};

export default SacredScrollModal;
