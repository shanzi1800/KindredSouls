import React from 'react';

/**
 * SynastryProgress — 合盘「推演仪式感」进度卡（Gate 43 · 甲线）
 * ─────────────────────────────────────────────────────────────────────
 * 纯展示组件（无状态、无副作用）：只渲染服务端 SSE 下发的**真实里程碑帧**。
 *   · 文案（title / label）一律来自帧体 —— 由服务端从字典真值源取词，前端**零硬编码**。
 *   · pct 为服务端声明式刻度（15/45/70/90/100），前端只做 CSS 过渡，不臆造进度。
 *   · 缺帧（降级回退 JSON 通路）⇒ 本组件根本不渲染（由父层条件控制，绝不显示空壳）。
 */
const SynastryProgress: React.FC<{
  title?: string;
  label: string;
  pct: number;
  index?: number;
  total?: number;
}> = ({ title = '', label, pct, index = 0, total = 0 }) => {
  const safePct = Number.isFinite(pct) ? Math.max(0, Math.min(100, pct)) : 0;
  return (
    <div
      data-testid="synastry-progress"
      style={{
        marginTop: '10px',
        padding: '18px 16px',
        borderRadius: '14px',
        border: '1px solid rgba(212,175,55,0.35)',
        background: 'linear-gradient(135deg, rgba(212,175,55,0.10), rgba(20,16,30,0.55))',
        boxShadow: '0 0 22px rgba(212,175,55,0.10) inset',
        // 防线 ③：容器级断行兜底（泰/越长文案绝不撑破卡片）
        overflowWrap: 'anywhere',
        wordBreak: 'break-word',
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', minWidth: 0 }}>
        <span
          style={{
            width: 8, height: 8, borderRadius: '50%', flex: '0 0 auto',
            background: '#D4AF37', boxShadow: '0 0 8px #D4AF37',
            animation: 'ksPulse 1.2s ease-in-out infinite',
          }}
        />
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#D4AF37', letterSpacing: '0.5px', minWidth: 0 }}>
          {title || label}
        </span>
        {total > 0 && (
          <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'rgba(255,255,255,0.55)', flex: '0 0 auto' }}>
            {Math.min(index + 1, total)}/{total}
          </span>
        )}
      </div>

      {/* 进度轨 */}
      <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.10)', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%', width: `${safePct}%`, borderRadius: '2px',
            background: 'linear-gradient(90deg, #81D8D0, #D4AF37)',
            transition: 'width 600ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      </div>

      <div style={{ marginTop: '10px', display: 'flex', alignItems: 'baseline', gap: '8px', minWidth: 0 }}>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.82)', minWidth: 0 }}>{label}</span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#81D8D0', flex: '0 0 auto' }}>{safePct}%</span>
      </div>
    </div>
  );
};

export default SynastryProgress;
