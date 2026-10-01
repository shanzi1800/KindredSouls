/**
 * 🛡️ V490 时区校验与回退机制 · 闸门
 *
 * ── 病根（2026-10-01 实测）────────────────────────────────────────────────
 *   astro_matrix.py:_localize_dt() 对无效 IANA 时区**静默退 UTC** ⇒ 接口照常 200 success
 *   ⇒ **静默错盘**：`America/Agentina/Ushuaia`（拼写错）→ 上升点偏差 48.82°、
 *     上升星座 Leo→Gemini，用户与调用方双盲。
 *
 * ── 本闸门守护的契约 ─────────────────────────────────────────────────────
 *  ① Tier-1：合法 tz（任意大小写 / 官方别名）→ 解析为**规范 IANA 名**，且合法 tz 不被误改
 *  ② Tier-1b：真拼写错（Agentina→Argentina）→ 纠正
 *  ③ Tier-2：解析不出 + 有坐标 → 按 lat/lon 最近邻推定（复用 web/public/data/cities.json）
 *  ④ Tier-3：解析不出 + 无坐标 → **ok:false**（端点必须 HTTP 400，绝不静默 200）
 *  ⑤ 三端点（oracle / stream / v2）均接线；stream 的 400 **先于** SSE 管道建立
 *  ⑥ 缓存键版本 ≥505 且三处一致（毒缓存随版本作废）
 *  ⑦ v69_client：INVALID_TIMEZONE 必须**上抛传播**（绝不降级 Cancer / 返回 null）
 *  ⑧ astro_matrix：`_localize_dt` 哨兵化（无静默 UTC 兜底）+ CLI 退出码 3
 *
 * ⚠️ 判据纪律：读源码判据一律**剥注释**（防「注释里写了判据字面量」假红）；
 *   跨环境断言避免写死 ICU 规范名（不同 Node 版本 canonical 可能不同）。
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { resolveTimeZone, intlCanonical, DEFAULT_TZ } from '../src/tz-resolver.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const serverSrc = readFileSync(join(ROOT, 'server.js'), 'utf-8');
const v69Src = readFileSync(join(ROOT, 'v69_client.js'), 'utf-8');
const pySrc = readFileSync(join(ROOT, 'astro', 'astro_matrix.py'), 'utf-8');
const streamTestSrc = readFileSync(join(__dirname, 'audit-yearly-stream.test.js'), 'utf-8');

// ── 剥注释工具（防「注释里写了判据字面量」假红）────────────────────
const stripJsComments = (s) => s
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/.*$/gm, '');
const stripPyComments = (s) => s
  .replace(/"""[\s\S]*?"""/g, '')
  .replace(/'''[\s\S]*?'''/g, '')
  .replace(/^[ \t]*#.*$/gm, '');

const serverCode = stripJsComments(serverSrc);
const v69Code = stripJsComments(v69Src);
const pyCode = stripPyComments(pySrc);

// ── 12 组跨语言/边界样本（军师清单）──
const SAMPLES = [
  ['Europe/Oslo', 69.6492, 18.9553],
  ['Europe/London', 51.5074, -0.1278],
  ['America/Argentina/Ushuaia', -54.8067, -68.3030],
  ['Pacific/Pago_Pago', -14.2710, -170.7020],
  ['Africa/Sao_Tome', 0.0, 6.6131],
  ['Atlantic/Reykjavik', 64.1466, -21.9426],
  ['America/Guayaquil', -0.1807, -78.4678],
  ['Europe/Madrid', 40.4168, -3.7038],
  ['Asia/Bangkok', 13.7563, 100.5018],
  ['Asia/Kolkata', 28.6139, 77.2090],
  ['Pacific/Auckland', -36.8485, 174.7633],
  ['Asia/Kathmandu', 27.7172, 85.3240],
];

// ═══════════════════════ 一、解析层行为 ═══════════════════════
describe('V490 时区解析层（Tier-1/2/3）', () => {
  test('① Tier-1：12 样本合法 tz 全部解析成功，且**语义不被改变**', () => {
    for (const [tz, la, lo] of SAMPLES) {
      const r = resolveTimeZone(tz, la, lo);
      assert.strictEqual(r.ok, true, `${tz} 应解析成功`);
      assert.strictEqual(r.tier, 1, `${tz} 应为 Tier-1（不该掉到坐标推定）`);
      // 关键：解析结果必须与 Intl canonical 一致（不得被 typo 表误改，如 Madrid→其它）
      assert.strictEqual(r.tz, intlCanonical(tz), `${tz} 被误改为 ${r.tz}`);
      assert.strictEqual(r.corrected, r.tz !== tz, `${tz} corrected 标记与事实不符`);
    }
  });

  test('② Tier-1b：真拼写错被纠正（Agentina → Argentina）', () => {
    const r = resolveTimeZone('America/Agentina/Ushuaia', -54.8067, -68.3030);
    assert.strictEqual(r.ok, true);
    assert.strictEqual(r.tier, 1);
    assert.strictEqual(r.reason, 'typo-corrected');
    assert.match(r.tz, /Argentina/, `typо 纠正后应含 Argentina, 实得 ${r.tz}`);
    assert.strictEqual(r.input, 'America/Agentina/Ushuaia', 'input 应保留原始串（供日志/审计）');
  });

  test('②b 大小写与官方别名由 Intl 归一（跨环境稳健断言）', () => {
    for (const alias of ['US/Pacific', 'asia/kolkata', 'AMERICA/NEW_YORK', 'GMT']) {
      const r = resolveTimeZone(alias, 40.0, -74.0);
      assert.strictEqual(r.ok, true, `${alias} 应解析成功`);
      assert.strictEqual(r.tier, 1);
      assert.ok(intlCanonical(r.tz), `归一结果 ${r.tz} 必须仍是合法 tz`);
      assert.notStrictEqual(r.tz, alias, `${alias} 应被归一（不应原样返回）`);
    }
  });

  test('③ Tier-2：无效应答 + 有效坐标 → 按 lat/lon 最近邻推定', () => {
    const cases = [
      ['Not/AZone', 13.7563, 100.5018, 'Asia/Bangkok'],
      ['Bangkok', 13.7563, 100.5018, 'Asia/Bangkok'],   // 裸城市名
      ['Xyz/Abc', -36.8485, 174.7633, 'Pacific/Auckland'],
      ['Foo/Bar', 40.4168, -3.7038, 'Europe/Madrid'],
    ];
    for (const [bad, la, lo, expect] of cases) {
      const r = resolveTimeZone(bad, la, lo);
      assert.strictEqual(r.ok, true, `${bad} 应被坐标推定救回`);
      assert.strictEqual(r.tier, 2, `${bad} 应为 Tier-2`);
      assert.strictEqual(r.tz, expect, `${bad} 推定 tz 应为 ${expect}, 实得 ${r.tz}`);
      assert.ok(r.distanceKm >= 0 && r.distanceKm < 100, `${bad} 推定距离异常: ${r.distanceKm}km`);
      assert.ok(intlCanonical(r.tz), `推定结果 ${r.tz} 必须是合法 tz`);
    }
  });

  test('④ Tier-3：无法解析 + 无坐标 → ok:false（调用方必须 400）', () => {
    for (const [bad, la, lo] of [
      ['Not/AZone', NaN, NaN],
      ['Not/AZone', undefined, undefined],
      ['Totally Made Up', null, null],
      ['Totally Made Up', Infinity, -Infinity],
      ['Totally Made Up', '', ''],          // '' 坐标必须视同「没给」（Number('')===0 陷阱）
    ]) {
      const r = resolveTimeZone(bad, la, lo);
      assert.strictEqual(r.ok, false, `${JSON.stringify(bad)} 必须解析失败（拒绝静默假绿）`);
      assert.strictEqual(r.tier, 3);
      assert.strictEqual(r.tz, null);
    }
  });

  test('④b 灵敏度对照：同一判据在合法/非法输入上必须给出不同结果', () => {
    const good = resolveTimeZone('Asia/Bangkok', 13.75, 100.5);
    const bad = resolveTimeZone('Not/AZone', NaN, NaN);
    assert.notStrictEqual(good.ok, bad.ok, '判据对合法/非法输入无区分力 ⇒ 判据失效');
  });

  test('⑤ Tier-0：空值/缺省 → 默认 Asia/Bangkok（保持历史行为，不算错误）', () => {
    for (const v of [null, undefined, '', '   ']) {
      const r = resolveTimeZone(v, 1, 2);
      assert.strictEqual(r.ok, true, `${JSON.stringify(v)} 应走默认而非 400`);
      assert.strictEqual(r.tier, 0);
      assert.strictEqual(r.tz, DEFAULT_TZ);
    }
  });

  test('⑥ 幂等：解析结果再解析一次必须稳定（缓存键不漂移）', () => {
    for (const [tz] of SAMPLES) {
      const once = resolveTimeZone(tz, 0, 0);
      const twice = resolveTimeZone(once.tz, 0, 0);
      assert.strictEqual(twice.tz, once.tz, `${tz} 二次解析发生漂移: ${once.tz} → ${twice.tz}`);
      assert.strictEqual(twice.tier, 1);
    }
  });
});

// ═══════════════════════ 二、源码契约 ═══════════════════════
describe('V490 源码契约（server.js / v69_client.js / astro_matrix.py）', () => {
  test('⑦ 三端点均接线 resolveTimeZone 且 Tier-3 返回 HTTP 400 + code', () => {
    assert.match(serverCode, /import\s*\{\s*resolveTimeZone\s*\}\s*from\s*'\.\/src\/tz-resolver\.js'/,
      'server.js 未 import resolveTimeZone');
    const calls = (serverCode.match(/resolveTimeZone\(/g) || []).length;
    assert.ok(calls >= 4, `resolveTimeZone 调用点应 ≥4（oracle/stream/v2/clear-cache），实得 ${calls}`);
    const code400 = (serverCode.match(/code:\s*'INVALID_TIMEZONE'/g) || []).length;
    assert.ok(code400 >= 3, `三端点均需 code:'INVALID_TIMEZONE'，实得 ${code400}`);
    const status400 = (serverCode.match(/res\.status\(400\)\.json\(\{\s*success:\s*false,\s*code:\s*'INVALID_TIMEZONE'/g) || []).length;
    assert.ok(status400 >= 3, `三端点均需 res.status(400)+code，实得 ${status400}`);
  });

  test('⑦b stream 端点的 400 必须**先于** SSE 管道建立（否则前端看到 200 里塞错误）', () => {
    const i = serverCode.indexOf("app.post('/api/wealth-oracle/stream'");
    const j = serverCode.indexOf("app.post('/api/wealth-oracle/v2'");
    assert.ok(i > 0 && j > i, '未定位到 stream / v2 端点');
    const body = serverCode.slice(i, j);
    const iTz = body.indexOf("code: 'INVALID_TIMEZONE'");
    const iFlush = body.indexOf('flushHeaders');
    assert.ok(iTz > 0, 'stream 端点缺少 INVALID_TIMEZONE 分支');
    assert.ok(iFlush > 0, 'stream 端点缺少 flushHeaders（SSE 握手）');
    assert.ok(iTz < iFlush, `stream 的 400 分支(${iTz}) 必须在 flushHeaders(${iFlush}) 之前`);
  });

  test('⑧ 缓存键版本 ≥505 且三处一致（毒缓存随版本作废）', () => {
    const vers = [...serverCode.matchAll(/const\s+cacheKey\s*=\s*`wealth:v(\d+):/g)].map((m) => +m[1]);
    assert.ok(vers.length >= 3, `wealth 缓存键赋值点应 ≥3，实得 ${vers.length}`);
    const uniq = [...new Set(vers)];
    assert.strictEqual(uniq.length, 1, `缓存键版本不一致: ${uniq.join(', ')}`);
    const minv = +/MIN_CACHE_VER\s*=\s*(\d+)/.exec(streamTestSrc)[1];
    assert.ok(uniq[0] >= 505, `V490 输出链变更必须 bump ≥505，实得 v${uniq[0]}`);
    assert.strictEqual(uniq[0], minv, `server.js v${uniq[0]} 与闸门基线 MIN_CACHE_VER=${minv} 不一致`);
  });

  test('⑨ v69_client：INVALID_TIMEZONE 必须上抛传播（绝不降级 Cancer / 返回 null）', () => {
    assert.match(v69Code, /code\s*=\s*'INVALID_TIMEZONE'/, 'v69_client 未定义 INVALID_TIMEZONE 错误码');
    assert.match(v69Code, /_isInvalidTzError/, 'v69_client 缺少时区错误识别函数');
    // natal 降级路径前必须先判时区
    // ⚠️ 容忍**行内** `//` 注释（本闸门只剥行首注释；行内注释若一并剥会误伤字符串里的 `//`）
    assert.match(v69Code, /if\s*\(_isInvalidTzError\(e\)\)\s*throw\s*_invalidTzError\(tz,\s*e\);\s*(?:\/\/[^\n]*)?\n\s*console\.warn\('\[V134\] Natal computation failed/,
      'natal catch 未在降级 Cancer 之前判时区');
    // getAstroMatrix 不得把时区错误吞成 null
    assert.match(v69Code, /if\s*\(e\s*&&\s*e\.code\s*===\s*'INVALID_TIMEZONE'\)\s*throw\s*e;/,
      'getAstroMatrix catch 未上抛 INVALID_TIMEZONE');
  });

  test('⑩ astro_matrix：_localize_dt 哨兵化（无静默 UTC/Bangkok 兜底）+ CLI 退出码 3', () => {
    assert.match(pyCode, /class\s+InvalidTimeZoneError/, '缺少 InvalidTimeZoneError');
    const body = pyFuncBody(pyCode, '_localize_dt');
    assert.ok(body, '未定位到 _localize_dt 函数体');
    assert.match(body, /raise\s+InvalidTimeZoneError/, '_localize_dt 未抛 InvalidTimeZoneError');
    assert.ok(!/Asia\/Bangkok'\s*\)\s*\.localize/.test(body),
      '_localize_dt 仍含静默退 Bangkok 的兜底（必须删除）');
    assert.ok(!/_dt_timezone\.utc/.test(body),
      '_localize_dt 仍含静默退 UTC 的兜底（必须删除）');
    assert.match(pyCode, /except\s+InvalidTimeZoneError:\s*\n\s*(?:#[^\n]*\n\s*)?raise/,
      '缺少 InvalidTimeZoneError 前置上抛（会被宽 except 吞掉）');
    assert.match(pyCode, /sys\.exit\(3\)/, 'CLI 缺少专用退出码 3');
  });
});

/** 取 Python 顶层函数体（从 def 到下一个顶层 def/class/__main__） */
function pyFuncBody(src, name) {
  const i = src.indexOf(`def ${name}(`);
  if (i < 0) return '';
  const rest = src.slice(i + 1);
  const m = rest.match(/\n(?:def |class |if __name__)/);
  return m ? rest.slice(0, m.index) : rest;
}

// ═══════════════════════ 三、Python CLI 行为 ═══════════════════════
describe('V490 Python 引擎行为（spawn 真跑）', () => {
  const PY = join(ROOT, 'astro', 'astro_matrix.py');
  // ⚠️ 本项目的最高频假红源：系统 python3 无 swisseph ⇒ 引擎加载即崩。
  //   跑测试前需把 PATH 指向含 swisseph 的环境（.workbuddy/binaries/python/envs/default/bin）。
  //   此处**显式探测并 skip**（而非让闸门产出无法归因的噪声红）。
  const SWE_OK = spawnSync('python3', ['-c', 'import swisseph'], { cwd: ROOT }).status === 0;
  const skipSwe = SWE_OK ? false : 'swisseph 不可用（需 export PATH 至含 swisseph 的 python 环境）';
  const run = (tz) => spawnSync('python3', [
    PY, '--mode', 'natal', '--birth-date', '1999-09-09', '--birth-time', '09:09',
    '--lat', '13.7563', '--lon', '100.5018', '--tz', tz,
  ], { encoding: 'utf-8', cwd: ROOT });

  test('⑪ 有效 tz → 退出码 0 且出盘（防回归）', { skip: skipSwe }, () => {
    const r = run('Asia/Bangkok');
    assert.strictEqual(r.status, 0, `退出码应为 0，实得 ${r.status}; stderr=${(r.stderr || '').slice(0, 200)}`);
    const out = JSON.parse(r.stdout);
    assert.ok(out.rising_sign, '应输出 rising_sign');
  });

  test('⑫ 无效 tz → 退出码 3 + stderr 含 INVALID_TIMEZONE（绝不返回假盘）', { skip: skipSwe }, () => {
    const r = run('America/Agentina/Ushuaia');
    assert.strictEqual(r.status, 3, `退出码应为 3，实得 ${r.status}`);
    assert.match(r.stderr || '', /INVALID_TIMEZONE/, 'stderr 应含 INVALID_TIMEZONE 标识');
    assert.ok(!/"rising_sign"/.test(r.stdout || ''), '无效 tz 绝不允许仍输出星盘（假绿）');
  });

  test('⑫b 集成：getAstroMatrix 对无效 tz 抛 code=INVALID_TIMEZONE（绝不 return null / 降级 Cancer）', { skip: skipSwe }, async () => {
    const { getAstroMatrix } = await import('../v69_client.js');
    await assert.rejects(
      () => getAstroMatrix('1999-09-09', '09:09', 13.7563, 100.5018, 'America/Agentina/Ushuaia'),
      (e) => e && e.code === 'INVALID_TIMEZONE',
      '若返回 null 或降级 Cancer rising，端点会静默出盘（V490 要消灭的正是这个）',
    );
  });
});

// ═══════════ 四、端到端：真启动 server 打三个端点 ═══════════
describe('V490 端到端（live server，Tier-3 在 LLM 之前返回故无副作用）', () => {
  test('⑬ 三端点在「无效 tz + 无坐标」时返回 HTTP 400 + code（绝不 200 假绿）', async () => {
    const PORT = 39877;
    const proc = spawn(process.execPath, ['server.js'], {
      cwd: ROOT,
      env: { ...process.env, PORT: String(PORT), HOST: '127.0.0.1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '';
    proc.stdout.on('data', (d) => { out += d; });
    const ready = await new Promise((res) => {
      const hard = setTimeout(() => res(false), 25000);
      const iv = setInterval(() => {
        if (out.includes('Railway server running on port')) { clearInterval(iv); clearTimeout(hard); res(true); }
      }, 150);
      proc.on('exit', () => { clearInterval(iv); clearTimeout(hard); res(false); });
    });
    try {
      assert.ok(ready, 'server.js 未能在 25s 内监听（无法做端到端验证）');
      const post = (p, body) => fetch(`http://127.0.0.1:${PORT}${p}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const BAD = { birthDate: '1999-09-09', birthTime: '09:09', lat: null, lon: null, tz: 'Totally/MadeUp', lang: 'zh' };
      for (const p of ['/api/wealth-oracle', '/api/wealth-oracle/stream', '/api/wealth-oracle/v2']) {
        const r = await post(p, BAD);
        assert.strictEqual(r.status, 400, `${p} 应对无效时区返回 HTTP 400，实得 ${r.status}`);
        const j = await r.json().catch(() => ({}));
        assert.strictEqual(j.code, 'INVALID_TIMEZONE', `${p} 响应应含 code=INVALID_TIMEZONE，实得 ${JSON.stringify(j)}`);
      }
      // 灵敏度对照：同样是 400，但「缺 birthDate」的 400 语义必须不同（证明 400 不是无差别返回）
      const r2 = await post('/api/wealth-oracle', { tz: 'Totally/MadeUp', lat: null, lon: null });
      assert.strictEqual(r2.status, 400);
      const j2 = await r2.json();
      assert.notStrictEqual(j2.code, 'INVALID_TIMEZONE',
        '缺 birthDate 的 400 被误报为 INVALID_TIMEZONE ⇒ 判据无区分力');
      assert.match(String(j2.error || ''), /birthDate/, `缺 birthDate 的 400 应说明 birthDate，实得 ${JSON.stringify(j2)}`);
    } finally {
      try { proc.kill('SIGKILL'); } catch { /* noop */ }
    }
  });
});

// ═══════════════ 五、注入缺陷自测（证明闸门真的会红）═══════════════
describe('V490 注入缺陷自测', () => {
  test('【注入自测】server.js 把 400 改成 200 → 判据⑦ 必须红', () => {
    const degraded = serverCode.replace(
      /res\.status\(400\)\.json\(\{\s*success:\s*false,\s*code:\s*'INVALID_TIMEZONE'/g,
      "res.status(200).json({ success: false, code: 'INVALID_TIMEZONE'");
    assert.notStrictEqual(degraded, serverCode, '注入未生效（未匹配到 400 分支）');
    const status400 = (degraded.match(/res\.status\(400\)\.json\(\{\s*success:\s*false,\s*code:\s*'INVALID_TIMEZONE'/g) || []).length;
    assert.ok(status400 < 3, '闸门失效: 200 假绿未被识别');
  });

  test('【注入自测】stream 的 400 挪到 flushHeaders 之后 → 判据⑦b 必须红', () => {
    const i = serverCode.indexOf("app.post('/api/wealth-oracle/stream'");
    const j = serverCode.indexOf("app.post('/api/wealth-oracle/v2'");
    const body = serverCode.slice(i, j);
    const iTz = body.indexOf("code: 'INVALID_TIMEZONE'");
    const iFlush = body.indexOf('flushHeaders');
    // 人为构造「400 在 flush 之后」的等价判定
    const movedAfter = iTz > iFlush;   // 真实源码应为 false
    assert.strictEqual(movedAfter, false, '真实源码中 400 应在 flushHeaders 之前');
    // 反向：若把 flushHeaders 提到最前，判定必须翻转
    const faked = body.replace('flushHeaders', 'FLUSH_MARK').replace('FLUSH_MARK', ''); // 摘掉首处 flushHeaders
    const iFlush2 = faked.indexOf('flushHeaders');
    assert.ok(iFlush2 > iTz, '闸门失效: 摘掉首个 flushHeaders 后位置关系未变化');
  });

  test('【注入自测】缓存键退回 v504 → 判据⑧ 必须红', () => {
    const degraded = serverCode.replace(/`wealth:v\d+:/, '`wealth:v504:');
    const vers = [...degraded.matchAll(/const\s+cacheKey\s*=\s*`wealth:v(\d+):/g)].map((m) => +m[1]);
    const uniq = [...new Set(vers)];
    assert.ok(uniq[0] < 505, `闸门失效: 低于基线的 v${uniq[0]} 未被识别`);
  });

  test('【注入自测】v69_client 去掉 INVALID_TIMEZONE 上抛 → 判据⑨ 必须红', () => {
    const degraded = v69Code.replace(/if\s*\(e\s*&&\s*e\.code\s*===\s*'INVALID_TIMEZONE'\)\s*throw\s*e;/, '');
    assert.notStrictEqual(degraded, v69Code, '注入未生效');
    assert.ok(!/if\s*\(e\s*&&\s*e\.code\s*===\s*'INVALID_TIMEZONE'\)\s*throw\s*e;/.test(degraded),
      '闸门失效: 上抛被移除后仍未识别');
  });

  test('【注入自测】astro_matrix 注回静默 UTC 兜底 → 判据⑩ 必须红', () => {
    const body = pyFuncBody(pyCode, '_localize_dt');
    const degradedBody = body.replace(/raise InvalidTimeZoneError\([^\n]*\n/, 'return dt_naive.replace(tzinfo=_dt_timezone.utc)\n');
    assert.notStrictEqual(degradedBody, body, '注入未生效');
    const stillSilent = /_dt_timezone\.utc/.test(degradedBody);
    assert.ok(stillSilent, '闸门失效: 注回静默 UTC 兜底后未被识别');
  });

  test('【注入自测】astro_matrix 去掉 CLI 退出码 3 → 判据⑩ 必须红', () => {
    const degraded = pyCode.replace(/sys\.exit\(3\)/, 'sys.exit(0)');
    assert.ok(!/sys\.exit\(3\)/.test(degraded), '闸门失效: 退出码 3 被移除后仍未识别');
  });
});
