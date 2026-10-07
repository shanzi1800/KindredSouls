#!/usr/bin/env node
/**
 * 🛡️ V490b 线上验收脚本（部署后运行）
 *
 * 验收项：
 *  A. 三端点：**非法坐标**（null / 越界 / 非数字 / 只给一侧）→ HTTP 400 + code=INVALID_COORDINATES
 *  B. **边界合法坐标**（±90 / ±180）→ 不得被坐标闸门 400（正向控制，证明未过度拦截）
 *  C. 语义可区分：**无坐标 + 无效 tz** → INVALID_TIMEZONE（证明 tz 层未被坐标闸门遮蔽）
 *  D. 组合：**非法坐标 + 无效 tz** → INVALID_COORDINATES（坐标闸门不会被 tz 推定绕过）
 *  E. /api/health 部署标识
 *
 * 用法：node test/tools/verify_v490b_online.mjs
 */
const BASE = process.env.BASE || 'https://kindredsouls.online';
const results = [];
const rec = (name, pass, detail) => { results.push({ name, pass, detail }); console.log(`${pass ? '✅' : '❌'} ${name} — ${detail}`); };

const postJson = (p, body) => fetch(BASE + p, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ free_access: 1, ...(body) }),
});

/** 只取首帧后主动断开（SSE 长流不必等完；能拿到 200 首帧即证明未被闸门拦下） */
async function headOfStream(p, body, ms = 20000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(BASE + p, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ free_access: 1, ...(body) }), signal: ctrl.signal,
    });
    if (r.status !== 200) return { status: r.status, head: '' };
    const reader = r.body.getReader();
    const { value } = await reader.read();
    try { ctrl.abort(); } catch { /* noop */ }
    return { status: 200, head: value ? new TextDecoder().decode(value) : '' };
  } catch (e) {
    return { status: -1, head: '', err: e.name };
  } finally { clearTimeout(t); }
}

const BASEBODY = { birthDate: '1999-09-09', birthTime: '09:09', tz: 'Asia/Bangkok', lang: 'zh' };
const EPS = ['/api/wealth-oracle', '/api/wealth-oracle/stream', '/api/wealth-oracle/v2'];

// ── E. 部署标识 ──
try {
  const h = await (await fetch(BASE + '/api/health')).json();
  rec('E /api/health', true, `deploymentId=${h.deploymentId || JSON.stringify(h).slice(0, 80)}`);
} catch (e) { rec('E /api/health', false, e.message); }

// ── A. 三端点 × 非法坐标 → 400 INVALID_COORDINATES ──
const BAD_CASES = [
  ['lat=null', { lat: null, lon: 100.5 }],
  ['lon=null', { lat: 13.7, lon: null }],
  ['lat=91(越界)', { lat: 91, lon: 100.5 }],
  ['lon=-181(越界)', { lat: 13.7, lon: -181 }],
  ['lat="abc"', { lat: 'abc', lon: 100.5 }],
  ['只给 lat（半缺）', { lat: 13.7 }],
];
for (const [label, bad] of BAD_CASES) {
  let pass = true, detail = [];
  for (const p of EPS) {
    try {
      const r = await postJson(p, { ...BASEBODY, ...bad });
      const j = await r.json().catch(() => ({}));
      const ok = r.status === 400 && j.code === 'INVALID_COORDINATES';
      if (!ok) pass = false;
      detail.push(`${p.replace('/api/wealth-oracle', '') || '(base)'}:${r.status}${j.code ? '/' + j.code : ''}`);
    } catch (e) { pass = false; detail.push(`${p}:ERR ${e.message}`); }
  }
  rec(`A 非法坐标 ${label} → 400 INVALID_COORDINATES`, pass, detail.join(' | '));
}

// ── B. 边界合法坐标 → 不得被坐标闸门 400（正向控制）──
for (const [label, lat, lon] of [['lat=90 lon=180', 90, 180], ['lat=-90 lon=-180', -90, -180]]) {
  const r = await headOfStream('/api/wealth-oracle/stream', { ...BASEBODY, lat, lon, tz: 'Asia/Bangkok' });
  const pass = r.status === 200;
  rec(`B 边界合法坐标 ${label} → 不被坐标闸门拦截`, pass, `status=${r.status}${r.head ? ' head=' + JSON.stringify(r.head.slice(0, 60)) : ''}`);
}

// ── C. 无坐标 + 无效 tz → INVALID_TIMEZONE（层间独立可达）──
try {
  const r = await postJson('/api/wealth-oracle', { birthDate: '1999-09-09', birthTime: '09:09', lat: null, lon: null, tz: 'Totally/MadeUp', lang: 'zh' });
  const j = await r.json().catch(() => ({}));
  rec('C 无坐标 + 无效 tz → INVALID_TIMEZONE（tz 层未被遮蔽）', r.status === 400 && j.code === 'INVALID_TIMEZONE', `status=${r.status} code=${j.code || '-'}`);
} catch (e) { rec('C 无坐标 + 无效 tz → INVALID_TIMEZONE', false, e.message); }

// ── D. 非法坐标 + 无效 tz → INVALID_COORDINATES（坐标闸门不被绕过）──
try {
  const r = await postJson('/api/wealth-oracle', { birthDate: '1999-09-09', birthTime: '09:09', lat: 91, lon: 100.5, tz: 'Totally/MadeUp', lang: 'zh' });
  const j = await r.json().catch(() => ({}));
  rec('D 非法坐标 + 无效 tz → INVALID_COORDINATES（不被 Tier-2 绕过）', r.status === 400 && j.code === 'INVALID_COORDINATES', `status=${r.status} code=${j.code || '-'}`);
} catch (e) { rec('D 非法坐标 + 无效 tz → INVALID_COORDINATES', false, e.message); }

const bad = results.filter((x) => !x.pass);
console.log(`\n${bad.length ? '❌' : '✅'} V490b 线上验收：${results.length - bad.length}/${results.length} 通过`);
process.exit(bad.length ? 1 : 0);
