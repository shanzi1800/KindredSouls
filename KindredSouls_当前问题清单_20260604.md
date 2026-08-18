# KindredSouls 当前问题清单

**日期**：2026-06-04
**网站**：www.kindredsouls.com.au
**技术栈**：React + Vite + Supabase Auth + Stripe + Vercel Serverless

---

## 🔴 P0 - 核心流程不通

### 1. 点击 $4.99 付费按钮无反应

**现象**：用户在结果页点击 $4.99 按钮，没有任何跳转或反馈。

**Console 日志**：
```
[KindredSouls Debug] getSession result: true null
POST https://www.kindredsouls.com.au/api/save-result 401 (Unauthorized)
[KindredSouls Debug] onAuthStateChange: INITIAL_SESSION true
```

**分析**：
- `getSession()` 返回 session 对象存在（`true`），但 `access_token` 为 `null`
- `onAuthStateChange` 先触发 `INITIAL_SESSION`，后触发 `SIGNED_IN`
- 在 `INITIAL_SESSION` 阶段 token 还没 ready，导致 `/api/save-result` 返回 401
- 401 可能阻断了后续的付费流程（handlePurchase 依赖有效 session）

**当前代码逻辑**：
```typescript
// App.tsx - 三层门禁
// 1. 未登录 → 显示 AuthWallCard（Google登录）
// 2. 已登录未付费 → 显示 PaywallCard（$4.99按钮）
// 3. 已付费 → 显示 AI Insight

// handlePurchase 函数：
const handlePurchase = async (plan: string) => {
  const { data } = await supabase.auth.refreshSession();
  const token = data.session?.access_token;
  if (!token) { setShowAuthWall(true); return; }  // ← 可能在这里被拦截
  
  const res = await fetch('/api/create-checkout', {
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ plan, ... })
  });
  // 拿到 Stripe Checkout URL 后跳转
};
```

**可能根因**：
- Supabase Auth 初始化时序问题：`getSession()` 在 `INITIAL_SESSION` 阶段返回 token=null，`SIGNED_IN` 阶段才有 token
- `handlePurchase` 被 `refreshSession()` 后仍拿不到 token，直接 return 显示登录墙
- 或 `create-checkout` API 端也有 401 问题

---

### 2. /api/save-result 返回 401（已修复代码，待验证）

**现象**：已登录用户计算结果后，自动保存到 Supabase 的请求返回 401。

**根因**：前端调用 `/api/save-result` 时没有传 `Authorization` header。

**已做修复**：
- 将 save-result 调用从独立 `useEffect` 移到 `onAuthStateChange` 回调内
- 在 `SIGNED_IN` 和 `INITIAL_SESSION` 分支都加上 save-result 调用，带 `Authorization: Bearer ${session.access_token}`
- 但 `INITIAL_SESSION` 阶段 token 可能为 null，需要确认是否应该在 `INITIAL_SESSION` 里也发送

**待验证**：部署后是否还有 401

---

## 🟡 P1 - 需要修复但不阻塞核心流程

### 3. Vercel CDN 缓存严重

**现象**：多次 `git push` 后，`curl` 返回的仍是旧 JS 文件名（`index-Bn40gfrt.js`），浏览器硬刷新也偶尔拿到旧版本。

**已尝试**：
- 空 commit + push 触发重建
- `cache-control: no-cache` header
- 浏览器 Cmd+Shift+R

**影响**：难以确认新代码是否生效，调试效率极低。

---

### 4. Supabase Auth 时序竞争

**现象**：`getSession()` 和 `onAuthStateChange` 事件之间存在时序竞争。

**具体表现**：
```
getSession result: true null          ← session 有 user 但 token 为 null
onAuthStateChange: INITIAL_SESSION true  ← 先触发 INITIAL_SESSION
onAuthStateChange: SIGNED_IN true       ← 后触发 SIGNED_IN（token 此时才 ready）
```

**影响**：任何依赖 token 的操作（save-result、create-checkout、checkPaidStatus）在 `INITIAL_SESSION` 阶段都会失败。

**问题**：当前代码在 `INITIAL_SESSION` 分支里也调用了 `checkPaidStatus(session.access_token)`，如果 token 为 null，这个调用也会失败。

---

### 5. Stripe Webhook 未配置

**现象**：`STRIPE_WEBHOOK_SECRET` 未配置到 Vercel 环境变量。

**影响**：用户支付成功后，`user_profiles.paid` 不会自动更新为 `true`，需要手动更新数据库。

**配置方式**：需在 Stripe Dashboard 创建 Webhook Endpoint → 指向 `https://www.kindredsouls.com.au/api/webhook` → 拿到 signing secret → 添加到 Vercel 环境变量。

---

### 6. Vercel 环境变量 SUPABASE_SERVICE_KEY 可能误配

**现象**：此前曾发现 Production 环境的 `SUPABASE_SERVICE_KEY` 被误配为 anon key。

**当前状态**：已要求替换为 service_role key，但未确认是否已生效。

**验证方式**：
```bash
curl https://www.kindredsouls.com.au/api/health
# 返回 supabase: true 说明连接正常
```

---

## 🔵 P2 - 后续优化

### 7. 移动端适配
- 当前 UI 在手机浏览器上布局有问题（未专门测试）

### 8. Apple Login
- 需要 Apple Developer 账号（$99/年），还需 D-U-N-S 编号

### 9. 前端 console.log 清理
- 上线前需清除 `[KindredSouls Debug]` 日志

---

## 关键代码文件

| 文件 | 作用 |
|------|------|
| `web/src/App.tsx` | 主入口：三层门禁、handlePurchase、onAuthStateChange |
| `web/src/components/AuthButton.tsx` | Google OAuth 登录组件 |
| `web/src/components/PaywallCard.tsx` | 付费墙 UI |
| `web/api/create-checkout.js` | Stripe Checkout Session 创建 |
| `web/api/webhook.js` | Stripe 支付回调 |
| `web/api/save-result.js` | 保存合盘结果到 Supabase |
| `web/api/health.js` | 健康检查 |

## 关键凭证

| 名称 | 值 |
|------|-----|
| Supabase URL | https://wfkxqhlcgrikxoofjvas.supabase.co |
| Google OAuth Client ID | 792434667633-1ln30hm93gj1qfti2583kr3a0cuuc5l6.apps.googleusercontent.com |
| Stripe 公钥 | pk_test_51TdfvQRnHNva8hysrxM8PyP8Uf18W5BZGTy62Q1tiQLBtotVBLGVkBq8YFvoeScZKS9V0rGiGSjzT5DKRbiPflKW00pQAUdpLJ |
| Vercel 项目 | KindredSouls (Root Directory: web/) |

---

## 最紧急的问题

**如果只能解决一个，先解决 #1**：点击 $4.99 按钮无反应。

核心怀疑：`handlePurchase` 里的 `refreshSession()` 返回 token=null，导致直接 return 走到登录墙，而不是去调 Stripe Checkout。

**建议排查方向**：
1. 在 `handlePurchase` 开头加 console.log 看 token 到底有没有
2. 把 `refreshSession()` 改成 `getSession()` + 等待 `SIGNED_IN` 事件
3. 或者绕过 Supabase token 验证，create-checkout API 改用其他方式验证用户身份
