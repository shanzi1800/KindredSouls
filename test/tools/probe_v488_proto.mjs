// V488 立项调研·原型验证 v3：非月段「流年太阳」引用句的两级治理
// 用法: node test/tools/probe_v488_proto.mjs <产物文件> [更多产物...]
//
// ── 实测探明的三类引用语序（跨 2 盘取证）──
//   形态 I  流年太阳在 {月} 进入 {星座}第N宫            （月份居中）
//   形态 II  {年}{月} 流年太阳在 {星座}第N宫             （月份前缀）
//   形态 III {年}{月} 进入 {星座}第N宫（承前省略主语）    （同句内前文有「流年太阳」）
//   反例    流年太阳在{星座}第N宫，{月}将激活…           （月份在引用之后 ⇒ 是"激活"时间，非入座时间）
//
// ── 核心策略 ──
//   ① 归属护栏：引用之前【最近的行星名】必须是「太阳」（且其前 2 字非本命词）
//      —— 一步同时解决「夹其它行星误伤」与「本命/流年混句漏治」。
//   ② 月份配对：向前找最近的月份锚点（间距 ≤ 24 字）⇒ 用该月太阳真值纠正星座(必改)/宫位(连改)。
//   ③ 天然放行"月份在后"的反例（无前置月份 ⇒ 不动），无需额外分支。
//   ④ 二级审计：未被纠正的太阳引用，若 (星座,宫位) 不在本年度真值集合 ⇒ 告警(只检不改)。
import fs from 'node:fs';

const SIGNS = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座',
  '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'];
const ORDER = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
const ordZH = (n) => n === 11 ? '十一' : n === 12 ? '十二' : ORDER[n - 1];
const houseNum = (w) => /\d/.test(w) ? Number(w.match(/\d+/)[0]) : (w === '十一' ? 11 : w === '十二' ? 12 : ORDER.indexOf(w[0]) + 1);
const SIGN_ALT = SIGNS.map((s) => s.replace('座', '')).join('|');
const PLANET_RE = /(太阳|月亮|水星|金星|火星|木星|土星|天王星|海王星|冥王星|上升|中天)/g;
const NATAL_WORD = /本命|出生|原生|本盘/;

function lastPlanetBefore(s, pos) {
  const re = new RegExp(PLANET_RE.source, 'g');
  const sub = s.slice(0, pos);
  let last = null;
  for (const m of sub.matchAll(re)) last = { name: m[1], idx: m.index };
  return last;
}

function buildTruth(text) {
  const t = new Map();
  text.split('\n').forEach((l) => {
    const m = l.match(/^#{1,6}\s*(\d{4})年(\d{1,2})月[^\n]*?太阳\s*([\u4e00-\u9fa5]{2,3}座)\s*第\s*(\d+)\s*宫/);
    if (!m) return;
    const mo = Number(m[2]);
    if (!t.has(mo)) t.set(mo, { sign: m[3], house: Number(m[4]) });
  });
  return t;
}

function fixNonMonthSunRef(text, truth) {
  const validSet = new Set([...truth.values()].map((v) => v.sign + '|' + v.house));
  const lines = text.split('\n');

  // 月段行集合（同 V482 口径）
  const heads = []; const seen = new Set();
  lines.forEach((l, i) => {
    const ln = l.trim();
    if (!/^#{1,6}\s/.test(ln)) return;
    const ym = ln.match(/(\d{4})年(\d{1,2})月/);
    if (!ym) return;
    const mo = +ym[2]; if (mo < 1 || mo > 12) return;
    const key = (+ym[1]) * 12 + mo;
    if (seen.has(key)) return;
    seen.add(key); heads.push({ line: i, key });
  });
  heads.sort((a, b) => a.key - b.key);
  const inMonth = new Set();
  heads.forEach((h, n) => {
    let end = n + 1 < heads.length ? heads[n + 1].line : lines.length;
    for (let k = h.line + 1; k < end; k++) if (/^\s*##\s/.test(lines[k])) { end = k; break; }
    for (let k = h.line; k < end; k++) inMonth.add(k);
  });

  const SIGN_GRP = new RegExp('(' + SIGN_ALT + ')座(?:\\s*第\\s*(\\d+|[一二三四五六七八九十]{1,3})\\s*宫)?', 'g');
  const MONTH_GRP = /(?:\d{4}\s*年)?\s*(\d{1,2})\s*月(?:份)?/g;

  let fixed = 0, warned = 0; const log = [];

  lines.forEach((line, li) => {
    if (inMonth.has(li)) return;
    if (!line || line.indexOf('太阳') < 0) return;
    const parts = line.split(/(?<=[。！？])/);
    let touched = false;
    for (let pi = 0; pi < parts.length; pi++) {
      const s = parts[pi];
      if (!/太阳/.test(s)) continue;
      if (!/流年|行运/.test(s)) continue;               // 句级: 必须有流年锚点

      const anchors = [];
      for (const m of s.matchAll(new RegExp(MONTH_GRP.source, 'g'))) anchors.push({ end: m.index + m[0].length, mo: Number(m[1]) });
      const refs = [];
      for (const m of s.matchAll(new RegExp(SIGN_GRP.source, 'g'))) refs.push({
        start: m.index, len: m[0].length, sign: m[1] + '座',
        house: m[2] ? houseNum(m[2]) : null, raw: m[0],
      });

      let out = s;
      const handled = [];
      for (let k = refs.length - 1; k >= 0; k--) {   // 从后往前，避免位移
        const ref = refs[k];
        const lp = lastPlanetBefore(s, ref.start);
        if (!lp || lp.name !== '太阳') continue;                                  // ① 归属护栏
        if (NATAL_WORD.test(s.slice(Math.max(0, lp.idx - 2), lp.idx))) continue;  // 本命太阳豁免
        let a = null;
        for (const x of anchors) if (x.end <= ref.start && (!a || x.end > a.end)) a = x;
        if (!a || ref.start - a.end > 24) continue;                               // ② 前置月份配对
        const tv = truth.get(a.mo);
        if (!tv) continue;
        let r = ref.raw, hit = false;
        if (ref.sign !== tv.sign) { r = r.replace(ref.sign, tv.sign); hit = true; }
        if (ref.house != null && tv.house && ref.house !== tv.house) {
          const want = /\d/.test(ref.raw) ? '第' + tv.house + '宫' : '第' + ordZH(tv.house) + '宫';
          r = r.replace(/第\s*(?:\d+|[一二三四五六七八九十]{1,3})\s*宫/, want); hit = true;
        }
        if (hit) {
          out = out.slice(0, ref.start) + r + out.slice(ref.start + ref.len);
          handled.push({ mo: a.mo, from: ref.raw, to: r });
        }
      }
      if (handled.length) {
        parts[pi] = out; touched = true; fixed += handled.length;
        handled.forEach((h) => log.push(`[L${li + 1}] 一级纠正「${h.from}」→「${h.to}」(${h.mo}月真值) ← ${s.trim().slice(0, 78)}`));
      }

      // ④ 二级审计（基于纠正**后**文本）: 无月份锚点的太阳引用, 值不在真值集合 ⇒ 告警
      const seenRef = new Set();
      for (const m of out.matchAll(new RegExp(SIGN_GRP.source, 'g'))) {
        const sign = m[1] + '座';
        const house = m[2] ? houseNum(m[2]) : null;
        if (house == null) continue;
        const lp = lastPlanetBefore(out, m.index);
        if (!lp || lp.name !== '太阳') continue;
        if (NATAL_WORD.test(out.slice(Math.max(0, lp.idx - 2), lp.idx))) continue;
        const key = sign + '|' + house;
        if (seenRef.has(key)) continue; seenRef.add(key);
        if (!validSet.has(key)) {
          warned++;
          log.push(`[L${li + 1}] 二级告警 ⚠️「${sign} 第${house}宫」不属于本年度任何月份真值（无可靠月份锚点，无法定位应改为何月）← ${out.trim().slice(0, 78)}`);
        }
      }

      // ⑤ 三级审计（纯告警）: 句内月份唯一但**位于引用之后**（非前置，故未被一级处理）,
      //    而该引用的值与这个月份的真值冲突 ⇒ 语义漂移告警。
      //    覆盖军师原报形态「流年太阳在天秤座第11宫，2027年3月将激活你的田宅宫」。
      const uniqM = [...new Set([...s.matchAll(new RegExp(MONTH_GRP.source, 'g'))].map((m) => Number(m[1])))];
      if (uniqM.length === 1 && truth.has(uniqM[0])) {
        const tv = truth.get(uniqM[0]);
        for (const ref of refs) {
          const lp = lastPlanetBefore(s, ref.start);
          if (!lp || lp.name !== '太阳') continue;
          if (NATAL_WORD.test(s.slice(Math.max(0, lp.idx - 2), lp.idx))) continue;
          let paired = false;
          for (const x of anchors) if (x.end <= ref.start && ref.start - x.end <= 24) paired = true;
          if (paired) continue;                                     // 已被一级接管
          if (ref.sign !== tv.sign || (ref.house != null && tv.house && ref.house !== tv.house)) {
            warned++;
            log.push(`[L${li + 1}] 三级告警 ⚠️ 语义漂移：句内 ${uniqM[0]} 月真值为「${tv.sign} 第${tv.house}宫」，但太阳引用写作「${ref.raw}」← ${s.trim().slice(0, 78)}`);
          }
        }
      }
    }
    if (touched) lines[li] = parts.join('');
  });

  return { out: lines.join('\n'), fixed, warned, log };
}

for (const file of process.argv.slice(2)) {
  const text = fs.readFileSync(file, 'utf8');
  const truth = buildTruth(text);
  const r = fixNonMonthSunRef(text, truth);
  console.log('\n' + '═'.repeat(84));
  console.log(`文件: ${file}  (${text.length} 字, 真值表 ${truth.size} 月)`);
  console.log('═'.repeat(84));
  r.log.forEach((x) => console.log('  ' + x));
  const r2 = fixNonMonthSunRef(r.out, truth);
  console.log(`\n  → 一级纠正 ${r.fixed} / 二级告警 ${r.warned}   幂等: ${r2.out === r.out ? '✅' : '❌'}   月标题: ${(r.out.match(/^#{1,6}\s*\d{4}年\d{1,2}月/gm) || []).length} 条`);
  if (r.fixed) {
    console.log('  ── 纠正后原文 ──');
    const orig = text.split('\n');
    r.out.split('\n').forEach((l, i) => {
      if (/流年太阳/.test(l) && !/^#{1,6}/.test(l) && orig[i] !== l) console.log(`   L${i + 1}: ${l.trim().slice(0, 150)}`);
    });
  }
}

if (process.argv[2]) {
  const truth = buildTruth(fs.readFileSync(process.argv[2], 'utf8'));
  console.log('\n' + '═'.repeat(84));
  console.log('合成护栏对照（真值表取自 ' + process.argv[2] + '）');
  console.log('═'.repeat(84));
  const CASES = [
    ['阳性·形态 I（月份居中，应改）', '流年太阳在5月进入双子座第六宫，这是最佳窗口。', '改'],
    ['阳性·形态 I 带年份（应改）', '流年太阳在2026年7月进入双子座第八宫，重点关注共享资源。', '改'],
    ['阳性·形态 II（月份前缀，应改）', '在2026年8月流年太阳在双子座第1宫，这是启动窗口。', '改'],
    ['阳性·形态 III（承前省略，应改）', '流年太阳在2026年7月进入双子座第11宫，2026年11月进入双子座第4宫。', '改'],
    ['阳性·混句（本命引用不动、流年引用应改）', '你的本命月亮在金牛座第6宫，流年太阳在2026年7月进入双子座第11宫。', '改'],
    ['阴性·军师原形态（不得动，但应告警）', '流年太阳在天秤座第11宫，2027年3月将激活你的田宅宫。', '告警'],
    ['阴性·已正确（零改动）', '流年太阳在7月进入巨蟹座第八宫，深化合作信任。', '不动'],
    ['阴性·本命句（豁免）', '你的本命太阳在天秤座第十一宫，这是社群宫位。', '不动'],
    ['阴性·归属其它行星（不得动）', '流年太阳在7月，流年木星在8月进入双子座第3宫。', '不动'],
    ['阳性·无锚点且值非法（应告警）', '流年太阳在双子座第八宫，你需要关注共享资源。', '告警'],
  ];
  let pass = 0;
  for (const [name, s, expect] of CASES) {
    const r = fixNonMonthSunRef(s + '\n', truth);
    const changed = r.out.trim() !== s;
    const got = r.warned ? '告警' : changed ? '改' : '不动';
    const okMark = got === expect ? '✅' : '❌';
    if (got === expect) pass++;
    console.log(`\n  ${okMark} ${name}  [期望 ${expect} / 实得 ${got}]`);
    console.log(`    IN : ${s}`);
    console.log(`    OUT: ${r.out.trim()}`);
  }
  console.log(`\n  合成对照: ${pass}/${CASES.length} 通过`);
}
