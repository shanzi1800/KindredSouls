import fs from 'node:fs';

// 加载 .env.local（项目根）
const envText = fs.readFileSync(new URL('./.env.local', import.meta.url), 'utf8');
for (const line of envText.split('\n')) {
  const m = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
  if (m) {
    let v = m[2].trim().replace(/\r$/, '');
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[m[1]]) process.env[m[1]] = v;
  }
}

console.log('[TEST] DEEPSEEK_API_KEY:', process.env.DEEPSEEK_API_KEY ? 'SET' : 'MISSING');
console.log('[TEST] GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'SET' : 'MISSING');

const mod = await import('./web/api/wealth-oracle.localtest.mjs');
const handler = mod.default;

const res = {
  _status: 200, _json: null, _body: '',
  setHeader() {}, writeHead(c) { this._status = c; return this; },
  status(c) { this._status = c; return this; },
  json(o) { this._json = o; return this; },
  end(b) { if (b != null) this._body = (typeof b === 'string') ? b : String(b); return this; },
};

// 沿用 test_monthly_th.md 的泰语测试场景（测试账号 1990-06-15 绕过 auth）
const req = {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: { birthDate: '1990-06-15', lang: 'th', reportType: 'monthly' },
};

console.log('\n🚀 生成泰语财富月报 (birthDate=1990-06-15 测试账号绕过 auth)...\n');
const t0 = Date.now();
await handler(req, res);
const dt = ((Date.now() - t0) / 1000).toFixed(1);
console.log('⏱️ 耗时:', dt + 's | HTTP:', res._status);

if (res._json || res._body) {
  let out = res._json;
  if (!out && res._body) { try { out = JSON.parse(res._body); } catch { out = { raw: res._body }; } }
  console.log('=== 返回字段 ===');
  console.log(Object.keys(out).join(', '));
  const ins = out.report || out.insight || (out.data && out.data.insight) || out.text || out.raw || '';
  fs.writeFileSync('/tmp/wealth_th_report.txt', String(ins));
  console.log('\n=== 月报内容（泰语，前3500字）===');
  console.log(String(ins).slice(0, 3500));
  // 质量检查
  console.log('\n=== 质量自检 ===');
  console.log('长度:', String(ins).length, '字符');
  console.log('含 U+FFFD 乱码:', String(ins).includes('�') ? '❌ 有' : '✅ 无');
  console.log('含 ราศี (星座泰语):', String(ins).includes('ราศี') ? '✅ 有' : '⚠️ 无');
}
