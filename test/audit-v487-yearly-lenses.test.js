// ═══════════════════════════════════════════════════════════════════════
// 🛡️ V487: 逐月「叙述镜头 + 风控表达框架 + 窗口表达框架」确定性注入 —— 回归闸门
//
// 军师三轮评审批准(第三轮): 破解 LLM「同构打地鼠」。
//
// 病根(V486/V486b 两轮线上实证, 1997-10-18 盘 zh 年报 11095 字):
//   · V486  治好了整句逐字复读(「绝对禁止…」×13→0、「这个窗口期…」12→0);
//   · V486b 禁掉了概览首句「流年太阳进入…」骨架 ⇒ LLM 立刻换成另一个同样统一的新骨架。
//   实测三条 12 个月同骨架(禁一个换一个, 打地鼠):
//     ① 概览首句  「本月你的财务重心落在"某领域"」 12/12(重心落在 11)
//     ② 断路器段  「绝对禁止…」                    13
//     ③ 窗口指令  「这是你本月最适合"X"的窗口」      12/12
//   根因是结构性的: 12 个月真值高度雷同(外行星全年不动) + 产品强制四段结构,
//     只给「禁止雷同」类规则, LLM 必然落回某个统一句式。
//
// 解法(与 V485 黑天鹅战役同法, 已验证有效 12/12 月窗口名全不同):
//   逐月**注入具体的**切入角度/结构 —— 「给具体」远胜「禁止雷同」。
//     ⚠️ 其中 ②③ 是军师批准的范围; ①「窗口表达框架」是执行中发现同类缺陷后顺带补齐的
//        (同一个根因, 同一个机制, 一并终结), 已在战报中披露。
//
// 纪律: 剥注释后再断言(防「注释里写了判据字面量」假红); 每条判据配注入自测(证明会红);
//      注入必须真的改变源码; 版本判据用单调判据不写死历史值。
// ═══════════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
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

// 生产实测的高危复读句(军师二轮证据) —— 严禁被写进提示词当「反例」(V462 教训)
const PROD_WORST = [
  '绝对禁止在这一期间进行任何重大的财务决策',
  '水星与冥王星的紧张相位则暗示着信息操控',
  '这个窗口期是行动的最佳时机',
];
// 被 V486b 禁掉后 LLM 换用的新骨架 —— 严禁在提示词/注入块里复述(否则等于给它一个新模板)
const BANNED_SKELETON = ['重心落在', '这是你本月最适合'];

// ── 装载器(closureDecls 会做传递闭包, 但**只抽被引用到的**闭包 ⇒ 常量必须显式 seed) ──
function loadBlock(source = src) {
  const DEPS = ['buildYearlyLensFrameworkBlock', '_V487_NARRATIVE_LENSES',
    '_V487_RISK_FRAMEWORKS', '_V487_WINDOW_FRAMES', '_V487_RFW_CODES'];
  const { source: code } = closureDecls(source, DEPS, []);
  const ctx = { console, __exports: {} };
  vm.createContext(ctx);
  vm.runInContext(code + '\n__exports.f = buildYearlyLensFrameworkBlock;'
    + '\n__exports.LENS = _V487_NARRATIVE_LENSES;'
    + '\n__exports.FW = _V487_RISK_FRAMEWORKS;'
    + '\n__exports.WF = _V487_WINDOW_FRAMES;'
    + '\n__exports.CODES = _V487_RFW_CODES;', ctx);
  return ctx.__exports;
}
function loadLeak(source = src) {
  const { source: code } = closureDecls(source, ['stripYearlyPromptLeakage'], []);
  const ctx = { console, __exports: {} };
  vm.createContext(ctx);
  vm.runInContext(code + '\n__exports.f = stripYearlyPromptLeakage;', ctx);
  return ctx.__exports.f;
}

// ══════════════════════════════════════════════════════════════════════════
// ① 常量池: 三张表各 12 项、互不相同、闭集代号可派生
// ══════════════════════════════════════════════════════════════════════════
test('① 三张分配表各 12 项且互不相同(少一项即失去逐月差异化能力)', () => {
  const { LENS, FW, WF, CODES } = loadBlock();
  const pools = [['叙述镜头', LENS, 12], ['风控表达框架', FW, 12], ['窗口表达框架', WF, 12]];
  for (const [name, list, want] of pools) {
    assert.strictEqual(list.length, want, `${name}应 ${want} 项, 实得 ${list.length}`);
    assert.strictEqual(new Set(list).size, want, `${name}存在重复项`);
    for (const s of list) assert.ok(typeof s === 'string' && s.trim().length >= 6, `${name}存在过短/非字符串项: ${JSON.stringify(s)}`);
  }
  // 三张表之间也不得互相重复(否则等于少一项)
  assert.strictEqual(new Set([...LENS, ...FW, ...WF]).size, 36, '三张分配表之间存在重复项');
  // 闭集代号 = 结构性两张表的代号拼接, 且不另手写一份(防两处漂移)
  assert.strictEqual(CODES.length, 24, `闭集代号应 24 项(风控12+窗口12), 实得 ${CODES.length}`);
  assert.strictEqual(new Set(CODES).size, 24, '闭集代号存在重复');
  [...FW, ...WF].forEach((s, i) => assert.ok(s.startsWith(CODES[i]), `第 ${i + 1} 项代号与框架串不同源: ${CODES[i]} vs ${s}`));
  // 代号必须是「人工词」—— 闭集删除才有安全性(不能是自然短语)
  for (const c of CODES) assert.ok(/式$/.test(c), `代号「${c}」不以「式」结尾, 裸删有误伤正文风险`);
});

// ══════════════════════════════════════════════════════════════════════════
// ② 注入块内容: 三张表 + 机械判据 + 禁令; 且**不含任何可照抄的句子**
// ══════════════════════════════════════════════════════════════════════════
test('② buildYearlyLensFrameworkBlock: 三张表逐项列出 + 机械判据 + 内部字段禁令', () => {
  const { f, LENS, FW, WF } = loadBlock();
  const block = f();
  assert.ok(typeof block === 'string' && block.length > 300, '注入块为空/过短');
  assert.ok(/叙述镜头分配表/.test(block), '缺少「月度叙述镜头分配表」表头');
  assert.ok(/风控表达框架分配表/.test(block), '缺少「风控表达框架分配表」表头');
  assert.ok(/窗口表达框架分配表/.test(block), '缺少「窗口表达框架分配表」表头');
  assert.ok(/V487 机械判据/.test(block), '缺少 V487 机械判据小节');
  assert.ok(/概览首句必须从/.test(block), '缺少「概览首句必须从叙述镜头切入」机械判据');
  assert.ok(/断路器段必须使用/.test(block), '缺少「断路器段必须使用风控表达框架」机械判据');
  assert.ok(/窗口执行指令必须使用/.test(block), '缺少「窗口执行指令必须使用窗口表达框架」机械判据');
  assert.ok(/严禁在正文写出本表名\/字段名/.test(block), '缺少「本表名/字段名严禁入正文」禁令');
  assert.ok(/严禁把「叙述镜头」「风控表达框架」「窗口表达框架」这类字段名/.test(block), '缺少字段名禁令');
  // 36 项都必须逐项出现(不是只给一句抽象要求 —— V486 的失败教训)
  for (const [nm, list] of [['叙述镜头', LENS], ['风控框架', FW], ['窗口框架', WF]]) {
    list.forEach((s) => assert.ok(block.includes(s), `注入块缺少${nm}项: ${s}`));
  }
  // 每张表编号必须严格 1..12 各一次
  // ⚠️ 只在**表区间内**计数: 机械判据小节自身也是 1./2./3./4. 编号, 全局计数会误判(本次踩过)
  const i1 = block.indexOf('叙述镜头分配表'), i2 = block.indexOf('风控表达框架分配表');
  const i3 = block.indexOf('窗口表达框架分配表'), i4 = block.indexOf('V487 机械判据');
  const tables = [['叙述镜头表', block.slice(i1, i2)], ['风控框架表', block.slice(i2, i3)], ['窗口框架表', block.slice(i3, i4)]];
  for (const [name, table] of tables) {
    const nums = [...table.matchAll(/(?:^|; )(\d{1,2})\. /gm)].map((m) => Number(m[1]));
    assert.deepStrictEqual(nums, Array.from({ length: 12 }, (_, i) => i + 1),
      `${name}编号必须严格 1..12 各一次, 实得 [${nums.join(',')}]`);
  }
});

test('②a 章节坐标必须与线上产物一致: 三张表都挂【第二章 365天月度收入矩阵】', () => {
  // 真值核验(线上产物): 12 个月度章节在「## 第二章：365天月度收入矩阵」之下
  //   (标题形如 `### 2026年7月: 太阳巨蟹座 第8宫 · …`), V485 的风控主线表同样挂在第二章。
  //   若把坐标写成不存在的第三章/第四章, LLM 会对不上号 ⇒ 分配表形同虚设。
  const block = loadBlock().f();
  assert.ok(/第二章/.test(block), '分配表未标注正确的章节坐标(应为第二章)');
  assert.ok(!/第[三四]章 (?:月度)?(?:叙述镜头|风控表达框架|窗口表达框架)分配表/.test(block), '分配表挂到了不存在的章节');
  // V485 的表也必须是第二章 —— 四张表口径一致, 否则月份会错位
  assert.ok(/第二章 风控主线分配表/.test(src), 'V485 风控主线表的章节坐标被改动');
});

test('②b 注入块不得写入任何可照抄的句子(含被禁骨架与生产复读句)', () => {
  const { f } = loadBlock();
  const block = f();
  for (const bad of PROD_WORST) {
    assert.ok(!block.includes(bad), `注入块出现生产复读句面「${bad.slice(0, 14)}…」——V462 已实证反例会被照抄`);
  }
  for (const bad of BANNED_SKELETON) {
    assert.ok(!block.includes(bad), `注入块复述了被禁骨架「${bad}」—— 等于给 LLM 一个新的统一模板`);
  }
});

test('②c 必须显式禁止三张表串用(线上首验实测: 3/12 个月概览取到了风控主线表的项)', () => {
  // 真值(2026-10-01 线上首验, deploymentId 725b2ed6, 16698 字):
  //   概览首句骨架已 11→1 ✅, 但第 7/9/10 个月取到的是「风控主线分配表」的项
  //   (资产流动性与变现难度/创意项目投入产出比/信息真伪与决策依据)而不是「叙述镜头表」的项。
  //   两张 12 项表格式相同 ⇒ LLM 会抓错表。必须显式写明"只能取自镜头表、不得串用"。
  const block = loadBlock().f();
  assert.ok(/只能取自「月度叙述镜头分配表」/.test(block), '注入块未声明「概览镜头只能取自镜头表」');
  assert.ok(/严禁与「第二章 风控主线分配表」「风控表达框架分配表」互相串用/.test(block),
    '注入块未显式禁止三张表串用');
  assert.ok(/只能取自「月度叙述镜头分配表」/.test(ZH), 'zh Prompt 未声明「概览镜头只能取自镜头表」');
  assert.ok(/严禁与「风控主线分配表」「风控表达框架分配表」互相串用/.test(ZH), 'zh Prompt 未显式禁止三张表串用');
});

// ══════════════════════════════════════════════════════════════════════════
// ③ 接线: /stream 年报 + 非流式年报 各注入一次; /v2 逐月注入
// ══════════════════════════════════════════════════════════════════════════
test('③ 接线: 注入块在两条年报生成路径各挂 1 次, /v2 逐月挂 3 条', () => {
  const code = stripComments(src);
  const calls = code.match(/prompt\.system \+= buildYearlyLensFrameworkBlock\(\)/g) || [];
  assert.ok(calls.length >= 2, `buildYearlyLensFrameworkBlock 应在 /stream 与非流式各注入 1 次, 实得 ${calls.length}`);
  // 每处都必须有 zh + yearly 双重护栏(别把中文表注进英文/月报)
  const guards = code.match(/lang === 'zh' && reportType === 'yearly'/g) || [];
  assert.ok(guards.length >= 2, `注入点缺少 zh+yearly 双护栏, 实得 ${guards.length}`);
  // /v2 逐月注入 3 条
  assert.ok(/lensBlock \+= '★ 内部参考·本月叙述镜头/.test(code), '/v2 未注入「本月叙述镜头」');
  assert.ok(/lensBlock \+= '★ 内部参考·本月风控表达框架/.test(code), '/v2 未注入「本月风控表达框架」');
  assert.ok(/lensBlock \+= '★ 内部参考·本月窗口表达框架/.test(code), '/v2 未注入「本月窗口表达框架」');
  for (const [nm, re] of [
    ['镜头', /_V487_NARRATIVE_LENSES\[i % _V487_NARRATIVE_LENSES\.length\]/],
    ['风控框架', /_V487_RISK_FRAMEWORKS\[i % _V487_RISK_FRAMEWORKS\.length\]/],
    ['窗口框架', /_V487_WINDOW_FRAMES\[i % _V487_WINDOW_FRAMES\.length\]/],
  ]) assert.ok(re.test(code), `/v2 ${nm}未按月份序号分配`);
  assert.ok(/peakBlock \+ crisisBlock \+ lensBlock/.test(code), '/v2 lensBlock 未拼进月度提示词');
  // 索引口径必须与 V485 一致(同一个 i), 否则分配表会与月度错位
  assert.ok(/_V485_CRISIS_ANGLES\[i % _V485_CRISIS_ANGLES\.length\]/.test(code), 'V485 索引口径被改动');
});

// ══════════════════════════════════════════════════════════════════════════
// ④ 行为: 泄漏防线 —— V487 新字段既不能漏进正文, 也不能误删正文
// ══════════════════════════════════════════════════════════════════════════
test('④ stripYearlyPromptLeakage: 兜住 V487 新增字段(镜头/两种框架/代号) 且不误伤正文', () => {
  const f = loadLeak();

  // 4a 镜头字段名形态: 只删字段名, **内容保留**(内容是要写进正文的角度, 属内容)
  const a = '* 💡 **本月叙述镜头**: 现金流周转速度与账期节奏。第8宫的能量让你容易乱花钱。';
  const ao = f(a, 'zh', 'yearly');
  assert.ok(!/叙述镜头/.test(ao), `镜头字段名未清除 → ${ao}`);
  assert.ok(ao.includes('现金流周转速度与账期节奏') && ao.includes('第8宫的能量让你容易乱花钱'),
    `镜头字段清理误删了内容 → ${ao}`);

  // 4b 结构性框架字段: 字段名 + 闭集代号一并删除(代号属机制, 留着只会突兀)
  for (const [label, code] of [['风控表达框架', '条件触发式'], ['窗口表达框架', '动作指令式'], ['本月风险框架', '时间窗式']]) {
    const s = `${label}：${code}，你需要保留三个月的现金缓冲。`;
    const o = f(s, 'zh', 'yearly');
    assert.ok(!new RegExp(label.replace(/本月/, '')).test(o), `「${label}」字段名未清除 → ${o}`);
    assert.ok(!o.includes(code), `框架代号「${code}」未清除 → ${o}`);
    assert.ok(o.includes('你需要保留三个月的现金缓冲'), `「${label}」字段清理误删了正文 → ${o}`);
  }

  // 4b2 【长形态 / 生产同形】与 server 端注入串逐字一致 —— 压力测试实测的漏网形态
  for (const s of [
    '* 🟢 **[财富高峰窗口]**: **9月10日** 木星合相。*执行指令*：★ 内部参考·本月窗口表达框架(仅供你组织财富高峰窗口的执行指令; 严禁在正文写出本行或框架代号): 动作指令式 —— 开句直接给出动作。直接去找你的主管谈薪。',
    '* 🔴 **[财务黑天鹅日]**: **8月25日** 火星共振。*断路器警告*：★ 内部参考·本月风控表达框架(仅供你组织本月风险叙述; 严禁在正文写出本行或框架代号): 条件触发式——先给触发条件, 再给后果判断。若对方催你当场签字，直接暂停。',
    '* 🌐 **[月度财富概览]**: ★ 内部参考·本月叙述镜头(仅供你组织"月度财富概览"首句):现金流周转速度与账期节奏。你的现金流会有明显起伏。',
  ]) {
    const o = f(s, 'zh', 'yearly');
    assert.ok(!/内部参考|框架代号|表达框架|叙述镜头|动作指令式|条件触发式|——\s*开句|——\s*先给触发条件/.test(o),
      `长形态注入字段漏清 → ${o}`);
    // 正文内容必须仍在
    assert.ok(/直接去找你的主管谈薪|直接暂停|明显起伏/.test(o), `长形态清理误删正文 → ${o}`);
  }

  // 4c 闭集代号裸残留(LLM 把代号单独写进句子)
  for (const c of loadBlock().CODES) {
    assert.ok(!f(`这是一个${c}的判断。`, 'zh', 'yearly').includes(c), `裸代号「${c}」漏清`);
  }

  // 4d 分配表表头残留
  for (const head of ['第二章 月度叙述镜头分配表(内部参考)', '第二章 窗口表达框架分配表(内部参考)']) {
    const d = f(`【📌 ${head}】\n后续正文。`, 'zh', 'yearly');
    assert.ok(!/分配表/.test(d), `分配表表头残留 → ${d}`);
  }

  // 4e 不得误伤正常句子 / 幂等 / 护栏
  for (const ok of [
    '本月风险主要集中在合伙资金的使用上，需要格外谨慎。',
    '你的现金流周转速度决定了本月的腾挪空间。',
    '合同条款中的隐性溢价需要逐字核对。',
    '这是你本月最适合谈薪资的一段时间。',   // ⚠️ 判据只清字段名/代号, 不负责"改写套壳句"
  ]) assert.strictEqual(f(ok, 'zh', 'yearly'), ok, `误伤了正常句子: ${ok}`);
  const once = f(a + '\n' + '风控表达框架：条件触发式，注意现金流。', 'zh', 'yearly');
  assert.strictEqual(f(once, 'zh', 'yearly'), once, '非幂等');
  assert.strictEqual(f(a, 'zh', 'monthly'), a, '月报不该被处理');
  assert.strictEqual(f(a, 'es', 'yearly'), a, '非 zh 不该被处理');
});

// ══════════════════════════════════════════════════════════════════════════
// ⑤ Prompt 侧: zh 年报提示词必须与注入块口径一致
// ══════════════════════════════════════════════════════════════════════════
test('⑤ zh 年报 Prompt 含 V487 三条机械判据, 且不得复述被禁骨架/生产复读句', () => {
  assert.ok(/V487/.test(ZH), 'zh 年报 Prompt 缺少 V487 标记');
  assert.ok(/概览首句必须从「本月叙述镜头」切入/.test(ZH), 'zh 缺「概览首句必须从叙述镜头切入」');
  assert.ok(/断路器段必须使用「本月风控表达框架」/.test(ZH), 'zh 缺「断路器段必须使用风控表达框架」');
  assert.ok(/窗口执行指令必须使用「本月窗口表达框架」/.test(ZH), 'zh 缺「窗口执行指令必须使用窗口表达框架」');
  assert.ok(/严禁 12 个月复用同一句首句结构/.test(ZH), 'zh 缺「禁止跨月同构」量化判据');
  for (const bad of PROD_WORST) assert.ok(!ZH.includes(bad), `zh Prompt 出现生产复读句面「${bad.slice(0, 14)}…」`);
  for (const bad of BANNED_SKELETON) assert.ok(!ZH.includes(bad), `zh Prompt 复述了被禁骨架「${bad}」`);
});

test('⑤b V486/V486b 既有规则未被 V487 挤掉(叠加而非替换)', () => {
  assert.ok(/严禁整句复读/.test(ZH), 'V486「严禁整句复读」丢失');
  assert.ok(/天文事实句只许最短出现一次/.test(ZH), 'V486b「天文事实句最短一次」丢失');
  assert.ok(/月度财富概览首句：机械禁用/.test(ZH), 'V486b「概览首句机械禁用」丢失');
  assert.ok(/本规则不提供范例/.test(ZH), 'V486「不提供范例」自保护规则丢失');
});

// ══════════════════════════════════════════════════════════════════════════
// ⑥ 缓存版本(单调判据) + P0 技术债(.ts 孪生漂移源已清)
// ══════════════════════════════════════════════════════════════════════════
test('⑥ 缓存版本必须 ≥ V487 基线(单调判据, 防每次 bump 假红)', () => {
  const vers = [...src.matchAll(/wealth:v(\d+):/g)].map((m) => Number(m[1]));
  assert.ok(vers.length >= 3, `应有多处缓存 key, 实得 ${vers.length}`);
  const cur = Math.max(...vers);
  assert.ok(cur >= 498, `当前缓存版本应 ≥498(提示词/注入链已变更), 实得 v${cur}`);
  assert.ok(vers.filter((v) => v === cur).length >= 3, `当前版本 v${cur} 应出现在 3 处缓存 key`);
});

// 孪生漂移源判定器(可复用, 便于做阳性/阴性对照 —— 度量工具本身也要有对照, V486 教训)
const strayPromptTwins = (dir) => fs.readdirSync(dir)
  .filter((n) => /^yearlySystem.*\.ts$/.test(n) || n === 'index.ts');

test('⑥b P0 技术债: .ts 孪生漂移源必须不存在, 且声明唯一真源为 .txt', () => {
  assert.deepStrictEqual(strayPromptTwins(PROMPT_DIR), [],
    '.ts 孪生漂移源仍在 —— 它未被任何代码引用, 却会让人误以为「改了这里就生效了」');
  const loader = fs.readFileSync(path.join(PROMPT_DIR, 'loader.js'), 'utf-8');
  assert.ok(/唯一真源/.test(loader), 'loader.js 未声明「提示词唯一真源为 .txt」');
  assert.ok(fs.existsSync(path.join(PROMPT_DIR, 'README.md')), '缺少 src/prompts/README.md(唯一真源说明)');
  assert.ok(/readFileSync\(join\(__dirname, 'yearlySystemZH\.txt'\)/.test(loader), 'loader 读取的不是 .txt');
});

// ══════════════════════════════════════════════════════════════════════════
// ⑦ 注入缺陷自测 —— 每条都必须「注入后判据变红」
// ══════════════════════════════════════════════════════════════════════════
test('【注入】把叙述镜头池砍到 8 项 → ① 必须红', () => {
  const degraded = src.replace(
    /const _V487_NARRATIVE_LENSES = \[([\s\S]*?)\];/,
    (m, body) => 'const _V487_NARRATIVE_LENSES = [' + body.split(',').slice(0, 8).join(',') + '];');
  assert.notStrictEqual(degraded, src, '注入必须真的改变源码');
  assert.ok(loadBlock(degraded).LENS.length !== 12, '注入后 ① 判据应命中失败');
});

test('【注入】把闭集代号换成一个自然短语 → ① 必须红(裸删会误伤正文)', () => {
  const degraded = src.replace("'条件触发式——先给触发条件, 再给后果判断'", "'先给触发条件再给后果——先给触发条件, 再给后果判断'");
  assert.notStrictEqual(degraded, src, '注入必须真的改变源码');
  assert.ok(loadBlock(degraded).CODES.some((c) => !/式$/.test(c)), '注入后「代号必须是人工词」判据应命中失败');
});

test('【注入】把被禁骨架写进注入块 → ②b 必须红', () => {
  const degraded = src.replace(
    /function buildYearlyLensFrameworkBlock\(\) \{/,
    "function buildYearlyLensFrameworkBlock() { return '本月你的财务重心落在某领域。';");
  assert.notStrictEqual(degraded, src, '注入必须真的改变源码');
  const block = loadBlock(degraded).f();
  assert.ok(BANNED_SKELETON.some((b) => block.includes(b)), '注入后 ②b 判据应命中失败');
});

test('【注入】把分配表坐标改到不存在的第三章 → ②a 必须红', () => {
  const degraded = src.replace('【📌 第二章 窗口表达框架分配表', '【📌 第三章 窗口表达框架分配表');
  assert.notStrictEqual(degraded, src, '注入必须真的改变源码');
  assert.ok(/第[三四]章 (?:月度)?(?:叙述镜头|风控表达框架|窗口表达框架)分配表/.test(loadBlock(degraded).f()),
    '注入后 ②a 判据应命中失败');
});

test('【注入】摘掉非流式注入点 → ③ 接线判据必须红', () => {
  const degraded = src.replace(
    /^\s*if \(lang === 'zh' && reportType === 'yearly'\) \{\n\s*prompt\.system \+= buildYearlyLensFrameworkBlock\(\);\n\s*\}\n/m, '');
  assert.notStrictEqual(degraded, src, '注入必须真的改变源码');
  const n = (stripComments(degraded).match(/prompt\.system \+= buildYearlyLensFrameworkBlock\(\)/g) || []).length;
  assert.ok(n < 2, `注入后 ③ 判据应命中失败(实得 ${n})`);
});

test('【注入】禁用镜头字段清理 → ④ 必须红', () => {
  const degraded = src.replace(
    "  t = t.replace(new RegExp(_PFX487 + '(?:叙述|叙事|概览)\\\\s*(?:镜头|视角|切入点)' + _PAREN487 + _SEP487, 'g'), '');",
    '');
  assert.notStrictEqual(degraded, src, '注入必须真的改变源码(镜头清理行未找到)');
  const out = loadLeak(degraded)('**本月叙述镜头**: 现金流周转速度。后文。', 'zh', 'yearly');
  assert.ok(/叙述镜头/.test(out), '注入后 ④ 判据应命中失败');
});

test('【注入】摘掉「代号 + ——说明」清理 → ④ 必须红', () => {
  const degraded = src.replace(
    "  t = t.replace(new RegExp('(?:' + _V487_RFW_CODES.join('|') + ')\\\\s*——\\\\s*[^。；\\\\n]{0,80}[。；]?\\\\s*', 'g'), '');",
    '');
  assert.notStrictEqual(degraded, src, '注入必须真的改变源码(代号+说明清理行未找到)');
  const f = loadLeak(degraded);
  assert.ok(/——\s*开句直接给出动作/.test(f('窗口表达框架：动作指令式 —— 开句直接给出动作。后面正文。', 'zh', 'yearly')),
    '注入后 ④ 判据应命中失败');
});

test('【注入】摘掉闭集代号清理 → ④ 必须红', () => {
  const degraded = src.replace(
    "  t = t.replace(new RegExp('(?:' + _V487_RFW_CODES.join('|') + ')', 'g'), '');",
    '');
  assert.notStrictEqual(degraded, src, '注入必须真的改变源码(代号清理行未找到)');
  const f = loadLeak(degraded);
  assert.ok(/条件触发式/.test(f('这是一个条件触发式的判断。', 'zh', 'yearly')), '注入后 ④ 裸代号判据应命中失败');
});

test('【注入】缓存版本降级一档 → ⑥ 必须红', () => {
  const cur = Math.max(...[...src.matchAll(/wealth:v(\d+):/g)].map((m) => Number(m[1])));
  const degraded = src.replace(new RegExp(`wealth:v${cur}:`, 'g'), `wealth:v${cur - 1}:`);
  assert.notStrictEqual(degraded, src, '注入必须真的改变源码');
  const vers = [...degraded.matchAll(/wealth:v(\d+):/g)].map((m) => Number(m[1]));
  assert.ok(Math.max(...vers) < cur, `注入后版本应低于当前版本 v${cur}(实得 v${Math.max(...vers)})`);
});

test('【注入】把 .ts 孪生漂移源放回去 → ⑥b 必须红(阳性对照)', () => {
  // 用临时目录做对照, 不污染 src/prompts(避免与并发测试互相干扰)
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ks487-'));
  try {
    assert.deepStrictEqual(strayPromptTwins(tmp), [], '空目录不应命中');
    fs.writeFileSync(path.join(tmp, 'index.ts'), 'export const yearlySystemZH = "";\n');
    fs.writeFileSync(path.join(tmp, 'yearlySystemZH.ts'), 'export const yearlySystemZH = "";\n');
    fs.writeFileSync(path.join(tmp, 'loader.js'), '// runtime\n');
    fs.writeFileSync(path.join(tmp, 'yearlySystemZH.txt'), 'prompt\n');
    assert.deepStrictEqual(strayPromptTwins(tmp).sort(), ['index.ts', 'yearlySystemZH.ts'],
      '注入后 ⑥b 判据应命中失败(且不得误伤 .txt/loader.js)');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
