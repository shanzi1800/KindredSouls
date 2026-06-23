// Local dev server: hosts all Vercel API functions on port 3001
import { createRequire } from 'module';
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const require = createRequire(import.meta.url);
const app = express();
app.use(express.json({ limit: '10mb' }));

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function loadEndpoints() {
  const apiDir = path.join(__dirname, 'api');
  const files = await fs.readdir(apiDir);
  const jsFiles = files.filter((f) => f.endsWith('.js'));

  for (const file of jsFiles) {
    const route = '/api/' + file.replace('.js', '');
    try {
      const mod = await import(path.join(apiDir, file) + '?t=' + Date.now());
      const handler = mod.default || mod.handler;
      if (!handler) {
        console.log(`⚠️  ${route}: no default/handler export`);
        continue;
      }

      app.all(route, async (req, res) => {
        const vReq = {
          method: req.method,
          body: req.body,
          headers: req.headers,
          query: req.query,
          url: req.url,
        };
        const vRes = {
          status: (code) => { vRes._status = code; return vRes; },
          json: (data) => res.status(vRes._status || 200).json(data),
          send: (data) => res.status(vRes._status || 200).send(data),
          setHeader: (k, v) => { res.setHeader(k, v); return vRes; },
          end: (data) => res.end(data),
          _status: 200,
        };
        try {
          await handler(vReq, vRes);
        } catch (err) {
          console.error(`❌ ${route} error:`, err);
          if (!res.headersSent) {
            res.status(500).json({ error: err.message });
          }
        }
      });
      console.log(`✅ ${route} loaded`);
    } catch (e) {
      console.log(`⚠️  ${route} failed to load:`, e.message);
    }
  }
}

await loadEndpoints();

app.listen(3001, () => {
  console.log('🚀 Local API server running on http://localhost:3001');
});
