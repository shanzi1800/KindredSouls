// ═══════════════════════════════════════════════════════════════════════
// E84（主公军令 2026-10-22）：姻缘密码全链路黑金重塑与减法大重构 —— 闸门
// ═══════════════════════════════════════════════════════════════════════
// 看守对象：
//   ① Emoji 退役令：模式弹窗 💞/💰 → 星芒 SVG 神秘学矢量（EsotericIcons.tsx 真源）
//   ② 双星分卡：双人输入页两张曜石星卡＋必填置顶＋选填折叠（.ks-fold 令牌件）
//   ③ result 页黑金一镜到底：白底/绿条退役、流光金紫渐变、电线杆排版退役
//   ④ 付费即刻呈现：沙盒/Stripe 支付返回自动流式生成（砍「再点一次按钮」）
//   ⑤ 减法大重构：「生成完整合盘报告」冗余按钮退役、年鉴灰字根治
//   ⑥ 塔罗牌暗金铭牌框＋六语正逆位（禁硬编码英文 Upright/Reversed）
//   ⑦ PaywallCard 品牌金紫统一（青蓝主按钮退役）
// 链位军规：e83 < e84 < e40-compat(len-2) < python(链尾)。
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

const read = (p) => fs.readFileSync(p, 'utf8');

test('E84-① Emoji 退役令：星芒 SVG 神秘学矢量真源（EsotericIcons.tsx 四图标）', () => {
  const icons = read('web/src/components/EsotericIcons.tsx');
  for (const fn of ['IconTwinStars', 'IconNatalVault', 'IconStarYou', 'IconMoonTA']) {
    assert.ok(icons.includes(`export function ${fn}(`), `E84 缺图标 ${fn}`);
  }
  assert.ok(icons.includes('ks-esoteric-icon'), 'E84 图标未挂星芒发光基类');
  assert.ok(icons.includes('#F5D08A') && icons.includes('#C084FC'), 'E84 图标未取品牌金紫令牌色');
  // App.tsx：两处弹窗 mode-icon 位全换 SVG（💞/💰 Emoji 禁回流）
  const app = read('web/src/App.tsx');
  const svgCount = (app.match(/<span className="mode-icon"><Icon(TwinStars|NatalVault) \/><\/span>/g) || []).length;
  assert.strictEqual(svgCount, 4, 'E84 两处弹窗×两模式的 mode-icon 须全挂 SVG（4 处）');
  assert.ok(!/>💞<|>💰</.test(app), 'E84 模式弹窗 Emoji 回流违令');
});

test('E84-② 双星分卡：两张曜石星卡＋必填置顶＋选填丝滑折叠（六语）', () => {
  const app = read('web/src/App.tsx');
  // 星卡×2（你 / TA）
  const starcards = (app.match(/className="ks-starcard"/g) || []).length;
  assert.strictEqual(starcards, 2, 'E84 双星分卡须两张 ks-starcard');
  // 折叠触发条×2 ＋ data-open 令牌协议
  const triggers = (app.match(/className="ks-fold-trigger"/g) || []).length;
  assert.strictEqual(triggers, 2, 'E84 两张星卡各须一条折叠触发条');
  assert.ok((app.match(/className="ks-fold" data-open=/g) || []).length >= 2, 'E84 折叠抽屉须走令牌 data-open 协议');
  // E71 祖先裁切链防线：data-settled 展开落定后放行 CitySearchInput 下拉（absolute 弹层）
  assert.ok((app.match(/data-settled=/g) || []).length >= 2, 'E84 缺 data-settled 裁切防线（E71 血训）');
  // 六语字典三件套
  for (const k of ['L_CARD1', 'L_CARD2', 'L_FOLD']) {
    assert.ok(app.includes(`const ${k} = ({`), `E84 缺六语字典 ${k}`);
  }
  const zhBlock = app.slice(app.indexOf("const L_CARD1 = ({"), app.indexOf("const L_FOLD"));
  assert.ok(zhBlock.includes('你的星盘坐标') && zhBlock.includes('TA 的星盘坐标'), 'E84 星卡标题六语字典缺 zh 词条');
  // 必填置顶：星卡内 DateInput 在折叠条之前（禁选填压必填回潮）
  const card1 = app.slice(app.indexOf('className="ks-starcard"'), app.indexOf('ks-fold-trigger'));
  assert.ok(card1.includes('<DateInput'), 'E84 星卡内必填生日须先于折叠条（必填置顶军令）');
});

test('E84-②b 星卡 CSS：曜石毛玻璃＋钛金描边＋折叠抽屉裁切放行规则', () => {
  const css = read('web/src/App.css');
  assert.ok(/\.ks-starcard\s*\{[^}]*var\(--ks-card-glass\)/.test(css), 'E84 星卡未用毛玻璃令牌');
  assert.ok(/\.ks-fold\[data-settled='true'\]\s*>\s*\.ks-fold-inner\s*\{[^}]*overflow:\s*visible/.test(css), 'E84 折叠落定放行规则缺失（下拉弹层会被裁切）');
  assert.ok(css.includes('.ks-fold-trigger'), 'E84 缺折叠触发条样式');
});

test('E84-③ result 页黑金一镜到底：白底/绿条退役＋流光金紫能量条', () => {
  const app = read('web/src/App.tsx');
  const css = read('web/src/App.css');
  // ScoreRing：SVG 渐变环（金→紫），禁青绿 #81D8D0 环
  assert.ok(app.includes('id="ks-ring-orbit"'), 'E84 匹配环缺星轨渐变定义');
  assert.ok(/stroke="url\(#ks-ring-orbit\)"/.test(app), 'E84 匹配环未挂渐变');
  assert.ok(!/stroke="#81D8D0"/.test(app), 'E84 匹配环青绿回潮违令');
  // 四维条：星轨流光令牌
  assert.ok(/\.dim-bar-fill\s*\{[^}]*var\(--ks-progress-orbit/.test(css), 'E84 四维条未用星轨流光令牌');
  assert.ok(!/linear-gradient\(90deg,\s*#81D8D0,\s*#5cc5bb\)/.test(css), 'E84 四维条绿渐变回潮违令');
  // 白底退役：dim-section / engine-card 禁 #fff
  assert.ok(!/\.dim-section\s*\{[^}]*background:\s*#fff/.test(css), 'E84 dim-section 白底回潮违令');
  assert.ok(!/\.engine-card\s*\{[^}]*background:\s*#fff/.test(css), 'E84 engine-card 白底回潮违令');
  assert.ok(/\.dim-section\s*\{[^}]*var\(--ks-card-glass[,)]/.test(css), 'E84 四维卡未用毛玻璃令牌');
  assert.ok(/\.engine-card\s*\{[^}]*var\(--ks-card-glass[,)]/.test(css), 'E84 引擎卡未用毛玻璃令牌');
  // 电线杆退役：section-title 左对齐
  assert.ok(/\.section-title\s*\{[^}]*text-align:\s*left/.test(css), 'E84 区块标题未左对齐（禁电线杆）');
  // 折叠开关黑金类
  assert.ok(app.includes('ks-detail-toggle'), 'E84 result 折叠开关未黑金化');
});

test('E84-④→E85-① 付费即刻呈现：沙盒授予落支付标志＋per-session 解锁自动揭晓链', () => {
  const app = read('web/src/App.tsx');
  // 沙盒 onGranted：先落 ks_payment_success 再 reload（复用自动触发链）
  // （E87-③ 扩容锚窗 260→700：onGranted 增付讫报告路由标记后 reload 被旧窗挤出）
  const onGranted = app.slice(app.indexOf('onGranted:'), app.indexOf('onGranted:') + 700);
  assert.ok(onGranted.includes("sessionStorage.setItem('ks_payment_success', '1')"), 'E84 沙盒授予未落支付成功标志');
  assert.ok(onGranted.includes('window.location.reload()'), 'E84 沙盒授予未刷新承接');
  // 🧹 E85（主公军令 2026-10-24）：autoReportLockRef 二段链（支付后自动生成 once 合盘
  // 四段深报）随「合盘」板块整体退役；断言改锁 per-session 解锁链：
  //   支付返回（pendingInsightTrigger）⇒ 解锁当次会话 + 自动流式揭晓 AI 洞察＋塔罗。
  assert.ok(!app.includes('autoReportLockRef'), 'E85 autoReportLockRef once 二段链残留违令');
  assert.ok(!app.includes("generateReport('once')"), 'E85 once 深报生成调用残留违令');
  const seg = app.slice(app.indexOf('if (pendingInsightTrigger) {'), app.indexOf('if (pendingInsightTrigger) {') + 420);
  assert.ok(seg.includes("sessionStorage.setItem('ks_compat_session_unlocked', '1')"), 'E85 支付返回未落 per-session 解锁标志');
  assert.ok(seg.includes('setSessionUnlocked(true)'), 'E85 支付返回未解锁当次会话');
  assert.ok(seg.includes('triggerInsight()'), 'E85 支付返回未自动流式揭晓 AI 洞察');
});

test('E84-⑤ 减法大重构：「生成完整合盘报告」冗余入口彻底退役', () => {
  const app = read('web/src/App.tsx');
  assert.ok(!app.includes('生成完整合盘报告'), 'E84 「生成完整合盘报告」按钮残留违令');
  assert.ok(!app.includes('Full Compatibility Report'), 'E84 「Full Compatibility Report」按钮残留违令');
  // 年鉴灰字根治：说明文字金辉可读
  assert.ok(app.includes("#E9D8A6"), 'E84 年鉴说明未提亮（灰字看不清根治）');
  // 年鉴区块归入黑金高对比度卡片
  assert.ok(/宇宙生日年鉴[\s\S]{0,600}ks-glass-card/.test(app) || /ks-glass-card[\s\S]{0,300}宇宙生日年鉴/.test(app), 'E84 年鉴区块未归入黑金毛玻璃卡');
});

test('E84-⑥ 塔罗牌暗金铭牌框＋六语正逆位（禁硬编码英文）', () => {
  const app = read('web/src/App.tsx');
  const css = read('web/src/App.css');
  assert.ok(app.includes('ks-tarot-frame') && app.includes('ks-tarot-glyph'), 'E84 塔罗牌未精修（铭牌框缺失）');
  assert.ok(!/\(Upright\)/.test(app) && !/\(Reversed\)/.test(app), 'E84 塔罗正逆位硬编码英文残留违令');
  assert.ok(app.includes('tarotCard.orientation'), 'E84 塔罗正逆位未走六语真源 orientation');
  assert.ok(css.includes('.ks-tarot-frame') && css.includes('@keyframes ksTarotFloat'), 'E84 塔罗牌缺微光悬浮动效');
});

test('E84-⑦ AI 洞察高定排版：金句高亮框＋分级段落', () => {
  const app = read('web/src/App.tsx');
  const css = read('web/src/App.css');
  assert.ok(app.includes('ks-insight-quote') && app.includes('ks-insight-highlight'), 'E84 洞察排版缺金句/高亮分级');
  assert.ok(css.includes('.ks-insight-quote'), 'E84 金句铭牌样式缺失');
  // 洞察段落行距呼吸感 1.75
  assert.ok(/\.insight-result p\s*\{[^}]*line-height:\s*1\.75/.test(css), 'E84 洞察段落未升级行距');
});

test('E84-⑧ PaywallCard 品牌金紫统一（青蓝主按钮退役）', () => {
  const pw = read('web/src/components/PaywallCard.tsx');
  assert.ok(!pw.includes('#2ECBF7'), 'E84 PaywallCard 青蓝主色残留违令');
  // 双端渐变（无亮中段 E9C7F2）⇒ 均值 194<200 不触发美学探针白块铁律（E84 实测咬中后修正）
  assert.ok(pw.includes('linear-gradient(135deg, #F5D08A 0%, #C084FC 100%)'), 'E84 PaywallCard 主按钮未换双端金紫渐变');
});

test('E84-⑨ 双星分卡不破坏既有契约：六语词条/结构/字段全链守恒', () => {
  const app = read('web/src/App.tsx');
  // E79 六语词条仍走 i18n（audit-e66 主闸），星卡不触碰
  assert.ok(app.includes("t('input.yourBirthday')") && app.includes("t('input.theirBirthday')"), 'E84 星卡必填标签未走 i18n 既有键');
  // DateInput 校验链组件 props 守恒（shake/ref/key/autoFocus 全链）
  assert.ok(app.includes('onLastFilled={jumpToD2}') && app.includes('firstFieldRef={d2FirstRef}'), 'E84 双星卡 DateInput 校验链 props 丢失');
  assert.ok(app.includes('key={d2Key}'), 'E84 d2Key 焦点跳转键丢失');
  // CitySearchInput 六参守恒
  const cityCount = (app.match(/<CitySearchInput /g) || []).length;
  assert.strictEqual(cityCount, 2, 'E84 CitySearchInput 实例数须为 2（双星卡各一）');
  // 金牌提示保留（复用 wealthInput.birthTip）
  assert.ok(app.includes("t('wealthInput.birthTip')"), 'E84 金牌精度提示丢失');
});

test('E84-⑩ 链位军规：e83 < e84 < e40-compat(len-2) < python(链尾)', () => {
  const pkg = JSON.parse(read('package.json'));
  const chain = pkg.scripts['test:astro'];
  const segs = chain.split('&&').map(s => s.trim());
  const e83 = segs.findIndex(s => s.includes('audit-e83-celestial-ui'));
  const e84 = segs.findIndex(s => s.includes('audit-e84-compat-black-gold'));
  const e85 = segs.findIndex(s => s.includes('audit-e85-compat-funnel'));
  const e40 = segs.findIndex(s => s.includes('audit-e40-compat-synastry-tensor-fusion'));
  const py = segs.findIndex(s => s.includes('python3'));
  assert.ok(e83 >= 0 && e84 === e83 + 1, 'E84 闸门必须紧跟 e83 之后');
  assert.ok(e85 === e84 + 1, 'E85 闸门必须紧跟 e84 之后（E85 军令入编）');
  assert.strictEqual(e40, segs.length - 2, 'e40-compat 必须恒为 len-2');
  assert.strictEqual(py, segs.length - 1, 'python 必须恒为链尾');
  // 段位下界（结构改动 ⇒ 基准 61→62 同步）
  assert.ok(segs.length >= 62, `E84 后链长须 ≥62（实际 ${segs.length}）`);
});
