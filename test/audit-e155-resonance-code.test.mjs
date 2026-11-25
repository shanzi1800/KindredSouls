// 🤝 E155（主公军令 2026-11-25）：Resonance Code 缘分密码闸门 —— 双盘真理锁 / 缺分钟显式降级 /
//   A/B 视角独立生成 / 订单级幂等 / 第三方零泄漏 / E139-P2 样本纯净 / 前端零 window.open 零独立对话窗。
//   零网络 / 零 LLM / 零子进程（callAI 与 db 全注入）。

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(resolve(REPO, p), 'utf8');
const SERVER = read('server.js');
const mod = (p) => import(pathToFileURL(resolve(REPO, p)).href);

const CORE = await mod('lib/resonance/resonanceCore.mjs');
const PR = await mod('lib/resonance/resonancePrompt.mjs');
const API = await mod('api/resonance.js');
const SB = await mod('lib/sandboxPayment.mjs');
const DICT = await mod('web/src/lib/resonanceI18n.mjs');
const CLI = await mod('web/src/lib/resonanceClient.mjs');
const WSB = await mod('web/src/lib/sandboxCheckout.mjs');

const between = (src, from, to) => {
  const i = src.indexOf(from);
  assert.ok(i !== -1, `锚缺失：${from}`);
  const j = src.indexOf(to, i + from.length);
  assert.ok(j !== -1, `锚缺失：${to}`);
  return src.slice(i, j);
};
const window9000 = (src, anchor) => { const i = src.indexOf(anchor); assert.ok(i !== -1, `锚缺失：${anchor}`); return src.slice(i, i + 9000); };
const stripJs = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1');

const A = { name: '林川', birthDate: '1992-08-21', birthTime: '14:20', city: '杭州', lat: 30.27, lon: 120.15, tz: 'Asia/Shanghai' };
const B = { name: 'Mira', birthDate: '1994-02-09', birthTime: '', city: 'Lyon', lat: 45.76, lon: 4.84, tz: 'Europe/Paris' };
const LON_A = { Sun: 148.2, Moon: 231.7, Mercury: 172.4, Venus: 126.9, Mars: 141.1, Jupiter: 166.3, Saturn: 318.5, Uranus: 282.9, Neptune: 281.1, Pluto: 224.6 };
const LON_B = { Sun: 320.4, Mercury: 339.2, Venus: 12.8, Mars: 251.9, Jupiter: 211.5, Saturn: 331.7, Uranus: 355.4, Neptune: 298.8, Pluto: 243.6 }; // 无 Moon（date_level 剔除）
const sideA = { planetLongitudes: LON_A, birthTimeKnown: true, sunSign: 'Leo', moonSign: 'Scorpio', ascSign: 'Cancer', planetHouses: { Sun: 2 } };
const sideB = { planetLongitudes: LON_B, birthTimeKnown: false, sunSign: 'Aquarius', moonSign: 'Cancer', ascSign: null, planetHouses: {} };

const GOOD_EN = JSON.stringify({ keywords: ['steady rhythm', 'shared horizon', 'quiet trust'], sections: [{ title: 'How you meet', body: 'You bring a steady rhythm to this bond. '.repeat(4) }, { title: 'Where you grow', body: 'Side by side you calibrate toward the same horizon. '.repeat(4) }], closing: 'Keep walking together.' });

function fakeService(overrides) {
  const db = CORE.createMemoryResonanceDb();
  const calls = [];
  const svc = API.createResonanceService(Object.assign({
    db,
    computeTruth: async () => ({ sideA, sideB, syn: { available: true }, synBlock: 'harmonious=3 hard=1' }),
    callAI: async (system, user) => { calls.push({ system, user }); return GOOD_EN; },
    log: { log() {}, warn() {}, error() {} },
  }, overrides || {}));
  return { db, calls, svc };
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function settle(svc) { for (let i = 0; i < 40 && svc.inflight.size > 0; i++) await wait(10); await wait(5); }

/* ═══════ 一 · 令牌 / 档案 / 状态机 ═══════ */
test('E155-1 邀请令牌：24 位 URL-safe 高熵；畸形一律归空（绝不猜测纠正）', () => {
  const seen = new Set();
  for (let i = 0; i < 200; i++) {
    const t = CORE.generateInviteToken();
    assert.match(t, /^[A-Za-z0-9_-]{24}$/);
    seen.add(t);
  }
  assert.equal(seen.size, 200, '令牌不得碰撞');
  assert.equal(CORE.normalizeInviteToken('short'), '');
  assert.equal(CORE.normalizeInviteToken('a'.repeat(25)), '');
  assert.equal(CORE.normalizeInviteToken('has space in token!!!!!'), '');
  assert.equal(CORE.normalizeInviteToken(123), '');
  assert.equal(CORE.normalizeInviteToken('abCD-_12abCD-_12abCD-_12'), 'abCD-_12abCD-_12abCD-_12');
});

test('E155-2 档案净化：白名单式（业务线字段穿透不了）；未知分钟 ⇒ birthTime ""', () => {
  const p = CORE.sanitizePersonProfile(Object.assign({}, A, { insight: 'x', paid_plans: {}, report: 'leak', birthTime: '25:99', name: '  '.concat('n'.repeat(60)) }));
  assert.equal(Object.keys(p).some((k) => ['insight', 'paid_plans', 'report'].includes(k)), false);
  assert.equal(p.birthTime, '', '非法时间归空');
  assert.equal(p.name.length, 40);
  assert.equal(CORE.sanitizePersonProfile(Object.assign({}, B)).birthTime, '');
  assert.equal(CORE.personProfileComplete({ birthDate: '2023-02-30' }), false, '非法日期不可建盘');
  assert.equal(CORE.personProfileComplete(A), true);
});

test('E155-3 状态机 fail-closed：ready 为终态；非法跃迁一律 false', () => {
  assert.equal(CORE.canTransitionReport('awaiting_payment', 'generating'), true);
  assert.equal(CORE.canTransitionReport('awaiting_partner', 'generating'), true);
  assert.equal(CORE.canTransitionReport('generating', 'ready'), true);
  assert.equal(CORE.canTransitionReport('generating', 'failed'), true);
  assert.equal(CORE.canTransitionReport('failed', 'generating'), true);
  assert.equal(CORE.canTransitionReport('ready', 'generating'), false, 'ready 终态');
  assert.equal(CORE.canTransitionReport('ready', 'failed'), false);
  assert.equal(CORE.canTransitionReport('bogus', 'ready'), false);
  assert.equal(CORE.canTransitionReport('awaiting_partner', 'ready'), false);
  assert.equal(CORE.RESONANCE_REPORT_STATUS.length, 5);
});

/* ═══════ 二 · DB 适配（PostgREST 条件 PATCH 语义 ↔ 内存假库）═══════ */
test('E155-4 PostgREST 适配：条件 PATCH 谓词入 URL（认领/置付/报告落库皆以谓词锁行）', async () => {
  const reqs = [];
  const fakeFetch = async (url, init) => { reqs.push({ url, init }); return { ok: true, status: 200, json: async () => [{ ...row, ...JSON.parse(init.body || '{}') }] }; };
  let row = { id: 'r1', invite_token: 'abCD-_12abCD-_12abCD-_12', scene: 'romance', locale: 'zh', payer_user_id: 'u-a', payment_status: 'pending', report_status: 'awaiting_payment', person_a_profile: A };
  const env = { SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_KEY: 'k' };
  const db = CORE.createPostgrestResonanceDb({ env: () => env, fetch: fakeFetch });
  const T = 'abCD-_12abCD-_12abCD-_12';
  const c = await db.claim(T, 'u-b', B);
  assert.equal(c.ok, true);
  assert.ok(reqs[0].url.includes(`invite_token=eq.${T}`), '令牌谓词');
  assert.ok(reqs[0].url.includes('claimed_by_user_id=is.null'), '认领条件谓词');
  assert.equal(reqs[0].init.method, 'PATCH');
  assert.equal(reqs[0].init.headers.Prefer, 'return=representation');
  assert.equal(reqs[0].init.headers.apikey, 'k');
  row = { ...row, claimed_by_user_id: 'u-b' };
  const m = await db.markPaid(T);
  assert.equal(m.ok, true);
  assert.ok(reqs[1].url.includes('payment_status=eq.pending'), '置付条件谓词');
  const s = await db.setReportStatus(T, 'awaiting_payment', 'generating');
  assert.equal(s.ok, true);
  assert.ok(reqs[2].url.includes('report_status=eq.awaiting_payment'), '报告状态条件谓词');
  assert.equal((await db.setReportStatus(T, 'ready', 'generating')).ok, false, '终态不可回退');
  assert.equal(reqs.length, 3, '非法跃迁不发请求');
  const bad = await db.markPaid('nope');
  assert.equal(bad.ok, false);
  assert.equal(reqs.length, 3, '畸形令牌不发请求');
  // 0 行回表 ⇒ 失败（PostgREST 对不存在行 PATCH 返回空数组）
  const empty = CORE.createPostgrestResonanceDb({ env: () => env, fetch: async () => ({ ok: true, status: 200, json: async () => [] }) });
  assert.equal((await empty.markPaid(T)).ok, false, '0 行 ⇒ 未置付');
});

test('E155-5 内存假库与 PostgREST 适配语义对齐（同剧本同结果）', async () => {
  const mem = CORE.createMemoryResonanceDb();
  const T = 'abCD-_12abCD-_12abCD-_12';
  const base = { invite_token: T, scene: 'business', locale: 'en', payer_user_id: 'u-a', person_a_profile: A, person_b_profile: null, payment_status: 'pending', report_status: 'awaiting_payment' };
  assert.ok(await mem.insert(base));
  assert.equal(await mem.insert(base), null, '唯一索引：重复令牌插入失败');
  assert.equal((await mem.claim(T, 'u-a', B)).ok, true);
  assert.equal((await mem.claim(T, 'u-c', B)).ok, false, '二次认领被拒');
  assert.equal((await mem.markPaid(T)).changed, true);
  assert.equal((await mem.markPaid(T)).changed, undefined, '置付幂等');
  assert.equal((await mem.setReportStatus(T, 'awaiting_payment', 'generating')).ok, true);
  assert.equal((await mem.setReportStatus(T, 'awaiting_payment', 'generating')).ok, false, 'from 态不符 ⇒ 0 行');
});

/* ═══════ 三 · 隐私投影 ═══════ */
test('E155-6 隐私投影：第三方/匿名只见信封；受邀人仅多一个布尔；当事人各取其报告', async () => {
  const { svc } = fakeService();
  const o = await svc.createOrder({ scene: 'romance', locale: 'zh', personA: A, personB: B, userId: 'u-a' });
  const T = o.order.inviteToken;
  const env = await svc.envelope(T);
  assert.deepEqual(Object.keys(env).sort(), ['claimable', 'found', 'locale', 'paid', 'scene'], '信封零姓名零生辰');
  const vA = (await svc.view(T, 'u-a')).view;
  assert.equal(vA.role, 'payer');
  assert.equal(vA.self.name, '林川');
  assert.equal(vA.report, null, '非 ready 态零正文');
  const inv = (await svc.view(T, 'u-x')).view;
  assert.equal(inv.role, 'invitee');
  assert.equal(inv.partnerPrefilled, true);
  assert.equal(JSON.stringify(inv).includes('林川'), false, '受邀人不见 A 姓名');
  assert.equal(JSON.stringify(inv).includes('1992-08-21'), false, '受邀人不见 A 生辰');
  assert.equal((await svc.claim(T, 'u-a', null)).code, 'payer_cannot_claim', 'A 开自己的链接不算认领');
  const c = await svc.claim(T, 'u-x', null);
  assert.equal(c.view.role, 'claimant');
  assert.equal(c.view.partnerName, '林川');
  assert.equal(JSON.stringify(c.view).includes('1992-08-21'), false, '认领人不见 A 生辰');
  const third = (await svc.view(T, 'u-z')).view;
  assert.equal(third.role, 'third_party');
  assert.equal(JSON.stringify(third).includes('Mira'), false, '第三方零泄漏');
  assert.equal((await svc.claim(T, 'u-z', B)).code, 'already_claimed');
});

/* ═══════ 四 · 全链剧本（路径 1 / 路径 2 / 幂等 / 失败）═══════ */
test('E155-7 路径 1：A 已知 B 生辰 ⇒ 付讫即双盘生成 ⇒ A 得 Report A；webhook 重放幂等', async () => {
  const { svc, calls } = fakeService();
  const o = await svc.createOrder({ scene: 'romance', locale: 'en', personA: A, personB: B, userId: 'u-a' });
  const T = o.order.inviteToken;
  assert.equal(o.order.reportStatus, 'awaiting_payment');
  const p1 = await svc.onPaid(T);
  assert.equal(p1.changed, true);
  await settle(svc);
  const v = (await svc.view(T, 'u-a')).view;
  assert.equal(v.reportStatus, 'ready');
  assert.equal(v.report.perspective, 'a');
  assert.equal(v.report.truth.a.sunSign, 'Leo');
  assert.equal(v.report.precision, 'date_level', 'B 缺分钟 ⇒ 整体显式降级');
  assert.equal(v.report.truth.b.ascSign, null, '缺分钟 ⇒ 上升未知（绝不伪造）');
  assert.equal(v.report.truth.b.moonSign, null);
  assert.equal(calls.length, 2, 'A/B 独立各一次调用');
  assert.match(calls[0].system, /writing for Person A/);
  assert.match(calls[1].system, /writing for Person B/);
  assert.notEqual(calls[0].system, calls[1].system, '双视角独立 Prompt（非改人称）');
  const p2 = await svc.onPaid(T);
  assert.equal(p2.changed, false, '重放不重复置付');
  await settle(svc);
  assert.equal(calls.length, 2, '重放不重复生成');
  const c = await svc.claim(T, 'u-b', null);
  assert.equal(c.view.report.perspective, 'b', 'B 零付费认领即得 Report B');
});

test('E155-8 路径 2：A 不知 B 生辰 ⇒ awaiting_partner ⇒ B 自填认领 ⇒ 双盘同时落库 ⇒ A 刷新解锁', async () => {
  const { svc, calls } = fakeService();
  const o = await svc.createOrder({ scene: 'friendship', locale: 'zh', personA: A, personB: null, userId: 'u-a' });
  const T = o.order.inviteToken;
  await svc.onPaid(T);
  assert.equal((await svc.view(T, 'u-a')).view.reportStatus, 'awaiting_partner');
  assert.equal(calls.length, 0, 'B 未填不生成');
  assert.equal((await svc.claim(T, 'u-b', null)).code, 'bad_profile_b', '路径 2 必须自填生辰');
  const c = await svc.claim(T, 'u-b', B);
  assert.equal(c.view.role, 'claimant');
  await settle(svc);
  const vA = (await svc.view(T, 'u-a')).view;
  const vB = (await svc.view(T, 'u-b')).view;
  assert.equal(vA.reportStatus, 'ready');
  assert.equal(vA.report.perspective, 'a');
  assert.equal(vB.report.perspective, 'b');
  assert.equal(calls.length, 2);
});

test('E155-9 生成失败 fail-closed：模型不可解析 ⇒ failed（零伪造报告）；坏词 ⇒ 一次重试后仍坏 ⇒ failed', async () => {
  const s1 = fakeService({ callAI: async () => '抱歉，我无法完成。' });
  const o = await s1.svc.createOrder({ scene: 'business', locale: 'en', personA: A, personB: B, userId: 'u-a' });
  await s1.svc.onPaid(o.order.inviteToken);
  await settle(s1.svc);
  const v = (await s1.svc.view(o.order.inviteToken, 'u-a')).view;
  assert.equal(v.reportStatus, 'failed');
  assert.equal(v.report, null);
  const dirty = JSON.stringify({ keywords: ['x'], sections: [{ title: 't', body: 'You should buy Bitcoin now and trust in God. '.repeat(5) }, { title: 'u', body: 'ok '.repeat(20) }] });
  let n = 0;
  const s2 = fakeService({ callAI: async () => { n += 1; return dirty; } });
  const o2 = await s2.svc.createOrder({ scene: 'business', locale: 'en', personA: A, personB: B, userId: 'u-a' });
  await s2.svc.onPaid(o2.order.inviteToken);
  await settle(s2.svc);
  assert.equal((await s2.svc.view(o2.order.inviteToken, 'u-a')).view.reportStatus, 'failed');
  assert.equal(n, 4, '每视角一次重试');
});

/* ═══════ 五 · 真理锁 / 纯净锁 ═══════ */
test('E155-10 双盘 10 行星真理锁：逐颗列真值；缺值写 unknown；缺分钟侧上升/宫位显式未知并带降级声明', () => {
  const p = PR.buildResonancePrompts({ scene: 'romance', locale: 'zh', profileA: A, profileB: B, sideA, sideB, synBlock: '' });
  const a = p.systemA;
  for (const pl of PR.RESONANCE_PLANETS) {
    assert.ok(a.includes(`- ${pl}: ${PR.signOfLongitude(LON_A[pl])}`), `A 侧行星 ${pl} 星座须来自黄经真值`);
  }
  assert.ok(a.includes('- Sun: Aquarius'), 'B 侧太阳真值');
  assert.ok(a.includes('- Moon: unknown'), 'B 侧月亮缺值 ⇒ unknown（绝不编造）');
  assert.ok(a.includes('- Ascendant: unknown'), 'B 缺分钟 ⇒ 上升未知');
  assert.ok(a.includes('DEGRADATION NOTICE: Person B'), '显式降级声明');
  assert.ok(!a.includes('DEGRADATION NOTICE: Person A'), '有分钟侧不降级');
  assert.ok(a.includes('- Ascendant: Cancer'), 'A 有分钟 ⇒ 上升真值');
  assert.ok(a.includes('Sun=2'), '宫位映射仅在有分钟侧出现');
  assert.equal(PR.signOfLongitude(359.9), 'Pisces');
  assert.equal(PR.signOfLongitude(0), 'Aries');
  assert.equal(PR.signOfLongitude('x'), 'unknown');
  assert.match(a, /Write ENTIRELY in Simplified Chinese/, '语种锁定');
  assert.match(a, /Face to face, witnessing each other's light\./, 'romance 基调');
  const biz = PR.buildResonancePrompts({ scene: 'business', locale: 'en', profileA: A, profileB: B, sideA, sideB, synBlock: '' }).systemA;
  assert.match(biz, /No specific financial or investment advice/, 'business 场景金融建议禁令');
  const fr = PR.buildResonancePrompts({ scene: 'friendship', locale: 'fr', profileA: A, profileB: B, sideA, sideB, synBlock: '' }).systemB;
  assert.match(fr, /No romantic framing/, 'friendship 场景边界');
  for (const bad of ['Agape', 'C.S. Lewis', 'Four Loves', 'four loves', 'Lewis']) assert.ok(!(a + biz + fr).includes(bad), `Prompt 不得出现外部专名 ${bad}`);
});

test('E155-11 纯净锁：宗教说教/外部专名/金融买卖建议全语种拦截；单语（非 zh 零 CJK）；西语 sin 不误伤', () => {
  const bad = [
    'This bond reflects agape love.', 'As C.S. Lewis wrote', 'the Four loves', '四种爱的智慧', '路易斯说',
    'Trust in God and pray.', '耶稣祝福你们', '你应买入这只股票', 'Buy bitcoin now', 'guaranteed returns', '保证收益稳赚',
    '作为一个AI我认为', 'ความรัก', 'これは',
  ];
  for (const s of bad) assert.equal(PR.checkResonancePurity(s, 'en').ok, false, `应拦截：${s}`);
  assert.equal(PR.checkResonancePurity('En español: sin ti no hay horizonte.', 'es').ok, true, '西语 sin 不得误伤');
  assert.equal(PR.checkResonancePurity('Side by side, aligned toward one horizon.', 'en').ok, true);
  assert.equal(PR.checkResonancePurity('无需设防，何时何地一见如故', 'zh').ok, true);
  assert.equal(PR.checkResonancePurity('Une chaleur sans armure', 'fr').ok, true);
  assert.equal(PR.checkResonancePurity('อบอุ่นไร้เกราะ', 'th').ok, true);
  assert.equal(PR.checkResonancePurity('Ấm áp không phòng bị', 'vi').ok, true);
  assert.equal(PR.checkResonancePurity('This is 中文', 'en').ok, false, '英文报告混入中文');
  assert.equal(PR.checkResonancePurity('Thái อบอุ่น', 'en').ok, false);
  assert.equal(PR.checkResonancePurity('ร่วม 中文', 'th').ok, false);
  assert.equal(PR.checkResonancePurity('温暖 温暖', 'zh').ok, true);
});

test('E155-12 模型 JSON 宽容解析：围栏/前后缀可容；缺段 ⇒ null（绝不落伪造）', () => {
  const ok = PR.parseResonanceReport('```json\n' + GOOD_EN + '\n```');
  assert.equal(ok.keywords.length, 3);
  assert.equal(ok.sections.length, 2);
  assert.equal(PR.parseResonanceReport('{"keywords":["a"]}'), null);
  assert.equal(PR.parseResonanceReport('not json'), null);
  assert.equal(PR.parseResonanceReport(''), null);
});

/* ═══════ 六 · 沙盒五段链透传 ═══════ */
test('E155-13 沙盒五段链：resonance_token 贯穿会话 path/metadata → 事件 metadata → 收银台请求体；缺省形态零变', () => {
  const T = 'abCD-_12abCD-_12abCD-_12';
  const s = SB.buildSandboxSession({ plan: 'resonance', userId: 'u1', origin: 'https://k.online', nonce: 'n1', resonanceToken: T });
  assert.ok(s.path.includes('&resonance_token=' + T));
  assert.equal(s.metadata.resonance_token, T);
  const d = SB.buildSignedSandboxDispatch({ secret: 's', plan: 'resonance', userId: 'u1', origin: 'https://k.online', now: new Date(0), nonce: 'n2', resonanceToken: T });
  assert.equal(d.event.data.object.metadata.resonance_token, T);
  const legacy = SB.buildSandboxSession({ plan: 'wealth_once', userId: 'u1', origin: 'https://k.online', nonce: 'n3' });
  assert.equal(Object.prototype.hasOwnProperty.call(legacy.metadata, 'resonance_token'), false, '旧形态不挂键');
  assert.equal(legacy.path.includes('resonance_token'), false);
  const body = WSB.buildSandboxCompleteRequest('resonance', '', '', T).body;
  assert.equal(body.resonance_token, T);
  assert.deepEqual(WSB.buildSandboxCompleteRequest('wealth_once').body, { plan: 'wealth_once' }, '旧契约逐字不变');
  assert.equal(WSB.SANDBOX_PLAN_PRICE.resonance, '$9.99');
  assert.equal(CLI.resonanceTokenFromSearch('?plan=resonance&session=x&resonance_token=' + T), T);
  assert.equal(CLI.resonanceTokenFromSearch('?resonance_token=bad'), '');
});

/* ═══════ 七 · server.js / 前端 静态闸门 ═══════ */
test('E155-14 server.js：价目表 + create-checkout 令牌守卫（沙盒分支前 400 / 分支后 PENDING）+ metadata + webhook 订单级幂等分支', () => {
  assert.ok(/resonance:\s+process\.env\.STRIPE_PRICE_RESONANCE \|\| 'price_E155ResonancePENDING'/.test(SERVER), '价目表 resonance 键（env 优先 PENDING 占位）');
  const CO = window9000(SERVER, "app.post('/api/create-checkout'");
  const iGuard = CO.indexOf("if (plan === 'resonance' && !resonanceToken) return res.status(400)");
  const iBranch = CO.indexOf('isSandboxPaymentMode(process.env)');
  const iStripe = CO.indexOf("await import('stripe')");
  assert.ok(iGuard !== -1 && iGuard < iBranch, '令牌守卫须在沙盒分支之前（两态皆拒裸单）');
  const iPend = CO.indexOf("if (plan === 'resonance' && String(priceId).indexOf('PENDING') !== -1)");
  assert.ok(iPend > iBranch && iPend < iStripe, 'PENDING 守卫在沙盒 return 之后、Stripe 下单之前');
  assert.equal((CO.match(/isSandboxPaymentMode\(process\.env\)/g) || []).length, 1, 'CO_SEG 沙盒闸门字面量恒 1');
  assert.ok(CO.includes('resonanceToken ? { resonance_token: resonanceToken } : {}'), 'Stripe metadata 携令牌');
  assert.ok(CO.includes('success_url: _e155Success || successUrl || defaultSuccess'), '缘分密码成功回跳恒定受邀页');
  assert.ok(CO.includes('${origin}/invite/${resonanceToken}?payment=success'));
  assert.ok(CO.includes('resonanceToken, // 🤝 E155'), '沙盒会话携令牌');

  const SBX = between(SERVER, '// ── 🧪 Gate 45-A：沙盘支付端点', '// ── /api/create-checkout ──');
  assert.ok(SBX.includes('normalizeInviteToken((req.body || {}).resonance_token)'), 'complete 端点读令牌');
  assert.ok(SBX.includes('_e131ChartSig, _e148ComboSig, _e155Token)'), '派发透传令牌');
  assert.ok(SBX.includes('async function _sandboxDispatch(req, plan, userId, email, chartSig, comboSig, resonanceToken)'));
  assert.ok(SBX.includes('resonanceToken: resonanceToken || undefined'));
  assert.ok(!stripJs(SBX).includes('paid_plans'), 'Gate 45-A 禁直写权益仍守');

  const HK = window9000(SERVER, "app.post('/api/webhook'");
  const iRes = HK.indexOf("if (plan === 'resonance') return handleResonanceWebhook(res, session, _e155Service);");
  assert.ok(iRes !== -1, 'webhook 分支在场');
  assert.ok(iRes < HK.indexOf('paid_plans: updatedPlans'), '分支先于权益落库（不写 paid_plans 位）');
  assert.ok(HK.includes("method: 'PATCH'") && HK.includes("method: 'POST'"), '封仓三要素守恒');

  assert.ok(SERVER.includes("import { createResonanceService, createResonanceTruthCalc, mountResonance, handleResonanceWebhook, normalizeInviteToken } from './api/resonance.js';"));
  const iMount = SERVER.indexOf('mountResonance(app, _e155Service, { auth: _e155ResolveUser });');
  assert.ok(iMount !== -1 && iMount < SERVER.indexOf("app.use('/api/ai-advisor'"), '路由挂载先于 ai-advisor（其后禁插中间件）');
  assert.equal((SERVER.match(/ENTITLEMENT_REQUIRED/g) || []).length, 4, '402 哨兵位点守恒（resonance 未复用）');
});

test('E155-15 webhook 置付：无令牌跳过；有令牌订单级幂等（changed 翻转一次）', async () => {
  const { svc } = fakeService();
  const mk = () => { const o = { code: 0, body: null }; return { o, res: { status(c) { o.code = c; return this; }, json(b) { o.body = b; return this; } } }; };
  let r = mk();
  await API.handleResonanceWebhook(r.res, { metadata: { plan: 'resonance', supabase_user_id: 'u-a' } }, svc);
  assert.deepEqual(r.o.body, { received: true, skipped: 'no_resonance_token' });
  const o = await svc.createOrder({ scene: 'romance', locale: 'en', personA: A, personB: B, userId: 'u-a' });
  const sess = { metadata: { plan: 'resonance', supabase_user_id: 'u-a', resonance_token: o.order.inviteToken } };
  r = mk(); await API.handleResonanceWebhook(r.res, sess, svc);
  assert.equal(r.o.body.changed, true);
  await settle(svc);
  r = mk(); await API.handleResonanceWebhook(r.res, sess, svc);
  assert.deepEqual(r.o.body, { received: true, resonance: true, changed: false }, '重放 ⇒ 幂等回执');
});

test('E155-16 路由层：建单/查看/认领三端点鉴权 fail-closed；认领冲突 409；付款人不可自领', async () => {
  const { svc } = fakeService();
  const routes = {};
  const app = { post: (p, h) => { routes[p] = h; }, get: (p, h) => { routes[p] = h; } };
  const tokens = { good: 'u-a', b: 'u-b', z: 'u-z' };
  const auth = async (req) => (req.auth && tokens[req.auth] ? { userId: tokens[req.auth], email: null } : { error: 401, message: 'Not authenticated' });
  API.mountResonance(app, svc, { auth });
  assert.deepEqual(Object.keys(routes).sort(), ['/api/resonance/claim', '/api/resonance/invite/:token', '/api/resonance/order', '/api/resonance/order/:token']);
  const mk = (req) => { const o = { code: 200, body: null }; return { o, res: { status(c) { o.code = c; return this; }, json(b) { o.body = b; return this; } } }; };
  let r = mk(); await routes['/api/resonance/order']({ body: { scene: 'romance', personA: A } }, r.res);
  assert.equal(r.o.code, 401, '未登录不可建单');
  r = mk(); await routes['/api/resonance/order']({ auth: 'good', body: { scene: 'nope', personA: A } }, r.res);
  assert.equal(r.o.code, 400);
  r = mk(); await routes['/api/resonance/order']({ auth: 'good', body: { scene: 'romance', locale: 'fr', personA: A } }, r.res);
  assert.equal(r.o.code, 200);
  const T = r.o.body.token;
  assert.equal(r.o.body.order.locale, 'fr');
  r = mk(); await routes['/api/resonance/invite/:token']({ params: { token: T } }, r.res);
  assert.equal(r.o.body.scene, 'romance', '受邀函免登录');
  assert.equal(JSON.stringify(r.o.body).includes('林川'), false);
  r = mk(); await routes['/api/resonance/invite/:token']({ params: { token: 'zzz' } }, r.res);
  assert.equal(r.o.code, 404);
  r = mk(); await routes['/api/resonance/order/:token']({ params: { token: T } }, r.res);
  assert.equal(r.o.code, 401, '未登录不可查看');
  r = mk(); await routes['/api/resonance/claim']({ auth: 'good', body: { token: T, personB: B } }, r.res);
  assert.equal(r.o.code, 409, '付款人不可自领');
  r = mk(); await routes['/api/resonance/claim']({ auth: 'b', body: { token: T, personB: B } }, r.res);
  assert.equal(r.o.code, 200);
  r = mk(); await routes['/api/resonance/claim']({ auth: 'z', body: { token: T, personB: B } }, r.res);
  assert.equal(r.o.code, 409, '已被认领');
  r = mk(); await routes['/api/resonance/order/:token']({ auth: 'z', params: { token: T } }, r.res);
  assert.equal(r.o.body.role, 'third_party');
  assert.equal(JSON.stringify(r.o.body).includes('Mira'), false);
});

/* ═══════ 八 · 字典 / 前端 ═══════ */
test('E155-17 六语权威字典：军令钦定 13 键逐字在内联单源；语种列齐六；「密码」不译 Password', () => {
  for (const k of DICT.RESONANCE_MANDATED_KEYS) {
    const row = [DICT.resT('zh', k), DICT.resT('en', k), DICT.resT('fr', k), DICT.resT('es', k), DICT.resT('th', k), DICT.resT('vi', k)];
    assert.ok(row.every((s) => typeof s === 'string' && s.length > 0), `${k} 六语齐全`);
    assert.ok(!row.includes(k), `${k} 不得回落键名`);
    for (const s of row) assert.ok(!/password|mot de passe|contraseña|รหัสผ่าน|mật khẩu/i.test(s), `${k}：「密码」不得译作 Password`);
  }
  assert.equal(DICT.resT('zh', 'res_title'), '缘分密码 · 关系坐标');
  assert.equal(DICT.resT('en', 'res_title'), 'Resonance Code · Relationship Blueprint');
  assert.equal(DICT.resT('fr', 'res_title'), 'Code de Résonance · Cartographie Relationnelle');
  assert.equal(DICT.resT('es', 'res_title'), 'Código de Resonancia · Mapa Relacional');
  assert.equal(DICT.resT('th', 'res_title'), 'รหัสคลื่นชะตา · แผนที่ความสัมพันธ์');
  assert.equal(DICT.resT('vi', 'res_title'), 'Mật Mã Nhân Duyên · Tọa Độ Tương Giao');
  assert.equal(DICT.resT('zh', 'cta_dual_unlock'), '一人解锁，双方各得专属坐标报告');
  assert.equal(DICT.resT('en', 'cta_dual_unlock'), 'Unlock once — both receive a bespoke coordinate report');
  assert.equal(DICT.resT('fr', 'cta_dual_unlock'), 'Un seul accès — chacun reçoit son rapport de coordonnées dédié');
  assert.equal(DICT.resT('es', 'cta_dual_unlock'), 'Un solo desbloqueo — ambos reciben su informe de coordenadas');
  assert.equal(DICT.resT('th', 'cta_dual_unlock'), 'ปลดล็อกครั้งเดียว รับรายงานพิกัดเฉพาะตัวครบทั้งสองฝ่าย');
  assert.equal(DICT.resT('vi', 'cta_dual_unlock'), 'Mở khóa một lần — cả hai cùng nhận báo cáo tọa độ riêng biệt');
  assert.equal(DICT.resT('zh', 'card_quote_wealth'), '财富从不追随焦虑的抓取，它只流向丰盛与善意的方位。');
  assert.equal(DICT.resT('en', 'card_quote_romance'), "True magnetism isn't possession; it is becoming each other's star chart.");
  assert.equal(DICT.resT('th', 'scene_friendship_sub'), 'อบอุ่นไร้เกราะกำบัง คุ้นเคยดั่งรู้จักกันมาเนิ่นนาน');
  assert.equal(DICT.resT('vi', 'card_wealth_badge'), 'Tọa Độ Thịnh Vượng · Dòng Chảy Thiện Tài');
  assert.equal(DICT.resT('es', 'scene_business_sub'), 'Hombro con hombro, alineados hacia un mismo horizonte');
  assert.equal(DICT.resT('fr', 'scene_romance_sub'), "Face à face, révéler l'éclat de l'autre");
  for (const bad of ['agape', 'lewis', 'four loves', '四种爱', '路易斯', 'password']) {
    assert.equal(JSON.stringify(DICT).toLowerCase().includes(bad), false, `字典零禁用词：${bad}`);
  }
  // 非 zh 语种零 CJK（字典自身单语纯净）
  const src = read('web/src/lib/resonanceI18n.mjs');
  const rows = src.match(/^\s+[a-z_]+: \[.*\],$/gm) || [];
  for (const line of rows) {
    const items = line.slice(line.indexOf('[') + 1, -2).match(/'((?:[^'\\]|\\.)*)'|"(?:[^"\\]|\\.)*"/g) || [];
    const vals = items.map((s) => s.slice(1, -1));
    if (vals.length !== 6) continue;
    for (const i of [1, 2, 3, 5]) assert.equal(/[\u3400-\u9fff]/.test(vals[i]), false, `非 zh 列不得含 CJK：${vals[i]}`);
    assert.equal(/[\u0e00-\u0e7f]/.test(vals[4]), true, `th 列须为泰文：${vals[0]}`);
  }
});

test('E155-18 前端军令：新页面零 window.open、零独立对话窗/抽屉；整页重定向；排他路由；泰语防溢出；图标列 48px', () => {
  const dir = ['ResonancePage.tsx', 'ResonanceInvitePage.tsx', 'PersonBirthForm.tsx', 'HappinessCardActions.tsx', 'resonanceCheckoutFlow.ts'];
  for (const f of dir) {
    const s = stripJs(read('web/src/components/resonance/' + f));
    assert.equal(s.includes('window.open'), false, `${f} 禁 window.open`);
    for (const w of ['ChatSheet', 'FamiliarChat', 'ks-fam', 'openChat', 'Drawer']) assert.equal(s.includes(w), false, `${f} 不得挂独立对话窗：${w}`);
  }
  const flow = stripJs(read('web/src/components/resonance/resonanceCheckoutFlow.ts'));
  assert.ok(flow.includes("window.location.href = d.url"), 'Stripe 整页重定向');
  const page = stripJs(read('web/src/components/resonance/ResonancePage.tsx'));
  assert.ok(page.includes("options: { redirectTo: redirectUrl }"), 'OAuth 整页重定向（redirectTo）');
  assert.ok(page.includes('saveResonanceIntent('), '建单意图先行');
  const inv = stripJs(read('web/src/components/resonance/ResonanceInvitePage.tsx'));
  assert.ok(inv.includes("startResonanceLogin('/invite/' + token)"), '认领意图：回场即原邀请函');
  const APP = read('web/src/App.tsx');
  assert.ok(APP.includes('parseResonancePath(window.location.pathname)'), 'App 排他路由接线');
  assert.ok(APP.indexOf('resonanceRoute ? (') < APP.indexOf('devAmuletRoute && AmuletPlayground ? ('), 'E155 路由先于 DEV 块');
  assert.ok(APP.includes('id="rs-entry-link"'), '首页入口');
  const CSS = read('web/src/resonance.css');
  assert.ok(CSS.includes('grid-template-columns: 48px 1fr'), '图标列固定 48px');
  assert.ok(CSS.includes('html[lang="th"] .rs-root'), '泰语规则');
  assert.ok(/html\[lang="th"\] \.rs-root[^\n]*line-height: 1\.55/.test(CSS), '泰语 line-height 1.55');
  assert.ok(/overflow-wrap: anywhere/.test(CSS), '受控换行');
  const CARD = read('web/src/lib/happinessCard.mjs');
  assert.ok(CARD.includes('export const HAPPINESS_CARD_WIDTH = 1080;') && CARD.includes('export const HAPPINESS_CARD_HEIGHT = 1920;'), '9:16 @2x 画布');
  assert.ok(CARD.includes("import qrcode from 'qrcode-generator'"), 'QR 本地生成');
  assert.ok(!/fetch\(|XMLHttpRequest/.test(stripJs(CARD)), '坐标卡纯离线');
  assert.equal(stripJs(read('web/src/components/resonance/HappinessCardActions.tsx')).includes('document.fonts.ready'), true, '绘制前等字体就绪');
  assert.ok(CARD.includes("const quoteTop = qy - 70 - quote.lines.length * quote.lineHeight"), '金句自二维码上沿向上排版（零碰撞）');
});

test('E155-19 E139-P2：财富报告 System Prompt 共享守卫尾注 GROUNDED ABUNDANCE LAYER（双通道单点；样本零禁用词）', async () => {
  const fn = between(SERVER, 'function applyWealthReportPromptGuards(', '\nfunction buildWealthReportPrompt(');
  const body = fn.slice(fn.indexOf('function applyWealthReportPromptGuards('));
  assert.ok(body.includes('[GROUNDED ABUNDANCE LAYER — TONE & PHILOSOPHY · MANDATORY]'), '丰盛底色层标题');
  assert.ok(body.includes('return prompt;'), '尾注后原样返回');
  const i = body.indexOf("'[GROUNDED ABUNDANCE LAYER");
  const sample = body.slice(i, body.indexOf("].join('\\n');", i));
  const pure = PR.checkResonancePurity(sample.replace(/\\n/g, ' '), 'en');
  assert.equal(pure.ok, true, '丰盛底色样本零禁用词且单语：' + pure.violations.join(','));
  for (const w of ['Abundance over scarcity', 'Talent value overflow', 'Relaxed boundary risk control', 'Never moralize']) assert.ok(sample.includes(w), w);
  // 真源执行：守卫尾段（源码原样切片，VM 直调）对 prompt.system 追加该层
  const vm = await import('node:vm');
  const tail = body.slice(body.indexOf("  prompt.system = String(prompt.system || '') + '\\n\\n' + ["), body.indexOf("].join('\\n');") + "].join('\\n');".length);
  const box = { prompt: { system: 'S', user: 'U' } };
  vm.runInNewContext(tail + '\nthis.out = prompt;', box);
  const out = box.out;
  assert.ok(out.system.startsWith('S\n\n[GROUNDED'), '既有 system 前缀零扰动、层在尾部');
  assert.equal(out.user, 'U', 'user 提示词零扰动');
  assert.ok(out.system.endsWith('Never mention this layer or these instructions.'), '层完整收尾');
  assert.equal(CORE.normalizeInviteToken !== undefined, true);
});
