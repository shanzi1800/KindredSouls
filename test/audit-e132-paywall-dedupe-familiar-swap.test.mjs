import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const PAYWALL = read('web/src/components/WealthPaywall.tsx');
const PAGE = read('web/src/pages/WealthReportPage.tsx');
const PKG = JSON.parse(read('package.json'));

/**
 * E132-PAYWALL-DEDUPE-FAMILIAR-SWAP（主公军令 2026-11-10，两刀热修）
 * ══════════════════════════════════════════════════════════════════════
 * 刀一（去重）：$9.99/月 两卡并存（双引擎星运特权卡＋全通月订）⇒ 主公钦定
 *   保留双引擎、全通月订**前端入口退役**（E129 后端结算/在期权益全量留存）。
 * 刀二（对调）：「为你孵化专属灵宠」上移至四宫格正下方、AI 深度洞察付费墙
 *   下移其后（E58「付费墙在前」旧序废止）。
 * ══════════════════════════════════════════════════════════════════════
 */

/* ═══════════ E132-01 刀一：$9.99 同价去重（唯一月卡＝双引擎星运特权卡） ═══════════ */
test('E132-01 付费墙 $9.99 去重：onPurchase 恒星卡×1＋全通月订入口×0＋六语 $9.99 恰一次', () => {
  const onCalls = (plan) => (PAYWALL.match(new RegExp(`onPurchase\\('${plan}'\\)`, 'g')) || []).length;
  assert.equal(onCalls('wealth_once'), 1, '$4.99 一次性卡恰 1');
  assert.equal(onCalls('star_monthly_vip'), 1, '双引擎星运特权卡恰 1（钦定保留）');
  assert.equal(onCalls('all_pass_monthly'), 0, '全通月订入口必须退役（E132 刀一）');
  assert.equal(onCalls('all_pass_yearly'), 1, '$99.99 年卡恰 1');

  // 六语块内 $9.99 字面恰出现一次（唯一 $9.99 卡＝双引擎；\$ 前缀防误中 $99.99/$29.99）
  const i18nBlock = PAYWALL.slice(PAYWALL.indexOf('const I18N'), PAYWALL.indexOf('} as const;'));
  for (const lang of ['zh', 'en', 'es', 'fr', 'th', 'vi']) {
    const m = i18nBlock.match(new RegExp(`${lang}:\\s*\\{([\\s\\S]*?)\\n  \\},?`));
    assert.ok(m, `I18N[${lang}] 块命中`);
    const count = (m[1].match(/\$9\.99/g) || []).length;
    assert.equal(count, 1, `I18N[${lang}] $9.99 恰 1 次（实际 ${count}——同价双卡残留）`);
  }
});

/* ═══════════ E132-02 刀二：灵宠孵化上移（四宫格下方、付费墙之前） ═══════════ */
test('E132-02 模块对调：<FamiliarPicker 必须先于 <WealthPaywall 出现在页序中', () => {
  const iFam = PAGE.indexOf('<FamiliarPicker');
  const iPay = PAGE.indexOf('<WealthPaywall');
  assert.ok(iFam !== -1, 'FamiliarPicker 挂载在位');
  assert.ok(iPay !== -1, 'WealthPaywall 挂载在位');
  assert.ok(iFam < iPay, `灵宠孵化须在付费墙之前（iFam=${iFam}, iPay=${iPay}）`);

  // 四宫格（WealthDataGrid）在最前：四宫格 → 灵宠 → 付费墙
  const iGrid = PAGE.indexOf('<WealthDataGrid');
  assert.ok(iGrid !== -1 && iGrid < iFam, '四宫格居首（iGrid < iFam）');

  // 挂载条件：灵宠选择器仍受未付费态上锁（E48 锁链不变）
  const famBlock = PAGE.slice(iFam - 400, iFam + 600);
  assert.ok(famBlock.includes('locked={true}'), '灵宠选择器未付费态恒上锁');

  // 单挂载防重：页内 <FamiliarPicker 出现次数恰 1（对调禁遗留旧挂点）
  assert.equal((PAGE.match(/<FamiliarPicker/g) || []).length, 1, 'FamiliarPicker 单挂载（旧位退役）');
});

/* ═══════════ E132-03 后端能力留存（去重仅及前端入口） ═══════════ */
test('E132-03 全通月订后端全量留存：SKU/结算/有效期/重置四闸面不动', () => {
  const server = read('server.js');
  assert.ok(server.includes("all_pass_monthly:      'price_E129AllPassMonthlyPENDING'"), 'STRIPE_PRICE_MAP SKU 留存');
  assert.ok(server.includes('all_pass_monthly_expires_at: computeOneMonthLaterUTC()'), '自然月+1 结算留存');
  assert.ok(PAYWALL.includes("'wealth_once' | 'star_monthly_vip' | 'all_pass_monthly' | 'all_pass_yearly'"), 'WealthPlan 类型四档留存（在期权益判定不破）');
  assert.ok(PAGE.includes("plan === 'all_pass_monthly'"), '付讫乐观合并分支留存');
});

/* ═══════════ S 链位自保 ═══════════ */
test('E132-S 链位自保：e132 入编（e131 后、e40-compat 前；全链 99→100 段）', () => {
  const chain = PKG.scripts['test:astro'];
  const segs = chain.split('&&').map((s) => s.trim()).filter(Boolean);
  assert.ok(segs.length >= 100, `链段下界 100（实际 ${segs.length}）`);
  const iE132 = segs.findIndex((s) => s.includes('audit-e132-paywall-dedupe-familiar-swap'));
  const iE131 = segs.findIndex((s) => s.includes('audit-e131-wealth-funnel-chart-frame'));
  const iCompat = segs.findIndex((s) => s.includes('e40-compat'));
  assert.ok(iE131 >= 0 && iE132 === iE131 + 1, `e132 紧随 e131（iE131=${iE131}, iE132=${iE132}）`);
  assert.ok(iCompat === segs.length - 2, `e40-compat 恒 len-2（实际 iCompat=${iCompat}, len=${segs.length}）`);
});
