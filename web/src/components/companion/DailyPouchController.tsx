/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏆 E120-CHAIN 刀一（主公军令 2026-11-03）：今日感应锦囊前置罗盘状态机控制器
 * ═══════════════════════════════════════════════════════════════════════════
 * 军令锚（入口拦截与双模态状态机串联）：
 *   点击【今日幸运锦囊】
 *     ├─ 已完成今日打卡 ──► 直接展示《感应锦囊合璧笺》（只读 REVEALED）
 *     └─ 今日尚未打卡 ──► 拦截并呼出 MoodCompassModal（MOOD_SELECTING 以心启符）
 *                             └► 用户点选五维情绪徽章 ⇒ 罗盘优雅收拢
 *                                ⇒ 无缝过渡至锦囊展开态（REVEALED 天象解药＋幸运加持）
 * 🔴 灵犀星单日原子入账：唯一入账点＝罗盘情绪落定→合璧笺首次揭示
 *    （onClaimStarlight 回调——由宿主 FamiliarHomeCard 走 E111 真源账本通道，
 *    同日幂等；只读复看分支零入账零交易）。
 * 🔴 严禁并列入口：首页唯一锦囊入口（军令钦定「严禁独立情绪气泡」）——
 *    罗盘仅作为锦囊前置启动器在本控制器内呈现。
 * ═══════════════════════════════════════════════════════════════════════════
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MOOD_ATTRIBUTIONS } from '../../lib/companionMoodData.mjs';
import { POUCH_UI, composeCombinedFortune, readFusedPouch, resolvePouchEntry, writeFusedPouch, POUCH_STEPS } from '../../lib/dailyPouchStore.mjs';
import { fortuneDateKey } from '../../lib/dailyFortune.mjs';
import type { FusedPouchRecord } from '../../lib/dailyPouchStore.mjs';
import type { DailyPouchStep, MoodArchetype } from '../../types/companionEmotion';
import MoodCompassModal from './MoodCompassModal';
import CombinedPouchModal from './CombinedPouchModal';

type Lang = 'zh' | 'en' | 'fr' | 'es' | 'th' | 'vi';

export interface DailyPouchControllerProps {
  open: boolean;
  onClose: () => void;
  lang: Lang;
  /** 星盘签名（E49 按盘隔离——合璧档按盘分键；空 ⇒ 'home' 兜底） */
  chartSig?: string;
  /** 本命太阳星座（dailyFortune 确定性核赋能方位收窄；空 ⇒ 全八方位池） */
  sunSign?: string;
  /** 灵犀星入账回调（唯一入账点＝合璧笺首次揭示；返回是否真实 +1） */
  onClaimStarlight?: () => boolean;
}

const DailyPouchController: React.FC<DailyPouchControllerProps> = ({
  open, onClose, lang, chartSig, sunSign, onClaimStarlight,
}) => {
  const [step, setStep] = useState<DailyPouchStep>(POUCH_STEPS.IDLE as DailyPouchStep);
  const [combined, setCombined] = useState<FusedPouchRecord | null>(null);
  const [justClaimed, setJustClaimed] = useState(false);

  const ui = POUCH_UI[lang] || POUCH_UI.en;

  /* 入口拦截（军令断言 6/8 核心）：打开即判当日档——
     未打卡/坏档/跨日 ⇒ 唤罗盘（MOOD_SELECTING）；已打卡 ⇒ 直读合璧笺（REVEALED
     只读，跳过情绪选择，不唤罗盘，零入账零交易）。 */
  useEffect(() => {
    if (!open) { setStep(POUCH_STEPS.IDLE as DailyPouchStep); return; }    const store = (typeof window !== 'undefined' && window.localStorage) ? window.localStorage : null;
    const dateKey = fortuneDateKey(new Date());
    const existing = readFusedPouch(store, chartSig, dateKey);
    setCombined(existing);
    setJustClaimed(false);
    setStep(resolvePouchEntry(existing));
  }, [open, chartSig]);

  /** 罗盘情绪落定 ⇒ 组装合璧笺 ⇒ 落档 ⇒ 灵犀星唯一入账点 ⇒ 揭示 */
  const handleMoodCommit = useCallback((archetype: MoodArchetype) => {
    const attribution = (MOOD_ATTRIBUTIONS as Record<string, Record<string, { transitSummary: string; companionComfort: string; actionableAdvice: string }>>)[archetype];
    const row = attribution ? (attribution[lang] || attribution.en) : null;
    if (!row) return; // fail-closed：未知情绪/归因缺失严禁默认回退
    const dateKey = fortuneDateKey(new Date());
    const fortune = composeCombinedFortune({
      mood: archetype,
      attribution: row,
      lang,
      sunSign,
      dateKey,
      date: new Date(),
    });
    if (!fortune) return; // fail-closed：合璧组装失败不开笺
    const store = (typeof window !== 'undefined' && window.localStorage) ? window.localStorage : null;
    writeFusedPouch(store, chartSig, fortune); // 当日档落盘（幂等复看真源）
    // 🔴 灵犀星唯一入账点（单日原子——E111 真源账本由宿主回调承担）
    let claimed = false;
    try { claimed = onClaimStarlight ? onClaimStarlight() : false; } catch { claimed = false; }
    setCombined(fortune);
    setJustClaimed(claimed);
    setStep(POUCH_STEPS.REVEALED as DailyPouchStep); // 罗盘收拢 ⇒ 无缝过渡锦囊展开态
  }, [lang, sunSign, chartSig, onClaimStarlight]);

  /* 🏆 E122-刀三（主公军令 2026-11-03）：全局入袋 Toast 宿主——收入星语袋
   * 完成后由合璧笺弹窗回调触发，屏幕顶部暗金横幅停留 2.5s（军令钦定）；
   * Toast 生命周期归本控制器（弹窗本体淡出卸载后 Toast 仍须存活）。 */
  const [toastOn, setToastOn] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);
  const handleStowed = useCallback(() => {
    setToastOn(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastOn(false), 2500);
  }, []);

  if (!open && !toastOn) return null;

  /* 🏆 E122-刀一（主公军令 2026-11-03）：弹窗 portal 至 document.body——
   * 病根实锤：本控制器宿主链 .ks-pet-card（position:relative;z-index:2）形成
   * 独立层叠上下文，罗盘/合璧笺弹窗（z-index:9600）被困笼中，而首页 h1.title
   * （z-index:5）同域更高 ⇒「缘分天定」金字穿透骑上弹窗。经 body portal 逃逸
   * 后 z-9600 于根层叠域全局生效（军令 z-[100]/z-[101] 语义之等价履行——
   * 全局遮罩须压过一切页面内容 z-0~z-10 基底层）。 */
  return createPortal(
    <>
      {/* 第一阶段：以心启符（未打卡 ⇒ 拦截唤罗盘——结果层不得先渲染） */}
      {open && step === POUCH_STEPS.MOOD_SELECTING && (
        <MoodCompassModal
          open={open}
          onClose={onClose}
          lang={lang}
          pouchLead={ui.pouchLead}
          onMoodCommit={handleMoodCommit}
        />
      )}
      {/* 第二阶段：锦囊开封（合璧揭示/只读复看——罗盘收拢后呈现） */}
      {open && step === POUCH_STEPS.REVEALED && (
        <CombinedPouchModal
          open={open}
          pouch={combined}
          lang={lang}
          onClose={onClose}
          justClaimed={justClaimed}
          onStowed={handleStowed}
        />
      )}
      {/* 🏆 E122-刀三：全局暗金 Toast（屏幕顶部居中，2.5s 自动消散——军令钦定） */}
      {toastOn && (
        <div
          data-testid="pouch-stow-toast"
          style={{
            position: 'fixed', top: 0, left: 0, right: 0,
            display: 'flex', justifyContent: 'center', pointerEvents: 'none',
            zIndex: 9800,
          }}
        >
          <div
            style={{
              marginTop: 14, padding: '9px 18px', borderRadius: 999,
              background: 'rgba(19,16,10,0.94)', border: '1px solid #D4AF37',
              color: '#F5E1A4', fontSize: 12.5, letterSpacing: 1,
              fontFamily: '"Noto Serif SC","Songti SC",Georgia,serif',
              boxShadow: '0 8px 28px rgba(0,0,0,0.55), 0 0 18px rgba(212,175,55,0.18)',
              overflowWrap: 'anywhere', maxWidth: 'calc(100vw - 32px)', textAlign: 'center',
            }}
          >
            {ui.toast}
          </div>
        </div>
      )}
    </>,
    typeof document !== 'undefined' ? document.body : null as unknown as HTMLElement,
  );
};

export default DailyPouchController;
