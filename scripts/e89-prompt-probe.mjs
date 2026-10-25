#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════
// E89 生成质量探针（一次性，不入闸门）——实测月报四模块 / 年报五章 prompt
// 经 DeepSeek 网关的真实产出结构（军令第 2/3 条「内容达标」验证）。
//   · 构造器以「文本抽取 + VM 注入」消费（闸门同源口径，不 import server.js 免 listen）；
//   · 依赖 computeCompatScores / buildCompatTimeContext / renderSynastryBlock
//     直接 import api/ai-advisor.js（单一真源）；
//   · 密钥经环境变量注入，绝不入库/回显。
// 用法：DEEPSEEK_API_KEY=... node scripts/e89-prompt-probe.mjs [monthly|yearly]
// ═══════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SERVER = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
const MODE = (process.argv[2] === 'yearly') ? 'yearly' : 'monthly';

// ── 抽取：月报表 + 年报表 + 两构造器（花括号配平）──
function sliceFrom(anchor, endMarker) {
  const i = SERVER.indexOf(anchor);
  if (i === -1) throw new Error(`anchor missing: ${anchor}`);
  const j = SERVER.indexOf(endMarker, i);
  if (j === -1) throw new Error(`end marker missing after ${anchor}`);
  return SERVER.slice(i, j);
}
function fnBody(anchor) {
  const i = SERVER.indexOf(anchor);
  if (i === -1) throw new Error(`fn anchor missing: ${anchor}`);
  let depth = 0, started = false;
  for (let j = SERVER.indexOf('{', i); j < SERVER.length; j++) {
    if (SERVER[j] === '{') { depth++; started = true; }
    else if (SERVER[j] === '}') { depth--; if (started && depth === 0) return SERVER.slice(i, j + 1); }
  }
  throw new Error(`unbalanced fn: ${anchor}`);
}

const monthlyTables = sliceFrom('const _E89_MONTHLY_LANG_LOCK', '\n\n// ═══');
const yearlyTables = sliceFrom('const _E88_YEARLY_LANG_LOCK', '\n\n// ═══');
const fnMonthly = fnBody('function buildCompatMonthlyFourModulePrompt(');
const fnYearly = fnBody('function buildCompatYearlyFiveChapterPrompt(');

const { computeCompatScores, buildCompatTimeContext, renderSynastryBlock } = await import(
  path.join(ROOT, 'api/ai-advisor.js')
);

// VM 注入（依赖经参数传入，函数体内常量已随源码段带入）
const factory = new Function(
  'computeCompatScores', 'buildCompatTimeContext', 'renderSynastryBlock',
  `${monthlyTables}\n${yearlyTables}\n${fnMonthly}\n${fnYearly}\nreturn { buildCompatMonthlyFourModulePrompt, buildCompatYearlyFiveChapterPrompt };`
);
const { buildCompatMonthlyFourModulePrompt, buildCompatYearlyFiveChapterPrompt } = factory(
  computeCompatScores, buildCompatTimeContext, renderSynastryBlock
);

// 测算底表（同前端提交形态）
const d1 = '1990-05-20', d2 = '1992-11-08';
const extras = {
  bazi: { a: 7, b: 3 }, zodiac: { a: 2, b: 8 }, iching: { a: 6, b: 5 },
  tarot: { name: 'The Lovers', orientation: 'Upright', meaning: 'union—choice' },
  zodiacMeta: ['Taurus', 'Scorpio'], userBirthDate: '1990-05-20', synastry: null,
};

const prompt = MODE === 'yearly'
  ? buildCompatYearlyFiveChapterPrompt(d1, d2, 'zh', extras)
  : buildCompatMonthlyFourModulePrompt(d1, d2, 'zh', extras);

console.log('=== PROMPT 尺寸 ===');
console.log('system chars:', prompt.system.length, '| user chars:', prompt.user.length);

const KEY = process.env.DEEPSEEK_API_KEY;
if (!KEY) { console.error('DEEPSEEK_API_KEY missing'); process.exit(1); }
const MAXT = MODE === 'yearly' ? 7000 : 3000;
const t0 = Date.now();
const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
  body: JSON.stringify({
    model: 'deepseek-flash',
    thinking: { type: 'disabled' },
    messages: [
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user },
    ],
    max_tokens: MAXT, temperature: 0,
  }),
});
console.log('=== DeepSeek 网关 ===');
console.log('HTTP', res.status, '| elapsed', ((Date.now() - t0) / 1000).toFixed(1) + 's', '| maxTokens', MAXT);
const data = await res.json();
const out = data?.choices?.[0]?.message?.content || '';
console.log('=== 产出体检 ===');
console.log('chars:', out.length, '| finish_reason:', data?.choices?.[0]?.finish_reason,
  '| completion_tokens:', data?.usage?.completion_tokens);
const titles = MODE === 'yearly'
  ? ['第一章 · 太阳返照盘', '第二章 · 未来12个月流年月度演变全景', '第三章 · 双人关系四大硬核维度推演', '第四章 · 全年三大命运十字路口', '第五章 · 易经流年大卦与年度开运调频指南']
  : ['第一章 · 当月合盘能量总纲', '第二章 · 四维情感能量雷达', '第三章 · 30天高能吉凶日历', '第四章 · 月度易经调频锦囊'];
for (const t of titles) console.log(out.includes(t) ? '  ✓' : '  ✗', t);
fs.writeFileSync(`/tmp/e89_probe_${MODE}.txt`, out);
console.log('全文已存 /tmp/e89_probe_' + MODE + '.txt');
