import { readFileSync, existsSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

/**
 * E83 【星际黑金设计令牌 · 暗黑美学巡检探针】闸门
 * 军令（2026-10-21）：为「姻缘模块全链路奢华重构」备好美学底座——
 *   ① celestial-tokens.css 深空黑金令牌唯一真源（曜石底/毛玻璃卡/星轨流光条/三级排版/动效曲线）；
 *   ② skill:ui:aesthetic 暗黑一致性与 WCAG AA 对比度探针（白底块拦截 + 隐形灰字拦截）；
 *   ③ 常驻设计准则 Skill（渐进式折叠/禁电线杆排版/深空黑金一镜到底）；
 *   ④ 画布底曜石化——星空视频缺失时优雅降级为深空底，永不闪白（Astro :root #fff 遗留封杀）。
 * 同时收录错题基因库 L17（String.raw 血训），gateAnchor 反向校验本文件。
 */
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(path.join(REPO, p), 'utf8');

test('E83 令牌真源断言：深空黑金五件套逐字在位（曜石底/毛玻璃/星轨流光/三级排版/动效曲线）', () => {
  const css = read('web/src/styles/celestial-tokens.css');
  // ① 深空曜石底（禁纯白背景的体系根基）
  assert.ok(css.includes('--ks-bg-obsidian:'), 'E83 缺 --ks-bg-obsidian（深空曜石底）');
  assert.ok(css.includes('--ks-bg-obsidian-solid: #0A0914'), 'E83 缺曜石纯色兜底');
  // ② 流光毛玻璃卡：blur(20px) + 钛金半透明微光描边（军令口径 1px solid rgba(245, 208, 138, 0.28)）
  assert.ok(css.includes('.ks-glass-card'), 'E83 缺 .ks-glass-card 工具类');
  assert.ok(css.includes('backdrop-filter: var(--ks-card-glass-blur)'), 'E83 毛玻璃卡未走令牌 blur');
  assert.ok(css.includes('--ks-card-glass-border: 1px solid rgba(245, 208, 138, 0.28)'), 'E83 钛金描边口径漂移');
  assert.ok(css.includes('blur(20px)'), 'E83 毛玻璃 blur(20px) 缺失');
  // ③ 星轨流光条：香槟金 × 星云玫瑰紫双色引力发光（替换医院体检表绿条的唯一正身）
  assert.ok(css.includes('--ks-gold: #F5D08A'), 'E83 流光香槟金 #F5D08A 缺失');
  assert.ok(css.includes('--ks-nebula: #C084FC'), 'E83 星云玫瑰紫 #C084FC 缺失');
  assert.ok(css.includes('.ks-orbit-bar'), 'E83 缺 .ks-orbit-bar 星轨条工具类');
  // ④ 三级高对比排版
  for (const v of ['--ks-text-primary', '--ks-text-secondary', '--ks-text-gold']) {
    assert.ok(css.includes(v), `E83 三级排版缺 ${v}`);
  }
  // ⑤ 动效曲线（丝滑折叠禁 height:auto 动画）与塔罗 3D 翻转
  assert.ok(css.includes('--ks-ease-silk'), 'E83 缺丝滑曲线');
  assert.ok(css.includes('grid-template-rows: 0fr'), 'E83 折叠抽屉未用 0fr→1fr 过渡（height:auto 动画必卡顿）');
  assert.ok(css.includes('.ks-tarot-card') && css.includes('backface-visibility: hidden'), 'E83 塔罗 3D 翻转三件套缺失');
  assert.ok(css.includes('.ks-esoteric-icon') && css.includes('drop-shadow'), 'E83 星相图标发光滤镜缺失');
});

test('E83 令牌接线断言：App.tsx 先载令牌后载 App.css＋画布底曜石化（Astro 白画布封杀）', () => {
  const tsx = read('web/src/App.tsx');
  const iTok = tsx.indexOf("import './styles/celestial-tokens.css'");
  const iApp = tsx.indexOf("import './App.css'");
  assert.ok(iTok > -1, 'E83 App.tsx 未引入 celestial-tokens.css（写好不接线 = 令牌永远不生效）');
  assert.ok(iApp > -1 && iTok < iApp, 'E83 令牌须先于 App.css 载入（供其引用与覆盖）');
  const css = read('web/src/App.css');
  assert.ok(css.includes('background: var(--ks-bg-obsidian-solid, #0A0914)'),
    'E83 画布底未曜石化——视频缺失时整页裸白（医院白），探针必拦');
  assert.ok(!/body \{[^}]*background: transparent/.test(css), 'E83 body transparent 回潮 = 画布回落 Astro :root #fff 遗留');
});

test('E83 美学探针断言：白底拦截＋WCAG AA＋诱饵同 eval 合并＋String.raw 承载', () => {
  const s = read('scripts/skill-ui-doctor.mjs');
  // 浏览器 eval 载荷必须 String.raw 承载：普通模板字面量吞 \( \) ⇒ 正则组化 ⇒ NaN 全链假绿（L17 血训）
  assert.ok(s.includes('String.raw`(() => {'), 'E83 AESTHETIC_JS 未用 String.raw 承载（正则必被模板转义破坏）');
  // 军令口径：大面积亮白 = RGB 均值>200 且 ≥12000px²
  assert.ok(s.includes('const MIN_AREA = 12000, WHITE_AVG = 200'), 'E83 白底判据口径漂移');
  // WCAG AA：正文 ≥4.5:1 / 大字 ≥3:1
  assert.ok(s.includes('large ? 3.0 : 4.5'), 'E83 WCAG AA 双阈值缺失');
  assert.ok(s.includes('runAesthetic'), 'E83 美学探针未接线');
  assert.ok(s.includes('--aesthetic') && s.includes("--route"), 'E83 缺 --aesthetic / --route 入口');
  // 诱饵与扫描必须同一次 eval（分两次会被首页 free_access 消费后的整页重写吞掉）
  assert.ok(s.includes('`${BAIT_AESTHETIC_JS};\\n${AESTHETIC_JS}`'), 'E83 诱饵未与扫描合并为单次 eval（导航窗口吞诱饵 ⇒ 假绿）');
  assert.ok(s.includes('baitSeen'), 'E83 缺诱饵贯穿自证（baitSeen=false 须判未测）');
  // 亮底小面积挂账不翻红（重构军令统一清剿）
  assert.ok(s.includes('warnings.push(item)'), 'E83 亮底小元素挂账通道缺失');
});

test('E83 探针命令断言：npm scripts 双命令（跑批 + 诱饵验牙）', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.scripts['skill:ui:aesthetic'], 'node scripts/skill-ui-doctor.mjs --aesthetic', 'E83 缺 skill:ui:aesthetic');
  assert.equal(pkg.scripts['skill:ui:aesthetic:self'], 'node scripts/skill-ui-doctor.mjs --aesthetic --self-test', 'E83 缺 skill:ui:aesthetic:self（探针无自检 = 无牙也全绿）');
});

test('E83 常驻技能断言：celestial-ui 设计准则四大宪法在位', () => {
  const skill = path.join(homedir(), '.workbuddy', 'skills', 'kindredsouls-celestial-ui', 'SKILL.md');
  assert.ok(existsSync(skill), `E83 常驻技能 SKILL.md 缺失：${skill}`);
  const md = readFileSync(skill, 'utf8');
  for (const kw of ['kindredsouls-celestial-ui', 'celestial-tokens.css', '渐进式折叠', '电线杆', '一镜到底', 'WCAG', 'skill:ui:aesthetic']) {
    assert.ok(md.includes(kw), `E83 SKILL.md 缺关键契约：${kw}`);
  }
});

test('E83 基因库回校：L17（String.raw 血训）四元组在位且 gateAnchor 指回本文件', () => {
  const bank = JSON.parse(read('LESSONS_LEARNED.json'));
  const l17 = bank.lessons.find((l) => l.id === 'L17');
  assert.ok(l17, '基因库缺 L17（E83 反思未入库）');
  for (const f of ['title', 'trigger', 'rootCause', 'ironRule', 'gate', 'gateAnchor']) {
    assert.ok(String(l17[f] || '').trim(), `L17 字段 ${f} 缺失`);
  }
  assert.equal(l17.gate, 'test/audit-e83-celestial-ui.test.mjs', 'L17 gate 须指回本文件');
  assert.ok(read(l17.gate).includes(l17.gateAnchor), 'L17 gateAnchor 未在闸门逐字找到（记忆没长牙）');
});

test('E83 链位自保：闸门挂入 test:astro（e82 之后、收口位 e40-compat 之前；python 恒链尾）', () => {
  const pkg = JSON.parse(read('package.json'));
  const segs = pkg.scripts['test:astro'].split(' && ');
  const i83 = segs.findIndex((x) => x.includes('audit-e83-celestial-ui'));
  const i82 = segs.findIndex((x) => x.includes('audit-e82-home-pet-i18n'));
  const iCap = segs.findIndex((x) => x.includes('audit-e40-compat-synastry-tensor-fusion'));
  const iPy = segs.findIndex((x) => x.trim().startsWith('python3'));
  assert.notEqual(i83, -1, 'E83 闸门未挂入 test:astro（写好不接线 = 永不运行）');
  assert.ok(i82 > -1 && i82 < i83 && i83 < iCap, 'E 系闸门须按序排在收口位之前（L13 铁律）');
  assert.equal(iCap, segs.length - 2, `收口位漂移：e40-compat 应为 len-2（实为 ${iCap}/${segs.length}）`);
  assert.equal(iPy, segs.length - 1, 'python 峰值审计须恒为链尾');
});
