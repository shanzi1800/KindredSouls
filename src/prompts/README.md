# 年报/月报 系统提示词目录

## ⚠️ 唯一真源 = `*.txt`

运行时由 `loader.js` 直接 `readFileSync` 读取本目录的 `.txt` 文件：

| 文件 | 语言 | 说明 |
|---|---|---|
| `yearlySystemZH.txt` | 中文 | 原生 |
| `yearlySystemEN.txt` | 英文 | 原生；`fr` / `es` / `vi` 均**回落**到此文件 |
| `yearlySystemTH.txt` | 泰文 | 原生 |
| `yearlySystemEN_backup.txt` | — | 历史备份，**不参与运行**，不要改它以为会生效 |

## 改动纪律

1. **只改 `.txt`**。改任何其他形式的副本都不会影响线上。
2. 改完必须验证「运行时装配出来的提示词真的变了」，而不是只看文件内容：
   ```bash
   node -e "import('./src/prompts/loader.js').then(m=>console.log(m.getSystemPromptByLocale('zh').slice(0,200)))"
   ```
3. 输出链（提示词 / 清洗链 / 注入字段）任何改动，都要 bump 年报缓存版本
   `wealth:vNNN:`（`server.js` 3 处 + `test/audit-yearly-stream.test.js` 的 `MIN_CACHE_VER`），
   否则会复用毒缓存。

## 已删除的孪生漂移源（V487 P0 技术债）

以下文件曾是与 `.txt` 并行维护的副本，**全仓零引用**，且比 `.txt` 大 2.5KB，
极易造成「改了这里以为生效了」的隐蔽误判 —— 已于 V487 整体删除：

- `index.ts`
- `yearlySystemZH.ts`
- `yearlySystemEN.ts`
- `yearlySystemTH.ts`

如需取回历史内容，从 git 记录中检出即可：

```bash
git show <提交>^:src/prompts/yearlySystemZH.ts
```
