// ═══ E139 闸门：星盘财商智库与破财避坑引擎（主公军令 2026-11-15）═══
// 纯函数同构引擎（E137 姊妹形制）：六册经典私人银行财商手册方法论×本命星盘
//   深度咬合——人生五阶分类器（20-30 起步/30-45 筑基三明治/45-60 巩固/
//   60-69 收官/70+ 黄金传承；无出生年默认三明治）＋四维处方（cashflow_stage
//   财库筑底/asset_spectrum 十维配置/credit_leverage 杠杆金律/cut_and_legacy
//   破局传承）＋chatQ1 六语钦定触发＋prompt 块注入＋SSE meta 帧
//   wealthPrescription 投影＋前端暗金罗盘卡（灵宠真名追问＋合规免责常驻）。
// 军规红线：零第三方银行品牌、零个股代码、零货币符号、零促销词（金融合规——
//   定性「星盘周期与财商教育」不构成持牌投顾建议）；i18n 六语 7 键
//   （132→139）；链位：e139 入编 e138 后、e40-compat 前；全链 106→107 段。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const ENG = await import(join(ROOT, 'web/src/lib/astroWealthAdvisoryEngine.mjs'));

/* ═══ E139-01 人生五阶分类器（VM 行为级：五阶精准路由＋无出生年默认三明治）═══ */
test('E139-01 五阶分类器：25/38/52/65/75 精准路由＋无出生年默认筑基三明治＋birthData 多形状', () => {
  const cases = [
    [25, 'starting_out'], [29, 'starting_out'], [30, 'sandwich_building'],
    [38, 'sandwich_building'], [44, 'sandwich_building'], [45, 'consolidating'],
    [52, 'consolidating'], [59, 'consolidating'], [60, 'winding_down'],
    [65, 'winding_down'], [69, 'winding_down'], [70, 'golden_legacy'], [75, 'golden_legacy'],
  ];
  for (const [age, want] of cases) {
    assert.equal(ENG.classifyWealthLifeStage(age), want, `age=${age} 须路由 ${want}`);
    assert.equal(ENG.computeAstroWealthPrescription({ age }).stageKey, want, `处方须路由 ${want}`);
  }
  // 无出生年/坏形状 ⇒ 默认 30-45 筑基三明治期（军令钦定）
  assert.equal(ENG.classifyWealthLifeStage(null), 'sandwich_building', '无年龄须默认三明治');
  assert.equal(ENG.classifyWealthLifeStage(undefined), 'sandwich_building', 'undefined 须默认三明治');
  assert.equal(ENG.classifyWealthLifeStage(-1), 'sandwich_building', '负数须默认三明治');
  assert.equal(ENG.classifyWealthLifeStage('38'), 'sandwich_building', '非数须默认（fail-closed）');
  // ageSource 三态：birth（出生年推算）＞ explicit（显式）＞ default
  const curYear = new Date().getUTCFullYear();
  const byBirth = ENG.computeAstroWealthPrescription({ birthData: '1985-06-15' });
  assert.equal(byBirth.ageSource, 'birth', 'YYYY-MM-DD 须推算年龄');
  assert.equal(byBirth.age, curYear - 1985, '年龄须为当前年差');
  assert.equal(ENG.computeAstroWealthPrescription({ birthData: { date: '1998-03-01' } }).age, curYear - 1998, '{date} 形状须解析');
  assert.equal(ENG.computeAstroWealthPrescription({ birthData: { year: 1970 } }).age, curYear - 1970, '{year} 形状须解析');
  const byDefault = ENG.computeAstroWealthPrescription({});
  assert.equal(byDefault.ageSource, 'default', '缺出生年 ⇒ default');
  assert.equal(byDefault.age, null, '缺出生年 ⇒ age null');
  const byExplicit = ENG.computeAstroWealthPrescription({ birthData: '1985-06-15', age: 52 });
  assert.equal(byExplicit.ageSource, 'explicit', '显式 age 须优先');
  assert.equal(byExplicit.stageKey, 'consolidating', '显式 52 岁须巩固期');
});

/* ═══ E139-02 四维处方结构＋16 套模板严选（六语内嵌单源）═══ */
test('E139-02 四维结构：钦定序＋五阶×四维全矩阵互异＋16 套模板＋六语文案齐备', () => {
  assert.deepEqual(ENG.WEALTH_PILLARS, ['cashflow_stage', 'asset_spectrum', 'credit_leverage', 'cut_and_legacy'],
    '四维钦定序（军令）');
  assert.equal(ENG.WEALTH_TEMPLATE_COUNT, 16, '模板套数须 16（cashflow 5 阶＋asset 5 元素＋credit 1＋cut 5 阶）');
  const langs = ['zh', 'en', 'fr', 'es', 'th', 'vi'];
  const stages = [25, 38, 52, 65, 75];
  // 五阶 × 六语全矩阵：四维齐备＋cashflow/cut 五阶文案互异
  for (const l of langs) {
    const cash = new Set();
    const cut = new Set();
    for (const age of stages) {
      const p = ENG.computeAstroWealthPrescription({ age, locale: l });
      assert.ok(p.ok, '处方须 ok');
      assert.ok(p.stageName && p.stageName.length >= 3, `阶段章[${l}] 须非空`);
      for (const d of ENG.WEALTH_PILLARS) {
        assert.ok(p.rx[d] && p.rx[d].prescription && p.rx[d].prescription.length >= 30,
          `${d}[${l} age=${age}] 文案须 ≥30 字`);
      }
      cash.add(p.rx.cashflow_stage.prescription);
      cut.add(p.rx.cut_and_legacy.prescription);
    }
    assert.equal(cash.size, 5, `cashflow[${l}] 五阶文案须互异`);
    assert.equal(cut.size, 5, `cut_and_legacy[${l}] 五阶文案须互异`);
  }
  // asset_spectrum：五元素配比方向互异（natalSigns 真源驱动）
  const natalSets = {
    fire: ['Leo', 'Aries', 'Sagittarius'],
    earth: ['Taurus', 'Virgo', 'Capricorn'],
    air: ['Gemini', 'Libra', 'Aquarius'],
    water: ['Cancer', 'Scorpio', 'Pisces'],
  };
  const assets = new Set();
  for (const [el, signs] of Object.entries(natalSets)) {
    const p = ENG.computeAstroWealthPrescription({ chartSummary: { natalSigns: signs }, locale: 'zh' });
    assert.equal(p.dominantElement, el, `${el} 星座组须推得 ${el}`);
    assets.add(p.rx.asset_spectrum.prescription);
  }
  assets.add(ENG.computeAstroWealthPrescription({ locale: 'zh' }).rx.asset_spectrum.prescription); // balanced 兜底
  assert.equal(assets.size, 5, 'asset_spectrum 五元素文案须互异');
  // credit_leverage：通用单套恒定（负债收入比 36% 红线军令锚）
  const c = ENG.computeAstroWealthPrescription({ age: 38, locale: 'zh' }).rx.credit_leverage.prescription;
  assert.ok(c.includes('36%'), '杠杆金律须含负债收入比 36% 红线（军令钦定）');
  assert.ok(c.includes('30%'), '信用卡利用率须守 30% 以下');
});

/* ═══ E139-03 金融合规红线：零银行品牌零股票代码零货币符号零促销词 ═══ */
test('E139-03 金融合规红线：引擎源＋卡片源＋i18n wealth 键零品牌零代码零货币零促销', () => {
  // 剥注释（// 行与 /* */ 块——铁律词只在注释规则行）＋剥 JS 模板插值 ${...}
  const stripCode = (s) => s
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\$\{[^}]*\}/g, '');
  const banned = [
    'Citi', 'Citibank', 'Citigroup', '花旗', 'HSBC', '汇丰', 'JPMorgan',
    'Wells Fargo', 'Bank of America', 'Barclays', 'UBS', 'DBS', '招商银行', '工商银行',
    'PayPal', 'Stripe', 'VISA', 'Mastercard',
    'AAPL', 'TSLA', 'GOOGL', 'GOOG', 'AMZN', 'MSFT', 'NVDA', '腾讯控股', '茅台',
  ];
  const promo = ['购买', '打折', '促销', '优惠券', '限时', '特惠', 'buy', 'discount', 'promo', 'coupon'];
  const scanFiles = [
    'web/src/lib/astroWealthAdvisoryEngine.mjs',
    'web/src/components/companion/WealthAdvisorySlot.tsx',
  ];
  for (const f of scanFiles) {
    const src = stripCode(read(f)).toLowerCase();
    for (const w of banned) {
      assert.ok(!src.includes(w.toLowerCase()), `${f} 严禁银行品牌/股票代码「${w}」`);
    }
    for (const w of promo) {
      assert.ok(!src.includes(w.toLowerCase()), `${f} 严禁促销词「${w}」`);
    }
    assert.ok(!/[$¥€£]\s?\d/.test(src), `${f} 严禁货币符号＋数字`);
  }
  // i18n 六语 wealth 键值面（42 条文案零品牌零促销零货币）
  for (const l of ['zh', 'en', 'fr', 'es', 'th', 'vi']) {
    const loc = JSON.parse(read(`web/src/i18n/locales/${l}.json`));
    const keys = ['wealth_rx_card_title', 'wealth_pillar_cashflow', 'wealth_pillar_allocation',
      'wealth_pillar_credit', 'wealth_pillar_cut_shield', 'wealth_ask_companion', 'wealth_edu_disclaimer'];
    const joined = keys.map((k) => String(loc[k] || '')).join('|').toLowerCase();
    for (const w of [...banned, ...promo]) {
      assert.ok(!joined.includes(w.toLowerCase()), `locales[${l}] wealth 键严禁「${w}」`);
    }
    assert.ok(!/[$¥€£]\s?\d/.test(joined), `locales[${l}] wealth 键零货币符号`);
  }
});

/* ═══ E139-04 触发网六语单源（chatQ1 钦定文本与 locales 逐字同源）═══ */
test('E139-04 触发网：chatQ1 六语钦定文本逐字同源＋财富语义六语命中＋负样本 fail-closed', () => {
  const texts = ENG.WEALTH_CHATQ1_TEXTS;
  assert.equal(texts.length, 6, 'chatQ1 钦定文本须六语');
  const langs = ['zh', 'en', 'fr', 'es', 'th', 'vi'];
  for (const l of langs) {
    const loc = JSON.parse(read(`web/src/i18n/locales/${l}.json`));
    const q1 = loc.familiar && loc.familiar.chatQ1;
    assert.ok(typeof q1 === 'string' && q1.trim(), `locales[${l}].familiar.chatQ1 在位`);
    assert.ok(texts.includes(q1), `引擎 chatQ1 文本须含 locales[${l}] 逐字`);
    assert.ok(ENG.detectWealthIntent(q1), `chatQ1[${l}] 须触发`);
  }
  // 财富语义六语命中（军令词族样本）
  const semantic = [
    '最近想买房，首付该准备多少', 'I want to invest for retirement', 'je veux épargner pour plus tard',
    'quiero invertir mi dinero', 'อยากซื้อบ้านต้องเก็บเงินเท่าไร', 'tôi muốn đầu tư và mua nhà',
  ];
  for (const s of semantic) assert.ok(ENG.detectWealthIntent(s), `财富语义须命中「${s.slice(0, 14)}」`);
  // 负样本 fail-closed（情绪/养生/塔罗闲聊不触发财富线）
  assert.equal(ENG.detectWealthIntent('今天心情有点低落'), false, '情绪闲聊不触发');
  assert.equal(ENG.detectWealthIntent('帮我算算塔罗'), false, '塔罗问句不触发');
  assert.equal(ENG.detectWealthIntent('今晚吃什么好'), false, '饮食闲聊不触发');
  assert.equal(ENG.detectWealthIntent(''), false, '空串不触发');
  assert.equal(ENG.detectWealthIntent(null), false, '非串不触发');
});

/* ═══ E139-05 灵宠真名追问模板（{name} 占位双态：模板在位＋replace 零残留）═══ */
test('E139-05 追问模板：六语 {name} 占位在位＋replace 零残留＋zh 军令例句逐字', () => {
  const T = ENG.WEALTH_ASK_TEMPLATES;
  const langs = ['zh', 'en', 'fr', 'es', 'th', 'vi'];
  for (const l of langs) {
    assert.ok(T[l] && T[l].includes('{name}'), `WEALTH_ASK_TEMPLATES[${l}] 须含 {name} 占位`);
    const filled = T[l].replace('{name}', 'Sophia');
    assert.ok(!filled.includes('{name}'), `replace 后[${l}] 零占位残留`);
    assert.ok(filled.startsWith('Sophia') || filled.includes('Sophia'), `replace 后[${l}] 真名须在句`);
  }
  // zh 军令例句逐字（钦定）
  assert.equal(T.zh, '{name}，请结合我的星盘二宫与八宫格局，按「十维资产光谱」与「CUT法则」为我推演今年的守财与攻守配比建议。',
    'zh 追问句须军令钦定逐字');
});

/* ═══ E139-06 prompt 注入块（引擎单源 buildWealthSystemPromptBlock）═══ */
test('E139-06 prompt 注入块：[ASTRO_WEALTH_ADVISORY_RX] 结构＋金融合规铁律＋零品牌零货币', () => {
  const p = ENG.computeAstroWealthPrescription({ birthData: '1985-06-15', locale: 'zh' });
  const block = ENG.buildWealthSystemPromptBlock(p, 'zh');
  assert.ok(typeof block === 'string' && block.length > 200, '注入块须生成');
  assert.ok(block.includes('ASTRO_WEALTH_ADVISORY_RX'), '块头须军令钦定');
  assert.ok(block.includes('财库筑底（维度A·第2宫）'), '维度 A 须第 2 宫锚');
  assert.ok(block.includes('杠杆金律（维度C·第8宫）'), '维度 C 须第 8 宫锚');
  assert.ok(block.includes('破局与传承（维度D·CUT法则）'), '维度 D 须 CUT 法则锚');
  assert.ok(block.includes('金融合规铁律'), '块须含金融合规铁令（零个股零银行零持牌建议）');
  assert.ok(block.includes('严禁出现任何具体股票代码'), '合规铁律须点名禁个股代码');
  // 块内零品牌零货币（金融合规红线——块直进 LLM 上下文）
  for (const w of ['Citi', '花旗', 'HSBC', 'AAPL', 'TSLA']) {
    assert.ok(!block.includes(w), `注入块严禁品牌/代码「${w}」`);
  }
  assert.ok(!/[$¥€£]\s?\d/.test(block), '注入块零货币符号');
  // fail-closed：坏处方 ⇒ null ⇒ 块不注入（零破坏）
  assert.equal(ENG.buildWealthSystemPromptBlock(null, 'zh'), null, 'null 处方须回 null');
  assert.equal(ENG.buildWealthSystemPromptBlock({}, 'zh'), null, '坏形状须回 null');
  assert.equal(ENG.buildWealthSystemPromptBlock({ ok: false }, 'zh'), null, '非 ok 须回 null');
});

/* ═══ E139-07 server 接线全链（触发链＋prompt 块＋meta 帧＋gate45 锚位守恒）═══ */
test('E139-07 server 接线：懒加载＋detectWealthIntent 触发＋wealthBlockText 传参＋meta 帧投影＋锚位守恒', () => {
  const server = read('server.js');
  // 懒加载（E137 同构）
  assert.ok(server.includes("_e139WealthMod = await import('./web/src/lib/astroWealthAdvisoryEngine.mjs')"),
    '引擎懒加载须在（E137 同构形制）');
  // 触发链三件：detectWealthIntent（末条 user）＋主入口＋prompt 块单源
  assert.ok(server.includes('detectWealthIntent(_e137LastUser.content)'), '末条 user 触发检测在位（复用 E137 末条锚）');
  assert.ok(server.includes('computeAstroWealthPrescription({'), '引擎主入口调用在位');
  assert.ok(server.includes('_e139Eng.buildWealthSystemPromptBlock(wealthRx, lang)'), 'prompt 块须引擎单源生成');
  assert.ok(server.includes('birthData: _e139Birth'), '五阶定位须收出生年真值（body.birth.date ＞ auth.userBirthDate）');
  // prompt 传参与块注入
  assert.ok(server.includes('wealthBlockText,'), 'buildFamiliarChatSystemPrompt 须收 wealthBlockText');
  assert.ok(server.includes('wealthBlock.push(wealthBlockText)'), '块数组须 push 引擎文本');
  const iWell = server.indexOf('...wellnessBlock,');
  const iWealth = server.indexOf('...wealthBlock,');
  assert.ok(iWell > 0 && iWealth > iWell, 'wealth 块须在 wellness 块后（军令序）');
  // meta 帧投影（前端卡单源：四维＋阶段章）
  assert.ok(server.includes('wealthPrescription: {'), 'SSE meta 帧须带 wealthPrescription 投影');
  const iMeta = server.indexOf('wealthPrescription: {');
  const metaSeg = server.slice(iMeta, iMeta + 700);
  for (const f of ['stageKey', 'stageName', 'cashflow_stage', 'asset_spectrum', 'credit_leverage', 'cut_and_legacy']) {
    assert.ok(metaSeg.includes(f), `meta 帧须带 ${f}`);
  }
  assert.ok(metaSeg.includes('dominantElement'), 'meta 帧须带本命元素');
  // gate45 锚位守恒（E138 血训遗产）：E139 代码禁落 create-checkout 收银窗
  const coStart = server.indexOf("app.post('/api/create-checkout'");
  const coSeg = server.slice(coStart, coStart + 9000);
  for (const anchor of ['detectWealthIntent', 'computeAstroWealthPrescription', '_e139WealthEngine', 'wealthPrescription']) {
    assert.ok(!coSeg.includes(anchor), `gate45 锚位守恒：create-checkout 窗内严禁 E139 锚「${anchor}」`);
  }
});

/* ═══ E139-08 前端挂载（FamiliarChatSheet 投影＋罗盘卡＋真名追问）═══ */
test('E139-08 前端挂载：SSE meta 投影＋WealthAdvisorySlotCard 挂载＋{name} 追问直发 send', () => {
  const sheet = read('web/src/components/FamiliarChatSheet.tsx');
  assert.ok(sheet.includes("from './companion/WealthAdvisorySlot'"), '对话舱须导入罗盘卡');
  assert.ok(sheet.includes('isWealthAdvisoryMeta(j.meta.wealthPrescription)'), 'SSE meta 投影须形状守卫 fail-closed');
  assert.ok(sheet.includes('setWealthSlot({ aid, rx: j.meta.wealthPrescription })'), '投影须绑定本轮 aid');
  assert.ok(sheet.includes('<WealthAdvisorySlotCard'), '罗盘卡须挂载（E137 同构插槽）');
  assert.ok(sheet.includes('wealthSlot.aid'), '挂载须 id 精确匹配（本轮 assistant 落地）');
  assert.ok(sheet.includes('onAsk={(msg) => { void send(msg); }}'), '真名追问须直发 send（免 pendingAsk 通道）');
  // 卡片组件：形状守卫＋四维标签＋真名单源＋免责常驻
  const card = read('web/src/components/companion/WealthAdvisorySlot.tsx');
  assert.ok(card.includes('export function isWealthAdvisoryMeta'), '形状守卫须导出（挂载点消费）');
  for (const k of ['wealth_pillar_cashflow', 'wealth_pillar_allocation', 'wealth_pillar_credit', 'wealth_pillar_cut_shield']) {
    assert.ok(card.includes(`'${k}'`), `四维标签键须消费 ${k}`);
  }
  assert.ok(card.includes("t('wealth_rx_card_title')"), '标题须走 i18n');
  assert.ok(card.includes("t('wealth_ask_companion')"), '主按钮文案须走 i18n');
  assert.ok(card.includes(".replace('{name}', companionName)"), '真名须手动 replace（军令单括号铁律）');
  assert.ok(card.includes('companionDisplayName'), '灵宠真名单源（familiarHome 认领档）');
  assert.ok(card.includes("t('wealth_edu_disclaimer')"), '免责声明须常驻卡底（六语）');
  assert.ok(card.includes('WEALTH_ASK_TEMPLATES'), '追问句须引擎单源');
  assert.ok(card.includes('width: 48'), '四维行图标列须 48px（E137 军规）');
  assert.ok(card.includes("width: '360px', maxWidth: '100%'"), '卡宽须 360px＋maxWidth 兜底（390×844 零横溢）');
  assert.ok(card.includes('overflowWrap:'), '泰语长词须防溢出');
});

/* ═══ E139-09 i18n 六语 7 键军令词表逐字（132→139 基线锁定）═══ */
test('E139-09 i18n 六语 7 键：军令词表逐字比对＋键集合六语全等＋139 基线', () => {
  // 军令钦定词表（六语逐字——2026-11-15 军令原文）
  const WORD = {
    wealth_rx_card_title: {
      zh: '✦ 星盘财商与守财罗盘 ✦', en: '✦ Astro-Wealth & Capital Compass ✦', fr: '✦ Boussole Astro-Patrimoniale ✦',
      es: '✦ Brújula Astro-Patrimonial ✦', th: '✦ เข็มทิศภูมิปัญญาแห่งความมั่งคั่ง ✦', vi: '✦ La Bàn Trí Tuệ Tài Lộc ✦',
    },
    wealth_pillar_cashflow: {
      zh: '财库筑底 · 现金流与五阶律', en: 'Vault Foundation · Cashflow & Life Stages', fr: 'Socle du Trésor · Flux & Cycles de Vie',
      es: 'Base del Tesoro · Flujo y Etapas', th: 'รากฐานคลังทรัพย์ · กระแสเงินสดตามวัย', vi: 'Nền Tảng Kho Tài · Dòng Tiền & Chu Kỳ',
    },
    wealth_pillar_allocation: {
      zh: '十维配置 · 跨周期资产光谱', en: '10-Class Spectrum · Multi-Asset Balance', fr: 'Spectre à 10 Actifs · Équilibre Cyclique',
      es: 'Espectro de 10 Activos · Equilibrio', th: 'พอร์ต 10 สินทรัพย์ · สมดุลข้ามวัฏจักร', vi: 'Phổ 10 Tài Sản · Cân Bằng Chu Kỳ',
    },
    wealth_pillar_credit: {
      zh: '杠杆金律 · 信用护盾与比率', en: 'Leverage Rules · Credit & Debt Ratios', fr: 'Règles de Levier · Crédit & Ratios',
      es: 'Reglas de Apalancamiento · Crédito', th: 'กฎทองสินเชื่อ · เกราะป้องกันหนี้', vi: 'Luật Đòn Bẩy · Tín Dụng & Tỷ Lệ Nợ',
    },
    wealth_pillar_cut_shield: {
      zh: '中年破局 · CUT法则与四护盾', en: 'Midlife Mastery · CUT Rule & 4 Shields', fr: 'Maîtrise Médiane · Règle CUT & 4 Boucliers',
      es: 'Maestría Media · Regla CUT y 4 Escudos', th: 'กลยุทธ์วัยกลางคน · กฎ CUT และ 4 เกราะ', vi: 'Phá Cục Trung Niên · Luật CUT & 4 Lá Chắn',
    },
    wealth_ask_companion: {
      zh: '✦ 让 {name} 推演我的本命财库配比', en: '✦ Ask {name} for My Natal Wealth Allocation', fr: '✦ Demander mon Allocation Natale à {name}',
      es: '✦ Consultar mi Asignación Natal con {name}', th: '✦ ให้ {name} วิเคราะห์สัดส่วนคลังทรัพย์พื้นดวง', vi: '✦ Nhờ {name} Luận Giải Tỷ Lệ Kho Tài',
    },
    wealth_edu_disclaimer: {
      zh: '✧ 本指引融合占星周期与经典财商教育框架，仅供个人财务认知启发，不构成任何持牌证券、税务或投资买卖建议。',
      en: '✧ Combining astrological cycles with classic wealth literacy frameworks for educational insight only; does not constitute licensed investment, tax, or legal advice.',
      fr: "✧ Alliance de cycles astrologiques et d'éducation patrimoniale à titre purement informatif ; ne constitue aucun conseil financier, fiscal ou juridique agréé.",
      es: '✧ Combinación de ciclos astrológicos y educación financiera con fines estrictamente informativos; no constituye asesoramiento financiero, fiscal ni legal autorizado.',
      th: '✧ คำแนะนำนี้ผสานวัฏจักรดวงดาวเข้ากับหลักการบริหารความมั่งคั่งเพื่อการศึกษาเท่านั้น ไม่ใช่คำแนะนำการลงทุนหรือภาษีที่มีใบอนุญาต',
      vi: '✧ Chỉ dẫn kết hợp chu kỳ chiêm tinh và kiến thức quản lý tài sản nhằm mục đích giáo dục; không cấu thành tư vấn đầu tư, thuế hay pháp lý được cấp phép.',
    },
  };
  const langs = ['zh', 'en', 'fr', 'es', 'th', 'vi'];
  const locs = {};
  for (const l of langs) { locs[l] = JSON.parse(read(`web/src/i18n/locales/${l}.json`)); }
  for (const [key, dict] of Object.entries(WORD)) {
    for (const l of langs) {
      assert.equal(locs[l][key], dict[l], `locales[${l}].${key} 须军令词表逐字`);
    }
  }
  // 键集合六语全等（7 键六语同步——checkKeySetParity 主防线）
  const keySets = langs.map((l) => new Set(Object.keys(locs[l])));
  for (const ks of keySets.slice(1)) {
    assert.deepEqual([...ks].sort(), [...keySets[0]].sort(), '六语键集合须全等');
  }
  // 139 基线（audit-i18n-keys ⑤ 断言须已刷）
  const gate = read('test/audit-i18n-keys.test.js');
  assert.ok(gate.includes('assert.strictEqual(p.total, 142'), 'i18n 元闸门基准须 139（132＋7 军令键）');
});

/* ═══ E139-10 军规链段数自证（插链后 106→107）═══ */
test('E139-10 军规链段数：package.json test:astro 全链 107 段（e139 居 e138 后 e40-compat 前）', () => {
  const pkg = JSON.parse(read('package.json'));
  const chain = pkg.scripts['test:astro'];
  const segs = chain.split('&&').map((s) => s.trim()).filter(Boolean);
  assert.equal(segs.length, 124, `军规链段数须 107（E139 入编后 106→107；实 ${segs.length}）`);   // 🔴 后继化（E158 入编）：123→124
  const joined = segs.join(' && ');
  const iE138 = joined.indexOf('audit-e138-tester-vip-funnel-sandbox');
  const iE139 = joined.indexOf('audit-e139-astro-wealth-advisory');
  const iE40 = joined.indexOf('audit-e40-compat');
  assert.ok(iE138 > 0 && iE139 > 0 && iE40 > 0, '三锚须在链');
  assert.ok(iE138 < iE139 && iE139 < iE40, 'e139 须居 e138 后、e40-compat 前（python 恒链尾）');
  // e40 恒 len-2（倒数第二）——python 链尾承袭
  assert.ok(segs[segs.length - 2].includes('e40-compat'), 'e40-compat 恒 len-2');
  assert.ok(segs[segs.length - 1].includes('python3'), 'python3 恒链尾');
});

/* ═══ E139-11 dist 实证（build 产物含 wealth 键＋引擎模板；零品牌残留）═══ */
test('E139-11 dist 实证：wealth 七键已入 bundle＋追问模板在位＋零银行品牌残留', () => {
  const abs = join(ROOT, 'web/dist/assets');
  if (!existsSync(abs)) return; // 未 build 环境（CI 前置）跳过
  let foundKey = false;
  let foundAsk = false;
  for (const f of readdirSync(abs)) {
    if (!f.endsWith('.js')) continue;
    const src = readFileSync(join(abs, f), 'utf8');
    if (src.includes('wealth_rx_card_title')) foundKey = true;
    if (src.includes('CUT法则') || src.includes('CUT Rule')) foundAsk = true;
    // 品牌零残留（全 dist js 面——中文品牌与英文高频精确词）
    for (const w of ['花旗', 'Citibank', 'Citigroup', '汇丰', '招商银行', '工商银行', 'JPMorgan', 'Wells Fargo']) {
      assert.ok(!src.includes(w), `dist/${f} 严禁银行品牌「${w}」`);
    }
  }
  assert.ok(foundKey, 'dist 须含 wealth_rx_card_title（i18n 七键入编实证）');
  assert.ok(foundAsk, 'dist 须含 CUT 法则追问模板（引擎入编实证）');
});
