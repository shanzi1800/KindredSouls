// ═══════════════════════════════════════════════════════════════════════════
// 🛡️ E24③/R11s P0 决战闸门：es 宫位「英文借形」咬合 + fr/th/vi 前端渲染补盲
// ═══════════════════════════════════════════════════════════════════════════
// 事故背景（2026-10-06 军师终极考核复核，探针实地取证）：
//  · P4（后端）西语本命宫位锁**结构性空转** —— `_V432_CFG.es` 三式（houseNum/houseOrd/houseAbbr）
//    全认 `Casa`，而 LLM 正文高频**借用英文宫位形态** `5º House` ⇒ finder 零匹配 ⇒ 本命宫位真值
//    锁不纠值。实测 3 处错配（Júpiter→H9 / Saturno→H5 / Plutón→H10，**星座全对、宫位错**）；
//    月标题恰用 `Casa N` 故 12/12 正常 ⇒ 缺陷只暴露在正文（典型「判据射程外盲区」）。
//  · 前端（fr/th/vi）扫盘暴露三处覆盖缺口：
//    ① vi/th 月标题 **12/12 全白** —— `KS_MONTH_ANY` 无该语月表（后端已把月标题归一为
//       `Tháng 7 2026:` / `กรกฎาคม [พ.ศ. 2569|2026]:`，**含泰历佛历形态**）；
//    ② 仪表盘跌白 —— fr 74 字 > 60 字硬阈；vi/th 仪表盘关键词不在 `chapterPatterns`；
//    ③ 报头跌白 —— vi `WEALTH ORACLE · …`、th `คำพยากรณ์…` 不在神谕锚点表
//       （⚠️ 泰文不属 `\w`，「泰字→空格」无词边界 ⇒ 旧 `\b` 收尾恒失败，必须改负向先行）。
//
// 本闸门纪律：
//   · 判据同源 —— 前端判据**逐字从产品源码抽取**（不另写正则）；后端走 `closureDecls` 抽真实声明。
//   · 每项配**注入缺陷自测**（回退修复即必须红），杜绝假防线。
//   · 零误报优先 —— 正文句绝不误判为标题；`Casa` 形态既有行为逐字不变（不回归）。
// ═══════════════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { closureDecls } from './tools/extract_decls.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(REPO, 'server.js'), 'utf-8');
const BOX = fs.readFileSync(path.join(REPO, 'web', 'src', 'components', 'SacredYearlyReportBox.tsx'), 'utf-8');

// ── 后端：抽取真实声明（closureDecls 自动传闭包） ──
const BE_SEEDS = ['_v432FindHouse', '_v432PatchZone'];
const { map: beMap } = closureDecls(SRC, BE_SEEDS);
const dropped = [];
for (const n of [...beMap.keys()]) { try { new vm.Script(beMap.get(n)); } catch { dropped.push(n); beMap.delete(n); } }
assert.strictEqual(dropped.length, 0, `VM 抽取的后端声明语法不完整: ${dropped.join(', ')}`);

function buildBE(hack) {
  const ctx = { console, __exports: {} };
  vm.createContext(ctx);
  const body = [...beMap.entries()]
    .sort((a, b) => SRC.indexOf(a[1]) - SRC.indexOf(b[1]))
    .map((e) => (hack && Object.prototype.hasOwnProperty.call(hack, e[0]) ? hack[e[0]] : e[1]))
    .join('\n\n');
  vm.runInContext(body + '\n__exports._V432_CFG = _V432_CFG;'
    + '\n__exports._v432FindHouse = _v432FindHouse;'
    + '\n__exports._v432PatchZone = _v432PatchZone;'
    + '\n__exports._V432_ES_ORD = _V432_ES_ORD;', ctx);
  return ctx.__exports;
}
const BE = buildBE();

// ── 前端：从 TSX 逐字抽取判据 ──
function grabDecl(src, name) {
  const re = new RegExp('^[ \\t]*(?:export )?const ' + name + ' = .+$', 'm');
  const m = src.match(re);
  assert.ok(m, `未找到前端声明 ${name}`);
  return m[0].replace(/^[ \t]*/, '').replace(/^export /, '');
}
// ⚠️ 顺序即拼装顺序：`KS_MONTH_VI/TH` 必须在 `KS_MONTH_ANY` 前、`KS_DASHBOARD_KW` 在
//   `isDashboardTitle` 前（否则 ReferenceError）。
const FE_TABLES = ['KS_MONTH_EN', 'KS_MONTH_ES', 'KS_MONTH_FR', 'KS_MONTH_VI', 'KS_MONTH_TH', 'KS_MONTH_ANY',
  'KS_ORACLE_ANCHOR', 'KS_DASHBOARD_KW', 'KS_MONTH_TITLE_RE', 'KS_ORACLE_ANCHOR_RE'];
const FE_DETS = ['prefix', 'isMultilangMonthTitle', 'isOracleAnchorTitle', 'isDashboardTitle'];
const FE_TABLE_LINES = FE_TABLES.map((n) => grabDecl(BOX, n));
const FE_DET_LINES = FE_DETS.map((n) => grabDecl(BOX, n));

function buildFE(over) {
  const t = (over && over.tables) || FE_TABLE_LINES;
  const d = (over && over.dets) || FE_DET_LINES;
  return new Function('textWithoutIcon',
    t.join('\n') + '\n' + d.join('\n')
    + '\nreturn { isMultilangMonthTitle, isOracleAnchorTitle, isDashboardTitle,'
    + ' KS_MONTH_TH, KS_MONTH_TITLE_RE, KS_DASHBOARD_KW };');
}
const detect = (s) => buildFE()(s);

// ── 真实线上样盘形态（逐字取自 v526 落库真稿） ──
const VI_MONTH_LINES = [
  'Tháng 7 2026: Mặt Trời trong Cự Giải Nhà 10 · Sự Khởi Đầu Của Di Sản',
  'Tháng 8 2026: Mặt Trời trong Sư Tử Nhà 11 · Sức Mạnh Của Mạng Lưới',
  'Tháng 9 2026: Mặt Trời trong Xử Nữ Nhà 12 · Sự Chuẩn Bị Nội Tâm',
  'Tháng 10 2026: Mặt Trời trong Thiên Bình Nhà 1 · Sự Cân Bằng',
  'Tháng 11 2026: Mặt Trời trong Bọ Cạp Nhà 2 · Sự Chuyển Hóa Tài Sản',
  'Tháng 12 2026: Mặt Trời trong Nhân Mã Nhà 3 · Sự Mở Rộng',
  'Tháng 1 2027: Mặt Trời trong Ma Kết Nhà 4 · Cội Nguồn',
  'Tháng 2 2027: Mặt Trời trong Bảo Bình Nhà 5 · Sự Sáng Tạo',
  'Tháng 3 2027: Mặt Trời trong Song Ngư Nhà 6 · Sức Khỏe',
  'Tháng 4 2027: Mặt Trời trong Bạch Dương Nhà 7 · Hợp Tác',
  'Tháng 5 2027: Mặt Trời trong Kim Ngưu Nhà 8 · Chuyển Hóa',
  'Tháng 6 2027: Mặt Trời trong Song Tử Nhà 9 · Giao Tiếp',
];
// ⚠️ 泰语两形态并存（实测 s6 = 公历 / s9 = 佛历 พ.ศ.）
const TH_MONTH_LINES = [
  'กรกฎาคม พ.ศ. 2569: ดวงอาทิตย์ในกรกฎ ภพที่ 6 · การเยียวยาและรากฐาน',
  'สิงหาคม พ.ศ. 2569: ดวงอาทิตย์ในสิงห์ ภพที่ 7 · การเปล่งประกาย',
  'กันยายน พ.ศ. 2569: ดวงอาทิตย์ในกันยา ภพที่ 8 · การแปลงสภาพทรัพย์สิน',
  'ตุลาคม พ.ศ. 2569: ดวงอาทิตย์ในตุลย์ ภพที่ 9 · การขยายขอบเขต',
  'พฤศจิกายน พ.ศ. 2569: ดวงอาทิตย์ในพิจิก ภพที่ 10 · การกลับมาของดวงอาทิตย์',
  'ธันวาคม พ.ศ. 2569: ดวงอาทิตย์ในธนู ภพที่ 11 · เครือข่ายและลาภะ',
  'มกราคม พ.ศ. 2570: ดวงอาทิตย์ในมังกร ภพที่ 12 · การพักผ่อน',
  'กุมภาพันธ์ พ.ศ. 2570: ดวงอาทิตย์ในกุมภ์ ภพที่ 1 · การเกิดใหม่',
  'มีนาคม พ.ศ. 2570: ดวงอาทิตย์ในมีน ภพที่ 2 · การเงินและคุณค่า',
  'เมษายน พ.ศ. 2570: ดวงอาทิตย์ในเมษ ภพที่ 3 · การสื่อสารและพี่น้อง',
  'พฤษภาคม พ.ศ. 2570: ดวงอาทิตย์ในพฤษภ ภพที่ 4 · บ้านและครอบครัว',
  'มิถุนายน พ.ศ. 2570: ดวงอาทิตย์ในมิถุน ภพที่ 5 · ความคิดสร้างสรรค์',
];
const TH_MONTH_LINES_CE = [
  'กรกฎาคม 2026: ดวงอาทิตย์ในกรกฎ ภพที่ 11 · การขยายเครือข่าย',
  'สิงหาคม 2026: ดวงอาทิตย์ในสิงห์ ภพที่ 12 · การถอยกลับภายใน',
];
// 仪表盘（实测形态；fr 74 字 = 旧 60 硬阈误杀样本）
const DASHBOARDS = [
  ['fr', 'Tableau de Bord des Métriques Centrales de la Richesse Annuelle 2026-2027'],
  ['fr', 'Tableau de Bord des Métriques de Richesse Annuelle 2026-2027'],
  ['es', 'Panel de Métricas Centrales de Riqueza Anual 2026-2027'],
  ['vi', 'Bảng Điều Khiển Chỉ Số Cốt Lõi Tài Chính Năm 2026-2027'],
  ['th', 'แผนควบคุมตัวชี้วัดความมั่งคั่ง 2026-2027'],
];
// 报头 / 终章锚点（实测形态）
const ORACLE_HEADS = [
  ['es', 'ORÁCULO DE RIQUEZA · REVELACIÓN FINANCIERA'],
  ['es', 'ORÁCULO FINAL DE RIQUEZA · La Contraseña para la Maestría'],
  ['vi', 'WEALTH ORACLE · FINANCIAL REVELATION'],
  ['th', 'คำพยากรณ์ความมั่งคั่ง · คำเปิดเผยทางการเงิน'],
  ['th', 'คำพยากรณ์ร่ำรวยขั้นสุด · รหัสแห่งการควบคุม'],
  ['en', 'FINAL WEALTH ORACLE · The Password to Mastery'],
];

// ═══════════════════ 一、后端 P4：es 宫位「英文借形」咬合 ═══════════════════
test('① es finder：`5º House` 系列必咬合（ord=abbrEn）；`Casa` 三形态行为不变（不回归）', () => {
  const es = BE._V432_CFG.es;
  assert.strictEqual(Object.prototype.toString.call(BE._v432FindHouse), '[object Function]', '未抽到 finder');
  const CASES = [
    // [zone, 期望值, 期望 ord]
    ['Júpiter en Escorpio en el 5º House', 5, 'abbrEn'],
    ['Saturno en Leo en el 2º House', 2, 'abbrEn'],
    ['Plutón en Sagitario en el 11º House', 11, 'abbrEn'],
    ['en el 7º house', 7, 'abbrEn'],
    ['en el 5 House', 5, 'abbrEn'],
    ['Marte en Aries en el 3° House', 3, 'abbrEn'],
    // ── 不回归：Casa 三形态 ──
    ['en la 5ª Casa', 5, 'abbr'],
    ['en la 5º Casa', 5, 'abbr'],
    ['Casa 5', 5, false],
    ['en la quinta casa', 5, true],
    // ── 越界 / 假号弃权 ──
    ['13º House', null, null],
    ['0º House', null, null],
    ['2026 House', null, null],
  ];
  for (const [z, v, ord] of CASES) {
    const h = BE._v432FindHouse(es, z, false);
    const got = h ? `${h.value}/${h.ord}` : 'null';
    const want = v === null ? 'null' : `${v}/${ord}`;
    assert.strictEqual(got, want, `${JSON.stringify(z)} → ${got}（期望 ${want}）`);
  }
});

test('② es 端到端：PatchZone 纠值**保形**（`5º House`→`9º House`）且**幂等**', () => {
  const es = BE._V432_CFG.es;
  const patch = (z, house) => BE._v432PatchZone(es, 'es', z, null, house, false, z, 0).text;
  // 纠值 + 保形（House 形态不得被写成 Casa）
  assert.strictEqual(patch('Júpiter en Escorpio en el 5º House', 9), 'Júpiter en Escorpio en el 9º House',
    '英文借形宫位未被纠值或形态被污染');
  assert.strictEqual(patch('Saturno en Leo en el 2º House', 5), 'Saturno en Leo en el 5º House');
  assert.strictEqual(patch('Plutón en Sagitario en el 11º House', 10), 'Plutón en Sagitario en el 10º House');
  // `Casa` 形态行为逐字不变
  assert.strictEqual(patch('en la 5ª Casa', 4), 'en la 4ª Casa');
  // 越界弃权（不产生破坏）
  assert.strictEqual(patch('13º House', 9), '13º House');
  // 幂等
  for (const [z, h] of [['Júpiter en Escorpio en el 5º House', 9], ['en la 5ª Casa', 4]]) {
    const once = patch(z, h);
    assert.strictEqual(patch(once, h), once, `非幂等: ${z}`);
  }
});

test('【注入缺陷自测】把 `houseAbbrEn` 从 es cfg 摘掉 → 判据① 必须红（回退即复现缺陷）', () => {
  const degraded = beMap.get('_V432_CFG').replace(/houseAbbrEn: \/[\s\S]*?\/i,/, '');
  assert.notStrictEqual(degraded, beMap.get('_V432_CFG'), '注入未生效（houseAbbrEn 未命中）');
  const D = buildBE({ _V432_CFG: degraded });
  const h = D._v432FindHouse(D._V432_CFG.es, 'Júpiter en Escorpio en el 5º House', false);
  assert.strictEqual(h, null, '闸门失效: 摘掉 houseAbbrEn 后仍能咬合英文借形宫位（判据① 未红）');
});

// ═══════════════════ 二、前端：vi/th 月标题 12/12 ═══════════════════
test('③ 越南语月标题 12/12 判为月标题（`Tháng N YYYY:`）', () => {
  let hit = 0;
  for (const line of VI_MONTH_LINES) {
    const r = detect(line);
    if (r.isMultilangMonthTitle) hit++;
    else console.log('  ❌ vi 未识别:', line);
    assert.ok(!r.isOracleAnchorTitle, `vi 月标题被误判为神谕锚点: ${line}`);
  }
  assert.strictEqual(hit, 12, `越南语月标题识别 ${hit}/12（应为 12/12）`);
});

test('④ 泰语月标题 12/12 判为月标题（**佛历 `พ.ศ. 2569`** 与公历两形态并存）', () => {
  let hit = 0;
  for (const line of [...TH_MONTH_LINES, ...TH_MONTH_LINES_CE]) {
    const r = detect(line);
    if (r.isMultilangMonthTitle) hit++;
    else console.log('  ❌ th 未识别:', line);
  }
  assert.strictEqual(hit, TH_MONTH_LINES.length + TH_MONTH_LINES_CE.length,
    `泰语月标题识别 ${hit}/${TH_MONTH_LINES.length + TH_MONTH_LINES_CE.length}`);
  // 佛历判据必须真的靠 `พ.ศ.` 容错（反向：把年份段拆掉即不匹配）
  assert.ok(detect('กรกฎาคม พ.ศ. 2569: ดวงอาทิตย์').isMultilangMonthTitle, '佛历形态未覆盖');
  assert.ok(!detect('กรกฎาคม พ.ศ. ไม่มี: ดวงอาทิตย์').isMultilangMonthTitle, '坏形态被误判为月标题');
});

test('【注入缺陷自测】把 vi/th 月表从 `KS_MONTH_ANY` 摘掉 → 判据③④ 必须红', () => {
  const degraded = 'const KS_MONTH_ANY = [KS_MONTH_EN, KS_MONTH_ES, KS_MONTH_FR].join(\'|\');';
  assert.notStrictEqual(degraded, FE_TABLE_LINES[FE_TABLES.indexOf('KS_MONTH_ANY')], '注入未生效');
  const idx = FE_TABLES.indexOf('KS_MONTH_ANY');
  const tables = FE_TABLE_LINES.map((x, i) => (i === idx ? degraded : x));
  const D = new Function('textWithoutIcon',
    tables.join('\n') + '\n' + FE_DET_LINES.join('\n') + '\nreturn { isMultilangMonthTitle };');
  const missVi = VI_MONTH_LINES.filter((l) => !D(l).isMultilangMonthTitle).length;
  const missTh = TH_MONTH_LINES.filter((l) => !D(l).isMultilangMonthTitle).length;
  assert.strictEqual(missVi, 12, `闸门失效: 摘掉 vi 月表后仅漏判 ${missVi}/12（判据③ 未红）`);
  assert.strictEqual(missTh, 12, `闸门失效: 摘掉 th 月表后仅漏判 ${missTh}/12（判据④ 未红）`);
});

// ═══════════════════ 三、前端：仪表盘 + 报头（长度上限解除） ═══════════════════
test('⑤ 仪表盘主标题：es/fr/vi/th 全数判为仪表盘标题（**无长度上限**，fr 74 字必过）', () => {
  for (const [lang, s] of DASHBOARDS) {
    assert.ok(detect(s).isDashboardTitle, `[${lang}] 仪表盘未识别: ${s}`);
  }
  // 明确长度事实：fr 样本必须 > 60（否则本判据失去意义 ⇒ 防「样本被悄悄缩短」）
  const frLong = DASHBOARDS.find(([l, s]) => l === 'fr')[1];
  assert.ok(frLong.trim().length > 60, `fr 样本长度 ${frLong.trim().length} 未超 60，判据失去区分度`);
});

test('⑥ 报头/终章锚点：vi `WEALTH ORACLE` + th `คำพยากรณ์…`（泰文不属 \\w ⇒ 不可用 `\\b`）', () => {
  for (const [lang, s] of ORACLE_HEADS) {
    assert.ok(detect(s).isOracleAnchorTitle, `[${lang}] 报头锚点未识别: ${s}`);
  }
});

test('【注入缺陷自测】把 `WEALTH ORACLE`/`คำพยากรณ์` 从锚点表摘掉 → 判据⑥ 必须红', () => {
  const degraded = "const KS_ORACLE_ANCHOR = 'Or[áa]culo|Final Wealth Oracle|FINAL WEALTH ORACLE|Oracle';";
  const idx = FE_TABLES.indexOf('KS_ORACLE_ANCHOR');
  const tables = FE_TABLE_LINES.map((x, i) => (i === idx ? degraded : x));
  const D = new Function('textWithoutIcon',
    tables.join('\n') + '\n' + FE_DET_LINES.join('\n') + '\nreturn { isOracleAnchorTitle };');
  assert.ok(!D('WEALTH ORACLE · FINANCIAL REVELATION').isOracleAnchorTitle, '闸门失效: 摘掉 vi 锚点后仍识别（判据⑥ 未红）');
  assert.ok(!D('คำพยากรณ์ความมั่งคั่ง · คำเปิดเผยทางการเงิน').isOracleAnchorTitle, '闸门失效: 摘掉 th 锚点后仍识别');
});

// ═══════════════════ 四、零误报 + 判据同源 ═══════════════════
test('⑦ 零误报：正文句/普通段落绝不判为月标题、仪表盘标题或神谕锚点', () => {
  const NEG = [
    // 越南语正文（无冒号；曾疑「Tháng N YYYY」开头的段落会误伤）
    'Tháng 7 2026 mở ra cánh cửa của năm tài chính với một thông điệp rõ ràng',
    'Mặt Trời đi qua Cự Giải, kích hoạt Nhà 10 — Nhà Sự Nghiệp và Di Sản Công Chúng',
    // 泰语正文（不以锚点词开头）
    'ดวงชะตาของท่านผู้เกิดในราศีตุลย์ ภายใต้การคุ้มครองของพระแม่วีนัส',
    'ดาวพฤหัสบดี ผู้เป็นครูแห่งเทพเจ้า กำลังสถิตในราศีกันยา ณ ภพที่ 12',
    // 西语正文
    'Capítulo II y III revelan el camino de la abundancia sin pausa',
    'El oráculo dice que debes ahorrar durante los meses de invierno',
    'Júpiter entra en Leo el 30 de junio de 2026, justo antes del ciclo',
    // 法语/英语正文
    'Le Tableau de Bord est un outil précieux pour suivre vos finances',
    'This dashboard shows your annual wealth metrics in detail',
  ];
  for (const s of NEG) {
    const r = detect(s);
    assert.ok(!r.isMultilangMonthTitle, `正文被误判为月标题: ${s}`);
    assert.ok(!r.isDashboardTitle, `正文被误判为仪表盘标题: ${s}`);
    assert.ok(!r.isOracleAnchorTitle, `正文被误判为神谕锚点: ${s}`);
  }
  // ⚠️ 已知边界（既有行为，非本轮引入）：行首恰为 `Oráculo` 的正文句仍会被判为锚点
  //   （`KS_ORACLE_ANCHOR_RE` 只锚行首，`\b` 与今负向先行同结果）⇒ 不断言，仅登记。
});

test('⑧ 同源：前端 `KS_MONTH_TH` 必须与后端 `V435_MONTHS.th` 逐词相同', () => {
  // 后端泰语月表（从 server.js 真实声明抽取，杜绝双盲）
  const { map: m2 } = closureDecls(SRC, ['V435_MONTHS']);
  const ctx = { console, __exports: {} };
  vm.createContext(ctx);
  vm.runInContext(m2.get('V435_MONTHS') + '\n__exports.V435_MONTHS = V435_MONTHS;', ctx);
  const thMonths = Object.keys(ctx.__exports.V435_MONTHS.th);
  assert.strictEqual(thMonths.length, 12, `后端泰语月表应为 12 项，实得 ${thMonths.length}`);
  const feTh = detect('x').KS_MONTH_TH;
  for (const m of thMonths) {
    assert.ok(feTh.includes(m), `前端 KS_MONTH_TH 缺后端月名 ${m}（口径漂移）`);
  }
  // 反向：前端不得多出后端没有的月名（防「臆造月名」）
  for (const m of feTh.split('|')) {
    assert.ok(thMonths.includes(m), `前端 KS_MONTH_TH 含后端没有的月名 ${m}`);
  }
});

test('⑨ 判据同源接线：产品源码确实引用了新式（无牙假防线拦截）', () => {
  // 后端：finder 新分支 + PatchZone 新分支 + cfg 声明必须同时在位
  assert.ok(/if \(cfg\.houseAbbrEn\) \{/.test(SRC), 'finder 缺 houseAbbrEn 分支');
  assert.ok(/h\.ord === 'abbrEn' \? cfg\.houseAbbrEnFmt\(house\)/.test(SRC), 'PatchZone 缺 abbrEn 写回分支');
  assert.ok(/houseAbbrEn: \/\(\?<!\[\\d\.,\]\)/.test(SRC), 'es cfg 缺 houseAbbrEn 定义');
  assert.ok(/houseNum: \/\\b\(\?:Casa\|House\)/.test(SRC), 'es houseNum 未补 House 分支');
  // 前端：`KS_DASHBOARD_KW` 必须被真实判据消费
  assert.ok(/KS_DASHBOARD_KW\.some\(\(p\) => textWithoutIcon\.replace\(/.test(BOX),
    '前端 `isDashboardTitle` 未消费 `KS_DASHBOARD_KW`（新表无牙）');
  assert.ok(/isChapterPattern \|\| isDashboardTitle \|\| isSectionNumber/.test(BOX),
    '`isDashboardTitle` 未接入标题判定链（判据空转）');
  assert.ok(/KS_MONTH_ANY = \[KS_MONTH_EN, KS_MONTH_ES, KS_MONTH_FR, KS_MONTH_VI, KS_MONTH_TH\]/.test(BOX),
    'vi/th 月表未并入 `KS_MONTH_ANY`');
});

// ═══════════════════ 五、版本 bump 完整性（v529；本闸门随 E24④/P5b bump 前移） ═══════════════════
test('⑩ bump 完整性：4 站点 v529 + purge 双形态回收 v528 + MIN_CACHE_VER/LATEST_CACHE_VER 前移 + 前移链无 v528 残留', () => {
  // ① server.js 4 站点（含 `-v2`）；不得残留 v527
  const sites = [...SRC.matchAll(/wealth:v541/g)].length;
  assert.strictEqual(sites, 4, `server.js 4 个缓存站点须全为 v529，实得 ${sites}`);
  assert.ok(!/wealth:v528/.test(SRC), 'server.js 不得残留 v527 键');
  // ② purge 双形态回收 v527（漏一形态 ⇒ 半数毒缓存留存）
  const PURGE = fs.readFileSync(path.join(REPO, 'scripts', 'purge-tz-poison-cache.mjs'), 'utf-8');
  assert.ok(PURGE.includes("'wealth:v528:*'") && PURGE.includes("'wealth:v528-v2:*'"),
    'purge 须双形态回收 v527');
  // ③ MIN_CACHE_VER 是**纯数字形态**（字符串映射覆盖不到）⇒ 单独前移 + 反向断言
  const YEARLY = fs.readFileSync(path.join(REPO, 'test', 'audit-yearly-stream.test.js'), 'utf-8');
  assert.ok(/MIN_CACHE_VER = 541/.test(YEARLY), 'MIN_CACHE_VER 未前移至 529');
  assert.ok(!/MIN_CACHE_VER = 527/.test(YEARLY), 'MIN_CACHE_VER 仍停留 527');
  // ④ v492 linter 的 LATEST_CACHE_VER（模板变量形态 ⇒ 只存在于该文件）
  const linter = fs.readFileSync(path.join(REPO, 'test', 'audit-v492-monthly-house-linter.test.mjs'), 'utf-8');
  assert.ok(linter.includes("LATEST_CACHE_VER = 'v541'"), 'v492 linter LATEST_CACHE_VER 未前移至 v529');
  // ⑤ 前移链：所有含字面站点计数基线的闸门必须已到 v528，且**不得残留 v527**（不变式＝不得再引用前一版）
  const CHAIN = ['audit-e10-r9-natal-coverage.test.mjs', 'audit-e11-r10-critic-precision.test.mjs',
    'audit-e12-r11-whole-report-lock.test.mjs', 'audit-e13-r11d-spelled-ordinals.test.mjs',
    'audit-e15-r11f-multilang-uncage.test.mjs', 'audit-e17-r11j-yearly-axis-critic.test.mjs',
    'audit-e18-r11k-idempotent-lock.test.mjs', 'audit-e20-r11n-element-coord-strip.test.mjs',
    'audit-e21-r11o-house-label-lock.test.mjs', 'audit-e22-r11p-chain-end-label-lock.test.mjs',
    'audit-e23-r11q-zh-latency-and-syntax-fix.test.mjs', 'audit-sweep-matrix.test.mjs'];
  for (const f of CHAIN) {
    const t = fs.readFileSync(path.join(REPO, 'test', f), 'utf-8');
    assert.ok(t.includes('wealth:v541'), `${f} 站点计数基线未前移至 v528`);
    assert.ok(!t.includes('wealth:v528'), `${f} 残留 v527 基线（前移链断裂）`);
  }
  // ⑥ sweep-online 同源键
  const sw = fs.readFileSync(path.join(REPO, 'test', 'tools', 'sweep-online.mjs'), 'utf-8');
  assert.ok(sw.includes('wealth:v541:${d.birth}'), 'sweep-online 的 cacheKeyOf 未前移至 v529');
  assert.ok(!sw.includes('wealth:v528'), 'sweep-online 残留 v527');
});
