// ═══════════════════════════════════════════════════════════════════════
// 🛡️ V482e: house_linter「月标题锚点拆分」回归闸门
//
// 事故(2026-09-30, 由 V482d 修复非流式端点后才暴露):
//   非流式 `/api/wealth-oracle` yearly 返回的正文里, 月标题被碾碎成
//     `# 月:20262026年11月: 太阳天蝎座 第5宫 · 深渊炼金`
//     `# 年2026月:1212年 本命太阳射手座 第6宫 · 本命回归`
//   并且 12 个月标题只剩 6 行、真值(星座/宫位)全错。
//
// 根因: house_linter 的 `text.split(monthAnchorRe)` —— 正则有 2 个捕获组,
//   拆完是 [前导, 年, 月, 正文, 年, 月, 正文, ...] ⇒ 步长必须是 3;
//   旧代码却 `i += 2` ⇒ 第 3 步起把「正文」当成年份 → parseInt→NaN → 月数据查不到
//   → 走 !monthData 分支把正文**原样再追加一遍**并补 `年undefined月:`。
//   且正则不含 `#` ⇒ 重建时 `###` 整个丢失 ⇒ 下游 lockYearlyMonthTitles /
//   lockYearlyTransitSigns 认不出月标题 → 真值锁集体失效(真值全错的直接原因)。
// ═══════════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { indexDecls, closureDecls } from './tools/extract_decls.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf-8');

function fnSrc(name, source = src) {
  const code = indexDecls(source).get(name);
  assert.ok(code, `未找到函数 ${name}`);
  return code;
}
function sandbox(name, source = src, externals = ['console', 'getSignToHouseMap', 'SIGN_ORDER_ZH']) {
  const { map } = closureDecls(source, [name], externals);
  const ctx = { console, __exports: {} };
  vm.createContext(ctx);
  vm.runInContext(
    [...map.values()].join('\n\n') + `\n__exports.f = typeof ${name} !== 'undefined' ? ${name} : undefined;`,
    ctx,
  );
  return ctx.__exports.f;
}

// 假真值盘: 2026-11 太阳第 5 宫(与夹具文本一致者会被改写成 3)、2026-12 太阳第 4 宫
const EN = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const mkAM = () => ({
  months: Array.from({ length: 12 }, (_, i) => ({
    month_key: `2026-${String(i + 1).padStart(2, '0')}`,
    sun: { sign: EN[i], house: i + 1 },
    moon: { sign: 'Pisces', house: 9 },
    jupiter: { sign: 'Leo', house: 2 }, saturn: { sign: 'Aries', house: 10 }, pluto: { sign: 'Aquarius', house: 8 },
  })),
  meta: {},
});
const T11 = '太阳在双子座第8宫，木星在第2宫。';
const T12 = '太阳在巨蟹座第7宫，土星在第10宫。';

// ── ① 源码级: 锚点正则必须捕获标题标记 + 步长必须为 4 ──
test('① 月标题锚点正则必须捕获 `#{1,6}` 标记, 且拆分步长必须与捕获组数一致(4)', () => {
  const code = fnSrc('house_linter');
  const re = code.match(/const\s+monthAnchorRe\s*=\s*(\/.*?\/g)\s*;/);
  assert.ok(re, '未找到 monthAnchorRe');
  assert.ok(/\(#\{1,6\}/.test(re[1]), '锚点正则未捕获 `#{1,6}` 标记 → 重建时标题标记会整体丢失: ' + re[1]);
  assert.ok(/for\s*\(\s*let\s+i\s*=\s*1\s*;[^;]*;\s*i\s*\+=\s*4\s*\)/.test(code),
    '拆分循环步长不是 4 —— 3 个捕获组对应 4 项一组, 步长写错会把「正文」当成年份');
  assert.ok(!/i\s*\+=\s*2\s*\)/.test(code), '仍存在 `i += 2` 的错误步长');
});

// ── ② 行为级: 单/多个月标题都不得被碾碎, 且 house 真值要生效 ──
test('② 带 `### YYYY年M月:` 的正文不得被碾碎(保留标记/不重复正文/不产出 年undefined月) + house 真值生效', () => {
  const f = sandbox('house_linter');
  const input = `## 第二章\n\n### 2026年11月: ${T11}\n\n### 2026年12月: ${T12}\n`;
  const out = f(input, mkAM());

  assert.ok(!/年undefined月/.test(out), '出现 `年undefined月` 残渣 —— 步长错位未修: ' + out.slice(0, 200));
  const titles = out.split('\n').filter((l) => /^\s*#{1,6}\s/.test(l) && /\d{4}年\d{1,2}月/.test(l));
  assert.strictEqual(titles.length, 2, `月标题行数应为 2, 实得 ${titles.length}:\n` + titles.join('\n'));
  assert.ok(/^###\s*\d{4}年\d{1,2}月/.test(titles[0]), '标题标记 `###` 未保留: ' + titles[0]);
  assert.ok(/^###\s*\d{4}年\d{1,2}月/.test(titles[1]), '标题标记 `###` 未保留: ' + titles[1]);
  assert.strictEqual((out.match(/木星在第2宫/g) || []).length, 1, '正文被重复追加(木星句出现多次)');
  assert.strictEqual((out.match(/土星在第10宫/g) || []).length, 1, '正文被重复追加(土星句出现多次)');
  // house 真值: 假真值盘里 2026-11 太阳=第11宫 / 2026-12 太阳=第12宫(夹具写「第九宫」以证锁定生效)
  // ⚠️ 该函数只纠**中文序数**宫位(`第[一二三四五六七八九十]+宫`), 阿拉伯数字不受管 —— 夹具必须用序数。
  const inp2 = `### 2026年11月: 太阳在双子座第九宫。\n\n### 2026年12月: 太阳在巨蟹座第九宫。\n`;
  const out2 = f(inp2, mkAM());
  assert.ok(/太阳在双子座第十一宫/.test(out2), '2026-11 太阳宫位真值未生效: ' + out2.split('\n').find((l) => /月:/.test(l)));
  assert.ok(/太阳在巨蟹座第十二宫/.test(out2), '2026-12 太阳宫位真值未生效');
  assert.strictEqual(f(out, mkAM()), out, '非幂等: 二次调用有变化');
});

test('③ `####` 级标题也不得损失 `#` (旧代码被 `###` 前半吃掉一个 #)', () => {
  const f = sandbox('house_linter');
  const out = f(`#### 2026年11月: ${T11}\n`, mkAM());
  assert.ok(/^####\s*2026年11月/.test(out.trim()), '`####` 标题丢失/变形: ' + out.trim().slice(0, 80));
});

// ═══════════════ 注入缺陷自测(证明闸门会红) ═══════════════
test('【注入缺陷自测】步长改回 `i += 2` → ①② 必须红', () => {
  const degraded = src.replace(/for \(let i = 1; i \+ 2 < sections\.length; i \+= 4\)/, 'for (let i = 1; i < sections.length; i += 2)');
  assert.notStrictEqual(degraded, src, '未成功注入缺陷(未匹配到循环首行)');
  // V492/E7: house_linter 新增英文月锚点分支（enSections 也有各自的 i += 4 循环），
  //   步长判据须**按分支作用域**检查——中文锚点循环（sections.length）退化后必须被识别。
  const zhLoop = fnSrc('house_linter', degraded).match(/sections\.length; i \+= (\d+)\)/);
  assert.ok(zhLoop && zhLoop[1] !== '4', '闸门失效: 步长退化未被识别(① 未红)');
  const f = sandbox('house_linter', degraded);
  const out = f(`### 2026年11月: ${T11}\n`, mkAM());
  assert.ok(/年undefined月/.test(out) || /^#{1,6}\s*\d{4}年/.test(out) === false,
    '闸门失效: 步长退化后正文仍未被碾碎(② 未红): ' + out.slice(0, 120));
});

test('【注入缺陷自测】锚点正则去掉 `#{1,6}` 捕获 → ①③ 必须红(行为级)', () => {
  const degraded = src.replace(
    'const monthAnchorRe = /(#{1,6}[ \\t]*)(\\d{4})年(\\d{1,2})月:/g;',
    'const monthAnchorRe = /###\\s*(\\d{4})年(\\d{1,2})月:/g;',
  );
  assert.notStrictEqual(degraded, src, '未成功注入缺陷(未匹配到锚点正则)');
  // ① 源码级 —— V492/E7: 判据作用域收窄到 **monthAnchorRe 声明本身**
  //   （英文锚点分支的 enAnchorRe 同样合法持有 `#{1,6}` 捕获，不得跨正则误伤）
  const reDecl = fnSrc('house_linter', degraded).match(/const\s+monthAnchorRe\s*=\s*(\/.*?\/g)\s*;/);
  assert.ok(reDecl && !/\(#\{1,6\}/.test(reDecl[1]), '闸门失效: 标记捕获缺失未被识别(① 未红)');
  // ③ 行为级: 标记不被捕获 ⇒ 重建时 `###` 整体丢失
  //   注意: 必须用 **2 个月标题** 的输入 —— 单标题时 sections.length=4 < 5 会被守卫挡到回退分支,
  //   反而看不出退化(守卫本身也是一层保护); 2 标题时 length=7 必定进入锚点分支。
  const f = sandbox('house_linter', degraded);
  const out = f(`### 2026年11月: ${T11}\n\n### 2026年12月: ${T12}\n`, mkAM());
  assert.ok(!/^\s*#{1,6}\s*2026年11月/m.test(out),
    '闸门失效: 标记捕获缺失后 `###` 仍完整(③ 未红): ' + out.trim().slice(0, 100));
});
