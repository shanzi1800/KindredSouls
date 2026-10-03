#!/usr/bin/env node
// 🚨 【前端发布铁律】守卫（V492b 缺陷A 教训，军师 2026-10-03 钦定入 SOP）
//   Dockerfile 明确 `skip in-container web rebuild, use prebuilt dist from git`（V318）
//   ⇒ 容器直接使用 git 仓库内的 web/dist 预构建产物。
//   凡改动 web/src/**（或前端依赖/配置）而不重建并提交 web/dist/**，
//   修复对用户【完全不可见】（V491 上线当日实证：线上 bundle 修复标记计数全 0）。
// 本守卫在 pre-commit 阶段拦截：staged 含前端源码变更但 staged 不含 web/dist 产物 ⇒ 拒绝提交。
import { execSync } from 'node:child_process';

const staged = execSync('git diff --cached --name-only', { encoding: 'utf8' })
  .split('\n').map((s) => s.trim()).filter(Boolean);

const srcChanged = staged.some((f) =>
  f.startsWith('web/src/') || f === 'web/package.json' || f === 'web/vite.config.ts' ||
  f === 'web/tsconfig.json' || f === 'web/tsconfig.node.json' || f === 'web/index.html' ||
  f === 'package-lock.json' || f === 'web/package-lock.json');
const distStaged = staged.some((f) => f.startsWith('web/dist/'));

if (srcChanged && !distStaged) {
  console.error([
    '🚨 [前端发布铁律] 拦截提交！',
    '',
    '本次 staged 变更包含前端源码（web/src/** 等），但未包含 web/dist/** 产物。',
    'Dockerfile 使用 git 内预构建 dist（skip in-container rebuild）⇒ 不重建产物 = 修复不上线。',
    '',
    '正确姿势（V491 缺陷A 教训）：',
    '  cd web && npm run build   # 重建产物',
    '  git add web/dist && git commit --amend --no-edit   # 或并入本次提交',
    '  （或确属纯后端提交，请将前端改动拆分到独立提交）',
  ].join('\n'));
  process.exit(1);
}
if (srcChanged && distStaged) {
  console.log('✅ [前端发布铁律] 前端源码 + web/dist 产物同步提交，放行。');
}
process.exit(0);
