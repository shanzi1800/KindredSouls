// ═══════════════════════════════════════════════════════════════════════
// 🛡️ V482: 年报「星体星座真值」回归闸门
// 事故背景（2026-09-30 生产端 1999-12-15 特罗姆瑟盘）:
//   A. 真值: 太阳射手座第6宫 · 月亮【双鱼座第9宫】· 上升巨蟹座。
//      报告头部写对，正文却写成「射手座月亮在第9宫」= 月亮被串用太阳星座(sign-bleed)。
//      → 旧 _v432LockNatal 因该句无显式「本命」定语而**弃权**(设计:宁可漏改不可编) → 漂移漏网。
//   B. 隐患(探针实测): _v432Clause 的 fwd 窗口只按 /[.\n。]/ 断句、**不吃「；」** →
//      月亮从句窗口跨过「；」吃进下一句「巨蟹座上升」→ 把月亮真值(双鱼座)错扣到上升头上。
//   C. 隐患: bwd 窗口 slice(lo, Math.max(lo, bm)) 在「上一个行星名位于最近断句点之前」时
//      退化成 slice(lo, lo) = 空串 → 「星座紧邻行星名之前」的写法**从来捕不到**。
//   D. 跨月串染: 火星真值 2026-09=巨蟹座、10 月起离开巨蟹，正文把「火星在巨蟹」沿用到 11/12/2/3/5/6 月。
// 本测试: 源码级结构断言 + 假矩阵行为验证(零 python 依赖) + 【注入缺陷自测】。
// ═══════════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { getSignToHouseMap, SIGN_ORDER_ZH } from '../astro-truth.js';
import { closureDecls } from './tools/extract_decls.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf-8');

/** 取函数体(大括号配平, 跳过字符串/注释里的花括号)
 *  🛡️ V492b: 签名含默认参（如 `opts2 = {}`）⇒ 必须先配平参数表圆括号再找体首 `{`，
 *  否则 indexOf('{') 命中参数表内的 `{}`（体只剩 66 字符）⇒ 判据①②③ 全部空转。 */
function fnBody(name, source = src) {
  const at = source.indexOf(`function ${name}(`);
  assert.ok(at > 0, `未找到函数 ${name}`);
  let p = source.indexOf('(', at), pd = 0, j = p, inQ = null;
  for (; j < source.length; j++) {
    const c = source[j];
    if (inQ) { if (c === '\\') { j++; continue; } if (c === inQ) inQ = null; continue; }
    if (c === '"' || c === "'" || c === '`') { inQ = c; continue; }
    if (c === '(') pd++;
    else if (c === ')') { pd--; if (!pd) break; }
  }
  const open = source.indexOf('{', j);
  let d = 0, i = open, inS = null, inC = null;
  for (; i < source.length; i++) {
    const c = source[i];
    if (inC) { if (c === '\n') inC = null; continue; }
    if (inS) { if (c === '\\') { i++; continue; } if (c === inS) inS = null; continue; }
    if (c === '/' && source[i + 1] === '/') { inC = 1; continue; }
    if (c === '/' && source[i + 1] === '*') { const e = source.indexOf('*/', i); i = e + 1; continue; }
    if (c === '"' || c === "'" || c === '`') { inS = c; continue; }
    if (c === '{') d++;
    else if (c === '}') { d--; if (!d) break; }
  }
  return source.slice(at, i + 1);
}

/** 剥掉注释 —— 结构断言必须只看**代码**, 不能把解释性注释里的旧写法当残留代码误判 */
function stripComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

// ── 判据谓词：主判据与【注入缺陷自测】共用同一份逻辑，保证「自测证明的是这条判据会红」 ──
/** 判据①-a: _V482_FWD_BREAK 字面量必须含全部断句界定符 */
function fwdBreakDeclOk(source) {
  const decl = source.match(/const\s+_V482_FWD_BREAK\s*=\s*(\/.*?\/[a-z]*);/);
  if (!decl) return false;
  const lit = decl[1];
  for (const ch of ['\\uff1b', '\\uff01', '\\uff1f', '\\uff1a', '\\u3002', ';', '!', '?', ':']) {
    if (!lit.includes(ch)) return false;
  }
  return lit.includes('.');   // 句点：字符类里裸 `.` 与 `\.` 语义等价
}
/** 判据①-b: _v432Clause 的 fwd 必须真的用 _V482_FWD_BREAK 断句 */
function fwdBreakUsedOk(source) {
  return /fwd\.search\(_V482_FWD_BREAK\)/.test(fnBody('_v432Clause', source));
}
/** 判据②: bwd 必须先取本从句尾段、再在尾段内截断首个其他行星名(不得退回 slice(lo, Math.max(lo, bm))) */
function bwdFixOk(source) {
  const bc = stripComments(fnBody('_v432Clause', source));
  return !/Math\.max\(lo,\s*bm\)/.test(bc)
    && /tail\s*=\s*bwd\.slice\(lo\)/.test(bc)
    && /tail\.search\(cfg\.bodyAny\)/.test(bc);
}

// ═══════════════ ①~⑤ 源码级结构断言 ═══════════════
test('① fwd 断句界定符必须补「；」等(治「跨句张冠李戴」)', () => {
  assert.ok(/const\s+_V482_FWD_BREAK\s*=/.test(src), '缺少 _V482_FWD_BREAK');
  assert.ok(fwdBreakDeclOk(src), '  _V482_FWD_BREAK 字面量界定符不完整: '
    + (src.match(/const\s+_V482_FWD_BREAK\s*=\s*(\/.*?\/[a-z]*);/) || [])[1]);
  assert.ok(fwdBreakUsedOk(src), '_v432Clause 的 fwd 未使用 _V482_FWD_BREAK');
});

test('② bwd 窗口「空串退化」必须已修(治「星座紧邻行星名之前捕不到」)', () => {
  assert.ok(bwdFixOk(src), 'bwd 未改为「先取本从句尾段、再截断首个其他行星名」/ 残留旧写法 Math.max(lo, bm)');
});

test('③ 「星座紧邻行星名之前」必须识别为本命标签式(_v482SignAdjacent)', () => {
  assert.ok(/function\s+_v482SignAdjacent\s*\(/.test(src), '缺少 _v482SignAdjacent');
  const b = fnBody('_v432Clause');
  assert.ok(/_v482SignAdjacent\(text,\s*lang,\s*i\)/.test(b), '_v432Clause 未用 _v482SignAdjacent 补前向窗口');
  assert.ok(/if\s*\(!explicit\s*&&\s*!signAdjacent\)/.test(b), '未形成 !explicit && !signAdjacent 的门');
});

test('④ B 类「补本命」必须挂 _v482SignAdjacent 豁免(防「双鱼座本命月亮」倒装)', () => {
  const b = fnBody('_v432AdjudicateDescriptors');
  const m = b.match(/if\s*\(\s*!hasDesc\s*&&\s*!hasTDesc\s*&&\s*isN\s*&&\s*!isT[^\n]*/);
  assert.ok(m, '未定位到 B 类条件');
  assert.ok(/_v482SignAdjacent\(text,\s*lang,\s*m\.index\)/.test(m[0]),
    'B 类条件缺少 `&& !_v482SignAdjacent(text, lang, m.index)`');
});

test('⑤ 逐月流年行星真值锁必须存在 + 挂载 ≥3 处 + 年报护栏 + 排除月亮', () => {
  assert.ok(/function\s+lockYearlyTransitSigns\s*\(/.test(src), '缺少 lockYearlyTransitSigns');
  const b = fnBody('lockYearlyTransitSigns');
  assert.ok(/reportType\s*!==\s*'yearly'/.test(b), '缺少 reportType 年报护栏(月报会被污染)');
  const calls = (src.match(/lockYearlyTransitSigns\(/g) || []).length;
  assert.ok(calls >= 4, `挂载点不足(定义1+调用≥3): ${calls}`);
  const kv = src.match(/const\s+_V482_TRANSIT_KEYS\s*=\s*\[([^\]]*)\]/);
  assert.ok(kv && !/'Moon'/.test(kv[1]), '_V482_TRANSIT_KEYS 必须排除 Moon(周级变化)');
  assert.ok(kv && /'Mars'/.test(kv[1]) && /'Sun'/.test(kv[1]), '未覆盖 Mars/Sun');
  assert.ok(/本命\|出生\|原生\|本盘/.test(b) || /\\u672c\\u547d/.test(b), '缺少本命句守卫');
});

test('⑥ Prompt 必须含「星体星座真值铁律」(反串染/反跨月沿用, 且不得写死个案数值)', () => {
  assert.ok(/星体星座真值铁律/.test(src), '缺少中文硬约束块');
  const hasCN = /严禁把一颗星体的星座套用到另一颗/.test(src);
  assert.ok(hasCN, '缺少「反串染」条文');
  assert.ok(/逐月使用该月真值|逐月不同/.test(src), '缺少「反跨月沿用」条文');
  assert.ok(/PLANET-SIGN TRUTH RULE/.test(src), '缺少非中文语言的对应约束块');
});

test('⑦ 第五章空间标签「括号/宫位词残渣」必须收口', () => {
  const b = fnBody('forceSpaceHouseSanitizer');
  assert.ok(/V482/.test(b), 'forceSpaceHouseSanitizer 缺少 V482 收口');
  assert.ok(/卧室区域\\s\*\[:：\]/.test(b) || /卧室区域/.test(b), '缺少卧室收口');
  assert.ok(/厨房区域/.test(b) && /财务室区域/.test(b), '厨房/财务室收口缺失');
});

// ═══════════════ 行为级: vm 抽取 + 假矩阵(零 python) ═══════════════
const SEEDS = ['lockYearlyTransitSigns', 'lockYearlyMonthTitles', '_v482SignAdjacent', '_v432Clause',
  '_v432LockNatal', '_v432AdjudicateDescriptors', 'applyTruthLocksEnEsZh', '_v432Normalize', '_v432Truth',
  '_v432TruthMatch', '_v432SlotOf', '_v432ClaimOf', '_v432PatchZone', '_v432FindHouse', '_v432AllSignWords',
  '_v432Signs', '_v432SignAlts', '_V432_CFG', '_V432_NAME', '_V432_ORDER', '_V432_LANGS', '_V432_EN2LOC',
  '_V432_ZH_NUM', '_V432_ES_ORD', '_V432_ES_ORD_FORMAT', '_v432Esc', '_v479IsMonthTitleLine', '_v432LockTransit',
  '_v433LockMoonWeek', 'applyV434Locks', 'v426EnforceNatalRetrograde', '_v444Signs', '_v444Esc',
  '_V482_FWD_BREAK', '_V482_FWD_CONJ', '_V482_TRANSIT_KEYS', '_V482_TVERB', '_V478_ORD_ZH', '_V478_EN_MONTHS',
  'forceSpaceHouseSanitizer', 'SUN_SIGN_EN'];

const { map } = closureDecls(src, SEEDS, ['getSignToHouseMap', 'SIGN_ORDER_ZH']);
const dropped = [];
for (const n of [...map.keys()]) { try { new vm.Script(map.get(n)); } catch (e) { dropped.push(`${n}(${e.message.slice(0, 40)})`); map.delete(n); } }
assert.strictEqual(dropped.length, 0, `VM 抽取的声明有语法不完整项: ${dropped.join(', ')}`);
for (const n of SEEDS) assert.ok(map.has(n), `VM 未能抽取 ${n}`);

function build(hack) {
  const ctx = { getSignToHouseMap, SIGN_ORDER_ZH, console, setTimeout, clearTimeout, setInterval, clearInterval, Buffer, process, __exports: {} };
  vm.createContext(ctx);
  const bodySrc = [...map.entries()].sort((a, b) => src.indexOf(a[1]) - src.indexOf(b[1]))
    .map(e => (hack && hack[e[0]] ? hack[e[0]] : e[1])).join('\n\n');
  vm.runInContext(bodySrc + '\n' + SEEDS.map(n => `__exports[${JSON.stringify(n)}] = typeof ${n} !== 'undefined' ? ${n} : undefined;`).join('\n'), ctx);
  return ctx.__exports;
}
const F = build();

const SIGNS_EN = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
// 假本命真值盘: 复刻 1999-12-15 特罗姆瑟 (太阳射手座第6宫 / 月亮双鱼座第9宫 / 上升巨蟹座)
const CH = {
  Sun: { sign: 'Sagittarius', house: 6 }, Moon: { sign: 'Pisces', house: 9 }, Mercury: { sign: 'Sagittarius', house: 6 },
  Venus: { sign: 'Scorpio', house: 5 }, Mars: { sign: 'Aquarius', house: 8 }, Jupiter: { sign: 'Aries', house: 10, retrograde: true },
  Saturn: { sign: 'Taurus', house: 11, retrograde: true }, Uranus: { sign: 'Aquarius', house: 8 }, Neptune: { sign: 'Aquarius', house: 8 },
  Pluto: { sign: 'Sagittarius', house: 6 },
};
const months = Array.from({ length: 12 }, (_, i) => ({
  sun: { sign: SIGNS_EN[(5 + i) % 12], house: (i % 12) + 1 },
  mars: { sign: 'Cancer', house: 1 }, uranus: { sign: 'Gemini', house: 12 },
  jupiter: { sign: 'Leo', house: 2 }, saturn: { sign: 'Aries', house: 10 }, pluto: { sign: 'Aquarius', house: 8 },
  mercury: { sign: 'Sagittarius', house: 6 }, venus: { sign: 'Libra', house: 4 },
}));
months[2].mars = { sign: 'Leo', house: 2 };      // 2026-11 火星真值=狮子座(非巨蟹)
months[2].sun = { sign: 'Scorpio', house: 5 };   // 2026-11 太阳真值=天蝎座
months[2].jupiter = { sign: 'Virgo', house: 3 }; // 2026-11 木星真值=处女座第3宫(治「星座改了宫位不改」半改)
months[6].sun = { sign: 'Pisces', house: 9 };    // 2027-03 太阳真值=双鱼座(非射手)
const M = { months, meta: { computed_houses: CH, sun_sign: 'Sagittarius', rising_sign: 'Cancer' } };

const MK = (i) => { const d = new Date(Date.UTC(2026, 8 + i, 1)); return `${d.getUTCFullYear()}年${d.getUTCMonth() + 1}月`; };

test('⑧ 月亮漂移: 无「本命」定语的「射手座月亮」也必须纠为「双鱼座月亮」', () => {
  const t = '你的本命盘是一幅蓝图：射手座太阳在第6宫赋予你驱力；射手座月亮在第9宫让你在信仰中汲取情感滋养；而巨蟹座上升则为你披上外壳。';
  const out = F._v432LockNatal(t, 'zh', M);
  assert.ok(out.includes('双鱼座月亮'), '月亮未被纠为双鱼座: ' + out);
  assert.ok(!out.includes('射手座月亮'), '残留「射手座月亮」');
  assert.ok(out.includes('巨蟹座上升'), '上升被误伤(应为巨蟹座)');
  assert.ok(out.includes('射手座太阳'), '太阳被误伤(应为射手座)');
});

test('⑨ 跨句张冠李戴: 带「本命」定语时不得把月亮真值扣到「巨蟹座上升」', () => {
  const t = '本命射手座太阳在第6宫赋予你驱力；本命射手座月亮在第9宫让你汲取情感滋养；而巨蟹座上升则为你披上外壳。';
  const out = F._v432LockNatal(t, 'zh', M);
  assert.ok(out.includes('巨蟹座上升'), '上升被月亮真值污染(跨句张冠李戴): ' + out);
  assert.ok(!out.includes('双鱼座上升'), '产出「双鱼座上升」= 张冠李戴');
  assert.ok(out.includes('本命双鱼座月亮'), '月亮未被纠: ' + out);
});

test('⑩ 逐月流年行星锁: 火星/太阳的跨月串染必须按该月真值纠正', () => {
  const t = [
    `### ${MK(0)}: 太阳处女座 第3宫`,
    `🔴 9月1日至9月8日火星在巨蟹与天王星在双子形成强烈共振，构成紧张对峙。`,
    `### ${MK(2)}: 太阳天蝎座 第5宫`,
    `🔴 11月23日至11月30日火星在巨蟹与天王星在双子形成强烈共振，构成紧张对峙。`,
    `### ${MK(6)}: 太阳双鱼座 第9宫`,
    `🟢 3月12日至3月14日月亮行经双鱼座第9宫，与流月太阳在射手座第6宫形成合相。`,
    `## 第三章：正文`,                       // 段尾守卫: 章节正文不得被末月真值改写
    `你的木星在狮子座第2宫——这是正文里的通用表述, 不该被逐月锁触碰。`,
  ].join('\n');
  const out = F.lockYearlyTransitSigns(t, 'zh', M, 'yearly');
  const L = out.split('\n');
  assert.ok(L[1].includes('火星在巨蟹'), '9 月火星真值=巨蟹座, 不该被改: ' + L[1]);
  assert.ok(L[3].includes('火星在狮子') && !L[3].includes('巨蟹'), '11 月火星应纠为狮子: ' + L[3]);
  assert.ok(L[3].includes('天王星在双子'), '天王星真值=双子座, 不该被改: ' + L[3]);
  assert.ok(L[5].includes('太阳在双鱼座'), '3 月太阳应纠为双鱼座: ' + L[5]);
  assert.ok(L[5].includes('月亮行经双鱼座'), '月亮必须排除在逐月锁之外');
  assert.ok(L[7].includes('你的木星在狮子座第2宫'), '段尾守卫失效: 章节正文被末月真值改写: ' + L[7]);
});

test('⑩b 逐月流年行星锁: 星座与宫位必须同改(防「处女座第2宫」半改)', () => {
  // ⚠️ 逐月锁要求 ≥2 个月标题才启用(见 heads.length<2 早退)；单月标题=不生效,
  //    必须补足月标题数，否则本判据会**空过**(false pass)。
  const t = [
    `### ${MK(0)}: 太阳处女座 第3宫`,
    `9月无异常。`,
    `### ${MK(1)}: 太阳天秤座 第4宫`,
    `10月无异常。`,
    `### ${MK(2)}: 太阳天蝎座 第5宫`,
    `流年木星在狮子座第2宫继续顺行。`,
  ].join('\n');
  const out = F.lockYearlyTransitSigns(t, 'zh', M, 'yearly');
  const L = out.split('\n');
  assert.ok(L[5].includes('处女座第3宫'), '未把 11 月木星同改为处女座第3宫: ' + L[5]);
  assert.ok(!out.includes('处女座第2宫'), '产出半改不一致(处女座第2宫)');
});

test('⑪ 逐月流年行星锁: 正确值不动 + 幂等 + 月报零影响', () => {
  const t = [
    `### ${MK(0)}: 太阳处女座 第3宫`,
    `9月无异常。`,
    `### ${MK(2)}: 太阳天蝎座 第5宫`,
    `火星在狮子座与天王星在双子形成强烈共振。`,
  ].join('\n');
  const out = F.lockYearlyTransitSigns(t, 'zh', M, 'yearly');
  assert.strictEqual(out, t, '正确值被改动(非幂等/误伤)');
  assert.strictEqual(F.lockYearlyTransitSigns(out, 'zh', M, 'yearly'), out, '二次调用有变化');
  assert.strictEqual(F.lockYearlyTransitSigns(t, 'zh', M, 'monthly'), t, '月报路径被污染');
});

// 本命句夹具(⑫ 与注入缺陷自测共用) —— 必须 ≥2 个月标题, 否则逐月锁早退 → 判据空过
const NATAL_FIXTURE = [
  `### ${MK(0)}: 太阳处女座 第3宫`,
  `9月无异常。`,
  `### ${MK(2)}: 太阳天蝎座 第5宫`,
  `你的本命火星在巨蟹座第1宫, 这是出生定盘。`,
].join('\n');

test('⑫ 逐月流年行星锁: 本命句绝不动(宁可漏改, 绝不编)', () => {
  const out = F.lockYearlyTransitSigns(NATAL_FIXTURE, 'zh', M, 'yearly');
  assert.ok(out.includes('本命火星在巨蟹座'), '本命句被改写: ' + out);
});

test('⑬ 第五章空间标签: 括号/宫位词残渣必须收敛为规范写法', () => {
  const bad = '卧室区域:第四宫(田宅宫))田宅宫';
  const bad2 = '厨房区域:第二宫(财帛宫)与第八宫(共享资源))与第八宫(共享资源)财帛宫与第6宫共享资源';
  assert.strictEqual(F.forceSpaceHouseSanitizer(bad), '卧室区域:第四宫(田宅宫)');
  assert.strictEqual(F.forceSpaceHouseSanitizer(bad2), '厨房区域:第二宫(财帛宫)与第八宫(共享资源)');
  const ok = '* **卧室区域:第四宫(田宅宫)**';
  assert.strictEqual(F.forceSpaceHouseSanitizer(ok), ok, '规范写法被改动(非幂等)');
  const prose = '在卧室区域，放置一个以双鱼座水元素为主题的财富锚点。';
  assert.strictEqual(F.forceSpaceHouseSanitizer(prose), prose, '正文被误伤');
});

// ═══════════════ 注入缺陷自测(证明闸门会红) ═══════════════
test('【注入缺陷自测】fwd 断句退回裸 /[.\\n。]/ → 判据① 必须红', () => {
  const degraded = src.replace(/fwd\.search\(_V482_FWD_BREAK\)/, 'fwd.search(/[.\\n\\u3002]/)');
  assert.notStrictEqual(degraded, src, '未能注入缺陷');
  assert.ok(!fwdBreakUsedOk(degraded), '闸门失效: 退化后判据①(b) 仍放行');
});

test('【注入缺陷自测】_V482_FWD_BREAK 字面量退回裸 /[.\\n。]/ → 判据① 必须红', () => {
  const degraded = src.replace(/const\s+_V482_FWD_BREAK\s*=\s*\/\[[^\]]*\]\/;/, 'const _V482_FWD_BREAK = /[.\\n\\u3002]/;');
  assert.notStrictEqual(degraded, src, '未能注入缺陷');
  assert.ok(!fwdBreakDeclOk(degraded), '闸门失效: 字面量退化后判据①(a) 仍放行');
});

test('【注入缺陷自测】bwd 退回 slice(lo, Math.max(lo, ...)) → 判据② 必须红', () => {
  // 🛡️ E18/R11k: bwd 构造升级为「先取本从句尾段 → 截断首个其他行星名 → 回传 bwdOff 绝对起点 + bwdOther」，
  //   注入锚点随之同步（旧 `bwd = bm >= 0 ? … : tail` 单行写法已不存在）。
  const degraded = src.replace(
    /const tail = bwd\.slice\(lo\);[\s\S]*?if \(bm >= 0\) \{ bwd = tail\.slice\(0, bm\); bwdOther = true; \} else \{ bwd = tail; \}/,
    'const tail = bwd.slice(lo);\n    const bm = tail.search(cfg.bodyAny);\n    bwd = bwd.slice(lo, Math.max(lo, bm));',
  );
  assert.notStrictEqual(degraded, src, '未能注入缺陷');
  assert.ok(!bwdFixOk(degraded), '闸门失效: 旧写法未被判据② 识别');
});

test('【注入缺陷自测】删掉 B 类 _v482SignAdjacent 豁免 → 判据④ 必须红(行为级: 产出倒装)', () => {
  const degradedFn = map.get('_v432AdjudicateDescriptors').replace(/\s*&&\s*!_v482SignAdjacent\(text,\s*lang,\s*m\.index\)/, '');
  assert.notStrictEqual(degradedFn, map.get('_v432AdjudicateDescriptors'), '未能注入缺陷');
  // ⚠️ 必须用**真值已正确**的句子(claim=truth → B 类 isN 才成立)：
  //    漂移句(射手座月亮)因 claim≠truth 时 isN=false, B 类本来就不触发 → 会把自测做成 false pass。
  const t = '你的双鱼座月亮在第9宫让你汲取情感滋养。';
  // 先证明干净代码不产倒装（否则说明豁免本身没用）
  assert.ok(!/本命月亮/.test(F._v432LockNatal(t, 'zh', M)), '闸门失效: 干净代码也产出「本命月亮」倒装');
  const G = build({ _v432AdjudicateDescriptors: degradedFn });
  const out = G._v432LockNatal(t, 'zh', M);
  assert.ok(/双鱼座本命月亮/.test(out), '闸门失效: 豁免被删后未产出「双鱼座本命月亮」倒装: ' + out);
});

test('【注入缺陷自测】删掉逐月锁的本命守卫 → 判据⑫ 必须红(行为级)', () => {
  const degradedFn = map.get('lockYearlyTransitSigns')
    .replace(/\s*if\s*\(\s*\/\(\?:本命\|出生\|原生\|本盘\)\/\.test\(.*?\)\)\s*return full;/, '');
  assert.notStrictEqual(degradedFn, map.get('lockYearlyTransitSigns'), '未能注入缺陷(正则没匹配到本命守卫)');
  // 先证明干净代码确实守住了本命句（否则判据⑫ 是空过）
  assert.ok(F.lockYearlyTransitSigns(NATAL_FIXTURE, 'zh', M, 'yearly').includes('本命火星在巨蟹座'),
    '闸门失效: 干净代码的本命句已被改写');
  const G = build({ lockYearlyTransitSigns: degradedFn });
  const out = G.lockYearlyTransitSigns(NATAL_FIXTURE, 'zh', M, 'yearly');
  assert.ok(!out.includes('本命火星在巨蟹座'), '闸门失效: 本命守卫被删后本命句仍未被改(判据⑫ 未红): ' + out);
});
