// V485 探针: natal_sun_linter 是否把「家居财富对齐」段的所有「第N宫」无差别改写为本命太阳宫位
import fs from 'node:fs';
import vm from 'node:vm';
import { closureDecls } from './extract_decls.mjs';

const src = fs.readFileSync(new URL('../../server.js', import.meta.url), 'utf-8');
// ⚠️ 必须显式带上模块级依赖, 否则沙箱内 getSignToHouseMap 未定义 → 内部 try/catch 吞掉 → 假阴性
const { source } = closureDecls(src, ['natal_sun_linter'], []);
// getSignToHouseMap / SIGN_ORDER_ZH 是 server.js 从 astro-truth.js import 的, 需手动注入
const truth = await import(new URL('../../astro-truth.js', import.meta.url).href);
const ctx = {
  console,
  getSignToHouseMap: truth.getSignToHouseMap,
  SIGN_ORDER_ZH: truth.SIGN_ORDER_ZH,
};
vm.createContext(ctx);
vm.runInContext(source + '\n__f = natal_sun_linter;', ctx);
const f = ctx.__f;

// 本盘(1997-10-18, 上升射手, 本命太阳天秤)：2宫=摩羯 4宫=双鱼 8宫=巨蟹, 本命太阳=第11宫
const INPUT = [
  '## 第五章：先知显化协议',
  '',
  '### 家居财富对齐',
  '',
  '* **卧室区域:第四宫(田宅宫)**',
  '你的第四宫落在双鱼座，这是一个关于"根基"的宫位。',
  '* **厨房区域:第二宫(财帛宫)与第八宫(共享资源)**',
  '你的第二宫落在摩羯座，第八宫落在巨蟹座。',
  '* **财务室区域:第八宫(共享资源)**',
  '你的第八宫落在巨蟹座，代表共享资源。',
  '',
  '### 办公室财富对齐',
  '',
  '**工位区域**：你的第十宫落在处女座，代表事业。',
  '',
  '### 每日高频咒语',
  '你的本命太阳在第9宫，请牢记。',
].join('\n');

const out = f(INPUT, '天秤座', '射手座');

console.log('=== 输入(家居段) ===');
console.log(INPUT);
console.log('\n=== 输出 ===');
console.log(out);

const seg = out.slice(out.indexOf('家居财富对齐'), out.indexOf('办公室财富对齐'));
const hits = [...seg.matchAll(/第([一二三四五六七八九十百零\d]+)宫/g)].map((m) => m[1]);
console.log('\n=== 判读 ===');
console.log('家居段宫位序列:', hits.join(' / '));
console.log('是否被改成 11 宫:', hits.includes('11') || hits.includes('十一') ? '❌ 是（缺陷复现）' : '✅ 否');
console.log('办公室段是否被改:', /第十宫/.test(out.slice(out.indexOf('办公室财富对齐'))) ? '✅ 未被动' : '❌ 被动');
process.exitCode = (hits.includes('11') || hits.includes('十一')) ? 1 : 0;
