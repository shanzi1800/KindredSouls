// ═══════════════════════════════════════════════════════════════════════
// 🛡️ E11/R10: CRITIC 判据精准化与多语言适配 —— 回归闸门
// 事故背景（2026-10-03 E10/R9 上线验收中当场揪出）:
//   ① 判据 1 `报头缺少射手座` —— 入参 natalSunSign 恒为**中文**（端点 `const natalSunSign = sunSign`
//      取自 buildWealthMetaFull 的纯中文 signs 数组，与 lang 无关），却拿去 includes 英文报头
//      （"Sagittarius"）⇒ **英文报告恒误报**；
//   ② 判据 9 `双子座被错误归入土元素` —— `badElement = text.split('\n').filter(...)` 返回
//      **空数组**，而 `if (badElement)` 对空数组恒 truthy（JS 铁律）⇒ **任何语言任何报告必然误报**。
//   后果: 每条非中文年报白跑一次静默重试（63s→134s、Token ×2），终局永远 force、normal 永不触达。
// 治本（军师裁决 R10a/R10b）:
//   R10a 空数组坑改 `.length > 0` + 英文等价键；判据 1 引入 i18n 星座映射（任意语言→目标语言）；
//        判据 4/5 补英文分支、6~8 显式 gate 到 zh（杜绝「看着在检、实则永假」的假防线）。
//   R10b bump v510 + 本闸门（合规英文报告必须 0 告警）。
// 本测试: 源码级结构断言 + vm 抽取行为验证（零 python）+ 【注入缺陷自测】。
// ═══════════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
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
test('① R10a: 星座 i18n 归一助手存在且惰性构造（规避 SUN_SIGN_* 的 TDZ）', () => {
  assert.ok(/function\s+_e11SignIndex\s*\(/.test(src), '缺少 _e11SignIndex');
  assert.ok(/function\s+_e11SignLocal\s*\(/.test(src), '缺少 _e11SignLocal');
  const fn = stripComments(fnBody('_e11SignIndex'));
  // 惰性：必须"用前判空 → 建表"，不得模块顶层直接引 SUN_SIGN_*（其声明在 :7231，本函数在 :6705）
  assert.ok(/_E11_SIGN_IDX_CACHE\s*=\s*new Map\(\)/.test(fn), '缺少惰性建表（顶层直接引 SUN_SIGN_* 会启动即崩）');
  assert.ok(/!\s*_E11_SIGN_IDX_CACHE/.test(fn), '缺少惰性判空守卫');
  for (const t of ['SUN_SIGN_EN', 'SUN_SIGN_ZH', 'SUN_SIGN_TH', 'SUN_SIGN_VI', 'SUN_SIGN_ES', 'SUN_SIGN_FR']) {
    assert.ok(new RegExp(t).test(fn), `i18n 归一表缺 ${t}`);
  }
  const loc = stripComments(fnBody('_e11SignLocal'));
  assert.ok(/_e11SignIndex\(name\)/.test(loc), '_e11SignLocal 未复用索引归一');
  assert.ok(/T\[lang\]\s*\|\|\s*SUN_SIGN_EN/.test(loc), '_e11SignLocal 缺语言回落');
});

test('② R10a: 判据 1 走 i18n 适配（不得再裸比中文字面量）', () => {
  const cc = stripComments(fnBody('wealthCriticCheck'));
  // 🛡️ E12/R11c 基线前移: 签名补第 5 形参 astroMatrix（判据 12 需 SwissEph 真值盘）；lang 仍是必传形参
  assert.ok(/function\s+wealthCriticCheck\(text,\s*birthDate,\s*natalSunSign,\s*lang(\s*,\s*astroMatrix)?\s*\)/.test(src),
    'wealthCriticCheck 签名缺 lang 形参');
  assert.ok(/_e11SignLocal\(natalSunSign,\s*lang/.test(cc), '判据 1 未做语言归一（英文报告将恒误报）');
  assert.ok(/header\.includes\(_sunLocal\)/.test(cc), '判据 1 未用归一后的目标语言名比对');
  assert.ok(!/if\s*\(\s*!header\.includes\(natalSunSign\)\s*\)/.test(cc), '判据 1 仍是裸中文比对（旧病未除）');
});

test('③ R10a: 判据 9 空数组真值坑已修 + 英文等价键已补', () => {
  const cc = stripComments(fnBody('wealthCriticCheck'));
  assert.ok(/badElement\.length\s*>\s*0/.test(cc), '判据 9 未改 length>0（空数组恒 truthy 的病根仍在）');
  assert.ok(!/if\s*\(\s*badElement\s*\)/.test(cc), '判据 9 残留裸 if(badElement)（空数组坑）');
  assert.ok(/earth element/i.test(cc), '判据 9 缺英文等价键 earth element');
  assert.ok(/gemini/i.test(cc), '判据 9 缺 Gemini 英文识别');
});

test('④ R10a: 判据 4/5 语言分支 + 6~8 显式 gate 到 zh', () => {
  const cc = stripComments(fnBody('wealthCriticCheck'));
  assert.ok(/lang\s*===\s*'en'/.test(cc), '判据 4/5 缺英文分支');
  assert.ok(/June\\s\+20\\d\\d/.test(cc) || /June/.test(cc), '判据 4 缺英文 6 月标题判据');
  assert.ok(/lang\s*===\s*'zh'/.test(cc), '判据 6~8 缺 zh 门控（对非中文报告恒空转=假防线）');
  // 幽灵相位/玄秘宫必须落在 zh 门控内
  const zhGate = cc.indexOf("lang === 'zh'");
  assert.ok(zhGate > 0 && cc.indexOf('玄秘宫') > zhGate, '玄秘宫判据未落在 zh 门控内');
  assert.ok(cc.indexOf('幽灵相位') > zhGate, '幽灵相位判据未落在 zh 门控内');
});

test('⑤ R10a: 端点调用点必须传 lang（不传则判据 1 回落 zh，英文仍误报）', () => {
  // 🛡️ E12/R11c 基线前移: 调用点再补 astroMatrix（判据 12 依赖真值盘）
  assert.ok(/wealthCriticCheck\(txt,\s*birthDate,\s*natalSunSign,\s*lang\s*,\s*astroMatrix\)/.test(src),
    '调用点未传 lang/astroMatrix ⇒ 语言适配与真值错配判据形同虚设');
});

test('⑥ R10b: 缓存 bump v515（server.js 四站点 + purge 补 v514 双形态 + 基线前移）', () => {
  const sites = [...src.matchAll(/wealth:v529/g)].length;
  assert.ok(sites >= 4, `server.js v523 站点不足 4: ${sites}`);
  assert.ok(!src.includes('wealth:v520'), 'server.js 残留 v520（漏改一站）');
  assert.ok(/wealth:v520:\*/.test(purgeSrc) && /wealth:v520-v2:\*/.test(purgeSrc), 'purge 脚本未补 v520 双形态');
  const yearly = fs.readFileSync(path.join(__dirname, 'audit-yearly-stream.test.js'), 'utf-8');
  assert.ok(/MIN_CACHE_VER = 529/.test(yearly), 'yearly 流式闸门基线未前移至 v523');
  const d1 = fs.readFileSync(path.join(__dirname, 'audit-v492-monthly-house-linter.test.mjs'), 'utf-8');
  assert.ok(/V515|v515/.test(d1), 'V492 闸门 D1 基线未前移 v515');
});

// ═══════════════ 行为级: vm 抽取（零 python） ═══════════════
const SEEDS = ['wealthCriticCheck', '_e11SignIndex', '_e11SignLocal', '_E11_SIGN_IDX_CACHE',
  'SUN_SIGN_EN', 'SUN_SIGN_ZH', 'SUN_SIGN_TH', 'SUN_SIGN_VI', 'SUN_SIGN_ES', 'SUN_SIGN_FR'];

const { map } = closureDecls(src, SEEDS, ['getSignToHouseMap', 'SIGN_ORDER_ZH']);
const dropped = [];
for (const n of [...map.keys()]) { try { new vm.Script(map.get(n)); } catch (e) { dropped.push(`${n}(${e.message.slice(0, 40)})`); map.delete(n); } }
assert.strictEqual(dropped.length, 0, `VM 抽取的声明有语法不完整项: ${dropped.join(', ')}`);
for (const n of SEEDS) assert.ok(map.has(n), `VM 未能抽取 ${n}`);

function buildWith(hack) {
  const ctx = { console, setTimeout, clearTimeout, setInterval, clearInterval, Buffer, process, __exports: {} };
  vm.createContext(ctx);
  const bodySrc = [...map.entries()].sort((a, b) => src.indexOf(a[1]) - src.indexOf(b[1]))
    .map((e) => (hack && hack[e[0]] ? hack[e[0]] : e[1])).join('\n\n');
  vm.runInContext(bodySrc + '\n' + SEEDS.map((n) => `__exports[${JSON.stringify(n)}] = typeof ${n} !== 'undefined' ? ${n} : undefined;`).join('\n'), ctx);
  return ctx.__exports;
}
const F = buildWith(null);

// ── 合规英文年报样本（线上 v509 产物同构；>500 字符，报头 2000 字内含 Sagittarius）──
const EN_OK = [
  '### WEALTH ORACLE · FINANCIAL REVELATION',
  '',
  '**🌌 Annual Solar Chart: Sagittarius · Solar Return**',
  '**🗝️ Core Natal Code: natal Sun Sagittarius · natal Moon Leo · Rising Capricorn**',
  '**📅 Birth Date: 1992-12-15**',
  '**⏳ Prediction Period: July 2026 – June 2027**',
  '',
  '---',
  '',
  '### 2026-2027 Annual Wealth Core Metrics Dashboard',
  '',
  '🚀 **Annual Macro Theme:** The Alchemist\'s Ascent — Turning Structural Pressure into Sovereign Gold',
  '🌟 **Wealth Explosion Index:** ★★★★☆',
  '⚠️ **Asset Meltdown Risk:** ★★★☆☆',
  '🔮 **Destiny Manifestation Direction:** From the 7th House of Partnership toward the 1st House of Self-Sovereignty.',
  '',
  '---',
  '',
  '### Chapter I: Annual Wealth Matrix',
  '',
  'O child of Sagittarius, born December 15, 1992, with the Sun blazing in the 12th House of your natal chart.',
  '',
  '### Chapter II: 365-Day Monthly Revenue Matrix',
  '',
  '### June 2027: Sun in Gemini · 6th House · The Daily Discipline',
  'The Sun\'s entry into Gemini on May 21st activates your 6th House of Daily Work, health, and service.',
  '',
  '### July 2026: Sun in Cancer · 7th House · The Partnership Crucible',
  'The Sun enters Cancer this month, illuminating your 7th House of partnership and open enemies.',
  '',
  '### August 2026: Sun in Leo · 8th House · The Alchemy of Shared Resources',
  'Your 8th House is activated by the Leo Sun.',
  '',
  '### FINAL WEALTH ORACLE · The Password to Mastery',
  '',
  '*✨ This oracle is woven by the stars, interpreted by the soul. ✨*',
].join('\n');

// ── 合规中文年报样本 ──
const ZH_OK = [
  '### 财富神谕 · 财务启示',
  '',
  '**🌌 年度星盘: 射手座 · 太阳返照**',
  '**🗝️ 核心本命代码: 太阳射手座 · 月亮狮子座 · 上升摩羯座**',
  '',
  '### 第一章: 年度财富矩阵',
  '作为射手座之人，你的太阳落在第12宫，月亮在狮子座第8宫。' + '补足长度'.repeat(120),
  '',
  '### 2026年6月: 太阳进入双子座第6宫',
  '本月太阳进入双子座，激活你的第6宫日常事务。',
  '',
  '### 2026年7月: 太阳在巨蟹座第7宫',
  '本月太阳在巨蟹座，照亮你的第7宫伙伴关系。',
].join('\n');

test('⑦ 行为级: 合规英文报告必须 0 告警（线上误报根治的硬指标）', () => {
  const issues = F.wealthCriticCheck(EN_OK, '1992-12-15', '射手座', 'en');
  // ⚠️ 必须用 length 比较：vm 上下文返回的数组与主 realm 原型不同，deepStrictEqual([]) 恒失败（假红）
  assert.strictEqual(issues.length, 0, '合规英文报告仍被误报: ' + JSON.stringify(issues));
});

test('⑧ 行为级: 合规中文报告必须 0 告警（回归）', () => {
  const issues = F.wealthCriticCheck(ZH_OK, '1992-12-15', '射手座', 'zh');
  assert.strictEqual(issues.length, 0, '合规中文报告被误报: ' + JSON.stringify(issues));
});

test('⑨ 行为级: 判据 1 真缺陷必抓（英文报头缺射手座 → 必须报）', () => {
  const bad = EN_OK.replace(/Sagittarius/g, 'Virgo');   // 报头与前 2000 字均无 Sagittarius
  const issues = F.wealthCriticCheck(bad, '1992-12-15', '射手座', 'en');
  assert.ok(issues.some((s) => /报头缺少/.test(s)), '英文报头缺本命太阳星座却漏检: ' + JSON.stringify(issues));
  assert.ok(issues.some((s) => /Sagittarius/.test(s)), '告警文案应输出目标语言名（Sagittarius）而非中文');
});

test('⑩ 行为级: 判据 9 真缺陷必抓（英文 earth element + Gemini 同行 → 必须报）', () => {
  const bad = EN_OK + '\nGemini is an earth element sign in this system.\n';
  const issues = F.wealthCriticCheck(bad, '1992-12-15', '射手座', 'en');
  assert.ok(issues.some((s) => /土元素/.test(s)), '英文元素错漏检: ' + JSON.stringify(issues));
});

test('⑪ 行为级: 判据 9 空数组坑 —— 无元素错文本不得报（回归线上必然误报）', () => {
  const issues = F.wealthCriticCheck(EN_OK, '1992-12-15', '射手座', 'en');
  assert.ok(!issues.some((s) => /土元素/.test(s)), '空数组坑复发: 无元素错却被报');
});

test('⑫ 行为级: i18n 多语言适配（th/vi/es/fr 报头按目标语言比对）', () => {
  const TH_OK = '### คำพยากรณ์\n\n**ราศีขึ้นธนู · ดวงอาทิตย์ ธนู**\n' + 'เติมความยาว'.repeat(200) + '\n### มิถุนาย: ดวงอาทิตย์ เมถุน';
  assert.strictEqual(F.wealthCriticCheck(TH_OK, '1992-12-15', '射手座', 'th').length, 0, '泰语报告被误报（未按 th 归一）');
  // _e11SignLocal 直接单测：中文 → 各语言
  assert.strictEqual(F._e11SignLocal('射手座', 'en'), 'Sagittarius');
  assert.strictEqual(F._e11SignLocal('射手座', 'zh'), '射手座');
  assert.strictEqual(F._e11SignLocal('Sagittarius', 'zh'), '射手座');
  assert.strictEqual(F._e11SignLocal('Sagittarius', 'th'), 'ธนู');
  assert.strictEqual(F._e11SignLocal('射手座', 'vi'), 'Nhân Mã');
  assert.strictEqual(F._e11SignLocal('射手座', 'fr'), 'Sagittaire');
  assert.strictEqual(F._e11SignLocal('射手座', 'es'), 'Sagitario');
  assert.strictEqual(F._e11SignLocal('不是星座名', 'en'), '不是星座名', '未能归一时必须原样返回（绝不臆造）');
});

// ═══════════════ 注入缺陷自测（闸门灵敏度） ═══════════════
test('⑬ 注入自测: 空数组坑回退（length>0 → 裸 if）必须被闸门抓住', () => {
  const cc = map.get('wealthCriticCheck');
  const hacked = cc.replace('badElement.length > 0', 'badElement');
  assert.notStrictEqual(hacked, cc, '注入失败：未找到 length>0 锚点');
  const F1 = buildWith({ wealthCriticCheck: hacked });
  const issues = F1.wealthCriticCheck(EN_OK, '1992-12-15', '射手座', 'en');
  assert.ok(issues.some((s) => /土元素/.test(s)), '闸门失效: 空数组坑回退后合规报告仍未报错');
});

test('⑭ 注入自测: 判据 1 语言适配剥离（_e11SignLocal → 原样）必须被闸门抓住', () => {
  const cc = map.get('wealthCriticCheck');
  const hacked = cc.replace(/_e11SignLocal\(natalSunSign,\s*lang\s*\|\|\s*'zh'\)/g, '(natalSunSign)')
    .replace(/_e11SignLocal\(natalSunSign,\s*lang\)/g, '(natalSunSign)');
  assert.notStrictEqual(hacked, cc, '注入失败：未找到 _e11SignLocal 锚点');
  const F1 = buildWith({ wealthCriticCheck: hacked });
  const issues = F1.wealthCriticCheck(EN_OK, '1992-12-15', '射手座', 'en');
  assert.ok(issues.length > 0, '闸门失效: 剥离语言适配后英文合规报告仍未误报');
});

test('⑮ 注入自测: 英文元素等价键剥离必须被闸门抓住', () => {
  const cc = map.get('wealthCriticCheck');
  const hacked = cc.replace(/'earth element',\s*'earth sign',\s*'element of earth'/, "'__nope__'");
  assert.notStrictEqual(hacked, cc, '注入失败：未找到 earth 键锚点');
  const F1 = buildWith({ wealthCriticCheck: hacked });
  const bad = EN_OK + '\nGemini is an earth element sign in this system.\n';
  const issues = F1.wealthCriticCheck(bad, '1992-12-15', '射手座', 'en');
  assert.ok(!issues.some((s) => /土元素/.test(s)), '闸门失效: 剥离英文键后英文元素错仍被抓（说明判据未依赖该键）');
});

test('⑯ 注入自测: 空串键守卫（k &&）剥离后判定恒真 —— 证明守卫必要', () => {
  const cc = map.get('wealthCriticCheck');
  // 模拟"键表混入空串"：若剥离 `k &&` 守卫，`low.includes('')` 恒真 ⇒ hasEarth 恒真 ⇒ 误报
  const hacked = cc.replace(/_E11_EARTH_KEYS = \[/, "_E11_EARTH_KEYS = ['', ")
    .replace(/k && \(\(k === '土元素'/, "((k === '土元素'");
  assert.notStrictEqual(hacked, cc, '注入失败：未找到守卫锚点');
  const F1 = buildWith({ wealthCriticCheck: hacked });
  const issues = F1.wealthCriticCheck(EN_OK, '1992-12-15', '射手座', 'en');
  assert.ok(issues.some((s) => /土元素/.test(s)), '闸门失效: 剥离守卫 + 空串键后未产生误报（守卫形同虚设）');
});
