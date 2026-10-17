/**
 * 🚨 E61 闸门：年报流式「拉扯」回归防线（audit-e61-stream-render-stability）
 *
 * 主公实测（2026-10-17）：「年报在输出时一直在拉扯」。
 * 浏览器实测取证（真实组件 + 90ms flush 仿真流，59 秒）：
 *   修复前 —— `scrollTo({top:0})` 触发 **322 次**、滚动方向反转 **215 次**；
 *   修复后 —— 同为 59 秒 / 同为 200 次触底，`scrollTo({top:0})` **1 次**、反转 **1 次**。
 *
 * 三条病根（本闸门逐条锁死，改回任一条即转红）：
 *   ① 打字机计时器挂在 `[rawStreamText]` 上 ⇒ E60 的 90ms flush 每帧 clear+set，
 *      50ms 拍距永远走不满（锯齿）；且「更短则重置」会 `setSmoothText('')` 把长卷整篇清空重打。
 *      治法：计时器依赖 `[]`、目标走 `targetTextRef`；回退只钳制不重打。
 *   ② `isStreaming` 由「打字机是否追平」判定 ⇒ 父级 90ms 灌一帧、打字机 50ms 就追平（1.4 万字时
 *      推进 ≈77 字/拍，是灌入速率的 6 倍）⇒ 每 90ms 翻假一次。
 *   ③ 「完成后归顶」的 effect 依赖 `!isStreaming` 且把 `smoothText` 放进依赖 ⇒ 与②联动，
 *      每 90ms `scrollTo(top:0, smooth)` 一次，新字又拽回底部 ⇒ 视口来回拉锯 = 拉扯。
 *
 * 射程：本闸门是**结构级**防线（源码形态）＋ 注入自测；行为级证据见上方浏览器实测数字，
 *       复跑方法见 web/.e60-diag（本地诊断脚手架，不入产品构建）。
 *
 * 运行：node --test test/audit-e61-stream-render-stability.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const BOX_REL = 'web/src/components/SacredYearlyReportBox.tsx';
const BOX_SRC = read(BOX_REL);

/** 纯函数：给定源码返回违规清单（便于注入自测） */
export function checkStreamStability(src) {
  const v = [];

  // A1 流式状态必须由完成标志判定
  const isStreamingLine = src.split('\n').find((l) => /const isStreaming\s*=/.test(l)) || '';
  if (!/hasContent\s*&&\s*!yearlyCardsReady/.test(isStreamingLine)) {
    v.push('A1 isStreaming 未由 yearlyCardsReady（完成标志）判定');
  }
  if (/smoothText\.length\s*<\s*\(?\s*rawStreamText/.test(src)) {
    v.push('A1b 仍存在「打字机追平即视为流结束」的旧判据');
  }

  // A2 归顶只准一次：scrollTo(top:0) 恰 1 处，且被 snappedTopRef 闸门挡住
  const topScrolls = (src.match(/scrollTo\(\{\s*top:\s*0/g) || []).length;
  if (topScrolls !== 1) v.push(`A2 scrollTo(top:0) 出现 ${topScrolls} 处（必须恰 1，且带一次性闸门）`);
  if (!/const snappedTopRef = useRef\(false\)/.test(src)) {
    v.push('A2b 缺少一次性归顶闸门 snappedTopRef');
  }
  if (!/if \(snappedTopRef\.current\) return;/.test(src)) {
    v.push('A2c snappedTopRef 未作为 return 守卫使用');
  }

  // A3 打字机计时器不得随 prop 变化重建
  const typingStart = src.indexOf('const timer = setInterval(');
  if (typingStart < 0) {
    v.push('A3 找不到打字机计时器');
  } else {
    const tail = src.slice(typingStart, typingStart + 1200);
    const depMatch = tail.match(/\},\s*50\);\s*return \(\) => clearInterval\(timer\);\s*\},\s*(\[[^\]]*\])\);/);
    if (!depMatch) v.push('A3b 打字机 effect 依赖数组形态异常（无法核验）');
    else if (depMatch[1].replace(/\s/g, '') !== '[]') {
      v.push(`A3c 打字机 effect 依赖为 ${depMatch[1]}（必须为 []，否则每帧重建计时器）`);
    }
  }

  // A4 禁止整篇重打
  if (/smoothIdxRef\.current\s*=\s*0\b/.test(src)) {
    v.push('A4 仍存在把 smoothIdx 归零的「整篇重打」分支');
  }
  if (!/smoothIdxRef\.current\s*=\s*targetTextRef\.current\.length/.test(src)) {
    v.push('A4b 缺少「回退钳制」写法（smoothIdx 钳到目标长度）');
  }

  // A5 目标文本必须走 ref（否则 effect 依赖必然回到 rawStreamText）
  if (!/targetTextRef\.current = rawStreamText/.test(src)) {
    v.push('A5 目标文本未走 targetTextRef');
  }

  return v;
}

const violations = checkStreamStability(BOX_SRC);

test('E61-A 组件源码：流式渲染稳定性三病根已封', () => {
  assert.deepEqual(violations, [], '违规：\n' + violations.join('\n'));
});

test('E61-B 注入自测：任一条改回旧形态 ⇒ 判据必红', () => {
  const cases = [
    {
      name: '①只把 isStreaming 改回「打字机追平」',
      mutated: BOX_SRC.replace(
        /const isStreaming = hasContent && !yearlyCardsReady;/,
        'const isStreaming = hasContent && smoothText.length < (rawStreamText?.length || 0);'
      ),
      expect: /A1/,
    },
    {
      name: '②把归顶闸门摘掉（多一次 scrollTo(top:0)）',
      mutated: BOX_SRC.replace(
        '    if (snappedTopRef.current) return;\n',
        ''
      ).replace(
        '  }, [isStreaming, hasContent, smoothText.length]);',
        '  }, [isStreaming, hasContent, smoothText]);\n  // 注入：再补一次旧归顶\n  useEffect(() => { const el = scrollRef.current; if (el) el.scrollTo({ top: 0, behavior: \'smooth\' }); }, [smoothText]);'
      ),
      expect: /A2/,
    },
    {
      name: '③把打字机计时器挂回 [rawStreamText]',
      mutated: BOX_SRC.replace(
        /(\},\s*50\);\s*return \(\) => clearInterval\(timer\);\s*\},\s*)\[\]\);/,
        '$1[rawStreamText]);'
      ),
      expect: /A3c/,
    },
    {
      name: '④把「回退钳制」改回「归零重打」',
      mutated: BOX_SRC.replace(
        /smoothIdxRef\.current = targetTextRef\.current\.length;/,
        'smoothIdxRef.current = 0;'
      ),
      expect: /A4/,
    },
  ];
  for (const c of cases) {
    assert.notEqual(c.mutated, BOX_SRC, `注入失败（替换未命中）：${c.name}`);
    const got = checkStreamStability(c.mutated);
    assert.ok(got.some((x) => c.expect.test(x)), `注入未被拦截：${c.name} → ${JSON.stringify(got)}`);
  }
});

test('E61-C 段位：闸门已接入 test:astro 长链，且 e40-compat 仍居倒数第二位', () => {
  const pkg = JSON.parse(read('package.json'));
  const segs = pkg.scripts['test:astro'].split('&&').map((s) => s.trim()).filter(Boolean);
  const iSelf = segs.findIndex((s) => s.includes('audit-e61-stream-render-stability'));
  const iCap = segs.findIndex((s) => s.includes('audit-e40-compat-synastry-tensor-fusion'));
  assert.ok(iSelf >= 0, 'E61 闸门未接入 test:astro');
  assert.ok(iCap === segs.length - 2, `e40-compat 段位漂移：${iCap} / len=${segs.length}（须为 len-2）`);
  assert.ok(iSelf < iCap, 'E61 闸门须排在 e40-compat 之前');
});
