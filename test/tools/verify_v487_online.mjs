// V487 线上验收：抓 1997-10-18 盘最新流式年报, 量化三条「跨月同骨架」是否被逐月注入破解
// 用法:
//   node test/tools/verify_v487_online.mjs              # 线上抓取
//   node test/tools/verify_v487_online.mjs <本地产物>   # 离线复算(用于校验度量工具本身, 防假绿)
//
// 基线(V486b 线上产物 11095 字, 同一端口径):
//   概览首句「本月你的财务重心落在"…"」 12/12 (重心落在 11)
//   断路器段「绝对禁止」                13
//   窗口指令「这是你本月最适合"X"的窗口」 12/12
import fs from 'node:fs';

const LOCAL = process.argv[2] || '';
const birthDate = '1997-10-18', birthTime = '14:30', lat = '69.6492', lon = '18.9553', tz = 'Europe/Oslo', lang = 'zh';
const dec = new TextDecoder('utf-8');

let best = '';
if (LOCAL) {
  best = fs.readFileSync(LOCAL, 'utf-8');
  console.log(`[离线] 读取本地产物 ${LOCAL} · ${best.length} 字\n`);
} else {
  // ── 0. 部署身份（零成本信号） ──
  try {
    const h = await (await fetch('https://kindredsouls.online/api/health', { signal: AbortSignal.timeout(30000) })).json();
    console.log(`[健康] deploymentId=${h.deploymentId || h.deployment_id || '(none)'}  version=${h.version || '-'}`);
  } catch (e) { console.log('[健康] 取用失败:', e.message); }

  // ── 1. 抓流式产物（cache 已 bump 到 v497 ⇒ 必然 MISS 重新生成） ──
  console.log('→ 请求 /api/wealth-oracle/stream (yearly, nocache=true)...');
  const t0 = Date.now();
  const res = await fetch('https://kindredsouls.online/api/wealth-oracle/stream', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ free_access: 1, ...({ birthDate, birthTime, lat, lon, tz, lang, reportType: 'yearly', nocache: true }) }),
    signal: AbortSignal.timeout(600000),
  });
  let raw = '';
  for await (const v of res.body) raw += dec.decode(v, { stream: true });
  console.log(`← ${((Date.now() - t0) / 1000).toFixed(0)}s · SSE ${raw.length} 字`);

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
  const OUT = '/tmp/ks1997_v487_stream.txt';
  fs.writeFileSync(OUT, best);
  console.log(`产物 ${best.length} 字 → ${OUT}\n`);
}

// ── 2. 量化 ──
const text = best;
const lines = text.split('\n');
const cnt = (re) => (text.match(re) || []).length;

// 2a 整句重复（口径同 probe_v486_style / server 的 auditYearlyStyleRepetition）
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

// 2b 月度分块
const blocks = [];
for (let i = 0; i < lines.length; i++) {
  if (/^### \d{4}年\d{1,2}月[:：]/.test(lines[i])) {
    const body = [];
    for (let j = i + 1; j < lines.length && !/^### /.test(lines[j]) && !/^## /.test(lines[j]); j++) if (lines[j].trim()) body.push(lines[j].trim());
    blocks.push({ title: lines[i], body, text: body.join('\n') });
  }
}

// 2c 骨架归一化: 必须吃掉**引号内容**、星座、宫位、数字、日期,
//    否则「落在"共享资源"」与「落在"事业"」会被当成两个不同骨架 ⇒ 假绿(V486 踩过)
const skelOf = (s) => (s || '')
  .replace(/[“”"「」「][^“”"「」]*[“”"「」]/g, '{Q}')
  .replace(/[\u4e00-\u9fa5]{1,3}座/g, '{SIGN}')
  .replace(/第[\d一二三四五六七八九十]+宫/g, '{HOUSE}')
  .replace(/\d+月\d+日|\d+月|\d+日/g, '{DATE}')
  .replace(/\d+/g, '{N}')
  .replace(/\s+/g, '');

const skelStat = (firsts) => {
  const m = new Map();
  for (const f of firsts) { const k = skelOf(f).slice(0, 26); if (k) m.set(k, (m.get(k) || 0) + 1); }
  return { map: m, max: Math.max(0, ...[...m.values()]) };
};

// 概览首句
const ovFirst = [];
for (const b of blocks) {
  const ov = b.body.find((l) => l.includes('月度财富概览'));
  if (!ov) continue;
  ovFirst.push((ov.replace(/^.*?\]\*{0,2}[:：]\s*/, '').split(/(?<=[。！？])/)[0] || ''));
}
const ovSk = skelStat(ovFirst);

// 概览首句是否**误取**了「风控主线分配表」的项(三张表串用) —— V487 首验实测 3/12 月中招
const CRISIS_KEYS = ['变现难度', '投入产出比', '信息真伪', '隐性债务', '税务与合规', '跨境', '人情债', '资金共管', '家庭财务', '创意项目'];
const lensMisread = ovFirst.filter((s) => CRISIS_KEYS.some((k) => s.includes(k))).length;
// 镜头表命中率(粗匹配: 首句是否落在某个镜头语义域内)
const LENS_KEYS = ['周转速度', '账期', '配置比例', '再平衡', '隐性溢价', '变现测试', '支出结构', '订阅式', '应收账款', '回款周期', '议价', '知识变现', '对冲', '再融资', '精力预算', '期限匹配'];
const lensHit = ovFirst.filter((s) => LENS_KEYS.some((k) => s.includes(k))).length;

// 断路器段首句（"*断路器警告*：" 之后的完整句）
const cbFirst = [];
for (const b of blocks) {
  const cb = b.body.find((l) => /断路器警告/.test(l));
  if (!cb) continue;
  const tail = cb.split(/断路器警告\*{0,2}[:：]/)[1] || '';
  cbFirst.push((tail.split(/(?<=[。！？：:])/)[0] || tail).slice(0, 120));
}
const cbSk = skelStat(cbFirst);

// 窗口执行指令首句
const wnFirst = [];
for (const b of blocks) {
  const wn = b.body.find((l) => /执行指令/.test(l));
  if (!wn) continue;
  const tail = wn.split(/执行指令\*{0,2}[:：]/)[1] || wn;
  wnFirst.push((tail.split(/(?<=[。！？：:])/)[0] || tail).slice(0, 120));
}
const wnSk = skelStat(wnFirst);

// 断路器段: 真正的同构信号是「无条件命令式禁令句」被逐月复用 ⇒ 统计含「绝对禁止」的月数
const cbBannedMonths = blocks.filter((b) => ((b.body.find((l) => /断路器警告/.test(l)) || '')).includes('绝对禁止')).length;

// 2d 第五章标签错配（判「标签后 60 字内先出现另一个空间名」，并把本行+下一行拼起来看）
const SPACES = ['入口区域', '客厅区域', '卧室区域', '厨房区域', '前台区域', '工位区域', '会议室区域', '财务室'];
let mismatch = 0;
const LAB = [
  { re: /卧室区域[:：]?第四宫\(田宅宫\)/, own: '卧室区域' },
  { re: /厨房区域[:：]?第二宫\(财帛宫\)与第八宫\(共享资源\)/, own: '厨房区域' },
  { re: /财务室区域[:：]?第八宫\(共享资源\)/, own: '财务室' },
];
lines.forEach((l, i) => LAB.forEach((L) => {
  if (!L.re.test(l)) return;
  const tail = (l.split(L.re)[1] || '') + ' ' + (lines[i + 1] || '');
  const w = tail.replace(/[\s*:：]/g, '').slice(0, 60);
  if (SPACES.find((s) => s !== L.own && w.includes(s))) mismatch++;
}));

// 2e 内部字段泄漏(V487 词表已扩)
const LEAK = /(?:风控|风险)\s*(?:切入)?\s*(?:主线|角度|视角|重点|切入点)|(?:叙述|叙事|概览)\s*镜头|(?:风控|风险|窗口|高峰|执行)\s*(?:表达)?\s*(?:指令)?\s*框架|条件触发式|时间窗式|动作指令式|场景先行式/;
const leakage = (text.match(new RegExp(LEAK.source, 'g')) || []).length;

const R = [];
const row = (name, cur, base, pass) => R.push(`${pass ? '✅' : '❌'} ${name.padEnd(30)} 当前 ${String(cur).padStart(3)}  |  上轮基线 ${String(base).padStart(3)}`);

row('概览首句 · 最大同骨架月数', ovSk.max, 11, ovSk.max <= 4);
row('概览首句 · 命中镜头表 · 月数', lensHit, 0, lensHit >= 8);
row('概览首句 · 误取风控主线表 · 月数', lensMisread, 3, lensMisread <= 1);
row('断路器段 · 最大同骨架月数', cbSk.max, 12, cbSk.max <= 4);
row('断路器段 · 含「绝对禁止」的月数', cbBannedMonths, 12, cbBannedMonths <= 4);
row('窗口指令 · 最大同骨架月数', wnSk.max, 11, wnSk.max <= 4);
row('「绝对禁止」', cnt(/绝对禁止/g), 13, cnt(/绝对禁止/g) <= 4);
row('「本月你的财务重心」', cnt(/本月你的财务重心/g), 12, cnt(/本月你的财务重心/g) <= 2);
row('「这是你本月最适合」', cnt(/这是你本月最适合/g), 12, cnt(/这是你本月最适合/g) <= 2);
row('整句重复 · 类数', dups.length, 0, dups.length <= 3);
row('整句重复 · 最高复用', dups.length ? dups[0][1] : 0, 1, (dups.length ? dups[0][1] : 0) <= 2);
row('内部字段泄漏(V487 扩表)', leakage, 0, leakage === 0);
row('月标题行数', (text.match(/^### \d{4}年\d{1,2}月[:：]/gm) || []).length, 12, (text.match(/^### \d{4}年\d{1,2}月[:：]/gm) || []).length === 12);
row('第五章标签-正文错配', mismatch, 0, mismatch === 0);
row('外行星幻觉(木星双子座)', cnt(/木星在?双子座/g), 0, cnt(/木星在?双子座/g) === 0);
row('显化道具词(蜡烛/羊皮纸/墨水笔)', cnt(/蜡烛|羊皮纸|墨水笔|金墨/g), 0, cnt(/蜡烛|羊皮纸|墨水笔|金墨/g) === 0);

console.log(R.join('\n'));
console.log('\n概览首句骨架分布:');
[...ovSk.map.entries()].sort((a, b) => b[1] - a[1]).forEach(([k, n]) => console.log(`  ×${n}  ${k}`));
console.log('\n断路器段骨架分布:');
[...cbSk.map.entries()].sort((a, b) => b[1] - a[1]).forEach(([k, n]) => console.log(`  ×${n}  ${k}`));
console.log('\n窗口指令骨架分布:');
[...wnSk.map.entries()].sort((a, b) => b[1] - a[1]).forEach(([k, n]) => console.log(`  ×${n}  ${k}`));
if (dups.length) { console.log('\n重复句 Top5:'); dups.slice(0, 5).forEach(([s, n]) => console.log(`  ×${n} ${s.slice(0, 46)}`)); }
