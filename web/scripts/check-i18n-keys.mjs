#!/usr/bin/env node
/**
 * i18n Key 门禁（V448）
 *
 * 判据：**代码里静态引用的 i18n key，必须在 6 个语种 JSON 中全部存在**
 *
 * 为什么不用「6 个 JSON 键集合完全相同」：
 *   键集合相等只能证明"字典整齐"，证明不了"用户看到的文案正确"。且会把
 *   从未被引用的死键也纳入强制翻译范围，等于逼人给死字符串补 5 语种翻译。
 *
 * 为什么用静态扫描而不是 grep：
 *   i18next 找不到 key 时**返回 key 字面量**（不是空串），所以 `t(k) || '兜底'`
 *   这种写法永远不触发兜底，直接把 key 名打上屏。必须静态拦截。
 *
 * 扫描范围判定（关键，否则检查器自己会造假阳性）：
 *   只有「从 useTranslation() 解构出 t」的文件才是真 i18n 调用点。
 *   PolicyPage / PaywallCard / AuthWallCard / WealthPaywall / AuthButton 等
 *   自定义了局部 `t`（内联多语字典），其 t('x') 不走 i18n，必须排除。
 *
 * 历史战绩：本门禁的判据可捕获
 *   - wealthReport.loading（真实路径是 wealth.loading，曾差点上屏 key 字面量）
 *   - wealthReport.alreadyGeneratedYearlyEn（该 key 从不存在）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const LANGS = ['zh', 'en', 'fr', 'es', 'th', 'vi'];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const WEB_ROOT = path.resolve(__dirname, '..');
const LOCALES_DIR = path.join(WEB_ROOT, 'src', 'i18n', 'locales');
const SRC_DIR = path.join(WEB_ROOT, 'src');

/** 某 key（点分路径）在语种字典里是否存在 */
export function hasKey(dict, keyPath) {
  let cur = dict;
  for (const seg of keyPath.split('.')) {
    if (cur && typeof cur === 'object' && Object.prototype.hasOwnProperty.call(cur, seg)) {
      cur = cur[seg];
    } else {
      return false;
    }
  }
  return true;
}

export function loadLocales(localesDir = LOCALES_DIR) {
  const out = {};
  for (const l of LANGS) {
    out[l] = JSON.parse(fs.readFileSync(path.join(localesDir, `${l}.json`), 'utf8'));
  }
  return out;
}

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === 'dist' || e.name === 'locales') continue;
      walk(path.join(dir, e.name), acc);
    } else if (/\.(tsx|ts)$/.test(e.name)) {
      acc.push(path.join(dir, e.name));
    }
  }
  return acc;
}

/** 收集「真 i18n 调用点」的静态 key */
export function collectUsedKeys(srcDir = SRC_DIR) {
  const used = new Map(); // key -> [file:line]
  for (const file of walk(srcDir)) {
    const src = fs.readFileSync(file, 'utf8');
    // 必须从 useTranslation() 解构出 t，才是真 i18n 调用点
    if (!/const\s*\{[^}]*\bt\b[^}]*\}\s*=\s*useTranslation\s*\(/.test(src)) continue;
    src.split('\n').forEach((line, i) => {
      for (const m of line.matchAll(/\bt\(\s*['"]([A-Za-z][\w.]*)['"]\s*\)/g)) {
        const k = m[1];
        if (!used.has(k)) used.set(k, []);
        used.get(k).push(`${path.relative(WEB_ROOT, file)}:${i + 1}`);
      }
    });
  }
  return used;
}

/** 主检查：返回缺口清单 */
export function checkI18nKeys(opts = {}) {
  const locales = loadLocales(opts.localesDir || LOCALES_DIR);
  const used = collectUsedKeys(opts.srcDir || SRC_DIR);
  const missing = [];
  for (const [key, refs] of used) {
    for (const lang of LANGS) {
      if (!hasKey(locales[lang], key)) missing.push({ lang, key, ref: refs[0] });
    }
  }
  return { ok: missing.length === 0, missing, keyCount: used.size, langs: LANGS };
}

// ── CLI ──
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const r = checkI18nKeys();
  console.log(`[i18n-gate] 扫描静态 key: ${r.keyCount} 个 × ${r.langs.length} 语种`);
  if (r.ok) {
    console.log(`[i18n-gate] ✅ 全部命中，无回退风险`);
    process.exit(0);
  }
  console.error(`[i18n-gate] ❌ 发现 ${r.missing.length} 处缺口（i18next 会把 key 字面量打上屏）：`);
  for (const m of r.missing) console.error(`   [${m.lang}] ${m.key}   <- ${m.ref}`);
  process.exit(1);
}
