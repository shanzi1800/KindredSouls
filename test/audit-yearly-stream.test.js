// ═══════════════════════════════════════════════════════════════════════
// 🛡️ V477b: 年报「真流式」回归闸门
// 事故背景: 2026-09-30 大叔复测 1989 盘年报 —— 「不是流式输出，等了 50 多秒一次性生成」。
// 根因: /api/wealth-oracle/stream 的 yearly/once MISS 分支走 V411 遗留方案
//   「callAI 非流式生成完整篇 → _safeChunk 分块批量推流」——
//   实测 fresh 生成时首块 42.9s 才到，76 个块全挤在最后 0.6 秒同一批到达，
//   浏览器一次渲染 → 观感等同命中缓存。
// 本测试: 源码级结构断言(真流式通道存在 + 无二次全量推流 + 通道纪律 + 缓存 key 一致)，
//   并附【注入缺陷自测】证明闸门确实会红(从不报警的闸门等于没有闸门)。
// ═══════════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverSrc = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf-8');

/** 截取年报/一次性报告 MISS 生成分支(V477b 标记 → V475 三掷全败留痕) */
function yearlyBranch() {
  const start = serverSrc.indexOf('V477b: 非月报(yearly/once) MISS');
  const end = serverSrc.indexOf('[V475] ❌❌ 年报三次生成均未过完整度闸门');
  assert.ok(start > 0, '未找到 V477b 年报真流式分支标记');
  assert.ok(end > start, '未找到 V475 完整度闸门收尾标记(分支被破坏?)');
  return serverSrc.slice(start, end);
}

// ── 判据(抽成纯函数，便于注入缺陷自测) ──
const isTrueStream = (b) => /stream:\s*true/.test(b) && /_yrStreamed/.test(b) && /_yrEmit\(/.test(b);
const hasSecondBatchEmit = (b) => /const _chunks = _safeChunk/.test(b);
const channelOrder = (b) => [
  b.indexOf('完整度体检 #1(DeepSeek)'),
  b.indexOf('完整度体检 #2(DeepSeek高温)'),
  b.indexOf('完整度体检 #3(Gemini后备)'),
];

test('① 年报 MISS 必须走真流式(DeepSeek SSE stream:true + 逐块推送)', () => {
  const b = yearlyBranch();
  assert.ok(/stream:\s*true/.test(b), '年报分支缺少 stream:true —— 已回退为「假流式」(全文生成完再批量推流)');
  assert.ok(/_yrStreamed/.test(b), '年报分支缺少 _yrStreamed 真流式标记');
  assert.ok(/_yrEmit\(/.test(b), '年报分支缺少逐块推送 _yrEmit');
  assert.ok(/getReader\(\)/.test(b), '年报分支缺少 SSE reader(未逐块消费上游流)');
});

test('② 年报 MISS 不得复发「生成完再全量二次推流」(会导致前端全文复读)', () => {
  const b = yearlyBranch();
  assert.ok(!hasSecondBatchEmit(b),
    "年报分支复发旧结构 `const _chunks = _safeChunk(...)` 全量二次推流 —— 会与真流式叠加成全文复读");
});

test('③ 通道纪律: 年报重试链必须 DeepSeek#1 → DeepSeek#2 → Gemini(末位后备)', () => {
  const [i1, i2, ig] = channelOrder(yearlyBranch());
  assert.ok(i1 > 0 && i2 > i1 && ig > i2,
    `通道顺序违规: DeepSeek#1=${i1} DeepSeek#2=${i2} Gemini=${ig} —— 必须依次递增(Gemini 只做末位后备)`);
});

// 🛠️ V479: 缓存版本基线 —— 每次 bump 后同步上调, 不允许回退(回退=毒缓存复用)。
//   早先写死 `wealth:v4\d\d:` + strictEqual(v480) → 每次正常 bump 都假红一次(闸门成了绊脚石);
//   改为「同版本一致 + 不低于已发布基线」, 既守「输出链变更必须 bump」, 又不因 bump 假红。
const MIN_CACHE_VER = 492;

test('④ 缓存 key 统一且不低于已发布基线 v' + MIN_CACHE_VER + '(输出链变更必须 bump,防毒缓存复用)', () => {
  // ⚠️ 只取 `const cacheKey = `wealth:vNNN:`` 赋值形式: 裸 match v\d+ 会命中注释里提及的历史键
  //   (如 wealth:v356:) → 误判"版本不一致"。
  const vers = [...serverSrc.matchAll(/const\s+cacheKey\s*=\s*`wealth:v(\d+):/g)].map((m) => m[1]);
  assert.ok(vers.length >= 3, 'wealth 缓存 key 赋值点数量异常: ' + vers.length);
  const uniq = [...new Set(vers)];
  assert.strictEqual(uniq.length, 1, '缓存 key 版本不一致: ' + uniq.join(', '));
  assert.ok(Number(uniq[0]) >= MIN_CACHE_VER,
    `缓存 key 版本 v${uniq[0]} 低于已发布基线 v${MIN_CACHE_VER} —— 输出链变更后忘了 bump(会复用毒缓存)`);
});

// ═══════════════ 注入缺陷自测(证明闸门会红) ═══════════════
test('【注入缺陷自测】把 stream:true 改成 false → 判据① 必须红', () => {
  const degraded = yearlyBranch().replace(/stream:\s*true/, 'stream: false');
  assert.strictEqual(isTrueStream(degraded), false, '闸门失效: 假流式未被识别');
});

test('【注入缺陷自测】注回旧全量二次推流 → 判据② 必须红', () => {
  const degraded = yearlyBranch() + "\nconst _chunks = _safeChunk(_full || '', 500);\nfor (const _c of _chunks) { res.write(_c); }";
  assert.strictEqual(hasSecondBatchEmit(degraded), true, '闸门失效: 二次推流未被识别');
});

test('【注入缺陷自测】把 Gemini 提到 DeepSeek 之前 → 判据③ 必须红', () => {
  const degraded = yearlyBranch().replace('完整度体检 #2(DeepSeek高温)', '完整度体检 #3(Gemini后备)');
  const [i1, i2, ig] = channelOrder(degraded);
  assert.ok(!(i1 > 0 && i2 > i1 && ig > i2), '闸门失效: 通道顺序违规未被识别');
});

test('【注入缺陷自测】把缓存 key 退回旧版本(低于基线) → 判据④ 必须红', () => {
  const degraded = serverSrc.replace(/const\s+cacheKey\s*=\s*`wealth:v\d+:/, 'const cacheKey = `wealth:v480:');
  const vers = [...degraded.matchAll(/const\s+cacheKey\s*=\s*`wealth:v(\d+):/g)].map((m) => m[1]);
  const uniq = [...new Set(vers)];
  assert.ok(uniq.length !== 1 || Number(uniq[0]) < MIN_CACHE_VER,
    '闸门失效: 低于基线的缓存版本未被识别');
});
