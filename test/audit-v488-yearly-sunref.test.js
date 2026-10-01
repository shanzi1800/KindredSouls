// ═══════════════════════════════════════════════════════════════════════
// 🛡️ V488: 年报「非月段·流年太阳引用」真值锁 + 语义漂移审计 —— 回归闸门
//
// 军师 99 分验收后批准单独立项（V488 太阳真值锁专项），4 个决策点裁决:
//   ① 三级（军师原报形态）**不升级为确定性修正**（保持只告警, 强改 = V484 类事故面）
//   ② 二/三级告警**长期在线开启**（作为「LLM 语义漂移」轻量探针）
//   ③ **仅 ZH**（EN/TH 未做同等密度取证前严禁推广）
//   ④ Prompt 侧加「非月段引用流年太阳必须带月份锚点」硬规则（只描述结构, 不给示例句）
// 军师三防线: 归属护栏不可松动 / 接线紧随 V485 且缓存 bump v499 / 注入自测必须真改源码。
//
// 病根: V485「只处理年内恒定的 5 颗外行星 —— 太阳等逐月变动的由 V482 月段锁负责」,
//       而 V482 作用域只有【月段】⇒ 非月段的流年太阳**两头都不管**(作用域真空)。
//       跨 2 盘实测: 可定位真值的非月段引用 9 处中 8 处错 = 89%。
//
// 纪律: 剥注释后再断言; 每条判据配注入自测(证明会红); 注入必须真的改变源码;
//      版本判据用单调判据不写死历史值; 真值源必须是 astroMatrix(不得从月标题反构)。
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

// 生产实测的高危复读句 / 被禁骨架 —— 严禁被本条 Prompt 规则复述（V462 教训: 反例会照抄）
const PROD_WORST = [
  '绝对禁止在这一期间进行任何重大的财务决策',
  '水星与冥王星的紧张相位则暗示着信息操控',
  '这个窗口期是行动的最佳时机',
];
const BANNED_SKELETON = ['重心落在', '这是你本月最适合'];

// ── 装载器（闭包只抽被引用到的声明 ⇒ 顶层常量靠传递闭包自动带出）──
function loadSun(source = src) {
  const { source: code } = closureDecls(source, ['lockYearlyNonMonthSunRef', 'auditYearlyNonMonthSunRef'], []);
  const logs = [];
  const ctx = { console: { log: (...a) => logs.push(a.map(String).join(' ')) }, __exports: {} };
  vm.createContext(ctx);
  vm.runInContext(code + '\n__exports.lock = lockYearlyNonMonthSunRef;'
    + '\n__exports.audit = auditYearlyNonMonthSunRef;', ctx);
  const api = ctx.__exports;
  api.logs = logs;
  return api;
}

// ── 构造盘（月号 → 太阳真值）。house 刻意与星座序号脱钩, 以便验证「宫位连改」──
const T = [
  [7, 'Cancer', 8], [8, 'Leo', 1], [9, 'Virgo', 2], [10, 'Libra', 11],
  [11, 'Scorpio', 4], [12, 'Sagittarius', 5], [1, 'Capricorn', 6], [2, 'Aquarius', 7],
  [3, 'Pisces', 4], [4, 'Aries', 9], [5, 'Taurus', 6], [6, 'Gemini', 11],
];
const ZH_SIGN = { Cancer: '巨蟹座', Leo: '狮子座', Virgo: '处女座', Libra: '天秤座', Scorpio: '天蝎座',
  Sagittarius: '射手座', Capricorn: '摩羯座', Aquarius: '水瓶座', Pisces: '双鱼座', Aries: '白羊座',
  Taurus: '金牛座', Gemini: '双子座' };
function mkMatrix() {
  return {
    months: T.map(([mo, sign, house]) => ({
      month_key: `${mo >= 7 ? 2026 : 2027}-${String(mo).padStart(2, '0')}`,
      sun: { sign, house },
    })),
  };
}

// 构造产物: 非月段（开篇语/第一章/第三章）+ 第二章 12 个月度章节（月段）
function mkDoc() {
  const L = [];
  L.push('## 开篇语：年度财富启示录');
  L.push('流年太阳在5月进入双子座第六宫，这是最佳窗口。');                    // → 金牛座第六宫(一级)
  L.push('流年太阳在2026年7月进入双子座第八宫，重点关注共享资源。');           // → 巨蟹座第八宫(一级)
  L.push('在2026年8月流年太阳在双子座第1宫，这是启动窗口。');                 // → 狮子座第1宫(一级·形态II)
  L.push('流年太阳在2026年7月进入双子座第11宫，2026年11月进入双子座第4宫。'); // → 巨蟹座第11宫 + 天蝎座第4宫(形态III)
  L.push('流年太阳在天秤座第11宫，2027年3月将激活你的田宅宫。');              // 军师原报形态 → 三级告警, 不改
  L.push('流年太阳在7月进入巨蟹座第八宫，深化合作信任。');                    // 已正确 → 零改动
  L.push('流年太阳在7月，你的本命太阳在天秤座第十一宫。');                    // 本命豁免
  L.push('流年太阳在7月，流年木星在8月进入双子座第3宫。');                    // 归属护栏(木星) → 不动
  L.push('流年太阳在双子座第八宫，你需要关注共享资源。');                      // 无锚点且非法 → 二级告警
  L.push('');
  L.push('## 第一章：你的财富基因图谱');
  L.push('流年太阳在10月进入狮子座第3宫，财路打开。');                        // → 天秤座第11宫(一级·宫位连改)
  L.push('');
  L.push('## 第二章：365天月度收入矩阵');
  for (const [mo, sg, hs] of T.map(([m, s, h]) => [m, ZH_SIGN[s], h])) {
    L.push(`### ${mo >= 7 ? 2026 : 2027}年${mo}月: 太阳${sg} 第${hs}宫 · 主题`);
    L.push(`本月${mo}月的财富概览正文。`);
    L.push('流年太阳在5月进入双子座第六宫。');                                 // 月段内 → 绝不许被改
  }
  L.push('');
  L.push('## 第三章：财富风险与机遇');
  L.push('在非月段再次提及：流年太阳在9月进入双子座第2宫，需要留意现金流。');   // → 处女座第2宫(一级)
  L.push('');
  return L.join('\n');
}

const DOC = mkDoc();
const M = mkMatrix();

// 把待测句装进「含 12 个月标题的最小骨架」的开篇语(非月段)。
// ⚠️ 必须这样装: 月段/非月段的判定依赖月标题(与 V482 同源口径),
//   孤立一句没有月标题 ⇒ 函数按设计拒答(heads < 2), 断言会假红。
function wrap(...lines) {
  const doc = [];
  doc.push('## 开篇语：测试骨架');
  doc.push(...lines);
  doc.push('');
  doc.push('## 第二章：365天月度收入矩阵');
  for (const [mo, sg, hs] of T.map(([m, s, h]) => [m, ZH_SIGN[s], h])) {
    doc.push(`### ${mo >= 7 ? 2026 : 2027}年${mo}月: 太阳${sg} 第${hs}宫 · 主题`);
    doc.push(`正文${mo}。`);
  }
  doc.push('');
  return doc.join('\n');
}

// ══════════════════════════════════════════════════════════════════════════
// ① 常量与护栏口径
// ══════════════════════════════════════════════════════════════════════════
test('① 护栏常量: 最大字距 24 / 本命词表齐备 / 真值源为月份太阳', () => {
  const code = stripComments(src);
  assert.ok(/const _V488_MAX_GAP = 24;/.test(code), '缺少字距上限常量 _V488_MAX_GAP=24');
  const natal = /const _V488_NATAL = (\/[^\n]*\/);/.exec(code);
  assert.ok(natal, '缺少本命词判据 _V488_NATAL');
  for (const w of ['本命', '出生', '原生', '本盘']) assert.ok(natal[1].includes(w), `本命词表缺「${w}」`);
  assert.ok(/m\.month_key/.test(code), '真值表未使用 month_key 作为月号真源');
  assert.ok(/m\.positions && m\.positions\.Sun/.test(code), '真值源未兼容 m.positions.Sun 形态');
});

// ══════════════════════════════════════════════════════════════════════════
// ② 一级纠正: 三类语序 + 宫位连改
// ══════════════════════════════════════════════════════════════════════════
test('② 一级纠正: 三类语序都能按前置月份真值改写星座', () => {
  const { lock } = loadSun();
  const r = lock(DOC, 'zh', M, 'yearly');
  assert.ok(r.includes('金牛座第六宫'), '形态 I（月份居中）未按 5 月真值改写');
  assert.ok(r.includes('巨蟹座第八宫'), '形态 I（带年份）未按 7 月真值改写');
  assert.ok(r.includes('狮子座第1宫'), '形态 II（月份前缀）未按 8 月真值改写');
  assert.ok(r.includes('巨蟹座第8宫'), '形态 III（承前省略）第一处未按 7 月真值改写');
  assert.ok(r.includes('天蝎座第4宫'), '形态 III 第二处未按 11 月真值改写');
  assert.ok(r.includes('处女座第2宫'), '第三章非月段引用未按 9 月真值改写');
  // 纠正后不得残留原错误值(月段内那 12 行按设计原样保留, 见 ⑥, 此处只查非月段)
  assert.ok(r.includes('流年太阳在5月进入金牛座第六宫'), '5 月引用星座未改净(非月段)');
  assert.ok(!/在2026年8月流年太阳在双子座/.test(r), '8 月引用星座未改净');
});

test('②b 星座改了必须连宫位一起改(半改不一致 = 事故)', () => {
  const { lock } = loadSun();
  const r = lock(wrap('流年太阳在10月进入狮子座第3宫，财路打开。'), 'zh', M, 'yearly');
  // 10 月真值 = 天秤座 第11宫 ⇒ 星座与宫位都必须换
  assert.ok(r.includes('天秤座第11宫'), `宫位未连改 → ${r}`);
  assert.ok(!r.includes('第3宫'), `宫位残留旧值 → ${r}`);
});

// ══════════════════════════════════════════════════════════════════════════
// ③ 三级（军师原报形态）: 只告警、绝不改
// ══════════════════════════════════════════════════════════════════════════
test('③ 军师原报形态「…天秤座第11宫，2027年3月将激活田宅宫」必须只告警不改', () => {
  const { lock, audit } = loadSun();
  const s = '流年太阳在天秤座第11宫，2027年3月将激活你的田宅宫。';
  const doc = wrap(s);
  assert.strictEqual(lock(doc, 'zh', M, 'yearly'), doc, '后置月份被误当入座时间 ⇒ 语义撕裂(V484 类事故面)');
  const a = audit(doc, 'zh', M, 'yearly');
  assert.ok(a.warn3 >= 1, `三级审计未告警(应识别出 3 月真值=${ZH_SIGN.Pisces}第4宫 与引用冲突) → ${JSON.stringify(a)}`);
  assert.strictEqual(a.fixed, 0, '审计函数不得产生修正');
});

// ══════════════════════════════════════════════════════════════════════════
// ④ 二/三级审计: 只检不改
// ══════════════════════════════════════════════════════════════════════════
test('④ 二级审计: 无前置锚点且值不属本年度真值集合 ⇒ 告警且不改', () => {
  const { lock, audit } = loadSun();
  const doc = wrap('流年太阳在双子座第八宫，你需要关注共享资源。');
  assert.strictEqual(lock(doc, 'zh', M, 'yearly'), doc, '二级审计不得修改文本');
  assert.ok(audit(doc, 'zh', M, 'yearly').warn2 >= 1, '二级审计漏报(双子座第8宫不属任何月份真值)');
});

test('④b 二级审计不得误报合规值(无月份锚点但值合法)', () => {
  const { audit } = loadSun();
  const a = audit(wrap('流年太阳在巨蟹座第八宫，这是共享资源宫位。'), 'zh', M, 'yearly');
  assert.strictEqual(a.warn2, 0, `误报了合法值 → ${JSON.stringify(a.log)}`);
  assert.strictEqual(a.warn3, 0, '误报了三级');
});

test('④c 审计长期开启: 锁函数内联执行审计并打印日志(军师决策②)', () => {
  const { lock, logs } = loadSun();
  lock(DOC, 'zh', M, 'yearly');
  assert.ok(logs.some((l) => /\[V488\]/.test(l) && /真值锁/.test(l)), '锁函数未打印一级纠正日志');
  assert.ok(logs.some((l) => /\[V488-AUDIT\]/.test(l)), '锁函数未内联执行二/三级审计日志(决策②要求长期开启)');
});

// ══════════════════════════════════════════════════════════════════════════
// ⑤ 归属护栏 + 本命豁免 + 字距上限
// ══════════════════════════════════════════════════════════════════════════
test('⑤ 归属护栏: 引用前最近行星名非「太阳」时绝不许改', () => {
  const { lock, audit } = loadSun();
  for (const s of [
    '流年太阳在7月，流年木星在8月进入双子座第3宫。',
    '流年太阳在7月，流年火星在8月进入双子座第3宫。',
  ]) {
    const doc = wrap(s);
    assert.strictEqual(lock(doc, 'zh', M, 'yearly'), doc, `误伤了其它行星的引用 → ${s}`);
    assert.strictEqual(audit(doc, 'zh', M, 'yearly').warn2, 0, '归属护栏未挡住审计误报');
  }
});

test('⑤b 本命豁免: 「本命太阳」即使带月份锚点也不得改', () => {
  const { lock } = loadSun();
  const s = '流年太阳在7月，你的本命太阳在天秤座第十一宫。';
  assert.strictEqual(lock(wrap(s), 'zh', M, 'yearly'), wrap(s), '本命太阳被流年真值污染');
  const s2 = '流年太阳在7月，出生太阳在双子座第3宫。';
  assert.strictEqual(lock(wrap(s2), 'zh', M, 'yearly'), wrap(s2), '「出生」定语未豁免');
});

test('⑤c 字距上限: 月份锚点距引用 > 24 字 ⇒ 不配对(防句内远月错配)', () => {
  const { lock } = loadSun();
  const s = '流年太阳在7月，接下来的三十天里你需要重新审视所有与合伙人的资金往来和账目细节，最后太阳在双子座第八宫。';
  assert.strictEqual(lock(wrap(s), 'zh', M, 'yearly'), wrap(s), '超距锚点被误配对');
});

// ══════════════════════════════════════════════════════════════════════════
// ⑥ 作用域: 月段绝不许动; 非 yearly / 非 zh 绝不许动
// ══════════════════════════════════════════════════════════════════════════
test('⑥ 月段（第二章 12 个月度章节）不在作用域内, 一字不许改', () => {
  const { lock, audit } = loadSun();
  const r = lock(DOC, 'zh', M, 'yearly');
  // 月段内那 12 句错误引用必须原样保留（月段归 V482 管）
  const inner = (r.match(/流年太阳在5月进入双子座第六宫。\n/g) || []).length;
  assert.ok(inner >= 12, `月段内引用被越界改写(应保留 ≥12 行, 实得 ${inner})`);
  // 对照: 非月段那句同类错误必须被改掉
  assert.ok(r.includes('流年太阳在5月进入金牛座第六宫'), '非月段同类引用未纠正');
});

test('⑥b 护栏: 非 yearly / 非 zh / 月份不足 ⇒ 原样返回', () => {
  const { lock, audit } = loadSun();
  const s = '流年太阳在5月进入双子座第六宫。';
  assert.strictEqual(lock(s, 'zh', M, 'monthly'), s, '月报不该被处理');
  assert.strictEqual(lock(s, 'en', M, 'yearly'), s, '非 zh 不该被处理(军师决策③ 仅 ZH)');
  assert.strictEqual(audit(s, 'en', M, 'yearly'), null, '非 zh 审计应返回 null');
  assert.strictEqual(lock(s, 'zh', { months: [{}] }, 'yearly'), s, '月份不足时不该被处理');
});

// ══════════════════════════════════════════════════════════════════════════
// ⑦ 真值源纪律: 必须取自 astroMatrix, 不得从月标题反构
// ══════════════════════════════════════════════════════════════════════════
test('⑦ 真值源必须是 astroMatrix.months[i].sun —— 月标题写错也不影响纠正值', () => {
  const { lock } = loadSun();
  // 故意把 5 月标题写成「白羊座 第1宫」(错), 矩阵真值为 金牛座 第6宫
  const doc = ['## 第一章：总览', '流年太阳在5月进入双子座第六宫。', '',
    '### 2026年5月: 太阳白羊座 第1宫 · 主题', '正文。', '',
    '### 2026年6月: 太阳双子座 第11宫 · 主题', '正文。'].join('\n');
  const r = lock(doc, 'zh', M, 'yearly');
  assert.ok(r.includes('金牛座第六宫'), `未按矩阵真值纠正(疑从月标题反构) → ${r}`);
  assert.ok(!r.includes('白羊座第六宫'), '被错误的月标题真值带偏');
  // 月标题行本身不得被动
  assert.ok(r.includes('### 2026年5月: 太阳白羊座 第1宫 · 主题'), '月标题行被越界改写');
});

// ══════════════════════════════════════════════════════════════════════════
// ⑧ 幂等 / 行数守恒 / diff 白名单(只改星座词与宫位词)
// ══════════════════════════════════════════════════════════════════════════
test('⑧ 幂等 + 行数守恒', () => {
  const { lock } = loadSun();
  const once = lock(DOC, 'zh', M, 'yearly');
  const twice = lock(once, 'zh', M, 'yearly');
  assert.strictEqual(twice, once, '非幂等');
  assert.strictEqual(once.split('\n').length, DOC.split('\n').length, '行数不守恒(会破坏下游索引)');
});

test('⑧b diff 白名单: 改动只允许落在星座词与宫位词上', () => {
  const { lock } = loadSun();
  const out = lock(DOC, 'zh', M, 'yearly');
  const norm = (s) => s
    .replace(/[白羊金牛双子巨蟹狮子处女天秤天蝎射手摩羯水瓶双鱼]座?/g, '#SIGN#')
    .replace(/第\s*(?:\d+|[一二三四五六七八九十]{1,3})\s*宫/g, '#HOUSE#');
  const a = DOC.split('\n'), b = out.split('\n');
  let diffs = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] === b[i]) continue;
    diffs++;
    assert.strictEqual(norm(a[i]), norm(b[i]),
      `第 ${i + 1} 行出现星座/宫位以外的改动(V484 类造词风险):\n  IN : ${a[i]}\n  OUT: ${b[i]}`);
  }
  assert.ok(diffs >= 6, `预期至少 6 行被一级纠正, 实得 ${diffs}`);
});

// ══════════════════════════════════════════════════════════════════════════
// ⑨ 接线: 4 处, 且必须紧随 lockYearlyOuterPlanetsYear(V485)
// ══════════════════════════════════════════════════════════════════════════
test('⑨ 接线 4 处, 且每处紧随 lockYearlyOuterPlanetsYear 之后', () => {
  const code = stripComments(src);
  const all = code.match(/lockYearlyNonMonthSunRef\(/g) || [];
  assert.ok(all.length >= 5, `lockYearlyNonMonthSunRef 应为 1 定义 + ≥4 接线, 实得 ${all.length}`);
  const wired = code.match(/lockYearlyOuterPlanetsYear\([^\n]*\);\s*\n\s*(?:if \(ft\) )?\w+ = lockYearlyNonMonthSunRef\(/g) || [];
  assert.ok(wired.length >= 4, `应有 4 处紧邻 V485 的接线, 实得 ${wired.length}`);
  // 接线必须在 V485 之后、清理器之前(次序错误会让纠正被后续环节冲掉)
  const i485 = code.indexOf('streamText = lockYearlyOuterPlanetsYear');
  const i488 = code.indexOf('streamText = lockYearlyNonMonthSunRef');
  const iLeak = code.indexOf('streamText = stripYearlyPromptLeakage');
  assert.ok(i485 >= 0 && i488 > i485 && iLeak > i488, '流式链路次序错误: 必须 V485 → V488 → 清理器');
});

// ══════════════════════════════════════════════════════════════════════════
// ⑩ Prompt 侧(军师决策④) + 决策③(仅 ZH)
// ══════════════════════════════════════════════════════════════════════════
test('⑩ Prompt: zh 含「非月段引用流年太阳必须带月份锚点」结构规则(不含可照抄范例)', () => {
  // ⚠️ 本判据只断言**意图**(不锁旧原句): V488c 收紧 4d 措辞后, 原句级断言会假红。
  assert.ok(/V488[^\n]{0,12}机械判据/.test(ZH), 'zh Prompt 缺少 V488 机械判据标记');
  assert.ok(/非月度章节/.test(ZH), 'zh Prompt 未定义「非月度章节」');
  assert.ok(/必须在该次?引用之前紧邻处(?:显式)?给出对应的发生月份/.test(ZH), 'zh Prompt 缺「前置月份锚点」硬规则');
  assert.ok(/(严禁把本命太阳的星座套用到流年太阳上|严禁借用本命太阳)/.test(ZH), 'zh Prompt 缺「Transit/Natal 漂移」禁令');
  assert.ok(/本规则只约束[^\n]{0,16}不提供任何可照抄的句子/.test(ZH), 'zh Prompt 缺自保护声明');
  for (const bad of PROD_WORST) assert.ok(!ZH.includes(bad), `zh Prompt 出现生产复读句面「${bad.slice(0, 14)}…」`);
  for (const bad of BANNED_SKELETON) assert.ok(!ZH.includes(bad), `zh Prompt 复述了被禁骨架「${bad}」`);
});

test('⑩b 决策③: EN/TH 不得出现 V488 规则(未做同等密度取证前严禁推广)', () => {
  assert.ok(!/V488/.test(EN), 'EN Prompt 出现了 V488 规则 —— 越界推广');
  assert.ok(!/V488/.test(TH), 'TH Prompt 出现了 V488 规则 —— 越界推广');
});

// ══════════════════════════════════════════════════════════════════════════
// ⑪ 缓存版本(单调判据) + V485 既有能力未被破坏
// ══════════════════════════════════════════════════════════════════════════
test('⑪ 缓存版本必须 ≥ V488 基线 499(单调判据, 防每次 bump 假红)', () => {
  const vers = [...stripComments(src).matchAll(/wealth:v(\d+):/g)].map((m) => Number(m[1]));
  assert.ok(vers.length >= 3, `应有多处缓存 key, 实得 ${vers.length}`);
  const cur = Math.max(...vers);
  assert.ok(cur >= 499, `当前缓存版本应 ≥499(输出链已变更), 实得 v${cur}`);
  assert.ok(vers.filter((v) => v === cur).length >= 3, `当前版本 v${cur} 应出现在 3 处缓存 key`);
});

test('⑪b V485 外行星锁与 V485b 清理器未被 V488 挤掉', () => {
  const code = stripComments(src);
  assert.ok(/function lockYearlyOuterPlanetsYear\(/.test(code), 'V485 外行星锁丢失');
  assert.ok(/function stripYearlyPromptLeakage\(/.test(code), 'V485b 清理器丢失');
  assert.ok(/const _V485_OUTER_KEYS = \['Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'\]/.test(code),
    'V485 外行星白名单被改动(太阳等逐月行星不得混入)');
});

// ══════════════════════════════════════════════════════════════════════════
// ⑫ 注入缺陷自测 —— 每条都必须「注入后判据变红」(且必须真的改源码)
// ══════════════════════════════════════════════════════════════════════════
test('【注入】去掉归属护栏(太阳) → ⑤ 必须红', () => {
  const degraded = src.replace(
    "        if (!lp || lp.name !== '太阳') return false;                                     // ③ 归属护栏",
    '        if (!lp) return false;');
  assert.notStrictEqual(degraded, src, '注入必须真的改变源码');
  const { lock } = loadSun(degraded);
  const doc = wrap('流年太阳在7月，流年木星在8月进入双子座第3宫。');
  assert.notStrictEqual(lock(doc, 'zh', M, 'yearly'), doc, '注入后 ⑤ 判据应命中失败(木星引用被误改)');
});

test('【注入】允许任意锚点(不要求前置) → ③ 必须红', () => {
  const degraded = src.replace(
    'for (const x of anchors) if (x.end <= ref.start && (!a || x.end > a.end)) a = x;',
    'for (const x of anchors) if (!a || x.end > a.end) a = x;');
  assert.notStrictEqual(degraded, src, '注入必须真的改变源码');
  const { lock } = loadSun(degraded);
  const doc = wrap('流年太阳在天秤座第11宫，2027年3月将激活你的田宅宫。');
  assert.notStrictEqual(lock(doc, 'zh', M, 'yearly'), doc, '注入后 ③ 判据应命中失败(后置月份被误当入座时间)');
});

test('【注入】去掉本命豁免 → ⑤b 必须红', () => {
  const degraded = src.replace(
    /if \(_V488_NATAL\.test\(str\.slice\(Math\.max\(0, lp\.idx - 2\), lp\.idx\)\)\) return false;.*\n/,
    '');
  assert.notStrictEqual(degraded, src, '注入必须真的改变源码');
  const { lock } = loadSun(degraded);
  const doc = wrap('流年太阳在7月，你的本命太阳在天秤座第十一宫。');
  assert.notStrictEqual(lock(doc, 'zh', M, 'yearly'), doc, '注入后 ⑤b 判据应命中失败(本命太阳被污染)');
});

test('【注入】真值宫位清零 → ②b 必须红(宫位连改失效)', () => {
  const degraded = src.replace(
    'truth.set(mo, { sign: signs[zi], house: Number(sun.house) || 0 });',
    'truth.set(mo, { sign: signs[zi], house: 0 });');
  assert.notStrictEqual(degraded, src, '注入必须真的改变源码');
  const { lock } = loadSun(degraded);
  const r = lock(wrap('流年太阳在10月进入狮子座第3宫，财路打开。'), 'zh', M, 'yearly');
  assert.ok(r.includes('第3宫'), '注入后 ②b 判据应命中失败(宫位未随星座连改)');
});

test('【注入】真值源改成从月标题反构 → ⑦ 必须红', () => {
  // ⚠️ 该语句在 server.js 出现两处(月标题锁也算同一形态) ⇒ 必须全局替换, 否则只改到前者、V488 未被注入
  const degraded = src.replace(
    /const sun = \(m && \(m\.sun \|\| \(m\.positions && m\.positions\.Sun\)\)\) \|\| null;/g,
    'const sun = (m && m._titleSun) || null;');
  assert.notStrictEqual(degraded, src, '注入必须真的改变源码');
  const { lock } = loadSun(degraded);
  // 矩阵无 _titleSun ⇒ 真值表为空 ⇒ 一行都不改(不再按矩阵纠正)
  const r = lock(wrap('流年太阳在5月进入双子座第六宫。'), 'zh', M, 'yearly');
  assert.ok(!r.includes('金牛座第六宫'), '注入后 ⑦ 判据应命中失败(真值源被换掉)');
});

test('【注入】摘掉一处接线 → ⑨ 必须红', () => {
  const degraded = src.replace(
    /\s*if \(ft\) ft = lockYearlyNonMonthSunRef\(ft, lang, astroMatrix, reportType\);[^\n]*\n/, '\n');
  assert.notStrictEqual(degraded, src, '注入必须真的改变源码(接线行未找到)');
  const code = stripComments(degraded);
  const wired = code.match(/lockYearlyOuterPlanetsYear\([^\n]*\);\s*\n\s*(?:if \(ft\) )?\w+ = lockYearlyNonMonthSunRef\(/g) || [];
  assert.ok(wired.length < 4, `注入后 ⑨ 判据应命中失败(实得 ${wired.length})`);
});

test('【注入】缓存版本降级一档 → ⑪ 必须红', () => {
  const cur = Math.max(...[...stripComments(src).matchAll(/wealth:v(\d+):/g)].map((m) => Number(m[1])));
  const degraded = src.replace(new RegExp(`wealth:v${cur}:`, 'g'), `wealth:v${cur - 1}:`);
  assert.notStrictEqual(degraded, src, '注入必须真的改变源码');
  const vers = [...stripComments(degraded).matchAll(/wealth:v(\d+):/g)].map((m) => Number(m[1]));
  assert.ok(Math.max(...vers) < cur, `注入后版本应低于当前版本 v${cur}(实得 v${Math.max(...vers)})`);
});

test('【注入】把 V488 规则写进 EN → ⑩b 必须红(决策③ 护栏)', () => {
  const degradedEN = EN + '\n[V488 机械判据] 非月度章节引用流年太阳必须带月份锚点。\n';
  assert.notStrictEqual(degradedEN, EN, '注入必须真的改变源码');
  assert.ok(/V488/.test(degradedEN), '注入后 ⑩b 判据应命中失败');
});

test('【注入】Prompt 规则里塞入生产复读句 → ⑩ 必须红', () => {
  const degradedZH = ZH + '\n' + PROD_WORST[0] + '\n';
  assert.notStrictEqual(degradedZH, ZH, '注入必须真的改变源码');
  assert.ok(PROD_WORST.some((b) => degradedZH.includes(b)), '注入后 ⑩ 判据应命中失败');
});
