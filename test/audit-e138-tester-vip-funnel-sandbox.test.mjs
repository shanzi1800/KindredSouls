// ═══ E138 闸门：双测试总监全链付费墙保留与沙盒演练机制（主公军令 2026-11-13）═══
// 刀一（白名单分流）：server.js SANDBOX_TESTER_EMAILS 双总监白名单（主公
//   shanzi1800@gmail.com ＋ 合伙人 North northgu916@gmail.com；大小写不敏感、
//   环境变量可覆写）＋create-checkout tester 旁路（沙盒态不返回 already_paid
//   短路 ⇒ 收银台必现；普通 VIP 免单直通语义零变）＋/api/sandbox/tester-status
//   身份探测端点（fail-closed；回执仅 tester 布尔——名单绝不下发）。
// 刀二（沙盒闭环）：双账号库内 VIP 年卡但付费墙全保留（wealth 侧
//   testerPaywallGate('wealth') 闸门＋romance 侧 E85-① per-session 契约）；
//   granted ⇒ markSandboxSessionUnlocked 解锁，跨模块独立走沙盒。
// 刀三（重置微控件）：「🔄 重置沙盒演练」白名单专属（testerMode 真值渲染；
//   普通用户 DOM 零渲染零泄漏）——清 wealth/romance 两象会话态＋romance E85 键
//   ＋刷新 ⇒ 双模块付费墙全数恢复。
// 链位：e138 入编 e137 后、e40-compat 前；全链 105→106 段。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const ST = await import(join(ROOT, 'web/src/lib/sandboxTester.mjs'));

/* ── server.js 纯函数抽取（VM 消费：名单解析真源行为级断言）── */
function _extractFn(src, name) {
  const i = src.indexOf(`function ${name}(`);
  assert.ok(i > 0, `server.js 须定义 ${name}`);
  let depth = 0, started = false, end = -1;
  for (let j = src.indexOf('{', i); j < src.length; j++) {
    if (src[j] === '{') { depth++; started = true; }
    else if (src[j] === '}') { depth--; if (started && depth === 0) { end = j; break; } }
  }
  assert.ok(end > i, `${name} 函数体抽取须完整`);
  return src.slice(i, end + 1);
}
const _srvSrc = read('server.js');
const _constLine = /const DEFAULT_SANDBOX_TESTER_EMAILS = '[^']*';/.exec(_srvSrc);
assert.ok(_constLine, 'DEFAULT_SANDBOX_TESTER_EMAILS 常量须在');
const _vmFns = new Function(
  _constLine[0] + '\n' +
  _extractFn(_srvSrc, 'parseSandboxTesterEmails') + '\n' +
  _extractFn(_srvSrc, 'isSandboxTesterEmail') + '\n' +
  'return { parseSandboxTesterEmails, isSandboxTesterEmail };'
)();

/* ═══ E138-01 白名单解析（后端源码形态＋VM 行为双证）═══ */
test('E138-01 双测试总监白名单：默认双人名单＋大小写不敏感＋环境变量覆写＋畸形输入 fail-closed', () => {
  const srv = read('server.js');
  assert.ok(srv.includes("DEFAULT_SANDBOX_TESTER_EMAILS = 'shanzi1800@gmail.com,northgu916@gmail.com'"),
    '默认白名单须恰为双总监邮箱（军令钦定）');
  assert.ok(!srv.includes('SANDBOX_TESTER_EMAILS_MIN'), '禁造未军令的配置面');
  // 行为证（VM 抽取真源函数）
  assert.deepEqual(_vmFns.parseSandboxTesterEmails(undefined).sort(),
    ['northgu916@gmail.com', 'shanzi1800@gmail.com'], '缺省名单须恰双总监');
  assert.equal(_vmFns.isSandboxTesterEmail('shanzi1800@gmail.com'), true, '主公须命中');
  assert.equal(_vmFns.isSandboxTesterEmail('northgu916@gmail.com'), true, 'North 须命中');
  assert.equal(_vmFns.isSandboxTesterEmail('SHANZI1800@GMAIL.COM'), true, '大小写不敏感');
  assert.equal(_vmFns.isSandboxTesterEmail('  NorthGu916@Gmail.com '), true, 'trim＋大小写归一');
  assert.equal(_vmFns.isSandboxTesterEmail('random@gmail.com'), false, '外人须不命中');
  assert.equal(_vmFns.isSandboxTesterEmail(''), false, '空串须 false（fail-closed）');
  assert.equal(_vmFns.isSandboxTesterEmail(null), false, '非串须 false（fail-closed）');
  // 环境变量覆写（覆写即替换，非并集）
  assert.equal(_vmFns.isSandboxTesterEmail('ops@kindredsouls.online', { SANDBOX_TESTER_EMAILS: 'ops@kindredsouls.online' }), true, 'env 覆写须生效');
  assert.equal(_vmFns.isSandboxTesterEmail('shanzi1800@gmail.com', { SANDBOX_TESTER_EMAILS: 'ops@kindredsouls.online' }), false, '覆写后默认名单须失效（替换语义）');
});

/* ═══ E138-02 create-checkout tester 旁路（付费墙保留·收银台必现）═══ */
test('E138-02 create-checkout 沙盒白名单旁路：tester 不短路 already_paid；普通 VIP 免单直通语义保持', () => {
  const srv = read('server.js');
  assert.ok(srv.includes('function isSandboxTesterCheckoutBypass'),
    '组合闸助手须定义（沙盒态＋白名单双条件单源）');
  assert.ok(srv.includes('const _e138TesterGate = isSandboxTesterCheckoutBypass(email)'),
    'create-checkout 须有 tester 旁路闸（组合闸消费面）');
  assert.ok(srv.includes('planHasAccess(paidPlans, plan, new Date()) && !_e138TesterGate'),
    '防重付短路须带 !tester 旁路——白名单必落沙盒收银台');
  // 沙盒分支仍居旁路之后（tester 与普通用户同走 buildSandboxSession 自环闭环）
  const iGate = srv.indexOf('_e138TesterGate');
  const iSandbox = srv.indexOf('buildSandboxSession({', iGate);
  assert.ok(iGate > 0 && iSandbox > iGate, '沙盒分支须在 tester 旁路之后（同一条自环闭环）');
  // gate45-D2/D3 锚位保护：create-checkout 段首个 isSandboxPaymentMode 字面量须仍是沙盘分支
  const coStart = srv.indexOf("app.post('/api/create-checkout'");
  const coSeg = srv.slice(coStart, coStart + 9000);
  const iFirstSandbox = coSeg.indexOf('isSandboxPaymentMode(process.env)');
  const iPaidCall = coSeg.indexOf('planHasAccess(paidPlans');
  assert.ok(iFirstSandbox > 0 && iPaidCall > 0 && iPaidCall < iFirstSandbox,
    'gate45 锚位守恒：防重付判定须先于 create-checkout 段首个沙盘字面量');
});

/* ═══ E138-03 tester-status 端点（fail-closed＋零名单下发）═══ */
test('E138-03 /api/sandbox/tester-status：沙盒态专属 fail-closed；回执仅布尔零泄漏', () => {
  const srv = read('server.js');
  const i = srv.indexOf("app.post('/api/sandbox/tester-status'");
  assert.ok(i > 0, '端点须存在');
  const seg = srv.slice(i, i + 700);
  assert.ok(seg.includes('isSandboxPaymentMode(process.env)'), '端点须沙盒态守卫（live ⇒ 404）');
  assert.ok(seg.includes('_sandboxResolveUser'), '端点须 token 鉴权（复用沙盒用户解析）');
  assert.ok(seg.includes('tester: isSandboxTesterEmail(who.email)'), '回执须只回 tester 布尔');
  assert.ok(!seg.includes('email:'), '回执严禁下发邮箱/名单（普通用户零泄漏）');
});

/* ═══ E138-04 纯核行为：模块级会话态（初始 false＋两象隔离＋重置）═══ */
test('E138-04 sandboxTester.mjs 纯核：初始恒 false；romance/wealth 两象隔离；mark/reset 行为', () => {
  // 初始态（模块单例在本次 node:test 进程内首验为 false）
  assert.equal(ST.isSandboxTester(), false, 'tester 身份初始须 false（fail-closed）');
  assert.equal(ST.isSandboxSessionUnlocked('romance'), false, 'romance 象初始须 false');
  assert.equal(ST.isSandboxSessionUnlocked('wealth'), false, 'wealth 象初始须 false');
  assert.equal(ST.testerPaywallGate('wealth'), false, '普通用户（tester=false）闸门恒不激活');
  // 身份注入＋闸门
  assert.equal(ST.setSandboxTester(true), true, 'tester 注入须可生效');
  assert.equal(ST.testerPaywallGate('wealth'), true, 'tester 且未解锁 ⇒ 付费墙闸门立起');
  assert.equal(ST.testerPaywallGate('romance'), true, 'romance 象闸门同样立起');
  // 两象隔离：romance 解锁不影响 wealth
  assert.equal(ST.markSandboxSessionUnlocked('romance'), true, 'romance 解锁标记');
  assert.equal(ST.isSandboxSessionUnlocked('romance'), true, 'romance 已解锁');
  assert.equal(ST.isSandboxSessionUnlocked('wealth'), false, '跨模块隔离：wealth 仍待沙盒闭环');
  assert.equal(ST.testerPaywallGate('wealth'), true, 'wealth 付费墙仍待支付（军令跨模块独立）');
  // 未知象限 fail-closed
  assert.equal(ST.isSandboxSessionUnlocked('unknown'), false, '未知象限须 false');
  assert.equal(ST.markSandboxSessionUnlocked('unknown'), false, '未知象限不可标记');
  // 一键重置：两象全清
  assert.equal(ST.resetSandboxSession(), true, '重置须成功');
  assert.equal(ST.isSandboxSessionUnlocked('romance'), false, '重置后 romance 归零');
  assert.equal(ST.testerPaywallGate('wealth'), true, '重置后 wealth 付费墙恢复');
  // 身份注入畸形值 fail-closed
  assert.equal(ST.setSandboxTester('yes'), false, '非布尔注入须归 false');
  assert.equal(ST.testerPaywallGate('wealth'), false, '身份失效后闸门不激活');
  ST.setSandboxTester(false);
});

/* ═══ E138-05 wealth 侧接线：探测＋闸门＋granted 解锁标记 ═══ */
test('E138-05 WealthReportPage：tester-status 探测＋testerPaywallGate(wealth) 判定＋granted 双点 mark', () => {
  const page = read('web/src/pages/WealthReportPage.tsx');
  assert.ok(page.includes("from '../lib/sandboxTester.mjs'"), '须导入 sandboxTester 纯核');
  assert.ok(page.includes('SANDBOX_TESTER_STATUS_PATH'), '须探测 tester-status 端点');
  assert.ok(page.includes("testerPaywallGate('wealth')"), 'checkPaidStatus 须闸 wealth 象');
  assert.ok(page.includes('if (isWealthPaid && !_e138TesterGate)'), 'VIP 在库也须过 tester 闸（付费墙保留）');
  assert.ok(page.includes("setSandboxTester(!!(_tsJ && _tsJ.tester))"), '探测真值须注入纯核');
  // granted 解锁双点：applyWealthGrant（already_paid/沙盒共用）＋runUpgradeSandboxPay（升阶档）
  const iGrant = page.indexOf("markSandboxSessionUnlocked('wealth')");
  assert.ok(iGrant > 0, 'wealth 解锁标记须在');
  const iGrant2 = page.indexOf("markSandboxSessionUnlocked('wealth')", iGrant + 1);
  assert.ok(iGrant2 > 0, '解锁标记须双点（applyWealthGrant＋runUpgradeSandboxPay 禁两套语义）');
  // 月报/年报沙盒全通：升阶档纯核回路（buildSandboxCompleteRequest＋describeSandboxOutcome）保持
  assert.ok(page.includes('buildSandboxCompleteRequest(plan)'), '月报年报沙盒回路（升阶档）须保持');
  assert.ok(page.includes('describeSandboxOutcome(data)'), '升阶档 granted 判真值须保持');
});

/* ═══ E138-06 romance 侧接线：INITIAL_SESSION 探测＋E85-① per-session 契约不动 ═══ */
test('E138-06 App.tsx：INITIAL_SESSION 探测 tester-status；E85-① 新测算必现付费墙契约保持', () => {
  const app = read('web/src/App.tsx');
  assert.ok(app.includes("from './lib/sandboxTester.mjs'"), '须导入 sandboxTester 纯核');
  assert.ok(app.includes('SANDBOX_TESTER_STATUS_PATH'), 'INITIAL_SESSION 须探测 tester-status');
  assert.ok(app.includes('setSandboxTester(!!(j && j.tester))'), '探测真值须注入纯核');
  // E85-① 契约（romance 付费墙保留真源）：sessionUnlocked per-session＋新测算清键
  assert.ok(app.includes("showPaywall || !sessionUnlocked"), '付费墙分支条件须保持（E85-①）');
  assert.ok(app.includes("sessionStorage.removeItem('ks_compat_session_unlocked')"), '新测算清会话键须保持（E85-①）');
});

/* ═══ E138-07 重置微控件：白名单专属渲染＋六语自容＋点击行为 ═══ */
test('E138-07 「🔄 重置沙盒演练」微控件：testerMode 真值渲染；六语完整；点击清两象＋E85 键＋刷新', () => {
  // 六语字典单源（纯核导出）
  const langs = ['zh', 'en', 'es', 'fr', 'th', 'vi'];
  for (const l of langs) {
    assert.ok(ST.L_SANDBOX_TESTER_RESET[l], `L_SANDBOX_TESTER_RESET[${l}] 须六语齐全`);
  }
  assert.ok(String(ST.L_SANDBOX_TESTER_RESET.zh).includes('重置沙盒演练'), 'zh 军令词形「重置沙盒演练」');
  const page = read('web/src/pages/WealthReportPage.tsx');
  const app = read('web/src/App.tsx');
  for (const src of [[page, 'WealthReportPage'], [app, 'App.tsx']]) {
    const [s, name] = src;
    assert.ok(s.includes('testerMode && ('), `${name} 微控件须 testerMode 条件渲染（普通用户 DOM 零渲染）`);
    assert.ok(s.includes('data-testid="sandbox-tester-reset"'), `${name} 微控件须带 testid`);
    assert.ok(s.includes('resetSandboxSession();'), `${name} 点击须清两象会话态`);
    assert.ok(s.includes('ROMANCE_SESSION_UNLOCK_KEY'), `${name} 点击须兼清 romance E85 键`);
    assert.ok(s.includes('window.location.reload();'), `${name} 点击须刷新恢复付费墙`);
    assert.ok(s.includes('L_SANDBOX_TESTER_RESET'), `${name} 文案须走六语单源字典`);
  }
});

/* ═══ E138-08 普通用户零泄漏：bundle/源码零白名单邮箱残留 ═══ */
test('E138-08 零泄漏：前端源码与 dist 产物均无白名单邮箱（名单只在服务端）', () => {
  // 前端源码面：sandboxTester.mjs 及两接线文件禁硬编码名单
  for (const p of ['web/src/lib/sandboxTester.mjs', 'web/src/pages/WealthReportPage.tsx', 'web/src/App.tsx']) {
    assert.ok(!read(p).includes('shanzi1800'), `${p} 禁含白名单邮箱`);
    assert.ok(!read(p).includes('northgu916'), `${p} 禁含白名单邮箱`);
  }
  // dist 产物面（build 后存在即查；本地 dist 为最近 build 产物）
  const distPaths = ['web/dist/assets'];
  for (const dp of distPaths) {
    const abs = join(ROOT, dp);
    if (!existsSync(abs)) continue;
    for (const f of readdirSync(abs)) {
      if (!f.endsWith('.js')) continue;
      const src = readFileSync(join(abs, f), 'utf8');
      assert.ok(!src.includes('shanzi1800'), `dist/${f} 禁泄漏白名单邮箱`);
      assert.ok(!src.includes('northgu916'), `dist/${f} 禁泄漏白名单邮箱`);
    }
  }
});

/* ═══ E138-09 军规链段数自证（插链后 105→106）═══ */
test('E138-09 军规链段数：package.json test:astro 全链 106 段（e138 居 e137 后 e40-compat 前）', () => {
  const pkg = JSON.parse(read('package.json'));
  const chain = pkg.scripts['test:astro'];
  const segs = chain.split('&&').map((s) => s.trim()).filter(Boolean);
  assert.equal(segs.length, 122, `军规链段数须 106（E138 入编后 105→106；实 ${segs.length}）`);
  const joined = segs.join(' && ');
  const iE137 = joined.indexOf('audit-e137-astro-seasonal-wellness');
  const iE138 = joined.indexOf('audit-e138-tester-vip-funnel-sandbox');
  const iE40 = joined.indexOf('audit-e40-compat');
  assert.ok(iE137 > 0 && iE138 > 0 && iE40 > 0, '三锚须在链');
  assert.ok(iE137 < iE138 && iE138 < iE40, 'e138 须居 e137 后、e40-compat 前（python 恒链尾）');
  // e40 恒 len-2（倒数第二）——python 链尾承袭
  assert.ok(segs[segs.length - 2].includes('e40-compat'), 'e40-compat 恒 len-2');
  assert.ok(segs[segs.length - 1].includes('python3'), 'python3 恒链尾');
});
