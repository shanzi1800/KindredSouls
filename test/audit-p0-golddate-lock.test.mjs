// ═══════════════════════════════════════════════════════════════════════
// 🔴 P0 生产热修守备闸门（2026-10-14 主公朱批 · 封仓令第一条「P0 熔断级生产热修」）
//
// 修复一（P0-1）：`v69_client.js` 的 `PLANET_ZH_MAP` 键为**大写**（`Sun`/`Mercury`…），
//   而消费点入参 `p.k`/`d.k` 恒为**小写**（`pNames`/`dangerPlanets`）⇒ `PLANET_ZH_MAP[p.k]`
//   恒 `undefined` ⇒ 月报真值块行星名恒回落小写英文（实测 `· mercury: 天蝎座第9宫`），
//   真值锚定强度被削弱。治法：表键改小写（与消费方同源）。
//
// 修复二（P0-2）：新增 `server.js::lockYearlyGoldNuggetDates` —— 年报金块日期后置硬锁。
//   病根（1979-11-11 线上年报实测）：引擎真值已注入 prompt（相位 12/12 全对可证），
//   但**日期**被 LLM 篡改（高峰窗口起点错 10/12、区间倒挂、同日起止）；黑天鹅**真值空缺**
//   时 4/4 静默自编。治法：按 `### <月标题>` 分段（复用 `_v516MonthHeadKey`），把
//   [财富高峰窗口]/[财务黑天鹅日] 行内日期区间确定性改写为引擎真值；真值空缺 ⇒ 改
//   「本月星象平稳，无高危黑天鹅破财日」+ 子行同步（禁新矛盾）。
//
// 射程声明（军令立石）：本闸门只守 **P0-1 表键同源** 与 **P0-2 年报金块日期**。
//   月报不含金块（结构上无锚点）⇒ 不在 P0-2 射程；流年落宫 / 同篇矛盾 / 残句 / Mine E /
//   子行自由散文日期 ⇒ **未测 / 未覆盖（挂账）**，本闸门**不**为其背书。
//
// 纪律：抽取 server.js 真源装配 + 六语行为用例 + 注入反漂移（摘掉修复必红）+ 段位守备。
// ═══════════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { indexDecls } from './tools/extract_decls.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf-8');
const V69 = fs.readFileSync(path.join(ROOT, 'v69_client.js'), 'utf-8');
const V69_PATH = path.join(ROOT, 'v69_client.js');

// ── server.js 真源装配（lockYearlyGoldNuggetDates + 其闭包依赖）──────────────
const NEED = ['_GN_LABELS', '_V516_MONTHS', '_V516_TH_BE_OFFSET', '_EPHEM_DAYMON', '_EPHEM_MON_ALIAS',
  '_EPHEM_MON_IDX', '_v516Esc', '_v516MonthHeadKey', '_hsMatchCase', 'lockYearlyGoldNuggetDates'];
const _YG_NEED = [...new Set(NEED.concat(
  Array.from(indexDecls(SRC).keys()).filter((n) => n.startsWith('_YG_') || n.startsWith('_yg'))))];

function build(source = SRC) {
  const d = indexDecls(source);
  for (const n of _YG_NEED) if (!d.has(n)) throw new Error('缺声明: ' + n);
  const code = _YG_NEED.slice()
    .sort((a, b) => source.indexOf(d.get(a)) - source.indexOf(d.get(b)))
    .map((n) => d.get(n)).join('\n\n');
  return new Function(code + '\nreturn { lockYearlyGoldNuggetDates, _ygPeakRange, _ygSwanRange };')();
}
const F = build();

// ── v69_client.js 加载器（真源 / 变体）───────────────────────────────────
// 🔴 铁律：`data:` URL 下「相对导入 + fileURLToPath/createRequire(import.meta.url)」三处不可解析
//   ⇒ 必须重写模块头（相对导入 → 绝对 file: URL；两处 import.meta.url → 真实文件路径）。
//   ⚠️ 仅重写模块头 ⇒ 被测逻辑段逐字未改，注入仍属「真实源码篡改」。
function loadV69(src) {
  const abs = pathToFileURL(path.join(ROOT, 'astroTerms.js')).href;
  let s = src.split("from './astroTerms.js'").join(`from '${abs}'`);
  s = s.split('fileURLToPath(import.meta.url)').join(JSON.stringify(V69_PATH));
  s = s.split('createRequire(import.meta.url)').join(`createRequire(${JSON.stringify(pathToFileURL(V69_PATH).href)})`);
  return import('data:text/javascript;base64,' + Buffer.from(s, 'utf8').toString('base64'));
}
const V69MOD = await import(pathToFileURL(V69_PATH).href);

// ── 夹具：月报真值盘（1979-11-11 盘 2026-10 真值，与线上实测一致）──────────
const MM = {
  meta: { sun_sign: 'Scorpio', rising_sign: 'Aquarius', natal_moon: { sign: 'Leo' } },
  months: [{
    month_key: '2026-10',
    sun: { sign: 'Libra', house: 8 },
    mercury: { sign: 'Scorpio', house: 9, retrograde: true },
    venus: { sign: 'Scorpio', house: 9, retrograde: true },
    mars: { sign: 'Leo', house: 7 },
    jupiter: { sign: 'Leo', house: 7 },
    saturn: { sign: 'Aries', house: 2, retrograde: true },
    uranus: { sign: 'Gemini', house: 4, retrograde: true },
    neptune: { sign: 'Aries', house: 2, retrograde: true },
    pluto: { sign: 'Aquarius', house: 12, retrograde: true },
  }],
};

// ── 夹具：年报真值矩阵（2026-07 高峰有值/黑天鹅空缺；2026-08 两者皆有）──────
const MK = (key, peak, swan) => ({
  month_key: key,
  peak_windows: peak ? [{ dates: `${peak[0]} - ${peak[1]}`, window_days: [peak[0], peak[1]] }] : [],
  black_swan_days: (swan || []).map((d) => ({ date: d, aspect: 'Mars SQUARE Saturn', severity: 'HIGH' })),
});
const MATRIX = {
  months: [
    MK('2026-07', ['2026-07-24', '2026-07-30'], []),
    MK('2026-08', ['2026-08-13', '2026-08-17'], ['2026-08-25', '2026-08-31']),
  ],
};

// ── 六语样本（金块行日期**全部写错**；子行/正文为 LLM 自由发挥区）───────────
const CASES = [
  {
    lang: 'zh', label: 'zh',
    input: [
      '### 2026年7月: 太阳巨蟹座 第6宫 · 主题',
      '* 🟢 **[财富高峰窗口]**: **2026年1月10日 - 2026年7月26日**（相位A）。',
      '* 🔴 **[财务黑天鹅日]**: **2026年6月29日 - 2026年6月29日**流年水星在巨蟹座逆行。',
      ' * *断路器警告*: 若你在这段时间内签署任何文件，请务必逐字审阅。',
      '### 2026年8月: 太阳狮子座 第7宫 · 主题',
      '* 🟢 **[财富高峰窗口]**: **2026年1月10日 - 2026年1月10日**（相位B）。',
      '* 🔴 **[财务黑天鹅日]**: **2026年8月1日 - 2026年8月2日**流年火星共振。',
    ].join('\n'),
    want: [
      '### 2026年7月: 太阳巨蟹座 第6宫 · 主题',
      '* 🟢 **[财富高峰窗口]**: **2026年7月24日 - 2026年7月30日**（相位A）。',
      '* 🔴 **[财务黑天鹅日]**: 本月星象平稳，无高危黑天鹅破财日。',
      ' * *断路器警告*: 无需特别防范，按常规财务纪律执行即可。',
      '### 2026年8月: 太阳狮子座 第7宫 · 主题',
      '* 🟢 **[财富高峰窗口]**: **2026年8月13日 - 2026年8月17日**（相位B）。',
      '* 🔴 **[财务黑天鹅日]**: **2026年8月25日 - 2026年8月31日**流年火星共振。',
    ].join('\n'),
  },
  {
    lang: 'en', label: 'en（英文标签不可译 + 月名序）',
    input: [
      '### July 2026: Sun in Cancer · House 6',
      '* 🟢 **[Peak Revenue Window]**: **January 10, 2026 - July 26, 2026** (aspect A).',
      '* 🔴 **[Financial Black Swan Day]**: **June 29, 2026 - June 29, 2026** Mercury retrograde.',
      ' * *Circuit-breaker*: If you sign anything now, read every clause.',
      '### August 2026: Sun in Leo · House 7',
      '* 🟢 **[Peak Revenue Window]**: **January 10, 2026 - January 10, 2026** (aspect B).',
      '* 🔴 **[Financial Black Swan Day]**: **August 1, 2026 - August 2, 2026** Mars resonance.',
    ].join('\n'),
    want: [
      '### July 2026: Sun in Cancer · House 6',
      '* 🟢 **[Peak Revenue Window]**: **July 24, 2026 - July 30, 2026** (aspect A).',
      '* 🔴 **[Financial Black Swan Day]**: This month the sky is calm — no high-risk financial black-swan day.',
      ' * *Circuit-breaker*: No special precaution is needed — follow your usual financial discipline.',
      '### August 2026: Sun in Leo · House 7',
      '* 🟢 **[Peak Revenue Window]**: **August 13, 2026 - August 17, 2026** (aspect B).',
      '* 🔴 **[Financial Black Swan Day]**: **August 25, 2026 - August 31, 2026** Mars resonance.',
    ].join('\n'),
  },
  {
    lang: 'es', label: 'es（「D de mes de Y」原生序）',
    input: [
      '### Julio 2026: Sol en Cáncer · Casa 6',
      '* 🟢 **[Peak Revenue Window]**: **10 de enero de 2026 - 26 de julio de 2026** (aspecto A).',
      '* 🔴 **[Financial Black Swan Day]**: **29 de junio de 2026 - 29 de junio de 2026** Mercurio retrógrado.',
      ' * *Cortacircuitos*: Si firmas algo ahora, lee cada cláusula.',
      '### Agosto 2026: Sol en Leo · Casa 7',
      '* 🟢 **[Peak Revenue Window]**: **10 de enero de 2026 - 10 de enero de 2026** (aspecto B).',
      '* 🔴 **[Financial Black Swan Day]**: **1 de agosto de 2026 - 2 de agosto de 2026** resonancia de Marte.',
    ].join('\n'),
    want: [
      '### Julio 2026: Sol en Cáncer · Casa 6',
      '* 🟢 **[Peak Revenue Window]**: **24 de julio de 2026 - 30 de julio de 2026** (aspecto A).',
      '* 🔴 **[Financial Black Swan Day]**: Este mes el cielo está tranquilo — sin día de cisne negro financiero de alto riesgo.',
      ' * *Cortacircuitos*: No se requiere precaución especial — siga su disciplina financiera habitual.',
      '### Agosto 2026: Sol en Leo · Casa 7',
      '* 🟢 **[Peak Revenue Window]**: **13 de agosto de 2026 - 17 de agosto de 2026** (aspecto B).',
      '* 🔴 **[Financial Black Swan Day]**: **25 de agosto de 2026 - 31 de agosto de 2026** resonancia de Marte.',
    ].join('\n'),
  },
  {
    lang: 'fr', label: 'fr（「D mois Y」+ 序数 1er）',
    input: [
      '### Juillet 2026: Soleil en Cancer · Maison 6',
      '* 🟢 **[Peak Revenue Window]**: **10 janvier 2026 - 26 juillet 2026** (aspect A).',
      '* 🔴 **[Financial Black Swan Day]**: **1er juin 2026 - 29 juin 2026** Mercure rétrograde.',
      ' * *Coupe-circuit*: Si vous signez maintenant, lisez chaque clause.',
      '### Août 2026: Soleil en Lion · Maison 7',
      '* 🟢 **[Peak Revenue Window]**: **10 janvier 2026 - 10 janvier 2026** (aspect B).',
      '* 🔴 **[Financial Black Swan Day]**: **1 août 2026 - 2 août 2026** résonance de Mars.',
    ].join('\n'),
    want: [
      '### Juillet 2026: Soleil en Cancer · Maison 6',
      '* 🟢 **[Peak Revenue Window]**: **24 juillet 2026 - 30 juillet 2026** (aspect A).',
      '* 🔴 **[Financial Black Swan Day]**: Ce mois-ci le ciel est calme — aucun jour de cygne noir financier à haut risque.',
      ' * *Coupe-circuit*: Aucune précaution particulière — suivez votre discipline financière habituelle.',
      '### Août 2026: Soleil en Lion · Maison 7',
      '* 🟢 **[Peak Revenue Window]**: **13 août 2026 - 17 août 2026** (aspect B).',
      '* 🔴 **[Financial Black Swan Day]**: **25 août 2026 - 31 août 2026** résonance de Mars.',
    ].join('\n'),
  },
  {
    lang: 'th', label: 'th（佛历不入射程，只换「日+月」）',
    input: [
      '### กรกฎาคม 2026: ดวงอาทิตย์ราศีกรกฎ · ภพที่ 6',
      '* 🟢 **[Peak Revenue Window]**: **10 มกราคม 2026 - 26 กรกฎาคม 2026** (มุม A)',
      '* 🔴 **[Financial Black Swan Day]**: **29 มิถุนายน 2026 - 29 มิถุนายน 2026** ดาวพุธถอยหลัง',
      ' * *ตัวตัดวงจร*: หากคุณลงนามตอนนี้ โปรดอ่านทุกข้อ',
      '### สิงหาคม 2026: ดวงอาทิตย์ราศีสิงห์ · ภพที่ 7',
      '* 🟢 **[Peak Revenue Window]**: **10 มกราคม 2026 - 10 มกราคม 2026** (มุม B)',
      '* 🔴 **[Financial Black Swan Day]**: **1 สิงหาคม 2026 - 2 สิงหาคม 2026** พลังดาวอังคาร',
    ].join('\n'),
    want: [
      '### กรกฎาคม 2026: ดวงอาทิตย์ราศีกรกฎ · ภพที่ 6',
      '* 🟢 **[Peak Revenue Window]**: **24 กรกฎาคม 2026 - 30 กรกฎาคม 2026** (มุม A)',
      '* 🔴 **[Financial Black Swan Day]**: เดือนนี้ดวงดาวสงบ ไม่มีวันวิกฤตการเงินความเสี่ยงสูง',
      ' * *ตัวตัดวงจร*: ไม่ต้องระวังเป็นพิเศษ ปฏิบัติตามวินัยการเงินปกติ',
      '### สิงหาคม 2026: ดวงอาทิตย์ราศีสิงห์ · ภพที่ 7',
      '* 🟢 **[Peak Revenue Window]**: **13 สิงหาคม 2026 - 17 สิงหาคม 2026** (มุม B)',
      '* 🔴 **[Financial Black Swan Day]**: **25 สิงหาคม 2026 - 31 สิงหาคม 2026** พลังดาวอังคาร',
    ].join('\n'),
  },
  {
    lang: 'vi', label: 'vi（「ngày D tháng M năm Y」）',
    input: [
      '### Tháng 7 2026: Mặt Trời ở Cự Giải · Nhà 6',
      '* 🟢 **[Peak Revenue Window]**: **ngày 10 tháng 1 năm 2026 - ngày 26 tháng 7 năm 2026** (góc A).',
      '* 🔴 **[Financial Black Swan Day]**: **ngày 29 tháng 6 năm 2026 - ngày 29 tháng 6 năm 2026** Sao Thủy nghịch hành.',
      ' * *Cầu dao*: Nếu bạn ký bây giờ, hãy đọc từng điều khoản.',
      '### Tháng 8 2026: Mặt Trời ở Sư Tử · Nhà 7',
      '* 🟢 **[Peak Revenue Window]**: **ngày 10 tháng 1 năm 2026 - ngày 10 tháng 1 năm 2026** (góc B).',
      '* 🔴 **[Financial Black Swan Day]**: **ngày 1 tháng 8 năm 2026 - ngày 2 tháng 8 năm 2026** năng lượng Sao Hỏa.',
    ].join('\n'),
    want: [
      '### Tháng 7 2026: Mặt Trời ở Cự Giải · Nhà 6',
      '* 🟢 **[Peak Revenue Window]**: **ngày 24 tháng 7 năm 2026 - ngày 30 tháng 7 năm 2026** (góc A).',
      '* 🔴 **[Financial Black Swan Day]**: Tháng này bầu trời bình yên — không có ngày thiên nga đen tài chính rủi ro cao.',
      ' * *Cầu dao*: Không cần đề phòng đặc biệt — hãy tuân thủ kỷ luật tài chính thường lệ.',
      '### Tháng 8 2026: Mặt Trời ở Sư Tử · Nhà 7',
      '* 🟢 **[Peak Revenue Window]**: **ngày 13 tháng 8 năm 2026 - ngày 17 tháng 8 năm 2026** (góc B).',
      '* 🔴 **[Financial Black Swan Day]**: **ngày 25 tháng 8 năm 2026 - ngày 31 tháng 8 năm 2026** năng lượng Sao Hỏa.',
    ].join('\n'),
  },
];

// ═══════════════════════════ A 组 · P0-1（表键同源）═══════════════════════════

test('A1 静态：PLANET_ZH_MAP 键必须**全小写**（与消费方 pNames/dangerPlanets 同源）', () => {
  const m = V69.match(/const PLANET_ZH_MAP = \{([\s\S]*?)\n\};/);
  assert.ok(m, '未找到 PLANET_ZH_MAP 定义');
  const keys = [...m[1].matchAll(/([A-Za-z]+)\s*:/g)].map((x) => x[1]);
  assert.equal(keys.length, 10, `键数应为 10，实得 ${keys.length}`);
  const bad = keys.filter((k) => k !== k.toLowerCase());
  assert.deepStrictEqual(bad, [], `存在大写键（恒 undefined 病根）: ${bad.join(',')}`);
  // 消费方入参形态（唯二消费点）
  assert.ok(/const pNames = \['sun','mercury'/.test(V69), 'pNames 形态漂移');
  assert.ok(/const dangerPlanets = \['venus','mars'/.test(V69), 'dangerPlanets 形态漂移');
});

test('A2 行为：zh 概览块必须输出**中文行星名**，且不得回落小写英文', () => {
  const out = V69MOD.buildMonthlyOverviewBlock(MM, 'zh');
  for (const cn of ['太阳', '水星', '金星', '火星', '木星', '土星', '天王星', '海王星', '冥王星']) {
    assert.ok(out.includes(cn), `zh 概览块缺中文行星名「${cn}」`);
  }
  assert.ok(!/·\s*(?:sun|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto)\s*:/.test(out),
    'zh 概览块出现小写英文行星名（= 键失配病根复发）');
});

test('A3 行为：zh 陷阱块的危险行星行同样取中文名（判据 = 不得回落小写英文）', () => {
  const out = V69MOD.buildMonthlyTrapBlock(MM, 'zh');
  const line = out.split('\n').find((l) => l.indexOf('危险行星:') === 0) || '';
  assert.ok(line, 'zh 陷阱块缺「危险行星」行');
  assert.ok(!/\((?:sun|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto)第/.test(line),
    `陷阱块回落小写英文行星名（键失配病根复发）: ${line}`);
  assert.ok(/[太阳水星金星火星木星土星天王星海王星冥王星]/.test(line), `陷阱块未输出中文行星名: ${line}`);
});

test('A4 注入反漂移：表键改回**大写** ⇒ A2/A3 判据必红', async () => {
  const GOOD = "  sun:'太阳', moon:'月亮', mercury:'水星', venus:'金星',\n  mars:'火星', jupiter:'木星', saturn:'土星',\n  uranus:'天王星', neptune:'海王星', pluto:'冥王星',";
  const BAD = "  Sun:'太阳', Moon:'月亮', Mercury:'水星', Venus:'金星',\n  Mars:'火星', Jupiter:'木星', Saturn:'土星',\n  Uranus:'天王星', Neptune:'海王星', Pluto:'冥王星',";
  assert.ok(V69.includes(GOOD), '注入锚点漂移（表键形态已变）');
  const injected = V69.replace(GOOD, BAD);
  assert.notStrictEqual(injected, V69, '注入未真的改变源码');
  const G = await loadV69(injected);
  const out = G.buildMonthlyOverviewBlock(MM, 'zh');
  assert.ok(!/水星|天王星|冥王星/.test(out), '键改回大写后仍输出中文名 —— 判据射程不足');
  assert.ok(/·\s*mercury\s*:/.test(out), `应回落小写英文以暴露病根，实际:\n${out}`);
});

// ═══════════════════════════ B 组 · P0-2（金块日期硬锁）═══════════════════════

test('B1 六语实测：错误日期区间 → 引擎真值；空缺 → 声明无高危日（含子行同步）', () => {
  const fails = [];
  for (const c of CASES) {
    const got = F.lockYearlyGoldNuggetDates(c.input, c.lang, MATRIX, 'yearly');
    if (got !== c.want) fails.push(`[${c.lang}] ${c.label}\n--- got ---\n${got}\n--- want ---\n${c.want}`);
  }
  assert.deepStrictEqual(fails, [], 'B1 失败:\n' + fails.join('\n\n'));
});

test('B2 幂等：二次施加零改动（逐字节）', () => {
  for (const c of CASES) {
    const once = F.lockYearlyGoldNuggetDates(c.input, c.lang, MATRIX, 'yearly');
    const twice = F.lockYearlyGoldNuggetDates(once, c.lang, MATRIX, 'yearly');
    assert.strictEqual(twice, once, `[${c.lang}] 非幂等`);
  }
});

test('B3 负例：已等于真值 ⇒ 零改动；非年报 ⇒ 透传；段<2 ⇒ 透传；日期 >2 个 ⇒ 弃权', () => {
  const okLine = [
    '### 2026年7月: 太阳巨蟹座 第6宫',
    '* 🟢 **[财富高峰窗口]**: **2026年7月24日 - 2026年7月30日**（相位）。',
    '* 🔴 **[财务黑天鹅日]**: 本月星象平稳，无高危黑天鹅破财日。',
    '### 2026年8月: 太阳狮子座 第7宫',
    '* 🟢 **[财富高峰窗口]**: **2026年8月13日 - 2026年8月17日**（相位）。',
    '* 🔴 **[财务黑天鹅日]**: **2026年8月25日 - 2026年8月31日**流年火星。',
  ].join('\n');
  assert.strictEqual(F.lockYearlyGoldNuggetDates(okLine, 'zh', MATRIX, 'yearly'), okLine, '真值已正确却仍改动');
  // 非年报 ⇒ 逐字节透传
  const monthly = CASES[0].input;
  assert.strictEqual(F.lockYearlyGoldNuggetDates(monthly, 'zh', MATRIX, 'monthly'), monthly, 'monthly 未透传');
  // 段 < 2 ⇒ 透传
  const oneMonth = ['### 2026年7月: 太阳巨蟹座 第6宫', '* 🟢 **[财富高峰窗口]**: **2026年1月10日**（相位）。'].join('\n');
  assert.strictEqual(F.lockYearlyGoldNuggetDates(oneMonth, 'zh', MATRIX, 'yearly'), oneMonth, '单段未透传');
  // 3 个日期 token ⇒ 宁漏不改
  const three = [
    '### 2026年7月: 太阳巨蟹座 第6宫',
    '* 🟢 **[财富高峰窗口]**: **2026年1月10日 - 2026年2月10日 - 2026年3月10日**（相位）。',
    '### 2026年8月: 太阳狮子座 第7宫',
    '* 🟢 **[财富高峰窗口]**: **2026年8月13日 - 2026年8月17日**（相位）。',
  ].join('\n');
  const out3 = F.lockYearlyGoldNuggetDates(three, 'zh', MATRIX, 'yearly');
  assert.ok(out3.includes('2026年1月10日 - 2026年2月10日 - 2026年3月10日'), '3 日期 token 行应弃权（禁吞并正文）');
});

test('B4 真值空缺铁律：黑天鹅行与子行的**自编内容**必须被清除（禁残留）', () => {
  const c = CASES[0];
  const got = F.lockYearlyGoldNuggetDates(c.input, 'zh', MATRIX, 'yearly');
  assert.ok(got.includes('本月星象平稳，无高危黑天鹅破财日。'), 'zh 空缺未改声明句');
  assert.ok(!/2026年6月29日/.test(got), '空缺行的自编日期残留');
  assert.ok(got.includes('无需特别防范，按常规财务纪律执行即可。'), '子行未同步改写（新矛盾）');
  assert.ok(!/断路器警告\*: 若你在这段时间内/.test(got), '子行自编内容残留');
  // 行数守恒（结构不变）
  assert.equal(got.split('\n').length, c.input.split('\n').length, '改写改变了行数');
});

test('B5 无日期 token ⇒ 在标签冒号后插入真值区间（不得静默放过）', () => {
  const inp = [
    '### 2026年7月: 太阳巨蟹座 第6宫',
    '* 🟢 **[财富高峰窗口]**: （相位见下）。',
    '### 2026年8月: 太阳狮子座 第7宫',
    '* 🟢 **[财富高峰窗口]**: **2026年8月13日 - 2026年8月17日**（相位）。',
  ].join('\n');
  const got = F.lockYearlyGoldNuggetDates(inp, 'zh', MATRIX, 'yearly');
  assert.ok(got.includes('**2026年7月24日 - 2026年7月30日**'), '无日期 token 行未插入真值区间');
});

// ═══════════════════════════ C 组 · 源码 / 接线守备 ═══════════════════════════

test('C1 挂载点：非流式 + 流式两条后置链收口位各有一处（≥2）', () => {
  const flat = SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  const mounts = (flat.match(/lockYearlyGoldNuggetDates\(/g) || []).length
    - (flat.match(/function lockYearlyGoldNuggetDates\(/g) || []).length;
  assert.ok(mounts >= 2, `挂载点应 ≥2（非流式 + 流式），实得 ${mounts}`);
  // 必须紧跟在 lockMonthlyWeekRanges 之后（同收口位）
  assert.ok(/lockMonthlyWeekRanges\([^)]*\);\s*[\s\S]{0,260}?lockYearlyGoldNuggetDates\(/.test(flat),
    '未与既有收口锁（lockMonthlyWeekRanges）同段相邻');
});

test('C2 标签分组与 _GN_LABELS 同源（偶数位 = 高峰词，奇数位 = 黑天鹅词）', () => {
  const d = indexDecls(SRC);
  const gn = d.get('_GN_LABELS');
  assert.ok(gn, '缺 _GN_LABELS');
  const labels = [...gn.matchAll(/'([^']+)'/g)].map((m) => m[1]);
  assert.equal(labels.length, 12, `_GN_LABELS 应恰 12 项，实得 ${labels.length}`);
  labels.forEach((s, i) => {
    const isPeak = /Peak|高峰|Pico|Sommet|ทองคำ|Vàng/i.test(s);
    assert.equal(isPeak, i % 2 === 0, `_GN_LABELS[${i}]="${s}" 与「偶=高峰/奇=黑天鹅」契约不符`);
  });
  assert.ok(/function _ygLabelsOf\(kind\)/.test(SRC), '缺 _ygLabelsOf（标签分组延迟求值核）');
  assert.ok(/_ygLabelsOf\('peak'\)/.test(SRC) && /_ygLabelsOf\('swan'\)/.test(SRC), '标签分组未按 kind 取用');
  assert.ok(/_GN_LABELS\.filter\(\(_, i\) => i % 2 === \(kind === 'swan' \? 1 : 0\)\)/.test(SRC),
    '分组判据未与 _GN_LABELS 同源');
});

test('C2b 🔴 顶层禁止立即求值：新段不得出现「const … = _GN_LABELS.…」模块级依赖', () => {
  // 血训（2026-10-14）：老闸门以「区间切片 + new Function」装配源码，会把本段代码带进
  //   一个没有 _GN_LABELS 的作用域；顶层 const 立即求值 ⇒ ReferenceError ⇒ 老闸门全红。
  //   铁律：本段顶层只许「纯字面量 + 函数声明」，一切既有常量引用延迟到函数体内。
  const flat = SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  assert.ok(!/^const _YG\w+\s*=\s*_GN_LABELS/m.test(flat), '顶层出现 `const _YG… = _GN_LABELS…`（立即求值 ⇒ 老闸门切片必炸）');
  assert.ok(!/^const _YG\w+\s*=\s*_[A-Z]\w*\./m.test(flat), '顶层出现对既有常量的模块级依赖（应延迟到函数体内）');
  // 行为佐证：把本段代码单独抽出（模拟老闸门的切片装配，不给 _GN_LABELS）⇒ 不得在装载期炸
  const seg = SRC.slice(SRC.indexOf('const _YG_LANGS'), SRC.indexOf('// 🛡️ V445：流年行星星座归属锁'));
  assert.ok(seg.length > 1000, '区间定位失败');
  let loadErr = null;
  try { new Function(seg + '\nreturn typeof lockYearlyGoldNuggetDates;'); } catch (e) { loadErr = e && e.message; }
  assert.strictEqual(loadErr, null, `本段被独立装配时装载期即炸（老闸门同款场景）: ${loadErr}`);
});

test('C3 六语文案齐备（声明句 + 子行句；缺语种 ⇒ 静默回退 zh = 语言契约违背）', () => {
  for (const n of ['_YG_NO_SWAN_TEXT', '_YG_NO_RISK_TEXT']) {
    const blk = SRC.match(new RegExp('const ' + n + ' = \\{[\\s\\S]*?\\n\\};'))[0];
    for (const l of ['zh', 'en', 'es', 'fr', 'th', 'vi']) {
      assert.ok(new RegExp('\\b' + l + ':').test(blk), `${n} 缺 '${l}'`);
    }
  }
  for (const l of ['zh', 'en', 'es', 'fr', 'th', 'vi']) {
    assert.ok(new RegExp("' " + l + "'|" + l + ": \\'").test(SRC) || SRC.includes(`  ${l}:`), `${l} 日期模板缺失`);
  }
  // 日期模板六语齐备（就地分量替换的解析锚）
  const dp = SRC.match(/const _YG_DATE_PATS = \{[\s\S]*?\n\};/)[0];
  for (const l of ['zh', 'en', 'es', 'fr', 'th', 'vi']) assert.ok(new RegExp('\\b' + l + ':').test(dp), `_YG_DATE_PATS 缺 '${l}'`);
});

test('C4 段位守备：本闸门已入编 test:astro 且居收口位之前（下界 + iCap === len-2）', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const segs = pkg.scripts['test:astro'].split(' && ');
  const iCap = segs.findIndex((s) => s.includes('e40-compat'));
  assert.ok(iCap !== -1, '收口位 e40-compat 缺失');
  assert.equal(iCap, segs.length - 2, 'e40-compat 必须保持收口位（倒数第二段）');
  const iMe = segs.findIndex((s) => s.includes('audit-p0-golddate-lock'));
  assert.ok(iMe !== -1, '本闸门未入编 test:astro');
  assert.ok(iMe < iCap, `本闸门必须居收口位之前：me=${iMe} cap=${iCap}`);
});

// ═══════════════════════════ D 组 · 注入反漂移（P0-2）═══════════════════════════

test('D1 注入：摘掉「真值替换」调用 ⇒ B1 必红（判据有牙）', () => {
  const GOOD = 'if (_ygRewriteRangeOnLine(lines, j, lang, r) > 0) dateFixes++; else skipped++;';
  assert.ok(SRC.includes(GOOD), '锚点漂移：真值替换调用段未匹配');
  const injected = SRC.replace(GOOD, 'skipped++;');
  assert.notStrictEqual(injected, SRC, '注入未真的改变源码');
  const G = build(injected);
  const red = CASES.filter((c) => G.lockYearlyGoldNuggetDates(c.input, c.lang, MATRIX, 'yearly') !== c.want).length;
  assert.ok(red >= 6, `摘掉真值替换后仅 ${red} 例变红（应 = 6：六语全中）`);
});

test('D2 注入：声明句置空 ⇒ B4 必红（空缺铁律有牙）', () => {
  const GOOD = "  zh: '本月星象平稳，无高危黑天鹅破财日。',";
  assert.ok(SRC.includes(GOOD), '锚点漂移：zh 声明句未匹配');
  const injected = SRC.replace(GOOD, "  zh: '',");
  const G = build(injected);
  const got = G.lockYearlyGoldNuggetDates(CASES[0].input, 'zh', MATRIX, 'yearly');
  assert.ok(!got.includes('本月星象平稳，无高危黑天鹅破财日。'), '声明句置空后仍输出声明 —— 判据射程不足');
});

test('D3 注入：摘掉子行同步 ⇒ B4 的「子行已改写」判据必红', () => {
  const GOOD = 'if (sl !== null && sl !== lines[j2]) { lines[j2] = sl; sublineFixes++; }';
  assert.ok(SRC.includes(GOOD), '锚点漂移：子行同步段未匹配');
  const injected = SRC.replace(GOOD, 'void sl;');
  const G = build(injected);
  const got = G.lockYearlyGoldNuggetDates(CASES[0].input, 'zh', MATRIX, 'yearly');
  assert.ok(!got.includes('无需特别防范，按常规财务纪律执行即可。'), '摘掉子行同步后子行仍被改写 —— 判据射程不足');
  assert.ok(/断路器警告\*: 若你在这段时间内/.test(got), '子行自编内容应在注入后暴露残留');
});

test('D4 注入：月标题识别失效（_v516MonthHeadKey 恒 null）⇒ 段<2 弃权，六语全红', () => {
  const GOOD = 'function _v516MonthHeadKey(line, lang) {\n  if (!line) return null;';
  assert.ok(SRC.includes(GOOD), '锚点漂移：_v516MonthHeadKey 头部未匹配');
  const injected = SRC.replace(GOOD, "function _v516MonthHeadKey(line, lang) {\n  return null;\n  if (!line) return null;");
  const G = build(injected);
  const red = CASES.filter((c) => G.lockYearlyGoldNuggetDates(c.input, c.lang, MATRIX, 'yearly') !== c.want).length;
  assert.equal(red, 6, `段切失效后应 6 例全红（弃权=透传），实得 ${red}`);
});

test('D5 判据不得恒真：恒等探针必须被判红', () => {
  const judge = (fn) => CASES.every((c) => fn(c.input, c.lang, MATRIX, 'yearly') === c.want);
  assert.strictEqual(judge(F.lockYearlyGoldNuggetDates), true, '正例被误判');
  assert.strictEqual(judge((t) => t), false, '恒等反例被误判绿（恒真探针）');
});
