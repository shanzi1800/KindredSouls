// ════════════════════════════════════════════════════════════════════════════
// E16/R11h 闸门 —— 「月标题识别 key 碰撞」与「英文宫位残渣本地化」
//
// 立项依据（2026-10-04 E16/R11g 线上 12 盘批测实锤的两处**真实产品缺陷**）:
//
//  ① 🔴 P0 —— `_v516MonthHeadKey` 第 ④ 分支**前缀碰撞**（vi）:
//      `tháng 1` 是 `tháng 10`/`tháng 11`/`tháng 12` 的前缀, 原实现按 i=0..11 首次命中
//      ⇒ `### Tháng 11 2026: …` 被识别成 **1 月** ⇒ 10/11/12 三月折叠为同一 key ⇒
//      下游 `dedupYearlyMonthTitles` 判为「同月重复标题」⇒ **整行清空 11、12 月标题**。
//      实测: s11 河内 12 个标题只剩 10 个（节距仍对齐 10 行 ⇒ 用户可见缺 2 个月）。
//     ⚠️ 症状是「静默删除」而非「报错」—— 必须靠**唯一性判据**才抓得住（非「能否认出」）。
//
//  ② 🔴 P1 —— `_v516RewriteMonthYear` vi 分支强制要求 `Năm`:
//      线上产出实为 `### Tháng 11 2026`（**无** `Năm`）⇒ 正则永不匹配 ⇒ 逐月真值写回**整体空转**。
//
//  ③ 🔴 P1 —— `_v516OutputHygiene` 只处理 es ⇒ fr/th/vi 的英文宫位残渣全盲:
//      实测 s5/vi `Sao Mộc tại 11 House`×38、s12/fr `… 7 House`×1。
//      ⚠️ 且 `_V432_LANGS = ['en','es','zh']` ⇒ fr/th/vi **不进** `applyTruthLocksEnEsZh`
//      ⇒ 卫生守卫必须另有调用点（`else` 分支 ×3）。
//
// 判据纪律: 每条关键判据都配「**注入缺陷自测**」——把源码复刻回旧缺陷形态, 断言判据变红。
//          不注入 = 无法证明判据有判别力。
// ════════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const SRC = fs.readFileSync(path.join(REPO, 'server.js'), 'utf-8');
const LINES = SRC.split('\n');

let pass = 0, fail = 0;
const ok = (name, cond, extra) => {
  if (cond) { pass++; console.log(`  ok ${pass + fail} - ${name}`); }
  else { fail++; console.log(`  not ok ${pass + fail} - ${name}${extra ? '  ⟵ ' + extra : ''}`); }
};
const eq = (name, got, want) => ok(name, got === want, `got=${JSON.stringify(got)} want=${JSON.stringify(want)}`);
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');

// ── 抽取区间: `function _v516Esc` → `_v516OutputHygiene` 结束 ──
//   ⚠️ 起点必须含 `_v516Esc`：它定义在 `_V516_MONTHS` **之前**，漏抽会 ReferenceError。
//      （这正是本区间自带转义器的设计意图 —— 见 server.js 该函数上方注释。）
const start = LINES.findIndex((l) => l.startsWith('function _v516Esc'));
const stop = LINES.findIndex((l) => l.startsWith('function lockYearlyMonthTitles'));
if (start < 0 || stop < 0 || stop <= start) { console.log('not ok 1 - 未能定位 _V516_* 抽取区间'); process.exit(1); }
const BLOCK = LINES.slice(start, stop).join('\n');

// 常量 seed: `_v516GlueRe` 惰性引用 SUN_SIGN_*（定义在文件后半段）
const grabArr = (name) => {
  const m = SRC.match(new RegExp(`const ${name} = \\[[^\\]]*\\];`));
  return m ? m[0] : `const ${name} = [];`;
};
const SEED = [grabArr('SUN_SIGN_EN'), grabArr('SUN_SIGN_ES'), grabArr('SUN_SIGN_FR')].join('\n');
const EXPORTS = ['_v516MonthHeadKey', '_v516RewriteMonthYear', '_v516OutputHygiene', '_V516_HOUSE_PLAIN', '_V516_MONTHS'];

function build(block) {
  const fn = new Function(`${SEED}\n${block}\nreturn { ${EXPORTS.join(', ')} };`);
  return fn();
}
let F6 = build(BLOCK);

console.log('TAP version 13');

// ══════════════════════════ A. 月标题识别唯一性（P0 闸门） ══════════════════════════
console.log('\n# A. 月标题识别 key 唯一性（P0 前缀碰撞）');
const VI_FY = [
  ['### Tháng 7 2026: Mặt Trời trong Ma Kết Nhà 5', 7, 2026],
  ['### Tháng 8 2026: Mặt Trời trong Bảo Bình Nhà 6', 8, 2026],
  ['### Tháng 9 2026: Mặt Trời trong Song Ngư Nhà 7', 9, 2026],
  ['### Tháng 10 2026: Mặt Trời trong Cự Giải Nhà 11', 10, 2026],
  ['### Tháng 11 2026: Mặt Trời trong Bọ Cạp Nhà 3', 11, 2026],
  ['### Tháng 12 2026: Mặt Trời trong Nhân Mã Nhà 4', 12, 2026],
  ['### Tháng 1 2027: Mặt Trời trong Ma Kết Nhà 3', 1, 2027],
  ['### Tháng 2 2027: Mặt Trời trong Bảo Bình Nhà 6', 2, 2027],
  ['### Tháng 3 2027: Mặt Trời trong Song Ngư Nhà 7', 3, 2027],
  ['### Tháng 4 2027: Mặt Trời trong Bạch Dương Nhà 8', 4, 2027],
  ['### Tháng 5 2027: Mặt Trời trong Kim Ngưu Nhà 9', 5, 2027],
  ['### Tháng 6 2027: Mặt Trời trong Song Tử Nhà 10', 6, 2027],
];
const viKeys = VI_FY.map(([h]) => F6._v516MonthHeadKey(h, 'vi'));
const viDistinct = new Set(viKeys.filter(Boolean).map((k) => k.y + '-' + k.mo));
eq('A1 vi 12 个财年标题 ⇒ 12 个互不相同的 key', viDistinct.size, 12);

const viMismatch = VI_FY.filter(([h, mo, y], i) => {
  const k = viKeys[i];
  return !k || k.mo !== mo || k.y !== y;
}).map(([h]) => h.slice(4, 22));
ok('A2 vi 逐条 mo/y 与真值一致（含 Tháng 10/11/12）', viMismatch.length === 0, JSON.stringify(viMismatch));
eq('A2b Tháng 10 2026 → mo=10', F6._v516MonthHeadKey('### Tháng 10 2026: x', 'vi')?.mo, 10);
eq('A2c Tháng 11 2026 → mo=11', F6._v516MonthHeadKey('### Tháng 11 2026: x', 'vi')?.mo, 11);
eq('A2d Tháng 12 2026 → mo=12', F6._v516MonthHeadKey('### Tháng 12 2026: x', 'vi')?.mo, 12);

// 四语并集：es / fr / th / en 各自的 12 月唯一性
const ES12 = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const FR12 = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const thHead = (i) => ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'][i];
for (const [lang, names] of [['es', ES12], ['fr', FR12]]) {
  const ks = names.map((n) => F6._v516MonthHeadKey(`### ${n} 2026: X`, lang));
  eq(`A3 ${lang} 12 月名 ⇒ 12 个不同 key`, new Set(ks.filter(Boolean).map((k) => k.y + '-' + k.mo)).size, 12);
}
const thKs = Array.from({ length: 12 }, (_, i) => F6._v516MonthHeadKey(`### ${thHead(i)} 2569: X`, 'th'));
eq('A4 th 12 月名（佛历 2569）⇒ 12 个不同 key 且年=2026', new Set(thKs.filter(Boolean).map((k) => k.y + '-' + k.mo)).size, 12);
eq('A4b th 佛历换算 กรกฎาคม พ.ศ. 2569 → {2026,7}', JSON.stringify(F6._v516MonthHeadKey('### กรกฎาคม พ.ศ. 2569: X', 'th')), JSON.stringify({ y: 2026, mo: 7 }));
// 泰语星座简写不得被当成月份名
eq('A5 th 星座简写行不误判为月标题', F6._v516MonthHeadKey('### ดวงอาทิตย์ในเมษ 2026', 'th'), null);

// ── A6/A7 注入缺陷自测（复刻**旧缺陷全形态**） ──
//   ⚠️ 关键: 修复是**双层**的（① `(?!\d)` ② 长词倒序）。只回退一层**复现不出**旧缺陷 ——
//      这正是「注入必须复刻旧缺陷」的意义: 单层回退若仍绿, 说明另一层已足够, 判据需照样本设计。
const INJ_A6 = BLOCK
  .replace(/const order = words\.map\(\(w, i\) => \[w, i \+ 1\]\)\.sort\(\(a, b\) => b\[0\]\.length - a\[0\]\.length\);\n    for \(const \[w, mo\] of order\) \{/,
    'for (let i = 0; i < 12; i++) {\n      const w = words[i], mo = i + 1;')
  .replace('(?!\\\\d)', '');
ok('A6(inj) 旧缺陷全形态注入生效（i 顺序遍历 + 无 (?!\\d)）', INJ_A6 !== BLOCK && INJ_A6 !== BLOCK);
if (INJ_A6 !== BLOCK) {
  const Fi = build(INJ_A6);
  const ks = VI_FY.map(([h]) => Fi._v516MonthHeadKey(h, 'vi'));
  const d = new Set(ks.filter(Boolean).map((k) => k.y + '-' + k.mo)).size;
  ok('A6(inj) 旧缺陷复现 ⇒ vi 唯一 key 塌缩（<12）', d < 12, `distinct=${d}（应 < 12）`);
  eq('A6(inj)-b 旧缺陷下 Tháng 11 2026 被误判为 1 月', Fi._v516MonthHeadKey('### Tháng 11 2026: x', 'vi')?.mo, 1);
}
// 第二层防护: 只回退「长词倒序」（保留 `(?!\d)`）⇒ 唯一性仍必须成立。
const INJ_A7 = BLOCK.replace(
  'const order = words.map((w, i) => [w, i + 1]).sort((a, b) => b[0].length - a[0].length);',
  'const order = words.map((w, i) => [w, i + 1]);');
ok('A7(inj) 单层回退（仅去长词倒序）注入生效', INJ_A7 !== BLOCK);
if (INJ_A7 !== BLOCK) {
  const Fi = build(INJ_A7);
  const d7 = new Set(VI_FY.map(([h]) => Fi._v516MonthHeadKey(h, 'vi')).filter(Boolean).map((k) => k.y + '-' + k.mo)).size;
  eq('A7(inj) 仅靠 (?!\\d) 即可保唯一性（不依赖长词倒序）', d7, 12);
}

// ══════════════════════ B. 月标题写回（vi `Năm` 可省） ══════════════════════
console.log('\n# B. 月标题真值写回（vi Năm 可省形态）');
const rw1 = F6._v516RewriteMonthYear('### Tháng 7 2026: Mặt Trời trong Ma Kết Nhà 5', 'vi', 2026, 11);
eq('B1 无 Năm 形态：Tháng 7 2026 → Tháng 11 2026（不凭空加 Năm）', rw1, '### Tháng 11 2026: Mặt Trời trong Ma Kết Nhà 5');
const rw2 = F6._v516RewriteMonthYear('### Tháng 11 Năm 2026: X', 'vi', 2026, 12);
eq('B2 有 Năm 形态：保留 Năm', rw2, '### Tháng 12 Năm 2026: X');
eq('B3 幂等：已正确的行原样返回', F6._v516RewriteMonthYear('### Tháng 11 2026: X', 'vi', 2026, 11), '### Tháng 11 2026: X');
eq('B3b 幂等：再跑一次不变', F6._v516RewriteMonthYear(rw1, 'vi', 2026, 11), rw1);
eq('B4 跨年写回：Tháng 12 2026 → Tháng 1 2027', F6._v516RewriteMonthYear('### Tháng 12 2026: X', 'vi', 2027, 1), '### Tháng 1 2027: X');

const INJ_B = BLOCK.replace(
  "return line.replace(/Tháng\\s*\\d{1,2}(\\s*Năm)?\\s*\\d{4}/i,",
  "return line.replace(/Tháng\\s*\\d{1,2}\\s*Năm\\s*\\d{4}/i,");
ok('B5(inj) 旧缺陷（强制 Năm）注入生效', INJ_B !== BLOCK);
if (INJ_B !== BLOCK) {
  const Fi = build(INJ_B);
  const bad = Fi._v516RewriteMonthYear('### Tháng 7 2026: X', 'vi', 2026, 11);
  ok('B5(inj) 旧缺陷复现 ⇒ 写回空转（月份未被改）', bad === '### Tháng 7 2026: X', `got=${bad}`);
}

// ══════════════════════ C. 输出卫生：英文 `N House` → 本地化 ══════════════════════
console.log('\n# C. 输出卫生（英文 N House 残渣本地化）');
const HY = [
  ['vi', 'Sao Mộc tại 11 House có nghĩa là sự nghiệp', 'Nhà 11'],
  ['fr', 'Jupiter en 7 House apporte des ressources', 'Maison 7'],
  ['th', 'ดาวพฤหัสบดีใน 5 House นำมาซึ่งโชคลาภ', 'ภพที่ 5'],
  ['es', 'Júpiter en el 7 House trae recursos', 'en la Casa 7'],
];
for (const [lang, src, wantSub] of HY) {
  const got = F6._v516OutputHygiene(src, lang);
  ok(`C1 ${lang}: \`N House\` → 本地化（含 "${wantSub}"）`, got.includes(wantSub) && !/\d\s+House\b/.test(got), `got=${got}`);
}
// 值不变（只换形态）
eq('C2 只换形态、绝不改值：宫位号保持 11', /\b11\b/.test(F6._v516OutputHygiene('Sao Mộc tại 11 House', 'vi')), true);
// 幂等
const h1 = F6._v516OutputHygiene('Jupiter en 7 House', 'fr');
eq('C3 幂等：二次调用不变', F6._v516OutputHygiene(h1, 'fr'), h1);
// `House 7` 形态
eq('C4 `House 7` 形态亦归一', F6._v516OutputHygiene('Jupiter in House 7', 'fr'), 'Jupiter in Maison 7');
// en 不动
eq('C5 en 不受影响（House 为原生形态）', F6._v516OutputHygiene('Jupiter in the 7th House', 'en'), 'Jupiter in the 7th House');

const INJ_C = BLOCK.replace('const _V516_HOUSE_PLAIN = { es: \'Casa\', fr: \'Maison\', th: \'ภพที่\', vi: \'Nhà\' };',
  'const _V516_HOUSE_PLAIN = { es: \'Casa\' };');
ok('C6(inj) 旧缺陷（仅 es）注入生效', INJ_C !== BLOCK);
if (INJ_C !== BLOCK) {
  const Fi = build(INJ_C);
  const bad = ['vi', 'fr', 'th'].map((l) => Fi._v516OutputHygiene('Sao Mộc tại 11 House', l)).join('|');
  ok('C6(inj) 旧缺陷复现 ⇒ fr/vi/th 残渣原样穿透', /House/.test(bad), `got=${bad}`);
}

// ══════════════════════════ D. 结构契约（源码文本 + 调用点） ══════════════════════════
console.log('\n# D. 结构契约');
const CODE = stripComments(SRC);
eq('D1 th 占星宫位词取 `ภพที่`（非房屋 `บ้าน`）', F6._V516_HOUSE_PLAIN.th, 'ภพที่');
eq('D2 _V516_HOUSE_PLAIN 覆盖 es/fr/th/vi', Object.keys(F6._V516_HOUSE_PLAIN).sort().join(','), 'es,fr,th,vi');
// fr/th/vi 不进真值锁白名单（保守侧），但必须各有卫生守卫 else 分支
const V432 = /const _V432_LANGS = \[([^\]]*)\];/.exec(SRC);
eq('D3 `_V432_LANGS` 保持保守白名单（不得擅自放开 fr/th/vi）', (V432 ? V432[1] : '').replace(/['"\s]/g, ''), 'en,es,zh');
for (const [name, decl] of [['非流式', 'reportContent'], ['流式', 'streamText'], ['落库前', 'cleanedText']]) {
  const hit = CODE.includes(`else ${decl} = _v516OutputHygiene(${decl}, lang);`);
  ok(`D4 ${name}路径存在 fr/th/vi 卫生守卫 else 分支`, hit);
}
// 月标题识别必须走统一真源（三处同源）
const callSites = (CODE.match(/_v516MonthHeadKey\(/g) || []).length;
ok('D5 `_v516MonthHeadKey` 至少 4 处调用（定义 1 + 三处同源调用点）', callSites >= 4, `count=${callSites}`);
// dedupYearlyMonthTitles 依赖 key 唯一性 —— 显式登记依赖关系
ok('D6 `dedupYearlyMonthTitles` 按 key 分组（依赖 A1 唯一性，故 A1 为 P0）',
  /dedupYearlyMonthTitles[\s\S]{0,900}?byKey\.get\(key\)\.push\(i\)/.test(CODE));

console.log(`\n# pass ${pass} # fail ${fail}`);
if (fail) process.exit(1);
