// ═══ E104 闸门：六语玄学真值全局字典静态断言门禁（主公军令 2026-10-30）═══
// 三刀验收：
//   ① 键值六语全覆盖非空（products/aspects/bazi/hexagrams/tarot/ui 六域逐键）
//   ② 防反校验：hexagrams[15].upperTrigram.vi === 'Khôn (Đất)' 且
//      lowerTrigram.vi === 'Cấn (Núi)'（军令钦定防天地颠倒）
//   ③ 违禁正则：非 zh 汉字=0／(Qian|Fu|Cui|Tongren)[1-4]=0／非 en 英文组合
//      （Fire trine/Metal trine/Dragon-Dog/Pig-Snake）=0／西语 ¿ 闭合／
//      法语冒号 NBSP 保护
// 适配裁决：军令 Vitest/Jest ⇒ 仓内 node:test；TS 字典以 eval 抽取（花括号配平取
//   `= {...} as const` 对象体＋函数体 TS 注解剥离——军令适配惯例同 VM 抽取式铁律）。
// 真源 parity：tarot 域 ≡ web/src/lib/tarot.ts 牌名（防字典漂移即红）；
//   hexagrams 15/24/45/13 ≡ server.js _e100IchingHexLine 军令钦定行（双侧同步锁）。
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const TS = read('web/src/i18n/metaphysicsTruthTable.ts');
const I18N_INDEX = read('web/src/i18n/index.ts');
const TAROT = read('web/src/lib/tarot.ts');
const SERVER = read('server.js');

/* ── TS 字典 eval 抽取（军令适配：node:test 无 TS 运行时）── */
function extractObject(src) {
  const anchor = 'export const METAPHYSICS_TRUTH_TABLE: MetaphysicsTruthTableSchema = {';
  const i = src.indexOf(anchor);
  assert.ok(i !== -1, '字典对象锚缺失');
  const start = src.indexOf('{', i + anchor.length - 2);
  let depth = 0, end = -1;
  for (let j = start; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') { depth--; if (depth === 0) { end = j; break; } }
  }
  assert.ok(end !== -1, '字典对象括号不平衡');
  const tail = src.slice(end, end + 20);
  assert.ok(/^\}\s*as const/.test(tail), '字典须 as const（readonly 不可篡改）');
  // ✦ SOUL OS 恒值以参数注入（对象体内引用该常量——eval 作用域适配）
  const sigM = src.match(/export const SOUL_OS_SIGNATURE = '([^']*)' as const;/);
  assert.ok(sigM, 'SOUL_OS_SIGNATURE 常量声明缺失');
  return new Function('SOUL_OS_SIGNATURE', 'return (' + src.slice(start, end + 1) + ')')(sigM[1]);
}

function extractGetTerm(src, obj) {
  const i = src.indexOf('export function getMetaphysicsTerm(');
  assert.ok(i !== -1, 'getMetaphysicsTerm 函数缺失');
  let depth = 0, started = false, end = -1;
  for (let j = src.indexOf('{', i); j < src.length; j++) {
    if (src[j] === '{') { depth++; started = true; }
    else if (src[j] === '}') { depth--; if (started && depth === 0) { end = j; break; } }
  }
  let fn = src.slice(i, end + 1)
    .replace(/^export /, '')
    // TS 签名注解剥离（军令适配：eval 无类型运行时）
    .replace(/function getMetaphysicsTerm\([\s\S]*?\): string \{/, 'function getMetaphysicsTerm(category, key, locale) {')
    // 函数体内四处 TS as 断言剥离（军令适配：与源码字面精确对应）
    .replace('const cat = (METAPHYSICS_TRUTH_TABLE as unknown as Record<string, Record<string, unknown>>)[category];', 'const cat = METAPHYSICS_TRUTH_TABLE[category];')
    .replace('const rec = entry as Record<string, unknown>;', 'const rec = entry;')
    .replace('if (nameRec && typeof nameRec === \'object\' && typeof (nameRec as Record<string, unknown>)[locale] === \'string\') {', 'if (nameRec && typeof nameRec === \'object\' && typeof nameRec[locale] === \'string\') {')
    .replace('return (nameRec as Record<string, string>)[locale];', 'return nameRec[locale];');
  assert.ok(!/\bas Record</.test(fn), 'TS as 断言剥离不彻底：' + fn.slice(0, 400));
  return new Function('METAPHYSICS_TRUTH_TABLE', fn + '\nreturn getMetaphysicsTerm;')(obj);
}

const TABLE = extractObject(TS);
const getTerm = extractGetTerm(TS, TABLE);
const LOCALES = ['zh', 'en', 'fr', 'es', 'th', 'vi'];

/* ═══ ① 键值六语全覆盖非空 ═══ */
test('E104-①-1 六域键值六语全覆盖非空（products/aspects/bazi/hexagrams/tarot/ui）', () => {
  const flatCats = ['products', 'aspects', 'bazi', 'ui'];
  for (const cat of flatCats) {
    const entries = Object.keys(TABLE[cat]);
    assert.ok(entries.length >= 6, cat + ' 域条目过少（实得 ' + entries.length + '）');
    for (const key of entries) for (const lc of LOCALES) {
      const v = TABLE[cat][key][lc];
      assert.ok(typeof v === 'string' && v.trim().length > 0, `${cat}.${key}.${lc} 缺失或空`);
    }
  }
  // 结构化域：hexagrams（钦定四卦）＋tarot（钦定三牌）——六字段×六语全非空
  assert.deepStrictEqual(Object.keys(TABLE.hexagrams).map(Number).sort((a, b) => a - b), [13, 15, 24, 45], 'hexagrams 须恰 15/24/45/13 四钦定卦');
  for (const num of Object.keys(TABLE.hexagrams)) {
    const h = TABLE.hexagrams[num];
    assert.strictEqual(h.hexagramNumber, Number(num), '卦序号自洽失败：' + num);
    for (const f of ['traditionalName', 'name', 'upperTrigram', 'lowerTrigram', 'essence']) {
      for (const lc of LOCALES) assert.ok(typeof h[f][lc] === 'string' && h[f][lc].length > 0, `hexagrams[${num}].${f}.${lc} 缺失`);
    }
    assert.ok(typeof h.pinyinKey === 'string' && h.pinyinKey.length > 0 && !/\d/.test(h.pinyinKey), `hexagrams[${num}].pinyinKey 带数字尾`);
  }
  assert.deepStrictEqual(Object.keys(TABLE.tarot).sort(), ['emperor', 'hermit', 'high_priestess'], 'tarot 须恰皇帝/女祭司/隐士三钦定牌');
  for (const key of Object.keys(TABLE.tarot)) {
    const c = TABLE.tarot[key];
    for (const f of ['name', 'upright', 'reversed']) {
      for (const lc of LOCALES) assert.ok(typeof c[f][lc] === 'string' && c[f][lc].length > 0, `tarot.${key}.${f}.${lc} 缺失`);
    }
    assert.ok(/^(II|IV|IX)$/.test(c.number), 'tarot 大阿卡纳罗马数字异常：' + c.number);
    assert.ok(typeof c.cardId === 'number', 'tarot cardId 须数字');
  }
  assert.ok(TS.includes("export const SOUL_OS_SIGNATURE = '✦ SOUL OS' as const;"), '✦ SOUL OS 恒值常量缺失');
});

/* ═══ ② 防反校验（卦 15 天地恒锁）═══ */
test('E104-②-1 卦 15 防天地颠倒：Khôn 恒上／Cấn 恒下（军令钦定六语锚）', () => {
  const h15 = TABLE.hexagrams[15];
  assert.strictEqual(h15.upperTrigram.vi, 'Khôn (Đất)', '军令钦定锚 upperTrigram.vi 漂移');
  assert.strictEqual(h15.lowerTrigram.vi, 'Cấn (Núi)', '军令钦定锚 lowerTrigram.vi 漂移');
  // 六语上卦皆 Khôn/坤 系（外卦恒地）、下卦皆 Cấn/艮 系（内卦恒山）
  for (const lc of LOCALES) {
    assert.ok(/^(坤|Khôn)/.test(h15.upperTrigram[lc]), `卦 15 上卦 ${lc} 非 Khôn/坤 系：` + h15.upperTrigram[lc]);
    assert.ok(/^(艮|Cấn)/.test(h15.lowerTrigram[lc]), `卦 15 下卦 ${lc} 非 Cấn/艮 系：` + h15.lowerTrigram[lc]);
  }
  // 卦 24/45/13 外内卦防反（Khôn 恒上于 24/45；Càn 恒上于 13）
  assert.ok(TABLE.hexagrams[24].upperTrigram.zh.startsWith('坤') && TABLE.hexagrams[24].lowerTrigram.zh.startsWith('震'), '卦 24 外内卦倒置');
  assert.ok(TABLE.hexagrams[45].upperTrigram.zh.startsWith('兑') && TABLE.hexagrams[45].lowerTrigram.zh.startsWith('坤'), '卦 45 外内卦倒置');
  assert.ok(TABLE.hexagrams[13].upperTrigram.zh.startsWith('乾') && TABLE.hexagrams[13].lowerTrigram.zh.startsWith('离'), '卦 13 外内卦倒置');
});

/* ═══ ③ 违禁正则清零 ═══ */
test('E104-③-1 非 zh 语系汉字=0＋(Qian|Fu|Cui|Tongren)[1-4]=0＋非 en 英文组合=0', () => {
  const allValues = [];
  const collect = (v) => {
    if (typeof v === 'string') allValues.push(v);
    else if (v && typeof v === 'object') Object.values(v).forEach(collect);
  };
  Object.values(TABLE).forEach(collect);
  // 抽查键名（拼音 key 不带数字）不在值域
  const bannedPinyin = /(Qian|Fu|Cui|Tongren)[1-4]/;
  for (const v of allValues) {
    assert.ok(!bannedPinyin.test(v), '带调拼音渗漏：' + v.slice(0, 60));
    assert.ok(!/Qian[0-9]/.test(v), 'Qian[0-9] 渗漏：' + v.slice(0, 60));
  }
  // 非 zh 汉字=0（逐语言逐值）
  const walkCats = (cat, cb) => {
    for (const key of Object.keys(TABLE[cat])) cb(key, TABLE[cat][key]);
  };
  for (const lc of ['en', 'fr', 'es', 'th', 'vi']) {
    for (const cat of ['products', 'aspects', 'bazi', 'ui']) walkCats(cat, (k, rec) => {
      assert.ok(!/[\u4e00-\u9fff]/.test(rec[lc]), `${cat}.${k}.${lc} 汉字渗漏：` + rec[lc].slice(0, 40));
    });
    for (const num of Object.keys(TABLE.hexagrams)) {
      const h = TABLE.hexagrams[num];
      for (const f of ['traditionalName', 'name', 'upperTrigram', 'lowerTrigram', 'essence']) {
        assert.ok(!/[\u4e00-\u9fff]/.test(h[f][lc]), `hexagrams[${num}].${f}.${lc} 汉字渗漏：` + h[f][lc].slice(0, 40));
      }
    }
    for (const key of Object.keys(TABLE.tarot)) {
      const c = TABLE.tarot[key];
      for (const f of ['name', 'upright', 'reversed']) {
        assert.ok(!/[\u4e00-\u9fff]/.test(c[f][lc]), `tarot.${key}.${f}.${lc} 汉字渗漏：` + c[f][lc].slice(0, 40));
      }
    }
  }
  // 非 en 英文组合=0（Fire trine/Metal trine/Dragon-Dog/Pig-Snake——军令钦定组合词清单）
  for (const lc of ['zh', 'fr', 'es', 'th', 'vi']) {
    for (const cat of ['products', 'aspects', 'bazi', 'ui']) walkCats(cat, (k, rec) => {
      assert.ok(!/(Fire trine|Metal trine|Dragon-Dog|Pig-Snake)/.test(rec[lc]), `${cat}.${k}.${lc} 英文组合渗漏：` + rec[lc].slice(0, 60));
    });
    for (const num of Object.keys(TABLE.hexagrams)) {
      for (const f of ['traditionalName', 'name', 'essence']) {
        assert.ok(!/(Fire trine|Metal trine|Dragon-Dog|Pig-Snake)/.test(TABLE.hexagrams[num][f][lc]), `hexagrams[${num}].${f}.${lc} 英文组合渗漏`);
      }
    }
  }
});

test('E104-③-2 西语 ¿ 句首闭合＋法语冒号不换行保护（字典值域标点铁律）', () => {
  const esValues = [];
  const frValues = [];
  const collect = (v, arr) => {
    if (typeof v === 'string') arr.push(v);
    else if (v && typeof v === 'object') Object.values(v).forEach((x) => collect(x, arr));
  };
  collect(TABLE, esValues);
  frValues.push(...esValues);
  // es ¿ ¡ 成对（军令刀三：¿ 与 ¡ 必须句首闭合）
  for (const v of esValues) {
    if (v.includes('¿')) assert.ok(/\?/.test(v), 'es 值 ¿ 未闭合：' + v.slice(0, 60));
    if (v.includes('¡')) assert.ok(/!/.test(v), 'es 值 ¡ 未闭合：' + v.slice(0, 60));
  }
  // fr 冒号不换行保护（字典内 fr 值凡含 ':' 必为 NBSP 前导——军令刀三）
  const frFields = [];
  for (const cat of ['products', 'aspects', 'bazi', 'ui']) for (const k of Object.keys(TABLE[cat])) frFields.push(TABLE[cat][k].fr);
  for (const num of Object.keys(TABLE.hexagrams)) for (const f of ['traditionalName', 'name', 'essence']) frFields.push(TABLE.hexagrams[num][f].fr);
  for (const v of frFields) {
    assert.ok(!/ : /.test(v), 'fr 值普通空格冒号残留：' + v.slice(0, 60));
    const idx = v.indexOf(':');
    if (idx !== -1) assert.ok(v[idx - 1] === '\u00a0', 'fr 值冒号前 NBSP 缺失：' + v.slice(Math.max(0, idx - 12), idx + 8));
  }
});

/* ═══ 真源 parity（防字典与仓内真源漂移）═══ */
test('E104-④-1 tarot parity：字典牌名 ≡ tarot.ts 真源（女祭司/皇帝/隐士六语逐字）', () => {
  for (const [key, id] of [['high_priestess', 2], ['emperor', 4], ['hermit', 9]]) {
    const m = TAROT.match(new RegExp("\\{id:" + id + ", emoji:'[^']*', name:\\{([^}]*)\\}"));
    assert.ok(m, 'tarot.ts 牌 ' + id + ' 真源抽取失败');
    for (const lc of LOCALES) {
      // 单引号转义形态兼容（fr 'L\'Empereur'——regex 不吞转义引号）
      const name = m[1].match(new RegExp(lc + ":'((?:\\\\.|[^'])*)'"));
      assert.ok(name, 'tarot.ts ' + id + ' ' + lc + ' 牌名抽取失败');
      assert.strictEqual(TABLE.tarot[key].name[lc], name[1].replace(/\\'/g, "'"), `tarot.${key}.name.${lc} 与 tarot.ts 真源漂移`);
    }
  }
});

test('E104-④-2 hexagrams parity：字典钦定行 ≡ server.js _e100IchingHexLine（fr/es 军令逐字）', () => {
  // server 模板真源（fr/es 分支为模板字面量——断言其源码模板件逐字；
  //   成品行行为级验证由 e103-②-1 4000 窗枚举闸门承担，两侧互锁）
  assert.ok(SERVER.includes('trigramme supérieur ${fx.u} (${fx.uf}) / trigramme inférieur ${fx.l} (${fx.lf}) — Hexagramme ${_n} : ${fx.nf}'), 'server fr 卦行模板缺失');
  assert.ok(SERVER.includes('Trigrama superior ${fx.u} (${fx.ue}) / trigrama inferior ${fx.l} (${fx.le}) — Hexagrama ${_n}: ${fx.ne}'), 'server es 卦行模板缺失');
  // 字典侧：fr/es 卦 15 name 军令格式（Qian (L'Humilité / La Modestia)）
  assert.strictEqual(TABLE.hexagrams[15].name.fr, "Qian (L'Humilité)");
  assert.strictEqual(TABLE.hexagrams[15].name.es, 'Qian (La Modestia)');
  assert.strictEqual(TABLE.hexagrams[24].name.fr, 'Fu (Le Retour)');
  assert.strictEqual(TABLE.hexagrams[24].name.es, 'Fu (El Retorno)');
  // server _e100IchingHexLine fr/es 分支存在性（军令刀二落点）
  assert.ok(SERVER.includes('function _e100IchingHexLine(d1, d2, windowStart, L)'), '_e100IchingHexLine 缺失');
  assert.ok(SERVER.includes('_e103FX'), 'fr/es 钦定卦结构映射 _e103FX 缺失');
});

test('E104-⑤ 挂载导出与统一寻址：index.ts 统一出口＋getMetaphysicsTerm 行为级', () => {
  // 刀二：src/i18n/index.ts 统一导出 METAPHYSICS_TRUTH_TABLE＋getMetaphysicsTerm
  assert.ok(I18N_INDEX.includes("export {\n  METAPHYSICS_TRUTH_TABLE,\n  SOUL_OS_SIGNATURE,\n  getMetaphysicsTerm,\n} from './metaphysicsTruthTable';"), 'index.ts 统一导出缺失');
  // 行为级：扁平域取词
  assert.strictEqual(getTerm('ui', 'unlock_now', 'zh'), '立即解锁');
  assert.strictEqual(getTerm('ui', 'unlock_now', 'fr'), 'Débloquer Maintenant');
  assert.strictEqual(getTerm('bazi', 'dragon_dog_clash', 'es'), 'Oposición Chen-Xu (Dragón-Perro)');
  // 结构化域回落 name 域（hexagrams）
  assert.strictEqual(getTerm('hexagrams', 15, 'fr'), "Qian (L'Humilité)");
  assert.strictEqual(getTerm('tarot', 'high_priestess', 'es'), 'La Gran Sacerdotisa');
  // ✦ SOUL OS 六语恒值
  for (const lc of LOCALES) assert.strictEqual(getTerm('ui', 'soul_os_signature', lc), '✦ SOUL OS', lc + ' SOUL OS 恒值漂移');
  // fail-closed：缺键/缺类目 ⇒ 空串（绝不猜测回退）
  assert.strictEqual(getTerm('ui', 'no_such_key', 'fr'), '', '缺键须 fail-closed 空串');
  assert.strictEqual(getTerm('no_such_category', 'unlock_now', 'fr'), '', '缺类目须 fail-closed 空串');
});
