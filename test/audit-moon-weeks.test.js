// 🛠️ V433 回归门：月亮「周级真值」（方案 A）
//
// 【病根】月亮 ~13.2°/天、2.5 天换一座 → 月中单点快照无法支撑周级陈述。
//   实测（1988-12-31 Chatham / 2026-09）：快照 Moon=Scorpio H2，真值 W1=Aries→Cancer、
//   W4=Aquarius→Taurus；生产报告却把快照写进 W1/W3/W4+陷阱段共 5 处。
//   且生产早已喂「扁平换座日期表」+ V232 负向规则 —— 仍被违反（模型要自己把日期归周次）。
//
// 【本套件验什么】
//   ① 引擎自证：python --moon-weeks-selftest（5 分钟步进独立复算 + 腿级比对 + 已知好/坏样本）
//   ② 结构真值：Chatham 盘 2026-09 周级星座序列/换座分钟为硬锚点
//   ③ 成本闸门：仅首月计算 moon_weeks（12 月全算纯属浪费）
//   ④ 静态守卫：Prompt 侧「周级真值块 + 快照警示」存在（防误删回归）
//   ⑤ 渲染守卫：数据块给月亮打 *snap* 标记 + 顶部 legend（干掉快照锚点）
import { test, describe } from 'node:test';
import assert from 'node:assert';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPerMonthDataBlock } from '../v69_client.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PY = path.join(ROOT, 'astro', 'astro_matrix.py');

// 极东时区 + 跨日/跨月边界：1988-12-31 23:59 Pacific/Chatham
const CHART = {
  birthDate: '1988-12-31', birthTime: '23:59',
  lat: -43.9536, lon: -176.5463, tz: 'Pacific/Chatham',
};

function runMatrix(months = 2) {
  const r = spawnSync('python3', [
    PY, '2026', '9', 'Virgo',
    '--birth-date', CHART.birthDate, '--birth-time', CHART.birthTime,
    '--lat', String(CHART.lat), '--lon', String(CHART.lon),
    '--tz', CHART.tz, '--months', String(months),
  ], { encoding: 'utf8', timeout: 180000, cwd: ROOT });
  assert.strictEqual(r.status, 0, '引擎调用失败: ' + (r.stderr || '').slice(0, 400));
  return JSON.parse(r.stdout);
}

describe('V433 月亮周级真值', () => {
  test('① 引擎自证：--moon-weeks-selftest 通过（独立复算 + 腿级比对 + 已知好/坏样本）', () => {
    const r = spawnSync('python3', [PY, '--moon-weeks-selftest'], {
      encoding: 'utf8', timeout: 180000, cwd: ROOT,
    });
    const out = (r.stdout || '') + (r.stderr || '');
    assert.ok(/self_test 结论: ✅/.test(out), '自证未通过:\n' + out.slice(0, 1200));
    assert.strictEqual(r.status, 0, '自证退出码非 0');
    assert.ok(/腿序列完全一致/.test(out), '缺少腿级比对结果');
  });

  test('② 结构真值：Chatham 2026-09 周级星座序列硬锚点', () => {
    const m = runMatrix(2);
    const w = m.months[0].moon_weeks;
    assert.ok(Array.isArray(w) && w.length === 4, 'moon_weeks 应为 4 周');
    const signs = (i) => {
      const out = [];
      for (const lg of w[i].legs) if (out[out.length - 1] !== lg.sign) out.push(lg.sign);
      return out;
    };
    assert.deepStrictEqual(signs(0), ['Aries', 'Taurus', 'Gemini', 'Cancer'], 'W1 真值错');
    assert.deepStrictEqual(signs(1), ['Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio'], 'W2 真值错');
    assert.deepStrictEqual(signs(2), ['Scorpio', 'Sagittarius', 'Capricorn'], 'W3 真值错');
    assert.deepStrictEqual(signs(3), ['Capricorn', 'Aquarius', 'Pisces', 'Aries', 'Taurus'], 'W4 真值错');
    // 已知坏样本：快照星座（Scorpio）不得出现在 W1/W4（快照当全月必错）
    assert.ok(!signs(0).includes('Scorpio'), 'W1 混入快照星座');
    assert.ok(!signs(3).includes('Scorpio'), 'W4 混入快照星座');
    // 换座时刻硬锚点（本地时区，二分法到分钟）
    const ing = w[0].changes.filter((c) => c.kind === 'sign');
    assert.deepStrictEqual(
      ing.map((c) => `${c.day} ${c.time} ${c.to_sign}`),
      ['1 20:46 Taurus', '4 00:32 Gemini', '6 03:15 Cancer'],
      'W1 换座时刻/星座错',
    );
    // 跨宫腿必须存在且合法（同星座跨两宫 = 宫位制的数学必然）
    assert.ok(
      w.some((x) => x.legs.some((lg, i) => i > 0 && lg.sign === x.legs[i - 1].sign && lg.house !== x.legs[i - 1].house)),
      '未采到「同星座跨宫」腿',
    );
    for (const x of w) {
      for (const c of x.changes) {
        assert.ok(['sign', 'cusp'].includes(c.kind), 'change.kind 非法');
        assert.ok(c.to_sign && c.to_house >= 1 && c.to_house <= 12, 'change 目标值非法');
      }
    }
  });

  test('③ 成本闸门：仅首月计算 moon_weeks', () => {
    const m = runMatrix(3);
    assert.ok(m.months[0].moon_weeks, '首月必须有 moon_weeks');
    for (let i = 1; i < m.months.length; i++) {
      assert.strictEqual(m.months[i].moon_weeks, null, `第 ${i + 1} 月不应计算 moon_weeks（浪费算力）`);
    }
  });

  test('④ 静态守卫：Prompt 侧周级真值块 + 快照警示存在', () => {
    const srv = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
    assert.ok(srv.includes('WEEK-SCOPED MOON TRUTH'), '缺周级真值块');
    assert.ok(srv.includes('MID-MONTH SNAPSHOT'), '缺快照警示');
    assert.ok(/_moonWeeks|moon_weeks/.test(srv), '缺 moon_weeks 读取');
    // 周级真值块必须取「首月」数据
    assert.ok(/months\?\.\[0\]\?\.moon_weeks/.test(srv), '周级真值未取首月');
    // V232 规则已升级为「以周级块为准」
    assert.ok(/WEEK-SCOPED MOON TRUTH block \(that week's line\)/.test(srv), 'V232 规则未指向周级块');
  });

  test('⑤ 渲染守卫：数据块月亮打 *snap* 标记 + legend 说明', () => {
    const fake = {
      months: [{
        month_name: 'Sep 2026',
        sun: { sign: 'Virgo', house: 1 },
        moon: { sign: 'Scorpio', house: 2 },
        mercury: { sign: 'Libra', house: 1, retrograde: false },
        w1: { sign: 'Virgo', house: 1 },
        w2: { sign: 'Virgo', house: 1 },
        w3: { sign: 'Virgo', house: 1 },
        w4: { sign: 'Libra', house: 1 },
      }],
    };
    const out = buildPerMonthDataBlock(fake, 'zh');
    assert.ok(out.includes('Moon=天蝎座(H2)*snap*'), '月亮未打快照标记: ' + out);
    assert.ok(/MID-MONTH SNAPSHOT/.test(out), '缺 legend 快照说明');
    assert.ok(out.includes('MOON PER-WEEK TRUTH'), 'legend 未指向周级真值块名');
    // 非月亮行星不得被误标
    assert.ok(!/Mercury=[^*]*\*snap\*/.test(out), '非月亮行星被误标快照');
    // 🛠️ V433-fix 回归：本地化字典必须真正生效（SIGN_NAMES 缩写表 indexOf 全称 = -1 的致命死代码）
    assert.ok(out.includes('Sun=处女座(H1)'), 'zh 太阳名未本地化（SIGN_NAMES 死代码回归）: ' + out);
    assert.ok(out.includes('w1=处女座(H1)'), 'zh 周太阳名未本地化: ' + out);
    const es = buildPerMonthDataBlock(fake, 'es');
    assert.ok(es.includes('Moon=Escorpio(H2)*snap*'), 'es 月亮名未本地化: ' + es);
    assert.ok(es.includes('Sun=Virgo(H1)'), 'es 太阳名异常');
  });

  test('⑥ 安全边界：无 moon_weeks 时渲染不炸（老数据/无出生时间）', () => {
    const fake = { months: [{ month_name: 'Sep 2026', sun: { sign: 'Virgo', house: 1 }, moon: { sign: 'Scorpio', house: 2 } }] };
    const out = buildPerMonthDataBlock(fake, 'en');
    assert.ok(typeof out === 'string' && out.length > 0, '渲染异常');
    assert.ok(out.includes('Moon=Scorpio(H2)*snap*'), '缺省快照标记丢失');
    assert.ok(out.includes('Sun=Virgo(H1)'), '英文渲染异常');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// V433 注入点守卫：必须在「活代码」路径上（血泪：V383 月亮换座表 + 首次 V433
// 注入都落在了 buildMonthlyPrompt —— 全仓零调用点的死代码里 → 零效果）
// ═══════════════════════════════════════════════════════════════════════════
test('V433 注入点在活路径 + 死代码防线', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
  const liveStart = src.indexOf('function buildWealthReportPrompt');
  const liveEnd = src.indexOf('function buildCompatibilityReportPrompt');
  assert.ok(liveStart > 0 && liveEnd > liveStart, '未能定位 live 月报构造器');
  const live = src.slice(liveStart, liveEnd);

  assert.ok(live.includes('const monthlyDataBlockMoon'), 'live 分支缺 monthlyDataBlockMoon');
  const refs = (live.match(/\$\{monthlyDataBlockMoon\}/g) || []).length;
  assert.equal(refs, 6, `六语种月报模板应全部引用周级块，实际 ${refs} 处`);
  assert.ok(live.includes('MOON PER-WEEK TRUTH'), 'live 分支缺 V433 硬规则');
  assert.ok(live.includes('buildMoonWeekBlock('), 'live 分支未调用 buildMoonWeekBlock');
  assert.ok(!/\$\{monthlyDataBlock\}\s*\n/.test(live.split('function buildMonthlyPrompt')[0]),
    'live 分支仍在直接使用原始数据块（快照锚点未摘）');

  // 死代码防线：live 月报构造器必须有多个调用点；死掉的 buildMonthlyPrompt 必须带警示
  const liveCalls = (src.match(/buildWealthReportPrompt\(/g) || []).length;
  assert.ok(liveCalls >= 3, `live 月报构造器调用点异常: ${liveCalls}（定义1 + 调用≥2）`);
  const deadBlock = src.slice(src.indexOf('function buildMonthlyPrompt'), src.indexOf('function buildWealthOncePrompt'));
  assert.ok(deadBlock.includes('死代码'), 'buildMonthlyPrompt 缺死代码警示注释（后来人易再踩）');
});
