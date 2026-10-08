/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🛡️ E32 闸门：财富「三位一体」批扫矩阵 + 绿道特权门控
 * ═══════════════════════════════════════════════════════════════════════════
 * 立项（2026-10-08 军师 E32 开工令 · 主公裁「后端先行」）：
 *   ① **绿道收入洞**：`free_access=1`（及测试生日）走请求体且无环境门控 ⇒ 生产环境任何人
 *      POST 该字段即可免费领 $4.99 先天报告（与 E30/E31 同类的 fail-open，漏的是钱）。
 *   ② **三报告矩阵缺位**：sweep 注册表历来只声明 `yearly` ⇒ $4.99 once 与月报从未进入批扫。
 *
 * 四路取证：
 *   A. **行为级**：从 server.js 抽取真实门控函数跑矩阵（实现与断言同源，非字面量 grep）
 *   B. **契约级**：注册表三报告声明 ↔ 后端 `WEALTH_PAID_REPORT_TYPES` 同源 + 批扫器 `--trio`
 *   C. **行为级**：抽取 `buildWealthOncePrompt` 真身，14 盘 × 6 语实跑 ⇒ 三轴骨架 /
 *      太阳星座真值（唯一真源 `getNatalSunSign`）/ 本命 10 主星锚点 / 无哨兵泄漏
 *   D. **结构级**：两处权益解析皆走特权门控 · once 双通道分流 · 前端令牌转发
 *   E. **注入自测**：回退特权门控 / 删三报告声明 / 破坏本命锚点 ⇒ 对应判据必红
 *
 * 运行：node --test test/audit-e32-wealth-trio-matrix.test.mjs
 * ═══════════════════════════════════════════════════════════════════════════
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { timingSafeEqual } from 'node:crypto';

const ROOT = path.resolve(import.meta.dirname, '..');
const SERVER_SRC = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
const PAGE_SRC = fs.readFileSync(path.join(ROOT, 'web/src/pages/WealthReportPage.tsx'), 'utf8');
const SWEEP_TOOL_SRC = fs.readFileSync(path.join(ROOT, 'test/tools/sweep-online.mjs'), 'utf8');

const LANGS = ['zh', 'en', 'es', 'fr', 'th', 'vi'];

// ── 花括号配平抽取（与 e24g 同款，防注释/字符串误配） ──
function sliceBalanced(src, startIdx) {
  const start = src.indexOf('{', startIdx);
  if (start === -1) return null;
  let depth = 0, inStr = null;
  for (let i = start; i < src.length; i++) {
    const ch = src[i];
    if (inStr) { if (ch === '\\') { i++; continue; } if (ch === inStr) inStr = null; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; continue; }
    if (ch === '{') depth++; else if (ch === '}') { depth--; if (!depth) return src.slice(start, i + 1); }
  }
  return null;
}
function grabFn(src, sig) {
  const i = src.indexOf(sig);
  assert.ok(i !== -1, `server.js 缺少「${sig}」—— 单一真源被删/改名，闸门无法取证`);
  const body = sliceBalanced(src, i);
  assert.ok(body && body.length > 10, `抽不出「${sig}」函数体`);
  return sig + ' ' + body;
}

// ═══════════════════════════════════════════════════════════
// A. 绿道特权门控（行为级 · 抽取真实函数）
// ═══════════════════════════════════════════════════════════
function buildGreenGate(src) {
  let code = '';
  const mConst = src.match(/const WEALTH_TEST_BIRTHDATE = '[^']*';/);
  if (mConst) code += mConst[0] + '\n';
  code += grabFn(src, 'function _e30AdminExpectedKey()') + '\n';
  code += grabFn(src, 'function _e30ExtractToken(req)') + '\n';
  code += grabFn(src, 'function _e30SafeEqual(a, b)') + '\n';
  code += grabFn(src, 'function wealthIsGreenChannel(body)') + '\n';
  code += grabFn(src, 'function wealthGreenChannelAuthorized(req, body)') + '\n';
  const names = ['_e30AdminExpectedKey', '_e30ExtractToken', '_e30SafeEqual',
    'wealthIsGreenChannel', 'wealthGreenChannelAuthorized'];
  return new Function('process', 'timingSafeEqual', 'Buffer',
    `${code}\nreturn { ${names.join(', ')} };`)(process, timingSafeEqual, Buffer);
}
function withEnv(env, fn) {
  const saved = {};
  for (const k of Object.keys(env)) {
    saved[k] = process.env[k];
    if (env[k] === undefined) delete process.env[k]; else process.env[k] = env[k];
  }
  try { return fn(); } finally {
    for (const k of Object.keys(env)) {
      if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k];
    }
  }
}
const REQ = (h) => ({ headers: h || {} });

test('A1 未配置管理员密钥 ⇒ 绿道一律失效（fail-closed，绝不回退放行）', () => {
  withEnv({ DEBUG_ADMIN_KEY: undefined, ADMIN_TOKEN: undefined }, () => {
    const F = buildGreenGate(SERVER_SRC);
    assert.equal(F.wealthGreenChannelAuthorized(REQ({}), { free_access: 1 }), false,
      '未配密钥时 free_access 不得放行 ⇒ 否则生产可白拿 $4.99');
    assert.equal(F.wealthGreenChannelAuthorized(REQ({}), { birthDate: '1990-06-15' }), false,
      '未配密钥时测试生日同样不得放行（宽判口径已废弃）');
    assert.equal(F.wealthGreenChannelAuthorized(REQ({ 'x-admin-token': 'anything' }), { free_access: 1 }), false);
    // 纯检测函数语义不得改动（e24g A4 依赖其白名单形态）
    assert.equal(F.wealthIsGreenChannel({ free_access: 1 }), true);
    assert.equal(F.wealthIsGreenChannel({ birthDate: '1990-06-15' }), true);
  });
});

test('A2 配密钥 + 正确令牌（x-admin-token / Bearer）⇒ 绿道放行（测试链路可用）', () => {
  withEnv({ DEBUG_ADMIN_KEY: 'E32-ADMIN-KEY-xyz', ADMIN_TOKEN: undefined }, () => {
    const F = buildGreenGate(SERVER_SRC);
    assert.equal(F.wealthGreenChannelAuthorized(REQ({ 'x-admin-token': 'E32-ADMIN-KEY-xyz' }), { free_access: 1 }), true);
    assert.equal(F.wealthGreenChannelAuthorized(REQ({ authorization: 'Bearer E32-ADMIN-KEY-xyz' }), { free_access: 1 }), true);
    assert.equal(F.wealthGreenChannelAuthorized(REQ({ 'x-admin-token': 'E32-ADMIN-KEY-xyz' }), { birthDate: '1990-06-15' }), true);
  });
});

test('A3 配密钥但令牌缺失/错误/长度不等/非绿道 ⇒ 一律拒绝（且不抛）', () => {
  withEnv({ DEBUG_ADMIN_KEY: 'E32-ADMIN-KEY-xyz', ADMIN_TOKEN: undefined }, () => {
    const F = buildGreenGate(SERVER_SRC);
    assert.equal(F.wealthGreenChannelAuthorized(REQ({}), { free_access: 1 }), false, '缺令牌必须拒');
    assert.equal(F.wealthGreenChannelAuthorized(REQ({ 'x-admin-token': 'wrong' }), { free_access: 1 }), false, '错令牌必须拒');
    assert.equal(F.wealthGreenChannelAuthorized(REQ({ 'x-admin-token': 'E32' }), { free_access: 1 }), false,
      '长度不等必须安全拒绝（timingSafeEqual 长度守卫，不得抛异常）');
    assert.equal(F.wealthGreenChannelAuthorized(REQ({ 'x-admin-token': 'E32-ADMIN-KEY-xyz' }), { some: 1 }), false,
      '非绿道请求即使带正确令牌也不得放行');
  });
});

// ═══════════════════════════════════════════════════════════
// B. 三报告批扫契约
// ═══════════════════════════════════════════════════════════
test('B1 注册表三报告声明 ↔ 后端付费产物集 同源', async () => {
  const { SWEEP_REPORT_TYPES, SWEEP_MATRIX } = await import(
    pathToFileURL(path.join(ROOT, 'test/tools/sweep-matrix.mjs')).href);
  assert.deepEqual([...SWEEP_REPORT_TYPES].sort(), ['monthly', 'once', 'yearly'],
    '三报告契约须恰为 yearly/monthly/once');

  const mSet = SERVER_SRC.match(/const WEALTH_PAID_REPORT_TYPES = new Set\(\[([^\]]*)\]\)/);
  assert.ok(mSet, 'server.js 缺 WEALTH_PAID_REPORT_TYPES（付费产物射程单一真源）');
  const backTypes = mSet[1].split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
  assert.deepEqual([...backTypes].sort(), [...SWEEP_REPORT_TYPES].sort(),
    `批扫三报告须与后端付费产物集同源：后端=${backTypes.join('/')} 注册表=${SWEEP_REPORT_TYPES.join('/')}`);

  assert.equal(SWEEP_MATRIX.length, 14, '盘池须为 14 盘');
});

test('B2 批扫器支持 --trio，且作业展开 = 盘 × 3 产物', () => {
  assert.ok(SWEEP_TOOL_SRC.includes("argv[i] === '--trio'"), 'sweep-online.mjs 缺 --trio 开关');
  assert.ok(/SWEEP_REPORT_TYPES\.map\(\(t\) => \(\{ \.\.\.d, reportType: t \}\)\)/.test(SWEEP_TOOL_SRC),
    'sweep-online.mjs 未按 SWEEP_REPORT_TYPES 展开作业（copy 盘并覆盖 reportType）');
  assert.ok(/const JOBS = trio \?/.test(SWEEP_TOOL_SRC), 'sweep-online.mjs 缺 JOBS 作业列表');
  assert.ok(/for \(const d of JOBS\)/.test(SWEEP_TOOL_SRC), '主循环须遍历 JOBS（而非 DISKS）');
  // 判据非空转：作业副本不得就地改写注册表对象
  assert.ok(!/SWEEP_MATRIX\.forEach\([^)]*reportType = /.test(SWEEP_TOOL_SRC),
    '禁止就地改写 SWEEP_MATRIX 的 reportType（会污染注册表真源）');
});

// ═══════════════════════════════════════════════════════════
// C. once 报告 prompt 行为级（14 盘 × 6 语）
// ═══════════════════════════════════════════════════════════
async function buildOnceBuilder(src) {
  let code = '';
  code += grabFn(src, 'function getNatalSunSign(birthDate)') + '\n';
  for (const l of ['EN', 'VI', 'TH', 'ZH', 'ES', 'FR']) {
    const m = src.match(new RegExp(`const SUN_SIGN_${l} = \\[[^\\]]*\\];`));
    assert.ok(m, `server.js 缺 SUN_SIGN_${l}（太阳星座本地化表）`);
    code += m[0] + '\n';
  }
  code += grabFn(src, 'function buildWealthOncePrompt(birthDate, lang, astroMatrix)');
  const { buildNatalAnchors } = await import(pathToFileURL(path.join(ROOT, 'v69_client.js')).href);
  return new Function('buildNatalAnchors', `${code}\nreturn { buildWealthOncePrompt, getNatalSunSign };`)(buildNatalAnchors);
}

// 注册表真值 → buildNatalAnchors 入参形态（零引擎成本；真值由 astro-matrix 闸门逐盘现场实算校验）
function matrixFromTruth(d) {
  const houses = {};
  for (const [p, v] of Object.entries(d.truth.houses || {})) houses[p] = { sign: v.sign, house: v.house };
  return {
    meta: {
      rising_sign: d.truth.rising_sign,
      sun_sign: d.truth.sun_sign,
      computed_houses: houses,
      natal_moon: houses.Moon || {},
      ascendant: { sign: d.truth.rising_sign, degree: d.truth.ascendant_deg },
      midheaven: null,
    },
  };
}

const AXIS_MARK = {
  zh: '三轴聚焦', en: 'Three-Axis Focus', es: 'Enfoque de Tres Ejes',
  fr: 'Focus sur Trois Axes', th: 'โฟกัสสามแกน', vi: 'Tập Trung Ba Trục',
};
const SUN_ARRAY = {
  zh: ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'],
  en: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'],
  es: ['Aries', 'Tauro', 'Géminis', 'Cáncer', 'Leo', 'Virgo', 'Libra', 'Escorpio', 'Sagitario', 'Capricornio', 'Acuario', 'Piscis'],
  fr: ['Bélier', 'Taureau', 'Gémeaux', 'Cancer', 'Lion', 'Vierge', 'Balance', 'Scorpion', 'Sagittaire', 'Capricorne', 'Verseau', 'Poissons'],
  th: ['เมษ', 'พฤษภ', 'มิถุน', 'กรกฎ', 'สิงห์', 'กันยา', 'ตุลย์', 'พิจิก', 'ธนู', 'มังกร', 'กุมภ์', 'มีน'],
  vi: ['Bạch Dương', 'Kim Ngưu', 'Song Tử', 'Cự Giải', 'Sư Tử', 'Xử Nữ', 'Thiên Bình', 'Bọ Cạp', 'Nhân Mã', 'Ma Kết', 'Bảo Bình', 'Song Ngư'],
};
const TEN_PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];

test('C1 once prompt：14 盘 × 6 语 —— 三轴骨架 + 太阳真值 + 本命 10 主星 + 无哨兵泄漏', async () => {
  const { SWEEP_MATRIX } = await import(pathToFileURL(path.join(ROOT, 'test/tools/sweep-matrix.mjs')).href);
  const B = await buildOnceBuilder(SERVER_SRC);
  assert.equal(SWEEP_MATRIX.length, 14);

  for (const d of SWEEP_MATRIX) {
    const mx = matrixFromTruth(d);
    for (const lang of LANGS) {
      const out = B.buildWealthOncePrompt(d.birth, lang, mx);
      assert.ok(out && typeof out.system === 'string' && typeof out.user === 'string',
        `${d.id}/${lang}: once prompt 未产出 system+user`);
      const both = out.system + '\n' + out.user;

      // ① 三轴骨架（各语原生标签）
      assert.ok(both.includes(AXIS_MARK[lang]), `${d.id}/${lang}: 缺三轴骨架标记「${AXIS_MARK[lang]}」`);

      // ② 太阳星座唯一真源 getNatalSunSign（禁手写日期表 ⇒ 与月报/年报同源）
      const idx = B.getNatalSunSign(d.birth);
      assert.equal(SUN_ARRAY[lang][idx], SUN_ARRAY[lang][B.getNatalSunSign(d.birth)],
        `${d.id}/${lang}: getNatalSunSign 越界`);
      assert.ok(out.user.includes(SUN_ARRAY[lang][idx]),
        `${d.id}/${lang}: user 段未含本地化太阳星座「${SUN_ARRAY[lang][idx]}」`);

      // ③ 本命真值块（buildNatalAnchors）在位 + 10 主星全覆盖且无 '?' 兜底
      assert.ok(both.includes('SYSTEM TRUTH LOCK'), `${d.id}/${lang}: 本命真值块缺失（E29 覆盖规则未注入）`);
      for (const p of TEN_PLANETS) {
        const key = `"natal${p}"`;
        assert.ok(both.includes(key), `${d.id}/${lang}: 本命真值缺 ${p}（E29 十主星全覆盖铁律）`);
        assert.ok(!new RegExp(`${key}\\s*:\\s*\\{[^}]*"sign"\\s*:\\s*"\\?"`).test(both),
          `${d.id}/${lang}: ${p} 星座真值缺失（'?' 兜底 ⇒ 真值未到位）`);
      }

      // ④ 哨兵泄漏（undefined / NaN / null 字面）
      assert.ok(!/\bundefined\b/.test(both), `${d.id}/${lang}: 产物含 undefined 哨兵`);
      assert.ok(!/\bNaN\b/.test(both), `${d.id}/${lang}: 产物含 NaN 哨兵`);
      assert.ok(!out.user.includes('null'), `${d.id}/${lang}: user 段含 null 哨兵`);

      // ⑤ 生日回填
      assert.ok(out.user.includes(d.birth), `${d.id}/${lang}: user 段未回填生日`);
    }
  }
});

test('C2 once prompt 缺 astroMatrix ⇒ 显式降级（不抛、不伪造 Cancer，太阳真值仍由生日算）', async () => {
  const B = await buildOnceBuilder(SERVER_SRC);
  const out = B.buildWealthOncePrompt('1997-10-18', 'en', null);
  assert.ok(out && out.user.includes('1997-10-18'), 'null 矩阵时仍须产出（不抛）');
  assert.ok(!/undefined/.test(out.system + out.user), 'null 矩阵不得引入 undefined 哨兵');
  assert.ok(!/Cancer Rising/.test(out.system + out.user), '禁止伪造 Cancer Rising（V492/D2 铁律）');
  assert.equal(B.buildWealthOncePrompt('', 'en', null), null, '空生日必须返回 null（调用方契约）');
});

// ═══════════════════════════════════════════════════════════
// D. 结构级接线
// ═══════════════════════════════════════════════════════════
test('D1 两处权益解析皆走特权门控；裸财富绿道判定残留 = 0', () => {
  const wired = (SERVER_SRC.match(/wealthGreenChannelAuthorized\(req, body\)/g) || []).length;
  assert.equal(wired, 3, `特权门控须「1 处定义 + 2 处调用」，实得 ${wired}`);
  assert.equal((SERVER_SRC.match(/if \(wealthIsGreenChannel\(body\)\) return/g) || []).length, 0,
    '存在绕过特权门控的裸 wealthIsGreenChannel 放行点（收入洞回归）');
  assert.ok(SERVER_SRC.includes('function wealthGreenChannelAuthorized(req, body)'), '特权门控定义缺失');
  // 常量时间比对（防时序侧信道）
  assert.ok(/_e30SafeEqual\(_e30ExtractToken\(req\), expected\)/.test(SERVER_SRC),
    '特权门控必须复用 E30 常量时间比对');
});

test('D2 前端：4 处绿道标记保留 + 令牌转发助手接入（源码零令牌）', () => {
  const markers = (PAGE_SRC.match(/free_access: isGreenChannelRef\.current \? 1 : 0/g) || []).length;
  assert.equal(markers, 4, `前端绿道标记须恰 4 处（e24g B4a 契约），实得 ${markers}`);
  assert.ok(/_ksGreenAuthHeader = \(\)/.test(PAGE_SRC), '前端缺绿道令牌转发助手');
  const useCount = (PAGE_SRC.match(/\.\.\._ksGreenAuthHeader\(\)/g) || []).length;
  assert.equal(useCount, 4, `令牌转发须接入 4 处请求头，实得 ${useCount}`);
  assert.ok(PAGE_SRC.includes("localStorage.getItem('KS_DEBUG_ADMIN_TOKEN')"),
    '令牌只能由测试者显式注入（localStorage），不得硬编码');
  assert.ok(!/['"]x-admin-token['"]\s*:\s*['"][A-Za-z0-9_-]{8,}['"]/.test(PAGE_SRC),
    '前端源码内不得出现硬编码管理员令牌');
});

test('D3 once 双通道皆走 buildWealthOncePrompt（禁落入五章骨架构造器）', () => {
  const calls = (SERVER_SRC.match(/buildWealthOncePrompt\(/g) || []).length;
  assert.ok(calls >= 3, `once 构造器须「1 定义 + ≥2 调用（流式/非流式）」，实得 ${calls}`);
  // 分流判据：两处必须按 reportType === 'once' 分流
  const branch = (SERVER_SRC.match(/reportType === 'once'/g) || []).length;
  assert.ok(branch >= 2, `once 分流分支须 ≥2 处（双通道），实得 ${branch}`);
});

// ═══════════════════════════════════════════════════════════
// E. 注入自测（定向破坏 ⇒ 判据必红）
// ═══════════════════════════════════════════════════════════
test('E1 注入：特权门控回退为「只看请求体」⇒ A 组必红（收入洞回归）', () => {
  const broken = SERVER_SRC.replace(
    /function wealthGreenChannelAuthorized\(req, body\) \{[\s\S]*?\n\}/,
    'function wealthGreenChannelAuthorized(req, body) {\n  return wealthIsGreenChannel(body);\n}');
  assert.notEqual(broken, SERVER_SRC, '注入未生效（门控签名被改？）');
  const F = buildGreenGate(broken);
  withEnv({ DEBUG_ADMIN_KEY: undefined, ADMIN_TOKEN: undefined }, () => {
    // fail-open 回归：未配密钥也会放行 ⇒ A1 判据必红
    assert.equal(F.wealthGreenChannelAuthorized(REQ({}), { free_access: 1 }), true,
      '注入后应确实 fail-open（证明判据有牙）');
    assert.throws(() => {
      assert.equal(F.wealthGreenChannelAuthorized(REQ({}), { free_access: 1 }), false, '未配密钥不得放行');
    }, /未配密钥不得放行/);
  });
});

test('E2 注入：清空后端付费产物集 ⇒ B1 必红（三报告同源契约失效）', () => {
  const broken = SERVER_SRC.replace(
    /const WEALTH_PAID_REPORT_TYPES = new Set\(\[[^\]]*\]\);/,
    'const WEALTH_PAID_REPORT_TYPES = new Set([]);');
  assert.notEqual(broken, SERVER_SRC, '注入未生效（付费产物集被改？）');
  const mSet = broken.match(/const WEALTH_PAID_REPORT_TYPES = new Set\(\[([^\]]*)\]\)/);
  assert.ok(mSet, '注入后正则仍须可命中（用于证明判据有效）');
  const backTypes = mSet[1].split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
  assert.notDeepEqual([...backTypes].sort(), ['monthly', 'once', 'yearly'],
    '清空后端付费产物集后仍与注册表同源 ⇒ B1 判据空转');
});

test('E3 注入：破坏本命锚点（不注入 buildNatalAnchors）⇒ C1 必红', async () => {
  const broken = SERVER_SRC.replace(
    /const natalAnchors = astroMatrix \? buildNatalAnchors\(astroMatrix\) : '';/,
    "const natalAnchors = '';");
  assert.notEqual(broken, SERVER_SRC, '注入未生效（锚点行被改？）');
  const B = await buildOnceBuilder(broken);
  const d = (await import(pathToFileURL(path.join(ROOT, 'test/tools/sweep-matrix.mjs')).href)).SWEEP_MATRIX[0];
  const out = B.buildWealthOncePrompt(d.birth, 'en', matrixFromTruth(d));
  const both = out.system + '\n' + out.user;
  assert.ok(!both.includes('SYSTEM TRUTH LOCK'),
    '摘掉锚点后真值块仍在 ⇒ C1 判据空转（未真正接线）');
});

test('E4 注入：批扫器去掉 --trio 作业展开 ⇒ B2 必红', () => {
  const broken = SWEEP_TOOL_SRC.replace(
    /const JOBS = trio \? DISKS\.flatMap\(\(d\) => SWEEP_REPORT_TYPES\.map\(\(t\) => \(\{ \.\.\.d, reportType: t \}\)\)\) : DISKS;/,
    'const JOBS = DISKS;');
  assert.notEqual(broken, SWEEP_TOOL_SRC, '注入未生效（JOBS 行被改？）');
  assert.ok(!/SWEEP_REPORT_TYPES\.map\(\(t\) => \(\{ \.\.\.d, reportType: t \}\)\)/.test(broken),
    '作业展开未被摘除 ⇒ B2 判据空转');
});

// ═══════════════════════════════════════════════════════════
// F. E32-C：① TH 模板净化 + ④ 月报「日期穿越」确定性病根
// ═══════════════════════════════════════════════════════════
const TH_SRC = fs.readFileSync(path.join(ROOT, 'src/prompts/yearlySystemTH.txt'), 'utf8');
const LOADER_SRC = fs.readFileSync(path.join(ROOT, 'src/prompts/loader.js'), 'utf8');

test('F1 ① TH 模板净化：零年份字面量 + 唯一事实表锚点；loader 原生映射 + 锚点守卫语言无关', () => {
  assert.equal((TH_SRC.match(/\b20\d\d\b/g) || []).length, 0,
    `yearlySystemTH.txt 仍含年份字面量: ${(TH_SRC.match(/\b20\d\d\b/g) || []).join(',')}`);
  assert.equal(TH_SRC.split('[__SWISSEPH_FACT_SHEET__]').length - 1, 1, 'TH 锚点数须恰 1');
  assert.ok(/['"]th['"]\s*:\s*yearlySystemTH/.test(LOADER_SRC), 'loader.js 未把 th 映射到 yearlySystemTH');
  assert.ok(/yearlySystem\.includes\('__SWISSEPH_FACT_SHEET__'\)/.test(SERVER_SRC),
    'server.js 锚点守卫缺失/非语言无关 ⇒ TH 拿不到动态事实表');
});

test('F2 ④-A 月报 SLIM_LANG_PACKS 周卡样例零硬编码月份（fr/es/th），拼接处实填 {MONTH}/{YEAR}', () => {
  const hard = [
    ['fr', /Semaine \d: Août [0-9–]+]/g],
    ['es', /Semana \d: Agosto [0-9–]+]/g],
    ['th', /สัปดาห์ที่ \d: สิงหาคม [0-9–]+]/g],
  ];
  for (const [lg, re] of hard) {
    assert.equal((SERVER_SRC.match(re) || []).length, 0,
      `${lg} 月报周卡样例仍写死 8 月 ⇒ LLM 照抄 ⇒ 日期穿越`);
  }
  // 拼接处必须实填（否则 {MONTH} 字面量直接喂 LLM —— en/zh/vi 原本正踩此坑）
  assert.ok(/SLIM_LANG_PACKS\['zh'\]\)\s*\n\s*\.split\('\{MONTH\}'\)\.join\(/.test(SERVER_SRC),
    'SLIM_LANG_PACKS 拼接处缺 {MONTH} 实填');
  assert.ok(/\.split\('\{YEAR\}'\)\.join\(/.test(SERVER_SRC), 'SLIM_LANG_PACKS 拼接处缺 {YEAR} 实填');
});

test('F3 ④-C 陷阱卡月份无硬编码字面量；兜底必须走 MONTH_NAMES 当月', () => {
  assert.equal((SERVER_SRC.match(/'✦ \[⚠️ Pièges Financiers: Août 2026\] ✦'/g) || []).length, 0,
    'fr 陷阱卡仍硬编码 Août 2026');
  assert.equal((SERVER_SRC.match(/'✦ \[⚠️ Trampas Financieras: Agosto 2026\] ✦'/g) || []).length, 0,
    'es 陷阱卡仍硬编码 Agosto 2026');
  assert.ok(/MONTH_NAMES\.fr\[_pkN\.getMonth\(\)\]/.test(SERVER_SRC), 'fr 兜底未走 MONTH_NAMES 当月');
  assert.ok(/MONTH_NAMES\.es\[_pkN\.getMonth\(\)\]/.test(SERVER_SRC), 'es 兜底未走 MONTH_NAMES 当月');
});

// 行为级：抽取真实 normalizeReportTags（1356~1464，自洽；只需 MONTH_NAMES 表）
function buildNormalizeTags(src) {
  const code = grabFn(src, 'function normalizeReportTags(text, lang)');
  const mm = src.match(/const MONTH_NAMES = \{[\s\S]*?\n\};/);
  assert.ok(mm, 'server.js 缺 MONTH_NAMES 表（月份单一真源）');
  return new Function(`${mm[0]}\n${code}\nreturn normalizeReportTags;`)();
}

test('F4 ④-C 行为：原文月份优先（禁被当月覆盖）；无月份才用当月兜底', () => {
  const fn = buildNormalizeTags(SERVER_SRC);
  // 原文写了 7 月（≠当月）⇒ 必须原样保留；旧实现在此会把它改写成 Août 2026
  const out1 = fn('Intro.\nPièges Financiers: Juillet 2026\nEnd.', 'fr');
  assert.ok(out1.includes('✦ [⚠️ Pièges Financiers: Juillet 2026] ✦'),
    `fr 未保留原文月份（被当月覆盖？）: ${JSON.stringify(out1)}`);
  // 原文无月份 ⇒ 兜底走 MONTH_NAMES 当月（不是写死的 Agosto）
  const out2 = fn('Trampas Financieras: ojo con el gasto\n', 'es');
  const nowMonth = new Date().getMonth();
  assert.ok(out2.includes('✦ [⚠️ Trampas Financieras: '), `es 未补标签: ${JSON.stringify(out2)}`);
  assert.ok(!out2.includes('Agosto 2026') || nowMonth === 7,
    `es 兜底疑似写死 Agosto 2026（当前月=${nowMonth + 1}）: ${JSON.stringify(out2)}`);
});

test('F5 注入：SLIM 周卡样例回退成硬编码 Août ⇒ F2 判据必红', () => {
  const broken = SERVER_SRC.replace('✦ [🟢 Semaine 1: {MONTH} 1–7]', '✦ [🟢 Semaine 1: Août 1–7]');
  assert.notEqual(broken, SERVER_SRC, '注入未生效（SLIM fr W1 行被改？）');
  const re = /Semaine \d: Août [0-9–]+]/g;
  assert.equal((SERVER_SRC.match(re) || []).length, 0, '原实现已含硬编码（判据前提被破坏）');
  assert.ok((broken.match(re) || []).length > 0, '注入后判据仍为 0 ⇒ 判据空转');
});
