// test/ci_sse_healthcheck.mjs
// CI/CD 自动化流水线 - 财富月报 SSE 流式接口健康检查（零三方依赖，原生 ESM）
// 运行: node test/ci_sse_healthcheck.mjs
//
// 环境变量:
//   CI_API_URL      默认 https://kindredsouls-production.up.railway.app/api/wealth-oracle/stream
//   CI_AUTH_TOKEN   默认空（生产当前无需鉴权）
//   CI_TIMEOUT_MS   默认 60000
//   CI_LANG         默认 en
//   CI_YEAR/CI_MONTH 期望月份（默认当前年月），用于动态月份断言（杜绝硬编码 August 2026）
//
// 退出码: 全部断言通过 -> 0；任一失败 -> 1（阻断 Pipeline）

import http from 'node:http';
import https from 'node:https';

const API_URL = process.env.CI_API_URL || 'https://kindredsouls-production.up.railway.app/api/wealth-oracle/stream';
const AUTH_TOKEN = process.env.CI_AUTH_TOKEN || '';
const TIMEOUT_MS = parseInt(process.env.CI_TIMEOUT_MS || '60000', 10);
const LANG = process.env.CI_LANG || 'en';
const YEAR = parseInt(process.env.CI_YEAR || new Date().getFullYear(), 10);
const MONTH = parseInt(process.env.CI_MONTH || (new Date().getMonth() + 1), 10);

// 内联月份标签（对齐 server.js getMonthLabel），动态月份断言——不硬编码 August 2026
const MONTH_NAMES = {
  zh: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
  es: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
  fr: ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'],
  th: ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'],
  vi: ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12']
};
function monthLabel(lang, year, month) {
  const names = MONTH_NAMES[lang] || MONTH_NAMES.zh;
  const name = names[month - 1];
  return lang === 'zh' ? `${year}年${name}` : `${name} ${year}`;
}
const EXPECTED_MONTH_LABEL = monthLabel(LANG, YEAR, MONTH);

console.log(`[CI Healthcheck] SSE: ${API_URL}`);
console.log(`[CI Healthcheck] lang=${LANG} | 期望动态月份标签="${EXPECTED_MONTH_LABEL}"`);

const url = new URL(API_URL);
const client = url.protocol === 'https:' ? https : http;
let fullText = '';
const timer = setTimeout(() => {
  console.error(`\n❌ [FAIL] 健康检查超时 ${TIMEOUT_MS}ms`);
  process.exit(1);
}, TIMEOUT_MS);

const req = client.request({
  hostname: url.hostname,
  port: url.port || (url.protocol === 'https:' ? 443 : 80),
  path: url.pathname + url.search,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...(AUTH_TOKEN ? { 'Authorization': `Bearer ${AUTH_TOKEN}` } : {}),
    'Accept': 'text/event-stream'
  }
}, (res) => {
  if (res.statusCode !== 200) {
    console.error(`❌ [FAIL] 意外 HTTP 状态码: ${res.statusCode}`);
    clearTimeout(timer);
    process.exit(1);
  }
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    // SSE: 逐行 "data: {...}"
    const lines = chunk.split('\n');
    for (const line of lines) {
      const t = line.trim();
      if (!t.startsWith('data:')) continue;
      const raw = t.slice(5).trim();
      if (raw === '[DONE]') continue;
      try {
        const p = JSON.parse(raw);
        // 真实字段: text (流式分片) / sanitized (终稿)；兼容旧 content
        fullText += (p.text || p.sanitized || p.content || '');
      } catch {
        fullText += raw;
      }
    }
  });
  res.on('end', () => {
    clearTimeout(timer);
    console.log('\n--- 接收片段 ---\n' + fullText.slice(0, 400) + '\n----------------');
    runAssertions(fullText);
  });
});
req.on('error', (e) => {
  clearTimeout(timer);
  console.error(`❌ [FAIL] 请求错误: ${e.message}`);
  process.exit(1);
});

// 默认请求体：北极圈边界 case（曾暴露 Placidus 破裂 + 标题穿帮），做冒烟
req.write(JSON.stringify({
  birthDate: '1996-12-21', birthTime: '00:00',
  lat: 69.6492, lon: 18.9553, tz: 'Europe/Oslo',
  lang: LANG, reportType: 'monthly'
}));
req.end();

function runAssertions(text) {
  const errors = [];

  // 1. ✦ 装饰符标题契约（前端 SacredYearlyReportBox.tsx 金色居中依赖）
  if (!text.includes('✦ [🔮') || !text.includes('✦ [⚠️')) {
    errors.push('缺少 "✦" 装饰符标题（前端金色居中契约被破坏）');
  }

  // 2. 动态月份断言（不硬编码 August 2026，按请求月份推导）
  if (!text.includes(EXPECTED_MONTH_LABEL)) {
    errors.push(`动态月份缺失：期望 "${EXPECTED_MONTH_LABEL}" 未出现在陷阱头`);
  }

  // 3. 语言泄漏断言（lang=en 时禁止中文占位符/标题）
  if (LANG === 'en' && /本月命运主题|消费陷阱|系统生成中|请刷新重试/.test(text)) {
    errors.push('lang=en 检测到中文穿帮');
  }

  // 4. 防单词斩首回归断言
  if (/Wealth Re[\s\S]*?charging/.test(text)) {
    errors.push('检测到单词斩首 (Wealth Re...charging)');
  }

  if (errors.length > 0) {
    console.error(`\n❌ [FAIL] 健康检查失败，${errors.length} 项断言错误:`);
    errors.forEach((err, idx) => console.error(` ${idx + 1}. ${err}`));
    process.exit(1);
  }
  console.log('\n✅ [PASS] 全部 SSE 流式与 Pipeline 断言通过!');
  process.exit(0);
}
