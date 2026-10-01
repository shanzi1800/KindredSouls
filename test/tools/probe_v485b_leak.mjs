// V485b 探针: stripYearlyPromptLeakage 对真实泄漏产物的清理效果
import fs from 'node:fs';
import vm from 'node:vm';
import { closureDecls } from './extract_decls.mjs';

const src = fs.readFileSync(new URL('../../server.js', import.meta.url), 'utf-8');
const { source: code } = closureDecls(src, ['stripYearlyPromptLeakage'], []);
const ctx = { console, __exports: {} };
vm.createContext(ctx);
vm.runInContext(code + '\n__exports.f = stripYearlyPromptLeakage;', ctx);
const f = ctx.__exports.f;

const path = process.argv[2] || '/tmp/ks1997_v485_leak_sample.txt';
const text = fs.readFileSync(path, 'utf-8');
const count = (s, p) => (s.match(new RegExp(p, 'g')) || []).length;
const countM = (s, p) => (s.match(new RegExp(p, 'gm')) || []).length;

console.log(`样本: ${path} · ${text.length} 字`);
console.log(`泄漏短语(清理前): ${count(text, '风控切入角度')}`);

const out = f(text, 'zh', 'yearly');
console.log(`泄漏短语(清理后): ${count(out, '风控切入角度')}`);

let bad = 0;
const chk = (n, c, e = '') => { if (!c) bad++; console.log(`  ${c ? '✅' : '❌'} ${n}${e ? ' — ' + e : ''}`); };

chk('泄漏清零', count(out, '风控切入角度') === 0);
chk('月标题 12 条未破坏', countM(out, '^###\\s*\\d{4}年\\d{1,2}月') === 12, String(countM(out, '^###\\s*\\d{4}年\\d{1,2}月')));
chk('幂等', f(out, 'zh', 'yearly') === out);
chk('月报不处理', f(text, 'zh', 'monthly') === text);
chk('非 zh 不处理', f(text, 'es', 'yearly') === text);

// 抽样看修复后的句子是否通顺
const seg = text.slice(text.indexOf('断路器警告'), text.indexOf('断路器警告') + 260);
const segOut = f(seg, 'zh', 'yearly');
console.log('\n=== 清理前后抽样 ===');
console.log('原:', seg.replace(/\n/g, ' ').slice(0, 200));
console.log('新:', segOut.replace(/\n/g, ' ').slice(0, 200));
chk('删除处前后句仍完整(无孤立连接词/空标点)', !/，\s*。|。\s*。|：\s*。/u.test(segOut));

console.log('\n=== 结果:', bad ? `${bad} 项异常` : '全绿', '===');
process.exitCode = bad ? 1 : 0;
