import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// ═══════════════════════════════════════════════════════════════════
// 🔧 Sweep 真值重算工具（唯一真源维护入口）
// ═══════════════════════════════════════════════════════════════════
// 作用：读 test/tools/sweep-matrix.json 内**手工维护的盘参数**（id/lang/name/
//   edge/birth/time/lat/lon/tz/note），用 astro/astro_matrix.py **实算真值**
//   覆盖 truth 字段 —— truth 严禁手抄（判据同源铁律）。
//
// 用法：node test/tools/regen-sweep-truth.mjs
// ⚠️ 必须带 SwissEph 的 python 环境（裸 python3 无 swisseph ⇒ 真值全 null ⇒ 假绿）：
//   export PATH="/Users/apple/.workbuddy/binaries/python/envs/default/bin:$PATH"
//
// 维护流程：改盘参数 → 跑本工具重算 truth → 跑闸门
//   `node --test test/audit-sweep-matrix.test.mjs`
//   （闸门会**再次现场实算**并逐盘比对，确保 JSON 未过期）。
// ═══════════════════════════════════════════════════════════════════

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const REGISTRY = join(ROOT, 'test', 'tools', 'sweep-matrix.json');

const payload = JSON.parse(readFileSync(REGISTRY, 'utf8'));
if (!Array.isArray(payload.disks) || payload.disks.length === 0) {
  console.error('❌ 注册表 disks 为空 —— 先手工写入盘参数');
  process.exit(1);
}

const out = [];
for (const d of payload.disks) {
  const raw = execFileSync('python3', [
    'astro/astro_matrix.py', '--mode', 'natal',
    '--birth-date', d.birth, '--birth-time', d.time,
    '--lat', String(d.lat), '--lon', String(d.lon), '--tz', d.tz,
  ], { cwd: ROOT, encoding: 'utf8', env: process.env, maxBuffer: 8 * 1024 * 1024 });

  const j = JSON.parse(raw);
  if (!j.computed_houses || !j.rising_sign) {
    console.error(`❌ ${d.id} 引擎输出异常（swisseph 缺失？）:`, String(raw).slice(0, 200));
    process.exit(1);
  }
  const houses = {};
  for (const [p, v] of Object.entries(j.computed_houses)) houses[p] = { sign: v.sign, house: v.house };

  out.push({
    ...d,
    reportType: d.reportType || 'yearly',
    truth: { rising_sign: j.rising_sign, sun_sign: j.sun_sign, ascendant_deg: j.ascendant_deg, houses },
  });

  console.log(d.id.padEnd(4), d.lang, '->', String(j.rising_sign).padEnd(11),
    '| Sun', (j.computed_houses.Sun.sign + ' H' + j.computed_houses.Sun.house).padEnd(18),
    '| Moon H' + j.computed_houses.Moon.house,
    '| Jup H' + j.computed_houses.Jupiter.house,
    '| Sat H' + j.computed_houses.Saturn.house,
    '| Plu H' + j.computed_houses.Pluto.house);
}

payload.disks = out;
payload._meta = { ...(payload._meta || {}), last_regenerated: new Date().toISOString() };
writeFileSync(REGISTRY, JSON.stringify(payload, null, 2) + '\n', 'utf8');
console.log(`\n✅ 真值已重算并写回 ${out.length} 盘 → test/tools/sweep-matrix.json`);
