#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// 🔴 E141（主公军令 2026-11-16 · 修正版）：姻缘年报前瞻 12 个月窗口＋六语单语纯净锁
//   ① 时间窗彻底前瞻化：起点＝付费测算当日所在月的下一个自然月，推 12 个整月
//      （生日月份退役——旧「最近一次已发生的太阳返照」锚在 12 月生人 2026-11
//      解锁时会倒退回 2025-12 生成过去回顾，主公实锤病灶）；
//   ② 年报缓存键掺前瞻窗盐 e141_forward_<YYYY-MM>（旧倒退窗历史缓存作废）；
//   ③ zh 副标题去 Solar Return 英文残留（军令钦定文案）＋ th/vi 副标题纯语化；
//   ④ 中文正文 caution/lucky 标签串码 ⇒ 钦定「避坑关键词/幸运关键词」；
//      三连星号原始 Markdown ⇒ 「」规范高亮（_e141ZhPurityWash 兜底清洗）；
//   ⑤ 财富年报财年 7 月范式零改动（V483 守恒）。
// 判据口径：①②含行为级测试（直接 import ai-advisor.js／reportPipeline.mjs 真模块
//   ＋VM 实跑 _e141ZhPurityWash）；④含 dist 实证。
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
const ADV_MIRROR = fs.readFileSync(path.join(ROOT, 'web/api/ai-advisor.js'), 'utf8');
const APP = fs.readFileSync(path.join(ROOT, 'web/src/App.tsx'), 'utf8');
const V69 = fs.readFileSync(path.join(ROOT, 'v69_client.js'), 'utf8');
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const DIST_FILES = fs.readdirSync(path.join(ROOT, 'web/dist/assets')).filter(f => /^index-.*\.js$/.test(f));

// VM 抽取（花括号配平，同 e92/e94/e95 闸门口径）
function fnBody(src, anchor) {
  const i = src.indexOf(anchor);
  if (i < 0) throw new Error('anchor not found: ' + anchor);
  const open = src.indexOf('{', i);
  let depth = 0, k = open;
  for (; k < src.length; k++) {
    if (src[k] === '{') depth++;
    else if (src[k] === '}') { depth--; if (depth === 0) break; }
  }
  return src.slice(open + 1, k);
}

test('E141-01 前瞻 12 个月窗口（军令断言 1）：2026-11 付费 ⇒ 2026-12-01 起 2027-11-30 止', async () => {
  const { buildCompatTimeContext } = await import(path.join(ROOT, 'api/ai-advisor.js'));
  // 主公军令主用例：当前 2026-11 为 12 月生日生成姻缘年报
  const now = new Date('2026-11-16T02:30:00Z');
  const ctx = buildCompatTimeContext('yearly', now, '1997-12-08', 'zh');
  assert.equal(ctx.windowStart, '2026-12-01', '起点必须精确锚定即将到来的下一个自然月 2026-12');
  assert.equal(ctx.windowEnd, '2027-11-30', '终点必须为 2027-11（完整推演 12 个月）');
  assert.equal(ctx.monthKey, '2026-12', 'monthKey 须同步前瞻');
  assert.equal(ctx.anchor, 'forward_next_month', 'anchor 须为前瞻锚');
  // Q1–Q4 落窗（server 侧 e108 季度算术基于 windowStart 现算——源锚守恒）
  assert.ok(SERVER.includes('const _e108Y0 = Number(_anchorYm.slice(0, 4));'), '季度算术真源（_anchorYm）须仍以 windowStart 为锚');
  const ym = ctx.monthKey;
  const y0 = Number(ym.slice(0, 4)), m0 = Number(ym.slice(5, 7));
  const q1m = m0, q4m = ((m0 - 1 + 11) % 12) + 1;
  assert.ok(q1m === 12 && q4m === 11, `Q1 起月（${q1m}）与 Q4 末月（${q4m}）须全落 2026-12~2027-11 窗内`);
});

test('E141-02 生月退役＋跨年换挡（军令断言 2）：任何生月同窗；start 严禁早于 now 年月', async () => {
  const { buildCompatTimeContext } = await import(path.join(ROOT, 'api/ai-advisor.js'));
  const now = new Date('2026-11-16T02:30:00Z');
  // 已过生日月份（3 月生人）——旧口径会取 2026-03 起（生日已过⇒当年生月窗），修正版须同付次月窗
  const a = buildCompatTimeContext('yearly', now, '1990-03-25', 'zh');
  const b = buildCompatTimeContext('yearly', now, '1997-12-08', 'zh');
  const c = buildCompatTimeContext('yearly', now, null, 'zh');
  assert.equal(a.windowStart, '2026-12-01', '3 月生人起点须与生月无关（付费次月锚）');
  assert.equal(b.windowStart, a.windowStart, '12 月生人与 3 月生人同窗（生月退役）');
  assert.equal(c.windowStart, a.windowStart, '无生月档同窗（birthDate 退役后缺省等价）');
  assert.ok(String(a.windowStart).slice(0, 7) > '2026-11', 'startYYYYMM 严禁早于当前服务器年月（前瞻保护）');
  // 跨年换挡：12 月月末付费 ⇒ 次年 1 月起
  const d = buildCompatTimeContext('yearly', new Date('2026-12-31T23:59:59Z'), null, 'zh');
  assert.equal(d.windowStart, '2027-01-01', '跨年换挡须起 2027-01');
  assert.equal(d.windowEnd, '2027-12-31', '跨年换挡终点 2027-12-31');
  // monthly/once 通路零触碰
  const m = buildCompatTimeContext('monthly', now, null, 'zh');
  assert.equal(m.anchor, 'calendar_month', 'monthly 通路零触碰');
  const o = buildCompatTimeContext('once', now, null, 'zh');
  assert.equal(o.anchor, 'none', 'once 通路零触碰');
});

test('E141-03 倒退形态绝迹（源锚）：_compatSolarWindow 体内无回退一年字面量；镜像双写守恒', () => {
  const body = fnBody(ADV, 'function _compatSolarWindow');
  assert.ok(!body.includes('getUTCFullYear() - 1'), '旧「回退一年取最近已发生太阳返照」倒退形态必须绝迹');
  assert.ok(!body.includes('solar_return'), '旧 solar_return 锚字面量必须退役');
  assert.ok(body.includes('forward_next_month'), '前瞻锚字面量必须接线');
  assert.ok(body.includes('m + 1'), '起点须为付费次月（m+1）算术');
  // 镜像纪律（api/ai-advisor.js ≡ web/api/ai-advisor.js）
  assert.equal(ADV, ADV_MIRROR, 'ai-advisor.js 双镜像失同步（E141 改动必须双写）');
});

test('E141-04 副标题纯净化（军令断言 3 前半）：zh 钦定文案；th/vi 分支零英文词', () => {
  // zh 钦定文案
  assert.ok(APP.includes('基于您的太阳返照盘生成，推演未来12个月的命运蓝图'), 'zh 副标题军令钦定文案缺失');
  const iZh = APP.indexOf("lang === 'zh' ? '基于您的太阳返照盘");
  assert.ok(iZh > 0, 'zh 副标题分支定位失败');
  // 副标题整行切片（单行三元链）
  const lineStart = APP.lastIndexOf('\n', iZh) + 1;
  const lineEnd = APP.indexOf('\n', iZh);
  const subLine = APP.slice(lineStart, lineEnd);
  assert.ok(!subLine.includes('Solar Return（太阳返照日）'), 'zh 副标题 Solar Return 英文残留必须清除');
  // th 分支纯语化（原内嵌 Solar Return 英文词）
  const thBranch = subLine.slice(subLine.indexOf("'อิงจาก"), subLine.indexOf("' : 'Dựa"));
  assert.ok(thBranch.length > 10, 'th 副标题分支定位失败');
  assert.ok(!/[A-Za-z]/.test(thBranch.replace(/\\u[0-9a-fA-F]{4}/g, '')), 'th 副标题分支残留拉丁字母词（须纯泰语）');
  // vi 分支纯语化（越南语本为拉丁字母语种——断言改扫英文残留词 Solar Return）
  const viBranch = subLine.slice(subLine.indexOf("'Dựa"), subLine.lastIndexOf("'"));
  assert.ok(viBranch.length > 10, 'vi 副标题分支定位失败');
  assert.ok(!viBranch.includes('Solar Return'), 'vi 副标题分支残留 Solar Return 英文词（须纯越南语）');
  // dist 实证（E141 新文案入包、旧文案归零）
  assert.ok(DIST_FILES.length >= 1, 'dist index bundle 缺失');
  const dist = DIST_FILES.map(f => fs.readFileSync(path.join(ROOT, 'web/dist/assets', f), 'utf8')).join('');
  assert.ok(dist.includes('基于您的太阳返照盘生成，推演未来12个月的命运蓝图'), 'dist 未含 zh 副标题钦定新文案');
  assert.ok(!dist.includes('Solar Return（太阳返照日）'), 'dist 仍含 zh 副标题旧英文残留');
});

test('E141-05 串码与符号清洗器（军令断言 3 后半）：行为级 VM 实跑 _e141ZhPurityWash', () => {
  const fn = new Function('text', fnBody(SERVER, 'function _e141ZhPurityWash'));
  // caution 标签串码（军令钦点两种形态）
  assert.equal(fn('本月需要留意的caution关键词是冲动消费'), '本月需要留意的避坑关键词是冲动消费', '无空格串码形态未清洗');
  assert.equal(fn('本月的 caution 关键词：冲动消费'), '本月的 避坑关键词：冲动消费', '空格串码形态未清洗');
  // lucky 对称防护
  assert.equal(fn('本月的lucky关键词是紫水晶'), '本月的幸运关键词是紫水晶', 'lucky 串码未对称清洗');
  // 三连星号清洗为规范高亮
  assert.equal(fn('幸运物 ***"水晶"*** 带来能量'), '幸运物 「水晶」 带来能量', '三连星号包裹引号串未清洗');
  assert.equal(fn('避看 ***火星*** 位'), '避看 「火星」 位', '裸三连星号串未清洗');
  // 幂等
  const once = fn('zh句 ***"水晶"*** 与caution关键词');
  assert.equal(fn(once), once, '清洗器幂等性破坏（二次施洗须不变）');
  // CJK 语境门：纯英文零触碰（各语 caution/lucky 为本语合法词）
  assert.equal(fn('the caution keyword is patience'), 'the caution keyword is patience', '纯英文文本被误洗（CJK 语境门失效）');
  assert.equal(fn('***emphasis*** stays'), '***emphasis*** stays', '纯英文星号被误洗（CJK 语境门失效）');
  // server 三收口点接线（流式帧／终帧／HIT 复读）
  assert.ok(SERVER.includes('_e141ZhPurityWash(_e108LockQuarterRanges(d, _compat.timeCtx.windowStart))'), '流式帧收口未接线');
  assert.ok(SERVER.includes('if (_e94IsZh) insight = _e141ZhPurityWash(insight);'), '终帧收口未接线');
  assert.ok(SERVER.includes('_g41Replay.insight = _e141ZhPurityWash('), 'HIT 复读收口未接线');
  // Prompt 侧 3b MONOLINGUAL PURITY 硬约束在场
  assert.ok(SERVER.includes('[MONOLINGUAL PURITY — MANDATORY]'), '3b 单语纯净令缺失');
  assert.ok(SERVER.includes('「幸运关键词」＋「避坑关键词」'), '3b 月度成对标签中文钦定词缺失');
});

test('E141-06 年报缓存键前瞻窗盐：行为级——旧倒退窗缓存作废＋同窗幂等', async () => {
  const { deriveCompatReportId } = await import(path.join(ROOT, 'lib/reportPipeline.mjs'));
  const base = {
    reportType: 'yearly', lang: 'zh', d1: '1976-12-03', d2: '1997-10-18',
    bazi: { score: 80 }, zodiac: { score: 75 }, iching: { score: 90 },
    tarot: { name: '审判' }, zodiacMeta: null, userBirthDate: '1976-12-03',
  };
  const idOld = deriveCompatReportId(base);                          // 无盐（E141 前旧口径＝现网倒退窗缓存）
  const idFwd = deriveCompatReportId({ ...base, promptSalt: 'e141_forward_2026-12' });
  assert.notEqual(idOld, idFwd, 'yearly 掺前瞻窗盐后 ID 必须变化（旧倒退窗历史缓存未作废）');
  assert.equal(idFwd, deriveCompatReportId({ ...base, promptSalt: 'e141_forward_2026-12' }), '同窗盐幂等破坏');
  assert.notEqual(idFwd, deriveCompatReportId({ ...base, promptSalt: 'e141_forward_2027-01' }), '跨窗月换盐必须换 ID（次年重生成新报告）');
  // monthly 恒不掺盐（沿袭 E95 口径）
  const mBase = { ...base, reportType: 'monthly' };
  assert.equal(deriveCompatReportId(mBase), deriveCompatReportId({ ...mBase, promptSalt: null }), '月报不得掺盐（射程违规）');
  // server 接线源锚（Gate41 调用处三分流）
  const hStart = SERVER.indexOf("app.use('/api/ai-advisor'");
  const hEnd = SERVER.indexOf("app.use((req, res, next)", hStart);
  assert.ok(SERVER.slice(hStart, hEnd).includes('e141_forward_${buildCompatTimeContext'), 'Gate41 调用处未接线前瞻窗盐');
});

test('E141-07 财富年报零改动守恒：财年 7 月范式（V483）原样——姻缘前瞻化不得波及财富线', () => {
  // v69_client resolveReportWindow：财年起算语义守恒（V483 闸门继续独立锁定行为级口径）
  assert.ok(V69.includes('function resolveReportWindow'), 'resolveReportWindow 真源缺失');
  assert.ok(!V69.includes('forward_next_month'), '财富线窗口源不得引入前瞻锚（零改动红线）');
  // server wealthPeriodLock／solarReturnCycle 周期锁零触碰
  const wl = fnBody(SERVER, 'function wealthPeriodLock');
  assert.ok(wl.includes('solarReturnCycle(userBirthDate, d)'), '财富周期锁生日锚语义必须守恒（零改动）');
  // 姻缘 prompt 窗口行已改前瞻口径（英文指令允许 Forward 措辞；zh 侧无英文串码入正文）
  assert.ok(SERVER.includes('Time window (E141 forward 12-month from unlock, month 1 = the first month of the window)'), '年报 DATA LOCK 窗口行未改为前瞻口径');
  assert.ok(SERVER.includes('the natural month right after the unlock month'), '契约 3 前瞻措辞缺失');
  // e91 锚注行改版（保留「能量起点释义」关键词——e91 闸门锚守恒）
  assert.ok(SERVER.includes('✦ 能量起点释义：您于解锁测算当月之后的第一个自然月'), 'E91 锚注行未改为解锁次月语义');
  assert.ok(!SERVER.includes('太阳返照年以您诞生日所在月份'), '旧生日锚注文案必须退役');
});

test('E141-08 链位与插链：111 总段（110 node＋python 链尾；E143 插链后继化）；e141 紧居 e140 后', () => {
  const script = String(PKG.scripts['test:astro'] || '');
  assert.ok(script.length > 100, 'test:astro 脚本缺失');
  const chain = script.split('&&').map(s => s.trim()).filter(Boolean);
  const all = chain.filter(s => /node |--test|python /.test(s) || /\.mjs|\.js|\.py|test/.test(s));
  // python 恒总链尾、e40-compat 恒 node 链尾（铁律）；e141 段在 e140 后
  const segs = chain.map(s => (s.match(/audit-[a-z0-9-]+\.(?:test\.)?(?:mjs|js)/g) || []).pop()).filter(Boolean);
  const i141 = segs.indexOf('audit-e141-forward-window-purity.test.mjs');
  const i140 = segs.indexOf('audit-e140-familiar-persistence.test.mjs');
  const i40 = segs.indexOf('audit-e40-compat-synastry-tensor-fusion.test.mjs');
  assert.ok(i141 > 0, 'e141 段未入链');
  assert.ok(i140 > 0 && i141 === i140 + 1, 'e141 须紧居 e140 之后（版本序铁律）');
  assert.ok(i40 > i141, 'e40-compat 须恒居 node 链尾（e141 不得插其后）');
  // 总段计数（含 python 尾）＝111（E143 插链后继化）
  assert.equal(all.length, 125, `链总段必须为 115（E147 插链后继化；实际 ${all.length}）`);   // 🔴 后继化（E158 入编）：123→124   // 🔴 后继化（E159 入编）：124→125
  const nodeOnly = all.filter(s => !/python/.test(s));
  assert.equal(nodeOnly.length, 124, `node-only 段必须为 114（E146 插链后继化；实际 ${nodeOnly.length}）`);   // 🔴 后继化（E158 入编）：122→123   // 🔴 后继化（E159 入编）：123→124
  assert.ok(/python/.test(all[all.length - 1]), 'python 段须恒为总链尾');
});
