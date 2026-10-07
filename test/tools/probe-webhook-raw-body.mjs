// 机制级实证：全局 body-parser 是否吞掉 webhook 的原始 body
// 目的：证明「豁免 /api/webhook」这一修复确实让 express.raw 拿到 Buffer。
import express from 'express';

function buildApp({ exempt }) {
  const app = express();
  if (exempt) {
    const _p = express.json({ limit: '10mb' });
    app.use((req, res, next) => {
      if ((req.originalUrl || '').split('?')[0] === '/api/webhook') return next();
      return _p(req, res, next);
    });
  } else {
    app.use(express.json({ limit: '10mb' }));
  }
  app.post('/api/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    res.json({ isBuffer: Buffer.isBuffer(req.body), typeofBody: typeof req.body, sample: Buffer.isBuffer(req.body) ? req.body.toString('utf8').slice(0, 40) : String(req.body).slice(0, 40) });
  });
  return app;
}

async function probe(exempt) {
  const app = buildApp({ exempt });
  const srv = app.listen(0);
  await new Promise(r => srv.once('listening', r));
  const port = srv.address().port;
  const payload = JSON.stringify({ type: 'checkout.session.completed', n: 1 });
  const r = await fetch(`http://127.0.0.1:${port}/api/webhook`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload,
  });
  const j = await r.json();
  srv.close();
  return j;
}

const buggy = await probe(false);
const fixed = await probe(true);
console.log('【缺陷形态】全局 app.use(express.json())         ⇒', JSON.stringify(buggy));
console.log('【修复形态】/api/webhook 豁免全局解析            ⇒', JSON.stringify(fixed));
console.log('---');
console.log('缺陷形态是否能验签: ', buggy.isBuffer ? '是' : '否（constructEvent 必抛错）');
console.log('修复形态是否能验签: ', fixed.isBuffer ? '是 ✅' : '否 ❌');
if (!buggy.isBuffer && fixed.isBuffer) { console.log('结论：缺陷复现成功，修复有效（PASS）'); }
else { console.log('结论：机制假设不成立，需重新定位（FAIL）'); process.exitCode = 1; }
