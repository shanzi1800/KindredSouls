#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// 🔴 E92（主公军令 2026-10-25）：姻缘三报告 Prompt 深度精修闸门
//   ① 八字地支硬锁（杜绝「亥卯未三合/丑未相冲」幻觉——payload 从未传四柱真值）
//   ② 塔罗三档抽卡解耦（终结「全盘女皇逆位」——hash 只掺今日 ⇒ 同日三报必然同卡）
//   ③ 代词温度规范（禁「XXXX年一方」档案式机械代词）
// 判据口径：① 含**行为级**测试——VM 抽取 _E92CompatBaziLock 以军令测试用例
//   （男 1976-12-03 03:00 / 女 1997-10-18 12:00）实跑四柱与刑冲合害断言。
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
const APP = fs.readFileSync(path.join(ROOT, 'web/src/App.tsx'), 'utf8');
const TAROT = fs.readFileSync(path.join(ROOT, 'web/src/lib/tarot.ts'), 'utf8');
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

// VM 抽取（花括号配平，同 e89 探针口径）
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

test('E92-①-1 八字硬锁函数存在＋常量全部内置（VM 抽取铁律）', () => {
  assert.ok(SERVER.includes('function _E92CompatBaziLock(d1, d2, tA, tB)'), '锁函数缺失');
  const fn = fnBody(SERVER, 'function _E92CompatBaziLock');
  for (const c of ['const TG', 'const DZ', 'const TERM', 'const HU_DUN', 'const CHONG', 'const LIUHE', 'const SANHE', 'const XING']) {
    assert.ok(fn.includes(c), `常量未内置（VM 抽取会 ReferenceError）：${c}`);
  }
  assert.ok(fn.includes('_jdn'), 'JDN 日柱算法缺失');
  assert.ok(fn.includes('return null'), '解析失败兜底缺失（绝不伪造铁律）');
  assert.ok(fn.includes('[BAZI DATA LOCK'), '锁文本头缺失');
});

test('E92-①-2 行为级：军令测试用例四柱＋真实刑冲合害（JDN 三铁锚公式核验）', () => {
  const fn = fnBody(SERVER, 'function _E92CompatBaziLock');
  const _E92CompatBaziLock = new Function(`${fn}\nreturn _E92CompatBaziLock;`)();
  // 口径：日柱以 (JDN+49)%60 公式链核验——三铁锚 1900-01-01=甲戌 / 1949-10-01=甲子 /
  // 2000-01-01=戊午 逐一对齐；军师示例的男日柱「庚寅」/女日柱「甲戌」经三锚核验为
  // 其工具偏差（男=次日、女差19天），以历法真值为准。
  const bl = _E92CompatBaziLock('1976-12-03', '1997-10-18', '03:00', '12:00');
  assert.ok(bl && typeof bl.lock === 'string' && typeof bl.guard === 'string', '锁结构异常');
  // 男方四柱：丙辰年 己亥月 己丑日 丙寅时（年/月柱与军师一致；日/时柱历法真值）
  for (const p of ['丙辰', '己亥', '己丑', '丙寅']) assert.ok(bl.lock.includes(p), `男方四柱 ${p} 缺失`);
  // 女方四柱：丁丑年 庚戌月 癸巳日 戊午时（年/月柱与军师一致；日/时柱历法真值）
  for (const p of ['丁丑', '庚戌', '癸巳', '戊午']) assert.ok(bl.lock.includes(p), `女方四柱 ${p} 缺失`);
  // 军令验收硬指标：真实辰戌冲＋寅午合（盘中真有辰/戌/寅/午）
  assert.ok(bl.lock.includes('辰戌相冲'), '辰戌相冲未识别（军令验收硬指标）');
  assert.ok(bl.lock.includes('寅午半合'), '寅午半合未识别（军令验收硬指标）');
  // 幻觉禁令：盘中无卯无未 ⇒ 锁内不得出现亥卯未三合/丑未相冲
  assert.ok(!bl.lock.includes('亥卯未'), '幻觉残留：亥卯未出现（盘中无卯）');
  assert.ok(!bl.lock.includes('丑未相冲'), '幻觉残留：丑未相冲出现（盘中无未）');
  // 解析失败 ⇒ null（真值纪律）
  assert.strictEqual(_E92CompatBaziLock('不是日期', '1997-10-18', '', ''), null, '脏输入应返回 null');
  // 无时辰 ⇒ 三柱如实（不补时柱）
  const bl3 = _E92CompatBaziLock('1976-12-03', '1997-10-18', '', '');
  assert.ok(bl3 && !bl3.lock.includes('时柱'), '无时辰不应补时柱');
});

test('E92-①-3 端点接线：三档 extras 均注入 baziLock（timeTruth 优先/t1t2 兜底）', () => {
  const i = SERVER.indexOf('const _e92BL = _E92CompatBaziLock(d1, d2, _e92TtA, _e92TtB)');
  assert.ok(i > 0, '端点锁计算缺失');
  // 🔴 E97 后继化：E97-① maxTokens 注释块＋语种分流表达式拉长段距（实测第三注入 2647）⇒ 窗口 2600 → 3000。
  const seg = SERVER.slice(i, i + 3000);
  assert.equal((seg.match(/baziLock: _e92BL,/g) || []).length, 3, '三档 extras 注入不全');
  assert.ok(SERVER.includes('baziLock: x.baziLock || null,'), 'once/oracle 通道透传缺失');
  assert.ok(SERVER.includes("req.body && typeof req.body.t1 === 'string'"), 't1 兜底缺失');
});

test('E92-①-4 三构造器消费 lock/guard（缺省 ⇒ 不注入，绝不伪造）', () => {
  const fnM = fnBody(SERVER, 'function buildCompatMonthlyFourModulePrompt');
  assert.ok(fnM.includes('x.baziLock') && fnM.includes('sysLines.push(bl.guard)') && fnM.includes('lockLines.push(bl.lock)'),
    '月报构造器锁消费缺失');
  const fnY = fnBody(SERVER, 'function buildCompatYearlyFiveChapterPrompt');
  assert.ok(fnY.includes('x.baziLock') && fnY.includes('sysLines.push(bl.guard)') && fnY.includes('lockLines.push(bl.lock)'),
    '年报构造器锁消费缺失');
  // oracle/insight（$4.99）通道：ai-advisor.js buildCompatPrompt 消费 o.baziLock
  assert.ok(ADV.includes("o.baziLock && typeof o.baziLock.lock === 'string'"), 'oracle 通道锁消费缺失');
  assert.ok(ADV.includes('const blGuard'), 'oracle 通道 guard 变量缺失');
  assert.ok(ADV.includes("bl ? bl.lock : ''"), 'oracle 通道 lock 未入 user head');
});

test('E92-③-1 代词温度规范入 guard（禁机械年份代词）', () => {
  const fn = fnBody(SERVER, 'function _E92CompatBaziLock');
  assert.ok(fn.includes('代词温度规范'), '代词温度规范缺失');
  assert.ok(fn.includes('XXXX年一方'), '机械代词禁令缺失');
  assert.ok(fn.includes('WARM DESIGNATION RULE'), '非语种指引缺失');
});

test('E92-②-1 塔罗 scope 掺盐（三档独立卡槽，财富塔罗零牵连）', () => {
  assert.ok(TAROT.includes("scope: string = 'insight'"), 'getTarot scope 参数缺失');
  assert.ok(TAROT.includes("'|' + (scope || 'insight')"), 'hash 掺盐缺失（撞车根因未拔）');
  assert.ok(TAROT.includes('function getWealthTarot'), '财富塔罗误伤（射程违规）');
});

test('E92-②-2 App 报告调用传档位盐＋洞察调用保持默认＋洞察请求补 t1/t2', () => {
  assert.ok(APP.includes('getTarot(d1, d2, lang, type)'), '报告调用未传档位盐');
  assert.ok(APP.includes('const tarot = getTarot(d1, d2, lang);\n      const res = await fetch'), '洞察调用形态被误改（应保持默认 insight）');
  assert.ok(APP.includes('tarot, t1, t2 }'), '洞察请求未补 t1/t2 出生时辰');
});

test('E92-⑤-1 闸门接线：test:astro 含本闸门（69 段）＋入编位（e91 后、e40 前、python 链尾）', () => {
  const chain = PKG.scripts['test:astro'] || '';
  assert.ok(chain.includes('audit-e92-bazi-tarot-pronoun.test.mjs'), '本闸门未接线 test:astro');
  const parts = chain.split('&&').map((s) => s.trim());
  assert.equal(parts.length, 83, `链段数异常（实得 ${parts.length}，基线 79（E103/E104 升 79 段））`);   // 🛡️ E103/E104 后继化：77→79
  const iE92 = parts.findIndex((p) => p.includes('audit-e92-'));
  const iE91 = parts.findIndex((p) => p.includes('audit-e91-'));
  const iE40 = parts.findIndex((p) => p.includes('audit-e40-compat-synastry-tensor-fusion'));
  const iPy = parts.findIndex((p) => p.includes('python3'));
  assert.ok(iE91 !== -1 && iE92 > iE91, 'E92 须在 E91 之后');
  assert.ok(iE40 > iE92, 'E92 须在 e40-compat 之前（收口位军规）');
  assert.ok(iE40 === parts.length - 2, 'e40 恒 len-2 被破坏');
  assert.ok(iPy === parts.length - 1, 'python 恒链尾被破坏');
});
