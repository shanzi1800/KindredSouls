#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// 🔴 E94（主公军令 2026-10-26）：轻量破冰定位／非中语截断根治／代词复读压制／跨卷咬合
//   ① $4.99 洞察 300~500 字轻量契约（圣裁：严禁字数膨胀，五大要素钉死）
//   ② 非中语年报 maxTokens 动态分流（zh 7500 / 非中语 12000，根除截断断头）
//   ③ 「年长沉稳的TA」复合代称全篇 ≤2 次（PRONOUN FREQUENCY CAP）
//   ④ 宏微基调咬合（月/年同一张季度基调词表）＋塔罗三档跨卷精神串联＋数据锁忠实铁律
// 判据口径：②含行为级测试（VM 实跑语种分流表达式）；④词表跨构造器逐字同源比对。
// ═══════════════════════════════════════════════════════════════
import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SERVER = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
const ADV = fs.readFileSync(path.join(ROOT, 'api/ai-advisor.js'), 'utf8');
const ADV_WEB = fs.readFileSync(path.join(ROOT, 'web/api/ai-advisor.js'), 'utf8');
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

// VM 抽取（花括号配平，同 e92 闸门口径）
function fnBody(src, anchor) {
  const i = src.indexOf(anchor);
  if (i === -1) throw new Error(`fn anchor missing: ${anchor}`);
  let depth = 0, started = false;
  for (let j = src.indexOf('{', i); j < src.length; j++) {
    if (src[j] === '{') { depth++; started = true; }
    else if (src[j] === '}') { depth--; if (started && depth === 0) return src.slice(i, j + 1); }
  }
  throw new Error(`unbalanced fn: ${anchor}`);
}

test('E94-①-1 $4.99 轻量契约：六语齐备＋硬区间＋五要素＋显式作废旧篇幅指令', () => {
  assert.ok(ADV.includes('const _E94_ONCE_CONTRACT'), 'once 契约常量缺失');
  const seg = ADV.slice(ADV.indexOf('const _E94_ONCE_CONTRACT'), ADV.indexOf('const _e94OnceClause'));
  assert.ok(seg.length > 2000, '契约体量异常（六语缺一）');
  for (const L of ['zh:', 'en:', 'es:', 'fr:', 'th:', 'vi:']) {
    assert.ok(seg.includes(L), `语言 ${L} 缺失`);
  }
  // 硬区间（中文字区间 vs 西文词区间，各自口径）
  assert.ok(seg.includes('300~500 字'), 'zh 硬区间缺失');
  assert.ok(seg.includes('300-500 words'), 'en 硬区间缺失');
  // 显式作废两条互相打架的旧指令（E39 200 字 / reportClause 800-1200 字）
  assert.ok(seg.includes('作废') && seg.includes('VOID'), '旧篇幅指令未显式作废');
  // 付费墙卡片五大要素逐条钉死
  assert.ok(seg.includes('① 塔罗潜意识显化') && seg.includes('⑤ 专属提升建议'), '五大要素缺失（zh）');
  assert.ok(seg.includes('Exactly 3 concrete, immediately actionable suggestions'), '三锦囊缺失（en）');
  // 严禁膨胀军令：旧口径只准出现在作废句里（各仅 1 次），不得残留为生效指令
  assert.equal((seg.match(/800-1200字/g) || []).length, 1, 'zh 旧口径应在作废句且仅 1 次');
  assert.equal((seg.match(/800-1200 words/g) || []).length, 1, 'en 旧口径应在作废句且仅 1 次');
});

test('E94-①-2 契约只对 once 档生效（月报/年报零波及）', () => {
  assert.ok(ADV.includes("const _e94OnceClause = (reportType === 'once')"), 'once 门控缺失（月/年误伤风险）');
  assert.ok(ADV.includes("_e94OnceClause ? '\\n\\n' + _e94OnceClause : ''"), '契约未并入 system 尾部');
});

test('E94-①-3 镜像同步：api/ai-advisor.js ≡ web/api/ai-advisor.js（e40 军规）', () => {
  assert.strictEqual(ADV, ADV_WEB, '镜像漂移（web/api 未同步）');
});

test('E94-②-1 行为级：maxTokens 语种分流（zh 年 7500／非中语年 12000／月 zh 3500·非中语 5500（E97-①）／once 12000）', () => {
  const i = SERVER.indexOf('const _e94IsZh =');
  assert.ok(i > 0, '语种分流计算缺失');
  const seg = SERVER.slice(i, SERVER.indexOf('let insight = await callAI(', i));
  const expr = seg.slice(seg.indexOf('const _e94IsZh'), seg.indexOf(';', seg.indexOf('const _e94MaxTokens') ) + 1);
  const calc = new Function('lang', 'reportType', `${expr}\nreturn _e94MaxTokens;`);
  assert.equal(calc('zh', 'yearly'), 7500, 'zh 年报应为 7500');
  assert.equal(calc('zh-CN', 'yearly'), 7500, 'zh 前缀方言应归 zh');
  assert.equal(calc('fr', 'yearly'), 12000, 'fr 年报应为 12000（截断根治）');
  // 🛡️ E100-① 后继化：th/vi 高密度单列（泰语审核实锤 12000 仍截断）
  assert.equal(calc('th', 'yearly'), 16000, 'th 年报应为 16000（E100-①）');
  assert.equal(calc('vi', 'yearly'), 16000, 'vi 年报应为 16000（E100-①）');
  assert.equal(calc('en', 'yearly'), 12000, 'en 年报应为 12000');
  // 🛡️ E97-① 后继化（主公军令 2026-10-28）：非中语月报扩容 5500、zh 3500——
  //    旧「月报维持 3000」退役（西语审核实锤外语月报撞 3000 顶格截断）。
  assert.equal(calc('fr', 'monthly'), 5500, '月报非中语应为 5500（E97-① 扩容）');
  assert.equal(calc('es', 'monthly'), 5500, '月报 es 应为 5500（E97-① 扩容）');
  assert.equal(calc('zh', 'monthly'), 3500, '月报 zh 应为 3500（E97-①）');
  assert.equal(calc('th', 'monthly'), 7500, '月报 th 应为 7500（E100-① 高密度）');
  assert.equal(calc('vi', 'monthly'), 7500, '月报 vi 应为 7500（E100-① 高密度）');
  assert.equal(calc('fr', 'once'), 12000, 'once 维持 12000');
  assert.equal(calc(undefined, 'yearly'), 7500, '缺省 lang 应按 zh fail-closed');
});

test('E94-②-2 兼容线唯一 callAI 落点消费 _e94MaxTokens＋旧死板 7000 已拔除', () => {
  // 姻缘三报告端点（app.use('/api/ai-advisor')）内唯一 callAI 须消费分流值
  const hStart = SERVER.indexOf("app.use('/api/ai-advisor'");
  const hEnd = SERVER.indexOf("app.use((req, res, next)", hStart);
  const handler = SERVER.slice(hStart, hEnd);
  assert.ok(handler.includes('{ maxTokens: _e94MaxTokens, reportType }'), '姻缘线 callAI 未消费分流值');
  assert.ok(!handler.includes('yearly\' ? 7000'), '姻缘线残留死板 7000');
  // 财富线（wealth-oracle）不在军令射程，不得误伤
  const wStart = SERVER.indexOf("app.post('/api/wealth-oracle'");
  const wEnd = SERVER.indexOf("app.get('/api/test-gemini'", wStart);
  const wealth = SERVER.slice(wStart, wEnd);
  assert.ok(!wealth.includes('_e94MaxTokens'), '财富线被误伤（射程违规）');
});

test('E94-③-1 行为级：代词频次军规入 guard（复合代称 ≤2 次）＋数据锁忠实铁律', () => {
  const fn = fnBody(SERVER, 'function _E92CompatBaziLock');
  const _E92CompatBaziLock = new Function(`${fn}\nreturn _E92CompatBaziLock;`)();
  const bl = _E92CompatBaziLock('1976-12-03', '1997-10-18', '03:00', '12:00');
  assert.ok(bl && typeof bl.guard === 'string', 'guard 结构异常');
  // 军规三条：频次上限≤2＋自然代词指引＋数据锁忠实
  assert.ok(bl.guard.includes('代词使用铁律') && bl.guard.includes('PRONOUN FREQUENCY CAP'), '代词频次军规缺失');
  assert.ok(bl.guard.includes('不得超过 2 次'), '≤2 次硬上限缺失');
  assert.ok(/he\/she|他.{0,4}她/.test(bl.guard), '自然代词指引缺失');
  assert.ok(bl.guard.includes('数据锁忠实铁律') && bl.guard.includes('DATA-LOCK FIDELITY'), '数据锁忠实铁律缺失');
  assert.ok(bl.guard.includes('本月无刑冲'), '「无刑冲」幻觉断言禁令缺失');
});

test('E94-④-1 月报构造器：年度基调锚＋塔罗流月串联＋季节词表内置（VM 铁律）', () => {
  const fnM = fnBody(SERVER, 'function buildCompatMonthlyFourModulePrompt');
  assert.ok(fnM.includes('const _e94Tone'), '季节词表未内置（VM 抽取会 ReferenceError）');
  assert.ok(fnM.includes('YEAR TONE ANCHOR'), '年度基调锚规则缺失');
  assert.ok(fnM.includes('TAROT THREAD'), '塔罗流月串联规则缺失');
  assert.ok(fnM.includes('_e94QIdx'), '当前季度计算缺失');
  // 锚点规则与串联句都须真实入 system（非注释摆设）
  assert.ok(fnM.includes('9. [YEAR TONE ANCHOR'), '基调锚未编号入 sysLines');
  assert.ok(fnM.includes('10. [TAROT THREAD'), '串联未编号入 sysLines');
  assert.ok(fnM.includes('注入当下的定力'), '串联句 zh 文案缺失');
});

test('E94-④-2 年报构造器：季度基调词表＋灵魂原型牌串联＋常量内置', () => {
  const fnY = fnBody(SERVER, 'function buildCompatYearlyFiveChapterPrompt');
  assert.ok(fnY.includes('const _e94QTone'), '季度词表未内置（VM 铁律）');
  assert.ok(fnY.includes('9. [QUARTER KEYNOTE'), '季度基调规则缺失');
  assert.ok(fnY.includes('10. [TAROT THREAD'), '灵魂原型串联规则缺失');
  assert.ok(fnY.includes('贯穿全年的精神主轴'), '串联句 zh 文案缺失');
  // 四季度基调须逐字入规则（Q1~Q4 无一缺位）
  for (const k of ['起势与磨合', '升温与试探', '考验与深化', '收束与沉淀']) {
    assert.ok(fnY.includes(k), `季度基调 ${k} 缺失`);
  }
});

test('E94-④-3 行为级：月/年季节词表逐字同源（单一措辞真源 ⇒ 宏微必然咬合）', () => {
  const fnM = fnBody(SERVER, 'function buildCompatMonthlyFourModulePrompt');
  const fnY = fnBody(SERVER, 'function buildCompatYearlyFiveChapterPrompt');
  const tbl = (fn, anchor) => {
    const i = fn.indexOf(anchor);
    if (i === -1) throw new Error(`词表锚缺失: ${anchor}`);
    const end = fn.indexOf('}[L]', i);
    return fn.slice(i, end + 4);
  };
  const tm = tbl(fnM, 'const _e94Tone');
  const ty = tbl(fnY, 'const _e94QTone');
  // 归一化变量名后逐字节比对（措辞真源唯一）
  assert.equal(tm.replace(/_e94Tone/g, 'T'), ty.replace(/_e94QTone/g, 'T'), '月/年季节词表措辞不同源（咬合破坏）');
});

test('E94-⑤-1 闸门接线：test:astro 含本闸门（70 段）＋入编位（e92 后、e40 前、python 链尾）', () => {
  const chain = PKG.scripts['test:astro'] || '';
  assert.ok(chain.includes('audit-e94-tier-cohesion.test.mjs'), '本闸门未接线 test:astro');
  const parts = chain.split('&&').map((s) => s.trim());
  assert.equal(parts.length, 84, `链段数异常（实得 ${parts.length}，基线 79（E103/E104 升 79 段））`);   // 🛡️ E103/E104 后继化：77→79
  const iE94 = parts.findIndex((p) => p.includes('audit-e94-'));
  const iE92 = parts.findIndex((p) => p.includes('audit-e92-'));
  const iE40 = parts.findIndex((p) => p.includes('audit-e40-compat-synastry-tensor-fusion'));
  const iPy = parts.findIndex((p) => p.includes('python3'));
  assert.ok(iE92 !== -1 && iE94 > iE92, 'E94 须在 E92 之后');
  assert.ok(iE40 > iE94, 'E94 须在 e40-compat 之前（收口位军规）');
  assert.ok(iE40 === parts.length - 2, 'e40 恒 len-2 被破坏');
  assert.ok(iPy === parts.length - 1, 'python 恒链尾被破坏');
});
