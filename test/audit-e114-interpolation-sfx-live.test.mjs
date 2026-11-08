/**
 * audit-e114-interpolation-sfx-live.test.mjs —— E114 军令闸门
 * ═══════════════════════════════════════════════════════════════════════════
 * 【军令 E114：卡牌 AST 动态插值洗脱硬编码 · 动效声画合一 · Milo 痞坏神态与吐字共鸣】
 * 五刀八段（源码级＋逻辑核行为级＋六语资产级，不烧算力、不连外网）：
 *   刀一（S1~S3）：六语首语 {{tarotCard}}/{{trinePattern}} 占位符洗脱硬编码
 *     《恋人》＋牌名单源迁 tarotNames.mjs＋greetingTruth.mjs 真值查表行为级。
 *   刀二（S4）：Sophia 双耳独立摇摆层（clip-path 同源帧复制 ±8deg）＋宝石
 *     高光扩散脉冲层（radial-gradient＋screen 混合 48px 半径）。
 *   刀三（S5）：Milo 痞坏神态强化（-4px/3.5deg/skewX）＋气泡 22px 斜上漂
 *     50px 末端 scale(1.25) 爆裂 5 金尘。
 *   刀四（S6）：familiarSfx.ts Web Audio 纯合成（528/852Hz 晶鸣＋吐泡「啵」；
 *     master 0.15 锁；SSR/无 DOM 静默兜底）＋idle 触发伴音接线。
 *   刀五（S7）：SSE 吐字共鸣姿态（streaming 上行 .ks-fam-live——双耳前倾/
 *     宝石 4Hz/尾梢打拍/摇尾 1.8s/头顶金尘）＋平滑回落。
 *   S8：链位自保（e113 后、e40-compat 前；全链 88→89 段；i18n familiar
 *     59 键不变——占位符换血不加键）。
 * 🔴 纪律：e100/e103/e104 牌名真源读点、e97 双装配点、e111/e112/e113 气泡
 *    真值断言均已随 E114 后继化（tarotNames.mjs 单源/22px/50px/-41px）。
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const LANGS = ['zh', 'en', 'es', 'fr', 'th', 'vi'];

/* ═══════════ 刀一：六语首语动态插值洗脱硬编码 ═══════════ */

test('E114 S1 刀一模板洗脱：六语 chatHello/helloLoveCore 占位符在场＋零硬编码牌名/局名', () => {
  // 六语任何具体大牌名与三合木局旧串（E113 写死病根）一律禁入模板
  const BANNED = ['恋人', 'The Lovers', 'Los Enamorados', 'Les Amoureux', 'L\'Amoureux', 'คู่รัก', 'Tình Nhân',
    '三合木局', 'Wood Trine', 'Trino de Madera', 'Trine de Bois', 'ไตรภาคธาตุไม้', 'Tam Hợp Mộc Cục'];
  for (const l of LANGS) {
    const f = JSON.parse(read(`web/src/i18n/locales/${l}.json`)).familiar;
    assert.ok(f.chatHello.includes('{{tarotCard}}'), `${l} chatHello 缺 {{tarotCard}} 占位符`);
    assert.ok(f.helloLoveCore.includes('{{tarotCard}}') && f.helloLoveCore.includes('{{trinePattern}}'), `${l} helloLoveCore 缺 {{tarotCard}}/{{trinePattern}}`);
    for (const banned of BANNED) {
      assert.ok(!f.chatHello.includes(banned), `${l} chatHello 硬编码残留「${banned}」`);
      assert.ok(!f.helloLoveCore.includes(banned), `${l} helloLoveCore 硬编码残留「${banned}」`);
    }
    // e66 契约不破：禁 {{color}}/{{num}} 复读插值
    assert.ok(!f.chatHello.includes('{{color}}') && !f.chatHello.includes('{{num}}'), `${l} chatHello 禁运势复读插值`);
  }
});

test('E114 S2 刀一行为级：愚人/隐士模拟报告插值命中＋三合真值标签＋fail-closed 中性词', async () => {
  const G = await import(pathToFileURL(join(ROOT, 'web/src/lib/greetingTruth.mjs')).href);
  const zh = JSON.parse(read('web/src/i18n/locales/zh.json')).familiar;
  const en = JSON.parse(read('web/src/i18n/locales/en.json')).familiar;
  const render = (tpl, vars) => tpl.replace('{{tarotCard}}', vars.tarotCard).replace('{{trinePattern}}', vars.trinePattern);

  // ① 军令钦定对验：《愚人》(id 0) 与《隐士》(id 9) 模拟报告 ⇒ 首语分别命中
  const fool = G.resolveHelloVars('zh', { tarotId: 0, trineKey: '木' });
  assert.equal(fool.tarotCard, '愚人', 'id 0 ⇒ 愚人（查表失败）');
  assert.ok(render(zh.helloLoveCore, fool).includes('《愚人》牌与三合木局'), '愚人报告 ⇒ 首语须命中《愚人》（主公实锤场景）');
  const hermit = G.resolveHelloVars('zh', { tarotId: 9, trineKey: '木' });
  assert.equal(hermit.tarotCard, '隐士', 'id 9 ⇒ 隐士（查表失败）');
  assert.ok(render(zh.helloLoveCore, hermit).includes('《隐士》牌与三合木局'), '隐士报告 ⇒ 首语须命中《隐士》');
  // ② 六语查表（隐士 en）＋世界牌兜底口径
  assert.equal(G.resolveHelloVars('en', { tarotId: 9, trineKey: null }).tarotCard, 'The Hermit', 'en id 9 ⇒ The Hermit');
  assert.equal(G.resolveHelloVars('zh', { tarotId: 21, trineKey: null }).tarotCard, '世界', 'id 21 ⇒ 世界');
  // ③ 三合真值标签（SANHE_ 对接）：木/水六语；LIUHE ⇒ 天干六合
  assert.equal(G.resolveHelloVars('zh', { tarotId: null, trineKey: '木' }).trinePattern, '三合木局', '木 ⇒ 三合木局');
  assert.equal(G.resolveHelloVars('zh', { tarotId: null, trineKey: '水' }).trinePattern, '三合水局', '水 ⇒ 三合水局');
  assert.equal(G.resolveHelloVars('en', { tarotId: null, trineKey: '木' }).trinePattern, 'Wood Trine', 'en 木 ⇒ Wood Trine');
  assert.equal(G.resolveHelloVars('zh', { tarotId: null, trineKey: 'LIUHE' }).trinePattern, '天干六合', 'LIUHE ⇒ 天干六合');
  // ④ fail-closed：无真值 ⇒ 中性词，绝不臆造具体牌名/局名（E109 幽灵血训）
  const neutral = G.resolveHelloVars('zh', { tarotId: null, trineKey: null });
  for (const banned of ['恋人', '愚人', '隐士', '世界', '三合木局', '三合火局']) {
    assert.ok(!neutral.tarotCard.includes(banned) && !neutral.trinePattern.includes(banned), `中性词严禁臆造「${banned}」`);
  }
  assert.ok(neutral.tarotCard.length > 0 && neutral.trinePattern.length > 0, '中性词须非空（占位符不裸奔）');
  // ⑤ 真源读取（内存 store 模拟）：sessionStorage 塔罗档 → keyAspects 兜底 → null
  const mk = (init) => {
    const m = new Map(Object.entries(init || {}));
    return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: (k) => { m.delete(k); }, _m: m };
  };
  const ss = mk({ ks_compat_report_tarot: JSON.stringify({ id: 9, isReversed: false }) });
  assert.equal(G.readReportTarotId(ss), 9, 'sessionStorage 塔罗档读取失败');
  assert.equal(G.readReportTarotId(mk({ ks_compat_report_tarot: '{oops' })), null, '坏塔罗档 ⇒ null（fail-soft）');
  assert.equal(G.readReportTarotId(mk({ ks_compat_report_tarot: JSON.stringify({ id: 99 }) })), null, '非法 id ⇒ null');
  const ls = mk({ soul_recent_unlocked_report: JSON.stringify({ category: 'love', tier: 'core', title: '姻缘核心合盘报告', keyAspects: { tarotId: 9, tarotReversed: false, overall: 88 }, unlockedAt: 1770000000000 }) });
  assert.equal(G.readRecentTarotId(ls), 9, 'keyAspects.tarotId 兜底链读取失败');
  assert.equal(G.readRecentTarotId(mk({})), null, '无最近报告 ⇒ null');
  // ⑥ 三合真源（ks_result bazi meta）
  const rs = mk({ ks_result: JSON.stringify({ engines: { bazi: { meta: ['SANHE_木'] } } }) });
  assert.equal(G.readTrineKey(rs), '木', 'SANHE_木 ⇒ 木');
  const rl = mk({ ks_result: JSON.stringify({ engines: { bazi: { meta: ['LIUHE_DAY_STEM'] } } }) });
  assert.equal(G.readTrineKey(rl), 'LIUHE', 'LIUHE_DAY_STEM ⇒ LIUHE');
  assert.equal(G.readTrineKey(mk({})), null, '无报告 ⇒ null');
  const rs2 = mk({ ks_result: JSON.stringify({ engines: { bazi: { meta: ['SANHE_火'] } } }) });
  assert.equal(G.readTrineKey(rs2), '火', 'SANHE_火 ⇒ 火');
});

test('E114 S3 刀一单源与接线：牌名表迁 tarotNames.mjs（tarot.ts 零复制）＋ChatSheet 插值装配', () => {
  const tarotTs = read('web/src/lib/tarot.ts');
  const names = read('web/src/lib/tarotNames.mjs');
  const sheet = read('web/src/components/FamiliarChatSheet.tsx');
  // ① 单源：tarot.ts 不再持有牌名表（零复制铁律）且 import 单源查表
  assert.ok(!/name:\{zh:'/.test(tarotTs), 'tarot.ts 禁残留内联牌名表（单源铁律）');
  assert.ok(tarotTs.includes("import { tarotCardName } from './tarotNames.mjs'"), 'tarot.ts 须 import 单源查表');
  assert.equal((tarotTs.match(/orientation: \(ORIENT_SUFFIX\[L\] \|\| ORIENT_SUFFIX\['en'\]\)\(reversed, name\)/g) || []).length, 2, '双装配点须走查表 name（getTarot＋getWealthTarot）');
  // ② 单源表形状：22 条 × 六语字段
  assert.equal((names.match(/\{id:\d+, name:\{zh:/g) || []).length, 22, 'tarotNames.mjs 须恰 22 张大牌');
  for (const lc of LANGS) {
    const n = (names.match(new RegExp(`${lc}:'[^']*'`, 'g')) || []).length;
    assert.ok(n >= 22, `tarotNames.mjs ${lc} 字段须覆盖 22 张（实为 ${n}）`);
  }
  // ③ ChatSheet 接线：真值核 import＋helloTruthRef 锚＋插值装配
  for (const fn of ['readReportTarotId', 'readRecentTarotId', 'readTrineKey', 'resolveHelloVars']) {
    assert.ok(sheet.includes(fn), `ChatSheet 缺 ${fn} 接线`);
  }
  assert.ok(sheet.includes('helloTruthRef'), '缺首语真值锚 helloTruthRef');
  assert.ok(/t\('familiar\.helloLoveCore', vars\(\)\)/.test(sheet), 'love_core 须 greetingVars 插值装配');
  assert.ok(/t\('familiar\.chatHello', \{ tarotCard: vars\(\)\.tarotCard \}\)/.test(sheet), 'sweet 须 {{tarotCard}} 插值装配');
  assert.ok(/readReportTarotId\(sessionStorage\) \?\? readRecentTarotId\(store\)/.test(sheet), '真值链须 session 档优先→keyAspects 兜底');
});

/* ═══════════ 刀二：Sophia 双耳独立摇摆＋宝石高光扩散 ═══════════ */

test('E114 S4 刀二 Sophia：双耳 ±8deg 独立摇摆层＋宝石高光扩散脉冲层（48px·screen）', () => {
  const css = read('web/src/App.css');
  const card = read('web/src/components/FamiliarHomeCard.tsx');
  // ① 双耳层：本体同源帧 clip-path 复制（零新增资产）＋耳基 transform-origin
  assert.ok(/\.ks-fam-ears\s*\{[^}]*clip-path: inset\(0% 40% 84% 6%\)/.test(css), '缺双耳层 clip-path 裁剪（同源帧复制）');
  assert.ok(/\.ks-fam-ears\s*\{[^}]*transform-origin: 33% 16%/.test(css), '双耳层须耳基 transform-origin');
  assert.ok(/\.ks-fam-sophia\.ks-fam-idle \.ks-fam-ears\s*\{[^}]*animation: ksFamSophiaEars/.test(css), 'idle 须挂双耳摇摆动画');
  const ears = (css.match(/@keyframes ksFamSophiaEars \{[\s\S]*?\n\}/) || [''])[0];
  assert.ok(/rotate\(8deg\)/.test(ears) && /rotate\(-7deg\)/.test(ears), '双耳须 ±8deg 军令钦定振幅');
  assert.ok(/scaleY\(1\.05\)/.test(ears), '双耳须 scaleY(1.05)（军令钦定）');
  // ② 双耳层渲染（Sophia 专属、本体同源帧）
  assert.ok(/ip === 'Sophia' && \(\s*<img className="ks-fam-ears"/.test(card), '缺 Sophia 双耳层渲染（同源帧）');
  // ③ 宝石高光扩散脉冲层：radial-gradient＋screen 混合＋48px 半径（96px 层）
  assert.ok(/\.ks-fam-gempulse\s*\{[\s\S]{0,400}mix-blend-mode: screen/.test(css), 'gempulse 须 screen 混合（军令钦定）');
  assert.ok(/\.ks-fam-gempulse\s*\{[\s\S]{0,400}radial-gradient\(circle, rgba\(255, ?182, ?193, ?0\.95\) 0%, rgba\(244, ?184, ?206, ?0\.7\) 45%/.test(css), 'gempulse 须军令钦定径向渐变真值');
  assert.ok(/\.ks-fam-gempulse\s*\{[\s\S]{0,200}width: 96px/.test(css), 'gempulse 须 96px 层（48px 半径扩散）');
  const pulse = (css.match(/@keyframes ksFamGemPulse \{[\s\S]*?\n\}/) || [''])[0];
  assert.ok(/38%\s*\{[^}]*opacity: 0\.9/.test(pulse), 'gempulse 顶点须 38%（与踩奶拱背同步）');
  // ④ 渲染接线：idle 时 gempulse 在场
  assert.ok(/idleAct && ip === 'Sophia' && <span className="ks-fam-gempulse"/.test(card), '缺 gempulse 渲染接线');
});

/* ═══════════ 刀三：Milo 痞坏神态＋气泡物理参数跃升 ═══════════ */

test('E114 S5 刀三 Milo：痞坏神态强化＋气泡 22px 斜上漂 50px 末端 1.25 爆裂 5 金尘', () => {
  const css = read('web/src/App.css');
  const card = read('web/src/components/FamiliarHomeCard.tsx');
  // ① 痞坏神态强化：-4px 上扬＋3.5deg 侧倾＋skewX 歪嘴梗（军令「强化痞坏」）
  const smirk = (css.match(/@keyframes ksFamMiloSmirk \{[\s\S]*?\n\}/) || [''])[0];
  assert.ok(/translateY\(-4px\)/.test(smirk) && /rotate\(-3\.5deg\)/.test(smirk), 'smirk 须 -4px＋3.5deg 强化振幅');
  assert.ok(/skewX\(2deg\)/.test(smirk), 'smirk 须 skewX 歪嘴梗（嘴角上挑的最近真值形态）');
  // ② 气泡物理参数：22px 直径＋35° 倾角斜上漂 50px（dx28/dy-41）＋末端 1.25
  assert.ok(/\.ks-fam-pop\s*\{[^}]*width: 22px;[\s\S]{0,120}height: 22px/.test(css), '气泡须 22px（军令 14→22px）');
  const bub = (css.match(/@keyframes ksFamPopBub \{[\s\S]*?\n\}/) || [''])[0];
  assert.ok(/translate\(28px, -41px\)/.test(bub), '气泡须斜上漂 50px（军令 35° 倾角）');
  assert.ok(/scale\(1\.25\)/.test(bub), '末端须 scale(1.25) 轻盈膨胀（军令钦定）');
  // ③ 5 颗金色星尘（第 5 颗入列）＋破裂点随迁 -41px
  assert.ok(/\.ks-fam-pop-dust:nth-child\(6\)/.test(css), '第 5 颗金尘（nth-child(6)）缺失');
  assert.ok(/top: -41px;/.test(css), '金尘破裂点须随迁 -41px');
  const popStart = card.indexOf('className="ks-fam-pop"');
  const popSpan = card.slice(popStart, card.indexOf('</span>', popStart));
  assert.equal((popSpan.match(/ks-fam-pop-dust/g) || []).length, 5, 'JSX 须 5 个金尘元素');
  // ④ reduced-motion 降级守备扩展（gempulse/live-dust 静默）
  assert.ok(/\.ks-fam-gempulse, \.ks-fam-live-dust \{ display: none; \}/.test(css), 'reduced-motion 缺 E114 新层静默');
});

/* ═══════════ 刀四：Web Audio 原生空灵微音效 ═══════════ */

test('E114 S6 刀四音效：familiarSfx 纯合成（528/852＋0.15 锁＋SSR 兜底）＋idle 触发伴音接线', () => {
  const sfx = read('web/src/lib/familiarSfx.ts');
  const card = read('web/src/components/FamiliarHomeCard.tsx');
  // ① 双音色 API 在场
  assert.ok(/export function playSophiaPurrChime/.test(sfx), '缺 playSophiaPurrChime');
  assert.ok(/export function playMiloBubblePop/.test(sfx), '缺 playMiloBubblePop');
  // ② 军令钦定频率真值：528Hz＋852Hz 双正弦（Sophia）；300Hz 上扫频＋1200Hz 星尘（Milo）
  assert.ok(sfx.includes('[528, 852]'), 'Sophia 须 528/852Hz 双振荡器（军令钦定）');
  assert.ok(/frequency\.setValueAtTime\(300, t0\)/.test(sfx), 'Milo 须 300Hz 起扫频');
  assert.ok(sfx.includes('spark.frequency.value = 1200'), 'Milo 须 1200Hz 星尘碎裂音');
  // ③ 主音量 0.15 恒锁（军令安全约束）
  assert.ok(/MASTER_GAIN = 0\.15/.test(sfx), 'master gain 须恒锁 0.15');
  // ④ SSR/无 DOM 静默兜底（「AudioContext not defined」禁入终端与构建）
  assert.ok(sfx.includes("if (typeof window === 'undefined') return null"), '缺 SSR 守卫（node 构建环境兜底）');
  assert.ok((sfx.match(/try \{/g) || []).length >= 4, '合成全程须 try/catch 静默（音效永不抛错）');
  // ⑤ 解锁保活：首次交互 pointerdown/keydown 绑定
  assert.ok(/addEventListener\('pointerdown', unlock/.test(sfx) && /addEventListener\('keydown', unlock/.test(sfx), '缺首次交互解锁绑定');
  // ⑥ idle 触发伴音接线：IP 分流（Sophia 晶鸣/Milo 吐泡）
  assert.ok(/idleIpRef\.current === 'Milo'\) playMiloBubblePop\(\);\s*\n\s*else playSophiaPurrChime\(\);/.test(card), 'idle 触发须按 IP 分流伴音');
  assert.ok(/useEffect\(\(\) => \{ idleIpRef\.current = chatIp; \}, \[chatIp\]\);/.test(card), '缺 idleIpRef 随档刷新');
});

/* ═══════════ 刀五：SSE 吐字共鸣姿态（Streaming Sync） ═══════════ */

test('E114 S7 刀五吐字共鸣：streaming 上行 .ks-fam-live＋双姿态 CSS＋平滑回落', () => {
  const sheet = read('web/src/components/FamiliarChatSheet.tsx');
  const card = read('web/src/components/FamiliarHomeCard.tsx');
  const css = read('web/src/App.css');
  // ① ChatSheet 上行通道：prop＋effect（streaming 翻转即上报）
  assert.ok(/onStreamingChange\?: \(streaming: boolean\) => void;/.test(sheet), '缺 onStreamingChange prop 契约');
  assert.ok(/onStreamingChange\?\.\(streaming\);/.test(sheet), '缺 streaming 上报 effect');
  // ② HomeCard 接线：chatLive 状态＋breakout class＋prop 注入
  assert.ok(/const \[chatLive, setChatLive\] = useState\(false\);/.test(card), '缺 chatLive 状态');
  assert.ok(/\$\{chatLive \? ' ks-fam-live' : ''\}/.test(card), 'breakout 须挂 .ks-fam-live class');
  assert.ok(/onStreamingChange=\{setChatLive\}/.test(card), '缺 setChatLive 注入');
  // ③ Sophia 共鸣倾听态：双耳前倾＋宝石 4Hz（0.25s）＋尾梢 1.2s 打拍
  assert.ok(/\.ks-fam-sophia\.ks-fam-live \.ks-fam-ears\s*\{[^}]*animation: ksFamEarLean/.test(css), '缺双耳前倾（共鸣态）');
  assert.ok(/\.ks-fam-sophia\.ks-fam-live \.ks-fam-gemglow\s*\{[^}]*animation: ksFamGemLiveGlow 0\.25s/.test(css), '缺宝石 4Hz 呼吸微光（0.25s 周期）');
  assert.ok(/\.ks-fam-sophia\.ks-fam-live \.ks-fam-tail\s*\{[^}]*animation: ksFamTailTap 1\.2s/.test(css), '缺尾梢 1.2s 打拍');
  // ④ Milo 欢快分享态：摇尾 1.8s 周期＋头顶金尘
  assert.ok(/\.ks-fam-milo\.ks-fam-live \.ks-fam-tail\s*\{[^}]*animation: ksFamMiloLiveTail 1\.8s/.test(css), '缺摇尾 1.8s 周期（军令钦定）');
  assert.ok(/chatLive && ip === 'Milo' && \(\s*<span className="ks-fam-live-dust"/.test(card), '缺 Milo 头顶金尘渲染');
  assert.ok(/\.ks-fam-live-dust i:nth-child\(2\)/.test(css), '金尘须 2 颗错相位');
  // ⑤ 平滑回落：live 摘除后耳/尾层回正过渡（禁姿态突变卡帧）
  assert.ok(/\.ks-fam-tail, \.ks-fam-ears \{ transition: transform 0\.45s ease; \}/.test(css), '缺平滑回落 transition');
  // ⑥ reduced-motion 降级：live 姿态随降级静默
  assert.ok(/\.ks-fam-live \.ks-fam-ears,\s*\n\s*\.ks-fam-live \.ks-fam-tail \{ animation: none; \}/.test(css), 'reduced-motion 缺 live 姿态静默');
});

/* ═══════════ 链位自保＋段数基准 ═══════════ */

test('E114 S8 链位自保：e114 入编（e113 后、e40-compat 前；全链 88→89 段；i18n familiar 59 键不变）', () => {
  const pkg = JSON.parse(read('package.json'));
  const segs = pkg.scripts['test:astro'].split(' && ');
  const i114 = segs.findIndex((x) => x.includes('audit-e114-interpolation-sfx-live'));
  const i113 = segs.findIndex((x) => x.includes('audit-e113-idle-loop-session-daily'));
  const iCap = segs.findIndex((x) => x.includes('audit-e40-compat-synastry-tensor-fusion'));
  const iPy = segs.findIndex((x) => x.trim().startsWith('python3'));
  assert.notEqual(i114, -1, 'E114 闸门未挂入 test:astro（写好不接线 = 永不运行）');
  assert.ok(i113 < i114 && i114 < iCap, 'E114 须按序排在 e113 之后、收口位之前（E 版本序铁律）');
  assert.equal(iCap, segs.length - 2, `收口位漂移：e40-compat 应为 len-2（实为 ${iCap}/${segs.length}）`);
  assert.equal(iPy, segs.length - 1, 'python 峰值审计须恒为链尾');
  assert.equal(segs.length, 96, `军规链段数须为 92（E120 入编后 91→92；实为 ${segs.length}）`);
  // i18n familiar 段键数基准：59 键不变（E114 占位符换血不加键）
  for (const l of LANGS) {
    const o = JSON.parse(read(`web/src/i18n/locales/${l}.json`));
    assert.equal(Object.keys(o.familiar).length, 59, `${l} familiar 段须 59 键（E114 零新键）`);
  }
  // V448 i18n 全站基准：123 不变（无新键）
  const i18nGate = read('test/audit-i18n-keys.test.js');
  assert.ok(i18nGate.includes('assert.strictEqual(p.total, 123'), 'V448 全站键数基准 123 须保持（E114 零新键）');
});
