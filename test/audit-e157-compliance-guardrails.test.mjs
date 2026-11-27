// ⚖️ E157（主公军令 2026-11-26）：澳洲与国际合规护栏闸门 —— 称呼去真名化引导 × Prompt 合规锁
//   × 六语显性定位声明 × 协议禁限条款增补。对标 ACL s 18、统一诽谤法、ASIC 无牌建议红线、年龄歧视法。
//   零越界：不改付费流（$4.99 统一定价 / 手动点击生成 / PAYMENT_MODE 不动；自动生成＝E158 封存）；
//   不碰 SwissEph 真理锁、缺时辰显式降级、称呼原样锁、幸福坐标卡渲染；严禁挂载独立对话窗。
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
const WEALTH = read('web/src/pages/WealthReportPage.tsx');
const POLICY = read('web/src/pages/PolicyPage.tsx');
const MODAL = read('web/src/components/legal/LegalTermsModal.tsx');
const PR = await mod('lib/resonance/resonancePrompt.mjs');
const DICT = await mod('web/src/lib/resonanceI18n.mjs');
const LEGAL = await mod('web/src/i18n/legalTerms.mjs');
const G = PR.LEGAL_COMPLIANCE_GUARDRAILS;
const HEADER = '### GLOBAL & AUSTRALIAN LEGAL COMPLIANCE GUARDRAILS (NON-NEGOTIABLE)';
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

/* ═══════ 一 · 刀二：四引擎 System Prompt 均完整注入 ═══════ */
test('E157-1 四引擎 System Prompt 均完整注入 GLOBAL & AUSTRALIAN LEGAL COMPLIANCE GUARDRAILS（商道/挚友/情爱/财富）', async () => {
  assert.ok(G.startsWith(HEADER), '护栏标题逐字');
  for (const must of [
    'Strict Anti-Defamation & Non-Judgmental Framing',
    'untrustworthy, deceitful, dishonest, manipulative, likely to betray, or will steal',
    'No Unlicensed Business, Financial, Legal, or HR Directives',
    'equity or shareholding ratios', 'sign, terminate, sue or renegotiate a contract',
    'hiring, firing, promoting, screening', 'credit scores', 'due-diligence verdicts',
    'No Misleading Predictions', 'ACL s 18', 'guaranteed success, destined to fail, 100% accurate',
    'reflective archetype', 'Age Discrimination Act',
  ]) assert.ok(G.includes(must), `护栏缺句：${must}`);
  // 护栏自身须过纯净锁（禁词只以同义禁令出现，绝不落字面）
  for (const L of LANGS) assert.equal(PR.checkResonancePurity(G, L).ok, true, `护栏自身纯净锁[${L}]：` + PR.checkResonancePurity(G, L).violations.join(','));

  // ① 商道 / 挚友：叠加层＝完整 system ⇒ 三档均含且恰一次、居尾
  for (const scene of ['business', 'friendship']) {
    for (const rt of ['once', 'monthly', 'yearly']) {
      const o = PR.buildSceneOverlay({ scene, locale: 'en', reportType: rt, nameA: '阿山', nameB: '老北' });
      assert.equal(o.split(HEADER).length - 1, 1, `${scene}/${rt} 护栏恰一次`);
      assert.ok(o.endsWith(G), `${scene}/${rt} 护栏居尾`);
      assert.ok(o.indexOf('NAME LOCK — HARD RULE') < o.indexOf('SCENE HARD RULES') && o.indexOf('SCENE HARD RULES') < o.indexOf(HEADER), `${scene}/${rt} 称呼锁/场景硬规则在前、护栏在后`);
    }
  }
  // ② server.js 引渡 ＋ 情爱三档（once/月报/年报）尾部注入（商道/挚友不重复）
  assert.ok(SERVER.includes("import { LEGAL_COMPLIANCE_GUARDRAILS, detectComplianceViolations } from './lib/resonance/resonancePrompt.mjs';"), '引渡');
  const h = between(SERVER, "app.use('/api/ai-advisor', async (req, res) => {", '// ── Serve static frontend (dist/) ──');
  assert.ok(h.includes('if (!_e156Overlay) _compat.system = `${_compat.system}\\n\\n${LEGAL_COMPLIANCE_GUARDRAILS}`;'), '情爱三档尾部注入');
  assert.ok(h.indexOf('if (_e156Overlay) _compat.system = `${_compat.system}\\n${_e156Overlay}`;') < h.indexOf('if (!_e156Overlay) _compat.system ='), '叠加层在前、护栏在后');
  assert.equal(PR.buildSceneOverlay({ scene: 'romance', locale: 'en', reportType: 'once' }), '', '情爱叠加层仍为空串（既有链零注入）');
  // 情爱免费四句洞察：system 位同受护栏
  // 🔴 后继化（E158-刀六）：免费洞察 user 位改吃 e158Prompt（未填称呼时与 prompt 逐字节相等）——system 位护栏不动
  assert.ok(h.includes("messages: [{ role: 'system', content: LEGAL_COMPLIANCE_GUARDRAILS }, { role: 'user', content: e158Prompt }]"), '免费洞察 system 位注入');
  assert.ok(h.includes("contents: [{ parts: [{ text: e158Prompt }] }],"), '免费洞察 Gemini 兜底同吃 e158Prompt');
  // ③ 财富：applyWealthReportPromptGuards 单点（双通道两处调用）＋ 逐字内联镜像
  const fn = between(SERVER, 'function applyWealthReportPromptGuards(', '\nfunction buildWealthReportPrompt(');
  assert.equal((SERVER.match(/^[ \t]+applyWealthReportPromptGuards\(\s*prompt\s*,\s*lang\s*,\s*reportType\s*,\s*astroMatrix\s*,\s*birthDate\s*\)/gm) || []).length, 2, '财富双通道单点调用');
  const gl = fn.indexOf('[GROUNDED ABUNDANCE LAYER');
  const gi = fn.indexOf(HEADER);
  assert.ok(gl !== -1 && gi !== -1 && gl < gi, '财富：丰盛底色层在前、合规护栏在后');
  for (const line of G.split('\n')) assert.ok(fn.includes(`'${line}',`), `财富内联镜像逐字缺行：${line.slice(0, 50)}`);
  assert.equal((fn.match(new RegExp(HEADER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length, 1, '财富护栏恰一次');
  const vm = await import('node:vm');
  const startTag = "  prompt.system = String(prompt.system || '') + '\\n\\n' + [";
  const s2 = fn.indexOf(startTag, fn.indexOf(startTag) + 1);
  const tail = fn.slice(s2, fn.indexOf("].join('\\n');", s2) + "].join('\\n');".length);
  const box = { prompt: { system: 'S', user: 'U' } };
  vm.runInNewContext(tail + '\nthis.out = prompt;', box);
  assert.equal(box.out.system, 'S\n\n' + G, '财富护栏 VM 直调：前缀零扰动＋护栏逐字');
  assert.equal(box.out.user, 'U', 'user 提示词零扰动');
  assert.ok(fn.includes('\n  return prompt;\n}'), '尾注后原样返回');
  assert.ok(fn.lastIndexOf(HEADER) < fn.lastIndexOf('\n  return prompt;\n}'), '护栏在 return 之前');
  // 缓存换版：旧场景缓存（无护栏稿）不复用
  assert.ok(h.includes('|e157v3_${_e156Scene}_'), '场景缓存键换版 v3');
  assert.equal(h.includes('|e156v2_'), false, '旧 v2 键绝迹');
});

/* ═══════ 二 · 商道报告抽测：零诽谤词 / 零保证盈利·招聘筛选指令 ═══════ */
test('E157-2 商道报告抽测：零诽谤词、零保证盈利/招聘筛选指令；违规样本必被侦测（只侦测不改写）', () => {
  const sys = PR.buildSceneOverlay({ scene: 'business', locale: 'zh', reportType: 'once', nameA: '阿山', nameB: '老北' });
  // 合规章（样本）：中性系统性动态表述摩擦盲区
  const clean = [
    '【核心共振定调】',
    '阿山与老北的节奏并不相同：阿山偏快、先出手再校准，老北偏稳、先对齐再推进。这种速度差不是谁的错，而是两套决策节拍需要显式对齐。当两人在同一张桌面写下共同目标时，互补会成为最稳的底色。',
    '',
    '【天赋与角色分工】',
    '阿山适合打开局面、对外试探机会；老北擅长把机会落成流程与数字。建议把「谁拍板、谁复核」在合作第一周就写清楚，角色清楚，摩擦自然变少。',
    '',
    '【盲区与摩擦预警】',
    '摩擦点集中在信息不同步：阿山的新想法若没有及时同步，老北会感到被动。把「周度对齐」固化为制度，盲区就会从隐患变成提醒。',
    '',
    '【关系校准建议】',
    '一是每周固定一次 30 分钟目标对齐；二是重大承诺前留 24 小时冷静期；三是把分歧写进共享文档而不是留在情绪里。两人都愿意校准，合作就有长久的空间。',
  ].join('\n');
  const washed = PR.washSceneReport(clean, 'zh', ['阿山', '老北']);
  assert.equal(washed.text, clean, '合规样本零改写');
  assert.deepEqual(PR.detectComplianceViolations(washed.text), [], '合规样本零命中');
  assert.deepEqual(PR.nameLockViolations(washed.text, '阿山', '老北'), [], '称呼原样锁完好');
  assert.equal(PR.checkResonancePurity(washed.text, 'zh').ok, true, '单语纯净锁完好');
  // 违规样本（人身指控 / 定论式预测 / 无牌指令）必被侦测
  for (const [bad, kind] of [
    ['老北 untrustworthy，而且 likely to betray。', 'defamation'],
    ['阿山 manipulative 且 dishonest。', 'defamation'],
    ['这次合作 guaranteed success。', 'prediction'],
    ['此项目 destined to fail。', 'prediction'],
    ['保证盈利，稳赚不赔。', 'prediction'],
    ['建议解雇他，不要与其合作。', 'directive'],
    ['股权比例为 60。', 'directive'],
    ['Run a background check on 老北。', 'directive'],
  ]) {
    const hits = PR.detectComplianceViolations(bad);
    assert.ok(hits.some((x) => x.kind === kind), `违规样本须命中 ${kind}：${bad} ⇒ ${JSON.stringify(hits)}`);
  }
  // 只侦测不改写：server.js 场景报告链「扫描在清洗之后、不回写、不 500」
  const d = between(SERVER, "if (_e156Overlay && reportType === 'compatibility') {", '// ── 普通合盘洞察(旧逻辑)──');
  assert.ok(d.includes('const _e157Hits = detectComplianceViolations(_e156Text);'), '产出侧合规扫描接线');
  assert.ok(d.indexOf('_e156Text = _e156Washed.text;') < d.indexOf('detectComplianceViolations(_e156Text)'), '扫描在终帧清洗之后');
  assert.equal(d.includes('_e156Text = _e157Hits'), false, '扫描结果不回写正文');
  assert.ok(d.includes('return res.json({ insight: _e156Text, cached: false });'), '报告照常交付');
});

/* ═══════ 三 · 既有锁完好（称呼原样 / 真理锁 / 降级 / 单语纯净） ═══════ */
test('E157-3 称呼原样锁 / SwissEph 真理锁 / 缺时辰显式降级 / 单语纯净锁 全部完好', () => {
  assert.deepEqual(PR.nameLockViolations('อเล็กซ์ กับ แซม คู่ค้าที่ดี', 'Alex', 'Sam'), ['Alex', 'Sam'], '音译即违规');
  assert.deepEqual(PR.nameLockViolations('Alex and Sam work well together.', 'Alex', 'Sam'), [], '逐字在场零违规');
  for (const scene of ['business', 'friendship']) {
    const o = PR.buildSceneOverlay({ scene, locale: 'th', reportType: 'once', nameA: 'Alex', nameB: 'Sam' });
    for (const must of ['NAME LOCK — HARD RULE', 'NEVER transliterate, romanize, respell, translate, localize', '5. Cite ONLY planet signs that appear earlier in this prompt; never invent a placement.']) {
      assert.ok(o.includes(must), `${scene} 缺：${must}`);
    }
    assert.ok(o.includes('The other person\'s name is the exact string: Sam'), '称呼入 prompt');
  }
  const h = between(SERVER, "app.use('/api/ai-advisor', async (req, res) => {", '// ── Serve static frontend (dist/) ──');
  assert.ok(h.includes('await buildCompatSynastryTruth(req.body || {}, d1, d2)'), 'SwissEph 双盘真值块');
  assert.ok(h.includes('DEGRADATION NOTICE: at least one birth time is unknown'), '缺时辰显式降级');
  assert.ok(h.includes('DEGRADATION NOTICE') && h.includes('MUST NOT mention an Ascendant or any house placement'), '降级禁写上升/宫位');
  assert.ok(h.includes('const _e156Washed = washSceneReport(_e156Text, lang, _e156Typed ? [_e156A, _e156B] : []);'), '终帧纯净锁（保护称呼）');
  assert.ok(h.includes("if (_e156Text.length < 200) {"), '空文 fail-closed');
  const bad = '上帝保佑你们。[' + 'AGAPE ' + ']';
  assert.equal(PR.checkResonancePurity(bad, 'zh').ok, false, '纯净锁仍拦宗教说教/外部专名');
});

/* ═══════ 四 · 刀一＋刀四：称呼去真名化引导（六语权威字典） ═══════ */
test('E157-4 称呼去真名化引导：placeholder 六语逐字＝昵称/代号；选填；前后端不标记实名身份字段', () => {
  const MANDATED = {
    nickname_self_placeholder: {
      // 🔴 后继化（E158-刀一/刀八，主公裁决 placeholder 裁切 ⇒ 刀八精简字典逐字）
      zh: '你的昵称或代号（选填）', en: 'Your nickname (optional)', fr: 'Votre surnom (facultatif)',
      es: 'Tu apodo (opcional)', th: 'ชื่อเล่นของคุณ (ไม่บังคับ)', vi: 'Biệt danh của bạn (tùy chọn)',
    },
    nickname_partner_placeholder: {
      // 🔴 后继化（E159-刀六，主公军令 2026-11-27 精简措辞 ⇒ placeholder 零裁切）
      zh: 'TA 的昵称或代号（选填）', en: 'Their nickname (opt.)', fr: 'Surnom (facultatif)',
      es: 'Su apodo (opc.)', th: 'ชื่อเล่นอีกฝ่าย (ไม่บังคับ)', vi: 'Biệt danh họ (tùy chọn)',
    },
    compliance_disclaimer_short: {
      zh: '仅供文化探索、娱乐与自我觉察参考，不构成任何商业决策、金融、法律或人力资源建议。',
      en: 'For cultural exploration, entertainment, and personal reflection only. Not business, financial, legal, or HR advice.',
      fr: 'À des fins d\'exploration culturelle, de divertissement et de réflexion personnelle uniquement. Ne constitue pas un conseil commercial, financier, juridique ou RH.',
      es: 'Solo para exploración cultural, entretenimiento y reflexión personal. No constituye asesoramiento comercial, financiero, legal ni de RR. HH.',
      th: 'เพื่อการสำรวจเชิงวัฒนธรรม ความบันเทิง และการทบทวนตนเองเท่านั้น ไม่ถือเป็นคำแนะนำทางธุรกิจ การเงิน กฎหมาย หรือการบริหารบุคคล',
      vi: 'Chỉ nhằm mục đích khám phá văn hóa, giải trí và chiêm nghiệm bản thân; không cấu thành tư vấn kinh doanh, tài chính, pháp lý hay nhân sự.',
    },
    tos_prohibited_use_notice: {
      zh: '本平台报告及坐标卡严禁用于招聘筛选、解雇、绩效考核、信贷评估或正式尽职调查；内容仅供本人私密参考，若自行对外转发或公开分享，相关责任由用户自行承担。',
      en: 'Reports and Coordinate Cards must not be used for hiring, termination, performance evaluation, credit scoring, or due diligence. Content is for personal reference only; users assume full responsibility for any third-party sharing or disclosure.',
      fr: "Les rapports et Cartes de Coordonnées ne doivent pas être utilisés pour le recrutement, le licenciement, l'évaluation professionnelle, l'évaluation de crédit ou la diligence raisonnable. Contenu réservé à un usage personnel ; l'utilisateur assume l'entière responsabilité de tout partage avec des tiers.",
      es: 'Los informes y Tarjetas de Coordenadas no deben usarse para contratación, despido, evaluación laboral, evaluación crediticia ni debida diligencia. El contenido es solo para referencia personal; el usuario asume toda responsabilidad por compartirlo con terceros.',
      th: 'ห้ามนำรายงานและการ์ดพิกัดไปใช้ในการคัดเลือกพนักงาน เลิกจ้าง ประเมินผลงาน พิจารณาสินเชื่อ หรือการตรวจสอบสถานะทางธุรกิจ เนื้อหามีไว้เพื่อการอ้างอิงส่วนบุคคลเท่านั้น ผู้ใช้ต้องรับผิดชอบต่อการเผยแพร่หรือส่งต่อให้บุคคลที่สามด้วยตนเอง',
      vi: 'Nghiêm cấm sử dụng báo cáo và Thẻ Tọa Độ cho tuyển dụng, sa thải, đánh giá nhân sự, thẩm định tín dụng hoặc thẩm định pháp lý. Nội dung chỉ mang tính tham khảo cá nhân; người dùng tự chịu hoàn toàn trách nhiệm khi chia sẻ cho bên thứ ba.',
    },
  };
  for (const [k, row] of Object.entries(MANDATED)) {
    for (const L of LANGS) assert.equal(DICT.resT(L, k), row[L], `${k}[${L}] 须与军令逐字一致`);
  }
  for (const k of ['nickname_self_placeholder', 'nickname_partner_placeholder', 'compliance_disclaimer_short', 'tos_prohibited_use_notice', 'tos_prohibited_use_title']) {
    const vals = LANGS.map((L) => DICT.resT(L, k));
    assert.ok(vals.every((v) => typeof v === 'string' && v.length > 0), `${k} 六语齐`);
    assert.equal(vals.includes(k), false, `${k} 不得回落键名`);
    assert.equal(THAI.test(vals[4]), true, `${k} th 须泰文`);
    for (const i of [1, 2, 3, 5]) assert.equal(CJK.test(vals[i]), false, `${k} 非 zh 列零 CJK：${vals[i]}`);
  }
  for (const L of ['en', 'fr', 'es', 'vi']) {
    assert.ok(/nickname|surnom|apodo|biệt danh/i.test(DICT.resT(L, 'nickname_self_placeholder')), `${L} 引导词须为昵称语义`);
    assert.ok(!/full name|real name|legal name|nom complet|nombre completo|họ và tên|Tên đầy đủ/i.test(DICT.resT(L, 'nickname_self_placeholder') + DICT.resT(L, 'nickname_partner_placeholder')), `${L} 严禁引导录入真实全名`);
  }
  // 前端：placeholder 取新键；旧「我 / TA」仍是坐标卡缺省称呼（不改传参与印刻）
  const ip = between(APP, 'function InputPage(', '/* ── Loading Page ── */');
  assert.ok(ip.includes('phKey="nickname_self_placeholder"'), '你的称呼 placeholder＝昵称引导');
  assert.ok(ip.includes('phKey="nickname_partner_placeholder"'), 'TA 的称呼 placeholder＝昵称引导');
  assert.equal(ip.includes('phKey="name_you_ph"') || ip.includes('phKey="name_ta_ph"'), false, '旧占位键不再作 placeholder');
  assert.ok(ip.includes('onSubmit(d1, d2, { t1, c1, t2, c2 }, { scene, nameA: name1, nameB: name2 });'), '称呼传参不变');
  const ni = between(APP, 'function E156NameInput(', 'function InputPage(');
  assert.ok(ni.includes('autoComplete="off"') && ni.includes('data-purpose="nickname"'), '不标记实名身份字段（autocomplete off＋nickname 用途）');
  assert.equal(/autocomplete="(name|given-name|family-name)"/i.test(ni), false, '严禁浏览器实名自动填充');
  assert.deepEqual(LANGS.map((L) => DICT.resT(L, 'name_you_ph')), ['我', 'Me', 'Moi', 'Yo', 'ฉัน', 'Tôi'], '坐标卡缺省称呼不变');
  assert.deepEqual(LANGS.map((L) => DICT.resT(L, 'name_ta_ph')), ['TA', 'Partner', 'Partenaire', 'Pareja', 'เขา', 'Người ấy'], '坐标卡缺省对方称呼不变');
  // 后端：称呼只经白名单清洗＋哈希入缓存键（不落明文、不标实名）
  const h = between(SERVER, "app.use('/api/ai-advisor', async (req, res) => {", '// ── Serve static frontend (dist/) ──');
  assert.ok(h.includes('const _e156A = sanitizeDisplayName(req.body && req.body.nameA);'), '称呼白名单清洗');
  assert.ok(h.includes('_e156NameH(_e156A, _e156B)'), '缓存键只存称呼哈希');
  assert.equal(/real_?name|full_?name|legal_?name|realName/i.test(h), false, '后端零实名身份字段');
});

/* ═══════ 五 · 刀三：三处显性声明 ＋ 条款禁限章 ═══════ */
test('E157-5 三处 compliance_disclaimer_short 常驻（输入页主按钮下 / 三场景报告尾坐标卡下 / 财富报告尾坐标卡下）；绝不隐藏；泰语 1.55/anywhere', () => {
  const NOTE = (id) => `<p className="ks-compliance-note" data-testid="${id}" lang={`;
  const ip = between(APP, 'function InputPage(', '/* ── Loading Page ── */');
  const ctaAt = ip.indexOf('<button className="btn btn-primary" data-testid="e156-cta"');
  const noteAt = ip.indexOf(NOTE('e157-disclaimer-input'));
  assert.ok(ctaAt !== -1 && noteAt > ctaAt, '输入页声明在主提交按钮之后');
  assert.ok(ip.indexOf('</button>', ctaAt) < noteAt && ip.indexOf('openLegal(\'terms\')') > noteAt, '输入页声明紧贴主按钮正下方（条款句之前）');
  assert.ok(ip.includes("{resT(lang, 'compliance_disclaimer_short')}</p>"), '输入页声明取字典单源');
  const rc = between(APP, '<HappinessCard payload={e156CardPayload}', '/* 🏆 E105-刀二');
  assert.ok(rc.includes(NOTE('e157-disclaimer-result')), '/result 声明在坐标卡块内');
  assert.ok(APP.indexOf('<HappinessCard payload={e156CardPayload}') < APP.indexOf(NOTE('e157-disclaimer-result')), '/result 声明在坐标卡之后');
  const wc = between(WEALTH, '<HappinessCard payload={e156WealthCard}', '<AdoptFamiliarCTA');
  assert.ok(wc.includes(NOTE('e157-disclaimer-wealth')), '财富报告声明在坐标卡块内');
  assert.ok(WEALTH.indexOf('<HappinessCard payload={e156WealthCard}') < WEALTH.indexOf(NOTE('e157-disclaimer-wealth')), '财富报告声明在坐标卡之后');
  assert.ok(WEALTH.includes("import { resT } from '../lib/resonanceI18n.mjs';"), '财富页引渡字典');
  assert.equal((APP.match(/data-testid="e157-disclaimer-/g) || []).length + (WEALTH.match(/data-testid="e157-disclaimer-/g) || []).length, 3, '恰三处');
  // 样式：12px / 浅香槟灰 / 宽松行高 / anywhere / 泰语 1.55 / 零隐藏花招
  const rule = APP_CSS.slice(APP_CSS.indexOf('.ks-compliance-note,'));
  for (const must of ['.ks-compliance-note', 'font-size: 12px', 'color: #D9CFB8', 'line-height: 1.6', 'overflow-wrap: anywhere', 'opacity: 1', 'visibility: visible', 'white-space: normal', ':lang(th)', 'line-height: 1.55']) {
    assert.ok(rule.includes(must), `样式缺：${must}`);
  }
  assert.equal(/\.ks-compliance-note[^{]*\{[^}]*display:\s*none/.test(rule), false, '声明不得被隐藏');
  // 声明与条款零 window.open（不另起窗口）；不挂独立对话窗
  assert.equal((APP.match(/window\.open\(/g) || []).length, 0, '零 window.open');
  // 条款禁限章：六语 Terms 末章逐字＝tos_prohibited_use_notice；独立路由页＋原位弹窗同源可查阅
  for (const L of LANGS) {
    const doc = LEGAL.getLegalTermsDoc('terms', L);
    assert.equal(doc.sections.length, 9, `terms[${L}] 须 9 节（E157 禁止用途章入列）`);
    const last = doc.sections[8];
    assert.equal(last.p, MANDATED_TOS(L), `terms[${L}] 禁限章正文逐字`);
    assert.equal(last.h, DICT.resT(L, 'tos_prohibited_use_title'), `terms[${L}] 禁限章标题`);
    assert.equal(LEGAL.getLegalTermsDoc('privacy', L).sections.length, 5, `privacy[${L}] 仍 5 节`);
  }
  assert.ok(POLICY.includes("from '../i18n/legalTerms.mjs'") && POLICY.includes('doc.sections.map('), 'PolicyPage 渲染全部章节（含禁限章）');
  assert.ok(MODAL.includes("from '../../i18n/legalTerms.mjs'") && MODAL.includes('doc.sections.map('), 'LegalTermsModal 渲染全部章节（含禁限章）');
  assert.ok(read('web/src/i18n/legalTerms.mjs').includes("p: resT(lang, 'tos_prohibited_use_notice')"), '条款字典单源');
  function MANDATED_TOS(L) {
    return {
      zh: '本平台报告及坐标卡严禁用于招聘筛选、解雇、绩效考核、信贷评估或正式尽职调查；内容仅供本人私密参考，若自行对外转发或公开分享，相关责任由用户自行承担。',
      en: 'Reports and Coordinate Cards must not be used for hiring, termination, performance evaluation, credit scoring, or due diligence. Content is for personal reference only; users assume full responsibility for any third-party sharing or disclosure.',
      fr: "Les rapports et Cartes de Coordonnées ne doivent pas être utilisés pour le recrutement, le licenciement, l'évaluation professionnelle, l'évaluation de crédit ou la diligence raisonnable. Contenu réservé à un usage personnel ; l'utilisateur assume l'entière responsabilité de tout partage avec des tiers.",
      es: 'Los informes y Tarjetas de Coordenadas no deben usarse para contratación, despido, evaluación laboral, evaluación crediticia ni debida diligencia. El contenido es solo para referencia personal; el usuario asume toda responsabilidad por compartirlo con terceros.',
      th: 'ห้ามนำรายงานและการ์ดพิกัดไปใช้ในการคัดเลือกพนักงาน เลิกจ้าง ประเมินผลงาน พิจารณาสินเชื่อ หรือการตรวจสอบสถานะทางธุรกิจ เนื้อหามีไว้เพื่อการอ้างอิงส่วนบุคคลเท่านั้น ผู้ใช้ต้องรับผิดชอบต่อการเผยแพร่หรือส่งต่อให้บุคคลที่สามด้วยตนเอง',
      vi: 'Nghiêm cấm sử dụng báo cáo và Thẻ Tọa Độ cho tuyển dụng, sa thải, đánh giá nhân sự, thẩm định tín dụng hoặc thẩm định pháp lý. Nội dung chỉ mang tính tham khảo cá nhân; người dùng tự chịu hoàn toàn trách nhiệm khi chia sẻ cho bên thứ ba.',
    }[L];
  }
});

/* ═══════ 六 · 零越界：付费流 / 定价 / E158 封存 ═══════ */
test('E157-6 零越界：$4.99 统一定价与手动点击生成不变；支付回跳自动生成封存未执行（E158 已用于全站视觉精修 ⇒ 封存顺延 E159）；零独立对话窗', async () => {
  const SB = await mod('web/src/lib/sandboxCheckout.mjs');
  assert.equal(SB.SANDBOX_PLAN_PRICE.compatibility_once, '$4.99', '沙盒一次解锁 $4.99 不变：' + JSON.stringify(SB.SANDBOX_PLAN_PRICE));
  // 🔴 后继化（E158-刀五）：月/年报命名三场景走字典；价格永驻
  assert.equal(DICT.resReportBtn('en', 'business', 'monthly'), 'Unlock Alliance Monthly $2.99/mo', '月报 $2.99 文案不变');
  assert.equal(DICT.resReportBtn('en', 'business', 'yearly'), 'Unlock Alliance Annual $29.99/yr', '年报 $29.99 文案不变');
  const ip = between(APP, 'function InputPage(', '/* ── Loading Page ── */');
  assert.equal((ip.match(/data-testid="e156-cta"/g) || []).length, 1, '单一主按钮（手动点击）');
  const h = between(SERVER, "app.use('/api/ai-advisor', async (req, res) => {", '// ── Serve static frontend (dist/) ──');
  assert.ok(SERVER.includes("success_url: successUrl || defaultSuccess,"), 'create-checkout 成功回跳复原（E159 未动）');
  // 🔴 后继化（E159 实施于「三场景隔离/黑屏/经纬度」军令 2026-11-27；「支付回跳零点击自动生成」顺延 E160 封存）
  for (const bad of ["'/resonance'", '/invite/', 'e160', 'E160']) {
    assert.equal(APP.includes(bad), false, `App.tsx 不得出现：${bad}`);
    assert.equal(SERVER.includes(bad), false, `server.js 不得出现：${bad}`);
  }
});

/* ═══════ 七 · 链位自保（下界＋收口位） ═══════ */
test('E157-7 【链位自保】闸门挂入 test:astro 且不顶飞收口位（插在 e155 之后、e40-compat 恒 len-2、python 恒链尾）', () => {
  const pkg = JSON.parse(read('package.json'));
  const segs = pkg.scripts['test:astro'].split(/\s*&&\s*|\s*\|\|\s*/).map((x) => x.trim()).filter(Boolean);
  const me = segs.findIndex((x) => x.includes('audit-e157-compliance-guardrails'));
  assert.ok(me !== -1, '未入编 test:astro');
  assert.ok(segs.length >= 125, `链段数下界（实为 ${segs.length}）`);   // 🔴 后继化（E158 入编）：123→124   // 🔴 后继化（E159 入编）：124→125
  const i155 = segs.findIndex((x) => x.includes('audit-e155-resonance-code'));
  const iCap = segs.findIndex((x) => x.includes('audit-e40-compat-synastry-tensor-fusion'));
  assert.equal(iCap, segs.length - 2, `收口位漂移：e40-compat 应为 len-2（实为 ${iCap}/${segs.length}）`);
  assert.ok(i155 !== -1 && i155 < me && me < iCap, 'E157 闸门须插在 e155 之后、收口位之前');
  assert.ok(segs[segs.length - 1].includes('python3'), 'python 恒链尾');
});
