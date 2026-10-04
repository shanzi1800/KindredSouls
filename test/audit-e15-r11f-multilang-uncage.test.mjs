// ═══════════════════════════════════════════════════════════════════════
// 🛡️ E15/R11f: 多语言预缓存解封与后处理代际拉齐 —— 回归闸门（四支柱）
// 立项依据（2026-10-04 12 特殊样本后端批测实测）:
//   🔴 支柱 0（生产级 P0）：非流式 HIT 的 `const stdCached`(server.js ~:10800) 被
//       vi(:~10819)/th(:~10829) 分支**重赋值** ⇒ 运行时抛 `TypeError: Assignment to
//       constant variable` ⇒ 被外层 catch 吞掉 ⇒ HIT 静默退化为 MISS。
//       实测对照：en 第二次请求 1166ms（真 HIT）；vi/th 第二次请求仍 166.6s（MISS）
//       ⇒ 该生辰缓存写了却永不命中，用户每次刷新双倍 token + 2 分钟等待。
//   🔴 支柱 1：`lib/yearly_integrity.mjs` 的 `STRUCTURE.fr = STRUCTURE.es = STRUCTURE.en`
//       只认英文 `Chapter I~V`，而 `langInstructions`+prompt 明令 es→`Capítulo`、
//       fr→`Chapitre`、th 终章→`คำพยากรณ์ร่ำรวยขั้นสุด` ⇒ `chaptersFound=0/5` 或
//       `hasFinalOracle=false` ⇒ `skipCache=true` **拒入库** ⇒ 该语种缓存 0% 命中。
//       实测：`cached=true` 仅 4/12，es/fr/th 共 6 盘全被误杀。
//   🔴 支柱 2：真值锁形态盲区 —— es 只认 `Casa N`+拼写序数，对 LLM 实际产出的
//       `5ª Casa`（阴性序数指示符）**全盲**（Ushuaia 盘实测 54 处本命宫位错配漏网）；
//       fr 通道只认 `Maison N`，对 `5ᵉ / 5e / 5ème / 5° maison` 同盲。
//       且 CRITIC 判据 12 复用同一 finder ⇒ 同源失明（归一漏了、判据也看不见）。
//   🔴 支柱 3：`_v512PossessiveNatal` 第 ⑥ 否决用等宫制退化公式
//       `((signIdx - ascIdx) % 12) + 1` 判「星座 X 是否在本命第 N 宫」——
//       该公式只是 astro_matrix.py `get_house(sign, rising)` 的**无出生时间兜底**；
//       出生时间已知时引擎走 Placidus **真实宫头**，一个星座可**跨两宫**
//       （Adelaide 实测 H1 宫头 292.82°Cap、H2 宫头 314.19°Aqu ⇒ 水瓶跨 H1+H2）
//       ⇒ 否决判据在 Placidus 盘必然漏判。
// 本战役另擒一大硬缺陷（v512 真实生产稿实证）:
//   🔴 偏移坐标系铁律（第 3 例）：**命中区间相交** —— E13 的「倒序应用」只解决
//      【不相交】区间的坐标失效；一旦两区间相交，先应用者改变串长即令后者右界失效
//      ⇒ es 盘实测 `tu tu Sol` → `tu tuSol`（凭空吃掉 1 空格），`financieroo` 尾字复制。
//      治本 = 应用前做区间**去交叉**（`_v432ResolveOverlaps`，纯过滤器，保留先起者）。
// 本测试: 源码级结构断言 + vm 抽取行为验证（零 python，假矩阵复刻引擎产出口径）
//        + 真实生产片段内联复现 + 【注入缺陷自测】。
// ═══════════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { closureDecls } from './tools/extract_decls.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf-8');
const purgeSrc = fs.readFileSync(path.join(ROOT, 'scripts', 'purge-tz-poison-cache.mjs'), 'utf-8');
const yearlyTest = fs.readFileSync(path.join(ROOT, 'test', 'audit-yearly-stream.test.js'), 'utf-8');
const integritySrc = fs.readFileSync(path.join(ROOT, 'lib', 'yearly_integrity.mjs'), 'utf-8');
const { assessYearlyReportIntegrity } = await import(pathToFileURL(path.join(ROOT, 'lib', 'yearly_integrity.mjs')).href);

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
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

// ═══════════════════════════════════════════════════════════════════════
// 判据函数（供断言与【注入缺陷自测】共用，保持同一口径）
// ═══════════════════════════════════════════════════════════════════════

/** 支柱 0：`stdCached` 必须由 `let` 声明（vi/th 分支会重赋值），且赋值链非空 */
function p0LetDeclared(s) {
  const decls = [...s.matchAll(/(const|let|var)\s+stdCached\s*=/g)];
  if (!decls.length) return false;
  if (!decls.every((m) => m[1] === 'let')) return false;
  // HIT 段内必须确实存在重赋值（否则本判据是空断言 —— 防「恒真」）
  const at = s.indexOf('let stdCached = ');
  if (at < 0) return false;
  const seg = s.slice(at, at + 4000);
  return (seg.match(/\bstdCached\s*=/g) || []).length >= 3;
}

/** 支柱 2 之 es：cfg 必须具备阴性序数指示符第六式 */
function p2EsAbbrCfg(s) {
  const cfg = s.match(/const\s+_V432_CFG\s*=\s*\{[\s\S]*?\n\};/);
  if (!cfg) return false;
  return /houseAbbr:\s*\/[^\n]*\(\?<!\[\\d\.,\]\)/.test(cfg[0]) && /houseAbbrFmt:\s*\(n\)\s*=>/.test(cfg[0]);
}

/** 支柱 3：否决判据必须挂真实宫头（且保留等宫制回落） */
function p3CuspsWired(s) {
  const poss = stripComments(fnBody('_v512PossessiveNatal', s));
  return /_v512SignSpanHouses\(astroMatrix\.meta, si\)/.test(poss)
    && /span\.has\(Number\(claim\.house\)\)/.test(poss)
    && /\(\(\(\(si - ri\) % 12\) \+ 12\) % 12\) \+ 1 === Number\(claim\.house\)/.test(poss);
}

/** 偏移坐标系第 3 例：四处 hits 应用点必须先做区间去交叉 */
const OVERLAP_SITES = ['_v432LockNatal', 'lockNatalTruthVi', 'lockNatalTruthFr', 'v426EnforceNatalRetrograde'];
function overlapGuardWired(s) {
  return OVERLAP_SITES.every((fn) => /hits\s*=\s*_v432ResolveOverlaps\(hits,/.test(stripComments(fnBody(fn, s))));
}

// ═══════════════════════════════════════════════════════════════════════
// ① 支柱 0（P0）：const stdCached 赋值崩溃
// ═══════════════════════════════════════════════════════════════════════
test('① 支柱0: 非流式 HIT 的 stdCached 必须 let 声明（vi/th 分支重赋值 ⇒ const 必抛 TypeError）', () => {
  assert.ok(p0LetDeclared(src), 'stdCached 非 let 声明或赋值链缺失（vi/th HIT 会抛 TypeError 被 catch 吞掉 ⇒ 缓存永不命中）');
  // 显式钉死：不得出现 `const stdCached`
  assert.ok(!/const\s+stdCached\s*=/.test(src), '出现 `const stdCached` —— P0 崩溃回归（vi/th 非流式 HIT 永灭）');
  // 该段必须含 P0 修复说明（防后人「顺手改回 const」）
  assert.ok(/E15\/R11f-0/.test(src), '缺 P0 修复说明锚点（E15/R11f-0）');
  // vi / th 两个分支必须确实在给 stdCached 赋值
  assert.ok(/stdCached\s*=\s*lockNatalTruthVi\(/.test(src), 'vi 分支未对 stdCached 赋值（判据失去对象）');
  assert.ok(/stdCached\s*=\s*lockNatalTruthTh\(/.test(src), 'th 分支未对 stdCached 赋值（判据失去对象）');
});

// ═══════════════════════════════════════════════════════════════════════
// ② 支柱 1：六语本地化章名/终章
// ═══════════════════════════════════════════════════════════════════════
test('② 支柱1: yearly_integrity 的 STRUCTURE 六语齐备且逐位对齐 I~V（禁 STRUCTURE.x = STRUCTURE.en）', () => {
  assert.ok(!/STRUCTURE\.(fr|es|vi|th)\s*=\s*STRUCTURE\./.test(stripComments(integritySrc)),
    '仍存在 STRUCTURE 别名共享（章名口径矛盾回归：本地化标题被判缺章 ⇒ 拒入库）');
  assert.ok(/const\s+_CH_ROMAN\s*=\s*\[/.test(integritySrc), '缺 _CH_ROMAN 罗马数字逐位构造（I~V 对齐失去保障）');
  assert.ok(/const\s+_chRoman\s*=\s*\(\.\.\.pats\)/.test(integritySrc), '缺 _chRoman 构造器');
  // 六键齐备
  for (const l of ['zh', 'en', 'th', 'vi', 'es', 'fr']) {
    assert.ok(new RegExp('^\\s{2}' + l + ':\\s*\\{', 'm').test(integritySrc), `STRUCTURE 缺 ${l} 键`);
  }
  // 本地化章名
  assert.ok(/Cap\[ií\]tulo/.test(integritySrc), 'es 章名未本地化（Capítulo 失配）');
  assert.ok(/Chapitre/.test(integritySrc), 'fr 章名未本地化（Chapitre 失配）');
  assert.ok(/Chương/.test(integritySrc), 'vi 章名未本地化（Chương 失配）');
  assert.ok(/บทที่\\s\*1/.test(integritySrc), 'th 章名未本地化（บทที่ 失配）');
  // 终章本地化
  assert.ok(/OR\[ÁA\]CULO\\s\+FINAL/.test(integritySrc), 'es 终章未本地化（ORÁCULO FINAL 失配）');
  assert.ok(/ORACLE\\s\+FINAL/.test(integritySrc), 'fr 终章未本地化（ORACLE FINAL 失配）');
  assert.ok(/คำพยากรณ์ร่ำรวย/.test(integritySrc), 'th 终章未本地化（คำพยากรณ์ร่ำรวย 失配）');
});

/** 六语真实产出的章标题/终章标题（逐字取自 12 盘批测产出） */
const LOCALIZED = {
  zh: { ch: (n) => `### 第${['一', '二', '三', '四', '五'][n - 1]}章：财富的架构\n`, final: '### 最终财富神谕 · 掌控之钥\n' },
  en: { ch: (n) => `### Chapter ${['I', 'II', 'III', 'IV', 'V'][n - 1]}: The Architecture\n`, final: '### 🔮 FINAL WEALTH ORACLE · The Password to Mastery\n' },
  es: { ch: (n) => `### Capítulo ${['I', 'II', 'III', 'IV', 'V'][n - 1]}: La Arquitectura\n`, final: '### 🔮 ORÁCULO FINAL DE RIQUEZA · La Contraseña del Dominio\n' },
  fr: { ch: (n) => `### Chapitre ${['I', 'II', 'III', 'IV', 'V'][n - 1]}: L’Architecture\n`, final: '### 🔮 ORACLE FINAL DE LA RICHESSE · Le Mot de Passe de la Maîtrise\n' },
  th: { ch: (n) => `### บทที่ ${n}: สถาปัตยกรรม\n`, final: '### 🔮 คำพยากรณ์ร่ำรวยขั้นสุด · รหัสแห่งการควบคุม\n' },
  vi: { ch: (n) => `### Chương ${['I', 'II', 'III', 'IV', 'V'][n - 1]}: Kiến Trúc\n`, final: '### 🔮 FINAL WEALTH ORACLE · Mật Mã Làm Chủ\n' },
};
const buildReport = (lang, opts = {}) => {
  const L = LOCALIZED[lang];
  let t = '';
  for (let n = 1; n <= 5; n++) t += L.ch(n) + 'Nội dung / contenido / 正文占位。\n\n';
  if (!opts.dropFinal) t += L.final + 'Nội dung kết。\n';
  if (opts.truncate) t = t.slice(0, Math.floor(t.length * 0.4));
  return t;
};
/** 结构性判定（与 length 阈值解耦：只看章名/终章口径） */
const structOk = (lang, text) => {
  const r = assessYearlyReportIntegrity(text, { lang, minChars: 0 });
  return r.metrics.chaptersFound === 5 && r.metrics.hasFinalOracle === true
    && !r.reasons.some((x) => /缺章节标记|缺最终章/.test(x));
};

test('③ 支柱1 行为级: 六语本地化章名/终章 12/12 结构化通过（原 es/fr/th 全被判缺章）', () => {
  const bad = [];
  for (const lang of ['zh', 'en', 'es', 'fr', 'th', 'vi']) {
    const r = assessYearlyReportIntegrity(buildReport(lang), { lang, minChars: 0 });
    if (!structOk(lang, buildReport(lang))) bad.push(`${lang}(chapters=${r.metrics.chaptersFound} final=${r.metrics.hasFinalOracle} ${r.reasons.join('/')})`);
  }
  assert.deepEqual(bad, [], '本地化章名/终章仍有失配 ⇒ 该语种单跳过缓存 ⇒ 0% HIT');
  // 英文章名向后兼容（旧缓存 / LLM 漂移不得被误杀）
  assert.ok(structOk('es', buildReport('en')), 'es 不再兼容英文 Chapter 标题（旧缓存会二次拒入库）');
  assert.ok(structOk('fr', buildReport('en')), 'fr 不再兼容英文 Chapter 标题');
});

test('③b E16/R11h 行为级: vi 终章本地化形态（LLM 波动）必须被承认（线上 s5/s11 被误拒入库 ⇒ HIT 永灭）', () => {
  // E16 线上实测：vi 产物终章为 `### TIÊN TRI TÀI LỘC CUỐI CÙNG · Mật Mã Để Làm Chủ`，
  // 旧判据只认 EN 形态 ⇒ integrity 误报「缺最终章」⇒ 报告被拒、拒绝写库。
  const viLocalized = '### Chương I: Kiến Trúc\n\n正文。\n\n### Chương II: Kiến Trúc\n\n正文。\n\n### Chương III: Kiến Trúc\n\n正文。\n\n### Chương IV: Kiến Trúc\n\n正文。\n\n### Chương V: Kiến Trúc\n\n正文。\n\n### TIÊN TRI TÀI LỘC CUỐI CÙNG · Mật Mã Để Làm Chủ\n\n正文 kết。\n';
  const r = assessYearlyReportIntegrity(viLocalized, { lang: 'vi', minChars: 0 });
  assert.ok(r.metrics.hasFinalOracle === true, `vi 本地化终章仍不被承认: ${r.reasons.join('/')}`);
  // 兜底短语（三盘观测稳定出现）：`Mật Mã … Làm Chủ`
  const viSubtitle = viLocalized.replace('### TIÊN TRI TÀI LỘC CUỐI CÙNG · Mật Mã Để Làm Chủ', '### 🔮 Lời Tiên Tri Cuối Cùng · Mật Mã Của Sự Làm Chủ');
  assert.ok(assessYearlyReportIntegrity(viSubtitle, { lang: 'vi', minChars: 0 }).metrics.hasFinalOracle === true, 'vi 终章兜底短语（Mật Mã…Làm Chủ）未被承认');
  // 判据不得被放宽成恒真：终章整段缺失必须仍拦
  assert.strictEqual(structOk('vi', buildReport('vi', { dropFinal: true })), false, 'vi 缺终章未拦（判据被放宽成恒真）');
});

test('④ 支柱1 行为级: 结构性截断 / 扣终章 / 空文本 必须拦（判据不得被放宽成恒真）', () => {
  for (const lang of ['zh', 'en', 'es', 'fr', 'th', 'vi']) {
    assert.strictEqual(structOk(lang, buildReport(lang, { dropFinal: true })), false, `${lang}: 缺终章未拦`);
    assert.strictEqual(structOk(lang, buildReport(lang, { truncate: true })), false, `${lang}: 截断稿未拦`);
  }
  assert.strictEqual(assessYearlyReportIntegrity('', { lang: 'es', minChars: 0 }).ok, false, '空文本未拦');
});

// ═══════════════════════════════════════════════════════════════════════
// ⑤ 支柱 2 / 偏移坐标系第 3 例 / 支柱 3 —— 源码级结构
// ═══════════════════════════════════════════════════════════════════════
test('⑤ 支柱2: es 第六式（阴性序数指示符）全链补齐 + fr 同位形态', () => {
  assert.ok(p2EsAbbrCfg(src), 'es cfg 缺 houseAbbr / houseAbbrFmt（`5ª Casa` 全盲回归）');
  const finder = stripComments(fnBody('_v432FindHouse'));
  assert.ok(/cfg\.houseAbbr/.test(finder) && /ord:\s*'abbr'/.test(finder),
    '_v432FindHouse 缺 houseAbbr 分支（finder 认不出 ⇒ 归一漏、CRITIC 也同源失明）');
  const patch = stripComments(fnBody('_v432PatchZone'));
  assert.ok(/h\.ord === 'abbr' \? cfg\.houseAbbrFmt\(house\)/.test(patch), 'PatchZone 未把 abbr 路由到 houseAbbrFmt');
  // fr 通道：缩写形态表 + 从句/写回双侧改走宽判据
  assert.ok(/const\s+_FR_HOUSE_ABBR\s*=/.test(src), '缺 _FR_HOUSE_ABBR 常量');
  assert.ok(/const\s+_FR_HOUSE_ANY\s*=/.test(src), '缺 _FR_HOUSE_ANY 常量');
  assert.ok(/match\(_FR_HOUSE_ANY\)/.test(src.replace(/\/Maison\\s\*\\d\+/g, '')), 'fr 从句/写回侧未改走 _FR_HOUSE_ANY');
  const frPatch = stripComments(fnBody('_frPatchZone'));
  assert.ok(/_FR_HOUSE_ABBR/.test(frPatch), '_frPatchZone 未接缩写形态（`5ᵉ maison` 同盲）');
});

test('⑥ 偏移坐标系第3例: 四处 hits 应用点已挂去交叉 + 兜底分支偏移已修', () => {
  assert.ok(/^function _v432ResolveOverlaps\(/m.test(src), '缺 _v432ResolveOverlaps');
  assert.ok(overlapGuardWired(src), '存在未挂去交叉的 hits 应用点（区间相交 ⇒ 串长错位 artifact）');
  // 纯过滤器语义：必须返回入参顺序（不得顺带排序，否则 E13 闸门 ⑬ 注入锚点失去判别力）
  const body = stripComments(fnBody('_v432ResolveOverlaps'));
  assert.ok(/return hits\.filter\(/.test(body), '去交叉未以「保持入参顺序的纯过滤」实现');
  assert.ok(/if \(!Array\.isArray\(hits\) \|\| hits\.length < 2\) return hits \|\| \[\];/.test(body),
    '缺「无相交 ⇒ 原样返回」短路（零回归保证）');
  // _v432PatchZone 兜底分支：替换起点必须是 wStart（旧写法 base + wStart 会产出残字）
  assert.ok(!/z\.slice\(0,\s*base \+ wStart\)/.test(stripComments(fnBody('_v432PatchZone'))),
    '_v432PatchZone 兜底分支仍有 `base + wStart` 偏移缺陷（产出 `LioCáncer` 残字）');
  assert.ok(/z\.slice\(0, wStart\) \+ sign \+ z\.slice\(wStart \+ word\.length\)/.test(stripComments(fnBody('_v432PatchZone'))),
    '兜底分支未按 wStart 精确替换');
});

test('⑦ 支柱3: 否决判据挂真实宫头（Placidus 可跨宫）且保留等宫制回落', () => {
  assert.ok(/^function _v512SignSpanHouses\(/m.test(src), '缺 _v512SignSpanHouses');
  assert.ok(p3CuspsWired(src), '第 ⑥ 否决未挂真实宫头（Placidus 跨宫星座必然漏判）');
  const fn = stripComments(fnBody('_v512SignSpanHouses'));
  assert.ok(/if \(!full\) return null;/.test(fn), 'cusps 缺失时未返回 null（须回落等宫制）');
  assert.ok(/if \(!Number\.isFinite\(d\)\) return null;/.test(fn), '宫头结构不完整时未整体放弃（猜 = 编）');
  assert.ok(/ov > 1e-6/.test(fn), '缺零长度交叠保护（宫头恰落星座边界会生出假宫位）');
});

// ═══════════════════════════════════════════════════════════════════════
// 行为级：vm 抽取（零 python）
// ═══════════════════════════════════════════════════════════════════════
const EXT = ['getSignToHouseMap', 'SIGN_ORDER_ZH', 'app', 'express', 'dirname', '__filename', 'join', 'distPath'];
function buildFrom(sourceText, seeds) {
  const { map } = closureDecls(sourceText, seeds, EXT);
  const dropped = [];
  for (const n of [...map.keys()]) {
    const v = map.get(n);
    // ⚠️ extract_decls 的 varRe 对「正则字面量常量」会过冲（可吞掉半份文件）⇒ 行锚精确重切
    if (v.length > 4000) {
      const mm = new RegExp('^const\\s+' + n + '\\s*=\\s*\\/.*?\\/[a-z]*;', 'm').exec(sourceText);
      if (mm) map.set(n, mm[0]);
    }
    try { new vm.Script(map.get(n)); } catch (e) { dropped.push(`${n}(${e.message.slice(0, 40)})`); map.delete(n); }
  }
  const ctx = {
    getSignToHouseMap: undefined, SIGN_ORDER_ZH: undefined,
    console: { log() {}, warn() {}, error() {} }, setTimeout, clearTimeout, setInterval, clearInterval, Buffer, process, __exports: {},
  };
  vm.createContext(ctx);
  const body = [...map.entries()].sort((a, b) => sourceText.indexOf(a[1]) - sourceText.indexOf(b[1])).map((e) => e[1]).join('\n\n');
  vm.runInContext(body + '\n' + seeds.map((n) => `__exports[${JSON.stringify(n)}] = typeof ${n} !== 'undefined' ? ${n} : undefined;`).join('\n'), ctx);
  return { F: ctx.__exports, dropped, size: map.size };
}

// ── 窄抽取：es 写回通道 ──
const ES_SEEDS = ['_v432PatchZone', '_V432_CFG', '_v432FindHouse', '_v432AllSignWords', '_v432Signs', '_v432SignAlts',
  '_V432_ORDER', '_V432_NAME', '_V432_EN2LOC', '_V432_ES_ORD', '_V432_ES_ORD_FORMAT', '_V432_ZH_NUM', '_v432Esc',
  '_V432_EN_SPELLED', '_V512_SPELLED_HOUSE', '_v432EnOrdSuf', '_v432SlotOf', '_v436InThMonth', '_V432_LANGS'];
const ES = buildFrom(src, ES_SEEDS);
assert.deepEqual(ES.dropped, [], `es 沙箱抽取有语法不完整项: ${ES.dropped.join(', ')}`);
for (const n of ES_SEEDS) assert.ok(ES.F[n] !== undefined, `VM 未抽取 ${n}`);

// ── 窄抽取：fr 写回通道 ──
const FR_SEEDS = ['_frPatchZone', '_FR_ORDINAL_TO_DIGIT', '_FR_DIGIT_TO_ORDINAL', '_FR_HOUSE_ABBR'];
const FR = buildFrom(src, FR_SEEDS);
assert.deepEqual(FR.dropped, [], `fr 沙箱抽取有语法不完整项: ${FR.dropped.join(', ')}`);
for (const n of FR_SEEDS) assert.ok(FR.F[n] !== undefined, `VM 未抽取 ${n}`);

// ── 全链抽取（真实片段复现 + 支柱 3 行为级）──
const CHAIN_SEEDS = ['_v432LockLeadingNatal', '_v432LockNatal', '_v432SentTransitMarked', '_V492B_LEAD_TRANSIT',
  '_V492B_SENT_BREAK', '_v482SignAdjacent', '_v432Clause', '_v432AdjudicateDescriptors', '_v432Normalize', '_v432Truth',
  '_v432TruthMatch', '_v432SlotOf', '_v432ClaimOf', '_v432PatchZone', '_v432FindHouse', '_v432AllSignWords',
  '_v432Signs', '_v432SignAlts', '_V432_CFG', '_V432_NAME', '_V432_ORDER', '_V432_LANGS', '_V432_EN2LOC', '_V432_ZH_NUM',
  '_V432_ES_ORD', '_V432_ES_ORD_FORMAT', '_v432Esc', '_V482_FWD_BREAK', '_V482_FWD_CONJ', 'SUN_SIGN_EN', '_EN2ZIDX',
  '_v492cLockAxisSalutation', '_v432EnOrdSuf', '_V432_EN_SPELLED', '_V512_SPELLED_HOUSE', '_v512NormalizeHouseOrdinal',
  'stripLLMSelfCorrection', '_v512PossessiveNatal', '_v512PossessiveTouch', '_v512SentWindow', '_v512CountNatalClaimMismatch',
  '_V512_POSS', '_V512_MONTH_TOK', '_V512_POSS_NEAR', '_V512_TIME_QUAL', '_V512_PLACE_AFTER', '_V512_MALFORMED_HOUSE',
  '_V512_META_RETRACT', '_V512_SENT_CUT', '_V512_META_PLAIN', '_V512_META_DECL', '_V512_META_CORR', '_V512_META_SENT',
  '_V512_META_PAREN', 'applyTruthLocksEnEsZh', '_v432LockTransit', '_v433LockMoonWeek', 'applyV434Locks',
  'v426EnforceNatalRetrograde', '_v512SignSpanHouses', '_v432ResolveOverlaps'];
const CHAIN = buildFrom(src, CHAIN_SEEDS);
assert.deepEqual(CHAIN.dropped, [], `全链沙箱抽取有语法不完整项: ${CHAIN.dropped.join(', ')}`);

test('⑧ 支柱2 行为级 es: `5ª / 5º / 5a / 5.ª Casa` 与拼写序数一律纠值', () => {
  const P = (t) => ES.F._v432PatchZone(ES.F._V432_CFG.es, 'es', t, 'Géminis', 4, true, t, 0).text;
  const cases = [
    ['Júpiter en Géminis en tu 5ª Casa', 'Júpiter en Géminis en tu 4ª Casa'],
    ['Júpiter en Géminis en tu 5º Casa', 'Júpiter en Géminis en tu 4ª Casa'],
    ['Júpiter en Géminis en tu 5a Casa', 'Júpiter en Géminis en tu 4ª Casa'],
    ['Júpiter en Géminis en tu 5.ª Casa', 'Júpiter en Géminis en tu 4ª Casa'],
    ['Júpiter en Géminis en tu quinta casa', 'Júpiter en Géminis en tu cuarta casa'],
    ['Júpiter en Géminis en tu Casa 5', 'Júpiter en Géminis en tu Casa 4'],
  ];
  for (const [inp, exp] of cases) assert.strictEqual(P(inp), exp, `es 形态漏改: ${inp}`);
});

test('⑨ 支柱2 行为级 es: 防误伤（年份 / 复数 / 值对幂等）', () => {
  const P = (t) => ES.F._v432PatchZone(ES.F._V432_CFG.es, 'es', t, 'Géminis', 4, true, t, 0).text;
  for (const t of ['en el año 2026 Casa de tu carta', 'tienes 5 casas', 'un viaje de 20 casas']) {
    assert.strictEqual(P(t), t, `es 误伤: ${t}`);
  }
  // 值本来正确 ⇒ 不动（幂等）
  const ok = 'Júpiter en Géminis en tu 4ª Casa';
  assert.strictEqual(P(ok), ok, 'es 值正确却仍被改写（幂等破坏）');
  assert.strictEqual(P(P('Júpiter en Géminis en tu 5ª Casa')), 'Júpiter en Géminis en tu 4ª Casa', 'es 二次跑漂移');
});

test('⑩ 支柱2 行为级 fr: `5ᵉ / 5e / 5ème / 5° maison` 与 `Maison 5` 一律纠值', () => {
  const P = (t) => FR.F._frPatchZone(t, 'Gémeaux', 4, true).text;
  for (const s of ['5ᵉ maison', '5e maison', '5ème maison', '5° maison', '5 e maison']) {
    assert.strictEqual(P(`dans la ${s}`), 'dans la 4ᵉ maison', `fr 形态漏改: ${s}`);
  }
  assert.strictEqual(P('dans la Maison 5'), 'dans la Maison 4', 'fr `Maison N` 回归');
  assert.strictEqual(P('dans la cinquième maison'), 'dans la quatrième maison', 'fr 拼写序数回归');
});

test('⑪ 支柱2 行为级 fr: 防误伤（年份 / 复数 / 值对幂等）', () => {
  const P = (t) => FR.F._frPatchZone(t, 'Gémeaux', 4, true).text;
  for (const t of ['en 2026 maison de ton thème', 'tu possèdes 5 maisons', 'un trajet de 20 maisons']) {
    assert.strictEqual(P(t), t, `fr 误伤: ${t}`);
  }
  const ok = 'dans la 4ᵉ maison';
  assert.strictEqual(P(ok), ok, 'fr 值正确却仍被改写（幂等破坏）');
  assert.strictEqual(P(P('dans la 5ᵉ maison')), 'dans la 4ᵉ maison', 'fr 二次跑漂移');
});

// ── 真实生产片段（逐字取自 2026-10-04 es 盘 Ushuaia 原始产出）──
const ES_FIX = '### ORÁCULO DE RIQUEZA · REVELACIÓN FINANCIERA\n\n'
  + 'Ahora, examinemos las fuerzas planetarias que gobiernan tu destino financiero en esta carta natal. '
  + '**Júpiter, el gran benefactor, se encuentra en Géminis en tu 5ª Casa** — la misma casa que ocupa tu tu Sol. '
  + 'Esta es una configuración extraordinaria: el planeta de la expansión, la suerte y la abundancia.\n\n'
  + '### Julio 2026: Sol en Cáncer · Casa 7\nEl Sol entra en Cáncer este mes.\n';
const ES_CH = {
  Sun: { sign: 'Cancer', house: 4 }, Moon: { sign: 'Cancer', house: 4 }, Mercury: { sign: 'Gemini', house: 4, retrograde: true },
  Venus: { sign: 'Taurus', house: 3 }, Mars: { sign: 'Sagittarius', house: 10, retrograde: true }, Jupiter: { sign: 'Gemini', house: 4 },
  Saturn: { sign: 'Gemini', house: 4 }, Uranus: { sign: 'Aquarius', house: 12, retrograde: true },
  Neptune: { sign: 'Aquarius', house: 11, retrograde: true }, Pluto: { sign: 'Sagittarius', house: 10, retrograde: true },
};
// Placidus 真实宫头（astro_matrix.py 对 Ushuaia 盘实测：H1 Pisces 12.01° …）
const SHIFT = { 1: 330, 2: 0, 3: 0, 4: 60, 5: 90, 6: 120, 7: 150, 8: 180, 9: 180, 10: 240, 11: 270, 12: 300 };
const DEG = { 1: 12.01, 2: 2.55, 3: 29.84, 4: 5.23, 5: 14.20, 6: 16.66, 7: 12.01, 8: 2.55, 9: 29.84, 10: 5.23, 11: 14.20, 12: 16.66 };
const M_ES = {
  months: [],
  meta: {
    computed_houses: ES_CH, sun_sign: 'Cancer', rising_sign: 'Pisces',
    house_cusps_full: Object.fromEntries(Array.from({ length: 12 }, (_, i) => ['house_' + (i + 1), { cusp_degree: (DEG[i + 1] + SHIFT[i + 1]) % 360 }])),
  },
};
const runEs = (F, text) => F._v432LockLeadingNatal(F.applyTruthLocksEnEsZh(text, 'es', M_ES, 'yearly'), 'es', M_ES, 'yearly');

test('⑫ 偏移坐标系第3例 行为级: 区间相交不得产生 artifact（真实生产片段复现）', () => {
  const out = runEs(CHAIN.F, ES_FIX);
  assert.ok(out.includes('Géminis en tu 4ª Casa'), '本命真值未被纠正: ' + JSON.stringify(out.slice(150, 330)));
  assert.ok(out.includes('tu tu Sol'), '「tu tu Sol」被吃掉空格（区间相交串长错位 artifact 复发）: ' + JSON.stringify(out.slice(150, 330)));
  assert.ok(!out.includes('tu tuSol'), '产出 `tu tuSol`（凭空删除空格）: ' + JSON.stringify(out.slice(150, 330)));
  // 区间相交时**绝不允许**把前一句的星座伪造进本句（旧版把 Júpiter 的 Géminis 改成 Cáncer）
  assert.ok(!/se encuentra en Cáncer en tu/.test(out), '越界命中把 Júpiter 从句的星座伪造成 Cáncer（真值错配注入）');
});

test('⑬ 偏移坐标系第3例: _v432ResolveOverlaps 单元语义（相交丢后起者 / 无相交零改动 / 保持入参顺序）', () => {
  const R = CHAIN.F._v432ResolveOverlaps;
  // 抽取自真实盘的相交对：[2459,2552) 与 [2483,2553) ⇒ 保留先起者
  const hits = [[2483, 2553, 'B'], [2459, 2552, 'F']];
  const r = R(hits, 'test');
  assert.strictEqual(r.length, 1, '未丢弃相交命中');
  assert.strictEqual(r[0][0], 2459, '丢弃的不是后起者（先起者胜纪律）');
  // 无相交 ⇒ 逐元素相同（同一引用，零回归）
  const clean = [[10, 20, 'a'], [30, 40, 'b']];
  assert.strictEqual(R(clean, 'test'), clean, '无相交时未原样返回（引入了无谓重排）');
  // 相邻但不重叠（e1 === s2）⇒ 均保留（_v432LockNatal 的 fwd/bwd 常态）
  assert.strictEqual(R([[10, 20, 'a'], [20, 30, 'b']], 'test').length, 2, '相邻区间被误判为相交');
  // 零长插入与会话内区间相交 ⇒ 丢弃后起者（保守：宁漏不改）
  assert.strictEqual(R([[10, 20, 'a'], [15, 15, '+']], 'test').length, 1, '零长命中落入已应用区间未被丢弃');
});

test('⑭ 支柱3 行为级: 真实宫头跨度集合（Placidus 跨宫）与回落', () => {
  const S = CHAIN.F._v512SignSpanHouses;
  const ADL = { house_cusps_full: Object.fromEntries([[292.8179], [314.1898], [338.9859], [9.4252], [45.0664], [81.0259], [112.8179], [134.1898], [158.9859], [189.4252], [225.0664], [261.0259]].map(([d], i) => ['house_' + (i + 1), { cusp_degree: d }])) };
  const si = (s) => ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'].indexOf(s);
  assert.deepEqual([...S(ADL, si('Aquarius'))].sort((a, b) => a - b), [1, 2], 'Aquarius 未识别为跨 H1+H2（H1 宫头 292.82°Cap / H2 宫头 314.19°Aqu）');
  assert.deepEqual([...S(ADL, si('Capricorn'))].sort((a, b) => a - b), [1, 12], 'Capricorn 未识别为跨 H12+H1');
  assert.deepEqual([...S(ADL, si('Sagittarius'))].sort((a, b) => a - b), [11, 12], 'Sagittarius 未识别为跨 H11+H12');
  // 完整性护栏
  assert.strictEqual(S({}, 10), null, '无 cusps 未回落 null（会绕开等宫制兜底）');
  assert.strictEqual(S({ house_cusps_full: { house_1: { cusp_degree: 1 } } }, 10), null, '结构不完整未整体放弃（猜测=编造）');
  assert.strictEqual(S(ADL, -1), null, '非法 si 未拒绝');
  // 等宫制（WholeSignFallback）⇒ 单宫（与退化公式一致，高纬降级盘行为不变）
  const WS = { house_cusps_full: Object.fromEntries(Array.from({ length: 12 }, (_, i) => ['house_' + (i + 1), { cusp_degree: (i * 30) % 360 }])) };
  assert.deepEqual([...S(WS, si('Aquarius'))], [11], '等宫制盘未退化回单宫（高纬降级盘会误弃权）');
});

test('⑮ 支柱3 行为级: 第 ⑥ 否决在真实宫头下弃权，等宫制下按原逻辑准入（真值源切换生效）', () => {
  const F = CHAIN.F;
  const cfg = F._V432_CFG.en;
  const mk = (house) => `### Chapter III: The Emotional Ledger\n\nThe Aquarius Sun in your ${house} House.\n`;
  const probe = (matrix, house) => {
    const t = mk(house);
    const i = t.indexOf('Sun');
    const cl = F._v432Clause(cfg, 'en', t, i, 3, true, {});
    return F._v512PossessiveNatal(cfg, 'en', t, i, 3, cl, matrix);
  };
  // Adelaide 真实宫头：Aquarius 跨 H1+H2 ⇒ `Aquarius … 1st House` 也是流年惯用式 ⇒ 弃权
  const ADL_CUSPS = { house_cusps_full: Object.fromEntries([[292.8179], [314.1898], [338.9859], [9.4252], [45.0664], [81.0259], [112.8179], [134.1898], [158.9859], [189.4252], [225.0664], [261.0259]].map(([d], i) => ['house_' + (i + 1), { cusp_degree: d }])) };
  const M_ADL_FULL = { months: [], meta: { rising_sign: 'Capricorn', house_cusps_full: ADL_CUSPS.house_cusps_full } };
  assert.strictEqual(probe(M_ADL_FULL, 1), false, '有真实宫头时 `Aquarius … 1st House` 未弃权（跨宫漏判 ⇒ 会误改流年句）');
  assert.strictEqual(probe(M_ADL_FULL, 2), false, '有真实宫头时 `Aquarius … 2nd House` 未弃权');
  // 对照：只有 rising_sign（无 cusps，模拟旧缓存/无出生时间）⇒ 等宫制 Capricorn 上升 ⇒ Aquarius=H2
  //   ⇒ `1st House` 与 2 不符 ⇒ 准入（返回 true）—— 证明真值源确实切换了
  const M_ADL_WS = { months: [], meta: { rising_sign: 'Capricorn' } };
  assert.strictEqual(probe(M_ADL_WS, 1), true, '闸门失效: 无 cusps 时等宫制兜底路径同样弃权（测不出真值源切换）');
  assert.strictEqual(probe(M_ADL_WS, 2), false, '无 cusps 时等宫制路径未弃权（v512 原行为回归）');
});

// ═══════════════════════════════════════════════════════════════════════
// ⑯ 缓存 v513
// ═══════════════════════════════════════════════════════════════════════
test('⑯ 缓存 v515（server.js 四站点 + purge 补 v514 双形态 + MIN_CACHE_VER 前移）', () => {
  const sites = [...src.matchAll(/wealth:v516/g)].length;
  assert.ok(sites >= 4, `server.js v514 站点不足 4: ${sites}`);
  assert.ok(!src.includes('wealth:v513'), 'server.js 残留 v513（漏改一站）');
  assert.ok(/wealth:v513:\*/.test(purgeSrc) && /wealth:v513-v2:\*/.test(purgeSrc), 'purge 脚本未补 v514 双形态');
  assert.ok(/MIN_CACHE_VER = 516/.test(yearlyTest), 'yearly 流式闸门基线未前移 v515');
});

// ═══════════════════════════════════════════════════════════════════════
// 【注入缺陷自测】—— 每条闸门必须能复刻旧缺陷并变红
// ═══════════════════════════════════════════════════════════════════════
test('⑰ 注入自测: 复刻 `const stdCached` → ① 必红（P0 崩溃回归可测）', () => {
  const hacked = src.replace('let stdCached = standardizeReport(cachedText);', 'const stdCached = standardizeReport(cachedText);');
  assert.notStrictEqual(hacked, src, '注入锚点未命中');
  assert.strictEqual(p0LetDeclared(hacked), false, '闸门失效: 改回 const 后 ① 仍判绿');
});

test('⑱ 注入自测: 剥离 es cfg 的 houseAbbr → ⑤/⑧ 必红', () => {
  const hacked = src.replace(/houseAbbr:\s*\/[^\n]*\n/, '');
  assert.notStrictEqual(hacked, src, '注入锚点未命中');
  assert.strictEqual(p2EsAbbrCfg(hacked), false, '闸门失效: 剥离 houseAbbr 后 ⑤ 仍判绿');
  const H = buildFrom(hacked, ES_SEEDS);
  const P = (t) => H.F._v432PatchZone(H.F._V432_CFG.es, 'es', t, 'Géminis', 4, true, t, 0).text;
  assert.strictEqual(P('Júpiter en Géminis en tu 5ª Casa'), 'Júpiter en Géminis en tu 5ª Casa',
    '闸门失效: 剥离第六式后 `5ª Casa` 仍被纠正（说明 ⑧ 测不到该形态）');
});

test('⑲ 注入自测: 剥离 hits 去交叉 → ⑥/⑫ 必红（区间相交 artifact 复现）', () => {
  const hacked = src.replace("  hits = _v432ResolveOverlaps(hits, lang + ' 本命锁');\n", '');
  assert.notStrictEqual(hacked, src, '注入锚点未命中');
  assert.strictEqual(overlapGuardWired(hacked), false, '闸门失效: 剥离去交叉后 ⑥ 仍判绿');
  const H = buildFrom(hacked, CHAIN_SEEDS);
  const out = H.F._v432LockLeadingNatal(H.F.applyTruthLocksEnEsZh(ES_FIX, 'es', M_ES, 'yearly'), 'es', M_ES, 'yearly');
  assert.ok(out.includes('tu tuSol'), '闸门失效: 剥离去交叉后仍未产出 `tu tuSol`（说明 ⑫ 测不到区间相交缺陷）');
});

test('⑳ 注入自测: 把 es 章名改回仅 `Chapter` → ③ 必红（口径矛盾复现）', async () => {
  const hacked = integritySrc.replace(
    "    chapters: _chRoman('Chapter', 'Cap[ií]tulo'),",
    "    chapters: _chRoman('Chapter'),");
  assert.notStrictEqual(hacked, integritySrc, '注入锚点未命中');
  const tmp = path.join(os.tmpdir(), `ks-e15-integrity-${process.pid}.mjs`);
  fs.writeFileSync(tmp, hacked);
  try {
    const H = await import(pathToFileURL(tmp).href + `?t=${Date.now()}`);
    const r = H.assessYearlyReportIntegrity(buildReport('es'), { lang: 'es', minChars: 0 });
    assert.notStrictEqual(r.metrics.chaptersFound, 5,
      '闸门失效: 章名只认英文后 es 仍判 5/5（说明 ③ 测不到本地化章名）');
    assert.ok(r.reasons.some((x) => /缺章节标记/.test(x)), '闸门失效: es 缺章未给出 reasons');
  } finally { fs.unlinkSync(tmp); }
});

test('㉑ 注入自测: 让真实宫头判定恒 null → ⑦/⑮ 必红（Placidus 对齐可测）', () => {
  const hacked = src.replace('  if (!meta || !(si >= 0 && si <= 11)) return null;',
    '  if (true) return null;\n  if (!meta || !(si >= 0 && si <= 11)) return null;');
  assert.notStrictEqual(hacked, src, '注入锚点未命中');
  assert.strictEqual(p3CuspsWired(hacked), true, '预检：结构判据对注入不敏感（应仍为 true，行为级才是判据）');
  const H = buildFrom(hacked, CHAIN_SEEDS);
  assert.strictEqual(H.F._v512SignSpanHouses({ house_cusps_full: {} }, 10), null, '注入后仍非 null（注入失效）');
  // 行为级：恒 null ⇒ 退回等宫制 ⇒ `Aquarius … 1st House` 反而准入（与 ⑮ 前半相反）
  const cfg = H.F._V432_CFG.en;
  const t = '### Chapter III: The Emotional Ledger\n\nThe Aquarius Sun in your 1st House.\n';
  const i = t.indexOf('Sun');
  const cl = H.F._v432Clause(cfg, 'en', t, i, 3, true, {});
  const ADL_CUSPS = { house_cusps_full: Object.fromEntries([[292.8179], [314.1898], [338.9859], [9.4252], [45.0664], [81.0259], [112.8179], [134.1898], [158.9859], [189.4252], [225.0664], [261.0259]].map(([d], i2) => ['house_' + (i2 + 1), { cusp_degree: d }])) };
  const M = { months: [], meta: { rising_sign: 'Capricorn', house_cusps_full: ADL_CUSPS.house_cusps_full } };
  assert.strictEqual(H.F._v512PossessiveNatal(cfg, 'en', t, i, 3, cl, M), true,
    '闸门失效: 恒 null 后 `Aquarius … 1st House` 仍弃权（说明 ⑮ 测不到真实宫头的作用）');
});
