// ═══ E100 闸门：泰语资产纯净化、周易真值映射与终章闭环（主公军令 2026-10-29）═══
// 四刀：① th/vi Token 高密度单列＋终章闭环守卫（ENDING SEAL GUARD）
//      ② Bazi lock 泰语分支（_e96LocalizeCompatBaziLock _e100Th——纯泰语命理口径）
//      ③ 周易 64 卦真值锁（_e100IchingHexLine——King Wen 序确定性选卦）＋塔罗译名归正
//      ④ synastry ratio 裸浮点→百分比（0.694 ⇒ 69.4%）
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const SERVER = read('server.js');
const APP = read('web/src/App.tsx');
const TAROT = read('web/src/lib/tarot.ts');
const AUTHBTN = read('web/src/components/AuthButton.tsx');
const ADV_API = read('api/ai-advisor.js');
const ADV_WEB = read('web/api/ai-advisor.js');
const PKG = JSON.parse(read('package.json'));

// ── E100-① Token 扩容（th/vi 高密度语种单列）＋终章闭环守卫 ──
test('E100-①-1 th/vi 高密度语种 Token 单列（月 7500 / 年 16000；es/fr/en 零改动）', () => {
  const i = SERVER.indexOf('const _e100HighDensity = /^(th|vi)$/i.test(String(lang || \'\'));');
  assert.ok(i !== -1, '_e100HighDensity 分流缺失');
  const seg = SERVER.slice(i, i + 500);
  assert.ok(seg.includes('_e100HighDensity ? 16000 : 12000'), '年报 th/vi 16000 档缺失');
  assert.ok(seg.includes('_e100HighDensity ? 7500 : 5500'), '月报 th/vi 7500 档缺失');
  // es/fr/en 旧档逐字保全
  assert.ok(seg.includes('_e94IsZh ? 7500 :'), 'zh 年报 7500 档漂移');
  assert.ok(seg.includes('_e94IsZh ? 3500 :'), 'zh 月报 3500 档漂移');
  assert.ok(seg.includes(': 12000);'), 'once 12000 档漂移');
});

test('E100-①-2 终章闭环守卫：月报/年报 ENDING SEAL GUARD＋✦ SOUL OS 封印签名', () => {
  const cnt = (SERVER.match(/ENDING SEAL GUARD — MANDATORY/g) || []).length;
  assert.strictEqual(cnt, 2, '月报与年报必须各有一条终章守卫指令');
  assert.ok(SERVER.includes('the fixed signature line "✦ SOUL OS" as the very last line'), '封印签名行指令缺失');
  assert.ok(SERVER.includes('Never end mid-sentence'), '禁中途断头指令缺失');
});

// ── E100-② Bazi lock 泰语分支（VM 实跑行为级）──
test('E100-②-1 th 分支行为级：合冲刑半合全泰语化、零英文关系词、零 CJK 残留', () => {
  // VM 抽取 _e96LocalizeCompatBaziLock 全函数体（花括号配平；E98 先例同法）
  const i = SERVER.indexOf('function _e96LocalizeCompatBaziLock(bl, lang) {');
  assert.ok(i !== -1, '_e96LocalizeCompatBaziLock 缺失');
  let depth = 0, started = false, end = -1;
  for (let j = SERVER.indexOf('{', i); j < SERVER.length; j++) {
    if (SERVER[j] === '{') { depth++; started = true; }
    else if (SERVER[j] === '}') { depth--; if (started && depth === 0) { end = j; break; } }
  }
  assert.ok(end !== -1, 'fn body unbalanced');
  const fn = eval('(' + SERVER.slice(i, end + 1) + ')');
  const bl = {
    lock: '八字命理数据锁 — 系统预计算真值，论述八字时唯一可信源\nA（1976-12-03 08:30）四柱：丙辰（年柱）己亥（月柱）己丑（日柱）丙寅（时柱）\nB（1997-10-18 14:00）四柱：丁丑（年柱）庚戌（月柱）癸巳（日柱）戊午（时柱）\n跨盘真实刑冲合害：辰戌相冲；亥巳相冲；丑戌相刑；丑巳半合，属巳酉丑局；寅戌半合，属寅午戌局并集成局：寅午戌\n真实年龄差：A 与 B 出生年份相差21年（引用此精确数字，严禁自行估算或篡改年龄差）',
    guard: 'GUARD_BASE',
  };
  const out = fn(bl, 'th');
  const t = out.lock;
  // 泰语命理术语命中（军令钦定口径）
  assert.ok(t.includes('การปะทะ Chen-Xu'), '相冲泰语化缺失：' + t.slice(0, 200));
  assert.ok(t.includes('แรงเสียดทาน Chou-Xu'), '相刑泰语化缺失');
  assert.ok(t.includes('ครึ่งไตรภาคีธาตุทอง'), '半合泰语化缺失（ครึ่งไตรภาคีธาตุทอง）');
  assert.ok(t.includes('ไตรภาคีรวม: ธาตุไฟ (ขาล-มะเมีย-จอ)'), 'Fire trine 泰语化缺失（集成局形态）');
  assert.ok(t.includes('ช่องว่างอายุจริง: A และ B เกิดห่างกัน 21 ปี'), '年龄差泰语化缺失');
  assert.ok(t.includes('เสาทั้งสี่'), '四柱泰语化缺失');
  assert.ok(t.includes('เสาปี'), '年柱泰语化缺失');
  // 英文关系词零残留（转译后的 lock 体内）
  assert.ok(!/ clash\b/.test(t), '英文 clash 残留');
  assert.ok(!/trine\b/.test(t), '英文 trine 残留');
  assert.ok(!/half-combination/.test(t), '英文 half-combination 残留');
  assert.ok(!/True age gap/.test(t), '英文年龄差残留');
  // lock 体内零 CJK（拼音化后中文干支/结构短语全转）
  const cjk = (t.match(/[\u4e00-\u9fa5]/g) || []).length;
  assert.strictEqual(cjk, 0, 'th lock 体内 CJK 残留 ' + cjk + ' 处');
  // guard 泰语铁律命中（根治「重生」中文渗漏与英文夹杂）
  assert.ok(out.guard.includes('ความบริสุทธิ์ของภาษา'), '泰语语言纯粹性铁律缺失');
  assert.ok(out.guard.includes('แผนภูมิดวงคู่สัมพันธ์'), 'coupled chart 泰语替代词缺失');
  assert.ok(out.guard.includes('การเกิดใหม่ทางจิตวิญญาณ'), '重生泰语替代词缺失');
  assert.ok(out.guard.includes('ฟ้าและดิน'), 'heaven/earth 泰语替代词缺失');
});

test('E100-②-2 es/fr/en 契约逐字保全（th 分支零外溢）', () => {
  const i = SERVER.indexOf('function _e96LocalizeCompatBaziLock(bl, lang) {');
  let depth = 0, started = false, end = -1;
  for (let j = SERVER.indexOf('{', i); j < SERVER.length; j++) {
    if (SERVER[j] === '{') { depth++; started = true; }
    else if (SERVER[j] === '}') { depth--; if (started && depth === 0) { end = j; break; } }
  }
  const fn = eval('(' + SERVER.slice(i, end + 1) + ')');
  const mk = () => ({ lock: '跨盘真实刑冲合害：辰戌相冲；丑戌相刑；真实年龄差：A 与 B 出生年份相差21年（禁估算）', guard: 'G' });
  const es = fn(mk(), 'es');
  assert.ok(es.lock.includes('choque') && es.lock.includes('fricción'), 'es 契约漂移');
  assert.ok(es.guard.includes('PUREZA DEL IDIOMA'), 'es guard 漂移');
  const fr = fn(mk(), 'fr');
  assert.ok(fr.lock.includes('choc') && fr.lock.includes('friction'), 'fr 契约漂移');
  assert.ok(fr.guard.includes('PURETÉ LINGUISTIQUE'), 'fr guard 漂移');
  const en = fn(mk(), 'en');
  assert.ok(en.lock.includes('clash') && en.lock.includes('friction'), 'en 契约漂移');
  assert.ok(en.guard.includes('LANGUAGE PURITY'), 'en guard 漂移');
});

// ── E100-② 输出侧 CJK 硬清洗兜底层（词级偶发渗漏「การ重生/การ收回」根治）──
test('E100-②-3 输出侧清洗：_e100StripCjk 行为级＋交付层接入（非 zh 双保险、zh 零触碰）', () => {
  const i = SERVER.indexOf('function _e100StripCjk(');
  assert.ok(i !== -1, '_e100StripCjk 缺失');
  let depth = 0, started = false, end = -1;
  for (let j = SERVER.indexOf('{', i); j < SERVER.length; j++) {
    if (SERVER[j] === '{') { depth++; started = true; }
    else if (SERVER[j] === '}') { depth--; if (started && depth === 0) { end = j; break; } }
  }
  const fn = eval('(' + SERVER.slice(i, end + 1) + ')');
  assert.strictEqual(fn('การเกิดใหม่ทางจิตวิญญาณ'), 'การเกิดใหม่ทางจิตวิญญาณ', '纯泰语零触碰');
  assert.strictEqual(fn('การเกิดใหม่ทางจิตวิญญาณการ重生'), 'การเกิดใหม่ทางจิตวิญญาณการ ', 'CJK 词剥除失败');
  assert.strictEqual(fn('และการ重生 ที่ลึกซึ้ง'), 'และการ ที่ลึกซึ้ง', '重生渗漏剥除失败（军令原句）');
  // 交付层：SSE 增量帧级＋终帧全文双保险（非 zh）；zh 零触碰
  // 🔴 E102-④ 后继化：vi 语种在 E100 CJK 剥离外再叠 _e102ViWash 英文/拼音清洗（双层）
  // 🛡️ E103-③ 后继化：SSE 帧级清洗链接入 fr/es 排版层（vi 层零改动，结构外扩）
  assert.ok(SERVER.includes("_sse.text(_e100NonZh ? (_e102ViLang ? _e102ViWash(_e100StripCjk(d)) : _e103FrLang ? _e103FrWash(_e100StripCjk(d)) : _e103EsLang ? _e103EsWash(_e100StripCjk(d)) : _e100StripCjk(d)) : ((reportType === 'yearly' && _e94IsZh) ? _e108LockQuarterRanges(d, _compat.timeCtx.windowStart) : d))"), 'SSE 帧级清洗缺失（E103 扩链形态）');
  assert.ok(SERVER.includes("if (_e100NonZh) insight = _e102ViLang ? _e102ViWash(_e100StripCjk(insight)) : _e100StripCjk(insight);"), '终帧清洗缺失（E102 vi 双层后继形态）');
  assert.ok(SERVER.includes("const _e100NonZh = !/^zh/i.test(String(lang || 'zh'));"), '非 zh 判定缺失');
});

// ── E100-③ 周易 64 卦真值锁＋塔罗译名归正 ──
test('E100-③-1 卦锁行为级：King Wen 64 卦真值、确定性选卦、th 行零 CJK', () => {
  const i = SERVER.indexOf('function _e100IchingHexLine(d1, d2, windowStart, L) {');
  assert.ok(i !== -1, '_e100IchingHexLine 缺失');
  let depth = 0, started = false, end = -1;
  for (let j = SERVER.indexOf('{', i); j < SERVER.length; j++) {
    if (SERVER[j] === '{') { depth++; started = true; }
    else if (SERVER[j] === '}') { depth--; if (started && depth === 0) { end = j; break; } }
  }
  const fn = eval('(' + SERVER.slice(i, end + 1) + ')');
  // 确定性：同输入恒同输出
  const a = fn('1976-12-03', '1997-10-18', '2026-10-01', 'th');
  const b = fn('1976-12-03', '1997-10-18', '2026-10-01', 'th');
  assert.strictEqual(a, b, '同输入必须同卦（确定性）');
  // th 行军令钦定格式：กั้วที่ N: 拼音 (泰语主题)
  assert.ok(/^กั้วที่ (\d+): [A-Za-z2 ]+ \([^)]+\)$/.test(a), 'th 卦行格式漂移：' + a);
  const n = Number(a.match(/^กั้วที่ (\d+):/)[1]);
  assert.ok(n >= 1 && n <= 64, '卦号必须在 King Wen 1~64');
  // th 行零 CJK（防中文卦名渗入泰语正文）
  assert.strictEqual((a.match(/[\u4e00-\u9fa5]/g) || []).length, 0, 'th 卦行 CJK 渗漏');
  // zh 行含中文卦名＋第N卦格式
  const zh = fn('1976-12-03', '1997-10-18', '2026-10-01', 'zh');
  assert.ok(/^第\d+卦：[\u4e00-\u9fa5]+（[A-Za-z2 ]+）— 卦意：/.test(zh), 'zh 卦行格式漂移：' + zh);
  // 跨窗流转：不同 window ⇒ 不同卦（允许碰撞，仅验证流转机制非恒定）
  const c = fn('1976-12-03', '1997-10-18', '2026-11-01', 'th');
  assert.ok(typeof c === 'string' && c.startsWith('กั้วที่'), '跨窗选卦失效');
  // 第 45 卦萃卦军令钦定泰语主题词在表内
  const serverFnBody = SERVER.slice(i, end + 1);
  assert.ok(serverFnBody.includes("'Cui', '萃', 'Gathering Together', 'การชุมนุมแห่งดวงใจ'"), '第 45 卦萃卦泰语主题词（军令钦定）缺失');
});

test('E100-③-2 卦锁注入：月报/年报 DATA LOCK 各携 IChing Hexagram 真值行＋指令禁自创卦名', () => {
  assert.ok(SERVER.includes('`IChing Annual Hexagram (sole truth): ${_e100IchingHexLine(d1, d2, timeCtx.windowStart, L)}`'), '年报卦锁注入缺失');
  assert.ok(SERVER.includes('`IChing Monthly Hexagram (sole truth): ${_e100IchingHexLine(d1, d2, timeCtx.windowStart, L)}`'), '月报卦锁注入缺失');
  assert.ok(SERVER.includes('NEVER invent, rename, or translate a hexagram by yourself'), '禁自创卦名指令缺失');
});

test('E100-③-3 塔罗女祭司译名归正：นางพราหมณี 废除 → ไพ่นักบวชหญิง', () => {
  // 真源 tarot.ts + AuthButton 镜像双双归正；dist 产物旧名随 build 失效（rebuild 由部署链保证）
  assert.ok(TAROT.includes("th:'ไพ่นักบวชหญิง'"), 'tarot.ts 泰语女祭司译名未归正');
  assert.ok(AUTHBTN.includes("th:'ไพ่นักบวชหญิง'"), 'AuthButton 镜像译名未归正');
  assert.ok(!TAROT.includes('นางพราหมณี'), 'tarot.ts 旧译名残留');
  assert.ok(!AUTHBTN.includes('นางพราหมณี'), 'AuthButton 旧译名残留');
});

// ── E100-④ synastry ratio 裸浮点→百分比 ──
test('E100-④ ratio 百分比化：两镜像 toFixed(3) 全废、百分比呈现', () => {
  for (const [name, src] of [['api/ai-advisor.js', ADV_API], ['web/api/ai-advisor.js', ADV_WEB]]) {
    assert.ok(src.includes('(ratio * 100).toFixed(1) + \'%\''), name + ' 百分比化缺失');
    assert.ok(!/ratio\.toFixed\(3\)/.test(src), name + ' 裸浮点残留');
  }
});

// ── E100-⑥ 存量作废：COMPAT_PERSIST_VERSION v2→v3→v4（月/年 Gate41 replay 全 MISS 强制重生）──
test('E100-⑥ 存量作废：COMPAT_PERSIST_VERSION（后继化：E102-⑤ 已升 v4）', () => {
  const PIPE = read('lib/reportPipeline.mjs');
  assert.ok(PIPE.includes("export const COMPAT_PERSIST_VERSION = 'compat_report.v5';"), '持久化版本须为 v5（🛡️ E103-⑤ 后继化：fr/es 旧口径作废；E102/E100 同款先例）');
  assert.ok(PIPE.includes('E103-⑤'), 'v5 升版注释（E103 军令记录）缺失');
  assert.ok(!PIPE.includes("'compat_report.v4';"), 'v4 字面量残留（旧存量作废不彻底）');
  assert.ok(!PIPE.includes("'compat_report.v3';"), 'v3 字面量残留（旧存量作废不彻底）');
  assert.ok(!PIPE.includes("'compat_report.v2';"), 'v2 字面量残留（旧存量作废不彻底）');
});

// ── 军规链基线（后继化：E102 入编后 77 段；e40-compat 恒 len-2、python 恒链尾）──
test('E100-⑤ 军规链基线（后继化：E102 升 77 段；e40-compat 恒 len-2、python 恒链尾）', () => {
  const parts = PKG.scripts['test:astro'].split('&&').map(s => s.trim()).filter(Boolean);
  assert.strictEqual(parts.length, 84, '基线 84（E109 升 84 段）');   // 🛡️ E107 后继化：81→82；E106 后继化：80→81；E103/E104 后继化：77→79
  assert.ok(parts[parts.length - 5].includes('e107'), 'e107 未居 e40-compat 前');   // 🛡️ E108 后继化：位置链整体再顺移一位
  assert.ok(parts[parts.length - 6].includes('e106'), 'e106 未居 e107 前');
  assert.ok(parts[parts.length - 7].includes('e105'), 'e105 未居 e106 前');
  assert.ok(parts[parts.length - 8].includes('e104'), 'e104 未居 e105 前');
  assert.ok(parts[parts.length - 9].includes('e103'), 'e103 未居 e104 前');
  assert.ok(parts[parts.length - 10].includes('e102'), 'e102 未居 e103 前');
  assert.ok(parts[parts.length - 2].includes('e40-compat'), 'e40-compat 未居 len-2');
  assert.ok(parts[parts.length - 1].includes('python'), 'python 未居链尾');
});
