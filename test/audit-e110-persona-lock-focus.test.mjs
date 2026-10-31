// ═══ E110 闸门：四象人格绝对硬锁 · 外貌真值防穿帮 · 输入框焦点保活 ═══
// 主公军令（2026-10-31 实锤截图三病灶）：
// 刀一 人格漂移穿帮——实锤根因：FAMILIAR_CHAT_PERSONA 旧版把「灵魂伴侣级闺蜜」
//      「深曜紫玉矿石外壳」写死在 persona ⇒ girlfriend 模式直接灌进 prompt，
//      模型顺嘴「贴心闺蜜」＋迎合运势色胡编「深曜紫」。修正：persona 只留性格，
//      身份/外貌移交 FAMILIAR_PERSONA_LOCK 四象锁（relation_mode 决定唯一身份与
//      唯一外形，《Milo & Sophia 参数总账》钦定：girlfriend 樱花粉·暮光玫瑰金
//      #F4B8CE/#E8C79A、bestie 薄荷绿·蜜桃粉、boyfriend 曜石黑·香槟金、
//      buddy 玄武岩暗紫晶·绿瞳）＋身份硬锁（禁他象称谓）＋禁圆场台词；
// 刀二 relation_mode 入参守卫——端点白名单 400（BAD_RELATION_MODE），
//      严禁默认回退；mode 显式传入 prompt 构造器；
// 刀三 输入框焦点保活——ChatInputBar 发送后立即 focus()；流式期间只置灰发送
//      按钮防连击，input 绝不 disabled（disabled 强制移焦）；流式收尾兜底 refocus；
// 刀四 军规链 84 → 85 段（e110 居 e109 后、e40 前）。
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const SERVER = read('server.js');
const SHEET = read('web/src/components/FamiliarChatSheet.tsx');
const PKG = JSON.parse(read('package.json'));

// ── VM 抽取（e109 同法：花括号配平搬运；const 对象段吃尾 `)`/`;`——E108 教训）──
function sliceBraced(src, marker, skipParams = false) {
  const i = src.indexOf(marker);
  assert.ok(i !== -1, `源码段缺失：${marker}`);
  // skipParams：解构参数签名 `({...}) {` ⇒ 跳过参数列表再定位函数体 `{`
  const scanFrom = skipParams ? src.indexOf(')', i) : i;
  assert.ok(scanFrom !== -1, `参数列表定位失败：${marker}`);
  let depth = 0, started = false, end = -1;
  for (let j = src.indexOf('{', scanFrom); j < src.length; j++) {
    if (src[j] === '{') { depth++; started = true; }
    else if (src[j] === '}') { depth--; if (started && depth === 0) { end = j; break; } }
  }
  assert.ok(end !== -1, `花括号配平失败：${marker}`);
  let e = end + 1;
  while (src[e] === ')' || src[e] === ';') e++;
  return src.slice(i, e);
}

// 四依赖常量＋prompt 构造器整函数搬运（e100 VM 抽取式消费者铁律；
// buildFamiliarChatSystemPrompt 为解构参数签名 ⇒ skipParams 跳参定位函数体）
const PERSONA_SRC = sliceBraced(SERVER, 'const FAMILIAR_CHAT_PERSONA =');
const LOCK_SRC = sliceBraced(SERVER, 'const FAMILIAR_PERSONA_LOCK =');
const SIGNZH_SRC = sliceBraced(SERVER, 'const FAM_SIGN_ZH =');
const LANGNAME_SRC = sliceBraced(SERVER, 'const FAM_LANG_NAME =');
const PROMPTFN_SRC = sliceBraced(SERVER, 'function buildFamiliarChatSystemPrompt(', true);
const vmFactory = new Function(
  `${PERSONA_SRC}\n${LOCK_SRC}\n${SIGNZH_SRC}\n${LANGNAME_SRC}\n${PROMPTFN_SRC}\nreturn buildFamiliarChatSystemPrompt;`
);
const buildPrompt = vmFactory();

// 基础调用载荷（natal 传空形状走「显式缺席」分支——构造器读 natal.sun，禁 null 直喂）
const EMPTY_NATAL = { sun: null, moon: null, asc: null, venus: null, mars: null, source: 'none' };
const call = (mode, ip) => buildPrompt({
  ip: ip || 'Sophia', name: 'Sophia', lang: 'zh', mode,
  natal: EMPTY_NATAL, fortune: null, tarot: null, trine: null,
});

// ═══════════════ 刀一 · 四象人设硬锁与外貌真值 ═══════════════

test('①-1 persona 身份/外貌剥离实锤（「闺蜜」「深曜紫」不再写死人设表）', () => {
  // persona 表只留性格（旧「灵魂伴侣级闺蜜」「深曜紫玉矿石外壳」全数剥离）
  assert.ok(!PERSONA_SRC.includes('闺蜜'), 'persona 仍含「闺蜜」（girlfriend 模式人设漂移根因未除）');
  assert.ok(!PERSONA_SRC.includes('深曜紫'), 'persona 仍含「深曜紫」（外貌穿帮根因未除）');
  assert.ok(!PERSONA_SRC.includes('铁哥们儿'), 'persona 仍含「铁哥们儿」（buddy 身份写死未剥离）');
  // 四象锁表齐备（军令钦定称谓）
  for (const role of ['善良女友', '贴心闺蜜', '帅气男友', '铁哥们儿']) {
    assert.ok(LOCK_SRC.includes(role), `四象锁缺称谓「${role}」`);
  }
  // 军令钦定配色真值
  assert.ok(LOCK_SRC.includes('樱花粉·暮光玫瑰金'), 'girlfriend 缺钦定配色「樱花粉·暮光玫瑰金」');
  assert.ok(LOCK_SRC.includes('#F4B8CE') && LOCK_SRC.includes('#E8C79A'), 'girlfriend 缺钦定色值 #F4B8CE/#E8C79A');
  assert.ok(LOCK_SRC.includes('薄荷绿·蜜桃粉'), 'bestie 缺钦定配色「薄荷绿·蜜桃粉」');
  assert.ok(LOCK_SRC.includes('曜石黑·香槟金'), 'boyfriend 缺钦定配色「曜石黑·香槟金」');
});

test('①-2 girlfriend 模式 prompt 行为级（军令验收门禁：含善良女友+樱花粉，不含闺蜜/深曜紫）', () => {
  const p = call('girlfriend', 'Sophia');
  // 钦定断言（军令验收原文）
  assert.ok(p.includes('善良女友'), 'girlfriend prompt 缺「善良女友」');
  assert.ok(p.includes('樱花粉·暮光玫瑰金'), 'girlfriend prompt 缺「樱花粉·暮光玫瑰金」');
  assert.ok(!p.includes('贴心闺蜜'), 'girlfriend prompt 出现「贴心闺蜜」（人设漂移穿帮）');
  assert.ok(!p.includes('深曜紫'), 'girlfriend prompt 出现「深曜紫」（外貌穿帮）');
  // 伴生断言：身份硬锁块＋禁圆场＋色值真源
  assert.ok(p.includes('【身份硬锁'), '缺身份硬锁块');
  assert.ok(p.includes('绝对禁止自称或暗示'), '缺他象称谓禁令');
  assert.ok(p.includes('含糊圆场台词'), '缺「禁圆场」铁律（不管当女友还是闺蜜）');
  assert.ok(p.includes('【外貌真值'), '缺外貌真值块');
  assert.ok(p.includes('#F4B8CE'), '外貌块缺主色 #F4B8CE');
  assert.ok(p.includes('晶石灵猫'), '外貌块缺种属「晶石灵猫」');
  assert.ok(p.includes('绝对禁止捏造任何其他颜色'), '缺颜色禁捏造令');
});

test('①-3 其余三象各锁各形（bestie/boyfriend/buddy 身份与配色互不串门）', () => {
  const bestie = call('bestie', 'Sophia');
  assert.ok(bestie.includes('贴心闺蜜') && bestie.includes('薄荷绿·蜜桃粉'), 'bestie 锁形缺失');
  assert.ok(!bestie.includes('善良女友'), 'bestie 串入 girlfriend 称谓');
  const boyfriend = call('boyfriend', 'Milo');
  assert.ok(boyfriend.includes('帅气男友') && boyfriend.includes('曜石黑·香槟金'), 'boyfriend 锁形缺失');
  assert.ok(!boyfriend.includes('铁哥们儿'), 'boyfriend 串入 buddy 称谓');
  const buddy = call('buddy', 'Milo');
  assert.ok(buddy.includes('铁哥们儿') && buddy.includes('玄武岩暗紫晶'), 'buddy 锁形缺失（总账真源外壳）');
  assert.ok(!buddy.includes('善良女友'), 'buddy 串入 girlfriend 称谓');
  // mode 缺省 fallback girlfriend（构造器内部兜底，端点已 400 拦截空 mode）
  const fb = call(undefined);
  assert.ok(fb.includes('善良女友'), 'mode 缺省未 fallback girlfriend');
});

test('①-4 persona 性格真源保留（剥离身份不丢陪伴温度；六语名表仍接线）', () => {
  assert.ok(PERSONA_SRC.includes('温柔细腻'), 'Sophia 性格真源丢失');
  assert.ok(PERSONA_SRC.includes('沉稳仗义'), 'Milo 性格真源丢失');
  const p = call('girlfriend', 'Sophia');
  assert.ok(p.includes('温柔细腻'), 'prompt 丢 Sophia 性格');
  assert.ok(p.includes('简体中文'), '缺回复语种锁（FAM_LANG_NAME）');
});

// ═══════════════ 刀二 · relation_mode 入参守卫（严禁默认回退）═══════════════

test('②-1 端点 mode 白名单 400（BAD_RELATION_MODE；mode 显式入构造器）', () => {
  const guard = "if (!FAMILIAR_RELATION_MODES.has(mode)) {";
  assert.ok(SERVER.includes(guard), '端点缺 mode 白名单校验（严禁默认回退）');
  const seg400 = SERVER.split(guard)[1]?.split('const ip =')[0] || '';
  assert.ok(seg400.includes('BAD_RELATION_MODE'), '缺 BAD_RELATION_MODE 400 拒发');
  // mode 显式传入 prompt 构造器（人设锁消费面）
  assert.ok(SERVER.includes('ip, name, lang, mode, natal: truth.natal,'), '构造器未收 mode 参数');
  // 前端透传既有通道保全（body.relationMode ← rec.profile.relation_mode）
  assert.ok(SHEET.includes('relationMode,'), '前端 body 缺 relationMode 随行键');
});

// ═══════════════ 刀三 · 输入框焦点保活 ═══════════════

test('③-1 ChatInputBar 焦点保活（input 无 disabled；发送后 focus；流式收尾兜底）', () => {
  const barSeg = SHEET.split('const ChatInputBar')[1]?.split('const MemoChatInputBar')[0] || '';
  assert.ok(barSeg.length > 0, 'ChatInputBar 组件段切分失败');
  // ① input 元素绝无 disabled（disabled 会强制移焦——病灶实锤）
  const inputSeg = barSeg.split('<input')[1]?.split('/>')[0] || '';
  assert.ok(inputSeg.length > 0, '<input> 元素切分失败');
  assert.ok(!/\bdisabled\b/.test(inputSeg), 'input 残留 disabled（流式移焦根因未除）');
  assert.ok(inputSeg.includes('ref={inputRef}'), 'input 未挂 ref（focus 保活锚点缺失）');
  // ② 发送后立即回焦
  assert.ok(barSeg.includes("inputRef.current?.focus();"), 'submit 后缺 focus() 保活');
  const submitSeg = barSeg.split('const submit =')[1]?.split('return (')[0] || '';
  assert.ok(submitSeg.includes("inputRef.current?.focus();"), 'focus 不在 submit 成功路径内');
  // ③ 流式收尾兜底 refocus（仅 true→false 转变时触发，防移动端键盘误弹）
  const wasSeg = barSeg.split('useEffect(() => {')[1]?.split('}, [streaming]);')[0] || '';
  assert.ok(wasSeg.includes('wasStreamingRef.current && !streaming'), '缺 wasStreaming 转变守卫');
  assert.ok(wasSeg.includes("inputRef.current?.focus();"), '流式收尾缺兜底 refocus');
  // ④ 发送按钮防连击保留（只置灰按钮，不碰输入框）
  assert.ok(barSeg.includes('disabled={streaming || !text.trim()}'), '发送按钮防连击置灰被误拔');
});

// ═══════════════ 刀四 · 军规链入编（84 → 85 段）═══════════════

test('④-1 军规链段数入编（E110 后继化：85 段／e110 居 e109 前、e40 前）', () => {
  const segs = PKG.scripts['test:astro'].split('&&').map((s) => s.trim()).filter(Boolean);
  assert.equal(segs.length, 85, `军规链段数异常（实得 ${segs.length}，基线 85（E110 升 85 段））`);
  assert.ok(segs[segs.length - 1].includes('audit_v492_peak_window.py'), 'python 恒链尾被破');
  assert.ok(segs[segs.length - 2].includes('audit-e40-compat'), 'e40-compat 恒 len-2 被破');
  assert.ok(segs[segs.length - 3].includes('audit-e110'), 'e110 须居 len-3（e40 前）');
  assert.ok(segs[segs.length - 4].includes('audit-e109'), 'e109 须居 len-4（e110 后）');
  assert.ok(segs[segs.length - 5].includes('audit-e108'), 'e108 须居 len-5');
});
