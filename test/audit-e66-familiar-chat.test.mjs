/**
 * audit-e66-familiar-chat.test.mjs —— 灵魂兽对话引擎闸门（E66 · 主公军令 2026-10-18）
 * ═══════════════════════════════════════════════════════════════════════════
 * 覆盖三线（源码级 + 六语资产级，不烧算力、不连外网）：
 *   A. 六语 i18n 对齐：familiar.chat* 16 键 × 6 语，一一在场且非空；
 *   B. 后端 /api/familiar/chat 骨架：Gemini 流式主通道 + DeepSeek 降级 + 三层
 *      System Prompt（人设/本命底牌/今日运势）+ 输出铁律 + 门控 fail-closed
 *      （401/402 在 SSE header 之前）+ 算力防盗刷（日上限/最小间隔/断连 abort）；
 *   C. 前端抽屉舱：移动端 55vh 半屏 + 桌面端右下角 420px 悬浮舱（E68）、90ms 节流、
 *      麦克风语音槽位、零路由跳转（portal 而非 navigate）。
 * 🔴 纪律：新增段随 test:astro 全量入编；不触碰既有 56 段真值锁（纯增量文件）。
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const LANGS = ['zh', 'en', 'es', 'fr', 'th', 'vi'];

const CHAT_KEYS = [
  'chatCta', 'chatStatus', 'chatHello', 'chatHelloPlain', 'chatClose',
  'chatPlaceholder', 'chatSend', 'chatThinking', 'chatMicSoon',
  'chatNetErr', 'chatNeedLogin', 'chatNeedUnlock', 'chatTooFast',
  'chatQ1', 'chatQ2', 'chatQ3',
];

test('E66 A1 六语 familiar.chat* 16 键全部在场且非空（军令：六语对齐）', () => {
  for (const l of LANGS) {
    const o = JSON.parse(read(`web/src/i18n/locales/${l}.json`));
    assert.ok(o.familiar, `${l}.json 缺 familiar 命名空间`);
    for (const k of CHAT_KEYS) {
      assert.ok(typeof o.familiar[k] === 'string' && o.familiar[k].length > 0,
        `${l}.json 缺 familiar.${k} 或为空`);
    }
  }
});

test('E66 A2 占位符契约：chatStatus 带 {{name}}；chatHello 带 {{color}} 与 {{num}}', () => {
  for (const l of LANGS) {
    const o = JSON.parse(read(`web/src/i18n/locales/${l}.json`));
    assert.ok(o.familiar.chatStatus.includes('{{name}}'), `${l} chatStatus 缺 {{name}}`);
    assert.ok(o.familiar.chatHello.includes('{{color}}') && o.familiar.chatHello.includes('{{num}}'),
      `${l} chatHello 缺运势插值`);
  }
});

test('E66 B1 后端端点骨架：/api/familiar/chat + Gemini 流式主通道 + DeepSeek 降级', () => {
  const s = read('server.js');
  assert.ok(s.includes("'/api/familiar/chat'") || s.includes('"/api/familiar/chat"'), '缺 /api/familiar/chat 端点');
  assert.ok(s.includes('streamFamiliarChatGemini'), '缺 Gemini 流式函数');
  assert.ok(s.includes('streamGenerateContent?alt=sse'), '缺 Gemini alt=sse 流式调用');
  assert.ok(s.includes('streamFamiliarChatDeepSeek'), '缺 DeepSeek 降级通道');
  const epIdx = s.indexOf("app.post('/api/familiar/chat'");
  assert.ok(epIdx > -1, '缺端点注册');
  const epBody = s.slice(epIdx, epIdx + 8000);
  assert.ok(epBody.includes('streamFamiliarChatDeepSeek'), '端点内缺降级调用');
  assert.ok(/降级|fallback/.test(epBody), '端点内缺降级注释/逻辑');
});

test('E66 B2 三层 System Prompt 动态装配（人设 / 本命底牌 / 今日运势）', () => {
  const s = read('server.js');
  assert.ok(s.includes('FAMILIAR_CHAT_PERSONA'), '缺灵魂兽人设层');
  assert.ok(s.includes('Milo') && s.includes('Sophia'), '人设层缺双 IP');
  assert.ok(s.includes('buildFamiliarChatSystemPrompt'), '缺 prompt 装配函数');
  assert.ok(s.includes('本命底牌'), '缺本命底牌层');
  assert.ok(s.includes('dailyFortune'), '缺今日运势层（dailyFortune 真值核）');
  assert.ok(s.includes('getAstroMatrix'), '缺星历引擎真值');
  assert.ok(s.includes('60~120'), '缺输出字数铁律');
});

test('E66 B3 门控 fail-closed + 算力防盗刷（401/402 先于 SSE header；日上限；断连 abort）', () => {
  const s = read('server.js');
  const seg = s.slice(s.indexOf('resolveFamiliarChatAuth'));
  assert.ok(seg.includes('NO_TOKEN') && seg.includes('NO_ENTITLEMENT'), '缺门控失败码');
  assert.ok(seg.includes('httpStatus: 401') && seg.includes('httpStatus: 402'), '缺 401/402 分级');
  assert.ok(seg.includes('FAMILIAR_CHAT_DAILY_CAP'), '缺日上限');
  assert.ok(seg.includes('FAMILIAR_CHAT_MIN_GAP_MS'), '缺最小间隔');
  assert.ok(seg.includes('ctrl.abort'), '缺客户端断连 abort 上游（防烧钱）');
  // 402/401 必须在 SSE header 之前返回：端点体内门控代码先于 text/event-stream
  const epIdx = s.indexOf("app.post('/api/familiar/chat'");
  const epBody = s.slice(epIdx, epIdx + 6000);
  const authIdx = epBody.indexOf('resolveFamiliarChatAuth');
  const sseIdx = epBody.indexOf('text/event-stream');
  assert.ok(authIdx > -1 && sseIdx > -1 && authIdx < sseIdx, '门控必须先于 SSE header（防 402 被流吞）');
});

test('E66 C1 前端抽屉舱：CTA 衔接 + 90ms 节流 + 语音槽位 + 零路由跳转', () => {
  const sheet = read('web/src/components/FamiliarChatSheet.tsx');
  assert.ok(sheet.includes('THROTTLE_MS = 90'), '缺 90ms 节流');
  assert.ok(sheet.includes('ks-chat-mic'), '缺麦克风语音槽位');
  assert.ok(sheet.includes('chatMicSoon'), '缺语音槽位占位文案');
  assert.ok(sheet.includes('createPortal'), '应以 portal 挂载（零路由跳转）');
  assert.ok(sheet.includes('onTouchEnd'), '缺下滑手势收起');
  assert.ok(!/navigate\(/.test(sheet), '抽屉舱严禁路由跳转');
  // E68 军令①：输入栏独立微组件 —— 打字 state 局部化，禁触发对话流重渲染
  assert.ok(sheet.includes('ChatInputBar') && sheet.includes('React.memo'), 'E68 输入栏未拆独立微组件');
  assert.ok(sheet.includes('isComposing'), 'E68 缺中文输入法组词回车保护');
  const card = read('web/src/components/FamiliarHomeCard.tsx');
  assert.ok(card.includes('FamiliarChatSheet'), '首页卡未接入抽屉舱');
  assert.ok(card.includes('familiar-chat-cta'), '缺气泡 CTA 衔接入口');
  const css = read('web/src/App.css');
  assert.ok(css.includes('.ks-chat-sheet'), '缺抽屉舱样式');
  // E68 军令②：移动端 55vh；桌面端右下角 420px 悬浮舱（768px 断点），背景视频透出
  assert.ok(css.includes('55vh'), '移动端抽屉高度应为 55vh（E68 军令②）');
  assert.ok(css.includes('min-width: 768px'), '缺桌面端断点（E68 悬浮舱分流）');
  assert.ok(css.includes('420px'), '桌面端悬浮舱宽度应为 420px（E68 军令②）');
  assert.ok(css.includes('contain: content'), '缺渲染隔离（E68 军令①）');
  assert.ok(css.includes('backdrop-filter'), '缺毛玻璃');
  // E70：药丸行必须换行完整显示（旧横滚方案在真机无滚动提示 ⇒ 第三条被裁半截）
  assert.ok(/\.ks-chat-pills\s*\{[^}]*flex-wrap:\s*wrap/.test(css), 'E70 药丸行必须 flex-wrap: wrap');
  assert.ok(!/\.ks-chat-pills\s*\{[^}]*overflow-x:\s*auto/.test(css), 'E70 药丸行禁横向滚动裁切');
  assert.ok(/\.ks-chat-pill\s*\{[^}]*max-width:\s*100%/.test(css), 'E70 单颗药丸须限宽 max-width: 100%');
  // E71：运势气泡避让中央标题（双距 44px）＋ 手绘漫画尖角（双 Tail 双层三角）
  assert.ok(/\.ks-fam-bubble\s*\{[^}]*margin-left:\s*44px/.test(css), 'E71 Milo 气泡须右移（margin-left 44px）');
  assert.ok(/\.ks-fam-sophia \.ks-fam-bubble\s*\{[^}]*margin-right:\s*44px/.test(css), 'E71 Sophia 气泡须左移（margin-right 44px）');
  assert.ok(/\.ks-fam-bubble::after[^}]*border-right:\s*15px/.test(css), 'E71 缺 Milo 左下尖角（金边外层三角）');
  assert.ok(/\.ks-fam-sophia \.ks-fam-bubble::after[^}]*border-left:\s*15px/.test(css), 'E71 缺 Sophia 右下尖角（金边外层三角）');
  assert.ok(/\.ks-fam-bubble::before[\s\S]{0,200}border-right:\s*13px/.test(css), 'E71 缺 Milo 尖角内层底色三角');
  assert.ok(/\.ks-fam-sophia \.ks-fam-bubble::before[\s\S]{0,200}border-left:\s*13px/.test(css), 'E71 缺 Sophia 尖角内层底色三角');
  // E71c：.input-page 严禁非 visible 溢出值 —— 非 visible 纵向值会把横向轴强制成裁切容器，
  // 真页 A/B 实锤把 44px 位移后的运势气泡横向裁切（390 屏 18/11px，1440 桌面 17/9px）
  const inputPageRule = (css.match(/\.input-page\s*\{([^}]*)\}/) || [])[1] || '';
  assert.ok(inputPageRule.length > 0, 'E71c 缺 .input-page 规则');
  assert.ok(!/overflow/.test(inputPageRule), 'E71c .input-page 规则块内禁任何溢出裁切值（气泡会被页盒横向裁切）');
});

test('E69 截断修复：finishReason 留痕 + 断点续写 + 句子完整性守卫', () => {
  const s = read('server.js');
  // ① finishReason 追踪：非 STOP 收流必须留痕（SAFETY/RECITATION 砍半截正文）
  assert.ok(s.includes('lastFinish'), '流式解析未追踪 finishReason');
  assert.ok(s.includes("finishReason=${lastFinish}"), '非 STOP finishReason 缺日志留痕');
  // ② 断点续写器：半句回填为 model 轮次 + user 续写指令（六语 hint）
  assert.ok(s.includes('tryContinue'), '缺断点续写器 tryContinue');
  assert.ok(s.includes("{ role: 'assistant', content: partial }"), '续写须把半句回填为 model 轮次');
  assert.ok(s.includes('E69_CONTINUE_HINT'), '缺六语续写指令表');
  assert.ok(s.includes('E69_CONTINUE_HINT[lang]'), '续写指令须按 lang 取用');
  // ③ 句子完整性守卫：正文不以终止符收尾 ⇒ 续写一次
  assert.ok(s.includes('_e69IsCompleteSentence'), '缺句子完整性守卫函数');
  assert.ok(s.includes('!_e69IsCompleteSentence(text)'), '端点未挂完整性守卫');
  // ④ 流中断于半句（text 非空）必须走续写，禁止直接 done（E69 病根直塞）
  assert.ok(s.includes('流中断于半句'), '缺「流中断于半句」续写分支');
  // ⑤ 续写指令六语齐全（zh/en/es/fr/th/vi）
  for (const lg of ['zh', 'en', 'es', 'fr', 'th', 'vi']) {
    assert.ok(new RegExp(`^  ${lg}: ` + "'" , 'm').test(s) || s.includes(`  ${lg}: `), `续写指令缺语种 ${lg}`);
  }
});
