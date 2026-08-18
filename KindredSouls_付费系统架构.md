# KindredSouls 付费系统架构

> 最后更新：2026-06-24 | 作者：牛牛
> 覆盖：Stripe 产品创建 → Webhook 回执 → 数据库持久化 → 前端/后端访问校验

---

## 一、Stripe 产品与定价（8 个产品）

| 计划 key | 价格 | 类型 | 覆盖内容 |
|---------|------|------|---------|
| `compatibility_once` | $4.99 | 一次性 | 合婚 AI 洞察 × 1 次 |
| `wealth_once` | $4.99 | 一次性 | 财富 AI 洞察 × 1 次 |
| `compatibility_monthly_report` | $2.99 | 月报 | 关系月报（预留） |
| `wealth_monthly_report` | $2.99 | 月报 | 财运月报（预留） |
| `compatibility_yearly_report` | $14.99 | 年报 | 关系年度预测（预留） |
| `wealth_yearly_report` | $14.99 | 年报 | 财富年度预测（预留） |
| `star_monthly_vip` | $9.99/月 | 订阅 | 5 次财富 + 1 次合婚 / 月 |
| `all_pass_yearly` | $99.99/年 | 年卡 | 全部无限次，整年有效 |

**定价来源：** `create-checkout.js` 的 `PRICES` 和 `PRICE_IDS` 映射（已静态编码 Stripe Price ID，2026-06-22 创建）

---

## 二、付费流程全链路

### 2.1 用户触发付费

```
用户点击付费墙按钮
  ↓
handlePurchase(plan) 在 AIInsightBlock / WealthReportPage
  ├─ 有 session → create-checkout Stripe Checkout Session
  │   ├─ 已有该计划覆盖（checkCoverageInline）→ 跳过 Stripe，直接解锁
  │   └─ 未覆盖 → 跳转到 Stripe Checkout 页面
  └─ 无 session → signInWithOAuth(Google)
      ├─ Google OAuth 重定向 → 返回 ?code=xxx&intent=checkout&plan=xxx
      ├─ PKCE 流程 exchange code → session
      └─ Active Defense useEffect 检测到 intent=checkout
          ├─ checkCoverageInline → 已覆盖 → 跳过 Stripe
          └─ 未覆盖 → handlePurchaseWithToken → Stripe
```

### 2.2 Stripe 支付回调

```
Stripe Checkout 完成
  ↓
Stripe Webhook POST → /api/webhook.js
  ├─ 签名验证（STRIPE_WEBHOOK_SECRET 加 HMAC_SHA256）
  ├─ 解析 session.metadata 获取 user_id + plan
  ├─ 读取当前 user_profiles.paid_plans（增量合并，不覆盖已有计划）
  └─ UPSERT → user_profiles 表
      └─ paid_plans 更新（详见第 2.3 节）
  ↓
用户从 Stripe 跳回
  ├─ URL 参数 auto-clean
  └─ 下次 INITIAL_SESSION 触发 → checkPaidStatus → 检测到已付费 → 解锁
```

### 2.3 `paid_plans` JSONB 存储格式

```jsonc
// 一次性产品（标志位）
{"compatibility_once": true}
{"wealth_once": true}

// 订阅产品（对象格式，含配额和过期时间）
{
  "star_monthly_vip": true,
  "star_monthly_wealth_allowance": 5,
  "star_monthly_wealth_used": 0,
  "star_monthly_compatibility_allowance": 1,
  "star_monthly_compatibility_used": 0,
  "star_monthly_resets_at": "2026-07-01T00:00:00.000Z"
}

// 年卡（包含全部配额）
{
  "all_pass_yearly": true,
  "all_pass_expires_at": "2027-06-24T00:00:00.000Z",
  "star_monthly_wealth_allowance": 5,
  "star_monthly_wealth_used": 0,
  "star_monthly_compatibility_allowance": 1,
  "star_monthly_compatibility_used": 0,
  "star_monthly_resets_at": "2026-07-01T00:00:00.000Z"
}
```

### 2.4 配额消耗（后台自动扣减）

当 `star_monthly_vip` 或 `all_pass_yearly` 用户请求 AI 洞察时，后端在返回内容前自动扣减配额：

```javascript
// ai-advisor.js / wealth-oracle.js 中的 after-AI 代码
const updatedPlans = {
  ...paidPlans,
  star_monthly_compatibility_used: (currentUsed) + 1,  // 合婚
  star_monthly_wealth_used: (currentUsed) + 1,          // 财富
};
// PATCH 回 user_profiles
```

**配额熔断条件：**
- `used >= allowance` → 返回 402 + `PAYMENT_REQUIRED`
- 月配额每月 1 日 UTC 重置（由 `webhook.js` 的 `computeNextMonthStartUTC()` 计算）

---

## 三、访问校验（三层）

### 3.1 前端兜底校验（checkCoverageInline）

**位置：** `AIInsightBlock`（App.tsx）

**触发时机：** OAuth 回调后、跳转 Stripe 之前

**逻辑：**
1. 用 access token 调用 `/auth/v1/user` 获取 userId
2. 用 anon key 查询 `user_profiles.paid_plans`
3. 转为统一 planMap 格式
4. 检查目标 plan 是否已被已购计划覆盖（含 `all_pass_yearly` 的过期校验、`star_monthly_vip` 的配额校验）
5. 已覆盖 → 跳过 Stripe，直接 `setPaidStatus(true)`

### 3.2 前端正式校验（checkPaidStatus）

**位置：** `AIInsightBlock`（App.tsx）+ `WealthReportPage`（WealthReportPage.tsx）

**触发时机：** `INITIAL_SESSION` 事件、页面手动触发

**校验顺序（优先级递减）：**
1. `compatibility_once` / `wealth_once` === true → 通过
2. `compatibility_yearly_report` / `wealth_yearly_report` === true → 通过
3. `all_pass_yearly === true` + 未过期 → 通过
4. `star_monthly_vip === true`（对象/布尔双格式兼容）+ 配额未耗尽 + 未过期 → 通过
5. 以上都不满足 → `paidStatus=false`，弹付费墙

### 3.3 后端服务端校验（强制 402 熔断）

**位置：** `ai-advisor.js` / `wealth-oracle.js`

**校验顺序（同 3.2）：**
1. 直接 key 值 true（compatibility_once / wealth_once）
2. 旧版月度订阅（legacy monthly）
3. all_pass_yearly 未过期
4. **star_monthly_vip** + 兼容性配额未耗尽
5. 老版 wealth_monthly 兼容性配额

**熔断返回：** `res.status(402).json({ error: "Payment required", code: "PAYMENT_REQUIRED" })`

### 3.4 Stripe Checkout 前的二次校验（create-checkout.js）

**位置：** `create-checkout.js` 的 `hasAccessToPlan()`

**校验范围：**
- 直接 key true
- `all_pass_yearly` 未过期（覆盖全部子计划）
- `star_monthly_vip` 覆盖 `compatibility_once` 和 `wealth_once`
- 已覆盖 → 返回 `{"alreadyPaid": true}` 禁止重复支付

---

## 四、数据库与表结构

**表：** `user_profiles`

| 列 | 类型 | 说明 |
|----|------|------|
| `user_id` | UUID | PK，Supabase Auth 用户 ID |
| `paid` | boolean | 是否曾付费（遗留） |
| `paid_plans` | JSONB | 付费计划数据（核心） |
| `stripe_customer_id` | text | Stripe Customer ID |
| `subscription_id` | text | Stripe Subscription ID |
| `email` | text | 用户邮箱 |
| `created_at` | timestamptz | 行创建时间 |
| `updated_at` | timestamptz | 最后更新时间 |

**约束：** `user_id` 有 UNIQUE 约束（防止重复行）

**写入方式：** webhook 用 POST + `Prefer: resolution=merge-duplicates` 做 upsert

---

## 五、新旧版兼容矩阵

| 旧计划名 | 状态 | 映射目标 |
|---------|------|---------|
| `insight_once` | ❌ 已废弃 | 无（代码中仍兼容检查 === true） |
| `monthly` | ❌ 已废弃 | 无（代码中仍兼容检查 === true） |
| `wealth_montly`（原 typo） | ✅ 迁移 | `wealth_monthly_report` |
| `wealth_yearly` | ❌ 已废弃 | 无 |
| `wealth_monthly`（原格式） | ✅ 兼容 | 检查 `wealth_monthly === true` |

所有前端 `checkPaidStatus` 均兼容 **数组格式** 和 **对象格式** 两种 `paid_plans` 存储形态。

---

## 六、复购与续费逻辑

| 场景 | 行为 |
|------|------|
| 已有 `compatibility_once` → 再买 `compatibility_once` | 前端 checkCoverageInline 拦截，不跳 Stripe |
| 已有 `star_monthly_vip` → 再买 `star_monthly_vip` | Stripe 创建新 Subscription（Stripe 端去重），webhook 写入时合并新配额（配额不覆盖旧值） |
| `all_pass_yearly` 过期后 | 重新购买走正常流程 |
| 已买 `star_monthly_vip` → 再买 `wealth_once` | checkCoverageInline 检测 `star_monthly_vip` 未覆盖单次 `wealth_once` 的配额？实际 star_monthly_vip 覆盖 wealth_once | 
| 美元定价 | 所有价格硬编码 USD，Stripe 自动转换当地货币 |
| 全额退款 | 未实现自动化，需手动操作 Stripe Dashboard + SQL 删除 paid_plans |

---

## 七、关键文件索引

| 文件 | 职责 |
|------|------|
| `web/api/create-checkout.js` | 创建 Stripe Checkout Session + 支付前二次校验 |
| `web/api/webhook.js` | Stripe 支付成功回执 → 写入/合并 paid_plans |
| `web/api/ai-advisor.js` | 合婚 AI 洞察：访问校验 + 配额扣减 + AI 调用 |
| `web/api/wealth-oracle.js` | 财富 AI 洞察：访问校验 + 配额扣减 + AI 调用 |
| `web/src/App.tsx` → `AIInsightBlock` | 合婚页前端付费墙 + checkPaidStatus + checkCoverageInline |
| `web/src/pages/WealthReportPage.tsx` | 财富页前端付费墙 + checkPaidStatus |
| `web/src/components/PaywallCard.tsx` | 付费墙 UI（多语言 $4.99 + $4.99 按钮） |
| `web/src/lib/supabase.ts` | Supabase 客户端（PKCE + persistSession） |
| `SECRETS.md` | 本地密钥文件（不提交 git） |

---

## 八、已知风险与待办

- [ ] **全额退款自动化**：目前需手动操作 Stripe Dashboard + SQL 删除 paid_plans
- [ ] **配额耗尽 UX**：star_monthly_vip 配额用完时后端 402，前端弹出"配额已用完，升级或下月再试"提示（目前代码中后端 402 + 前端 signOut 的逻辑已去除，但需补充友好提示）
- [ ] **Stripe 产品定价膨胀**：8 个产品中 4 个是预留未上线（monthly_report / yearly_report），可考虑暂时下架减少混淆
- [ ] **Gemini fallback 测试**：DeepSeek 余额烧完后 Gemini 免费层是否正常工作需验证
- [ ] **并发扣减竞态**：高并发下两个同时请求可能都检查 `used < allowance` 通过然后都扣减，导致扣超。可加行级锁或原子操作
