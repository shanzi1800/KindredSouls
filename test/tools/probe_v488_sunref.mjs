// V488 立项调研探针：非月段「太阳」引用句的真值幻觉量化
// 用法: node test/tools/probe_v488_sunref.mjs <产物文件> [更多产物...]
//
// 真值口径：产物自身的 12 条月标题（`### YYYY年M月: 太阳<星座> 第N宫 · …`）。
//   月标题由 lockYearlyMonthTitles 按 months[i] 重写，是已锁定的真值权威；
//   且线上终验已确认 12/12 与 SwissEph 一致 ⇒ 可直接作为真值表。
//
// 分类：
//   NATAL-SKIP  句内出现「本命/出生」→ 属本命锁领域，不在 V488 范围
//   BAD/OK      流年太阳引用 + 句内月份唯一 → 可对真值判定
//   UNJUDGE     流年太阳引用但句内无唯一月份 → 无法定位真值（只能审计）
import fs from 'node:fs';

const SIGNS = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座',
  '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'];
const SIGN_ALT = SIGNS.map((x) => x.replace('座', '')).join('|');
const ZH_NUM = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10, '十一': 11, '十二': 12 };

const files = process.argv.slice(2);
if (!files.length) { console.error('用法: node probe_v488_sunref.mjs <产物文件...>'); process.exit(1); }

const grand = { bad: 0, ok: 0, unjudge: 0, natal: 0 };

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split('\n');

  // ── ① 真值表（月标题）────────────────────────────────────────
  const truth = new Map();               // (year*12+month) → {sign, house}
  const monthHeadLines = new Set();
  lines.forEach((l, i) => {
    const m = l.match(/^#{1,6}\s*(\d{4})年(\d{1,2})月[^\n]*?太阳\s*([\u4e00-\u9fa5]{2,3}座)\s*第\s*(\d+)\s*宫/);
    if (!m) return;
    const key = Number(m[1]) * 12 + Number(m[2]);
    if (!truth.has(key)) { truth.set(key, { sign: m[3], house: Number(m[4]) }); monthHeadLines.add(i); }
  });

  // 月段范围
  const headIdx = [...monthHeadLines].sort((a, b) => a - b);
  const inMonthSeg = new Set();
  headIdx.forEach((h, n) => {
    let end = n + 1 < headIdx.length ? headIdx[n + 1] : lines.length;
    for (let k = h; k < end; k++) { if (k > h && /^\s*##\s/.test(lines[k])) { end = k; break; } }
    for (let k = h; k < end; k++) inMonthSeg.add(k);
  });

  console.log('\n' + '═'.repeat(80));
  console.log(`文件: ${file}   (${text.length} 字)   真值表 ${truth.size} 个月`);
  console.log('═'.repeat(80));

  // ── ② 扫描 ───────────────────────────────────────────────────
  const rows = [];
  for (let i = 0; i < lines.length; i++) {
    if (monthHeadLines.has(i)) continue;
    for (const s of lines[i].split(/(?<=[。！？])/)) {
      if (!/太阳/.test(s)) continue;
      const refs = [...s.matchAll(new RegExp(`太阳[^，。；]{0,24}?(${SIGN_ALT})座(?:\\s*第\\s*([\\d一二三四五六七八九十]{1,3})\\s*宫)?`, 'g'))]
        .map((m) => ({ sign: m[1] + '座', house: m[2] ? (ZH_NUM[m[2]] ?? Number(m[2])) : null, full: !!m[2] }));
      if (!refs.length) continue;
      rows.push({
        li: i + 1,
        seg: inMonthSeg.has(i) ? '月段' : '非月段',
        natal: /本命|出生|原生|本盘/.test(s),
        lunian: /流年|行运|transit/i.test(s),
        months: [...new Set([...s.matchAll(/(?:\d{4})?年?\s*(\d{1,2})\s*月/g)].map((m) => Number(m[1])))],
        refs, s: s.trim(),
      });
    }
  }

  const nm = rows.filter((r) => r.seg === '非月段');
  console.log(`\n带太阳引用的句子：月段 ${rows.length - nm.length} / 非月段 ${nm.length}`);

  for (const r of nm) {
    let verdict, notes = [];
    if (r.natal && !r.lunian) {
      verdict = 'NATAL-SKIP';
      notes.push('本命句 → 属本命锁领域，V488 不动');
      grand.natal++;
    } else if (r.months.length === 1) {
      const cands = [...truth.entries()].filter(([k]) => ((k % 12) || 12) === r.months[0]);
      if (cands.length !== 1) { verdict = 'UNJUDGE'; notes.push(`⚠️ 月号 ${r.months[0]} 在真值表不唯一`); grand.unjudge++; }
      else {
        const tv = cands[0][1];
        const bads = r.refs.filter((x) => x.sign !== tv.sign || (x.full && x.house !== tv.house));
        if (bads.length) {
          verdict = 'BAD'; grand.bad++;
          bads.forEach((x) => notes.push(`❌「${x.full ? x.sign + ' 第' + x.house + '宫' : x.sign}」≠ ${r.months[0]}月真值「${x.full ? tv.sign + ' 第' + tv.house + '宫' : tv.sign}」`));
        } else { verdict = 'OK'; notes.push(`✅ 与 ${r.months[0]}月真值一致`); grand.ok++; }
      }
    } else {
      verdict = 'UNJUDGE'; grand.unjudge++;
      notes.push(`⚠️ 句内月份${r.months.length ? '不唯一(' + r.months.join('/') + ')' : '缺失'} ⇒ 无法定位真值（只能审计告警）`);
    }
    const flag = verdict === 'BAD' ? '❌' : verdict === 'OK' ? '✅' : '○';
    console.log(`\n  ${flag} [L${r.li}] ${verdict}${r.lunian ? ' 流年' : ''}${r.natal ? ' 本命' : ''}`);
    console.log(`     ${r.s.slice(0, 130)}`);
    notes.forEach((n) => console.log(`       ${n}`));
  }
}

console.log('\n' + '═'.repeat(80));
console.log(`跨文件汇总:  ❌错 ${grand.bad}  ✅对 ${grand.ok}  ○不可判 ${grand.unjudge}  (本命跳过 ${grand.natal})`);
const judged = grand.bad + grand.ok;
console.log(`可判样本 ${judged} 例 → 错误率 ${judged ? ((grand.bad / judged) * 100).toFixed(0) : '-'}%`);
console.log('═'.repeat(80));
