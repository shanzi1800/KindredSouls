// 方案 A 工程化版：自动从 server.js 抽取 YEARLY_SYSTEM 模板块，在干净沙盒里 eval，精确定位 "is not a function"
const fs = require('fs');
const path = '/Users/apple/Desktop/KindredSouls源代码/server.js';
const src = fs.readFileSync(path, 'utf8');

// 提取 YEARLY_SYSTEM 定义块（从 const YEARLY_SYSTEM = { 到缩进2空格的 };）
const m = src.match(/const YEARLY_SYSTEM = \{[\s\S]*?\n  \};/);
if (!m) { console.error('未找到 YEARLY_SYSTEM 定义'); process.exit(1); }
const rawBlock = m[0];
console.log('[提取] YEARLY_SYSTEM 块首行:', rawBlock.split('\n')[0]);
console.log('[提取] YEARLY_SYSTEM 块末行:', rawBlock.split('\n').slice(-1)[0]);
console.log('[提取] 块总行数:', rawBlock.split('\n').length);

// const X = {...};  →  return {...};
const block = rawBlock.replace(/^const YEARLY_SYSTEM\s*=\s*/, 'return ');

// Stub 所有被 ${} 引用的变量（覆盖模板内全部插值）
const birthDate = '1990-06-15';
const instruction = 'test';
const lang = 'zh';
const curMonthName = '7月';
const currentYear = '2026';
const monthNamesZH = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
const perMonthData = 'test_data';
const houseLock = 'test_lock';
const natalSunSign = 'Gemini';
const natalSunSignEN = 'Gemini';

console.log('\n=== 开始单独评估 YEARLY_SYSTEM 模板（沙盒）===');
try {
  const fn = new Function(
    'birthDate','instruction','lang','curMonthName','currentYear','monthNamesZH','perMonthData','houseLock','natalSunSign','natalSunSignEN',
    block
  );
  const YEARLY_SYSTEM = fn(birthDate,instruction,lang,curMonthName,currentYear,monthNamesZH,perMonthData,houseLock,natalSunSign,natalSunSignEN);
  console.log('🔥 恭喜！模板静态求值成功，未发生熔断！');
  console.log('keys:', Object.keys(YEARLY_SYSTEM));
} catch (e) {
  console.error('❌ 抓到狐狸尾巴了！堆栈定位：');
  console.error(e.stack);
}
