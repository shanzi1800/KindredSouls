/**
 * Gate 39 — 多语言命理与算法字典真值锁死
 *
 * 真值源：astro/astro_terms_dict.json（全系统唯一绝对真值来源）
 *
 * 断言分组：
 *   A 结构完整性（字典可解析 · 分类齐全 · 条目数正确）
 *   B 全覆盖断言（军师令核心）：zh/en/th/vi 四语 Key 集合 100% 对齐，Missing Key = 0
 *   C 六语加固：es/fr 同样 100% 对齐（生产实为六语，不得留漂移缺口）
 *   D 值质量：非空 · 无占位 · 无跨语种串写（th 不得含 CJK，vi/en/es/fr 不得含泰文/CJK）
 *   E 排版长度容错预检：按槽位预算断言字素长度（泰/越重点）
 *   F 反漂移登记：reviewPending / legacyConflicts 必须指向真实存在的 key，且不得静默扩张
 *   G 消费者归正：五处旧源（lexicon.js / zodiac.ts / i18n.ts / server.js / ai-advisor.js）
 *                 及引擎、客户端、两侧派生物，必须全部收敛至本字典，不得回退硬编码
 *
 * 纯 Node 运行（无 DOM / 无网络 / 无 LLM）。
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
// 真值源路径可用环境变量覆写，仅供「注入缺陷自测」指向被篡改的副本（生产/CI 恒用默认路径）
const DICT_PATH = process.env.GATE39_DICT || join(ROOT, 'astro', 'astro_terms_dict.json');
const DICT = JSON.parse(readFileSync(DICT_PATH, 'utf8'));

const LANGS = DICT.meta.langs;
const LOCKED = DICT.meta.lockedLangs;          // zh / en / th / vi（军师令硬红线）
const EXTENDED = DICT.meta.extendedLangs;      // es / fr（牛牛加固）
const DOMAINS = Object.keys(DICT.domains);

/* ── 工具 ── */
const seg = new Intl.Segmenter('en', { granularity: 'grapheme' });
const gLen = (s) => [...seg.segment(s)].length;

const CJK = /[\u3400-\u4DBF\u4E00-\u9FFF]/;
const THAI = /[\u0E00-\u0E7F]/;
const PLACEHOLDER = /^(todo|tbd|xxx|n\/a|null|undefined|\?+|-+|—+)$/i;

const get = (domain, key, lang) => DICT.domains[domain][key][lang];
const keysOf = (domain) => Object.keys(DICT.domains[domain]);

/* ── 消费者源码工具（G 组：归正射程断言）── */
const readSrc = (rel) => readFileSync(join(ROOT, rel), 'utf8');
const md5 = (buf) => createHash('md5').update(buf).digest('hex');
/** 剥离块注释与行注释（禁词扫描前必用：只扫真值块，不扫说明文字） */
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^[ \t]*\/\/.*$/gm, ' ');
/** 同上，针对 Python（# 行注释 + 三引号 docstring）——禁词扫描只扫真值块 */
const stripPyComments = (s) => s
  .replace(/"""[\s\S]*?"""/g, ' ')
  .replace(/'''[\s\S]*?'''/g, ' ')
  .replace(/^[ \t]*#.*$/gm, ' ');
/** 字典派生的星座期望值：泰语取紧凑式裸名（server.js 下游自拼 ราศี），其余取完整式 */
const signExpected = (key, lang) => (lang === 'th' ? get('signsShort', key, 'th') : get('signs', key, lang));

/* ═══════════ A 结构完整性 ═══════════ */

test('A1 字典可解析且元信息完整', () => {
  assert.equal(DICT.version, 1);
  assert.deepEqual(LANGS, ['zh', 'en', 'es', 'fr', 'th', 'vi']);
  assert.deepEqual(LOCKED, ['zh', 'en', 'th', 'vi']);
  assert.deepEqual(EXTENDED, ['es', 'fr']);
  assert.ok(DICT.meta.purpose.length > 0, '必须声明用途（唯一真值来源）');
});

test('A2 分类齐全且条目数符合军师令口径', () => {
  for (const d of ['planets', 'planetsShort', 'points', 'signs', 'signsShort', 'elements', 'elementsLong',
    'modes', 'modesLong', 'aspects', 'aspectsShort', 'aspectKinds', 'motions', 'measures', 'familiar']) {
    assert.ok(DOMAINS.includes(d), `缺分类：${d}`);
  }
  assert.equal(keysOf('planets').length, 10, '十大行星 = 10');
  assert.equal(keysOf('planetsShort').length, 10);
  assert.equal(keysOf('signs').length, 12, '十二星座 = 12');
  assert.equal(keysOf('signsShort').length, 12);
  assert.equal(keysOf('elements').length, 4, '四象 = 4');
  assert.equal(keysOf('modes').length, 3, '三态 = 3');
  assert.equal(keysOf('aspects').length, 5, '主要相位 = 5');
  assert.equal(keysOf('points').length, 6, '虚点 = ASC/DSC/MC/IC/北交点/Vertex = 6');
  assert.ok(keysOf('familiar').length >= 4, '灵宠学说词汇 ≥ 4');
});

test('A3 行星/星座 key 集为天文专名（跨语恒定）', () => {
  assert.deepEqual(keysOf('planets'),
    ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']);
  assert.deepEqual(keysOf('signs'),
    ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio',
      'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']);
  assert.deepEqual(keysOf('aspects'),
    ['Conjunction', 'Sextile', 'Square', 'Trine', 'Opposition']);
});

/* ═══════════ B 全覆盖断言（军师令核心：四语 100% 对齐 · Missing Key = 0）═══════════ */

test('B1 【四语硬红线】zh/en/th/vi 每一分类 Key 集合与基准完全一致，Missing Key = 0', () => {
  const base = 'en';
  let checked = 0;
  for (const domain of DOMAINS) {
    const keys = Object.keys(DICT.domains[domain]);
    assert.ok(keys.length > 0, `${domain} 分类为空`);
    for (const key of keys) {
      const entry = DICT.domains[domain][key];
      // 基准语必须存在且非空
      assert.equal(typeof entry[base], 'string', `${domain}.${key}.${base} 缺失或非字符串`);
      assert.ok(entry[base].trim().length > 0, `${domain}.${key}.${base} 为空串`);
      // 四语逐条核对
      for (const lang of LOCKED) {
        const v = entry[lang];
        assert.equal(typeof v, 'string', `【Missing Key】${domain}.${key}.${lang} 不存在`);
        assert.ok(v.trim().length > 0, `【空值】${domain}.${key}.${lang}`);
        checked++;
      }
      // 不得出现计划外的语言键（防止拼写错误造成静默空值）
      for (const k of Object.keys(entry)) {
        assert.ok(LANGS.includes(k), `未知语言键：${domain}.${key}.${k}`);
      }
    }
  }
  assert.ok(checked > 0, '至少校验一条');
});

test('B2 四语基础分类条目数逐一相等（无整类缺失）', () => {
  for (const domain of DOMAINS) {
    const keys = keysOf(domain);
    for (const lang of LOCKED) {
      const present = keys.filter((k) => typeof DICT.domains[domain][k][lang] === 'string'
        && DICT.domains[domain][k][lang].trim().length > 0);
      assert.equal(present.length, keys.length, `${domain} 在 ${lang} 缺 ${keys.length - present.length} 条`);
    }
  }
});

/* ═══════════ C 六语加固 ═══════════ */

test('C1 【加固】es/fr 与四语同等对齐（生产实为六语，不留漂移缺口）', () => {
  for (const domain of DOMAINS) {
    for (const key of keysOf(domain)) {
      for (const lang of EXTENDED) {
        const v = DICT.domains[domain][key][lang];
        assert.equal(typeof v, 'string', `【Missing Key】${domain}.${key}.${lang}`);
        assert.ok(v.trim().length > 0, `【空值】${domain}.${key}.${lang}`);
      }
    }
  }
});

test('C2 六语横向键集完全等价（同一 key 在六语下都存在）', () => {
  for (const domain of DOMAINS) {
    for (const key of keysOf(domain)) {
      const entry = DICT.domains[domain][key];
      const got = Object.keys(entry).sort();
      assert.deepEqual(got, [...LANGS].sort(), `${domain}.${key} 语言集不齐：${got.join(',')}`);
    }
  }
});

/* ═══════════ D 值质量 ═══════════ */

test('D1 全表无占位符、无空串；非拉丁语种（zh/th）不得原样复用 key', () => {
  for (const domain of DOMAINS) {
    for (const key of keysOf(domain)) {
      for (const lang of LANGS) {
        const v = DICT.domains[domain][key][lang];
        assert.ok(!PLACEHOLDER.test(v.trim()), `【占位符】${domain}.${key}.${lang} = ${v}`);
        // 射程说明：仅对非拉丁文字语种断言「不得等于 key」。
        // 拉丁语种（en/es/fr/vi）中天文专名本就同源同形（Sun / Aries / Venus / Uranus …），
        // 与 key 相等属合法惯例，不应误判为「未翻译」。
        if (lang === 'zh' || lang === 'th') {
          assert.notEqual(v.trim(), key, `【未翻译】${domain}.${key}.${lang} 直接复用了英文 key`);
        }
        assert.ok(!v.includes(`${domain}.${key}`), `【误填路径】${domain}.${key}.${lang}`);
      }
    }
  }
});

test('D2 语种不得串写：zh 必含汉字；th 必含泰文且不得含汉字', () => {
  for (const domain of DOMAINS) {
    for (const key of keysOf(domain)) {
      const zh = get(domain, key, 'zh');
      const th = get(domain, key, 'th');
      assert.ok(CJK.test(zh), `【zh 无汉字】${domain}.${key} = ${zh}`);
      assert.ok(THAI.test(th), `【th 无泰文】${domain}.${key} = ${th}`);
      assert.ok(!CJK.test(th), `【th 串入汉字】${domain}.${key} = ${th}`);
    }
  }
});

test('D3 拉丁语种（en/es/fr/vi）不得串入泰文或汉字', () => {
  for (const domain of DOMAINS) {
    for (const key of keysOf(domain)) {
      for (const lang of ['en', 'es', 'fr', 'vi']) {
        const v = get(domain, key, lang);
        assert.ok(!THAI.test(v), `【${lang} 串入泰文】${domain}.${key} = ${v}`);
        assert.ok(!CJK.test(v), `【${lang} 串入汉字】${domain}.${key} = ${v}`);
      }
    }
  }
});

test('D4 同一分类同一语种内值唯一（防复制粘贴错位）', () => {
  for (const domain of DOMAINS) {
    for (const lang of LOCKED) {
      const vals = keysOf(domain).map((k) => get(domain, k, lang));
      const dup = vals.filter((v, i) => vals.indexOf(v) !== i);
      assert.equal(dup.length, 0, `【值重复】${domain}.${lang} 重复值：${[...new Set(dup)].join(' / ')}`);
    }
  }
});

/* ═══════════ E 排版长度容错预检 ═══════════ */

test('E1 槽位预算与归属声明齐全', () => {
  const { budgets, assignment } = DICT.slots;
  for (const slot of ['labelCard', 'chip', 'degreeOverlay', 'hardCap']) {
    assert.ok(budgets[slot], `缺槽位预算：${slot}`);
    assert.ok(Number.isFinite(budgets[slot].maxGraphemes) && budgets[slot].maxGraphemes > 0);
  }
  for (const domain of DOMAINS) {
    assert.ok(assignment[domain], `分类 ${domain} 未声明槽位归属`);
    assert.ok(budgets[assignment[domain]], `分类 ${domain} 归属了不存在的槽位`);
  }
});

test('E2 每条目字素长度不超过所属槽位预算（字素计数，泰文组合符不误判）', () => {
  const { budgets, assignment } = DICT.slots;
  for (const domain of DOMAINS) {
    const slot = assignment[domain];
    const cap = budgets[slot].maxGraphemes;
    for (const key of keysOf(domain)) {
      for (const lang of LANGS) {
        const v = get(domain, key, lang);
        const n = gLen(v);
        assert.ok(n <= cap,
          `【超长】${domain}.${key}.${lang}「${v}」= ${n} 字素 > ${slot} 预算 ${cap}`);
      }
    }
  }
});

test('E3 任何槽位任何语种不得超过绝对上限 hardCap', () => {
  const cap = DICT.slots.budgets.hardCap.maxGraphemes;
  for (const domain of DOMAINS) {
    for (const key of keysOf(domain)) {
      for (const lang of LANGS) {
        const n = gLen(get(domain, key, lang));
        assert.ok(n <= cap, `【越绝对上限】${domain}.${key}.${lang} = ${n} > ${cap}`);
      }
    }
  }
});

test('E4 泰语 / 越语专项：重点槽位（chip / degreeOverlay）长度抽检', () => {
  const { budgets } = DICT.slots;
  for (const domain of ['planetsShort', 'signsShort', 'points', 'aspects', 'aspectsShort', 'elements', 'modes']) {
    const slot = DICT.slots.assignment[domain];
    for (const lang of ['th', 'vi']) {
      for (const key of keysOf(domain)) {
        const v = get(domain, key, lang);
        assert.ok(gLen(v) <= budgets.degreeOverlay.maxGraphemes,
          `【浮层超长】${domain}.${key}.${lang}「${v}」= ${gLen(v)} > ${budgets.degreeOverlay.maxGraphemes}`);
        assert.ok(typeof slot === 'string');
      }
    }
  }
});

/* ═══════════ F 反漂移登记 ═══════════ */

test('F1 reviewPending 只允许登记真实存在的条目，且语言范围合法', () => {
  const pending = DICT.reviewPending;
  assert.ok(Array.isArray(pending.keys) && pending.keys.length > 0, '待校对清单不可为空');
  for (const path of pending.keys) {
    const [domain, key] = path.split('.');
    assert.ok(DICT.domains[domain], `reviewPending 指向不存在的分类：${path}`);
    assert.ok(DICT.domains[domain][key], `reviewPending 指向不存在的条目：${path}`);
  }
  for (const l of pending.langs) assert.ok(LANGS.includes(l), `reviewPending 语言非法：${l}`);
});

test('F2 legacyConflicts 登记有效：legacy 值必须与 dict 值真实分歧（否则登记已过期，须清理）', () => {
  const entries = DICT.legacyConflicts.entries;
  assert.ok(Array.isArray(entries) && entries.length > 0, '分歧登记不可为空');
  for (const e of entries) {
    assert.ok(typeof e.id === 'string' && e.id.length > 0, '登记项必须有 id');
    assert.ok(typeof e.verdict === 'string' && e.verdict.length > 0, `${e.id} 必须写明裁决`);
    assert.ok(e.legacy && typeof e.legacy === 'object', `${e.id} 必须记录 legacy 来源`);
  }
});

test('F3 【真错误归正锁定】天蝎座越语以 dict 为准 = Bọ Cạp（Thiên Xung 属废弃旧值）', () => {
  assert.equal(get('signs', 'Scorpio', 'vi'), 'Bọ Cạp');
  assert.equal(get('signsShort', 'Scorpio', 'vi'), 'Bọ Cạp');
  const conflict = DICT.legacyConflicts.entries.find((e) => e.id === 'signs.scorpio.vi');
  assert.ok(conflict, '必须登记 signs.scorpio.vi 归正');
  assert.notEqual(conflict.legacy.value, 'Bọ Cạp', 'legacy 值须为旧错误值，否则登记已过期');
});

test('F4 【语域双轨锁定】泰国行星/星座 全称式 与 简称式 必须实质不同（防退化为同一套而丢失语域）', () => {
  for (const key of keysOf('planets')) {
    assert.notEqual(get('planets', key, 'th'), get('planetsShort', key, 'th'),
      `planets.${key} 与 planetsShort.${key} 泰语不应相同（全称式须带 ดาว/ดวง）`);
  }
  for (const key of keysOf('signs')) {
    assert.notEqual(get('signs', key, 'th'), get('signsShort', key, 'th'),
      `signs.${key} 与 signsShort.${key} 泰语不应相同（全称式须带 ราศี）`);
  }
  // 简称式不得带全称前缀
  for (const key of keysOf('signs')) {
    assert.ok(!get('signsShort', key, 'th').startsWith('ราศี'),
      `signsShort.${key} 泰语不应带 ราศี 前缀`);
  }
});

/* ═══════════ G 消费者归正（真值单一来源 · 禁回退硬编码）═══════════
 * 射程：五处旧源（lexicon.js / zodiac.ts / i18n.ts / server.js / ai-advisor.js）
 *      ＋ 引擎 astrology_engine.py ＋ 客户端 v69_client.js ＋ 两侧派生物。
 * 判据：消费者值逐条 == 字典派生值；或（不可运行时求值者）源码必须真实引用真值层。
 */

test('G1 astroTerms.js 适配层六语星座/行星/相位/元素/三态 == 字典派生', async () => {
  const m = await import(pathToFileURL(join(ROOT, 'astroTerms.js')).href);
  assert.deepEqual(m.SIGN_KEYS, keysOf('signs'), 'SIGN_KEYS 必须等于字典星座键序');
  assert.deepEqual(m.PLANET_KEYS, keysOf('planets'), 'PLANET_KEYS 必须等于字典行星键序');
  assert.deepEqual(m.ASPECT_KEYS, keysOf('aspects'), 'ASPECT_KEYS 必须等于字典相位键序');
  for (const lang of LANGS) {
    assert.deepEqual(m.SUN_SIGNS[lang], keysOf('signs').map((k) => signExpected(k, lang)),
      `SUN_SIGNS.${lang} 与字典不一致`);
    for (const k of keysOf('planets')) {
      assert.equal(m.PLANETS[lang][k], get('planets', k, lang), `PLANETS.${lang}.${k}`);
    }
    for (const k of keysOf('aspects')) {
      assert.equal(m.ASPECTS[lang][k], get('aspects', k, lang), `ASPECTS.${lang}.${k}`);
    }
    for (const k of keysOf('elements')) {
      assert.equal(m.ELEMENTS[lang][k], get('elements', k, lang), `ELEMENTS.${lang}.${k}`);
    }
    for (const k of keysOf('modes')) {
      assert.equal(m.MODES[lang][k], get('modes', k, lang), `MODES.${lang}.${k}`);
    }
  }
});

test('G2 lexicon.js 六语星座表 == 字典（泰语取紧凑式裸名，与下游拼接同源）', async () => {
  const m = await import(pathToFileURL(join(ROOT, 'lexicon.js')).href);
  for (const lang of LANGS) {
    assert.ok(m.LEXICON[lang] && m.LEXICON[lang].signs, `LEXICON.${lang}.signs 缺失`);
    for (const k of keysOf('signs')) {
      assert.equal(m.LEXICON[lang].signs[k][lang], signExpected(k, lang), `LEXICON.${lang}.signs.${k}.${lang}`);
    }
  }
});

test('G3 v69_client.js 星座真值已收拢至 astroTerms.js（禁回退手写字面量）', () => {
  const code = stripComments(readSrc('v69_client.js'));
  assert.ok(/from\s+['"]\.\/astroTerms\.js['"]/.test(code), 'v69_client.js 必须 import ./astroTerms.js');
  assert.ok(/const\s+SIGN_FULL\s*=\s*SIGN_KEYS\s*;/.test(code), 'SIGN_FULL 必须直接取 SIGN_KEYS');
  assert.ok(/const\s+SIGN_L10N\s*=\s*\{[\s\S]{0,400}?SUN_SIGNS\.th/.test(code),
    'SIGN_L10N 块必须由 SUN_SIGNS 派生（含 th）');
});

test('G4 server.js 内联字面量（6 语星座 + 3 行星表 + 法语星座表）≡ 字典（漂移锁定）', () => {
  // 🌟 归正范式：server.js 是本项目唯一「不可 import 型消费者」——仓内 13 道既有闸门以
  //    「源码文本抽取 + new Function VM 沙箱」消费其字面量；改为 import 引用后沙箱符号未定义即崩
  //    （E41+ 实测 13 段全红）。故此处与 ai-advisor 镜像同理，以「闸门同源」取代「import 同源」：
  //    把 server.js 的内联字面量逐字锁定到字典 —— 任何一侧漂移都会被本断言当场击落。
  const code = stripComments(readSrc('server.js'));

  // ① 6 语星座数组（泰语取紧凑式裸名 signsShort，与下游自拼 ราศี 同源）
  for (const [suffix, lang] of [['EN', 'en'], ['ES', 'es'], ['FR', 'fr'], ['ZH', 'zh'], ['TH', 'th'], ['VI', 'vi']]) {
    const m = code.match(new RegExp(`const\\s+SUN_SIGN_${suffix}\\s*=\\s*(\\[[^\\]]*\\])\\s*;`));
    assert.ok(m, `server.js 未找到 SUN_SIGN_${suffix} 内联数组（形态变更须同步本闸门）`);
    const actual = new Function(`return ${m[1]};`)();
    const expected = keysOf('signs').map((k) => signExpected(k, lang));
    assert.deepEqual(actual, expected, `SUN_SIGN_${suffix} 偏离字典（drift：改字典须同步 server.js）`);
  }

  // ② 三张行星表（严格语域：泰语用全称式 domains.planets，非 planetsShort 裸名）
  for (const [name, lang] of [['_TH_PLANET', 'th'], ['_VI_PLANET', 'vi'], ['_FR_PLANET', 'fr']]) {
    const m = code.match(new RegExp(`const\\s+${name}\\s*=\\s*(\\{[\\s\\S]*?\\})\\s*;`));
    assert.ok(m, `server.js 未找到 ${name} 对象字面量（形态变更须同步本闸门）`);
    const actual = new Function(`return ${m[1]};`)();
    const expected = {};
    for (const k of keysOf('planets')) expected[k] = get('planets', k, lang);
    assert.deepEqual(actual, expected, `${name} 偏离字典 domains.planets.${lang}`);
  }

  // ③ 法语标准星座名（与 labels.fr 同源）
  const fr = code.match(/const\s+_FR_SIGN_FR\s*=\s*(\[[^\]]*\])\s*;/);
  assert.ok(fr, 'server.js 未找到 _FR_SIGN_FR 内联数组');
  assert.deepEqual(new Function(`return ${fr[1]};`)(),
    keysOf('signs').map((k) => get('signs', k, 'fr')), '_FR_SIGN_FR 偏离字典 domains.signs.fr');
});

test('G5 前端派生物 astroTerms.generated.ts 内嵌字典 == 真值源（禁手改）', () => {
  const src = readSrc('web/src/lib/algos/astroTerms.generated.ts');
  const m = src.match(/export const ASTRO_TERMS = (\{[\s\S]*?\}) as unknown as AstroTermsDict;/);
  assert.ok(m, 'ASTRO_TERMS 常量缺失或形状被改');
  assert.deepEqual(JSON.parse(m[1]), DICT, '派生物与真值源不一致（须重跑 npm run gen:terms）');
});

test('G6 zodiac.ts / i18n.ts 已引用派生物，且不见下架旧漂移字面量', () => {
  for (const rel of ['web/src/lib/algos/zodiac.ts', 'web/src/lib/algos/i18n.ts']) {
    assert.ok(/from\s+['"]\.\/astroTerms\.generated['"]/.test(readSrc(rel)), `${rel} 必须 import 派生物`);
  }
  const z = stripComments(readSrc('web/src/lib/algos/zodiac.ts'));
  const i = stripComments(readSrc('web/src/lib/algos/i18n.ts'));
  assert.ok(!z.includes('Thiên Xung'), 'zodiac.ts 不得残留下架旧值（天蝎越语 Thiên Xung）');
  assert.ok(!i.includes('Thiên Xung'), 'i18n.ts 不得残留下架旧值（天蝎越语 Thiên Xung）');
  assert.ok(!z.includes('เมถุน'), 'zodiac.ts 不得残留旧标准短名 เมถุน（泰语族形为 มิถุน）');
});

test('G7 ai-advisor SYNASTRY_I18N 行星表 == 字典 planetsShort（语域混用已消除）', async () => {
  const m = await import(pathToFileURL(join(ROOT, 'api', 'ai-advisor.js')).href);
  const Z = m.SYNASTRY_I18N;
  assert.ok(Z && typeof Z === 'object', 'SYNASTRY_I18N 未导出');
  for (const lang of LANGS) {
    assert.ok(Z[lang], `SYNASTRY_I18N.${lang} 缺失`);
    for (const k of keysOf('planetsShort')) {
      assert.equal(Z[lang].planets[k], get('planetsShort', k, lang),
        `SYNASTRY_I18N.${lang}.planets.${k} 偏离字典`);
    }
    for (const k of keysOf('aspectsShort')) {
      assert.equal(String(Z[lang].aspects[k.toLowerCase()]).trim(), get('aspectsShort', k, lang),
        `SYNASTRY_I18N.${lang}.aspects.${k} 偏离字典（trim 后应等值；两侧留白属渲染排版约定）`);
    }
  }
});

test('G8 合婚术语派生物 api/ 与 web/api/ 逐字节一致且含字典全量值', () => {
  const a = readFileSync(join(ROOT, 'api', 'synastry-terms.generated.js'));
  const b = readFileSync(join(ROOT, 'web', 'api', 'synastry-terms.generated.js'));
  assert.equal(md5(a), md5(b), '双份合婚术语派生物必须逐字节一致（内联常量、零路径依赖）');
  const s = a.toString('utf8');
  for (const lang of LANGS) {
    for (const k of keysOf('planetsShort')) {
      assert.ok(s.includes(JSON.stringify(get('planetsShort', k, lang))), `派生物缺值：${lang}.${k}`);
    }
  }
});

test('G9 ai-advisor 双镜像逐字节一致（api/ == web/api/，md5 铁律）', () => {
  const a = readFileSync(join(ROOT, 'api', 'ai-advisor.js'));
  const b = readFileSync(join(ROOT, 'web', 'api', 'ai-advisor.js'));
  assert.equal(md5(a), md5(b), 'ai-advisor.js 双镜像必须逐字节一致（生产实为 web/api/ 副本）');
});

test('G10 astrology_engine.py 由字典派生星座真值 + 泰语错字纠错锁定', () => {
  const src = stripPyComments(readSrc('astro/astrology_engine.py'));
  for (const lang of ['zh', 'th', 'vi']) {
    assert.ok(new RegExp(`_term_map\\(\\s*'signs'\\s*,\\s*'${lang}'\\s*\\)`).test(src),
      `引擎未从字典派生 ZODIAC_*（${lang}）`);
  }
  assert.ok(!src.includes('กรกฏ'), '泰语 Cancer 错字 กรกฏ 必须已纠正为 กรกฎ（真值块内）');
  // 本次归正的三处语言纠错 —— 终局真值锁定
  assert.equal(get('signs', 'Cancer', 'th'), 'ราศีกรกฎ');
  assert.equal(get('signs', 'Aquarius', 'th'), 'ราศีกุมภ์');
  assert.equal(get('signsShort', 'Gemini', 'th'), 'มิถุน');
  assert.equal(get('signsShort', 'Virgo', 'th'), 'กันยา');
  assert.equal(get('signs', 'Scorpio', 'vi'), 'Bọ Cạp');
});
