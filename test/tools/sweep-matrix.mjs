// ══════════════════════════════════════════════════════════════════════
// 🛡️ KindredSouls Sweep 基准盘矩阵 —— 加载器 / 判据同源比较器
// ══════════════════════════════════════════════════════════════════════
// 盘池数据（params + truth）在 sweep-matrix.json —— 由 astro/astro_matrix.py
// **实算生成**（regen-sweep-truth.mjs），严禁手抄（判据同源铁律）。
//
// 编号沿革：s1~s12 = E17/R11j 起沿用的「12 特殊生日」批测盘（语言两两成对 +
//   各覆盖一类时区/纬度/历法边界）；s13 = E21/R11o 收编的「语义标签错配」样本
//   （1993-12-15 阿德莱德 —— 与 s2 同坐标、仅年份差 1 的**双胞盘**）。
//
// 用法：
//   import { SWEEP_MATRIX, getDisk, sweepTruthDiff } from './sweep-matrix.mjs';
//   SWEEP_MATRIX  → 13 个盘定义（含 truth）
//   getDisk('s13') → 单盘
//   sweepTruthDiff(disk.truth, engineTruth) → 差异数组（空 = 一致）
// ══════════════════════════════════════════════════════════════════════

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const RAW = JSON.parse(readFileSync(join(__dirname, 'sweep-matrix.json'), 'utf8'));

/** 13 盘基准矩阵（s1~s13），每项含 id/lang/name/edge/birth/time/lat/lon/tz/reportType/truth。 */
export const SWEEP_MATRIX = RAW.disks;

/** 注册表元信息（用途/编号沿革/覆盖维度/上次重算时间）。 */
export const SWEEP_META = RAW._meta;

/** 按编号取盘（如 getDisk('s13')）；未知编号返回 undefined。 */
export function getDisk(id) {
  return SWEEP_MATRIX.find((d) => d.id === id);
}

/**
 * 判据同源比较：注册表 truth vs 引擎实算 truth。
 * 逐行星比对「星座 + 宫位」，另比上升星座与上升度（容差 0.02°，浮点噪声）。
 * @returns {string[]} 差异描述列表；空数组 = 完全一致
 */
export function sweepTruthDiff(diskTruth, engineTruth) {
  const diffs = [];
  if (!diskTruth) return ['注册表 truth 缺失'];
  if (!engineTruth) return ['引擎 truth 缺失'];
  if (diskTruth.rising_sign !== engineTruth.rising_sign) {
    diffs.push(`rising_sign: 注册表=${diskTruth.rising_sign} 引擎=${engineTruth.rising_sign}`);
  }
  if (Math.abs((diskTruth.ascendant_deg ?? 0) - (engineTruth.ascendant_deg ?? 0)) > 0.02) {
    diffs.push(`ascendant_deg: 注册表=${diskTruth.ascendant_deg} 引擎=${engineTruth.ascendant_deg}`);
  }
  const keys = Object.keys(engineTruth.houses || {});
  if (keys.length === 0) diffs.push('引擎 houses 为空（引擎异常）');
  for (const p of keys) {
    const a = diskTruth.houses?.[p];
    const b = engineTruth.houses[p];
    if (!a) { diffs.push(`${p}: 注册表缺项`); continue; }
    if (a.sign !== b.sign || a.house !== b.house) {
      diffs.push(`${p}: 注册表=${a.sign} H${a.house} 引擎=${b.sign} H${b.house}`);
    }
  }
  return diffs;
}

/** sweep 盘池**设计意图**的可执行契约：每一类边界至少有一盘覆盖。 */
export const SWEEP_EDGE_TAGS = [
  'high-lat-aurora',  // 高纬极昼（等宫制降级链）
  'half-hour-dst',    // 半小时时区 + 夏令时
  'south-high-lat',   // 南半球高纬
  'fractional-tz',    // 非整数时区 +5:45
  'prime-meridian',   // 赤道 / 本初子午线（lon=0 零点陷阱）
  'date-line',        // 跨日界线 +13/+14
  'west-high-lat',    // 西半球高纬
  'dst-hole',         // DST 不存在时间（02:30 空洞）
  'native',           // 语种原生时区（对照组）
  'half-hour-tz',     // 半小时时区 +5:30
  'year-boundary',    // 跨年零点
];

/** 支持语种（sweep 覆盖要求：六语各 ≥2 盘）。 */
export const SWEEP_LANGS = ['zh', 'en', 'es', 'fr', 'th', 'vi'];
