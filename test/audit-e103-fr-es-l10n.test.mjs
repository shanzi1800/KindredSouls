// ═══ E103 闸门：法西双语资产纯化、地山谦卦象规范与移动排版防爆（主公军令 2026-10-30）═══
// 四刀：① 词典与正统术语挂载（塔罗二号牌/年报术语/八字合化冲刑/Qian2 拔除）
//      ② 地山谦 fr/es 卦体结构锁（trigramme supérieur Khôn … — 军令 vi 结构词渗漏裁决本语化）
//      ③ 语法标点排版安全（fr NBSP／es ¿¡／CTA 390px 防爆／度数与百分比 fr es 逗号化）
//      ④ 存量作废 v4→v5（旧 fr/es 报告 Qian2/旧口径术语/点号小数——长度守卫挡不住）
// 判据口径：行为级 VM 实跑 _E92CompatBaziLock × _e96LocalizeCompatBaziLock（军令用例
//   男 1976-12-03 03:00 / 女 1997-10-18 12:00＋无时辰变体）× _e100IchingHexLine 4000 窗
//   全枚举 × renderSynastryBlock ESM 实跑 × _e103FrWash/_e103EsWash 行为级。
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert';
import { renderSynastryBlock } from '../api/ai-advisor.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const SERVER = read('server.js');
const PIPE = read('lib/reportPipeline.mjs');
const TAROT = read('web/src/lib/tarot.ts');
const ALGOS_I18N = read('web/src/lib/algos/i18n.ts');
const WRPAGE = read('web/src/pages/WealthReportPage.tsx');
const AUTHBTN = read('web/src/components/AuthButton.tsx');
const PAYWALL = read('web/src/components/PaywallCard.tsx');
const UPGRADE = read('web/src/components/WealthUpgradePaywall.tsx');
const CASHIER = read('web/src/components/SandboxCashier.tsx');
const ADV = read('api/ai-advisor.js');
const ADV_WEB = read('web/api/ai-advisor.js');
const ES_JSON = JSON.parse(read('web/src/i18n/locales/es.json'));
const FR_JSON = JSON.parse(read('web/src/i18n/locales/fr.json'));
const PKG = JSON.parse(read('package.json'));

// VM 花括号配平抽取（E98/E100/E102 先例同法）
function fnB(sig) {
  const i = SERVER.indexOf(sig);
  assert.ok(i !== -1, '函数缺失：' + sig);
  let depth = 0, started = false, end = -1;
  for (let j = SERVER.indexOf('{', i); j < SERVER.length; j++) {
    if (SERVER[j] === '{') { depth++; started = true; }
    else if (SERVER[j] === '}') { depth--; if (started && depth === 0) { end = j; break; } }
  }
  assert.ok(end !== -1, 'fn body unbalanced：' + sig);
  return eval('(' + SERVER.slice(i, end + 1) + ')');
}

/* ═══════════ ① 词典与正统术语挂载（行为级） ═══════════ */

test('E103-①-1 行为级：fr 锁军令钦定术语逐字＋零汉字＋数字本地化指令＋幂等', () => {
  const _E92 = fnB('function _E92CompatBaziLock(');
  const _e96 = fnB('function _e96LocalizeCompatBaziLock(');
  // 军令用例（带时辰——含集成局/半合/刑冲全谱）
  const bl = _E92('1976-12-03', '1997-10-18', '03:00', '12:00');
  _e96(bl, 'fr');
  // 军令钦定逐字：冲 Opposition Chen-Xu (Dragon-Chien)／刑 Friction Chou-Xu／
  // 半合 Demi-combinaison de Métal (Chou-Si)／三合 Trigone élémentaire de Feu (Tigre-Cheval-Chien)
  assert.ok(bl.lock.includes('Opposition Chen-Xu (Dragon-Chien)'), 'fr 冲军令钦定缺失');
  assert.ok(bl.lock.includes('Friction Chou-Xu'), 'fr 刑军令钦定缺失');
  assert.ok(bl.lock.includes('Demi-combinaison de Métal (Chou-Si)'), 'fr 半合军令钦定缺失');
  assert.ok(bl.lock.includes('Trigone élémentaire de Feu (Tigre-Cheval-Chien)'), 'fr 三合军令钦定缺失');
  assert.ok(bl.lock.includes('Opposition Hai-Si (Cochon-Serpent)'), 'fr 亥巳相冲军令口径缺失');
  // 零汉字铁律（四柱干支为拼音非汉字）
  assert.ok(!/[\u4e00-\u9fff]/.test(bl.lock), 'fr lock 汉字残留');
  // 旧口径术语绝迹（E97/E98 旧词形——军令钦定所替代）
  assert.ok(!bl.lock.includes('Dragon-Chien choc'), 'fr 旧口径 choc 残留');
  assert.ok(!/demi-combinaison du trigone de/.test(bl.lock), 'fr 旧口径 du trigone de 残留');
  // guard：数字本地化指令（75 sur 100／5,54°／NBSP）
  assert.ok(bl.guard.includes('MISE EN FORME DES NOMBRES (E103-③)'), 'fr 数字排版指令缺失');
  assert.ok(bl.guard.includes('75 sur 100'), 'fr 分数格式示例缺失');
  // 幂等
  const once = bl.lock;
  _e96(bl, 'fr');
  assert.strictEqual(bl.lock, once, 'fr 本地化不幂等');
});

test('E103-①-2 行为级：es 锁军令钦定术语逐字＋零汉字＋¿¡ 指令＋幂等', () => {
  const _E92 = fnB('function _E92CompatBaziLock(');
  const _e96 = fnB('function _e96LocalizeCompatBaziLock(');
  const bl = _E92('1976-12-03', '1997-10-18', '03:00', '12:00');
  _e96(bl, 'es');
  assert.ok(bl.lock.includes('Oposición Chen-Xu (Dragón-Perro)'), 'es 冲军令钦定缺失');
  assert.ok(bl.lock.includes('Fricción Chou-Xu'), 'es 刑军令钦定缺失');
  assert.ok(bl.lock.includes('Semialianza de Metal (Chou-Si)'), 'es 半合军令钦定缺失');
  assert.ok(bl.lock.includes('Trígono elemental de Fuego (Tigre-Caballo-Perro)'), 'es 三合军令钦定缺失');
  assert.ok(!/[\u4e00-\u9fff]/.test(bl.lock), 'es lock 汉字残留');
  // 旧口径绝迹（E97 旧词形——军令钦定所替代；拼音 Chou-Xu 为军令钦定格式回归，非残留）
  assert.ok(!bl.lock.includes('Dragón-Perro choque'), 'es 旧口径 choque 残留');
  assert.ok(!/media combinación del trígono de/.test(bl.lock), 'es 旧口径 media combinación 残留');
  // guard：数字本地化＋¿¡ 成对指令
  assert.ok(bl.guard.includes('FORMATO DE NÚMEROS (E103-③)'), 'es 数字排版指令缺失');
  assert.ok(bl.guard.includes('75 sobre 100'), 'es 分数格式示例缺失');
  assert.ok(bl.guard.includes('abra toda pregunta con ¿'), 'es ¿ 成对指令缺失');
  // 幂等
  const once = bl.lock;
  _e96(bl, 'es');
  assert.strictEqual(bl.lock, once, 'es 本地化不幂等');
});

test('E103-①-3 塔罗二号牌统一：tarot.ts/algos/AuthButton/财富催化剂四真源零 La Papesse', () => {
  // 军令钦定：fr La Grande Prêtresse／es La Gran Sacerdotisa（拔除马赛旧称 La Papesse）
  assert.ok(TAROT.includes("fr:'La Grande Prêtresse'"), 'tarot.ts fr 女祭司钦定译名缺失');
  assert.ok(TAROT.includes("es:'La Gran Sacerdotisa'"), 'tarot.ts es 女祭司钦定译名缺失');
  assert.ok(!TAROT.includes("fr:'La Papesse'"), 'tarot.ts fr 马赛旧称残留');
  assert.ok(ALGOS_I18N.includes("es: 'La Gran Sacerdotisa'"), 'algos/i18n.ts es 钦定译名缺失');
  assert.ok(AUTHBTN.includes("fr:'La Grande Prêtresse'"), 'AuthButton 迷你塔罗 fr 钦定译名缺失');
  assert.ok(AUTHBTN.includes("es:'La Gran Sacerdotisa'"), 'AuthButton 迷你塔罗 es 钦定译名缺失');
  assert.ok(!WRPAGE.includes('La Papesse'), '财富催化剂 fr 马赛旧称残留');
  assert.ok(WRPAGE.includes('La Gran Sacerdotisa'), '财富催化剂 es 钦定译名缺失');
  // 年报术语：fr Révolution Solaire／es Revolución Solar（太阳返照军令钦定口径）
  assert.ok(SERVER.includes("l'année de Révolution Solaire débute le mois de votre naissance"), 'fr 年报术语 Révolution Solaire 缺失');
  assert.ok(SERVER.includes('el año de Revolución Solar comienza en tu mes de nacimiento'), 'es 年报术语 Revolución Solar 缺失');
});

/* ═══════════ ② 地山谦 fr/es 卦体结构锁（行为级） ═══════════ */

test('E103-②-1 行为级：四钦定卦 fr/es 结构锁军令逐字＋64 卦全覆盖＋Qian[0-9]=0', () => {
  const H = fnB('function _e100IchingHexLine(');
  for (const lg of ['fr', 'es']) {
    // 4000 窗全枚举：64 卦全覆盖（同输入恒同输出的确定性由 FNV 保证）
    const seen = new Set();
    for (let k = 0; k < 4000; k++) seen.add(H('1976-12-3', '1997-10-18', 'w' + k, lg));
    assert.strictEqual(seen.size, 64, lg + ' 64 卦全覆盖失败：' + seen.size);
    for (const l of seen) {
      assert.ok(!/[\u4e00-\u9fff]/.test(l), lg + ' 卦行 CJK 渗漏：' + l);
      assert.ok(!/Qian[0-9]/.test(l), lg + ' 卦行带调拼音 Qian[0-9] 渗漏：' + l);
      assert.ok(!/(Fire trine|Metal trine|Dragon-Dog|Pig-Snake)/.test(l), lg + ' 卦行英文组合渗漏：' + l);
    }
    // 卦 15 军令钦定逐字（外 Khôn 上／内 Cấn 下——倒置即红）
    const khiem = [...seen].find((l) => /15\s*:\s*(L'Humilité|La Modestia)/.test(l));
    assert.ok(khiem, lg + ' 卦 15 未采样到');
    if (lg === 'fr') {
      assert.strictEqual(khiem, "trigramme supérieur Khôn (La Terre) / trigramme inférieur Cấn (La Montagne) — Hexagramme 15 : L'Humilité", 'fr 卦 15 军令钦定句式漂移：' + khiem);
      const ret = [...seen].find((l) => l.includes('Le Retour'));
      assert.ok(ret && ret.includes('— Hexagramme 24 : Le Retour'), 'fr 卦 24 钦定名缺失');
      assert.ok([...seen].some((l) => l.includes('Le Rassemblement') && /45/.test(l)), 'fr 卦 45 钦定名缺失');
      assert.ok([...seen].some((l) => l.includes('La Fraternité') && /13/.test(l)), 'fr 卦 13 钦定名缺失');
    } else {
      assert.strictEqual(khiem, 'Trigrama superior Khôn (La Tierra) / trigrama inferior Cấn (La Montaña) — Hexagrama 15: La Modestia', 'es 卦 15 军令钦定句式漂移：' + khiem);
      const ret = [...seen].find((l) => l.includes('El Retorno'));
      assert.ok(ret && ret.includes('— Hexagrama 24: El Retorno'), 'es 卦 24 钦定名缺失');
      assert.ok([...seen].some((l) => l.includes('La Reunión') && /45/.test(l)), 'es 卦 45 钦定名缺失');
      assert.ok([...seen].some((l) => l.includes('La Comunidad') && /13/.test(l)), 'es 卦 13 钦定名缺失');
    }
    // 非钦定卦降级：拼音基名（拔除数字尾）＋释义——`n°33 : Dun (Retreat)` 形态
    const others = [...seen].filter((l) => !/— Hexagram/.test(l));
    assert.ok(others.length === 60, lg + ' 钦定卦数异常（应恰 4 卦全行＋60 卦降级）');
    for (const l of others) assert.ok(/(Hexagramme n°\d+ : [A-Za-z ]+ \(|Hexagrama n\.º \d+: [A-Za-z ]+ \()/.test(l), lg + ' 降级卦行格式漂移：' + l);
  }
});

/* ═══════════ ③ 语法标点排版安全（行为级） ═══════════ */

test('E103-③-1 行为级：renderSynastryBlock fr/es 度数百分比逗号化（69,4 %／orbe 5,54°）', () => {
  const syn = { available: true, precision: 'timed', harmonious: 25, hard: 11, total: 36, unknown: [], bonds: [{ a: 'Venus', b: 'Jupiter', aspect: 'trine', orb: 5.54 }], frictions: [{ a: 'Mars', b: 'Saturn', aspect: 'square', orb: 1.8 }] };
  const fr = renderSynastryBlock(syn, 'fr');
  assert.ok(fr.includes('part harmonieuse=69,4 %'), 'fr 调和占比逗号化缺失：' + fr.split('\n')[2]);
  assert.ok(fr.includes('orbe 5,54°'), 'fr 度数逗号化缺失');
  assert.ok(fr.includes('orbe 1,8°'), 'fr 度数逗号化（多位）缺失');
  assert.ok(!fr.includes('69.4'), 'fr 点号小数残留');
  const es = renderSynastryBlock(syn, 'es');
  assert.ok(es.includes('proporción armónica=69,4 %'), 'es 调和占比逗号化缺失');
  assert.ok(es.includes('orbe 5,54°'), 'es 度数逗号化缺失');
  // zh/en 零触碰（点号契约回归）
  const zh = renderSynastryBlock(syn, 'zh');
  assert.ok(zh.includes('69.4%'), 'zh 点号百分比契约漂移');
  const en = renderSynastryBlock(syn, 'en');
  assert.ok(en.includes('69.4%') && en.includes('orb 5.54°'), 'en 点号契约漂移');
});

test('E103-③-2 行为级：_e103FrWash NBSP＋小数逗号（幂等）／_e103EsWash 小数逗号／交付层双保险', () => {
  const W = fnB('function _e103FrWash(');
  const dirty = 'Résultat : 69.4 % et 5.54° — vraiment : oui ! vraiment ? oui ; non « ainsi »';
  const out = W(dirty);
  assert.ok(out.includes('\u00a0:'), 'fr wash 冒号前 NBSP 缺失');
  assert.ok(out.includes('\u00a0!') && out.includes('\u00a0?') && out.includes('\u00a0;'), 'fr wash 双标点 NBSP 缺失');
  assert.ok(out.includes('«\u00a0ainsi\u00a0»'), 'fr wash guillemet 内侧 NBSP 缺失');
  assert.ok(out.includes('69,4 %') && out.includes('5,54°'), 'fr wash 小数逗号化缺失');
  assert.ok(!/ : /.test(out) && !/ ! | \? | ; /.test(out.replace(/\u00a0/g, '§')), 'fr wash 普通空格双标点残留');
  // 幂等（NBSP 二次替换不变）
  assert.strictEqual(W(out), out, 'fr wash 不幂等');
  // 无标点纯文本零触碰
  assert.strictEqual(W('Le cœur pur de deux âmes'), 'Le cœur pur de deux âmes', 'fr wash 纯文本误触');
  const E = fnB('function _e103EsWash(');
  const outEs = E('Resultado 5.54° y 69.4 %');
  assert.ok(outEs.includes('5,54°') && outEs.includes('69,4 %'), 'es wash 小数逗号化缺失');
  assert.strictEqual(E('El corazón puro'), 'El corazón puro', 'es wash 纯文本误触');
  // 交付层双保险：SSE 帧级＋终帧（fr/es 层与 vi 层并列；zh 通路零触碰）
  assert.ok(SERVER.includes("_sse.text(_e100NonZh ? (_e102ViLang ? _e102ViWash(_e100StripCjk(d)) : _e103FrLang ? _e103FrWash(_e100StripCjk(d)) : _e103EsLang ? _e103EsWash(_e100StripCjk(d)) : _e100StripCjk(d)) : ((reportType === 'yearly' && _e94IsZh) ? _e108LockQuarterRanges(d, _compat.timeCtx.windowStart) : d))"), 'SSE 帧级 fr/es 排版清洗缺失');
  assert.ok(SERVER.includes('if (_e103FrLang) insight = _e103FrWash(insight);'), '终帧 fr 排版收口缺失');
  assert.ok(SERVER.includes('if (_e103EsLang) insight = _e103EsWash(insight);'), '终帧 es 排版收口缺失');
});

test('E103-③-3 es ¿¡ 成对标点断言（locales 全值域：每个 ¿ 必闭合 ?、每个 ¡ 必闭合 !）', () => {
  const check = (obj, p) => {
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'string') {
        if (v.includes('¿')) assert.ok(/\?/.test(v), `es 值 ${p}${k} 的 ¿ 未闭合：${v.slice(0, 60)}`);
        if (v.includes('¡')) assert.ok(/!/.test(v), `es 值 ${p}${k} 的 ¡ 未闭合：${v.slice(0, 60)}`);
        // 孤立闭合倒置标点（只有 ? 却以 ¿ 语义开头）不在此列——只查成对铁律
      } else if (v && typeof v === 'object') check(v, p + k + '.');
    }
  };
  check(ES_JSON, '');
  // guard 指令层：¿¡ 成对铁律已入 es guard（军令刀三）
  assert.ok(SERVER.includes('abra toda pregunta con ¿ y toda exclamación con ¡'), 'es guard ¿¡ 成对指令缺失');
});

test('E103-③-4 CTA 390px 防爆：月/年/主三 CTA min-h 48＋居中折行（三组件源码断言）', () => {
  // PaywallCard：主（once）＋月报＋年报三按钮
  assert.strictEqual((PAYWALL.match(/minHeight: '48px'/g) || []).length, 3, 'PaywallCard 三 CTA min-h 48 缺失（实得 ' + (PAYWALL.match(/minHeight: '48px'/g) || []).length + '）');
  assert.ok(PAYWALL.includes("whiteSpace: 'normal'"), 'PaywallCard CTA 折行缺失');
  assert.ok(PAYWALL.includes("textAlign: 'center'"), 'PaywallCard CTA 居中缺失');
  // WealthUpgradePaywall 主 CTA
  assert.ok(UPGRADE.includes("minHeight: '48px'"), '升阶弹窗 CTA min-h 48 缺失');
  assert.ok(UPGRADE.includes("whiteSpace: 'normal'") && UPGRADE.includes("textAlign: 'center'"), '升阶弹窗 CTA 折行/居中缺失');
  // SandboxCashier（E102 whiteSpace normal 之上的刀三补强）
  assert.ok(CASHIER.includes("minHeight: '48px'"), '收银台 CTA min-h 48 缺失');
  assert.ok(CASHIER.includes("whiteSpace: 'normal'"), '收银台 CTA 折行缺失（E102 锚回归）');
});

test('E103-③-5 数字本地化：fr/es locales 价格全逗号＋无点号价格残留', () => {
  const dotPrice = (o, p) => {
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === 'string') assert.ok(!/\$\d+\.\d/.test(v), p + k + ' 点号价格残留：' + v);
      else if (v && typeof v === 'object') dotPrice(v, p + k + '.');
    }
  };
  dotPrice(FR_JSON, ''); dotPrice(ES_JSON, '');
  assert.ok(FR_JSON.wealthReport.sandboxPayMonthly.includes('$2,99'), 'fr 沙箱月付价格逗号缺失');
  assert.ok(ES_JSON.wealthReport.sandboxPayYearly.includes('$29,99'), 'es 沙箱年付价格逗号缺失');
  assert.ok(ES_JSON.familiar.needUnlock.includes('$4,99'), 'es 灵宠锁档价格逗号缺失');
  // 组件侧 fr/es 价格逗号（军令例：$4,99）
  assert.ok(PAYWALL.includes("['fr', 'es'].includes(lang) ? '$4,99' : '$4.99'"), 'PaywallCard 主档标价 fr/es 逗号分流缺失');
  assert.ok(PAYWALL.includes('Rapport Mensuel $2,99/mois') && PAYWALL.includes('Rapport Annuel $29,99/an'), 'fr 月/年 CTA 价格逗号缺失');
  assert.ok(PAYWALL.includes('Informe Mensual $2,99/mes') && PAYWALL.includes('Informe Anual $29,99/año'), 'es 月/年 CTA 价格逗号缺失');
  assert.ok(UPGRADE.includes("priceLabel = (price && (lang === 'fr' || lang === 'es')) ? String(price).replace('.', ',') : price"), '升阶弹窗标价 fr/es 逗号分流缺失');
  assert.ok(CASHIER.includes("L === 'fr' || L === 'es'"), '收银台标价 fr/es 逗号分流缺失');
});

/* ═══════════ ④ 门禁：✦ SOUL OS 终章印章＋en/th/vi 契约保全＋存量作废＋军规链 ═══════════ */

test('E103-④-1 ✦ SOUL OS 终章印章：月/年报双契约 ENDING SEAL GUARD（fr/es 语境收口）', () => {
  assert.ok((SERVER.match(/✦ SOUL OS/g) || []).length >= 2, '终章印章签名行缺失（月＋年双契约）');
  assert.ok(SERVER.includes('[ENDING SEAL GUARD — MANDATORY]'), 'ENDING SEAL GUARD 契约缺失');
  // 法语冒号 NBSP 烘焙（年报锚注释 fr 行——源码以 \u00a0 转义序列烘焙，运行时解析为 NBSP）
  assert.ok(SERVER.includes('✦ Ancrage énergétique\\u00a0: l\'année de Révolution Solaire'), 'fr 锚注 NBSP 冒号烘焙缺失');
});

test('E103-④-2 en/th/vi 契约逐字保全（fr/es 军令零外溢）', () => {
  const _E92 = fnB('function _E92CompatBaziLock(');
  const _e96 = fnB('function _e96LocalizeCompatBaziLock(');
  const bl = _E92('1976-12-03', '1997-10-18', '03:00', '12:00');
  const mk = () => JSON.parse(JSON.stringify(bl));
  const en = mk(); _e96(en, 'en');
  assert.ok(en.lock.includes('Chen-Xu (Dragon-Dog) clash'), 'en 契约漂移');
  assert.ok(en.lock.includes('half-combination of the Metal trine'), 'en 三合术语漂移（E96 原格式）');
  const th = mk(); _e96(th, 'th');
  assert.ok(th.lock.includes('ครึ่งไตรภาคีธาตุทอง'), 'th 契约漂移（E100 锚）');
  const vi = mk(); _e96(vi, 'vi');
  assert.ok(vi.lock.includes('Sửu–Tỵ bán hợp Kim cục'), 'vi 契约漂移（E102 锚）');
  const H = fnB('function _e100IchingHexLine(');
  assert.ok(H('1976-12-3', '1997-10-18', 'w0', 'th').startsWith('กั้วที่'), 'th 卦行契约漂移');
  assert.ok(H('1976-12-3', '1997-10-18', 'w0', 'zh').startsWith('第'), 'zh 卦行契约漂移');
  assert.ok(H('1976-12-3', '1997-10-18', 'w0', 'en').startsWith('Hexagram No.'), 'en 卦行契约漂移');
  assert.ok(H('1976-12-3', '1997-10-18', 'w0', 'vi').includes('ngoại quái là'), 'vi 卦体结构锁漂移（E102 锚）');
  // e100-④ 百分比锚子串保全（后继化护栏：fr/es 分流不得吞掉 en 契约表达式）
  assert.ok(ADV.includes("(ratio * 100).toFixed(1) + '%'"), 'api/ai-advisor.js 百分比锚表达式漂移');
  assert.strictEqual(ADV, ADV_WEB, '镜像漂移（web/api 未同步）');
});

test('E103-⑤ 存量作废：COMPAT_PERSIST_VERSION v5（旧 fr/es 报告 Qian2/旧口径/点号小数作废）', () => {
  assert.ok(PIPE.includes("export const COMPAT_PERSIST_VERSION = 'compat_report.v5';"), '持久化版本须为 v5（E103-⑤ 军令）');
  assert.ok(PIPE.includes('E103-⑤'), 'v5 升版注释（E103 军令记录）缺失');
  assert.ok(!PIPE.includes("'compat_report.v4';"), 'v4 字面量残留（作废不彻底）');
});

test('E103-⑥ 军规链基线 79 段（e103/e104 居 e102 后 e40 前、e40 恒 len-2、python 恒链尾）', () => {
  const parts = PKG.scripts['test:astro'].split('&&').map(s => s.trim()).filter(Boolean);
  assert.strictEqual(parts.length, 85, '军规链段数漂移：' + parts.length);   // 🛡️ E105 后继化：79→80
  const e40 = parts.findIndex(p => p.includes('e40-compat'));
  assert.strictEqual(e40, parts.length - 2, 'e40-compat 须恒为 len-2');
  assert.ok(parts[parts.length - 1].includes('python3'), 'python 须恒为链尾');
  const e103 = parts.findIndex(p => p.includes('audit-e103-'));
  const e104 = parts.findIndex(p => p.includes('audit-e104-'));
  assert.ok(e103 !== -1 && e104 !== -1, 'e103/e104 闸门未入编');
  assert.ok(e103 < e40 && e104 < e40, 'e103/e104 须插在 e40-compat 之前（长链入编位铁律）');
  const e102 = parts.findIndex(p => p.includes('audit-e102-'));
  assert.ok(e102 !== -1 && e102 < e103, 'e103 须在 e102 之后');
});
