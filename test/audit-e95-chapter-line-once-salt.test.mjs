#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// 🔴 E95（主公军令 2026-10-26）：拔除章节标题金色短竖线／$4.99 八字硬锁防回潮／缓存防污染
//   ① 月报/年报章节头「第」字左侧 border-left 金竖线退役（保留下方金色分隔底线）
//   ② once 档 reportId 掺版本盐 e95_bazi_lock ⇒ E92 锁前旧存量（亥卯未/丑未冲幻觉）
//      一次性作废，强制走带 _E92CompatBaziLock 的新生成管道
// 判据口径：②含行为级测试（VM 实跑 deriveCompatReportId 盐分流＋_E92CompatBaziLock 军令用例）。
// ═══════════════════════════════════════════════════════════════
import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SERVER = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
const ADV = fs.readFileSync(path.join(ROOT, 'api/ai-advisor.js'), 'utf8');
const APP_CSS = fs.readFileSync(path.join(ROOT, 'web/src/App.css'), 'utf8');
const PIPELINE = fs.readFileSync(path.join(ROOT, 'lib/reportPipeline.mjs'), 'utf8');
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

// VM 抽取（花括号配平，同 e92/e94 闸门口径）
function fnBody(src, anchor) {
  const i = src.indexOf(anchor);
  if (i === -1) throw new Error(`fn anchor missing: ${anchor}`);
  let depth = 0, started = false;
  for (let j = src.indexOf('{', i); j < src.length; j++) {
    if (src[j] === '{') { depth++; started = true; }
    else if (src[j] === '}') { depth--; if (started && depth === 0) return src.slice(i, j + 1); }
  }
  throw new Error(`unbalanced fn: ${anchor}`);
}

test('E95-①-1 章节头金竖线退役：.ks-report-chapter 无 border-left 竖线与 padding-left', () => {
  const i = APP_CSS.indexOf('.ks-report-chapter');
  assert.ok(i > 0, '.ks-report-chapter 类缺失');
  const seg = APP_CSS.slice(i, APP_CSS.indexOf('}', i) + 1);
  assert.ok(!/border-left\s*:\s*\d+px/.test(seg), '章节头仍残留 border-left 竖线');
  assert.ok(seg.includes('border-left: none'), '未显式声明 border-left: none');
  assert.ok(!/padding-left/.test(seg), '章节头仍残留 padding-left（竖线让位缩进）');
  // 下方金色分隔底线保留（军令：仅拔左竖线）
  assert.ok(/border-bottom\s*:\s*1px solid/.test(seg), '金色分隔底线被误拔');
});

test('E95-①-2 姻缘章节头无伪元素竖条（::before 通道排查）', () => {
  // .ks-report-chapter 不得带 ::before 竖条（军令嫌疑②）
  assert.ok(!/\.ks-report-chapter::before/.test(APP_CSS), '章节头存在 ::before 伪元素竖条');
});

test('E95-②-1 行为级：deriveCompatReportId 版本盐分流（once 掺盐⇒新 ID；无盐幂等保留）', async () => {
  // 直接 import 真模块（非 VM 抽取——纯函数无外部依赖）
  const { deriveCompatReportId } = await import(path.join(ROOT, 'lib/reportPipeline.mjs'));
  const base = {
    reportType: 'once', lang: 'zh', d1: '1976-12-03', d2: '1997-10-18',
    bazi: { score: 80 }, zodiac: { score: 75 }, iching: { score: 90 },
    tarot: { name: '审判' }, zodiacMeta: null, userBirthDate: null,
  };
  const idOld = deriveCompatReportId(base); // 无盐（E92 前旧口径）
  const idNew = deriveCompatReportId({ ...base, promptSalt: 'e95_bazi_lock' });
  assert.notEqual(idOld, idNew, 'once 掺盐后 ID 必须变化（旧存量未作废）');
  // 幂等：同盐同输入 ⇒ 同 ID
  assert.equal(idNew, deriveCompatReportId({ ...base, promptSalt: 'e95_bazi_lock' }), '盐幂等破坏');
  // 月报/年报不掺盐 ⇒ 与旧口径同 ID（防 live 周期锁误伤已购用户）
  const mBase = { ...base, reportType: 'monthly' };
  assert.equal(
    deriveCompatReportId(mBase),
    deriveCompatReportId({ ...mBase, promptSalt: null }),
    '月报不应掺盐（射程违规）',
  );
});

test('E95-②-2 server 端接线：Gate41 调用处对 once 档传盐（月/年 null）', () => {
  const hStart = SERVER.indexOf("app.use('/api/ai-advisor'");
  const hEnd = SERVER.indexOf("app.use((req, res, next)", hStart);
  const handler = SERVER.slice(hStart, hEnd);
  assert.ok(
    handler.includes("promptSalt: reportType === 'once' ? 'e95_bazi_lock' : null"),
    'once 版本盐未接线 Gate41 调用处',
  );
});

test('E95-②-3 行为级：军令用例八字硬锁真值（男 1976-12-03 03:00／女 1997-10-18 12:00）', () => {
  const fn = fnBody(SERVER, 'function _E92CompatBaziLock');
  const _E92CompatBaziLock = new Function(`${fn}\nreturn _E92CompatBaziLock;`)();
  const bl = _E92CompatBaziLock('1976-12-03', '1997-10-18', '03:00', '12:00');
  assert.ok(bl && typeof bl.lock === 'string' && typeof bl.guard === 'string', '锁结构异常');
  // 真实日柱（JDN 三铁锚裁决：男己丑／女癸巳——军师示例庚寅/甲戌有误）
  assert.ok(bl.lock.includes('己丑'), '男日柱己丑缺失');
  assert.ok(bl.lock.includes('癸巳'), '女日柱癸巳缺失');
  // 跨盘真实刑冲在场（辰戌冲／亥巳冲）
  assert.ok(/辰.{0,12}戌.{0,8}冲|戌.{0,12}辰.{0,8}冲/.test(bl.lock), '辰戌冲真值缺失');
  assert.ok(/亥.{0,12}巳.{0,8}冲|巳.{0,12}亥.{0,8}冲/.test(bl.lock), '亥巳冲真值缺失');
  // 幻觉地支红线：本盘无卯无未 ⇒ 锁红线禁令在场（「除本锁列出外一律不得提及」）
  assert.ok(/一律不得提及|NEVER fabricate|不得捏造/.test(bl.lock), '红线禁令缺失');
});

test('E95-③-1 $4.99 once 生成管道硬锁完备：server 透传＋buildCompatPrompt 消费（双端镜像）', () => {
  // server 端：once 分支（buildCompatibilityReportPrompt）透传 baziLock（E92 已接线，E95 复核防回潮）
  const hStart = SERVER.indexOf("app.use('/api/ai-advisor'");
  const hEnd = SERVER.indexOf("app.use((req, res, next)", hStart);
  const handler = SERVER.slice(hStart, hEnd);
  assert.ok(handler.includes('_e92BL = _E92CompatBaziLock(d1, d2'), '服务端锁计算缺失');
  const elseBranch = handler.slice(handler.indexOf('buildCompatibilityReportPrompt(d1, d2'));
  assert.ok(elseBranch.slice(0, 800).includes('baziLock: _e92BL'), 'once 分支（else）未透传 baziLock');
  // api 端：lock 进 user 头、guard 进 system（消费链）
  assert.ok(ADV.includes("bl ? bl.lock : ''"), 'lock 未并入 user 头部');
  assert.ok(ADV.includes("(blGuard ? `\\n\\n${blGuard}` : '')"), 'guard 未并入 system');
  // 镜像同步（e40 军规）
  const ADV_WEB = fs.readFileSync(path.join(ROOT, 'web/api/ai-advisor.js'), 'utf8');
  assert.strictEqual(ADV, ADV_WEB, '镜像漂移（web/api 未同步）');
});

test('E95-⑤-1 闸门接线：test:astro 含本闸门（72 段）＋入编位（e94 后、e40 前、python 链尾）', () => {
  const chain = PKG.scripts['test:astro'] || '';
  assert.ok(chain.includes('audit-e95-chapter-line-once-salt.test.mjs'), '本闸门未接线 test:astro');
  const parts = chain.split('&&').map((s) => s.trim());
  assert.equal(parts.length, 73, `链段数异常（实得 ${parts.length}，基线 73（E97-④ 升 73 段））`);
  const iE95 = parts.findIndex((p) => p.includes('audit-e95-'));
  const iE94 = parts.findIndex((p) => p.includes('audit-e94-'));
  const iE40 = parts.findIndex((p) => p.includes('audit-e40-compat-synastry-tensor-fusion'));
  const iPy = parts.findIndex((p) => p.includes('python3'));
  assert.ok(iE94 !== -1 && iE95 > iE94, 'E95 须在 E94 之后');
  assert.ok(iE40 > iE95, 'E95 须在 e40-compat 之前（收口位军规）');
  assert.ok(iE40 === parts.length - 2, 'e40 恒 len-2 被破坏');
  assert.ok(iPy === parts.length - 1, 'python 恒链尾被破坏');
});
