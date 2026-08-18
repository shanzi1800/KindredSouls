#!/usr/bin/env node
// Local SPA server + API proxy to Vercel (follows POST redirects)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, 'dist');
const PORT = 5173;
const VERCEL_HOST = 'www.kindredsouls.com.au';

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
  '.mp4': 'video/mp4', '.webp': 'image/webp',
};

function readBody(req) {
  return new Promise(resolve => {
    let d = ''; req.on('data', c => d += c); req.on('end', () => resolve(d));
  });
}

function postToVercel(apiPath, body) {
  return new Promise((resolve, reject) => {
    const doRequest = (hostname, pathname, redirectCount = 0) => {
      if (redirectCount > 5) return reject(new Error('Too many redirects'));
      const opts = { hostname, path: pathname, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } };
      const req = https.request(opts, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const u = new URL(res.headers.location);
          res.resume(); // drain
          doRequest(u.hostname, u.pathname, redirectCount + 1);
        } else {
          const chunks = [];
          res.on('data', c => chunks.push(c));
          res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
        }
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    };
    doRequest(VERCEL_HOST, apiPath);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  // API proxy
  if (url.pathname.startsWith('/api/') && req.method === 'POST') {
    const body = await readBody(req);
    try {
      const result = await postToVercel(url.pathname, body);
      res.writeHead(result.status, { 'Content-Type': 'application/json' });
      res.end(result.body);
    } catch (e) {
      console.error('Proxy error:', e.message);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Proxy failed: ' + e.message }));
    }
    return;
  }

  // Static
  let fp = path.join(DIST_DIR, url.pathname === '/' ? 'index.html' : url.pathname);
  if (!fs.existsSync(fp) || fs.statSync(fp).isDirectory()) fp = path.join(DIST_DIR, 'index.html');
  const ext = path.extname(fp);
  try {
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    fs.createReadStream(fp).pipe(res);
  } catch { res.writeHead(404); res.end('Not found'); }
});

server.listen(PORT, () => console.log(`🚀 http://localhost:${PORT} | API -> https://${VERCEL_HOST}/api/*`));
