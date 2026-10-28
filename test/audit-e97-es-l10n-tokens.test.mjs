#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// 🔴 E97（主公军令 2026-10-28）：三军令闸门
//   ① 非中语月报 maxTokens 扩容 5500（zh 3500；年/once 维持 E94 原值）
//      根治 fr/es/th/vi 月报撞 3000 顶格截断（finish_reason≠stop、尾梢断头）
//   ② 姻缘流式伴读视口自动贴底（autoFollow：未上拖恒贴底／上拖暂停／
//      回底 40px 内恢复／新报告复位；财富线「完成后回顶部」零触碰）
//   ③ 西语精修：八字硬锁去拼音化（生肖/关系词纯西语 Buey/Perro/choque，
//      年报对齐月报口径，根治「Chou (Buey)」「fricción Chou-Xu」）＋
//      塔罗阴性大牌逆位 (Invertida) 而非 (Invertido)（全链检测表同步）
// 判据口径：含**行为级**测试——VM 实跑 _E92CompatBaziLock ×
//   _e96LocalizeCompatBaziLock(bl,'es')（军令用例男 1976-12-03 03:00 /
//   女 1997-10-18 12:00）＋ getOrientText/filterTarotMeaning es 用例。
// ═══════════════════════════════════════════════════════════════
import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SERVER = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
const APP = fs.readFileSync(path.join(ROOT, 'web/src/App.tsx'), 'utf8');
const TAROT = fs.readFileSync(path.join(ROOT, 'web/src/lib/tarot.ts'), 'utf8');
const AUTHBTN = fs.readFileSync(path.join(ROOT, 'web/src/components/AuthButton.tsx'), 'utf8');
const ADV = fs.readFileSync(path.join(ROOT, 'api/ai-advisor.js'), 'utf8');
const ADV_WEB = fs.readFileSync(path.join(ROOT, 'web/api/ai-advisor.js'), 'utf8');
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

// VM 抽取（花括号配平，同 e92/e94/e96 口径）
function fnBody(src, anchor) {
  const i = src.indexOf(anchor);
  if (i === -1) throw new Error(`fn anchor missing: ${anchor}`);
  let depth = 0, started = false;
  for (let j = src.indexOf('{', i); j < src.length; j++) {
    if (src[j] === '{') { depth++; started = true; }
    else if (src[j] === '}') { depth--; if (started && depth === 0) return src.slice(i, j + 1); }
  }
  throw new Error(`unbalanced fn: ${anchor}`);
}

/* ═══════════════════ ① 非中语月报 maxTokens 扩容 ═══════════════════ */

test('E97-①-1 行为级：月报 maxTokens 语种分流（zh 3500／非中语 5500；年/once 维持 E94 原值）', () => {
  const i = SERVER.indexOf('const _e94IsZh =');
  assert.ok(i > 0, '语种分流计算缺失');
  const seg = SERVER.slice(i, SERVER.indexOf('const insight = await callAI(', i));
  const expr = seg.slice(seg.indexOf('const _e94IsZh'), seg.indexOf(';', seg.indexOf('const _e94MaxTokens')) + 1);
  const calc = new Function('lang', 'reportType', `${expr}\nreturn _e94MaxTokens;`);
  // 月报：军令主刀位（西语审核实锤 fr/es 撞 3000 顶格截断）
  assert.equal(calc('zh', 'monthly'), 3500, 'zh 月报应为 3500（军令字面）');
  assert.equal(calc('zh-CN', 'monthly'), 3500, 'zh 前缀方言月报应归 zh 3500');
  assert.equal(calc('es', 'monthly'), 5500, 'es 月报应为 5500（E97-① 扩容）');
  assert.equal(calc('fr', 'monthly'), 5500, 'fr 月报应为 5500');
  assert.equal(calc('en', 'monthly'), 5500, 'en 月报应为 5500');
  assert.equal(calc('th', 'monthly'), 5500, 'th 月报应为 5500');
  assert.equal(calc('vi', 'monthly'), 5500, 'vi 月报应为 5500');
  // 年报/once：E94 军令原值零改动（回归护栏）
  assert.equal(calc('zh', 'yearly'), 7500, 'zh 年报维持 7500');
  assert.equal(calc('es', 'yearly'), 12000, 'es 年报维持 12000');
  assert.equal(calc('fr', 'yearly'), 12000, 'fr 年报维持 12000');
  assert.equal(calc('es', 'once'), 12000, 'once 维持 12000（$4.99 轻量契约不动）');
  assert.equal(calc('zh', 'once'), 12000, 'zh once 维持 12000');
});

/* ═══════════════════ ② 流式伴读视口自动贴底 ═══════════════════ */

test('E97-②-1 auto-follow 三件套：ref 声明＋距底 40px 判定＋passive 监听', () => {
  assert.ok(APP.includes('const compatScrollRef = useRef<HTMLDivElement | null>(null);'), '滚动容器 ref 缺失');
  assert.ok(APP.includes('const compatAutoFollowRef = useRef(true);'), '伴读标记 ref 缺失（默认开启）');
  // 距底 <40px 判定（上拖即暂停，回底即恢复）
  assert.ok(APP.includes('compatAutoFollowRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;'), '距底 40px 判定缺失');
  assert.ok(APP.includes("el.addEventListener('scroll', onScroll, { passive: true })"), 'passive 监听缺失（滚动性能）');
  // 监听器随容器存在性挂载（容器只在 reportText 非空时条件渲染——空依赖挂不上监听器）
  assert.ok(APP.includes('}, [reportText === null]);'), '监听器依赖须为容器空/非空翻转（时序坑防护）');
});

test('E97-②-2 贴底执行链：新报告复位＋autoFollow 门控＋增量/打字机双驱动', () => {
  // 新报告起点（reportText 归 null）自动复位伴读
  assert.ok(APP.includes('if (reportText === null) compatAutoFollowRef.current = true;'), '新报告复位缺失');
  // 贴底执行：未上拖才贴底（上拖自由回读不被劫持）
  assert.ok(APP.includes('if (!el || !compatAutoFollowRef.current) return;'), 'autoFollow 门控缺失');
  assert.ok(APP.includes('el.scrollTop = el.scrollHeight;'), '贴底执行语句缺失');
  // 双驱动：真流式增量帧（reportText）＋ E88 打字机降级逐段揭示（revealedParas）
  assert.ok(/\}, \[reportText, revealedParas\]\);/.test(APP), '贴底 effect 依赖缺 revealedParas（打字机降级漏驱动）');
});

test('E97-②-3 容器挂载：compat 报告滚动容器接线 ref（财富线零触碰）', () => {
  assert.ok(APP.includes('className="ks-report-scroll" data-testid="compat-report-scroll" ref={compatScrollRef}'), 'compat 容器未挂 ref');
});

/* ═══════════════════ ③a 八字硬锁西语纯化（行为级） ═══════════════════ */

test('E97-③-1 行为级：军令用例 es 本地化——零汉字＋生肖/关系词纯西语＋无拼音残留', () => {
  const _E92CompatBaziLock = new Function(`${fnBody(SERVER, 'function _E92CompatBaziLock')}\nreturn _E92CompatBaziLock;`)();
  const _e96LocalizeCompatBaziLock = new Function(`${fnBody(SERVER, 'function _e96LocalizeCompatBaziLock')}\nreturn _e96LocalizeCompatBaziLock;`)();
  const bl = _E92CompatBaziLock('1976-12-03', '1997-10-18', '03:00', '12:00');
  assert.ok(bl, '军令用例锁计算失败');
  _e96LocalizeCompatBaziLock(bl, 'es');
  // 零汉字铁律（lock 全文无 CJK；四柱干支为标准拼音非汉字）
  assert.ok(!/[\u4e00-\u9fff]/.test(bl.lock), `lock 汉字残留：${(bl.lock.match(/[\u4e00-\u9fff]+/g) || []).join(',')}`);
  // 真值转译抽查：辰戌相冲 → Dragón-Perro choque（纯西语，无 Chou (Buey) 式拼音残留）
  assert.ok(bl.lock.includes('Dragón-Perro choque'), '辰戌相冲 es 纯西语映射缺失');
  assert.ok(bl.lock.includes('Cerdo-Serpiente choque'), '亥巳相冲 es 映射缺失');
  assert.ok(bl.lock.includes('media combinación del trígono de Fuego (Tigre-Caballo-Perro)'), '寅午戌火局 es 映射缺失');
  assert.ok(bl.lock.includes('trígonos integrados: Fuego (Tigre-Caballo-Perro)'), '集成局 es 映射缺失');
  assert.ok(bl.lock.includes('Buey-Perro fricción'), '丑戌相刑 es 映射缺失');
  // 🔴 军令主病灶根治：拼音残留「Chou (Buey)」「Chou-Xu」必须绝迹（四柱干支拼音不在此列）
  assert.ok(!bl.lock.includes('Chou (Buey)'), '拼音残留 Chou (Buey) 复燃');
  assert.ok(!bl.lock.includes('Chou-Xu'), '拼音残留 Chou-Xu 复燃');
  assert.ok(!bl.lock.includes('Dragon-Dog') && !bl.lock.includes('(Ox)'), '英文生肖残留（es 须纯西语）');
  // 结构短语西语化：柱位/关系导语
  assert.ok(bl.lock.includes('pilar del año') && bl.lock.includes('pilar de la hora'), '柱位 es 标注缺失');
  assert.ok(bl.lock.includes('Relaciones reales de choque/armonía/fricción entre ambas cartas:'), '关系导语 es 化缺失');
  assert.ok(bl.lock.includes('[BAZI DATA LOCK'), 'E95 锚点前缀 [BAZI DATA LOCK 丢失');
  // 观感规整：柱位粘连必须清零（Apilar del añoChen 式粘连＝en 同族正则的 es 等价物缺失）
  assert.ok(!/([AB])pilar/.test(bl.lock), 'A/B-柱位粘连（Apilar 式）残留');
  assert.ok(!/(año|mes|día|hora)[A-Z][a-z]{1,3}/.test(bl.lock), '柱词-干支粘连（añoChen 式）残留');
  // 幂等：二次本地化零变化
  const once = bl.lock;
  _e96LocalizeCompatBaziLock(bl, 'es');
  assert.strictEqual(bl.lock, once, 'es 本地化不幂等（重复转译）');
});

test('E97-③-2 行为级：es guard 纯语纯粹性铁律＋en 无参路径 E96 契约保全', () => {
  const _E92CompatBaziLock = new Function(`${fnBody(SERVER, 'function _E92CompatBaziLock')}\nreturn _E92CompatBaziLock;`)();
  const _e96LocalizeCompatBaziLock = new Function(`${fnBody(SERVER, 'function _e96LocalizeCompatBaziLock')}\nreturn _e96LocalizeCompatBaziLock;`)();
  const bl = _E92CompatBaziLock('1976-12-03', '1997-10-18', '03:00', '12:00');
  _e96LocalizeCompatBaziLock(bl, 'es');
  // es guard：PUREZA DEL IDIOMA + 军令口径西语示例
  assert.ok(bl.guard.includes('PUREZA DEL IDIOMA'), 'es 语言纯粹性铁律缺失');
  assert.ok(bl.guard.includes('el choque entre Cerdo y Serpiente'), 'es 占星表达示例缺失（军令口径）');
  assert.ok(bl.guard.includes('narre únicamente en español'), 'es 纯西语叙述指令缺失');
  // 🔴 E96 英文契约保全：无参调用（lang undefined）仍走英文路径逐字节兼容
  const blEn = _E92CompatBaziLock('1976-12-03', '1997-10-18', '03:00', '12:00');
  _e96LocalizeCompatBaziLock(blEn);
  assert.ok(blEn.lock.includes('Chen-Xu (Dragon-Dog) clash'), 'E96 英文转译契约被 es 分支误伤');
  assert.ok(blEn.guard.includes('LANGUAGE PURITY'), 'E96 英文 guard 契约被误伤');
});

/* ═══════════════════ ③b 塔罗阴性大牌逆位 Invertida ═══════════════════ */

test('E97-③-3 tarot.ts 真源：es 阴阳性判别式＋双装配点透传牌名', () => {
  assert.ok(TAROT.includes('const esIsFeminine = (name: string) => /^(La\\s|Rueda\\b)/i.test(String(name || \'\'));'), '阴性大牌判别式缺失');
  assert.ok(TAROT.includes("es: (r, name) => r ? (esIsFeminine(name || '') ? ' (Invertida)' : ' (Invertido)') : ' (Normal)',"), 'es 朝向后缀阴阳性分流缺失');
  // 双装配点（getTarot + getWealthTarot）均须透传牌名给后缀函数
  assert.equal((TAROT.match(/orientation: \(ORIENT_SUFFIX\[L\] \|\| ORIENT_SUFFIX\['en'\]\)\(reversed, card\.name\[L\] \|\| card\.name\.en\)/g) || []).length, 2, '双装配点牌名透传缺失（须恰 2 处）');
});

test('E97-③-4 行为级：getOrientText es 阴阳性分流（真源 server 侧消费口径＝字符串牌名）', () => {
  const ORIENT_MAP_SEG = ADV.slice(ADV.indexOf('const ORIENT_MAP'), ADV.indexOf('function getOrientText'));
  const getOrientText = new Function(`${ORIENT_MAP_SEG}${fnBody(ADV, 'function getOrientText')}\nreturn getOrientText;`)();
  // 阴性大牌（La …/Rueda …）逆位 → Invertida；阳性 → Invertido；正位 → Derecho
  assert.equal(getOrientText({ name: 'La Sacerdotisa', orientation: ' (Invertida)' }, 'es'), 'Invertida', 'La Sacerdotisa 逆位须阴性 Invertida');
  assert.equal(getOrientText({ name: 'Rueda de la Fortuna', orientation: ' (Invertida)' }, 'es'), 'Invertida', 'Rueda de la Fortuna 逆位须阴性 Invertida');
  assert.equal(getOrientText({ name: 'El Loco', orientation: ' (Invertido)' }, 'es'), 'Invertido', 'El Loco 逆位须阳性 Invertido');
  assert.equal(getOrientText({ name: 'La Sacerdotisa', orientation: ' (Normal)' }, 'es'), 'Derecho', '正位须 Derecho');
  // 检测表补 Invertida（漏检即正逆位锁整体失效）
  // 🔴 E98-④ 后继化：检测表补 'Inversée'（fr 阴性大牌逆位形态）——字面量随 E98 升版。
  assert.ok(ADV.includes("['Ngược','Reversed','กลับด้าน','Inversé','Inversée','Invertido','Invertida','逆位']"), 'getOrientText 检测表未补 Invertida');
});

test('E97-③-5 行为级：filterTarotMeaning es 阴性牌意截取改写（Invertida, → Actualmente, ）', () => {
  const filterTarotMeaning = new Function(`${fnBody(ADV, 'function filterTarotMeaning')}\nreturn filterTarotMeaning;`)();
  // 真牌意（La Sacerdotisa es，tarot.ts 原文节选）：阴性标记 'Invertida,' 开头段
  const MEANING = 'Intuición y misterio — la respuesta espera ser revelada. Esta carta sugiere que su relación está en una fase que exige confianza en la intuición — no todo es visible aún, pero la respuesta ya vive en lo profundo. Invertida, le recuerda escuchar su voz interior y no dejarse engañar por las apariencias; la verdad aflora a su debido tiempo. En la intimidad, el silencio a veces habla más que mil palabras — aprenda a descansar en lo desconocido.';
  const out = filterTarotMeaning(MEANING, ' (Invertida)', 'es');
  assert.ok(out.startsWith('Actualmente, '), `阴性牌意须改写开头（实得：${out.slice(0, 30)}…）`);
  assert.ok(!out.startsWith('Invertida'), '阴性标记未剥离');
  // 检测表/标记表双补阴性形态（漏检即截取失效——存量隐性缺陷根治）
  const fn = fnBody(ADV, 'function filterTarotMeaning');
  assert.ok(fn.includes("es: ['Invertido', 'invertido', 'Invertida', 'invertida']"), 'reversedKeywords es 未补阴性形态');
  assert.ok(fn.includes("'Invertida,'"), 'reversedMarkers es 未补阴性标记');
  assert.ok(fn.includes("{ pattern: /^Invertida,?\\s*/i, replacement: 'Actualmente, ' }"), 'rewriteRules 未补阴性改写规则');
});

test('E97-③-6 全链检测表同步：server 洞察线＋App 洞察线＋迷你塔罗 es 后缀', () => {
  // server.js 旧逻辑塔罗锁 isReversed 检测表（漏检即锁失效）
  assert.ok(SERVER.includes("tarotOrient.includes('Invertido') || tarotOrient.includes('Invertida')"), 'server isReversed 检测表未补 Invertida');
  // App.tsx 洞察线检测数组（🔴 E98-④ 后继化：补 'Inversée' fr 阴性形态）
  assert.ok(APP.includes("['Ngược','Reversed','กลับด้าน','Inversé','Inversée','Invertido','Invertida']"), 'App 洞察线检测表未补 Invertida');
  // AuthButton 迷你塔罗 es 阴阳性后缀
  assert.ok(AUTHBTN.includes("es: reversed ? (esFem ? ' (Invertida)' : ' (Invertido)') : ''"), '迷你塔罗 es 阴阳性后缀缺失');
  // es 规则行：正逆位锁双形态封口
  assert.ok(ADV.includes('PROHIBIDO escribir "Invertido" o "Invertida"'), 'es 正位锁未封阴性形态');
  assert.ok(ADV.includes('Si Orientación = "Invertido" o "Invertida"'), 'es 逆位锁未认阴性形态');
});

test('E97-③-7 镜像同步：api/ai-advisor.js ≡ web/api/ai-advisor.js（e40 军规）', () => {
  assert.strictEqual(ADV, ADV_WEB, '镜像漂移（web/api 未同步）');
});

/* ═══════════════════ ④ 闸门接线 ═══════════════════ */

test('E97-④-1 闸门接线：test:astro 含本闸门（73 段）＋入编位（e96 后、e40 前、python 链尾）', () => {
  const chain = PKG.scripts['test:astro'] || '';
  assert.ok(chain.includes('audit-e97-es-l10n-tokens.test.mjs'), '本闸门未接线 test:astro');
  const parts = chain.split('&&').map((s) => s.trim());
  assert.equal(parts.length, 74, `链段数异常（实得 ${parts.length}，基线 74（E98 入编））`);
  const iE97 = parts.findIndex((p) => p.includes('audit-e97-'));
  const iE96 = parts.findIndex((p) => p.includes('audit-e96-'));
  const iE40 = parts.findIndex((p) => p.includes('audit-e40-compat-synastry-tensor-fusion'));
  const iPy = parts.findIndex((p) => p.includes('python3'));
  assert.ok(iE96 !== -1 && iE97 > iE96, 'E97 须在 E96 之后');
  assert.ok(iE40 > iE97, 'E97 须在 e40-compat 之前（收口位军规）');
  assert.ok(iE40 === parts.length - 2, 'e40 恒 len-2 被破坏');
  assert.ok(iPy === parts.length - 1, 'python 恒链尾被破坏');
});
