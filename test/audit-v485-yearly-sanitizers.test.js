// ═══════════════════════════════════════════════════════════════════════
// 🛡️ V485: 第五章空间隐喻污染 + 年报外行星星座幻觉 —— 回归闸门
//
// 军师评审(88 分)四条 + 牛牛自查一条, 全部落到行为验证:
//   ① forceSpaceHouseSanitizer 跨行吞并正文(军师 P1①)
//      —— 旧正则 /卧室[^✦]{0,40}?第[N]宫[^\n]{0,20}?/ 的 [^✦] 在实际文本中等价于
//         「任意字符含换行」⇒「卧室…」跨行吃到下一段的「厨房区域:第二宫」, 中间正文整段被吞。
//         规范输入即 100% 必现, 且幂等(下游救不回)。
//   ② natal_sun_linter 家居段宫位无差别替换(牛牛自查, 军师未发现)
//      —— V108-fix7 把「家居财富对齐」~「办公室财富对齐」之间所有「第N宫」改写为本命太阳宫位,
//         线上实证「你的第四宫落在双鱼座」→「你的本命第11宫落在双鱼座」(1997-10-18 盘)。
//         产品固定隐喻(卧室=4宫/厨房=2+8宫/财务室=8宫)被整体摧毁。
//   ③ 年报外行星星座幻觉(军师 P2)
//      —— 线上出现「木星进入双子座第9宫」, 该盘全 12 月真值均为【狮子座第9宫】。
//         V482 的 lockYearlyTransitSigns 只按【月标题】切段 ⇒ 非月段区间越界句漏网。
//         新增 lockYearlyOuterPlanetsYear 做「年度恒定外行星」全文锁。
//   ④ 黑天鹅措辞同质化(军师 P1②): prompt 侧加「逐月专属风控角度」+ 禁套模板(此处只做接线断言)。
//
// 纪律: 闸门剥注释后再断言(防「注释里写了判据字面量」假红); 每条判据配注入自测(证明会红)。
// ═══════════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { closureDecls } from './tools/extract_decls.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf-8');
const truth = await import(new URL('../astro-truth.js', import.meta.url).href);

// 剥注释: 防「注释中引用了判据字面量」导致的假红(audit-v484 的同款教训)
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

// ── 装载器 ──────────────────────────────────────────────────────────────
function loadSpace(source = src) {
  const { source: code } = closureDecls(source, ['forceSpaceHouseSanitizer'], []);
  const ctx = { console, __exports: {} };
  vm.createContext(ctx);
  vm.runInContext(code + '\n__exports.f = forceSpaceHouseSanitizer;', ctx);
  return ctx.__exports.f;
}
function loadNatalSun(source = src) {
  const { source: code } = closureDecls(source, ['natal_sun_linter'], []);
  const ctx = {
    console, __exports: {},
    // getSignToHouseMap / SIGN_ORDER_ZH 由 server.js 从 astro-truth.js import, 必须手动注入,
    // 否则函数内 try/catch 会静默吞掉 ReferenceError ⇒ 探针假阴性(本次踩过)
    getSignToHouseMap: truth.getSignToHouseMap,
    SIGN_ORDER_ZH: truth.SIGN_ORDER_ZH,
  };
  vm.createContext(ctx);
  vm.runInContext(code + '\n__exports.f = natal_sun_linter;', ctx);
  return ctx.__exports.f;
}
function loadOuter(source = src) {
  const DEPS = ['lockYearlyOuterPlanetsYear', '_V485_OUTER_KEYS', '_V482_TVERB', '_V432_NAME',
    '_v444Signs', '_v432AllSignWords', '_v444Esc', 'SUN_SIGN_EN'];
  const { source: code } = closureDecls(source, DEPS, []);
  const ctx = { console, __exports: {} };
  vm.createContext(ctx);
  vm.runInContext(code + '\n__exports.f = lockYearlyOuterPlanetsYear;', ctx);
  return ctx.__exports.f;
}

// 假矩阵: 1997-10-18 特罗姆瑟盘真值(全 12 月恒定) —— 零外部依赖
const MK = () => ({
  months: Array.from({ length: 12 }, () => ({
    positions: {
      Jupiter: { sign: 'Leo', house: 9 }, Saturn: { sign: 'Aries', house: 5 },
      Uranus: { sign: 'Gemini', house: 7 }, Neptune: { sign: 'Aries', house: 5 },
      Pluto: { sign: 'Aquarius', house: 3 },
    },
  })),
});

// ══════════════════════════════════════════════════════════════════════════
// ① 结构: forceSpaceHouseSanitizer 不得再含跨行吞并形态
// ══════════════════════════════════════════════════════════════════════════
test('① forceSpaceHouseSanitizer 源码不得含跨行吞并正则 `[^✦]{0,40}?`', () => {
  const code = stripComments(closureDecls(src, ['forceSpaceHouseSanitizer'], []).source);
  assert.ok(code.includes('forceSpaceHouseSanitizer'), '切片失败');
  assert.ok(!/\[\^✦\]\{0,40\}/.test(code),
    '发现 `[^✦]{0,40}?` —— ✦ 在正文中几乎不出现, 等价于「任意字符含换行」, 会跨行吞掉下一段正文');
  assert.ok(/\(\?!区域\)/.test(code), '缺少「已规范形态跳过」的负向回顾 (?!区域)');
  // 源码文本里是字符串字面量 '[^\\n✦]{0,20}?' → 实际含「两个反斜杠」, 正则需写 \\\\
  assert.ok(/\[\^\\\\n✦\]\{0,20\}\?/.test(code), '缺少行内限定起手 `[^\\n✦]{0,20}?`');
});

// ══════════════════════════════════════════════════════════════════════════
// ② 行为: 规范输入零 diff / 跨行不吞并 / 误写仍归位 / 幂等
// ══════════════════════════════════════════════════════════════════════════
const CANON = [
  '* **卧室区域:第四宫(田宅宫)**',
  '你的卧室是你财富根基的象征。保持整洁。',   // ⚠️ 必须含「卧室」正文行 —— 旧正则正是从这里跨行吞到下一段厨房标签
  '* **厨房区域:第二宫(财帛宫)与第八宫(共享资源)**',
  '你的厨房是你财富滋养的象征。',
  '* **财务室区域:第八宫(共享资源)**',
  '你的财务室保持私密与安全。',
].join('\n');
const CROSS = '避免在卧室中放置任何与工作相关的物品，因为\n**厨房区域:第二宫(财帛宫)与第八宫(共享资源)**\n你的厨房是你财富滋养的象征。';

test('② 规范输入零 diff + 跨行不吞正文 + 幂等', () => {
  const f = loadSpace();
  assert.strictEqual(f(CANON), CANON, '规范文本被改动 → 仍在撕碎标签/吞正文');
  const oc = f(CROSS);
  assert.strictEqual(oc.split('\n').length, CROSS.split('\n').length, '跨行输入行数被改变(吞并)');
  assert.ok(oc.includes('你的厨房是你财富滋养的象征'), '厨房正文被吞');
  assert.ok(!/卧室区域[^\n]*\n[^\n]*卧室区域/.test(oc), '厨房标签被改写成卧室标签');
  assert.strictEqual(f(f(CANON)), f(CANON), '非幂等');
});

test('②b 误写形态仍能归位(保留原有能力, 不许为了不吞而废掉功能)', () => {
  const f = loadSpace();
  const cases = [
    ['**卧室在第四宫**', '卧室区域:第四宫(田宅宫)'],
    ['**财务室:第8宫**', '财务室区域:第八宫(共享资源)'],
    ['**卧室区域:第11宫(田宅宫)**', '卧室区域:第四宫(田宅宫)'],
  ];
  for (const [inp, want] of cases) assert.ok(f(inp).includes(want), `${inp} 未归位 → ${f(inp)}`);
});

test('②c 【对照】旧正则确实制造断层(证明缺陷真实, 且新函数不再制造)', () => {
  const _ZH = '一二三四五六七八九十百0-9';
  const oldFn = (t) => t
    .replace(new RegExp('卧室[^✦]{0,40}?第[' + _ZH + ']{1,3}宫[^\\n]{0,20}?', 'g'), '卧室区域:第四宫(田宅宫)')
    .replace(new RegExp('卧室[^\\n]{0,20}?(第[' + _ZH + ']{1,3}宫[^)]{0,12})[^\\n]{0,20}?', 'g'), '卧室区域:第四宫(田宅宫)')
    .replace(/卧室区域\s*[:：]?\s*[^\n，。；、*]{0,60}宫[^\n，。；、*]{0,60}/g, '卧室区域:第四宫(田宅宫)');
  const oldOut = oldFn(CANON);
  assert.notStrictEqual(oldOut, CANON, '旧正则未复现断层 → 判据失效');
  assert.ok(!oldOut.includes('是你财富根基的象征'), '旧正则未吞正文 → 判据失效');
  assert.strictEqual(loadSpace()(CANON), CANON, '新函数仍然改动规范输入');
});

// ══════════════════════════════════════════════════════════════════════════
// ③ 结构+行为: natal_sun_linter 不得再改写家居段宫位
// ══════════════════════════════════════════════════════════════════════════
test('③ natal_sun_linter 源码不得含「家居财富对齐」段的无差别宫位替换', () => {
  const code = stripComments(closureDecls(src, ['natal_sun_linter'], []).source);
  assert.ok(code.includes('natal_sun_linter'), '切片失败');
  assert.ok(!/indexOf\(\s*['"]家居财富对齐['"]\s*\)/.test(code),
    'V108-fix7 的「家居段宫位无差别替换」复活了 —— 会把卧室/厨房/财务室的固定隐喻全改成本命太阳宫位');
});

test('③b 行为: 家居段宫位保持不变, 本命太阳句仍被修正', () => {
  const f = loadNatalSun();
  const inp = [
    '### 家居财富对齐', '', '* **卧室区域:第四宫(田宅宫)**',
    '你的第四宫落在双鱼座。', '* **厨房区域:第二宫(财帛宫)与第八宫(共享资源)**',
    '你的第二宫落在摩羯座，第八宫落在巨蟹座。', '', '### 办公室财富对齐', '',
    '**工位区域**：你的第十宫落在处女座。', '', '你的本命太阳在第9宫，请牢记。',
  ].join('\n');
  const out = f(inp, '天秤座', '射手座');       // 本盘: 上升射手 → 本命太阳天秤 = 第11宫
  const home = out.slice(out.indexOf('家居财富对齐'), out.indexOf('办公室财富对齐'));
  assert.ok(!/第11宫/.test(home), `家居段被改写为第11宫(本命太阳宫位) → ${home}`);
  assert.ok(home.includes('你的第四宫落在双鱼座') && home.includes('你的第二宫落在摩羯座，第八宫落在巨蟹座'),
    '家居段真值宫位被破坏');
  assert.ok(out.includes('你的本命太阳在第11宫'), '本命太阳句的修正能力被误删');
});

// ══════════════════════════════════════════════════════════════════════════
// ④ 行为: 年度恒定外行星真值锁(军师 P2 木星笔误)
// ══════════════════════════════════════════════════════════════════════════
test('④ lockYearlyOuterPlanetsYear: 纠正越界外行星幻觉 + 豁免本命句 + 幂等 + 护栏', () => {
  const f = loadOuter();
  const c1 = '在2026-2027年，木星进入双子座第9宫，这会放大你的表演性消费倾向。';
  assert.ok(f(c1, 'zh', MK(), 'yearly').includes('木星进入狮子座第9宫'), '木星越界幻觉未被纠正');
  const c2 = '当流年木星进入第9宫双子座时，财富之门开启。';
  assert.ok(f(c2, 'zh', MK(), 'yearly').includes('第9宫狮子座'), '宫位在前形态未纠正');
  const c3 = '你的本命木星落在水瓶座第三宫，本命冥王星落在射手座第一宫。';
  assert.strictEqual(f(c3, 'zh', MK(), 'yearly'), c3, '本命句被误改');
  const c4 = '土星在白羊座第5宫施压，冥王星在水瓶座第3宫重塑思维。';
  assert.strictEqual(f(c4, 'zh', MK(), 'yearly'), c4, '真值正确的句子被改动(非幂等风险)');
  const once = f(c1, 'zh', MK(), 'yearly');
  assert.strictEqual(f(once, 'zh', MK(), 'yearly'), once, '非幂等');
  assert.strictEqual(f(c1, 'zh', MK(), 'monthly'), c1, '月报不该被本锁处理');
  assert.strictEqual(f(c1, 'es', MK(), 'yearly'), c1, '非 zh 不该被本锁处理');
  // 年内换座 → 弃权(不误改)
  const moving = { months: Array.from({ length: 12 }, (_, i) => ({ positions: { Jupiter: { sign: i < 6 ? 'Leo' : 'Virgo', house: 9 } } })) };
  assert.strictEqual(f('木星进入双子座第9宫', 'zh', moving, 'yearly'), '木星进入双子座第9宫', '年内换座时应弃权');
});

// ══════════════════════════════════════════════════════════════════════════
// ⑤ 接线 + 缓存版本(单调判据, 不许写死)
// ══════════════════════════════════════════════════════════════════════════
test('⑤ 接线: 新锁必须挂在收尾链全部**写链**落点(≥3 处)', () => {
  const n = (src.match(/lockYearlyOuterPlanetsYear\(/g) || []).length;
  assert.ok(n >= 4, `lockYearlyOuterPlanetsYear 调用点应 ≥4(1 定义 + 3 写链落点), 实得 ${n}`);
  assert.ok(/lockYearlyOuterPlanetsYear\(reportContent, lang, astroMatrix, reportType\)/.test(src), '非流式 MISS 未接线');
  assert.ok(/lockYearlyOuterPlanetsYear\(cleanedText, lang, astroMatrix, reportType\)/.test(src), '流式落库前未接线');
  // 🛡️ E18/R11k: 流式 HIT 已收拢（命中即终局）
  assert.ok(!/lockYearlyOuterPlanetsYear\(streamText/.test(src), 'HIT 侧不得再挂（E18/R11k 命中即终局）');
});

test('⑥ 缓存版本必须 ≥ V485 基线(单调判据, 防每次 bump 假红)', () => {
  const vers = [...src.matchAll(/wealth:v(\d+):/g)].map((m) => Number(m[1]));
  assert.ok(vers.length >= 3, `应有多处缓存 key, 实得 ${vers.length}`);
  const cur = Math.max(...vers);                 // ⚠️ 用 max: 文件里还散落着历史版本号(如注释/测试数据)
  assert.ok(cur >= 494, `当前缓存版本应 ≥494(输出链已变更), 实得 v${cur}`);
  assert.ok(vers.filter((v) => v === cur).length >= 3, `当前版本 v${cur} 应出现在 3 处缓存 key, 实得 ${vers.filter((v) => v === cur).length}`);
});

// ══════════════════════════════════════════════════════════════════════════
// ⑦ 行为: Prompt 字段泄漏清理(军师 P1② 修复后立即暴露的衍生事故)
//    —— V485 给黑天鹅注入「本月专属风控切入角度」后, LLM 把字段名连同取值写进正文(12/12 月)。
// ══════════════════════════════════════════════════════════════════════════
function loadLeak(source = src) {
  const { source: code } = closureDecls(source, ['stripYearlyPromptLeakage'], []);
  const ctx = { console, __exports: {} };
  vm.createContext(ctx);
  vm.runInContext(code + '\n__exports.f = stripYearlyPromptLeakage;', ctx);
  return ctx.__exports.f;
}

test('⑦ stripYearlyPromptLeakage: 清除内部字段句 + 前后句完整 + 幂等 + 护栏', () => {
  const f = loadLeak();
  const inp = '警告你：任何投机行为都将受到惩罚。本月专属风控切入角度：合同细则与隐性条款审查。如果你在本月签署合同，必须逐字审查。';
  const out = f(inp, 'zh', 'yearly');
  assert.ok(!/风控切入角度/.test(out), `泄漏未清除 → ${out}`);
  assert.ok(out.includes('任何投机行为都将受到惩罚') && out.includes('必须逐字审查'), '删除处伤害了正文');
  assert.strictEqual(f(out, 'zh', 'yearly'), out, '非幂等');
  assert.strictEqual(f(inp, 'zh', 'monthly'), inp, '月报不该被处理');
  assert.strictEqual(f(inp, 'es', 'yearly'), inp, '非 zh 不该被处理');
  // 无泄漏文本零 diff
  const clean = '这是一个正常的句子。它没有任何内部字段。';
  assert.strictEqual(f(clean, 'zh', 'yearly'), clean, '无泄漏文本被改动');

  // ② 字段名形态(其后紧跟实质内容): 只删字段名, **内容必须保留**(V485b 线上二次实测形态)
  const item = '* 💡 **本月风控主线**: 现金流周转与应急储备。第8宫的能量让你容易乱花钱。';
  const itemOut = f(item, 'zh', 'yearly');
  assert.ok(!/风控主线/.test(itemOut), `字段名未清除 → ${itemOut}`);
  assert.ok(itemOut.includes('现金流周转与应急储备') && itemOut.includes('第8宫的能量让你容易乱花钱'),
    `字段名清理误删了内容 → ${itemOut}`);
  // ③ 泛化: prompt 换词(视角/重点)也必须兜住
  for (const w of ['本月风险视角', '风控视角', '本月风险重点', '风险切入点']) {
    assert.ok(!new RegExp(w).test(f(`${w}：测试内容。后续句。`, 'zh', 'yearly')), `字段名变体「${w}」漏清`);
  }
  // ④ 不得误伤正常句子
  const normal = '本月风险主要集中在合伙资金的使用上，需要格外谨慎。';
  assert.strictEqual(f(normal, 'zh', 'yearly'), normal, '误伤了不含字段名的正常句子');
});

test('⑦b 接线: 泄漏清理必须在收尾链全部**写链**落点(≥3 处调用)', () => {
  const n = (src.match(/stripYearlyPromptLeakage\(/g) || []).length;
  assert.ok(n >= 4, `stripYearlyPromptLeakage 调用点应 ≥4(1 定义 + 3 写链落点), 实得 ${n}`);
  assert.ok(/stripYearlyPromptLeakage\(reportContent, lang, reportType\)/.test(src), '非流式 MISS 未接线');
  assert.ok(/stripYearlyPromptLeakage\(cleanedText, lang, reportType\)/.test(src), '流式落库前未接线');
  // 🛡️ E18/R11k: 流式 HIT 已收拢（命中即终局）
  assert.ok(!/stripYearlyPromptLeakage\(streamText/.test(src), 'HIT 侧不得再挂（E18/R11k 命中即终局）');
});

test('⑦c Prompt 必须显式禁止内部字段入正文', () => {
  assert.ok(/严禁在正文写出本行、字段名或「风控切入角度」等措辞/.test(src) ||
    /严禁把这些字样或字段名原样写进正文/.test(src),
    'Prompt 缺少「内部字段严禁入正文」约束 → LLM 会继续把字段名写进正文');
});

// ══════════════════════════════════════════════════════════════════════════
// ⑧ 注入缺陷自测 —— 每条都必须「注入后判据变红」, 否则闸门无效
// ══════════════════════════════════════════════════════════════════════════
test('【注入】摘掉泄漏清理 → ⑦ 必须红', () => {
  // 让函数第一行直接 return(等同禁用清理)
  const degraded = src.replace(
    /function stripYearlyPromptLeakage\(text, lang, reportType\) \{/,
    'function stripYearlyPromptLeakage(text, lang, reportType) { return text;');
  assert.notStrictEqual(degraded, src, '注入必须真的改变源码');
  const f = loadLeak(degraded);
  const inp = '本月专属风控切入角度：隐性债务。后续正文。';
  assert.ok(/风控切入角度/.test(f(inp, 'zh', 'yearly')), '注入后应保留泄漏(判据⑦ 才能抓住)');
});
test('【注入】把跨行吞并正则还给 forceSpaceHouseSanitizer → ② 必须红', () => {
  // 把行内限定 + 负向回顾换回旧的跨行形态 `[^✦]{0,40}?`
  const degraded = src.replace(/\(\?!区域\)\[\^\\\\n✦\]\{0,20\}\?/, '[^✦]{0,40}?');
  assert.notStrictEqual(degraded, src, '注入必须真的改变源码');
  const f = loadSpace(degraded);
  const out = f(CANON);
  assert.notStrictEqual(out, CANON, '注入旧形态后应当吞掉正文(判据② 才能抓住它)');
  assert.ok(!out.includes('是你财富根基的象征'), '注入旧形态后跨行吞并未复现');
});

test('【注入】还原 V108-fix7 家居段替换 → ③ 结构判据必须红', () => {
  const degraded = src.replace(
    '      // ⛔ V485 拆除 V108-fix7',
    "      const _homeStart = text.indexOf('家居财富对齐');\n      // ⛔ V485 拆除 V108-fix7");
  assert.notStrictEqual(degraded, src, '注入必须真的改变源码');
  const code = stripComments(closureDecls(degraded, ['natal_sun_linter'], []).source);
  assert.ok(/indexOf\(\s*['"]家居财富对齐['"]\s*\)/.test(code), '注入后结构判据应命中');
});

test('【注入】家居段替换完整还原 → ③b 行为判据必须红', () => {
  const degraded = src.replace(
    '      // ⛔ V485 拆除 V108-fix7',
    "      const _hs = text.indexOf('家居财富对齐'); const _os = text.indexOf('办公室财富对齐');\n" +
    "      if (_hs >= 0) { const _he = _os >= 0 ? _os : text.length;\n" +
    "        text = text.substring(0, _hs) + text.substring(_hs, _he).replace(/第([一二三四五六七八九十百零\\d]+)宫/g, '第' + _ch + '宫') + text.substring(_he); }\n" +
    '      // ⛔ V485 拆除 V108-fix7');
  assert.notStrictEqual(degraded, src, '注入必须真的改变源码');
  const f = loadNatalSun(degraded);
  const inp = '### 家居财富对齐\n* **卧室区域:第四宫(田宅宫)**\n你的第四宫落在双鱼座。\n### 办公室财富对齐\n工位。';
  const out = f(inp, '天秤座', '射手座');
  const home = out.slice(out.indexOf('家居财富对齐'), out.indexOf('办公室财富对齐'));
  assert.ok(/第11宫/.test(home), '注入后家居段应被改写为第11宫');
});

test('【注入】摘掉非流式接线 → ⑤ 接线判据必须红', () => {
  const degraded = src.replace(
    /^\s*reportContent = lockYearlyOuterPlanetsYear\(reportContent, lang, astroMatrix, reportType\);.*$/m, '');
  assert.notStrictEqual(degraded, src, '注入必须真的改变源码');
  assert.ok(!/lockYearlyOuterPlanetsYear\(reportContent, lang, astroMatrix, reportType\)/.test(degraded),
    '注入后判据应命中失败');
});

test('【注入】缓存版本降级一档 → ⑥ 必须红', () => {
  // ⚠️ 动态取当前版本再降级(写死版本号会随每次 bump 失效 —— 本次踩过)
  const cur = Math.max(...[...src.matchAll(/wealth:v(\d+):/g)].map((m) => Number(m[1])));
  const degraded = src.replace(new RegExp(`wealth:v${cur}:`, 'g'), `wealth:v${cur - 1}:`);
  assert.notStrictEqual(degraded, src, '注入必须真的改变源码');
  const vers = [...degraded.matchAll(/wealth:v(\d+):/g)].map((m) => Number(m[1]));
  // ⚠️ 判据必须与 cur 比较, 不得写死历史版本号(此处在 V486 bump 到 495 时正是它先假红)
  assert.ok(Math.max(...vers) < cur, `注入后版本应低于当前版本 v${cur}(实得 v${Math.max(...vers)})`);
});

test('【注入】给外行星锁摘掉本命豁免 → ④ 必须红', () => {
  // 🛡️ E25-P1①: 注入锚点随实现前移 —— 豁免行已从「zh 四词硬编码」升级为
  //   「es 用 cfg.natalAny + zh 窗口保持 12 字」的双分支形态（原锚点字符串已不存在,
  //   会导致注入静默失败 = 零防线）。
  const degraded = src.replace(
    "if (lang === 'es' ? _natalRe.test(_pre + ' ' + full) : _natalRe.test(_pre)) return full;",
    '');
  assert.notStrictEqual(degraded, src, '注入必须真的改变源码');
  const f = loadOuter(degraded);
  const c3 = '你的本命木星在水瓶座第三宫。';
  assert.notStrictEqual(f(c3, 'zh', MK(), 'yearly'), c3, '注入后本命句应被误改');
});
