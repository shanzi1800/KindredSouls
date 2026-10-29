/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 💠 E105（主公军令 2026-10-30 刀三）：流式承接骨架屏（SkeletonMountGuard）
 * ═══════════════════════════════════════════════════════════════════════════
 * 「模拟付款/真金付讫」→「多语言报告完整 Hydrate」之间的 200~400ms 窗口期，
 * 植入深空黑金微光骨架屏（Shimmer 动效）——彻底抹平布局抖动（CLS = 0）：
 *   · 固定 minHeight 高度预留（报告未挂载先占位，挂载后零位移）；
 *   · 微光横条自左向右扫掠（深空黑金渐变，与曜黑金属框同源令牌）。
 * ═══════════════════════════════════════════════════════════════════════════
 */

export default function SkeletonMountGuard() {
  return (
    <div
      className="ks-skeleton-guard"
      data-testid="skeleton-mount-guard"
      aria-hidden="true"
      style={{ minHeight: '328px', marginTop: '12px' }}
    >
      <div className="ks-shimmer-line ks-shimmer-w80" />
      <div className="ks-shimmer-line ks-shimmer-w60" />
      <div className="ks-shimmer-line ks-shimmer-w90" />
      <div className="ks-shimmer-line ks-shimmer-w75" />
      <div className="ks-shimmer-line ks-shimmer-w50" />
    </div>
  );
}
