// V482 端到端验证：拉生产端(旧代码)年报 → 过新「逐月流年行星真值锁」→ 逐行 diff
// 用法: node test/tools/probe_v482_transit_lock.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { getSignToHouseMap, SIGN_ORDER_ZH } from '../../astro-truth.js';
import { getAstroMatrix } from '../../v69_client.js';
import { closureDecls } from './extract_decls.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const src = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
const SEEDS = ['lockYearlyTransitSigns', 'lockYearlyMonthTitles', 'applyTruthLocksEnEsZh', '_v432Normalize',
  '_v432LockNatal', '_v432AdjudicateDescriptors', '_v432Truth', '_v432TruthMatch', '_v432SlotOf', '_v432Clause',
  '_v432ClaimOf', '_v432PatchZone', '_v432FindHouse', '_v432AllSignWords', '_v482SignAdjacent', '_v432Signs',
  '_v432SignAlts', '_V432_CFG', '_V432_NAME', '_V432_ORDER', '_V432_LANGS', '_v432Esc', 'SUN_SIGN_EN', '_v444Signs', '_v444Esc', '_V432_EN2LOC'];
const { map } = closureDecls(src, SEEDS, ['getSignToHouseMap', 'SIGN_ORDER_ZH']);
for (const n of [...map.keys()]) { try { new vm.Script(map.get(n)); } catch { map.delete(n); } }
console.log('缺失:', SEEDS.filter(n => !map.has(n)).join(', ') || '无');
const ctx = { getSignToHouseMap, SIGN_ORDER_ZH, console, setTimeout, clearTimeout, setInterval, clearInterval, Buffer, process, __exports: {} };
vm.createContext(ctx);
vm.runInContext([...map.entries()].sort((a, b) => src.indexOf(a[1]) - src.indexOf(b[1])).map(e => e[1]).join('\n\n')
  + '\n' + SEEDS.map(n => `__exports[${JSON.stringify(n)}] = typeof ${n} !== 'undefined' ? ${n} : undefined;`).join('\n'), ctx);
const F = ctx.__exports;

const birthDate = '1999-12-15', lat = '69.6492', lon = '18.9553', tz = 'Europe/Oslo', lang = 'zh';
try {
  const cr = await fetch(`https://kindredsouls.online/api/clear-cache/${birthDate}/${lang}/yearly`);
  console.log('clear-cache:', cr.status);
} catch (e) { console.log('clear-cache 失败(忽略):', e.message); }

const res = await fetch('https://kindredsouls.online/api/wealth-oracle/stream', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ free_access: 1, ...({ birthDate, birthTime: '14:30', lat, lon, tz, lang, reportType: 'yearly', nocache: true }) }),
});
let buf = '', full = '', sanitized = '';
const dec = new TextDecoder();
for await (const v of res.body) {
  buf += dec.decode(v, { stream: true });
  const ls = buf.split('\n'); buf = ls.pop() || '';
  for (const l of ls) {
    const t = l.trim();
    if (!t.startsWith('data: ')) continue;
    const d = t.slice(6).trim();
    if (d === '[DONE]') continue;
    try { const p = JSON.parse(d); if (p.text) full = (full && p.text.startsWith(full)) ? p.text : full + p.text; if (p.sanitized) sanitized = p.sanitized; } catch {}
  }
}
const text = sanitized || full;
fs.writeFileSync('/tmp/ks1999_prod.txt', text);
console.log('生产端年报:', text.length, '字 → /tmp/ks1999_prod.txt');

const M = await getAstroMatrix(birthDate, '14:30', +lat, +lon, tz);
const out = F.lockYearlyTransitSigns(text, lang, M, 'yearly');
console.log('\n=== 逐月流年行星真值锁 diff ===');
const A = text.split('\n'), B = out.split('\n');
let n = 0;
for (let i = 0; i < Math.max(A.length, B.length); i++) {
  if (A[i] !== B[i]) { n++; console.log(`\n[第${i}行]\n  - ${A[i]}\n  + ${B[i]}`); }
}
console.log(`\n共 ${n} 行被改`);
fs.writeFileSync('/tmp/ks1999_locked.txt', out);
