// ═══════════════════════════════════════════════════════════════════
// V482c 探针: 用【线上真实产物】验证「同月双标题」清算是否生效
// 用法: node test/tools/probe_v482c_duptitle.mjs [文本文件]
//   默认读 /tmp/ks1999_v482_e2e.txt (verify_v482_e2e.mjs 落盘的线上年报)
// 判据: 月标题行数必须 == 12 (线上实测 24 = 12 个月各重复一次)
// ═══════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { getSignToHouseMap, SIGN_ORDER_ZH } from '../../astro-truth.js';
import { closureDecls } from './extract_decls.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
// KS_SRC 可指向任意一版 server.js（例如 `git show b9622f8:server.js > /tmp/old.js`），
// 用来回答「线上那一版代码本该不该去重」—— 判别「容器没换」vs「去重逻辑另有漏网」。
const src = fs.readFileSync(process.env.KS_SRC || path.join(ROOT, 'server.js'), 'utf8');
const SEEDS = ['lockYearlyMonthTitles', 'lockYearlyTransitSigns', '_v479IsMonthTitleLine',
  '_v482SignAdjacent', '_v432Clause', '_v432LockNatal', '_v432AdjudicateDescriptors', '_v432Normalize',
  '_v432Truth', '_v432TruthMatch', '_v432SlotOf', '_v432ClaimOf', '_v432PatchZone', '_v432FindHouse',
  '_v432AllSignWords', '_v432Signs', '_v432SignAlts', '_V432_CFG', '_V432_NAME', '_V432_ORDER',
  '_V432_LANGS', '_V432_EN2LOC', '_v432Esc', '_V482_FWD_BREAK', '_V482_FWD_CONJ', '_V482_TRANSIT_KEYS',
  '_V482_TVERB', '_V478_EN_MONTHS', 'SUN_SIGN_EN', '_v444Signs', '_v444Esc',
  '_V482B_TITLE_LEAD', '_V482B_TITLE_HOUSE', '_V482B_SUN_WORD'];
const { map } = closureDecls(src, SEEDS, ['getSignToHouseMap', 'SIGN_ORDER_ZH']);
for (const n of [...map.keys()]) { try { new vm.Script(map.get(n)); } catch { map.delete(n); } }
const ctx = { getSignToHouseMap, SIGN_ORDER_ZH, console, setTimeout, clearTimeout, setInterval, clearInterval, Buffer, process, __exports: {} };
vm.createContext(ctx);
vm.runInContext([...map.entries()].sort((a, b) => src.indexOf(a[1]) - src.indexOf(b[1])).map(e => e[1]).join('\n\n')
  + '\n' + SEEDS.map(n => `__exports[${JSON.stringify(n)}] = typeof ${n} !== 'undefined' ? ${n} : undefined;`).join('\n'), ctx);
const F = ctx.__exports;

const file = process.argv[2] || '/tmp/ks1999_v482_e2e.txt';
if (!fs.existsSync(file)) { console.error('缺少线上产物:', file, '— 先跑 verify_v482_e2e.mjs'); process.exit(1); }
const text = fs.readFileSync(file, 'utf8');

// 真值盘: 与 E2E 同口径(1999-12-15 特罗姆瑟) —— 直接从线上产物反推不可靠, 用固定的假矩阵即可
// (本探针只验「同月双标题清算」, 不验星座真值 → 用真 values 的假矩阵足够, 保持零 python 依赖)
const ZH = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'];
const EN = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const months = Array.from({ length: 12 }, (_, i) => ({ sun: { sign: EN[i], house: i + 1 } }));
const M = { months, meta: {} };

const countTitleRows = (t) => t.split('\n').filter((l) => /^\s*#{1,6}\s/.test(l) && /\d{4}年\d{1,2}月/.test(l)).length;
const before = countTitleRows(text);
const out = F.lockYearlyMonthTitles(text, 'zh', M, 'yearly');
const after = countTitleRows(out);
const again = F.lockYearlyMonthTitles(out, 'zh', M, 'yearly');

const rows = out.split('\n').filter((l) => /^\s*#{1,6}\s/.test(l) && /\d{4}年\d{1,2}月/.test(l));
console.log(`月标题行: 修复前 ${before} 行 → 修复后 ${after} 行`);
for (const r of rows) console.log('   ' + r.trim());
console.log(`\n① 行数 == 12: ${after === 12 ? '✅' : '❌'}`);
const latin = rows.filter((r) => /[A-Za-z]/.test(r));
console.log(`② 零拉丁字母残渣: ${latin.length === 0 ? '✅' : '❌ ' + latin.join(' | ')}`);
console.log(`③ 幂等(二次零 diff): ${again === out ? '✅' : '❌'}`);
fs.writeFileSync('/tmp/ks1999_v482c_fixed.txt', out);
console.log('\n修复后全文 → /tmp/ks1999_v482c_fixed.txt');
process.exit(after === 12 && latin.length === 0 && again === out ? 0 : 1);
