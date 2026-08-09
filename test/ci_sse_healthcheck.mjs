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
const TIMEOUT_MS = parseInt(process.env.CI_TIMEOUT_MS || '120000', 10);
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
let finalText = ''; // sanitized 终稿（优先用于断言）
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
  let lineBuf = '';
  res.on('data', (chunk) => {
    // SSE: 逐行 "data: {...}"，缓冲跨 chunk 的不完整行，确保 sanitized 终稿完整捕获
    lineBuf += chunk;
    const lines = lineBuf.split('\n');
    lineBuf = lines.pop() || ''; // 最后一段可能是不完整的行，留到下次
    for (const line of lines) {
      const t = line.trim();
      if (!t.startsWith('data:')) continue;
      const raw = t.slice(5).trim();
      if (raw === '[DONE]') continue;
      try {
        const p = JSON.parse(raw);
        // 真实字段: text (流式分片) / sanitized (终稿)
        if (typeof p.text === 'string') fullText += p.text;
        if (typeof p.sanitized === 'string') finalText = p.sanitized; // 终稿覆盖
      } catch {
        fullText += raw;
      }
    }
  });
  res.on('end', () => {
    clearTimeout(timer);
    // 处理残留缓冲行
    const tEnd = lineBuf.trim();
    if (tEnd.startsWith('data:')) {
      const raw = tEnd.slice(5).trim();
      if (raw !== '[DONE]') { try { const p = JSON.parse(raw); if (typeof p.sanitized === 'string') finalText = p.sanitized; else if (typeof p.text === 'string') fullText += p.text; } catch {} }
    }
    const checkText = finalText || fullText; // 优先 sanitized 终稿
    console.log('\n--- 接收片段 ---\n' + checkText.slice(0, 400) + '\n----------------');
    runAssertions(checkText);
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

  // 1. 主题头契约（确定性：662347c step7 在流式分片即把主题头翻成 lang）
  //    lang=en 必须出现英文主题头 ✦ [🔮 Monthly Destiny Theme] ✦
  const themeEn = '✦ [🔮 Monthly Destiny Theme] ✦';
  if (LANG === 'en') {
    if (!text.includes(themeEn)) errors.push('缺少英文主题头 ✦ [🔮 Monthly Destiny Theme] ✦（662347c 未生效或 LLM 未生成）');
  } else if (!text.includes('✦ [🔮')) {
    errors.push('缺少 ✦ 装饰符主题头（前端金色居中契约被破坏）');
  }

  // 2. 陷阱头若存在则必须本地化 + 带动态月份（LLM 未生成陷阱头属格式方差，不强制）
  if (text.includes('✦ [⚠️')) {
    if (!text.includes(EXPECTED_MONTH_LABEL)) {
      errors.push(`陷阱头存在但动态月份缺失：期望 "${EXPECTED_MONTH_LABEL}"`);
    }
    if (LANG === 'en' && /消费陷阱/.test(text)) {
      errors.push('陷阱头存在但为中文（未本地化）');
    }
  }

  // 3. 语言泄漏断言（lang=en 时禁止中文占位符/标题）
  if (LANG === 'en' && /本月命运主题|消费陷阱|系统生成中|请刷新重试/.test(text)) {
    errors.push('lang=en 检测到中文穿帮');
  }

  // 4. 防单词斩首回归断言：检测斩首特征签名——注入标记(✦/【占位符/System-Injected)出现在 Re 与 charging 之间
  //    完整词 Wealth Recharging 不会出现注入标记，故不误判；被斩首则 Re+注入+charging 命中
  if (/Wealth Re[\s\S]{0,60}?(✦|【占位符|System-Injected)[\s\S]{0,60}?charging/i.test(text)) {
    errors.push('检测到单词斩首 (Wealth Re + 注入标记 + charging)');
  }

  if (errors.length > 0) {
    console.error(`\n❌ [FAIL] 健康检查失败，${errors.length} 项断言错误:`);
    errors.forEach((err, idx) => console.error(` ${idx + 1}. ${err}`));
    process.exit(1);
  }
  console.log('\n✅ [PASS] 全部 SSE 流式与 Pipeline 断言通过!');
  process.exit(0);
}
