#!/usr/bin/env node
/**
 * probe_v486_style.mjs — 军师二轮评审（文风/句式/幼态）的量化取证
 * 用法: node test/tools/probe_v486_style.mjs /tmp/ks1997_v485c_final.txt
 *
 * 只读、不改文件。输出四组证据：
 *   A. 全文完全重复的长句（>=12 字）Top 清单 —— 机读「模版拼贴」的铁证
 *   B. 12 个月「月度财富概览」起手句式归一化后归类
 *   C. 排比结构「以X之Y，」出现位置与次数
 *   D. 幼态/显化类词频
 *   E. 第五章标签-正文错配（军师 P1 断层的精确判据）
 */
import fs from 'node:fs';

const file = process.argv[2] || '/tmp/ks1997_v485c_final.txt';
const text = fs.readFileSync(file, 'utf8');
const lines = text.split('\n');

const out = [];
const P = (s) => out.push(s);

// ── A. 完全重复长句 ─────────────────────────────────────────────
const sentSplit = text.split(/(?<=[。！？])/);
const seen = new Map();
for (const raw of sentSplit) {
  const s = raw.replace(/^[\s>*-]+/, '').replace(/\s+/g, '').trim();
  if (s.length < 12) continue;
  if (/^\*{0,2}[🌐🟢🔴💡🚀🌟⚠️🔮]/.test(s)) continue;    // 跳过含 emoji 标签的整行
  seen.set(s, (seen.get(s) || 0) + 1);
}
const dups = [...seen.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]);
P(`A. 完全重复长句(>=12字)：${dups.length} 条不同类型`);
for (const [s, n] of dups.slice(0, 12)) P(`   ×${n}  ${s.slice(0, 52)}${s.length > 52 ? '…' : ''}`);

// ── B. 12 个月概览起手句式 ──────────────────────────────────────
const monthBlocks = [];
for (let i = 0; i < lines.length; i++) {
  if (/^### \d{4}年\d{1,2}月[:：]/.test(lines[i])) {
    const body = [];
    for (let j = i + 1; j < lines.length && !/^### /.test(lines[j]) && !/^## /.test(lines[j]); j++) {
      if (lines[j].trim()) body.push(lines[j].trim());
    }
    monthBlocks.push({ title: lines[i], body });
  }
}
P(`\nB. 月度矩阵段落数：${monthBlocks.length}`);
const openPat = new Map();
for (const m of monthBlocks) {
  const ov = m.body.find((l) => l.includes('月度财富概览'));
  if (!ov) continue;
  const after = ov.replace(/^.*?月度财富概览\]\*{0,2}[:：]\s*/, '');
  const first = (after.split(/(?<=[。！？])/)[0] || '').replace(/\s+/g, '');
  // 归一化：把星座/宫位/月份换成占位符，暴露模板骨架
  const skel = first
    .replace(/[\u4e00-\u9fa5]{1,3}(座)/g, '{SIGN}')
    .replace(/第[\d一二三四五六七八九十]+宫/g, '{HOUSE}')
    .replace(/\d+/g, '{N}');
  openPat.set(skel, (openPat.get(skel) || 0) + 1);
}
P(`   概览首句归一化骨架（去重后 ${openPat.size} 类）：`);
for (const [k, n] of [...openPat.entries()].sort((a, b) => b[1] - a[1])) P(`   ×${n}  ${k.slice(0, 70)}`);

// 窗口段/黑天鹅段 首句骨架（更长的模板）
for (const tag of ['财富高峰窗口', '财务黑天鹅日']) {
  const pat = new Map();
  for (const m of monthBlocks) {
    const l = m.body.find((x) => x.includes(tag));
    if (!l) continue;
    const after = l.replace(/^.*?\]\*{0,2}[:：]\s*/, '').replace(/^\*\*[^*]*\*\*\s*/, '');
    const skeleton = after.replace(/\d+/g, '{N}').replace(/[\u4e00-\u9fa5]{1,3}座/g, '{SIGN}').replace(/\s+/g, '').slice(0, 40);
    pat.set(skeleton, (pat.get(skeleton) || 0) + 1);
  }
  P(`   ${tag} 首句骨架：${pat.size} 类 / ${monthBlocks.length} 月`);
}

// ── C. 排比「以X之Y，」 ────────────────────────────────────────
P(`\nC. 排比「以…之…」结构：`);
const par = [];
for (let i = 0; i < lines.length; i++) {
  const hits = lines[i].match(/以[^，。"]{1,6}之[^，。"]{1,6}[，、]/g);
  if (hits) par.push({ line: i + 1, hits });
}
const parTotal = par.reduce((a, b) => a + b.hits.length, 0);
P(`   共 ${parTotal} 处，分布 ${par.length} 行：`);
for (const p of par) P(`   L${p.line}: ${p.hits.join(' | ')}`);

// ── D. 幼态/显化词频 ───────────────────────────────────────────
P(`\nD. 显化/幼态类词频：`);
for (const w of ['咒语', '祭坛', '魔法', '蜡烛', '羊皮纸', '水晶', '显化', '祈愿', '仪式']) {
  const n = (text.match(new RegExp(w, 'g')) || []).length;
  P(`   ${w}\t${n}`);
}

// ── E. 第五章标签-正文错配（断层精确判据）──────────────────────
P(`\nE. 第五章标签-正文错配审检：`);
const LABELS = [
  { re: /卧室区域[:：]?第四宫\(田宅宫\)/, topic: /卧室/ },
  { re: /厨房区域[:：]?第二宫\(财帛宫\)与第八宫\(共享资源\)/, topic: /厨房/ },
  { re: /财务室区域[:：]?第八宫\(共享资源\)/, topic: /财务室|保险柜/ },
];
let mismatch = 0;
lines.forEach((l, i) => {
  for (const L of LABELS) {
    if (!L.re.test(l)) continue;
    const tail = l.replace(L.re, '').replace(/^\*{0,2}[:：]\s*/, '').slice(0, 30);
    if (!L.topic.test(tail)) { mismatch++; P(`   ⚠️ L${i + 1} 标签与紧随正文错配: ${l.slice(0, 60)}`); }
  }
});
P(`   错配数 = ${mismatch}`);
const legacy = (text.match(/卧室区域:第四宫\(田宅宫\)[:：][^\n]{0,40}?厨房/g) || []).length;
P(`   军师原报「卧室标签后紧跟厨房」形态 = ${legacy} 次`);

console.log(out.join('\n'));
