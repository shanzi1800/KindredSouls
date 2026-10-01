// ═══════════════════════════════════════════════════════════════════════
// 🛡️ V483: 年报「财年时间窗口」契约闸门
//
// 事故/病根(2026-09-30 核实):
//   年报的 **Prompt / FactSheet 文案早就按「2026 年 7 月 – 2027 年 6 月」写好**:
//     · buildFactSheet: `Monthly TRANSIT Planetary Positions (July 2026 – June 2027)`
//     · buildFactSheet: `Mercury Retrograde Periods (2026-2027)`
//     · 年报 Prompt 硬编码「2026年7月Transit太阳 = 巨蟹座;2027年6月Transit太阳 = 双子座」
//     · 年报 Prompt 硬编码一整张「火星 2026-2027 Transit 事实表」
//   而星盘矩阵却从 **当前月**起算(`now.getMonth() + 1`) → 两边打架:
//     9 月买到的报告, Prompt 说从 7 月起、数据却是 9 月起 →
//     LLM 收到互相矛盾的指令(正是 V482 那批「跨月沿用 / 星座串染」的温床)。
//
// 契约: 年报窗口 = 当年 7 月至次年 6 月(12 个月整, 跨年财年制);
//       月报窗口 = 当月起 12 个月(**保持历史行为不变**)。
//       年份由**服务器确定性计算**, LLM 无权推算。
//
// ⚠️ 回归红线: `getAstroMatrix` 是年报/月报**共用**的函数, 而月报依赖 months[0] = 当月
//   (buildMonthlyOverviewBlock / buildMonthlyTrapBlock / moon_weeks)。
//   故窗口必须按 reportType 分流, 且 matrixCache 的 key 必须含窗口(否则月报会读到 7 月矩阵)。
// ═══════════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { indexDecls, closureDecls } from './tools/extract_decls.mjs';
import { getSignToHouseMap, SIGN_ORDER_ZH } from '../astro-truth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const serverSrc = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf-8');
const v69Src = fs.readFileSync(path.join(ROOT, 'v69_client.js'), 'utf-8');

/** 剥注释（静态判据只看代码；修复处的解释性注释里常写着旧写法） */
function stripComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

// ── 行为沙箱: 把 v69_client.js 的**纯函数**抽到只有自身闭包的 vm 里(零外部依赖) ──
// ⚠️ indexDecls 不索引带 `export` 前缀的声明 → 先剥 `export ` 再抽取（只剥声明前的，不动 import/export {}）。
const PURE_NAMES = ['FISCAL_START_MONTH', '_MONTH_EN', 'resolveReportWindow', 'windowLabel', 'windowKeyOf'];
const stripExport = (s) => s.replace(/^export\s+(?=(?:const|let|var|function|async|class)\b)/gm, '');
function pureCode(source = v69Src) {
  const d = indexDecls(stripExport(source));
  const parts = [];
  for (const n of PURE_NAMES) {
    const c = d.get(n);
    if (!c) return null;
    parts.push(c.replace(/^export\s+/, ''));
  }
  return parts.join('\n\n');
}
function sandboxPure(source = v69Src) {
  const code = pureCode(source);
  assert.ok(code, '未能抽取窗口纯函数(FISCAL_START_MONTH / resolveReportWindow / windowLabel / windowKeyOf)');
  const ctx = { console, __exports: {} };
  vm.createContext(ctx);
  vm.runInContext(code + '\n' + PURE_NAMES.map((n) => `__exports[${JSON.stringify(n)}] = typeof ${n} !== 'undefined' ? ${n} : undefined;`).join('\n'), ctx);
  return ctx.__exports;
}

// ═══════════════ ⑧⑨⑩⑪ 行为级(主判据) ═══════════════
const _D = (s) => new Date(s);
// 判据谓词抽成函数 → 主判据与注入自测**共用同一份逻辑**(否则注入写法与判据字面不一致 → 假自测)
function yearlyWindowOk(F) {
  const w = F.resolveReportWindow('yearly', _D('2026-09-30T12:00:00+08:00'));
  return w.startYear === 2026 && w.startMonth === 7 && w.months === 12;
}
function monthlyUntouchedOk(F) {
  const w = F.resolveReportWindow('monthly', _D('2026-09-30T12:00:00+08:00'));
  return w.startYear === 2026 && w.startMonth === 9;
}
function crossYearOk(F) {
  const a = F.resolveReportWindow('yearly', _D('2027-06-30T00:00:00Z'));   // 次年 6 月底买 → 下一财年
  const b = F.resolveReportWindow('yearly', _D('2026-01-15T00:00:00Z'));   // 年初买 → 今年 7 月起
  return a.startYear === 2027 && a.startMonth === 7 && b.startYear === 2026 && b.startMonth === 7;
}
function labelOk(F) {
  const L = F.windowLabel(F.resolveReportWindow('yearly', _D('2026-09-30T12:00:00+08:00')));
  return L.start === 'July 2026' && L.end === 'June 2027' && L.startKey === '2026-07' && L.endKey === '2027-06';
}
function keySeparatedOk(F) {
  const a = F.windowKeyOf(F.resolveReportWindow('yearly', _D('2026-09-30T12:00:00+08:00')));
  const b = F.windowKeyOf(F.resolveReportWindow('monthly', _D('2026-09-30T12:00:00+08:00')));
  return !!a && !!b && a !== b;
}

test('⑧ 行为: 年报窗口 = 当年 7 月起 12 个月(2026-09 购买 → 2026-07 ~ 2027-06)', () => {
  const F = sandboxPure();
  assert.ok(yearlyWindowOk(F), '年报窗口不是「当年 7 月起 12 个月」: ' + JSON.stringify(F.resolveReportWindow('yearly', _D('2026-09-30T12:00:00+08:00'))));
});

test('⑨ 行为: 月报窗口 = 当月起(不得被财年改动污染)', () => {
  const F = sandboxPure();
  assert.ok(monthlyUntouchedOk(F), '月报窗口被改坏(必须仍是当月起): ' + JSON.stringify(F.resolveReportWindow('monthly', _D('2026-09-30T12:00:00+08:00'))));
});

test('⑩ 行为: 跨年边界 —— 次年 6 月买进下一财年 / 年初 1 月买 = 今年 7 月起', () => {
  const F = sandboxPure();
  assert.ok(crossYearOk(F), '跨年边界错: 2027-06-30 → ' + JSON.stringify(F.resolveReportWindow('yearly', _D('2027-06-30T00:00:00Z')))
    + ' ; 2026-01-15 → ' + JSON.stringify(F.resolveReportWindow('yearly', _D('2026-01-15T00:00:00Z'))));
});

test('⑪ 行为: 窗口标签与缓存 key 片段必须随窗口变化(防两窗口互相污染)', () => {
  const F = sandboxPure();
  assert.ok(labelOk(F), '窗口标签错(应为 July 2026 – June 2027 / 2026-07 / 2027-06)');
  assert.ok(keySeparatedOk(F), '年报与月报的缓存 key 片段相同 → 同进程内月报会读到 7 月矩阵');
});

// ═══════════════ ①-⑦ 源码级(结构) ═══════════════
test('① 源码: server.js 的年报星盘调用点必须传 { reportType } 决定窗口', () => {
  const code = stripComments(serverSrc);
  const calls = [...code.matchAll(/getAstroMatrix\(birthDate,\s*birthTime,\s*lat,\s*lon,\s*tz([^)]*)\)/g)].map((m) => m[1]);
  assert.ok(calls.length >= 4, `预期至少 4 个路由内调用点, 实得 ${calls.length}`);
  // 4 个路由调用点(同步 HIT ×3 + 同步 MISS + 流式)必须带 reportType；
  // v2 引擎 /api/wealth-oracle/v2 不传(它有自己的滚动语义, 保持不变)
  const withRt = calls.filter((a) => /reportType/.test(a)).length;
  assert.ok(withRt >= 5, `必须至少 5 个调用点传 reportType, 实得 ${withRt} (共 ${calls.length})`);
});

test('② 源码: v69_client.js 的月报矩阵不得再直接以「当前月」当窗口起点', () => {
  const code = stripComments(v69Src);
  assert.ok(/FISCAL_START_MONTH/.test(code), '缺少 FISCAL_START_MONTH 常量');
  assert.ok(/resolveReportWindow\s*\(/.test(code), '缺少 resolveReportWindow 解析函数');
  // 旧写法(病灶): const monthStart = now.getMonth() + 1;
  assert.ok(!/const\s+monthStart\s*=\s*now\.getMonth\(\)\s*\+\s*1/.test(code),
    '月标矩阵起点仍是 now.getMonth()+1 直取 —— 必须改走 resolveReportWindow 的窗口');
  assert.ok(/const\s+monthStart\s*=\s*win\.startMonth/.test(code), '月标矩阵起点未取自 win.startMonth');
});

test('③ 源码: matrixCache 的 key 必须含时间窗口(否则月报/年报同进程互相污染)', () => {
  const code = stripComments(v69Src);
  const m = code.match(/const\s+cacheKey\s*=\s*`([^`]*)`/);
  assert.ok(m, '未找到 getAstroMatrix 的 cacheKey 构造');
  assert.ok(/\$\{wKey\}|\$\{windowKeyOf/.test(m[1]), `cacheKey 未含窗口片段: ${m[1]}`);
});

test('④ 源码: buildFactSheet 不得再硬编码财年区间(必须读矩阵窗口)', () => {
  const code = stripComments(v69Src);
  assert.ok(!/July 2026\s*[–-]\s*June 2027/.test(code), 'FactSheet 仍硬编码 `July 2026 – June 2027`');
  assert.ok(!/Mercury Retrograde Periods \(2026-2027\)/.test(code), 'FactSheet 仍硬编码 `(2026-2027)`');
  assert.ok(/report_window/.test(code), 'FactSheet 未读取 meta.report_window');
  assert.ok(/\$\{_winLabel\}/.test(code), 'FactSheet 的月份区间未改用动态 _winLabel 插值');
});

test('⑤ 源码: 年报的火星 Transit 硬编码事实表必须按财年门控(换财年即失效)', () => {
  const code = stripComments(serverSrc);
  assert.ok(/MARS_TRANSIT_RULE/.test(code), '缺少火星规则块变量');
  assert.ok(/_winStartKey\s*===\s*'2026-07'/.test(code),
    '火星事实表未被财年门控 —— 财年滚动后会变成「主动编造」的假事实');
  assert.ok(/只描述相位关系本身/.test(serverSrc), '缺少「无硬表时禁止写火星星座」的降级文案');
});

test('⑥ 源码: 年报 Prompt 必须注入「时间窗口铁律」(禁止 LLM 自行推算 12 个月)', () => {
  const code = stripComments(serverSrc);
  assert.ok(/时间窗口铁律/.test(serverSrc), '缺少「时间窗口铁律」Prompt 条款');
  assert.ok(/\$\{_WIN_LABEL\}/.test(code), '「时间窗口铁律」未插入动态窗口标签');
  assert.ok(/不得自行推算/.test(serverSrc), '未禁止 LLM 按当前日期自行推算窗口');
});

test('⑦ 源码: 缓存 key 版本必须与闸门基线一致且不低于历史基线(单调判据)', () => {
  // ⚠️ 必须剥注释: 源码注释里提到过历史键格式 `wealth:v356:<date>:...`(V433-fix 的说明),
  //   不剥注释会把注释里的旧版本号当成真实键 → 假红。
  const vers = [...stripComments(serverSrc).matchAll(/wealth:v(\d+):/g)].map((m) => +m[1]);
  assert.ok(vers.length >= 3, `预期 ≥3 处财富缓存 key, 实得 ${vers.length}`);
  assert.strictEqual(new Set(vers).size, 1, `缓存 key 版本不一致: ${[...new Set(vers)].join(',')}`);
  const streamTest = fs.readFileSync(path.join(__dirname, 'audit-yearly-stream.test.js'), 'utf-8');
  const minv = +/MIN_CACHE_VER\s*=\s*(\d+)/.exec(streamTest)[1];
  assert.strictEqual(vers[0], minv, `server.js 缓存 key v${vers[0]} 与闸门基线 MIN_CACHE_VER=${minv} 不一致`);
  assert.ok(vers[0] >= 499, `缓存版本回退到 v${vers[0]}(窗口/月份号/收尾链变更必须 bump, 历史基线 ≥499)`);
});

// ═══════════════ 注入缺陷自测(证明闸门会红) ═══════════════
test('【注入缺陷自测】把 FISCAL_START_MONTH 改成 9 → 判据⑧⑩⑪ 必须红', () => {
  const degraded = v69Src.replace('export const FISCAL_START_MONTH = 7;', 'export const FISCAL_START_MONTH = 9;');
  assert.notStrictEqual(degraded, v69Src, '未成功注入缺陷(未匹配到 FISCAL_START_MONTH)');
  const F = sandboxPure(degraded);
  assert.ok(!yearlyWindowOk(F), '闸门失效: 财年起点改 9 月后判据⑧ 仍绿');
  assert.ok(!crossYearOk(F), '闸门失效: 财年起点改 9 月后判据⑩ 仍绿');
});

test('【注入缺陷自测】把年报分支退回「当月起」→ 判据⑧ 必须红', () => {
  const degraded = v69Src.replace(
    `    return { startYear: y, startMonth: FISCAL_START_MONTH, months: 12, cycle: 'fiscal-jul-jun' };`,
    `    return { startYear: y, startMonth: m, months: 12, cycle: 'rolling-from-current-month' };`,
  );
  assert.notStrictEqual(degraded, v69Src, '未成功注入缺陷(未匹配到 yearly 分支)');
  const F = sandboxPure(degraded);
  assert.ok(!yearlyWindowOk(F), '闸门失效: 年报退回当月起后判据⑧ 仍绿');
});

test('【注入缺陷自测】把 matrixCache 的窗口片段去掉 → 判据③ 必须红', () => {
  const degraded = v69Src.replace(
    'const cacheKey = `${birthDate}:${birthTime}:${Math.floor(lat*100)/100}:${Math.floor(lon*100)/100}:${tz}:${wKey}`;',
    'const cacheKey = `${birthDate}:${birthTime}:${Math.floor(lat*100)/100}:${Math.floor(lon*100)/100}:${tz}`;',
  );
  assert.notStrictEqual(degraded, v69Src, '未成功注入缺陷(未匹配到 cacheKey 构造)');
  const code = stripComments(degraded);
  const m = code.match(/const\s+cacheKey\s*=\s*`([^`]*)`/);
  assert.ok(m && !/\$\{wKey\}/.test(m[1]), '闸门失效: 窗口片段被去掉后判据③ 仍绿');
});

test('【注入缺陷自测】把火星事实表的财年门控摘掉 → 判据⑤ 必须红', () => {
  const degraded = serverSrc.replace(/_winStartKey === '2026-07'/, 'true');
  assert.notStrictEqual(degraded, serverSrc, '未成功注入缺陷(未匹配到火星门控)');
  const code = stripComments(degraded);
  assert.ok(!/_winStartKey\s*===\s*'2026-07'/.test(code), '闸门失效: 门控被摘掉后判据⑤ 仍绿');
});

// ═══════════════════════════════════════════════════════════════════════
// 🛡️ V483b: 月标题「月份号」真值锁
//
// 事故(2026-09-30 线上实测, 1999-12-15 特罗姆瑟盘, 提交 abb0518 部署后):
//   · 判据②「逐月流年行星星座零矛盾」✅ —— 正文数据已是财年 7 月起
//   · 判据⑦「正文 12 个月 == 矩阵窗口」❌ —— 正文标题仍是 2026-09 ~ 2027-08
//   ⇒ 数据 7 月起、标签 9 月起。病根: Prompt 的「12-Month Sun Sign Hard-Lock Table」
//     (`monthLockTable`) 与 `lockedTitles`、输出侧 `applyMonthLockSanitizer` 的月份键
//     全部按「服务器当前月 + i」推算(`currentMonth - 1 + i`)。V483 之前矩阵也是当前月起，
//     两者恰好抵消 → 潜伏未现; V483 把矩阵改成财年后立刻暴露。
//   (另发现: `applyMonthLockSanitizer` 的调用点普遍传 `currentYear=null` → `year = null+0 = 0`
//    → key 恒为「0年9月」→ 该锁其实长期空转; 本次一并修好。)
//
// 契约: 月标题的「年/月」唯一真源 = `astroMatrix.months[i].month_key`（输入侧治本 + 输出侧兜底）。
//       月报不受影响: 月报矩阵 month_key 本来就是「当月起」。
// ═══════════════════════════════════════════════════════════════════════
const EN12 = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
// 财年矩阵夹具: month_key = 2026-07 … 2027-06（与 V483 的真实窗口同构）
const FISCAL_MONTHS = Array.from({ length: 12 }, (_, i) => {
  const mo = ((6 + i) % 12) + 1;
  const y = mo >= 7 ? 2026 : 2027;
  return { month_key: `${y}-${String(mo).padStart(2, '0')}`, sun: { sign: EN12[i], house: i + 1 } };
});
const _ymOf = (m) => { const t = /^(\d{4})-(\d{1,2})$/.exec(m.month_key); return `${t[1]}-${Number(t[2])}`; };
const WANT_KEYS = FISCAL_MONTHS.map(_ymOf);

const TITLE_SEEDS = ['lockYearlyMonthTitles', '_v483bMonthYM', '_v479IsMonthTitleLine', '_v482SignAdjacent',
  '_v432Clause', '_v432LockNatal', '_v432AdjudicateDescriptors', '_v432Normalize', '_v432Truth', '_v432TruthMatch',
  '_v432SlotOf', '_v432ClaimOf', '_v432PatchZone', '_v432FindHouse', '_v432AllSignWords', '_v432Signs',
  '_v432SignAlts', '_V432_CFG', '_V432_NAME', '_V432_ORDER', '_V432_LANGS', '_V432_EN2LOC', '_v432Esc',
  '_V482_FWD_BREAK', '_V482_FWD_CONJ', '_V482_TRANSIT_KEYS', '_V482_TVERB', '_V478_EN_MONTHS', 'SUN_SIGN_EN',
  '_v444Signs', '_v444Esc', '_V482B_TITLE_LEAD', '_V482B_TITLE_HOUSE', '_V482B_SUN_WORD'];

function sandboxTitles(source = serverSrc) {
  const { map } = closureDecls(source, TITLE_SEEDS, ['getSignToHouseMap', 'SIGN_ORDER_ZH']);
  for (const n of [...map.keys()]) { try { new vm.Script(map.get(n)); } catch { map.delete(n); } }
  const ctx = { getSignToHouseMap, SIGN_ORDER_ZH, console, __exports: {} };
  vm.createContext(ctx);
  vm.runInContext([...map.entries()].sort((a, b) => source.indexOf(a[1]) - source.indexOf(b[1])).map((e) => e[1]).join('\n\n')
    + '\n' + TITLE_SEEDS.map((n) => `__exports[${JSON.stringify(n)}] = typeof ${n} !== 'undefined' ? ${n} : undefined;`).join('\n'), ctx);
  return ctx.__exports;
}

/** 模拟「LLM 照抄旧提示词表」的产物: 12 条标题从 2026-09 开始（错位 2 个月） */
function shiftedTitles() {
  const out = [];
  for (let i = 0; i < 12; i++) {
    const mi = 8 + i;                       // 从 9 月起
    const y = 2026 + Math.floor(mi / 12);
    const mo = (mi % 12) + 1;
    out.push(`### ${y}年${mo}月: 太阳${EN12[i]} 第1宫 · 测试主题`);
  }
  return out.join('\n');
}
const titleKeys = (t) => t.split('\n').filter((l) => /^\s*#{1,6}\s/.test(l))
  .map((l) => { const m = l.match(/(\d{4})年(\d{1,2})月/); return m ? `${m[1]}-${Number(m[2])}` : null; }).filter(Boolean);

/** 判据谓词（主判据与注入自测共用，避免「注入写法」与「判据字面」不一致造成假自测） */
function monthNumberLockedOk(F) {
  if (typeof F.lockYearlyMonthTitles !== 'function') return false;
  const M = { months: FISCAL_MONTHS, meta: {} };
  const src = shiftedTitles();
  const out = F.lockYearlyMonthTitles(src, 'zh', M, 'yearly');
  const got = titleKeys(out);
  if (got.length !== 12 || got.join(',') !== WANT_KEYS.join(',')) return false;
  const again = F.lockYearlyMonthTitles(out, 'zh', M, 'yearly');
  return again === out;                      // 幂等
}
function monthKeyTruthOk() {
  const code = stripComments(serverSrc);
  return /function\s+_v483bMonthYM\s*\(/.test(code)
    && new RegExp('_v483bMonthYM\\(m,\\s*i,').test(code);
}

test('⑫ 行为: lockYearlyMonthTitles 必须把「错位月份号」的标题改回财年窗口(V483b)', () => {
  const F = sandboxTitles();
  assert.ok(monthNumberLockedOk(F),
    '月标题月份号未被锁回财年窗口: 期望 ' + WANT_KEYS.join(',') + ' 实得 ' + titleKeys(F.lockYearlyMonthTitles(shiftedTitles(), 'zh', { months: FISCAL_MONTHS, meta: {} }, 'yearly')).join(','));
});

test('⑬ 行为: _v483bMonthYM 必须以 month_key 为真源(无 month_key 才回退当前月推算)', () => {
  const F = sandboxTitles();
  assert.ok(typeof F._v483bMonthYM === 'function', '未能抽取 _v483bMonthYM');
  const a = F._v483bMonthYM({ month_key: '2026-07' }, 0, 2026, 9);
  assert.deepStrictEqual({ y: a.year, m: a.month }, { y: 2026, m: 7 }, 'month_key=2026-07 未按真源解析(被当前月 9 带偏)');
  const b = F._v483bMonthYM({ month_key: '2027-06' }, 11, 2026, 9);
  assert.deepStrictEqual({ y: b.year, m: b.month }, { y: 2027, m: 6 }, 'month_key=2027-06 未按真源解析');
  // 回退分支: 无 month_key 时保持「当前月 + i」的历史语义(月报/旧格式兼容)
  const c = F._v483bMonthYM({}, 0, 2026, 9);
  assert.deepStrictEqual({ y: c.year, m: c.month }, { y: 2026, m: 9 }, '无 month_key 的回退语义被改坏(月报会错)');
  const d = F._v483bMonthYM({}, 4, 2026, 9);
  assert.deepStrictEqual({ y: d.year, m: d.month }, { y: 2027, m: 1 }, '回退分支跨年进位错(9 月起第 5 个应为次年 1 月)');
});

test('⑭ 源码: 月份键构造一律走 _v483bMonthYM, 不得再用「当前月 + i」直推', () => {
  const code = stripComments(serverSrc);
  assert.ok(/function\s+_v483bMonthYM\s*\(/.test(code), '缺少 _v483bMonthYM 真源助手');
  const uses = [...code.matchAll(/_v483bMonthYM\(m,\s*i,/g)].length;
  assert.ok(uses >= 3, `至少 3 处月份键构造必须走 _v483bMonthYM(monthLockTable / lockedTitles / applyMonthLockSanitizer), 实得 ${uses}`);
  assert.ok(!/const\s+mi\s*=\s*currentMonth\s*-\s*1\s*\+\s*i/.test(code),
    '仍存在「const mi = currentMonth - 1 + i」直推月份号(病灶写法)');
  assert.ok(!/Report cycle starts from current month/.test(serverSrc),
    'Prompt 仍声称「从当前月起」—— 年报已是财年窗口');
  assert.ok(/\$\{axisYear\}年\$\{monthNamesZH\[axisMonth-1\]\}/.test(code),
    'Prompt 的起始月说明未改用矩阵轴(axisYear/axisMonth)');
});

test('【注入缺陷自测】把 lockYearlyMonthTitles 的月份号重写禁掉 → 判据⑫ 必须红', () => {
  const degraded = serverSrc.replace(
    '        if (_mk) {\n          const _y = _mk[1], _mo = Number(_mk[2]);',
    '        if (false) {\n          const _y = _mk[1], _mo = Number(_mk[2]);',
  );
  assert.notStrictEqual(degraded, serverSrc, '未成功注入缺陷(未匹配到 lockYearlyMonthTitles 的月份号重写块)');
  const F = sandboxTitles(degraded);
  assert.ok(!monthNumberLockedOk(F), '闸门失效: 月份号重写被禁掉后判据⑫ 仍绿');
});

test('【注入缺陷自测】把 _v483bMonthYM 的 month_key 分支打掉 → 判据⑬ 必须红', () => {
  const degraded = serverSrc.replace(
    'if (t) return { year: Number(t[1]), month: Number(t[2]) };',
    'if (false && t) return { year: Number(t[1]), month: Number(t[2]) };',
  );
  assert.notStrictEqual(degraded, serverSrc, '未成功注入缺陷(未匹配到 _v483bMonthYM 的 month_key 分支)');
  const F = sandboxTitles(degraded);
  const a = F._v483bMonthYM({ month_key: '2026-07' }, 0, 2026, 9);
  assert.ok(!(a.year === 2026 && a.month === 7), '闸门失效: month_key 分支打掉后判据⑬ 仍绿');
});

test('【注入缺陷自测】把月份键调用点摘掉 / 病灶写法回归 → 判据⑭ 必须红', () => {
  const degraded = serverSrc.replace(/const _ym = _v483bMonthYM\(m, i, currentYear, currentMonth\)/g,
    'const _ym = { year: currentYear, month: currentMonth }');
  assert.notStrictEqual(degraded, serverSrc, '未成功注入缺陷(未匹配到 _v483bMonthYM 调用点)');
  const uses = [...stripComments(degraded).matchAll(/_v483bMonthYM\(m,\s*i,/g)].length;
  assert.ok(uses < 3, '闸门失效: 调用点被摘掉后判据⑭ 仍绿');
  const bad = serverSrc.replace('function _v483bMonthYM(m, i, currentYear, currentMonth) {',
    'function _v483bMonthYM(m, i, currentYear, currentMonth) {\n  const mi = currentMonth - 1 + i;');
  assert.ok(/const\s+mi\s*=\s*currentMonth\s*-\s*1\s*\+\s*i/.test(stripComments(bad)),
    '闸门失效: 病灶写法重新出现后判据⑭ 仍绿');
});
