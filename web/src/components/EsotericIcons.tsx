// ✦ E84（主公军令 2026-10-22）: Emoji 退役令——星相神秘学矢量图标真源。
// 规范出处：~/.workbuddy/skills/kindredsouls-celestial-ui/SKILL.md 第四章
//   · 全站图标一律 SVG 矢量（禁 💞💰🌍 等口语化 Emoji 冒充牌面/图标）
//   · 星芒微光滤镜 drop-shadow（令牌 --ks-icon-glow）
//   · 描边色取令牌 --ks-gold（#F5D08A）× --ks-nebula（#C084FC）
// 消费方：模式弹窗（App.tsx 两处 mode-icon）、后续黑金卡片图标位。

export function IconTwinStars({ size = 40 }: { size?: number }) {
  // 双星交汇星环：两颗四芒星＋交汇轨道弧（姻缘密码——两人星盘的引力连结）
  return (
    <svg
      className="ks-esoteric-icon"
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ks-grad-love" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0%" stopColor="#F5D08A" />
          <stop offset="100%" stopColor="#C084FC" />
        </linearGradient>
      </defs>
      {/* 交汇轨道弧：双星各自的轨道交叠成环 */}
      <circle cx="18" cy="30" r="13" stroke="url(#ks-grad-love)" strokeWidth="1.2" opacity="0.55" />
      <circle cx="30" cy="18" r="13" stroke="url(#ks-grad-love)" strokeWidth="1.2" opacity="0.55" />
      {/* 左下四芒星（你） */}
      <path
        d="M18 23 L20 28 L25 30 L20 32 L18 37 L16 32 L11 30 L16 28 Z"
        fill="url(#ks-grad-love)"
      />
      {/* 右上四芒星（TA，稍小形成主次） */}
      <path
        d="M30 12 L31.6 16.4 L36 18 L31.6 19.6 L30 24 L28.4 19.6 L24 18 L28.4 16.4 Z"
        fill="url(#ks-grad-love)"
        opacity="0.9"
      />
      {/* 交汇核心微光点 */}
      <circle cx="24" cy="24" r="1.6" fill="#F5D08A" />
    </svg>
  );
}

export function IconNatalVault({ size = 40 }: { size?: number }) {
  // 先天星盘金库：外圈黄道环＋内接三角（三宫财库）＋中心星点（财富密码——星盘即金库）
  return (
    <svg
      className="ks-esoteric-icon"
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ks-grad-vault" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0%" stopColor="#F5D08A" />
          <stop offset="100%" stopColor="#C084FC" />
        </linearGradient>
      </defs>
      {/* 黄道外环（刻度四分） */}
      <circle cx="24" cy="24" r="17" stroke="url(#ks-grad-vault)" strokeWidth="1.4" />
      <circle cx="24" cy="24" r="14.5" stroke="#F5D08A" strokeWidth="0.6" opacity="0.35" />
      <path d="M24 7 v4 M24 37 v4 M7 24 h4 M37 24 h4" stroke="#F5D08A" strokeWidth="1.2" />
      {/* 内接三角（财库三宫） */}
      <path
        d="M24 14 L33.5 30.5 L14.5 30.5 Z"
        stroke="url(#ks-grad-vault)"
        strokeWidth="1.4"
        fill="none"
      />
      {/* 中心金库星点 */}
      <path
        d="M24 23.2 L24.9 25.1 L26.8 26 L24.9 26.9 L24 28.8 L23.1 26.9 L21.2 26 L23.1 25.1 Z"
        fill="url(#ks-grad-vault)"
      />
    </svg>
  );
}

export function IconStarYou({ size = 20 }: { size?: number }) {
  // 你的星盘坐标（星卡头标）：四芒星＋轨道微环
  return (
    <svg
      className="ks-esoteric-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ks-grad-you" x1="0" y1="0" x2="24" y2="24">
          <stop offset="0%" stopColor="#F5D08A" />
          <stop offset="100%" stopColor="#C084FC" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10.4" stroke="url(#ks-grad-you)" strokeWidth="0.9" opacity="0.4" />
      <path
        d="M12 5.2 L13.5 10.5 L18.8 12 L13.5 13.5 L12 18.8 L10.5 13.5 L5.2 12 L10.5 10.5 Z"
        fill="url(#ks-grad-you)"
      />
    </svg>
  );
}

export function IconMoonTA({ size = 20 }: { size?: number }) {
  // TA 的星盘坐标（星卡头标）：新月抱星
  return (
    <svg
      className="ks-esoteric-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ks-grad-ta" x1="0" y1="0" x2="24" y2="24">
          <stop offset="0%" stopColor="#F5D08A" />
          <stop offset="100%" stopColor="#C084FC" />
        </linearGradient>
      </defs>
      <path
        d="M15.2 3.6 A9.6 9.6 0 1 0 15.2 20.4 A7.6 7.6 0 1 1 15.2 3.6 Z"
        stroke="url(#ks-grad-ta)"
        strokeWidth="1.2"
        fill="rgba(245,208,138,0.08)"
      />
      <path
        d="M15.6 9.4 L16.4 11.6 L18.6 12.4 L16.4 13.2 L15.6 15.4 L14.8 13.2 L12.6 12.4 L14.8 11.6 Z"
        fill="url(#ks-grad-ta)"
        opacity="0.9"
      />
    </svg>
  );
}
