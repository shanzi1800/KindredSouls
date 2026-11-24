/**
 * audit-e153-multilang-purge.test.mjs —— E153 全语种清剿闸门（主公军令 2026-11-24）
 * 五刀铁血守备（离线源码形制断言；真页双视口×六语由 scripts/e153-blade3-verify.mjs
 * ＋scripts/e153-blade4-verify.mjs 承担——本闸门 F 组断言脚本在位）：
 *   A1 Hero 排版（刀一）：420px 窄列解除＋六语 clamp 分流＋zh 单行档＋th 防截断
 *   A2 灵宠归位（刀二）：in-flow 锚点容器＋aspect-ratio 裁切盒＋translateY 退役
 *   A3 气泡防溢出＋清 Lucky（刀三）：容器/按钮防溢出死锁＋六语换血＋状态栏折行
 *   A4 P2 优先权＋纯净锁（刀四）：模式链 P2 压 daily＋only-hello 重水合＋lang deps
 *   A5 冻结项零回归＋链位自保（120→121 段）
 *   A6 E153-P3 尾层纠偏（军令 2026-11-24「盖脸事故」）：严锁图层前后（尾 z1/本体 z2/眨眼 z3＋根容器 isolation）
 *      ＋尾宽 108%（1.05W–1.15W）＋尾根藏臀（Milo right:55%/origin 88% 85%；Sophia left:55%/origin 12% 85%）
 *      ＋-3↔+4deg/4.8s 呼吸摆（translateY 补偿随巨尾退役）＋DOM 序契约
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(path.join(REPO, p), 'utf8');
const LANGS = ['zh', 'en', 'fr', 'es', 'th', 'vi'];

const APP_CSS = read('web/src/App.css');
const APP_TSX = read('web/src/App.tsx');
const HOME = read('web/src/components/FamiliarHomeCard.tsx');
const SHEET = read('web/src/components/FamiliarChatSheet.tsx');
const POU = read('web/src/lib/dailyPouchStore.mjs');

/* 军令「悬浮气泡卡 6 语种轻奢替换定稿表」逐字 */
const TOP = { zh: '✦ 今日坐标校准 ✦', en: '✦ Daily Alignment ✦', fr: '✦ Alignement du Jour ✦', es: '✦ Calibración de Hoy ✦', th: '✦ พิกัดประจำวัน ✦', vi: '✦ Hiệu Chỉnh Hôm Nay ✦' };
const CTA1 = { zh: '✦ 今日情绪天象', en: '✦ Mood Compass', fr: '✦ Boussole d\'Humeur', es: '✦ Brújula Emocional', th: '✦ เข็มทิศอารมณ์วันนี้', vi: '✦ La Bàn Tâm Trạng' };
const CTA2 = { zh: '✦ 与 TA 聊聊', en: '✦ Talk to Me', fr: '✦ Me parler', es: '✦ Hablar conmigo', th: '✦ คุยกับฉัน', vi: '✦ Trò chuyện cùng tôi' };
const RHYTHM = {
  zh: '今日星轨节奏平稳，适合把注意力收回到真正重要的事上。',
  en: 'Today\'s rhythm favors clarity—focus on what truly moves you forward.',
  fr: 'Le rythme du jour invite à la clarté : concentrez-vous sur l\'essentiel.',
  es: 'El ritmo de hoy favorece la claridad: enfócate en lo esencial.',
  th: 'จังหวะวันนี้เหมาะแก่ความชัดเจน โฟกัสสิ่งที่สำคัญต่อใจคุณจริง ๆ',
  vi: 'Nhịp điệu hôm nay ủng hộ sự sáng rõ — hãy tập trung vào điều thật sự quan trọng.',
};

const block1024 = (() => {
  const i = APP_CSS.indexOf('@media (min-width: 1024px)');
  return i > -1 ? APP_CSS.slice(i, i + 6000) : '';
})();

/* ═══════════ A1 Hero 排版（刀一）═══════════ */

test('A1-① Hero 文本区窄列解除＋六语 clamp 分流（军令逐字）', () => {
  assert.ok(block1024.includes('.page.input-page { max-width: min(740px, 84vw); }'),
    'Hero 文本区须放宽 min(740px, 84vw)（解除 420px 窄列）');
  const title = (block1024.match(/\.input-page \.title\s*\{[^}]*\}/) || [''])[0];
  assert.ok(/font-size:\s*clamp\(26px,\s*2\.2vw,\s*34px\)/.test(title) && /line-height:\s*1\.28/.test(title),
    '拉丁/泰/越主标须 clamp(26px,2.2vw,34px)/1.28');
  assert.ok(/text-wrap:\s*balance/.test(title), '主标须 text-wrap:balance（优雅 1-2 行）');
  const zhT = (block1024.match(/html\[lang="zh"\] \.input-page \.title\s*\{[^}]*\}/) || [''])[0];
  assert.ok(/clamp\(30px,\s*2\.5vw,\s*38px\)/.test(zhT) && /line-height:\s*1\.32/.test(zhT),
    'zh 主标须 clamp(30px,2.5vw,38px)/1.32（单行不折档）');
  const thT = (block1024.match(/html\[lang="th"\] \.input-page \.title\s*\{[^}]*\}/) || [''])[0];
  assert.ok(/overflow-wrap:\s*anywhere/.test(thT), '泰语主标须 overflow-wrap:anywhere');
  const sub = (block1024.match(/\.input-page \.subtitle\s*\{[^}]*\}/) || [''])[0];
  assert.ok(/margin-top:\s*12px/.test(sub) && /line-height:\s*1\.5/.test(sub), '副标须 12px/1.5（军令）');
  assert.ok(/max-width:\s*min\(620px,\s*88vw\)/.test(sub), '副标须 max-width min(620px,88vw)');
});

test('A1-② documentElement.lang 接线（html[lang] 分流真源）', () => {
  assert.ok(APP_TSX.includes('document.documentElement.lang'),
    'App.tsx 须同步 documentElement.lang（languageChanged＋初始挂载）');
});

/* ═══════════ A2 灵宠归位（刀二）═══════════ */

test('A2-① in-flow 锚点容器（relative/72px 贴沿/匿名零占位）', () => {
  const an = (APP_CSS.match(/#ks-familiar-anchor\s*\{[^}]*\}/) || [''])[0];
  assert.ok(/position:\s*relative/.test(an) && /height:\s*72px/.test(an), '锚点容器须 relative/72px 贴沿真实占位（E153-P1 刀二）');
  assert.ok(/display:\s*none/.test(an), '匿名访客须 display:none 零占位');
  assert.ok(/margin:\s*0\s*;/.test(an), '锚点容器须零间距贴沿（旧 12px 悬空缝隙退役）');
  assert.ok(APP_CSS.includes('body.ks-fam-ridden #ks-familiar-anchor { display: block; }'), '灵宠在场须 block');
});

test('A2-② aspect-ratio 裁切盒＋translateY 退役＋breathe 绝对化', () => {
  assert.ok(/\.ks-fam-milo\s*\{[^}]*aspect-ratio:\s*720\s*\/\s*549/s.test(APP_CSS), 'Milo 须 720/549 裁切盒');
  assert.ok(/\.ks-fam-sophia\s*\{[^}]*aspect-ratio:\s*720\s*\/\s*530/s.test(APP_CSS), 'Sophia 须 720/530 裁切盒');
  assert.ok(!/\.ks-fam-milo\s*\{[^}]*transform:\s*translateY\(-2px\)/s.test(APP_CSS)
    && !/\.ks-fam-sophia\s*\{[^}]*transform:\s*translateY\(-2px\)/s.test(APP_CSS),
    '主位 translateY(-2px) 位移须全退役（E153 裁切盒落座）');
  const br = (APP_CSS.match(/\.ks-fam-breathe\s*\{[^}]*\}/) || [''])[0];
  assert.ok(/position:\s*absolute/.test(br), 'breathe 层须绝对化（防内容撑高盒身）');
  const bo = (APP_CSS.match(/\.ks-fam-breakout\s*\{[^}]*\}/) || [''])[0];
  assert.ok(/top:\s*0/.test(bo), 'breakout 须 top:0（in-flow 容器顶沿锚定）');
});

test('A2-③ DOM 序即视觉序：锚点容器在 CTA 按钮之前', () => {
  const iAnchor = APP_TSX.indexOf('id="ks-familiar-anchor"');
  const iBtn = APP_TSX.indexOf('landing-start-btn"');
  assert.ok(iAnchor > -1 && iBtn > -1 && iAnchor < iBtn, 'anchor 必须先于 CTA 按钮（in-flow 序即视觉序）');
});

test('A2-④ E153-P1 热补丁：灵宠水平严格居中＋贴沿落座（双朝向硬断言）', () => {
  /* 军令 E153-P1（2026-11-24）：主公实拍两病灶——水平偏左（旧 44%/56% 偏置）
     ＋垂直悬空（旧 76px+12px 缝隙）。本断言锁新形态：PIL 可见轮廓 cx 真值
     锦 50% 严格居中；锚点 72px 零间距贴沿。真页几何（|petCenterX−ctaCenterX|
     ≤4px＋文字零重叠）由 scripts/e153-p1-verify.mjs 实弹承担。 */
  assert.ok(APP_CSS.includes('left: calc(50% - 0.6368 * min(98px, 70%))'), 'Milo 视觉重心须锢 50% 严格居中（PIL cx=0.6368）');
  assert.ok(APP_CSS.includes('left: calc(50% - 0.3597 * min(98px, 70%))'), 'Sophia 视觉重心须锢 50% 严格居中（PIL cx=0.3597）');
  assert.ok(!APP_CSS.includes('left: calc(44% - 62.3px)') && !APP_CSS.includes('left: calc(56% - 35.3px)'), '旧 44%/56% 偏置锚禁回潮');
  assert.ok(existsSync(path.join(REPO, 'scripts/e153-p1-verify.mjs')), 'P1 真页验收脚本须在位（双视口×双朝向×六语）');
});

/* ═══════════ A3 气泡防溢出＋清 Lucky＋状态栏折行（刀三）═══════════ */

test('A3-① 气泡容器与按钮防溢出死锁（军令逐字）', () => {
  const bub = (APP_CSS.match(/\.ks-fam-bubble\s*\{[^}]*\}/) || [''])[0];
  assert.ok(/min-width:\s*224px/.test(bub), '气泡须 min-width:224px');
  assert.ok(/max-width:\s*min\(312px,\s*86vw\)/.test(bub), '气泡须 max-width:min(312px,86vw)');
  assert.ok(/padding:\s*14px 16px/.test(bub) && /box-sizing:\s*border-box/.test(bub), '气泡须 14px 16px/border-box');
  assert.ok(/bottom:\s*34\.4%/.test(bub), '气泡垂直口径须 34.4%（裁切盒像素守恒）');
  const cta = (APP_CSS.match(/\.ks-fam-bubble-cta\s*\{[^}]*\}/) || [''])[0];
  assert.ok(/display:\s*block/.test(cta) && /width:\s*100%/.test(cta), '按钮须块级全宽');
  assert.ok(/white-space:\s*normal/.test(cta) && /overflow-wrap:\s*anywhere/.test(cta), '按钮须受控换行');
  assert.ok(/line-height:\s*1\.35/.test(cta), '按钮须 1.35 行高');
  assert.ok(!/[^/*\w]align-self:\s*flex-start\s*;/.test(cta.replace(/\s+/g, ' ')), 'align-self:flex-start 属性须退役');
});

test('A3-② 悬浮卡换血六语军令定稿表逐字（luckLead/chatCta/alignRhythm/openCta）', () => {
  for (const l of LANGS) {
    const o = JSON.parse(read(`web/src/i18n/locales/${l}.json`));
    assert.equal(o.familiar.luckLead, TOP[l], `${l} luckLead 军令表逐字`);
    assert.equal(o.familiar.chatCta, CTA2[l], `${l} chatCta 军令表逐字`);
    assert.equal(o.familiar.alignRhythm, RHYTHM[l], `${l} alignRhythm 军令表逐字`);
  }
  for (const l of LANGS) {
    const m = POU.match(new RegExp(`\\n\\s*${l}:\\s*\\{[\\s\\S]*?openCta:\\s*'((?:[^'\\\\]|\\\\.)+)'`));
    assert.ok(m, `${l} POUCH_UI.openCta 缺失`);
    const v = m[1].replace(/\\'/g, "'");
    assert.equal(v, CTA1[l], `${l} openCta 军令表逐字`);
  }
});

test('A3-③ 悬浮卡零 Lucky 旧词（六语全表消费面）', () => {
  assert.ok(!HOME.includes('f.luckyNumber') && !HOME.includes("t('familiar.luckNum')")
    && !HOME.includes("t('familiar.luckColor')") && !HOME.includes('f.vibe'),
    '悬浮卡不得残留幸运数/色/能量微语旧核');
  assert.ok(!HOME.includes("import { dailyFortune } from '../lib/dailyFortune.mjs';"),
    '首页气泡不得消费 dailyFortune 核（弹窗层独立）');
  assert.ok(HOME.includes("t('familiar.alignRhythm')"), '节奏行须走 i18n 单源');
  /* BUB 与容器上限同源（E82 解耦契约后继） */
  assert.ok(HOME.includes('const BUB = 312'), 'BUB 上限须与容器 312 同源');
  assert.ok(HOME.includes('0.344 * b.height'), 'vRaise 垂直口径须 0.344 同步');
});

test('A3-④ 状态栏优雅折行（flex-wrap＋三截断退役＋bond 同折行）', () => {
  const st = (APP_CSS.match(/\.ks-chat-status\s*\{[^}]*\}/) || [''])[0];
  assert.ok(/flex-wrap:\s*wrap/.test(st) && /row-gap:\s*4px/.test(st), '状态栏须 wrap/row-gap:4px（军令）');
  assert.ok(!/white-space:\s*nowrap/.test(st) && !/text-overflow:\s*ellipsis/.test(st), '状态栏三截断须退役');
  const bond = (APP_CSS.match(/\.ks-chat-bond\s*\{[^}]*\}/) || [''])[0];
  assert.ok(/white-space:\s*normal/.test(bond) && !/text-overflow:\s*ellipsis/.test(bond), 'bond 须同折行（vi 长前缀病灶）');
});

/* ═══════════ A4 P2 优先权＋六语单语纯净锁（刀四）═══════════ */

test('A4-① P2 今日情绪优先权焊死（模式链序断言）', () => {
  const iP2 = SHEET.indexOf('} else if (_e150TodayMood) {');
  const iDaily = SHEET.indexOf("mode = 'daily'");
  assert.ok(iP2 > -1 && iDaily > -1 && iP2 < iDaily, 'P2 分支必须在跨日 daily 分支之前（军令铁律）');
  const seg = SHEET.slice(iP2, iP2 + 400);
  assert.ok(/mode = 'p1queue'/.test(seg), 'P2 分支须落 p1queue（队列 P1＞P2回忆 顺位决出）');
});

test('A4-② only-hello 重水合（预存旧开场白刷新替换＋切语言重水合同一刀）', () => {
  assert.ok(SHEET.includes("_e153OnlyHello = sess.messages.every"), 'only-hello 判定须在场（every sender!==user）');
  const iOnly = SHEET.indexOf('if (_e153OnlyHello) {');
  const seg = SHEET.slice(iOnly, iOnly + 500);
  assert.ok(/setHelloMode\(mode\)/.test(seg) && /helloFor\(mode\)/.test(seg), '重水合须按前置重算模式＋当前语言重生首句');
  assert.ok(/sender !== 'user'/.test(SHEET), '用户已回多条历史须原样复原（E113 禁重复首句铁律守备）');
});

test('A4-③ 切语言实时重水合 deps（军令「立即按新语种重生」）', () => {
  assert.ok(SHEET.includes('}, [t, name, helloMode, lang]);'), '重写效应 deps 须显式含 lang');
});

/* ═══════════ A5 冻结项零回归＋链位自保 ════════════ */

test('A5-① 冻结项：罗盘五情绪白名单零改动', () => {
  const G = read('web/src/lib/companionMoodGreetings.mjs');
  assert.ok(G.includes("Object.freeze(['melancholy', 'agitated', 'longing', 'radiant', 'grateful'])"),
    '五情绪白名单须冻结（军令冻结项）');
});

test('A5-② 真页验真脚本在位（blade3 气泡/状态栏＋blade4 P2/纯净锁）', () => {
  assert.ok(existsSync(path.join(REPO, 'scripts/e153-blade3-verify.mjs')), 'blade3 真页验收脚本须在位');
  assert.ok(existsSync(path.join(REPO, 'scripts/e153-blade4-verify.mjs')), 'blade4 真页验收脚本须在位');
  const b3 = read('scripts/e153-blade3-verify.mjs');
  assert.ok(b3.includes("data-testid=\"pouch-open\"") && b3.includes('Lucky number'), 'blade3 须断言按钮一与 Lucky 全语种表');
  const b4 = read('scripts/e153-blade4-verify.mjs');
  assert.ok(b4.includes("mood:'radiant'") && b4.includes('\\u4e00-\\u9fff'), 'blade4 须断言 radiant 注入与零 CJK 纯净锁');
});

test('A5-③ 链位自保：e153 入编（e152 后、e40-compat 前；全链 120→121 段）', () => {
  const pkg = JSON.parse(read('package.json'));
  const chain = pkg.scripts['test:astro'];
  const i152 = chain.indexOf('test/audit-e152-familiar-cta-separation.test.mjs');
  const i153 = chain.indexOf('test/audit-e153-multilang-purge.test.mjs');
  const i40 = chain.indexOf('test/audit-e40-compat-synastry-tensor-fusion.test.mjs');
  assert.ok(i152 > -1 && i153 > -1 && i40 > -1, 'e153 须入编');
  assert.ok(i152 < i153 && i153 < i40, 'e153 须居 e152 后、e40-compat 前（python3 恒链尾）');
  const segs = chain.split('&&');
  assert.equal(segs.length, 121, `军规链段数须为 121（E153 入编后 120→121；实为 ${segs.length}）`);
});

/* ═══════════ A6 E153-P3 尾层纠偏（军令 2026-11-24「严锁图层/缩正比例/精准藏臀」）═══════════ */

test('A6-① P3 死数字：图层严锁＋尾宽 108%＋尾根藏臀锚（Milo right:55%/Sophia left:55%）', () => {
  // 严锁图层前后：尾 z1 / 本体 z2（position:relative 使 z 生效） / 眨眼 z3 / 根容器 isolation
  assert.ok(/\.ks-fam-tail\s*\{[^}]*z-index: 1;/.test(APP_CSS), '尾层须 z-index:1（绝对底层）');
  assert.ok(/\.ks-fam-img\s*\{[^}]*position: relative; z-index: 2;/.test(APP_CSS), '本体层须 position:relative＋z-index:2（压尾层之上）');
  assert.ok(/\.ks-fam-img-blink\s*\{[^}]*z-index: 3;/.test(APP_CSS), '眨眼层须 z-index:3（最上）');
  assert.ok(/\.ks-fam-breakout\s*\{[^}]*isolation: isolate;/.test(APP_CSS), '根容器须 isolation:isolate（独立层叠上下文）');
  assert.ok(/\.ks-fam-breathe\s*\{[^}]*width: 100%;\s*\n\s*height: 100%;/.test(APP_CSS), 'breathe 盒须收敛宠盒 100%（尾层 bottom 锚＝爪线；img 自然高 818 系死区溢出曾致 bottom 锚深陷 36px）');
  // 尾宽 1.05W–1.15W 死锁（W=本体 98px ⇒ 108%）
  assert.ok(/\.ks-fam-milo \.ks-fam-tail\s*\{[^}]*right: 55%; bottom: 2px; width: 108%;/.test(APP_CSS)
    && /transform-origin: 88% 85%;/.test((APP_CSS.match(/\.ks-fam-milo \.ks-fam-tail\s*\{[\s\S]*?\n\}/) || [''])[0]),
    'Milo 尾层须军令死数字（right:55%/bottom:2px/108%/origin 88% 85%——尾根藏左下臀后）');
  assert.ok(/\.ks-fam-sophia \.ks-fam-tail\s*\{[^}]*left: 55%; bottom: 2px; width: 108%;/.test(APP_CSS)
    && /transform-origin: 12% 85%;/.test((APP_CSS.match(/\.ks-fam-sophia \.ks-fam-tail\s*\{[\s\S]*?\n\}/) || [''])[0]),
    'Sophia 尾层须镜像死数字（left:55%/bottom:2px/108%/origin 12% 85%——尾根藏右下臀后）');
  // P2 巨尾锚全族禁回潮（170% 巨尾＝「长猫头的毛毛虫」事故源）
  for (const stale of ['-71.4%', 'width: 170%', '94.8% 61.5%', '5% 61.3%']) {
    assert.ok(!APP_CSS.includes(stale), `P2 巨尾锚字面 ${stale} 禁回潮（E153-P3 纠偏后全退役）`);
  }
  // 旧竖构图锚全族禁回潮（含转义正则族防静默复活）
  for (const stale of ['13.5%', '58.42%', '41.58%', '37.88%', '86.2%', '26.4%', '20.8%', '38.6%']) {
    assert.ok(!APP_CSS.includes(stale), `旧尾锚字面 ${stale} 禁回潮（E153-P2 换尾后全退役）`);
  }
});

test('A6-② 尾摆军令钦定：-3deg↔+4deg、4.8s 缓动呼吸摆（单组双宠共用）', () => {
  const kf = (APP_CSS.match(/@keyframes ksFamTailLeisurely \{[\s\S]*?\n\}/) || [''])[0];
  assert.ok(/rotate\(-3deg\)/.test(kf) && /rotate\(4deg\)/.test(kf), '尾摆须 -3deg↔+4deg（军令钦定）');
  assert.ok(!/translateY\(-10px\)/.test(kf), 'P2 巨尾 −10px 补偿禁回潮（108% 小尾等比补偿为 −5px）');
  assert.ok(/rotate\(-3deg\) translateY\(-5px\)/.test(kf) && /rotate\(4deg\) translateY\(-5px\)/.test(kf), '双帧须 translateY(-5px) 等位移补偿（尾臂 93px×sin3°≈4.8px bbox 膨胀 vs fr/es/vi mobile 双行文字顶距 4px 临界；静止帧 animation:none 零悬空贴沿不受影响）');
  assert.ok(/\.ks-fam-milo \.ks-fam-tail\s*\{[^}]*animation: ksFamTailLeisurely 4\.8s/.test(APP_CSS)
    && /\.ks-fam-sophia \.ks-fam-tail\s*\{[^}]*animation: ksFamTailLeisurely 4\.8s/.test(APP_CSS),
    '双宠主摆须 4.8s（旧 4.5s 退役）');
  assert.ok(!APP_CSS.includes('ksFamTailLeisurely 4.5s'), '旧 4.5s 字面禁回潮');
  assert.ok(/\.ks-fam-sophia \.ks-fam-tail\s*\{[^}]*animation-delay: 0\.9s/.test(APP_CSS), 'Sophia 0.9s 错峰相位差契约保留');
});

test('A6-③ 任意帧零遮挡收敛：idle/live 尾动画横构图等位移换算（尾臂 37→158px）', () => {
  // idle 甩尾 22→7deg（e111/e112/e113 已后继）；live ±13→±4deg；tap 3deg×150px≈8px 安全不动
  assert.ok(!/rotate\(22deg\)|rotate\(-9deg\)|rotate\(12deg\)|rotate\(-13deg\)|rotate\(13deg\)/.test(APP_CSS),
    '旧大弧度尾摆角度全族禁回潮（横尾臂 158px 会穿按钮 padding 区）');
  const live = (APP_CSS.match(/@keyframes ksFamMiloLiveTail \{[\s\S]*?\n\}/) || [''])[0];
  assert.ok(/rotate\(-4deg\)/.test(live) && /rotate\(4deg\)/.test(live), 'live 摇尾须收敛 ±4deg');
  const tap = (APP_CSS.match(/@keyframes ksFamTailTap \{[\s\S]*?\n\}/) || [''])[0];
  assert.ok(/rotate\(3deg\)/.test(tap), 'TailTap 3deg 小幅打拍契约保留（位移 8px 安全）');
  assert.ok(/\.ks-fam-tail, \.ks-fam-ears \{ transition: transform 0\.45s ease; \}/.test(APP_CSS), 'live 摘除平滑回落 transition 契约保留（e114）');
});

test('A6-④ 尾层素材与 DOM 序契约（z 序低于本体＋新素材在位）', () => {
  // DOM 序即视觉序：尾层 img 在本体 img 之前（E65e 铁律——尾根藏身体后）
  const iTail = HOME.indexOf('className="ks-fam-tail"');
  const iBody = HOME.indexOf('className="ks-fam-img"');
  assert.ok(iTail > -1 && iBody > -1 && iTail < iBody, '尾层须居本体之前（z 序低于本体）');
  // 新素材 WebP 在位（942×460 横构图；旧 720×1156 竖构图退役）
  assert.ok(existsSync(path.join(REPO, 'web/src/assets/familiar_milo_tail.webp')), 'Milo 新尾 WebP 须在位');
  assert.ok(existsSync(path.join(REPO, 'web/src/assets/familiar_sophia_tail.webp')), 'Sophia 新尾 WebP 须在位');
  assert.ok(existsSync(path.join(REPO, 'scripts/e153-p3-verify.mjs')), 'P3 真页验真脚本须在位（双视口×双朝向×六语）');
});
