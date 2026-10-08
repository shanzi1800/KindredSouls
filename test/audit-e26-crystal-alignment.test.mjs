// ═══════════════════════════════════════════════════════════════════════════
// 🛡️ E26「矿石与空间仪式能量归位」闸门（2026-10-08 军师 E26 落地号令）
//
// 依据：《KindredSouls 水晶/饰品植入设计规范 v1.1》（主公三项裁决）
//   ① 只做「能量对应」不做功效承诺（§2.5 铁律） ② 报告与商城彻底解耦（§3.6）
//   ③ 真值推导 + 单一建议（§7.5） ④ 确定性闭集表，禁 LLM 自创矿石（§8.1）
//
// 七类断言（规范 §8.8）：
//   A 六语水晶表完整性（每行星/元素/宫位有值 · 无空 · 无幽灵 id · 无 undefined）
//   B 推导行为（vm 直调 buildCrystalAnchors：三区分区 · 真值在位 · 无真值 ⇒ null）
//   C 红线扫描（禁词 / 功效承诺句式 / once 时间词哨兵）
//   D 格式铁律不变（年报第五章标题行逐字节 · 月报 ✦ [...] 格式与次数 · 既有锁未损）
//   E 接线自保（server.js import + 共享守卫 ⑦ 分区注入）
//   F 注入自测（删表项 / 缺语种 / 改键名 ⇒ 同源判据必红）
// ═══════════════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { indexDecls } from './tools/extract_decls.mjs';
import {
  buildCrystalAnchors, crystalName,
  _CRYSTAL_LANGS, _CRYSTAL_NAME, _CRYSTAL_BY_PLANET, _CRYSTAL_BY_ELEMENT,
  _CRYSTAL_BY_HOUSE, _CRYSTAL_BY_SPACE, _CRYSTAL_WEEK_PLANETS,
  _CRYSTAL_SIGN_ORDER, _CRYSTAL_SIGN_RULER, _CRYSTAL_SIGN_ELEMENT,
  _CRYSTAL_REDLINES, _CRYSTAL_PLACEMENT,
  _crystalHouseSign, _crystalDominantElement, _crystalGuardStone, _crystalTransitRuler,
} from '../v69_client.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf-8');

/** 剥注释：判据只看代码（防解释性注释里的旧写法假红） */
function stripComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/[^\n]*$/gm, ' ').replace(/([^:])\/\/[^\n]*/g, '$1 ');
}

// ── 确定性「构造盘」（行为级测试专用；非线上真值，仅用于推导链路验证）──
//   上升巨蟹 ⇒ 等宫制 H2=狮子；cusps 显式给出以走 Placidus 分支（H2=狮子→主星 Sun）。
const AM = {
  meta: {
    rising_sign: 'Cancer',
    sun_sign: 'Aries',
    house_cusps_full: Object.fromEntries(
      Array.from({ length: 12 }, (_, i) => ['house_' + (i + 1), { sign: _CRYSTAL_SIGN_ORDER[(i + 3) % 12] }]),
    ),
    computed_houses: {
      Sun: { sign: 'Aries', house: 10 }, Moon: { sign: 'Leo', house: 2 },
      Mercury: { sign: 'Gemini', house: 4 }, Venus: { sign: 'Taurus', house: 3 },
      Mars: { sign: 'Capricorn', house: 9 }, Jupiter: { sign: 'Sagittarius', house: 8 },
      Saturn: { sign: 'Libra', house: 7 }, Uranus: { sign: 'Scorpio', house: 8 },
      Neptune: { sign: 'Sagittarius', house: 9 }, Pluto: { sign: 'Libra', house: 7 },
    },
  },
  months: [{ sun: { sign: 'Cancer', house: 1 } }],
};

// ═══════════════════════ A 六语水晶表完整性 ═══════════════════════

/** 同源判据：返回缺陷列表（空 = 通过）。既有真实表与注入缺陷表共用此函数 ⇒ 真自测 */
function tableDefects(nameTable, byPlanet, byElement, byHouse, bySpace, weekPlanets, signOrder, signRuler, signElement) {
  const bad = [];
  const ids = new Set(Object.keys(nameTable));
  const LANGS = ['zh', 'en', 'es', 'fr', 'th', 'vi'];

  for (const [id, e] of Object.entries(nameTable)) {
    for (const L of LANGS) {
      const v = e && e[L];
      if (!(typeof v === 'string' && v.trim().length > 0)) bad.push(`缺语种名 ${id}.${L}`);
      else if (/undefined|null|NaN|__/.test(v)) bad.push(`占位符污染 ${id}.${L}`);
    }
  }
  const checkRec = (rec, where) => {
    if (!rec || typeof rec !== 'object') { bad.push(`映射缺失 ${where}`); return; }
    for (const k of ['main', 'alt']) {
      if (!rec[k]) bad.push(`空洞 ${where}.${k}`);
      else if (!ids.has(rec[k])) bad.push(`幽灵矿石 id ${where}.${k}=${rec[k]}`);
    }
  };
  for (const p of ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']) {
    checkRec(byPlanet[p], 'planet:' + p);
  }
  for (const el of ['Fire', 'Earth', 'Air', 'Water']) checkRec(byElement[el], 'element:' + el);
  for (const h of [2, 8, 10]) checkRec(byHouse[h], 'house:' + h);
  for (const sp of ['bedroom', 'kitchen', 'vault']) checkRec(bySpace[sp], 'space:' + sp);
  for (const p of weekPlanets) if (!byPlanet[p]) bad.push(`周主星无映射 ${p}`);
  if (weekPlanets.length !== 4) bad.push(`周主星须恰 4 个（实际 ${weekPlanets.length}）`);
  if (signOrder.length !== 12) bad.push(`星座表须 12 项（实际 ${signOrder.length}）`);
  for (const s of signOrder) {
    if (!signRuler[s]) bad.push(`星座缺主星 ${s}`);
    else if (!byPlanet[signRuler[s]]) bad.push(`星座主星无矿石映射 ${s}→${signRuler[s]}`);
    if (!['Fire', 'Earth', 'Air', 'Water'].includes(signElement[s])) bad.push(`星座元素非法 ${s}`);
  }
  return bad;
}

test('A1 六语水晶表零缺陷（每行星/元素/宫位/空间有值 · 无空 · 无幽灵 id · 无占位符）', () => {
  const bad = tableDefects(_CRYSTAL_NAME, _CRYSTAL_BY_PLANET, _CRYSTAL_BY_ELEMENT,
    _CRYSTAL_BY_HOUSE, _CRYSTAL_BY_SPACE, _CRYSTAL_WEEK_PLANETS,
    _CRYSTAL_SIGN_ORDER, _CRYSTAL_SIGN_RULER, _CRYSTAL_SIGN_ELEMENT);
  assert.deepStrictEqual(bad, [], '表缺陷:\n' + bad.join('\n'));
});

test('A2 六语植入位置与红线文案齐备（once/monthly/yearly × 6 语）', () => {
  for (const L of _CRYSTAL_LANGS) {
    assert.ok(typeof _CRYSTAL_REDLINES[L] === 'string' && _CRYSTAL_REDLINES[L].length > 20, `缺红线 ${L}`);
    for (const rt of ['once', 'monthly', 'yearly']) {
      const v = _CRYSTAL_PLACEMENT[L] && _CRYSTAL_PLACEMENT[L][rt];
      assert.ok(typeof v === 'string' && v.length > 20, `缺植入位置文案 ${L}.${rt}`);
    }
  }
});

// ═══════════════════════ B 推导行为（真值链路） ═══════════════════════

test('B1 once 分区：2 宫主星→A 石 · 守财石→B · 主导元素→C', () => {
  const r = buildCrystalAnchors(AM, 'zh', 'once');
  assert.ok(r && r.block && r.directive, 'once 未产出 {block,directive}');
  // cusps H2 = _CRYSTAL_SIGN_ORDER[4-1+3=... ] ⇒ (i+3)%12, i=1 ⇒ 4 ⇒ Leo ⇒ 主星 Sun ⇒ ruby(红宝石)
  assert.strictEqual(_crystalHouseSign(AM, 2), 'Leo');
  assert.strictEqual(_CRYSTAL_SIGN_RULER.Leo, 'Sun');
  assert.ok(r.block.includes('红宝石'), 'once A 石未按 2 宫主星推导');
  assert.ok(r.block.includes('黑曜石'), 'once B 守财石缺失');
  assert.strictEqual(_crystalDominantElement(AM), 'Fire');   // Aries(2)+Leo(2)+Sag×2 = Fire 主导
  assert.ok(r.block.includes('石榴石'), 'once C 元素石未按主导元素推导');
  assert.ok(/CRYSTAL ALIGNMENT/.test(r.block), 'once 块头缺失');
  // 三区分区：once 不得出现四周卡/五章空间项
  assert.ok(!/Weekly Stones/.test(r.block), 'once 误含月报周石项');
  assert.ok(!/Space Stones/.test(r.block), 'once 误含年报空间石项');
});

test('B2 monthly 分区：主运星石 + 四周固定四星 + 钱包守财石', () => {
  const r = buildCrystalAnchors(AM, 'zh', 'monthly');
  assert.ok(r && r.block, 'monthly 未产出块');
  assert.ok(/Monthly Attunement Stone/.test(r.block), 'monthly 缺主题卡调频石');
  assert.ok(/Weekly Stones/.test(r.block), 'monthly 缺四周卡石');
  assert.ok(/W1=/.test(r.block) && /W4=/.test(r.block), 'monthly 四周石序号不齐');
  assert.ok(/Wallet Guard Stone/.test(r.block), 'monthly 缺钱包守财石');
  assert.ok(/Obsidian/.test(r.block) || r.block.includes('黑曜石'), 'monthly 钱包石非黑曜石');
  // 周序不可错：W1=水星(绿松石) → W2=海王(紫水晶) → W3=土星(蓝宝石) → W4=木星(黄水晶)
  const order = _CRYSTAL_WEEK_PLANETS.map(p => _CRYSTAL_BY_PLANET[p].main);
  assert.deepStrictEqual(order, ['turquoise', 'amethyst', 'sapphire', 'citrine'], '四周周主星序错位');
  const i1 = r.block.indexOf('W1='), i2 = r.block.indexOf('W2='), i3 = r.block.indexOf('W3='), i4 = r.block.indexOf('W4=');
  assert.ok(i1 > -1 && i1 < i2 && i2 < i3 && i3 < i4, '四周石输出顺序错乱');
  // 分区：monthly 不得含五章空间项
  assert.ok(!/Space Stones/.test(r.block), 'monthly 误含年报空间石项');
});

test('B3 yearly 分区：三空间固定配石（H4/H2/H8）+ 第一/三章', () => {
  const r = buildCrystalAnchors(AM, 'zh', 'yearly');
  assert.ok(r && r.block, 'yearly 未产出块');
  assert.ok(/Space Stones/.test(r.block), 'yearly 缺五章空间石');
  assert.ok(/bedroom\(H4\)/.test(r.block), 'yearly 缺卧室(4宫)项');
  assert.ok(/kitchen\(H2\/H8\)/.test(r.block), 'yearly 缺厨房(2/8宫)项');
  assert.ok(/vault\(H8\)/.test(r.block), 'yearly 缺财务室(8宫)项');
  // 固定配石与既有宫位铁律一一对应
  assert.strictEqual(_CRYSTAL_BY_SPACE.bedroom.house, 4);
  assert.strictEqual(_CRYSTAL_BY_SPACE.kitchen.house, 2);
  assert.strictEqual(_CRYSTAL_BY_SPACE.vault.house, 8);
  assert.ok(/Year Amulet Stone/.test(r.block), 'yearly 缺第一章护身石');
  assert.ok(/Career Element Stone/.test(r.block), 'yearly 缺第三章元素石');
  // 分区：yearly 不得含月报周石项
  assert.ok(!/Weekly Stones/.test(r.block), 'yearly 误含月报周石项');
});

test('B4 无真值 ⇒ null（绝不伪造）', () => {
  assert.strictEqual(buildCrystalAnchors(null, 'zh', 'once'), null, 'null 矩阵仍产出块');
  assert.strictEqual(buildCrystalAnchors(undefined, 'zh', 'monthly'), null, 'undefined 矩阵仍产出块');
  assert.strictEqual(buildCrystalAnchors({ meta: {} }, 'zh', 'once'), null, '无 cusps 无 rising 仍产出块（伪造）');
  assert.strictEqual(buildCrystalAnchors(AM, 'zh', 'bogus'), null, '未知报告类型仍产出块');
});

test('B5 宫头推导：Placidus cusps 优先；缺失 ⇒ 等宫制回落；真值缺失 ⇒ null', () => {
  assert.strictEqual(_crystalHouseSign(AM, 2), 'Leo', 'cusps 分支未生效');
  const noCusps = { meta: { rising_sign: 'Cancer' }, months: [] };
  assert.strictEqual(_crystalHouseSign(noCusps, 1), 'Cancer', '等宫制 H1 应=上升');
  assert.strictEqual(_crystalHouseSign(noCusps, 2), 'Leo', '等宫制 H2 应=上升+1');
  assert.strictEqual(_crystalHouseSign(noCusps, 8), 'Aquarius', '等宫制 H8 错位');
  assert.strictEqual(_crystalHouseSign({ meta: {} }, 1), null, '无真值未返回 null');
});

test('B6 六语真值块：本地语名 + 英文锚定，无 undefined/NaN', () => {
  for (const L of _CRYSTAL_LANGS) {
    for (const rt of ['once', 'monthly', 'yearly']) {
      const r = buildCrystalAnchors(AM, L, rt);
      assert.ok(r && r.block, `${L}/${rt} 未产出块`);
      assert.ok(!/undefined|NaN/.test(r.block), `${L}/${rt} 块含 undefined/NaN`);
      assert.ok(!/undefined|NaN/.test(r.directive), `${L}/${rt} 指令含 undefined/NaN`);
      // 英文锚定必须出现在（本地 != 英文 时）
      const ruby = _CRYSTAL_NAME.ruby;
      if (r.block.includes(ruby[L]) && ruby[L] !== ruby.en) {
        assert.ok(r.block.includes(`(${ruby.en})`), `${L}/${rt} 缺英文锚定`);
      }
    }
  }
});

test('B7 usedIds 全部为合法词典 id', () => {
  const ids = new Set(Object.keys(_CRYSTAL_NAME));
  for (const rt of ['once', 'monthly', 'yearly']) {
    const r = buildCrystalAnchors(AM, 'zh', rt);
    assert.ok(Array.isArray(r.usedIds) && r.usedIds.length > 0, `${rt} usedIds 为空`);
    for (const id of r.usedIds) assert.ok(ids.has(id), `${rt} usedIds 含非法 id ${id}`);
  }
});

// ═══════════════════════ C 红线扫描（§2.5 / §3.6 / §7） ═══════════════════════

const BANNED_WORDS = ['购买', '推荐', '链接', '商城', '同款', '开光', '转运', '招财', '功效保证',
  'buy', 'purchase', 'shop', 'price', 'link', 'comprar', 'acheter', 'tienda', 'boutique', 'ซื้อ', 'ร้านค้า', 'mua', 'cửa hàng'];

test('C1 禁词扫描：真值块不得含商城/导流/玄学兜售类词；指令须显式禁导流', () => {
  // 真值块 = 供 LLM 采信的矿石真值 ⇒ 严格扫描
  for (const rt of ['once', 'monthly', 'yearly']) {
    for (const L of _CRYSTAL_LANGS) {
      const r = buildCrystalAnchors(AM, L, rt);
      const all = r.block.toLowerCase();
      for (const w of BANNED_WORDS) {
        assert.ok(!all.includes(w.toLowerCase()), `${rt}/${L} 真值块含禁词「${w}」`);
      }
    }
  }
  // 指令是「给 LLM 的约束」，其中**必然引用**禁词以禁止之（自指）⇒ 改判「正面证据」：
  // 六语红线必须显式禁止「价格/品牌/产地/购买渠道/商城名称」。
  assert.ok(/价格、品牌、产地、购买渠道、商城名称/.test(_CRYSTAL_REDLINES.zh), 'zh 红线未显式禁导流');
  assert.ok(/price, brand, origin, purchase channel or shop name/.test(_CRYSTAL_REDLINES.en), 'en 红线未显式禁导流');
  assert.ok(/prix, marque, origine, canal d'achat ou nom de boutique/.test(_CRYSTAL_REDLINES.fr), 'fr 红线未显式禁导流');
  assert.ok(/precio, marca, origen, canal de compra ni nombre de tienda/.test(_CRYSTAL_REDLINES.es), 'es 红线未显式禁导流');
});

test('C2 功效承诺句式扫描（§2.5 红线）：不得含因果承诺句', () => {
  // 块内不得出现「戴上/摆放/佩戴 + 就会/能/必/可以」类因果承诺
  const promiseRe = [
    /戴上[^。\n]{0,10}(就会|就可以|能|必|一定|保证)/,
    /摆放[^。\n]{0,10}(就会|就可以|能|必|一定|保证)/,
    /佩戴[^。\n]{0,10}(就会|就可以|能|必|一定|保证)/,
    /wearing[^.\n]{0,20}(will|cures?|guarantees?)/i,
    /usar[^.\n]{0,20}(traerá|curará)/i,
  ];
  for (const rt of ['once', 'monthly', 'yearly']) {
    for (const L of _CRYSTAL_LANGS) {
      const r = buildCrystalAnchors(AM, L, rt);
      for (const re of promiseRe) {
        assert.ok(!re.test(r.block), `${rt}/${L} 块含功效承诺句 ${re}`);
      }
    }
  }
  // 正面证据：六语红线必须**显式禁止**功效承诺（防红线被静默删除）
  for (const L of _CRYSTAL_LANGS) {
    const t = _CRYSTAL_REDLINES[L];
    assert.ok(/功效承诺|efficacy|causal|efectos causales|effet causal|ผลเชิงเหตุผล|hiệu quả nhân quả/.test(t),
      `${L} 红线未显式禁止功效承诺`);
  }
});

test('C3 once 时间词哨兵：once 块与指令不得含月份/年份/「今年」类时间词', () => {
  const timeRe = [/\b20\d{2}\b/, /今年|明年|下个月|本月/, /this year|next month|this month/i,
    /cette année|le mois prochain/i, /este año|el próximo mes/i, /ปีนี้|เดือนหน้า/, /năm nay|tháng sau/i];
  for (const L of _CRYSTAL_LANGS) {
    const r = buildCrystalAnchors(AM, L, 'once');
    const all = r.block + '\n' + r.directive;
    for (const re of timeRe) assert.ok(!re.test(all), `once/${L} 含时间词 ${re}`);
  }
});

// ═══════════════════════ D 格式铁律不变（回归守卫） ═══════════════════════

test('D1 年报第五章空间标题行格式铁律未被改动（逐字节）', () => {
  assert.ok(src.includes('* **卧室区域:第四宫(田宅宫)**'), '第五章卧室标题行铁律被删');
  assert.ok(src.includes('* **厨房区域:第二宫(财帛宫)与第八宫(共享资源)**'), '第五章厨房标题行铁律被删');
  assert.ok(src.includes('* **财务室/保险柜:第八宫(共享资源)**'), '第五章财务室标题行铁律被删');
  // E26 指令必须**显式要求**标题行不变（防日后「优化」时把物件句写进标题行）
  assert.ok(/标题行.{0,8}(严禁改动|逐字节)/.test(_CRYSTAL_PLACEMENT.zh.yearly), 'yearly 指令未要求标题行不变');
  assert.ok(/header line|header-line/i.test(_CRYSTAL_PLACEMENT.en.yearly), 'yearly en 指令缺标题行约束');
});

test('D2 月报周卡片 ✦ [...] 格式与次数铁律未被改动', () => {
  assert.ok(src.includes('STRICT_OUTPUT_FORMAT_RULES'), '月报格式规则包头被删');
  assert.ok(src.includes('水星淬火') && src.includes('木星高光'), '月报四周意象表被删');
  // E26 指令必须显式要求「不新增标题行 / 不改 ✦ [...] 格式」
  assert.ok(/严禁新增任何标题行/.test(_CRYSTAL_PLACEMENT.zh.monthly), 'monthly 指令未禁新增标题行');
  assert.ok(/严禁改动既有 ✦ \[\.\.\.\] 标题格式/.test(_CRYSTAL_PLACEMENT.zh.monthly), 'monthly 指令未禁改标题格式');
  assert.ok(/NEVER add any new title line/.test(_CRYSTAL_PLACEMENT.en.monthly), 'monthly en 指令缺标题约束');
});

test('D3 既有真值锁/守卫函数未被本轮改动损害（存在性回归）', () => {
  // ⚠️ buildNatalAnchors 在 v69_client.js（不在 server.js）⇒ 此处只检 server.js 侧。
  for (const fn of ['lockEphemerisDates', 'applyWealthReportPromptGuards',
    'buildWealthOncePrompt', 'buildWealthReportPrompt']) {
    const re = new RegExp(`(function|const)\\s+${fn}\\s*[(=]`);
    assert.ok(re.test(src) || new RegExp(`function\\s+${fn}\\s*\\(`).test(src), `既有函数 ${fn} 丢失`);
  }
  const v69 = fs.readFileSync(path.join(__dirname, '..', 'v69_client.js'), 'utf-8');
  assert.ok(/function\s+buildNatalAnchors\s*\(/.test(v69), 'v69_client.js 的 buildNatalAnchors 丢失');
});

// ═══════════════════════ E 接线自保 ═══════════════════════

test('E1 server.js 已 import buildCrystalAnchors', () => {
  assert.ok(/import\s*\{[^}]*\bbuildCrystalAnchors\b[^}]*\}\s*from\s*'\.\/v69_client\.js'/.test(src),
    'server.js 未 import buildCrystalAnchors ⇒ 注入永不发生（零防线）');
});

test('E2 共享守卫 applyWealthReportPromptGuards 内按 reportType 分区注入真值块 + 指令', () => {
  const d = indexDecls(src);
  const guard = stripComments(d.get('applyWealthReportPromptGuards') || '');
  assert.ok(guard.length > 0, '未找到 applyWealthReportPromptGuards');
  assert.ok(/buildCrystalAnchors\s*\(\s*astroMatrix\s*,\s*lang\s*,\s*reportType\s*\)/.test(guard),
    '守卫未调用 buildCrystalAnchors(astroMatrix, lang, reportType)');
  assert.ok(/_crystal\.block/.test(guard), '守卫未消费 _crystal.block（真值块）');
  assert.ok(/_crystal\.directive/.test(guard), '守卫未消费 _crystal.directive（指令）');
  assert.ok(/prompt\.user\s*=/.test(guard), '守卫未写回 prompt.user');
  assert.ok(/prompt\.system\s*=/.test(guard), '守卫未写回 prompt.system');
  // 注入必须在「astroMatrix 存在」前提下（无真值不注入）
  assert.ok(/if\s*\(\s*astroMatrix\s*\)/.test(guard), '注入未以 astroMatrix 存在为前置');
});

// ═══════════════════════ F 注入自测（同源判据必红） ═══════════════════════

test('F1 注入自测：删任一语种名 / 空格 → A1 同源判据必红', () => {
  const base = tableDefects(_CRYSTAL_NAME, _CRYSTAL_BY_PLANET, _CRYSTAL_BY_ELEMENT,
    _CRYSTAL_BY_HOUSE, _CRYSTAL_BY_SPACE, _CRYSTAL_WEEK_PLANETS,
    _CRYSTAL_SIGN_ORDER, _CRYSTAL_SIGN_RULER, _CRYSTAL_SIGN_ELEMENT);
  assert.deepStrictEqual(base, [], '真实表本应零缺陷');

  const noTh = JSON.parse(JSON.stringify(_CRYSTAL_NAME));
  delete noTh.citrine.th;
  assert.ok(tableDefects(noTh, _CRYSTAL_BY_PLANET, _CRYSTAL_BY_ELEMENT, _CRYSTAL_BY_HOUSE,
    _CRYSTAL_BY_SPACE, _CRYSTAL_WEEK_PLANETS, _CRYSTAL_SIGN_ORDER, _CRYSTAL_SIGN_RULER,
    _CRYSTAL_SIGN_ELEMENT).length > 0, 'F1 失效：删语种名后判据未红');

  const blank = JSON.parse(JSON.stringify(_CRYSTAL_NAME));
  blank.ruby.zh = '   ';
  assert.ok(tableDefects(blank, _CRYSTAL_BY_PLANET, _CRYSTAL_BY_ELEMENT, _CRYSTAL_BY_HOUSE,
    _CRYSTAL_BY_SPACE, _CRYSTAL_WEEK_PLANETS, _CRYSTAL_SIGN_ORDER, _CRYSTAL_SIGN_RULER,
    _CRYSTAL_SIGN_ELEMENT).length > 0, 'F1 失效：空格值未红');
});

test('F2 注入自测：幽灵矿石 id / 删行星映射 → A1 同源判据必红', () => {
  const ghostPlanet = JSON.parse(JSON.stringify(_CRYSTAL_BY_PLANET));
  ghostPlanet.Mars = { main: 'ghostite', alt: 'citrine' };
  assert.ok(tableDefects(_CRYSTAL_NAME, ghostPlanet, _CRYSTAL_BY_ELEMENT, _CRYSTAL_BY_HOUSE,
    _CRYSTAL_BY_SPACE, _CRYSTAL_WEEK_PLANETS, _CRYSTAL_SIGN_ORDER, _CRYSTAL_SIGN_RULER,
    _CRYSTAL_SIGN_ELEMENT).length > 0, 'F2 失效：幽灵 id 未红');

  const noSaturn = JSON.parse(JSON.stringify(_CRYSTAL_BY_PLANET));
  delete noSaturn.Saturn;
  assert.ok(tableDefects(_CRYSTAL_NAME, noSaturn, _CRYSTAL_BY_ELEMENT, _CRYSTAL_BY_HOUSE,
    _CRYSTAL_BY_SPACE, _CRYSTAL_WEEK_PLANETS, _CRYSTAL_SIGN_ORDER, _CRYSTAL_SIGN_RULER,
    _CRYSTAL_SIGN_ELEMENT).length > 0, 'F2 失效：删行星映射未红');
});

test('F3 未知矿石 id ⇒ crystalName 返回 null（绝不伪造矿石名）', () => {
  assert.strictEqual(crystalName('ghostite', 'zh'), null, '未知 id 未返回 null（伪造风险）');
  assert.strictEqual(crystalName('citrine', 'zh'), '黄水晶 (Citrine)', '正常 id 返回异常');
  assert.strictEqual(crystalName('citrine', 'xx'), 'Citrine (Citrine)', '未知语种未回落 en 锚定');
});

test('F4 注入自测：把守卫里的注入语句摘掉 → E2 判据必红', () => {
  const d = indexDecls(src);
  const guard = d.get('applyWealthReportPromptGuards') || '';
  assert.ok(/buildCrystalAnchors/.test(guard), '前置：真实守卫应含注入');
  const degraded = guard.replace(/buildCrystalAnchors/g, 'REMOVED_FN');
  assert.ok(!/buildCrystalAnchors\s*\(\s*astroMatrix/.test(stripComments(degraded)),
    'F4 失效：摘掉注入语句后 E2 判据仍绿');
});

test('F5 注入自测：把红线里的「禁功效承诺」删掉 → C2 正面证据判据必红', () => {
  const good = _CRYSTAL_REDLINES.zh;
  assert.ok(/功效承诺/.test(good), '前置：zh 红线应显式禁功效承诺');
  const degraded = good.replace(/功效承诺/g, 'XX');
  assert.ok(!/功效承诺/.test(degraded), 'F5 失效：删掉后判据仍绿（判据未生效）');
});

test('F6 注入自测：once 指令混入年份 → C3 时间词哨兵必红', () => {
  const timeRe = /\b20\d{2}\b/;
  const good = _CRYSTAL_PLACEMENT.zh.once;
  assert.ok(!timeRe.test(good), '前置：真实 once 指令本应无年份');
  const polluted = good + ' 请参考 2026 年的运势。';
  assert.ok(timeRe.test(polluted), 'F6 失效：混入年份后哨兵未红');
});
