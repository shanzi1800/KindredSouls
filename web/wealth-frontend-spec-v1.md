# KindredSouls 财富模块前端开发任务书
**版本: v1.0 | 日期: 2026-06-20 | 紧急度: 🔴 P0**

---

## 一、产品目标

为 KindredSouls 构建完整的「财富与事业终极解码」单人模块，实现从数据输入 → AI 推理 → 付费解锁 → 报告展示的全链路用户体验。

---

## 二、设计语言：「赛博微醺」

### 色彩系统
```
--bg-void:        #080810   /* 深空背景 */
--bg-card:         #0e0e1a   /* 卡片底色 */
--bg-card-inner:   #12121f   /* 内层深色 */
--gold-primary:    #D4AF37   /* 主金色 */
--gold-dim:        #8B7232   /* 暗金/次要 */
--gold-glow:       rgba(212, 175, 55, 0.15)  /* 金色光晕 */
--mint-accent:     #50C878   /* 薄荷绿点缀 */
--text-primary:    #E8E4D9   /* 主文字-暖白 */
--text-secondary:  #8B8778   /* 次要文字 */
--text-gold:       #D4AF37   /* 金色文字 */
--danger:          #E05C5C   /* 危险/红灯 */
--safe:            #5CB85C   /* 安全/绿灯 */
--border-gold:     rgba(212, 175, 55, 0.25) /* 边框金 */
```

### 字体
- 标题: `'Cinzel'` 或 `'Noto Serif SC'`（可用 Google Fonts）
- 正文: `'Inter'`, `'Noto Sans SC'`
- 数字/分数: `'DM Mono'` 或 `'JetBrains Mono'`

### 动效哲学
- 入场: 淡入 + 微微上浮，400ms ease-out，错开 80ms/张卡片
- 悬停: 金色边框流光动画（gradient sweep），transform: translateY(-4px)
- 3D 翻转: rotateY(180deg)，600ms cubic-bezier(0.4, 0, 0.2, 1)
- 加载: 金色粒子脉冲 / 旋转金环
- 禁止: 过度的弹跳、过多的颜色跳动

---

## 三、页面结构

### 3.1 单人财富主页 (`/wealth`)
**路径: `src/pages/WealthPage.tsx`**（或 `src/pages/wealth/index.tsx`）

```
┌─────────────────────────────────────────────┐
│  [Logo]    KindredSouls      [🌐Lang] [≡Menu] │  ← 顶部导航（复用全局）
├─────────────────────────────────────────────┤
│                                             │
│     💰 财富与事业解码                        │  ← 大标题
│     解锁你180天内的财富密码                  │  ← 副标题
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │  输入你的出生日期                      │  │
│  │  [____年____月____日]  [🔮 开始解码]  │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ─────── 或直接从合婚报告跳转 ───────       │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │  💡 你的财富运势和感情能量场是联动的  │  │
│  │  [→ 查看回合婚报告中的财富分析]        │  │
│  └───────────────────────────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
```

### 3.2 财富报告页 (`/wealth/report`)
**路径: `src/pages/WealthReportPage.tsx`**

**免费预览区（不付费可见）：**
```
┌─────────────────────────────────────────────┐
│  你的财富解码报告                          │
│  出生日期: 1990-09-09                      │
│                                             │
│  ┌─────────────┐  ┌─────────────────────┐  │
│  │  八字       │  │  星座               │  │
│  │  庚午 丙戌  │  │  处女座 ♍           │  │
│  │  丙寅       │  │  土象 · 变动宫      │  │
│  │             │  │  守护星: 水星       │  │
│  │  食伤生财格 │  │  职业分: 82/100     │  │
│  └─────────────┘  └─────────────────────┘  │
│                                             │
│  ┌─────────────┐  ┌─────────────────────┐  │
│  │  本命卦     │  │  今日商业塔罗        │  │
│  │  ☴☵ 风水涣 │  │  🌟 魔术师          │  │
│  │  → 乾为天  │  │  （正位）           │  │
│  └─────────────┘  └─────────────────────┘  │
│                                             │
│  ╔═══════════════════════════════════════╗  │
│  ║  🔒 AI 深度洞察（付费解锁）          ║  │
│  ║                                       ║  │
│  ║  [模糊预览条]                         ║  │
│  ║                                       ║  │
│  ║  $7.99 / 月  或  $79.99 / 年          ║  │
│  ║  [解锁完整报告 + 无限次生成]          ║  │
│  ╚═══════════════════════════════════════╝  │
└─────────────────────────────────────────────┘
```

**付费解锁后显示（replaces 付费墙）：**
```
┌─────────────────────────────────────────────┐
│  ┌─────────────────────────────────────┐   │
│  │ 🎯 核心搞钱定性                      │   │
│  │ 未来180天，你的财富状态是"烈火烹油，  │   │
│  │ 暗藏焦土"……                        │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │ ⚡ 职场与财务核心冲突                │   │
│  │ 你表面上是最精密的策划者，实则内在是  │   │
│  │ 丙火日主的暴烈赌徒……              │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │ 💡 行为量化避坑指南                  │   │
│  │ 🔴 停止跟进超3个项目                 │   │
│  │ 🟢 7天内完成资产清算                 │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │ 🌿 给搞钱灵魂的终极觉醒              │   │
│  │ 你是一把被烈火淬炼的刀……          │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [🔄 重新生成]  [📤 分享]  [💑 合婚报告] │
└─────────────────────────────────────────────┘
```

---

## 四、组件清单

### 4.1 WealthInputCard
出生日期输入 + 语言选择 + 解码按钮
- 状态: default / loading / error
- 加载态: 金色旋转环 + "正在召唤财富密码……"

### 4.2 WealthDataGrid
4格数据展示（八字 / 星盘 / 易经 / 塔罗）
- 悬停: 金色边框亮起 + 微微上浮
- 每格: 图标 + 标签 + 主数据 + 副数据
- 入场动画: 依次淡入上浮

### 4.3 WealthPaywall
付费墙组件（替代 AI 报告区的模糊提示）
- 设计: 深色半透明 + 金色描边 + 模糊背景
- 模糊层: 3行渐变模糊（blur + gradient mask）
- CTA: `$7.99/月` 绿色按钮 + `$79.99/年` 金色按钮
- 底部: "已有账户? 登录" 链接

### 4.4 WealthInsightCard
AI 报告内容渲染区（接受 HTML 字符串，直接 innerHTML）
- 接收 `insight: string` (HTML 格式)
- 样式化所有 h1/h2/p/strong 的排版
- 🔴 绿色灯: 额外渲染颜色（.red-light / .green-light class）
- 入场: 逐卡淡入（h1 → h2 → p 依次出现）

### 4.5 WealthScoreRing
3D 翻转卡片（综合分数）
- 正面: 数字分数 + 圆环进度
- 背面: 分数定性（一句话）
- 悬停: 微微倾斜3D效果
- 点击: 触发翻转

---

## 五、Stripe 集成

### 5.1 价格
- **月卡**: $7.99 USD/month
- **年卡**: $79.99 USD/year（约 $6.67/月，省33%）

### 5.2 集成方式
参考 `src/pages/SettingsPage.tsx` 或 `src/pages/subscription/index.tsx` 中已有的 Stripe Checkout 实现。

关键步骤：
1. 调用 `/api/create-checkout`（body: `{ priceId, successUrl, cancelUrl }`）
2. 跳转到 Stripe Checkout URL
3. Stripe webhook 确认支付后更新用户 `is_premium`
4. 前端轮询 `/api/me` 或检查 localStorage 标记解锁

### 5.3 复用现有逻辑
KindredSouls 已有订阅系统 (`/api/create-checkout`, `/api/webhook`)，**直接复用**：
- 不需要新建 Stripe 产品
- 在 `WealthPaywall` 中调用已有的 `createCheckout(priceId)` 函数

### 5.4 价格 ID（需在 Stripe Dashboard 创建）
```
price_wealth_monthly  = $7.99/month
price_wealth_yearly   = $79.99/year
```
> ⚠️ 如果尚未创建，先用 Stripe Dashboard 创建这两个产品，拿到 price ID 后更新代码中的常量。

---

## 六、API 集成

### 6.1 调用的 API
```
POST /api/wealth-oracle
Body: { birthDate: "1990-09-09", lang: "zh", referrer: "standalone" }
```

### 6.2 响应格式
```typescript
interface WealthOracleResponse {
  success: boolean;
  birthDate: string;
  lang: string;
  data: {
    bazi: BaZiData;         // 八字数据
    zodiac: ZodiacData;     // 星盘数据
    iching: IChingData;     // 易经数据
    tarot: TarotData;       // 塔罗数据
  };
  insight: string;          // HTML 字符串（AI 报告）
  referrer: string;
}
```

### 6.3 错误处理
- 网络错误: 显示 "网络开小差，请重试" + 重试按钮
- API 500: 显示 "服务器打了个盹，5秒后自动重试..."
- 超时 (>15s): 中断 + 提示

---

## 七、路由配置

```
src/pages/
├── wealth/
│   └── index.tsx        ← /wealth （输入页）
├── wealth-report/
│   └── index.tsx        ← /wealth/report （报告页）
```

路由守卫：
- 访问 `/wealth/report` 时若无 URL 参数（`?birth=YYYY-MM-DD`），重定向至 `/wealth`
- 推荐使用 React Router v6 或 Next.js 页面路由

---

## 八、状态管理

```typescript
interface WealthState {
  // 输入
  birthDate: string;          // "YYYY-MM-DD"
  lang: string;               // "zh" | "en" | "es" | "fr" | "th" | "vi"
  // 数据
  loading: boolean;
  error: string | null;
  // 报告
  reportData: WealthOracleResponse | null;
  isUnlocked: boolean;        // 已付费
  // UI
  showPaywall: boolean;       // 显示付费墙
}
```

推荐使用 React Context (`WealthContext`) 或 Zustand store。

---

## 九、国际化

所有 UI 文本使用 i18n key，支持 6 语言：
```typescript
const i18n = {
  zh: {
    title: '财富与事业解码',
    subtitle: '解锁你180天内的财富密码',
    input_placeholder: '选择你的出生日期',
    cta: '🔮 开始解码',
    loading: '正在召唤财富密码……',
    paywall_title: '🔒 AI 深度洞察',
    price_monthly: '$7.99 / 月',
    price_yearly: '$79.99 / 年',
    unlock_cta: '解锁完整报告',
  },
  en: { /* ... */ },
  // es / fr / th / vi 同理
};
```

---

## 十、实现优先级

### P0（必须，MVP）
1. `WealthInputCard` — 日期输入 + 提交
2. `WealthDataGrid` — 4格数据展示
3. `/api/wealth-oracle` 调用
4. `WealthPaywall` — Stripe 付费墙（复用现有订阅逻辑）
5. `WealthInsightCard` — HTML 报告渲染

### P1（体验增强）
6. `WealthScoreRing` — 3D 翻转分数卡
7. 入场动画（错开淡入）
8. 暗黑金色边框流光动效

### P2（增长）
9. 分享功能（生成分享图片/链接）
10. 重新生成按钮（消耗1次credits）
11. Meta Pixel / TikTok Pixel 追踪

---

## 十一、技术约束

- **框架**: 保持与现有代码库一致（React + Vite）
- **样式**: CSS Modules 或 Styled Components（避免全局污染）
- **Stripe**: 复用 `src/lib/stripe.ts` 已有逻辑
- **类型**: 严格 TypeScript，禁止 `any` 逃逸
- **无新增 major 依赖**

---

## 十二、验收标准

1. 输入 1990-09-09 → 显示4格数据 + "正在解码"加载 + AI报告
2. 未付费用户看到付费墙（模糊预览 + CTA）
3. 已付费用户直接看到完整 AI 报告（HTML 正确渲染）
4. 移动端（375px）布局不崩溃
5. Stripe 结账流程完整走通（测试模式）
6. 页面加载 LCP < 2.5s（Vercel edge）

---

## 十三、参考文件

- `src/pages/SettingsPage.tsx` — Stripe 订阅已有实现
- `src/lib/stripe.ts` — Stripe SDK 封装
- `src/lib/algos/index.ts` — 八字/星盘数据接口
- `web/api/wealth-oracle.js` — 后端 API（已就绪）
- 品牌色变量: `--kindred-gold: #D4AF37; --kindred-bg: #0D0D1A;`
