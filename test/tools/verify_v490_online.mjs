#!/usr/bin/env node
/**
 * 🛡️ V490 线上验收脚本（部署后运行）
 *
 * 验收项：
 *  A. 三端点：**无效 tz + 无坐标** → HTTP 400 + code=INVALID_TIMEZONE（消灭静默假绿）
 *  B. 无效 tz + **有效坐标** → Tier-2 坐标推定，**不得** 400（证明推定层可用）
 *  C. **typo tz**（America/Agentina/Ushuaia）→ Tier-1 自动纠正，**不得** 400
 *  D. 样本 3 正确 tz → 正常开始生成（SSE 首帧）
 *  E. /api/health 部署标识
 *
 * 用法：node test/tools/verify_v490_online.mjs
 */
const BASE = process.env.BASE || 'https://kindredsouls.online';
const results = [];
const rec = (name, pass, detail) => { results.push({ name, pass, detail }); console.log(`${pass ? '✅' : '❌'} ${name} — ${detail}`); };

const postJson = (p, body) => fetch(BASE + p, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ free_access: 1, ...(body) }),
});

// 只读前 N 字节后主动断开（SSE 长流不必等完；能收到首帧即证明未被 400 拦下）
async function headOfStream(p, body, ms = 25000) {
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

const SAMPLE3 = { birthDate: '1995-12-21', birthTime: '23:59', lat: -54.8067, lon: -68.3030, lang: 'en' };

// ── E. 部署标识 ──
try {
  const h = await (await fetch(BASE + '/api/health')).json();
  rec('E /api/health', true, `deploymentId=${h.deploymentId || JSON.stringify(h).slice(0, 80)}`);
} catch (e) { rec('E /api/health', false, e.message); }

// ── A. 三端点 400 ──
for (const p of ['/api/wealth-oracle', '/api/wealth-oracle/stream', '/api/wealth-oracle/v2']) {
  try {
    const r = await postJson(p, { birthDate: '1999-09-09', birthTime: '09:09', lat: null, lon: null, tz: 'Totally/MadeUp', lang: 'zh' });
    const j = await r.json().catch(() => ({}));
    rec(`A ${p} 无效 tz → 400`, r.status === 400 && j.code === 'INVALID_TIMEZONE',
      `HTTP ${r.status}, code=${j.code}`);
  } catch (e) { rec(`A ${p} 无效 tz → 400`, false, e.message); }
}

// ── B. Tier-2 坐标推定（无效 tz + 有效坐标 → 不得 400）──
{
  const r = await headOfStream('/api/wealth-oracle/stream',
    { birthDate: '1999-09-09', birthTime: '09:09', lat: 13.7563, lon: 100.5018, tz: 'Not/AZone', lang: 'zh' });
  rec('B Tier-2 坐标推定（Not/AZone + 曼谷坐标）不得 400', r.status === 200,
    `HTTP ${r.status}${r.head ? ' 首帧=' + r.head.replace(/\s+/g, ' ').slice(0, 70) : ''}`);
}

// ── C. Tier-1 typo 纠正（不得 400）──
{
  const r = await headOfStream('/api/wealth-oracle/stream',
    { ...SAMPLE3, tz: 'America/Agentina/Ushuaia' });
  rec('C Tier-1 typo 纠正（Agentina→Argentina）不得 400', r.status === 200,
    `HTTP ${r.status}${r.head ? ' 首帧=' + r.head.replace(/\s+/g, ' ').slice(0, 70) : ''}`);
}

// ── D. 样本 3 正确 tz 正常生成 ──
{
  const r = await headOfStream('/api/wealth-oracle/stream', { ...SAMPLE3, tz: 'America/Argentina/Ushuaia' });
  rec('D 样本3 正确 tz 正常出流', r.status === 200, `HTTP ${r.status}`);
}

const pass = results.filter((x) => x.pass).length;
console.log(`\n=== V490 线上验收: ${pass}/${results.length} ===`);
process.exit(pass === results.length ? 0 : 1);
