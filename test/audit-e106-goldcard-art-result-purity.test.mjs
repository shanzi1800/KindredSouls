// ═══ E106 闸门：金卡艺术级重构 · 结果页唯一交互收拢 · 权益穿透 · 趴键显化 ═══
// 主公军令（2026-10-30 核验三截图后下发）：
// 刀一 深空黑金命盘金卡艺术级排版（拔调试串/干支对称矩阵/格局徽记/世界牌图腾/六爻衬底/字体阶梯）
// 刀二 结果页全面去伪交互（伴读气泡/抽屉/浮动条物理拔除——交流收拢首页铁律）
// 刀三 跨页权益穿透（合法灵宠档熔断付费拦截＋对话舱真权解锁）
// 刀四 首页水晶灵猫趴键显化＋点击脉冲联动开舱
// 刀五 军规链 80→81 段入编（e106 居 e105 后 e40 前）
// 军令适配：纯函数引擎落 .mjs（goldCardLayout.mjs 先例）⇒ node:test 直接 ESM import 行为级实测。
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const APP = read('web/src/App.tsx');
const APPCSS = read('web/src/App.css');
const PKG = JSON.parse(read('package.json'));
const GOLD = read('web/src/lib/drawGoldCard.ts');
const HOME = read('web/src/components/FamiliarHomeCard.tsx');

const loadChart = async () => import('../web/src/lib/goldCardChart.mjs');
const LANGS = ['zh', 'en', 'fr', 'es', 'th', 'vi'];

// ═══════════════ 刀一 · 金卡干支矩阵/格局徽记/六爻（行为级）═══════════════

test('①-1 干支柱位军令锚（1976-12-03/1997-10-18 ⇒ 丙辰己丑己卯 / 丁丑辛亥癸未）', async () => {
  const { computeCardPillars } = await loadChart();
  const m = computeCardPillars('1976-12-03', '1997-10-18');
  assert.ok(m && Array.isArray(m.a) && m.a.length === 3, 'A 侧须三柱（年/月/日）');
  assert.ok(m.b && Array.isArray(m.b) && m.b.length === 3, 'B 侧须三柱');
  const flat = (rows) => rows.map((p) => `${p[0]}${p[1]}`).join(' ');
  assert.equal(flat(m.a), '丙辰 己丑 己卯', `A 侧柱位军令锚漂移（实得 ${flat(m.a)}）`);
  assert.equal(flat(m.b), '丁丑 辛亥 癸未', `B 侧柱位军令锚漂移（实得 ${flat(m.b)}）`);
});

test('①-2 干支对称矩阵六语格式（zh 乾造/坤造军令格式＋非 zh 零汉字渗漏）', async () => {
  const { computeCardPillars, formatPillarRows } = await loadChart();
  const m = computeCardPillars('1976-12-03', '1997-10-18');
  const zh = formatPillarRows('zh', m);
  assert.equal(zh.labelA, '乾造（你）', 'zh labelA 须军令钦定「乾造（你）」');
  assert.equal(zh.labelB, '坤造（对方）', 'zh labelB 须军令钦定「坤造（对方）」');
  assert.equal(zh.rowA, '丙辰 · 己丑 · 己卯', `zh rowA 军令锚漂移（实得 ${zh.rowA}）`);
  assert.equal(zh.rowB, '丁丑 · 辛亥 · 癸未', `zh rowB 军令锚漂移（实得 ${zh.rowB}）`);
  for (const l of ['en', 'fr', 'es', 'th', 'vi']) {
    const r = formatPillarRows(l, m);
    for (const s of [r.labelA, r.labelB, r.rowA, r.rowB]) {
      assert.ok(typeof s === 'string' && s.length > 0, `${l} 干支矩阵字段缺场`);
      assert.ok(!/[\u4e00-\u9fff]/.test(s), `${l} 干支矩阵渗漏汉字：「${s}」`);
    }
  }
  // vi 汉越正统（E102 口径：丙辰 ⇒ Bính Thìn / 己丑 ⇒ Kỷ Sửu）
  const vi = formatPillarRows('vi', m);
  assert.ok(vi.rowA.includes('Bính Thìn') && vi.rowA.includes('Kỷ Sửu'),
    `vi 干支须汉越正统（实得 ${vi.rowA}）`);
});

test('①-3 格局徽记（三合局检测＋六语徽记＋无局兜底）', async () => {
  const { deriveCardTrine } = await loadChart();
  // 合成三柱凑齐 寅午戌 ⇒ 火局（军令示例【炽热与共生 · 八字三合火局】；B 侧不凑他局）
  const fire = deriveCardTrine('zh', {
    a: [['甲', '寅'], ['丙', '午'], ['戊', '戌']],
    b: [['甲', '子'], ['甲', '子'], ['甲', '子']],
  });
  assert.equal(fire.key, 'fire', '寅午戌齐 ⇒ 须判火局');
  assert.equal(fire.badge, '炽热与共生 · 八字三合火局', `zh 火局徽记军令锚漂移（实得 ${fire.badge}）`);
  // 巳酉丑 ⇒ 金局
  const metal = deriveCardTrine('zh', {
    a: [['乙', '巳'], ['辛', '酉'], ['乙', '丑']],
    b: [['甲', '子'], ['甲', '子'], ['甲', '子']],
  });
  assert.equal(metal.key, 'metal', '巳酉丑齐 ⇒ 须判金局');
  // 无局 ⇒ 兜底徽记（六支不凑齐任何整组三合）
  const none = deriveCardTrine('zh', {
    a: [['甲', '子'], ['甲', '卯'], ['甲', '午']],
    b: [['乙', '丑'], ['乙', '巳'], ['乙', '未']],
  });
  assert.equal(none.key, 'none', '无整局 ⇒ 兜底');
  assert.ok(none.badge.length > 0, '兜底徽记缺场');
  // 六语徽记零汉字渗漏（zh 除外）
  const sample = { a: [['甲', '寅'], ['丙', '午'], ['戊', '戌']], b: [['甲', '子'], ['甲', '子'], ['甲', '子']] };
  for (const l of ['en', 'fr', 'es', 'th', 'vi']) {
    const r = deriveCardTrine(l, sample);
    assert.ok(r.badge.length > 0, `${l} 徽记缺场`);
    assert.ok(!/[\u4e00-\u9fff]/.test(r.badge), `${l} 徽记渗漏汉字：「${r.badge}」`);
  }
});

test('①-4 六爻卦名解析（detail 首行 → 卦序/卦名/上下卦）', async () => {
  const { parseIchingHeadline } = await loadChart();
  const zhLine = '【本卦】 第13卦 — 天火同人 ☰☲';
  const zh = parseIchingHeadline(zhLine);
  assert.ok(zh, 'zh 首行解析失败');
  assert.equal(zh.ordinal, '第13卦', `zh 卦序解析漂移（实得 ${zh && zh.ordinal}）`);
  assert.equal(zh.name, '天火同人', `zh 卦名解析漂移（实得 ${zh && zh.name}）`);
  assert.equal(zh.upper, 'QIAN', '☰ 须判上卦乾');
  assert.equal(zh.lower, 'LI', '☲ 须判下卦离');
  const enLine = '[Primary Hex] Hexagram 13 — Fellowship with Men ☰☲';
  const en = parseIchingHeadline(enLine);
  assert.ok(en, 'en 首行解析失败');
  assert.equal(en.ordinal, 'Hexagram 13', 'en 卦序解析漂移');
  assert.equal(en.name, 'Fellowship with Men', 'en 卦名解析漂移');
  // 脏输入 fail-closed
  assert.equal(parseIchingHeadline('随便一行'), null, '非规约行须返回 null');
  assert.equal(parseIchingHeadline(''), null, '空串须返回 null');
  assert.equal(parseIchingHeadline(null), null, 'null 须返回 null');
});

test('①-5 卦名卦序卡片标签（zh 中文数字＋六爻线谱）', async () => {
  const { composeHexCardLabel, hexLinePattern } = await loadChart();
  const zh = composeHexCardLabel('zh', { ordinal: '第13卦', name: '天火同人', upper: 'QIAN', lower: 'LI' });
  assert.equal(zh, '天火同人 · 第十三卦', `zh 卦名卦序军令锚漂移（实得 ${zh}）`);
  const en = composeHexCardLabel('en', { ordinal: 'Hexagram 13', name: 'Fellowship with Men', upper: 'QIAN', lower: 'LI' });
  assert.ok(en === 'Hexagram 13 · Fellowship with Men', `en 卦名卦序漂移（实得 ${en}）`);
  // 同人 ䷌：下离(1,0,1) 上乾(1,1,1) ⇒ 自底向上 [1,0,1,1,1,1]
  assert.deepEqual(hexLinePattern('LI', 'QIAN'), [1, 0, 1, 1, 1, 1], '同人卦线谱漂移');
  assert.deepEqual(hexLinePattern('KUN', 'KUN'), [0, 0, 0, 0, 0, 0], '坤为地线谱漂移');
  assert.equal(hexLinePattern('XX', 'KUN'), null, '非法卦键须 fail-closed');
});

// ═══════════════ 刀一 · drawGoldCard 源码契约（艺术级排版）═══════════════

test('①-6 金卡 payload 艺术级重构（拔调试串＋新结构化字段）', async () => {
  assert.ok(!GOLD.includes('baziPattern'), 'payload 仍携带 baziPattern 调试串通道（军令违）');
  for (const f of ['pillarRows', 'trineBadge', 'hexLabel', 'hexLines']) {
    assert.ok(GOLD.includes(f), `payload 缺结构化字段 ${f}`);
  }
});

test('①-7 世界牌图腾＋六爻暗金衬底＋字体阶梯（源码契约）', async () => {
  // 🏆 E107-刀一 后继化：图腾库迁 goldCardTotems.mjs（22 张按 cardId 分发）——
  //    世界牌（id=21）花环线稿在库内存续；drawGoldCard 经 goldCardTotemUri 消费。
  const TOTEMS = read('web/src/lib/goldCardTotems.mjs');
  assert.ok(/wreath|Wreath|WorldCard|world.?card|goldCardTotem/i.test(GOLD), '金卡绘制未接图腾库出口');
  assert.ok(TOTEMS.includes('ellipse'), '图腾库缺世界牌花环椭圆线稿（第 21 张存续）');
  assert.ok(!/tarotEmblemDataUri/.test(GOLD), '旧圆环四芒星图腾未拔除');
  // 六爻暗金衬底框（卦象六线谱 + 卦名卦序）
  assert.ok(/hexLines/.test(GOLD) && /hexLabel/.test(GOLD), '缺六爻线谱/卦名卦序渲染');
  assert.ok(/rgba\(212,\s*175,\s*55,\s*0\.0[6-9]/.test(GOLD), '缺六爻暗金衬底底色（低透明暗金）');
  // Cinzel / Noto Serif 字体阶梯
  assert.ok(GOLD.includes('Cinzel'), '缺 Cinzel 字体阶梯');
  assert.ok(GOLD.includes('Noto Serif'), '缺 Noto Serif 字体阶梯');
  // 双层烫金细线 #D4AF37 / #F3E5AB
  assert.ok(GOLD.includes('#F3E5AB'), '缺香槟金 #F3E5AB 烫金线');
  assert.ok(GOLD.includes('#D4AF37'), '缺暗金 #D4AF37');
  // 离线铁律沿袭
  assert.ok(!GOLD.includes('fetch('), '金卡绘制混入 fetch（违离线铁律）');
  assert.ok(TOTEMS.includes('data:image/svg+xml'), '图腾库缺内联 data: SVG 出口');
});

test('①-8 App.tsx 金卡装配改结构化真值（不再直通 bazi 调试串）', async () => {
  assert.ok(!APP.includes('baziPattern: bazi'), 'App.tsx 仍把 engines.bazi.detail 调试串直通金卡');
  assert.ok(APP.includes('computeCardPillars'), '缺干支柱位装配');
  assert.ok(APP.includes('parseIchingHeadline'), '缺六爻卦名装配');
  assert.ok(/<GoldCardExporter/.test(APP), '金卡导出器被误拔（军令②要件保留）');
});

// ═══════════════ 刀二 · 结果页唯一交互收拢 ════════════════

test('②-1 伴读状态机物理拔除（import＋实例化＋IO 锚点）', async () => {
  assert.ok(!APP.includes('CompanionResonance'), 'App.tsx 仍挂伴读状态机（军令违：交流收拢首页）');
  assert.ok(!APP.includes('data-companion-anchor'), '结果页残留 IO 共鸣锚点');
});

test('②-2 结果页三要件保留（正文＋金卡＋带路回跳）', async () => {
  assert.ok(APP.includes('insight-result'), '报告正文区被误拔');
  assert.ok(/<GoldCardExporter/.test(APP), '金卡导出被误拔');
  assert.ok(/<AdoptFamiliarCTA/.test(APP), '灵宠认领/带路卡被误拔（军令③要件）');
  assert.ok(APP.includes("sessionStorage.setItem('ks_open_familiar_chat'") || read('web/src/components/AdoptFamiliarCTA.tsx').includes("sessionStorage.setItem('ks_open_familiar_chat'"), '带路令牌链路须保留');
});

// ═══════════════ 刀三 · 跨页权益穿透 ════════════════

test('③-1 合法灵宠档熔断付费拦截（E106 熔断闸）', async () => {
  // 军令：首页检测到合法且盘匹配档案即熔断付费拦截（沙盒匿名付讫用户 user_profiles 无记录 ⇒ 旧 paidOk 恒 false）
  assert.ok(HOME.includes('E106'), 'FamiliarHomeCard 缺 E106 熔断标记');
  assert.ok(/readFamiliarRecord/.test(HOME), '权益自检未读灵宠档');
  // 熔断语义：合法档在场 ⇒ paidOk 直放（判定中/无档仍 fail-closed）
  assert.ok(/paidOk === true/.test(HOME), 'showBreakout fail-closed 契约被破');
});

test('③-2 对话舱授权贯通（paidOk 入舱真值）', async () => {
  const SHEET = read('web/src/components/FamiliarChatSheet.tsx');
  assert.ok(SHEET.includes('paidOk'), '对话舱 paidOk 授权链被拆');
  // 拦截文案仅在 paidOk !== true 时出现（E106 熔断后合法档用户恒放行）
  assert.ok(SHEET.includes('chatNeedUnlock'), '402 拦截文案被拔（fail-closed 契约须保留）');
});

// ═══════════════ 刀四 · 首页趴键显化与点击联动 ════════════════

test('④-1 趴键点击脉冲 0.75s＋联动呼出对话舱', async () => {
  // 点击区（头/宝石）→ 微光脉冲 → 直接呼出对话舱（军令刀四）
  assert.ok(/setChatOpen\(true\)/.test(HOME), '点击未联动呼出对话舱');
  const zoneTap = /ks-fam-zone/.test(HOME);
  assert.ok(zoneTap, '头部/宝石命中区被拔');
  // 0.75s 脉冲（App.css ks-fam-pulse 0.75s×2 沿袭）
  assert.ok(/ks-fam-pulse\s+\.ks-fam-breathe\s*\{\s*animation:\s*ksFamPulse\s+0\.75s/.test(APPCSS), '0.75s 脉冲动效漂移');
});

test('④-2 E82 趴键几何真值回归锁（EN 基准 98px）', async () => {
  assert.ok(/\.ks-fam-milo\s*\{[^}]*left:\s*calc\(44%\s*-\s*62\.3px\)/s.test(APPCSS), 'Milo E82 几何漂移');
  assert.ok(/\.ks-fam-sophia\s*\{[^}]*left:\s*calc\(56%\s*-\s*35\.3px\)/s.test(APPCSS), 'Sophia E82 几何漂移');
  assert.ok(/\.ks-fam-milo\s*\{[^}]*width:\s*min\(98px,\s*70%\)/s.test(APPCSS), 'E82 体型锁漂移');
  assert.ok(/translateY\(calc\(38\.9%\s*\+\s*6px\)\)/.test(APPCSS), 'Milo 趴键垂距漂移');
  assert.ok(/translateY\(calc\(39\.2%\s*\+\s*6px\)\)/.test(APPCSS), 'Sophia 趴键垂距漂移');
  // 4 帧 WebP 全量挂载（本体/眨眼/尾梢）
  assert.ok(HOME.includes('miloBlink') && HOME.includes('sophiaBlink'), '眨眼帧未挂');
  assert.ok(HOME.includes('miloTail') && HOME.includes('sophiaTail'), '尾梢帧未挂');
  // 图层链：星空 z0 ＜ landing-wrap z2 ＜ anchor z2 ＜ 灵宠 z6
  assert.ok(/#ks-familiar-anchor\s*\{[^}]*z-index:\s*2/s.test(APPCSS), 'anchor z2 漂移');
  assert.ok(/\.ks-fam-breakout\s*\{[^}]*z-index:\s*6/s.test(APPCSS), 'breakout z6 漂移');
});

// ═══════════════ 刀五 · 军规链入编 ════════════════

test('⑤-1 军规链 82 段入编（E107 后继化：e106 居 e107 后 e40 前）', async () => {
  const segs = PKG.scripts['test:astro'].split('&&').map((s) => s.trim()).filter(Boolean);
  // 🛡️ E107 后继化：81→82（e107 插 e106 后 e40 前）⇒ e106 顺移至 len-4
  assert.equal(segs.length, 82, `军规链段数异常（实得 ${segs.length}，基线 82（E107 升 82 段））`);
  assert.ok(segs[segs.length - 1].includes('audit_v492_peak_window.py'), 'python 恒链尾被破');
  assert.ok(segs[segs.length - 2].includes('audit-e40-compat'), 'e40-compat 恒 len-2 被破');
  assert.ok(segs[segs.length - 3].includes('audit-e107'), 'e107 须居 len-3（e40 前）');
  assert.ok(segs[segs.length - 4].includes('audit-e106'), 'e106 须居 len-4（e107 后）');
  assert.ok(segs[segs.length - 5].includes('audit-e105'), 'e105 须居 len-5');
});
