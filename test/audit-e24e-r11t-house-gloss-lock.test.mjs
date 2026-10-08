// ══════════════════════════════════════════════════════════════════════
// 🛡️ E24④/R11t 闸门（2026-10-06）：西语「宫位语义标签同位语」契约锁补三式
//    + 越南语宫位语义标签契约锁 + vi 月标题 `Năm` 归一（前后端双向）
// ══════════════════════════════════════════════════════════════════════
// 【E24③ 终验揪出的两个同族缺陷（本闸门即为其防线）】
//  · P5（es）：产稿主流形态是**名词前置**的逗号同位语 `Casa N, la Casa de <标签>`，
//    而旧锁（式1）硬性要求**名词后置**的 `Nª Casa de <标签>` ⇒ 射程外真错配存活。
//    实测（同语种两盘形态**完全相反**）：s3 15 处（1 处真错配）/ 靶盘 0 处、射程外 28 处（3 处真错配）
//    ⇒ 旧锁是**概率性覆盖**，必须补式做到结构性覆盖。
//    ⚠️ 式6（`Nª Casa, <gloss>`）**不是可选项**：s3
//    `Plutón … en tu 10ª Casa, la Casa de las Redes y las Ganancias`（真值 Pluto=H10）
//    ⇒ 数字对、标签错，且**只有式6 能咬合**（式1 需 ` de `、式4 需 `Casa` 在前）。
//  · P6（vi）：`Tháng 7 Năm 2026:` 形态因前端正则不容忍 `Năm` 而 **12/12 月标题落白**
//    （s5 `Tháng 7 2026:` 12/12 金 vs s11 `Tháng 7 Năm 2026:` 0/12）。
// 【本闸门纪律】
//  · 判据同源 —— 断言用的是**从产品源码抽取的真实声明**（`closureDecls` + 前端逐字 `grabDecl`），
//    绝不另写一份正则副本（否则双盲：锁改了闸门不知道）。
//  · 每式**注入缺陷自测** —— 摘掉该式 ⇒ 对应真靶句必须**不再被剪**（否则＝无牙假防线）。
//  · 零误伤 —— 真实合法标签 15 条 + 星座/行星名弃权样本必须**逐字不变**。
//  · 幂等 —— 二次施加零改动。
// ══════════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { closureDecls } from './tools/extract_decls.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(REPO, 'server.js'), 'utf-8');
const BOX = fs.readFileSync(path.join(REPO, 'web', 'src', 'components', 'SacredYearlyReportBox.tsx'), 'utf-8');
const PKG = fs.readFileSync(path.join(REPO, 'package.json'), 'utf-8');

// ── 后端：抽取真实声明（含闭包） ──
const { map: beMap } = closureDecls(SRC, ['stripHouseSemanticLabelMismatch', '_e21CountHouseLabelMismatch']);
function buildBE(over) {
  const m = over ? new Map([...beMap, ...Object.entries(over)]) : beMap;
  const ctx = { console: { log() { }, warn() { }, error() { } }, __exports: {} };
  vm.createContext(ctx);
  vm.runInContext([...m.values()].join('\n')
    + '\n__exports.strip = stripHouseSemanticLabelMismatch;'
    + '\n__exports.count = _e21CountHouseLabelMismatch;', ctx);
  return ctx.__exports;
}
const BE = buildBE();
const strip = (t, l) => BE.strip(t, l, 'yearly');
const count = (t, l) => BE.count(t, l);

// ── 前端：逐字抽取（判据同源；不另写正则） ──
function grabDecl(src, name) {
  const re = new RegExp('^[ \\t]*(?:export )?const ' + name + ' = .+$', 'm');
  const m = src.match(re);
  assert.ok(m, `未找到前端声明 ${name}`);
  return m[0].replace(/^[ \t]*/, '').replace(/^export /, '');
}
const FE_ORDER = ['KS_MONTH_EN', 'KS_MONTH_ES', 'KS_MONTH_FR', 'KS_MONTH_VI', 'KS_MONTH_TH', 'KS_MONTH_ANY', 'KS_MONTH_TITLE_RE'];
function buildFELines(lines) {
  return new Function(lines.join('\n') + '\nreturn { KS_MONTH_VI, KS_MONTH_ANY, KS_MONTH_TITLE_RE };');
}
/** 传名字 ⇒ 逐字从产品源码抽取；传整行声明 ⇒ 直接用（供注入缺陷自测） */
function buildFE(feOrder) {
  const items = feOrder || FE_ORDER;
  return buildFELines(items.map((x) => (/^const /.test(x) ? x : grabDecl(BOX, x))));
}
const FE = buildFE();
const isMonthTitle = (s) => FE().KS_MONTH_TITLE_RE.test(s.trim());

// ── 真实靶句（逐字取自 v527 线上落库稿） ──
const S3_NABBR_IN = 'En las profundidades de tu psique, Plutón en Sagitario en tu 10ª Casa, la Casa de las Redes y las Ganancias, está llevando a cabo una revolución silenciosa.';
const S3_NABBR_OUT = 'En las profundidades de tu psique, Plutón en Sagitario en tu 10ª Casa, está llevando a cabo una revolución silenciosa.';
const ES2006_DELIM_IN = 'Tu Luna natal en Tauro (que ocupa la Casa 3, la Casa del Hogar y las Raíces, según la rueda de casas iguales desde tu Ascendente Piscis) indica seguridad.';
const ES2006_DELIM_OUT = 'Tu Luna natal en Tauro (que ocupa la Casa 3, según la rueda de casas iguales desde tu Ascendente Piscis) indica seguridad.';
const ES2006_DELIM2_IN = 'Júpiter, el gran benefactor, en la Casa 4, la casa de la creatividad y los hijos, esta posición indica fortuna.';
const ES2006_DELIM2_OUT = 'Júpiter, el gran benefactor, en la Casa 4, esta posición indica fortuna.';
const ES2006_INTERJ_IN = 'El Sol en la Casa 10 de tu carta natal, la Casa de las Redes y las Ganancias, es el motor de tu carrera.';
const ES2006_INTERJ_OUT = 'El Sol en la Casa 10 de tu carta natal, es el motor de tu carrera.';

// ── 🛡️ E24④/P5b（2026-10-06）：逐字取自 **v528 线上靶盘**（2006-06-21 23:45 Ushuaia es）落库稿 ──
//   【真缺陷实证】数值真值锁把 LLM 的**错宫号改写正确**（本命 Júpiter 5→9 / Saturno 2→5 /
//   Plutón 11→10；引擎真值 Jupiter=H9 Scorpio / Saturn=H5 Leo / Pluto=H10 Sagittarius 已核对），
//   而**与错宫号自洽的同位语标签原地不动** ⇒ 数字对、标签错（标签恰为被改掉的那三个旧宫号主题）。
//   【P5 首版为何仍漏网】① 真实稿 17/17 用 `el hogar de`（**无一处** `la casa de`）⇒ 头部写死 `casa` 即全盲；
//   ② 标签**内含逗号**（`la creatividad, el romance y los hijos`）⇒ 一刀切禁逗号只咬第一段，强剪留碎片。
const P5B_1_IN = 'Tu Júpiter en Escorpio, en la Casa 9, el hogar de la creatividad, el romance y los hijos, es un faro de expansión.';
const P5B_1_OUT = 'Tu Júpiter en Escorpio, en la Casa 9, es un faro de expansión.';
const P5B_2_IN = 'Sin embargo, tu Saturno en Leo, en la Casa 5, el hogar de la riqueza y los recursos, es el gran maestro y el gran obstáculo.';
const P5B_2_OUT = 'Sin embargo, tu Saturno en Leo, en la Casa 5, es el gran maestro y el gran obstáculo.';
const P5B_3_IN = 'Y luego está tu Plutón en Sagitario, en la Casa 10, el hogar de las redes, las amistades y las ganancias inesperadas.';
const P5B_3_OUT = 'Y luego está tu Plutón en Sagitario, en la Casa 10.';
// 关系性短语（**非主题标签** ⇒ 契约弃权，宁漏不改）—— 也是「头部剥离」防线的靶句
const P5B_RELATIONAL = 'El mes comienza con el Sol transitando tu Casa 5, el hogar de tu Júpiter en Leo.';
// 同形态正确标签 / 中性冠词续段 ⇒ 必须逐字保留
const P5B_KEEP = [
  'El Sol entra en Leo el 22 de julio, activando tu Casa 6, el hogar del trabajo diario, la salud y el servicio.',
  'activando tu Casa 7, el hogar de las asociaciones, el matrimonio y los aliados.',
  'activando tu Casa 12, el hogar del subconsciente, lo oculto y el karma.',
  'activando tu Casa 4, el hogar de la familia, las raíces y el hogar.',
  P5B_RELATIONAL,
];
// 过度剪枝回归守卫（P5 首版病根之一）—— 续段白名单必须挡住 `según` 等小句起始词
const P5B_GUARD_IN = 'Tu Luna natal en Tauro (que ocupa la Casa 3, el hogar de la creatividad, según la rueda de casas iguales desde tu Ascendente Piscis) indica seguridad.';
const P5B_GUARD_OUT = 'Tu Luna natal en Tauro (que ocupa la Casa 3, según la rueda de casas iguales desde tu Ascendente Piscis) indica seguridad.';
// 关系从句护栏（`lo que …` 不得被并入标签）
const P5B_RELCL_IN = 'En la Casa 9, el hogar de las redes, lo que indica expansión, hay mucho que aprender.';
const P5B_RELCL_OUT = 'En la Casa 9, lo que indica expansión, hay mucho que aprender.';

// ═══════════════════ 一、es 三式咬合 + 保形 ═══════════════════
test('① es 式6（数字缩写同位语）：s3 真错配被剪且**只留数字**（式1/式4 均不覆盖）', () => {
  assert.strictEqual(strip(S3_NABBR_IN, 'es'), S3_NABBR_OUT, '式6 未咬合 s3 真错配（P5 盲区复发）');
});
test('② es 式4（逗号同位语）：剪 `, <标签>` 且**保留后续小句**（定界禁逗号的证明）', () => {
  assert.strictEqual(strip(ES2006_DELIM_IN, 'es'), ES2006_DELIM_OUT, '式4 未咬合，或吞掉了 `, según la rueda…` 后续小句');
  assert.strictEqual(strip(ES2006_DELIM2_IN, 'es'), ES2006_DELIM2_OUT, '式4 未咬合小写标签（`la casa de la creatividad`）');
});
test('③ es 式5（插入语式）：剪 `, <标签>` 且**保留 `de tu carta natal` 插入语**（保形铁律）', () => {
  assert.strictEqual(strip(ES2006_INTERJ_IN, 'es'), ES2006_INTERJ_OUT, '式5 未咬合，或未保留插入语');
});
test('④ es 幂等：三式剪后二次施加零改动', () => {
  for (const [inp, out] of [[S3_NABBR_IN, S3_NABBR_OUT], [ES2006_DELIM_IN, ES2006_DELIM_OUT],
    [ES2006_DELIM2_IN, ES2006_DELIM2_OUT], [ES2006_INTERJ_IN, ES2006_INTERJ_OUT]]) {
    const once = strip(inp, 'es');
    assert.strictEqual(once, out);
    assert.strictEqual(strip(once, 'es'), once, '非幂等');
  }
});

// ═══════════════════ 二、零误伤（真实合法标签 + 弃权样本） ═══════════════════
test('⑤ es 零误伤：真实合法标签 15 条 + 星座/行星名弃权样本必须逐字不变', () => {
  const KEEP = [
    'Casa 3, la Casa de la Comunicación',                    // 3 宫主题
    'Casa 11, la Casa de las Redes',                          // 11 宫主题
    'Casa 2, la Casa del Dinero y los Recursos',              // 2 宫主题
    'Casa 7, la Casa de las Asociaciones y el Matrimonio',    // 7 宫主题
    'Casa 8, la Casa de la Transformación y los Recursos Compartidos', // 8 宫主题
    'Casa 12, la Casa del Subconsciente',                     // 12 宫主题
    'Casa 1, la Casa del Yo y la Identidad',                  // 1 宫主题
    'Casa 10, la Casa de la Carrera y el Estatus Público',    // 10 宫主题
    'Casa 4, la Casa del Hogar y las Raíces',                 // 4 宫主题
    'Casa 5, la casa de la creatividad y los hijos',          // 5 宫主题（**小写首词**，证明放宽生效）
    'Casa 9, la Casa de la Expansión y la Filosofía',         // 9 宫主题
    '10ª Casa, la Casa de la Carrera',                        // 式6 合法：10 宫主题
    '5ª Casa, la casa de la creatividad, el romance, los hijos', // 式6 合法：标签含逗号但首段命中 5 宫
    'Casa 6, la Casa del Trabajo Diario y la Salud',          // 6 宫主题
    'Casa 4, la Casa de Escorpio',                            // ② 主题词锚定 ⇒ 星座名弃权
  ];
  for (const s of KEEP) {
    assert.strictEqual(strip(s, 'es'), s, `合法/弃权样本被误剪: ${s}`);
  }
});
test('⑥ es 标题行豁免：月标题形态（行首 `#`）内的同位语**绝不剪**', () => {
  const H = '### Casa 4, la Casa de las Redes y las Ganancias';
  assert.strictEqual(strip(H, 'es'), H, '标题行豁免失效（月标题合法标签被剪）');
});

// ═══════════ 一·五、P5b：同义头部（`el hogar de`）+ 受限逗号续段 ═══════════
test('⑮ es 同义头部 `el hogar de`：v528 线上靶盘三处真错配必须被剪且**只留数字**', () => {
  assert.strictEqual(strip(P5B_1_IN, 'es'), P5B_1_OUT, '同义头部 `hogar` 未咬合（Casa 9 真错配残留）');
  assert.strictEqual(strip(P5B_2_IN, 'es'), P5B_2_OUT, '同义头部 `hogar` 未咬合（Casa 5 真错配残留）');
  assert.strictEqual(strip(P5B_3_IN, 'es'), P5B_3_OUT, '同义头部 `hogar` 未咬合（Casa 10 真错配残留）');
});
test('⑯ es 同义头部零误伤：正确标签 / 关系性短语 / 中性冠词续段必须逐字不变', () => {
  for (const s of P5B_KEEP) {
    assert.strictEqual(strip(s, 'es'), s, `同义头部误剪合法句: ${s}`);
  }
});
test('⑰ es 续段定界回归守卫：小句起始词（`según`）与关系从句（`lo que`）**绝不并入标签**', () => {
  assert.strictEqual(strip(P5B_GUARD_IN, 'es'), P5B_GUARD_OUT, '续段贪婪吞掉了 `, según la rueda…` 后续小句（P5 首版病根复发）');
  assert.strictEqual(strip(P5B_RELCL_IN, 'es'), P5B_RELCL_OUT, '关系从句 `, lo que …` 被误并入标签');
});
test('⑱ es P5b 幂等：同义头部 + 含逗号标签剪后二次施加零改动', () => {
  for (const [inp, out] of [[P5B_1_IN, P5B_1_OUT], [P5B_2_IN, P5B_2_OUT], [P5B_3_IN, P5B_3_OUT],
    [P5B_GUARD_IN, P5B_GUARD_OUT], [P5B_RELCL_IN, P5B_RELCL_OUT]]) {
    const once = strip(inp, 'es');
    assert.strictEqual(once, out);
    assert.strictEqual(strip(once, 'es'), once, '非幂等');
  }
  for (const s of P5B_KEEP) assert.strictEqual(strip(strip(s, 'es'), 'es'), s, '合法句二次施加被改动');
});

// ═══════════════════ 三、注入缺陷自测（每式必须有牙） ═══════════════════
test('【注入缺陷】摘掉式6（`_E24_ES_NABBR_RE`）⇒ s3 真错配必须复发（判据① 必须红）', () => {
  const d = beMap.get('_E24_ES_NABBR_RE');
  assert.ok(d && d.includes('Casas?'), '注入未生效（未抽到式6 声明）');
  const broken = d.replace('Casas?', 'CasasZZ');   // 注入位置在标记之后 ⇒ 破坏式6
  assert.notStrictEqual(broken, d, '注入未生效');
  const D = buildBE({ _E24_ES_NABBR_RE: broken });
  assert.strictEqual(D.strip(S3_NABBR_IN, 'es', 'yearly'), S3_NABBR_IN,
    '闸门失效：摘掉式6 后 s3 真错配仍被剪（判据① 未红）');
});
test('【注入缺陷】摘掉式4（`_E24_ES_DELIM_RE`）⇒ 逗号同位语必须复发（判据② 必须红）', () => {
  const d = beMap.get('_E24_ES_DELIM_RE');
  assert.ok(d && d.includes('Casa'), '注入未生效（未抽到式4 声明）');
  const D = buildBE({ _E24_ES_DELIM_RE: d.replace('\\bCasa', '\\bKasa') });
  assert.strictEqual(D.strip(ES2006_DELIM_IN, 'es', 'yearly'), ES2006_DELIM_IN,
    '闸门失效：摘掉式4 后逗号同位语仍被剪（判据② 未红）');
});
test('【注入缺陷】摘掉越语契约命中（`_e24ViThemeHouses` 置空）⇒ 越语错配必须复发', () => {
  const d = beMap.get('_e24ViThemeHouses');
  assert.ok(d && d.includes('hits.push'), '注入未生效（未抽到越语主题判定）');
  const D = buildBE({ _e24ViThemeHouses: d.replace('hits.push(i + 1);', '') });
  assert.strictEqual(D.strip('Nhà 3, ngôi nhà của gia đình, nguồn cội', 'vi', 'yearly'),
    'Nhà 3, ngôi nhà của gia đình, nguồn cội',
    '闸门失效：主题判定置空后越语错配仍被剪（未红）');
});
test('【注入缺陷】头部同义退回只认 `casa` ⇒ v528 靶盘三句真错配必须复发（判据⑮ 必须红）', () => {
  const d = beMap.get('_E24_ES_GLOSS');
  assert.ok(d && d.includes('(?:casa|hogar)'), '注入未生效（未抽到 gloss 声明，或同义头已不在）');
  const D = buildBE({ _E24_ES_GLOSS: d.replace('(?:casa|hogar)', 'casa') });
  assert.strictEqual(D.strip(P5B_2_IN, 'es', 'yearly'), P5B_2_IN,
    '闸门失效：头部退回只认 `casa` 后真错配仍被剪（判据⑮ 未红）');
});
test('【注入缺陷】摘掉逗号续段（`_E24_ES_LBL_TAIL` 段数上限 3→0）⇒ 含逗号标签必留碎片（判据⑮ 必须红）', () => {
  const d = beMap.get('_E24_ES_LBL_TAIL');
  assert.ok(d && d.includes('{0,3}'), '注入未生效（未抽到续段声明）');
  const D = buildBE({ _E24_ES_LBL_TAIL: d.replace('{0,3}', '{0,0}') });
  const got = D.strip(P5B_1_IN, 'es', 'yearly');
  assert.notStrictEqual(got, P5B_1_OUT, '闸门失效：续段摘掉后仍剪得干净（无碎片 ⇒ 判据⑮ 未红）');
  assert.ok(got.includes('el romance y los hijos'), '闸门失效：预期残留碎片 `, el romance y los hijos` 未出现');
});
test('【注入缺陷】`_e24EsGlossLabel` 置空（不剥头部）⇒ `hogar` 污染 4 宫主题 ⇒ 关系性短语被误剪（判据⑯ 必须红）', () => {
  const d = beMap.get('_e24EsGlossLabel');
  assert.ok(d && d.includes('slice(m[0].length)'), '注入未生效（未抽到头部剥离函数）');
  const D = buildBE({ _e24EsGlossLabel: d.replace('return m ? s.slice(m[0].length) : s;', 'return s;') });
  const got = D.strip(P5B_RELATIONAL, 'es', 'yearly');
  assert.notStrictEqual(got, P5B_RELATIONAL,
    '闸门失效：头部未剥离时关系性短语仍被保留（判据⑯ 对该修复无区分力）');
  assert.ok(got.includes('Casa 5.') && !got.includes('Júpiter en Leo'),
    '闸门失效：预期关系性短语被误剪为 `… tu Casa 5.`，实得 ' + JSON.stringify(got));
});

// ═══════════════════ 四、越南语契约锁 ═══════════════════
test('⑦ vi 锁：错配标签被剪且**只留数字**；合法与本宫标签逐字保留', () => {
  const BAD = 'Nhà 3, ngôi nhà của gia đình, nguồn cội, và nền tảng cảm xúc. Đây là tháng của bạn.';
  const OKK = 'Nhà 4, ngôi nhà của gia đình, nguồn cội, và nền tảng cảm xúc. Đây là tháng của bạn.';
  assert.strictEqual(strip(BAD, 'vi'), 'Nhà 3. Đây là tháng của bạn.', 'vi 锁未剪错配（或未只留数字）');
  assert.strictEqual(strip(OKK, 'vi'), OKK, 'vi 锁误剪本宫合法标签');
  assert.strictEqual(strip(strip(BAD, 'vi'), 'vi'), strip(BAD, 'vi'), 'vi 锁非幂等');
  // 真实形态（s5 阿克拉 12/12 自洽稿，逐字抽取）逐条零改动
  const S5 = ['Nhà 10, ngôi nhà của sự nghiệp và danh vọng công chúng', 'Nhà 11, ngôi nhà của cộng đồng',
    'Nhà 12, ngôi nhà của tiềm thức', 'Nhà 1, ngôi nhà của bản ngã', 'Nhà 2, ngôi nhà của tài sản',
    'Nhà 3, ngôi nhà của giao tiếp', 'Nhà 4, ngôi nhà của gia đình', 'Nhà 5, ngôi nhà của sáng tạo',
    'Nhà 6, ngôi nhà của công việc hàng ngày', 'Nhà 7, ngôi nhà của đối tác', 'Nhà 8, ngôi nhà của sự chuyển hóa',
    'Nhà 9, ngôi nhà của sự mở rộng'];
  for (const s of S5) assert.strictEqual(strip(s, 'vi'), s, `s5 真实自洽标签被误剪: ${s}`);
});
test('⑧ vi 头部锚定：标签**非主题词开头**时弃权（放开逗号的代价，宁漏不改）', () => {
  const s = 'Nhà 6, ngôi nhà của những điều nhỏ nhặt, và bạn cần quan tâm đến gia đình.';
  assert.strictEqual(strip(s, 'vi'), s, '头部锚定失效：吞并后续小句的误剪复现');
});
test('⑨ vi 标题行豁免 + 越语变音字母**不产生虚假词边界**', () => {
  const H = '### Nhà 3, ngôi nhà của gia đình';
  assert.strictEqual(strip(H, 'vi'), H, 'vi 标题行豁免失效');
  // 变音字母（`ồ`/`ự`/`ế` ∈ \u1E00-\u1EFF）不得被当成「非字母」而在词内制造边界：
  // `nguồn lực`（2 宫）与 `nguồn lực chung`（8 宫）必须**各自成立**。
  assert.strictEqual(strip('Nhà 8, ngôi nhà của nguồn lực chung', 'vi'), 'Nhà 8, ngôi nhà của nguồn lực chung',
    '`nguồn lực chung` 被误判为 2 宫主题（变音字母虚假词边界）⇒ 合法标签被误剪');
  assert.strictEqual(strip('Nhà 2, ngôi nhà của nguồn lực và tiền bạc', 'vi'), 'Nhà 2, ngôi nhà của nguồn lực và tiền bạc',
    '2 宫合法标签被误剪');
});

// ═══════════════════ 五、判据同源（锁 ↔ 批测/CRITIC 计数） ═══════════════════
test('⑩ 判据同源：`_e21CountHouseLabelMismatch` 的 es/vi 计数必须等于锁的剪除数（否则批测假绿）', () => {
  const CASES = [
    [S3_NABBR_IN, 'es'], [ES2006_DELIM_IN, 'es'], [ES2006_DELIM2_IN, 'es'], [ES2006_INTERJ_IN, 'es'],
    ['Nhà 3, ngôi nhà của gia đình, nguồn cội', 'vi'],
    ['Nhà 4, ngôi nhà của gia đình, nguồn cội', 'vi'],
    ['Nhà 6, ngôi nhà của những điều nhỏ nhặt, và bạn cần quan tâm đến gia đình.', 'vi'],
    ['Casa 3, la Casa de la Comunicación', 'es'],
    ['Nhà 11, ngôi nhà của cộng đồng', 'vi'],
    // 🛡️ E24④/P5b：同义头部 + 含逗号标签 —— 计数与锁共用同一 gloss 建式 + 同一 `_e24EsGlossLabel`
    [P5B_1_IN, 'es'], [P5B_2_IN, 'es'], [P5B_3_IN, 'es'],
    [P5B_GUARD_IN, 'es'], [P5B_RELCL_IN, 'es'], [P5B_RELATIONAL, 'es'],
    ...P5B_KEEP.map((s) => [s, 'es']),
  ];
  for (const [t, l] of CASES) {
    const cuts = count(t, l) - count(strip(t, l), l);
    assert.strictEqual(cuts, count(t, l), `[${l}] 锁与判据不同源：剪后仍有残留 ${count(strip(t, l), l)}`);
    assert.strictEqual(count(strip(t, l), l), 0, `[${l}] 剪后计数应为 0：${t}`);
  }
  // 非 en/es/vi 语种必须恒 0（否则会对他语种判红＝假红）
  assert.strictEqual(count(ES2006_DELIM_IN, 'fr'), 0, '非 es/vi 语种必须恒 0');
  assert.strictEqual(count(S3_NABBR_IN, 'th'), 0, '非 es/vi 语种必须恒 0');
});

// ═══════════════════ 六、P6：vi 月标题 `Năm` 归一（后端） ═══════════════════
test('⑪ 后端 vi 归一：`Tháng N Năm YYYY` ⇒ `Tháng N YYYY`（真值纠月 + 幂等）', () => {
  const { map: m2 } = closureDecls(SRC, ['_v516RewriteMonthYear', '_v516MonthHeadKey']);
  const ctx = { console, __exports: {} };
  vm.createContext(ctx);
  vm.runInContext([...m2.values()].join('\n')
    + '\n__exports.f = _v516RewriteMonthYear;\n__exports.k = _v516MonthHeadKey;', ctx);
  const { f, k } = ctx.__exports;
  // 注：签名为 (line, lang, y, mo) —— y 在前
  const s11 = '### Tháng 7 Năm 2026: Mặt Trời trong Cự Giải Nhà 11 — Sự Khởi Đầu';
  // ⚠️ 跨 realm：VM 返回值与宿主对象原型不同 ⇒ `deepStrictEqual` 恒失败（铁律）⇒ 逐字段比对。
  const keyed = k(s11, 'vi');
  assert.strictEqual(keyed.y, 2026, '识别年口径变了（前置条件）');
  assert.strictEqual(keyed.mo, 7, '识别月口径变了（前置条件）');
  const fixed = f(s11, 'vi', 2026, 7);
  assert.strictEqual(fixed, '### Tháng 7 2026: Mặt Trời trong Cự Giải Nhà 11 — Sự Khởi Đầu', '`Năm` 未清洗');
  assert.ok(!/Năm/.test(fixed), '归一后不得残留 `Năm`');
  assert.strictEqual(f(fixed, 'vi', 2026, 7), fixed, '非幂等');
  // 本无 `Năm` 的形态（s5）必须零改动
  const s5 = '### Tháng 8 2026: Mặt Trời trong Sư Tử Nhà 12 · Sức Mạnh';
  assert.strictEqual(f(s5, 'vi', 2026, 8), s5, '无 `Năm` 形态被改坏');
  // 真值纠月仍生效（回归保护：清洗不得削弱真值锁）
  assert.strictEqual(f('### Tháng 12 Năm 2026: x', 'vi', 2026, 7), '### Tháng 7 2026: x', '真值纠月失效');
});

// ═══════════════════ 七、P6：前端 `Năm` 容错（流式期兜底） ═══════════════════
test('⑫ 前端 `KS_MONTH_VI` 必须容错 `Năm`，且两种 vi 形态均判为月标题', () => {
  assert.ok(FE().KS_MONTH_VI.includes('Năm'), '`KS_MONTH_VI` 缺 `Năm` 容错（流式期 s11 会落白）');
  assert.ok(isMonthTitle('Tháng 7 Năm 2026: Mặt Trời trong Cự Giải Nhà 11'), '带 `Năm` 形态未判为月标题');
  assert.ok(isMonthTitle('Tháng 7 2026: Mặt Trời trong Cự Giải Nhà 11'), '无 `Năm` 形态未判为月标题');
  assert.ok(isMonthTitle('Tháng 11 Năm 2026: abc'), '两位数月份 + `Năm` 未判为月标题');
  // 零误报：正文句不得判为月标题
  assert.ok(!isMonthTitle('Tháng 7 năm nay là thời điểm vàng để bạn đầu tư'), '正文句被误判为月标题');
});
test('【注入缺陷】前端摘掉 `(?:\s*Năm)?` ⇒ `Tháng 7 Năm 2026:` 必须落白（判据⑫ 必须红）', () => {
  const vi = grabDecl(BOX, 'KS_MONTH_VI');
  assert.ok(vi.includes('Năm'), '注入前置：`KS_MONTH_VI` 本就无 `Năm` 容错');
  // ⚠️ 抽到的是**源码文本**（含双反斜杠 `\\s`），注入串必须与源码字面量同形。
  const broken = vi.replace('(?:\\\\s*Năm)?', '');
  assert.notStrictEqual(broken, vi, '注入未生效');
  const D = buildFE(FE_ORDER.map((n) => (n === 'KS_MONTH_VI' ? broken : n)));
  assert.ok(!D().KS_MONTH_TITLE_RE.test('Tháng 7 Năm 2026: Mặt Trời'),
    '闸门失效：摘掉 `Năm` 容错后仍判为月标题（判据⑫ 未红）');
});

// ═══════════════════ 八、无牙假防线拦截（接线 + 同源消费） ═══════════════════
test('⑬ 接线：三式/vi 锁必须被生产链**真实消费**（否则新表无牙）', () => {
  assert.ok(/\.replace\(_E24_ES_DELIM_RE,/.test(SRC), '式4 未接入 es 分支');
  assert.ok(/outEs2\.replace\(_E24_ES_INTERJ_RE,/.test(SRC), '式5 未接入 es 分支');
  assert.ok(/outEs2\.replace\(_E24_ES_NABBR_RE,/.test(SRC), '式6 未接入 es 分支');
  assert.ok(/lang === 'vi'\)/.test(SRC) && /\.replace\(_E24_VI_GLOSS_RE,/.test(SRC), 'vi 锁未接入');
  assert.ok(/new RegExp\(_E24_ES_NABBR_RE\.source, _E24_ES_NABBR_RE\.flags\)/.test(SRC)
    && /new RegExp\(_E24_VI_GLOSS_RE\.source, _E24_VI_GLOSS_RE\.flags\)/.test(SRC),
    'CRITIC c14 / 批测计数未同源复用新式（判据可能假绿）');
  // 闸门本身必须已接入 test:astro 长链（不接线＝零防线）
  assert.ok(PKG.includes('test/audit-e24e-r11t-house-gloss-lock.test.mjs'),
    '本闸门未接入 `test:astro` 长链（不接线 = 零防线）');
});

// ═══════════════════ 九、版本 bump 完整性（v529） ═══════════════════
test('⑭ bump：本闸门随 E24④/P5b 前移至 v529，且产品源码无 v528 残留', () => {
  assert.strictEqual([...SRC.matchAll(/wealth:v536/g)].length, 4, 'server.js 4 站点须全为 v529');
  assert.ok(!/wealth:v528/.test(SRC), 'server.js 残留 v527 键');
  const PURGE = fs.readFileSync(path.join(REPO, 'scripts', 'purge-tz-poison-cache.mjs'), 'utf-8');
  assert.ok(PURGE.includes("'wealth:v528:*'") && PURGE.includes("'wealth:v528-v2:*'"),
    'purge 须双形态回收 v528');
});
