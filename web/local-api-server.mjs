#!/usr/bin/env node
// Local API server for KindredSouls - runs on port 3001
// Vite dev server proxies /api/* here
// Usage: npx tsx local-api-server.ts

import http from 'node:http';
import fs from 'node:fs';

// Load env
try {
  const envPath = new URL('.env.local', import.meta.url);
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([^#=]+)=(.+)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
} catch {}

const PORT = 3001;

// Register tsx for .ts imports
await import('tsx/cjs'); // nope, let's use different approach

// Actually, let's use the dynamic import trick with tsx loader
// We need to register tsx first
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

// Use tsx/esm loader
const { register: registerLoader } = await import('node:module');

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  const body = await readBody(req);
  let params = {};
  try { params = JSON.parse(body); } catch {}

  // Route to handler
  const apiName = url.pathname.replace('/api/', '').replace(/\/$/, '');
  const handlerPath = `./api/${apiName}.js`;

  try {
    const mod = await import(handlerPath);
    const handler = mod.default;
    if (!handler) { res.writeHead(404); res.end(JSON.stringify({ error: 'No handler' })); return; }

    // Vercel-style mock
    const mockReq = {
      method: req.method,
      headers: req.headers,
      body: params,
      query: Object.fromEntries(url.searchParams),
    };
    const mockRes = createMockRes(res);
    await handler(mockReq, mockRes);
  } catch (err) {
    console.error(`API Error [${apiName}]:`, err.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message, stack: err.stack?.split('\n').slice(0, 3).join('\n') }));
  }
});

server.listen(PORT, () => console.log(`🔧 API server at http://localhost:${PORT}/api/*`));

function createMockRes(rawRes) {
  return {
    statusCode: 200,
    _headers: {},
    setHeader(k, v) { this._headers[k] = v; },
    getHeader(k) { return this._headers[k]; },
    status(code) { this.statusCode = code; return this; },
    json(data) {
      rawRes.writeHead(this.statusCode, { 'Content-Type': 'application/json' });
      rawRes.end(JSON.stringify(data));
    },
    send(data) {
      rawRes.writeHead(this.statusCode, { 'Content-Type': 'text/html' });
      rawRes.end(typeof data === 'string' ? data : JSON.stringify(data));
    },
    end(data) {
      rawRes.writeHead(this.statusCode, { 'Content-Type': 'application/json' });
      rawRes.end(data || '');
    },
  };
}

function readBody(req) {
  return new Promise(resolve => {
    let d = ''; req.on('data', c => d += c); req.on('end', () => resolve(d));
  });
}
