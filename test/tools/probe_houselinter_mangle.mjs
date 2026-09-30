// 定向实验: house_linter 的「拆标题→手工拼回」在什么输入下会产出线上那串垃圾
//   `# 月:20262026年11月: 太阳天蝎座 第5宫 · 深渊炼金`
//   `# 年2026月:1212年 本命太阳射手座 第6宫 · 本命回归`
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { closureDecls } from './extract_decls.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const src = fs.readFileSync(ROOT + '/server.js', 'utf8');
const { getSignToHouseMap, SIGN_ORDER_ZH } = await import(ROOT + '/astro-truth.js');
const { map } = closureDecls(src, ['house_linter'], ['console', 'getSignToHouseMap', 'SIGN_ORDER_ZH']);
const ctx = { console, getSignToHouseMap, SIGN_ORDER_ZH, __exports: {} };
vm.createContext(ctx);
vm.runInContext([...map.values()].join('\n\n') + '\n__exports.f = house_linter;', ctx);
const house_linter = ctx.__exports.f;

const EN = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const months = Array.from({ length: 12 }, (_, i) => ({
  month_key: `2026-${String(i + 1).padStart(2, '0')}`,
  sun: { sign: EN[i], house: i + 1 }, moon: { sign: 'Pisces', house: 9 },
  jupiter: { sign: 'Leo', house: 2 }, saturn: { sign: 'Aries', house: 10 }, pluto: { sign: 'Aquarius', house: 8 },
}));
const AM = { months, meta: {} };

const B = ' 太阳天蝎座 第5宫 · 深渊炼金';
const CASES = {
  '### 标题': `### 2026年11月:${B}`,
  '#### 标题': `#### 2026年11月:${B}`,
  '## 标题': `## 2026年11月:${B}`,
  '### 全角冒号': `### 2026年11月：${B}`,
  '### 无冒号': `### 2026年11月${B}`,
  '### 标题重复(同月)': `### 2026年11月:${B}\n\n### 2026年11月:${B}`,
  '### 两月相邻(无正文)': `### 2026年11月:${B}\n### 2026年12月:${B}`,
  '### 前有 # 残渣': `#\n### 2026年11月:${B}`,
  '#### + 前有#': `##### 2026年11月:${B}`,
  '正常两段': `### 2026年11月:${B}\n\n正文\n\n### 2026年12月:${B}\n\n正文2`,
};

for (const [name, input] of Object.entries(CASES)) {
  let out;
  try { out = house_linter(input, AM); } catch (e) { console.log(`${name.padEnd(22)} 抛: ${e.message}`); continue; }
  const lines = out.split('\n').filter((l) => /#|年\d{1,2}月/.test(l));
  const weird = lines.filter((l) => !/^\s*#{1,6}\s\d{4}年\d{1,2}月/.test(l));
  console.log(`${name.padEnd(22)} ${weird.length ? '⚠️ 异常 → ' + weird[0].trim().slice(0, 90) : '✅ 正常 → ' + (lines[0] || '').trim().slice(0, 60)}`);
}
