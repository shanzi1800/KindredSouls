// ═══════════════════════════════════════════════════════════════════════
// 🛡️ E25-P2/D: 星历日期门禁（lockEphemerisDates）射程 es/en/zh → **+fr/th/vi** 回归闸门
//
// 缺陷（2026-10-08 根因 D）：
//   本锁在 E25-P1② 落地时白名单只有当时的一等语种 ⇒ fr/th/vi **零日期兜底**。
//   线上 fr 年报实证：水逆日期采信了 EN prompt 里硬编码的事实表（10-7 / 11-29），
//   而引擎真值是 2026-10-23 → 2026-11-13 —— 无人纠正。
//
// 修复：射程扩至六语 + 各语种 DATE_RE/RETRO_RE/DIRECT_RE/fmtDate 原生分支。
//   ⚠️ 关键陷阱（本闸门专门守住）：`fmtDate` 的 `else` 分支原本对**一切非 es/zh 语言**
//     回写英文序「July 24」—— 若只放行射程而不补分支，fr/th/vi 日期会被改写成英文形态
//     （比不改更糟）。故 A3 静态 + B 行为双判据锁死。
//
// 纪律：抽取 server.js 真源装配；六语各配行为用例；注入自测证明判据会红。
// ═══════════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { indexDecls } from './tools/extract_decls.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf-8');

const NEED = ['_TH_PLANET', '_VI_PLANET', '_FR_PLANET', '_V432_NAME', '_V482_TRANSIT_KEYS',
  '_EPHEM_DAYMON', '_EPHEM_MON_ALIAS', '_EPHEM_MON_IDX', '_EPHEM_L10N_NAME',
  '_ephemDateWindow', '_v444Esc', 'lockEphemerisDates'];
function build(source = SRC) {
  const d = indexDecls(source);
  for (const n of NEED) if (!d.has(n)) throw new Error('缺声明: ' + n);
  const code = NEED.slice().sort((a, b) => source.indexOf(d.get(a)) - source.indexOf(d.get(b))).map((n) => d.get(n)).join('\n\n');
  return new Function(code + '\nreturn { lockEphemerisDates };')();
}
const F = build();

// 引擎真值口径（与 /tmp/truth_fr.json 同源：2026 水逆 #3 起点 10-23 / 顺行 11-13）
const MATRIX = {
  ephemeris_chronicle: {
    by_planet: {
      mercury: [
        { date: '2026-10-23', type: 'RETROGRADE' },
        { date: '2026-11-13', type: 'DIRECT' },
      ],
    },
  },
};

const CASES = [
  // ── 新射程：fr ──
  ['fr', 'Mercure sera rétrograde le 7 octobre 2026.', 'Mercure sera rétrograde le 23 octobre 2026.', 'fr 水逆起点 7→23'],
  ['fr', 'Mercure redevient direct le 30 novembre 2026.', 'Mercure redevient direct le 13 novembre 2026.', 'fr 顺行日 30→13'],
  ['fr', 'Mercure rétrograde le 1er octobre 2026.', 'Mercure rétrograde le 23 octobre 2026.', 'fr 序数日 1er'],
  ['fr', 'Mercure rétrograde le 24 aout 2026.', 'Mercure rétrograde le 23 octobre 2026.', 'fr 重音脱落月名'],
  // ── 新射程：th ──
  ['th', 'ดาวพุธจะถอยหลังในวันที่ 7 ตุลาคม 2026', 'ดาวพุธจะถอยหลังในวันที่ 23 ตุลาคม 2026', 'th 水逆起点 7→23'],
  ['th', 'ดาวพุธกลับเดินหน้าในวันที่ 30 พฤศจิกายน 2026', 'ดาวพุธกลับเดินหน้าในวันที่ 13 พฤศจิกายน 2026', 'th 顺行日 30→13'],
  ['th', 'ดาวพุธถอยหลัง 7 ต.ค. 2026', 'ดาวพุธถอยหลัง 23 ตุลาคม 2026', 'th 月名缩写'],
  // ── 新射程：vi ──
  ['vi', 'Sao Thủy nghịch hành vào ngày 7 tháng 10 năm 2026', 'Sao Thủy nghịch hành vào ngày 23 tháng 10 năm 2026', 'vi 水逆起点 7→23'],
  ['vi', 'Sao Thủy thuận hành vào ngày 30 tháng 11 năm 2026', 'Sao Thủy thuận hành vào ngày 13 tháng 11 năm 2026', 'vi 顺行日 30→13'],
  // ── 既有射程回归（必须逐字节不变）──
  ['en', 'Mercury retrograde on October 7, 2026.', 'Mercury retrograde on October 23, 2026.', 'en 回归'],
  ['es', 'Mercurio retrógrado el 7 de octubre de 2026.', 'Mercurio retrógrado el 23 de octubre de 2026.', 'es 回归'],
  ['zh', '水星于10月7日开始逆行。', '水星于10月23日开始逆行。', 'zh 回归（判据路径逐字节不变）'],
];

const NEGS = [
  ['fr', 'Le 7 octobre 2026, votre Maison 9 sera activée.', 'fr 无行星词'],
  ['fr', 'Mercure rétrograde en 2026.', 'fr 无日号'],
  ['th', 'วันที่ 7 ตุลาคม 2026 เป็นวันดี', 'th 无行星词'],
  ['vi', 'Ngày 7 tháng 10 năm 2026 rất tốt', 'vi 无行星词'],
  ['fr', 'Mercure rétrograde le 23 octobre 2026.', 'fr 正确日期零改动'],
  ['th', 'ดาวพุธถอยหลัง 23 ตุลาคม 2026', 'th 正确日期零改动'],
  ['vi', 'Sao Thủy nghịch hành ngày 23 tháng 10 năm 2026', 'vi 正确日期零改动'],
  ['zh', '水星于10月23日开始逆行。', 'zh 正确值零改动'],
];

// ═══════════════════════════════ A 静态 ═══════════════════════════════

test('A1 语言白名单已扩至六语（且 zh/en/es 保留）', () => {
  const body = SRC.match(/function lockEphemerisDates\([\s\S]*?\n(?=\/\/ ══)/)[0];
  const wl = body.match(/if \(!\[([^\]]*)\]\.includes\(lang\)\) return text;/);
  assert.ok(wl, '未找到语言白名单守卫');
  const langs = [...wl[1].matchAll(/'(\w+)'/g)].map((m) => m[1]);
  for (const l of ['es', 'en', 'zh', 'fr', 'th', 'vi']) assert.ok(langs.includes(l), `白名单缺 '${l}'`);
});

test('A2 fr/th/vi 行星名走既有唯一真源表（禁新写第二份名单）', () => {
  assert.ok(/_EPHEM_L10N_NAME = \{ fr: _FR_PLANET, th: _TH_PLANET, vi: _VI_PLANET \}/.test(SRC),
    '_EPHEM_L10N_NAME 必须**引用**既有表（根因 B 教训: 双份名单必然漂移）');
  assert.ok(/_V432_NAME\[lang\] \|\| _EPHEM_L10N_NAME\[lang\]/.test(SRC), 'NAME 解析未接 _EPHEM_L10N_NAME');
});

// 结构化区间 + 剥注释 + 折叠空白（防「注释里写了表达式」干扰 / 行内注释阻断跨行判据）
const flatOf = (from, to) => {
  const i0 = SRC.indexOf(from), i1 = SRC.indexOf(to);
  assert.ok(i0 >= 0 && i1 > i0, `区间定位失败: ${from} … ${to}`);
  return SRC.slice(i0, i1).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '').replace(/\s+/g, ' ');
};

test('A3 fmtDate 必须显式含 fr/th/vi 原生序分支（否则回写英文序 = 比不改更糟）', () => {
  const flat = flatOf('const fmtDate = ', '// 🛡️ E25-P1②: 扫描收集');
  for (const l of ['zh', 'es', 'fr', 'th', 'vi']) {
    assert.ok(flat.includes(`lang === '${l}'`), `fmtDate 缺 '${l}' 分支`);
  }
  assert.ok(/lang === 'fr' \? `\$\{d\} \$\{_EPHEM_DAYMON\.fr\[m - 1\]\}`/.test(flat), 'fr 分支非「日+月名」原生序');
  assert.ok(/lang === 'th' \? `\$\{d\} \$\{_EPHEM_DAYMON\.th\[m - 1\]\}`/.test(flat), 'th 分支非「日+月名」原生序');
  assert.ok(/lang === 'vi' \? `\$\{d\} tháng \$\{m\}`/.test(flat), 'vi 分支非「日+tháng+月号」原生序');
});

test('A4 DATE_RE 六语分支齐备（fr 带年份防误伤 lookbehind；vi 用 tháng 月号形态）', () => {
  const flat = flatOf('const DATE_RE = ', 'const toMD = ');
  assert.ok(/lang === 'fr' \?/.test(flat), 'DATE_RE 缺 fr 分支');
  assert.ok(/lang === 'th' \?/.test(flat), 'DATE_RE 缺 th 分支');
  assert.ok(/lang === 'vi' \?/.test(flat), 'DATE_RE 缺 vi 分支');
  assert.ok(flat.includes('(?<![\\d.,])'), 'fr 分支缺 `(?<![\\d.,])`（年份/小数会被当日期）');
  assert.ok(/tháng\\s\+\(\\d\{1,2\}\)/.test(flat), 'vi 分支未捕获 tháng 月号（`tháng 1` 前缀老坑）');
});

// ═══════════════════════════════ B 行为 ═══════════════════════════════

test('B1 六语吸附实测（12 例）', () => {
  const fails = [];
  for (const [lang, input, want, label] of CASES) {
    const got = F.lockEphemerisDates(input, lang, MATRIX, 'yearly');
    if (got !== want) fails.push(`[${lang}] ${label}\n   in  =${input}\n   got =${got}\n   want=${want}`);
  }
  assert.deepStrictEqual(fails, [], 'B1 失败:\n' + fails.join('\n'));
});

test('B2 否定用例：无行星词/无日号/已是正确值 ⇒ 零改动（宁漏不改）', () => {
  const fails = [];
  for (const [lang, input, label] of NEGS) {
    const got = F.lockEphemerisDates(input, lang, MATRIX, 'yearly');
    if (got !== input) fails.push(`[${lang}] ${label}: ${got}`);
  }
  assert.deepStrictEqual(fails, [], 'B2 失败（误改）:\n' + fails.join('\n'));
});

// ═══════════════════════════════ C 注入缺陷自测 ═══════════════════════════════

test('C1 注入缺陷①：白名单回退至 [es,en,zh] ⇒ fr/th/vi 用例必须全红', () => {
  const GOOD = "if (!['es', 'en', 'zh', 'fr', 'th', 'vi'].includes(lang)) return text;";
  const BAD = "if (!['es', 'en', 'zh'].includes(lang)) return text;";
  assert.ok(SRC.includes(GOOD), '锚点漂移');
  const injected = SRC.replace(GOOD, BAD);
  assert.notStrictEqual(injected, SRC, '注入未真的改变源码');
  const G = build(injected);
  const red = CASES.filter(([lang, input, want]) => G.lockEphemerisDates(input, lang, MATRIX, 'yearly') !== want).length;
  assert.ok(red >= 9, `白名单回退后仅 ${red} 例变红（应 ≥9：fr×4 + th×3 + vi×2）`);
});

test('C2 注入缺陷②：删除 fmtDate 的 fr/th/vi 分支 ⇒ 回写英文序，用例必须变红', () => {
  const FR = /: lang === 'fr' \? `\$\{d\} \$\{_EPHEM_DAYMON\.fr\[m - 1\]\}`\n\s*: lang === 'th' \? `\$\{d\} \$\{_EPHEM_DAYMON\.th\[m - 1\]\}`\n\s*: lang === 'vi' \? `\$\{d\} tháng \$\{m\}`\n/;
  assert.ok(FR.test(SRC), 'fmtDate 三语分支锚点漂移');
  const injected = SRC.replace(FR, '');
  assert.notStrictEqual(injected, SRC, '注入未真的改变源码');
  const G = build(injected);
  const frCase = ['fr', 'Mercure sera rétrograde le 7 octobre 2026.', 'Mercure sera rétrograde le 23 octobre 2026.'];
  const out = G.lockEphemerisDates(frCase[1], frCase[0], MATRIX, 'yearly');
  assert.notStrictEqual(out, frCase[2], '删掉 fr 分支后仍产出正确值 —— 判据射程不足');
  assert.ok(/October 23/.test(out), `应回写成英文序（October 23）暴露陷阱，实际: ${out}`);
  assert.ok(!/octobre/.test(out), `英文序回写应使 fr 月名消失，实际: ${out}`);
});

test('C3 judge 不得恒真：正例 PASS、恒等返回的反例 FAIL', () => {
  const judge = (fn) => CASES.every(([lang, input, want]) => fn(input, lang, MATRIX, 'yearly') === want);
  assert.strictEqual(judge(F.lockEphemerisDates), true, '正例被误判');
  assert.strictEqual(judge((t) => t), false, '反例被误判绿（恒真探针）');
});
