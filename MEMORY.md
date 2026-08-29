# KindredSouls 项目永久记忆库（MEMORY.md）

> **用途**：每次开新 Session 或上下文丢失/缓存清理时，牛牛先读此文件恢复项目记忆。
> **恢复指令**：「牛牛，先读取 ~/Desktop/KindredSouls源代码/MEMORY.md 恢复项目记忆，然后继续。」

---

## 一、项目基线

- **产品**：KindredSouls AI 命理 SaaS —— 八字 / 占星 / 周易 / 塔罗 / 财富报告生成
- **主域名**：kindredsouls.online（生产 Railway：`kindredsouls-production.up.railway.app`）
- **技术栈**：
  - 前端：`web/`（React + Vite + TypeScript，入口 `web/src/App.tsx`）
  - API 层：`web/api/`（Vercel serverless functions）
  - 数据库/Auth：Supabase（`user_profiles` / auth）
  - 后端指挥中心：`~/kindredsouls-backend/main.py`（三引擎：DeepSeek / Gemini / OpenClaw）
  - 量化系统：`~/quant_workspace`（8818 悟空量化交易）
- **部署**：Railway（生产，webhook 间歇失效需手动 Redeploy）｜ Vercel（已废弃）｜ 本地 `dev-server.mjs`

## 二、业务真实定位

- 国内拼多多**跨境进口** storefronts，对接**吉客云 ERP**
- AI 命理报告：免费 teaser + 订阅完整版（月报 / 年报）

## 三、API 架构（关键）

- **当前生产路径**：前端 → `web/api/ai-advisor.js` → Supabase auth → DeepSeek / Gemini 生成报告
- **旧路径（未部署）**：`web/api/wealth-oracle.js`（有 bug，见第四节）
- 配置：`web/api/config.js`（`PROMPT_VERSION` 等）
- **多语言支持**：zh / en / es / fr / th / vi（**无 ja/ko/de**），占星术语映射在 `web/src/lib/algos/i18n.ts` 的 `ZODIAC_SIGNS`

## 四、已知 Bug 与踩坑（2026-08-25 摸排）

### wealth-oracle.js（旧 API）
> 修复均在副本 `wealth-oracle.localtest.mjs`，**未动原文件**
1. **语法错误 line 2396**：多余 `}` → Node ESM 加载即崩
2. **运行时错误 line 3238**：测试账号 return 用未定义裸变量 `bazi/zodiac/iching/tarot` → 应改 `individualData.bazi` 等
3. **设计缺陷 line 3218**：测试账号硬编码中文模板，丢弃 LLM 泰语输出（`insight`），返回"完整版需订阅"占位 → 测试账号永远看不到泰语月报

### 泰语财富月报本地测试（2026-08-25）
- 方法：Node 直接调 handler（绕 Railway 404），DeepSeek key 注入
- 结果：**HTTP 200，1416 字符泰语，无 U+FFFD 乱码**
- 八字占星泰语翻译正确（เสาวันเป็นโลหะหนู = 日柱金鼠）
- 修复副本后测试账号可返回真实泰语月报（用 `insight` 而非中文模板）

### 其他系统踩坑（详见 workspace MEMORY.md）
- 量化 8818：akshare `stock_zt_pool_em` 参数变更、streamlit 分支渲染、代理直连铁律
- 指挥中心：Gemini 地域锁 → DeepSeek 兜底；main.py 硬编码 Key 不读 .env

## 五、环境 Key 规范（脱敏，勿写明文）

| Key | 位置 | 状态 |
|-----|------|------|
| DEEPSEEK_API_KEY | backend main.py 硬编码（可用）/ web/.env.local（**值为空需填**） | backend ✅ / web ❌ |
| GEMINI_API_KEY | backend main.py 硬编码（地域锁，不通）/ web/.env.local | ⚠️ 地域锁 |
| SUPABASE_URL / SERVICE_KEY | web/.env.local | 需配置 |

## 六、本地测试战果（落盘文档）

- `wealth_oracle_local_test_2026-08-25.md`：泰语月报测试全过程 + bug 清单
- `wealth-oracle.localtest.mjs`：可运行副本（已修 3 bug）
- `test_wealth_local.mjs`：本地调用 handler 的测试脚本

## 七、恢复记忆指令

新 Session / 记忆模糊时，输入：
> 「牛牛，先读取 ~/Desktop/KindredSouls源代码/MEMORY.md 恢复项目记忆，然后我们继续。」
