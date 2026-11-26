/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🥂 E152 闸门：灵宠×CTA 纵向分离零遮挡 × 丝缎香槟金材质 × Hero 可读性 × helloDaily 换血
 * ═══════════════════════════════════════════════════════════════════════════
 * 立项（主公军令 2026-11-24，线上实拍四病灶）：
 *   ① 灵宠尾巴遮挡 CTA 末字「标」⇒ 纵向分离（translateY(-2px)＋条件间距 124px）；
 *   ② CTA 暗浊褐半透明底「颜色不协调」⇒ 丝缎香槟金渐变＋曜石黑字＋顶缘高光；
 *   ③ Hero 副标融进星云不可读＋宽屏体量偏小 ⇒ 径向暗晕托底＋主标 clamp 放大；
 *   ④ 对话舱跨日首语残留「幸运色【星云紫】幸运数字【29】」⇒ 六语 helloDaily
 *      换血「坐标与心境校准」老友口吻（零插值，dailyFortune 核从舱内拔除）。
 *
 * 七路取证：
 *   A1 纵向分离几何（translateY(-2px) 四锚＋breakout bottom:100%＋条件间距类）；
 *   A2 CTA 丝缎香槟金材质字面（1024 块）＋基线泰语防截断；
 *   A3 Hero 可读性（径向托底＋clamp 主标＋副标暗影）；
 *   A4 helloDaily 六语换血（零占位零套话＋坐标锚＋舱内代码形态）；
 *   A5 冻结项零回归（lang-switch／对话舱 clamp／五情绪／E77 方向锁／768 基线）；
 *   A6 真页 DOM 防遮挡验真脚本在位（scripts/e152-verify.mjs 双视口×六语×双宠）；
 *   G1 链位自保（e152 居 e151 后＋全链 120 段＋node-only 119）。
 *
 * 运行：node --test test/audit-e152-familiar-cta-separation.test.mjs
 * ═══════════════════════════════════════════════════════════════════════════
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(ROOT, p));

const LANGS = ['zh', 'en', 'fr', 'es', 'th', 'vi'];
const APP_CSS = read('web/src/App.css');
const APP_SRC = read('web/src/App.tsx');
const HOME_SRC = read('web/src/components/FamiliarHomeCard.tsx');
const SHEET_SRC = read('web/src/components/FamiliarChatSheet.tsx');
const loc = (l) => JSON.parse(read(`web/src/i18n/locales/${l}.json`));
const block1024 = APP_CSS.slice(APP_CSS.indexOf('@media (min-width: 1024px)'), APP_CSS.indexOf('@media (min-width: 1024px)') + 4800);

// ═══════════════ A1. 灵宠×CTA 纵向分离（刀一 几何） ═══════════════

test('A1 纵列落座几何：aspect-ratio 裁切盒＋in-flow 锚点容器＋条件间距类（E153-刀二）', () => {
  // ① 双宠主位（🥂 E153-刀二：translateY(-2px) 位移全退役——aspect-ratio 裁切盒
  //    锁定可见轮廓真值（PIL alpha 实测：Milo 可见底 0.6711H / Sophia 0.6436H））
  assert.ok(/\.ks-fam-milo\s*\{[^}]*aspect-ratio:\s*720\s*\/\s*550/s.test(APP_CSS),
    'Milo 须 aspect-ratio 720/550（裁切盒真值；E153-P4 物理裁图后 549→550）');
  assert.ok(/\.ks-fam-sophia\s*\{[^}]*aspect-ratio:\s*720\s*\/\s*530/s.test(APP_CSS),
    'Sophia 须 aspect-ratio 720/530（裁切盒真值）');
  assert.ok(!/\.ks-fam-milo\s*\{[^}]*transform:\s*translateY\(-2px\)/s.test(APP_CSS)
    && !/\.ks-fam-sophia\s*\{[^}]*transform:\s*translateY\(-2px\)/s.test(APP_CSS),
    'translateY(-2px) 主位位移须全退役（E153 裁切盒落座）');
  const br = (APP_CSS.match(/\.ks-fam-breathe\s*\{[^}]*\}/) || [''])[0];
  assert.ok(/position:\s*absolute/.test(br), 'breathe 层须绝对化（盒高唯一真源 aspect-ratio，防内容撑高）');
  assert.ok(!APP_CSS.includes('translateY(calc(38.9% + 6px))') && !APP_CSS.includes('translateY(calc(39.2% + 6px))'),
    '旧 E65f 趴键深压 calc 形态须全数退役');
  // ② breakout 锚定（🛬 E153-P4：bottom:-3px 锚 in-flow 锚点容器底边＝按钮顶边，旧 top:0 盒顶锚退役）＋z6＋穿透
  const bo = (APP_CSS.match(/\.ks-fam-breakout\s*\{[^}]*\}/) || [''])[0];
  assert.ok(/bottom:\s*-3px/.test(bo), 'breakout 须 bottom:-3px 锚按钮上沿（E153-P4 强制落地）');
  assert.ok(/z-index:\s*6/.test(bo), 'breakout z6 须冻结（e106 契约）');
  assert.ok(/pointer-events:\s*none/.test(bo), 'breakout 须物理穿透（按钮点击 100% 命中）');
  // ③ 锚点容器 in-flow（72px 贴沿宠位；匿名 display:none 零占位）＋条件间距档
  const an = (APP_CSS.match(/#ks-familiar-anchor\s*\{[^}]*\}/) || [''])[0];
  assert.ok(/position:\s*relative/.test(an) && /height:\s*72px/.test(an) && /display:\s*none/.test(an),
    '锚点容器须 relative/72px 贴沿/匿名 none（E153 in-flow 落座＋E153-P1 刀二）');
  assert.ok(APP_CSS.includes('body.ks-fam-ridden #ks-familiar-anchor { display: block; }'),
    '灵宠在场须 display:block');
  assert.ok(APP_CSS.includes('body.ks-fam-ridden .landing-start-wrap { margin-top: 18px; }'),
    '灵宠骑乘间距条件档须 18px 精确字面（实测 subToFam 32px 入军令 28-34px 档）');
  assert.ok(HOME_SRC.includes("document.body.classList.add('ks-fam-ridden')"),
    'FamiliarHomeCard 须挂 ks-fam-ridden 条件类（灵宠上屏）');
  assert.ok(/useEffect\(\(\) => \{\s*\n\s*const on = !!\(anchorEl && showBreakout && recs\.length > 0\);/.test(HOME_SRC),
    '条件类 effect 须以 anchorEl&&showBreakout&&recs 三真值为门');
  // ④ E82 体型/球心冻结（图标宽锁死）
  assert.equal((APP_CSS.match(/width: min\(98px, 70%\)/g) || []).length, 2, '体型锁 98px 双在（E82 契约）');
  assert.ok(APP_CSS.includes('left: calc(50% - 0.6368 * min(98px, 70%))') && APP_CSS.includes('left: calc(50% - 0.3597 * min(98px, 70%))'),
    '双宠视觉重心锚 50% 严格居中（E153-P1 热补丁，PIL 真值）');
  // ⑤ 六语长文案受控换行（泰语防截断）——基线安全网
  const btnBase = (APP_CSS.match(/\.landing-start-btn\s*\{[^}]*\}/) || [''])[0];
  assert.ok(/overflow-wrap:\s*anywhere/.test(btnBase), 'CTA 基线须 overflow-wrap: anywhere');
});

// ═══════════════ A2. CTA 丝缎香槟金材质（刀一 材质，1024 块） ═══════════════

test('A2 CTA 丝缎香槟金：三段缎面渐变＋曜石黑字＋顶缘高光＋暖金辉光＋hover 增亮', () => {
  const btn = (block1024.match(/\.landing-start-btn\s*\{[^}]*\}/) || [''])[0];
  assert.ok(/min-width:\s*248px/.test(btn), 'CTA 须 min-width 248px（E152 军令）');
  assert.ok(/padding:\s*14px 40px/.test(btn), 'CTA 须 padding 14px 40px（E152 军令）');
  assert.ok(/color:\s*#181324/.test(btn), 'CTA 文字须深曜石黑 #181324');
  assert.ok(/font-weight:\s*600/.test(btn) && /letter-spacing:\s*0\.06em/.test(btn), 'CTA 须 600/0.06em 字态');
  assert.ok(/background:\s*linear-gradient\(135deg,\s*#F0D99C 0%,\s*#D9B45B 52%,\s*#C59B3E 100%\)/.test(btn),
    'CTA 须丝缎香槟金三段渐变（135deg 军令钦定）');
  assert.ok(/0 8px 28px rgba\(217,\s*180,\s*91,\s*0\.34\)/.test(btn), 'CTA 须暖金外辉光 0.34');
  assert.ok(/inset 0 1px 0 rgba\(255,\s*251,\s*235,\s*0\.65\)/.test(btn), 'CTA 须顶缘微高光 inset 0.65');
  assert.ok(/border:\s*none/.test(btn), 'CTA 须无描边（纯缎面）');
  // hover：柔和增亮（亮一档渐变）＋translateY(-2px) 浮起
  const hov = (block1024.match(/\.landing-start-btn:hover\s*\{[^}]*\}/) || [''])[0];
  assert.ok(/transform:\s*translateY\(-2px\)/.test(hov), 'CTA hover 须 translateY(-2px) 浮起');
  assert.ok(/#F6E4AD 0%,\s*#E2C268 52%,\s*#CBA64C 100%/.test(hov), 'CTA hover 须增亮一档缎面渐变');
  assert.ok(/0 10px 32px rgba\(217,\s*180,\s*91,\s*0\.46\)/.test(hov), 'CTA hover 辉光须增强');
  // 旧暗浊褐曜石底禁回潮
  assert.ok(!block1024.includes('rgba(22, 18, 34, 0.94)'), '旧曜石玻璃底禁残留（E151 暗浊褐退役）');
  assert.ok(!/rgba\(212,\s*175,\s*55,\s*0\.34\)/.test(btn), '旧半透明金雾底禁残留');
  // 移动端基线亮金渐变零破坏（E65 原亮金 CTA 不动）
  assert.ok(APP_CSS.includes('background: linear-gradient(135deg, #D4AF37 0%, #F0D060 100%);'),
    '移动端基线亮金渐变须冻结');
});

// ═══════════════ A3. Hero 可读性（刀二，1024 块） ═══════════════

test('A3 Hero 可读性：径向暗晕托底＋主标 clamp 分流＋暗影＋副标增亮（E153-刀一）', () => {
  const cont = (block1024.match(/\.landing-container\s*\{[^}]*\}/) || [''])[0];
  assert.ok(/radial-gradient\(ellipse at center,\s*rgba\(12,\s*8,\s*24,\s*0\.56\) 0%,\s*rgba\(12,\s*8,\s*24,\s*0\) 72%\)/.test(cont),
    'Hero 文本容器须径向暗晕托底（0.56→0/72% 军令钦定）');
  // 🥂 E153-刀一：解除 420px 窄列束缚＋六语排版分流（zh 单行 / 拉丁泰越 balance 折行）
  assert.ok(block1024.includes('.page.input-page { max-width: min(740px, 84vw); }'),
    'Hero 文本区须桌面放宽 min(740px, 84vw)（E153 军令）');
  const title = (block1024.match(/\.input-page \.title\s*\{[^}]*\}/) || [''])[0];
  assert.ok(/font-size:\s*clamp\(26px,\s*2\.2vw,\s*34px\)/.test(title), '拉丁/泰/越主标须 clamp(26px,2.2vw,34px)');
  assert.ok(/line-height:\s*1\.28/.test(title), '主标须 1.28 行高');
  assert.ok(/text-wrap:\s*balance/.test(title), '主标须 text-wrap:balance 优雅折行');
  const zhT = (block1024.match(/html\[lang="zh"\] \.input-page \.title\s*\{[^}]*\}/) || [''])[0];
  assert.ok(/font-size:\s*clamp\(30px,\s*2\.5vw,\s*38px\)/.test(zhT) && /line-height:\s*1\.32/.test(zhT),
    'zh 主标须 clamp(30px,2.5vw,38px)/1.32（单行不折）');
  const thT = (block1024.match(/html\[lang="th"\] \.input-page \.title\s*\{[^}]*\}/) || [''])[0];
  assert.ok(/overflow-wrap:\s*anywhere/.test(thT), '泰语主标须 overflow-wrap:anywhere 防截断');
  assert.ok(/color:\s*#FAF4E8/.test(title), '主标须象牙金白 #FAF4E8');
  assert.ok(/letter-spacing:\s*0\.1em/.test(title), '主标须 0.1em 字距');
  assert.ok(/text-shadow:\s*0 2px 16px rgba\(10,\s*6,\s*22,\s*0\.85\)/.test(title), '主标须暗影托底');
  const sub = (block1024.match(/\.input-page \.subtitle\s*\{[^}]*\}/) || [''])[0];
  assert.ok(/rgba\(246,\s*240,\s*228,\s*0\.86\)/.test(sub), '副标须 0.86 增亮');
  assert.ok(/font-size:\s*15px/.test(sub), '副标须 15px');
  assert.ok(/margin-top:\s*12px/.test(sub) && /line-height:\s*1\.5/.test(sub), '副标须 12px 顶距＋1.5 行高（E153 军令）');
  assert.ok(/max-width:\s*min\(620px,\s*88vw\)/.test(sub), '副标须 max-width min(620px,88vw)（E153 军令）');
  assert.ok(/text-shadow:\s*0 2px 16px rgba\(10,\s*6,\s*22,\s*0\.85\)/.test(sub), '副标须暗影托底');
  // 落地页结构零回归（E151 重影根治位）
  const landing = APP_SRC.slice(APP_SRC.indexOf('landing-container'), APP_SRC.indexOf('<FamiliarHomeCard />'));
  assert.ok(landing.includes("{t('input.subtitle')}"), '副标消费 input.subtitle 须冻结');
});

// ═══════════════ A4. helloDaily 六语换血（刀三） ═══════════════

test('A4 helloDaily 六语换血：零占位零套话＋坐标与心境校准口径＋舱内代码形态', () => {
  const COORD_ANCHOR = {
    zh: ['坐标', '心境', '校准'],
    en: ['coordinates', 'state of mind'],
    fr: ['coordonnées', "état d'esprit"],
    es: ['coordenadas', 'ánimo'],
    th: ['พิกัด', 'จิตใจ'],
    vi: ['tọa độ', 'tâm trạng'],
  };
  for (const l of LANGS) {
    const v = loc(l).familiar.helloDaily;
    assert.ok(typeof v === 'string' && v.length > 30, `locales[${l}] helloDaily 缺失或过短`);
    assert.ok(!v.includes('{{color}}') && !v.includes('{{num}}'), `locales[${l}] helloDaily 禁占位符（换血零插值）`);
    for (const a of COORD_ANCHOR[l]) {
      assert.ok(v.includes(a), `locales[${l}] helloDaily 须含「${a}」（坐标校准口径）`);
    }
  }
  // 旧日运套话词面全语种禁残留（zh 词面 + 拉丁语系 lucky/porte-bonheur/suerte 语感）
  const BAN = ['幸运色', '幸运数字', 'lucky color', 'lucky number', 'couleur porte-bonheur', 'chiffre porte-bonheur',
    'color de la suerte', 'número de la suerte', 'สีแห่งโชค', 'เลขนำโชค', 'màu may mắn', 'con số may mắn'];
  for (const l of LANGS) {
    const v = loc(l).familiar.helloDaily.toLowerCase();
    for (const b of BAN) assert.ok(!v.includes(b.toLowerCase()), `locales[${l}] helloDaily 残留套话「${b}」`);
  }
  // zh 句首军令定版保留（E113 跨日流转锚）
  assert.ok(loc('zh').familiar.helloDaily.includes('新的一天，星轨又为你转动啦'), 'zh 句首须保留');
  // 舱内代码形态：零插值直取＋dailyFortune 核拔除＋唤名门控链零破坏
  assert.ok(SHEET_SRC.includes("const base = t('familiar.helloDaily');"), 'daily 分支须零插值直取');
  assert.ok(!SHEET_SRC.includes("import { dailyFortune } from '../lib/dailyFortune.mjs';"), 'dailyFortune import 须拔除');
  assert.ok(SHEET_SRC.includes('return nameGateRef.current\n        ? prependUserName(lang, profileNameRef.current, base) : base;'),
    'E118/E142.1 唤名门控链须零改动');
  // 首页锦囊 luckPouch 核保留但换血（E153-刀三推翻 E108 旧契约：悬浮卡去日运词）
  assert.ok(HOME_SRC.includes('const luckPouch ='), '首页 luckPouch 锦囊核须保留（E153 换血形态）');
  assert.ok(HOME_SRC.includes("t('familiar.alignRhythm')"), '节奏行须走 i18n 单源（E153-刀三）');
  assert.ok(!HOME_SRC.includes('f.luckyNumber'), '悬浮卡不得残留幸运数/色（E153 军令）');
});

// ═══════════════ A5. 冻结项零回归（军令冻结边界） ═══════════════

test('A5 冻结项零回归：lang-switch／对话舱 clamp／五情绪／E77 方向锁／768 基线', () => {
  // ① 右上角语言切换器（1024 块 fixed top24/right28＋磨砂）零触碰
  const ls = (block1024.match(/\.lang-switch\s*\{[^}]*\}/) || [''])[0];
  assert.ok(/position:\s*fixed/.test(ls) && /top:\s*24px/.test(ls) && /right:\s*28px/.test(ls), 'lang-switch 须冻结 fixed top24/right28');
  assert.ok(/rgba\(15,\s*12,\s*24,\s*0\.58\)/.test(ls), 'lang-switch 磨砂底须冻结');
  // ② 对话舱 1024 clamp 冻结
  assert.ok(/clamp\(400px,\s*30vw,\s*460px\)/.test(block1024) && /min\(680px,\s*76vh\)/.test(block1024),
    '对话舱 clamp 尺寸须冻结');
  // ③ 罗盘 5 情绪枚举零增删（抽锚）
  const DATA = read('web/src/lib/companionMoodData.mjs');
  assert.equal((DATA.match(/archetype:\s*'/g) || []).length, 5, '五情绪枚举须恰 5 项');
  // ④ Milo 右锚/Sophia 左锚方向锁（data-familiar 唯一定位真源）
  assert.ok(SHEET_SRC.includes("data-familiar={ip === 'Milo' ? 'milo' : 'sophia'}"), 'data-familiar 真源须冻结');
  assert.ok(APP_CSS.includes('.ks-chat-layer[data-familiar="sophia"] { justify-content: flex-start'), 'Sophia 左锚须冻结');
  // ⑤ 768 基线 477×638 与移动端全宽抽屉零扰动
  const i768 = APP_CSS.indexOf('@media (min-width: 768px)');
  const b768 = APP_CSS.slice(i768, i768 + 2400);
  assert.ok(/\.ks-chat-sheet\s*\{[^}]*width:\s*477px[^}]*height:\s*638px/.test(b768), '768 基线 477×638 须冻结');
});

// ═══════════════ A6. 真页 DOM 防遮挡验真脚本在位（刀四） ═══════════════

test('A6 真页 DOM 防遮挡验真脚本在位（getBoundingClientRect×Range 文字节点零重叠）', () => {
  assert.ok(exists('scripts/e152-verify.mjs'), '缺 scripts/e152-verify.mjs 真页验真脚本');
  const v = read('scripts/e152-verify.mjs');
  assert.ok(v.includes('getBoundingClientRect'), '验真须量真盒模型');
  assert.ok(v.includes('createRange') && v.includes('selectNodeContents'), '验真须 Range 精确量按钮文字节点');
  assert.ok(v.includes("'390', '844'") || v.includes("390, 844"), '验真须含移动视口 390×844');
  assert.ok(v.includes("'1440', '900'") || v.includes("1440, 900"), '验真须含桌面视口 1440×900');
  assert.ok(v.includes('familiar-breakout') && v.includes('landing-start-btn'), '验真须锚灵宠/CTA 选择器');
  for (const l of LANGS) assert.ok(v.includes(`'${l}'`), `验真须覆盖 ${l} 语种`);
});

// ═══════════════ G1. 链位自保 ═══════════════

test('G1 链位：e152 居 e151 后 e40-compat 前＋全链 120 段＋node-only 119', () => {
  const pkg = JSON.parse(read('package.json'));
  const script = pkg.scripts['test:astro'];
  const all = script.split('&&').map((s) => s.trim());
  const segs = all.filter((s) => s.startsWith('node --test'));
  assert.equal(all.length, 123, `全链总段须 120（E152 插链后继化；实得 ${all.length}）`);
  assert.equal(segs.length, 122, `node --test 段须 119（实得 ${segs.length}）`);
  assert.ok(all[all.length - 1].startsWith('python3 '), 'python3 恒链尾');
  const names = segs.map((s) => (s.match(/test\/([\w.-]+)\.test\.mjs/) || [])[1] || '');
  const i151 = names.indexOf('audit-e151-luxe-rebrand');
  const i152 = names.indexOf('audit-e152-familiar-cta-separation');
  const iE40 = names.findIndex((n) => n.startsWith('audit-e40-compat'));
  assert.ok(i151 > -1 && i152 > -1 && iE40 > -1, '三锚段须在链');
  assert.ok(i152 === i151 + 1, 'e152 须紧居 e151 后');
  assert.ok(i152 < iE40, 'e152 须在 e40-compat 前');
});
