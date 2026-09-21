# 🛍️ 爆款 / 物理法器（Actionable Artefact）路由与 JSON 节点预留规范

> 状态：**已落地（V463）** · 阶段：**封仓期（仅预留，不占 UI 工期）**
> 依据：军师《KindredSouls 爆款入口预留指令书》2026-09-21（优先级 Low）
> 原则：**预留不破坏专业报告信仰感**。当前阶段对用户完全不可见（零 UI 污染）。

---

## 一、后端：输出 JSON 预留节点

### 1.1 单一真源（唯一允许的定义处）

`server.js`：

```js
const ACTIONABLE_ARTEFACT_RESERVED = Object.freeze({
  has_recommended_item: false,   // 封仓期固定 false
  item_sku: null,                // 上线期：爆款 SKU ID，例 'crystal_cat_amber_01'
  trigger_reason: null,          // 上线期：硬损耗触发理由（对用户可读）
  cta_text: null,                // 上线期：卡片 CTA 文案
  target_url: null,              // 上线期：动态跳转路由
});
function buildActionableArtefact(overrides) {
  return Object.assign({}, ACTIONABLE_ARTEFACT_RESERVED, overrides || {});
}
```

**铁律**：任何链路都必须调用 `buildActionableArtefact()`，**严禁手写第二份字面量**（防字段漂移）。

### 1.2 三条报告链路挂载点

| 报告类型 | 接口 | 挂载位置 |
|---|---|---|
| 财富月报 / 年报（流式） | `POST /api/wealth-oracle/stream` | 首帧 `data: {"meta":{...}}` 内 → `meta.actionable_artefact` |
| 先天财富 / 非流式（含缓存 HIT） | `POST /api/wealth-oracle` | 响应体顶层 → `actionable_artefact`（与 `success`/`data`/`report` 平级） |
| 年报 V2 通道 | `POST /api/wealth-oracle/v2` | 首帧 `data: {"meta":{"actionable_artefact":{...}}}` |

响应样例（封仓期）：

```json
{
  "success": true,
  "data": { "...": "八字/星座/易经/塔罗" },
  "actionable_artefact": {
    "has_recommended_item": false,
    "item_sku": null,
    "trigger_reason": null,
    "cta_text": null,
    "target_url": null
  },
  "report": "..."
}
```

### 1.3 后端处理逻辑

- **封仓期**：`has_recommended_item=false` → 前端解析到 `false` 直接忽略该节点，页面无任何多余 UI。
- **上线期**：算法按星盘硬损耗（如盘中金星/土星硬相位、破损宫位）置 `true` 并下发 `item_sku` / `trigger_reason` / `cta_text` / `target_url`，前端自动在报告末尾渲染「专属法器卡片」并跳转购买。
- **不阻断**：该节点构造失败/缺省绝不影响报告主流程（节点为纯数据、无副作用）。

### 1.4 ⚠️ 刻意不做的两件事（重要）

1. **未把节点名注入 LLM prompt**（`MONTHLY_SYSTEM` / `FORMAT_FIREWALL` / `STRICT_GROUNDING` / `_segPrompt`）。
   理由：这些 prompt 直接生成**用户可见正文**，注入 JSON schema 极易被模型照抄进报告正文（V462 刚从"脏文本回流"战役中脱身）。
   Schema 由**代码层** meta 提供，语义等价、零泄漏风险。
   CI 已加断言：节点名不得出现在任何 prompt 文本块。
2. **未开发实际商城 View**：本阶段仅预留路由与兜底。

---

## 二、前端：路由预留

约定路径（二选一，已同时支持）：

- `/artefact/:sku_id`
- `/shop/item/:sku_id`

**兜底行为**（`web/src/App.tsx`）：

1. `window.history.replaceState({}, '', '/')` → 回主站；
2. 清空 `wealthPath`（**关键**：未知路径原逻辑会被当成财富模块路径 → **白屏**）；
3. 展示极简 Toast「能量载体孕育中」（6 语种），4.2s 自动消失；
4. 不报错、不跳 404、不渲染任何商城 UI。

未来商城上线时，只需把该兜底替换为真实 `ArtefactPage` 即可，路由协议不变。

---

## 三、CI 回归门

`test/audit-v463-artefact-reserved.test.js`（6 项）：

| # | 断言 |
|---|---|
| ① | 默认值契约：`false` + 四字段 `null`，键名与指令书逐字一致 |
| ② | 上线期覆写能力；`Object.freeze` + 返回副本（常量不被污染） |
| ③ | 三条报告链路全部挂载；构造器定义唯一（无手写第二份） |
| ④ | **节点名不得出现在任何 prompt 文本块**（防正文污染） |
| ⑤ | 前端路由正则覆盖 `/artefact/:sku_id` 与 `/shop/item/:sku_id` |
| ⑥ | 兜底三件套齐全：`replaceState` + 清 `wealthPath` + 孕育中文案 |

---

## 四、验收记录

- CI：289/289 全绿（52 suites）。
- 生产实测（部署 `cbddf579`）：
  - 流式首帧 meta 含 `actionable_artefact`（`has_recommended_item:false`）✅
  - 非流式响应顶层含 `actionable_artefact` ✅
  - `/artefact/crystal_cat_amber_01` → URL 兜底回 `/`、落地页正常渲染（非白屏）、Toast 正常 ✅
  - `/shop/item/crystal_cat_amber_01` → 同上 ✅
