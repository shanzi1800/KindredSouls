// 生产端月报真值核查（V478/V478b 回归验证：确认年报锁改动未误伤月报）
// 用法: node test/tools/probe_prod_monthly.mjs [YYYY-MM-DD]
const BIRTH = process.argv[2] || '1989-08-15';
const body = {
  birthDate: BIRTH, birthTime: '14:30', lat: '69.6492', lon: '18.9553',
  tz: 'Europe/Oslo', lang: 'zh', reportType: 'monthly',
};
const t0 = Date.now();
const r = await fetch('https://kindredsouls.online/api/wealth-oracle/stream', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ free_access: 1, ...(body) }),
});
let buf = '', full = '', san = '', n = 0, firstAt = 0;
const dec = new TextDecoder();
for await (const v of r.body) {
  buf += dec.decode(v, { stream: true });
  const ls = buf.split('\n'); buf = ls.pop() || '';
  for (const l of ls) {
    const t = l.trim(); if (!t.startsWith('data: ')) continue;
    const d = t.slice(6).trim(); if (d === '[DONE]') continue;
    try {
      const p = JSON.parse(d); n++;
      if (!firstAt) firstAt = Date.now() - t0;
      if (p.text) { if (full && p.text.startsWith(full)) full = p.text; else if (!full.startsWith(p.text)) full += p.text; }
      if (p.sanitized) san = p.sanitized;
    } catch { }
  }
}
const txt = san || full;
const cjk = (txt.match(/[\u4e00-\u9fff]/g) || []).length;
console.log(`耗时 ${((Date.now() - t0) / 1000).toFixed(1)}s | 首块 ${firstAt}ms | 事件 ${n} | 长度 ${txt.length} | CJK ${cjk} | 来源 ${san ? 'sanitized' : '流式'}`);

// ── 月报结构体检（军师月报框架 6 段） ──
const KEYS = [
  ['本月命运主题', /本月命运主题|Monthly Destiny Theme|ธีม/],
  ['消费陷阱', /消费陷阱|消费阴影|Trampa|Piège/],
  ['月亮周轨迹', /第[一二三四1-4]周|月光的足迹|月亮周/],
  ['风险阈值', /阈值|风险/],
];
console.log('\n=== 月报框架段落 ===');
for (const [name, re] of KEYS) console.log(`  ${re.test(txt) ? '✅' : '❌'} ${name}`);

// ── 流月锁产物：月亮周轨迹应含真值星座序列（非白羊座幻觉循环） ──
const moonWeeks = txt.match(/第[一二三四]周[^\n]{0,80}/g) || [];
console.log('\n=== 月亮周轨迹（流月锁 V438 产物）===');
moonWeeks.slice(0, 4).forEach(l => console.log('  ' + l.slice(0, 80)));

// ── 缺字体检 ──
const bad = ['座座', '()', '\uFFFD'];
console.log('\n=== 污染体检 ===');
for (const p of bad) console.log(`  ${p === '\uFFFD' ? 'U+FFFD' : p} : ${txt.split(p).length - 1} 处`);

console.log('\n=== 头部 ===');
txt.split('\n').slice(0, 10).forEach(l => l.trim() && console.log('  ' + l.trim().slice(0, 90)));
