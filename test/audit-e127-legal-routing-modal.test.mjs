/**
 * audit-e127-legal-routing-modal.test.mjs —— E127 军令闸门
 * ═══════════════════════════════════════════════════════════════════════════
 * 【军令 E127-LEGAL-ROUTING-MODAL（主公 2026-11-08）：条款路由直通、
 *   表单现场弹窗与法律模块解耦＋财富模块同构排查与海外金融免责】
 * 病灶实锤（生产截图两连）：生日录入页点「隐私政策/服务条款」⇒ window.location.href
 * 整页跳转（清空表单数据）；直访 /privacy-policy 时 PolicyPage 因 position:relative
 * 文档流堆叠在首页 hero 下方——首屏只见首页（「跳回首页」视觉假象）。
 * 断言组（军令钦定 DoD）：
 *   E127-01 legalTerms 真源形状：六语 × privacy 5 节 / terms 7 节全字段非空；
 *   E127-02 非金融建议免责六语在位（军令增补钦定——海外强监管红线）；
 *   E127-03 getLegalTermsDoc fail-closed：坏 type null；未知语回退 en；
 *   E127-04 双表单原位弹窗接线锚：App.tsx（姻缘）＋WealthPage.tsx（财富）
 *          均含 LegalTermsModal import＋openLegal 拦截＋{legalModal && 渲染；
 *   E127-05 整页跳转死亡断言：window.location.href='/privacy-policy' 与
 *          '/terms-of-service' 在双表单源码全绝迹（表单数据零清空根）；
 *   E127-06 独立路由页承接锚：App.tsx pathname 检测＋popstate＋PolicyPage
 *          渲染保留；PolicyPage.tsx 消费 legalTerms 真源＋返回首页按钮；
 *   E127-07 policy-page CSS fixed 全屏覆盖锚（z-120——条款页与首页文档流互斥）；
 *   E127-08 弹窗军令规格锚：z-[150] 毛玻璃遮罩＋暗金边框＋✕＋已阅读按钮＋Esc；
 *   E127-09 跨模块防串流锚：WealthPage 弹窗零姻缘组件引用＋弹窗纯展示零路由；
 *   S10 链位自保：e127 入编（e126 后、e40-compat 前；全链 95→96 段）。
 * 🔴 纪律：模块导入一律 pathToFileURL（中文仓路径 percent-encode 防坑）。
 * 执行命令：node --test test/audit-e127-legal-routing-modal.test.mjs
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

/* ── 模块加载（pathToFileURL：中文仓路径铁律）────────────────────────── */
const LT = await import(pathToFileURL(join(ROOT, 'web/src/i18n/legalTerms.mjs')).href);

const { getLegalTermsDoc, LEGAL_TERMS_LANGS } = LT;

const APP = read('web/src/App.tsx');
const WEALTH = read('web/src/pages/WealthPage.tsx');
const POLICY = read('web/src/pages/PolicyPage.tsx');
const MODAL = read('web/src/components/legal/LegalTermsModal.tsx');
const CSS = read('web/src/App.css');

const LANGS = ['zh', 'en', 'es', 'fr', 'th', 'vi'];

/* ═══════════ E127-01 legalTerms 真源形状 ═══════════ */
test('E127-01 法律条款六语真源形状：privacy 5 节 / terms 7 节全字段非空', () => {
  assert.deepEqual([...LEGAL_TERMS_LANGS], LANGS, '六语白名单');
  for (const lang of LANGS) {
    const privacy = getLegalTermsDoc('privacy', lang);
    const terms = getLegalTermsDoc('terms', lang);
    assert.ok(privacy, `privacy[${lang}] 须命中`);
    assert.ok(terms, `terms[${lang}] 须命中`);
    assert.equal(privacy.sections.length, 5, `privacy[${lang}] 须 5 节`);
    assert.equal(terms.sections.length, 7, `terms[${lang}] 须 7 节（含非金融建议免责新章）`);
    for (const doc of [privacy, terms]) {
      assert.ok(doc.title && doc.title.length > 0, `${lang} title 非空`);
      assert.ok(doc.lastUpdated && doc.lastUpdated.length > 0, `${lang} lastUpdated 非空`);
      for (const sec of doc.sections) {
        assert.ok(sec.h && sec.h.length > 0, `${lang} 节标题非空`);
        assert.ok(sec.p && sec.p.length > 20, `${lang} 节正文非空（>20 字符）`);
      }
    }
  }
});

/* ═══════════ E127-02 非金融建议免责六语 ═══════════ */
test('E127-02 海外金融免责专章六语在位（军令增补钦定——非投资建议红线）', () => {
  const MARKS = {
    zh: ['不构成任何形式的投资理财建议', '自行承担全部风险'],
    en: ['NOT constitute financial, investment', 'no liability'],
    fr: ['PAS un conseil financier', "toute responsabilité"],
    es: ['NO constituye asesoramiento financiero', 'responsabilidad alguna'],
    th: ['ไม่ถือเป็นคำแนะนำทางการเงิน', 'ไม่รับผิดชอบ'],
    vi: ['KHÔNG cấu thành lời khuyên tài chính', 'không chịu trách nhiệm'],
  };
  for (const [lang, marks] of Object.entries(MARKS)) {
    const terms = getLegalTermsDoc('terms', lang);
    const joined = terms.sections.map((s) => s.h + '\n' + s.p).join('\n');
    for (const m of marks) {
      assert.ok(joined.includes(m), `terms[${lang}] 金融免责须含「${m}」`);
    }
  }
});

/* ═══════════ E127-03 fail-closed 取值 ═══════════ */
test('E127-03 getLegalTermsDoc fail-closed：坏 type null；未知语回退 en', () => {
  assert.equal(getLegalTermsDoc('refund', 'zh'), null, '未知 type 须 null');
  assert.equal(getLegalTermsDoc('', 'en'), null, '空 type 须 null');
  assert.equal(getLegalTermsDoc(null, 'en'), null, 'null type 须 null');
  // 未知语言回退 en（沿 AMULET/LIFESTYLE 模板先例——绝不崩溃）
  const ko = getLegalTermsDoc('terms', 'ko');
  assert.ok(ko && ko.title === 'Terms of Service', '未知语须回退 en');
  const ja = getLegalTermsDoc('privacy', 'ja');
  assert.ok(ja && ja.title === 'Privacy Policy', '未知语须回退 en（privacy）');
});

/* ═══════════ E127-04 双表单原位弹窗接线 ═══════════ */
test('E127-04 双表单原位弹窗接线锚（姻缘＋财富——军令治本一）', () => {
  for (const [name, src] of [['App.tsx', APP], ['WealthPage.tsx', WEALTH]]) {
    assert.ok(src.includes("import LegalTermsModal from"), `${name} 须 import LegalTermsModal`);
    assert.ok(src.includes('openLegal('), `${name} 须有 openLegal 拦截器`);
    assert.ok(src.includes("legalModal, setLegalModal"), `${name} 须有 legalModal 状态`);
    assert.ok(src.includes("{legalModal && <LegalTermsModal"), `${name} 须渲染弹窗`);
    // href 保留（中键/新标签直达独立路由页）
    assert.ok(src.includes(`href="/privacy-policy"`) && src.includes(`href="/terms-of-service"`), `${name} 条款链接 href 须保留`);
  }
});

/* ═══════════ E127-05 整页跳转死亡断言 ═══════════ */
test('E127-05 整页跳转死亡：条款链接零 window.location.href（表单数据零清空根）', () => {
  for (const [name, src] of [['App.tsx', APP], ['WealthPage.tsx', WEALTH]]) {
    assert.ok(!src.includes(`window.location.href='/privacy-policy'`), `${name} 严禁整页跳转 privacy-policy`);
    assert.ok(!src.includes(`window.location.href='/terms-of-service'`), `${name} 严禁整页跳转 terms-of-service`);
    assert.ok(!src.includes(`window.location.href="/privacy-policy"`), `${name} 严禁整页跳转 privacy-policy（双引号形态）`);
    assert.ok(!src.includes(`window.location.href="/terms-of-service"`), `${name} 严禁整页跳转 terms-of-service（双引号形态）`);
  }
});

/* ═══════════ E127-06 独立路由页承接 ═══════════ */
test('E127-06 独立路由页承接锚（/privacy-policy 直达渲染——军令治本二）', () => {
  // App.tsx 路由状态机保留（mount 检测＋popstate＋PolicyPage 渲染）
  assert.ok(APP.includes(`path === '/terms-of-service'`), 'pathname 检测 terms 保留');
  assert.ok(APP.includes(`path === '/privacy-policy'`), 'pathname 检测 privacy 保留');
  assert.ok(APP.includes("addEventListener('popstate', handlePolicyRoute)"), 'popstate 监听保留');
  assert.ok(APP.includes('{policyPage &&'), 'PolicyPage 条件渲染保留');
  // PolicyPage 消费真源＋返回按钮
  assert.ok(POLICY.includes(`from '../i18n/legalTerms.mjs'`), 'PolicyPage 须消费 legalTerms 真源');
  assert.ok(POLICY.includes('Back to Home'), 'PolicyPage 须有返回首页导航');
  assert.ok(!POLICY.includes('const texts: Record<string, Record<string, string>>'), '原内嵌字典须已抽离归仓');
});

/* ═══════════ E127-07 policy-page fixed 全屏覆盖 ═══════════ */
test('E127-07 policy-page CSS fixed 全屏覆盖锚（与首页文档流互斥——视觉回退病灶根）', () => {
  const m = /\.policy-page\s*\{[^}]*\}/.exec(CSS);
  assert.ok(m, '.policy-page 规则须存在');
  assert.ok(m[0].includes('position: fixed'), '.policy-page 须 fixed（覆盖首页文档流）');
  assert.ok(m[0].includes('z-index: 120'), '.policy-page 须 z-120');
  assert.ok(m[0].includes('overflow-y: auto'), '.policy-page 须可滚动');
  // ⚠️ E127 热修（生产实弹 elementFromPoint 实锤）：.page 全局类 max-width:420px
  // 会把 fixed inset-0 卡成 420px 竖条（右侧透出首页 VIDEO/hero）——须显式覆盖。
  assert.ok(m[0].includes('width: 100vw'), '.policy-page 须 width:100vw（覆盖 .page 420px 限宽）');
  assert.ok(m[0].includes('max-width: none'), '.policy-page 须 max-width:none（覆盖 .page 420px 限宽）');
});

/* ═══════════ E127-08 弹窗军令规格 ═══════════ */
test('E127-08 弹窗军令规格锚：z-150 毛玻璃＋暗金边框＋✕＋已阅读＋Esc', () => {
  assert.ok(MODAL.includes(`from '../../i18n/legalTerms.mjs'`), '弹窗须消费 legalTerms 真源');
  assert.ok(MODAL.includes('Escape'), '弹窗须支持 Esc 关闭（E123 双关先例）');
  assert.ok(MODAL.includes('aria-modal'), '弹窗须有 aria-modal 无障碍标注');
  assert.ok(MODAL.includes('✕'), '弹窗右上角须常驻 ✕');
  assert.ok(MODAL.includes('我已阅读并知悉'), '弹窗底部须有已阅读按钮（zh）');
  assert.ok(MODAL.includes('I have read and acknowledged'), '已阅读按钮六语兜底 en');
  // CSS 规格
  const ov = /\.ks-legal-overlay\s*\{[^}]*\}/.exec(CSS);
  assert.ok(ov, '.ks-legal-overlay 须存在');
  assert.ok(ov[0].includes('z-index: 150'), '遮罩须 z-150（浮于表单与 Slogan 之上）');
  assert.ok(ov[0].includes('backdrop-filter: blur(10px)'), '遮罩须毛玻璃');
  const mo = /\.ks-legal-modal\s*\{[^}]*\}/.exec(CSS);
  assert.ok(mo && mo[0].includes('rgba(212, 175, 55, 0.45)'), '卡容器须暗金边框');
  const sc = /\.ks-legal-scroll\s*\{[^}]*\}/.exec(CSS);
  assert.ok(sc && sc[0].includes('overflow-y: auto'), '内容区须原生滚动容器');
});

/* ═══════════ E127-09 跨模块防串流 ═══════════ */
test('E127-09 跨模块防串流锚：财富弹窗零姻缘引用＋弹窗纯展示零路由', () => {
  // WealthPage 弹窗路径不得激活姻缘组件（Synastry/CompatReportCanvas 等）
  assert.ok(!WEALTH.includes('SynastryProgress'), 'WealthPage 严禁引用 SynastryProgress（姻缘组件）');
  assert.ok(!WEALTH.includes('CompatReportCanvas'), 'WealthPage 严禁引用 CompatReportCanvas（姻缘组件）');
  // 弹窗组件纯展示：无 navigate/无 window.location（关闭仅摘遮罩，零路由副作用）
  assert.ok(!MODAL.includes('window.location'), '弹窗严禁 window.location 路由副作用');
  assert.ok(!MODAL.includes('navigate('), '弹窗严禁 navigate 跳转');
  // 弹窗 onClose 回调签名（父组件控制关闭——表单状态不卸载）
  assert.ok(MODAL.includes('onClose: () => void'), '弹窗须走 onClose 回调');
});

/* ═══════════ S10 链位自保 ═══════════ */
test('E127-S10 链位自保：e127 入编（e126 后、e40-compat 前；全链 95→96 段）', () => {
  const pkg = JSON.parse(read('package.json'));
  const chain = pkg.scripts['test:astro'];
  const segs = chain.split('&&').map((s) => s.trim()).filter(Boolean);
  assert.equal(segs.length, 96, `军规链段数须为 96（E127 入编后 95→96；实为 ${segs.length}）`);
  const iE127 = segs.findIndex((s) => s.includes('audit-e127-legal-routing-modal'));
  const iE126 = segs.findIndex((s) => s.includes('audit-e126-geo-locale'));
  const iCompat = segs.findIndex((s) => s.includes('audit-e40-compat'));
  assert.ok(iE127 > iE126, 'e127 须居 e126 之后');
  assert.ok(iE127 < iCompat, 'e127 须居 e40-compat 之前');
  assert.ok(iCompat === segs.length - 2, 'e40-compat 恒 len-2');
});
