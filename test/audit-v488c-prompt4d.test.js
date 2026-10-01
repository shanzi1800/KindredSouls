// ═══════════════════════════════════════════════════════════════════════
// 🛡️ V488c: 年报 Prompt 4d 收紧（非月度章节「流年太阳」逐次锚定）—— 回归闸门
// 🛡️ V488d: 4d-6「归纳段剪枝」—— 思路从「管住引用」切换为「减少引用面」
//
// 军师裁决: 批准单独立小项收紧 Prompt 4d（**绝不动 Server 强锁**）。
// 病根证据（2026-10-01 线上 20 盘抽样, V489 前置观测副产物）:
//   审计探针命中 **10 处二级告警 / 6 盘(30%)** —— 全部形态 = 「无前置月份锚点」的流年太阳引用。
//   逐字取证两例: ① 同星座双宫位互斥（双子座第4宫…双子座第7宫）⇒ 真值上必有一错;
//                 ② 本命位复制成流年位（本命太阳在天秤座第5宫 → 流年太阳在天秤座第5宫）。
//   无锚点 ⇒ 后锁**不可判**（V488 设计如此: 无月份 ⇒ 不能确定性推导真值）⇒ 只能靠 Prompt 前堵。
//
// V488d 立项依据（2026-10-01「同版本 3 批」噪声带）:
//   同版本 v501 三批合计 = 11/7/7（均值 8.3±2.3, 极差 7~11）⇒ **单批 20 盘无分辨力**
//   （两组小计数之差的标准误≈4.3, 上轮「10→11」仅 0.22σ, 不可判）。
//   病灶逐字定位: 第三章段落形态 = 「X元素通道：{星座}的…」, 段内密集出现星座名（本命元素归类）
//   ⇒ LLM 把「元素通道标题的星座」与「上一句复述的宫位真值」**缝合成假坐标**
//   （S01: 正确句「2026年7月→巨蟹座第4宫」; 紧邻幻觉句「流年太阳在双子座第4宫」= sign 异源、house 沿用 7 月）。
//   ⇒ 试图靠「强制带锚点」规范归纳段修辞 = 与自由叙事本能对抗（高成本低收益）
//   ⇒ 改为**剪枝引用面**: 归纳段禁止罗列坐标, 坐标只许紧邻锚点出现。
//
// 判据设计（关键: 单调判据本身可被"关掉探针"绕过 ⇒ 必须配灵敏度对照）:
//   ① Prompt 结构判据: 4d-1..4d-6 六条机械判据齐全; 且**块内不得出现任何星座名/示例词**（V462 教训）
//   ② 探针「只降不升」单调判据: 6 盘真实夹具（收紧前基线 10 处）命中数 ≤ 基线
//   ②b 探针灵敏度对照: 合成「无锚点非法引用」样本必须至少触发 1 处告警
//       —— 这一条是 ② 的守护者: 没有它, 把 warn2 计数改成 0 也能让 ② 变绿(假绿)
//   ③ 缓存版本 ≥ 501（Prompt 变更必须 bump, 否则旧缓存继续返回旧文风）
//   ④ 仅 ZH: EN/TH 不得出现本条判据字样（军师决策③: 未做同等密度取证前严禁跨语言推广）
//
// 纪律: 每条判据配注入自测且注入必须**真的改变源码/提示词**; 版本用单调判据不写死。
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

// ── 4d 块提取（只取本条规则, 边界为 4d. 起 / 5. 止）──
function extract4d(text) {
  const lines = text.split('\n');
  const s = lines.findIndex((l) => /^\s*4d\.\s*【非月度章节引用流年太阳/.test(l));
  if (s < 0) return null;
  let e = lines.length;
  for (let i = s + 1; i < lines.length; i++) if (/^\s*5\.\s*【本规则不提供范例】/.test(lines[i])) { e = i; break; }
  return lines.slice(s, e).join('\n');
}
const ZH_4D = extract4d(ZH);

const SIGN_WORDS = /(白羊|金牛|双子|巨蟹|狮子|处女|天秤|天蝎|射手|摩羯|水瓶|双鱼)座/;

// Prompt 结构判据（独立函数 ⇒ 可被注入自测复用）
function assert4dStructure(block) {
  assert.ok(block, '未找到 4d 规则块（非月度章节·流年太阳）');
  for (const k of ['4d-1', '4d-2', '4d-3', '4d-4', '4d-5', '4d-6']) {
    assert.ok(block.includes(k), `Prompt 4d 缺机械判据 ${k}`);
  }
  assert.ok(/逐次锚定/.test(block), '4d-1 缺「逐次锚定」（每次出现都要锚点）');
  assert.ok(/禁止无月份罗列/.test(block), '4d-2 缺「禁止无月份罗列」');
  assert.ok(/同一个太阳星座只允许给出一个宫位/.test(block), '4d-3 缺「同星座单宫位」逻辑判据');
  assert.ok(/本命与流年严禁混同/.test(block), '4d-4 缺「本命/流年严禁混同」');
  assert.ok(/与该月份的真实天象一致/.test(block), '4d-5 缺「锚定后真值一致」');
  // 4d-6（V488d 剪枝）: 归纳段禁坐标 —— 从「管住引用」转为「减少引用面」
  assert.ok(/元素与主题归纳段禁止罗列坐标/.test(block), '4d-6 缺「归纳段禁止罗列坐标」剪枝判据');
  assert.ok(/只能作趋势性归纳/.test(block), '4d-6 缺「仅允许趋势性归纳」');
  assert.ok(/不得把流年太阳的落点写进归纳句/.test(block), '4d-6 缺「归纳句不得写落点」');
  assert.ok(!SIGN_WORDS.test(block), '❌ 4d 块内出现星座名 —— 等价于给了可照抄的示例句（V462 教训）');
  assert.ok(!/(例如|示例|举例如|如：)/.test(block), '❌ 4d 块内出现示例引导词（会诱导 LLM 照抄）');
}

// ── 生产审计探针（离线加载, 与线上同一份 server.js）──
function loadAudit(source = src) {
  const { source: code } = closureDecls(source, ['lockYearlyNonMonthSunRef', 'auditYearlyNonMonthSunRef'], []);
  const ctx = { console: { log: () => {} }, __exports: {} };
  vm.createContext(ctx);
  vm.runInContext(code + '\n__exports.lock = lockYearlyNonMonthSunRef;'
    + '\n__exports.audit = auditYearlyNonMonthSunRef;', ctx);
  return ctx.__exports;
}

const ZH_SIGN_LIST = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座',
  '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'];
const EN_SIGN_LIST = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio',
  'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
// 真值矩阵从月标题反构（与 verify_v488_online.mjs / sample_v489_months.mjs 同口径）
function matrixFromHeads(text) {
  const months = [];
  const seen = new Set();
  text.split('\n').forEach((l) => {
    const m = l.match(/^#{1,6}\s*(\d{4})年(\d{1,2})月[^\n]*?太阳\s*([\u4e00-\u9fa5]{2,3}座)\s*第\s*(\d+)\s*宫/);
    if (!m) return;
    const key = Number(m[1]) * 12 + Number(m[2]);
    if (seen.has(key)) return;
    seen.add(key);
    const zi = ZH_SIGN_LIST.indexOf(m[3]);
    if (zi >= 0) months.push({ month_key: `${m[1]}-${String(m[2]).padStart(2, '0')}`, sun: { sign: EN_SIGN_LIST[zi], house: Number(m[4]) } });
  });
  return { months };
}
function alarms(text, source = src) {
  const a = loadAudit(source).audit(text, 'zh', matrixFromHeads(text), 'yearly');
  return a ? { warn2: a.warn2, warn3: a.warn3, total: a.warn2 + a.warn3 } : { warn2: 0, warn3: 0, total: 0 };
}

// ── 夹具: 收紧前命中的 6 盘真实线上产物（2026-10-01, 部署 fd1f755f = V488b）──
const FIX_DIR = path.join(__dirname, 'fixtures', 'v489-prompt4d');
const BASELINE = {
  'S06_1988-12-01.txt': 1,
  'S07_1972-04-17.txt': 1,
  'S12_1993-10-02.txt': 1,
  'S13_1969-03-21.txt': 3,
  'S15_1975-12-25.txt': 2,
  'S20_1963-08-08.txt': 2,
};
const BASELINE_TOTAL = Object.values(BASELINE).reduce((a, b) => a + b, 0);   // = 10
const fixtures = fs.readdirSync(FIX_DIR).filter((f) => f.endsWith('.txt'));

// ── 灵敏度对照样本: 含 12 个月标题的骨架 + 1 处「无锚点且不属真值集合」的流年太阳引用 ──
const CTRL_MATRIX = {
  months: [[7, 'Cancer', 8], [8, 'Leo', 1], [9, 'Virgo', 2], [10, 'Libra', 11], [11, 'Scorpio', 4], [12, 'Sagittarius', 5],
    [1, 'Capricorn', 6], [2, 'Aquarius', 7], [3, 'Pisces', 4], [4, 'Aries', 9], [5, 'Taurus', 6], [6, 'Gemini', 11]]
    .map(([mo, sign, house]) => ({ month_key: `${mo >= 7 ? 2026 : 2027}-${String(mo).padStart(2, '0')}`, sun: { sign, house } })),
};
const CTRL_DOC = (() => {
  const L = ['## 开篇语：测试骨架'];
  L.push('流年太阳在双子座第八宫，你需要重新配置共享资源。');    // 无前置月份锚点 + 不属真值集合 ⇒ 必须告警
  L.push('');
  L.push('## 第二章：365天月度收入矩阵');
  for (const m of CTRL_MATRIX.months) {
    const zi = EN_SIGN_LIST.indexOf(m.sun.sign);
    L.push(`### ${m.month_key.slice(0, 4)}年${Number(m.month_key.slice(5))}月: 太阳${ZH_SIGN_LIST[zi]} 第${m.sun.house}宫 · 主题`);
    L.push('正文。');
  }
  return L.join('\n');
})();

// ══════════════════════════════════════════════════════════════════════
// ① Prompt 结构判据
// ══════════════════════════════════════════════════════════════════════
test('① Prompt 4d 块含 5 条机械判据, 且无星座名/示例词', () => {
  assert4dStructure(ZH_4D);
});

test('①b 4d 块必须显式点出两类线上 Badcase 的逻辑违规（同星座双宫位 / 本命混同）', () => {
  assert.ok(/先后给出两个不同宫位/.test(ZH_4D), '未点明「同星座先后给出两个不同宫位」违规');
  assert.ok(/借用本命太阳/.test(ZH_4D), '未点明「借用本命太阳数值」违规');
  assert.ok(/孤立断言/.test(ZH_4D), '未点明「孤立断言」（无月份罗列）违规');
});

test('④ 仅 ZH: EN/TH 不得出现本条判据字样（军师决策③）', () => {
  for (const [name, txt] of [['EN', EN], ['TH', TH]]) {
    assert.ok(!/逐次锚定|4d-1|V488c/.test(txt), `${name} 提示词混入了 ZH 专有判据`);
  }
});

// ══════════════════════════════════════════════════════════════════════
// ② 探针「只降不升」单调判据（夹具 = 收紧前 6 盘真实产物）
// ══════════════════════════════════════════════════════════════════════
test('② 夹具齐备且逐盘命中数 ≤ 收紧前基线（单调判据: 只降不升）', () => {
  assert.strictEqual(fixtures.length, Object.keys(BASELINE).length, '夹具数量与基线表不符');
  let total = 0;
  for (const f of fixtures) {
    const text = fs.readFileSync(path.join(FIX_DIR, f), 'utf8');
    const n = alarms(text).total;
    total += n;
    assert.ok(n <= BASELINE[f], `${f} 探针命中上升到 ${n}（基线 ${BASELINE[f]}）—— 只降不升被破坏`);
  }
  assert.ok(total <= BASELINE_TOTAL, `夹具探针命中总数 ${total} > 基线 ${BASELINE_TOTAL}`);
});

test('②b 探针灵敏度对照: 无锚点非法引用必须触发告警（防"关掉探针"式假绿）', () => {
  const n = alarms(CTRL_DOC).total;
  assert.ok(n >= 1, `合成对照样本未触发任何告警 ⇒ 探针被静默关闭或失效（实得 ${n}）`);
});

// ══════════════════════════════════════════════════════════════════════
// ③ 缓存版本（Prompt 变更必须 bump; 单调判据, 不写死历史值）
// ══════════════════════════════════════════════════════════════════════
test('③ 缓存版本 ≥ 502（Prompt 变更必须 bump, 防旧文风缓存复用）', () => {
  const vers = [...stripComments(src).matchAll(/wealth:v(\d+):/g)].map((m) => Number(m[1]));
  const cur = Math.max(...vers);
  assert.ok(cur >= 502, `当前缓存版本应 ≥502, 实得 v${cur}`);
});

// ══════════════════════════════════════════════════════════════════════
// 注入缺陷自测（每条都真的改变源码/提示词, 且证明会红）
// ══════════════════════════════════════════════════════════════════════
test('【注入】删除 4d-3（同星座单宫位判据）→ ① 必须红', () => {
  const degraded = ZH_4D.replace(/^\s*4d-3\..*$/m, '');
  assert.notStrictEqual(degraded, ZH_4D, '注入必须真的改变提示词');
  assert.throws(() => assert4dStructure(degraded), /缺机械判据 4d-3|同一个太阳星座/);
});

test('【注入】删除「逐次锚定」语义 → ① 必须红', () => {
  // ⚠️ 必须全局替换: 「逐次锚定」在 4d 块内出现两次(标题 + 4d-1),
  //    String.replace 只改第一处 ⇒ 注入没打穿判据 ⇒ 自测假绿(已踩过一次)。
  const degraded = ZH_4D.replaceAll('逐次锚定', '按月参考');
  assert.notStrictEqual(degraded, ZH_4D, '注入必须真的改变提示词');
  assert.ok(!degraded.includes('逐次锚定'), '注入未清干净(仍残留同名短语)');
  assert.throws(() => assert4dStructure(degraded));
});

test('【注入】往 4d 块塞入星座名（等价给了可照抄示例句）→ ① 必须红', () => {
  const degraded = ZH_4D + '\n  例如：流年太阳在双子座第八宫。';
  assert.notStrictEqual(degraded, ZH_4D, '注入必须真的改变提示词');
  assert.throws(() => assert4dStructure(degraded), /星座名|示例引导词/);
});

test('【注入】整段删除 4d 规则 → ① 必须红', () => {
  const degraded = ZH.replace(/\n\s*4d\.[\s\S]*?(?=\n\s*5\.\s*【本规则不提供范例】)/, '');
  assert.notStrictEqual(degraded, ZH, '注入必须真的改变提示词');
  assert.strictEqual(extract4d(degraded), null, '删除后仍能提取到 4d 块');
  assert.throws(() => assert4dStructure(extract4d(degraded)));
});

test('【注入】把二级告警分支关掉（validSet 判定恒假）→ ②b 必须红', () => {
  const degraded = src.replace('if (!validSet.has(dup)) {', 'if (false) {');
  assert.notStrictEqual(degraded, src, '注入必须真的改变源码');
  const n = alarms(CTRL_DOC, degraded).total;
  assert.strictEqual(n, 0, '注入后探针仍报警 ⇒ 注入未命中目标分支');
  // 对照: 原源码同一对照样本必须 ≥1 ⇒ 证明 ②b 判据真的能区分
  assert.ok(alarms(CTRL_DOC).total >= 1, '原源码对照样本也应告警');
});

test('【注入】缓存版本降到基线之下 → ③ 必须红', () => {
  // ⚠️ 动态基线: 写死数值会在下次 bump 时立刻假红(已踩过三次)
  const cur0 = Math.max(...[...stripComments(src).matchAll(/wealth:v(\d+):/g)].map((m) => Number(m[1])));
  const degraded = src.replace(/wealth:v(\d+):/g, `wealth:v${cur0 - 4}:`);
  assert.notStrictEqual(degraded, src, '注入必须真的改变源码');
  const cur = Math.max(...[...stripComments(degraded).matchAll(/wealth:v(\d+):/g)].map((m) => Number(m[1])));
  assert.ok(cur < cur0, `注入后版本应低于当前基线 v${cur0}（实得 v${cur}）`);
});

// ── V488d 剪枝（4d-6）注入自测 ──
test('【注入】删除 4d-6（归纳段禁坐标剪枝）→ ① 必须红', () => {
  const degraded = ZH_4D.replace(/^\s*4d-6\..*$/m, '');
  assert.notStrictEqual(degraded, ZH_4D, '注入必须真的改变提示词');
  assert.ok(!degraded.includes('4d-6'), '注入未清干净(仍残留 4d-6 标记)');
  assert.throws(() => assert4dStructure(degraded), /缺机械判据 4d-6|归纳段禁止罗列坐标/);
});

test('【注入】把 4d-6 的「只能作趋势性归纳」反转成「可直接罗列坐标」→ ① 必须红', () => {
  const degraded = ZH_4D.replaceAll('只能作趋势性归纳', '可以直接罗列坐标');
  assert.notStrictEqual(degraded, ZH_4D, '注入必须真的改变提示词');
  assert.ok(!degraded.includes('只能作趋势性归纳'), '注入未清干净');
  assert.throws(() => assert4dStructure(degraded), /仅允许趋势性归纳/);
});
