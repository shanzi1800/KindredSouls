// V481 端到端复现: 旧换行注入 vs 新换行注入 → 过 normalizeYearlyMarkup → 数「# 」空标题行
// 用法: node test/tools/probe_v481_emptytitle.mjs /tmp/ks_raw_zh.txt
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { closureDecls } from './extract_decls.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(__dirname, '..', '..', 'server.js'), 'utf-8');
const rawPath = process.argv[2] || '/tmp/ks_raw_zh.txt';
const raw = fs.readFileSync(rawPath, 'utf-8');

const SEEDS = ['normalizeYearlyMarkup'];
const { map } = closureDecls(src, SEEDS, ['getSignToHouseMap', 'SIGN_ORDER_ZH']);
for (const n of [...map.keys()]) { try { new vm.Script(map.get(n)); } catch { map.delete(n); } }
const ctx = { console, setTimeout, clearTimeout, setInterval, clearInterval, Buffer, process, __exports: {} };
vm.createContext(ctx);
const body = [...map.entries()].sort((a, b) => src.indexOf(a[1]) - src.indexOf(b[1])).map(e => e[1]).join('\n\n');
vm.runInContext(body + '\n' + SEEDS.map(n => `__exports[${JSON.stringify(n)}] = ${n};`).join('\n'), ctx);
const normalize = ctx.__exports.normalizeYearlyMarkup;

const OLD_INJECT = (t) => t.replace(/####\s*📅/g, '\n#### 📅').replace(/###\s+/g, '\n### ').replace(/---/g, '\n---\n');
const NEW_INJECT = (t) => t.replace(/####\s*📅/g, '\n#### 📅').replace(/(?<!#)###\s+/g, '\n### ').replace(/---/g, '\n---\n');

const cnt = (t) => (t.split('\n').filter(l => /^\s*#\s*$/.test(l)).length);
const cntLoose = (t) => (t.split('\n').filter(l => /^\s*#+\s*$/.test(l)).length);
for (const [label, inject] of [['旧 /###\\s+/ (会劈开 ####)', OLD_INJECT], ['新 (?<!#)###\\s+ (修复)', NEW_INJECT]]) {
  const injected = inject(raw);
  const out = normalize(injected, 'zh', 'yearly');
  const head = cnt(out);
  const months = (out.split('\n').filter(l => /^### \d{4}年\d{1,2}月:/.test(l)).length);
  console.log(`\n--- ${label} ---`);
  console.log(`  【归一前】空标题行(^#+$) = ${cntLoose(injected)}`);
  console.log(`  【归一后】「# 」空标题行 = ${head}   规范月标题(### YYYY年M月:) = ${months}`);
}
