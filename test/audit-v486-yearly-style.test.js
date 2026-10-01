// ═══════════════════════════════════════════════════════════════════════
// 🛡️ V486: 年报文风复读治理 —— Prompt 硬规则 + 输出侧「只检不改」审计 回归闸门
//
// 军师二轮评审(文风 92 / 语法 88)三点, 全部先探真值再定责(1997-10-18 盘 zh 年报 19583 字):
//   ① 【证伪】第五章「卧室标签后紧跟厨房」断层 —— 实测错配 0 / 断层形态 0 次,
//      军师引用的是 V485 之前的旧样本; 当前产物为「**卧室区域:第四宫(田宅宫)**：你的卧室区域是…」。
//   ② 【引文不准, 但问题更重】军师称「12 个月里 8 个月用『这是一个关于XX的月份』」——
//      实测该串仅 3 次; 真正的同构是【月度财富概览】首句 11/12 月共用同一骨架
//      「流年太阳进入{SIGN}，点亮你的第{N}宫——这是关于…的宫位」。
//   ③ 【军师未发现 / 最重】🔴黑天鹅段整句逐字复用: 全文 11 类长句重复, 最高单句 ×7
//      (「绝对禁止在这一期间进行任何重大的财务决策…」×7);
//      句式级更重: 「这个窗口期是行动的最佳时机」12/12 月、「绝对禁止」11、「则暗示着」15。
//
// 治理选择(用户拍板): Prompt 硬规则 + 输出侧**只检不改**审计。
//   ⚠️ 之所以不做确定性改写: 改写正文 = 造词/语义损伤风险, 与本项目 V484「替换串凭空造日」
//      属同一类事故面。
//
// 纪律: 剥注释后再断言(防「注释里写了判据字面量」假红); 每条判据配注入自测(证明会红);
//      注入必须真的改变源码; 版本判据用单调判据不写死历史值。
// ═══════════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { closureDecls } from './tools/extract_decls.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf-8');

const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

const PROMPT_DIR = path.join(ROOT, 'src', 'prompts');
const readPrompt = (f) => fs.readFileSync(path.join(PROMPT_DIR, f), 'utf-8');
const ZH = readPrompt('yearlySystemZH.txt');
const EN = readPrompt('yearlySystemEN.txt');
const TH = readPrompt('yearlySystemTH.txt');

// ── 装载器: 只抽 auditYearlyStyleRepetition(自洽, 无外部依赖) ────────────
function loadAudit(source = src) {
  const { source: code } = closureDecls(source, ['auditYearlyStyleRepetition'], []);
  const ctx = { console, __exports: {} };
  vm.createContext(ctx);
  vm.runInContext(code + '\n__exports.f = auditYearlyStyleRepetition;', ctx);
  return ctx.__exports.f;
}

// 生产实测的高危复读句(军师二轮的核心证据) —— 也是「不得写进提示词当反例」的黑名单
const PROD_WORST = [
  '绝对禁止在这一期间进行任何重大的财务决策',
  '水星与冥王星的紧张相位则暗示着信息操控',
  '这个窗口期是行动的最佳时机',
];

// ══════════════════════════════════════════════════════════════════════════
// ① Prompt 侧三语硬规则
// ══════════════════════════════════════════════════════════════════════════
test('① 三语年报 Prompt 必须含 V486 文风硬规则(严禁整句复读 + 起手句式多元 + 去道具化)', () => {
  for (const [name, txt] of [['zh', ZH], ['en', EN], ['th', TH]]) {
    assert.ok(/V486/.test(txt), `${name} 年报 Prompt 缺少 V486 规则块标记`);
  }
  // zh
  assert.ok(/严禁整句复读/.test(ZH), 'zh 缺「严禁整句复读」');
  assert.ok(/起手句式多元/.test(ZH), 'zh 缺「起手句式多元」');
  assert.ok(/同一骨架不得超过4个月/.test(ZH), 'zh 缺骨架上限量化判据');
  assert.ok(/本规则不提供范例/.test(ZH), 'zh 缺「不提供范例」自保护规则');
  // en (fr/es/vi 均回落 en, 故 en 必须齐)
  assert.ok(/NO VERBATIM SENTENCE REUSE/i.test(EN), 'en 缺 no-verbatim-reuse 规则');
  assert.ok(/DIVERSIFY OPENING STRUCTURES/i.test(EN), 'en 缺句式多元规则');
  assert.ok(/NO EXAMPLES BY DESIGN/i.test(EN), 'en 缺「不提供范例」自保护规则');
  // th
  assert.ok(/ห้ามใช้ประโยคเดิมซ้ำทั้งประโยค/.test(TH), 'th 缺「严禁整句复读」');
  assert.ok(/เจตนาไม่ยกตัวอย่าง/.test(TH), 'th 缺「不提供范例」自保护规则');
});

test('①b 提示词不得写入生产高危复读句当「反例」(V462 教训: 反例会被 LLM 照抄)', () => {
  for (const [name, txt] of [['zh', ZH], ['en', EN], ['th', TH]]) {
    for (const bad of PROD_WORST) {
      assert.ok(!txt.includes(bad),
        `${name} 年报 Prompt 里出现了生产实测的复读句面「${bad.slice(0, 14)}…」——V462 已实证反例会被照抄，必须只描述结构、不给可复制的句子`);
    }
  }
});

// ══════════════════════════════════════════════════════════════════════════
// ② 「只检不改」不变量: 函数不得改写正文, 调用方不得把返回值赋回文本
// ══════════════════════════════════════════════════════════════════════════
test('② auditYearlyStyleRepetition 必须「只检不改」(静态: 不改写入参 text + 返回统计对象)', () => {
  const code = stripComments(closureDecls(src, ['auditYearlyStyleRepetition'], []).source);
  assert.ok(/function auditYearlyStyleRepetition/.test(code), '未能抽取到审计函数');
  // 不得对入参 text 重新赋值(字符串本身不可变, 真正的风险是「返回改好的文本」)
  assert.ok(!/(^|[^.\w_$])text\s*=(?!=)/.test(code),
    '审计函数对入参 text 做了赋值 —— 违反「只检不改」');
  // 必须返回统计对象(而非文本)
  assert.ok(/dupTypes/.test(code) && /return stat|return \{/.test(code),
    '审计函数应返回统计对象(dupTypes/dupOccurrences/maxRepeat)');
  // 调用方不得把返回值赋回报告文本
  assert.ok(!/(?:reportContent|cleanedText|streamText|ft)\s*=\s*auditYearlyStyleRepetition/.test(src),
    '调用方把审计返回值赋回了报告文本 —— 审计变成了改写, 违反「只检不改」');
});

test('②b 行为: 传入文本零改动 + 返回可机读统计(dupTypes/dupOccurrences/maxRepeat)', () => {
  const f = loadAudit();
  const inp = '第一句独立内容在这里。\n* 🔴 **[财务黑天鹅日]**: 高风险窗口开启。\n这是会被重复的一句话内容。\n这是会被重复的一句话内容。';
  const copy = String(inp);
  const r = f(inp, 'zh', 'yearly');
  assert.strictEqual(inp, copy, '审计不得改动传入文本');
  assert.strictEqual(typeof r, 'object', '应返回统计对象');
  assert.ok(r.dupTypes >= 1 && r.dupOccurrences >= 2 && r.maxRepeat >= 2,
    `应捕获到重复句, 实得 ${JSON.stringify(r)}`);
});

// ══════════════════════════════════════════════════════════════════════════
// ③ 行为: 生产形态复现(阳性) / 干净文本零报(阴性) / 护栏 / 幂等
// ══════════════════════════════════════════════════════════════════════════
// 用生产实测形态构造(不依赖 /tmp 产物, 保证闸门自洽可重复)
const DIRTY = [
  '### 2026年7月: 太阳巨蟹座 第8宫 · 深潜资源暗流',
  '* 🔴 **[财务黑天鹅日]**: **7月18日** 流年水星开始逆行。这是一个需要极度谨慎的日子。',
  '绝对禁止在这一期间进行任何重大的财务决策、签署任何重要的合同或进行任何高风险的投资。',
  '### 2026年8月: 太阳狮子座 第9宫 · 荣耀远征启程',
  '* 🔴 **[财务黑天鹅日]**: **8月25日** 流年火星形成强烈共振。这是一个持续一周的高风险时期。',
  '绝对禁止在这一期间进行任何重大的财务决策、签署任何重要的合同或进行任何高风险的投资。',
  '水星与冥王星的紧张相位则暗示着信息操控、沟通陷阱或思想冲突的可能性。',
  '### 2026年9月: 太阳处女座 第10宫 · 事业巅峰试炼',
  '* 🔴 **[财务黑天鹅日]**: **9月1日** 火星与土星强烈共振。这是一个持续一周的高风险时期。',
  '水星与冥王星的紧张相位则暗示着信息操控、沟通陷阱或思想冲突的可能性。',
  '绝对禁止在这一期间进行任何重大的财务决策、签署任何重要的合同或进行任何高风险的投资。',
].join('\n');

test('③ 行为: 能捕获生产形态的整句复读(≥3 类, 最高 ×3), 且是**只检不改**', () => {
  const f = loadAudit();
  const before = String(DIRTY);
  const r = f(DIRTY, 'zh', 'yearly');
  assert.strictEqual(DIRTY, before, '审计不得改动文本');
  assert.ok(r.dupTypes >= 3, `应捕获 ≥3 类重复句(实测生产为 11 类), 实得 ${r.dupTypes}`);
  assert.ok(r.maxRepeat >= 3, `最高复用应 ≥3, 实得 ×${r.maxRepeat}`);
  assert.ok(r.worst.length >= 1 && /绝对禁止在这一期间/.test(r.worst[0]),
    `worst 摘要应含最高频句, 实得 ${JSON.stringify(r.worst)}`);
});

test('③b 行为: 干净文本零报(阴性对照, 防闸门恒定红) + 幂等 + 非年报护栏', () => {
  const f = loadAudit();
  const clean = '### 2026年7月\n流年太阳进入巨蟹座，点亮你的第八宫。资源结构开始重排。\n### 2026年8月\n木星把远方的门推开，跨界机会先行到账。';
  const r1 = f(clean, 'zh', 'yearly');
  assert.strictEqual(r1.dupTypes, 0, `干净文本不应报重复, 实得 ${JSON.stringify(r1)}`);
  assert.deepStrictEqual(f(clean, 'zh', 'yearly'), r1, '审计必须幂等');
  assert.strictEqual(f(DIRTY, 'zh', 'monthly'), null, '非年报必须返回 null(护栏)');
  assert.strictEqual(f('', 'zh', 'yearly'), null, '空文本必须返回 null(护栏)');
  assert.strictEqual(f(null, 'zh', 'yearly'), null, 'null 必须返回 null(护栏)');
});

// ══════════════════════════════════════════════════════════════════════════
// ④ 接线: 只在「新生成」两条路径上跑(非流式 MISS + 流式落库前), 避免 HIT 噪音
// ══════════════════════════════════════════════════════════════════════════
test('④ 接线 ≥2 处, 且只挂在生成路径(不与收尾锁混淆)', () => {
  const hits = [...src.matchAll(/auditYearlyStyleRepetition\(\s*(\w+)\s*,\s*lang\s*,\s*reportType\s*\)/g)];
  assert.ok(hits.length >= 2, `审计接线应 ≥2 处, 实得 ${hits.length}`);
  const targets = hits.map((m) => m[1]);
  assert.ok(targets.includes('reportContent'), '非流式 MISS 路径未接线');
  assert.ok(targets.includes('cleanedText'), '流式落库前路径未接线');
});

test('⑤ 缓存版本必须 ≥ 历史基线(单调判据, 防每次 bump 假红)', () => {
  const vers = [...src.matchAll(/wealth:v(\d+):/g)].map((m) => Number(m[1]));
  const cur = Math.max(...vers);
  assert.ok(cur >= 495, `当前缓存版本应 ≥495(输出链已变更), 实得 v${cur}`);
  assert.ok(vers.filter((v) => v === cur).length >= 3, `当前版本 v${cur} 应出现在 3 处缓存 key`);
});

// ══════════════════════════════════════════════════════════════════════════
// ⑥ 注入缺陷自测 —— 每条都必须「注入后判据变红」
// ══════════════════════════════════════════════════════════════════════════
test('【注入】摘掉 zh 文风规则块 → ① 必须红', () => {
  const degraded = ZH.replace(/⛔ \[文风反复读铁律 V486[\s\S]*?搬进正文当作内容。/, '');
  assert.notStrictEqual(degraded, ZH, '注入必须真的改变源码');
  assert.ok(!/严禁整句复读/.test(degraded) && !/V486/.test(degraded),
    '注入后 ① 判据应命中失败');
});

test('【注入】把生产高危复读句写进 Prompt 当反例 → ①b 必须红', () => {
  const degraded = ZH + '\n  ❌ 反例(禁止照抄): "绝对禁止在这一期间进行任何重大的财务决策、签署任何重要的合同。"\n';
  assert.notStrictEqual(degraded, ZH, '注入必须真的改变源码');
  assert.ok(PROD_WORST.some((b) => degraded.includes(b)), '注入后 ①b 判据应命中失败');
});

test('【注入】让审计函数改写正文 → ② 必须红', () => {
  const degraded = src.replace(
    /function auditYearlyStyleRepetition\(text, lang, reportType\) \{/,
    "function auditYearlyStyleRepetition(text, lang, reportType) {\n  text = String(text).replace(/高风险时期/g, '高风险期');");
  assert.notStrictEqual(degraded, src, '注入必须真的改变源码');
  const code = stripComments(closureDecls(degraded, ['auditYearlyStyleRepetition'], []).source);
  assert.ok(/(^|[^.\w_$])text\s*=(?!=)/.test(code), '注入后 ② 静态判据应命中失败');
});

test('【注入】把审计返回值赋回报告文本 → ② 必须红', () => {
  const degraded = src.replace(
    /^(\s*)auditYearlyStyleRepetition\(cleanedText, lang, reportType\);.*$/m,
    '$1cleanedText = auditYearlyStyleRepetition(cleanedText, lang, reportType);');
  assert.notStrictEqual(degraded, src, '注入必须真的改变源码');
  assert.ok(/(?:reportContent|cleanedText|streamText|ft)\s*=\s*auditYearlyStyleRepetition/.test(degraded),
    '注入后 ② 调用方判据应命中失败');
});

test('【注入】摘掉非流式接线 → ④ 必须红', () => {
  const degraded = src.replace(
    /^\s*auditYearlyStyleRepetition\(reportContent, lang, reportType\);.*$/m, '');
  assert.notStrictEqual(degraded, src, '注入必须真的改变源码');
  const hits = [...degraded.matchAll(/auditYearlyStyleRepetition\(\s*(\w+)\s*,\s*lang\s*,\s*reportType\s*\)/g)];
  assert.ok(!hits.map((m) => m[1]).includes('reportContent'), '注入后 ④ 应命中失败');
});

test('【注入】缓存版本降级一档 → ⑤ 必须红', () => {
  const cur = Math.max(...[...src.matchAll(/wealth:v(\d+):/g)].map((m) => Number(m[1])));
  const degraded = src.replace(new RegExp(`wealth:v${cur}:`, 'g'), `wealth:v${cur - 1}:`);
  assert.notStrictEqual(degraded, src, '注入必须真的改变源码');
  const vers = [...degraded.matchAll(/wealth:v(\d+):/g)].map((m) => Number(m[1]));
  assert.ok(Math.max(...vers) < 495, `注入后版本应低于基线(实得 v${Math.max(...vers)})`);
});
