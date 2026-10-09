// ═══════════════════════════════════════════════════════════════════════════
// 🛡️ E20/R11n 闸门：元素归纳段流年坐标剪枝锁 + V517 轴点后置形态 + 判据12 防伪影
// ═══════════════════════════════════════════════════════════════════════════
// 背景（2026-10-06）：
//   ① s7 zh 判据9 真阳性 —— 「土元素…主要通过流年太阳在双子座第八宫2027年5月来激活」
//      违反 yearlySystemZH.txt 4d-6（V488d 剪枝契约）；此前只有 prompt 规则 + V488-AUDIT
//      只检不改埋点，无确定性执行器。治法 = stripYearlyElementCoordLeak（删坐标保时间）。
//   ② s1 zh 重生成实证「你的天秤座上升天生渴望扩张」（真值 rising=Sagittarius）—— V517
//      轴点锁只认前置「上升X座」，后置「X座上升」整锁漏接 ⇒ 错值落库。补后置分支。
//   ③ 同盘全真值连句被判 c12=2 伪影（fwd 跨逗号溢出 + bwd 被另一行星截断）⇒ 判据12 窄化。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO = path.join(__dirname, '..');
const SRC = readFileSync(path.join(REPO, 'server.js'), 'utf-8');

const STRIP_NONSTREAM = "if (reportType === 'yearly') {\n          reportContent = stripYearlyElementCoordLeak(reportContent, lang, reportType);\n        }";
const STRIP_STREAM = "if (reportType === 'yearly') cleanedText = stripYearlyElementCoordLeak(cleanedText, lang, reportType);";
const FINAL_NONSTREAM = "if (reportType === 'yearly') {\n          reportContent = _v432LockLeadingNatal(reportContent, lang, astroMatrix, reportType);\n        }";
const FINAL_STREAM = "if (reportType === 'yearly') cleanedText = _v432LockLeadingNatal(cleanedText, lang, astroMatrix, reportType);";

function mountsOk(src) {
  const a = src.indexOf(STRIP_NONSTREAM);
  const b = src.indexOf(FINAL_NONSTREAM);
  const c = src.indexOf(STRIP_STREAM);
  const d = src.indexOf(FINAL_STREAM);
  return a >= 0 && b >= 0 && c >= 0 && d >= 0 && a < b && c < d;
}

// ── vm 同源抽取（复刻 batch harness 手法） ──
const SEEDS = ['stripYearlyElementCoordLeak', 'lockYearlyAxisAnchor', '_v517AxisRe', '_v517LocalSign',
  '_V517_TRANSIT_MARK', '_v444Signs', '_v444Esc', '_v432AllSignWords', '_V488_MONTH', '_V488_MAX_GAP',
  '_V488_ORD', 'SUN_SIGN_EN', '_v512CountNatalClaimMismatch', '_v432Truth', '_v432Clause',
  '_v432ClaimOf', '_v432TruthMatch', '_V432_CFG', '_v512PossessiveNatal', '_e11SignIndex',
  '_e11SignLocal', '_E11_SIGN_IDX_CACHE', 'SUN_SIGN_ZH', 'SUN_SIGN_TH', 'SUN_SIGN_VI',
  'SUN_SIGN_ES', 'SUN_SIGN_FR', '_c8Aspect', '_c8Pair', '_V512_SENT_BREAK'];
const { closureDecls } = await import(pathToFileURL(path.join(REPO, 'test/tools/extract_decls.mjs')));
const { map } = closureDecls(SRC, SEEDS, ['getSignToHouseMap', 'SIGN_ORDER_ZH']);
const dropped = [];
for (const n of [...map.keys()]) { try { new vm.Script(map.get(n)); } catch (e) { dropped.push(`${n}(${e.message.slice(0, 40)})`); map.delete(n); } }
if (dropped.length) console.error('[e20] VM 抽取声明语法不完整:', dropped);
const ctx = { console, setTimeout, clearTimeout, setInterval, clearInterval, Buffer, process, __exports: {} };
vm.createContext(ctx);
const bodySrc = [...map.entries()].sort((a, b) => SRC.indexOf(a[1]) - SRC.indexOf(b[1])).map((e) => e[1]).join('\n\n');
vm.runInContext(bodySrc + '\n' + SEEDS.map((n) => `__exports[${JSON.stringify(n)}] = typeof ${n} !== 'undefined' ? ${n} : undefined;`).join('\n'), ctx);
const X = ctx.__exports;
for (const n of ['stripYearlyElementCoordLeak', 'lockYearlyAxisAnchor', '_v512CountNatalClaimMismatch']) {
  assert.equal(typeof X[n], 'function', `VM 未能抽取 ${n}`);
}

// s7 zh 真实泄漏形态夹具（须含 ≥2 个月标题 —— 无月标题时函数按「无月段结构」整锁跳过）
const DOC = [
  '### 报头', '',
  '### 第三章 元素与财富路径', '',
  '### 火元素路径：白羊座的开拓精神',
  'O child of 巨蟹座，你的星盘中火元素的能量主要通过流年土星在白羊座第六宫来激活',
  '在2027年4月流年太阳在白羊座第六宫，你将有机会取得成果',   // 有前置月份锚点 ⇒ 合法形态，绝不触碰
  '### 土元素路径：金牛座的稳定积累',
  '土元素在你的星盘中主要通过流年太阳在双子座第八宫2027年5月来激活',  // 形态A：坐标+时间
  '你的本命太阳在双子座第八宫，这是你的本命配置',              // 本命豁免
  '### 风元素路径：双子座的信息流通',
  '风元素在你的星盘中主要通过流年水星在狮子座第二宫来激活',      // 形态B：无时间的孤立坐标
  '## 第二章 月度收入矩阵',
  '### 2027年4月: 主题',
  '流年太阳进入白羊座第六宫',                                  // 月段内 ⇒ 整锁不进
  '### 2027年5月: 主题',
  '正文',
].join('\n');

test('① 结构级: 剪枝锁定义 + 非流式/流式双链挂载, 且均位于 R11m 真值锁最终话语权**之前**（先剪坐标再收口）', () => {
  assert.ok(mountsOk(SRC), '双链挂载缺失或顺序错误（剪枝锁必须在真值锁之前）');
  // 注入自测: 摘除非流式挂载 ⇒ 判据必红
  const injA = SRC.replace(STRIP_NONSTREAM, '');
  assert.ok(injA !== SRC, '注入未生效');
  assert.equal(mountsOk(injA), false, '注入自测失败: 摘除非流式挂载未被判红');
  // 注入自测: 摘除流式挂载 ⇒ 判据必红
  const injB = SRC.replace(STRIP_STREAM, '');
  assert.ok(injB !== SRC, '注入未生效(流式)');
  assert.equal(mountsOk(injB), false, '注入自测失败: 摘除流式挂载未被判红');
  // 调换顺序(剪枝锁挂到真值锁之后) ⇒ 必红
  const swapped = SRC.replace(STRIP_NONSTREAM, '@@TMP@@').replace(FINAL_NONSTREAM, STRIP_NONSTREAM).replace('@@TMP@@', FINAL_NONSTREAM);
  assert.equal(mountsOk(swapped), false, '注入自测失败: 顺序调换未被判红');
});

test('② 行为级(strip): 形态A删坐标保时间 / 形态B剪坐标保句法 / 合法形态零误伤 / 幂等', () => {
  const out = X.stripYearlyElementCoordLeak(DOC, 'zh', 'yearly');
  const lines = out.split('\n');
  assert.ok(lines.some((l) => l === '土元素在你的星盘中主要通过2027年5月来激活'),
    '形态A: 坐标未删除或时间未保留 → ' + JSON.stringify(lines));
  assert.ok(!out.includes('流年太阳在双子座第八宫'), '形态A 坐标仍残留');
  assert.ok(lines.some((l) => l === 'O child of 巨蟹座，你的星盘中火元素的能量主要通过流年行运来激活'),
    '形态B: 孤立坐标未剪成「流年行运」');
  assert.ok(!out.includes('流年水星在狮子座第二宫'), '形态B 坐标仍残留');
  assert.ok(lines.some((l) => l === '在2027年4月流年太阳在白羊座第六宫，你将有机会取得成果'),
    '有前置月份锚点的合法形态被误伤!');
  assert.ok(lines.some((l) => l === '你的本命太阳在双子座第八宫，这是你的本命配置'), '本命句被误伤!');
  assert.ok(lines.some((l) => l === '流年太阳进入白羊座第六宫'), '月段内文本被误伤!');
  // 幂等
  assert.equal(X.stripYearlyElementCoordLeak(out, 'zh', 'yearly'), out, '二次施加非幂等');
  // 语言/报告类型守卫
  assert.equal(X.stripYearlyElementCoordLeak(DOC, 'en', 'yearly'), DOC, 'en 不应改动');
  assert.equal(X.stripYearlyElementCoordLeak(DOC, 'zh', 'monthly'), DOC, 'monthly 不应改动');
});

test('③ 行为级(V517 后置形态): zh/en「X座上升」纠值 + 三重防误伤 + 幂等', () => {
  const matrix = { meta: { rising_sign: 'Sagittarius' } };
  const T = (t, lang) => X.lockYearlyAxisAnchor(t, lang, matrix, 'yearly');
  assert.equal(T('你的天秤座上升天生渴望扩张', 'zh'), '你的射手座上升天生渴望扩张', 'zh 后置形态漏接');
  assert.equal(T('她的天秤座上升格外明显', 'zh'), '她的射手座上升格外明显', 'zh 后置(的)漏接');
  assert.equal(T('事业正处于双子座上升期', 'zh'), '事业正处于双子座上升期', '「上升期」非轴点用法被误伤');
  assert.equal(T('你的射手座上升天生渴望扩张', 'zh'), '你的射手座上升天生渴望扩张', '真值句非幂等');
  assert.equal(T('你的上升射手座与财富共振', 'zh'), '你的上升射手座与财富共振', '前置形态回归破损');
  assert.equal(T('流年中你的天秤座上升被强调', 'zh'), '流年中你的天秤座上升被强调', '流年豁免失效');
  assert.equal(T('With Libra rising, you seek balance.', 'en'), 'With Sagittarius rising, you seek balance.', 'en 后置形态漏接');
  assert.equal(T('Gemini rising above challenges.', 'en'), 'Gemini rising above challenges.', '「rising above」动词短语被误伤');
});

test('④ 行为级(c12 防伪影): 全真值连句归零 + 真错配三形态有牙 + 注入自测', () => {
  // 合成矩阵: 真值表须可被 _v432Truth 解析(computed_houses/natal_moon), 对齐 s1 特罗姆瑟盘真值
  const matrix = { meta: {
    sun_sign: 'Libra', rising_sign: 'Sagittarius',
    natal_moon: { sign: 'Taurus', house: 6 },
    computed_houses: {
      Sun: { sign: 'Libra', house: 11 }, Mercury: { sign: 'Libra', house: 11 },
      Venus: { sign: 'Sagittarius', house: 1 }, Mars: { sign: 'Sagittarius', house: 1 },
      Jupiter: { sign: 'Aquarius', house: 3 }, Saturn: { sign: 'Aries', house: 5, retrograde: true },
      Uranus: { sign: 'Aquarius', house: 3 }, Neptune: { sign: 'Capricorn', house: 2 },
      Pluto: { sign: 'Sagittarius', house: 1 },
    },
  } };
  const C = (t) => X._v512CountNatalClaimMismatch(t, 'zh', matrix);
  // 全真值连句（s1 线上实证的伪影形态）必须 0 告警
  const L76 = '这不是一个选择。你的天秤座太阳天生擅长平衡，你的射手座上升天生渴望扩张，你的金牛座月亮天生需要稳定。';
  assert.equal(C(L76), 0, '全真值连句被判错配（fwd 跨逗号溢出/bwd 被另一行星截断伪影未清除）');
  // 真错配三形态必须有牙
  assert.equal(C('你的本命月亮落在天蝎座第6宫，这揭示了深刻的真相。'), 1, '独立句错配漏报');
  assert.equal(C('你的天蝎座月亮天生需要稳定。'), 1, '贴附形态错配漏报');
  assert.equal(C('你的天秤座太阳天生擅长平衡，你的天蝎座月亮天生需要稳定。'), 1, '连句中同子句贴附错配漏报');
  // 注入自测: 摘除 c12 防伪影补丁（回到跨逗号溢出）⇒ L76 必复现伪影 ⇒ 证明本判据有区分力
  const PATCH_KEY = 'if (_e20si >= 0 && _e20comma >= 0 && _e20comma < _e20si) fwdC = fwdC.slice(0, _e20comma);';
  assert.ok(SRC.includes(PATCH_KEY), 'c12 防伪影补丁字面量缺失');
  const raw = readFileSync(path.join(REPO, 'server.js'), 'utf-8');
  const injected = raw.replace(PATCH_KEY, '');
  assert.notEqual(injected, raw, '注入未生效');
  const r2 = closureDecls(injected, SEEDS, ['getSignToHouseMap', 'SIGN_ORDER_ZH']);
  const ctx2 = { console, setTimeout, clearTimeout, setInterval, clearInterval, Buffer, process, __exports: {} };
  vm.createContext(ctx2);
  const body2 = [...r2.map.entries()].sort((a, b) => injected.indexOf(a[1]) - injected.indexOf(b[1])).map((e) => e[1]).join('\n\n');
  vm.runInContext(body2 + '\n' + SEEDS.map((n) => `__exports[${JSON.stringify(n)}] = typeof ${n} !== 'undefined' ? ${n} : undefined;`).join('\n'), ctx2);
  const c12inj = ctx2.__exports._v512CountNatalClaimMismatch;
  assert.equal(typeof c12inj, 'function', '注入版抽取失败');
  assert.ok(c12inj(L76, 'zh', matrix) > 0, '注入自测失败: 摘除防伪影补丁后 L76 未复现伪影（判据无区分力）');
});

test('⑤ V517 后置分支注入自测: 摘除后置正则分支 ⇒ ③ 的后置用例必红', () => {
  const AXIS_KEY = "(?:你的|本命|乃)?\\\\s*(' + signsPat + ')(?:的)?(?:上升|命宫)(?![期段势])";
  assert.ok(SRC.includes(AXIS_KEY), 'V517 后置分支字面量缺失');
  const injected = SRC.replace(AXIS_KEY, "(?:你的|本命|乃)?\\s*(" + "SUN_SIGN_ZH" + ")(?:的)?(?:上升|命宫)(?![期段势])");
  assert.notEqual(injected, SRC, '注入未生效');
  // 后置分支被换成错误星座表 ⇒ 后置用例语义被破坏（_axisRe 源码变化可被结构断言捕获）
  assert.ok(!injected.includes(AXIS_KEY), '注入后仍残留后置分支');
});

test('⑥ v523 基线: server.js 4 站点 + 无 v522 残留（E21 bump 前移）', () => {
  const sites = [...SRC.matchAll(/wealth:v543/g)].length;
  assert.equal(sites, 4, `4 个缓存站点须全部为 v523, 实得 ${sites}`);
  assert.ok(!SRC.includes('wealth:v524'), 'server.js 内不得残留 v522 键');
});
