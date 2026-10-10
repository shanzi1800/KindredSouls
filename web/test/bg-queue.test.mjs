/**
 * 首页背景「插拔式轮播容器」纯逻辑核自测
 *
 * 覆盖：
 *   A 数据模型与兜底态（默认队列 / 退化判据）
 *   B 时长合法化（缺省 / 越界夹取 / 非法剔除）
 *   C 队列循环（固定列表顺序 Queue Loop）
 *   D 外部配置校验（sanitizeBgQueue：热插拔安全边界，绝不静默伪造）
 *   E 时间控制器咬合（定时切槽 + 预载次序的确定性推演）
 *
 * 纯 Node 运行（Node 22 type-stripping 直读 .ts），零 DOM、零网络、零 LLM。
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BG_ITEM_TYPES,
  BG_QUEUE_CONFIG_PATH,
  BG_VIDEOS,
  DEFAULT_HOLD_MS,
  MAX_HOLD_MS,
  MAX_QUEUE_ITEMS,
  MIN_HOLD_MS,
  nextQueueIndex,
  pickQueueItem,
  resolveHoldMs,
  sanitizeBgQueue,
  shouldDegradeToSingle,
} from '../src/lib/bgQueue.ts';

/* ───────── A 数据模型与兜底态 ───────── */

test('A1 默认队列是单支 ambient 兜底（引擎自动退化为常驻循环）', () => {
  assert.equal(BG_VIDEOS.length, 1);
  const d = BG_VIDEOS[0];
  assert.equal(d.src, '/cosmic_bg.mp4');
  assert.equal(d.type, 'ambient');
  assert.equal(d.holdMs, 30_000);
  assert.ok(d.id.length > 0, 'id 不可为空');
});

test('A2 单支队列不触发降级（主干恒可播）', () => {
  assert.equal(shouldDegradeToSingle(BG_VIDEOS, { saveData: true, reducedMotion: true }), false);
});

test('A3 常量护栏（契约冻结，防误改）', () => {
  assert.equal(MIN_HOLD_MS, 5_000);
  assert.equal(MAX_HOLD_MS, 300_000);
  assert.equal(DEFAULT_HOLD_MS, 30_000);
  assert.equal(MAX_QUEUE_ITEMS, 12);
  assert.deepEqual([...BG_ITEM_TYPES], ['ambient', 'story', 'ad']);
  assert.equal(BG_QUEUE_CONFIG_PATH, '/bg-queue.json');
});

/* ───────── B 时长合法化 ───────── */

test('B1 缺省/非法 holdMs 一律回落到默认 30s（绝不臆造时长）', () => {
  for (const bad of [undefined, null, NaN, Infinity, -Infinity]) {
    assert.equal(resolveHoldMs({ id: 'x', src: '/a.mp4', holdMs: bad, type: 'ambient' }), DEFAULT_HOLD_MS);
  }
  assert.equal(resolveHoldMs({ id: 'x', src: '/a.mp4', holdMs: 0, type: 'ambient' }), MIN_HOLD_MS);
});

test('B2 越界夹取到 [MIN, MAX]', () => {
  assert.equal(resolveHoldMs({ id: 'x', src: '/a.mp4', holdMs: 1_500, type: 'ambient' }), MIN_HOLD_MS);
  assert.equal(resolveHoldMs({ id: 'x', src: '/a.mp4', holdMs: 999_999, type: 'ambient' }), MAX_HOLD_MS);
});

test('B3 合法值原样保留（15s / 30s 异构混排）', () => {
  assert.equal(resolveHoldMs({ id: 'x', src: '/a.mp4', holdMs: 15_000, type: 'story' }), 15_000);
  assert.equal(resolveHoldMs({ id: 'x', src: '/a.mp4', holdMs: 30_000, type: 'ad' }), 30_000);
  assert.equal(resolveHoldMs({ id: 'x', src: '/a.mp4', holdMs: 12_345.6, type: 'ad' }), 12_346);
});

/* ───────── C 队列循环（Queue Loop）───────── */

test('C1 两支队列：0→1→0 闭环', () => {
  assert.equal(nextQueueIndex(0, 2), 1);
  assert.equal(nextQueueIndex(1, 2), 0);
});

test('C2 三支队列：0→1→2→0 闭环', () => {
  assert.equal(nextQueueIndex(0, 3), 1);
  assert.equal(nextQueueIndex(1, 3), 2);
  assert.equal(nextQueueIndex(2, 3), 0);
});

test('C3 越界/负数/非法一律归一后取下一支（不抛错、不越界）', () => {
  assert.equal(nextQueueIndex(7, 3), 2);
  assert.equal(nextQueueIndex(-1, 3), 0);
  assert.equal(nextQueueIndex(2.9, 3), 0);
  assert.equal(nextQueueIndex(0, 0), 0);
  assert.equal(nextQueueIndex(0, -5), 0);
  assert.equal(nextQueueIndex(NaN, 3), 1);
});

test('C4 pickQueueItem 越界夹取，空队列回退默认首支', () => {
  const q = BG_VIDEOS.concat([
    { id: 'story-15', src: '/bg_story_15s.mp4', holdMs: 15_000, type: 'story' },
    { id: 'ad-30', src: '/bg_ad_30s.mp4', holdMs: 30_000, type: 'ad' },
  ]);
  assert.equal(pickQueueItem(q, 0).id, 'default-cosmic');
  assert.equal(pickQueueItem(q, 1).id, 'story-15');
  assert.equal(pickQueueItem(q, 99).id, 'ad-30');
  assert.equal(pickQueueItem(q, -3).id, 'default-cosmic');
  assert.equal(pickQueueItem([], 5).src, '/cosmic_bg.mp4');
});

/* ───────── D 外部配置校验（热插拔安全边界）───────── */

test('D1 标准形态 {version, items} 解析成功（15s/30s 混排）', () => {
  const q = sanitizeBgQueue({
    version: 1,
    items: [
      { id: 'story-1', src: '/bg_story_15s.mp4', holdMs: 15_000, type: 'story' },
      { id: 'ad-1', src: '/bg_ad_30s.mp4', holdMs: 30_000, type: 'ad' },
    ],
  });
  assert.equal(q.length, 2);
  assert.deepEqual(q.map(i => i.type), ['story', 'ad']);
  assert.deepEqual(q.map(i => i.holdMs), [15_000, 30_000]);
});

test('D2 裸数组形态同样接受', () => {
  const q = sanitizeBgQueue([{ id: 'a', src: '/a.mp4', holdMs: 15_000, type: 'ambient' }]);
  assert.equal(q.length, 1);
  assert.equal(q[0].id, 'a');
});

test('D3 非法条目整条剔除（缺 src / src 非串 / src 空 / 非对象）', () => {
  const q = sanitizeBgQueue({
    items: [
      { id: 'ok', src: '/ok.mp4', holdMs: 15_000, type: 'story' },
      { id: 'no-src', holdMs: 15_000, type: 'ad' },
      { id: 'bad-src', src: 123, holdMs: 15_000, type: 'ad' },
      { id: 'empty', src: '   ', holdMs: 15_000, type: 'ad' },
      'not-an-object',
      null,
    ],
  });
  assert.deepEqual(q.map(i => i.id), ['ok']);
});

test('D4 未知 type 归一为 ambient；缺 id 自动补；重复 id 去重', () => {
  const q = sanitizeBgQueue({
    items: [
      { src: '/a.mp4', holdMs: 15_000, type: 'promo' },
      { id: 'dup', src: '/b.mp4', holdMs: 15_000, type: 'ad' },
      { id: 'dup', src: '/c.mp4', holdMs: 15_000, type: 'ad' },
    ],
  });
  assert.equal(q.length, 3);
  assert.equal(q[0].type, 'ambient');
  assert.equal(q[0].id, 'bg-1');
  assert.equal(q[1].id, 'dup');
  assert.notEqual(q[2].id, q[1].id, '重复 id 必须去重');
});

test('D5 缺 holdMs ⇒ 默认 30s（不臆造）', () => {
  const q = sanitizeBgQueue({ items: [{ id: 'x', src: '/x.mp4', type: 'ambient' }] });
  assert.equal(q[0].holdMs, DEFAULT_HOLD_MS);
});

test('D6 垃圾输入返回空数组（调用方回退默认队列）', () => {
  for (const bad of [null, undefined, 0, 'x', {}, { items: 'x' }, [], { items: [] }]) {
    assert.deepEqual(sanitizeBgQueue(bad), []);
  }
});

test('D7 队列长度上限截断（防误配置打爆首屏流量）', () => {
  const many = Array.from({ length: 40 }, (_, i) => ({ id: `v${i}`, src: `/v${i}.mp4`, holdMs: 15_000, type: 'ad' }));
  assert.equal(sanitizeBgQueue({ items: many }).length, MAX_QUEUE_ITEMS);
});

test('D8 相对路径 src 可用，绝对 http(s) 可用，含 js 伪协议被拒', () => {
  const q = sanitizeBgQueue({
    items: [
      { id: 'rel', src: '/bg/rel.mp4', holdMs: 15_000, type: 'ad' },
      { id: 'abs', src: 'https://cdn.example.com/x.mp4', holdMs: 15_000, type: 'ad' },
      { id: 'evil', src: 'javascript:alert(1)', holdMs: 15_000, type: 'ad' },
    ],
  });
  assert.deepEqual(q.map(i => i.id), ['rel', 'abs']);
});

/* ───────── E 时间控制器咬合（确定性推演）───────── */

test('E1 15s/15s 双支：切换时刻与序号推进严格咬合队列循环', () => {
  // 与组件内定时器同源语义：holdMs = resolveHoldMs(当前支)；切槽后 index = nextQueueIndex(cur, len)
  const queue = sanitizeBgQueue({
    version: 1,
    items: [
      { id: 'slot-1', src: '/cosmic_bg.mp4', holdMs: 15_000, type: 'ambient' },
      { id: 'slot-2', src: '/cosmic_bg.mp4', holdMs: 15_000, type: 'ambient' },
    ],
  });
  assert.equal(queue.length, 2);

  let cur = 0;
  let t = 0;
  const switches = [];
  for (let i = 0; i < 4; i++) {
    const hold = resolveHoldMs(queue[cur]);
    t += hold;
    cur = nextQueueIndex(cur, queue.length);
    switches.push({ at: t, index: cur, id: queue[cur].id });
  }

  assert.deepEqual(switches, [
    { at: 15_000, index: 1, id: 'slot-2' },
    { at: 30_000, index: 0, id: 'slot-1' },
    { at: 45_000, index: 1, id: 'slot-2' },
    { at: 60_000, index: 0, id: 'slot-1' },
  ]);
});

test('E2 15s/30s 异构混排：每支按自身 holdMs 停留，序仍按队列循环', () => {
  const queue = sanitizeBgQueue({
    items: [
      { id: 'story-15', src: '/bg_story_15s.mp4', holdMs: 15_000, type: 'story' },
      { id: 'ad-30', src: '/bg_ad_30s.mp4', holdMs: 30_000, type: 'ad' },
      { id: 'amb', src: '/cosmic_bg.mp4', holdMs: 30_000, type: 'ambient' },
    ],
  });
  let cur = 0;
  let t = 0;
  const seq = [];
  for (let i = 0; i < 4; i++) {
    t += resolveHoldMs(queue[cur]);
    seq.push({ at: t, id: queue[cur].id });
    cur = nextQueueIndex(cur, queue.length);
  }
  assert.deepEqual(seq, [
    { at: 15_000, id: 'story-15' },
    { at: 45_000, id: 'ad-30' },
    { at: 75_000, id: 'amb' },
    { at: 90_000, id: 'story-15' },
  ]);
  assert.equal(seq[1].at - seq[0].at, 30_000, 'ad 支按自身 30s 停留');
  assert.equal(seq[3].at - seq[2].at, 15_000, '回到 story 支按 15s 停留');
});

test('E3 单支队列：不产生任何切换（退化为常驻循环，零轮播开销）', () => {
  const queue = BG_VIDEOS;
  // 单支时组件 multi=false ⇒ 计时器不挂载；此处以同源判据复核该前置条件
  assert.equal(queue.length > 1, false);
  assert.equal(nextQueueIndex(0, queue.length), 0, '即便误调用也只是原地不动');
});
