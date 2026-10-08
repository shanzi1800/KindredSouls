// ═══════════════════════════════════════════════════════════════════════
// 🛡️ V492 · 月报纠偏管道修复 —— 离线回归闸门（仓库外预置）
//
// 军师定裁（2026-10-02）：R1~R7 全量打包 V492，禁止单独抢跑 R1+R2。
// 本闸门 = R7「集成自动化测试闸门」的离线前置，窗口一关即 cp 入 <repo>/test/。
//
// 病根（V490b 闭环后 · 高纬盘审计 58 分定论）：
//   astro_matrix.py 算对的天体真值，到月报第1章「[🔮 本月命运主题]」被 LLM 写歪，
//   而 house_linter 因**正则缺陷（缺 \d）+ 星体缺项（缺天王/海王）+ 连接词过窄**
//   全线空转失守 —— 用户看到的第一个段落 7 项断言 6 项错。
//
// 【关键结构事实 · 决定修复落点】
//   house_linter 有两条分支：
//     ① 月锚点分支（text 含 `### YYYY年M月:`，≥5 段）→ RULES 仅 5 颗（木/土/冥/日/月）⇒ 年报月段用
//     ② 回退分支（无月锚点）                    → RULES2 8 颗（+水/金/火）  ⇒ **月报第1章走这支**
//   ⇒ 月报第1章的实际修复面 = 回退分支的 RULES2 / NAME_MAP2 / 2262 行正则。
//
// 纪律（继承 V488/V490/V491 教训）：
//   · 每条判据配「灵敏度自检」——用合成正/负例证明判据有区分力（非恒真/恒假）
//   · 行为断言优先（喂真实文本看输出），不写死行号（行号漂移 ⇒ 假红）
//   · 护栏判据（G 类）：现在就绿，职责是「防修复时误伤」，修复后若变红立即停止
// ═══════════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── 自适应定位仓库根（离线跑 / 入库后跑 皆可）─────────────────────────
function resolveRoot() {
  const cands = [
    path.resolve(__dirname, '..'),                        // 已 cp 进 <repo>/test/
    path.resolve(__dirname, '..', 'KindredSouls源代码'),  // 离线：闸门目录与仓库同级
    path.resolve(__dirname, '..', '..'),                  // 兜底
  ];
  for (const c of cands) if (fs.existsSync(path.join(c, 'server.js'))) return c;
  throw new Error('无法定位 server.js（候选: ' + cands.join(' | ') + '）');
}
const ROOT = resolveRoot();
const SRC = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');

// ── v69_client.js（D2 真值骨架 / D4 js 侧字段 的取证对象）─────────────
const V69_PATH = path.join(ROOT, 'v69_client.js');
const V69 = fs.existsSync(V69_PATH) ? fs.readFileSync(V69_PATH, 'utf8') : '';

// ── 自适应加载抽取器（基于 ROOT 绝对路径，避免相对 import 解析歧义）────
async function loadDecls() {
  const cands = [
    path.join(ROOT, 'test', 'tools', 'extract_decls.mjs'),                 // 离线：源码树内
    path.resolve(__dirname, 'tools', 'extract_decls.mjs'),                 // 入库后：<repo>/test/
  ];
  const tried = [];
  for (const c of cands) {
    try { return await import(pathToFileURL(c).href); } catch (e) { tried.push(c + ' → ' + e.message.split('\n')[0]); }
  }
  throw new Error('无法加载 extract_decls.mjs（closureDecls）\n' + tried.join('\n'));
}
const { closureDecls } = await loadDecls();

// ── 装载 house_linter（含其内联常量 getH / toCN / NAME_MAP*）─────────
function loadHouseLinter(source = SRC) {
  const { source: code } = closureDecls(source, ['house_linter'], []);
  if (!/function\s+house_linter/.test(code)) throw new Error('house_linter 抽取失败');
  const ctx = { console: { log() {}, warn() {}, error() {} }, __exports: {} };
  vm.createContext(ctx);
  vm.runInContext(code + '\n__exports.house_linter = house_linter;\n__exports.__code = ' +
    JSON.stringify(code) + ';', ctx);
  return ctx.__exports;
}
const HL = loadHouseLinter();
const CODE = HL.__code;

// ── 真值盘（Tromsø 1997-10-18 14:30 · 上升射手 · WholeSignFallback）
//    数值来自上轮独立复算 + 线上 matrix，逐项一致 ──────────────────────
const M = {
  meta: { rising_sign: 'Sagittarius', house_system: 'WholeSignFallback' },
  months: [{
    month_key: '2026-10',
    sun:     { sign: 'Libra',     house: 11 },
    moon:    { sign: 'Taurus',    house: 6  },
    mercury: { sign: 'Scorpio',   house: 12 },
    venus:   { sign: 'Scorpio',   house: 12 },
    mars:    { sign: 'Leo',       house: 9  },
    jupiter: { sign: 'Leo',       house: 9  },
    saturn:  { sign: 'Aries',     house: 5  },
    uranus:  { sign: 'Gemini',    house: 7  },
    neptune: { sign: 'Aries',     house: 5  },
    pluto:   { sign: 'Aquarius',  house: 3  },
  }],
};
const run = (t) => HL.house_linter(t, M);

// ═══════════════════════════════════════════════════════════════════════
// D1 / D2 / D4(js侧) —— 判据函数（供断言与灵敏度自检共用同一口径）
// ═══════════════════════════════════════════════════════════════════════

// D1 · 缓存版本站点扫描（server.js 生产键）
//   ⚠️ 实测：`wealth:v506` 在 server.js 有 **4 个站点**，形态各异 ——
//      ① 删除键（模式A，含 _ckTzDel tz 规范化）  ② 非流式月报  ③ 流式月报  ④ 年报 v2（-v2 前缀）
//   ⇒ 只改写入端不改删除端，「清理缓存」功能即失效；漏改任一站 ⇒ 该端点仍吃旧缓存。
function cacheSites(src) {
  const re = /`wealth:(v\d+)(-v2)?:/g;
  const out = []; let m;
  while ((m = re.exec(src))) out.push({ base: m[1], v2: !!m[2] });
  return out;
}
// 🛡️ 基线常量：每次输出链变更 bump 时**只改这一处**（旧写法把版本号散落在 6 处字面量里）
const LATEST_CACHE_VER = 'v532';
const D1_ALL_LATEST = (src) => {
  const s = cacheSites(src);
  // 🛡️ E16/R11g 基线前移: 月标题逐月真值锁六语解封（es/fr/th/vi 原「lang===en 才识别」⇒ 12 盘 54 处标题错项）+ th 行星/宫位词正字化 + house_linter 月锚点补全 es/fr 全 12 月名 = 输出链变更 ⇒ v513 全量作废
  return s.length >= 4 && s.every((x) => x.base === LATEST_CACHE_VER) && s.some((x) => x.v2);
};
const D1_SITES_INTACT = (src) => {
  const s = cacheSites(src);
  return s.length >= 4 && s.some((x) => x.v2);
};

// D2 · 真值骨架不得静默退 Cancer
//   buildMonthlyOverviewBlock / buildMonthlyFactTree 把「引擎真值」注入第1章 prompt；
//   若其内部 `rising_sign || 'Cancer'` 兜底，则真值锁**锁定的是一个兜底值** ⇒ LLM 写巨蟹上升反而"符合真值"。
function funcBody(src, name) {
  const i = src.indexOf('function ' + name + '(');
  if (i < 0) return '';
  const j = src.indexOf('{', i);
  if (j < 0) return '';
  let d = 0;
  for (let k = j; k < src.length; k++) {
    const c = src[k];
    if (c === '{') d++;
    else if (c === '}') { d--; if (d === 0) return src.slice(i, k + 1); }
  }
  return src.slice(i);
}
const NO_CANCER_FALLBACK = (body) => !/['"]Cancer['"]/.test(body);

// D4(js侧) · 只消费复数 peak_windows
const JS_PLURAL_ONLY = (src) => src.length > 0 && !/peak_window(?!s)/.test(src);

// ═══════════════════════════════════════════════════════════════════════
// ok 1 · 灵敏度自检（必须永远绿）—— 证明下列判据不是恒真/恒假探针
// ═══════════════════════════════════════════════════════════════════════
test('ok1 灵敏度自检：五条目标判据均具区分力', () => {
  const P = {
    // R1 阿拉伯数字被纠偏
    R1:   (t) => /第三宫/.test(t),
    // R2 天王星 / 海王星 被纠偏
    R2u:  (t) => /第七宫/.test(t),
    R2n:  (t) => /第五宫/.test(t),
    // R2b 越南语「太阳」词条不得含月亮词 (Mặt Trăng)
    R2b:  (s) => !/sun:\s*\[[^\]]*Mặt Trăng[^\]]*\]/.test(s),
    // R3 放宽连接词后被纠偏
    R3:   (t) => /第十二宫/.test(t),
  };
  const FIX = [
    ['R1',  P.R1,  '流年冥王星在水瓶座（第1宫）顺行', '流年冥王星在水瓶座（第三宫）顺行'],
    ['R2u', P.R2u, '流年天王星在双子座（第3宫）顺行', '流年天王星在双子座（第七宫）顺行'],
    ['R2n', P.R2n, '流年海王星在白羊座（第2宫）顺行', '流年海王星在白羊座（第五宫）顺行'],
    ['R2b', P.R2b, "sun: ['太阳','Sun','Sol','Soleil','ดาวอาทิตย์','Mặt Trăng'],",
                   "sun: ['太阳','Sun','Sol','Soleil','ดาวอาทิตย์','Mặt Trời'],"],
    ['R3',  P.R3,  '金星双双沉入天蝎座（第1宫）', '金星双双沉入天蝎座（第十二宫）'],
  ];
  const bad = [];
  for (const [id, fn, neg, pos] of FIX) {
    if (fn(neg) !== false) bad.push(`${id}: 负例未判红（判据恒真）`);
    if (fn(pos) !== true)  bad.push(`${id}: 正例未判绿（判据恒假）`);
  }
  assert.deepEqual(bad, [], '灵敏度自检失败 ⇒ 判据无区分力，其红/绿结论不可信\n' + bad.join('\n'));
});

// ═══════════════════════════════════════════════════════════════════════
// R1 · 阿拉伯数字「第N宫」必须被 house_linter 纠偏（军师钦定：100% 替换）
// ═══════════════════════════════════════════════════════════════════════
test('V492-R1a 阿拉伯数字宫位被纠偏（真值: 冥王水瓶=第3宫）', () => {
  const out = run('流年冥王星在水瓶座（第1宫）顺行。');
  assert.ok(/第三宫/.test(out), `「第1宫」未纠正 ⇒ R1 未生效。实得: ${out}`);
  assert.ok(!/第1宫/.test(out), `仍残留「第1宫」。实得: ${out}`);
});

test('V492-R1b 阿拉伯数字宫位被纠偏（真值: 土星白羊=第5宫）', () => {
  const out = run('流年土星在白羊座（第2宫）逆行。');
  assert.ok(/第五宫/.test(out), `「第2宫」未纠正 ⇒ R1 未生效。实得: ${out}`);
});

// 护栏：中文数字分支今天已可用，修复 \d 时**不得把中文数字弄坏**
test('G01(护栏) 中文数字分支必须保持可用（防 R1 改动误伤）', () => {
  const out = run('流年冥王星在水瓶座（第一宫）顺行。');
  assert.ok(/第三宫/.test(out), `中文数字分支被 R1 误伤！实得: ${out}`);
});

// 护栏：与真值一致的宫位**不得**被改动
test('G02(护栏) 与真值一致的宫位零改动', () => {
  const inp = '流年太阳在天秤座（第11宫），流年木星在狮子座（第9宫）。';
  assert.equal(run(inp), inp, '正确宫位被误改 ⇒ 修复引入了「误杀正常文本」回归');
});

// 护栏：幂等
test('G03(护栏) 幂等：对已纠正文本二次运行零改动', () => {
  const once = run('流年冥王星在水瓶座（第1宫）顺行。');
  assert.equal(run(once), once, '幂等失败（二次运行仍在改）');
});

// 护栏：无真值盘 → 原文透传（现值行为，不得改坏）
test('G04(护栏) astroMatrix 缺失时原文透传', () => {
  const inp = '流年冥王星在水瓶座（第1宫）顺行。';
  assert.equal(HL.house_linter(inp, null), inp, '无真值盘未透传');
});

// 护栏：不在 NAME_MAP 内的星体不得被改（防「宽正则」乱杀）
test('G05(护栏) 表外星体（凯龙星）不得被改动', () => {
  const inp = '流年凯龙星在白羊座（第1宫）。';
  assert.equal(run(inp), inp, '表外星体被误改 ⇒ 正则过宽');
});

// ═══════════════════════════════════════════════════════════════════════
// R2 · 补齐 天王星 / 海王星（月报第1章走 RULES2，两分支皆缺）
// ═══════════════════════════════════════════════════════════════════════
test('V492-R2a 天王星宫位被纠偏（真值: 天王双子=第7宫）', () => {
  const out = run('流年天王星在双子座（第3宫）顺行。');
  assert.ok(/第七宫/.test(out), `天王星未纳入纠偏 ⇒ R2 未生效。实得: ${out}`);
});

test('V492-R2b 海王星宫位被纠偏（真值: 海王白羊=第5宫）', () => {
  const out = run('流年海王星在白羊座（第2宫）顺行。');
  assert.ok(/第五宫/.test(out), `海王星未纳入纠偏 ⇒ R2 未生效。实得: ${out}`);
});

// ═══════════════════════════════════════════════════════════════════════
// R2b(新发现) · NAME_MAP2 的越南语「太阳」词条被污染成月亮
//   源码事实: NAME_MAP2.sun 含 'Mặt Trăng'（=月亮），会令太阳规则误匹配越南语月亮
// ═══════════════════════════════════════════════════════════════════════
test('V492-R2c 越南语「太阳」词条不得为月亮（Mặt Trăng）', () => {
  const sunLists = CODE.match(/sun:\s*\[[^\]]*\]/g) || [];
  assert.ok(sunLists.length >= 1, '未抽到 sun 词条列表（抽取器或源码结构变化）');
  const polluted = sunLists.filter((s) => /Mặt Trăng/.test(s));
  assert.deepEqual(polluted, [],
    '越南语 sun 词条被污染为月亮（Mặt Trăng 应为 Mặt Trời）：\n' + polluted.join('\n'));
});

// ═══════════════════════════════════════════════════════════════════════
// R3 · 放宽中文连接词（现要求行星名紧邻「在」，报告写法五花八门）
// ═══════════════════════════════════════════════════════════════════════
test('V492-R3a 非「在」连接词被纠偏（金星双双沉入…）', () => {
  const out = run('金星双双沉入天蝎座（第1宫），财务暗流涌动。');
  assert.ok(/第十二宫/.test(out), `连接词过窄 ⇒ R3 未生效。实得: ${out}`);
});

test('V492-R3b 非「在」连接词被纠偏（木星并肩燃烧于…）', () => {
  const out = run('木星并肩燃烧于狮子座（第3宫），扩张能量充沛。');
  assert.ok(/第九宫/.test(out), `连接词过窄 ⇒ R3 未生效。实得: ${out}`);
});

// 护栏：放宽连接词后，跨句不得误匹配
test('G06(护栏) 放宽连接词后不得跨句误匹配', () => {
  const inp = '木星在狮子座（第9宫）。土星在白羊座（第5宫）。';
  assert.equal(run(inp), inp, '跨句误匹配 ⇒ R3 正则过宽（[^第\\n] 窗口需守句界）');
});

// ═══════════════════════════════════════════════════════════════════════
// 结构不变量
// ═══════════════════════════════════════════════════════════════════════
test('G07(护栏) 两条分支的星体覆盖度不得比现状更窄', () => {
  const rules = CODE.match(/const RULES2?\s*=\s*\[[\s\S]*?\];/g) || [];
  assert.ok(rules.length >= 2, `应有 RULES / RULES2 两条分支，实得 ${rules.length}`);
  const count = (s) => (s.match(/\[\s*'[a-z]+'\s*,/g) || []).length;
  const [r1, r2] = rules.map(count).sort((a, b) => a - b);
  assert.ok(r1 >= 5, `5 颗基线分支被削（实得 ${r1}）—— 修复时误删旧星体`);
  assert.ok(r2 >= 8, `8 颗基线分支被削（实得 ${r2}）—— 修复时误删旧星体`);
});

test('G08(护栏) house_linter 的去重/映射辅助函数仍在（结构未被打穿）', () => {
  for (const sym of ['getH', 'toCN']) {
    assert.ok(new RegExp(sym + '\\s*=').test(CODE), `${sym} 丢失 ⇒ 结构被破坏`);
  }
});

// ═══════════════════════════════════════════════════════════════════════
// ok 2 · 灵敏度自检（D1 / D2 / D4-js 判据）—— 必须永远绿
// ═══════════════════════════════════════════════════════════════════════
test('ok2 灵敏度自检：D1/D2/D4-js 判据均具区分力', () => {
  const bad = [];
  // D1：4 站点全覆盖才绿；漏一站 / 少形态 即红
  const OK_SRC  = `\`wealth:${LATEST_CACHE_VER}:A\`;\`wealth:${LATEST_CACHE_VER}:B\`;\`wealth:${LATEST_CACHE_VER}:C\`;\`wealth:${LATEST_CACHE_VER}-v2:D\`;`;
  const MIX_SRC = '`wealth:v512:A`;' + OK_SRC.slice(OK_SRC.indexOf('`;') + 2);
  const NOV2    = `\`wealth:${LATEST_CACHE_VER}:A\`;\`wealth:${LATEST_CACHE_VER}:B\`;\`wealth:${LATEST_CACHE_VER}:C\`;\`wealth:${LATEST_CACHE_VER}:D\`;`;
  if (D1_ALL_LATEST(OK_SRC) !== true)   bad.push('D1: 正例未判绿');
  if (D1_ALL_LATEST(MIX_SRC) !== false) bad.push('D1: 漏改一站未判红（恒真）');
  if (D1_ALL_LATEST(NOV2) !== false)    bad.push('D1: -v2 形态缺失未判红');
  if (D1_SITES_INTACT(OK_SRC) !== true || D1_SITES_INTACT(MIX_SRC) !== true) bad.push('G14: 站点护栏误报');
  // D2：含 Cancer 兜底即红
  if (NO_CANCER_FALLBACK("const r = meta.rising_sign || 'Cancer';") !== false) bad.push('D2: 兜底未判红（恒真）');
  if (NO_CANCER_FALLBACK('const r = meta.rising_sign || "Aries";') !== true) bad.push('D2: 正例判红（恒假）');
  // D4-js：单数残留即红
  if (JS_PLURAL_ONLY('x = m.peak_windows || [];') !== true) bad.push('D4js: 正例判红');
  if (JS_PLURAL_ONLY('x = m.peak_window || [];') !== false) bad.push('D4js: 单数残留未判红');
  assert.deepEqual(bad, [], '灵敏度自检失败 ⇒ 判据无区分力，其红/绿结论不可信\n' + bad.join('\n'));
});

// ═══════════════════════════════════════════════════════════════════════
// D1 · 缓存版本 v522 → v523（E21/R11o 输出链变更：宫位语义标签契约锁 + CRITIC 判据14，4 站点全覆盖）
// ═══════════════════════════════════════════════════════════════════════
test('V492-D1 缓存版本 bump 至 v523（4 站点全覆盖；E21/R11o 基线前移）', () => {
  const s = cacheSites(SRC);
  const detail = s.map((x, i) => ` #${i + 1} ${x.base}${x.v2 ? '-v2' : ''}`).join('');
  assert.ok(s.length >= 4, `缓存键站点仅 ${s.length} 个（应有 4：删除键/非流式/流式/年报-v2）${detail}`);
  const stale = s.filter((x) => x.base !== LATEST_CACHE_VER);
  assert.deepEqual(stale.map((x) => x.base + (x.v2 ? '-v2' : '')), [],
    `仍有未 bump 的缓存键（⇒ 该端点继续吃旧缓存，用户可见收益打折）：${stale.map((x) => x.base).join(', ')}`);
  assert.ok(s.some((x) => x.v2), '年报 -v2 形态丢失 ⇒ 缓存键结构被改坏');
});

// 护栏：站点数与 -v2 形态不得因 bump 而减少
test('G14(护栏) 缓存键站点数 ≥ 4 且 -v2 形态保留', () => {
  assert.ok(D1_SITES_INTACT(SRC),
    '缓存键站点被删（<4 或 -v2 形态丢失）—— bump 时改漏/误删，会造成部分端点缓存失配');
});

// ═══════════════════════════════════════════════════════════════════════
// D2 · 第1章真值骨架（Prompt 软注入）不得静默退 Cancer
// ═══════════════════════════════════════════════════════════════════════
test('V492-D2 真值骨架不得静默退 Cancer', () => {
  assert.ok(V69, `未读到 v69_client.js（${V69_PATH}）`);
  for (const fn of ['buildMonthlyOverviewBlock', 'buildMonthlyFactTree']) {
    const body = funcBody(V69, fn);
    assert.ok(body.length > 300 && body.length < 20000 && body.includes('astroMatrix'),
      `${fn} 抽取失准（len=${body.length}）—— 判据结论不可信，需人工核`);
    assert.ok(NO_CANCER_FALLBACK(body),
      `${fn} 内仍含 'Cancer' 兜底 ⇒ 真值锁锁定的是**兜底值**：若 meta.rising_sign 缺失，`
      + `骨架会把"上升巨蟹"当真值注入 prompt，LLM 写巨蟹反而"符合真值"`);
  }
});

// 护栏：骨架必须仍以引擎真值注入流年行星宫位（防 D2 改动把注入打穿）
test('G16(护栏) 真值骨架仍注入流年行星宫位真值', () => {
  const body = funcBody(V69, 'buildMonthlyOverviewBlock');
  assert.ok(/\.house|_getH\(/.test(body), 'buildMonthlyOverviewBlock 不再注入宫位真值 ⇒ 软约束被削弱');
});

// ═══════════════════════════════════════════════════════════════════════
// D4 · js 侧字段对齐（引擎改复数后，两端口径必须一致）
// ═══════════════════════════════════════════════════════════════════════
test('G17(护栏) js 侧只消费复数 peak_windows（无单数读取）', () => {
  assert.ok(JS_PLURAL_ONLY(V69),
    'js 侧出现单数 peak_window 读取 ⇒ D4 统一后字段错配风险（引擎产复数 / js 读单数）');
});

// ── 汇总（便于人读）─────────────────────────────────────────────────
test('ZZ 汇总：本轮待修复清单（基线预期为红）', () => {
  const checks = [
    ['R1 阿拉伯数字', () => /第三宫/.test(run('流年冥王星在水瓶座（第1宫）顺行。'))],
    ['R2 天王星',     () => /第七宫/.test(run('流年天王星在双子座（第3宫）顺行。'))],
    ['R2 海王星',     () => /第五宫/.test(run('流年海王星在白羊座（第2宫）顺行。'))],
    ['R2c 越南语太阳', () => !(CODE.match(/sun:\s*\[[^\]]*\]/g) || []).some((s) => /Mặt Trăng/.test(s))],
    ['R3 连接词',     () => /第十二宫/.test(run('金星双双沉入天蝎座（第1宫）。'))],
    ['D1 缓存 v515→v516', () => D1_ALL_LATEST(SRC)],
    ['D2 骨架不锁兜底', () => ['buildMonthlyOverviewBlock', 'buildMonthlyFactTree']
                              .every((fn) => NO_CANCER_FALLBACK(funcBody(V69, fn)))],
  ];
  const todo = checks.filter(([, fn]) => !fn()).map(([n]) => n);
  console.log('  ↳ V492 待修复项: ' + (todo.length ? todo.join(' / ') : '（全部已修复 ✅）'));
  assert.ok(true);
});
