import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * E82 【首页灵宠体型锁 · 气泡动态防遮挡 · 开场白语言联动】闸门
 * 军令（2026-10-21）：①灵宠以 EN 为唯一真源锁 98px；②幸运卡与主标题外边界动态解耦（间隙 ≥24px）；
 * ③开场白 100% 绑定所选语言；④Milo/Sophia 双宠镜像同步。
 * 同时收录错题基因库 L15/L16（E82 反思产物），gateAnchor 反向校验本文件。
 */
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(path.join(REPO, p), 'utf8');

test('E82 体型语言不变式断言：灵宠渲染宽锁 98px（EN 基准）＋calc 保球心落位', () => {
  const css = read('web/src/App.css');
  assert.equal((css.match(/width: min\(98px, 70%\)/g) || []).length, 2, 'Milo/Sophia 体型锁须双在（min(98px, 70%)）');
  assert.ok(css.includes('left: calc(44% - 62.3px)'), 'Milo 球心锚 calc 漂移（44% − 0.636×98px）');
  assert.ok(css.includes('left: calc(56% - 35.3px)'), 'Sophia 球心锚 calc 漂移（56% − 0.360×98px）');
  assert.ok(!css.includes('left: -0.5%'), '旧 Milo % 锚禁回潮（会随按钮宽缩放）');
  assert.ok(!/\.ks-fam-sophia \{\s*\n\s*left: 30\.8%/.test(css), '旧 Sophia % 锚禁回潮');
});

test('E82 气泡动态解耦断言：showBubble 实测标题盒外推（≥24px 间隙＋屏内钳制＋垂直兜底）', () => {
  const s = read('web/src/components/FamiliarHomeCard.tsx');
  assert.ok(s.includes('const GAP = 24'), '军令间隙常量 24 缺失');
  assert.ok(s.includes('const BUB = 150'), '气泡宽度上限常量缺失（屏内钳制依赖）');
  assert.ok(s.includes('hShift') && s.includes('vRaise'), '横向外推/垂直兜底双策略缺失');
  assert.ok(s.includes("querySelector('.title')"), '未实测主标题盒（锚点解耦必须运行时量测）');
  assert.ok(s.includes("getBoundingClientRect"), '未用真页几何量测');
});

test('E82 开场白语言联动断言：每次唤醒按当前语言重建（openedRef 一生一次禁回潮）', () => {
  const s = read('web/src/components/FamiliarChatSheet.tsx');
  assert.ok(!s.includes('openedRef'), 'openedRef「一生一次」模式禁回潮（E82 军令③根因）');
  assert.ok(s.includes("setMsgs([{ id: 'hello', role: 'assistant', text: hello }]);"), '开场白重建缺失');
  assert.ok(s.includes("t('familiar.chatHello'"), '开场白未走 i18n 字典');
});

test('E82 巡检射程断言：ui-doctor 六语 × 双宠全量（体型锁＋间隙 ≥24px＋极差 ≤2px）', () => {
  const s = read('scripts/skill-ui-doctor.mjs');
  for (const lang of ['zh', 'en', 'fr', 'es', 'th', 'vi']) {
    assert.ok(s.includes(`'${lang}'`), `六语巡检缺 ${lang}`);
  }
  assert.ok(s.includes('runLangSweep'), '六语巡检未接线');
  assert.ok(s.includes('灵宠体型锁 98px'), '体型锁断言缺失');
  assert.ok(s.includes('气泡与标题边缘间距 ≥24px'), '间隙断言缺失');
  assert.ok(s.includes('六语体型极差 ≤2px'), '跨语不变式断言缺失');
});

test('E82 基因库回校：L15/L16 四元组在位且 gateAnchor 指回本文件', () => {
  const bank = JSON.parse(read('LESSONS_LEARNED.json'));
  const l15 = bank.lessons.find((l) => l.id === 'L15');
  const l16 = bank.lessons.find((l) => l.id === 'L16');
  assert.ok(l15 && l16, '基因库缺 L15/L16（E82 反思未入库）');
  for (const l of [l15, l16]) {
    for (const f of ['title', 'trigger', 'rootCause', 'ironRule', 'gate', 'gateAnchor']) {
      assert.ok(String(l[f] || '').trim(), `${l.id} 字段 ${f} 缺失`);
    }
    assert.equal(l.gate, 'test/audit-e82-home-pet-i18n.test.mjs', `${l.id} gate 须指回本文件`);
    assert.ok(read(l.gate).includes(l.gateAnchor), `${l.id} gateAnchor 未在闸门逐字找到（记忆没长牙）`);
  }
});

test('E82 链位自保：闸门挂入 test:astro（e81 之后、收口位 e40-compat 之前；python 恒链尾）', () => {
  const pkg = JSON.parse(read('package.json'));
  const segs = pkg.scripts['test:astro'].split(' && ');
  const i82 = segs.findIndex((s) => s.includes('audit-e82-home-pet-i18n'));
  const i81 = segs.findIndex((s) => s.includes('audit-e81-self-evolve'));
  const i80 = segs.findIndex((s) => s.includes('audit-e80-skills'));
  const iCap = segs.findIndex((s) => s.includes('audit-e40-compat-synastry-tensor-fusion'));
  const iPy = segs.findIndex((s) => s.trim().startsWith('python3'));
  assert.notEqual(i82, -1, 'E82 闸门未挂入 test:astro（写好不接线 = 永不运行）');
  assert.ok(i80 < i81 && i81 < i82 && i82 < iCap, 'E 系闸门须按序排在收口位之前（L13 铁律）');
  assert.equal(iCap, segs.length - 2, `收口位漂移：e40-compat 应为 len-2（实为 ${iCap}/${segs.length}）`);
  assert.equal(iPy, segs.length - 1, 'python 峰值审计须恒为链尾');
});
