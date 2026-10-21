import { readFileSync, existsSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

/**
 * E81 【自我进化与错题免疫】错题基因库闸门（skill-self-evolve）
 *
 * 军令三件事的编译产物：
 *   1) 结构化错题基因库（LESSONS_LEARNED.json）：禁止 E 编号流水账，
 *      每条必须 [触发场景]→[根因]→[永久免疫铁律]→[守护断言] 四元组齐全。
 *   2) Pre-Flight Recall：scripts/skill-self-evolve.mjs --recall <关键词>（任务前强制检索）。
 *   3) 记忆自动编译为门禁：每条 lesson 的 gateAnchor 必须在 gate 文件中逐字存在——
 *      没有牙齿的记忆禁止入库（本闸门强制）。
 *
 * 另含「补牙段」：E67/E71/E77 三条历史血训此前无闸门，此处长出真源断言（记忆→牙齿）。
 */
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(path.join(REPO, p), 'utf8');

const BANK_PATH = path.join(REPO, 'LESSONS_LEARNED.json');
const bank = JSON.parse(readFileSync(BANK_PATH, 'utf8'));

test('E81-A 【基因库结构】四元组齐全＋id 唯一＋modules/episodes 非空', () => {
  assert.ok(Array.isArray(bank.lessons), 'lessons 须为数组');
  const seen = new Set();
  for (const l of bank.lessons) {
    assert.match(l.id || '', /^L\d+$/, `id 须 L{n} 格式：${l.id}`);
    assert.ok(!seen.has(l.id), `id 重复：${l.id}`);
    seen.add(l.id);
    // 四元组：触发场景 -> 根因 -> 铁律 -> 守护断言（禁止流水账空字段）
    for (const f of ['title', 'trigger', 'rootCause', 'ironRule']) {
      assert.ok(typeof l[f] === 'string' && l[f].trim().length >= 4, `${l.id} 四元组字段 ${f} 缺失/过短（流水账嫌疑）`);
    }
    assert.ok(Array.isArray(l.modules) && l.modules.length > 0, `${l.id} modules 非空（Pre-Flight Recall 靠它命中）`);
    assert.ok(Array.isArray(l.episodes) && l.episodes.length > 0, `${l.id} episodes 须溯源 E 编号`);
    assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(l.date || ''), `${l.id} date 须 YYYY-MM-DD`);
  }
});

test('E81-B 【库容下界】基因只增不减（≥14）', () => {
  assert.ok(bank.lessons.length >= 14, `库容 ${bank.lessons.length} < 14：错题基因禁止删减（新增教训只增条目）`);
});

test('E81-C 【记忆长牙】每条 gateAnchor 在 gate 文件中逐字存在（无牙记忆禁入库）', () => {
  for (const l of bank.lessons) {
    const gatePath = path.join(REPO, l.gate);
    assert.ok(existsSync(gatePath), `${l.id} gate 文件不存在：${l.gate}`);
    const s = readFileSync(gatePath, 'utf8');
    assert.ok(s.includes(l.gateAnchor), `${l.id} gateAnchor 未在 ${l.gate} 逐字找到——记忆没长牙（先补断言再入库）`);
  }
});

test('E81-D 【检索引擎】skill-self-evolve.mjs --self-check 零违规', () => {
  const out = execFileSync(process.execPath, [path.join(REPO, 'scripts/skill-self-evolve.mjs'), '--self-check'], { encoding: 'utf8' });
  assert.match(out, /自检通过/);
});

test('E81-E 【Pre-Flight Recall】关键词召回命中且可溯源', () => {
  const out = execFileSync(process.execPath, [path.join(REPO, 'scripts/skill-self-evolve.mjs'), '--recall', 'bubble', 'oauth'], { encoding: 'utf8' });
  assert.match(out, /L12/, 'recall 须能按 bubble 命中 L12（气泡限宽扣位移）');
  assert.match(out, /L05/, 'recall 须能按 oauth 命中 L05（移动端整页重定向）');
  assert.match(out, /免疫铁律/, '召回输出须含铁律声明块');
});

test('E81-F 【npm 接线】skill:evolve / skill:evolve:check 已挂 package.json', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.ok(pkg.scripts['skill:evolve'] && pkg.scripts['skill:evolve'].includes('skill-self-evolve.mjs'), '缺 skill:evolve');
  assert.ok(pkg.scripts['skill:evolve:check'] && pkg.scripts['skill:evolve:check'].includes('--self-check'), '缺 skill:evolve:check');
});

/* ---------- 补牙段：历史血训此前无闸门，在此长出真源断言（gateAnchor 由基因库反向校验本文件） ---------- */

test('E77 镜像铁律断言：桌面对话舱 Sophia 左 / Milo 右（data-familiar 分流，禁按 name）', () => {
  const css = read('web/src/App.css');
  assert.ok(css.includes('[data-familiar="sophia"]'), '缺 Sophia 镜像选择器');
  assert.ok(/justify-content:\s*flex-start/.test(css), 'Sophia 舱须 flex-start 镜像左下');
  assert.ok(css.includes('padding: 0 0 20px 24px'), 'Sophia 舱左贴边口径漂移（应为 padding: 0 0 20px 24px）');
  const sheet = read('web/src/components/FamiliarChatSheet.tsx');
  assert.match(sheet, /data-familiar=/, 'portal 根须挂 data-familiar');
  assert.match(sheet, /ip\s*===\s*'Milo'/, 'data-familiar 须按 IP 分流（禁按 name）');
});

test('E67 关 thinking 断言：GenConfig thinkingBudget 0 根除空气泡', () => {
  const srv = read('server.js');
  assert.match(srv, /thinkingBudget:\s*0/, 'GenConfig 须 thinkingBudget: 0（thinking 空气泡根源）');
});

test('E71 限宽扣位移断言：气泡 max-width 必扣 44px 位移（390 屏不出屏）', () => {
  const css = read('web/src/App.css');
  assert.ok(css.includes('max-width: min(150px, calc(40vw - 44px))'), '气泡限宽须扣位移：max-width: min(150px, calc(40vw - 44px))');
  assert.ok(css.includes('bottom: 56%'), '气泡垂直口径漂移（应为 bottom: 56%）');
});

/* ---------- 链位自保（同 E80 口径：收口位契约） ---------- */

test('E81-G 【链位自保】闸门挂入 test:astro 且不顶飞收口位（e40 恒 len-2、python 恒链尾）', () => {
  const pkg = JSON.parse(read('package.json'));
  const segs = pkg.scripts['test:astro'].split(' && ');
  const i81 = segs.findIndex((s) => s.includes('audit-e81-self-evolve'));
  const i80 = segs.findIndex((s) => s.includes('audit-e80-skills'));
  const iCap = segs.findIndex((s) => s.includes('audit-e40-compat-synastry-tensor-fusion'));
  const iPy = segs.findIndex((s) => s.trim().startsWith('python3'));
  assert.notEqual(i81, -1, 'E81 闸门未挂入 test:astro（写好不接线 = 永不运行）');
  assert.ok(i81 < iCap, 'E81 闸门须插在收口位 e40-compat 之前（L13 铁律）');
  assert.ok(i80 < iCap, 'E80 闸门须仍在收口位之前');
  assert.equal(iCap, segs.length - 2, `收口位漂移：e40-compat 应为 len-2（实为 ${iCap}/${segs.length}）`);
  assert.equal(iPy, segs.length - 1, 'python 峰值审计须恒为链尾');
});
