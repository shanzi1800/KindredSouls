#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// 🔴 E98（主公军令 2026-10-29）：四军令闸门
//   ① 流式终章平滑回顶——流式 done＋打字机揭示完毕后延迟 300ms smooth
//      scrollTo(0)（一次性触发；ref 防重；新报告复位）
//   ② 真实年龄差硬锁——1976-12-03 vs 1997-10-18 真差 21 岁（年报曾写成
//      douze ans＝地支 12 循环概念混淆幻觉）；数据锁注入 ageGap 确定性真值
//      ＋ Prompt 红线严禁自行估算
//   ③ 法语生肖字典纯化——军令钦定 Rat/Bœuf/Tigre/Lièvre/Dragon/Serpent/
//      Cheval/Chèvre/Singe/Coq/Chien/Cochon；关系词地道法语（choc/
//      six-harmonie/friction/trigone）；根治 l'Ox 英文渗漏（fr 原先走英文
//      fallback 的全局根因）；es/en 转译契约逐字节保全
//   ④ 法语塔罗正逆位规范——正位 (Droit)→(À l'endroit)（Tarot de
//      Marseille 体系），逆位 (Inversé)/(Inversée) 阴阳性分流（全链检测表同步）
// 判据口径：含**行为级**测试——VM 实跑 _E92CompatBaziLock ×
//   _e96LocalizeCompatBaziLock(bl,'fr')（军令用例男 1976-12-03 08:30 /
//   女 1997-10-18 22:00）＋ getOrientText fr 用例。
// ═══════════════════════════════════════════════════════════════
import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SERVER = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
const APP = fs.readFileSync(path.join(ROOT, 'web/src/App.tsx'), 'utf8');
const TAROT = fs.readFileSync(path.join(ROOT, 'web/src/lib/tarot.ts'), 'utf8');
const AUTHBTN = fs.readFileSync(path.join(ROOT, 'web/src/components/AuthButton.tsx'), 'utf8');
const ADV = fs.readFileSync(path.join(ROOT, 'api/ai-advisor.js'), 'utf8');
const ADV_WEB = fs.readFileSync(path.join(ROOT, 'web/api/ai-advisor.js'), 'utf8');
const I18N = fs.readFileSync(path.join(ROOT, 'web/src/lib/algos/i18n.ts'), 'utf8');
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

// VM 抽取（花括号配平，同 e92/e94/e96/e97 口径）
function fnBody(src, anchor) {
  const i = src.indexOf(anchor);
  if (i === -1) throw new Error(`fn anchor missing: ${anchor}`);
  let depth = 0, started = false;
  for (let j = src.indexOf('{', i); j < src.length; j++) {
    if (src[j] === '{') { depth++; started = true; }
    else if (src[j] === '}') { depth--; if (started && depth === 0) return src.slice(i, j + 1); }
  }
  throw new Error(`unbalanced fn: ${anchor}`);
}

/* ═══════════════════ ① 流式终章平滑回顶 ═══════════════════ */

test('E98-①-1 回顶三件套：ref 防重＋新报告复位＋终章 done 判据', () => {
  assert.ok(APP.includes('const compatReturnTopRef = useRef(false);'), '回顶防重 ref 缺失（默认未触发）');
  // 防重：触发前置 true（终章完成只回顶一次）
  assert.ok(APP.includes('compatReturnTopRef.current = true;'), '回顶防重置位缺失');
  // 复位：新报告起点（reportText 归 null）自动复位
  assert.ok(APP.includes('if (reportText === null) { compatReturnTopRef.current = false; return; }'), '新报告回顶复位缺失');
  // 终章 done 判据＝打字机揭示完毕且加载收口（流式 done / 直显 / 失败短文案三路通吃）
  assert.ok(APP.includes('const done = !reportTyping && !reportLoading;'), '终章 done 判据缺失');
});

test('E98-①-2 回顶执行体：300ms 延迟＋smooth scrollTo(0)＋依赖数组', () => {
  const i = APP.indexOf('const compatReturnTopRef');
  assert.ok(i > 0, '回顶 effect 块缺失');
  const seg = APP.slice(i, APP.indexOf('}, [reportText === null, reportTyping, reportLoading]);') + '}, [reportText === null, reportTyping, reportLoading]);'.length);
  assert.ok(seg.includes("compatScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });"), '平滑回顶 scrollTo 缺失');
  assert.ok(seg.includes('setTimeout('), '300ms 延迟缺失');
  assert.ok(seg.includes('}, 300);'), '回顶延迟须为 300ms（军令字面）');
  assert.ok(APP.includes('}, [reportText === null, reportTyping, reportLoading]);'), '回顶依赖数组缺失（须含 loading 收口信号）');
  // clearTimeout 卸载（防报告切换竞态）
  assert.ok(seg.includes('clearTimeout(id)'), '定时器清理缺失');
});

/* ═══════════════════ ② 真实年龄差硬锁 ═══════════════════ */

test('E98-②-1 行为级：年龄差确定性真值 21 年（军令用例 1976-12-03 × 1997-10-18）', () => {
  const _E92CompatBaziLock = new Function(`${fnBody(SERVER, 'function _E92CompatBaziLock')}\nreturn _E92CompatBaziLock;`)();
  const bl = _E92CompatBaziLock('1976-12-03', '1997-10-18', '08:30', '22:00');
  assert.ok(bl, '八字锁须解析成功');
  assert.ok(bl.lock.includes('真实年龄差：A 与 B 出生年份相差21年'), `年龄差真值行缺失（lock 节选：${bl.lock.split('\n')[3] ?? ''}）`);
  // 双向对称（abs 口径）
  const bl2 = _E92CompatBaziLock('1997-10-18', '1976-12-03', '22:00', '08:30');
  assert.ok(bl2.lock.includes('相差21年'), '年龄差须绝对值口径（d1/d2 交换同值）');
  // 红线双语（中英双封口）
  assert.ok(bl.guard.includes('年龄差绝对红线'), '年龄差红线中文段缺失');
  assert.ok(bl.guard.includes('AGE-GAP ABSOLUTE RED LINE'), '年龄差红线英文段缺失');
  assert.ok(bl.guard.includes('12-branch zodiac cycle is NOT a basis for age math'), '地支 12 循环≠年龄差的病根封口缺失');
});

test('E98-②-2 源级：_E92CompatBaziLock 签名零改动＋年龄差函数体内计算（VM 抽取式消费者铁律）', () => {
  assert.ok(SERVER.includes('function _E92CompatBaziLock(d1, d2, tA, tB) {'), '函数签名不可改（e92/e96 闸门守卫）');
  assert.ok(SERVER.includes('const _e98AgeGap = Math.abs(a1.y - a2.y);'), '年龄差计算缺失（须函数体内）');
  assert.ok(SERVER.includes('`真实年龄差：A 与 B 出生年份相差${_e98AgeGap}年'), 'lock 模板行缺失');
});

/* ═══════════════════ ③ 法语生肖字典纯化 ═══════════════════ */

test('E98-③-1 行为级：fr 锁零汉字·零 Ox·军令钦定生肖表·21 ans·trigone（军令用例）', () => {
  const _E92CompatBaziLock = new Function(`${fnBody(SERVER, 'function _E92CompatBaziLock')}\nreturn _E92CompatBaziLock;`)();
  const _e96LocalizeCompatBaziLock = new Function(`${fnBody(SERVER, 'function _e96LocalizeCompatBaziLock')}\nreturn _e96LocalizeCompatBaziLock;`)();
  const bl = _E92CompatBaziLock('1976-12-03', '1997-10-18', '08:30', '22:00');
  const fr = JSON.parse(JSON.stringify(bl));
  _e96LocalizeCompatBaziLock(fr, 'fr');
  // 零 CJK（E96 语言纯粹性契约在 fr 路径同样成立）
  assert.ok(!/[\u4e00-\u9fff]/.test(fr.lock), 'fr 锁须零汉字');
  // 根治病灶：英文 Ox 渗漏（军令审核实锤 l'Ox）
  assert.ok(!/\bOx\b/.test(fr.lock), 'fr 锁须零英文 Ox（军令钦定 Bœuf）');
  // 军令钦定生肖词（抽验 6 词）
  for (const w of ['Bœuf', 'Chien', 'Cochon', 'Serpent', 'Dragon', 'Lièvre']) {
    assert.ok(fr.lock.includes(w), `fr 生肖词缺失：${w}`);
  }
  // 军令样例：la friction Bœuf-Chien（丑戌相刑）＋ Dragon-Chien choc（辰戌相冲）
  assert.ok(fr.lock.includes('Bœuf-Chien friction'), 'Bœuf-Chien friction 军令样例缺失');
  assert.ok(fr.lock.includes('Dragon-Chien choc'), 'Dragon-Chien choc 缺失');
  // 法语三合局术语 trigone（非英文 trine）
  assert.ok(fr.lock.includes('demi-combinaison du trigone de'), 'fr 三合局术语须 trigone');
  assert.ok(fr.lock.includes('trigone de Métal'), 'fr Métal 三合局缺失');
  assert.ok(!/\btrine\b/.test(fr.lock), 'fr 锁不得残留英文 trine');
  // 年龄差法语真值（刀②在 fr 路径的转译）
  assert.ok(fr.lock.includes('21 ans séparent A et B'), 'fr 年龄差真值行缺失');
  // guard 法语纯语铁律
  assert.ok(fr.guard.includes('PURETÉ LINGUISTIQUE'), 'fr guard 纯语铁律缺失');
});

test('E98-③-2 行为级：fr 幂等＋柱位零粘连（es 同族观感规整）', () => {
  const _E92CompatBaziLock = new Function(`${fnBody(SERVER, 'function _E92CompatBaziLock')}\nreturn _E92CompatBaziLock;`)();
  const _e96LocalizeCompatBaziLock = new Function(`${fnBody(SERVER, 'function _e96LocalizeCompatBaziLock')}\nreturn _e96LocalizeCompatBaziLock;`)();
  const bl = _E92CompatBaziLock('1976-12-03', '1997-10-18', '08:30', '22:00');
  const fr = JSON.parse(JSON.stringify(bl));
  _e96LocalizeCompatBaziLock(fr, 'fr');
  const once = fr.lock;
  _e96LocalizeCompatBaziLock(fr, 'fr');
  assert.strictEqual(fr.lock, once, 'fr 转译须幂等（_e96Localized 标记）');
  // 柱位粘连（Apilier 形）零容忍
  assert.ok(!/([AB])pilier/.test(fr.lock), 'fr 柱位粘连（A/B-柱位）残留');
  assert.ok(!/(année|mois|jour|heure)[A-Z][a-z]/.test(fr.lock), 'fr 柱位粘连（词尾大写）残留');
});

test('E98-③-3 行为级：es/en 转译契约保全（E96/E97 零回归）', () => {
  const _E92CompatBaziLock = new Function(`${fnBody(SERVER, 'function _E92CompatBaziLock')}\nreturn _E92CompatBaziLock;`)();
  const _e96LocalizeCompatBaziLock = new Function(`${fnBody(SERVER, 'function _e96LocalizeCompatBaziLock')}\nreturn _e96LocalizeCompatBaziLock;`)();
  const bl = _E92CompatBaziLock('1976-12-03', '1997-10-18', '08:30', '22:00');
  // es：E97 纯西语契约（Buey/Perro + 年龄差 es 行）
  const es = JSON.parse(JSON.stringify(bl));
  _e96LocalizeCompatBaziLock(es, 'es');
  assert.ok(es.lock.includes('Buey-Perro fricción'), 'es E97 契约（Buey-Perro fricción）回归');
  assert.ok(es.lock.includes('21 años separan a A y B'), 'es 年龄差转译缺失');
  assert.ok(!/[\u4e00-\u9fff]/.test(es.lock), 'es 锁须零汉字（E97 契约）');
  // en：E96 英文转译契约（Ox 拼音括号风格＋True age gap）
  const en = JSON.parse(JSON.stringify(bl));
  _e96LocalizeCompatBaziLock(en, undefined);
  assert.ok(/\bOx\b/.test(en.lock), 'en 契约须保留 Ox（E96 英文口径零触碰）');
  assert.ok(en.lock.includes('True age gap: A and B were born 21 years apart'), 'en 年龄差转译缺失');
  assert.ok(en.lock.includes('half-combination of the Metal trine'), 'en E96 契约（trine 表达）回归');
});

test('E98-③-4 源级：军令钦定法语十二生肖表全 12 词＋三语分流结构', () => {
  // 军令钦定：Rat/Bœuf/Tigre/Lièvre/Dragon/Serpent/Cheval/Chèvre/Singe/Coq/Chien/Cochon
  const iFr = SERVER.indexOf("_e98Fr");
  assert.ok(iFr > 0, 'fr 分支标记缺失');
  const FR_AN = SERVER.slice(SERVER.indexOf('? { \'子\': \'Rat\', \'丑\': \'Bœuf\''), SERVER.indexOf('const ST ='));
  for (const w of ['Rat', 'Bœuf', 'Tigre', 'Lièvre', 'Dragon', 'Serpent', 'Cheval', 'Chèvre', 'Singe', 'Coq', 'Chien', 'Cochon']) {
    assert.ok(FR_AN.includes(`'${w}'`), `法语生肖表缺词：${w}`);
  }
  // 三语分流（_e97Es 布尔契约保全＋_e98Fr 新增）
  assert.ok(SERVER.includes("const _e98Lang = String(lang || '');"), '三语分流基准缺失');
  assert.ok(SERVER.includes("const _e98Fr = _e98Lang === 'fr';"), 'fr 分流标记缺失');
  // fr 结构短语块
  assert.ok(SERVER.includes("} else if (_e98Fr) {"), 'fr 结构短语分支缺失');
});

test('E98-③-5 行为级：月报塔罗引线六语单句（fr 实弹中文渗漏根治）', async () => {
  // 病根（E98 实弹探针实锤）：第 10 条旧版「zh 句 / en 句」双拼参考，fr/es/th/vi
  // 无母语参考句 ⇒ 模型整句复读中文「当月这枚【…】…」渗入法语月报正文。
  // 治法＝六语各给唯一参考句（_e98Thread 表）；zh/en 原句逐字节保全。
  const i0 = SERVER.indexOf('const _E89_MONTHLY_LANG_LOCK');
  const monthlyTables = SERVER.slice(i0, SERVER.indexOf('\n\n// ═══', i0));
  function fnB(anchor) {
    const i = SERVER.indexOf(anchor);
    let depth = 0, started = false;
    for (let j = SERVER.indexOf('{', i); j < SERVER.length; j++) {
      if (SERVER[j] === '{') { depth++; started = true; }
      else if (SERVER[j] === '}') { depth--; if (started && depth === 0) return SERVER.slice(i, j + 1); }
    }
    throw new Error(`unbalanced fn: ${anchor}`);
  }
  const { computeCompatScores, buildCompatTimeContext, renderSynastryBlock } = await import(path.join(ROOT, 'api/ai-advisor.js'));
  const build = new Function('computeCompatScores', 'buildCompatTimeContext', 'renderSynastryBlock',
    `${monthlyTables}\n${fnB('function buildCompatMonthlyFourModulePrompt(')}\nreturn buildCompatMonthlyFourModulePrompt;`)(computeCompatScores, buildCompatTimeContext, renderSynastryBlock);
  const cases = [
    { lang: 'zh', needle: '当月这枚【La Lune】的微观指引' },
    { lang: 'en', needle: 'The micro-guidance of La Lune' },
    { lang: 'es', needle: 'La micro-guía de La Lune' },
    { lang: 'fr', needle: 'La micro-guidance de La Lune' },
    { lang: 'th', needle: 'คำแนะนำจิตวิญญาณ' },
    { lang: 'vi', needle: 'Hướng dẫn vi mô' },
  ];
  for (const c of cases) {
    const p = build('1976-12-03', '1997-10-18', c.lang, {
      bazi: { a: 6, b: 4 }, zodiac: { a: 5, b: 5 }, iching: { a: 7, b: 3 },
      tarot: { name: 'La Lune', orientation: ' (Inversée)' },
      zodiacMeta: ['Sagittaire', 'Balance'], baziLock: null, userBirthDate: '1976-12-03',
    });
    assert.ok(p.system.includes(c.needle), `${c.lang} 塔罗引线母语句缺失`);
  }
  // 非 zh 时不再出现双拼中文参考句（病根封口）
  const frP = build('1976-12-03', '1997-10-18', 'fr', {
    bazi: { a: 6, b: 4 }, zodiac: { a: 5, b: 5 }, iching: { a: 7, b: 3 },
    tarot: { name: 'La Lune', orientation: ' (Inversée)' },
    zodiacMeta: ['Sagittaire', 'Balance'], baziLock: null, userBirthDate: '1976-12-03',
  });
  assert.ok(!frP.system.includes('当月这枚'), 'fr system 不得残留中文参考句（双拼病根）');
});

/* ═══════════════════ ④ 法语塔罗正逆位规范 ═══════════════════ */

test('E98-④-1 源级：tarot.ts fr 后缀（À l\'endroit 正位＋Inversé/Inversée 阴阳性分流）', () => {
  assert.ok(TAROT.includes("const frIsFeminine = (name: string) => /^(La\\s)/i.test(String(name || ''));"), 'fr 阴性大牌判别式缺失');
  assert.ok(TAROT.includes("fr: (r, name) => r ? (frIsFeminine(name || '') ? ' (Inversée)' : ' (Inversé)') : \" (À l'endroit)\","), 'fr 朝向后缀阴阳性分流缺失');
  // 双装配点牌名透传（E97 契约同时适用 fr 后缀）
  assert.equal((TAROT.match(/orientation: \(ORIENT_SUFFIX\[L\] \|\| ORIENT_SUFFIX\['en'\]\)\(reversed, card\.name\[L\] \|\| card\.name\.en\)/g) || []).length, 2, '双装配点牌名透传缺失（须恰 2 处）');
});

test('E98-④-2 行为级：getOrientText fr 阴阳性分流（真源 server 侧消费口径＝字符串牌名）', () => {
  const ORIENT_MAP_SEG = ADV.slice(ADV.indexOf('const ORIENT_MAP'), ADV.indexOf('function getOrientText'));
  const getOrientText = new Function(`${ORIENT_MAP_SEG}${fnBody(ADV, 'function getOrientText')}\nreturn getOrientText;`)();
  // 阴性大牌（La …）逆位 → Inversée；阳性（Le …）→ Inversé；正位 → À l'endroit
  assert.equal(getOrientText({ name: 'La Lune', orientation: ' (Inversée)' }, 'fr'), 'Inversée', 'La Lune 逆位须阴性 Inversée');
  assert.equal(getOrientText({ name: 'Le Soleil', orientation: ' (Inversé)' }, 'fr'), 'Inversé', 'Le Soleil 逆位须阳性 Inversé');
  assert.equal(getOrientText({ name: 'La Lune', orientation: " (À l'endroit)" }, 'fr'), "À l'endroit", '正位须 À l\'endroit');
  // 旧存量兼容：正位旧词 (Droit) 仍识别为正位（缓存报告重放）
  assert.equal(getOrientText({ name: 'La Lune', orientation: ' (Droit)' }, 'fr'), "À l'endroit", '旧存量 (Droit) 须仍判正位');
  // 检测表补 Inversée（漏检即正逆位锁整体失效）
  assert.ok(ADV.includes("['Ngược','Reversed','กลับด้าน','Inversé','Inversée','Invertido','Invertida','逆位']"), 'getOrientText 检测表未补 Inversée');
});

test('E98-④-3 全链：server 塔罗锁 fr 行＋isUpright 检测表＋i18n ORIENTATION_LABELS＋迷你塔罗', () => {
  // server.js 塔罗正逆位强制锁 fr 行（Tarot de Marseille 体系新词形）
  assert.ok(SERVER.includes("[VERROU] La carte est inversée. DÉFENDU: upright, à l'endroit."), 'fr 逆位锁行未升新词形');
  assert.ok(SERVER.includes("[VERROU] La carte est à l'endroit. DÉFENDU: reversed, inversé."), 'fr 正位锁行未升新词形');
  // isUpright 检测表补 "À l'endroit"（正位词迁移，漏检即正位锁失效）
  assert.ok(SERVER.includes("tarotOrient.includes(\"À l'endroit\")"), 'server isUpright 检测表未补 À l\'endroit');
  // isReversed 检测表补 'Inversée'（阴性形态明确封口）
  assert.ok(SERVER.includes("tarotOrient.includes('Inversée')"), 'server isReversed 检测表未补 Inversée');
  // i18n 朝向标签（统一定义口径）
  assert.ok(I18N.includes("fr: { upright: \"À l'endroit\", reversed: 'Inversé' }"), 'i18n ORIENTATION_LABELS fr 未统一定义');
  // AuthButton 迷你塔罗 fr 阴阳性后缀
  assert.ok(AUTHBTN.includes("fr: reversed ? (frFem ? ' (Inversée)' : ' (Inversé)') : ''"), '迷你塔罗 fr 阴阳性后缀缺失');
  // fr 规则行：正逆位锁新词形封口
  assert.ok(ADV.includes('Si Orientation = "À l\'endroit": INTERDIT'), 'fr 正位锁规则行未升新词形');
});

test('E98-④-4 镜像同步：api/ai-advisor.js ≡ web/api/ai-advisor.js（e40 军规）', () => {
  assert.strictEqual(ADV, ADV_WEB, '镜像漂移（web/api 未同步）');
});

/* ═══════════════════ ⑤ 闸门接线 ═══════════════════ */

test('E98-⑤-0 存量作废：COMPAT_PERSIST_VERSION v2（E98 修复触达旧报告）', () => {
  const PIPE = fs.readFileSync(path.join(ROOT, 'lib/reportPipeline.mjs'), 'utf8');
  assert.ok(PIPE.includes("export const COMPAT_PERSIST_VERSION = 'compat_report.v2';"), '持久化版本须升 v2（E98-⑤ 一次性作废旧存量；旧报告缺年龄差真值行）');
});

test('E98-⑤-1 闸门接线：test:astro 含本闸门（74 段）＋入编位（e97 后、e40 前、python 链尾）', () => {
  const chain = PKG.scripts['test:astro'] || '';
  assert.ok(chain.includes('audit-e98-fr-agetap-orient.test.mjs'), '本闸门未接线 test:astro');
  const parts = chain.split('&&').map((s) => s.trim());
  assert.equal(parts.length, 75, `链段数异常（实得 ${parts.length}，基线 75（E99 升 75 段））`);
  const iE98 = parts.findIndex((p) => p.includes('audit-e98-'));
  const iE97 = parts.findIndex((p) => p.includes('audit-e97-'));
  const iE40 = parts.findIndex((p) => p.includes('audit-e40-compat-synastry-tensor-fusion'));
  const iPy = parts.findIndex((p) => p.includes('python3'));
  assert.ok(iE97 !== -1 && iE98 > iE97, 'E98 须在 E97 之后');
  assert.ok(iE40 !== -1 && iE40 > iE98, 'E98 须在 e40-compat 之前（e40 恒 len-2）');
  assert.ok(iPy === parts.length - 1, 'python 段须恒为链尾');
});
