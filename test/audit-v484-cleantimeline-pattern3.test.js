// ═══════════════════════════════════════════════════════════════════════
// 🛡️ V484: cleanYearlyTimeline「凭空造日」Pattern 3 清算回归闸门
//
// 事故(2026-09-30 记录, 2026-10-01 探针实证, 范围比预想更大):
//   原 Pattern 3 与 Pattern 4 正则完全相同 /(\d{4}年)(\d{1,2}月)(\d{4}年)(\2)/g,
//   替换串却是 '$1$2$4日' —— $4 是「与 $2 相同的月」⇒ 一切 `YYYY年M月YYYY年M月`
//   形态都被腐化成 `YYYY年M月M月日`(凭空造「日」+ 月份重复):
//     `2026年6月2026年6月21日` → `2026年6月6月日21日`(线上实证)
//     `2026年6月2026年6月`     → `2026年6月6月日`(探针实证)
//   且 Pattern 3 排在 Pattern 5(本可正确处理带日形态)之前, 先把文本毁掉。
// 修法: 拆除 Pattern 3; 语义由 Pattern 4(塌缩为首标签) / Pattern 5(保留日期) 承接。
// ═══════════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { closureDecls } from './tools/extract_decls.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf-8');

function loadClean(source = src) {
  const { source: code } = closureDecls(source, ['cleanYearlyTimeline'], []);
  const ctx = { console, __exports: {} };
  vm.createContext(ctx);
  vm.runInContext(code + '\n__exports.f = cleanYearlyTimeline;', ctx);
  return ctx.__exports.f;
}

// ── ① 源码级: 不得存在「$4日」式凭空造日替换串(锚定 replace( 调用, 注释里的描述性引用不算) ──
test('① cleanYearlyTimeline 源码不得包含 `$1$2$4日` 式凭空造日替换', () => {
  const raw = closureDecls(src, ['cleanYearlyTimeline'], []).source;
  const code = raw.replace(/\/\/[^\n]*/g, '');   // 剥行注释(防「注释里写了判据字面量」假红)
  assert.ok(code.includes('cleanYearlyTimeline'), '切片失败');
  assert.ok(!/replace\([^;\n]*'\$1\$2\$4日'\)/.test(code),
    '发现 `.replace(..., \'$1$2$4日\')` —— $4 是与 $2 相同的月份, 会产出 `M月M月日`');
});

// ── ② 行为级: 腐化样本必须被正确清洗 + 好样本零 diff + 幂等 ──
test('② `YYYY年M月YYYY年M月D日` → `YYYY年M月D日`(不产出 M月日/重复月), 好样本零 diff', () => {
  const f = loadClean();
  const must = [
    ['2026年6月2026年6月21日', '2026年6月21日'],
    ['2026年6月2026年6月', '2026年6月'],
    ['2027年3月2027年3月8日', '2027年3月8日'],
    ['1990年6月2026年6月', '1990年6月'],
  ];
  for (const [inp, exp] of must) {
    const out = f(inp, 'zh');
    assert.strictEqual(out, exp, `清洗结果错误: ${JSON.stringify(inp)} → ${JSON.stringify(out)}(期望 ${JSON.stringify(exp)})`);
    assert.ok(!/\d月\d月日/.test(out), '仍存在「M月M月日」凭空造日残渣: ' + out);
    assert.strictEqual(f(out, 'zh'), out, '非幂等: ' + out);
  }
  // 好样本零 diff(连带影响防线)
  const goods = [
    '本计划自2026年7月1日起，至2026年8月15日结束。',
    '### 2026年7月: 太阳巨蟹座 第1宫 · 破壳重生',
    '2026年10月1日国庆，2027年1月1日元旦。',
    '2026年12月临近2027年1月，跨年交替。',
  ];
  for (const g of goods) {
    assert.strictEqual(f(g, 'zh'), g, '好样本被误改(连带影响!): ' + JSON.stringify(g) + ' → ' + JSON.stringify(f(g, 'zh')));
  }
});

// ── ③ 行为级: 行数守恒 + 既有修复(V103-fix18/21, es 全角) 不回退 ──
test('③ 12 标题正文行数守恒; 断头括号兜底与 es 全角转半角不回退', () => {
  const f = loadClean();
  const body = Array.from({ length: 12 }, (_, i) =>
    `### 2026年${String(((i + 7) % 12) + 1).padStart(2, '0')}月: 太阳巨蟹座 第${i + 1}宫\n正文段落${i}，日期锚点2026年${i + 1}月5日。`).join('\n');
  const out = f(body, 'zh');
  assert.strictEqual(out.split('\n').length, body.split('\n').length, '行数不守恒 —— 收尾链下游按行索引对齐会被破坏');
  assert.ok(!/\d月\d月日/.test(out), '正文日期被凭空造日: ' + out);

  // V103-fix21: 行内全角左括号(无闭合) → 补闭括号(实测 `\s*` 吞掉行尾换行, 闭括号加在换行后)
  const brk = f('今天聊聊（木星\n', 'zh');
  assert.ok(brk === '今天聊聊（木星\n）' || brk === '今天聊聊（木星）\n', 'V103-fix21 全角括号兜底回退: ' + JSON.stringify(brk));
  // V147: es 全角括号转半角
  const es = f('（Plutón）', 'es');
  assert.ok(es.includes('(Plutón') && !es.includes('（'), 'V147 es 全角转半角回退: ' + es);
});

// ═══════════════ 注入缺陷自测(证明闸门会红) ═══════════════
test('【注入缺陷自测】Pattern 4 替换串腐化为 `$1$2$4日` → ①② 必须红', () => {
  const degraded = src.replace(
    "text = text.replace(/(\\d{4}年)(\\d{1,2}月)(\\d{4}年)(\\2)/g, '$1$2');",
    "text = text.replace(/(\\d{4}年)(\\d{1,2}月)(\\d{4}年)(\\2)/g, '$1$2$4日');",
  );
  assert.notStrictEqual(degraded, src, '未成功注入缺陷(未匹配到 Pattern 4)');
  // ① 源码级: 腐化替换串必须被识别
  assert.ok(/\$1\$2\$4日/.test(closureDecls(degraded, ['cleanYearlyTimeline'], []).source),
    '闸门失效: 腐化串注入后源码级判据仍绿(① 未红)');
  // ② 行为级: 腐化后必须产出「M月M月日」并被 ② 抓住
  const f = loadClean(degraded);
  const out = f('2026年6月2026年6月', 'zh');
  assert.ok(/\d月\d月日/.test(out) || out !== '2026年6月',
    '闸门失效: 腐化注入后 ② 的行为断言仍绿(② 未红): ' + out);
});
