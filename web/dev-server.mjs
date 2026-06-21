// Local dev server: hosts wealth-oracle API on port 3001
import { createRequire } from 'module';
import express from 'express';

const require = createRequire(import.meta.url);
const app = express();
app.use(express.json());

// Import the Vercel handler
const wealthOracle = await import('./api/wealth-oracle.js');
const handler = wealthOracle.default || wealthOracle.handler;

// Vercel function wrapper → Express
app.post('/api/wealth-oracle', (req, res) => {
  const vReq = {
    method: 'POST',
    body: req.body,
    headers: req.headers,
    query: req.query,
  };
  const vRes = {
    status: (code) => { vRes._status = code; return vRes; },
    json: (data) => res.status(vRes._status || 200).json(data),
    setHeader: () => vRes,
    end: () => res.end(),
    _status: 200,
  };
  handler(vReq, vRes);
});

// Also host the existing compatibility API
try {
  const aiInsight = await import('./api/ai-insight.js');
  const aiHandler = aiInsight.default || aiInsight.handler;
  app.post('/api/ai-insight', (req, res) => {
    const vReq = { method: 'POST', body: req.body, headers: req.headers, query: req.query };
    const vRes = {
      status: (code) => { vRes._status = code; return vRes; },
      json: (data) => res.status(vRes._status || 200).json(data),
      setHeader: () => vRes, end: () => res.end(), _status: 200,
    };
    aiHandler(vReq, vRes);
  });
} catch (e) {
  console.log('⚠️  ai-insight not loaded:', e.message);
}

app.listen(3001, () => {
  console.log('🚀 Local API server running on http://localhost:3001');
  console.log('   POST /api/wealth-oracle');
  console.log('   POST /api/ai-insight');
});
