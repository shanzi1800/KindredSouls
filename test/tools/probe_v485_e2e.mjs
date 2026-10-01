// V485 端到端: 把新清洗链作用到「被测产物」上, 量化修复效果
import fs from 'node:fs';
import vm from 'node:vm';
import { closureDecls } from './extract_decls.mjs';
import { getAstroMatrix } from '../../v69_client.js';

const src = fs.readFileSync(new URL('../../server.js', import.meta.url), 'utf-8');
const DEPS = ['lockYearlyOuterPlanetsYear', '_V485_OUTER_KEYS', '_V482_TVERB', '_V432_NAME',
  '_v444Signs', '_v432AllSignWords', '_v444Esc', 'SUN_SIGN_EN'];
const { source: code } = closureDecls(src, DEPS, []);
const ctx = { console, __exports: {} };
vm.createContext(ctx);
vm.runInContext(code + '\n__exports.f = lockYearlyOuterPlanetsYear;', ctx);
const lockOuter = ctx.__exports.f;

const path = process.argv[2] || '/tmp/ks1997_stream_final.txt';
const text = fs.readFileSync(path, 'utf-8');
console.log(`产物: ${path} · ${text.length} 字`);

const M = await getAstroMatrix('1997-10-18', '14:30', 69.6492, 18.9553, 'Europe/Oslo', { reportType: 'yearly' });

const scan = (s) => ({
  '木星+双子座': (s.match(/木星[^\n。]{0,20}双子座/g) || []).length,
  '木星+狮子座': (s.match(/木星[^\n。]{0,20}狮子座/g) || []).length,
  '本命第11宫': (s.match(/本命第11宫/g) || []).length,
  '第11宫落在': (s.match(/第11宫落在/g) || []).length,
  '月标题': (s.match(/^#{1,6}\s*\d{4}年\d{1,2}月[^\n]*/gm) || []).length,
});

const before = scan(text);
const after = scan(lockOuter(text, 'zh', M, 'yearly'));
const locked = lockOuter(text, 'zh', M, 'yearly');

console.log('\n=== 修复前后对比 ===');
for (const k of Object.keys(before)) console.log(`  ${k.padEnd(12)} ${before[k]} → ${after[k]}`);

const fixed = [...text.matchAll(/[^\n。]{0,25}木星[^\n。]{0,25}/g)].filter((m) => m[0].includes('双子'));
console.log('\n=== 被修正的句子 ===');
for (const m of fixed) console.log('  原:', m[0].trim());
const after2 = [...locked.matchAll(/[^\n。]{0,25}木星[^\n。]{0,25}/g)].filter((m) => m[0].includes('狮子') && m[0].includes('第9宫'));
for (const m of after2.slice(0, 4)) console.log('  新:', m[0].trim());

const ok = (c, m) => console.log(`  ${c ? '✅' : '❌'} ${m}`);
console.log('\n=== 判据 ===');
ok(after['木星+双子座'] === 0, `木星双子座幻觉清零 (${before['木星+双子座']} → ${after['木星+双子座']})`);
ok(after['月标题'] === 12, `12 条月标题未被破坏 (${after['月标题']})`);
ok(lockOuter(locked, 'zh', M, 'yearly') === locked, '幂等(零 diff)');
ok(locked.length === text.length, `等长替换(仅改星座字面, 零增删): ${text.length} → ${locked.length}`);
process.exitCode = (after['木星+双子座'] === 0 && after['月标题'] === 12) ? 0 : 1;
