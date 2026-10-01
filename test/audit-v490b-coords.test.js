/**
 * 🛡️ V490b 坐标强校验 · 闸门
 *
 * ── 病根（2026-10-01 实测，与 V490「静默退 UTC」同构）─────────────────────
 *   `v69_client.js` 以 `String(lat)` 拼命令行，Python `--lat` 为 `type=float` 且**无范围校验**：
 *     · `lat=null` → `float("null")` 失败 ⇒ argparse **退出码 2**（≠ V490 的 3）
 *                    ⇒ JS catch 不认 ⇒ `Falling back to Cancer rising` ⇒ **伪造巨蟹座上升出盘**
 *     · `lat=91`   → 照常算盘并返回 **200**：实测 `{"lat":91.0,"rising_sign":"Virgo","ascendant_deg":178.68}`
 *   两者都是「输入非法 → 输出照常假绿」，与 V490 立项时消灭的缺陷同类。
 *
 * ── 本闸门守护的契约 ─────────────────────────────────────────────────────
 *  ① Tier-0：lat/lon **都未提供** → 默认 13.75/100.5（保持历史 API 契约，不算错误）
 *  ② Tier-1：数值 / 数字字符串（负数、小数、空白包裹）→ 归一为数值
 *  ③ 🔴 洗白防线：`null` / `true` / `[]` / `{}` / `''` **一律拒绝**
 *     —— `Number(null)===0`、`Number(true)===1`、`Number([])===0` 会把「没给值」洗成
 *        「坐标在 (0°,0°)」= 合法坐标（V490 已踩过一次，此处前置堵死）
 *  ④ Tier-2：范围闭区间 lat∈[-90,90]、lon∈[-180,180]；越界（含 ±0.0001）拒绝
 *  ⑤ 只给一侧 → `missing_partner` 拒绝（绝不拿默认值悄悄补另一半）
 *  ⑥ 三端点（oracle / stream / v2）均接线；stream/v2 的 400 **先于** SSE 管道建立
 *  ⑦ 缓存键改由**已校验数值**派生（消灭 `Number(lat || 13.75)` 洗白惯用法）
 *  ⑧ v69_client：INVALID_COORDINATES 必须**上抛传播**（绝不降级 Cancer / 返回 null）
 *  ⑨ astro_matrix：`validate_coordinates` 哨兵 + CLI **退出码 4**（与 tz 的 3 区分）
 *
 * ⚠️ 判据纪律：读源码判据一律**剥注释**（防「注释里写了判据字面量」假红）；
 *   每类源码判据均配**注入自测**（证明拿掉真源码后闸门真的会红）；
 *   端到端保留「同是 400、语义必须可区分」的对照（防无差别 400）。
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { resolveCoordinates, DEFAULT_LAT, DEFAULT_LON, COORD_RANGE } from '../src/coord-validator.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const serverSrc = readFileSync(join(ROOT, 'server.js'), 'utf-8');
const v69Src = readFileSync(join(ROOT, 'v69_client.js'), 'utf-8');
const pySrc = readFileSync(join(ROOT, 'astro', 'astro_matrix.py'), 'utf-8');
const streamTestSrc = readFileSync(join(__dirname, 'audit-yearly-stream.test.js'), 'utf-8');
const coordSrc = readFileSync(join(ROOT, 'src', 'coord-validator.js'), 'utf-8');

// ── 剥注释（防「注释里写了判据字面量」假红）────────────────────────
const stripJs = (s) => s
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/.*$/gm, '');
const stripPy = (s) => s
  .replace(/"""[\s\S]*?"""/g, '')
  .replace(/'''[\s\S]*?'''/g, '')
  .replace(/^[ \t]*#.*$/gm, '');

const serverCode = stripJs(serverSrc);
const v69Code = stripJs(v69Src);
const pyCode = stripPy(pySrc);
const coordCode = stripJs(coordSrc);

/** 数 Python 入口函数体内的坐标哨兵调用（`lat, lon = validate_coordinates(...)`），与 def / CLI 解析处区分 */
const entryCalls = (src) => (src.match(/^\s*lat,\s*lon\s*=\s*validate_coordinates\(/gm) || []).length;

/** 取某端点的源码片段（到下一个 app.post 为止），供"400 早于 SSE header"类断言使用 */
function endpointSlice(src, path) {
  const i = src.indexOf(`app.post('${path}'`);
  assert.ok(i >= 0, `未找到端点 ${path}`);
  const j = src.indexOf('app.post(', i + 10);
  return src.slice(i, j > 0 ? j : src.length);
}

// ═══════════════ 一、解析层行为（真实调用，不写死业务常量）═══════════════
describe('V490b 坐标解析层行为', () => {
  test('① Tier-0：两者都未提供 → 默认坐标（不算错误，保持历史契约）', () => {
    const r = resolveCoordinates(undefined, undefined);
    assert.strictEqual(r.ok, true);
    assert.strictEqual(r.lat, DEFAULT_LAT);
    assert.strictEqual(r.lon, DEFAULT_LON);
    assert.strictEqual(r.tier, 'default');
  });

  test('② Tier-1：数值 / 数字字符串 / 负数 / 空白包裹 → 归一为数值', () => {
    for (const [a, b, eLat, eLon] of [
      [13.7563, 100.5018, 13.7563, 100.5018],
      ['13.7563', '100.5018', 13.7563, 100.5018],
      [-54.8067, -68.303, -54.8067, -68.303],
      [' 28.6139 ', '77.2090', 28.6139, 77.2090],
      [0, 0, 0, 0],
    ]) {
      const r = resolveCoordinates(a, b);
      assert.strictEqual(r.ok, true, `${JSON.stringify(a)}/${JSON.stringify(b)} 应通过`);
      assert.strictEqual(r.lat, eLat);
      assert.strictEqual(r.lon, eLon);
    }
  });

  test('③ 🔴 洗白防线：null/true/false/[]/[5]/{}/"" 一律拒绝（Number() 不可洗白）', () => {
    for (const v of [null, true, false, [], [5], {}, '']) {
      const rl = resolveCoordinates(v, 100);
      assert.strictEqual(rl.ok, false, `lat=${JSON.stringify(v)} 必须拒绝（否则被 Number() 洗成合法坐标）`);
      assert.strictEqual(rl.code, 'INVALID_COORDINATES');
      const rn = resolveCoordinates(13.7, v);
      assert.strictEqual(rn.ok, false, `lon=${JSON.stringify(v)} 必须拒绝`);
    }
  });

  test('④ Tier-2：范围闭区间（±90 / ±180 通过；越界 0.0001 亦拒绝）', () => {
    const [latLo, latHi] = COORD_RANGE.lat;
    const [lonLo, lonHi] = COORD_RANGE.lon;
    for (const [a, b, expect] of [
      [latHi, lonHi, true], [latLo, lonLo, true],
      [latHi + 0.0001, 0, false], [latLo - 0.0001, 0, false],
      [0, lonHi + 0.0001, false], [0, lonLo - 0.0001, false],
      [91, 100.5, false], [13.75, 181, false],
    ]) {
      const r = resolveCoordinates(a, b);
      assert.strictEqual(r.ok, expect, `lat=${a} lon=${b} 期望${expect ? '通过' : '拒绝'}`);
      if (!expect) assert.strictEqual(r.reason, 'out_of_range');
    }
  });

  test('⑤ 只给一侧 → missing_partner（绝不悄悄补默认值造出"半真半假"坐标）', () => {
    for (const [a, b] of [[13.75, undefined], [undefined, 100.5]]) {
      const r = resolveCoordinates(a, b);
      assert.strictEqual(r.ok, false);
      assert.strictEqual(r.reason, 'missing_partner');
    }
  });

  test('⑥ 其它非法形态（"null"/"abc"/"NaN"/Infinity/NaN/空格）一律拒绝', () => {
    for (const v of ['null', 'abc', 'NaN', 'Infinity', '-Infinity', NaN, Infinity, ' ']) {
      assert.strictEqual(resolveCoordinates(v, 100).ok, false, `lat=${JSON.stringify(v)} 应拒绝`);
    }
  });

  test('⑦ 默认坐标落在合法范围内（默认值本身不得越界）', () => {
    assert.ok(DEFAULT_LAT >= COORD_RANGE.lat[0] && DEFAULT_LAT <= COORD_RANGE.lat[1]);
    assert.ok(DEFAULT_LON >= COORD_RANGE.lon[0] && DEFAULT_LON <= COORD_RANGE.lon[1]);
  });
});

// ═══════════════ 二、源码契约（server.js / v69_client.js / astro_matrix.py）═══════════════
describe('V490b 源码契约', () => {
  test('⑧ server.js 引入 coord-validator 的三端点均调用 resolveCoordinates（≥3 处）', () => {
    assert.match(serverCode, /import\s*\{[^}]*resolveCoordinates[^}]*\}\s*from\s*'\.\/src\/coord-validator\.js'/,
      'server.js 未引入 coord-validator');
    const n = (serverCode.match(/resolveCoordinates\(/g) || []).length;
    assert.ok(n >= 3, `三端点应各调用一次 resolveCoordinates，实得 ${n} 处`);
  });

  test('⑨ 三端点均在非法坐标时返回 400 + INVALID_COORDINATES（≥3 处）', () => {
    const n = (serverCode.match(/invalidCoordinatesBody\(/g) || []).length;
    assert.ok(n >= 3, `三端点应各返回一次坐标错误体，实得 ${n} 处`);
    assert.match(coordCode, /code:\s*'INVALID_COORDINATES'/, '错误体缺少 code=INVALID_COORDINATES');
    assert.ok(!/status\(200\)[\s\S]{0,80}INVALID_COORDINATES/.test(serverCode), '坐标错误不得以 200 返回（假绿）');
  });

  test('⑩ stream / v2 的坐标 400 必须**先于** SSE header 建立', () => {
    for (const p of ['/api/wealth-oracle/stream', '/api/wealth-oracle/v2']) {
      const seg = endpointSlice(serverCode, p);
      const iCoord = seg.indexOf('resolveCoordinates(');
      // ⚠️ v2 不调 flushHeaders（它直接 setHeader + 首帧 send）⇒ 统一用 setHeader('Content-Type','text/event-stream') 作"SSE 已建立"标记
      const iHdr = seg.indexOf("setHeader('Content-Type', 'text/event-stream");
      assert.ok(iCoord > 0, `${p} 未接线坐标校验`);
      assert.ok(iHdr > 0, `${p} 未找到 SSE header（判据失效）`);
      assert.ok(iCoord < iHdr,
        `${p}: 坐标 400 必须在 SSE header 建立之前（否则前端只见到 200 管道里塞错误）`);
    }
  });

  test('⑩b 坐标闸门必须晚于 tz 解析（保住"有坐标则 tz 永不 Tier-3"的层间独立可达性）', () => {
    for (const p of ['/api/wealth-oracle', '/api/wealth-oracle/stream', '/api/wealth-oracle/v2']) {
      const seg = endpointSlice(serverCode, p);
      const iTz = seg.indexOf('resolveTimeZone(');
      const iCoord = seg.indexOf('resolveCoordinates(');
      assert.ok(iTz > 0 && iCoord > 0, `${p} 两层闸门未齐备`);
      assert.ok(iTz < iCoord,
        `${p}: 坐标闸门若早于 tz 解析，会遮蔽 tz 的 Tier-3（无坐标才可达）⇒ 该层沦为死代码且既有判据变不可达`);
    }
  });

  test('⑪ 缓存键由已校验数值派生（消灭 Number(lat || 13.75) 洗白惯用法）', () => {
    assert.ok(!/Number\(\s*lat\s*\|\|/.test(serverCode), 'server.js 仍存在 Number(lat || …) 洗白写法');
    assert.ok(!/Number\(\s*lon\s*\|\|/.test(serverCode), 'server.js 仍存在 Number(lon || …) 洗白写法');
    assert.match(serverCode, /const\s+_ckLat\s*=\s*lat\.toFixed\(4\)/, '缓存键未直接用已校验 lat');
    assert.match(serverCode, /const\s+_ckLon\s*=\s*lon\.toFixed\(4\)/, '缓存键未直接用已校验 lon');
  });

  test('⑫ 缓存版本 ≥ 闸门基线（单调判据，不写死具体版本）', () => {
    const m = streamTestSrc.match(/const\s+MIN_CACHE_VER\s*=\s*(\d+)/);
    assert.ok(m, '未找到 MIN_CACHE_VER 基线');
    const min = Number(m[1]);
    const vers = [...serverCode.matchAll(/const\s+\w*[Cc]acheKey\s*=\s*`wealth:v(\d+)/g)].map((x) => Number(x[1]));
    assert.ok(vers.length >= 3, `缓存键赋值点数量异常: ${vers.length}`);
    for (const v of vers) assert.ok(v >= min, `缓存版本 v${v} 低于基线 v${min}（入参契约变更后忘了 bump）`);
  });

  test('⑬ v69_client：识别退出码 4 / INVALID_COORDINATES，并在两处 catch 上抛', () => {
    assert.match(v69Code, /V490B_COORD_EXIT_CODE\s*=\s*4/, '未定义坐标专用退出码 4');
    assert.match(v69Code, /INVALID_COORDINATES/, '未识别 INVALID_COORDINATES 标识');
    const throws = (v69Code.match(/_isInvalidCoordError\(e\)\)\s*throw/g) || []).length;
    assert.ok(throws >= 2, `natal 与 monthly 两处 catch 都应上抛，实得 ${throws} 处`);
    assert.match(v69Code, /e\.code\s*===\s*'INVALID_COORDINATES'\)\s*throw\s+e/,
      'getAstroMatrix 外层 catch 未把坐标错误继续上抛（会被 return null 吞掉）');
  });

  test('⑭ astro_matrix：InvalidCoordinateError + validate_coordinates 哨兵 + 两个入口各调用一次', () => {
    assert.match(pyCode, /class\s+InvalidCoordinateError\s*\(Exception\)/,
      '异常类必须继承 Exception（继承 ValueError 会被既有 except ValueError 吞掉）');
    assert.match(pyCode, /def\s+validate_coordinates\s*\(/, '缺少 validate_coordinates 哨兵');
    // ⚠️ 必须只数**入口函数体内的赋值调用**（`lat, lon = validate_coordinates(lat, lon)`）：
    //   数裸 `validate_coordinates(` 会连 def 与 CLI 解析处一起算进去 ⇒ 判据无定位力。
    assert.strictEqual(entryCalls(pyCode), 2,
      `compute_natal_chart / compute_full_matrix 应各调用一次入口哨兵，实得 ${entryCalls(pyCode)} 处`);
  });

  test('⑮ astro_matrix CLI：坐标非法 → 专用退出码 4（与 tz 的 3 区分）', () => {
    assert.match(pyCode, /except\s+InvalidCoordinateError\s+as\s+\w+\s*:[\s\S]{0,200}?sys\.exit\(4\)/,
      'CLI 未对坐标错误设置退出码 4');
    assert.match(pyCode, /INVALID_COORDINATES/, 'CLI 未打 INVALID_COORDINATES 标识');
    assert.ok(!/add_argument\('--lat',\s*type\s*=\s*float/.test(pyCode),
      '--lat 仍用 type=float：argparse 失败会 exit(2) 且不带标识 ⇒ JS 端无法识别 ⇒ 静默降级');
  });
});

// ═══════════════ 三、Python 引擎行为（spawn 真跑；无 swisseph 则跳过）═══════════════
describe('V490b Python 引擎行为（spawn 真跑）', () => {
  const PY = join(ROOT, 'astro', 'astro_matrix.py');
  const SWE_OK = spawnSync('python3', ['-c', 'import swisseph'], { cwd: ROOT }).status === 0;
  const skip = SWE_OK ? false : '环境缺少 swisseph（PATH 未指向项目 python 环境）';
  const run = (latArg) => {
    const args = [PY, '--mode', 'natal', '--birth-date', '1999-09-09', '--birth-time', '09:09',
      '--lon', '100.5018', '--tz', 'Asia/Bangkok'];
    if (latArg !== undefined) args.push('--lat', latArg);
    return spawnSync('python3', args, { encoding: 'utf-8', cwd: ROOT });
  };

  test('⑯ lat=null → 退出码 4 + stderr INVALID_COORDINATES，且**绝不出盘**', { skip }, () => {
    const r = run('null');
    assert.strictEqual(r.status, 4, `应退出码 4，实得 ${r.status}（历史=2 ⇒ JS 端静默降级 Cancer）`);
    assert.match(r.stderr || '', /INVALID_COORDINATES/, 'stderr 应含 INVALID_COORDINATES 标识');
    assert.ok(!/"rising_sign"/.test(r.stdout || ''), '非法坐标绝不允许仍输出星盘（伪造上升）');
  });

  test('⑰ lat=91 → 退出码 4（历史为退出码 0 且照常出盘 = 带毒 200）', { skip }, () => {
    const r = run('91');
    assert.strictEqual(r.status, 4, `越界纬度应拒绝，实得退出码 ${r.status}`);
    assert.ok(!/"rising_sign"/.test(r.stdout || ''), '越界纬度不得出盘');
  });

  test('⑱ lat=-90.0001 → 退出码 4（下界同样闭合校验）', { skip }, () => {
    assert.strictEqual(run('-90.0001').status, 4);
  });

  test('⑲ 合法坐标 → 退出码 0 且出盘（防过度拦截的回归守卫）', { skip }, () => {
    for (const v of ['13.7563', '-54.8067', '90', '-90']) {
      const r = run(v);
      assert.strictEqual(r.status, 0, `lat=${v} 应正常出盘，实得退出码 ${r.status}`);
      assert.match(r.stdout || '', /"rising_sign"/, `lat=${v} 应输出星盘`);
    }
  });

  test('⑳ 缺省不传 --lat → 退出码 0（Tier-0 默认值不算错误）', { skip }, () => {
    const r = run(undefined);
    assert.strictEqual(r.status, 0, `缺省坐标应走默认值，实得退出码 ${r.status}`);
    assert.match(r.stdout || '', /"rising_sign"/);
  });
});

// ═══════════════ 四、端到端（live server，坐标闸门早于 LLM 故无副作用）═══════════════
describe('V490b 端到端（live server）', () => {
  test('㉑ 三端点：非法坐标 → HTTP 400 + INVALID_COORDINATES；且与其它 400 语义可区分', async () => {
    const PORT = 39878;
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
      const BASE = { birthDate: '1999-09-09', birthTime: '09:09', tz: 'Asia/Bangkok', lang: 'zh' };

      for (const bad of [{ lat: null, lon: null }, { lat: 91, lon: 100.5 }, { lat: 'abc', lon: 100.5 }, { lat: 13.7 }]) {
        for (const p of ['/api/wealth-oracle', '/api/wealth-oracle/stream', '/api/wealth-oracle/v2']) {
          const r = await post(p, { ...BASE, ...bad });
          assert.strictEqual(r.status, 400, `${p} ${JSON.stringify(bad)} 应 400，实得 ${r.status}`);
          const j = await r.json().catch(() => ({}));
          assert.strictEqual(j.code, 'INVALID_COORDINATES',
            `${p} ${JSON.stringify(bad)} 应返回 code=INVALID_COORDINATES，实得 ${JSON.stringify(j)}`);
        }
      }

      // ── 正向对照 A：**无坐标 + 无效 tz** → INVALID_TIMEZONE ──
      //   证明 tz 的 Tier-3 仍**独立可达**（若坐标闸门抢在前面，这一层就变成死代码）。
      //   ⚠️ 有合法坐标时 tz 总能被 Tier-2 按坐标推定成功 ⇒ 那一路**不可能**触发本判据（V490 钦定设计）。
      const rTz = await post('/api/wealth-oracle',
        { birthDate: '1999-09-09', birthTime: '09:09', lat: null, lon: null, tz: 'Totally/MadeUp', lang: 'zh' });
      assert.strictEqual(rTz.status, 400);
      assert.strictEqual((await rTz.json()).code, 'INVALID_TIMEZONE',
        '无坐标 + 无效 tz 未报 INVALID_TIMEZONE ⇒ tz 的 Tier-3 被坐标闸门遮蔽（层间不再独立可达）');

      // ── 正向对照 B：**非法坐标 + 无效 tz** → 仍必须报 INVALID_COORDINATES ──
      //   tz 先被 Tier-2 按（越界）坐标推定成 ok，随后坐标闸门必须照样拦下 ⇒ 证明坐标闸门未被 tz 绕过。
      const rBoth = await post('/api/wealth-oracle',
        { birthDate: '1999-09-09', birthTime: '09:09', lat: 91, lon: 100.5, tz: 'Totally/MadeUp', lang: 'zh' });
      assert.strictEqual(rBoth.status, 400);
      assert.strictEqual((await rBoth.json()).code, 'INVALID_COORDINATES',
        '非法坐标在 tz 推定成功后被放过 ⇒ 坐标闸门形同虚设');
      // 说明：本闸门不做"合法入参 → 200"的正向端到端（那会触发真实 LLM 生成，成本与耗时不可控）；
      //   正向控制分别在解析层（②）与引擎层（⑲ 合法坐标退出码 0 且出盘）完成，线上另有 verify_v490_online.mjs。

      // 区分力对照：缺 birthDate 的 400 语义必须不同（且优先级高于坐标）
      const rOrd = await post('/api/wealth-oracle', { lat: null, lon: null, tz: 'Totally/MadeUp' });
      assert.strictEqual(rOrd.status, 400);
      const jOrd = await rOrd.json();
      assert.notStrictEqual(jOrd.code, 'INVALID_COORDINATES',
        '缺 birthDate 的 400 被误报为坐标错误 ⇒ birthDate 校验未优先，或 400 无差别返回');
      assert.match(String(jOrd.error || ''), /birthDate/, `应说明 birthDate，实得 ${JSON.stringify(jOrd)}`);
    } finally {
      try { proc.kill('SIGKILL'); } catch { /* noop */ }
    }
  });
});

// ═══════════════ 五、注入缺陷自测（证明闸门真的会红）═══════════════
describe('V490b 注入缺陷自测', () => {
  test('【注入】把类型守卫换成 Number() 洗白 → 判据③ 必须红', () => {
    // 模拟"退回 Number(raw) 一把梭"的实现
    const naive = (lat, lon) => {
      const a = Number(lat), b = Number(lon);
      const okNum = Number.isFinite(a) && Number.isFinite(b);
      return okNum
        ? { ok: true, lat: a, lon: b }
        : { ok: false, code: 'INVALID_COORDINATES', reason: 'not_a_number' };
    };
    const r = naive(null, 100);
    assert.strictEqual(r.ok, true,
      '注入未生效：Number(null) 竟然没被洗成 0（若真实实现在此处返回 ok:false，说明守卫仍在）');
    // 真实实现必须与洗白版行为相反 ⇒ 证明守卫真的存在
    assert.strictEqual(resolveCoordinates(null, 100).ok, false,
      '闸门失效：真实实现对 null 也放行（Number(null)===0 洗白未被拦住）');
  });

  test('【注入】把范围判据改成永真 → 判据④ 必须红', () => {
    const noRange = () => ({ ok: true, lat: 91, lon: 100.5 });
    assert.strictEqual(noRange().ok, true, '注入未生效');
    assert.strictEqual(resolveCoordinates(91, 100.5).ok, false, '闸门失效：越界纬度未被拒绝');
  });

  test('【注入】删掉 server.js 的坐标 400 返回 → 判据⑨ 必须红', () => {
    const degraded = serverCode
      .replace(/invalidCoordinatesBody\(/g, '__removed__(')
      .replace(/COORD_REJECTED[\s\S]{0,20}/g, '');
    const n = (degraded.match(/invalidCoordinatesBody\(/g) || []).length;
    assert.ok(n < 3, '闸门失效：删除坐标错误返回后仍被判定为合格');
  });

  test('【注入】把坐标 400 挪到 SSE header 之后 → 判据⑩ 必须红', () => {
    const seg = endpointSlice(serverCode, '/api/wealth-oracle/stream');
    const iCoord = seg.indexOf('resolveCoordinates(');
    const iHdr = seg.indexOf('flushHeaders');
    // 把坐标校验块整体搬到 flushHeaders 之后
    const moved = seg.slice(0, iCoord) + seg.slice(iCoord).replace(/^[\s\S]*?(?=res\.setHeader)/, '')
      + '\n' + seg.slice(iCoord, iCoord + 60);
    const iC2 = moved.indexOf('resolveCoordinates(');
    const iH2 = moved.indexOf('flushHeaders');
    assert.ok(iC2 > iH2, '注入未生效：坐标块未被搬到 header 之后');
  });

  test('【注入】删掉 v69_client 的坐标上抛 → 判据⑬ 必须红', () => {
    const degraded = v69Code.replace(/_isInvalidCoordError\(e\)\)\s*throw/g, 'false && throw');
    const throws = (degraded.match(/_isInvalidCoordError\(e\)\)\s*throw/g) || []).length;
    assert.ok(throws < 2, '闸门失效：删除上抛后仍被判合格');
  });

  test('【注入】删掉 astro_matrix 的入口哨兵调用 → 判据⑭ 必须红', () => {
    assert.strictEqual(entryCalls(pyCode), 2, '前置：真实源码应有 2 处入口哨兵');
    const degraded = pyCode.replace(/^\s*lat,\s*lon\s*=\s*validate_coordinates\([^\n]*$/gm, '');
    assert.strictEqual(entryCalls(degraded), 0, '闸门失效：删掉入口调用后判据仍不红（无定位力）');
  });

  test('【注入】把 --lat 退回 type=float → 判据⑮ 必须红', () => {
    const degraded = pyCode.replace(/add_argument\('--lat',\s*type\s*=\s*str/, "add_argument('--lat', type=float");
    assert.match(degraded, /add_argument\('--lat',\s*type\s*=\s*float/,
      '注入未生效：--lat 未被改回 type=float');
    assert.ok(!/add_argument\('--lat',\s*type\s*=\s*float/.test(pyCode),
      '闸门失效：真实源码里 --lat 竟已是 type=float');
  });

  test('【注入】缓存版本退回低于基线 → 判据⑫ 必须红', () => {
    const min = Number(streamTestSrc.match(/const\s+MIN_CACHE_VER\s*=\s*(\d+)/)[1]);
    const degraded = serverCode.replace(/const\s+\w*[Cc]acheKey\s*=\s*`wealth:v\d+/, 'const cacheKey = `wealth:v480');
    const vers = [...degraded.matchAll(/const\s+\w*[Cc]acheKey\s*=\s*`wealth:v(\d+)/g)].map((x) => Number(x[1]));
    assert.ok(vers.some((v) => v < min), '闸门失效：低于基线的版本未被识别');
  });
});
