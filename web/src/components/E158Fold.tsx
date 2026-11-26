/**
 * ✦ E158-刀七（主公军令 2026-11-26）：/result「单活手风琴」折叠壳。
 *   · 单活互斥：同一时刻仅一份付费报告展开；其余已解锁报告收起为黑金折叠条。
 *   · 收起 ≠ 卸载：DOM 常驻（display:none 折叠），数据留在各组件自身 state/ref
 *     ⇒ 重开零请求、零重复计费，绝不重新上锁。
 *   · 零独立对话窗、零新页面；文案全部走刀八字典（report_unlocked_reopen）。
 */
import type { ReactNode, CSSProperties } from 'react';

type Props = {
  /** 面板标识：once | monthly | yearly */
  id: 'once' | 'monthly' | 'yearly';
  active: boolean;
  onReopen: () => void;
  /** 左侧标题（已含 ✦ 前缀的标题文字，不含「已解锁」） */
  title: string;
  /** 折叠条右侧「展开重温 ▼」 */
  reopenLabel: string;
  /** 折叠条左侧「已解锁」 */
  unlockedLabel: string;
  lang: string;
  children: ReactNode;
};

export default function E158Fold({ id, active, onReopen, title, reopenLabel, unlockedLabel, lang, children }: Props) {
  const hidden: CSSProperties = active ? {} : { display: 'none' };
  return (
    <div className="ks-e158-fold" data-panel={id} data-active={active ? '1' : '0'} data-testid={`e158-fold-${id}`}>
      {!active && (
        <button
          type="button"
          className="ks-e158-bar"
          lang={lang}
          data-testid={`e158-bar-${id}`}
          onClick={onReopen}
          aria-expanded="false"
        >
          <span className="ks-e158-bar-title">✦ {title} · <span className="ks-e158-bar-unlocked">{unlockedLabel}</span></span>
          <span className="ks-e158-bar-reopen">{reopenLabel}</span>
        </button>
      )}
      <div className="ks-e158-fold-body" style={hidden} aria-hidden={active ? undefined : true}>
        {children}
      </div>
    </div>
  );
}
