// 🔴 E91（主公军令 2026-10-25）：移除冗余退出键＋曜黑金属框像素级对齐＋年报返照锚定文案
//   ①「退出登录」按钮退役（黑屏根因＝handleLogout 清数据后 reload ⇒ result 空白）；
//   ② 金属框底色逐字对齐财富正文真源 SacredYearlyReportBox（曜黑纵向渐变）；
//   ③ 滑轨逐字克隆 Sacred .dark-scrollbar（V257 封仓规格）；
//   ④ 年报第二章太阳返照起点释义（六语、windowStart 现算月）。
import test from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (p) => readFileSync(path.join(ROOT, p), 'utf-8');
const APP = read('web/src/App.tsx');
const CSS = read('web/src/App.css');
const SERVER = read('server.js');
const SACRED = read('web/src/components/SacredYearlyReportBox.tsx');
const PKG = JSON.parse(read('package.json'));

/* ════════ ① 退出登录按钮退役 ════════ */

test('E91-①-1 退出登录按钮 JSX 零残留（含 onClick 与词条引用）', () => {
  assert.ok(!APP.includes('onClick={onLogout}'), '退出登录按钮 JSX 残留违令');
  assert.ok(!APP.includes('TXT.signOut'), 'TXT.signOut 词条引用残留违令');
  // 断言口径＝词条定义形态（signOut:）；「退出登录」仅允许出现在退役注释的人话说明里。
  assert.ok(!APP.includes('signOut:'), 'signOut 词条定义残留违令');
});

test('E91-①-2 重新测算链路守恒（清缓存＋回表单，黑屏零容忍）', () => {
  // back-btn 链：onBack 清 ks_return_to_result/ks_result＋setResult(null)＋回 input＋pushState('/')
  const i = APP.indexOf("onBack={() => { localStorage.removeItem('ks_return_to_result')");
  assert.ok(i > 0, '重新测算（onBack）清理链缺失');
  const seg = APP.slice(i, i + 320);
  assert.ok(seg.includes("localStorage.removeItem('ks_result')"), '测算缓存清理缺失');
  assert.ok(seg.includes("_setPage('input')"), '回输入页跳转缺失');
  assert.ok(APP.includes("t('result.back')"), '重新测算词条缺失');
});

/* ════════ ②③ 曜黑金属框＋dark 滑轨（与 Sacred 真源同款双证） ════════ */

test('E91-②-1 金属框底色/边框/光效与 Sacred 真源逐字同款', () => {
  // 参照源守恒：Sacred 自身规格不得被误改（V257 封仓）
  assert.ok(SACRED.includes('linear-gradient(180deg, rgba(12,14,22,0.98) 0%, rgba(6,7,12,0.99) 100%)'),
    'Sacred 参照源曜黑渐变被误改（封仓违令）');
  // 姻缘侧同款
  assert.ok(CSS.includes('linear-gradient(180deg, rgba(12, 14, 22, 0.98) 0%, rgba(6, 7, 12, 0.99) 100%)'),
    'ks-report-scroll 未对齐 Sacred 曜黑渐变');
  assert.ok(CSS.includes('0 0 30px rgba(0, 0, 0, 0.85), inset 0 0 40px rgba(212, 175, 55, 0.015), 0 0 15px rgba(212, 175, 55, 0.1)'),
    '三层光效未对齐 Sacred 真源');
  assert.ok(!CSS.includes('#1a1a2e 0%, #16213e'), '蓝紫渐变残留违令（E90 误移植已退役）');
});

test('E91-③-1 滑轨逐字克隆 Sacred .dark-scrollbar（V257 封仓规格）', () => {
  assert.ok(SACRED.includes('.dark-scrollbar::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.3); border-radius: 4px; }'),
    'Sacred 滑轨封仓规格被误改');
  assert.ok(CSS.includes('.ks-report-scroll::-webkit-scrollbar-thumb { background: rgba(212, 175, 55, 0.3); border-radius: 4px; }'),
    '滑块未逐字克隆（哑光金 0.3）');
  assert.ok(CSS.includes('.ks-report-scroll::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); border-radius: 4px; }'),
    '轨道未逐字克隆（深黑半透 0.05）');
  assert.ok(CSS.includes('.ks-report-scroll::-webkit-scrollbar-thumb:hover { background: rgba(212, 175, 55, 0.6); }'),
    'hover 提亮规格缺失');
});

/* ════════ ④ 年报第二章太阳返照锚定文案 ════════ */

test('E91-④-1 锚定文案六语齐备＋月份现算（零固定月份字面量）', () => {
  const i = SERVER.indexOf('const _solarAnchorNote = {');
  assert.ok(i > 0, '锚定文案表缺失');
  const seg = SERVER.slice(i, i + 1600);
  for (const key of ['zh:', 'en:', 'es:', 'fr:', 'th:', 'vi:']) {
    assert.ok(seg.includes(key), `锚定文案 ${key} 缺失`);
  }
  assert.ok(seg.includes('能量起点释义'), 'zh 文案关键词缺失');
  assert.ok(seg.includes('solar-return year begins in your birth month'), 'en 文案关键词缺失');
  // 月份标签现算（windowStart 推导，禁固定月份字面量）
  const iYm = SERVER.indexOf('const _anchorYm = String(timeCtx.windowStart');
  assert.ok(iYm > 0, '月份现算链缺失（windowStart 真源）');
});

test('E91-④-2 prompt 契约：第二章标题下 VERBATIM 输出锚定行＋12月起点锁', () => {
  // 契约 1a：VERBATIM 原样输出
  assert.ok(SERVER.includes('output VERBATIM (one line, do not paraphrase'), '契约 1a VERBATIM 条缺失');
  // user STRUCTURE 段：ch[1] 之后、ch[2] 之前插 _solarAnchorNote
  const iUser = SERVER.indexOf("ch[0],\n    ch[1],\n    _solarAnchorNote,\n    ch[2],");
  assert.ok(iUser > 0, 'STRUCTURE 段锚定行插位错误（须在第二章标题正下方）');
  // 12 个月起点锁：从窗口首月起，禁从 1 月起
  assert.ok(SERVER.includes('must start from the solar-return window start month, NOT from January'),
    '12 月起点锁指令缺失');
  // 返回值携带 solarAnchorNote（探针/闸门可断言）
  assert.ok(SERVER.includes('fiveChapter: true, solarAnchorNote: _solarAnchorNote'), '返回值未携带锚定行');
});

/* ════════ ⑤ 闸门接线（入编位军规） ════════ */

test('E91-⑤-1 闸门接线：test:astro 含本闸门（69 段）＋入编位（e40-compat 前、python 链尾）', () => {
  const chain = PKG.scripts['test:astro'] || '';
  assert.ok(chain.includes('audit-e91-solar-metal-logout.test.mjs'), '本闸门未接线 test:astro');
  const parts = chain.split('&&').map((s) => s.trim());
  assert.equal(parts.length, 85, `链段数异常（实得 ${parts.length}，基线 79（E103/E104 升 79 段））`);   // 🛡️ E103/E104 后继化：77→79
  const iE91 = parts.findIndex((p) => p.includes('audit-e91-solar-metal-logout'));
  const iE40 = parts.findIndex((p) => p.includes('audit-e40-compat-synastry-tensor-fusion'));
  const iPy = parts.findIndex((p) => p.includes('python3'));
  assert.ok(iE40 > iE91, 'E91 须在 e40-compat 之前（收口位军规）');
  assert.ok(iPy === parts.length - 1, 'python 恒链尾被破坏');
});
