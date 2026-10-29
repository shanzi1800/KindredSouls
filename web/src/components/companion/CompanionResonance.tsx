/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🐾 E105（主公军令 2026-10-30 刀一）：灵宠双端伴读共鸣状态机
 * ═══════════════════════════════════════════════════════════════════════════
 * 五态有限状态机（FSM）：
 *   IDLE → AWAKEN（报告挂载完成后 300ms 触发首句定调台词）
 *        → RESONATING（IntersectionObserver 监听八字局/塔罗牌锚点进入视口 60%，
 *          触发共鸣点拨，4s 自动隐退）
 *        → EXPANDED（点击主动唤起）
 *        → MINIMIZED（微光常驻态）
 * 双端几何：
 *   · 桌面（> 768px）：Milo 守护盘龙固定右下（right: 24 / bottom: 24 / z-index 40，
 *     朝向左侧内容）；Sophia 灵动白狐固定左下（left: 24 / bottom: 24，朝向右侧）；
 *     气泡＝深空黑金玻璃拟态（rgba(11,12,16,0.85)＋blur 12px＋金色微边框，maxWidth 320px）。
 *   · 移动（≤ 768px）：右下角单枚 48px 悬浮徽章；共鸣滑出 Toast 胶囊条；
 *     点击展开半屏抽屉（Drawer），杜绝遮挡正文。
 * 🔴 零异步铁律：台词全部经 companionLines.mjs 本地规则匹配（< 16ms），禁远程 LLM。
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { pickCompanionLine, companionAnchorLine } from './companionLines.mjs';

export type FsmState = 'IDLE' | 'AWAKEN' | 'RESONATING' | 'EXPANDED' | 'MINIMIZED';

export interface CompanionAst {
  cardId: number | null;
  isReversed: boolean;
  tarotName: string;
  overall: number;
  bazi: string;
}

export interface CompanionResonanceProps {
  locale: 'zh' | 'en' | 'fr' | 'es' | 'th' | 'vi';
  ast: CompanionAst;
}

const AWAKEN_DELAY_MS = 300;    // 军令：报告挂载完成后 300ms 触发首句
const RESONATE_RETREAT_MS = 4000; // 军令：共鸣点拨 4s 自动隐退
const AWAKEN_HOLD_MS = 6000;
const IO_THRESHOLD = 0.6;       // 军令：锚点进入视口 60% 触发共鸣

const BUBBLE_STYLE: React.CSSProperties = {
  maxWidth: '320px',
  padding: '10px 14px',
  borderRadius: '14px',
  background: 'rgba(11, 12, 16, 0.85)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(212, 175, 55, 0.35)',
  color: '#F3E5AB',
  fontSize: '13px',
  lineHeight: 1.6,
  boxShadow: '0 8px 28px rgba(0, 0, 0, 0.45)',
};

const AVATAR_STYLE: React.CSSProperties = {
  width: '58px', height: '58px', borderRadius: '50%',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '26px', cursor: 'pointer',
  background: 'radial-gradient(circle at 38% 34%, rgba(212,175,55,0.32) 0%, rgba(24,26,34,0.95) 70%)',
  border: '1.5px solid rgba(212, 175, 55, 0.5)',
  boxShadow: '0 6px 22px rgba(0,0,0,0.5)',
};

export default function CompanionResonance({ locale, ast }: CompanionResonanceProps) {
  const [state, setState] = useState<FsmState>('IDLE');
  const [line, setLine] = useState<string | null>(null);
  const [speaker, setSpeaker] = useState<'Milo' | 'Sophia'>('Milo');
  const [isMobile, setIsMobile] = useState(false);
  const seenAnchors = useRef<Set<Element>>(new Set());

  // ── 视口分流（桌面 > 768px / 移动 ≤ 768px）──
  useEffect(() => {
    const mq = typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(max-width: 768px)') : null;
    const apply = () => setIsMobile(!!(mq && mq.matches));
    apply();
    if (mq && typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
    return undefined;
  }, []);

  // ── IDLE → AWAKEN（报告挂载完成后 300ms 首句定调）──
  useEffect(() => {
    if (state !== 'IDLE') return undefined;
    const t = setTimeout(() => {
      setLine(pickCompanionLine({ ...ast, stage: 'AWAKEN' }, locale));
      setSpeaker('Milo');
      setState('AWAKEN');
    }, AWAKEN_DELAY_MS);
    return () => clearTimeout(t);
  }, [state, ast, locale]);

  // ── AWAKEN 气泡 6s 后收敛微光常驻 ──
  useEffect(() => {
    if (state !== 'AWAKEN') return undefined;
    const t = setTimeout(() => setState('MINIMIZED'), AWAKEN_HOLD_MS);
    return () => clearTimeout(t);
  }, [state]);

  // ── RESONATING：共鸣点拨 4s 自动隐退（军令时序）──
  useEffect(() => {
    if (state !== 'RESONATING') return undefined;
    const t = setTimeout(() => setState('MINIMIZED'), RESONATE_RETREAT_MS);
    return () => clearTimeout(t);
  }, [state]);

  // ── IntersectionObserver：八字局/塔罗锚点进入视口 60% ⇒ 共鸣点拨 ──
  useEffect(() => {
    if (state === 'IDLE' || state === 'EXPANDED') return undefined;
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.intersectionRatio >= IO_THRESHOLD && !seenAnchors.current.has(entry.target)) {
          seenAnchors.current.add(entry.target);
          const kind = (entry.target as HTMLElement).dataset?.companionAnchor === 'bazi' ? 'bazi' : 'tarot';
          setLine(companionAnchorLine(ast, locale, kind));
          setSpeaker(kind === 'bazi' ? 'Milo' : 'Sophia');
          setState('RESONATING');
        }
      }
    }, { threshold: [IO_THRESHOLD] });
    const anchors = document.querySelectorAll('[data-companion-anchor]');
    anchors.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [state, ast, locale]);

  // ── 点击：EXPANDED ⇄ MINIMIZED（主动唤起/收起）──
  const onTap = useCallback(() => {
    setState((prev) => {
      if (prev === 'EXPANDED') return 'MINIMIZED';
      setLine(pickCompanionLine({ ...ast, stage: 'EXPANDED' }, locale));
      return 'EXPANDED';
    });
  }, [ast, locale]);

  const showBubble = (state === 'AWAKEN' || state === 'RESONATING' || state === 'EXPANDED') && !!line;
  const glow = state === 'MINIMIZED' || state === 'IDLE'; // 微光常驻态

  const avatar = useMemo(() => (pet: 'Milo' | 'Sophia', size: number): React.CSSProperties => ({
    ...AVATAR_STYLE,
    width: size, height: size, fontSize: size * 0.46,
    filter: glow ? 'saturate(0.85) brightness(0.8)' : 'none',
    animation: glow ? 'ks-companion-breathe 3.2s ease-in-out infinite' : 'none',
  }), [glow]);

  /* ═══ 移动端：单枚 48px 徽章＋Toast 胶囊＋半屏抽屉 Drawer ═══ */
  if (isMobile) {
    return (
      <>
        {showBubble && state !== 'EXPANDED' && (
          <div
            className="ks-companion-toast"
            role="status"
            style={{ position: 'fixed', right: 16, bottom: '84px', zIndex: 41, ...BUBBLE_STYLE, maxWidth: '260px' }}
          >
            {speaker === 'Milo' ? '🐉' : '🦊'} {line}
          </div>
        )}
        {state === 'EXPANDED' && (
          <div
            className="ks-companion-drawer"
            role="dialog"
            style={{
              position: 'fixed', left: 0, right: 0, bottom: 0, height: '55vh', zIndex: 41,
              background: 'rgba(11, 12, 16, 0.92)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              borderTop: '1px solid rgba(212, 175, 55, 0.35)', borderRadius: '18px 18px 0 0',
              padding: '20px 18px', color: '#F3E5AB', fontSize: '14px', lineHeight: 1.7,
              overflowY: 'auto',
            }}
            onClick={onTap}
          >
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>{speaker === 'Milo' ? '🐉' : '🦊'}</div>
            {line}
          </div>
        )}
        <div
          className="ks-companion-badge"
          role="button"
          tabIndex={0}
          aria-label="companion"
          onClick={onTap}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onTap(); }}
          style={{
            position: 'fixed', right: 16, bottom: 20, width: '48px', height: '48px', zIndex: 40,
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px', cursor: 'pointer',
            background: 'radial-gradient(circle at 38% 34%, rgba(212,175,55,0.32) 0%, rgba(24,26,34,0.95) 70%)',
            border: '1.5px solid rgba(212, 175, 55, 0.5)',
            filter: glow ? 'saturate(0.85) brightness(0.8)' : 'none',
            animation: glow ? 'ks-companion-breathe 3.2s ease-in-out infinite' : 'none',
          }}
        >
          🐉
        </div>
      </>
    );
  }

  /* ═══ 桌面端：Milo 右下（朝左）/ Sophia 左下（朝右）双宠对角 ═══ */
  return (
    <>
      {/* Milo · 守护盘龙（固定右下角，朝向左侧内容） */}
      <div style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 40, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
        {showBubble && speaker === 'Milo' && <div style={BUBBLE_STYLE}>{line}</div>}
        <div
          className="ks-companion-milo"
          role="button"
          tabIndex={0}
          aria-label="Milo companion"
          onClick={onTap}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onTap(); }}
          style={avatar('Milo', 58)}
          title="Milo"
        >
          🐉
        </div>
      </div>
      {/* Sophia · 灵动白狐（固定左下角，朝向右侧内容） */}
      <div style={{ position: 'fixed', left: 24, bottom: 24, zIndex: 40, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
        {showBubble && speaker === 'Sophia' && <div style={BUBBLE_STYLE}>{line}</div>}
        <div
          className="ks-companion-sophia"
          role="button"
          tabIndex={0}
          aria-label="Sophia companion"
          onClick={onTap}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onTap(); }}
          style={avatar('Sophia', 58)}
          title="Sophia"
        >
          🦊
        </div>
      </div>
    </>
  );
}
