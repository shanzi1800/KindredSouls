# 12 星座 × 多语言压测报告（2026-08-25）

## 测试环境
- 生产 URL `https://kindredsouls-production.up.railway.app/monthly-report?...` → **HTTP 404 不可达**（Railway 报废）
- 改用本地副本 `web/api/wealth-oracle.localtest.mjs` + `test_wealth_pressure.mjs`
- 改造：副本 `isTestAccount` 增加 `body.free_access === 1` 触发测试账号（绕过 Supabase auth）
- 模型：DeepSeek（DEEPSEEK_API_KEY 从 backend main.py 取真实 key）
- 端点：POST handler（非 GET，用户给的 GET URL 格式仅作参数参考）

## 12 条结果

| # | 标的 | 实际 sunSign | 语言 | HTTP | 乱码 | 判定 |
|---|------|------|------|------|------|------|
| 1 | 白羊/Aries | 白羊座 | zh | 200 | ✅ | ✅ |
| 2 | 金牛/Taurus | Taurus | en | 200 | ✅ | ✅ |
| 3 | 双子/Gemini | Gémeaux | fr | 200 | ✅ | ✅ |
| 4 | 巨蟹/Cancer | **Géminis（双子）** | es | 200 | ✅ | ❌ **边界bug** |
| 5 | 狮子/Leo | สิงห์ | th | 200 | ✅ | ✅ |
| 6 | 处女/Virgo | Xử Nữ | vi | 200 | ✅ | ✅ |
| 7 | 天秤/Libra | 天秤座 | zh | 200 | ✅ | ✅ |
| 8 | 天蝎/Scorpio | Scorpio | en | 200 | ✅ | ✅ |
| 9 | 射手/Sagittarius | Sagittaire | fr | 200 | ✅ | ✅ |
| 10 | 摩羯/Capricorn | Capricornio | es | 200 | ✅ | ✅ |
| 11 | 水瓶/Aquarius* | มีน（**双鱼**） | th | 200 | ✅ | ⚠️ 陷阱揭穿 |
| 12 | 双鱼/Pisces | Song Ngư | vi | 200 | ✅ | ✅ |

**汇总：HTTP200=12/12 | 乱码=0 | 语言不匹配=0**

## 关键发现

### 1. #4 真实 bug：太阳星座交界日偏差
- 标的：巨蟹座（birthDate=1992-06-21，夏至临界点）
- 实际返回：**Géminis（双子座）**
- 根因：系统太阳星座表边界定义偏差（大概率用 6/22 起巨蟹，而非 6/21）
- 用户特意标"夏至临界点"正是测此边界 → bug 暴露
- 需确认：产品定义 6/21 是否应为巨蟹（标准西方占星 6/21 夏至=巨蟹第一天）

### 2. #11 陷阱揭穿：用户数据标错，系统正确
- 标的：水瓶/Aquarius（birthDate=2004-02-29）
- 实际返回：**มีน（双鱼座，泰语）**
- 真相：2/19 起是双鱼座，2/29 必为双鱼。用户标"水瓶"是错误标注
- 系统计算正确，闰年 2/29 日期解析器未崩 ✅

### 3. 语言映射全对
6 语言太阳星座名正确翻译：zh(白羊座) / en(Taurus) / fr(Gémeaux) / es(Capricornio) / th(สิงห์) / vi(Song Ngư)

## 限制（重要）
handler 硬编码 `birthInfo = { year, month, day, hour: 12, minute: 0 }`，**完全忽略 birthTime / lat / lon / tz**：
- birthTime 参数被丢弃（所有 12 条都按中午 12:00 算）
- lat/lon/tz 参数被丢弃（birthInfo 无地理字段）
- 因此本次压测 = **太阳星座 + 6 语言生成**压测
- 上升星座 / 宫位（需要时辰 + 地理）**未测到**

## 修复建议（待主公批准改原文件）
1. **#4 边界 bug**：查 `getIndividualZodiacProfile` 的星座分界表，确认 6/21 应为巨蟹（改 6/21 起巨蟹，或 6/22 起取决于产品定义）
2. **birthInfo 完整化**：让 handler 读取 birthTime/lat/lon/tz 构造完整 birthInfo，支持上升星座/宫位计算
3. 上述改动在 `web/api/wealth-oracle.js`（原文件），需主公批准（MEMORY 红线：改其他模块代码先申请）

## 测试产物
- `test_wealth_pressure.mjs`：12 条循环压测脚本
- `wealth-oracle.localtest.mjs`：可运行副本（已修 isTestAccount + 3 个旧 bug）
- `/tmp/wealth_pressure_results.json`：完整结果（含 data.zodiac）
