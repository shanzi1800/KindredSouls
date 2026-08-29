# 财富月报本地测试（泰语）· 2026-08-25

## 目标
不依赖已报废的 Railway 生产环境（404 "Application not found"），在本地用 Node 直接调 `web/api/wealth-oracle.js` 的 handler，验证**泰语财富月报**生成质量。

## 测试方法
- 复制 `wealth-oracle.js` → `wealth-oracle.localtest.mjs`（避免改原文件）
- 写 `test_wealth_local.mjs`：构造 mock `req/res`，直接 `await handler(req, res)`，用测试账号白名单 `test_mode_*` 绕过 Supabase auth
- DeepSeek key 从 `kindredsouls-backend/main.py` 抓真实可用 key（`sk-0fa35ae88d2b4ae5aa1e922020d5ad1b`，backend 三引擎验证过），shell `export` 注入（`.env.local` 的 `DEEPSEEK_API_KEY` 值为空，长度仅 2）

## 发现的真实 Bug（在财富-oracle.js 本体，非测试脚本）
1. **语法错误 line 2396**：多余 `}`，Node ESM 加载即崩溃（原文件根本跑不起来）
2. **运行时错误 line 3238**：测试账号 return 段用裸变量 `bazi/zodiac/iching/tarot`（handler 作用域内未定义），应改 `individualData.bazi` 等
3. **设计缺陷 line 3218**：测试账号分支**硬编码中文模板**，调了 LLM（line 3152 `insight = await callAI(...)`）却丢弃 `insight`，返回固定中文占位（"完整版需订阅月报服务"），所以测试账号永远看不到泰语月报

## 副本修复（localtest.mjs，未动原文件）
- 修 line 2396 语法（删多余 `}`）
- line 3238 `data: { bazi, zodiac, iching, tarot }` → `data: { bazi: individualData.bazi, ... }`
- line 3236 `report: reportContent`（中文模板）→ `report: insight`（LLM 泰语输出）
- 测试脚本 `reportType: 'oracle'` → `'monthly'`（测月报）

## 验证结果
```
HTTP 200 | 耗时 9.5s
返回字段: success, birthDate, lang, report, insight, data, message
月报长度: 1416 字符 | U+FFFD 乱码: 无 ✅
```

月报节选（泰语，八字体系占星翻译正确）：
- คำวินิจฉัยโชคลาภหลัก（主要财富诊断）
- เสาวันเป็นโลหะหนู（日柱=金鼠）/ เสาเดือนเป็นน้ำแพะ（月柱=水羊）—— 八字地支泰语化无误
- แผนปฏิบัติเชิงปริมาณ 30 วัน（30天量化行动计划）

## 质量评估（可机器核查维度）
- ✅ 无 U+FFFD 乱码
- ✅ 泰语流畅自然（非机翻腔），占星术语翻译正确
- ✅ 结构完整：诊断 → 冲突分析 → 行动计划 → 灵性觉醒
- ⚠️ 无 ราศี（西方星座词）—— 财富月报用八字体系，正常
- ⚠️ 月份锚点不明显（中文模板有"7月"，泰语 LLM 版未强调具体月）

## 关键结论
1. **旧 wealth-oracle API 本地生成链路可跑通**，泰语月报质量 OK（流畅、无乱码、占星正确）
2. 但该文件有 3 个 bug（语法/运行时/设计），**原文件从未在生产成功运行过**（符合 MEMORY 记录的"AI 实际调用走 ai-advisor.js，wealth-oracle 是旧路径"）
3. 当前生产前端调用的是 `ai-advisor.js`（强依赖 Supabase auth），本地测需绕过 auth
4. 修复仅在副本，原文件待主公批准是否修

## 下一步选项
- A) 评估月报具体质量维度（地道度/占星准确性/多语言一致性）
- B) 转向测 ai-advisor.js（当前生产路径，需绕 Supabase auth）
- C) 提 PR 修 wealth-oracle.js 的 3 个 bug（需主公批准改原文件）
