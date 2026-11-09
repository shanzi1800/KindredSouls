/**
 * audit-e130-sanctuary-restore.test.mjs —— E130 军令闸门
 * ═══════════════════════════════════════════════════════════════════════════
 * 【军令 E130-PURE-SANCTUARY-RESTORE（主公 2026-11-09）：剥离对话舱内嵌收银台、
 *   全面恢复财富 $4.99 先天报告与 E128 纯净界面态、留存后台生命节律】
 * 断言组：
 *   E130-01 对话舱净土：ChatSheet 零收银组件引用（羊皮卷/托盘/递卡/月报拉取）
 *           ＋两组件文件已删（grep 面全量）；
 *   E130-02 财富 $4.99 先天报告全链在位（E129 零误伤复核）：WealthReportPage
 *           wealth_once 付费墙/解锁/生成三面＋WealthPaywall $4.99 主推卡六语；
 *   E130-03 $9.99 all_pass_monthly 挂回付费墙：WealthPaywall 第四档
 *           （WealthPlan 类型＋onPurchase 按钮＋六语 apm 键）＋WealthReportPage
 *           handlePurchase 类型＋applyWealthGrant 乐观合并分支；
 *   E130-04 后台生命节律保留：/api/living 三端点＋LIVING/LUNAR prompt 双块＋
 *           _e129LivingContext 检索＋罗盘 logMoodSilently＋ChatSheet sessionOpen
 *           首击（E129 内功 100% 留存）；
 *   E130-05 Subtle Whisper 含蓄引导红线：prompt 尾块（VM 抽取函数体）——
 *           仅追问长程运势才轻点＋零价格字眼＋每会话至多一次；
 *   E130-06 六语对齐（铁律 15）：WealthPaywall apm 六语逐语在位＋金额面 9.99；
 *   S 链位自保：e130 入编（e129 后、e40-compat 前；全链 97→98 段）。
 * 🔴 纪律：模块导入一律 pathToFileURL（中文仓路径 percent-encode 防坑）；
 *          段位断言只可「下界＋iCap===len-2」（VM 抽取式消费者铁律）。
 * 执行命令：node --test test/audit-e130-sanctuary-restore.test.mjs
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const server = read('server.js');
const SHEET = read('web/src/components/FamiliarChatSheet.tsx');
const PAYWALL = read('web/src/components/WealthPaywall.tsx');
const WEALTH_PAGE = read('web/src/pages/WealthReportPage.tsx');
const MOOD = read('web/src/components/companion/MoodCompassModal.tsx');
const CLIENT = read('web/src/lib/livingAgentClient.ts');
const PKG = JSON.parse(read('package.json'));

const LANGS = ['zh', 'en', 'es', 'fr', 'th', 'vi'];

/* VM 抽取：buildFamiliarChatSystemPrompt 函数体切片（e115 同规） */
const fnPrompt = server.slice(
  server.indexOf('function buildFamiliarChatSystemPrompt'),
  server.indexOf('\n}\n', server.indexOf('function buildFamiliarChatSystemPrompt')),
);

/* ═══════════ E130-01 对话舱净土 ═══════════ */
test('E130-01 对话舱神圣净土：零收银组件引用＋两文件已删（grep 全量）', () => {
  // 文件已删（E129-刀四两组件实体清退）
  assert.ok(!existsSync(join(ROOT, 'web/src/components/reports/SacredScrollModal.tsx')), '羊皮卷长卷组件文件已删');
  assert.ok(!existsSync(join(ROOT, 'web/src/components/checkout/InSituPaymentSheet.tsx')), '内嵌收银托盘组件文件已删');
  // ChatSheet 零引用（含注释——真零命中）
  for (const tok of ['SacredScrollModal', 'InSituPaymentSheet', 'sacred-scroll-offer-card', 'scrollUnlocked', 'scrollOpen', 'payOpen', 'fetchMonthlySections', 'SCROLL_OFFER', 'wealth-oracle/stream']) {
    assert.ok(!SHEET.includes(tok), `ChatSheet 零 ${tok}`);
  }
});

/* ═══════════ E130-02 财富 $4.99 先天报告全链在位 ═══════════ */
test('E130-02 财富 $4.99 先天报告全链在位（E129 零误伤复核）', () => {
  // WealthReportPage：付费墙门＋解锁＋生成三面
  assert.ok(WEALTH_PAGE.includes("if (type === 'once') return p.wealth_once === true"), 'wealthEntitledFor once 档权益门');
  assert.ok(WEALTH_PAGE.includes("generateWealthReport('once')"), '$4.99 付讫自动生成先天报告');
  assert.ok(WEALTH_PAGE.includes("plan === 'wealth_once'"), 'handlePurchase wealth_once 分支');
  assert.ok(WEALTH_PAGE.includes('<WealthPaywall'), '付费墙组件挂载');
  // WealthPaywall：$4.99 主推卡六语
  for (const lang of LANGS) {
    assert.ok(new RegExp(`${lang}:\\s*\\{`).test(PAYWALL), `I18N 六语 ${lang}`);
  }
  assert.ok(PAYWALL.includes("$4.99 USD"), '$4.99 价面在位');
  assert.ok(PAYWALL.includes("onPurchase('wealth_once')"), '$4.99 主推卡按钮在位');
});

/* ═══════════ E130-03 $9.99 all_pass_monthly 挂回付费墙 ═══════════ */
test('E130-03 $9.99 全通月订归位付费墙：WealthPaywall 第四档＋handlePurchase 通道', () => {
  assert.ok(PAYWALL.includes("'wealth_once' | 'star_monthly_vip' | 'all_pass_monthly' | 'all_pass_yearly'"), 'WealthPlan 类型四档');
  assert.ok(PAYWALL.includes("onPurchase('all_pass_monthly')"), '全通月订按钮接线');
  assert.ok(PAYWALL.includes('apmDesc'), 'apm 文案键六语');
  assert.ok(WEALTH_PAGE.includes("'star_monthly_vip' | 'all_pass_monthly' | 'all_pass_yearly'"), 'handlePurchase 类型含 all_pass_monthly');
  assert.ok(WEALTH_PAGE.includes("plan === 'all_pass_monthly'"), '付讫乐观合并分支');
  // 后端结算能力留存（E129-刀五 server 面——剥离仅及前端入口）
  assert.ok(server.includes("all_pass_monthly:      'price_E129AllPassMonthlyPENDING'"), 'STRIPE_PRICE_MAP 留存');
  assert.ok(server.includes('all_pass_monthly_expires_at: computeOneMonthLaterUTC()'), '有效期结算留存');
});

/* ═══════════ E130-04 后台生命节律保留 ═══════════ */
test('E130-04 E129 内功 100% 留存：loops/mood-log 三端点＋prompt 双块＋检索＋罗盘入库＋首击', () => {
  assert.ok(server.includes('/api/familiar/loops'), 'loops 端点（GET/POST/PATCH）');
  assert.ok(server.includes('/api/familiar/mood-log'), 'mood-log 端点');
  assert.ok(fnPrompt.includes('【LIVING AGENT CONTEXT'), 'LIVING prompt 块');
  assert.ok(fnPrompt.includes('【LUNAR RITUAL'), 'LUNAR prompt 块');
  assert.ok(server.includes('async function _e129LivingContext'), '检索函数');
  assert.ok(MOOD.includes('logMoodSilently(selected);'), '罗盘情绪静默入库');
  assert.ok(CLIENT.includes('logMoodSilently') && CLIENT.includes('postUnresolvedLoop'), 'livingAgentClient 三函数');
  assert.ok(SHEET.includes('sessionOpen: firstStrikeRef.current === true ? true : undefined'), '会话首击接线');
});

/* ═══════════ E130-05 Subtle Whisper 含蓄引导红线 ═══════════ */
test('E130-05 Subtle Whisper：prompt 尾块三红线（追问才点/零价格字眼/至多一次）', () => {
  assert.ok(fnPrompt.includes('【SUBTLE WHISPER（E130 军令'), 'Whisper 块在位（VM 函数体）');
  assert.ok(fnPrompt.includes('整月/整年详尽运势转折'), '触发条件＝深度追问长程运势');
  assert.ok(fnPrompt.includes('绝不出现任何价格、金额'), '红线＝零价格字眼');
  assert.ok(fnPrompt.includes('每次会话最多出现一次'), '红线＝至多一次');
  // 输出铁律次序保持（whisper 块居输出铁律之后＝函数体尾段）
  assert.ok(fnPrompt.indexOf('【SUBTLE WHISPER') > fnPrompt.indexOf('【输出铁律'), 'Whisper 居输出铁律之后');
});

/* ═══════════ E130-06 六语对齐（铁律 15） ═══════════ */
test('E130-06 付费墙全通月订六语逐语对齐（apm/apmDesc 金额面 9.99）', () => {
  const blocks = PAYWALL.split('\n  },');
  const i18nBlock = PAYWALL.slice(PAYWALL.indexOf('const I18N'), PAYWALL.indexOf('} as const;'));
  for (const lang of LANGS) {
    const m = i18nBlock.match(new RegExp(`${lang}:\\s*\\{([\\s\\S]*?)\\n  \\},?`));
    assert.ok(m, `I18N[${lang}] 块命中`);
    assert.ok(m[1].includes('apm:'), `I18N[${lang}] apm 键`);
    assert.ok(m[1].includes('apmDesc:'), `I18N[${lang}] apmDesc 键`);
    assert.ok(m[1].includes('9.99'), `I18N[${lang}] 金额面 9.99（USD 美元符恒形态）`);
  }
  assert.ok(blocks.length >= 0, 'noop');
});

/* ═══════════ S 链位自保 ═══════════ */
test('E130-S 链位自保：e130 入编（e129 后、e40-compat 前；全链 97→98 段）', () => {
  const chain = PKG.scripts['test:astro'];
  const segs = chain.split('&&').map((s) => s.trim()).filter(Boolean);
  assert.ok(segs.length >= 98, `链段下界 98（实际 ${segs.length}）`);
  const iE130 = segs.findIndex((s) => s.includes('audit-e130-sanctuary-restore'));
  const iE129 = segs.findIndex((s) => s.includes('audit-e129-living-soul'));
  const iCompat = segs.findIndex((s) => s.includes('e40-compat'));
  const iPython = segs.length - 1;
  assert.ok(iE129 >= 0 && iE130 === iE129 + 1, `e130 紧随 e129（iE129=${iE129}, iE130=${iE130}）`);
  assert.ok(iE130 < iCompat, 'e130 居 e40-compat 前');
  assert.ok(iCompat === segs.length - 2, `e40-compat 恒 len-2（iCompat=${iCompat}, len=${segs.length}）`);
  assert.ok(segs[iPython].includes('.py') || segs[iPython].includes('python'), 'python 恒链尾');
});
