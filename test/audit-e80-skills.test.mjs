/**
 * audit-e80-skills.test.mjs —— E80「自我武装」四件兵器闸门（主公军令 2026-10-21）
 * ═══════════════════════════════════════════════════════════════════════════
 * 母题：历次 Bug 的规律是「门禁只查代码逻辑与字符串，缺一双看屏幕的眼睛」。
 * 本闸门不验业务真值，只锁**兵器本身的存在性与血训契约**，防止日后被「简化」回退：
 *   A. 四件兵器文件在位 + package.json 六条 skill:* 命令齐；
 *   B. ui-doctor：agent-browser 引擎 / 唯一会话 / 子进程静态服务 / 有界轮询 /
 *      锚点双条件 / 自检语义反转（判据有牙）/ mock 三件套；
 *   C. mobile-check：反弹窗探针三件套 / 零 open 断言 / 禁双层 JSON 编码 / 三态 SKIP；
 *   D. asset：trim 后取真尺寸 / 禁放大 / 质量阶梯；
 *   E. smoke：六语 12 条抽检 / TTFT 未测即 SKIP；
 *   F. 反回退：scripts 内不得重新引入 playwright（本机被安全中心 SIGTERM，不可用）；
 *   G. 产物目录不入库 / 常驻技能 SKILL.md 在位。
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const has = (p) => existsSync(join(ROOT, p));
const pkg = JSON.parse(read('package.json'));

const UI = 'scripts/skill-ui-doctor.mjs';
const MOBILE = 'scripts/skill-mobile-check.mjs';
const ASSET = 'scripts/skill-asset-optimize.mjs';
const SMOKE = 'scripts/skill-smoke.mjs';

test('E80-A 四件兵器落位 + 六条命令入 npm scripts', () => {
  for (const f of [UI, MOBILE, ASSET, SMOKE]) {
    assert.ok(has(f), `E80 兵器缺失：${f}`);
    assert.ok(read(f).length > 2000, `E80 兵器 ${f} 疑为空壳`);
  }
  const want = {
    'skill:ui': 'skill-ui-doctor.mjs',
    'skill:ui:self': '--self-test',
    'skill:mobile': 'skill-mobile-check.mjs',
    'skill:asset': 'skill-asset-optimize.mjs',
    'skill:smoke': 'skill-smoke.mjs',
    'skill:all': 'skill:ui',
  };
  for (const [k, v] of Object.entries(want)) {
    assert.ok(pkg.scripts[k], `E80 缺 npm script：${k}`);
    assert.ok(pkg.scripts[k].includes(v), `E80 ${k} 指向错误：${pkg.scripts[k]}`);
  }
  // 段位自保：长链有「收口位」契约（e40-compat 恒为 len-2、python 恒为链尾）。
  // 🧯 E80 血训：首版把本闸门 append 到链尾、次版插在 python 之前，均把 e40-compat 顶离 len-2 ⇒ 多条旧闸门翻红。
  const segs = String(pkg.scripts['test:astro']).split(' && ');
  const iE80 = segs.findIndex((s) => s.includes('audit-e80-skills'));
  const iCap = segs.findIndex((s) => s.includes('audit-e40-compat-synastry-tensor-fusion'));
  const iPy = segs.findIndex((s) => s.includes('audit_v492_peak_window.py'));
  assert.notEqual(iE80, -1, 'E80 闸门未挂入 test:astro（写好不接线 = 永不运行）');
  assert.equal(iCap, segs.length - 2, `收口位漂移：e40-compat 应为 len-2（实为 ${iCap}/${segs.length}）`);
  assert.equal(iPy, segs.length - 1, '链尾必须为 python 峰值审计段');
  assert.ok(iE80 < iCap, 'E80 闸门须插在收口位之前（插到链尾会把 e40-compat 顶离 len-2）');
});

test('E80-B1 ui-doctor：引擎／会话／静态服务 三条本机血训', () => {
  const s = read(UI);
  // ① 引擎＝agent-browser（本机 Playwright 被安全中心拦临时 profile 删除 ⇒ SIGTERM 137）
  assert.ok(/agent-browser/.test(s), 'E80 巡检引擎未走 agent-browser');
  assert.ok(/KS_AB_BIN/.test(s), 'E80 缺 KS_AB_BIN 可覆写入口');
  // ② 每次运行唯一会话名：同名会话启动需删旧 sock/pid，被拒 ⇒ Daemon exited
  assert.ok(/ksdoctor-\$\{process\.pid\}/.test(s), 'E80 会话名未带 pid ⇒ 复用同名会话必起不来');
  assert.ok(/const rotateSession = /.test(s), 'E80 缺 rotateSession（换视口必须换会话）');
  // ③ 静态服务必须独立子进程：execFileSync 阻塞事件循环 ⇒ 同进程 http 永不响应（os error 35）
  assert.ok(/spawn\(process\.execPath,\s*\['--input-type=module',\s*'-e',\s*SERVER_SRC\]/.test(s),
    'E80 静态服务未跑在子进程 ⇒ 同进程死锁');
  assert.ok(/console\.log\('PORT=' \+ this\.address\(\)\.port\)/.test(s), 'E80 子进程未回传端口');
  // ④ 中文路径：new URL().pathname 会 URL 编码 ⇒ 必须 fileURLToPath
  assert.ok(/fileURLToPath\(import\.meta\.url\)/.test(s), 'E80 未用 fileURLToPath（中文目录会被编码）');
});

test('E80-B2 ui-doctor：有界轮询（禁裸 wait 死等）', () => {
  const s = read(UI);
  assert.ok(/const waitFor = \(sel, ms = \d+\)/.test(s), 'E80 缺有界 waitFor');
  assert.ok(/while \(Date\.now\(\) - t0 < ms\)/.test(s), 'E80 waitFor 无上限循环');
  // agent-browser 的 wait 无超时参数，元素永不出现会死等（实测 7min 挂死）⇒ 禁裸调用
  assert.ok(!/\bab\('wait'/.test(s), 'E80 出现裸 ab(\'wait\') ⇒ 会死等，必须改用 waitFor');
});

test('E80-B3 ui-doctor：遮挡判据三条件（禁 0px² 假绿）+ 自检有牙', () => {
  const s = read(UI);
  // 锚点存在性必须回传：锚点缺失时 overlap() 返回 0 ⇒ 单看 0 会把「未测」当「通过」
  assert.ok(/anchors:\s*\{\s*title:\s*!!title,\s*subtitle:\s*!!subtitle,\s*startBtn:\s*!!startBtn\s*\}/.test(s),
    'E80 未回传三锚点存在性 ⇒ 无法区分「真不遮」与「没测到」');
  for (const k of ['bubbleVsTitle', 'bubbleVsSubtitle', 'bubbleVsStartBtn']) {
    const anchor = { bubbleVsTitle: 'title', bubbleVsSubtitle: 'subtitle', bubbleVsStartBtn: 'startBtn' }[k];
    const re = new RegExp(`home\\.anchors\\.${anchor}\\s*&&\\s*!!home\\.bubble\\s*&&\\s*home\\.overlaps\\.${k} === 0`);
    assert.ok(re.test(s), `E80 判据 ${k} 未锁「锚点在 ∧ 气泡在 ∧ overlap===0」三条件`);
  }
  // 自检语义反转：自检「通过」＝诱饵被抓到，而不是全绿
  assert.ok(/const baitCaught = /.test(s), 'E80 自检缺 baitCaught 统计');
  assert.ok(/process\.exit\(ok \? 0 : 1\)/.test(s), 'E80 自检未反转退出码（无牙也会报绿）');
  // 诱饵必须用 transform 增量：position:fixed 会被带 transform 的祖先坐标系甩飞（E80 实测 112×18 出屏）
  assert.ok(/m\.style\.setProperty\('transform'/.test(s), 'E80 诱饵未用 transform 增量 ⇒ 落点不可控');
});

test('E80-B4 ui-doctor：mock 三件套（结构同构 / 兜底 200 / SPA 回退）', () => {
  const s = read(UI);
  assert.ok(/bazi:\s*\{\s*sizhu:/.test(s), 'E80 mock 未同构（wealth-oracle 须嵌套 sizhu，扁平化会进错误态）');
  assert.ok(/url\.pathname\.startsWith\('\/api\/'\)[\s\S]{0,120}res\.end\('\{\}'\)/.test(s),
    'E80 缺 /api/* 兜底 200 ⇒ 页面并行探测 404 ⇒ 认领卡不渲染');
  assert.ok(/file = path\.join\(DIST, 'index\.html'\)/.test(s), 'E80 缺 SPA 回退 ⇒ 深链 404');
  assert.ok(/free_access=1/.test(s), 'E80 首页未走 E50 客户端绿道 ⇒ 灵宠不渲染，气泡判据恒未测');
});

test('E80-C1 mobile-check：反弹窗探针 + 零 open 断言', () => {
  const s = read(MOBILE);
  assert.ok(/window\.__ksHook = \{ open: 0, alert: 0, confirm: 0/.test(s), 'E80 缺弹窗探针');
  for (const fn of ['window.open', 'window.alert', 'window.confirm']) {
    assert.ok(new RegExp(`const \\w+ = ${fn.replace('.', '\\.')}`).test(s), `E80 未 hook ${fn}`);
  }
  assert.ok(/hook\.open === 0/.test(s), 'E80 未断言零 window.open（E72 铁律：付费/登录一律整页重定向）');
  assert.ok(/gateAppeared \|\| post\.gate \|\| navigated/.test(s), 'E80 未断言「点击后不静默」');
  assert.ok(/set', 'device', 'iPhone 14'/.test(s), 'E80 未启用 iPhone 14 设备模拟');
  assert.ok(/NOT WebKit/.test(s), 'E80 缺射程声明（Chromium 设备模拟 ≠ 真 WebKit）');
});

test('E80-C2 mobile-check：禁双层 JSON 编码 + 三态 SKIP', () => {
  const s = read(MOBILE);
  // eval 返回值由 CLI 统一编码一次；脚本内再 JSON.stringify ⇒ parse 出字符串 ⇒ 断言恒 undefined
  assert.ok(!/abEval\(`JSON\.stringify\(/.test(s), 'E80 abEval 内又 JSON.stringify ⇒ 双层编码，所有断言失效');
  assert.ok(/opts\.skip \? 'SKIP'/.test(s), 'E80 缺 SKIP 三态（射程外不得冒充通过）');
  assert.ok(/const measured = results\.length - skips\.length/.test(s), 'E80 分母未剔除 SKIP');
});

test('E80-D asset：真尺寸 / 禁放大 / 质量阶梯', () => {
  const s = read(ASSET);
  // sharp(buf).trim().metadata() 返回源图元数据，裁切尺寸拿不到 ⇒ 必须 resolveWithObject
  assert.ok(/toBuffer\(\{ resolveWithObject: true \}\)/.test(s), 'E80 trim 后未取真实 info.width（尺寸列会是假数）');
  assert.ok(/withoutEnlargement: true/.test(s), 'E80 允许放大 ⇒ 小图糊成大图');
  assert.ok(/let q = 82/.test(s) && /while \(q >= 60\)/.test(s), 'E80 缺质量阶梯（82→60）');
  assert.ok(/webp\(\{ quality: q/.test(s), 'E80 未输出 webp');
  assert.ok(/CHECK_ONLY/.test(s), 'E80 缺 --check 只体检模式');
});

test('E80-E smoke：六语 12 条抽检 + TTFT 未测即 SKIP', () => {
  const s = read(SMOKE);
  const markers = [
    '姻缘密码', '财富密码',
    'Destiny Love Code', 'Wealth Code',
    'Clé du Destin Amoureux', 'Clé de la Richesse',
    'Código del Destino Amoroso', 'Código de la Riqueza',
    'รหัสลับบุพเพสันนิวาส', 'รหัสลับความมั่งคั่ง',
    'Mật Mã Nhân Duyên', 'Mật Mã Tài Lộc',
  ];
  // 🧯 必须带引号匹配完整字面量：裸 includes 会被「加后缀」（Mật Mã Tài Lộc_PROBE）骗过 —— 探针实测
  for (const m of markers) assert.ok(s.includes(`'${m}'`) || s.includes(`"${m}"`), `E80 六语抽检缺词条：${m}`);
  assert.ok(/deploymentId/.test(s), 'E80 未校验部署双证之一 deploymentId');
  assert.ok(/if \(!TOKEN\)/.test(s) && /'SKIP', 'Gemini 流式首字延迟/.test(s), 'E80 TTFT 未提供凭证时必须显式 SKIP');
});

test('E80-F 反回退：scripts 内不得重新引入 playwright', () => {
  for (const f of [UI, MOBILE]) {
    const s = read(f);
    assert.ok(!/from 'playwright'|require\('playwright'\)/.test(s),
      `E80 ${f} 重新引入 playwright —— 本机启动被安全中心拦临时 profile 删除（SIGTERM 137），必假红`);
  }
});

test('E80-G 产物目录不入库 + 常驻技能在位', () => {
  assert.ok(/^dev-artifacts\/$/m.test(read('.gitignore')), 'E80 dev-artifacts（截图/report.json）未入 .gitignore');
  const skill = join(homedir(), '.workbuddy', 'skills', 'kindredsouls-visual-qa', 'SKILL.md');
  assert.ok(existsSync(skill), `E80 常驻技能 SKILL.md 缺失：${skill}`);
  const md = readFileSync(skill, 'utf8');
  for (const kw of ['kindredsouls-visual-qa', 'skill:ui', 'skill:smoke', 'agent-browser']) {
    assert.ok(md.includes(kw), `E80 SKILL.md 缺关键契约：${kw}`);
  }
});
