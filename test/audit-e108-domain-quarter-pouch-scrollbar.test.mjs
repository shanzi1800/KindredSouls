// ═══ E108 闸门：域名防伪底栏＋年报四季历法规制＋贴身运势锦囊＋对话窗黑金滑轨 ═══
// 主公军令（2026-11-01，实机验收走查四问题）：
// 刀一 金卡底栏注入官方域名 kindredsouls.online（双层居中排版，社交分享流量回流）；
// 刀二 年报严格 12 月四季规制——根治第二章第4季度「7月-10月」历法算术溢出
//      （4 个月跨度＝窗口外第 13 月硬伤）：Prompt 季度区间硬约束（3a QUARTER
//      CALENDAR）＋输出侧季度溢出锁（HIT 复读 / onText 帧 / 终帧三接线）；
// 刀三 物理废除 E107 居中大 Modal「今日幸运卡片」⇒ 复活图 9 贴身伴随式
//      「今日运势锦囊」轻气泡（幸运数字/色/能量微语＋「与TA聊聊」胶囊开舱）；
// 刀四 对话窗右侧原生灰白滚动槽对齐月报黑金细轨（与 .ks-report-scroll 形状颜色一致）；
// 刀五 军规链 82 → 83 段（e108 居 e107 后、e40 前）。
// 🔴 沿袭纪律：源码级计数闸门（i18n 基线 112 不变——本刀零新键；16 处段数 82→83 由各文件自行后继化）。
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert';
import { computeCompatScores, buildCompatTimeContext, renderSynastryBlock } from '../api/ai-advisor.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const exists = (p) => existsSync(path.join(ROOT, p));
const SERVER = read('server.js');
const PKG = JSON.parse(read('package.json'));
const DRAW = read('web/src/lib/drawGoldCard.ts');
const HOME = read('web/src/components/FamiliarHomeCard.tsx');
const CSS = read('web/src/App.css');
const LANGS = ['zh', 'en', 'fr', 'es', 'th', 'vi'];

// ── VM 抽取（e100 同法：花括号配平搬运源码段，真源直测零 mock）──
function sliceBraced(src, startMarker) {
  const i = src.indexOf(startMarker);
  assert.ok(i !== -1, `源码段缺失：${startMarker}`);
  let depth = 0, started = false;
  for (let j = src.indexOf('{', i); j < src.length; j++) {
    if (src[j] === '{') { depth++; started = true; }
    else if (src[j] === '}') { depth--; if (started && depth === 0) {
      // 吃掉收尾（const X = Object.freeze({...}); 的闭括号与分号；函数声明后为换行不吃）
      let end = j + 1;
      while (src[end] === ')' || src[end] === ';') end++;
      return src.slice(i, end);
    } }
  }
  assert.fail(`花括号配平失败：${startMarker}`);
}

const LANG_LOCK_SRC = sliceBraced(SERVER, 'const _E88_YEARLY_LANG_LOCK =');
const CHAPTERS_SRC = sliceBraced(SERVER, 'const _E88_YEARLY_CHAPTERS =');
const ICHING_SRC = sliceBraced(SERVER, 'function _e100IchingHexLine(');
const PROMPT_SRC = sliceBraced(SERVER, 'function buildCompatYearlyFiveChapterPrompt(');
const LOCK_SRC = sliceBraced(SERVER, 'function _e108LockQuarterRanges(');

const factory = new Function(
  'computeCompatScores', 'buildCompatTimeContext', 'renderSynastryBlock',
  [LANG_LOCK_SRC, CHAPTERS_SRC, ICHING_SRC, PROMPT_SRC, LOCK_SRC,
   'return { buildCompatYearlyFiveChapterPrompt, _e108LockQuarterRanges };'].join('\n')
);
const VM = factory(computeCompatScores, buildCompatTimeContext, renderSynastryBlock);

// 十月生日（1990-10-15）⇒ 太阳返照窗恒以 10 月为首月；Y＝窗口起始年（相对现算，测试任意时点皆稳）
const ZH_P = VM.buildCompatYearlyFiveChapterPrompt('1990-10-15', '1997-10-18', 'zh', { userBirthDate: '1990-10-15' });
const WS = String(ZH_P.timeCtx.windowStart || '');
const Y = Number(WS.slice(0, 4));
const YN = Y + 1;

// ═══════════════ 刀一 · 金卡域名防伪底栏 ═══════════════

test('①-1 域名底栏双层居中排版（✦ SOUL OS · kindredsouls.online ✦ ＋ HASH 档案行）', () => {
  assert.ok(DRAW.includes('kindredsouls.online'), '金卡底栏未注入官方域名 kindredsouls.online');
  assert.ok(DRAW.includes("'✦ SOUL OS · kindredsouls.online ✦'"), '缺第一层品牌域名行（E108-刀一 钦定字面量）');
  // 第二层：HASH {hashHex} · COSMIC IMMUTABLE ARCHIVE（e105 防伪三字样全保全）
  assert.ok(DRAW.includes('COSMIC IMMUTABLE ARCHIVE'), 'e105 防伪字样 COSMIC IMMUTABLE ARCHIVE 丢失');
  assert.ok(DRAW.includes('hashHex'), 'HASH 指纹变量 hashHex 丢失');
  assert.ok(DRAW.includes("HASH ${hashHex} · COSMIC IMMUTABLE ARCHIVE"), '缺第二层 HASH 档案行模板串');
  // 双层位置：防伪底栏区（画布底部 54/36 两行）
  assert.ok(DRAW.includes('L.canvasHeight - 54'), '域名行未居底（canvasHeight - 54）');
  assert.ok(DRAW.includes('L.canvasHeight - 36'), 'HASH 行未居底（canvasHeight - 36）');
});

// ═══════════════ 刀二 · 年报四季历法规制（行为级 VM）═══════════════

test('②-1 十月生日窗：Q4＝7月—9月（历法算术溢出根治，绝无 10 月）', () => {
  assert.ok(/^\d{4}-10-\d{2}$/.test(WS), `十月生日窗首月须为 10 月（实得 ${WS}）`);
  const userTail = ZH_P.user.split('\n').pop() || '';
  assert.ok(userTail.includes('Quarter calendar (state each range verbatim when introducing the quarter)'), 'user 末行缺 Quarter calendar 逐字声明指令');
  // zh Q4 标签：起始年 = Y+1（窗口第 10 月＝次年 7 月）；同年压缩形态「YN年7月—9月」
  assert.ok(userTail.includes(`Q4 ${YN}年7月—9月`), `zh Q4 标签须为「${YN}年7月—9月」（实得尾行：${userTail.slice(-160)}）`);
  assert.ok(!new RegExp(`Q4 [^/]{0,24}10月`).test(userTail), 'Q4 标签仍溢出到 10 月（刀二病根未除）');
});

test('②-2 四季严格各 3 个月＋全窗 12 个月无缝（Q1=10-12 / Q2=1-3 / Q3=4-6 / Q4=7-9）', () => {
  const userTail = ZH_P.user.split('\n').pop() || '';
  const qs = [...userTail.matchAll(/Q([1-4]) (?:\d{4}年)?(\d{1,2})月—(\d{1,2})月/g)]
    .map((m) => ({ q: Number(m[1]), a: Number(m[2]), b: Number(m[3]) }));
  assert.equal(qs.length, 4, `user 末行须含 Q1~Q4 四个季度区间标签（实得 ${qs.length} 个）`);
  // 首月序列 10→1→4→7：自窗口首月起算、每季 3 个月、四季首尾相扣无缝
  assert.deepEqual(qs.map((x) => x.a), [10, 1, 4, 7], '四季首月序列须为 10/1/4/7（严格自窗口首月起算）');
  for (const x of qs) {
    const span = ((x.b - x.a) + 12) % 12;
    assert.equal(span, 2, `Q${x.q}（${x.a}月—${x.b}月）跨度须恰 3 个月（首末差 2）`);
  }
  // 四季合计 12 个月（3×4）；窗口外第 13 月绝不在任何区间标签中
  const sys3a = ZH_P.system.split('\n').find((l) => l.startsWith('3a. [QUARTER CALENDAR')) || '';
  assert.ok(sys3a.includes('EXACTLY four quarters of 3 months each'), '3a 行缺四季各 3 个月硬约束');
  assert.ok(sys3a.includes('NEVER let any quarter spill into a 4th month'), '3a 行缺季度禁溢出指令');
});

test('②-3 第 13 月禁令（窗口末月之后＝下一太阳返照年，唯一例外第五章新岁交接）', () => {
  const sys3a = ZH_P.system.split('\n').find((l) => l.startsWith('3a. [QUARTER CALENDAR')) || '';
  assert.ok(sys3a.length > 0, '3a QUARTER CALENDAR 行缺失');
  // 十月窗第 13 月 = YN年10月
  assert.ok(sys3a.includes(`${YN}年10月 already belongs to the NEXT solar-return year`), '第 13 月归属禁令缺失（下一太阳返照年声明）');
  assert.ok(sys3a.includes('only once in Chapter 5 as a new-year handover blessing'), '第五章新岁交接唯一例外声明缺失');
  assert.ok(sys3a.includes('there is no 13th month'), '「无第 13 月」终结声明缺失');
});

test('②-4 泛化（三月生日窗）：Q4 跨年区间形态（12月—次年2月）', () => {
  const P3 = VM.buildCompatYearlyFiveChapterPrompt('1990-03-05', '1997-10-18', 'zh', { userBirthDate: '1990-03-05' });
  const ws3 = String(P3.timeCtx.windowStart || '');
  const y3 = Number(ws3.slice(0, 4));
  const tail3 = P3.user.split('\n').pop() || '';
  // 三月窗：Q1=3—5 / Q2=6—8 / Q3=9—11 / Q4=12月—次年2月（zh 跨年双年标形态）
  assert.ok(tail3.includes(`Q1 ${y3}年3月—5月`), `三月窗 Q1 标签异常（实得：${tail3.slice(-160)}）`);
  assert.ok(tail3.includes(`Q4 ${y3}年12月—${y3 + 1}年2月`), '三月窗 Q4 跨年双年标形态异常');
  assert.ok(!/月[—\-]13月/.test(P3.user) && !/13月/.test(tail3), '窗口外第 13 月渗入 user 行');
});

test('②-5 六语季度历法注入（Quarter calendar 逐字声明六语全量）', () => {
  for (const l of LANGS) {
    const P = VM.buildCompatYearlyFiveChapterPrompt('1990-10-15', '1997-10-18', l, { userBirthDate: '1990-10-15' });
    const tail = P.user.split('\n').pop() || '';
    assert.ok(tail.includes('Quarter calendar (state each range verbatim when introducing the quarter)'), `${l} 缺 Quarter calendar 指令行`);
    assert.ok(/Q1 .+\/ Q2 .+\/ Q3 .+\/ Q4 /.test(tail), `${l} 缺 Q1~Q4 四标签`);
    const sys3a = P.system.split('\n').find((x) => x.startsWith('3a. [QUARTER CALENDAR')) || '';
    assert.ok(sys3a.length > 0, `${l} 缺 3a QUARTER CALENDAR 行`);
    assert.ok(sys3a.includes('there is no 13th month'), `${l} 缺第 13 月禁令`);
    // 各语 Q4 末月（十月窗 ⇒ 窗口第 12 月＝次年 9 月）：Jul—Sep / tháng 7—9 / ก.ย. 等月表逐语命中
    if (l === 'en') assert.ok(new RegExp(`Q4 Jul ${YN}—Sep ${YN}`).test(tail), `en Q4 标签异常：${tail.slice(-120)}`);
    if (l === 'vi') assert.ok(new RegExp(`Q4 tháng 7/${YN}—tháng 9/${YN}`).test(tail), `vi Q4 标签异常：${tail.slice(-120)}`);
    if (l === 'th') assert.ok(new RegExp(`Q4 ก\\.ค\\. ${YN}—ก\\.ย\\. ${YN}`).test(tail), `th Q4 标签异常：${tail.slice(-120)}`);
  }
});

// ═══════════════ 刀二 · 输出侧季度溢出锁（九案行为级）═══════════════

test('②-6 溢出锁九案：季度标记语境内 N月—(N+3)月 ⇒ 真实季末月', () => {
  const fn = VM._e108LockQuarterRanges;
  const WS108 = '2026-10-15'; // 十月生日窗：qs/qe/ov = Q4 → 7/9/10
  // 案1 军令原句：带年份双写、连字符分隔（年份回填跟分隔符后，E108 首版错位教训）
  assert.equal(
    fn('第4季度（2027年7月-2027年10月）将进入收束与沉淀。', WS108),
    '第4季度（2027年7月-2027年9月）将进入收束与沉淀。', '案1 带年份连字符纠偏失败');
  // 案2 汉字季度标记＋全角破折号
  assert.equal(
    fn('第四季度 2027年7月—2027年10月，能量收束。', WS108),
    '第四季度 2027年7月—2027年9月，能量收束。', '案2 汉字季度＋破折号纠偏失败');
  // 案3 Q N 标记＋波浪分隔
  assert.equal(
    fn('Q4: 2027年7月~10月 起收束。', WS108),
    'Q4: 2027年7月~9月 起收束。', '案3 Q4 标记＋波浪分隔纠偏失败');
  // 案4 无年份裸区间
  assert.equal(fn('第4季度（7月-10月）收束与沉淀。', WS108), '第4季度（7月-9月）收束与沉淀。', '案4 无年份纠偏失败');
  // 案5 「至」分隔符
  assert.equal(fn('第4季度 2027年7月至10月。', WS108), '第4季度 2027年7月至9月。', '案5 「至」分隔纠偏失败');
  // 案6 正确区间零触碰（幂等输入形态）
  assert.equal(fn('第4季度（2027年7月—9月）收束。', WS108), '第4季度（2027年7月—9月）收束。', '案6 正确区间被误伤');
  // 案7 无季度标记不误伤（第四章十字路口合法跨季区间——防误伤设计核心）
  assert.equal(
    fn('第四章：第一个命运十字路口出现在 2027年7月-10月 之间。', WS108),
    '第四章：第一个命运十字路口出现在 2027年7月-10月 之间。', '案7 十字路口跨季区间被误伤（防误伤设计失败）');
  // 案8 幂等：复施不变
  const once = fn('第4季度（2027年7月-2027年10月）将进入收束与沉淀。', WS108);
  assert.equal(fn(once, WS108), once, '案8 幂等失败（复施再变）');
  // 案9 坏输入直通（fail-closed 不炸不吞）
  assert.equal(fn(null, WS108), null, '案9 非字符串须直通');
  assert.equal(fn('第4季度（7月-10月）', 'bad-window'), '第4季度（7月-10月）', '案9 坏窗口须直通');
});

test('②-7 三接线点（Gate41 复读 HIT / onText 帧级 / 终帧全文）', () => {
  // ① HIT 复读：_g41ReplayUsable 块内 yearly 分支同施（旧缓存「7月—10月」零算力就地修复）
  assert.ok(SERVER.includes('_g41Replay.insight = _e108LockQuarterRanges('), 'Gate41 复读 HIT 路径未施锁');
  const g41Seg = SERVER.split('const _g41ReplayUsable')[1]?.split('\n      const')[0] || '';
  assert.ok(g41Seg.includes('_e108LockQuarterRanges'), '锁不在 _g41ReplayUsable 块内');
  assert.ok(SERVER.includes("buildCompatTimeContext('yearly', new Date(), _cEnt.userBirthDate || null, lang).windowStart"), '复读窗口未按 userBirthDate 同源现算');
  // ② onText 帧级（zh yearly 尽力而为；非 zh 走 E100/E102/E103 语种清洗链）
  assert.ok(SERVER.includes("(reportType === 'yearly' && _e94IsZh) ? _e108LockQuarterRanges(d, _compat.timeCtx.windowStart) : d"), 'onText 帧级锁缺失');
  // ③ 终帧全文硬收口（yearly 恒施）
  assert.ok(SERVER.includes("if (reportType === 'yearly') insight = _e108LockQuarterRanges(insight, _compat.timeCtx.windowStart);"), '终帧全文锁缺失');
});

// ═══════════════ 刀三 · 贴身今日运势锦囊气泡 ═══════════════

test('③-1 居中大 Modal 物理废除（FamiliarLuckCard 退场，贴身气泡复活）', () => {
  assert.ok(!exists('web/src/components/FamiliarLuckCard.tsx'), 'FamiliarLuckCard.tsx 仍存在（居中大 Modal 未物理废除）');
  assert.ok(!HOME.includes('FamiliarLuckCard'), '首页仍挂居中幸运卡片组件');
  assert.ok(!HOME.includes('luckCardOpen'), 'luckCardOpen 状态残留');
});

test('③-2 锦囊三宝真值＋第二行能量微语＋胶囊 CTA 开舱', () => {
  assert.ok(HOME.includes('const luckPouch ='), '缺 luckPouch 锦囊真值核');
  const pouchSeg = HOME.split('const luckPouch =')[1]?.split('}, [')[0] || '';
  assert.ok(/luckyNumber/.test(pouchSeg) && /luckNum/.test(pouchSeg), '锦囊缺幸运数字');
  assert.ok(/luckColor/.test(pouchSeg) && /color\.name/.test(pouchSeg), '锦囊缺幸运色');
  assert.ok(/vibe/.test(pouchSeg), '锦囊缺能量微语（f.vibe）');
  assert.ok(HOME.includes('famBubble.line2'), '气泡缺第二行渲染（能量微语行）');
  assert.ok(HOME.includes('line2?'), 'famBubble state 缺 line2 可选字段');
  assert.ok(HOME.includes('ks-fam-bubble-cta') || HOME.includes('familiar-chat-cta'), '气泡缺「与TA聊聊」胶囊 CTA');
  // 点灵宠 ⇒ 贴身气泡＋微光脉冲，禁直开舱（开舱权只属气泡 CTA）
  const tapSeg = HOME.split('const tapFamiliar =')[1]?.split('}, [')[0] || '';
  assert.ok(tapSeg.includes('showBubble'), '点灵宠未呼出贴身锦囊气泡');
  assert.ok(tapSeg.includes('setFamPulse(true)'), '点灵宠缺 0.75s 微光脉冲');
  assert.ok(!tapSeg.includes('setChatOpen(true)'), 'tapFamiliar 仍直开舱（动线违例）');
});

// ═══════════════ 刀四 · 对话窗黑金滑轨（对齐月报滚动槽）═══════════════

test('④-1 对话窗滚动槽与月报 .ks-report-scroll 形状颜色逐字一致（5px 胶囊轨＋暗金滑块）', () => {
  // Firefox：thin ＋ scrollbar-color（哑光暗金 0.3 滑块 / 近透明 0.05 轨道）
  const chatSeg = CSS.split('.ks-chat-flow {')[1]?.split('\n}')[0] || '';
  assert.ok(chatSeg.includes('scrollbar-width: thin;'), '.ks-chat-flow 缺 scrollbar-width: thin');
  assert.ok(chatSeg.includes('scrollbar-color: rgba(212, 175, 55, 0.3) rgba(255, 255, 255, 0.05);'), '.ks-chat-flow 缺黑金 scrollbar-color');
  // WebKit：四行规格逐字克隆 .ks-report-scroll（E91-③ Sacred .dark-scrollbar 封仓源）
  const pickRules = (sel) => {
    const out = {};
    for (const kind of ['', '-track', '-thumb', '-thumb:hover']) {
      const marker = `${sel}::-webkit-scrollbar${kind} {`;
      const i = CSS.indexOf(marker);
      assert.ok(i !== -1, `缺规则 ${marker}`);
      out[kind || 'bar'] = CSS.slice(i + marker.length, CSS.indexOf('}', i)).trim();
    }
    return out;
  };
  const chat = pickRules('.ks-chat-flow');
  const report = pickRules('.ks-report-scroll');
  for (const kind of Object.keys(chat)) {
    assert.equal(chat[kind], report[kind], `滚动槽 ${kind} 规格与月报不一致（chat="${chat[kind]}" vs report="${report[kind]}"）`);
  }
  // 钦定数值锚（军令「与月报滚动槽和滑轨条形状、颜色一致」）
  assert.equal(chat.bar, 'width: 5px; border-radius: 4px;', '胶囊轨须 5px 圆角 4px');
  assert.equal(chat['-track'], 'background: rgba(255, 255, 255, 0.05); border-radius: 4px;', '轨道须近透明 0.05');
  assert.equal(chat['-thumb'], 'background: rgba(212, 175, 55, 0.3); border-radius: 4px;', '滑块须哑光暗金 0.3');
  assert.equal(chat['-thumb:hover'], 'background: rgba(212, 175, 55, 0.6);', 'hover 须鎏金提亮 0.6');
});

// ═══════════════ 刀五 · 军规链入编（82 → 83 段）═══════════════

test('⑤-1 军规链段数入编（E108 后继化：83 段／e108 居 e107 前、e40 前）', () => {
  const segs = PKG.scripts['test:astro'].split('&&').map((s) => s.trim()).filter(Boolean);
  assert.equal(segs.length, 85, `军规链段数异常（实得 ${segs.length}，基线 85（E110 升 85 段））`);
  assert.ok(segs[segs.length - 1].includes('audit_v492_peak_window.py'), 'python 恒链尾被破');
  assert.ok(segs[segs.length - 2].includes('audit-e40-compat'), 'e40-compat 恒 len-2 被破');
  assert.ok(segs[segs.length - 5].includes('audit-e108'), 'e108 须居 len-5（e109 后、e40 前）');
  assert.ok(segs[segs.length - 6].includes('audit-e107'), 'e107 须居 len-6（e108 后）');
  assert.ok(segs[segs.length - 7].includes('audit-e106'), 'e106 须居 len-7');
});
