// 🛡️ V437-sec 回归门：仓库密钥泄漏自动拦截（硬锁死优于软约束）
//
// 【为什么要有这道门】
//   2026-06-14 → 2026-09-13，一把 Supabase service_role 硬编码密钥在**公开仓库**里躺了 3 个月
//   （前端源码被打进公开 JS bundle / Dockerfile 烤进镜像层 / 废弃 Vercel 函数 / 回归脚本），
//   期间 CI 从未拦截。教训：凭据泄漏不能靠自觉，必须靠门禁。
//
// 【本套件验什么】
//   ① 全仓「被 git 跟踪」的文件内容里不得出现任何高权限凭据形态
//   ② 探测器自证（双向）：能抓到已知坏样本，且不误报干净文本
//   ③ 敏感文件不得被 git 跟踪（.env* 仅允许 *.example 形态入仓）
//   ④ .dockerignore 必须拒绝 .env*（防凭据被打进镜像层）
//
// 【注意】本门禁扫的是「当前跟踪的文件内容」，不扫 git 历史。
//   历史里的旧凭据无法靠删除消除 → 处置方式是**轮换**（轮换后历史里即为死串）。
import { test, describe } from 'node:test';
import assert from 'node:assert';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ── 凭据形态表（新增云厂商时在此追加）──
const PATTERNS = [
  ['旧式 JWT（Supabase service_role / anon 等）', /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{30,}\.[A-Za-z0-9_-]{20,}/g],
  ['Supabase 新式 secret key', /sb_secret_[A-Za-z0-9_-]{8,}/g],
  ['OpenAI / DeepSeek API key', /\bsk-[A-Za-z0-9]{24,}/g],
  ['GitHub PAT', /(?:ghp_|github_pat_)[A-Za-z0-9_]{20,}/g],
  ['Stripe secret key', /sk_(?:test|live)_[A-Za-z0-9]{20,}/g],
  ['Stripe webhook secret', /whsec_[A-Za-z0-9]{20,}/g],
  ['Google API key', /AIza[A-Za-z0-9_-]{30,}/g],
  ['PEM 私钥', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
];

// 例：'server/.env.example'（示例文件允许入仓；当前无需要，保持空集最严）
const ALLOW = new Set([]);

/** 扫描一段文本，返回命中的凭据形态（供门禁与自证共用） */
function scanText(text) {
  const hits = [];
  for (const [name, re] of PATTERNS) {
    const m = text.match(re);
    if (m && m.length) {
      hits.push({ name, count: m.length, sample: String(m[0]).slice(0, 16) + '…' });
    }
  }
  return hits;
}

function trackedFiles() {
  const out = execFileSync('git', ['ls-files', '-z'], {
    cwd: ROOT, encoding: 'utf8', maxBuffer: 128 * 1024 * 1024,
  });
  return out.split('\0').filter(Boolean);
}

function readIfTextable(rel) {
  const abs = path.join(ROOT, rel);
  let st;
  try { st = fs.statSync(abs); } catch { return null; }
  if (!st.isFile() || st.size === 0 || st.size > 2 * 1024 * 1024) return null;
  const buf = fs.readFileSync(abs);
  if (buf.subarray(0, 8000).includes(0)) return null;   // 二进制跳过
  return buf.toString('utf8');
}

describe('V437-sec：仓库密钥泄漏门禁', () => {
  test('① 全仓被跟踪文件：不得出现任何高权限凭据形态', () => {
    const offenders = [];
    for (const rel of trackedFiles()) {
      if (ALLOW.has(rel)) continue;
      const text = readIfTextable(rel);
      if (text == null) continue;
      const hits = scanText(text);
      if (hits.length) offenders.push(`${rel} → ${hits.map(h => h.name).join(', ')}`);
    }
    assert.deepEqual(
      offenders, [],
      '🚨 检测到凭据被提交进仓库（必须改为环境变量读取）：\n  ' + offenders.join('\n  ')
    );
  });

  test('② 探测器自证：能抓到坏样本（否则等于没门）', () => {
    // 运行时拼接，避免本文件自身被自己的规则命中
    const FAKE_JWT = ['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
                      'eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJzZXJ2aWNlX3JvbGUifQ',
                      'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'].join('.');
    assert.ok(scanText(`const k = '${FAKE_JWT}';`).length > 0, 'JWT 样本未被抓到（门禁失效）');
    assert.ok(scanText(`const k = '${['sb_secret','x'.repeat(24)].join('_')}';`).length > 0, 'sb_secret 样本未被抓到');
    assert.ok(scanText(`sk-${'a'.repeat(30)}`).length > 0, 'sk- 样本未被抓到');
  });

  test('② 探测器自证：干净文本零误报', () => {
    const clean = [
      'SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY',
      'const cacheKey = `wealth:v352e:${birth}:${lang}`;',
      'la Lune en transit en Bélier (Maison 12)',
      'คีย์จากตัวแปรสภาพแวดล้อม',
      '-----BEGIN PUBLIC KEY-----',   // 公钥不是凭据
    ].join('\n');
    assert.deepEqual(scanText(clean), [], '清洁文本被误报');
  });

  test('③ 敏感文件不得被 git 跟踪（.env* 仅允许 *.example）', () => {
    const bad = trackedFiles().filter(f => {
      const base = path.basename(f);
      return base.startsWith('.env') && !base.endsWith('.example');
    });
    assert.deepEqual(
      bad, [],
      '🚨 敏感文件被跟踪（应 git rm --cached 并依赖 .gitignore）：\n  ' + bad.join('\n  ')
    );
  });

  test('④ .dockerignore 必须拒绝 .env*（凭据不进镜像层）', () => {
    const di = fs.readFileSync(path.join(ROOT, '.dockerignore'), 'utf8');
    const rules = di.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
    assert.ok(rules.includes('.env*'), '.dockerignore 缺少 .env* 规则');
    assert.ok(rules.includes('**/.env*'), '.dockerignore 缺少递归规则 **/.env*');
  });
});
