// ═══════════════════════════════════════════════════════════════════════
// 🛡️ E64 闸门：年报「本命星缺落座落宫」Presence 真值补全（主公钦令 2026-10-17）
//
// 【病根·物证】1977-03-27 年报（v544 nocache 重生成稿）本命段四星裸奔：
//   「你的本命金星，且处于逆行状态。」「你的本命火星。第十二宫是隐藏…」
//   「你的本命天王星，逆行。」「你的本命海王星，逆行，意味着…」
//   句子是本命声明，却既无星座也无宫位。`lockYearlyBareNatalPlanets` 是「提到才纠值」
//   （正则要求行星 + 在/落入/位于 + **星座名**）⇒ 这类残句连匹配都进不去，无从纠也无从补。
//
// 【治法】`lockYearlyNatalPresence`：检出「本命 + 行星」声明但小句内无座无宫 ⇒ 按引擎真值
//   插入「落在{sign}第{cn}宫」，原标点原修饰语保留；另在裸本命锁内补「有座缺宫」分支。
//
// 【射程声明·立石】
//   已测：zh 年报的「本命X」声明形态（物证语种）——完全缺座宫、句号型、同宫句真值校验、
//        幂等、并列/共格护栏、非 zh 早退、非 yearly 早退、有座缺宫补齐、后接连词不补。
//   未测 / 不背书：en 及余下四语的介词句式（无生产物证，按「宁漏不误」不臆造）；
//        粘词（「被赞赏狮子座」「失去尊严土星」）—— 属模板占位符残留，不属本锁射程；
//        流年落宫 / 同篇矛盾 / 金块子行散文日期 —— 挂账，本闸门不为其背书。
//
// 纪律：抽取 server.js 真源装配（真函数，非复刻）+ 行为用例 + 注入反漂移 + 段位守备。
// ═══════════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { indexDecls } from './tools/extract_decls.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf-8');

// ── 真源装配（lockYearlyNatalPresence + 裸本命锁 + 闭包依赖）────────────────
// ⚠️ 铁律（E62 踩过）：给被抽取函数新增内部依赖，必须同步补进本清单，
//    否则沙箱内 ReferenceError 被 try/catch 静默吞掉 ⇒ 假绿。
const NEED = [
  'SUN_SIGN_EN', 'SUN_SIGN_ZH', 'SUN_SIGN_VI', 'SUN_SIGN_TH', 'SUN_SIGN_ES', 'SUN_SIGN_FR',
  '_V517_TRANSIT_MARK', '_v517LocalSign', '_v517BareNatalRe', '_v517Int2Cn', '_v517Cn2Int',
  '_V517_PLANET_ZH', '_V517_PLANET_EN', '_V517_PLANET_KEY_ORDER',
  '_E64_DECL_RE', '_E64_LAND_RE', '_E64_CLAUSE_END', 'lockYearlyNatalPresence',
  '_v444Signs', '_v444Esc',
  '_V516_MONTHS', '_v516Esc', '_e62StripHeadDecor', '_e62PlainHeadShape', '_v516MonthHeadKey',
  'lockYearlyBareNatalPlanets',
];

function build(source = SRC) {
  const d = indexDecls(source);
  for (const n of NEED) if (!d.has(n)) throw new Error('缺声明: ' + n);
  const code = NEED.slice()
    .sort((a, b) => source.indexOf(d.get(a)) - source.indexOf(d.get(b)))
    .map((n) => d.get(n)).join('\n\n');
  return new Function(code + '\nreturn { lockYearlyNatalPresence, lockYearlyBareNatalPlanets, _v444Signs };')();
}
const F = build();

// ── 夹具：1977-03-27 06:00 深圳 本命真值（SwissEph 引擎实测，与线上一致）─────
const HOUSES = {
  Sun: { sign: 'Aries', house: 1 },
  Moon: { sign: 'Gemini', house: 3 },
  Mercury: { sign: 'Aries', house: 1 },       // ← 与太阳同宫（「与太阳同宫」句的真值依据）
  Venus: { sign: 'Aries', house: 1 },
  Mars: { sign: 'Pisces', house: 12 },
  Jupiter: { sign: 'Taurus', house: 2 },
  Saturn: { sign: 'Leo', house: 5 },
  Uranus: { sign: 'Scorpio', house: 8 },
  Neptune: { sign: 'Sagittarius', house: 9 },
  Pluto: { sign: 'Libra', house: 7 },
};
const M = { meta: { computed_houses: HOUSES } };
const runPresence = (t, lang = 'zh', m = M, rt = 'yearly') => F.lockYearlyNatalPresence(t, lang, m, rt);
const runBare = (t, lang = 'zh', m = M, rt = 'yearly') => F.lockYearlyBareNatalPlanets(t, lang, m, rt);

// ═════════════════════ 一、结构（修法落地形态）═════════════════════

test('E64-S1 识别真源函数存在且射程限定 zh / yearly', () => {
  assert.ok(typeof F.lockYearlyNatalPresence === 'function', '缺 lockYearlyNatalPresence');
  const body = SRC.slice(SRC.indexOf('function lockYearlyNatalPresence('));
  const fnBody = body.slice(0, body.indexOf('\n}\n') + 3);
  assert.match(fnBody, /if \(reportType !== 'yearly'\) return text;/, '缺 yearly 早退');
  assert.match(fnBody, /if \(lang !== 'zh'\) return text;/, '缺 zh 射程早退（不得悄悄扩语种）');
});

test('E64-S2 挂载顺序：Presence 补全必须先于裸本命锁纠值', () => {
  const i = SRC.indexOf('function _v517YearlyFinalLocks(');
  assert.ok(i > 0, '缺 _v517YearlyFinalLocks');
  const blk = SRC.slice(i, SRC.indexOf('\n}\n', i));
  const iPresence = blk.indexOf('lockYearlyNatalPresence(t,');
  const iBare = blk.indexOf('lockYearlyBareNatalPlanets(t,');
  const iAxis = blk.indexOf('lockYearlyAxisAnchor(t,');
  assert.ok(iPresence > 0, 'Presence 未挂进统一入口');
  assert.ok(iBare > 0, '裸本命锁未挂进统一入口');
  assert.ok(iAxis < iPresence, '顺序错：上升锚点须在最前');
  assert.ok(iPresence < iBare, '顺序错：必须先补全再纠值（否则残句永远进不了纠值正则）');
});

test('E64-S3 裸本命锁含「有座缺宫」补齐分支，且只在 zh 生效', () => {
  const i = SRC.indexOf('function lockYearlyBareNatalPlanets(');
  const blk = SRC.slice(i, SRC.indexOf('\n}\n', i));
  assert.match(blk, /else if \(!houseTok && t\.house && lang === 'zh'\)/, '缺「有座缺宫」分支');
  assert.match(blk, /_v517Int2Cn\(t\.house\)/, '补宫须走中文数字真源');
  assert.match(blk, /\[\uff0c\u3002\uff1b\uff01\uff1f\u3001\\n\]/, '缺「星座词后紧跟句读」守卫（会插断从句）');
});

test('E64-S4 星座本地化真源已含「座」后缀 —— 拼接不得再补「座」（防空双座）', () => {
  const zh = F._v444Signs('zh');
  assert.ok(Array.isArray(zh) && zh.length === 12, 'zh 星座表异常');
  assert.ok(zh.every((s) => s.endsWith('\u5ea7')), 'zh 星座名应自带「座」');
  assert.ok(!SRC.includes("'落在' + t.sign + '座第'"), '仍在拼「座」字面量（会出「白羊座座」）');
});

// ═════════════════════ 二、行为（真函数跑物证原文）═════════════════════

test('E64-B1 完全缺座宫（逗号型）：本命金星 ⇒ 补「落在白羊座第一宫」且保留原修饰语', () => {
  const got = runPresence('\u4f60\u7684\u672c\u547d\u91d1\u661f\uff0c\u4e14\u5904\u4e8e\u9006\u884c\u72b6\u6001\u3002');
  assert.strictEqual(got, '\u4f60\u7684\u672c\u547d\u91d1\u661f\u843d\u5728\u767d\u7f8a\u5ea7\u7b2c\u4e00\u5bab\uff0c\u4e14\u5904\u4e8e\u9006\u884c\u72b6\u6001\u3002');
});

test('E64-B2 完全缺座宫（句号型）：本命火星 ⇒ 补「落在双鱼座第十二宫」，后句不吞', () => {
  const src = '\u4f60\u7684\u672c\u547d\u706b\u661f\u3002\u7b2c\u5341\u4e8c\u5bab\u662f\u9690\u85cf\u7684\u5bab\u4f4d\u3002';
  const got = runPresence(src);
  assert.strictEqual(got, '\u4f60\u7684\u672c\u547d\u706b\u661f\u843d\u5728\u53cc\u9c7c\u5ea7\u7b2c\u5341\u4e8c\u5bab\u3002\u7b2c\u5341\u4e8c\u5bab\u662f\u9690\u85cf\u7684\u5bab\u4f4d\u3002');
});

test('E64-B3 已完整声明（落在X座第N宫）零改动 —— 幂等基石', () => {
  const src = '\u4f60\u7684\u672c\u547d\u592a\u9633\u843d\u5728\u767d\u7f8a\u5ea7\u7b2c\u4e00\u5bab\uff0c\u8fd9\u4e0d\u662f\u4e00\u4e2a\u6e29\u548c\u7684\u914d\u7f6e\u3002';
  assert.strictEqual(runPresence(src), src);
});

test('E64-B4 并列主语护栏：「本命太阳与水星」不得被拆断（物证实测 3 处误伤之一）', () => {
  const src = '\u4f60\u7684\u672c\u547d\u592a\u9633\u4e0e\u6c34\u661f\uff0c\u706b\u5143\u7d20\u7684\u6269\u5f20\u6027\u5728\u4f60\u8eab\u4e0a\u8868\u73b0\u4e3a\u5148\u884c\u52a8\u3002';
  assert.strictEqual(runPresence(src), src);
});

test('E64-B5 共格宾语护栏：「与你的本命木星同宫」「将与本命木星同频共振」零改动', () => {
  const a = '\u6d41\u5e74\u592a\u9633\u8fdb\u5165\u91d1\u725b\u5ea7\u7b2c\u4e8c\u5bab\uff0c\u4e0e\u4f60\u7684\u672c\u547d\u6728\u661f\u540c\u5bab\uff0c\u8fd9\u662f\u5168\u5e74\u6700\u5f3a\u7684\u6708\u4efd\u3002';
  const b = '\u672c\u8d22\u5e74\u6d41\u5e74\u592a\u9633\u57282027\u5e745\u6708\u8fdb\u5165\u767d\u7f8a\u5ea7\u7b2c1\u5bab\u65f6\uff0c\u5c06\u4e0e\u672c\u547d\u6728\u661f\u540c\u9891\u5171\u632f\u3002';
  assert.strictEqual(runPresence(a), a);
  assert.strictEqual(runPresence(b), b);
});

test('E64-B6 同宫句：真值确同宫 ⇒ 补（补完自洽）；真值不同宫 ⇒ 跳过（不制造自相矛盾）', () => {
  const src = '\u4f60\u7684\u672c\u547d\u6c34\u661f\uff0c\u4e0e\u592a\u9633\u540c\u5bab\u3002';
  assert.strictEqual(runPresence(src), '\u4f60\u7684\u672c\u547d\u6c34\u661f\u843d\u5728\u767d\u7f8a\u5ea7\u7b2c\u4e00\u5bab\uff0c\u4e0e\u592a\u9633\u540c\u5bab\u3002');
  const bad = { meta: { computed_houses: { ...HOUSES, Mercury: { sign: 'Pisces', house: 12 } } } };
  assert.strictEqual(runPresence(src, 'zh', bad), src, '同宫断言与真值不符时不得硬补');
});

test('E64-B7 幂等：补全后的文本二次跑零改动（整篇物证级）', () => {
  const src = [
    '\u4f60\u7684\u672c\u547d\u6c34\u661f\uff0c\u4e0e\u592a\u9633\u540c\u5bab\u3002',
    '\u4f60\u7684\u672c\u547d\u91d1\u661f\uff0c\u4e14\u5904\u4e8e\u9006\u884c\u72b6\u6001\u3002',
    '\u4f60\u7684\u672c\u547d\u706b\u661f\u3002\u7b2c\u5341\u4e8c\u5bab\u662f\u9690\u85cf\u7684\u5bab\u4f4d\u3002',
    '\u4f60\u7684\u672c\u547d\u5929\u738b\u661f\uff0c\u9006\u884c\u3002\u7b2c\u516b\u5bab\u662f\u5171\u4eab\u8d44\u6e90\u3002',
    '\u4f60\u7684\u672c\u547d\u6d77\u738b\u661f\uff0c\u9006\u884c\uff0c\u610f\u5473\u7740\u4f60\u5bf9\u8fdc\u65b9\u7684\u5411\u5f80\u3002',
  ].join('\n');
  const once = runPresence(src);
  assert.notStrictEqual(once, src, '样例须被补全（否则幂等测试无意义）');
  assert.strictEqual(runPresence(once), once, '二次跑必须零改动');
  assert.strictEqual((once.match(/\u843d\u5728/g) || []).length, 5, '应补 5 处');
  assert.ok(!once.includes('\u5ea7\u5ea7'), '出现双「座」');
});

test('E64-B8 射程：非 zh 语种零改动（en/es/fr/th/vi 均不臆造）', () => {
  const src = 'Your natal Venus, which is retrograde.';
  for (const lg of ['en', 'es', 'fr', 'th', 'vi']) {
    assert.strictEqual(runPresence(src, lg), src, lg + ' 不应改动');
  }
});

test('E64-B9 射程：非年报零改动', () => {
  const src = '\u4f60\u7684\u672c\u547d\u91d1\u661f\uff0c\u4e14\u5904\u4e8e\u9006\u884c\u72b6\u6001\u3002';
  assert.strictEqual(runPresence(src, 'zh', M, 'monthly'), src);
  assert.strictEqual(runPresence(src, 'zh', M, 'once'), src);
});

test('E64-B10 真值缺失 ⇒ fail-closed 零改动（不得凭空造座宫）', () => {
  const src = '\u4f60\u7684\u672c\u547d\u91d1\u661f\uff0c\u4e14\u5904\u4e8e\u9006\u884c\u72b6\u6001\u3002';
  assert.strictEqual(runPresence(src, 'zh', { meta: {} }), src);
  assert.strictEqual(runPresence(src, 'zh', null), src);
  assert.strictEqual(runPresence(src, 'zh', { meta: { computed_houses: { Venus: { sign: 'Aries' } } } }), src, '无宫位不得硬补');
});

test('E64-B11 裸本命锁「有座缺宫」：本命木星在金牛座， ⇒ 补第二宫', () => {
  const got = runBare('\u4f60\u7684\u672c\u547d\u6728\u661f\u5728\u91d1\u725b\u5ea7\uff0c\u8fd9\u662f\u6700\u73cd\u8d35\u7684\u914d\u7f6e\u3002');
  assert.strictEqual(got, '\u4f60\u7684\u672c\u547d\u6728\u661f\u5728\u91d1\u725b\u5ea7\u7b2c\u4e8c\u5bab\uff0c\u8fd9\u662f\u6700\u73cd\u8d35\u7684\u914d\u7f6e\u3002');
});

test('E64-B12 裸本命锁：星座词后接「与」（从句未完）不插宫 —— 宁漏不误', () => {
  const src = '\u4f60\u7684\u672c\u547d\u6708\u4eae\u5728\u53cc\u5b50\u5ea7\u4e0e\u6728\u661f\u5f62\u6210\u76f8\u4f4d\u3002';
  assert.strictEqual(runBare(src), src);
});

// ═════════════════════ 三、注入反漂移（摘掉修复必红）═════════════════════

test('E64-J1 注入：摘掉并列/共格护栏 ⇒ B4 必红（证明护栏有判别力）', () => {
  const src = SRC.split('if (/^[\u4e0e\u548c\u53ca\u8ddf\u540c\u3001]/.test(after)) return m;').join('');
  assert.notStrictEqual(src, SRC, '注入锚点失配（护栏字面量已变）');
  const f = build(src).lockYearlyNatalPresence;
  const t = '\u4f60\u7684\u672c\u547d\u592a\u9633\u4e0e\u6c34\u661f\uff0c\u706b\u5143\u7d20\u7684\u6269\u5f20\u6027\u3002';
  assert.notStrictEqual(f(t, 'zh', M, 'yearly'), t, '摘掉护栏后仍未改动 ⇒ 用例无判别力');
});

test('E64-J2 注入：摘掉 zh 射程早退 ⇒ 中文文本传 en 必被改写（证明射程锁真实生效）', () => {
  const src = SRC.split('if (lang !== \'zh\') return text;').join('');
  assert.notStrictEqual(src, SRC, '注入锚点失配');
  const f = build(src).lockYearlyNatalPresence;
  // 用**中文**文本传 en：若射程锁失效，中文座宫会被插进 en 语料 ⇒ 必红
  const t = '\u4f60\u7684\u672c\u547d\u91d1\u661f\uff0c\u9006\u884c\u3002';
  assert.notStrictEqual(f(t, 'en', M, 'yearly'), t, '摘掉射程锁后仍零改动 ⇒ 射程断言无判别力');
});

test('E64-J3 注入：拼接处补回「座」⇒ 双座必现（证明 S4 的字面量禁令有判别力）', () => {
  const src = SRC.split("'\u843d\u5728' + t.sign + '\u7b2c'").join("'\u843d\u5728' + t.sign + '\u5ea7\u7b2c'");
  assert.notStrictEqual(src, SRC, '注入锚点失配');
  const f = build(src).lockYearlyNatalPresence;
  const got = f('\u4f60\u7684\u672c\u547d\u91d1\u661f\uff0c\u9006\u884c\u3002', 'zh', M, 'yearly');
  assert.ok(got.includes('\u767d\u7f8a\u5ea7\u5ea7'), '未复现双座 ⇒ 注入无效');
});

// ═════════════════════ 四、段位 ═════════════════════

test('E64-C 闸门已接入 test:astro 长链，且 e40-compat 仍居倒数第二位', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const segs = pkg.scripts['test:astro'].split('&&').map((s) => s.trim()).filter(Boolean);
  const iSelf = segs.findIndex((s) => s.includes('audit-e64-natal-presence'));
  const iCap = segs.findIndex((s) => s.includes('audit-e40-compat-synastry-tensor-fusion'));
  assert.ok(iSelf >= 0, 'E64 闸门未接入 test:astro');
  assert.ok(iCap === segs.length - 2, `e40-compat 段位漂移：${iCap} / len=${segs.length}（须为 len-2）`);
  assert.ok(iSelf < iCap, 'E64 闸门须排在 e40-compat 之前');
});
