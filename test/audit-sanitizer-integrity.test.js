// ═══════════════════════════════════════════════════════════════════════
// 🛡️ V476: final_text_sanitizer 字符完整度回归闸门
// 事故: 2026-09-29 生产年报 zh 文本被吃 54% 汉字(汉字被替换为空格/删除)。
// 真凶: final_text_sanitizer 内 3 处正则字面括号 ( ) 未转义——
//   ① /([一-龥])()([一-龥])/  的 () 退化为空捕获组 → 相邻两汉字只留一个 (杀 53.9%)
//   ② 第N宫(([^)]+)座)        的 (( 漏转义 → 从"第N宫"吞到下一个"座"
//   ③ (行星)(在|的)(第N宫)(([^)]+座)|...) 同族
// 本测试:运行时从 server.js 提取 final_text_sanitizer 真身,对真实干净文本夹具
// 做行为断言(CJK 存活率 + 关键占星短语存活),并做源码级模式封禁。
// ═══════════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { getSignToHouseMap, SIGN_ORDER_ZH } from '../astro-truth.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const serverSrc = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
const fixture = fs.readFileSync(path.join(ROOT, 'test/fixtures/yearly-zh-clean-sample.txt'), 'utf8');

function extractFn(name) {
  const idx = serverSrc.indexOf('function ' + name + '(');
  assert.ok(idx >= 0, 'server.js 应包含 function ' + name);
  let i = serverSrc.indexOf('{', idx), depth = 0, j = i;
  for (; j < serverSrc.length; j++) {
    if (serverSrc[j] === '{') depth++;
    else if (serverSrc[j] === '}') { depth--; if (depth === 0) break; }
  }
  return serverSrc.slice(idx, j + 1);
}

function loadSanitizer() {
  const ctx = { getSignToHouseMap, SIGN_ORDER_ZH, console, setTimeout, clearTimeout, result: null };
  vm.createContext(ctx);
  vm.runInContext(
    extractFn('final_text_sanitizer') + '\n' +
    extractFn('stripLoneSurrogates') + '\n' +
    'result = final_text_sanitizer;',
    ctx,
  );
  return ctx.result;
}

const cjk = (s) => (s.match(/[\u4e00-\u9fff]/g) || []).length;

test('final_text_sanitizer 对干净 zh 年报文本的 CJK 存活率 ≥ 95%', () => {
  const sanitize = loadSanitizer();
  const out = sanitize(fixture, 'Libra', 'zh');
  const before = cjk(fixture), after = cjk(out);
  assert.ok(
    after >= before * 0.95,
    `CJK 存活率 ${(after / before * 100).toFixed(1)}% (${before}→${after}) 低于 95% —— 清洗链在吃字!`,
  );
});

test('final_text_sanitizer 不得吞掉"第N宫后接正文"的段落(座字存活 ≥ 90%)', () => {
  const sanitize = loadSanitizer();
  const out = sanitize(fixture, 'Libra', 'zh');
  const before = (fixture.match(/座/g) || []).length;
  const after = (out.match(/座/g) || []).length;
  assert.ok(after >= before * 0.9, `座 存活 ${before}→${after} 低于 90% —— "第N宫…座"贪吃正则复发!`);
});

test('final_text_sanitizer 保留括号内相位描述(与木星在狮子座形成和谐相位)', () => {
  const sanitize = loadSanitizer();
  const probe = '* [Peak Revenue Window]: 9月5日至9月10日 (太阳在处女座与木星在狮子座形成和谐相位)。* 执行指令: 继续。';
  const out = sanitize(probe, 'Libra', 'zh');
  assert.ok(out.includes('与木星在狮子座形成和谐相位'), '相位描述被吞: ' + JSON.stringify(out));
});

test('final_text_sanitizer 保留"第N宫是一个关于…"的完整句子', () => {
  const sanitize = loadSanitizer();
  const probe = '本月，太阳进入天蝎座第2宫，这是一个关于个人财富、价值观、以及物质安全的宫位。你可能会发现机会。';
  const out = sanitize(probe, 'Libra', 'zh');
  assert.ok(out.includes('这是一个关于个人财富、价值观、以及物质安全的宫位'), '句子被吞: ' + JSON.stringify(out));
});

test('final_text_sanitizer 正确清理空括号污染(第五宫()狮子座 → 第N宫狮子座)', () => {
  const sanitize = loadSanitizer();
  const out = sanitize('第五宫()狮子座出现', 'Cancer', 'zh');
  // 注: lang_asc='Cancer' 会触发星座→宫位映射(第五宫→第2宫),故按语义断言而非字面
  assert.ok(/宫狮子座/.test(out), '宫座相邻文本被破坏: ' + JSON.stringify(out));
  assert.ok(!out.includes('()'), '空括号残留: ' + JSON.stringify(out));
});

test('源码封禁:server.js 不得再出现未转义字面括号的杀手模式', () => {
  // ① 相邻汉字空捕获组(空括号未转义)
  assert.ok(!serverSrc.includes('/([\\u4e00-\\u9fa5])()([\\u4e00-\\u9fa5])/'),
    '杀手模式①复发: ([\\u4e00-\\u9fa5])()([\\u4e00-\\u9fa5]) 空捕获组');
  // ② 第N宫(([^)]+)座) —— 字面 ( 未转义
  assert.ok(!/第\(\[一二三四五六七八九十百零0-9\]\+\)宫\(\(\[\^\)\]\+\)座\)/.test(serverSrc),
    '杀手模式②复发: 第N宫(([^)]+)座)');
  // ③ R() 字符串构造正则中的裸 \( —— JS 字符串转义吞掉反斜杠 → new RegExp 收到裸括号
  //    → 运行时 Unterminated group 直接抛异常(V476: R('风元素\(处女座' 崩掉太阳巨蟹盘)
  const rCalls = serverSrc.match(/R\('(?:[^'\\]|\\.)*'/g) || [];
  for (const c of rCalls) {
    assert.ok(!/(?<!\\)\\\(/.test(c),
      'R() 字符串模式含裸反斜杠括号(运行时 Unterminated group): ' + c + ' —— 应写双反斜杠 \\\\(');
  }
});
