// 生产端端到端真值核查：真实拉一次年报 SSE，量 CJK 完整度 + 流式节奏(时间轴)
// 用法: node test/tools/probe_prod_yearly.mjs [birthDate] [lat] [lon] [tz]
// 提示: 服务端对已缓存键即使传 nocache 也会直接读缓存 → 要测「真生成流式」需先清缓存:
//   curl "https://kindredsouls.online/api/clear-cache/1989-08-15/zh/yearly"
const birthDate = process.argv[2] || '1989-08-15';
const lat = process.argv[3] || '69.6492';
const lon = process.argv[4] || '18.9553';
const tz = process.argv[5] || 'Europe/Oslo';

const body = {
  birthDate, birthTime: '14:30', lat, lon, tz,
  lang: 'zh', reportType: 'yearly', nocache: true,
};

const t0 = Date.now();
const res = await fetch('https://kindredsouls.online/api/wealth-oracle/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});
console.log('HTTP', res.status, res.headers.get('content-type'));

let buf = '', full = '', sanitized = '', chunks = 0, firstChunkMs = null, sanitizedMs = null, lastTextMs = null;
const arrivals = [];   // 每个 text 事件的到达时刻(ms)
let lastByteMs = t0;
const decoder = new TextDecoder();
for await (const value of res.body) {
  lastByteMs = Date.now();
  buf += decoder.decode(value, { stream: true });
  const lines = buf.split('\n');
  buf = lines.pop() || '';
  for (const line of lines) {
    const t = line.trim();
    if (!t.startsWith('data: ')) continue;
    const d = t.slice(6).trim();
    if (d === '[DONE]') continue;
    try {
      const p = JSON.parse(d);
      if (p.text) {
        chunks++;
        const ms = Date.now() - t0;
        arrivals.push(ms);
        if (firstChunkMs === null) firstChunkMs = ms;
        lastTextMs = ms;
        // 后端可能推增量或全量快照
        if (full && p.text.startsWith(full)) full = p.text; else full += p.text;
      }
      if (p.sanitized) { sanitized = p.sanitized; sanitizedMs = Date.now() - t0; }
      if (p.fixed && !sanitized) { sanitized = p.fixed; sanitizedMs = Date.now() - t0; }
    } catch { /* 忽略非 JSON 事件 */ }
  }
}
const totalMs = Date.now() - t0;
const cjk = (s) => (s.match(/[\u4e00-\u9fff]/g) || []).length;

console.log('\n===== 流式数据 =====');
console.log(`首块到达: ${firstChunkMs} ms | 末块: ${lastTextMs} ms | 总耗时: ${totalMs} ms | text 事件数: ${chunks} | sanitized: ${sanitized ? '有 @ ' + sanitizedMs + 'ms' : '无'}`);
console.log(`流式累计长度: ${full.length} | sanitized 长度: ${sanitized.length}`);

// ── 流式节奏判定(真流式 vs 伪流式) ──
// 真流式: text 事件首末跨越接近整个生成周期(first ≈ 1~3s, last ≈ total-1s), 事件在时间轴上均匀铺开
// 伪流式(V411): 全部事件挤在最后 <1s 内同一批到达(first ≈ total)
const spread = (lastTextMs ?? 0) - (firstChunkMs ?? 0);
const burstRatio = totalMs > 0 ? spread / totalMs : 0;
// 最后 10% 时间窗内到达的事件占比
const win = totalMs * 0.1;
const burstEvents = arrivals.filter((m) => m >= totalMs - win).length;
const burstFrac = chunks ? burstEvents / chunks : 0;
console.log('\n===== 流式节奏判定 =====');
console.log(`事件时间跨度: ${spread} ms (占全程 ${(burstRatio * 100).toFixed(1)}%) | 末 10% 窗口内事件: ${burstEvents}/${chunks} = ${(burstFrac * 100).toFixed(1)}%`);
console.log(`判定: ${firstChunkMs !== null && firstChunkMs < 8000 && burstRatio > 0.5 ? '✅ 真流式(首块 <8s 且事件铺满生成周期)' : '❌ 伪流式/缓存命中(首块过晚或事件挤堆)'}`);
console.log(`到达采样(每 ${Math.max(1, Math.floor(chunks / 8))} 块): ${arrivals.filter((_, i) => i % Math.max(1, Math.floor(chunks / 8)) === 0).slice(0, 9).join('ms, ')}ms`);

console.log('\n===== 完整度体检 =====');
for (const [name, txt] of [['流式累计', full], ['sanitized 终稿', sanitized]]) {
  if (!txt) { console.log(`${name}: (无)`); continue; }
  const c = cjk(txt);
  console.log(`${name}: ${txt.length} 字 | CJK ${c} | 密度 ${(c / txt.length * 1000).toFixed(1)}/千字 | 首行 ${JSON.stringify(txt.slice(0, 40))}`);
}
console.log('\n关键短语存活:', {
  '先知神谕': full.includes('先知神谕'), '财富启示录': full.includes('财富启示录'),
  '狮子座': full.includes('狮子座'), '天蝎座': full.includes('天蝎座'), '水瓶座': full.includes('水瓶座'),
  '第10宫': /第10宫/.test(full),
});
if (sanitized) {
  const cs = cjk(sanitized), cf = cjk(full);
  console.log(`sanitized/流式 CJK 比 = ${(cs / (cf || 1) * 100).toFixed(1)}% (低于 90% 说明终稿被吃字)`);
}
console.log('\n--- 前 260 字 ---\n' + full.slice(0, 260));
