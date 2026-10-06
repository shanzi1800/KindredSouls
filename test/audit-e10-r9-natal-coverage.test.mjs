// ═══════════════════════════════════════════════════════════════════════
// 🛡️ E10/R9: 前导段补漏三件套 —— 回归闸门
// 事故背景（2026-10-03 Adelaide v508 线上验收④ 部分未过）:
//   ① Moon "burns in Leo in the 7th."（句尾裸序数）—— houseNum/houseOrd 都强制 "House"
//      关键词 → 漏网（真值 8th）；
//   ② "Core Natal Code: … Rising Leo" / "rising through Leo" / "O child of Leo" ——
//      均无行星名 → _v432LockNatal 按设计不进锁（真值 ASC=Capricorn / Sun=Sagittarius）。
// 治本（军师三裁决）:
//   R1 en houseBare 裸序数识别（in the|in your 前缀 + House/of/月份名 否定前瞻 + 1~12 钳制）
//   R2 _v492cLockAxisSalutation 轴点+称谓真值锁（挂行星锁之后=最终话语权）
//   R3 CRITIC 拦截 → 静默重试 1 次 → _e10CacheDecision 终局裁定（截断红线绝不入库）
// 本测试: 源码级结构断言 + 假矩阵行为验证(零 python) + 【注入缺陷自测】。
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
const purgeSrc = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'purge-tz-poison-cache.mjs'), 'utf-8');

/** 取函数体(大括号配平, 跳过字符串/注释里的花括号); 签名默认参须先配平参数表圆括号 */
function fnBody(name, source = src) {
  const at = source.indexOf(`function ${name}(`);
  assert.ok(at > 0, `未找到函数 ${name}`);
  let p = source.indexOf('(', at), pd = 0, j = p, inS2 = null;
  for (; j < source.length; j++) {
    const c = source[j];
    if (inS2) { if (c === '\\') { j++; continue; } if (c === inS2) inS2 = null; continue; }
    if (c === '"' || c === "'" || c === '`') { inS2 = c; continue; }
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

function stripComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

// ═══════════════ 源码级结构断言 ═══════════════
test('① R1: en cfg 必须有 houseBare 裸序数正则，且三重防误伤护栏齐全', () => {
  const m = src.match(/houseBare:\s*\/(\/i)?/);
  assert.ok(src.match(/houseBare:\s*\/.+\/i,/), 'en cfg 缺少 houseBare');
  const decl = src.match(/houseBare:\s*(\/[^\n]+\/i),/);
  const body = decl[1];
  assert.ok(/in\\s\+\(\?:the\|your\)/.test(body), '裸序数必须要求 in the|in your 前缀(否则 July 7th 会命中)');
  assert.ok(/House\\b/.test(body), '缺少 House 否定前瞻(会与 houseOrd 双重命中)');
  assert.ok(/of\\b/.test(body), '缺少 of 否定前瞻(会误伤 the 7th of July 日期)');
  assert.ok(/January\|February\|March/.test(body), '缺少月份名否定前瞻(会误伤 in the 7th, July 2026)');
  assert.ok(/houseBareFmt:\s*\(n\)/.test(src), '缺少 houseBareFmt(裸序数须保形写回, 不长出 House)');
  assert.ok(/'in the '\s*\+ n \+ _v432EnOrdSuf\(n\)/.test(src), 'houseBareFmt 未保形(in the Nth)');
});

test('② R1: _v432FindHouse 必须消费 houseBare 且 1~12 值域钳制；PatchZone 按 bare 选格式', () => {
  const fh = stripComments(fnBody('_v432FindHouse'));
  assert.ok(/cfg\.houseBare/.test(fh), '_v432FindHouse 未消费 houseBare');
  assert.ok(/v >= 1 && v <= 12/.test(fh), '裸序数缺少 1~12 值域钳制(第 13th+ 恒非宫位)');
  assert.ok(/ord:\s*'bare'/.test(fh), "裸序数命中未标 ord:'bare'");
  const pz = stripComments(fnBody('_v432PatchZone'));
  assert.ok(/houseBareFmt\(house\)/.test(pz), 'PatchZone 未按 bare 选用 houseBareFmt');
});

test('③ R2: _v492cLockAxisSalutation 存在且挂载在 _v432LockLeadingNatal 行星锁之后', () => {
  assert.ok(/function\s+_v492cLockAxisSalutation\s*\(/.test(src), '缺少轴点/称谓真值锁');
  const b = stripComments(fnBody('_v432LockLeadingNatal'));
  const atNatal = b.indexOf('_v432LockNatal(');
  const atAxis = b.indexOf('_v492cLockAxisSalutation(');
  assert.ok(atNatal >= 0 && atAxis > atNatal, '轴点锁未挂在行星锁之后(fwd2 会把纠好的轴点吃回去伪造)');
  const ax = stripComments(fnBody('_v492cLockAxisSalutation'));
  assert.ok(/meta\.rising_sign/.test(ax), '轴点真值未取 meta.rising_sign');
  assert.ok(/meta\.sun_sign/.test(ax), '称谓真值未取 meta.sun_sign');
  assert.ok(/_V432_LANGS\.includes\(lang\)/.test(ax), '缺少语言门控');
  assert.ok(/isSignTok/.test(ax), '缺少星座词表守卫(Rising Star/rising costs 不得误伤)');
  assert.ok(/O\\s\+child\\s\+of/.test(ax) || /O\s\+child\s\+of/.test(ax), '缺少 O child of 称谓句式');
  assert.ok(/rising\\s\+through/.test(ax), '缺少 rising through 句式');
});

test('④ R3: 重试设施三件齐 —— 强约束块/纯函数裁定/端点单次重试 + 截断红线', () => {
  assert.ok(/function\s+_E10_RETRY_CONSTRAINT\s*\(/.test(src), '缺少 _E10_RETRY_CONSTRAINT');
  assert.ok(/function\s+_e10CacheDecision\s*\(/.test(src), '缺少 _e10CacheDecision');
  const cd = stripComments(fnBody('_e10CacheDecision'));
  assert.ok(/useRetryText/.test(cd) && /'block'/.test(cd) && /'force'/.test(cd), '裁定函数缺 normal/force/block 三态');
  // 端点: 单次重试(禁止 for 循环包重试) + 截断红线日志 + 约束块挂载
  assert.ok(src.includes('[E10/R9] 第 1 稿被预检拦截'), '端点缺少重试触发日志');
  assert.ok(src.includes('_E10_RETRY_CONSTRAINT(lang,'), '端点未挂强约束 prompt');
  assert.ok(src.includes('截断红线'), '缺少截断红线(截断稿重试也不得入库)');
  const tryBlock = src.slice(src.indexOf('[E10/R9] 第 1 稿被预检拦截'), src.indexOf('[E10/R9] 重试终局裁定'));
  assert.ok(!/\bfor\s*\(/.test(tryBlock), '重试必须是有限 1 次, 不得出现 for 循环');
  assert.ok(src.includes('_e10PostProcess = (aiResult)'), '后处理链未提取(重试稿须复跑同一条链)');
});

test('⑤ 缓存 bump v515（E10 基线随 E16/R11g 前移）: server.js 四站点 + purge 脚本补 v514 模式', () => {
  const sites = [...src.matchAll(/wealth:v528/g)].length;
  assert.ok(sites >= 4, `server.js v523 站点不足 4: ${sites}`);
  assert.ok(!src.includes('wealth:v520'), 'server.js 残留 v520（漏改一站）');
  assert.ok(/wealth:v520:\*/.test(purgeSrc) && /wealth:v520-v2:\*/.test(purgeSrc), 'purge 脚本未补 v520 双形态');
  const yearly = fs.readFileSync(path.join(__dirname, 'audit-yearly-stream.test.js'), 'utf-8');
  assert.ok(/MIN_CACHE_VER = 528/.test(yearly), 'yearly 流式闸门基线未前移至 v523');
});

// ═══════════════ 行为级: vm 抽取 + Adelaide 假矩阵(零 python) ═══════════════
const SEEDS = ['_v432LockLeadingNatal', '_v432LockNatal', '_v432SentTransitMarked', '_V492B_LEAD_TRANSIT',
  '_V492B_SENT_BREAK', '_v482SignAdjacent', '_v432Clause', '_v432AdjudicateDescriptors', '_v432Normalize',
  '_v432Truth', '_v432TruthMatch', '_v432SlotOf', '_v432ClaimOf', '_v432PatchZone', '_v432FindHouse',
  '_v432AllSignWords', '_v432Signs', '_v432SignAlts', '_V432_CFG', '_V432_NAME', '_V432_ORDER',
  '_V432_LANGS', '_V432_EN2LOC', '_V432_ZH_NUM', '_V432_ES_ORD', '_V432_ES_ORD_FORMAT', '_v432Esc',
  '_V482_FWD_BREAK', '_V482_FWD_CONJ', 'SUN_SIGN_EN', '_EN2ZIDX',
  '_v492cLockAxisSalutation', '_v432EnOrdSuf', '_e10CacheDecision', '_E10_RETRY_CONSTRAINT'];

const { map } = closureDecls(src, SEEDS, ['getSignToHouseMap', 'SIGN_ORDER_ZH']);
const dropped = [];
for (const n of [...map.keys()]) { try { new vm.Script(map.get(n)); } catch (e) { dropped.push(`${n}(${e.message.slice(0, 40)})`); map.delete(n); } }
assert.strictEqual(dropped.length, 0, `VM 抽取的声明有语法不完整项: ${dropped.join(', ')}`);
for (const n of SEEDS) assert.ok(map.has(n), `VM 未能抽取 ${n}`);

function buildWith(hack) {
  const ctx = { getSignToHouseMap, SIGN_ORDER_ZH, console, setTimeout, clearTimeout, setInterval, clearInterval, Buffer, process, __exports: {} };
  vm.createContext(ctx);
  const bodySrc = [...map.entries()].sort((a, b) => src.indexOf(a[1]) - src.indexOf(b[1]))
    .map((e) => (hack && hack[e[0]] ? hack[e[0]] : e[1])).join('\n\n');
  vm.runInContext(bodySrc + '\n' + SEEDS.map((n) => `__exports[${JSON.stringify(n)}] = typeof ${n} !== 'undefined' ? ${n} : undefined;`).join('\n'), ctx);
  return ctx.__exports;
}
const F = buildWith(null);

// Adelaide 真值夹具（SwissEph/Placidus 实算）
const CH_ADL = {
  Sun: { sign: 'Sagittarius', house: 12 }, Moon: { sign: 'Leo', house: 8 },
  Mercury: { sign: 'Sagittarius', house: 11 }, Venus: { sign: 'Scorpio', house: 12 },
  Mars: { sign: 'Cancer', house: 7 }, Jupiter: { sign: 'Libra', house: 10 },
  Saturn: { sign: 'Aquarius', house: 2 }, Uranus: { sign: 'Capricorn', house: 1 },
  Neptune: { sign: 'Capricorn', house: 1 }, Pluto: { sign: 'Scorpio', house: 11 },
};
const M_ADL = { months: [], meta: { computed_houses: CH_ADL, sun_sign: 'Sagittarius', rising_sign: 'Capricorn' } };

// 线上伤情原文复刻（2026-10-03 v508 验收④ 三处漏网 + 月锚点）
const FULL = [
  '### WEALTH ORACLE · FINANCIAL REVELATION',
  '',
  '**🌌 Annual Solar Chart: Sagittarius · Solar Return**',
  '**🗝️ Core Natal Code: natal Sun Sagittarius · natal Moon Leo · Rising Leo**',
  '**📅 Birth Date: 1992-12-15**',
  '',
  'O child of Leo, born December 15, 1992, with the Moon burning in Leo and the horizon of your life rising through Leo — you were not built for small ledgers.',
  '',
  'And your Moon, the emotional body, the instinctive self, also burns in Leo in the 7th. This is a spectacular and dangerous configuration.',
  '',
  'For a Capricorn rising with a Sagittarius sun, this is a profound instruction.',
].join('\n') + '\n\n### July 2026: Sun in Cancer · 7th House · The Partnership Audit\nTransiting Sun enters Cancer this month.\n';

test('⑥ 行为级: 月亮裸序数 in the 7th → in the 8th（R1, 保形不长出 House）', () => {
  const out = F._v432LockLeadingNatal(FULL, 'en', M_ADL, 'yearly');
  assert.ok(/burns in Leo in the 8th\./.test(out), '裸序数未被纠: ' + (out.match(/burns in Leo[^.]*\./)?.[0] || ''));
  assert.ok(!/in the 7th\./.test(out), '裸序数 7th 残留');
});

test('⑦ 行为级: 三处轴点/称谓必须纠回真值（R2: Rising Capricorn / O child of Sagittarius）', () => {
  const out = F._v432LockLeadingNatal(FULL, 'en', M_ADL, 'yearly');
  assert.ok(/Rising Capricorn\*\*/.test(out), '仪表盘 Rising 未纠: ' + (out.match(/\*\*🗝️[^\n]*\*\*/)?.[0] || ''));
  assert.ok(/rising through Capricorn/.test(out), 'rising through 未纠');
  assert.ok(/O child of Sagittarius, born/.test(out), '称谓未纠: ' + (out.match(/O child of[^,]*,/)?.[0] || ''));
  assert.ok(!/Rising Leo|rising through Leo|O child of Leo/.test(out), '轴点/称谓错值残留');
});

test('⑧ 行为级: 已正确值零误伤（Capricorn rising / Rising is Capricorn 原样）', () => {
  const out = F._v432LockLeadingNatal(FULL, 'en', M_ADL, 'yearly');
  assert.ok(/For a Capricorn rising with a Sagittarius sun/.test(out), '后段正确上升被误伤');
  const ok = 'Your Rising is Capricorn and your style is patient.\n\n### July 2026: Sun in Cancer House 7\nx';
  assert.ok(F._v432LockLeadingNatal(ok, 'en', M_ADL, 'yearly').includes('Your Rising is Capricorn'), '已真值 Rising 被改(不幂等)');
});

test('⑨ 行为级: 日期/越值域防误伤（July 7th / the 7th of July / 13th floor 恒不动）', () => {
  const g1 = 'Mark your calendar for July 7th celebration.\n\n### July 2026: Sun in Cancer House 7\nx';
  assert.ok(F._v432LockLeadingNatal(g1, 'en', M_ADL, 'yearly').includes('July 7th'), 'July 7th 被误伤');
  const g2 = 'Your Mars energy spikes in the 3rd of July, a key date.\n\n### July 2026: Sun in Cancer House 7\nx';
  assert.ok(F._v432LockLeadingNatal(g2, 'en', M_ADL, 'yearly').includes('the 3rd of July'), 'the 3rd of July 日期被误伤(真值 7 宫会吃掉 3rd)');
  const g3 = 'Meet me in the 13th floor walkway.\n\n### July 2026: Sun in Cancer House 7\nx';
  assert.ok(F._v432LockLeadingNatal(g3, 'en', M_ADL, 'yearly').includes('the 13th floor'), '13th 越值域被误改');
  const g4 = 'Your Venus shines in the 7th House of shared assets.\n\n### July 2026: Sun in Cancer House 7\nx';
  assert.ok(/in the 12th House of shared assets/.test(F._v432LockLeadingNatal(g4, 'en', M_ADL, 'yearly')), '带 House 序数仍须走 houseOrd 纠偏');
});

test('⑩ 行为级: 幂等 + 月锚点之后零影响', () => {
  const once = F._v432LockLeadingNatal(FULL, 'en', M_ADL, 'yearly');
  const twice = F._v432LockLeadingNatal(once, 'en', M_ADL, 'yearly');
  assert.strictEqual(twice, once, '不幂等');
  assert.ok(once.includes('### July 2026: Sun in Cancer · 7th House · The Partnership Audit'), '月段标题被误改');
  assert.ok(once.includes('Transiting Sun enters Cancer this month'), '月段流年正文被误改');
});

test('⑪ 行为级: zh 上升真值锁（上升狮子座 → 摩羯座）', () => {
  const zh = '上升星座是狮子座，你的气质带着王者之风。\n\n### 2026年7月: 太阳在巨蟹座第7宫\n流年太阳行经巨蟹座。';
  const out = F._v432LockLeadingNatal(zh, 'zh', M_ADL, 'yearly');
  assert.ok(out.includes('摩羯座'), 'zh 上升未被纠: ' + out.slice(0, 60));
  assert.ok(!out.includes('上升星座是狮子座'), 'zh 上升错值残留');
});

test('⑫ 行为级: _e10CacheDecision 四态裁定（normal/force/block/保首稿）', () => {
  const ok1 = { issues: [], iv: { ok: true, reasons: [] } };
  const ok2 = { issues: [], iv: { ok: true, reasons: [] } };
  assert.strictEqual(F._e10CacheDecision(ok1, ok2).action, 'normal', '全绿应 normal');
  const flaw = { issues: ['报头缺少射手座'], iv: { ok: true, reasons: [] } };
  assert.strictEqual(F._e10CacheDecision(ok1, flaw).action, 'force', '有风格瑕疵但完整应 force(强后手)');
  const trunc = { issues: [], iv: { ok: false, reasons: ['截断'] } };
  const d1 = F._e10CacheDecision(ok1, trunc);
  assert.strictEqual(d1.useRetryText, false, '重试稿截断应保留首稿');
  assert.strictEqual(d1.action, 'normal', '首稿完整应按首稿 normal');
  const d2 = F._e10CacheDecision(trunc, trunc);
  assert.strictEqual(d2.action, 'block', '双稿皆截断应 block(绝不入库)');
  assert.strictEqual(F._e10CacheDecision(trunc, ok1).action, 'normal', '重试稿救回应 normal');
});

test('⑬ 行为级: 强约束 prompt 块内容（真值回填 + 裸序数/元素/称谓条文）', () => {
  const c = F._E10_RETRY_CONSTRAINT('en', 'Sagittarius', 'Capricorn');
  assert.ok(c.includes('Rising Capricorn'), '约束块未回填上升真值');
  assert.ok(c.includes('O child of Sagittarius'), '约束块未回填太阳称谓');
  assert.ok(/bare ordinals/i.test(c), '约束块缺裸序数条文');
  assert.ok(/Gemini = AIR/.test(c), '约束块缺元素条文');
  const zc = F._E10_RETRY_CONSTRAINT('zh', '射手座', '摩羯座');
  assert.ok(zc.includes('摩羯座') && zc.includes('射手座'), 'zh 约束块未回填真值');
});

// ═══════════════ 【注入缺陷自测】判据必须具备灵敏度 ═══════════════
test('【注入缺陷自测】剥离 houseBare 正则 → ⑥ 必须红', () => {
  const orig = map.get('_V432_CFG');
  const hacked = orig.replace(/houseBare:\s*\/[^\n]+\/i,/, '');
  assert.notStrictEqual(hacked, orig, '未成功注入缺陷(未匹配到 houseBare)');
  const F1 = buildWith({ _V432_CFG: hacked });
  const out = F1._v432LockLeadingNatal(FULL, 'en', M_ADL, 'yearly');
  assert.ok(!/burns in Leo in the 8th\./.test(out), '闸门失效: houseBare 被剥离后仍判绿');
});

test('【注入缺陷自测】剥离轴点锁挂载 → ⑦ 必须红', () => {
  const orig = map.get('_v432LockLeadingNatal');
  const hacked = orig.replace(/\n\s*\/\/[^\n]*\n\s*locked = _v492cLockAxisSalutation\(locked, lang, astroMatrix\);/, '\n');
  if (hacked === orig) {
    // 兜底: 无注释形态
    const h2 = orig.replace('locked = _v492cLockAxisSalutation(locked, lang, astroMatrix);', '');
    assert.notStrictEqual(h2, orig, '未成功注入缺陷(未匹配到轴点锁挂载)');
    var hackedFinal = h2;
  } else { var hackedFinal = hacked; }
  const F1 = buildWith({ _v432LockLeadingNatal: hackedFinal });
  const out = F1._v432LockLeadingNatal(FULL, 'en', M_ADL, 'yearly');
  assert.ok(!/Rising Capricorn\*\*/.test(out), '闸门失效: 轴点锁被剥离后仍判绿');
});

test('【注入缺陷自测】剥离 of 否定前瞻 → ⑨ 日期守卫必须红', () => {
  const orig = map.get('_V432_CFG');
  const hacked = orig.replace(/of\\b\|/, '');
  assert.notStrictEqual(hacked, orig, '未成功注入缺陷(未匹配到 of 前瞻)');
  const F1 = buildWith({ _V432_CFG: hacked });
  const g2 = 'Your Mars energy spikes in the 3rd of July, a key date.\n\n### July 2026: Sun in Cancer House 7\nx';
  const out = F1._v432LockLeadingNatal(g2, 'en', M_ADL, 'yearly');
  assert.ok(!out.includes('the 3rd of July'), '闸门失效: of 前瞻被剥离后日期守卫仍判绿');
});

test('【注入缺陷自测】_e10CacheDecision 把 block 改成 force → ⑫ 必须红', () => {
  const orig = map.get('_e10CacheDecision');
  const hacked = orig.replace("if (!fin || !fin.iv || !fin.iv.ok) return { action: 'block', useRetryText };",
    "if (!fin || !fin.iv || !fin.iv.ok) return { action: 'force', useRetryText };");
  assert.notStrictEqual(hacked, orig, '未成功注入缺陷(未匹配到 block 分支)');
  const F1 = buildWith({ _e10CacheDecision: hacked });
  const trunc = { issues: [], iv: { ok: false, reasons: ['截断'] } };
  assert.strictEqual(F1._e10CacheDecision(trunc, trunc).action, 'force', '闸门失效: block 分支被改后仍判 block');
});
