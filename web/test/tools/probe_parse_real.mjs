// 端到端真值核查：把生产端真实年报喂给「线上同一份」解析器，看结构是否被正确切开
// 用法: cd web && node test/tools/probe_parse_real.mjs /tmp/ks_prod_zh.txt
import fs from 'node:fs';
import { parseYearlyReport, cleanYearlyTimeline } from '../../src/lib/yearly-report-parser.ts';

const file = process.argv[2] || '/tmp/ks_prod_zh.txt';
const raw = fs.readFileSync(file, 'utf8');
const r = parseYearlyReport(raw, '1989-08-15');

console.log(`原文 ${raw.length} 字 → chapters=${r.chapters.length}  months=${r.months.length}`);
console.log(`title = ${JSON.stringify(r.title)}`);
console.log('\n--- 章节卡 ---');
r.chapters.forEach((c, i) => console.log(`  ${i + 1}. ${c.title}   (content ${c.content.length} 字)`));
console.log('\n--- 月卡 ---');
r.months.forEach((m) => console.log(`  ${m.month} | ${m.zodiac} | ${m.state}/${m.stateLabel}`));

// ── 诊断：文档里「看着像章节锚点、却没被切开」的行（真雷） ──
const CHAPTER_KEYWORDS = ['先知', '第一章', '第二章', '第三章', '第四章', '第五章', '最终', '密令'];
console.log('\n--- ① 含章节关键字但非 "## " 开头（不会被切成章节卡 → 漏网）---');
let miss = 0;
for (const ln of raw.split('\n')) {
  const t = ln.trim();
  if (!t || !CHAPTER_KEYWORDS.some((k) => t.includes(k))) continue;
  if (!t.startsWith('## ')) { console.log(`  [level=${(t.match(/^#+/) || ['(无)'])[0]}] ${t.slice(0, 95)}`); miss++; }
}
if (!miss) console.log('  （无）');

// ── 诊断：月标题的层级分布及其是否被解析成月卡 ──
console.log('\n--- ② 月标题层级分布 ---');
const mh = {};
for (const ln of raw.split('\n')) {
  const m = ln.trim().match(/^(#{1,6})\s*(\d{4}年\d{1,2}月)\s*[·::-|]/);
  if (m) mh[m[1]] = (mh[m[1]] || 0) + 1;
}
console.log(' ', JSON.stringify(mh), '（前端月卡识别要求 #{2,4}）');

// ── 诊断：清洗后内容里是否残留「章节关键字」行（说明被吞进正文） ──
console.log('\n--- ③ 清洗后正文里残留的章节关键字行 ---');
let inBody = 0;
for (const c of r.chapters) {
  for (const ln of c.content.split('\n')) {
    const t = ln.trim();
    if (CHAPTER_KEYWORDS.some((k) => t.includes(k)) && t.length < 60) {
      console.log(`  (在「${c.title}」内) ${t.slice(0, 90)}`); inBody++;
    }
  }
}
if (!inBody) console.log('  （无）');
