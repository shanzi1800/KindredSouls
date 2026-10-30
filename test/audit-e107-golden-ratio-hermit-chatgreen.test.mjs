// ═══ E107 闸门：测试先行 · 金卡神圣黄金比例＋韦特真图腾＋三阶动线＋聊天免登录绿道 ═══
// 主公军令（2026-10-31）：六问核验后的四大整改红脸前置——
// 刀一 宇宙金卡神圣黄金比例（1:1.618：逻辑 400×648 / 物理 1200×1944×dpr3）＋
//      韦特塔罗真矢量图腾库（隐士=兜帽斗篷长者+六角星明灯+木杖；严禁抽象几何占位符）；
// 刀二 首页灵宠三阶动线（点灵宠 ⇒ 中央「今日幸运卡片」⇒「与TA深度聊聊」才开舱；
//      E76 带路令牌改微光提示气泡，禁自动弹舱）；
// 刀三 /api/familiar/chat 免登录绿道彻底贯通（沙盒匿名直通 / 合法 ks_familiar 档放行 SSE；
//      上下文注入命盘真值：今日塔罗牌 + 本命三合局）；
// 刀四 军规链 81 → 82 段（e107 居 e106 后、e40 前）。
// 🔴 沿袭纪律：源码级计数闸门（i18n 基准 109→112；14 处段数 81→82 由各文件自行后继化）。
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const SERVER = read('server.js');
const PKG = JSON.parse(read('package.json'));
const HOME = read('web/src/components/FamiliarHomeCard.tsx');
const SHEET = read('web/src/components/FamiliarChatSheet.tsx');
const LUCK = read('web/src/components/FamiliarLuckCard.tsx');
const DRAW = read('web/src/lib/drawGoldCard.ts');
const LANGS = ['zh', 'en', 'fr', 'es', 'th', 'vi'];

const loadLayout = async () => import('../web/src/lib/goldCardLayout.mjs');
const loadTotems = async () => import('../web/src/lib/goldCardTotems.mjs');

// ═══════════════ 刀一 · 神圣黄金比例 ═══════════════

test('①-1 金卡画布黄金比例军令锚（逻辑 400×648 / 物理 1200×1944）', async () => {
  const { GOLD_CARD_LAYOUT: L } = await loadLayout();
  assert.equal(L.canvasWidth, 400, 'canvasWidth 须 400（军令钦定）');
  assert.equal(L.canvasHeight, 648, 'canvasHeight 须 648（军令钦定）');
  const ratio = L.canvasHeight / L.canvasWidth;
  assert.ok(ratio >= 1.615 && ratio <= 1.625,
    `逻辑宽高比 ${ratio.toFixed(4)} 越界（须 1.615~1.625，神圣黄金比例 1:1.618）`);
  assert.equal(L.exportPixelRatio, 3, '导出物理分辨率倍率须 3');
  const physW = L.canvasWidth * L.exportPixelRatio;
  const physH = L.canvasHeight * L.exportPixelRatio;
  assert.equal(physW, 1200, `物理宽须 1200（实得 ${physW}）`);
  assert.equal(physH, 1944, `物理高须 1944（实得 ${physH}）`);
  const physRatio = physH / physW;
  assert.ok(physRatio >= 1.615 && physRatio <= 1.625, '物理宽高比须同入黄金比例窗');
  assert.equal(L.safeZoneWidth, 320, 'safeZoneWidth 须 320（400*0.8）');
  assert.equal(L.centerX, 200, 'centerX 须 200');
});

// ═══════════════ 刀一 · 韦特塔罗真矢量图腾库 ═══════════════

test('②-1 图腾库完备性（22 张大阿卡纳全员真线稿，零缺位）', async () => {
  const { goldCardTotemSvg } = await loadTotems();
  for (let id = 0; id <= 21; id++) {
    const svg = goldCardTotemSvg(id);
    assert.ok(typeof svg === 'string' && svg.length > 400, `cardId=${id} 图腾缺位或过简（<400 字符）`);
    assert.ok(svg.includes('<svg'), `cardId=${id} 非 SVG 真源`);
    // 真线稿底线：≥6 条 path（抽象几何占位符糊弄 ⇒ 报红）
    const pathCount = (svg.match(/<path/g) || []).length;
    assert.ok(pathCount >= 6, `cardId=${id} 图腾 path 数 ${pathCount} < 6（占位符嫌疑）`);
  }
});

test('②-2 隐士真线稿（兜帽斗篷长者＋六角星明灯＋木杖——军令钦定三要素）', async () => {
  const { goldCardTotemSvg } = await loadTotems();
  const svg = goldCardTotemSvg(9);
  // 斗篷（兜帽长者身形闭环路径）
  assert.ok(svg.includes('id="hermit-cloak"'), '隐士缺兜帽斗篷标记 hermit-cloak');
  assert.ok(/M5\d\s*2[4-8][\s\S]*?Z/.test(svg), '隐士斗篷缺闭环身形路径');
  // 六角星明灯（真理之灯：两枚交叠三角）
  assert.ok(svg.includes('id="hermit-lantern"'), '隐士缺明灯标记 hermit-lantern');
  assert.ok(svg.includes('id="hermit-hexagram"'), '隐士缺六角星标记 hermit-hexagram');
  const triangles = (svg.match(/<path[^>]*hermit-hexagram[^>]*\/>|<g[^>]*hermit-hexagram[^>]*>[\s\S]*?<path[^>]*\/>[\s\S]*?<path[^>]*\/>/g) || []).length;
  assert.ok(triangles >= 1 || (svg.match(/<path/g) || []).length >= 10, '六角星明灯线稿缺双三角路径');
  // 修长木杖
  assert.ok(svg.includes('id="hermit-staff"'), '隐士缺木杖标记 hermit-staff');
  const staffSeg = svg.split('id="hermit-staff"')[1] || '';
  assert.ok(staffSeg.includes('<path'), '木杖标记下缺矢量路径');
  // 山坡衬底（韦特隐士雪山场景）
  assert.ok(/M(1[0-2]|[0-9])\s*1[0-2]\d/.test(svg), '隐士缺雪山衬底线稿');
});

test('②-3 金卡绘制接图腾库（卡面图腾与塔罗牌名严格对应）', async () => {
  // drawGoldCard 必须按 payload.cardId 分发图腾——世界牌花环恒直通的错位病根拔除
  assert.ok(DRAW.includes('goldCardTotem'), 'drawGoldCard 未接入图腾库（goldCardTotem*）');
  assert.ok(!DRAW.includes('worldCardDataUri'), 'drawGoldCard 残留世界牌恒直通通道 worldCardDataUri（E107 病根）');
  assert.ok(DRAW.includes('payload.cardId'), 'drawGoldCard 图腾分发未按 cardId');
  // 离线铁律沿袭：仅 data: 内联矢量
  const TOTEMS = read('web/src/lib/goldCardTotems.mjs');
  assert.ok(TOTEMS.includes('data:image/svg+xml'), '图腾库缺 data: URI 出口');
  assert.ok(!TOTEMS.includes('fetch('), '图腾库混入 fetch（违离线铁律）');
});

// ═══════════════ 刀二 · 首页灵宠三阶动线 ═══════════════

test('③-1 点灵宠 ⇒ 今日幸运卡片（不再直开对话舱）', async () => {
  assert.ok(HOME.includes('FamiliarLuckCard'), '首页未接幸运卡片组件');
  assert.ok(HOME.includes('setLuckCardOpen(true)'), '点灵宠未呼出今日幸运卡片');
  // tapFamiliar 内禁直接 setChatOpen(true)——开舱权只属幸运卡片 CTA
  const tapSeg = HOME.split('const tapFamiliar =')[1]?.split('}, []);')[0] || '';
  assert.ok(tapSeg.includes('setLuckCardOpen(true)'), 'tapFamiliar 缺幸运卡片呼出');
  assert.ok(!tapSeg.includes('setChatOpen(true)'), 'tapFamiliar 仍直开舱（三阶动线违例）');
});

test('③-2 E76 带路令牌改微光提示（回首页禁自动弹舱）', async () => {
  const e76Seg = HOME.split("sessionStorage.getItem('ks_open_familiar_chat')")[1]?.split('}, [rec]);')[0] || '';
  assert.ok(e76Seg.length > 0, 'E76 令牌消费点失踪');
  assert.ok(e76Seg.includes('showBubble') || e76Seg.includes('setFamPulse'), 'E76 未改微光提示（气泡/脉冲）');
  assert.ok(!e76Seg.includes('setChatOpen(true)'), 'E76 仍自动弹舱（军令刀二违例）');
});

test('③-3 幸运卡片三阶承接（幸运真值＋金卡缩略图＋深度聊天 CTA）', async () => {
  assert.ok(LUCK.includes('dailyFortune'), '幸运卡片未接 dailyFortune 真值核');
  assert.ok(LUCK.includes('goldCardTotem'), '幸运卡片缺金卡图腾缩略图');
  assert.ok(LUCK.includes('getWealthTarot'), '幸运卡片缺今日塔罗真源（getWealthTarot）');
  assert.ok(/chatDeepCta|onChat/.test(LUCK), '幸运卡片缺「与TA深度聊聊」CTA');
  // 幸运三宝：色/数字/能量微语
  assert.ok(/luckColor/.test(LUCK) && /luckyNumber/.test(LUCK) && /vibe/.test(LUCK), '幸运卡片缺幸运色/数字/能量微语');
});

test('③-4 i18n 三新键六语同步（luckCardTitle/luckVibe/chatDeepCta）', async () => {
  for (const l of LANGS) {
    const J = JSON.parse(read(`web/src/i18n/locales/${l}.json`));
    assert.ok(J.familiar && J.familiar.luckCardTitle, `${l} 缺 familiar.luckCardTitle`);
    assert.ok(J.familiar && J.familiar.luckVibe, `${l} 缺 familiar.luckVibe`);
    assert.ok(J.familiar && J.familiar.chatDeepCta, `${l} 缺 familiar.chatDeepCta`);
  }
});

// ═══════════════ 刀三 · 聊天免登录绿道彻底贯通 ═══════════════

test('④-1 服务端绿道（沙盒匿名直通＋合法灵宠档放行——NO_TOKEN 硬拦截拔除）', async () => {
  assert.ok(SERVER.includes('sandbox_green'), '缺沙盒匿名直通绿道（sandbox_green，E99 同构）');
  assert.ok(SERVER.includes('familiar_proof'), '缺合法灵宠档放行绿道（familiar_proof）');
  assert.ok(SERVER.includes('resolveFamiliarChatAuth(req, body)'), '权益门控未把 body 传入（灵宠档证明无从校验）');
  // 沙盒/灵宠档绿道必须在 resolveFamiliarChatAuth 内 NO_TOKEN 判死之前（按函数段量测，防全文误报）
  const fnSeg = SERVER.split('async function resolveFamiliarChatAuth')[1] || '';
  const fnBody = fnSeg.split('\nasync function')[0];
  const greenIdx = fnBody.indexOf('sandbox_green');
  const noTokenIdx = fnBody.indexOf("reason: 'NO_TOKEN'");
  assert.ok(greenIdx > 0 && noTokenIdx > greenIdx, '绿道不在 NO_TOKEN 判死之前（顺序违例）');
});

test('④-2 灵宠档校验 fail-closed（关系模式白名单＋chartSig 形状）', async () => {
  assert.ok(SERVER.includes('FAMILIAR_CHAT_RELATION_MODES'), '缺关系模式白名单（档守卫同源）');
  assert.ok(/CHART_SIG_RE|chartSig/i.test(SERVER), '缺 chartSig 形状校验');
});

test('④-3 上下文注入命盘真值（今日塔罗牌＋本命三合局）', async () => {
  assert.ok(SERVER.includes('今日塔罗真值'), 'system prompt 缺今日塔罗真值块');
  assert.ok(SERVER.includes('三合局真值'), 'system prompt 缺三合局真值块');
  assert.ok(SERVER.includes('goldCardChart'), '缺 goldCardChart 真源注入（干支/三合）');
});

test('④-4 前端零登录拦阻（无 token 亦发流——灵宠档随行证明）', async () => {
  // 客户端发流前的「无 token ⇒ 先登录」硬拦截必须拔除
  const noTokenGate = /if \(!token\) \{[\s\S]{0,220}chatNeedLogin/;
  assert.ok(!noTokenGate.test(SHEET), 'FamiliarChatSheet 残留客户端无 token 硬拦截（刀三病根）');
  assert.ok(SHEET.includes('familiar:'), '对话请求未随行灵宠档证明（body.familiar）');
  assert.ok(SHEET.includes('readFamiliarRecord'), '未用 readFamiliarRecord 形状守卫读档');
  // 401 映射保留（fail-closed 兜底不拆）
  assert.ok(SHEET.includes('401'), '缺 401 兜底映射（fail-closed 语义须保留）');
});

// ═══════════════ 刀四 · 军规链入编（81 → 82 段）═══════════════

test('⑤-1 军规链段数入编（E107 后继化：82 段／e107 居 e106 前、e40 前）', async () => {
  const segs = PKG.scripts['test:astro'].split('&&').map((s) => s.trim()).filter(Boolean);
  assert.equal(segs.length, 82, `军规链段数异常（实得 ${segs.length}，基线 82（E107 升 82 段））`);
  assert.ok(segs[segs.length - 1].includes('audit_v492_peak_window.py'), 'python 恒链尾被破');
  assert.ok(segs[segs.length - 2].includes('audit-e40-compat'), 'e40-compat 恒 len-2 被破');
  assert.ok(segs[segs.length - 3].includes('audit-e107'), 'e107 须居 len-3（e40 前）');
  assert.ok(segs[segs.length - 4].includes('audit-e106'), 'e106 须居 len-4（e107 后）');
  assert.ok(segs[segs.length - 5].includes('audit-e105'), 'e105 须居 len-5');
});
