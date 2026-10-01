// ═══════════════════════════════════════════════════════════════════════
// 🛡️ V483d: safeFetch 必须为带 body 的请求显式设 Content-Length
//
// 事故(2026-09-30 线上实证):
//   `[wealth-stream] [WRITE] Cache write: ..., status=400` 且缓存表恒空
//   → HIT 路径(V483c 已修好)永远无缓存可命中, 每次请求都 MISS 重生成。
//
// 根因: safeFetch 只 `req.write(bodyBuf); req.end()` 且不给 Content-Length
//   → Node 自动改用 `Transfer-Encoding: chunked`
//   → Supabase 网关对 chunked POST 一律 `400 PGRST102 "Empty or invalid json"`。
//   四象限 curl 复现(2026-09-30): 小/大 body × Content-Length=201 × chunked=400,
//   与 body 大小、内容、字符集全部无关。
//
// 闸门策略(零外部依赖): 用假 https 模块捕获 safeFetch 交给 https.request 的 headers,
//   在 vm 沙箱里实跑, 断言 Content-Length 精确等于 body 字节长、且无 Transfer-Encoding。
// ═══════════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { indexDecls, closureDecls } from './tools/extract_decls.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf-8');

// ── 假 https: 捕获 options.headers, 并同步喂一个 200 响应 ──
function makeFakeHttps(captured) {
  return {
    request(opts, cb) {
      captured.push(opts);
      const res = {
        statusCode: 200,
        headers: { 'content-type': 'application/json' },
        on(ev, fn) {
          if (ev === 'data') setImmediate(() => fn(Buffer.from('[{"ok":1}]')));
          if (ev === 'end') setImmediate(() => fn());
          return res;
        },
        once(ev, fn) { return res.on(ev, fn); },
      };
      const req = {
        on() { return req; },
        write() { return true; },
        end() { setImmediate(() => cb(res)); },
        destroy() {},
      };
      return req;
    },
  };
}

// 抽取 safeFetch(连其依赖 sanitizeLatin1 等)到 vm 沙箱实跑
function loadSafeFetch(source = src) {
  const { map } = closureDecls(source, ['safeFetch'], ['https']);
  const ctx = { console, Buffer, URL, https: makeFakeHttps(loadSafeFetch._captured = []), __exports: {} };
  vm.createContext(ctx);
  vm.runInContext([...map.values()].join('\n\n') + '\n__exports.f = typeof safeFetch !== "undefined" ? safeFetch : undefined;', ctx);
  return ctx.__exports.f;
}

// 拿到交给 https.request 的 headers(小写化视图, 兼容 Node 的出站头不区分大小写)
async function captureHeaders(f, url, options) {
  const p = await f(url, options);
  await p.json().catch(() => {});
  const opts = loadSafeFetch._captured[loadSafeFetch._captured.length - 1];
  const lower = {};
  for (const [k, v] of Object.entries(opts.headers || {})) lower[k.toLowerCase()] = String(v);
  return { opts, lower };
}

// ── ① 源码级: safeFetch 体内必须有 Content-Length 显式赋值 + 大小写变体清理 ──
test('① safeFetch 源码必须含 Content-Length 显式赋值 + 旧值清理循环', () => {
  const code = indexDecls(src).get('safeFetch');
  assert.ok(code, '未找到 safeFetch');
  assert.ok(/cleanHeaders\['Content-Length'\]\s*=\s*String\(bodyBuf\.length\)/.test(code),
    'safeFetch 未显式设 Content-Length → Node 走 chunked → Supabase 400 PGRST102');
  assert.ok(/toLowerCase\(\)/.test(code) && /===\s*'content-length'/.test(code) && /===\s*'transfer-encoding'/.test(code),
    '缺少大小写变体清理 → 调用方传小写 content-length 时会出现重复头');
});

// ── ② 行为级: POST 有 body → Content-Length 必须精确等于字节长, 且不得有 Transfer-Encoding ──
test('② POST 带 body: Content-Length 精确(多字节 CJK 按 UTF-8 字节数), 无 Transfer-Encoding', () => {
  const f = loadSafeFetch();
  const body = JSON.stringify({ cache_key: 'x', insight: '星盘真值占星——多字节文本', n: 1 });
  return captureHeaders(f, 'https://example.supabase.co/rest/v1/ai_insights_cache', {
    method: 'POST',
    headers: { 'apikey': 'k', 'Authorization': 'Bearer k', 'Content-Type': 'application/json' },
    body,
  }).then(({ lower }) => {
    assert.strictEqual(lower['content-length'], String(Buffer.byteLength(body)),
      `Content-Length 应为 ${Buffer.byteLength(body)}, 实得 ${lower['content-length']}`);
    assert.ok(!('transfer-encoding' in lower), `不得出现 Transfer-Encoding(实得 ${lower['transfer-encoding']}) → 会被 Supabase 网关 400`);
  });
});

// ── ③ 行为级: 调用方自带小写 content-length 也不得产生重复/冲突头 ──
test('③ 调用方自带小写 content-length: 归一为唯一正确值, 不出现重复头', () => {
  const f = loadSafeFetch();
  const body = '{"a":1}';
  return captureHeaders(f, 'https://example.supabase.co/rest/v1/t', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'content-length': '999', 'Transfer-Encoding': 'chunked' },
    body,
  }).then(({ opts, lower }) => {
    const cls = Object.keys(opts.headers).filter((k) => k.toLowerCase() === 'content-length');
    assert.strictEqual(cls.length, 1, `Content-Length 头出现 ${cls.length} 个: ${cls}`);
    assert.strictEqual(lower['content-length'], String(Buffer.byteLength(body)),
      '应覆盖为真实字节长, 而非保留调用方的错误值');
    assert.ok(!('transfer-encoding' in lower), '显式 Content-Length 下不得残留 Transfer-Encoding');
  });
});

// ── ④ 行为级: GET(无 body)不得凭空带 Content-Length ──
test('④ GET 无 body: 不得凭空添加 Content-Length', () => {
  const f = loadSafeFetch();
  return captureHeaders(f, 'https://example.supabase.co/rest/v1/t?select=count', {
    headers: { 'apikey': 'k', 'Authorization': 'Bearer k' },
  }).then(({ lower }) => {
    assert.ok(!('content-length' in lower), 'GET 不应带 Content-Length');
    assert.ok(!('transfer-encoding' in lower), 'GET 不应带 Transfer-Encoding');
  });
});

// ═══════════════ 注入缺陷自测(证明闸门会红) ═══════════════
test('【注入缺陷自测】拆掉 Content-Length 赋值行 → ①② 必须红', () => {
  const degraded = src.replace(
    "      cleanHeaders['Content-Length'] = String(bodyBuf.length);",
    '      // degraded: Content-Length 赋值被拆掉',
  );
  assert.notStrictEqual(degraded, src, '未成功注入缺陷(未匹配到赋值行)');
  // ① 源码级
  assert.ok(!/cleanHeaders\['Content-Length'\]\s*=\s*String\(bodyBuf\.length\)/.test(indexDecls(degraded).get('safeFetch')),
    '闸门失效: 赋值行被拆后源码级判据仍绿(① 未红)');
  // ② 行为级: 退化后 headers 不再含 Content-Length → ② 的断言必炸
  const f = loadSafeFetch(degraded);
  const body = '{"a":1}';
  return captureHeaders(f, 'https://example.supabase.co/rest/v1/t', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body,
  }).then(({ lower }) => {
    assert.ok(!('content-length' in lower) || lower['content-length'] !== String(Buffer.byteLength(body)),
      '闸门失效: 退化后 ② 的行为断言仍绿(② 未红)');
    void body;
  });
});
