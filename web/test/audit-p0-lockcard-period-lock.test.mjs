#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *  P0 闸门（2026-10-14）· 周期锁态「体面锁定卡」+ 现场留痕回跳 URL
 * ═══════════════════════════════════════════════════════════════════════════════
 *  缺陷史
 *    主公实测截屏 2026-10-14 08:26：月报**账号级月锁**命中后，报告页只渲染一行裸错误
 *    文本 + 「重试」按钮（点下去必然再次失败）⇒ 死胡同：用户既不知规则、也无路可走。
 *
 *  本闸门守备四件事（行为判据优先，静态判据仅作接线校验）
 *    A. 回跳 URL 构造：出生全参经 `buildWealthRestoreUrl` 白名单透传，**参数名以消费方为准**
 *    B. 🔴 空值守卫：`undefined / null / '' / 'undefined'` **绝不写入** ——
 *       否则 URL 被毒化（`lat=undefined`）⇒ 退回默认盘（曼谷）= 45-D1 同源暗雷；
 *       而 `lat=0` 等 **falsy 但合法**的值必须保留（falsy ≠ 非法）。
 *    C. 留痕读写：类型必须匹配（月报留痕不得被年报锁定卡消费）
 *    D. 接线：报告页两条错误路径（流式 SSE 错误帧 / 非流式 403）都必须走锁定卡；
 *       六语 i18n 锁定卡键齐全（缺任一 ⇒ 构建被 check-i18n-keys.mjs 拦下，此处提前暴露）。
 *
 *  注入反漂移（必须可判别）
 *    对纯核源码做**最小篡改**（摘掉空值守卫 / 改错码表），以 `data:` URL 重载变体模块，
 *    断言 B/C 组**必红**。仅重写模块头导入行为绝对 `file:` URL，被篡改段之外逐字未改。
 * ═══════════════════════════════════════════════════════════════════════════════
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const REPO = path.resolve(import.meta.dirname, '../..');
const LIB = path.join(REPO, 'web/src/lib/lastReportUrl.mjs');
const WEALTH_RESTORE = path.join(REPO, 'web/src/lib/wealthRestore.mjs');
const TSX = path.join(REPO, 'web/src/pages/WealthReportPage.tsx');
const LOCALES = path.join(REPO, 'web/src/i18n/locales');
const LANGS = ['zh', 'en', 'es', 'fr', 'th', 'vi'];

const SRC = fs.readFileSync(LIB, 'utf8');
const TSX_SRC = fs.readFileSync(TSX, 'utf8');

const mod = await import(pathToFileURL(LIB).href);

/** 极简内存 storage（行为测试用；不依赖 jsdom） */
function makeStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
    _dump: () => Object.fromEntries(m),
  };
}

/** 以最小篡改重载变体模块（仅重写导入行为绝对 file: URL，其余逐字未改） */
async function loadVariant(mutate) {
  const mutated = mutate(SRC).replace(
    "from './wealthRestore.mjs'",
    `from '${pathToFileURL(WEALTH_RESTORE).href}'`,
  );
  assert.notEqual(mutated, SRC, '注入必须真的改动源码（否则本组判据恒真）');
  const url = 'data:text/javascript;base64,' + Buffer.from(mutated).toString('base64');
  return import(url);
}

// ═════════════════════════════════════════════════════════════════════════════
//  A 组 · 回跳 URL 构造（行为）
// ═════════════════════════════════════════════════════════════════════════════

test('A1 全参透传：出生日期/时间/坐标/时区/语言全部进入回跳 URL，且落在报告页', () => {
  const url = mod.buildLastReportUrl('birth=1977-10-02&lang=zh', {
    birthDate: '1977-10-02', lang: 'zh',
    birthTime: '12:00', lat: 31.2304, lon: 121.4737, tz: 'Asia/Shanghai',
  });
  const u = new URL(url, 'https://x');
  assert.equal(u.pathname, '/wealth/report', '回跳必须落报告页');
  const q = u.searchParams;
  assert.equal(q.get('birth'), '1977-10-02');
  assert.equal(q.get('lang'), 'zh');
  assert.equal(q.get('time'), '12:00', '消费方标准名 time 必须带出');
  assert.equal(q.get('birthTime'), '12:00', '兼容名 birthTime 一并保留');
  assert.equal(q.get('lat'), '31.2304');
  assert.equal(q.get('lon'), '121.4737');
  assert.equal(q.get('tz'), 'Asia/Shanghai');
});

test('A2 参数名以消费方为准：lat/lon/tz（非 birthLat 变体）必须存在', () => {
  const url = mod.buildLastReportUrl('', {
    birthDate: '1990-01-01', lang: 'en', birthTime: '08:30', lat: 0.5, lon: -0.5, tz: 'UTC',
  });
  const q = new URL(url, 'https://x').searchParams;
  for (const k of ['lat', 'lon', 'tz', 'time']) {
    assert.ok(q.get(k), `消费方标准名 ${k} 缺失 ⇒ 报告页会退回默认盘`);
  }
});

// ═════════════════════════════════════════════════════════════════════════════
//  B 组 · 🔴 空值守卫（45-D1 同源暗雷封锁）
// ═════════════════════════════════════════════════════════════════════════════

test('B1 坐标缺失（undefined）⇒ URL **不得**出现 lat/lon/tz，且不得含字面 undefined', () => {
  const url = mod.buildLastReportUrl('birth=1990-01-01&lang=en', { birthDate: '1990-01-01', lang: 'en', birthTime: '12:00' });
  const q = new URL(url, 'https://x').searchParams;
  assert.equal(q.get('lat'), null, '坐标缺失时不得写入 lat（否则服务端回退默认盘）');
  assert.equal(q.get('lon'), null);
  assert.equal(q.get('tz'), null);
  assert.ok(!url.includes('undefined'), 'URL 被字面 undefined 毒化 ⇒ 默认盘暗雷');
});

test('B2 空串 / 字面 "undefined" / null 一律不写入', () => {
  const url = mod.buildLastReportUrl('', {
    birthDate: '1990-01-01', lang: 'en',
    birthTime: '', lat: 'undefined', lon: null, tz: '   ',
  });
  const q = new URL(url, 'https://x').searchParams;
  assert.equal(q.get('time'), null, "空串不得写入 time");
  assert.equal(q.get('lat'), null, "字面 'undefined' 不得写入 lat");
  assert.equal(q.get('lon'), null, 'null 不得写入 lon');
  assert.ok(!url.includes('undefined') && !url.includes('null'), 'URL 不得含 undefined/null 字面量');
});

test('B3 falsy 但合法：lat=0 / lon=0 必须保留（falsy ≠ 非法）', () => {
  const url = mod.buildLastReportUrl('birth=1990-01-01', {
    birthDate: '1990-01-01', lang: 'en', birthTime: '12:00', lat: 0, lon: 0, tz: 'UTC',
  });
  const q = new URL(url, 'https://x').searchParams;
  assert.equal(q.get('lat'), '0', 'lat=0（赤道）是合法值，不得被 falsy 吞掉');
  assert.equal(q.get('lon'), '0', 'lon=0（本初子午线）是合法值');
});

test('B4 birth/lang 缺省：由 fallback 兜底，不得出现空 birth 键', () => {
  const url = mod.buildLastReportUrl('birth=1988-08-08', { birthTime: '12:00' });
  const q = new URL(url, 'https://x').searchParams;
  assert.equal(q.get('birth'), '1988-08-08', 'fallback 必须兜住 birthDate');
  assert.ok(!/born?=|birth=(&|$)/.test(url), '不得出现空 birth 键');
});

// ═════════════════════════════════════════════════════════════════════════════
//  C 组 · 留痕读写（类型匹配）
// ═════════════════════════════════════════════════════════════════════════════

test('C1 存月报留痕 → 月报可读、年报读空（防错板块回跳）', () => {
  const st = makeStorage();
  mod.saveLastReport(st, 'monthly', { birthDate: '1990-01-01', lang: 'zh', birthTime: '12:00', lat: 1, lon: 2, tz: 'UTC' }, 'birth=1990-01-01&lang=zh');
  const m = mod.readLastReport(st, 'monthly');
  assert.ok(m.startsWith('/wealth/report?'), '月报留痕必须是报告页 URL');
  assert.ok(m.includes('lat=1') && m.includes('tz=UTC'), '留痕必须携带出生全参');
  assert.equal(mod.readLastReport(st, 'yearly'), '', '类型不匹配必须返回空串');
});

test('C2 脏留痕（非 JSON / 缺字段）不得抛异常', () => {
  const st = makeStorage();
  st.setItem(mod.KS_LAST_REPORT_KEY, '{not json');
  assert.equal(mod.readLastReport(st, 'monthly'), '');
  st.setItem(mod.KS_LAST_REPORT_KEY, JSON.stringify({ type: 'monthly' }));
  assert.equal(mod.readLastReport(st, 'monthly'), '', '缺 url 必须返回空串');
});

test('C3 storage 抛错（隐私模式）必须被吞——不得让锁定卡渲染崩溃', () => {
  const boom = {
    getItem: () => { throw new Error('denied'); },
    setItem: () => { throw new Error('denied'); },
  };
  assert.doesNotThrow(() => mod.saveLastReport(boom, 'monthly', { birthDate: 'x' }, ''));
  assert.equal(mod.readLastReport(boom, 'monthly'), '');
});

// ═════════════════════════════════════════════════════════════════════════════
//  D 组 · 判别式 + 接线 + i18n
// ═════════════════════════════════════════════════════════════════════════════

test('D1 isPeriodLockCode：只认月报/年报周期锁，其余（含日限流）一律不认', () => {
  assert.equal(mod.isPeriodLockCode('MONTHLY_WEALTH_REPORT_QUOTA_EXHAUSTED'), true);
  assert.equal(mod.isPeriodLockCode('YEARLY_WEALTH_REPORT_QUOTA_EXHAUSTED'), true);
  assert.equal(mod.isPeriodLockCode('DAILY_WEALTH_RATE_LIMIT_EXCEEDED'), false, '日限流不是周期锁（不得渲染锁定卡）');
  assert.equal(mod.isPeriodLockCode('INVALID_COORDINATES'), false);
  assert.equal(mod.isPeriodLockCode(undefined), false);
  assert.equal(mod.isPeriodLockCode(''), false);
});

test('D2 报告页接线：**三条**错误路径（挂载自动加载 / 流式 / 非流式）都必须走锁定卡', () => {
  const hits = (TSX_SRC.match(/setLockInfo\(/g) || []).length;
  // 3 处调用（loadWealthData 挂载自动加载 / generateWealthReport 流式错误帧 / 非流式 403）
  assert.ok(hits >= 3, `setLockInfo 调用应 ≥3（挂载 / 流式 / 非流式），实为 ${hits}`);
  assert.ok(TSX_SRC.includes('isPeriodLockCode('), '必须以判别式路由（禁写死码表副本）');
  assert.ok((TSX_SRC.match(/isPeriodLockCode\(/g) || []).length >= 3, 'isPeriodLockCode 必须在三条路径各出现一次');
  assert.ok(/lockInfo\s*&&\s*!reportData/.test(TSX_SRC), '锁定卡必须在无报告数据时优先渲染');
  assert.ok(TSX_SRC.includes('wealthReport.lockedViewGenerated'), '锁定卡必须提供「查看已生成报告」');
  assert.ok(TSX_SRC.includes('wealthReport.lockedBackToEdit'), '锁定卡必须提供「返回修改」出口（防再次死胡同）');
});

test('D3 生成成功必须留痕（挂载 / 流式 / 非流式成功路径全覆盖）', () => {
  const gen = (TSX_SRC.match(/_ksSaveLastReport\(type, \{ birthDate: _stableBirth, lang: _stableLang, \.\.\._bp \}\)/g) || []).length;
  assert.ok(gen >= 2, `generateWealthReport 两路留痕调用（..._bp 展开形态）应 ≥2，实为 ${gen}`);
  assert.ok(TSX_SRC.includes("_ksSaveLastReport('monthly', { birthDate: birth, lang, ..._bp });"), '挂载自动加载（monthly）成功必须留痕');
  // 🔴 r11u 契约：请求体 `birthTime: _bp.birthTime` 恰 4 处（loadWealthData/流式主请求/fallback/旧非流式）
  //   留痕调用禁用该字面量（会污染 r11u 计数）——必须用 `..._bp` 展开。
  //   判据按项目铁律**剥注释后计数**（真值块），避免注释里的字面量造成假阳。
  const stripped = TSX_SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  const literalHits = (stripped.match(/birthTime: _bp\.birthTime/g) || []).length;
  assert.equal(literalHits, 4, `请求体 _bp 直读必须恰 4 处（r11u 钉死），实为 ${literalHits}（留痕调用须用 ..._bp 展开）`);
});

test('D4 六语 i18n：锁定卡 7 键齐全（缺任一 ⇒ 构建期 check-i18n-keys 会拦下）', () => {
  const keys = ['lockedMonthlyTitle', 'lockedMonthlyDesc', 'lockedYearlyTitle', 'lockedYearlyDesc',
    'lockedNextAvailable', 'lockedViewGenerated', 'lockedBackToEdit'];
  const missing = [];
  for (const lang of LANGS) {
    const p = path.join(LOCALES, `${lang}.json`);
    if (!fs.existsSync(p)) { missing.push(`${lang}.json 缺失`); continue; }
    const loc = JSON.parse(fs.readFileSync(p, 'utf8'));
    const wr = loc.wealthReport || {};
    for (const k of keys) {
      if (typeof wr[k] !== 'string' || !wr[k].length) missing.push(`${lang}: wealthReport.${k}`);
    }
  }
  assert.deepEqual(missing, [], `i18n 锁定卡文案缺失：\n  - ${missing.join('\n  - ')}`);
});

test('D5 formatLockDate：合法 ISO 本地化、非法/空值返回空串（调用方据此不渲染该行）', () => {
  const zh = mod.formatLockDate('2026-11-01T00:00:00.000Z', 'zh');
  assert.ok(/2026/.test(zh) && /11/.test(zh), `中文日期应含年份与 11 月，实为 ${zh}`);
  assert.equal(mod.formatLockDate(null, 'zh'), '');
  assert.equal(mod.formatLockDate('not-a-date', 'zh'), '');
  assert.equal(mod.formatLockDate('', 'en'), '');
});

// ═════════════════════════════════════════════════════════════════════════════
//  E 组 · 注入反漂移（篡改 ⇒ 必红）
// ═════════════════════════════════════════════════════════════════════════════

test('E1 注入：摘掉字面量守卫（undefined/null/NaN）⇒ B2 判据必红（证明守卫真的在起作用）', async () => {
  const v = await loadVariant((s) => s.replace(
    "if (!s || s === 'undefined' || s === 'null' || s === 'NaN') return;",
    'if (!s) return;',
  ));
  const url = v.buildLastReportUrl('', { birthDate: '1990-01-01', lang: 'en', lat: 'undefined' });
  assert.ok(url.includes('lat=undefined'), '摘掉守卫后必须出现 undefined 毒化（否则判据无区分力）');
});

test('E2 注入：码表改错（只认月报）⇒ 年报周期锁判别必红', async () => {
  const v = await loadVariant((s) => s.replace("  'YEARLY_WEALTH_REPORT_QUOTA_EXHAUSTED',\n", ''));
  assert.equal(v.isPeriodLockCode('MONTHLY_WEALTH_REPORT_QUOTA_EXHAUSTED'), true);
  assert.equal(v.isPeriodLockCode('YEARLY_WEALTH_REPORT_QUOTA_EXHAUSTED'), false, '摘掉年报码后必须不再识别（判据可判别）');
});

test('E3 注入：留痕类型校验摘掉 ⇒ C1 类型不匹配判据必红', async () => {
  const v = await loadVariant((s) => s.replace('o.type === type && ', ''));
  const st = makeStorage();
  v.saveLastReport(st, 'monthly', { birthDate: '1990-01-01', lang: 'zh' }, 'birth=1990-01-01');
  assert.notEqual(v.readLastReport(st, 'yearly'), '', '摘掉类型校验后年报会读到月报留痕（脏读）');
});
