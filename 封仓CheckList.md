# KindredSouls 封仓 CheckList

> 每次大版本（V474 / V475 / …）封仓前**逐条打勾**，任一条不过 → **禁止封仓**。
> 本清单源于 **V473 幽灵 Bug 复盘**，核心教条：
>
> **「后端 API 数据的全绿，不等于前端 DOM 的挂载。」**
> **「编译通过，不等于功能存在。」**

---

## 0. 为什么会有这份清单（V473 → V474 两次踩坑）

| 版本 | 病灶 | 为什么常规流程没拦住 |
| --- | --- | --- |
| V473 | 有人为了「让编译通过」，用 `{/* … */}` 把 **140 行年报渲染块**整段注释掉 | JSX 注释里的代码被 tsc 直接丢弃 → 编译全绿、构建全绿、接口全绿，线上却一个字不出 |
| V474 | `cleanYearlyTimeline` 里 `new RegExp('(([^)\n]*?)(\s*)(?=\n\|$)')` **少一个右括号** | tsc **看不见**字符串拼出来的正则（它不是正则字面量）→ 编译期无感，运行时必抛 `SyntaxError: Unterminated group`，直接打断年报渲染链 |
| V473 补 | 页面里 15 处「正则**字面量**」的坏括号 | 这个 tsc 其实能拦 —— 拦住的方式是编译失败，然后被人用注释「绕过」 |

**共同点：问题都不在「代码质量」，而在「验证手段的盲区」。**
所以本清单的每一条，都是补一个盲区。

---

## 1. 代码闸门（本地必过，已接进 `build` / `build:web`）

```bash
cd web && npm run preflight
```

| # | 闸门 | 命令 | 拦住什么 |
| --- | --- | --- | --- |
| 1.1 | 运行时正则体检 | `npm run verify:regex` | 字符串构造的坏正则（tsc 盲区）。AST 定位 + 真跑 `new RegExp()` 复现运行时行为 |
| 1.2 | 年报渲染块存活守卫 | `npm run verify:render` | 「整段渲染块被注释掉」：用 AST 证明 `yearly-pending` / `SacredYearlyReportBox` 是**活代码**；超 40 行的 JSX 注释块直接报警 |
| 1.3 | 解析层真行为单测 | `npm run test:report` | `parseYearlyReport` / `cleanYearlyTimeline` 的行为回归；V474 地雷专项断言「非空输入不得抛异常」 |
| 1.4 | i18n 键闸门 | `node scripts/check-i18n-keys.mjs` | 6 语种键集合漂移 |

> 闸门必须**自测过**才算有效：往 `web/src/` 里塞一个带病 fixture，确认闸门**真的变红并给出 file:line**，再删掉。
> 「从不报警的闸门，等于没有闸门。」

---

## 2. 后端真值（沿用既有流程）

```bash
# ⚠️ 前提：python3 必须能 import swisseph，否则 getAstroMatrix 返回 null，
#    audit-v445-outer-planets 等 5 条断言会假红 —— 这不是代码回归，是环境缺依赖。
#    系统 python3 通常没有；本机可用托管 venv：
export PATH="/Users/apple/.workbuddy/binaries/python/envs/default/bin:$PATH"
python3 -c "import swisseph; print(swisseph.version)"   # 期望打印 2.10.03

npm run test:astro          # 289 项天文真值 / 多语言审计（pre-commit 也会跑）
npm run verify:truth        # pyswisseph 独立引擎核算
npm run verify:truth:live   # 真接口跑 2 轮
```

- [ ] `python3 -c "import swisseph"` 通过（**先过这一条，否则后面全是假红**）
- [ ] 289/289 绿
- [ ] 六语种（zh / en / es / fr / th / vi）全语言回归无中文残留、无零逆行
- [ ] 输出链有变更 → **缓存 key 必须 bump**（`wealth:v47x`）；仅前端改动且后端文本未变 → 可不 bump

---

## 3. 前端产物抽检（**V474 新增 · 最关键的一条**）

```bash
node scripts/check-online-bundle.mjs            # 默认查 https://kindredsouls.online
KS_SITE=https://xxx node scripts/check-online-bundle.mjs   # 指定站点
```

脚本动作：抓首页 → 定位线上 `assets/index-*.js` → 下载产物 → 内容级抽检 → 与本地 `web/dist` 做 **MD5 字节级比对**。

- [ ] 全部**必需标识**命中（`yearly-pending` / `SacredYearlyReportBox` / `12 个月` …）
- [ ] 全部**禁用标识**命中数为 0
- [ ] 线上产物 MD5 **等于**本地本次构建产物（证明「线上 = 本次构建」，而不是部署了个旧的）

> **封仓前必须亲手跑一次，看到 `✅ 线上产物抽检通过` 才算过。**
> 只看后端接口返回 `DONE` 一律不算数。

---

## 4. 部署与人工终验

- [ ] `web/dist` 已随提交入库（本项目 dist 走 git 部署）
- [ ] 推送后等待自动部署完成，**再跑一遍 §3**（确认线上产物文件名/MD5 已更新为本次构建）
- [ ] 浏览器 **Cmd+Shift+R** 强刷，确认加载的是新 `index-*.js`
- [ ] 人工终验（月报 + 年报各一）：流式打字机 → 章节卡 → 12 个月矩阵 → 收尾献词

---

## 5. 交班纪律

- [ ] 战报里写明：**本次封仓对应的 bundle 文件名 + MD5**，写进封仓清单存档
- [ ] 严禁用 `{/* … */}` 注释掉功能来「让编译通过」——正确做法是修根因或 `git stash` 丢改动
- [ ] 严禁用「注释掉」替代「修好」；确实要下线功能，走 feature flag 或 `git revert`
- [ ] 遗留项（V475 候选）逐条列出，不许"心里知道"

---

## 附：一键命令速查

```bash
# 完整本地预检
cd web && npm run preflight

# 构建（自动串 i18n 闸门 + preflight）
cd web && npm run build

# 线上产物抽检
node scripts/check-online-bundle.mjs

# 解析层单测
cd web && npm run test:report
```

---

_最近更新：V474（年报渲染链拆弹 + 两道闸门落地）_
