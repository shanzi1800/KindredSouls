// V486 线上验收：抓 1997-10-18 盘最新流式年报，量化文风复读 vs V485c 基线
// 用法: node test/tools/verify_v486_online.mjs
import fs from 'node:fs';

const birthDate = '1997-10-18', birthTime = '14:30', lat = '69.6492', lon = '18.9553', tz = 'Europe/Oslo', lang = 'zh';
const dec = new TextDecoder('utf-8');

// ── 0. 部署身份（零成本信号） ──
try {
  const h = await (await fetch('https://kindredsouls.online/api/health', { signal: AbortSignal.timeout(30000) })).json();
  console.log(`[健康] deploymentId=${h.deploymentId || h.deployment_id || '(none)'}  version=${h.version || '-'}`);
} catch (e) { console.log('[健康] 取用失败:', e.message); }

// ── 1. 抓流式产物（cache 已 bump 到 v495 ⇒ 必然 MISS 重新生成） ──
console.log('→ 请求 /api/wealth-oracle/stream (yearly, nocache=true)...');
const t0 = Date.now();
const res = await fetch('https://kindredsouls.online/api/wealth-oracle/stream', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ birthDate, birthTime, lat, lon, tz, lang, reportType: 'yearly', nocache: true }),
  signal: AbortSignal.timeout(600000),
});
let raw = '';
for await (const v of res.body) raw += dec.decode(v, { stream: true });
console.log(`← ${((Date.now() - t0) / 1000).toFixed(0)}s · SSE ${raw.length} 字`);

let best = '';
for (const line of raw.split('\n')) {
  const t = line.trim();
  if (!t.startsWith('data:')) continue;
  const p = t.slice(5).trim();
  if (!p || p === '[DONE]') continue;
  let d; try { d = JSON.parse(p); } catch { continue; }
  for (const k of ['text', 'content', 'full', 'report', 'sanitized', 'accumulated']) {
    const v = d[k]; if (typeof v === 'string' && v.length > best.length) best = v;
  }
}
const OUT = '/tmp/ks1997_v486_stream.txt';
fs.writeFileSync(OUT, best);
console.log(`产物 ${best.length} 字 → ${OUT}\n`);

// ── 2. 量化 ──
const text = best;
const lines = text.split('\n');
const cnt = (re) => (text.match(re) || []).length;

// 2a 整句重复（与 probe_v486_style 同口径）
const seen = new Map();
for (const r of text.split(/(?<=[。！？])/)) {
  const head = r.replace(/^[\s>*\-]+/, '');
  const c0 = head.codePointAt(0) || 0;
  if ((c0 >= 0x2190 && c0 <= 0x2BFF) || (c0 >= 0x1F300 && c0 <= 0x1FAFF)) continue;
  const s = head.replace(/\s+/g, '').trim();
  if (s.length < 10) continue;
  seen.set(s, (seen.get(s) || 0) + 1);
}
const dups = [...seen.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]);

// 2b 概览首句骨架
const blocks = [];
for (let i = 0; i < lines.length; i++) {
  if (/^### \d{4}年\d{1,2}月[:：]/.test(lines[i])) {
    const body = [];
    for (let j = i + 1; j < lines.length && !/^### /.test(lines[j]) && !/^## /.test(lines[j]); j++) if (lines[j].trim()) body.push(lines[j].trim());
    blocks.push(body);
  }
}
const skel = new Map();
for (const b of blocks) {
  const ov = b.find((l) => l.includes('月度财富概览'));
  if (!ov) continue;
  const first = (ov.replace(/^.*?\]\*{0,2}[:：]\s*/, '').split(/(?<=[。！？])/)[0] || '')
    .replace(/[“”"「」][^“”"「」]*[“”"「」]/g, '{Q}')   // ⚠️ 必须吃掉引号内容, 否则会假绿
    .replace(/[\u4e00-\u9fa5]{1,3}座/g, '{SIGN}').replace(/第[\d一二三四五六七八九十]+宫/g, '{HOUSE}').replace(/\s+/g, '');
  const k = first.slice(0, 24);
  skel.set(k, (skel.get(k) || 0) + 1);
}
const sameSkeleton = Math.max(0, ...[...skel.values()]);

// 2c 标签错配（军师断层形态的精确判据：标签后紧接着写「另一个空间」）
//    ⚠️ 不能只判「前 30 字是否含自身关键词」—— 线上规范写法会先写本命/流年前缀，
//    那样会把合规内容误判成错配（本脚本首版就误报了 3 处）。
const SPACES = ['入口区域', '客厅区域', '卧室区域', '厨房区域', '前台区域', '工位区域', '会议室区域', '财务室'];
let mismatch = 0;
const LAB = [
  { re: /卧室区域[:：]?第四宫\(田宅宫\)/, own: '卧室区域' },
  { re: /厨房区域[:：]?第二宫\(财帛宫\)与第八宫\(共享资源\)/, own: '厨房区域' },
  { re: /财务室区域[:：]?第八宫\(共享资源\)/, own: '财务室' },
];
lines.forEach((l) => LAB.forEach((L) => {
  if (!L.re.test(l)) return;
  const parts = l.split(L.re);
  const tail = parts.length > 1 ? parts[1] : '';
  const window30 = tail.replace(/[\s*:：]/g, '').slice(0, 40);
  const other = SPACES.find((s) => s !== L.own && window30.includes(s));
  if (other) mismatch++;
}));

const R = [];
const row = (name, cur, base, pass) => R.push(`${pass ? '✅' : '❌'} ${name.padEnd(30)} 当前 ${String(cur).padStart(3)}  |  V485c 基线 ${String(base).padStart(3)}`);

row('整句重复 · 类数', dups.length, 11, dups.length < 11);
row('整句重复 · 最高复用', dups.length ? dups[0][1] : 0, 7, (dups.length ? dups[0][1] : 0) < 7);
row('「这个窗口期是行动的最佳时机」', cnt(/这个窗口期是行动的最佳时机/g), 12, cnt(/这个窗口期是行动的最佳时机/g) < 12);
row('「绝对禁止」', cnt(/绝对禁止/g), 11, cnt(/绝对禁止/g) < 6);
row('「则暗示着」', cnt(/则暗示着/g), 15, cnt(/则暗示着/g) < 8);
row('「不要因为」', cnt(/不要因为/g), 18, cnt(/不要因为/g) < 10);
row('概览首句 · 最大同骨架月数', sameSkeleton, 11, sameSkeleton <= 4);
row('显化道具词(蜡烛/羊皮纸/墨水笔)', cnt(/蜡烛|羊皮纸|墨水笔|金墨/g), 7, cnt(/蜡烛|羊皮纸|墨水笔|金墨/g) === 0);
row('月标题行数', (text.match(/^### \d{4}年\d{1,2}月[:：]/gm) || []).length, 12, (text.match(/^### \d{4}年\d{1,2}月[:：]/gm) || []).length === 12);
row('第五章标签-正文错配', mismatch, 0, mismatch === 0);
row('内部字段泄漏', cnt(/风控(?:切入)?(?:主线|角度|视角|重点)/g), 0, cnt(/风控(?:切入)?(?:主线|角度|视角|重点)/g) === 0);
row('外行星幻觉(木星双子座)', cnt(/木星在?双子座/g), 0, cnt(/木星在?双子座/g) === 0);

console.log(R.join('\n'));
console.log('\n重复句 Top5:');
dups.slice(0, 5).forEach(([s, n]) => console.log(`  ×${n} ${s.slice(0, 46)}`));
console.log('\n概览骨架分布:', JSON.stringify([...skel.entries()], null, 0));
