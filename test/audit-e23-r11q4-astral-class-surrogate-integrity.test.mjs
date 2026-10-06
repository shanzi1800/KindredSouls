// ═══════════════════════════════════════════════════════════════════════════
// 🛡️ E23/R11q ④ 闸门：星平面字符类正则的「半代理项污染」根治 + well-formed 保证
// ═══════════════════════════════════════════════════════════════════════════
// 【立案背景】（2026-10-06，E23 线上验收时由「s7 zh 反复不落库」反向揪出）
//   现象：s7 zh 连抽 5 稿有 1 稿**既不落库也不流式落库**（同一盘其它稿正常），
//         en 对照盘 s2 5/5 正常 ⇒ 内容相关，不是通道问题。
//   取证链（每一步都落到了实证，无一环靠推演）：
//     ① 扫「未落库」那一轮的响应文本 ⇒ 含 **2 个孤立低代理项**（`\uDC41`/`\uDCA1`），
//        而通过轮的文本 0 个；上下文可精确还原为被斩首的 **👁️(U+1F441+FE0F)** 与 **💡(U+1F4A1)**
//        小标题：`### \uDC41\uFE0F 潜意识阴影` / `### \uDCA1 深度疗愈路径`。
//     ② 生产运行期日志（`railway logs`，本轮实测**可读**）实锤写库失败：
//        `[wealth-stream] [WRITE] ... status=400`
//        `[wealth-stream] [WRITE-FAIL] status=400 body={"code":"PGRST102",...,"message":"Empty or invalid json"}`
//     ③ 机理：`JSON.stringify` 把孤立代理项转义成 `\udc41` ⇒ PostgREST(aeson) 判非法 JSON
//        ⇒ **写缓存静默失败 ⇒ 该盘永不命中**（每次 MISS 全价，E23③ 预警的「最坏情形」）。
//     ④ 根因定位：`_V480_DECOR = /^[\s✦◆◇📜📅🏹🛡️🔮📊📕📌·]+/`（**缺 `u` 标志**）。
//        JS 非 `u` 模式下字符类里的星平面字符被拆成两个独立码元（`📜` = U+D83D + U+DCDC），
//        类成员集合实际含**裸 `\uD83D`/`\uDEE1`/`\uFE0F`**；对闭集外 emoji（👁️/💡/🌐）：
//        `\uD83D` 命中 ⇒ 被单独删除，`\uDC41` 不属成员 ⇒ `+` 提前中断 ⇒ 造出孤立**低**代理项。
//     ⑤ 逐例复现：`'👁️ 潜意识阴影'.replace(_V480_DECOR_OLD,'')` ⇒ 含 `\uDC41`，与线上观测**逐字节一致**。
//   修法（**极小面、零副作用**）：只给这两个字面量补 `u` ⇒ 类成员是**整颗 emoji**：
//     · 闭集内（📜/📅/🏹/🛡️/🔮/📊/📕/📌/✦/◆/◇/·/空白）剥离行为**完全不变**（零 churn，逐例验）；
//     · 闭集外（👁️/💡/🌐/🟢…）**原样保留**（不再被斩首）——这正是「不做内容损伤」的正确语义。
//   同时补两道**非治本但必要**的防线：
//     · `_v525WellFormed`：输出端 well-formed 不变式（响应与落库**共用同一收敛点**，
//       E18/R11k「Text(MISS) ≡ Text(HIT) 逐字同源」契约不破）；**且必须告警**（绝不静默兜底）。
//     · 非流式写库补 `res.ok` 校验 + `WRITE-FAIL` 日志 —— 旧写法只打「Cache write」不校验，
//       使 400 完全不可见（本缺陷能逃逸多轮的直接原因之一）。
// 【同族扫描结论（已取证，勿再猜）】
//   · 真致污仅 `_V480_DECOR` 家族（`^[...]+` / `[...]+$` 量词式，**实际匹配**）。
//   · 1343/1347/1496/1506「双重括号清洗」四式：非 `u` 下**永不匹配**（实测 `[🔴 [` / `[💡 [` 均 match=false）
//     ⇒ 既不致污，同时暴露另一条缺陷：**「double-bracket 清洗」对外星 emoji 从未生效**（列后续轮次）。
//   · `[✦🔮]`（`.test()`）/`[^🔴🟢]`（取反类，仅匹配）等：语义误判面，不致污。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(__dirname, '..');
const SRC = readFileSync(path.join(REPO, 'server.js'), 'utf-8');
const SWEEP = readFileSync(path.join(REPO, 'test/tools/sweep-online.mjs'), 'utf-8');
const { closureDecls } = await import(pathToFileURL(path.join(REPO, 'test/tools/extract_decls.mjs')));

// ── 判据同源：直接从 server.js 抽字面量/函数切片（禁在闸门里重写一份） ──
function sliceVm(seeds, extraGlobals = {}) {
  const { map } = closureDecls(SRC, seeds);
  const ctx = { console, __exports: {}, ...extraGlobals };
  vm.createContext(ctx);
  const body = [...map.entries()].sort((a, b) => SRC.indexOf(a[1]) - SRC.indexOf(b[1])).map((e) => e[1]).join('\n\n');
  vm.runInContext(body + '\n' + seeds.map((n) => `__exports[${JSON.stringify(n)}] = typeof ${n} !== 'undefined' ? ${n} : undefined;`).join('\n'), ctx);
  return ctx.__exports;
}

/** 孤立代理项计数（自足判据，不依赖任何锁函数） */
function loneSurrogates(t) {
  let n = 0;
  for (let i = 0; i < t.length; i++) {
    const c = t.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff) { const x = t.charCodeAt(i + 1); if (!(x >= 0xdc00 && x <= 0xdfff)) n++; }
    else if (c >= 0xdc00 && c <= 0xdfff) { const p = t.charCodeAt(i - 1); if (!(p >= 0xd800 && p <= 0xdbff)) n++; }
  }
  return n;
}
const vis = (s) => [...s].map((ch) => { const cp = ch.codePointAt(0); return cp > 0xffff ? `{U+${cp.toString(16).toUpperCase()}}` : (cp >= 0xd800 && cp <= 0xdfff ? `{LONE:U+${cp.toString(16).toUpperCase()}}` : ch); }).join('');

// ══════════════════════════════════════════════════════════════════════════
// ⑬ 结构：`_V480_DECOR` / `_V480_DECOR_TAIL` 必须带 `u` 标志（回退即红）
// ══════════════════════════════════════════════════════════════════════════
test('⑬ 结构：装饰符正则必须带 u 标志（缺 u = 半代理项污染工厂）', () => {
  for (const name of ['_V480_DECOR', '_V480_DECOR_TAIL']) {
    const m = SRC.match(new RegExp(`const\\s+${name}\\s*=\\s*(/[^\\n]*?/[a-z]*)\\s*;`));
    assert.ok(m, `未能从 server.js 抽到 ${name} 字面量`);
    assert.ok(m[1].endsWith('/u'), `${name} 必须带 u 标志，实际为 ${m[1]}`);
    // 类内必须确实含星平面 emoji（否则本闸门形同虚设）
    assert.ok([...m[1]].some((ch) => ch.codePointAt(0) > 0xffff), `${name} 类内应含星平面 emoji（判据靶点）`);
  }
});

// ══════════════════════════════════════════════════════════════════════════
// ⑭ 行为：闭集外 emoji 不再被斩首；闭集内行为完全不变（零 churn）
// ══════════════════════════════════════════════════════════════════════════
test('⑭ 行为：👁️/💡/🌐 标题 emoji 保留且 0 孤立代理项；📜/✦ 闭集剥离行为不变', () => {
  const X = sliceVm(['_V480_DECOR', '_V480_DECOR_TAIL']);
  const DEC = X._V480_DECOR, TAIL = X._V480_DECOR_TAIL;
  assert.ok(DEC && TAIL, '未能从 server.js 抽到 _V480_DECOR / _V480_DECOR_TAIL');

  // ① 闭集外 emoji（本轮线上事故的三个真实形态）⇒ 原样保留、零孤立代理项
  for (const [body, cp] of [['👁️ 潜意识阴影', 0x1f441], ['💡 深度疗愈路径', 0x1f4a1], ['🌐 空间财富对齐', 0x1f310]]) {
    const out = body.replace(DEC, '');
    assert.equal(loneSurrogates(out), 0, `${vis(body)} ⇒ 产出孤立代理项：${vis(out)}`);
    assert.ok([...out].some((ch) => ch.codePointAt(0) === cp), `${vis(body)} 的 emoji 被误删 ⇒ ${vis(out)}`);
    assert.ok(out.includes('潜') || out.includes('深') || out.includes('空'), '正文被误伤');
  }
  // ② 闭集内 emoji/装饰符 ⇒ 剥离行为与修复前**逐字一致**（零 churn 保证）
  assert.equal('📜 第一章：年度财富矩阵'.replace(DEC, ''), '第一章：年度财富矩阵');
  assert.equal('📅 2026年7月'.replace(DEC, ''), '2026年7月');
  assert.equal('✦ 宏观策略'.replace(DEC, ''), '宏观策略');
  assert.equal('◆◇ 先知神谕'.replace(DEC, ''), '先知神谕');
  assert.equal('先知神谕 · 财富启示录 ✦'.replace(TAIL, ''), '先知神谕 · 财富启示录');
  assert.equal('空间财富对齐 📌'.replace(TAIL, ''), '空间财富对齐');
});

// ══════════════════════════════════════════════════════════════════════════
// ⑮ 注入自测：把 `u` 去掉 ⇒ **必须**复现污染（证明 `u` 是必需而非装饰，闸门有牙）
// ══════════════════════════════════════════════════════════════════════════
test('⑮ 注入自测：字面量去掉 u 标志即复现线上事故形态（判据敏感度自证）', () => {
  const mDec = SRC.match(/const\s+_V480_DECOR\s*=\s*(\/[^\n]*?\/[a-z]*)\s*;/);
  const mTail = SRC.match(/const\s+_V480_DECOR_TAIL\s*=\s*(\/[^\n]*?\/[a-z]*)\s*;/);
  assert.ok(mDec && mTail);
  const decNoU = new RegExp(mDec[1].slice(1, mDec[1].lastIndexOf('/')), mDec[1].slice(mDec[1].lastIndexOf('/') + 1).replace('u', ''));
  const tailNoU = new RegExp(mTail[1].slice(1, mTail[1].lastIndexOf('/')), mTail[1].slice(mTail[1].lastIndexOf('/') + 1).replace('u', ''));

  // 半代理项单独成为类成员 —— 污染机理的直接证据
  assert.ok(decNoU.test('\uD83D'), '缺 u 时裸高代理项应命中类成员（污染机理）');
  assert.ok(!new RegExp(mDec[1].slice(1, mDec[1].lastIndexOf('/')), 'u').test('\uD83D'), '带 u 时裸高代理项不得命中');

  // 去 u 后必须复现：孤立低代理项 + 与线上观测一致的形态
  const bad = '👁️ 潜意识阴影'.replace(decNoU, '');
  assert.equal(loneSurrogates(bad), 1, `去 u 应产出 1 个孤立代理项，实际 ${vis(bad)}`);
  assert.ok(bad.includes('\uDC41'), `去 u 应残留 \\uDC41（线上实锤形态），实际 ${vis(bad)}`);
  assert.equal(loneSurrogates('💡 深度疗愈路径'.replace(decNoU, '')), 1);

  // 结构断言本身有牙：若上面 ⑬ 的判据落在去 u 字面量上 ⇒ 必须不通过
  assert.ok(!decNoU.flags.includes('u') && !tailNoU.flags.includes('u'));
});

// ══════════════════════════════════════════════════════════════════════════
// ⑯ `_v525WellFormed`：well-formed 不变式（零 churn / 幂等 / 必删 / 必告警）
// ══════════════════════════════════════════════════════════════════════════
test('⑯ _v525WellFormed：合法文本零改动、幂等、孤立代理项必删且必告警', () => {
  const warns = [];
  const ctxShim = { log: () => {}, warn: (...a) => warns.push(a.join(' ')), error: () => {} };
  const X = sliceVm(['_v525WellFormed'], { console: ctxShim });
  const WF = X._v525WellFormed;
  assert.equal(typeof WF, 'function', '未能抽到 _v525WellFormed');

  // ① 合法文本（含完整 emoji、CJK、泰文组合符）⇒ 逐字零改动
  const legal = '## 先知神谕 · 财富启示录\n### 👁️ 潜意识阴影\n### 2026年7月: 太阳巨蟹座 第8宫\n🔮 ✦ ◆ · ไทย ệ\n';
  assert.equal(WF('t', legal), legal, '合法文本被改动 ⇒ 违反零 churn');

  // ② 幂等
  assert.equal(WF('t', WF('t', legal)), legal);

  // ③ 含孤立代理项 ⇒ 必删 + 必告警（绝不静默）
  const dirty = '### ' + '\uDC41' + '\uFE0F 潜意识阴影';
  const clean = WF('nonstream/zh/yearly', dirty);
  assert.equal(loneSurrogates(clean), 0, '孤立代理项未被清除');
  assert.ok(!clean.includes('\uDC41'));
  assert.equal(warns.length, 1, '清洗必须留痕告警（静默兜底 = 掩盖上游新缺陷）');
  assert.ok(/WELLFORMED/.test(warns[0]) && /剥离孤立代理项 1 个/.test(warns[0]), `告警内容须可诊断：${warns[0]}`);
  // ④ 空/非字符串安全
  assert.equal(WF('t', ''), '');
  assert.equal(WF('t', null), null);
});

// ══════════════════════════════════════════════════════════════════════════
// ⑰ 挂载点：非流式 `_finalText` 与流式 `cleanedText` 各 1 处，且先于共用点
//    （E18/R11k 契约：响应文本 ≡ 落库文本，逐字同源；净化必须在「共用」之前）
// ══════════════════════════════════════════════════════════════════════════
test('⑰ 挂载点：两处收敛点各 1 次，且先于「响应≡落库」共用字符串', () => {
  const calls = SRC.match(/_v525WellFormed\(/g) || [];
  assert.equal(calls.length, 3, `_v525WellFormed 出现次数应为 3（1 定义 + 2 调用），实际 ${calls.length}`);

  // 非流式：净化包在 standardizeReport(...) 外层，且赋给 `_finalText`（响应与落库共用该串）
  const ns = SRC.match(/const _finalText = _v525WellFormed\('nonstream\/' \+ lang \+ '\/' \+ reportType, standardizeReport\(reportContent\)\);/);
  assert.ok(ns, '非流式收敛点缺失或形态改变');
  assert.ok(SRC.indexOf('const _finalText = _v525WellFormed(') < SRC.indexOf('insight: _finalText,'), '净化必须先于落库 body 构造');
  assert.ok(SRC.includes("return res.json({ ...result, report: _finalText,"), '响应必须复用 _finalText（同源契约）');

  // 流式：净化位于 `_sanitizedForClient = cleanedText` 与 `writeToCache(cleanedText)` 之前
  const iWf = SRC.indexOf("cleanedText = _v525WellFormed('stream/'");
  const iSan = SRC.indexOf('let _sanitizedForClient = cleanedText;');
  const iWc = SRC.indexOf('writeToCache(cleanedText)');
  assert.ok(iWf > 0 && iSan > 0 && iWc > 0, '流式收敛点/共用点缺失');
  assert.ok(iWf < iSan, '流式净化必须早于客户端终稿派生');
  assert.ok(iWf < iWc, '流式净化必须早于落库');
});

// ══════════════════════════════════════════════════════════════════════════
// ⑱ 写库观测：非流式必须校验 res.status 并打 WRITE-FAIL（消除「静默不落库」盲区）
// ══════════════════════════════════════════════════════════════════════════
test('⑱ 写库观测：非流式写库校验 res.ok 且失败留痕（与流式 writeToCache 对齐）', () => {
  assert.ok(/const _wRes = await safeFetch\(/.test(SRC), '非流式写库必须捕获响应对象');
  assert.ok(/\[WRITE\] Cache write: \$\{cacheKey\}, length=\$\{_finalText\.length\}, status=\$\{_wRes \? _wRes\.status : '\?'\}/.test(SRC),
    '非流式 WRITE 日志必须打印 status');
  assert.ok(/\[wealth-oracle\] \[WRITE-FAIL\] status=\$\{_wRes\.status\} body=/.test(SRC), '非流式写库失败必须打印 body');
  assert.ok(/if \(_wRes && !_wRes\.ok\)/.test(SRC), '必须显式判定 !_wRes.ok');
  // 与流式对称（后者本就有）
  assert.ok(/\[wealth-stream\] \[WRITE-FAIL\] status=\$\{res2\.status\} body=/.test(SRC), '流式写库失败留痕应保持');
  // 旧写法（只打 WRITE 不校验）不得残留
  assert.ok(!/console\.log\(`\[wealth-oracle\] \[WRITE\] Cache write: \$\{cacheKey\}, length=\$\{_finalText\.length\}`\);/.test(SRC),
    '旧的「不校验 status」写法不得残留');
});

// ══════════════════════════════════════════════════════════════════════════
// ⑲ 全仓扫描：**锚定式星平面字符类必须带 u**（防同类缺陷回归）+ 扫描器自校验
// ══════════════════════════════════════════════════════════════════════════
/** 形态判据：字面量 body 恰为 `^[cls]<quant?>` 或 `[cls]<quant?>$`（= 装饰剥离形态） */
function scanAnchoredAstralCls(src) {
  const RE_LIT = /\/(?![/*])(?:\\.|\[(?:\\.|[^\]\\\n])*\]|[^/\\\n])+\/[a-z]*/g;
  const hits = [];
  for (const m of src.matchAll(RE_LIT)) {
    const lit = m[0];
    const end = lit.lastIndexOf('/');
    const body = lit.slice(1, end);
    const flags = lit.slice(end + 1);
    if (!/^(?:\^\[(?:\\.|[^\]\\])*\][+*?]?|\[(?:\\.|[^\]\\])*\][+*?]?\$)$/.test(body)) continue;
    const cls = body.match(/\[(?:\\.|[^\]\\])*\]/)[0];
    if (![...cls].some((ch) => ch.codePointAt(0) > 0xffff)) continue;
    hits.push({ lit, flags, hasU: flags.includes('u') });
  }
  return hits;
}

test('⑲ 全仓扫描：锚定式星平面字符类一律带 u（server.js + lib + scripts，零例外）', () => {
  // ── 扫描器自校验：已知缺陷样本必报、已修样本必不报（否则扫描器本身是假绿） ──
  const badSample = 'const R = /^[\\s✦◆◇📜📅🏹🛡️🔮📊📕📌·]+/;';
  const goodSample = 'const R = /^[\\s✦◆◇📜📅🏹🛡️🔮📊📕📌·]+/u;';
  const b = scanAnchoredAstralCls(badSample), g = scanAnchoredAstralCls(goodSample);
  assert.equal(b.length, 1, '扫描器漏报已知缺陷样本（假绿）');
  assert.equal(b[0].hasU, false);
  assert.equal(g.length, 1, '扫描器漏报已修样本（无法验证）');
  assert.equal(g[0].hasU, true);
  assert.equal(scanAnchoredAstralCls('const R = /[a-z]+/;').length, 0, '扫描器误报非星平面类');

  // ── 真实扫描 ──
  const files = [path.join(REPO, 'server.js')];
  const walk = (d) => { for (const e of readdirSync(d)) { if (['node_modules', '.git', 'dist', 'coverage', '.astro'].includes(e)) continue; const p = path.join(d, e); if (statSync(p).isDirectory()) walk(p); else if (/\.(mjs|cjs|js)$/.test(e)) files.push(p); } };
  walk(path.join(REPO, 'lib'));
  walk(path.join(REPO, 'scripts'));

  const offenders = [];
  for (const f of files) {
    for (const h of scanAnchoredAstralCls(readFileSync(f, 'utf-8'))) {
      if (!h.hasU) offenders.push(`${path.relative(REPO, f)}  ${h.lit}`);
    }
  }
  assert.deepEqual(offenders, [], '存在「锚定式星平面字符类缺 u」的正则（半代理项污染风险）：\n' + offenders.join('\n'));
  // 靶点必须在（防止有人把 _V480_DECOR 改成不含星平面 emoji 的类来「过闸」）
  assert.ok(scanAnchoredAstralCls(SRC).length >= 2, 'server.js 内应至少保留 _V480_DECOR 家族两处锚定式星平面字符类');
});

// ══════════════════════════════════════════════════════════════════════════
// ⑳ 批测工具判据盲区闭合：孤立代理项纳入 row.ok（本次逃逸的直接成因）
// ══════════════════════════════════════════════════════════════════════════
test('⑳ 批测工具：孤立代理项进 row.ok（原 artifacts 判据对此失明）', () => {
  assert.ok(/function countLoneSurrogates\(t\)/.test(SWEEP), 'sweep-online 必须内置孤立代理项计数');
  assert.ok(/row\.loneSurrogates = countLoneSurrogates\(miss\.text\);/.test(SWEEP), '必须对 MISS 文本计数');
  assert.ok(/&& row\.loneSurrogates === 0;/.test(SWEEP), '必须纳入 row.ok');
  assert.ok(/孤立代理项=\$\{row\.loneSurrogates/.test(SWEEP), '必须打印（可观测）');
  // 计数函数自校验：同源切片运行
  const f = SWEEP.match(/function countLoneSurrogates\(t\)\s*\{[\s\S]*?\n\}/);
  assert.ok(f, '未能抽到 countLoneSurrogates');
  const ctx = { console, __exports: {} };
  vm.createContext(ctx);
  vm.runInContext(f[0] + '\n__exports.f = countLoneSurrogates;', ctx);
  const cnt = ctx.__exports.f;
  assert.equal(cnt('👁️ 潜意识阴影'), 0, '合法 emoji 不得计为孤立代理项');
  assert.equal(cnt('\uDC41\uFE0F 潜意识阴影'), 1);
  assert.equal(cnt('\uD83D\uDC41\uFE0F 潜意识阴影'), 0);
  assert.equal(cnt('\uD83D\uDC41\uD83D\uDC41'), 0);
  assert.equal(cnt('纯中文无 emoji'), 0);
});

// ══════════════════════════════════════════════════════════════════════════
// ㉑ 接线自保：本闸门与 E23 主闸门必须已挂进 `test:astro` 长链
//    （本次实测暴露的缺口：新闸门写好却没接线 ⇒ 永不执行 = 零防线）
// ══════════════════════════════════════════════════════════════════════════
test('㉑ 接线自保：本闸门 + E23 主闸门均已注册进 test:astro 长链', () => {
  const pkg = JSON.parse(readFileSync(path.join(REPO, 'package.json'), 'utf-8'));
  const chain = pkg.scripts['test:astro'] || '';
  for (const g of ['audit-e23-r11q-zh-latency-and-syntax-fix.test.mjs',
    'audit-e23-r11q4-astral-class-surrogate-integrity.test.mjs']) {
    assert.ok(chain.includes(`node --test test/${g}`), `${g} 未接入 test:astro 长链（写好不接线 = 永不运行）`);
  }
  // 链尾必须是 python 峰值窗口审计（防止有人误删尾巴导致后半段被截）
  assert.ok(/python3 scripts\/audit_v492_peak_window\.py\s*$/.test(chain.trim()), 'test:astro 链尾应为 python3 峰值窗口审计');
});
