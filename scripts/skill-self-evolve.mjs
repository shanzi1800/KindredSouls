#!/usr/bin/env node
/**
 * E81 skill-self-evolve —— 错题基因库引擎（自我进化与错题免疫 Skill）
 *
 * 三大能力（对应军令三件事）：
 *   1) Pre-Flight Recall（任务前强制检索）：
 *        node scripts/skill-self-evolve.mjs --recall bubble mirror i18n
 *      匹配 LESSONS_LEARNED.json 中 title/modules/trigger/ironRule/episodes 的关键词，
 *      输出「已激活的历史免疫铁律」清单，写进开工方案显式声明。
 *   2) Self-Check（记忆完整性自检）：
 *        node scripts/skill-self-evolve.mjs --self-check
 *      校验每条 lesson 四元组齐全、gate 文件存在、gateAnchor 逐字在位——没有牙齿的记忆直接报错。
 *   3) Reflexion 提示（复盘反思）：
 *        node scripts/skill-self-evolve.mjs --template
 *      打印四元组追加模板，主公指出瑕疵修复后照抄填写并同步长牙。
 *
 * 退出码：--self-check 有违规 ⇒ 1；--recall 永不阻塞（召回是提示不是门禁）。
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BANK = path.join(REPO, 'LESSONS_LEARNED.json');

const args = process.argv.slice(2);
const MODE = args.includes('--self-check') ? 'check'
  : args.includes('--template') ? 'template'
  : args.includes('--list') ? 'list'
  : 'recall';

function loadBank() {
  if (!existsSync(BANK)) throw new Error(`错题基因库不存在：${BANK}`);
  const bank = JSON.parse(readFileSync(BANK, 'utf8'));
  if (!Array.isArray(bank.lessons)) throw new Error('基因库缺 lessons 数组');
  return bank;
}

/* ---------- Self-Check：与 test/audit-e81-self-evolve.test.mjs 同一套判据（闸门为准） ---------- */
function selfCheck() {
  const bank = loadBank();
  const errs = [];
  const seen = new Set();
  for (const l of bank.lessons) {
    const tag = l.id || '(无 id)';
    if (!l.id || !/^L\d+$/.test(l.id)) errs.push(`${tag}: id 须为 L{n} 格式`);
    if (seen.has(l.id)) errs.push(`${tag}: id 重复`);
    seen.add(l.id);
    for (const f of ['title', 'trigger', 'rootCause', 'ironRule', 'gate', 'gateAnchor']) {
      if (typeof l[f] !== 'string' || !l[f].trim()) errs.push(`${tag}: 四元组/锚点字段 ${f} 缺失或为空`);
    }
    if (!Array.isArray(l.modules) || !l.modules.length) errs.push(`${tag}: modules 须为非空数组`);
    if (!Array.isArray(l.episodes) || !l.episodes.length) errs.push(`${tag}: episodes 须为非空数组（溯源 E 编号）`);
    if (l.gate) {
      const gatePath = path.join(REPO, l.gate);
      if (!existsSync(gatePath)) errs.push(`${tag}: gate 文件不存在 ${l.gate}`);
      else if (l.gateAnchor && !readFileSync(gatePath, 'utf8').includes(l.gateAnchor)) {
        errs.push(`${tag}: gateAnchor 未在 ${l.gate} 中逐字找到——记忆没长牙`);
      }
    }
  }
  const MIN = 14; // 库容下界：只增不减（防整库被清空）
  if (bank.lessons.length < MIN) errs.push(`库容 ${bank.lessons.length} < 下界 ${MIN}（基因只增不减）`);
  return { errs, count: bank.lessons.length };
}

/* ---------- Recall：关键词匹配召回 ---------- */
function recall(keywords) {
  const bank = loadBank();
  const kws = keywords.map((k) => k.toLowerCase()).filter(Boolean);
  if (!kws.length) {
    console.log('用法：--recall <关键词...>（如 --recall bubble mirror i18n oauth layout）\n');
    return [];
  }
  const hit = bank.lessons.filter((l) => {
    const hay = [l.id, l.title, ...(l.modules || []), l.trigger, l.rootCause, l.ironRule, ...(l.episodes || [])]
      .join('\n').toLowerCase();
    return kws.some((k) => hay.includes(k));
  });
  return hit;
}

function printLesson(l) {
  console.log(`\n▪ ${l.id} ${l.title}  [${(l.episodes || []).join('/')}]`);
  console.log(`  触发场景：${l.trigger}`);
  console.log(`  根因：${l.rootCause}`);
  console.log(`  🔒 免疫铁律：${l.ironRule}`);
  console.log(`  🦷 守护断言：${l.gate} :: "${l.gateAnchor}"`);
}

if (MODE === 'template') {
  console.log(`// 追加到 LESSONS_LEARNED.json 的 lessons[]（id 递增；gate 必须真实存在且 gateAnchor 逐字可查）
{
  "id": "L15",
  "title": "一句话病灶",
  "modules": ["模块标签"],
  "trigger": "何时会再踩这个坑",
  "rootCause": "当时到底为什么会错（实测证据）",
  "ironRule": "永久免疫铁律（可执行的约束，非感想）",
  "gate": "test/audit-xxx.test.mjs 或 scripts/skill-xxx.mjs",
  "gateAnchor": "该文件中逐字存在的锚点字符串",
  "episodes": ["E8x"],
  "date": "YYYY-MM-DD"
}
// 若历史无对应闸门 ⇒ 先在 test/audit-e81-self-evolve.test.mjs 长出新断言段，再回填 gateAnchor。
// 提交前自检：npm run skill:evolve:check`);
} else if (MODE === 'check') {
  const { errs, count } = selfCheck();
  if (errs.length) {
    console.error(`❌ 基因库自检 ${errs.length} 项违规（${count} 条）：`);
    for (const e of errs) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log(`✅ 错题基因库自检通过：${count} 条铁律，四元组齐全，全部长牙（gateAnchor 在位）`);
} else if (MODE === 'list') {
  const bank = loadBank();
  console.log(`📚 错题基因库（${bank.lessons.length} 条）：`);
  for (const l of bank.lessons) printLesson(l);
  console.log('');
} else {
  const kws = args.filter((a) => !a.startsWith('--'));
  const hit = recall(kws);
  console.log(`🧠 Pre-Flight Recall（关键词：${kws.join(' ')}）——命中 ${hit.length} 条历史免疫铁律：`);
  for (const l of hit) printLesson(l);
  if (hit.length) {
    console.log('\n⚠️ 开工方案必须显式声明已激活上述铁律（引用 L 编号），并在完成后复核对应闸门仍绿。');
  } else {
    console.log('（无命中——若本次改动涉及新领域，完工后主公指出的瑕疵须按 --template 提炼入库）');
  }
}
