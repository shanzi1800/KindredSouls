// ═══════════════════════════════════════════════════════════════════════════
// E16/R11i 闸门: 泰语 HIT 链 natal 锁污染月标题 · 治本验证
// 线上 v515 实证 P0（2026-10-05 12 盘批测）:
//   s6 阿皮亚 / s9 曼谷 —— MISS 产物（已落库）12 个月标题真值全对, 但 HIT 响应里
//   12 个标题星座被改写成 natal Sun 星座（s6=ตุลย์/Libra、s9=พิจิก/Scorpio）。
// 根因链（三层, 本闸门逐层钉死）:
//   ① `lockNatalTruthTh` 对月标题行零豁免: 标题 `ดวงอาทิตย์ในกรกฎ ภพที่ 11 · ธีม: …`
//      的从句窗口被 `:`（_TH_CLAUSE_BREAK 成员）截断, 不含 transit 动词 ⇒ natal 门接受
//      ⇒ 按本命真值整句改写。MISS 链尾有 lockYearlyMonthTitles 兜底纠回, HIT 链没有
//      ⇒ 同一缓存键 HIT 返回坏版（用户可见）。
//   ② `_thHasHouse` 前缀子串误判: `ภพที่ 1` ⊂ `ภพที่ 11/12` ⇒ 真值宫位=1 时标题
//      11/12 宫被误判「已正确」⇒ 只改星座不改宫位 ⇒ 形成「星座全错、宫位半对」的 B 版。
//   ③ HIT th 链用 months[0] 单月口径的 lockTransitTruthTh（月报设计）服务年报。
// 治法（本闸门验证）: 标题行豁免 + 宫位数字边界 + HIT 年报分流（逐月真值锁对称挂载）。
// 方法论铁律: 每条判据都配「注入复刻旧缺陷」自测 —— 注入后必须复现线上坏版, 否则判据无判别力。
// ═══════════════════════════════════════════════════════════════════════════
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf-8');
const LINES = SRC.split('\n');

// ── 抽取器: 函数（括号配平 + 字符串/注释跳越）与单行/花括号常量 ──
function grabFn(source, name) {
  const at = source.indexOf(`function ${name}(`);
  if (at < 0) throw new Error(`no fn ${name}`);
  let i = source.indexOf('{', at), pd = 0;
  for (; i < source.length; i++) {
    const c = source[i];
    if (c === '{') pd++;
    else if (c === '}') { pd--; if (pd === 0) break; }
    else if (c === '"' || c === "'" || c === '`') {
      const q = c; i++;
      for (; i < source.length; i++) { if (source[i] === '\\') { i++; continue; } if (source[i] === q) break; }
    } else if (c === '/' && source[i + 1] === '*') { i = source.indexOf('*/', i) + 1; }
    else if (c === '/' && source[i + 1] === '/') { i = source.indexOf('\n', i); }
  }
  return source.slice(at, i + 1);
}
function grabBrace(source, name) {
  const at = source.indexOf(`const ${name} `) >= 0 ? source.indexOf(`const ${name} `) : source.indexOf(`let ${name} `);
  if (at < 0) throw new Error(`no const ${name}`);
  let i = source.indexOf('{', at), pd = 0;
  for (; i < source.length; i++) {
    const c = source[i];
    if (c === '{') pd++;
    else if (c === '}') { pd--; if (pd === 0) { i++; break; } }
    else if (c === '"' || c === "'" || c === '`') {
      const q = c; i++;
      for (; i < source.length; i++) { if (source[i] === '\\') { i++; continue; } if (source[i] === q) break; }
    }
  }
  return source.slice(at, i);
}
function grabLine(source, name) {
  const at = source.indexOf(`const ${name} `);
  if (at < 0) throw new Error(`no line ${name}`);
  return source.slice(at, source.indexOf('\n', at));
}

// 🛡️ 生产实态: SUN_SIGN_TH 是「短形」（กรกฎ/ตุลย์）—— 种错种子（ราศี 前缀）会假绿,
//   这正是 2026-10-05 排障时复现失败半小时的根因, 以此判据钉死。
const SEED = `
const SUN_SIGN_TH = ['เมษ','พฤษภ','มิถุน','กรกฎ','สิงห์','กันยา','ตุลย์','พิจิก','ธนู','มังกร','กุมภ์','มีน'];
const _EN2ZIDX = { Aries:0, Taurus:1, Gemini:2, Cancer:3, Leo:4, Virgo:5, Libra:6, Scorpio:7, Sagittarius:8, Capricorn:9, Aquarius:10, Pisces:11 };
`;
function buildChain(source) {
  const parts = [
    grabBrace(source, '_TH_PLANET'),
    'const _TH_PLANET_ORDER = ["Sun","Moon","Mercury","Venus","Mars","Jupiter","Saturn","Uranus","Neptune","Pluto"];',
    'let _TH_SIGN_UNIQ_CACHE = null;',
    grabLine(source, '_TH_SIGN_UNIQ'),
    grabLine(source, '_TH_TRANSIT_MARK'),
    grabLine(source, '_TH_CLAUSE_BREAK'),
    grabLine(source, '_TH_BODY_ANY'),
    grabLine(source, '_TH_AXIS'),
    grabFn(source, '_thHasHouse'),
    grabFn(source, '_natalTruthMap10_TH'),
    grabFn(source, '_thClause'),
    grabFn(source, '_thPatchZone'),
    grabFn(source, 'lockNatalTruthTh'),
  ].join('\n');
  const F = new Function(SEED + '\n' + parts + '\nreturn { lockNatalTruthTh, _natalTruthMap10_TH };')();
  return { F };
}

// 夹具: 12 个月标题（7月=Cancer H11 … 6月=门真值形态同 s6 生产样例）+ 一句本命正文
const MONTHS_TH = ['กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม','มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน'];
const A_SIGNS = ['กรกฎ','สิงห์','กันยา','ตุลย์','พิจิก','ธนู','มังกร','กุมภ์','มีน','เมษ','พฤษภ','เมถุน'];
const A_HOUSE = [11, 12, 1, 1, 2, 4, 5, 6, 7, 7, 8, 10];
function makeReport() {
  const heads = MONTHS_TH.map((m, i) => `### ${m} พ.ศ. 2569: ดวงอาทิตย์ใน${A_SIGNS[i]} ภพที่ ${A_HOUSE[i]} · ธีม: รายเดือน`);
  const body = 'ดวงอาทิตย์ของท่านสถิตในราศีตุลย์ ภพที่ 11 ซึ่งเป็นภพแห่งเครือข่าย.';
  return heads.join('\n') + '\n\n' + body + '\n';
}
// natal 真值: Sun = Libra(ตุลย์) H1 —— s6 阿皮亚生产实态
const NATAL_MATRIX = { meta: { sun_sign: 'Libra', computed_houses: { Sun: { sign: 'Libra', house: 1 } } } };
const titleLines = (t) => t.split('\n').filter((l) => l.startsWith('### '));

test('① 行为级: natal 锁对 12 个月标题零改动（标题行豁免）', () => {
  const { F } = buildChain(SRC);
  const out = F.lockNatalTruthTh(makeReport(), NATAL_MATRIX);
  const before = titleLines(makeReport());
  const after = titleLines(out);
  assert.equal(after.length, 12, '标题行数不得减少');
  assert.deepEqual(after, before, '月标题必须逐字保留（真值由 lockYearlyMonthTitles 专职负责）');
});

test("①' 注入自测: 删除标题豁免 ⇒ 必须复现线上 B 版污染（判据有判别力）", () => {
  const anchor = 'if (_inHead(m.index)) continue;';
  assert.ok(SRC.includes(anchor), '产品源码须含标题豁免行');
  const INJ = SRC.replace(anchor, 'if (false) continue;');
  assert.notEqual(INJ, SRC, '注入未生效');
  const { F } = buildChain(INJ);
  const out = F.lockNatalTruthTh(makeReport(), NATAL_MATRIX);
  const after = titleLines(out);
  const corrupted = after.filter((l) => l.includes('ตุลย์')).length;
  // 真值=ตุลย์ H1 ⇒ 无豁免时 11 个非本命标题星座全被改写成 ตุลย์（线上 B 版形态）
  assert.ok(corrupted >= 10, `注入后标题污染数=${corrupted}（应 ≥10, 复现线上 B 版）`);
});

test('② 行为级: 宫位数字边界 —— `ภพที่ 11` 不再被真值宫位=1 子串误判, 本命正文宫位 11→1 得到纠正', () => {
  const { F } = buildChain(SRC);
  const src = 'ดวงอาทิตย์ของท่านสถิตในราศีตุลย์ ภพที่ 11 ซึ่งเป็นภพแห่งเครือข่าย.\n';
  const out = F.lockNatalTruthTh(src, NATAL_MATRIX);
  assert.ok(out.includes('ภพที่ 1 '), `宫位必须被纠正为真值 1（旧缺陷: 子串误判致跳过）, 实得: ${out.trim()}`);
  assert.ok(!out.includes('ภพที่ 11'), '不得残留 11 宫');
});

test("②' 注入自测: _thHasHouse 数字边界退化 ⇒ 宫位纠正必须失效（复刻旧缺陷）", () => {
  const anchor = "return new RegExp('(?:เรือนที่|บ้าน|ภพที่)\\\\s*' + h + '(?!\\\\d)').test(zone);";
  assert.ok(SRC.includes(anchor), '产品源码须含数字边界正则');
  const INJ = SRC.replace('(?!\\\\d)', '');
  assert.notEqual(INJ, SRC, '注入未生效');
  const { F } = buildChain(INJ);
  const src = 'ดวงอาทิตย์ของท่านสถิตในราศีตุลย์ ภพที่ 11 ซึ่งเป็นภพแห่งเครือข่าย.\n';
  const out = F.lockNatalTruthTh(src, NATAL_MATRIX);
  assert.ok(out.includes('ภพที่ 11'), '注入后旧缺陷复现: 11 宫因 `ภพที่ 1` 子串误判而幸存');
});

test('③ 行为级: 豁免不过度 —— 非标题行的真值纠错依然生效（正文 natal 句照常纠正）', () => {
  const { F } = buildChain(SRC);
  const src = 'ดวงอาทิตย์ของท่านสถิตในราศีเมษ ภพที่ 3 ซึ่งเป็นภพแห่งการสื่อสาร.\n';
  const out = F.lockNatalTruthTh(src, NATAL_MATRIX);
  assert.ok(out.includes('ตุลย์'), '正文 natal 句星座必须纠正为ตุลย์');
  assert.ok(out.includes('ภพที่ 1 '), '正文 natal 句宫位必须纠正为 1');
});

test('④ E16/R11i→E18/R11k: HIT th 分支已收拢（命中即终局，不再跑任何锁）', () => {
  // 🛡️ E18/R11k（军师裁决② Clean HIT Pipeline）: HIT 侧收拢为「命中即终局，不再跑锁链」。
  //   旧 E16/R11i 的「HIT th natal 锁 + 年报/月报分流（lockYearlyMonthTitles/TransitSigns/TransitTruthTh）」
  //   已**整体删除** —— HIT 与 MISS 链「同集不同序」正是同一缓存键产出两份报告的病根
  //   （v517 线上 12 盘实证：HIT th 链把月标题星座改写成 natal Sun）。
  assert.ok(/Clean HIT Pipeline/.test(SRC), '缺 E18/R11k Clean HIT Pipeline 段（HIT 收拢未落地）');
  assert.ok(!/lockNatalTruthTh\(enforceRiskThreshold\(stdCached/.test(SRC), 'HIT th 分支不得再挂 natal 锁（E18/R11k 命中即终局）');
  assert.ok(!/lockYearlyMonthTitles\(stdCached/.test(SRC), 'HIT 侧不得再挂 lockYearlyMonthTitles（E18/R11k 命中即终局）');
  assert.ok(!/lockYearlyTransitSigns\(stdCached/.test(SRC), 'HIT 侧不得再挂 lockYearlyTransitSigns（E18/R11k 命中即终局）');
  assert.ok(!/lockTransitTruthTh\(stdCached/.test(SRC), 'HIT 侧不得再挂 lockTransitTruthTh（E18/R11k 命中即终局）');
});

test("④' 注入自测: 注回 HIT th natal 锁 ⇒ ④ 必红（复刻旧缺陷形态）", () => {
  const injected = SRC.replace('let stdCached = cachedText;',
    "let stdCached = cachedText;\n        stdCached = lockNatalTruthTh(enforceRiskThreshold(stdCached, lang), _hitAstroTh);");
  assert.notEqual(injected, SRC, '注入未生效');
  assert.ok(/lockNatalTruthTh\(enforceRiskThreshold\(stdCached/.test(injected),
    '注回后 HIT 锁必须出现（否则 ④ 的否定断言无判别力）');
});

test('⑤ 结构级: MISS 链两路（非流式/落库前）兜底锁不得回退；流式 HIT 侧零挂载（E18/R11k）', () => {
  const miss = SRC.indexOf('reportContent = lockYearlyMonthTitles(reportContent, lang, astroMatrix, reportType)');
  const cleaned = SRC.indexOf('cleanedText = lockYearlyMonthTitles(cleanedText, lang, astroMatrix, reportType)');
  assert.ok(miss > 0 && cleaned > 0, 'MISS 两路兜底锁必须齐全');
  // 🛡️ E18/R11k: 流式 HIT 的 `streamText = lockYearlyMonthTitles(streamText, …)` 与
  //   HIT th 链 `stdCached = lockYearlyMonthTitles(stdCached, …)` 均已删除（命中即终局）。
  assert.ok(!/streamText = lockYearlyMonthTitles\(streamText/.test(SRC), '流式 HIT 侧兜底锁必须删除（E18/R11k 命中即终局）');
  assert.ok(!SRC.includes('stdCached = lockYearlyMonthTitles('), 'HIT 侧兜底锁必须删除（E18/R11k 命中即终局）');
});

test('⑥ 种子自检: 链沙箱的 SUN_SIGN_TH 必须是生产短形（种错 ⇒ 全闸门假绿）', () => {
  const m = SRC.match(/const SUN_SIGN_TH = \[([^\]]+)\]/);
  assert.ok(m, '未找到 SUN_SIGN_TH');
  const first = m[1].split(',')[0].trim();
  assert.ok(!first.includes('ราศี'), `SUN_SIGN_TH 须为短形（实得 ${first}）—— 若改为ราศี前缀, 本闸门种子须同步`);
});
