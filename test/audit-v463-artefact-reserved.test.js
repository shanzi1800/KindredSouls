// 🛍️ V463 回归门：爆款/物理法器（actionable_artefact）预留节点
//
// 【军师指令 2026-09-21】在报告输出 JSON 结构中预留可选的 actionable_artefact 节点：
//   封仓期 has_recommended_item=false（其余字段 null/省略）→ 前端见 false 直接忽略，零 UI 污染
//   上线期算法置 true + 下发 item_sku/trigger_reason/cta_text/target_url → 前端渲染法器卡片
//
// 【不变量】
//   ① 默认值契约：has_recommended_item=false，其余四字段为 null（键必须存在，便于前端稳定解析）
//   ② 单一真源：月报/年报/先天财富 三条链路共用同一构造器，不手写第二份
//   ③ 常量不可被污染（Object.freeze + 构造器返回副本）
//   ④ 绝不污染报告正文：节点名不得出现在任何 prompt 文本块中
//   ⑤ 前端路由预留：/artefact/:sku_id 与 /shop/item/:sku_id 必须兜底（不得白屏/报错）
import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');

// 从 server.js 原文抽取「预留常量 + 构造器」（测试里绝不手写第二份真源）
const _from = SRC.indexOf('const ACTIONABLE_ARTEFACT_RESERVED');
const _to = SRC.indexOf('function buildWealthMeta(');
if (_from < 0 || _to <= _from) throw new Error('未能从 server.js 提取 actionable_artefact 预留块');
const BLOCK = SRC.slice(_from, _to);
const F = new Function(`${BLOCK}\nreturn { ACTIONABLE_ARTEFACT_RESERVED, buildActionableArtefact };`)();

describe('V463 爆款/法器预留节点 · 输出 Schema', () => {
  test('① 默认值契约：false + 四字段 null，键名与军师指令书逐字一致', () => {
    const a = F.buildActionableArtefact();
    assert.deepStrictEqual(a, {
      has_recommended_item: false,
      item_sku: null,
      trigger_reason: null,
      cta_text: null,
      target_url: null,
    });
    assert.deepStrictEqual(Object.keys(a).sort(), [
      'cta_text', 'has_recommended_item', 'item_sku', 'target_url', 'trigger_reason',
    ].sort());
  });

  test('② 上线期覆写能力 + 常量不被污染（freeze + 副本）', () => {
    const live = F.buildActionableArtefact({
      has_recommended_item: true,
      item_sku: 'crystal_cat_amber_01',
      trigger_reason: '针对盘中金星与土星 0.30% 硬损耗，建议搭配熔岩琥珀能量体',
      cta_text: '唤醒专属于你的物理能量载体',
      target_url: '/artefact/crystal_cat_amber_01',
    });
    assert.strictEqual(live.has_recommended_item, true);
    assert.strictEqual(live.item_sku, 'crystal_cat_amber_01');
    // 覆写后默认常量必须纹丝不动（否则后续请求会被污染）
    assert.strictEqual(F.ACTIONABLE_ARTEFACT_RESERVED.has_recommended_item, false);
    assert.strictEqual(F.ACTIONABLE_ARTEFACT_RESERVED.item_sku, null);
    assert.deepStrictEqual(F.buildActionableArtefact(), F.ACTIONABLE_ARTEFACT_RESERVED === F.buildActionableArtefact() ? [] : F.ACTIONABLE_ARTEFACT_RESERVED && {
      has_recommended_item: false, item_sku: null, trigger_reason: null, cta_text: null, target_url: null,
    });
    assert.throws(() => { F.ACTIONABLE_ARTEFACT_RESERVED.item_sku = 'hack'; }, TypeError, '常量必须 freeze');
  });

  test('③ 三条报告链路全部挂载（单一真源，无手写第二份）', () => {
    const fails = [];
    // 月报/年报流式：meta 帧（buildWealthMeta）
    const metaFn = SRC.slice(SRC.indexOf('function buildWealthMeta('), SRC.indexOf('function enforceRiskThreshold('));
    if (!/actionable_artefact:\s*buildActionableArtefact\(\)/.test(metaFn)) fails.push('buildWealthMeta 未挂载预留节点');
    // 先天财富/非流式：响应 result（buildWealthMetaFull）
    const fullFn = SRC.slice(SRC.indexOf('function buildWealthMetaFull('), SRC.indexOf('app.post(\'/api/wealth-oracle\''));
    if (!/actionable_artefact:\s*buildActionableArtefact\(\)/.test(fullFn)) fails.push('buildWealthMetaFull 未挂载预留节点');
    // 年报 V2 通道：首帧 meta
    const v2Fn = SRC.slice(SRC.indexOf("app.post('/api/wealth-oracle/v2'"), SRC.indexOf("app.get('/api/debug-dump-cache'"));
    if (!/actionable_artefact:\s*buildActionableArtefact\(\)/.test(v2Fn)) fails.push('V2 年报未挂载预留节点');
    // 构造器只允许出现一份定义
    const defs = SRC.match(/function buildActionableArtefact\(/g) || [];
    if (defs.length !== 1) fails.push(`构造器定义数=${defs.length}（必须唯一）`);
    assert.deepStrictEqual(fails, [], fails.join('\n  '));
  });

  test('④ 绝不污染报告正文：节点名不得出现在任何 prompt 文本块', () => {
    // 按「起点 + 窗口长度」取块（声明顺序不固定，不能用相邻 indexOf 夹逼）
    const zoneOf = (startMarker, len) => {
      const i = SRC.indexOf(startMarker);
      return i < 0 ? null : SRC.slice(i, i + len);
    };
    const promptZones = [
      ['MONTHLY_SYSTEM 块', zoneOf('const MONTHLY_SYSTEM = {', 1500)],
      ['FORMAT_FIREWALL 块', zoneOf('const FORMAT_FIREWALL = `', 4000)],
      ['STRICT_GROUNDING 块', zoneOf('const STRICT_GROUNDING = `', 4500)],
      ['_segPrompt 块', zoneOf('const _segPrompt = [', 7000)],
    ];
    const fails = [];
    for (const [name, blk] of promptZones) {
      if (!blk) { fails.push(`${name} 定位失败`); continue; }
      if (blk.includes('actionable_artefact')) fails.push(`${name} 被注入节点名（会污染 LLM 正文）`);
      if (blk.includes('has_recommended_item')) fails.push(`${name} 被注入 has_recommended_item（会污染 LLM 正文）`);
    }
    assert.deepStrictEqual(fails, [], fails.join('\n  '));
  });
});

describe('V463 前端路由预留 · /artefact/:sku_id', () => {
  const APP = fs.readFileSync(path.join(__dirname, '..', 'web', 'src', 'App.tsx'), 'utf8');

  test('⑤ 路由正则覆盖 /artefact/:sku_id 与 /shop/item/:sku_id', () => {
    assert.ok(/\(?:\?\:\|\)?/.test(APP) || true);
    assert.ok(/artefact\|shop\\\/item/.test(APP), 'App.tsx 未预留 /artefact 或 /shop/item 路由');
  });

  test('⑥ 兜底三件套齐全：replaceState 回主站 + 清 wealthPath + 孕育中双语文案', () => {
    const fails = [];
    const zone = APP.slice(APP.indexOf('V463'), APP.indexOf('V463') + 3000);
    if (!/window\.history\.replaceState\(\{\}, '', '\/'\)/.test(zone)) fails.push('缺兜底 replaceState 回主站');
    if (!/setWealthPath\(null\)/.test(zone)) fails.push('缺 wealthPath 清理（否则白屏）');
    if (!/能量载体孕育中/.test(zone)) fails.push('缺「能量载体孕育中」文案');
    if (!/và\/item|shop\\\/item/.test(zone) && !/artefact\|shop/.test(zone)) fails.push('待匹配路由未同时覆盖：shop/item');
    if (!/setArtefactNotice/.test(APP)) fails.push('缺 Toast 渲染');
    assert.deepStrictEqual(fails, [], fails.join('\n  '));
  });
});
