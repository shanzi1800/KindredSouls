/**
 * ══════════════════════════════════════════════════════════════════════
 * E90（主公军令 2026-10-25）：付费按钮加载态解耦、打字机卡死根治、金属框全模块对齐
 * ══════════════════════════════════════════════════════════════════════
 * 主公实测三患（截图四张实锤）：
 *  ① 点 $4.99「立即解锁」⇒ 主按钮与年报按钮**同时**转 ⏳＋灰底（全局单布尔状态污染）；
 *  ②③ 沙盒付款后月报/年报只显示第一章标题＋孤零零光标，无后续正文——
 *     真凶＝打字机 effect 依赖含 `revealedParas === 0`：130ms 后 0→1 触发依赖变更 →
 *     React cleanup 杀 interval → 揭示永远停在第一段。SSE 造帧/解析链全绿（本闸
 *     守卫证据链）；军令 Reader 提前 done 假说经真源复核不成立。
 *  ④  姻缘月报/年报容器须与财富报告同款「黑金金属框」（渐变底＋2px 金边＋流光线）。
 * 守卫射程：①3 段（状态隔离）＋②4 段（打字机根治＋SSE 契约不回归）＋③3 段（金属框）
 *          ＋④1 段（入编位）＝11 段。
 */
import { test } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const read = (p) => readFileSync(path.join(ROOT, p), 'utf-8');

const APP = read('web/src/App.tsx');
const CSS = read('web/src/App.css');
const PW = read('web/src/components/PaywallCard.tsx');
const PKG = JSON.parse(read('package.json'));

/* ════════ ① 付费墙按钮加载态隔离 ════════ */

test('E90-①-1 PaywallCard 接收 activePlan 档位枚举（状态隔离契约）', () => {
  assert.ok(PW.includes('activePlan?: string | false'), 'activePlan prop 契约缺失');
  assert.ok(PW.includes("activePlan = false }: PaywallCardProps"), 'activePlan 缺省 false 形态异常');
});

test('E90-①-2 三按钮各按档位判加载（零连带）', () => {
  // 三档位判别齐全：谁被点击谁 ⏳，其余按钮保持原文案与可点击态
  for (const plan of ['compatibility_once', 'compatibility_monthly_report', 'compatibility_yearly_report']) {
    const cond = `activePlan === '${plan}'`;
    assert.ok(PW.includes(cond), `档位判别缺失：${plan}`);
  }
  // 连带病灶（旧形态）：`disabled={loading}` 裸全局布尔直接判——必须退役
  assert.ok(!/\bdisabled=\{loading\}/.test(PW), '裸 disabled={loading} 连带禁用残留违令（状态污染回归）');
  // 三按钮的 ⏳ 文案必须各自跟档位判别（旧：`{loading ? '⏳ ...' : ...}` 连带）
  const bareHourglass = (PW.match(/\{loading \? '/g) || []).length;
  assert.equal(bareHourglass, 0, `裸 {loading ? '⏳'} 连带加载文案残留 ${bareHourglass} 处违令`);
});

test('E90-①-3 App 侧注入 activePurchasePlan', () => {
  assert.ok(APP.includes("const [activePurchasePlan, setActivePurchasePlan] = useState<string | false>(false)"),
    'activePurchasePlan 状态缺失');
  assert.ok(APP.includes('setActivePurchasePlan(plan);'), 'handlePurchase 未记入被点击档位');
  assert.ok(APP.includes('setActivePurchasePlan(false);'), '登录墙收口未复位档位');
  assert.ok(APP.includes('activePlan={activePurchasePlan}'), 'PaywallCard 未接收 activePlan');
  // e86-③-2 锚点语义守恒：setLoading(true) 即刻加载态链不得被拆
  assert.ok(APP.includes('setLoading(true);'), '点击未即刻触发加载态（e86 锚点回归）');
});

/* ════════ ② 打字机卡死根治（interval 不被 cleanup 杀） ════════ */

test('E90-②-1 打字机 effect 依赖摘除 revealedParas===0（自杀病灶拔除）', () => {
  // 旧病灶字面量：依赖数组含 revealedParas === 0 ⇒ 130ms 后依赖变更触发 cleanup 杀 interval
  assert.ok(!APP.includes('[reportText, revealedParas === 0, reportParas.length]'),
    '自杀依赖数组残留违令（打字机必然卡死在第一段）');
  // 新形态：依赖只挂 [reportText, reportParas.length]
  assert.ok(APP.includes('[reportText, reportParas.length]'), '打字机新依赖形态缺失');
});

test('E90-②-2 终点自清（到达 Infinity 时 clearInterval，不空转）', () => {
  const i = APP.indexOf('const id = setInterval(() => {');
  assert.ok(i > 0, '打字机 interval 缺失');
  const seg = APP.slice(i, i + 400);
  assert.ok(seg.includes('clearInterval(id)'), 'interval 终点自清缺失（空转耗电）');
  assert.ok(seg.includes('Number.POSITIVE_INFINITY'), '终点 Infinity 语义缺失');
});

test('E90-②-3 起点 0 判定由闭包承接（0 才启动打字机）', () => {
  const i = APP.indexOf('if (revealedParas !== 0) return;');
  assert.ok(i > 0, '打字机起点判定缺失（非 0 状态误启动＝全量直显被破坏）');
});

test('E90-②-4 SSE 读流契约零回归（classifySSEFrame/reduceSSEFrames 归约仍在）', () => {
  // 军令 Reader 假说虽不成立，读流核契约仍须守卫：任何回归会引入真断流
  assert.ok(APP.includes('await reader.read()'), 'SSE 读流循环缺失');
  assert.ok(APP.includes('readCompatSSEStream'), 'SSE 读流入口缺失');
  assert.ok(APP.includes('decoder.decode(value, { stream: true })'), '跨 chunk 多字节解码缺失（截断风险回归）');
});

/* ════════ ③ 金属框全模块对齐（财富同款规格） ════════ */

test('E90-③-1 报告容器金属框规格（曜黑渐变底＋2px 金边＋黑幕金辉，E91 对齐 Sacred 真源）', () => {
  const i = CSS.indexOf('.ks-report-scroll {');
  assert.ok(i > 0, 'ks-report-scroll 类缺失');
  const seg = CSS.slice(i, i + 1100);
  // 🔴 E91-② 语义演进：E90 误移植封面卡蓝紫渐变（#1a1a2e→#0f3460）——主公肉眼
  //   实锤两模块底色不一致；真源＝财富正文 SacredYearlyReportBox 曜黑纵向渐变。
  assert.ok(seg.includes('linear-gradient(180deg, rgba(12, 14, 22, 0.98) 0%, rgba(6, 7, 12, 0.99) 100%)'),
    '曜黑渐变底缺失（E91 对齐 Sacred 真源）');
  assert.ok(!seg.includes('linear-gradient(135deg, #1a1a2e'), '蓝紫渐变代码残留违令（E91 退役）');
  assert.ok(seg.includes('border: 2px solid rgba(212, 175, 55, 0.4)'), '2px 钛金边缺失');
  assert.ok(seg.includes('0 0 30px rgba(0, 0, 0, 0.85), inset 0 0 40px rgba(212, 175, 55, 0.015), 0 0 15px rgba(212, 175, 55, 0.1)'),
    '黑幕金辉三层阴影缺失（Sacred 真源）');
  assert.ok(seg.includes('border-radius: 20px'), '20px 圆角缺失');
});

test('E90-③-2 顶部鎏金流光线＋黑金滚动槽（E91 逐字克隆 Sacred .dark-scrollbar）', () => {
  assert.ok(CSS.includes('.ks-report-scroll::before'), '顶部流光线伪元素缺失');
  const i = CSS.indexOf('.ks-report-scroll::before');
  const seg = CSS.slice(i, i + 400);
  assert.ok(seg.includes('linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.8), transparent)'),
    '流光线渐变规格缺失');
  // 🔴 E91-③ 语义演进：滑轨逐字克隆 Sacred .dark-scrollbar（V257 封仓规格，
  //   5px 胶囊/哑光金 0.3/轨道 0.05）——celestial 并挂与 0.45 亮金规格退役。
  assert.ok(CSS.includes('.ks-report-scroll::-webkit-scrollbar { width: 5px; border-radius: 4px; }'), '滑轨 5px 胶囊规格缺失');
  assert.ok(CSS.includes('.ks-report-scroll::-webkit-scrollbar-thumb { background: rgba(212, 175, 55, 0.3); border-radius: 4px; }'), '哑光金滑块 0.3 缺失');
  assert.ok(CSS.includes('.ks-report-scroll::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); border-radius: 4px; }'), '深黑半透轨道 0.05 缺失');
  assert.ok(!APP.includes('"ks-report-scroll celestial-scrollbar"'), 'celestial 并挂残留违令（E91 退役，两套规格打架根因）');
});

test('E90-③-3 章节头金铭牌带金分隔底线（E95 后继：左侧金条已按军令退役）', () => {
  const i = CSS.indexOf('.ks-report-chapter {');
  const seg = CSS.slice(i, i + 500);
  // 🔴 E95-①（主公军令 2026-10-26）：「第」字左侧金色短竖线拔除——E90 左金条口径作废
  assert.ok(!seg.includes('border-left: 3px solid rgba(212, 175, 55, 0.65)'), 'E95 军令违令：左金条仍在');
  assert.ok(seg.includes('border-left: none'), 'E95 显式 border-left: none 缺失');
  assert.ok(seg.includes('border-bottom: 1px solid rgba(212, 175, 55, 0.18)'), '章节头金分隔底线缺失');
});

/* ════════ ④ 闸门接线（入编位军规） ════════ */

test('E90-④-1 闸门接线：test:astro 含本闸门（69 段）＋入编位（e89 后、e40-compat 前、python 链尾）', () => {
  const chain = PKG.scripts['test:astro'] || '';
  assert.ok(chain.includes('audit-e90-paywall-typing-metal.test.mjs'), '本闸门未接线 test:astro');
  const parts = chain.split('&&').map((s) => s.trim());
  assert.equal(parts.length, 71, `链段数异常（实得 ${parts.length}，基线 71）`);
  const iE90 = parts.findIndex((p) => p.includes('audit-e90-paywall-typing-metal'));
  const iE89 = parts.findIndex((p) => p.includes('audit-e89-compat-gen-fix'));
  const iE40 = parts.findIndex((p) => p.includes('audit-e40-compat-synastry-tensor-fusion'));
  const iPy = parts.findIndex((p) => p.includes('python3'));
  assert.ok(iE90 > iE89, 'E90 须在 e89 之后');
  assert.ok(iE40 > iE90, 'E90 须在 e40-compat 之前（收口位军规）');
  assert.ok(parts[parts.length - 2].includes('audit-e40-compat-synastry-tensor-fusion'), 'e40-compat 恒 len-2 被破坏');
  assert.ok(iPy === parts.length - 1, 'python 恒链尾被破坏');
});
