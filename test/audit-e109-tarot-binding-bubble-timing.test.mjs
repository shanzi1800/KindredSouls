// ═══ E109 闸门：跨盘塔罗真值绑定 · 隐士幽灵拔除 · 锦囊气泡受控时序 ═══
// 主公军令（2026-10-30 实锤两问）：
// 刀一 跨盘会话记忆彻底隔离——查验实锤：塔罗双链不同源（结果页/金卡走合盘
//      双人生日+今日散列 getTarot(d1,d2)；chat 走主人单人本命生日+今日散列
//      _e107DailyTarotFor）⇒ 牌面天然分歧（金卡「恋人」vs Sophia「隐士」，
//      非跨盘缓存残留——ks_last_wealth_report 为财富单人线留痕，姻缘换盘不写）。
//      修正「一盘一清」：报告成功 ⇒ sessionStorage ks_compat_report_tarot 覆写；
//      chat 随行 body.reportTarot（前端只传 id/isReversed）⇒ 服务端 _e109ReportTarot
//      查表 fail-closed（牌名不信任前端）⇒ 优先于 E107 本命核注入 prompt 第四层；
// 刀二 锦囊气泡严格受控态——E76 带路消费自动冒气泡（气泡抢跑灵宠 webp 解码
//      100~300ms 实锤）＋E54-2 9s 主动气泡定时器一并拔除；petLoaded 加载守卫
//      （本体 img onLoad 前气泡容器不渲染）；锦囊只可点击灵宠显式呼出；
// 刀三 军规链 83 → 84 段（e109 居 e108 后、e40 前）。
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const SERVER = read('server.js');
const APP = read('web/src/App.tsx');
const SHEET = read('web/src/components/FamiliarChatSheet.tsx');
const HOME = read('web/src/components/FamiliarHomeCard.tsx');
const PKG = JSON.parse(read('package.json'));

// ── VM 抽取（e100 同法：花括号配平整函数搬运）──
function sliceFn(src, marker) {
  const i = src.indexOf(marker);
  assert.ok(i !== -1, `源码段缺失：${marker}`);
  let depth = 0, started = false, end = -1;
  for (let j = src.indexOf('{', i); j < src.length; j++) {
    if (src[j] === '{') { depth++; started = true; }
    else if (src[j] === '}') { depth--; if (started && depth === 0) { end = j; break; } }
  }
  assert.ok(end !== -1, `花括号配平失败：${marker}`);
  return src.slice(i, end + 1);
}

// FAMILIAR_CHAT_TAROT_ZH 表须先注入（_e109ReportTarot 依赖模块级常量；
// 数组常量 ⇒ 行内 ]; 收尾切片，不走花括号配平）
const _ti = SERVER.indexOf('const FAMILIAR_CHAT_TAROT_ZH =');
assert.ok(_ti !== -1, 'FAMILIAR_CHAT_TAROT_ZH 表缺失');
const TABLE_SRC = SERVER.slice(_ti, SERVER.indexOf('];', _ti) + 1);
const LOCKFN_SRC = sliceFn(SERVER, 'function _e109ReportTarot(');
const factory = new Function(`${TABLE_SRC}\n${LOCKFN_SRC}\nreturn _e109ReportTarot;`);
const _e109ReportTarot = factory();

// ═══════════════ 刀一 · 当次报告塔罗绑定 ═══════════════

test('①-1 _e109ReportTarot 行为级（查表 fail-closed：前端只传 id，牌名服务端真源）', () => {
  // 合法 id ⇒ 查表牌名（恋人 id=6、隐士 id=9——军令实锤双牌对验）
  const lovers = _e109ReportTarot({ id: 6, isReversed: false });
  assert.deepStrictEqual(lovers, { id: 6, name: '恋人', reversed: false }, '恋人牌查表失败');
  const hermit = _e109ReportTarot({ id: 9, isReversed: true });
  assert.deepStrictEqual(hermit, { id: 9, name: '隐士', reversed: true }, '隐士牌查表失败（逆位透传）');
  // 边界全绿：0 与 21
  assert.equal(_e109ReportTarot({ id: 0 }).name, '愚人', 'id=0 边界失败');
  assert.equal(_e109ReportTarot({ id: 21 }).name, '世界', 'id=21 边界失败');
  // fail-closed：越界/非整数/坏形状 ⇒ null（回退 E107 本命核，绝不采信伪造牌）
  assert.strictEqual(_e109ReportTarot({ id: 22 }), null, 'id=22 越界须 null');
  assert.strictEqual(_e109ReportTarot({ id: -1 }), null, 'id=-1 越界须 null');
  assert.strictEqual(_e109ReportTarot({ id: 6.5 }), null, '非整数须 null');
  assert.strictEqual(_e109ReportTarot({ id: '6' }), null, '字符串 id 须 null');
  assert.strictEqual(_e109ReportTarot(null), null, 'null 须 null');
  assert.strictEqual(_e109ReportTarot('lovers'), null, '字符串载荷须 null');
  assert.strictEqual(_e109ReportTarot({}), null, '空对象须 null');
  // 前端伪造牌名不得污染（载荷带假 name 也不采——服务端表名恒真源）
  const forged = _e109ReportTarot({ id: 6, name: '死神' });
  assert.equal(forged.name, '恋人', '前端伪造牌名污染真源（fail-closed 破防）');
});

test('①-2 chat 端点优先绑定接线（reportTarot 合法 ⇒ prompt 第四层唯一塔罗真值）', () => {
  // 接线形态：_e109ReportTarot(body.reportTarot) || truth.tarot（本命核让位）
  assert.ok(SERVER.includes('const _e109Tarot = _e109ReportTarot(body.reportTarot);'),
    'chat 端点未接 _e109ReportTarot(body.reportTarot)');
  assert.ok(SERVER.includes('tarot: _e109Tarot || truth.tarot,'),
    'prompt tarot 未按「报告牌优先 || 本命核回退」装配');
});

test('①-3 前端一盘一清（报告成功即覆写 sessionStorage，新盘旧牌物理出局）', () => {
  // App.tsx triggerInsight 成功段写键（新报告覆写＝军令「绝对隔离」）
  assert.ok(APP.includes("sessionStorage.setItem('ks_compat_report_tarot', JSON.stringify({ id: tarot.id, isReversed }))"),
    '报告成功未持久化当次塔罗（id+isReversed 最小载荷）');
  // 写键必须挂在 setTarotCard 之后（同一成功回调内＝报告真值同步落档）
  const setIdx = APP.indexOf('setTarotCard({ id: tarot.id');
  const putIdx = APP.indexOf("sessionStorage.setItem('ks_compat_report_tarot'");
  assert.ok(setIdx !== -1 && putIdx > setIdx, '写键不在 setTarotCard 成功段内');
  // FamiliarChatSheet 随行：形状守卫后 body.reportTarot 上行
  assert.ok(SHEET.includes("sessionStorage.getItem('ks_compat_report_tarot'"), '对话流未读报告牌档');
  const guardSeg = SHEET.split('let reportTarot')[1]?.split('const bt =')[0] || '';
  assert.ok(guardSeg.includes('Number.isInteger(rt.id)'), '随行缺 id 整数守卫');
  assert.ok(guardSeg.includes('rt.id >= 0 && rt.id <= 21'), '随行缺 0~21 域守卫');
  assert.ok(SHEET.includes('reportTarot,'), 'body 缺 reportTarot 随行键');
});

test('①-4 病根断言（塔罗双链不同源＝历史病灶，prompt 严禁吐旧盘牌名）', () => {
  // 双链并存是历史事实（金卡双人散列 vs 本命单人散列）——本刀不拆双人链
  // （金卡/结果页真值不动），只令 chat 端绑当次报告牌优先。
  assert.ok(SERVER.includes('_e107DailyTarotFor'), 'E107 本命核须保留（回退路径）');
  assert.ok(SERVER.includes('禁编造其他牌名'), 'prompt 第四层缺「禁编造其他牌名」铁律');
});

// ═══════════════ 刀二 · 锦囊气泡受控时序 ═══════════════

test('②-1 E76 带路消费拔自动冒泡（仅微光脉冲；禁 showBubble 抢跑）', () => {
  const e76Seg = HOME.split("sessionStorage.getItem('ks_open_familiar_chat')")[1]?.split('}, [rec]);')[0] || '';
  assert.ok(e76Seg.length > 0, 'E76 令牌消费点失踪');
  assert.ok(e76Seg.includes('setFamPulse'), 'E76 缺微光脉冲（灵宠位置提示）');
  assert.ok(!e76Seg.includes('showBubble'), 'E76 仍自动冒锦囊气泡（气泡抢跑灵宠实锤未除）');
});

test('②-2 E54-2 9s 主动气泡定时器整段拔除（useEffect 零自动冒泡）', () => {
  // 9s 定时器与一切 useEffect 内 showBubble 自动冒泡通道全数拔净
  assert.ok(!HOME.includes('9000'), '9s 主动气泡定时器残留');
  // 全文所有 useEffect 段内禁 showBubble（点击回调 tapFamiliar 与 showBubble 定义体除外）
  const effectBlocks = [...HOME.matchAll(/useEffect\(\(\) => \{([\s\S]*?)\n  \}, \[/g)].map((m) => m[1]);
  assert.ok(effectBlocks.length >= 4, `useEffect 切分异常（实得 ${effectBlocks.length}）`);
  for (let k = 0; k < effectBlocks.length; k++) {
    assert.ok(!effectBlocks[k].includes('showBubble('), `useEffect#${k} 内残留自动冒泡 showBubble 调用`);
  }
});

test('②-3 petLoaded 加载守卫（本体 img onLoad 前气泡容器不渲染）', () => {
  assert.ok(HOME.includes('const [petLoaded, setPetLoaded] = useState(false);'), '缺 petLoaded 初态 false');
  assert.ok(HOME.includes('onLoad={() => setPetLoaded(true)}'), '灵宠本体 img 缺 onLoad 置位');
  assert.ok(HOME.includes('{famBubble && petLoaded && ('), '气泡渲染未受 petLoaded 守卫');
  // 点击驱动显式呼出（tapFamiliar：脉冲＋锦囊三宝＋胶囊 CTA 开舱权唯一）
  const tapSeg = HOME.split('const tapFamiliar =')[1]?.split('}, [')[0] || '';
  assert.ok(tapSeg.includes('showBubble'), '点击灵宠未呼出锦囊气泡（点击驱动通道）');
  assert.ok(tapSeg.includes('setFamPulse(true)'), '点击灵宠缺微光脉冲');
  assert.ok(!tapSeg.includes('setChatOpen(true)'), 'tapFamiliar 直开舱违例（开舱权只属气泡 CTA）');
});

// ═══════════════ 刀三 · 军规链入编（83 → 84 段）═══════════════

test('③-1 军规链段数入编（E109 后继化：84 段／e109 居 e108 前、e40 前）', () => {
  const segs = PKG.scripts['test:astro'].split('&&').map((s) => s.trim()).filter(Boolean);
  assert.equal(segs.length, 84, `军规链段数异常（实得 ${segs.length}，基线 84（E109 升 84 段））`);
  assert.ok(segs[segs.length - 1].includes('audit_v492_peak_window.py'), 'python 恒链尾被破');
  assert.ok(segs[segs.length - 2].includes('audit-e40-compat'), 'e40-compat 恒 len-2 被破');
  assert.ok(segs[segs.length - 3].includes('audit-e109'), 'e109 须居 len-3（e40 前）');
  assert.ok(segs[segs.length - 4].includes('audit-e108'), 'e108 须居 len-4（e109 后）');
  assert.ok(segs[segs.length - 5].includes('audit-e107'), 'e107 须居 len-5');
});
