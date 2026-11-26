// ✦ E158（主公军令 2026-11-26）：全站视觉、三场景一致性与交互精修闸门 —— 八刀落地镜像。
//   刀一 输入页去重/香槟金 CTA/三场景 CTA 文案/同意句/精简 placeholder ｜ 刀二 今日塔罗前置门禁
//   刀三 幸福坐标卡去二维码＋放大预览＋合并保存/分享按钮 ｜ 刀四 塔罗牌义三场景分流
//   刀五 月/年报命名三场景一对一对齐 ｜ 刀六 情爱报告称呼代入 ｜ 刀七 单活手风琴 ｜ 刀八 14 键六语字典。
//   零越界：PAYMENT_MODE=sandbox 与定价不动；E157 合规护栏、SwissEph 真理锁、称呼逐字原样锁不动；
//   严禁独立对话窗 / 拉宽输入框 / 重复付费 / 重复请求生成接口 / 重新上锁；支付回跳自动生成＝E159 封存未执行。
//   零网络 / 零 LLM / 零子进程。

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(resolve(REPO, p), 'utf8');
const mod = (p) => import(pathToFileURL(resolve(REPO, p)).href);

const SERVER = read('server.js');
const APP = read('web/src/App.tsx');
const APP_CSS = read('web/src/App.css');
const PAYWALL = read('web/src/components/PaywallCard.tsx');
const TAROT_CARD = read('web/src/components/TarotDailyCard.tsx');
const HCARD = read('web/src/components/HappinessCard.tsx');
const HCARD_CSS = read('web/src/styles/happiness-card.css');
const GOLD = read('web/src/components/exporter/GoldCardExporter.tsx');
const HCORE = read('web/src/lib/happinessCard.mjs');
const TAROT_LIB = read('web/src/lib/tarot.ts');
const FOLD = read('web/src/components/E158Fold.tsx');
const DICT = await mod('web/src/lib/resonanceI18n.mjs');
const PR = await mod('lib/resonance/resonancePrompt.mjs');
const SCENES = await mod('web/src/lib/tarotScenes.mjs');
const TAROT = await mod('web/src/lib/tarot.ts');
const SB = await mod('web/src/lib/sandboxCheckout.mjs');
const LANGS = ['zh', 'en', 'fr', 'es', 'th', 'vi'];
const THAI = /[\u0e00-\u0e7f]/;
const CJK = /[\u3400-\u9fff\uf900-\ufaff]/;

const between = (src, from, to) => {
  const i = src.indexOf(from);
  assert.ok(i !== -1, `锚缺失：${from}`);
  const j = src.indexOf(to, i + from.length);
  assert.ok(j !== -1, `锚缺失：${to}`);
  return src.slice(i, j);
};

/* ═══════ 一 · 刀八：14 键六语权威字典逐字 ═══════ */
const MANDATED = {
  nickname_self_placeholder: ['你的昵称或代号（选填）', 'Your nickname (optional)', 'Votre surnom (facultatif)', 'Tu apodo (opcional)', 'ชื่อเล่นของคุณ (ไม่บังคับ)', 'Biệt danh của bạn (tùy chọn)'],
  nickname_partner_placeholder: ['TA 的昵称或代号（选填）', 'Partner nickname (optional)', "Surnom de l'autre (facultatif)", 'Apodo del otro (opcional)', 'ชื่อเล่นอีกฝ่าย (ไม่บังคับ)', 'Biệt danh đối phương (tùy chọn)'],
  cta_unlock_romance: ['解锁情爱坐标', 'Unlock Romance Code', 'Déverrouiller Éros · Amour', 'Desbloquear Eros · Amor', 'ปลดล็อกพิกัดความรัก', 'Mở Khóa Tọa Độ Tình Ái'],
  cta_unlock_business: ['解锁商道共频', 'Unlock Alliance Code', 'Déverrouiller Philia · Alliance', 'Desbloquear Philia · Alianza', 'ปลดล็อกคลื่นพันธมิตร', 'Mở Khóa Tọa Độ Đồng Hành'],
  cta_unlock_friendship: ['解锁挚友同频', 'Unlock Kindred Code', 'Déverrouiller Storgê · Complicité', 'Desbloquear Storgé · Afinidad', 'ปลดล็อกคลื่นกัลยาณมิตร', 'Mở Khóa Tọa Độ Tri Kỷ'],
  consent_continue_note: ['点击上方按钮即表示你同意服务条款和隐私政策。', 'By continuing, you agree to our Terms of Service and Privacy Policy.', 'En continuant, vous acceptez nos Conditions et notre Politique de confidentialité.', 'Al continuar, aceptas nuestros Términos y Política de Privacidad.', 'การดำเนินการต่อถือว่าคุณยอมรับข้อกำหนดและนโยบายความเป็นส่วนตัว', 'Tiếp tục đồng nghĩa bạn đồng ý với Điều khoản và Chính sách bảo mật.'],
  tarot_gate_hint: ['请先解锁 $4.99 深度坐标报告，即可开启今日塔罗', "Unlock the $4.99 full report first to access Today's Tarot", 'Débloquez d\'abord le rapport à 4,99 $ pour le Tarot du jour', 'Desbloquea primero el informe de $4.99 para el Tarot de hoy', 'ปลดล็อกรายงาน $4.99 ก่อน เพื่อเปิดไพ่ทาโรต์ประจำวัน', 'Mở khóa báo cáo $4.99 trước để xem Tarot hôm nay'],
  btn_save_share_card: ['保存 / 分享幸福坐标卡', 'Save / Share Coordinate Card', 'Enregistrer / Partager la Carte', 'Guardar / Compartir Tarjeta', 'บันทึก / แชร์การ์ดพิกัดความสุข', 'Lưu / Chia Sẻ Thẻ Tọa Độ'],
  btn_monthly_romance: ['解锁情爱月报', 'Unlock Romance Monthly', 'Mensuel · Amour', 'Mensual · Amor', 'ปลดล็อกรายเดือนความรัก', 'Báo Cáo Tháng Tình Ái'],
  btn_annual_romance: ['解锁情爱年报', 'Unlock Romance Annual', 'Annuel · Amour', 'Anual · Amor', 'ปลดล็อกรายปีความรัก', 'Báo Cáo Năm Tình Ái'],
  btn_monthly_business: ['解锁商道月报', 'Unlock Alliance Monthly', 'Mensuel · Alliance', 'Mensual · Alianza', 'ปลดล็อกรายเดือนพันธมิตร', 'Báo Cáo Tháng Đồng Hành'],
  btn_annual_business: ['解锁商道年报', 'Unlock Alliance Annual', 'Annuel · Alliance', 'Anual · Alianza', 'ปลดล็อกรายปีพันธมิตร', 'Báo Cáo Năm Đồng Hành'],
  btn_monthly_friendship: ['解锁挚友月报', 'Unlock Kindred Monthly', 'Mensuel · Complicité', 'Mensual · Afinidad', 'ปลดล็อกรายเดือนกัลยาณมิตร', 'Báo Cáo Tháng Tri Kỷ'],
  btn_annual_friendship: ['解锁挚友年报', 'Unlock Kindred Annual', 'Annuel · Complicité', 'Anual · Afinidad', 'ปลดล็อกรายปีกัลยาณมิตร', 'Báo Cáo Năm Tri Kỷ'],
  report_unlocked_reopen: ['已解锁 · 点击展开重温', 'Unlocked · Tap to Reopen', 'Débloqué · Rouvrir', 'Desbloqueado · Reabrir', 'ปลดล็อกแล้ว · แตะเพื่ออ่านอีกครั้ง', 'Đã mở khóa · Chạm để xem lại'],
};

test('E158-1 刀八：14 键六语权威字典逐字在内联单源；非 zh 零 CJK、th 为泰文；派生助手（按钮带价/折叠条切分）行为锁', () => {
  assert.equal(Object.keys(MANDATED).length, 15, '军令刀八字典键数（占位 2＋CTA 3＋同意句＋门禁提示＋保存分享＋月/年报 6＋折叠条）');
  for (const [k, row] of Object.entries(MANDATED)) {
    LANGS.forEach((L, i) => assert.equal(DICT.resT(L, k), row[i], `${k}.${L} 逐字`));
    for (const i of [1, 2, 3, 5]) assert.equal(CJK.test(row[i]), false, `${k} 非 zh 列零 CJK：${row[i]}`);
    assert.equal(THAI.test(row[4]), true, `${k} th 须为泰文`);
  }
  // 情爱/商道/挚友月报年报键互不相同（一对一，无复用泛词）
  for (const k of ['monthly', 'annual']) assert.equal(new Set(['romance', 'business', 'friendship'].map((s) => DICT.resT('en', `btn_${k}_${s}`))).size, 3, `${k} 三场景英文互异`);
  // 旧泛词「关系月报/年报」与「姻缘月报/年报」全站退役（字典层）
  // 只扫词条行（注释不计）
  const src = read('web/src/lib/resonanceI18n.mjs').split('\n').filter((l) => !/^\s*(\/\/|\/\*|\*)/.test(l)).join('\n');
  for (const bad of ['姻缘月报', '姻缘年报', '关系月报', '关系年报', 'Relationship Monthly', 'Relationship Annual']) {
    assert.equal(src.includes(bad), false, `字典退役词残留：${bad}`);
  }
  // 派生助手
  assert.equal(DICT.resReportBtn('zh', 'romance', 'monthly'), '解锁情爱月报 $2.99/月');
  assert.equal(DICT.resReportBtn('en', 'business', 'yearly'), 'Unlock Alliance Annual $29.99/yr');
  assert.equal(DICT.resReportBtn('fr', 'friendship', 'monthly'), 'Mensuel · Complicité $2,99/mois', 'fr 欧洲小数逗号');
  assert.equal(DICT.resReportBtn('es', 'romance', 'yearly'), 'Anual · Amor $29,99/año', 'es 欧洲小数逗号');
  assert.equal(DICT.resReportBtn('th', 'romance', 'monthly'), 'ปลดล็อกรายเดือนความรัก $2.99/เดือน');
  assert.equal(DICT.resReportBtn('x', 'bogus', 'monthly'), '解锁情爱月报 $2.99/月', '非法语种/场景回落 zh/情爱');
  assert.equal(DICT.resAlmanacBtn('zh', 'business', 'yearly'), '👑 解锁商道年报 $29.99', '年鉴按钮＝纯金额（不带周期后缀）');
  assert.equal(DICT.resReportTitle('zh', 'friendship', 'monthly'), '挚友月报', '折叠条标题去「解锁」前缀');
  assert.equal(DICT.resReportTitle('en', 'romance', 'yearly'), 'Romance Annual');
  assert.deepEqual(DICT.splitReopenLabel('zh'), ['已解锁', '展开重温 ▼'], 'zh 折叠条两截');
  assert.deepEqual(DICT.splitReopenLabel('en'), ['Unlocked', 'Tap to Reopen ▼']);
  assert.deepEqual(DICT.splitReopenLabel('th'), ['ปลดล็อกแล้ว', 'แตะเพื่ออ่านอีกครั้ง ▼']);
  // 同意句切分：六语均能定位条款/隐私两枚链接标签
  for (const L of LANGS) {
    const p = DICT.splitConsentNote(L);
    assert.ok(Array.isArray(p) && p.length === 5 && p[1] && p[3], `${L} 同意句链接切分`);
    assert.equal([p[0], p[1], p[2], p[3], p[4]].join(''), DICT.resT(L, 'consent_continue_note'), `${L} 切分无损还原`);
  }
  // 泰语样式铁律：折叠条/坐标卡/塔罗门禁提示
  assert.ok(APP_CSS.includes('.ks-e158-bar[lang="th"], .ks-e158-bar[lang="th"] * { line-height: 1.55; overflow-wrap: anywhere; }'), '折叠条泰语 anywhere/1.55');
  assert.ok(HCARD_CSS.includes('.ks-hcard[lang="th"], .ks-hcard[lang="th"] * { line-height: 1.55; overflow-wrap: anywhere; }'), '坐标卡泰语 anywhere/1.55');
});

/* ═══════ 二 · 刀一：输入页 ═══════ */
test('E158-2 刀一：输入页重复副标退役；CTA 三场景统一字典＋香槟金；同意句泛化（条款/隐私链接原位）；未拉宽输入框', () => {
  const ip = between(APP, 'function InputPage(', '/* ── Loading Page ── */');
  assert.equal(ip.includes("<p className=\"subtitle\" style={{ textAlign: 'center' }}>{t('app.name')}</p>"), false, '重复紫色小字「一见如故」退役');
  const iH1 = ip.indexOf("<h1 className=\"title\" style={{ textAlign: 'center' }}>{t('input.title')}</h1>");
  const iDesc = ip.indexOf("<p className=\"desc\" style={{ textAlign: 'center' }}>{t('input.subtitle')}</p>", iH1);
  assert.ok(iH1 > 0 && iDesc > iH1 && !ip.slice(iH1, iDesc).includes('<p'), '大标题下直接接说明（原间距比例上移；中间仅注释）');
  assert.equal(ip.includes("t('input.calculate')"), false, '「测算缘分」旧词条在输入页退役');
  assert.ok(ip.includes("const ctaLabel = resT(lang, `cta_unlock_${scene === 'business' || scene === 'friendship' ? scene : 'romance'}`);"), 'CTA 文案三场景走刀八字典');
  assert.equal((ip.match(/data-testid="e156-cta"/g) || []).length, 1, '单一主按钮');
  assert.ok(ip.includes('<button className="btn btn-primary" data-testid="e156-cta"'), '主按钮 className 字面不动（CSS 以 data-testid 叠加）');
  // 同意句
  assert.ok(ip.includes('data-testid="e158-consent-note"'), '同意句容器');
  assert.ok(ip.includes('const parts = splitConsentNote(lang);'), '同意句走字典切分');
  assert.ok(ip.includes("<a href=\"/terms-of-service\" style={linkStyle} onClick={openLegal('terms')}>{parts[1]}</a>"), '条款链接：href＋openLegal 原位弹窗');
  assert.ok(ip.includes("<a href=\"/privacy-policy\" style={linkStyle} onClick={openLegal('privacy')}>{parts[3]}</a>"), '隐私链接：href＋openLegal 原位弹窗');
  assert.equal((ip.match(/openLegal\(/g) || []).length, 2, '恰两枚法律链接');
  assert.ok(ip.includes("if (!parts) return resT(lang, 'consent_continue_note');"), '切分失败回落纯文本（不丢句）');
  assert.ok(APP.includes('placeholder={resT(L, phKey)}'), 'placeholder 取字典键（刀八精简）');
  const nameInput = between(APP, 'function E156NameInput(', '/* ── Loading Page ── */');
  assert.ok(nameInput.includes("width: '100%', padding: '10px 12px', font: 'inherit', fontSize: '15px'"), '输入框内距未动（严禁拉宽）');
  // 香槟金 CTA（specificity 压过 .btn-primary / :hover）
  const ctaRule = APP_CSS.slice(APP_CSS.indexOf('.btn-primary[data-testid="e156-cta"] {'));
  assert.ok(APP_CSS.indexOf('.btn-primary[data-testid="e156-cta"] {') > 0, 'CTA 专属规则在位');
  assert.ok(ctaRule.includes('background: linear-gradient(135deg, #F0D99C 0%, #D9B45B 52%, #C59B3E 100%);'), '丝缎香槟金渐变');
  assert.ok(ctaRule.includes('color: #0D0D1A;'), '深黑高对比字');
  assert.ok(APP_CSS.includes('.btn-primary[data-testid="e156-cta"]:hover,'), 'hover 态同色系');
  assert.equal(ctaRule.slice(0, 600).includes('#2ECBF7'), false, '亮青退役于主按钮');
  assert.ok(APP_CSS.includes('.btn-primary {\n  background: #2ECBF7;'), '落地页其余 .btn-primary 基类不动（只叠输入页主按钮）');
});

/* ═══════ 三 · 刀二：今日塔罗前置门禁 ═══════ */
test('E158-3 刀二：$4.99 未解锁 ⇒ 付费墙态今日塔罗门禁（零探测、买按钮置灰＋🔒、tarot_gate_hint）；解锁态无 gate 即刻放行', () => {
  assert.ok(TAROT_CARD.includes("gate?: { hint: string } | null;"), 'gate 可选 prop');
  assert.ok(TAROT_CARD.includes('if (gate) { setPhase(\'gate\'); return; }'), 'gate 在场 ⇒ 门禁态、零探测零请求');
  assert.ok(TAROT_CARD.includes("phase: 'probe' | 'locked' | 'limit' | 'error' | 'done' | 'gate'"), 'gate 相位入枚举');
  assert.ok(TAROT_CARD.includes("{phase === 'gate' && gate && ("), '门禁渲染分支');
  const gateSeg = between(TAROT_CARD, "{phase === 'gate' && gate && (", "{phase === 'limit' && (");
  assert.ok(gateSeg.includes('data-testid="tarot-daily-buy"'), '门禁态沿用同一购买按钮 testid');
  assert.ok(gateSeg.includes('disabled\n') && gateSeg.includes('aria-disabled="true"') && gateSeg.includes("cursor: 'not-allowed'"), '置灰不可点');
  assert.ok(gateSeg.includes('🔒 {L_BUY[lang] || L_BUY.en}'), '锁标');
  assert.ok(gateSeg.includes('data-testid="e158-tarot-gate-hint"') && gateSeg.includes('{gate.hint}'), '门禁提示');
  assert.ok(gateSeg.includes("lineHeight: lang === 'th' ? 1.55 : 1.5") && gateSeg.includes("overflowWrap: 'anywhere'"), '提示泰语 1.55/anywhere');
  // 探测 effect 依赖 gate（撤除 ⇒ 同一挂载放行）
  assert.ok(TAROT_CARD.includes('}, [accessToken, chartSig, !!gate]);'), 'gate 进 effect 依赖');
  // 宿主：付费墙态传 gate；解锁态不传
  const paywallMount = between(APP, '<PaywallCard lang={lang} loading={loading}', '// Logged in — show button or result');
  assert.ok(paywallMount.includes("<TarotDailyCard") && paywallMount.includes("gate={{ hint: resT(lang, 'tarot_gate_hint') }}"), '付费墙态今日塔罗挂门禁');
  const unlocked = APP.slice(APP.indexOf('// Logged in — show button or result'));
  const tarotOpen = unlocked.indexOf('<TarotDailyCard');
  assert.ok(tarotOpen > 0 && !unlocked.slice(tarotOpen, tarotOpen + 900).includes('gate={'), '解锁态不挂门禁（即刻恢复可点）');
  assert.equal((APP.match(/<TarotDailyCard/g) || []).length, 2, '双挂载数不变（E148-锁3j 同律）');
});

/* ═══════ 四 · 刀三：幸福坐标卡 ═══════ */
test('E158-4 刀三：Canvas 二维码整体退役＋底栏重排（品牌网址右下铭刻）；标题缩字；预览等比放大；/result 仅 1 枚「保存 / 分享幸福坐标卡」且一键高清 PNG＋原生分享', () => {
  // ① Canvas：二维码绘制/依赖/占位全退役；payload 契约不动（qrUrl 字段留档）
  for (const bad of ['qrcode-generator', 'drawQr', 'function roundRect', 'QR = 250', 'getModuleCount']) {
    assert.equal(HCORE.includes(bad), false, `Canvas 核残留二维码：${bad}`);
  }
  assert.ok(HCORE.includes('const footTop = H - 300;'), '底栏压顶发丝线');
  assert.ok(HCORE.includes("ctx.textAlign = 'right';\n  ctx.font = `36px ${SERIF[lang]}`; ctx.fillStyle = CHAMPAGNE;\n  ctx.fillText(String(p.brand || ''), W - 120, footTop + 46);"), '品牌网址右下对齐铭刻');
  assert.ok(HCORE.includes("{ fontSize: 40, lineHeight: 58, maxLines: 5, maxWidth: safe, minFontSize: 28 }"), '金句块放宽（safe 全宽、至多 5 行）');
  assert.ok(HCORE.includes('const quoteTop = footTop - 64 - quote.lines.length * quote.lineHeight;'), '金句锚于底栏上方（零碰撞）');
  assert.ok(HCORE.includes("${p.qrUrl || ''}`);"), 'hash 输入不变（qrUrl 留档入 hash）');
  // ② 标题缩字 ＋ ③ 预览放大
  assert.ok(HCARD_CSS.includes('.ks-hcard-head {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  gap: 8px;\n  font-size: 13px;'), '标题 13px');
  assert.ok(HCARD_CSS.includes('width: min(300px, 100%);') && !/width:\s*min\(216px,\s*58vw\)/.test(HCARD_CSS), '预览等比放大（E157 为 216px/58vw）且以坐标卡内容盒为上限（不挤占内边距）');
  assert.equal(HCARD_CSS.includes('width: min(216px, 58vw);'), false, '旧预览尺寸退役');
  // ④ /result：预览框正下方按钮退役；唯一按钮＝合规声明下方（GoldCardExporter share 接管）
  assert.ok(HCARD.includes("const showSave = mount !== 'result';"), 'result 挂载位不渲染保存按钮');
  assert.ok(HCARD.includes('{showSave && <button className="ks-hcard-btn" onClick={onSave} disabled={busy} data-testid="ks-hcard-save">{busy ? \'…\' : resT(L, \'btn_save_share_card\')}</button>}'), '财富页唯一主按钮文案＝btn_save_share_card');
  assert.equal(HCARD.includes("'card_save_share'"), false, '旧键 card_save_share 退役');
  assert.ok(GOLD.includes('share?: { payload: Record<string, unknown>; fileStem: string; title: string } | null;'), '导出器 share 接管口');
  assert.ok(GOLD.includes("import { happinessCardToBlob } from '../../lib/happinessCard.mjs';"), 'Blob 直取（零 fetch）');
  assert.ok(GOLD.includes('await nav.share({ files: [file], title: share.title });'), '移动端支持环境原生分享');
  assert.ok(GOLD.includes('a.download = `${stem}.png`;') && GOLD.includes("setTimeout(() => URL.revokeObjectURL(url), 4000);"), '桌面 a download 落盘');
  assert.equal(GOLD.includes('fetch('), false, '离线铁律：零 fetch（E105 ④-2 沿革）');
  assert.ok(GOLD.includes("{busy ? t('forging') : (ctaLabel || t('cta'))}"), '按钮文案可覆盖（命盘金卡路径保留备复活）');
  assert.ok(APP.includes("<GoldCardExporter\n              locale={lang}\n") && APP.includes("share={{ payload: e156CardPayload, fileStem: `kindredsouls-${e156Scene}-card`, title: String(e156CardPayload.cardTitle || 'KindredSouls') }}") && APP.includes("ctaLabel={resT(lang, 'btn_save_share_card')}"), '/result 金卡导出器＝保存/分享幸福坐标卡');
  assert.equal(APP.includes("'🏅 保存命盘金卡'"), false, 'App.tsx 不再直出「保存命盘金卡」');
  // 页面级唯一性：/result 报告区（金属框 → 年鉴卡）内「保存/分享幸福坐标卡」入口恰 1 枚
  const zone = between(APP, '<div data-testid="compat-once-metal-frame"', 'data-testid="e158-almanac"');
  assert.equal((zone.match(/btn_save_share_card/g) || []).length, 1, '恰 1 枚保存/分享幸福坐标卡按钮');
  assert.ok(zone.indexOf("className=\"ks-compliance-note\" data-testid=\"e157-disclaimer-result\"") < zone.indexOf('<GoldCardExporter'), '按钮位于合规声明下方');
  // 财富页：坐标卡唯一主按钮（不新增第二枚）
  const WEALTH = read('web/src/pages/WealthReportPage.tsx');
  assert.equal((WEALTH.match(/<HappinessCard /g) || []).length, 1, '财富页坐标卡单挂载');
});

/* ═══════ 五 · 刀四：塔罗牌义三场景分流 ═══════ */
const BAN = {
  zh: /感情|恋|爱|伴侣|情侣|心动|婚姻|情人|浪漫|另一半|桃花/,
  en: /\b(romance|romantic|love|loves|loved|lover|lovers|soulmate|valentine|flirt|affair|marriage|married|dating|couple|couples|beloved|intimate|intimacy)\b/i,
  fr: /\b(amour|amoureux|amoureuse|romance|romantique|couple|couples|mariage|amant|maitresse|valentin|flirt)\b/i,
  es: /\b(amor|amores|enamora\w*|romance|romantic\w*|parejas?|matrimonio|novio|novia|amante|flirt\w*|alma gemela)\b/i,
  th: /ความรัก|คู่รัก|แฟน|คนรัก|คู่ครอง|แต่งงาน|วิวาห์|ชอบกัน|เทพ|พระ|ศาสนา|กรรม|คำทำนาย/,
  vi: /\b(tình yêu|người yêu|hôn nhân|luyến du|luyến ái|bạn tình|đôi lứa|vợ chồng|say đắm|thần|thánh|tôn giáo|nghiệp báo)\b/i,
};
test('E158-5 刀四：22 张 × 商道/挚友 × 六语牌义独立语境（零情感穿帮词、过 E157 合规侦测）；getTarot 场景分流（情爱逐字不变）；服务端读牌/深度报告吃场景牌义', () => {
  let cells = 0;
  for (const scene of ['business', 'friendship']) {
    const table = SCENES.TAROT_SCENE_MEANING[scene];
    for (let id = 0; id < 22; id++) {
      const row = table[id];
      assert.ok(row, `${scene} #${id} 缺行`);
      LANGS.forEach((L, i) => {
        const s = row[L];
        cells++;
        assert.ok(typeof s === 'string' && s.length >= 24, `${scene} #${id}.${L} 牌义在位`);
        assert.equal(BAN[L].test(s), false, `${scene} #${id}.${L} 情感/合规禁词：${(s.match(BAN[L]) || [])[0]}`);
        assert.deepEqual(PR.detectComplianceViolations(s), [], `${scene} #${id}.${L} E157 合规侦测`);
      });
      for (const L of ['en', 'fr', 'es', 'vi']) assert.equal(CJK.test(row[L]) || THAI.test(row[L]), false, `${scene} #${id}.${L} 零汉字/泰文混入`);
      assert.equal(THAI.test(row.th), true, `${scene} #${id}.th 须为泰文`);
      assert.equal(CJK.test(row.zh), true, `${scene} #${id}.zh 须为中文`);
    }
  }
  assert.equal(cells, 264, '264 格齐');
  assert.equal(SCENES.tarotSceneMeaning(8, 'zh', 'romance'), '', '情爱不入本表（回落 tarot.ts 既有牌义）');
  assert.equal(SCENES.tarotSceneMeaning(8, 'zh', 'business'), SCENES.TAROT_SCENE_MEANING.business[8].zh);
  assert.equal(SCENES.tarotSceneMeaning(8, 'xx', 'business'), SCENES.TAROT_SCENE_MEANING.business[8].en, '非法语种回落 en');
  // getTarot：抽牌零变、仅牌义分流
  assert.ok(TAROT_LIB.includes("import { tarotSceneMeaning } from './tarotScenes.mjs';"), 'tarot.ts 引渡场景牌义');
  assert.ok(TAROT_LIB.includes("export function getTarot(d1: string, d2: string, lang: string = 'en', scope: string = 'insight', scene: string = 'romance'): TarotCard {"), 'getTarot 第五参＝场景（缺省情爱）');
  for (const [d1, d2] of [['1992-08-21', '1994-02-09'], ['1988-01-01', '2000-12-31']]) {
    const r = TAROT.getTarot(d1, d2, 'zh', 'insight');
    const r5 = TAROT.getTarot(d1, d2, 'zh', 'insight', 'romance');
    const b = TAROT.getTarot(d1, d2, 'zh', 'insight', 'business');
    const f = TAROT.getTarot(d1, d2, 'zh', 'insight', 'friendship');
    assert.deepEqual(r, r5, '情爱：五参缺省与显式等价（逐字节不变）');
    assert.equal(b.id, r.id); assert.equal(f.id, r.id);
    assert.equal(b.name, r.name); assert.equal(b.orientation, r.orientation);
    assert.equal(b.meaning, SCENES.TAROT_SCENE_MEANING.business[r.id].zh, '商道牌义走场景表');
    assert.equal(f.meaning, SCENES.TAROT_SCENE_MEANING.friendship[r.id].zh, '挚友牌义走场景表');
    for (const L of LANGS) {
      const bm = TAROT.getTarot(d1, d2, L, 'monthly', 'business'); // 月报档独立卡槽（scope 盐）
      assert.equal(bm.meaning, SCENES.TAROT_SCENE_MEANING.business[bm.id][L], `${L} 月报档商道牌义`);
    }
  }
  // 宿主：两处 getTarot 均传场景；今日塔罗探测上送 scene
  assert.ok(APP.includes("const tarot = getTarot(d1, d2, lang, 'insight', e156Scene);") && APP.includes("const tarot = getTarot(d1, d2, lang, type, e156Scene);"), '洞察/月年报抽牌传场景');
  assert.ok(TAROT_CARD.includes("scene?: string;") && TAROT_CARD.includes("body: JSON.stringify(scene === 'romance' ? { lang, chart_sig: chartSig } : { lang, chart_sig: chartSig, scene }),"), '今日塔罗探测上送场景（情爱请求形态零变）');
  assert.ok(APP.slice(APP.indexOf('// Logged in — show button or result')).includes('<TarotDailyCard') && (APP.match(/<TarotDailyCard[\s\S]{0,500}?scene=\{e156Scene\}/g) || []).length === 2, '双挂载均绑场景');
  // 服务端：今日塔罗端点场景白名单＋缓存键掺场景＋Prompt 显式「never a romance reading」＋权威牌义
  assert.ok(SERVER.includes("const tarotScene = (b.scene === 'business' || b.scene === 'friendship') ? b.scene : 'romance';"), '端点场景白名单');
  assert.ok(SERVER.includes("const cacheKey = dayKey + '|' + chartSig + '|' + lang + (tarotScene === 'romance' ? '' : '|' + tarotScene);"), '缓存键掺语种＋场景（E148 键缺 lang ⇒ 异语同盘当日复读串语，真页实锤 th 页呈 zh 牌名与读牌）');
  assert.ok(SERVER.includes('async function _e148TarotDailyReading(draw, birthDate, lang, tarotScene = \'romance\') {'), '读牌吃场景');
  const sceneLine = between(SERVER, '// ✦ E158-刀四（主公军令 2026-11-26）：商道/挚友 ⇒ 牌义走场景语境', 'const userText = `Today\'s tarot card');
  assert.ok(sceneLine.includes('It is never a romance reading — never use romance wording.'), 'Prompt 显式非情爱解读');
  assert.ok(sceneLine.includes('collaboration resilience, decisiveness, boundaries of the bigger picture'), '商道焦点：协作韧性/决策魄力/格局边界');
  assert.ok(sceneLine.includes('sincere support, emotional ease, long-lasting mutual understanding'), '挚友焦点：真诚托底/情绪松弛/长久默契');
  assert.ok(sceneLine.includes("await import('./web/src/lib/tarotScenes.mjs')") && sceneLine.includes('tarotSceneMeaning(draw.id, lang, tarotScene)'), '牌义取六语权威字典');
  assert.ok(SERVER.includes('${langLine}${_e158SceneLine}`;'), '场景行拼入用户 Prompt');
  // 服务端：场景深度报告吃前端场景牌义（权威）
  assert.ok(SERVER.includes("`Tarot meaning for THIS scene (authoritative; never reframe it as a romance reading): ${_e156Clip(_e156Tarot.meaning, 900)}`"), '深度报告 Prompt 带场景牌义');
  // 付费墙加赠副标题按场景
  assert.ok(PAYWALL.includes("const bonusDetail = e156IsScene ? resT(lang, `tarot_bonus_detail_${e156Scene}`) : c.bonusDetail;"), '加赠副标题场景化（情爱沿用旧词条）');
  assert.equal(DICT.resT('zh', 'tarot_bonus_detail_business'), '洞察此刻合作局势的隐性变量');
  for (const L of LANGS) {
    for (const k of ['tarot_bonus_detail_business', 'tarot_bonus_detail_friendship']) {
      const v = DICT.resT(L, k);
      assert.equal(BAN[L].test(v), false, `${L} ${k} 情感词：${v}`);
      assert.deepEqual(PR.detectComplianceViolations(v), [], `${L} ${k} 合规`);
    }
  }
});

/* ═══════ 五之二 · 刀五：月/年报命名三场景对齐 ═══════ */
test('E158-6 刀五：付费墙＋年鉴两处月/年报命名三场景一对一对齐（价格永驻）；「姻缘月报/年报」「关系月报/年报」全站退役；商道/挚友入口与生成内核显式绑定 scene', () => {
  assert.ok(PAYWALL.includes("import { resT, resReportBtn } from '../lib/resonanceI18n.mjs';"), '付费墙引渡字典');
  assert.ok(PAYWALL.includes("const monthlyBtn = resReportBtn(lang, e156Scene, 'monthly');") && PAYWALL.includes("const yearlyBtn = resReportBtn(lang, e156Scene, 'yearly');"), '付费墙月/年报按钮三场景走字典');
  assert.ok(PAYWALL.includes('`📅 ${monthlyBtn}`') && PAYWALL.includes('`👑 ${yearlyBtn}`'), '按钮渲染前缀不动');
  assert.equal(PAYWALL.includes('monthlyBtn:'), false, '付费墙内联 monthlyBtn/yearlyBtn 旧词条退役');
  // 年鉴：情爱档 L_ALMANAC_BTN ＝ 字典情爱键＋金额（六语逐语对账，零双源漂移）；商道/挚友走 resAlmanacBtn
  const dict = between(APP, 'const L_ALMANAC_BTN', 'function AIInsightBlock');
  const LITERAL = {
    zh: ['📅 解锁情爱月报 $2.99', '👑 解锁情爱年报 $29.99'],
    en: ['📅 Unlock Romance Monthly $2.99', '👑 Unlock Romance Annual $29.99'],
    fr: ['📅 Mensuel · Amour $2,99', '👑 Annuel · Amour $29,99'],
    es: ['📅 Mensual · Amor $2,99', '👑 Anual · Amor $29,99'],
    th: ['📅 ปลดล็อกรายเดือนความรัก $2.99', '👑 ปลดล็อกรายปีความรัก $29.99'],
    vi: ['📅 Báo Cáo Tháng Tình Ái $2.99', '👑 Báo Cáo Năm Tình Ái $29.99'],
  };
  for (const L of LANGS) {
    const m = DICT.resT(L, 'btn_monthly_romance'), y = DICT.resT(L, 'btn_annual_romance');
    assert.equal(LITERAL[L][0], `📅 ${m} $${['fr', 'es'].includes(L) ? '2,99' : '2.99'}`, `${L} 年鉴月报＝字典情爱月报＋金额`);
    assert.equal(LITERAL[L][1], `👑 ${y} $${['fr', 'es'].includes(L) ? '29,99' : '29.99'}`, `${L} 年鉴年报＝字典情爱年报＋金额`);
    for (const lit of LITERAL[L]) assert.ok(dict.includes(`'${lit}'`) || dict.includes(`"${lit}"`), `${L} 年鉴词条在位：${lit}`);
  }
  assert.ok(APP.includes("(e156IsScene ? resAlmanacBtn(lang, e156Scene, 'monthly') : (L_ALMANAC_BTN[lang] || L_ALMANAC_BTN.en).monthly)"), '年鉴月报按钮三场景');
  assert.ok(APP.includes("(e156IsScene ? resAlmanacBtn(lang, e156Scene, 'yearly') : (L_ALMANAC_BTN[lang] || L_ALMANAC_BTN.en).yearly)"), '年鉴年报按钮三场景');
  for (const L of LANGS) {
    assert.equal(DICT.resAlmanacBtn(L, 'business', 'monthly'), `📅 ${DICT.resT(L, 'btn_monthly_business')} $${['fr', 'es'].includes(L) ? '2,99' : '2.99'}`);
    assert.equal(DICT.resAlmanacBtn(L, 'friendship', 'yearly'), `👑 ${DICT.resT(L, 'btn_annual_friendship')} $${['fr', 'es'].includes(L) ? '29,99' : '29.99'}`);
  }
  // 退役词：App.tsx / PaywallCard 零残留（按钮文案层；注释不计——按字符串字面扫描）
  for (const bad of ["'📅 解锁姻缘月报 $2.99'", "'👑 解锁姻缘年报 $29.99'", 'Unlock Monthly Love Report', 'Unlock Annual Love Report', 'Mở Khóa Báo Cáo Nhân Duyên', 'Informe Mensual de Amor', 'Rapport Mensuel']) {
    assert.equal(APP.includes(bad) || PAYWALL.includes(bad), false, `退役文案残留：${bad}`);
  }
  // 入口与内核显式绑定 scene：月/年报请求体带 scene＋称呼（E156 沿革不动）；服务端场景分支吃 scene
  assert.ok(APP.includes('scene: e156Scene, nameA: e156NameA, nameB: e156NameB,'), '月/年报请求体显式带 scene');
  assert.ok(APP.includes("getTarot(d1, d2, lang, type, e156Scene)"), '月/年报抽牌绑定 scene');
  assert.ok(SERVER.includes("_e156Scene = normalizeOverlayScene(req.body && req.body.scene)") || /_e156Scene\s*=\s*normalizeOverlayScene\(/.test(SERVER), '服务端归一 scene');
  assert.ok(SERVER.includes("reportType: 'monthly'") && SERVER.includes("reportType: 'yearly'"), '月/年报档位不动');
});

/* ═══════ 六 · 刀六：情爱报告称呼代入 ═══════ */
test('E158-7 刀六：情爱深度报告正文融入双方称呼——请求上送＋缓存键掺称呼盐＋Prompt 逐字原样锁＋违规重试恰一次；未填称呼请求形态零变', () => {
  // 客户端：情爱且亲填称呼 ⇒ nameA/nameB 随洞察上送（商道/挚友分支字面不动）
  assert.ok(APP.includes("} : (e156Scene === 'romance' && (e156NameA || e156NameB)) ? {"), '情爱上送分支');
  assert.ok(APP.includes("// ✦ E158-刀六：情爱 ⇒ 亲填称呼随洞察上送（服务端逐字原样锁＋重试恰一次；未填 ⇒ 请求形态零变）\n            nameA: e156NameA, nameB: e156NameB,\n          } : {}),"), 'nameA/nameB 上送');
  assert.ok(APP.includes('...(e156IsScene ? {'), '商道/挚友上送分支字面不动（E156 沿革）');
  // 服务端：旧逻辑分支（情爱深度报告）内
  const legacy = between(SERVER, '// ── 普通合盘洞察(旧逻辑)──', 'prompt_version: `v1.0.0-');
  assert.ok(legacy.includes("const _e158A = (reportType === 'compatibility') ? sanitizeDisplayName(req.body && req.body.nameA) : '';"), '称呼清洗（与 E156 同规则）');
  assert.ok(legacy.includes("const _e158B = (reportType === 'compatibility') ? sanitizeDisplayName(req.body && req.body.nameB) : '';"), '对方称呼清洗');
  assert.ok(legacy.includes('const _e158Salt = _e158Typed.length ? `|e158_${_e158NameH(_e158A, _e158B)}` : \'\';'), '缓存键掺称呼哈希盐');
  assert.ok(legacy.includes('const cacheKey = `${d1 || \'\'}|${d2 || \'\'}|${lang}|${reportType}${_e158Salt}`;'), '未填 ⇒ 缓存键逐字节不变');
  const nameLock = between(legacy, '[NAME LOCK — MANDATORY]', 'const _e158NameMiss =');
  assert.ok(nameLock.includes('exactly as written — character-for-character; never transliterated, translated, respelled or shortened'), 'Prompt 硬规矩：逐字原样、严禁音译意译');
  assert.ok(nameLock.includes("${_e158Typed.join(' ; ')}"), '称呼逐条点名');
  assert.ok(legacy.includes("messages: [{ role: 'system', content: LEGAL_COMPLIANCE_GUARDRAILS }, { role: 'user', content: e158Prompt }]"), 'DeepSeek 直连吃 e158Prompt（system＝E157 护栏）');
  assert.ok(legacy.includes('contents: [{ parts: [{ text: e158Prompt }] }],'), 'Gemini 兜底吃 e158Prompt');
  assert.equal(legacy.split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n').includes("{ role: 'user', content: prompt }"), false, '旧字面 content: prompt 已后继化为 e158Prompt');
  const retry = between(SERVER, '// ✦ E158-刀六：称呼原样锁——亲填称呼未逐字出现', 'prompt_version: `v1.0.0-');
  assert.equal((retry.match(/await callAI\(/g) || []).length, 1, '违规重试恰一次');
  assert.ok(retry.includes('if (_e158Typed.length && _e158NameMiss(insight).length) {'), '仅亲填称呼才校验/重试');
  assert.ok(retry.includes('[NAME LOCK VIOLATION — FIX]'), '重试带违规点名');
  assert.ok(retry.includes('_e158NameMiss(_e158Retry).length < _e158NameMiss(insight).length) insight = _e158Retry;'), '重试稿更优才替换');
  assert.ok(retry.includes('// ✦ E158-刀六：称呼原样锁——亲填称呼未逐字出现（被音译/意译/改写）⇒ 带违规点名重试恰一次'), '仍不达标 ⇒ 照常交付不 500（严于 E156：重试稿须更优）');
});

/* ═══════ 七 · 刀七：单活手风琴 ═══════ */
test('E158-8 刀七：/result 四付费报告区单活互斥；收起＝黑金折叠条（✦ 标题 · 已解锁 ｜ 展开重温 ▼）；DOM 常驻零卸载；同档已生成 ⇒ 原地重开（零重复付费/零重复请求）', () => {
  assert.ok(FOLD.includes('data-testid={`e158-fold-${id}`}') && FOLD.includes('data-testid={`e158-bar-${id}`}') && FOLD.includes('aria-expanded="false"'), '折叠壳：面板＋折叠条 testid');
  assert.ok(FOLD.includes("✦ {title} · <span className=\"ks-e158-bar-unlocked\">{unlockedLabel}</span>") && FOLD.includes('<span className="ks-e158-bar-reopen">{reopenLabel}</span>'), '折叠条结构：✦ 标题 · 已解锁 ｜ 展开重温 ▼');
  assert.ok(FOLD.includes("const hidden: CSSProperties = active ? {} : { display: 'none' };"), '收起＝display:none（DOM 常驻，零卸载）');
  assert.equal(FOLD.includes('fetch('), false, '折叠壳零请求');
  // 状态机（叠加在 reportText 管线之上，原状态机字面不动）
  for (const must of [
    "const [e158ReportKind, setE158ReportKind] = useState<'monthly' | 'yearly'>('monthly');",
    "const [e158Active, setE158Active] = useState<'once' | 'tarot' | 'monthly' | 'yearly'>(() => {",
    "sessionStorage.getItem('ks_e158_focus_panel')",
    "const [e158TarotDone, setE158TarotDone] = useState(false);",
    "const e158Panel: 'once' | 'tarot' | 'monthly' | 'yearly' = (e158Active === 'tarot' && !e158TarotDone) ? 'once' : e158Active;",
    "sessionStorage.getItem('ks_e158_report_archive')",
    "sessionStorage.setItem('ks_e158_report_archive', JSON.stringify(a));",
    'setE158ReportKind(type);\n    setE158Active(type);',
    "const e158AlmanacClick = (kind: 'monthly' | 'yearly') => {",
    "if (!reportLoading && e158HasArchive(kind)) { e158Reopen(kind); return true; }",
  ]) assert.ok(APP.includes(must), `刀七状态机缺：${must.slice(0, 60)}`);
  assert.ok(APP.indexOf('setReportLoading(type);\n    setReportText(null);') < APP.indexOf('setE158ReportKind(type);\n    setE158Active(type);'), '抢焦点发生在既有生成起点之后（管线不动）');
  // 单次深度报告区入折（金属框→灵宠认领整段；E133/E155/E157 既有顺序字面不动）
  const iOpen = APP.indexOf('<E158Fold id="once" active={e158Panel === \'once\'} onReopen={() => e158Reopen(\'once\')}');
  const iFrame = APP.indexOf('<div data-testid="compat-once-metal-frame"');
  const iAdopt = APP.indexOf('{insight && c1 && (', iFrame);
  const iClose = APP.indexOf('</E158Fold>');
  assert.ok(0 < iOpen && iOpen < iFrame && iFrame < iAdopt && iAdopt < iClose, '单次深度报告区整体入折（金属框→灵宠认领）');
  assert.ok(APP.slice(iClose, iClose + 700).includes('data-testid="e158-almanac"'), '折叠壳收口后即年鉴卡');
  // 年鉴卡：折叠条＋长卷常驻壳
  assert.ok(APP.includes("{reportText && e158Panel !== e158ReportKind && ("), '场景月/年报收起态条件');
  assert.ok(APP.includes('data-testid={`e158-bar-${e158ReportKind}`}') && APP.includes('onClick={() => e158Reopen(e158ReportKind)}'), '月/年报折叠条点击原地重开');
  assert.ok(APP.includes("✦ {resReportTitle(lang, e156Scene, e158ReportKind)} · <span className=\"ks-e158-bar-unlocked\">{e158ReopenParts[0]}</span>"), '折叠条标题随场景');
  // 月报/年报各自独立折叠条（两档都已生成 ⇒ 两条恒在，逐一重温）
  assert.ok(APP.includes("const [e158Archived, setE158Archived] = useState<{ monthly: boolean; yearly: boolean }>({ monthly: false, yearly: false });"), '已归档档位状态');
  assert.ok(APP.includes("{(['monthly', 'yearly'] as const).filter((k) => k !== e158ReportKind && e158Archived[k]).map((k) => ("), '另一档归档报告独立折叠条');
  assert.ok(APP.includes("data-testid={`e158-bar-${k}`} onClick={() => e158Reopen(k)} aria-expanded=\"false\""), '另一档折叠条点击原地重开');
  assert.ok(APP.includes('<div data-testid="e158-fold-report" style={e158Panel === e158ReportKind ? undefined : { display: \'none\' }}>'), '长卷壳：收起不卸载');
  assert.ok(APP.includes('const e158ReopenParts = React.useMemo(() => splitReopenLabel(lang), [lang]);'), '折叠条文案走字典');
  // 年鉴按钮：同档已生成 ⇒ 先拦截原地重开，再走购买链（购买链字面不动）
  assert.ok(APP.includes("onClick={() => { if (e158AlmanacClick('monthly')) return; handlePurchase('compatibility_monthly_report'); }}"), '月报按钮：已生成 ⇒ 重开，否则购买');
  assert.ok(APP.includes("onClick={() => { if (e158AlmanacClick('yearly')) return; handlePurchase('compatibility_yearly_report'); }}"), '年报按钮：已生成 ⇒ 重开，否则购买');
  // 今日塔罗：收起态在组件内（已呈牌且他区抢焦点）；牌名＋正逆位随行
  assert.ok(TAROT_CARD.includes("accordion?: { collapsed: boolean; onReopen: () => void; reopenLabel: string } | null;"), '手风琴 prop');
  assert.ok(TAROT_CARD.includes("if (accordion && accordion.collapsed && phase === 'done' && data) {"), '仅已呈牌才折叠（未购保持购买引导态）');
  assert.ok(TAROT_CARD.includes('data-testid="e158-bar-tarot"') && TAROT_CARD.includes('onClick={accordion.onReopen}'), '塔罗折叠条点击原地重开');
  assert.ok(TAROT_CARD.includes("{cardName} · {orientLabel}"), '塔罗折叠条带当日牌名＋正/逆位');
  assert.ok(TAROT_CARD.includes("<span className=\"ks-e158-bar-reopen\">{accordion.reopenLabel}</span>") && !TAROT_CARD.includes("{accordion.reopenLabel} ▼"), '塔罗折叠条「展开重温 ▼」（reopenLabel 自带 ▼，禁重复渲染成双箭头——真页实锤）');
  assert.ok(TAROT_CARD.includes("onPhaseChange?: (phase: 'probe' | 'locked' | 'limit' | 'error' | 'done' | 'gate') => void;"), '相位外报');
  assert.ok(TAROT_CARD.includes('useEffect(() => { if (onPhaseChange) onPhaseChange(phase); }, [phase]);'), '相位变化即外报');
  assert.ok(APP.includes("accordion={{ collapsed: e158Panel !== 'tarot', onReopen: () => e158Reopen('tarot'), reopenLabel: e158ReopenParts[1] }}"), '解锁态今日塔罗接手风琴');
  assert.ok(APP.includes("sessionStorage.setItem('ks_e158_focus_panel', 'tarot')"), '塔罗付讫回场焦点信号');
  // 折叠条样式
  assert.ok(APP_CSS.includes('.ks-e158-bar-reopen {\n  flex: none;\n  padding: 6px 12px;\n  border-radius: 999px;'), '「展开重温」香槟金胶囊');
  assert.ok(APP_CSS.includes('.ks-e158-bar-unlocked { color: rgba(243, 229, 171, 0.72); font-weight: 600; }'), '「已解锁」浅香槟');
});

/* ═══════ 八 · 零越界 ═══════ */
test('E158-9 零越界：沙盒态与定价不动；E159 支付回跳自动生成封存未执行；零新页面/零独立对话窗；E157 护栏与称呼原样锁在位', () => {
  assert.equal(SB.SANDBOX_PLAN_PRICE.compatibility_once, '$4.99', '$4.99 不变');
  assert.equal(SB.SANDBOX_PLAN_PRICE.compatibility_monthly_report, '$2.99', '月报 $2.99 不变');
  assert.equal(SB.SANDBOX_PLAN_PRICE.compatibility_yearly_report, '$29.99', '年报 $29.99 不变');
  assert.equal(SB.SANDBOX_PLAN_PRICE.tarot_daily_once, '$1.99', '今日塔罗 $1.99 不变');
  for (const bad of ['e159', 'E159', "'/resonance'", '/invite/', "window.open("]) {
    assert.equal(APP.includes(bad), false, `App.tsx 不得出现：${bad}`);
  }
  for (const bad of ['e159', 'E159', "'/resonance'", '/invite/']) {
    assert.equal(SERVER.includes(bad), false, `server.js 不得出现：${bad}`);
  }
  // 既有管线不动（钉死字面抽检）
  for (const keep of ['setReportText((prev) => (prev == null ? String(t) : prev + String(t)))', "if (reportText === null) { compatReturnTopRef.current = false; return; }", "reportText.split('\\n\\n')", 'className="ks-report-scroll" data-testid="compat-report-scroll" ref={compatScrollRef}']) {
    assert.ok(APP.includes(keep), `reportText 管线字面漂移：${keep.slice(0, 50)}`);
  }
  assert.ok(PR.LEGAL_COMPLIANCE_GUARDRAILS.startsWith('### GLOBAL & AUSTRALIAN LEGAL COMPLIANCE GUARDRAILS (NON-NEGOTIABLE)'), 'E157 护栏在位');
  assert.equal(typeof PR.sanitizeDisplayName, 'function');
  assert.equal(PR.sanitizeDisplayName('  小明 '), '小明');
});

/* ═══════ 九 · 链位自保（下界＋收口位） ═══════ */
test('E158-10 【链位自保】闸门挂入 test:astro 且不顶飞收口位（插在 e157 之后、e40-compat 恒 len-2、python 恒链尾）', () => {
  const pkg = JSON.parse(read('package.json'));
  const segs = pkg.scripts['test:astro'].split(/\s*&&\s*|\s*\|\|\s*/).map((x) => x.trim()).filter(Boolean);
  const me = segs.findIndex((x) => x.includes('audit-e158-visual-consistency'));
  assert.ok(me !== -1, '未入编 test:astro');
  assert.ok(segs.length >= 124, `链段数下界（实为 ${segs.length}）`);
  const i157 = segs.findIndex((x) => x.includes('audit-e157-compliance-guardrails'));
  const iCap = segs.findIndex((x) => x.includes('audit-e40-compat-synastry-tensor-fusion'));
  assert.equal(iCap, segs.length - 2, `收口位漂移：e40-compat 应为 len-2（实为 ${iCap}/${segs.length}）`);
  assert.ok(i157 !== -1 && i157 + 1 === me && me < iCap, 'E158 闸门须紧插在 e157 之后、收口位之前');
  assert.ok(segs[segs.length - 1].includes('python3'), 'python 恒链尾');
});
